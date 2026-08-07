import {BANNED_PHRASES, buildReels} from '../axes.mjs';
import {candidates} from './candidates-data.mjs';
import {PLANS} from './plans-data.mjs';
import {research, RETRIEVED_AT, sources} from './research-data.mjs';

/**
 * Batch 2026-07-25-b1 — six pieces of engineering elegance behind a VPN,
 * each explained in everyday language with the payoff inside the first seconds.
 */

export const BATCH_ID = '2026-07-25-b1';
export const BATCH_DATE = '2026-07-25';

const RAW_REELS = [
  {index: 1, slug: 'paint-secret', candidateId: 'b01-paint-secret', compositionId: 'GhostPepeCraftPaintSecret', voiceProfile: 'WARM-EXPLAINER'},
  {index: 2, slug: 'xor-switch', candidateId: 'b02-xor-switch', compositionId: 'GhostPepeCraftXorSwitch', voiceProfile: 'PLAYFUL-PRECISION'},
  {index: 3, slug: 'box-in-box', candidateId: 'b03-box-in-box', compositionId: 'GhostPepeCraftBoxInBox', voiceProfile: 'DEADPAN-OBSERVER'},
  {index: 4, slug: 'avalanche', candidateId: 'b04-avalanche', compositionId: 'GhostPepeCraftAvalanche', voiceProfile: 'MEASURED-DEMONSTRATION'},
  {index: 5, slug: 'concierge-ledger', candidateId: 'b05-concierge-ledger', compositionId: 'GhostPepeCraftConciergeLedger', voiceProfile: 'STORYTELLER-NEIGHBOUR'},
  {index: 6, slug: 'two-timers', candidateId: 'b06-two-timers', compositionId: 'GhostPepeCraftTwoTimers', voiceProfile: 'TENSE-BUILD'},
];

export const TERRITORIES = [
  'KEY-EXCHANGE-ELEGANCE',
  'SYMMETRIC-CIPHER-ELEGANCE',
  'ENCAPSULATION-ELEGANCE',
  'INTEGRITY-ELEGANCE',
  'MULTIPLEXING-ELEGANCE',
  'TRANSPORT-LAYERING-PITFALL',
];

export const batch = {
  BATCH_ID,
  BATCH_DATE,
  RETRIEVED_AT,
  batchDir: `runs/batches/${BATCH_ID}`,
  outDir: `out/batch-${BATCH_ID}`,
  REELS: buildReels(BATCH_ID, RAW_REELS, 'craft'),
  BANNED_PHRASES,
  TERRITORIES,
  sources,
  research,
  candidates,
  PLANS,
};
