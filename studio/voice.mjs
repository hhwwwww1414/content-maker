#!/usr/bin/env node
// This explicit command consumes ElevenLabs quota only if the exact take is not cached.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadDotEnv} from '../scripts/eleven/lib/env.mjs';
import {decodeEnvelope,refineOnsets} from './lib/onsets.mjs';
import {applyWordTimings, gateFor, limitsFor, projectPath} from './lib/project.mjs';

loadDotEnv();
const cacheOnly=process.argv.includes('--cache-only');
const projectFile=projectPath(process.argv.slice(2).find(a=>!a.startsWith('--')));
const p=JSON.parse(readFileSync(projectFile,'utf8'));
if(!gateFor(p).mayBuyVoice) throw Error('Editorial approval and fact review required before voice');
const limits=limitsFor(p);
const API=process.env.ELEVENLABS_BASE_URL||'https://api.elevenlabs.io';
const keys=[process.env.ELEVENLABS_API_KEY,process.env.ELEVENLABS_API_KEY_2,process.env.ELEVENLABS_API_KEY_3,process.env.ELEVENLABS_API_KEY_4].map(k=>(k||'').trim()).filter(Boolean);
const voiceId=p.audio.voiceId||process.env.ELEVENLABS_VOICE_ID;
if((!keys.length&&!cacheOnly)||!voiceId) throw Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env before voice generation');
const text=p.scenes.map(s=>s.voice).join(' ');
const modelId=p.audio.modelId||process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2';
const voiceSettings=p.audio.voiceSettings||{speed:1.04,stability:.58,similarity_boost:.75};
const hash=createHash('sha256').update(JSON.stringify({text,voiceId,modelId,voiceSettings})).digest('hex').slice(0,16);
const cacheDir=resolve(ROOT,'runs/studio',p.id,'voice-cache');
const publicDir=resolve(ROOT,'public/generated',p.id);
mkdirSync(cacheDir,{recursive:true});mkdirSync(publicDir,{recursive:true});
const cacheFile=resolve(cacheDir,hash+'.json');
let data;
if(existsSync(cacheFile)){
  data=JSON.parse(readFileSync(cacheFile,'utf8'));
  console.log('Reusing cached ElevenLabs take; no synthesis request.');
}else{
  if(cacheOnly) throw Error('No cached take for this text, voice and settings. Nothing was requested.');
  // Keys are accounts: take the first with enough characters, as the legacy process does.
  let key=null,remaining=NaN;
  for(const candidate of keys){
    const quota=await fetch(API+'/v1/user/subscription',{headers:{'xi-api-key':candidate},signal:AbortSignal.timeout(20000)});
    if(!quota.ok) continue;
    const subscription=await quota.json();
    remaining=subscription.character_limit-subscription.character_count;
    if(Number.isFinite(remaining)&&remaining>=text.length){key=candidate;break;}
  }
  if(!key) throw Error('Insufficient or unavailable ElevenLabs quota on every key. No synthesis request was made.');
  console.log('Generating one approved take ('+text.length+' characters); available quota '+remaining+'.');
  const url=API+'/v1/text-to-speech/'+encodeURIComponent(voiceId)+'/with-timestamps?output_format=mp3_44100_128';
  const response=await fetch(url,{method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},body:JSON.stringify({text,model_id:modelId,voice_settings:voiceSettings}),signal:AbortSignal.timeout(120000)});
  if(!response.ok) throw Error('ElevenLabs synthesis failed (HTTP '+response.status+'). No automatic retry was made.');
  data=await response.json();
  // Cache the successful billable result before any local processing can fail.
  writeFileSync(cacheFile,JSON.stringify(data));
}
if(!data.audio_base64) throw Error('No audio in cached ElevenLabs response');
const rawPath='generated/'+p.id+'/voice-'+hash+'.mp3';
writeFileSync(resolve(ROOT,'public',rawPath),Buffer.from(data.audio_base64,'base64'));
const alignment=[data.alignment,data.normalized_alignment].find(a=>a?.characters?.join('')===text);
if(!alignment) throw Error('Audio is cached, but character alignment differs from the script. Review the cached take; do not blindly regenerate.');
const starts=alignment.character_start_times_seconds;
const ends=alignment.character_end_times_seconds;
if(starts.length!==text.length||ends.length!==text.length||ends.some((n,i)=>!Number.isFinite(n)||n<starts[i])) throw Error('Invalid alignment; take retained in cache.');
const tool=(name,args)=>{
  const r=spawnSync('npx',['remotion',name,...args],{cwd:ROOT,encoding:'utf8',maxBuffer:8*1024*1024});
  if(r.status!==0) throw Error(name+' failed: '+(r.stderr||r.stdout).slice(-1000));
  return r.stdout;
};
const probe=JSON.parse(tool('ffprobe',['-v','error','-show_format','-of','json',resolve(ROOT,'public',rawPath)]));
const rawDuration=Number(probe.format.duration);
if(!Number.isFinite(rawDuration)||rawDuration<=0) throw Error('Cannot measure the generated voice');
const tempoTarget=limits.maxSeconds-limits.tempoHeadroomSeconds-limits.audioPadSeconds;
const speed=rawDuration>tempoTarget?rawDuration/tempoTarget:1;
if(speed>limits.maxTempo) throw Error('The take needs tempo x'+speed.toFixed(3)+', above the x'+limits.maxTempo+' limit. Edit the script before another synthesis; the take stays cached.');
const voicePath='generated/'+p.id+'/voice-'+hash+'-mix.wav';
tool('ffmpeg',['-y','-v','error','-i',resolve(ROOT,'public',rawPath),'-af','atempo='+speed+',loudnorm=I=-16:TP=-1.5:LRA=7','-ar','48000','-ac','1','-c:a','pcm_s16le',resolve(ROOT,'public',voicePath)]);
const fade=spawnSync('python3',[resolve(ROOT,'studio/fade-audio.py'),resolve(ROOT,'public',voicePath)],{encoding:'utf8'});
if(fade.status!==0) throw Error('Local audio fade failed: '+fade.stderr);
const processedProbe=JSON.parse(tool('ffprobe',['-v','error','-show_format','-of','json',resolve(ROOT,'public',voicePath)]));
const measured=Number(processedProbe.format.duration);
const words=[];
for(const match of text.matchAll(/\S+/g)){
  const start=match.index,end=start+match[0].length-1;
  words.push({startMs:Math.round(starts[start]/speed*1000),endMs:Math.round(ends[end]/speed*1000)});
}
applyWordTimings(p,p.audio.refineOnsets===false?words:refineOnsets(words,decodeEnvelope(resolve(ROOT,'public',voicePath))),measured);
p.audio={...p.audio,voicePath,sourcePath:rawPath,voiceId,modelId,timingMode:'ElevenLabs character alignment',sourceDurationSeconds:rawDuration,durationSeconds:measured,localTempo:speed,cacheHash:hash,normalization:'FFmpeg loudnorm -16 LUFS, true peak -1.5 dBTP, 12 ms/80 ms fades'};
writeFileSync(projectFile,JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({voicePath,rawDurationSeconds:rawDuration,measuredDurationSeconds:measured,localTempo:speed,videoDurationSeconds:p.durationSeconds,timedWords:p.captions.length}));
