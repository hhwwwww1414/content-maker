/**
 * The parts of a content JSON that are the same for every reel.
 *
 * A model should decide what the reel says, never how the caption clusterer is
 * configured or which QA thresholds apply — those are house settings. Keeping
 * them here means a generated script and a hand-written one are configured
 * identically, and changing the house style is one edit.
 */

/** Russian function words the caption clusterer must never strand alone. */
export const FUNCTION_WORDS = [
  'и', 'а', 'но', 'не', 'ни', 'в', 'во', 'на', 'по', 'за', 'из', 'от', 'до', 'к', 'ко', 'с',
  'со', 'у', 'о', 'об', 'про', 'для', 'что', 'как', 'это', 'всё', 'ещё', 'же', 'ты', 'он',
  'она', 'я', 'мы', 'который', 'которую', 'которая', 'которой', 'чтобы', 'так', 'там', 'уже',
  'или', 'бы', 'тебе', 'этот', 'над', 'тем', 'её', 'его', 'ему', 'их', 'то', 'есть', 'одной',
  'своей', 'потом', 'чего', 'самое', 'могут', 'своё', 'если', 'твоему', 'твоём', 'твоим',
  'теперь', 'моё', 'они', 'себе', 'почти', 'вот', 'даже', 'будет', 'была', 'только', 'когда',
  'потому', 'поэтому', 'вообще', 'тут', 'им', 'ним', 'таких', 'такому', 'оттуда', 'тогда',
];

/** PascalCase composition id from a slug: `ai-voice-scam` -> `AiVoiceScamReel`. */
export const compositionIdFor = (slug) =>
  `${slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join('')}Reel`;

/**
 * Assembles a complete content JSON from the creative parts a model produced.
 * Everything not passed in is house configuration.
 */
export const buildContent = ({slug, title, lines, chapters, chips, mood, memory, cta, source, publish, tts}) => {
  const compositionId = compositionIdFor(slug);
  return {
    id: slug,
    compositionId,
    contactSheetCompositionId: compositionId.replace(/Reel$/, 'ContactSheet'),
    npmPrefix: slug,
    title,
    visualEngine: 'avatar-persistent-canvas',
    captionMode: 'kinetic-clusters',
    voiceoverFile: `generated/${slug}/voiceover.mp3`,
    fps: 30,
    width: 1080,
    height: 1920,
    finalHoldMs: 900,
    background: {
      type: 'loop-video',
      file: 'assets/background.mp4',
      muted: true,
      fit: 'cover',
      overlayOpacity: 0.44,
      note: 'Единственный фон ролика. Зациклен, без звука, нижний постоянный слой.',
    },
    source,
    tts: {
      language: 'ru',
      speed: 1.2,
      ...tts,
    },
    captionClusters: {
      targetSeconds: [0.55, 0.85],
      growUntilSeconds: 0.45,
      maxWords: 3,
      maxLines: 2,
      functionWords: FUNCTION_WORDS,
      highlightWords: {},
      displayReplacements: {},
    },
    lines,
    chapters,
    avatarStates: [],
    chips: chips ?? [],
    mood: mood ?? null,
    memoryFrame: memory,
    cta,
    qa: {
      durationSeconds: [30, 60],
      contentPolarity: 'light-on-dark',
      scriptQuality: {hookLines: 3, maxHookWordsPerLine: 8, minAnchors: 3},
    },
    publish,
  };
};

/**
 * Avatar poses, spread across the chapters. The reel must never sit on one
 * expression for a minute, and the pose has to change on meaning, not on a timer.
 */
export const avatarStatesFor = (chapters) => {
  const arc = ['question', 'thinking', 'shocked', 'skeptical', 'angry', 'idea', 'approved', 'excited'];
  return chapters.map((chapter, i) => ({at: chapter.fromLine, state: arc[i % arc.length]}));
};
