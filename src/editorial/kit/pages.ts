export type PageWord = {text: string; startMs: number; endMs: number};
export const PAGE = {maxWords: 4, maxChars: 26, maxSpanMs: 1450, holdMs: 280};

/** Groups timed words into caption pages: short, and always broken at sentence ends. */
export const buildPages = <T extends PageWord>(words: T[]): T[][] => {
  const pages: T[][] = [];
  for (const word of words) {
    const last = pages[pages.length - 1];
    const combined = last ? [...last, word].map((w) => w.text).join(' ') : '';
    const breakHere = !last || last.length >= PAGE.maxWords || combined.length > PAGE.maxChars
      || word.startMs - last[0].startMs > PAGE.maxSpanMs || /[.!?,:—]$/.test(last[last.length - 1].text);
    if (breakHere) pages.push([word]);
    else last.push(word);
  }
  return pages;
};
