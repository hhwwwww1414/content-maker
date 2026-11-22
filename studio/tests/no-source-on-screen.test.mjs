// Rule: sources are cited in the project JSON and the post text, never drawn in a frame.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : /\.(tsx?|jsx?)$/.test(name) ? [path] : [];
});

test('no renderer draws a source line', () => {
  const offenders = walk('src/editorial').filter((file) => /Источник:|SourceLine/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, [], 'Sources must never appear on screen');
});
