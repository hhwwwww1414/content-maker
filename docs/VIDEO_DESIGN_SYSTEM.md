# Video design system

Everything visual in a directed reel comes from `src/editorial/engine/`. Tokens are pure data shared by React, the validator and the tests, so one number never lives in two places.

## Tokens: `engine/tokens.ts`

| Group | Names | Note |
|---|---|---|
| Format | `format`, `safe`, `stage`, `captionZones` | Numbers come from `config/reel.standards.json`. Safe area 80–940 × 200–1600 |
| Space | `xxs 8`, `xs 16`, `s 24`, `m 40`, `l 64`, `xl 96`, `xxl 144` | |
| Grid | `grid.col(n)`, `grid.span(n)` | 6 columns in the safe width |
| Type scale | `micro 30`, `caption 34`, `body 42`, `lead 56`, `title 76`, `headline 104`, `display 148`, `poster 220`, `giant 360` | Nothing readable goes below 30 px |
| Radius, opacity, weights | `radius`, `opacity`, `weights` | |
| Depth | `elevation.flat/low/mid/high` | Contact shadow plus ambient shadow |
| Time | `durations` in seconds | Never frames |
| Colour helpers | `contrastRatio`, `mix`, `alpha` | |

## Art directions: `engine/themes.ts`

An art direction is a set of decisions, not a skin: three palettes, a type voice, light, texture, pacing and a default emphasis.

| Id | For stories about | Type | Field | Pacing | Emphasis |
|---|---|---|---|---|---|
| `editorial` | Law, money, institutions | Noto Serif Display, Onest | `paper` | calm | italic |
| `documentary` | Geopolitics, investigations, real events | Sofia Sans Extra Condensed, Spectral | `beam` | weighty, handheld | colour |
| `bold` | Viral explainers, schemes, youth | Geologica Black | `gradient` | snappy | marker |
| `dimensional` | Mechanisms, systems | Unbounded, Onest | `gradient` | fluid | colour |
| `luxury` | Status, money, restraint | Cormorant, Tenor Sans | `silk` | calm | italic |
| `culture` | Platforms, apps, psychology | Inter Tight, JetBrains Mono | `solid` | snappy | box |
| `thriller` | Compulsion, dread, a private trap | Sofia Sans Extra Condensed, Spectral | `ink` | weighty | colour |
| `brash` | Provocation, opinion, a dare | Geologica Black | `solid` | snappy | marker |
| `soft` | A hard subject told gently | Geologica Bold, Onest | `gradient` | calm | colour |
| `marker` | Quotes cut to a beat, no voice | Noto Serif Display, Onest | `paper` | snappy | marker |

Each has `base`, `inverse` and `block` palettes. A scene picks one with `art.variant`; changing it between scenes gives a reel its colour rhythm, and three scenes in a row in one palette raises a warning.

**Mixing.** `compatibleWith` lists which directions may appear together, as a deliberate contrast beat (`art.direction` on one scene). It is symmetric and tested. An incompatible mix fails validation.

**Enforced by tests** (`studio/tests/engine.test.mjs`): ink and muted text at 4.5:1 on every palette, accent at 3:1, caption colours at 4.5:1, every font role vendored, and no neon-green accent.

## Fonts: `engine/fonts.tsx`

52 OFL faces with Cyrillic live in `public/library/fonts/`, listed in `engine/fonts.manifest.json`, written by `studio/vendor-fonts.mjs`. `FontGate` mounts a directed reel only after they load, so measurements are always real and the render uses no network for type. Kit-theme scenes (older projects) still fetch from Google Fonts on demand.

## Typography engine: `engine/type/`

`typeset.ts` is pure; `Headline.tsx` is the React side.

- **Markup.** `*accent*` marks emphasis, including across words and next to punctuation. `/` forces a line in a poster.
- **Russian rules.** Short prepositions and conjunctions stay with the next word; a dash stays with the previous one.
- **Line breaking.** Minimises squared slack over all lines, with a penalty for a stranded last word.
- **Fitting.** `stack` finds the largest size that fits the box. `poster` scales each line to fill the width, then scales the block down if it is too tall, keeping the proportions.
- **Overflow.** Text that does not fit at the minimum size fails the render with a message naming it. It is never clipped.
- **Reveals.** `lines` (mask), `words`, `chars`, `spoken` (each word lands as it is said), `punch`, `none`. Type leads the voice by 0.1 s, so a hard cut never shows a bare ground.
- **Emphasis.** `color`, `marker`, `underline`, `italic` (swaps to the italic face, measured as such), `strike`, `box`, each drawn on `emphasisCue`.

Avoid long all-caps text: validation warns on it.

## Captions: `engine/type/Captions.tsx`

Word-synced plates in the art direction's colours. `captions.zone` is `low` (default) or `high` for a subject that owns the bottom of the frame. `captions.mode: "off"` is allowed only for `spoken` type, which is itself the caption.

## Finish and fields: `engine/fx/`

`Field.tsx` is a deterministic WebGL background at half resolution: `silk`, `ink`, `beam`, `paper`, `gradient`, `solid`. `Finish.tsx` is the last pass of each frame: vignette and film grain at 15 ticks a second regardless of output frame rate. Grain also hides banding in gradients after encoding.

## UI components: `engine/ui/`

`PhoneBody` (machined edge, lip, glass highlight, contact shadow) and screens: `call`, `chat`, `notifications`, `bank`, `settings`, `feed`, `browser`. Charts, counters, timelines, callouts and annotations live in the scene systems that use them. Icons come from `lucide-react` (ISC).

HeroUI is not used. It builds on Framer Motion and Tailwind for wall-clock animation in an interactive page, while every pixel here must be a pure function of the frame number.

## Assets: `public/library/manifest.json`, `studio/assets.mjs`

Scenes reach files only through manifest ids, so paths are deterministic and every file carries measured dimensions, a hash, a licence, an author and a source.

```bash
node studio/assets.mjs list
node studio/assets.mjs check [project.json]
node studio/assets.mjs search nasa "earth at night"
node studio/assets.mjs add my-photo --provider commons --ref "File:Name.jpg" --tags x,y
node studio/assets.mjs add earth-clip --provider nasa --ref <nasa_id> --kind video
node studio/assets.mjs add my-cutout --file ./a.png --license "CC0" --author "Who" --source "https://..."
node studio/assets.mjs credits studio/projects/my-reel.json
```

- Providers (`studio/lib/asset-providers.mjs`) sit behind one interface. A new one, such as an image generator, only has to return `{url, license, author, source}`. Nothing paid is required.
- Licences are checked against an allow-list. A file with no clear licence is refused.
- Downloads are cached by URL in `runs/studio/asset-cache/`.
- **There is no fallback.** A missing or unlicensed asset is a validation error, not a substituted shape.
- Supported: images including transparent PNG and SVG, video (muted), textures for 3D, sound effects, music. `glTF` models are not supported: 3D objects are procedural (`engine/fx/three-kit.ts`).
- `gates.mjs` warns when a plate is enlarged more than ×1.6 on screen.
- `studio/synth-audio.mjs` writes the sound library from seeded noise and sines, so it is our own material.
