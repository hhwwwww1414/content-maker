import {IG_UNSAFE, SAFE} from '../reel-system/layout/safe-area';

/**
 * Per-reel layout helpers. Safe-zone bounds and caption insets are derived from
 * the single source of truth (safe-area.ts) so nothing drifts. Only horizontal
 * content widths / radii are reel-specific.
 *
 * captionBottom is the paddingBottom used by CaptionPage; it must keep the
 * caption above the bottom unsafe zone (y >= 1440), hence SAFE.captionBottomInset.
 */

const captionBottom = SAFE.captionBottomInset; // 520 -> caption bottom edge at y=1400
const safeTop = SAFE.top; // 240
const safeBottom = IG_UNSAFE.bottom.y; // 1440
const safeLeft = SAFE.left; // 90
const safeRight = SAFE.left + SAFE.width; // 990

export const layout = {
  side: safeLeft,
  top: safeTop,
  bottom: captionBottom,
  right: 170,
  contentWidth: 720,
  radius: 42,
} as const;

export const graveyardLayout = {
  safeLeft,
  safeRight,
  safeTop,
  safeBottom,
  contentWidth: 700,
  captionBottom,
  captionLeft: 100,
  captionRight: 210,
  radius: 40,
} as const;

export const trafficJamLayout = {
  safeLeft,
  safeRight,
  safeTop,
  safeBottom,
  contentWidth: 660,
  captionBottom,
  captionLeft: 100,
  captionRight: 156,
  radius: 40,
} as const;

export const deadlineLayout = {
  safeLeft,
  safeRight,
  safeTop,
  safeBottom,
  contentWidth: 640,
  captionBottom,
  captionLeft: 100,
  captionRight: 220,
  radius: 40,
} as const;
