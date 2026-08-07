import {existsSync, readFileSync} from 'node:fs';

const requiredFiles = [
  'src/reel-system/history/reel-history.json',
  'src/reel-system/history/reel-history.schema.ts',
  'src/reel-system/history/novelty-analyzer.ts',
  'src/reel-system/storyboard/types.ts',
  'src/reel-system/storyboard/storyboard-validator.ts',
  'src/reel-system/storyboard/storyboard-renderer.tsx',
  'src/reel-system/layout/layout-types.ts',
  'src/reel-system/layout/instagram-safe-zones.ts',
  'src/reel-system/layout/LayoutRegistry.tsx',
  'src/reel-system/layout/SafeZoneGuard.tsx',
  'src/reel-system/layout/CollisionGuard.tsx',
  'src/reel-system/layers.ts',
  'src/reel-system/hero/HeroObject.tsx',
  'src/reel-system/motion/patterns.ts',
  'src/reel-system/quality-gate.ts',
  'REEL_PIPELINE.md',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing reel-system file: ${file}`);
  }
}

const root = readFileSync('src/Root.tsx', 'utf8');
if (!root.includes('GhostPepeStoryboardPreview')) {
  throw new Error('GhostPepeStoryboardPreview composition is not registered');
}

const twoNetworksFiles = [
  'src/reel-system/two-networks/concept.json',
  'src/reel-system/two-networks/novelty-report.json',
  'src/reel-system/two-networks/storyboard.json',
  'src/reel-system/two-networks/layout-plan.json',
  'src/reel-system/two-networks/asset-strategy.json',
  'src/reel-system/two-networks/motion-plan.json',
  'src/reel-system/two-networks/quality-gate.json',
  'content/two-networks-reel.json',
  'src/generated/timeline-two-networks.json',
  'src/generated/captions-two-networks.json',
  'src/compositions/GhostPepeTwoNetworksReel.tsx',
];

for (const file of twoNetworksFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing two-networks reel pipeline file: ${file}`);
  }
}

if (!root.includes('GhostPepeTwoNetworksReel')) {
  throw new Error('GhostPepeTwoNetworksReel composition is not registered');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const script of ['test', 'qa:contact-sheet', 'qa:gate']) {
  if (!pkg.scripts?.[script]) {
    throw new Error(`Missing npm script: ${script}`);
  }
}

const history = JSON.parse(readFileSync('src/reel-system/history/reel-history.json', 'utf8'));
if (!Array.isArray(history.reels)) {
  throw new Error('reel-history.json must contain a reels array');
}

const novelty = JSON.parse(readFileSync('src/reel-system/two-networks/novelty-report.json', 'utf8'));
if (novelty.valid !== true) {
  throw new Error(`Two-networks novelty failed: ${novelty.rejectionReason ?? 'unknown reason'}`);
}
const candidate = novelty.candidate;
if (candidate.mascotUsage !== 'no mascot' || candidate.ctaType !== 'none') {
  throw new Error('Two-networks reel must have no mascot and no CTA');
}
if (/tunnel|mascot|telegram/i.test(`${candidate.environment} ${candidate.heroObject} ${candidate.visualMetaphor}`)) {
  throw new Error('Two-networks reel reused forbidden visual grammar');
}

const storyboard = JSON.parse(readFileSync('src/reel-system/two-networks/storyboard.json', 'utf8'));
if (storyboard.shots?.length !== 4) {
  throw new Error('Two-networks storyboard must contain 3 main scenes plus ending');
}
if (storyboard.shots[0]?.assetType !== 'SVG') {
  throw new Error('Two-networks opening should use clear SVG/2.5D chamber assets');
}

const gate = JSON.parse(readFileSync('src/reel-system/two-networks/quality-gate.json', 'utf8'));
for (const key of ['noveltyValid', 'storyboardValid', 'layoutValid', 'collisionValid', 'safeZoneValid', 'heroClarityValid', 'sceneComplexityValid', 'audioValid']) {
  if (gate[key] !== true) {
    throw new Error(`Two-networks quality gate is not true: ${key}`);
  }
}

const content = JSON.parse(readFileSync('content/two-networks-reel.json', 'utf8'));
if (content.speechRate) {
  throw new Error('Two-networks reel must not use speechRate or time compression');
}
if (content.voice !== 'v5_5_ru' || content.speaker !== 'eugene' || content.ttsProvider !== 'silero') {
  throw new Error('Two-networks reel must keep Silero v5_5_ru / eugene');
}
if (content.finalHoldMs < 1200) {
  throw new Error('Two-networks final hold must give the ending room to breathe');
}
if (content.voiceoverSegments.length < 14) {
  throw new Error('Two-networks reel must use natural phrase-level TTS segments, not compressed copy');
}
for (const segment of content.voiceoverSegments) {
  if (/[.]/.test(segment.spokenText ?? segment.text)) {
    throw new Error(`TTS text must avoid periods: ${segment.id}`);
  }
  const words = (segment.spokenText ?? segment.text).trim().split(/\s+/).filter(Boolean);
  if (words.length > 9) {
    throw new Error(`TTS segment is too long for natural delivery: ${segment.id}`);
  }
}

const timeline = JSON.parse(readFileSync('src/generated/timeline-two-networks.json', 'utf8'));
const captions = JSON.parse(readFileSync('src/generated/captions-two-networks.json', 'utf8'));
const lastSegment = timeline.segments.at(-1);
if (!lastSegment) {
  throw new Error('Two-networks timeline has no voice segments');
}
if (timeline.totalDurationMs < lastSegment.endMs + timeline.finalHoldMs) {
  throw new Error('Two-networks timeline must be content-defined and include final hold');
}
if (timeline.totalDurationMs < 22000) {
  throw new Error('Two-networks timeline is still compressed below the expected natural range');
}
if (timeline.durationInFrames !== Math.ceil((timeline.totalDurationMs / 1000) * timeline.fps)) {
  throw new Error('Two-networks durationInFrames must be derived from real audio timeline');
}
if (captions.length !== timeline.segments.length) {
  throw new Error('Two-networks captions must be phrase-level: one caption page per voice segment');
}
for (let index = 0; index < captions.length; index++) {
  const caption = captions[index];
  const segment = timeline.segments[index];
  if (caption.startMs < segment.startMs - 60) {
    throw new Error(`Caption starts too early: ${segment.id}`);
  }
  if (caption.startMs > segment.startMs + 80) {
    throw new Error(`Caption starts too late: ${segment.id}`);
  }
  if (caption.startMs + caption.durationMs < segment.endMs) {
    throw new Error(`Caption ends before voice segment: ${segment.id}`);
  }
  if (caption.durationMs < 900 && caption.punchline !== true) {
    throw new Error(`Caption duration is too short: ${segment.id}`);
  }
  if ((caption.text.match(/\n/g) ?? []).length > 1) {
    throw new Error(`Caption has more than two lines: ${segment.id}`);
  }
  if (index > 0) {
    const previous = captions[index - 1];
    if (caption.startMs < previous.startMs + previous.durationMs) {
      throw new Error(`Caption pages overlap at ${segment.id}`);
    }
  }
}

const composition = readFileSync('src/compositions/GhostPepeTwoNetworksReel.tsx', 'utf8');
for (const forbidden of ['14.25', '13.8', 'white Apple lab', "const offWhite = '#F1F1ED'"]) {
  if (composition.includes(forbidden)) {
    throw new Error(`Two-networks composition still contains fixed-duration or white-lab grammar: ${forbidden}`);
  }
}
if (!composition.includes("cyberspace-dark.png")) {
  throw new Error('Two-networks composition must use cyberspace-dark.png as visible brand foundation');
}
if (!composition.includes('LayoutRegistryProvider') || !composition.includes('CriticalElement')) {
  throw new Error('Two-networks composition must use the layout registry for critical elements');
}
if (composition.includes('ThreeCanvas')) {
  throw new Error('Two-networks composition should prefer clear 2.5D chamber geometry over unnecessary 3D');
}

console.log('Reel system infrastructure files are present and wired.');
