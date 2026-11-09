"""
Deterministic Proportional Chord-over-Lyrics Aligner for The Cozy Strum.
Maps timestamped audio chords across millisecond-synced lyrics with collision avoidance.
"""

from __future__ import annotations
import math
from typing import TypedDict

try:
    from .lrc_fetcher import LyricLine
    from .chord_extractor_wrapper import TimestampedChord
except ImportError:
    from lrc_fetcher import LyricLine  # type: ignore
    from chord_extractor_wrapper import TimestampedChord  # type: ignore

class AlignedPair(TypedDict):
    chord_line: str
    lyric_line: str

def snap_to_word_boundary(text: str, target_col: int, max_snap_distance: int = 2) -> int:
    """Snaps target column to nearest word boundary if within max_snap_distance."""
    if target_col <= 0 or target_col >= len(text):
        return target_col

    # Look backward for space
    for dist in range(1, max_snap_distance + 1):
        idx = target_col - dist
        if idx >= 0 and text[idx] == " ":
            return idx + 1

    # Look forward for space
    for dist in range(1, max_snap_distance + 1):
        idx = target_col + dist
        if idx < len(text) and text[idx - 1] == " ":
            return idx

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

        ratio = max(0.0, min(0.95, (c_time - line_start) / duration))
        raw_col = int(math.floor(ratio * text_len))
        target_col = snap_to_word_boundary(lyric_text, raw_col)

        # Collision avoidance: ensure at least one space after previous chord
        placed_col = max(target_col, current_col)

        if placed_col > len(line_buffer):
            line_buffer.extend([" "] * (placed_col - len(line_buffer)))

        line_buffer.extend(list(c_name))
        current_col = len(line_buffer) + 1

    return "".join(line_buffer).rstrip()

def align_chords_with_lyrics(
    lyrics: list[LyricLine],
    chords: list[TimestampedChord],
    instrumental_gap_threshold: float = 6.0,
) -> list[str]:
    """Aligns all timestamped chords with synced lyrics and returns clean tab lines."""
    output_lines: list[str] = []
    prev_end = 0.0

    for idx, line in enumerate(lyrics):
        start = line["start_time"]
        end = line["end_time"]
        text = line["text"]

        # Insert section or instrumental gap marker if pause exceeds threshold
        if idx > 0 and (start - prev_end) >= instrumental_gap_threshold:
            output_lines.append("")
            output_lines.append("[Instrumental]")
            # Collect any chords playing during this instrumental gap
            gap_chords = [c for c in chords if prev_end <= c["timestamp"] < start]
            if gap_chords:
                gap_str = "   ".join(c["chord"] for c in gap_chords)
                output_lines.append(gap_str)
            output_lines.append("")

        # Chords belonging to this lyric line
        # Accept chords slightly before the line starts (within 0.3s) for pick-up strums
        line_chords = [
            c for c in chords
            if (start - 0.3) <= c["timestamp"] < end
        ]

        chord_line = build_chord_line_for_lyrics(text, start, end, line_chords)

        if chord_line:
            output_lines.append(chord_line)
        output_lines.append(text)

        prev_end = end

    return output_lines

def format_cozy_strum_tab(
    title: str,
    artist: str,
    lyrics: list[LyricLine],
    chords: list[TimestampedChord],
    capo: int = 0,
    instrument: str = "guitar",
    tuning: str = "Standard (E A D G B E)",
) -> str:
    """Formats full song with standard Cozy Strum headers and aligned lyrics."""
    aligned_lines = align_chords_with_lyrics(lyrics, chords)

    # Detect unique chords used
    unique_chords = sorted(list({c["chord"] for c in chords if c["chord"]}))
    chords_str = ", ".join(unique_chords) if unique_chords else "None detected"

    headers = [
        f"{title} - {artist}",
        f"Capo: {capo}",
        f"Instrument: {instrument}",
        f"Tuning: {tuning}",
        f"Chords: {chords_str}",
        "",
        "[Verse 1]",
    ]

    return "\n".join(headers + aligned_lines)
