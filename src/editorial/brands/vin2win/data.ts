// Реальные данные прод-каталога vin2win.ru на 22.11.2026 (аккаунт admin, только чтение).
// Цены «на ресурсах» и выгода указаны продавцами; платформа их не сверяет.
// Народные машины от 3 000 000 ₽, в каждом ролике своя. Каталог: 767 объявлений, 19 со статусом «не размещено».
export const CATALOG = { total: 767, notOnResources: 19 };

// Координаты — точки iPhone 17 Pro (402×874) на скриншотах public/real/*.jpg
// Детальная карточка: у однострочного заголовка блок цены выше на 28 pt, чем у двухстрочного.
const fin = (dy: number) => ({
  card: { x: 16, y: 514 + dy, w: 370, h: 160 },
  hand: { x: 28, y: 528 + dy, w: 340, h: 62 },
  res: { x: 16, y: 612 + dy, w: 184, h: 62 },
  gain: { x: 200, y: 612 + dy, w: 186, h: 62 },
  handValue: { x: 28, y: 548 + dy, w: 300, h: 40 },
  gainValue: { x: 212, y: 638 + dy, w: 150, h: 26 },
});
export const DETAIL = { one: fin(0), two: fin(28) };

type Car = { src: string; title: string; hand: number; market?: number; gain?: number; box: ReturnType<typeof fin> };
const car = (src: string, title: string, hand: number, market: number | undefined, box: ReturnType<typeof fin>): Car =>
  ({ src, title, hand, market, gain: market ? market - hand : undefined, box });

export const CARS = {
  highlander: car('d-highlander-a.jpg', 'Toyota Highlander', 5_000_000, 5_150_000, DETAIL.two), // V1A
  tucson: car('d-tucson-a.jpg', 'Hyundai Tucson', 4_100_000, 4_200_000, DETAIL.two), // V1A
  tiguan: car('d-tiguan-a.jpg', 'Volkswagen Tiguan', 4_600_000, 4_700_000, DETAIL.two), // V1B
  ranger: car('d-ranger-a.jpg', 'Ford Ranger', 5_350_000, 5_500_000, DETAIL.one), // V1B
  staria: car('d-staria-a.jpg', 'Hyundai Staria', 4_850_000, 4_995_000, DETAIL.one), // V1C
  cx5: car('d-cx5-a.jpg', 'Mazda CX-5', 3_350_000, 3_450_000, DETAIL.two), // V1C
  fpace: car('d-fpace-a.jpg', 'Jaguar F-Pace', 3_000_000, undefined, DETAIL.one), // V2A, не размещено
  prado: car('d-prado-a.jpg', 'Toyota Land Cruiser Prado', 7_100_000, undefined, DETAIL.two), // V2B, не размещено
  sportage: car('d-sportage-a.jpg', 'Kia Sportage', 3_485_000, 3_535_000, DETAIL.one), // V2C
  palisade: car('d-palisade-a.jpg', 'Hyundai Palisade', 4_000_000, 4_290_000, DETAIL.one), // VO1
  starshine: car('d-starshine-a.jpg', 'Geely Galaxy Starshine 7', 3_650_000, undefined, DETAIL.two), // VO2, не размещено
  rav4: car('d-rav4-a.jpg', 'Toyota RAV4', 3_950_000, 4_050_000, DETAIL.one), // VO3
};

// Лента «Сначала с выгодой», список (catalog-benefit.jpg; снят заново 22.11.2026, координаты LIST не используются)
export const LIST = {
  price: { x: 16, y: 538, w: 300, h: 26 },
  gain: { x: 16, y: 568, w: 146, h: 20 },
  market: { x: 164, y: 568, w: 164, h: 20 },
  chipRes: { x: 16, y: 666, w: 90, h: 23 },
  chipPaint: { x: 110, y: 666, w: 90, h: 23 },
  chipInv: { x: 204, y: 666, w: 98, h: 23 },
  photo: { x: 16, y: 248, w: 370, h: 276 },
};
// Плитка «Сначала с выгодой» (grid-benefit.jpg)
// Фильтр 3 000 000 – 5 400 000 ₽, первая плитка — Hyundai Palisade +290 000 ₽ (22.11.2026)
export const GRID = {
  badgeFirst: { x: 20, y: 298, w: 78, h: 22 },
  count: { x: 14, y: 226, w: 190, h: 28 },
};
// Запрос в подбор Toyota Camry (request-camry.jpg)
export const REQUEST = {
  head: { x: 14, y: 128, w: 160, h: 56 },
  reqs: { x: 14, y: 252, w: 374, h: 276 },
  comment: { x: 14, y: 556, w: 374, h: 108 },
  author: { x: 14, y: 728, w: 374, h: 50 }, // ник автора запроса закрываем в кадре
  offer: { x: 179, y: 782, w: 209, h: 50 },
};

// Карусель «Свежие предложения» на главной: подписи и цены закрываем (там бывают машины дороже/дешевле нужного и чужие ролики)
export const FRESH = {
  home: { x: 0, y: 566, w: 402, h: 78 }, // home.jpg, 22.11.2026
  homeRequests: { x: 0, y: 346, w: 402, h: 96 }, // home-requests.jpg, 21.11.2026
};
