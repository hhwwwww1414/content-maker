/**
 * Scene grammars: the fixed vocabulary a reel is assembled from.
 *
 * Until now every reel carried 300–450 lines of bespoke TSX, which made the
 * conveyor impossible — a machine cannot invent a new visual language per run.
 * A grammar is a reusable scene *type* parameterised entirely from the content
 * JSON, so a new reel is authored by choosing grammars and filling their slots.
 *
 * Diversity does not come from unique code any more; it comes from which
 * grammars a reel picks, in what order, with what geometry and tone — and the
 * 16-axis novelty gate still refuses batches that converge.
 *
 * Timing: any `at` / `until` field in a spec names a *line id* from the script.
 * `scripts/eleven/generate-voice.mjs` walks the whole chapter tree and adds the
 * measured `atMs` / `untilMs` next to it, so nothing here computes time.
 */

export type Tone = 'mint' | 'yellow' | 'red' | 'neutral';

/** A cue authored as a line id and resolved to milliseconds before render. */
export type Cue = {
  /** line id, e.g. "l13" — authored */
  at?: string;
  /** offset applied to the resolved cue, authored */
  offsetMs?: number;
  /** resolved by the pre-render step */
  atMs?: number | null;
};

export type Item = Cue & {
  label: string;
  note?: string;
  /** optional separate cue for the note, so a qualifier can land after its claim */
  noteAt?: string;
  noteAtMs?: number | null;
  tone?: Tone;
};

/** A claim, optionally cancelled on screen, optionally answered by a verdict. */
export type StatementSpec = {
  type: 'statement';
  card?: string;
  /** the claim itself; struck through when `strikeAt` fires */
  claim?: string;
  strikeAt?: string;
  strikeAtMs?: number | null;
  claimTone?: Tone;
  verdict?: Item;
  items?: Item[];
};

/** Two or three things set against each other, one row per side. */
export type CompareSpec = {
  type: 'compare';
  card?: string;
  rows: (Item & {glyph?: 'window' | 'agent' | 'lock' | 'doc' | 'none'})[];
  chips?: Item[];
};

/** A small grid of states — services, options, devices. */
export type TilesSpec = {
  type: 'tiles';
  card?: string;
  /** one line that states what the grid is, before the tiles start landing */
  lead?: Item;
  /** short status printed under every tile, e.g. "ВОШЁЛ" */
  badge?: string;
  tiles: Item[];
  verdict?: Item;
  strike?: Item;
};

/** A page or message with something hidden inside it that later lights up. */
export type DocumentSpec = {
  type: 'document';
  card?: string;
  visible?: string;
  hidden: Item;
  /** brings the hidden block from "unreadable" to full contrast */
  revealAt?: string;
  revealAtMs?: number | null;
  aside?: Item;
  verdict?: Item;
};

/** Two or three numbers that carry the whole fact. */
export type CountersSpec = {
  type: 'counters';
  card?: string;
  lead?: Item;
  /** label is "5 АГЕНТНЫХ БРАУЗЕРОВ" — the leading token is rendered big */
  counters: Item[];
  chips?: Item[];
};

/** Numbered rules or stages. */
export type StepsSpec = {
  type: 'steps';
  card?: string;
  steps: Item[];
};

/** A chain of nodes with arrows: request -> hop -> answer. */
export type FlowSpec = {
  type: 'flow';
  card?: string;
  direction?: 'row' | 'column';
  nodes: Item[];
  verdict?: Item;
};

/** One object separating into two labelled halves that never rejoin. */
export type SplitSpec = {
  type: 'split';
  card?: string;
  subject: string;
  splitAt?: string;
  splitAtMs?: number | null;
  left: Item;
  right: Item;
  verdict?: Item;
};

export type GrammarSpec =
  | StatementSpec
  | CompareSpec
  | TilesSpec
  | DocumentSpec
  | CountersSpec
  | StepsSpec
  | FlowSpec
  | SplitSpec;

export type GrammarType = GrammarSpec['type'];

export const GRAMMAR_TYPES: GrammarType[] = [
  'statement',
  'compare',
  'tiles',
  'document',
  'counters',
  'steps',
  'flow',
  'split',
];

/** One chapter of a reel as the renderer sees it, after cue resolution. */
export type ResolvedChapter = {
  id: string;
  label?: string | null;
  eyebrow?: string | null;
  headline: string;
  startMs: number | null;
  endMs: number | null;
  grammar?: GrammarSpec | null;
};
