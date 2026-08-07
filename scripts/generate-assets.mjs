import {spawnSync} from 'node:child_process';

for (const script of ['scripts/setup_tts.py', 'scripts/generate_voice.py', 'scripts/generate_sfx.py']) {
  const result = spawnSync(process.execPath, ['scripts/python-runner.mjs', script], {stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
