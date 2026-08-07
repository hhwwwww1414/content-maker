import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';

export const FrozenProgressRing: React.FC<{progress: number; size?: number; labelOpacity?: number; compact?: boolean}> = ({progress, size = 620, labelOpacity = 1, compact = false}) => {
  const radius = size * 0.39;
  const circumference = 2 * Math.PI * radius;
  const percent = 99 + progress;
  return <div style={{position:'relative',width:size,height:size,filter:'drop-shadow(0 0 38px rgba(34,240,208,.22))'}}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="rgba(8,12,13,.48)" stroke="rgba(140,255,233,.12)" strokeWidth={24}/>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={colors.mint} strokeWidth={compact?16:24} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*(1-percent/100)} transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <circle cx={size/2} cy={size/2} r={radius-28} fill="none" stroke="rgba(140,255,233,.24)" strokeWidth={2}/>
    </svg>
    {!compact && <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:unbounded,fontWeight:800,fontSize:136,color:colors.white,opacity:labelOpacity,textShadow:'0 0 34px rgba(34,240,208,.28)'}}>{progress<.5?'99%':'100%'}</div>}
  </div>;
};
