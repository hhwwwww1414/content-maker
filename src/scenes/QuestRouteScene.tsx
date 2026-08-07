import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {EnergySphere} from '../components/EnergySphere';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

const CP_FRAMES = [0, 16, 40, 80, 95];
const CP_X = [320, 170, 470, 220, 320];
const CP_Y = [0, 120, 320, 460, 580];
const TRAIL_LAGS = [5, 10, 16, 22];

const RouteLabel: React.FC<{text: string; x: number; y: number; appearFrame: number; lit: number}> = ({text, x, y, appearFrame, lit}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [appearFrame, appearFrame + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        translate: '-50% -50%',
        opacity: enter,
        scale: interpolate(enter, [0, 1], [0.85, 1]),
        padding: '10px 22px',
        borderRadius: 14,
        background: `linear-gradient(180deg, rgba(34,240,208,${0.14 + lit * 0.18}), rgba(16,22,24,.86))`,
        border: `1px solid rgba(140,255,233,${0.32 + lit * 0.4})`,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,.15), 0 10px 26px rgba(0,0,0,.4), 0 0 ${20 * lit}px rgba(34,240,208,${lit * 0.5})`,
        fontFamily: unbounded,
        fontWeight: 800,
        fontSize: 20,
        color: colors.white,
        textTransform: 'uppercase',
        letterSpacing: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

export const QuestRouteScene: React.FC<{durationInFrames: number; beats: number[]}> = ({durationInFrames, beats}) => {
  const frame = useCurrentFrame();
  const [telegramBeat, accessBeat, connectionBeat] = beats;

  const posX = (f: number) => interpolate(f, CP_FRAMES, CP_X, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const posY = (f: number) => interpolate(f, CP_FRAMES, CP_Y, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const sphereScale = interpolate(frame, [0, 95], [0.7, 1.25], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const portalOutline = interpolate(frame, [46, 74], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const portalGlow = interpolate(frame, [68, 95], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const passThrough = interpolate(frame, [95, 109], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sphereOpacity = 1 - interpolate(frame, [103, 112], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const litFor = (beat: number) => interpolate(frame, [beat - 4, beat + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // A calm, steady glow settles in behind the portal once the sphere has passed through.
  const settleGlow = interpolate(frame, [109, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.7} />
      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          height: 'auto',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{position: 'relative', width: 640, height: 780}}>
          <RouteLabel text="Telegram" x={170} y={120} appearFrame={16} lit={litFor(16)} />
          <RouteLabel text="Доступ" x={470} y={320} appearFrame={telegramBeat + 24} lit={litFor(accessBeat)} />
          <RouteLabel text="Соединение" x={220} y={460} appearFrame={accessBeat + 10} lit={litFor(connectionBeat)} />

          <div style={{position: 'absolute', left: 320, top: 580, translate: '-50% -50%'}}>
            <div
              style={{
                position: 'relative',
                width: 340,
                height: 340,
                borderRadius: '50%',
                overflow: 'hidden',
                opacity: portalOutline,
                scale: interpolate(portalOutline, [0, 1], [0.75, 1]),
                border: `2px solid rgba(140,255,233,${0.3 + portalGlow * 0.4})`,
                boxShadow: `0 0 ${90 * portalGlow}px rgba(34,240,208,${0.2 + portalGlow * 0.35}), inset 0 0 60px rgba(34,240,208,${portalGlow * 0.35})`,
                background: `radial-gradient(circle at 50% 40%, rgba(34,240,208,${0.15 + portalGlow * 0.25}), rgba(8,12,13,.92) 72%)`,
              }}
            >
              {Array.from({length: 6}).map((_, i) => (
                <div
                  key={i}
                  style={{position: 'absolute', left: 0, right: 0, top: `${(i + 1) * 14}%`, height: 1, background: `rgba(140,255,233,${0.15 * portalGlow})`}}
                />
              ))}
            </div>
          </div>

          {TRAIL_LAGS.map((lag, i) => {
            const f = Math.max(0, frame - lag);
            const dotOpacity = interpolate(frame, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * (1 - i / (TRAIL_LAGS.length + 1)) * (1 - passThrough);
            return (
              <div
                key={lag}
                style={{
                  position: 'absolute',
                  left: posX(f),
                  top: posY(f),
                  translate: '-50% -50%',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: colors.mint,
                  opacity: dotOpacity * 0.5,
                  filter: 'blur(1px)',
                }}
              />
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: posX(frame),
              top: posY(frame),
              translate: '-50% -50%',
              scale: sphereScale + passThrough * 0.6,
              opacity: sphereOpacity,
              zIndex: 2,
            }}
          >
            <EnergySphere size={30} />
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 130,
            width: 500,
            height: 220,
            borderRadius: '50%',
            background: colors.mint,
            filter: 'blur(150px)',
            opacity: settleGlow * 0.22,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
