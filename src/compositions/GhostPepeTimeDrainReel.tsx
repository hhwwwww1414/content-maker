import {Audio} from '@remotion/media';
import type {TikTokPage} from '@remotion/captions';
import type {ReactNode} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from '../generated/captions-time-drain.json';
import {CaptionPage} from '../components/CaptionPage';
import {ChronometerHand} from '../components/ChronometerHand';
import {DigitalHourglass} from '../components/DigitalHourglass';
import {FinalTimeLine} from '../components/FinalTimeLine';
import {FrozenTimeField} from '../components/FrozenTimeField';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {timeDrainFrames as beats} from './timeDrainSceneFrames';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const HeroText: React.FC<{
  top: number;
  opacity: number;
  size?: number;
  color?: string;
  align?: 'left' | 'center';
  children: ReactNode;
}> = ({top, opacity, size = 50, color = colors.white, align = 'center', children}) => (
  <div
    style={{
      position: 'absolute',
      left: 110,
      top,
      width: 710,
      zIndex: 30,
      textAlign: align,
      fontFamily: unbounded,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.13,
      letterSpacing: -1.5,
      textTransform: 'uppercase',
      color,
      opacity,
      translate: `0 ${interpolate(opacity, [0, 1], [9, 0], OUT)}px`,
      textShadow: color === colors.mint ? '0 0 32px rgba(34,240,208,.38)' : '0 5px 30px rgba(0,0,0,.78)',
    }}
  >
    {children}
  </div>
);

const Engraving: React.FC<{label: string; debit: string; top: number; opacity: number}> = ({label, debit, top, opacity}) => (
  <div style={{position: 'absolute', left: 286, top, width: 350, zIndex: 18, opacity, translate: `${interpolate(opacity, [0, 1], [12, 0], OUT)}px 0`, fontFamily: unbounded, textTransform: 'uppercase'}}>
    <div style={{fontWeight: 700, fontSize: 27, color: colors.white, letterSpacing: 1.2, textShadow: '0 0 18px rgba(246,250,249,.22)'}}>{label}</div>
    <div style={{marginTop: 8, fontWeight: 800, fontSize: 34, color: colors.mint, textShadow: '0 0 24px rgba(34,240,208,.48)'}}>{debit}</div>
  </div>
);

export const GhostPepeTimeDrainReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drainProgress = interpolate(frame, [4, beats.cost + 18], [0, 1], EASE);
  const freezeProgress = interpolate(frame, [beats.freeze - 10, beats.freeze + 38], [0, 1], EASE);
  const returnProgress = interpolate(frame, [beats.freeze + 28, beats.cta + 22], [0, 1], EASE);
  const morphProgress = interpolate(frame, [beats.cta - 8, beats.cta + 40], [0, 1], EASE);
  const finalProgress = interpolate(frame, [beats.cta + 6, beats.cta + 34], [0, 1], OUT);
  const cameraY = interpolate(frame, [0, beats.drain, beats.cost, beats.freeze, beats.cta], [-15, -72, -218, -92, -24], EASE);
  const cameraScale = interpolate(frame, [0, beats.cost, beats.freeze, beats.cta], [0.92, 1.04, 0.96, 0.9], EASE);
  const hookOpacity = interpolate(frame, [1, 7, beats.drain - 18, beats.drain + 4], [0, 1, 1, 0], EASE);
  const costTitle = interpolate(frame, [beats.cost - 5, beats.cost + 16, beats.costB - 8, beats.costB + 4], [0, 1, 1, 0], EASE);
  const costThesis = interpolate(frame, [beats.costB, beats.costB + 20, beats.freeze - 10, beats.freeze + 5], [0, 1, 1, 0], EASE);
  const freezeText = interpolate(frame, [beats.freeze + 5, beats.freeze + 25, beats.cta - 18, beats.cta], [0, 1, 1, 0], EASE);
  const mascotReveal = interpolate(frame, [beats.freeze + 15, beats.freeze + 47], [0, 1], OUT);
  const worldOpacity = interpolate(morphProgress, [0.55, 1], [1, 0.2], EASE);
  const pages = captions as TikTokPage[];

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep, overflow: 'hidden'}}>
      <Img src={staticFile('assets/backgrounds/cyberspace-dark.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: interpolate(frame, [0, beats.freeze, beats.cta], [0.64, 0.48, 0.72], EASE), scale: interpolate(frame, [0, beats.cta], [1.08, 1.02], EASE)}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 43% 48%, rgba(20,75,67,.21), rgba(3,7,8,.68) 56%, rgba(2,4,5,.94) 100%)'}} />

      <AbsoluteFill style={{opacity: worldOpacity, translate: `0 ${cameraY}px`, scale: cameraScale, transformOrigin: '465px 900px'}}>
        <div style={{position: 'absolute', left: 205, top: 430}}>
          <ChronometerHand turnProgress={interpolate(frame, [beats.cost - 8, beats.freeze + 12], [0, 1], EASE)} freezeProgress={freezeProgress} opacity={interpolate(frame, [beats.drain, beats.cost + 12, beats.freeze + 28], [0.04, 0.34, 0.2], EASE)} />
          <DigitalHourglass frame={frame} drainProgress={drainProgress} freezeProgress={freezeProgress} returnProgress={returnProgress} morphProgress={morphProgress} />
        </div>
      </AbsoluteFill>

      <FrozenTimeField progress={freezeProgress * (1 - morphProgress)} />

      <HeroText top={286} opacity={hookOpacity} size={51}>
        Твой интернет<br /><span style={{color: colors.mint}}>списывает время</span>
      </HeroText>

      <Engraving label="ПОДОЖДАЛ" debit="−4 СЕК" top={680} opacity={interpolate(frame, [beats.drain, beats.drain + 6, beats.drainB - 4, beats.drainB + 4], [0, 1, 1, 0], EASE)} />
      <Engraving label="ПОВТОРИЛ" debit="−7 СЕК" top={680} opacity={interpolate(frame, [beats.drainB, beats.drainB + 12, beats.drainC - 5, beats.drainC + 8], [0, 1, 1, 0], EASE)} />
      <Engraving label="СНОВА ПОДОЖДАЛ" debit="−5 СЕК" top={680} opacity={interpolate(frame, [beats.drainC, beats.drainC + 18, beats.cost - 8, beats.cost + 8], [0, 1, 1, 0], EASE)} />

      <HeroText top={294} opacity={costTitle} size={46} color={colors.mint}>Самая дорогая подписка</HeroText>
      <HeroText top={300} opacity={costThesis} size={44}>Та что оплачена<br /><span style={{color: colors.mint}}>твоим временем</span></HeroText>

      <div style={{position: 'absolute', left: 242, top: 566, width: 330, height: 360, zIndex: 24, opacity: mascotReveal * (1 - morphProgress)}}>
        <div style={{position: 'absolute', inset: 20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,240,208,.26), transparent 67%)', filter: `blur(${interpolate(mascotReveal, [0, 1], [30, 7], EASE)}px)`, opacity: mascotReveal}} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{position: 'absolute', inset: 0, width: 330, height: 360, objectFit: 'contain', opacity: mascotReveal, translate: `0 ${interpolate(mascotReveal, [0, 1], [18, 0], OUT)}px`, filter: `blur(${interpolate(mascotReveal, [0, 1], [12, 0], EASE)}px) drop-shadow(0 0 28px rgba(34,240,208,.3))`}} />
      </div>
      <HeroText top={304} opacity={freezeText} size={47}>Время<br /><span style={{color: colors.mint}}>не должно утекать</span></HeroText>

      <AbsoluteFill style={{opacity: finalProgress, zIndex: 26}}>
        <FinalTimeLine progress={finalProgress} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{position: 'absolute', left: 282, top: 462, width: 270, height: 300, objectFit: 'contain', filter: 'drop-shadow(0 0 28px rgba(34,240,208,.3))'}} />
        <div style={{position: 'absolute', left: 110, top: 862, width: 710, textAlign: 'center', fontFamily: unbounded, fontWeight: 800, fontSize: 48, lineHeight: 1.15, color: colors.white}}>ОСТАВЬ ВРЕМЯ<br /><span style={{color: colors.mint}}>СЕБЕ</span></div>
        <div style={{position: 'absolute', left: 174, top: 1002, width: 582, padding: '22px 8px', borderTop: '1px solid rgba(140,255,233,.34)', borderBottom: '1px solid rgba(140,255,233,.34)', textAlign: 'center', fontFamily: unbounded, fontWeight: 700, fontSize: 27, letterSpacing: 0.6, color: colors.lightMint}}>ОТКРЫТЬ В TELEGRAM</div>
      </AbsoluteFill>

      <AbsoluteFill style={{zIndex: 40}}>
        {pages.map((page, index) => {
          const startFrame = Math.round((page.startMs / 1000) * fps) + 1;
          const durationInFrames = Math.max(1, Math.round((page.durationMs / 1000) * fps) - 1);
          return (
            <Sequence key={`${page.startMs}-${index}`} from={startFrame} durationInFrames={durationInFrames} premountFor={fps}>
              <CaptionPage page={page} layout={deadlineLayout} riseIn steadyWords />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Audio src={staticFile('generated/ambient.wav')} loop volume={(audioFrame) => Math.min(0.045, (audioFrame / (fps * 2)) * 0.045)} />
      <Audio src={staticFile('generated/voiceover-time-drain.wav')} volume={1} />
      <Sequence from={beats.drain - 2} premountFor={fps}><Audio src={staticFile('generated/fall.wav')} volume={0.1} /></Sequence>
      <Sequence from={beats.freeze - 4} premountFor={fps}><Audio src={staticFile('generated/whoosh.wav')} volume={0.1} /></Sequence>
      <Sequence from={beats.cta - 5} premountFor={fps}><Audio src={staticFile('generated/connect.wav')} volume={0.07} /></Sequence>
    </AbsoluteFill>
  );
};
