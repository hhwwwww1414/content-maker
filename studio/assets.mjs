#!/usr/bin/env node
// The asset library: deterministic paths, measured metadata, explicit licences, content-addressed cache.
//   node studio/assets.mjs list
//   node studio/assets.mjs check [project.json]        missing files, missing licences, hash drift
//   node studio/assets.mjs add <id> --provider commons|nasa --ref <ref> [--kind image] [--tags a,b] [--focus x,y]
//   node studio/assets.mjs add <id> --file <path> --license <name> --author <who> --source <url> [--kind image|video|audio|sfx]
//   node studio/assets.mjs search nasa "<query>"
//   node studio/assets.mjs credits <project.json>      attribution text for the published post
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {extname, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {allowedLicense, providers} from './lib/asset-providers.mjs';
import {libraryOf, MANIFEST, projectAssetIds, readManifest, ROOT, writeManifest} from './lib/library.mjs';

const argv = process.argv.slice(2);
const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const [command, target, third] = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

const probe = (file) => {
  if (file.endsWith('.svg')) {
    const box = readFileSync(file, 'utf8').match(/viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/);
    if (!box) throw Error(`SVG needs a viewBox: ${file}`);
    return {width: Number(box[1]), height: Number(box[2])};
  }
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'});
  if (r.status !== 0) throw Error(`Cannot read ${file}: ${r.stderr}`);
  const data = JSON.parse(r.stdout);
  const video = data.streams.find((s) => s.codec_type === 'video');
  return {width: video?.width, height: video?.height, durationSeconds: Number(data.format?.duration) || undefined};
};

const install = (id, data, meta) => {
  const kind = meta.kind ?? 'image';
  const ext = meta.ext || '.bin';
  const dir = kind === 'sfx' || kind === 'music' || kind === 'audio' ? 'audio' : 'media';
  const path = `library/${dir}/${id}${ext}`;
  mkdirSync(resolve(ROOT, 'public/library', dir), {recursive: true});
  writeFileSync(resolve(ROOT, 'public', path), data);
  const measured = probe(resolve(ROOT, 'public', path));
  const durationSeconds = kind === 'image' ? undefined : measured.durationSeconds;
  const manifest = readManifest();
  manifest.assets[id] = {id, kind, path, width: measured.width, height: measured.height, durationSeconds, sha256: sha(data), bytes: data.length, license: meta.license, licenseUrl: meta.licenseUrl ?? '', author: meta.author ?? '', source: meta.source ?? '', attributionRequired: !!meta.attribution, description: meta.description ?? '', tags: meta.tags ?? [], focus: meta.focus, retrieved: new Date().toISOString().slice(0, 10)};
  writeManifest(manifest);
  console.log(`${id}: ${measured.width ?? '-'}x${measured.height ?? '-'} ${meta.license} → public/${path}`);
};

if (command === 'list') {
  for (const a of Object.values(readManifest().assets)) console.log(`${a.id.padEnd(24)} ${a.kind.padEnd(6)} ${String(a.width ?? '').padStart(5)}x${String(a.height ?? '').padEnd(5)} ${a.license}`);
} else if (command === 'search') {
  console.log(JSON.stringify(await providers[target].search(third), null, 1));
} else if (command === 'add') {
  const common = {kind: opt('--kind'), tags: opt('--tags')?.split(','), focus: opt('--focus')?.split(',').map(Number)};
  if (opt('--file')) {
    const license = opt('--license');
    if (!license) throw Error('A local asset needs --license. No licence, no asset.');
    const file = resolve(opt('--file'));
    install(target, readFileSync(file), {...common, ext: extname(file), license, author: opt('--author'), source: opt('--source'), licenseUrl: opt('--license-url'), attribution: argv.includes('--attribution')});
  } else {
    const provider = providers[opt('--provider')];
    if (!provider) throw Error(`Unknown provider ${opt('--provider')}. Known: ${Object.keys(providers).join(', ')}`);
    const info = await provider.resolve(opt('--ref'), {kind: common.kind});
    if (!allowedLicense(info.license)) throw Error(`Refused: licence "${info.license}" is not on the allowed list`);
    const cacheDir = resolve(ROOT, 'runs/studio/asset-cache');
    mkdirSync(cacheDir, {recursive: true});
    const cached = resolve(cacheDir, sha(Buffer.from(info.url)));
    if (!existsSync(cached)) {
      const r = await fetch(info.url, {headers: {'User-Agent': 'ContentMakerEngine/1.0'}});
      if (!r.ok) throw Error(`Download failed: HTTP ${r.status}`);
      writeFileSync(cached, Buffer.from(await r.arrayBuffer()));
    }
    install(target, readFileSync(cached), {...common, ...info, ext: extname(new URL(info.url).pathname).toLowerCase() || '.jpg', source: info.source});
  }
} else if (command === 'check') {
  const manifest = readManifest();
  const problems = [];
  const wanted = target ? projectAssetIds(JSON.parse(readFileSync(resolve(target), 'utf8'))) : Object.keys(manifest.assets);
  for (const id of wanted) {
    const a = manifest.assets[id];
    if (!a) { problems.push(`${id}: not in ${MANIFEST}`); continue; }
    const file = resolve(ROOT, 'public', a.path);
    if (!existsSync(file)) { problems.push(`${id}: missing file public/${a.path}`); continue; }
    if (!a.license) problems.push(`${id}: no licence`);
    if (sha(readFileSync(file)) !== a.sha256) problems.push(`${id}: file differs from the manifest hash`);
    if (a.attributionRequired && !a.author) problems.push(`${id}: attribution required but no author`);
  }
  if (problems.length) { console.log(problems.map((p) => 'FAIL ' + p).join('\n')); process.exit(1); }
  console.log(`PASS: ${wanted.length} assets`);
} else if (command === 'credits') {
  const lib = libraryOf(JSON.parse(readFileSync(resolve(target), 'utf8')));
  for (const a of Object.values(lib)) if (a.attributionRequired || a.author) console.log(`${a.description || a.id}: ${a.author}, ${a.license}. ${a.source}`);
} else {
  console.log('Commands: list, check, add, search, credits');
  process.exit(1);
}
