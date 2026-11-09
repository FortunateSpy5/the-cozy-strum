import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, X, Plus, Minus, Volume2 } from 'lucide-react';
import { AudioMetronome } from '../../lib/music/audioMetronome';
import { useModalA11y } from '../common/useModalA11y';

interface MetronomeModalProps {
  initialBpm?: number;
  strummingPattern?: string;
  onClose: () => void;
}

export const MetronomeModal: React.FC<MetronomeModalProps> = ({
  initialBpm = 100,
  strummingPattern,
  onClose
}) => {
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const metronomeRef = useRef<AudioMetronome | null>(null);
  // Handles focus trap, Tab cycling, backdrop click, and Escape key dismissal
  const dialogRef = useModalA11y({ isOpen: true, onClose });

  useEffect(() => {
    metronomeRef.current = new AudioMetronome(bpm, (beat) => setActiveBeat(beat));
    metronomeRef.current.setVolume(volume);
    return () => { metronomeRef.current?.dispose(); };
  }, []);

  const togglePlay = () => {
    if (!metronomeRef.current) return;
    const running = metronomeRef.current.toggle();
    setIsPlaying(running);
    if (!running) setActiveBeat(0);
  };

  const handleBpm = (delta: number) => {
    const clamped = Math.max(40, Math.min(240, bpm + delta));
    setBpm(clamped);
    metronomeRef.current?.setBpm(clamped);
  };

  const strumTokens = strummingPattern ? strummingPattern.split(/\s+/) : [];
  const strumAria = strumTokens.map((t) => t.includes('D') ? 'Down' : t.includes('U') ? 'Up' : t).join(' ');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="metronome-title"
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-xs p-4 [overscroll-behavior:contain]"
    >
      <div className="w-full max-w-sm rounded-3xl bg-surface border border-warm shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          type="button"
          aria-label="Close metronome modal"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-canvas text-walnut transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <h3 id="metronome-title" className="font-serif text-xl font-bold text-espresso mb-1">Cozy Metronome</h3>
        <p className="text-xs text-walnut mb-6">Synthetic Web Audio API click engine</p>

        {/* BPM Stepper */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => handleBpm(-5)}
            type="button"
            aria-label="Decrease BPM by 5"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-canvas border border-warm flex items-center justify-center hover:border-terracotta text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="text-center min-w-[100px]">
            <span className="font-mono text-4xl font-extrabold text-espresso tracking-tight">{bpm}</span>
            <span className="block text-[11px] font-mono text-walnut uppercase">BPM</span>
          </div>
          <button
            onClick={() => handleBpm(5)}
            type="button"
            aria-label="Increase BPM by 5"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-canvas border border-warm flex items-center justify-center hover:border-terracotta text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* BPM Range Slider */}
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          aria-label="Metronome tempo slider in beats per minute"
          aria-valuenow={bpm}
          aria-valuemin={40}
          aria-valuemax={240}
          onChange={(e) => {
            const val = Number(e.target.value);
            setBpm(val);
            metronomeRef.current?.setBpm(val);
          }}
          className="w-full accent-terracotta mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded"
        />

        {/* Beat Indicator Dots with Screen Reader Status */}
        <div
          className="flex justify-center items-center gap-3 mb-6"
          role="status"
          aria-label={`Beat indicator: ${isPlaying ? `beat ${activeBeat + 1} of 4` : 'stopped'}`}
        >
          <span className="sr-only">{isPlaying ? `Beat ${activeBeat + 1} of 4` : 'Metronome stopped'}</span>
          {[0, 1, 2, 3].map((b) => (
            <div
              key={`beat-${b}`}
              aria-hidden="true"
              className={`w-3.5 h-3.5 rounded-full transition-[transform,background-color] duration-75 motion-reduce:transition-none ${
                isPlaying && activeBeat === b
                  ? b === 0 ? 'bg-terracotta scale-125 shadow-md shadow-terracotta/40' : 'bg-amber-500 scale-110'
                  : 'bg-canvas border border-warm'
              }`}
            />
          ))}
        </div>

        {/* Strumming Pattern Visualizer */}
        {strumTokens.length > 0 && (
          <div className="mb-6 p-3 rounded-2xl bg-canvas border border-warm text-center" aria-label={`Strumming rhythm: ${strumAria}`}>
            <span className="text-[11px] font-mono uppercase text-walnut block mb-1">Strumming Rhythm</span>
            <div className="flex items-center justify-center gap-2 font-mono font-bold text-espresso text-sm">
              {strumTokens.map((t, i) => (
                <span
                  key={`t-${i}`}
                  className={`px-2 py-1 rounded ${
                    t.includes('D')
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : t.includes('U')
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : 'text-walnut/50'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Volume Slider */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <Volume2 className="w-4 h-4 text-walnut shrink-0" aria-hidden="true" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            aria-label="Metronome click volume"
            aria-valuenow={Math.round(volume * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              metronomeRef.current?.setVolume(v);
            }}
            className="w-full accent-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta rounded"
            title="Metronome Click Volume"
          />
          <span className="text-[11px] font-mono text-walnut w-8 text-right" aria-hidden="true">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Play/Stop Button */}
        <button
          onClick={togglePlay}
          type="button"
          aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
          className={`w-full min-h-[44px] py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
            isPlaying ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-terracotta text-white hover:opacity-90'
          }`}
        >
          {isPlaying ? <Square className="w-4 h-4 fill-white" aria-hidden="true" /> : <Play className="w-4 h-4 fill-white" aria-hidden="true" />}
          <span>{isPlaying ? 'Stop Metronome' : 'Start Metronome'}</span>
        </button>
      </div>
    </div>
  );
};
