export const CORDON_MAP_WIDTH = 900;
export const CORDON_MAP_HEIGHT = 620;

export interface CordonPointVisual {
  id: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: "start" | "middle" | "end";
  grid: string;
  terrain: string;
  cover: number;
  defenseBonus: number;
  attackBonus: number;
  captureFactor: number;
  sight: "короткий" | "средний" | "дальний";
  danger: "низкая" | "средняя" | "высокая";
  controlArea: string;
  description: string;
  tacticalValue: string;
}

export type CordonRouteKind = "шоссе" | "грунтовка" | "лесная тропа" | "насыпь";

export interface CordonRouteVisual {
  from: string;
  to: string;
  kind: CordonRouteKind;
  minutes: number;
  path: string;
}

export const CORDON_POINTS: CordonPointVisual[] = [
  {
    id: "north_outpost",
    x: 450,
    y: 72,
    labelX: 450,
    labelY: 42,
    anchor: "middle",
    grid: "E-1",
    terrain: "открытая дорога",
    cover: 18,
    defenseBonus: 0.05,
    attackBonus: 0.05,
    captureFactor: 1.05,
    sight: "дальний",
    danger: "высокая",
    controlArea: "M344 0H558L552 118 494 164 396 158 342 106Z",
    description: "Северный выход к Свалке. Открытая дорога простреливается с насыпи.",
    tacticalValue: "Контроль северного перехода",
  },
  {
    id: "rail_tunnel",
    x: 694,
    y: 166,
    labelX: 724,
    labelY: 159,
    anchor: "start",
    grid: "H-2",
    terrain: "лес и бетон",
    cover: 72,
    defenseBonus: 0.28,
    attackBonus: 0.07,
    captureFactor: 1.25,
    sight: "короткий",
    danger: "высокая",
    controlArea: "M554 0H900V238L790 258 716 220 632 214 596 116Z",
    description: "Тёмный железнодорожный тоннель с укрытиями и удобной позицией для засады.",
    tacticalValue: "Укрытие и восточный обход",
  },
  {
    id: "railway_checkpoint",
    x: 450,
    y: 222,
    labelX: 450,
    labelY: 190,
    anchor: "middle",
    grid: "E-3",
    terrain: "насыпь и кустарник",
    cover: 43,
    defenseBonus: 0.16,
    attackBonus: 0.12,
    captureFactor: 1.18,
    sight: "дальний",
    danger: "высокая",
    controlArea: "M330 142L402 154 494 160 558 116 632 122 638 276 548 314 402 306 326 252Z",
    description: "Железнодорожная насыпь делит Кордон надвое и образует узкий проход.",
    tacticalValue: "Ключевая оборонительная линия",
  },
  {
    id: "elevator",
    x: 290,
    y: 320,
    labelX: 258,
    labelY: 314,
    anchor: "end",
    grid: "C-4",
    terrain: "руины и поле",
    cover: 58,
    defenseBonus: 0.22,
    attackBonus: 0.15,
    captureFactor: 1.22,
    sight: "дальний",
    danger: "средняя",
    controlArea: "M0 196L188 204 330 148 328 254 402 306 384 398 310 432 190 402 84 334 0 348Z",
    description: "Разрушенный элеватор с обзором дороги и твёрдыми стенами.",
    tacticalValue: "Высота и западный маршрут",
  },
  {
    id: "forest_camp",
    x: 666,
    y: 350,
    labelX: 699,
    labelY: 344,
    anchor: "start",
    grid: "G-5",
    terrain: "густой сосняк",
    cover: 64,
    defenseBonus: 0.25,
    attackBonus: 0.08,
    captureFactor: 1.18,
    sight: "короткий",
    danger: "высокая",
    controlArea: "M638 218L716 220 790 258 900 236V474L822 502 734 442 642 426 590 358Z",
    description: "Скрытая стоянка среди сосен. Часто используется бандитами и мародёрами.",
    tacticalValue: "Засада на восточной дороге",
  },
  {
    id: "farmstead",
    x: 410,
    y: 446,
    labelX: 410,
    labelY: 415,
    anchor: "middle",
    grid: "E-6",
    terrain: "двор и развилка",
    cover: 46,
    defenseBonus: 0.14,
    attackBonus: 0.03,
    captureFactor: 1.08,
    sight: "средний",
    danger: "средняя",
    controlArea: "M310 430L384 396 590 356 644 426 586 534 440 570 326 516Z",
    description: "Заброшенный двор у развилки. Через него проходят оба центральных маршрута.",
    tacticalValue: "Центральная развилка",
  },
  {
    id: "cordon",
    x: 220,
    y: 548,
    labelX: 220,
    labelY: 515,
    anchor: "middle",
    grid: "C-7",
    terrain: "деревня и низина",
    cover: 55,
    defenseBonus: 0.2,
    attackBonus: 0.05,
    captureFactor: 1.2,
    sight: "средний",
    danger: "низкая",
    controlArea: "M0 346L86 334 190 402 310 432 326 516 440 570 408 620H0Z",
    description: "Деревня новичков и южная база одиночек.",
    tacticalValue: "Главная база и набор бойцов",
  },
  {
    id: "checkpoint",
    x: 764,
    y: 532,
    labelX: 764,
    labelY: 498,
    anchor: "middle",
    grid: "H-7",
    terrain: "бетон и шоссе",
    cover: 76,
    defenseBonus: 0.32,
    attackBonus: 0.1,
    captureFactor: 1.35,
    sight: "дальний",
    danger: "высокая",
    controlArea: "M642 426L734 440 824 500 900 472V620H408L440 570 586 532Z",
    description: "Укреплённый военный блокпост у шоссе. Лобовая атака опасна.",
    tacticalValue: "Контроль южной границы",
  },
];

export const CORDON_ROUTES: CordonRouteVisual[] = [
  { from: "cordon", to: "farmstead", kind: "грунтовка", minutes: 18, path: "M220 548 C273 531 344 476 410 446" },
  { from: "cordon", to: "elevator", kind: "грунтовка", minutes: 24, path: "M220 548 C233 451 251 370 290 320" },
  { from: "farmstead", to: "elevator", kind: "лесная тропа", minutes: 17, path: "M410 446 C358 419 324 372 290 320" },
  { from: "farmstead", to: "forest_camp", kind: "грунтовка", minutes: 22, path: "M410 446 C508 464 606 420 666 350" },
  { from: "elevator", to: "railway_checkpoint", kind: "грунтовка", minutes: 19, path: "M290 320 C338 273 393 244 450 222" },
  { from: "forest_camp", to: "rail_tunnel", kind: "лесная тропа", minutes: 21, path: "M666 350 C681 292 685 221 694 166" },
  { from: "forest_camp", to: "checkpoint", kind: "шоссе", minutes: 16, path: "M666 350 C724 370 755 445 764 532" },
  { from: "railway_checkpoint", to: "rail_tunnel", kind: "насыпь", minutes: 20, path: "M450 222 C528 207 612 180 694 166" },
  { from: "rail_tunnel", to: "north_outpost", kind: "лесная тропа", minutes: 25, path: "M694 166 C602 124 527 88 450 72" },
  { from: "railway_checkpoint", to: "north_outpost", kind: "шоссе", minutes: 14, path: "M450 222 C449 165 451 117 450 72" },
];

export const CORDON_POINT_IDS = CORDON_POINTS.map((point) => point.id);

export function getCordonPoint(pointId: string) {
  return CORDON_POINTS.find((point) => point.id === pointId) ?? CORDON_POINTS[0];
}

export function findCordonPoint(pointId: string) {
  return CORDON_POINTS.find((point) => point.id === pointId);
}

export function getCordonRoute(from: string, to: string) {
  return CORDON_ROUTES.find((route) =>
    (route.from === from && route.to === to) || (route.from === to && route.to === from),
  );
}
