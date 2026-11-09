#!/usr/bin/env python3
"""
The Cozy Strum — Automated Audio + LRCLIB Chord-over-Lyrics Generator CLI.
Pairs open-source millisecond-synced lyrics with audio chords, UG verified chords, and selective tabs.
"""

from __future__ import annotations
import argparse
import json
import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lrc_fetcher import fetch_lrclib_synced_lyrics, parse_lrc_content, LyricLine
from chord_extractor_wrapper import extract_chords_from_audio, TimestampedChord
from chord_aligner import format_cozy_strum_tab
from firestore_uploader import upload_tab_to_firestore
from tab_injector import resolve_ascii_tab, inject_tab_block
from ug_chord_fetcher import fetch_ug_chords

def parse_chord_list(arg: str | None) -> list[str]:
    """Parses a space or comma separated chord string into a list of chords."""
    if not arg:
        return []
    parts = re.split(r"[\s,]+", arg.strip())
    return [p for p in parts if p]

def build_cli_parser() -> argparse.ArgumentParser:
    """Builds the command-line argument parser."""
    parser = argparse.ArgumentParser(
        description="The Cozy Strum: Sync LRCLIB lyrics with audio chords to generate ASCII tabs.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--title", required=True, help="Song title (e.g., 'Wonderwall')")
    parser.add_argument("--artist", required=True, help="Artist or band name (e.g., 'Oasis')")
    parser.add_argument("--audio", help="Path to local audio file (.mp3, .wav) or .chords file")
    parser.add_argument("--progression", help="Verse chord progression (e.g., 'Em7 G Dsus4 A7sus4')")
    parser.add_argument("--chorus-progression", help="Chorus chord progression (e.g., 'Cadd9 Em7 G')")
    parser.add_argument("--fetch-chords", action="store_true", help="Fetch verified chords & capo from Ultimate Guitar")
    parser.add_argument("--fingerstyle", choices=["travis", "arpeggio"], help="Generate fingerstyle pattern")
    parser.add_argument("--fetch-tab", action="store_true", help="Fetch real ASCII tab from public archive")
    parser.add_argument("--tab-section", default="intro", help="Tab section to extract (intro, solo, riff)")
    parser.add_argument("--lrc-file", help="Path to local .lrc file (skips LRCLIB online fetch)")
    parser.add_argument("--capo", type=int, default=0, help="Capo fret position")
    parser.add_argument("--instrument", default="guitar", choices=["guitar", "ukulele"])
    parser.add_argument("--output", help="Path to save output .tab or .json file")
    parser.add_argument("--upload", action="store_true", help="Upload directly to Firestore")
    parser.add_argument("--service-account", help="Path to Firebase service account JSON")
    parser.add_argument("--dry-run", action="store_true", help="Print tab to stdout without saving")
    return parser

def main() -> int:
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    parser = build_cli_parser()
    args = parser.parse_args()

    title, artist = args.title.strip(), args.artist.strip()
    print(f"[The Cozy Strum] Processing '{title}' by '{artist}'...")

    # Step 1: Synced Lyrics Retrieval
    lyrics: list[LyricLine] = []
    if args.lrc_file:
        if not os.path.exists(args.lrc_file):
            print(f"[Error] Local LRC file not found: {args.lrc_file}")
            return 1
        with open(args.lrc_file, "r", encoding="utf-8") as f:
            lyrics = parse_lrc_content(f.read())
        print(f"[OK] Loaded {len(lyrics)} lines from local LRC file.")
    else:
        print("[Network] Querying LRCLIB API for millisecond-synced lyrics...")
        fetched = fetch_lrclib_synced_lyrics(title, artist)
        if not fetched:
            print("[Warning] No synced lyrics found on LRCLIB. Run with --lrc-file to supply local LRC.")
            return 1
        lyrics = fetched
        print(f"[OK] Fetched {len(lyrics)} synced lyric lines from LRCLIB.")

    # Step 2: Audio Chord Extraction
    chords: list[TimestampedChord] = []
    if args.audio:
        print(f"[Audio] Extracting harmony and chords from '{args.audio}'...")
        chords = extract_chords_from_audio(args.audio)
        print(f"[OK] Extracted {len(chords)} timestamped chords.")

    progression = parse_chord_list(args.progression)
    chorus_prog = parse_chord_list(args.chorus_progression)

    # Step 2.5: UG Verified Chords Fallback
    capo_pos = args.capo
    if args.fetch_chords and not progression and not chords:
        print(f"[UGChordBridge] Querying Ultimate Guitar for verified chords...")
        ug_data = fetch_ug_chords(title, artist)
        if ug_data:
            progression = ug_data["verse_progression"]
            if capo_pos == 0 and ug_data["capo"] > 0:
                capo_pos = ug_data["capo"]
            print(f"[OK] Loaded UG verified progression: {progression} (Capo: {capo_pos})")

    # Step 3: Alignment & Tab Generation
    print("[Aligner] Aligning chords over lyrics with intelligent section detection...")
    tab_content = format_cozy_strum_tab(
        title=title, artist=artist, lyrics=lyrics, chords=chords,
        progression=progression, chorus_progression=chorus_prog,
        capo=capo_pos, instrument=args.instrument,
    )

    used_chords = sorted(list({c["chord"] for c in chords if c["chord"]} | set(progression) | set(chorus_prog)))

    # Step 4: Tab Retrieval / Fingerstyle Generation
    tab_stave, tab_label = resolve_ascii_tab(
        title=title, artist=artist, chords=progression or used_chords,
        instrument=args.instrument, fingerstyle=args.fingerstyle,
        fetch_tab=args.fetch_tab, section=args.tab_section,
    )
    if tab_stave:
        print(f"[TabEngine] Injected {tab_label} into song sheet.")
        tab_content = inject_tab_block(tab_content, tab_stave, section_label=tab_label)

    # Step 5: Output / Save / Upload
    if args.output:
        if args.output.lower().endswith(".json"):
            payload = {
                "title": title, "artist": artist, "capo": capo_pos,
                "instrument": args.instrument, "chordsUsed": used_chords, "content": tab_content,
            }
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            print(f"[Saved] JSON payload to: {args.output}")
        else:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(tab_content)
            print(f"[Saved] Formatted ASCII tab to: {args.output}")

    if args.upload:
        print("[Cloud] Uploading to Firestore...")
        try:
            doc_id = upload_tab_to_firestore(
                title=title, artist=artist, content=tab_content, chords_used=used_chords,
                service_account_path=args.service_account, capo=capo_pos, instrument=args.instrument,
            )
            print(f"[Success] Successfully uploaded tab to Firestore with ID: {doc_id}")
        except Exception as err:
            print(f"[Error] Upload failed: {err}")
            return 1

    if args.dry_run or not args.output:
        print("\n" + "=" * 55 + "\n" + tab_content + "\n" + "=" * 55 + "\n")

    print("[Complete] Tab generation complete! Cozy practicing!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
