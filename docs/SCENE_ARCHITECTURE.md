# Scene architecture

```
AI storyboard  ->  project JSON with `direction` on each scene  ->  validation  ->  scene systems  ->  real render  ->  gates
```

No generated React crosses this boundary. A planner writes data. Anything data cannot express goes through the explicit `custom` path.

## Layout of the code

| Path | Role |
|---|---|
| `src/editorial/index.tsx` | Compositions: `EditorialReel` (production) and the `Lab` folder |
| `src/editorial/EditorialVideo.tsx` | Routes a project: `DirectedVideo` for scenes with `direction`, `LegacyVideo` for older kit and template projects |
| `src/editorial/LayoutGuard.tsx` | Checks real geometry on every frame |
| `src/editorial/engine/spec/schema.ts` | **The contract** (Zod), exported to `docs/storyboard.schema.json` |
| `src/editorial/engine/spec/rules.ts` | Cross-scene rules |
| `src/editorial/engine/scenes/` | The nine systems |
| `src/editorial/engine/custom.ts` | Registered custom scenes |
| `src/editorial/kit/` | Older layer system. Still rendered, not extended |

`studio/projects/*.json` hold projects. `content/`, `scripts/conveyor/`, `scripts/eleven/` and `src/Root.tsx` are the older production paths and were not changed by the engine.

## A directed scene

```json
{
  "id": "turn", "voice": "Верховный суд за покупателя.", "onScreen": "...", "thought": "...", "animation": "...", "sources": ["primary"],
  "direction": {
    "purpose": "turn",
    "emotion": "разворот",
    "concept": "Большая фраза на чёрной полосе разворота",
    "art": {"variant": "inverse", "field": "silk"},
    "hierarchy": {"primary": "Верховный суд", "secondary": ["за покупателя"]},
    "layers": {"background": "шёлк", "foreground": "плакат"},
    "assets": [],
    "shot": {"type": "type", "layout": "poster", "headline": {"text": "Верховный / суд / *за покупателя*", "cue": "Верховный"}},
    "choreography": [{"cue": "покупателя", "action": "камера наезжает"}],
    "camera": {"move": "pushIn", "keys": [{"cue": "покупателя", "scale": 1.12, "seconds": 1.4}]},
    "transition": {"type": "field", "origin": [0.5, 0.48], "seconds": 0.75, "intent": "Чернила становятся фоном"},
    "captions": {"mode": "on", "zone": "low"},
    "timing": {"minSeconds": 3},
    "sound": [{"cue": "суд", "sfx": "thud", "volume": 0.4}]
  }
}
```

The project also needs `"art": {"direction": "editorial", "music": {"asset": "bed-warm", "volume": 0.11, "duck": 0.55}}`.

`scene.start`, `scene.duration`, `durationSeconds` and `captions` come from the measured voice. Never write them by hand.

| Field | Answers |
|---|---|
| `purpose` | `opening`, `question`, `reveal`, `explain`, `proof`, `data`, `contrast`, `turn`, `climax`, `payoff` |
| `emotion`, `concept` | What the viewer should feel, and what the picture says that the words do not |
| `hierarchy.primary` | The one thing seen first |
| `shot` | Which system and how it is set |
| `camera`, `choreography`, `transition`, `sound` | Movement and its timing on words |
| `captions`, `timing` | Caption placement, what the picture needs to read |

## The nine systems

Prefer a few strong settings to many similar ones. A system's `layout`, `mode` or `preset` is a different composition, not a skin.

| `type` | Settings | Good for |
|---|---|---|
| `type` | `layout`: `poster`, `stack`, `spoken`, `window`. `shape`: `band`, `disc`, `slab`. `ghost` | Opening statement, reveal, climax, payoff |
| `media` | `plates` (image or video), `grade`, `reveal`, tracked `callouts`, per-plate `title`, parallax `foreground` | Real events, documentary imagery |
| `data` | `mode`: `counter`, `bars`, `units`, `line` | Scale, proof, comparison of numbers |
| `device` | `layout`: `hero`, `rise`, `macro`, `offset`. `screen.app`: `call`, `chat`, `notifications`, `bank`, `settings`, `feed`, `browser`. `poses`, `titleStage` | Anything that happens on a phone |
| `stage3d` | `preset`: `dominoes`, `tower`, `balance`, `iceberg`, `orbit`, `spotlight`. Objects: `house`, `card`, `coin`, `phone`, `box`, `sphere`, `key`, `book`, `tv`, `weight`. Tracked `labels` | Metaphor, mechanism, object spotlight |
| `split` | `axis`: `horizontal`, `vertical`, `diagonal`. Seam `keys` move on words | Before and after, question with two answers |
| `timeline` | `style`: `corridor`, `rail` | Chronology, escalating consequences |
| `collage` | `pieces`: `document`, `stamp`, `note`, `photo`, `paper`, `tape`, `word`, `receipt`. `impactCue` | Paperwork, law, evidence |
| `journey` | `route`: `descend`, `climb`, `zigzag`. `overviewCue` | A process the camera follows through a larger world |

### Which system for which beat

| Beat | Try first |
|---|---|
| Cinematic opening | `media` with a strong plate, or `stage3d spotlight` |
| Dramatic question | `split`, or `type stack` |
| Full-screen reveal | `media` with `reveal`, or `type poster` on `block` |
| Large kinetic type | `type poster` or `spoken` |
| One number | `data counter` |
| People, share of a whole | `data units` |
| Product or object | `stage3d spotlight` |
| Social or app behaviour | `device` |
| Chain reaction | `stage3d dominoes` |
| Hidden risk | `stage3d iceberg` |
| Trade-off | `stage3d balance` |
| Geography | `stage3d orbit` with `pin` |
| Before and after | `split` |
| Collage of evidence | `collage` |
| Climax | Hard `cut` to `type poster` on the `block` palette |
| Payoff | `type window`, or `split` for a question |

## Sources are never on screen

Claims are cited in the project's `sources` and in the post text. No frame shows a source line, badge or credit: the renderer has no such element. The old `direction.source` field is accepted for compatibility and ignored.

## Rules that apply automatically

`checkProject` in `spec/rules.ts`, run by `studio/spec-check.mjs` and `pipeline.py validate`:

| Rule | Level |
|---|---|
| Schema valid, no unknown fields | error |
| Every cue is spoken in its scene; each scene has at least one spoken cue | error |
| Art direction exists and is compatible | error |
| Assets in the manifest, on disk, licensed; sounds in the manifest | error |
| On-screen words above 3.2 per second while the voice speaks | error |
| Same `type:layout` as the previous scene, same non-cut transition twice, fewer than 3 systems in 4+ scenes, one composition used too often | error |
| Beats above 1.6 per second: narration too dense for this choreography | warn |
| `timing.minSeconds` not met | error |
| Captions off outside `spoken` type | error |
| Three scenes in one palette, one transition everywhere, long all-caps | warn |

## Adding a custom scene

1. Write a component in `engine/scenes/custom/`. Use `useShot()`, `useRegion()`, `Headline`, `Backdrop`, and mark readable text with `data-qa="text"`. See `SignalRings.tsx`.
2. Register it in `engine/custom.ts`.
3. Use `{"type": "custom", "component": "signalRings", "props": {...}, "review": "why no system fits"}`.
4. Add a story to `engine/lab/stories.ts`, run `node studio/lab.mjs <story-id>` and look at the frames.

Promote a custom scene into a system once a second story wants it.

## The Lab: visual review

`npm run lab` opens Remotion Studio. The `Lab` folder holds tokens, type, motion at 30 and 60 fps, 35 scene settings, 13 transitions in context, and 4:5, 1:1 and 16:9 crop previews with the safe area drawn. It runs the same components, renderer and guard as production. Storybook was not added because a second runtime could only disagree with the real one.

`node studio/lab.mjs scenes|transitions|boards|aspect|<story-id>` writes sheets to `out/studio/lab/` and lists every layout problem.
