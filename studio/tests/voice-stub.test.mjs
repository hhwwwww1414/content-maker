// The whole "buy a take → cache → timings" path against a local stub. No key, no network, no quota.
import assert from 'node:assert/strict';
import {spawn, spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {test} from 'node:test';
import {ROOT} from '../lib/project.mjs';

const ID = 'test-voice-stub';
const run = (env, file) => new Promise((done) => {
  // spawnSync would block the stub server in this same process.
  const child = spawn('node', ['studio/voice.mjs', file, ...(env.CACHE_ONLY ? ['--cache-only'] : [])], {cwd: ROOT, env: {...process.env, ...env}});
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  child.on('close', (status) => done({status, out}));
});

test('voice path: quota check, synthesis once, then cache only', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stub-'));
  const mp3 = join(dir, 'tone.mp3');
  const seconds = 26;
  const made = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `sine=frequency=220:duration=${seconds}`, '-ar', '44100', mp3]);
  assert.equal(made.status, 0);
  const scenes = [
    {id: 'a', voice: 'Первая сцена говорит.', sources: ['s']},
    {id: 'b', voice: 'Вторая сцена отвечает.', sources: ['s']},
  ];
  const text = scenes.map((s) => s.voice).join(' ');
  const step = seconds / text.length;
  const alignment = {
    characters: [...text],
    character_start_times_seconds: [...text].map((_, i) => i * step),
    character_end_times_seconds: [...text].map((_, i) => (i + 1) * step - .001),
  };
  let synth = 0;
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url.startsWith('/v1/user/subscription')) return res.end(JSON.stringify({character_limit: 10000, character_count: 0}));
    synth++;
    res.end(JSON.stringify({audio_base64: readFileSync(mp3).toString('base64'), alignment}));
  });
  await new Promise((r) => server.listen(0, r));
  const env = {ELEVENLABS_BASE_URL: `http://127.0.0.1:${server.address().port}`, ELEVENLABS_API_KEY: 'stub', ELEVENLABS_API_KEY_2: '', ELEVENLABS_API_KEY_3: '', ELEVENLABS_VOICE_ID: 'stub-voice'};
  const file = join(dir, 'p.json');
  const project = {id: ID, fps: 30, width: 1080, height: 1920, status: {factCheck: 'reviewed', scriptApproval: 'approved'}, scenes, audio: {modelId: 'stub'}, captions: []};
  const generated = resolve(ROOT, 'public/generated', ID), cache = resolve(ROOT, 'runs/studio', ID);
  try {
    writeFileSync(file, JSON.stringify(project));
    const first = await run(env, file);
    assert.equal(first.status, 0, first.out);
    assert.equal(synth, 1);
    const saved = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(saved.captions.length, 6);
    assert.ok(saved.scenes[1].start > 0 && saved.durationSeconds >= 25 && saved.durationSeconds <= 35);
    assert.ok(existsSync(resolve(ROOT, 'public', saved.audio.voicePath)));
    assert.equal(readdirSync(resolve(cache, 'voice-cache')).length, 1);

    const second = await run(env, file);
    assert.equal(second.status, 0, second.out);
    assert.match(second.out, /Reusing cached/);
    assert.equal(synth, 1, 'a re-run must not synthesise again');

    writeFileSync(file, JSON.stringify({...project, status: {factCheck: 'partial', scriptApproval: 'demo'}}));
    const blocked = await run(env, file);
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.out, /approval/);

    writeFileSync(file, JSON.stringify({...project, scenes: [{...scenes[0], voice: 'Другой текст совсем.'}, scenes[1]]}));
    const miss = await run({...env, CACHE_ONLY: '1'}, file);
    assert.notEqual(miss.status, 0);
    assert.match(miss.out, /No cached take/);
    assert.equal(synth, 1);
  } finally {
    server.close();
    rmSync(generated, {recursive: true, force: true});
    rmSync(cache, {recursive: true, force: true});
    rmSync(dir, {recursive: true, force: true});
  }
});
