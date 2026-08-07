import {readJson} from './batch-lib.mjs';

/**
 * What "already exists" means for the novelty analyser.
 *
 * Shipped reels that predate the history file are listed statically; everything
 * recorded in reel-history.json (including previous batches) is folded in at read
 * time, so a new batch is automatically compared against the last one.
 */

const LEGACY_SHIPPED = [
  'connection tunnel cta',
  'twin network chamber experiment',
  'vpn graveyard of dead services',
  'deadline / lost time',
  'fake connection indicator',
  'quest maze to get access',
  'whitelist hall',
  'last percent of battery',
  'time drain',
  'foreign sim roaming news',
  'data highway traffic jam',
  'dual internet mixer',
  'traffic signature fingerprint',
  'vpn vs proxy vs dns explainer',
  'free vpn business model',
  'whitelist cage',
  'dpi fingerprint',
  'internet passport',
  'superapp',
  'chat control scanning',
  'sim cooling-off period',
];

export const historyTopics = () => {
  const history = readJson('src/reel-system/history/reel-history.json');
  const recorded = history.reels.map((reel) =>
    [reel.concept, reel.heroObject, reel.visualMetaphor].filter(Boolean).join(' '),
  );
  return [...LEGACY_SHIPPED, ...recorded];
};

/** Motion grammars already spent, so a new batch does not reuse them. */
export const usedMotionGrammars = () => {
  const history = readJson('src/reel-system/history/reel-history.json');
  return [...new Set(history.reels.flatMap((reel) => reel.usedMotionPatterns ?? []))];
};
