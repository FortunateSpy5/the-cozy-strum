import React, { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { Sparkles, Send, Loader2, AlertCircle } from 'lucide-react';
import { subscribeToAuth } from '../../lib/firebase/auth';
import { submitTab, type TabSubmissionInput } from '../../lib/firebase/submitService';
import type { TabStatus } from '../../lib/firebase/types';
import { parseSongText } from '../../lib/parser/songParser';
import { TabRenderer } from '../player/TabRenderer';
import { SubmissionMetadataFields } from './SubmissionMetadataFields';
import { LrclibSearchModal } from './LrclibSearchModal';
import { SubmissionAuthGuard } from './SubmissionAuthGuard';
import { SubmissionSuccessView } from './SubmissionSuccessView';

type MetadataInput = Omit<TabSubmissionInput, 'content'>;

const INITIAL_METADATA: MetadataInput = {
  title: '',
  artist: '',
  album: '',
  releaseYear: undefined,
  categories: ['Acoustic'],
  instrument: 'guitar',
  tuning: 'Standard (E A D G B E)',
  capo: 0,
  difficulty: 'Beginner',
  isFingerstyle: false,
  visibility: 'public',
};

const INITIAL_CONTENT = `[Verse 1]\n\nWise men say only fools rush in\n\nBut I can't help falling in love with you`;

export function SongSubmissionIsland(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [metadata, setMetadata] = useState<MetadataInput>(INITIAL_METADATA);
  const [content, setContent] = useState<string>(INITIAL_CONTENT);
  const [isLrclibOpen, setIsLrclibOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTab, setSubmittedTab] = useState<{ id: string; status: TabStatus } | null>(null);

  useEffect(() => {
    return subscribeToAuth((currentUser, _profile, loading) => {
      setUser(currentUser);
      setAuthLoading(loading);
    });
  }, []);

  const deferredContent = useDeferredValue(content);
  const ast = useMemo(() => parseSongText(deferredContent), [deferredContent]);

  const handleMetadataChange = useCallback((updates: Partial<TabSubmissionInput>) => {
    setMetadata((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in before submitting a tab.');
      return;
    }
    if (!metadata.title.trim() || !metadata.artist.trim()) {
      setErrorMessage('Please enter both Song Title and Artist.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitTab(user, { ...metadata, content });
      setSubmittedTab({ id: res.id, status: res.status });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyLrclib = (formattedLyrics: string, lrclibId: number) => {
    setContent(formattedLyrics);
    setMetadata((prev) => ({ ...prev, lrclibId }));
  };

  if (authLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-terracotta animate-spin" aria-hidden="true" />
        <p className="text-xs font-mono text-walnut">Loading sanctuary studio…</p>
      </div>
    );
  }

  if (!user) return <SubmissionAuthGuard />;

  if (submittedTab) {
    return (
      <SubmissionSuccessView
        tabId={submittedTab.id}
        status={submittedTab.status}
        onReset={() => {
          setSubmittedTab(null);
          setMetadata(INITIAL_METADATA);
          setContent(INITIAL_CONTENT);
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">Community Submission Studio</h1>
          <p className="text-xs sm:text-sm text-walnut">
            Share guitar or ukulele chords with the community or save private practice sheets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsLrclibOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>Auto-Fetch Lyrics (LRCLIB)</span>
        </button>
      </div>

      {errorMessage && (
        <div role="alert" aria-live="assertive" className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <SubmissionMetadataFields input={{ ...metadata, content }} onChange={handleMetadataChange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-walnut px-1">
            <label htmlFor="tab-content">Tab & Lyrics Editor</label>
            <span>{ast.lines.length} lines</span>
          </div>
          <textarea
            id="tab-content"
            name="content"
            required
            rows={18}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type or paste chords over lyrics here..."
            className="w-full h-[450px] p-4 rounded-2xl bg-canvas border border-warm font-mono text-xs sm:text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta resize-none leading-5 scrollbar-thin"
            spellCheck="false"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-walnut px-1">
            <span>Live Sanctuary Preview</span>
            <span className="text-terracotta font-semibold">{ast.uniqueChords.length} chords</span>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="Live parsed tab preview"
            className="w-full h-[450px] p-4 rounded-2xl bg-surface border border-warm overflow-y-auto scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <TabRenderer lines={ast.lines} semitones={0} fontSize="base" columnMode="single" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-warm">
        <p className="text-xs text-walnut">
          {metadata.visibility === 'public'
            ? 'Public submissions will be reviewed by sanctuary curators before publishing.'
            : 'Private tabs are visible only to your signed-in account.'}
        </p>
        <button
          type="submit"
          disabled={isSubmitting || !metadata.title.trim() || !metadata.artist.trim()}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-terracotta text-white font-semibold text-xs sm:text-sm hover:bg-terracotta/90 inline-flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-4 h-4" aria-hidden="true" />}
          <span>{metadata.visibility === 'public' ? 'Submit to Community' : 'Save to Private Vault'}</span>
        </button>
      </div>

      <LrclibSearchModal
        isOpen={isLrclibOpen}
        initialTitle={metadata.title}
        initialArtist={metadata.artist}
        onClose={() => setIsLrclibOpen(false)}
        onSelectLyrics={handleApplyLrclib}
      />
    </form>
  );
}
