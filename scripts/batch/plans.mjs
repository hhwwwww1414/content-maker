/**
 * Per-reel creative direction, storyboard, layout plan, asset strategy and motion
 * plan. Shot boundaries are expressed as voice-segment ranges and resolved to
 * frames from the *generated* timeline, so the storyboard can never disagree with
 * the audio it was cut against.
 */

import {existsSync} from 'node:fs';
import {abs, log, readJson, setChildState, writeJsonAtomic} from './batch-lib.mjs';

export const writePlans = (batch) => {
  const {batchDir, REELS, PLANS} = batch;
  for (const reel of REELS) {
    const plan = PLANS[reel.slug];
    if (!plan) throw new Error(`No plan for ${reel.slug}`);
    if (!existsSync(abs(reel.timelineFile))) throw new Error(`Timeline missing for ${reel.slug}; run voice first`);
    const timeline = readJson(reel.timelineFile);
    const toFrame = (ms) => Math.round((ms / 1000) * timeline.fps);
    const seg = (id) => {
      const s = timeline.segments.find((x) => x.id === id);
      if (!s) throw new Error(`${reel.slug}: unknown segment ${id}`);
      return s;
    };

    const shots = plan.shots.map(([id, from, to, spec], i, all) => {
      const start = toFrame(seg(from).startMs);
      const isLast = i === all.length - 1;
      const end = isLast ? timeline.durationInFrames : toFrame(seg(all[i + 1][1]).startMs);
      return {
        id,
        start,
        end,
        fromSegment: from,
        toSegment: to,
        purpose: spec.purpose,
        hero: spec.hero,
        supportElements: spec.support,
        camera: spec.camera,
        framing: spec.framing,
        composition: spec.composition,
        text: spec.text,
        visualChange: spec.visualChange,
        transitionIn: spec.transitionIn,
        transitionOut: spec.transitionOut,
        transitionReason: spec.transitionReason,
        background: plan.direction.backgroundTreatment,
        depthLayers: ['background', 'environment', 'hero', 'text', 'captions'],
        assetType: spec.hero.assetType,
      };
    });

    const errors = [];
    shots.forEach((shot, i) => {
      if (shot.end <= shot.start) errors.push(`${shot.id}: end <= start`);
      if (i > 0 && shot.start < shots[i - 1].end) errors.push(`${shot.id}: overlaps previous shot`);
      if (shot.supportElements.length > 2) errors.push(`${shot.id}: more than two support elements`);
      if (shot.text.length > 1) errors.push(`${shot.id}: more than one primary message`);
      if (!shot.transitionReason.trim()) errors.push(`${shot.id}: missing transitionReason`);
    });
    if (errors.length) throw new Error(`Storyboard invalid for ${reel.slug}:\n  - ${errors.join('\n  - ')}`);

    writeJsonAtomic(`${reel.jobDir}/creative-direction.json`, {reel: reel.slug, ...plan.direction});
    writeJsonAtomic(`${reel.jobDir}/storyboard.json`, {
      id: reel.key,
      fps: timeline.fps,
      width: 1080,
      height: 1920,
      durationInFrames: timeline.durationInFrames,
      shots,
      valid: true,
    });
    writeJsonAtomic(`${reel.jobDir}/layout-plan.json`, {reel: reel.slug, ...plan.layout});
    writeJsonAtomic(`${reel.jobDir}/asset-strategy.json`, {reel: reel.slug, ...plan.assets});
    writeJsonAtomic(`${reel.jobDir}/motion-plan.json`, {reel: reel.slug, ...plan.motion});
    setChildState(reel.jobDir, 'STORYBOARD_READY', {shots: shots.length, durationInFrames: timeline.durationInFrames});
  }
  writeJsonAtomic(`${batchDir}/plans-written.json`, {at: new Date().toISOString(), reels: REELS.map((r) => r.slug)});
  log(`plans written for ${REELS.length} reels`);
};

