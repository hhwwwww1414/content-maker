import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {EnergySphere} from '../components/EnergySphere';
import {MazeDoor} from '../components/MazeDoor';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const QuestMazeScene: React.FC<{durationInFrames: number; beats: number[]}> = ({durationInFrames, beats}) => {
  const frame = useCurrentFrame();
  const [serverBeat, keyBeat, settingsBeat] = beats;

  // Camera settles slightly lower once the second level opens, and returns to level
  // as the route folds back toward the familiar starting corridor.
  const descend = interpolate(frame, [keyBeat, keyBeat + 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cameraY = interpolate(descend, [0, 1], [0, 34]);

  const returnStart = settingsBeat + 34;
  const returnProgress = interpolate(frame, [returnStart, durationInFrames - 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sphereX = interpolate(returnProgress, [0, 1], [232, 0]);
  const homeLineIn = interpolate(returnProgress, [0.35, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const textStart = Math.max(returnStart + 10, durationInFrames - 46);
  const textIn = interpolate(frame, [textStart, textStart + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.62} />
      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          height: 'auto',
          alignItems: 'center',
          boxSizing: 'border-box',
          translate: `0 ${cameraY}px`,
        }}
      >
        <div style={{position: 'relative', width: 680, height: 90}}>
          <div style={{position: 'absolute', left: '50%', top: '50%', translate: `calc(-50% + ${sphereX}px) -50%`}}>
            <EnergySphere size={26} intensity={0.85} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              translate: '-50% -50%',
              width: 4,
              height: 90 * homeLineIn,
              borderRadius: 4,
              background: `linear-gradient(180deg, rgba(34,240,208,0), ${colors.mint})`,
              opacity: homeLineIn,
            }}
          />
        </div>

        <div style={{marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center'}}>
          <MazeDoor label="Сервер" variant="closing" appearFrame={serverBeat} triggerFrame={serverBeat + 14} />
          <MazeDoor label="Ключ" variant="deadend" appearFrame={keyBeat} triggerFrame={keyBeat + 14} />
          <MazeDoor label="Настройки" variant="error" appearFrame={settingsBeat} triggerFrame={settingsBeat + 14} />
        </div>

        <div style={{marginTop: 50, textAlign: 'center', opacity: textIn, translate: `0 ${interpolate(textIn, [0, 1], [16, 0])}px`}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 52, lineHeight: 1.1, letterSpacing: -2, color: colors.white, textTransform: 'uppercase'}}>
            Снова
          </div>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 52, lineHeight: 1.1, letterSpacing: -2, color: colors.mint, textTransform: 'uppercase'}}>
            В начало
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
