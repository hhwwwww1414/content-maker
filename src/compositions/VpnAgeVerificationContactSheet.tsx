import React from 'react';
import {AbsoluteFill, Freeze, Sequence} from 'remotion';
import timeline from '../generated/timeline-vpn-age-verification.json';
import {VpnAgeVerificationReel} from './VpnAgeVerificationReel';
import {manrope} from '../theme/fonts';

const COLUMNS = 3;
const ROWS = 4;
const TILES = COLUMNS * ROWS;
const GUTTER = 14;

/**
 * A 3x4 grid of frozen frames spread across the reel, rendered as a single
 * still so QA (and a human) can scan the whole story at a glance.
 */
export const VpnAgeVerificationContactSheet: React.FC = () => {
  const cellWidth = (1080 - GUTTER * (COLUMNS + 1)) / COLUMNS;
  const cellHeight = cellWidth * (1920 / 1080);
  const scale = cellWidth / 1080;
  const gridHeight = ROWS * cellHeight + GUTTER * (ROWS + 1);
  const offsetY = Math.max(GUTTER, (1920 - gridHeight) / 2);

  const frames = Array.from({length: TILES}, (_, i) =>
    Math.round(((i + 0.5) / TILES) * (timeline.durationInFrames - 1)),
  );

  return (
    <AbsoluteFill style={{background: '#0A0C10'}}>
      {frames.map((frame, i) => {
        const column = i % COLUMNS;
        const row = Math.floor(i / COLUMNS);
        return (
          <div
            key={frame}
            style={{
              position: 'absolute',
              left: GUTTER + column * (cellWidth + GUTTER),
              top: offsetY + row * (cellHeight + GUTTER),
              width: cellWidth,
              height: cellHeight,
              overflow: 'hidden',
              borderRadius: 10,
              border: '2px solid rgba(255,255,255,0.16)',
              background: '#08090C',
            }}
          >
            <div style={{width: 1080, height: 1920, transform: `scale(${scale})`, transformOrigin: 'top left'}}>
              {/* Sequence + Freeze pins each tile to a specific frame of the reel. */}
              <Sequence from={-frame} durationInFrames={timeline.durationInFrames} layout="none">
                <Freeze frame={frame}>
                  <VpnAgeVerificationReel />
                </Freeze>
              </Sequence>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 6,
                bottom: 6,
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(0,0,0,0.72)',
                color: '#FFFFFF',
                fontFamily: manrope,
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {(frame / timeline.fps).toFixed(1)}s
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
