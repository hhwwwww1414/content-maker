#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readPng,luminanceStats} from '../scripts/eleven/lib/png.mjs';
const root=resolve(import.meta.dirname,'..');
const p=JSON.parse(readFileSync(resolve(root,'studio/gps-offline.json'),'utf8'));
const mode=process.argv[2]||'production';
if(!['preview','production'].includes(mode)) throw Error('Usage: node studio/qa.mjs preview|production');
const video=resolve(root,mode==='preview'?'out/studio/gps-offline-preview.mp4':'out/studio/gps-offline.mp4');
if(!existsSync(video)) throw Error('Missing '+video);
const run=(name,args,binary=false)=>{
  const r=spawnSync('npx',['remotion',name,...args],{cwd:root,encoding:binary?undefined:'utf8',maxBuffer:40*1024*1024});
  if(r.status!==0) throw Error(name+' failed: '+String(r.stderr||r.stdout).slice(-1500));
  return r;
};
const probe=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video]).stdout);
const v=probe.streams.find(s=>s.codec_type==='video');
const a=probe.streams.find(s=>s.codec_type==='audio');
const seconds=Number(probe.format.duration);
const expectedText=p.scenes.map(s=>s.voice).join(' ');
const checks={
  dimensions:v?.width===(mode==='preview'?540:1080)&&v?.height===(mode==='preview'?960:1920),
  fps:v?.r_frame_rate==='30/1',h264:v?.codec_name==='h264',
  duration:seconds>=20&&seconds<=25&&Math.abs(seconds-p.durationSeconds)<.1,
  audio:mode==='preview'||!!a,
  approval:p.status.factCheck==='reviewed'&&p.status.scriptApproval==='approved',
  sources:p.scenes.every(s=>s.sources?.length&&s.sources.every(id=>p.sources.some(source=>source.id===id))),
  sceneTiming:p.scenes.every((s,i)=>i===0?s.start===0:Math.abs(s.start-(p.scenes[i-1].start+p.scenes[i-1].duration))<.001),
  captions:mode==='preview'||p.captions.length>0,
  captionText:mode==='preview'||p.captions.map(c=>c.text).join(' ')===expectedText,
  captionTiming:mode==='preview'||p.captions.every((c,i)=>c.startMs>=0&&c.endMs>c.startMs&&c.endMs<=seconds*1000+50&&(!i||c.startMs>=p.captions[i-1].startMs)),
};
const frameDir=resolve(root,'out/studio/qa-frames',mode);mkdirSync(frameDir,{recursive:true});
const sampleTimes=[0,...p.scenes.flatMap(s=>[s.start+.12,s.start+s.duration*.6]),...p.scenes.slice(1).flatMap(s=>[s.start-1/p.fps,s.start]),Math.max(0,seconds-.15)];
const sampleFrames=[];
for(const time of [...new Set(sampleTimes.map(t=>Math.max(0,Math.min(seconds-.05,t)).toFixed(3)))]){
  const file=resolve(frameDir,'frame-'+time+'.png');
  run('ffmpeg',['-y','-v','error','-ss',time,'-i',video,'-frames:v','1',file]);
  const stats=luminanceStats(readPng(file),{x:0,y:0,width:v.width,height:v.height});
  sampleFrames.push({seconds:Number(time),path:file,...stats});
}
checks.sampledFramesVisible=sampleFrames.every(s=>s.mean>7&&s.stdDev>6);
// Decode every frame, rather than inferring corruption or black frames from six stills.
const decoded=run('ffmpeg',['-v','error','-i',video,'-an','-vf','scale=54:96','-pix_fmt','rgb24','-c:v','rawvideo','-f','image2pipe','-'],true).stdout;
const stride=54*96*3,frameCount=Math.floor(decoded.length/stride);
let blackFrames=0,maxLuminanceJump=0,previous=0;
for(let offset=0;offset+stride<=decoded.length;offset+=stride){
  let sum=0;
  for(let i=offset;i<offset+stride;i+=3) sum+=.2126*decoded[i]+.7152*decoded[i+1]+.0722*decoded[i+2];
  const mean=sum/(54*96);
  if(mean<3) blackFrames++;
  if(offset) maxLuminanceJump=Math.max(maxLuminanceJump,Math.abs(mean-previous));
  previous=mean;
}
checks.completeDecode=frameCount===Math.round(p.durationSeconds*p.fps);
checks.noBlackFrames=blackFrames===0;
checks.noFullFrameFlashes=maxLuminanceJump<60;
let audioMetrics=null;
if(mode==='production'&&a){
  const wav=run('ffmpeg',['-v','error','-i',video,'-vn','-ac','1','-ar','48000','-c:a','pcm_s16le','-f','wav','-'],true).stdout;
  let dataOffset=12;
  while(dataOffset+8<=wav.length&&wav.toString('ascii',dataOffset,dataOffset+4)!=='data'){
    const length=wav.readUInt32LE(dataOffset+4);
    dataOffset+=8+length+(length%2);
  }
  if(dataOffset+8>wav.length) throw Error('Decoded audio WAV has no data chunk');
  const decodedAudio=wav.subarray(dataOffset+8);
  let squareSum=0,peak=0;
  for(let i=0;i+1<decodedAudio.length;i+=2){const value=decodedAudio.readInt16LE(i)/32768;squareSum+=value*value;peak=Math.max(peak,Math.abs(value));}
  const rms=Math.sqrt(squareSum/(decodedAudio.length/2));
  const analysis=run('ffmpeg',['-hide_banner','-i',video,'-vn','-af','loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json','-c:a','pcm_s16le','-f','null','-']).stderr;
  const json=String(analysis).match(/\{[^{}]*"input_i"[^{}]*\}/);
  const loudness=json?JSON.parse(json[0]):null;
  audioMetrics={rmsDb:20*Math.log10(rms),samplePeakDb:20*Math.log10(peak),durationSeconds:decodedAudio.length/2/48000,integratedLufs:loudness?Number(loudness.input_i):null,truePeakDb:loudness?Number(loudness.input_tp):null};
  checks.nonSilentAudio=rms>.01;
  checks.noAudioClipping=peak<.995;
  checks.voiceLevel=!!loudness&&audioMetrics.integratedLufs>=-20&&audioMetrics.integratedLufs<=-12&&audioMetrics.truePeakDb<=-.5;
  const lastWordEnd=p.captions[p.captions.length-1].endMs/1000;
  audioMetrics.endHoldSeconds=seconds-audioMetrics.durationSeconds;
  // The planned final visual hold is intentionally silent. Check the spoken
  // content for truncation and the measured track against its source length.
  checks.audioVideoDuration=Math.abs(audioMetrics.durationSeconds-p.audio.durationSeconds)<.15&&audioMetrics.durationSeconds>=lastWordEnd-.03&&audioMetrics.endHoldSeconds>=-.05&&audioMetrics.endHoldSeconds<=1;
}
const manualFile=resolve(root,'out/studio/gps-offline-manual-review.json');
const manualReview=existsSync(manualFile)?JSON.parse(readFileSync(manualFile,'utf8')):{
  visual:'pending',facts:'pending',audioListening:'pending',
  note:'Machine checks do not certify voice prosody or visual taste.'
};
const report={
  project:p.id,mode,video,
  measured:{durationSeconds:seconds,width:v.width,height:v.height,fps:v.r_frame_rate,videoCodec:v.codec_name,audioCodec:a?.codec_name||null,frameCount,blackFrames,maxLuminanceJump,audio:audioMetrics},
  checks,passed:Object.values(checks).every(Boolean),manualReview,sampleFrames,
};
const reportPath=resolve(root,'out/studio/gps-offline-'+mode+'-qa.json');
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
if(mode==='production'&&report.passed){
  p.renderPath='out/studio/gps-offline.mp4';
  p.qa={path:'out/studio/gps-offline-production-qa.json',passed:true,manualListeningRequired:manualReview.audioListening?.status!=='reviewed'};
  p.status.production='rendered';
  writeFileSync(resolve(root,'studio/gps-offline.json'),JSON.stringify(p,null,2)+'\n');
}
console.log(JSON.stringify({report:reportPath,measured:report.measured,checks,passed:report.passed},null,2));
if(!report.passed) process.exit(1);
