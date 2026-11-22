#!/usr/bin/env node
/**
 * Opens a batch: checks the TTS budget, decides how many reels fit, and writes
 * the brief the agent fills in.
 *
 *   npm run conveyor:plan -- --count 6
 *
 * Produces `runs/conveyor/<batch>/brief.md` and `batch.json`. Nothing is
 * generated and nothing is billed at this stage — the point is to know the
 * ceiling before writing six scripts that only four can pay for.
 */
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../eleven/lib/env.mjs';
import {fetchQuota, planBatch} from './lib/quota.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const REQUESTED = Number(flag('count', '6'));
const BATCH_ID = flag('batch', new Date().toISOString().slice(0, 10));
const AVERAGE_CHARS = Number(flag('chars', '430'));

const batchDir = path.join(ROOT, 'runs', 'conveyor', BATCH_ID);

/** Topics already covered, so the agent does not propose one of them again. */
const existingTopics = () => {
  const dir = path.join(ROOT, 'content');
  return readdirSync(dir)
    .filter((name) => name.endsWith('-reel.json'))
    .map((name) => {
      try {
        const script = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
        return {slug: script.id ?? name.replace('-reel.json', ''), title: script.title ?? ''};
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const main = async () => {
  const quota = await fetchQuota();
  const plan = planBatch(quota, {averageChars: AVERAGE_CHARS, requested: REQUESTED});
  const topics = existingTopics();

  mkdirSync(batchDir, {recursive: true});

  const batch = {
    batchId: BATCH_ID,
    createdAt: new Date().toISOString(),
    requested: REQUESTED,
    planned: plan.fits,
    capped: plan.capped,
    averageChars: AVERAGE_CHARS,
    quota,
    slots: Array.from({length: plan.fits}, (_, i) => ({
      index: i + 1,
      slug: null,
      status: 'EMPTY',
    })),
  };
  writeFileSync(path.join(batchDir, 'batch.json'), `${JSON.stringify(batch, null, 2)}\n`);

  const brief = `# Батч ${BATCH_ID}

Заполняется агентом. Раннер уже посчитал бюджет — менять число роликов вверх нельзя.

## Бюджет

- Квота: ${quota ? `${quota.remaining} из ${quota.limit} символов (тариф ${quota.tier}${quota.resetsAt ? `, сброс ${quota.resetsAt}` : ''})` : 'недоступна'}
- Запрошено роликов: ${REQUESTED}
- **Помещается: ${plan.fits}** — ${plan.reason}
- Бюджет на ролик: ~${AVERAGE_CHARS} символов произносимого текста (≈ ${(AVERAGE_CHARS / 16.8 + 0.9).toFixed(0)} с готового ролика)

## Что нужно сделать

Для каждого из ${plan.fits} слотов:

1. **Идея.** Найти тему с проверяемым фактом: имя исследования/компании, дата,
   число. Тема не должна повторять ни один из ${topics.length} уже снятых роликов
   (список ниже). Проверить, что о ней реально говорят, а не что она «звучит
   интересно».
2. **Сценарий** — \`content/<slug>-reel.json\` по правилам
   [docs/REEL_CRAFT.md](../../../docs/REEL_CRAFT.md):
   хук ≤ 8 слов на реплику и не определение, ≤ ${AVERAGE_CHARS} символов,
   минимум 3 проверяемых факта, твист в предпоследней главе, кадр-запоминалка,
   CTA с закрытым вопросом.
3. **Сцены** — только грамматики из [docs/GRAMMARS.md](../../../docs/GRAMMARS.md).
   Код под ролик не писать. Разные ролики батча должны использовать разные
   последовательности грамматик, иначе батч завернёт гейт однообразия.
4. **Подключение** — \`node scripts/eleven/scaffold-reel.mjs --slug <slug>\`.

Затем:

\`\`\`bash
npm run conveyor:preflight -- --batch ${BATCH_ID}   # все гейты ДО трат
npm run conveyor:build -- --batch ${BATCH_ID}       # озвучка → рендер → QA
\`\`\`

Препролёт обязателен: он ловит длину, слоп, битые ссылки на реплики и
одинаковые заходы до того, как будет потрачен хоть один символ квоты.

## Уже снятые темы — не повторять

${topics.map((topic) => `- \`${topic.slug}\` — ${topic.title}`).join('\n')}

## Слоты

${Array.from({length: plan.fits}, (_, i) => `${i + 1}. slug: \`\` — тема: `).join('\n')}
`;

  writeFileSync(path.join(batchDir, 'brief.md'), brief);

  console.log(`батч ${BATCH_ID}`);
  if (quota) {
    console.log(`  квота        ${quota.remaining}/${quota.limit} символов (${quota.tier}${quota.resetsAt ? `, сброс ${quota.resetsAt}` : ''})`);
  } else {
    console.log('  квота        недоступна — планирую по запросу');
  }
  console.log(`  запрошено    ${REQUESTED}`);
  console.log(`  ${plan.capped ? 'ОГРАНИЧЕНО' : 'помещается'}   ${plan.fits} — ${plan.reason}`);
  console.log(`  уже снято    ${topics.length} тем`);
  console.log('');
  console.log(`  → runs/conveyor/${BATCH_ID}/brief.md`);
  console.log(`  → runs/conveyor/${BATCH_ID}/batch.json`);
  if (plan.fits === 0) {
    console.log('');
    console.log('  Квоты не хватает ни на один ролик. Сценарии писать можно — они не стоят кредитов.');
  }
};

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});
