# ElevenLabs reels

Отдельная ветка форматов рядом с GhostPepe-роликами: озвучка через **ElevenLabs**
(а не Silero), **кинетические субтитры** по реальному character-alignment вместо
phrase-level caption pages, и один накапливающийся холст вместо набора сцен.

Пайплайн общий и параметризован по slug — новый ролик требует только
`content/<slug>-reel.json` и свою Remotion-композицию.

| # | Slug | Composition | Сцены ролика | npm-префикс |
|---|---|---|---|---|
| 1 | `vibe-coding-trust` | `VibeCodingTrustReel` | `components/vibe/` | `reel:vibe` |
| 2 | `vpn-age-verification` | `VpnAgeVerificationReel` | `components/vpn/scenes` | `reel:vpn` |
| 3 | `ai-cheated-test` | `AiCheatedTestReel` | `components/aitest/` | `reel:ai-test` |
| 4 | `website-controls-ai` | `WebsiteControlsAiReel` | `components/injection/` | `reel:prompt-injection` |
| 5 | `how-sites-detect-vpn` | `HowSitesDetectVpnReel` | `components/vpndetect/` | `reel:vpn-detection` |
| 6 | `passkey-explained` | `PasskeyExplainedReel` | `components/passkey/` | `reel:passkey` |
| 7 | `ai-browser-hijack` | `AiBrowserHijackReel` | `components/agentbrowser/` | `reel:agent-browser` |

Ролик 1 — единственный на светлом холсте `#F3F3EF` с палитрой `vibe`. Ролики
2–7 идут поверх зацикленного `public/assets/background.mp4` с палитрой `night`
(белый текст на затемнённом видео) и `qa.contentPolarity: light-on-dark`.

Ролики 4–6 — связанная серия: каждый заканчивается тизером следующего
(prompt injection → определение VPN → passkey), и её начинает тизер ролика 3.

Ролик 7 продолжает линию ролика 4, но с другим тезисом. Ролик 4 объясняет, что
чужой текст на странице может стать командой; ролик 7 — что агентный браузер
исполняет её **внутри уже залогиненной сессии пользователя**, поэтому граница
проходит по правам агента, а не по «уму» модели.

Общие между роликами: `AvatarZone` (есть режим `sticker` для видео-фона),
`KineticCaptions` (принимает `palette`), `primitives`, `theme`,
`components/vpn/frames` (`ChapterHead`, `ChipRail`, `MemoryFrame`, `CtaFrame`,
`SourceBadge`), `components/kit/ContactSheet` и весь `scripts/eleven/`.

`CtaFrame` принимает либо пару `optionA`/`optionB`, либо список `options`
(`{label, tone, atMs}`) на 0–3 ответа — открытый вопрос без вариантов
(ролик 5) просто не передаёт список.

## Команды

```bash
npm run reel:vibe:all             # весь пайплайн первого ролика
npm run reel:vpn:all              # второй
npm run reel:ai-test:all          # третий
npm run reel:prompt-injection:all # четвёртый
npm run reel:vpn-detection:all    # пятый
npm run reel:passkey:all          # шестой
npm run reel:agent-browser:all    # седьмой

npm run reel:vpn:voice           # озвучка + тайминги + кластеры (кэш по хешу)
npm run reel:vpn:voice:force     # принудительно перезапросить у ElevenLabs
npm run reel:vpn:render          # MP4
npm run reel:vpn:sheet           # contact sheet PNG
npm run reel:vpn:copy            # публикационные материалы
npm run reel:vpn:qa              # QA по отрендеренному MP4
npm run reel:vpn:preview         # remotion studio
```

Каждый шаг можно вызвать и напрямую: `node scripts/eleven/qa.mjs --slug <name>`.

## Озвучка

Пайплайн озвучки переписан: чанкинг по сценам, дубли, Audio Tags и мастеринг.
Подробно — [VOICE.md](VOICE.md). Итог теперь WAV 48 кГц, а не MP3.

## Секреты

`.env` (в `.gitignore`), образец — `.env.example`:

```env
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

Ключ не попадает в исходники, JSON, логи и метаданные рендера: логи проходят
через `redact()`, а QA сканирует все файлы, видимые git
(`git ls-files --cached --others --exclude-standard`), на паттерн `sk_…` и на
точное значение ключа.

**Кэш.** `generate-voice.mjs` считает `sha256(text | voiceId | modelId |
outputFormat | speed)`. Совпал с `public/generated/<slug>/voiceover-meta.json` —
запрос к API не отправляется. `--force` игнорирует кэш.

## Как устроен тайминг

`voice segment ≠ сцена`. Один непрерывный холст, состояния которого меняются:

1. `content/<slug>-reel.json` описывает `lines` (реплики), `chapters`,
   `avatarStates`, `canvasActions`, `memoryFrame`, `cta` — всё привязано к
   **id реплики**, а не к секундам.
2. `generate-voice.mjs` склеивает реплики в один запрос, запоминает
   `[charStart, charEnd)` каждой, получает character-level alignment и
   проецирует его обратно: реплика → `startMs/endMs`, действие → `atMs/untilMs`.
3. Композиция читает готовый `src/generated/timeline-<slug>.json`.
   Никаких сетевых запросов и `Math.random()` во время рендера.

`breakAfter` реплики управляет паузой в озвучке: `soft` (пробел), `line`,
`block` (реальная пауза), `none`. `tts.speed` — скорость ElevenLabs, потолок 1.2.

`lifecycle` элемента: `persistent` (схема, накопленные чипы), `chapter`
(карточки главы), `transient` (подсветки, перечёркивания, tint).

## Видео-фон

Объявляется в content JSON:

```json
"background": {"type": "loop-video", "file": "assets/background.mp4", "muted": true, "fit": "cover", "overlayOpacity": 0.42}
```

`generate-voice.mjs` проверяет наличие файла **до** вызова ElevenLabs и меряет
его длительность через ffprobe, записывая `sourceSeconds` в timeline. В
установленной версии Remotion у `OffthreadVideo` нет пропа `loop`, поэтому
повторение обеспечивает официальный `<Loop durationInFrames={...}>`. Поверх
видео идут три постоянных слоя: плоское затемнение, вертикальный градиент под
текстовыми зонами и мягкая виньетка. Кратковременные tint'ы (красный/мятный/
split) живут отдельным слоем и не превышают 11 % непрозрачности.

## Кинетические субтитры

`captionMode: kinetic-clusters`. Кластер — 1–3 слова; растёт, пока короче
`growUntilSeconds`, и никогда не заканчивается на предлоге/служебном слове
(список — в `captionClusters.functionWords`). Кластер длиннее 1.05 с делится
пополам. Каждый висит до начала следующего, но не дольше 260 мс после реплики,
поэтому средняя смена попадает в 0.55–0.85 с.

`highlightWords` — либо плоский список (один акцент), либо карта тонов:

```json
"highlightWords": {"mint": ["брифинг"], "yellow": ["ви-пи-эн"], "red": ["запретят"]}
```

Размер шрифта подбирается под ширину слота, чтобы длинное слово не вылезало за
safe zone.

Слова, транслитерированные ради TTS, показываются на экране в исходном виде
через `captionClusters.displayReplacements` (`{"ви-пи-эн": "VPN"}`). Подсветка и
кластеризация по-прежнему работают по произносимой форме.

## QA

`scripts/eleven/qa.mjs` проверяет **отрендеренный MP4**, а не план: `ffprobe`
даёт длительность/разрешение/fps/аудиодорожку, кадры вытаскиваются из готового
файла, и измеряется доля «чернил» внутри Instagram unsafe-зон из
`src/reel-system/layout/safe-area.config.json`.

Общие пороги: длительность из `qa.durationSeconds` (по умолчанию 52–68 с),
первый смысловой кадр ≤ 0.25 с, ≥ 80 % кластеров в 1–3 словах, средняя смена
0.55–0.85 с, максимум 3.5 с без смыслового изменения (окно memory frame
исключено — это намеренно удерживаемый кадр, у него свой порог ≥ 2.8 с),
unsafe-зоны чистые, ключ не утёк.

«Контент» в safe-zone-проверке определяется полярностью ролика
(`qa.contentPolarity`): на бумажном холсте это тёмные пиксели, на затемнённом
видео — светлые. По умолчанию выводится из наличия `background`. С неверной
полярностью проверка показывает 100 % покрытия везде и становится бессмысленной.

Для роликов с видео-фоном дополнительно: файл на месте, в источнике нет
аудиодорожки, и на сэмплах вокруг каждого стыка петли нет чёрных кадров и нет
«застывшего» фона (проверяется средняя яркость кадра и разброс яркости в полосе,
свободной от контента).

Для роликов с `qa.factFraming` работает проверка фактической рамки: каждая
строка, утверждающая запрет (`banPatterns`), должна быть явно помечена как
цитируемый миф (`framing: "myth"` или глава из `mythChapters`), а опровержения
из `requiredTexts` обязаны присутствовать в тексте ролика. Без этого сенсационный
хук нельзя отличить от утверждения.

Отчёты: `out/<slug>-qa.json`.
