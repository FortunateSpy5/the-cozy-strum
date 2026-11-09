import React, { useState, useEffect, useRef } from 'react';
import { X, FileJson, Archive, Upload, Check, AlertCircle } from 'lucide-react';
import { getUserTabs } from '../../lib/storage/tabStorage';
import { exportAllTabsAsJson, exportAllTabsAsZip, restoreTabsFromJson } from '../../lib/storage/backupRestore';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTabsChanged?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onTabsChanged
}) => {
  const [tabCount, setTabCount] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTabCount(getUserTabs().length);
      setFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const res = exportAllTabsAsJson();
    setFeedback({
      type: 'success',
      message: `Exported ${res.count} tab${res.count === 1 ? '' : 's'} as JSON (${res.filename}).`
    });
  };

  const handleExportZip = () => {
    const res = exportAllTabsAsZip();
    setFeedback({
      type: 'success',
      message: `Exported ${res.count} tab${res.count === 1 ? '' : 's'} as ZIP archive (${res.filename}).`
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreTabsFromJson(content);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Restored ${res.count} tab${res.count === 1 ? '' : 's'} to your browser library!`
        });
        setTabCount(getUserTabs().length);
        onTabsChanged?.();
      } else {
        setFeedback({
          type: 'error',
          message: `Restore failed: ${res.error ?? 'Invalid backup file'}`
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md p-6 rounded-3xl bg-surface border border-warm shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-warm/60 pb-3">
          <div>
            <h2 id="backup-modal-title" className="font-serif text-lg sm:text-xl font-bold text-espresso">
              Backup & Export Browser Tabs
            </h2>
            <p className="text-xs text-walnut mt-0.5">
              {tabCount} custom tab{tabCount === 1 ? '' : 's'} stored in browser localStorage.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-canvas text-walnut hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-xs font-semibold text-espresso uppercase tracking-wider">
            Export Options
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleExportJson}
              type="button"
              className="flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-xs font-semibold text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors shadow-xs"
              title="Export lightweight JSON backup"
            >
              <FileJson className="w-4 h-4 text-terracotta" aria-hidden="true" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={handleExportZip}
              type="button"
              className="flex items-center justify-center gap-2 p-3 min-h-[44px] rounded-xl bg-canvas border border-warm hover:border-terracotta text-xs font-semibold text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors shadow-xs"
              title="Export all tabs as Git markdown files and backup in a ZIP"
            >
              <Archive className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>Download ZIP</span>
            </button>
          </div>
        </div>

        <div className="border-t border-warm/60 pt-4 space-y-2">
          <div className="text-xs font-semibold text-espresso uppercase tracking-wider">
            Restore from Backup
          </div>
          <p className="text-[11px] text-walnut">
            Restore tabs from a previously saved Cozy Strum JSON backup file.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
            id="restore-backup-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="w-full flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-xl bg-canvas border border-dashed border-warm hover:border-terracotta text-xs font-semibold text-walnut hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
          >
            <Upload className="w-4 h-4 text-terracotta" aria-hidden="true" />
            <span>Select .json Backup File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
