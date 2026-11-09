import type { SongMetadata } from '../types';

function escapeYamlString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

export function generateMarkdownWithFrontmatter(meta: Partial<SongMetadata>, bodyContent: string): string {
  const title = escapeYamlString(meta.title ?? 'Untitled');
  const artist = escapeYamlString(meta.artist ?? 'Unknown Artist');
  const instrument = meta.instrument === 'ukulele' ? 'ukulele' : 'guitar';
  const tuning = escapeYamlString(meta.tuning ?? 'Standard (E A D G B e)');
  const capo = typeof meta.capo === 'number' && Number.isFinite(meta.capo) ? meta.capo : 0;
  const difficulty = meta.difficulty ?? 'intermediate';
  const isFingerstyle = Boolean(meta.isFingerstyle);
  const createdAt = meta.createdAt ? escapeYamlString(meta.createdAt) : new Date().toISOString();

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const tagsFormatted = tags.map((t) => `  - "${escapeYamlString(String(t))}"`).join('\n');
  const tagsSection = tags.length > 0 ? `\ntags:\n${tagsFormatted}` : '\ntags: []';

  return `---
title: "${title}"
artist: "${artist}"
instrument: "${instrument}"
tuning: "${tuning}"
capo: ${capo}
${meta.bpm ? `bpm: ${meta.bpm}\n` : ''}difficulty: "${difficulty}"
${meta.strummingPattern ? `strummingPattern: "${escapeYamlString(meta.strummingPattern)}"\n` : ''}${meta.key ? `key: "${escapeYamlString(meta.key)}"\n` : ''}isFingerstyle: ${isFingerstyle}
createdAt: "${createdAt}"${tagsSection}
---

${bodyContent.trim()}
`;
}

export function downloadMarkdownFile(filename: string, content: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.md') ? filename : `${filename}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
