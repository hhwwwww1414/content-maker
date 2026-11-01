---
name: editorial-pipeline
description: Produce a short cited editorial explainer with the free local Remotion pipeline.
---

1. Read `CLAUDE.md`, `docs/ARCHITECTURE_AUDIT.md`, `studio/gps-offline.json`, and `src/editorial/Design.tsx`.
2. Research source claims and edit the structured project. Record source URLs and mark review status only after actual review.
3. Run `python3 studio/pipeline.py validate studio/gps-offline.json` before voice or render.
4. Run `node studio/render.mjs preview` and inspect `out/studio/qa-frames` after `node studio/qa.mjs preview`.
5. With user-authorized ElevenLabs quota and configured environment, run `node studio/voice.mjs studio/gps-offline.json`. Otherwise report the missing voice and keep output clearly labeled preview.
6. Run production render and QA. Hand over the MP4 only if the production QA passes and manual review has been performed.
