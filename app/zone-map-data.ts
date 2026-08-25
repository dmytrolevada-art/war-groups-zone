import { SECTOR_POINT_INTEL } from "./sector-map-registry";

export const MAP_WIDTH = 1200;
export const MAP_HEIGHT = 900;

export type ThreatLevel = "низкая" | "средняя" | "высокая" | "критическая";

export interface ZoneSectorShape {
  id: string;
  name: string;
  code: string;
  path: string;
  labelX: number;
  labelY: number;
  nodeIds: string[];
}

export interface MapNodeIntel {
  sector: string;
  grid: string;
  terrain: string;
  threat: ThreatLevel;
  note: string;
}

export interface HazardField {
  id: string;
  x: number;
  y: number;
  radius: number;
  label: string;
  tone: "radiation" | "anomaly" | "psi";
}

export const ZONE_SECTORS: ZoneSectorShape[] = [
  {
    id: "swamps-sector",
    name: "БОЛОТА",
    code: "S-01",
    path: "M10 640 L245 628 L355 700 L342 890 L18 890 Z",
    labelX: 1118,
    labelY: 804,
    nodeIds: ["swamps", "fishing_hamlet", "machine_yard", "old_church", "duga"],
  },
  {
    id: "cordon-sector",
    name: "КОРДОН",
    code: "S-02",
    path: "M334 690 L715 684 L867 792 L828 890 L337 890 Z",
    labelX: 662,
    labelY: 726,
    nodeIds: ["cordon", "zalesie"],
  },
  {
    id: "garbage-sector",
    name: "СВАЛКА",
    code: "S-03",
    path: "M330 564 L665 558 L720 692 L348 704 L278 632 Z",
    labelX: 582,
    labelY: 438,
    nodeIds: ["garbage", "flea_market", "hangar"],
  },
  {
    id: "dark-valley-sector",
    name: "ТЕРРИКОН",
    code: "S-04",
    path: "M710 554 L1010 548 L1095 714 L864 808 L704 688 Z",
    labelX: 650,
    labelY: 468,
    nodeIds: ["dark_valley", "x18"],
  },
  {
    id: "agroprom-sector",
    name: "ХИМЗАВОД",
    code: "S-05",
    path: "M94 468 L382 458 L464 576 L278 636 L92 574 Z",
    labelX: 462,
    labelY: 582,
    nodeIds: ["agroprom", "agroprom_underground", "malachite"],
  },
  {
    id: "rostok-sector",
    name: "ЦЕНТРАЛЬНАЯ ЗОНА",
    code: "S-06",
    path: "M390 432 L712 420 L744 558 L457 580 L360 506 Z",
    labelX: 702,
    labelY: 418,
    nodeIds: ["bar", "rostok", "wild", "cooling_towers"],
  },
  {
    id: "yantar-sector",
    name: "ЯНТАРЬ",
    code: "S-07",
    path: "M38 316 L342 302 L442 444 L366 486 L80 478 Z",
    labelX: 318,
    labelY: 448,
    nodeIds: ["yantar", "x16"],
  },
  {
    id: "warehouses-sector",
    name: "РОСТОК",
    code: "S-08",
    path: "M350 292 L666 286 L742 428 L394 438 L314 356 Z",
    labelX: 474,
    labelY: 458,
    nodeIds: ["warehouses", "barrier"],
  },
  {
    id: "dead-city-sector",
    name: "ДИКИЙ ОСТРОВ",
    code: "S-09",
    path: "M680 300 L988 286 L1080 434 L1002 548 L744 430 Z",
    labelX: 788,
    labelY: 564,
    nodeIds: ["dead_city", "sircaa"],
  },
  {
    id: "red-forest-sector",
    name: "РЫЖИЙ ЛЕС",
    code: "N-01",
    path: "M120 174 L465 170 L580 286 L338 326 L90 302 Z",
    labelX: 328,
    labelY: 366,
    nodeIds: ["red_forest", "forester"],
  },
  {
    id: "limansk-sector",
    name: "СЕВЕРНЫЙ КОРИДОР",
    code: "N-02",
    path: "M568 190 L900 178 L994 290 L678 310 L548 260 Z",
    labelX: 504,
    labelY: 342,
    nodeIds: ["limansk", "hospital"],
  },
  {
    id: "radar-sector",
    name: "ГЕНЕРАТОРЫ",
    code: "N-03",
    path: "M224 50 L522 40 L642 168 L472 206 L178 168 Z",
    labelX: 578,
    labelY: 238,
    nodeIds: ["radar"],
  },
  {
    id: "north-sector",
    name: "ПРИПЯТЬ · ЧАЭС",
    code: "N-04",
    path: "M486 8 L944 8 L1012 140 L894 194 L610 168 L482 102 Z",
    labelX: 420,
    labelY: 208,
    nodeIds: ["pripyat", "cnpp", "energetik"],
  },
  {
    id: "outskirts-sector",
    name: "ЗАТОН · НИИЧАЗ",
    code: "N-05",
    path: "M910 134 L1188 118 L1190 528 L1042 540 L986 410 L1004 282 Z",
    labelX: 980,
    labelY: 630,
    nodeIds: ["jupiter", "yanov", "zaton", "skadovsk", "ikar"],
  },
];

export const HAZARD_FIELDS: HazardField[] = [
  { id: "swamp-gas", x: 1118, y: 802, radius: 74, label: "ТОПЬ", tone: "anomaly" },
  { id: "agro-rad", x: 462, y: 582, radius: 46, label: "РАД", tone: "radiation" },
  { id: "wild-field", x: 788, y: 564, radius: 72, label: "АНОМ", tone: "anomaly" },
  { id: "yantar-psi", x: 318, y: 448, radius: 62, label: "ПСИ", tone: "psi" },
  { id: "forest-rad", x: 328, y: 366, radius: 84, label: "РАД", tone: "radiation" },
  { id: "radar-psi", x: 578, y: 238, radius: 78, label: "ПСИ", tone: "psi" },
  { id: "cnpp-rad", x: 576, y: 310, radius: 96, label: "РАД", tone: "radiation" },
  { id: "zaton-anomaly", x: 994, y: 674, radius: 58, label: "АНОМ", tone: "anomaly" },
];

export const NODE_INTEL: Record<string, MapNodeIntel> = {
  ...(SECTOR_POINT_INTEL as Record<string, MapNodeIntel>),
  swamps: { sector: "Болота", grid: "D-08", terrain: "топи и камыш", threat: "средняя", note: "Основной лагерь у старой насосной станции." },
  fishing_hamlet: { sector: "Болота", grid: "B-07", terrain: "затопленный хутор", threat: "низкая", note: "Тихая стоянка с выходом к западным тропам." },
  machine_yard: { sector: "Болота", grid: "F-08", terrain: "машинный двор", threat: "средняя", note: "Укреплённая развилка между болотами и Кордоном." },
  old_church: { sector: "Болота", grid: "G-07", terrain: "каменные руины", threat: "средняя", note: "Надёжное укрытие во время Выброса." },
  cordon: { sector: "Кордон", grid: "K-09", terrain: "деревня и лесополоса", threat: "низкая", note: "Южные ворота Зоны и база одиночек." },
  elevator: { sector: "Кордон", grid: "J-08", terrain: "элеватор", threat: "средняя", note: "Высотная точка, контролирующая северную дорогу." },
  railway_checkpoint: { sector: "Кордон", grid: "M-08", terrain: "железнодорожная насыпь", threat: "средняя", note: "Узкий проход через линию железной дороги." },
  checkpoint: { sector: "Кордон", grid: "Q-09", terrain: "военный блокпост", threat: "высокая", note: "Южный кордон с укреплениями и простреливаемой дорогой." },
  farmstead: { sector: "Кордон", grid: "K-08", terrain: "заброшенная ферма", threat: "средняя", note: "Центральная развилка между деревней, лесом и элеватором." },
  forest_camp: { sector: "Кордон", grid: "P-08", terrain: "сосновый лес", threat: "высокая", note: "Скрытая стоянка, подходящая для засад на восточной дороге." },
  rail_tunnel: { sector: "Кордон", grid: "Q-07", terrain: "железнодорожный тоннель", threat: "средняя", note: "Капитальное укрытие и обход насыпи с востока." },
  north_outpost: { sector: "Кордон", grid: "L-06", terrain: "северное шоссе", threat: "высокая", note: "Последняя точка сектора перед переходом на Свалку." },
  garbage: { sector: "Свалка", grid: "K-07", terrain: "кладбище техники", threat: "средняя", note: "Центральный транспортный узел южной Зоны." },
  flea_market: { sector: "Свалка", grid: "I-06", terrain: "барахолка", threat: "низкая", note: "Торговая стоянка на западной дороге." },
  hangar: { sector: "Свалка", grid: "M-06", terrain: "разрушенный ангар", threat: "средняя", note: "Укрытие и удобный плацдарм для рейдов." },
  dark_valley: { sector: "Тёмная Долина", grid: "R-07", terrain: "заводской комплекс", threat: "высокая", note: "Главная база бандитов на восточном направлении." },
  x18: { sector: "Тёмная Долина", grid: "T-06", terrain: "подземная лаборатория", threat: "критическая", note: "Герметичное укрытие с опасными подземными ходами." },
  agroprom: { sector: "Агропром", grid: "F-06", terrain: "НИИ и болота", threat: "высокая", note: "Военный район с сильными оборонительными позициями." },
  agroprom_underground: { sector: "Агропром", grid: "H-05", terrain: "катакомбы", threat: "высокая", note: "Подземный маршрут и капитальное убежище." },
  bar: { sector: "Росток", grid: "K-05", terrain: "укреплённый городок", threat: "низкая", note: "Торговый центр и главная база Долга." },
  rostok: { sector: "Росток", grid: "M-05", terrain: "промышленный пояс", threat: "средняя", note: "Ворота между южной и центральной Зоной." },
  wild: { sector: "Дикая территория", grid: "P-05", terrain: "железнодорожные руины", threat: "высокая", note: "Богатое аномальное поле на открытой местности." },
  yantar: { sector: "Янтарь", grid: "F-04", terrain: "озеро и лаборатория", threat: "высокая", note: "Научная база рядом с мощным пси-источником." },
  x16: { sector: "Янтарь", grid: "D-04", terrain: "лаборатория X-16", threat: "критическая", note: "Пси-зона; без защиты долго не удержаться." },
  warehouses: { sector: "Армейские склады", grid: "L-04", terrain: "склады и холмы", threat: "средняя", note: "База Свободы и ключ к северному проходу." },
  barrier: { sector: "Армейские склады", grid: "N-03", terrain: "бетонный рубеж", threat: "высокая", note: "Оборонительная линия перед Радаром." },
  dead_city: { sector: "Мёртвый город", grid: "S-04", terrain: "городские кварталы", threat: "высокая", note: "Плотная застройка и база наёмников." },
  red_forest: { sector: "Рыжий лес", grid: "H-03", terrain: "радиоактивный лес", threat: "критическая", note: "Опасная развилка, где часто бродят мутанты." },
  forester: { sector: "Рыжий лес", grid: "J-03", terrain: "лесничество", threat: "средняя", note: "Редкое безопасное место среди заражённого леса." },
  limansk: { sector: "Лиманск", grid: "P-03", terrain: "затопленный город", threat: "высокая", note: "Западный обход к северным районам." },
  radar: { sector: "Радар", grid: "J-02", terrain: "антенный комплекс", threat: "критическая", note: "Пси-рубеж на прямом пути к Припяти." },
  hospital: { sector: "Лиманск", grid: "R-02", terrain: "разрушенный госпиталь", threat: "высокая", note: "Капитальное укрытие у северо-восточного коридора." },
  pripyat: { sector: "Припять", grid: "M-01", terrain: "городские руины", threat: "критическая", note: "База Монолита и последний рубеж перед ЧАЭС." },
  jupiter: { sector: "Окрестности Юпитера", grid: "V-03", terrain: "завод и железная дорога", threat: "высокая", note: "Крупный узел северо-восточного маршрута." },
  yanov: { sector: "Окрестности Юпитера", grid: "W-03", terrain: "железнодорожная станция", threat: "средняя", note: "Перевалочный пункт между Затоном и Припятью." },
  zaton: { sector: "Затон", grid: "X-04", terrain: "болота и сухогрузы", threat: "высокая", note: "Аномальный район с богатыми артефактными полями." },
  skadovsk: { sector: "Затон", grid: "Y-05", terrain: "ржавый сухогруз", threat: "низкая", note: "Капитальное убежище и восточная стоянка." },
  cnpp: { sector: "ЧАЭС", grid: "R-01", terrain: "энергоблоки", threat: "критическая", note: "Северная цитадель с максимальной радиацией." },
  zalesie: { sector: "Малая Зона", grid: "M-07", terrain: "посёлок и бомбоубежище", threat: "низкая", note: "Торговый узел новичков и безопасная развилка южных маршрутов." },
  malachite: { sector: "Малахит", grid: "D-06", terrain: "научный комплекс", threat: "средняя", note: "Укреплённый научный центр с оборудованием для исследования артефактов." },
  duga: { sector: "Дуга", grid: "E-08", terrain: "антенный комплекс", threat: "высокая", note: "Открытая военная территория с дальними линиями огня и пси-помехами." },
  cooling_towers: { sector: "Градирни", grid: "Q-05", terrain: "промышленная зона", threat: "критическая", note: "Сильная радиация и богатые аномальные поля у охладительных башен." },
  sircaa: { sector: "НИИЧАЗ", grid: "U-06", terrain: "закрытый институт", threat: "высокая", note: "Стратегический научный комплекс с собственной системой обороны." },
  ikar: { sector: "Болота", grid: "T-08", terrain: "пионерлагерь", threat: "средняя", note: "Укреплённая промежуточная база между НИИЧАЗом и Затоном." },
  energetik: { sector: "Припять", grid: "H-02", terrain: "городской форпост", threat: "критическая", note: "Последний надёжный перевалочный пункт внутри Припяти." },
};

export function getNodeIntel(nodeId: string): MapNodeIntel {
  return NODE_INTEL[nodeId] ?? {
    sector: "Неизвестный сектор",
    grid: "—",
    terrain: "данные отсутствуют",
    threat: "средняя",
    note: "Разведданные по точке ещё не подтверждены.",
  };
}
