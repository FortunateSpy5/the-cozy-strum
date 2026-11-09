"""
Benchmark and Evaluation Harness: Compares The Cozy Strum against Ultimate Guitar.
Evaluates chord accuracy, capo harmony, and structural alignment across the full catalog.
"""

from __future__ import annotations
import json
import os
import sys
import time
from typing import TypedDict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ug_chord_fetcher import fetch_ug_chords, compute_harmonic_overlap
from lrc_fetcher import normalize_title, normalize_artist

class BenchmarkResult(TypedDict):
    title: str
    artist: str
    catalog_chords: list[str]
    ug_chords: list[str]
    catalog_capo: int
    ug_capo: int
    overlap_score: float
    status: str
    notes: str

def evaluate_song_harmony(
    title: str,
    artist: str,
    catalog_chords: list[str],
    catalog_capo: int,
) -> BenchmarkResult:
    """Queries UG and evaluates harmonic agreement against catalog chords."""
    clean_title = normalize_title(title)
    clean_artist = normalize_artist(artist)

    ug_data = fetch_ug_chords(clean_title, clean_artist)
    if not ug_data:
        return {
            "title": title, "artist": artist,
            "catalog_chords": catalog_chords, "ug_chords": [],
            "catalog_capo": catalog_capo, "ug_capo": 0,
            "overlap_score": 0.0, "status": "NO_UG_MATCH",
            "notes": "No public chord sheet found on UG",
        }

    ug_chords = ug_data["chords_used"]
    ug_capo = ug_data["capo"]
    direct_overlap = compute_harmonic_overlap(catalog_chords, ug_chords)

    # Check Capo-compensated overlap
    capo_diff = (ug_capo - catalog_capo)
    capo_overlap = compute_harmonic_overlap(catalog_chords, ug_chords, shift_semitones=capo_diff) if capo_diff != 0 else direct_overlap

    if direct_overlap >= 0.75 and catalog_capo == ug_capo:
        status = "EXACT_MATCH"
        overlap = direct_overlap
        notes = "Chords and Capo match community consensus"
    elif capo_overlap >= 0.75:
        status = "HARMONIC_CAPO_VARIANT"
        overlap = capo_overlap
        notes = f"Harmonically equivalent (Capo {catalog_capo} vs UG Capo {ug_capo})"
    elif direct_overlap >= 0.50 or capo_overlap >= 0.50:
        status = "PARTIAL_MATCH"
        overlap = max(direct_overlap, capo_overlap)
        notes = f"Shares core harmony ({int(overlap * 100)}% overlap)"
    else:
        # Check if transposed to another key (e.g. vocal key shift)
        best_shift = 0
        best_shift_overlap = direct_overlap
        for shift in range(-6, 7):
            s_ov = compute_harmonic_overlap(catalog_chords, ug_chords, shift_semitones=shift)
            if s_ov > best_shift_overlap:
                best_shift_overlap = s_ov
                best_shift = shift

        if best_shift_overlap >= 0.75:
            status = "TRANSPOSED_KEY_ARRANGEMENT"
            overlap = best_shift_overlap
            notes = f"Alternate key arrangement ({best_shift:+d} semitones)"
        else:
            status = "DIVERGENT"
            overlap = direct_overlap
            notes = f"Different arrangement ({int(overlap * 100)}% overlap)"

    return {
        "title": title, "artist": artist,
        "catalog_chords": catalog_chords, "ug_chords": ug_chords,
        "catalog_capo": catalog_capo, "ug_capo": ug_capo,
        "overlap_score": overlap, "status": status,
        "notes": notes,
    }

def run_catalog_benchmark(limit: int = 59, delay_sec: float = 0.2) -> list[BenchmarkResult]:
    """Runs the full benchmark against catalogSeedData.json."""
    data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src/lib/firebase/catalogSeedData.json"))
    with open(data_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    results: list[BenchmarkResult] = []
    print(f"[Benchmark] Evaluating {min(limit, len(catalog))} songs against Ultimate Guitar...")

    for idx, song in enumerate(catalog[:limit]):
        title = song["title"]
        artist = song["artist"]
        chords = song.get("chordsUsed", [])
        capo = song.get("capo", 0)

        res = evaluate_song_harmony(title, artist, chords, capo)
        results.append(res)
        print(f"[{idx+1}/{min(limit, len(catalog))}] {title} ({artist}) -> {res['status']} ({int(res['overlap_score']*100)}%)")
        time.sleep(delay_sec)

    return results

def print_benchmark_summary(results: list[BenchmarkResult]) -> None:
    """Prints a structured summary report."""
    total = len(results)
    exact = sum(1 for r in results if r["status"] == "EXACT_MATCH")
    capo_var = sum(1 for r in results if r["status"] == "HARMONIC_CAPO_VARIANT")
    transposed = sum(1 for r in results if r["status"] == "TRANSPOSED_KEY_ARRANGEMENT")
    partial = sum(1 for r in results if r["status"] == "PARTIAL_MATCH")
    divergent = sum(1 for r in results if r["status"] == "DIVERGENT")
    no_match = sum(1 for r in results if r["status"] == "NO_UG_MATCH")

    print("\n" + "=" * 65)
    print("ULTIMATE GUITAR CHORD BENCHMARK REPORT")
    print("=" * 65)
    print(f"Total songs tested:          {total}")
    print(f"Exact Matches:               {exact} ({exact/total*100:.1f}%)")
    print(f"Harmonic Capo Variants:      {capo_var} ({capo_var/total*100:.1f}%)")
    print(f"Transposed Key Arrangements: {transposed} ({transposed/total*100:.1f}%)")
    print(f"Partial Matches (>=50%):     {partial} ({partial/total*100:.1f}%)")
    print(f"Divergent Arrangements:      {divergent} ({divergent/total*100:.1f}%)")
    print(f"No UG Match Found:           {no_match} ({no_match/total*100:.1f}%)")
    compatible = exact + capo_var + transposed + partial
    print(f"Overall Musical Agreement:   {compatible}/{total} ({compatible/total*100:.1f}%)")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    res = run_catalog_benchmark(limit=59, delay_sec=0.15)
    print_benchmark_summary(res)
