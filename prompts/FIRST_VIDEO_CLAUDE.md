# Claude Code task: produce the first GPS explainer

You are in this repository. Read `CLAUDE.md`, `docs/ARCHITECTURE_AUDIT.md`, `.claude/skills/editorial-pipeline/SKILL.md`, `studio/gps-offline.json`, `src/editorial/Design.tsx`, `src/editorial/GpsVideo.tsx`, and the “Editorial pipeline” section of `README.md`. Use this architecture and preserve existing user data, scripts and renders.

Produce a Russian 20–25 second, 1080×1920, 30 FPS editorial motion explainer: **«Почему GPS работает даже без интернета?»**. The current structured project has five scenes and the central message. Improve individual scenes or wording where a real visual or factual problem is found; do not replace it with a title slideshow. Keep one idea: the receiver calculates coordinates from satellite signals, while an online map is a separate data product. Show satellites broadcasting timestamped signals, travel time yielding pseudoranges, several range constraints intersecting, and the fourth signal correcting the receiver clock. A saved offline map can display/navigation within its saved area. Keep on-screen words sparse and use the `Frame`, `Satellite`, `Phone`, `Signal` and `Pill` primitives in `src/editorial/Design.tsx`. Keep the dark navy, mint, blue and restrained gold palette, large Cyrillic type, safe margins, eased motion and visually meaningful transitions. Change a specific scene without rebuilding the script or voice unless its narration changes.

Check the factual claims against the exact source URLs in `studio/gps-offline.json`: GPS.gov trilateration, ESA satellite navigation, and Google Maps Help offline maps. A URL responding is not itself a fact check. Correct the project and its source mapping if needed. Do not claim this evergreen demo is currently trending. Do not invent audience metrics. Review the short script for natural speech, causal order and a clear ending, and record real approval in the project only after review.

Run, in order:

```bash
npm ci
npx tsc --noEmit
python3 studio/pipeline.py validate studio/gps-offline.json
node studio/render.mjs preview
node studio/qa.mjs preview
```

Inspect `out/studio/qa-frames/frame-*.png` and the preview MP4. Fix visible collisions, unreadable labels, empty frames, rushed motion, broken Cyrillic or factual illustrations. The preview is intentionally silent and half resolution; do not present it as the finished video.

For the final voice, first check that `.env` has `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` (never print their values). **The voice command consumes ElevenLabs quota.** This task authorizes producing the first voiced video using the existing ElevenLabs account; if the key/voice ID or remaining quota is unavailable, state the exact missing setting and stop before production. Do not use OpenRouter, paid AI video APIs or unknown-rights stock media. Then run:

```bash
node studio/voice.mjs studio/gps-offline.json
python3 studio/pipeline.py validate studio/gps-offline.json
node studio/render.mjs production
node studio/qa.mjs production
```

`studio/voice.mjs` stores MP3 in `public/generated/` and uses ElevenLabs character alignment for word captions and scene timing. Listen to the voice and review boundaries. If alignment fails or the speech exceeds 30 seconds, shorten the copy and regenerate only after explaining that this repeats quota use. When the API has no reliable alignment, do not claim precise sync; make timing manually and label it as approximate. Keep voice dominant; add music or SFX only from files with documented rights, mixed quietly and faded cleanly. A silent production MP4 is invalid.

Check the measured QA report `out/studio/gps-offline-production-qa.json` and complete its manual review checklist. Verify 1080×1920 H.264, 30 FPS, under 30 seconds, audio present, readable subtitle timing, no label collisions or clipped safe areas, a sound cut and correct source claims. If a check fails, fix and rerun it. Deliver `out/studio/gps-offline.mp4`, the project JSON, sampled frames and QA report. Give a short honest report listing completed commands, voice timing, duration, any limits and the final path. Do not publish.
