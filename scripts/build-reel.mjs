import {spawnSync} from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const task of ['assets:generate', 'typecheck', 'render:checks', 'render:preview']) {
  console.log(`\n▶ npm run ${task}`);
  const result = spawnSync(npm, ['run', task], {stdio: 'inherit', shell: process.platform === 'win32'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Safe-zone gate: block the final render if any content invades an Instagram
// unsafe zone. Runs on the composition being built.
console.log('\n▶ safe-zone gate (GhostPepeReel)');
const gate = spawnSync(process.execPath, ['scripts/qa-reels.mjs', 'GhostPepeReel'], {stdio: 'inherit'});
if (gate.status !== 0) {
  console.error('Build blocked: safe-zone gate failed. See out/qa/*-VIOLATION.png');
  process.exit(gate.status ?? 1);
}

for (const task of ['render', 'verify']) {
  console.log(`\n▶ npm run ${task}`);
  const result = spawnSync(npm, ['run', task], {stdio: 'inherit', shell: process.platform === 'win32'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
