// Onsets of a decoded track: where the energy jumps, in the whole mix and in the bass. Shared by the beat map and QA.
const WINDOW = 1024;

const fluxOnsets = (samples, rate, hop) => {
  const count = Math.floor((samples.length - WINDOW) / hop);
  const flux = new Float64Array(Math.max(0, count));
  let previous = 0;
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let j = 0; j < WINDOW; j++) sum += samples[i * hop + j] ** 2;
    const level = Math.log(1e-8 + sum);
    if (i) flux[i] = Math.max(0, level - previous);
    previous = level;
  }
  const out = [];
  for (let i = 4; i < count - 4; i++) {
    let local = 0;
    const from = Math.max(0, i - 30), to = Math.min(count, i + 30);
    for (let k = from; k < to; k++) local += flux[k];
    local /= to - from;
    if (flux[i] > local * 3 && flux[i] > 0.4 && flux[i] === Math.max(...flux.subarray(i - 4, i + 5))) out.push(i * hop / rate);
  }
  return out;
};

const lowPass = (samples, rate, cutoff) => {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / rate);
  const out = new Float64Array(samples.length);
  let one = 0, two = 0;
  for (let i = 0; i < samples.length; i++) { one += a * (samples[i] - one); two += a * (one - two); out[i] = two; }
  return out;
};

/** Seconds of every onset in `samples` (floats, mono), sorted. */
export const onsetsOf = (samples, rate) => {
  const hop = Math.round(rate / 100);
  return [...fluxOnsets(samples, rate, hop), ...fluxOnsets(lowPass(samples, rate, 140), rate, hop)].sort((a, b) => a - b);
};

/** Share of times that land within `toleranceSeconds` of an onset. */
export const shareOnBeat = (times, onsets, toleranceSeconds) => {
  const missed = times.filter((t) => !onsets.some((o) => Math.abs(o - t) <= toleranceSeconds));
  return {share: times.length ? 1 - missed.length / times.length : 0, missed};
};
