import {existsSync, readFileSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const readText = (path) => readFileSync(resolve(projectRoot, path), 'utf8');
const readJson = (path) => JSON.parse(readText(path));
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const content = readJson('content/whitelist-reel.json');
const timeline = readJson('src/generated/timeline-whitelist.json');
const captions = readJson('src/generated/captions-whitelist.json');
const metadata = readJson('public/generated/voiceover-whitelist-metadata.json');
const rootSource = readText('src/Root.tsx');
const packageJson = readJson('package.json');

const requiredSegments = [
  'hook_a',
  'hook_b',
  'fact_a',
  'fact_b',
  'pass_a',
  'pass_b',
  'link_a',
  'link_b',
  'cta_a',
  'cta_b',
];
const requiredComponents = [
  'src/components/CyberCheckpoint.tsx',
  'src/components/DomainToken.tsx',
  'src/components/ScannerGate.tsx',
  'src/components/DigitalTurnstile.tsx',
  'src/components/AccessDisplay.tsx',
  'src/components/WhitelistHall.tsx',
  'src/components/NewsLabel.tsx',
  'src/compositions/GhostPepeWhitelistReel.tsx',
];
const forbiddenBrands = ['GhostPepe VPN', 'GhostPepeVPN', '@GhostPepeVPN', '@ghostpepevpn'];
const taskSources = requiredComponents.map(readText).join('\n');

assert(content.ttsProvider === 'silero', 'Whitelist TTS provider must be Silero');
assert(content.voice === 'v5_5_ru', 'Whitelist voice must be v5_5_ru');
assert(content.speaker === 'eugene', 'Whitelist speaker must be eugene');
assert(content.width === 1080 && content.height === 1920, 'Whitelist dimensions must be 1080x1920');
assert(content.fps === 30, 'Whitelist FPS must be 30');
assert(content.finalHoldMs === 1000, 'Whitelist final hold must be 1000ms');
assert(content.telegramLabel === '@ghostpepebot', 'Whitelist handle must be @ghostpepebot');
assert(JSON.stringify(content.voiceoverSegments.map(({id}) => id)) === JSON.stringify(requiredSegments), 'Whitelist segment IDs or order changed');

assert(metadata.ttsProvider === 'silero', 'Generated metadata provider must be Silero');
assert(metadata.voice === 'v5_5_ru', 'Generated metadata voice must be v5_5_ru');
assert(metadata.speaker === 'eugene', 'Generated metadata speaker must be eugene');
assert(metadata.width === 1080 && metadata.height === 1920 && metadata.fps === 30, 'Generated metadata video settings are invalid');
assert(metadata.finalHoldMs === 1000, 'Generated metadata final hold must be 1000ms');
assert(metadata.durationInFrames === timeline.durationInFrames, 'Timeline and metadata frame counts differ');
assert(timeline.durationInFrames > 0, 'Timeline must have a positive duration');
assert(Array.isArray(captions) && captions.length > 0, 'Whitelist captions must not be empty');
assert(captions.every((page) => page.startMs >= 0 && page.durationMs > 0 && Array.isArray(page.tokens)), 'Whitelist captions contain an invalid page');

for (const path of requiredComponents) {
  assert(existsSync(resolve(projectRoot, path)), `Missing required whitelist source: ${path}`);
}
for (const path of ['public/assets/mascot/ghostpepe-main.png', 'public/assets/backgrounds/cyberspace-dark.png', 'public/generated/voiceover-whitelist.wav']) {
  const absolute = resolve(projectRoot, path);
  assert(existsSync(absolute) && statSync(absolute).size > 0, `Missing or empty required asset: ${path}`);
}
for (const brand of forbiddenBrands) {
  assert(!taskSources.includes(brand), `Forbidden branding found in whitelist source: ${brand}`);
}

assert(rootSource.includes("id=\"GhostPepeWhitelistReel\""), 'GhostPepeWhitelistReel is not registered in Root.tsx');
assert(rootSource.includes("./generated/timeline-whitelist.json"), 'Root.tsx does not use the measured whitelist timeline');
assert(packageJson.scripts?.['voice:generate:whitelist'], 'Missing voice:generate:whitelist npm script');
assert(packageJson.scripts?.['render:whitelist'], 'Missing render:whitelist npm script');

console.log(`Whitelist verification passed: ${timeline.durationInFrames} frames, ${captions.length} caption pages`);
