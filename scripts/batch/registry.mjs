import {batch as a1} from './a1/index.mjs';
import {batch as b1} from './b1/index.mjs';

/** Every batch this repo has produced, newest last. */
export const BATCHES = {
  [a1.BATCH_ID]: a1,
  [b1.BATCH_ID]: b1,
};

export const DEFAULT_BATCH_ID = b1.BATCH_ID;

export const loadBatch = (id = DEFAULT_BATCH_ID) => {
  const batch = BATCHES[id];
  if (!batch) throw new Error(`Unknown batch "${id}". Known: ${Object.keys(BATCHES).join(', ')}`);
  return batch;
};
