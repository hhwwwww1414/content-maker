import {colors} from '../theme/colors';

export const DataSpiral:React.FC<{rotation:number; opacity:number; depth:number}>=({rotation,opacity,depth})=><div style={{position:'relative',width:700,height:700,opacity,rotate:`${rotation}deg`,scale:.9+.12*depth}}>
  <svg width="700" height="700" viewBox="0 0 700 700">
    {[0,1,2,3].map(i=><ellipse key={i} cx="350" cy="350" rx={120+i*58} ry={80+i*45} fill="none" stroke={`rgba(140,255,233,${.13+i*.04})`} strokeWidth={3} transform={`rotate(${i*21} 350 350)`}/>) }
    {Array.from({length:15},(_,i)=>{const a=i/15*Math.PI*5;const r=72+i*13;const x=350+Math.cos(a)*r;const y=350+Math.sin(a)*r*.64;return <g key={i}><circle cx={x} cy={y} r={i===12?14:10} fill={i===12?'rgba(8,12,13,.8)':colors.mint} stroke={i===12?colors.errorRed:colors.lightMint} strokeOpacity={i===12?.35:.7} strokeWidth={3}/>{i!==12&&<circle cx={x} cy={y} r={22} fill="none" stroke="rgba(34,240,208,.12)"/>}</g>})}
  </svg>
  <div style={{position:'absolute',inset:170,borderRadius:'50%',background:'rgba(34,240,208,.10)',filter:'blur(45px)'}}/>
</div>;
