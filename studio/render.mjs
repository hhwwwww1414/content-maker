#!/usr/bin/env node
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT as root, STANDARDS, gateFor, loadProject, projectPath} from './lib/project.mjs';

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const [projectArg, mode] = argv.filter((a) => !a.startsWith('--'));
if (!projectArg || !['preview', 'production'].includes(mode)) throw Error('Usage: node studio/render.mjs <project.json> preview|production [--frames=a-b] [--out=path]');
const project = loadProject(projectPath(projectArg));
const voice = project.audio.voicePath && existsSync(resolve(root, 'public', project.audio.voicePath));
if (!gateFor(project).mayRender) throw Error('Run editorial validation before render: facts and script are not approved');
if (mode === 'production' && !voice) throw Error('Production requires real ElevenLabs voice. Run node studio/voice.mjs first.');
if (project.audio.musicPath && (!project.audio.musicLicense || !existsSync(resolve(root, 'public', project.audio.musicPath)))) throw Error('Music requires an existing public file and documented license');
for (const effect of project.audio.sfx || []) if (!effect.license || !existsSync(resolve(root, 'public', effect.path))) throw Error('SFX requires an existing public file and documented license');

mkdirSync(resolve(root, 'out/studio'), {recursive: true});
const workDir = resolve(root, 'runs/studio', project.id);
mkdirSync(workDir, {recursive: true});
const propsFile = resolve(workDir, 'props.json');
writeFileSync(propsFile, JSON.stringify({project}));

const custom = (name) => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1];
const dest = custom('out') ?? (mode === 'preview' ? `out/studio/${project.id}-preview.mp4` : `out/studio/${project.id}.mp4`);
const scale = STANDARDS.format.previewWidth / STANDARDS.format.width;
const args = ['remotion', 'render', 'src/editorial/index.tsx', 'EditorialReel', dest, `--props=${propsFile}`, `--codec=${STANDARDS.format.codec}`, '--audio-codec=aac', '--crf=' + (mode === 'preview' ? '28' : '18'), '--concurrency=6', '--timeout=120000', '--log=error'];
if (mode === 'preview') args.push(`--scale=${scale}`);
if (!voice) args.push('--muted');
if (custom('frames')) args.push(`--frames=${custom('frames')}`);
const result = spawnSync('npx', args, {cwd: root, stdio: 'inherit'});
if (result.status !== 0) process.exit(result.status || 1);
console.log(dest);
