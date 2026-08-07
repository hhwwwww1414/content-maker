import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';

const TILES = 16;

const Node: React.FC<{label: string; active: boolean}> = ({label, active}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: active ? colors.mint : 'rgba(155,168,165,.35)',
        boxShadow: active ? '0 0 14px rgba(34,240,208,.6)' : 'none',
      }}
    />
    <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 16, color: active ? colors.white : colors.gray, letterSpacing: 0.5}}>{label}</div>
  </div>
);

/** Stylised device -> VPN -> internet tunnel. `litFraction` (0-1) is how much of the
 * tunnel is lit mint from the left; `packetFraction` (0-1, or null to hide) positions a
 * travelling data packet along the same track. */
export const ConnectionTunnel: React.FC<{litFraction: number; packetFraction?: number | null}> = ({litFraction, packetFraction = null}) => {
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
        <Node label="УСТРОЙСТВО" active />
        <Node label="VPN" active />
        <Node label="ИНТЕРНЕТ" active={litFraction >= 0.98} />
      </div>
      <div style={{position: 'relative', width: '100%', marginTop: 20, height: 20, display: 'flex', alignItems: 'center', gap: 6}}>
        {Array.from({length: TILES}).map((_, i) => {
          const lit = litFraction > i / TILES;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 16,
                borderRadius: 6,
                background: lit ? 'rgba(34,240,208,.85)' : 'rgba(155,168,165,.16)',
                boxShadow: lit ? '0 0 12px rgba(34,240,208,.4)' : 'none',
              }}
            />
          );
        })}
        {packetFraction !== null && (
          <div
            style={{
              position: 'absolute',
              left: `${packetFraction * 100}%`,
              top: '50%',
              translate: '-50% -50%',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: colors.mint,
              boxShadow: '0 0 20px rgba(34,240,208,.75)',
            }}
          />
        )}
      </div>
    </div>
  );
};
