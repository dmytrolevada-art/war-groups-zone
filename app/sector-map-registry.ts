import {
  CORDON_POINTS,
  CORDON_ROUTES,
  type CordonRouteKind,
} from "./cordon-sector-data";

export type { CordonRouteKind } from "./cordon-sector-data";

export const SECTOR_MAP_WIDTH = 900;
export const SECTOR_MAP_HEIGHT = 620;

export type SectorTheme =
  | "swamp"
  | "rural"
  | "scrapyard"
  | "industrial"
  | "laboratory"
  | "forest"
  | "urban"
  | "flooded"
  | "psi"
  | "nuclear";

export type SectorNodeType = "base" | "outpost" | "camp" | "anomaly" | "shelter";
export type SectorOwner =
  | "stalkers"
  | "duty"
  | "freedom"
  | "bandits"
  | "military"
  | "monolith"
  | "mercenaries"
  | "ecologists"
  | "clear_sky"
  | "renegades"
  | "mutants";

export interface SectorPointDefinition {
  id: string;
  name: string;
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
  danger: "низкая" | "средняя" | "высокая" | "критическая";
  description: string;
  tacticalValue: string;
  type: SectorNodeType;
  income: number;
  localLinks: string[];
  startingOwner?: SectorOwner;
  extra: boolean;
  controlArea?: string;
}

export interface SectorMapDefinition {
  id: string;
  name: string;
  code: string;
  theme: SectorTheme;
  anchorNodeId: string;
  globalNodeIds: string[];
  points: SectorPointDefinition[];
  terrainLabels: [string, string, string];
  routeKinds: CordonRouteKind[];
}

export interface SectorRouteDefinition {
  from: string;
  to: string;
  kind: CordonRouteKind;
  minutes: number;
  path: string;
}

interface RawPoint {
  id: string;
  name: string;
  type: SectorNodeType;
  income: number;
  terrain: string;
  tacticalValue: string;
  owner?: SectorOwner;
  description?: string;
}

type LayoutId = "fork" | "ring" | "grid" | "valley" | "river" | "corridor";
type GraphId = "fork" | "ring" | "grid" | "chain" | "cross";

const LAYOUTS: Record<LayoutId, Array<[number, number]>> = {
  fork: [[450, 72], [248, 180], [655, 184], [450, 318], [238, 500], [681, 506]],
  ring: [[450, 70], [690, 178], [718, 412], [510, 530], [244, 485], [200, 220]],
  grid: [[210, 132], [450, 112], [700, 150], [220, 438], [465, 348], [706, 464]],
  valley: [[160, 112], [350, 196], [575, 116], [735, 286], [518, 430], [250, 506]],
  river: [[188, 84], [340, 225], [662, 118], [550, 330], [725, 505], [250, 500]],
  corridor: [[450, 64], [450, 170], [290, 280], [610, 300], [450, 422], [450, 548]],
};

const GRAPHS: Record<GraphId, Array<[number, number]>> = {
  fork: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]],
  ring: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4]],
  grid: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]],
  chain: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 4]],
  cross: [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [4, 5]],
};

const THEME_COVER: Record<SectorTheme, number> = {
  swamp: 2,
  rural: 0,
  scrapyard: 8,
  industrial: 10,
  laboratory: 12,
  forest: 10,
  urban: 12,
  flooded: 5,
  psi: 4,
  nuclear: 14,
};

const TYPE_COVER: Record<SectorNodeType, number> = {
  base: 64,
  outpost: 48,
  camp: 38,
  anomaly: 20,
  shelter: 72,
};

function gridFor(x: number, y: number) {
  const column = String.fromCharCode(65 + Math.max(0, Math.min(8, Math.floor(x / 100))));
  const row = Math.max(1, Math.min(8, Math.floor(y / 78) + 1));
  return `${column}-${row}`;
}

function labelFor(x: number, y: number) {
  if (x < 240) return { labelX: x + 27, labelY: y - 22, anchor: "start" as const };
  if (x > 660) return { labelX: x - 27, labelY: y - 22, anchor: "end" as const };
  return { labelX: x, labelY: y < 105 ? y + 38 : y - 27, anchor: "middle" as const };
}

function makeSector(args: {
  id: string;
  name: string;
  code: string;
  theme: SectorTheme;
  anchorNodeId: string;
  globalNodeIds: string[];
  layout: LayoutId;
  graph: GraphId;
  terrainLabels: [string, string, string];
  routeKinds: CordonRouteKind[];
  points: RawPoint[];
}): SectorMapDefinition {
  const coordinates = LAYOUTS[args.layout];
  const edges = GRAPHS[args.graph];
  const links = args.points.map(() => [] as string[]);
  for (const [a, b] of edges) {
    links[a].push(args.points[b].id);
    links[b].push(args.points[a].id);
  }

  const points = args.points.map((point, index): SectorPointDefinition => {
    const [x, y] = coordinates[index];
    const cover = Math.min(88, TYPE_COVER[point.type] + THEME_COVER[args.theme]);
    const defenseBonus = Math.min(0.36, 0.02 + cover * 0.004);
    const attackBonus = point.type === "outpost" ? 0.11 : point.type === "base" ? 0.08 : point.type === "shelter" ? 0.06 : point.type === "anomaly" ? 0.09 : 0.04;
    const danger = point.type === "anomaly" ? "критическая" : point.type === "shelter" || point.type === "outpost" ? "высокая" : point.type === "base" ? "средняя" : "низкая";
    const sight = args.theme === "forest" || args.theme === "swamp" || args.theme === "flooded" ? "короткий" : point.type === "outpost" ? "дальний" : "средний";
    return {
      ...point,
      x,
      y,
      ...labelFor(x, y),
      grid: gridFor(x, y),
      cover,
      defenseBonus,
      attackBonus,
      captureFactor: 1 + defenseBonus,
      sight,
      danger,
      description: point.description ?? `${point.name}. Местность: ${point.terrain}.`,
      localLinks: links[index],
      startingOwner: point.owner,
      extra: !args.globalNodeIds.includes(point.id),
    };
  });

  return { ...args, points };
}

const CORDON_META: Record<string, Pick<SectorPointDefinition, "type" | "income" | "localLinks" | "startingOwner">> = {
  north_outpost: { type: "outpost", income: 690, localLinks: ["railway_checkpoint", "rail_tunnel"] },
  rail_tunnel: { type: "shelter", income: 470, localLinks: ["railway_checkpoint", "forest_camp", "north_outpost"] },
  railway_checkpoint: { type: "outpost", income: 560, localLinks: ["elevator", "rail_tunnel", "north_outpost"] },
  elevator: { type: "outpost", income: 430, localLinks: ["cordon", "farmstead", "railway_checkpoint"], startingOwner: "stalkers" },
  forest_camp: { type: "camp", income: 510, localLinks: ["farmstead", "rail_tunnel", "checkpoint"], startingOwner: "bandits" },
  farmstead: { type: "camp", income: 420, localLinks: ["cordon", "elevator", "forest_camp"] },
  cordon: { type: "base", income: 800, localLinks: ["farmstead", "elevator"], startingOwner: "stalkers" },
  checkpoint: { type: "outpost", income: 620, localLinks: ["forest_camp"], startingOwner: "military" },
};

const cordonSector: SectorMapDefinition = {
  id: "cordon",
  name: "КОРДОН",
  code: "S-02",
  theme: "rural",
  anchorNodeId: "cordon",
  globalNodeIds: ["cordon"],
  terrainLabels: ["СОСНОВЫЙ ЛЕС", "ЖЕЛЕЗНОДОРОЖНАЯ НАСЫПЬ", "ЮЖНАЯ ГРАНИЦА"],
  routeKinds: ["грунтовка", "лесная тропа", "шоссе", "насыпь"],
  points: CORDON_POINTS.map((point) => ({
    ...point,
    ...CORDON_META[point.id],
    danger: point.danger === "высокая" ? "высокая" : point.danger,
    extra: point.id !== "cordon",
  })),
};

export const SECTOR_MAPS: SectorMapDefinition[] = [
  makeSector({
    id: "swamps", name: "БОЛОТА", code: "S-01", theme: "swamp", anchorNodeId: "swamps",
    globalNodeIds: ["swamps", "fishing_hamlet", "machine_yard", "old_church"], layout: "river", graph: "grid",
    terrainLabels: ["ТОПЬ", "КАМЫШОВЫЕ ОСТРОВА", "ЮЖНИЙ КАНАЛ"], routeKinds: ["лесная тропа", "грунтовка"],
    points: [
      { id: "swamps", name: "База Чистого неба", type: "base", income: 650, terrain: "остров и насосная", tacticalValue: "штаб и сухое укрытие", owner: "clear_sky" },
      { id: "fishing_hamlet", name: "Рыбацкий хутор", type: "camp", income: 360, terrain: "затопленные дворы", tacticalValue: "западная тихая тропа", owner: "clear_sky" },
      { id: "machine_yard", name: "Машинный двор", type: "outpost", income: 520, terrain: "ржавые ангары", tacticalValue: "восточная развилка", owner: "clear_sky" },
      { id: "old_church", name: "Старая церковь", type: "shelter", income: 480, terrain: "каменные руины", tacticalValue: "убежище от Выброса" },
      { id: "burnt_farm", name: "Сгоревший хутор", type: "camp", income: 390, terrain: "чёрные сваи и вода", tacticalValue: "южный обход" },
      { id: "swamp_pump", name: "Насосная станция", type: "outpost", income: 540, terrain: "бетон над топью", tacticalValue: "контроль каналов", owner: "clear_sky" },
    ],
  }),
  cordonSector,
  makeSector({
    id: "garbage", name: "СВАЛКА", code: "S-03", theme: "scrapyard", anchorNodeId: "garbage",
    globalNodeIds: ["garbage", "flea_market", "hangar"], layout: "fork", graph: "cross",
    terrainLabels: ["КЛАДБИЩЕ ТЕХНИКИ", "СЕВЕРНАЯ ДОРОГА", "ПЫЛЬНЫЕ ОВРАГИ"], routeKinds: ["грунтовка", "шоссе", "насыпь"],
    points: [
      { id: "garbage", name: "Депо", type: "outpost", income: 980, terrain: "вагоны и техника", tacticalValue: "центральный узел" },
      { id: "flea_market", name: "Барахолка", type: "camp", income: 540, terrain: "торговые навесы", tacticalValue: "западный маршрут" },
      { id: "hangar", name: "Разрушенный ангар", type: "shelter", income: 610, terrain: "бетонный цех", tacticalValue: "прочное укрытие" },
      { id: "vehicle_graveyard", name: "Кладбище машин", type: "anomaly", income: 720, terrain: "остовы грузовиков", tacticalValue: "артефактное поле" },
      { id: "garbage_north", name: "Северный блокпост", type: "outpost", income: 630, terrain: "баррикады на дороге", tacticalValue: "выход к Ростку", owner: "duty" },
      { id: "junk_rail", name: "Разбитый состав", type: "camp", income: 470, terrain: "железнодорожная выемка", tacticalValue: "скрытый восточный ход", owner: "bandits" },
    ],
  }),
  makeSector({
    id: "dark_valley", name: "ТЁМНАЯ ДОЛИНА", code: "S-04", theme: "industrial", anchorNodeId: "dark_valley",
    globalNodeIds: ["dark_valley", "x18"], layout: "valley", graph: "ring",
    terrainLabels: ["ЗАВОДСКАЯ ЗОНА", "ВОСТОЧНЫЕ ХОЛМЫ", "СТАРЫЕ РЕЗЕРВУАРЫ"], routeKinds: ["грунтовка", "шоссе", "лесная тропа"],
    points: [
      { id: "dark_valley", name: "База Борова", type: "base", income: 920, terrain: "заводской двор", tacticalValue: "штаб бандитов", owner: "bandits" },
      { id: "x18", name: "Лаборатория X-18", type: "shelter", income: 860, terrain: "подземный комплекс", tacticalValue: "убежище и лаборатория", owner: "bandits" },
      { id: "pig_farm", name: "Старая свиноферма", type: "camp", income: 410, terrain: "длинные корпуса", tacticalValue: "западный опорник", owner: "bandits" },
      { id: "fuel_depot", name: "Топливная база", type: "outpost", income: 650, terrain: "цистерны и стены", tacticalValue: "огнеопасная высота", owner: "bandits" },
      { id: "valley_east_gate", name: "Восточные ворота", type: "outpost", income: 590, terrain: "дорога между холмами", tacticalValue: "выход к Дикой территории" },
      { id: "factory_yard", name: "Заводской двор", type: "anomaly", income: 740, terrain: "цеха и кислотные лужи", tacticalValue: "аномальный узел" },
    ],
  }),
  makeSector({
    id: "agroprom", name: "АГРОПРОМ", code: "S-05", theme: "industrial", anchorNodeId: "agroprom",
    globalNodeIds: ["agroprom", "agroprom_underground"], layout: "grid", graph: "grid",
    terrainLabels: ["КОМПЛЕКС НИИ", "ЗАПАДНЫЕ БОЛОТА", "СЛУЖЕБНАЯ ДОРОГА"], routeKinds: ["шоссе", "грунтовка", "насыпь"],
    points: [
      { id: "agroprom", name: "НИИ Агропром", type: "base", income: 1100, terrain: "научные корпуса", tacticalValue: "военный штаб", owner: "military" },
      { id: "agroprom_underground", name: "Подземелья", type: "shelter", income: 690, terrain: "катакомбы", tacticalValue: "скрытый переход", owner: "military" },
      { id: "agro_marsh", name: "Западная топь", type: "anomaly", income: 620, terrain: "грязь и камыш", tacticalValue: "артефактная зона" },
      { id: "military_yard", name: "Военный двор", type: "outpost", income: 720, terrain: "бетон и техника", tacticalValue: "передовая оборона", owner: "military" },
      { id: "agro_west_hill", name: "Западный холм", type: "camp", income: 450, terrain: "лесистая высота", tacticalValue: "наблюдательный пункт" },
      { id: "service_tunnel", name: "Служебный тоннель", type: "shelter", income: 580, terrain: "бетонный коллектор", tacticalValue: "обход главных ворот", owner: "military" },
    ],
  }),
  makeSector({
    id: "rostok", name: "РОСТОК", code: "S-06", theme: "industrial", anchorNodeId: "bar",
    globalNodeIds: ["bar", "rostok", "wild"], layout: "corridor", graph: "chain",
    terrainLabels: ["ПРОМЗОНА", "УКРЕПЛЁННЫЙ ПЕРИМЕТР", "ДИКАЯ ТЕРРИТОРИЯ"], routeKinds: ["шоссе", "насыпь", "грунтовка"],
    points: [
      { id: "bar", name: "Бар «100 рентген»", type: "base", income: 1350, terrain: "укреплённый городок", tacticalValue: "штаб Долга", owner: "duty" },
      { id: "duty_checkpoint", name: "Южний блокпост Долга", type: "outpost", income: 690, terrain: "бетонные ворота", tacticalValue: "южный коридор", owner: "duty" },
      { id: "rostok", name: "Промзона Росток", type: "outpost", income: 820, terrain: "цеха и трубы", tacticalValue: "центральный проход", owner: "duty" },
      { id: "arena_yard", name: "Арена", type: "camp", income: 560, terrain: "закрытый двор", tacticalValue: "резервный гарнизон", owner: "duty" },
      { id: "rail_junction", name: "Железнодорожный узел", type: "shelter", income: 670, terrain: "вагоны и насыпи", tacticalValue: "северный переход" },
      { id: "wild", name: "Дикая территория", type: "anomaly", income: 1080, terrain: "железнодорожные руины", tacticalValue: "богатое поле артефактов" },
    ],
  }),
  makeSector({
    id: "yantar", name: "ЯНТАРЬ", code: "S-07", theme: "laboratory", anchorNodeId: "yantar",
    globalNodeIds: ["yantar", "x16"], layout: "ring", graph: "ring",
    terrainLabels: ["ВЫСОХШЕЕ ОЗЕРО", "ПСИ-ПОЛЕ", "НАУЧНЫЙ ПЕРИМЕТР"], routeKinds: ["грунтовка", "лесная тропа"],
    points: [
      { id: "yantar", name: "Мобильный лагерь", type: "base", income: 1180, terrain: "бункер и техника", tacticalValue: "штаб экологов", owner: "ecologists" },
      { id: "x16", name: "Лаборатория X-16", type: "shelter", income: 930, terrain: "подземная установка", tacticalValue: "источник пси-поля", owner: "ecologists" },
      { id: "scientist_bunker", name: "Научный бункер", type: "shelter", income: 640, terrain: "герметичные модули", tacticalValue: "защита от Выброса", owner: "ecologists" },
      { id: "dried_lake", name: "Высохшее озеро", type: "anomaly", income: 820, terrain: "ил и химические лужи", tacticalValue: "артефактная котловина" },
      { id: "psi_station", name: "Пси-станция", type: "outpost", income: 710, terrain: "антенны и бетон", tacticalValue: "контроль излучения" },
      { id: "yantar_marsh", name: "Южная трясина", type: "camp", income: 430, terrain: "камыш и канавы", tacticalValue: "скрытая тропа" },
    ],
  }),
  makeSector({
    id: "warehouses", name: "АРМЕЙСКИЕ СКЛАДЫ", code: "S-08", theme: "rural", anchorNodeId: "warehouses",
    globalNodeIds: ["warehouses", "barrier"], layout: "fork", graph: "fork",
    terrainLabels: ["СКЛАДСКОЙ КОМПЛЕКС", "ЗАБРОШЕННАЯ ДЕРЕВНЯ", "СЕВЕРНЫЕ ХОЛМЫ"], routeKinds: ["шоссе", "грунтовка", "лесная тропа"],
    points: [
      { id: "warehouses", name: "База Свободы", type: "base", income: 1160, terrain: "казармы и склады", tacticalValue: "штаб Свободы", owner: "freedom" },
      { id: "barrier", name: "Барьер", type: "outpost", income: 840, terrain: "бетонный рубеж", tacticalValue: "северная линия", owner: "freedom" },
      { id: "bloodsucker_village", name: "Заброшенная деревня", type: "camp", income: 520, terrain: "пустые дома и сады", tacticalValue: "западный обход" },
      { id: "freedom_outpost", name: "Западный блокпост", type: "outpost", income: 630, terrain: "мешки и бронелисты", tacticalValue: "выход к Ростку", owner: "freedom" },
      { id: "warehouse_minefield", name: "Минное поле", type: "anomaly", income: 700, terrain: "воронки и растяжки", tacticalValue: "закрытый южный фланг" },
      { id: "hill_antenna", name: "Антенна на холме", type: "shelter", income: 610, terrain: "каменная высота", tacticalValue: "дальний обзор", owner: "freedom" },
    ],
  }),
  makeSector({
    id: "dead_city", name: "МЁРТВЫЙ ГОРОД", code: "S-09", theme: "urban", anchorNodeId: "dead_city",
    globalNodeIds: ["dead_city"], layout: "grid", graph: "grid",
    terrainLabels: ["ЦЕНТРАЛЬНЫЕ КВАРТАЛЫ", "ЗАТОПЛЕННАЯ УЛИЦА", "СЕВЕРНАЯ РАЗВЯЗКА"], routeKinds: ["шоссе", "грунтовка"],
    points: [
      { id: "dead_city", name: "База наёмников", type: "base", income: 1040, terrain: "административный квартал", tacticalValue: "штаб наёмников", owner: "mercenaries" },
      { id: "dead_hotel", name: "Городская гостиница", type: "shelter", income: 690, terrain: "многоэтажные руины", tacticalValue: "высота и укрытие", owner: "mercenaries" },
      { id: "merc_outpost", name: "Восточный пост", type: "outpost", income: 650, terrain: "перекрёсток и баррикады", tacticalValue: "восточные ворота", owner: "mercenaries" },
      { id: "dead_stadium", name: "Стадион", type: "camp", income: 470, terrain: "открытая чаша", tacticalValue: "площадка для резерва" },
      { id: "flooded_quarter", name: "Затопленный квартал", type: "anomaly", income: 760, terrain: "вода и провалы", tacticalValue: "аномальная ловушка" },
      { id: "dead_north_exit", name: "Северная развязка", type: "outpost", income: 720, terrain: "эстакады и бетон", tacticalValue: "дорога на Лиманск" },
    ],
  }),
  makeSector({
    id: "red_forest", name: "РЫЖИЙ ЛЕС", code: "N-01", theme: "forest", anchorNodeId: "red_forest",
    globalNodeIds: ["red_forest", "forester"], layout: "ring", graph: "ring",
    terrainLabels: ["РАДИОАКТИВНАЯ ЧАЩА", "СТАРЫЙ РУДНИК", "ТАНКОВАЯ РАЗВИЛКА"], routeKinds: ["лесная тропа", "грунтовка"],
    points: [
      { id: "red_forest", name: "Рыжая чаща", type: "anomaly", income: 1280, terrain: "радиоактивный лес", tacticalValue: "главная опасная развилка" },
      { id: "forester", name: "Башня Лесника", type: "camp", income: 620, terrain: "лесничество и вышка", tacticalValue: "безопасный ориентир" },
      { id: "red_mine", name: "Старый рудник", type: "shelter", income: 760, terrain: "штольни и отвалы", tacticalValue: "подземное укрытие" },
      { id: "tank_crossroad", name: "Танковая развилка", type: "outpost", income: 690, terrain: "дорога и бронеостов", tacticalValue: "контроль трёх троп" },
      { id: "burned_farm", name: "Сожжённая ферма", type: "camp", income: 440, terrain: "пепелище и заборы", tacticalValue: "южная стоянка" },
      { id: "anomaly_grove", name: "Аномальная роща", type: "anomaly", income: 890, terrain: "искривлённые деревья", tacticalValue: "богатое поле артефактов", owner: "mutants" },
    ],
  }),
  makeSector({
    id: "limansk", name: "ЛИМАНСК", code: "N-02", theme: "flooded", anchorNodeId: "limansk",
    globalNodeIds: ["limansk", "hospital"], layout: "river", graph: "chain",
    terrainLabels: ["ЗАТОПЛЕННЫЙ КАНАЛ", "СТАРЫЙ ЦЕНТР", "СЕВЕРНЫЙ МОСТ"], routeKinds: ["шоссе", "грунтовка"],
    points: [
      { id: "limansk", name: "Южные ворота", type: "base", income: 960, terrain: "баррикады и дома", tacticalValue: "штаб ренегатов", owner: "renegades" },
      { id: "limansk_canal", name: "Городской канал", type: "anomaly", income: 710, terrain: "вода и бетон", tacticalValue: "разделительная линия" },
      { id: "construction_site", name: "Стройплощадка", type: "outpost", income: 680, terrain: "каркасы и краны", tacticalValue: "высотная позиция", owner: "renegades" },
      { id: "limansk_school", name: "Старая школа", type: "shelter", income: 620, terrain: "кирпичные коридоры", tacticalValue: "прочный опорник", owner: "renegades" },
      { id: "limansk_bridge", name: "Северный мост", type: "outpost", income: 750, terrain: "узкий мост", tacticalValue: "единственный северный ход" },
      { id: "hospital", name: "Разрушенный госпиталь", type: "shelter", income: 720, terrain: "медицинский комплекс", tacticalValue: "переход к Припяти", owner: "renegades" },
    ],
  }),
  makeSector({
    id: "radar", name: "РАДАР", code: "N-03", theme: "psi", anchorNodeId: "radar",
    globalNodeIds: ["radar"], layout: "corridor", graph: "chain",
    terrainLabels: ["АНТЕННОЕ ПОЛЕ", "ПСИ-КОРИДОР", "СЕВЕРНЫЙ БУНКЕР"], routeKinds: ["шоссе", "лесная тропа"],
    points: [
      { id: "radar", name: "Выжигатель мозгов", type: "shelter", income: 1420, terrain: "антенный комплекс", tacticalValue: "центр пси-излучения" },
      { id: "antenna_field", name: "Антенное поле", type: "anomaly", income: 940, terrain: "мачты и кабели", tacticalValue: "открытая пси-зона" },
      { id: "radar_bunker", name: "Северный бункер", type: "shelter", income: 780, terrain: "подземные камеры", tacticalValue: "убежище от излучения", owner: "monolith" },
      { id: "radar_forest_road", name: "Лесная дорога", type: "camp", income: 460, terrain: "густой лес", tacticalValue: "скрытый обход" },
      { id: "psi_gate", name: "Пси-ворота", type: "outpost", income: 820, terrain: "бетонный проход", tacticalValue: "северный рубеж", owner: "monolith" },
      { id: "radar_service", name: "Служебный лагерь", type: "camp", income: 520, terrain: "вагончики и траншеи", tacticalValue: "южний резерв" },
    ],
  }),
  makeSector({
    id: "north", name: "ПРИПЯТЬ · ЧАЭС", code: "N-04", theme: "nuclear", anchorNodeId: "pripyat",
    globalNodeIds: ["pripyat", "cnpp"], layout: "valley", graph: "chain",
    terrainLabels: ["ПРИПЯТСКИЕ КВАРТАЛЫ", "ПРОМЫШЛЕННЫЙ КОРИДОР", "ПЕРИМЕТР ЧАЭС"], routeKinds: ["шоссе", "насыпь"],
    points: [
      { id: "pripyat", name: "Центр Припяти", type: "base", income: 1650, terrain: "городские высотки", tacticalValue: "цитадель Монолита", owner: "monolith" },
      { id: "pripyat_square", name: "Центральная площадь", type: "outpost", income: 900, terrain: "бетон и открытый обзор", tacticalValue: "городская развилка", owner: "monolith" },
      { id: "hotel_polissya", name: "Гостиница «Полесье»", type: "shelter", income: 840, terrain: "высотное здание", tacticalValue: "снайперская позиция", owner: "monolith" },
      { id: "pripyat_underpass", name: "Подземный переход", type: "shelter", income: 760, terrain: "тоннели и метро", tacticalValue: "скрытый маршрут" },
      { id: "cnpp_gate", name: "Ворота ЧАЭС", type: "outpost", income: 1080, terrain: "бетонный периметр", tacticalValue: "единственный вход", owner: "monolith" },
      { id: "cnpp", name: "ЧАЭС", type: "shelter", income: 2200, terrain: "энергоблоки", tacticalValue: "северная цитадель", owner: "monolith" },
    ],
  }),
  makeSector({
    id: "outskirts", name: "СЕВЕРО-ВОСТОК", code: "N-05", theme: "flooded", anchorNodeId: "jupiter",
    globalNodeIds: ["jupiter", "yanov", "zaton", "skadovsk"], layout: "fork", graph: "fork",
    terrainLabels: ["ЗАВОД ЮПИТЕР", "ЗАТОПЛЕННЫЕ ПОЛЯ", "СУХОГРУЗЫ ЗАТОНА"], routeKinds: ["шоссе", "грунтовка", "насыпь"],
    points: [
      { id: "jupiter", name: "Завод «Юпитер»", type: "outpost", income: 1240, terrain: "цеха и железная дорога", tacticalValue: "промышленный узел" },
      { id: "yanov", name: "Станция Янов", type: "camp", income: 760, terrain: "железнодорожная станция", tacticalValue: "перевалочный пункт" },
      { id: "zaton", name: "Аномальный Затон", type: "anomaly", income: 1320, terrain: "болота и сухогрузы", tacticalValue: "богатая аномальная зона" },
      { id: "skadovsk", name: "Скадовск", type: "shelter", income: 710, terrain: "ржавый сухогруз", tacticalValue: "защищённая стоянка" },
      { id: "container_yard", name: "Контейнерный двор", type: "outpost", income: 680, terrain: "контейнеры и краны", tacticalValue: "восточный коридор", owner: "bandits" },
      { id: "cooling_tower", name: "Градирня", type: "shelter", income: 860, terrain: "бетонная башня", tacticalValue: "дальний ориентир" },
    ],
  }),
];

export function getSectorMap(sectorId: string | null | undefined) {
  return sectorId ? SECTOR_MAPS.find((sector) => sector.id === sectorId) : undefined;
}

export function getSectorForNode(nodeId: string) {
  return SECTOR_MAPS.find((sector) => sector.points.some((point) => point.id === nodeId));
}

export function findSectorPoint(pointId: string) {
  for (const sector of SECTOR_MAPS) {
    const point = sector.points.find((item) => item.id === pointId);
    if (point) return point;
  }
  return undefined;
}

function routeCurve(from: SectorPointDefinition, to: SectorPointDefinition, key: string) {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bend = (Math.abs(hash) % 2 ? 1 : -1) * (0.045 + (Math.abs(hash) % 3) * 0.012);
  const cx = (from.x + to.x) / 2 - dy * bend;
  const cy = (from.y + to.y) / 2 + dx * bend;
  return `M${from.x} ${from.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x} ${to.y}`;
}

export function getSectorRoutes(sectorId: string): SectorRouteDefinition[] {
  if (sectorId === "cordon") return CORDON_ROUTES.map((route) => ({ ...route }));
  const sector = getSectorMap(sectorId);
  if (!sector) return [];
  const routes: SectorRouteDefinition[] = [];
  const seen = new Set<string>();
  for (const point of sector.points) {
    for (const linkedId of point.localLinks) {
      const key = [point.id, linkedId].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      const linked = sector.points.find((item) => item.id === linkedId);
      if (!linked) continue;
      const distance = Math.hypot(linked.x - point.x, linked.y - point.y);
      const routeIndex = Math.abs([...key].reduce((sum, char) => sum + char.charCodeAt(0), 0));
      const kind = sector.routeKinds[routeIndex % sector.routeKinds.length];
      const terrainPenalty = kind === "лесная тропа" ? 5 : kind === "насыпь" ? 3 : kind === "шоссе" ? -3 : 1;
      const minutes = Math.max(11, Math.min(34, Math.round(distance / 17) + terrainPenalty));
      routes.push({ from: point.id, to: linked.id, kind, minutes, path: routeCurve(point, linked, key) });
    }
  }
  return routes;
}

export function getSectorRoute(from: string, to: string) {
  const sector = getSectorForNode(from);
  if (!sector || !sector.points.some((point) => point.id === to)) return undefined;
  return getSectorRoutes(sector.id).find((route) =>
    (route.from === from && route.to === to) || (route.from === to && route.to === from),
  );
}

export const EXTRA_SECTOR_NODES = SECTOR_MAPS.flatMap((sector) =>
  sector.points.filter((point) => point.extra && sector.id !== "cordon").map((point) => ({
    id: point.id,
    name: point.name,
    type: point.type,
    income: point.income,
    sectorId: sector.id,
    globalAnchorId: sector.anchorNodeId,
    localLinks: point.localLinks,
    startingOwner: point.startingOwner,
  })),
);

export const SECTOR_POINT_INTEL = Object.fromEntries(
  SECTOR_MAPS.flatMap((sector) => sector.points.map((point) => [point.id, {
    sector: sector.name.charAt(0) + sector.name.slice(1).toLowerCase(),
    grid: point.grid,
    terrain: point.terrain,
    threat: point.danger,
    note: point.description,
  }])),
);

export interface TacticalLayout {
  theme: SectorTheme;
  terrain: string;
  covers: Array<{ left: number; top: number; width: number; height: number; rotate: number; label: string }>;
  roads: Array<{ top: number; left: number; width: number; rotate: number }>;
  danger: { left: number; top: number; width: number; height: number; label: string };
}

function hashText(text: string) {
  let hash = 17;
  for (const char of text) hash = (hash * 37 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

const COVER_LABELS: Record<SectorTheme, string[]> = {
  swamp: ["КАМЫШ", "ОСТРОВОК", "СВАИ"],
  rural: ["ДОМ", "ЗАБОР", "САРАЙ"],
  scrapyard: ["ОСТОВЫ", "КОНТЕЙНЕР", "МЕТАЛЛ"],
  industrial: ["АНГАР", "БЕТОН", "ТРУБЫ"],
  laboratory: ["ШЛЮЗ", "БЛОК", "ГЕНЕРАТОР"],
  forest: ["ВАЛЕЖНИК", "КАМНИ", "ЧАЩА"],
  urban: ["ФАСАД", "БАРРИКАДА", "ПОДЪЕЗД"],
  flooded: ["СУХОГРУЗ", "НАБЕРЕЖНАЯ", "ДОМ"],
  psi: ["АНТЕННА", "БЕТОН", "КАБЕЛИ"],
  nuclear: ["ЭНЕРГОБЛОК", "КПП", "ТРУБОПРОВОД"],
};

export function getTacticalLayout(nodeId: string): TacticalLayout {
  const sector = getSectorForNode(nodeId) ?? SECTOR_MAPS[0];
  const point = findSectorPoint(nodeId);
  const hash = hashText(nodeId);
  const labels = COVER_LABELS[sector.theme];
  return {
    theme: sector.theme,
    terrain: point?.terrain ?? "неизвестная местность",
    covers: [0, 1, 2].map((index) => ({
      left: 10 + ((hash >> (index * 3)) % 62),
      top: 12 + ((hash >> (index * 5 + 2)) % 54),
      width: 14 + ((hash >> (index * 4 + 1)) % 12),
      height: 9 + ((hash >> (index * 2 + 3)) % 10),
      rotate: -9 + ((hash >> (index * 3 + 4)) % 18),
      label: labels[index],
    })),
    roads: [
      { top: 37 + (hash % 18), left: -8, width: 118, rotate: -18 + (hash % 32) },
      { top: 18 + ((hash >> 4) % 35), left: 32, width: 76, rotate: 48 + ((hash >> 7) % 28) },
    ],
    danger: {
      left: 30 + ((hash >> 5) % 22),
      top: 28 + ((hash >> 8) % 24),
      width: 20 + ((hash >> 11) % 14),
      height: 18 + ((hash >> 13) % 14),
      label: point?.danger === "критическая" ? "КРИТИЧЕСКАЯ ЗОНА" : "ОТКРЫТЫЙ СЕКТОР",
    },
  };
}
