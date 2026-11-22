// Русская вёрстка заголовков: на какие неразрывные куски делится строка.
// «*текст*» — зелёный акцент, «_текст_» — жёлтый, «~текст~» — серый.
export type Tok = { w: string; mark: string };
export const splitMarks = (text: string): Tok[] =>
  text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/).filter(Boolean).flatMap((part) => {
    const mark = part[0] === '*' ? 'g' : part[0] === '_' ? 'y' : part[0] === '~' ? 's' : '';
    const body = mark ? part.slice(1, -1) : part;
    return body.split(/\s+/).filter((w) => w.length).map((w) => ({ w, mark }));
  });

// Русская вёрстка заголовков: что нельзя разрывать переносом строки.
// Предлоги, союзы и «не» держатся со следующим словом; тире, «·», единицы и группы разрядов — с предыдущим.
const GLUE_NEXT = new Set(['в', 'во', 'и', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'а', 'на', 'по', 'до', 'за', 'от', 'из', 'не', 'ни', 'но', 'без', 'для', 'при', 'про', 'над', 'под', 'что', 'это', 'то', 'так', 'же', 'как', 'всё', 'уже', 'даже']);
const UNIT = /^(₽|руб\.?|млн|млрд|тыс\.?|км|л\.с\.|%|г\.|л)[.,:;!?»)]*$/i;
const bare = (w: string) => w.toLowerCase().replace(/^[«"„(]+|[»"“).,:;!?]+$/g, '');
const glued = (a: Tok, b: Tok) =>
  GLUE_NEXT.has(bare(a.w)) || // предлог + слово
  /^[—–·:]$/.test(b.w) || // тире и точка-разделитель остаются в конце строки
  (/\d$/.test(a.w) && /^\d{3}([^\d].*)?$/.test(b.w)) || // 30 950 000
  (/\d$/.test(a.w) && UNIT.test(b.w)) || // 2 млн, 640 000 ₽
  (UNIT.test(a.w) && /^₽/.test(b.w)) || // 2,6 млн ₽
  /^(?=.*\d)(?=.*[A-ZА-Я])[0-9A-ZА-Я]{1,3}[:.,!?]?$/.test(b.w) || // Zeekr 8X, BMW X7, раунд 2
  (/^\d[\d,]*$/.test(a.w) && /^[а-яё]/i.test(b.w)) || // 766 машин, 600 карточках
  /^[»"“).,:;!?]+$/.test(b.w);
export const toUnits = (text: string): Tok[][] => {
  const units: Tok[][] = [];
  for (const t of splitMarks(text)) {
    const last = units[units.length - 1];
    if (last && glued(last[last.length - 1], t)) last.push(t);
    else units.push([t]);
  }
  return units;
};
