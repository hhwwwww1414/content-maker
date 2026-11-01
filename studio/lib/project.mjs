// Shared project helpers: one place for the standard, limits and audio-driven timing.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {basename, isAbsolute, resolve} from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');
export const STANDARDS = JSON.parse(readFileSync(resolve(ROOT, 'config/reel.standards.json'), 'utf8'));

export const projectPath = (arg) => {
  if (!arg) throw Error('Project JSON path is required, e.g. studio/projects/my-reel.json');
  const candidates = [isAbsolute(arg) ? arg : resolve(ROOT, arg), resolve(ROOT, 'studio/projects', basename(arg, '.json') + '.json')];
  const found = candidates.find((file) => {
    try { readFileSync(file); return true; } catch { return false; }
  });
  if (!found) throw Error('Project not found: ' + arg);
  return found;
};
export const loadProject = (file) => JSON.parse(readFileSync(file, 'utf8'));
export const saveProject = (file, project) => writeFileSync(file, JSON.stringify(project, null, 2) + '\n');

/** Standard limits, with an explicit per-project override for older pinned projects. */
export const limitsFor = (project) => ({
  ...STANDARDS.duration,
  maxTempo: STANDARDS.voice.maxTempo,
  tempoHeadroomSeconds: STANDARDS.voice.tempoHeadroomSeconds,
  ...(project.limits ?? {}),
});

export const scriptHash = (project) => createHash('sha256').update(project.scenes.map((s) => s.voice).join('\n')).digest('hex').slice(0, 16);

/** Demo projects may render from an existing take, but never buy new speech or count as publishable. */
export const gateFor = (project) => {
  const {factCheck, scriptApproval, approvedScriptHash} = project.status ?? {};
  // An approval covers the words that were approved: editing the voice text voids it.
  const unchanged = !approvedScriptHash || approvedScriptHash === scriptHash(project);
  const approved = factCheck === 'reviewed' && scriptApproval === 'approved' && unchanged;
  const demo = scriptApproval === 'demo' && ['reviewed', 'partial'].includes(factCheck);
  return {approved, demo, mayRender: approved || demo, mayBuyVoice: approved, publishReady: approved};
};

const snap = (seconds, fps) => Math.round(seconds * fps) / fps;
export const splitWords = (text) => text.trim().split(/\s+/).filter(Boolean);

/**
 * Audio defines the timeline: scene starts, durations and the caption track all
 * come from measured word timings. `words` is [{startMs,endMs}] in script order.
 */
export const applyWordTimings = (project, words, measuredSeconds) => {
  const scriptWords = project.scenes.flatMap((scene) => splitWords(scene.voice));
  if (scriptWords.length !== words.length) throw Error(`Timing mismatch: script has ${scriptWords.length} words, audio has ${words.length}`);
  const limits = limitsFor(project);
  project.captions = words.map((word, i) => ({text: scriptWords[i], startMs: word.startMs, endMs: word.endMs, timestampMs: null, confidence: null}));
  let cursor = 0;
  for (const [i, scene] of project.scenes.entries()) {
    scene.start = i === 0 ? 0 : snap(words[cursor].startMs / 1000, project.fps);
    cursor += splitWords(scene.voice).length;
  }
  const lastSpeech = words[words.length - 1].endMs / 1000;
  const total = Math.ceil(Math.max(measuredSeconds + limits.audioPadSeconds, lastSpeech + limits.endHoldSeconds) * project.fps) / project.fps;
  if (total < limits.minSeconds || total > limits.maxSeconds) {
    throw Error(`Audio gives ${total.toFixed(2)} s, outside ${limits.minSeconds}–${limits.maxSeconds} s. Edit the script instead of stretching the voice; the take stays cached.`);
  }
  project.durationSeconds = total;
  for (const [i, scene] of project.scenes.entries()) scene.duration = (project.scenes[i + 1]?.start ?? total) - scene.start;
  return project;
};
