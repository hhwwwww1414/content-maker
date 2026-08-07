import {readFileSync} from 'node:fs';
import zlib from 'node:zlib';

/**
 * Minimal PNG reader for QA pixel checks — supports 8-bit RGB and RGBA,
 * which is everything `ffmpeg -c:v png` and Remotion emit. No dependencies.
 */
export const readPng = (file) => {
  const buf = readFileSync(file);
  let p = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let bitDepth = 0;
  const idat = [];

  while (p < buf.length) {
    const length = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    p += 12 + length;
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`PNG не поддержан QA-ридером: bitDepth=${bitDepth} colorType=${colorType}`);
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(height * stride);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[offset++];
    const line = raw.subarray(offset, offset + stride);
    offset += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = x >= channels && prev ? prev[x - channels] : 0;
      let value = line[x];
      switch (filter) {
        case 1:
          value += a;
          break;
        case 2:
          value += b;
          break;
        case 3:
          value += (a + b) >> 1;
          break;
        case 4: {
          const guess = a + b - c;
          const da = Math.abs(guess - a);
          const db = Math.abs(guess - b);
          const dc = Math.abs(guess - c);
          value += da <= db && da <= dc ? a : db <= dc ? b : c;
          break;
        }
        default:
          break;
      }
      cur[x] = value & 255;
    }
  }

  return {width, height, channels, stride, data: out};
};

const luminance = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Fraction of pixels inside `box` that carry real content.
 *
 * Which pixels count depends on the reel's polarity:
 *  - `dark-on-light`  — dark or saturated pixels on a paper canvas. The faint
 *    background grid (~#DCDCD9) stays above the threshold and does not register.
 *  - `light-on-dark`  — bright or saturated pixels over a darkened video. The
 *    backdrop and its overlay stay below the threshold, so only type, chips and
 *    diagram strokes count.
 *
 * Using the wrong polarity reports ~100 % coverage everywhere, which is why it
 * is configured per reel rather than guessed from the pixels.
 */
export const inkFraction = (png, box, options = {}) => {
  const {
    polarity = 'dark-on-light',
    darkBelow = 170,
    brightAbove = 165,
    minSaturation = polarity === 'light-on-dark' ? 90 : 60,
  } = options;
  const lightOnDark = polarity === 'light-on-dark';
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.ceil(box.x + box.width));
  const y1 = Math.min(png.height, Math.ceil(box.y + box.height));
  let ink = 0;
  let total = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * png.stride + x * png.channels;
      const r = png.data[i];
      const g = png.data[i + 1];
      const b = png.data[i + 2];
      const saturation = Math.max(r, g, b) - Math.min(r, g, b);
      const light = luminance(r, g, b);
      const isInk = lightOnDark ? light > brightAbove : light < darkBelow;
      if (isInk || saturation > minSaturation) ink++;
      total++;
    }
  }
  return total === 0 ? 0 : ink / total;
};

/**
 * Mean luminance and standard deviation inside `box`.
 * A missing / black background collapses both to ~0; a moving video keeps the
 * deviation well above zero even under a heavy readability overlay.
 */
export const luminanceStats = (png, box) => {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(png.width, Math.ceil(box.x + box.width));
  const y1 = Math.min(png.height, Math.ceil(box.y + box.height));
  const values = [];

  // Sample on a grid: full-resolution scans of many frames are needlessly slow.
  const stepX = Math.max(1, Math.floor((x1 - x0) / 160));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 160));

  for (let y = y0; y < y1; y += stepY) {
    for (let x = x0; x < x1; x += stepX) {
      const i = y * png.stride + x * png.channels;
      values.push(luminance(png.data[i], png.data[i + 1], png.data[i + 2]));
    }
  }
  if (values.length === 0) return {mean: 0, stdDev: 0, samples: 0};
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return {mean: Number(mean.toFixed(2)), stdDev: Number(Math.sqrt(variance).toFixed(2)), samples: values.length};
};
