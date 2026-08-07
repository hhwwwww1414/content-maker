import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const requiredFiles = [
  'content/time-drain-reel.json',
  'src/compositions/GhostPepeTimeDrainReel.tsx',
  'src/compositions/timeDrainSceneFrames.ts',
  'src/components/DigitalHourglass.tsx',
  'src/components/TimeDigitParticle.tsx',
  'src/components/TimeDrainStream.tsx',
  'src/components/LostSecondsPile.tsx',
  'src/components/ChronometerHand.tsx',
  'src/components/FrozenTimeField.tsx',
  'src/components/TimeReturnFlow.tsx',
  'src/components/FinalTimeLine.tsx',
];

for (const file of requiredFiles) {
  assert.ok(statSync(join(root, file)).isFile(), `Missing required file: ${file}`);
}

const content = JSON.parse(read('content/time-drain-reel.json'));
assert.equal(content.ttsProvider, 'silero');
assert.equal(content.voice, 'v5_5_ru');
assert.equal(content.speaker, 'eugene');
assert.equal(content.fps, 30);
assert.equal(content.width, 1080);
assert.equal(content.height, 1920);
assert.ok(content.finalHoldMs >= 900 && content.finalHoldMs <= 1100);
assert.deepEqual(
  content.voiceoverSegments.map((segment) => segment.id),
  ['hook_a', 'hook_b', 'drain_a', 'drain_b', 'drain_c', 'cost_a', 'cost_b', 'freeze_a', 'freeze_b', 'cta_a', 'cta_b'],
);

const combinedSource = requiredFiles.slice(1).map(read).join('\n');
const rootSource = read('src/Root.tsx');
assert.match(rootSource, /id="GhostPepeTimeDrainReel"/);
assert.match(rootSource, /GhostPepeTimeDrainReel/);
assert.match(combinedSource, /assets\/mascot\/ghostpepe-main\.png/);
assert.match(combinedSource, /assets\/backgrounds\/cyberspace-dark\.png/);

const forbiddenImports = [
  'PhoneFrame', 'VpnClientCard', 'SubscriptionCard', 'ConnectionTunnel',
  'FrozenProgressRing', 'DataFragment', 'DomainToken', 'ScannerGate',
  'DigitalTurnstile', 'CyberCheckpoint', 'VpnTombstone', 'BenefitCard',
];
for (const name of forbiddenImports) {
  assert.ok(!combinedSource.includes(`import {${name}}`) && !combinedSource.includes(`import { ${name} }`), `Forbidden component imported: ${name}`);
}

const forbiddenCopy = [
  'Подключить в Telegram', 'Попробовать в Telegram', 'Интернет без лишней возни',
  'Когда интернет должен просто работать', 'Забрать время назад', 'Подключено',
];
for (const text of forbiddenCopy) {
  assert.ok(!combinedSource.toLowerCase().includes(text.toLowerCase()), `Forbidden legacy copy found: ${text}`);
}

assert.ok(!/#[A-Fa-f0-9]{0,2}(?:ff|e6|66)5a/i.test(combinedSource), 'Red accent found in new visual system');

const timelinePath = join(root, 'src/generated/timeline-time-drain.json');
try {
  const timeline = JSON.parse(readFileSync(timelinePath, 'utf8'));
  assert.ok(timeline.totalDurationMs >= 14500 && timeline.totalDurationMs <= 16000, `Duration out of range: ${timeline.totalDurationMs}ms`);
  assert.equal(timeline.ttsProvider, 'silero');
  assert.equal(timeline.voice, 'v5_5_ru');
  assert.equal(timeline.speaker, 'eugene');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

console.log('Time-drain structural audit passed.');
