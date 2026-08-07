/**
 * Research basis for batch 2026-07-25-b1 — "изящества программирования за VPN".
 *
 * This batch is educational rather than news-driven, so the basis is primary
 * technical material: IETF standards, the original cryptography paper, and the
 * canonical write-up of the TCP-over-TCP problem. Each entry was fetched or
 * confirmed during the research stage; nothing here is recalled from memory alone.
 */

export const RETRIEVED_AT = '2026-07-25';

export const sources = [
  {
    id: 'src-dh-1976',
    publisher: 'IEEE Transactions on Information Theory (W. Diffie, M. Hellman)',
    title: 'New Directions in Cryptography',
    url: 'https://ee.stanford.edu/~hellman/publications/24.pdf',
    publishedAt: '1976-11',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'peer-reviewed-paper',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Оригинальная работа, вводящая обмен ключами по открытому каналу: обе стороны приходят к общему секрету, не передавая его; стойкость опирается на вычислительную трудность обратной операции (дискретный логарифм).',
  },
  {
    id: 'src-rfc7748',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 7748 — Elliptic Curves for Security',
    url: 'https://www.rfc-editor.org/rfc/rfc7748',
    publishedAt: '2016-01',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Описывает curve25519 и функцию X25519 — современную форму того же обмена ключами, которую используют TLS 1.3 и WireGuard.',
  },
  {
    id: 'src-rfc8439',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 8439 — ChaCha20 and Poly1305 for IETF Protocols',
    url: 'https://www.rfc-editor.org/rfc/rfc8439.txt',
    publishedAt: '2018-06',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Прямая цитата: "The ChaCha20 function then performs an XOR of this keystream with the plaintext" и "Decryption is done in the same way… which is XORed with the ciphertext giving back the plaintext". Шифрование и расшифровка — одна и та же операция.',
  },
  {
    id: 'src-rfc8446-b',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 8446 — The Transport Layer Security (TLS) Protocol Version 1.3',
    url: 'https://www.rfc-editor.org/rfc/rfc8446',
    publishedAt: '2018-08',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'TLS 1.3 обязывает использовать эфемерный обмен ключами (ECDHE) в каждом рукопожатии — общий секрет создаётся заново и не хранится.',
  },
  {
    id: 'src-rfc2003',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 2003 — IP Encapsulation within IP',
    url: 'https://www.rfc-editor.org/rfc/rfc2003',
    publishedAt: '1994-10',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Описывает механизм, при котором целая IP-датаграмма становится полезной нагрузкой другой IP-датаграммы с новым внешним заголовком. Это и есть базовая идея туннеля.',
  },
  {
    id: 'src-rfc4301',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 4301 — Security Architecture for the Internet Protocol',
    url: 'https://www.rfc-editor.org/rfc/rfc4301',
    publishedAt: '2005-12',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Туннельный режим IPsec: исходный пакет целиком защищается и получает новый внешний заголовок; промежуточные узлы видят только внешний адрес.',
  },
  {
    id: 'src-rfc2104',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 2104 — HMAC: Keyed-Hashing for Message Authentication',
    url: 'https://www.rfc-editor.org/rfc/rfc2104',
    publishedAt: '1997-02',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Определяет код аутентификации на основе хэш-функции и общего ключа: получатель пересчитывает значение и отбрасывает сообщение, если оно не совпало.',
  },
  {
    id: 'src-fips180',
    publisher: 'NIST',
    title: 'FIPS PUB 180-4 — Secure Hash Standard (SHS)',
    url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf',
    publishedAt: '2015-08',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Стандарт семейства SHA-2: хэш фиксированной длины для входа произвольной длины; требование стойкости означает, что близкие входы не дают близких выходов.',
  },
  {
    id: 'src-rfc3022',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 3022 — Traditional IP Network Address Translator (Traditional NAT)',
    url: 'https://www.rfc-editor.org/rfc/rfc3022.txt',
    publishedAt: '2001-01',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'NAPT транслирует пару (локальный адрес, локальный порт) в пару (зарегистрированный адрес, назначенный порт) и держит для каждой сессии состояние привязки, по которому возвращает ответ нужному хосту.',
  },
  {
    id: 'src-rfc4787',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 4787 — NAT Behavioral Requirements for Unicast UDP',
    url: 'https://www.rfc-editor.org/rfc/rfc4787',
    publishedAt: '2007-01',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Независимое подтверждение модели: NAT хранит отображение по внешнему порту и удерживает его в течение таймаута сессии.',
  },
  {
    id: 'src-titz-tcp',
    publisher: 'Olaf Titz',
    title: 'Why TCP Over TCP Is A Bad Idea',
    url: 'http://sites.inka.de/bigred/devel/tcp-tcp.html',
    publishedAt: '2001-04-23',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'primary-technical-writeup',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Канонический разбор: когда нижний TCP ставит повтор и увеличивает таймаут, верхний не получает ACK вовремя и тоже ставит повтор; если его RTO меньше, повторы копятся быстрее, чем нижний слой их отправляет — соединение схлопывается («meltdown»).',
  },
  {
    id: 'src-coonjah-meltdown',
    publisher: 'Coonjah, Catherine, Soyjaudah (INDIA 2018 proceedings)',
    title: 'An Investigation of the TCP Meltdown Problem in VPN Systems',
    url: 'https://www.researchgate.net/publication/330024051_An_Investigation_of_the_TCP_Meltdown_Problem_and_Proposing_Raptor_Codes_as_a_Novel_to_Decrease_TCP_Retransmissions_in_VPN_Systems_Proceedings_of_Fifth_International_Conference_INDIA_2018_Volume_1',
    publishedAt: '2018-12',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'peer-reviewed-paper',
    primarySource: false,
    confidence: 'medium',
    shortEvidence:
      'Независимое измерение эффекта в VPN-системах: вложенный TCP резко снижает пропускную способность и увеличивает задержку из-за конфликта механизмов повторной передачи.',
  },
  {
    id: 'src-rfc6298',
    publisher: 'IETF / RFC Editor',
    title: "RFC 6298 — Computing TCP's Retransmission Timer",
    url: 'https://www.rfc-editor.org/rfc/rfc6298',
    publishedAt: '2011-06',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'Правило удвоения таймера повторной передачи после каждого срабатывания — тот самый экспоненциальный откат, который в двух вложенных стеках расходится.',
  },
  {
    id: 'src-rfc768',
    publisher: 'IETF / RFC Editor',
    title: 'RFC 768 — User Datagram Protocol',
    url: 'https://www.rfc-editor.org/rfc/rfc768',
    publishedAt: '1980-08',
    retrievedAt: RETRIEVED_AT,
    sourceType: 'standards-document',
    primarySource: true,
    confidence: 'high',
    shortEvidence:
      'UDP не гарантирует доставку и не хранит состояние повторов — поэтому он не конфликтует с надёжностью, которую обеспечивает вложенный внутрь него транспорт.',
  },
];

export const research = {
  retrievedAt: RETRIEVED_AT,
  angle:
    'Каждый ролик берёт один приём из инженерии VPN, который красив сам по себе, и объясняет его бытовым сравнением, не упрощая суть до неправды.',
  territories: [
    {
      key: 'shared-secret-without-sending-it',
      summary:
        'Обмен Диффи—Хеллмана: две стороны публично обмениваются промежуточными значениями и приходят к общему секрету, который в канале никогда не появлялся. Наглядная модель — смешивание красок: смешать легко, разделить нельзя.',
      sourceIds: ['src-dh-1976', 'src-rfc7748', 'src-rfc8446-b'],
    },
    {
      key: 'xor-symmetry',
      summary:
        'Потоковый шифр накладывает на данные псевдослучайный поток операцией XOR. Та же операция с тем же потоком возвращает исходные данные — шифрование и расшифровка буквально одна функция.',
      sourceIds: ['src-rfc8439'],
    },
    {
      key: 'encapsulation',
      summary:
        'Туннель — это не «дыра в сети», а пакет внутри пакета: исходная датаграмма становится полезной нагрузкой новой, с новым внешним адресом. Приём стандартизован ещё в 1994 году.',
      sourceIds: ['src-rfc2003', 'src-rfc4301'],
    },
    {
      key: 'avalanche-integrity',
      summary:
        'Лавинный эффект хэш-функции: изменение одного бита входа меняет примерно половину бит выхода. На этом строится проверка целостности каждого пакета через HMAC.',
      sourceIds: ['src-fips180', 'src-rfc2104'],
    },
    {
      key: 'nat-multiplexing',
      summary:
        'NAPT превращает один публичный адрес в десятки тысяч независимых каналов за счёт таблицы соответствия портов. Тот же механизм на VPN-сервере смешивает трафик многих пользователей.',
      sourceIds: ['src-rfc3022', 'src-rfc4787'],
    },
    {
      key: 'tcp-over-tcp',
      summary:
        'Вложение TCP в TCP приводит к конфликту таймеров повторной передачи и обвалу пропускной способности. Поэтому туннели предпочитают UDP, у которого нет собственной надёжности.',
      sourceIds: ['src-titz-tcp', 'src-rfc6298', 'src-coonjah-meltdown', 'src-rfc768'],
    },
  ],
};
