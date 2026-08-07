import {AbsoluteFill} from 'remotion';
import {BenefitCard} from '../components/BenefitCard';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {graveyardLayout} from '../theme/layout';

const MapNodesIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52">
    <path d="M8 34L18 16L34 22L46 10" fill="none" stroke={colors.mint} strokeWidth="3" opacity=".55" />
    {[[8, 34], [18, 16], [34, 22], [46, 10]].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r={i === 0 ? 6 : 5} fill={colors.mint} opacity={i === 0 ? 1 : 0.75} />
    ))}
  </svg>
);

const TunnelIcon = () => (
  <svg width="52" height="52" viewBox="0 0 52 52">
    {[22, 16, 10].map((r, i) => (
      <circle key={i} cx="26" cy="26" r={r} fill="none" stroke={colors.mint} strokeWidth="3" opacity={0.3 + i * 0.25} />
    ))}
    <circle cx="26" cy="26" r="4" fill={colors.lightMint} />
  </svg>
);

const DevicesIcon = () => (
  <svg width="56" height="52" viewBox="0 0 56 52">
    <rect x="2" y="6" width="20" height="34" rx="4" fill="none" stroke={colors.mint} strokeWidth="3" />
    <rect x="26" y="14" width="28" height="20" rx="3" fill="none" stroke={colors.lightMint} strokeWidth="3" />
    <rect x="30" y="36" width="20" height="4" rx="2" fill={colors.lightMint} opacity=".7" />
  </svg>
);

const BENEFITS = [
  {icon: <MapNodesIcon />, text: 'НЕСКОЛЬКО ЛОКАЦИЙ'},
  {icon: <TunnelIcon />, text: 'СОВРЕМЕННЫЕ ПРОТОКОЛЫ'},
  {icon: <DevicesIcon />, text: 'РАЗНЫЕ УСТРОЙСТВА'},
];

// itemStarts: real audio-derived frame offset (relative to scene start) for each of the
// three benefit lines, so a card appears exactly when its own phrase begins.
export const GraveyardBenefitsScene: React.FC<{itemStarts: number[]}> = ({itemStarts}) => (
  <AbsoluteFill>
    <CyberBackground mode="mint" intensity={0.55} />
    <AbsoluteFill style={{left: graveyardLayout.safeLeft, right: 1080 - graveyardLayout.safeRight, width: 'auto', justifyContent: 'center', boxSizing: 'border-box'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
        {BENEFITS.map((b, i) => (
          <BenefitCard key={b.text} icon={b.icon} text={b.text} appearFrame={itemStarts[i] ?? i * 40} />
        ))}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
