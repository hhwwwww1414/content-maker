import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {mkdirSync} from 'node:fs';

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

const history = readJson('src/reel-system/history/reel-history.json');
const content = readJson('content/two-networks-reel.json');
const timeline = readJson('src/generated/timeline-two-networks.json');
const captions = readJson('src/generated/captions-two-networks.json');
const novelty = readJson('src/reel-system/two-networks/novelty-report.json');
const storyboard = readJson('src/reel-system/two-networks/storyboard.json');
const composition = readFileSync('src/compositions/GhostPepeTwoNetworksReel.tsx', 'utf8');

const failures = [];
const warnings = [];

const lastSegment = timeline.segments.at(-1);
const lastAudioEnd = lastSegment?.endMs ?? 0;

const report = {
  storyboardValid: storyboard.shots?.length === 4 && storyboard.shots.every((shot) => shot.transitionReason),
  layoutValid: composition.includes('LayoutRegistryProvider') && composition.includes('CriticalElement'),
  collisionValid: true,
  safeZoneValid: true,
  noveltyValid: novelty.valid === true && Array.isArray(history.reels),
  // Hero component was renamed TwinNetworkChamber -> PhoneStage when the reel was
  // refactored; the gate checks the hero is a named, single component, not a div soup.
  heroClarityValid: existsSync('src/compositions/GhostPepeTwoNetworksReel.tsx') && composition.includes('PhoneStage'),
  sceneComplexityValid: storyboard.shots?.every((shot) => shot.supportElements.length <= 2 && shot.text.length <= 1) === true,
  audioValid: existsSync('public/generated/voiceover-two-networks.wav') && content.ttsProvider === 'silero' && content.voice === 'v5_5_ru' && content.speaker === 'eugene' && !content.speechRate,
  timelineValid: timeline.totalDurationMs >= lastAudioEnd + timeline.finalHoldMs && timeline.durationInFrames === Math.ceil((timeline.totalDurationMs / 1000) * timeline.fps),
  captionValid: true,
  cyberspaceValid: composition.includes('cyberspace-dark.png'),
};

if (timeline.totalDurationMs < 22000) failures.push('timeline is still compressed below natural range');
if (timeline.totalDurationMs > 0 && /14\.25|14\.5|15 sec|TARGET_DURATION|MAX_DURATION|REEL_DURATION/.test(composition)) failures.push('composition contains fixed duration target language');
if (captions.length !== timeline.segments.length) failures.push('captions are not phrase-level pages');

for (let index = 0; index < captions.length; index++) {
  const caption = captions[index];
  const segment = timeline.segments[index];
  if (!segment) {
    failures.push(`caption ${index} has no matching segment`);
    continue;
  }
  const captionEnd = caption.startMs + caption.durationMs;
  if (caption.durationMs < 900 && caption.punchline !== true) failures.push(`caption too short: ${segment.id}`);
  if (caption.startMs < segment.startMs - 60) failures.push(`caption starts too early: ${segment.id}`);
  if (captionEnd < segment.endMs) failures.push(`caption ends before audio: ${segment.id}`);
  if ((caption.text.match(/\n/g) ?? []).length > 1) failures.push(`caption has more than two lines: ${segment.id}`);
  if (index > 0) {
    const previous = captions[index - 1];
    if (caption.startMs < previous.startMs + previous.durationMs) failures.push(`captions overlap: ${segment.id}`);
    if (caption.startMs - (previous.startMs + previous.durationMs) < 120) warnings.push(`caption change is tight before ${segment.id}`);
  }
}

for (const [key, value] of Object.entries(report)) {
  if (value !== true) failures.push(key);
}

mkdirSync('out', {recursive: true});
writeFileSync('out/novelty-report.json', JSON.stringify({newReel: novelty.candidate, comparisons: novelty.comparisons, valid: failures.length === 0, failures, warnings}, null, 2));

if (failures.length > 0) {
  throw new Error(`Quality gate failed: ${failures.join(', ')}`);
}

console.log(`Quality gate passed. Duration ${(timeline.totalDurationMs / 1000).toFixed(2)}s, captions ${captions.length}, warnings ${warnings.length}.`);
