"""
Unit Tests for The Cozy Strum Local Chord Sync Pipeline.
Run with: python tools/chord-sync/test_aligner.py
"""

from __future__ import annotations
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lrc_fetcher import (
    parse_lrc_timestamp,
    parse_lrc_content,
    normalize_title,
    normalize_artist,
    LyricLine,
)
from chord_aligner import (
    snap_to_word_start,
    build_chord_line_for_lyrics,
    build_progression_line_for_lyrics,
    align_chords_with_lyrics,
    format_cozy_strum_tab,
)
from section_detector import detect_song_sections
from tab_synthesizer import synthesize_tab_block
from tab_fetcher import clean_ug_tab_text, extract_first_ascii_tab_block
from tab_injector import inject_tab_block, resolve_ascii_tab
from ug_chord_fetcher import clean_ug_content, extract_recurring_progression, compute_harmonic_overlap

class TestChordSyncPipeline(unittest.TestCase):
    def test_parse_lrc_timestamp(self):
        self.assertAlmostEqual(parse_lrc_timestamp("[00:14.20]"), 14.2)
        self.assertAlmostEqual(parse_lrc_timestamp("[01:05.500]"), 65.5)
        self.assertAlmostEqual(parse_lrc_timestamp("[00:00.00]"), 0.0)

    def test_parse_lrc_content_cleans_metadata(self):
        sample_lrc = """
        [ti:Wonderwall]
        [ar:Oasis]
        [00:04.50] Today is gonna be the day ♫
        [00:08.20] That they're gonna throw it back to you
        """
        lines = parse_lrc_content(sample_lrc)
        self.assertEqual(len(lines), 2)
        self.assertAlmostEqual(lines[0]["start_time"], 4.5)
        self.assertFalse("♫" in lines[0]["text"])

    def test_normalize_title_and_artist(self):
        self.assertEqual(normalize_title("Riptide (Ukulele Edition)"), "Riptide")
        self.assertEqual(normalize_title("Dust in the Wind - Remastered 2004"), "Dust in the Wind")
        self.assertEqual(normalize_title("Hallelujah (Fingerstyle & Chords)"), "Hallelujah")
        self.assertEqual(normalize_artist("Santana feat. Rob Thomas"), "Santana")
        self.assertEqual(normalize_artist("Arijit Singh / Pritam"), "Arijit Singh")

    def test_snap_to_word_start(self):
        text = "I was scared of dentists and the dark"
        snapped = snap_to_word_start(text, target_col=8)
        self.assertEqual(snapped, 6)

    def test_build_chord_line_collision_avoidance(self):
        lyric = "Wise men say only fools rush in"
        chords = [
            {"timestamp": 10.0, "chord": "C"},
            {"timestamp": 10.2, "chord": "Em"},
        ]
        line = build_chord_line_for_lyrics(lyric, 10.0, 15.0, chords)
        self.assertTrue("C" in line)
        self.assertTrue("Em" in line)
        self.assertFalse("CEm" in line)
        self.assertGreaterEqual(line.index("Em"), line.index("C") + 2)

    def test_build_progression_line(self):
        lyric = "I was scared of dentists and the dark"
        prog = ["Am", "G", "C"]
        line = build_progression_line_for_lyrics(lyric, prog)
        self.assertTrue(line.startswith("Am"))
        self.assertTrue("G" in line)
        self.assertTrue("C" in line)

    def test_detect_song_sections(self):
        lyrics: list[LyricLine] = [
            {"start_time": 5.0, "end_time": 8.0, "text": "Verse line one"},
            {"start_time": 8.0, "end_time": 11.0, "text": "Verse line two"},
            {"start_time": 11.0, "end_time": 14.0, "text": "Chorus refrain line"},
            {"start_time": 14.0, "end_time": 17.0, "text": "Chorus hook line"},
            {"start_time": 17.0, "end_time": 20.0, "text": "Verse line three"},
            {"start_time": 20.0, "end_time": 23.0, "text": "Chorus refrain line"},
            {"start_time": 23.0, "end_time": 26.0, "text": "Chorus hook line"},
        ]
        tagged = detect_song_sections(lyrics)
        self.assertEqual(tagged[0]["section"], "Verse 1")
        self.assertEqual(tagged[2]["section"], "Chorus")
        self.assertEqual(tagged[4]["section"], "Verse 2")
        self.assertEqual(tagged[5]["section"], "Chorus")

    def test_format_cozy_strum_tab_with_progression(self):
        lyrics: list[LyricLine] = [
            {"start_time": 10.0, "end_time": 14.0, "text": "I was scared of dentists and the dark"},
        ]
        tab = format_cozy_strum_tab(
            title="Riptide", artist="Vance Joy", lyrics=lyrics, chords=[],
            progression=["Am", "G", "C"], capo=1, instrument="ukulele",
        )
        self.assertTrue("[Intro]" in tab)
        self.assertTrue("Am   G   C" in tab)
        self.assertTrue("Capo: 1" in tab)
        self.assertTrue("Instrument: ukulele" in tab)
        self.assertTrue("I was scared" in tab)

    def test_synthesize_tab_block(self):
        guitar_tab = synthesize_tab_block(["C", "Am"], instrument="guitar", pattern="travis")
        self.assertTrue("e|--" in guitar_tab)
        self.assertTrue("E|--" in guitar_tab)
        self.assertTrue("C" in guitar_tab and "Am" in guitar_tab)

        uke_tab = synthesize_tab_block(["C", "G"], instrument="ukulele")
        self.assertTrue("A|--" in uke_tab)
        self.assertTrue("G|--" in uke_tab)
        self.assertFalse("E|--" in uke_tab.splitlines()[0])  # First stave line is A string

    def test_clean_ug_tab_and_inject(self):
        raw_tab = "[tab]e|--0--1--\nB|--1--3--\nG|--0--2--\nD|--2--0--\n[/tab]"
        cleaned = clean_ug_tab_text(raw_tab)
        self.assertFalse("[tab]" in cleaned)
        extracted = extract_first_ascii_tab_block(cleaned)
        self.assertIsNotNone(extracted)
        self.assertTrue("e|--0--1--" in (extracted or ""))

        base_sheet = "Title - Artist\nCapo: 0\n\n[Verse 1]\nLyrics"
        injected = inject_tab_block(base_sheet, "e|--0--|", "Intro Tab")
        self.assertTrue("[Intro Tab]" in injected)
        self.assertTrue("e|--0--|" in injected)

    def test_ug_chord_utilities(self):
        cleaned = clean_ug_content("[ch]Am[/ch] [ch]G[/ch] &amp; [ch]C[/ch]")
        self.assertEqual(cleaned, "Am G & C")

        chords = ["Am", "C", "D", "F", "Am", "C", "D", "F", "E"]
        prog = extract_recurring_progression(chords)
        self.assertEqual(prog, ["Am", "C", "D", "F"])

        overlap = compute_harmonic_overlap(["C", "Am", "F", "G"], ["C", "Am7", "Fmaj7", "G7"])
        self.assertAlmostEqual(overlap, 1.0)

if __name__ == "__main__":
    unittest.main()
