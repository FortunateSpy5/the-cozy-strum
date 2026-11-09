import type { SongMetadata } from '../types';

export function generateMarkdownWithFrontmatter(meta: SongMetadata, bodyContent: string): string {
  const tagsFormatted = meta.tags.map((t) => `  - "${t.replace(/"/g, '\\"')}"`).join('\n');
  const tagsSection = meta.tags.length > 0 ? `\ntags:\n${tagsFormatted}` : '\ntags: []';

  return `---
title: "${meta.title.replace(/"/g, '\\"')}"
artist: "${meta.artist.replace(/"/g, '\\"')}"
instrument: "${meta.instrument}"
tuning: "${meta.tuning.replace(/"/g, '\\"')}"
capo: ${meta.capo}
${meta.bpm ? `bpm: ${meta.bpm}\n` : ''}difficulty: "${meta.difficulty}"
${meta.strummingPattern ? `strummingPattern: "${meta.strummingPattern.replace(/"/g, '\\"')}"\n` : ''}${meta.key ? `key: "${meta.key}"\n` : ''}isFingerstyle: ${meta.isFingerstyle}
createdAt: "${meta.createdAt}"${tagsSection}
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
  URL.revokeObjectURL(url);
}
