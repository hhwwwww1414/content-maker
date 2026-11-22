---
name: editorial-pipeline
description: Produce a Russian 30-second explainer Reel from one prompt (topic, idea or script) with the free local Remotion pipeline. Use for any request to make a reel, short or vertical explainer video in this repo.
---

Read `AGENTS.md` and `docs/REEL_FACTORY.md`. All limits are in `config/reel.standards.json`. Do the whole cycle yourself and stop only at the gates below.

1. **Project.** `node studio/reel.mjs new <id> --topic "..."`. One central idea.
2. **Research.** Read official sources. Record each in `sources` with the claim it supports. Record only what you actually read; list anything unconfirmed in `editorialReview.openClaims`. Sources stay in the JSON and the post text; never show them in the video.
3. **Script.** About 430 characters, 4–6 scenes, 25–35 s. Whole spoken sentences in `voice`; screen text is different and shorter.
4. **Gate: approval.** Show the script and open claims, then ask the user. Record their answer with `reel.mjs approve`. Never mark approval or review on your own judgement.
5. **Art direction.** Follow `docs/AI_VIDEO_CREATION_GUIDE.md`. For each scene ask what the sentence means, then write its `direction`: emotion, concept, the one primary element, a scene system from `docs/SCENE_ARCHITECTURE.md`, cues on spoken words, and a transition with an intent. Pick an art direction that fits the topic and differs from the previous reel. Run `node studio/spec-check.mjs <id>`. If no system fits, register a custom scene; do not force a template. Older `visual` layers still render but are not extended.
6. **Gate: voice.** A voiced render spends ElevenLabs quota only when the user asked for it. `reel.mjs run <id> --voice` buys one take for an approved script. Otherwise reuse a take: `studio/import-voice.mjs` or the cache.
7. **Build.** `node studio/reel.mjs run <id> --preview-only`.
8. **Look.** Run `node studio/reel.mjs sheet <id>` and read `out/studio/<id>-sheet.jpg` yourself, then `<id>-preview-gates.md`. Machine checks do not see composition: look for empty stages, small text, and elements that say nothing.
9. **Fix.** LayoutGuard and the gates report name the scene, frame and text; `*-qa.json` names the failed check. Fix the scene's JSON or component and re-run. Never loosen a limit or a check to get a pass; stop and report if a fix needs a script change.
10. **Finish.** `node studio/reel.mjs run <id>`, then `node studio/visual-test.mjs <id> --update` once the frames are reviewed.
11. **Hand over** the MP4, storyboard, QA report and open claims. Say what a person still has to review. Never publish.
