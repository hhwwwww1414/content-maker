/** Diversity axes and reel-path conventions shared by every batch. */

/** The 16 comparison axes used by the pairwise diversity gate. */
export const AXES = [
  'factualTopic',
  'userProblem',
  'hookWording',
  'openingArchetype',
  'heroObject',
  'environment',
  'composition',
  'dominantGeometry',
  'cameraGrammar',
  'motionGrammar',
  'visualMetaphor',
  'mascotUsage',
  'typographyBehavior',
  'endingArchetype',
  'soundDirection',
  'emotionalTone',
];

/** A collision on any of these forces a rework, regardless of the total count. */
export const CRITICAL_AXES = [
  'heroObject',
  'visualMetaphor',
  'openingArchetype',
  'endingArchetype',
  'cameraGrammar',
  'motionGrammar',
];

export const MAX_SHARED_AXES = 3;

/**
 * Expands the minimal per-reel declaration into the full set of paths a child job
 * needs. Every batch lays its files out the same way, so this lives here once.
 */
export const buildReels = (batchId, reels, keyPrefix = 'batch') => {
  const batchDir = `runs/batches/${batchId}`;
  return reels.map((reel) => {
    const pad = String(reel.index).padStart(2, '0');
    // the prefix keeps generated filenames unique across batches
    const key = `${keyPrefix}${pad}-${reel.slug}`;
    return {
      ...reel,
      key,
      jobDir: `${batchDir}/reels/${pad}-${reel.slug}`,
      contentFile: `content/${key}-reel.json`,
      timelineFile: `src/generated/timeline-${key}.json`,
      captionsFile: `src/generated/captions-${key}.json`,
      voiceFile: `public/generated/voiceover-${key}.wav`,
      voiceMetaFile: `public/generated/voiceover-${key}-metadata.json`,
      compositionFile: `src/reels/batch-${batchId}/${pad}-${reel.slug}/index.tsx`,
      finalName: `${pad}-${reel.slug}.mp4`,
    };
  });
};

/** Phrases banned in every batch, forever. */
export const BANNED_PHRASES = [
  'Иногда дело не в',
  'Всё проще, чем кажется',
  'Когда интернет должен просто работать',
  'Один понятный путь',
  'Подключено',
  'Попробовать в Telegram',
  'Подключить в Telegram',
  'С GhostPepeBot всё проще',
  'Интернет без лишней возни',
  'Хватит искать новый',
  'Обычный VPN снова',
];
