"""
Audit & Generator Evaluation for Pending Songs in SAVED_SONGS.md / saved_songs.json.
Tests LRCLIB lyrics discovery and chord sheet compatibility across user's saved list.
"""

from __future__ import annotations
import json
import os
import sys
import time
from typing import TypedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lrc_fetcher import fetch_lrclib_synced_lyrics, normalize_title, normalize_artist
from ug_chord_fetcher import fetch_ug_chords

class SongAuditResult(TypedDict):
    id: int
    title: str
    artist: str
    batch_name: str
    lrc_found: bool
    ug_found: bool
    capo: int
    chords_sample: list[str]
    has_tab_component: bool

def audit_saved_songs(sample_per_batch: int = 5, delay_sec: float = 0.1) -> dict[str, list[SongAuditResult]]:
    """Evaluates pending songs across all batches in docs/saved_songs.json."""
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../docs/saved_songs.json"))
    with open(data_path, "r", encoding="utf-8") as f:
        songs = json.load(f)

    pending = [s for s in songs if not s.get("isExisting")]
    batches: dict[str, list[dict]] = {}
    for s in pending:
        b_name = s.get("batchName", "Other")
        batches.setdefault(b_name, []).append(s)

    results_by_batch: dict[str, list[SongAuditResult]] = {}

    print(f"[Audit] Testing pending songs across {len(batches)} batches (sample: {sample_per_batch} per batch)...")

    for b_name, b_songs in sorted(batches.items()):
        results_by_batch[b_name] = []
        sample = b_songs[:sample_per_batch]
        print(f"\n--- {b_name} ({len(b_songs)} total pending, testing {len(sample)}) ---")

        for s in sample:
            title = s.get("title", "")
            artist = s.get("artist", "")
            tab_type = str(s.get("type", "")).lower()

            # 1. Check LRCLIB
            lrc_lines = fetch_lrclib_synced_lyrics(title, artist)
            lrc_found = bool(lrc_lines and len(lrc_lines) > 0)

            # 2. Check UG Chords
            ug_data = fetch_ug_chords(title, artist)
            ug_found = bool(ug_data and len(ug_data["chords_used"]) > 0)
            capo = ug_data["capo"] if ug_data else 0
            chords = ug_data["chords_used"][:5] if ug_data else []

            has_tab = "tab" in tab_type or "ukulele" in tab_type or (ug_data and "[tab]" in ug_data.get("raw_content", ""))

            res: SongAuditResult = {
                "id": s.get("id", 0),
                "title": title,
                "artist": artist,
                "batch_name": b_name,
                "lrc_found": lrc_found,
                "ug_found": ug_found,
                "capo": capo,
                "chords_sample": chords,
                "has_tab_component": bool(has_tab),
            }
            results_by_batch[b_name].append(res)
            lrc_icon = "[LRC: OK]" if lrc_found else "[LRC: --]"
            ug_icon = "[UG: OK]" if ug_found else "[UG: --]"
            tab_icon = "[Tab]" if has_tab else "[Chords]"
            print(f"  {lrc_icon} {ug_icon} {tab_icon} {title} ({artist}) -> Capo: {capo}, Chords: {chords}")
            time.sleep(delay_sec)

    return results_by_batch

def print_audit_summary(results_by_batch: dict[str, list[SongAuditResult]]) -> None:
    """Prints a consolidated summary report across batches."""
    all_results = [r for sublist in results_by_batch.values() for r in sublist]
    total = len(all_results)
    lrc_total = sum(1 for r in all_results if r["lrc_found"])
    ug_total = sum(1 for r in all_results if r["ug_found"])
    tab_total = sum(1 for r in all_results if r["has_tab_component"])

    print("\n" + "=" * 70)
    print("SAVED SONGS BATCH AUDIT & FEASIBILITY REPORT")
    print("=" * 70)
    print(f"Total pending songs sampled: {total}")
    print(f"LRCLIB Synced Lyrics Found:   {lrc_total}/{total} ({lrc_total/total*100:.1f}%)")
    print(f"UG Community Chords Found:    {ug_total}/{total} ({ug_total/total*100:.1f}%)")
    print(f"Tab/Fingerstyle Components:   {tab_total}/{total} ({tab_total/total*100:.1f}%)")
    print("-" * 70)
    for b_name, b_list in sorted(results_by_batch.items()):
        b_lrc = sum(1 for r in b_list if r["lrc_found"])
        b_ug = sum(1 for r in b_list if r["ug_found"])
        print(f"{b_name:<45} | LRC: {b_lrc}/{len(b_list)} | UG: {b_ug}/{len(b_list)}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    audit_data = audit_saved_songs(sample_per_batch=5, delay_sec=0.1)
    print_audit_summary(audit_data)
