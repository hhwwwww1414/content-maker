// Every system in several settings, in the same spec format as a real reel. These are not separate demos:
// they render through DirectedVideo, under the same guard, with evenly timed placeholder words instead of a take.

type Story = {id: string; art: string; variant?: 'base' | 'inverse' | 'block'; voice: string; seconds: number; shot: Record<string, unknown>; field?: string; camera?: Record<string, unknown>; captions?: Record<string, unknown>; assets?: string[]};

export const stories: Story[] = [
  {id: 'custom-loss-phone', art: 'thriller', voice: 'Ты проиграл и теперь готов потерять десять лишь бы вернуть', seconds: 5, shot: {type: 'custom', component: 'lossPhone', props: {darkCue: 'потерять', tenCue: 'десять', buttonCue: 'вернуть'}, review: 'Телефон-монолит: объект со своим светом в комнате'}},
  {id: 'custom-zero-corridor', art: 'thriller', voice: 'Ещё одна попытка минус две минус пять минус десять ноль всё дальше а шаг всё дороже', seconds: 7, shot: {type: 'custom', component: 'zeroCorridor', props: {amounts: ['−1 000', '−2 000', '−5 000', '−10 000'], cues: ['минус', 'минус#2', 'минус#3'], farCue: 'ноль', costCue: 'шаг'}, review: 'Сужающийся коридор с отступающим нулём'}},
  {id: 'custom-decision-fall', art: 'thriller', voice: 'Хотел остановиться верну и уйду звучит как план а это ещё одна ставка', seconds: 6, shot: {type: 'custom', component: 'decisionFall', props: {panes: ['Хватит', 'Ещё одна', 'Верну и уйду', 'Последняя'], hits: ['остановиться', 'уйду', 'план', 'ставка'], planCue: 'верну', betCue: 'ставка', plan: '«Верну и уйду»', bet: 'ещё одна ставка'}, review: 'Падение сквозь разбивающиеся слои'}},
  {id: 'custom-quiet-button', art: 'thriller', voice: 'Может и не вернёшь зато следующая ещё твоя', seconds: 5, shot: {type: 'custom', component: 'quietButton', props: {stopCue: 'вернёшь', leaveCue: 'зато', offCue: 'следующая', lineCue: 'следующая', line: 'Следующая всё ещё *твоя*'}, review: 'Обратный первый кадр: экран гаснет, в комнате снова свет'}},
  {id: 'type-poster', art: 'bold', voice: 'Один простой запрет изменил весь рынок', seconds: 4, shot: {type: 'type', layout: 'poster', anchor: 'center', headline: {text: 'Один запрет / изменил / *весь рынок*', cue: 'Один', emphasis: 'marker'}, ghost: '1'}},
  {id: 'type-stack-disc', art: 'dimensional', voice: 'Подписка продлилась сама и никто не заметил', seconds: 4, shot: {type: 'type', layout: 'stack', anchor: 'top', shape: 'disc', shapeCue: 'продлилась', headline: {text: 'Подписка продлилась *сама*', cue: 'Подписка'}, sub: {text: 'И никто этого не заметил', cue: 'никто'}}},
  {id: 'type-chars', art: 'luxury', voice: 'Тишина стоит дорого', seconds: 3, shot: {type: 'type', layout: 'stack', anchor: 'center', headline: {text: 'Тишина стоит *дорого*', cue: 'Тишина', reveal: 'chars'}}},
  {id: 'type-spoken', art: 'culture', variant: 'inverse', voice: 'Лента не показывает всё. Она показывает то что тебя удержит.', seconds: 5, captions: {mode: 'off'}, shot: {type: 'type', layout: 'spoken', anchor: 'center', headline: {text: 'Лента не показывает всё. Она показывает то, что тебя *удержит*.', cue: 'Лента', reveal: 'spoken', role: 'statement'}}},
  {id: 'type-strike', art: 'editorial', voice: 'Договор больше не защищает покупателя', seconds: 4, shot: {type: 'type', layout: 'stack', anchor: 'center', headline: {text: 'Договор больше не *защищает*', cue: 'Договор', emphasis: 'strike', emphasisCue: 'защищает'}}},
  {id: 'type-window', art: 'documentary', voice: 'Поля больше нет а рынок остался', seconds: 4, assets: ['poppy-farmer'], field: 'solid', shot: {type: 'type', layout: 'window', anchor: 'center', fill: 'poppy-farmer', headline: {text: 'Поля / больше / нет', cue: 'Поля', reveal: 'none'}}},
  {id: 'media-callouts', art: 'documentary', voice: 'Вот это поле снято весной прямо перед сбором', seconds: 5, assets: ['poppy-field-c'], shot: {type: 'media', grade: 'warm', reveal: 'wipe', plates: [{asset: 'poppy-field-c', focus: [0.4, 0.6], zoom: 1.05, endZoom: 1.3, endFocus: [0.46, 0.55], callouts: [{at: [0.5, 0.48], text: 'Сборщики', cue: 'снято', side: 'left'}]}], title: {text: 'Весна, *перед сбором*', cue: 'Вот'}}},
  {id: 'media-video', art: 'documentary', voice: 'Земля ночью показывает где живут люди', seconds: 4, assets: ['earth-clip'], shot: {type: 'media', grade: 'cold', plates: [{asset: 'earth-clip', focus: [0.6, 0.62], zoom: 1.6}], title: {text: 'Земля *ночью*', cue: 'Земля'}, titleAnchor: 'bottom'}},
  {id: 'media-noir', art: 'luxury', voice: 'Ночной город никогда не спит', seconds: 3, assets: ['earth-night'], shot: {type: 'media', grade: 'noir', reveal: 'iris', plates: [{asset: 'earth-night', focus: [0.5, 0.5], zoom: 1.2}], title: {text: 'Город *не спит*', cue: 'Ночной'}}},
  {id: 'data-counter', art: 'documentary', variant: 'block', voice: 'За год украли сорок два миллиарда рублей', seconds: 4, shot: {type: 'data', mode: 'counter', value: 42, cue: 'За', landCue: 'миллиарда', unit: 'млрд ₽', label: 'за один год'}},
  {id: 'data-counter-long', art: 'culture', voice: 'Сегодня там миллион двести тысяч человек', seconds: 4, shot: {type: 'data', mode: 'counter', value: 1200000, cue: 'Сегодня', landCue: 'тысяч', roll: 'count', label: 'человек сегодня'}},
  {id: 'data-bars', art: 'bold', voice: 'В начале года пять потом двенадцать а сейчас двадцать один', seconds: 5, shot: {type: 'data', mode: 'bars', title: {text: 'Рост за *год*', cue: 'начале'}, items: [{label: 'зима', value: 5, cue: 'пять'}, {label: 'лето', value: 12, cue: 'двенадцать'}, {label: 'сейчас', value: 21, cue: 'двадцать', highlight: true}]}},
  {id: 'data-units', art: 'editorial', variant: 'inverse', voice: 'Из сотни человек это делает каждый четвёртый', seconds: 4, shot: {type: 'data', mode: 'units', total: 100, highlight: 25, columns: 10, glyph: 'dot', cue: 'Из', highlightCue: 'четвёртый', title: {text: 'Каждый *четвёртый*', cue: 'Из'}}},
  {id: 'data-line', art: 'culture', variant: 'inverse', voice: 'Сначала цена стояла потом резко пошла вверх', seconds: 5, shot: {type: 'data', mode: 'line', cue: 'Сначала', seconds: 3.6, points: [10, 11, 10, 12, 11, 14, 20, 34, 52, 80], end: '×8', title: {text: 'Цена *пошла вверх*', cue: 'Сначала'}, labels: [{at: 5, text: 'Стояла', cue: 'стояла'}]}},
  {id: 'device-call', art: 'culture', variant: 'inverse', voice: 'Звонит незнакомый номер и говорит спокойно', seconds: 4, shot: {type: 'device', layout: 'hero', screen: {app: 'call', name: 'Неизвестный', detail: 'Москва', answerCue: 'говорит', lines: [{text: 'Это из банка', cue: 'спокойно'}]}}},
  {id: 'device-chat', art: 'bold', voice: 'Сначала приветствие потом просьба перевести деньги', seconds: 5, shot: {type: 'device', layout: 'rise', title: {text: 'Обычный *чат*', cue: 'Сначала'}, screen: {app: 'chat', title: 'Мама', items: [{from: 'them', text: 'Привет, ты тут?', cue: 'приветствие'}, {from: 'me', text: 'Да', cue: 'потом'}, {from: 'them', text: 'Переведи деньги', cue: 'просьба'}]}}},
  {id: 'device-notifications', art: 'dimensional', voice: 'Телефон лежит а уведомления идут всю ночь', seconds: 4, shot: {type: 'device', layout: 'hero', screen: {app: 'notifications', clock: '3:12', date: 'Вторник', items: [{app: 'Банк', text: 'Вход с нового устройства', cue: 'лежит', urgent: true}, {app: 'Почта', text: 'Пароль изменён', cue: 'уведомления'}, {app: 'Банк', text: 'Перевод 40 000 ₽', cue: 'идут', urgent: true}]}}},
  {id: 'device-bank', art: 'editorial', variant: 'inverse', voice: 'За минуту баланс стал почти нулевым', seconds: 4, shot: {type: 'device', layout: 'macro', screen: {app: 'bank', title: 'Основной счёт', balance: 248300, to: 310, balanceCue: 'баланс', items: [{text: 'Перевод', amount: '−120 000 ₽', cue: 'минуту'}, {text: 'Перевод', amount: '−127 990 ₽', cue: 'стал'}]}}},
  {id: 'device-settings', art: 'culture', voice: 'Эта настройка включена у всех по умолчанию', seconds: 4, shot: {type: 'device', layout: 'hero', poses: [{cue: 'включена', scale: 0.94, ry: 0, rx: 0, rz: 0, y: -10}], screen: {app: 'settings', title: 'Настройки', items: [{text: 'Обновления', on: true}, {text: 'Сбор данных', on: true, flipCue: 'умолчанию', focus: true}, {text: 'Геолокация', on: false}]}}},
  {id: 'device-feed', art: 'dimensional', variant: 'inverse', voice: 'Лента разгоняет то что вызывает злость', seconds: 4, shot: {type: 'device', layout: 'offset', screen: {app: 'feed', title: 'Лента', scrollCue: 'разгоняет', items: [{author: 'Анна', text: 'Это возмутительно', likes: 48211, cue: 'вызывает', asset: 'earth-night'}, {author: 'Иван', text: 'Как такое возможно', likes: 12044}]}}},
  {id: 'device-browser', art: 'culture', voice: 'Сайт выглядит настоящим но адрес другой', seconds: 4, shot: {type: 'device', layout: 'hero', screen: {app: 'browser', url: 'sberbank-online.ru.net', typeCue: 'Сайт', heading: 'Вход в банк', body: 'Введите код из СМС', warning: {text: 'Адрес другой', cue: 'адрес'}}}},
  {id: '3d-tower', art: 'editorial', voice: 'Монета за монетой выросла целая гора долга', seconds: 4, shot: {type: 'stage3d', preset: 'tower', count: 24, piece: 'coin', buildCue: 'Монета', seconds: 2.4, title: {text: 'Гора *долга*', cue: 'Монета'}}},
  {id: '3d-tower-collapse', art: 'bold', variant: 'block', voice: 'Башня росла пока одно решение её не обрушило', seconds: 4, shot: {type: 'stage3d', preset: 'tower', count: 9, piece: 'box', buildCue: 'Башня', seconds: 1.2, collapseCue: 'обрушило', title: {text: 'Башня *упала*', cue: 'Башня'}}},
  {id: '3d-spotlight-tv', art: 'documentary', voice: 'Телевизор в комнате смотрит на тебя', seconds: 4, shot: {type: 'stage3d', preset: 'spotlight', object: 'tv', lightCue: 'смотрит', title: {text: 'Он *смотрит*', cue: 'Телевизор'}}},
  {id: '3d-spotlight-key', art: 'luxury', voice: 'Один ключ открывает все двери', seconds: 3, shot: {type: 'stage3d', preset: 'spotlight', object: 'key', lightCue: 'ключ', spinCue: 'открывает', title: {text: 'Один *ключ*', cue: 'Один'}}},
  {id: '3d-orbit', art: 'documentary', voice: 'Спутники видят телефон и находят точку', seconds: 5, assets: ['earth-map'], shot: {type: 'stage3d', preset: 'orbit', satellites: 4, texture: 'earth-map', pin: [55.7, 37.6], signalCue: 'видят', lockCue: 'находят', orbit: 0, title: {text: 'Четыре *сигнала*', cue: 'Спутники'}}},
  {id: 'split-versus', art: 'editorial', voice: 'Было так а стало совсем иначе', seconds: 4, shot: {type: 'split', axis: 'vertical', start: 0.5, a: {kicker: 'Было', value: '41%'}, b: {kicker: 'Стало', value: '85%', variant: 'block'}, keys: [{cue: 'стало', at: 0.34}]}},
  {id: 'split-takeover', art: 'bold', voice: 'Один вариант съедает другой целиком', seconds: 4, shot: {type: 'split', axis: 'horizontal', start: 0.5, a: {word: 'Рынок', variant: 'base'}, b: {word: 'Запрет', variant: 'block'}, keys: [{cue: 'съедает', at: 0.14}]}},
  {id: 'timeline-corridor', art: 'documentary', voice: 'В марте запрет в июне суд а в декабре решение', seconds: 5, shot: {type: 'timeline', style: 'corridor', events: [{date: 'Март', text: 'Запрет', cue: 'марте'}, {date: 'Июнь', text: 'Суд', cue: 'июне'}, {date: 'Декабрь', text: 'Решение', cue: 'декабре'}]}},
  {id: 'timeline-rail', art: 'editorial', voice: 'В марте запрет в июне суд а в декабре решение', seconds: 5, shot: {type: 'timeline', style: 'rail', events: [{date: 'Март', text: 'Запрет', cue: 'марте'}, {date: 'Июнь', text: 'Суд', cue: 'июне'}, {date: 'Декабрь', text: 'Решение *суда*', cue: 'декабре'}]}},
  {id: 'collage-desk', art: 'editorial', voice: 'Справка заявление и штамп который всё решил', seconds: 5, assets: ['poppy-field-c'], shot: {type: 'collage', impactCue: 'штамп', pieces: [{kind: 'photo', asset: 'poppy-field-c', box: [420, 290, 500, 380], rotate: 5, cue: 'Справка'}, {kind: 'document', box: [110, 520, 620, 700], rotate: -3, cue: 'заявление', text: 'Заявление', lines: ['Прошу отменить', 'Подпись'], markLine: 0, markCue: 'решил'}, {kind: 'stamp', box: [380, 1040, 500, 150], rotate: -7, cue: 'штамп', text: 'Принято'}]}},
  {id: 'media-cutout', art: 'documentary', voice: 'Передний план живёт отдельно и движется быстрее фона', seconds: 4, assets: ['poppy-field-c', 'lens-cutout'], camera: {move: 'panRight'}, shot: {type: 'media', grade: 'cold', plates: [{asset: 'poppy-field-c', focus: [0.45, 0.6], zoom: 1.1}], foreground: {asset: 'lens-cutout', depth: 1.2, box: [130, 620, 820, 820]}, title: {text: 'Два *плана*', cue: 'Передний'}}},
  {id: 'custom-rings', art: 'culture', variant: 'inverse', voice: 'Три станции замеряют расстояние и находят точку', seconds: 4, shot: {type: 'custom', component: 'signalRings', props: {title: 'Три *станции*', cue: 'Три'}, review: 'Reference for the custom path: range circles are not expressible as a system'}, },
  {id: 'journey-climb', art: 'dimensional', voice: 'Запрос идёт на сервер потом в базу и обратно', seconds: 5, shot: {type: 'journey', route: 'climb', nodes: [{text: 'Запрос', icon: 'search', cue: 'Запрос'}, {text: 'Сервер', icon: 'chip', cue: 'сервер'}, {text: 'База', icon: 'lock', cue: 'базу'}], overviewCue: 'обратно'}},
  {id: 'journey-sideways', art: 'luxury', voice: 'От покупателя к банку и затем к продавцу', seconds: 5, shot: {type: 'journey', route: 'zigzag', nodes: [{text: 'Покупатель', icon: 'user', cue: 'покупателя'}, {text: 'Банк', icon: 'bank', cue: 'банку'}, {text: 'Продавец', icon: 'house', cue: 'продавцу'}]}},
];

const TRANSITIONS: Array<Record<string, unknown>> = [
  {type: 'cut'}, {type: 'push', direction: 'up'}, {type: 'push', direction: 'left'}, {type: 'through', origin: [0.5, 0.45]},
  {type: 'mask', shape: 'circle', origin: [0.5, 0.5]}, {type: 'mask', shape: 'diamond', origin: [0.3, 0.6]}, {type: 'mask', shape: 'diagonal'}, {type: 'mask', shape: 'bars'}, {type: 'mask', shape: 'rise'},
  {type: 'field', origin: [0.5, 0.8]}, {type: 'morph', from: [300, 800, 480, 480], color: 'accent'}, {type: 'glyph', glyph: 'О'}, {type: 'depth'},
];

const fakeWords = (voice: string, start: number, seconds: number) => {
  const words = voice.trim().split(/\s+/);
  const step = (seconds * 1000 - 500) / words.length;
  return words.map((text, i) => ({text, startMs: Math.round(start * 1000 + i * step + 120), endMs: Math.round(start * 1000 + (i + 1) * step + 60), timestampMs: null, confidence: null}));
};

const direct = (story: Story, transition?: Record<string, unknown>) => ({
  purpose: 'explain', emotion: 'проверка', concept: `Lab story ${story.id} for visual review`, hierarchy: {primary: story.id},
  art: {variant: story.variant ?? 'base', ...(story.field ? {field: story.field} : {})},
  shot: story.shot, assets: story.assets ?? [], source: 'hide', ...(story.camera ? {camera: story.camera} : {}), ...(story.captions ? {captions: story.captions} : {}), ...(transition ? {transition} : {}),
});

/** A one-scene reel from a story. */
export const storyProject = (story: Story) => ({
  id: `lab-${story.id}`, fps: 30, width: 1080, height: 1920, durationSeconds: story.seconds, art: {direction: story.art},
  sources: [], audio: {}, captions: fakeWords(story.voice, 0, story.seconds),
  scenes: [{id: story.id, start: 0, duration: story.seconds, voice: story.voice, onScreen: '', sources: [], direction: direct(story)}],
});

/** Two scenes joined by one transition, for reviewing it in context. */
export const transitionProject = (index: number) => {
  const t = TRANSITIONS[index];
  const a = stories.find((s) => s.id === 'type-strike')!;
  const b = stories.find((s) => s.id === 'data-counter')!;
  return {
    id: `lab-transition-${index}`, fps: 30, width: 1080, height: 1920, durationSeconds: 5, art: {direction: 'editorial'},
    sources: [], audio: {}, captions: [...fakeWords(a.voice, 0, 2.5), ...fakeWords(b.voice, 2.5, 2.5)],
    scenes: [
      {id: 'a', start: 0, duration: 2.5, voice: a.voice, onScreen: '', sources: [], direction: direct(a)},
      {id: 'b', start: 2.5, duration: 2.5, voice: b.voice, onScreen: '', sources: [], direction: {...direct(b), art: {variant: 'inverse', direction: 'documentary'}, transition: t}},
    ],
  };
};
export const transitionNames = TRANSITIONS.map((t, i) => `${i}-${t.type}${t.shape ? `-${t.shape}` : ''}${t.direction ? `-${t.direction}` : ''}`);
