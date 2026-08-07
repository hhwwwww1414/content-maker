import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';

export const TelegramCard: React.FC = () => {
  const frame = useCurrentFrame();
  const done = frame > 50;
  return <div style={{width: 720, padding: '44px 48px', borderRadius: 42, background: 'rgba(21,27,29,.94)', border: `2px solid ${colors.line}`, boxShadow: '0 35px 100px rgba(0,0,0,.34)', opacity: interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'}), translate: `${interpolate(frame, [0, 18], [-80, 0], {extrapolateRight: 'clamp'})}px 0`}}>
    <div style={{display:'flex', alignItems:'center', gap:24}}><Img src={staticFile('assets/mascot/ghostpepe-second.png')} style={{width:72,height:72,borderRadius:22,objectFit:'cover'}}/><div><div style={{fontFamily:unbounded,fontWeight:700,fontSize:34,color:colors.white}}>Telegram-бот</div><div style={{fontFamily:manrope,fontWeight:600,fontSize:26,color:colors.gray}}>Подписка готова к подключению</div></div></div>
    <div style={{marginTop:34, height:76, borderRadius:24, display:'grid',placeItems:'center', background:done ? 'rgba(34,240,208,.16)' : colors.mint, color:done ? colors.lightMint : colors.background, fontFamily:manrope, fontWeight:800, fontSize:30}}>{done ? 'Подписка получена' : 'Получить подписку'}</div>
  </div>;
};
