import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { ShieldCheck, Inbox, FileText, Database, Loader2, RefreshCw } from 'lucide-react';
import { subscribeToAuth } from '../../lib/firebase/auth';
import type { UserProfile, CloudTab, DmcaRequest } from '../../lib/firebase/types';
import { getPendingSubmissions, approveSubmission, rejectSubmission } from '../../lib/firebase/adminService';
import { getDmcaRequests, resolveDmcaRequest } from '../../lib/firebase/dmcaService';
import { AdminAuthGate } from './AdminAuthGate';
import { SubmissionsQueue } from './SubmissionsQueue';
import { DmcaClaimsQueue } from './DmcaClaimsQueue';
import { CatalogManagerPanel } from './CatalogManagerPanel';

type AdminTab = 'submissions' | 'dmca' | 'catalog';

export function AdminDashboardIsland(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<AdminTab>('submissions');
  const [pendingTabs, setPendingTabs] = useState<CloudTab[]>([]);
  const [dmcaClaims, setDmcaClaims] = useState<DmcaRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    return subscribeToAuth((currentUser, currentProfile, loading) => {
      setUser(currentUser);
      setProfile(currentProfile);
      setAuthLoading(loading);
    });
  }, []);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [submissions, claims] = await Promise.all([
        getPendingSubmissions(),
        getDmcaRequests(),
      ]);
      setPendingTabs(submissions);
      setDmcaClaims(claims);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
    }
  }, [profile, loadData]);

  const handleApprove = async (tab: CloudTab) => {
    await approveSubmission(tab);
    setPendingTabs((prev) => prev.filter((t) => t.id !== tab.id));
  };

  const handleReject = async (tabId: string, reason?: string) => {
    await rejectSubmission(tabId, reason);
    setPendingTabs((prev) => prev.filter((t) => t.id !== tabId));
  };

  const handleResolveDmca = async (
    requestId: string,
    tabId: string,
    resolution: 'approved_removed' | 'dismissed',
    notes?: string
  ) => {
    if (!user) return;
    await resolveDmcaRequest(user, requestId, tabId, resolution, notes);
    setDmcaClaims((prev) =>
      prev.map((c) => (c.id === requestId ? { ...c, status: resolution } : c))
    );
  };

  if (authLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" aria-hidden="true" />
        <p className="text-xs font-mono text-walnut">Verifying admin credentials…</p>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <AdminAuthGate isAuthenticated={Boolean(user)} />;
  }

  const openDmcaCount = dmcaClaims.filter((c) => c.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warm pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-terracotta" aria-hidden="true" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">Sanctuary Moderation Console</h1>
          </div>
          <p className="text-xs sm:text-sm text-walnut mt-0.5">
            Admin curator portal: approve community tabs, handle DMCA takedowns, and manage the catalog.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoadingData}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-canvas border border-warm text-xs font-semibold text-espresso hover:border-terracotta transition-colors inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="flex gap-2 border-b border-warm/80 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('submissions')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'submissions'
              ? 'bg-terracotta text-white shadow-xs'
              : 'text-walnut hover:text-espresso hover:bg-canvas'
          }`}
        >
          <Inbox className="w-4 h-4" aria-hidden="true" />
          <span>Submissions</span>
          {pendingTabs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white text-terracotta font-black">
              {pendingTabs.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dmca')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'dmca'
              ? 'bg-terracotta text-white shadow-xs'
              : 'text-walnut hover:text-espresso hover:bg-canvas'
          }`}
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span>DMCA Claims</span>
          {openDmcaCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white font-black">
              {openDmcaCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-terracotta text-white shadow-xs'
              : 'text-walnut hover:text-espresso hover:bg-canvas'
          }`}
        >
          <Database className="w-4 h-4" aria-hidden="true" />
          <span>Catalog & Tools</span>
        </button>
      </div>

      {activeTab === 'submissions' && (
        <SubmissionsQueue
          pendingTabs={pendingTabs}
          isLoading={isLoadingData}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {activeTab === 'dmca' && (
        <DmcaClaimsQueue
          claims={dmcaClaims}
          isLoading={isLoadingData}
          onResolve={handleResolveDmca}
        />
      )}

      {activeTab === 'catalog' && <CatalogManagerPanel />}
    </div>
  );
}
