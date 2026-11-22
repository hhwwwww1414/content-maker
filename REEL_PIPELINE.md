# GhostPepeBot Reel Pipeline

Правила подачи (длительность, хук, плотность текста на экране, запреты в
сценарии) — в [docs/REEL_CRAFT.md](docs/REEL_CRAFT.md). Здесь описан порядок
шагов, там — стандарт, которому обязан соответствовать результат.

New reels must move through the pipeline before TSX implementation:

`idea -> history / novelty analysis -> creative direction -> storyboard -> layout plan -> asset strategy -> motion plan -> implementation -> collision QA -> keyframe QA -> motion QA -> final render`

Required gates:

- `NoveltyAnalyzer` compares the concept with `src/reel-system/history/reel-history.json` and rejects any direction matching a previous reel in 3 or more critical categories.
- Duration is content-defined: script segments are synthesized first, then real segment durations, real pauses, captions, scene timing and `durationInFrames` are derived from the generated audio timeline.
- Storyboard shots must pass `validateStoryboard`; every transition needs a semantic `transitionReason`.
- Hero objects must declare an asset strategy and support `silhouetteMode`.
- Critical layout elements must be registered and checked against Instagram overlays and collision rules.
- All geometry comes from a single source of truth: `src/reel-system/layout/safe-area.ts` (+ `safe-area.config.json`). Never hardcode top/bottom/right insets — import `SAFE` / `IG_UNSAFE` / `CANVAS` or use the `<SafeArea>` / `<CaptionSafeArea>` primitives.
- The safe-zone gate (`npm run qa:reels`) is mandatory before any final render. It renders control frames per reel and fails if opaque/high-contrast content invades an Instagram unsafe zone (annotated `out/qa/*-VIOLATION.png`). `build:reel` blocks the render on it. Preview the zones with `npm run qa:reels:overlay` or `REEL_OVERLAY=1`.
- Motion must use Remotion frame-driven primitives, not CSS animation or transition shortcuts.
- Captions are phrase-level for ordinary reels: one caption page should map to one natural TTS segment, with no word-by-word karaoke.
- Final render is blocked unless all quality gate booleans are true.

`GhostPepeStoryboardPreview` is an internal composition for static storyboard contact sheets. It does not create a new reel.
