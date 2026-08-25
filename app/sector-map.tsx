"use client";

import { useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import {
  FACTIONS,
  getSquadMarkerIntel,
  getSquadStrengthPercent,
  isPlayerControlledSquad,
  issueSectorMove,
  type GameState,
  type Squad,
  type ZoneNode,
} from "./game-engine";
import {
  SECTOR_MAP_HEIGHT,
  SECTOR_MAP_WIDTH,
  findSectorPoint,
  getSectorForNode,
  getSectorMap,
  getSectorRoute,
  getSectorRoutes,
  type CordonRouteKind,
  type SectorMapDefinition,
  type SectorTheme,
} from "./sector-map-registry";

const TYPE_LABEL: Record<ZoneNode["type"], string> = {
  base: "главная база",
  outpost: "опорная точка",
  camp: "стоянка",
  anomaly: "аномальное поле",
  shelter: "капитальное укрытие",
};

const STATUS_LABEL: Record<Squad["status"], string> = {
  idle: "ожидает приказ",
  moving: "в пути",
  capturing: "захватывает",
  combat: "ведёт бой",
  dead: "уничтожен",
};

const ROUTE_CLASS: Record<CordonRouteKind, string> = {
  шоссе: "highway",
  грунтовка: "dirt",
  "лесная тропа": "trail",
  насыпь: "rail",
};

const THEME_PALETTE: Record<SectorTheme, { ground: string; ground2: string; accent: string }> = {
  swamp: { ground: "#18251f", ground2: "#303529", accent: "#668373" },
  rural: { ground: "#202b20", ground2: "#393727", accent: "#7d896d" },
  scrapyard: { ground: "#292923", ground2: "#3c382f", accent: "#8a7b61" },
  industrial: { ground: "#232925", ground2: "#363935", accent: "#747e72" },
  laboratory: { ground: "#1e2b28", ground2: "#313a34", accent: "#67948a" },
  forest: { ground: "#1c261c", ground2: "#3b2e22", accent: "#8a6b4d" },
  urban: { ground: "#242a29", ground2: "#393c3a", accent: "#7f8782" },
  flooded: { ground: "#1c2929", ground2: "#34382f", accent: "#67878a" },
  psi: { ground: "#22242b", ground2: "#343542", accent: "#8a7da5" },
  nuclear: { ground: "#252923", ground2: "#3d3b31", accent: "#8d8a68" },
};

function squadOffset(squad: Squad, sectorSquads: Squad[]) {
  if (squad.status === "moving") {
    let hash = 0;
    for (const char of squad.id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return { x: ((Math.abs(hash) % 3) - 1) * 5, y: ((Math.abs(hash >> 3) % 3) - 1) * 5 };
  }
  const peers = sectorSquads.filter((item) => item.status !== "moving" && item.nodeId === squad.nodeId).sort((a, b) => a.id.localeCompare(b.id));
  if (peers.length <= 1) return { x: 0, y: -19 };
  const index = Math.max(0, peers.findIndex((item) => item.id === squad.id));
  const angle = (-Math.PI / 2) + (index / peers.length) * Math.PI * 2;
  const radius = peers.length > 4 ? 25 : 20;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function squadPoint(squad: Squad) {
  const start = findSectorPoint(squad.nodeId);
  if (!start) return { x: 0, y: 0 };
  const end = squad.destinationId ? findSectorPoint(squad.destinationId) : undefined;
  if (squad.status !== "moving" || !end || !squad.destinationId) return { x: start.x, y: start.y };
  const startSector = getSectorForNode(squad.nodeId);
  const endSector = getSectorForNode(squad.destinationId);
  if (startSector?.id !== endSector?.id) return { x: start.x, y: start.y };
  return { x: start.x + (end.x - start.x) * squad.travel, y: start.y + (end.y - start.y) * squad.travel };
}

function TerrainLayer({ sector }: { sector: SectorMapDefinition }) {
  if (sector.theme === "swamp" || sector.theme === "flooded") {
    return (
      <g className="sector-terrain-water" aria-hidden="true">
        <path d="M0 96C164 44 242 154 361 130S581 49 900 106V248C706 288 630 202 478 240S224 320 0 250Z" />
        <path d="M0 410C151 357 245 438 372 410S643 337 900 397V620H0Z" />
        <ellipse cx="214" cy="324" rx="108" ry="58" />
        <ellipse cx="704" cy="310" rx="120" ry="74" />
      </g>
    );
  }
  if (sector.theme === "urban") {
    return (
      <g className="sector-terrain-city" aria-hidden="true">
        {[0, 1, 2].map((row) => [0, 1, 2, 3].map((column) => (
          <rect key={`${row}-${column}`} x={70 + column * 205 + (row % 2) * 22} y={72 + row * 174} width="118" height="92" />
        )))}
      </g>
    );
  }
  if (["industrial", "scrapyard", "nuclear", "laboratory", "psi"].includes(sector.theme)) {
    return (
      <g className={`sector-terrain-industry theme-${sector.theme}`} aria-hidden="true">
        <path className="sector-rail-bed" d="M-20 168C230 190 518 179 920 110" />
        <path className="sector-pipe" d="M54 520C203 448 288 494 422 412S687 315 860 350" />
        <rect x="85" y="78" width="156" height="98" />
        <rect x="620" y="80" width="180" height="112" />
        <rect x="338" y="360" width="194" height="126" />
        <circle cx="760" cy="444" r="55" />
      </g>
    );
  }
  return (
    <g className="sector-terrain-land" aria-hidden="true">
      <path className="sector-forest-mass" d="M0 0H310L348 105 284 208 164 286 102 426H0Z" />
      <path className="sector-forest-mass" d="M610 0H900V620H816L762 516 804 386 736 248 648 194Z" />
      <path className="sector-field-mass" d="M90 342L360 322 420 486 298 620H38Z" />
      <path className="sector-field-mass" d="M398 302L646 278 694 480 550 574 388 486Z" />
    </g>
  );
}

export default function SectorMap({
  sectorId,
  game,
  setGame,
  onClose,
}: {
  sectorId: string;
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState | null>>;
  onClose: () => void;
}) {
  const [showControl, setShowControl] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const sector = getSectorMap(sectorId);
  if (!sector) return null;
  const palette = THEME_PALETTE[sector.theme];
  const sectorNodes = sector.points.map((point) => game.nodes.find((node) => node.id === point.id)).filter((node): node is ZoneNode => Boolean(node));
  const pointIds = new Set(sector.points.map((point) => point.id));
  const sectorSquads = game.squads.filter((squad) => squad.status !== "dead" && pointIds.has(squad.nodeId));
  const selectedNode = sectorNodes.find((node) => node.id === game.selectedNodeId)
    ?? sectorNodes.find((node) => node.id === sector.anchorNodeId)
    ?? sectorNodes[0];
  const visual = findSectorPoint(selectedNode.id)!;
  const playerSquads = sectorSquads.filter((squad) => isPlayerControlledSquad(game, squad));
  const active = playerSquads.find((squad) => squad.id === game.selectedSquadId) ?? playerSquads[0] ?? null;
  const currentNode = active ? game.nodes.find((node) => node.id === active.nodeId) : null;
  const reachable = new Set(active && !active.homeGarrison && active.status !== "moving" && active.status !== "combat" ? currentNode?.localLinks ?? [] : []);
  const squadsAtPoint = sectorSquads.filter((squad) => squad.nodeId === selectedNode.id && squad.status !== "moving");
  const owner = selectedNode.owner ? FACTIONS[selectedNode.owner] : null;
  const routes = getSectorRoutes(sector.id);
  const connections = (selectedNode.localLinks ?? []).map((id) => ({
    node: sectorNodes.find((item) => item.id === id),
    route: getSectorRoute(selectedNode.id, id),
  })).filter((entry): entry is { node: ZoneNode; route: NonNullable<ReturnType<typeof getSectorRoute>> } => Boolean(entry.node && entry.route));

  const selectPoint = (pointId: string) => {
    if (active && isPlayerControlledSquad(game, active) && !active.homeGarrison && active.status !== "moving" && active.status !== "combat" && currentNode?.localLinks?.includes(pointId)) {
      setGame((current) => current ? issueSectorMove(current, active.id, pointId) : current);
      return;
    }
    setGame((current) => current ? { ...current, selectedNodeId: pointId } : current);
  };

  return (
    <div className="sector-map-overlay" role="dialog" aria-modal="true" aria-label={`Внутренняя карта сектора ${sector.name}`}>
      <section className="sector-map-window">
        <header className="sector-map-header">
          <div><span className="eyebrow">КПК // ЛОКАЛЬНАЯ СЕТЬ // {sector.code}</span><h2>{sector.name}</h2></div>
          <div className="sector-map-summary">
            <span><small>ТОЧКИ</small><b>{sector.points.length}</b></span>
            <span><small>ВАШИ ОТРЯДЫ</small><b>{playerSquads.length}</b></span>
            <span><small>КОНТРОЛЬ</small><b>{sectorNodes.filter((node) => node.owner === game.playerFaction).length}/{sector.points.length}</b></span>
          </div>
          <button type="button" className="close-button" onClick={onClose}>ГЛОБАЛЬНАЯ КАРТА ×</button>
        </header>

        <div className="sector-map-body">
          <div className="cordon-map-stage">
            <svg
              className={`cordon-map-svg sector-theme-${sector.theme}`}
              viewBox={`0 0 ${SECTOR_MAP_WIDTH} ${SECTOR_MAP_HEIGHT}`}
              role="img"
              aria-label={`Карта ${sector.name} с локальными точками`}
              style={{ "--sector-ground": palette.ground, "--sector-ground-2": palette.ground2, "--sector-accent": palette.accent } as CSSProperties}
            >
              <defs>
                <linearGradient id={`sector-ground-${sector.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={palette.ground} />
                  <stop offset=".55" stopColor={palette.ground2} />
                  <stop offset="1" stopColor={palette.ground} />
                </linearGradient>
                <pattern id={`sector-grid-${sector.id}`} width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="rgba(190,201,168,.065)" strokeWidth="1" />
                </pattern>
                <pattern id={`sector-forest-${sector.id}`} width="28" height="25" patternUnits="userSpaceOnUse">
                  <path d="M4 22l7-15 7 15M15 20l5-11 5 11" fill="none" stroke="rgba(121,145,103,.31)" strokeWidth="1.2" />
                </pattern>
                <filter id={`sector-shadow-${sector.id}`} x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity=".9" />
                </filter>
              </defs>
              <rect width={SECTOR_MAP_WIDTH} height={SECTOR_MAP_HEIGHT} fill={`url(#sector-ground-${sector.id})`} />
              <TerrainLayer sector={sector} />
              <g className="cordon-contours" aria-hidden="true">
                <path d="M-20 84C119 32 245 73 360 126S618 185 930 78" />
                <path d="M-20 116C116 71 238 103 350 157S616 219 930 113" />
                <path d="M-20 482C125 428 248 464 370 520S644 601 930 498" />
              </g>
              {showControl && (
                <g className="sector-control-areas">
                  {sector.points.map((point) => {
                    const node = sectorNodes.find((item) => item.id === point.id);
                    if (!node?.owner) return null;
                    const style = { "--control": FACTIONS[node.owner].color } as CSSProperties;
                    return point.controlArea
                      ? <path key={point.id} className={point.id === selectedNode.id ? "selected" : ""} d={point.controlArea} style={style} />
                      : <circle key={point.id} className={point.id === selectedNode.id ? "selected" : ""} cx={point.x} cy={point.y} r={62 + point.cover * .28} style={style} />;
                  })}
                </g>
              )}
              <g className="sector-base-roads" aria-hidden="true">
                {routes.map((route) => <path key={`${route.from}-${route.to}-bed`} className={ROUTE_CLASS[route.kind]} d={route.path} />)}
              </g>
              {showGrid && <rect width={SECTOR_MAP_WIDTH} height={SECTOR_MAP_HEIGHT} fill={`url(#sector-grid-${sector.id})`} />}
              <g className="sector-landmarks" aria-hidden="true">
                {sector.points.map((point) => (
                  <g key={point.id} className={`landmark type-${point.type}`} transform={`translate(${point.x} ${point.y})`}>
                    {point.type === "base" && <><rect x="-38" y="-25" width="30" height="20" /><rect x="2" y="-34" width="36" height="27" /><path d="M-46 19H46M-42 13l10 12M-16 13l10 12M10 13l10 12M34 13l10 12" /></>}
                    {point.type === "outpost" && <><rect x="-27" y="-17" width="54" height="25" /><path d="M-39 17H39M-30 12l9 10M-4 12l9 10M22 12l9 10" /></>}
                    {point.type === "camp" && <><path d="M-31 14L-15-13 1 14ZM7 15L22-8 38 15Z" /><path d="M-42 22H44" /></>}
                    {point.type === "shelter" && <path d="M-34 16V-8L0-31 34-8V16M-20 16V-4L0-18 20-4V16" />}
                    {point.type === "anomaly" && <><circle r="30" /><circle r="18" /><path d="M0-34L9-12-9-12Z" /></>}
                  </g>
                ))}
              </g>
              <g className="cordon-local-routes">
                {routes.map((route) => {
                  const highlighted = (route.from === active?.nodeId && reachable.has(route.to)) || (route.to === active?.nodeId && reachable.has(route.from));
                  return <path key={`${route.from}-${route.to}`} d={route.path} className={`${ROUTE_CLASS[route.kind]} ${highlighted ? "reachable" : ""}`}><title>{route.kind} · {route.minutes} мин.</title></path>;
                })}
              </g>
              <g className="cordon-points">
                {sector.points.map((point) => {
                  const node = sectorNodes.find((item) => item.id === point.id);
                  if (!node) return null;
                  const nodeFaction = node.owner ? FACTIONS[node.owner] : null;
                  const selected = node.id === selectedNode.id;
                  const canReach = reachable.has(node.id);
                  return (
                    <g key={node.id} className={`cordon-point ${selected ? "selected" : ""} ${canReach ? "reachable" : ""}`} transform={`translate(${point.x} ${point.y})`} role="button" tabIndex={0} aria-label={`${node.name}, ${nodeFaction?.name ?? "нейтральная"}`} onClick={() => selectPoint(node.id)} onKeyDown={(event) => event.key === "Enter" && selectPoint(node.id)}>
                      <circle className="cordon-point-hit" r="29" />
                      {node.capture > 0 && <circle className="cordon-capture-ring" r="23" pathLength="100" strokeDasharray={`${node.capture * 100} 100`} style={{ stroke: FACTIONS[node.captureFaction!].color }} />}
                      {canReach && <circle className="cordon-reachable-ring" r="24" />}
                      <circle className="cordon-point-ring" r={selected ? 20 : 16} style={{ stroke: nodeFaction?.color ?? "#8c927f" }} />
                      <circle className="cordon-point-core" r={node.type === "base" ? 10 : 7} style={{ fill: nodeFaction?.color ?? "#6d7164" }} />
                      {node.type === "base" && <rect x="-4" y="-4" width="8" height="8" className="cordon-point-mark" />}
                      {node.type === "shelter" && <path d="M-5 4V-1L0-6 5-1V4Z" className="cordon-point-mark" />}
                    </g>
                  );
                })}
              </g>
              <g className="cordon-labels" aria-hidden="true">
                {sector.points.map((point) => <text key={point.id} x={point.labelX} y={point.labelY} textAnchor={point.anchor}>{point.name}</text>)}
              </g>
              <g className="cordon-squads" filter={`url(#sector-shadow-${sector.id})`}>
                {sectorSquads.map((squad) => {
                  const point = squadPoint(squad);
                  const offset = squadOffset(squad, sectorSquads);
                  const squadFaction = FACTIONS[squad.faction];
                  const selected = squad.id === game.selectedSquadId;
                  const marker = getSquadMarkerIntel(squad);
                  const coreSize = selected ? 8 : squad.fighters >= 20 ? 8 : 7;
                  const hexPath = `M0 ${-coreSize} L${coreSize * 0.88} ${-coreSize * 0.5} L${coreSize * 0.88} ${coreSize * 0.5} L0 ${coreSize} L${-coreSize * 0.88} ${coreSize * 0.5} L${-coreSize * 0.88} ${-coreSize * 0.5}Z`;
                  return (
                    <g key={squad.id} className={`cordon-squad shape-${marker.shape} quality-${marker.quality} ${selected ? "selected" : ""}`} transform={`translate(${point.x + offset.x} ${point.y + offset.y})`} onClick={(event) => { event.stopPropagation(); setGame((current) => current ? { ...current, selectedSquadId: squad.id, selectedNodeId: squad.nodeId } : current); }}>
                      <circle r={selected ? 13 : 10} className="cordon-squad-ring" style={{ stroke: squadFaction.color }} />
                      {marker.shape === "square"
                        ? <rect className="cordon-squad-core" x={-coreSize} y={-coreSize} width={coreSize * 2} height={coreSize * 2} rx="1" style={{ fill: squadFaction.color }} />
                        : marker.shape === "diamond"
                          ? <rect className="cordon-squad-core" x={-coreSize * .72} y={-coreSize * .72} width={coreSize * 1.44} height={coreSize * 1.44} transform="rotate(45)" style={{ fill: squadFaction.color }} />
                          : marker.shape === "hexagon"
                            ? <path className="cordon-squad-core" d={hexPath} style={{ fill: squadFaction.color }} />
                            : <circle r={coreSize} className="cordon-squad-core" style={{ fill: squadFaction.color }} />}
                      <text y="3" textAnchor="middle">{squadFaction.short}</text>
                      <g className="cordon-squad-count" transform="translate(10 -11)"><rect x="-7" y="-5" width="14" height="9" rx="2" /><text y="2" textAnchor="middle">{squad.fighters}</text></g>
                      <rect x="-10" y="13" width="20" height="3" className="cordon-squad-hp-bg" />
                      <rect x="-10" y="13" width={20 * (squad.strength / squad.maxStrength)} height="3" className="cordon-squad-hp" />
                    </g>
                  );
                })}
              </g>
              <g className="cordon-map-notes" aria-hidden="true">
                <text x="72" y="108">{sector.terrainLabels[0]}</text>
                <text x="565" y="196">{sector.terrainLabels[1]}</text>
                <text x="75" y="585">{sector.terrainLabels[2]}</text>
              </g>
            </svg>
            <div className="sector-layer-controls" aria-label="Слои карты">
              <button type="button" className={showControl ? "active" : ""} aria-pressed={showControl} onClick={() => setShowControl((value) => !value)}>ВЛИЯНИЕ</button>
              <button type="button" className={showGrid ? "active" : ""} aria-pressed={showGrid} onClick={() => setShowGrid((value) => !value)}>СЕТКА</button>
            </div>
            <div className="sector-map-legend" aria-label="Условные обозначения"><span><i className="road" />шоссе</span><span><i className="dirt" />грунтовка</span><span><i className="trail" />тропа</span><span><i className="forest" />местность</span></div>
            <div className="sector-map-scale">0&nbsp;&nbsp;&nbsp;100&nbsp;&nbsp;&nbsp;200 м</div>
            <div className="sector-map-north"><b>С</b><i /></div>
          </div>

          <aside className="sector-map-sidebar">
            <span className="eyebrow">ВЫБРАННАЯ ТОЧКА</span><h3>{selectedNode.name}</h3>
            <div className="sector-point-owner"><i style={{ background: owner?.color ?? "#747b6e" }} /><span>{owner?.name ?? "Нейтральная территория"}</span><b>+{selectedNode.income} ₽</b></div>
            <div className="sector-point-type">{TYPE_LABEL[selectedNode.type]}</div>
            <p>{visual.description}</p>
            <div className="sector-value"><small>ТАКТИЧЕСКОЕ ЗНАЧЕНИЕ</small><b>{visual.tacticalValue}</b></div>
            <div className="terrain-effect">
              <div className="terrain-effect-heading"><span>ЭФФЕКТ ОБОРОНЯЮЩЕЙСЯ СТОРОНЫ</span><b>{owner ? "АКТИВЕН" : "НЕЙТРАЛЬНО"}</b></div>
              <div className="terrain-effect-values"><span><small>ЗАЩИТА</small><b>−{Math.round(visual.defenseBonus * 100)}% урона</b></span><span><small>ОГНЕВОЙ ОБЗОР</small><b>+{Math.round(visual.attackBonus * 100)}% атаки</b></span></div>
              <p>Преимущество получает группировка, контролирующая точку.</p>
            </div>
            <div className="sector-point-stats">
              <span><small>КВАДРАТ</small><b>{visual.grid}</b></span><span><small>УКРЫТИЕ</small><b>{visual.cover}%</b></span>
              <span><small>МЕСТНОСТЬ</small><b>{visual.terrain}</b></span><span><small>ОБЗОР</small><b>{visual.sight}</b></span>
              <span><small>РИСК</small><b data-threat={visual.danger}>{visual.danger}</b></span><span><small>ЗАХВАТ</small><b>≈ {Math.round(22 * visual.captureFactor)} мин.</b></span>
            </div>
            <h4>Переходы с точки</h4>
            <div className="sector-connections">{connections.map(({ node: linked, route }) => <button key={linked.id} type="button" onClick={() => selectPoint(linked.id)}><span><b>{linked.name}</b><small>{route.kind}</small></span><em>{route.minutes} мин.</em></button>)}</div>
            <h4>Силы на точке</h4>
            <div className="sector-roster compact-roster">
              {squadsAtPoint.length === 0 ? <div className="empty-state">Сигналов отрядов нет.</div> : squadsAtPoint.map((squad) => <button type="button" key={squad.id} className={`mini-squad ${squad.id === game.selectedSquadId ? "active" : ""}`} onClick={() => setGame((current) => current ? { ...current, selectedSquadId: squad.id } : current)}><span className={`sector-roster-token shape-${getSquadMarkerIntel(squad).shape}`} style={{ background: FACTIONS[squad.faction].color }}>{squad.fighters}</span><span><b>{squad.name}</b><small>{squad.fighters}/{squad.maxFighters} бойцов · {getSquadMarkerIntel(squad).qualityLabel} · {STATUS_LABEL[squad.status]}</small></span><em>{getSquadStrengthPercent(squad)}%</em></button>)}
            </div>
            {active ? <div className="sector-active-order"><small>АКТИВНЫЙ ОТРЯД</small><b>{active.name} · {active.rank}</b><p>{active.homeGarrison ? "Стационарный гарнизон удерживает эту точку." : active.status === "combat" ? "Отход доступен только через команду на боевом планшете." : active.status === "moving" ? `Переход выполнен на ${Math.round(active.travel * 100)}%.` : "Соседние доступные точки подсвечены. Нажмите одну из них, чтобы отдать приказ."}</p></div> : <div className="empty-state">В секторе нет вашего отряда.</div>}
            {squadsAtPoint.length > 0 && <button className="primary-action compact" type="button" onClick={() => setGame((current) => current ? { ...current, tacticalNodeId: selectedNode.id, tacticalTargetId: null } : current)}>ОТКРЫТЬ БОЕВОЙ ПЛАНШЕТ</button>}
          </aside>
        </div>
      </section>
    </div>
  );
}
