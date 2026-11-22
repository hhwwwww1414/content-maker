# Creating a video: guide for a coding agent

You get a topic. You produce a checked MP4 and hand it to a person. You never publish. This guide is enough to do that without reading the rest of the repository.

Read the rules in `CLAUDE.md` first. The non-negotiable ones are at the end of this page.

## Setup check

```bash
node --no-warnings --test --test-concurrency=1 'studio/tests/*.test.mjs'   # about 1 minute
npx tsc --noEmit
node studio/assets.mjs check
```

## The cycle

| Step | Do | Command | Stops with |
|---|---|---|---|
| 1 | Create the project | `node studio/reel.mjs new my-reel --topic "..." --art editorial` | |
| 2 | Research official sources. Record each read source and its claim in `sources`; anything unconfirmed goes in `editorialReview.openClaims` | | |
| 3 | Write 4–6 scenes in `voice`, about 430 characters in total | | |
| 4 | Show the script and open claims to the user. Record **their** decision | `node studio/reel.mjs approve my-reel --script --facts --by "Name"` | Exit 3 without it |
| 5 | Direct each scene: write `direction` (below) | `node studio/spec-check.mjs my-reel` | Exit 2 if invalid |
| 6 | Get a voice. Buying needs the user's request | Reuse: `node studio/import-voice.mjs my-reel --from <slug>`. Buy: `node studio/reel.mjs run my-reel --voice` | Exit 4 without one |
| 7 | Look at real frames, before rendering a video | `node studio/reel.mjs sheet my-reel` | Lists layout problems |
| 8 | Render a draft and run all gates | `node studio/reel.mjs run my-reel --preview-only` | Exit 5 on failure |
| 9 | Read `out/studio/my-reel-sheet.jpg` and `out/studio/my-reel-preview-gates.md`. Fix, repeat | `node studio/reel.mjs sheet my-reel --scene=<id>` for one scene | |
| 10 | Final render at 1080×1920 with gates and Whisper | `node studio/reel.mjs run my-reel` | Exit 5 on failure |
| 11 | Inspect transitions and the phone view | `node studio/reel.mjs sheet my-reel --mobile` | |
| 12 | Freeze the reviewed frames | `node studio/visual-test.mjs my-reel --update` | |
| 13 | Hand over the MP4, sheets, gate report and open claims, and say what a person must still review | | |

A preview costs about one minute and a final about four, gates included. Voice costs nothing once a take exists, because a take is cached by text, voice and settings.

The voice sets the timeline. `start`, `duration`, `durationSeconds` and `captions` are written by the voice tools. Do not write them.

## Directing: how to think

For each scene, answer before choosing a component:

1. What does the sentence mean, not what does it mention?
2. What should the viewer feel? (`emotion`)
3. What can the picture say that the words do not? (`concept`) If you only have an illustration of a noun, keep thinking.
4. What is seen first? (`hierarchy.primary`)
5. What changes, and on which spoken word? (cues)

Then the reel as a whole:

- **One art direction** that fits the story (`docs/VIDEO_DESIGN_SYSTEM.md`). Check it differs from the previous reel.
- **A palette rhythm.** Alternate `base`, `inverse`, `block`. Put `block` on the turn or climax.
- **Different compositions.** See the table of beats in `docs/SCENE_ARCHITECTURE.md`.
- **A reason for each transition**, in `intent`. Hard cut where the word itself is the turn.
- **The first frame is the thumbnail.** Use a strong plate, or a device.

## A complete minimal project

`art.direction` at project level, `direction` on each scene. Save as `studio/projects/my-reel.json` (after `reel.mjs new`, edit it).

```json
{
  "id": "my-reel", "topic": "Самозапрет на кредиты", "niche": "finance", "language": "ru",
  "status": {"factCheck": "pending", "scriptApproval": "pending", "publication": "draft", "production": "draft"},
  "sources": [{"id": "cbr", "publisher": "Банк России", "url": "https://...", "accessed": "2026-11-01", "claim": "..."}],
  "title": "...", "hook": "...", "centralIdea": "...",
  "art": {"direction": "editorial", "music": {"asset": "bed-warm", "volume": 0.11, "duck": 0.55}},
  "theme": "signal", "captionStyle": "plate", "fps": 30, "width": 1080, "height": 1920, "durationSeconds": 30,
  "audio": {"voicePath": null, "musicPath": null, "sfx": [], "volume": 1},
  "captions": [],
  "scenes": [
    {
      "id": "hook",
      "voice": "Кредит на тебя может взять чужой.",
      "onScreen": "Кредит может взять чужой",
      "thought": "Опасность звучит как чужая рука в твоём деле",
      "animation": "Документ падает на стол, строка выделяется на слове",
      "sources": ["cbr"],
      "direction": {
        "purpose": "opening", "emotion": "тревога", "concept": "Настоящий договор, в котором твоё имя и чужая подпись",
        "hierarchy": {"primary": "договор"},
        "shot": {"type": "collage", "pieces": [
          {"kind": "document", "box": [100, 280, 830, 900], "rotate": -1.5, "cue": 0, "text": "Договор займа", "lines": ["Заёмщик: ты", "Подпись: не твоя"], "markLine": 1, "markCue": "чужой"}
        ]},
        "camera": {"move": "pushIn"}
      }
    }
  ]
}
```

Real reels to copy from: `studio/projects/sample-safe-account.json`, `sample-drug-market.json`, `sample-droppers.json`, `sample-flat-seller.json`. They cover 9 systems across 4 art directions and use real takes.

Full field reference: `docs/SCENE_ARCHITECTURE.md`. Machine-readable contract for a planner: `docs/storyboard.schema.json` (`node studio/reel.mjs schema` regenerates it). Every setting of every system, as ready JSON: `src/editorial/engine/lab/stories.ts`.

## Assets

```bash
node studio/assets.mjs list
node studio/assets.mjs search nasa "night city"
node studio/assets.mjs add my-photo --provider commons --ref "File:Name.jpg"
```

Look at the picture before using it. A Commons or NASA search result can be off topic or soft, and burnt-in captions on video need cropping. Add the credit line from `node studio/assets.mjs credits my-reel` to the post. A missing asset fails validation by design: report it, do not draw a stand-in.

## When something fails

`docs/VIDEO_QUALITY_CHECKLIST.md` lists each failure and its usual fix. Never relax a limit or a check to get a pass; if a fix needs different words, stop and tell the user, because the words were approved.

## Commands

```bash
node studio/reel.mjs new|status|approve|run|sheet|gates|scene|storyboard|schema
node studio/spec-check.mjs <project> [--json]
node studio/sheet.mjs <project> [--per=3] [--scene=id] [--mobile] [--scale=0.4]
node studio/gates.mjs <project> [--mode=preview|production] [--step=0.5]
node studio/render.mjs <project> preview|production [--frames=a-b] [--out=path] [--fps=60] [--concurrency=4]
node studio/qa.mjs <project> [preview|production]
node studio/visual-test.mjs <project> [--update]
node studio/assets.mjs list|check|add|search|credits
node studio/lab.mjs scenes|transitions|boards|aspect|<story-id>
node studio/bench.mjs <project> [--from=sceneId] [--seconds=3]
npm run lab    # Remotion Studio with the Lab folder
```

Exit codes of `reel.mjs run`: 2 script invalid, 3 needs approval, 4 needs voice, 5 render or a gate failed.

## Non-negotiable rules

- Never publish. `publishReady` stays false until a person approves and reviews.
- Only `--voice` or `studio/voice.mjs` spends ElevenLabs quota, and only when the user asked for a voiced render. No other paid API. Never call OpenRouter.
- Do not mark facts reviewed or a script approved on your own judgement.
- Cite claims from sources you actually read, in `sources` and the post text. Never show sources on screen.
- `content/` and the older production paths are preserved.
- Passing gates does not mean the video is good. Look at it.

## Measured: cost and encoding

Measured on this machine (10 CPU cores, 16 GB) with `studio/bench.mjs` on 3 seconds of `sample-droppers`, including the bundling step of about 5 seconds per run. Results are in `out/studio/bench/`.

| Setting | Time for 3 s | Bitrate |
|---|---|---|
| CRF 14, slow | 12.9 s | 29.8 Mb/s |
| **CRF 18, slow (production)** | **11.4 s** | **12.1 Mb/s** |
| CRF 20, slow | 10.2 s | 5.8 Mb/s |
| CRF 23, slow | 8.1 s | 1.7 Mb/s |
| CRF 18, veryfast (preview-style) | 7.1 s | 12.7 Mb/s |
| Concurrency 2 / 4 / 8 | 11.9 / 11.4 / 12.2 s | same |
| 60 fps, CRF 18 | 16.4 s for twice the frames | 8.5 Mb/s |

Whole reels: a 31–33 s reel takes 4–5.5 minutes end to end (preview, QA, gates, final, QA, Whisper, gates).

What this does and does not show:

- **Concurrency above 2 gained nothing here**, so the default of 6 is not a speed-up. The cost is elsewhere, probably GL and encoding. This was not profiled further.
- **60 fps costs less than twice**, but stays optional. Instagram and TikTok serve about 30 fps in most cases, and no visual benefit has been judged by a person. Default: 30 fps.
- **SSIM could not rank the CRF values.** All landed at 0.975–0.982, and CRF 23 scored above CRF 20, because film grain dominates the metric. CRF 18 is kept as a safe choice, not as a proven optimum. Judge banding and small type by eye.

## Limitations

- **The sound library is synthesised.** It measures fine, but no person has judged it. Listen first, or add licensed music through `assets.mjs`.
- **Human review is not automated.** Gates catch emptiness, collisions, unreadable text and timing errors. They say nothing about beauty.
- **Motion blur** is directional on `push` and scalar on `through` and `depth`. There is no sub-frame blur on moving objects.
- **3D objects are procedural.** There is no glTF loader. A real product or a character needs a custom scene or a licensed image.
- **Character-level text in 3D** is not supported: labels are tracked DOM elements.
- **9:16 only.** Other ratios are crop previews, not reflowed layouts.
- **Whisper similarity** is below 1.0 on numerals and names, which transcription writes differently. The drift numbers are what is enforced.
- **Sample facts** were inherited from the older reels and not re-verified. Samples stay in `demo` status.
- **Illustrative phone screens** invent their text. Do not imitate a real brand's interface.
