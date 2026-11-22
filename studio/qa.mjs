#!/usr/bin/env node
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readPng, luminanceStats} from '../scripts/eleven/lib/png.mjs';
import {ROOT as root, STANDARDS, gateFor, limitsFor, loadProject, projectPath, saveProject} from './lib/project.mjs';
import {onsetsOf, shareOnBeat} from './lib/beats.mjs';

const argv = process.argv.slice(2);
if (argv.length < 1 || argv.length > 2) throw Error('Usage: node studio/qa.mjs <project.json> [preview|production]');
const projectFile = projectPath(argv[0]);
const p = loadProject(projectFile);
const mode = argv[1] || 'production';
if (!['preview', 'production'].includes(mode)) throw Error('Usage: node studio/qa.mjs <project.json> [preview|production]');
const limits = limitsFor(p);
const fmt = STANDARDS.format;
const isKit = p.scenes.some((s) => s.visual || s.component || s.direction);
const rel = (name) => `out/studio/${p.id}${name}`;
const video = resolve(root, mode === 'preview' ? rel('-preview.mp4') : rel('.mp4'));
if (!existsSync(video)) throw Error('Missing ' + video);
const run = (name, args, binary = false) => {
  const r = spawnSync('npx', ['remotion', name, ...args], {cwd: root, encoding: binary ? undefined : 'utf8', maxBuffer: 400 * 1024 * 1024});
  if (r.status !== 0) throw Error(name + ' failed: ' + String(r.stderr || r.stdout).slice(-1500));
  return r;
};
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', video]).stdout);
const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
const seconds = Number(probe.format.duration);
const expectedText = p.scenes.map((s) => s.voice).join(' ');
const hasVoice = p.captions.length > 0;
// Music only: nothing is spoken, no caption is drawn, and the words are timed to the track.
const musicOnly = p.audio?.mode === 'music';
const checks = {
  dimensions: v?.width === (mode === 'preview' ? fmt.previewWidth : fmt.width) && v?.height === (mode === 'preview' ? fmt.previewHeight : fmt.height),
  fps: v?.r_frame_rate === `${p.fps}/1`, h264: v?.codec_name === fmt.codec,
  duration: seconds >= limits.minSeconds && seconds <= limits.maxSeconds + 0.1 && Math.abs(seconds - p.durationSeconds) < .1,
  audio: mode === 'preview' || !!a,
  approval: gateFor(p).mayRender,
  sources: p.scenes.every((s) => s.sources?.length && s.sources.every((id) => p.sources.some((source) => source.id === id))),
  sceneTiming: p.scenes.every((s, i) => i === 0 ? s.start === 0 : Math.abs(s.start - (p.scenes[i - 1].start + p.scenes[i - 1].duration)) < .001),
  captions: mode === 'preview' || hasVoice,
  captionText: !hasVoice || p.captions.map((c) => c.text).join(' ') === expectedText,
  captionTiming: !hasVoice || p.captions.every((c, i) => c.startMs >= 0 && c.endMs > c.startMs && c.endMs <= seconds * 1000 + 50 && (!i || c.startMs >= p.captions[i - 1].startMs)),
};

const frameDir = resolve(root, 'out/studio/qa-frames', p.id, mode); mkdirSync(frameDir, {recursive: true});
const sampleTimes = [0, ...p.scenes.flatMap((s) => [s.start + .12, s.start + s.duration * .6]), ...p.scenes.slice(1).flatMap((s) => [s.start - 1 / p.fps, s.start]), Math.max(0, seconds - .15)];
const k = v.width / fmt.width;
const luminance = (r, g, b) => {
  const f = (c) => { const s = c / 255; return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
};
// Caption readability from pixels: ink against plate in the centre of the caption, which always holds text.
const plate = {x: Math.round(300 * k), y: Math.round(1440 * k), width: Math.round(480 * k), height: Math.round(110 * k)};
const sceneAt = (ms) => [...p.scenes].reverse().find((s) => ms / 1000 >= s.start) ?? p.scenes[0];
// Directed captions stand on the band's lower edge, or at the top of the frame in the high zone.
const plateFor = (ms) => {
  const captions = sceneAt(ms).direction?.captions;
  if (!sceneAt(ms).direction) return plate;
  return captions?.zone === 'high' ? {x: Math.round(420 * k), y: Math.round(225 * k), width: Math.round(240 * k), height: Math.round(50 * k)} : {x: Math.round(420 * k), y: Math.round(1525 * k), width: Math.round(240 * k), height: Math.round(50 * k)};
};
const captionContrast = (png, plate) => {
  const values = [];
  for (let y = plate.y; y < plate.y + plate.height; y += 1) {
    for (let x = plate.x; x < plate.x + plate.width; x += 1) {
      const i = y * png.stride + x * png.channels;
      values.push(luminance(png.data[i], png.data[i + 1], png.data[i + 2]));
    }
  }
  values.sort((m, n) => m - n);
  return (values[Math.floor(values.length * .97)] + .05) / (values[Math.floor(values.length * .03)] + .05);
};
const sampleFrames = [];
for (const time of [...new Set(sampleTimes.map((t) => Math.max(0, Math.min(seconds - .05, t)).toFixed(3)))]) {
  const file = resolve(frameDir, 'frame-' + time + '.png');
  run('ffmpeg', ['-y', '-v', 'error', '-ss', time, '-i', video, '-frames:v', '1', file]);
  const png = readPng(file);
  const stats = luminanceStats(png, {x: 0, y: 0, width: v.width, height: v.height});
  const ms = Number(time) * 1000;
  const speaking = hasVoice && isKit && sceneAt(ms).direction?.captions?.mode !== 'off' && p.captions.some((c) => ms >= c.startMs + 80 && ms < c.endMs);
  sampleFrames.push({seconds: Number(time), path: file, ...stats, captionContrast: speaking ? captionContrast(png, plateFor(ms)) : null});
}
// A transition may cover or dim the frame on purpose around its boundary: it is judged by black-frame and flash checks.
const covered = (t) => p.scenes.some((s) => {
  const d = s.direction?.transition;
  if (!d || d.type === 'cut') return false;
  const half = (d.seconds ?? .7) / 2;
  return t >= s.start - half && t <= s.start + half;
});
const blank = (s) => !(s.mean > 7 && s.stdDev > 6) && !covered(s.seconds);
checks.sampledFramesVisible = !sampleFrames.some(blank);
const blankFrames = sampleFrames.filter(blank).map((s) => ({seconds: s.seconds, scene: [...p.scenes].reverse().find((sc) => s.seconds >= sc.start)?.id, mean: Number(s.mean.toFixed(1)), stdDev: Number(s.stdDev.toFixed(1))}));
const contrasts = sampleFrames.map((s) => s.captionContrast).filter((c) => c !== null);
const minCaptionContrast = contrasts.length ? Math.min(...contrasts) : null;
// A reel whose scenes all switch captions off carries its own word-keyed headlines (gated by textContrast instead).
const captionsShown = p.scenes.some((s) => s.direction?.captions?.mode !== 'off');
if (isKit && hasVoice && !musicOnly && captionsShown) checks.captionContrast = contrasts.length > 0 && minCaptionContrast >= STANDARDS.readability.minContrast;

// Decode every frame, rather than inferring corruption or black frames from a few stills.
const W = 54, H = 96;
const decoded = run('ffmpeg', ['-v', 'error', '-i', video, '-an', '-vf', `scale=${W}:${H}`, '-pix_fmt', 'rgb24', '-c:v', 'rawvideo', '-f', 'image2pipe', '-'], true).stdout;
const stride = W * H * 3, frameCount = Math.floor(decoded.length / stride);
// The caption band always changes, so stage motion is measured above it.
const stageRows = Math.floor(H * 1390 / 1920);
const stageDiff = [];
let blackFrames = 0, maxLuminanceJump = 0, previous = 0;
const lumaTrack = [];
for (let offset = 0; offset + stride <= decoded.length; offset += stride) {
  let sum = 0;
  for (let i = offset; i < offset + stride; i += 3) sum += .2126 * decoded[i] + .7152 * decoded[i + 1] + .0722 * decoded[i + 2];
  const mean = sum / (W * H);
  lumaTrack.push(mean);
  if (mean < 3) blackFrames++;
  if (offset) {
    maxLuminanceJump = Math.max(maxLuminanceJump, Math.abs(mean - previous));
    let diff = 0;
    for (let i = 0; i < stageRows * W * 3; i++) diff += Math.abs(decoded[offset + i] - decoded[offset + i - stride]);
    // Change per thirtieth of a second, so the same motion scores the same at 30 and 60 fps.
    stageDiff.push((diff / (stageRows * W * 3)) * (p.fps / 30));
  }
  previous = mean;
}
checks.completeDecode = frameCount === Math.round(p.durationSeconds * p.fps);
checks.noBlackFrames = blackFrames === 0;
// A flash goes up and comes back. In a directed reel a hard cut from a light palette to a dark one is a change
// of world and stays changed, so it is told apart by whether the level returns within a few frames.
const flashes = [];
if (p.scenes.some((s) => s.direction)) {
  for (let i = 1; i < lumaTrack.length - 1; i++) {
    const jump = lumaTrack[i] - lumaTrack[i - 1];
    if (Math.abs(jump) < 60) continue;
    const back = lumaTrack.slice(i + 1, i + 5).some((v) => Math.abs(v - lumaTrack[i - 1]) < 25);
    if (back) flashes.push(i);
  }
  checks.noFullFrameFlashes = flashes.length === 0;
} else checks.noFullFrameFlashes = maxLuminanceJump < 60;

// Anti-slideshow: the longest run where the stage is effectively frozen.
let longestStatic = 0, run_ = 0, staticEnd = 0;
stageDiff.forEach((d, i) => { run_ = d < STANDARDS.motion.staticDiffThreshold ? run_ + 1 : 0; if (run_ > longestStatic) { longestStatic = run_; staticEnd = i; } });
const staticStart = staticEnd - longestStatic + 1;
const sceneOfFrame = (f) => [...p.scenes].reverse().find((s) => f / p.fps >= s.start)?.id ?? p.scenes[0].id;
const motion = {longestStaticSeconds: longestStatic / p.fps, longestStaticFrames: [staticStart, staticEnd], longestStaticScene: sceneOfFrame(staticStart), meanStageDiff: stageDiff.reduce((s, d) => s + d, 0) / stageDiff.length, flashFrames: flashes};
if (isKit) checks.noFrozenStage = motion.longestStaticSeconds <= STANDARDS.motion.maxStaticSeconds;

// Picture follows voice: motion near each spoken cue must rise above that scene's own quiet level.
if (isKit && hasVoice) {
  const norm = (t) => t.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}_]/gu, '');
  const walk = (node, out = []) => {
    if (Array.isArray(node)) node.forEach((n) => walk(n, out));
    else if (node && typeof node === 'object') for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && (key.toLowerCase().endsWith('cue') || key === 'until')) out.push(value); else walk(value, out);
    }
    return out;
  };
  let cursor = 0, total = 0, hit = 0; const missed = [];
  for (const scene of p.scenes) {
    const count = scene.voice.trim().split(/\s+/).length;
    const words = p.captions.slice(cursor, cursor + count); cursor += count;
    const from = Math.round(scene.start * p.fps), to = Math.round((scene.start + scene.duration) * p.fps);
    const window = stageDiff.slice(from, to);
    const quiet = [...window].sort((m, n) => m - n)[Math.floor(window.length * .25)] ?? 0;
    for (const cue of new Set(walk(scene.visual ?? scene.direction ?? {}))) {
      const [word, nth] = cue.split('#');
      const found = words.filter((w) => norm(w.text).startsWith(norm(word)))[(nth ? Number(nth) : 1) - 1];
      if (!found) continue;
      const f = Math.round(found.startMs / 1000 * p.fps);
      const peak = Math.max(...stageDiff.slice(Math.max(0, f - Math.round(p.fps / 30)), f + Math.round(9 * p.fps / 30)));
      total++;
      if (peak > Math.max(quiet * 1.5, .25)) hit++; else missed.push(`${scene.id}:${cue}`);
    }
  }
  motion.cueSync = {total, hit, missed};
  checks.motionOnCues = total > 0 && hit / total >= .85;
}

let audioMetrics = null;
if (a) {
  const wav = run('ffmpeg', ['-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', '-f', 'wav', '-'], true).stdout;
  let dataOffset = 12;
  while (dataOffset + 8 <= wav.length && wav.toString('ascii', dataOffset, dataOffset + 4) !== 'data') {
    const length = wav.readUInt32LE(dataOffset + 4);
    dataOffset += 8 + length + (length % 2);
  }
  if (dataOffset + 8 > wav.length) throw Error('Decoded audio WAV has no data chunk');
  const decodedAudio = wav.subarray(dataOffset + 8);
  let squareSum = 0, peak = 0;
  for (let i = 0; i + 1 < decodedAudio.length; i += 2) { const value = decodedAudio.readInt16LE(i) / 32768; squareSum += value * value; peak = Math.max(peak, Math.abs(value)); }
  const rms = Math.sqrt(squareSum / (decodedAudio.length / 2));
  const analysis = run('ffmpeg', ['-hide_banner', '-i', video, '-vn', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-c:a', 'pcm_s16le', '-f', 'null', '-']).stderr;
  const json = String(analysis).match(/\{[^{}]*"input_i"[^{}]*\}/);
  const loudness = json ? JSON.parse(json[0]) : null;
  audioMetrics = {rmsDb: 20 * Math.log10(rms), samplePeakDb: 20 * Math.log10(peak), durationSeconds: decodedAudio.length / 2 / 48000, integratedLufs: loudness ? Number(loudness.input_i) : null, truePeakDb: loudness ? Number(loudness.input_tp) : null};
  checks.nonSilentAudio = rms > .01;
  checks.noAudioClipping = peak < .995;
  checks.voiceLevel = !!loudness && audioMetrics.integratedLufs >= -20 && audioMetrics.integratedLufs <= -12 && audioMetrics.truePeakDb <= -.5;
  const lastWordEnd = p.captions[p.captions.length - 1].endMs / 1000;
  audioMetrics.endHoldSeconds = seconds - audioMetrics.durationSeconds;
  // The planned final visual hold is intentionally silent. Check the spoken
  // content for truncation and the measured track against its source length.
  // A music bed legitimately runs to the end of the picture; the voice length is then checked by the word timings.
  const trackLength = p.art?.music || musicOnly ? seconds : p.audio.durationSeconds;
  checks.audioVideoDuration = Math.abs(audioMetrics.durationSeconds - trackLength) < .15 && audioMetrics.durationSeconds >= lastWordEnd - .03 && audioMetrics.endHoldSeconds >= -.05 && audioMetrics.endHoldSeconds <= 1;
  // Independent of the timing file's own claims: is there actually speech inside each caption's word?
  const rmsAt = (fromMs, toMs) => {
    const start = Math.floor(fromMs * 48) * 2, end = Math.min(decodedAudio.length, Math.floor(toMs * 48) * 2);
    let sum = 0, n = 0;
    for (let i = start; i + 1 < end; i += 2) { const value = decodedAudio.readInt16LE(i) / 32768; sum += value * value; n++; }
    return n ? Math.sqrt(sum / n) : 0;
  };
  const spoken = p.captions.filter((c) => /[\p{L}\p{N}]/u.test(c.text));
  const voiced = spoken.filter((c) => rmsAt(c.startMs, Math.max(c.endMs, c.startMs + 60)) > rms * .12);
  audioMetrics.voicedWords = {voiced: voiced.length, total: spoken.length};
  checks.captionsOnSpeech = voiced.length / spoken.length >= .95;
  if (musicOnly) {
    const samples = new Float64Array(decodedAudio.length / 2);
    for (let i = 0; i < samples.length; i++) samples[i] = decodedAudio.readInt16LE(i * 2) / 32768;
    const onBeat = shareOnBeat(p.captions.map((c) => c.startMs / 1000), onsetsOf(samples, 48000), 0.05);
    audioMetrics.wordsOnBeats = onBeat;
    checks.wordsOnBeats = onBeat.share >= .85;
  }
}

const manualFile = resolve(root, rel('-manual-review.json'));
const manualReview = existsSync(manualFile) ? JSON.parse(readFileSync(manualFile, 'utf8')) : {
  visual: 'pending', facts: 'pending', audioListening: 'pending',
  note: 'Machine checks do not certify voice prosody or visual taste.',
};
const gate = gateFor(p);
const report = {
  project: p.id, mode, video,
  measured: {durationSeconds: seconds, width: v.width, height: v.height, fps: v.r_frame_rate, videoCodec: v.codec_name, audioCodec: a?.codec_name || null, frameCount, blackFrames, maxLuminanceJump, blankFrames, minCaptionContrast, motion, audio: audioMetrics},
  checks, passed: Object.values(checks).every(Boolean), publishReady: gate.publishReady, manualReview, sampleFrames,
};
const reportPath = resolve(root, rel(`-${mode}-qa.json`));
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
if (mode === 'production' && report.passed) {
  p.renderPath = rel('.mp4');
  p.qa = {path: rel('-production-qa.json'), passed: true, manualListeningRequired: manualReview.audioListening?.status !== 'reviewed'};
  p.status.production = 'rendered';
  saveProject(projectFile, p);
}
console.log(JSON.stringify({report: reportPath, measured: {...report.measured}, checks, passed: report.passed, publishReady: report.publishReady}, null, 2));
if (!report.passed) process.exit(1);
