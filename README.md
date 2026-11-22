# GhostPepeBot — фабрика вертикальных Reels на Remotion

Репозиторий производит вертикальные ролики 1080×1920, 30 fps: озвучка, тайминги,
субтитры, рендер H.264/AAC и автоматический QA. Сейчас в `content/` лежит
**53 сценария**, в `src/Root.tsx` зарегистрировано **64 композиции**.

Один ролик = один JSON-сценарий + одна Remotion-композиция. Всё, что зависит от
звука (длительность сцен, паузы, кадры субтитров, `durationInFrames`), выводится
из реально синтезированной озвучки, а не проставляется руками.

## Два пайплайна

В репозитории сосуществуют две линии производства. Они не заменяют друг друга:
это разные форматы с разной подачей.

| | Silero (локальный) | ElevenLabs (облачный) |
|---|---|---|
| Роликов | 46 | 7 |
| Озвучка | Silero V5 / Piper, Python 3.11, офлайн | ElevenLabs `/with-timestamps`, нужен API-ключ |
| Тайминги | по длительности сегментов WAV | по character-level alignment |
| Субтитры | phrase-level страницы (1 страница = 1 реплика) | кинетические кластеры по 1–3 слова |
| Структура | набор сцен, сменяющих друг друга | один накапливающийся холст |
| Сценарий | `voiceoverSegments` | `lines` + `chapters` + `canvasActions` |
| Команды | `npm run voice:generate:*`, `npm run render:*` | `npm run reel:<name>:*` |
| Документация | `REEL_PIPELINE.md`, `docs/REEL_FRAMEWORK_V2.md` | `docs/ELEVENLABS_REELS.md` |

Правила подачи, общие для обеих линий, — в [docs/REEL_CRAFT.md](docs/REEL_CRAFT.md):
длительность, хук, плотность текста на экране, структура, запреты в сценарии.

## Конвейер

Батч роликов производится тремя командами. Кода под конкретный ролик писать не
нужно: сцены собираются из восьми готовых грамматик, композиция генерируется.

```bash
npm run conveyor:plan -- --count 6          # бюджет ElevenLabs → размер батча и бриф
#   … агент заполняет слоты: идея, сценарий, грамматики
npm run conveyor:preflight -- --batch <id>  # 12 гейтов по тексту, кредиты не тронуты
npm run conveyor:build -- --batch <id>      # озвучка → рендер → лист → тексты → QA
```

Препролёт — главный шаг: он предсказывает длительность с ошибкой ≈ 0.4 с,
ловит слоп, битые ссылки на реплики, одинаковые заходы и нехватку квоты **до**
вызова платного API. Подробно — [docs/CONVEYOR.md](docs/CONVEYOR.md).

Отдельный ролик подключается скаффолдером:

```bash
node scripts/eleven/scaffold-reel.mjs --slug <slug>
```

Он создаёт композицию и контактный лист, регистрирует их в `src/Root.tsx` и
добавляет семь npm-скриптов. Идемпотентен.

### Озвучка

Весь TTS-слой — от чисел прописью до нормализации громкости — описан в
[docs/VOICE.md](docs/VOICE.md), настраивается одним файлом
[config/voice.config.mjs](config/voice.config.mjs).

```
текст → числа прописью → Audio Tags → чанкинг по сценам → N дублей
      → high-pass 80 Гц → обрезка тишины → склейка с гапом → −16 LUFS
      → WAV 48 кГц + манифест + сшитый alignment
```

Диктор — Chris (premade), выбран кастингом. Русские голоса Voice Library
недоступны бесплатному тарифу; шортлист из 10 лежит наготове в
`voice-casting/candidates.json`.

### Грамматики сцен

Ролик больше не несёт рукописный TSX. Главы объявляют одну из восьми грамматик
(`statement`, `compare`, `tiles`, `document`, `counters`, `steps`, `flow`,
`split`) прямо в `content/<slug>-reel.json`, а времена пишутся как id реплик —
`{"at": "l13"}` — и разрешаются в миллисекунды после синтеза озвучки. Справочник
слотов: [docs/GRAMMARS.md](docs/GRAMMARS.md).

Новые ролики делаются на ElevenLabs-пайплайне: он параметризован по slug, и для
нового ролика нужны только `content/<slug>-reel.json` и композиция.

## Быстрый старт

Требования: Node.js LTS, npm, Git. Для Silero-роликов дополнительно Python 3.11
(**не 3.14** — зависимости в `requirements.txt` собраны под 3.11). `ffmpeg`
ставить не нужно: скрипты вызывают `npx remotion ffmpeg` / `ffprobe` из бинарника,
который Remotion приносит с собой.

```bash
npm install
npm run stub:timelines   # обязательный шаг после клонирования, см. ниже
npm run dev              # Remotion Studio
```

### Почему нужен `stub:timelines`

`src/generated/` и `public/generated/` лежат в `.gitignore` — это продукты
синтеза речи, они не коммитятся. При этом `src/Root.tsx` импортирует **все**
таймлайны и субтитры статически. После `git clone` webpack падает на первом же
отсутствующем JSON, и не собирается ничего — даже ролик, для которого озвучка
уже сгенерирована.

`npm run stub:timelines` создаёт структурно валидные заглушки для каждого
недостающего файла: тайминги оцениваются по тексту сценария (~14 символов в
секунду), в JSON проставляется `"placeholder": true`. Существующие файлы никогда
не перезаписываются — реальный `voice:generate` заменяет заглушку измеренными
таймингами. Флаг `--force` перезаписывает всё, включая настоящие таймлайны.

Заглушка нужна для сборки бандла и для `npm run typecheck`. Ролик с заглушкой
рендерится без звука и с приблизительными таймингами — это черновой предпросмотр
раскладки, а не готовое видео.

## ElevenLabs-ролики

Полная документация — `docs/ELEVENLABS_REELS.md`. Кратко:

| # | Slug | Композиция | npm-префикс |
|---|---|---|---|
| 1 | `vibe-coding-trust` | `VibeCodingTrustReel` | `reel:vibe` |
| 2 | `vpn-age-verification` | `VpnAgeVerificationReel` | `reel:vpn` |
| 3 | `ai-cheated-test` | `AiCheatedTestReel` | `reel:ai-test` |
| 4 | `website-controls-ai` | `WebsiteControlsAiReel` | `reel:prompt-injection` |
| 5 | `how-sites-detect-vpn` | `HowSitesDetectVpnReel` | `reel:vpn-detection` |
| 6 | `passkey-explained` | `PasskeyExplainedReel` | `reel:passkey` |
| 7 | `ai-browser-hijack` | `AiBrowserHijackReel` | `reel:agent-browser` |

Ролик 1 — единственный на светлом холсте. Ролики 2–7 идут поверх зацикленного
`public/assets/background.mp4` со светлым текстом на затемнённом видео.

Секреты — в `.env` (в `.gitignore`), образец `.env.example`:

```env
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

Ключ не попадает в исходники, логи и метаданные: вывод проходит через `redact()`,
а QA сканирует все видимые git файлы на паттерн `sk_…`.

Весь пайплайн одной командой:

```bash
npm run reel:agent-browser:all    # озвучка → рендер → contact sheet → тексты → QA
```

Или по шагам:

```bash
npm run reel:agent-browser:voice        # озвучка + тайминги + кластеры (кэш по хешу)
npm run reel:agent-browser:voice:force  # принудительно перезапросить у ElevenLabs
npm run reel:agent-browser:render       # MP4
npm run reel:agent-browser:sheet        # контактный лист 3×4 PNG
npm run reel:agent-browser:copy         # обложка, подпись, хэштеги
npm run reel:agent-browser:qa           # QA по отрендеренному MP4
```

Любой шаг работает и напрямую: `node scripts/eleven/qa.mjs --slug <name>`.

Для публикации у ролика про агентный браузер есть ещё два шага:

```bash
npm run reel:agent-browser:render:silent  # тот же MP4, но без звуковой дорожки
npm run reel:agent-browser:cover          # PNG-обложка (кадр 105 = 3.5 с)
```

Немая версия (`--muted`) нужна, когда озвучку накладывают отдельно — своим
голосом или музыкой. Важно: картинка и кинетические субтитры привязаны к
character-alignment сгенерированной озвучки, поэтому чужая дорожка должна
попадать в тот же тайминг. Иначе текст сценария правится в `content/`, и
`voice:generate` пересобирает тайминги заново. QA рассчитан на версию со звуком:
у немой не проходит проверка `audioPresent` — это ожидаемо.

**Кэш.** `generate-voice.mjs` считает `sha256(text | voiceId | modelId |
outputFormat | speed)`. Совпал с `public/generated/<slug>/voiceover-meta.json` —
запрос к API не отправляется и кредиты не тратятся.

### Новый ролик на этом пайплайне

1. `content/<slug>-reel.json` — реплики, главы, действия холста, memory frame,
   CTA, пороги QA. Всё привязано к **id реплики**, а не к секундам.
2. Сцены в `src/components/<slug>/scenes.tsx` поверх общих примитивов
   (`components/vibe/`, `components/vpn/frames`, `components/kit/`).
3. Композиция + contact sheet в `src/compositions/`, регистрация в `src/Root.tsx`.
4. Семь npm-скриптов `reel:<name>:*` в `package.json`.
5. `npm run stub:timelines && npm run typecheck` — проверить раскладку до трат
   на ElevenLabs; затем `npm run reel:<name>:all`.

## Silero-ролики

```bash
npm run tts:setup                  # .venv, зависимости, модель Silero V5
npm run voice:generate             # озвучка + timeline для content/reel.json
npm run voice:generate:<name>      # для конкретного ролика
npm run render:<name>              # MP4
npm run build:reel                 # полный цикл для базового ролика
```

Модель `v5_5_ru` скачивается один раз в `models/` и дальше работает офлайн.
Голос задаётся полем `speaker` в сценарии (`aidar`, `baya`, `kseniya`, `xenia`,
`eugene`). Озвучка сохраняется как mono PCM WAV.

Серией роликов управляет `scripts/reels.mjs` — манифест лежит в
`scripts/reels.config.mjs`, ролики сгруппированы (`news`, `coding`, `web`,
`series`):

```bash
npm run reels -- build all         # озвучка → safe-zone гейт → рендер
npm run reels:build:coding         # только группа coding
npm run reels:batch -- --count 6   # автономная черновая продукция батча
```

## Контроль качества

Три независимых гейта, все обязательны перед финальным рендером:

- **`npm run qa:reels`** — safe-zone гейт. Рендерит контрольные кадры и падает,
  если непрозрачный контент заезжает в unsafe-зону Instagram; нарушение
  сохраняется как `out/qa/*-VIOLATION.png`. Зоны можно подсветить
  (`npm run qa:reels:overlay` или `REEL_OVERLAY=1`). `build:reel` блокирует
  рендер по этому гейту.
- **`node scripts/eleven/qa.mjs --slug <name>`** — QA по готовому MP4:
  длительность, разрешение, fps, наличие аудиодорожки, доля «чернил» в
  unsafe-зонах на реальных кадрах, ритм субтитров, непрерывность петли фона,
  утечка ключа, **качество текста сценария**. Отчёт — `out/<slug>-qa.json`.
- **`npm run verify`** и **`npm run lint`** (`eslint src && tsc --noEmit`).

Вся геометрия — из одного источника: `src/reel-system/layout/safe-area.ts` и
`safe-area.config.json`. Отступы не хардкодятся: импортируются `SAFE`,
`IG_UNSAFE`, `CANVAS` или используются примитивы `<SafeArea>` /
`<CaptionSafeArea>`.

Для роликов с `qa.factFraming` работает проверка фактической рамки: утверждение,
попадающее под `banPatterns`, обязано быть помечено как цитируемый миф
(`framing: "myth"`), а опровержения из `requiredTexts` — присутствовать в тексте.
Так сенсационный хук нельзя выдать за утверждение.

Отдельный гейт [slop-check.mjs](scripts/eleven/lib/slop-check.mjs) проверяет сам
текст сценария: воду («важно понимать», «давайте разберёмся»), машинные обороты
(«это не просто X, это Y»), смягчители, длину и форму хука, число проверяемых
фактов и повтор первой реплики с другими сценариями в `content/`. Включён по
умолчанию, настраивается через `qa.scriptQuality`, отключается
`{"enabled": false}`.

Стандарт длительности — **не длиннее 60 секунд**, значение по умолчанию
`[30, 60]`. Правила подачи, хука, текста и структуры собраны в
[docs/REEL_CRAFT.md](docs/REEL_CRAFT.md) — там же указано, какой гейт держит
каждое правило.

## Структура

```
content/               сценарии роликов (53 JSON)
src/Root.tsx           регистрация всех композиций
src/compositions/      композиции роликов и контактных листов
src/components/        сцены и примитивы по темам (vibe, vpn, passkey, agentbrowser, …)
src/scenes/            сцены ранних Silero-роликов
src/reels/             батчи роликов (2026-07-25-a1, -b1)
src/reel-system/       safe-area, storyboard, quality gate, novelty analyzer, motion
src/theme/             цвета, шрифты, типографика, токены
scripts/eleven/        ElevenLabs-пайплайн (voice, qa, publish-copy, all)
scripts/*.py           Silero/Piper-озвучка и обработка звука
scripts/*.mjs          сборка, гейты, батчи, заглушки таймлайнов
public/assets/         фон, аватары (10 поз), маскот
docs/                  документация пайплайнов и разбор референсов
out/                   результаты рендера (в .gitignore)
```

Шрифты: заголовки — Unbounded, поясняющие элементы — Manrope
(`src/theme/fonts.ts`, через `@remotion/google-fonts`).

## Типовые проблемы

- **`Module not found: src/generated/timeline-*.json`** — не выполнен
  `npm run stub:timelines` после клонирования.
- **`ElevenLabs 401 quota_exceeded`** — не хватает кредитов на длину запроса.
  Кредиты при этом не списываются: ошибка приходит до синтеза. Сократите текст
  реплик или пополните квоту.
- **`Missing required env var(s)`** — нет `.env` с ключом и `ELEVENLABS_VOICE_ID`.
- **Python 3.14** — Silero-зависимости под него не собираются, нужен 3.11.
- Обрыв загрузки Chromium или модели: повторите ту же команду, скачанное
  переиспользуется.
- Windows: если PowerShell блокирует `npm.ps1`, запускайте `npm.cmd run …`.

## Editorial pipeline: Reels factory

New reels use the directed engine. Start at [docs/AI_VIDEO_CREATION_GUIDE.md](docs/AI_VIDEO_CREATION_GUIDE.md). Reference: [design system](docs/VIDEO_DESIGN_SYSTEM.md), [motion](docs/MOTION_SYSTEM.md), [scenes](docs/SCENE_ARCHITECTURE.md), [quality checklist](docs/VIDEO_QUALITY_CHECKLIST.md). `npm run lab` opens the visual explorer.

The original reel pipeline and its outputs remain available. This path turns any valid project JSON into a 1080×1920 H.264 reel using free local tools, Remotion and ElevenLabs. It never publishes. Full guide: [docs/REEL_FACTORY.md](docs/REEL_FACTORY.md).

```bash
npm ci
python3 studio/pipeline.py research space       # free public feeds; optional
python3 studio/pipeline.py rank space           # limited-evidence ranking
python3 studio/pipeline.py draft space          # unverified candidate briefs
node studio/reel.mjs new my-reel --topic "..."  # scaffold a project
node studio/reel.mjs run my-reel --preview-only # 540×960 draft and storyboard
node studio/reel.mjs run my-reel                # full cycle; stops at each gate
node studio/reel.mjs run my-reel --voice        # also allows buying one take
```

Only `--voice` and `studio/voice.mjs` can spend ElevenLabs quota, and only for an approved script. Takes are cached, so re-renders are free. Reference projects: `studio/gps-offline.json`, `studio/projects/demo-tv-acr.json`, `studio/projects/demo-self-ban.json`.
