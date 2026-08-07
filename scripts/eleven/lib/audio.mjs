import {execFileSync} from 'node:child_process';

/**
 * Duration of a media file in ms, via the ffprobe binary Remotion ships with.
 * Returns null when ffprobe is unavailable so callers can fall back to alignment.
 */
export const probeDurationMs = (file) => {
  try {
    const out = execFileSync(
      'npx',
      ['remotion', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
      {encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore']},
    );
    const seconds = Number.parseFloat(String(out).trim().split(/\r?\n/).pop());
    return Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
  } catch {
    return null;
  }
};

/** Stream info of a rendered file: [{codec_type, codec_name, width, height, ...}] */
export const probeStreams = (file) => {
  const out = execFileSync(
    'npx',
    ['remotion', 'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', file],
    {encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 8 * 1024 * 1024},
  );
  const jsonStart = out.indexOf('{');
  return JSON.parse(out.slice(jsonStart));
};
