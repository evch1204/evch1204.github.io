/**
 * The soundtrack, synthesized in code: a soft felt-piano arpeggio on a beat
 * grid, a quiet pulse under it, and the film's sound effects placed from its
 * cue sheet (pen on paper, a drop in flight and landing, a pin springing up,
 * a click, a page sliding). Seeded noise only: the same cues give the same
 * audio every time. Writes a 48 kHz 16-bit stereo WAV; the loudness is set
 * when it is mixed into the film (see render.mjs).
 */
import { writeFileSync } from 'node:fs';

const SR = 48000;
const TAU = Math.PI * 2;

/** mulberry32: a small seeded generator for the noise. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An RBJ biquad: 'lp', 'hp' or 'bp'. */
class Biquad {
  constructor(type, f0, q) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(f0, q);
  }
  set(f0, q) {
    const w0 = (TAU * Math.min(f0, SR * 0.45)) / SR;
    const alpha = Math.sin(w0) / (2 * q);
    const c = Math.cos(w0);
    let b0, b1, b2;
    if (this.type === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
    else if (this.type === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
    else [b0, b1, b2] = [alpha, 0, -alpha];
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Mix {
  constructor(duration, seed = 7) {
    this.n = Math.ceil(duration * SR);
    this.L = new Float64Array(this.n);
    this.R = new Float64Array(this.n);
    this.rnd = seeded(seed);
  }

  /** Adds `gen(i)` (i in samples from `at`) for `dur` seconds, panned -1..1. */
  add(at, dur, gen, pan = 0) {
    const start = Math.round(at * SR);
    const len = Math.min(this.n - start, Math.round(dur * SR));
    const gl = Math.cos(((pan + 1) / 4) * TAU);
    const gr = Math.sin(((pan + 1) / 4) * TAU);
    for (let i = 0; i < len; i++) {
      const v = gen(i, i / SR);
      this.L[start + i] += v * gl;
      this.R[start + i] += v * gr;
    }
  }

  /** A struck string: a few harmonics, each with its own decay, and a short attack. */
  tone(at, freq, gain, { decay = 0.6, attack = 0.004, pan = 0, harmonics = [1, 0.4, 0.15, 0.06] } = {}) {
    const dur = decay * 5;
    this.add(
      at,
      dur,
      (i, t) => {
        const env = Math.min(1, t / attack);
        let v = 0;
        for (let h = 0; h < harmonics.length; h++) {
          const d = decay / (1 + h * 0.8);
          v += harmonics[h] * Math.sin(TAU * freq * (h + 1) * t) * Math.exp(-t / d);
        }
        return v * env * gain;
      },
      pan,
    );
  }

  /** Noise through a filter, shaped by `env(t)`; the filter may be re-tuned each sample with `sweep(t)`. */
  noise(at, dur, gain, { type = 'bp', f0 = 2000, q = 1, env = () => 1, sweep, pan = 0 } = {}) {
    const f = new Biquad(type, f0, q);
    this.add(
      at,
      dur,
      (i, t) => {
        if (sweep && i % 32 === 0) f.set(sweep(t), q);
        return f.run(this.rnd() * 2 - 1) * env(t) * gain;
      },
      pan,
    );
  }

  /** A sine whose pitch glides from `f1` to `f2`. */
  glide(at, dur, f1, f2, gain, { decay = dur, pan = 0 } = {}) {
    this.add(
      at,
      dur,
      (i, t) => {
        const u = Math.min(1, t / dur);
        const f = f1 * Math.pow(f2 / f1, u);
        // Phase is the integral of the glide, so the pitch is what it says.
        const phase = (TAU * f1 * dur * (Math.pow(f2 / f1, u) - 1)) / Math.log(f2 / f1);
        return Math.sin(phase) * Math.exp(-t / decay) * gain;
      },
      pan,
    );
  }

  fade(inSeconds, outSeconds) {
    const a = Math.round(inSeconds * SR);
    const b = Math.round(outSeconds * SR);
    for (let i = 0; i < a && i < this.n; i++) {
      const g = i / a;
      this.L[i] *= g;
      this.R[i] *= g;
    }
    for (let i = 0; i < b && i < this.n; i++) {
      const g = i / b;
      this.L[this.n - 1 - i] *= g;
      this.R[this.n - 1 - i] *= g;
    }
  }

  /** The WAV, peak-normalised to -1 dBFS; loudness is set in the mix. */
  write(path) {
    let peak = 1e-9;
    for (let i = 0; i < this.n; i++) peak = Math.max(peak, Math.abs(this.L[i]), Math.abs(this.R[i]));
    const g = Math.pow(10, -1 / 20) / peak;
    const data = Buffer.alloc(this.n * 4);
    for (let i = 0; i < this.n; i++) {
      data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, this.L[i] * g)) * 32767), i * 4);
      data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, this.R[i] * g)) * 32767), i * 4 + 2);
    }
    const h = Buffer.alloc(44);
    h.write('RIFF', 0);
    h.writeUInt32LE(36 + data.length, 4);
    h.write('WAVE', 8);
    h.write('fmt ', 12);
    h.writeUInt32LE(16, 16);
    h.writeUInt16LE(1, 20);
    h.writeUInt16LE(2, 22);
    h.writeUInt32LE(SR, 24);
    h.writeUInt32LE(SR * 4, 28);
    h.writeUInt16LE(4, 32);
    h.writeUInt16LE(16, 34);
    h.write('data', 36);
    h.writeUInt32LE(data.length, 40);
    writeFileSync(path, Buffer.concat([h, data]));
  }
}

/* ---- The music: four bars that come round, in C, on a felt piano ---- */

/** MIDI notes: Cmaj7, Am7, Fmaj7, G6, an octave around middle C. */
const CHORDS = [
  [60, 64, 67, 71],
  [57, 60, 64, 67],
  [53, 57, 60, 64],
  [55, 59, 62, 64],
];
const ARP = [0, 1, 2, 3, 2, 1, 3, 2];
const VEL = [1, 0.55, 0.75, 0.55, 0.85, 0.5, 0.7, 0.55];

export function music(mix, { duration, bpm = 120, from = 0, gain = 1 }) {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const bars = Math.ceil((duration - from) / bar);
  for (let b = 0; b < bars; b++) {
    const chord = CHORDS[b % CHORDS.length];
    const t0 = from + b * bar;
    for (let s = 0; s < 8; s++) {
      const at = t0 + (s * beat) / 2;
      if (at >= duration) break;
      mix.tone(at, midi(chord[ARP[s]]), 0.11 * VEL[s] * gain, { decay: 0.55, pan: (s % 2 ? 0.25 : -0.25) * 0.6 });
    }
    // The root, low and long, on one and three; the fifth on three for the second half of the loop.
    const root = chord[0] - 24;
    mix.tone(t0, midi(root), 0.14 * gain, { decay: 0.9, harmonics: [1, 0.2] });
    mix.tone(t0 + 2 * beat, midi(b % 2 ? root + 7 : root), 0.1 * gain, { decay: 0.8, harmonics: [1, 0.2] });
    // A brushed pulse: a soft thump on one and three, a whisper of hat on the off-beats.
    for (let q = 0; q < 4; q++) {
      const at = t0 + q * beat;
      if (q % 2 === 0) mix.glide(at, 0.16, 95, 42, 0.085 * gain, { decay: 0.07 });
      mix.noise(at + beat / 2, 0.03, 0.02 * gain, { type: 'hp', f0: 7000, q: 0.7, env: (t) => Math.exp(-t / 0.008) });
    }
  }
}

/* ---- The effects, by cue name ---- */

const SFX = {
  /** Pen on paper: hissing graphite, breathing a little, for as long as the line is written. */
  scratch(mix, c) {
    const dur = c.dur ?? 0.5;
    const g = c.gain ?? 1;
    mix.noise(c.at, dur, 0.11 * g, {
      type: 'bp',
      f0: 2600,
      q: 0.7,
      env: (t) => Math.min(1, t / 0.03) * Math.min(1, (dur - t) / 0.09) * (0.72 + 0.28 * Math.sin(TAU * 6.5 * t) * Math.sin(TAU * 1.3 * t + 1)),
    });
  },
  /** A drop through the air: a hush that rises in pitch. */
  whoosh(mix, c) {
    const dur = c.dur ?? 0.7;
    mix.noise(c.at, dur, 0.17, {
      type: 'bp',
      f0: 300,
      q: 1.4,
      env: (t) => Math.pow(Math.sin((Math.PI * Math.min(1, t / dur)) ** 0.8), 1.4),
      sweep: (t) => 250 * Math.pow(10, Math.min(1, t / dur)),
    });
  },
  /** A drop landing: a plip, and a dot of noise as it hits. */
  plip(mix, c) {
    mix.glide(c.at, 0.09, 1250, 380, 0.32, { decay: 0.045 });
    mix.noise(c.at, 0.012, 0.08, { type: 'hp', f0: 3000, q: 0.7, env: (t) => Math.exp(-t / 0.004) });
  },
  /** Something springing up and settling: a pitch that rises and stops. */
  pop(mix, c) {
    mix.glide(c.at, 0.07, 320, 560, 0.13, { decay: 0.06 });
  },
  /** A click, a tick of the pointer over a thing. */
  click(mix, c) {
    mix.noise(c.at, 0.008, 0.11 * (c.gain ?? 1), { type: 'hp', f0: 4000, q: 0.7, env: (t) => Math.exp(-t / 0.0025) });
    mix.tone(c.at, 2300, 0.035 * (c.gain ?? 1), { decay: 0.012, harmonics: [1] });
  },
  /** A sheet sliding: low air for as long as the page moves. */
  swish(mix, c) {
    const dur = c.dur ?? 1;
    mix.noise(c.at, dur, 0.06, {
      type: 'lp',
      f0: 700,
      q: 0.7,
      env: (t) => Math.pow(Math.sin(Math.PI * Math.min(1, t / dur)), 1.2),
      sweep: (t) => 500 + 900 * Math.sin(Math.PI * Math.min(1, t / dur)),
    });
  },
};

/**
 * Renders the whole soundtrack for a film: music from `from` seconds, the
 * cues on top, a fade in and out. Returns the path written.
 */
export function renderAudio({ duration, bpm = 120, cues = [], out, musicFrom = 0, musicGain = 1, seed = 7 }) {
  const mix = new Mix(duration, seed);
  music(mix, { duration, bpm, from: musicFrom, gain: musicGain });
  for (const c of cues) {
    const fx = SFX[c.name];
    if (!fx) throw new Error(`no such sound: ${c.name}`);
    if (c.at < duration) fx(mix, c);
  }
  mix.fade(0.02, 1.4);
  mix.write(out);
  return out;
}
