// Run: node --no-warnings --test 'studio/tests/*.test.mjs'
import assert from 'node:assert/strict';
import {readFileSync, existsSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {cueSeconds, normWord} from '../../src/editorial/kit/cue.ts';
import {buildPages, PAGE} from '../../src/editorial/kit/pages.ts';
import {themes} from '../../src/editorial/kit/themes.ts';
import {ROOT, STANDARDS, applyWordTimings, gateFor, scriptHash} from '../lib/project.mjs';
import {refineOnsets} from '../lib/onsets.mjs';
import {compareImages, passes} from '../visual-test.mjs';

const catalog = JSON.parse(readFileSync(resolve(ROOT, 'studio/lib/visual-catalog.json'), 'utf8'));
const validate = (project, stage = 'script') => {
  const file = join(mkdtempSync(join(tmpdir(), 'reel-')), 'p.json');
  writeFileSync(file, JSON.stringify(project));
  return spawnSync('python3', ['studio/pipeline.py', 'validate', file, `--stage=${stage}`], {cwd: ROOT, encoding: 'utf8'});
};
const scene = (id, layer, extra = {}) => ({id, voice: 'Кадр снят сейчас.', thought: 't', animation: 'a', onScreen: 'X', sources: ['s'], visual: {layers: [{type: layer, cue: 'кадр'}]}, ...extra});
const project = (scenes) => ({id: 'x', topic: 't', niche: 'n', sources: [{id: 's'}], status: {}, centralIdea: 'c', scenes, audio: {}});

const channel = (c) => { const s = c / 255; return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return .2126 * channel(n >> 16) + .7152 * channel((n >> 8) & 255) + .0722 * channel(n & 255); };
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + .05) / (lo + .05); };

test('registry, catalog and themes agree', () => {
  const registry = readFileSync(resolve(ROOT, 'src/editorial/kit/registry.tsx'), 'utf8').match(/layerRegistry[^{]*\{([^}]*)\}/s)[1];
  assert.deepEqual(registry.match(/\b(\w+):/g).map((k) => k.slice(0, -1)).sort(), [...catalog.layers].sort());
  assert.deepEqual(Object.keys(themes).sort(), [...catalog.themes].sort());
});

test('every theme meets the readability contrast', () => {
  const min = STANDARDS.readability.minContrast;
  for (const [name, t] of Object.entries(themes)) {
    for (const [fg, bg] of [[t.ink, t.bg], [t.muted, t.bg], [t.captionInk, t.captionBg], [t.captionHot, t.captionBg], [t.onAccent, t.accent]]) {
      assert.ok(contrast(fg, bg) >= min, `${name}: ${fg} on ${bg} = ${contrast(fg, bg).toFixed(2)}`);
    }
  }
});

test('voice cues resolve to spoken words and never miss silently', () => {
  const words = ['Кадр', 'и', 'ещё', 'кадр.'].map((text, i) => ({text, norm: normWord(text), startMs: 1000 + i * 500, endMs: 1400 + i * 500}));
  assert.equal(cueSeconds('кадр', words, 1), 0);
  assert.equal(cueSeconds('кадр#2', words, 1), 1.5);
  assert.equal(cueSeconds('ещё', words, 1), 1);
  assert.equal(cueSeconds(2.5, words, 1), 2.5);
  assert.throws(() => cueSeconds('нет', words, 1), /not spoken/);
});

test('caption pages stay short and break at sentence ends', () => {
  const words = 'Первое короткое. Второе предложение здесь длиннее обычного и продолжается дальше'.split(' ').map((text, i) => ({text, startMs: i * 300, endMs: i * 300 + 250}));
  const pages = buildPages(words);
  assert.equal(pages[0].at(-1).text, 'короткое.');
  for (const page of pages) {
    assert.ok(page.length <= PAGE.maxWords);
    assert.ok(page.length === 1 || page.map((w) => w.text).join(' ').length <= PAGE.maxChars);
  }
});

test('timeline comes from audio and rejects out-of-range takes', () => {
  const p = {fps: 30, scenes: [{voice: 'раз два'}, {voice: 'три'}]};
  const words = (scale) => [0, 1, 2].map((i) => ({startMs: i * scale, endMs: i * scale + 400}));
  applyWordTimings(p, words(12000), 25);
  assert.equal(p.scenes[1].start, 24);
  assert.equal(p.scenes[0].duration, 24);
  assert.equal(p.scenes[0].duration + p.scenes[1].duration, p.durationSeconds);
  assert.throws(() => applyWordTimings(p, words(1000), 3), /outside 25–35/);
  assert.throws(() => applyWordTimings(p, words(1000).slice(1), 28), /Timing mismatch/);
});

test('per-project limits override the standard', () => {
  const p = {fps: 30, limits: {minSeconds: 20, maxSeconds: 25}, scenes: [{voice: 'раз'}]};
  applyWordTimings(p, [{startMs: 0, endMs: 20000}], 21);
  assert.ok(p.durationSeconds < 25);
});

test('onset refinement moves words out of silence, and only forward', () => {
  const envelope = new Float32Array(100);
  envelope.fill(.2, 40, 60);
  const [word, silent] = refineOnsets([{startMs: 100, endMs: 200}, {startMs: 700, endMs: 800}], {envelope, rms: .1});
  assert.equal(word.startMs, 400);
  assert.ok(word.endMs > word.startMs);
  assert.equal(silent.startMs, 700);
});

test('onset refinement clamps a pre-roll token to zero', () => {
  const envelope = new Float32Array(100).fill(.2);
  const [word] = refineOnsets([{startMs: -20, endMs: 300}], {envelope, rms: .1});
  assert.equal(word.startMs, 0);
});

test('approval gates: paid voice needs a real approval, editing the script voids it', () => {
  const p = {scenes: [{voice: 'текст'}], status: {factCheck: 'partial', scriptApproval: 'demo'}};
  assert.deepEqual([gateFor(p).mayRender, gateFor(p).mayBuyVoice, gateFor(p).publishReady], [true, false, false]);
  assert.equal(gateFor({...p, status: {}}).mayRender, false);
  const approved = {scenes: [{voice: 'текст'}], status: {factCheck: 'reviewed', scriptApproval: 'approved', approvedScriptHash: scriptHash(p)}};
  assert.equal(gateFor(approved).mayBuyVoice, true);
  approved.scenes[0].voice = 'другой текст';
  assert.equal(gateFor(approved).mayRender, false);
});

test('validator rejects repetition, unspoken cues and unknown layers', () => {
  assert.equal(validate(project([scene('a', 'tv'), scene('b', 'phone')])).status, 0);
  assert.match(validate(project([scene('a', 'tv'), scene('b', 'tv')])).stdout, /repeats the visual recipe/);
  assert.match(validate(project([scene('a', 'hologram')])).stdout, /unknown layer/);
  const badCue = scene('a', 'tv');
  badCue.visual.layers[0].cue = 'телевизор';
  assert.match(validate(project([badCue])).stdout, /not spoken/);
  const noCue = scene('a', 'tv');
  delete noCue.visual.layers[0].cue;
  assert.match(validate(project([noCue])).stdout, /no voice cues/);
});

test('validator keeps fact and approval gates at the full stage', () => {
  const out = validate(project([{...scene('a', 'tv'), start: 0, duration: 30}]), 'full').stdout;
  assert.match(out, /Facts require editorial review/);
  assert.match(out, /Script requires approval/);
});

test('image comparison passes identical frames and catches a changed block', () => {
  const make = () => ({width: 32, height: 32, channels: 3, data: new Uint8Array(32 * 32 * 3).fill(40)});
  const a = make(), b = make();
  assert.ok(passes(compareImages(a, b)));
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) b.data[(y * 32 + x) * 3] = 200;
  assert.ok(!passes(compareImages(a, b)));
});

test('demo projects carry measured audio, not estimates', () => {
  for (const id of ['demo-tv-acr', 'demo-self-ban']) {
    const p = JSON.parse(readFileSync(resolve(ROOT, `studio/projects/${id}.json`), 'utf8'));
    assert.ok(existsSync(resolve(ROOT, 'public', p.audio.voicePath)), id);
    assert.equal(gateFor(p).publishReady, false);
    assert.equal(p.captions.map((c) => c.text).join(' '), p.scenes.map((s) => s.voice).join(' '));
  }
});
