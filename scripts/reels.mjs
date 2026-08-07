import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {REELS, paths, resolve} from './reels.config.mjs';

/**
 * One command to drive the reel series.
 *
 *   node scripts/reels.mjs voice   [selectors]   # generate voiceover(s) (eugene + prosody)
 *   node scripts/reels.mjs gate    [selectors]   # safe-zone gate
 *   node scripts/reels.mjs render  [selectors]   # render mp4(s)
 *   node scripts/reels.mjs build   [selectors]   # voice -> gate -> render (the full run)
 *
 * selectors: reel keys, a group ("news" | "coding"), or "all" (default).
 *   node scripts/reels.mjs build coding
 *   node scripts/reels.mjs build handshake ports
 */

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const remotionCli = path.join(root, 'node_modules/@remotion/cli/remotion-cli.js');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, {stdio: 'inherit', cwd: root, ...opts});

const genVoice = (r) => {
  const p = paths(r.key);
  console.log(`\n🎙  voice · ${r.key}`);
  const res = run(process.execPath, ['scripts/python-runner.mjs', 'scripts/generate_voice.py', p.content, p.timeline, p.voice, p.meta, p.captions]);
  return res.status === 0 && existsSync(path.join(root, p.timeline));
};

const gate = (comps) => {
  console.log(`\n🛡  safe-zone gate · ${comps.join(', ')}`);
  return run(process.execPath, ['scripts/qa-reels.mjs', ...comps]).status === 0;
};

const render = (r) => {
  const p = paths(r.key);
  console.log(`\n🎬  render · ${r.key}`);
  const res = run(process.execPath, [remotionCli, 'render', r.comp, p.out, '--codec=h264', '--audio-codec=aac', '--crf=20', '--concurrency=2']);
  return res.status === 0 && existsSync(path.join(root, p.out));
};

const main = () => {
  const [cmd, ...selectors] = process.argv.slice(2);
  if (!cmd || !['voice', 'gate', 'render', 'build'].includes(cmd)) {
    console.error('Usage: node scripts/reels.mjs <voice|gate|render|build> [keys|group|all]');
    console.error(`Groups: ${[...new Set(REELS.map((r) => r.group))].join(', ')}. Keys: ${REELS.map((r) => r.key).join(', ')}`);
    process.exit(2);
  }
  const list = resolve(selectors);
  if (!list.length) {
    console.error('No matching reels for:', selectors.join(' '));
    process.exit(2);
  }
  console.log(`▶ ${cmd}: ${list.map((r) => r.key).join(', ')}`);

  const fails = [];

  if (cmd === 'voice' || cmd === 'build') {
    for (const r of list) if (!genVoice(r)) fails.push(`voice:${r.key}`);
    // A missing timeline breaks the whole Studio bundle (Root imports every reel),
    // so never proceed to render if any voiceover failed.
    if (cmd === 'build' && fails.length) {
      console.error(`\n✗ voice failed for: ${fails.join(', ')} — aborting before render.`);
      process.exit(1);
    }
  }

  if (cmd === 'gate' || cmd === 'build') {
    if (!gate(list.map((r) => r.comp))) fails.push('gate');
  }

  if (cmd === 'render' || cmd === 'build') {
    for (const r of list) if (!render(r)) fails.push(`render:${r.key}`);
  }

  console.log('\n' + '─'.repeat(48));
  if (fails.length) {
    console.error(`✗ ${cmd} finished with issues: ${fails.join(', ')}`);
    process.exit(1);
  }
  console.log(`✓ ${cmd} done for ${list.length} reel(s): ${list.map((r) => r.key).join(', ')}`);
};

main();
