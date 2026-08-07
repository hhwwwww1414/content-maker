import {spawnSync} from 'node:child_process';
import timeline from '../src/generated/timeline.json' with {type: 'json'};

const remotionCli = 'node_modules/@remotion/cli/remotion-cli.js';
const frames = [Math.round(timeline.fps * 0.8), Math.round(timeline.totalDurationMs / 2000 * timeline.fps), timeline.durationInFrames - 12];
for (let i = 0; i < frames.length; i++) {
  const out = `out/check-frame-0${i + 1}.png`;
  const result = spawnSync(process.execPath, [remotionCli, 'still', 'GhostPepeReel', out, `--frame=${frames[i]}`], {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
