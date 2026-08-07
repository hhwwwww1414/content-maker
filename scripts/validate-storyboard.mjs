import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const sb = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const out = await build({
  entryPoints: [path.join(root, 'src/reel-system/storyboard/storyboard-validator.ts')],
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const mod = await import('data:text/javascript,' + encodeURIComponent(out.outputFiles[0].text));
const res = mod.validateStoryboard(sb);
console.log(JSON.stringify(res, null, 2));
process.exit(res.valid ? 0 : 1);
