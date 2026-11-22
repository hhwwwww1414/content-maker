// Run: node --no-warnings --test --test-concurrency=1 'studio/tests/*.test.mjs'
import assert from 'node:assert/strict';
import {existsSync, readFileSync, mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import '../lib/ts-hooks.mjs';
import {ROOT} from '../lib/project.mjs';
import {libraryOf, projectAssetIds, readManifest} from '../lib/library.mjs';
import {allowedLicense} from '../lib/asset-providers.mjs';

const {artDirections, artIds} = await import('../../src/editorial/engine/themes.ts');
const {contrastRatio, hexToRgb, safe, captionZones} = await import('../../src/editorial/engine/tokens.ts');
const motion = await import('../../src/editorial/engine/motion/core.ts');
const type = await import('../../src/editorial/engine/type/typeset.ts');
const {Direction, Transition, Shot, jsonSchema} = await import('../../src/editorial/engine/spec/schema.ts');
const {checkProject, walkCues} = await import('../../src/editorial/engine/spec/rules.ts');
const {duckedVolume, speechAt} = await import('../../src/editorial/engine/sound.ts');
const {stories, storyProject, transitionProject, transitionNames} = await import('../../src/editorial/engine/lab/stories.ts');

const hsl = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  const h = d === 0 ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return {h: h * 60, s, l};
};

test('every art direction meets contrast in every palette', () => {
  for (const id of artIds) for (const [variant, p] of Object.entries(artDirections[id].palettes)) {
    for (const [name, fg, bg, min] of [['ink/bg', p.ink, p.bg, 4.5], ['muted/bg', p.muted, p.bg, 4.5], ['accent/bg', p.accent, p.bg, 3], ['onAccent/accent', p.onAccent, p.accent, 4.5]]) {
      assert.ok(contrastRatio(fg, bg) >= min, `${id}.${variant} ${name}: ${contrastRatio(fg, bg).toFixed(2)}`);
    }
  }
  for (const id of artIds) {
    const c = artDirections[id].captions;
    assert.ok(contrastRatio(c.ink, c.background) >= 4.5, `${id} caption ink`);
    assert.ok(contrastRatio(c.hot, c.background) >= 4.5, `${id} caption hot`);
  }
});

test('no art direction falls back on neon green', () => {
  for (const id of artIds) for (const p of Object.values(artDirections[id].palettes)) for (const hex of [p.accent, p.accent2]) {
    const {h, s, l} = hsl(hex);
    assert.ok(!(h > 90 && h < 170 && s > 0.75 && l > 0.5), `${id} ${hex} is neon green`);
  }
});

test('art direction compatibility is symmetric and known', () => {
  for (const id of artIds) for (const other of artDirections[id].compatibleWith) {
    assert.ok(artDirections[other], `${id} names unknown ${other}`);
    assert.ok(artDirections[other].compatibleWith.includes(id), `${other} does not list ${id}`);
  }
});

test('every font role in every direction is vendored locally', () => {
  const faces = JSON.parse(readFileSync(resolve(ROOT, 'src/editorial/engine/fonts.manifest.json'), 'utf8'));
  for (const face of faces) assert.ok(existsSync(resolve(ROOT, 'public', face.path)), face.path);
  const has = (family, weight, style = 'normal') => faces.some((f) => f.family === family && Number(f.weight) === weight && f.style === style && f.subset === 'cyrillic');
  for (const id of artIds) {
    const a = artDirections[id];
    for (const role of [a.display, a.statement, a.body, a.label2, a.mono, a.captions.font]) assert.ok(has(role.family, role.weight), `${id}: ${role.family} ${role.weight}`);
    if (a.emphasis === 'italic') assert.ok(has(a.italic.family, a.italic.weight, 'italic'), `${id}: italic ${a.italic.family}`);
  }
});

test('motion is deterministic and defined in seconds, so 30 and 60 fps agree', () => {
  assert.equal(motion.sec(0.5, 30) * 2, motion.sec(0.5, 60));
  for (const t of [0.1, 0.2, 0.5, 0.8]) {
    assert.ok(Math.abs(motion.tween(motion.sec(t, 30), 0, 1, 30) - motion.tween(motion.sec(t, 60), 0, 1, 60)) < 1e-6);
    for (const preset of ['soft', 'pop', 'heavy', 'snap']) assert.ok(Math.abs(motion.springFrom(motion.sec(t, 30), 0, 30, preset) - motion.springFrom(motion.sec(t, 60), 0, 60, preset)) < 0.03, `${preset} at ${t}`);
  }
  assert.equal(motion.springFrom(4, 10, 30), 0);
  assert.ok(Math.abs(motion.springFrom(200, 0, 30, 'pop') - 1) < 1e-3, 'springs settle at 1');
  const pop = Array.from({length: 40}, (_, i) => motion.springFrom(i, 0, 30, 'pop'));
  assert.ok(Math.max(...pop) > 1 && Math.max(...pop) < 1.2, 'pop overshoots in a controlled way');
});

test('the camera follows keys on words and its handheld drift repeats exactly', () => {
  const base = {fps: 30, durationFrames: 150, resolve: (c) => (c === 'слово' ? 30 : 0), defaultSpring: 'soft', move: 'pushIn', keys: [{cue: 'слово', scale: 1.5, seconds: 0.5}], handheld: 1};
  assert.ok(motion.cameraAt({...base, frame: 20}).scale < 1.1);
  assert.ok(Math.abs(motion.cameraAt({...base, frame: 60}).scale - 1.5) < 0.01);
  assert.deepEqual(motion.cameraAt({...base, frame: 77}), motion.cameraAt({...base, frame: 77}));
  const cam = {x: 10, y: 0, scale: 1.2, rotate: 0};
  assert.match(motion.parallaxStyle(cam, -1).transform, /translate\(0px, 0px\) scale\(1\)/);
});

test('shapes share point counts, so any morph is well-defined and hits both ends', () => {
  const a = motion.shapes.circle(0, 0, 100), b = motion.shapes.rect(0, 0, 200, 200);
  assert.equal(a.length, b.length);
  assert.deepEqual(motion.morph(a, b, 0), a);
  motion.morph(a, b, 1).forEach((pt, i) => assert.ok(Math.hypot(pt[0] - b[i][0], pt[1] - b[i][1]) < 1e-9));
  assert.match(motion.toPath(a), /^M.*Z$/);
});

const metric = (text, size) => text.length * size * 0.55;
test('typesetting: accents survive punctuation and do not leak to the next word', () => {
  const runs = type.parseMarkup('Зовут *студентов*. Признаки те же, «*да*»!');
  assert.deepEqual(runs.filter((r) => r.accent).map((r) => r.text), ['студентов.', '«да»!']);
  assert.deepEqual(type.parseMarkup('*два слова* нет').map((r) => r.accent), [true, true, false]);
});

test('typesetting: Russian short words stay with the next word, a dash with the previous', () => {
  const units = type.toUnits(type.parseMarkup('Кредит на тебя — и всё'));
  assert.deepEqual(units.map((u) => u.runs.map((r) => r.text).join(' ')), ['Кредит', 'на тебя —', 'и всё']);
  const set = type.fitText('Деньги не вернули ни в суде ни в банке', metric, {width: 420, height: 900, maxSize: 90, minSize: 30, leading: 1.1});
  for (const line of set.lines) assert.ok(!['в', 'ни', 'не'].includes(line.words.at(-1).text), 'line ends on a short word');
});

test('typesetting: text fits its box at the largest size, and overflow is reported instead of clipped', () => {
  const o = {width: 860, height: 600, maxSize: 200, minSize: 40, leading: 1.1};
  const set = type.fitText('Кредит на тебя может взять чужой', metric, o);
  for (const line of set.lines) assert.ok(line.width <= o.width + 0.5);
  assert.ok(set.height <= o.height);
  assert.equal(type.fitText('Невероятнодлиннющеенепереносимоесловодляэтойузкойколонки', metric, {...o, width: 200}), null);
});

test('poster setting fills the width, keeps explicit breaks and scales down as a block', () => {
  const set = type.fitPoster('Верховный / суд', metric, {width: 860, height: 2000, maxSize: 900, minSize: 40, leading: 1});
  assert.equal(set.lines.length, 2);
  assert.ok(set.lines[1].size > set.lines[0].size);
  for (const line of set.lines) assert.ok(Math.abs(line.width - 860) < 30);
  const short = type.fitPoster('Верховный / суд', metric, {width: 860, height: 300, maxSize: 900, minSize: 40, leading: 1});
  assert.ok(short.height <= 300);
  assert.ok(short.lines[1].size > short.lines[0].size, 'proportions preserved');
});

const direction = (shot, extra = {}) => ({purpose: 'explain', emotion: 'интерес', concept: 'Проверка контракта сцены', hierarchy: {primary: 'x'}, shot, ...extra});
const typeShot = (text = 'Кадр', cue = 'кадр') => ({type: 'type', layout: 'stack', headline: {text, cue}});

test('the scene contract applies defaults and rejects unknown fields and types', () => {
  const parsed = Direction.parse(direction(typeShot()));
  assert.equal(parsed.camera.move, 'pushIn');
  assert.equal(parsed.captions.zone, 'low');
  assert.equal(parsed.art.variant, 'base');
  assert.equal(parsed.shot.headline.reveal, 'lines');
  assert.equal(Direction.safeParse(direction({type: 'hologram'})).success, false);
  assert.equal(Direction.safeParse(direction({...typeShot(), wobble: 3})).success, false, 'unknown shot field');
  assert.equal(Direction.safeParse({...direction(typeShot()), concept: 'x'}).success, false, 'concept is required to mean something');
  assert.equal(Shot.safeParse({type: 'data', mode: 'bars', items: [{label: 'a', value: 1}]}).success, false, 'bars need two items');
  assert.equal(Transition.safeParse({type: 'mask', shape: 'heart'}).success, false);
});

test('every Lab story and transition satisfies the contract', () => {
  assert.ok(stories.length >= 25);
  for (const s of stories) assert.ok(Direction.safeParse(storyProject(s).scenes[0].direction).success, s.id);
  transitionNames.forEach((name, i) => assert.ok(Direction.safeParse(transitionProject(i).scenes[1].direction).success, name));
  const systems = new Set(stories.map((s) => s.shot.type));
  assert.deepEqual([...systems].sort(), ['collage', 'custom', 'data', 'device', 'journey', 'media', 'split', 'stage3d', 'timeline', 'type']);
});

test('the JSON schema exports for an external planner', () => {
  const schema = jsonSchema();
  assert.ok(schema.properties.direction);
  assert.ok(JSON.stringify(schema).includes('stage3d'));
});

const scene = (id, shot, voice = 'Кадр снят сейчас', extra = {}) => ({id, voice, duration: 4, start: 0, direction: direction(shot, extra)});
const project = (scenes, art = {direction: 'editorial'}) => ({id: 'x', art, scenes});
const errors = (p, lib) => checkProject(p, lib).filter((f) => f.level === 'error');
const rules = (p, lib) => errors(p, lib).map((f) => f.rule);

test('rules reject repetition, unspoken cues and incompatible art', () => {
  const a = scene('a', typeShot()), b = scene('b', {type: 'data', mode: 'counter', value: 5, cue: 'кадр'});
  assert.deepEqual(rules(project([a, b])), []);
  assert.ok(rules(project([a, scene('b', typeShot())])).includes('variety'));
  assert.ok(rules(project([scene('a', typeShot('Кадр', 'телевизор'))])).includes('cue'));
  assert.ok(rules(project([scene('a', {type: 'type', layout: 'stack', headline: {text: 'Кадр'}})])).includes('cue'), 'no cue at all');
  assert.ok(rules(project([scene('a', typeShot(), undefined, {art: {direction: 'bold'}})])).includes('art'));
  assert.deepEqual(rules(project([scene('a', typeShot(), undefined, {art: {direction: 'luxury'}})])), []);
  assert.ok(rules(project([a], {direction: 'nope'})).includes('art'));
});

test('rules: transitions cannot repeat, and four scenes need three systems', () => {
  const t = {transition: {type: 'through'}};
  const a = scene('a', typeShot(), undefined, t), b = scene('b', {type: 'data', mode: 'counter', value: 5, cue: 'кадр'}, undefined, t);
  assert.ok(errors(project([a, b])).some((f) => f.message.includes('transition')));
  const s = ['poster', 'stack', 'window', 'spoken'].map((layout, i) => scene(`s${i}`, {...typeShot(), layout}, undefined, layout === 'spoken' ? {captions: {mode: 'off'}} : {}));
  assert.ok(errors(project(s)).some((f) => f.message.includes('scene systems')));
});

test('rules: density and timing report narration that cannot carry the picture', () => {
  const crowded = {...scene('a', typeShot('Очень длинный заголовок из множества слов который никто не успеет прочитать за две секунды пока говорит голос')), duration: 2};
  assert.ok(rules(project([crowded])).includes('density'));
  const short = {...scene('a', typeShot(), undefined, {timing: {minSeconds: 6}}), duration: 3};
  assert.ok(rules(project([short])).includes('timing'));
  const beats = {...scene('a', {type: 'journey', nodes: [{text: 'a', cue: 'кадр'}, {text: 'b', cue: 'снят'}, {text: 'c', cue: 'сейчас'}]}), duration: 1.5};
  assert.ok(checkProject(project([beats])).some((f) => f.rule === 'density' && f.level === 'warn'));
});

test('rules: captions may be off only for spoken type', () => {
  assert.ok(rules(project([scene('a', typeShot(), undefined, {captions: {mode: 'off'}})])).includes('captions'));
  assert.ok(!rules({...project([scene('a', typeShot(), undefined, {captions: {mode: 'off'}})]), audio: {mode: 'music'}}).includes('captions'));
  assert.ok(!rules(project([scene('a', {...typeShot(), layout: 'spoken'}, undefined, {captions: {mode: 'off'}})])).includes('captions'));
});

test('rules: a missing or unlicensed asset is an error, never a substitution', () => {
  const lib = {ids: new Map([['ok', {kind: 'image', license: 'CC0', file: true}], ['nofile', {kind: 'image', license: 'CC0', file: false}], ['nolicense', {kind: 'image', license: '', file: true}]]), sfx: new Set(['tick'])};
  const shot = (asset) => ({type: 'media', plates: [{asset}], title: {text: 'Кадр', cue: 'кадр'}});
  assert.deepEqual(rules(project([scene('a', shot('ok'))]), lib), []);
  for (const asset of ['ghost', 'nofile', 'nolicense']) assert.ok(rules(project([scene('a', shot(asset))]), lib).includes('asset'), asset);
  assert.ok(rules(project([scene('a', typeShot(), undefined, {sound: [{cue: 'кадр', sfx: 'nope'}]})]), lib).includes('asset'));
  assert.throws(() => libraryOf({scenes: [{direction: {assets: ['ghost-asset']}}]}), /no silent fallback/);
});

test('asset manifest: every entry has a file, a hash and a licence on the allowed list', () => {
  const {assets} = readManifest();
  assert.ok(Object.keys(assets).length >= 8);
  for (const a of Object.values(assets)) {
    assert.ok(existsSync(resolve(ROOT, 'public', a.path)), a.id);
    assert.ok(a.sha256 && a.license, a.id);
    assert.ok(a.source, `${a.id}: no source`);
    if (a.kind === 'image' || a.kind === 'video') assert.ok(a.width && a.height, `${a.id}: no dimensions`);
    if (a.source.startsWith('http')) assert.ok(allowedLicense(a.license), `${a.id}: ${a.license}`);
  }
  assert.equal(allowedLicense('All rights reserved'), false);
  assert.equal(allowedLicense(undefined), false);
  assert.ok(allowedLicense('CC BY 2.0') && allowedLicense('Public domain'));
});

test('music ducks under speech, recovers in pauses and fades at both ends', () => {
  const words = [{startMs: 2000, endMs: 3000}, {startMs: 6000, endMs: 6500}];
  const o = {fps: 30, words, base: 0.2, duck: 0.5, totalFrames: 300};
  assert.equal(speechAt(2500, words), 1);
  assert.equal(speechAt(4500, words), 0);
  assert.ok(Math.abs(duckedVolume(75, o) - 0.1) < 1e-9, 'ducked during a word');
  assert.ok(Math.abs(duckedVolume(135, o) - 0.2) < 1e-9, 'restored in a pause');
  assert.equal(duckedVolume(0, o), 0);
  assert.ok(duckedVolume(299, o) < 0.02);
});

test('caption zones lie inside the safe area and every sample project keeps real audio timing', () => {
  for (const z of Object.values(captionZones)) assert.ok(z.top >= safe.top && z.top + z.height <= safe.bottom);
  for (const id of ['sample-safe-account', 'sample-drug-market', 'sample-droppers', 'sample-flat-seller']) {
    const p = JSON.parse(readFileSync(resolve(ROOT, `studio/projects/${id}.json`), 'utf8'));
    assert.equal(p.captions.map((c) => c.text).join(' '), p.scenes.map((s) => s.voice).join(' '), id);
    assert.ok(existsSync(resolve(ROOT, 'public', p.audio.voicePath)), id);
    assert.deepEqual(errors(p), [], id);
    assert.equal(p.status.scriptApproval, 'demo', 'samples must not count as publishable');
    assert.ok(projectAssetIds(p).length >= 1);
  }
});

test('directed reels never load fonts from the network', () => {
  const source = readFileSync(resolve(ROOT, 'src/editorial/kit/fonts.ts'), 'utf8');
  assert.match(source, /ensureKitFonts/);
  assert.doesNotMatch(source, /theme\/fonts/, 'importing theme/fonts would fetch at module load');
  const video = readFileSync(resolve(ROOT, 'src/editorial/EditorialVideo.tsx'), 'utf8');
  assert.ok(video.indexOf('ensureKitFonts();') > video.indexOf('const LegacyVideo'), 'only the kit path fetches');
});

test('every CSS background image in the engine has a renderer-visible twin', () => {
  for (const file of ['fx/Finish.tsx', 'scenes/TypeScene.tsx']) {
    const source = readFileSync(resolve(ROOT, 'src/editorial/engine', file), 'utf8');
    assert.match(source, /backgroundImage/, file);
    assert.match(source, /<Img /, `${file}: frames could be captured before the image loads`);
  }
});

test('the handoff guide example is a valid project, and its commands exist', () => {
  const guide = readFileSync(resolve(ROOT, 'docs/AI_VIDEO_CREATION_GUIDE.md'), 'utf8');
  const example = JSON.parse(guide.match(/```json\n([\s\S]*?)```/)[1]);
  assert.deepEqual(errors(example), []);
  for (const script of guide.matchAll(/node (studio\/[\w-]+\.mjs)/g)) assert.ok(existsSync(resolve(ROOT, script[1])), script[1]);
  for (const doc of ['VIDEO_DESIGN_SYSTEM', 'MOTION_SYSTEM', 'SCENE_ARCHITECTURE', 'VIDEO_QUALITY_CHECKLIST']) assert.ok(existsSync(resolve(ROOT, `docs/${doc}.md`)), doc);
  const reel = readFileSync(resolve(ROOT, 'studio/reel.mjs'), 'utf8');
  for (const command of ['new', 'status', 'approve', 'run', 'sheet', 'gates', 'scene', 'storyboard', 'schema']) assert.match(reel, new RegExp(`command === '${command}'`), command);
});

test('walkCues finds keyed cues in any shot', () => {
  const cues = walkCues(direction({type: 'device', layout: 'hero', screen: {app: 'call', name: 'x', answerCue: 'да', lines: [{text: 'y', cue: 'нет'}]}}));
  assert.deepEqual(cues.sort(), ['да', 'нет']);
});

test('the validator delegates directed projects to the spec rules', () => {
  const p = {id: 'x', topic: 't', niche: 'n', sources: [{id: 's'}], status: {}, centralIdea: 'c', audio: {}, art: {direction: 'editorial'}, scenes: [
    {id: 'a', voice: 'Кадр снят.', thought: 't', animation: 'a', onScreen: 'X', sources: ['s'], direction: direction(typeShot('Кадр', 'телевизор'))},
  ]};
  const file = join(mkdtempSync(join(tmpdir(), 'reel-')), 'p.json');
  writeFileSync(file, JSON.stringify(p));
  const r = spawnSync('python3', ['studio/pipeline.py', 'validate', file, '--stage=script'], {cwd: ROOT, encoding: 'utf8'});
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /not spoken/);
});
