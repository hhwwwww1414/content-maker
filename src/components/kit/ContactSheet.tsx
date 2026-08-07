import React from 'react';
import {AbsoluteFill, Freeze, Sequence} from 'remotion';
import {manrope} from '../../theme/fonts';

const COLUMNS = 3;
const ROWS = 4;
const TILES = COLUMNS * ROWS;
const GUTTER = 14;

/**
 * A 3x4 grid of frozen frames spread across a reel, rendered as a single still
 * so QA (and a human) can scan the whole story at a glance.
 *
 * Shared by every reel on the ElevenLabs pipeline: pass the reel component plus
 * its measured duration and the sheet lays itself out.
 */
export const ContactSheet: React.FC<{
  reel: React.FC;
  durationInFrames: number;
  fps: number;
}> = ({reel: Reel, durationInFrames, fps}) => {
  // Height is the binding constraint for a 9:16 tile in a 9:16 sheet, so the
  // grid is sized from the rows and then centred horizontally — otherwise the
  // bottom row (memory frame + CTA) falls off the canvas.
  const cellHeight = (1920 - GUTTER * (ROWS + 1)) / ROWS;
  const cellWidth = cellHeight * (1080 / 1920);
  const scale = cellWidth / 1080;
  const offsetY = GUTTER;
  const offsetX = (1080 - (COLUMNS * cellWidth + GUTTER * (COLUMNS - 1))) / 2;

  const frames = Array.from({length: TILES}, (_, i) =>
    Math.round(((i + 0.5) / TILES) * (durationInFrames - 1)),
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
              left: offsetX + column * (cellWidth + GUTTER),
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
              <Sequence from={-frame} durationInFrames={durationInFrames} layout="none">
                <Freeze frame={frame}>
                  <Reel />
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
              {(frame / fps).toFixed(1)}s
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
