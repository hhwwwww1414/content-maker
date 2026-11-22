#!/usr/bin/env node
// Writes the engine's sound library. Everything is synthesised here from seeded noise and sines, so it is our own
// material and the same bytes come out every time. Listen before relying on it: a machine cannot judge taste.
import {writeFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const SR = 48000;
let seed = 90210;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
const buf = (seconds) => new Float32Array(Math.round(seconds * SR));
const wav = (samples, file) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32000), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};
const lowpass = (s, cutoff) => { let y = 0; return s.map((x, i) => { const c = typeof cutoff === 'function' ? cutoff(i / s.length) : cutoff; const a = 1 - Math.exp(-2 * Math.PI * c / SR); y += a * (x - y); return y; }); };
const norm = (s, peak = 0.8) => { const m = s.reduce((a, b) => Math.max(a, Math.abs(b)), 1e-6); return s.map((v) => (v / m) * peak); };

const whoosh = () => {
  const s = buf(0.55).map((_, i, a) => { const t = i / a.length; return rnd() * Math.sin(Math.PI * t) ** 2.4; });
  return norm(lowpass(s, (t) => 300 + 5200 * Math.sin(Math.PI * t) ** 2), 0.7);
};
const swish = () => {
  const s = buf(0.32).map((_, i, a) => { const t = i / a.length; return rnd() * (1 - t) ** 2 * Math.min(1, t * 22); });
  return norm(lowpass(s, (t) => 7000 - 5500 * t), 0.55);
};
const thud = () => norm(buf(0.45).map((_, i) => { const t = i / SR; return (Math.sin(2 * Math.PI * (58 + 90 * Math.exp(-t * 28)) * t) * Math.exp(-t * 11) + rnd() * 0.25 * Math.exp(-t * 60)); }), 0.85);
const tick = () => norm(buf(0.09).map((_, i) => { const t = i / SR; return Math.sin(2 * Math.PI * 1700 * t) * Math.exp(-t * 90) + rnd() * 0.3 * Math.exp(-t * 240); }), 0.5);
const stamp = () => norm(buf(0.4).map((_, i) => { const t = i / SR; return Math.sin(2 * Math.PI * 92 * t) * Math.exp(-t * 26) + rnd() * 0.7 * Math.exp(-t * 48); }), 0.85);
const pop = () => norm(buf(0.16).map((_, i) => { const t = i / SR; return Math.sin(2 * Math.PI * (420 + 520 * t * 6) * t) * Math.exp(-t * 34); }), 0.5);

/** A slow chord bed that loops without a seam: each partial completes whole cycles over the loop. */
const bed = (seconds, chords, wobble = 0.02) => {
  const out = buf(seconds);
  const hold = seconds / chords.length;
  chords.forEach((chord, c) => {
    for (const hz of chord) {
      const phase = rnd() * Math.PI;
      for (let i = 0; i < out.length; i++) {
        const t = i / SR;
        // Cross-fade between chords with raised cosines that wrap around the loop.
        const center = (c + 0.5) * hold;
        const d = Math.min(Math.abs(t - center), seconds - Math.abs(t - center)) / hold;
        const env = d < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * d) : 0;
        if (!env) continue;
        const f = Math.round(hz * seconds) / seconds;
        out[i] += env * (Math.sin(2 * Math.PI * f * t + phase) * 0.7 + Math.sin(2 * Math.PI * 2 * f * t + phase) * 0.18 + Math.sin(2 * Math.PI * (f + wobble * 10) * t) * 0.12);
      }
    }
  });
  return norm(lowpass(out, 1400), 0.55);
};
const sounds = {
  whoosh, swish, thud, tick, stamp, pop,
  'bed-tense': () => bed(32, [[55, 82.4, 130.8], [51.9, 77.8, 123.5], [55, 87.3, 130.8], [49, 73.4, 116.5]]),
  'bed-warm': () => bed(32, [[65.4, 98, 164.8], [55, 110, 164.8], [73.4, 110, 174.6], [61.7, 92.5, 155.6]]),
  'bed-pulse': () => { const b = bed(32, [[55, 110, 138.6], [61.7, 123.5, 146.8]]); return norm(b.map((v, i) => v * (0.55 + 0.45 * Math.max(0, Math.cos(2 * Math.PI * (Math.round(1.5 * 32) / 32) * (i / SR))) ** 6)), 0.55); },
};
// Later additions take their own seed and can be written alone: `node studio/synth-audio.mjs name ...`, so existing sounds keep their bytes.
const seeded = (n, make) => () => { seed = n; return make(); };
const hushed = (x) => x * x * (3 - 2 * x);
const curve = (points, t) => {
  const i = points.findIndex(([at]) => at > t);
  if (i <= 0) return i === 0 ? points[0][1] : points[points.length - 1][1];
  const [a, va] = points[i - 1], [b, vb] = points[i];
  return va + (vb - va) * hushed((t - a) / (b - a));
};
Object.assign(sounds, {
  // A phone buzzing on a table, heard from across the room.
  'notify-muted': seeded(101, () => norm(lowpass(buf(0.62).map((_, i) => { const t = i / SR; const gate = (t < 0.2 || (t > 0.3 && t < 0.5)) ? Math.sin(Math.PI * Math.min(1, ((t < 0.25 ? t : t - 0.3) / 0.2))) : 0; return gate * (Math.sin(2 * Math.PI * 168 * t) + 0.35 * Math.sin(2 * Math.PI * 336 * t) + rnd() * 0.05); }), 900), 0.5)),
  'impact-sub': seeded(102, () => norm(buf(1.1).map((_, i) => { const t = i / SR; return Math.sin(2 * Math.PI * (38 + 42 * Math.exp(-t * 16)) * t) * Math.exp(-t * 4.4) + lowpass([rnd()], 800)[0] * 0.05 * Math.exp(-t * 40); }), 0.9)),
  // Thick glass under a weight: a dull knock with a few short, dark ringing partials, not a bright smash.
  'glass-crack': seeded(103, () => { const parts = [1830, 2470, 3120, 3990, 5210]; const dust = lowpass(buf(0.5).map((_, i) => { const t = i / SR; return rnd() * Math.exp(-t * 34); }), 3400); return norm(dust.map((d, i) => { const t = i / SR; return d * 0.8 + parts.reduce((sum, hz, k) => sum + Math.sin(2 * Math.PI * hz * t + k) * Math.exp(-t * (30 + k * 14)) * 0.16, 0) + Math.sin(2 * Math.PI * 92 * t) * Math.exp(-t * 18) * 0.7; }), 0.72); }),
  'screen-off': seeded(104, () => norm(buf(0.2).map((_, i) => { const t = i / SR; return Math.sin(2 * Math.PI * 310 * t) * Math.exp(-t * 60) + rnd() * 0.08 * Math.exp(-t * 140); }), 0.4)),
  // Scored to the take of gambling-loss-trap-claude: a low room tone that closes in, a pulse under the corridor, then it empties out before the last line.
  'bed-loss-trap': seeded(105, () => {
    const seconds = 42;
    const level = [[0, 0.32], [5, 0.42], [11.4, 0.6], [20.2, 0.86], [21, 0.5], [29, 0.8], [35.4, 1], [36.2, 0.3], [38, 0.03], [39.2, 0]];
    const pulse = [[0, 0], [11, 0], [14, 0.55], [20.2, 1], [20.4, 0], [29, 0], [33, 0.7], [35.4, 1], [35.6, 0]];
    const rumble = lowpass(buf(seconds).map(() => rnd()), 130);
    let rms = 0;
    for (const v of rumble) rms = Math.max(rms, Math.abs(v));
    return norm(buf(seconds).map((_, i) => {
      const t = i / SR;
      const beat = (t * (0.72 + t * 0.012)) % 1;
      const thump = Math.sin(2 * Math.PI * 47 * beat / 0.72) * Math.exp(-beat * 11);
      const drone = Math.sin(2 * Math.PI * 41.2 * t) * 0.5 + Math.sin(2 * Math.PI * 61.9 * t + 0.6 * Math.sin(t * 0.21)) * 0.3 + Math.sin(2 * Math.PI * 82.9 * t) * 0.16 + Math.sin(2 * Math.PI * 123.7 * t + Math.sin(t * 0.37)) * 0.05;
      return curve(level, t) * (drone + (rumble[i] / rms) * 0.34) + curve(pulse, t) * curve(level, t) * thump * 0.7;
    }), 0.6);
  }),
});
const only = process.argv.slice(2);
for (const name of only) if (!sounds[name]) throw Error(`Unknown sound ${name}`);
const dir = mkdtempSync(join(tmpdir(), 'synth-'));
for (const [name, make] of Object.entries(sounds)) {
  if (only.length && !only.includes(name)) continue;
  const file = join(dir, `${name}.wav`);
  wav(make(), file);
  const kind = name.startsWith('bed') ? 'music' : 'sfx';
  const r = spawnSync('node', ['studio/assets.mjs', 'add', name, '--file', file, '--kind', kind, '--license', 'Own work: synthesised by studio/synth-audio.mjs', '--author', 'Content Maker', '--source', 'studio/synth-audio.mjs', '--tags', 'audio,generated'], {encoding: 'utf8'});
  if (r.status !== 0) throw Error(r.stderr);
  console.log(r.stdout.trim());
}
