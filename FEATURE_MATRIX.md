# War Groups: Зона — feature ledger

No item is marked **working** unless it has a reachable UI flow and changes the saved campaign state. Core invariants also require an automated engine test.

## Working in faction doctrine checkpoint

- Faction selection: ten playable factions plus autonomous mutants.
- Stable faction colors across the legend, global markers, squad tokens, tactical tokens, and faction UI.
- Ten data-driven faction doctrines with distinct strategic priorities, economic multipliers, combat behavior, movement, capture speed, suppression resistance, emission resistance, and defensive posture.
- Thirty faction-specific combat archetypes: a named novice, veteran, and master composition for every playable side, each with its own fighters, formation, strength, weapons, armor, ammunition, medicine, and grenades.
- Player and A-Life recruitment both create the faction's actual roster; AI recruitment tier and force size follow the same doctrine data shown in the base interface.
- A-Life raid targets, anomaly expeditions, expansion preferences, allied defense responses, recovery, and patrol tempo react to faction doctrine and current world state.
- Alliances stop targeting, add recurring trade income, and allow autonomous allies to reinforce threatened friendly territory.
- Thirty-one-point global Zone graph plus fourteen complete internal sector maps covering 86 simulation-backed points.
- Every sector has at least six named local positions, its own route graph, terrain palette, landmarks, labels, and persistent faction-control tint.
- Interactive pan, zoom, recenter, full-map, and hazard-layer controls.
- Dedicated maps for the Swamps, Cordon, Garbage, Dark Valley, Agroprom, Rostok, Yantar, Army Warehouses, Dead City, Red Forest, Limansk, Radar, Pripyat/CNPP, and the north-eastern outskirts.
- Functional local routes, player orders, capture, combat, income, garrisons, and shared campaign persistence in every mapped sector.
- Distinct highway, dirt-road, forest-trail, and railway routes with route-specific travel time.
- Toggleable faction-control influence and coordinate-grid layers.
- Local terrain, cover, risk, route, and tactical-value intelligence for all 86 points.
- Controlled local terrain modifies incoming damage, firing effectiveness, and capture time across the Zone.
- Local tactical retreat follows the current sector road graph instead of the global map.
- Every local point has a deterministic, distinct tactical battlefield with sector-specific terrain, roads, cover objects, and danger zones.
- Sector terrain, threat level, grid reference, shelter status, and route intelligence.
- Route highlighting for the selected point and every legal destination of the active squad.
- Pause and three simulation speeds.
- Player and A-Life squad travel constrained to connected points.
- Neutral and hostile capture with visible capture progress.
- Territorial economy every 30 simulated minutes with gross income, rank-and-equipment army upkeep, and a visible net balance.
- Anomaly ownership, artifact recovery, automatic artifact sale, Ecologist yield, Recon yield, and Trade price modifiers.
- Generated capture, artifact, and elimination contracts with offered, accepted, progress, completed, failed, timed, and automatically paid states.
- Combat trophies in three stored categories: weapons, armor, and supplies, with faction modifiers and a working trading screen.
- Squad-level weapon and armor upgrades consume the matching trophies and rubles and alter actual combat calculations.
- Base recruitment: novices, veterans, and research-gated masters, with faction and trade discounts.
- Six research branches: weapons, armor, logistics, medicine, reconnaissance, and trade, all with simulation effects.
- Squad formations: mixed, assault, sniper support, and heavy vanguard, each with simulation effects.
- Real-time hostile combat with ammunition, health, cover, armor, faction bonuses, and casualties.
- Tactical commands: focus fire, grenade, research-scaled medkit, cover, supply-or-ruble resupply, and retreat.
- Autonomous faction expansion, recruitment, and wars without player input.
- Autonomous mutant packs hostile to all factions.
- Emission warning, shelters, exposed-squad casualties, and zombified/mutant conversion.
- Diplomacy: war, truce, alliance, costs, and targeting changes.
- Main-base defeat and territorial-domination victory.
- Local save, autosave, manual save, and continue flow.
- Save migration merges the expanded cartography, economy, contracts, trophies, research, squad gear, faction archetypes, A-Life state, and local garrisons into existing campaigns without discarding ownership or squads.
- Engine tests cover all fourteen map graphs, 86 unique tactical layouts, all ten doctrines and thirty rosters, economy/upkeep, contracts, trophy loot and sales, gear upgrades, research migration, movement, capture, combat, emissions, diplomacy, allied support, long A-Life soaks, and serialization.

## Required before feature-complete alpha

- Named individual weapon/armor inventory and per-fighter loadouts beyond the current squad equipment tiers.
- Distinct mutant species and species-specific combat behavior.
- Faction-specific technology branches beyond the current shared six-branch research tree.
- Radiation accumulation and anti-radiation consumables outside emission logic.
- Final licensed/original audio, ambient loops, combat effects, and faction insignia.
- Long-duration balance soak covering several simulated months for every playable faction.
