import {z} from 'zod';

// The storyboard contract: AI storyboard -> this validated spec -> scene renderer.
// Every field is data. No executable code crosses this boundary; `custom` names a reviewed component.

export const Cue = z.union([z.string().min(1), z.number().min(0)]).describe('A spoken word prefix ("снял", "кадр#2" for the second) or seconds from the scene start');
const Box = z.tuple([z.number(), z.number(), z.number().positive(), z.number().positive()]).describe('[left, top, width, height] in 1080x1920 frame pixels');
const Norm = z.tuple([z.number().min(-0.5).max(1.5), z.number().min(-0.5).max(1.5)]).describe('[x, y] as a fraction of the frame or image');
const Markup = z.string().min(1).describe('Text; *accent* marks emphasis, "/" forces a line break in poster settings');
const Tone = z.enum(['ink', 'accent', 'accent2', 'muted', 'danger']);
const Spring = z.enum(['settle', 'soft', 'snap', 'pop', 'bounce', 'heavy', 'camera', 'smooth', 'crisp', 'lively', 'hero', 'glide']);
const Emphasis = z.enum(['color', 'marker', 'underline', 'italic', 'strike', 'box', 'gradient']);
const Reveal = z.enum(['lines', 'words', 'chars', 'spoken', 'punch', 'focus', 'none']);
const Anchor = z.enum(['top', 'center', 'bottom']);
const Align = z.enum(['left', 'center', 'right']);

export const Text = z.strictObject({
  text: Markup,
  cue: Cue.optional(),
  reveal: Reveal.default('lines'),
  emphasis: Emphasis.optional().describe('Defaults to the art direction\'s emphasis'),
  emphasisCue: Cue.optional().describe('The word that triggers the emphasis animation'),
  role: z.enum(['display', 'statement', 'italic', 'body']).default('display'),
  tone: Tone.default('ink'),
  align: Align.default('left'),
  maxSize: z.number().positive().optional(),
  exitCue: Cue.optional(),
});
export type TextSpec = z.output<typeof Text>;

const Asset = z.string().min(1).describe('An id from public/library/manifest.json');
const Grade = z.enum(['none', 'mono', 'warm', 'cold', 'noir', 'duotone']);

// --- Scene systems ------------------------------------------------------------------------------

export const TypeShot = z.strictObject({
  type: z.literal('type'),
  layout: z.enum(['poster', 'stack', 'spoken', 'window']).describe('poster: each line fills the width; stack: balanced lines; spoken: words land as said; window: letters show an image'),
  anchor: Anchor.default('center'),
  headline: Text,
  kicker: Markup.optional(),
  sub: Text.optional(),
  ghost: z.string().optional().describe('A giant background word or number that bleeds off frame'),
  shape: z.enum(['none', 'band', 'disc', 'slab']).default('none').describe('One large graphic mass behind the type'),
  shapeCue: Cue.optional(),
  fill: Asset.optional().describe('Image shown through the letters (window layout)'),
});

const Callout = z.strictObject({at: Norm, text: Markup, cue: Cue, side: z.enum(['left', 'right', 'above', 'below']).default('right'), tone: Tone.default('accent')});
const Plate = z.strictObject({asset: Asset, cue: Cue.optional(), focus: Norm.default([0.5, 0.5]), zoom: z.number().min(1).max(4).default(1.1), endFocus: Norm.optional(), endZoom: z.number().min(1).max(4).optional(), callouts: z.array(Callout).default([]), title: Text.optional().describe('Replaces the shot title while this plate is on screen')});
export const MediaShot = z.strictObject({
  type: z.literal('media'),
  plates: z.array(Plate).min(1).max(4).describe('Full-bleed images or video; later plates cut in on their cue'),
  grade: Grade.default('none'),
  reveal: z.enum(['none', 'iris', 'wipe', 'blinds', 'rise']).default('none'),
  title: Text.optional(),
  titleAnchor: Anchor.default('top'),
  foreground: z.strictObject({asset: Asset, depth: z.number().default(0.5), box: Box}).optional().describe('A transparent cutout on its own parallax plane'),
});

const Bar = z.strictObject({label: z.string(), value: z.number(), display: z.string().optional(), cue: Cue.optional(), highlight: z.boolean().default(false)});
export const DataShot = z.discriminatedUnion('mode', [
  z.strictObject({type: z.literal('data'), mode: z.literal('counter'), value: z.number(), from: z.number().default(0), decimals: z.number().int().min(0).max(2).default(0), prefix: z.string().default(''), suffix: z.string().default(''), unit: z.string().optional(), label: Markup.optional(), cue: Cue.optional(), landCue: Cue.optional().describe('The word on which the number lands'), roll: z.enum(['digits', 'count', 'none']).default('digits'), footnote: Text.optional(), anchor: Anchor.default('center')}),
  z.strictObject({type: z.literal('data'), mode: z.literal('bars'), items: z.array(Bar).min(2).max(5), title: Text.optional(), max: z.number().positive().optional()}),
  z.strictObject({type: z.literal('data'), mode: z.literal('units'), total: z.number().int().min(4).max(900), highlight: z.number().int().min(1), columns: z.number().int().min(2).max(30).optional(), glyph: z.enum(['dot', 'person', 'square']).default('person'), cue: Cue.optional(), highlightCue: Cue.optional(), title: Text.optional(), titleAnchor: Anchor.default('top')}),
  z.strictObject({type: z.literal('data'), mode: z.literal('line'), points: z.array(z.number()).min(2).max(40), labels: z.array(z.strictObject({at: z.number().int().min(0), text: z.string(), cue: Cue.optional()})).default([]), cue: Cue.optional(), seconds: z.number().positive().optional(), end: z.string().optional(), title: Text.optional(), area: z.boolean().default(true)}),
]);

const ChatItem = z.strictObject({from: z.enum(['them', 'me']).default('them'), text: z.string(), cue: Cue});
const NoteItem = z.strictObject({app: z.string(), text: z.string(), cue: Cue, urgent: z.boolean().default(false)});
const TxItem = z.strictObject({text: z.string(), amount: z.string(), cue: Cue});
const SettingItem = z.strictObject({text: z.string(), on: z.boolean().default(true), flipCue: Cue.optional(), focus: z.boolean().default(false)});
const PostItem = z.strictObject({author: z.string(), text: z.string(), likes: z.number().int().optional(), cue: Cue.optional(), asset: Asset.optional()});
const App = z.discriminatedUnion('app', [
  z.strictObject({app: z.literal('call'), name: z.string(), detail: z.string().optional(), answerCue: Cue.optional(), lines: z.array(z.strictObject({text: z.string(), cue: Cue})).default([]), hangupCue: Cue.optional()}),
  z.strictObject({app: z.literal('chat'), title: z.string(), items: z.array(ChatItem).min(1).max(7)}),
  z.strictObject({app: z.literal('notifications'), clock: z.string().default('9:41'), date: z.string().optional(), items: z.array(NoteItem).min(1).max(6)}),
  z.strictObject({app: z.literal('bank'), title: z.string().default('Счёт'), balance: z.number(), to: z.number().optional(), balanceCue: Cue.optional(), currency: z.string().default('₽'), items: z.array(TxItem).default([])}),
  z.strictObject({app: z.literal('settings'), title: z.string(), items: z.array(SettingItem).min(1).max(7)}),
  z.strictObject({app: z.literal('feed'), title: z.string().optional(), items: z.array(PostItem).min(1).max(6), scrollCue: Cue.optional()}),
  z.strictObject({app: z.literal('browser'), url: z.string(), typeCue: Cue.optional(), heading: z.string(), body: z.string().optional(), warning: z.strictObject({text: z.string(), cue: Cue}).optional()}),
]);
const PhonePose = z.strictObject({cue: Cue, rx: z.number().optional(), ry: z.number().optional(), rz: z.number().optional(), scale: z.number().optional(), x: z.number().optional(), y: z.number().optional()});
export const DeviceShot = z.strictObject({
  type: z.literal('device'),
  layout: z.enum(['hero', 'rise', 'macro', 'offset']).describe('hero: phone tilted, centre; rise: bleeds off the bottom under a title; macro: the screen fills the frame; offset: phone bleeds off the right edge'),
  screen: App,
  title: Text.optional(),
  titleStage: z.enum(['top', 'poster']).default('top').describe('poster: the title takes the whole frame, for when a pose sends the phone away'),
  poses: z.array(PhonePose).default([]).describe('Tilt and zoom keyed to words: the camera tracks the phone'),
  enterCue: Cue.optional(),
});

const Object3D = z.enum(['house', 'card', 'coin', 'phone', 'box', 'sphere', 'key', 'book', 'tv', 'weight']);
const Label3D = z.strictObject({target: z.union([z.number().int(), z.string()]).describe('Index of a piece'), text: z.string(), cue: Cue.optional()});
const Base3D = {
  type: z.literal('stage3d'),
  title: Text.optional(),
  titleAnchor: Anchor.default('top'),
  labels: z.array(Label3D).default([]),
  orbit: z.number().default(0.12).describe('Radians the camera travels around the subject'),
  floor: z.boolean().default(true),
};
export const Stage3DShot = z.discriminatedUnion('preset', [
  z.strictObject({...Base3D, preset: z.literal('dominoes'), count: z.number().int().min(3).max(16), startCue: Cue.optional(), seconds: z.number().positive().default(2), stopAt: z.number().int().optional().describe('Index that survives'), piece: Object3D.optional()}),
  z.strictObject({...Base3D, preset: z.literal('tower'), count: z.number().int().min(2).max(60), piece: z.enum(['coin', 'box', 'book']).default('coin'), buildCue: Cue.optional(), seconds: z.number().positive().default(1.6), collapseCue: Cue.optional()}),
  z.strictObject({...Base3D, preset: z.literal('balance'), left: Object3D, right: Object3D, leftCount: z.number().int().min(1).max(8).default(1), rightCount: z.number().int().min(1).max(8).default(1), tilts: z.array(z.strictObject({cue: Cue, tilt: z.number().min(-0.5).max(0.5)})).min(1).describe('Positive lowers the right pan'), pushCue: Cue.optional().describe('The camera moves in on the lowered side on this word')}),
  z.strictObject({...Base3D, preset: z.literal('iceberg'), diveCue: Cue, surface: z.string().optional(), depth: z.string().optional()}),
  z.strictObject({...Base3D, preset: z.literal('orbit'), satellites: z.number().int().min(0).max(8).default(4), texture: Asset.optional(), signalCue: Cue.optional(), lockCue: Cue.optional().describe('The camera flies to the pin on this word'), pin: z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]).optional().describe('[latitude, longitude]')}),
  z.strictObject({...Base3D, preset: z.literal('spotlight'), object: Object3D, lightCue: Cue.optional(), spinCue: Cue.optional(), breakCue: Cue.optional()}),
]);

const Pane = z.strictObject({kicker: z.string().optional(), word: Markup.optional(), value: z.string().optional(), note: z.string().optional(), asset: Asset.optional(), variant: z.enum(['base', 'inverse', 'block']).optional()});
export const SplitShot = z.strictObject({
  type: z.literal('split'),
  axis: z.enum(['horizontal', 'vertical', 'diagonal']).default('horizontal').describe('horizontal: A on top, B below'),
  a: Pane, b: Pane,
  keys: z.array(z.strictObject({cue: Cue, at: z.number().min(0).max(1)})).min(1).describe('Where the seam moves to: 0 is all B, 1 is all A'),
  start: z.number().min(0).max(1).default(1),
});

export const TimelineShot = z.strictObject({
  type: z.literal('timeline'),
  events: z.array(z.strictObject({date: z.string(), text: Markup, cue: Cue, tone: Tone.default('ink')})).min(2).max(5),
  style: z.enum(['corridor', 'rail']).default('corridor'),
});

const Piece = z.strictObject({
  kind: z.enum(['paper', 'photo', 'stamp', 'note', 'document', 'tape', 'word', 'receipt']),
  box: Box,
  rotate: z.number().default(0),
  cue: Cue.optional(),
  text: Markup.optional(),
  lines: z.array(z.string()).optional(),
  markLine: z.number().int().optional(),
  markCue: Cue.optional(),
  asset: Asset.optional(),
  tone: Tone.optional(),
  depth: z.number().default(0),
  size: z.number().positive().optional(),
  torn: z.boolean().default(false),
});
export const CollageShot = z.strictObject({type: z.literal('collage'), pieces: z.array(Piece).min(1).max(10), impactCue: Cue.optional().describe('Camera shakes once on this word')});

const Icon = z.enum(['user', 'wallet', 'card', 'bank', 'phone', 'mail', 'lock', 'shield', 'alert', 'money', 'chain', 'gavel', 'house', 'eye', 'globe', 'search', 'chip', 'tv', 'hand', 'cash', 'question']);
export const JourneyShot = z.strictObject({
  type: z.literal('journey'),
  nodes: z.array(z.strictObject({text: Markup, icon: Icon.optional(), value: z.string().optional(), cue: Cue, tone: Tone.default('accent')})).min(2).max(6),
  route: z.enum(['zigzag', 'descend', 'climb']).default('zigzag'),
  overviewCue: Cue.optional().describe('Pull back to show the whole chain at once'),
  title: Text.optional(),
});

export const CustomShot = z.strictObject({
  type: z.literal('custom'),
  component: z.string().describe('A name registered in src/editorial/engine/custom.ts'),
  props: z.record(z.string(), z.unknown()).default({}),
  review: z.string().min(10).describe('Why no system fits. Custom scenes need tests and a human look'),
});

export const Shot = z.union([TypeShot, MediaShot, DataShot, DeviceShot, Stage3DShot, SplitShot, TimelineShot, CollageShot, JourneyShot, CustomShot]);
export type ShotSpec = z.output<typeof Shot>;

// --- Transitions --------------------------------------------------------------------------------

export const Transition = z.discriminatedUnion('type', [
  z.strictObject({type: z.literal('cut'), intent: z.string().optional()}),
  z.strictObject({type: z.literal('push'), direction: z.enum(['left', 'right', 'up', 'down']).default('up'), seconds: z.number().min(0.15).max(1.2).default(0.5), intent: z.string().optional()}),
  z.strictObject({type: z.literal('through'), origin: Norm.default([0.5, 0.45]), seconds: z.number().min(0.2).max(1.2).default(0.6), intent: z.string().optional()}),
  z.strictObject({type: z.literal('mask'), shape: z.enum(['circle', 'diamond', 'diagonal', 'bars', 'rise']).default('circle'), origin: Norm.default([0.5, 0.5]), seconds: z.number().min(0.2).max(1.2).default(0.55), intent: z.string().optional()}),
  z.strictObject({type: z.literal('field'), origin: Norm.default([0.5, 0.5]), seconds: z.number().min(0.3).max(1.4).default(0.7), intent: z.string().optional()}),
  z.strictObject({type: z.literal('morph'), from: Box, to: Box.optional(), color: z.enum(['accent', 'accent2', 'ink', 'bg']).default('accent'), radius: z.number().min(0).default(0), seconds: z.number().min(0.3).max(1.4).default(0.8), intent: z.string().optional()}),
  z.strictObject({type: z.literal('glyph'), glyph: z.string().min(1).max(3), seconds: z.number().min(0.4).max(1.6).default(0.9), intent: z.string().optional()}),
  z.strictObject({type: z.literal('depth'), seconds: z.number().min(0.25).max(1.2).default(0.65), intent: z.string().optional()}),
]);
export type TransitionSpec = z.output<typeof Transition>;

// --- A directed scene ---------------------------------------------------------------------------

export const Purpose = z.enum(['opening', 'question', 'reveal', 'explain', 'proof', 'data', 'contrast', 'turn', 'climax', 'payoff']);
export const Direction = z.strictObject({
  purpose: Purpose,
  emotion: z.string().min(2).describe('What the viewer should feel'),
  concept: z.string().min(8).describe('The visual idea: what the picture says that the words do not'),
  art: z.strictObject({
    direction: z.string().optional().describe('Override only as a deliberate contrast beat; must be compatible'),
    variant: z.enum(['base', 'inverse', 'block']).default('base'),
    field: z.enum(['silk', 'ink', 'beam', 'paper', 'gradient', 'solid', 'stage']).optional(),
    light: Norm.optional(),
    motion: z.enum(['fluid', 'snappy', 'weighty', 'calm', 'keynote']).optional(),
  }).prefault({}),
  hierarchy: z.strictObject({primary: z.string(), secondary: z.array(z.string()).default([])}).describe('The one thing seen first, and what supports it'),
  layers: z.strictObject({background: z.string().optional(), foreground: z.string().optional()}).optional(),
  assets: z.array(Asset).default([]),
  shot: Shot,
  choreography: z.array(z.strictObject({cue: Cue, action: z.string()})).default([]).describe('The planned beats, for humans and the density check'),
  camera: z.strictObject({
    move: z.enum(['still', 'pushIn', 'pullOut', 'panLeft', 'panRight', 'tiltUp', 'tiltDown', 'driftUp', 'creep']).default('pushIn'),
    keys: z.array(z.strictObject({cue: Cue, x: z.number().optional(), y: z.number().optional(), scale: z.number().optional(), rotate: z.number().optional(), seconds: z.number().optional(), spring: Spring.optional()})).default([]),
    handheld: z.number().min(0).max(2).optional(),
  }).prefault({}),
  transition: Transition.optional().describe('How this scene arrives, centred on its first spoken word'),
  captions: z.strictObject({mode: z.enum(['on', 'off']).default('on'), zone: z.enum(['low', 'high']).default('low')}).prefault({}),
  timing: z.strictObject({minSeconds: z.number().optional(), maxSeconds: z.number().optional()}).optional().describe('What this picture needs to read'),
  sound: z.array(z.strictObject({cue: Cue, sfx: z.string(), volume: z.number().min(0).max(1).default(0.5)})).default([]),
  source: z.enum(['show', 'hide']).default('hide').describe('Deprecated and ignored: sources are never shown on screen; they go in the post caption'),
});
export type DirectionSpec = z.output<typeof Direction>;

export const ProjectArt = z.strictObject({
  direction: z.string(),
  motion: z.enum(['fluid', 'snappy', 'weighty', 'calm', 'keynote']).optional(),
  music: z.strictObject({asset: Asset, volume: z.number().min(0).max(1).default(0.14), duck: z.number().min(0).max(1).default(0.45)}).optional(),
});

export const jsonSchema = () => z.toJSONSchema(z.strictObject({art: ProjectArt, direction: Direction}), {io: 'input', unrepresentable: 'any'});
