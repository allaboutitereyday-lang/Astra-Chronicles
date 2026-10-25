// Web Audio API Synthesizer Engine for Astra Chronicles
// Generates immersive fantasy soundscapes and chimes without external audio files

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("astra_sound_muted");
      this.muted = savedMute === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): boolean {
    this.muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("astra_sound_muted", String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.muted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.muted);
  }

  /**
   * Tactile fantasy click / selection tick
   */
  public playClick() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  /**
   * Opening / Title screen celestial awakening bell
   */
  public playIntroBell() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const freqs = [220, 330, 440, 554, 659];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + idx * 0.12 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 2.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 2.5);
      });
    } catch {}
  }

  /**
   * Planar Rift warp transition (when entering Astra Continent after character creation)
   */
  public playRiftTransition() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;

      // Low resonant atmospheric drone
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = "sawtooth";
      sub.frequency.setValueAtTime(65, now);
      sub.frequency.exponentialRampToValueAtTime(110, now + 1.2);
      sub.frequency.exponentialRampToValueAtTime(55, now + 2.5);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.linearRampToValueAtTime(450, now + 1.0);
      filter.frequency.linearRampToValueAtTime(120, now + 2.5);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.2, now + 0.6);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

      sub.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.masterGain);

      sub.start(now);
      sub.stop(now + 2.7);

      // Shimmering celestial harmonics
      const bells = [440, 554, 659, 880, 1108];
      bells.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + 0.4 + i * 0.1);

        g.gain.setValueAtTime(0.001, now + 0.4 + i * 0.1);
        g.gain.linearRampToValueAtTime(0.08, now + 0.4 + i * 0.1 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4 + i * 0.1 + 1.8);

        osc.connect(g);
        g.connect(this.masterGain!);

        osc.start(now + 0.4 + i * 0.1);
        osc.stop(now + 0.4 + i * 0.1 + 1.9);
      });
    } catch {}
  }

  /**
   * Favor / Affection chime (positive or negative)
   */
  public playFavorSound(positive: boolean) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      if (positive) {
        const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);

          gain.gain.setValueAtTime(0.001, now + idx * 0.07);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.07 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.8);

          osc.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.9);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.35);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {}
  }

  /**
   * Subtle typewriter sound
   */
  public playDialogueBlip() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      // Small random pitch variation for organic visual novel dialogue feel
      const pitch = 380 + Math.random() * 60;
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  /**
   * Equipment equip / weapon unsheathe resonant metallic chime
   */
  public playEquipChime() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      // Resonant harmonic steel ping
      const pitches = [784, 1174.66, 1567.98]; // G5 -> D6 -> G6
      pitches.forEach((p, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(p, now + i * 0.04);
        osc.frequency.exponentialRampToValueAtTime(p * 0.98, now + i * 0.04 + 0.2);

        gain.gain.setValueAtTime(0.001, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.14, now + i * 0.04 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.45);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.5);
      });
    } catch {}
  }

  /**
   * Futuristic holographic System Administrator chime (Isekai / Manhwa quest ping)
   */
  public playSystemNotification() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const pitches = [880, 1318.5, 1760]; // A5 -> E6 -> A6
      pitches.forEach((p, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(p, now + i * 0.06);

        gain.gain.setValueAtTime(0.001, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.06 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.6);
      });
    } catch {}
  }

  /**
   * System Alert / Causal Plausibility Warning pulse
   */
  public playSystemAlert() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      [330, 440, 220].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.08, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch {}
  }

  /**
   * Triumphant Quest Completion fanfare
   */
  public playQuestComplete() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 1.3);
      });
    } catch {}
  }
}

export const soundEffects = new AudioEngine();

