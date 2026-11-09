"""
Deterministic Proportional Chord-over-Lyrics Aligner for The Cozy Strum.
Maps timestamped audio chords and progressions across millisecond-synced lyrics.
"""

from __future__ import annotations
import math
from typing import Optional
try:
    from .lrc_fetcher import LyricLine
    from .chord_extractor_wrapper import TimestampedChord
    from .section_detector import detect_song_sections
except ImportError:
    from lrc_fetcher import LyricLine  # type: ignore
    from chord_extractor_wrapper import TimestampedChord  # type: ignore
    from section_detector import detect_song_sections  # type: ignore

def snap_to_word_start(text: str, target_col: int, max_snap_dist: int = 4) -> int:
    """Snaps target column to the start of the nearest word."""
    if target_col <= 0 or target_col >= len(text):
        return max(0, min(target_col, len(text)))
    if text[target_col] != " ":
        idx = target_col
        while idx > 0 and text[idx - 1] != " ":
            idx -= 1
        return idx if (target_col - idx) <= max_snap_dist else target_col
    for dist in range(1, 3):
        forward = target_col + dist
        if forward < len(text) and text[forward] != " ":
            return forward
    return target_col

def build_chord_line_for_lyrics(
    lyric_text: str,
    line_start: float,
    line_end: float,
    chords: list[TimestampedChord],
) -> str:
    """Constructs a spaced chord line aligned proportionally with the lyric line."""
    if not chords:
        return ""

    duration = max(0.1, line_end - line_start)
    text_len = max(len(lyric_text), 1)
    line_buffer: list[str] = []
    current_col = 0

    for item in chords:
        c_time = item["timestamp"]
        c_name = item["chord"]

        ratio = max(0.0, min(0.92, (c_time - line_start) / duration))
        raw_col = int(math.floor(ratio * text_len))
        target_col = snap_to_word_start(lyric_text, raw_col)

        placed_col = max(target_col, current_col)
        if placed_col > len(line_buffer):
            line_buffer.extend([" "] * (placed_col - len(line_buffer)))

        line_buffer.extend(list(c_name))
        current_col = len(line_buffer) + 1

    return "".join(line_buffer).rstrip()

def build_progression_line_for_lyrics(lyric_text: str, progression_chords: list[str]) -> str:
    """Evenly distributes a chord progression across the words of a lyric line."""
    if not progression_chords or not lyric_text.strip():
        return ""

    line_buffer: list[str] = []
    current_col = 0
    num_chords = len(progression_chords)

    for i, chord in enumerate(progression_chords):
        ratio = (i / num_chords) * 0.85
        raw_col = int(math.floor(ratio * len(lyric_text)))
        target_col = snap_to_word_start(lyric_text, raw_col)

        placed_col = max(target_col, current_col)
        if placed_col > len(line_buffer):
            line_buffer.extend([" "] * (placed_col - len(line_buffer)))

        line_buffer.extend(list(chord))
        current_col = len(line_buffer) + 1

    return "".join(line_buffer).rstrip()

def align_chords_with_lyrics(
    lyrics: list[LyricLine],
    chords: list[TimestampedChord],
    progression: Optional[list[str]] = None,
    chorus_progression: Optional[list[str]] = None,
) -> list[str]:
    """Aligns audio chords or progressions with section-tagged lyrics."""
    tagged = detect_song_sections(lyrics)
    if not tagged:
        return []

    output_lines: list[str] = []
    first_start = tagged[0]["line"]["start_time"]

    # 1. Intro header & chords if instrumental intro exists (>= 4.0 seconds)
    if first_start >= 4.0:
        output_lines.append("[Intro]")
        intro_chords = [c for c in chords if c["timestamp"] < first_start]
        if intro_chords:
            output_lines.append("   ".join(c["chord"] for c in intro_chords))
        elif progression:
            output_lines.append("   ".join(progression))
        output_lines.append("")

    # 2. Iterate section-tagged lines
    prog_cycle_idx = 0
    for item in tagged:
        sec_name = item["section"]
        is_start = item["is_section_start"]
        line = item["line"]
        text = line["text"]
        start = line["start_time"]
        end = line["end_time"]

        if is_start:
            if output_lines and output_lines[-1] != "":
                output_lines.append("")
            output_lines.append(f"[{sec_name}]")
            prog_cycle_idx = 0

        # Build chord line
        chord_line = ""
        line_chords = [c for c in chords if (start - 0.25) <= c["timestamp"] < end]

        if line_chords:
            chord_line = build_chord_line_for_lyrics(text, start, end, line_chords)
        elif progression:
            active_prog = (chorus_progression if sec_name == "Chorus" and chorus_progression else progression)
            dur = end - start
            take = 2 if len(active_prog) == 4 else (3 if len(active_prog) > 4 and dur >= 4.5 else min(2, len(active_prog)) if len(active_prog) > 4 else len(active_prog))
            batch = [active_prog[(prog_cycle_idx + i) % len(active_prog)] for i in range(take)]
            prog_cycle_idx += take
            chord_line = build_progression_line_for_lyrics(text, batch)

        if chord_line:
            output_lines.append(chord_line)
        output_lines.append(text)

    return output_lines

def format_cozy_strum_tab(
    title: str,
    artist: str,
    lyrics: list[LyricLine],
    chords: list[TimestampedChord],
    progression: Optional[list[str]] = None,
    chorus_progression: Optional[list[str]] = None,
    capo: int = 0,
    instrument: str = "guitar",
    tuning: Optional[str] = None,
) -> str:
    """Formats full song with standard Cozy Strum headers and aligned lyrics."""
    aligned_lines = align_chords_with_lyrics(lyrics, chords, progression, chorus_progression)
    default_tuning = "Standard Ukulele (G C E A)" if instrument == "ukulele" else "Standard (E A D G B E)"
    actual_tuning = tuning or default_tuning

    used = {c["chord"] for c in chords if c["chord"]} | set(progression or []) | set(chorus_progression or [])
    unique_chords = sorted(list(used))
    chords_str = ", ".join(unique_chords) if unique_chords else "None detected"

    headers = [
        f"{title} - {artist}",
        f"Capo: {capo}",
        f"Instrument: {instrument}",
        f"Tuning: {actual_tuning}",
        f"Chords: {chords_str}",
        "",
    ]

    return "\n".join(headers + aligned_lines)
