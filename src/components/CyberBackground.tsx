import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {BinaryRain} from './BinaryRain';

export type CyberBackgroundMode = 'error' | 'graveyard' | 'mint';

const WASH: Record<CyberBackgroundMode, string> = {
  error: 'rgba(142,32,28,0.40)',
  graveyard: 'rgba(90,22,20,0.34)',
  mint: 'rgba(34,240,208,0.16)',
};

export const CyberBackground: React.FC<{mode: CyberBackgroundMode; intensity?: number; glitch?: boolean; drift?: number}> = ({
  mode,
  intensity = 1,
  glitch = false,
  drift = mode === 'mint' ? 0.35 : 1,
}) => {
  const frame = useCurrentFrame();
  // No background zoom: a static frame reads calmer than even a slow drift.
  const scale = 1.03;
  // Glitch is only ever a short, contained burst right at a scene's start (VPN-error
  // beats), never a repeating tremor across the whole scene.
  const glitchPulse = glitch && frame < 10 && frame % 40 < 2 ? (frame % 2 === 0 ? 2 : -2) : 0;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img
        src={staticFile('assets/backgrounds/cyberspace-dark.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale,
          translate: `${Math.sin(frame / 90) * 3 * drift + glitchPulse}px ${Math.cos(frame / 105) * 4 * drift}px`,
        }}
      />
      <AbsoluteFill style={{background: WASH[mode]}} />
      <BinaryRain mode={mode} intensity={intensity} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(2,3,4,.74) 0%,rgba(2,3,4,.10) 22%,rgba(2,3,4,.14) 68%,rgba(2,3,4,.60) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(2,3,4,.42) 0%,transparent 22%,transparent 76%,rgba(2,3,4,.58) 100%)'}} />
    </AbsoluteFill>
  );
};
