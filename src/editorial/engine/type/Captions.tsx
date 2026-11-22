import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {buildPages, PAGE, type PageWord} from '../../kit/pages';
import {springFrom} from '../motion/core';
import {captionZones, safe} from '../tokens';
import type {ArtDirection} from '../themes';
import type {Scene} from '../../kit/types';
import type {DirectionSpec} from '../spec/schema';

const bare = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
/** Rewrites spoken spellings for display: a run of words becomes one word spanning their time, keeping trailing punctuation. */
export const displayWords = <W extends {text: string; startMs: number; endMs: number}>(words: W[], rules: Array<{from: string; to: string}> = []): W[] => {
  let out = words;
  for (const rule of rules) {
    const want = rule.from.split(/\s+/).map(bare).filter(Boolean);
    const next: W[] = [];
    for (let i = 0; i < out.length; i++) {
      if (want.length && want.every((w, k) => out[i + k] && bare(out[i + k].text) === w)) {
        const last = out[i + want.length - 1];
        const tail = last.text.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? '';
        next.push({...out[i], text: rule.to + tail, endMs: last.endMs});
        i += want.length - 1;
      } else next.push(out[i]);
    }
    out = next;
  }
  return out;
};

/** Word-synced captions. They move out of the way when a scene's subject owns the bottom, and yield to spoken type. */
export const EngineCaptions: React.FC<{words: PageWord[]; art: ArtDirection; scenes: Scene[]}> = ({words, art, scenes}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const now = (frame / fps) * 1000;
  const pages = useMemo(() => buildPages(words), [words]);
  const index = pages.findIndex((p, i) => now >= p[0].startMs && now < Math.min(pages[i + 1]?.[0].startMs ?? Infinity, p[p.length - 1].endMs + PAGE.holdMs));
  if (index < 0) return null;
  const page = pages[index];
  const scene = [...scenes].reverse().find((s) => now / 1000 >= s.start) ?? scenes[0];
  const captions = (scene.direction as Partial<DirectionSpec> | undefined)?.captions;
  if (captions?.mode === 'off') return null;
  const zone = captionZones[captions?.zone ?? 'low'];
  const appear = springFrom(frame, Math.round((page[0].startMs / 1000) * fps), fps, 'snap');
  const c = art.captions;
  return (
    <div style={{position: 'absolute', left: safe.left, width: safe.width, top: zone.top, height: zone.height, display: 'flex', alignItems: captions?.zone === 'high' ? 'flex-start' : 'flex-end', justifyContent: 'center', zIndex: 1000}}>
      <div data-qa="captions" data-qa-solid data-qa-zone={captions?.zone ?? 'low'} style={{background: c.background, borderRadius: c.radius, padding: '12px 28px', transform: `translateY(${(1 - appear) * 8}px)`, opacity: Math.min(1, appear * 2), fontFamily: c.font.family, fontSize: 52, fontWeight: c.font.weight, lineHeight: 1.16, textAlign: 'center', color: c.ink, maxWidth: safe.width}}>
        {page.map((word, i) => {
          const active = now >= word.startMs && now < word.endMs;
          const said = now >= word.startMs;
          return <React.Fragment key={word.startMs}>{i ? ' ' : ''}<span style={{color: active ? c.hot : c.ink, opacity: said ? 1 : 0.62}}>{word.text}</span></React.Fragment>;
        })}
      </div>
    </div>
  );
};
