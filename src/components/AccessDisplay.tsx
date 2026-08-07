import {colors} from '../theme/colors';
import {manrope} from '../theme/fonts';

const SCRAMBLE = '01/#|10\\01';

export type AccessTone = 'neutral' | 'approve' | 'deny';

const TONE_COLOR: Record<AccessTone, string> = {
  neutral: colors.lightMint,
  approve: colors.mint,
  deny: colors.errorRed,
};

const TONE_BG: Record<AccessTone, string> = {
  neutral: 'rgba(8,12,13,.7)',
  approve: 'rgba(12,32,28,.78)',
  deny: 'rgba(30,12,11,.78)',
};

/** The access board above the turnstile. New labels never pop in as a boolean switch:
 * characters resolve one by one out of a deterministic binary scramble as `decode`
 * grows, which doubles as the "постепенная расшифровка" beat of the checkpoint. */
export const AccessDisplay: React.FC<{
  label: string;
  tone: AccessTone;
  decode: number;
  frame: number;
  width?: number;
}> = ({label, tone, decode, frame, width = 380}) => {
  const chars = label.split('');
  const settled = Math.floor(decode * chars.length + 0.0001);

  return (
    <div
      style={{
        width,
        height: 84,
        borderRadius: 20,
        background: TONE_BG[tone],
        border: `1.5px solid ${TONE_COLOR[tone]}55`,
        boxShadow: `0 0 26px ${TONE_COLOR[tone]}2E, inset 0 1px 0 rgba(246,250,249,.14)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {chars.map((char, i) => {
        const isSettled = i < settled;
        const scrambleChar = SCRAMBLE[(i * 7 + Math.floor(frame / 3)) % SCRAMBLE.length];
        return (
          <span
            key={i}
            style={{
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 4,
              color: TONE_COLOR[tone],
              opacity: isSettled ? 1 : 0.4,
              textShadow: isSettled ? `0 0 14px ${TONE_COLOR[tone]}66` : 'none',
              whiteSpace: 'pre',
            }}
          >
            {isSettled ? char : char === ' ' ? ' ' : scrambleChar}
          </span>
        );
      })}
    </div>
  );
};
