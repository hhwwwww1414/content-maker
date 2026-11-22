/**
 * Stage 5 — post-processing. This is what produces the "clarity".
 *
 * Chain, in order:
 *   decode → high-pass 80 Hz → trim edge silence → concat with a fixed gap →
 *   loudness normalisation → WAV 48 kHz + manifest
 *
 * Normalisation runs last, on the finished track: normalising chunks
 * individually would make every scene equally loud and flatten the read.
 *
 * `trimmedLeadingMs` is carried out of the trim step because it shifts the
 * chunk's alignment, and the captions are built from that alignment.
 */
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './env.mjs';
import {POST} from '../../../config/voice.config.mjs';
import {concatWithGaps, decodeWav, encodeWav, highPass, peakDb, trimSilence} from './wav.mjs';

const REMOTION = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');

const ffmpeg = (args, label) => {
  try {
    execFileSync(process.execPath, [REMOTION, 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`${label}: ${String(error.stderr ?? error.message).slice(-400)}`);
  }
};

/** Decodes any input to mono 16-bit PCM at the export sample rate. */
export const decodeToPcm = (inputFile, tmpFile, sampleRate) => {
  ffmpeg(['-i', inputFile, '-ac', '1', '-ar', String(sampleRate), '-c:a', 'pcm_s16le', tmpFile], 'декодирование');
  return decodeWav(readFileSync(tmpFile));
};

/**
 * Normalises to the configured LUFS with ffmpeg's EBU R128 implementation.
 * Two passes: measure, then correct with the measured values — single-pass
 * loudnorm is a dynamic effect and audibly pumps on speech.
 */
const normalise = (inputFile, outputFile, targetLufs, sampleRate) => {
  // ffmpeg prints the loudnorm measurement to *stderr*, and only the second
  // pass can use it — a single pass is a dynamic effect that pumps on speech.
  const probe = spawnSync(
    process.execPath,
    [
      REMOTION, 'ffmpeg', '-hide_banner', '-i', inputFile,
      '-af', `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11:print_format=json`,
      '-f', 'null', '-',
    ],
    {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024},
  );
  const output = `${probe.stdout ?? ''}${probe.stderr ?? ''}`;
  let measured = null;
  const start = output.lastIndexOf('{');
  const end = output.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      measured = JSON.parse(output.slice(start, end + 1));
    } catch {
      measured = null; // an unreadable measurement just means a single pass
    }
  }

  const filter = measured
    ? `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11:measured_I=${measured.input_i}:` +
      `measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:` +
      `measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`
    : `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11`;

  ffmpeg(['-i', inputFile, '-af', filter, '-ar', String(sampleRate), '-ac', '1', '-c:a', 'pcm_s16le', outputFile],
    'нормализация громкости');
  return measured;
};

/**
 * Runs the full chain over the chosen take of every chunk.
 *
 * @param {{file: string, index: number, chapterIds: string[]}[]} takes chosen audio per chunk
 * @param {{outputWav: string, tmpDir: string}} paths
 * @returns {{durationMs, offsetsMs, chunks, loudness}} manifest data; `offsetsMs[i]`
 *   is where chunk `i` starts in the finished track and `chunks[i].trimmedLeadingMs`
 *   is how much silence was removed from its head.
 */
export const buildTrack = (takes, {outputWav, tmpDir}) => {
  const sampleRate = POST.export.sampleRate;
  const processed = [];

  for (const take of takes) {
    const tmpPcm = path.join(tmpDir, `chunk-${take.index}-decoded.wav`);
    const decoded = decodeToPcm(take.file, tmpPcm, sampleRate);

    const filtered = POST.highPassHz ? highPass(decoded.samples, sampleRate, POST.highPassHz) : decoded.samples;
    const {samples, trimmedLeadingMs} = POST.trimEdgeSilence
      ? trimSilence(filtered, sampleRate)
      : {samples: filtered, trimmedLeadingMs: 0};

    processed.push({
      index: take.index,
      chapterIds: take.chapterIds,
      samples,
      trimmedLeadingMs,
      durationMs: (samples.length / sampleRate) * 1000,
    });
  }

  const {samples, offsetsMs, durationMs} = concatWithGaps(
    processed.map((chunk) => chunk.samples),
    sampleRate,
    POST.gapMs,
  );

  const stitched = path.join(tmpDir, 'stitched.wav');
  writeFileSync(stitched, encodeWav(samples, sampleRate));

  // Mono track, so the mono target applies.
  const target = POST.loudnessLufs.mono;
  const loudness = normalise(stitched, outputWav, target, sampleRate);

  const finalSamples = decodeWav(readFileSync(outputWav)).samples;

  return {
    durationMs,
    offsetsMs,
    sampleRate,
    gapMs: POST.gapMs,
    highPassHz: POST.highPassHz,
    targetLufs: target,
    measuredInputLufs: loudness ? Number(loudness.input_i) : null,
    outputPeakDb: Number(peakDb(finalSamples).toFixed(2)),
    chunks: processed.map((chunk, i) => ({
      index: chunk.index,
      chapterIds: chunk.chapterIds,
      startMs: Number(offsetsMs[i].toFixed(1)),
      durationMs: Number(chunk.durationMs.toFixed(1)),
      trimmedLeadingMs: Number(chunk.trimmedLeadingMs.toFixed(1)),
    })),
  };
};
