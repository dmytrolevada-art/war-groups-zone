"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMANDER_BACKGROUND_LABELS,
  COMMANDER_DISPOSITION_LABELS,
  DIRECTIVE_LABELS,
  FACTIONS,
  FACTION_CULTURES,
  FACTION_PROFILES,
  FIELD_DEAL_LABELS,
  FIGHTER_ROLE_LABELS,
  HIRE_RANKS,
  MOBILIZATION_LABELS,
  MUTANT_LABELS,
  OPERATIVE_ORDER_LABELS,
  OPERATIVE_SPECIALIZATION_LABELS,
  OPERATIVE_TRAIT_LABELS,
  OPERATION_LABELS,
  PLAYABLE_FACTIONS,
  acceptContract,
  buyFieldSupplies,
  buyResearch,
  buyStrategicReserve,
  canRecruitAtCurrentLocation,
  createGame,
  diplomaticAction,
  formatGameTime,
  getEconomySummary,
  getBilateralDiplomacy,
  getFactionRosterEntry,
  getFactionRankLabel,
  getFactionRecruitmentAssessment,
  getFieldSupplyPrice,
  getBanditTributePrice,
  getDeceptionTargets,
  getFactionCondition,
  getFactionBalanceSummary,
  getALifeCounts,
  getActiveFieldDealsForSquad,
  getCombatProfile,
  getContentItemSaleValue,
  getDiplomacyTerms,
  getHireCost,
  getRelation,
  getMissionLabel,
  getRecruitCandidates,
  getResearchCost,
  getStrategicInvestmentCost,
  getReinforcementCost,
  getSquadCombatRole,
  getSquadCurrentSectorId,
  getSquadArchetype,
  getSquadIntel,
  getSquadMarkerIntel,
  getSquadStrengthPercent,
  getSquadUpkeep,
  getTacticalPosition,
  getTrophySaleValue,
  hireSquad,
  hireOperative,
  equipSquadItem,
  interactWithSquad,
  isSquadNodeKnown,
  issueLocationApproach,
  issueMove,
  issueOperativeOrder,
  issueSectorMove,
  isPlayerControlledSquad,
  migrateGameState,
  negotiateContract,
  payBanditTribute,
  requestFactionMembership,
  respondDiplomaticOffer,
  reinforceSquad,
  sellTrophies,
  sellContentItem,
  setFormation,
  supplySquadFromStash,
  squadsAreHostile,
  tacticalAction,
  talkToSquad,
  tickGame,
  startDeceptionPlot,
  springDeceptionAmbush,
  upgradeSquadGear,
  unequipSquadArtifact,
  type FactionId,
  type CampaignMode,
  type ContractType,
  type Formation,
  type GameState,
  type LocationApproach,
  type OperativeOrder,
  type PlayableFactionId,
  type ResearchState,
  type Squad,
  type SquadConversationTopic,
  type TrophyKind,
  type ZoneNode,
} from "./game-engine";
import {
  ITEM_CATEGORY_LABELS,
  ITEM_RARITY_LABELS,
  ZONE_ITEMS,
  getLocationContent,
  type ItemCategory,
  type ZoneItemId,
} from "./zone-content";
import {
  HAZARD_FIELDS,
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_SECTORS,
  getNodeIntel,
} from "./zone-map-data";
import {
  SECTOR_MAPS,
  findSectorPoint,
  getSectorMap,
  getSectorRoutes,
  getTacticalLayout,
} from "./sector-map-registry";

const SAVE_KEY = "war-groups-zone-save-v1";
const UI_KEY = "war-groups-zone-ui-v1";
const STALKER_MAP_TILE_ROOT = "https://joric.github.io/stalker2_tileset/tiles";
const STALKER_MAP_MAX_TILE_ZOOM = 4;
const MAJOR_MAP_LABEL_IDS = new Set(["zalesie", "malachite", "duga", "cooling_towers", "sircaa", "ikar", "energetik"]);

type UiPreferences = {
  panelWidth: number;
  dockHeight: number;
  panelCollapsed: boolean;
  dockCollapsed: boolean;
  mapFocus: boolean;
  helpVisible: boolean;
};

const DEFAULT_UI: UiPreferences = {
  panelWidth: 360,
  dockHeight: 124,
  panelCollapsed: false,
  dockCollapsed: false,
  mapFocus: false,
  helpVisible: false,
};

const clampUi = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const STATUS_LABEL: Record<Squad["status"], string> = {
  idle: "ожидает приказ",
  moving: "в пути",
  capturing: "захватывает",
  combat: "ведёт бой",
  dead: "уничтожен",
};

const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  capture: "ЗАХВАТ",
  artifacts: "АРТЕФАКТЫ",
  eliminate: "ЛИКВИДАЦИЯ",
  defend: "ОБОРОНА",
  escort: "СОПРОВОЖДЕНИЕ",
  parley: "ПЕРЕГОВОРЫ",
  specimen: "БИОМАТЕРИАЛ",
  salvage: "ПОИСК ТАЙНИКА",
};

const CONTRACT_RISK_LABEL = { low: "НИЗКИЙ РИСК", medium: "СРЕДНИЙ РИСК", high: "ВЫСОКИЙ РИСК" } as const;

type PanelTab = "sector" | "alife" | "base" | "contracts" | "research" | "diplomacy" | "log";
type LogFilter = "all" | "orders" | "combat" | "diplomacy" | "world";

const LOG_FILTER_LABELS: Record<LogFilter, string> = {
  all: "ВСЕ",
  orders: "ПРИКАЗЫ",
  combat: "БОИ",
  diplomacy: "ПЕРЕГОВОРЫ",
  world: "МИР",
};

function getLogCategory(text: string): Exclude<LogFilter, "all"> {
  const lower = text.toLowerCase();
  if (["полевой контакт", "переговор", "договор", "перемир", "союз", "пакт", "дипсеть", "предатель", "дар", "ультиматум"].some((word) => lower.includes(word))) return "diplomacy";
  if (["уничтож", "бой", "огонь", "гранат", "трофеи", "атак", "потери", "отступ"].some((word) => lower.includes(word))) return "combat";
  if (["переход", "прибыл", "установлен режим", "пополн", "улучшено", "принят контракт", "направлен защищать"].some((word) => lower.includes(word))) return "orders";
  return "world";
}

function itemEffectsText(itemId: ZoneItemId) {
  const effects = ZONE_ITEMS[itemId].effects;
  const parts: string[] = [];
  if (effects.damage) parts.push(`урон ×${effects.damage}`);
  if (effects.accuracy) parts.push(`точность ${effects.accuracy > 0 ? "+" : ""}${Math.round(effects.accuracy * 100)}%`);
  if (effects.range) parts.push(`дальность ${effects.range > 0 ? "+" : ""}${effects.range} м`);
  if (effects.protection) parts.push(`защита +${Math.round(effects.protection * 100)}%`);
  if (effects.mobility) parts.push(`скорость ${effects.mobility > 0 ? "+" : ""}${Math.round(effects.mobility * 100)}%`);
  if (effects.radiation) parts.push(`${effects.radiation > 0 ? "радзащита" : "радиация"} ${effects.radiation > 0 ? "+" : ""}${Math.round(effects.radiation * 100)}%`);
  if (effects.psi) parts.push(`пси-защита +${Math.round(effects.psi * 100)}%`);
  if (effects.recovery) parts.push(`восстановление +${Math.round(effects.recovery * 100)}%`);
  if (effects.carry) parts.push(`груз +${Math.round(effects.carry * 100)}%`);
  return parts.join(" · ") || "ценный материал";
}

const NODE_LABEL: Record<ZoneNode["type"], string> = {
  base: "главная база",
  outpost: "опорная точка",
  camp: "стоянка",
  anomaly: "аномальное поле",
  shelter: "капитальное укрытие",
};

const RELATION_LABEL = {
  war: "ВОЙНА",
  truce: "ПЕРЕМИРИЕ",
  alliance: "СОЮЗ",
  neutral: "НЕЙТРАЛИТЕТ",
};

const FACTION_CONDITION_LABEL = {
  active: "ШТАБ ДЕЙСТВУЕТ",
  remnant: "ОСТАТКИ СИЛ",
  destroyed: "ЛИКВИДИРОВАНА",
};

const DIPLOMATIC_OFFER_LABEL = {
  truce: "ПРЕДЛОЖЕНИЕ ПЕРЕМИРИЯ",
  alliance: "ПРЕДЛОЖЕНИЕ СОЮЗА",
  tribute: "ДЕНЕЖНЫЙ УЛЬТИМАТУМ",
  territory: "ТЕРРИТОРИАЛЬНЫЙ УЛЬТИМАТУМ",
  trade_pact: "ТОРГОВОЕ ПРЕДЛОЖЕНИЕ",
  non_aggression: "ПАКТ О НЕНАПАДЕНИИ",
};

const FORMATION_LABEL: Record<Formation, string> = {
  mixed: "СМЕШАННЫЙ",
  assault: "ШТУРМ",
  sniper: "СНАЙПЕРЫ",
  heavy: "ТЯЖЁЛЫЙ",
};

const TROPHY_LABEL: Record<TrophyKind, string> = {
  weapons: "Оружие",
  armor: "Броня",
  supplies: "Припасы",
};

function contractTimeLeft(game: GameState, expiresAt: number) {
  const minutes = Math.max(0, expiresAt - game.simMinute);
  return `${Math.floor(minutes / 60)}ч ${Math.ceil(minutes % 60)}м`;
}

function pct(value: number, max = 100) {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

function nodePoint(node: ZoneNode) {
  return { x: (node.x / 100) * MAP_WIDTH, y: (node.y / 100) * MAP_HEIGHT };
}

function globalMapNode(game: GameState, nodeId: string | null): ZoneNode | undefined {
  if (!nodeId) return undefined;
  const node = game.nodes.find((item) => item.id === nodeId);
  if (!node) return undefined;
  return node.mapLevel === "sector" && node.globalAnchorId
    ? game.nodes.find((item) => item.id === node.globalAnchorId)
    : node;
}

function routePath(a: ZoneNode, b: ZoneNode) {
  const pa = nodePoint(a);
  const pb = nodePoint(b);
  const dx = pb.x - pa.x;
  const dy = pb.y - pa.y;
  let hash = 0;
  for (const char of `${a.id}:${b.id}`) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const bend = (Math.abs(hash) % 2 ? 1 : -1) * (0.035 + (Math.abs(hash) % 4) * 0.008);
  const cx = (pa.x + pb.x) / 2 - dy * bend;
  const cy = (pa.y + pb.y) / 2 + dx * bend;
  return `M${pa.x.toFixed(1)} ${pa.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`;
}

type MapView = { x: number; y: number; width: number; height: number };

function clampMapView(view: MapView): MapView {
  const width = Math.max(120, Math.min(MAP_WIDTH, view.width));
  const height = width * (MAP_HEIGHT / MAP_WIDTH);
  return {
    x: Math.max(0, Math.min(MAP_WIDTH - width, view.x)),
    y: Math.max(0, Math.min(MAP_HEIGHT - height, view.y)),
    width,
    height,
  };
}

type LocalMapObject = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cover?: boolean;
  searchable?: boolean;
  rest?: boolean;
  dangerous?: boolean;
};

const LOCAL_MAP_OBJECTS: LocalMapObject[] = [
  { id: "house", label: "Заброшенный дом", x: 9, y: 13, width: 22, height: 19, cover: true, searchable: true, rest: true },
  { id: "barn", label: "Сарай", x: 68, y: 14, width: 20, height: 15, cover: true, searchable: true },
  { id: "blocks", label: "Бетонные блоки", x: 58, y: 48, width: 20, height: 7, cover: true },
  { id: "fire", label: "Костёр", x: 22, y: 72, width: 13, height: 9, rest: true },
  { id: "cellar", label: "Подвал", x: 73, y: 70, width: 15, height: 12, cover: true, searchable: true, dangerous: true },
  { id: "anomaly", label: "Аномалия", x: 43, y: 22, width: 12, height: 12, searchable: true, dangerous: true },
  { id: "tower", label: "Вышка", x: 41, y: 64, width: 8, height: 13, cover: true },
];

const OPERATIVE_CONDITION_LABEL = {
  healthy: "в норме",
  wounded: "ранен",
  critical: "критическое",
  dead: "погиб",
  left: "ушёл",
} as const;

const INLINE_SECTOR_SCALE_X = .22;
const INLINE_SECTOR_SCALE_Y = .18;

function inlineNodePoint(game: GameState, node: ZoneNode, sectorId: string | null) {
  if (!sectorId || node.sectorId !== sectorId || node.mapLevel !== "sector") return nodePoint(globalMapNode(game, node.id) ?? node);
  const sector = getSectorMap(sectorId);
  const visual = findSectorPoint(node.id);
  const anchor = sector ? game.nodes.find((item) => item.id === sector.anchorNodeId) : null;
  const anchorVisual = sector ? findSectorPoint(sector.anchorNodeId) : null;
  if (!visual || !anchor || !anchorVisual) return nodePoint(globalMapNode(game, node.id) ?? node);
  const center = nodePoint(anchor);
  return {
    x: center.x + (visual.x - anchorVisual.x) * INLINE_SECTOR_SCALE_X,
    y: center.y + (visual.y - anchorVisual.y) * INLINE_SECTOR_SCALE_Y,
  };
}

function inlineSquadPoint(game: GameState, squad: Squad, sectorId: string | null) {
  const startNode = game.nodes.find((node) => node.id === squad.nodeId);
  if (!startNode) return { x: 0, y: 0 };
  const start = inlineNodePoint(game, startNode, sectorId);
  const endNode = squad.destinationId ? game.nodes.find((node) => node.id === squad.destinationId) : null;
  if (squad.status !== "moving" || !endNode) return start;
  const end = inlineNodePoint(game, endNode, sectorId);
  return { x: start.x + (end.x - start.x) * squad.travel, y: start.y + (end.y - start.y) * squad.travel };
}

function tokenOffset(game: GameState, squad: Squad) {
  if (squad.status === "moving") {
    let hash = 0;
    for (const char of squad.id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return { x: ((hash >>> 2) % 8) - 4, y: ((hash >>> 7) % 8) - 4 };
  }
  const anchor = globalMapNode(game, squad.nodeId)?.id;
  const peers = game.squads.filter((item) => item.status !== "dead" && item.status !== "moving" && globalMapNode(game, item.nodeId)?.id === anchor).sort((a, b) => a.id.localeCompare(b.id));
  if (peers.length <= 1) return { x: 0, y: -24 };
  const index = Math.max(0, peers.findIndex((item) => item.id === squad.id));
  const ring = Math.floor(index / 6);
  const slots = Math.min(6, peers.length - ring * 6);
  const angle = (-Math.PI / 2) + ((index % 6) / Math.max(1, slots)) * Math.PI * 2;
  const radius = 25 + ring * 17;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function SquadGlyph({ squad, compact = false }: { squad: Squad; compact?: boolean }) {
  const marker = getSquadMarkerIntel(squad);
  return (
    <span
      className={`squad-glyph shape-${marker.shape} quality-${marker.quality} ${compact ? "compact" : ""}`}
      style={{ "--squad-color": FACTIONS[squad.faction].color } as React.CSSProperties}
      title={`${marker.sizeLabel} · ${marker.qualityLabel} · ${squad.fighters} бойцов`}
    >
      <i />
      <b>{squad.fighters}</b>
      <em>{Array.from({ length: marker.chevrons }, (_, index) => <span key={index} />)}</em>
    </span>
  );
}

function StartScreen({
  hasSave,
  onContinue,
  onStart,
}: {
  hasSave: boolean;
  onContinue: () => void;
  onStart: (mode: CampaignMode, faction: PlayableFactionId, allegiance: PlayableFactionId | null) => void;
}) {
  const [mode, setMode] = useState<CampaignMode | null>(null);
  const [chosen, setChosen] = useState<PlayableFactionId>("stalkers");
  const [neutral, setNeutral] = useState(true);
  const faction = FACTIONS[chosen];
  const profile = FACTION_PROFILES[chosen];
  return (
    <main className="start-screen">
      <div className="start-vignette" />
      <section className="start-card">
        <div className="start-art" role="img" aria-label="Тактическая карта Зоны">
          <div className="start-title">
            <span>WAR GROUPS</span>
            <small>ЗОНА</small>
          </div>
          <p>Оперативно-тактическая симуляция группировок</p>
        </div>
        <div className="faction-select">
          <div className="eyebrow">НОВАЯ ИГРА · {mode ? "ШАГ 2 ИЗ 2" : "ШАГ 1 ИЗ 2"}</div>
          {!mode ? (
            <>
              <h1>Кем вы будете в Зоне?</h1>
              <p className="muted">Это не сложность, а две разные игры. Режим определяет, кем вы управляете и какую информацию показывает КПК.</p>
              <div className="mode-grid">
                <button type="button" className="mode-choice" onClick={() => { setMode("faction"); setNeutral(false); }}>
                  <span>⌂</span><b>ГЛАВА ГРУППИРОВКИ</b><small>Все отряды, штаб, экономика, исследования и дипломатия.</small><em>СТРАТЕГИЯ</em>
                </button>
                <button type="button" className="mode-choice recommended" onClick={() => { setMode("squad"); setNeutral(true); }}>
                  <span>●</span><b>КОМАНДИР ОТРЯДА</b><small>Три новичка, один рюкзак, маршруты, заказы, торговля и свобода выбора.</small><em>ПРИКЛЮЧЕНИЕ</em>
                </button>
              </div>
            </>
          ) : (
          <>
          <h1>{mode === "faction" ? "Выберите группировку" : "Выберите происхождение отряда"}</h1>
          <p className="muted">{mode === "faction" ? "Вы получите штаб и полное командование её силами." : "Можно вступить в группировку сразу или войти в Зону никому не известными новичками."}</p>
          <div className="faction-grid">
            {mode === "squad" && (
              <button
                type="button"
                className={`faction-choice neutral-choice ${neutral ? "active" : ""}`}
                onClick={() => setNeutral(true)}
              >
                <span className="faction-sigil">?</span>
                <span><b>Нейтральные новички</b><small>3 человека · Кордон · ПМ · 1 800 ₽</small></span>
              </button>
            )}
            {PLAYABLE_FACTIONS.map((id) => {
              const item = FACTIONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`faction-choice ${!neutral && chosen === id ? "active" : ""}`}
                  style={{ "--faction": item.color } as React.CSSProperties}
                  onClick={() => { setChosen(id); setNeutral(false); }}
                >
                  <span className="faction-sigil">{item.short}</span>
                  <span>
                    <b>{item.name}</b>
                    <small>{item.trait}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="selected-faction" style={{ "--faction": neutral ? "#c5c9b5" : faction.color } as React.CSSProperties}>
            <span className="status-lamp" />
            <span>Выбрано: <b>{neutral ? "Трое с Большой земли" : faction.name}</b><small>{neutral ? "Никому не подчиняются · репутацию и путь придётся заработать" : `${profile.doctrine} · ${profile.summary}`}</small></span>
          </div>
          <div className="start-actions">
            <button className="primary-action" type="button" onClick={() => onStart(mode, neutral ? "stalkers" : chosen, neutral ? null : chosen)}>
              {mode === "faction" ? "ПРИНЯТЬ КОМАНДОВАНИЕ" : "ВОЙТИ В ЗОНУ"}
            </button>
            <button className="secondary-action" type="button" onClick={() => setMode(null)}>← НАЗАД К РЕЖИМАМ</button>
            {hasSave && (
              <button className="secondary-action" type="button" onClick={onContinue}>
                ПРОДОЛЖИТЬ СОХРАНЕНИЕ
              </button>
            )}
          </div>
          </>
          )}
          {!mode && hasSave && <button className="secondary-action continue-alone" type="button" onClick={onContinue}>ПРОДОЛЖИТЬ СОХРАНЕНИЕ</button>}
        </div>
      </section>
    </main>
  );
}

function ZoneMap({
  game,
  setGame,
  onNode,
  onSquad,
  ui,
  onTogglePanel,
  onToggleHelp,
  onOpenPda,
}: {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
  onNode: (id: string) => void;
  onSquad: (id: string, nodeId: string) => void;
  ui: UiPreferences;
  onTogglePanel: () => void;
  onToggleHelp: () => void;
  onOpenPda: () => void;
}) {
  const [view, setView] = useState<MapView>(() => {
    if (game.campaignMode !== "squad") return { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
    const squad = game.squads.find((item) => item.id === game.playerSquadId);
    const node = squad ? globalMapNode(game, squad.nodeId) : null;
    const point = node ? nodePoint(node) : { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const width = 360;
    return clampMapView({ x: point.x - width / 2, y: point.y - width * (MAP_HEIGHT / MAP_WIDTH) / 2, width, height: width * (MAP_HEIGHT / MAP_WIDTH) });
  });
  const [hazardsVisible, setHazardsVisible] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedOperativeIds, setSelectedOperativeIds] = useState<string[]>(() => game.operatives.filter((operative) => operative.condition !== "dead" && operative.condition !== "left").slice(0, 1).map((operative) => operative.id));
  const [localContext, setLocalContext] = useState<{ left: number; top: number; x: number; y: number; object: LocalMapObject | null } | null>(null);
  const [mapAction, setMapAction] = useState<{ kind: "node"; id: string } | { kind: "squad"; id: string } | null>(null);
  const [conversationTargetId, setConversationTargetId] = useState<string | null>(null);
  const [recruitmentOpen, setRecruitmentOpen] = useState(false);
  const [selectionDrag, setSelectionDrag] = useState<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const panRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    view: MapView;
  } | null>(null);
  const touchPointsRef = useRef(new Map<number, { x: number; y: number }>());
  const touchTapRef = useRef<{ pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    midpointX: number;
    midpointY: number;
    view: MapView;
  } | null>(null);

  const visibleNodes = useMemo(() => game.nodes.filter((node) => node.mapLevel !== "sector"), [game.nodes]);
  const links = useMemo(() => {
    const seen = new Set<string>();
    const result: [ZoneNode, ZoneNode][] = [];
    for (const node of visibleNodes) {
      if (game.campaignMode === "squad" && !isSquadNodeKnown(game, node.id)) continue;
      for (const id of node.links) {
        const key = [node.id, id].sort().join(":");
        if (seen.has(key)) continue;
        const other = visibleNodes.find((item) => item.id === id);
        if (other && (game.campaignMode !== "squad" || isSquadNodeKnown(game, other.id))) result.push([node, other]);
        seen.add(key);
      }
    }
    return result;
  }, [game, visibleNodes]);

  const selectedNode = game.nodes.find((node) => node.id === game.selectedNodeId) ?? visibleNodes[0];
  const selectedGlobalNode = globalMapNode(game, selectedNode.id) ?? visibleNodes[0];
  const selectedSquad = game.squads.find((squad) => squad.id === game.selectedSquadId) ?? null;
  const selectedSquadNode = selectedSquad ? game.nodes.find((node) => node.id === selectedSquad.nodeId) : null;
  const playerSquad = game.squads.find((squad) => squad.id === game.playerSquadId) ?? null;
  const playerSquadNode = playerSquad ? game.nodes.find((node) => node.id === playerSquad.nodeId) : null;
  const currentSquadSectorId = getSquadCurrentSectorId(game);
  const currentSectorAnchorId = currentSquadSectorId ? getSectorMap(currentSquadSectorId)?.anchorNodeId ?? null : null;
  const currentFogShapeId = currentSectorAnchorId ? ZONE_SECTORS.find((sector) => sector.nodeIds.includes(currentSectorAnchorId))?.id ?? null : null;
  const livingOperatives = game.operatives.filter((operative) => operative.condition !== "dead" && operative.condition !== "left");
  const validSelectedOperativeIds = selectedOperativeIds.filter((id) => livingOperatives.some((operative) => operative.id === id));
  const activeSelectedOperativeIds = validSelectedOperativeIds.length ? validSelectedOperativeIds : livingOperatives.slice(0, 1).map((operative) => operative.id);
  const zoomPercent = Math.round((MAP_WIDTH / view.width) * 100);
  const strategicView = zoomPercent >= 165;
  const detailView = zoomPercent >= 260;
  const operativeView = game.campaignMode === "squad" && zoomPercent >= 520;
  const viewCenter = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
  const nearestFocusedSector = detailView
    ? SECTOR_MAPS.map((sector) => {
        const anchor = game.nodes.find((node) => node.id === sector.anchorNodeId);
        const point = anchor ? nodePoint(anchor) : { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
        return { sector, distance: Math.hypot(point.x - viewCenter.x, point.y - viewCenter.y) };
      }).sort((left, right) => left.distance - right.distance)[0]?.sector ?? null
    : null;
  const focusedSector = nearestFocusedSector && (game.campaignMode !== "squad" || nearestFocusedSector.id === currentSquadSectorId)
    ? nearestFocusedSector
    : null;
  const focusedSectorId = focusedSector?.id ?? null;
  const localAnchorNode = playerSquadNode ?? selectedSquadNode ?? selectedGlobalNode;
  const localAnchorPoint = inlineNodePoint(game, localAnchorNode, focusedSectorId);
  const localLayerVisible = Boolean(operativeView && playerSquad && playerSquad.status !== "moving" && Math.hypot(localAnchorPoint.x - viewCenter.x, localAnchorPoint.y - viewCenter.y) < view.width * .72);
  const localOrigin = { x: localAnchorPoint.x - 43, y: localAnchorPoint.y - 34 };
  const localScale = { x: .86, y: .68 };
  const localNodes = focusedSector
    ? focusedSector.points.map((point) => game.nodes.find((node) => node.id === point.id)).filter((node): node is ZoneNode => Boolean(node))
    : [];
  const focusedPointIds = new Set(localNodes.map((node) => node.id));
  const overviewNodeIds = new Set([
    selectedGlobalNode.id,
    ...(selectedSquadNode?.links ?? []),
    ...visibleNodes.filter((node) => node.type === "base" || MAJOR_MAP_LABEL_IDS.has(node.id)).map((node) => node.id),
  ]);
  const candidateRenderNodes = detailView
    ? [...visibleNodes.filter((node) => !focusedPointIds.has(node.id)), ...localNodes]
    : strategicView
      ? visibleNodes
      : visibleNodes.filter((node) => overviewNodeIds.has(node.id));
  const renderNodes = game.campaignMode === "squad"
    ? candidateRenderNodes.filter((node) => isSquadNodeKnown(game, node.id))
    : candidateRenderNodes;
  const commandSquad = game.campaignMode === "squad" ? playerSquad : selectedSquad;
  const commandSquadNode = commandSquad ? game.nodes.find((node) => node.id === commandSquad.nodeId) : null;
  const commandGlobalNode = commandSquad ? globalMapNode(game, commandSquad.nodeId) : selectedGlobalNode;
  const reachable = new Set(
    commandSquad && isPlayerControlledSquad(game, commandSquad) && !commandSquad.homeGarrison && commandSquad.status !== "moving" && commandSquad.status !== "combat"
      ? commandSquadNode?.sectorId === focusedSectorId && detailView
        ? commandSquadNode.localLinks ?? []
        : commandSquadNode?.links ?? []
      : [],
  );
  const selectedSectorId = focusedSectorId ?? currentFogShapeId ?? ZONE_SECTORS.find((sector) => sector.nodeIds.includes(selectedGlobalNode.id))?.id;
  const localLinks = focusedSector ? getSectorRoutes(focusedSector.id) : [];
  const mapSymbolScale = Math.max(.3, Math.min(1, view.width / 600));
  const overviewClusters = useMemo(() => {
    const clusters = new Map<string, { node: ZoneNode; faction: FactionId; squads: Squad[]; fighters: number }>();
    for (const squad of game.squads.filter((item) => item.status !== "dead" && (game.campaignMode !== "squad" || item.id === game.playerSquadId || game.nodes.find((node) => node.id === item.nodeId)?.sectorId === currentSquadSectorId))) {
      const node = globalMapNode(game, squad.nodeId);
      if (!node) continue;
      const key = `${node.id}:${squad.faction}`;
      const cluster = clusters.get(key) ?? { node, faction: squad.faction, squads: [], fighters: 0 };
      cluster.squads.push(squad);
      cluster.fighters += squad.fighters;
      clusters.set(key, cluster);
    }
    return [...clusters.values()];
  }, [game, currentSquadSectorId]);
  const tileZoom = Math.min(
    STALKER_MAP_MAX_TILE_ZOOM,
    zoomPercent < 160 ? 1 : zoomPercent < 280 ? 2 : zoomPercent < 480 ? 3 : 4,
  );
  const visibleTiles = useMemo(() => {
    const count = 2 ** tileZoom;
    const tileWidth = MAP_WIDTH / count;
    const tileHeight = MAP_HEIGHT / count;
    const minX = Math.max(0, Math.floor(view.x / tileWidth) - 1);
    const maxX = Math.min(count - 1, Math.floor((view.x + view.width) / tileWidth) + 1);
    const minY = Math.max(0, Math.floor(view.y / tileHeight) - 1);
    const maxY = Math.min(count - 1, Math.floor((view.y + view.height) / tileHeight) + 1);
    const tiles: { x: number; y: number; width: number; height: number; href: string }[] = [];
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        tiles.push({
          x: x * tileWidth,
          y: y * tileHeight,
          width: tileWidth + .35,
          height: tileHeight + .35,
          href: `${STALKER_MAP_TILE_ROOT}/${tileZoom}/${x}/${y}.jpg`,
        });
      }
    }
    return tiles;
  }, [tileZoom, view]);

  const zoomBy = (factor: number) => {
    setView((current) => clampMapView({
      x: current.x + (current.width - current.width * factor) / 2,
      y: current.y + (current.height - current.height * factor) / 2,
      width: current.width * factor,
      height: current.height * factor,
    }));
  };

  const zoomAtPointer = (event: React.WheelEvent<SVGSVGElement>, factor: number) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) {
      zoomBy(factor);
      return;
    }
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    setView((current) => {
      const nextWidth = current.width * factor;
      const nextHeight = current.height * factor;
      const ratioX = (point.x - current.x) / Math.max(1, current.width);
      const ratioY = (point.y - current.y) / Math.max(1, current.height);
      return clampMapView({
        x: point.x - nextWidth * ratioX,
        y: point.y - nextHeight * ratioY,
        width: nextWidth,
        height: nextHeight,
      });
    });
  };

  const panBy = (dx: number, dy: number) => {
    setView((current) => clampMapView({ ...current, x: current.x + dx, y: current.y + dy }));
  };

  const centerSelected = () => {
    const focusNode = game.campaignMode === "squad" && playerSquadNode ? playerSquadNode : selectedNode;
    const point = inlineNodePoint(game, focusNode, focusNode.sectorId ?? null);
    const width = game.campaignMode === "squad" ? 150 : Math.min(view.width, 320);
    const height = width * (MAP_HEIGHT / MAP_WIDTH);
    setView(clampMapView({
      x: point.x - width / 2,
      y: point.y - height / 2,
      width,
      height,
    }));
  };

  const setSquadMapScale = (scale: "zone" | "sector" | "squad") => {
    if (!playerSquadNode) return;
    if (scale === "zone") {
      setView({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT });
      return;
    }
    const focus = scale === "sector"
      ? globalMapNode(game, playerSquadNode.id) ?? playerSquadNode
      : playerSquadNode;
    const point = scale === "sector"
      ? nodePoint(focus)
      : inlineNodePoint(game, focus, focus.sectorId ?? null);
    const width = scale === "sector" ? 360 : 145;
    const height = width * (MAP_HEIGHT / MAP_WIDTH);
    setView(clampMapView({ x: point.x - width / 2, y: point.y - height / 2, width, height }));
  };

  useEffect(() => {
    const onFocusToggle = () => {
      setView((current) => {
        if (current.width < MAP_WIDTH * .72) return { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
        const focusNode = game.campaignMode === "squad" && playerSquadNode ? playerSquadNode : selectedNode;
        const point = inlineNodePoint(game, focusNode, focusNode.sectorId ?? null);
        const width = game.campaignMode === "squad" ? 150 : 320;
        const height = width * (MAP_HEIGHT / MAP_WIDTH);
        return clampMapView({ x: point.x - width / 2, y: point.y - height / 2, width, height });
      });
    };
    window.addEventListener("war-groups-map-focus", onFocusToggle);
    return () => window.removeEventListener("war-groups-map-focus", onFocusToggle);
  }, [game, playerSquadNode, selectedNode]);

  useEffect(() => {
    if (game.campaignMode !== "squad") return;
    const onNumberKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button,input,select,textarea,[contenteditable='true']")) return;
      if (event.ctrlKey && event.key.toLowerCase() === "a") {
        setSelectedOperativeIds(livingOperatives.map((operative) => operative.id));
        event.preventDefault();
        return;
      }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < livingOperatives.length) {
        setSelectedOperativeIds([livingOperatives[index].id]);
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onNumberKey);
    return () => window.removeEventListener("keydown", onNumberKey);
  }, [game.campaignMode, livingOperatives]);

  const localPointFromPointer = (event: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const mapPoint = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return {
      mapX: mapPoint.x,
      mapY: mapPoint.y,
      x: Math.max(0, Math.min(100, (mapPoint.x - localOrigin.x) / localScale.x)),
      y: Math.max(0, Math.min(100, (mapPoint.y - localOrigin.y) / localScale.y)),
    };
  };

  const pointInsideLocalLayer = (point: { mapX: number; mapY: number } | null) => Boolean(point
    && point.mapX >= localOrigin.x && point.mapX <= localOrigin.x + 100 * localScale.x
    && point.mapY >= localOrigin.y && point.mapY <= localOrigin.y + 100 * localScale.y);

  const localObjectAt = (x: number, y: number) => LOCAL_MAP_OBJECTS.find((object) => x >= object.x - 2 && x <= object.x + object.width + 2 && y >= object.y - 2 && y <= object.y + object.height + 2) ?? null;

  const issueLocalOrder = (order: OperativeOrder, destination?: { x: number; y: number }, object?: LocalMapObject | null) => {
    const ids = activeSelectedOperativeIds;
    setGame((current) => current ? issueOperativeOrder(current, ids, order, destination, object?.label) : current);
    setLocalContext(null);
  };

  const startPan = (event: React.PointerEvent<SVGSVGElement>) => {
    const target = event.target as Element;
    const interactiveTarget = Boolean(target.closest(".map-node, .squad-token, .operative-token"));
    const localPoint = localLayerVisible ? localPointFromPointer(event) : null;
    if (event.pointerType === "touch") {
      if (interactiveTarget) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchPointsRef.current.size >= 2) {
        const [left, right] = [...touchPointsRef.current.values()].slice(0, 2);
        pinchRef.current = {
          distance: Math.max(1, Math.hypot(right.x - left.x, right.y - left.y)),
          midpointX: (left.x + right.x) / 2,
          midpointY: (left.y + right.y) / 2,
          view,
        };
        panRef.current = null;
        touchTapRef.current = null;
        setSelectionDrag(null);
      } else {
        panRef.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, view };
        touchTapRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
        setIsPanning(true);
      }
      setMapAction(null);
      setLocalContext(null);
      return;
    }
    if (event.button === 0 && !interactiveTarget && !event.shiftKey && pointInsideLocalLayer(localPoint) && localPoint) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setMapAction(null);
      setLocalContext(null);
      setSelectionDrag({ pointerId: event.pointerId, startX: localPoint.x, startY: localPoint.y, x: localPoint.x, y: localPoint.y });
      return;
    }
    const leftDrag = event.button === 0 && (!interactiveTarget || event.shiftKey);
    const middleDrag = event.button === 1;
    if (!leftDrag && !middleDrag) return;
    event.preventDefault();
    panRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      view,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  };

  const movePan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch" && touchPointsRef.current.has(event.pointerId)) {
      touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const pinch = pinchRef.current;
      if (pinch && touchPointsRef.current.size >= 2) {
        const [left, right] = [...touchPointsRef.current.values()].slice(0, 2);
        const distance = Math.max(1, Math.hypot(right.x - left.x, right.y - left.y));
        const midpointX = (left.x + right.x) / 2;
        const midpointY = (left.y + right.y) / 2;
        const bounds = event.currentTarget.getBoundingClientRect();
        const ratioX = (pinch.midpointX - bounds.left) / Math.max(1, bounds.width);
        const ratioY = (pinch.midpointY - bounds.top) / Math.max(1, bounds.height);
        const anchorX = pinch.view.x + pinch.view.width * ratioX;
        const anchorY = pinch.view.y + pinch.view.height * ratioY;
        const nextWidth = pinch.view.width * (pinch.distance / distance);
        const nextHeight = pinch.view.height * (pinch.distance / distance);
        const currentRatioX = (midpointX - bounds.left) / Math.max(1, bounds.width);
        const currentRatioY = (midpointY - bounds.top) / Math.max(1, bounds.height);
        setView(clampMapView({
          x: anchorX - nextWidth * currentRatioX,
          y: anchorY - nextHeight * currentRatioY,
          width: nextWidth,
          height: nextHeight,
        }));
        return;
      }
      if (touchTapRef.current?.pointerId === event.pointerId && Math.hypot(event.clientX - touchTapRef.current.startX, event.clientY - touchTapRef.current.startY) > 7) {
        touchTapRef.current.moved = true;
      }
    }
    if (selectionDrag?.pointerId === event.pointerId) {
      const point = localPointFromPointer(event);
      if (point) setSelectionDrag((current) => current ? { ...current, x: point.x, y: point.y } : null);
      return;
    }
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const dx = ((pan.clientX - event.clientX) / Math.max(1, bounds.width)) * pan.view.width;
    const dy = ((pan.clientY - event.clientY) / Math.max(1, bounds.height)) * pan.view.height;
    setView(clampMapView({ ...pan.view, x: pan.view.x + dx, y: pan.view.y + dy }));
  };

  const stopPan = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch" && touchPointsRef.current.has(event.pointerId)) {
      const wasPinching = Boolean(pinchRef.current);
      const tap = touchTapRef.current?.pointerId === event.pointerId ? touchTapRef.current : null;
      touchPointsRef.current.delete(event.pointerId);
      if (touchPointsRef.current.size < 2) pinchRef.current = null;
      if (!touchPointsRef.current.size) {
        panRef.current = null;
        setIsPanning(false);
      }
      if (!wasPinching && tap && !tap.moved && localLayerVisible) {
        const point = localPointFromPointer(event);
        if (pointInsideLocalLayer(point) && point) issueLocalOrder("move", { x: point.x, y: point.y });
      }
      touchTapRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (selectionDrag?.pointerId === event.pointerId) {
      const point = localPointFromPointer(event) ?? selectionDrag;
      const minX = Math.min(selectionDrag.startX, point.x);
      const maxX = Math.max(selectionDrag.startX, point.x);
      const minY = Math.min(selectionDrag.startY, point.y);
      const maxY = Math.max(selectionDrag.startY, point.y);
      if (Math.hypot(point.x - selectionDrag.startX, point.y - selectionDrag.startY) > 2) {
        setSelectedOperativeIds(livingOperatives.filter((operative) => operative.localX >= minX && operative.localX <= maxX && operative.localY >= minY && operative.localY <= maxY).map((operative) => operative.id));
      } else {
        issueLocalOrder("move", { x: point.x, y: point.y });
      }
      setSelectionDrag(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (panRef.current?.pointerId !== event.pointerId) return;
    panRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const sectorOwner = (nodeIds: string[]): FactionId | null => {
    const counts = new Map<FactionId, number>();
    for (const id of nodeIds) {
      const owner = game.nodes.find((node) => node.id === id)?.owner;
      if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
    let result: FactionId | null = null;
    let best = 0;
    for (const [owner, count] of counts) {
      if (count > best) {
        result = owner;
        best = count;
      }
    }
    return result;
  };

  const actionNode = mapAction?.kind === "node" ? game.nodes.find((node) => node.id === mapAction.id) ?? null : null;
  const actionTarget = mapAction?.kind === "squad" ? game.squads.find((squad) => squad.id === mapAction.id) ?? null : null;
  const conversationTarget = conversationTargetId ? game.squads.find((squad) => squad.id === conversationTargetId) ?? null : null;
  const latestConversation = conversationTarget
    ? [...game.squadKnowledge.conversations].reverse().find((conversation) => conversation.targetSquadId === conversationTarget.id) ?? null
    : null;
  const conversationOffers = conversationTarget
    ? game.contracts.filter((contract) => contract.giverSquadId === conversationTarget.id && contract.status === "offered" && contract.briefedAt !== null && contract.declinedAt === null)
    : [];
  const conversationCulture = conversationTarget && conversationTarget.faction !== "mutants"
    ? FACTION_CULTURES[conversationTarget.faction]
    : null;
  const recruitmentAssessment = conversationTarget ? getFactionRecruitmentAssessment(game, conversationTarget.id) : null;
  const banditTributePrice = conversationTarget?.faction === "bandits" ? getBanditTributePrice(game, conversationTarget.id) : 0;
  const deceptionTargets = conversationTarget ? getDeceptionTargets(game, conversationTarget.id) : [];
  const actionOccupants = actionNode ? game.squads.filter((squad) => squad.status !== "dead" && squad.nodeId === actionNode.id && squad.id !== playerSquad?.id) : [];
  const actionOwner = actionNode?.owner ?? actionOccupants[0]?.faction ?? null;
  const sameActionNode = Boolean(actionNode && playerSquad?.nodeId === actionNode.id);
  const connectedActionNode = Boolean(actionNode && playerSquadNode && (playerSquadNode.links.includes(actionNode.id) || playerSquadNode.localLinks?.includes(actionNode.id)));
  const hostileActionNode = Boolean(actionOwner && playerSquad && actionOwner !== playerSquad.faction && (actionOwner === "mutants" || getRelation(game, playerSquad.faction, actionOwner) === "war"));
  const sameTargetNode = Boolean(actionTarget && playerSquad?.nodeId === actionTarget.nodeId);
  const connectedTargetNode = Boolean(actionTarget && playerSquadNode && (playerSquadNode.links.includes(actionTarget.nodeId) || playerSquadNode.localLinks?.includes(actionTarget.nodeId)));
  const canRecruit = canRecruitAtCurrentLocation(game);
  const recruitCandidates = getRecruitCandidates(game);

  const runLocationAction = (mode: LocationApproach) => {
    if (!playerSquad || !actionNode) return;
    setGame((current) => current ? issueLocationApproach(current, playerSquad.id, actionNode.id, mode) : current);
    setMapAction(null);
  };

  const runSquadAction = (action: "request_passage" | "attack" | "ambush") => {
    if (!playerSquad || !actionTarget) return;
    setGame((current) => current ? interactWithSquad(current, playerSquad.id, actionTarget.id, action) : current);
    setMapAction(null);
  };

  const openConversation = () => {
    if (!actionTarget || actionTarget.faction === "mutants") return;
    setGame((current) => current ? { ...current, speed: 0, selectedSquadId: actionTarget.id, selectedNodeId: actionTarget.nodeId } : current);
    setConversationTargetId(actionTarget.id);
    setMapAction(null);
  };

  const askConversationTopic = (topic: SquadConversationTopic) => {
    if (!conversationTarget) return;
    setGame((current) => current ? talkToSquad(current, conversationTarget.id, topic) : current);
  };

  return (
    <div className="zone-map-wrap">
      <svg
        className={`zone-map ${isPanning ? "panning" : ""} ${operativeView ? "operative-view" : detailView ? "detail-view" : strategicView ? "strategic-view" : "overview-view"}`}
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        preserveAspectRatio={game.campaignMode === "squad" && strategicView ? "xMidYMid slice" : "xMidYMid meet"}
        role="img"
        aria-label="Единая масштабируемая карта Чернобыльской Зоны"
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onAuxClick={(event) => event.preventDefault()}
        onContextMenu={(event) => {
          event.preventDefault();
          const point = localLayerVisible ? localPointFromPointer(event) : null;
          if (!pointInsideLocalLayer(point) || !point) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          setMapAction(null);
          setLocalContext({
            left: Math.max(0, Math.min(bounds.width - 230, event.clientX - bounds.left)),
            top: Math.max(0, Math.min(bounds.height - 300, event.clientY - bounds.top)),
            x: point.x,
            y: point.y,
            object: localObjectAt(point.x, point.y),
          });
        }}
        onWheel={(event) => {
          event.preventDefault();
          zoomAtPointer(event, event.deltaY > 0 ? 1.14 : 0.86);
        }}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const stepX = view.width * 0.12;
          const stepY = view.height * 0.12;
          if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") panBy(-stepX, 0);
          else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") panBy(stepX, 0);
          else if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") panBy(0, -stepY);
          else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") panBy(0, stepY);
          else if (event.key === "+" || event.key === "=") zoomBy(0.86);
          else if (event.key === "-") zoomBy(1.14);
          else return;
          event.preventDefault();
        }}
      >
        <defs>
          <pattern id="minorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M30 0H0V30" fill="none" stroke="rgba(180,193,157,.045)" strokeWidth="1" />
          </pattern>
          <pattern id="majorGrid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M120 0H0V120" fill="none" stroke="rgba(199,178,123,.09)" strokeWidth="1.3" />
          </pattern>
          <filter id="tokenShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity=".9" />
          </filter>
          <filter id="selectedGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#d6dfbd" floodOpacity=".35" />
          </filter>
          {game.campaignMode === "squad" && currentFogShapeId && (
            <mask id="squadFogMask">
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="white" />
              <path d={ZONE_SECTORS.find((sector) => sector.id === currentFogShapeId)?.path} fill="black" />
            </mask>
          )}
        </defs>
        <rect className="map-source-fallback" width={MAP_WIDTH} height={MAP_HEIGHT} />
        <g className="stalker-map-tiles" aria-hidden="true">
          {visibleTiles.map((tile) => (
            <image
              key={`${tileZoom}:${tile.x}:${tile.y}`}
              href={tile.href}
              x={tile.x}
              y={tile.y}
              width={tile.width}
              height={tile.height}
              preserveAspectRatio="none"
            />
          ))}
        </g>
        <rect className="map-tactical-wash" width={MAP_WIDTH} height={MAP_HEIGHT} />
        {detailView && <rect className="map-detail-grid" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#minorGrid)" />}
        {game.campaignMode === "squad" && currentFogShapeId && (
          <rect className="map-fog-war" width={MAP_WIDTH} height={MAP_HEIGHT} mask="url(#squadFogMask)" />
        )}

        <g className="sector-areas">
          {ZONE_SECTORS.map((sector) => {
            const owner = sectorOwner(sector.nodeIds);
            return (
              <g
                key={sector.id}
                className={`sector-area ${selectedSectorId === sector.id ? "selected" : ""} ${game.campaignMode === "squad" && sector.id !== currentFogShapeId ? "under-fog" : ""}`}
                style={{ "--sector-owner": owner ? FACTIONS[owner].color : "#7b826f" } as React.CSSProperties}
              >
                <path className="sector-boundary" d={sector.path} />
                {(!detailView || selectedSectorId === sector.id) && (
                  <>
                    <text className="sector-name" x={sector.labelX} y={sector.labelY}>{sector.name}</text>
                    <text className="sector-code" x={sector.labelX} y={sector.labelY + 13}>{sector.code}</text>
                  </>
                )}
              </g>
            );
          })}
        </g>

        {hazardsVisible && (
          <g className="hazard-fields">
            {HAZARD_FIELDS.map((field) => (
              <g key={field.id} className={`hazard-field ${field.tone}`} transform={`translate(${field.x} ${field.y})`}>
                <circle r={field.radius} />
                <circle r={field.radius * 0.72} />
                <text textAnchor="middle" y="3">{field.label}</text>
              </g>
            ))}
          </g>
        )}

        {focusedSector && (() => {
          const anchorNode = game.nodes.find((node) => node.id === focusedSector.anchorNodeId);
          const anchorPoint = anchorNode ? nodePoint(anchorNode) : { x: viewCenter.x, y: viewCenter.y };
          return (
            <g className={`inline-sector theme-${focusedSector.theme}`}>
              <ellipse className="inline-sector-ground" cx={anchorPoint.x} cy={anchorPoint.y} rx="118" ry="88" />
              <ellipse className="inline-sector-border" cx={anchorPoint.x} cy={anchorPoint.y} rx="112" ry="82" />
              <text className="inline-sector-title" x={anchorPoint.x} y={anchorPoint.y - 72} textAnchor="middle">{focusedSector.name} · {focusedSector.code}</text>
              <text className="inline-sector-terrain" x={anchorPoint.x} y={anchorPoint.y + 77} textAnchor="middle">{focusedSector.terrainLabels.join(" · ")}</text>
              <g className="inline-local-routes">
                {localLinks.map((route) => {
                  const aNode = game.nodes.find((node) => node.id === route.from);
                  const bNode = game.nodes.find((node) => node.id === route.to);
                  if (!aNode || !bNode) return null;
                  const a = inlineNodePoint(game, aNode, focusedSector.id);
                  const b = inlineNodePoint(game, bNode, focusedSector.id);
                  const selectedRoute = aNode.id === selectedSquadNode?.id || bNode.id === selectedSquadNode?.id;
                  const available = (aNode.id === selectedSquadNode?.id && reachable.has(bNode.id)) || (bNode.id === selectedSquadNode?.id && reachable.has(aNode.id));
                  return <path key={`${route.from}-${route.to}`} className={`${selectedRoute ? "selected" : ""} ${available ? "reachable" : ""}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />;
                })}
              </g>
            </g>
          );
        })()}

        {localLayerVisible && (
          <g className="unified-local-layer" transform={`translate(${localOrigin.x} ${localOrigin.y}) scale(${localScale.x} ${localScale.y})`}>
            <rect className="local-ground" width="100" height="100" rx="2" />
            <path className="local-road" d="M-4 84 C20 72 35 63 48 51 S77 30 104 22" />
            <path className="local-track" d="M4 42 C25 45 44 44 61 60 S86 78 101 82" />
            <text className="unified-local-title" x="50" y="6" textAnchor="middle">{localAnchorNode.name} · СВОБОДНОЕ ПЕРЕМЕЩЕНИЕ</text>
            <g className="local-objects">
              {LOCAL_MAP_OBJECTS.map((object) => (
                <g key={object.id} className={`local-object ${object.dangerous ? "dangerous" : ""}`}>
                  <rect x={object.x} y={object.y} width={object.width} height={object.height} rx="1" />
                  <text x={object.x + object.width / 2} y={object.y + object.height / 2} textAnchor="middle">{object.label}</text>
                  {object.cover && <text className="object-tag" x={object.x + 1} y={object.y + object.height - 1}>УКР</text>}
                </g>
              ))}
            </g>
            <g className="operative-orders">
              {livingOperatives.filter((operative) => operative.destinationX !== null && operative.destinationY !== null).map((operative) => (
                <path key={operative.id} d={`M${operative.localX} ${operative.localY} L${operative.destinationX} ${operative.destinationY}`} />
              ))}
            </g>
            <g className="operative-layer">
              {livingOperatives.map((operative, index) => {
                const selected = activeSelectedOperativeIds.includes(operative.id);
                return (
                  <g
                    key={operative.id}
                    className={`operative-token ${selected ? "selected" : ""} condition-${operative.condition}`}
                    transform={`translate(${operative.localX} ${operative.localY})`}
                    role="button"
                    tabIndex={0}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      if (event.button !== 0) return;
                      setSelectedOperativeIds((current) => event.shiftKey
                        ? current.includes(operative.id) ? current.filter((id) => id !== operative.id) : [...current, operative.id]
                        : [operative.id]);
                      setLocalContext(null);
                      setMapAction(null);
                    }}
                    onKeyDown={(event) => event.key === "Enter" && setSelectedOperativeIds([operative.id])}
                  >
                    <circle className="operative-ring" r={selected ? 3.2 : 2.6} />
                    <circle className="operative-core" r="1.65" />
                    <text className="operative-index" y=".6" textAnchor="middle">{index + 1}</text>
                    <text className="operative-label" y="-4" textAnchor="middle">{operative.callsign}</text>
                    <rect className="operative-hp-bg" x="-3.2" y="3.5" width="6.4" height=".7" />
                    <rect className="operative-hp" x="-3.2" y="3.5" width={6.4 * operative.health / operative.maxHealth} height=".7" />
                  </g>
                );
              })}
            </g>
            {selectionDrag && (
              <rect
                className="selection-box"
                x={Math.min(selectionDrag.startX, selectionDrag.x)}
                y={Math.min(selectionDrag.startY, selectionDrag.y)}
                width={Math.abs(selectionDrag.x - selectionDrag.startX)}
                height={Math.abs(selectionDrag.y - selectionDrag.startY)}
              />
            )}
          </g>
        )}

        <g className="map-links">
          {links.map(([a, b]) => {
            const key = [a.id, b.id].sort().join(":");
            const routeSelected = a.id === commandGlobalNode?.id || b.id === commandGlobalNode?.id;
            const routeReachable = (a.id === commandGlobalNode?.id && reachable.has(b.id)) || (b.id === commandGlobalNode?.id && reachable.has(a.id));
            const d = routePath(a, b);
            return (
              <g key={key} className={`map-route ${routeSelected ? "selected" : ""} ${routeReachable ? "reachable" : ""}`}>
                <path className="route-bed" d={d} />
                <path className="route-line" d={d} />
              </g>
            );
          })}
        </g>
        <g className="map-nodes">
          {renderNodes.map((node) => {
            const local = Boolean(focusedSectorId && node.sectorId === focusedSectorId && focusedPointIds.has(node.id));
            const point = inlineNodePoint(game, node, focusedSectorId);
            const freshIntel = game.campaignMode !== "squad" || node.sectorId === currentSquadSectorId;
            const owner = freshIntel && node.owner ? FACTIONS[node.owner] : null;
            const selected = game.selectedNodeId === node.id;
            const canReach = reachable.has(node.id);
            const activeEvent = freshIntel ? game.worldEvents.find((event) => event.nodeId === node.id && event.status === "active") : undefined;
            const labelBelow = node.y < 15 || (Math.round(node.x + node.y) % 2 === 0 && node.type !== "base");
            const labelY = labelBelow ? 31 : -25;
            return (
              <g
                key={node.id}
                className={`map-node ${local ? "local-node" : "global-node"} ${selected ? "selected" : ""} ${canReach ? "reachable" : ""} type-${node.type}`}
                transform={`translate(${point.x} ${point.y}) scale(${mapSymbolScale})`}
                onClick={(event) => {
                  event.stopPropagation();
                  setLocalContext(null);
                  if (game.campaignMode === "squad") setMapAction({ kind: "node", id: node.id });
                  onNode(node.id);
                }}
                role="button"
                tabIndex={0}
                aria-label={`${node.name}, ${freshIntel ? owner?.name ?? "нейтральная" : "данные о контроле неизвестны"}`}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  if (game.campaignMode === "squad") setMapAction({ kind: "node", id: node.id });
                  onNode(node.id);
                }}
              >
                <title>{node.name} · {getNodeIntel(node.id).sector} · {freshIntel ? owner?.name ?? "нейтральная территория" : "нет свежих данных"}{activeEvent ? ` · СОБЫТИЕ: ${activeEvent.title}` : ""}</title>
                <circle className="node-hit" r="28" />
                {activeEvent && <><circle className={`world-event-ring severity-${activeEvent.severity}`} r="29" /><text className="world-event-mark" x="21" y="-20">!</text></>}
                {node.capture > 0 && (
                  <circle className="capture-ring" r="25" pathLength="100" strokeDasharray={`${node.capture * 100} 100`} style={{ stroke: FACTIONS[node.captureFaction!].color }} />
                )}
                {canReach && <circle className="reachable-ring" r="24" />}
                <circle className="node-pulse" r={selected ? 22 : node.type === "base" ? 18 : 15} style={{ stroke: owner?.color ?? "#8c927f" }} />
                <circle className="node-core" r={node.type === "base" ? 11 : 8} style={{ fill: owner?.color ?? "#6d7164" }} />
                {node.type === "base" && <rect className="base-mark" x="-5" y="-5" width="10" height="10" />}
                {node.type === "anomaly" && <path className="anomaly-mark" d="M0 -6 L6 5 L-6 5Z" />}
                {node.type === "shelter" && <path className="shelter-mark" d="M-5 5V-1L0-6 5-1V5Z" />}
                {node.type === "outpost" && <path className="outpost-mark" d="M-4 4V-4H4V4ZM0-4V-8" />}
                {node.type === "camp" && <path className="camp-mark" d="M-6 5L0-6 6 5ZM-2 5V1H2V5" />}
                {(selected || canReach || (!detailView && (node.type === "base" || MAJOR_MAP_LABEL_IDS.has(node.id))) || local && node.type === "base") && <text className="node-label" y={labelY} textAnchor="middle">{node.name}</text>}
                {selected && <text className="node-income" y={labelY + 13} textAnchor="middle">{freshIntel ? `+${node.income} ₽` : "? ДАННЫЕ УСТАРЕЛИ"}</text>}
              </g>
            );
          })}
        </g>
        <g className="squad-tokens" filter="url(#tokenShadow)">
          {!strategicView && overviewClusters.map((cluster, clusterIndex) => {
            const point = nodePoint(cluster.node);
            const faction = FACTIONS[cluster.faction];
            const playerCluster = Boolean(playerSquad && cluster.squads.some((squad) => squad.id === playerSquad.id));
            const angle = ((clusterIndex % 7) / 7) * Math.PI * 2;
            const offset = { x: Math.cos(angle) * 11, y: Math.sin(angle) * 11 };
            const target = playerCluster ? playerSquad! : cluster.squads[0];
            return (
              <g
                key={`${cluster.node.id}:${cluster.faction}`}
                className={`squad-token squad-cluster ${playerCluster ? "selected" : ""}`}
                transform={`translate(${point.x + offset.x} ${point.y + offset.y}) scale(${mapSymbolScale})`}
                onClick={(event) => {
                  event.stopPropagation();
                  onSquad(target.id, cluster.node.id);
                  if (game.campaignMode === "squad" && target.id !== game.playerSquadId) setMapAction({ kind: "squad", id: target.id });
                }}
                role="button"
                tabIndex={0}
                aria-label={`${faction.name}: ${cluster.squads.length} отрядов, ${cluster.fighters} бойцов`}
              >
                <circle className="token-ring" r={playerCluster ? 16 : 13} style={{ stroke: faction.color }} />
                <circle className="token-core" r={playerCluster ? 8 : 6.5} style={{ fill: faction.color }} />
                <text className="cluster-count" y="2.5" textAnchor="middle">{cluster.squads.length}</text>
                <g className="token-fighter-count" transform="translate(12 -12)">
                  <rect x="-8" y="-5" width="16" height="9" rx="2" />
                  <text y="2" textAnchor="middle">{cluster.fighters}</text>
                </g>
              </g>
            );
          })}
          {strategicView && game.squads.filter((squad) => squad.status !== "dead" && (game.campaignMode !== "squad" || squad.id === game.playerSquadId || game.nodes.find((node) => node.id === squad.nodeId)?.sectorId === currentSquadSectorId)).map((squad) => {
            const displayNode = globalMapNode(game, squad.nodeId);
            if (!displayNode) return null;
            if (localLayerVisible && squad.id === game.playerSquadId) return null;
            const actualNode = game.nodes.find((node) => node.id === squad.nodeId);
            const visibleLocally = Boolean(actualNode?.sectorId === focusedSectorId && focusedPointIds.has(actualNode.id));
            if (actualNode?.mapLevel === "sector" && focusedSectorId && !visibleLocally) return null;
            const point = inlineSquadPoint(game, squad, focusedSectorId);
            const offset = tokenOffset(game, squad);
            const faction = FACTIONS[squad.faction];
            const selected = squad.id === game.selectedSquadId;
            const marker = getSquadMarkerIntel(squad);
            const coreSize = selected ? 8 : detailView ? 7 : squad.fighters >= 20 ? 7 : 5;
            const hexPath = `M0 ${-coreSize} L${coreSize * 0.88} ${-coreSize * 0.5} L${coreSize * 0.88} ${coreSize * 0.5} L0 ${coreSize} L${-coreSize * 0.88} ${coreSize * 0.5} L${-coreSize * 0.88} ${-coreSize * 0.5}Z`;
            return (
              <g
                key={squad.id}
                className={`squad-token unit-${squad.unitKind} shape-${marker.shape} quality-${marker.quality} ${selected ? "selected" : ""} ${squad.status === "combat" ? "combat" : ""}`}
                transform={`translate(${point.x + offset.x * mapSymbolScale} ${point.y + offset.y * mapSymbolScale}) scale(${mapSymbolScale})`}
                onClick={(event) => {
                  event.stopPropagation();
                  setLocalContext(null);
                  onSquad(squad.id, displayNode.id);
                  if (game.campaignMode === "squad" && squad.id !== game.playerSquadId) setMapAction({ kind: "squad", id: squad.id });
                }}
                role="button"
                tabIndex={0}
                aria-label={`${squad.name}, ${faction.name}, ${squad.fighters} бойцов, ${marker.qualityLabel}, ${getMissionLabel(game, squad)}`}
              >
                <circle className="token-ring" r={selected ? 14 : detailView ? 11 : squad.fighters >= 20 ? 10 : 8} style={{ stroke: faction.color }} />
                {squad.unitKind === "caravan"
                  ? <rect className="token-core caravan-core" x={selected ? -7 : -5} y={selected ? -7 : -5} width={selected ? 14 : 10} height={selected ? 14 : 10} rx="1" style={{ fill: faction.color }} />
                  : marker.shape === "square"
                    ? <rect className="token-core" x={-coreSize} y={-coreSize} width={coreSize * 2} height={coreSize * 2} rx="1" style={{ fill: faction.color }} />
                    : marker.shape === "diamond"
                      ? <rect className="token-core" x={-coreSize * 0.72} y={-coreSize * 0.72} width={coreSize * 1.44} height={coreSize * 1.44} transform="rotate(45)" style={{ fill: faction.color }} />
                      : marker.shape === "hexagon"
                        ? <path className="token-core" d={hexPath} style={{ fill: faction.color }} />
                        : <circle className="token-core" r={coreSize} style={{ fill: faction.color }} />}
                {selected && <text y="3" textAnchor="middle">{squad.unitKind === "caravan" ? "КР" : faction.short}</text>}
                <g className="token-fighter-count" transform={`translate(${selected ? 11 : 8} ${selected ? -12 : -9})`}>
                  <rect x="-6" y="-5" width="12" height="9" rx="2" />
                  <text y="2" textAnchor="middle">{squad.fighters}</text>
                </g>
                {selected && (
                  <>
                    <rect className="token-hp-bg" x="-11" y="13" width="22" height="3" rx="1" />
                    <rect className="token-hp" x="-11" y="13" width={22 * (squad.strength / squad.maxStrength)} height="3" rx="1" />
                  </>
                )}
              </g>
            );
          })}
        </g>
        {game.campaignMode === "squad" && (
          <g className="pda-intel-markers">
            {game.squadKnowledge.reports.filter((report) => report.nodeId && game.nodes.find((node) => node.id === report.nodeId)?.sectorId !== currentSquadSectorId).map((report) => {
              const reportNode = report.nodeId ? game.nodes.find((node) => node.id === report.nodeId) : null;
              const globalNode = reportNode ? globalMapNode(game, reportNode.id) : null;
              if (!globalNode) return null;
              const point = nodePoint(globalNode);
              return (
                <g key={report.id} className={`pda-intel-marker kind-${report.kind}`} transform={`translate(${point.x} ${point.y}) scale(${mapSymbolScale})`} onClick={() => report.nodeId && onNode(report.nodeId)} role="button" tabIndex={0}>
                  <circle r="12" />
                  <text textAnchor="middle" y="3">{report.kind === "danger" ? "!" : report.kind === "job" ? "$" : "?"}</text>
                  <title>{report.title} · достоверность {report.reliability}%</title>
                </g>
              );
            })}
          </g>
        )}
      </svg>
      {game.campaignMode === "squad" && actionNode && (
        <aside className="map-action-popover">
          <header>
            <span><small>ТОЧКА НА КАРТЕ</small><b>{actionNode.name}</b></span>
            <button type="button" onClick={() => setMapAction(null)}>×</button>
          </header>
          <div className="map-action-status">
            <span><i style={{ background: actionOwner ? FACTIONS[actionOwner].color : "#7d8678" }} />{actionOwner ? FACTIONS[actionOwner].name : "нейтральная"}</span>
            <b>{actionOccupants.reduce((sum, squad) => sum + squad.fighters, 0)} бойц. · {actionOccupants.length} отр.</b>
          </div>
          {playerSquad?.status === "moving" || playerSquad?.status === "combat" ? (
            <p>Сначала завершите текущий переход или бой.</p>
          ) : sameActionNode ? (
            <div className="map-action-buttons">
              {!actionOwner && <button type="button" onClick={() => runLocationAction("occupy")}><b>Занять точку</b><small>установить контроль · потребуется время</small></button>}
              {actionOwner === playerSquad?.faction && <button type="button" onClick={() => issueLocalOrder("hold")}><b>Удерживать позицию</b><small>бойцы закрепятся на месте</small></button>}
              {actionOwner && actionOwner !== playerSquad?.faction && <p>Вы уже внутри чужой точки. Нажмите на жетон местного отряда для разговора, прохода, нападения или засады.</p>}
            </div>
          ) : connectedActionNode ? (
            <div className="map-action-buttons">
              {(!actionOwner || actionOwner === playerSquad?.faction) && <button type="button" onClick={() => runLocationAction("travel")}><b>Перейти</b><small>обычный межлокационный маршрут</small></button>}
              {!actionOwner && <button type="button" onClick={() => runLocationAction("occupy")}><b>Перейти и занять</b><small>после прибытия начнётся захват</small></button>}
              {actionOwner && actionOwner !== playerSquad?.faction && !hostileActionNode && <button type="button" onClick={() => runLocationAction("peaceful")}><b>Войти мирно</b><small>без захвата и без открытия огня</small></button>}
              {actionOwner && actionOwner !== playerSquad?.faction && actionOwner !== "mutants" && !hostileActionNode && <button type="button" onClick={() => runLocationAction("request_access")}><b>Запросить проход</b><small>решение зависит от доверия и репутации</small></button>}
              {actionOwner && actionOwner !== playerSquad?.faction && <button className="danger" type="button" onClick={() => runLocationAction("attack")}><b>Штурмовать</b><small>открытая атака · начнётся война</small></button>}
              {actionOwner && actionOwner !== playerSquad?.faction && <button className="danger" type="button" onClick={() => runLocationAction("ambush")}><b>Подготовить засаду</b><small>скрытный вход · бонус первого контакта</small></button>}
            </div>
          ) : <p>Прямого перехода отсюда нет. Сначала выберите соседнюю связанную точку.</p>}
        </aside>
      )}

      {game.campaignMode === "squad" && actionTarget && playerSquad && (
        <aside className="map-action-popover">
          <header>
            <span><small>{FACTIONS[actionTarget.faction].name} · {actionTarget.fighters} БОЙЦ.</small><b>{actionTarget.name}</b></span>
            <button type="button" onClick={() => setMapAction(null)}>×</button>
          </header>
          <div className="map-action-status">
            <span><i style={{ background: FACTIONS[actionTarget.faction].color }} />{getMissionLabel(game, actionTarget)}</span>
            <b>{actionTarget.commander?.name ?? "без командира"}</b>
          </div>
          {sameTargetNode ? (
            <div className="map-action-buttons">
              {actionTarget.faction !== "mutants" && <button type="button" onClick={openConversation}><b>Поговорить</b><small>спросить о работе, угрозах, маршрутах и новостях</small></button>}
              {actionTarget.faction !== "mutants" && <button type="button" onClick={() => runSquadAction("request_passage")}><b>Договориться о проходе</b><small>полевой договор между командирами</small></button>}
              <button className="danger" type="button" onClick={() => runSquadAction("attack")}><b>Напасть</b><small>открыть бой прямо сейчас</small></button>
              <button className="danger" type="button" onClick={() => runSquadAction("ambush")}><b>Устроить засаду</b><small>укрытие, подавление и удар первым</small></button>
            </div>
          ) : connectedTargetNode ? (
            <div className="map-action-buttons">
              {!squadsAreHostile(game, playerSquad, actionTarget) && <button type="button" onClick={() => {
                setGame((current) => current ? issueLocationApproach(current, playerSquad.id, actionTarget.nodeId, "peaceful") : current);
                setMapAction(null);
              }}><b>Подойти мирно</b><small>войти в ту же точку без стрельбы</small></button>}
              <button className="danger" type="button" onClick={() => {
                setGame((current) => current ? issueLocationApproach(current, playerSquad.id, actionTarget.nodeId, "attack") : current);
                setMapAction(null);
              }}><b>Атаковать на точке</b><small>боевой вход по переходу</small></button>
              <button className="danger" type="button" onClick={() => {
                setGame((current) => current ? issueLocationApproach(current, playerSquad.id, actionTarget.nodeId, "ambush") : current);
                setMapAction(null);
              }}><b>Выйти в засаду</b><small>подготовиться до прибытия</small></button>
            </div>
          ) : <p>Отряд слишком далеко для прямого контакта. Проложите путь через соседние точки.</p>}
        </aside>
      )}

      {game.campaignMode === "squad" && conversationTarget && playerSquad && (
        <aside className="squad-conversation" aria-label={`Разговор с ${conversationTarget.name}`}>
          <header>
            <span><small>{FACTIONS[conversationTarget.faction].name} · {getFactionRankLabel(conversationTarget).toUpperCase()}</small><b>{conversationTarget.commander?.callsign ?? conversationTarget.name}</b><em>{conversationTarget.commander ? `${COMMANDER_DISPOSITION_LABELS[conversationTarget.commander.disposition]} · ${COMMANDER_BACKGROUND_LABELS[conversationTarget.commander.background]}` : `${conversationTarget.fighters} бойцов`}</em></span>
            <button type="button" aria-label="Закрыть разговор" onClick={() => setConversationTargetId(null)}>×</button>
          </header>
          <div className={`conversation-response ${latestConversation?.tone ?? "neutral"}`}>
            <span>{latestConversation?.speaker ?? conversationTarget.commander?.callsign ?? "Командир"}</span>
            <p>{latestConversation?.text ?? "Вы подошли достаточно близко для разговора. Что хотите узнать?"}</p>
          </div>
          <div className="conversation-topics">
            {([
              ["identity", "Кто вы?"],
              ["news", "Что слышно?"],
              ["danger", "Где опасно?"],
              ["route", "Что с дорогами?"],
              ["work", "Есть работа?"],
              ["faction", "О группировке"],
              ["recruitment", "Как вступить?"],
            ] as [SquadConversationTopic, string][]).map(([topic, label]) => <button type="button" key={topic} onClick={() => askConversationTopic(topic)}>{label}</button>)}
          </div>
          {conversationCulture && (latestConversation?.topic === "faction" || latestConversation?.topic === "recruitment") && (
            <details className="faction-contact-dossier" open>
              <summary>Устройство группировки</summary>
              <p><b>БАЗА</b>{conversationCulture.headquarters}</p>
              <p><b>ИЕРАРХИЯ</b>{conversationCulture.hierarchy.join(" → ")}</p>
              <p><b>НАБОР</b>{conversationCulture.recruitment}</p>
            </details>
          )}
          {recruitmentAssessment && latestConversation?.topic === "recruitment" && (
            <div className="recruitment-check">
              <span><b>{recruitmentAssessment.allowed ? "ГОТОВЫ ПРИНЯТЬ" : "УСЛОВИЯ НЕ ВЫПОЛНЕНЫ"}</b><small>{recruitmentAssessment.reason}</small></span>
              <button type="button" disabled={!recruitmentAssessment.allowed} onClick={() => setGame((current) => current ? requestFactionMembership(current, conversationTarget.id) : current)}>ВСТУПИТЬ</button>
            </div>
          )}
          {conversationOffers.length > 0 && (
            <div className="conversation-contracts">
              {conversationOffers.map((contract) => (
                <article key={contract.id}>
                  <div><span>{CONTRACT_TYPE_LABEL[contract.type]} · <em className={contract.risk}>{CONTRACT_RISK_LABEL[contract.risk]}</em></span><b>{contract.title}</b></div>
                  <p>{contract.description}</p>
                  <strong>{contract.reward.toLocaleString("ru-RU")} ₽ · срок {contractTimeLeft(game, contract.expiresAt)}</strong>
                  <footer>
                    <button type="button" onClick={() => setGame((current) => current ? negotiateContract(current, contract.id, "accept") : current)}>ВЗЯТЬ</button>
                    <button type="button" disabled={contract.negotiationClosed} onClick={() => setGame((current) => current ? negotiateContract(current, contract.id, "haggle") : current)}>ТОРГОВАТЬСЯ +20%</button>
                    <button className="danger" type="button" onClick={() => setGame((current) => current ? negotiateContract(current, contract.id, "decline") : current)}>ОТКАЗАТЬСЯ</button>
                  </footer>
                </article>
              ))}
            </div>
          )}
          <footer className="conversation-trade">
            <span><b>ПРИПАСЫ НА МЕСТЕ</b><small>36 патронов + бинт</small></span>
            <button type="button" disabled={game.rubles < getFieldSupplyPrice(game, conversationTarget.id) || conversationTarget.ammo < 20} onClick={() => setGame((current) => current ? buyFieldSupplies(current, conversationTarget.id) : current)}>{getFieldSupplyPrice(game, conversationTarget.id).toLocaleString("ru-RU")} ₽</button>
          </footer>
          {conversationTarget.faction === "bandits" && banditTributePrice > 0 && (
            <div className="bandit-tribute">
              <span><b>ДОЛЯ В ОБЩАК</b><small>Деньги поднимут доверие этой банды, но не сотрут предательство.</small></span>
              <button type="button" disabled={game.rubles < banditTributePrice} onClick={() => setGame((current) => current ? payBanditTribute(current, conversationTarget.id) : current)}>{banditTributePrice.toLocaleString("ru-RU")} ₽</button>
            </div>
          )}
          {deceptionTargets.length > 0 && (
            <div className="deception-offer">
              <span><b>ЛОЖНЫЙ НАВОД</b><small>Заманить банду на якобы богатую цель. Провал выдаст ваши намерения.</small></span>
              <div>{deceptionTargets.map((node) => <button type="button" key={node.id} onClick={() => setGame((current) => current ? startDeceptionPlot(current, conversationTarget.id, node.id) : current)}>{node.name}</button>)}</div>
            </div>
          )}
        </aside>
      )}

      {game.campaignMode === "squad" && game.deceptionPlot && (() => {
        const plotTarget = game.squads.find((squad) => squad.id === game.deceptionPlot?.targetSquadId);
        const plotNode = game.nodes.find((node) => node.id === game.deceptionPlot?.destinationNodeId);
        const canSpring = game.deceptionPlot.stage === "ready" && playerSquad?.nodeId === game.deceptionPlot.destinationNodeId && plotTarget?.nodeId === game.deceptionPlot.destinationNodeId;
        return <aside className={`deception-status stage-${game.deceptionPlot.stage}`}>
          <span><small>ТЁМНАЯ СХЕМА · {game.deceptionPlot.stage === "luring" ? "ЦЕЛЬ В ПУТИ" : game.deceptionPlot.stage === "ready" ? "ЗАСАДА ГОТОВА" : game.deceptionPlot.stage === "ambush" ? "ИДЁТ БОЙ" : game.deceptionPlot.stage === "completed" ? "ЦЕЛЬ УНИЧТОЖЕНА" : "СОРВАНО"}</small><b>{game.deceptionPlot.targetCommanderName} → {plotNode?.name ?? "неизвестно"}</b></span>
          {canSpring && <button className="danger" type="button" onClick={() => setGame((current) => current ? springDeceptionAmbush(current) : current)}>УБРАТЬ КОМАНДИРА</button>}
        </aside>;
      })()}

      {localContext && (
        <div className="rts-context-menu" style={{ left: localContext.left, top: localContext.top }}>
          <header><b>{localContext.object?.label ?? "Точка на местности"}</b><small>{activeSelectedOperativeIds.length || 1} бойц.</small></header>
          <button type="button" onClick={() => issueLocalOrder("move", localContext)}><b>Идти сюда</b><span>свободное движение</span></button>
          {localContext.object?.cover && <button type="button" onClick={() => issueLocalOrder("cover", localContext, localContext.object)}><b>Занять укрытие</b><span>рассредоточиться</span></button>}
          {localContext.object?.searchable && <button type="button" onClick={() => issueLocalOrder("search", localContext, localContext.object)}><b>Обыскать</b><span>{localContext.object.dangerous ? "есть риск отказа" : "припасы и хабар"}</span></button>}
          {localContext.object?.rest && <button type="button" onClick={() => issueLocalOrder("rest", localContext, localContext.object)}><b>Отдохнуть</b><span>здоровье и мораль</span></button>}
          <button type="button" onClick={() => issueLocalOrder("hold")}><b>Держать позицию</b><span>отменить движение</span></button>
          <button type="button" onClick={() => issueLocalOrder("follow")}><b>Следовать за командиром</b><span>собрать группу</span></button>
        </div>
      )}

      {game.campaignMode === "squad" && playerSquad?.status === "moving" && (
        <div className="unified-travel-progress">
          <span>{game.nodes.find((node) => node.id === playerSquad.previousNodeId)?.name ?? "Маршрут"}</span>
          <i><b style={{ width: `${Math.round(playerSquad.travel * 100)}%` }} /></i>
          <strong>{game.nodes.find((node) => node.id === playerSquad.destinationId)?.name ?? "переход"} · {Math.round(playerSquad.travel * 100)}%</strong>
        </div>
      )}

      {game.campaignMode === "squad" && recruitmentOpen && (
        <aside className="recruitment-panel unified-recruitment">
          <header><span><small>ЛЮДИ В ЭТОЙ ТОЧКЕ</small><b>Пополнение отряда</b></span><button type="button" onClick={() => setRecruitmentOpen(false)}>×</button></header>
          <p>Три человека — только старт. Цена зависит от опыта, навыков и снаряжения кандидата.</p>
          <div>
            {recruitCandidates.map((candidate) => (
              <article key={candidate.tier}>
                <span><small>{candidate.title}</small><b>«{candidate.callsign}»</b><em>{OPERATIVE_SPECIALIZATION_LABELS[candidate.specialization]} · {OPERATIVE_TRAIT_LABELS[candidate.trait]}</em></span>
                <dl><div><dt>ОПЫТ</dt><dd>{candidate.experience}</dd></div><div><dt>ЗДОРОВЬЕ</dt><dd>{candidate.health}</dd></div></dl>
                <small>{ZONE_ITEMS[candidate.weaponId].name} · {ZONE_ITEMS[candidate.armorId].name}</small>
                <button type="button" disabled={game.rubles < candidate.cost} onClick={() => setGame((current) => current ? hireOperative(current, candidate.tier) : current)}>{candidate.cost.toLocaleString("ru-RU")} ₽ · НАНЯТЬ</button>
              </article>
            ))}
          </div>
        </aside>
      )}

      {game.campaignMode === "squad" && (
        <footer className="unified-operative-dock">
          <div className="unified-operative-actions">
            <button type="button" onClick={centerSelected}>К ОТРЯДУ <kbd>M</kbd></button>
            <button type="button" onClick={onOpenPda}>КПК <kbd>I</kbd></button>
            <button type="button" disabled={!canRecruit} onClick={() => setRecruitmentOpen((current) => !current)}>НАЙМ</button>
          </div>
          <div className="operative-portraits">
            {game.operatives.map((operative, index) => (
              <button
                key={operative.id}
                type="button"
                disabled={operative.condition === "dead" || operative.condition === "left"}
                className={`${activeSelectedOperativeIds.includes(operative.id) ? "selected" : ""} condition-${operative.condition}`}
                onClick={(event) => setSelectedOperativeIds((current) => event.shiftKey
                  ? current.includes(operative.id) ? current.filter((id) => id !== operative.id) : [...current, operative.id]
                  : [operative.id])}
              >
                <span className="portrait-mark">{operative.callsign.slice(0, 2).toUpperCase()}<i>{index + 1}</i></span>
                <span><b>{operative.callsign}</b><small>{OPERATIVE_CONDITION_LABEL[operative.condition]} · {OPERATIVE_ORDER_LABELS[operative.order]}</small><em>{Math.round(operative.health)}/{operative.maxHealth}</em></span>
                <i className="portrait-health"><span style={{ width: `${operative.health / operative.maxHealth * 100}%` }} /></i>
              </button>
            ))}
          </div>
          <span className="unified-zoom-status">{operativeView ? "БОЙЦЫ" : detailView ? "ЛОКАЦИЯ" : strategicView ? "СЕКТОР" : "ВСЯ ЗОНА"}</span>
        </footer>
      )}
      <div className="map-corner-label top-left"><span>КПК // ОПЕРАТИВНАЯ СЕТЬ</span><b>ЧЕРНОБЫЛЬСКАЯ ЗОНА</b></div>
      <div className="map-source-credit">КАРТОГРАФИЯ 64K · IAMJORIC / GSC</div>
      <div className="map-toolbar" aria-label="Управление картой">
        {game.campaignMode === "squad" ? (
          <div className="squad-scale-switch" aria-label="Масштаб карты">
            <button type="button" className={!strategicView ? "active" : ""} onClick={() => setSquadMapScale("zone")}>ЗОНА</button>
            <button type="button" className={strategicView && !operativeView ? "active" : ""} onClick={() => setSquadMapScale("sector")}>СЕКТОР</button>
            <button type="button" className={operativeView ? "active" : ""} onClick={() => setSquadMapScale("squad")}>ОТРЯД</button>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => zoomBy(1.25)} aria-label="Уменьшить масштаб">−</button>
            <span>{zoomPercent}%</span>
            <button type="button" onClick={() => zoomBy(0.8)} aria-label="Увеличить масштаб">+</button>
            <button type="button" className="text-button" onClick={() => setView({ x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT })}>ВСЯ ЗОНА</button>
            <button type="button" className="text-button" onClick={centerSelected}>К ТОЧКЕ</button>
          </>
        )}
        {game.campaignMode === "faction" && <button type="button" className={`text-button layer-toggle ${hazardsVisible ? "active" : ""}`} onClick={() => setHazardsVisible((current) => !current)}>ОПАСНОСТИ</button>}
        {game.campaignMode === "faction" && <button type="button" className={`text-button layout-toggle ${ui.panelCollapsed && !ui.mapFocus ? "active" : ""}`} onClick={onTogglePanel}>ПАНЕЛЬ</button>}
        {game.campaignMode === "faction" && <button type="button" className={`help-toggle ${ui.helpVisible ? "active" : ""}`} aria-label="Подсказка по управлению" onClick={onToggleHelp}>?</button>}
      </div>
      <div className="unit-symbol-legend" aria-label="Обозначения отрядов">
        <span><i className="circle" />1–5 · звено</span>
        <span><i className="diamond" />6–9 / спецгруппа</span>
        <span><i className="hexagon" />10–19 / тяжёлая / элита</span>
        <span><i className="square" />20+ · сводная группа</span>
      </div>
      <div className="map-north" aria-hidden="true"><b>С</b><i /></div>
      <label className="map-pan-rail horizontal">
        <span>ЗАПАД</span>
        <input
          aria-label="Перемещение карты по горизонтали"
          disabled={view.width >= MAP_WIDTH}
          max={Math.max(0, MAP_WIDTH - view.width)}
          min="0"
          onChange={(event) => setView((current) => clampMapView({ ...current, x: Number(event.target.value) }))}
          style={{ "--thumb-size": `${Math.max(12, (view.width / MAP_WIDTH) * 100)}%` } as React.CSSProperties}
          type="range"
          value={view.x}
        />
        <span>ВОСТОК</span>
      </label>
      <label className="map-pan-rail vertical">
        <span>С</span>
        <input
          aria-label="Перемещение карты по вертикали"
          disabled={view.height >= MAP_HEIGHT}
          max={Math.max(0, MAP_HEIGHT - view.height)}
          min="0"
          onChange={(event) => setView((current) => clampMapView({ ...current, y: Number(event.target.value) }))}
          style={{ "--thumb-size": `${Math.max(12, (view.height / MAP_HEIGHT) * 100)}%` } as React.CSSProperties}
          type="range"
          value={view.y}
        />
        <span>Ю</span>
      </label>
      <div className="map-control-hint">КОЛЕСО: МАСШТАБ · ПРИБЛИЖЕНИЕ АВТОМАТИЧЕСКИ ОТКРЫВАЕТ ТОЧКИ СЕКТОРА</div>
    </div>
  );
}

function StatBar({ label, value, max = 100, tone = "green" }: { label: string; value: number; max?: number; tone?: "green" | "amber" | "red" }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <div className="bar"><i className={tone} style={{ width: pct(value, max) }} /></div>
      <b>{Math.round(value)}</b>
    </div>
  );
}

function SquadIntelCard({ squad, game }: { squad: Squad; game: GameState }) {
  const intel = getSquadIntel(squad);
  const archetype = getSquadArchetype(squad);
  const faction = FACTIONS[squad.faction];
  const fieldDeals = getActiveFieldDealsForSquad(game, squad.id);
  return (
    <div className={`squad-inspector quality-${intel.marker.quality} ${isPlayerControlledSquad(game, squad) ? "friendly" : "foreign"}`}>
      <div className="squad-inspector-head">
        <SquadGlyph squad={squad} />
        <span>
          <small>{isPlayerControlledSquad(game, squad) ? "ВАШЕ ПОДРАЗДЕЛЕНИЕ" : `РАЗВЕДДАННЫЕ // ${faction.name.toUpperCase()}`}</small>
          <b>{squad.name}</b>
          <em>{intel.marker.sizeLabel} · {intel.marker.qualityLabel} · {squad.homeGarrison ? "гарнизон" : STATUS_LABEL[squad.status]}</em>
        </span>
        <strong>{intel.combatPower}<small>СИЛА</small></strong>
      </div>
      {archetype && <p className="doctrine-note"><b>{archetype.name}</b> · {archetype.description}</p>}
      {squad.mutantType && <p className="doctrine-note"><b>{MUTANT_LABELS[squad.mutantType]}</b> · биологическая угроза, состав определяется размером стаи</p>}
      {squad.commander && (
        <div className="commander-card">
          <div className="commander-head"><span><small>КОМАНДИР ГРУППЫ</small><b>{squad.commander.name}</b></span><em>{COMMANDER_DISPOSITION_LABELS[squad.commander.disposition]}</em></div>
          <p>{COMMANDER_BACKGROUND_LABELS[squad.commander.background]}{squad.commander.previousFaction ? ` · раньше: ${FACTIONS[squad.commander.previousFaction].name}` : ""}</p>
          <div className="commander-stats">
            <span><small>ОПЫТ</small><b>{squad.commander.experience}</b></span>
            <span><small>ЛИДЕРСТВО</small><b>{squad.commander.leadership}</b></span>
            <span><small>ПЕРЕГОВОРЫ</small><b>{squad.commander.negotiation}</b></span>
            <span><small>ВЕРНОСТЬ</small><b className={squad.commander.loyalty < 30 ? "danger" : ""}>{squad.commander.loyalty}</b></span>
            <span><small>САМОСТ.</small><b>{squad.commander.autonomy}</b></span>
            <span><small>ЧЕСТЬ</small><b>{squad.commander.honor}</b></span>
          </div>
          <div className="commander-history"><span>Сделок: <b>{squad.commander.deals}</b></span><span>Нарушений слова: <b>{squad.commander.betrayals}</b></span></div>
        </div>
      )}
      {squad.unitKind === "combat" && (
        <div className="equipped-loadout">
          <span>СНАРЯЖЕНИЕ ГРУППЫ</span>
          <div>
            <i><small>ОРУЖИЕ</small><b>{squad.weaponId ? ZONE_ITEMS[squad.weaponId].name : "не выдано"}</b></i>
            <i><small>БРОНЯ</small><b>{squad.armorId ? ZONE_ITEMS[squad.armorId].name : "не выдана"}</b></i>
          </div>
          <p>{squad.artifactIds?.length ? `Артефакты: ${squad.artifactIds.map((id) => ZONE_ITEMS[id].name).join(", ")}` : "Артефактные слоты свободны: 0/2"}</p>
        </div>
      )}
      {fieldDeals.length > 0 && (
        <div className="field-deal-strip">
          <span>ПОЛЕВОЕ СОГЛАШЕНИЕ</span>
          {fieldDeals.map((deal) => {
            const otherId = deal.leftSquadId === squad.id ? deal.rightSquadId : deal.leftSquadId;
            const other = game.squads.find((item) => item.id === otherId);
            return <b key={deal.id}>{FIELD_DEAL_LABELS[deal.type]} · {other?.commander?.callsign ?? other?.name ?? "неизвестный"} · {Math.ceil((deal.expiresAt - game.simMinute) / 60)}ч</b>;
          })}
        </div>
      )}
      <StatBar label="БОЕСП." value={squad.strength} max={squad.maxStrength} tone={squad.strength < squad.maxStrength * 0.35 ? "red" : "green"} />
      <StatBar label="МОРАЛЬ" value={intel.morale} tone={intel.morale < 35 ? "red" : intel.morale < 60 ? "amber" : "green"} />
      <div className="squad-intel-grid">
        <span><small>ЛИЧНЫЙ СОСТАВ</small><b>{squad.fighters}/{squad.maxFighters}</b></span>
        <span><small>ПОТЕРИ</small><b>{intel.casualtyCount}</b></span>
        <span><small>ПОДГОТОВКА</small><b>{intel.training}/100</b></span>
        <span><small>ОПЫТ</small><b>{squad.xp} XP</b></span>
      </div>
      <div className="squad-skills">
        <span>НАВЫКИ ПОДРАЗДЕЛЕНИЯ</span>
        <div>
          {([['firepower', 'Огонь'], ['discipline', 'Дисциплина'], ['mobility', 'Манёвр'], ['survival', 'Выживание']] as const).map(([skill, label]) => (
            <i key={skill}><small>{label}</small><em><b style={{ width: `${intel.skills[skill]}%` }} /></em><strong>{intel.skills[skill]}</strong></i>
          ))}
        </div>
      </div>
      {squad.unitKind === "combat" && (
        <div className="squad-composition">
          <span>СОСТАВ ГРУППЫ</span>
          <div>
            {(Object.keys(FIGHTER_ROLE_LABELS) as (keyof typeof FIGHTER_ROLE_LABELS)[]).filter((role) => intel.composition[role] > 0).map((role) => (
              <i key={role}><small>{FIGHTER_ROLE_LABELS[role]}</small><b>{intel.composition[role]}</b></i>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type SquadPanelTab = "actions" | "inventory" | "contracts" | "contacts" | "log";

function SquadCommandPanel({
  game,
  setGame,
}: {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
}) {
  const [tab, setTab] = useState<SquadPanelTab>("actions");
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const squad = game.squads.find((item) => item.id === game.playerSquadId) ?? null;
  const node = squad ? game.nodes.find((item) => item.id === squad.nodeId) ?? null : null;
  if (!squad || !node) return <aside className="command-panel"><p className="empty-state">Связь с отрядом потеряна.</p></aside>;

  const location = getLocationContent(node.id, node.sectorId, node.type);
  const living = game.operatives.filter((operative) => operative.squadId === squad.id && operative.condition !== "dead" && operative.condition !== "left");
  const available = living.filter((operative) => operative.order === "idle" || operative.order === "hold");
  const activeOrders = living.filter((operative) => operative.actionUntil !== null || !["idle", "hold"].includes(operative.order));
  const routeIds = [...new Set([...(node.localLinks ?? []), ...(node.links ?? [])])];
  const contacts = game.squads.filter((item) => item.id !== squad.id && item.nodeId === node.id && item.status !== "dead" && item.status !== "moving");
  const humanContacts = contacts.filter((item) => item.faction !== "mutants");
  const tradeContacts = humanContacts.filter((item) => !squadsAreHostile(game, squad, item));
  const activeContact = contacts.find((item) => item.id === activeContactId) ?? null;
  const lastConversation = activeContact
    ? [...game.squadKnowledge.conversations].reverse().find((item) => item.targetSquadId === activeContact.id) ?? null
    : null;
  const activeContactOffers = activeContact
    ? game.contracts.filter((contract) => contract.giverSquadId === activeContact.id && contract.status === "offered" && contract.briefedAt !== null && contract.declinedAt === null)
    : [];
  const stashItems = (Object.keys(game.stash) as ZoneItemId[]).filter((id) => (game.stash[id] ?? 0) > 0 && ZONE_ITEMS[id]);
  const recentLog = game.log.slice(0, 8);
  const canSearchArtifact = node.type === "anomaly" || location.lootTags.some((tag) => /артефакт|аномал/i.test(tag));
  const busy = squad.status !== "idle" || activeOrders.length > 0;

  const orderHere = (order: "search" | "scout" | "artifact" | "rest") => {
    const candidates = order === "rest" ? living.map((operative) => operative.id) : available.slice(0, 1).map((operative) => operative.id);
    if (!candidates.length) return;
    setGame((current) => current ? issueOperativeOrder(current, candidates, order, undefined, node.name) : current);
  };

  const ask = (targetId: string, topic: SquadConversationTopic) => {
    setActiveContactId(targetId);
    setGame((current) => current ? talkToSquad(current, targetId, topic) : current);
  };

  return (
    <aside className="command-panel squad-command-panel">
      <nav className="panel-tabs" aria-label="Разделы КПК отряда">
        {([[
          "actions", "ДЕЙСТВИЯ",
        ], ["inventory", "РЮКЗАК"], ["contracts", "ЗАКАЗЫ"], ["contacts", `РЯДОМ${contacts.length ? ` ${contacts.length}` : ""}`], ["log", "ЖУРНАЛ"]] as [SquadPanelTab, string][]).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} type="button">{label}</button>
        ))}
      </nav>

      <div className="panel-content squad-panel-content">
        {tab === "actions" && (
          <>
            <section className="place-action-head">
              <span>ВЫ НАХОДИТЕСЬ</span><h2>{node.name}</h2>
              <div><b>{living.length} чел.</b><b>{contacts.length ? `контактов рядом: ${contacts.length}` : "рядом никого"}</b><b>{STATUS_LABEL[squad.status]}</b></div>
            </section>

            {activeOrders.length > 0 && <div className="activity-progress">{activeOrders.map((operative) => <span key={operative.id}><b>{operative.callsign}</b><em>{OPERATIVE_ORDER_LABELS[operative.order]} · {operative.actionUntil ? `${Math.max(0, Math.ceil(operative.actionUntil - game.simMinute))} мин.` : "выполняет"}</em></span>)}</div>}

            <section className="place-actions">
              <header><span>ЧТО ДЕЛАТЬ ЗДЕСЬ</span><small>действия занимают игровое время и дают настоящий результат</small></header>
              <div>
                <button type="button" disabled={busy || !available.length} onClick={() => orderHere("search")}><b>ОБЫСКАТЬ МЕСТО</b><small>хабар, припасы, деньги · возможен риск</small></button>
                <button type="button" disabled={busy || !available.length} onClick={() => orderHere("scout")}><b>РАЗВЕДАТЬ ОКРУГУ</b><small>открыть подходы, отряды и угрозы</small></button>
                <button type="button" disabled={busy || !living.length} onClick={() => orderHere("rest")}><b>ОТДОХНУТЬ</b><small>лечение и мораль · 45 минут</small></button>
                <button type="button" disabled={busy || !available.length || !canSearchArtifact} onClick={() => orderHere("artifact")}><b>ИСКАТЬ АРТЕФАКТ</b><small>{canSearchArtifact ? "шанс зависит от места и опыта" : "здесь нет подходящего поля"}</small></button>
                {!node.owner && <button type="button" disabled={busy} onClick={() => setGame((current) => current ? issueLocationApproach(current, squad.id, node.id, "occupy") : current)}><b>ЗАНЯТЬ ТОЧКУ</b><small>начать захват и сделать место своим</small></button>}
                {contacts.length > 0 && <button type="button" onClick={() => setTab("contacts")}><b>ПОДОЙТИ К ЛЮДЯМ</b><small>{humanContacts.length ? `${humanContacts.length} человеческих отрядов рядом` : "рядом только мутанты"}</small></button>}
              </div>
            </section>

            <section className="route-actions">
              <header><span>УЙТИ С ЭТОЙ ТОЧКИ</span><small>только реальные соседние переходы</small></header>
              <div>{routeIds.map((destinationId) => {
                const destination = game.nodes.find((item) => item.id === destinationId);
                if (!destination) return null;
                const local = Boolean(node.localLinks?.includes(destinationId));
                return <button type="button" disabled={busy} key={destination.id} onClick={() => setGame((current) => current ? local ? issueSectorMove(current, squad.id, destination.id) : issueMove(current, squad.id, destination.id) : current)}><span><b>{destination.name}</b><small>{local ? "внутри текущего сектора" : "переход в другой сектор"}</small></span><em>{destination.owner ? FACTIONS[destination.owner].short : "—"}</em></button>;
              })}</div>
            </section>

            <section className="last-results"><header><span>ПОСЛЕДНИЕ РЕЗУЛЬТАТЫ</span><button type="button" onClick={() => setTab("log")}>ВЕСЬ ЖУРНАЛ</button></header>{recentLog.slice(0, 3).map((entry) => <p className={entry.tone} key={entry.id}><time>{formatGameTime(entry.minute).clock}</time>{entry.text}</p>)}</section>
          </>
        )}

        {tab === "contacts" && (
          <>
            <div className="compact-panel-head"><span>ФИЗИЧЕСКИ НА ЭТОЙ ТОЧКЕ</span><h2>{contacts.length ? `${contacts.length} контакт(а)` : "Рядом никого"}</h2></div>
            {!contacts.length && <p className="empty-state">Чтобы поговорить или торговать, нужно прийти на одну точку с другим отрядом.</p>}
            <div className="nearby-contact-list">{contacts.map((contact) => (
              <article className={activeContactId === contact.id ? "active" : ""} key={contact.id}>
                <header><i style={{ background: FACTIONS[contact.faction].color }} /><span><b>{contact.name}</b><small>{FACTIONS[contact.faction].name} · {contact.fighters} бойцов · {contact.commander?.callsign ?? "без командира"}</small></span></header>
                {contact.faction === "mutants" ? (
                  <div className="contact-actions"><button className="danger" type="button" onClick={() => setGame((current) => current ? interactWithSquad(current, squad.id, contact.id, "attack") : current)}>АТАКОВАТЬ</button><button type="button" onClick={() => setTab("actions")}>ОТОЙТИ</button></div>
                ) : (
                  <div className="contact-actions">
                    <button type="button" onClick={() => ask(contact.id, "identity")}>ПОГОВОРИТЬ</button>
                    <button type="button" onClick={() => ask(contact.id, "news")}>НОВОСТИ</button>
                    <button type="button" onClick={() => ask(contact.id, "work")}>РАБОТА</button>
                    {!squadsAreHostile(game, squad, contact) && <button type="button" onClick={() => setActiveContactId(contact.id)}>ТОРГОВАТЬ</button>}
                    <button className="danger" type="button" onClick={() => setGame((current) => current ? interactWithSquad(current, squad.id, contact.id, "attack") : current)}>НАПАСТЬ</button>
                    <button className="danger" type="button" onClick={() => setGame((current) => current ? interactWithSquad(current, squad.id, contact.id, "ambush") : current)}>ЗАСАДА</button>
                  </div>
                )}
              </article>
            ))}</div>
            {activeContact && activeContact.faction !== "mutants" && !squadsAreHostile(game, squad, activeContact) && (
              <section className="contact-dialog-result">
                <header><span><small>{FACTIONS[activeContact.faction].name}</small><b>{activeContact.commander?.callsign ?? activeContact.name}</b></span><button type="button" onClick={() => setActiveContactId(null)}>×</button></header>
                <p>{lastConversation?.text ?? "Контакт установлен. Выберите, о чём говорить, или обменяйтесь припасами."}</p>
                {activeContactOffers.map((contract) => <article key={contract.id}><b>{contract.title}</b><small>{contract.reward.toLocaleString("ru-RU")} ₽ · {CONTRACT_RISK_LABEL[contract.risk]}</small><div><button type="button" onClick={() => setGame((current) => current ? negotiateContract(current, contract.id, "accept") : current)}>ВЗЯТЬ</button><button type="button" onClick={() => setGame((current) => current ? negotiateContract(current, contract.id, "haggle") : current)}>ТОРГОВАТЬСЯ</button></div></article>)}
                <div className="field-trade"><span><b>36 патронов + бинт</b><small>припасы передаются сразу</small></span><button type="button" disabled={game.rubles < getFieldSupplyPrice(game, activeContact.id) || activeContact.ammo < 20} onClick={() => setGame((current) => current ? buyFieldSupplies(current, activeContact.id) : current)}>{getFieldSupplyPrice(game, activeContact.id).toLocaleString("ru-RU")} ₽</button></div>
              </section>
            )}
          </>
        )}

        {tab === "inventory" && (
          <>
            <div className="compact-panel-head"><span>СНАРЯЖЕНИЕ И ХАБАР</span><h2>Рюкзак отряда</h2></div>
            <div className="compact-inventory">{stashItems.length ? stashItems.map((itemId) => {
              const item = ZONE_ITEMS[itemId];
              const amount = game.stash[itemId] ?? 0;
              const usable = item.category === "consumable";
              const equippable = ["weapon", "armor", "artifact"].includes(item.category);
              return <article key={itemId}><span><b>{item.name} ×{amount}</b><small>{ITEM_CATEGORY_LABELS[item.category]} · {getContentItemSaleValue(game, itemId).toLocaleString("ru-RU")} ₽/шт.</small></span><div>{usable && <button type="button" onClick={() => setGame((current) => current ? supplySquadFromStash(current, squad.id, itemId) : current)}>ИСПОЛЬЗОВАТЬ</button>}{equippable && <button type="button" onClick={() => setGame((current) => current ? equipSquadItem(current, squad.id, itemId) : current)}>ЭКИПИРОВАТЬ</button>}{tradeContacts.length > 0 && <button type="button" onClick={() => setGame((current) => current ? sellContentItem(current, itemId) : current)}>ПРОДАТЬ</button>}</div></article>;
            }) : <p className="empty-state">Рюкзак пуст.</p>}</div>
            {!tradeContacts.length && <p className="context-note">Продажа появится, когда рядом будет мирный человеческий отряд или торговец.</p>}
          </>
        )}

        {tab === "contracts" && (
          <>
            <div className="compact-panel-head"><span>РАБОТА И ОБЕЩАНИЯ</span><h2>Заказы</h2></div>
            <div className="compact-contracts">{game.contracts.filter((contract) => contract.status === "active" || contract.status === "offered").map((contract) => {
              const giver = contract.giverSquadId ? game.squads.find((item) => item.id === contract.giverSquadId) : null;
              return <article key={contract.id} className={contract.status}><header><span>{CONTRACT_TYPE_LABEL[contract.type]}</span><time>{contractTimeLeft(game, contract.expiresAt)}</time></header><b>{contract.briefedAt ? contract.title : "Условия узнаете при встрече"}</b><p>{contract.briefedAt ? contract.description : `${giver?.commander?.callsign ?? giver?.name ?? "Заказчик"} должен рассказать детали лично.`}</p><small>{contract.status === "active" ? `${contract.progress}/${contract.goal} · ${contract.reward.toLocaleString("ru-RU")} ₽` : "Сначала поговорите с заказчиком"}</small></article>;
            })}</div>
          </>
        )}

        {tab === "log" && (
          <>
            <div className="compact-panel-head"><span>ПРИКАЗ → СОБЫТИЕ → РЕЗУЛЬТАТ</span><h2>Журнал отряда</h2></div>
            <div className="compact-log">{game.log.slice(0, 40).map((entry) => <p className={entry.tone} key={entry.id}><time>{formatGameTime(entry.minute).clock}</time><span>{entry.text}</span></p>)}</div>
          </>
        )}
      </div>
    </aside>
  );
}

function CommandPanel({
  game,
  setGame,
}: {
  game: GameState;
  setGame: React.Dispatch<React.SetStateAction<GameState | null>>;
}) {
  const [tab, setTab] = useState<PanelTab>("sector");
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  if (game.campaignMode === "squad") return <SquadCommandPanel game={game} setGame={setGame} />;
  const squad = game.campaignMode === "squad"
    ? game.squads.find((item) => item.id === game.playerSquadId) ?? null
    : game.squads.find((item) => item.id === game.selectedSquadId) ?? null;
  const node = game.nodes.find((item) => item.id === (game.campaignMode === "squad" && squad ? squad.nodeId : game.selectedNodeId))!;
  const intel = getNodeIntel(node.id);
  const locationContent = getLocationContent(node.id, node.sectorId, node.type);
  const locationEvents = game.worldEvents.filter((event) => event.nodeId === node.id && event.status === "active");
  const squadNode = squad ? game.nodes.find((item) => item.id === squad.nodeId) ?? null : null;
  const squadRouteIds = squadNode
    ? [...new Set([...(squadNode.links ?? []), ...(squadNode.localLinks ?? [])])]
    : [];
  const atNode = game.squads.filter((item) => item.nodeId === node.id && item.status !== "dead" && item.status !== "moving");
  const playerSquads = game.squads.filter((item) => isPlayerControlledSquad(game, item) && item.unitKind === "combat" && item.status !== "dead");
  const mobileSquads = playerSquads.filter((item) => !item.homeGarrison);
  const garrisonSquads = playerSquads.filter((item) => item.homeGarrison);
  const playerBalance = getFactionBalanceSummary(game);
  const maxSquads = playerBalance.armyLimit;
  const economy = getEconomySummary(game);
  const alife = getALifeCounts(game);
  const autonomous = game.squads.filter((item) => item.status !== "dead" && !["player", "hold"].includes(item.mission));
  const activeOperations = game.operations.filter((operation) => operation.status === "planned" || operation.status === "active").sort((left, right) => right.startedAt - left.startedAt);
  const activeWorldEvents = game.worldEvents.filter((event) => event.status === "active").sort((left, right) => right.severity - left.severity || left.expiresAt - right.expiresAt);
  const recentFieldDeals = game.fieldDeals.filter((deal) => deal.status === "active" || game.simMinute - deal.startedAt <= 360).slice(-8).reverse();
  const playerProfile = FACTION_PROFILES[game.playerFaction];
  const reinforcementCost = squad ? getReinforcementCost(game, squad) : 0;
  const canReinforce = Boolean(game.campaignMode === "faction" && squad && isPlayerControlledSquad(game, squad) && squad.unitKind === "combat" && squad.status === "idle" && squad.fighters < squad.maxFighters && squadNode?.baseFor === game.playerFaction && squadNode.owner === game.playerFaction && game.rubles >= reinforcementCost && game.factionStrategy[game.playerFaction].manpower >= squad.maxFighters - squad.fighters);
  const stashSquad = squad && isPlayerControlledSquad(game, squad) && squad.unitKind === "combat" ? squad : mobileSquads[0] ?? null;
  const stashSquadNode = stashSquad ? game.nodes.find((item) => item.id === stashSquad.nodeId) : null;
  const canUseStash = Boolean(stashSquad && stashSquad.status === "idle" && (game.campaignMode === "squad" || (stashSquadNode?.owner === game.playerFaction && stashSquadNode.baseFor === game.playerFaction)));
  const stashItems = (Object.keys(game.stash) as ZoneItemId[]).filter((id) => (game.stash[id] ?? 0) > 0 && ZONE_ITEMS[id]);
  const pendingDiplomacy = game.diplomaticOffers.filter((offer) => offer.status === "pending").length;
  const diplomacyNetwork = PLAYABLE_FACTIONS.flatMap((left, leftIndex) => PLAYABLE_FACTIONS.slice(leftIndex + 1).map((right) => ({
    left,
    right,
    relation: getRelation(game, left, right),
    memory: getBilateralDiplomacy(game, left, right),
  }))).filter((pair) => pair.left !== game.playerFaction && pair.right !== game.playerFaction).sort((a, b) => {
    const priority = (pair: typeof a) => pair.relation === "war" ? 400 : pair.relation === "alliance" ? 300 : pair.memory.tradePact ? 200 : pair.memory.tension;
    return priority(b) - priority(a);
  });
  const selectedSquadEvents = squad
    ? game.log.filter((entry) => entry.text.includes(squad.name) || Boolean(squad.commander && (entry.text.includes(squad.commander.name) || entry.text.includes(squad.commander.callsign)))).slice(0, 3)
    : [];
  const visibleLog = game.log.filter((entry) => logFilter === "all" || getLogCategory(entry.text) === logFilter);

  return (
    <aside className="command-panel">
      <nav className="panel-tabs" aria-label="Разделы управления">
        {(game.campaignMode === "squad" ? [
          ["sector", "МАРШРУТ"],
          ["base", "РЮКЗАК"],
          ["contracts", "ЗАКАЗЫ"],
          ["diplomacy", "КОНТАКТЫ"],
          ["log", "ПДА"],
        ] : [
          ["sector", "ПРИКАЗЫ"],
          ["alife", "СВОДКА"],
          ["base", "ШТАБ"],
          ["contracts", "ЗАДАЧИ"],
          ["research", "НИОКР"],
          ["diplomacy", "СВЯЗЬ"],
          ["log", "ПДА"],
        ] as [PanelTab, string][]).map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} type="button">{label}{id === "diplomacy" && pendingDiplomacy > 0 && <span className="tab-alert">{pendingDiplomacy}</span>}</button>
        ))}
      </nav>

      <div className="panel-content">
        {tab === "sector" && (
          <>
            {squad && isPlayerControlledSquad(game, squad) && squad.unitKind === "combat" && squad.status !== "dead" && (
              <section className={`quick-command-console status-${squad.status}`} aria-label={`Управление отрядом ${squad.name}`}>
                <header>
                  <div><span className="eyebrow">ВЫБРАН ВАШ ОТРЯД</span><h2>{squad.name}</h2></div>
                  <strong>{squad.homeGarrison ? "ГАРНИЗОН" : STATUS_LABEL[squad.status]}</strong>
                </header>
                <div className="command-location">
                  <span>СЕЙЧАС</span><b>{squadNode?.name ?? "связь потеряна"}</b>
                  {squad.destinationId && <small>→ {game.nodes.find((item) => item.id === squad.destinationId)?.name}</small>}
                </div>
                <div className="command-flow">
                  <span className="done"><b>1</b><small>Отряд выбран</small></span>
                  <span className={squad.status === "idle" ? "active" : "done"}><b>2</b><small>{squad.status === "idle" ? "Выберите маршрут" : "Приказ получен"}</small></span>
                  <span className={squad.status === "moving" || squad.status === "combat" || squad.status === "capturing" ? "active" : ""}><b>3</b><small>Следите за результатом</small></span>
                </div>
                {squad.homeGarrison ? (
                  <p className="command-explanation">Этот отряд закреплён за точкой. Он держит оборону автоматически и не может перемещаться.</p>
                ) : squad.status === "moving" ? (
                  <div className="command-progress"><span>ВЫПОЛНЕНИЕ ПРИКАЗА <b>{Math.round(squad.travel * 100)}%</b></span><i><em style={{ width: pct(squad.travel, 1) }} /></i></div>
                ) : squad.status === "combat" ? (
                  <button className="command-primary danger" type="button" onClick={() => setGame((current) => current ? { ...current, selectedNodeId: squad.nodeId, tacticalNodeId: squad.nodeId, tacticalTargetId: null } : current)}>
                    <b>ОТКРЫТЬ БОЕВОЕ УПРАВЛЕНИЕ</b><small>цели · огонь · укрытие · отход</small>
                  </button>
                ) : squadRouteIds.length > 0 ? (
                  <div className="quick-routes">
                    <span>ОТДАТЬ ПРИКАЗ: КУДА ИДТИ</span>
                    {squadRouteIds.map((destinationId) => {
                      const destination = game.nodes.find((item) => item.id === destinationId);
                      if (!destination) return null;
                      const localRoute = Boolean(squadNode?.localLinks?.includes(destinationId));
                      const relation = destination.owner ? getRelation(game, game.playerFaction, destination.owner) : null;
                      return (
                        <button key={destinationId} type="button" onClick={() => setGame((current) => current ? localRoute ? issueSectorMove(current, squad.id, destinationId) : issueMove(current, squad.id, destinationId) : current)}>
                          <span><b>{destination.name}</b><small>{localRoute ? "внутри сектора" : "переход между секторами"}</small></span>
                          <em>{destination.owner ? `${FACTIONS[destination.owner].short} · ${relation === "war" ? "ВРАГ" : relation === "alliance" ? "СОЮЗ" : "КОНТАКТ"}` : "НЕЙТРАЛЬНО"}</em>
                        </button>
                      );
                    })}
                  </div>
                ) : <p className="command-explanation">Из этой точки нет доступного прямого перехода.</p>}
                <div className="command-authority">
                  <span><small>КОМАНДИР</small><b>{squad.commander?.name ?? "не назначен"}</b></span>
                  <span><small>ПОЛЕВЫЕ ПЕРЕГОВОРЫ</small><b>автоматически · автономность {squad.commander?.autonomy ?? 0}</b></span>
                </div>
                <p className="command-explanation">Вы задаёте маршрут, построение и действия в бою. Командир сам ведёт короткие полевые переговоры по характеру, лояльности и обстановке.</p>
                <div className="command-feed-head"><span>ПОСЛЕДСТВИЯ ПРИКАЗОВ</span><button type="button" onClick={() => setTab("log")}>ОТКРЫТЬ ВЕСЬ ЖУРНАЛ →</button></div>
                <div className="command-feed">
                  {selectedSquadEvents.length ? selectedSquadEvents.map((entry) => {
                    const eventTime = formatGameTime(entry.minute);
                    return <div className={entry.tone} key={entry.id}><time>{eventTime.clock}</time><p>{entry.text}</p></div>;
                  }) : <p className="empty-command-feed">У отряда пока нет записанных событий.</p>}
                </div>
              </section>
            )}
            <div className="panel-heading">
              <div>
                <span className="eyebrow">ВЫБРАННАЯ ТОЧКА</span>
                <h2>{node.name}</h2>
              </div>
              <span className="node-type">{NODE_LABEL[node.type]}</span>
            </div>
            <div className="owner-line">
              <span className="legend-dot" style={{ background: node.owner ? FACTIONS[node.owner].color : "#777d70" }} />
              <span>{node.owner ? FACTIONS[node.owner].name : "Нейтральная территория"}</span>
              <b>+{node.income} ₽</b>
            </div>
            <div className="sector-intel-grid">
              <span><small>РАЙОН</small><b>{intel.sector}</b></span>
              <span><small>КВАДРАТ</small><b>{intel.grid}</b></span>
              <span><small>МЕСТНОСТЬ</small><b>{intel.terrain}</b></span>
              <span><small>УГРОЗА</small><b data-threat={intel.threat}>{intel.threat}</b></span>
            </div>
            <p className="sector-note">{intel.note}</p>
            <article className="location-content-card">
              <div><span className="eyebrow">ОСОБЕННОСТИ МЕСТА</span><b>{locationContent.name}</b></div>
              <p>{locationContent.description}</p>
              <div className="location-effects">
                <span><small>ДОБЫЧА</small><b>УР. {locationContent.lootTier}</b></span>
                <span><small>РАДИАЦИЯ</small><b>{Math.round(locationContent.radiation * 100)}%</b></span>
                <span><small>ПСИ-ФОН</small><b>{Math.round(locationContent.psi * 100)}%</b></span>
                <span><small>МУТАНТЫ</small><b>{Math.round(locationContent.mutantPressure * 100)}%</b></span>
                <span><small>КОНТРОЛЬ</small><b>{node.owner ? `${Math.round(node.security)}%` : "НЕТ"}</b></span>
              </div>
              {node.owner && node.security < 65 && <strong>НЕСТАБИЛЬНАЯ ТЕРРИТОРИЯ · доход снижен · оставьте гарнизон для закрепления</strong>}
              <small>МОЖНО НАЙТИ: {locationContent.lootTags.join(" · ")}</small>
              {locationEvents.map((event) => <strong key={event.id}>{event.title} · осталось {Math.max(0, Math.ceil(event.expiresAt - game.simMinute))} мин.</strong>)}
            </article>
            {node.capture > 0 && (
              <div className="capture-progress">
                <span>Захват: {FACTIONS[node.captureFaction!].name}</span>
                <div className="bar"><i className="amber" style={{ width: pct(node.capture, 1) }} /></div>
              </div>
            )}
            <div className="sector-roster">
              <h3>Силы на локации</h3>
              {atNode.length === 0 ? <p className="empty-state">Сигналов отрядов не обнаружено.</p> : atNode.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`mini-squad ${item.id === game.selectedSquadId ? "active" : ""}`}
                  onClick={() => setGame((current) => current ? { ...current, selectedSquadId: item.id } : current)}
                >
                  <SquadGlyph squad={item} compact />
                  <span><b>{item.name}</b><small>{item.unitKind === "combat" ? `${item.fighters}/${item.maxFighters} бойцов · ${getSquadMarkerIntel(item).qualityLabel} · ${STATUS_LABEL[item.status]}` : getMissionLabel(game, item)}</small></span>
                  <em>{getSquadStrengthPercent(item)}%</em>
                </button>
              ))}
            </div>
            {atNode.length > 0 && (
              <button
                className="primary-action compact"
                type="button"
                onClick={() => setGame((current) => current ? {
                  ...current,
                  selectedSquadId: atNode.find((item) => item.faction === current.playerFaction && item.unitKind === "combat")?.id ?? current.selectedSquadId,
                  tacticalNodeId: node.id,
                  tacticalTargetId: null,
                } : current)}
              >
                ОТКРЫТЬ ТАКТИЧЕСКУЮ КАРТУ
              </button>
            )}
            {squad && <SquadIntelCard squad={squad} game={game} />}
            {squad && isPlayerControlledSquad(game, squad) && squad.unitKind === "combat" && squad.status !== "dead" && (
              <div className="selected-squad-detail squad-command-detail">
                <span className="eyebrow">СНАБЖЕНИЕ И ПРИКАЗЫ</span>
                <h3>Управление отрядом</h3>
                <StatBar label="ПАТРОНЫ" value={squad.ammo} max={squad.maxAmmo} tone={squad.ammo < 25 ? "red" : "amber"} />
                <div className="detail-grid">
                  <span>Магазин <b>{Math.round(squad.magazine)}/{squad.magazineSize}</b></span>
                  <span>Аптечки <b>{squad.medkits}</b></span>
                  <span>Гранаты <b>{squad.grenades}</b></span>
                  <span>Штат <b>{squad.fighters}/{squad.maxFighters}</b></span>
                </div>
                {squad.fighters < squad.maxFighters && (
                  <button
                    className="reinforce-button"
                    type="button"
                    disabled={!canReinforce}
                    onClick={() => setGame((current) => current ? reinforceSquad(current, squad.id) : current)}
                  >
                    <b>ПОПОЛНИТЬ ЛИЧНЫЙ СОСТАВ</b>
                    <small>{squadNode?.baseFor === game.playerFaction ? `${squad.maxFighters - squad.fighters} бойцов · ${reinforcementCost.toLocaleString("ru-RU")} ₽` : "доступно только на главной базе"}</small>
                  </button>
                )}
                <div className="gear-upgrades">
                  {(["weapon", "armor"] as const).map((kind) => {
                    const level = kind === "weapon" ? squad.weaponTier : squad.armorTier;
                    const trophyKind: TrophyKind = kind === "weapon" ? "weapons" : "armor";
                    const trophyCost = 1 + level;
                    const rubleCost = (kind === "weapon" ? 4200 : 5200) + level * 3600;
                    return (
                      <button
                        key={kind}
                        type="button"
                        disabled={level >= 3 || game.trophies[trophyKind] < trophyCost || game.rubles < rubleCost}
                        onClick={() => setGame((current) => current ? upgradeSquadGear(current, squad.id, kind) : current)}
                      >
                        <span>{kind === "weapon" ? "ОРУЖИЕ" : "БРОНЯ"} · УР. {level}</span>
                        <b>{level >= 3 ? "МАКСИМУМ" : `УЛУЧШИТЬ → ${level + 1}`}</b>
                        <small>{level >= 3 ? "" : `${trophyCost} троф. · ${rubleCost.toLocaleString("ru-RU")} ₽`}</small>
                      </button>
                    );
                  })}
                </div>
                <div className="formation-control">
                  <span>ПОСТРОЕНИЕ ОТРЯДА</span>
                  <div>
                    {(Object.keys(FORMATION_LABEL) as Formation[]).map((formation) => (
                      <button
                        key={formation}
                        className={(squad.formation ?? "mixed") === formation ? "active" : ""}
                        type="button"
                        onClick={() => setGame((current) => current ? setFormation(current, squad.id, formation) : current)}
                      >
                        {FORMATION_LABEL[formation]}
                      </button>
                    ))}
                  </div>
                </div>
                {!squad.homeGarrison && squad.status !== "moving" && squad.status !== "combat" && squadRouteIds.length > 0 && (
                  <div className="route-command">
                    <span>ДОСТУПНЫЕ ПЕРЕХОДЫ</span>
                    <div>
                      {squadRouteIds.map((destinationId) => {
                        const destination = game.nodes.find((item) => item.id === destinationId);
                        if (!destination) return null;
                        const localRoute = Boolean(squadNode?.localLinks?.includes(destinationId));
                        return (
                          <button
                            key={destinationId}
                            type="button"
                            aria-label={`ПЕРЕЙТИ: ${destination.name}`}
                            onClick={() => setGame((current) => current
                              ? localRoute
                                ? issueSectorMove(current, squad.id, destinationId)
                                : issueMove(current, squad.id, destinationId)
                              : current)}
                          >
                            <b>{destination.name}</b>
                            <small>{localRoute ? "локальный маршрут" : "глобальный переход"}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="order-hint">
                  {squad.homeGarrison
                    ? "Стационарный гарнизон удерживает эту точку, переживает Выброс на позиции и не входит в мобильный лимит."
                    : squad.status === "combat"
                      ? "Для выхода из боя используйте команду «ОТСТУПИТЬ» на тактической карте."
                      : squad.status === "moving"
                        ? `Переход: ${Math.round(squad.travel * 100)}%`
                        : "Маршрут можно выбрать здесь или прямо на карте."}
                </p>
              </div>
            )}
            {squad && squad.faction === game.playerFaction && squad.unitKind === "caravan" && (
              <div className="selected-squad-detail autonomous-detail">
                <span className="eyebrow">АВТОНОМНАЯ ГРУППА</span>
                <h3>{squad.name} · КАРАВАН</h3>
                <StatBar label="ОХРАНА" value={squad.strength} max={squad.maxStrength} tone={squad.strength < 30 ? "red" : "green"} />
                <div className="detail-grid">
                  <span>Задача <b>{getMissionLabel(game, squad)}</b></span>
                  <span>Груз <b>{squad.cargo.toLocaleString("ru-RU")} ₽</b></span>
                </div>
                <p className="order-hint">Караван действует самостоятельно. Его можно прикрыть обычным отрядом на маршруте.</p>
              </div>
            )}
          </>
        )}

        {tab === "alife" && (
          <>
            <div className="panel-heading"><div><span className="eyebrow">СИМУЛЯЦИЯ ЖИВОЙ ЗОНЫ</span><h2>Оперативная обстановка</h2></div><span className="alife-live">В СЕТИ</span></div>
            <p className="muted">Группировки самостоятельно выбирают цели, проводят рейды, охраняют дороги и реагируют на Выброс. Эти действия продолжаются без участия игрока.</p>
            <div className="alife-summary-grid">
              <div><span>Активные задачи</span><b>{alife.activeMissions}</b></div>
              <div><span>Караваны в Зоне</span><b>{alife.caravans}</b></div>
              <div><span>Скопления мутантов</span><b>{alife.mutants}</b></div>
              <div><span>Рейды сейчас</span><b>{alife.raids}</b></div>
              <div><span>Доставлено грузов</span><b>{game.alifeStats.tradesCompleted}</b></div>
              <div><span>Спасено от Выбросов</span><b>{game.alifeStats.emissionsSurvived}</b></div>
            </div>

            <div className="alife-section-head"><span className="eyebrow">БАЛАНС СИМУЛЯЦИИ</span><h3>Стратегическое состояние Зоны</h3></div>
            <div className="strategic-balance-grid">
              {PLAYABLE_FACTIONS.map((id) => {
                const balance = getFactionBalanceSummary(game, id);
                const economyState = id === game.playerFaction ? economy : null;
                return (
                  <article className={`strategic-balance-card readiness-${balance.readiness < 35 ? "critical" : balance.readiness < 60 ? "strained" : "ready"}`} key={id}>
                    <header><i style={{ background: FACTIONS[id].color }} /><span><b>{FACTIONS[id].name}</b><small>{MOBILIZATION_LABELS[balance.mobilization]} · готовность {balance.readiness}%</small></span><strong>{balance.combatSquads}/{balance.armyLimit}</strong></header>
                    <div><span>Людской резерв <b>{balance.manpower}/{balance.manpowerCap}</b></span><span>Снабжение <b>{balance.supply}%</b></span><span>Усталость <b>{balance.warWeariness}%</b></span><span>Контроль <b>{balance.averageSecurity}%</b></span></div>
                    <p>{balance.activeWars ? `Войн: ${balance.activeWars}` : "Мирный период"}{balance.overextension ? ` · перегрузка территории +${balance.overextension}` : " · тыл управляем"}{economyState ? ` · баланс ${economyState.net >= 0 ? "+" : ""}${economyState.net.toLocaleString("ru-RU")} ₽` : ""}</p>
                  </article>
                );
              })}
            </div>

            <div className="social-summary-grid">
              <div><span>Полевые контакты</span><b>{game.alifeStats.fieldNegotiations}</b></div>
              <div><span>Заключено сделок</span><b>{game.alifeStats.fieldDeals}</b></div>
              <div><span>Переходов на другую сторону</span><b>{game.alifeStats.defections}</b></div>
              <div><span>Нарушений соглашений</span><b>{game.alifeStats.betrayals}</b></div>
            </div>

            <div className="alife-section-head"><span className="eyebrow">ДИНАМИЧЕСКАЯ ЗОНА</span><h3>Активные события</h3></div>
            <div className="world-event-list">
              {activeWorldEvents.length ? activeWorldEvents.map((event) => {
                const eventNode = game.nodes.find((item) => item.id === event.nodeId);
                return (
                  <button type="button" className={`world-event-card severity-${event.severity}`} key={event.id} onClick={() => setGame((current) => current ? { ...current, selectedNodeId: event.nodeId } : current)}>
                    <span><b>{event.title}</b><small>{eventNode?.name ?? "нет координат"} · опасность {event.severity}/3</small></span>
                    <p>{event.description}</p>
                    <em>{Math.max(0, Math.ceil(event.expiresAt - game.simMinute))} мин.</em>
                  </button>
                );
              }) : <p className="empty-state">Активных событий нет. Зона временно затихла.</p>}
            </div>
            <div className="alife-counters"><span>Событий возникло <b>{game.alifeStats.worldEvents}</b></span><span>Разрешено игроком/миром <b>{game.alifeStats.eventsResolved}</b></span><span>Биообразцов добыто <b>{game.alifeStats.specimensRecovered}</b></span></div>

            <div className="alife-section-head"><span className="eyebrow">СТРАТЕГИЧЕСКИЙ УРОВЕНЬ</span><h3>Операции группировок</h3></div>
            <div className="operation-list">
              {activeOperations.slice(0, 10).map((operation) => {
                const target = operation.targetNodeId ? game.nodes.find((item) => item.id === operation.targetNodeId) : null;
                const assigned = operation.assignedSquadIds.map((id) => game.squads.find((squad) => squad.id === id)).filter((item): item is Squad => Boolean(item));
                const manpower = assigned.reduce((sum, item) => sum + item.fighters, 0);
                return (
                  <article className={`operation-card ${operation.type} ${operation.status}`} key={operation.id}>
                    <i style={{ background: FACTIONS[operation.issuerFaction].color }} />
                    <div><span>{OPERATION_LABELS[operation.type]} · {FACTIONS[operation.issuerFaction].name}</span><b>{target?.name ?? "без территориальной цели"}</b><small>{operation.cause}</small></div>
                    <em>{operation.status === "planned" ? "ПОДГОТОВКА" : "В ХОДЕ"}<small>{assigned.length} групп · {manpower} бойцов</small></em>
                  </article>
                );
              })}
            </div>

            <details className="field-network" open={recentFieldDeals.some((deal) => deal.status === "active") || undefined}>
              <summary><span>ПОЛЕВЫЕ ПЕРЕГОВОРЫ ОТРЯДОВ</span><b>{recentFieldDeals.length}</b></summary>
              <p>Решения принимают конкретные командиры. Их характер, верность, мораль, силы сторон и прежние встречи определяют, будет ли договор соблюдён.</p>
              <div className="field-deal-list">
                {recentFieldDeals.length ? recentFieldDeals.map((deal) => {
                  const left = game.squads.find((squad) => squad.id === deal.leftSquadId);
                  const right = game.squads.find((squad) => squad.id === deal.rightSquadId);
                  const place = game.nodes.find((item) => item.id === deal.nodeId);
                  return (
                    <article className={`field-deal ${deal.status}`} key={deal.id}>
                      <div><span><i style={{ background: left ? FACTIONS[left.faction].color : "#777" }} />{left?.commander?.callsign ?? left?.name ?? "нет связи"}</span><em>↔</em><span><i style={{ background: right ? FACTIONS[right.faction].color : "#777" }} />{right?.commander?.callsign ?? right?.name ?? "нет связи"}</span></div>
                      <b>{FIELD_DEAL_LABELS[deal.type]} · {deal.status === "active" ? "действует" : deal.status === "broken" ? "нарушено" : "завершено"}</b>
                      <small>{place?.name ?? "неизвестная точка"}{deal.value ? ` · ${deal.value.toLocaleString("ru-RU")} ₽` : ""} · риск предательства {deal.betrayalRisk}%</small>
                    </article>
                  );
                }) : <p className="empty-state">Отрядные контакты ещё не зафиксированы.</p>}
              </div>
            </details>

            <div className="alife-section-head"><span className="eyebrow">КОМАНДОВАНИЕ ГРУППИРОВОК</span><h3>Текущие директивы</h3></div>
            <div className="directive-list">
              {PLAYABLE_FACTIONS.map((id) => {
                const directive = game.directives[id];
                const target = directive?.targetNodeId ? game.nodes.find((item) => item.id === directive.targetNodeId) : null;
                const forceSquads = game.squads.filter((item) => item.faction === id && item.unitKind === "combat" && item.status !== "dead");
                const force = forceSquads.length;
                const manpower = forceSquads.reduce((sum, item) => sum + item.fighters, 0);
                const condition = getFactionCondition(game, id);
                const balance = getFactionBalanceSummary(game, id);
                return (
                  <article className={`directive-card ${directive?.type ?? "recovery"} ${condition}`} key={id}>
                    <i style={{ background: FACTIONS[id].color }} />
                    <div><b>{FACTIONS[id].name} · {FACTION_PROFILES[id].doctrine}</b><small>{directive?.reason ?? "Сбор разведданных"}</small></div>
                    <div className="directive-order"><strong>{condition === "destroyed" ? FACTION_CONDITION_LABEL[condition] : DIRECTIVE_LABELS[directive?.type ?? "recovery"]}</strong><small>{target?.name ?? "без выбранной цели"} · групп: {force}/{balance.armyLimit} · бойцов: {manpower} · снабжение {balance.supply}% · усталость {balance.warWeariness}%</small></div>
                  </article>
                );
              })}
            </div>

            <div className="alife-section-head"><span className="eyebrow">РАДИОПЕРЕХВАТ</span><h3>Группы в движении</h3></div>
            <div className="alife-mission-list">
              {autonomous.length ? autonomous.slice(0, 10).map((item) => {
                const location = game.nodes.find((node) => node.id === item.nodeId);
                const kind = item.unitKind === "caravan" ? "КАРАВАН" : item.mutantType ? MUTANT_LABELS[item.mutantType].toUpperCase() : "БОЕВАЯ ГРУППА";
                return (
                  <button type="button" className={`alife-mission ${item.unitKind}`} key={item.id} onClick={() => setGame((current) => current ? { ...current, selectedSquadId: item.id, selectedNodeId: item.destinationId ?? item.nodeId } : current)}>
                    <span className="legend-dot" style={{ background: FACTIONS[item.faction].color }} />
                    <span><b>{item.name}</b><small>{kind} · {location?.name}</small></span>
                    <em>{getMissionLabel(game, item)}</em>
                  </button>
                );
              }) : <p className="empty-state">Активных автономных задач пока нет.</p>}
            </div>
            <div className="alife-counters">
              <span>Рейдов начато <b>{game.alifeStats.raidsStarted}</b></span>
              <span>Патрулей отправлено <b>{game.alifeStats.patrolsStarted}</b></span>
              <span>Атак мутантов <b>{game.alifeStats.mutantAttacks}</b></span>
              <span>Приказов искать укрытие <b>{game.alifeStats.shelterOrders}</b></span>
            </div>
          </>
        )}

        {tab === "base" && (
          <>
            <div className="panel-heading"><div><span className="eyebrow">{game.campaignMode === "squad" ? "ЛИЧНОЕ СНАРЯЖЕНИЕ" : "КОМПЛЕКТОВАНИЕ"}</span><h2>{game.campaignMode === "squad" ? "Рюкзак отряда" : "Главная база"}</h2></div></div>
            <p className="muted">Мобильных отрядов: {mobileSquads.length}/{maxSquads} · людской резерв: {playerBalance.manpower}/{playerBalance.manpowerCap} · стационарных гарнизонов: {garrisonSquads.length}. Лимит армии зависит от территории, мобилизации и логистики.</p>
            <article className="doctrine-card" style={{ "--faction": FACTIONS[game.playerFaction].color } as React.CSSProperties}>
              <span>ДОКТРИНА ГРУППИРОВКИ</span>
              <h3>{playerProfile.doctrine}</h3>
              <p>{playerProfile.summary}</p>
              <ul>{playerProfile.effects.map((effect) => <li key={effect}>{effect}</li>)}</ul>
            </article>
            <section className="strategic-reserve-control">
              <div><span className="eyebrow">РЕЗЕРВ ШТАБА</span><h3>Снабжение и мобилизация</h3><p>Деньги можно превратить в боеготовность, но людей нельзя печатать бесконечно. Срочный набор повышает усталость группировки.</p></div>
              <button type="button" disabled={game.rubles < getStrategicInvestmentCost(game, "supply") || playerBalance.supply >= 99} onClick={() => setGame((current) => current ? buyStrategicReserve(current, "supply") : current)}><b>ЗАКУПИТЬ ЗАПАСЫ</b><small>+18% снабжения · {getStrategicInvestmentCost(game, "supply").toLocaleString("ru-RU")} ₽</small></button>
              <button type="button" disabled={game.rubles < getStrategicInvestmentCost(game, "manpower") || playerBalance.manpower >= playerBalance.manpowerCap} onClick={() => setGame((current) => current ? buyStrategicReserve(current, "manpower") : current)}><b>СРОЧНЫЙ НАБОР</b><small>до +8 бойцов · +3% усталости · {getStrategicInvestmentCost(game, "manpower").toLocaleString("ru-RU")} ₽</small></button>
            </section>
            <section className="content-warehouse">
              <div className="warehouse-head"><span><small>{game.campaignMode === "squad" ? "РЮКЗАК И СНАРЯЖЕНИЕ" : "АРСЕНАЛ И ХРАНИЛИЩЕ"}</small><b>{stashSquad ? `Снабжение: ${stashSquad.name}` : "Нет выбранного отряда"}</b></span><em className={canUseStash ? "ready" : "blocked"}>{canUseStash ? game.campaignMode === "squad" ? "РЮКЗАК ОТКРЫТ" : "ДОСТУП К СКЛАДУ" : game.campaignMode === "squad" ? "ОТРЯД ЗАНЯТ" : "НУЖНА СВОЯ БАЗА"}</em></div>
              {stashSquad && (
                <div className="current-loadout">
                  <span><small>ОРУЖИЕ</small><b>{stashSquad.weaponId ? ZONE_ITEMS[stashSquad.weaponId].name : "нет"}</b></span>
                  <span><small>БРОНЯ</small><b>{stashSquad.armorId ? ZONE_ITEMS[stashSquad.armorId].name : "нет"}</b></span>
                  <span><small>АРТЕФАКТЫ</small><b>{stashSquad.artifactIds.length}/2</b></span>
                  {stashSquad.artifactIds.map((id) => <button type="button" disabled={!canUseStash} key={id} onClick={() => setGame((current) => current ? unequipSquadArtifact(current, stashSquad.id, id) : current)}>СНЯТЬ {ZONE_ITEMS[id].name}</button>)}
                </div>
              )}
              <p>{game.campaignMode === "squad" ? "Это личный рюкзак отряда. Предмет можно использовать в спокойной точке; экипировка сразу меняет бой, маршрут, радиацию и пси-защиту." : "Склад физически доступен только отряду на своей главной базе. Выданный предмет меняет расчёты боя, маршрута, радиации и пси-воздействия сразу."}</p>
              {(["weapon", "armor", "artifact", "consumable", "mutant_part"] as ItemCategory[]).map((category) => {
                const items = stashItems.filter((id) => ZONE_ITEMS[id].category === category);
                if (!items.length) return null;
                return (
                  <div className="warehouse-category" key={category}>
                    <h3>{ITEM_CATEGORY_LABELS[category]}</h3>
                    {items.map((id) => {
                      const item = ZONE_ITEMS[id];
                      const amount = game.stash[id] ?? 0;
                      const canIssue = Boolean(canUseStash && stashSquad && category !== "mutant_part" && (category !== "artifact" || stashSquad.artifactIds.length < 2));
                      return (
                        <article className={`warehouse-item rarity-${item.rarity}`} key={id}>
                          <div><span>{ITEM_RARITY_LABELS[item.rarity]} · УР. {item.tier}</span><b>{item.name} <em>×{amount}</em></b><p>{item.description}</p><small>{itemEffectsText(id)}{item.ammo ? ` · ${item.ammo}` : ""}</small></div>
                          <div className="warehouse-actions">
                            {category !== "mutant_part" && <button type="button" disabled={!canIssue} onClick={() => setGame((current) => current && stashSquad ? category === "consumable" ? supplySquadFromStash(current, stashSquad.id, id) : equipSquadItem(current, stashSquad.id, id) : current)}>{category === "consumable" ? "ВЫДАТЬ" : "ОСНАСТИТЬ"}</button>}
                            <button type="button" onClick={() => setGame((current) => current ? sellContentItem(current, id) : current)}>ПРОДАТЬ ВСЁ<small>{(getContentItemSaleValue(game, id) * amount).toLocaleString("ru-RU")} ₽</small></button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </section>
            {HIRE_RANKS.map((rank) => {
              const recruit = getFactionRosterEntry(game.playerFaction, rank);
              const cost = getHireCost(game, rank);
              const locked = rank === "Мастера" && game.research.weapons < 2;
              return (
                <div className="purchase-card faction-recruit" key={rank}>
                  <div>
                    <span>{rank.toUpperCase()} · {FORMATION_LABEL[recruit.formation]}</span>
                    <b>{recruit.name}</b>
                    <small>{recruit.description}</small>
                    <em>{recruit.fighters} бойц. · атака {recruit.attack} · боезапас {recruit.ammo} · броня ур. {recruit.armorTier}</em>
                  </div>
                  <button disabled={game.rubles < cost || mobileSquads.length >= maxSquads || playerBalance.manpower < recruit.fighters || locked} onClick={() => setGame((current) => current ? hireSquad(current, rank) : current)} type="button">{locked ? "НИОКР 2" : playerBalance.manpower < recruit.fighters ? "НЕТ ЛЮДЕЙ" : `${cost.toLocaleString("ru-RU")} ₽`}</button>
                </div>
              );
            })}
            <div className="base-status-grid">
              <div><span>Контролируется</span><b>{game.nodes.filter((item) => item.owner === game.playerFaction).length}</b><small>точек</small></div>
              <div><span>Валовый доход</span><b>{economy.gross.toLocaleString("ru-RU")}</b><small>{economy.doctrineBonus >= 0 ? "+" : ""}{economy.doctrineBonus.toLocaleString("ru-RU")} доктрина · +{(economy.allianceTrade + economy.treatyTrade).toLocaleString("ru-RU")} договоры</small></div>
              <div><span>Содержание армии</span><b>−{economy.upkeep.toLocaleString("ru-RU")}</b><small>{playerSquads.reduce((sum, item) => sum + getSquadUpkeep(item), 0).toLocaleString("ru-RU")} ₽ по отрядам</small></div>
              <div><span>Чистый баланс</span><b className={economy.net < 0 ? "negative" : ""}>{economy.net >= 0 ? "+" : ""}{economy.net.toLocaleString("ru-RU")}</b><small>₽ / 30 мин.</small></div>
              <div><span>Мобилизация</span><b>{MOBILIZATION_LABELS[playerBalance.mobilization]}</b><small>готовность {playerBalance.readiness}% · войн {playerBalance.activeWars}</small></div>
              <div><span>Снабжение</span><b className={playerBalance.supply < 30 ? "negative" : ""}>{playerBalance.supply}%</b><small>ниже 25% падают мораль и боезапас</small></div>
              <div><span>Военная усталость</span><b className={playerBalance.warWeariness > 70 ? "negative" : ""}>{playerBalance.warWeariness}%</b><small>потери и долгие войны снижают наступательный темп</small></div>
              <div><span>Управление тылом</span><b>{playerBalance.averageSecurity}%</b><small>ёмкость {playerBalance.administrativeCapacity} · перегрузка {playerBalance.overextension}</small></div>
            </div>
          </>
        )}

        {tab === "contracts" && (
          <>
            <div className="panel-heading"><div><span className="eyebrow">{game.campaignMode === "squad" ? "СИГНАЛЫ И ЛИЧНЫЕ ДОГОВОРЁННОСТИ" : "ТОРГОВЦЫ И ЗАКАЗЧИКИ"}</span><h2>{game.campaignMode === "squad" ? "Задачи КПК" : "Доска контрактов"}</h2></div></div>
            <p className="muted">{game.campaignMode === "squad" ? "КПК показывает источник сигнала, но заказ нельзя взять из воздуха: найдите заказчика и поговорите лично." : `Одновременно можно вести ${1 + game.research.logistics} контракт(а). Срок каждого — 6 игровых часов.`}</p>
            {game.campaignMode === "squad" && game.squadKnowledge.reports.length > 0 && (
              <div className="pda-report-list">
                {game.squadKnowledge.reports.slice(-5).reverse().map((report) => <article key={report.id} className={report.kind}><span>{report.kind === "danger" ? "!" : report.kind === "job" ? "$" : "?"}</span><div><b>{report.title}</b><p>{report.text}</p><small>ДОСТОВЕРНОСТЬ {report.reliability}% · {Math.max(0, game.simMinute - report.createdAt)} МИН. НАЗАД</small></div></article>)}
              </div>
            )}
            <div className="contract-list">
              {game.contracts.filter((contract) => (contract.status === "active" || contract.status === "offered") && contract.declinedAt === null).map((contract) => {
                const giver = contract.giverSquadId ? game.squads.find((squad) => squad.id === contract.giverSquadId) ?? null : null;
                const giverNode = giver ? game.nodes.find((node) => node.id === giver.nodeId) ?? null : null;
                const briefed = game.campaignMode !== "squad" || contract.briefedAt !== null;
                return <article className={`contract-card ${contract.status} ${briefed ? "briefed" : "signal-only"}`} key={contract.id}>
                  <div className="contract-head"><span>{CONTRACT_TYPE_LABEL[contract.type]}</span><em className={contract.risk}>{CONTRACT_RISK_LABEL[contract.risk]}</em><time>{contractTimeLeft(game, contract.expiresAt)}</time></div>
                  <div className="contract-issuer"><i style={{ background: FACTIONS[contract.issuerFaction].color }} /><span>{giver?.commander ? `${giver.commander.callsign} · ${giver.name}` : `ЗАКАЗЧИК: ${FACTIONS[contract.issuerFaction].name}`}{giverNode ? ` · ${giverNode.name}` : ""}</span>{contract.sourceOperationId && <b>РЕАЛЬНАЯ ОПЕРАЦИЯ МИРА</b>}</div>
                  <h3>{briefed ? contract.title : "Есть работа — условия при встрече"}</h3><p>{briefed ? contract.description : `Источник сигнала: ${giver?.commander?.callsign ?? giver?.name ?? FACTIONS[contract.issuerFaction].name}. Доберитесь до указанной точки и спросите о работе.`}</p>
                  {briefed && (contract.requiredItemId || contract.rewardItemId) && <div className="contract-items">{contract.requiredItemId && <span>НУЖНО: <b>{ZONE_ITEMS[contract.requiredItemId].name}</b></span>}{contract.rewardItemId && <span>ПРЕДМЕТНАЯ НАГРАДА: <b>{ZONE_ITEMS[contract.rewardItemId].name}</b></span>}</div>}
                  <div className="contract-progress"><span style={{ width: `${Math.min(100, contract.progress / contract.goal * 100)}%` }} /></div>
                  <div className="contract-foot"><small>{contract.progress}/{contract.goal}</small><b>{briefed ? `+${contract.reward.toLocaleString("ru-RU")} ₽ · +${contract.reputationReward} реп.` : "ОПЛАТА НЕ ОБСУЖДЕНА"}</b>{contract.status === "offered" ? game.campaignMode === "squad" ? <em>{briefed ? "РЕШИТЬ В РАЗГОВОРЕ" : "НУЖЕН ЛИЧНЫЙ КОНТАКТ"}</em> : <button type="button" disabled={game.contracts.filter((item) => item.status === "active").length >= 1 + game.research.logistics} onClick={() => setGame((current) => current ? acceptContract(current, contract.id) : current)}>ПРИНЯТЬ</button> : <em>В РАБОТЕ</em>}</div>
                </article>
              })}
            </div>
            {game.contracts.some((contract) => contract.status === "completed" || contract.status === "failed") && <div className="contract-history">{game.contracts.filter((contract) => contract.status === "completed" || contract.status === "failed").slice(-3).map((contract) => <span className={contract.status} key={contract.id}><b>{contract.status === "completed" ? "ВЫПОЛНЕНО" : "ПРОВАЛЕНО"}</b><small>{contract.title}</small></span>)}</div>}
            <div className="trade-heading"><span className="eyebrow">СКЛАД ТРОФЕЕВ</span><h3>Скупщик</h3></div>
            <div className="trophy-market">
              {(Object.keys(TROPHY_LABEL) as TrophyKind[]).map((kind) => {
                const amount = game.trophies[kind];
                const total = amount * getTrophySaleValue(game, kind);
                return <div key={kind}><span><b>{TROPHY_LABEL[kind]}</b><small>На складе: {amount} · {getTrophySaleValue(game, kind).toLocaleString("ru-RU")} ₽/шт.</small></span><button type="button" disabled={!amount} onClick={() => setGame((current) => current ? sellTrophies(current, kind) : current)}>{amount ? `ПРОДАТЬ · ${total.toLocaleString("ru-RU")} ₽` : "ПУСТО"}</button></div>;
              })}
            </div>
          </>
        )}

        {tab === "research" && (
          <>
            <div className="panel-heading"><div><span className="eyebrow">ТЕХНОЛОГИИ</span><h2>Исследования</h2></div></div>
            {([
              ["weapons", "Вооружение", "+12% урона отрядов за уровень"],
              ["armor", "Бронезащита", "−10% входящего урона за уровень"],
              ["logistics", "Логистика", "+2 доступных отряда за уровень"],
              ["medicine", "Полевая медицина", "+10 здоровья от каждой аптечки"],
              ["recon", "Разведка", "+10% скорости захвата и больше артефактов"],
              ["trade", "Торговые связи", "Скидки и +15% к цене трофеев"],
            ] as [keyof ResearchState, string, string][]).map(([id, title, text]) => {
              const level = game.research[id];
              const cost = getResearchCost(game, id);
              return (
                <div className="research-card" key={id}>
                  <div className="research-level"><span>{level}</span><small>/ 3</small></div>
                  <div><b>{title}</b><small>{text}</small></div>
                  <button disabled={level >= 3 || game.rubles < cost} onClick={() => setGame((current) => current ? buyResearch(current, id) : current)} type="button">{level >= 3 ? "МАКС." : `${cost.toLocaleString("ru-RU")} ₽`}</button>
                </div>
              );
            })}
          </>
        )}

        {tab === "diplomacy" && (
          <>
            {game.campaignMode === "squad" && (
              <section className="squad-contact-hub">
                <div className="panel-heading"><div><span className="eyebrow">ПОЛЕВЫЕ КОНТАКТЫ</span><h2>Люди помнят поступки</h2></div><span className="node-type">РЕП. {game.reputation > 0 ? "+" : ""}{game.reputation}</span></div>
                <p>Вы не говорите от имени штаба. Командир договаривается о проходе, коротком перемирии, припасах и информации при встрече; результат зависит от характера, верности и вашей репутации.</p>
                <div className="contact-status-grid">
                  <span><small>СТАТУС</small><b>{game.squadAllegiance ? FACTIONS[game.squadAllegiance].name : "Нейтральные"}</b></span>
                  <span><small>КОМАНДИР</small><b>{squad?.commander?.callsign ?? "неизвестен"}</b></span>
                  <span><small>ЛОЯЛЬНОСТЬ</small><b>{squad?.commander?.loyalty ?? 0}/100</b></span>
                  <span><small>АВТОНОМНОСТЬ</small><b>{squad?.commander?.autonomy ?? 0}/100</b></span>
                </div>
                <h3>Последние договорённости</h3>
                <div className="contact-deal-list">
                  {recentFieldDeals.length ? recentFieldDeals.map((deal) => <article key={deal.id}><b>{FIELD_DEAL_LABELS[deal.type]}</b><small>{deal.status === "active" ? "ДЕЙСТВУЕТ" : deal.status === "honored" ? "ВЫПОЛНЕНО" : deal.status === "broken" ? "НАРУШЕНО" : "ЗАВЕРШЕНО"}</small><p>{deal.terms}</p></article>) : <p className="empty-state">Пока никто не знает ваш отряд. Первые контакты появятся при встречах на карте.</p>}
                </div>
                <details><summary>Что может решить командир сам</summary><p>Пропустить встречный отряд, обменять припасы, передать разведданные, договориться о локальном отходе или нарушить слово. Все последствия попадают в ПДА и меняют дальнейшее отношение.</p></details>
              </section>
            )}
            <div className="panel-heading faction-diplomacy"><div><span className="eyebrow">ЗАЩИЩЁННЫЙ КАНАЛ // СТРАТЕГИЧЕСКАЯ ПАМЯТЬ</span><h2>Дипломатия</h2></div></div>
            <div className="diplomacy-overview">
              <div><span>РЕПУТАЦИЯ В ЗОНЕ</span><b className={game.reputation < -20 ? "negative" : ""}>{game.reputation > 0 ? "+" : ""}{game.reputation}</b><small>{game.reputation >= 40 ? "надёжный партнёр" : game.reputation >= 10 ? "известная группировка" : game.reputation > -10 ? "репутация не сложилась" : game.reputation >= -40 ? "ненадёжный партнёр" : "нарушитель договоров"}</small></div>
              <div><span>СОЮЗЫ</span><b>{PLAYABLE_FACTIONS.filter((id) => id !== game.playerFaction && getFactionCondition(game, id) !== "destroyed" && getRelation(game, game.playerFaction, id) === "alliance").length}</b><small>торговля и поддержка</small></div>
              <div><span>ВОЙНЫ</span><b>{PLAYABLE_FACTIONS.filter((id) => id !== game.playerFaction && getRelation(game, game.playerFaction, id) === "war" && getFactionCondition(game, id) !== "destroyed").length}</b><small>активных противников</small></div>
              <div><span>ТОРГОВЫЕ КОРИДОРЫ</span><b>{PLAYABLE_FACTIONS.filter((id) => id !== game.playerFaction && getBilateralDiplomacy(game, game.playerFaction, id).tradePact).length}</b><small>договорной доход</small></div>
            </div>
            <p className="muted">Фракции запоминают убитые отряды, потерянные территории, помощь и нарушение договоров. Страх склоняет слабого врага к миру, доверие открывает союз, обиды формируют цели ответных рейдов.</p>

            {game.diplomaticOffers.some((offer) => offer.status === "pending") && (
              <div className="diplomatic-inbox">
                <div className="diplomatic-section-head"><span>ВХОДЯЩИЕ ПЕРЕГОВОРЫ</span><b>{game.diplomaticOffers.filter((offer) => offer.status === "pending").length}</b></div>
                {game.diplomaticOffers.filter((offer) => offer.status === "pending").map((offer) => {
                  const demanded = offer.demandedNodeId ? game.nodes.find((node) => node.id === offer.demandedNodeId) : null;
                  const details = offer.type === "territory"
                    ? `Требование: передать «${demanded?.name ?? "территорию"}»`
                    : offer.type === "tribute"
                      ? `Требование: ${offer.cost.toLocaleString("ru-RU")} ₽`
                      : offer.cost
                        ? `Условие: ${offer.cost.toLocaleString("ru-RU")} ₽`
                        : "Без предварительных условий";
                  return (
                    <article className={`diplomatic-offer ${offer.type}`} key={offer.id}>
                      <div className="offer-head"><span className="legend-dot" style={{ background: FACTIONS[offer.faction].color }} /><span><b>{FACTIONS[offer.faction].name}</b><small>{DIPLOMATIC_OFFER_LABEL[offer.type]}</small></span><time>{Math.max(0, Math.ceil(offer.expiresAt - game.simMinute))} мин.</time></div>
                      <p>{details}</p>
                      <div className="offer-actions"><button type="button" onClick={() => setGame((current) => current ? respondDiplomaticOffer(current, offer.id, false) : current)}>ОТКЛОНИТЬ</button><button className="accept" type="button" disabled={offer.cost > game.rubles} onClick={() => setGame((current) => current ? respondDiplomaticOffer(current, offer.id, true) : current)}>ПРИНЯТЬ</button></div>
                    </article>
                  );
                })}
              </div>
            )}

            <details className="faction-network" open>
              <summary><span>ДИПЛОМАТИЧЕСКАЯ СЕТЬ ЗОНЫ</span><b>{diplomacyNetwork.length} пар</b></summary>
              <p>Это отношения группировок между собой. Торговля даёт доход, общий враг сближает, пограничные инциденты поднимают напряжение и могут сорвать договоры.</p>
              <div className="faction-network-list">
                {diplomacyNetwork.map((pair) => {
                  const pactTime = pair.memory.nonAggressionUntil ? Math.max(0, pair.memory.nonAggressionUntil - game.simMinute) : 0;
                  return (
                    <article className={`network-pair ${pair.relation}`} key={`${pair.left}-${pair.right}`}>
                      <div className="network-pair-head">
                        <span><i style={{ background: FACTIONS[pair.left].color }} />{FACTIONS[pair.left].name}</span>
                        <em>↔</em>
                        <span><i style={{ background: FACTIONS[pair.right].color }} />{FACTIONS[pair.right].name}</span>
                        <b>{RELATION_LABEL[pair.relation]}</b>
                      </div>
                      <div className="treaty-chips">
                        {pair.memory.tradePact && <span>ТОРГОВЛЯ</span>}
                        {pair.memory.defensePact && <span>ОБОРОННЫЙ ДОГОВОР</span>}
                        {pactTime > 0 && <span>НЕНАПАДЕНИЕ · {Math.ceil(pactTime / 60)}ч</span>}
                        {!pair.memory.tradePact && !pair.memory.defensePact && pactTime <= 0 && <span className="inactive">БЕЗ ДОГОВОРОВ</span>}
                      </div>
                      <div className="network-values"><span>Доверие <b>{pair.memory.trust}</b></span><span>Напряжение <b>{pair.memory.tension}</b></span><span>Сотрудничество <b>{pair.memory.cooperation}</b></span><span>Инциденты <b>{pair.memory.incidents}</b></span></div>
                    </article>
                  );
                })}
              </div>
            </details>

            <div className="diplomacy-list">
              {PLAYABLE_FACTIONS.filter((id) => id !== game.playerFaction).map((id) => {
                const relation = getRelation(game, game.playerFaction, id);
                const memory = game.diplomacyMemory[id];
                const condition = getFactionCondition(game, id);
                const terms = getDiplomacyTerms(game, id);
                const bilateral = getBilateralDiplomacy(game, game.playerFaction, id);
                const blocked = id === "monolith" || condition === "destroyed";
                const mainAction = relation === "war" ? "truce" : relation === "alliance" ? "support" : "alliance";
                const mainAllowed = mainAction === "truce" ? terms.canTruce : mainAction === "alliance" ? terms.canAlliance : terms.canRequestSupport;
                const mainCost = mainAction === "truce" ? terms.truceCost : mainAction === "alliance" ? terms.allianceCost : terms.supportCost;
                const mainLabel = mainAction === "truce" ? "ПРЕДЛОЖИТЬ ПЕРЕМИРИЕ" : mainAction === "alliance" ? "ПРЕДЛОЖИТЬ СОЮЗ" : "ЗАПРОСИТЬ ПОДДЕРЖКУ";
                return (
                  <article
                    key={id}
                    className={`diplomacy-card ${relation} ${condition}`}
                  >
                    <div className="diplomacy-card-head"><span className="legend-dot" style={{ background: FACTIONS[id].color }} /><span><b>{FACTIONS[id].name}</b><small>{FACTION_CONDITION_LABEL[condition]}</small></span><em>{RELATION_LABEL[relation]}</em></div>
                    <div className="treaty-chips player-treaties">
                      {bilateral.tradePact && <span>ТОРГОВЫЙ КОРИДОР</span>}
                      {bilateral.defensePact && <span>ВЗАИМНАЯ ОБОРОНА</span>}
                      {bilateral.nonAggressionUntil && bilateral.nonAggressionUntil > game.simMinute && <span>НЕНАПАДЕНИЕ · {Math.ceil((bilateral.nonAggressionUntil - game.simMinute) / 60)}ч</span>}
                      {!bilateral.tradePact && !bilateral.defensePact && (!bilateral.nonAggressionUntil || bilateral.nonAggressionUntil <= game.simMinute) && <span className="inactive">ОТДЕЛЬНЫХ ДОГОВОРОВ НЕТ</span>}
                    </div>
                    <div className="diplomacy-meters">
                      <div><span>ДОВЕРИЕ <b>{memory.trust > 0 ? "+" : ""}{memory.trust}</b></span><i><em style={{ width: `${(memory.trust + 100) / 2}%` }} /></i></div>
                      <div><span>СТРАХ <b>{memory.fear}</b></span><i><em style={{ width: `${memory.fear}%` }} /></i></div>
                      <div><span>ОБИДА <b>{memory.grievance}</b></span><i><em style={{ width: `${memory.grievance}%` }} /></i></div>
                    </div>
                    <div className="diplomacy-memory"><span>Потери от вас: <b>{memory.playerKills}</b></span><span>Территорий отнято: <b>{memory.territoriesLost}</b></span><span>Помощь: <b>{memory.aidReceived}</b></span><span>Готовность: <b>{terms.acceptance > 0 ? "+" : ""}{terms.acceptance}</b></span></div>
                    <p>{terms.reason}</p>
                    {!blocked && (
                      <div className="diplomacy-actions">
                        <button type="button" disabled={!mainAllowed || game.rubles < mainCost} title={terms.reason} onClick={() => setGame((current) => current ? diplomaticAction(current, id, mainAction) : current)}><b>{mainLabel}</b><small>{mainCost.toLocaleString("ru-RU")} ₽</small></button>
                        <button type="button" disabled={terms.cooldown > 0 || game.rubles < terms.giftCost} onClick={() => setGame((current) => current ? diplomaticAction(current, id, "gift") : current)}><b>ПЕРЕДАТЬ ДАР</b><small>{terms.giftCost.toLocaleString("ru-RU")} ₽</small></button>
                        <button type="button" disabled={!terms.canTradePact || game.rubles < terms.tradePactCost} onClick={() => setGame((current) => current ? diplomaticAction(current, id, "trade_pact") : current)}><b>{bilateral.tradePact ? "ТОРГОВЫЙ ДОГОВОР АКТИВЕН" : "ОТКРЫТЬ ТОРГОВЫЙ КОРИДОР"}</b><small>{bilateral.tradePact ? `${bilateral.tradesCompleted} торговых циклов` : `${terms.tradePactCost.toLocaleString("ru-RU")} ₽`}</small></button>
                        <button type="button" disabled={!terms.canNonAggression || game.rubles < terms.nonAggressionCost} onClick={() => setGame((current) => current ? diplomaticAction(current, id, "non_aggression") : current)}><b>ПАКТ О НЕНАПАДЕНИИ</b><small>{terms.canNonAggression ? `${terms.nonAggressionCost.toLocaleString("ru-RU")} ₽ · 24ч` : "недоступен при текущих отношениях"}</small></button>
                        {relation !== "war" && <button className="declare-war" type="button" onClick={() => setGame((current) => current ? diplomaticAction(current, id, "war") : current)}><b>ОБЪЯВИТЬ ВОЙНУ</b><small>{relation === "alliance" ? "предательство: −25 репутации" : "разорвать контакты"}</small></button>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        {tab === "log" && (
          <>
            <div className="panel-heading"><div><span className="eyebrow">ОПЕРАТИВНАЯ СВОДКА</span><h2>Журнал событий</h2></div><span className="node-type">НОВЫЕ СВЕРХУ</span></div>
            <p className="journal-explanation">Здесь фиксируется причинная цепочка: приказ → событие → результат. Переговоры командиров, предательства и решения штабов также попадают сюда.</p>
            <div className="log-filters" aria-label="Фильтр журнала">
              {(Object.keys(LOG_FILTER_LABELS) as LogFilter[]).map((filter) => (
                <button key={filter} className={logFilter === filter ? "active" : ""} type="button" onClick={() => setLogFilter(filter)}>{LOG_FILTER_LABELS[filter]}</button>
              ))}
            </div>
            <div className="event-log full">
              {visibleLog.length === 0 && <p className="empty-state">В этой категории событий пока нет.</p>}
              {visibleLog.map((entry) => {
                const time = formatGameTime(entry.minute);
                const category = getLogCategory(entry.text);
                return <div className={`log-entry ${entry.tone}`} key={entry.id}><time><b>Д{time.day}</b>{time.clock}</time><span className={`log-kind ${category}`}>{LOG_FILTER_LABELS[category]}</span><p>{entry.text}</p></div>;
              })}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function TacticalView({ game, setGame }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>> }) {
  const node = game.nodes.find((item) => item.id === game.tacticalNodeId);
  if (!node) return null;
  const layout = getTacticalLayout(node.id);
  const tacticalLocation = getLocationContent(node.id, node.sectorId, node.type);
  const terrain = findSectorPoint(node.id);
  const squads = game.squads.filter((item) => item.nodeId === node.id && item.status !== "dead" && item.status !== "moving");
  const playerSquads = squads.filter((item) => isPlayerControlledSquad(game, item) && item.unitKind === "combat");
  const active = playerSquads.find((item) => item.id === game.selectedSquadId) ?? playerSquads[0] ?? null;
  const target = squads.find((item) => item.id === game.tacticalTargetId) ?? null;
  const combatProfile = active && target ? getCombatProfile(game, active, target) : null;
  const activePosition = active ? getTacticalPosition(active) : null;
  const targetPosition = target ? getTacticalPosition(target) : null;
  const sightLabel = combatProfile?.lineOfSight === "clear" ? "ЧИСТАЯ" : combatProfile?.lineOfSight === "partial" ? "ОГРАНИЧЕНА" : "ПЕРЕКРЫТА";
  const activeFieldContact = game.fieldDeals.some((deal) => deal.status === "active" && deal.nodeId === node.id && deal.expiresAt > game.simMinute);
  const hostileContact = squads.some((left) => squads.some((right) => left.id !== right.id && squadsAreHostile(game, left, right)));

  return (
    <div className="tactical-overlay" role="dialog" aria-modal="true" aria-label={`Тактическая карта: ${node.name}`}>
      <div className="tactical-window">
        <header className="tactical-header">
          <div><span className="eyebrow">ТАКТИЧЕСКИЙ КАНАЛ // {NODE_LABEL[node.type].toUpperCase()}</span><h2>{node.name}</h2></div>
          <div className="tactical-status"><span className={hostileContact ? "hot" : activeFieldContact ? "contact" : "clear"} />{hostileContact ? "БОЕВОЙ КОНТАКТ" : activeFieldContact ? "ПОЛЕВЫЕ ПЕРЕГОВОРЫ" : "СЕКТОР ПОД НАБЛЮДЕНИЕМ"}</div>
          <button className="close-button" type="button" onClick={() => setGame((current) => current ? { ...current, tacticalNodeId: null, tacticalTargetId: null } : current)}>ЗАКРЫТЬ ×</button>
        </header>
        <div className="tactical-main">
          <div className={`tactical-map tactical-theme-${layout.theme}`}>
            <div className="tactical-grid" />
            {combatProfile && activePosition && targetPosition && (
              <svg className={`fire-solution ${combatProfile.lineOfSight}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line x1={activePosition.x} y1={activePosition.y} x2={targetPosition.x} y2={targetPosition.y} />
              </svg>
            )}
            {layout.roads.map((road, index) => (
              <div
                className="tactical-dynamic-road"
                key={`road-${index}`}
                style={{ top: `${road.top}%`, left: `${road.left}%`, width: `${road.width}%`, transform: `rotate(${road.rotate}deg)` }}
              />
            ))}
            {layout.covers.map((cover, index) => (
              <div
                className="tactical-dynamic-cover"
                key={`cover-${index}`}
                style={{ left: `${cover.left}%`, top: `${cover.top}%`, width: `${cover.width}%`, height: `${cover.height}%`, transform: `rotate(${cover.rotate}deg)` }}
              >
                <span>{cover.label}</span>
              </div>
            ))}
            <div
              className="tactical-dynamic-danger"
              style={{ left: `${layout.danger.left}%`, top: `${layout.danger.top}%`, width: `${layout.danger.width}%`, height: `${layout.danger.height}%` }}
            >
              <span>{layout.danger.label}</span>
            </div>
            {squads.map((squad) => {
              const faction = FACTIONS[squad.faction];
              const selected = squad.id === active?.id || squad.id === game.tacticalTargetId;
              const player = isPlayerControlledSquad(game, squad);
              const position = getTacticalPosition(squad);
              return (
                <button
                  className={`tactical-token ${selected ? "selected" : ""} ${player ? "friendly" : "hostile"} ${squad.suppression >= 55 ? "suppressed" : ""}`}
                  key={squad.id}
                  style={{ left: `${position.x}%`, top: `${position.y}%`, "--faction": faction.color } as React.CSSProperties}
                  type="button"
                  onClick={() => setGame((current) => current ? { ...current, selectedSquadId: player ? squad.id : current.selectedSquadId, tacticalTargetId: player ? current.tacticalTargetId : squad.id } : current)}
                >
                  <span className="token-face">{faction.short}</span>
                  <b>{squad.name}</b>
                  <small>{getSquadCombatRole(squad)} · {squad.fighters}/{squad.maxFighters} чел.</small>
                  <i><em style={{ width: pct(squad.strength, squad.maxStrength) }} /></i>
                  {squad.faction !== "mutants" && <span className="token-ammo">МАГ {Math.round(squad.magazine)}/{squad.magazineSize}</span>}
                  {squad.suppression >= 55 && <span className="token-suppressed">ПОДАВЛЕН</span>}
                </button>
              );
            })}
          </div>
          <aside className="tactical-sidebar">
            {active ? (
              <>
                <span className="eyebrow">ВАШ ОТРЯД</span>
                <h3>{active.name}</h3>
                <p className="muted">{active.rank} · {active.fighters}/{active.maxFighters} бойцов · {getSquadCombatRole(active).toLowerCase()}</p>
                <div className="tactical-terrain-brief">
                  <span>МЕСТНОСТЬ</span><b>{layout.terrain}</b>
                  {terrain && <small>Оборона −{Math.round(terrain.defenseBonus * 100)}% урона · атака +{Math.round(terrain.attackBonus * 100)}%</small>}
                  <small>Радиация {Math.round(tacticalLocation.radiation * 100)}% · пси-фон {Math.round(tacticalLocation.psi * 100)}% · точность {tacticalLocation.accuracy >= 0 ? "+" : ""}{Math.round(tacticalLocation.accuracy * 100)}%</small>
                </div>
                <div className="tactical-loadout"><span><small>ОРУЖИЕ</small><b>{active.weaponId ? ZONE_ITEMS[active.weaponId].name : "нет"}</b></span><span><small>БРОНЯ</small><b>{active.armorId ? ZONE_ITEMS[active.armorId].name : "нет"}</b></span><p>{itemEffectsText(active.weaponId ?? "makarov")}<br />{active.armorId ? itemEffectsText(active.armorId) : "без бронезащиты"}</p></div>
                <StatBar label="ЗДОРОВЬЕ" value={active.strength} max={active.maxStrength} tone={active.strength < 35 ? "red" : "green"} />
                <StatBar label="ВЫНОСЛИВОСТЬ" value={active.stamina} max={active.maxStamina} tone={active.stamina < 30 ? "red" : "green"} />
                <StatBar label="ПОДАВЛЕНИЕ" value={active.suppression} max={100} tone={active.suppression > 55 ? "red" : "amber"} />
                <div className="ammo-readout">
                  <div><span>МАГАЗИН</span><b>{Math.round(active.magazine)} / {active.magazineSize}</b></div>
                  <div><span>ЗАПАС</span><b>{Math.round(active.ammo)} / {active.maxAmmo}</b></div>
                </div>
                {target && combatProfile ? (
                  <div className="target-card" style={{ "--faction": FACTIONS[target.faction].color } as React.CSSProperties}>
                    <span>ОГНЕВОЕ РЕШЕНИЕ</span><b>{target.name}</b><small>{FACTIONS[target.faction].name} · {target.fighters}/{target.maxFighters} бойцов · {getSquadStrengthPercent(target)}% боеспособности</small>
                    <div className="fire-intel">
                      <div><span>ДИСТАНЦИЯ</span><b className={combatProfile.distance > combatProfile.effectiveRange ? "bad" : "good"}>{combatProfile.distance} м / {combatProfile.effectiveRange} м</b></div>
                      <div><span>ЛИНИЯ ОГНЯ</span><b className={combatProfile.lineOfSight === "blocked" ? "bad" : combatProfile.lineOfSight === "clear" ? "good" : "warn"}>{sightLabel}</b></div>
                      <div><span>ШАНС ПОПАДАНИЯ</span><b>{Math.round(combatProfile.hitChance * 100)}%</b></div>
                      <div><span>УКРЫТИЕ ЦЕЛИ</span><b>{Math.round(combatProfile.cover * 100)}%</b></div>
                    </div>
                    {combatProfile.obstacle && <small>Помеха: {combatProfile.obstacle}</small>}
                  </div>
                ) : <p className="order-hint">Нажмите вражеский жетон на карте, чтобы получить огневое решение.</p>}
                <div className="tactical-actions">
                  <button disabled={!target || active.magazine < 8} type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "focus") : current)}><b>СОСРЕДОТОЧИТЬ ОГОНЬ</b><small>8 патронов из магазина</small></button>
                  <button disabled={!target || active.stamina < 12} type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "advance") : current)}><b>СБЛИЗИТЬСЯ</b><small>сократить дистанцию · −12 выносливости</small></button>
                  <button disabled={!target || active.grenades < 1 || !combatProfile || combatProfile.distance > 62} type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "grenade") : current)}><b>БРОСИТЬ ГРАНАТУ</b><small>{combatProfile && combatProfile.distance > 62 ? "цель дальше 62 м" : `осталось: ${active.grenades}`}</small></button>
                  <button type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "cover") : current)}><b>ЗАНЯТЬ УКРЫТИЕ</b><small>сменить позицию · сбросить подавление</small></button>
                  <button disabled={active.magazine >= active.magazineSize || active.ammo <= 0} type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "reload") : current)}><b>СМЕНИТЬ МАГАЗИН</b><small>{Math.round(active.ammo)} патронов в запасе</small></button>
                  <button disabled={active.medkits < 1 || active.strength >= active.maxStrength} type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "medkit") : current)}><b>ПРИМЕНИТЬ АПТЕЧКУ</b><small>+{30 + game.research.medicine * 10} здоровья · осталось {active.medkits}</small></button>
                  <button disabled={active.ammo >= active.maxAmmo || (game.rubles < 1800 && game.trophies.supplies < 2)} type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "resupply") : current)}><b>ПОДВЕЗТИ ПАТРОНЫ</b><small>{game.trophies.supplies >= 2 ? "2 ед. припасов" : "1 800 ₽"}</small></button>
                  <button className="danger" type="button" onClick={() => setGame((current) => current ? tacticalAction(current, "retreat") : current)}><b>ОТСТУПИТЬ</b><small>к ближайшей своей точке</small></button>
                </div>
              </>
            ) : <p className="empty-state">На локации нет вашего отряда.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function WarGroupsGame() {
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [ui, setUi] = useState<UiPreferences>(DEFAULT_UI);
  const [uiReady, setUiReady] = useState(false);
  const [squadDrawerOpen, setSquadDrawerOpen] = useState(false);
  const lastSpeedRef = useRef<0 | 1 | 4 | 12>(1);
  const layoutDragRef = useRef<{
    kind: "panel" | "dock";
    pointerId: number;
    startPosition: number;
    startValue: number;
  } | null>(null);
  const simulationActive = Boolean(game && game.speed !== 0 && !game.victory && !game.defeat);
  const gameStarted = Boolean(game);
  const tacticalOpen = Boolean(game?.tacticalNodeId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasSave(Boolean(window.localStorage.getItem(SAVE_KEY))));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(UI_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<UiPreferences>;
          setUi({
            ...DEFAULT_UI,
            ...saved,
            panelWidth: clampUi(Number(saved.panelWidth) || DEFAULT_UI.panelWidth, 300, 560),
            dockHeight: clampUi(Number(saved.dockHeight) || DEFAULT_UI.dockHeight, 104, 240),
            mapFocus: false,
            helpVisible: false,
          });
        }
      } catch {
        window.localStorage.removeItem(UI_KEY);
      } finally {
        setUiReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!uiReady) return;
    const persistent = {
      panelWidth: ui.panelWidth,
      dockHeight: ui.dockHeight,
      panelCollapsed: ui.panelCollapsed,
      dockCollapsed: ui.dockCollapsed,
    };
    window.localStorage.setItem(UI_KEY, JSON.stringify(persistent));
  }, [ui, uiReady]);

  useEffect(() => {
    if (game?.speed && game.speed > 0) lastSpeedRef.current = game.speed;
  }, [game?.speed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "Escape") {
        if (tacticalOpen) {
          setGame((current) => current ? { ...current, tacticalNodeId: null, tacticalTargetId: null } : current);
        } else if (squadDrawerOpen) {
          setSquadDrawerOpen(false);
        } else if (ui.helpVisible || ui.mapFocus) {
          setUi((current) => ({ ...current, helpVisible: false, mapFocus: false }));
        }
        return;
      }

      if (target?.closest("button,input,select,textarea,[contenteditable='true']")) return;

      if (!gameStarted || tacticalOpen) return;
      const key = event.key.toLowerCase();
      if (event.code === "Space") {
        setGame((current) => {
          if (!current) return current;
          if (current.speed > 0) lastSpeedRef.current = current.speed;
          return { ...current, speed: current.speed === 0 ? lastSpeedRef.current : 0 };
        });
      } else if (key === "m") {
        if (game?.campaignMode === "squad") window.dispatchEvent(new Event("war-groups-map-focus"));
        else setUi((current) => ({ ...current, mapFocus: !current.mapFocus, helpVisible: false }));
      }
      else if (key === "i") {
        if (game?.campaignMode === "squad") setSquadDrawerOpen((current) => !current);
        else setUi((current) => ({ ...current, panelCollapsed: !current.panelCollapsed, mapFocus: false }));
      }
      else if (key === "u") setUi((current) => ({ ...current, dockCollapsed: !current.dockCollapsed, mapFocus: false }));
      else if (key === "?") setUi((current) => ({ ...current, helpVisible: !current.helpVisible }));
      else if (game?.campaignMode === "squad" && /^[1-9]$/.test(event.key)) return;
      else if (event.key === "0") setGame((current) => current ? { ...current, speed: 0 } : current);
      else if (event.key === "1") setGame((current) => current ? { ...current, speed: 1 } : current);
      else if (event.key === "2") setGame((current) => current ? { ...current, speed: 4 } : current);
      else if (event.key === "3") setGame((current) => current ? { ...current, speed: 12 } : current);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameStarted, tacticalOpen, squadDrawerOpen, ui.helpVisible, ui.mapFocus, game?.campaignMode]);

  useEffect(() => {
    if (!simulationActive) return;
    const timer = window.setInterval(() => setGame((current) => current ? tickGame(current) : current), 700);
    return () => window.clearInterval(timer);
  }, [simulationActive]);

  useEffect(() => {
    if (!game) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(game));
      setHasSave(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [game]);

  const saveNow = () => {
    if (!game) return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    setHasSave(true);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const loadGame = () => {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GameState;
      if (parsed.version !== 1) return;
      setGame(migrateGameState(parsed));
    } catch {
      window.localStorage.removeItem(SAVE_KEY);
      setHasSave(false);
    }
  };

  if (!game) return <StartScreen hasSave={hasSave} onContinue={loadGame} onStart={(mode, faction, allegiance) => setGame(createGame(faction, mode, allegiance))} />;

  const faction = FACTIONS[game.playerFaction];
  const gameTime = formatGameTime(game.simMinute);
  const selectedSquad = game.squads.find((squad) => squad.id === game.selectedSquadId) ?? null;
  const untilEmission = Math.max(0, game.nextEmissionAt - game.simMinute);
  const hostileCount = game.squads.filter((squad) => squad.status === "combat").length;
  const worldActivity = getALifeCounts(game);
  const playerCombatSquads = game.squads.filter((squad) => isPlayerControlledSquad(game, squad) && squad.unitKind === "combat" && squad.status !== "dead");
  const playerMobileSquads = playerCombatSquads.filter((squad) => !squad.homeGarrison);
  const playerGarrisons = playerCombatSquads.filter((squad) => squad.homeGarrison);
  const playerSquadLimit = 4 + game.research.logistics * 2;
  const activePlayerSquad = game.campaignMode === "squad" ? game.squads.find((squad) => squad.id === game.playerSquadId) ?? null : null;
  const activePlayerNode = activePlayerSquad ? game.nodes.find((node) => node.id === activePlayerSquad.nodeId) ?? null : null;
  const freshPdaReports = game.campaignMode === "squad" ? game.squadKnowledge.reports.filter((report) => report.expiresAt > game.simMinute).length : 0;

  const handleNode = (id: string) => {
    if (game.campaignMode === "faction" && selectedSquad && isPlayerControlledSquad(game, selectedSquad) && selectedSquad.unitKind === "combat" && !selectedSquad.homeGarrison && selectedSquad.status !== "moving" && selectedSquad.status !== "combat") {
      const current = game.nodes.find((node) => node.id === selectedSquad.nodeId);
      if (current?.links.includes(id)) {
        setGame((state) => state ? issueMove(state, selectedSquad.id, id) : state);
        return;
      }
      if (current?.localLinks?.includes(id)) {
        setGame((state) => state ? issueSectorMove(state, selectedSquad.id, id) : state);
        return;
      }
    }
    setGame((state) => state ? { ...state, selectedNodeId: id } : state);
  };

  const togglePanel = () => setUi((current) => current.mapFocus
    ? { ...current, mapFocus: false, panelCollapsed: false }
    : { ...current, panelCollapsed: !current.panelCollapsed });
  const startLayoutDrag = (kind: "panel" | "dock", event: React.PointerEvent<HTMLDivElement>) => {
    if (ui.mapFocus || (kind === "panel" ? ui.panelCollapsed : ui.dockCollapsed)) return;
    layoutDragRef.current = {
      kind,
      pointerId: event.pointerId,
      startPosition: kind === "panel" ? event.clientX : event.clientY,
      startValue: kind === "panel" ? ui.panelWidth : ui.dockHeight,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveLayoutDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = layoutDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const position = drag.kind === "panel" ? event.clientX : event.clientY;
    const nextValue = drag.startValue - (position - drag.startPosition);
    setUi((current) => drag.kind === "panel"
      ? { ...current, panelWidth: clampUi(nextValue, 300, 560) }
      : { ...current, dockHeight: clampUi(nextValue, 104, 240) });
  };

  const stopLayoutDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (layoutDragRef.current?.pointerId !== event.pointerId) return;
    layoutDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resizeWithKeyboard = (kind: "panel" | "dock", delta: number) => {
    setUi((current) => kind === "panel"
      ? { ...current, panelWidth: clampUi(current.panelWidth + delta, 300, 560) }
      : { ...current, dockHeight: clampUi(current.dockHeight + delta, 104, 240) });
  };

  return (
    <main
      className={`game-shell ${game.campaignMode === "squad" ? "squad-campaign squad-unified-map" : "faction-campaign"} ${ui.panelCollapsed || ui.mapFocus ? "panel-collapsed" : ""} ${ui.dockCollapsed || ui.mapFocus ? "dock-collapsed" : ""} ${ui.mapFocus ? "map-focus" : ""}`}
      style={{ "--player": faction.color, "--panel-width": `${ui.panelWidth}px`, "--dock-height": `${ui.dockHeight}px` } as React.CSSProperties}
    >
      <header className="top-command-bar">
        <div className="brand-lockup"><span className="hazard-mark">☢</span><div><b>WAR GROUPS</b><small>ОПЕРАТИВНЫЙ КПК</small></div></div>
        <div className="faction-id"><span className="faction-sigil" style={{ "--faction": faction.color } as React.CSSProperties}>{game.campaignMode === "squad" && !game.squadAllegiance ? "?" : faction.short}</span><div><small>{game.campaignMode === "squad" ? "ВАШ ОТРЯД" : "ГРУППИРОВКА"}</small><b>{game.campaignMode === "squad" && !game.squadAllegiance ? "Нейтральные новички" : faction.name}</b></div></div>
        <div className="resource-strip">
          <div><small>{game.campaignMode === "squad" ? "ДЕНЬГИ" : "КАЗНА"}</small><b>{Math.floor(game.rubles).toLocaleString("ru-RU")} ₽</b></div>
          <div><small>АРТЕФАКТЫ</small><b>{game.artifacts}</b></div>
          <div><small>ТРОФЕИ</small><b>{game.trophies.weapons + game.trophies.armor + game.trophies.supplies}</b></div>
          <div><small>ДЕНЬ {gameTime.day}</small><b>{gameTime.clock}</b></div>
        </div>
        <div className="time-controls" aria-label="Скорость времени">
          {([0, 1, 4, 12] as const).map((speed) => <button key={speed} className={game.speed === speed ? "active" : ""} type="button" onClick={() => setGame((state) => state ? { ...state, speed } : state)}>{speed === 0 ? "Ⅱ" : `×${speed}`}</button>)}
        </div>
        <button className="save-button" type="button" onClick={saveNow}>{savedNotice ? "СОХРАНЕНО ✓" : "СОХРАНИТЬ"}</button>
      </header>

      {game.emissionWarned && (
        <div className="emission-banner"><span>☢</span><b>ПРИБЛИЖАЕТСЯ ВЫБРОС</b><p>До фронта: {Math.ceil(untilEmission)} мин. Базы и точки с домиком являются укрытиями.</p></div>
      )}

      <section className="game-workspace">
        <div className="map-column">
          <div className="map-status-row">
            {game.campaignMode === "squad" ? (
              <>
                <div><span className="online-dot" /> {activePlayerNode?.name?.toUpperCase() ?? "СВЯЗЬ ПОТЕРЯНА"}</div>
                <div>{freshPdaReports ? `КПК: ${freshPdaReports} НОВЫХ ОТМЕТОК` : "КПК: НОВЫХ СИГНАЛОВ НЕТ"}</div>
                <div>ВЫБРОС: {Math.floor(untilEmission / 60)}ч {Math.floor(untilEmission % 60)}м</div>
              </>
            ) : (
              <>
                <div><span className="online-dot" /> A-LIFE: АКТИВНА</div>
                <div className={hostileCount ? "danger-text" : ""}>{hostileCount ? `БОЕВЫХ КОНТАКТОВ: ${hostileCount}` : `ЗАДАЧ: ${worldActivity.activeMissions} · КАРАВАНОВ: ${worldActivity.caravans}`}</div>
                <div>СЛЕД. ВЫБРОС: {Math.floor(untilEmission / 60)}ч {Math.floor(untilEmission % 60)}м</div>
              </>
            )}
          </div>
          <ZoneMap
            game={game}
            setGame={setGame}
            onNode={handleNode}
            onSquad={(id, nodeId) => {
              if (game.campaignMode === "faction") setUi((current) => ({ ...current, panelCollapsed: false, mapFocus: false }));
              setGame((state) => state ? { ...state, selectedSquadId: id, selectedNodeId: nodeId } : state);
            }}
            ui={ui}
            onTogglePanel={togglePanel}
            onToggleHelp={() => setUi((current) => ({ ...current, helpVisible: !current.helpVisible }))}
            onOpenPda={() => setSquadDrawerOpen(true)}
          />
          <div className="legend-bar">
            {(Object.keys(FACTIONS) as FactionId[]).map((id) => <span key={id}><i style={{ background: FACTIONS[id].color }} />{FACTIONS[id].name}</span>)}
          </div>
        </div>
        {game.campaignMode === "faction" && <div
          className="workspace-resizer"
          role="separator"
          aria-label="Изменить ширину информационной панели"
          aria-orientation="vertical"
          aria-valuemax={560}
          aria-valuemin={300}
          aria-valuenow={ui.panelWidth}
          tabIndex={0}
          onPointerDown={(event) => startLayoutDrag("panel", event)}
          onPointerMove={moveLayoutDrag}
          onPointerUp={stopLayoutDrag}
          onPointerCancel={stopLayoutDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") resizeWithKeyboard("panel", 20);
            else if (event.key === "ArrowRight") resizeWithKeyboard("panel", -20);
            else return;
            event.preventDefault();
          }}
        ><span /></div>}
        {game.campaignMode === "faction" && <CommandPanel key={game.selectedSquadId ?? "no-squad"} game={game} setGame={setGame} />}
      </section>

      {game.campaignMode === "squad" && squadDrawerOpen && (
        <div className="squad-utility-drawer">
          <button className="drawer-backdrop" type="button" aria-label="Закрыть КПК" onClick={() => setSquadDrawerOpen(false)} />
          <div className="drawer-panel">
            <header><span>КПК ОТРЯДА</span><button type="button" onClick={() => setSquadDrawerOpen(false)}>×</button></header>
            <CommandPanel key={game.selectedSquadId ?? "no-squad"} game={game} setGame={setGame} />
          </div>
        </div>
      )}

      {game.campaignMode === "faction" && <section className="squad-dock" aria-label="Ваши отряды">
        <div
          className="dock-resizer"
          role="separator"
          aria-label="Изменить высоту ленты отрядов"
          aria-orientation="horizontal"
          aria-valuemax={240}
          aria-valuemin={104}
          aria-valuenow={ui.dockHeight}
          tabIndex={0}
          onPointerDown={(event) => startLayoutDrag("dock", event)}
          onPointerMove={moveLayoutDrag}
          onPointerUp={stopLayoutDrag}
          onPointerCancel={stopLayoutDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") resizeWithKeyboard("dock", 20);
            else if (event.key === "ArrowDown") resizeWithKeyboard("dock", -20);
            else return;
            event.preventDefault();
          }}
        ><span /></div>
        <div className="dock-title"><span>{game.campaignMode === "squad" ? "ВАШ ОТРЯД" : "ОТРЯДЫ"}</span><b>{game.campaignMode === "squad" ? `${playerMobileSquads[0]?.fighters ?? 0} БОЙЦА · ${playerMobileSquads[0] ? STATUS_LABEL[playerMobileSquads[0].status].toUpperCase() : "СВЯЗЬ ПОТЕРЯНА"}` : `МОБ. ${playerMobileSquads.length}/${playerSquadLimit} · ГАРН. ${playerGarrisons.length}`}</b></div>
        <div className="dock-scroll">
          {playerCombatSquads.map((squad) => {
            const location = game.nodes.find((node) => node.id === squad.nodeId)!;
            return (
              <button
                type="button"
                className={`squad-card ${squad.id === game.selectedSquadId ? "active" : ""}`}
                key={squad.id}
                onClick={() => {
                  setUi((current) => ({ ...current, panelCollapsed: false, mapFocus: false }));
                  setGame((state) => state ? { ...state, selectedSquadId: squad.id, selectedNodeId: squad.destinationId ?? squad.nodeId } : state);
                }}
              >
                <span className="squad-card-icon"><SquadGlyph squad={squad} /></span>
                <span className="squad-card-copy"><b>{squad.name}</b><small>{squad.fighters}/{squad.maxFighters} чел. · {getSquadMarkerIntel(squad).qualityLabel} · {squad.status === "moving" ? `переход ${Math.round(squad.travel * 100)}%` : location.name}</small><i><em style={{ width: pct(squad.strength, squad.maxStrength) }} /></i></span>
                <span className={`squad-state ${squad.status}`}>{squad.homeGarrison ? "ГАРНИЗОН" : STATUS_LABEL[squad.status]}</span>
              </button>
            );
          })}
        </div>
      </section>}

      {ui.helpVisible && (
        <aside className="interface-help" aria-label="Управление интерфейсом">
          <header><span>УПРАВЛЕНИЕ КПК</span><button type="button" aria-label="Закрыть подсказку" onClick={() => setUi((current) => ({ ...current, helpVisible: false }))}>×</button></header>
          <div><kbd>Space</kbd><span>пауза / продолжить</span></div>
          {game.campaignMode === "squad"
            ? <><div><kbd>1—9</kbd><span>выбрать бойца по номеру</span></div><div><kbd>Ctrl+A</kbd><span>выделить весь живой состав</span></div></>
            : <><div><kbd>1 · 2 · 3</kbd><span>скорость ×1 / ×4 / ×12</span></div><div><kbd>0</kbd><span>пауза</span></div></>}
          <div><kbd>M</kbd><span>большая карта</span></div>
          {game.campaignMode === "squad"
            ? <div><kbd>I</kbd><span>рюкзак, заказы и контакты</span></div>
            : <><div><kbd>I</kbd><span>правая панель</span></div><div><kbd>U</kbd><span>лента отрядов</span></div></>}
          <div><kbd>Esc</kbd><span>закрыть окно / вернуть интерфейс</span></div>
          <p>Светлые разделители между областями можно тянуть мышью. Настройка сохраняется на этом устройстве.</p>
        </aside>
      )}

      {game.tacticalNodeId && <TacticalView game={game} setGame={setGame} />}

      {(game.victory || game.defeat) && (
        <div className="end-overlay">
          <div className={game.victory ? "victory" : "defeat"}>
            <span>{game.victory ? "ОПЕРАЦИЯ ЗАВЕРШЕНА" : "СВЯЗЬ С ГРУППИРОВКОЙ ПОТЕРЯНА"}</span>
            <h2>{game.victory ? "ЗОНА ПОД ВАШИМ КОНТРОЛЕМ" : "ГРУППИРОВКА УНИЧТОЖЕНА"}</h2>
            <p>{game.victory ? "Все враждебные штабы подавлены. Основные территории контролируются вашими силами." : "Главная база потеряна, боеспособных отрядов не осталось."}</p>
            <button type="button" onClick={() => setGame(null)}>ВЕРНУТЬСЯ В ГЛАВНОЕ МЕНЮ</button>
          </div>
        </div>
      )}
    </main>
  );
}
