import React from 'react';
import {night} from '../../components/vibe/theme';
import {unbounded} from '../../theme/fonts';
import {Glass, NightChip, StrikeText} from '../../components/vpn/glass';
import {
  Arrow,
  BODY,
  CardLabel,
  ChipRow,
  Headline,
  RowGlyph,
  TONE_COLOR,
  Verdict,
  rise,
  useCue,
} from './atoms';
import type {
  CompareSpec,
  CountersSpec,
  DocumentSpec,
  FlowSpec,
  GrammarSpec,
  SplitSpec,
  StatementSpec,
  StepsSpec,
  TilesSpec,
} from './types';

/**
 * The eight scene grammars. Each renders entirely from its spec — no reel-specific
 * code, no timing maths, no randomness. Adding a ninth grammar is the only way to
 * add a new visual idea, and that is deliberate: it keeps the channel coherent
 * and keeps every reel inside the safe zones by construction.
 */

/* ------------------------------------------------------------------ statement */

const Statement: React.FC<{spec: StatementSpec}> = ({spec}) => {
  // The claim is authored with its own strike cue; when absent it simply stands.
  const strikeProgress = useCue({atMs: spec.strikeAtMs}, 480);

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
      <Glass strong style={{padding: '20px 24px'}}>
        <CardLabel>{spec.card}</CardLabel>
        {spec.claim ? (
          <div style={{marginTop: 14, minHeight: 44}}>
            {strikeProgress > 0 ? (
              <StrikeText label={spec.claim} progress={strikeProgress} fontSize={28} color={night.textSoft} />
            ) : (
              <Headline size={30} color={TONE_COLOR[spec.claimTone ?? 'neutral']}>
                {spec.claim}
              </Headline>
            )}
          </div>
        ) : null}
        <ChipRow items={spec.items} />
      </Glass>
      <div style={{marginTop: 20}}>
        <Verdict item={spec.verdict} size={40} />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------- compare */

const CompareRow: React.FC<{item: CompareSpec['rows'][number]}> = ({item}) => {
  const on = useCue(item, 420);
  const color = TONE_COLOR[item.tone ?? 'neutral'];
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, ...rise(on, 12)}}>
      <RowGlyph kind={item.glyph ?? 'window'} color={color} />
      <div>
        <Headline size={27} color={color}>
          {item.label}
        </Headline>
        {item.note ? (
          <div style={{marginTop: 6, fontFamily: unbounded, fontWeight: 700, fontSize: 19, color: night.textSoft}}>
            {item.note}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Compare: React.FC<{spec: CompareSpec}> = ({spec}) => (
  <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
    <CardLabel>{spec.card}</CardLabel>
    <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18}}>
      {(spec.rows ?? []).map((row) => (
        <CompareRow key={row.label} item={row} />
      ))}
    </div>
    <ChipRow items={spec.chips} size={22} />
  </div>
);

/* ---------------------------------------------------------------------- tiles */

const Tile: React.FC<{item: TilesSpec['tiles'][number]; badge?: string}> = ({item, badge}) => {
  const on = useCue(item, 380);
  const color = TONE_COLOR[item.tone ?? 'mint'];
  return (
    <div
      style={{
        flex: 1,
        padding: '16px 14px',
        borderRadius: 16,
        border: `2.5px solid ${color}`,
        background: 'rgba(255,255,255,0.06)',
        textAlign: 'center',
        opacity: on,
        transform: `translateY(${(1 - on) * 12}px) scale(${0.94 + 0.06 * on})`,
      }}
    >
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 26, color: night.text, textShadow: night.shadow}}>
        {item.label}
      </div>
      {badge ? (
        <div style={{marginTop: 8, fontFamily: unbounded, fontWeight: 700, fontSize: 17, color}}>{badge}</div>
      ) : null}
    </div>
  );
};

const Tiles: React.FC<{spec: TilesSpec}> = ({spec}) => {
  const lead = useCue(spec.lead, 420);
  const strike = useCue(spec.strike, 640);
  // Reveal first, cancel second — a word must be readable before it is struck.
  const strikeShow = Math.min(1, strike * 3);
  const strikeBar = Math.max(0, (strike - 0.34) / 0.66);

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
      <Glass strong style={{padding: '20px 24px'}} accent={night.mint}>
        <CardLabel>{spec.card}</CardLabel>
        {spec.lead ? (
          <div style={{marginTop: 12, minHeight: 38, ...rise(lead, 8)}}>
            <NightChip label={spec.lead.label} tone="warning" size={20} />
          </div>
        ) : null}
        <div style={{display: 'flex', gap: 14, marginTop: 14, minHeight: 96}}>
          {(spec.tiles ?? []).map((tile) => (
            <Tile key={tile.label} item={tile} badge={spec.badge} />
          ))}
        </div>
      </Glass>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 20, minHeight: 76}}>
        {spec.strike ? (
          <div style={{opacity: strikeShow}}>
            <StrikeText label={spec.strike.label} progress={strikeBar} fontSize={30} color={night.textSoft} />
          </div>
        ) : null}
        <Verdict item={spec.verdict} size={44} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- document */

const Document: React.FC<{spec: DocumentSpec}> = ({spec}) => {
  const hidden = useCue(spec.hidden ?? null, 520);
  const reveal = useCue({atMs: spec.revealAtMs}, 460);
  const aside = useCue(spec.aside, 460);
  // Starts at the contrast a human eye skips, ends fully legible.
  const legibility = 0.06 + 0.94 * reveal;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
      <Glass strong style={{padding: '18px 22px'}}>
        <CardLabel>{spec.card}</CardLabel>
        {spec.visible ? (
          <div style={{marginTop: 12}}>
            <Headline size={25} color={night.textSoft}>
              {spec.visible}
            </Headline>
          </div>
        ) : null}

        <div style={{display: 'flex', gap: 14, marginTop: 14, alignItems: 'stretch', minHeight: 104}}>
          <div
            style={{
              flex: 1,
              padding: '13px 16px',
              borderRadius: 14,
              border: `2.5px dashed ${night.red}`,
              background: 'rgba(255,107,90,0.10)',
              opacity: hidden,
              transform: `translateY(${(1 - hidden) * 10}px)`,
            }}
          >
            <div
              style={{
                fontFamily: unbounded,
                fontWeight: 700,
                fontSize: 23,
                lineHeight: 1.2,
                color: night.red,
                opacity: legibility,
                textShadow: night.shadow,
              }}
            >
              {spec.hidden?.label ?? ''}
            </div>
            {spec.hidden?.note ? (
              <div style={{marginTop: 10, opacity: reveal}}>
                <NightChip label={spec.hidden.note ?? ''} tone="danger" size={17} />
              </div>
            ) : null}
          </div>

          {spec.aside ? (
            <div
              style={{
                width: 208,
                flexShrink: 0,
                padding: '11px 12px',
                borderRadius: 14,
                border: `2.5px solid ${night.line}`,
                background: 'rgba(255,255,255,0.05)',
                opacity: aside,
                transform: `translateY(${(1 - aside) * 10}px)`,
              }}
            >
              <svg width={184} height={52} viewBox="0 0 184 52">
                <rect x={1} y={1} width={182} height={50} rx={7} fill="rgba(255,255,255,0.05)" stroke={night.line} strokeWidth={2} />
                <circle cx={26} cy={18} r={7} fill="none" stroke={night.textFaint} strokeWidth={2} />
                <path d="M8 42 L52 21 L84 42" fill="none" stroke={night.textFaint} strokeWidth={2.5} strokeLinejoin="round" />
                <text x={93} y={32} fill={night.red} fillOpacity={0.16 + 0.84 * aside} fontFamily={unbounded} fontWeight={700} fontSize={13}>
                  {spec.aside.note ?? ''}
                </text>
              </svg>
              <div style={{marginTop: 6, fontFamily: unbounded, fontWeight: 700, fontSize: 15, color: night.textSoft}}>
                {spec.aside.label}
              </div>
            </div>
          ) : null}
        </div>
      </Glass>
      <div style={{marginTop: 16}}>
        <Verdict item={spec.verdict} size={32} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- counters */

const Counter: React.FC<{item: CountersSpec['counters'][number]}> = ({item}) => {
  const on = useCue(item, 420);
  // "5 АГЕНТНЫХ БРАУЗЕРОВ" -> big "5" + the rest as a label.
  const [value, ...rest] = item.label.split(' ');
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 14, ...rise(on, 10)}}>
      <div
        style={{
          minWidth: 74,
          padding: '6px 14px',
          borderRadius: 14,
          border: `3px solid ${TONE_COLOR[item.tone ?? 'neutral']}`,
          background: 'rgba(10,12,16,0.55)',
          textAlign: 'center',
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 44,
          color: TONE_COLOR[item.tone ?? 'neutral'],
          textShadow: night.shadow,
        }}
      >
        {value}
      </div>
      <Headline size={26}>{rest.join(' ')}</Headline>
    </div>
  );
};

const Counters: React.FC<{spec: CountersSpec}> = ({spec}) => {
  const lead = useCue(spec.lead, 420);
  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
      <Glass strong style={{padding: '20px 24px'}} accent={night.yellow}>
        <CardLabel>{spec.card}</CardLabel>
        {spec.lead ? (
          <div style={{marginTop: 10, minHeight: 36, ...rise(lead, 8)}}>
            <Headline size={25} color={night.textSoft}>
              {spec.lead.label}
            </Headline>
          </div>
        ) : null}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12, minHeight: 124}}>
          {(spec.counters ?? []).map((counter) => (
            <Counter key={counter.label} item={counter} />
          ))}
        </div>
      </Glass>
      <ChipRow items={spec.chips} />
    </div>
  );
};

/* ---------------------------------------------------------------------- steps */

const Step: React.FC<{item: StepsSpec['steps'][number]; index: number}> = ({item, index}) => {
  const on = useCue(item, 420);
  // The qualifier lands on its own cue when one is given, otherwise with the rule.
  const noteOn = useCue({atMs: item.noteAtMs ?? item.atMs}, 400);
  const color = TONE_COLOR[item.tone ?? 'mint'];
  return (
    <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', ...rise(on, 12)}}>
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: 12,
          border: `2.5px solid ${color}`,
          background: 'rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 23,
          color,
        }}
      >
        {index + 1}
      </div>
      <div style={{flex: 1}}>
        <Headline size={27}>{item.label}</Headline>
        {item.note ? (
          <div style={{marginTop: 7, opacity: noteOn}}>
            <NightChip label={item.note} tone="mint" size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Steps: React.FC<{spec: StepsSpec}> = ({spec}) => (
  <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
    <Glass strong style={{padding: '22px 26px'}} accent={night.mint}>
      <CardLabel>{spec.card}</CardLabel>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22, marginTop: 20, minHeight: 210}}>
        {(spec.steps ?? []).map((step, i) => (
          <Step key={step.label} item={step} index={i} />
        ))}
      </div>
    </Glass>
  </div>
);

/* ----------------------------------------------------------------------- flow */

const FlowNode: React.FC<{item: FlowSpec['nodes'][number]}> = ({item}) => {
  const on = useCue(item, 400);
  const color = TONE_COLOR[item.tone ?? 'neutral'];
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 14,
        border: `2.5px solid ${color}`,
        background: 'rgba(255,255,255,0.06)',
        textAlign: 'center',
        opacity: on,
        transform: `scale(${0.94 + 0.06 * on})`,
      }}
    >
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 24, color: night.text, textShadow: night.shadow}}>
        {item.label}
      </div>
      {item.note ? (
        <div style={{marginTop: 5, fontFamily: unbounded, fontWeight: 700, fontSize: 16, color}}>{item.note}</div>
      ) : null}
    </div>
  );
};

const Flow: React.FC<{spec: FlowSpec}> = ({spec}) => {
  const direction = spec.direction ?? 'row';
  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
      <Glass strong style={{padding: '20px 24px'}}>
        <CardLabel>{spec.card}</CardLabel>
        <div
          style={{
            display: 'flex',
            flexDirection: direction,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 18,
            minHeight: 120,
          }}
        >
          {(spec.nodes ?? []).map((node, i) => (
            <React.Fragment key={node.label}>
              {i > 0 ? <FlowArrow node={node} direction={direction} /> : null}
              <FlowNode item={node} />
            </React.Fragment>
          ))}
        </div>
      </Glass>
      <div style={{marginTop: 16}}>
        <Verdict item={spec.verdict} size={32} />
      </div>
    </div>
  );
};

/** The arrow leading into a node shares that node's cue, so it draws just before it. */
const FlowArrow: React.FC<{node: FlowSpec['nodes'][number]; direction: 'row' | 'column'}> = ({node, direction}) => {
  const on = useCue(node, 320);
  return <Arrow progress={on} direction={direction} />;
};

/* ---------------------------------------------------------------------- split */

const Split: React.FC<{spec: SplitSpec}> = ({spec}) => {
  const split = useCue({atMs: spec.splitAtMs}, 560);
  const left = useCue(spec.left ?? null, 440);
  const right = useCue(spec.right ?? null, 440);
  const gap = 12 + 46 * split;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width}}>
      <Glass strong style={{padding: '20px 24px'}}>
        <CardLabel>{spec.card}</CardLabel>
        {/* The subject gets its own row. Centring it next to a left-aligned
            label made the two read as one overlapping line. */}
        <div style={{display: 'block', textAlign: 'center', marginTop: 16, minHeight: 34, opacity: 1 - split * 0.55}}>
          <Headline size={26}>{spec.subject}</Headline>
        </div>
        <div style={{display: 'flex', gap, marginTop: 16, minHeight: 118}}>
          {[
            {item: spec.left, on: left, tone: spec.left?.tone ?? 'yellow'},
            {item: spec.right, on: right, tone: spec.right?.tone ?? 'mint'},
          ]
            .filter((entry) => entry.item)
            .map(({item, on, tone}) => (
            <div
              key={item.label}
              style={{
                flex: 1,
                padding: '16px 16px',
                borderRadius: 16,
                border: `2.5px solid ${TONE_COLOR[tone]}`,
                background: 'rgba(255,255,255,0.06)',
                opacity: on,
                transform: `translateY(${(1 - on) * 10}px)`,
              }}
            >
              <Headline size={24} color={TONE_COLOR[tone]}>
                {item.label}
              </Headline>
              {item.note ? (
                <div style={{marginTop: 8, fontFamily: unbounded, fontWeight: 700, fontSize: 18, color: night.textSoft}}>
                  {item.note}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Glass>
      <div style={{marginTop: 16}}>
        <Verdict item={spec.verdict} size={32} />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------- registry */

export const GrammarScene: React.FC<{spec: GrammarSpec}> = ({spec}) => {
  switch (spec.type) {
    case 'statement':
      return <Statement spec={spec} />;
    case 'compare':
      return <Compare spec={spec} />;
    case 'tiles':
      return <Tiles spec={spec} />;
    case 'document':
      return <Document spec={spec} />;
    case 'counters':
      return <Counters spec={spec} />;
    case 'steps':
      return <Steps spec={spec} />;
    case 'flow':
      return <Flow spec={spec} />;
    case 'split':
      return <Split spec={spec} />;
    default:
      return null;
  }
};
