import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');

/** Minimal dotenv: KEY=VALUE, `#` comments, optional surrounding quotes. */
export const loadDotEnv = () => {
  for (const name of ['.env', '.env.local']) {
    const file = path.join(ROOT, name);
    if (!existsSync(file)) continue;
    for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (value && !(key in process.env)) process.env[key] = value;
    }
  }
};

const DEFAULTS = {
  ELEVENLABS_MODEL_ID: 'eleven_multilingual_v2',
  ELEVENLABS_OUTPUT_FORMAT: 'mp3_44100_128',
};

/**
 * Reads the ElevenLabs config. Never log the returned apiKey.
 * Throws with an actionable message (and no secret material) when incomplete.
 */
export const readElevenLabsEnv = () => {
  loadDotEnv();
  // ELEVENLABS_API_KEY, then _2, _3… Keys are tried in order so a run can
  // continue on the next account when one is out of characters.
  const keys = [process.env.ELEVENLABS_API_KEY, process.env.ELEVENLABS_API_KEY_2, process.env.ELEVENLABS_API_KEY_3]
    .map((key) => (key ?? '').trim())
    .filter(Boolean);
  const cfg = {
    keys,
    apiKey: keys[0] ?? '',
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? '',
    modelId: process.env.ELEVENLABS_MODEL_ID || DEFAULTS.ELEVENLABS_MODEL_ID,
    outputFormat: process.env.ELEVENLABS_OUTPUT_FORMAT || DEFAULTS.ELEVENLABS_OUTPUT_FORMAT,
  };
  const missing = [];
  if (!cfg.apiKey) missing.push('ELEVENLABS_API_KEY');
  if (!cfg.voiceId) missing.push('ELEVENLABS_VOICE_ID');
  if (missing.length > 0) {
    throw new Error(
      `Missing required env var(s): ${missing.join(', ')}.\n` +
        `Copy .env.example to .env and fill them in (.env is gitignored).`,
    );
  }
  return cfg;
};

/** Strips anything that looks like an ElevenLabs key from text before printing. */
export const redact = (text) => String(text).replace(/sk_[A-Za-z0-9]{8,}/g, 'sk_***REDACTED***');
