#!/usr/bin/env node
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT as root, STANDARDS, gateFor, loadProject, projectPath} from './lib/project.mjs';
import {libraryOf} from './lib/library.mjs';

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith('--'));
const [projectArg, mode] = argv.filter((a) => !a.startsWith('--'));
if (!projectArg || !['preview', 'production'].includes(mode)) throw Error('Usage: node studio/render.mjs <project.json> preview|production [--frames=a-b] [--out=path]');
const project = loadProject(projectPath(projectArg));
const voice = project.audio.voicePath && existsSync(resolve(root, 'public', project.audio.voicePath));
if (!gateFor(project).mayRender) throw Error('Run editorial validation before render: facts and script are not approved');
// A music-only reel has no speech by decision: its track takes the voice's place and is measured instead (studio/qa.mjs).
const musicOnly = project.audio.mode === 'music';
if (musicOnly && (project.audio.voicePath || !project.audio.musicPath)) throw Error('A music-only reel needs audio.musicPath and no audio.voicePath');
if (mode === 'production' && !voice && !musicOnly) throw Error('Production requires real ElevenLabs voice. Run node studio/voice.mjs first.');
if (project.audio.musicPath && (!project.audio.musicLicense || !existsSync(resolve(root, 'public', project.audio.musicPath)))) throw Error('Music requires an existing public file and documented license');
for (const effect of project.audio.sfx || []) if (!effect.license || !existsSync(resolve(root, 'public', effect.path))) throw Error('SFX requires an existing public file and documented license');

mkdirSync(resolve(root, 'out/studio'), {recursive: true});
const workDir = resolve(root, 'runs/studio', project.id);
mkdirSync(workDir, {recursive: true});
const propsFile = resolve(workDir, 'props.json');
const directed = project.scenes.some((s) => s.direction);
if (directed) project.assets = libraryOf(project);
const fpsOverride = flags.find((f) => f.startsWith('--fps='))?.split('=')[1];
if (fpsOverride) project.fps = Number(fpsOverride);
writeFileSync(propsFile, JSON.stringify({project}));

const custom = (name) => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1];
const dest = custom('out') ?? (mode === 'preview' ? `out/studio/${project.id}-preview.mp4` : `out/studio/${project.id}.mp4`);
const scale = STANDARDS.format.previewWidth / STANDARDS.format.width;
const args = ['remotion', 'render', 'src/editorial/index.tsx', 'EditorialReel', dest, `--props=${propsFile}`, `--codec=${STANDARDS.format.codec}`, '--audio-codec=aac', '--crf=' + (mode === 'preview' ? '28' : '18'), '--concurrency=' + (custom('concurrency') ?? '6'), '--timeout=120000', '--log=error'];
if (mode === 'preview') args.push(`--scale=${scale}`);
// Shaders and 3D need a real GL context; encoding settings keep gradients and small type clean.
if (directed) args.push('--gl=angle', '--image-format=jpeg', '--jpeg-quality=' + (mode === 'preview' ? '85' : '96'), '--color-space=bt709', '--pixel-format=yuv420p', '--x264-preset=' + (mode === 'preview' ? 'veryfast' : 'slow'));
if (!voice && !musicOnly) args.push('--muted');
if (mode === 'production' && directed) args.push('--enforce-audio-track');
if (custom('frames')) args.push(`--frames=${custom('frames')}`);
const result = spawnSync('npx', args, {cwd: root, stdio: 'inherit'});
if (result.status !== 0) process.exit(result.status || 1);
console.log(dest);
