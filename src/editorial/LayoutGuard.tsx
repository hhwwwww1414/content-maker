import {useEffect, useState} from 'react';
import type {RefObject} from 'react';
import {cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';

// Check real rendered text geometry on every frame, including preview frames.
export const LayoutGuard=({root:rootRef}:{root:RefObject<HTMLDivElement|null>})=>{
  const frame=useCurrentFrame();
  const [handle]=useState(()=>delayRender('Checking editorial text layout'));
  useEffect(()=>{
    const root=rootRef.current;
    if(!root) return;
    const bounds=root.getBoundingClientRect();
    // Remotion also mounts a hidden measuring tree; it is not a rendered frame.
    if(bounds.width===0||bounds.height===0||bounds.y<-10000){continueRender(handle);return;}
    const scale=bounds.width/1080;
    const errors:string[]=[];
    root.querySelectorAll<HTMLElement>('[data-qa="title"],[data-qa="captions"]').forEach(element=>{
      const b=element.getBoundingClientRect();
      if(element.scrollWidth>element.clientWidth+2||element.scrollHeight>element.clientHeight+2) errors.push('Text overflow');
      if(b.left<bounds.left+90*scale||b.right>bounds.left+945*scale||b.top<bounds.top+155*scale||b.bottom>bounds.top+1605*scale) errors.push('Text outside editorial safe area '+JSON.stringify({root:{x:bounds.x,y:bounds.y,width:bounds.width},text:{x:b.x,y:b.y,width:b.width,height:b.height}}));
    });
    root.querySelectorAll('[data-qa="label"]').forEach(label=>{
      const box=label.querySelector('rect')?.getBoundingClientRect();
      const text=label.querySelector('text')?.getBoundingClientRect();
      if(box&&text&&(text.left<box.left+5*scale||text.right>box.right-5*scale||text.top<box.top||text.bottom>box.bottom)) errors.push('SVG label overflow');
    });
    if(errors.length) cancelRender(new Error('Editorial layout frame '+frame+': '+errors.join('; ')));
    continueRender(handle);
  },[frame,handle,rootRef]);
  return null;
};
