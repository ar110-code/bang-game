// Procedural Web Audio API Western Sound Synthesizer
// 100% self-contained, zero-network latency, works on all modern browsers

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bang_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bang_sound_muted', String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * 🔫 Heavy Western Colt .45 Gunshot
   * Layered: Initial explosive transient, punchy sub bass kick, and reverberant saloon tail
   */
  public playGunshot(volume: number = 0.9): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Transient Click & Hammer
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(800, t);
    clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.03);
    clickGain.gain.setValueAtTime(0.5 * volume, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(t);
    clickOsc.stop(t + 0.04);

    // 2. Punchy Sub Kick (60-150Hz)
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(180, t);
    kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.15);
    kickGain.gain.setValueAtTime(0.9 * volume, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);
    kickOsc.start(t);
    kickOsc.stop(t + 0.25);

    // 3. Gunpowder Noise Blast (Filtered White Noise)
    const bufferSize = Math.floor(ctx.sampleRate * 0.4);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.setValueAtTime(1.8, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85 * volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(t);
    whiteNoise.stop(t + 0.38);

    // 4. Saloon Echo / Reverb Tail
    const echoGain = ctx.createGain();
    echoGain.gain.setValueAtTime(0.3 * volume, t + 0.05);
    echoGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    const echoFilter = ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.setValueAtTime(600, t);

    const echoNoise = ctx.createBufferSource();
    echoNoise.buffer = noiseBuffer;
    echoNoise.connect(echoFilter);
    echoFilter.connect(echoGain);
    echoGain.connect(ctx.destination);
    echoNoise.start(t + 0.04);
    echoNoise.stop(t + 0.6);
  }

  /**
   * 💨 Bullet Ricochet / Dodge (زپلشک!)
   * Iconic spaghetti-western whistling ricochet:  PEEE-YOOO-ting!
   */
  public playRicochet(volume: number = 0.75): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.28);
    osc.frequency.exponentialRampToValueAtTime(350, t + 0.45);

    gain.gain.setValueAtTime(0.6 * volume, t);
    gain.gain.linearRampToValueAtTime(0.8 * volume, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    // Add metallic ring
    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(3200, t + 0.02);
    ringGain.gain.setValueAtTime(0.35 * volume, t + 0.02);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    ring.connect(ringGain);
    ringGain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
    ring.start(t + 0.02);
    ring.stop(t + 0.3);
  }

  /**
   * 🍺 Saloon Beer Toast & Drink (نوشیدنی)
   * Glass clink toast followed by refreshing golden healing chime
   */
  public playBeerDrink(volume: number = 0.75): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Glass Clink
    const clink1 = ctx.createOscillator();
    const clink2 = ctx.createOscillator();
    const clinkGain = ctx.createGain();

    clink1.type = 'sine';
    clink1.frequency.setValueAtTime(2400, t);
    clink2.type = 'sine';
    clink2.frequency.setValueAtTime(3600, t);

    clinkGain.gain.setValueAtTime(0.6 * volume, t);
    clinkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    clink1.connect(clinkGain);
    clink2.connect(clinkGain);
    clinkGain.connect(ctx.destination);

    clink1.start(t);
    clink2.start(t);
    clink1.stop(t + 0.35);
    clink2.stop(t + 0.35);

    // Healing Arpeggio (E5, G#5, B5, E6)
    const notes = [659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      const noteTime = t + 0.08 + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.35 * volume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  }

  /**
   * 💥 Gatling Gun (مسلسل)
   * Rapid-fire staccato machine bursts
   */
  public playGatling(volume: number = 0.85): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Burst of 6 shots spaced 70ms
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.playGunshot(volume * 0.75);
      }, i * 70);
    }
  }

  /**
   * 🏹 Indians Arrow Volley (سرخ‌پوست‌ها)
   * Bowstring release snap followed by whistling flying arrow
   */
  public playArrow(volume: number = 0.75): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Bowstring snap
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(320, t);
    snapOsc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    snapGain.gain.setValueAtTime(0.7 * volume, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(t);
    snapOsc.stop(t + 0.09);

    // Whistling arrow whoosh
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t + 0.03);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.18);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.35);
    filter.Q.setValueAtTime(4.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, t + 0.03);
    gain.gain.linearRampToValueAtTime(0.65 * volume, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t + 0.03);
    noise.stop(t + 0.35);
  }

  /**
   * ⚔️ Duel Clash (دوئل)
   * Sharp metallic blade / barrel strike
   */
  public playDuelClash(volume: number = 0.8): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(1450, t);
    osc1.frequency.exponentialRampToValueAtTime(950, t + 0.2);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(2800, t);
    osc2.frequency.exponentialRampToValueAtTime(1800, t + 0.25);

    gain.gain.setValueAtTime(0.7 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.35);
    osc2.stop(t + 0.35);
  }

  /**
   * 🧨 Dynamite Detonation (دینامیت)
   * Deep low-end rumble + massive earth-shattering blast
   */
  public playExplosion(volume: number = 1.0): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Sub Bass Shockwave (50Hz -> 20Hz)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.5);
    subGain.gain.setValueAtTime(1.0 * volume, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.7);

    // 2. Blast Noise
    const bufferSize = Math.floor(ctx.sampleRate * 0.9);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.85);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.95 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.9);
  }

  /**
   * 🛡️ Barrel Heart Defense (بشکه)
   * Wooden block thud + magical heart shield chime
   */
  public playBarrelDefense(volume: number = 0.8): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Wooden thud
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(240, t);
    woodOsc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    woodGain.gain.setValueAtTime(0.8 * volume, t);
    woodGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(t);
    woodOsc.stop(t + 0.14);

    // Heart chime
    const chime = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1400, t + 0.05);
    chime.frequency.exponentialRampToValueAtTime(1760, t + 0.2);
    chimeGain.gain.setValueAtTime(0.5 * volume, t + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    chime.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chime.start(t + 0.05);
    chime.stop(t + 0.45);
  }

  /**
   * 🔥 Cat Balou Fire Burn (کت بالو)
   * Sizzling fire flame whoosh
   */
  public playFireBurn(volume: number = 0.75): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + 0.2);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.45);
    filter.Q.setValueAtTime(3.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.45);
  }

  /**
   * 🃏 Card Draw / Snap
   */
  public playCardSnap(volume: number = 0.5): void {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.035);

    gain.gain.setValueAtTime(0.4 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playCardDraw(volume?: number): void {
    this.playCardSnap(volume);
  }

  public playHeal(volume?: number): void {
    this.playBeerDrink(volume);
  }
}

export const soundEngine = new SoundEngine();
