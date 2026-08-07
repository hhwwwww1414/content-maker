import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {ConnectionLine} from '../components/ConnectionLine';
import {TelegramBotCard} from '../components/TelegramBotCard';
import {SubscriptionCard} from '../components/SubscriptionCard';
import {VpnClientCard} from '../components/VpnClientCard';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';
import {graveyardLayout} from '../theme/layout';

const STEPS = ['TELEGRAM', 'ПОДПИСКА', 'VPN-КЛИЕНТ', 'ПОДКЛЮЧЕНО'];
const TELEGRAM_PRESS = 36;
const SUB_ENTER = 63;
const SUB_EXIT = 121;
const SUB_COPY = 94;
const CLIENT_ENTER = 121;
const CONNECT_FRAME = 164;

export const ConnectionFlowScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = frame < SUB_ENTER ? 0 : frame < CLIENT_ENTER ? 1 : frame < CONNECT_FRAME ? 2 : 3;

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.7} />
      <AbsoluteFill style={{left: graveyardLayout.safeLeft, right: 1080 - graveyardLayout.safeRight, width: 'auto', top: graveyardLayout.safeTop, height: 'auto', alignItems: 'center', boxSizing: 'border-box'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 52, letterSpacing: -2, color: colors.white, textTransform: 'uppercase'}}>
            Проще, <span style={{color: colors.mint}}>чем кажется</span>
          </div>
        </div>
        <div style={{display: 'flex', marginTop: 30, gap: 10, flexWrap: 'wrap', justifyContent: 'center'}}>
          {STEPS.map((step, index) => (
            <div
              key={step}
              style={{
                fontFamily: manrope,
                fontWeight: 800,
                fontSize: 19,
                color: index <= phase ? colors.background : colors.gray,
                background: index <= phase ? colors.mint : 'rgba(155,168,165,.10)',
                border: index <= phase ? '1px solid rgba(140,255,233,.7)' : '1px solid rgba(140,255,233,.12)',
                borderRadius: 16,
                padding: '11px 16px',
                whiteSpace: 'nowrap',
              }}
            >
              {step}
            </div>
          ))}
        </div>
        <div style={{marginTop: 10, opacity: interpolate(frame, [0, 201], [0.6, 1])}}>
          <ConnectionLine progress={Math.min(1, frame / CONNECT_FRAME)} stable={frame >= CONNECT_FRAME} />
        </div>
        <div style={{marginTop: 6, position: 'relative', width: 680, height: 300}}>
          <Sequence from={0} durationInFrames={SUB_ENTER} layout="none">
            <div style={{position: 'absolute', inset: 0}}>
              <TelegramBotCard pressFrame={TELEGRAM_PRESS} />
            </div>
          </Sequence>
          <Sequence from={SUB_ENTER} durationInFrames={SUB_EXIT - SUB_ENTER} layout="none">
            <div style={{position: 'absolute', inset: 0}}>
              <SubscriptionCard copyFrame={SUB_COPY - SUB_ENTER} />
            </div>
          </Sequence>
          <Sequence from={CLIENT_ENTER} layout="none">
            <div style={{position: 'absolute', inset: 0}}>
              <VpnClientCard connectFrame={CONNECT_FRAME - CLIENT_ENTER} />
            </div>
          </Sequence>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
