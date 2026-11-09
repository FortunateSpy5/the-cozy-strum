declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export class AudioMetronome {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private bpm = 100;
  private volume = 0.8;
  private currentBeat = 0;
  private beatsPerBar = 4;
  private nextBeatTime = 0;
  private timerId: number | null = null;
  private callbackTimerIds: Set<number> = new Set();
  private onBeatCallback?: (beat: number) => void;

  constructor(bpm = 100, onBeat?: (beat: number) => void) {
    this.bpm = bpm;
    this.onBeatCallback = onBeat;
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API not supported');
      }
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setBpm(newBpm: number): void {
    this.bpm = Math.max(30, Math.min(300, newBpm));
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public start(): void {
    if (this.isRunning) return;
    const ctx = this.initContext();
    this.isRunning = true;
    this.currentBeat = 0;
    this.nextBeatTime = ctx.currentTime + 0.05;
    this.scheduleTicks();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    for (const id of this.callbackTimerIds) {
      window.clearTimeout(id);
    }
    this.callbackTimerIds.clear();
  }

  public dispose(): void {
    this.stop();
    this.onBeatCallback = undefined;
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  private scheduleTicks = (): void => {
    if (!this.isRunning || !this.ctx) return;

    const lookaheadSec = 0.1; // 100ms
    const scheduleAheadTime = 0.05;

    while (this.nextBeatTime < this.ctx.currentTime + lookaheadSec) {
      this.playClick(this.nextBeatTime, this.currentBeat === 0);

      const beatForCallback = this.currentBeat;
      const delayMs = Math.max(0, (this.nextBeatTime - this.ctx.currentTime) * 1000);
      const timerId = window.setTimeout(() => {
        this.callbackTimerIds.delete(timerId);
        if (this.isRunning && this.onBeatCallback) {
          this.onBeatCallback(beatForCallback);
        }
      }, delayMs);
      this.callbackTimerIds.add(timerId);

      const secondsPerBeat = 60.0 / this.bpm;
      this.nextBeatTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerBar;
    }

    this.timerId = window.setTimeout(this.scheduleTicks, scheduleAheadTime * 1000);
  };

  private playClick(time: number, isDownbeat: boolean): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isDownbeat ? 880 : 440, time);

    const duration = isDownbeat ? 0.04 : 0.025;
    gain.gain.setValueAtTime(this.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(time);
    osc.stop(time + duration);
  }
}
