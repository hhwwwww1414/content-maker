import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {PhoneFrame} from '../components/PhoneFrame';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const GhostPepeDeadlineCover: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep}}>
      <CyberBackground mode="mint" intensity={0.85} />

      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          bottom: 1920 - deadlineLayout.safeBottom,
          height: 'auto',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{marginTop: 22, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 68,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: colors.white,
              textTransform: 'uppercase',
              textShadow: '0 8px 30px rgba(0,0,0,.5)',
            }}
          >
            До созвона
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: -3,
              color: colors.mint,
              textTransform: 'uppercase',
              textShadow: '0 0 46px rgba(34,240,208,.4), 0 8px 30px rgba(0,0,0,.5)',
            }}
          >
            15 секунд
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: unbounded,
            fontWeight: 600,
            fontSize: 32,
            color: colors.gray,
            textTransform: 'uppercase',
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          А <span style={{color: colors.errorRed}}>VPN</span> всё ещё <span style={{color: colors.errorRed}}>думает</span>
        </div>

        <div style={{marginTop: 40, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
          <div
            style={{
              position: 'absolute',
              width: 560,
              height: 560,
              borderRadius: '50%',
              background: colors.mint,
              filter: 'blur(150px)',
              opacity: 0.22,
            }}
          />

          <PhoneFrame width={420} height={600} danger>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}>
              <div
                style={{
                  fontFamily: unbounded,
                  fontWeight: 800,
                  fontSize: 96,
                  lineHeight: 1,
                  letterSpacing: -1,
                  color: colors.white,
                  textShadow: '0 0 30px rgba(255,255,255,.18)',
                }}
              >
                00:<span style={{color: colors.errorRed, textShadow: '0 0 26px rgba(255,90,82,.55)'}}>15</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: colors.errorRed,
                    boxShadow: '0 0 18px rgba(255,90,82,.85)',
                  }}
                />
                <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 25, color: colors.white}}>ПОДКЛЮЧЕНИЕ...</div>
              </div>
            </div>
          </PhoneFrame>

          <div style={{filter: 'drop-shadow(0 25px 60px rgba(0,0,0,.55)) drop-shadow(0 0 40px rgba(34,240,208,.16))'}}>
            <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 230, height: 230, objectFit: 'contain'}} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
