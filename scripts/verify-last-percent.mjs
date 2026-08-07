import {existsSync, readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const text = (path) => readFileSync(resolve(root, path), 'utf8');
const json = (path) => JSON.parse(text(path));
const assert = (value, message) => { if (!value) throw new Error(message); };

const required = [
  'content/last-percent-reel.json',
  'src/generated/timeline-last-percent.json',
  'src/generated/captions-last-percent.json',
  'public/generated/voiceover-last-percent.wav',
  'public/generated/voiceover-last-percent-metadata.json',
  'src/components/FrozenProgressRing.tsx',
  'src/components/DataSpiral.tsx',
  'src/components/DataFragment.tsx',
  'src/components/MissingDataSlot.tsx',
  'src/components/ScanningWave.tsx',
  'src/components/FrozenParticleField.tsx',
  'src/components/CompletionPulse.tsx',
  'src/compositions/GhostPepeLastPercentReel.tsx',
  'src/compositions/lastPercentSceneFrames.ts',
];
for (const path of required) assert(existsSync(resolve(root, path)), `Missing required file: ${path}`);

const content = json('content/last-percent-reel.json');
const timeline = json('src/generated/timeline-last-percent.json');
const captions = json('src/generated/captions-last-percent.json');
const metadata = json('public/generated/voiceover-last-percent-metadata.json');
const packageJson = json('package.json');
const rootSource = text('src/Root.tsx');
const sources = required.filter((path) => path.endsWith('.tsx')).map(text).join('\n');
const compositionSource = text('src/compositions/GhostPepeLastPercentReel.tsx');
const ids = ['hook_a','hook_b','search_a','search_b','find_a','find_b','resume_a','resume_b','cta_a','cta_b'];

assert(content.ttsProvider === 'silero' && content.voice === 'v5_5_ru' && content.speaker === 'eugene', 'Invalid TTS configuration');
assert(content.width === 1080 && content.height === 1920 && content.fps === 30, 'Invalid video configuration');
assert(content.finalHoldMs === 1000 && content.trimEdgeSilence === true, 'Invalid hold or trim configuration');
assert(JSON.stringify(content.voiceoverSegments.map(({id}) => id)) === JSON.stringify(ids), 'Invalid segment IDs');
assert(metadata.durationInFrames === timeline.durationInFrames && timeline.durationInFrames > 0, 'Timeline mismatch');
assert(Array.isArray(captions) && captions.length > 0, 'Captions are empty');
assert(statSync(resolve(root, 'public/generated/voiceover-last-percent.wav')).size > 0, 'Voiceover is empty');
assert(rootSource.includes('id="GhostPepeLastPercentReel"'), 'Composition is not registered');
assert(rootSource.includes("./generated/timeline-last-percent.json"), 'Measured timeline is not registered');
assert(packageJson.scripts?.['voice:generate:last-percent'], 'Missing voice command');
assert(packageJson.scripts?.['render:last-percent'], 'Missing render command');
for (const brand of ['GhostPepe VPN','GhostPepeVPN','@GhostPepeVPN','@ghostpepevpn']) assert(!sources.includes(brand), `Forbidden brand: ${brand}`);
for (const legacy of ['PhoneFrame','VpnClientCard','SubscriptionCard','ConnectionTunnel','ScannerGate','DigitalTurnstile','VpnTombstone']) assert(!sources.includes(legacy), `Forbidden legacy component: ${legacy}`);
assert(compositionSource.includes('const ringLabel='), 'Ring label visibility must be controlled during the camera dive');
assert(!compositionSource.includes('>99%</Text>'), 'The hook must not duplicate 99% outside the ring');
console.log(`Last-percent verification passed: ${timeline.durationInFrames} frames, ${captions.length} caption pages`);
