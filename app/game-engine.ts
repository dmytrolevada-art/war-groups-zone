import {
  EXTRA_SECTOR_NODES,
  SECTOR_MAPS,
  findSectorPoint,
  getSectorForNode,
  getSectorRoute,
  getTacticalLayout,
} from "./sector-map-registry";
import {
  STARTING_EQUIPMENT,
  ZONE_ITEMS,
  getLocationContent,
  type ContentInventory,
  type ZoneItemId,
} from "./zone-content";

export type FactionId =
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

export type PlayableFactionId = Exclude<FactionId, "mutants">;
export type CampaignMode = "faction" | "squad";
export type Relation = "war" | "truce" | "alliance" | "neutral";
export type SquadStatus = "idle" | "moving" | "capturing" | "combat" | "dead";
export type NodeType = "base" | "outpost" | "camp" | "anomaly" | "shelter";
export type Formation = "mixed" | "assault" | "sniper" | "heavy";
export type LineOfSight = "clear" | "partial" | "blocked";
export type UnitKind = "combat" | "caravan" | "mutant";
export type MissionType = "player" | "hold" | "defend" | "expand" | "raid" | "patrol" | "trade" | "artifacts" | "hunt" | "roam" | "seek_shelter";
export type MutantType = "dogs" | "flesh" | "boar" | "pseudodog" | "snork" | "bloodsucker" | "poltergeist" | "burer" | "controller" | "chimera" | "pseudogiant";
export type DirectiveType = "manual" | "defense" | "expansion" | "raid" | "artifacts" | "recovery";
export type TrophyKind = "weapons" | "armor" | "supplies";
export type ContractType = "capture" | "artifacts" | "eliminate" | "defend" | "escort" | "parley" | "specimen" | "salvage";
export type ContractStatus = "offered" | "active" | "completed" | "failed";
export type HireRank = "Новички" | "Ветераны" | "Мастера";
export type FactionCondition = "active" | "remnant" | "destroyed";
export type DiplomacyAction = "gift" | "truce" | "alliance" | "war" | "support" | "trade_pact" | "non_aggression";
export type DiplomaticOfferType = "truce" | "alliance" | "tribute" | "territory" | "trade_pact" | "non_aggression";
export type DiplomaticOfferStatus = "pending" | "accepted" | "rejected" | "expired";
export type SquadMarkerShape = "circle" | "diamond" | "hexagon" | "square";
export type SquadQuality = "raw" | "regular" | "veteran" | "elite";
export type FighterRole = "riflemen" | "assault" | "snipers" | "heavy" | "medics";
export type CommanderDisposition = "honorable" | "pragmatic" | "cautious" | "ambitious" | "greedy" | "fanatic";
export type CommanderBackground = "founder" | "veteran" | "survivor" | "defector" | "enforcer" | "scout";
export type FieldDealType = "local_truce" | "passage" | "supplies" | "intelligence" | "bribe";
export type FieldDealStatus = "active" | "honored" | "broken" | "expired";
export type OperationType = "defense" | "raid" | "expansion" | "artifacts" | "recovery";
export type OperationStatus = "planned" | "active" | "succeeded" | "failed";
export type WorldEventType = "stash_signal" | "distress_call" | "anomaly_surge" | "mutant_migration" | "psi_storm" | "faction_skirmish";
export type WorldEventStatus = "active" | "resolved" | "failed";
export type OperativeTrait = "calm" | "aggressive" | "coward" | "greedy" | "paranoid";
export type OperativeSpecialization = "leader" | "scout" | "assault" | "medic" | "marksman";
export type OperativeOrder = "idle" | "move" | "cover" | "search" | "scout" | "artifact" | "rest" | "hold" | "follow";
export type OperativeCondition = "healthy" | "wounded" | "critical" | "dead" | "left";
export type RecruitTier = "rookie" | "regular" | "veteran" | "ace";
export type LocationApproach = "travel" | "peaceful" | "request_access" | "attack" | "ambush" | "occupy";
export type SquadInteractionAction = "approach" | "talk" | "request_passage" | "attack" | "ambush";
export type SquadConversationTopic = "identity" | "news" | "danger" | "route" | "work" | "faction" | "recruitment";
export type ContractNegotiationChoice = "accept" | "haggle" | "decline";
export type DeceptionStage = "luring" | "ready" | "ambush" | "completed" | "failed";

export interface FactionCulture {
  headquarters: string;
  authority: string;
  hierarchy: [string, string, string, string];
  livelihoods: string[];
  recruitment: string;
  refuses: string;
  conduct: string;
  contactBias: number;
  betrayalBias: number;
  bribeBias: number;
  joinTrust: number;
  joinReputation: number;
  joinContracts: number;
  openRecruitment: boolean;
}

export interface FactionRecruitmentAssessment {
  allowed: boolean;
  permanentlyClosed: boolean;
  trust: number;
  trustRequired: number;
  reputation: number;
  reputationRequired: number;
  completedContracts: number;
  contractsRequired: number;
  reason: string;
}

export interface DeceptionPlot {
  targetSquadId: string;
  targetFaction: PlayableFactionId;
  targetCommanderName: string;
  destinationNodeId: string;
  stage: DeceptionStage;
  startedAt: number;
  commanderKilled: boolean;
  lootRecorded: boolean;
}

export interface KnownSquadIntel {
  squadId: string;
  nodeId: string;
  faction: FactionId;
  name: string;
  fighters: number;
  seenAt: number;
  source: "visual" | "conversation" | "pda";
}

export interface SquadIntelReport {
  id: string;
  kind: "news" | "danger" | "route" | "job";
  title: string;
  text: string;
  nodeId: string | null;
  sourceSquadId: string | null;
  createdAt: number;
  expiresAt: number;
  reliability: number;
}

export interface SquadConversation {
  id: string;
  targetSquadId: string;
  topic: SquadConversationTopic | "trade" | "contract";
  minute: number;
  speaker: string;
  text: string;
  tone: "neutral" | "friendly" | "cold" | "danger";
}

export interface SquadKnowledge {
  visitedSectorIds: string[];
  knownNodeIds: string[];
  knownSquads: Record<string, KnownSquadIntel>;
  reports: SquadIntelReport[];
  conversations: SquadConversation[];
}

export interface SquadOperative {
  id: string;
  squadId: string;
  name: string;
  callsign: string;
  trait: OperativeTrait;
  specialization: OperativeSpecialization;
  health: number;
  maxHealth: number;
  morale: number;
  trust: number;
  experience: number;
  loyalty: number;
  condition: OperativeCondition;
  localX: number;
  localY: number;
  destinationX: number | null;
  destinationY: number | null;
  order: OperativeOrder;
  orderTarget: string | null;
  actionUntil: number | null;
  weaponId: ZoneItemId;
  armorId: ZoneItemId;
}

export interface RecruitCandidate {
  tier: RecruitTier;
  title: string;
  callsign: string;
  trait: OperativeTrait;
  specialization: OperativeSpecialization;
  cost: number;
  health: number;
  morale: number;
  experience: number;
  weaponId: ZoneItemId;
  armorId: ZoneItemId;
}

export const OPERATIVE_TRAIT_LABELS: Record<OperativeTrait, string> = {
  calm: "спокойный",
  aggressive: "агрессор",
  coward: "трус",
  greedy: "жадный",
  paranoid: "параноик",
};

export const OPERATIVE_SPECIALIZATION_LABELS: Record<OperativeSpecialization, string> = {
  leader: "командир",
  scout: "разведчик",
  assault: "штурмовик",
  medic: "медик",
  marksman: "стрелок",
};

export const OPERATIVE_ORDER_LABELS: Record<OperativeOrder, string> = {
  idle: "ожидает",
  move: "движется",
  cover: "занимает укрытие",
  search: "обыскивает",
  scout: "разведывает местность",
  artifact: "ищет артефакт",
  rest: "отдыхает",
  hold: "держит позицию",
  follow: "следует за командиром",
};

export interface SquadArchetype {
  id: string;
  name: string;
  description: string;
  formation: Formation;
  fighters: number;
  strength: number;
  attack: number;
  ammo: number;
  medkits: number;
  grenades: number;
  weaponTier: number;
  armorTier: number;
}

export interface FactionProfile {
  doctrine: string;
  summary: string;
  effects: [string, string, string];
  directives: DirectiveType[];
  recruitment: HireRank[];
  strategy: {
    defenseSensitivity: number;
    raidFocus: "bases" | "income" | "caravans";
    expansionFocus: "anomalies" | "neutral" | "income";
    forceLimit: number;
    allySupport: boolean;
  };
  economy: {
    income: number;
    upkeep: number;
    hire: number;
    artifactYield: number;
    artifactValue: number;
    caravan: number;
    loot: number;
    contracts: number;
    allianceTrade: number;
  };
  combat: {
    attack: number;
    damageTaken: number;
    accuracy: number;
    speed: number;
    capture: number;
    suppressionTaken: number;
    emissionDamage: number;
    controlledCover: number;
  };
  roster: Record<HireRank, SquadArchetype>;
}

export interface FactionDefinition {
  id: FactionId;
  name: string;
  short: string;
  color: string;
  softColor: string;
  trait: string;
}

export interface ZoneNode {
  id: string;
  name: string;
  x: number;
  y: number;
  type: NodeType;
  owner: FactionId | null;
  baseFor?: PlayableFactionId;
  income: number;
  links: string[];
  mapLevel?: "global" | "sector";
  sectorId?: string;
  globalAnchorId?: string;
  localLinks?: string[];
  capture: number;
  captureFaction: FactionId | null;
  security: number;
  capturedAt: number | null;
}

export interface Squad {
  id: string;
  name: string;
  faction: FactionId;
  rank: "Новички" | "Опытные" | "Ветераны" | "Мастера" | "Стая";
  nodeId: string;
  previousNodeId: string | null;
  destinationId: string | null;
  status: SquadStatus;
  travel: number;
  strength: number;
  maxStrength: number;
  fighters: number;
  maxFighters: number;
  morale: number;
  attack: number;
  ammo: number;
  maxAmmo: number;
  medkits: number;
  grenades: number;
  cover: number;
  xp: number;
  formation: Formation;
  weaponTier: number;
  armorTier: number;
  homeGarrison: boolean;
  tacticalX: number;
  tacticalY: number;
  stamina: number;
  maxStamina: number;
  suppression: number;
  magazine: number;
  magazineSize: number;
  unitKind: UnitKind;
  mission: MissionType;
  missionTargetId: string | null;
  missionPath: string[];
  missionIssuedAt: number;
  cargo: number;
  mutantType: MutantType | null;
  archetypeId: string | null;
  commander: SquadCommander | null;
  weaponId: ZoneItemId | null;
  armorId: ZoneItemId | null;
  artifactIds: ZoneItemId[];
  approachMode?: LocationApproach | null;
}

export interface WorldEvent {
  id: string;
  type: WorldEventType;
  status: WorldEventStatus;
  nodeId: string;
  faction: FactionId | null;
  targetSquadId: string | null;
  startedAt: number;
  expiresAt: number;
  resolvedAt: number | null;
  severity: 1 | 2 | 3;
  title: string;
  description: string;
}

export interface SquadCommander {
  id: string;
  name: string;
  callsign: string;
  disposition: CommanderDisposition;
  background: CommanderBackground;
  previousFaction: PlayableFactionId | null;
  experience: number;
  leadership: number;
  negotiation: number;
  loyalty: number;
  autonomy: number;
  honor: number;
  ambition: number;
  deals: number;
  betrayals: number;
}

export interface SquadDiplomacyMemory {
  trust: number;
  respect: number;
  grievance: number;
  encounters: number;
  deals: number;
  betrayals: number;
  lastContactAt: number;
  nextContactAt: number;
}

export interface FieldDeal {
  id: string;
  type: FieldDealType;
  status: FieldDealStatus;
  leftSquadId: string;
  rightSquadId: string;
  nodeId: string;
  startedAt: number;
  expiresAt: number;
  value: number;
  betrayalRisk: number;
  betrayalChecked: boolean;
  initiatorSquadId: string;
}

export interface StrategicOperation {
  id: string;
  type: OperationType;
  status: OperationStatus;
  issuerFaction: PlayableFactionId;
  targetFaction: FactionId | null;
  targetNodeId: string | null;
  assignedSquadIds: string[];
  cause: string;
  startedAt: number;
  expiresAt: number;
  resolvedAt: number | null;
}

export interface CombatProfile {
  role: string;
  distance: number;
  effectiveRange: number;
  lineOfSight: LineOfSight;
  obstacle: string | null;
  hitChance: number;
  cover: number;
  rangeFactor: number;
}

export interface FactionDirective {
  type: DirectiveType;
  targetNodeId: string | null;
  issuedAt: number;
  reason: string;
}

export interface FactionMemory {
  trust: number;
  fear: number;
  grievance: number;
  playerKills: number;
  territoriesLost: number;
  aidReceived: number;
  lastIncidentAt: number;
  nextNegotiationAt: number;
}

export interface BilateralDiplomacy {
  trust: number;
  tension: number;
  cooperation: number;
  incidents: number;
  jointBattles: number;
  tradesCompleted: number;
  tradeVolume: number;
  tradePact: boolean;
  defensePact: boolean;
  nonAggressionUntil: number | null;
  lastChangedAt: number;
  nextReviewAt: number;
}

export interface SquadMarkerIntel {
  shape: SquadMarkerShape;
  quality: SquadQuality;
  sizeLabel: string;
  qualityLabel: string;
  chevrons: number;
}

export interface SquadIntel {
  marker: SquadMarkerIntel;
  composition: Record<FighterRole, number>;
  training: number;
  morale: number;
  combatPower: number;
  casualtyCount: number;
  skills: {
    firepower: number;
    discipline: number;
    mobility: number;
    survival: number;
  };
}

export interface FactionSurvival {
  condition: FactionCondition;
  baseLostAt: number | null;
  destroyedAt: number | null;
}

export type MobilizationLevel = "peace" | "limited" | "full" | "emergency";

export interface FactionStrategicState {
  manpower: number;
  supply: number;
  warWeariness: number;
  casualties: number;
  territoriesCaptured: number;
  territoriesLost: number;
  insolvencyCycles: number;
  lastCaptureAt: number | null;
}

export interface FactionBalanceSummary {
  faction: PlayableFactionId;
  mobilization: MobilizationLevel;
  armyLimit: number;
  combatSquads: number;
  manpower: number;
  manpowerCap: number;
  supply: number;
  warWeariness: number;
  controlledNodes: number;
  averageSecurity: number;
  administrativeCapacity: number;
  overextension: number;
  reserveTarget: number;
  activeWars: number;
  readiness: number;
}

export interface DiplomaticOffer {
  id: string;
  faction: PlayableFactionId;
  type: DiplomaticOfferType;
  status: DiplomaticOfferStatus;
  cost: number;
  demandedNodeId: string | null;
  issuedAt: number;
  expiresAt: number;
}

export interface DiplomacyTerms {
  relation: Relation;
  acceptance: number;
  truceCost: number;
  allianceCost: number;
  giftCost: number;
  supportCost: number;
  tradePactCost: number;
  nonAggressionCost: number;
  canTruce: boolean;
  canAlliance: boolean;
  canRequestSupport: boolean;
  canTradePact: boolean;
  canNonAggression: boolean;
  cooldown: number;
  reason: string;
}

export interface ALifeStats {
  directivesIssued: number;
  raidsStarted: number;
  patrolsStarted: number;
  caravansDispatched: number;
  tradesCompleted: number;
  mutantAttacks: number;
  mutantSpawns: number;
  shelterOrders: number;
  emissionsSurvived: number;
  fieldNegotiations: number;
  fieldDeals: number;
  defections: number;
  betrayals: number;
  worldEvents: number;
  eventsResolved: number;
  specimensRecovered: number;
}

export interface LogEntry {
  id: string;
  minute: number;
  tone: "system" | "danger" | "success" | "info";
  text: string;
}

export interface ResearchState {
  weapons: number;
  armor: number;
  logistics: number;
  medicine: number;
  recon: number;
  trade: number;
}

export interface TrophyInventory {
  weapons: number;
  armor: number;
  supplies: number;
}

export interface Contract {
  id: string;
  type: ContractType;
  status: ContractStatus;
  title: string;
  description: string;
  targetNodeId: string | null;
  targetFaction: FactionId | null;
  goal: number;
  progress: number;
  reward: number;
  expiresAt: number;
  acceptedAt: number | null;
  issuerFaction: PlayableFactionId;
  targetSquadId: string | null;
  sourceOperationId: string | null;
  risk: "low" | "medium" | "high";
  reputationReward: number;
  lastProgressAt: number;
  rewardItemId: ZoneItemId | null;
  requiredItemId: ZoneItemId | null;
  giverSquadId: string | null;
  briefedAt: number | null;
  negotiationClosed: boolean;
  declinedAt: number | null;
}

export interface GameState {
  version: 1;
  playerFaction: PlayableFactionId;
  campaignMode: CampaignMode;
  squadAllegiance: PlayableFactionId | null;
  playerSquadId: string | null;
  simMinute: number;
  speed: 0 | 1 | 4 | 12;
  rubles: number;
  artifacts: number;
  trophies: TrophyInventory;
  stash: ContentInventory;
  discoveredItems: ZoneItemId[];
  contracts: Contract[];
  contractSequence: number;
  nextContractRefreshAt: number;
  operations: StrategicOperation[];
  operationSequence: number;
  nextOperationAt: number;
  nodes: ZoneNode[];
  squads: Squad[];
  operatives: SquadOperative[];
  squadDiplomacy: Record<string, SquadDiplomacyMemory>;
  squadKnowledge: SquadKnowledge;
  deceptionPlot: DeceptionPlot | null;
  fieldDeals: FieldDeal[];
  fieldEventSequence: number;
  nextSquadDiplomacyAt: number;
  factionFunds: Record<FactionId, number>;
  relations: Record<string, Relation>;
  factionDiplomacy: Record<string, BilateralDiplomacy>;
  reputation: number;
  diplomacyMemory: Record<PlayableFactionId, FactionMemory>;
  factionSurvival: Record<PlayableFactionId, FactionSurvival>;
  factionStrategy: Record<PlayableFactionId, FactionStrategicState>;
  diplomaticOffers: DiplomaticOffer[];
  diplomaticOfferSequence: number;
  nextDiplomacyAt: number;
  nextFactionDiplomacyAt: number;
  research: ResearchState;
  selectedSquadId: string | null;
  selectedNodeId: string;
  tacticalNodeId: string | null;
  tacticalTargetId: string | null;
  nextIncomeAt: number;
  nextAiAt: number;
  nextDirectiveAt: number;
  nextCaravanAt: number;
  nextMutantSpawnAt: number;
  worldEvents: WorldEvent[];
  worldEventSequence: number;
  nextWorldEventAt: number;
  nextEmissionAt: number;
  emissionWarned: boolean;
  directives: Record<PlayableFactionId, FactionDirective>;
  alifeStats: ALifeStats;
  rngSeed: number;
  log: LogEntry[];
  victory: boolean;
  defeat: boolean;
}

export const FACTIONS: Record<FactionId, FactionDefinition> = {
  stalkers: {
    id: "stalkers",
    name: "Одиночки",
    short: "ОД",
    color: "#d8bb4d",
    softColor: "rgba(216,187,77,.22)",
    trait: "Дешёвый найм и добыча артефактов",
  },
  duty: {
    id: "duty",
    name: "Долг",
    short: "ДЛ",
    color: "#dc3f42",
    softColor: "rgba(220,63,66,.24)",
    trait: "Тяжёлая броня и оборона баз",
  },
  freedom: {
    id: "freedom",
    name: "Свобода",
    short: "СВ",
    color: "#59b65f",
    softColor: "rgba(89,182,95,.22)",
    trait: "Скорость и дальний бой",
  },
  bandits: {
    id: "bandits",
    name: "Бандиты",
    short: "БН",
    color: "#a46c3c",
    softColor: "rgba(164,108,60,.24)",
    trait: "Трофеи и дешёвые отряды",
  },
  military: {
    id: "military",
    name: "Военные",
    short: "ВС",
    color: "#4f75a9",
    softColor: "rgba(79,117,169,.24)",
    trait: "Сильные ветераны и огневая мощь",
  },
  monolith: {
    id: "monolith",
    name: "Монолит",
    short: "МН",
    color: "#e4e7e2",
    softColor: "rgba(228,231,226,.22)",
    trait: "Фанатики, воюющие со всеми",
  },
  mercenaries: {
    id: "mercenaries",
    name: "Наёмники",
    short: "НМ",
    color: "#4da9c0",
    softColor: "rgba(77,169,192,.24)",
    trait: "Дорогие профессионалы",
  },
  ecologists: {
    id: "ecologists",
    name: "Экологи",
    short: "ЭК",
    color: "#e6a44b",
    softColor: "rgba(230,164,75,.24)",
    trait: "Повышенный доход с аномалий",
  },
  clear_sky: {
    id: "clear_sky",
    name: "Чистое небо",
    short: "ЧН",
    color: "#65aeb3",
    softColor: "rgba(101,174,179,.24)",
    trait: "Разведка и быстрый захват",
  },
  renegades: {
    id: "renegades",
    name: "Ренегаты",
    short: "РН",
    color: "#76533f",
    softColor: "rgba(118,83,63,.25)",
    trait: "Засады и внезапные рейды",
  },
  mutants: {
    id: "mutants",
    name: "Мутанты",
    short: "МТ",
    color: "#b95178",
    softColor: "rgba(185,81,120,.25)",
    trait: "Неуправляемые стаи",
  },
};

// Canonical goals and bases come from the original trilogy. Rank names are a
// gameplay hierarchy used by this simulation where the games leave the exact
// internal ladder unnamed.
export const FACTION_CULTURES: Record<PlayableFactionId, FactionCulture> = {
  stalkers: {
    headquarters: "Деревня новичков на Кордоне; крупные стоянки возникают вокруг торговцев и безопасных костров",
    authority: "Нет единого штаба: опытный проводник или уважаемый командир ведёт только тех, кто ему доверяет",
    hierarchy: ["Новичок", "Опытный", "Ветеран", "Мастер"],
    livelihoods: ["артефакты", "проводничество", "охота на мутантов", "разовые заказы"],
    recruitment: "Принимают знакомых и полезных людей без присяги; репутация важнее формы",
    refuses: "Явных убийц своих, должников и тех, кто систематически бросает напарников",
    conduct: "Небольшие автономные группы избегают бессмысленной войны, помогают своим и быстро меняют маршрут ради хабара",
    contactBias: 8, betrayalBias: 0, bribeBias: 0, joinTrust: 14, joinReputation: 0, joinContracts: 0, openRecruitment: true,
  },
  duty: {
    headquarters: "Укреплённый Росток/Бар; в текущей кампании штаб перенесён на Цементный завод",
    authority: "Военизированное единоначалие, строгий кодекс и обязательное исполнение приказов",
    hierarchy: ["Рядовой", "Сержант", "Капитан", "Генерал"],
    livelihoods: ["охрана рубежей", "истребление мутантов", "военные операции", "передача артефактов учёным"],
    recruitment: "Берут дисциплинированных бойцов после проверенных боевых заданий",
    refuses: "Мародёров, торговцев опасными секретами Зоны и людей с тяжёлыми предательствами",
    conduct: "Укрепляют коридоры, чистят логова, защищают населённые точки и жёстко отвечают на потерю базы",
    contactBias: 1, betrayalBias: -18, bribeBias: -20, joinTrust: 34, joinReputation: 18, joinContracts: 2, openRecruitment: true,
  },
  freedom: {
    headquarters: "Армейские склады; в текущей кампании — Росток",
    authority: "Децентрализованная структура: лидер задаёт курс, полевые командиры сохраняют широкую самостоятельность",
    hierarchy: ["Доброволец", "Боец", "Командир группы", "Комендант"],
    livelihoods: ["открытые маршруты", "артефакты", "контрабанда знаний", "рейды против закрывающих проход сил"],
    recruitment: "Берут самостоятельных сталкеров, готовых защищать свободный доступ к Зоне",
    refuses: "Военных карателей, убеждённых сторонников уничтожения Зоны и доносчиков",
    conduct: "Предпочитают манёвр, дальний огонь, разведку и союз с одиночками вместо тяжёлой оккупации",
    contactBias: 10, betrayalBias: -5, bribeBias: -2, joinTrust: 24, joinReputation: 8, joinContracts: 1, openRecruitment: true,
  },
  bandits: {
    headquarters: "Депо на Свалке и склады Тёмной долины; власть раздроблена между бандами",
    authority: "Авторитет держится на прибыли, страхе и личной силе; мелкие паханы могут воевать друг с другом",
    hierarchy: ["Шестёрка", "Бригадир", "Авторитет", "Пахан"],
    livelihoods: ["грабёж", "рэкет", "контрабанда", "торговля оружием", "перепродажа артефактов"],
    recruitment: "Берут полезных уголовников, налётчиков и чужаков, доказавших прибыльность или жестокость",
    refuses: "Бедных моралистов, стукачей и тех, кто не способен принести банде деньги",
    conduct: "Избегают честного фронта, давят слабых, режут караваны и легко нарушают сделку при выгодном раскладе",
    contactBias: -7, betrayalBias: 22, bribeBias: 24, joinTrust: 26, joinReputation: -8, joinContracts: 1, openRecruitment: true,
  },
  military: {
    headquarters: "Периметр, блокпост Кордона и военный комплекс Агропрома",
    authority: "Штатная армейская вертикаль и приказ сверху; полевые сделки допустимы только как коррупция или спецоперация",
    hierarchy: ["Рядовой", "Сержант", "Капитан", "Генерал"],
    livelihoods: ["охрана периметра", "зачистки", "изъятие артефактов", "спецоперации и разведка"],
    recruitment: "Случайных сталкеров не вербуют: только военнослужащие, контрактники и проверенные военные сталкеры",
    refuses: "Незаконных проникших, бандитов, известных контрабандистов и дезертиров",
    conduct: "Держат блокпосты, перекрывают маршруты, патрулируют и применяют превосходящую огневую силу",
    contactBias: -12, betrayalBias: -16, bribeBias: 6, joinTrust: 80, joinReputation: 70, joinContracts: 4, openRecruitment: false,
  },
  monolith: {
    headquarters: "Радар, Припять и ЧАЭС",
    authority: "Культовая военная сеть с безусловным подчинением воле Монолита",
    hierarchy: ["Послушник", "Фанатик", "Наставник", "Хранитель"],
    livelihoods: ["охрана центра", "удержание пси-рубежей", "захват оружия и боеприпасов у вторженцев"],
    recruitment: "Добровольного набора нет: ряды пополняются обращёнными и психически подчинёнными сталкерами",
    refuses: "Переговоров с чужаками не ведут",
    conduct: "Стреляют по посторонним, не отступают из-за денег и защищают северные рубежи до уничтожения",
    contactBias: -100, betrayalBias: -40, bribeBias: -100, joinTrust: 100, joinReputation: 100, joinContracts: 99, openRecruitment: false,
  },
  mercenaries: {
    headquarters: "Точное расположение засекречено; в текущей кампании сеть координируется из Мёртвого города",
    authority: "Контрактные ячейки под командирами; заказчик и координаторы известны только необходимому кругу",
    hierarchy: ["Контрактник", "Оператор", "Командир группы", "Координатор"],
    livelihoods: ["заказные убийства", "кража данных", "охрана", "диверсии", "дорогие боевые контракты"],
    recruitment: "Берут подготовленных и надёжных специалистов с хорошим снаряжением и выполненными контрактами",
    refuses: "Болтунов, дешёвых новичков, людей с сорванными заказами и неконтролируемых фанатиков",
    conduct: "Не держат лишнюю территорию, действуют малыми профессиональными группами и уходят после выполнения заказа",
    contactBias: -2, betrayalBias: 5, bribeBias: 15, joinTrust: 38, joinReputation: 20, joinContracts: 3, openRecruitment: true,
  },
  ecologists: {
    headquarters: "Мобильные научные лаборатории Янтаря и охраняемые исследовательские бункеры",
    authority: "Научный руководитель определяет задачи; вооружённый эскорт отвечает только за безопасность экспедиции",
    hierarchy: ["Лаборант", "Полевой сотрудник", "Старший исследователь", "Профессор"],
    livelihoods: ["исследования", "полевые замеры", "покупка артефактов", "научные контракты"],
    recruitment: "Нужны учёные, проводники и надёжная охрана; ценятся образцы и безопасно проведённые экспедиции",
    refuses: "Мародёров лабораторий, бессмысленных убийц и людей, срывающих исследования",
    conduct: "Избегают захватнических войн, нанимают защиту, идут к аномалиям и платят за данные и образцы",
    contactBias: 14, betrayalBias: -22, bribeBias: -10, joinTrust: 28, joinReputation: 12, joinContracts: 2, openRecruitment: true,
  },
  clear_sky: {
    headquarters: "Скрытая база в глубине Болот",
    authority: "Закрытый исследовательский штаб и мобильные полевые группы",
    hierarchy: ["Дозорный", "Проводник", "Командир отряда", "Руководитель экспедиции"],
    livelihoods: ["разведка", "изучение Выбросов", "контроль болотных маршрутов", "поиск артефактов"],
    recruitment: "Берут проверенных проводников и бойцов, способных хранить тайну и работать у аномалий",
    refuses: "Шпионов, болтунов, мародёров исследовательских объектов и людей Монолита",
    conduct: "Сначала разведывают, затем быстро закрепляют безопасные пути; не раскрывают штаб случайным встречным",
    contactBias: 6, betrayalBias: -12, bribeBias: -5, joinTrust: 35, joinReputation: 14, joinContracts: 2, openRecruitment: true,
  },
  renegades: {
    headquarters: "Разрозненные лагеря в Болотах; в текущей кампании главный притон закрепился в Лиманске",
    authority: "Временные шайки вокруг самого опасного вожака, без устойчивого закона и общей идеологии",
    hierarchy: ["Падальщик", "Головорез", "Вожак", "Смотрящий"],
    livelihoods: ["засады", "грабёж", "похищения", "снятие хабара с убитых"],
    recruitment: "Принимают беглых, изгнанников и людей, которым больше некуда идти",
    refuses: "Почти никого, если человек вооружён и признаёт силу вожака",
    conduct: "Бьют из грязи, бросают слабые точки, предают при первом серьёзном кризисе и живут сегодняшней добычей",
    contactBias: -16, betrayalBias: 32, bribeBias: 18, joinTrust: 12, joinReputation: -20, joinContracts: 0, openRecruitment: true,
  },
};

export const PLAYABLE_FACTIONS = (Object.keys(FACTIONS) as FactionId[]).filter(
  (id): id is PlayableFactionId => id !== "mutants",
);

export const DIRECTIVE_LABELS: Record<DirectiveType, string> = {
  manual: "РУЧНОЕ КОМАНДОВАНИЕ",
  defense: "ОБОРОНА",
  expansion: "ЭКСПАНСИЯ",
  raid: "РЕЙД",
  artifacts: "ПОИСК АРТЕФАКТОВ",
  recovery: "ВОССТАНОВЛЕНИЕ",
};

export const MISSION_LABELS: Record<MissionType, string> = {
  player: "приказ игрока",
  hold: "удерживает позицию",
  defend: "идёт на усиление",
  expand: "захватывает территорию",
  raid: "проводит рейд",
  patrol: "патрулирует маршрут",
  trade: "ведёт караван",
  artifacts: "ищет артефакты",
  hunt: "охотится",
  roam: "бродит по Зоне",
  seek_shelter: "ищет укрытие",
};

export const MUTANT_LABELS: Record<MutantType, string> = {
  dogs: "Стая слепых псов",
  flesh: "Стадо плотей",
  boar: "Стадо кабанов",
  pseudodog: "Стая псевдособак",
  snork: "Группа снорков",
  bloodsucker: "Кровосос",
  poltergeist: "Полтергейст",
  burer: "Бюрер",
  controller: "Контролёр",
  chimera: "Химера",
  pseudogiant: "Псевдогигант",
};

export const WORLD_EVENT_LABELS: Record<WorldEventType, string> = {
  stash_signal: "СИГНАЛ ТАЙНИКА",
  distress_call: "СИГНАЛ БЕДСТВИЯ",
  anomaly_surge: "ВСПЛЕСК АНОМАЛИИ",
  mutant_migration: "МИГРАЦИЯ МУТАНТОВ",
  psi_storm: "ПСИ-ШТОРМ",
  faction_skirmish: "ПОГРАНИЧНАЯ СТЫЧКА",
};

const MUTANT_PARTS: Partial<Record<MutantType, ZoneItemId>> = {
  dogs: "dog_tail", boar: "boar_hoof", snork: "snork_foot", bloodsucker: "bloodsucker_tentacles", controller: "controller_brain",
  burer: "burer_hand", chimera: "chimera_claw", pseudogiant: "giant_eye",
};

export function getSquadEquipmentEffects(squad: Squad) {
  const ids = [squad.weaponId, squad.armorId, ...(squad.artifactIds ?? [])].filter((id): id is ZoneItemId => Boolean(id));
  const effects = { damage: 1, accuracy: 0, range: 0, protection: 0, mobility: 0, radiation: 0, psi: 0, recovery: 0, artifactYield: 0, carry: 0 };
  for (const id of ids) {
    const item = ZONE_ITEMS[id];
    if (!item) continue;
    if (item.effects.damage) effects.damage *= item.effects.damage;
    effects.accuracy += item.effects.accuracy ?? 0;
    effects.range += item.effects.range ?? 0;
    effects.protection += item.effects.protection ?? 0;
    effects.mobility += item.effects.mobility ?? 0;
    effects.radiation += item.effects.radiation ?? 0;
    effects.psi += item.effects.psi ?? 0;
    effects.recovery += item.effects.recovery ?? 0;
    effects.artifactYield += item.effects.artifactYield ?? 0;
    effects.carry += item.effects.carry ?? 0;
  }
  effects.protection = clamp(effects.protection, 0, .62);
  effects.radiation = clamp(effects.radiation, -.3, .78);
  effects.psi = clamp(effects.psi, 0, .72);
  return effects;
}

function addStashItem(state: GameState, itemId: ZoneItemId, amount = 1) {
  state.stash[itemId] = (state.stash[itemId] ?? 0) + amount;
  if (!state.discoveredItems.includes(itemId)) state.discoveredItems.push(itemId);
}

export const HIRE_RANKS: HireRank[] = ["Новички", "Ветераны", "Мастера"];

export const FACTION_PROFILES: Record<PlayableFactionId, FactionProfile> = {
  stalkers: {
    doctrine: "Вольные маршруты",
    summary: "Небольшие самостоятельные группы живут с находок, быстро меняют направление и дешевле пополняют потери.",
    effects: ["найм и содержание дешевле", "артефакты и трофеи ценнее", "небольшой бонус к скорости"],
    directives: ["expansion", "artifacts", "recovery", "artifacts", "raid"],
    recruitment: ["Новички", "Ветераны", "Новички", "Мастера"],
    strategy: { defenseSensitivity: 1, raidFocus: "income", expansionFocus: "anomalies", forceLimit: 4, allySupport: true },
    economy: { income: 1, upkeep: 0.86, hire: 0.86, artifactYield: 1.25, artifactValue: 1.12, caravan: 1, loot: 1.15, contracts: 1, allianceTrade: 1 },
    combat: { attack: 1, damageTaken: 1, accuracy: 1, speed: 1.06, capture: 1.05, suppressionTaken: 1, emissionDamage: 0.94, controlledCover: 0.02 },
    roster: {
      Новички: { id: "stalkers-scavengers", name: "Сборщики", description: "4 бойца · дешёвое смешанное вооружение · увеличенный груз", formation: "mixed", fighters: 4, strength: 78, attack: 6, ammo: 100, medkits: 2, grenades: 1, weaponTier: 0, armorTier: 0 },
      Ветераны: { id: "stalkers-seekers", name: "Искатели", description: "5 бойцов · разведка аномалий · дальний огонь", formation: "sniper", fighters: 5, strength: 104, attack: 10, ammo: 125, medkits: 3, grenades: 2, weaponTier: 1, armorTier: 1 },
      Мастера: { id: "stalkers-free-masters", name: "Вольные мастера", description: "5 бойцов · универсальное снаряжение · высокая автономность", formation: "mixed", fighters: 5, strength: 120, attack: 14, ammo: 150, medkits: 4, grenades: 2, weaponTier: 2, armorTier: 2 },
    },
  },
  duty: {
    doctrine: "Железный периметр",
    summary: "Тяжёлая пехота закрепляется на удерживаемых рубежах, медленнее наступает и значительно труднее подавляется.",
    effects: ["усиленная броня и подавление", "дополнительное укрытие на своих точках", "медленнее и дороже остальных"],
    directives: ["defense", "expansion", "defense", "raid", "defense"],
    recruitment: ["Новички", "Ветераны", "Ветераны", "Мастера"],
    strategy: { defenseSensitivity: 0.72, raidFocus: "bases", expansionFocus: "income", forceLimit: 4, allySupport: true },
    economy: { income: 1.04, upkeep: 1.08, hire: 1.06, artifactYield: 0.85, artifactValue: 0.92, caravan: 1, loot: 0.95, contracts: 1, allianceTrade: 1 },
    combat: { attack: 1.05, damageTaken: 0.86, accuracy: 1, speed: 0.9, capture: 0.94, suppressionTaken: 0.7, emissionDamage: 0.92, controlledCover: 0.12 },
    roster: {
      Новички: { id: "duty-line", name: "Линейное отделение", description: "4 бойца · бронежилеты · оборона рубежа", formation: "mixed", fighters: 4, strength: 86, attack: 6, ammo: 110, medkits: 2, grenades: 1, weaponTier: 0, armorTier: 1 },
      Ветераны: { id: "duty-assault", name: "Штурмовая группа", description: "5 бойцов · автоматы и гранаты · прорыв укреплений", formation: "assault", fighters: 5, strength: 112, attack: 11, ammo: 135, medkits: 3, grenades: 3, weaponTier: 1, armorTier: 2 },
      Мастера: { id: "duty-armored", name: "Бронегруппа", description: "5 бойцов · экзоскелеты · тяжёлая поддержка", formation: "heavy", fighters: 5, strength: 132, attack: 15, ammo: 180, medkits: 4, grenades: 3, weaponTier: 2, armorTier: 3 },
    },
  },
  freedom: {
    doctrine: "Манёвренная война",
    summary: "Разведчики обходят тяжёлые позиции, быстрее переходят между точками и предпочитают дальний огонь и рейды.",
    effects: ["самое быстрое перемещение", "точный дальний огонь", "чаще рейды, слабее стационарная оборона"],
    directives: ["raid", "expansion", "artifacts", "raid", "expansion"],
    recruitment: ["Новички", "Ветераны", "Ветераны", "Мастера"],
    strategy: { defenseSensitivity: 1.08, raidFocus: "income", expansionFocus: "neutral", forceLimit: 4, allySupport: true },
    economy: { income: 0.98, upkeep: 0.96, hire: 1, artifactYield: 1.08, artifactValue: 1.05, caravan: 1.04, loot: 1, contracts: 1, allianceTrade: 1.08 },
    combat: { attack: 1.03, damageTaken: 1.04, accuracy: 1.1, speed: 1.2, capture: 1.12, suppressionTaken: 0.92, emissionDamage: 0.96, controlledCover: 0 },
    roster: {
      Новички: { id: "freedom-scouts", name: "Разведдозор", description: "3 бойца · лёгкое снаряжение · быстрый переход", formation: "mixed", fighters: 3, strength: 74, attack: 6, ammo: 110, medkits: 2, grenades: 1, weaponTier: 0, armorTier: 0 },
      Ветераны: { id: "freedom-marksmen", name: "Меткие стрелки", description: "4 бойца · винтовки · контроль дальней дистанции", formation: "sniper", fighters: 4, strength: 98, attack: 10, ammo: 135, medkits: 3, grenades: 2, weaponTier: 2, armorTier: 1 },
      Мастера: { id: "freedom-saboteurs", name: "Диверсионная группа", description: "5 бойцов · скрытный штурм · большой запас гранат", formation: "assault", fighters: 5, strength: 116, attack: 14, ammo: 155, medkits: 3, grenades: 4, weaponTier: 3, armorTier: 2 },
    },
  },
  bandits: {
    doctrine: "Чужое станет нашим",
    summary: "Дешёвые банды избегают честной войны, охотятся за караванами и получают больше с разграбленных отрядов.",
    effects: ["самый дешёвый массовый найм", "больше трофеев и захваченного груза", "низкая точность и слабая дисциплина"],
    directives: ["raid", "recovery", "raid", "expansion", "raid"],
    recruitment: ["Новички", "Новички", "Ветераны", "Мастера"],
    strategy: { defenseSensitivity: 1.22, raidFocus: "caravans", expansionFocus: "neutral", forceLimit: 5, allySupport: false },
    economy: { income: 0.9, upkeep: 0.76, hire: 0.74, artifactYield: 0.8, artifactValue: 0.9, caravan: 0.82, loot: 1.5, contracts: 0.95, allianceTrade: 0.82 },
    combat: { attack: 1, damageTaken: 1.08, accuracy: 0.9, speed: 1.08, capture: 1, suppressionTaken: 1.08, emissionDamage: 1.04, controlledCover: 0.02 },
    roster: {
      Новички: { id: "bandits-rabble", name: "Шестёрки", description: "5 бойцов · обрезы и пистолеты · дешёвая численность", formation: "assault", fighters: 5, strength: 70, attack: 5, ammo: 75, medkits: 1, grenades: 1, weaponTier: 0, armorTier: 0 },
      Ветераны: { id: "bandits-raiders", name: "Налётчики", description: "5 бойцов · быстрый штурм · захват трофеев", formation: "assault", fighters: 5, strength: 92, attack: 9, ammo: 100, medkits: 2, grenades: 3, weaponTier: 1, armorTier: 1 },
      Мастера: { id: "bandits-enforcers", name: "Авторитеты", description: "5 бойцов · трофейное оружие · высокая огневая мощь", formation: "mixed", fighters: 5, strength: 108, attack: 13, ammo: 125, medkits: 3, grenades: 3, weaponTier: 2, armorTier: 2 },
    },
  },
  military: {
    doctrine: "Зачистка сектора",
    summary: "Дисциплинированные подразделения опираются на огневое превосходство, патрули и последовательный захват баз.",
    effects: ["высокая точность и урон", "сильные гарнизоны и спецназ", "дорогой найм и содержание"],
    directives: ["defense", "expansion", "raid", "defense", "expansion"],
    recruitment: ["Ветераны", "Новички", "Ветераны", "Мастера"],
    strategy: { defenseSensitivity: 0.82, raidFocus: "bases", expansionFocus: "income", forceLimit: 4, allySupport: true },
    economy: { income: 1.08, upkeep: 1.16, hire: 1.16, artifactYield: 0.7, artifactValue: 0.85, caravan: 1.08, loot: 0.9, contracts: 1.05, allianceTrade: 1.08 },
    combat: { attack: 1.15, damageTaken: 0.9, accuracy: 1.09, speed: 0.96, capture: 1.08, suppressionTaken: 0.78, emissionDamage: 0.9, controlledCover: 0.07 },
    roster: {
      Новички: { id: "military-patrol", name: "Армейский патруль", description: "4 бойца · штатные автоматы · усиленный боезапас", formation: "mixed", fighters: 4, strength: 86, attack: 7, ammo: 125, medkits: 2, grenades: 2, weaponTier: 1, armorTier: 1 },
      Ветераны: { id: "military-spetsnaz", name: "Спецназ", description: "5 бойцов · штурмовая подготовка · точный огонь", formation: "assault", fighters: 5, strength: 112, attack: 12, ammo: 155, medkits: 3, grenades: 3, weaponTier: 2, armorTier: 2 },
      Мастера: { id: "military-heavy", name: "Тяжёлая группа", description: "5 бойцов · пулемёты и РПГ · бронекомплекты", formation: "heavy", fighters: 5, strength: 130, attack: 17, ammo: 200, medkits: 4, grenades: 4, weaponTier: 3, armorTier: 3 },
    },
  },
  monolith: {
    doctrine: "Неотступная воля",
    summary: "Фанатики воюют со всеми, плохо чувствуют подавление и не прекращают наступление даже после Выброса.",
    effects: ["сильная устойчивость к подавлению", "повышенная стойкость к Выбросу", "постоянная война и дорогие элитные группы"],
    directives: ["expansion", "raid", "defense", "raid", "expansion"],
    recruitment: ["Ветераны", "Новички", "Ветераны", "Мастера"],
    strategy: { defenseSensitivity: 0.9, raidFocus: "bases", expansionFocus: "income", forceLimit: 4, allySupport: false },
    economy: { income: 0.94, upkeep: 0.9, hire: 1.08, artifactYield: 1, artifactValue: 0.8, caravan: 0.7, loot: 0.9, contracts: 0.9, allianceTrade: 0 },
    combat: { attack: 1.11, damageTaken: 0.93, accuracy: 1.03, speed: 1, capture: 1.14, suppressionTaken: 0.55, emissionDamage: 0.62, controlledCover: 0.08 },
    roster: {
      Новички: { id: "monolith-novices", name: "Послушники", description: "4 бойца · фанатичный штурм · слабая экипировка", formation: "assault", fighters: 4, strength: 82, attack: 7, ammo: 115, medkits: 2, grenades: 2, weaponTier: 1, armorTier: 0 },
      Ветераны: { id: "monolith-fanatics", name: "Фанатики", description: "5 бойцов · непрерывное наступление · гранаты", formation: "assault", fighters: 5, strength: 108, attack: 12, ammo: 145, medkits: 2, grenades: 4, weaponTier: 2, armorTier: 2 },
      Мастера: { id: "monolith-praetorians", name: "Преторианцы", description: "5 бойцов · тяжёлые экзоскелеты · огневой вал", formation: "heavy", fighters: 5, strength: 132, attack: 16, ammo: 190, medkits: 3, grenades: 4, weaponTier: 3, armorTier: 3 },
    },
  },
  mercenaries: {
    doctrine: "Контракт превыше всего",
    summary: "Малочисленные профессиональные группы выбирают дорогие цели, лучше выполняют контракты и требуют больших расходов.",
    effects: ["лучшие выплаты за контракты", "элитная точность и урон", "самый дорогой найм и содержание"],
    directives: ["raid", "recovery", "raid", "expansion", "raid"],
    recruitment: ["Ветераны", "Ветераны", "Новички", "Мастера"],
    strategy: { defenseSensitivity: 1.05, raidFocus: "income", expansionFocus: "income", forceLimit: 3, allySupport: true },
    economy: { income: 1, upkeep: 1.24, hire: 1.26, artifactYield: 0.9, artifactValue: 1.08, caravan: 1.22, loot: 1.12, contracts: 1.3, allianceTrade: 1.18 },
    combat: { attack: 1.17, damageTaken: 0.92, accuracy: 1.14, speed: 1.08, capture: 1, suppressionTaken: 0.76, emissionDamage: 0.9, controlledCover: 0.04 },
    roster: {
      Новички: { id: "mercenaries-contractors", name: "Контрактники", description: "3 бойца · профессиональная подготовка · высокая цена", formation: "mixed", fighters: 3, strength: 80, attack: 8, ammo: 115, medkits: 2, grenades: 1, weaponTier: 1, armorTier: 1 },
      Ветераны: { id: "mercenaries-operators", name: "Операторы", description: "4 бойца · точные винтовки · автономная работа", formation: "sniper", fighters: 4, strength: 108, attack: 13, ammo: 145, medkits: 3, grenades: 2, weaponTier: 2, armorTier: 2 },
      Мастера: { id: "mercenaries-black-group", name: "Чёрная группа", description: "5 бойцов · элитное оружие · максимальная точность", formation: "sniper", fighters: 5, strength: 126, attack: 18, ammo: 175, medkits: 4, grenades: 3, weaponTier: 3, armorTier: 3 },
    },
  },
  ecologists: {
    doctrine: "Научная экспедиция",
    summary: "Охраняемые исследовательские группы идут к аномалиям, получают с них максимальную прибыль и лучше переживают Выброс.",
    effects: ["максимальный доход с артефактов", "высокая устойчивость к Выбросу", "слабее в прямом бою и захвате"],
    directives: ["artifacts", "recovery", "defense", "artifacts", "artifacts"],
    recruitment: ["Новички", "Ветераны", "Новички", "Мастера"],
    strategy: { defenseSensitivity: 0.95, raidFocus: "income", expansionFocus: "anomalies", forceLimit: 3, allySupport: true },
    economy: { income: 0.96, upkeep: 1, hire: 1.02, artifactYield: 2.15, artifactValue: 1.34, caravan: 1.14, loot: 0.82, contracts: 1.12, allianceTrade: 1.18 },
    combat: { attack: 0.88, damageTaken: 1.03, accuracy: 1, speed: 0.96, capture: 0.86, suppressionTaken: 1, emissionDamage: 0.48, controlledCover: 0 },
    roster: {
      Новички: { id: "ecologists-field-guard", name: "Полевая охрана", description: "3 бойца · защитные костюмы · много аптечек", formation: "mixed", fighters: 3, strength: 68, attack: 4, ammo: 85, medkits: 3, grenades: 0, weaponTier: 0, armorTier: 1 },
      Ветераны: { id: "ecologists-research-team", name: "Исследовательская группа", description: "4 бойца · поиск артефактов · научное оснащение", formation: "mixed", fighters: 4, strength: 90, attack: 7, ammo: 105, medkits: 4, grenades: 1, weaponTier: 1, armorTier: 2 },
      Мастера: { id: "ecologists-escort", name: "Научный эскорт", description: "5 бойцов · экзоскелеты · защита экспедиции", formation: "heavy", fighters: 5, strength: 114, attack: 11, ammo: 140, medkits: 5, grenades: 2, weaponTier: 2, armorTier: 3 },
    },
  },
  clear_sky: {
    doctrine: "Разведать и закрепиться",
    summary: "Проводники быстро открывают безопасные маршруты, первыми занимают нейтральные точки и уверенно работают у аномалий.",
    effects: ["самый быстрый захват точек", "разведка и артефакты эффективнее", "сбалансированные мобильные группы"],
    directives: ["expansion", "artifacts", "defense", "expansion", "artifacts"],
    recruitment: ["Новички", "Ветераны", "Новички", "Мастера"],
    strategy: { defenseSensitivity: 0.92, raidFocus: "income", expansionFocus: "neutral", forceLimit: 4, allySupport: true },
    economy: { income: 1, upkeep: 0.96, hire: 0.96, artifactYield: 1.28, artifactValue: 1.12, caravan: 1.08, loot: 1, contracts: 1.04, allianceTrade: 1.08 },
    combat: { attack: 0.99, damageTaken: 0.97, accuracy: 1.04, speed: 1.11, capture: 1.38, suppressionTaken: 0.88, emissionDamage: 0.82, controlledCover: 0.04 },
    roster: {
      Новички: { id: "clear-sky-watch", name: "Болотный дозор", description: "4 бойца · разведка маршрутов · полевая медицина", formation: "mixed", fighters: 4, strength: 78, attack: 6, ammo: 105, medkits: 3, grenades: 1, weaponTier: 0, armorTier: 1 },
      Ветераны: { id: "clear-sky-recon-assault", name: "Штурм-разведка", description: "5 бойцов · быстрый захват · ближний бой", formation: "assault", fighters: 5, strength: 102, attack: 10, ammo: 130, medkits: 3, grenades: 2, weaponTier: 1, armorTier: 2 },
      Мастера: { id: "clear-sky-guides", name: "Проводники", description: "5 бойцов · дальняя разведка · точное оружие", formation: "sniper", fighters: 5, strength: 118, attack: 13, ammo: 155, medkits: 4, grenades: 2, weaponTier: 3, armorTier: 2 },
    },
  },
  renegades: {
    doctrine: "Удар из грязи",
    summary: "Нестабильные банды быстро собираются, устраивают засады и налёты, но плохо держат удар и почти не помогают союзникам.",
    effects: ["дешёвый найм и быстрые рейды", "больше трофеев из засад", "низкая стойкость, слабая экономика"],
    directives: ["raid", "expansion", "raid", "recovery", "raid"],
    recruitment: ["Новички", "Новички", "Ветераны", "Мастера"],
    strategy: { defenseSensitivity: 1.28, raidFocus: "caravans", expansionFocus: "neutral", forceLimit: 5, allySupport: false },
    economy: { income: 0.84, upkeep: 0.72, hire: 0.69, artifactYield: 0.72, artifactValue: 0.82, caravan: 0.72, loot: 1.38, contracts: 0.88, allianceTrade: 0.72 },
    combat: { attack: 1.06, damageTaken: 1.13, accuracy: 0.91, speed: 1.16, capture: 1.1, suppressionTaken: 1.14, emissionDamage: 1.08, controlledCover: 0.03 },
    roster: {
      Новички: { id: "renegades-scavengers", name: "Падальщики", description: "5 бойцов · кустарное оружие · минимальная цена", formation: "assault", fighters: 5, strength: 68, attack: 5, ammo: 70, medkits: 1, grenades: 1, weaponTier: 0, armorTier: 0 },
      Ветераны: { id: "renegades-ambushers", name: "Засадная группа", description: "4 бойца · скрытая позиция · много гранат", formation: "sniper", fighters: 4, strength: 90, attack: 9, ammo: 95, medkits: 2, grenades: 4, weaponTier: 1, armorTier: 1 },
      Мастера: { id: "renegades-cutthroats", name: "Головорезы", description: "5 бойцов · агрессивный штурм · трофейная броня", formation: "assault", fighters: 5, strength: 110, attack: 14, ammo: 125, medkits: 2, grenades: 4, weaponTier: 2, armorTier: 2 },
    },
  },
};

function rosterRank(rank: Squad["rank"]): HireRank {
  return rank === "Новички" || rank === "Мастера" ? rank : "Ветераны";
}

export function getFactionRosterEntry(faction: PlayableFactionId, rank: HireRank) {
  return FACTION_PROFILES[faction].roster[rank];
}

export function getSquadArchetype(squad: Squad) {
  if (squad.faction === "mutants" || squad.unitKind !== "combat") return null;
  const profile = FACTION_PROFILES[squad.faction];
  return Object.values(profile.roster).find((entry) => entry.id === squad.archetypeId) ?? profile.roster[rosterRank(squad.rank)];
}

export const FIGHTER_ROLE_LABELS: Record<FighterRole, string> = {
  riflemen: "Стрелки",
  assault: "Штурмовики",
  snipers: "Снайперы",
  heavy: "Тяжёлая поддержка",
  medics: "Медики",
};

export const COMMANDER_DISPOSITION_LABELS: Record<CommanderDisposition, string> = {
  honorable: "принципиальный",
  pragmatic: "прагматик",
  cautious: "осторожный",
  ambitious: "амбициозный",
  greedy: "корыстный",
  fanatic: "фанатик",
};

export const COMMANDER_BACKGROUND_LABELS: Record<CommanderBackground, string> = {
  founder: "собрал группу сам",
  veteran: "ветеран группировки",
  survivor: "выживший из разбитого отряда",
  defector: "пришёл из другой группировки",
  enforcer: "назначен штабом",
  scout: "бывший проводник",
};

export const FIELD_DEAL_LABELS: Record<FieldDealType, string> = {
  local_truce: "местное перемирие",
  passage: "договор о проходе",
  supplies: "обмен припасами",
  intelligence: "обмен разведданными",
  bribe: "плата за отход",
};

export const OPERATION_LABELS: Record<OperationType, string> = {
  defense: "ОБОРОНА",
  raid: "РЕЙД",
  expansion: "ЗАХВАТ",
  artifacts: "ПОИСК АРТЕФАКТОВ",
  recovery: "ВОССТАНОВЛЕНИЕ",
};

const COMMANDER_FIRST_NAMES = ["Артур", "Богдан", "Вадим", "Глеб", "Данила", "Егор", "Илья", "Кирилл", "Макс", "Назар", "Олег", "Роман", "Семён", "Тарас", "Фёдор", "Ярослав"];
const COMMANDER_CALLSIGNS = ["Шрам", "Седой", "Клык", "Грач", "Рысь", "Туман", "Зверь", "Док", "Беркут", "Крест", "Ворон", "Молот", "Лис", "Сыч", "Кобра", "Север", "Штык", "Филин", "Бес", "Сапёр"];

const COMMANDER_TRAITS: Record<CommanderDisposition, { honor: number; ambition: number; negotiation: number; autonomy: number }> = {
  honorable: { honor: 86, ambition: 42, negotiation: 56, autonomy: 48 },
  pragmatic: { honor: 62, ambition: 50, negotiation: 78, autonomy: 66 },
  cautious: { honor: 72, ambition: 24, negotiation: 70, autonomy: 52 },
  ambitious: { honor: 48, ambition: 88, negotiation: 62, autonomy: 78 },
  greedy: { honor: 24, ambition: 72, negotiation: 74, autonomy: 82 },
  fanatic: { honor: 68, ambition: 58, negotiation: 18, autonomy: 44 },
};

const FACTION_COMMANDER_POOLS: Record<PlayableFactionId, CommanderDisposition[]> = {
  stalkers: ["pragmatic", "honorable", "cautious", "ambitious"],
  duty: ["honorable", "fanatic", "ambitious", "pragmatic"],
  freedom: ["pragmatic", "honorable", "ambitious", "cautious"],
  bandits: ["greedy", "ambitious", "pragmatic", "cautious"],
  military: ["honorable", "pragmatic", "ambitious", "fanatic"],
  monolith: ["fanatic", "fanatic", "honorable", "ambitious"],
  mercenaries: ["pragmatic", "greedy", "cautious", "ambitious"],
  ecologists: ["cautious", "pragmatic", "honorable", "ambitious"],
  clear_sky: ["pragmatic", "cautious", "honorable", "ambitious"],
  renegades: ["greedy", "ambitious", "cautious", "pragmatic"],
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function makeCommander(
  faction: PlayableFactionId,
  nodeId: string,
  index: number,
  rank: Squad["rank"],
  homeGarrison: boolean,
): SquadCommander {
  const hash = stableHash(`${faction}:${nodeId}:${index}:${rank}`);
  const disposition = FACTION_COMMANDER_POOLS[faction][hash % FACTION_COMMANDER_POOLS[faction].length];
  const traits = COMMANDER_TRAITS[disposition];
  const rankExperience = rank === "Мастера" ? 88 : rank === "Ветераны" ? 75 : rank === "Опытные" ? 62 : 47;
  const background: CommanderBackground = homeGarrison
    ? (hash % 2 ? "veteran" : "enforcer")
    : hash % 13 === 0
      ? "defector"
      : index <= 2
        ? "founder"
        : (["veteran", "survivor", "scout", "founder"] as CommanderBackground[])[hash % 4];
  const previousCandidates = PLAYABLE_FACTIONS.filter((candidate) => candidate !== faction && candidate !== "monolith");
  const baseLoyalty = faction === "monolith" ? 98 : faction === "military" || faction === "duty" ? 84 : faction === "bandits" || faction === "renegades" ? 56 : 72;
  const jitter = (shift: number, radius: number) => ((hash >>> shift) % (radius * 2 + 1)) - radius;
  return {
    id: `cmd-${faction}-${index}-${nodeId}`,
    name: `${COMMANDER_FIRST_NAMES[(hash >>> 4) % COMMANDER_FIRST_NAMES.length]} «${COMMANDER_CALLSIGNS[(hash >>> 10) % COMMANDER_CALLSIGNS.length]}»`,
    callsign: COMMANDER_CALLSIGNS[(hash >>> 10) % COMMANDER_CALLSIGNS.length],
    disposition,
    background,
    previousFaction: background === "defector" ? previousCandidates[(hash >>> 15) % previousCandidates.length] : null,
    experience: Math.max(35, Math.min(100, rankExperience + jitter(7, 8))),
    leadership: Math.max(30, Math.min(100, rankExperience + jitter(12, 10))),
    negotiation: Math.max(5, Math.min(100, traits.negotiation + jitter(16, 9))),
    loyalty: Math.max(20, Math.min(100, baseLoyalty + (homeGarrison ? 8 : 0) + jitter(20, 10))),
    autonomy: Math.max(10, Math.min(100, traits.autonomy + jitter(5, 8))),
    honor: Math.max(5, Math.min(100, traits.honor + jitter(9, 8))),
    ambition: Math.max(5, Math.min(100, traits.ambition + jitter(14, 8))),
    deals: 0,
    betrayals: 0,
  };
}

const QUALITY_LABELS: Record<SquadQuality, string> = {
  raw: "необстрелянные",
  regular: "подготовленные",
  veteran: "ветеранские",
  elite: "элитные",
};

function squadTraining(squad: Squad) {
  const rankBase = squad.rank === "Мастера" ? 84 : squad.rank === "Ветераны" ? 68 : squad.rank === "Опытные" ? 52 : squad.rank === "Стая" ? 46 : 30;
  const commanderExperience = squad.commander?.experience ?? 50;
  return Math.round(Math.max(10, Math.min(100, rankBase + squad.xp * 0.08 + squad.weaponTier * 2 + squad.armorTier + (commanderExperience - 50) * 0.08)));
}

export function getSquadMarkerIntel(squad: Squad): SquadMarkerIntel {
  const training = squadTraining(squad);
  const quality: SquadQuality = training >= 82 ? "elite" : training >= 64 ? "veteran" : training >= 43 ? "regular" : "raw";
  const fighters = Math.max(0, squad.fighters);
  const shape: SquadMarkerShape = fighters >= 20
    ? "square"
    : fighters >= 10 || quality === "elite" || (quality !== "raw" && squad.formation === "heavy")
      ? "hexagon"
      : fighters >= 6 || quality === "veteran" || (quality !== "raw" && (squad.formation === "assault" || squad.formation === "sniper"))
        ? "diamond"
        : "circle";
  const sizeLabel = fighters >= 20 ? "СВОДНАЯ ГРУППА" : fighters >= 10 ? "ОТРЯД" : fighters >= 6 ? "ОТДЕЛЕНИЕ" : "ЗВЕНО";
  return {
    shape,
    quality,
    sizeLabel,
    qualityLabel: QUALITY_LABELS[quality],
    chevrons: quality === "elite" ? 3 : quality === "veteran" ? 2 : quality === "regular" ? 1 : 0,
  };
}

function roleWeights(formation: Formation): Record<FighterRole, number> {
  if (formation === "assault") return { riflemen: 0.24, assault: 0.5, snipers: 0.04, heavy: 0.12, medics: 0.1 };
  if (formation === "sniper") return { riflemen: 0.34, assault: 0.1, snipers: 0.38, heavy: 0.06, medics: 0.12 };
  if (formation === "heavy") return { riflemen: 0.32, assault: 0.16, snipers: 0.06, heavy: 0.36, medics: 0.1 };
  return { riflemen: 0.46, assault: 0.2, snipers: 0.14, heavy: 0.08, medics: 0.12 };
}

export function getSquadComposition(squad: Squad): Record<FighterRole, number> {
  const roles = Object.keys(FIGHTER_ROLE_LABELS) as FighterRole[];
  const weights = roleWeights(squad.formation);
  const entries = roles.map((role) => {
    const exact = Math.max(0, squad.fighters) * weights[role];
    return { role, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let unassigned = Math.max(0, squad.fighters) - entries.reduce((sum, entry) => sum + entry.count, 0);
  entries.sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < entries.length && unassigned > 0; index += 1, unassigned -= 1) entries[index].count += 1;
  return Object.fromEntries(entries.map((entry) => [entry.role, entry.count])) as Record<FighterRole, number>;
}

export function getSquadIntel(squad: Squad): SquadIntel {
  const maxFighters = Math.max(1, squad.maxFighters ?? squad.fighters);
  const fighterRatio = Math.max(0, Math.min(1, squad.fighters / maxFighters));
  const training = squadTraining(squad);
  const morale = Math.round(squad.morale ?? 60);
  const commandFactor = squad.commander ? 0.9 + squad.commander.leadership / 500 + squad.commander.loyalty / 1000 : 1;
  const combatPower = Math.round(squad.attack * (0.35 + fighterRatio * 0.65) * (0.7 + training / 220) * (0.72 + morale / 360) * (1 + squad.weaponTier * 0.12 + squad.armorTier * 0.08) * commandFactor);
  const skill = (value: number) => Math.round(Math.max(0, Math.min(100, value)));
  return {
    marker: getSquadMarkerIntel(squad),
    composition: getSquadComposition(squad),
    training,
    morale,
    combatPower,
    casualtyCount: Math.max(0, maxFighters - squad.fighters),
    skills: {
      firepower: skill(training * 0.62 + squad.weaponTier * 10 + (squad.formation === "sniper" || squad.formation === "heavy" ? 8 : 3)),
      discipline: skill(training * 0.48 + morale * 0.28 + (squad.commander?.leadership ?? 50) * 0.18 + (squad.commander?.loyalty ?? 60) * 0.1 - squad.suppression * 0.25),
      mobility: skill(training * 0.42 + (squad.stamina / Math.max(1, squad.maxStamina)) * 42 + (squad.formation === "assault" ? 10 : squad.formation === "heavy" ? -8 : 4)),
      survival: skill(training * 0.48 + squad.armorTier * 12 + fighterRatio * 18 + morale * 0.12),
    },
  };
}

const STARTING_OWNER: Record<string, PlayableFactionId> = {
  swamps: "clear_sky",
  fishing_hamlet: "clear_sky",
  machine_yard: "clear_sky",
  cordon: "stalkers",
  elevator: "stalkers",
  checkpoint: "military",
  forest_camp: "bandits",
  dark_valley: "bandits",
  x18: "bandits",
  agroprom: "military",
  agroprom_underground: "military",
  bar: "duty",
  rostok: "duty",
  warehouses: "freedom",
  barrier: "freedom",
  yantar: "ecologists",
  x16: "ecologists",
  dead_city: "mercenaries",
  limansk: "renegades",
  hospital: "renegades",
  yanov: "stalkers",
  skadovsk: "stalkers",
  pripyat: "monolith",
  cnpp: "monolith",
};

const BASE_NODE_DATA: Omit<ZoneNode, "owner" | "capture" | "captureFaction" | "security" | "capturedAt">[] = [
  { id: "swamps", name: "База Чистого неба", x: 93.3, y: 89.2, type: "base", baseFor: "clear_sky", income: 650, links: ["fishing_hamlet", "machine_yard", "old_church", "duga"] },
  { id: "fishing_hamlet", name: "Рыбацкий хутор", x: 96, y: 90.5, type: "camp", income: 360, links: ["swamps", "machine_yard"] },
  { id: "machine_yard", name: "Машинный двор", x: 90.2, y: 86.2, type: "outpost", income: 520, links: ["swamps", "fishing_hamlet", "old_church", "cordon"] },
  { id: "old_church", name: "Старая церковь", x: 87.2, y: 88.1, type: "shelter", income: 480, links: ["swamps", "machine_yard", "cordon", "garbage"] },
  { id: "cordon", name: "Деревня новичков", x: 55.1, y: 80.7, type: "base", baseFor: "stalkers", income: 800, links: ["machine_yard", "old_church", "garbage", "dark_valley", "zalesie"], sectorId: "cordon", localLinks: ["farmstead", "elevator"] },
  { id: "elevator", name: "Элеватор", x: 46, y: 85, type: "outpost", income: 430, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["cordon", "farmstead", "railway_checkpoint"] },
  { id: "railway_checkpoint", name: "Железнодорожная насыпь", x: 46, y: 85, type: "outpost", income: 560, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["elevator", "rail_tunnel", "north_outpost"] },
  { id: "checkpoint", name: "Южный блокпост", x: 46, y: 85, type: "outpost", income: 620, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["forest_camp"] },
  { id: "farmstead", name: "Заброшенная ферма", x: 46, y: 85, type: "camp", income: 420, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["cordon", "elevator", "forest_camp"] },
  { id: "forest_camp", name: "Лесной лагерь", x: 46, y: 85, type: "camp", income: 510, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["farmstead", "rail_tunnel", "checkpoint"] },
  { id: "rail_tunnel", name: "Железнодорожный тоннель", x: 46, y: 85, type: "shelter", income: 470, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["railway_checkpoint", "forest_camp", "north_outpost"] },
  { id: "north_outpost", name: "Северный переход", x: 46, y: 85, type: "outpost", income: 690, links: [], mapLevel: "sector", sectorId: "cordon", globalAnchorId: "cordon", localLinks: ["railway_checkpoint", "rail_tunnel"] },
  { id: "garbage", name: "Депо", x: 49.9, y: 53.3, type: "outpost", income: 980, links: ["old_church", "cordon", "flea_market", "hangar", "agroprom", "dark_valley", "zalesie"] },
  { id: "flea_market", name: "Барахолка", x: 46.9, y: 56.3, type: "camp", income: 540, links: ["garbage", "hangar", "agroprom", "bar"] },
  { id: "hangar", name: "Ангар", x: 54.2, y: 55.2, type: "shelter", income: 610, links: ["garbage", "flea_market", "dark_valley", "rostok"] },
  { id: "dark_valley", name: "Террикон", x: 51.5, y: 50.7, type: "base", baseFor: "bandits", income: 920, links: ["cordon", "garbage", "hangar", "x18", "wild"] },
  { id: "x18", name: "Заводская шахта", x: 55.7, y: 48.8, type: "shelter", income: 860, links: ["dark_valley", "wild"] },
  { id: "agroprom", name: "Химзавод", x: 38.5, y: 64.5, type: "base", baseFor: "military", income: 1100, links: ["garbage", "flea_market", "agroprom_underground", "yantar", "bar", "malachite"] },
  { id: "agroprom_underground", name: "Подземный склад Химзавода", x: 35.7, y: 62.4, type: "shelter", income: 690, links: ["agroprom", "yantar"] },
  { id: "bar", name: "Цементный завод", x: 61, y: 46.5, type: "base", baseFor: "duty", income: 1350, links: ["flea_market", "agroprom", "rostok", "warehouses", "cooling_towers"] },
  { id: "rostok", name: "Промзона Росток", x: 42.2, y: 52.3, type: "outpost", income: 820, links: ["hangar", "bar", "wild", "warehouses"] },
  { id: "wild", name: "Дикий остров", x: 65.6, y: 62.7, type: "anomaly", income: 1080, links: ["dark_valley", "x18", "rostok", "yantar", "dead_city", "sircaa"] },
  { id: "yantar", name: "Мобильный лагерь Янтаря", x: 26.5, y: 49.7, type: "base", baseFor: "ecologists", income: 1180, links: ["agroprom", "agroprom_underground", "wild", "x16", "red_forest", "malachite"] },
  { id: "x16", name: "Лаборатория X-16", x: 23.5, y: 48, type: "shelter", income: 930, links: ["yantar", "red_forest"] },
  { id: "warehouses", name: "Росток — база Свободы", x: 39.5, y: 50.9, type: "base", baseFor: "freedom", income: 1160, links: ["bar", "rostok", "barrier", "dead_city", "red_forest", "radar"] },
  { id: "barrier", name: "Северный барьер", x: 32.2, y: 38, type: "outpost", income: 840, links: ["warehouses", "red_forest", "radar"] },
  { id: "dead_city", name: "Мёртвый город", x: 56.5, y: 57.5, type: "base", baseFor: "mercenaries", income: 1040, links: ["wild", "warehouses", "limansk", "zaton", "sircaa"] },
  { id: "red_forest", name: "Рыжий лес", x: 27.4, y: 40.7, type: "anomaly", income: 1280, links: ["yantar", "x16", "warehouses", "barrier", "forester", "radar", "limansk"] },
  { id: "forester", name: "Башня Лесника", x: 24.8, y: 39.1, type: "camp", income: 620, links: ["red_forest", "limansk", "radar"] },
  { id: "limansk", name: "Лиманск", x: 42, y: 38, type: "base", baseFor: "renegades", income: 960, links: ["dead_city", "red_forest", "forester", "hospital", "yanov"] },
  { id: "radar", name: "Генераторы", x: 48.1, y: 26.3, type: "shelter", income: 1420, links: ["warehouses", "barrier", "red_forest", "forester", "pripyat"] },
  { id: "hospital", name: "Госпиталь", x: 35.8, y: 30.3, type: "shelter", income: 720, links: ["limansk", "pripyat", "jupiter", "yanov"] },
  { id: "pripyat", name: "Припять", x: 30, y: 21.2, type: "base", baseFor: "monolith", income: 1650, links: ["radar", "hospital", "cnpp", "energetik"] },
  { id: "jupiter", name: "Завод «Юпитер»", x: 24.1, y: 28.7, type: "outpost", income: 1240, links: ["hospital", "yanov", "zaton", "cnpp"] },
  { id: "yanov", name: "Станция Янов", x: 26.6, y: 33.2, type: "camp", income: 760, links: ["limansk", "hospital", "jupiter", "zaton"] },
  { id: "zaton", name: "Аномальный Затон", x: 82.8, y: 74.9, type: "anomaly", income: 1320, links: ["jupiter", "yanov", "skadovsk", "dead_city", "sircaa", "ikar"] },
  { id: "skadovsk", name: "Скадовск", x: 81.9, y: 76, type: "shelter", income: 710, links: ["zaton", "ikar"] },
  { id: "cnpp", name: "ЧАЭС", x: 48, y: 34.4, type: "shelter", income: 2200, links: ["pripyat", "jupiter", "cooling_towers", "energetik"] },
  { id: "zalesie", name: "Залесье", x: 49.4, y: 67.3, type: "camp", income: 590, links: ["cordon", "garbage", "duga"] },
  { id: "malachite", name: "НТЦ «Малахит»", x: 13.3, y: 58.1, type: "shelter", income: 1040, links: ["agroprom", "yantar", "duga"] },
  { id: "duga", name: "Дуга", x: 18.5, y: 74.5, type: "outpost", income: 940, links: ["malachite", "zalesie", "swamps"] },
  { id: "cooling_towers", name: "Градирни", x: 63.8, y: 42.3, type: "anomaly", income: 1260, links: ["bar", "cnpp", "sircaa"] },
  { id: "sircaa", name: "НИИЧАЗ", x: 81.2, y: 58.3, type: "shelter", income: 1480, links: ["wild", "dead_city", "zaton", "cooling_towers", "ikar"] },
  { id: "ikar", name: "Лагерь «Икар»", x: 74.7, y: 74.1, type: "camp", income: 720, links: ["sircaa", "zaton", "skadovsk"] },
  { id: "energetik", name: "ДК «Энергетик»", x: 28.8, y: 19.1, type: "shelter", income: 980, links: ["pripyat", "cnpp"] },
];

export function relationKey(a: FactionId, b: FactionId) {
  return [a, b].sort().join(":");
}

export function getRelation(state: GameState, a: FactionId, b: FactionId): Relation {
  if (a === b) return "alliance";
  return state.relations[relationKey(a, b)] ?? "neutral";
}

export function areHostile(state: GameState, a: FactionId, b: FactionId) {
  return a !== b && (a === "mutants" || b === "mutants" || getRelation(state, a, b) === "war");
}

function initialRelations(): Record<string, Relation> {
  const result: Record<string, Relation> = {};
  const war = (a: FactionId, b: FactionId) => {
    result[relationKey(a, b)] = "war";
  };
  for (const faction of PLAYABLE_FACTIONS) war(faction, "mutants");
  for (const faction of PLAYABLE_FACTIONS) if (faction !== "monolith") war(faction, "monolith");
  war("duty", "freedom");
  war("duty", "bandits");
  war("duty", "renegades");
  war("freedom", "military");
  war("bandits", "stalkers");
  war("bandits", "military");
  war("stalkers", "renegades");
  war("military", "stalkers");
  war("military", "renegades");
  war("clear_sky", "renegades");
  return result;
}

const INITIAL_PAIR_AFFINITY: Record<string, number> = {
  [relationKey("stalkers", "freedom")]: 16,
  [relationKey("stalkers", "ecologists")]: 28,
  [relationKey("stalkers", "clear_sky")]: 22,
  [relationKey("duty", "military")]: 14,
  [relationKey("freedom", "clear_sky")]: 18,
  [relationKey("ecologists", "clear_sky")]: 34,
  [relationKey("ecologists", "military")]: 12,
  [relationKey("bandits", "renegades")]: 20,
  [relationKey("mercenaries", "ecologists")]: 10,
  [relationKey("duty", "freedom")]: -36,
  [relationKey("bandits", "stalkers")]: -24,
  [relationKey("military", "stalkers")]: -20,
  [relationKey("clear_sky", "renegades")]: -24,
};

function makeBilateralDiplomacy(
  a: PlayableFactionId,
  b: PlayableFactionId,
  relation: Relation,
  simMinute: number,
): BilateralDiplomacy {
  const affinity = INITIAL_PAIR_AFFINITY[relationKey(a, b)] ?? 0;
  const alliance = relation === "alliance";
  const war = relation === "war";
  return {
    trust: clampDiplomacy((alliance ? 52 : war ? -42 : 4) + affinity),
    tension: clampPressure((war ? 72 : alliance ? 8 : 24) - affinity * 0.35),
    cooperation: clampPressure((alliance ? 58 : 8) + Math.max(0, affinity)),
    incidents: war ? 1 : 0,
    jointBattles: 0,
    tradesCompleted: 0,
    tradeVolume: 0,
    tradePact: alliance || affinity >= 25,
    defensePact: alliance,
    nonAggressionUntil: relation === "truce" ? simMinute + 1440 : null,
    lastChangedAt: simMinute,
    nextReviewAt: simMinute + 120,
  };
}

function initialFactionDiplomacy(relations: Record<string, Relation>, simMinute: number) {
  const result: Record<string, BilateralDiplomacy> = {};
  for (let left = 0; left < PLAYABLE_FACTIONS.length; left += 1) {
    for (let right = left + 1; right < PLAYABLE_FACTIONS.length; right += 1) {
      const a = PLAYABLE_FACTIONS[left];
      const b = PLAYABLE_FACTIONS[right];
      const key = relationKey(a, b);
      result[key] = makeBilateralDiplomacy(a, b, relations[key] ?? "neutral", simMinute);
    }
  }
  return result;
}

export function getBilateralDiplomacy(state: GameState, a: PlayableFactionId, b: PlayableFactionId) {
  const key = relationKey(a, b);
  return state.factionDiplomacy?.[key] ?? makeBilateralDiplomacy(a, b, state.relations[key] ?? "neutral", state.simMinute);
}

function adjustBilateralDiplomacy(
  state: GameState,
  a: PlayableFactionId,
  b: PlayableFactionId,
  change: Partial<Pick<BilateralDiplomacy, "trust" | "tension" | "cooperation" | "incidents" | "jointBattles" | "tradesCompleted" | "tradeVolume">>,
) {
  if (a === b) return;
  const memory = getBilateralDiplomacy(state, a, b);
  state.factionDiplomacy[relationKey(a, b)] = memory;
  memory.trust = clampDiplomacy(memory.trust + (change.trust ?? 0));
  memory.tension = clampPressure(memory.tension + (change.tension ?? 0));
  memory.cooperation = clampPressure(memory.cooperation + (change.cooperation ?? 0));
  memory.incidents = Math.max(0, memory.incidents + (change.incidents ?? 0));
  memory.jointBattles = Math.max(0, memory.jointBattles + (change.jointBattles ?? 0));
  memory.tradesCompleted = Math.max(0, memory.tradesCompleted + (change.tradesCompleted ?? 0));
  memory.tradeVolume = Math.max(0, memory.tradeVolume + (change.tradeVolume ?? 0));
  memory.lastChangedAt = state.simMinute;
}

export function squadPairKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

function isNeutralPlayerSquad(state: GameState, squad: Pick<Squad, "id">) {
  return state.campaignMode === "squad" && state.squadAllegiance === null && squad.id === state.playerSquadId;
}

function makeSquadDiplomacyMemory(state: GameState, left: Squad, right: Squad): SquadDiplomacyMemory {
  const relation = isNeutralPlayerSquad(state, left) || isNeutralPlayerSquad(state, right) ? "neutral" : getRelation(state, left.faction, right.faction);
  return {
    trust: relation === "alliance" ? 35 : relation === "war" ? -28 : relation === "truce" ? 12 : 2,
    respect: Math.round((squadTraining(left) + squadTraining(right)) / 8),
    grievance: relation === "war" ? 30 : 0,
    encounters: 0,
    deals: 0,
    betrayals: 0,
    lastContactAt: state.simMinute,
    nextContactAt: state.simMinute,
  };
}

export function getSquadDiplomacy(state: GameState, left: Squad, right: Squad) {
  const key = squadPairKey(left.id, right.id);
  return state.squadDiplomacy?.[key] ?? makeSquadDiplomacyMemory(state, left, right);
}

function ensureSquadDiplomacy(state: GameState, left: Squad, right: Squad) {
  const key = squadPairKey(left.id, right.id);
  const memory = state.squadDiplomacy[key] ?? makeSquadDiplomacyMemory(state, left, right);
  state.squadDiplomacy[key] = memory;
  return memory;
}

export function getActiveFieldDealsForSquad(state: GameState, squadId: string) {
  return (state.fieldDeals ?? []).filter((deal) => deal.status === "active" && deal.expiresAt > state.simMinute && (deal.leftSquadId === squadId || deal.rightSquadId === squadId));
}

function activePairDeal(state: GameState, left: Squad, right: Squad) {
  const key = squadPairKey(left.id, right.id);
  return (state.fieldDeals ?? []).find((deal) => deal.status === "active" && deal.expiresAt > state.simMinute && squadPairKey(deal.leftSquadId, deal.rightSquadId) === key) ?? null;
}

function squadHasFieldProtectionAgainstOwner(state: GameState, squad: Squad, owner: FactionId) {
  return getActiveFieldDealsForSquad(state, squad.id).some((deal) => {
    if (!["local_truce", "bribe", "passage"].includes(deal.type)) return false;
    const otherId = deal.leftSquadId === squad.id ? deal.rightSquadId : deal.leftSquadId;
    return state.squads.find((other) => other.id === otherId)?.faction === owner;
  });
}

export function squadsAreHostile(state: GameState, left: Squad, right: Squad) {
  const neutralOther = isNeutralPlayerSquad(state, left) ? right : isNeutralPlayerSquad(state, right) ? left : null;
  if (neutralOther) {
    if (neutralOther.faction === "mutants" || neutralOther.faction === "monolith") return true;
    const memory = state.diplomacyMemory[neutralOther.faction as PlayableFactionId];
    if (!memory || memory.grievance < 45) return false;
  }
  if (!areHostile(state, left.faction, right.faction)) return false;
  const deal = activePairDeal(state, left, right);
  return !deal || (deal.type !== "local_truce" && deal.type !== "bribe");
}

function clampDiplomacy(value: number) {
  return Math.max(-100, Math.min(100, Math.round(value)));
}

function clampPressure(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function initialDiplomacyMemory(playerFaction: PlayableFactionId, relations: Record<string, Relation>, simMinute: number) {
  return Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => {
    const relation = faction === playerFaction ? "alliance" : relations[relationKey(playerFaction, faction)] ?? "neutral";
    const memory: FactionMemory = {
      trust: faction === playerFaction ? 100 : faction === "monolith" ? -100 : relation === "war" ? -32 : relation === "alliance" ? 45 : 5,
      fear: faction === playerFaction ? 0 : relation === "war" ? 8 : 0,
      grievance: faction === playerFaction ? 0 : faction === "monolith" ? 100 : relation === "war" ? 32 : 0,
      playerKills: 0,
      territoriesLost: 0,
      aidReceived: 0,
      lastIncidentAt: simMinute,
      nextNegotiationAt: simMinute,
    };
    return [faction, memory];
  })) as Record<PlayableFactionId, FactionMemory>;
}

function initialFactionSurvival() {
  return Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, {
    condition: "active",
    baseLostAt: null,
    destroyedAt: null,
  }])) as Record<PlayableFactionId, FactionSurvival>;
}

function initialFactionStrategy() {
  return Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, {
    manpower: faction === "military" || faction === "monolith" ? 42 : faction === "ecologists" ? 24 : 32,
    supply: faction === "bandits" || faction === "renegades" ? 72 : 82,
    warWeariness: faction === "monolith" ? 8 : 14,
    casualties: 0,
    territoriesCaptured: 0,
    territoriesLost: 0,
    insolvencyCycles: 0,
    lastCaptureAt: null,
  }])) as Record<PlayableFactionId, FactionStrategicState>;
}

export function getFactionCondition(state: GameState, faction: PlayableFactionId): FactionCondition {
  return state.factionSurvival?.[faction]?.condition ?? "active";
}

export function getDiplomacyTerms(state: GameState, faction: PlayableFactionId): DiplomacyTerms {
  const relation = getRelation(state, state.playerFaction, faction);
  const memory = state.diplomacyMemory?.[faction] ?? initialDiplomacyMemory(state.playerFaction, state.relations, state.simMinute)[faction];
  const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
  const tradeDiscount = 1 - state.research.trade * 0.04;
  const targetBalance = getFactionBalanceSummary(state, faction);
  const acceptance = Math.round(memory.trust + memory.fear * 0.38 - memory.grievance * 0.52 + state.reputation * 0.28 + bilateral.cooperation * 0.18 - bilateral.tension * 0.16 + targetBalance.warWeariness * .22 + Math.max(0, 35 - targetBalance.supply) * .28);
  const exhaustionDiscount = Math.max(.55, 1 - targetBalance.warWeariness / 180);
  const truceCost = Math.max(1800, Math.min(18000, Math.round((4300 + memory.grievance * 95 - memory.fear * 24) * tradeDiscount * exhaustionDiscount)));
  const allianceCost = Math.max(7000, Math.min(24000, Math.round((8500 + Math.max(0, 30 - memory.trust) * 130 + memory.grievance * 75) * tradeDiscount)));
  const giftCost = Math.max(3000, Math.round(4000 * tradeDiscount));
  const supportCost = Math.max(1800, Math.round(3000 * tradeDiscount));
  const tradePactCost = Math.max(2500, Math.round((4200 + bilateral.tension * 35 - bilateral.cooperation * 18) * tradeDiscount));
  const nonAggressionCost = Math.max(2000, Math.round((3500 + bilateral.tension * 42 - memory.trust * 18) * tradeDiscount));
  const cooldown = Math.max(0, memory.nextNegotiationAt - state.simMinute);
  const condition = getFactionCondition(state, faction);
  const threatened = state.nodes.some((node) => node.owner === state.playerFaction && state.squads.some((squad) => squad.nodeId === node.id && squad.status !== "dead" && areHostile(state, state.playerFaction, squad.faction)));
  const supportAvailable = state.squads.some((squad) => squad.faction === faction && squad.unitKind === "combat" && !squad.homeGarrison && squad.status === "idle");
  const canTruce = faction !== "monolith" && condition !== "destroyed" && relation === "war" && cooldown === 0 && acceptance >= -70;
  const canAlliance = faction !== "monolith" && condition === "active" && (relation === "neutral" || relation === "truce") && cooldown === 0 && memory.trust >= 25 && memory.grievance <= 50 && state.reputation >= -40 && acceptance >= 8;
  const canRequestSupport = relation === "alliance" && condition === "active" && cooldown === 0 && threatened && supportAvailable;
  const canTradePact = faction !== "monolith" && condition === "active" && relation !== "war" && cooldown === 0 && !bilateral.tradePact && memory.trust >= 8 && bilateral.tension <= 58;
  const canNonAggression = faction !== "monolith" && condition !== "destroyed" && relation === "neutral" && cooldown === 0 && !bilateral.nonAggressionUntil && memory.grievance <= 60;
  let reason = "Канал открыт.";
  if (faction === "monolith") reason = "Монолит не отвечает на переговоры.";
  else if (condition === "destroyed") reason = "Организованного командования больше нет.";
  else if (cooldown > 0) reason = `Канал будет доступен через ${Math.ceil(cooldown)} мин.`;
  else if (relation === "war" && !canTruce) reason = "Накопленные потери и обиды блокируют перемирие.";
  else if ((relation === "neutral" || relation === "truce") && !canAlliance) reason = "Для союза не хватает доверия или репутации.";
  else if (relation === "alliance" && !threatened) reason = "Поддержка доступна только при реальной угрозе вашей территории.";
  return { relation, acceptance, truceCost, allianceCost, giftCost, supportCost, tradePactCost, nonAggressionCost, canTruce, canAlliance, canRequestSupport, canTradePact, canNonAggression, cooldown, reason };
}

const FORMATION_COMBAT = {
  mixed: { role: "СТРЕЛКИ", range: 155, accuracy: 0.68, burst: 5, magazine: 30 },
  assault: { role: "ШТУРМОВИКИ", range: 88, accuracy: 0.63, burst: 7, magazine: 30 },
  sniper: { role: "СНАЙПЕРСКАЯ ГРУППА", range: 245, accuracy: 0.79, burst: 2, magazine: 10 },
  heavy: { role: "ТЯЖЁЛАЯ ПОДДЕРЖКА", range: 175, accuracy: 0.61, burst: 10, magazine: 50 },
} satisfies Record<Formation, { role: string; range: number; accuracy: number; burst: number; magazine: number }>;

const MUTANT_COMBAT: Record<MutantType, { role: string; range: number; accuracy: number; strength: number; attack: number; fighters: number; speed: number; damageTaken: number; habitats: string[] }> = {
  dogs: { role: "СТАЙНАЯ АТАКА", range: 26, accuracy: 0.7, strength: 64, attack: 7, fighters: 8, speed: 1.38, damageTaken: 1.08, habitats: ["cordon", "garbage", "swamps"] },
  flesh: { role: "ТЯЖЁЛЫЙ НАТИСК", range: 18, accuracy: 0.6, strength: 94, attack: 6, fighters: 6, speed: 0.82, damageTaken: .94, habitats: ["swamps", "cordon", "garbage", "agroprom"] },
  boar: { role: "ТАРАН", range: 20, accuracy: .68, strength: 112, attack: 10, fighters: 5, speed: 1.02, damageTaken: .84, habitats: ["swamps", "cordon", "garbage", "red_forest"] },
  pseudodog: { role: "ФАНТОМНАЯ СТАЯ", range: 38, accuracy: .76, strength: 92, attack: 10, fighters: 5, speed: 1.32, damageTaken: .9, habitats: ["dark_valley", "red_forest", "dead_city"] },
  snork: { role: "ПРЫЖКОВЫЙ ШТУРМ", range: 42, accuracy: .79, strength: 84, attack: 12, fighters: 4, speed: 1.24, damageTaken: .94, habitats: ["agroprom", "yantar", "jupiter", "pripyat"] },
  bloodsucker: { role: "НЕВИДИМАЯ ЗАСАДА", range: 32, accuracy: 0.82, strength: 96, attack: 14, fighters: 1, speed: 1.2, damageTaken: .82, habitats: ["swamps", "dark_valley", "dead_city", "red_forest"] },
  poltergeist: { role: "ТЕЛЕКИНЕТИЧЕСКИЙ ОБСТРЕЛ", range: 112, accuracy: .72, strength: 88, attack: 10, fighters: 1, speed: .72, damageTaken: .78, habitats: ["dark_valley", "yantar", "jupiter"] },
  burer: { role: "ПУЛЕВОЙ БАРЬЕР", range: 78, accuracy: .7, strength: 126, attack: 11, fighters: 1, speed: .62, damageTaken: .64, habitats: ["agroprom", "yantar", "jupiter", "pripyat"] },
  controller: { role: "ПСИ-АТАКА", range: 135, accuracy: 0.74, strength: 108, attack: 11, fighters: 1, speed: 0.74, damageTaken: .88, habitats: ["yantar", "radar", "pripyat"] },
  chimera: { role: "НОЧНАЯ ЗАСАДА", range: 46, accuracy: .9, strength: 142, attack: 20, fighters: 1, speed: 1.42, damageTaken: .72, habitats: ["red_forest", "jupiter", "pripyat"] },
  pseudogiant: { role: "СЕЙСМИЧЕСКИЙ УДАР", range: 34, accuracy: .72, strength: 260, attack: 24, fighters: 1, speed: .52, damageTaken: .46, habitats: ["dark_valley", "yantar", "pripyat"] },
};

function initialTacticalPosition(squad: Pick<Squad, "id" | "faction">, playerFaction: PlayableFactionId) {
  let hash = 19;
  for (const char of squad.id) hash = (Math.imul(hash, 41) + char.charCodeAt(0)) | 0;
  const playerSide = squad.faction === playerFaction;
  return {
    x: (playerSide ? 16 : 67) + (Math.abs(hash) % 18),
    y: 17 + (Math.abs(hash >> 5) % 65),
  };
}

function resetTacticalPosition(squad: Squad, playerFaction: PlayableFactionId) {
  const position = initialTacticalPosition(squad, playerFaction);
  squad.tacticalX = position.x;
  squad.tacticalY = position.y;
}

const MASTER_LOADOUTS: Record<PlayableFactionId, { weapon: ZoneItemId; armor: ZoneItemId }> = {
  stalkers: { weapon: "vintorez", armor: "seva" }, duty: { weapon: "pkp", armor: "exoskeleton" }, freedom: { weapon: "svd", armor: "merc_suit" },
  bandits: { weapon: "groza", armor: "merc_suit" }, military: { weapon: "fn2000", armor: "bulat" }, monolith: { weapon: "gauss", armor: "exoskeleton" },
  mercenaries: { weapon: "fn2000", armor: "merc_suit" }, ecologists: { weapon: "vintorez", armor: "ecologist_suit" }, clear_sky: { weapon: "abakan", armor: "seva" }, renegades: { weapon: "groza", armor: "psz9" },
};

function initialLoadout(faction: PlayableFactionId, rank: Squad["rank"]) {
  return rank === "Мастера" ? MASTER_LOADOUTS[faction] : STARTING_EQUIPMENT[faction];
}

function makeSquad(
  faction: FactionId,
  nodeId: string,
  index: number,
  rank: Squad["rank"] = "Опытные",
  homeGarrison = false,
  mutantType?: MutantType,
  fighterOverride?: number,
): Squad {
  const mutant = faction === "mutants";
  const resolvedMutantType = mutant ? mutantType ?? (["dogs", "flesh", "boar", "pseudodog", "snork", "bloodsucker", "poltergeist", "burer", "controller", "chimera", "pseudogiant"] as MutantType[])[Math.abs(index) % 11] : null;
  const mutantSpec = resolvedMutantType ? MUTANT_COMBAT[resolvedMutantType] : null;
  const archetype = mutant ? null : FACTION_PROFILES[faction as PlayableFactionId].roster[rosterRank(rank)];
  const formation = archetype?.formation ?? "mixed";
  const combat = FORMATION_COMBAT[formation];
  const baseFighters = mutantSpec?.fighters ?? archetype?.fighters ?? 4;
  const maxFighters = Math.max(1, fighterOverride ?? baseFighters);
  const sizeScale = maxFighters / Math.max(1, baseFighters);
  const baseStrength = mutantSpec?.strength ?? archetype?.strength ?? 86;
  const baseAttack = mutantSpec?.attack ?? archetype?.attack ?? 7;
  const maxStrength = Math.round(baseStrength * (fighterOverride ? 0.35 + sizeScale * 0.65 : 1));
  const scaledAttack = Math.round(baseAttack * (fighterOverride ? 0.55 + sizeScale * 0.45 : 1));
  const morale = mutant ? 66 : rank === "Мастера" ? 88 : rank === "Ветераны" ? 76 : rank === "Опытные" ? 62 : 46;
  const loadout = mutant ? null : initialLoadout(faction as PlayableFactionId, rank);
  const weapon = loadout ? ZONE_ITEMS[loadout.weapon] : null;
  return {
    id: `${faction}-${index}-${nodeId}`,
    name: resolvedMutantType ? `${MUTANT_LABELS[resolvedMutantType]} ${index}` : `${archetype?.name ?? FACTIONS[faction].short} ${String(index).padStart(2, "0")}`,
    faction,
    rank: mutant ? "Стая" : rank,
    nodeId,
    previousNodeId: null,
    destinationId: null,
    status: "idle",
    travel: 0,
    strength: maxStrength,
    maxStrength,
    fighters: maxFighters,
    maxFighters,
    morale,
    attack: scaledAttack,
    ammo: mutant ? 0 : archetype?.ammo ?? 100,
    maxAmmo: mutant ? 0 : archetype?.ammo ?? 100,
    medkits: mutant ? 0 : archetype?.medkits ?? 2,
    grenades: mutant ? 0 : archetype?.grenades ?? 1,
    cover: resolvedMutantType === "bloodsucker" ? 0.18 : 0,
    xp: 0,
    formation,
    weaponTier: archetype?.weaponTier ?? 0,
    armorTier: archetype?.armorTier ?? 0,
    homeGarrison,
    tacticalX: 50,
    tacticalY: 50,
    stamina: 100,
    maxStamina: 100,
    suppression: 0,
    magazine: mutant ? 0 : weapon?.effects.magazine ?? combat.magazine,
    magazineSize: mutant ? 0 : weapon?.effects.magazine ?? combat.magazine,
    unitKind: mutant ? "mutant" : "combat",
    mission: mutant ? "roam" : "hold",
    missionTargetId: null,
    missionPath: [],
    missionIssuedAt: 0,
    cargo: 0,
    mutantType: resolvedMutantType,
    archetypeId: archetype?.id ?? null,
    commander: mutant ? null : makeCommander(faction as PlayableFactionId, nodeId, index, rank, homeGarrison),
    weaponId: loadout?.weapon ?? null,
    armorId: loadout?.armor ?? null,
    artifactIds: [],
  };
}

function makePlayerOperatives(squad: Squad): SquadOperative[] {
  const templates: Array<Pick<SquadOperative, "name" | "callsign" | "trait" | "specialization" | "localX" | "localY" | "morale" | "trust" | "loyalty">> = [
    { name: "Денис Воронов", callsign: "Сыч", trait: "calm", specialization: "leader", localX: 43, localY: 55, morale: 52, trust: 58, loyalty: 61 },
    { name: "Максим Рудой", callsign: "Рыжий", trait: "greedy", specialization: "scout", localX: 48, localY: 61, morale: 47, trust: 43, loyalty: 48 },
    { name: "Антон Кравец", callsign: "Шило", trait: "aggressive", specialization: "assault", localX: 52, localY: 54, morale: 55, trust: 46, loyalty: 52 },
  ];
  return templates.map((template, index) => ({
    id: `${squad.id}-operative-${index + 1}`,
    squadId: squad.id,
    ...template,
    health: 100,
    maxHealth: 100,
    experience: 4 + index * 2,
    condition: "healthy",
    destinationX: null,
    destinationY: null,
    order: "idle",
    orderTarget: null,
    actionUntil: null,
    weaponId: index === 2 ? "sawed_off" : "makarov",
    armorId: "leather_jacket",
  }));
}

const RECRUIT_TEMPLATES: Record<RecruitTier, Omit<RecruitCandidate, "tier" | "callsign">> = {
  rookie: { title: "Случайный новичок", trait: "coward", specialization: "marksman", cost: 350, health: 68, morale: 34, experience: 1, weaponId: "makarov", armorId: "leather_jacket" },
  regular: { title: "Обычный сталкер", trait: "paranoid", specialization: "scout", cost: 1700, health: 88, morale: 52, experience: 14, weaponId: "ak74u", armorId: "leather_jacket" },
  veteran: { title: "Опытный компаньон", trait: "calm", specialization: "medic", cost: 5600, health: 105, morale: 72, experience: 38, weaponId: "ak74", armorId: "stalker_suit" },
  ace: { title: "Ас Зоны", trait: "aggressive", specialization: "assault", cost: 12800, health: 120, morale: 88, experience: 67, weaponId: "vintorez", armorId: "merc_suit" },
};

const RECRUIT_CALLSIGNS = ["Мелкий", "Филин", "Бурый", "Док", "Хмурый", "Клин", "Лис", "Бес", "Тихий", "Клык", "Север", "Гюрза"];

export function getRecruitCandidates(state: GameState): RecruitCandidate[] {
  const offset = Math.floor(state.simMinute / 1440) + state.operatives.length;
  return (["rookie", "regular", "veteran", "ace"] as RecruitTier[]).map((tier, index) => ({
    tier,
    callsign: RECRUIT_CALLSIGNS[(offset + index * 3) % RECRUIT_CALLSIGNS.length],
    ...RECRUIT_TEMPLATES[tier],
  }));
}

export function canRecruitAtCurrentLocation(state: GameState) {
  if (state.campaignMode !== "squad" || !state.playerSquadId) return false;
  const squad = state.squads.find((item) => item.id === state.playerSquadId);
  const node = squad ? state.nodes.find((item) => item.id === squad.nodeId) : null;
  return Boolean(squad && node && squad.status === "idle" && !squad.homeGarrison && (node.type === "base" || node.type === "camp" || node.type === "shelter"));
}

export function hireOperative(previous: GameState, tier: RecruitTier): GameState {
  if (!canRecruitAtCurrentLocation(previous)) return previous;
  const candidate = getRecruitCandidates(previous).find((item) => item.tier === tier);
  if (!candidate || previous.rubles < candidate.cost || !previous.playerSquadId) return previous;
  const state: GameState = {
    ...previous,
    rubles: previous.rubles - candidate.cost,
    operatives: previous.operatives.map((operative) => ({ ...operative })),
    squads: previous.squads.map((squad) => ({ ...squad, missionPath: [...squad.missionPath] })),
    log: [...previous.log],
  };
  const anchor = state.operatives.find((operative) => operative.squadId === state.playerSquadId && operative.condition !== "dead" && operative.condition !== "left");
  const sequence = state.operatives.length + 1;
  state.operatives.push({
    id: `${state.playerSquadId}-operative-${state.simMinute}-${sequence}`,
    squadId: state.playerSquadId,
    name: `${candidate.callsign} ${candidate.title}`,
    callsign: candidate.callsign,
    trait: candidate.trait,
    specialization: candidate.specialization,
    health: candidate.health,
    maxHealth: candidate.health,
    morale: candidate.morale,
    trust: tier === "ace" ? 36 : tier === "veteran" ? 44 : 50,
    experience: candidate.experience,
    loyalty: tier === "rookie" ? 42 : tier === "ace" ? 58 : 52,
    condition: "healthy",
    localX: Math.max(4, Math.min(96, (anchor?.localX ?? 48) + (sequence % 3) * 2 - 2)),
    localY: Math.max(4, Math.min(96, (anchor?.localY ?? 56) + (sequence % 2) * 3)),
    destinationX: null,
    destinationY: null,
    order: "idle",
    orderTarget: null,
    actionUntil: null,
    weaponId: candidate.weaponId,
    armorId: candidate.armorId,
  });
  const squad = state.squads.find((item) => item.id === state.playerSquadId)!;
  const combatGain = tier === "ace" ? 31 : tier === "veteran" ? 25 : tier === "regular" ? 18 : 11;
  const attackGain = tier === "ace" ? 8 : tier === "veteran" ? 5 : tier === "regular" ? 3 : 1;
  squad.fighters += 1;
  squad.maxFighters += 1;
  squad.strength += combatGain;
  squad.maxStrength += combatGain;
  squad.attack += attackGain;
  squad.ammo += tier === "ace" ? 110 : tier === "veteran" ? 90 : tier === "regular" ? 60 : 24;
  squad.maxAmmo += tier === "ace" ? 110 : tier === "veteran" ? 90 : tier === "regular" ? 60 : 24;
  addLog(state, `${candidate.callsign} вступил в отряд за ${candidate.cost.toLocaleString("ru-RU")} ₽.`, "success");
  return state;
}

function logEntry(minute: number, text: string, tone: LogEntry["tone"] = "info"): LogEntry {
  return { id: `${minute}-${Math.random().toString(36).slice(2, 8)}`, minute, text, tone };
}

function addLog(state: GameState, text: string, tone: LogEntry["tone"] = "info") {
  state.log = [logEntry(state.simMinute, text, tone), ...state.log].slice(0, 80);
}

function randomStep(seed: number) {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
}

export function createGame(
  playerFaction: PlayableFactionId,
  campaignMode: CampaignMode = "faction",
  squadAllegiance: PlayableFactionId | null = playerFaction,
): GameState {
  const extraNodeData: Omit<ZoneNode, "owner" | "capture" | "captureFaction" | "security" | "capturedAt">[] = EXTRA_SECTOR_NODES.map((spec) => {
    const anchor = BASE_NODE_DATA.find((node) => node.id === spec.globalAnchorId)!;
    return {
      id: spec.id,
      name: spec.name,
      x: anchor.x,
      y: anchor.y,
      type: spec.type,
      income: spec.income,
      links: [],
      mapLevel: "sector",
      sectorId: spec.sectorId,
      globalAnchorId: spec.globalAnchorId,
      localLinks: [...spec.localLinks],
    };
  });
  const nodes = [...BASE_NODE_DATA, ...extraNodeData].map((node) => {
    const sector = getSectorForNode(node.id);
    const point = findSectorPoint(node.id);
    return {
      ...node,
      links: [...node.links],
      sectorId: sector?.id ?? node.sectorId,
      localLinks: point ? [...point.localLinks] : node.localLinks ? [...node.localLinks] : undefined,
      owner: STARTING_OWNER[node.id] ?? point?.startingOwner ?? null,
      capture: 0,
      captureFaction: null,
      security: STARTING_OWNER[node.id] ?? point?.startingOwner ? 100 : 0,
      capturedAt: null,
    };
  });
  const squads: Squad[] = [];
  for (const [factionIndex, faction] of PLAYABLE_FACTIONS.entries()) {
    const base = nodes.find((node) => node.baseFor === faction)!;
    squads.push(makeSquad(faction, base.id, 1, "Ветераны"));
    if (faction === playerFaction && campaignMode === "faction") squads.push(makeSquad(faction, base.id, 2, "Новички"));
    squads.push(makeSquad(faction, base.id, 1000 + factionIndex, "Опытные", true, undefined, 20));
  }
  squads.push(makeSquad("military", "checkpoint", 73, "Ветераны", true));
  squads.push(makeSquad("bandits", "forest_camp", 61, "Опытные", true));
  for (const [index, sector] of SECTOR_MAPS.entries()) {
    if (sector.id === "cordon") continue;
    const garrison = sector.points.find((point) => point.extra && point.startingOwner && point.startingOwner !== "mutants");
    if (garrison?.startingOwner) squads.push(makeSquad(garrison.startingOwner, garrison.id, 90 + index, "Опытные", true, undefined, 12));
  }
  squads.push(makeSquad("mutants", "red_forest", 1, "Опытные", false, "bloodsucker"));
  squads.push(makeSquad("mutants", "garbage", 2, "Опытные", false, "dogs"));
  let playerSquadId: string | null = null;
  if (campaignMode === "squad") {
    const startFaction = squadAllegiance ?? "stalkers";
    const startNode = squadAllegiance ? nodes.find((node) => node.baseFor === startFaction)! : nodes.find((node) => node.id === "cordon")!;
    const newcomer = makeSquad(startFaction, startNode.id, 2, "Новички", false, undefined, 3);
    newcomer.name = squadAllegiance ? `${FACTIONS[startFaction].short} Новички` : "Трое с Большой земли";
    newcomer.fighters = 3;
    newcomer.maxFighters = 3;
    newcomer.strength = Math.min(newcomer.strength, 48);
    newcomer.maxStrength = Math.min(newcomer.maxStrength, 48);
    newcomer.attack = Math.min(newcomer.attack, 4);
    newcomer.ammo = 42;
    newcomer.maxAmmo = 72;
    newcomer.medkits = 1;
    newcomer.grenades = 0;
    newcomer.weaponId = "makarov";
    newcomer.armorId = "leather_jacket";
    newcomer.weaponTier = 0;
    newcomer.armorTier = 0;
    newcomer.morale = 44;
    newcomer.mission = "player";
    squads.push(newcomer);
    playerSquadId = newcomer.id;
  }
  for (const squad of squads) {
    resetTacticalPosition(squad, playerFaction);
    if (campaignMode === "faction" && squad.faction === playerFaction && squad.unitKind === "combat") squad.mission = "player";
  }
  const operatives = campaignMode === "squad" && playerSquadId
    ? makePlayerOperatives(squads.find((squad) => squad.id === playerSquadId)!)
    : [];

  const factionFunds = Object.fromEntries(
    (Object.keys(FACTIONS) as FactionId[]).map((id) => [id, id === playerFaction ? 32000 : 24000]),
  ) as Record<FactionId, number>;

  const simMinute = 8 * 60;
  const knowledgeSquad = playerSquadId ? squads.find((squad) => squad.id === playerSquadId) ?? null : null;
  const knowledgeNode = knowledgeSquad ? nodes.find((node) => node.id === knowledgeSquad.nodeId) ?? null : null;
  const knowledgeSectorId = knowledgeNode?.sectorId ?? getSectorForNode(knowledgeNode?.id ?? "")?.id ?? null;
  const knownNodeIds = new Set<string>([
    ...(knowledgeSectorId ? nodes.filter((node) => node.sectorId === knowledgeSectorId).map((node) => node.id) : []),
    ...(knowledgeNode ? [knowledgeNode.id, ...knowledgeNode.links, ...(knowledgeNode.localLinks ?? [])] : []),
  ]);
  const knownSquads = Object.fromEntries(squads
    .filter((squad) => squad.status !== "dead" && knowledgeSectorId && nodes.find((node) => node.id === squad.nodeId)?.sectorId === knowledgeSectorId)
    .map((squad) => [squad.id, {
      squadId: squad.id,
      nodeId: squad.nodeId,
      faction: squad.faction,
      name: squad.name,
      fighters: squad.fighters,
      seenAt: simMinute,
      source: "visual" as const,
    }]));
  const relations = initialRelations();
  const playerBase = nodes.find((node) => node.baseFor === playerFaction)!;
  const directives = Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, {
    type: faction === playerFaction ? "manual" : "recovery",
    targetNodeId: nodes.find((node) => node.baseFor === faction)?.id ?? null,
    issuedAt: simMinute,
    reason: faction === playerFaction ? "Приказы определяет игрок" : "Сбор сил на основной базе",
  }])) as Record<PlayableFactionId, FactionDirective>;
  const state: GameState = {
    version: 1,
    playerFaction,
    campaignMode,
    squadAllegiance: campaignMode === "squad" ? squadAllegiance : playerFaction,
    playerSquadId: campaignMode === "squad" ? playerSquadId : null,
    simMinute,
    speed: 1,
    rubles: campaignMode === "squad" ? 1800 : 32000,
    artifacts: 0,
    trophies: { weapons: 0, armor: 0, supplies: 4 },
    stash: campaignMode === "squad"
      ? { bandage: 2, ammo_crate: 1 }
      : { medkit: 3, bandage: 5, ammo_crate: 2, grenade_f1: 2, makarov: 1, leather_jacket: 1 },
    discoveredItems: ["medkit", "bandage", "ammo_crate", "grenade_f1", "makarov", "leather_jacket"],
    contracts: [],
    contractSequence: 1,
    nextContractRefreshAt: simMinute + 360,
    operations: [],
    operationSequence: 1,
    nextOperationAt: simMinute,
    nodes,
    squads,
    operatives,
    squadDiplomacy: {},
    squadKnowledge: {
      visitedSectorIds: knowledgeSectorId ? [knowledgeSectorId] : [],
      knownNodeIds: [...knownNodeIds],
      knownSquads,
      reports: [],
      conversations: [],
    },
    deceptionPlot: null,
    fieldDeals: [],
    fieldEventSequence: 1,
    nextSquadDiplomacyAt: simMinute + 24,
    factionFunds,
    relations,
    factionDiplomacy: initialFactionDiplomacy(relations, simMinute),
    reputation: 0,
    diplomacyMemory: initialDiplomacyMemory(playerFaction, relations, simMinute),
    factionSurvival: initialFactionSurvival(),
    factionStrategy: initialFactionStrategy(),
    diplomaticOffers: [],
    diplomaticOfferSequence: 1,
    nextDiplomacyAt: simMinute + 120,
    nextFactionDiplomacyAt: simMinute + 90,
    research: { weapons: 0, armor: 0, logistics: 0, medicine: 0, recon: 0, trade: 0 },
    selectedSquadId: playerSquadId ?? squads.find((squad) => squad.faction === playerFaction)?.id ?? null,
    selectedNodeId: playerSquadId ? squads.find((squad) => squad.id === playerSquadId)!.nodeId : playerBase.id,
    tacticalNodeId: null,
    tacticalTargetId: null,
    nextIncomeAt: simMinute + 30,
    nextAiAt: simMinute + 18,
    nextDirectiveAt: simMinute + 6,
    nextCaravanAt: simMinute + 75,
    nextMutantSpawnAt: simMinute + 90,
    worldEvents: [],
    worldEventSequence: 1,
    nextWorldEventAt: simMinute + 75,
    nextEmissionAt: simMinute + 360,
    emissionWarned: false,
    directives,
    alifeStats: {
      directivesIssued: 0,
      raidsStarted: 0,
      patrolsStarted: 0,
      caravansDispatched: 0,
      tradesCompleted: 0,
      mutantAttacks: 0,
      mutantSpawns: 0,
      shelterOrders: 0,
      emissionsSurvived: 0,
      fieldNegotiations: 0,
      fieldDeals: 0,
      defections: 0,
      betrayals: 0,
      worldEvents: 0,
      eventsResolved: 0,
      specimensRecovered: 0,
    },
    rngSeed: 0x5a17c9,
    log: [
      logEntry(simMinute, campaignMode === "squad"
        ? squadAllegiance
          ? `Тройка новичков группировки «${FACTIONS[playerFaction].name}» получила первый маршрут.`
          : "Трое нейтральных новичков вошли в Зону через Кордон. Денег и снаряжения почти нет."
        : `Канал связи установлен. Группировка «${FACTIONS[playerFaction].name}» готова к операции.`, "success"),
      logEntry(simMinute, campaignMode === "squad"
        ? "Начните с карты: выберите соседнюю точку. Чужой отряд откроет действия — подойти, поговорить или атаковать. Остальная Зона скрыта туманом войны."
        : "Выделите свой отряд и нажмите соседнюю точку, чтобы отдать приказ.", "system"),
    ],
    victory: false,
    defeat: false,
  };
  refreshDirectives(state);
  syncStrategicOperations(state, true);
  state.contracts = generateContracts(state, 3);
  return state;
}

function directiveOperationType(type: DirectiveType): OperationType | null {
  if (type === "manual") return null;
  return type;
}

function operationSucceeded(state: GameState, operation: StrategicOperation) {
  const target = operation.targetNodeId ? nodeById(state, operation.targetNodeId) : null;
  if (operation.type === "raid" || operation.type === "expansion") return target?.owner === operation.issuerFaction;
  if (operation.type === "defense") return Boolean(target && target.owner === operation.issuerFaction && state.simMinute >= operation.expiresAt);
  if (operation.type === "recovery") {
    const base = state.nodes.find((node) => node.baseFor === operation.issuerFaction);
    const combat = livingSquads(state).filter((squad) => squad.faction === operation.issuerFaction && squad.unitKind === "combat");
    const readiness = combat.length ? combat.reduce((sum, squad) => sum + squad.strength / Math.max(1, squad.maxStrength), 0) / combat.length : 0;
    return Boolean(base?.owner === operation.issuerFaction && readiness >= 0.72 && state.simMinute - operation.startedAt >= 60);
  }
  return false;
}

function operationFailed(state: GameState, operation: StrategicOperation) {
  const target = operation.targetNodeId ? nodeById(state, operation.targetNodeId) : null;
  if (operation.type === "defense" && target?.owner !== operation.issuerFaction) return true;
  return state.simMinute >= operation.expiresAt;
}

function syncStrategicOperations(state: GameState, force = false) {
  for (const operation of state.operations) {
    if (operation.status !== "planned" && operation.status !== "active") continue;
    operation.assignedSquadIds = livingSquads(state)
      .filter((squad) => squad.faction === operation.issuerFaction && squad.unitKind === "combat" && !squad.homeGarrison && (squad.missionTargetId === operation.targetNodeId || squad.nodeId === operation.targetNodeId))
      .map((squad) => squad.id);
    operation.status = operation.assignedSquadIds.length ? "active" : "planned";
    if (operationSucceeded(state, operation)) {
      operation.status = "succeeded";
      operation.resolvedAt = state.simMinute;
    } else if (operationFailed(state, operation)) {
      operation.status = "failed";
      operation.resolvedAt = state.simMinute;
    }
  }
  if (!force && state.simMinute < state.nextOperationAt) return;

  for (const faction of PLAYABLE_FACTIONS) {
    const directive = state.directives[faction];
    const type = directiveOperationType(directive?.type ?? "manual");
    if (!type || getFactionCondition(state, faction) === "destroyed") continue;
    const current = state.operations.find((operation) => operation.issuerFaction === faction && (operation.status === "planned" || operation.status === "active"));
    if (current && current.type === type && current.targetNodeId === directive.targetNodeId) continue;
    if (current) {
      current.status = operationSucceeded(state, current) ? "succeeded" : "failed";
      current.resolvedAt = state.simMinute;
    }
    const target = directive.targetNodeId ? nodeById(state, directive.targetNodeId) : null;
    const operation: StrategicOperation = {
      id: `operation-${state.operationSequence++}`,
      type,
      status: "planned",
      issuerFaction: faction,
      targetFaction: target?.owner && target.owner !== faction ? target.owner : null,
      targetNodeId: target?.id ?? null,
      assignedSquadIds: [],
      cause: directive.reason,
      startedAt: state.simMinute,
      expiresAt: state.simMinute + (type === "defense" ? 180 : 360),
      resolvedAt: null,
    };
    state.operations.push(operation);
  }
  state.operations = state.operations.filter((operation) => operation.status === "planned" || operation.status === "active" || state.simMinute - (operation.resolvedAt ?? state.simMinute) <= 720).slice(-40);
  state.nextOperationAt = state.simMinute + 30;
}

function contractHash(state: GameState, salt: number) {
  return Math.abs(Math.imul(state.rngSeed ^ (state.contractSequence + salt), 2654435761)) >>> 0;
}

function generateContracts(state: GameState, count: number): Contract[] {
  const result: Contract[] = [];
  const contractModifier = FACTION_PROFILES[state.playerFaction].economy.contracts;
  const excludePlayerFaction = state.campaignMode === "faction" || state.squadAllegiance !== null;
  const eligibleIssuers = PLAYABLE_FACTIONS.filter((faction) => (!excludePlayerFaction || faction !== state.playerFaction) && faction !== "monolith" && getFactionCondition(state, faction) !== "destroyed" && getRelation(state, state.playerFaction, faction) !== "war");
  const activeOperations = state.operations.filter((operation) => (operation.status === "planned" || operation.status === "active") && eligibleIssuers.includes(operation.issuerFaction));
  const contractibleOperations = activeOperations.filter((operation) => operation.type !== "recovery");
  const hostileFactions = (Object.keys(FACTIONS) as FactionId[]).filter((faction) =>
    faction !== state.playerFaction && state.squads.some((squad) => squad.faction === faction && squad.status !== "dead") && areHostile(state, state.playerFaction, faction),
  );
  const caravans = livingSquads(state).filter((squad) => squad.unitKind === "caravan" && squad.faction !== state.playerFaction && squad.faction !== "mutants" && eligibleIssuers.includes(squad.faction as PlayableFactionId));
  const specimenTargets = livingSquads(state).filter((squad) => squad.mutantType && MUTANT_PARTS[squad.mutantType]);
  const salvageEvents = state.worldEvents.filter((event) => event.type === "stash_signal" && event.status === "active");
  const usedOperationIds = new Set<string>();

  for (let slot = 0; slot < count; slot += 1) {
    const sequence = state.contractSequence++;
    const hash = contractHash(state, slot + sequence);
    const issuer = eligibleIssuers[hash % Math.max(1, eligibleIssuers.length)] ?? state.playerFaction;
    const unusedOperations = contractibleOperations.filter((item) => !usedOperationIds.has(item.id));
    const operation = unusedOperations[hash % Math.max(1, unusedOperations.length)] ?? null;
    const baseContract = {
      status: "offered" as const,
      progress: 0,
      expiresAt: state.simMinute + 360,
      acceptedAt: null,
      issuerFaction: operation?.issuerFaction ?? issuer,
      sourceOperationId: null,
      targetSquadId: null,
      lastProgressAt: state.simMinute,
      rewardItemId: null as ZoneItemId | null,
      requiredItemId: null as ZoneItemId | null,
      giverSquadId: null as string | null,
      briefedAt: null as number | null,
      negotiationClosed: false,
      declinedAt: null as number | null,
    };

    if (slot === count - 1) {
      const artifactOperation = contractibleOperations.find((item) => item.type === "artifacts" && !usedOperationIds.has(item.id));
      const scienceIssuer = artifactOperation?.issuerFaction ?? (["ecologists", "clear_sky", issuer] as PlayableFactionId[]).find((faction) => faction === state.playerFaction || eligibleIssuers.includes(faction)) ?? issuer;
      const goal = 2 + (hash % 4);
      result.push({
        ...baseContract,
        id: `contract-${sequence}-artifacts`,
        type: "artifacts",
        title: `Поставка артефактов: ${goal} шт.`,
        description: `Заказчик — «${FACTIONS[scienceIssuer].name}». Контракт засчитывает новые артефакты с контролируемых аномалий.`,
        targetNodeId: null,
        targetFaction: null,
        goal,
        reward: Math.round((7000 + goal * 2600) * contractModifier),
        issuerFaction: scienceIssuer,
        sourceOperationId: artifactOperation?.id ?? null,
        risk: "medium",
        reputationReward: 3,
      });
      if (artifactOperation) usedOperationIds.add(artifactOperation.id);
      continue;
    }

    if (salvageEvents.length && (sequence + slot) % 5 === 0) {
      const event = salvageEvents[hash % salvageEvents.length];
      const target = nodeById(state, event.nodeId)!;
      result.push({
        ...baseContract, id: `contract-${sequence}-salvage-${event.id}`, type: "salvage", title: `Извлечь тайник: ${target.name}`,
        description: `Сигнал подтверждён реальным событием. Зачистите точку «${target.name}» и удерживайте её до вскрытия контейнера.`,
        targetNodeId: target.id, targetFaction: target.owner, goal: 1, reward: Math.round((6200 + target.income * 3) * contractModifier), risk: event.severity === 3 ? "high" : "medium",
        reputationReward: 4, rewardItemId: event.severity === 3 ? "vintorez" : "army_medkit",
      });
      continue;
    }

    if (specimenTargets.length && (sequence + slot) % 4 === 1) {
      const target = specimenTargets[hash % specimenTargets.length];
      const part = MUTANT_PARTS[target.mutantType!]!;
      const dangerous = ["controller", "burer", "chimera", "pseudogiant"].includes(target.mutantType!);
      result.push({
        ...baseContract, id: `contract-${sequence}-specimen-${target.id}`, type: "specimen", title: `Добыть образец: ${ZONE_ITEMS[part].name}`,
        description: `Экологи отметили конкретную угрозу «${target.name}» у точки «${nodeById(state, target.nodeId)?.name}». Нужен неповреждённый биоматериал.`,
        targetNodeId: target.nodeId, targetFaction: "mutants", targetSquadId: target.id, requiredItemId: part, goal: 1,
        reward: Math.round((dangerous ? 16800 : 7600) * contractModifier), issuerFaction: eligibleIssuers.includes("ecologists") ? "ecologists" : baseContract.issuerFaction,
        risk: dangerous ? "high" : "medium", reputationReward: dangerous ? 6 : 4, rewardItemId: dangerous ? "antirad" : null,
      });
      continue;
    }

    if (caravans.length && (sequence + slot) % 4 === 0) {
      const caravan = caravans[hash % caravans.length];
      const destination = caravan.missionTargetId ? nodeById(state, caravan.missionTargetId) : null;
      result.push({
        ...baseContract,
        id: `contract-${sequence}-escort-${caravan.id}`,
        type: "escort",
        title: `Провести караван «${caravan.name}»`,
        description: `Охрана должна встретить караван и находиться рядом при доставке груза в «${destination?.name ?? "пункт назначения"}».`,
        targetNodeId: destination?.id ?? null,
        targetFaction: caravan.faction,
        targetSquadId: caravan.id,
        goal: 1,
        reward: Math.round((8200 + caravan.cargo * 0.32) * contractModifier),
        issuerFaction: caravan.faction as PlayableFactionId,
        risk: "medium",
        reputationReward: 4,
      });
      continue;
    }

    if (operation?.type === "defense" && operation.targetNodeId) {
      const target = nodeById(state, operation.targetNodeId)!;
      result.push({
        ...baseContract,
        id: `contract-${sequence}-defend-${target.id}`,
        type: "defend",
        title: `Удержать рубеж «${target.name}»`,
        description: `«${FACTIONS[operation.issuerFaction].name}» ожидает нападения. Ваш отряд должен удерживать точку 90 игровых минут.`,
        targetNodeId: target.id,
        targetFaction: operation.targetFaction,
        sourceOperationId: operation.id,
        goal: 90,
        reward: Math.round((9000 + target.income * 5) * contractModifier),
        risk: "high",
        reputationReward: 6,
      });
      usedOperationIds.add(operation.id);
      continue;
    }

    if (operation && (operation.type === "raid" || operation.type === "expansion") && operation.targetNodeId) {
      const target = nodeById(state, operation.targetNodeId)!;
      result.push({
        ...baseContract,
        id: `contract-${sequence}-capture-${target.id}`,
        type: "capture",
        title: `Сорвать контроль над точкой «${target.name}»`,
        description: `Операция группировки «${FACTIONS[operation.issuerFaction].name}»: ${operation.cause}. Цель должна перейти под ваш контроль.`,
        targetNodeId: target.id,
        targetFaction: target.owner,
        sourceOperationId: operation.id,
        goal: 1,
        reward: Math.round((7200 + target.income * 4.8) * contractModifier),
        risk: target.type === "base" ? "high" : "medium",
        reputationReward: 5,
      });
      usedOperationIds.add(operation.id);
      continue;
    }

    const parleyTargets = eligibleIssuers.filter((faction) => {
      const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
      return getRelation(state, state.playerFaction, faction) !== "war" && bilateral.tension >= 28;
    });
    if (parleyTargets.length && (sequence + slot) % 3 === 0) {
      const targetFaction = parleyTargets[hash % parleyTargets.length];
      result.push({
        ...baseContract,
        id: `contract-${sequence}-parley-${targetFaction}`,
        type: "parley",
        title: `Установить полевой контакт: ${FACTIONS[targetFaction].name}`,
        description: "Сведите свой мобильный отряд с их группой на одной точке. Командиры должны заключить местное соглашение без вмешательства штабов.",
        targetNodeId: null,
        targetFaction,
        goal: 1,
        reward: Math.round(7600 * contractModifier),
        issuerFaction: targetFaction,
        risk: "medium",
        reputationReward: 5,
      });
      continue;
    }

    if (hostileFactions.length) {
      const targetFaction = hostileFactions[hash % hostileFactions.length];
      const goal = 1 + (hash % 2);
      result.push({
        ...baseContract,
        id: `contract-${sequence}-eliminate-${targetFaction}`,
        type: "eliminate",
        title: `Сорвать операцию: ${FACTIONS[targetFaction].name}`,
        description: `Заказчик — «${FACTIONS[baseContract.issuerFaction].name}». Уничтожить ${goal} ${goal === 1 ? "боевую группу" : "боевые группы"} противника.`,
        targetNodeId: null,
        targetFaction,
        goal,
        reward: Math.round((10500 + goal * 4500) * contractModifier),
        risk: "high",
        reputationReward: 5,
      });
      continue;
    }

    const eligibleTargets = state.nodes.filter((node) => node.mapLevel !== "sector" && !node.baseFor && node.owner !== state.playerFaction).sort((a, b) => b.income - a.income);
    const target = eligibleTargets[hash % Math.max(1, eligibleTargets.length)] ?? state.nodes.find((node) => !node.baseFor)!;
    result.push({
      ...baseContract,
      id: `contract-${sequence}-capture-${target.id}`,
      type: "capture",
      title: `Занять точку «${target.name}»`,
      description: `«${FACTIONS[baseContract.issuerFaction].name}» платит за смену контроля в секторе ${getSectorForNode(target.id)?.name ?? "Зона"}.`,
      targetNodeId: target.id,
      targetFaction: target.owner,
      goal: 1,
      reward: Math.round((6500 + target.income * 4.5) * contractModifier),
      risk: "medium",
      reputationReward: 4,
    });
  }
  for (const contract of result) {
    const candidates = livingSquads(state).filter((squad) => squad.faction === contract.issuerFaction && squad.unitKind === "combat" && Boolean(squad.commander));
    if (!candidates.length) continue;
    const playerNode = state.playerSquadId ? nodeById(state, state.squads.find((squad) => squad.id === state.playerSquadId)?.nodeId ?? "") : null;
    const nearby = playerNode?.sectorId ? candidates.filter((squad) => nodeById(state, squad.nodeId)?.sectorId === playerNode.sectorId) : [];
    const pool = nearby.length ? nearby : candidates;
    contract.giverSquadId = pool[contractHash(state, contract.id.length) % pool.length].id;
  }
  return result;
}

function completeContract(state: GameState, contract: Contract) {
  if (contract.status !== "active") return;
  contract.status = "completed";
  contract.progress = contract.goal;
  state.rubles += contract.reward;
  state.factionFunds[state.playerFaction] += contract.reward;
  state.reputation = clampDiplomacy(state.reputation + contract.reputationReward);
  if (contract.rewardItemId) addStashItem(state, contract.rewardItemId);
  if (contract.issuerFaction !== state.playerFaction) {
    adjustFactionMemory(state, contract.issuerFaction, { trust: contract.reputationReward + 2, grievance: -4, aidReceived: 1 });
    adjustBilateralDiplomacy(state, state.playerFaction, contract.issuerFaction, { trust: 5, cooperation: 8, tension: -4 });
  }
  const giver = contract.giverSquadId ? state.squads.find((squad) => squad.id === contract.giverSquadId && squad.status !== "dead") : null;
  const player = state.playerSquadId ? state.squads.find((squad) => squad.id === state.playerSquadId && squad.status !== "dead") : null;
  if (giver && player && giver.faction !== "mutants") {
    const memory = ensureSquadDiplomacy(state, player, giver);
    memory.trust = clampDiplomacy(memory.trust + 14 + contract.reputationReward);
    memory.respect = clampPressure(memory.respect + 10);
    memory.grievance = clampPressure(memory.grievance - 6);
    memory.lastContactAt = state.simMinute;
  }
  if (contract.sourceOperationId) {
    const operation = state.operations.find((item) => item.id === contract.sourceOperationId);
    if (operation && (operation.status === "planned" || operation.status === "active")) {
      operation.status = "succeeded";
      operation.resolvedAt = state.simMinute;
    }
  }
  const itemReward = contract.rewardItemId ? `, предмет «${ZONE_ITEMS[contract.rewardItemId].name}»` : "";
  addLog(state, `Контракт выполнен: «${contract.title}». Выплата +${contract.reward.toLocaleString("ru-RU")} ₽${itemReward}.`, "success");
}

function failContract(state: GameState, contract: Contract, reason: string) {
  if (contract.status !== "active") return;
  contract.status = "failed";
  state.reputation = clampDiplomacy(state.reputation - 2);
  if (contract.issuerFaction !== state.playerFaction) {
    adjustFactionMemory(state, contract.issuerFaction, { trust: -4, grievance: 4 });
    adjustBilateralDiplomacy(state, state.playerFaction, contract.issuerFaction, { trust: -2, tension: 2, cooperation: -3 });
  }
  addLog(state, `Контракт провален: «${contract.title}». ${reason}`, "danger");
}

function advanceContracts(state: GameState, type: ContractType, amount: number, target?: string) {
  for (const contract of state.contracts) {
    if (contract.status !== "active" || contract.type !== type) continue;
    if (type === "capture" && contract.targetNodeId !== target) continue;
    if (type === "eliminate" && contract.targetFaction !== target) continue;
    if (type === "escort" && contract.targetSquadId !== target) continue;
    if (type === "parley" && contract.targetFaction !== target) continue;
    if (type === "specimen" && contract.requiredItemId !== target) continue;
    if (type === "salvage" && contract.targetNodeId !== target) continue;
    contract.progress = Math.min(contract.goal, contract.progress + amount);
    if (contract.progress >= contract.goal) completeContract(state, contract);
  }
}

function maintainContracts(state: GameState) {
  for (const contract of state.contracts) {
    if (contract.status !== "active") continue;
    if (contract.type === "defend" && contract.targetNodeId) {
      const target = nodeById(state, contract.targetNodeId);
      if (!target || (target.owner !== contract.issuerFaction && target.owner !== state.playerFaction)) {
        failContract(state, contract, "Обороняемая точка потеряна.");
        continue;
      }
      const elapsed = Math.max(0, Math.min(12, state.simMinute - contract.lastProgressAt));
      contract.lastProgressAt = state.simMinute;
      const playerPresent = livingSquads(state, target.id).some((squad) => squad.faction === state.playerFaction && squad.unitKind === "combat" && squad.status !== "moving");
      if (playerPresent) {
        contract.progress = Math.min(contract.goal, contract.progress + elapsed);
        if (contract.progress >= contract.goal) completeContract(state, contract);
      }
    }
    if (contract.type === "escort" && contract.targetSquadId) {
      const caravan = state.squads.find((squad) => squad.id === contract.targetSquadId);
      if (!caravan || caravan.status === "dead") {
        failContract(state, contract, "Охраняемый караван уничтожен.");
        continue;
      }
    }
    if (contract.status === "active" && state.simMinute >= contract.expiresAt) failContract(state, contract, "Срок операции истёк.");
  }
  if (state.simMinute < state.nextContractRefreshAt) return;
  const retained = state.contracts.filter((contract) => contract.status === "active" || contract.status === "completed" || contract.status === "failed").slice(-7);
  state.contracts = [...retained, ...generateContracts(state, 3)];
  state.nextContractRefreshAt = state.simMinute + 360;
  addLog(state, "На доске заказов появились новые контракты.", "system");
}

export function acceptContract(previous: GameState, contractId: string): GameState {
  const activeLimit = 1 + previous.research.logistics;
  if (previous.contracts.filter((contract) => contract.status === "active").length >= activeLimit) return previous;
  const contract = previous.contracts.find((item) => item.id === contractId);
  if (!contract || contract.status !== "offered") return previous;
  if (previous.campaignMode === "squad") {
    const player = previous.squads.find((squad) => squad.id === previous.playerSquadId);
    const giver = previous.squads.find((squad) => squad.id === contract.giverSquadId && squad.status !== "dead");
    if (!player || !giver || player.nodeId !== giver.nodeId || contract.briefedAt === null || contract.declinedAt !== null) return previous;
  }
  const state = { ...previous, contracts: previous.contracts.map((item) => ({ ...item })), log: [...previous.log] };
  const accepted = state.contracts.find((item) => item.id === contractId)!;
  accepted.status = "active";
  accepted.acceptedAt = state.simMinute;
  accepted.expiresAt = state.simMinute + 360;
  accepted.lastProgressAt = state.simMinute;
  addLog(state, `Принят контракт: «${accepted.title}».`, "system");
  return state;
}

export function getSquadUpkeep(squad: Squad) {
  if (squad.faction === "mutants" || squad.status === "dead") return 0;
  const upkeepModifier = FACTION_PROFILES[squad.faction].economy.upkeep;
  if (squad.unitKind === "caravan") return Math.round(220 * upkeepModifier);
  const rankCost = squad.rank === "Мастера" ? 1700 : squad.rank === "Ветераны" ? 1100 : squad.rank === "Опытные" ? 800 : 450;
  const fullCost = rankCost + squad.weaponTier * 120 + squad.armorTier * 140;
  const baseFighters = getSquadArchetype(squad)?.fighters ?? Math.max(1, squad.maxFighters ?? squad.fighters);
  const sizeFactor = Math.max(0.5, (squad.maxFighters ?? squad.fighters) / Math.max(1, baseFighters));
  return Math.round(fullCost * upkeepModifier * sizeFactor * (squad.homeGarrison ? 0.08 : 1));
}

export function getSquadStrengthPercent(squad: Squad) {
  return Math.round(Math.max(0, Math.min(100, (squad.strength / Math.max(1, squad.maxStrength)) * 100)));
}

function applySquadDamage(squad: Squad, damage: number, state?: GameState) {
  const before = squad.fighters;
  squad.strength = Math.max(0, squad.strength - Math.max(0, damage));
  const maxFighters = Math.max(1, squad.maxFighters ?? squad.fighters);
  const projected = squad.strength <= 0 ? 0 : Math.max(1, Math.ceil(maxFighters * (squad.strength / Math.max(1, squad.maxStrength))));
  squad.fighters = Math.min(squad.fighters, projected);
  const casualties = Math.max(0, before - squad.fighters);
  squad.morale = Math.max(0, (squad.morale ?? 60) - damage * 0.08 - casualties * 4);
  if (state && state.campaignMode === "squad" && squad.id === state.playerSquadId && state.operatives.length) {
    const available = state.operatives
      .filter((operative) => operative.squadId === squad.id && operative.condition !== "dead" && operative.condition !== "left")
      .sort((left, right) => left.experience - right.experience || left.health - right.health);
    for (const fallen of available.slice(0, casualties)) {
      fallen.health = 0;
      fallen.condition = "dead";
      fallen.order = "idle";
      fallen.destinationX = null;
      fallen.destinationY = null;
      addLog(state, `${fallen.callsign} погиб. В отряде осталось ${Math.max(0, before - casualties)} человек.`, "danger");
    }
    const survivor = available[casualties];
    if (survivor && damage >= 4) {
      survivor.health = Math.max(1, survivor.health - Math.min(32, damage * 1.35));
      survivor.condition = survivor.health < 35 ? "critical" : survivor.health < 70 ? "wounded" : "healthy";
      survivor.morale = Math.max(0, survivor.morale - damage * .22 - casualties * 8);
    }
  }
  if (state && casualties > 0 && squad.faction !== "mutants") {
    const strategy = state.factionStrategy[squad.faction];
    strategy.casualties += casualties;
    const casualtyShock = squad.faction === "monolith" ? .28 : .72;
    strategy.warWeariness = Math.min(100, strategy.warWeariness + casualties * casualtyShock);
  }
  return casualties;
}

function resolveCommanderCasualty(state: GameState, squad: Squad, casualties: number) {
  if (!squad.commander || squad.faction === "mutants" || squad.status === "dead" || casualties <= 0 || squad.fighters <= 0) return;
  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  const exposure = casualties / Math.max(1, squad.maxFighters) * (squad.commander.disposition === "ambitious" || squad.commander.disposition === "fanatic" ? 0.42 : 0.26);
  if (roll.value >= exposure) return;
  const fallen = squad.commander;
  const successor = makeCommander(squad.faction as PlayableFactionId, squad.nodeId, state.fieldEventSequence++ + stableHash(squad.id), squad.rank, squad.homeGarrison);
  successor.background = "survivor";
  successor.experience = Math.max(38, Math.round((successor.experience + fallen.experience) * 0.44));
  successor.loyalty = Math.max(35, successor.loyalty - 8);
  squad.commander = successor;
  squad.morale = Math.max(0, squad.morale - 14);
  addLog(state, `Командир ${fallen.name} погиб. Отряд «${squad.name}» возглавил ${successor.name}; мораль подразделения упала.`, squad.faction === state.playerFaction ? "danger" : "system");
}

function transferFieldFunds(state: GameState, payer: PlayableFactionId, receiver: PlayableFactionId, requested: number) {
  const available = Math.max(0, Math.min(requested, state.factionFunds[payer]));
  if (!available) return 0;
  state.factionFunds[payer] -= available;
  state.factionFunds[receiver] += available;
  if (payer === state.playerFaction) state.rubles = Math.max(0, state.rubles - available);
  if (receiver === state.playerFaction) state.rubles += available;
  return available;
}

function fieldWithdrawal(state: GameState, squad: Squad) {
  if (squad.homeGarrison || squad.status === "moving") return false;
  const fallback = nearestNode(state, squad.nodeId, (node) => node.id !== squad.nodeId && node.owner === squad.faction && node.mapLevel !== "sector");
  if (!fallback) return false;
  return beginMission(state, squad, "defend", fallback.node.id, fallback.path);
}

function registerFieldDeal(state: GameState, type: FieldDealType, left: Squad, right: Squad, initiator: Squad, duration: number, value = 0) {
  const memory = ensureSquadDiplomacy(state, left, right);
  const commanders = [left.commander!, right.commander!];
  const minimumHonor = Math.min(...commanders.map((commander) => commander.honor));
  const maximumAmbition = Math.max(...commanders.map((commander) => commander.ambition));
  const war = getRelation(state, left.faction, right.faction) === "war";
  const culturalBetrayal = (FACTION_CULTURES[left.faction as PlayableFactionId].betrayalBias + FACTION_CULTURES[right.faction as PlayableFactionId].betrayalBias) / 2;
  const betrayalRisk = Math.round(clamp((100 - minimumHonor) * 0.42 + maximumAmbition * 0.16 + culturalBetrayal + (war ? 8 : 0) - memory.trust * 0.08, 1, 82));
  const deal: FieldDeal = {
    id: `field-${state.fieldEventSequence++}`,
    type,
    status: "active",
    leftSquadId: left.id,
    rightSquadId: right.id,
    nodeId: left.nodeId,
    startedAt: state.simMinute,
    expiresAt: state.simMinute + duration,
    value,
    betrayalRisk,
    betrayalChecked: !war,
    initiatorSquadId: initiator.id,
  };
  state.fieldDeals.push(deal);
  memory.deals += 1;
  memory.trust = clampDiplomacy(memory.trust + (type === "bribe" ? 2 : 7));
  memory.respect = clampPressure(memory.respect + 4);
  memory.grievance = clampPressure(memory.grievance - (type === "local_truce" ? 8 : 3));
  memory.lastContactAt = state.simMinute;
  memory.nextContactAt = deal.expiresAt + 60;
  for (const commander of commanders) {
    commander.deals += 1;
    commander.experience = clampPressure(commander.experience + 1);
  }
  state.alifeStats.fieldDeals += 1;
  const leftFaction = left.faction as PlayableFactionId;
  const rightFaction = right.faction as PlayableFactionId;
  adjustBilateralDiplomacy(state, leftFaction, rightFaction, { trust: type === "local_truce" ? 2 : 1, tension: type === "bribe" ? -2 : -4, cooperation: 2 });

  if (type === "supplies") {
    const receiver = left.ammo / Math.max(1, left.maxAmmo) <= right.ammo / Math.max(1, right.maxAmmo) ? left : right;
    const provider = receiver.id === left.id ? right : left;
    receiver.ammo = Math.min(receiver.maxAmmo, receiver.ammo + Math.max(12, Math.round(receiver.maxAmmo * 0.28)));
    receiver.medkits += 1;
    provider.ammo = Math.max(0, provider.ammo - Math.min(10, provider.ammo));
  } else if (type === "intelligence") {
    left.xp += 5;
    right.xp += 5;
  }

  if (left.faction === state.playerFaction || right.faction === state.playerFaction) {
    const other = left.faction === state.playerFaction ? right : left;
    if (other.faction !== "mutants") advanceContracts(state, "parley", 1, other.faction);
  }
  if (type === "local_truce" || type === "bribe" || left.faction === state.playerFaction || right.faction === state.playerFaction) {
    const valueText = value ? ` за ${value.toLocaleString("ru-RU")} ₽` : "";
    addLog(state, `Полевой контакт у «${nodeById(state, left.nodeId)?.name}»: ${left.commander?.callsign} и ${right.commander?.callsign} заключили ${FIELD_DEAL_LABELS[type]}${valueText}.`, type === "bribe" ? "system" : "success");
  }
  return deal;
}

function defectSquad(state: GameState, squad: Squad, destinationFaction: PlayableFactionId, sponsor: Squad) {
  if (!squad.commander || squad.homeGarrison || squad.unitKind !== "combat" || squad.faction === "mutants" || squad.faction === destinationFaction) return false;
  const oldFaction = squad.faction as PlayableFactionId;
  squad.commander.previousFaction = oldFaction;
  squad.commander.background = "defector";
  squad.commander.loyalty = 48;
  squad.commander.autonomy = Math.min(100, squad.commander.autonomy + 8);
  squad.faction = destinationFaction;
  squad.archetypeId = FACTION_PROFILES[destinationFaction].roster[rosterRank(squad.rank)].id;
  squad.name = `Группа «${squad.commander.callsign}»`;
  squad.mission = destinationFaction === state.playerFaction ? "player" : "hold";
  squad.missionTargetId = null;
  squad.missionPath = [];
  squad.status = "idle";
  squad.morale = Math.max(44, squad.morale);
  resetTacticalPosition(squad, state.playerFaction);
  adjustBilateralDiplomacy(state, oldFaction, destinationFaction, { trust: -12, tension: 20, cooperation: -8, incidents: 1 });
  const memory = ensureSquadDiplomacy(state, squad, sponsor);
  memory.trust = 28;
  memory.grievance = 0;
  memory.nextContactAt = state.simMinute + 240;
  state.alifeStats.defections += 1;
  if (oldFaction === state.playerFaction && state.selectedSquadId === squad.id) state.selectedSquadId = null;
  addLog(state, `ПРЕДАТЕЛЬСТВО: ${squad.commander.name} увёл ${squad.fighters} бойцов из «${FACTIONS[oldFaction].name}» к группировке «${FACTIONS[destinationFaction].name}».`, oldFaction === state.playerFaction ? "danger" : destinationFaction === state.playerFaction ? "success" : "system");
  return true;
}

function maintainFieldDeals(state: GameState) {
  for (const deal of state.fieldDeals) {
    if (deal.status !== "active") continue;
    const left = state.squads.find((squad) => squad.id === deal.leftSquadId);
    const right = state.squads.find((squad) => squad.id === deal.rightSquadId);
    if (!left || !right || left.status === "dead" || right.status === "dead") {
      deal.status = "expired";
      continue;
    }
    if (left.nodeId !== right.nodeId) {
      deal.status = "honored";
      const memory = ensureSquadDiplomacy(state, left, right);
      memory.trust = clampDiplomacy(memory.trust + 3);
      memory.respect = clampPressure(memory.respect + 2);
      continue;
    }
    if (state.simMinute >= deal.expiresAt) {
      deal.status = "honored";
      continue;
    }
    if (deal.betrayalChecked || state.simMinute < deal.startedAt + 18 || deal.type !== "local_truce" && deal.type !== "bribe") continue;
    deal.betrayalChecked = true;
    const roll = randomStep(state.rngSeed);
    state.rngSeed = roll.seed;
    if (roll.value * 100 >= deal.betrayalRisk) continue;
    const leftScore = (left.commander?.honor ?? 100) + (left.commander?.loyalty ?? 100) * 0.18 - (left.commander?.ambition ?? 0) * 0.2;
    const rightScore = (right.commander?.honor ?? 100) + (right.commander?.loyalty ?? 100) * 0.18 - (right.commander?.ambition ?? 0) * 0.2;
    const betrayer = leftScore <= rightScore ? left : right;
    const victim = betrayer.id === left.id ? right : left;
    const surpriseDamage = 8 + (betrayer.commander?.ambition ?? 40) * 0.12 + betrayer.attack * 0.35;
    const casualties = applySquadDamage(victim, surpriseDamage, state);
    resolveCommanderCasualty(state, victim, casualties);
    victim.suppression = Math.min(100, victim.suppression + 34);
    victim.morale = Math.max(0, victim.morale - 12);
    if (victim.strength <= 0) victim.status = "dead";
    deal.status = "broken";
    if (betrayer.commander) betrayer.commander.betrayals += 1;
    const memory = ensureSquadDiplomacy(state, left, right);
    memory.betrayals += 1;
    memory.trust = clampDiplomacy(memory.trust - 45);
    memory.grievance = clampPressure(memory.grievance + 55);
    memory.nextContactAt = state.simMinute + 360;
    state.alifeStats.betrayals += 1;
    adjustBilateralDiplomacy(state, betrayer.faction as PlayableFactionId, victim.faction as PlayableFactionId, { trust: -12, tension: 18, incidents: 1 });
    addLog(state, `Срыв переговоров у «${nodeById(state, deal.nodeId)?.name}»: ${betrayer.commander?.name} нарушил ${FIELD_DEAL_LABELS[deal.type]} и ударил первым.`, victim.faction === state.playerFaction ? "danger" : "system");
  }
  state.fieldDeals = state.fieldDeals.filter((deal) => deal.status === "active" || state.simMinute - deal.startedAt <= 720).slice(-48);
}

function updateCommanderLoyalty(state: GameState, squad: Squad) {
  const commander = squad.commander;
  if (!commander || squad.faction === "mutants" || squad.status === "dead") return;
  let change = 0;
  const node = nodeById(state, squad.nodeId);
  if (node?.owner === squad.faction) change += 1;
  if (squad.morale < 35) change -= 2;
  else if (squad.morale < 52) change -= 1;
  if (squad.ammo <= 0 && squad.unitKind === "combat") change -= 1;
  if (getFactionCondition(state, squad.faction as PlayableFactionId) === "remnant") change -= 2;
  if (commander.disposition === "fanatic") change += 1;
  if (commander.disposition === "greedy" && state.factionFunds[squad.faction] < 4500) change -= 1;
  commander.loyalty = clampPressure(commander.loyalty + change);
}

function resolveSquadDiplomacy(state: GameState) {
  maintainFieldDeals(state);
  if (state.simMinute < state.nextSquadDiplomacyAt) return;
  for (const squad of livingSquads(state).filter((item) => item.faction !== "mutants")) updateCommanderLoyalty(state, squad);
  const stationary = livingSquads(state).filter((squad) => squad.faction !== "mutants" && squad.commander && squad.status !== "moving");
  const byNode = new Map<string, Squad[]>();
  for (const squad of stationary) byNode.set(squad.nodeId, [...(byNode.get(squad.nodeId) ?? []), squad]);

  for (const groups of byNode.values()) {
    for (let leftIndex = 0; leftIndex < groups.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < groups.length; rightIndex += 1) {
        const left = groups[leftIndex];
        const right = groups[rightIndex];
        if (left.faction === right.faction || activePairDeal(state, left, right) || left.faction === "monolith" || right.faction === "monolith") continue;
        const memory = ensureSquadDiplomacy(state, left, right);
        if (memory.nextContactAt > state.simMinute) continue;
        const relation = getRelation(state, left.faction, right.faction);
        const firstRoll = randomStep(state.rngSeed);
        state.rngSeed = firstRoll.seed;
        const leftCommander = left.commander!;
        const rightCommander = right.commander!;
        const exhaustion = (200 - left.morale - right.morale) * 0.22;
        const diplomacy = (leftCommander.negotiation + rightCommander.negotiation) * 0.45 + exhaustion + memory.respect * 0.12;
        const fanaticPenalty = (leftCommander.disposition === "fanatic" ? 45 : 0) + (rightCommander.disposition === "fanatic" ? 45 : 0);
        const culturalContact = (FACTION_CULTURES[left.faction as PlayableFactionId].contactBias + FACTION_CULTURES[right.faction as PlayableFactionId].contactBias) / 2;
        const contactScore = diplomacy + culturalContact - fanaticPenalty + firstRoll.value * 55;
        memory.encounters += 1;
        memory.lastContactAt = state.simMinute;
        state.alifeStats.fieldNegotiations += 1;

        if (relation === "war") {
          const leftPower = getSquadIntel(left).combatPower;
          const rightPower = getSquadIntel(right).combatPower;
          const weaker = leftPower <= rightPower ? left : right;
          const stronger = weaker.id === left.id ? right : left;
          const defectionRoll = randomStep(state.rngSeed);
          state.rngSeed = defectionRoll.seed;
          if (!weaker.homeGarrison && weaker.unitKind === "combat" && weaker.commander!.loyalty <= 22 && weaker.morale <= 34 && defectionRoll.value < 0.42 + weaker.commander!.ambition / 300) {
            defectSquad(state, weaker, stronger.faction as PlayableFactionId, stronger);
            memory.nextContactAt = state.simMinute + 360;
            continue;
          }
          if (contactScore < 92) {
            memory.nextContactAt = state.simMinute + 72;
            continue;
          }
          const culture = FACTION_CULTURES[stronger.faction as PlayableFactionId];
          const wantsPayment = stronger.commander!.disposition === "greedy" || stronger.commander!.honor < 38 || culture.bribeBias >= 15;
          const requested = Math.round(450 + stronger.commander!.negotiation * 14 + Math.max(0, stronger.fighters - weaker.fighters) * 90);
          let paid = 0;
          if (wantsPayment && weaker.faction !== "mutants" && stronger.faction !== "mutants") paid = transferFieldFunds(state, weaker.faction as PlayableFactionId, stronger.faction as PlayableFactionId, requested);
          registerFieldDeal(state, paid ? "bribe" : "local_truce", left, right, weaker, paid ? 150 : 110, paid);
          fieldWithdrawal(state, weaker);
          continue;
        }

        if (contactScore < (relation === "alliance" ? 56 : 78)) {
          memory.nextContactAt = state.simMinute + 90;
          continue;
        }
        const playerAutonomyBlocked = (left.faction === state.playerFaction && leftCommander.autonomy < 60) || (right.faction === state.playerFaction && rightCommander.autonomy < 60);
        const needsSupplies = left.ammo < left.maxAmmo * 0.45 || right.ammo < right.maxAmmo * 0.45 || left.unitKind === "caravan" || right.unitKind === "caravan";
        const ownedNode = nodeById(state, left.nodeId)?.owner;
        const leftCulture = FACTION_CULTURES[left.faction as PlayableFactionId];
        const rightCulture = FACTION_CULTURES[right.faction as PlayableFactionId];
        let type: FieldDealType = relation === "alliance" ? "intelligence" : ownedNode === left.faction || ownedNode === right.faction ? "passage" : "intelligence";
        let value = 0;
        const criminalContact = left.faction === "bandits" || left.faction === "renegades" || right.faction === "bandits" || right.faction === "renegades";
        if (criminalContact && relation !== "alliance" && Math.max(leftCulture.bribeBias, rightCulture.bribeBias) >= 18) {
          const richer = state.factionFunds[left.faction] >= state.factionFunds[right.faction] ? left : right;
          const poorer = richer.id === left.id ? right : left;
          value = transferFieldFunds(state, poorer.faction as PlayableFactionId, richer.faction as PlayableFactionId, 280 + Math.round(richer.commander!.negotiation * 4));
          type = value ? "bribe" : "intelligence";
        } else if (needsSupplies && !playerAutonomyBlocked) {
          type = "supplies";
          const receiver = left.ammo / Math.max(1, left.maxAmmo) <= right.ammo / Math.max(1, right.maxAmmo) ? left : right;
          const provider = receiver.id === left.id ? right : left;
          value = transferFieldFunds(state, receiver.faction as PlayableFactionId, provider.faction as PlayableFactionId, 320 + Math.round(provider.commander!.negotiation * 5));
          if (!value) type = "intelligence";
        }
        registerFieldDeal(state, type, left, right, leftCommander.negotiation >= rightCommander.negotiation ? left : right, type === "passage" ? 150 : 90, value);
      }
    }
  }
  state.nextSquadDiplomacyAt = state.simMinute + 18;
}

function controlledStrategicNodes(state: GameState, faction: PlayableFactionId) {
  return state.nodes.filter((node) => node.owner === faction && node.mapLevel !== "sector");
}

function activeWarCount(state: GameState, faction: PlayableFactionId) {
  return PLAYABLE_FACTIONS.filter((other) => other !== faction && getFactionCondition(state, other) !== "destroyed" && getRelation(state, faction, other) === "war").length;
}

function factionManpowerCap(state: GameState, faction: PlayableFactionId) {
  const controlled = controlledStrategicNodes(state, faction);
  const bases = controlled.filter((node) => node.type === "base").length;
  const settlements = controlled.filter((node) => node.type === "camp").length;
  const secureTerritory = controlled.reduce((sum, node) => sum + (node.security ?? 100) / 100, 0);
  const tradePartners = PLAYABLE_FACTIONS.filter((other) => other !== faction && getBilateralDiplomacy(state, faction, other).tradePact && getRelation(state, faction, other) !== "war").length;
  return Math.max(12, Math.round(18 + bases * 22 + settlements * 8 + secureTerritory * 1.5 + tradePartners * 3));
}

function factionMobilization(state: GameState, faction: PlayableFactionId): MobilizationLevel {
  const condition = getFactionCondition(state, faction);
  const wars = activeWarCount(state, faction);
  const base = state.nodes.find((node) => node.baseFor === faction);
  const baseThreatened = Boolean(base && (base.owner !== faction || livingSquads(state, base.id).some((squad) => areHostile(state, faction, squad.faction))));
  if (condition === "remnant" || baseThreatened) return "emergency";
  if (wars >= 1) return "full";
  if (state.directives?.[faction]?.type === "expansion" || state.directives?.[faction]?.type === "raid") return "limited";
  return "peace";
}

export const MOBILIZATION_LABELS: Record<MobilizationLevel, string> = {
  peace: "МИРНЫЙ ШТАТ",
  limited: "ОГРАНИЧЕННАЯ",
  full: "ПОЛНАЯ",
  emergency: "АВАРИЙНАЯ",
};

export function getFactionBalanceSummary(state: GameState, faction: PlayableFactionId = state.playerFaction): FactionBalanceSummary {
  const strategy = state.factionStrategy?.[faction] ?? initialFactionStrategy()[faction];
  const controlled = controlledStrategicNodes(state, faction);
  const combatSquads = livingSquads(state).filter((squad) => squad.faction === faction && squad.unitKind === "combat" && !squad.homeGarrison).length;
  const activeWars = activeWarCount(state, faction);
  const mobilization = factionMobilization(state, faction);
  const logisticsResearch = faction === state.playerFaction ? state.research.logistics : 0;
  const territorialBonus = Math.floor(Math.max(0, controlled.length - 4) / 7);
  const mobilizationBonus = mobilization === "emergency" ? 1 : 0;
  const baseArmyLimit = faction === state.playerFaction ? 4 : FACTION_PROFILES[faction].strategy.forceLimit;
  const armyLimit = Math.max(2, Math.min(10, baseArmyLimit + territorialBonus + logisticsResearch * 2 + mobilizationBonus));
  const administrativeCapacity = 5 + combatSquads * 2 + logisticsResearch * 3 + (controlled.some((node) => node.baseFor === faction) ? 3 : 0);
  const overextension = Math.max(0, controlled.length - administrativeCapacity);
  const averageSecurity = controlled.length ? Math.round(controlled.reduce((sum, node) => sum + (node.security ?? 100), 0) / controlled.length) : 0;
  const baseUpkeep = state.squads.filter((squad) => squad.faction === faction).reduce((sum, squad) => sum + getSquadUpkeep(squad), 0);
  const reserveMultiplier = mobilization === "peace" ? 2.1 : mobilization === "limited" ? 1.55 : mobilization === "full" ? .9 : .35;
  const reserveTarget = Math.round((baseUpkeep + getFactionHireCost(faction, "Новички") * .45) * reserveMultiplier);
  const readiness = Math.round(Math.max(0, Math.min(100,
    strategy.supply * .38
    + (100 - strategy.warWeariness) * .3
    + Math.min(100, strategy.manpower / Math.max(1, factionManpowerCap(state, faction)) * 100) * .2
    + Math.max(0, 100 - overextension * 14) * .12,
  )));
  return {
    faction,
    mobilization,
    armyLimit,
    combatSquads,
    manpower: Math.round(strategy.manpower),
    manpowerCap: factionManpowerCap(state, faction),
    supply: Math.round(strategy.supply),
    warWeariness: Math.round(strategy.warWeariness),
    controlledNodes: controlled.length,
    averageSecurity,
    administrativeCapacity,
    overextension,
    reserveTarget,
    activeWars,
    readiness,
  };
}

function factionEconomySummary(state: GameState, faction: PlayableFactionId) {
  const profile = FACTION_PROFILES[faction];
  const baseGross = state.nodes.filter((node) => node.owner === faction).reduce((sum, node) => sum + node.income, 0);
  const securedGross = state.nodes.filter((node) => node.owner === faction).reduce((sum, node) => sum + node.income * (.4 + (node.security ?? 100) / 100 * .6), 0);
  const balance = getFactionBalanceSummary(state, faction);
  const administrativeEfficiency = Math.max(.62, 1 - balance.overextension * .045);
  const territorialIncome = Math.round(securedGross * profile.economy.income * administrativeEfficiency);
  const doctrineBonus = territorialIncome - baseGross;
  const allies = PLAYABLE_FACTIONS.filter((other) => other !== faction && getRelation(state, faction, other) === "alliance").length;
  const allianceTrade = Math.round(territorialIncome * 0.05 * allies * profile.economy.allianceTrade);
  const tradePartners = PLAYABLE_FACTIONS.filter((other) => other !== faction && getRelation(state, faction, other) !== "alliance" && getBilateralDiplomacy(state, faction, other).tradePact).length;
  const treatyTrade = Math.round(territorialIncome * 0.035 * tradePartners * profile.economy.allianceTrade);
  const gross = territorialIncome + allianceTrade + treatyTrade;
  const baseUpkeep = state.squads.filter((squad) => squad.faction === faction).reduce((sum, squad) => sum + getSquadUpkeep(squad), 0);
  const mobilizationCost = Math.round(baseUpkeep * (balance.activeWars * .055 + Math.max(0, balance.combatSquads - balance.armyLimit) * .2));
  const upkeep = baseUpkeep + mobilizationCost;
  return { baseGross, securedGross: Math.round(securedGross), administrativeEfficiency, doctrineBonus, allianceTrade, treatyTrade, tradePartners, gross, baseUpkeep, mobilizationCost, upkeep, net: gross - upkeep };
}

export function getEconomySummary(state: GameState) {
  return factionEconomySummary(state, state.playerFaction);
}

export function migrateGameState(saved: GameState): GameState {
  const campaignMode = saved.campaignMode ?? "faction";
  const squadAllegiance = campaignMode === "squad" ? saved.squadAllegiance ?? null : saved.playerFaction;
  const fresh = createGame(saved.playerFaction, campaignMode, squadAllegiance);
  const savedNodes = new Map(saved.nodes.map((node) => [node.id, node]));
  const savedSquadIds = new Set(saved.squads.map((squad) => squad.id));
  const diplomacyMemory = Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, {
    ...fresh.diplomacyMemory[faction],
    ...(saved.diplomacyMemory?.[faction] ?? {}),
  }])) as Record<PlayableFactionId, FactionMemory>;
  const factionSurvival = Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, {
    ...fresh.factionSurvival[faction],
    ...(saved.factionSurvival?.[faction] ?? {}),
  }])) as Record<PlayableFactionId, FactionSurvival>;
  const freshStrategy = initialFactionStrategy();
  const factionStrategy = Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, {
    ...freshStrategy[faction],
    ...(saved.factionStrategy?.[faction] ?? {}),
  }])) as Record<PlayableFactionId, FactionStrategicState>;
  const factionDiplomacy = Object.fromEntries(Object.entries(fresh.factionDiplomacy).map(([key, relation]) => [key, {
    ...relation,
    ...(saved.factionDiplomacy?.[key] ?? {}),
  }])) as Record<string, BilateralDiplomacy>;
  const newSystemSquads = fresh.squads.filter((squad) => {
    const node = fresh.nodes.find((item) => item.id === squad.nodeId);
    return !savedSquadIds.has(squad.id) && (node?.mapLevel === "sector" || Boolean(squad.homeGarrison && node?.baseFor));
  });

  const migrated: GameState = {
    ...saved,
    campaignMode,
    squadAllegiance,
    playerSquadId: campaignMode === "squad"
      ? saved.playerSquadId ?? saved.selectedSquadId ?? fresh.playerSquadId
      : null,
    speed: 0,
    tacticalNodeId: null,
    tacticalTargetId: null,
    operatives: Array.isArray(saved.operatives) && saved.operatives.length
      ? saved.operatives.map((operative) => ({
          ...operative,
          destinationX: operative.destinationX ?? null,
          destinationY: operative.destinationY ?? null,
          order: operative.order ?? "idle",
          orderTarget: operative.orderTarget ?? null,
          actionUntil: operative.actionUntil ?? null,
        }))
      : fresh.operatives.map((operative) => ({ ...operative })),
    trophies: { ...fresh.trophies, ...(saved.trophies ?? {}) },
    stash: { ...fresh.stash, ...(saved.stash ?? {}) },
    discoveredItems: [...new Set([...(fresh.discoveredItems ?? []), ...(saved.discoveredItems ?? [])])],
    contracts: Array.isArray(saved.contracts) ? saved.contracts.map((contract) => ({
      ...contract,
      issuerFaction: contract.issuerFaction ?? fresh.contracts[0]?.issuerFaction ?? saved.playerFaction,
      targetSquadId: contract.targetSquadId ?? null,
      sourceOperationId: contract.sourceOperationId ?? null,
      risk: contract.risk ?? "medium",
      reputationReward: contract.reputationReward ?? 3,
      lastProgressAt: contract.lastProgressAt ?? contract.acceptedAt ?? saved.simMinute,
      rewardItemId: contract.rewardItemId ?? null,
      requiredItemId: contract.requiredItemId ?? null,
      giverSquadId: contract.giverSquadId ?? null,
      briefedAt: contract.briefedAt ?? null,
      negotiationClosed: contract.negotiationClosed ?? false,
      declinedAt: contract.declinedAt ?? null,
    })) : fresh.contracts,
    contractSequence: saved.contractSequence ?? fresh.contractSequence,
    nextContractRefreshAt: saved.nextContractRefreshAt ?? fresh.nextContractRefreshAt,
    operations: Array.isArray(saved.operations) ? saved.operations.map((operation) => ({ ...operation, assignedSquadIds: [...(operation.assignedSquadIds ?? [])] })) : fresh.operations.map((operation) => ({ ...operation, assignedSquadIds: [...operation.assignedSquadIds] })),
    operationSequence: saved.operationSequence ?? fresh.operationSequence,
    nextOperationAt: saved.nextOperationAt ?? saved.simMinute,
    squadDiplomacy: Object.fromEntries(Object.entries(saved.squadDiplomacy ?? {}).map(([key, memory]) => [key, { ...memory }])) as Record<string, SquadDiplomacyMemory>,
    squadKnowledge: saved.squadKnowledge ? {
      visitedSectorIds: [...(saved.squadKnowledge.visitedSectorIds ?? [])],
      knownNodeIds: [...(saved.squadKnowledge.knownNodeIds ?? [])],
      knownSquads: Object.fromEntries(Object.entries(saved.squadKnowledge.knownSquads ?? {}).map(([id, intel]) => [id, { ...intel }])),
      reports: (saved.squadKnowledge.reports ?? []).map((report) => ({ ...report })),
      conversations: (saved.squadKnowledge.conversations ?? []).map((conversation) => ({ ...conversation })),
    } : cloneSquadKnowledge(fresh.squadKnowledge),
    deceptionPlot: saved.deceptionPlot ? { ...saved.deceptionPlot } : null,
    fieldDeals: Array.isArray(saved.fieldDeals) ? saved.fieldDeals.map((deal) => ({ ...deal })) : [],
    fieldEventSequence: saved.fieldEventSequence ?? fresh.fieldEventSequence,
    nextSquadDiplomacyAt: saved.nextSquadDiplomacyAt ?? saved.simMinute + 18,
    nextDirectiveAt: saved.nextDirectiveAt ?? fresh.nextDirectiveAt,
    nextCaravanAt: saved.nextCaravanAt ?? fresh.nextCaravanAt,
    nextMutantSpawnAt: saved.nextMutantSpawnAt ?? fresh.nextMutantSpawnAt,
    worldEvents: Array.isArray(saved.worldEvents) ? saved.worldEvents.map((event) => ({ ...event })) : [],
    worldEventSequence: saved.worldEventSequence ?? fresh.worldEventSequence,
    nextWorldEventAt: saved.nextWorldEventAt ?? saved.simMinute + 60,
    reputation: saved.reputation ?? fresh.reputation,
    diplomacyMemory,
    factionDiplomacy,
    factionSurvival,
    factionStrategy,
    diplomaticOffers: Array.isArray(saved.diplomaticOffers) ? saved.diplomaticOffers.map((offer) => ({ ...offer })) : fresh.diplomaticOffers,
    diplomaticOfferSequence: saved.diplomaticOfferSequence ?? fresh.diplomaticOfferSequence,
    nextDiplomacyAt: saved.nextDiplomacyAt ?? fresh.nextDiplomacyAt,
    nextFactionDiplomacyAt: saved.nextFactionDiplomacyAt ?? fresh.nextFactionDiplomacyAt,
    directives: { ...fresh.directives, ...(saved.directives ?? {}) },
    alifeStats: { ...fresh.alifeStats, ...(saved.alifeStats ?? {}) },
    research: { ...fresh.research, ...(saved.research ?? {}) },
    nodes: fresh.nodes.map((node) => {
      const previous = savedNodes.get(node.id);
      return previous
        ? {
            ...node,
            owner: previous.owner,
            capture: previous.capture,
            captureFaction: previous.captureFaction,
            security: Number.isFinite(previous.security) ? previous.security : previous.owner ? 100 : 0,
            capturedAt: previous.capturedAt ?? null,
          }
        : node;
    }),
    selectedNodeId: fresh.nodes.some((node) => node.id === saved.selectedNodeId) ? saved.selectedNodeId : fresh.selectedNodeId,
    squads: [
      ...saved.squads.map((squad, squadIndex) => {
        const formation = squad.formation ?? "mixed";
        const combat = FORMATION_COMBAT[formation];
        const position = initialTacticalPosition(squad, saved.playerFaction);
        const homeGarrison = squad.homeGarrison ?? fresh.squads.find((item) => item.id === squad.id)?.homeGarrison ?? false;
        const generatedCommander = squad.faction === "mutants" ? null : makeCommander(squad.faction as PlayableFactionId, squad.nodeId, squadIndex + stableHash(squad.id) % 10000, squad.rank, homeGarrison);
        const loadout = squad.faction === "mutants" ? null : initialLoadout(squad.faction as PlayableFactionId, squad.rank);
        return {
          ...squad,
          formation,
          weaponTier: squad.weaponTier ?? (squad.rank === "Мастера" ? 2 : squad.rank === "Ветераны" || squad.rank === "Опытные" ? 1 : 0),
          armorTier: squad.armorTier ?? (squad.rank === "Мастера" ? 2 : squad.rank === "Ветераны" || squad.rank === "Опытные" ? 1 : 0),
          homeGarrison,
          tacticalX: squad.tacticalX ?? position.x,
          tacticalY: squad.tacticalY ?? position.y,
          stamina: squad.stamina ?? 100,
          maxStamina: squad.maxStamina ?? 100,
          suppression: squad.suppression ?? 0,
          maxFighters: squad.maxFighters ?? squad.fighters ?? 1,
          morale: squad.morale ?? (squad.rank === "Мастера" ? 88 : squad.rank === "Ветераны" ? 76 : squad.rank === "Новички" ? 46 : 62),
          magazineSize: squad.magazineSize ?? (squad.faction === "mutants" ? 0 : combat.magazine),
          magazine: squad.magazine ?? (squad.faction === "mutants" ? 0 : combat.magazine),
          unitKind: squad.unitKind ?? (squad.faction === "mutants" ? "mutant" : "combat"),
          mission: squad.mission ?? (squad.faction === saved.playerFaction ? "player" : squad.faction === "mutants" ? "roam" : "hold"),
          missionTargetId: squad.missionTargetId ?? null,
          missionPath: Array.isArray(squad.missionPath) ? [...squad.missionPath] : [],
          missionIssuedAt: squad.missionIssuedAt ?? saved.simMinute,
          cargo: squad.cargo ?? 0,
          mutantType: squad.mutantType ?? (squad.faction === "mutants" ? "dogs" : null),
          archetypeId: squad.archetypeId ?? (squad.faction === "mutants" || (squad.unitKind && squad.unitKind !== "combat")
            ? null
            : FACTION_PROFILES[squad.faction as PlayableFactionId].roster[rosterRank(squad.rank)].id),
          commander: generatedCommander ? { ...generatedCommander, ...(squad.commander ?? {}) } : null,
          weaponId: squad.weaponId ?? loadout?.weapon ?? null,
          armorId: squad.armorId ?? loadout?.armor ?? null,
          artifactIds: Array.isArray(squad.artifactIds) ? [...squad.artifactIds] : [],
        };
      }),
      ...newSystemSquads,
    ],
  };
  for (const contract of migrated.contracts) {
    if (contract.giverSquadId) continue;
    const candidates = migrated.squads.filter((squad) => squad.status !== "dead" && squad.unitKind === "combat" && squad.faction === contract.issuerFaction && Boolean(squad.commander));
    if (candidates.length) contract.giverSquadId = candidates[stableHash(contract.id) % candidates.length].id;
  }
  syncStrategicOperations(migrated, true);
  refreshSquadKnowledge(migrated);
  return migrated;
}

export function isPlayerControlledSquad(state: GameState, squad: Pick<Squad, "id" | "faction"> | null | undefined) {
  if (!squad) return false;
  return state.campaignMode === "squad"
    ? squad.id === state.playerSquadId
    : squad.faction === state.playerFaction;
}

function nodeById(state: GameState, id: string) {
  return state.nodes.find((node) => node.id === id);
}

export function getSquadCurrentSectorId(state: GameState) {
  if (state.campaignMode !== "squad" || !state.playerSquadId) return null;
  const squad = state.squads.find((item) => item.id === state.playerSquadId);
  const node = squad ? nodeById(state, squad.nodeId) : null;
  return node?.sectorId ?? (node ? getSectorForNode(node.id)?.id ?? null : null);
}

export function isSquadNodeKnown(state: GameState, nodeId: string) {
  return state.campaignMode !== "squad" || state.squadKnowledge.knownNodeIds.includes(nodeId);
}

function cloneSquadKnowledge(knowledge: SquadKnowledge): SquadKnowledge {
  return {
    visitedSectorIds: [...knowledge.visitedSectorIds],
    knownNodeIds: [...knowledge.knownNodeIds],
    knownSquads: Object.fromEntries(Object.entries(knowledge.knownSquads).map(([id, intel]) => [id, { ...intel }])),
    reports: knowledge.reports.map((report) => ({ ...report })),
    conversations: knowledge.conversations.map((conversation) => ({ ...conversation })),
  };
}

function refreshSquadKnowledge(state: GameState) {
  if (state.campaignMode !== "squad" || !state.playerSquadId) return;
  const player = state.squads.find((squad) => squad.id === state.playerSquadId && squad.status !== "dead");
  if (!player) return;
  const current = nodeById(state, player.nodeId);
  const sectorId = getSquadCurrentSectorId(state);
  if (sectorId && !state.squadKnowledge.visitedSectorIds.includes(sectorId)) state.squadKnowledge.visitedSectorIds.push(sectorId);
  const known = new Set(state.squadKnowledge.knownNodeIds);
  if (current) {
    known.add(current.id);
    current.links.forEach((id) => known.add(id));
    current.localLinks?.forEach((id) => known.add(id));
  }
  if (sectorId) state.nodes.filter((node) => node.sectorId === sectorId).forEach((node) => known.add(node.id));
  state.squadKnowledge.knownNodeIds = [...known];
  if (sectorId) {
    for (const squad of state.squads) {
      if (squad.status === "dead" || nodeById(state, squad.nodeId)?.sectorId !== sectorId) continue;
      state.squadKnowledge.knownSquads[squad.id] = {
        squadId: squad.id,
        nodeId: squad.nodeId,
        faction: squad.faction,
        name: squad.name,
        fighters: squad.fighters,
        seenAt: state.simMinute,
        source: "visual",
      };
    }
  }
  state.squadKnowledge.reports = state.squadKnowledge.reports.filter((report) => report.expiresAt > state.simMinute).slice(-24);
  state.squadKnowledge.conversations = state.squadKnowledge.conversations.slice(-40);
}

function nodeConnections(node: ZoneNode) {
  return [...new Set([...(node.links ?? []), ...(node.localLinks ?? [])])];
}

function adjustFactionMemory(
  state: GameState,
  faction: PlayableFactionId,
  change: Partial<Pick<FactionMemory, "trust" | "fear" | "grievance" | "playerKills" | "territoriesLost" | "aidReceived">>,
) {
  if (faction === state.playerFaction) return;
  const memory = state.diplomacyMemory[faction];
  memory.trust = clampDiplomacy(memory.trust + (change.trust ?? 0));
  memory.fear = clampPressure(memory.fear + (change.fear ?? 0));
  memory.grievance = clampPressure(memory.grievance + (change.grievance ?? 0));
  memory.playerKills = Math.max(0, memory.playerKills + (change.playerKills ?? 0));
  memory.territoriesLost = Math.max(0, memory.territoriesLost + (change.territoriesLost ?? 0));
  memory.aidReceived = Math.max(0, memory.aidReceived + (change.aidReceived ?? 0));
  memory.lastIncidentAt = state.simMinute;
}

function findPath(state: GameState, fromId: string, toId: string) {
  if (fromId === toId) return [fromId];
  const queue: string[][] = [[fromId]];
  const visited = new Set([fromId]);
  while (queue.length) {
    const path = queue.shift()!;
    const current = nodeById(state, path[path.length - 1]);
    if (!current) continue;
    for (const linkedId of nodeConnections(current)) {
      if (visited.has(linkedId)) continue;
      const nextPath = [...path, linkedId];
      if (linkedId === toId) return nextPath;
      visited.add(linkedId);
      queue.push(nextPath);
    }
  }
  return [];
}

function nearestNode(
  state: GameState,
  fromId: string,
  predicate: (node: ZoneNode) => boolean,
) {
  const candidates = state.nodes.filter(predicate);
  let best: { node: ZoneNode; path: string[] } | null = null;
  for (const node of candidates) {
    const path = findPath(state, fromId, node.id);
    if (path.length && (!best || path.length < best.path.length)) best = { node, path };
  }
  return best;
}

function beginMission(state: GameState, squad: Squad, mission: MissionType, targetNodeId: string, path?: string[]) {
  const route = path ?? findPath(state, squad.nodeId, targetNodeId);
  if (route.length < 2) {
    squad.mission = mission;
    squad.missionTargetId = targetNodeId;
    squad.missionPath = [];
    squad.missionIssuedAt = state.simMinute;
    return false;
  }
  const remaining = route.slice(1);
  squad.destinationId = remaining.shift()!;
  squad.missionPath = remaining;
  squad.mission = mission;
  squad.missionTargetId = targetNodeId;
  squad.missionIssuedAt = state.simMinute;
  squad.status = "moving";
  squad.travel = 0;
  squad.cover = squad.approachMode === "ambush" ? .58 : 0;
  return true;
}

export function getMissionLabel(state: GameState, squad: Squad) {
  const target = squad.missionTargetId ? nodeById(state, squad.missionTargetId) : null;
  return `${MISSION_LABELS[squad.mission]}${target ? ` · ${target.name}` : ""}`;
}

export function getALifeCounts(state: GameState) {
  const living = livingSquads(state);
  return {
    activeMissions: living.filter((squad) => !["player", "hold"].includes(squad.mission)).length,
    caravans: living.filter((squad) => squad.unitKind === "caravan").length,
    mutants: living.filter((squad) => squad.unitKind === "mutant").length,
    raids: living.filter((squad) => squad.mission === "raid").length,
  };
}

function controlledTerrain(state: GameState, squad: Squad) {
  const node = nodeById(state, squad.nodeId);
  return node?.owner === squad.faction ? findSectorPoint(node.id) : undefined;
}

function effectiveCombatCover(state: GameState, squad: Squad) {
  const doctrineCover = squad.faction === "mutants" || nodeById(state, squad.nodeId)?.owner !== squad.faction
    ? 0
    : FACTION_PROFILES[squad.faction].combat.controlledCover;
  return clamp(Math.max(squad.cover, controlledTerrain(state, squad)?.defenseBonus ?? 0) + doctrineCover, 0, 0.68);
}

export function getSquadCombatRole(squad: Squad) {
  if (squad.mutantType) return MUTANT_COMBAT[squad.mutantType].role;
  return squad.weaponId ? `${FORMATION_COMBAT[squad.formation].role} · ${ZONE_ITEMS[squad.weaponId].name}` : FORMATION_COMBAT[squad.formation].role;
}

export function getTacticalPosition(squad: Squad) {
  return { x: squad.tacticalX, y: squad.tacticalY };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function segmentIntersectsCover(
  from: { x: number; y: number },
  to: { x: number; y: number },
  cover: { left: number; top: number; width: number; height: number },
) {
  for (let step = 2; step <= 18; step += 1) {
    const t = step / 20;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    if (x >= cover.left && x <= cover.left + cover.width && y >= cover.top && y <= cover.top + cover.height) return true;
  }
  return false;
}

export function getCombatProfile(state: GameState, attacker: Squad, target: Squad): CombatProfile {
  const from = getTacticalPosition(attacker);
  const to = getTacticalPosition(target);
  const distance = Math.round(Math.hypot(to.x - from.x, to.y - from.y) * 3.15);
  const combat = attacker.mutantType
    ? { ...MUTANT_COMBAT[attacker.mutantType], burst: 1, magazine: 0 }
    : FORMATION_COMBAT[attacker.formation];
  const equipment = getSquadEquipmentEffects(attacker);
  const location = getLocationContent(attacker.nodeId, nodeById(state, attacker.nodeId)?.sectorId, nodeById(state, attacker.nodeId)?.type);
  const effectiveRange = Math.max(12, combat.range + equipment.range);
  const layout = getTacticalLayout(attacker.nodeId);
  const obstacles = layout.covers.filter((cover) => segmentIntersectsCover(from, to, cover));
  const targetCover = effectiveCombatCover(state, target);
  const lineOfSight: LineOfSight = obstacles.length >= 2 ? "blocked" : obstacles.length === 1 || targetCover >= 0.32 ? "partial" : "clear";
  const rangeFactor = distance <= effectiveRange
    ? clamp(1.06 - (distance / Math.max(1, effectiveRange)) * 0.16, 0.82, 1.06)
    : clamp(1 - ((distance - effectiveRange) / Math.max(1, effectiveRange)) * 0.78, attacker.faction === "mutants" ? 0.16 : 0.24, 1);
  const rankAccuracy = attacker.rank === "Мастера" ? 0.08 : attacker.rank === "Ветераны" ? 0.05 : attacker.rank === "Новички" ? -0.08 : 0;
  const sightPenalty = lineOfSight === "blocked" ? 0.24 : lineOfSight === "partial" ? 0.1 : 0;
  const staminaPenalty = attacker.stamina < 25 ? 0.18 : attacker.stamina < 50 ? 0.08 : 0;
  const suppressionPenalty = attacker.suppression * 0.0024;
  const rangePenalty = (1 - rangeFactor) * 0.3;
  const researchBonus = attacker.faction === state.playerFaction ? state.research.weapons * 0.025 : 0;
  const doctrineAccuracy = attacker.faction === "mutants" ? 1 : FACTION_PROFILES[attacker.faction].combat.accuracy;
  const mutantEvasion = target.mutantType === "pseudodog" ? .1 : target.mutantType === "bloodsucker" || target.mutantType === "chimera" ? .07 : 0;
  const hitChance = clamp(
    combat.accuracy * doctrineAccuracy + equipment.accuracy + location.accuracy + rankAccuracy + attacker.weaponTier * 0.018 + researchBonus - mutantEvasion - targetCover * 0.24 - sightPenalty - staminaPenalty - suppressionPenalty - rangePenalty,
    0.08,
    0.94,
  );
  return {
    role: combat.role,
    distance,
    effectiveRange,
    lineOfSight,
    obstacle: obstacles[0]?.label ?? (targetCover >= 0.32 ? "укрытие цели" : null),
    hitChance,
    cover: targetCover,
    rangeFactor,
  };
}

function livingSquads(state: GameState, nodeId?: string) {
  return state.squads.filter((squad) => squad.status !== "dead" && (!nodeId || squad.nodeId === nodeId));
}

function finishArrival(state: GameState, squad: Squad) {
  const destination = squad.destinationId;
  if (!destination) return;
  squad.previousNodeId = squad.nodeId;
  squad.nodeId = destination;
  squad.destinationId = null;
  squad.travel = 0;
  squad.status = "idle";
  squad.cover = 0;
  squad.suppression = Math.max(0, squad.suppression - 20);
  resetTacticalPosition(squad, state.playerFaction);
  if (state.campaignMode === "squad" && squad.id === state.playerSquadId) {
    state.operatives.filter((operative) => operative.squadId === squad.id && operative.condition !== "dead" && operative.condition !== "left").forEach((operative, index) => {
      operative.localX = 44 + (index % 4) * 3;
      operative.localY = 88 - Math.floor(index / 4) * 3;
      operative.destinationX = null;
      operative.destinationY = null;
      operative.order = "idle";
      operative.orderTarget = null;
      operative.actionUntil = null;
    });
  }
  const node = nodeById(state, destination)!;
  if (squad.approachMode === "ambush") {
    for (const target of livingSquads(state, destination).filter((other) => squadsAreHostile(state, squad, other))) {
      target.suppression = Math.min(100, target.suppression + 32);
      target.morale = Math.max(0, target.morale - 8);
    }
    addLog(state, `${squad.name} развернул засаду у точки «${node.name}»: первый огневой контакт начнётся из подготовленного укрытия.`, squad.faction === state.playerFaction ? "success" : "danger");
  }
  if (squad.faction === state.playerFaction && squad.unitKind === "combat") addLog(state, `${squad.name} прибыл: ${node.name}.`, "info");
  if (squad.missionPath.length) {
    squad.destinationId = squad.missionPath.shift()!;
    squad.status = "moving";
  } else if (squad.approachMode !== "occupy") {
    squad.approachMode = null;
  }
}

function resolveIncome(state: GameState) {
  for (const faction of PLAYABLE_FACTIONS) {
    const economy = factionEconomySummary(state, faction);
    state.factionFunds[faction] = Math.max(0, state.factionFunds[faction] + economy.net);
    if (faction === state.playerFaction && state.campaignMode === "faction") state.rubles = Math.max(0, state.rubles + economy.net);

    const strategy = state.factionStrategy[faction];
    const balance = getFactionBalanceSummary(state, faction);
    const hasHeadquarters = state.nodes.some((node) => node.baseFor === faction && node.owner === faction);
    const settlements = controlledStrategicNodes(state, faction).filter((node) => node.type === "camp").length;
    const recruitment = hasHeadquarters ? .8 + settlements * .28 + economy.tradePartners * .16 : .15;
    strategy.manpower = Math.min(balance.manpowerCap, strategy.manpower + recruitment);

    const contested = livingSquads(state).some((squad) => squad.faction === faction && squad.status === "combat");
    const frontlineWars = PLAYABLE_FACTIONS.filter((other) => other !== faction && getRelation(state, faction, other) === "war" && factionsShareBorder(state, faction, other)).length;
    const fatigueDelta = Math.sqrt(frontlineWars) * .12 + (contested ? .18 : 0) + balance.overextension * .05 - (frontlineWars === 0 && !contested ? .75 : .22);
    strategy.warWeariness = Math.max(0, Math.min(100, strategy.warWeariness + fatigueDelta));

    const economyRatio = economy.net / Math.max(1, economy.upkeep || economy.gross);
    const supplyTarget = Math.max(12, Math.min(96, 68 + economyRatio * 28 + economy.tradePartners * 3));
    const supplyDelta = (supplyTarget - strategy.supply) * .065 - Math.sqrt(frontlineWars) * .12 - balance.overextension * .22;
    strategy.supply = Math.max(0, Math.min(100, strategy.supply + supplyDelta));
    strategy.insolvencyCycles = state.factionFunds[faction] <= 0 && economy.net < 0 ? strategy.insolvencyCycles + 1 : Math.max(0, strategy.insolvencyCycles - 1);

    const liquidityTarget = Math.max(36000, balance.reserveTarget * 2 + economy.gross * 5);
    if (faction !== state.playerFaction && state.factionFunds[faction] > liquidityTarget && (strategy.supply < 92 || strategy.manpower < balance.manpowerCap * .8)) {
      const investment = Math.min(3200, Math.round((state.factionFunds[faction] - liquidityTarget) * .08));
      state.factionFunds[faction] -= investment;
      if (faction === state.playerFaction) state.rubles = Math.max(0, state.rubles - investment);
      strategy.supply = Math.min(100, strategy.supply + investment / 900);
      strategy.manpower = Math.min(balance.manpowerCap, strategy.manpower + investment / 1800);
    }

    if (strategy.supply < 25 || strategy.insolvencyCycles >= 2) {
      for (const squad of livingSquads(state).filter((item) => item.faction === faction && item.unitKind === "combat")) {
        squad.morale = Math.max(12, squad.morale - (strategy.supply < 12 ? 5 : 2));
        squad.ammo = Math.max(0, squad.ammo - (strategy.supply < 12 ? 12 : 5));
      }
      strategy.warWeariness = Math.min(100, strategy.warWeariness + 1.5);
      if (faction === state.playerFaction) addLog(state, `Снабжение: резерв ${Math.round(strategy.supply)}%. Отряды теряют боеприпасы и мораль.`, "danger");
    }

    const anomalyNodes = state.nodes.filter((node) => node.owner === faction && node.type === "anomaly");
    const anomalyCount = anomalyNodes.length;
    if (!anomalyCount) continue;
    const profile = FACTION_PROFILES[faction];
    const reconYield = faction === state.playerFaction ? state.research.recon : 0;
    const fieldArtifactBonus = faction === state.playerFaction
      ? livingSquads(state).filter((squad) => squad.faction === faction && anomalyNodes.some((node) => node.id === squad.nodeId)).reduce((sum, squad) => sum + getSquadEquipmentEffects(squad).artifactYield, 0)
      : 0;
    const surgeBonus = state.worldEvents.filter((event) => event.type === "anomaly_surge" && event.status === "active" && anomalyNodes.some((node) => node.id === event.nodeId)).reduce((sum, event) => sum + event.severity * .65, 0);
    const found = Math.max(1, Math.round(anomalyCount * profile.economy.artifactYield + reconYield + fieldArtifactBonus + surgeBonus));
    const tradePrice = faction === state.playerFaction ? 1 + state.research.trade * 0.1 : 1;
    const sale = Math.round(found * 550 * profile.economy.artifactValue * tradePrice);
    if (faction !== state.playerFaction) state.factionFunds[faction] += sale;
    if (faction === state.playerFaction) {
      state.artifacts += found;
      advanceContracts(state, "artifacts", found);
      const roll = randomStep(state.rngSeed);
      state.rngSeed = roll.seed;
      const source = anomalyNodes[Math.floor(roll.value * anomalyNodes.length) % anomalyNodes.length];
      const location = getLocationContent(source.id, source.sectorId, source.type);
      const campaignTier = Math.min(3, 1 + Math.floor(state.simMinute / 2880) + Math.floor(state.research.recon / 2));
      const available = location.artifactTable.filter((id) => ZONE_ITEMS[id].tier <= campaignTier);
      const artifactId = available[Math.floor(roll.value * Math.max(1, available.length)) % Math.max(1, available.length)] ?? location.artifactTable[0];
      addStashItem(state, artifactId, 1);
      addLog(state, `Аномальная экспедиция: ${found} находок у точки «${source.name}». На склад доставлен артефакт «${ZONE_ITEMS[artifactId].name}»; автоматическая продажа отключена.`, "success");
    }
  }
  for (let left = 0; left < PLAYABLE_FACTIONS.length; left += 1) {
    for (let right = left + 1; right < PLAYABLE_FACTIONS.length; right += 1) {
      const a = PLAYABLE_FACTIONS[left];
      const b = PLAYABLE_FACTIONS[right];
      const bilateral = getBilateralDiplomacy(state, a, b);
      if (!bilateral.tradePact || getFactionCondition(state, a) === "destroyed" || getFactionCondition(state, b) === "destroyed" || getRelation(state, a, b) === "war") continue;
      const combinedTerritory = state.nodes.filter((node) => node.owner === a || node.owner === b).reduce((sum, node) => sum + node.income, 0);
      adjustBilateralDiplomacy(state, a, b, { tradesCompleted: 1, tradeVolume: Math.round(combinedTerritory * 0.012) });
    }
  }
  const player = factionEconomySummary(state, state.playerFaction);
  const tradeIncome = player.allianceTrade + player.treatyTrade;
  const tradeText = tradeIncome > 0 ? `, включая ${tradeIncome.toLocaleString("ru-RU")} ₽ договорной торговли` : "";
  addLog(state, `Экономика: ${player.gross.toLocaleString("ru-RU")} ₽ дохода${tradeText} − ${player.upkeep.toLocaleString("ru-RU")} ₽ содержание = ${player.net >= 0 ? "+" : ""}${player.net.toLocaleString("ru-RU")} ₽.`, player.net >= 0 ? "success" : "danger");
}

function chooseDirective(state: GameState, faction: PlayableFactionId): FactionDirective {
  const profile = FACTION_PROFILES[faction];
  const base = state.nodes.find((node) => node.baseFor === faction);
  const condition = getFactionCondition(state, faction);
  if (condition === "destroyed") {
    return { type: "recovery", targetNodeId: null, issuedAt: state.simMinute, reason: "Командная сеть группировки уничтожена" };
  }
  if (base && base.owner !== faction) {
    return { type: "raid", targetNodeId: base.id, issuedAt: state.simMinute, reason: `${profile.doctrine}: остатки сил пытаются вернуть штаб «${base.name}»` };
  }
  const owned = state.nodes.filter((node) => node.owner === faction && node.mapLevel !== "sector");
  const threatened = owned.find((node) => livingSquads(state, node.id).some((squad) => areHostile(state, faction, squad.faction))) ??
    owned.find((node) => nodeConnections(node).some((id) => {
      return livingSquads(state, id).some((squad) => areHostile(state, faction, squad.faction));
    }));
  if (threatened && (threatened.type === "base" || threatened.income >= 900 * profile.strategy.defenseSensitivity)) {
    return { type: "defense", targetNodeId: threatened.id, issuedAt: state.simMinute, reason: `${profile.doctrine}: угроза у точки «${threatened.name}»` };
  }
  if (profile.strategy.allySupport) {
    const alliedThreatened = state.nodes.find((node) => {
      if (!node.owner || node.owner === "mutants" || getRelation(state, faction, node.owner) !== "alliance") return false;
      return livingSquads(state, node.id).some((squad) => areHostile(state, faction, squad.faction)) || nodeConnections(node).some((id) => livingSquads(state, id).some((squad) => areHostile(state, faction, squad.faction)));
    });
    if (alliedThreatened) {
      return { type: "defense", targetNodeId: alliedThreatened.id, issuedAt: state.simMinute, reason: `${profile.doctrine}: поддержка союзника у «${alliedThreatened.name}»` };
    }
  }
  const strategic = getFactionBalanceSummary(state, faction);
  if (strategic.warWeariness >= 72 || strategic.supply < 28) {
    return {
      type: "recovery",
      targetNodeId: base?.id ?? null,
      issuedAt: state.simMinute,
      reason: `${profile.doctrine}: ${strategic.warWeariness >= 72 ? "войска истощены затяжной войной" : "сорвана сеть снабжения"}`,
    };
  }
  if (strategic.overextension >= 2) {
    const insecure = owned.sort((a, b) => (a.security ?? 100) - (b.security ?? 100))[0] ?? base;
    return { type: "defense", targetNodeId: insecure?.id ?? null, issuedAt: state.simMinute, reason: `${profile.doctrine}: территория растянута, требуется закрепление тыла` };
  }
  if (faction !== state.playerFaction && getRelation(state, faction, state.playerFaction) === "war") {
    const memory = state.diplomacyMemory[faction];
    if (memory.grievance >= 45 || memory.territoriesLost > 0) {
      const retaliationTarget = state.nodes
        .filter((node) => node.mapLevel !== "sector" && node.owner === state.playerFaction)
        .sort((a, b) => (b.income + (b.baseFor === state.playerFaction ? 2200 : 0)) - (a.income + (a.baseFor === state.playerFaction ? 2200 : 0)))[0];
      if (retaliationTarget) {
        return { type: "raid", targetNodeId: retaliationTarget.id, issuedAt: state.simMinute, reason: `${profile.doctrine}: ответный удар за потери и захваченные территории` };
      }
    }
  }
  if (state.factionFunds[faction] < getFactionHireCost(faction, "Новички") * 0.35) {
    return { type: "recovery", targetNodeId: base?.id ?? null, issuedAt: state.simMinute, reason: `${profile.doctrine}: недостаток средств и боеприпасов` };
  }

  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  let type = profile.directives[Math.floor(roll.value * profile.directives.length) % profile.directives.length];
  const frontier = state.nodes.filter((node) => node.mapLevel !== "sector" && node.owner !== faction && (!node.owner || areHostile(state, faction, node.owner)) &&
    nodeConnections(node).some((id) => nodeById(state, id)?.owner === faction));
  const hostile = state.nodes.filter((node) => node.mapLevel !== "sector" && node.owner && areHostile(state, faction, node.owner));
  const hostileCaravanNodes = state.nodes.filter((node) => livingSquads(state, node.id).some((squad) => squad.unitKind === "caravan" && areHostile(state, faction, squad.faction)));
  const anomalies = state.nodes.filter((node) => node.mapLevel !== "sector" && node.type === "anomaly" && node.owner !== faction && (!node.owner || areHostile(state, faction, node.owner)));
  let target: ZoneNode | undefined;
  if (type === "artifacts") target = anomalies.sort((a, b) => b.income - a.income)[0];
  if (type === "raid") {
    if (profile.strategy.raidFocus === "caravans" && hostileCaravanNodes.length) {
      target = hostileCaravanNodes.sort((a, b) => livingSquads(state, b.id).reduce((sum, squad) => sum + squad.cargo, 0) - livingSquads(state, a.id).reduce((sum, squad) => sum + squad.cargo, 0))[0];
    } else {
      const raidScore = (node: ZoneNode) => node.income + (node.type === "base" ? (profile.strategy.raidFocus === "bases" ? 1800 : 650) : 0);
      target = hostile.sort((a, b) => raidScore(b) - raidScore(a))[0];
    }
  }
  if (type === "expansion") {
    const expansionScore = (node: ZoneNode) => node.income
      + (!node.owner && profile.strategy.expansionFocus === "neutral" ? 900 : 0)
      + (node.type === "anomaly" && profile.strategy.expansionFocus === "anomalies" ? 1300 : 0);
    target = frontier.sort((a, b) => expansionScore(b) - expansionScore(a))[0];
  }
  if (type === "defense") target = threatened ?? base;
  if (type === "recovery") target = base;
  if (!target) {
    target = frontier[0] ?? base;
    type = target && target !== base ? "expansion" : "recovery";
  }
  const reasons: Record<DirectiveType, string> = {
    manual: "Приказы определяет игрок",
    defense: `${profile.doctrine}: усиление удерживаемой территории`,
    expansion: `${profile.doctrine}: захват приоритетного плацдарма`,
    raid: `${profile.doctrine}: удар по выбранной цели`,
    artifacts: `${profile.doctrine}: выход к аномальному полю`,
    recovery: `${profile.doctrine}: пополнение людей и запасов`,
  };
  return { type, targetNodeId: target?.id ?? null, issuedAt: state.simMinute, reason: reasons[type] };
}

function refreshDirectives(state: GameState) {
  for (const faction of PLAYABLE_FACTIONS) {
    if (faction === state.playerFaction && state.campaignMode === "faction") {
      state.directives[faction] = { type: "manual", targetNodeId: null, issuedAt: state.simMinute, reason: "Приказы определяет игрок" };
      continue;
    }
    state.directives[faction] = chooseDirective(state, faction);
    state.alifeStats.directivesIssued += 1;
  }
  state.nextDirectiveAt = state.simMinute + 90;
}

function runFactionAi(state: GameState, faction: PlayableFactionId) {
  if (faction === state.playerFaction && state.campaignMode === "faction") return;
  if (getFactionCondition(state, faction) === "destroyed") return;
  const profile = FACTION_PROFILES[faction];
  const base = state.nodes.find((node) => node.baseFor === faction);
  const combatUnits = livingSquads(state).filter((squad) => squad.faction === faction && squad.unitKind === "combat" && !squad.homeGarrison && !isPlayerControlledSquad(state, squad));
  const strategic = getFactionBalanceSummary(state, faction);
  const reserveFraction = strategic.mobilization === "emergency" ? .15 : strategic.mobilization === "full" ? .45 : .9;
  if (base?.owner === faction && combatUnits.length < strategic.armyLimit && state.factionFunds[faction] >= getFactionHireCost(faction, "Новички") + strategic.reserveTarget * reserveFraction) {
    const chance = randomStep(state.rngSeed);
    state.rngSeed = chance.seed;
    if (chance.value > 0.46) {
      const desiredRank = profile.recruitment[Math.floor(chance.value * profile.recruitment.length) % profile.recruitment.length];
      const rank = getFactionHireCost(faction, desiredRank) <= state.factionFunds[faction] ? desiredRank : "Новички";
      const cost = getFactionHireCost(faction, rank);
      const recruitsNeeded = profile.roster[rank].fighters;
      if (state.factionStrategy[faction].manpower >= recruitsNeeded) {
        state.factionFunds[faction] -= cost;
        state.factionStrategy[faction].manpower -= recruitsNeeded;
        state.factionStrategy[faction].supply = Math.max(0, state.factionStrategy[faction].supply - 2.5);
        const recruit = makeSquad(faction, base.id, combatUnits.length + Math.floor(state.simMinute), rank);
        resetTacticalPosition(recruit, state.playerFaction);
        state.squads.push(recruit);
        combatUnits.push(recruit);
        addLog(state, `${FACTIONS[faction].name}: по доктрине «${profile.doctrine}» сформирован отряд «${getSquadArchetype(recruit)?.name}».`, "system");
      }
    }
  }

  const directive = state.directives[faction];
  const target = directive?.targetNodeId ? nodeById(state, directive.targetNodeId) : null;
  const idle = combatUnits.filter((squad) => squad.status === "idle" && squad.mission !== "seek_shelter" && !(squad.mission === "defend" && squad.missionTargetId && state.simMinute - squad.missionIssuedAt < 120));
  for (const [index, squad] of idle.entries()) {
    if (directive?.type === "recovery") {
      if (squad.nodeId === base?.id) {
        const missingFighters = Math.max(0, (squad.maxFighters ?? squad.fighters) - squad.fighters);
        const replacements = Math.min(2, missingFighters);
        const replacementCost = replacements * 480;
        if (replacements > 0 && state.factionFunds[faction] >= replacementCost && state.factionStrategy[faction].manpower >= replacements) {
          state.factionFunds[faction] -= replacementCost;
          state.factionStrategy[faction].manpower -= replacements;
          squad.fighters += replacements;
          const staffedStrength = squad.maxStrength * (squad.fighters / Math.max(1, squad.maxFighters));
          squad.strength = Math.min(squad.maxStrength, Math.max(squad.strength, staffedStrength * 0.72));
        }
        if (squad.strength < squad.maxStrength && state.factionFunds[faction] >= 700 && state.factionStrategy[faction].supply >= 3) {
          state.factionFunds[faction] -= 700;
          state.factionStrategy[faction].supply = Math.max(0, state.factionStrategy[faction].supply - 1.5);
          squad.strength = Math.min(squad.maxStrength, squad.strength + 22);
        }
        if (state.factionFunds[faction] >= 260 && state.factionStrategy[faction].supply >= 2) {
          state.factionFunds[faction] -= 260;
          state.factionStrategy[faction].supply = Math.max(0, state.factionStrategy[faction].supply - 1);
          squad.ammo = squad.maxAmmo;
        }
        squad.magazine = squad.magazineSize;
        squad.stamina = squad.maxStamina;
        squad.suppression = 0;
        squad.morale = Math.min(100, (squad.morale ?? 60) + 12);
        squad.mission = "hold";
      } else if (base) beginMission(state, squad, "defend", base.id);
      continue;
    }

    const commander = squad.commander;
    if (commander && commander.loyalty < 35 && commander.autonomy >= 62 && state.simMinute - squad.missionIssuedAt >= 60) {
      const dissentRoll = randomStep(state.rngSeed);
      state.rngSeed = dissentRoll.seed;
      const dissentChance = (35 - commander.loyalty) / 100 + commander.autonomy / 500;
      if (dissentRoll.value < dissentChance) {
        const selfChosen = commander.disposition === "cautious"
          ? nearestNode(state, squad.nodeId, (node) => node.owner === faction && (node.type === "base" || node.type === "shelter"))
          : commander.disposition === "greedy"
            ? nearestNode(state, squad.nodeId, (node) => node.type === "anomaly" && (!node.owner || node.owner === faction || areHostile(state, faction, node.owner)))
            : nearestNode(state, squad.nodeId, (node) => node.mapLevel !== "sector" && node.owner !== faction && node.income >= 800 && (!node.owner || areHostile(state, faction, node.owner)));
        const independentMission: MissionType = commander.disposition === "cautious" ? "defend" : commander.disposition === "greedy" ? "artifacts" : "raid";
        if (selfChosen && selfChosen.node.id !== squad.nodeId && beginMission(state, squad, independentMission, selfChosen.node.id, selfChosen.path)) {
          addLog(state, `Командир ${commander.name} («${FACTIONS[faction].name}») проигнорировал директиву штаба и выбрал собственную цель «${selfChosen.node.name}».`, "system");
          continue;
        }
      }
    }

    // A patrol is a deliberate sortie, not a new order on every AI update.
    // Keep the unit on station for three hours after the previous route before
    // sending it out again; otherwise short neighbouring links inflate both
    // traffic and the patrol counter.
    if (index > 0 && state.simMinute - squad.missionIssuedAt >= 180) {
      const current = nodeById(state, squad.nodeId);
      const patrolTarget = current ? nodeConnections(current).map((id) => nodeById(state, id)).find((node) => node?.owner === faction) : null;
      if (patrolTarget && beginMission(state, squad, "patrol", patrolTarget.id)) {
        state.alifeStats.patrolsStarted += 1;
        continue;
      }
    }
    if (!target || target.id === squad.nodeId) {
      squad.mission = directive?.type === "defense" ? "defend" : "hold";
      continue;
    }
    const mission: MissionType = directive.type === "raid" ? "raid" : directive.type === "artifacts" ? "artifacts" : directive.type === "defense" ? "defend" : "expand";
    if (beginMission(state, squad, mission, target.id) && mission === "raid") state.alifeStats.raidsStarted += 1;
  }
}

function makeCaravan(state: GameState, faction: PlayableFactionId, base: ZoneNode, target: ZoneNode) {
  const caravan = makeSquad(faction, base.id, 5000 + state.simMinute + state.alifeStats.caravansDispatched, "Новички");
  caravan.id = `caravan-${faction}-${state.simMinute}-${state.alifeStats.caravansDispatched}`;
  caravan.name = `КАР-${FACTIONS[faction].short}-${state.alifeStats.caravansDispatched + 1}`;
  caravan.unitKind = "caravan";
  caravan.mission = "trade";
  caravan.strength = 58;
  caravan.maxStrength = 58;
  caravan.attack = 3;
  caravan.fighters = 3;
  caravan.maxFighters = 3;
  caravan.morale = 58;
  caravan.archetypeId = null;
  caravan.cargo = Math.round((1200 + target.income * 1.4) * FACTION_PROFILES[faction].economy.caravan);
  resetTacticalPosition(caravan, state.playerFaction);
  beginMission(state, caravan, "trade", target.id);
  return caravan;
}

function dispatchCaravans(state: GameState) {
  for (const faction of PLAYABLE_FACTIONS) {
    if (getFactionCondition(state, faction) !== "active") continue;
    if (livingSquads(state).some((squad) => squad.faction === faction && squad.unitKind === "caravan")) continue;
    const base = state.nodes.find((node) => node.baseFor === faction && node.owner === faction);
    const targets = state.nodes.filter((node) => node.mapLevel !== "sector" && node.owner === faction && node.id !== base?.id);
    const target = targets.sort((a, b) => b.income - a.income).find((node) => base && findPath(state, base.id, node.id).length > 1);
    if (!base || !target) continue;
    const roll = randomStep(state.rngSeed);
    state.rngSeed = roll.seed;
    if (roll.value < 0.28) continue;
    const caravan = makeCaravan(state, faction, base, target);
    state.squads.push(caravan);
    state.alifeStats.caravansDispatched += 1;
    addLog(state, `${FACTIONS[faction].name}: караван ${caravan.name} вышел к точке «${target.name}».`, faction === state.playerFaction ? "success" : "system");
  }
  state.nextCaravanAt = state.simMinute + 150;
}

function resolveCaravans(state: GameState) {
  for (const caravan of livingSquads(state).filter((squad) => squad.unitKind === "caravan" && squad.status === "idle")) {
    const current = nodeById(state, caravan.nodeId)!;
    const base = state.nodes.find((node) => node.baseFor === caravan.faction && node.owner === caravan.faction);
    if (!base) continue;
    if (current.owner !== caravan.faction) {
      beginMission(state, caravan, "trade", base.id);
      continue;
    }
    if (caravan.cargo > 0 && caravan.nodeId === caravan.missionTargetId) {
      const delivered = caravan.cargo;
      caravan.cargo = 0;
      state.factionFunds[caravan.faction] += delivered;
      if (caravan.faction === state.playerFaction) state.rubles += delivered;
      state.alifeStats.tradesCompleted += 1;
      // The A-Life dashboard already exposes total deliveries. Keep the main
      // journal readable by reporting individual deliveries only for the
      // player's faction; foreign caravan dispatches and losses remain visible.
      if (caravan.faction === state.playerFaction) {
        addLog(state, `${caravan.name} доставил груз в «${current.name}»: +${delivered.toLocaleString("ru-RU")} ₽.`, "success");
      }
      const escorted = livingSquads(state, current.id).some((squad) => squad.faction === state.playerFaction && squad.unitKind === "combat" && squad.status !== "moving");
      if (escorted) advanceContracts(state, "escort", 1, caravan.id);
      beginMission(state, caravan, "trade", base.id);
    } else if (caravan.cargo === 0 && caravan.nodeId === base.id) {
      const target = state.nodes.filter((node) => node.mapLevel !== "sector" && node.owner === caravan.faction && node.id !== base.id)
        .sort((a, b) => b.income - a.income).find((node) => findPath(state, base.id, node.id).length > 1);
      if (target) {
        caravan.cargo = Math.round((1000 + target.income * 1.2) * FACTION_PROFILES[caravan.faction as PlayableFactionId].economy.caravan);
        beginMission(state, caravan, "trade", target.id);
      }
    } else if (caravan.nodeId === caravan.missionTargetId) {
      beginMission(state, caravan, "trade", base.id);
    }
  }
}

function spawnMutants(state: GameState) {
  if (livingSquads(state).filter((squad) => squad.unitKind === "mutant").length >= 10) {
    state.nextMutantSpawnAt = state.simMinute + 120;
    return;
  }
  const lairs = state.nodes.filter((node) => node.mapLevel !== "sector" && (node.type === "anomaly" || ["forester", "garbage", "swamps"].includes(node.id)));
  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  const lair = lairs[Math.floor(roll.value * lairs.length) % lairs.length];
  const location = getLocationContent(lair.id, lair.sectorId, lair.type);
  const campaignTier = Math.min(3, Math.floor(state.simMinute / 1800));
  const habitat = lair.sectorId ?? lair.id;
  const types = (Object.keys(MUTANT_COMBAT) as MutantType[]).filter((candidate) => {
    const spec = MUTANT_COMBAT[candidate];
    const threatTier = ["dogs", "flesh", "boar"].includes(candidate) ? 0 : ["pseudodog", "snork", "bloodsucker", "poltergeist"].includes(candidate) ? 1 : ["burer", "controller"].includes(candidate) ? 2 : 3;
    return threatTier <= campaignTier && (spec.habitats.includes(habitat) || location.mutantPressure >= .82);
  });
  let type = types[state.alifeStats.mutantSpawns % Math.max(1, types.length)] ?? "dogs";
  const controllerCount = livingSquads(state).filter((squad) => squad.mutantType === "controller").length;
  if (type === "controller" && controllerCount >= 3) type = state.alifeStats.mutantSpawns % 2 ? "dogs" : "flesh";
  const mutant = makeSquad("mutants", lair.id, 7000 + state.simMinute + state.alifeStats.mutantSpawns, "Опытные", false, type);
  resetTacticalPosition(mutant, state.playerFaction);
  state.squads.push(mutant);
  state.alifeStats.mutantSpawns += 1;
  state.nextMutantSpawnAt = state.simMinute + 105;
  addLog(state, `A-Life: у точки «${lair.name}» замечен ${MUTANT_LABELS[type].toLowerCase()}.`, "danger");
}

function eventLoot(state: GameState, node: ZoneNode, severity: number) {
  const location = getLocationContent(node.id, node.sectorId, node.type);
  const maxTier = Math.min(3, Math.max(location.lootTier, severity) - (severity === 1 ? 1 : 0));
  const pool = (Object.keys(ZONE_ITEMS) as ZoneItemId[]).filter((id) => {
    const item = ZONE_ITEMS[id];
    return item.category !== "mutant_part" && item.tier <= maxTier && (item.rarity !== "legendary" || severity === 3 && location.lootTier === 3);
  });
  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  return pool[Math.floor(roll.value * pool.length) % Math.max(1, pool.length)] ?? "medkit";
}

function createWorldEvent(state: GameState) {
  if (state.worldEvents.filter((event) => event.status === "active").length >= 4) {
    state.nextWorldEventAt = state.simMinute + 90;
    return;
  }
  const sequence = state.worldEventSequence++;
  const type = (["stash_signal", "distress_call", "anomaly_surge", "mutant_migration", "psi_storm", "faction_skirmish"] as WorldEventType[])[sequence % 6];
  const candidates = state.nodes.filter((node) => node.mapLevel !== "sector" && (type !== "anomaly_surge" || node.type === "anomaly"));
  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  let node = candidates[Math.floor(roll.value * candidates.length) % candidates.length];
  if (type === "psi_storm") {
    node = candidates.filter((candidate) => getLocationContent(candidate.id, candidate.sectorId, candidate.type).psi >= .25)[sequence % Math.max(1, candidates.filter((candidate) => getLocationContent(candidate.id, candidate.sectorId, candidate.type).psi >= .25).length)] ?? node;
  }
  const location = getLocationContent(node.id, node.sectorId, node.type);
  const severity = Math.max(1, Math.min(3, Math.round((location.lootTier + location.mutantPressure * 2) / 2))) as 1 | 2 | 3;
  let faction: FactionId | null = node.owner;
  let targetSquadId: string | null = null;
  let title = WORLD_EVENT_LABELS[type];
  let description = `Событие зафиксировано в районе «${node.name}».`;

  if (type === "stash_signal") description = `Перехвачен короткий маяк. Контейнер лежит в районе «${node.name}», но сигнал могли услышать другие группы.`;
  if (type === "anomaly_surge") description = `Поле у точки «${node.name}» нестабильно: выход артефактов вырос, вместе с ним поднялась радиация и активность мутантов.`;
  if (type === "psi_storm") description = `Локальный пси-фрон накрыл «${node.name}». Незащищённые группы теряют мораль и боеспособность.`;
  if (type === "distress_call") {
    const distressed = livingSquads(state, node.id).find((squad) => squad.faction !== "mutants" && squad.faction !== state.playerFaction) ?? livingSquads(state).find((squad) => squad.faction !== "mutants" && squad.faction !== state.playerFaction && !squad.homeGarrison);
    if (distressed) {
      node = nodeById(state, distressed.nodeId)!;
      faction = distressed.faction;
      targetSquadId = distressed.id;
      distressed.strength = Math.min(distressed.strength, distressed.maxStrength * .42);
      distressed.morale = Math.min(distressed.morale, 34);
      title = `SOS: ${distressed.name}`;
      description = `${distressed.commander?.callsign ?? distressed.name} запрашивает помощь у точки «${node.name}». Сигнал реальный, группа ранена.`;
    }
  }
  if (type === "mutant_migration") {
    const lair = state.nodes.filter((candidate) => candidate.mapLevel !== "sector" && candidate.id !== node.id).sort((a, b) => getLocationContent(b.id, b.sectorId, b.type).mutantPressure - getLocationContent(a.id, a.sectorId, a.type).mutantPressure)[sequence % 6];
    const dangerousTypes: MutantType[] = severity === 3 ? ["chimera", "pseudogiant", "controller"] : severity === 2 ? ["snork", "bloodsucker", "pseudodog"] : ["dogs", "flesh", "boar"];
    const mutant = makeSquad("mutants", lair?.id ?? node.id, 9000 + sequence, "Опытные", false, dangerousTypes[sequence % dangerousTypes.length]);
    resetTacticalPosition(mutant, state.playerFaction);
    state.squads.push(mutant);
    beginMission(state, mutant, "hunt", node.id);
    targetSquadId = mutant.id;
    faction = "mutants";
    title = `МИГРАЦИЯ: ${MUTANT_LABELS[mutant.mutantType!]}`;
    description = `${MUTANT_LABELS[mutant.mutantType!]} движется к району «${node.name}». Это физическая группа на карте, а не фоновое сообщение.`;
  }
  if (type === "faction_skirmish") {
    const defender = node.owner && node.owner !== "mutants" ? node.owner : null;
    const attacker = defender ? livingSquads(state).find((squad) => squad.faction !== defender && squad.faction !== "mutants" && !squad.homeGarrison && squad.status === "idle" && areHostile(state, squad.faction, defender)) : null;
    if (attacker && beginMission(state, attacker, "raid", node.id)) {
      faction = attacker.faction;
      targetSquadId = attacker.id;
      title = `СТЫЧКА: ${FACTIONS[attacker.faction].name} → ${node.name}`;
      description = `${attacker.name} получил приказ проверить оборону точки «${node.name}». Исход изменит контроль и отношения группировок.`;
    }
  }

  state.worldEvents.push({ id: `world-${sequence}`, type, status: "active", nodeId: node.id, faction, targetSquadId, startedAt: state.simMinute, expiresAt: state.simMinute + 150 + severity * 45, resolvedAt: null, severity, title, description });
  state.alifeStats.worldEvents += 1;
  state.nextWorldEventAt = state.simMinute + 120 + severity * 25;
  addLog(state, `${title}: ${description}`, type === "stash_signal" || type === "distress_call" ? "system" : "danger");
}

function maintainWorldEvents(state: GameState, delta: number) {
  for (const event of state.worldEvents.filter((item) => item.status === "active")) {
    const node = nodeById(state, event.nodeId);
    if (!node) {
      event.status = "failed";
      event.resolvedAt = state.simMinute;
      continue;
    }
    const playerPresent = livingSquads(state, node.id).some((squad) => squad.faction === state.playerFaction && squad.unitKind === "combat" && squad.status !== "moving");
    const hostilePresent = livingSquads(state, node.id).some((squad) => areHostile(state, state.playerFaction, squad.faction));
    if (event.type === "stash_signal" && playerPresent && !hostilePresent) {
      const itemId = eventLoot(state, node, event.severity);
      addStashItem(state, itemId);
      event.status = "resolved";
      event.resolvedAt = state.simMinute;
      state.alifeStats.eventsResolved += 1;
      advanceContracts(state, "salvage", 1, node.id);
      addLog(state, `Тайник у точки «${node.name}» вскрыт. На склад доставлен предмет «${ZONE_ITEMS[itemId].name}».`, "success");
    }
    if (event.type === "distress_call" && playerPresent && event.targetSquadId) {
      const rescued = state.squads.find((squad) => squad.id === event.targetSquadId && squad.status !== "dead");
      if (rescued) {
        rescued.strength = Math.min(rescued.maxStrength, rescued.strength + 28);
        rescued.morale = Math.min(100, rescued.morale + 24);
        if (rescued.faction !== "mutants") adjustBilateralDiplomacy(state, state.playerFaction, rescued.faction as PlayableFactionId, { trust: 6, cooperation: 8, tension: -3 });
        addStashItem(state, "army_medkit");
        state.reputation = clampDiplomacy(state.reputation + 3);
        event.status = "resolved";
        event.resolvedAt = state.simMinute;
        state.alifeStats.eventsResolved += 1;
        addLog(state, `Группа «${rescued.name}» спасена у точки «${node.name}». Получена армейская аптечка, репутация выросла.`, "success");
      }
    }
    if (event.type === "psi_storm") {
      for (const squad of livingSquads(state, node.id).filter((item) => item.faction !== "mutants")) {
        const protection = getSquadEquipmentEffects(squad).psi;
        squad.suppression = Math.min(100, squad.suppression + delta * event.severity * .7 * (1 - protection));
        squad.morale = Math.max(0, squad.morale - delta * event.severity * .18 * (1 - protection));
        if (protection < .2 && squad.suppression > 82) applySquadDamage(squad, delta * event.severity * .18, state);
      }
    }
    if (event.type === "mutant_migration" && event.targetSquadId) {
      const mutant = state.squads.find((squad) => squad.id === event.targetSquadId);
      if (!mutant || mutant.status === "dead") {
        event.status = "resolved";
        event.resolvedAt = state.simMinute;
        state.alifeStats.eventsResolved += 1;
      }
    }
    if (event.type === "faction_skirmish" && event.targetSquadId) {
      const raider = state.squads.find((squad) => squad.id === event.targetSquadId);
      if (!raider || raider.status === "dead" || node.owner === raider.faction) {
        event.status = node.owner === raider?.faction ? "resolved" : "failed";
        event.resolvedAt = state.simMinute;
        if (event.status === "resolved") state.alifeStats.eventsResolved += 1;
      }
    }
    if (event.status === "active" && state.simMinute >= event.expiresAt) {
      event.status = event.type === "anomaly_surge" || event.type === "psi_storm" ? "resolved" : "failed";
      event.resolvedAt = state.simMinute;
      if (event.status === "resolved") state.alifeStats.eventsResolved += 1;
      if (event.type === "distress_call" && event.targetSquadId) {
        const abandoned = state.squads.find((squad) => squad.id === event.targetSquadId);
        if (abandoned && abandoned.status !== "dead") applySquadDamage(abandoned, 32 * event.severity, state);
      }
    }
  }
  state.worldEvents = state.worldEvents.filter((event) => event.status === "active" || state.simMinute - (event.resolvedAt ?? state.simMinute) <= 720).slice(-30);
}

function runMutantAi(state: GameState) {
  const prey = livingSquads(state).filter((squad) => squad.faction !== "mutants");
  const huntPressure = new Map<string, number>();
  for (const hunter of livingSquads(state).filter((squad) => squad.unitKind === "mutant" && squad.mission === "hunt" && squad.missionTargetId)) {
    huntPressure.set(hunter.missionTargetId!, (huntPressure.get(hunter.missionTargetId!) ?? 0) + 1);
  }
  for (const mutant of livingSquads(state).filter((squad) => squad.unitKind === "mutant" && squad.status === "idle" && squad.mission !== "seek_shelter")) {
    const current = nodeById(state, mutant.nodeId)!;
    const roll = randomStep(state.rngSeed);
    state.rngSeed = roll.seed;
    if (mutant.mutantType === "flesh" || roll.value < 0.3) {
      const links = nodeConnections(current);
      if (links.length) beginMission(state, mutant, "roam", links[Math.floor(roll.value * links.length) % links.length]);
      continue;
    }
    let target: { squad: Squad; path: string[]; score: number } | null = null;
    for (const candidate of prey) {
      if ((huntPressure.get(candidate.nodeId) ?? 0) >= 2) continue;
      const path = findPath(state, mutant.nodeId, candidate.nodeId);
      if (!path.length) continue;
      let preference = 0;
      if ((mutant.mutantType === "dogs" || mutant.mutantType === "pseudodog") && candidate.unitKind === "caravan") preference += 5;
      if (mutant.mutantType === "chimera" && candidate.strength < candidate.maxStrength * .65) preference += 4;
      if (mutant.mutantType === "controller") preference += Math.max(0, 70 - candidate.morale) / 18;
      if (mutant.mutantType === "pseudogiant" && nodeById(state, candidate.nodeId)?.type === "base") preference += 5;
      if (mutant.mutantType === "snork" && nodeById(state, candidate.nodeId)?.type === "shelter") preference += 3;
      const score = preference - path.length;
      if (!target || score > target.score) target = { squad: candidate, path, score };
    }
    if (target && beginMission(state, mutant, "hunt", target.squad.nodeId, target.path)) {
      huntPressure.set(target.squad.nodeId, (huntPressure.get(target.squad.nodeId) ?? 0) + 1);
      state.alifeStats.mutantAttacks += 1;
      if (target.squad.faction === state.playerFaction) addLog(state, `${mutant.name} движется к вашим силам у точки «${nodeById(state, target.squad.nodeId)?.name}».`, "danger");
    }
  }
}

function orderAutonomousShelter(state: GameState) {
  for (const squad of livingSquads(state)) {
    if (squad.homeGarrison) continue;
    const current = nodeById(state, squad.nodeId)!;
    if (current.type === "base" || current.type === "shelter") continue;
    if (squad.faction === state.playerFaction && squad.unitKind === "combat") continue;
    const shelter = nearestNode(state, squad.nodeId, (node) => node.type === "base" || node.type === "shelter");
    if (shelter && beginMission(state, squad, "seek_shelter", shelter.node.id, shelter.path)) state.alifeStats.shelterOrders += 1;
  }
}

function resolveEmission(state: GameState) {
  const converted: Squad[] = [];
  let mutantCapacity = Math.max(0, 12 - livingSquads(state).filter((squad) => squad.unitKind === "mutant").length);
  let controllerCapacity = Math.max(0, 3 - livingSquads(state).filter((squad) => squad.mutantType === "controller").length);
  let sheltered = 0;
  for (const squad of livingSquads(state)) {
    const node = nodeById(state, squad.nodeId)!;
    if (node.type === "base" || node.type === "shelter" || squad.homeGarrison) {
      sheltered += 1;
      if (squad.mission === "seek_shelter") {
        squad.mission = squad.faction === state.playerFaction && squad.unitKind === "combat" ? "player" : squad.unitKind === "mutant" ? "roam" : "hold";
        squad.missionTargetId = null;
        squad.missionPath = [];
      }
      continue;
    }
    const roll = randomStep(state.rngSeed);
    state.rngSeed = roll.seed;
    const location = getLocationContent(node.id, node.sectorId, node.type);
    const equipment = getSquadEquipmentEffects(squad);
    const resistance = squad.unitKind === "mutant" ? 0.55 : FACTION_PROFILES[squad.faction as PlayableFactionId].combat.emissionDamage * (1 - equipment.radiation);
    const damage = (58 + roll.value * 42) * resistance * (1 + location.radiation * .55);
    const casualties = applySquadDamage(squad, damage, state);
    resolveCommanderCasualty(state, squad, casualties);
    if (squad.strength <= 0) {
      squad.status = "dead";
    } else if (squad.faction !== "mutants" && squad.strength < 24 && mutantCapacity > 0 && controllerCapacity > 0 && converted.length < 3) {
      squad.status = "dead";
      squad.fighters = 0;
      squad.morale = 0;
      converted.push(makeSquad("mutants", squad.nodeId, Math.floor(state.simMinute + roll.value * 1000), "Опытные", false, "controller"));
      mutantCapacity -= 1;
      controllerCapacity -= 1;
    }
  }
  for (const mutant of converted) resetTacticalPosition(mutant, state.playerFaction);
  state.squads.push(...converted);
  state.alifeStats.mutantSpawns += converted.length;
  for (const squad of livingSquads(state).filter((item) => item.mission === "seek_shelter")) {
    squad.mission = squad.faction === state.playerFaction && squad.unitKind === "combat" ? "player" : squad.unitKind === "mutant" ? "roam" : "hold";
    squad.missionTargetId = null;
    squad.missionPath = [];
  }
  state.alifeStats.emissionsSurvived += sheltered;
  addLog(state, `ВЫБРОС ПРОШЁЛ. В укрытиях спаслись ${sheltered} групп; силы в поле понесли потери.`, "danger");
  state.nextEmissionAt = state.simMinute + 480;
  state.emissionWarned = false;
  state.nextDirectiveAt = Math.min(state.nextDirectiveAt, state.simMinute + 3);
}

function resolveALifeMissions(state: GameState) {
  resolveCaravans(state);
  for (const squad of livingSquads(state).filter((item) => item.status === "idle" && item.unitKind !== "caravan")) {
    if (squad.mission === "seek_shelter") continue;
    if (!squad.missionTargetId || squad.nodeId !== squad.missionTargetId) continue;
    const node = nodeById(state, squad.nodeId)!;
    const hostile = livingSquads(state, node.id).some((other) => squadsAreHostile(state, squad, other));
    if (hostile) continue;
    if (squad.mission === "artifacts" && node.type === "anomaly" && node.owner === squad.faction) {
      const profile = FACTION_PROFILES[squad.faction as PlayableFactionId];
      state.factionFunds[squad.faction] += Math.round(900 * profile.economy.artifactYield * profile.economy.artifactValue);
      addLog(state, `${FACTIONS[squad.faction].name}: группа вернулась с артефактами из района «${node.name}».`, "info");
      const operation = state.operations.find((item) => item.issuerFaction === squad.faction && item.type === "artifacts" && item.targetNodeId === node.id && (item.status === "planned" || item.status === "active"));
      if (operation) {
        operation.status = "succeeded";
        operation.resolvedAt = state.simMinute;
      }
    }
    squad.mission = squad.faction === state.playerFaction && squad.unitKind === "combat" ? "player" : squad.unitKind === "mutant" ? "roam" : "hold";
    squad.missionTargetId = null;
    squad.missionPath = [];
  }
}

function pruneSimulationDebris(state: GameState) {
  if (state.squads.length > 180) {
    const living = state.squads.filter((squad) => squad.status !== "dead");
    const recentDead = state.squads.filter((squad) => squad.status === "dead").slice(-48);
    state.squads = [...living, ...recentDead];
  }
  if (Object.keys(state.squadDiplomacy).length > 320) {
    state.squadDiplomacy = Object.fromEntries(Object.entries(state.squadDiplomacy).sort(([, left], [, right]) => right.lastContactAt - left.lastContactAt).slice(0, 260));
  }
}

function runAi(state: GameState) {
  if (state.simMinute >= state.nextDirectiveAt) refreshDirectives(state);
  for (const faction of PLAYABLE_FACTIONS) runFactionAi(state, faction);
  runMutantAi(state);
  syncStrategicOperations(state, true);
}

function updateFactionSurvival(state: GameState) {
  for (const faction of PLAYABLE_FACTIONS) {
    const survival = state.factionSurvival[faction];
    if (survival.condition === "destroyed") continue;
    const base = state.nodes.find((node) => node.baseFor === faction);
    const hasBase = base?.owner === faction;
    const combatForces = livingSquads(state).filter((squad) => squad.faction === faction && squad.unitKind === "combat");
    const nextCondition: FactionCondition = hasBase ? "active" : combatForces.length ? "remnant" : "destroyed";
    if (nextCondition === survival.condition) continue;

    const previousCondition = survival.condition;
    survival.condition = nextCondition;
    if (nextCondition === "remnant") {
      survival.baseLostAt ??= state.simMinute;
      addLog(state, `${FACTIONS[faction].name}: штаб потерян. Оставшиеся отряды переходят к борьбе за возвращение базы.`, faction === state.playerFaction ? "danger" : "system");
    } else if (nextCondition === "active") {
      survival.baseLostAt = null;
      survival.destroyedAt = null;
      addLog(state, `${FACTIONS[faction].name}: штаб возвращён, командная сеть восстановлена.`, faction === state.playerFaction ? "success" : "danger");
    } else {
      survival.destroyedAt = state.simMinute;
      for (const node of state.nodes.filter((node) => node.owner === faction)) {
        node.owner = null;
        node.capture = 0;
        node.captureFaction = null;
      }
      for (const offer of state.diplomaticOffers.filter((offer) => offer.faction === faction && offer.status === "pending")) offer.status = "expired";
      for (const other of PLAYABLE_FACTIONS.filter((id) => id !== faction)) {
        state.relations[relationKey(faction, other)] = "neutral";
        const bilateral = getBilateralDiplomacy(state, faction, other);
        bilateral.tradePact = false;
        bilateral.defensePact = false;
        bilateral.nonAggressionUntil = null;
      }
      addLog(state, `${FACTIONS[faction].name}: после потери штаба уничтожены последние организованные силы. Территории распались.`, faction === state.playerFaction ? "danger" : "success");
    }

    if (previousCondition === "remnant" && nextCondition === "active") state.reputation = clampDiplomacy(state.reputation + (faction === state.playerFaction ? 2 : 0));
  }
}

function factionCombatPower(state: GameState, faction: PlayableFactionId) {
  return livingSquads(state)
    .filter((squad) => squad.faction === faction && squad.unitKind === "combat")
    .reduce((sum, squad) => sum + squad.strength * (1 + squad.weaponTier * 0.08 + squad.armorTier * 0.06), 0);
}

function commonEnemy(state: GameState, a: PlayableFactionId, b: PlayableFactionId) {
  return PLAYABLE_FACTIONS.find((faction) => faction !== a && faction !== b && faction !== "monolith" && getRelation(state, a, faction) === "war" && getRelation(state, b, faction) === "war") ?? null;
}

function factionsShareBorder(state: GameState, a: PlayableFactionId, b: PlayableFactionId) {
  return state.nodes.some((node) => node.mapLevel !== "sector" && node.owner === a && nodeConnections(node).some((linkedId) => nodeById(state, linkedId)?.owner === b));
}

function setAutomatedRelation(state: GameState, a: PlayableFactionId, b: PlayableFactionId, relation: Relation, reason: string) {
  const key = relationKey(a, b);
  if (state.relations[key] === relation) return;
  state.relations[key] = relation;
  const bilateral = getBilateralDiplomacy(state, a, b);
  bilateral.lastChangedAt = state.simMinute;
  if (relation === "war") {
    bilateral.tradePact = false;
    bilateral.defensePact = false;
    bilateral.nonAggressionUntil = null;
  } else if (relation === "truce") {
    bilateral.defensePact = false;
    bilateral.nonAggressionUntil = state.simMinute + 1440;
  } else if (relation === "alliance") {
    bilateral.tradePact = true;
    bilateral.defensePact = true;
    bilateral.nonAggressionUntil = null;
  }
  addLog(state, `Дипсеть: «${FACTIONS[a].name}» и «${FACTIONS[b].name}» — ${reason}.`, relation === "war" ? "danger" : relation === "alliance" ? "success" : "system");
}

function reviewFactionDiplomacy(state: GameState) {
  for (let left = 0; left < PLAYABLE_FACTIONS.length; left += 1) {
    for (let right = left + 1; right < PLAYABLE_FACTIONS.length; right += 1) {
      const a = PLAYABLE_FACTIONS[left];
      const b = PLAYABLE_FACTIONS[right];
      const bilateral = getBilateralDiplomacy(state, a, b);
      const compatibility = INITIAL_PAIR_AFFINITY[relationKey(a, b)] ?? 0;
      const relation = getRelation(state, a, b);
      if (bilateral.nonAggressionUntil && bilateral.nonAggressionUntil <= state.simMinute) {
        bilateral.nonAggressionUntil = null;
        if (relation === "truce") {
          state.relations[relationKey(a, b)] = "neutral";
          addLog(state, `Дипсеть: срок пакта о ненападении между «${FACTIONS[a].name}» и «${FACTIONS[b].name}» истёк.`, "system");
        }
      }
      if (a === state.playerFaction || b === state.playerFaction || a === "monolith" || b === "monolith") continue;
      if (getFactionCondition(state, a) === "destroyed" || getFactionCondition(state, b) === "destroyed") {
        bilateral.tradePact = false;
        bilateral.defensePact = false;
        bilateral.nonAggressionUntil = null;
        continue;
      }
      if (bilateral.nextReviewAt > state.simMinute) continue;
      bilateral.nextReviewAt = state.simMinute + 120;

      const sharedEnemy = commonEnemy(state, a, b);
      const border = factionsShareBorder(state, a, b);
      if (sharedEnemy) adjustBilateralDiplomacy(state, a, b, { trust: bilateral.trust < 55 ? 1 : 0, cooperation: bilateral.cooperation < 65 ? 3 : 0, tension: bilateral.tension > 14 ? -1 : 0 });
      if (bilateral.tradePact) adjustBilateralDiplomacy(state, a, b, { trust: bilateral.trust < 45 ? 1 : 0, cooperation: bilateral.cooperation < 55 ? 2 : 0, tension: bilateral.tension > 12 ? -2 : 0 });
      else if (border && relation === "neutral") adjustBilateralDiplomacy(state, a, b, { tension: 3 });

      const incidentRoll = randomStep(state.rngSeed);
      state.rngSeed = incidentRoll.seed;
      if (border && relation === "neutral" && bilateral.tension >= 52 && !bilateral.nonAggressionUntil && incidentRoll.value < 0.28) {
        adjustBilateralDiplomacy(state, a, b, { trust: -6, tension: 12, incidents: 1 });
        addLog(state, `Дипсеть: пограничный инцидент между «${FACTIONS[a].name}» и «${FACTIONS[b].name}». Напряжение растёт.`, "danger");
      }

      const currentRelation = getRelation(state, a, b);
      const aBalance = getFactionBalanceSummary(state, a);
      const bBalance = getFactionBalanceSummary(state, b);
      if (currentRelation === "war") {
        const aPower = Math.max(1, factionCombatPower(state, a));
        const bPower = Math.max(1, factionCombatPower(state, b));
        const weakerRatio = Math.min(aPower, bPower) / Math.max(aPower, bPower);
        const exhaustion = Math.max(aBalance.warWeariness, bBalance.warWeariness);
        const supplyCollapse = Math.min(aBalance.supply, bBalance.supply) < 22;
        adjustBilateralDiplomacy(state, a, b, { tension: exhaustion >= 60 ? -4 : -1 });
        if (exhaustion >= 72 || supplyCollapse || (weakerRatio < 0.38 && bilateral.incidents >= 2 && bilateral.tension < 90) || (bilateral.tension <= 34 && bilateral.trust >= -35)) {
          setAutomatedRelation(state, a, b, "truce", "перемирие после истощения сил");
          adjustBilateralDiplomacy(state, a, b, { trust: 6, tension: -24, cooperation: 4 });
          state.factionStrategy[a].warWeariness = Math.max(0, state.factionStrategy[a].warWeariness - 8);
          state.factionStrategy[b].warWeariness = Math.max(0, state.factionStrategy[b].warWeariness - 8);
        }
        continue;
      }

      if (currentRelation === "alliance") {
        if (bilateral.tension >= 72 || bilateral.trust <= -32) {
          bilateral.defensePact = false;
          if (bilateral.trust < -45) bilateral.tradePact = false;
          setAutomatedRelation(state, a, b, "neutral", "союз распался из-за накопленного недоверия");
        }
        continue;
      }

      if (bilateral.tension >= 84 && bilateral.trust <= -28 && bilateral.incidents >= 2 && !bilateral.nonAggressionUntil) {
        const aPower = factionCombatPower(state, a);
        const bPower = factionCombatPower(state, b);
        const aggressorBalance = aPower >= bPower ? aBalance : bBalance;
        if (aggressorBalance.warWeariness < 58 && aggressorBalance.supply >= 36 && aggressorBalance.readiness >= 48) {
          setAutomatedRelation(state, a, b, "war", "переговоры сорваны после серии пограничных столкновений");
        } else {
          adjustBilateralDiplomacy(state, a, b, { tension: -8, cooperation: 2 });
          addLog(state, `Дипсеть: «${FACTIONS[a].name}» и «${FACTIONS[b].name}» отказались от новой войны — армии не готовы к кампании.`, "system");
        }
        continue;
      }
      if (!bilateral.tradePact && bilateral.trust >= 22 && bilateral.tension <= 38 && (compatibility >= 10 || bilateral.jointBattles >= 2)) {
        bilateral.tradePact = true;
        adjustBilateralDiplomacy(state, a, b, { trust: 5, cooperation: 10, tension: -4 });
        addLog(state, `Дипсеть: «${FACTIONS[a].name}» и «${FACTIONS[b].name}» открыли торговый коридор.`, "success");
        continue;
      }
      if (currentRelation === "neutral" && !bilateral.nonAggressionUntil && bilateral.tension >= 44 && bilateral.tension <= 72 && bilateral.trust >= -8) {
        setAutomatedRelation(state, a, b, "truce", "подписан пакт о ненападении на 24 часа");
        adjustBilateralDiplomacy(state, a, b, { trust: 4, tension: -14, cooperation: 4 });
        continue;
      }
      if (sharedEnemy && bilateral.trust >= 52 && bilateral.cooperation >= 48 && bilateral.tension <= 30 && (compatibility >= 10 || bilateral.jointBattles >= 2)) {
        setAutomatedRelation(state, a, b, "alliance", `оборонительный союз против «${FACTIONS[sharedEnemy].name}»`);
        adjustBilateralDiplomacy(state, a, b, { trust: 10, cooperation: 14, tension: -10 });
      }
    }
  }
  state.nextFactionDiplomacyAt = state.simMinute + 90;
}

function demandedPlayerTerritory(state: GameState, faction: PlayableFactionId) {
  return state.nodes
    .filter((node) => node.mapLevel !== "sector" && node.owner === state.playerFaction && !node.baseFor && nodeConnections(node).some((id) => nodeById(state, id)?.owner === faction))
    .sort((a, b) => b.income - a.income)[0] ?? null;
}

function createDiplomaticOffer(state: GameState, faction: PlayableFactionId, type: DiplomaticOfferType, cost: number, demandedNodeId: string | null = null) {
  const offer: DiplomaticOffer = {
    id: `dip-${state.diplomaticOfferSequence}`,
    faction,
    type,
    status: "pending",
    cost,
    demandedNodeId,
    issuedAt: state.simMinute,
    expiresAt: state.simMinute + 180,
  };
  state.diplomaticOfferSequence += 1;
  state.diplomaticOffers.push(offer);
  state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 360;
  const demanded = demandedNodeId ? nodeById(state, demandedNodeId)?.name : null;
  const message = type === "truce"
    ? `предлагает прекратить войну${cost ? ` за компенсацию ${cost.toLocaleString("ru-RU")} ₽` : " без условий"}`
    : type === "alliance"
      ? "предлагает оформить военный союз и открыть совместный торговый коридор"
      : type === "trade_pact"
        ? "предлагает открыть взаимный торговый коридор"
        : type === "non_aggression"
          ? "предлагает пакт о ненападении на 24 игровых часа"
      : type === "territory"
        ? `требует передать точку «${demanded}» под угрозой войны`
        : `требует выплатить ${cost.toLocaleString("ru-RU")} ₽ под угрозой войны`;
  addLog(state, `Входящий канал — ${FACTIONS[faction].name}: ${message}.`, type === "alliance" || type === "truce" ? "success" : "danger");
}

function maintainDiplomaticOffers(state: GameState) {
  for (const offer of state.diplomaticOffers) {
    if (offer.status !== "pending" || state.simMinute < offer.expiresAt) continue;
    offer.status = "expired";
    if (offer.type === "tribute" || offer.type === "territory") {
      state.relations[relationKey(state.playerFaction, offer.faction)] = "war";
      const bilateral = getBilateralDiplomacy(state, state.playerFaction, offer.faction);
      bilateral.tradePact = false;
      bilateral.defensePact = false;
      bilateral.nonAggressionUntil = null;
      adjustBilateralDiplomacy(state, state.playerFaction, offer.faction, { trust: -12, tension: 30, cooperation: -12, incidents: 1 });
      adjustFactionMemory(state, offer.faction, { trust: -8, grievance: 12 });
      addLog(state, `${FACTIONS[offer.faction].name}: срок ультиматума истёк. Объявлена война.`, "danger");
    }
  }
  state.diplomaticOffers = state.diplomaticOffers.filter((offer) => offer.status === "pending" || state.simMinute - offer.expiresAt < 720).slice(-12);

  if (state.simMinute < state.nextDiplomacyAt) return;
  let availableSlots = Math.max(0, 2 - state.diplomaticOffers.filter((offer) => offer.status === "pending").length);
  const playerPower = Math.max(1, factionCombatPower(state, state.playerFaction));
  for (const faction of PLAYABLE_FACTIONS) {
    if (!availableSlots || faction === state.playerFaction || faction === "monolith" || getFactionCondition(state, faction) === "destroyed") continue;
    const memory = state.diplomacyMemory[faction];
    if (memory.nextNegotiationAt > state.simMinute || state.diplomaticOffers.some((offer) => offer.faction === faction && offer.status === "pending")) continue;
    const relation = getRelation(state, state.playerFaction, faction);
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
    const factionPower = factionCombatPower(state, faction);
    if (relation === "war" && (memory.fear >= 50 || getFactionCondition(state, faction) === "remnant" || (factionPower < playerPower * 0.45 && memory.grievance <= 45))) {
      const terms = getDiplomacyTerms(state, faction);
      const cost = memory.fear >= 70 || getFactionCondition(state, faction) === "remnant" ? 0 : Math.round(terms.truceCost * 0.5);
      createDiplomaticOffer(state, faction, "truce", cost);
      availableSlots -= 1;
      continue;
    }
    if ((relation === "neutral" || relation === "truce") && memory.trust >= 45 && memory.grievance <= 25 && state.reputation >= 5 && getFactionCondition(state, faction) === "active") {
      createDiplomaticOffer(state, faction, "alliance", 0);
      availableSlots -= 1;
      continue;
    }
    if ((relation === "neutral" || relation === "truce") && memory.trust >= 20 && memory.grievance <= 40 && bilateral.tension <= 50 && !bilateral.tradePact) {
      createDiplomaticOffer(state, faction, "trade_pact", 0);
      availableSlots -= 1;
      continue;
    }
    if (relation === "neutral" && memory.trust >= 2 && memory.grievance <= 55 && bilateral.tension >= 34 && !bilateral.nonAggressionUntil) {
      createDiplomaticOffer(state, faction, "non_aggression", 0);
      availableSlots -= 1;
      continue;
    }
    if ((relation === "neutral" || relation === "truce") && memory.grievance >= 65) {
      const territory = demandedPlayerTerritory(state, faction);
      if (territory) createDiplomaticOffer(state, faction, "territory", 0, territory.id);
      else createDiplomaticOffer(state, faction, "tribute", Math.min(16000, 5000 + memory.grievance * 100));
      availableSlots -= 1;
    }
  }
  state.nextDiplomacyAt = state.simMinute + 120;
}

function rewardPlayerKill(state: GameState, defeated: Squad) {
  const node = nodeById(state, defeated.nodeId)!;
  const veteranLoot = defeated.rank === "Мастера" ? 3 : defeated.rank === "Ветераны" ? 2 : 1;
  const biological = defeated.faction === "mutants";
  if (!biological) {
    const defeatedFaction = defeated.faction as PlayableFactionId;
    adjustFactionMemory(state, defeatedFaction, {
      trust: defeated.unitKind === "caravan" ? -10 : -6,
      fear: defeated.unitKind === "caravan" ? 4 : 7,
      grievance: defeated.unitKind === "caravan" ? 16 : 10,
      playerKills: 1,
    });
    const supportedAllies = new Set(livingSquads(state, defeated.nodeId)
      .filter((squad) => squad.faction !== state.playerFaction && squad.faction !== "mutants" && getRelation(state, state.playerFaction, squad.faction) === "alliance" && areHostile(state, squad.faction, defeated.faction))
      .map((squad) => squad.faction as PlayableFactionId));
    for (const ally of supportedAllies) adjustFactionMemory(state, ally, { trust: 6, grievance: -4, aidReceived: 1 });
    if (supportedAllies.size) state.reputation = clampDiplomacy(state.reputation + 2);
  }
  const lootModifier = FACTION_PROFILES[state.playerFaction].economy.loot;
  const weaponLoot = biological ? 0 : Math.max(1, Math.round(veteranLoot * lootModifier));
  const armorLoot = biological ? 0 : defeated.rank === "Мастера" || defeated.rank === "Ветераны" ? Math.max(1, Math.round(lootModifier)) : 0;
  const supplyBase = biological ? (defeated.mutantType === "controller" || defeated.mutantType === "bloodsucker" ? 2 : 1) : 1 + veteranLoot;
  const supplyLoot = Math.max(1, Math.round(supplyBase * lootModifier));
  state.trophies.weapons += weaponLoot;
  state.trophies.armor += armorLoot;
  state.trophies.supplies += supplyLoot;
  const recovered: ZoneItemId[] = [];
  const lootRoll = randomStep(state.rngSeed);
  state.rngSeed = lootRoll.seed;
  if (biological && defeated.mutantType) {
    const part = MUTANT_PARTS[defeated.mutantType];
    const recoveryChance = defeated.mutantType === "dogs" || defeated.mutantType === "boar" ? .68 : .9;
    if (part && lootRoll.value <= recoveryChance) {
      addStashItem(state, part);
      recovered.push(part);
      state.alifeStats.specimensRecovered += 1;
      advanceContracts(state, "specimen", 1, part);
    }
  } else {
    const location = getLocationContent(node.id, node.sectorId, node.type);
    if (defeated.weaponId && lootRoll.value < Math.min(.9, .42 + veteranLoot * .14 + location.lootTier * .05)) {
      addStashItem(state, defeated.weaponId);
      recovered.push(defeated.weaponId);
    }
    if (defeated.armorId && lootRoll.value > .48 && (defeated.rank === "Ветераны" || defeated.rank === "Мастера")) {
      addStashItem(state, defeated.armorId);
      recovered.push(defeated.armorId);
    }
    const supplyId: ZoneItemId = defeated.rank === "Мастера" ? "army_medkit" : lootRoll.value > .55 ? "ammo_crate" : "medkit";
    addStashItem(state, supplyId);
    recovered.push(supplyId);
  }
  if (defeated.unitKind === "caravan" && defeated.cargo > 0) {
    const captured = Math.round(defeated.cargo * Math.min(0.98, 0.65 * lootModifier));
    state.rubles += captured;
    addLog(state, `Захвачен груз каравана ${defeated.name}: +${captured.toLocaleString("ru-RU")} ₽.`, "success");
    defeated.cargo = 0;
  }
  for (const ally of livingSquads(state, defeated.nodeId).filter((item) => item.faction === state.playerFaction)) ally.xp += 18 + veteranLoot * 7;
  advanceContracts(state, "eliminate", 1, defeated.faction);
  addLog(state, `Трофеи у точки «${node.name}»: оружие ${weaponLoot}, броня ${armorLoot}, припасы ${supplyLoot}.`, "success");
  if (recovered.length) addLog(state, `Предметная добыча: ${recovered.map((id) => `«${ZONE_ITEMS[id].name}»`).join(", ")}. Всё доставлено на склад группировки.`, "success");
}

function captureMinutesForNode(node: ZoneNode) {
  if (node.type === "base") return 105;
  if (node.type === "outpost") return 72;
  if (node.type === "anomaly") return 66;
  if (node.type === "shelter") return 60;
  if (node.type === "camp") return 56;
  return 48;
}

function maintainTerritorySecurity(state: GameState, delta: number) {
  for (const node of state.nodes) {
    if (!node.owner || node.owner === "mutants") {
      node.security = 0;
      continue;
    }
    const occupants = livingSquads(state, node.id).filter((squad) => squad.faction === node.owner && squad.unitKind === "combat" && squad.status !== "moving");
    const stationedFighters = occupants.reduce((sum, squad) => sum + squad.fighters, 0);
    const hostileBorder = nodeConnections(node).some((linkedId) => livingSquads(state, linkedId).some((squad) => areHostile(state, node.owner!, squad.faction)));
    const recovery = stationedFighters > 0
      ? delta * (.12 + Math.min(1.25, stationedFighters / 12) * .28)
      : hostileBorder ? -delta * .035 : delta * .012;
    node.security = Math.max(0, Math.min(100, (node.security ?? 100) + recovery));
  }
}

function resolveCombatAndCapture(state: GameState, delta: number) {
  const pendingDamage: Record<string, number> = {};
  const damageSources = new Map<string, Set<FactionId>>();
  const playerDamaged = new Set<string>();
  for (const attacker of livingSquads(state)) {
    if (attacker.status === "moving") continue;
    const enemies = livingSquads(state, attacker.nodeId).filter((target) => squadsAreHostile(state, attacker, target));
    if (!enemies.length) continue;
    attacker.status = "combat";
    const roll = randomStep(state.rngSeed);
    state.rngSeed = roll.seed;
    const target = enemies[Math.floor(roll.value * enemies.length)];
    if (attacker.faction === "mutants" && attacker.mutantType !== "controller") {
      const dx = target.tacticalX - attacker.tacticalX;
      const dy = target.tacticalY - attacker.tacticalY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const step = Math.min(7, delta * 0.9);
      attacker.tacticalX += (dx / length) * step;
      attacker.tacticalY += (dy / length) * step;
    } else if (attacker.faction !== "mutants" && attacker.magazine <= 0) {
      if (attacker.ammo > 0) {
        const loaded = Math.min(attacker.magazineSize, attacker.ammo);
        attacker.magazine = loaded;
        attacker.ammo -= loaded;
        attacker.stamina = Math.max(0, attacker.stamina - 2);
      }
      continue;
    }

    const combat = attacker.faction === "mutants" ? null : FORMATION_COMBAT[attacker.formation];
    const requiredRounds = combat ? Math.max(1, Math.ceil((delta * combat.burst) / 4)) : 1;
    const roundsUsed = attacker.faction === "mutants" ? 1 : Math.min(attacker.magazine, requiredRounds);
    const fireVolume = roundsUsed / requiredRounds;
    if (attacker.faction !== "mutants") attacker.magazine -= roundsUsed;
    const profile = getCombatProfile(state, attacker, target);
    const attackerEquipment = getSquadEquipmentEffects(attacker);
    const targetEquipment = getSquadEquipmentEffects(target);
    const weapons = (attacker.faction === state.playerFaction ? 1 + state.research.weapons * 0.12 : 1) * (1 + attacker.weaponTier * 0.06);
    const factionAttack = attacker.faction === "mutants" ? 1 : FACTION_PROFILES[attacker.faction].combat.attack;
    const attackerTerrain = controlledTerrain(state, attacker);
    const formationAttack = attacker.formation === "assault" ? 1.14 : attacker.formation === "sniper" && effectiveCombatCover(state, attacker) > 0 ? 1.28 : attacker.formation === "heavy" ? 1.06 : 1;
    const terrainAttack = 1 + (attackerTerrain?.attackBonus ?? 0);
    const playerArmor = target.faction === state.playerFaction ? 1 - state.research.armor * 0.1 : 1;
    const gearArmor = 1 - target.armorTier * 0.06;
    const equipmentArmor = 1 - targetEquipment.protection;
    const factionArmor = target.faction === "mutants" ? MUTANT_COMBAT[target.mutantType ?? "dogs"].damageTaken : FACTION_PROFILES[target.faction].combat.damageTaken;
    const formationArmor = target.formation === "heavy" ? 0.82 : 1;
    const staminaFactor = 0.7 + attacker.stamina / Math.max(1, attacker.maxStamina) * 0.3;
    const fighterFactor = 0.35 + (attacker.fighters / Math.max(1, attacker.maxFighters ?? attacker.fighters)) * 0.65;
    const moraleFactor = 0.72 + (attacker.morale ?? 60) / 360;
    const strategicAttack = attacker.faction === "mutants" ? 1 : .72 + state.factionStrategy[attacker.faction].supply / 100 * .28;
    const fatigueAttack = attacker.faction === "mutants" ? 1 : 1 - state.factionStrategy[attacker.faction].warWeariness / 100 * .14;
    const leadershipFactor = attacker.commander ? 0.9 + attacker.commander.leadership / 650 + attacker.commander.loyalty / 1400 : 1;
    const damage = delta * (attacker.attack / 17) * weapons * attackerEquipment.damage * factionAttack * formationAttack * terrainAttack * playerArmor * gearArmor * equipmentArmor * factionArmor * formationArmor * staminaFactor * fighterFactor * moraleFactor * strategicAttack * fatigueAttack * leadershipFactor * fireVolume * profile.rangeFactor * (profile.hitChance / 0.64) * (0.82 + roll.value * 0.36);
    pendingDamage[target.id] = (pendingDamage[target.id] ?? 0) + damage;
    const sources = damageSources.get(target.id) ?? new Set<FactionId>();
    sources.add(attacker.faction);
    damageSources.set(target.id, sources);
    if (attacker.mutantType === "controller") {
      const suppressionTaken = target.faction === "mutants" ? 1 : FACTION_PROFILES[target.faction].combat.suppressionTaken;
      target.suppression = Math.min(100, target.suppression + delta * 3.5 * suppressionTaken * (1 - targetEquipment.psi));
    }
    if (attacker.mutantType === "pseudogiant" || attacker.mutantType === "poltergeist") {
      target.suppression = Math.min(100, target.suppression + delta * (attacker.mutantType === "pseudogiant" ? 4.8 : 2.6) * (1 - targetEquipment.psi * .5));
    }
    if (attacker.faction === state.playerFaction) playerDamaged.add(target.id);
    if (attacker.faction !== "mutants") {
      const staminaDrain = attacker.formation === "assault" ? 1.15 : attacker.formation === "heavy" ? 0.95 : attacker.formation === "sniper" ? 0.52 : 0.72;
      attacker.stamina = Math.max(0, attacker.stamina - delta * staminaDrain);
    }
  }

  for (const [id, damage] of Object.entries(pendingDamage)) {
    const squad = state.squads.find((item) => item.id === id);
    if (!squad || squad.status === "dead") continue;
    const casualties = applySquadDamage(squad, damage, state);
    resolveCommanderCasualty(state, squad, casualties);
    const suppressionTaken = squad.faction === "mutants" ? 1 : FACTION_PROFILES[squad.faction].combat.suppressionTaken;
    squad.suppression = Math.min(100, squad.suppression + damage * 2.4 * suppressionTaken);
    squad.stamina = Math.max(0, squad.stamina - damage * 0.32);
    if (squad.strength <= 0.1) {
      squad.status = "dead";
      const node = nodeById(state, squad.nodeId)!;
      const sources = [...(damageSources.get(squad.id) ?? [])].filter((faction): faction is PlayableFactionId => faction !== "mutants");
      if (squad.faction !== "mutants") {
        const defeatedFaction = squad.faction as PlayableFactionId;
        for (const source of sources) {
          adjustBilateralDiplomacy(state, source, defeatedFaction, { trust: -7, tension: 12, incidents: 1 });
          for (const attacker of livingSquads(state, squad.nodeId).filter((item) => item.faction === source)) attacker.morale = Math.min(100, (attacker.morale ?? 60) + 4);
        }
        for (let left = 0; left < sources.length; left += 1) {
          for (let right = left + 1; right < sources.length; right += 1) {
            if (getRelation(state, sources[left], sources[right]) === "alliance") adjustBilateralDiplomacy(state, sources[left], sources[right], { trust: 3, cooperation: 6, jointBattles: 1, tension: -2 });
          }
        }
      }
      addLog(state, `${squad.name} (${FACTIONS[squad.faction].name}) уничтожен у точки «${node.name}».`, squad.faction === state.playerFaction ? "danger" : "success");
      if (squad.faction !== state.playerFaction && playerDamaged.has(squad.id)) rewardPlayerKill(state, squad);
    }
  }

  for (const squad of livingSquads(state)) {
    if (squad.status === "moving") continue;
    const hostile = livingSquads(state, squad.nodeId).some((other) => squadsAreHostile(state, squad, other));
    if (hostile) continue;
    const equipment = getSquadEquipmentEffects(squad);
    squad.stamina = Math.min(squad.maxStamina, squad.stamina + delta * (1.7 + equipment.recovery * 1.4));
    squad.suppression = Math.max(0, squad.suppression - delta * 3.2);
    squad.morale = Math.min(100, (squad.morale ?? 60) + delta * (nodeById(state, squad.nodeId)?.owner === squad.faction ? 0.22 : 0.1));
    if (squad.faction !== "mutants" && squad.magazine < squad.magazineSize && squad.ammo > 0) {
      const loaded = Math.min(squad.magazineSize - squad.magazine, squad.ammo);
      squad.magazine += loaded;
      squad.ammo -= loaded;
    }
    if (squad.unitKind !== "combat") {
      squad.status = "idle";
      continue;
    }
    if (state.campaignMode === "squad" && isPlayerControlledSquad(state, squad) && squad.approachMode !== "occupy") {
      squad.status = "idle";
      continue;
    }
    const node = nodeById(state, squad.nodeId)!;
    if (node.owner === squad.faction) {
      squad.status = "idle";
      node.capture = 0;
      node.captureFaction = null;
      continue;
    }
    if (node.owner && (!areHostile(state, squad.faction, node.owner) || squadHasFieldProtectionAgainstOwner(state, squad, node.owner))) {
      squad.status = "idle";
      continue;
    }
    squad.status = "capturing";
    if (node.captureFaction !== squad.faction) {
      node.captureFaction = squad.faction;
      node.capture = 0;
    }
    const capturers = livingSquads(state, node.id).filter((item) => item.faction === squad.faction && item.unitKind === "combat" && item.status !== "moving").sort((left, right) => left.id.localeCompare(right.id));
    if (capturers[0]?.id !== squad.id) continue;
    const captureManpower = capturers.reduce((sum, item) => sum + item.fighters, 0);
    const requiredManpower = node.type === "base" ? 10 : node.type === "outpost" ? 6 : node.type === "camp" ? 5 : 3;
    const averageMorale = capturers.reduce((sum, item) => sum + item.morale, 0) / Math.max(1, capturers.length);
    const doctrineCapture = FACTION_PROFILES[squad.faction as PlayableFactionId].combat.capture;
    const strategy = state.factionStrategy[squad.faction as PlayableFactionId];
    const strategic = getFactionBalanceSummary(state, squad.faction as PlayableFactionId);
    const manpowerFactor = Math.min(1.55, .55 + captureManpower / requiredManpower * .45);
    const moraleFactor = .65 + averageMorale / 285;
    const supplyFactor = .55 + strategy.supply / 100 * .45;
    const fatigueFactor = 1 - strategy.warWeariness / 100 * .3;
    const overextensionFactor = Math.max(.62, 1 - strategic.overextension * .07);
    const captureBonus = doctrineCapture * manpowerFactor * moraleFactor * supplyFactor * fatigueFactor * overextensionFactor * (squad.formation === "assault" ? 1.14 : 1) * (squad.faction === state.playerFaction ? 1 + state.research.recon * 0.08 : 1);
    const captureFactor = findSectorPoint(node.id)?.captureFactor ?? 1;
    const resistance = .72 + (node.security ?? 0) / 100 * .58;
    node.capture += (delta / (captureMinutesForNode(node) * captureFactor * resistance)) * captureBonus;
    if (node.capture >= 1) {
      const previous = node.owner;
      node.owner = squad.faction;
      node.capture = 0;
      node.captureFaction = null;
      node.security = 24;
      node.capturedAt = state.simMinute;
      for (const occupier of capturers) {
        occupier.status = "idle";
        occupier.approachMode = null;
        if (occupier.faction !== state.playerFaction) {
          occupier.mission = "defend";
          occupier.missionTargetId = node.id;
          occupier.missionIssuedAt = state.simMinute;
        }
      }
      strategy.territoriesCaptured += 1;
      strategy.lastCaptureAt = state.simMinute;
      strategy.supply = Math.max(0, strategy.supply - 3.5);
      strategy.warWeariness = Math.max(0, strategy.warWeariness - 1.5);
      if (previous && previous !== "mutants" && previous !== squad.faction) {
        const defenderStrategy = state.factionStrategy[previous as PlayableFactionId];
        defenderStrategy.territoriesLost += 1;
        defenderStrategy.warWeariness = Math.min(100, defenderStrategy.warWeariness + (node.type === "base" ? 10 : 4));
      }
      addLog(state, `${FACTIONS[squad.faction].name} захватили точку «${node.name}»${previous ? ` у группировки «${FACTIONS[previous].name}»` : ""}. Контроль нестабилен: нужен гарнизон для закрепления.`, squad.faction === state.playerFaction ? "success" : "danger");
      if (previous && previous !== "mutants" && previous !== squad.faction) {
        const baseMultiplier = node.baseFor === previous ? 2 : 1;
        adjustBilateralDiplomacy(state, squad.faction as PlayableFactionId, previous as PlayableFactionId, {
          trust: -8 * baseMultiplier,
          tension: 18 * baseMultiplier,
          incidents: 1,
        });
      }
      if (squad.faction === state.playerFaction) {
        advanceContracts(state, "capture", 1, node.id);
        if (previous && previous !== "mutants" && previous !== state.playerFaction) {
          const baseMultiplier = node.baseFor === previous ? 2 : 1;
          adjustFactionMemory(state, previous as PlayableFactionId, {
            trust: -10 * baseMultiplier,
            fear: 9 * baseMultiplier,
            grievance: 18 * baseMultiplier,
            territoriesLost: 1,
          });
        }
      }
    }
  }
}

function checkEndState(state: GameState) {
  if (state.campaignMode === "squad") {
    const playerSquad = state.squads.find((squad) => squad.id === state.playerSquadId);
    state.defeat = !playerSquad || playerSquad.status === "dead" || playerSquad.fighters <= 0;
    state.victory = false;
    return;
  }
  const playerBases = state.nodes.filter((node) => node.baseFor === state.playerFaction && node.owner === state.playerFaction);
  state.defeat = !playerBases.length;
  const hostileSurvivors = PLAYABLE_FACTIONS.filter((faction) => faction !== state.playerFaction && getFactionCondition(state, faction) !== "destroyed" && areHostile(state, state.playerFaction, faction));
  state.victory = hostileSurvivors.length === 0 && state.nodes.filter((node) => node.owner === state.playerFaction).length >= 12;
}

function updateOperatives(state: GameState, delta: number) {
  const living = state.operatives.filter((operative) => operative.condition !== "dead" && operative.condition !== "left");
  for (const operative of living) {
    if (operative.actionUntil !== null && state.simMinute >= operative.actionUntil) {
      if (operative.order === "search") {
        const squad = state.squads.find((item) => item.id === operative.squadId);
        const node = squad ? nodeById(state, squad.nodeId) : null;
        const location = getLocationContent(node?.id ?? "unknown", node?.sectorId, node?.type);
        const itemId = eventLoot(state, node ?? state.nodes[0], Math.max(1, Math.min(3, location.lootTier)));
        addStashItem(state, itemId);
        const cash = 45 + operative.experience * 3 + location.lootTier * 35;
        state.rubles += cash;
        operative.trust = Math.min(100, operative.trust + (operative.trait === "greedy" ? 3 : 1));
        const danger = location.radiation + location.psi + location.mutantPressure;
        if (danger > 1.65 && randomStep(state.rngSeed).value < .28) {
          operative.health = Math.max(1, operative.health - 8 - location.lootTier * 3);
          operative.condition = operative.health < 35 ? "critical" : operative.health < 70 ? "wounded" : "healthy";
        }
        addLog(state, `${operative.callsign}: обыск точки «${node?.name ?? operative.orderTarget ?? "местность"}» закончен. Найдено «${ZONE_ITEMS[itemId].name}» и ${cash} ₽.`, "success");
      } else if (operative.order === "scout") {
        const squad = state.squads.find((item) => item.id === operative.squadId);
        const node = squad ? nodeById(state, squad.nodeId) : null;
        if (node) {
          const nearbyIds = nodeConnections(node);
          state.squadKnowledge.knownNodeIds = [...new Set([...state.squadKnowledge.knownNodeIds, node.id, ...nearbyIds])];
          const contacts = state.squads.filter((item) => item.status !== "dead" && (item.nodeId === node.id || nearbyIds.includes(item.nodeId)) && item.id !== squad?.id);
          contacts.forEach((item) => rememberSquad(state, item, "visual"));
          const hostileCount = contacts.filter((item) => item.faction === "mutants" || squadsAreHostile(state, squad!, item)).length;
          addSquadReport(state, hostileCount ? "danger" : "route", `РАЗВЕДКА: ${node.name}`, hostileCount ? `Обнаружено опасных групп: ${hostileCount}. Отмечены соседние подходы.` : `Подходы проверены. Обнаружено групп: ${contacts.length}.`, node.id, operative.squadId, 88);
          addLog(state, `${operative.callsign}: разведка точки «${node.name}» завершена — контактов ${contacts.length}, угроз ${hostileCount}.`, hostileCount ? "danger" : "success");
        }
      } else if (operative.order === "artifact") {
        const squad = state.squads.find((item) => item.id === operative.squadId);
        const node = squad ? nodeById(state, squad.nodeId) : null;
        const location = getLocationContent(node?.id ?? "unknown", node?.sectorId, node?.type);
        const roll = randomStep(state.rngSeed);
        state.rngSeed = roll.seed;
        const chance = Math.max(.08, Math.min(.72, .14 + location.lootTier * .14 - location.radiation * .08 + operative.experience / 500));
        const exposure = Math.round((location.radiation + location.psi) * 10);
        if (roll.value < chance) {
          state.artifacts += 1;
          state.rubles += 240 + location.lootTier * 120;
          addLog(state, `${operative.callsign}: у точки «${node?.name ?? operative.orderTarget ?? "аномалия"}» найден артефакт.`, "success");
        } else {
          operative.health = Math.max(1, operative.health - exposure);
          operative.condition = operative.health < 35 ? "critical" : operative.health < 70 ? "wounded" : "healthy";
          addLog(state, `${operative.callsign}: поиск артефакта у точки «${node?.name ?? operative.orderTarget ?? "аномалия"}» ничего не дал${exposure ? `; получено ${exposure} урона от среды` : ""}.`, exposure ? "danger" : "system");
        }
      } else if (operative.order === "rest") {
        operative.health = Math.min(operative.maxHealth, operative.health + 18);
        operative.morale = Math.min(100, operative.morale + 8);
        operative.condition = operative.health < 35 ? "critical" : operative.health < 70 ? "wounded" : "healthy";
        addLog(state, `${operative.callsign}: отдых закончен. Мораль и состояние восстановлены.`, "system");
      }
      operative.actionUntil = null;
      operative.order = "idle";
      operative.orderTarget = null;
    }

    if (operative.destinationX === null || operative.destinationY === null) continue;
    const dx = operative.destinationX - operative.localX;
    const dy = operative.destinationY - operative.localY;
    const distance = Math.hypot(dx, dy);
    const step = Math.min(distance, 1.7 * Math.sqrt(Math.max(1, delta)));
    if (distance > .01) {
      operative.localX += (dx / distance) * step;
      operative.localY += (dy / distance) * step;
    }
    if (distance <= step + .15) {
      operative.localX = operative.destinationX;
      operative.localY = operative.destinationY;
      operative.destinationX = null;
      operative.destinationY = null;
      if (operative.order === "move") operative.order = "idle";
      else if ((operative.order === "search" || operative.order === "scout" || operative.order === "artifact" || operative.order === "rest") && operative.actionUntil === null) {
        operative.actionUntil = state.simMinute + (operative.order === "search" ? 18 : operative.order === "scout" ? 24 : operative.order === "artifact" ? 36 : 45);
      }
    }
  }

  const squad = state.squads.find((item) => item.id === state.playerSquadId);
  if (squad) {
    squad.fighters = living.length;
    squad.maxFighters = Math.max(squad.maxFighters, state.operatives.length);
    if (!living.length) squad.status = "dead";
  }
}

export function tickGame(previous: GameState): GameState {
  if (previous.speed === 0 || previous.victory || previous.defeat) return previous;
  const state: GameState = {
    ...previous,
    simMinute: previous.simMinute + previous.speed,
    nodes: previous.nodes.map((node) => ({ ...node, links: [...node.links], localLinks: node.localLinks ? [...node.localLinks] : undefined })),
    squads: previous.squads.map((squad) => ({ ...squad, commander: squad.commander ? { ...squad.commander } : null, missionPath: [...squad.missionPath], artifactIds: [...(squad.artifactIds ?? [])] })),
    operatives: (previous.operatives ?? []).map((operative) => ({ ...operative })),
    factionFunds: { ...previous.factionFunds },
    factionStrategy: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.factionStrategy[faction] }])) as Record<PlayableFactionId, FactionStrategicState>,
    directives: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.directives[faction] }])) as Record<PlayableFactionId, FactionDirective>,
    alifeStats: { ...previous.alifeStats },
    research: { ...previous.research },
    trophies: { ...previous.trophies },
    stash: { ...previous.stash },
    discoveredItems: [...previous.discoveredItems],
    contracts: previous.contracts.map((contract) => ({ ...contract })),
    operations: previous.operations.map((operation) => ({ ...operation, assignedSquadIds: [...operation.assignedSquadIds] })),
    squadDiplomacy: Object.fromEntries(Object.entries(previous.squadDiplomacy).map(([key, memory]) => [key, { ...memory }])) as Record<string, SquadDiplomacyMemory>,
    squadKnowledge: cloneSquadKnowledge(previous.squadKnowledge),
    deceptionPlot: previous.deceptionPlot ? { ...previous.deceptionPlot } : null,
    fieldDeals: previous.fieldDeals.map((deal) => ({ ...deal })),
    worldEvents: previous.worldEvents.map((event) => ({ ...event })),
    relations: { ...previous.relations },
    factionDiplomacy: Object.fromEntries(Object.entries(previous.factionDiplomacy).map(([key, relation]) => [key, { ...relation }])) as Record<string, BilateralDiplomacy>,
    diplomacyMemory: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.diplomacyMemory[faction] }])) as Record<PlayableFactionId, FactionMemory>,
    factionSurvival: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.factionSurvival[faction] }])) as Record<PlayableFactionId, FactionSurvival>,
    diplomaticOffers: previous.diplomaticOffers.map((offer) => ({ ...offer })),
    log: [...previous.log],
  };
  const delta = state.speed;

  for (const squad of livingSquads(state)) {
    if (squad.status === "moving") {
      const doctrineSpeed = squad.faction === "mutants" ? 1 : FACTION_PROFILES[squad.faction].combat.speed;
      const formationSpeed = squad.formation === "heavy" ? 0.8 : squad.formation === "assault" ? 1.08 : 1;
      const unitSpeed = squad.mutantType ? MUTANT_COMBAT[squad.mutantType].speed : squad.unitKind === "caravan" ? 0.86 : 1;
      const equipmentSpeed = Math.max(.58, 1 + getSquadEquipmentEffects(squad).mobility);
      const strategicSupply = squad.faction === "mutants" ? 100 : state.factionStrategy[squad.faction].supply;
      const supplySpeed = .72 + strategicSupply / 100 * .28;
      const destinationNode = squad.destinationId ? nodeById(state, squad.destinationId) : null;
      const locationTravel = getLocationContent(destinationNode?.id ?? squad.nodeId, destinationNode?.sectorId, destinationNode?.type).travel;
      const routeMinutes = squad.destinationId
        ? getSectorRoute(squad.nodeId, squad.destinationId)?.minutes ?? 28
        : 28;
      squad.travel += (delta / (routeMinutes * locationTravel)) * doctrineSpeed * formationSpeed * unitSpeed * equipmentSpeed * supplySpeed;
      squad.stamina = Math.max(15, squad.stamina - delta * (squad.formation === "heavy" ? 0.75 : 0.5));
      squad.suppression = Math.max(0, squad.suppression - delta * 2);
      if (squad.travel >= 1) finishArrival(state, squad);
    }
  }

  updateOperatives(state, delta);
  maintainDeceptionPlot(state);

  resolveSquadDiplomacy(state);
  resolveCombatAndCapture(state, delta);
  maintainDeceptionPlot(state);
  maintainTerritorySecurity(state, delta);
  maintainWorldEvents(state, delta);
  updateFactionSurvival(state);
  resolveALifeMissions(state);

  while (state.simMinute >= state.nextIncomeAt) {
    resolveIncome(state);
    state.nextIncomeAt += 30;
  }
  if (state.simMinute >= state.nextAiAt) {
    runAi(state);
    state.nextAiAt = state.simMinute + 18;
  }
  if (state.simMinute >= state.nextCaravanAt) dispatchCaravans(state);
  if (state.simMinute >= state.nextMutantSpawnAt) spawnMutants(state);
  if (state.simMinute >= state.nextWorldEventAt) createWorldEvent(state);
  let warnedThisTick = false;
  if (!state.emissionWarned && state.simMinute >= state.nextEmissionAt - 30) {
    state.emissionWarned = true;
    state.speed = 0;
    warnedThisTick = true;
    addLog(state, "ВНИМАНИЕ: приближается Выброс. Время остановлено — уведите мобильные отряды на базы или в капитальные укрытия.", "danger");
    orderAutonomousShelter(state);
  }
  if (!warnedThisTick && state.simMinute >= state.nextEmissionAt) resolveEmission(state);
  if (state.simMinute >= state.nextFactionDiplomacyAt) reviewFactionDiplomacy(state);
  syncStrategicOperations(state);
  maintainDiplomaticOffers(state);
  maintainContracts(state);
  pruneSimulationDebris(state);
  refreshSquadKnowledge(state);
  checkEndState(state);
  return state;
}

export function issueOperativeOrder(
  previous: GameState,
  operativeIds: string[],
  order: OperativeOrder,
  destination?: { x: number; y: number },
  target?: string,
): GameState {
  if (previous.campaignMode !== "squad" || !operativeIds.length) return previous;
  const playerSquad = previous.squads.find((squad) => squad.id === previous.playerSquadId);
  if (!playerSquad || playerSquad.status === "moving" || playerSquad.status === "dead") return previous;
  const state: GameState = {
    ...previous,
    operatives: previous.operatives.map((operative) => ({ ...operative })),
    log: [...previous.log],
  };
  const selected = state.operatives.filter((operative) => operativeIds.includes(operative.id) && operative.condition !== "dead" && operative.condition !== "left");
  if (!selected.length) return previous;
  const leader = state.operatives.find((operative) => operative.squadId === state.playerSquadId && operative.specialization === "leader" && operative.condition !== "dead" && operative.condition !== "left") ?? selected[0];
  let accepted = 0;
  for (const operative of selected) {
    const riskySearch = (order === "search" || order === "artifact") && /аном|радиац|подвал|труп|лаборатор|болот/i.test(target ?? "");
    const refusesRisk = operative.trait === "coward" && riskySearch && (operative.morale < 48 || operative.trust < 52);
    const refusesRest = operative.trait === "aggressive" && order === "rest" && operative.health > 84 && operative.morale > 55;
    if (refusesRisk || refusesRest) {
      operative.trust = Math.max(0, operative.trust - 2);
      addLog(state, `${operative.callsign} отказался: ${refusesRisk ? "слишком опасно" : "считает отдых пустой тратой времени"}.`, "danger");
      continue;
    }

    accepted += 1;
    operative.order = order;
    operative.orderTarget = target ?? null;
    operative.actionUntil = null;
    if (order === "hold") {
      operative.destinationX = null;
      operative.destinationY = null;
    } else if (order === "follow") {
      const offset = selected.indexOf(operative) * 2.5;
      operative.destinationX = Math.max(3, Math.min(97, leader.localX - 3 + offset));
      operative.destinationY = Math.max(3, Math.min(97, leader.localY + 4));
    } else if (destination) {
      const index = selected.indexOf(operative);
      const column = index % 3;
      const row = Math.floor(index / 3);
      operative.destinationX = Math.max(3, Math.min(97, destination.x + (column - 1) * 2.2));
      operative.destinationY = Math.max(3, Math.min(97, destination.y + row * 2.4));
    } else if (order === "search" || order === "scout" || order === "artifact" || order === "rest") {
      operative.destinationX = null;
      operative.destinationY = null;
      operative.actionUntil = state.simMinute + (order === "search" ? 18 : order === "scout" ? 24 : order === "artifact" ? 36 : 45);
    }
    if (order === "search" && operative.trait === "greedy") operative.morale = Math.min(100, operative.morale + 3);
  }
  if (accepted) addLog(state, `${accepted > 1 ? `Группа (${accepted})` : selected.find((operative) => operative.order === order)?.callsign ?? "Боец"}: приказ «${OPERATIVE_ORDER_LABELS[order]}».`, "system");
  return state;
}

export function issueMove(previous: GameState, squadId: string, destinationId: string): GameState {
  const state = { ...previous, squads: previous.squads.map((squad) => ({ ...squad, missionPath: [...squad.missionPath] })), log: [...previous.log] };
  const squad = state.squads.find((item) => item.id === squadId);
  const destination = nodeById(state, destinationId);
  if (!squad || !destination || !isPlayerControlledSquad(state, squad) || squad.unitKind !== "combat" || squad.status === "dead" || squad.status === "combat" || squad.homeGarrison) return previous;
  const current = nodeById(state, squad.nodeId);
  if (!current?.links.includes(destinationId) || squad.status === "moving") return previous;
  squad.destinationId = destinationId;
  squad.status = "moving";
  squad.travel = 0;
  squad.cover = 0;
  squad.mission = "player";
  squad.missionTargetId = destinationId;
  squad.missionPath = [];
  squad.missionIssuedAt = state.simMinute;
  squad.approachMode = "travel";
  state.selectedNodeId = destinationId;
  addLog(state, `${squad.name}: переход к точке «${destination.name}».`, "system");
  return state;
}

export function issueSectorMove(previous: GameState, squadId: string, destinationId: string): GameState {
  const state = { ...previous, squads: previous.squads.map((squad) => ({ ...squad, missionPath: [...squad.missionPath] })), log: [...previous.log] };
  const squad = state.squads.find((item) => item.id === squadId);
  const destination = nodeById(state, destinationId);
  if (!squad || !destination || !isPlayerControlledSquad(state, squad) || squad.unitKind !== "combat" || squad.status === "dead" || squad.status === "combat" || squad.homeGarrison) return previous;
  const current = nodeById(state, squad.nodeId);
  if (
    !current?.sectorId ||
    current.sectorId !== destination.sectorId ||
    !current.localLinks?.includes(destinationId) ||
    squad.status === "moving"
  ) return previous;
  squad.destinationId = destinationId;
  squad.status = "moving";
  squad.travel = 0;
  squad.cover = 0;
  squad.mission = "player";
  squad.missionTargetId = destinationId;
  squad.missionPath = [];
  squad.missionIssuedAt = state.simMinute;
  squad.approachMode = "travel";
  state.selectedNodeId = destinationId;
  addLog(state, `${squad.name}: локальный переход к точке «${destination.name}».`, "system");
  return state;
}

function clonePlayerInteractionState(previous: GameState): GameState {
  return {
    ...previous,
    nodes: previous.nodes.map((node) => ({ ...node, links: [...node.links], localLinks: node.localLinks ? [...node.localLinks] : undefined })),
    squads: previous.squads.map((squad) => ({ ...squad, commander: squad.commander ? { ...squad.commander } : null, missionPath: [...squad.missionPath], artifactIds: [...squad.artifactIds] })),
    factionFunds: { ...previous.factionFunds },
    relations: { ...previous.relations },
    factionDiplomacy: Object.fromEntries(Object.entries(previous.factionDiplomacy).map(([key, relation]) => [key, { ...relation }])) as Record<string, BilateralDiplomacy>,
    diplomacyMemory: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.diplomacyMemory[faction] }])) as Record<PlayableFactionId, FactionMemory>,
    squadDiplomacy: Object.fromEntries(Object.entries(previous.squadDiplomacy).map(([key, memory]) => [key, { ...memory }])) as Record<string, SquadDiplomacyMemory>,
    squadKnowledge: cloneSquadKnowledge(previous.squadKnowledge),
    deceptionPlot: previous.deceptionPlot ? { ...previous.deceptionPlot } : null,
    fieldDeals: previous.fieldDeals.map((deal) => ({ ...deal })),
    alifeStats: { ...previous.alifeStats },
    stash: { ...previous.stash },
    contracts: previous.contracts.map((contract) => ({ ...contract })),
    log: [...previous.log],
  };
}

function accessFactionAtNode(state: GameState, node: ZoneNode, actor: Squad): FactionId | null {
  if (node.owner && node.owner !== actor.faction) return node.owner;
  return livingSquads(state, node.id).find((other) => other.id !== actor.id && other.faction !== actor.faction)?.faction ?? node.owner;
}

function passageScore(state: GameState, actor: Squad, owner: FactionId) {
  if (owner === "mutants" || actor.faction === "mutants") return -100;
  const relation = isNeutralPlayerSquad(state, actor) ? "neutral" : getRelation(state, actor.faction, owner);
  const bilateral = getBilateralDiplomacy(state, actor.faction as PlayableFactionId, owner as PlayableFactionId);
  const factionMemory = owner === "mutants" ? null : state.diplomacyMemory[owner as PlayableFactionId];
  const neutralAdjustment = isNeutralPlayerSquad(state, actor) && factionMemory ? factionMemory.trust - factionMemory.grievance * .7 : 0;
  return bilateral.trust - bilateral.tension * .32 + neutralAdjustment + state.reputation * .28 + (relation === "alliance" ? 45 : relation === "truce" ? 18 : relation === "war" ? -65 : 0);
}

function declareFieldAttack(state: GameState, attacker: Squad, defenderFaction: FactionId) {
  if (attacker.faction === "mutants" || defenderFaction === "mutants" || attacker.faction === defenderFaction) return;
  state.relations[relationKey(attacker.faction, defenderFaction)] = "war";
  adjustBilateralDiplomacy(state, attacker.faction as PlayableFactionId, defenderFaction as PlayableFactionId, { trust: -20, tension: 32, incidents: 1 });
  if (attacker.faction === state.playerFaction) adjustFactionMemory(state, defenderFaction as PlayableFactionId, { trust: -18, fear: 4, grievance: 22 });
}

export function issueLocationApproach(
  previous: GameState,
  squadId: string,
  destinationId: string,
  mode: LocationApproach,
): GameState {
  const actorBefore = previous.squads.find((squad) => squad.id === squadId);
  const destinationBefore = nodeById(previous, destinationId);
  if (!actorBefore || !destinationBefore || !isPlayerControlledSquad(previous, actorBefore) || actorBefore.status === "dead" || actorBefore.status === "combat" || actorBefore.status === "moving") return previous;
  const currentBefore = nodeById(previous, actorBefore.nodeId);
  const sameNode = actorBefore.nodeId === destinationId;
  const localRoute = Boolean(currentBefore?.localLinks?.includes(destinationId));
  if (!sameNode && !currentBefore?.links.includes(destinationId) && !localRoute) return previous;
  if (sameNode && mode !== "occupy") return previous;

  const owner = accessFactionAtNode(previous, destinationBefore, actorBefore);
  const neutralPeace = owner && isNeutralPlayerSquad(previous, actorBefore) && owner !== "monolith" && owner !== "mutants" && previous.diplomacyMemory[owner as PlayableFactionId].grievance < 45;
  if ((mode === "travel" || mode === "peaceful") && owner && owner !== actorBefore.faction && areHostile(previous, actorBefore.faction, owner) && !neutralPeace) return previous;
  if (mode === "request_access" && owner && passageScore(previous, actorBefore, owner) < -18) {
    const denied = clonePlayerInteractionState(previous);
    addLog(denied, `Доступ к точке «${destinationBefore.name}» отклонён: командир гарнизона не доверяет отряду. Можно искать другой путь, предложить сделку или атаковать.`, "danger");
    return denied;
  }

  let state = sameNode
    ? clonePlayerInteractionState(previous)
    : localRoute
      ? issueSectorMove(previous, squadId, destinationId)
      : issueMove(previous, squadId, destinationId);
  if (state === previous) return previous;
  state = clonePlayerInteractionState(state);
  const actor = state.squads.find((squad) => squad.id === squadId)!;
  const destination = nodeById(state, destinationId)!;
  const accessFaction = accessFactionAtNode(state, destination, actor);
  actor.approachMode = mode;

  if ((mode === "attack" || mode === "ambush") && accessFaction && accessFaction !== actor.faction) {
    declareFieldAttack(state, actor, accessFaction);
    addLog(state, `${actor.name}: ${mode === "ambush" ? "скрытный выход и подготовка засады" : "боевой вход"} к точке «${destination.name}». Отношения с «${FACTIONS[accessFaction].name}» перешли в войну.`, "danger");
  } else if (mode === "request_access" && accessFaction && accessFaction !== "mutants" && accessFaction !== actor.faction) {
    const representative = livingSquads(state, destination.id).find((other) => other.faction === accessFaction && other.commander);
    if (representative && actor.commander) registerFieldDeal(state, "passage", actor, representative, actor, 720);
    addLog(state, `${FACTIONS[accessFaction].name}: проход к точке «${destination.name}» согласован. Отряд войдёт без боя, пока договор не нарушен.`, "success");
  } else if (mode === "occupy") {
    addLog(state, `${actor.name}: начато установление контроля над точкой «${destination.name}». Захват требует времени; после него точку придётся удерживать.`, "system");
  } else if (!sameNode) {
    addLog(state, `${actor.name}: мирный переход к точке «${destination.name}».`, "system");
  }
  state.selectedNodeId = destinationId;
  return state;
}

export function interactWithSquad(
  previous: GameState,
  actorId: string,
  targetId: string,
  action: SquadInteractionAction,
): GameState {
  const actorBefore = previous.squads.find((squad) => squad.id === actorId);
  const targetBefore = previous.squads.find((squad) => squad.id === targetId);
  if (!actorBefore || !targetBefore || actorBefore.id === targetBefore.id || !isPlayerControlledSquad(previous, actorBefore) || actorBefore.status === "dead" || targetBefore.status === "dead") return previous;
  if (action === "approach") return issueLocationApproach(previous, actorId, targetBefore.nodeId, squadsAreHostile(previous, actorBefore, targetBefore) ? "attack" : "peaceful");
  if (actorBefore.nodeId !== targetBefore.nodeId || actorBefore.status === "moving") return previous;

  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorId)!;
  const target = state.squads.find((squad) => squad.id === targetId)!;
  state.selectedSquadId = target.id;
  state.selectedNodeId = target.nodeId;
  state.tacticalTargetId = target.id;

  if (action === "attack" || action === "ambush") {
    declareFieldAttack(state, actor, target.faction);
    actor.status = "combat";
    target.status = "combat";
    if (action === "ambush") {
      actor.cover = Math.max(actor.cover, .62);
      target.suppression = Math.min(100, target.suppression + 38);
      target.morale = Math.max(0, target.morale - 10);
    }
    addLog(state, `${actor.name} ${action === "ambush" ? "открыл огонь из засады по" : "атаковал"} отряд «${target.name}».`, "danger");
    return state;
  }

  if (target.faction === "mutants") return previous;
  const memory = ensureSquadDiplomacy(state, actor, target);
  const accepted = passageScore(state, actor, target.faction) + memory.trust * .35 + (actor.commander?.leadership ?? 40) * .12 >= -12;
  memory.encounters += 1;
  memory.lastContactAt = state.simMinute;
  if (action === "request_passage") {
    if (accepted && actor.commander && target.commander) {
      registerFieldDeal(state, "passage", actor, target, actor, 720);
      addLog(state, `Полевой контакт: ${target.commander.name} разрешил отряду «${actor.name}» проход через контролируемую территорию.`, "success");
    } else {
      memory.grievance = clampPressure(memory.grievance + 4);
      addLog(state, `Полевой контакт: командир «${target.name}» отказал в проходе. Давить дальше опасно — растёт риск конфликта.`, "danger");
    }
  } else {
    memory.trust = clampDiplomacy(memory.trust + (accepted ? 3 : -1));
    if (accepted && actor.commander && target.commander && !activePairDeal(state, actor, target)) registerFieldDeal(state, "intelligence", actor, target, actor, 240);
    addLog(state, `Разговор с командиром отряда «${target.name}»: ${accepted ? "обменялись обстановкой и отметками опасных маршрутов" : "контакт получился холодным, но стрельбы удалось избежать"}.`, accepted ? "success" : "system");
  }
  return state;
}

function rememberSquad(state: GameState, squad: Squad, source: KnownSquadIntel["source"]) {
  state.squadKnowledge.knownSquads[squad.id] = {
    squadId: squad.id,
    nodeId: squad.nodeId,
    faction: squad.faction,
    name: squad.name,
    fighters: squad.fighters,
    seenAt: state.simMinute,
    source,
  };
  if (!state.squadKnowledge.knownNodeIds.includes(squad.nodeId)) state.squadKnowledge.knownNodeIds.push(squad.nodeId);
}

function addSquadReport(
  state: GameState,
  kind: SquadIntelReport["kind"],
  title: string,
  text: string,
  nodeId: string | null,
  sourceSquadId: string,
  reliability: number,
) {
  state.squadKnowledge.reports.push({
    id: `intel-${state.simMinute}-${state.fieldEventSequence++}`,
    kind,
    title,
    text,
    nodeId,
    sourceSquadId,
    createdAt: state.simMinute,
    expiresAt: state.simMinute + (kind === "route" ? 1440 : 480),
    reliability,
  });
}

function addSquadConversation(
  state: GameState,
  target: Squad,
  topic: SquadConversation["topic"],
  text: string,
  tone: SquadConversation["tone"] = "neutral",
) {
  state.squadKnowledge.conversations.push({
    id: `conversation-${state.simMinute}-${state.fieldEventSequence++}`,
    targetSquadId: target.id,
    topic,
    minute: state.simMinute,
    speaker: target.commander?.callsign ?? target.name,
    text,
    tone,
  });
  state.squadKnowledge.conversations = state.squadKnowledge.conversations.slice(-40);
}

export function getFactionRankLabel(squad: Squad) {
  if (squad.faction === "mutants") return "стая";
  const ladder = FACTION_CULTURES[squad.faction].hierarchy;
  if (squad.homeGarrison) return ladder[3];
  if (squad.rank === "Мастера" || getSquadMarkerIntel(squad).quality === "elite") return ladder[2];
  if (squad.rank === "Ветераны" || squad.rank === "Опытные") return ladder[1];
  return ladder[0];
}

export function getFactionRecruitmentAssessment(state: GameState, targetId: string): FactionRecruitmentAssessment {
  const actor = state.squads.find((squad) => squad.id === state.playerSquadId && squad.status !== "dead");
  const target = state.squads.find((squad) => squad.id === targetId && squad.status !== "dead" && squad.faction !== "mutants");
  if (!actor || !target || target.faction === "mutants") return { allowed: false, permanentlyClosed: true, trust: 0, trustRequired: 100, reputation: state.reputation, reputationRequired: 100, completedContracts: 0, contractsRequired: 99, reason: "Нет уполномоченного представителя." };
  const faction = target.faction as PlayableFactionId;
  const culture = FACTION_CULTURES[faction];
  const memory = state.squadDiplomacy[squadPairKey(actor.id, target.id)] ?? { trust: 0, respect: 0, grievance: 0, encounters: 0, deals: 0, betrayals: 0, lastContactAt: 0, nextContactAt: 0 };
  const completedContracts = state.contracts.filter((contract) => contract.status === "completed" && contract.issuerFaction === faction).length;
  const alreadyJoined = state.squadAllegiance === faction && actor.faction === faction;
  const closed = !culture.openRecruitment || faction === "monolith" || faction === "military";
  const allowed = !alreadyJoined && !closed && memory.trust >= culture.joinTrust && state.reputation >= culture.joinReputation && completedContracts >= culture.joinContracts && memory.betrayals === 0;
  const reason = alreadyJoined ? `Вы уже числитесь в группировке «${FACTIONS[faction].name}».`
    : closed ? culture.recruitment
      : memory.betrayals > 0 ? "Командир помнит сорванную сделку и даже не обсуждает приём."
        : memory.trust < culture.joinTrust ? `Нужно доверие отряда: ${memory.trust}/${culture.joinTrust}.`
          : state.reputation < culture.joinReputation ? `Нужна репутация: ${state.reputation}/${culture.joinReputation}.`
            : completedContracts < culture.joinContracts ? `Нужно выполнить заданий для группировки: ${completedContracts}/${culture.joinContracts}.`
              : "Командир готов поручиться за вас перед группировкой.";
  return { allowed, permanentlyClosed: closed, trust: memory.trust, trustRequired: culture.joinTrust, reputation: state.reputation, reputationRequired: culture.joinReputation, completedContracts, contractsRequired: culture.joinContracts, reason };
}

export function requestFactionMembership(previous: GameState, targetId: string): GameState {
  if (previous.campaignMode !== "squad" || !previous.playerSquadId) return previous;
  const assessment = getFactionRecruitmentAssessment(previous, targetId);
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId);
  const targetBefore = previous.squads.find((squad) => squad.id === targetId && squad.faction !== "mutants");
  if (!assessment.allowed || !actorBefore || !targetBefore || actorBefore.nodeId !== targetBefore.nodeId) return previous;
  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorBefore.id)!;
  const target = state.squads.find((squad) => squad.id === targetBefore.id)!;
  const faction = target.faction as PlayableFactionId;
  actor.faction = faction;
  actor.archetypeId = FACTION_PROFILES[faction].roster[rosterRank(actor.rank)].id;
  actor.name = `Группа «${actor.commander?.callsign ?? "Новички"}»`;
  state.playerFaction = faction;
  state.squadAllegiance = faction;
  state.selectedSquadId = actor.id;
  state.reputation += 4;
  addSquadConversation(state, target, "recruitment", `Поручусь. С этого момента отвечаете не только за себя. Нарушите правила — свои же найдут первыми.`, "friendly");
  addLog(state, `Отряд принят в группировку «${FACTIONS[faction].name}». Открылись их маршруты и враги; прежняя нейтральность потеряна.`, "success");
  return state;
}

export function getBanditTributePrice(state: GameState, targetId: string) {
  const actor = state.squads.find((squad) => squad.id === state.playerSquadId);
  const target = state.squads.find((squad) => squad.id === targetId && squad.faction === "bandits");
  if (!actor || !target) return 0;
  const trust = state.squadDiplomacy[squadPairKey(actor.id, target.id)]?.trust ?? 0;
  return Math.max(900, Math.round(1700 - Math.max(0, trust) * 18 + (target.commander?.ambition ?? 40) * 5));
}

export function payBanditTribute(previous: GameState, targetId: string): GameState {
  if (previous.campaignMode !== "squad" || !previous.playerSquadId) return previous;
  const price = getBanditTributePrice(previous, targetId);
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId);
  const targetBefore = previous.squads.find((squad) => squad.id === targetId && squad.faction === "bandits" && squad.status !== "dead");
  if (!actorBefore || !targetBefore || actorBefore.nodeId !== targetBefore.nodeId || !price || previous.rubles < price) return previous;
  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorBefore.id)!;
  const target = state.squads.find((squad) => squad.id === targetBefore.id)!;
  state.rubles -= price;
  state.factionFunds.bandits += price;
  const memory = ensureSquadDiplomacy(state, actor, target);
  memory.deals += 1;
  memory.trust = clampDiplomacy(memory.trust + 11);
  memory.respect = clampPressure(memory.respect + 6);
  adjustFactionMemory(state, "bandits", { trust: 5 });
  addSquadConversation(state, target, "trade", `Доля принята. Пока деньги не пахнут кровью наших — можешь считать, что тебя услышали.`, "friendly");
  addLog(state, `В бандитский общак внесено ${price.toLocaleString("ru-RU")} ₽: доверие банды выросло, но это ещё не дружба.`, "success");
  return state;
}

export function getDeceptionTargets(state: GameState, targetId: string) {
  const actor = state.squads.find((squad) => squad.id === state.playerSquadId && squad.status !== "dead");
  const target = state.squads.find((squad) => squad.id === targetId && squad.status !== "dead" && (squad.faction === "bandits" || squad.faction === "renegades"));
  if (!actor || !target || actor.nodeId !== target.nodeId || state.deceptionPlot) return [];
  const memory = state.squadDiplomacy[squadPairKey(actor.id, target.id)];
  const threshold = target.faction === "bandits" ? 22 : 14;
  if (!memory || memory.trust < threshold || memory.betrayals > 0) return [];
  return state.nodes
    .filter((node) => node.id !== actor.nodeId && node.mapLevel !== "sector" && (node.type === "base" || node.type === "outpost" || node.type === "camp") && node.baseFor !== target.faction && node.owner !== target.faction && state.squadKnowledge.knownNodeIds.includes(node.id) && !livingSquads(state, node.id).some((squad) => squad.id !== actor.id && squad.id !== target.id))
    .map((node) => ({ node, path: findPath(state, target.nodeId, node.id) }))
    .filter((entry) => entry.path.length >= 2 && entry.path.length <= 6)
    .sort((left, right) => left.path.length - right.path.length || right.node.income - left.node.income)
    .slice(0, 4)
    .map((entry) => entry.node);
}

export function startDeceptionPlot(previous: GameState, targetId: string, destinationNodeId: string): GameState {
  if (previous.campaignMode !== "squad" || !previous.playerSquadId || previous.deceptionPlot) return previous;
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId);
  const targetBefore = previous.squads.find((squad) => squad.id === targetId && squad.status !== "dead" && (squad.faction === "bandits" || squad.faction === "renegades"));
  const destinationBefore = previous.nodes.find((node) => node.id === destinationNodeId);
  if (!actorBefore || !targetBefore || !targetBefore.commander || !destinationBefore || actorBefore.nodeId !== targetBefore.nodeId || !getDeceptionTargets(previous, targetId).some((node) => node.id === destinationNodeId)) return previous;
  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorBefore.id)!;
  const target = state.squads.find((squad) => squad.id === targetBefore.id)!;
  const memory = ensureSquadDiplomacy(state, actor, target);
  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  const greed = target.commander!.disposition === "greedy" ? 18 : target.commander!.ambition * .16;
  const chance = clamp(.32 + memory.trust * .012 + greed / 100 + destinationBefore.income / 9000 - target.commander!.honor * .002, .2, .9);
  if (roll.value > chance) {
    memory.trust = clampDiplomacy(memory.trust - 9);
    memory.grievance = clampPressure(memory.grievance + 8);
    addSquadConversation(state, target, "recruitment", `Слишком гладко стелешь. Никуда мы за тобой не пойдём — и теперь за спиной поглядывай.`, "cold");
    addLog(state, `Ложный навод не сработал: ${target.commander!.callsign} заподозрил ловушку.`, "danger");
    return state;
  }
  const commanderName = target.commander!.name;
  state.deceptionPlot = {
    targetSquadId: target.id,
    targetFaction: target.faction as PlayableFactionId,
    targetCommanderName: commanderName,
    destinationNodeId,
    stage: "luring",
    startedAt: state.simMinute,
    commanderKilled: false,
    lootRecorded: false,
  };
  beginMission(state, target, "raid", destinationNodeId, findPath(state, target.nodeId, destinationNodeId));
  memory.trust = clampDiplomacy(memory.trust + 2);
  addSquadConversation(state, target, "recruitment", `Если там действительно слабый склад — веди. Но попробуешь кинуть, закопаем рядом.`, "danger");
  addSquadReport(state, "job", "Ложный навод", `Банда ${target.name} идёт к точке «${destinationBefore.name}». Нужно прибыть туда и подготовить удар до того, как они поймут обман.`, destinationNodeId, target.id, 100);
  addLog(state, `ОБМАН НАЧАТ: ${commanderName} повёл людей к точке «${destinationBefore.name}» по вашему ложному наводу.`, "danger");
  return state;
}

export function springDeceptionAmbush(previous: GameState): GameState {
  const plotBefore = previous.deceptionPlot;
  if (!plotBefore || plotBefore.stage !== "ready" || !previous.playerSquadId) return previous;
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId && squad.status !== "dead");
  const targetBefore = previous.squads.find((squad) => squad.id === plotBefore.targetSquadId && squad.status !== "dead");
  if (!actorBefore || !targetBefore || actorBefore.nodeId !== plotBefore.destinationNodeId || targetBefore.nodeId !== plotBefore.destinationNodeId) return previous;
  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorBefore.id)!;
  const target = state.squads.find((squad) => squad.id === targetBefore.id)!;
  const plot = state.deceptionPlot!;
  if (actor.faction === plot.targetFaction) {
    actor.faction = "stalkers";
    actor.archetypeId = FACTION_PROFILES.stalkers.roster[rosterRank(actor.rank)].id;
    state.playerFaction = "stalkers";
    state.squadAllegiance = null;
  }
  state.relations[relationKey(actor.faction, target.faction)] = "war";
  adjustBilateralDiplomacy(state, actor.faction as PlayableFactionId, target.faction as PlayableFactionId, { trust: -34, tension: 56, incidents: 2 });
  adjustFactionMemory(state, plot.targetFaction, { trust: -42, fear: 18, grievance: 72, playerKills: 1 });
  actor.status = "combat";
  actor.cover = Math.max(.82, actor.cover);
  actor.approachMode = "ambush";
  target.status = "combat";
  target.suppression = Math.min(100, target.suppression + 58);
  target.morale = Math.max(0, target.morale - 28);
  target.strength = Math.max(.1, target.strength - Math.max(12, actor.attack * 1.2));
  target.commander = null;
  plot.stage = "ambush";
  plot.commanderKilled = true;
  state.reputation = Math.max(-100, state.reputation - 8);
  const memory = ensureSquadDiplomacy(state, actor, target);
  memory.betrayals += 1;
  memory.trust = -100;
  memory.grievance = 100;
  addLog(state, `ЗАСАДА: ${plot.targetCommanderName} убит первым выстрелом. Банда прижата к земле; бывшие союзники объявили на вас охоту.`, "danger");
  return state;
}

function maintainDeceptionPlot(state: GameState) {
  const plot = state.deceptionPlot;
  if (!plot || plot.stage === "completed" || plot.stage === "failed") return;
  const target = state.squads.find((squad) => squad.id === plot.targetSquadId);
  if (!target || target.status === "dead") {
    if (plot.stage === "ambush") {
      plot.stage = "completed";
      if (!plot.lootRecorded) {
        plot.lootRecorded = true;
        addLog(state, `СХЕМА ЗАКРЫТА: люди ${plot.targetCommanderName} уничтожены. Трофеи можно продать через склад или торговца.`, "success");
      }
    } else {
      plot.stage = "failed";
      addLog(state, `СХЕМА СОРВАНА: группа ${plot.targetCommanderName} погибла или исчезла до точки встречи.`, "danger");
    }
    return;
  }
  if (plot.stage === "luring" && target.nodeId === plot.destinationNodeId && target.status !== "moving") {
    plot.stage = "ready";
    target.mission = "hold";
    target.missionTargetId = plot.destinationNodeId;
    addLog(state, `${plot.targetCommanderName} прибыл на ложную цель. Засада готова, если ваш отряд находится там же.`, "danger");
  }
}

export function talkToSquad(previous: GameState, targetId: string, topic: SquadConversationTopic): GameState {
  if (previous.campaignMode !== "squad" || !previous.playerSquadId) return previous;
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId && squad.status !== "dead");
  const targetBefore = previous.squads.find((squad) => squad.id === targetId && squad.status !== "dead" && squad.faction !== "mutants");
  if (!actorBefore || !targetBefore || actorBefore.nodeId !== targetBefore.nodeId || actorBefore.status === "moving") return previous;
  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorBefore.id)!;
  const target = state.squads.find((squad) => squad.id === targetBefore.id)!;
  const memory = ensureSquadDiplomacy(state, actor, target);
  memory.encounters += 1;
  memory.lastContactAt = state.simMinute;
  rememberSquad(state, target, "conversation");
  const commander = target.commander;
  const location = nodeById(state, target.nodeId);
  let text = "Командир молча смотрит на вас и ждёт конкретного вопроса.";
  let tone: SquadConversation["tone"] = memory.trust >= 22 ? "friendly" : memory.trust <= -20 ? "cold" : "neutral";

  if (target.faction === "monolith") {
    text = "Фанатик не отвечает. Он передаёт по рации координаты вашего отряда и снимает оружие с предохранителя.";
    tone = "danger";
    addSquadConversation(state, target, topic, text, tone);
    addLog(state, `${target.name}: контакт невозможен — Монолит считает всех посторонних целью.`, "danger");
    return state;
  }

  if (topic === "identity") {
    text = commander
      ? `Я ${commander.callsign}. Веду «${target.name}»: ${target.fighters} человек. По натуре ${COMMANDER_DISPOSITION_LABELS[commander.disposition].toLowerCase()}, в Зону пришёл как ${COMMANDER_BACKGROUND_LABELS[commander.background].toLowerCase()}.`
      : `Мы — «${target.name}», ${target.fighters} человек. Сейчас стоим у точки «${location?.name ?? "неизвестно"}».`;
  } else if (topic === "news") {
    const event = state.worldEvents.find((item) => item.status === "active");
    const remote = livingSquads(state).find((squad) => squad.id !== actor.id && squad.id !== target.id && squad.status !== "dead" && !state.squadKnowledge.knownSquads[squad.id]);
    if (event) {
      const node = nodeById(state, event.nodeId);
      text = `По рации ходит подтверждённая отметка: ${event.description} Район — «${node?.name ?? "неизвестно"}».`;
      addSquadReport(state, "news", event.title, text, event.nodeId, target.id, Math.min(92, 58 + (commander?.experience ?? 20) / 2));
      if (!state.squadKnowledge.knownNodeIds.includes(event.nodeId)) state.squadKnowledge.knownNodeIds.push(event.nodeId);
    } else if (remote) {
      const node = nodeById(state, remote.nodeId);
      text = `Слышали движение группы «${remote.name}» примерно у точки «${node?.name ?? "неизвестно"}». Данные могут устареть.`;
      rememberSquad(state, remote, "conversation");
      addSquadReport(state, "news", "Движение чужого отряда", text, remote.nodeId, target.id, 56);
    } else text = "Сегодня эфир тихий. Ничего достаточно надёжного, чтобы рисковать людьми, не слышали.";
  } else if (topic === "danger") {
    const threat = livingSquads(state).find((squad) => squad.id !== actor.id && squad.id !== target.id && (squad.faction === "mutants" || squadsAreHostile(state, actor, squad)));
    if (threat) {
      const node = nodeById(state, threat.nodeId);
      text = `${threat.faction === "mutants" ? "Следы стаи" : "Враждебную группу"} видели у «${node?.name ?? "неизвестно"}». Оценка — около ${Math.max(1, Math.round(threat.fighters / 3) * 3)} целей.`;
      rememberSquad(state, threat, "conversation");
      addSquadReport(state, "danger", "Опасность на маршруте", text, threat.nodeId, target.id, 62 + Math.min(25, commander?.experience ?? 0));
      tone = "danger";
    } else text = "Прямой угрозы рядом не видели, но это Зона — гарантий никто не даст.";
  } else if (topic === "route") {
    const routes = location ? nodeConnections(location).map((id) => nodeById(state, id)).filter((node): node is ZoneNode => Boolean(node)) : [];
    routes.forEach((node) => {
      if (!state.squadKnowledge.knownNodeIds.includes(node.id)) state.squadKnowledge.knownNodeIds.push(node.id);
    });
    text = routes.length
      ? `Отсюда реально пройти к ${routes.map((node) => `«${node.name}»`).join(", ")}. За дальние тропы не ручаюсь; некоторые переходы потребуют проводника.`
      : "Надёжного выхода отсюда мы не знаем. Придётся искать проводника или разведать самому.";
    addSquadReport(state, "route", `Маршруты от точки «${location?.name ?? "неизвестно"}»`, text, location?.id ?? null, target.id, 82);
  } else if (topic === "work") {
    const offers = state.contracts.filter((contract) => contract.status === "offered" && contract.giverSquadId === target.id && contract.declinedAt === null);
    for (const contract of offers) {
      contract.briefedAt = state.simMinute;
      const objective = contract.targetNodeId ? nodeById(state, contract.targetNodeId)?.name ?? "неизвестный район" : "цель уточняется по ходу операции";
      addSquadReport(state, "job", contract.title, `${target.commander?.callsign ?? target.name}: ${contract.description} Цель: ${objective}.`, contract.targetNodeId, target.id, 94);
      if (contract.targetNodeId && !state.squadKnowledge.knownNodeIds.includes(contract.targetNodeId)) state.squadKnowledge.knownNodeIds.push(contract.targetNodeId);
    }
    text = offers.length
      ? `Есть ${offers.length === 1 ? "одно дело" : `${offers.length} дела`}. Сначала выслушай условия: риск, срок и оплата указаны ниже. По деньгам можешь попробовать поторговаться.`
      : "Сейчас подходящей работы для вашей тройки нет. Загляни позже или спроси другого командира.";
  } else if (topic === "faction") {
    const relation = getRelation(state, actor.faction, target.faction);
    const trust = memory.trust >= 25 ? "вам пока доверяют" : memory.trust <= -20 ? "вас считают ненадёжными" : "к вам присматриваются";
    const culture = FACTION_CULTURES[target.faction as PlayableFactionId];
    text = `У «${FACTIONS[target.faction].name}» с вами сейчас ${relation === "war" ? "война" : relation === "truce" ? "перемирие" : relation === "alliance" ? "союз" : "нейтральные отношения"}; на уровне нашего отряда ${trust}. Власть: ${culture.authority}. Живём за счёт: ${culture.livelihoods.join(", ")}. ${culture.conduct}.`;
  } else if (topic === "recruitment") {
    const assessment = getFactionRecruitmentAssessment(state, target.id);
    const culture = FACTION_CULTURES[target.faction as PlayableFactionId];
    text = `${culture.recruitment}. ${assessment.reason} Не берём: ${culture.refuses.toLowerCase()}.`;
    tone = assessment.allowed ? "friendly" : assessment.permanentlyClosed ? "cold" : "neutral";
  }
  memory.trust = clampDiplomacy(memory.trust + (topic === "work" || topic === "route" ? 1 : 0));
  addSquadConversation(state, target, topic, text, tone);
  addLog(state, `${target.commander?.callsign ?? target.name}: ${text}`, tone === "danger" ? "danger" : tone === "friendly" ? "success" : "info");
  return state;
}

export function getFieldSupplyPrice(state: GameState, targetId: string) {
  const target = state.squads.find((squad) => squad.id === targetId);
  return Math.round(420 + (target?.commander?.disposition === "greedy" ? 230 : 0) - Math.max(0, state.reputation) * 3);
}

export function buyFieldSupplies(previous: GameState, targetId: string): GameState {
  if (previous.campaignMode !== "squad" || !previous.playerSquadId) return previous;
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId);
  const targetBefore = previous.squads.find((squad) => squad.id === targetId && squad.faction !== "mutants" && squad.status !== "dead");
  const price = getFieldSupplyPrice(previous, targetId);
  if (!actorBefore || !targetBefore || actorBefore.nodeId !== targetBefore.nodeId || previous.rubles < price || targetBefore.ammo < 20) return previous;
  const state = clonePlayerInteractionState(previous);
  const actor = state.squads.find((squad) => squad.id === actorBefore.id)!;
  const target = state.squads.find((squad) => squad.id === targetBefore.id)!;
  state.rubles -= price;
  actor.ammo = Math.min(actor.maxAmmo, actor.ammo + 36);
  target.ammo = Math.max(0, target.ammo - 20);
  state.stash.bandage = (state.stash.bandage ?? 0) + 1;
  if (target.faction !== "mutants") state.factionFunds[target.faction] += price;
  const memory = ensureSquadDiplomacy(state, actor, target);
  memory.deals += 1;
  memory.trust = clampDiplomacy(memory.trust + 2);
  addSquadConversation(state, target, "trade", `Забирай: патроны и один бинт. ${price.toLocaleString("ru-RU")} ₽ — цена на месте, без возврата.`, "friendly");
  addLog(state, `Полевая сделка с «${target.name}»: −${price.toLocaleString("ru-RU")} ₽, +36 патронов и бинт.`, "success");
  return state;
}

export function negotiateContract(previous: GameState, contractId: string, choice: ContractNegotiationChoice): GameState {
  if (previous.campaignMode !== "squad" || !previous.playerSquadId) return previous;
  const contractBefore = previous.contracts.find((contract) => contract.id === contractId && contract.status === "offered" && contract.briefedAt !== null && contract.declinedAt === null);
  const actorBefore = previous.squads.find((squad) => squad.id === previous.playerSquadId);
  const giverBefore = previous.squads.find((squad) => squad.id === contractBefore?.giverSquadId && squad.status !== "dead");
  if (!contractBefore || !actorBefore || !giverBefore || actorBefore.nodeId !== giverBefore.nodeId) return previous;
  if (choice === "accept") return acceptContract(previous, contractId);
  const state = clonePlayerInteractionState(previous);
  const contract = state.contracts.find((item) => item.id === contractId)!;
  const giver = state.squads.find((squad) => squad.id === giverBefore.id)!;
  if (choice === "decline") {
    contract.declinedAt = state.simMinute;
    addSquadConversation(state, giver, "contract", "Ладно. Тогда снимаю предложение для вас — ищите другую работу.", "cold");
    addLog(state, `Вы отказались от задания «${contract.title}».`, "system");
    return state;
  }
  if (contract.negotiationClosed) return previous;
  const leader = state.operatives.find((operative) => operative.specialization === "leader" && operative.condition !== "dead" && operative.condition !== "left");
  const memory = ensureSquadDiplomacy(state, state.squads.find((squad) => squad.id === actorBefore.id)!, giver);
  const chance = clamp(.34 + (leader?.experience ?? 0) * .004 + memory.trust * .004 + state.reputation * .006 - (giver.commander?.negotiation ?? 45) * .0025, .18, .72);
  const roll = randomStep(state.rngSeed);
  state.rngSeed = roll.seed;
  contract.negotiationClosed = true;
  if (roll.value <= chance) {
    contract.reward = Math.round(contract.reward * 1.2);
    addSquadConversation(state, giver, "contract", `Уговорил. Поднимаю оплату до ${contract.reward.toLocaleString("ru-RU")} ₽, но дальше без торгов.`, "friendly");
    const accepted = acceptContract(state, contract.id);
    addLog(accepted, `Торг успешен: оплата по заданию повышена на 20%.`, "success");
    return accepted;
  }
  memory.trust = clampDiplomacy(memory.trust - 2);
  addSquadConversation(state, giver, "contract", `Нет. Цена остаётся ${contract.reward.toLocaleString("ru-RU")} ₽. Берёшь сейчас или расходимся.`, "cold");
  addLog(state, `Торг по заданию «${contract.title}» не удался; исходное предложение ещё действительно.`, "danger");
  return state;
}

export function getFactionHireCost(faction: PlayableFactionId, rank: HireRank, tradeLevel = 0) {
  const base = rank === "Мастера" ? 32000 : rank === "Ветераны" ? 18000 : 7500;
  return Math.round(base * FACTION_PROFILES[faction].economy.hire * (1 - tradeLevel * 0.03));
}

export function getHireCost(state: GameState, rank: HireRank) {
  return getFactionHireCost(state.playerFaction, rank, state.research.trade);
}

export type StrategicInvestmentType = "supply" | "manpower";

export function getStrategicInvestmentCost(state: GameState, type: StrategicInvestmentType) {
  const base = type === "supply" ? 6500 : 9000;
  return Math.round(base * (1 - state.research.trade * .05));
}

export function buyStrategicReserve(previous: GameState, type: StrategicInvestmentType): GameState {
  if (previous.campaignMode === "squad") return previous;
  const base = previous.nodes.find((node) => node.baseFor === previous.playerFaction && node.owner === previous.playerFaction);
  const cost = getStrategicInvestmentCost(previous, type);
  const balance = getFactionBalanceSummary(previous);
  const strategy = previous.factionStrategy[previous.playerFaction];
  if (!base || previous.rubles < cost || (type === "supply" ? strategy.supply >= 99 : strategy.manpower >= balance.manpowerCap)) return previous;
  const state: GameState = {
    ...previous,
    rubles: previous.rubles - cost,
    factionFunds: { ...previous.factionFunds, [previous.playerFaction]: Math.max(0, previous.factionFunds[previous.playerFaction] - cost) },
    factionStrategy: { ...previous.factionStrategy, [previous.playerFaction]: { ...strategy } },
    log: [...previous.log],
  };
  const updated = state.factionStrategy[state.playerFaction];
  if (type === "supply") {
    updated.supply = Math.min(100, updated.supply + 18);
    addLog(state, `Штаб закупил боеприпасы, топливо и медикаменты: стратегическое снабжение +18%.`, "success");
  } else {
    updated.manpower = Math.min(balance.manpowerCap, updated.manpower + 8);
    updated.warWeariness = Math.min(100, updated.warWeariness + 3);
    addLog(state, `Проведён срочный набор: резерв пополнен, но принудительная мобилизация повысила усталость группировки.`, "system");
  }
  return state;
}

export function hireSquad(previous: GameState, rank: HireRank): GameState {
  if (previous.campaignMode === "squad") return previous;
  const cost = getHireCost(previous, rank);
  const balance = getFactionBalanceSummary(previous);
  const max = balance.armyLimit;
  const recruitsNeeded = FACTION_PROFILES[previous.playerFaction].roster[rank].fighters;
  const living = previous.squads.filter((squad) => squad.faction === previous.playerFaction && squad.unitKind === "combat" && squad.status !== "dead" && !squad.homeGarrison);
  if (previous.rubles < cost || living.length >= max || balance.manpower < recruitsNeeded || (rank === "Мастера" && previous.research.weapons < 2)) return previous;
  const base = previous.nodes.find((node) => node.baseFor === previous.playerFaction && node.owner === previous.playerFaction);
  if (!base) return previous;
  const state = {
    ...previous,
    rubles: previous.rubles - cost,
    factionFunds: { ...previous.factionFunds, [previous.playerFaction]: previous.factionFunds[previous.playerFaction] - cost },
    factionStrategy: { ...previous.factionStrategy, [previous.playerFaction]: { ...previous.factionStrategy[previous.playerFaction], manpower: previous.factionStrategy[previous.playerFaction].manpower - recruitsNeeded, supply: Math.max(0, previous.factionStrategy[previous.playerFaction].supply - 2.5) } },
    squads: [...previous.squads],
    log: [...previous.log],
  };
  const squad = makeSquad(previous.playerFaction, base.id, state.squads.length + 1, rank);
  resetTacticalPosition(squad, previous.playerFaction);
  squad.mission = "player";
  state.squads.push(squad);
  state.selectedSquadId = squad.id;
  addLog(state, `На базе сформирован отряд ${squad.name}: ${getSquadArchetype(squad)?.description ?? rank.toLowerCase()}.`, "success");
  return state;
}

export function getResearchCost(state: GameState, branch: keyof ResearchState) {
  const level = state.research[branch];
  return Math.round((9000 + level * 8000) * (1 - state.research.trade * 0.07));
}

export function buyResearch(previous: GameState, branch: keyof ResearchState): GameState {
  if (previous.campaignMode === "squad") return previous;
  const level = previous.research[branch];
  if (level >= 3) return previous;
  const cost = getResearchCost(previous, branch);
  if (previous.rubles < cost) return previous;
  const labels: Record<keyof ResearchState, string> = {
    weapons: "вооружение",
    armor: "бронезащита",
    logistics: "логистика",
    medicine: "полевая медицина",
    recon: "разведка",
    trade: "торговые связи",
  };
  const state = {
    ...previous,
    rubles: previous.rubles - cost,
    research: { ...previous.research, [branch]: level + 1 },
    log: [...previous.log],
  };
  addLog(state, `Исследование завершено: ${labels[branch]}, уровень ${level + 1}.`, "success");
  return state;
}

const TROPHY_BASE_VALUE: Record<TrophyKind, number> = { weapons: 1600, armor: 2200, supplies: 650 };

export function getTrophySaleValue(state: GameState, kind: TrophyKind) {
  return Math.round(TROPHY_BASE_VALUE[kind] * (1 + state.research.trade * 0.15));
}

export function getContentItemSaleValue(state: GameState, itemId: ZoneItemId) {
  return Math.round(ZONE_ITEMS[itemId].price * (.62 + state.research.trade * .07));
}

function canAccessStash(state: GameState, squad: Squad) {
  const node = nodeById(state, squad.nodeId);
  return squad.faction === state.playerFaction
    && squad.unitKind === "combat"
    && squad.status === "idle"
    && Boolean(node && node.owner === state.playerFaction && node.baseFor === state.playerFaction);
}

export function equipSquadItem(previous: GameState, squadId: string, itemId: ZoneItemId): GameState {
  const item = ZONE_ITEMS[itemId];
  if (!item || !["weapon", "armor", "artifact"].includes(item.category) || (previous.stash[itemId] ?? 0) <= 0) return previous;
  const state: GameState = { ...previous, stash: { ...previous.stash }, discoveredItems: [...previous.discoveredItems], squads: previous.squads.map((squad) => ({ ...squad, artifactIds: [...(squad.artifactIds ?? [])], missionPath: [...squad.missionPath], commander: squad.commander ? { ...squad.commander } : null })), log: [...previous.log] };
  const squad = state.squads.find((candidate) => candidate.id === squadId);
  if (!squad || !canAccessStash(state, squad)) return previous;
  if (item.category === "artifact" && squad.artifactIds.length >= 2) return previous;
  state.stash[itemId] = (state.stash[itemId] ?? 0) - 1;
  if (item.category === "weapon") {
    if (squad.weaponId) addStashItem(state, squad.weaponId);
    squad.weaponId = itemId;
    squad.magazineSize = item.effects.magazine ?? FORMATION_COMBAT[squad.formation].magazine;
    squad.magazine = Math.min(squad.magazine, squad.magazineSize);
  } else if (item.category === "armor") {
    if (squad.armorId) addStashItem(state, squad.armorId);
    squad.armorId = itemId;
  } else {
    squad.artifactIds.push(itemId);
  }
  addLog(state, `${squad.name}: выдано снаряжение «${item.name}». Эффекты применены немедленно.`, "success");
  return state;
}

export function unequipSquadArtifact(previous: GameState, squadId: string, itemId: ZoneItemId): GameState {
  const state: GameState = { ...previous, stash: { ...previous.stash }, discoveredItems: [...previous.discoveredItems], squads: previous.squads.map((squad) => ({ ...squad, artifactIds: [...(squad.artifactIds ?? [])], missionPath: [...squad.missionPath] })), log: [...previous.log] };
  const squad = state.squads.find((candidate) => candidate.id === squadId);
  if (!squad || !canAccessStash(state, squad) || !squad.artifactIds.includes(itemId)) return previous;
  squad.artifactIds.splice(squad.artifactIds.indexOf(itemId), 1);
  addStashItem(state, itemId);
  addLog(state, `${squad.name}: артефакт «${ZONE_ITEMS[itemId].name}» снят и возвращён на склад.`, "system");
  return state;
}

export function supplySquadFromStash(previous: GameState, squadId: string, itemId: ZoneItemId): GameState {
  const item = ZONE_ITEMS[itemId];
  if (!item || item.category !== "consumable" || (previous.stash[itemId] ?? 0) <= 0) return previous;
  const state: GameState = { ...previous, stash: { ...previous.stash }, squads: previous.squads.map((squad) => ({ ...squad, missionPath: [...squad.missionPath] })), log: [...previous.log] };
  const squad = state.squads.find((candidate) => candidate.id === squadId);
  if (!squad || !canAccessStash(state, squad)) return previous;
  if (itemId === "medkit") squad.medkits += 1;
  else if (itemId === "army_medkit") squad.medkits += 2;
  else if (itemId === "ammo_crate") squad.ammo = Math.min(squad.maxAmmo, squad.ammo + 70);
  else if (itemId === "grenade_f1") squad.grenades += 1;
  else if (itemId === "bandage") squad.strength = Math.min(squad.maxStrength, squad.strength + 8);
  else if (itemId === "antirad") squad.stamina = Math.min(squad.maxStamina, squad.stamina + 25);
  state.stash[itemId] = (state.stash[itemId] ?? 0) - 1;
  addLog(state, `${squad.name}: со склада использован предмет «${item.name}».`, "success");
  return state;
}

export function sellContentItem(previous: GameState, itemId: ZoneItemId): GameState {
  const amount = previous.stash[itemId] ?? 0;
  if (!amount) return previous;
  const proceeds = getContentItemSaleValue(previous, itemId) * amount;
  const state: GameState = { ...previous, stash: { ...previous.stash }, factionFunds: { ...previous.factionFunds }, log: [...previous.log], rubles: previous.rubles + proceeds };
  state.stash[itemId] = 0;
  state.factionFunds[state.playerFaction] += proceeds;
  addLog(state, `Продано со склада: «${ZONE_ITEMS[itemId].name}» ×${amount}, +${proceeds.toLocaleString("ru-RU")} ₽.`, "success");
  return state;
}

export function sellTrophies(previous: GameState, kind: TrophyKind): GameState {
  const amount = previous.trophies[kind];
  if (amount <= 0) return previous;
  const proceeds = amount * getTrophySaleValue(previous, kind);
  const state = {
    ...previous,
    rubles: previous.rubles + proceeds,
    factionFunds: { ...previous.factionFunds, [previous.playerFaction]: previous.factionFunds[previous.playerFaction] + proceeds },
    trophies: { ...previous.trophies, [kind]: 0 },
    log: [...previous.log],
  };
  const labels: Record<TrophyKind, string> = { weapons: "оружие", armor: "броню", supplies: "припасы" };
  addLog(state, `Проданы трофеи: ${labels[kind]} ×${amount}, +${proceeds.toLocaleString("ru-RU")} ₽.`, "success");
  return state;
}

export function upgradeSquadGear(previous: GameState, squadId: string, kind: "weapon" | "armor"): GameState {
  const squad = previous.squads.find((item) => item.id === squadId);
  if (!squad || squad.faction !== previous.playerFaction || squad.status === "dead") return previous;
  const level = kind === "weapon" ? squad.weaponTier : squad.armorTier;
  if (level >= 3) return previous;
  const trophyKind: TrophyKind = kind === "weapon" ? "weapons" : "armor";
  const trophyCost = 1 + level;
  const rubleCost = (kind === "weapon" ? 4200 : 5200) + level * 3600;
  if (previous.trophies[trophyKind] < trophyCost || previous.rubles < rubleCost) return previous;
  const state = {
    ...previous,
    rubles: previous.rubles - rubleCost,
    trophies: { ...previous.trophies, [trophyKind]: previous.trophies[trophyKind] - trophyCost },
    squads: previous.squads.map((item) => ({ ...item })),
    log: [...previous.log],
  };
  const upgraded = state.squads.find((item) => item.id === squadId)!;
  if (kind === "weapon") upgraded.weaponTier += 1;
  else upgraded.armorTier += 1;
  addLog(state, `${upgraded.name}: ${kind === "weapon" ? "оружие" : "броня"} улучшено до уровня ${level + 1}.`, "success");
  return state;
}

export function getReinforcementCost(state: GameState, squad: Squad) {
  const missing = Math.max(0, (squad.maxFighters ?? squad.fighters) - squad.fighters);
  const perFighter = squad.rank === "Мастера" ? 1800 : squad.rank === "Ветераны" ? 1350 : squad.rank === "Опытные" ? 1000 : 650;
  return Math.round(missing * perFighter * (1 - state.research.logistics * 0.06));
}

export function reinforceSquad(previous: GameState, squadId: string): GameState {
  const source = previous.squads.find((item) => item.id === squadId);
  if (!source || source.faction !== previous.playerFaction || source.unitKind !== "combat" || source.status !== "idle") return previous;
  const base = previous.nodes.find((node) => node.id === source.nodeId && node.baseFor === previous.playerFaction && node.owner === previous.playerFaction);
  const missing = Math.max(0, (source.maxFighters ?? source.fighters) - source.fighters);
  const cost = getReinforcementCost(previous, source);
  if (!base || missing <= 0 || previous.rubles < cost || previous.factionStrategy[previous.playerFaction].manpower < missing) return previous;
  const state = {
    ...previous,
    rubles: previous.rubles - cost,
    factionFunds: { ...previous.factionFunds, [previous.playerFaction]: Math.max(0, previous.factionFunds[previous.playerFaction] - cost) },
    factionStrategy: { ...previous.factionStrategy, [previous.playerFaction]: { ...previous.factionStrategy[previous.playerFaction], manpower: previous.factionStrategy[previous.playerFaction].manpower - missing, supply: Math.max(0, previous.factionStrategy[previous.playerFaction].supply - 1.5) } },
    squads: previous.squads.map((squad) => ({ ...squad, commander: squad.commander ? { ...squad.commander } : null, missionPath: [...squad.missionPath] })),
    log: [...previous.log],
  };
  const squad = state.squads.find((item) => item.id === squadId)!;
  squad.fighters = squad.maxFighters;
  squad.strength = Math.max(squad.strength, squad.maxStrength * 0.82);
  squad.morale = Math.min(100, squad.morale + 10);
  addLog(state, `${squad.name}: принято пополнение ${missing} чел. за ${cost.toLocaleString("ru-RU")} ₽.`, "success");
  return state;
}

export function setFormation(previous: GameState, squadId: string, formation: Formation): GameState {
  const squad = previous.squads.find((item) => item.id === squadId);
  if (!squad || !isPlayerControlledSquad(previous, squad) || squad.status === "dead") return previous;
  const state = { ...previous, squads: previous.squads.map((item) => ({ ...item })), log: [...previous.log] };
  const next = state.squads.find((item) => item.id === squadId)!;
  next.formation = formation;
  const magazineSize = next.weaponId ? ZONE_ITEMS[next.weaponId].effects.magazine ?? FORMATION_COMBAT[formation].magazine : FORMATION_COMBAT[formation].magazine;
  if (next.magazine > magazineSize) {
    next.ammo = Math.min(next.maxAmmo, next.ammo + next.magazine - magazineSize);
    next.magazine = magazineSize;
  }
  next.magazineSize = magazineSize;
  const labels: Record<Formation, string> = { mixed: "смешанный строй", assault: "штурмовой строй", sniper: "снайперское прикрытие", heavy: "тяжёлый авангард" };
  addLog(state, `${next.name}: установлен режим «${labels[formation]}».`, "system");
  return state;
}

function cloneDiplomacyState(previous: GameState): GameState {
  return {
    ...previous,
    nodes: previous.nodes.map((node) => ({ ...node, links: [...node.links], localLinks: node.localLinks ? [...node.localLinks] : undefined })),
    squads: previous.squads.map((squad) => ({ ...squad, missionPath: [...squad.missionPath] })),
    factionFunds: { ...previous.factionFunds },
    factionStrategy: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.factionStrategy[faction] }])) as Record<PlayableFactionId, FactionStrategicState>,
    relations: { ...previous.relations },
    factionDiplomacy: Object.fromEntries(Object.entries(previous.factionDiplomacy).map(([key, relation]) => [key, { ...relation }])) as Record<string, BilateralDiplomacy>,
    diplomacyMemory: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.diplomacyMemory[faction] }])) as Record<PlayableFactionId, FactionMemory>,
    factionSurvival: Object.fromEntries(PLAYABLE_FACTIONS.map((faction) => [faction, { ...previous.factionSurvival[faction] }])) as Record<PlayableFactionId, FactionSurvival>,
    diplomaticOffers: previous.diplomaticOffers.map((offer) => ({ ...offer })),
    log: [...previous.log],
  };
}

function transferDiplomaticPayment(state: GameState, faction: PlayableFactionId, amount: number) {
  state.rubles -= amount;
  state.factionFunds[state.playerFaction] = Math.max(0, state.factionFunds[state.playerFaction] - amount);
  state.factionFunds[faction] += amount;
}

export function diplomaticAction(previous: GameState, faction: PlayableFactionId, action: DiplomacyAction): GameState {
  if (faction === previous.playerFaction || faction === "monolith" || getFactionCondition(previous, faction) === "destroyed") return previous;
  const terms = getDiplomacyTerms(previous, faction);
  const key = relationKey(previous.playerFaction, faction);
  if (action === "gift") {
    if (terms.cooldown > 0 || previous.rubles < terms.giftCost) return previous;
    const state = cloneDiplomacyState(previous);
    transferDiplomaticPayment(state, faction, terms.giftCost);
    adjustFactionMemory(state, faction, { trust: 14, grievance: -10 });
    adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: 10, cooperation: 7, tension: -8 });
    state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 60;
    state.reputation = clampDiplomacy(state.reputation + 1);
    addLog(state, `${FACTIONS[faction].name}: передан груз и ${terms.giftCost.toLocaleString("ru-RU")} ₽. Доверие растёт, старые претензии ослабевают.`, "success");
    return state;
  }

  if (action === "truce") {
    if (!terms.canTruce || previous.rubles < terms.truceCost) return previous;
    const state = cloneDiplomacyState(previous);
    transferDiplomaticPayment(state, faction, terms.truceCost);
    state.relations[key] = "truce";
    state.factionStrategy[state.playerFaction].warWeariness = Math.max(0, state.factionStrategy[state.playerFaction].warWeariness - 7);
    state.factionStrategy[faction].warWeariness = Math.max(0, state.factionStrategy[faction].warWeariness - 7);
    adjustFactionMemory(state, faction, { trust: 7, fear: -6, grievance: -20 });
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
    bilateral.defensePact = false;
    bilateral.nonAggressionUntil = state.simMinute + 1440;
    adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: 7, tension: -30, cooperation: 5 });
    state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 180;
    for (const offer of state.diplomaticOffers.filter((offer) => offer.faction === faction && offer.status === "pending")) offer.status = "expired";
    addLog(state, `${FACTIONS[faction].name}: перемирие принято за ${terms.truceCost.toLocaleString("ru-RU")} ₽. Огонь прекращён, но память о потерях сохранилась.`, "success");
    return state;
  }

  if (action === "alliance") {
    if (!terms.canAlliance || previous.rubles < terms.allianceCost) return previous;
    const state = cloneDiplomacyState(previous);
    transferDiplomaticPayment(state, faction, terms.allianceCost);
    state.relations[key] = "alliance";
    adjustFactionMemory(state, faction, { trust: 12, grievance: -8 });
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
    bilateral.tradePact = true;
    bilateral.defensePact = true;
    bilateral.nonAggressionUntil = null;
    adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: 16, tension: -24, cooperation: 24 });
    state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 240;
    state.reputation = clampDiplomacy(state.reputation + 3);
    addLog(state, `${FACTIONS[faction].name}: заключён союз. Открыта торговля и канал военной поддержки.`, "success");
    return state;
  }

  if (action === "war") {
    if (terms.relation === "war") return previous;
    const state = cloneDiplomacyState(previous);
    const betrayal = terms.relation === "alliance";
    state.relations[key] = "war";
    adjustFactionMemory(state, faction, { trust: betrayal ? -55 : -30, fear: 5, grievance: betrayal ? 50 : 28 });
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
    bilateral.tradePact = false;
    bilateral.defensePact = false;
    bilateral.nonAggressionUntil = null;
    adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: betrayal ? -60 : -36, tension: betrayal ? 70 : 45, cooperation: betrayal ? -60 : -28, incidents: 1 });
    state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 300;
    state.reputation = clampDiplomacy(state.reputation - (betrayal ? 25 : 5));
    if (betrayal) {
      for (const observer of PLAYABLE_FACTIONS.filter((id) => id !== state.playerFaction && id !== faction && id !== "monolith")) {
        adjustFactionMemory(state, observer, { trust: -7, grievance: 3 });
        adjustBilateralDiplomacy(state, state.playerFaction, observer, { trust: -10, tension: 6, cooperation: -6 });
      }
    }
    for (const offer of state.diplomaticOffers.filter((offer) => offer.faction === faction && offer.status === "pending")) offer.status = "rejected";
    addLog(state, `${FACTIONS[faction].name}: объявлена война${betrayal ? ". Нарушение союза ударило по вашей репутации" : ""}.`, "danger");
    return state;
  }

  if (action === "trade_pact") {
    if (!terms.canTradePact || previous.rubles < terms.tradePactCost) return previous;
    const state = cloneDiplomacyState(previous);
    transferDiplomaticPayment(state, faction, terms.tradePactCost);
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
    bilateral.tradePact = true;
    adjustFactionMemory(state, faction, { trust: 8, grievance: -4 });
    adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: 9, cooperation: 14, tension: -7 });
    state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 120;
    state.reputation = clampDiplomacy(state.reputation + 1);
    addLog(state, `${FACTIONS[faction].name}: открыт торговый коридор. Обе стороны получают договорной доход с контролируемых территорий.`, "success");
    return state;
  }

  if (action === "non_aggression") {
    if (!terms.canNonAggression || previous.rubles < terms.nonAggressionCost) return previous;
    const state = cloneDiplomacyState(previous);
    transferDiplomaticPayment(state, faction, terms.nonAggressionCost);
    state.relations[key] = "truce";
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, faction);
    bilateral.nonAggressionUntil = state.simMinute + 1440;
    adjustFactionMemory(state, faction, { trust: 6, grievance: -8 });
    adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: 6, cooperation: 6, tension: -18 });
    state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 120;
    addLog(state, `${FACTIONS[faction].name}: подписан пакт о ненападении на 24 игровых часа. Пограничные силы прекращают провокации.`, "success");
    return state;
  }

  if (!terms.canRequestSupport || previous.rubles < terms.supportCost) return previous;
  const threatened = previous.nodes
    .filter((node) => node.owner === previous.playerFaction && previous.squads.some((squad) => squad.nodeId === node.id && squad.status !== "dead" && areHostile(previous, previous.playerFaction, squad.faction)))
    .sort((a, b) => (b.income + (b.baseFor === previous.playerFaction ? 2500 : 0)) - (a.income + (a.baseFor === previous.playerFaction ? 2500 : 0)))[0];
  if (!threatened) return previous;
  const candidates = previous.squads
    .filter((squad) => squad.faction === faction && squad.unitKind === "combat" && !squad.homeGarrison && squad.status === "idle")
    .map((squad) => ({ squad, path: findPath(previous, squad.nodeId, threatened.id) }))
    .filter((entry) => entry.path.length)
    .sort((a, b) => a.path.length - b.path.length);
  if (!candidates.length) return previous;
  const state = cloneDiplomacyState(previous);
  const supporter = state.squads.find((squad) => squad.id === candidates[0].squad.id)!;
  transferDiplomaticPayment(state, faction, terms.supportCost);
  beginMission(state, supporter, "defend", threatened.id, candidates[0].path);
  adjustBilateralDiplomacy(state, state.playerFaction, faction, { trust: 4, cooperation: 8, jointBattles: 1 });
  state.diplomacyMemory[faction].nextNegotiationAt = state.simMinute + 120;
  addLog(state, `${FACTIONS[faction].name}: отряд ${supporter.name} направлен защищать точку «${threatened.name}».`, "success");
  return state;
}

export function respondDiplomaticOffer(previous: GameState, offerId: string, accept: boolean): GameState {
  const source = previous.diplomaticOffers.find((offer) => offer.id === offerId);
  if (!source || source.status !== "pending" || previous.simMinute >= source.expiresAt || getFactionCondition(previous, source.faction) === "destroyed") return previous;
  if (accept && source.cost > previous.rubles) return previous;
  if (accept && source.type === "territory" && (!source.demandedNodeId || previous.nodes.find((node) => node.id === source.demandedNodeId)?.owner !== previous.playerFaction)) return previous;
  const state = cloneDiplomacyState(previous);
  const offer = state.diplomaticOffers.find((item) => item.id === offerId)!;
  const memory = state.diplomacyMemory[offer.faction];
  if (!accept) {
    offer.status = "rejected";
    adjustFactionMemory(state, offer.faction, { trust: -6, grievance: offer.type === "tribute" || offer.type === "territory" ? 12 : 5 });
    if (offer.type === "tribute" || offer.type === "territory") {
      state.relations[relationKey(state.playerFaction, offer.faction)] = "war";
      const bilateral = getBilateralDiplomacy(state, state.playerFaction, offer.faction);
      bilateral.tradePact = false;
      bilateral.defensePact = false;
      bilateral.nonAggressionUntil = null;
      adjustBilateralDiplomacy(state, state.playerFaction, offer.faction, { trust: -12, tension: 30, cooperation: -12, incidents: 1 });
    }
    addLog(state, `${FACTIONS[offer.faction].name}: предложение отклонено${offer.type === "tribute" || offer.type === "territory" ? ", переговоры сорваны и объявлена война" : ""}.`, "danger");
    return state;
  }

  offer.status = "accepted";
  if (offer.cost) transferDiplomaticPayment(state, offer.faction, offer.cost);
  if (offer.type === "truce") {
    state.relations[relationKey(state.playerFaction, offer.faction)] = "truce";
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, offer.faction);
    bilateral.nonAggressionUntil = state.simMinute + 1440;
    bilateral.defensePact = false;
    state.factionStrategy[state.playerFaction].warWeariness = Math.max(0, state.factionStrategy[state.playerFaction].warWeariness - 7);
    state.factionStrategy[offer.faction].warWeariness = Math.max(0, state.factionStrategy[offer.faction].warWeariness - 7);
    adjustFactionMemory(state, offer.faction, { trust: 8, fear: -8, grievance: -18 });
    adjustBilateralDiplomacy(state, state.playerFaction, offer.faction, { trust: 8, tension: -28, cooperation: 5 });
  } else if (offer.type === "alliance") {
    state.relations[relationKey(state.playerFaction, offer.faction)] = "alliance";
    const bilateral = getBilateralDiplomacy(state, state.playerFaction, offer.faction);
    bilateral.tradePact = true;
    bilateral.defensePact = true;
    bilateral.nonAggressionUntil = null;
    adjustFactionMemory(state, offer.faction, { trust: 12, grievance: -8 });
    adjustBilateralDiplomacy(state, state.playerFaction, offer.faction, { trust: 15, tension: -24, cooperation: 24 });
    state.reputation = clampDiplomacy(state.reputation + 3);
  } else if (offer.type === "trade_pact") {
    getBilateralDiplomacy(state, state.playerFaction, offer.faction).tradePact = true;
    adjustFactionMemory(state, offer.faction, { trust: 7, grievance: -4 });
    adjustBilateralDiplomacy(state, state.playerFaction, offer.faction, { trust: 8, tension: -6, cooperation: 14 });
  } else if (offer.type === "non_aggression") {
    state.relations[relationKey(state.playerFaction, offer.faction)] = "truce";
    getBilateralDiplomacy(state, state.playerFaction, offer.faction).nonAggressionUntil = state.simMinute + 1440;
    adjustFactionMemory(state, offer.faction, { trust: 6, grievance: -8 });
    adjustBilateralDiplomacy(state, state.playerFaction, offer.faction, { trust: 6, tension: -18, cooperation: 6 });
  } else if (offer.type === "tribute") {
    state.relations[relationKey(state.playerFaction, offer.faction)] = "truce";
    getBilateralDiplomacy(state, state.playerFaction, offer.faction).nonAggressionUntil = state.simMinute + 720;
    adjustFactionMemory(state, offer.faction, { trust: 3, grievance: -22 });
  } else if (offer.demandedNodeId) {
    const node = nodeById(state, offer.demandedNodeId);
    if (node && node.owner === state.playerFaction && !node.baseFor) node.owner = offer.faction;
    state.relations[relationKey(state.playerFaction, offer.faction)] = "truce";
    getBilateralDiplomacy(state, state.playerFaction, offer.faction).nonAggressionUntil = state.simMinute + 720;
    adjustFactionMemory(state, offer.faction, { trust: 5, fear: -10, grievance: -28 });
  }
  memory.nextNegotiationAt = state.simMinute + 240;
  addLog(state, `${FACTIONS[offer.faction].name}: договор вступил в силу.`, "success");
  return state;
}

export function changeDiplomacy(previous: GameState, faction: PlayableFactionId): GameState {
  const relation = getRelation(previous, previous.playerFaction, faction);
  return diplomaticAction(previous, faction, relation === "war" ? "truce" : relation === "alliance" ? "war" : "alliance");
}

export function tacticalAction(
  previous: GameState,
  action: "focus" | "grenade" | "medkit" | "cover" | "advance" | "reload" | "retreat" | "resupply",
): GameState {
  const state = {
    ...previous,
    squads: previous.squads.map((squad) => ({ ...squad, missionPath: [...squad.missionPath] })),
    rubles: previous.rubles,
    trophies: { ...previous.trophies },
    contracts: previous.contracts.map((contract) => ({ ...contract })),
    factionFunds: { ...previous.factionFunds },
    log: [...previous.log],
  };
  const squad = state.squads.find((item) => item.id === state.selectedSquadId);
  const target = state.squads.find((item) => item.id === state.tacticalTargetId);
  if (!squad || !isPlayerControlledSquad(state, squad) || squad.unitKind !== "combat" || squad.status === "dead") return previous;

  if (action === "medkit" && squad.medkits > 0 && squad.strength < squad.maxStrength) {
    squad.medkits -= 1;
    squad.strength = Math.min(squad.maxStrength, squad.strength + 30 + state.research.medicine * 10);
    addLog(state, `${squad.name} применил аптечку.`, "success");
  } else if (action === "cover") {
    const covers = getTacticalLayout(squad.nodeId).covers;
    const nearest = covers.sort((a, b) => {
      const distanceA = Math.hypot(a.left + a.width / 2 - squad.tacticalX, a.top + a.height / 2 - squad.tacticalY);
      const distanceB = Math.hypot(b.left + b.width / 2 - squad.tacticalX, b.top + b.height / 2 - squad.tacticalY);
      return distanceA - distanceB;
    })[0];
    if (nearest) {
      squad.tacticalX = nearest.left + nearest.width / 2;
      squad.tacticalY = nearest.top + nearest.height / 2;
    }
    squad.cover = 0.42;
    squad.stamina = Math.max(0, squad.stamina - 6);
    squad.suppression = Math.max(0, squad.suppression - 18);
    addLog(state, `${squad.name} занял укреплённое укрытие.`, "system");
  } else if (action === "advance" && target && target.status !== "dead" && squadsAreHostile(state, squad, target) && squad.stamina >= 12) {
    const dx = target.tacticalX - squad.tacticalX;
    const dy = target.tacticalY - squad.tacticalY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const step = Math.min(10, distance * 0.38);
    squad.tacticalX += (dx / distance) * step;
    squad.tacticalY += (dy / distance) * step;
    squad.stamina -= 12;
    squad.suppression = Math.max(0, squad.suppression - 6);
    squad.cover = 0;
    addLog(state, `${squad.name} сблизился с целью и сменил огневую позицию.`, "system");
  } else if (action === "reload" && squad.magazine < squad.magazineSize && squad.ammo > 0) {
    const loaded = Math.min(squad.magazineSize - squad.magazine, squad.ammo);
    squad.magazine += loaded;
    squad.ammo -= loaded;
    squad.stamina = Math.max(0, squad.stamina - 2);
    addLog(state, `${squad.name}: магазин заменён, ${squad.magazine}/${squad.magazineSize}.`, "system");
  } else if (action === "resupply" && (state.trophies.supplies >= 2 || state.rubles >= 1800) && squad.ammo < squad.maxAmmo) {
    if (state.trophies.supplies >= 2) state.trophies.supplies -= 2;
    else state.rubles -= 1800;
    squad.ammo = squad.maxAmmo;
    squad.magazine = squad.magazineSize;
    addLog(state, `${squad.name} получил боеприпасы.`, "success");
  } else if (action === "retreat") {
    const current = nodeById(state, squad.nodeId)!;
    const retreatLinks = current.sectorId ? current.localLinks ?? [] : current.links;
    const destination = retreatLinks.map((id) => nodeById(state, id)!).find((node) => node.owner === state.playerFaction) ??
      (squad.previousNodeId ? nodeById(state, squad.previousNodeId) : null);
    if (destination) {
      squad.destinationId = destination.id;
      squad.status = "moving";
      squad.travel = 0;
      squad.mission = "player";
      squad.missionTargetId = destination.id;
      squad.missionPath = [];
      squad.missionIssuedAt = state.simMinute;
      state.tacticalNodeId = null;
      addLog(state, `${squad.name} отступает к точке «${destination.name}».`, "danger");
    }
  } else if (target && target.status !== "dead" && squadsAreHostile(state, squad, target)) {
    const profile = getCombatProfile(state, squad, target);
    const targetGearArmor = 1 - target.armorTier * 0.06;
    const strategicFirepower = .72 + state.factionStrategy[squad.faction as PlayableFactionId].supply / 100 * .28;
    if (action === "focus" && squad.magazine >= 8) {
      squad.magazine -= 8;
      squad.stamina = Math.max(0, squad.stamina - 5);
      const damage = (13 + state.research.weapons * 3 + squad.weaponTier * 2) * targetGearArmor * profile.rangeFactor * (profile.hitChance / 0.68) * strategicFirepower;
      const casualties = applySquadDamage(target, damage, state);
      resolveCommanderCasualty(state, target, casualties);
      target.suppression = Math.min(100, target.suppression + damage * 2.6);
      addLog(state, `${squad.name}: сосредоточенный огонь по ${target.name}.`, "success");
    } else if (action === "grenade" && squad.grenades > 0 && profile.distance <= 62) {
      squad.grenades -= 1;
      const damage = 28 * (1 - profile.cover * 0.35);
      const casualties = applySquadDamage(target, damage, state);
      resolveCommanderCasualty(state, target, casualties);
      target.suppression = Math.min(100, target.suppression + 45);
      addLog(state, `${squad.name}: граната по позиции ${target.name}.`, "success");
    }
    if (target.strength <= 0) {
      target.status = "dead";
      addLog(state, `${target.name} уничтожен.`, "success");
      rewardPlayerKill(state, target);
    }
  }
  return state;
}

export function formatGameTime(totalMinutes: number) {
  const day = Math.floor(totalMinutes / 1440) + 1;
  const minuteOfDay = totalMinutes % 1440;
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = Math.floor(minuteOfDay % 60);
  return { day, clock: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}` };
}
