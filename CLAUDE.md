# Content Maker editorial workflow

Use `studio/` and `src/editorial/` for explanatory reels of about 30 seconds (limits in `config/reel.standards.json`). Existing `content/`, `scripts/conveyor/` and `src/Root.tsx` are legacy production paths; preserve them and user data.

Budget: no new paid APIs. `studio/voice.mjs` is the only new command that spends ElevenLabs quota; run it only when a voiced final render is requested and the key is configured. Never call OpenRouter from this workflow. Never publish automatically.

Roles in one pass: Researcher gathers official sources; Trend Analyst labels limited-data scores; Scriptwriter writes one central idea; Fact Checker checks claims; Art Director selects a visual metaphor; Motion Designer animates it; Audio Engineer aligns speech; Video QA measures the file and watches it. Separate AI calls are unnecessary.

New reels use the directed engine in `src/editorial/engine/`: start at `docs/AI_VIDEO_CREATION_GUIDE.md`. Older kit projects and commands are in `docs/REEL_FACTORY.md`; the skill `editorial-pipeline` runs the full cycle. Run `python3 studio/pipeline.py validate <project.json>` before any render. Production must have a real voice file, measured metadata, QA report and passing `studio/gates.mjs`, and a person must watch it. The only exception is a reel its author decided has no voice: `audio.mode: "music"` with a track in `audio.musicPath`, whose words `studio/qa.mjs` measures against the beat. Cite claims in the project's `sources`, but never put sources on screen: no "Источник: …" line, badge or credit in any frame (the renderer no longer draws one). Distinguish satellite positioning from online map loading. Update only the relevant scene component or JSON scene when revising a single beat.
