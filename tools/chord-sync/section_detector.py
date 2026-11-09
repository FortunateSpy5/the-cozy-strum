"""
Intelligent Section Detector for The Cozy Strum.
Analyzes lyric repetition frequency and structural transitions to detect
[Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], and [Outro].
"""

from __future__ import annotations
import re
from typing import TypedDict
try:
    from .lrc_fetcher import LyricLine
except ImportError:
    from lrc_fetcher import LyricLine  # type: ignore

class SectionTaggedLine(TypedDict):
    section: str
    is_section_start: bool
    line: LyricLine

def clean_lyric_text(raw_text: str) -> str:
    """Removes stray musical glyphs, brackets, and extra spaces."""
    cleaned = re.sub(r"[♫♪♩\(\)\[\]]", "", raw_text)
    return cleaned.strip()

def detect_song_sections(lyrics: list[LyricLine]) -> list[SectionTaggedLine]:
    """Detects song section headers by analyzing recurring multi-line choruses and verses."""
    valid_lines: list[LyricLine] = []
    for l in lyrics:
        txt = clean_lyric_text(l["text"])
        if txt and not re.match(r"^[\s\-—]+$", txt):
            valid_lines.append({
                "start_time": l["start_time"],
                "end_time": l["end_time"],
                "text": txt,
            })

    if not valid_lines:
        return []

    # 1. Compute line frequency to detect chorus refrains
    freq: dict[str, int] = {}
    for item in valid_lines:
        norm = re.sub(r"[^\w\s]", "", item["text"].lower()).strip()
        if len(norm) > 4:
            freq[norm] = freq.get(norm, 0) + 1

    repeated_norms = {norm for norm, count in freq.items() if count >= 2}

    # 2. Identify chorus clusters (consecutive repeated lines or high-frequency lines)
    is_chorus_cluster = [False] * len(valid_lines)
    for i, item in enumerate(valid_lines):
        norm = re.sub(r"[^\w\s]", "", item["text"].lower()).strip()
        if norm in repeated_norms:
            has_prev = i > 0 and re.sub(r"[^\w\s]", "", valid_lines[i - 1]["text"].lower()).strip() in repeated_norms
            has_next = i + 1 < len(valid_lines) and re.sub(r"[^\w\s]", "", valid_lines[i + 1]["text"].lower()).strip() in repeated_norms
            if has_prev or has_next or freq.get(norm, 0) >= 3:
                is_chorus_cluster[i] = True

    # 3. Label sections sequentially
    tagged: list[SectionTaggedLine] = []
    current_sec = ""
    verse_num = 0
    had_chorus = False

    for idx, item in enumerate(valid_lines):
        norm = re.sub(r"[^\w\s]", "", item["text"].lower()).strip()
        sec_name = ""

        if is_chorus_cluster[idx]:
            sec_name = "Chorus"
            had_chorus = True
        else:
            # Check for bridge after chorus
            is_late_song = idx > len(valid_lines) * 0.6
            is_bridge_candidate = is_late_song and had_chorus and freq.get(norm, 0) == 1
            if is_bridge_candidate and norm.startswith(("i just", "now dont", "and all the", "oh ", "it slips")):
                sec_name = "Bridge"
            elif current_sec.startswith("Verse"):
                sec_name = current_sec
            else:
                verse_num += 1
                sec_name = f"Verse {verse_num}"

        is_start = sec_name != current_sec
        current_sec = sec_name

        tagged.append({
            "section": sec_name,
            "is_section_start": is_start,
            "line": item,
        })

    return tagged
