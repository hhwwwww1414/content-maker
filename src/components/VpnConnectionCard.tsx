import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';

export const VpnConnectionCard: React.FC = () => {
  const frame = useCurrentFrame();
  const connected = frame > 52;
  const pulse = interpolate(Math.sin(frame / 8), [-1,1], [.9,1.04]);
  return <div style={{width:720,padding:'44px 48px',borderRadius:42,background:'rgba(21,27,29,.96)',border:`2px solid ${connected ? 'rgba(34,240,208,.52)' : colors.line}`,boxShadow: connected ? '0 35px 120px rgba(34,240,208,.18)' : '0 35px 100px rgba(0,0,0,.34)',opacity:interpolate(frame,[0,12],[0,1],{extrapolateRight:'clamp'}),translate:`${interpolate(frame,[0,18],[80,0],{extrapolateRight:'clamp'})}px 0`}}>
    <div style={{fontFamily:unbounded,fontWeight:700,fontSize:38,color:colors.white}}>VPN-клиент</div><div style={{fontFamily:manrope,fontWeight:600,fontSize:27,color:colors.gray,marginTop:10}}>быстрый импорт</div>
    <div style={{display:'flex',alignItems:'center',gap:30,marginTop:34}}><div style={{width:112,height:112,borderRadius:'50%',display:'grid',placeItems:'center',background:connected?colors.mint:'#243034',scale:connected?pulse:1,boxShadow:connected?'0 0 50px rgba(34,240,208,.35)':'none'}}><svg width="52" height="52" viewBox="0 0 52 52"><path d="M26 8v17M14 15a17 17 0 1 0 24 0" fill="none" stroke={connected?colors.background:colors.gray} strokeWidth="6" strokeLinecap="round"/></svg></div><div><div style={{fontFamily:unbounded,fontWeight:800,fontSize:40,color:connected?colors.mint:colors.white}}>{connected?'Защищено':'Подключение'}</div><div style={{fontFamily:manrope,fontWeight:700,fontSize:25,color:colors.gray}}>{connected?'Стабильное соединение':'Одно нажатие'}</div></div></div>
  </div>;
};
