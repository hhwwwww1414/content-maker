# МАСТЕР-ПРОМПТ ДЛЯ CODEX: REELS «КАК САЙТ ПОНИМАЕТ, ЧТО У ТЕБЯ VPN»

Ты работаешь внутри моего существующего локального Remotion-репозитория.

Предыдущие ролики уже получились удачными. Не создавай новый видеодвижок с нуля. Сначала изучи существующую архитектуру, затем переиспользуй рабочие компоненты: ElevenLabs, alignment, word-level timings, kinetic captions, avatar registry, background video, safe zones, QA, contact sheet и publish copy.

Не ограничивайся планом. Задача считается выполненной только после рендера MP4, автоматического QA и создания материалов для публикации.

## 1. Режим работы

1. Прочитай `AGENTS.md`, если он существует.
2. Прочитай `package.json`.
3. Найди Remotion root и предыдущие композиции.
4. Выполни `git status`.
5. Не ломай существующие ролики.
6. Все сетевые запросы выполняй до render.
7. Не используй внешние fetch во время render.
8. Рендер должен быть детерминированным.

## 2. Новая композиция

```text
Composition ID: HowSitesDetectVpnReel
Slug: how-sites-detect-vpn
Resolution: 1080x1920
FPS: 30
Language: русский
Target duration: 55–65 секунд
```

Создай:

```text
out/how-sites-detect-vpn-reel.mp4
out/how-sites-detect-vpn-contact-sheet.png
out/how-sites-detect-vpn-qa.json
out/how-sites-detect-vpn-publish-copy.md
```

## 3. ElevenLabs

Используй тот же голос и те же настройки, что в предыдущем удачном ролике.

```env
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=
ELEVENLABS_OUTPUT_FORMAT=mp3_44100_128
```

Правила:

- не сохраняй API-ключ в коде;
- используй endpoint с timestamps/alignment;
- не запускай Whisper, если alignment корректен;
- кэшируй аудио;
- `--force` должен явно обновлять voiceover;
- duration рассчитывай по готовому аудио.

Сохрани:

```text
public/generated/how-sites-detect-vpn/voiceover.mp3
public/generated/how-sites-detect-vpn/alignment.json
public/generated/how-sites-detect-vpn/word-timings.json
public/generated/how-sites-detect-vpn/captions.json
```

## 4. Аватары

Найди и используй только:

```text
avatar-question.png
avatar-excited.png
avatar-shocked.png
avatar-thinking.png
avatar-skeptical.png
avatar-angry.png
avatar-sad.png
avatar-approved.png
avatar-facepalm.png
avatar-idea.png
```

Проверь:

```text
public/assets/avatar/
public/avatar/
public/stickers/
```

Если обязательный ассет отсутствует, остановись до вызова ElevenLabs.

## 5. Background video

Найди:

```text
public/assets/background.mp4
```

Альтернативы:

```text
public/background.mp4
public/assets/background/background.mp4
```

Фон:

- виден весь ролик;
- `objectFit: cover`;
- loop;
- muted;
- не сбрасывается между главами;
- не даёт чёрный кадр в точке цикла;
- является нижним слоем.

Поверх добавь overlay 35–50% и мягкую виньетку.

## 6. Фактическая основа

Используй официальные материалы Cloudflare:

```text
https://developers.cloudflare.com/network/ip-geolocation/
https://developers.cloudflare.com/waf/tools/ip-access-rules/
https://developers.cloudflare.com/cloudflare-challenges/troubleshooting/
https://developers.cloudflare.com/waf/tools/privacy-pass/
```

Корректная рамка:

1. Сайт обычно не получает универсальный сигнал `VPN включён`.
2. Сервис видит публичный IP входящего запроса.
3. По IP можно определить примерную страну, сеть и ASN.
4. Сервис может проверять запросы по IP, диапазону, стране или ASN.
5. Shared VPN и corporate proxy могут иметь плохую IP-репутацию.
6. Один общий IP может использовать большое количество людей.
7. Защитные системы могут объединять IP-сигналы с поведением запроса.
8. Определение VPN часто вероятностное и может ошибаться.
9. Не обещай «невидимый VPN».
10. Не объясняй способы обхода антифрод-систем.

Мелкая подпись:

```text
Источник: Cloudflare Docs
```

## 7. Простая метафора

```text
IP = ОБРАТНЫЙ АДРЕС НА ПОСЫЛКЕ
VPN = ОБЩИЙ ПУНКТ ОТПРАВКИ
САЙТ = ОХРАННИК, КОТОРЫЙ СМОТРИТ НА АДРЕС И ПОВЕДЕНИЕ
```

Главный вывод:

```text
Сайт не видит кнопку VPN.
Он оценивает следы, которые оставляет твой маршрут.
```

## 8. Финальный сценарий озвучки

```text
Когда сайт пишет:
«Отключите VPN»,

кажется,
будто он заглянул прямо в твой телефон.

Но обычно сайт не знает наверняка,
включён у тебя VPN или нет.

Он просто собирает следы.

Первый след — твой IP.

Это как обратный адрес
на интернет-посылке.

По нему сайт видит:

примерную страну

и сеть,
из которой пришёл запрос.

Домашний IP обычно принадлежит
обычному интернет-провайдеру.

А многие VPN выходят
через серверы дата-центров.

Второй след:

с одного IP
могут одновременно приходить
сотни пользователей.

Для обычной квартиры
это довольно странно.

Третий след — репутация адреса.

Если с этого IP раньше шёл спам,
боты
или слишком много подозрительных запросов,

сервис начинает ему меньше доверять.

Потом сайт складывает признаки:

чей это адрес,

из какой он страны,

сколько людей им пользуются,

и похоже ли поведение
на обычного человека.

Поэтому один VPN работает,

а другой сразу получает проверку
или блокировку.

Сайт не видит кнопку VPN.

Он видит следы,
которые оставляет твой маршрут.

Поэтому фраза
«полностью невидимый VPN»
чаще всего является рекламой.

Какой сервис чаще всего
просит тебя отключить VPN?

Напиши его название.

А следующим роликом я объясню,
почему вход по лицу
может быть безопаснее пароля.
```

Подача:

- начало с лёгкой иронией;
- после «Он просто собирает следы» сделать паузу;
- три следа произнести как понятный список;
- `IP` произносить «ай-пи»;
- `ASN` не произносить в voiceover;
- не звучать как техническая лекция;
- «Сайт не видит кнопку VPN» выделить;
- финальный вопрос — естественно.

## 9. Визуальный движок

Один непрерывный холст:

```text
LoopingBackground
  ├── ReadabilityOverlay
  ├── SourceBadge
  ├── PersistentCanvas
  ├── AvatarZone
  ├── KineticCaptions
  ├── TakeawayChips
  └── MemoryFrame
```

Основная схема:

```text
ТЫ
↓
VPN-СЕРВЕР
↓
ОБЩИЙ IP
↓
САЙТ-ОХРАННИК
↓
ОЦЕНКА РИСКА
```

Рисуй через CSS/SVG:

```text
смартфон
домашний роутер
VPN-тоннель
дата-центр
IP-карточка
карта мира
счётчик пользователей
шкала репутации
машина оценки риска
```

Не используй реальные логотипы сервисов.

## 10. Покадровая режиссура

Тайминги привяжи к alignment.

### Глава 1 — Хук, 0–6 секунд

Аватар:

```text
avatar-question.png
```

Крупно:

```text
КАК САЙТ
ВИДИТ ТВОЙ VPN?
```

Затем:

```text
ОН НЕ ЗАГЛЯДЫВАЕТ
В ТЕЛЕФОН
```

Покажи смартфон, где кнопка VPN скрыта от сайта.

### Глава 2 — Первый след: IP, 6–18 секунд

Аватар:

```text
avatar-thinking.png
```

Интернет-посылка с обратным адресом:

```text
IP = ОБРАТНЫЙ АДРЕС
```

Из карточки:

```text
СТРАНА
СЕТЬ
```

Мелко допускается:

```text
ASN — сеть владельца адреса
```

### Глава 3 — Дом или дата-центр, 18–29 секунд

Аватар:

```text
avatar-skeptical.png
```

Сравнение:

```text
ДОМАШНИЙ ПРОВАЙДЕР
VS
ДАТА-ЦЕНТР
```

Домашний адрес — один дом.
VPN-адрес — серверный шкаф с множеством линий.

Takeaway:

```text
АДРЕС ВЫГЛЯДИТ
НЕ КАК ДОМАШНИЙ
```

### Глава 4 — Общий IP, 29–39 секунд

Аватар:

```text
avatar-shocked.png
```

К одному IP подключаются точки.

Счётчик:

```text
1 → 10 → 100 → 500
```

Крупно:

```text
СОТНИ ЛЮДЕЙ
С ОДНОГО АДРЕСА
```

Не утверждай, что это всегда VPN.

### Глава 5 — Репутация, 39–49 секунд

Аватар:

```text
avatar-facepalm.png
```

Шкала:

```text
ЧИСТЫЙ
СОМНИТЕЛЬНЫЙ
ПЛОХАЯ РЕПУТАЦИЯ
```

Абстрактные метки:

```text
СПАМ
БОТЫ
СЛИШКОМ МНОГО ЗАПРОСОВ
```

### Глава 6 — Итоговая оценка, 49–58 секунд

Аватар:

```text
avatar-idea.png
```

Карточки:

```text
IP
СТРАНА
СЕТЬ
ОБЩИЙ АДРЕС
РЕПУТАЦИЯ
ПОВЕДЕНИЕ
```

Они входят в:

```text
ОЦЕНКА РИСКА
```

Выходы:

```text
РАЗРЕШИТЬ
ПРОВЕРИТЬ
ЗАБЛОКИРОВАТЬ
```

### Глава 7 — Memory frame и CTA

Аватар:

```text
avatar-approved.png
```

Memory frame минимум 3 секунды:

```text
САЙТ НЕ «ВИДИТ VPN»

ОН ПРОВЕРЯЕТ:
IP · СТРАНУ · СЕТЬ · РЕПУТАЦИЮ · ПОВЕДЕНИЕ
```

CTA:

```text
КАКОЙ СЕРВИС
ЧАЩЕ ВСЕГО БЛОКИРУЕТ ТВОЙ VPN?
```

## 11. Kinetic captions

```text
captionMode: kinetic-clusters
```

- 1–3 слова;
- 0.55–0.85 секунды;
- максимум 2 строки;
- смысловые кластеры;
- exact timings из ElevenLabs;
- caption canvas не прыгает.

Приоритетные слова:

```text
ОТКЛЮЧИТЕ VPN
НЕ ЗНАЕТ НАВЕРНЯКА
СЛЕДЫ
IP
ОБРАТНЫЙ АДРЕС
СТРАНА
СЕТЬ
ДАТА-ЦЕНТР
СОТНИ ЛЮДЕЙ
РЕПУТАЦИЯ
ОЦЕНКА РИСКА
НЕВИДИМЫЙ VPN
```

## 12. Content JSON

```json
{
  "id": "how-sites-detect-vpn",
  "visualEngine": "avatar-persistent-canvas",
  "background": {
    "type": "loop-video",
    "file": "assets/background.mp4",
    "muted": true,
    "fit": "cover"
  },
  "captionMode": "kinetic-clusters",
  "voiceoverFile": "generated/how-sites-detect-vpn/voiceover.mp3",
  "source": {
    "primary": "Cloudflare Docs",
    "topic": "IP-based VPN and proxy risk signals"
  },
  "chapters": [],
  "canvasActions": [],
  "memoryFrame": {},
  "cta": {}
}
```

## 13. Команды

```json
{
  "scripts": {
    "reel:vpn-detection:voice": "...",
    "reel:vpn-detection:preview": "...",
    "reel:vpn-detection:render": "...",
    "reel:vpn-detection:qa": "...",
    "reel:vpn-detection:all": "..."
  }
}
```

## 14. Publish copy

Обложка:

```text
КАК САЙТ
ВИДИТ ТВОЙ VPN
```

Подпись:

```text
Сервис обычно не получает готовый сигнал:
«у пользователя включён VPN».

Он видит публичный IP и оценивает признаки:
страну, сеть, количество пользователей,
репутацию адреса и поведение запросов.

Поэтому один VPN работает,
а другой сразу получает проверку.

Какой сервис чаще всего просит тебя отключить VPN?
```

Хэштеги:

```text
#vpn #интернет #приватность #кибербезопасность #технологии
```

## 15. QA

Создай:

```text
out/how-sites-detect-vpn-qa.json
```

Проверь:

- MP4 существует;
- длительность 50–70 секунд;
- ролик не обещает абсолютную точность определения VPN;
- нет инструкций по обходу антифрода;
- `ASN` объяснён или не произносится;
- background.mp4 покрывает весь ролик и muted;
- первый смысловой кадр до 0.25 секунды;
- captions в среднем 0.55–0.85 секунды;
- memory frame минимум 2.8 секунды;
- safe zones пройдены;
- API-ключ не попал в файлы;
- итоговый статус `passed`.

Финальный результат:

```text
out/how-sites-detect-vpn-reel.mp4
```
