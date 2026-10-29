// Pure Web Audio API Music Box & Sound Effects (works offline & on mobile without external audio assets)

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private melodyTimeouts: number[] = [];
  private isPlayingMelody: boolean = false;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopBirthdayMelody();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Play a single dreamy music-box bell note
  public playNote(freq: number, duration = 0.9, delay = 0, volume = 0.14) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;

    // Main bell sine + overtone triangle for music-box timbre
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.22, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.45);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc1.connect(gain);
    osc2.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  // Sparkle chime when tapping a 3D heart
  public playHeartChime(index = 0) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const baseFreq = scale[index % scale.length];
    this.playNote(baseFreq, 0.75, 0, 0.13);
    this.playNote(baseFreq * 1.5, 0.85, 0.07, 0.08);
  }

  // Magical harp glissando when opening the 3D wax-sealed envelope
  public playEnvelopeOpen() {
    const notes = [392.0, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((freq, idx) => {
      this.playNote(freq, 1.1, idx * 0.065, 0.11);
    });
  }

  // Celebratory chord + sparkle when blowing out the 22nd birthday candles
  public playWishGranted() {
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98, 2093.0];
    notes.forEach((freq, idx) => {
      this.playNote(freq, 1.4, idx * 0.055, 0.13);
    });
  }

  // Music box rendition of "Happy Birthday to You"
  public toggleBirthdayMelody(onStateChange?: (playing: boolean) => void): boolean {
    if (this.isPlayingMelody) {
      this.stopBirthdayMelody();
      onStateChange?.(false);
      return false;
    }

    const ctx = this.getContext();
    if (!ctx) return false;

    this.isPlayingMelody = true;
    onStateChange?.(true);

    // Note frequencies (F major / C major dreamy music box register)
    const G4 = 392.0;
    const A4 = 440.0;
    const B4 = 493.88;
    const C5 = 523.25;
    const D5 = 587.33;
    const E5 = 659.25;
    const F5 = 698.46;
    const G5 = 783.99;

    const sequence: Array<{ f: number; d: number; t: number }> = [
      // Happy birthday to you
      { f: G4, d: 0.4, t: 0.0 },
      { f: G4, d: 0.3, t: 0.35 },
      { f: A4, d: 0.7, t: 0.65 },
      { f: G4, d: 0.7, t: 1.25 },
      { f: C5, d: 0.7, t: 1.85 },
      { f: B4, d: 1.2, t: 2.45 },

      // Happy birthday to you
      { f: G4, d: 0.4, t: 3.65 },
      { f: G4, d: 0.3, t: 4.0 },
      { f: A4, d: 0.7, t: 4.3 },
      { f: G4, d: 0.7, t: 4.9 },
      { f: D5, d: 0.7, t: 5.5 },
      { f: C5, d: 1.2, t: 6.1 },

      // Happy birthday dear Angel (Lablab)
      { f: G4, d: 0.4, t: 7.3 },
      { f: G4, d: 0.3, t: 7.65 },
      { f: G5, d: 0.7, t: 7.95 },
      { f: E5, d: 0.7, t: 8.55 },
      { f: C5, d: 0.7, t: 9.15 },
      { f: B4, d: 0.7, t: 9.75 },
      { f: A4, d: 1.1, t: 10.35 },

      // Happy birthday to you!
      { f: F5, d: 0.4, t: 11.5 },
      { f: F5, d: 0.3, t: 11.85 },
      { f: E5, d: 0.7, t: 12.15 },
      { f: C5, d: 0.7, t: 12.75 },
      { f: D5, d: 0.7, t: 13.35 },
      { f: C5, d: 1.6, t: 13.95 }
    ];

    sequence.forEach((item) => {
      const id = window.setTimeout(() => {
        if (!this.isPlayingMelody) return;
        this.playNote(item.f, item.d * 1.4, 0, 0.13);
        // Gentle harmony note an octave below
        this.playNote(item.f * 0.5, item.d * 1.6, 0.02, 0.05);
      }, item.t * 1000);
      this.melodyTimeouts.push(id);
    });

    const endId = window.setTimeout(() => {
      this.isPlayingMelody = false;
      onStateChange?.(false);
    }, 15800);
    this.melodyTimeouts.push(endId);

    return true;
  }

  public stopBirthdayMelody() {
    this.isPlayingMelody = false;
    this.melodyTimeouts.forEach((id) => window.clearTimeout(id));
    this.melodyTimeouts = [];
  }
}

export const soundManager = new SoundManager();
