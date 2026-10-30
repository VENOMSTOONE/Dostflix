// Web Audio API procedural sound engine - zero external file dependencies, 0ms latency, high-fidelity synthesis
class SoundFXEngine {
  constructor() {
    this.ctx = null;
    this.enabled = typeof window !== 'undefined' ? localStorage.getItem('dostflix_sfx') !== 'false' : true;
    this.volume = typeof window !== 'undefined' ? parseFloat(localStorage.getItem('dostflix_sfx_vol') || '0.7') : 0.7;
    this.lastHoverTime = 0;
  }

  getContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dostflix_sfx', this.enabled ? 'true' : 'false');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('dostflix_sfx_vol', this.volume.toString());
    }
  }

  getVolume() {
    return this.volume;
  }

  // Generate pink/white noise buffer for percussions, shutters & claps
  getNoiseBuffer(ctx, duration = 0.5) {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Subtle, silky micro-tick for card/button hovers (throttled to avoid stutter on fast sweep)
  playHover() {
    if (!this.enabled || this.volume <= 0) return;
    const nowMs = Date.now();
    if (nowMs - this.lastHoverTime < 50) return; // 50ms throttle
    this.lastHoverTime = nowMs;

    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1750, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.018);

    const peakVol = 0.08 * this.volume;
    gain.gain.setValueAtTime(peakVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  }

  // 2. Tactile soft UI Pop / Bubble tick for general buttons & cards
  playPop() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

    const peakVol = 0.28 * this.volume;
    gain.gain.setValueAtTime(peakVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // 3. Crisp mechanical switch click for toggles, nav buttons, filters
  playClick() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.025);

    const peakVol = 0.22 * this.volume;
    gain.gain.setValueAtTime(peakVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // 4. Sparkling favorite / heart chime (musical dual-harmonic bloom)
  playFavorite(isFavorited = true) {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (isFavorited) {
      // Ascending sweet major third chime (C6 -> E6 with shimmer)
      const notes = [
        { freq: 1046.5, time: 0, dur: 0.18, vol: 0.22 },
        { freq: 1318.5, time: 0.06, dur: 0.28, vol: 0.26 }
      ];

      notes.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const effVol = vol * this.volume;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(effVol, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } else {
      // Soft unfavorite descending blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);

      const effVol = 0.16 * this.volume;
      gain.gain.setValueAtTime(effVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    }
  }

  // 5. Analog Camera Shutter Click (Dual-action mirror flip + curtain release)
  playShutter() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Stage 1: Mirror flip (mechanical high click)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.04);
    gain1.gain.setValueAtTime(0.35 * this.volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Stage 2: Curtain click (snappy release at t + 65ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const t2 = now + 0.065;
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(950, t2);
    osc2.frequency.exponentialRampToValueAtTime(80, t2 + 0.06);
    gain2.gain.setValueAtTime(0.4 * this.volume, t2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.06);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.07);

    // Soft mechanical noise snap
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx, 0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2 * this.volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  // 6. Netflix-style warm cinematic bass swell ("Tudum" chime)
  playTudum() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub-bass thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(85, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.45);
    gain1.gain.setValueAtTime(0.6 * this.volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Warm harmonic bloom
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(170, now);
    osc2.frequency.exponentialRampToValueAtTime(90, now + 0.35);
    gain2.gain.setValueAtTime(0.3 * this.volume, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.45);
  }

  // 7. Filtered airy swoosh for carousel pagination (MemoryRow scroll left/right)
  playSwoosh() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer(ctx, 0.15);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.07);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.14);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  // 8. 3-note playful rising cascade for story/polaroid shuffle
  playShuffle() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [440, 587.3, 739.9]; // A4 -> D5 -> F#5

    freqs.forEach((freq, idx) => {
      const start = now + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      const effVol = 0.18 * this.volume;
      gain.gain.setValueAtTime(effVol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.09);
    });
  }

  // 9. Resonant drop chime for Map pin drop / spot selection
  playPin() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.exponentialRampToValueAtTime(329.6, now + 0.18); // E4

    const effVol = 0.25 * this.volume;
    gain.gain.setValueAtTime(effVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // 10. Clean two-tone marimba chime for opening squad notifications
  playNotification() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0, dur: 0.15 },  // E5
      { freq: 987.77, time: 0.08, dur: 0.25 } // B5
    ];

    notes.forEach(({ freq, time, dur }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      const effVol = 0.22 * this.volume;
      gain.gain.setValueAtTime(effVol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  }

  // 11. Iconic F·R·I·E·N·D·S 4-Claps Sequence (t=0ms, 160ms, 320ms, 480ms)
  playClap() {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const clapTimes = [0, 0.16, 0.32, 0.48];
    const now = ctx.currentTime;

    clapTimes.forEach((delay) => {
      const startTime = now + delay;

      for (let burst = 0; burst < 3; burst++) {
        const flamTime = startTime + burst * 0.012;
        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(ctx, 0.12);

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1150 + Math.random() * 150, flamTime);
        filter.Q.setValueAtTime(2.8, flamTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime((burst === 2 ? 0.85 : 0.45) * this.volume, flamTime);
        gain.gain.exponentialRampToValueAtTime(0.001, flamTime + (burst === 2 ? 0.09 : 0.03));

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(flamTime);
        noise.stop(flamTime + 0.1);
      }
    });
  }
}

export const soundFx = new SoundFXEngine();
export default soundFx;
