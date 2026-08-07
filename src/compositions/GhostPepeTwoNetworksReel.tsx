import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from '../generated/captions-two-networks.json';
import timeline from '../generated/timeline-two-networks.json';
import {LAYERS} from '../reel-system/layers';
import {CriticalElement, LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {PhraseCaption} from '../components/kit/PhraseCaption';
import {PhoneStage} from '../components/two-networks/PhoneStage';

type CaptionPage = {
  text: string;
  startMs: number;
  durationMs: number;
};

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const EASE = {...CLAMP, easing: Easing.bezier(0.16, 1, 0.3, 1)};
const SLOW = {...CLAMP, easing: Easing.inOut(Easing.cubic)};
const mint = '#22F0D0';
const white = '#F6FAF9';
const muted = '#9FB1B1';

const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const byId = (id: string) => {
  const segment = timeline.segments.find((entry) => entry.id === id);
  if (!segment) {
    throw new Error(`Missing two-networks segment: ${id}`);
  }
  return segment;
};

const start = (id: string) => toFrame(byId(id).startMs);
const end = (id: string) => toFrame(byId(id).endMs);
const totalFrames = timeline.durationInFrames;

const fadeFor = (frame: number, from: number, to: number, settle = 12) =>
  interpolate(frame, [from, from + settle, Math.max(from + settle + 1, to - settle), to], [0, 1, 1, 0], CLAMP);

const holdFrom = (frame: number, from: number, settle = 14) => interpolate(frame, [from, from + settle], [0, 1], EASE);

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Img
        src={staticFile('assets/backgrounds/cyberspace-dark.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.82,
          scale: String(interpolate(frame, [0, totalFrames], [1.03, 1.055], SLOW)),
          translate: `${interpolate(frame, [0, totalFrames], [-16, 10], SLOW)}px ${interpolate(frame, [0, totalFrames], [-8, 6], SLOW)}px`,
          zIndex: LAYERS.BACKGROUND,
          filter: 'brightness(0.66) contrast(0.92) blur(1px)',
        }}
      />
      <AbsoluteFill
        style={{
          zIndex: LAYERS.ENVIRONMENT,
          background:
            'radial-gradient(ellipse at 50% 47%, rgba(34,240,208,0.16), rgba(8,18,20,0.34) 38%, rgba(1,4,5,0.76) 72%, rgba(0,0,0,0.88) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 108,
          top: 246,
          width: 820,
          height: 1110,
          borderRadius: 18,
          border: '1px solid rgba(184,255,243,0.12)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
          zIndex: LAYERS.ENVIRONMENT,
        }}
      />
    </>
  );
};

const Headline: React.FC<{
  hid: string;
  children: React.ReactNode;
  opacity: number;
  top: number;
  left?: number;
  width?: number;
  size?: number;
  align?: 'left' | 'center';
  kicker?: string;
}> = ({hid, children, opacity, top, left = 90, width = 810, size = 54, align = 'left', kicker}) => (
  <CriticalElement id={`headline-${hid}`} kind="headline" box={{x: left, y: top, width, height: 210}}>
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        opacity,
        translate: `0 ${interpolate(opacity, [0, 1], [10, 0], CLAMP)}px`,
        zIndex: LAYERS.TEXT,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        alignItems: align === 'center' ? 'center' : 'flex-start',
      }}
    >
      {kicker ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{width: 34, height: 3, borderRadius: 3, background: mint, boxShadow: '0 0 12px rgba(34,240,208,0.6)'}} />
          <span style={typo.kicker}>{kicker}</span>
        </div>
      ) : null}
      <div style={{...typo.display, fontSize: size, textAlign: align, textShadow: '0 14px 40px rgba(0,0,0,0.5)'}}>{children}</div>
    </div>
  </CriticalElement>
);

const EnvironmentalLabels: React.FC = () => {
  const frame = useCurrentFrame();
  const device = fadeFor(frame, start('s2_device'), end('s2_device') + 18);
  const vpn = fadeFor(frame, start('s2_vpn'), end('s2_vpn') + 24);
  const network = fadeFor(frame, start('s2_network'), end('s2_network') + 32);
  return (
    <div style={{position: 'absolute', left: 204, top: 1302, width: 676, height: 96, zIndex: LAYERS.TEXT}}>
      {[
        {left: 0, label: 'DEVICE', value: 'SAME', opacity: device},
        {left: 244, label: 'VPN', value: 'SAME', opacity: vpn},
        {left: 468, label: 'NETWORK', value: 'CHANGED', opacity: network, accent: true},
      ].map((item) => (
        <div key={item.label} style={{position: 'absolute', left: item.left, top: 0, width: 190, opacity: item.opacity}}>
          <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 2, color: muted}}>{item.label}</div>
          <div style={{marginTop: 8, fontFamily: unbounded, fontWeight: 800, fontSize: 28, color: item.accent ? mint : white}}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

// Sequential headlines shown one at a time. Each fades out fully before the next
// fades in (no two texts crossfading in the same spot), driven by segment starts.
const SEQ_BEATS: {id: string; hid: string; kicker?: string; size: number; node: React.ReactNode}[] = [
  {id: 's1_wifi', hid: 's1-wifi', kicker: 'Одна сеть', size: 62, node: <>На Wi-Fi<br /><Accent>работает</Accent></>},
  {id: 's1_mobile', hid: 's1-mobile', size: 58, node: <>На мобильной<br /><Accent color={muted}>уже иначе</Accent></>},
  {id: 's1_same_vpn', hid: 's1-vpn', size: 64, node: <>А VPN —<br />тот же</>},
  {id: 's2_device', hid: 's2-device', kicker: 'Что не менялось', size: 60, node: <>Устройство<br />то же</>},
  {id: 's2_vpn', hid: 's2-vpn', size: 64, node: <>И VPN —<br />тоже</>},
  {id: 's2_network', hid: 's2-network', size: 70, node: <>Меняется<br /><Accent>сеть</Accent></>},
  {id: 's3_vpn', hid: 's3-vpn', kicker: 'Почему так', size: 56, node: <>VPN — лишь<br />часть <Accent>маршрута</Accent></>},
  {id: 's3_traffic', hid: 's3-traffic', size: 58, node: <>Сеть тоже меняет<br /><Accent>результат</Accent></>},
];

const MainMessages: React.FC = () => {
  const frame = useCurrentFrame();
  const endStart = start('end_check_vpn');
  return (
    <>
      {SEQ_BEATS.map((beat, i) => {
        const s = start(beat.id);
        const next = i < SEQ_BEATS.length - 1 ? start(SEQ_BEATS[i + 1].id) : endStart;
        // fade in [s, s+7]; hold; fade out [next-11, next-4] — gone before the next appears.
        const opacity = interpolate(frame, [s, s + 7, Math.max(s + 8, next - 11), Math.max(s + 9, next - 4)], [0, 1, 1, 0], CLAMP);
        return (
          <Headline key={beat.hid} hid={beat.hid} kicker={beat.kicker} opacity={opacity} top={252} size={beat.size}>
            {beat.node}
          </Headline>
        );
      })}

      <Headline hid="end-check" opacity={holdFrom(frame, endStart - 8)} top={266} left={90} width={900} size={52} align="center">Проверяй не только VPN</Headline>
      <Headline hid="end-network" kicker="Вывод" opacity={holdFrom(frame, start('end_network') - 8)} top={392} left={90} width={900} size={64} align="center">А ещё —<br /><Accent>в какой ты сети</Accent></Headline>
    </>
  );
};

const PhraseCaptions: React.FC = () => {
  const {fps: videoFps} = useVideoConfig();
  const pages = captions as CaptionPage[];
  const hiddenWhenHeadlineCarriesThought = new Set([
    's1_wifi',
    's1_mobile',
    's1_same_vpn',
    's2_device',
    's2_vpn',
    's2_network',
    's3_vpn',
    's3_route',
    's3_conditions',
    'end_check_vpn',
    'end_look',
    'end_network',
  ]);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.CAPTIONS}}>
      {pages.map((page, index) => {
        const segment = timeline.segments[index];
        if (hiddenWhenHeadlineCarriesThought.has(segment.id)) {
          return null;
        }
        const from = Math.round((page.startMs / 1000) * videoFps);
        const durationInFrames = Math.max(1, Math.round((page.durationMs / 1000) * videoFps));
        return (
          <Sequence key={`${page.startMs}-${index}`} from={from} durationInFrames={durationInFrames} layout="none">
            <PhraseCaption text={page.text} durationInFrames={durationInFrames} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const GhostPepeTwoNetworksSilhouette: React.FC = () => (
  <AbsoluteFill style={{background: '#fff'}}>
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <rect x="144" y="360" width="300" height="790" rx="80" fill="#000" />
      <rect x="554" y="360" width="300" height="790" rx="80" fill="#000" />
      <rect x="116" y="1124" width="782" height="154" rx="22" fill="#000" />
      <rect x="286" y="596" width="64" height="64" rx="18" fill="#000" />
      <rect x="696" y="596" width="64" height="64" rx="18" fill="#000" />
    </svg>
  </AbsoluteFill>
);

export const GhostPepeTwoNetworksReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: '#020607', overflow: 'hidden'}}>
      <Background />
      <PhoneStage />
      <EnvironmentalLabels />
      <MainMessages />
      <PhraseCaptions />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.045} />
      <Audio src={staticFile('generated/voiceover-two-networks.wav')} volume={1} />
      <Sequence from={start('s1_result')} layout="none">
        <Audio src={staticFile('generated/click.wav')} volume={0.08} />
      </Sequence>
      <Sequence from={start('s2_network')} layout="none">
        <Audio src={staticFile('generated/connect.wav')} volume={0.05} />
      </Sequence>
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);
