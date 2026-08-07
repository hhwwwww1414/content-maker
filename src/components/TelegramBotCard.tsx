import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';

export const TelegramBotCard: React.FC<{pressFrame: number}> = ({pressFrame}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], {extrapolateRight: 'clamp'});
  const pressed = frame > pressFrame;
  const pulse = pressed ? interpolate(frame, [pressFrame, pressFrame + 6], [0.94, 1], {extrapolateRight: 'clamp'}) : 1;

  return (
    <div
      style={{
        width: 680,
        padding: '40px 44px',
        borderRadius: 40,
        background: 'rgba(16,22,24,.94)',
        border: `2px solid ${colors.line}`,
        boxShadow: '0 30px 90px rgba(0,0,0,.4)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [40, 0])}px`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 68, height: 68, borderRadius: 20, objectFit: 'cover'}} />
        <div>
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: colors.white}}>Telegram-бот</div>
          <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 23, color: colors.gray}}>Telegram-бот</div>
        </div>
      </div>
      <div
        style={{
          marginTop: 30,
          height: 78,
          borderRadius: 24,
          display: 'grid',
          placeItems: 'center',
          background: pressed ? 'rgba(34,240,208,.18)' : colors.mint,
          color: pressed ? colors.lightMint : colors.background,
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 28,
          scale: pulse,
        }}
      >
        {pressed ? 'Подписка получена' : 'Получить подписку'}
      </div>
    </div>
  );
};
