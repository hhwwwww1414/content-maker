/**
 * Stage 4 — chunking.
 *
 * A chunk is a scene, never a sentence. Tags behave erratically in short
 * requests, so a chapter shorter than `CHUNKING.minChars` is glued to its
 * neighbour and the audio is cut apart afterwards instead.
 *
 * Each request also carries `previous_text` / `next_text` so the model knows
 * what it is continuing into and the intonation does not reset at every seam.
 */
import {CHUNKING} from '../../../config/voice.config.mjs';

/** `soft` keeps the phrase flowing, `line` is a beat, `block` is a real pause. */
const SEPARATOR = {soft: ' ', line: '\n', block: '\n\n', none: ''};

/**
 * Joins lines into the exact string sent to ElevenLabs, recording each line's
 * `[start, end)` character range so alignment can be projected back.
 */
export const joinLines = (lines) => {
  let text = '';
  const ranges = [];
  lines.forEach((line, index) => {
    const charStart = text.length;
    text += line.text;
    ranges.push({...line, charStart, charEnd: text.length});
    if (index < lines.length - 1) text += SEPARATOR[line.breakAfter] ?? '\n';
  });
  return {text, ranges};
};

/**
 * Groups the script's lines into chunks along chapter boundaries.
 *
 * @returns {{index:number, chapterIds:string[], lines:object[], text:string,
 *   ranges:object[], previousText:string, nextText:string}[]}
 */
export const buildChunks = (script) => {
  const lines = script.lines ?? [];
  if (lines.length === 0) return [];

  // Group by chapter first — a scene is the unit of meaning and of tagging.
  const groups = [];
  for (const line of lines) {
    const last = groups[groups.length - 1];
    if (last && last.chapterIds[last.chapterIds.length - 1] === line.chapter) last.lines.push(line);
    else groups.push({chapterIds: [line.chapter], lines: [line]});
  }

  // A chunk keeps absorbing scenes only until it reaches the minimum; once it
  // has, the next scene opens a new chunk. Accumulating on the incoming group's
  // size alone would glue the whole script into a single request.
  const size = (group) => group.lines.reduce((sum, line) => sum + line.text.length, 0);
  const merged = [];
  for (const group of groups) {
    const current = merged[merged.length - 1];
    if (current && size(current) < CHUNKING.minChars) {
      current.lines.push(...group.lines);
      current.chapterIds.push(...group.chapterIds);
    } else {
      merged.push({chapterIds: [...group.chapterIds], lines: [...group.lines]});
    }
  }
  // A trailing chunk that is still too short has nowhere to grow — fold it back.
  if (merged.length > 1 && size(merged[merged.length - 1]) < CHUNKING.minChars) {
    const tail = merged.pop();
    const previous = merged[merged.length - 1];
    previous.lines.push(...tail.lines);
    previous.chapterIds.push(...tail.chapterIds);
  }

  const chunks = merged.map((group, index) => {
    const {text, ranges} = joinLines(group.lines);
    return {index, chapterIds: group.chapterIds, lines: group.lines, text, ranges};
  });

  // Neighbour context keeps intonation continuous across the seams.
  return chunks.map((chunk, i) => ({
    ...chunk,
    previousText: CHUNKING.sendNeighbourContext ? (chunks[i - 1]?.text ?? '') : '',
    nextText: CHUNKING.sendNeighbourContext ? (chunks[i + 1]?.text ?? '') : '',
  }));
};

/** Characters a run will be billed for — context does not count. */
export const chunkCost = (chunks, takes = CHUNKING.takesPerChunk) =>
  chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) * takes;
