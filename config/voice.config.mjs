/**
 * TTS settings — the single source of truth for every ElevenLabs call.
 *
 * `.mjs` rather than `.ts` on purpose: the whole voice pipeline lives in
 * `scripts/**` and runs as plain Node ESM, so a TypeScript config would need a
 * build step for no benefit. Types for the Remotion side live in `src/`.
 *
 * Nothing here may be inlined at a call site. If a number needs changing, it
 * changes once, here.
 */

/**
 * Voice identity. Never hardcoded in code — `ELEVENLABS_VOICE_ID` in `.env`
 * wins, and this is only the documented fallback for a fresh checkout.
 */
export const VOICE = {
  /**
   * Read lazily: this module is imported before `loadDotEnv()` runs, so reading
   * `process.env` at module scope would capture an empty string.
   */
  get id() {
    return process.env.ELEVENLABS_VOICE_ID ?? '';
  },
  /** Recorded so the config says *which* voice was picked, and why. */
  name: 'Chris - Charming, Down-to-Earth',
  /**
   * `premade`, not `voice-library`: ElevenLabs refuses library voices to free
   * accounts over the API — even ones already added to the account. Swap to a
   * Russian library voice the moment the plan is paid; nothing else changes.
   */
  source: 'premade',
  castedAt: '2026-08-08',
};

/**
 * Generation parameters.
 *
 * `eleven_v3` is the only model that understands Audio Tags, and the emotion in
 * these reels comes from the markup rather than from the voice preset. Its
 * latency is irrelevant: everything is rendered ahead of time, never realtime.
 * Flash v2.5 is deliberately not used.
 */
export const GENERATION = {
  modelId: 'eleven_v3',
  outputFormat: 'mp3_44100_192',
  /**
   * 192 kbps is gated behind the Creator tier. Casting is a listening
   * comparison, not a master, so it degrades rather than failing — the actual
   * format used is recorded in `candidates.json` and shown on the page.
   */
  fallbackOutputFormat: 'mp3_44100_128',
  /**
   * Models that accept `previous_text` / `next_text`.
   *
   * `eleven_v3` does not: the API answers
   * `unsupported_model: Providing previous_text or next_text is not yet
   * supported with the 'eleven_v3' model`. Tags and request context cannot be
   * had at the same time, and the brief picked v3 *for* the tags — so context
   * is sent only where it is accepted. Chunks are whole scenes, and a scene
   * boundary is a natural intonation reset, so the seam stays defensible.
   */
  supportsNeighbourContext: ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_flash_v2_5'],
  voiceSettings: {
    /**
     * "Natural". Not 1.0 — Robust suppresses the tags we rely on. Not 0.0 —
     * Creative drifts and breaks reel-to-reel consistency.
     */
    stability: 0.5,
    /** Keeps the voice the same from reel to reel. */
    similarity_boost: 0.8,
    /** Tag amplifier. We want the tags read, not performed. */
    style: 0.0,
    speed: 1.0,
  },
};

/**
 * Chunking. Tags behave erratically in short requests, so a chunk is a scene,
 * never a sentence, and never shorter than `minChars`.
 */
export const CHUNKING = {
  minChars: 250,
  /** Neighbouring text is sent as context so intonation survives the seams. */
  sendNeighbourContext: true,
  /** The model is non-deterministic; pick the best take later. */
  takesPerChunk: 3,
};

/** Post-processing — this is what actually produces the "clarity". */
export const POST = {
  loudnessLufs: {mono: -16, stereo: -14},
  trimEdgeSilence: true,
  /** Fixed gap stitched between chunks. */
  gapMs: 300,
  highPassHz: 80,
  export: {format: 'wav', sampleRate: 48000},
};

/**
 * Audio Tags. The markup step is an LLM call, but only these may survive it —
 * everything else is stripped by the validator, including any SSML.
 */
export const TAGS = {
  allowed: ['calm', 'confident', 'matter-of-fact', 'curious', 'thoughtful', 'emphatic', 'pause', 'whispers'],
  /** Named explicitly so the intent is visible, not just "everything else". */
  banned: ['excited', 'shouting', 'laughs', 'crying', 'mischievously', 'gasps'],
  density: {
    /** At most one tag per this many sentences. More reads as overacting. */
    sentencesPerTag: 2,
    /** `[whispers]` is a hook device only, once per reel. */
    whispersPerReel: 1,
    whispersHookOnly: true,
  },
  /** v3 does not support `<break>`; SSML is removed rather than translated. */
  stripSsml: true,
};

/** Casting run: comparing library voices on a real script before committing. */
export const CASTING = {
  shortlistSize: 10,
  /** Spec asks for narration / advertisement / social_media; the API spells
   *  narration as `narrative_story`, and `informative_educational` is literally
   *  this channel's genre, so it is included. */
  useCases: ['narrative_story', 'informative_educational', 'social_media', 'advertisement'],
  categories: ['professional', 'high_quality'],
  minClonedByCount: 5000,
  outputDir: 'voice-casting',

  /**
   * Free tier fallback. ElevenLabs refuses Voice Library voices to free
   * accounts over the API (402 paid_plan_required), so casting falls back to
   * the 21 premade voices, which are available on every plan.
   *
   * They are all English-native and read Russian with an accent — that is the
   * cost of not paying, and exactly what the casting page is for.
   */
  premade: {
    /** Wrong register for an explainer channel, whatever they sound like. */
    excludeUseCases: ['characters_animation'],
    /** Promises the "sales push" the brief rules out. */
    excludeNames: ['Laura', 'Jessica', 'Liam', 'Bill'],
    /** Kept in the line-up as the incumbent, so the comparison has a baseline. */
    baseline: 'Eric',
  },
};
