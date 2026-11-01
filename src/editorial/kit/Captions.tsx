import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {bodyFont} from './fonts';
import {BACK, prog} from './scene';
import {buildPages, PAGE, type PageWord} from './pages';
import type {Theme} from './themes';

/** Word-synced captions in a fixed band clear of Instagram's bottom UI and right-hand rail. */
export const WordCaptions: React.FC<{words: PageWord[]; theme: Theme; variant?: string}> = ({words, theme, variant = 'plate'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = (frame / fps) * 1000;
  const pages = useMemo(() => buildPages(words), [words]);
  const index = pages.findIndex((p, i) => now >= p[0].startMs && now < Math.min(pages[i + 1]?.[0].startMs ?? Infinity, p[p.length - 1].endMs + PAGE.holdMs));
  if (index < 0) return null;
  const page = pages[index];
  const appear = prog(frame, Math.round((page[0].startMs / 1000) * fps), 6, BACK);
  const skin = {
    plate: {background: theme.captionBg, borderRadius: 18, padding: '12px 28px'},
    ink: {background: theme.captionBg, borderRadius: 0, padding: '10px 30px', transform: 'rotate(-0.6deg)'},
    tape: {background: theme.captionBg, borderRadius: 999, padding: '12px 40px'},
  }[variant] ?? {};
  return (
    <div style={{position: 'absolute', left: 80, width: 860, top: 1400, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div data-qa="captions" data-qa-solid style={{...skin, transform: `${skin.transform ?? ''} scale(${0.94 + 0.06 * appear})`, fontFamily: bodyFont, fontSize: 56, fontWeight: 800, lineHeight: 1.16, textAlign: 'center', color: theme.captionInk, maxWidth: 830}}>
        {page.map((word, i) => {
          const active = now >= word.startMs && now < word.endMs;
          const said = now >= word.startMs;
          return <React.Fragment key={word.startMs}>{i ? ' ' : ''}<span style={{color: active ? theme.captionHot : theme.captionInk, opacity: said ? 1 : 0.72}}>{word.text}</span></React.Fragment>;
        })}
      </div>
    </div>
  );
};
