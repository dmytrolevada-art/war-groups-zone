"use client";

import { useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import {
  FACTIONS,
  getSquadStrengthPercent,
  isPlayerControlledSquad,
  issueSectorMove,
  type GameState,
  type Squad,
  type ZoneNode,
} from "./game-engine";
import {
  CORDON_MAP_HEIGHT,
  CORDON_MAP_WIDTH,
  CORDON_POINT_IDS,
  CORDON_POINTS,
  CORDON_ROUTES,
  getCordonPoint,
  getCordonRoute,
  type CordonRouteKind,
} from "./cordon-sector-data";

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

function squadOffset(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return { x: ((Math.abs(hash) % 3) - 1) * 15, y: ((Math.abs(hash >> 3) % 3) - 1) * 13 };
}

function squadPoint(squad: Squad) {
  const start = getCordonPoint(squad.nodeId);
  if (squad.status !== "moving" || !squad.destinationId || !CORDON_POINT_IDS.includes(squad.destinationId)) {
    return { x: start.x, y: start.y };
  }
  const end = getCordonPoint(squad.destinationId);
  return {
    x: start.x + (end.x - start.x) * squad.travel,
    y: start.y + (end.y - start.y) * squad.travel,
  };
}

export default function CordonSectorMap({
  game,
  setGame,
  onClose,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState | null>>;
  onClose: () => void;
}) {
  const [showControl, setShowControl] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const sectorNodes = game.nodes.filter((node) => node.sectorId === "cordon");
  const sectorSquads = game.squads.filter(
    (squad) => squad.status !== "dead" && sectorNodes.some((node) => node.id === squad.nodeId),
  );
  const selectedNode = sectorNodes.find((node) => node.id === game.selectedNodeId)
    ?? sectorNodes.find((node) => node.id === "cordon")
    ?? sectorNodes[0];
  const visual = getCordonPoint(selectedNode.id);
  const playerSquads = sectorSquads.filter((squad) => isPlayerControlledSquad(game, squad));
  const active = playerSquads.find((squad) => squad.id === game.selectedSquadId) ?? playerSquads[0] ?? null;
  const currentNode = active ? game.nodes.find((node) => node.id === active.nodeId) : null;
  const reachable = new Set(
    active && !active.homeGarrison && active.status !== "moving" && active.status !== "combat" ? currentNode?.localLinks ?? [] : [],
  );
  const squadsAtPoint = sectorSquads.filter(
    (squad) => squad.nodeId === selectedNode.id && squad.status !== "moving",
  );
  const owner = selectedNode.owner ? FACTIONS[selectedNode.owner] : null;
  const connections = (selectedNode.localLinks ?? []).map((id) => ({
    node: sectorNodes.find((item) => item.id === id),
    route: getCordonRoute(selectedNode.id, id),
  })).filter((entry): entry is { node: ZoneNode; route: NonNullable<ReturnType<typeof getCordonRoute>> } => Boolean(entry.node && entry.route));

  const selectPoint = (pointId: string) => {
    if (active && isPlayerControlledSquad(game, active) && !active.homeGarrison && active.status !== "moving" && active.status !== "combat" && currentNode?.localLinks?.includes(pointId)) {
      setGame((current) => current ? issueSectorMove(current, active.id, pointId) : current);
      return;
    }
    setGame((current) => current ? { ...current, selectedNodeId: pointId } : current);
  };

  return (
    <div className="sector-map-overlay" role="dialog" aria-modal="true" aria-label="Внутренняя карта сектора Кордон">
      <section className="sector-map-window">
        <header className="sector-map-header">
          <div>
            <span className="eyebrow">КПК // ЛОКАЛЬНАЯ СЕТЬ // S-02</span>
            <h2>КОРДОН</h2>
          </div>
          <div className="sector-map-summary">
            <span><small>ТОЧКИ</small><b>8</b></span>
            <span><small>ВАШИ ОТРЯДЫ</small><b>{playerSquads.length}</b></span>
            <span><small>КОНТРОЛЬ</small><b>{sectorNodes.filter((node) => node.owner === game.playerFaction).length}/8</b></span>
          </div>
          <button type="button" className="close-button" onClick={onClose}>ГЛОБАЛЬНАЯ КАРТА ×</button>
        </header>

        <div className="sector-map-body">
          <div className="cordon-map-stage">
            <svg className="cordon-map-svg" viewBox={`0 0 ${CORDON_MAP_WIDTH} ${CORDON_MAP_HEIGHT}`} role="img" aria-label="Карта Кордона с локальными точками">
              <defs>
                <linearGradient id="cordonGround" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#202b20" />
                  <stop offset=".52" stopColor="#343426" />
                  <stop offset="1" stopColor="#1b251d" />
                </linearGradient>
                <pattern id="cordonGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0H0V40" fill="none" stroke="rgba(190,201,168,.055)" strokeWidth="1" />
                </pattern>
                <pattern id="cordonForest" width="28" height="25" patternUnits="userSpaceOnUse">
                  <path d="M4 22l7-15 7 15M15 20l5-11 5 11" fill="none" stroke="rgba(121,145,103,.31)" strokeWidth="1.2" />
                </pattern>
                <pattern id="cordonOrchard" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="12" cy="10" r="4" fill="none" stroke="rgba(144,155,111,.27)" strokeWidth="1" />
                  <path d="M12 14v6" stroke="rgba(144,155,111,.22)" strokeWidth="1" />
                </pattern>
                <pattern id="cordonScrub" width="22" height="18" patternUnits="userSpaceOnUse">
                  <path d="M4 16l4-7 4 7M13 14l3-5 3 5" fill="none" stroke="rgba(142,150,115,.22)" strokeWidth="1" />
                </pattern>
                <filter id="cordonTokenShadow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity=".9" />
                </filter>
              </defs>

              <rect width={CORDON_MAP_WIDTH} height={CORDON_MAP_HEIGHT} fill="url(#cordonGround)" />
              <g className="cordon-contours" aria-hidden="true">
                <path d="M-20 82C108 36 226 62 342 123S596 183 926 79" />
                <path d="M-28 112C112 68 230 92 338 151S594 214 932 111" />
                <path d="M-20 476C126 430 252 454 358 518S638 600 930 496" />
                <path d="M-16 505C118 462 240 482 346 544S642 635 940 526" />
                <path d="M214 250C251 225 320 230 350 269S335 346 278 355 199 310 214 250Z" />
                <path d="M231 266C262 247 311 251 331 278S318 327 280 334 222 307 231 266Z" />
              </g>
              <path className="cordon-forest-zone" d="M0 0H300L344 94 294 194 192 256 118 405 0 448Z" fill="url(#cordonForest)" />
              <path className="cordon-forest-zone" d="M596 0H900V620H816L770 510 805 410 743 282 632 214Z" fill="url(#cordonForest)" />
              <path className="cordon-field" d="M88 360L339 350 390 486 285 611H58Z" />
              <path className="cordon-field" d="M394 330L610 302 664 463 552 566 384 492Z" />
              <path className="cordon-orchard" d="M118 438L234 407 310 448 278 522 159 532Z" fill="url(#cordonOrchard)" />
              <path className="cordon-scrub-zone" d="M312 164L576 134 650 246 587 329 354 307Z" fill="url(#cordonScrub)" />

              {showControl && (
                <g className="cordon-control-areas" aria-label="Зоны влияния">
                  {CORDON_POINTS.map((point) => {
                    const node = sectorNodes.find((item) => item.id === point.id);
                    if (!node?.owner) return null;
                    return (
                      <path
                        key={point.id}
                        className={node.id === selectedNode.id ? "selected" : ""}
                        d={point.controlArea}
                        style={{ "--control": FACTIONS[node.owner].color } as CSSProperties}
                      />
                    );
                  })}
                </g>
              )}

              <g className="cordon-roads" aria-hidden="true">
                <path className="highway-bed" d="M214 620 C226 546 332 492 411 446 C498 394 583 355 666 350 C723 346 762 422 770 620" />
                <path className="highway-edge" d="M214 620 C226 546 332 492 411 446 C498 394 583 355 666 350 C723 346 762 422 770 620" />
                <path className="dirt-road" d="M223 548 C242 448 251 366 290 320 C338 263 397 242 450 222 C451 164 450 110 450 0" />
                <path className="dirt-road" d="M410 446 C505 462 613 439 666 350 C682 287 683 220 694 166" />
                <path className="forest-trail" d="M290 320 C354 388 345 430 410 446" />
                <path className="forest-trail" d="M694 166 C610 107 532 75 450 72" />
              </g>
              <g className="cordon-railway">
                <path className="rail-bed" d="M18 214 C245 225 548 219 888 155" />
                <path className="rail-line" d="M18 214 C245 225 548 219 888 155" />
                {Array.from({ length: 24 }, (_, index) => (
                  <line key={index} x1={30 + index * 36} y1={205 + Math.sin(index / 4) * 9} x2={33 + index * 36} y2={230 + Math.sin(index / 4) * 9} />
                ))}
              </g>
              {showGrid && <rect className="cordon-grid-layer" width={CORDON_MAP_WIDTH} height={CORDON_MAP_HEIGHT} fill="url(#cordonGrid)" />}

              <g className="cordon-buildings" aria-hidden="true">
                <g transform="translate(220 548)"><rect x="-55" y="-18" width="34" height="18" /><rect x="-14" y="-33" width="30" height="20" /><rect x="28" y="-13" width="38" height="20" /><path d="M-58-18l20-12 20 12M-16-33L1-45l18 12M25-13L47-27l22 14" /></g>
                <g transform="translate(290 320)"><rect x="-28" y="-24" width="56" height="46" /><rect x="-11" y="-48" width="22" height="24" /><circle cx="-18" cy="-32" r="9" /><circle cx="18" cy="-32" r="9" /><path d="M-34 22H34" /></g>
                <g transform="translate(764 532)"><rect x="-42" y="-24" width="84" height="42" /><rect x="-28" y="-16" width="22" height="15" /><rect x="11" y="-16" width="20" height="15" /><path d="M-59-38H54V35H-59ZM-55 30H55M-46 23l12 14M-20 23l12 14M8 23l12 14M34 23l12 14" /></g>
                <g transform="translate(410 446)"><rect x="-35" y="-18" width="28" height="25" /><rect x="5" y="-26" width="35" height="31" /></g>
                <g transform="translate(666 350)"><path d="M-29 17L-15-9 0 17ZM7 18L22-4 36 18Z" /><path d="M-39 26H43" /></g>
                <g transform="translate(694 166)"><path d="M-30 14V-8L0-27 30-8V14M-19 14V-4L0-16 19-4V14" /></g>
                <g transform="translate(450 222)"><rect x="-23" y="-12" width="19" height="19" /><rect x="9" y="-10" width="17" height="17" /><path d="M-45 17H45M-35 12l9 10M-5 12l9 10M25 12l9 10" /></g>
                <g transform="translate(450 72)"><rect x="-20" y="-12" width="40" height="20" /><path d="M-44 14H44M-34 9l10 10M-8 9L2 19M18 9l10 10" /></g>
              </g>

              <g className="cordon-obstacles" aria-hidden="true">
                <path d="M130 574L150 487 242 455" />
                <path d="M718 491L809 472 826 556" />
                <path d="M392 464L440 475 456 430" />
              </g>

              <g className="cordon-local-routes">
                {CORDON_ROUTES.map((route) => {
                  const highlighted = (route.from === active?.nodeId && reachable.has(route.to)) || (route.to === active?.nodeId && reachable.has(route.from));
                  return (
                    <path
                      key={`${route.from}-${route.to}`}
                      d={route.path}
                      className={`${ROUTE_CLASS[route.kind]} ${highlighted ? "reachable" : ""}`}
                    >
                      <title>{route.kind} · {route.minutes} мин.</title>
                    </path>
                  );
                })}
              </g>

              <g className="cordon-points">
                {CORDON_POINTS.map((point) => {
                  const node = sectorNodes.find((item) => item.id === point.id);
                  if (!node) return null;
                  const faction = node.owner ? FACTIONS[node.owner] : null;
                  const selected = node.id === selectedNode.id;
                  const canReach = reachable.has(node.id);
                  return (
                    <g
                      key={node.id}
                      className={`cordon-point ${selected ? "selected" : ""} ${canReach ? "reachable" : ""}`}
                      transform={`translate(${point.x} ${point.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.name}, ${faction?.name ?? "нейтральная"}`}
                      onClick={() => selectPoint(node.id)}
                      onKeyDown={(event) => event.key === "Enter" && selectPoint(node.id)}
                    >
                      <circle className="cordon-point-hit" r="28" />
                      {node.capture > 0 && <circle className="cordon-capture-ring" r="23" pathLength="100" strokeDasharray={`${node.capture * 100} 100`} style={{ stroke: FACTIONS[node.captureFaction!].color }} />}
                      {canReach && <circle className="cordon-reachable-ring" r="24" />}
                      <circle className="cordon-point-ring" r={selected ? 20 : 16} style={{ stroke: faction?.color ?? "#8c927f" }} />
                      <circle className="cordon-point-core" r={node.type === "base" ? 10 : 7} style={{ fill: faction?.color ?? "#6d7164" }} />
                      {node.type === "base" && <rect x="-4" y="-4" width="8" height="8" className="cordon-point-mark" />}
                      {node.type === "shelter" && <path d="M-5 4V-1L0-6 5-1V4Z" className="cordon-point-mark" />}
                    </g>
                  );
                })}
              </g>

              <g className="cordon-labels" aria-hidden="true">
                {CORDON_POINTS.map((point) => {
                  const node = sectorNodes.find((item) => item.id === point.id);
                  if (!node) return null;
                  return <text key={point.id} x={point.labelX} y={point.labelY} textAnchor={point.anchor}>{node.name}</text>;
                })}
              </g>

              <g className="cordon-squads" filter="url(#cordonTokenShadow)">
                {sectorSquads.map((squad) => {
                  const point = squadPoint(squad);
                  const offset = squadOffset(squad.id);
                  const faction = FACTIONS[squad.faction];
                  const selected = squad.id === game.selectedSquadId;
                  return (
                    <g
                      key={squad.id}
                      className={`cordon-squad ${selected ? "selected" : ""}`}
                      transform={`translate(${point.x + offset.x} ${point.y + offset.y})`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setGame((current) => current ? { ...current, selectedSquadId: squad.id, selectedNodeId: squad.nodeId } : current);
                      }}
                    >
                      <circle r={selected ? 13 : 10} className="cordon-squad-ring" style={{ stroke: faction.color }} />
                      <circle r="7" className="cordon-squad-core" style={{ fill: faction.color }} />
                      <text y="3" textAnchor="middle">{faction.short}</text>
                      <rect x="-10" y="13" width="20" height="3" className="cordon-squad-hp-bg" />
                      <rect x="-10" y="13" width={20 * (squad.strength / squad.maxStrength)} height="3" className="cordon-squad-hp" />
                    </g>
                  );
                })}
              </g>

              <g className="cordon-map-notes" aria-hidden="true">
                <text x="70" y="120">СОСНОВЫЙ ЛЕС</text>
                <text x="744" y="95">ВОСТОЧНЫЙ ЛЕС</text>
                <text x="70" y="586">ЮЖНАЯ ГРАНИЦА</text>
                <text x="520" y="205">ЖЕЛЕЗНОДОРОЖНАЯ НАСЫПЬ</text>
                <text x="486" y="388">СТАРОЕ ШОССЕ</text>
              </g>
            </svg>
            <div className="sector-layer-controls" aria-label="Слои карты">
              <button type="button" className={showControl ? "active" : ""} aria-pressed={showControl} onClick={() => setShowControl((value) => !value)}>ВЛИЯНИЕ</button>
              <button type="button" className={showGrid ? "active" : ""} aria-pressed={showGrid} onClick={() => setShowGrid((value) => !value)}>СЕТКА</button>
            </div>
            <div className="sector-map-legend" aria-label="Условные обозначения">
              <span><i className="road" />шоссе</span>
              <span><i className="dirt" />грунтовка</span>
              <span><i className="trail" />тропа</span>
              <span><i className="forest" />лес</span>
            </div>
            <div className="sector-map-scale">0&nbsp;&nbsp;&nbsp;100&nbsp;&nbsp;&nbsp;200 м</div>
            <div className="sector-map-north"><b>С</b><i /></div>
          </div>

          <aside className="sector-map-sidebar">
            <span className="eyebrow">ВЫБРАННАЯ ТОЧКА</span>
            <h3>{selectedNode.name}</h3>
            <div className="sector-point-owner">
              <i style={{ background: owner?.color ?? "#747b6e" }} />
              <span>{owner?.name ?? "Нейтральная территория"}</span>
              <b>+{selectedNode.income} ₽</b>
            </div>
            <div className="sector-point-type">{TYPE_LABEL[selectedNode.type]}</div>
            <p>{visual.description}</p>
            <div className="sector-value"><small>ТАКТИЧЕСКОЕ ЗНАЧЕНИЕ</small><b>{visual.tacticalValue}</b></div>

            <div className="terrain-effect">
              <div className="terrain-effect-heading">
                <span>ЭФФЕКТ ОБОРОНЯЮЩЕЙСЯ СТОРОНЫ</span>
                <b>{owner ? "АКТИВЕН" : "НЕЙТРАЛЬНО"}</b>
              </div>
              <div className="terrain-effect-values">
                <span><small>ЗАЩИТА</small><b>−{Math.round(visual.defenseBonus * 100)}% урона</b></span>
                <span><small>ОГНЕВОЙ ОБЗОР</small><b>+{Math.round(visual.attackBonus * 100)}% атаки</b></span>
              </div>
              <p>Преимущество получает группировка, контролирующая точку. Ручной приказ занять укрытие может усилить защиту.</p>
            </div>

            <div className="sector-point-stats">
              <span><small>КВАДРАТ</small><b>{visual.grid}</b></span>
              <span><small>УКРЫТИЕ</small><b>{visual.cover}%</b></span>
              <span><small>МЕСТНОСТЬ</small><b>{visual.terrain}</b></span>
              <span><small>ОБЗОР</small><b>{visual.sight}</b></span>
              <span><small>РИСК</small><b data-threat={visual.danger}>{visual.danger}</b></span>
              <span><small>ЗАХВАТ</small><b>≈ {Math.round(22 * visual.captureFactor)} мин.</b></span>
            </div>

            <h4>Переходы с точки</h4>
            <div className="sector-connections">
              {connections.map(({ node: linked, route }) => (
                <button key={linked.id} type="button" onClick={() => selectPoint(linked.id)}>
                  <span><b>{linked.name}</b><small>{route.kind}</small></span>
                  <em>{route.minutes} мин.</em>
                </button>
              ))}
            </div>

            <h4>Силы на точке</h4>
            <div className="sector-roster compact-roster">
              {squadsAtPoint.length === 0 ? <div className="empty-state">Сигналов отрядов нет.</div> : squadsAtPoint.map((squad) => (
                <button
                  type="button"
                  key={squad.id}
                  className={`mini-squad ${squad.id === game.selectedSquadId ? "active" : ""}`}
                  onClick={() => setGame((current) => current ? { ...current, selectedSquadId: squad.id } : current)}
                >
                  <span className="sector-roster-token" style={{ background: FACTIONS[squad.faction].color }}>{FACTIONS[squad.faction].short}</span>
                  <span><b>{squad.name}</b><small>{squad.homeGarrison ? "Гарнизон" : squad.rank} · {STATUS_LABEL[squad.status]}</small></span>
                  <em>{getSquadStrengthPercent(squad)}%</em>
                </button>
              ))}
            </div>

            {active ? (
              <div className="sector-active-order">
                <small>АКТИВНЫЙ ОТРЯД</small>
                <b>{active.name} · {active.rank}</b>
                <p>{active.homeGarrison ? "Стационарный гарнизон удерживает эту точку." : active.status === "combat" ? "Отход доступен только через команду на боевом планшете." : active.status === "moving" ? `Переход выполнен на ${Math.round(active.travel * 100)}%.` : "Соседние доступные точки подсвечены. Нажмите одну из них, чтобы отдать приказ."}</p>
              </div>
            ) : <div className="empty-state">В секторе нет вашего отряда.</div>}

            {squadsAtPoint.length > 0 && (
              <button
                className="primary-action compact"
                type="button"
                onClick={() => setGame((current) => current ? { ...current, tacticalNodeId: selectedNode.id, tacticalTargetId: null } : current)}
              >
                ОТКРЫТЬ БОЕВОЙ ПЛАНШЕТ
              </button>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
