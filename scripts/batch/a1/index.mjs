import {BANNED_PHRASES, buildReels} from '../axes.mjs';
import {candidates} from './candidates-data.mjs';
import {PLANS} from './plans-data.mjs';
import {research, RETRIEVED_AT, sources} from './research-data.mjs';

/** Batch 2026-07-25-a1 — the news / everyday-pain / myth / micro / behaviour / paradox set. */

export const BATCH_ID = '2026-07-25-a1';
export const BATCH_DATE = '2026-07-25';

const RAW_REELS = [
  {index: 1, slug: 'wifi-migration', candidateId: 'c01-wifi-migration', compositionId: 'GhostPepeBatch01WifiMigration', voiceProfile: 'DOCUMENTARY-URGENCY'},
  {index: 2, slug: 'whitelist-pov', candidateId: 'c02-whitelist-pov', compositionId: 'GhostPepeBatch02WhitelistPov', voiceProfile: 'DRY-IRONY'},
  {index: 3, slug: 'sni-envelope', candidateId: 'c03-sni-envelope', compositionId: 'GhostPepeBatch03SniEnvelope', voiceProfile: 'CALM-MYTH-BUSTING'},
  {index: 4, slug: 'packet-too-big', candidateId: 'c04-packet-too-big', compositionId: 'GhostPepeBatch04PacketTooBig', voiceProfile: 'SCIENTIFIC-CURIOSITY'},
  {index: 5, slug: 'outage-ritual', candidateId: 'c05-outage-ritual', compositionId: 'GhostPepeBatch05OutageRitual', voiceProfile: 'CONVERSATIONAL-OBSERVATION'},
  {index: 6, slug: 'rerouted-map', candidateId: 'c06-rerouted-map', compositionId: 'GhostPepeBatch06ReroutedMap', voiceProfile: 'MINIMAL-THRILLER'},
];

export const TERRITORIES = [
  'ACTUAL-NEWS',
  'EVERYDAY-USER-PAIN',
  'TECHNICAL-MYTH',
  'MICROSCOPIC-NETWORK-WORLD',
  'BEHAVIOURAL-SOCIAL',
  'STRONG-VISUAL-PARADOX',
];

export const batch = {
  BATCH_ID,
  BATCH_DATE,
  RETRIEVED_AT,
  batchDir: `runs/batches/${BATCH_ID}`,
  outDir: `out/batch-${BATCH_ID}`,
  REELS: buildReels(BATCH_ID, RAW_REELS),
  BANNED_PHRASES,
  TERRITORIES,
  sources,
  research,
  candidates,
  PLANS,
};
