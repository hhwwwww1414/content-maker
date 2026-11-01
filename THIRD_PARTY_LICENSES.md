# Сторонние компоненты и лицензии

Этот файл перечисляет найденные лицензии и источники. Он не является юридическим заключением; перед распространением проверьте условия непосредственно в источниках.

| Компонент | Использование | Указанная лицензия | Источник |
|---|---|---|---|
| Remotion и `@remotion/*` | React-видеорендеринг | Remotion License (условия зависят от размера/типа организации) | https://github.com/remotion-dev/remotion/blob/main/LICENSE.md |
| React / React DOM | UI runtime | MIT | https://github.com/facebook/react/blob/main/LICENSE |
| Silero Models / `v5_5_ru` | Локальный русский TTS | Условия опубликованы в официальном репозитории моделей | https://github.com/snakers4/silero-models |
| PyTorch | Выполнение модели Silero | BSD-3-Clause | https://github.com/pytorch/pytorch/blob/main/LICENSE |
| Unbounded | Заголовки и субтитры | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/unbounded |
| Playfair Display | Заголовки темы `paper` в Editorial | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/playfairdisplay |
| Manrope | Поясняющий текст и UI | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/manrope |
| TypeScript | Компиляция | Apache-2.0 | https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt |
| NumPy | Обработка аудио | BSD-3-Clause | https://github.com/numpy/numpy/blob/main/LICENSE.txt |
| SciPy | Ресемплинг и фильтры | BSD-3-Clause | https://github.com/scipy/scipy/blob/main/LICENSE.txt |
| SoundFile | Чтение/запись WAV | BSD-3-Clause | https://github.com/bastibe/python-soundfile/blob/master/LICENSE |
| ONNX Runtime | Выполнение модели Piper | MIT | https://github.com/microsoft/onnxruntime/blob/main/LICENSE |
| Zod | Проверка/типизация данных | MIT | https://github.com/colinhacks/zod/blob/main/LICENSE |

В проект не включены фотостоки, сторонняя музыка, чужие логотипы или заимствованный арт. Маскот, интерфейсные элементы и SFX созданы программно для этого проекта.

## Изученные референсы Editorial

Код этих проектов в репозиторий не копировался и не подключался как зависимость. Все компоненты `src/editorial/kit/` написаны заново.

| Проект | Лицензия | Что учтено | Ограничение |
|---|---|---|---|
| [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | Apache-2.0; аудио Freesound — у каждого файла своя | Идея словаря приёмов и этапа финального просмотра | Звуки и демо-медиа не брались |
| [video-talkcraft](https://github.com/Vincentwei1021/video-talkcraft) | **PolyForm Noncommercial 1.0.0**; коммерческое использование только с разрешения автора | Только общие идеи из описания: один главный элемент на бит, реакция на каждую реплику, проверка на застывание | Код, карточки и шаблоны не использовались и не читались как образец реализации |
| [vertical-video-kit](https://github.com/SDuarteCorredor/vertical-video-kit) | MIT | Разделение произносимого и видимого текста, учёт интерфейса платформ | |
| [mimic-mcp](https://github.com/pouyashahrdami/mimic-mcp) | MIT | Измеряемая проверка готового файла | MCP-сервер не устанавливался |
