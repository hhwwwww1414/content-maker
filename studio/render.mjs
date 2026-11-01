#!/usr/bin/env node
import {readFileSync, existsSync, mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const project=JSON.parse(readFileSync(resolve(root,'studio/gps-offline.json'),'utf8'));
const mode=process.argv[2];
if(!['preview','production'].includes(mode)) throw Error('Usage: node studio/render.mjs preview|production');
if(project.status.factCheck!=='reviewed'||project.status.scriptApproval!=='approved') throw Error('Run editorial validation before render');
if(mode==='production'&&(!project.audio.voicePath||!existsSync(resolve(root,'public',project.audio.voicePath)))) throw Error('Production requires real ElevenLabs voice. Run node studio/voice.mjs first.');
if(project.audio.musicPath&&(!project.audio.musicLicense||!existsSync(resolve(root,'public',project.audio.musicPath)))) throw Error('Music requires an existing public file and documented license');
for(const effect of project.audio.sfx||[]) if(!effect.license||!existsSync(resolve(root,'public',effect.path))) throw Error('SFX requires an existing public file and documented license');
mkdirSync(resolve(root,'out/studio'),{recursive:true});
const dest=mode==='preview'?'out/studio/gps-offline-preview.mp4':'out/studio/gps-offline.mp4';
const args=['remotion','render','src/editorial/index.tsx','GpsOfflineEditorial',dest,'--codec=h264','--crf='+ (mode==='preview'?'28':'18'),'--concurrency=2','--timeout=120000'];
if(mode==='preview') args.push('--scale=0.5','--muted');
const result=spawnSync('npx',args,{cwd:root,stdio:'inherit'});
if(result.status!==0) process.exit(result.status||1);
console.log(dest);
