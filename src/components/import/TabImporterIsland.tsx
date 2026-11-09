import React, { useState, useEffect, useMemo } from 'react';
import { Download, Bookmark, Sparkles, Check, ArrowRight, Archive } from 'lucide-react';
import type { SongMetadata, UserTab } from '../../lib/types';
import { parseSongText } from '../../lib/parser/songParser';
import { saveUserTab, getUserTabBySlug } from '../../lib/storage/tabStorage';
import { generateMarkdownWithFrontmatter, downloadMarkdownFile } from '../../lib/storage/exportMd';
import { MetadataForm } from './MetadataForm';
import { BackupRestoreModal } from './BackupRestoreModal';
import { TabRenderer } from '../player/TabRenderer';
import { SAMPLE_TAB, getSampleMetadata } from './sampleTab';

export const TabImporterIsland: React.FC = () => {
  const [rawText, setRawText] = useState(SAMPLE_TAB);
  const [metadata, setMetadata] = useState<SongMetadata>(getSampleMetadata);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  useEffect(() => {
    const editSlug = new URLSearchParams(window.location.search).get('edit');
    if (editSlug) {
      const found = getUserTabBySlug(editSlug);
      if (found) {
        setRawText(found.content);
        setMetadata({
          title: found.title, artist: found.artist, instrument: found.instrument,
          tuning: found.tuning, capo: found.capo, bpm: found.bpm, difficulty: found.difficulty,
          strummingPattern: found.strummingPattern, tags: found.tags,
          isFingerstyle: found.isFingerstyle, key: found.key, createdAt: found.createdAt
        });
      }
    }
  }, []);

  const slug = useMemo(() => {
    return (
      metadata.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'untitled-song'
    );
  }, [metadata.title]);

  const ast = useMemo(() => parseSongText(rawText), [rawText]);

  const handleSaveToBrowser = () => {
    if (!metadata.title.trim() || !metadata.artist.trim()) {
      alert('Please fill in Song Title and Artist before saving.');
      return;
    }
    const userTab: UserTab = {
      ...metadata,
      id: `custom-${slug}-${Date.now()}`,
      slug,
      content: rawText,
      isCustom: true
    };
    saveUserTab(userTab);
    setSavedSlug(slug);
  };

  const handleDownloadMd = () => {
    const mdContent = generateMarkdownWithFrontmatter(metadata, rawText);
    downloadMarkdownFile(`${slug}.md`, mdContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso [text-wrap:balance]">Quick Paste Studio</h1>
          <p className="text-xs sm:text-sm text-walnut">
            Paste raw text from Ultimate Guitar. Chords and ASCII staves are parsed instantly.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setIsBackupModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-canvas border border-warm hover:border-amber-600 text-xs font-medium text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 transition-colors"
            title="Backup or export all tabs in browser localStorage as JSON or ZIP"
          >
            <Archive className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>Backup / Export</span>
            <span className="hidden sm:inline">(JSON/ZIP)</span>
          </button>
          <button
            onClick={() => { setRawText(SAMPLE_TAB); setMetadata(getSampleMetadata()); }}
            type="button"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-canvas border border-warm hover:border-terracotta text-xs font-medium text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-terracotta" aria-hidden="true" />
            <span className="hidden sm:inline">Load Demo</span>
          </button>
        </div>
      </div>

      <MetadataForm metadata={metadata} onChange={(p) => setMetadata((prev) => ({ ...prev, ...p }))} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-walnut px-1">
            <label htmlFor="raw-tab-input">Raw Ultimate Guitar Text</label>
            <span>{rawText.split('\n').length} lines</span>
          </div>
          <textarea
            id="raw-tab-input"
            name="rawTabContent"
            autoComplete="off"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            aria-label="Raw Ultimate Guitar tablature and chord text input"
            placeholder="Paste your raw chords and tabs here…"
            className="w-full h-[450px] p-4 rounded-2xl bg-canvas border border-warm font-mono text-xs sm:text-sm text-espresso focus:outline-none focus:border-terracotta focus-visible:ring-2 focus-visible:ring-terracotta/40 resize-none leading-5 scrollbar-thin"
            spellCheck="false"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-walnut px-1">
            <span>Live Sanctuary Preview</span>
            <span className="text-terracotta font-semibold">{ast.uniqueChords.length} chords detected</span>
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="Parsed sanctuary tab live preview"
            className="w-full h-[450px] p-4 rounded-2xl bg-surface border border-warm overflow-y-auto scrollbar-thin focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <TabRenderer lines={ast.lines} semitones={0} fontSize="base" columnMode="single" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-warm">
        <div className="text-xs text-walnut" role="status" aria-live="polite">
          {savedSlug ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
              <Check className="w-4 h-4" aria-hidden="true" />
              Song saved to browser library!
            </span>
          ) : (
            <span>Ready to save. Stored locally in browser or exported to Git.</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {savedSlug && (
            <a
              href={`/player?slug=${encodeURIComponent(savedSlug)}`}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-canvas border border-terracotta text-terracotta text-xs font-semibold hover:bg-terracotta hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta transition-colors col-span-2 sm:col-span-1"
            >
              <span>Play Now</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-canvas border border-warm hover:border-amber-600 text-espresso text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 transition-colors shadow-xs"
            title="Export or backup all tabs saved in localStorage"
          >
            <Archive className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Backup Tabs</span>
          </button>
          <button
            onClick={handleSaveToBrowser}
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 transition-opacity shadow-xs"
          >
            <Bookmark className="w-4 h-4" aria-hidden="true" />
            Save to Library
          </button>
          <button
            onClick={handleDownloadMd}
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-canvas border border-warm hover:border-terracotta text-espresso text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 transition-colors shadow-xs"
            title="Download .md for src/content/tabs/"
            aria-label="Download markdown file for Git repository"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>.md File</span>
          </button>
        </div>
      </div>

      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};
