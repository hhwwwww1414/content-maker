/**
 * Retrieved research for batch 2026-07-25-a1.
 *
 * Every temporally volatile claim carries its source, publisher, publish date and
 * the date it was retrieved. Nothing here is invented: each entry was fetched from
 * the listed URL during the research stage of this batch run.
 */

export const RETRIEVED_AT = '2026-07-25';

export const sources = [
  {
    id: 'src-ixbt-wifi',
    publisher: 'iXBT.com',
    title: 'Публичный Wi-Fi переживает бум на фоне проблем с мобильным интернетом',
    url: 'https://www.ixbt.com/news/2026/07/22/wi-fi-4-1-wi-fi-2026.html',
    publishedAt: '2026-07-22',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'tech-media',
    primarySource: false,
    confidence: 'high',
    shortEvidence:
      '4,1 млрд сессий в публичных Wi-Fi за первое полугодие 2026, 3,6 млн ГБ трафика, рост в 3,5 раза год к году; данные оператора Hot-WiFi. Спрос начал расти летом 2025 после первых массовых ограничений мобильного интернета.',
  },
  {
    id: 'src-obit-wifi',
    publisher: 'ОБИТ (телеком-оператор)',
    title: 'На фоне перебоев мобильного интернета спрос на публичный Wi-Fi вырос на 29%',
    url: 'https://obit.ru/press-center/news/na-fone-pereboev-mobilnogo-interneta-spros-na-publichnyy-wi-fi-vyros-na-29/',
    publishedAt: '2026-06-01',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'operator-press-release',
    primarySource: true,
    confidence: 'medium',
    shortEvidence:
      'Независимое подтверждение тренда со стороны оператора связи: спрос на публичный Wi-Fi вырос на 29% на фоне перебоев мобильного интернета.',
  },
  {
    id: 'src-bitwifi-1667',
    publisher: 'BitWiFi',
    title: 'Закон об авторизации в публичных Wi-Fi сетях на территории РФ',
    url: 'https://bitwifi.ru/blog/zakon-ob-avtorizatsii-v-wi-fi-setyakh/',
    publishedAt: '2026-04-10',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'industry-documentation',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'Постановление №1667 расширило перечень угроз и обязало владельцев сетей в публичных местах (кафе, аэропорты) идентифицировать пользователей; бесплатный гостевой Wi-Fi всё равно считается услугой связи.',
  },
  {
    id: 'src-ria-whitelist',
    publisher: 'РИА Новости',
    title: 'Белый список сайтов: какие сервисы работают при отключении мобильного интернета',
    url: 'https://ria.ru/20260312/belyy-spisok-saytov-2080159945.html',
    publishedAt: '2026-03-12',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'major-news-agency',
    primarySource: false,
    confidence: 'high',
    shortEvidence:
      'Белый список формирует Минцифры вместе с операторами; в нём десятки категорий — госпорталы, банки, маркетплейсы, СМИ, транспорт. Фильтрация идёт на уровне DNS-запроса и IP-адреса, операторы применяют DPI для распознавания доменных имён.',
  },
  {
    id: 'src-klerk-whitelist',
    publisher: 'Клерк.ру',
    title: 'Белый список сайтов при отключении интернета: обновлённый перечень',
    url: 'https://www.klerk.ru/buh/articles/674375/',
    publishedAt: '2025-12-29',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'business-media',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'Независимое подтверждение: к марту 2026 список расширился до нескольких сотен ресурсов, обновления приходят централизованно от Минцифры. Обновлено 19.03.2026.',
  },
  {
    id: 'src-mts-whitelist',
    publisher: 'МТС Медиа',
    title: 'Белый список сайтов при ограничениях в мобильном интернете',
    url: 'https://media.mts.ru/internet/210833-belyj-spisok-interneta',
    publishedAt: '2026-02-18',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'operator-media',
    primarySource: true,
    confidence: 'medium',
    shortEvidence:
      'Со стороны оператора: ограничения затрагивают только мобильный трафик, при подключении к Wi-Fi всё работает штатно.',
  },
  {
    id: 'src-rfc9849',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 9849 — TLS Encrypted Client Hello',
    url: 'https://www.rfc-editor.org/rfc/rfc9849.txt',
    publishedAt: '2026-03',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Механизм шифрования ClientHello под публичным ключом сервера, чтобы закрыть в том числе SNI. Поддерживается в TLS 1.3 (RFC 8446) и DTLS 1.3 (RFC 9147), использует HPKE. Опубликован в марте 2026.',
  },
  {
    id: 'src-foci-ech',
    publisher: 'PETS / FOCI 2025 (Niklas Niere et al.)',
    title: 'Encrypted Client Hello (ECH) in Censorship Circumvention',
    url: 'https://www.petsymposium.org/foci/2025/foci-2025-0016.pdf',
    publishedAt: '2025-07-01',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'peer-reviewed-paper',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Измерительное исследование: ECH цензурируется в России, Иране и Китае. Российские ТСПУ фильтруют расширение ECH в соединениях к Cloudflare; после перезапуска раскатки ECH в сентябре 2024 регулятор заблокировал функцию примерно за месяц.',
  },
  {
    id: 'src-rfc8446',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 8446 — The Transport Layer Security (TLS) Protocol Version 1.3',
    url: 'https://www.rfc-editor.org/rfc/rfc8446',
    publishedAt: '2018-08',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'ClientHello отправляется до установления шифрования; расширение server_name (SNI) передаётся в открытом виде, если не применяется ECH.',
  },
  {
    id: 'src-rfc2923',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 2923 — TCP Problems with Path MTU Discovery',
    url: 'https://www.rfc-editor.org/rfc/rfc2923.txt',
    publishedAt: '2000-09',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Если ICMP "Fragmentation Needed" отфильтрован, отправитель не узнаёт, что пакет слишком большой. Мелкие пакеты и ping проходят, а передача данных молча умирает — "чёрная дыра" PMTUD.',
  },
  {
    id: 'src-rfc1191',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 1191 — Path MTU Discovery',
    url: 'https://www.rfc-editor.org/rfc/rfc1191',
    publishedAt: '1990-11',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Хост ставит бит Don\'t Fragment и уменьшает размер пакета по ICMP-сообщениям от маршрутизаторов, определяя MTU пути.',
  },
  {
    id: 'src-rfc4821',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 4821 — Packetization Layer Path MTU Discovery',
    url: 'https://www.rfc-editor.org/rfc/rfc4821',
    publishedAt: '2007-03',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Метод определения MTU пути без опоры на ICMP: транспорт сам зондирует размер пакета, чтобы обойти "чёрные дыры".',
  },
  {
    id: 'src-habr-sovereign',
    publisher: 'Хабр',
    title: 'Суверенный интернет: что меняется с 1 марта 2026 года',
    url: 'https://habr.com/ru/articles/1006424/',
    publishedAt: '2026-02-24',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'technical-community',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'С 1 марта 2026 действуют новые правила централизованного управления сетью; РКН, ФСБ и Минцифры получили расширенные полномочия по изоляции сегмента.',
  },
  {
    id: 'src-digitalrazor-tspu',
    publisher: 'Digital Razor',
    title: 'Роскомнадзор установил контроль над магистральным трафиком в России',
    url: 'https://digital-razor.ru/media/news/misc/roskomnadzor-traffic-control-tspu-2026/',
    publishedAt: '2026-03-05',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'tech-media',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'С 1 марта 2026 управление ключевыми точками обмена трафиком передано специалистам ведомства; блокировка ресурса возможна за минуты без участия оператора. Внутри ТСПУ — DPI, анализирующий протоколы, домены, сигнатуры и поведение соединения.',
  },
  {
    id: 'src-meduza-vpn',
    publisher: 'Meduza',
    title: 'В мае власти РФ перешли к более хитрым методам борьбы с VPN и прокси',
    url: 'https://meduza.io/feature/2026/05/30/v-mae-vlasti-rf-pereshli-k-bolee-hitrym-metodam-borby-s-vpn-i-proksi',
    publishedAt: '2026-05-30',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'independent-media',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'Блокировка по отпечатку TLS-рукопожатия, по размерам пакетов, по «сырому» TCP без узнаваемой сигнатуры протокола, по подсетям целиком и по ASN хостинг-провайдеров.',
  },
  {
    id: 'src-techora-outage',
    publisher: 'Techora',
    title: 'Пользователи по всей России жалуются на сбои ВК и Госуслуг',
    url: 'https://techora.ru/news/polzovateli-po-vsey-rossii-zhaluyutsya-na-2026-07-21',
    publishedAt: '2026-07-21',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'tech-media',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      '21 июля 2026 массовые жалобы на доступ к ВКонтакте и Госуслугам; проблемы фиксировались в Перми, Великом Новгороде, Рязани, Вологде.',
  },
  {
    id: 'src-info24-outage',
    publisher: 'Инфо24',
    title: 'Что с «Госуслугами» 21 июля: почему не работает, где сбои',
    url: 'https://info24.ru/news/chto-s-gosuslugami-segodnya-21-iyulya-pochemu-ne-rabotaet-gde-sboi-chto-delat.html',
    publishedAt: '2026-07-21',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'news-media',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'Независимое подтверждение того же события: по данным «Сбой.РФ» за час зафиксировано 104 жалобы, больше всего из Москвы, Петербурга и Новосибирской области.',
  },
];

/** Thematic map of the niche as it stands on the retrieval date. */
export const research = {
  retrievedAt: RETRIEVED_AT,
  territories: [
    {
      key: 'access-substitution',
      summary:
        'Мобильный интернет в России регулярно ограничивают, и пользователи массово мигрируют в публичный Wi-Fi. При этом публичный Wi-Fi по постановлению №1667 требует идентификации и по определению чужой.',
      sourceIds: ['src-ixbt-wifi', 'src-obit-wifi', 'src-bitwifi-1667'],
    },
    {
      key: 'whitelist-filtering',
      summary:
        'Белый список Минцифры разрешает часть сервисов при ограничениях. Разрешение выдаётся по домену и IP, распознаётся через DPI. Отсюда «половина телефона работает, половина нет» на одной и той же сети.',
      sourceIds: ['src-ria-whitelist', 'src-klerk-whitelist', 'src-mts-whitelist'],
    },
    {
      key: 'sni-visibility',
      summary:
        'HTTPS шифрует содержимое, но имя сайта уезжает открытым в ClientHello (SNI). ECH (RFC 9849, март 2026) закрывает это поле, однако измерения FOCI показывают, что ECH цензурируется в России на уровне ТСПУ.',
      sourceIds: ['src-rfc9849', 'src-rfc8446', 'src-foci-ech'],
    },
    {
      key: 'packet-size-blackhole',
      summary:
        'Классический сбой «сайт открывается, а файлы не грузятся»: пакет чуть больше MTU пути, ICMP-сообщение отфильтровано, отправитель не узнаёт причину. Ping идёт, страница есть, данные молча пропадают.',
      sourceIds: ['src-rfc2923', 'src-rfc1191', 'src-rfc4821'],
    },
    {
      key: 'centralized-routing',
      summary:
        'С 1 марта 2026 управление магистральным трафиком централизовано, ТСПУ позволяют ограничить ресурс за минуты без участия оператора. Физическая сеть цела — меняется маршрут и правило.',
      sourceIds: ['src-habr-sovereign', 'src-digitalrazor-tspu', 'src-meduza-vpn'],
    },
    {
      key: 'outage-behaviour',
      summary:
        'Сложилась устойчивая бытовая привычка: при любом сбое человек сначала проверяет, «лежит ли у всех», а не свою сеть. 21 июля 2026 — очередной такой день с массовыми жалобами на ВК и Госуслуги.',
      sourceIds: ['src-techora-outage', 'src-info24-outage'],
    },
  ],
};
