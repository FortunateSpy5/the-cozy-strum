"""
Audio Harmony & Chord Extractor Wrapper for The Cozy Strum.
Supports chord-extractor, librosa chromagram detection, or timestamped chord lists.
"""

from __future__ import annotations
import os
import re
from typing import TypedDict, Optional

class TimestampedChord(TypedDict):
    timestamp: float
    chord: str

def parse_chord_text_file(filepath: str) -> list[TimestampedChord]:
    """Parses a text file with lines like '14.2 C' or '00:14.20 Am' into timestamped chords."""
    chords: list[TimestampedChord] = []
    time_chord_pattern = re.compile(r"(?:\[?(\d{1,2}:)?(\d{1,2}(?:\.\d{1,3})?)\]?)\s+([A-G][b#]?(?:m|maj|min|dim|aug|sus\d?|\d+)?)")

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            match = time_chord_pattern.search(line.strip())
            if match:
                min_part = match.group(1)
                sec_part = match.group(2)
                chord_name = match.group(3)
                seconds = float(sec_part)
                if min_part:
                    seconds += float(min_part.strip(":")) * 60.0
                chords.append({"timestamp": round(seconds, 3), "chord": chord_name})

    chords.sort(key=lambda c: c["timestamp"])
    return chords

def extract_chords_with_chord_extractor(audio_path: str) -> Optional[list[TimestampedChord]]:
    """Extracts chords using the open-source 'chord-extractor' library if installed."""
    try:
        from chord_extractor import ChordExtractor  # type: ignore
        extractor = ChordExtractor()
        results = extractor.extract(audio_path)
        chords: list[TimestampedChord] = []
        for item in results:
            # chord_extractor returns (timestamp, chord) or object with timestamp, chord
            ts = getattr(item, "timestamp", None) or item[0]
            name = getattr(item, "chord", None) or item[1]
            if name and name != "N":
                chords.append({"timestamp": round(float(ts), 3), "chord": str(name)})
        return chords
    except ImportError:
        return None
    except Exception as err:
        print(f"[Warning] chord-extractor error: {err}")
        return None

def extract_chords_with_librosa(audio_path: str) -> Optional[list[TimestampedChord]]:
    """Extracts basic major and minor chords using librosa chromagram template matching."""
    try:
        import librosa  # type: ignore
        import numpy as np  # type: ignore

        y, sr = librosa.load(audio_path, sr=22050, mono=True)
        # Separate harmonic content from percussive content
        y_harmonic, _ = librosa.effects.hpss(y)
        chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr, hop_length=512)

        notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        major_template = np.array([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0])
        minor_template = np.array([1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0])

        chord_templates: list[tuple[str, np.ndarray]] = []
        for i, root in enumerate(notes):
            chord_templates.append((root, np.roll(major_template, i)))
            chord_templates.append((f"{root}m", np.roll(minor_template, i)))

        times = librosa.frames_to_time(np.arange(chroma.shape[1]), sr=sr, hop_length=512)
        raw_chords: list[tuple[float, str]] = []

        # Downsample to ~1 chord per 0.5 seconds
        step = max(1, int(0.5 / (times[1] - times[0])))
        prev_chord = ""

        for frame_idx in range(0, chroma.shape[1], step):
            vec = chroma[:, frame_idx]
            norm = np.linalg.norm(vec)
            if norm < 0.1:
                continue
            vec = vec / norm
            scores = [np.dot(vec, template / np.linalg.norm(template)) for _, template in chord_templates]
            best_idx = int(np.argmax(scores))
            best_chord = chord_templates[best_idx][0]

            if best_chord != prev_chord and scores[best_idx] > 0.65:
                raw_chords.append((round(float(times[frame_idx]), 2), best_chord))
                prev_chord = best_chord

        return [{"timestamp": t, "chord": c} for t, c in raw_chords]
    except ImportError:
        return None
    except Exception as err:
        print(f"[Warning] librosa extraction error: {err}")
        return None

def extract_chords_from_audio(audio_path: str) -> list[TimestampedChord]:
    """Unified audio chord extraction dispatcher with fallback detection."""
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # If it's a text file of timestamps, parse directly
    ext = os.path.splitext(audio_path)[1].lower()
    if ext in [".txt", ".tsv", ".chords"]:
        return parse_chord_text_file(audio_path)

    # 1. Try chord-extractor
    res = extract_chords_with_chord_extractor(audio_path)
    if res is not None:
        return res

    # 2. Try librosa
    res = extract_chords_with_librosa(audio_path)
    if res is not None:
        return res

    print("[Info] Neither chord-extractor nor librosa is installed.")
    print("Install via: pip install chord-extractor librosa")
    return []
