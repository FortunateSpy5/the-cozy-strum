"""
Procedural ASCII Tablature Synthesizer for The Cozy Strum.
Generates authentic guitar and ukulele fingerstyle ASCII tab blocks from chord progressions.
"""

from __future__ import annotations
from typing import Literal

GuitarFrets = tuple[int, int, int, int, int, int]  # E A D G B e (-1 = muted)
UkeFrets = tuple[int, int, int, int]  # G C E A (-1 = muted)

GUITAR_CHORD_FRETS: dict[str, GuitarFrets] = {
    "C": (-1, 3, 2, 0, 1, 0), "Cadd9": (-1, 3, 2, 0, 3, 3), "Cmaj7": (-1, 3, 2, 0, 0, 0),
    "G": (3, 2, 0, 0, 3, 3), "G/B": (-1, 2, 0, 0, 3, 3), "Gsus4": (3, 2, 0, 0, 1, 3),
    "Am": (-1, 0, 2, 2, 1, 0), "Am7": (-1, 0, 2, 0, 1, 0), "Asus4": (-1, 0, 2, 2, 3, 0),
    "F": (1, 3, 3, 2, 1, 1), "Fmaj7": (-1, -1, 3, 2, 1, 0), "F#m": (2, 4, 4, 2, 2, 2),
    "D": (-1, -1, 0, 2, 3, 2), "Dm": (-1, -1, 0, 2, 3, 1), "Dsus4": (-1, -1, 0, 2, 3, 3), "Dsus2": (-1, -1, 0, 2, 3, 0), "D/F#": (2, 0, 0, 2, 3, 2),
    "Em": (0, 2, 2, 0, 0, 0), "Em7": (0, 2, 2, 0, 3, 3), "E": (0, 2, 2, 1, 0, 0), "E7": (0, 2, 0, 1, 0, 0),
    "A": (-1, 0, 2, 2, 2, 0), "A7": (-1, 0, 2, 0, 2, 0), "A7sus4": (-1, 0, 2, 0, 3, 3), "Asus2": (-1, 0, 2, 2, 0, 0),
    "Bm": (-1, 2, 4, 4, 3, 2), "B7": (-1, 2, 1, 2, 0, 2), "Bb": (-1, 1, 3, 3, 3, 1), "C/E": (0, 3, 2, 0, 1, 0),
}

UKE_CHORD_FRETS: dict[str, UkeFrets] = {
    "C": (0, 0, 0, 3), "Cmaj7": (0, 0, 0, 2), "C7": (0, 0, 0, 1),
    "G": (0, 2, 3, 2), "G7": (0, 2, 1, 2), "Gsus4": (0, 2, 3, 3),
    "Am": (2, 0, 0, 0), "Am7": (0, 0, 0, 0), "A": (2, 1, 0, 0), "A7": (0, 1, 0, 0),
    "F": (2, 0, 1, 0), "Fmaj7": (2, 4, 1, 0), "Dm": (2, 2, 1, 0), "D": (2, 2, 2, 0),
    "Em": (0, 4, 3, 2), "Em7": (0, 2, 0, 2), "E7": (1, 2, 0, 2), "E": (4, 4, 4, 2),
    "Bb": (3, 2, 1, 1), "Bm": (4, 2, 2, 2), "B7": (2, 3, 2, 2),
}

def get_guitar_frets(chord: str) -> GuitarFrets:
    clean = chord.split("/")[0].strip()
    return GUITAR_CHORD_FRETS.get(chord, GUITAR_CHORD_FRETS.get(clean, (0, 2, 2, 0, 0, 0)))

def get_uke_frets(chord: str) -> UkeFrets:
    clean = chord.split("/")[0].strip()
    return UKE_CHORD_FRETS.get(chord, UKE_CHORD_FRETS.get(clean, (0, 0, 0, 0)))

def get_bass_index(frets: GuitarFrets) -> int:
    for idx in range(3):  # Check E (0), A (1), D (2)
        if frets[idx] >= 0:
            return idx
    return 1

def build_travis_guitar_measure(frets: GuitarFrets) -> list[str]:
    """Generates an 8-beat Travis picking measure for 6 strings (e B G D A E)."""
    b = get_bass_index(frets)
    alt_b = 2 if b != 2 else 1  # Alternating bass string (typically D or A)
    lines: dict[int, list[str]] = {i: [] for i in range(6)}

    # Beat 1: Bass note + melody pinch (B or high e)
    # Beat 2: G string pluck
    # Beat 3: Alternating bass note
    # Beat 4: High e string pluck
    # Beat 5: Primary bass note
    # Beat 6: B string pluck
    # Beat 7: Alternating bass note
    # Beat 8: G string pluck
    beats: list[list[tuple[int, int]]] = [
        [(b, frets[b]), (4, frets[4])],       # Root + B string pinch
        [(3, frets[3])],                      # G string
        [(alt_b, frets[alt_b])],              # Alt bass
        [(5, frets[5])],                      # High e
        [(b, frets[b])],                      # Root bass
        [(4, frets[4])],                      # B string
        [(alt_b, frets[alt_b])],              # Alt bass
        [(3, frets[3])],                      # G string
    ]

    for step in beats:
        step_dict = dict(step)
        for s_idx in range(6):
            if s_idx in step_dict and step_dict[s_idx] >= 0:
                lines[s_idx].append(f"{step_dict[s_idx]}-")
            else:
                lines[s_idx].append("--")

    # Render in tab order: e (5), B (4), G (3), D (2), A (1), E (0)
    str_names = ["e|--", "B|--", "G|--", "D|--", "A|--", "E|--"]
    string_order = [5, 4, 3, 2, 1, 0]
    return [f"{str_names[i]}{''.join(lines[string_order[i]])}|" for i in range(6)]

def build_arpeggio_guitar_measure(frets: GuitarFrets) -> list[str]:
    """Generates a flowing 4/4 arpeggio: Bass -> D -> G -> B -> e -> B -> G -> D."""
    b = get_bass_index(frets)
    lines: dict[int, list[str]] = {i: [] for i in range(6)}
    steps: list[int] = [b, 2, 3, 4, 5, 4, 3, 2]

    for s_idx in steps:
        for str_i in range(6):
            if str_i == s_idx and frets[str_i] >= 0:
                lines[str_i].append(f"{frets[str_i]}-")
            else:
                lines[str_i].append("--")

    str_names = ["e|--", "B|--", "G|--", "D|--", "A|--", "E|--"]
    string_order = [5, 4, 3, 2, 1, 0]
    return [f"{str_names[i]}{''.join(lines[string_order[i]])}|" for i in range(6)]

def build_uke_fingerstyle_measure(frets: UkeFrets) -> list[str]:
    """Generates a 4-string ukulele arpeggio: G -> C -> E -> A -> E -> C -> E -> A."""
    lines: dict[int, list[str]] = {i: [] for i in range(4)}
    steps: list[int] = [0, 1, 2, 3, 2, 1, 2, 3]  # G, C, E, A order

    for s_idx in steps:
        for str_i in range(4):
            if str_i == s_idx and frets[str_i] >= 0:
                lines[str_i].append(f"{frets[str_i]}-")
            else:
                lines[str_i].append("--")

    # Render in uke tab order: A (3), E (2), C (1), G (0)
    str_names = ["A|--", "E|--", "C|--", "G|--"]
    string_order = [3, 2, 1, 0]
    return [f"{str_names[i]}{''.join(lines[string_order[i]])}|" for i in range(4)]

def synthesize_tab_block(
    chords: list[str],
    instrument: str = "guitar",
    pattern: Literal["travis", "arpeggio"] = "travis",
) -> str:
    """Synthesizes a multi-measure ASCII tab block for the given chords."""
    if not chords:
        return ""

    is_uke = instrument.lower() == "ukulele"
    measures_per_line = 2
    output_blocks: list[str] = []

    for i in range(0, len(chords), measures_per_line):
        batch = chords[i : i + measures_per_line]
        batch_measures: list[list[str]] = []

        for chord in batch:
            if is_uke:
                frets = get_uke_frets(chord)
                batch_measures.append(build_uke_fingerstyle_measure(frets))
            else:
                g_frets = get_guitar_frets(chord)
                if pattern == "arpeggio":
                    batch_measures.append(build_arpeggio_guitar_measure(g_frets))
                else:
                    batch_measures.append(build_travis_guitar_measure(g_frets))

        # Join measures horizontally
        num_strings = 4 if is_uke else 6
        header_labels = "   ".join(f"{c:<18}" for c in batch)
        combined_stave: list[str] = [f"  {header_labels}".rstrip()]

        for str_i in range(num_strings):
            joined_string = batch_measures[0][str_i]
            for m_idx in range(1, len(batch_measures)):
                # Strip the leading string label (e.g., 'e|--') from subsequent measures
                tail = batch_measures[m_idx][str_i].split("|", 1)[1]
                joined_string = f"{joined_string}{tail}"
            combined_stave.append(joined_string)

        output_blocks.append("\n".join(combined_stave))

    return "\n\n".join(output_blocks)
