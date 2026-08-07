import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {VpnTombstone} from '../components/VpnTombstone';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {graveyardLayout} from '../theme/layout';

const TOMBSTONES = [
  {x: -260, scale: 0.7, depth: 0.82, errorText: 'CONNECTION LOST'},
  {x: -150, scale: 0.85, depth: 0.48, errorText: 'TIMEOUT'},
  {x: -48, scale: 1, depth: 0.12, errorText: 'SERVER ERROR'},
  {x: 55, scale: 0.94, depth: 0.2, errorText: 'NO RESPONSE'},
  {x: 155, scale: 0.8, depth: 0.5, errorText: 'DISCONNECTED'},
  {x: 255, scale: 0.66, depth: 0.85, errorText: 'CONNECTION LOST'},
];

export const DigitalGraveyardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleEnter = interpolate(frame, [2, 20], [0, 1], {extrapolateRight: 'clamp'});
  const subtitleEnter = interpolate(frame, [22, 37], [0, 1], {extrapolateRight: 'clamp'});
  // A gentle single glow-up instead of a fast flicker.
  const flash = frame < 26 ? interpolate(Math.sin(frame / 12), [-1, 1], [0.88, 1]) : 1;

  return (
    <AbsoluteFill>
      <CyberBackground mode="graveyard" intensity={1} />
      <AbsoluteFill style={{left: graveyardLayout.safeLeft, right: 1080 - graveyardLayout.safeRight, width: 'auto', top: graveyardLayout.safeTop, height: 'auto', alignItems: 'center', boxSizing: 'border-box'}}>
        <div style={{textAlign: 'center', opacity: titleEnter, translate: `0 ${interpolate(titleEnter, [0, 1], [-30, 0])}px`}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 62, letterSpacing: -2, color: colors.white, textTransform: 'uppercase'}}>
            Кладбище <span style={{color: colors.errorRed}}>VPN</span>
          </div>
        </div>
        <div style={{marginTop: 26, textAlign: 'center', opacity: subtitleEnter}}>
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, color: colors.white, textTransform: 'uppercase'}}>
            и он тоже <span style={{color: colors.errorRed, opacity: flash}}>умер</span>
          </div>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: graveyardLayout.safeLeft, width: graveyardLayout.safeRight - graveyardLayout.safeLeft, bottom: 620, height: 280}}>
        {TOMBSTONES.map((t, i) => (
          <VpnTombstone key={i} x={t.x} scale={t.scale} depth={t.depth} errorText={t.errorText} appearFrame={i * 6} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
