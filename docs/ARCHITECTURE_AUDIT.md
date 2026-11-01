# Architecture audit — 2026-10-20

## Current system

The repository is an established TypeScript/React/Remotion project. `src/Root.tsx` registers many bespoke compositions. `content/*-reel.json`, `src/generated/timeline-*.json`, `scripts/eleven/*`, and `scripts/conveyor/*` contain script, timing, ElevenLabs and batch production logic. Existing QA probes rendered MP4s and checks frames. There are Remotion skills replicated under `.claude/skills`, `.codex/skills`, and `.agents/skills`; no project-owned MCP server was found. Existing outputs and source assets are present.

## Observed gaps for this brief

- `scripts/conveyor/ideas.mjs` and `script.mjs` call OpenRouter models. Their use may incur extra billing. URL reachability is treated as source verification, but does not establish the factual claim.
- `scripts/conveyor/script.mjs` targets 5–7 chapters with 3–8 lines each, and the existing reel QA defaults to 30–60 seconds. That path does not implement the requested 15–25 second format.
- Existing content and motion work is substantial but tied to individual compositions or the GhostPepe grammar. There is no small, separate project format for a science explainer with cited claims, approvals, per-scene timing and independent scene replacement.
- Existing output QA is useful, but is coupled to the previous reel format and cannot alone verify semantics or visual taste.

These are scoped findings, not a claim that all existing videos are weak. No existing user files are removed.

## Retain and improve

Retain Remotion, installed dependencies, existing compositions, ElevenLabs integration, fonts/assets where suitable, existing QA and generated videos. Add an isolated `studio/` production path and `src/editorial/` composition. A second video format avoids rewriting historical content or risking its render commands. Reuse the installed Remotion and FFmpeg binaries; no paid service is added.

## Target flow

RSS/official feeds → local SQLite source and idea records → explainable limited-data score → editor-reviewed structured project → reusable Remotion scene primitives → optional ElevenLabs speech with timing → preview/production render → automated MP4/scene checks and manual review checklist. The human selects a niche and approves the script. Automated scheduling may refresh free feeds and draft ranked candidates but never publishes. Status, source URLs and outputs remain local.

## Migration and risks

The existing pipeline remains callable through its existing npm scripts. New files do not mutate its content. Promote a reel to the new schema manually, preserving source JSON. `studio/pipeline.py` creates a separate SQLite database under `runs/studio/`; it does not migrate old data. Voice calls consume ElevenLabs quota only with the explicit `voice` command. Feed popularity is unknown, so scores use a clearly labeled limited-evidence proxy. Audio-derived word timing is only used if the API returns it; otherwise caption timing is approximate. Automated visual checks cannot certify aesthetics or factual accuracy; both require review before publication.

## Update 2026-11-01

The factory replaced the GPS-only wiring: any project JSON renders through the `EditorialReel` composition, and limits live in `config/reel.standards.json`. See [REEL_FACTORY.md](REEL_FACTORY.md). The statements above about 15–25 second formats describe the system as audited on 2026-10-20.
