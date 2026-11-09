"""
Tab Stave Injector & Resolver for The Cozy Strum.
Injects procedural fingerstyle patterns or fetched ASCII riffs into formatted song tabs.
"""

from __future__ import annotations
from typing import Optional
try:
    from .tab_synthesizer import synthesize_tab_block
    from .tab_fetcher import fetch_public_ascii_tab
except ImportError:
    from tab_synthesizer import synthesize_tab_block  # type: ignore
    from tab_fetcher import fetch_public_ascii_tab  # type: ignore

def inject_tab_block(tab_text: str, tab_block: str, section_label: str = "Intro Tab") -> str:
    """Inserts an ASCII tab block right after the metadata header block."""
    if not tab_block:
        return tab_text
    parts = tab_text.split("\n\n", 1)
    formatted_block = f"[{section_label}]\n{tab_block}"
    if len(parts) == 2:
        return f"{parts[0]}\n\n{formatted_block}\n\n{parts[1]}"
    return f"{tab_text}\n\n{formatted_block}"

def resolve_ascii_tab(
    title: str,
    artist: str,
    chords: list[str],
    instrument: str = "guitar",
    fingerstyle: Optional[str] = None,
    fetch_tab: bool = False,
    section: str = "intro",
) -> tuple[Optional[str], str]:
    """Resolves whether to synthesize a fingerstyle pattern or fetch a public ASCII tab."""
    if fingerstyle:
        active_chords = chords if chords else ["C", "G", "Am", "F"]
        pattern = "arpeggio" if fingerstyle == "arpeggio" else "travis"
        stave = synthesize_tab_block(active_chords, instrument=instrument, pattern=pattern)
        label = f"Fingerpicking Pattern ({pattern.title()})"
        return (stave, label)

    if fetch_tab:
        stave = fetch_public_ascii_tab(title, artist, section=section)
        label = f"{section.title()} Tab"
        return (stave, label)

    return (None, "")
