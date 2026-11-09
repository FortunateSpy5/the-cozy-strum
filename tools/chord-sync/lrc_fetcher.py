"""
LRCLIB Synced Lyrics Fetcher and LRC Parser for The Cozy Strum.
Fetches time-synced lyrics (.lrc) from the public open-source LRCLIB API.
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
        minutes = float(parts[0])
        seconds = float(parts[1])
        return round(minutes * 60.0 + seconds, 3)
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
        # Clean musical symbols
        clean_text = re.sub(r"[♫♪♩]", "", text_only).strip()

        for ts_str in timestamps:
            seconds = parse_lrc_timestamp(ts_str)
            raw_entries.append((seconds, clean_text))

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

        parsed_lines.append({
            "start_time": start_time,
            "end_time": end_time,
            "text": text,
        })

    return parsed_lines

def fetch_lrclib_synced_lyrics(
    title: str,
    artist: str,
    album: Optional[str] = None,
    duration: Optional[int] = None,
) -> Optional[list[LyricLine]]:
    """Queries LRCLIB /api/get or /api/search and returns parsed timestamped lines."""
    params: dict[str, str] = {
        "track_name": title.strip(),
        "artist_name": artist.strip(),
    }
    if album:
        params["album_name"] = album.strip()
    if duration:
        params["duration"] = str(duration)

    query_str = urllib.parse.urlencode(params)
    url = f"{LRCLIB_API_URL}/get?{query_str}"

    headers = {"User-Agent": USER_AGENT}
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            synced = data.get("syncedLyrics")
            if synced:
                return parse_lrc_content(synced)
    except Exception:
        pass

    search_url = f"{LRCLIB_API_URL}/search?{query_str}"
    search_req = urllib.request.Request(search_url, headers=headers)
    try:
        with urllib.request.urlopen(search_req, timeout=10) as resp:
            results = json.loads(resp.read().decode("utf-8"))
            if isinstance(results, list) and len(results) > 0:
                for entry in results:
                    synced = entry.get("syncedLyrics")
                    if synced:
                        return parse_lrc_content(synced)
    except Exception:
        pass

    return None
