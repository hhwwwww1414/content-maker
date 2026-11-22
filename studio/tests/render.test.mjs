// Real frames through the real guard. Slower than the unit tests, and the only proof the guard fires.
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {openSession} from '../lib/session.mjs';

const base = {id: 'guard-test', fps: 30, width: 1080, height: 1920, durationSeconds: 3, art: {direction: 'editorial'}, sources: [], audio: {}};
const words = (voice) => voice.split(' ').map((text, i) => ({text, startMs: 100 + i * 300, endMs: 350 + i * 300, timestampMs: null, confidence: null}));
const project = (voice, shot) => ({...base, captions: words(voice), scenes: [{id: 'a', start: 0, duration: 3, voice, onScreen: '', sources: [], direction: {purpose: 'explain', emotion: 'тест', concept: 'Проверка защиты кадра', hierarchy: {primary: 'x'}, shot, source: 'hide', camera: {move: 'still'}}}]});

const framesOf = async (p, frame) => {
  const dir = mkdtempSync(join(tmpdir(), 'guard-'));
  const session = await openSession(p, {qa: 'collect'});
  try {
    await session.still(frame, join(dir, 'f.jpg'), {scale: 0.25});
    return session.logs.filter((l) => l.startsWith('QA_FRAME ')).map((l) => JSON.parse(l.slice(9))).at(-1);
  } finally {
    await session.close();
    rmSync(dir, {recursive: true, force: true});
  }
};

test('the guard reports a collision by scene and frame', {timeout: 120000}, async () => {
  const shot = {type: 'collage', pieces: [
    {kind: 'note', box: [150, 500, 500, 300], cue: 0, text: 'Первая заметка'},
    {kind: 'note', box: [300, 600, 500, 300], cue: 0, text: 'Вторая заметка'},
  ]};
  const r = await framesOf(project('Проверка защиты кадра', shot), 60);
  assert.equal(r.scene, 'a');
  assert.equal(r.frame, 60);
  assert.ok(r.errors.some((e) => e.startsWith('Overlap')), JSON.stringify(r.errors));
});

test('a clean scene passes the guard', {timeout: 120000}, async () => {
  const shot = {type: 'type', layout: 'stack', anchor: 'center', headline: {text: 'Проверка *защиты* кадра', cue: 'Проверка'}};
  const r = await framesOf(project('Проверка защиты кадра', shot), 75);
  assert.deepEqual(r.errors, []);
  assert.ok(r.texts.length >= 1);
});

test('invalid scene props fail the render and name the scene', {timeout: 120000}, async () => {
  const bad = project('Проверка защиты кадра', {type: 'type', layout: 'nonsense', headline: {text: 'x'}});
  await assert.rejects(framesOf(bad, 10), /Invalid direction in scene "a"/);
});
