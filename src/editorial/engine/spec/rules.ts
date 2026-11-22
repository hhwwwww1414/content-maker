import {Direction, ProjectArt, type DirectionSpec} from './schema';
import {artDirections} from '../themes';

// Checks that span scenes. A schema proves a scene is well-formed; these prove a reel is well-directed where a machine can tell.

export type Finding = {level: 'error' | 'warn'; scene: string; rule: string; message: string};
type RawScene = {id: string; voice?: string; start?: number; duration?: number; direction?: unknown};
type RawProject = {art?: unknown; audio?: {mode?: string}; scenes?: RawScene[]; fps?: number; captions?: Array<{text: string; startMs: number; endMs: number}>; id?: string};
type Library = {ids?: Map<string, {kind: string; width?: number; height?: number; license?: string; file: boolean}>; sfx?: Set<string>};

const norm = (text: string) => text.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}_]/gu, '');

/** Every cue in a spec: a string under any *cue key, or a `cue` value that is a word. */
export const walkCues = (node: unknown, out: Array<string | number> = []): Array<string | number> => {
  if (Array.isArray(node)) node.forEach((n) => walkCues(n, out));
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if ((typeof value === 'string' || typeof value === 'number') && key.toLowerCase().endsWith('cue')) out.push(value);
      else walkCues(value, out);
    }
  }
  return out;
};
const assetRefs = (node: unknown, out: string[] = []): string[] => {
  if (Array.isArray(node)) node.forEach((n) => assetRefs(n, out));
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && ['asset', 'fill', 'texture'].includes(key)) out.push(value);
      else assetRefs(value, out);
    }
  }
  return out;
};
const texts = (shot: Record<string, unknown>): string[] => {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && ['text', 'word', 'kicker', 'label', 'note'].includes(key)) out.push(value);
      else walk(value);
    }
  };
  walk(shot);
  return out;
};

export const shotSignature = (d: DirectionSpec) => {
  const s = d.shot as Record<string, unknown>;
  return [s.type, s.layout ?? s.mode ?? s.preset ?? s.axis ?? s.style ?? s.route ?? s.component ?? ''].join(':');
};

export const parseDirection = (raw: unknown) => Direction.safeParse(raw);

export const checkProject = (project: RawProject, library: Library = {}): Finding[] => {
  const findings: Finding[] = [];
  const add = (level: Finding['level'], scene: string, rule: string, message: string) => findings.push({level, scene, rule, message});
  const scenes = project.scenes ?? [];
  const directed = scenes.filter((s) => s.direction);
  if (!directed.length) return findings;

  const art = ProjectArt.safeParse(project.art);
  if (!art.success) add('error', '*', 'schema', `project.art: ${art.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  const main = art.success ? artDirections[art.data.direction] : undefined;
  if (art.success && !main) add('error', '*', 'art', `Unknown art direction ${art.data.direction}. Known: ${Object.keys(artDirections).join(', ')}`);

  const specs: Array<{scene: RawScene; d: DirectionSpec}> = [];
  for (const scene of directed) {
    const parsed = parseDirection(scene.direction);
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 6)) add('error', scene.id, 'schema', `${issue.path.join('.')}: ${issue.message}`);
      continue;
    }
    specs.push({scene, d: parsed.data});
  }

  for (const {scene, d} of specs) {
    const id = scene.id;
    const spoken = (scene.voice ?? '').split(/\s+/).map(norm);
    // Cues must be words the scene really says, otherwise the picture cannot follow the voice.
    const cues = walkCues(d);
    for (const cue of cues) {
      if (typeof cue === 'number') {
        if (scene.duration !== undefined && cue > scene.duration) add('error', id, 'cue', `Cue at ${cue}s is past the scene end (${scene.duration.toFixed(2)}s)`);
        continue;
      }
      const [word, nth] = cue.split('#');
      const hits = spoken.filter((w) => w.startsWith(norm(word)));
      if (hits.length < (nth ? Number(nth) : 1)) add('error', id, 'cue', `Cue "${cue}" is not spoken in this scene`);
    }
    if (!cues.some((c) => typeof c === 'string')) add('error', id, 'cue', 'No spoken cue: the picture is not tied to the voice');

    // Art direction coherence.
    if (d.art.direction && main && d.art.direction !== main.id && !main.compatibleWith.includes(d.art.direction)) {
      add('error', id, 'art', `Art direction ${d.art.direction} does not mix with ${main.id} (compatible: ${main.compatibleWith.join(', ')})`);
    }
    // Assets.
    const refs = new Set([...assetRefs(d.shot), ...d.assets]);
    if (library.ids) for (const ref of refs) {
      const asset = library.ids.get(ref);
      if (!asset) add('error', id, 'asset', `Asset "${ref}" is not in public/library/manifest.json`);
      else if (!asset.file) add('error', id, 'asset', `Asset "${ref}" has no file on disk`);
      else if (!asset.license) add('error', id, 'asset', `Asset "${ref}" has no licence`);
    }
    if (library.sfx) for (const s of d.sound) if (!library.sfx.has(s.sfx)) add('error', id, 'asset', `Sound "${s.sfx}" is not in the manifest`);

    // Density: the voice, the screen text and the beats compete for one pair of eyes.
    if (scene.duration) {
      const wordsOnScreen = texts(d.shot as Record<string, unknown>).join(' ').split(/\s+/).filter(Boolean).length;
      const beats = new Set(cues.filter((c) => typeof c === 'string')).size;
      if (wordsOnScreen / scene.duration > 3.2) add('error', id, 'density', `${wordsOnScreen} on-screen words in ${scene.duration.toFixed(1)}s while the voice speaks: cut the text`);
      if (beats / scene.duration > 1.6) add('warn', id, 'density', `${beats} visual beats in ${scene.duration.toFixed(1)}s: narration is too dense for this much choreography`);
      if (d.timing?.minSeconds && scene.duration < d.timing.minSeconds) add('error', id, 'timing', `Scene needs ${d.timing.minSeconds}s to read, the voice gives ${scene.duration.toFixed(2)}s`);
      if (d.timing?.maxSeconds && scene.duration > d.timing.maxSeconds) add('warn', id, 'timing', `Scene holds ${scene.duration.toFixed(2)}s, longer than the planned ${d.timing.maxSeconds}s`);
    }
    // Spoken layout replaces the captions: forbid it from hiding text anywhere else.
    const shot = d.shot as {type: string; layout?: string};
    // A music-only reel has no speech to caption: its words are the picture.
    if (d.captions.mode === 'off' && project.audio?.mode !== 'music' && !(shot.type === 'type' && shot.layout === 'spoken')) add('error', id, 'captions', 'Captions may be off only when the type itself is spoken word by word');
    // Shouting reads as cheap on a phone; reserve capitals for very short labels.
    for (const text of texts(d.shot as Record<string, unknown>)) {
      const letters = text.replace(/[^\p{L}]/gu, '');
      if (letters.length > 8 && letters === letters.toUpperCase()) add('warn', id, 'type', `All-caps text "${text.slice(0, 30)}": prefer sentence case`);
    }
    const t = d.transition;
    if (t && 'seconds' in t && scene.duration && t.seconds > scene.duration * 0.5) add('error', id, 'transition', `${t.seconds}s transition in a ${scene.duration.toFixed(1)}s scene`);
  }

  // Variety: repetition is the signature of a template.
  for (let i = 1; i < specs.length; i++) {
    const a = specs[i - 1], b = specs[i];
    if (shotSignature(a.d) === shotSignature(b.d)) add('error', b.scene.id, 'variety', `Same composition as the previous scene: ${shotSignature(b.d)}`);
    const ta = a.d.transition?.type, tb = b.d.transition?.type;
    if (ta && ta === tb && ta !== 'cut') add('error', b.scene.id, 'variety', `Same transition twice in a row: ${tb}`);
    // A full-bleed image shows no palette of its own, so it does not count towards the rhythm.
    const paints = (x: typeof a) => (x.d.shot as {type: string}).type !== 'media';
    if (a.d.art.variant === b.d.art.variant && i >= 2 && specs[i - 2].d.art.variant === a.d.art.variant && paints(a) && paints(b) && paints(specs[i - 2])) add('warn', b.scene.id, 'variety', `Three scenes in a row in the ${b.d.art.variant} palette: no colour rhythm`);
  }
  const systems = new Set(specs.map((s) => (s.d.shot as {type: string}).type));
  if (specs.length >= 4 && systems.size < 3) add('error', '*', 'variety', `Only ${systems.size} scene systems in ${specs.length} scenes`);
  const counts = new Map<string, number>();
  for (const s of specs) counts.set(shotSignature(s.d), (counts.get(shotSignature(s.d)) ?? 0) + 1);
  for (const [signature, count] of counts) if (count > Math.max(2, specs.length / 3)) add('error', '*', 'variety', `${signature} used ${count} times`);
  const transitions = specs.slice(1).map((s) => s.d.transition?.type ?? 'cut');
  if (transitions.length >= 3 && new Set(transitions).size < 2) add('warn', '*', 'variety', `One transition everywhere: ${transitions[0]}`);
  return findings;
};
