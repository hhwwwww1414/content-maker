import React from 'react';
import type {Caption} from '@remotion/captions';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import project from '../../studio/gps-offline.json';
import {palette} from './Design';

const estimated:Caption[]=project.scenes.flatMap(scene=>{
  const words=scene.voice.split(/\s+/);
  return words.map((text,i)=>({text,startMs:1000*(scene.start+scene.duration*i/words.length),endMs:1000*(scene.start+scene.duration*(i+1)/words.length),timestampMs:null,confidence:null}));
});
const words:Caption[]=project.captions.length?project.captions as Caption[]:estimated;
export const captionPages:Caption[][]=[];
for(const word of words){
  const last=captionPages[captionPages.length-1];
  const combined=last?[...last,word].map(w=>w.text).join(' '):'';
  if(!last||last.length>=4||combined.length>38||word.startMs-last[0].startMs>1450||/[.!?]$/.test(last[last.length-1].text)){
    captionPages.push([word]);
  }else last.push(word);
}

export const Captions:React.FC = () => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const now=frame/fps*1000;
  const page=captionPages.find((p,i)=>now>=p[0].startMs&&now<Math.min(captionPages[i+1]?.[0].startMs??Infinity,p[p.length-1].endMs+280));
  if(!page) return null;
  return <div data-qa="captions" style={{position:'absolute',left:96,top:1420,width:844,height:120,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',color:palette.ink,fontFamily:'Arial, sans-serif',fontSize:46,fontWeight:700,lineHeight:1.22}}>
    <div>{page.map((word,i)=><React.Fragment key={word.startMs}>{i?' ':''}<span style={{color:now>=word.startMs&&now<word.endMs?palette.mint:palette.ink}}>{word.text}</span></React.Fragment>)}</div>
  </div>;
};
