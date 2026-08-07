import {AbsoluteFill} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {VpnErrorCard, type VpnErrorCardProps} from '../components/VpnErrorCard';
import {graveyardLayout} from '../theme/layout';

const CARDS: Array<Pick<VpnErrorCardProps, 'label' | 'error' | 'rotation' | 'x' | 'y'>> = [
  {label: 'VPN 01', error: 'CONNECTION LOST', rotation: -8, x: -190, y: -320},
  {label: 'VPN 02', error: 'TIMEOUT', rotation: 6, x: 170, y: -160},
  {label: 'FAST VPN', error: 'SERVER ERROR', rotation: -6, x: -230, y: 0},
  {label: 'FREE VPN', error: 'NO RESPONSE', rotation: 9, x: 130, y: 160},
  {label: 'VPN PLUS', error: 'DISCONNECTED', rotation: -7, x: -60, y: 320},
];

const START_STAGGER = 15;
const FIRST_START = 4;
const FALL_DELAY = 28;

export const VpnFailureScene: React.FC = () => {
  return (
    <AbsoluteFill>
      <CyberBackground mode="error" glitch intensity={1.15} />
      <AbsoluteFill
        style={{
          left: graveyardLayout.safeLeft,
          right: 1080 - graveyardLayout.safeRight,
          width: 'auto',
          top: graveyardLayout.safeTop,
          bottom: 1920 - graveyardLayout.safeBottom,
          height: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {CARDS.map((card, i) => {
          const startFrame = FIRST_START + i * START_STAGGER;
          return <VpnErrorCard key={card.label} {...card} startFrame={startFrame} fallFrame={startFrame + FALL_DELAY} />;
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
