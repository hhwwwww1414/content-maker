/**
 * PLANNING stage of a batch: writes research.json, sources.json, candidates.json,
 * selected-six.json, diversity-matrix.json and one immutable creative brief per
 * child job. The diversity gate is *computed* from declared axes, not asserted.
 */

import {AXES, CRITICAL_AXES, MAX_SHARED_AXES} from './axes.mjs';
import {log, setChildState, writeJsonAtomic} from './batch-lib.mjs';
import {historyTopics} from './history.mjs';

const tokenize = (s) => new Set(String(s).toLowerCase().split(/[^a-zа-я0-9]+/i).filter((w) => w.length > 3));

const jaccard = (a, b) => {
  const A = tokenize(a);
  const B = tokenize(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  return Number((shared / (A.size + B.size - shared)).toFixed(3));
};

const sharedAxes = (a, b) => AXES.filter((axis) => a.axes[axis] === b.axes[axis]);

export const writePlan = (batch) => {
  const {BATCH_ID, batchDir, REELS, BANNED_PHRASES, TERRITORIES, sources, research, candidates} = batch;
  const history = historyTopics();

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const selected = REELS.map((reel) => {
    const candidate = byId.get(reel.candidateId);
    if (!candidate) throw new Error(`Unknown candidate ${reel.candidateId}`);
    if (candidate.status !== 'selected') throw new Error(`${candidate.id} is not marked selected`);
    if (candidate.slot !== reel.index) throw new Error(`${candidate.id} slot mismatch`);
    return {reel, candidate};
  });

  const similarityWithHistory = (candidate) => {
    const probe = `${candidate.title} ${candidate.visualMetaphor} ${candidate.heroObject} ${candidate.axes?.factualTopic ?? ''}`;
    let worst = {topic: null, score: 0};
    for (const topic of history) {
      const score = jaccard(probe, topic);
      if (score > worst.score) worst = {topic, score};
    }
    return worst;
  };

  writeJsonAtomic(`${batchDir}/sources.json`, {
    batchId: BATCH_ID,
    retrievedAt: batch.RETRIEVED_AT,
    count: sources.length,
    primarySources: sources.filter((s) => s.primarySource).length,
    sources,
  });

  writeJsonAtomic(`${batchDir}/research.json`, {
    batchId: BATCH_ID,
    ...research,
    sourceIndex: sources.map((s) => ({id: s.id, publisher: s.publisher, publishedAt: s.publishedAt, primarySource: s.primarySource})),
  });

  const enriched = candidates.map((c) => ({
    ...c,
    similarityWithHistory: similarityWithHistory(c),
    pairwiseSimilarity: c.axes
      ? candidates.filter((o) => o.axes && o.id !== c.id).map((o) => ({id: o.id, sharedAxes: sharedAxes(c, o).length}))
      : [],
  }));

  writeJsonAtomic(`${batchDir}/candidates.json`, {
    batchId: BATCH_ID,
    generated: enriched.length,
    selected: enriched.filter((c) => c.status === 'selected').length,
    rejected: enriched.filter((c) => c.status === 'rejected').length,
    comparedAgainstHistoryEntries: history.length,
    candidates: enriched,
  });

  // --- pairwise diversity gate ---------------------------------------------
  const pairs = [];
  for (let i = 0; i < selected.length; i += 1) {
    for (let j = i + 1; j < selected.length; j += 1) {
      const a = selected[i].candidate;
      const b = selected[j].candidate;
      const shared = sharedAxes(a, b);
      const criticalCollisions = shared.filter((axis) => CRITICAL_AXES.includes(axis));
      pairs.push({
        a: `${selected[i].reel.index}-${selected[i].reel.slug}`,
        b: `${selected[j].reel.index}-${selected[j].reel.slug}`,
        sharedAxes: shared,
        sharedCount: shared.length,
        criticalCollisions,
        pass: shared.length <= MAX_SHARED_AXES && criticalCollisions.length === 0,
      });
    }
  }

  const failing = pairs.filter((p) => !p.pass);
  const matrix = {
    batchId: BATCH_ID,
    axes: AXES,
    criticalAxes: CRITICAL_AXES,
    maxSharedAxes: MAX_SHARED_AXES,
    comparisons: pairs.length,
    pairs,
    valid: failing.length === 0,
    failing,
  };
  writeJsonAtomic(`${batchDir}/diversity-matrix.json`, matrix);

  const expected = (selected.length * (selected.length - 1)) / 2;
  if (pairs.length !== expected) throw new Error(`Expected ${expected} pairwise comparisons, got ${pairs.length}`);
  if (!matrix.valid) {
    throw new Error(
      `Pairwise diversity gate failed: ${failing
        .map((f) => `${f.a}~${f.b} [${f.criticalCollisions.join(',') || `${f.sharedCount} axes`}]`)
        .join('; ')}`,
    );
  }

  writeJsonAtomic(`${batchDir}/selected-six.json`, {
    batchId: BATCH_ID,
    selected: selected.map(({reel, candidate}) => ({
      index: reel.index,
      slug: reel.slug,
      candidateId: candidate.id,
      compositionId: reel.compositionId,
      title: candidate.title,
      hook: candidate.hook,
      factualTopic: candidate.axes.factualTopic,
      territory: TERRITORIES[reel.index - 1],
      openingArchetype: candidate.openingArchetype,
      endingArchetype: candidate.endingArchetype,
      cameraGrammar: candidate.cameraGrammar,
      motionGrammar: candidate.motionGrammar,
      mascotUsage: candidate.mascotUsage,
      voiceProfile: reel.voiceProfile,
      sourceIds: candidate.sourceIds,
    })),
  });

  // --- immutable per-reel creative briefs ----------------------------------
  for (const {reel, candidate} of selected) {
    const others = selected.filter((s) => s.reel.index !== reel.index);
    writeJsonAtomic(`${reel.jobDir}/creative-brief.json`, {
      batchId: BATCH_ID,
      index: reel.index,
      slug: reel.slug,
      compositionId: reel.compositionId,
      immutable: {
        factualTopic: candidate.axes.factualTopic,
        factualBasis: candidate.factualBasis,
        sources: candidate.sourceIds.map((id) => sources.find((s) => s.id === id)),
        audiencePain: candidate.audiencePain,
        visualMetaphor: candidate.visualMetaphor,
        heroObject: candidate.heroObject,
        environment: candidate.environment,
        openingArchetype: candidate.openingArchetype,
        endingArchetype: candidate.endingArchetype,
        cameraGrammar: candidate.cameraGrammar,
        motionGrammar: candidate.motionGrammar,
        typographyGrammar: candidate.axes.typographyBehavior,
        mascotUsage: candidate.mascotUsage,
        voiceDirection: reel.voiceProfile,
        soundDirection: candidate.axes.soundDirection,
        emotionalTone: candidate.axes.emotionalTone,
      },
      mutableByChild: ['scene count', 'shot pacing', 'exact wording', 'component structure', 'colour accents inside the brand palette'],
      blacklist: {
        bannedPhrases: BANNED_PHRASES,
        otherReels: others.map((o) => ({
          index: o.reel.index,
          slug: o.reel.slug,
          heroObject: o.candidate.heroObject,
          visualMetaphor: o.candidate.visualMetaphor,
          openingArchetype: o.candidate.openingArchetype,
          endingArchetype: o.candidate.endingArchetype,
          cameraGrammar: o.candidate.cameraGrammar,
          motionGrammar: o.candidate.motionGrammar,
          hook: o.candidate.hook,
        })),
      },
      audienceHooks: {
        hook: candidate.hook,
        informationGap: candidate.informationGap,
        shareReason: candidate.shareReason,
        saveReason: candidate.saveReason,
        commentTrigger: candidate.commentTrigger,
      },
    });
    writeJsonAtomic(`${reel.jobDir}/novelty-report.json`, {
      reel: `${reel.index}-${reel.slug}`,
      comparedAgainstHistory: history.length,
      comparedAgainstBatchSiblings: others.map((o) => o.reel.slug),
      worstHistoryMatch: similarityWithHistory(candidate),
      worstSiblingSharedAxes: Math.max(...others.map((o) => sharedAxes(candidate, o.candidate).length)),
      criticalCollisions: [],
      valid: true,
    });
    setChildState(reel.jobDir, 'IDEA_SELECTED', {index: reel.index, slug: reel.slug, compositionId: reel.compositionId});
  }

  log(
    `planning artifacts written: ${candidates.length} candidates, ${selected.length} selected, ` +
      `${pairs.length} pairwise comparisons, diversity valid (vs ${history.length} history entries)`,
  );
  return matrix;
};
