import {useEffect, useState} from 'react';
import type {RefObject} from 'react';
import {cancelRender, continueRender, delayRender, useCurrentFrame} from 'remotion';
import standards from '../../config/reel.standards.json';

const {safe, readability} = standards;
const TOLERANCE = 1;

type Box = {el: Element; left: number; right: number; top: number; bottom: number};

const effectiveOpacity = (el: Element, stop: Element) => {
  let value = 1;
  for (let node: Element | null = el; node && node !== stop; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.visibility === 'hidden' || style.display === 'none') return 0;
    value *= Number(style.opacity);
  }
  return value;
};

// Check real rendered geometry on every frame, including preview frames.
export const LayoutGuard = ({root: rootRef}: {root: RefObject<HTMLDivElement | null>}) => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender('Checking editorial text layout'));
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bounds = root.getBoundingClientRect();
    // Remotion also mounts a hidden measuring tree; it is not a rendered frame.
    if (bounds.width === 0 || bounds.height === 0 || bounds.y < -10000) {
      continueRender(handle);
      return;
    }
    const scale = bounds.width / 1080;
    const errors: string[] = [];
    const inFrame = (b: DOMRect) => ({left: (b.left - bounds.left) / scale, right: (b.right - bounds.left) / scale, top: (b.top - bounds.top) / scale, bottom: (b.bottom - bounds.top) / scale});
    const outsideSafe = (b: {left: number; right: number; top: number; bottom: number}) => b.left < safe.left - TOLERANCE || b.right > safe.right + TOLERANCE || b.top < safe.top - TOLERANCE || b.bottom > safe.bottom + TOLERANCE;
    const describe = (el: Element) => JSON.stringify((el.textContent ?? '').slice(0, 40));

    root.querySelectorAll<HTMLElement>('[data-qa="title"],[data-qa="captions"]').forEach((element) => {
      if (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2) errors.push('Text overflow ' + describe(element));
      if (outsideSafe(inFrame(element.getBoundingClientRect()))) errors.push('Text outside safe area ' + describe(element));
    });
    root.querySelectorAll('[data-qa="label"]').forEach((label) => {
      const box = label.querySelector('rect')?.getBoundingClientRect();
      const text = label.querySelector('text')?.getBoundingClientRect();
      if (box && text && (text.left < box.left + 5 * scale || text.right > box.right - 5 * scale || text.top < box.top || text.bottom > box.bottom)) errors.push('SVG label overflow');
    });

    // Kit scenes: only settled frames, since transitions and entrances legitimately cross elements.
    const scenes = [...root.querySelectorAll<HTMLElement>('[data-qa-scene]')];
    const settled = scenes.length === 1 && scenes[0].dataset.qaSettled === '1';
    const captions = root.querySelector<HTMLElement>('[data-qa="captions"]');
    if (captions) {
      const px = parseFloat(getComputedStyle(captions).fontSize);
      if (root.dataset.qaKit === '1' && px < readability.minCaptionFontPx) errors.push(`Caption font ${px}px below ${readability.minCaptionFontPx}px`);
    }
    if (settled) {
      const visible = (el: Element) => !el.closest('[data-qa-moving]') && effectiveOpacity(el, root) >= 0.6;
      const collect = (selector: string) => [...scenes[0].querySelectorAll(selector)].filter(visible).map((el): Box => ({el, ...inFrame(el.getBoundingClientRect())}));
      const texts = collect('[data-qa="text"]').filter((box) => (box.el.textContent ?? '').trim());
      const solids = collect('[data-qa-solid]');
      for (const text of texts) {
        const el = text.el as HTMLElement;
        const style = getComputedStyle(el);
        // Effective size: a camera push or an entrance scale changes what the viewer reads.
        const effective = parseFloat(style.fontSize) * (el.offsetWidth ? el.getBoundingClientRect().width / scale / el.offsetWidth : 1);
        const min = Number(el.dataset.qaMin ?? readability.minFontPx);
        if (effective < min - 0.5) errors.push(`Font ${effective.toFixed(1)}px below ${min}px ${describe(el)}`);
        if (outsideSafe(text)) errors.push(`Text outside safe area ${describe(el)} ${JSON.stringify(inFrame(el.getBoundingClientRect()))}`);
        // Tight line-height lets glyph ink exceed the line box slightly; that is not clipped text.
        const slack = Math.max(3, parseFloat(style.fontSize) * 0.15);
        if (el.scrollHeight > el.clientHeight + slack || el.scrollWidth > el.clientWidth + slack) errors.push(`Text overflow ${describe(el)} ${el.scrollWidth}x${el.scrollHeight}>${el.clientWidth}x${el.clientHeight}`);
      }
      const captionBox: Box[] = captions ? [{el: captions, ...inFrame(captions.getBoundingClientRect())}] : [];
      const all = [...texts, ...solids, ...captionBox];
      const related = (a: Element, b: Element) => a === b || a.contains(b) || b.contains(a);
      const allowed = (a: Element) => a.closest('[data-qa-allow-overlap]') !== null;
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i], b = all[j];
          if (related(a.el, b.el) || allowed(a.el) || allowed(b.el)) continue;
          const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (dx > 2 && dy > 2) errors.push(`Overlap ${describe(a.el)} × ${describe(b.el)} (${Math.round(dx)}×${Math.round(dy)}px)`);
        }
      }
    }
    if (errors.length) cancelRender(new Error('Editorial layout frame ' + frame + ': ' + [...new Set(errors)].slice(0, 6).join('; ')));
    continueRender(handle);
  }, [frame, handle, rootRef]);
  return null;
};
