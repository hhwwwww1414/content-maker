# GhostPepeBot — вертикальный Remotion Reel

Готовый локально воспроизводимый рекламный ролик 1080×1920, 30 FPS. Проект генерирует русскую озвучку Silero V5, оригинальные звуковые эффекты и затем рендерит H.264/AAC MP4 без облачных API и ключей. Видеоверсия намеренно не содержит субтитров.

## Быстрый запуск

Требования: Windows 10/11, macOS или Linux; Node.js LTS; npm; Python 3.11; Git. Для первичной загрузки npm-пакетов, голоса Piper, Chromium и Google Fonts нужен интернет.

```bash
npm install
npm run build:reel
```

Remotion Studio:

```bash
npm run dev
```

Готовые файлы находятся в `out/`:

- `ghostpepe-reel.mp4` — итоговое вертикальное видео;
- `ghostpepe-preview.png` — контрольный кадр;
- `check-frame-01.png` … `check-frame-03.png` — начало, середина и финал.

## Изменение контента

- Сценарий, паузы, CTA и подпись Telegram: `content/reel.json`.
- Цвета: `src/theme/colors.ts`.
- Безопасные поля: `src/theme/layout.ts`.
- Шрифты интерфейса: `src/theme/fonts.ts`. Заголовки используют Unbounded, поясняющие элементы — Manrope.
- Сцены: `src/scenes/`; канонический маскот: `public/assets/mascot/ghostpepe-second.png`; полноэкранный фон: `public/assets/backgrounds/cyberspace-main.png`.

После изменения озвучиваемого текста выполните:

```bash
npm run voice:generate
npm run render
```

Или полностью пересоберите всё командой `npm run build:reel`.

### Другой Silero-голос

1. Укажите `speaker` (`aidar`, `baya`, `kseniya`, `xenia` или `eugene`) в `content/reel.json`.
2. Выполните `npm run voice:generate`.

Модель `v5_5_ru` загружается один раз в `models/silero/` и затем работает локально.

## npm-команды

| Команда | Назначение |
|---|---|
| `npm run dev` | Открыть Remotion Studio |
| `npm run typecheck` | Проверить TypeScript без генерации файлов |
| `npm run tts:setup` | Создать `.venv`, установить зависимости и скачать Silero V5 при необходимости |
| `npm run voice:generate` | Создать естественную WAV-озвучку и timeline |
| `npm run sfx:generate` | Синтезировать пять оригинальных WAV-эффектов |
| `npm run assets:generate` | Последовательно подготовить Silero, озвучку, SFX и метаданные |
| `npm run render:checks` | Отрендерить три контрольных кадра |
| `npm run render:preview` | Создать `ghostpepe-preview.png` |
| `npm run render` | Создать `ghostpepe-reel.mp4` |
| `npm run build:reel` | Полный pipeline: assets → typecheck → кадры → preview → MP4 → verify |
| `npm run verify` | Проверить модель, JSON, WAV, SRT, PNG, MP4, длительности и TypeScript |

## Типовые проблемы Windows

- Если `py -3.11` не найден, установите Python 3.11 x64 через `winget install Python.Python.3.11`, удалите незавершённую `.venv` и повторите команду.
- Если PowerShell блокирует `npm.ps1`, запускайте `npm.cmd run build:reel` или измените политику только для текущего пользователя согласно правилам вашей организации.
- Если загрузка Chromium или модели оборвалась, повторите ту же команду: скачанные и готовые ассеты переиспользуются.
- Если антивирус блокирует ONNX Runtime или Headless Chrome, разрешите локальные файлы проекта и повторите сборку.
- Не используйте Python 3.14: зафиксированные бинарные зависимости рассчитаны на Python 3.11.

Озвучка сохраняется как mono PCM WAV 48 кГц. Длительность сцен строится по реальной длительности каждой реплики.
