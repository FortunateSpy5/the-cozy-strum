"""
Ultimate Guitar Chord Fetcher & Comparison Engine for The Cozy Strum.
Extracts top-rated community chords, capos, and progressions to benchmark and power the chord generator.
"""

from __future__ import annotations
import json
import re
import urllib.parse
import urllib.request
from typing import TypedDict, Optional

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
SEARCH_URL = "https://www.ultimate-guitar.com/search.php"

class UGChordData(TypedDict):
    title: str
    artist: str
    rating: float
    votes: int
    capo: int
    chords_used: list[str]
    verse_progression: list[str]
    raw_content: str

def clean_ug_content(raw: str) -> str:
    """Removes [ch], [tab] tags and normalizes entities."""
    cleaned = re.sub(r"\[/?(ch|tab)\]", "", raw)
    return cleaned.replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").strip()

def extract_recurring_progression(chords: list[str], max_len: int = 4) -> list[str]:
    """Extracts the most frequent recurring 3 or 4 chord loop from a list of chords."""
    if not chords:
        return []
    if len(chords) <= max_len:
        return chords[:max_len]

    # Look for repeating 3 or 4 chord n-grams
    best_pattern: list[str] = []
    max_count = 0

    for n in (4, 3, 2):
        counts: dict[tuple[str, ...], int] = {}
        for i in range(len(chords) - n + 1):
            gram = tuple(chords[i : i + n])
            counts[gram] = counts.get(gram, 0) + 1
        if counts:
            top_gram, count = max(counts.items(), key=lambda item: item[1])
            if count > max_count and count >= 2:
                max_count = count
                best_pattern = list(top_gram)
                break

    return best_pattern if best_pattern else chords[:max_len]

def fetch_ug_chords(song_name: str, artist_name: str, timeout: int = 8) -> Optional[UGChordData]:
    """Queries Ultimate Guitar for the #1 top-rated chord sheet and extracts chords & progression."""
    query = f"{song_name} {artist_name}".strip()
    params = urllib.parse.urlencode({"search_type": "title", "value": query})
    url = f"{SEARCH_URL}?{params}"
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        m = re.search(r'class="js-store"\s+data-content="([^"]+)"', html)
        if not m:
            return None

        raw_json = m.group(1).replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        data = json.loads(raw_json)
        results = data.get("store", {}).get("page", {}).get("data", {}).get("results", [])

        chord_entries = [r for r in results if r.get("type") == "Chords" and r.get("tab_url")]
        if not chord_entries:
            return None

        # Sort by highest rating / vote count
        chord_entries.sort(key=lambda r: float(r.get("rating", 0) or 0) * (int(r.get("votes", 0) or 0) ** 0.5), reverse=True)
        best = chord_entries[0]

        tab_req = urllib.request.Request(best["tab_url"], headers=headers)
        with urllib.request.urlopen(tab_req, timeout=timeout) as tab_resp:
            tab_html = tab_resp.read().decode("utf-8", errors="ignore")

        tm = re.search(r'class="js-store"\s+data-content="([^"]+)"', tab_html)
        if not tm:
            return None

        t_data = json.loads(tm.group(1).replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"))
        tab_view = t_data.get("store", {}).get("page", {}).get("data", {}).get("tab_view", {})
        wiki = tab_view.get("wiki_tab", {})
        meta = tab_view.get("meta", {})
        content = wiki.get("content", "")

        raw_chords = re.findall(r"\[ch\]([^\[]+)\[/ch\]", content)
        unique_chords: list[str] = []
        for c in raw_chords:
            c_clean = c.strip()
            if c_clean and c_clean not in unique_chords:
                unique_chords.append(c_clean)

        progression = extract_recurring_progression(raw_chords)
        capo = int(meta.get("capo", 0) or 0)

        return {
            "title": best.get("song_name", song_name),
            "artist": best.get("artist_name", artist_name),
            "rating": round(float(best.get("rating", 0) or 0), 2),
            "votes": int(best.get("votes", 0) or 0),
            "capo": capo,
            "chords_used": unique_chords,
            "verse_progression": progression,
            "raw_content": content,
        }
    except Exception:
        return None

def compute_harmonic_overlap(list_a: list[str], list_b: list[str]) -> float:
    """Computes harmonic similarity between two chord sets (0.0 to 1.0)."""
    if not list_a or not list_b:
        return 0.0
    set_a = {re.sub(r"(maj|min|m|7|sus\d|add\d|dim).*", "", c) for c in list_a}
    set_b = {re.sub(r"(maj|min|m|7|sus\d|add\d|dim).*", "", c) for c in list_b}
    intersection = set_a & set_b
    union = set_a | set_b
    return round(len(intersection) / len(union), 2) if union else 0.0
