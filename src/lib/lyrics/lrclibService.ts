export interface LrclibTrack {
  id: number;
  name: string;
  trackName?: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export async function searchLrclib(title: string, artist = '', signal?: AbortSignal): Promise<LrclibTrack[]> {
  const cleanTitle = title.trim();
  const cleanArtist = artist.trim();

  if (!cleanTitle) return [];

  const params = new URLSearchParams();
  params.set('track_name', cleanTitle);
  if (cleanArtist) {
    params.set('artist_name', cleanArtist);
  }

  try {
    const fetchSignal = signal ?? (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(8000) : undefined);
    const res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
      signal: fetchSignal,
    });

    if (!res.ok) {
      console.warn(`[LRCLIB] API responded with status ${res.status}`);
      return [];
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];

    const validTracks = data.filter((item): item is LrclibTrack => Boolean(item && typeof item === 'object'));

    // Prioritize results that actually have lyrics
    return validTracks.sort((a, b) => {
      const aHas = Boolean(a.plainLyrics);
      const bHas = Boolean(b.plainLyrics);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return 0;
    });
  } catch (err) {
    console.warn('[LRCLIB] Network or parsing error:', err);
    return [];
  }
}

/**
 * Transforms plain lyrics into a ready-to-chord sheet by inserting
 * blank chord placement lines above each lyric line.
 */
export function formatLyricsForChords(plainLyrics: string): string {
  if (!plainLyrics.trim()) return '';

  const rawLines = plainLyrics.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const result: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] ?? '';
    const trimmed = line.trim();

    // Preserve bracketed section markers like [Verse 1], [Chorus]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      result.push(trimmed);
      continue;
    }

    if (!trimmed) {
      // Empty line / stanza separator
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('');
      }
      continue;
    }

    // Insert a blank line above the lyric for chord placement
    result.push('');
    result.push(line);
  }

  return result.join('\n').trim();
}
