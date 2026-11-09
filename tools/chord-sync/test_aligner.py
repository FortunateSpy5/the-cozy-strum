"""
Unit Tests for The Cozy Strum Local Chord Sync Pipeline.
Run with: python tools/chord-sync/test_aligner.py
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lrc_fetcher import parse_lrc_timestamp, parse_lrc_content
from chord_aligner import (
    snap_to_word_boundary,
    build_chord_line_for_lyrics,
    align_chords_with_lyrics,
    format_cozy_strum_tab,
)

class TestChordSyncPipeline(unittest.TestCase):
    def test_parse_lrc_timestamp(self):
        self.assertAlmostEqual(parse_lrc_timestamp("[00:14.20]"), 14.2)
        self.assertAlmostEqual(parse_lrc_timestamp("[01:05.500]"), 65.5)
        self.assertAlmostEqual(parse_lrc_timestamp("[00:00.00]"), 0.0)

    def test_parse_lrc_content(self):
        sample_lrc = """
        [00:04.50] Today is gonna be the day
        [00:08.20] That they're gonna throw it back to you
        [00:12.80] By now you should've somehow
        """
        lines = parse_lrc_content(sample_lrc)
        self.assertEqual(len(lines), 3)
        self.assertAlmostEqual(lines[0]["start_time"], 4.5)
        self.assertAlmostEqual(lines[0]["end_time"], 8.2)
        self.assertEqual(lines[0]["text"], "Today is gonna be the day")
        self.assertAlmostEqual(lines[1]["start_time"], 8.2)
        self.assertAlmostEqual(lines[1]["end_time"], 12.8)

    def test_snap_to_word_boundary(self):
        text = "Today is gonna be the day"
        snapped = snap_to_word_boundary(text, target_col=7, max_snap_distance=2)
        self.assertEqual(snapped, 6)

    def test_build_chord_line_collision_avoidance(self):
        lyric = "Wise men say only fools rush in"
        chords = [
            {"timestamp": 10.0, "chord": "C"},
            {"timestamp": 10.2, "chord": "Em"},
        ]
        line = build_chord_line_for_lyrics(
            lyric_text=lyric,
            line_start=10.0,
            line_end=15.0,
            chords=chords,
        )
        self.assertTrue("C" in line)
        self.assertTrue("Em" in line)
        self.assertFalse("CEm" in line)
        self.assertGreaterEqual(line.index("Em"), line.index("C") + 2)

    def test_align_chords_with_lyrics(self):
        lyrics = [
            {"start_time": 0.0, "end_time": 4.0, "text": "Take me home, country roads"},
            {"start_time": 4.0, "end_time": 8.0, "text": "To the place I belong"},
        ]
        chords = [
            {"timestamp": 0.0, "chord": "G"},
            {"timestamp": 2.5, "chord": "Em"},
            {"timestamp": 4.0, "chord": "D"},
            {"timestamp": 6.0, "chord": "C"},
        ]
        aligned = align_chords_with_lyrics(lyrics, chords)
        self.assertEqual(len(aligned), 4)
        self.assertTrue("G" in aligned[0])
        self.assertEqual(aligned[1], "Take me home, country roads")
        self.assertTrue("D" in aligned[2])
        self.assertEqual(aligned[3], "To the place I belong")

    def test_format_cozy_strum_tab(self):
        lyrics = [
            {"start_time": 0.0, "end_time": 3.0, "text": "Hello world"},
        ]
        chords = [
            {"timestamp": 0.0, "chord": "Am"},
        ]
        tab = format_cozy_strum_tab(
            title="Test Song",
            artist="Cozy Band",
            lyrics=lyrics,
            chords=chords,
            capo=2,
            instrument="ukulele",
        )
        self.assertTrue("Test Song - Cozy Band" in tab)
        self.assertTrue("Capo: 2" in tab)
        self.assertTrue("Instrument: ukulele" in tab)
        self.assertTrue("Chords: Am" in tab)
        self.assertTrue("Hello world" in tab)

if __name__ == "__main__":
    unittest.main()
