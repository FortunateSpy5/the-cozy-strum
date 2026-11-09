"""
LRCLIB Synced Lyrics Fetcher and LRC Parser for The Cozy Strum.
Fetches time-synced lyrics (.lrc) from the public open-source LRCLIB API with smart title normalization.
"""

from __future__ import annotations
import json
import re
import urllib.parse
import urllib.request
from typing import TypedDict, Optional

LRCLIB_API_URL = "https://lrclib.net/api"
USER_AGENT = "TheCozyStrum-ChordSync/1.0 (https://github.com/FortunateSpy5/the-cozy-strum)"

class LyricLine(TypedDict):
    start_time: float
    end_time: float
    text: str

def parse_lrc_timestamp(stamp: str) -> float:
    """Converts a standard LRC timestamp string [mm:ss.xx] or [mm:ss] into seconds."""
    parts = stamp.strip("[]").split(":")
    if len(parts) == 2:
        return round(float(parts[0]) * 60.0 + float(parts[1]), 3)
    return 0.0

def parse_lrc_content(lrc_text: str, default_line_duration: float = 3.5) -> list[LyricLine]:
    """Parses raw LRC text into a list of structured timestamped LyricLine dictionaries."""
    raw_entries: list[tuple[float, str]] = []
    timestamp_pattern = re.compile(r"\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]")
    meta_pattern = re.compile(r"^\[(ar|al|ti|by|length|offset|re|ve):.*\]", re.IGNORECASE)

    for raw_line in lrc_text.splitlines():
        line = raw_line.strip()
        if not line or meta_pattern.match(line):
            continue
        timestamps = timestamp_pattern.findall(line)
        if not timestamps:
            continue
        text_only = timestamp_pattern.sub("", line).strip()
        clean_text = re.sub(r"[♫♪♩]", "", text_only).strip()
        for ts_str in timestamps:
            raw_entries.append((parse_lrc_timestamp(ts_str), clean_text))

    raw_entries.sort(key=lambda item: item[0])
    parsed_lines: list[LyricLine] = []
    for idx, (start_time, text) in enumerate(raw_entries):
        if idx + 1 < len(raw_entries):
            next_start = raw_entries[idx + 1][0]
            end_time = min(next_start, start_time + 8.0)
            if end_time <= start_time:
                end_time = start_time + default_line_duration
        else:
            end_time = start_time + default_line_duration

        parsed_lines.append({"start_time": start_time, "end_time": end_time, "text": text})
    return parsed_lines

def normalize_title(title: str) -> str:
    """Cleans subtitle parentheticals, edition tags, and soundtrack suffixes."""
    # Extract transliterated title if bilingual (e.g. Bengali script with English in parens)
    m = re.search(r"\(([^)]+)\)", title)
    if m and re.search(r"[a-zA-Z]", m.group(1)) and re.search(r"[^\x00-\x7F]", title):
        title = m.group(1)
    cleaned = re.sub(r"\s*[\(\[\{].*?[\)\]\}]", "", title)
    cleaned = re.sub(r"\s*-\s*.*", "", cleaned)
    return cleaned.strip()

def normalize_artist(artist: str) -> str:
    """Strips featured artist credits and secondary film artist splits."""
    cleaned = re.sub(r"\s*(?:ft\.|feat\.|featuring|with)\s+.*", "", artist, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*/\s*.*", "", cleaned)
    return cleaned.strip()

def _query_endpoint(url: str) -> Optional[str]:
    headers = {"User-Agent": USER_AGENT}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, dict):
                return data.get("syncedLyrics") or data.get("plainLyrics")
            if isinstance(data, list) and len(data) > 0:
                for entry in data:
                    if entry.get("syncedLyrics"):
                        return entry.get("syncedLyrics")
                return data[0].get("plainLyrics")
    except Exception:
        pass
    return None

def fetch_lrclib_synced_lyrics(
    title: str,
    artist: str,
    album: Optional[str] = None,
    duration: Optional[int] = None,
) -> Optional[list[LyricLine]]:
    """Multi-stage query to LRCLIB: exact match -> normalized -> fuzzy search."""
    norm_t = normalize_title(title)
    norm_a = normalize_artist(artist)

    # 1. Exact track & artist
    params: dict[str, str] = {"track_name": title.strip(), "artist_name": artist.strip()}
    if album:
        params["album_name"] = album.strip()
    if duration:
        params["duration"] = str(duration)

    lrc_str = _query_endpoint(f"{LRCLIB_API_URL}/get?{urllib.parse.urlencode(params)}")

    # 2. Normalized track & artist
    if not lrc_str and (norm_t != title or norm_a != artist):
        norm_params = {"track_name": norm_t, "artist_name": norm_a}
        lrc_str = _query_endpoint(f"{LRCLIB_API_URL}/get?{urllib.parse.urlencode(norm_params)}")

    # 3. Fuzzy search with track + artist
    if not lrc_str:
        q_str = f"{norm_t} {norm_a}".strip()
        lrc_str = _query_endpoint(f"{LRCLIB_API_URL}/search?{urllib.parse.urlencode({'q': q_str})}")

    # 4. Search with track title alone
    if not lrc_str and norm_t:
        lrc_str = _query_endpoint(f"{LRCLIB_API_URL}/search?{urllib.parse.urlencode({'track_name': norm_t})}")

    return parse_lrc_content(lrc_str) if lrc_str else None
