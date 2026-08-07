import {random} from 'remotion';
import {colors} from '../theme/colors';

const PARTICLES=Array.from({length:72},(_,i)=>({x:random(`lp-x-${i}`)*1080,y:250+random(`lp-y-${i}`)*1250,s:2+random(`lp-s-${i}`)*5,v:.3+random(`lp-v-${i}`)*1.1}));
export const FrozenParticleField:React.FC<{frame:number; motion:number; opacity?:number}>=({frame,motion,opacity=1})=><div style={{position:'absolute',inset:0,opacity}}>{PARTICLES.map((p,i)=>{
  const drift=(frame*p.v)%180;
  return <div key={i} style={{position:'absolute',left:p.x,top:p.y,translate:`${Math.sin((frame+i)/35)*18*motion}px ${-drift*motion}px`,width:p.s,height:p.s*2.4,borderRadius:5,background:i%5===0?colors.white:colors.mint,opacity:.12+(i%7)/14,boxShadow:'0 0 10px rgba(34,240,208,.5)'}}/>;
})}</div>;
