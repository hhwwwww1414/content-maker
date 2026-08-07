# GhostPepe Whitelist Reel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete and render the isolated `GhostPepeWhitelistReel` composition as `out/ghostpepe-whitelist-reel.mp4` while preserving the full script and natural Silero delivery.

**Architecture:** Reuse the focused whitelist components already present, audit them against the approved continuous-checkpoint design, and derive scene choreography from the measured Silero timeline. Integrate through one new composition registration and dedicated npm scripts without changing existing reel behavior.

**Tech Stack:** Remotion 4, React 19, TypeScript, Silero TTS `v5_5_ru` / `eugene`, faster-whisper captions, H.264/AAC.

---

### Task 1: Audit generated media and whitelist source

**Files:**
- Inspect: `content/whitelist-reel.json`
- Inspect: `public/generated/voiceover-whitelist.wav`
- Inspect: `public/generated/voiceover-whitelist-metadata.json`
- Inspect: `src/generated/timeline-whitelist.json`
- Inspect: `src/generated/captions-whitelist.json`
- Inspect: `src/components/CyberCheckpoint.tsx`
- Inspect: `src/compositions/GhostPepeWhitelistReel.tsx`

- [ ] Verify UTF-8 Russian strings with `rg -n "Интернет|ПЕТЕРБУРГ|ПРОВЕРКА СПИСКА|ДОПУСК|НЕ В СПИСКЕ" src content`.
- [ ] Verify metadata reports Silero `v5_5_ru`, speaker `eugene`, 1080×1920, 30 FPS, all ten required segments, and a 1000 ms final hold.
- [ ] Run `npm run typecheck`; expected result: exit code 0.
- [ ] Record the accepted duration exception: measured reel length may exceed 16 seconds because the full text and natural voice take priority.

### Task 2: Add measurable integration checks

**Files:**
- Create: `scripts/verify-whitelist.mjs`

- [ ] Implement a Node verifier that loads `content/whitelist-reel.json`, `src/generated/timeline-whitelist.json`, `src/generated/captions-whitelist.json`, and metadata; asserts the composition dimensions, FPS, provider, voice, speaker, required segment IDs, final hold, non-empty captions, exact branding allowlist, forbidden-brand absence, and required source/component files.
- [ ] Run `node scripts/verify-whitelist.mjs` before integration; expected result: fail because the composition is not registered and dedicated npm scripts are absent.
- [ ] Keep the verifier read-only: it must never rewrite generated media or existing reels.

### Task 3: Complete Remotion integration

**Files:**
- Modify: `src/Root.tsx`
- Modify: `package.json`

- [ ] Import `GhostPepeWhitelistReel` and `timeline-whitelist.json` in `src/Root.tsx`.
- [ ] Register `GhostPepeWhitelistReel` with `durationInFrames`, FPS, width, and height from the measured timeline.
- [ ] Add `voice:generate:whitelist` invoking `scripts/generate_voice.py` with the whitelist content, timeline, audio, metadata, and captions paths.
- [ ] Add `render:whitelist` rendering `GhostPepeWhitelistReel` to `out/ghostpepe-whitelist-reel.mp4` with H.264, AAC, CRF 20, and concurrency 2.
- [ ] Run `node scripts/verify-whitelist.mjs`; expected result: pass.
- [ ] Run `npm run typecheck`; expected result: exit code 0.

### Task 4: Audit and repair visual choreography

**Files:**
- Modify if needed: `src/components/CyberCheckpoint.tsx`
- Modify if needed: `src/components/DomainToken.tsx`
- Modify if needed: `src/components/ScannerGate.tsx`
- Modify if needed: `src/components/DigitalTurnstile.tsx`
- Modify if needed: `src/components/AccessDisplay.tsx`
- Modify if needed: `src/components/WhitelistHall.tsx`
- Modify if needed: `src/components/NewsLabel.tsx`
- Modify if needed: `src/scenes/WhitelistCtaScene.tsx`
- Modify if needed: `src/compositions/GhostPepeWhitelistReel.tsx`

- [ ] Confirm all important overlay bounds remain within x=110–820 and y=270–1450, and captions retain the project’s stable safe container.
- [ ] Confirm the hook is fully visible by frame 8 and contains the exact required copy and news label.
- [ ] Confirm the scanner beam, access/denial states, turnstile rotation, queue motion, rejected-token follow, closed glass door, dissolve, mascot, and CTA are all interpolated over multiple frames.
- [ ] Remove any one-frame disappearance by replacing frame booleans with opacity or state-transition interpolation where visible.
- [ ] Confirm only `ghostpepe-main.png` and `cyberspace-dark.png` are used for the CTA and no forbidden legacy visual components are imported.
- [ ] Run `npm run lint`; expected result: exit code 0.

### Task 5: Regenerate final voice, captions, and timeline

**Files:**
- Regenerate: `public/generated/voiceover-whitelist.wav`
- Regenerate: `public/generated/voiceover-whitelist-metadata.json`
- Regenerate: `src/generated/timeline-whitelist.json`
- Regenerate: `src/generated/captions-whitelist.json`

- [ ] Run `npm run voice:generate:whitelist`; expected result: Silero generation succeeds and prints the measured voice/reel duration.
- [ ] Run `node scripts/verify-whitelist.mjs`; expected result: pass with all ten segment IDs and non-empty captions.
- [ ] Run `npm run typecheck`; expected result: exit code 0 after regenerated JSON is consumed by Remotion.

### Task 6: Render and inspect key frames outside `out`

**Files:**
- Temporary only: a validated directory under the system temp folder

- [ ] Create a dedicated temporary directory and resolve its absolute path before rendering stills.
- [ ] Render frames 8, 110, 210, 320, and 430 from `GhostPepeWhitelistReel` into that directory.
- [ ] Inspect each still for readable text, correct Russian encoding, safe-zone placement, logical checkpoint continuity, local-only red accents, mascot placement, and absence of clipping.
- [ ] Apply narrowly scoped markup fixes if inspection finds a defect, then rerun `npm run lint` and only the affected stills.
- [ ] Remove the validated temporary directory after inspection.

### Task 7: Render and validate the deliverable

**Files:**
- Create: `out/ghostpepe-whitelist-reel.mp4`

- [ ] Ensure no whitelist preview PNG, SRT, JSON report, test voice, or temporary file is present in `out`.
- [ ] Run `npm run render:whitelist`; expected result: successful H.264/AAC render at 1080×1920 and 30 FPS.
- [ ] Use `ffprobe` to assert width 1080, height 1920, frame rate 30/1, an audio stream, duration consistent with metadata, and non-zero file size.
- [ ] Run `npm run lint` and `node scripts/verify-whitelist.mjs` once more; expected result: both pass.
- [ ] Confirm `out/ghostpepe-whitelist-reel.mp4` exists and is the only task-specific artifact in `out`.

No Git commit or branch creation is part of this plan, per the user’s explicit instruction.
