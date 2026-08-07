import {existsSync, readFileSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';

const reel = JSON.parse(readFileSync('content/reel.json', 'utf8'));
const required = [
  `models/silero/${reel.voice}.pt`,
  'public/generated/voiceover.wav',
  'src/generated/timeline.json',
  'out/ghostpepe-reel.mp4',
  'out/ghostpepe-preview.png',
];
for (const file of required) {
  if (!existsSync(file) || statSync(file).size === 0) throw new Error(`Missing or empty: ${file}`);
}
JSON.parse(readFileSync('src/generated/timeline.json', 'utf8'));

const wav = readFileSync('public/generated/voiceover.wav');
const dataAt = wav.indexOf(Buffer.from('data'));
const sampleRate = wav.readUInt32LE(24);
const channels = wav.readUInt16LE(22);
const bits = wav.readUInt16LE(34);
const audioSeconds = wav.readUInt32LE(dataAt + 4) / (sampleRate * channels * bits / 8);
if (!(audioSeconds > 0)) throw new Error('Voiceover duration is zero');

const mp4 = readFileSync('out/ghostpepe-reel.mp4');
const mvhd = mp4.indexOf(Buffer.from('mvhd'));
if (mvhd < 0) throw new Error('MP4 mvhd metadata not found');
const version = mp4[mvhd + 4];
const base = mvhd + (version === 1 ? 24 : 16);
const timescale = mp4.readUInt32BE(base);
const duration = version === 1 ? Number(mp4.readBigUInt64BE(base + 4)) : mp4.readUInt32BE(base + 4);
const videoSeconds = duration / timescale;
if (!(videoSeconds > 0)) throw new Error('Video duration is zero');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const check = spawnSync(npm, ['run', 'typecheck'], {stdio: 'inherit', shell: process.platform === 'win32'});
if (check.status !== 0) process.exit(check.status ?? 1);
console.log(`Verified: audio ${audioSeconds.toFixed(2)}s, video ${videoSeconds.toFixed(2)}s, all required files are non-empty.`);
