import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';

const points = [[178,285],[325,195],[448,318],[575,178],[670,352],[390,442]];
export const MapNetwork: React.FC = () => {
  const frame=useCurrentFrame();
  const draw=interpolate(frame,[4,45],[0,1],{extrapolateRight:'clamp'});
  return <svg width="820" height="590" viewBox="0 0 820 590">
    <path d="M110 260L175 170L286 134L356 165L456 112L577 142L688 218L719 344L656 445L529 477L449 532L310 500L234 430L139 399Z" fill="rgba(34,240,208,.045)" stroke="rgba(140,255,233,.22)" strokeWidth="3"/>
    {points.slice(1).map((p,i)=><line key={`l${i}`} x1={points[0][0]} y1={points[0][1]} x2={p[0]} y2={p[1]} stroke={colors.mint} strokeWidth="4" opacity={.18+.42*draw} strokeDasharray={`${Math.round(draw*500)} 500`}/>) }
    {points.map((p,i)=><g key={`p${i}`} style={{opacity:interpolate(frame,[i*5,i*5+12],[0,1],{extrapolateRight:'clamp'})}}><circle cx={p[0]} cy={p[1]} r="24" fill={colors.mint} opacity=".12"/><circle cx={p[0]} cy={p[1]} r="9" fill={i===0?colors.lightMint:colors.mint}/></g>)}
  </svg>;
};
