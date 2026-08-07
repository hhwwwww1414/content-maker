import {Audio} from '@remotion/media';
import type {ReactNode} from 'react';
import {AbsoluteFill,Easing,Img,interpolate,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import captions from '../generated/captions-last-percent.json';
import timeline from '../generated/timeline-last-percent.json';
import {CaptionPage} from '../components/CaptionPage';
import {CompletionPulse} from '../components/CompletionPulse';
import {CyberBackground} from '../components/CyberBackground';
import {DataFragment} from '../components/DataFragment';
import {DataSpiral} from '../components/DataSpiral';
import {FrozenParticleField} from '../components/FrozenParticleField';
import {FrozenProgressRing} from '../components/FrozenProgressRing';
import {MissingDataSlot} from '../components/MissingDataSlot';
import {ScanningWave} from '../components/ScanningWave';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {computeLastPercentFrames} from './lastPercentSceneFrames';

type Page={text:string;startMs:number;durationMs:number;tokens:Array<{text:string;fromMs:number;toMs:number}>};
const EASE={easing:Easing.inOut(Easing.cubic),extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const Text:React.FC<{top:number;opacity:number;size?:number;children:ReactNode;mint?:boolean}>=({top,opacity,size=54,children,mint})=><div style={{position:'absolute',left:110,width:710,top,textAlign:'center',fontFamily:unbounded,fontWeight:800,fontSize:size,lineHeight:1.16,textTransform:'uppercase',color:mint?colors.mint:colors.white,opacity,translate:`0 ${interpolate(opacity,[0,1],[18,0])}px`,textShadow:mint?'0 0 28px rgba(34,240,208,.32)':'0 4px 24px rgba(2,3,4,.7)',zIndex:20}}>{children}</div>;

export const GhostPepeLastPercentReel:React.FC=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const b=computeLastPercentFrames();
  const ringFill=interpolate(frame,[0,b.resume,b.resume+28],[0,0,1],EASE);
  const particleMotion=interpolate(frame,[0,50,75,b.resume,b.resume+32],[1,1,0,0,1],EASE);
  const searchIn=interpolate(frame,[b.search-12,b.search+20],[0,1],EASE);
  const findIn=interpolate(frame,[b.find-10,b.find+24],[0,1],EASE);
  const scan=interpolate(frame,[b.findB-5,b.findB+34],[0,1],EASE);
  const travel=interpolate(frame,[b.resume-8,b.resume+40],[0,1],EASE);
  const complete=interpolate(frame,[b.resume+22,b.resume+50],[0,1],EASE);
  const cta=interpolate(frame,[b.cta-4,b.cta+18],[0,1],EASE);
  const worldOpacity=interpolate(frame,[b.cta-8,b.cta+12],[1,0],EASE);
  const camScale=interpolate(frame,[0,b.search+35,b.find+28,b.resume+35],[1.02,1.62,1.38,1.02],EASE);
  const camY=interpolate(frame,[0,b.search+35,b.resume+35],[50,-55,10],EASE);
  const fragX=interpolate(travel,[0,1],[650,500]);const fragY=interpolate(travel,[0,1],[880,980]);
  const ringLabel=Math.min(1,1-searchIn+complete);
  const mascotScale=interpolate(frame,[b.resume-6,b.resume+30],[1,.78],EASE);
  const hook=interpolate(frame,[0,7,b.search-16,b.search],[0,1,1,0],EASE);
  const searchA=interpolate(frame,[b.search,b.search+18,b.searchB-8,b.searchB+8],[0,1,1,0],EASE);
  const searchB=interpolate(frame,[b.searchB,b.searchB+18,b.find-14,b.find],[0,1,1,0],EASE);
  const foundText=interpolate(frame,[b.findB-8,b.findB+18,b.resume-12,b.resume],[0,1,1,0],EASE);
  const resumeText=interpolate(frame,[b.resumeB-10,b.resumeB+18,b.cta-14,b.cta],[0,1,1,0],EASE);
  const ctaMs=timeline.segments.find(s=>s.id==='cta_a')?.startMs??Infinity;
  const pages=(captions as Page[]).filter(p=>p.startMs<ctaMs);
  return <AbsoluteFill style={{backgroundColor:colors.bgDeep,overflow:'hidden'}}>
    <CyberBackground mode="mint" intensity={.55+.25*complete}/><FrozenParticleField frame={frame} motion={particleMotion} opacity={1-cta*.45}/>
    <AbsoluteFill style={{opacity:worldOpacity,scale:camScale,translate:`0 ${camY}px`,transformOrigin:'470px 850px'}}>
      <div style={{position:'absolute',left:230,top:510}}><FrozenProgressRing progress={ringFill} labelOpacity={ringLabel}/></div>
      <div style={{position:'absolute',left:190,top:530,opacity:searchIn*(1-complete*.35)}}><DataSpiral rotation={interpolate(frame,[b.search,b.resume+30],[0,26],EASE)*(1-particleMotion*.25)} opacity={searchIn} depth={searchIn}/></div>
      <div style={{position:'absolute',left:470,top:930,zIndex:7,opacity:searchIn}}><MissingDataSlot filled={complete} glow={scan}/></div>
      <DataFragment x={fragX} y={fragY} noise={(1-scan)*searchIn} found={scan} scale={.82+.18*scan}/>
      <ScanningWave progress={scan} opacity={findIn}/><CompletionPulse progress={complete}/>
      <div style={{position:'absolute',left:250,top:650,zIndex:12,opacity:findIn,translate:`${-35*(1-findIn)-55*(1-mascotScale)}px ${30*(1-findIn)}px`,scale:(.97+.03*findIn)*mascotScale,filter:`drop-shadow(0 0 ${26*findIn}px rgba(34,240,208,.35))`}}><Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width:270,height:270,objectFit:'contain'}}/></div>
    </AbsoluteFill>
    <Text top={1160} opacity={hook} size={48} mint>И тишина</Text>
    <Text top={300} opacity={searchA} size={48}>Всё почти готово</Text><Text top={300} opacity={searchB} size={43}>Но одного фрагмента <span style={{color:colors.errorRed}}>нет</span></Text>
    <Text top={300} opacity={foundText} size={46}>Недостающий пакет<br/><span style={{color:colors.mint}}>найден</span></Text>
    <Text top={300} opacity={resumeText} size={48}>Поток<br/><span style={{color:colors.mint}}>снова движется</span></Text>
    <AbsoluteFill style={{opacity:cta,alignItems:'center'}}>
      <div style={{position:'absolute',left:265,top:300,opacity:.45}}><FrozenProgressRing progress={1} size={410} compact/></div>
      <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{position:'absolute',left:270,top:350,width:280,height:280,objectFit:'contain',filter:'drop-shadow(0 0 25px rgba(34,240,208,.3))'}}/>
      <div style={{position:'absolute',top:735,left:110,width:710,textAlign:'center',fontFamily:unbounded,fontWeight:800,fontSize:46,lineHeight:1.18,color:colors.white}}>НЕ ЖДИ<br/><span style={{color:colors.mint}}>ПОСЛЕДНИЙ ПРОЦЕНТ</span></div>
      <div style={{position:'absolute',top:900,left:150,width:630,padding:'24px 10px',borderRadius:28,border:'2px solid rgba(140,255,233,.5)',background:'rgba(8,24,22,.7)',boxShadow:`inset ${interpolate(frame,[b.cta,b.end],[0,620],EASE)}px 0 80px rgba(34,240,208,.08)`,textAlign:'center',fontFamily:unbounded,fontWeight:700,fontSize:31,color:colors.lightMint}}>ПОПРОБОВАТЬ В TELEGRAM</div>
    </AbsoluteFill>
    <AbsoluteFill>{pages.map((p,i)=>{const from=Math.round(p.startMs/1000*fps)+2;const dur=Math.max(1,Math.round(p.durationMs/1000*fps)-2);return <Sequence key={i} from={from} durationInFrames={dur}><CaptionPage page={p} layout={deadlineLayout} riseIn/></Sequence>})}</AbsoluteFill>
    <Audio src={staticFile('generated/ambient.wav')} loop volume={f=>Math.min(.055,f/(fps*2)*.055)}/><Audio src={staticFile('generated/voiceover-last-percent.wav')}/>
    <Sequence from={45}><Audio src={staticFile('generated/click.wav')} volume={.12}/></Sequence><Sequence from={b.resume+26}><Audio src={staticFile('generated/connect.wav')} volume={.11}/></Sequence><Sequence from={b.cta-8}><Audio src={staticFile('generated/whoosh.wav')} volume={.14}/></Sequence>
  </AbsoluteFill>;
};
