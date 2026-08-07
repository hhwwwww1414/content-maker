# GhostPepe Last Percent Reel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and render `GhostPepeLastPercentReel` as an isolated continuous-camera Remotion composition with Silero narration and synchronized captions.

**Architecture:** A scene controller derives animation beats from the measured audio timeline and drives seven focused DOM/SVG components through interpolated progress values. The composition reuses only project theme, captions, official mascot/background, ambient/SFX, and font infrastructure.

**Tech Stack:** Remotion 4, React 19, TypeScript, SVG/CSS, Silero `v5_5_ru` / `eugene`, faster-whisper captions, H.264/AAC.

---

### Task 1: Add a failing integration verifier

**Files:**
- Create: `scripts/verify-last-percent.mjs`

- [ ] Assert the required content file, ten semantic audio segments, Silero provider/voice/speaker, 1080×1920, 30 FPS, 1000 ms final hold, seven component files, official assets, safe branding, composition registration, dedicated npm commands, non-empty captions, and non-empty audio.
- [ ] Run `node scripts/verify-last-percent.mjs`; expected result: fail because the new content and composition do not exist.

### Task 2: Create and generate the final narration

**Files:**
- Create: `content/last-percent-reel.json`
- Generate: `public/generated/voiceover-last-percent.wav`
- Generate: `public/generated/voiceover-last-percent-metadata.json`
- Generate: `src/generated/timeline-last-percent.json`
- Generate: `src/generated/captions-last-percent.json`
- Modify: `package.json`

- [ ] Define ten separate TTS segments: two per scene, including `spokenText` for both GhostPepeBot phrases, the specified 140–220 ms pauses, `trimEdgeSilence: true`, and `finalHoldMs: 1000`.
- [ ] Add `voice:generate:last-percent` using the existing `generate_voice.py` pipeline.
- [ ] Run `npm run voice:generate:last-percent`; expected result: Silero generation succeeds and prints measured voice/reel duration.
- [ ] Verify generated metadata matches `v5_5_ru`, `eugene`, and the measured timeline.

### Task 3: Implement focused visual components

**Files:**
- Create: `src/components/FrozenProgressRing.tsx`
- Create: `src/components/DataSpiral.tsx`
- Create: `src/components/DataFragment.tsx`
- Create: `src/components/MissingDataSlot.tsx`
- Create: `src/components/ScanningWave.tsx`
- Create: `src/components/FrozenParticleField.tsx`
- Create: `src/components/CompletionPulse.tsx`

- [ ] Implement deterministic particles using `random()` with fixed seeds and frame-derived freeze/resume progress.
- [ ] Implement the 99→100 ring with SVG strokes, one unfilled sector, smooth numeric crossfade, and a reusable CTA ring state.
- [ ] Implement a crystal-glass spiral with filled packet cells and depth parallax.
- [ ] Implement the missing slot and lost fragment with interpolated position, glow, noise, and installation progress.
- [ ] Implement the mascot scanning wave and completion pulse as expanding SVG/radial waves without CSS animations.
- [ ] Run targeted ESLint and TypeScript; expected result: exit code 0.

### Task 4: Build the continuous composition

**Files:**
- Create: `src/compositions/lastPercentSceneFrames.ts`
- Create: `src/compositions/GhostPepeLastPercentReel.tsx`

- [ ] Derive scene beats from the ten measured segment starts and ends.
- [ ] Build a single world with a virtual camera that approaches the ring, enters the spiral, focuses on the missing slot, reveals the mascot through particle assembly, follows the fragment, resumes the system, and resolves into the CTA.
- [ ] Add exact scene text and new CTA inside x=110–820 and y=270–1450.
- [ ] Render captions from `captions-last-percent.json` with a two-frame safe offset and omit CTA caption duplication.
- [ ] Add existing ambient/click/connect/whoosh SFX at low volume and the new voiceover at full volume.
- [ ] Run targeted ESLint and TypeScript; expected result: exit code 0.

### Task 5: Register and verify integration

**Files:**
- Modify: `src/Root.tsx`
- Modify: `package.json`

- [ ] Register `GhostPepeLastPercentReel` using duration, FPS, width, and height from `timeline-last-percent.json`.
- [ ] Add `render:last-percent` targeting `out/ghostpepe-last-percent-reel.mp4` with H.264, AAC, CRF 20, and concurrency 2.
- [ ] Run `node scripts/verify-last-percent.mjs`; expected result: pass.
- [ ] Run `npm run typecheck`; expected result: exit code 0.

### Task 6: Inspect key frames outside `out`

**Files:**
- Temporary: system temp directory only

- [ ] Render representative frames for hook, empty slot, mascot scan, fragment travel, 100% completion, and stable CTA.
- [ ] Inspect UTF-8, safe zones, visual continuity, mascot placement, red-noise removal, subtitle placement, and absence of forbidden legacy elements.
- [ ] Apply only narrowly scoped visual corrections and rerun targeted ESLint/TypeScript.

### Task 7: Render and validate the MP4

**Files:**
- Create: `out/ghostpepe-last-percent-reel.mp4`

- [ ] Run `npm run render:last-percent`; expected result: all frames encode successfully.
- [ ] Validate the file with Mediabunny and Remotion’s bundled ffprobe: 1080×1920, 30 FPS, H.264 video, AAC audio, non-zero size, and duration matching metadata.
- [ ] Confirm no additional last-percent PNG, SRT, report, test voice, or JSON file exists in `out`.
- [ ] Run targeted ESLint, TypeScript, and `node scripts/verify-last-percent.mjs` once more.

No Git commit or branch creation is part of this plan, per the user’s established instruction.
