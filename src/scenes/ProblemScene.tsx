import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DeviceMockup} from '../components/DeviceMockup';
import {colors} from '../theme/colors';
import {layout} from '../theme/layout';
import {manrope, unbounded} from '../theme/fonts';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 15, stiffness: 175}});
  const glitch = frame > 28 && frame < 35 ? Math.sin(frame * 13) * 10 : 0;
  const shake = frame > 42 && frame < 53 ? Math.sin(frame * 3.8) * 8 * (1 - (frame - 42) / 11) : 0;

  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: layout.top, boxSizing: 'border-box'}}>
      <div
        style={{
          width: layout.contentWidth,
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 72,
          lineHeight: 1.05,
          letterSpacing: -3,
          color: colors.white,
          textAlign: 'center',
          opacity: interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'}),
          translate: `${glitch}px 0`,
        }}
      >
        VPN ОПЯТЬ
        <br />
        <span style={{color: colors.error}}>НЕ ОТВЕЧАЕТ?</span>
      </div>
      <div
        style={{
          marginTop: 54,
          scale: interpolate(enter, [0, 1], [0.68, 1]),
          translate: `${shake}px ${interpolate(enter, [0, 1], [200, 0])}px`,
          position: 'relative',
        }}
      >
        <DeviceMockup width={430} height={680} error>
          <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28}}>
            <div style={{width: 100, height: 100, borderRadius: '50%', border: '9px solid rgba(255,255,255,.08)', borderTopColor: colors.error, rotate: `${frame * 8}deg`}} />
            <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: colors.white}}>Подключение…</div>
            <div
              style={{
                width: 330,
                padding: '23px 24px',
                boxSizing: 'border-box',
                borderRadius: 22,
                background: 'rgba(255,102,90,.12)',
                border: '2px solid rgba(255,102,90,.33)',
                fontFamily: manrope,
                fontWeight: 800,
                fontSize: 27,
                color: colors.error,
                textAlign: 'center',
                opacity: interpolate(frame, [34, 44], [0, 1], {extrapolateRight: 'clamp', easing: Easing.bezier(.2, 1, .3, 1)}),
              }}
            >
              VPN не отвечает
            </div>
          </div>
        </DeviceMockup>
      </div>
    </AbsoluteFill>
  );
};
