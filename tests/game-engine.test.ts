import assert from "node:assert/strict";
import test from "node:test";
import {
  FACTIONS,
  FACTION_CULTURES,
  FACTION_PROFILES,
  HIRE_RANKS,
  MUTANT_LABELS,
  PLAYABLE_FACTIONS,
  acceptContract,
  buyResearch,
  buyStrategicReserve,
  changeDiplomacy,
  createGame,
  diplomaticAction,
  getBilateralDiplomacy,
  getCombatProfile,
  getDiplomacyTerms,
  getEconomySummary,
  getContentItemSaleValue,
  getFactionCondition,
  getFactionRankLabel,
  getFactionRecruitmentAssessment,
  getFieldSupplyPrice,
  getDeceptionTargets,
  getFactionBalanceSummary,
  getActiveFieldDealsForSquad,
  getHireCost,
  getRecruitCandidates,
  getRelation,
  getReinforcementCost,
  getStrategicInvestmentCost,
  getSquadArchetype,
  getSquadCurrentSectorId,
  getSquadIntel,
  getSquadEquipmentEffects,
  getSquadMarkerIntel,
  getSquadStrengthPercent,
  hireSquad,
  hireOperative,
  interactWithSquad,
  issueLocationApproach,
  issueMove,
  issueOperativeOrder,
  issueSectorMove,
  isPlayerControlledSquad,
  isSquadNodeKnown,
  equipSquadItem,
  migrateGameState,
  negotiateContract,
  payBanditTribute,
  respondDiplomaticOffer,
  reinforceSquad,
  sellTrophies,
  sellContentItem,
  startDeceptionPlot,
  springDeceptionAmbush,
  setFormation,
  supplySquadFromStash,
  squadsAreHostile,
  tacticalAction,
  talkToSquad,
  tickGame,
  upgradeSquadGear,
  type GameState,
} from "../app/game-engine";
import { ZONE_ITEMS, getLocationContent } from "../app/zone-content";
import { NODE_INTEL, ZONE_SECTORS } from "../app/zone-map-data";
import { CORDON_ROUTES, getCordonRoute } from "../app/cordon-sector-data";
import {
  EXTRA_SECTOR_NODES,
  SECTOR_MAPS,
  getSectorRoute,
  getSectorRoutes,
  getTacticalLayout,
} from "../app/sector-map-registry";

test("каждая группировка имеет собственный цвет, Долг красный, Свобода зелёная, Одиночки жёлтые", () => {
  const colors = PLAYABLE_FACTIONS.map((id) => FACTIONS[id].color);
  assert.equal(new Set(colors).size, colors.length);
  assert.match(FACTIONS.duty.color, /dc3f42/i);
  assert.match(FACTIONS.freedom.color, /59b65f/i);
  assert.match(FACTIONS.stalkers.color, /d8bb4d/i);
});

test("режим отряда начинает игру ровно тремя бедными новичками на Кордоне", () => {
  const state = createGame("stalkers", "squad", null);
  const squad = state.squads.find((item) => item.id === state.playerSquadId)!;
  assert.equal(state.campaignMode, "squad");
  assert.equal(state.squadAllegiance, null);
  assert.equal(squad.nodeId, "cordon");
  assert.equal(squad.fighters, 3);
  assert.equal(squad.maxFighters, 3);
  assert.equal(squad.weaponId, "makarov");
  assert.equal(squad.armorId, "leather_jacket");
  assert.equal(state.rubles, 1800);
  assert.equal(state.operatives.length, 3);
  assert.equal(new Set(state.operatives.map((operative) => operative.id)).size, 3);
  assert.ok(state.operatives.every((operative) => operative.squadId === squad.id && operative.health > 0));
});

test("три бойца — только старт: отряд нанимает людей четырёх уровней без жёсткого лимита", () => {
  let state = createGame("stalkers", "squad", null);
  const startingCombatPower = state.squads.find((squad) => squad.id === state.playerSquadId)!.maxStrength;
  const candidates = getRecruitCandidates(state);
  assert.deepEqual(candidates.map((candidate) => candidate.tier), ["rookie", "regular", "veteran", "ace"]);
  assert.ok(candidates[0].cost < candidates[1].cost && candidates[1].cost < candidates[2].cost && candidates[2].cost < candidates[3].cost);
  assert.ok(candidates[0].experience < candidates[3].experience);
  state = { ...state, rubles: 100_000 };
  for (const candidate of candidates) state = hireOperative(state, candidate.tier);
  assert.equal(state.operatives.length, 7);
  assert.equal(state.squads.find((squad) => squad.id === state.playerSquadId)?.fighters, 7);
  assert.ok(state.squads.find((squad) => squad.id === state.playerSquadId)!.maxStrength > startingCombatPower);
  assert.ok(state.operatives.some((operative) => operative.weaponId === "vintorez" && operative.experience >= 60));
});

test("без денег пополнение не создаётся, а приказ двигает конкретных людей свободно по локации", () => {
  let state = createGame("stalkers", "squad", null);
  const blocked = hireOperative({ ...state, rubles: 0 }, "rookie");
  assert.equal(blocked.operatives.length, 3);
  const selected = state.operatives.slice(0, 2);
  const start = selected.map((operative) => operative.localX);
  const unselectedStart = state.operatives[2].localX;
  state = issueOperativeOrder(state, selected.map((operative) => operative.id), "move", { x: 82, y: 24 });
  assert.ok(state.operatives.filter((operative) => selected.some((item) => item.id === operative.id)).every((operative) => operative.order === "move" && operative.destinationX !== null));
  for (let tick = 0; tick < 8; tick += 1) state = tickGame(state);
  assert.ok(state.operatives.find((operative) => operative.id === selected[0].id)!.localX > start[0]);
  assert.ok(state.operatives.find((operative) => operative.id === selected[1].id)!.localX > start[1]);
  assert.equal(state.operatives[2].localX, unselectedStart);
});

test("характер влияет на приказ: трусливый дешёвый новичок может отказаться лезть в аномалию", () => {
  let state = createGame("stalkers", "squad", null);
  state = { ...state, rubles: 1000 };
  state = hireOperative(state, "rookie");
  const rookie = state.operatives.at(-1)!;
  rookie.morale = 30;
  rookie.trust = 35;
  const ordered = issueOperativeOrder(state, [rookie.id], "search", { x: 46, y: 25 }, "Аномальное пятно");
  const after = ordered.operatives.find((operative) => operative.id === rookie.id)!;
  assert.equal(after.order, "idle");
  assert.equal(after.destinationX, null);
  assert.ok(after.trust < 35);
});

test("потеря отряда убивает конкретного бойца, после чего освободившееся место можно пополнить", () => {
  let state = createGame("stalkers", "squad", null);
  const player = state.squads.find((squad) => squad.id === state.playerSquadId)!;
  player.strength = 4;
  state.nodes.find((node) => node.id === player.nodeId)!.type = "anomaly";
  state = { ...state, speed: 1, emissionWarned: true, nextEmissionAt: state.simMinute };
  state = tickGame(state);
  assert.ok(state.operatives.some((operative) => operative.condition === "dead"));
  const livingBefore = state.operatives.filter((operative) => operative.condition !== "dead" && operative.condition !== "left").length;
  const safe = state.nodes.find((node) => node.id === player.nodeId)!;
  safe.type = "base";
  const rescuedSquad = state.squads.find((squad) => squad.id === state.playerSquadId)!;
  rescuedSquad.status = "idle";
  state = { ...state, rubles: 10_000, defeat: false };
  state = hireOperative(state, "regular");
  assert.equal(state.operatives.filter((operative) => operative.condition !== "dead" && operative.condition !== "left").length, livingBefore + 1);
});

test("в режиме отряда игрок управляет только своей тройкой, а не всей дружественной фракцией", () => {
  const state = createGame("bandits", "squad", "bandits");
  const player = state.squads.find((item) => item.id === state.playerSquadId)!;
  const autonomous = state.squads.find((item) => item.faction === "bandits" && item.unitKind === "combat" && item.id !== player.id && !item.homeGarrison)!;
  assert.equal(isPlayerControlledSquad(state, player), true);
  assert.equal(isPlayerControlledSquad(state, autonomous), false);
  const playerDestination = state.nodes.find((node) => node.id === player.nodeId)!.links[0];
  const aiDestination = state.nodes.find((node) => node.id === autonomous.nodeId)!.links[0];
  assert.notEqual(issueMove(state, player.id, playerDestination), state);
  assert.equal(issueMove(state, autonomous.id, aiDestination), state);
});

test("единая карта проводит мирный вход, запрос прохода, штурм и засаду через реальные правила мира", () => {
  const base = createGame("stalkers", "squad", null);
  const player = base.squads.find((squad) => squad.id === base.playerSquadId)!;

  const peaceful = issueLocationApproach(base, player.id, "machine_yard", "request_access");
  assert.equal(peaceful.squads.find((squad) => squad.id === player.id)?.status, "moving");
  assert.equal(peaceful.squads.find((squad) => squad.id === player.id)?.approachMode, "request_access");

  const ambush = issueLocationApproach(base, player.id, "dark_valley", "ambush");
  assert.equal(ambush.squads.find((squad) => squad.id === player.id)?.destinationId, "dark_valley");
  assert.equal(ambush.squads.find((squad) => squad.id === player.id)?.approachMode, "ambush");
  assert.equal(getRelation(ambush, player.faction, "bandits"), "war");

  const blocked = issueLocationApproach(base, player.id, "pripyat", "peaceful");
  assert.equal(blocked, base);
});

test("нейтральную точку можно занять с карты, а контроль реально меняется после захвата", () => {
  let state = createGame("stalkers", "squad", null);
  const playerId = state.playerSquadId!;
  state = issueLocationApproach(state, playerId, "old_church", "occupy");
  state = {
    ...state,
    speed: 12,
    nextEmissionAt: Number.MAX_SAFE_INTEGER,
    nextAiAt: Number.MAX_SAFE_INTEGER,
    nextDirectiveAt: Number.MAX_SAFE_INTEGER,
    nextWorldEventAt: Number.MAX_SAFE_INTEGER,
  };
  for (let tick = 0; tick < 30 && state.nodes.find((node) => node.id === "old_church")?.owner !== state.playerFaction; tick += 1) state = tickGame(state);
  assert.equal(state.nodes.find((node) => node.id === "old_church")?.owner, state.playerFaction);
  assert.equal(state.squads.find((squad) => squad.id === playerId)?.approachMode, null);
});

test("клик по чужому отряду может привести к разговору или немедленной засаде", () => {
  const base = createGame("stalkers", "squad", null);
  const player = base.squads.find((squad) => squad.id === base.playerSquadId)!;
  const target = base.squads.find((squad) => squad.faction === "clear_sky" && squad.commander && squad.status !== "dead")!;
  target.nodeId = player.nodeId;
  target.destinationId = null;
  target.status = "idle";

  const talked = interactWithSquad(base, player.id, target.id, "talk");
  assert.notEqual(talked, base);
  assert.ok(talked.log.some((entry) => entry.text.includes("Разговор с командиром")));

  const ambushed = interactWithSquad(base, player.id, target.id, "ambush");
  assert.equal(ambushed.squads.find((squad) => squad.id === player.id)?.status, "combat");
  assert.ok((ambushed.squads.find((squad) => squad.id === player.id)?.cover ?? 0) >= .62);
  assert.ok((ambushed.squads.find((squad) => squad.id === target.id)?.suppression ?? 0) >= 38);
});

test("туман войны показывает отряду текущий сектор, а дальние районы остаются неизвестными", () => {
  const state = createGame("stalkers", "squad", null);
  assert.equal(getSquadCurrentSectorId(state), "cordon");
  assert.ok(isSquadNodeKnown(state, "cordon"));
  assert.ok(isSquadNodeKnown(state, "elevator"));
  assert.equal(isSquadNodeKnown(state, "radar"), false);
  assert.ok(Object.values(state.squadKnowledge.knownSquads).every((intel) => state.nodes.find((node) => node.id === intel.nodeId)?.sectorId === "cordon"));
});

test("заказ нельзя принять из КПК: его выдаёт конкретный командир после личного разговора", () => {
  let state = createGame("stalkers", "squad", null);
  const contract = state.contracts.find((item) => item.giverSquadId)!;
  const player = state.squads.find((squad) => squad.id === state.playerSquadId)!;
  const giver = state.squads.find((squad) => squad.id === contract.giverSquadId)!;
  giver.nodeId = player.nodeId;
  giver.status = "idle";
  giver.destinationId = null;

  assert.equal(acceptContract(state, contract.id), state);
  state = talkToSquad(state, giver.id, "work");
  assert.ok(state.contracts.find((item) => item.id === contract.id)?.briefedAt !== null);
  assert.ok(state.squadKnowledge.conversations.some((entry) => entry.targetSquadId === giver.id && entry.topic === "work"));
  assert.ok(getFieldSupplyPrice(state, giver.id) > 0);
  state = negotiateContract(state, contract.id, "accept");
  assert.equal(state.contracts.find((item) => item.id === contract.id)?.status, "active");
});

test("разговор об угрозах создаёт настоящую разведывательную отметку в КПК", () => {
  let state = createGame("stalkers", "squad", null);
  const player = state.squads.find((squad) => squad.id === state.playerSquadId)!;
  const contact = state.squads.find((squad) => squad.id !== player.id && squad.faction !== "mutants" && squad.commander)!;
  contact.nodeId = player.nodeId;
  contact.status = "idle";
  const before = state.squadKnowledge.reports.length;
  state = talkToSquad(state, contact.id, "danger");
  assert.ok(state.squadKnowledge.reports.length > before);
  assert.equal(state.squadKnowledge.reports.at(-1)?.kind, "danger");
});

test("пятнадцатиминутный сеанс за отряд сохраняет карту, знания, контракты и состав в допустимом состоянии", () => {
  let state = createGame("bandits", "squad", null);
  state = { ...state, nextEmissionAt: Number.MAX_SAFE_INTEGER };
  const ticksForFifteenRealMinutes = Math.ceil((15 * 60) / .7);
  for (let tick = 0; tick < ticksForFifteenRealMinutes; tick += 1) state = tickGame({ ...state, speed: 1 });
  const player = state.squads.find((squad) => squad.id === state.playerSquadId)!;
  assert.ok(Number.isFinite(state.rubles) && state.rubles >= 0);
  assert.ok(player.fighters >= 0 && player.fighters <= state.operatives.length);
  assert.ok(state.squadKnowledge.visitedSectorIds.length >= 1);
  assert.ok(state.squadKnowledge.knownNodeIds.every((id) => state.nodes.some((node) => node.id === id)));
  assert.ok(state.contracts.every((contract) => Number.isFinite(contract.reward) && contract.reward > 0));
});

test("одиночный отряд не получает доход всей группировки", () => {
  let state = createGame("stalkers", "squad", null);
  const before = state.rubles;
  state = { ...state, speed: 1, nextIncomeAt: state.simMinute };
  state = tickGame(state);
  assert.equal(state.rubles, before);
});

test("старое сохранение автоматически остаётся кампанией за группировку", () => {
  const legacy = createGame("duty") as GameState & { campaignMode?: never; squadAllegiance?: never; playerSquadId?: never };
  delete legacy.campaignMode;
  delete legacy.squadAllegiance;
  delete legacy.playerSquadId;
  const restored = migrateGameState(legacy as GameState);
  assert.equal(restored.campaignMode, "faction");
  assert.equal(restored.squadAllegiance, "duty");
  assert.equal(restored.playerSquadId, null);
});

test("старое сохранение режима отряда получает живую стартовую тройку", () => {
  const legacy = createGame("stalkers", "squad", null) as GameState & { operatives?: never };
  delete legacy.operatives;
  const restored = migrateGameState(legacy as GameState);
  assert.equal(restored.operatives.length, 3);
  assert.ok(restored.operatives.every((operative) => operative.squadId === restored.playerSquadId));
});

test("у всех группировок есть уникальная доктрина и три реальных состава войск", () => {
  const doctrineNames = new Set<string>();
  const archetypeIds = new Set<string>();
  for (const faction of PLAYABLE_FACTIONS) {
    const profile = FACTION_PROFILES[faction];
    doctrineNames.add(profile.doctrine);
    assert.equal(profile.effects.length, 3);
    assert.ok(profile.directives.length >= 4);
    assert.ok(profile.combat.attack > 0 && profile.combat.speed > 0 && profile.economy.income > 0);
    for (const rank of HIRE_RANKS) {
      const unit = profile.roster[rank];
      assert.ok(unit.id && unit.name && unit.description, `${faction}/${rank}: состав не описан`);
      assert.ok(!archetypeIds.has(unit.id), `повторяется состав ${unit.id}`);
      archetypeIds.add(unit.id);
      assert.ok(unit.fighters >= 3 && unit.attack > 0 && unit.ammo > 0);
    }
  }
  assert.equal(doctrineNames.size, PLAYABLE_FACTIONS.length);
  assert.equal(archetypeIds.size, PLAYABLE_FACTIONS.length * HIRE_RANKS.length);
});

test("найм создаёт именно состав выбранной группировки с его характеристиками", () => {
  for (const faction of PLAYABLE_FACTIONS) {
    let state = createGame(faction);
    state.rubles = 1_000_000;
    state.factionFunds[faction] = 1_000_000;
    state.research.logistics = 3;
    state.research.weapons = 2;
    for (const rank of HIRE_RANKS) {
      state = hireSquad(state, rank);
      const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
      const expected = FACTION_PROFILES[faction].roster[rank];
      assert.equal(squad.archetypeId, expected.id);
      assert.equal(getSquadArchetype(squad)?.name, expected.name);
      assert.equal(squad.formation, expected.formation);
      assert.equal(squad.fighters, expected.fighters);
      assert.equal(squad.attack, expected.attack);
      assert.equal(squad.maxAmmo, expected.ammo);
    }
  }
  assert.ok(getHireCost(createGame("bandits"), "Новички") < getHireCost(createGame("duty"), "Новички"));
  assert.ok(getHireCost(createGame("mercenaries"), "Ветераны") > getHireCost(createGame("duty"), "Ветераны"));
});

test("стационарные гарнизоны не занимают лимит мобильных отрядов", () => {
  let state = createGame("bandits");
  state.rubles = 1_000_000;
  state.factionFunds.bandits = 1_000_000;
  const mobileCount = () => state.squads.filter((squad) => squad.faction === "bandits" && squad.unitKind === "combat" && squad.status !== "dead" && !squad.homeGarrison).length;
  const garrisonCount = state.squads.filter((squad) => squad.faction === "bandits" && squad.homeGarrison && squad.status !== "dead").length;
  assert.equal(mobileCount(), 2);
  assert.ok(garrisonCount > 0);
  state = hireSquad(state, "Новички");
  state = hireSquad(state, "Новички");
  assert.equal(mobileCount(), 4);
  const blocked = hireSquad(state, "Новички");
  assert.equal(blocked, state);
});

test("процент боеспособности нормализуется относительно максимума", () => {
  const squad = createGame("bandits").squads.find((item) => item.faction === "bandits" && item.unitKind === "combat")!;
  squad.strength = squad.maxStrength;
  assert.equal(getSquadStrengthPercent(squad), 100);
  squad.strength = squad.maxStrength / 2;
  assert.equal(getSquadStrengthPercent(squad), 50);
  squad.strength = squad.maxStrength * 2;
  assert.equal(getSquadStrengthPercent(squad), 100);
});

test("доктрина меняет территориальную экономику и союз открывает торговый доход", () => {
  const normalize = (faction: "duty" | "renegades") => {
    const state = createGame(faction);
    state.nodes.forEach((node) => { node.owner = faction; });
    state.squads = [];
    return state;
  };
  const duty = normalize("duty");
  const renegades = normalize("renegades");
  assert.equal(getEconomySummary(duty).baseGross, getEconomySummary(renegades).baseGross);
  assert.ok(getEconomySummary(duty).gross > getEconomySummary(renegades).gross);
  const beforeAlliance = getEconomySummary(duty).gross;
  duty.relations[["duty", "freedom"].sort().join(":")] = "alliance";
  const allied = getEconomySummary(duty);
  assert.ok(allied.allianceTrade > 0);
  assert.ok(allied.gross > beforeAlliance);
});

test("точность, скорость и защита от Выброса берутся из доктрины, а не из подписи", () => {
  let state = createGame("duty");
  const duty = state.squads.find((item) => item.faction === "duty" && item.unitKind === "combat")!;
  const freedom = state.squads.find((item) => item.faction === "freedom" && item.unitKind === "combat")!;
  const target = state.squads.find((item) => item.faction === "monolith" && item.unitKind === "combat")!;
  Object.assign(duty, { nodeId: "garbage", tacticalX: 18, tacticalY: 45, formation: "mixed", rank: "Опытные", weaponTier: 1, stamina: 100, suppression: 0 });
  Object.assign(freedom, { nodeId: "garbage", tacticalX: 18, tacticalY: 45, formation: "mixed", rank: "Опытные", weaponTier: 1, stamina: 100, suppression: 0 });
  Object.assign(target, { nodeId: "garbage", tacticalX: 78, tacticalY: 45, cover: 0 });
  assert.ok(getCombatProfile(state, freedom, target).hitChance > getCombatProfile(state, duty, target).hitChance);

  state.squads = [
    { ...duty, status: "moving", nodeId: "garbage", destinationId: "cordon", travel: 0, formation: "mixed" },
    { ...freedom, status: "moving", nodeId: "garbage", destinationId: "cordon", travel: 0, formation: "mixed" },
  ];
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.ok(state.squads.find((item) => item.faction === "freedom")!.travel > state.squads.find((item) => item.faction === "duty")!.travel);

  const emission = createGame("duty");
  const ecologist = emission.squads.find((item) => item.faction === "ecologists" && item.unitKind === "combat")!;
  const renegade = emission.squads.find((item) => item.faction === "renegades" && item.unitKind === "combat")!;
  emission.squads = [{ ...ecologist, nodeId: "garbage", status: "idle" }, { ...renegade, nodeId: "garbage", status: "idle" }];
  emission.speed = 1;
  emission.emissionWarned = true;
  emission.nextEmissionAt = emission.simMinute + 1;
  emission.nextAiAt = Number.MAX_SAFE_INTEGER;
  const ecoBefore = emission.squads[0].strength;
  const renegadeBefore = emission.squads[1].strength;
  const after = tickGame(emission);
  const ecoLoss = ecoBefore - after.squads[0].strength;
  const renegadeLoss = renegadeBefore - after.squads[1].strength;
  assert.ok(ecoLoss < renegadeLoss);
});

test("отряд может перейти только на связанную точку", () => {
  const state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  const invalid = issueMove(state, squad.id, "pripyat");
  assert.equal(invalid, state);
  const valid = issueMove(state, squad.id, "garbage");
  assert.equal(valid.squads.find((item) => item.id === squad.id)?.status, "moving");
  assert.equal(valid.squads.find((item) => item.id === squad.id)?.destinationId, "garbage");
});

test("обычный маршрут не позволяет гарнизону двигаться или боевому отряду сбежать из боя", () => {
  const state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  squad.status = "combat";
  assert.equal(issueMove(state, squad.id, "garbage"), state);
  const localDestination = state.nodes.find((node) => node.id === squad.nodeId)?.localLinks?.[0];
  assert.ok(localDestination);
  assert.equal(issueSectorMove(state, squad.id, localDestination!), state);

  const bandits = createGame("bandits");
  const garrison = bandits.squads.find((item) => item.faction === "bandits" && item.homeGarrison)!;
  const node = bandits.nodes.find((item) => item.id === garrison.nodeId)!;
  const destination = node.localLinks?.[0] ?? node.links[0];
  assert.ok(destination);
  const ordered = node.localLinks?.includes(destination)
    ? issueSectorMove(bandits, garrison.id, destination)
    : issueMove(bandits, garrison.id, destination);
  assert.equal(ordered, bandits);
});

test("расширенная карта содержит полноценную связанную сеть и разведданные", () => {
  const state = createGame("stalkers");
  assert.ok(state.nodes.length >= 30);
  assert.equal(new Set(state.nodes.map((node) => node.id)).size, state.nodes.length);

  for (const node of state.nodes) {
    assert.ok(NODE_INTEL[node.id], `нет разведданных для ${node.id}`);
    for (const linkedId of node.links) {
      const linked = state.nodes.find((item) => item.id === linkedId);
      assert.ok(linked, `переход ${node.id} ведёт в отсутствующую точку ${linkedId}`);
      assert.ok(linked.links.includes(node.id), `переход ${node.id} ↔ ${linkedId} не двусторонний`);
    }
  }

  const sectorNodes = ZONE_SECTORS.flatMap((sector) => sector.nodeIds);
  const globalNodes = state.nodes.filter((node) => node.mapLevel !== "sector").map((node) => node.id);
  assert.equal(new Set(sectorNodes).size, sectorNodes.length);
  assert.deepEqual(new Set(sectorNodes), new Set(globalNodes));
});

test("внутренняя карта Кордона содержит восемь точек и отдельную связанную сеть", () => {
  const state = createGame("stalkers");
  const cordonNodes = state.nodes.filter((node) => node.sectorId === "cordon");
  assert.equal(cordonNodes.length, 8);

  for (const node of cordonNodes) {
    for (const linkedId of node.localLinks ?? []) {
      const linked = cordonNodes.find((item) => item.id === linkedId);
      assert.ok(linked, `локальный переход ${node.id} ведёт в отсутствующую точку ${linkedId}`);
      assert.ok(linked.localLinks?.includes(node.id), `локальный переход ${node.id} ↔ ${linkedId} не двусторонний`);
      assert.ok(getCordonRoute(node.id, linkedId), `для перехода ${node.id} ↔ ${linkedId} нет маршрута на карте`);
    }
  }
  assert.equal(CORDON_ROUTES.length, 10);
  assert.ok(CORDON_ROUTES.every((route) => route.minutes >= 10 && route.minutes <= 30));

  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  const valid = issueSectorMove(state, squad.id, "farmstead");
  assert.equal(valid.squads.find((item) => item.id === squad.id)?.status, "moving");
  assert.equal(valid.squads.find((item) => item.id === squad.id)?.destinationId, "farmstead");
  const advanced = tickGame(valid);
  assert.ok((advanced.squads.find((item) => item.id === squad.id)?.travel ?? 0) > 0.05);

  const invalid = issueSectorMove(state, squad.id, "north_outpost");
  assert.equal(invalid, state);
});

test("все четырнадцать секторов имеют полноценные внутренние карты", () => {
  const state = createGame("stalkers");
  const allPointIds = SECTOR_MAPS.flatMap((sector) => sector.points.map((point) => point.id));

  assert.equal(SECTOR_MAPS.length, 14);
  assert.equal(allPointIds.length, 86);
  assert.equal(new Set(allPointIds).size, allPointIds.length);
  assert.equal(EXTRA_SECTOR_NODES.length, 48);
  assert.equal(state.nodes.length, 93);

  for (const sector of SECTOR_MAPS) {
    assert.ok(sector.points.length >= 6, `${sector.name}: слишком мало локальных точек`);
    assert.ok(getSectorRoutes(sector.id).length >= 6, `${sector.name}: недостаточно маршрутов`);
    assert.ok(state.squads.some((squad) => sector.points.some((point) => point.id === squad.nodeId)), `${sector.name}: нет стартового гарнизона`);
    for (const point of sector.points) {
      const node = state.nodes.find((item) => item.id === point.id);
      assert.ok(node, `${sector.name}: точка ${point.id} отсутствует в симуляции`);
      assert.equal(node.sectorId, sector.id, `${point.id}: неверный сектор`);
      assert.deepEqual(new Set(node.localLinks), new Set(point.localLinks), `${point.id}: маршруты UI и симуляции расходятся`);
      for (const linkedId of point.localLinks) {
        const linked = sector.points.find((item) => item.id === linkedId);
        assert.ok(linked, `${point.id}: переход ведёт за пределы внутренней карты`);
        assert.ok(linked.localLinks.includes(point.id), `${point.id} ↔ ${linkedId}: переход не двусторонний`);
        assert.ok(getSectorRoute(point.id, linkedId), `${point.id} ↔ ${linkedId}: отсутствует картографический маршрут`);
      }
    }
  }
});

test("локальные приказы работают за пределами Кордона", () => {
  const state = createGame("duty");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  assert.equal(squad.nodeId, "bar");
  const moved = issueSectorMove(state, squad.id, "duty_checkpoint");
  const result = moved.squads.find((item) => item.id === squad.id)!;
  assert.equal(result.status, "moving");
  assert.equal(result.destinationId, "duty_checkpoint");
  assert.ok((getSectorRoute("bar", "duty_checkpoint")?.minutes ?? 0) > 0);
});

test("каждая локальная точка получает собственный тактический план", () => {
  const ids = SECTOR_MAPS.flatMap((sector) => sector.points.map((point) => point.id));
  const layouts = ids.map((id) => getTacticalLayout(id));
  assert.equal(new Set(layouts.map((layout) => JSON.stringify(layout))).size, ids.length);
  assert.ok(layouts.every((layout) => layout.covers.length === 3 && layout.roads.length === 2));
});

test("контролируемые точки действительно приносят доход", () => {
  const state = createGame("duty");
  state.speed = 12;
  state.nextIncomeAt = state.simMinute + 1;
  const before = state.rubles;
  const economy = getEconomySummary(state);
  assert.equal(economy.net, economy.gross - economy.upkeep);
  assert.ok(economy.net > 0);
  const next = tickGame(state);
  assert.ok(next.rubles > before);
  assert.ok(Math.abs(next.rubles - (before + economy.net)) <= 10, "изменение безопасности не должно резко ломать прогноз дохода");
  assert.ok(next.log.some((entry) => entry.text.includes("Экономика:")));
});

test("найм требует не только рубли, но и живой людской резерв", () => {
  let state = createGame("stalkers");
  state.rubles = 1_000_000;
  state.factionFunds.stalkers = 1_000_000;
  const recruit = FACTION_PROFILES.stalkers.roster["Новички"];
  const manpowerBefore = state.factionStrategy.stalkers.manpower;
  state = hireSquad(state, "Новички");
  assert.equal(state.factionStrategy.stalkers.manpower, manpowerBefore - recruit.fighters);
  state.factionStrategy.stalkers.manpower = 0;
  assert.equal(hireSquad(state, "Новички"), state);
});

test("размер армии определяется территорией, мобилизацией и логистикой", () => {
  const state = createGame("stalkers");
  const base = getFactionBalanceSummary(state);
  state.research.logistics = 2;
  const developed = getFactionBalanceSummary(state);
  assert.ok(developed.armyLimit >= base.armyLimit + 4);
  assert.ok(developed.administrativeCapacity > base.administrativeCapacity);
  assert.ok(base.manpowerCap > 0 && base.reserveTarget > 0);
});

test("игрок может превратить деньги в снабжение или срочный людской резерв", () => {
  let state = createGame("stalkers");
  state.rubles = 100_000;
  state.factionFunds.stalkers = 100_000;
  state.factionStrategy.stalkers.supply = 35;
  state.factionStrategy.stalkers.manpower = 6;
  const supplyCost = getStrategicInvestmentCost(state, "supply");
  state = buyStrategicReserve(state, "supply");
  assert.equal(state.rubles, 100_000 - supplyCost);
  assert.equal(state.factionStrategy.stalkers.supply, 53);
  const manpowerBefore = state.factionStrategy.stalkers.manpower;
  const wearinessBefore = state.factionStrategy.stalkers.warWeariness;
  state = buyStrategicReserve(state, "manpower");
  assert.ok(state.factionStrategy.stalkers.manpower > manpowerBefore);
  assert.equal(state.factionStrategy.stalkers.warWeariness, wearinessBefore + 3);
});

test("разрыв снабжения замедляет реальные маршруты отрядов", () => {
  const prepare = (supply: number) => {
    let state = createGame("stalkers");
    const squad = state.squads.find((item) => item.faction === "stalkers" && !item.homeGarrison)!;
    state = issueMove(state, squad.id, "garbage");
    state.factionStrategy.stalkers.supply = supply;
    state.speed = 12;
    state.nextAiAt = Number.MAX_SAFE_INTEGER;
    state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
    return tickGame(state).squads.find((item) => item.id === squad.id)!.travel;
  };
  assert.ok(prepare(100) > prepare(0));
});

test("контракт на артефакты принимает прогресс и выплачивает награду", () => {
  let state = createGame("stalkers");
  const offered = state.contracts.find((contract) => contract.type === "artifacts")!;
  state = acceptContract(state, offered.id);
  state.nodes.find((node) => node.id === "zaton")!.owner = "stalkers";
  state.speed = 12;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  const before = state.rubles;
  for (let index = 0; index < 18 && state.contracts.find((contract) => contract.id === offered.id)?.status !== "completed"; index += 1) state = tickGame(state);
  const completed = state.contracts.find((contract) => contract.id === offered.id)!;
  assert.equal(completed.status, "completed");
  assert.equal(completed.progress, completed.goal);
  assert.ok(state.rubles > before);
});

test("уничтоженный игроком противник оставляет трофеи", () => {
  let state = createGame("duty");
  const player = state.squads.find((squad) => squad.faction === "duty")!;
  const enemy = state.squads.find((squad) => squad.faction === "freedom")!;
  state.squads = [
    { ...player, nodeId: "bar", status: "idle", attack: 1000 },
    { ...enemy, nodeId: "bar", status: "idle", strength: 0.1 },
  ];
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.squads.find((squad) => squad.faction === "freedom")?.status, "dead");
  assert.ok(state.trophies.weapons > 0);
  assert.ok(state.trophies.supplies > 0);
});

test("трофеи продаются и используются для улучшения снаряжения", () => {
  const state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  squad.weaponTier = 0;
  state.trophies.weapons = 4;
  state.rubles = 50000;
  const upgraded = upgradeSquadGear(state, squad.id, "weapon");
  assert.equal(upgraded.squads.find((item) => item.id === squad.id)?.weaponTier, 1);
  assert.equal(upgraded.trophies.weapons, 3);
  const beforeSale = upgraded.rubles;
  const sold = sellTrophies(upgraded, "weapons");
  assert.equal(sold.trophies.weapons, 0);
  assert.ok(sold.rubles > beforeSale);
});

test("новые ветви исследований дают постоянное развитие", () => {
  let state = createGame("ecologists");
  state.rubles = 100000;
  state = buyResearch(state, "medicine");
  state = buyResearch(state, "recon");
  state = buyResearch(state, "trade");
  assert.equal(state.research.medicine, 1);
  assert.equal(state.research.recon, 1);
  assert.equal(state.research.trade, 1);
});

test("нейтральная точка захватывается живым отрядом", () => {
  let state = createGame("stalkers");
  const player = state.squads.find((item) => item.faction === "stalkers")!;
  state.squads = [{ ...player, nodeId: "old_church", status: "idle", destinationId: null }];
  state.speed = 12;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  for (let index = 0; index < 8 && state.nodes.find((node) => node.id === "old_church")?.owner !== "stalkers"; index += 1) {
    state = tickGame(state);
  }
  assert.equal(state.nodes.find((node) => node.id === "old_church")?.owner, "stalkers");
  assert.ok(state.nodes.find((node) => node.id === "old_church")!.security < 40);
  assert.ok(state.factionStrategy.stalkers.territoriesCaptured > 0);
});

test("недавно захваченная точка требует гарнизона и постепенно закрепляется", () => {
  let state = createGame("stalkers");
  const player = state.squads.find((item) => item.faction === "stalkers" && !item.homeGarrison)!;
  state.squads = [{ ...player, nodeId: "old_church", status: "idle", destinationId: null }];
  const point = state.nodes.find((node) => node.id === "old_church")!;
  point.owner = "stalkers";
  point.security = 20;
  const lowControlIncome = getEconomySummary(state).gross;
  state.speed = 12;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  for (let tick = 0; tick < 8; tick += 1) state = tickGame(state);
  assert.ok(state.nodes.find((node) => node.id === "old_church")!.security > 20);
  assert.ok(getEconomySummary(state).gross > lowControlIncome);
});

test("враждебные отряды на одной точке наносят друг другу урон", () => {
  let state = createGame("duty");
  const duty = state.squads.find((item) => item.faction === "duty")!;
  const freedom = state.squads.find((item) => item.faction === "freedom")!;
  state.squads = [
    { ...duty, nodeId: "garbage", status: "idle" },
    { ...freedom, nodeId: "garbage", status: "idle" },
  ];
  state.speed = 4;
  const before = state.squads.map((item) => item.strength);
  state = tickGame(state);
  assert.ok(state.squads.some((item, index) => item.strength < before[index]));
  assert.ok(state.squads.every((item) => item.status === "combat" || item.status === "dead"));
});

test("огневое решение учитывает дистанцию, роль, линию видимости, усталость и подавление", () => {
  const state = createGame("duty");
  const duty = state.squads.find((item) => item.faction === "duty")!;
  const freedom = state.squads.find((item) => item.faction === "freedom")!;
  state.squads = [
    { ...duty, nodeId: "checkpoint", tacticalX: 16, tacticalY: 18, formation: "sniper", stamina: 100, suppression: 0 },
    { ...freedom, nodeId: "checkpoint", tacticalX: 82, tacticalY: 78, cover: 0 },
  ];
  const fresh = getCombatProfile(state, state.squads[0], state.squads[1]);
  state.squads[0].stamina = 18;
  state.squads[0].suppression = 82;
  const exhausted = getCombatProfile(state, state.squads[0], state.squads[1]);
  assert.equal(fresh.role, "СНАЙПЕРСКАЯ ГРУППА");
  assert.ok(fresh.distance > 100);
  assert.equal(fresh.effectiveRange, 245 + (ZONE_ITEMS[state.squads[0].weaponId!].effects.range ?? 0));
  assert.ok(["clear", "partial", "blocked"].includes(fresh.lineOfSight));
  assert.ok(exhausted.hitChance < fresh.hitChance);
});

test("сближение меняет позицию и реальную дистанцию до цели", () => {
  let state = createGame("duty");
  const duty = state.squads.find((item) => item.faction === "duty")!;
  const freedom = state.squads.find((item) => item.faction === "freedom")!;
  state.squads = [
    { ...duty, nodeId: "garbage", tacticalX: 18, tacticalY: 50, stamina: 100 },
    { ...freedom, nodeId: "garbage", tacticalX: 82, tacticalY: 50 },
  ];
  state.selectedSquadId = duty.id;
  state.tacticalTargetId = freedom.id;
  const before = getCombatProfile(state, state.squads[0], state.squads[1]).distance;
  state = tacticalAction(state, "advance");
  const after = getCombatProfile(state, state.squads[0], state.squads[1]).distance;
  assert.ok(after < before);
  assert.equal(state.squads[0].stamina, 88);
  assert.equal(state.squads[0].cover, 0);
});

test("укрытие, магазин и смена построения работают как боевые ресурсы", () => {
  let state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  squad.tacticalX = 2;
  squad.tacticalY = 2;
  squad.suppression = 60;
  squad.magazine = 2;
  squad.ammo = 50;
  state = tacticalAction(state, "cover");
  const covered = state.squads.find((item) => item.id === squad.id)!;
  assert.equal(covered.cover, 0.42);
  assert.ok(covered.tacticalX !== 2 || covered.tacticalY !== 2);
  assert.ok(covered.suppression < 60);
  state = tacticalAction(state, "reload");
  const reloaded = state.squads.find((item) => item.id === squad.id)!;
  assert.equal(reloaded.magazine, reloaded.magazineSize);
  assert.ok(reloaded.ammo < 50);
  state = setFormation(state, squad.id, "sniper");
  const sniper = state.squads.find((item) => item.id === squad.id)!;
  assert.equal(sniper.magazineSize, ZONE_ITEMS[sniper.weaponId!].effects.magazine ?? 10);
  assert.ok(sniper.magazine <= sniper.magazineSize);
});

test("каждый человеческий отряд получает конкретное оружие и броню, влияющие на расчёты", () => {
  const state = createGame("stalkers");
  const humans = state.squads.filter((squad) => squad.faction !== "mutants");
  assert.ok(humans.every((squad) => squad.weaponId && ZONE_ITEMS[squad.weaponId].category === "weapon"));
  assert.ok(humans.every((squad) => squad.armorId && ZONE_ITEMS[squad.armorId].category === "armor"));
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  assert.ok(getSquadEquipmentEffects(squad).protection > 0);
  assert.ok(getSquadEquipmentEffects(squad).damage > 1);
});

test("арсенал на базе действительно переоснащает отряд и возвращает старый предмет", () => {
  let state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  const oldWeapon = squad.weaponId!;
  state.stash.gauss = 1;
  state = equipSquadItem(state, squad.id, "gauss");
  const equipped = state.squads.find((item) => item.id === squad.id)!;
  assert.equal(equipped.weaponId, "gauss");
  assert.equal(state.stash.gauss, 0);
  assert.equal(state.stash[oldWeapon], 1);
  assert.equal(equipped.magazineSize, ZONE_ITEMS.gauss.effects.magazine);
});

test("склад выдаёт реальные расходники и продаёт биоматериалы по торговой цене", () => {
  let state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  squad.ammo = 0;
  const crateBefore = state.stash.ammo_crate!;
  state = supplySquadFromStash(state, squad.id, "ammo_crate");
  assert.ok(state.squads.find((item) => item.id === squad.id)!.ammo > 0);
  assert.equal(state.stash.ammo_crate, crateBefore - 1);
  state.stash.controller_brain = 2;
  const price = getContentItemSaleValue(state, "controller_brain") * 2;
  const rubles = state.rubles;
  state = sellContentItem(state, "controller_brain");
  assert.equal(state.stash.controller_brain, 0);
  assert.equal(state.rubles, rubles + price);
});

test("локации отличаются не подписью, а радиацией, пси-фоном, добычей и скоростью", () => {
  const cordon = getLocationContent("cordon", "cordon", "base");
  const cnpp = getLocationContent("cnpp", "pripyat", "shelter");
  const radar = getLocationContent("radar", "radar", "shelter");
  assert.ok(cnpp.radiation > cordon.radiation * 5);
  assert.ok(radar.psi > cordon.psi);
  assert.ok(cnpp.lootTier > cordon.lootTier);
  assert.ok(cnpp.travel > cordon.travel);
});

test("динамическое событие создаётся в мире и пси-шторм реально подавляет незащищённый отряд", () => {
  let state = createGame("stalkers");
  state.nextWorldEventAt = state.simMinute;
  state.speed = 1;
  state = tickGame(state);
  assert.ok(state.worldEvents.length > 0);
  assert.equal(state.alifeStats.worldEvents, 1);
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  squad.nodeId = "cordon";
  squad.suppression = 0;
  state.worldEvents = [{ id: "psi-test", type: "psi_storm", status: "active", nodeId: "cordon", faction: null, targetSquadId: null, startedAt: state.simMinute, expiresAt: state.simMinute + 120, resolvedAt: null, severity: 3, title: "Пси-шторм", description: "тест" }];
  state.speed = 12;
  state = tickGame(state);
  assert.ok(state.squads.find((item) => item.id === squad.id)!.suppression > 0);
});

test("в Зоне действуют одиннадцать разных типов мутантов, а не четыре перекрашенные стаи", () => {
  assert.equal(Object.keys(MUTANT_LABELS).length, 11);
  assert.deepEqual(Object.keys(MUTANT_LABELS).sort(), [
    "bloodsucker", "boar", "burer", "chimera", "controller", "dogs", "flesh", "poltergeist", "pseudodog", "pseudogiant", "snork",
  ]);
});

test("суточная симуляция удерживает события, склад и снаряжение в допустимых границах", () => {
  let state = createGame("bandits");
  state.speed = 12;
  const targetMinute = state.simMinute + 24 * 60;
  for (let tick = 0; tick < 180 && state.simMinute < targetMinute && !state.victory && !state.defeat; tick += 1) {
    if (state.speed === 0) state.speed = 12;
    state = tickGame(state);
  }

  assert.ok(state.simMinute >= targetMinute || state.victory || state.defeat);
  assert.ok(state.worldEvents.length <= 30);
  assert.ok(state.worldEvents.filter((event) => event.status === "active").length <= 4);
  assert.ok(Object.entries(state.stash).every(([id, amount]) => Boolean(ZONE_ITEMS[id as keyof typeof ZONE_ITEMS]) && Number.isInteger(amount) && amount >= 0));
  assert.ok(state.squads.every((squad) => squad.faction === "mutants" || Boolean(squad.weaponId && squad.armorId)));
  assert.ok(state.squads.every((squad) => (squad.artifactIds?.length ?? 0) <= 2));
});

test("укреплённая точка Кордона даёт контролирующей стороне реальный боевой бонус", () => {
  const runBattle = (nodeId: "north_outpost" | "checkpoint") => {
    let state = createGame("duty");
    const duty = state.squads.find((item) => item.faction === "duty")!;
    const freedom = state.squads.find((item) => item.faction === "freedom")!;
    state.squads = [
      { ...duty, nodeId, status: "idle", cover: 0 },
      { ...freedom, nodeId, status: "idle", cover: 0 },
    ];
    state.nodes.find((node) => node.id === nodeId)!.owner = "duty";
    state.speed = 1;
    state = tickGame(state);
    return {
      defender: state.squads.find((item) => item.faction === "duty")!.strength,
      attacker: state.squads.find((item) => item.faction === "freedom")!.strength,
    };
  };

  const exposed = runBattle("north_outpost");
  const fortified = runBattle("checkpoint");
  assert.ok(fortified.defender > exposed.defender);
  assert.ok(fortified.attacker < exposed.attacker);
});

test("тактическое отступление внутри Кордона использует локальные дороги", () => {
  const state = createGame("stalkers");
  const squad = state.squads.find((item) => item.id === state.selectedSquadId)!;
  squad.nodeId = "farmstead";
  squad.previousNodeId = "cordon";
  state.tacticalNodeId = "farmstead";
  const retreated = tacticalAction(state, "retreat");
  const moved = retreated.squads.find((item) => item.id === squad.id)!;
  assert.equal(moved.status, "moving");
  assert.equal(moved.destinationId, "cordon");
});

test("Выброс щадит капитальное укрытие и поражает открытый отряд", () => {
  let state = createGame("stalkers");
  const squads = state.squads.filter((item) => item.faction === "stalkers").slice(0, 2);
  state.squads = [
    { ...squads[0], nodeId: "radar", status: "idle" },
    { ...squads[1], nodeId: "garbage", status: "idle" },
  ];
  state.speed = 1;
  state.emissionWarned = true;
  state.nextEmissionAt = state.simMinute + 1;
  const shelteredBefore = state.squads[0].strength;
  const exposedBefore = state.squads[1].strength;
  state = tickGame(state);
  assert.equal(state.squads[0].strength, shelteredBefore);
  assert.ok(state.squads[1].strength < exposedBefore || state.squads[1].status === "dead");
});

test("предупреждение о Выбросе автоматически ставит игру на паузу", () => {
  let state = createGame("bandits");
  state.speed = 4;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  state.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = state.simMinute + 30;
  state = tickGame(state);
  assert.equal(state.emissionWarned, true);
  assert.equal(state.speed, 0);
  assert.ok(state.log.some((entry) => /время остановлено/i.test(entry.text)));

  let crossed = createGame("bandits");
  crossed.speed = 12;
  crossed.nextAiAt = Number.MAX_SAFE_INTEGER;
  crossed.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  crossed.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  crossed.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  crossed.nextEmissionAt = crossed.simMinute + 1;
  crossed = tickGame(crossed);
  assert.equal(crossed.speed, 0);
  assert.equal(crossed.emissionWarned, true);
  const scheduledAt = crossed.nextEmissionAt;
  crossed = tickGame({ ...crossed, speed: 1 });
  assert.equal(crossed.emissionWarned, false);
  assert.ok(crossed.nextEmissionAt > scheduledAt);
});

test("стационарные гарнизоны держат позицию и переживают Выброс", () => {
  let state = createGame("bandits");
  const garrison = state.squads.find((squad) => {
    const node = state.nodes.find((item) => item.id === squad.nodeId);
    return squad.faction === "bandits" && squad.homeGarrison && node?.type !== "base" && node?.type !== "shelter";
  })!;
  const before = garrison.strength;
  state.squads = [{ ...garrison, status: "idle", destinationId: null }];
  state.speed = 1;
  state.emissionWarned = true;
  state.nextEmissionAt = state.simMinute + 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  state.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.squads[0].strength, before);
  assert.notEqual(state.squads[0].status, "dead");

  let aiState = createGame("duty");
  const aiGarrison = aiState.squads.find((squad) => squad.faction === "bandits" && squad.homeGarrison)!;
  const originalNode = aiGarrison.nodeId;
  aiState.directives.bandits = { type: "defense", targetNodeId: "base_borov", issuedAt: aiState.simMinute, reason: "проверка обороны" };
  aiState.factionFunds.bandits = 0;
  aiState.speed = 1;
  aiState.nextAiAt = aiState.simMinute + 1;
  aiState.nextDirectiveAt = Number.MAX_SAFE_INTEGER;
  aiState.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  aiState.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  aiState.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  aiState.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  aiState = tickGame(aiState);
  const afterAi = aiState.squads.find((squad) => squad.id === aiGarrison.id)!;
  assert.equal(afterAi.nodeId, originalNode);
  assert.equal(afterAi.destinationId, null);
  assert.notEqual(afterAi.status, "moving");
});

test("A-Life выдаёт группировкам директивы и превращает их в реальные миссии", () => {
  let state = createGame("stalkers");
  state.speed = 12;
  state.nextDirectiveAt = state.simMinute + 1;
  state.nextAiAt = state.simMinute + 1;
  state = tickGame(state);
  assert.ok(state.alifeStats.directivesIssued >= PLAYABLE_FACTIONS.length - 1);
  assert.equal(state.directives.stalkers.type, "manual");
  assert.ok(PLAYABLE_FACTIONS.filter((id) => id !== "stalkers").every((id) => state.directives[id].issuedAt === state.simMinute));
  assert.ok(PLAYABLE_FACTIONS.filter((id) => id !== "stalkers").every((id) => state.directives[id].reason.includes(FACTION_PROFILES[id].doctrine)));
  assert.ok(state.squads.some((squad) => squad.faction !== "stalkers" && squad.faction !== "mutants" && !["hold", "player"].includes(squad.mission)));
});

test("союзная группировка замечает угрозу и отправляет поддержку на территорию игрока", () => {
  let state = createGame("stalkers");
  state.relations[["stalkers", "freedom"].sort().join(":")] = "alliance";
  state.nodes.find((node) => node.id === "garbage")!.owner = "stalkers";
  const monolith = state.squads.find((squad) => squad.faction === "monolith" && squad.unitKind === "combat")!;
  const freedom = state.squads.find((squad) => squad.faction === "freedom" && squad.unitKind === "combat")!;
  monolith.nodeId = "garbage";
  monolith.status = "idle";
  monolith.destinationId = null;
  state.squads = [freedom, monolith];
  state.speed = 1;
  state.nextDirectiveAt = state.simMinute + 1;
  state.nextAiAt = state.simMinute + 1;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.directives.freedom.type, "defense");
  assert.ok(["cordon", "garbage"].includes(state.directives.freedom.targetNodeId ?? ""));
  assert.match(state.directives.freedom.reason, /поддержка союзника/i);
  assert.ok(state.squads.some((squad) => squad.faction === "freedom" && squad.mission === "defend" && squad.missionTargetId === state.directives.freedom.targetNodeId));
});

test("автономные отряды ищут укрытие и успевают пережить Выброс на соседней точке", () => {
  let state = createGame("duty");
  const freedom = state.squads.find((squad) => squad.faction === "freedom" && squad.unitKind === "combat")!;
  freedom.nodeId = "zaton";
  freedom.status = "idle";
  freedom.destinationId = null;
  freedom.missionPath = [];
  const before = freedom.strength;
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  state.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = state.simMinute + 30;
  state = tickGame(state);
  assert.equal(state.emissionWarned, true);
  assert.equal(state.speed, 0);
  assert.equal(state.squads.find((squad) => squad.id === freedom.id)?.mission, "seek_shelter");
  state = { ...state, speed: 1 };
  for (let index = 0; index < 29; index += 1) state = tickGame(state);
  const survived = state.squads.find((squad) => squad.id === freedom.id)!;
  assert.equal(state.emissionWarned, false);
  assert.ok(["base", "shelter"].includes(state.nodes.find((node) => node.id === survived.nodeId)!.type));
  assert.equal(survived.strength, before);
  assert.ok(state.alifeStats.shelterOrders > 0);
});

test("мутанты имеют разные виды, охотятся, но не захватывают территорию", () => {
  let state = createGame("stalkers");
  const mutant = state.squads.find((squad) => squad.unitKind === "mutant")!;
  mutant.nodeId = "old_church";
  mutant.status = "idle";
  mutant.destinationId = null;
  mutant.mission = "roam";
  state.squads = [mutant];
  state.speed = 12;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  state.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  for (let index = 0; index < 8; index += 1) state = tickGame(state);
  assert.equal(state.nodes.find((node) => node.id === "old_church")?.owner, null);
  assert.equal(state.nodes.find((node) => node.id === "old_church")?.capture, 0);
  assert.ok(mutant.mutantType);
});

test("контролёр применяет дальнюю пси-атаку без оружейного магазина", () => {
  let state = createGame("duty");
  const defender = state.squads.find((squad) => squad.faction === "duty" && squad.unitKind === "combat")!;
  const controller = state.squads.find((squad) => squad.unitKind === "mutant")!;
  defender.nodeId = "bar";
  defender.status = "idle";
  defender.magazine = 0;
  defender.ammo = 0;
  controller.nodeId = "bar";
  controller.status = "idle";
  controller.mutantType = "controller";
  controller.magazine = 0;
  controller.ammo = 0;
  controller.tacticalX = 78;
  controller.tacticalY = 22;
  defender.tacticalX = 22;
  defender.tacticalY = 78;
  state.squads = [defender, controller];
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextCombatAt = state.simMinute;
  state.nextCaravanAt = Number.MAX_SAFE_INTEGER;
  state.nextMutantSpawnAt = Number.MAX_SAFE_INTEGER;
  const before = defender.strength;
  state = tickGame(state);
  assert.ok(state.squads.find((squad) => squad.id === defender.id)!.strength < before);
  assert.ok(state.squads.find((squad) => squad.id === defender.id)!.suppression > 0);
});

test("длительная A-Life симуляция эквивалентна 30 минутам игры на ×12 и сохраняет инварианты", () => {
  let state = createGame("duty");
  state.speed = 12;
  for (let index = 0; index < 2571; index += 1) {
    state = tickGame({ ...state, speed: 12, victory: false, defeat: false });
    const numeric = [state.simMinute, state.rubles, ...Object.values(state.factionFunds), ...state.squads.flatMap((squad) => [squad.strength, squad.stamina, squad.suppression, squad.travel, squad.cargo, squad.fighters, squad.maxFighters, squad.morale])];
    assert.ok(numeric.every(Number.isFinite), `числовая ошибка на такте ${index}`);
  }
  const nodeIds = new Set(state.nodes.map((node) => node.id));
  assert.equal(new Set(state.squads.map((squad) => squad.id)).size, state.squads.length);
  assert.ok(state.squads.every((squad) => !squad.destinationId || nodeIds.has(squad.destinationId)));
  assert.ok(state.squads.every((squad) => squad.missionPath.every((id) => nodeIds.has(id))));
  assert.ok(state.squads.every((squad) => squad.unitKind !== "combat" || squad.faction === "mutants" || Boolean(getSquadArchetype(squad))), "боевой отряд потерял состав группировки");
  assert.ok(state.squads.every((squad) => squad.fighters >= 0 && squad.fighters <= squad.maxFighters), "численность отряда вышла за штат");
  assert.ok(state.squads.every((squad) => squad.morale >= 0 && squad.morale <= 100), "мораль вышла за допустимые границы");
  assert.ok(state.squads.every((squad) => squad.faction === "mutants" || Boolean(squad.commander)), "человеческий отряд остался без командира");
  assert.ok(state.squads.every((squad) => !squad.commander || [squad.commander.experience, squad.commander.leadership, squad.commander.negotiation, squad.commander.loyalty, squad.commander.autonomy, squad.commander.honor].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)), "параметры командира вышли из диапазона");
  assert.ok(PLAYABLE_FACTIONS.every((id) => !state.directives[id].targetNodeId || nodeIds.has(state.directives[id].targetNodeId!)));
  assert.ok(state.alifeStats.raidsStarted > 0);
  assert.ok(state.alifeStats.patrolsStarted > 0);
  assert.ok(state.alifeStats.caravansDispatched > 0);
  assert.ok(state.alifeStats.tradesCompleted > 0);
  assert.ok(state.alifeStats.mutantSpawns > 0);
  assert.ok(state.alifeStats.mutantAttacks > 0);
  assert.ok(state.alifeStats.shelterOrders > 0);
  assert.ok(state.alifeStats.emissionsSurvived > 0);
  assert.ok(state.squads.filter((squad) => squad.status !== "dead" && squad.mutantType === "controller").length <= 3, "контролёры не должны заполнять всю карту");
  assert.ok(state.alifeStats.patrolsStarted < 2500, "патрульные приказы не должны зацикливаться на коротких маршрутах");
  assert.ok(Number.isFinite(state.reputation));
  assert.ok(PLAYABLE_FACTIONS.every((id) => ["active", "remnant", "destroyed"].includes(state.factionSurvival[id].condition)));
  assert.ok(PLAYABLE_FACTIONS.every((id) => [state.diplomacyMemory[id].trust, state.diplomacyMemory[id].fear, state.diplomacyMemory[id].grievance].every(Number.isFinite)));
  assert.equal(Object.keys(state.factionDiplomacy).length, 45);
  assert.ok(Object.values(state.factionDiplomacy).every((memory) => [memory.trust, memory.tension, memory.cooperation, memory.incidents, memory.tradeVolume].every(Number.isFinite)));
  assert.ok(Object.values(state.relations).filter((relation) => relation === "alliance").length < 20, "дипломатия не должна сходиться во всеобщий союз");
  assert.ok(Object.values(state.factionDiplomacy).filter((memory) => memory.tradePact).length < 20, "торговые договоры не должны автоматически охватывать всю Зону");
  assert.ok(state.diplomaticOffers.length <= 12);
  assert.ok(state.operations.length <= 40, "история операций не должна расти бесконечно");
  assert.ok(state.operations.every((operation) => operation.assignedSquadIds.every((id) => state.squads.some((squad) => squad.id === id))), "операция ссылается на несуществующий отряд");
  assert.ok(state.fieldDeals.length <= 48, "история полевых соглашений не должна расти бесконечно");
  assert.ok(Object.values(state.squadDiplomacy).every((memory) => [memory.trust, memory.respect, memory.grievance, memory.encounters, memory.deals, memory.betrayals].every(Number.isFinite)), "сломана память встреч отрядов");
  assert.ok(PLAYABLE_FACTIONS.every((id) => {
    const strategy = state.factionStrategy[id];
    const balance = getFactionBalanceSummary(state, id);
    return [strategy.manpower, strategy.supply, strategy.warWeariness, strategy.casualties, balance.readiness].every(Number.isFinite)
      && strategy.manpower >= 0 && strategy.manpower <= balance.manpowerCap
      && strategy.supply >= 0 && strategy.supply <= 100
      && strategy.warWeariness >= 0 && strategy.warWeariness <= 100;
  }), "стратегические резервы вышли из допустимых границ");
  assert.ok(state.nodes.every((node) => Number.isFinite(node.security) && node.security >= 0 && node.security <= 100), "контроль территории вышел из диапазона");
  assert.ok(state.log.length <= 80);
});

test("каждая из десяти группировок выдерживает отдельный пятидневный прогон со своей доктриной", () => {
  for (const faction of PLAYABLE_FACTIONS) {
    let state = createGame(faction);
    state.speed = 12;
    for (let index = 0; index < 600; index += 1) {
      state = tickGame({ ...state, speed: 12, victory: false, defeat: false });
    }
    const numeric = [state.rubles, ...Object.values(state.factionFunds), ...state.squads.flatMap((squad) => [squad.strength, squad.travel, squad.stamina, squad.suppression, squad.fighters, squad.maxFighters, squad.morale])];
    assert.ok(numeric.every(Number.isFinite), `${faction}: симуляция породила нечисловое значение`);
    assert.ok(state.alifeStats.directivesIssued > 0, `${faction}: A-Life не выдавал приказы`);
    assert.ok(state.alifeStats.caravansDispatched > 0, `${faction}: караваны не появились`);
    assert.ok(state.squads.every((squad) => squad.unitKind !== "combat" || squad.faction === "mutants" || Boolean(getSquadArchetype(squad))), `${faction}: потерян состав отряда`);
    assert.ok(state.squads.every((squad) => squad.fighters >= 0 && squad.fighters <= squad.maxFighters), `${faction}: численность вышла за штат`);
    assert.ok(state.squads.every((squad) => squad.faction === "mutants" || Boolean(squad.commander)), `${faction}: отряд остался без командира`);
    assert.equal(Object.keys(state.factionDiplomacy).length, 45, `${faction}: неполная дипломатическая сеть`);
    assert.ok(state.log.length <= 80, `${faction}: переполнен журнал`);
  }
});

test("цена перемирия зависит от памяти фракции, а выплата поступает противнику", () => {
  const state = createGame("duty");
  assert.equal(getRelation(state, "duty", "freedom"), "war");
  const terms = getDiplomacyTerms(state, "freedom");
  const enemyFunds = state.factionFunds.freedom;
  const grievance = state.diplomacyMemory.freedom.grievance;
  const next = changeDiplomacy(state, "freedom");
  assert.equal(getRelation(next, "duty", "freedom"), "truce");
  assert.equal(next.rubles, state.rubles - terms.truceCost);
  assert.equal(next.factionFunds.freedom, enemyFunds + terms.truceCost);
  assert.ok(next.diplomacyMemory.freedom.grievance < grievance);
});

test("истощённый штаб прекращает экспансию и возвращает отряды на восстановление", () => {
  let state = createGame("stalkers");
  state.factionStrategy.bandits.warWeariness = 82;
  state.factionStrategy.bandits.supply = 75;
  state.squads = state.squads.filter((squad) => squad.faction === "bandits");
  state.nextDirectiveAt = state.simMinute;
  state.nextAiAt = state.simMinute;
  state.speed = 1;
  state = tickGame(state);
  assert.equal(state.directives.bandits.type, "recovery");
  assert.match(state.directives.bandits.reason, /истощены/i);
});

test("две истощённые ИИ-группировки заключают перемирие вместо бесконечной войны", () => {
  let state = createGame("stalkers");
  assert.equal(getRelation(state, "bandits", "military"), "war");
  state.factionStrategy.bandits.warWeariness = 80;
  state.factionStrategy.military.warWeariness = 76;
  const bilateral = getBilateralDiplomacy(state, "bandits", "military");
  bilateral.nextReviewAt = state.simMinute;
  state.nextFactionDiplomacyAt = state.simMinute;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.speed = 1;
  state = tickGame(state);
  assert.equal(getRelation(state, "bandits", "military"), "truce");
});

test("дары постепенно открывают союз, а предательство портит репутацию перед всей Зоной", () => {
  let state = createGame("stalkers");
  state.rubles = 1_000_000;
  state.factionFunds.stalkers = 1_000_000;
  const observerTrust = state.diplomacyMemory.ecologists.trust;
  state = diplomaticAction(state, "freedom", "gift");
  state = { ...state, simMinute: state.simMinute + 60 };
  state = diplomaticAction(state, "freedom", "gift");
  state = { ...state, simMinute: state.simMinute + 60 };
  assert.equal(getDiplomacyTerms(state, "freedom").canAlliance, true);
  state = diplomaticAction(state, "freedom", "alliance");
  assert.equal(getRelation(state, "stalkers", "freedom"), "alliance");
  const reputationBeforeBetrayal = state.reputation;
  state = diplomaticAction(state, "freedom", "war");
  assert.equal(getRelation(state, "stalkers", "freedom"), "war");
  assert.equal(state.reputation, reputationBeforeBetrayal - 25);
  assert.ok(state.diplomacyMemory.ecologists.trust < observerTrust);
});

test("союзник по запросу отправляет ближайший мобильный отряд защищать игрока", () => {
  const state = createGame("stalkers");
  state.rubles = 100_000;
  state.factionFunds.stalkers = 100_000;
  state.relations[["stalkers", "freedom"].sort().join(":")] = "alliance";
  state.diplomacyMemory.freedom.trust = 60;
  state.diplomacyMemory.freedom.nextNegotiationAt = state.simMinute;
  state.nodes.find((node) => node.id === "garbage")!.owner = "stalkers";
  const enemy = state.squads.find((squad) => squad.faction === "monolith" && squad.unitKind === "combat")!;
  enemy.nodeId = "garbage";
  enemy.status = "idle";
  enemy.destinationId = null;
  const supporter = state.squads.find((squad) => squad.faction === "freedom" && squad.unitKind === "combat" && !squad.homeGarrison)!;
  supporter.status = "idle";
  supporter.destinationId = null;
  const next = diplomaticAction(state, "freedom", "support");
  const ordered = next.squads.find((squad) => squad.id === supporter.id)!;
  assert.equal(ordered.mission, "defend");
  assert.equal(ordered.missionTargetId, "garbage");
  assert.ok(next.rubles < state.rubles);
});

test("потери от игрока остаются в памяти и порождают предложение мира", () => {
  let state = createGame("stalkers");
  const player = state.squads.find((squad) => squad.faction === "stalkers" && squad.unitKind === "combat")!;
  const military = state.squads.find((squad) => squad.faction === "military" && squad.unitKind === "combat")!;
  const reserve = state.squads.find((squad) => squad.faction === "military" && squad.homeGarrison)!;
  state.squads = [
    { ...player, nodeId: "garbage", status: "idle", attack: 1000 },
    { ...military, nodeId: "garbage", status: "idle", strength: 0.1 },
    { ...reserve },
  ];
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.diplomacyMemory.military.playerKills, 1);
  assert.ok(state.diplomacyMemory.military.grievance > 32);
  assert.ok(state.diplomacyMemory.military.fear > 8);

  state.diplomacyMemory.military.fear = 65;
  state.diplomacyMemory.military.nextNegotiationAt = state.simMinute;
  state.nextDiplomacyAt = state.simMinute + 1;
  state.speed = 1;
  state = tickGame(state);
  const offer = state.diplomaticOffers.find((item) => item.faction === "military" && item.type === "truce" && item.status === "pending");
  assert.ok(offer);
  state.rubles = 100_000;
  state = respondDiplomaticOffer(state, offer!.id, true);
  assert.equal(getRelation(state, "stalkers", "military"), "truce");
});

test("реальный захват чужой точки записывает территориальную претензию", () => {
  let state = createGame("stalkers");
  const player = state.squads.find((squad) => squad.faction === "stalkers" && squad.unitKind === "combat")!;
  const banditReserve = state.squads.find((squad) => squad.faction === "bandits" && squad.unitKind === "combat")!;
  state.squads = [
    { ...player, nodeId: "x18", status: "capturing", destinationId: null },
    { ...banditReserve, nodeId: "dark_valley", status: "idle", destinationId: null },
  ];
  const target = state.nodes.find((node) => node.id === "x18")!;
  target.owner = "bandits";
  target.capture = 0.96;
  target.captureFaction = "stalkers";
  state.speed = 12;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.nodes.find((node) => node.id === "x18")?.owner, "stalkers");
  assert.equal(state.diplomacyMemory.bandits.territoriesLost, 1);
  assert.ok(state.diplomacyMemory.bandits.grievance > 32);
  assert.ok(state.diplomacyMemory.bandits.fear > 8);
});

test("совместный бой с союзником записывается как оказанная помощь", () => {
  let state = createGame("stalkers");
  state.relations[["stalkers", "freedom"].sort().join(":")] = "alliance";
  const player = state.squads.find((squad) => squad.faction === "stalkers" && squad.unitKind === "combat")!;
  const ally = state.squads.find((squad) => squad.faction === "freedom" && squad.unitKind === "combat")!;
  const enemy = state.squads.find((squad) => squad.faction === "monolith" && squad.unitKind === "combat")!;
  state.squads = [
    { ...player, nodeId: "garbage", status: "idle", attack: 1000 },
    { ...ally, nodeId: "garbage", status: "idle", attack: 1 },
    { ...enemy, nodeId: "garbage", status: "idle", strength: 0.1 },
  ];
  const trust = state.diplomacyMemory.freedom.trust;
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.diplomacyMemory.freedom.aidReceived, 1);
  assert.ok(state.diplomacyMemory.freedom.trust > trust);
  assert.ok(state.reputation > 0);
});

test("захваченная территория становится причиной адресного ответного рейда", () => {
  let state = createGame("stalkers");
  const bandit = state.squads.find((squad) => squad.faction === "bandits" && squad.unitKind === "combat" && !squad.homeGarrison)!;
  const player = state.squads.find((squad) => squad.faction === "stalkers" && squad.unitKind === "combat")!;
  state.squads = [
    { ...bandit, nodeId: "dark_valley", status: "idle", destinationId: null },
    { ...player, nodeId: "skadovsk", status: "idle", destinationId: null },
  ];
  state.nodes.find((node) => node.id === "garbage")!.owner = "stalkers";
  state.diplomacyMemory.bandits.grievance = 75;
  state.diplomacyMemory.bandits.territoriesLost = 2;
  state.speed = 1;
  state.nextDirectiveAt = state.simMinute + 1;
  state.nextAiAt = state.simMinute + 1;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(state.directives.bandits.type, "raid");
  assert.match(state.directives.bandits.reason, /ответный удар/i);
  assert.equal(state.nodes.find((node) => node.id === state.directives.bandits.targetNodeId)?.owner, "stalkers");
});

test("потеря штаба создаёт остатки сил, а гибель последних отрядов уничтожает группировку", () => {
  let state = createGame("stalkers");
  state.nodes.find((node) => node.id === "dark_valley")!.owner = "stalkers";
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(getFactionCondition(state, "bandits"), "remnant");
  state.squads.forEach((squad) => { if (squad.faction === "bandits") squad.status = "dead"; });
  state = tickGame(state);
  assert.equal(getFactionCondition(state, "bandits"), "destroyed");
  assert.ok(state.nodes.every((node) => node.owner !== "bandits"));
  assert.ok(PLAYABLE_FACTIONS.filter((faction) => faction !== "bandits").every((faction) => getRelation(state, "bandits", faction) === "neutral"));
  assert.ok(PLAYABLE_FACTIONS.filter((faction) => faction !== "bandits").every((faction) => !getBilateralDiplomacy(state, "bandits", faction).tradePact && !getBilateralDiplomacy(state, "bandits", faction).defensePact));
});

test("принятый территориальный ультиматум реально передаёт точку", () => {
  let state = createGame("stalkers");
  state.nodes.find((node) => node.id === "garbage")!.owner = "stalkers";
  state.diplomaticOffers = [{ id: "ultimatum", faction: "bandits", type: "territory", status: "pending", cost: 0, demandedNodeId: "garbage", issuedAt: state.simMinute, expiresAt: state.simMinute + 120 }];
  state = respondDiplomaticOffer(state, "ultimatum", true);
  assert.equal(state.nodes.find((node) => node.id === "garbage")?.owner, "bandits");
  assert.equal(getRelation(state, "stalkers", "bandits"), "truce");
});

test("дипломатическая сеть хранит отдельную память для каждой пары группировок", () => {
  const state = createGame("stalkers");
  assert.equal(Object.keys(state.factionDiplomacy).length, (PLAYABLE_FACTIONS.length * (PLAYABLE_FACTIONS.length - 1)) / 2);
  const sciencePact = getBilateralDiplomacy(state, "ecologists", "clear_sky");
  const oldEnemies = getBilateralDiplomacy(state, "duty", "freedom");
  assert.equal(sciencePact.tradePact, true);
  assert.ok(sciencePact.trust > oldEnemies.trust);
  assert.ok(oldEnemies.tension > sciencePact.tension);
});

test("торговый договор игрока создаёт реальный экономический канал", () => {
  let state = createGame("stalkers");
  state.rubles = 100_000;
  state.factionFunds.stalkers = 100_000;
  state.diplomacyMemory.freedom.trust = 40;
  state.diplomacyMemory.freedom.nextNegotiationAt = state.simMinute;
  const bilateral = getBilateralDiplomacy(state, "stalkers", "freedom");
  bilateral.tension = 20;
  bilateral.tradePact = false;
  const beforeGross = getEconomySummary(state).gross;
  state = diplomaticAction(state, "freedom", "trade_pact");
  assert.equal(getBilateralDiplomacy(state, "stalkers", "freedom").tradePact, true);
  assert.ok(getEconomySummary(state).gross > beforeGross);
  state.speed = 1;
  state.nextIncomeAt = state.simMinute + 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextFactionDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  const trades = getBilateralDiplomacy(state, "stalkers", "freedom").tradesCompleted;
  state = tickGame(state);
  assert.ok(getBilateralDiplomacy(state, "stalkers", "freedom").tradesCompleted > trades);
});

test("пакт о ненападении останавливает огонь и имеет конечный срок", () => {
  let state = createGame("stalkers");
  state.rubles = 100_000;
  state.factionFunds.stalkers = 100_000;
  state.diplomacyMemory.freedom.nextNegotiationAt = state.simMinute;
  state = diplomaticAction(state, "freedom", "non_aggression");
  assert.equal(getRelation(state, "stalkers", "freedom"), "truce");
  const expiresAt = getBilateralDiplomacy(state, "stalkers", "freedom").nonAggressionUntil!;
  assert.ok(expiresAt > state.simMinute);
  state = { ...state, simMinute: expiresAt, speed: 1, nextFactionDiplomacyAt: expiresAt + 1, nextAiAt: Number.MAX_SAFE_INTEGER, nextIncomeAt: Number.MAX_SAFE_INTEGER, nextDiplomacyAt: Number.MAX_SAFE_INTEGER, nextEmissionAt: Number.MAX_SAFE_INTEGER };
  state = tickGame(state);
  assert.equal(getRelation(state, "stalkers", "freedom"), "neutral");
  assert.equal(getBilateralDiplomacy(state, "stalkers", "freedom").nonAggressionUntil, null);
});

test("ИИ-группировки заключают оборонительный союз против общего врага", () => {
  let state = createGame("stalkers");
  const key = ["duty", "military"].sort().join(":");
  state.relations[key] = "neutral";
  const bilateral = getBilateralDiplomacy(state, "duty", "military");
  Object.assign(bilateral, { trust: 70, cooperation: 70, tension: 8, tradePact: true, defensePact: false, nextReviewAt: state.simMinute });
  state.speed = 1;
  state.nextFactionDiplomacyAt = state.simMinute + 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  assert.equal(getRelation(state, "duty", "military"), "alliance");
  assert.equal(getBilateralDiplomacy(state, "duty", "military").defensePact, true);
});

test("форма жетона отражает численность и качество реального отряда", () => {
  const state = createGame("stalkers");
  const novice = state.squads.find((squad) => squad.faction === "stalkers" && squad.rank === "Новички" && !squad.homeGarrison)!;
  const veteran = state.squads.find((squad) => squad.faction === "stalkers" && squad.rank === "Ветераны" && !squad.homeGarrison)!;
  const garrison = state.squads.find((squad) => squad.faction === "stalkers" && squad.homeGarrison && squad.maxFighters === 20)!;
  assert.equal(getSquadMarkerIntel(novice).shape, "circle");
  assert.equal(getSquadMarkerIntel(veteran).shape, "diamond");
  assert.equal(getSquadMarkerIntel(garrison).shape, "square");
  assert.equal(garrison.fighters, 20);
  assert.ok(PLAYABLE_FACTIONS.every((faction) => state.squads.some((squad) => squad.faction === faction && squad.homeGarrison && squad.maxFighters === 20)));
});

test("карточка состава распределяет всех бойцов по ролям без выдуманных людей", () => {
  const state = createGame("duty");
  const squad = state.squads.find((item) => item.faction === "duty" && item.homeGarrison && item.maxFighters === 20)!;
  const intel = getSquadIntel(squad);
  assert.equal(Object.values(intel.composition).reduce((sum, count) => sum + count, 0), squad.fighters);
  assert.ok(intel.combatPower > 0);
  assert.equal(intel.casualtyCount, 0);
  assert.ok(Object.values(intel.skills).every((value) => value >= 0 && value <= 100));
});

test("боевые потери уменьшают не только полоску, но и число бойцов", () => {
  let state = createGame("duty");
  const attacker = state.squads.find((squad) => squad.faction === "duty" && !squad.homeGarrison)!;
  const target = state.squads.find((squad) => squad.faction === "freedom" && squad.homeGarrison && squad.maxFighters === 20)!;
  state.squads = [
    { ...attacker, nodeId: "bar", status: "idle", attack: 800, tacticalX: 20, tacticalY: 50 },
    { ...target, nodeId: "bar", status: "idle", tacticalX: 30, tacticalY: 50 },
  ];
  state.speed = 1;
  state.nextAiAt = Number.MAX_SAFE_INTEGER;
  state.nextIncomeAt = Number.MAX_SAFE_INTEGER;
  state.nextFactionDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextDiplomacyAt = Number.MAX_SAFE_INTEGER;
  state.nextEmissionAt = Number.MAX_SAFE_INTEGER;
  state = tickGame(state);
  const wounded = state.squads.find((squad) => squad.id === target.id)!;
  assert.ok(wounded.fighters < 20);
  assert.ok(getSquadIntel(wounded).casualtyCount > 0);
});

test("потерянный личный состав можно восстановить только на своей главной базе", () => {
  let state = createGame("bandits");
  const squad = state.squads.find((item) => item.faction === "bandits" && !item.homeGarrison && item.unitKind === "combat")!;
  squad.nodeId = "dark_valley";
  squad.status = "idle";
  squad.fighters = Math.max(1, squad.maxFighters - 2);
  squad.strength = squad.maxStrength * 0.5;
  state.rubles = 100_000;
  state.factionFunds.bandits = 100_000;
  const cost = getReinforcementCost(state, squad);
  const before = state.rubles;
  state = reinforceSquad(state, squad.id);
  const restored = state.squads.find((item) => item.id === squad.id)!;
  assert.equal(restored.fighters, restored.maxFighters);
  assert.equal(state.rubles, before - cost);
  const fieldState = { ...state, squads: state.squads.map((item) => item.id === squad.id ? { ...item, nodeId: "garbage", fighters: item.maxFighters - 1 } : item) };
  assert.equal(reinforceSquad(fieldState, squad.id), fieldState);
});

test("у каждого человеческого отряда есть опытный командир с характером и личной верностью", () => {
  const state = createGame("stalkers");
  const humanSquads = state.squads.filter((squad) => squad.faction !== "mutants");
  assert.ok(humanSquads.length > 0);
  assert.ok(humanSquads.every((squad) => squad.fighters >= 3 && squad.commander));
  assert.ok(humanSquads.every((squad) => squad.commander!.experience >= 35));
  assert.ok(humanSquads.every((squad) => squad.commander!.name.includes("«") && squad.commander!.callsign.length > 1));
  assert.ok(humanSquads.some((squad) => squad.commander!.background === "founder"));
});

test("вражеские командиры могут договориться о местном отходе без отмены войны штабов", () => {
  let state = createGame("stalkers");
  const stalkers = state.squads.find((squad) => squad.faction === "stalkers" && !squad.homeGarrison)!;
  const bandits = state.squads.find((squad) => squad.faction === "bandits" && !squad.homeGarrison)!;
  Object.assign(stalkers, { nodeId: "forester", status: "idle", attack: 4, strength: 42, maxStrength: 90, morale: 40 });
  Object.assign(bandits, { nodeId: "forester", status: "idle", attack: 70, strength: 110, maxStrength: 110, morale: 42 });
  Object.assign(stalkers.commander!, { negotiation: 100, loyalty: 80, honor: 100, disposition: "pragmatic" });
  Object.assign(bandits.commander!, { negotiation: 100, loyalty: 80, honor: 100, disposition: "pragmatic" });
  state = { ...state, speed: 1, rngSeed: 1, nextSquadDiplomacyAt: state.simMinute, nextAiAt: Number.MAX_SAFE_INTEGER, nextIncomeAt: Number.MAX_SAFE_INTEGER, nextDiplomacyAt: Number.MAX_SAFE_INTEGER, nextFactionDiplomacyAt: Number.MAX_SAFE_INTEGER, nextEmissionAt: Number.MAX_SAFE_INTEGER, nextCaravanAt: Number.MAX_SAFE_INTEGER, nextMutantSpawnAt: Number.MAX_SAFE_INTEGER };
  const before = stalkers.strength;
  state = tickGame(state);
  const afterStalkers = state.squads.find((squad) => squad.id === stalkers.id)!;
  const afterBandits = state.squads.find((squad) => squad.id === bandits.id)!;
  const deals = getActiveFieldDealsForSquad(state, afterStalkers.id);
  assert.equal(getRelation(state, "stalkers", "bandits"), "war");
  assert.ok(deals.some((deal) => deal.type === "local_truce" || deal.type === "bribe"));
  assert.equal(squadsAreHostile(state, afterStalkers, afterBandits), false);
  assert.equal(afterStalkers.strength, before);
  assert.equal(afterStalkers.status, "moving");
});

test("сломленный и нелояльный командир способен увести весь отряд к противнику", () => {
  let state = createGame("stalkers");
  const deserters = state.squads.find((squad) => squad.faction === "stalkers" && !squad.homeGarrison)!;
  const sponsor = state.squads.find((squad) => squad.faction === "bandits" && !squad.homeGarrison)!;
  Object.assign(deserters, { nodeId: "forester", status: "idle", attack: 2, strength: 25, maxStrength: 90, morale: 10 });
  Object.assign(sponsor, { nodeId: "forester", status: "idle", attack: 90, strength: 120, maxStrength: 120, morale: 75 });
  Object.assign(deserters.commander!, { negotiation: 100, loyalty: 0, honor: 20, ambition: 100, disposition: "ambitious" });
  Object.assign(sponsor.commander!, { negotiation: 100, loyalty: 90, honor: 70, ambition: 60, disposition: "pragmatic" });
  state = { ...state, speed: 1, rngSeed: 1, nextSquadDiplomacyAt: state.simMinute, nextAiAt: Number.MAX_SAFE_INTEGER, nextIncomeAt: Number.MAX_SAFE_INTEGER, nextDiplomacyAt: Number.MAX_SAFE_INTEGER, nextFactionDiplomacyAt: Number.MAX_SAFE_INTEGER, nextEmissionAt: Number.MAX_SAFE_INTEGER, nextCaravanAt: Number.MAX_SAFE_INTEGER, nextMutantSpawnAt: Number.MAX_SAFE_INTEGER };
  state = tickGame(state);
  const defected = state.squads.find((squad) => squad.id === deserters.id)!;
  assert.equal(defected.faction, "bandits");
  assert.equal(defected.commander?.previousFaction, "stalkers");
  assert.equal(defected.commander?.background, "defector");
  assert.equal(state.alifeStats.defections, 1);
});

test("полевое соглашение можно предать и получить реальный первый удар", () => {
  let state = createGame("stalkers");
  const betrayer = state.squads.find((squad) => squad.faction === "bandits" && !squad.homeGarrison)!;
  const victim = state.squads.find((squad) => squad.faction === "stalkers" && !squad.homeGarrison)!;
  Object.assign(betrayer, { nodeId: "forester", status: "idle" });
  Object.assign(victim, { nodeId: "forester", status: "idle" });
  Object.assign(betrayer.commander!, { honor: 0, loyalty: 20, ambition: 100 });
  Object.assign(victim.commander!, { honor: 100, loyalty: 100, ambition: 0 });
  state.fieldDeals = [{ id: "trap", type: "local_truce", status: "active", leftSquadId: betrayer.id, rightSquadId: victim.id, nodeId: "forester", startedAt: state.simMinute - 18, expiresAt: state.simMinute + 120, value: 0, betrayalRisk: 100, betrayalChecked: false, initiatorSquadId: victim.id }];
  state = { ...state, speed: 1, rngSeed: 1, nextSquadDiplomacyAt: Number.MAX_SAFE_INTEGER, nextAiAt: Number.MAX_SAFE_INTEGER, nextIncomeAt: Number.MAX_SAFE_INTEGER, nextDiplomacyAt: Number.MAX_SAFE_INTEGER, nextFactionDiplomacyAt: Number.MAX_SAFE_INTEGER, nextEmissionAt: Number.MAX_SAFE_INTEGER, nextCaravanAt: Number.MAX_SAFE_INTEGER, nextMutantSpawnAt: Number.MAX_SAFE_INTEGER };
  const before = victim.strength;
  state = tickGame(state);
  assert.equal(state.fieldDeals.find((deal) => deal.id === "trap")?.status, "broken");
  assert.ok(state.squads.find((squad) => squad.id === victim.id)!.strength < before);
  assert.equal(state.alifeStats.betrayals, 1);
});

test("полевые переговоры выполняют реальный контракт и меняют отношения с заказчиком", () => {
  let state = createGame("stalkers");
  const stalkers = state.squads.find((squad) => squad.faction === "stalkers" && !squad.homeGarrison)!;
  const freedom = state.squads.find((squad) => squad.faction === "freedom" && !squad.homeGarrison)!;
  Object.assign(stalkers, { nodeId: "forester", status: "idle", morale: 70 });
  Object.assign(freedom, { nodeId: "forester", status: "idle", morale: 70 });
  Object.assign(stalkers.commander!, { negotiation: 100, autonomy: 80, disposition: "pragmatic" });
  Object.assign(freedom.commander!, { negotiation: 100, autonomy: 80, disposition: "pragmatic" });
  state.contracts = [{ id: "parley", type: "parley", status: "active", title: "Полевой контакт", description: "", targetNodeId: null, targetFaction: "freedom", goal: 1, progress: 0, reward: 5000, expiresAt: state.simMinute + 360, acceptedAt: state.simMinute, issuerFaction: "freedom", targetSquadId: null, sourceOperationId: null, risk: "medium", reputationReward: 5, lastProgressAt: state.simMinute, rewardItemId: null, requiredItemId: null }];
  state = { ...state, speed: 1, rngSeed: 1, nextSquadDiplomacyAt: state.simMinute, nextAiAt: Number.MAX_SAFE_INTEGER, nextIncomeAt: Number.MAX_SAFE_INTEGER, nextDiplomacyAt: Number.MAX_SAFE_INTEGER, nextFactionDiplomacyAt: Number.MAX_SAFE_INTEGER, nextEmissionAt: Number.MAX_SAFE_INTEGER, nextCaravanAt: Number.MAX_SAFE_INTEGER, nextMutantSpawnAt: Number.MAX_SAFE_INTEGER };
  const before = state.rubles;
  state = tickGame(state);
  assert.equal(state.contracts[0].status, "completed");
  assert.equal(state.rubles, before + 5000);
  assert.ok(state.alifeStats.fieldDeals > 0);
});

test("операции принадлежат всем штабам и используют конкретные отряды", () => {
  let state = createGame("stalkers");
  assert.equal(new Set(state.operations.map((operation) => operation.issuerFaction)).size, PLAYABLE_FACTIONS.length - 1);
  assert.ok(state.contracts.some((contract) => contract.sourceOperationId));
  const offeredOperationIds = state.contracts.flatMap((contract) => contract.sourceOperationId ? [contract.sourceOperationId] : []);
  assert.equal(new Set(offeredOperationIds).size, offeredOperationIds.length);
  state = { ...state, speed: 12, nextAiAt: state.simMinute, nextDirectiveAt: state.simMinute };
  for (let index = 0; index < 8; index += 1) state = tickGame({ ...state, speed: 12, victory: false, defeat: false });
  assert.ok(state.operations.some((operation) => operation.status === "active" && operation.assignedSquadIds.length > 0));
  assert.ok(state.operations.every((operation) => operation.assignedSquadIds.every((id) => state.squads.some((squad) => squad.id === id))));
});

test("старое сохранение получает межфракционную сеть, штат и мораль отрядов", () => {
  const current = createGame("stalkers");
  const legacy = {
    ...current,
    factionDiplomacy: undefined,
    nextFactionDiplomacyAt: undefined,
    operations: undefined,
    operationSequence: undefined,
    nextOperationAt: undefined,
    squadDiplomacy: undefined,
    fieldDeals: undefined,
    fieldEventSequence: undefined,
    nextSquadDiplomacyAt: undefined,
    squads: current.squads.map((squad) => Object.fromEntries(Object.entries(squad).filter(([key]) => !["maxFighters", "morale", "commander"].includes(key)))),
  } as unknown as GameState;
  const migrated = migrateGameState(legacy);
  assert.equal(Object.keys(migrated.factionDiplomacy).length, 45);
  assert.ok(migrated.squads.every((squad) => Number.isFinite(squad.maxFighters) && Number.isFinite(squad.morale)));
  assert.ok(migrated.squads.every((squad) => squad.faction === "mutants" || Boolean(squad.commander)));
  assert.ok(migrated.operations.length > 0);
  assert.deepEqual(migrated.fieldDeals, []);
  assert.deepEqual(migrated.squadDiplomacy, {});
  assert.ok(Number.isFinite(migrated.nextFactionDiplomacyAt));
  assert.ok(Number.isFinite(migrated.nextSquadDiplomacyAt));
});

test("старое сохранение получает склад, предметное снаряжение и живые события без потери кампании", () => {
  const current = createGame("stalkers");
  const legacy = {
    ...current,
    rubles: 87654,
    stash: undefined,
    discoveredItems: undefined,
    worldEvents: undefined,
    worldEventSequence: undefined,
    nextWorldEventAt: undefined,
    squads: current.squads.map((squad) => Object.fromEntries(Object.entries(squad).filter(([key]) => !["weaponId", "armorId", "artifactIds"].includes(key)))),
  } as unknown as GameState;

  const migrated = migrateGameState(legacy);
  assert.equal(migrated.rubles, 87654);
  assert.ok(Object.values(migrated.stash).some((amount) => amount > 0));
  assert.ok(Array.isArray(migrated.discoveredItems));
  assert.ok(Array.isArray(migrated.worldEvents));
  assert.ok(Number.isFinite(migrated.nextWorldEventAt));
  assert.ok(migrated.squads.every((squad) => squad.faction === "mutants" || Boolean(squad.weaponId && squad.armorId)));
  assert.ok(migrated.squads.every((squad) => Array.isArray(squad.artifactIds)));
});

test("старое сохранение получает стратегические резервы и устойчивость территорий", () => {
  const current = createGame("duty");
  const legacy = {
    ...current,
    factionStrategy: undefined,
    nodes: current.nodes.map((node) => Object.fromEntries(Object.entries(node).filter(([key]) => !["security", "capturedAt"].includes(key)))),
  } as unknown as GameState;
  const migrated = migrateGameState(legacy);
  assert.ok(PLAYABLE_FACTIONS.every((id) => migrated.factionStrategy[id] && Number.isFinite(migrated.factionStrategy[id].manpower)));
  assert.ok(migrated.nodes.every((node) => Number.isFinite(node.security) && (node.owner ? node.security === 100 : node.security === 0)));
  assert.ok(migrated.nodes.every((node) => node.capturedAt === null));
});

test("состояние кампании сохраняется без потери ключевых данных", () => {
  const state = createGame("clear_sky");
  const restored = JSON.parse(JSON.stringify(state)) as typeof state;
  assert.equal(restored.playerFaction, state.playerFaction);
  assert.equal(restored.nodes.length, state.nodes.length);
  assert.equal(restored.squads.length, state.squads.length);
  assert.deepEqual(restored.research, state.research);
  assert.deepEqual(restored.trophies, state.trophies);
  assert.deepEqual(restored.contracts, state.contracts);
  assert.deepEqual(restored.diplomacyMemory, state.diplomacyMemory);
  assert.deepEqual(restored.factionSurvival, state.factionSurvival);
});

test("старое сохранение получает новые карты и сохраняет прогресс", () => {
  const current = createGame("stalkers");
  const legacyNodes = current.nodes.filter((node) => node.mapLevel !== "sector" || node.sectorId === "cordon");
  const legacyNodeIds = new Set(legacyNodes.map((node) => node.id));
  const legacy = {
    ...current,
    rubles: 77777,
    nodes: legacyNodes.map((node) => node.id === "garbage" ? { ...node, owner: "stalkers" as const } : node),
    squads: current.squads.filter((squad) => legacyNodeIds.has(squad.nodeId)),
  };

  const migrated = migrateGameState(legacy);
  assert.equal(migrated.rubles, 77777);
  assert.equal(migrated.speed, 0);
  assert.equal(migrated.nodes.length, 93);
  assert.equal(migrated.nodes.find((node) => node.id === "garbage")?.owner, "stalkers");
  assert.ok(migrated.nodes.some((node) => node.id === "container_yard"));
  assert.ok(migrated.squads.some((squad) => squad.nodeId === "container_yard"));
});

test("сохранение до экономического обновления получает новые поля", () => {
  const current = createGame("stalkers");
  const legacy = {
    ...current,
    trophies: undefined,
    contracts: undefined,
    contractSequence: undefined,
    nextContractRefreshAt: undefined,
    research: { weapons: 1, armor: 1, logistics: 1 },
    squads: current.squads.map((squad) => Object.fromEntries(Object.entries(squad).filter(([key]) => ![
      "weaponTier", "armorTier", "homeGarrison", "tacticalX", "tacticalY", "stamina", "maxStamina", "suppression", "magazine", "magazineSize",
    ].includes(key)))),
  } as unknown as GameState;
  const migrated = migrateGameState(legacy);
  assert.deepEqual(migrated.trophies, { weapons: 0, armor: 0, supplies: 4 });
  assert.ok(migrated.contracts.length >= 3);
  assert.equal(migrated.research.weapons, 1);
  assert.equal(migrated.research.medicine, 0);
  assert.ok(migrated.squads.every((squad) => Number.isFinite(squad.weaponTier) && Number.isFinite(squad.armorTier)));
  assert.ok(migrated.squads.every((squad) => Number.isFinite(squad.tacticalX) && Number.isFinite(squad.stamina) && Number.isFinite(squad.magazine)));
});

test("старое сохранение получает состояние Живой Зоны без обнуления кампании", () => {
  const current = createGame("freedom");
  const legacy = {
    ...current,
    rubles: 54321,
    directives: undefined,
    alifeStats: undefined,
    nextDirectiveAt: undefined,
    nextCaravanAt: undefined,
    nextMutantSpawnAt: undefined,
    squads: current.squads.map((squad) => Object.fromEntries(Object.entries(squad).filter(([key]) => ![
      "unitKind", "mission", "missionTargetId", "missionPath", "missionIssuedAt", "cargo", "mutantType",
      "archetypeId",
    ].includes(key)))),
  } as unknown as GameState;
  const migrated = migrateGameState(legacy);
  assert.equal(migrated.rubles, 54321);
  assert.ok(migrated.directives.freedom);
  assert.ok(Number.isFinite(migrated.nextCaravanAt));
  assert.ok(migrated.squads.every((squad) => squad.unitKind && Array.isArray(squad.missionPath)));
  assert.ok(migrated.squads.every((squad) => squad.unitKind !== "combat" || squad.faction === "mutants" || Boolean(squad.archetypeId)));
});

test("старое сохранение получает стратегическую память и статусы группировок", () => {
  const current = createGame("bandits");
  const legacy = {
    ...current,
    rubles: 65432,
    reputation: undefined,
    diplomacyMemory: undefined,
    factionSurvival: undefined,
    diplomaticOffers: undefined,
    diplomaticOfferSequence: undefined,
    nextDiplomacyAt: undefined,
  } as unknown as GameState;
  const migrated = migrateGameState(legacy);
  assert.equal(migrated.rubles, 65432);
  assert.equal(migrated.reputation, 0);
  assert.ok(PLAYABLE_FACTIONS.every((id) => migrated.diplomacyMemory[id] && migrated.factionSurvival[id]));
  assert.ok(Array.isArray(migrated.diplomaticOffers));
  assert.ok(Number.isFinite(migrated.nextDiplomacyAt));
});

test("все группировки имеют собственную власть, иерархию, промыслы и правила набора", () => {
  assert.equal(Object.keys(FACTION_CULTURES).length, PLAYABLE_FACTIONS.length);
  for (const faction of PLAYABLE_FACTIONS) {
    const culture = FACTION_CULTURES[faction];
    assert.equal(culture.hierarchy.length, 4);
    assert.ok(culture.headquarters.length > 12);
    assert.ok(culture.livelihoods.length >= 3);
    assert.ok(culture.recruitment.length > 20);
    assert.ok(culture.conduct.length > 20);
  }
  assert.equal(FACTION_CULTURES.military.openRecruitment, false);
  assert.equal(FACTION_CULTURES.monolith.openRecruitment, false);
  assert.ok(FACTION_CULTURES.bandits.betrayalBias > FACTION_CULTURES.duty.betrayalBias);
  assert.ok(FACTION_CULTURES.bandits.bribeBias > FACTION_CULTURES.freedom.bribeBias);
});

test("важный командир получает фракционный ранг, а вступление требует доверия и выполненной работы", () => {
  let state = createGame("stalkers", "squad", null);
  const actor = state.squads.find((squad) => squad.id === state.playerSquadId)!;
  const bandit = state.squads.find((squad) => squad.faction === "bandits" && squad.homeGarrison)!;
  bandit.nodeId = actor.nodeId;
  assert.equal(getFactionRankLabel(bandit), "Пахан");
  assert.equal(getFactionRecruitmentAssessment(state, bandit.id).allowed, false);
  state = { ...state, rubles: 20_000 };
  state = payBanditTribute(state, bandit.id);
  state = payBanditTribute(state, bandit.id);
  state = payBanditTribute(state, bandit.id);
  const banditContract = state.contracts[0];
  banditContract.issuerFaction = "bandits";
  banditContract.status = "completed";
  state.reputation = 2;
  const assessment = getFactionRecruitmentAssessment(state, bandit.id);
  assert.equal(assessment.allowed, true);
  assert.ok(assessment.trust >= assessment.trustRequired);
});

test("нейтралы могут втереться в доверие бандитов, заманить пахана, убить его, забрать и продать трофеи", () => {
  let state = createGame("stalkers", "squad", null);
  const actorId = state.playerSquadId!;
  const actor = state.squads.find((squad) => squad.id === actorId)!;
  const bandit = state.squads.find((squad) => squad.faction === "bandits" && squad.homeGarrison)!;
  actor.nodeId = bandit.nodeId;
  actor.previousNodeId = bandit.nodeId;
  state.selectedNodeId = bandit.nodeId;
  bandit.status = "idle";
  bandit.strength = 12;
  bandit.maxStrength = 12;
  bandit.fighters = 3;
  bandit.maxFighters = 3;
  state.rubles = 25_000;
  state.squadKnowledge.knownNodeIds = state.nodes.map((node) => node.id);
  state = payBanditTribute(state, bandit.id);
  state = payBanditTribute(state, bandit.id);
  state = payBanditTribute(state, bandit.id);
  const targets = getDeceptionTargets(state, bandit.id);
  assert.ok(targets.length > 0);
  state.rngSeed = 0;
  state = startDeceptionPlot(state, bandit.id, targets[0].id);
  assert.equal(state.deceptionPlot?.stage, "luring");
  state.squads.find((squad) => squad.id === actorId)!.nodeId = targets[0].id;
  state.selectedNodeId = targets[0].id;
  state = { ...state, speed: 12 };
  for (let tick = 0; tick < 120 && state.deceptionPlot?.stage === "luring"; tick += 1) state = tickGame(state);
  assert.equal(state.squads.find((squad) => squad.id === actorId)?.nodeId, targets[0].id);
  assert.equal(state.deceptionPlot?.stage, "ready");
  state = springDeceptionAmbush(state);
  assert.equal(state.deceptionPlot?.commanderKilled, true);
  assert.equal(state.squads.find((squad) => squad.id === bandit.id)?.commander, null);
  for (let tick = 0; tick < 80 && state.deceptionPlot?.stage === "ambush"; tick += 1) state = tickGame(state);
  assert.equal(state.deceptionPlot?.stage, "completed");
  assert.equal(state.squads.find((squad) => squad.id === bandit.id)?.status, "dead");
  const lootBeforeSale = state.trophies.weapons + state.trophies.armor + state.trophies.supplies;
  assert.ok(lootBeforeSale > 0);
  const rublesBeforeSale = state.rubles;
  state = sellTrophies(state, "weapons");
  state = sellTrophies(state, "armor");
  state = sellTrophies(state, "supplies");
  assert.ok(state.rubles > rublesBeforeSale);
});

test("отряд может обыскать текущую точку и получить конкретный хабар, а не справочный текст", () => {
  let state = createGame("stalkers", "squad", null);
  const operative = state.operatives[0];
  const beforeItems = Object.values(state.stash).reduce((sum, amount) => sum + (amount ?? 0), 0);
  const beforeRubles = state.rubles;
  state = issueOperativeOrder(state, [operative.id], "search", undefined, "Деревня новичков");
  assert.equal(state.operatives[0].order, "search");
  assert.ok(state.operatives[0].actionUntil !== null);
  for (let minute = 0; minute < 20; minute += 1) state = tickGame(state);
  const afterItems = Object.values(state.stash).reduce((sum, amount) => sum + (amount ?? 0), 0);
  assert.ok(afterItems > beforeItems);
  assert.ok(state.rubles > beforeRubles);
  assert.ok(state.log.some((entry) => /обыск точки/.test(entry.text)));
});

test("разведка с текущего места раскрывает подходы, контакты и создаёт запись в КПК", () => {
  let state = createGame("stalkers", "squad", null);
  const operative = state.operatives.find((item) => item.specialization === "scout") ?? state.operatives[0];
  state = issueOperativeOrder(state, [operative.id], "scout", undefined, "Деревня новичков");
  for (let minute = 0; minute < 26; minute += 1) state = tickGame(state);
  assert.ok(state.squadKnowledge.reports.some((report) => report.title.startsWith("РАЗВЕДКА:")));
  assert.match(state.log[0].text, /разведка точки/);
});
