export type ItemCategory = "weapon" | "armor" | "artifact" | "consumable" | "mutant_part";
export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export interface ZoneItemDefinition {
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  tier: number;
  price: number;
  description: string;
  ammo?: string;
  effects: {
    damage?: number;
    accuracy?: number;
    range?: number;
    magazine?: number;
    protection?: number;
    mobility?: number;
    radiation?: number;
    psi?: number;
    recovery?: number;
    artifactYield?: number;
    carry?: number;
  };
}

const ZONE_ITEM_DEFINITIONS = {
  makarov: { name: "ПМ", category: "weapon", rarity: "common", tier: 0, price: 900, ammo: "9×18", description: "Запасной пистолет. Надёжен, но почти бесполезен против тяжёлой брони.", effects: { damage: 0.92, accuracy: -0.02, range: -18, magazine: 8 } },
  sawed_off: { name: "Обрез ТОЗ-66", category: "weapon", rarity: "common", tier: 0, price: 1700, ammo: "12/70", description: "Смертелен в помещении, быстро теряет силу на открытой местности.", effects: { damage: 1.18, accuracy: -0.06, range: -38, magazine: 2 } },
  viper5: { name: "Гадюка-5", category: "weapon", rarity: "common", tier: 0, price: 3200, ammo: "9×19", description: "Компактный пистолет-пулемёт для новичков и ближнего боя.", effects: { damage: 0.96, accuracy: 0.02, range: -12, magazine: 30, mobility: 0.05 } },
  ak74u: { name: "АКС-74У", category: "weapon", rarity: "uncommon", tier: 1, price: 5200, ammo: "5,45×39", description: "Короткий автомат для рейдов, караванов и тесных промзон.", effects: { damage: 1.04, accuracy: 0.01, range: 4, magazine: 30, mobility: 0.03 } },
  ak74: { name: "АК-74", category: "weapon", rarity: "uncommon", tier: 1, price: 7600, ammo: "5,45×39", description: "Рабочая лошадь Зоны: доступные патроны, средняя дальность и ремонтопригодность.", effects: { damage: 1.1, accuracy: 0.035, range: 18, magazine: 30 } },
  abakan: { name: "Обокан", category: "weapon", rarity: "rare", tier: 2, price: 12600, ammo: "5,45×39", description: "Точный автомат с быстрым отсечённым залпом. Требует обученных стрелков.", effects: { damage: 1.16, accuracy: 0.075, range: 28, magazine: 30 } },
  trs301: { name: "ТРс-301", category: "weapon", rarity: "rare", tier: 2, price: 14200, ammo: "5,56×45", description: "Лёгкая западная винтовка наёмников. Точна, но снабжение дороже.", effects: { damage: 1.14, accuracy: 0.09, range: 34, magazine: 30, mobility: 0.02 } },
  groza: { name: "Гром-С14", category: "weapon", rarity: "rare", tier: 2, price: 16800, ammo: "9×39", description: "Компактный штурмовой комплекс для пробития брони на средней дистанции.", effects: { damage: 1.28, accuracy: 0.045, range: 24, magazine: 20 } },
  vintorez: { name: "Винтарь ВС", category: "weapon", rarity: "rare", tier: 2, price: 18500, ammo: "9×39", description: "Бесшумная винтовка. Особенно сильна из укрытия и в засаде.", effects: { damage: 1.24, accuracy: 0.11, range: 58, magazine: 10, mobility: -0.02 } },
  svd: { name: "СВДм-2", category: "weapon", rarity: "rare", tier: 2, price: 21400, ammo: "7,62×54", description: "Дальнобойная винтовка для открытых рубежей и контрснайперской работы.", effects: { damage: 1.34, accuracy: 0.105, range: 88, magazine: 10, mobility: -0.04 } },
  rpk: { name: "РП-74", category: "weapon", rarity: "rare", tier: 2, price: 19600, ammo: "5,45×39", description: "Ручной пулемёт. Держит противника под подавлением, но замедляет группу.", effects: { damage: 1.22, accuracy: 0.025, range: 42, magazine: 45, mobility: -0.08 } },
  pkp: { name: "ПКМ", category: "weapon", rarity: "legendary", tier: 3, price: 32000, ammo: "7,62×54", description: "Тяжёлая огневая поддержка для бронегрупп и обороны баз.", effects: { damage: 1.42, accuracy: 0.035, range: 66, magazine: 100, mobility: -0.14 } },
  fn2000: { name: "ФТ-200М", category: "weapon", rarity: "legendary", tier: 3, price: 35500, ammo: "5,56×45", description: "Редкий комплекс с оптикой и высокой точностью автоматического огня.", effects: { damage: 1.3, accuracy: 0.14, range: 62, magazine: 30 } },
  gauss: { name: "Гаусс-пушка", category: "weapon", rarity: "legendary", tier: 3, price: 68000, ammo: "аккумуляторы", description: "Экспериментальное оружие. Огромная дальность и пробитие, почти отсутствует на рынке.", effects: { damage: 1.72, accuracy: 0.18, range: 130, magazine: 10, mobility: -0.12 } },

  leather_jacket: { name: "Кожаная куртка", category: "armor", rarity: "common", tier: 0, price: 800, description: "Защита от веток и ножа. Не спасает от автоматной очереди.", effects: { protection: 0.01, mobility: 0.05 } },
  bandit_coat: { name: "Бандитский плащ", category: "armor", rarity: "common", tier: 0, price: 1600, description: "Плотный плащ со скрытыми карманами. Удобен для добычи и засад.", effects: { protection: 0.03, carry: 0.1 } },
  stalker_suit: { name: "Комбинезон «Заря»", category: "armor", rarity: "uncommon", tier: 1, price: 7200, description: "Сбалансированный костюм для маршрутов, аномалий и перестрелок.", effects: { protection: 0.09, radiation: 0.12, mobility: 0.01 } },
  merc_suit: { name: "Комбинезон наёмника", category: "armor", rarity: "rare", tier: 2, price: 14600, description: "Лёгкая броня, разгрузка и хорошая подвижность в городском бою.", effects: { protection: 0.15, mobility: 0.05, carry: 0.08 } },
  seva: { name: "СЕВА", category: "armor", rarity: "rare", tier: 2, price: 22000, description: "Герметичный научный костюм. Слабее тяжёлой брони, но держит радиацию и пси-фон.", effects: { protection: 0.12, radiation: 0.42, psi: 0.24, mobility: -0.04 } },
  psz9: { name: "ПСЗ-9Д", category: "armor", rarity: "rare", tier: 2, price: 24800, description: "Штурмовая броня Долга для удержания рубежей и промышленных боёв.", effects: { protection: 0.24, radiation: 0.12, mobility: -0.08 } },
  bulat: { name: "СКАТ-9М", category: "armor", rarity: "legendary", tier: 3, price: 38000, description: "Военный бронекостюм с высокой пулестойкостью и замкнутым дыханием.", effects: { protection: 0.3, radiation: 0.24, psi: 0.08, mobility: -0.1 } },
  exoskeleton: { name: "Экзоскелет", category: "armor", rarity: "legendary", tier: 3, price: 52000, description: "Максимальная защита и переносимый вес ценой скорости и выносливости.", effects: { protection: 0.38, carry: 0.35, mobility: -0.18 } },
  ecologist_suit: { name: "ССП-99М", category: "armor", rarity: "legendary", tier: 3, price: 41000, description: "Научный костюм для самых грязных аномальных полей. В открытом бою уязвим.", effects: { protection: 0.1, radiation: 0.58, psi: 0.34, mobility: -0.06 } },

  jellyfish: { name: "Медуза", category: "artifact", rarity: "common", tier: 0, price: 3200, description: "Выводит часть радионуклидов, но слегка утяжеляет экипировку.", effects: { radiation: 0.12, mobility: -0.02 } },
  stone_blood: { name: "Каменная кровь", category: "artifact", rarity: "common", tier: 0, price: 4300, description: "Ускоряет восстановление тканей, повышая чувствительность к радиации.", effects: { recovery: 0.12, radiation: -0.06 } },
  flash: { name: "Вспышка", category: "artifact", rarity: "uncommon", tier: 1, price: 7200, description: "Повышает скорость реакции и перемещения группы.", effects: { mobility: 0.08 } },
  night_star: { name: "Ночная звезда", category: "artifact", rarity: "uncommon", tier: 1, price: 8600, description: "Облегчает перенос груза и тяжёлого вооружения.", effects: { carry: 0.18, mobility: 0.02 } },
  crystal: { name: "Кристалл", category: "artifact", rarity: "uncommon", tier: 1, price: 9800, description: "Снижает радиационный урон в активных аномальных полях.", effects: { radiation: 0.24 } },
  moonlight: { name: "Лунный свет", category: "artifact", rarity: "rare", tier: 2, price: 15800, description: "Поддерживает нервную систему и сопротивление пси-воздействию.", effects: { psi: 0.22, recovery: 0.05 } },
  soul: { name: "Душа", category: "artifact", rarity: "rare", tier: 2, price: 18500, description: "Сильно ускоряет восстановление, но фонит радиацией.", effects: { recovery: 0.25, radiation: -0.12 } },
  kolobok: { name: "Колобок", category: "artifact", rarity: "rare", tier: 2, price: 22400, description: "Укрепляет ткани и снижает тяжесть ранений.", effects: { protection: 0.12, recovery: 0.1 } },
  battery: { name: "Батарейка", category: "artifact", rarity: "rare", tier: 2, price: 24600, description: "Поддерживает выносливость тяжёлых бойцов и экзоскелетов.", effects: { mobility: 0.11, recovery: 0.08 } },
  bubble: { name: "Пузырь", category: "artifact", rarity: "legendary", tier: 3, price: 39000, description: "Один из лучших поглотителей радиации в Зоне.", effects: { radiation: 0.48 } },
  compass: { name: "Компас", category: "artifact", rarity: "legendary", tier: 3, price: 62000, description: "Редчайший артефакт, будто подсказывающий безопасный путь через аномалии.", effects: { mobility: 0.14, protection: 0.08, artifactYield: 0.22 } },

  bandage: { name: "Бинт", category: "consumable", rarity: "common", tier: 0, price: 250, description: "Останавливает кровотечение после боя.", effects: { recovery: 0.03 } },
  medkit: { name: "Аптечка", category: "consumable", rarity: "common", tier: 0, price: 900, description: "Базовый полевой набор лечения.", effects: { recovery: 0.12 } },
  army_medkit: { name: "Армейская аптечка", category: "consumable", rarity: "uncommon", tier: 1, price: 1900, description: "Быстро возвращает раненых бойцов в строй.", effects: { recovery: 0.22 } },
  antirad: { name: "Антирад", category: "consumable", rarity: "uncommon", tier: 1, price: 1100, description: "Снижает накопленную дозу перед выходом в заражённый сектор.", effects: { radiation: 0.18 } },
  ammo_crate: { name: "Ящик боеприпасов", category: "consumable", rarity: "uncommon", tier: 1, price: 2400, description: "Разнокалиберные патроны для снабжения отряда.", effects: { carry: 0.05 } },
  grenade_f1: { name: "Граната Ф-1", category: "consumable", rarity: "uncommon", tier: 1, price: 950, description: "Осколочная граната для выбивания противника из укрытия.", effects: { damage: 1.15 } },

  dog_tail: { name: "Хвост слепого пса", category: "mutant_part", rarity: "common", tier: 0, price: 420, description: "Дешёвый биоматериал для простых заказов.", effects: {} },
  boar_hoof: { name: "Копыто кабана", category: "mutant_part", rarity: "common", tier: 0, price: 650, description: "Плотная костная ткань, интересующая полевых медиков.", effects: {} },
  snork_foot: { name: "Стопа снорка", category: "mutant_part", rarity: "uncommon", tier: 1, price: 1400, description: "Образец изменённой мышечной ткани.", effects: {} },
  bloodsucker_tentacles: { name: "Щупальца кровососа", category: "mutant_part", rarity: "rare", tier: 2, price: 5200, description: "Редкий трофей для научных лабораторий и чёрного рынка.", effects: {} },
  controller_brain: { name: "Ткань мозга контролёра", category: "mutant_part", rarity: "rare", tier: 2, price: 7600, description: "Опасный пси-активный образец. Нужен герметичный контейнер.", effects: {} },
  burer_hand: { name: "Кисть бюрера", category: "mutant_part", rarity: "rare", tier: 2, price: 6800, description: "Ткань с аномальной нейромышечной проводимостью.", effects: {} },
  chimera_claw: { name: "Коготь химеры", category: "mutant_part", rarity: "legendary", tier: 3, price: 11800, description: "Доказательство убийства одного из опаснейших хищников Зоны.", effects: {} },
  giant_eye: { name: "Глаз псевдогиганта", category: "mutant_part", rarity: "legendary", tier: 3, price: 14500, description: "Тяжёлый редкий образец для крупного научного контракта.", effects: {} },
} as const satisfies Record<string, ZoneItemDefinition>;

export type ZoneItemId = keyof typeof ZONE_ITEM_DEFINITIONS;
export const ZONE_ITEMS: Record<ZoneItemId, ZoneItemDefinition> = ZONE_ITEM_DEFINITIONS;
export type ContentInventory = Partial<Record<ZoneItemId, number>>;

export const STARTING_EQUIPMENT: Record<string, { weapon: ZoneItemId; armor: ZoneItemId }> = {
  stalkers: { weapon: "ak74u", armor: "stalker_suit" }, duty: { weapon: "ak74", armor: "psz9" }, freedom: { weapon: "trs301", armor: "stalker_suit" },
  bandits: { weapon: "sawed_off", armor: "bandit_coat" }, military: { weapon: "abakan", armor: "bulat" }, monolith: { weapon: "groza", armor: "bulat" },
  mercenaries: { weapon: "trs301", armor: "merc_suit" }, ecologists: { weapon: "viper5", armor: "seva" }, clear_sky: { weapon: "ak74u", armor: "stalker_suit" }, renegades: { weapon: "sawed_off", armor: "bandit_coat" },
};

export interface LocationContentProfile {
  name: string;
  description: string;
  lootTier: number;
  radiation: number;
  psi: number;
  mutantPressure: number;
  travel: number;
  accuracy: number;
  artifactTable: ZoneItemId[];
  lootTags: string[];
}

const DEFAULT_ARTIFACTS: ZoneItemId[] = ["jellyfish", "stone_blood", "flash", "night_star"];

const SECTOR_CONTENT: Record<string, LocationContentProfile> = {
  swamps: { name: "Болотный край", description: "Топи режут скорость, скрывают тропы и кормят стаи. Лёгкое снаряжение важнее тяжёлой брони.", lootTier: 1, radiation: .12, psi: 0, mutantPressure: .75, travel: 1.22, accuracy: -.04, artifactTable: ["jellyfish", "stone_blood", "flash"], lootTags: ["медицина", "лёгкое оружие", "тайники"] },
  cordon: { name: "Южный рубеж", description: "Дешёвые стволы, новички и военные патрули. Опасность низкая, добыча скромная.", lootTier: 1, radiation: .05, psi: 0, mutantPressure: .45, travel: 1, accuracy: 0, artifactTable: ["jellyfish", "stone_blood"], lootTags: ["гражданское оружие", "боеприпасы", "еда"] },
  garbage: { name: "Свалка", description: "Металлолом, караваны и засады. Высокий шанс снабжения и оружейных деталей.", lootTier: 1, radiation: .12, psi: 0, mutantPressure: .55, travel: 1.08, accuracy: -.02, artifactTable: ["jellyfish", "flash", "night_star"], lootTags: ["детали", "оружие", "караванные грузы"] },
  dark_valley: { name: "Тёмная долина", description: "Бандитские склады и лабораторные выбросы. Добыча лучше, но за неё почти всегда приходится драться.", lootTier: 2, radiation: .2, psi: .06, mutantPressure: .7, travel: 1.08, accuracy: 0, artifactTable: ["stone_blood", "night_star", "crystal"], lootTags: ["контрабанда", "броня", "лабораторные материалы"] },
  agroprom: { name: "Агропром", description: "Военные склады наверху, тёмные тоннели внизу. Хороший источник армейского снаряжения.", lootTier: 2, radiation: .14, psi: .05, mutantPressure: .62, travel: 1.05, accuracy: .02, artifactTable: ["flash", "crystal", "moonlight"], lootTags: ["армейское оружие", "броня", "документы"] },
  rostok: { name: "Росток", description: "Укреплённый торговый узел. Мутантов меньше, цены и трафик выше.", lootTier: 2, radiation: .04, psi: 0, mutantPressure: .22, travel: .92, accuracy: .03, artifactTable: DEFAULT_ARTIFACTS, lootTags: ["торговля", "ремонт", "боеприпасы"] },
  yantar: { name: "Янтарь", description: "Научные группы работают под постоянным пси-фоном. Здесь ценят образцы и защитные костюмы.", lootTier: 2, radiation: .26, psi: .32, mutantPressure: .68, travel: 1.12, accuracy: -.03, artifactTable: ["crystal", "moonlight", "soul", "bubble"], lootTags: ["научное снаряжение", "образцы", "пси-защита"] },
  warehouses: { name: "Армейские склады", description: "Открытые поля и укреплённые ангары. Дальний огонь силён, тяжёлые грузы доступны.", lootTier: 2, radiation: .1, psi: 0, mutantPressure: .42, travel: .98, accuracy: .05, artifactTable: ["flash", "night_star", "battery"], lootTags: ["военные склады", "пулемёты", "взрывчатка"] },
  dead_city: { name: "Мёртвый город", description: "Пустые кварталы дают укрытие наёмникам и кровососам. Редкое оружие встречается чаще.", lootTier: 3, radiation: .18, psi: .12, mutantPressure: .82, travel: 1.1, accuracy: -.02, artifactTable: ["moonlight", "soul", "kolobok"], lootTags: ["западное оружие", "оптика", "медицинские склады"] },
  red_forest: { name: "Рыжий лес", description: "Плотная чаща, высокая радиация и крупные хищники. Один из главных источников редких артефактов.", lootTier: 3, radiation: .38, psi: .2, mutantPressure: 1, travel: 1.28, accuracy: -.08, artifactTable: ["soul", "kolobok", "battery", "compass"], lootTags: ["редкие артефакты", "охотничьи тайники", "части мутантов"] },
  limansk: { name: "Лиманск", description: "Городские коридоры и постоянные перестрелки. Броня и штурмовое оружие решают исход боя.", lootTier: 3, radiation: .16, psi: .1, mutantPressure: .55, travel: 1.12, accuracy: -.01, artifactTable: ["crystal", "moonlight", "kolobok"], lootTags: ["штурмовое оружие", "броня", "военные тайники"] },
  radar: { name: "Радар", description: "Тяжёлый пси-фон ломает мораль и управление. Без защиты даже сильный отряд теряет боеспособность.", lootTier: 3, radiation: .34, psi: .65, mutantPressure: .78, travel: 1.24, accuracy: -.06, artifactTable: ["moonlight", "battery", "bubble", "compass"], lootTags: ["пси-оборудование", "оружие Монолита", "редкие артефакты"] },
  jupiter: { name: "Окрестности Юпитера", description: "Промышленная зона богата техникой, инструментом и тяжёлым вооружением.", lootTier: 3, radiation: .25, psi: .08, mutantPressure: .7, travel: 1.08, accuracy: .01, artifactTable: ["night_star", "kolobok", "battery", "bubble"], lootTags: ["техника", "тяжёлое оружие", "экзоскелеты"] },
  pripyat: { name: "Север Зоны", description: "Монолит, элитные отряды и смертельные мутанты. Здесь лежит лучшая добыча и гибнут лучшие группы.", lootTier: 3, radiation: .42, psi: .38, mutantPressure: .95, travel: 1.18, accuracy: -.02, artifactTable: ["kolobok", "battery", "bubble", "compass"], lootTags: ["элитное оружие", "экзоскелеты", "экспериментальные образцы"] },
};

const SPECIAL_LOCATIONS: Partial<Record<string, Partial<LocationContentProfile>>> = {
  x18: { name: "Лаборатория X-18", psi: .42, radiation: .38, mutantPressure: .92, lootTier: 3, lootTags: ["документы X-18", "научные контейнеры", "редкое оружие"] },
  x16: { name: "Лаборатория X-16", psi: .72, radiation: .34, mutantPressure: .9, lootTier: 3, lootTags: ["пси-излучатели", "герметичные контейнеры", "редкие образцы"] },
  cnpp: { name: "ЧАЭС", psi: .55, radiation: .75, mutantPressure: 1, lootTier: 3, travel: 1.35, lootTags: ["оружие Монолита", "Гаусс-боеприпасы", "легендарные артефакты"] },
  bar: { radiation: 0, psi: 0, mutantPressure: .08, travel: .86, accuracy: .04, lootTags: ["торговля", "ремонт", "контракты"] },
  flea_market: { radiation: .02, mutantPressure: .15, lootTags: ["случайное оружие", "части брони", "контрабанда"] },
  zaton: { radiation: .48, mutantPressure: .86, artifactTable: ["crystal", "soul", "bubble", "compass"] },
  zalesie: { name: "Залесье", description: "Главный перевалочный хаб Малой Зоны: дешёвое снабжение, новички, торговцы и множество первых контрактов.", lootTier: 1, radiation: .02, psi: 0, mutantPressure: .2, travel: .9, lootTags: ["торговля", "еда", "боеприпасы"] },
  malachite: { name: "НТЦ «Малахит»", description: "Научный комплекс с хорошей защитой, лабораторным снаряжением и высоким спросом на образцы.", lootTier: 3, radiation: .16, psi: .18, mutantPressure: .35, artifactTable: ["crystal", "moonlight", "battery", "bubble"], lootTags: ["научное снаряжение", "детекторы", "герметичные контейнеры"] },
  duga: { name: "Дуга", description: "Огромный антенный комплекс, военные развязки и открытые простреливаемые пространства.", lootTier: 2, radiation: .22, psi: .32, mutantPressure: .55, travel: 1.18, accuracy: .04, lootTags: ["военные тайники", "радиооборудование", "броня"] },
  cooling_towers: { name: "Градирни", description: "Радиоактивная промышленная зона с сильными аномалиями и дорогими артефактами.", lootTier: 3, radiation: .52, psi: .12, mutantPressure: .8, travel: 1.2, artifactTable: ["soul", "kolobok", "battery", "compass"], lootTags: ["редкие артефакты", "промышленные тайники", "тяжёлое оружие"] },
  sircaa: { name: "НИИЧАЗ", description: "Закрытый исследовательский комплекс: превосходная защита, экспериментальное оборудование и редкие контракты.", lootTier: 3, radiation: .08, psi: .2, mutantPressure: .18, travel: .92, accuracy: .04, lootTags: ["экспериментальные образцы", "электроника", "научные документы"] },
  ikar: { name: "Лагерь «Икар»", description: "Укреплённый лагерь на болотном направлении, удобный для патрулей и снабжения Затона.", lootTier: 2, radiation: .1, psi: 0, mutantPressure: .38, travel: .98, lootTags: ["армейские припасы", "ремкомплекты", "контракты"] },
  energetik: { name: "ДК «Энергетик»", description: "Последний безопасный форпост в Припяти, окружённый элитными противниками и ценными тайниками.", lootTier: 3, radiation: .44, psi: .3, mutantPressure: .82, travel: 1.12, lootTags: ["элитное оружие", "медицинские запасы", "редкие тайники"] },
};

export function getLocationContent(nodeId: string, sectorId?: string, nodeType?: string): LocationContentProfile {
  const base = SECTOR_CONTENT[sectorId ?? ""] ?? {
    name: "Неизведанный район", description: "Разведданных мало. Угроза и добыча определяются типом точки.", lootTier: nodeType === "base" ? 2 : 1,
    radiation: nodeType === "anomaly" ? .3 : .08, psi: 0, mutantPressure: nodeType === "anomaly" ? .72 : .45, travel: 1, accuracy: 0,
    artifactTable: DEFAULT_ARTIFACTS, lootTags: ["припасы", "тайники"],
  };
  return { ...base, ...(SPECIAL_LOCATIONS[nodeId] ?? {}), artifactTable: SPECIAL_LOCATIONS[nodeId]?.artifactTable ?? base.artifactTable, lootTags: SPECIAL_LOCATIONS[nodeId]?.lootTags ?? base.lootTags };
}

export const ITEM_RARITY_LABELS: Record<ItemRarity, string> = { common: "ОБЫЧНОЕ", uncommon: "НЕЧАСТОЕ", rare: "РЕДКОЕ", legendary: "ЛЕГЕНДАРНОЕ" };
export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = { weapon: "ОРУЖИЕ", armor: "БРОНЯ", artifact: "АРТЕФАКТ", consumable: "РАСХОДНИК", mutant_part: "БИОМАТЕРИАЛ" };
