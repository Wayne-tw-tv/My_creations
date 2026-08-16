export class AudioManager {
  constructor() {
    this.ctx = null;
    this.sfx = true;
    this.bgm = true;
    this.bgmPlaying = false;
    this.bgmNodes = [];
    this.step = 0;
    this.bgmTimer = 0;
  }

  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setSfx(on) {
    this.sfx = on;
  }

  setBgm(on) {
    this.bgm = on;
    if (on) this.startBgm();
    else this.stopBgm();
  }

  tone({ freq = 440, dur = 0.12, type = "sine", gain = 0.08, slideTo, delay = 0 }) {
    if (!this.sfx || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  flip() {
    this.tone({ freq: 520, dur: 0.07, type: "triangle", gain: 0.05 });
  }

  countdown(sec) {
    const freq = sec <= 1 ? 760 : 520;
    this.tone({ freq, dur: 0.08, type: "sine", gain: 0.06 });
  }

  match(combo = 1) {
    const base = 520 + Math.min(combo, 8) * 40;
    this.tone({ freq: base, dur: 0.12, type: "sine", gain: 0.09 });
    this.tone({ freq: base * 1.5, dur: 0.16, type: "triangle", gain: 0.05, delay: 0.05 });
  }

  miss() {
    this.tone({ freq: 180, dur: 0.16, type: "square", gain: 0.04, slideTo: 90 });
  }

  combo(n) {
    this.tone({ freq: 400 + n * 60, dur: 0.1, type: "sine", gain: 0.08 });
    this.tone({ freq: 600 + n * 70, dur: 0.14, type: "triangle", gain: 0.06, delay: 0.06 });
  }

  clear() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      this.tone({ freq, dur: 0.22, type: "sine", gain: 0.08, delay: i * 0.1 });
    });
  }

  victory() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((freq, i) => {
      this.tone({ freq, dur: 0.28, type: "triangle", gain: 0.07, delay: i * 0.12 });
    });
  }

  startBgm() {
    this.init();
    if (!this.ctx || this.bgmPlaying || !this.bgm) return;
    this.bgmPlaying = true;
    const scale = [392, 440, 494, 523, 587, 659, 784];
    const loop = () => {
      if (!this.bgmPlaying) return;
      const freq = scale[this.step % scale.length];
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = this.step % 2 === 0 ? freq : freq * 1.5;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.018, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.34);
      this.bgmNodes = [osc, g];
      this.step += 1;
      this.bgmTimer = setTimeout(loop, 420);
    };
    loop();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
    this.bgmTimer = 0;
    for (const node of this.bgmNodes) {
      try {
        node.stop?.();
        node.disconnect?.();
      } catch {
        /* already stopped */
      }
    }
    this.bgmNodes = [];
  }
}

export const audio = new AudioManager();
