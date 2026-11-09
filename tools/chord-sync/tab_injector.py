"""
Tab Stave Injector & Resolver for The Cozy Strum.
Injects procedural fingerstyle ASCII tab blocks into formatted song sheets.
"""

from __future__ import annotations
from typing import Optional
try:
    from .tab_synthesizer import synthesize_tab_block
except ImportError:
    from tab_synthesizer import synthesize_tab_block  # type: ignore

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
    chords: list[str],
    instrument: str = "guitar",
    fingerstyle: Optional[str] = None,
) -> tuple[Optional[str], str]:
    """Synthesizes a procedural fingerstyle tab pattern for the given chords."""
    if fingerstyle:
        active_chords = chords if chords else ["C", "G", "Am", "F"]
        pattern = "arpeggio" if fingerstyle == "arpeggio" else "travis"
        stave = synthesize_tab_block(active_chords, instrument=instrument, pattern=pattern)
        label = f"Fingerpicking Pattern ({pattern.title()})"
        return (stave, label)
    return (None, "")
