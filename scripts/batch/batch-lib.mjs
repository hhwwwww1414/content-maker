import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '../..');

export const abs = (p) => path.resolve(ROOT, p);

export const readJson = (p) => JSON.parse(readFileSync(abs(p), 'utf8'));

/**
 * Atomic write: serialise to a sibling temp file, then rename. A crash mid-run can
 * therefore never leave a half-written state.json behind for the next resume.
 */
export const writeJsonAtomic = (p, value) => {
  const target = abs(p);
  mkdirSync(path.dirname(target), {recursive: true});
  const tmp = `${target}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tmp, target);
};

export const ensureDir = (p) => mkdirSync(abs(p), {recursive: true});

// --- lock -------------------------------------------------------------------

/** Exclusive lock so two runs can never drive the same batch at once. */
export const acquireLock = (batchDir) => {
  const lockPath = abs(`${batchDir}/.lock`);
  mkdirSync(path.dirname(lockPath), {recursive: true});
  if (existsSync(lockPath)) {
    const held = JSON.parse(readFileSync(lockPath, 'utf8'));
    let alive = false;
    try {
      process.kill(held.pid, 0);
      alive = true;
    } catch {
      alive = false;
    }
    if (alive && held.pid !== process.pid) {
      throw new Error(`Batch is already locked by pid ${held.pid} since ${held.since}. Refusing to run twice.`);
    }
    rmSync(lockPath, {force: true});
  }
  writeFileSync(lockPath, JSON.stringify({pid: process.pid, since: new Date().toISOString()}), 'utf8');
  const release = () => rmSync(lockPath, {force: true});
  process.on('exit', release);
  return release;
};

// --- state machine ----------------------------------------------------------

export const PARENT_STATES = [
  'CREATED',
  'RESEARCHING',
  'SELECTING',
  'PLANNING',
  'PRODUCING',
  'QA_RUNNING',
  'REPAIRING',
  'RENDERING',
  'VERIFYING',
  'COMPLETED',
  'FAILED',
];

export const CHILD_STATES = [
  'CREATED',
  'IDEA_SELECTED',
  'STORYBOARD_READY',
  'VOICE_READY',
  'IMPLEMENTING',
  'QA_RUNNING',
  'REPAIRING',
  'RENDERING',
  'VERIFIED',
  'COMPLETED',
  'FAILED',
];

export const setParentState = (batchDir, state, extra = {}) => {
  if (!PARENT_STATES.includes(state)) throw new Error(`Unknown parent state: ${state}`);
  const file = `${batchDir}/state.json`;
  const previous = existsSync(abs(file)) ? readJson(file) : {history: []};
  const next = {
    ...previous,
    state,
    updatedAt: new Date().toISOString(),
    ...extra,
    history: [...(previous.history ?? []), {state, at: new Date().toISOString()}],
  };
  writeJsonAtomic(file, next);
  return next;
};

export const setChildState = (jobDir, state, extra = {}) => {
  if (!CHILD_STATES.includes(state)) throw new Error(`Unknown child state: ${state}`);
  const file = `${jobDir}/state.json`;
  const previous = existsSync(abs(file)) ? readJson(file) : {history: [], repairAttempts: 0};
  const next = {
    ...previous,
    state,
    updatedAt: new Date().toISOString(),
    ...extra,
    history: [...(previous.history ?? []), {state, at: new Date().toISOString()}],
  };
  writeJsonAtomic(file, next);
  return next;
};

export const readChildState = (jobDir) => {
  const file = `${jobDir}/state.json`;
  return existsSync(abs(file)) ? readJson(file) : null;
};

// --- process helpers --------------------------------------------------------

export const run = (command, args, {quiet = false} = {}) => {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: quiet ? 'pipe' : 'inherit',
    shell: false,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.error) throw result.error;
  return result;
};

export const runOrThrow = (command, args, label) => {
  const result = run(command, args);
  if (result.status !== 0) throw new Error(`${label} failed (exit ${result.status})`);
  return result;
};

const REMOTION_CLI = 'node_modules/@remotion/cli/remotion-cli.js';

export const remotion = (args, opts) => run(process.execPath, [abs(REMOTION_CLI), ...args], opts);

/** Remotion ships its own ffprobe binary, so no system ffmpeg is required. */
export const ffprobeJson = (file) => {
  const out = execFileSync(
    process.execPath,
    [abs(REMOTION_CLI), 'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', abs(file)],
    {cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 16},
  );
  const start = out.indexOf('{');
  return JSON.parse(out.slice(start));
};

export const sha256 = (file) => createHash('sha256').update(readFileSync(abs(file))).digest('hex');

export const fileSize = (file) => statSync(abs(file)).size;

export const log = (...parts) => console.log(`[batch]`, ...parts);
