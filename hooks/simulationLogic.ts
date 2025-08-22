import type {
    Strand, ActiveSpecialEvent, Anomaly,
    ExplosionEffect, BattleReportStats, FightHistoryData, StatSnapshot,
    GameMode, PlayerTool, PlayerWall, CombatTextEffect, CollisionVfx,
    Vector, ParticleSystem, RelationshipMatrix, ActiveJobEffect, SpecialEventType, StrandName, SimulationStats,
    ActiveUltimate, GlobalEffect, TransientVfx, BoundaryType, AIAggression, CameraTarget
} from '../types';
import {
    SCREEN_WIDTH, SCREEN_HEIGHT, SPECIAL_EVENTS_CONFIG,
    RELATIONSHIP_MODIFIERS, ANOMALY_CONFIG, PLAYER_CONFIG, COLLISION_CONFIG,
    STRAND_COMBAT_STATS, BASE_ULTIMATE_CHARGE_RATE, ULTIMATE_CONFIG, STRAND_ULTIMATE_STATS, LOW_HP_THRESHOLDS
} from '../constants';
import { RelationshipLevel } from '../types';
import { ultimateUpdaters, ultimateEnders, globalEffectUpdaters, globalEffectEnders, healingInterceptors, ultimateTriggers, globalEffectTriggers, damageInterceptors } from '../ultimates';
import { ultimateDecisionMakers, applyLowHpBehavior } from './ai';
import { jobUpdaters } from './jobs';


interface SimulationState {
    strands: Strand[];
    jobEffects: ActiveJobEffect[];
    specialEvents: ActiveSpecialEvent[];
    anomalies: Anomaly[];
    explosionEffects: ExplosionEffect[];
    combatTextEffects: CombatTextEffect[];
    collisionVfx: CollisionVfx[];
    transientVfx: TransientVfx[];
    playerWalls: PlayerWall[];
    activeUltimates: ActiveUltimate[];
    globalEffects: GlobalEffect[];
    activeStrandIndex: number;
    isFightModeActive: boolean;
    isVictoryScreenVisible: boolean;
    winner: Strand | null;
    battleReport: BattleReportStats[];
    historyData: FightHistoryData;
    gameMode: GameMode;
    playerAether: number;
    activePlayerTool: PlayerTool;
    isGravityAnchorActive: boolean;
    mousePosition: Vector;
    prevMousePosition: Vector;
    relationshipMatrix: RelationshipMatrix;
    particleSystem: ParticleSystem;
    simulationState: {
        nextEventTime: number;
        celebrationEndTime: number;
        initialCombatantCount: number;
        fightStartTime: number;
        lastHistoryCaptureTime: number;
        duelAttraction: boolean;
        aiCommentaryCooldown: number;
        commentaryMilestones: number[];
        actionCam: {
            currentTarget: CameraTarget;
            currentTargetId: number | null;
            timeOnTarget: number;
            lastSwitchTime: number;
        };
    };
    simulationStats: SimulationStats;
    screenFlash: { endTime: number; color: string } | null;
    screenShake: { endTime: number; intensity: number } | null;
    deltaTime: number;
    isActionCamActive: boolean;
    simulationSettings: {
        globalSpeed: number;
        bounciness: number;
        friction: number;
        boundaryType: BoundaryType;
        combatStatMultiplier: number;
        ultimateChargeMultiplier: number;
        aiAggression: AIAggression;
        disableLowHpBehaviors: boolean;
    }
}

interface SimulationTickResult {
    nextStrands: Strand[];
    nextJobEffects: ActiveJobEffect[];
    nextSpecialEvents: ActiveSpecialEvent[];
    nextAnomalies: Anomaly[];
    nextExplosionEffects: ExplosionEffect[];
    nextCombatTextEffects: CombatTextEffect[];
    nextCollisionVfx: CollisionVfx[];
    nextTransientVfx: TransientVfx[];
    nextPlayerWalls: PlayerWall[];
    nextActiveUltimates: ActiveUltimate[];
    nextGlobalEffects: GlobalEffect[];
    nextPlayerAether: number;
    nextFightDuration: number;
    nextRelationshipMatrix: RelationshipMatrix;
    nextSimulationStats: SimulationStats;
    nextScreenFlash: { endTime: number; color: string } | null;
    nextScreenShake: { endTime: number; intensity: number } | null;
    nextBattleReport?: BattleReportStats[];
    nextFightHistoryData?: FightHistoryData;
    newLogs: string[];
    newWinner: Strand | null | undefined; // undefined means no change
    shouldShowVictoryScreen: boolean;
    nextSimulationState: SimulationState['simulationState'];
    nextCameraTarget?: CameraTarget;
}

interface RelationshipEvent {
    s1Name: StrandName;
    s2Name: StrandName;
    modifier: number;
}

// Helper to find the closest point on a line segment to a point
const closestPointOnSegment = (p: Vector, a: Vector, b: Vector): Vector => {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const ap = { x: p.x - a.x, y: p.y - a.y };
    const ab2 = ab.x * ab.x + ab.y * ab.y;
    const ap_dot_ab = ap.x * ab.x + ap.y * ab.y;
    const t = Math.max(0, Math.min(1, ap_dot_ab / ab2));
    return { x: a.x + ab.x * t, y: a.y + ab.y * t };
};

const getRelationshipLevelFromScore = (score: number): RelationshipLevel => {
    if (score <= RelationshipLevel.MortalEnemy + 0.2) return RelationshipLevel.MortalEnemy; // Buffer to prevent flipping
    if (score < RelationshipLevel.Acquaintance) return RelationshipLevel.MortalEnemy;
    if (score < RelationshipLevel.Friend) return RelationshipLevel.Acquaintance;
    if (score < RelationshipLevel.Ally) return RelationshipLevel.Friend;
    if (score < RelationshipLevel.BestFriend) return RelationshipLevel.Ally;
    return RelationshipLevel.BestFriend;
};

const getRelationshipLevelName = (level: RelationshipLevel): string => {
    for (const key in RelationshipLevel) {
        if (RelationshipLevel[key as keyof typeof RelationshipLevel] === level) {
            return key.replace(/([A-Z])/g, ' $1').trim();
        }
    }
    return "Unknown";
};


function handleFightCollision(
    s1: Strand,
    s2: Strand,
    collisionPoint: Vector,
    relationshipMatrix: RelationshipMatrix,
    damageMap: Map<number, { amount: number; source: Strand | null; isCrit: boolean }>,
    healMap: Map<number, { amount: number; source: Strand; isCrit: boolean }>,
    nextCollisionVfx: CollisionVfx[],
    relationshipEvents: RelationshipEvent[],
    now: number,
    deltaSeconds: number,
    simulationSettings: SimulationState['simulationSettings']
) {
    const rel1to2 = relationshipMatrix[s1.name]?.[s2.name] ?? RelationshipLevel.Acquaintance;
    const rel2to1 = relationshipMatrix[s2.name]?.[s1.name] ?? RelationshipLevel.Acquaintance;
    
    const processInteraction = (actor: Strand, target: Strand, relationship: RelationshipLevel) => {
        const combatStats = STRAND_COMBAT_STATS[actor.name];
        const { BASE_DAMAGE, BASE_HEAL, CRIT_CHANCE, CRIT_MULTIPLIER, STORED_POWER_BONUS } = COLLISION_CONFIG;

        const powerBonus = 1 + (actor.storedPower * STORED_POWER_BONUS);
        const isCrit = Math.random() < CRIT_CHANCE;
        const critMultiplier = isCrit ? CRIT_MULTIPLIER : 1;
        const statMultiplier = simulationSettings.combatStatMultiplier;
        
        const actorBuffs = actor.tempBuffs?.filter(b => b.endTime > now) || [];
        const berserkBuff = actorBuffs.find(b => b.type === 'LOW_HP_BERSERK');
        const damageBuffMultiplier = berserkBuff ? berserkBuff.multiplier : 1;

        if (relationship >= RelationshipLevel.Friend) {
            const healAmount = BASE_HEAL * combatStats.collisionHealFactor * powerBonus * critMultiplier * statMultiplier;
            const currentHeal = healMap.get(target.id) || { amount: 0, source: actor, isCrit: false };
            healMap.set(target.id, { amount: currentHeal.amount + healAmount, source: actor, isCrit: isCrit || currentHeal.isCrit });
            relationshipEvents.push({ s1Name: actor.name, s2Name: target.name, modifier: RELATIONSHIP_MODIFIERS.COLLISION_HEAL_FRIEND });
            nextCollisionVfx.push({ id: now + Math.random(), position: collisionPoint, life: 500, maxLife: 500, type: 'heal', intensity: isCrit ? 1.0 : 0.5 });
        } else {
            let damageMultiplier = relationship <= RelationshipLevel.MortalEnemy ? 1 : COLLISION_CONFIG.NEUTRAL_DAMAGE_MULTIPLIER;
            const damageAmount = BASE_DAMAGE * combatStats.collisionDamageFactor * powerBonus * damageMultiplier * critMultiplier * statMultiplier * damageBuffMultiplier;
            const currentDamage = damageMap.get(target.id) || { amount: 0, source: actor, isCrit: false };
            damageMap.set(target.id, { amount: currentDamage.amount + damageAmount, source: actor, isCrit: isCrit || currentDamage.isCrit });

            if (isCrit) {
                relationshipEvents.push({ s1Name: actor.name, s2Name: target.name, modifier: RELATIONSHIP_MODIFIERS.COLLISION_CRIT_ENEMY });
                nextCollisionVfx.push({ id: now + Math.random(), position: collisionPoint, life: 700, maxLife: 700, type: 'crit', intensity: 1.0 });
            } else {
                const relMod = relationship <= RelationshipLevel.MortalEnemy ? RELATIONSHIP_MODIFIERS.COLLISION_DAMAGE_ENEMY : RELATIONSHIP_MODIFIERS.COLLISION_DAMAGE_NEUTRAL;
                relationshipEvents.push({ s1Name: actor.name, s2Name: target.name, modifier: relMod });
                nextCollisionVfx.push({ id: now + Math.random(), position: collisionPoint, life: 500, maxLife: 500, type: 'damage', intensity: 0.7 });
            }
        }
    };
    
    processInteraction(s1, s2, rel1to2);
    processInteraction(s2, s1, rel2to1);
    
    s1.storedPower = Math.min(200, s1.storedPower + STRAND_COMBAT_STATS[s1.name].storedPowerRate * deltaSeconds);
    s2.storedPower = Math.min(200, s2.storedPower + STRAND_COMBAT_STATS[s2.name].storedPowerRate * deltaSeconds);
}


export const runSimulationTick = (state: SimulationState): SimulationTickResult => {
    const {
        strands, jobEffects, specialEvents, anomalies,
        explosionEffects, combatTextEffects, collisionVfx, transientVfx, playerWalls,
        activeUltimates, globalEffects,
        isFightModeActive, winner, battleReport, historyData, gameMode, playerAether,
        activePlayerTool, isGravityAnchorActive, mousePosition, prevMousePosition,
        relationshipMatrix, particleSystem, simulationState, simulationStats,
        screenFlash, screenShake, deltaTime, simulationSettings, isActionCamActive
    } = state;

    const adjustedDeltaTime = deltaTime * simulationSettings.globalSpeed;
    const deltaSeconds = adjustedDeltaTime / 1000;
    const normalizedDelta = Math.min(2, adjustedDeltaTime / 16.67);
    const now = Date.now();

    let nextStrands: Strand[] = strands.map(s => ({ ...s, tempSpeedModifier: 1.0, mouseVelocity: { x: 0, y: 0 } }));
    let nextJobEffects = [...jobEffects];
    let nextSpecialEvents = [...specialEvents];
    let nextAnomalies = [...anomalies];
    let nextExplosionEffects = [...explosionEffects];
    let nextCombatTextEffects = [...combatTextEffects];
    let nextCollisionVfx = [...collisionVfx];
    let nextTransientVfx = [...transientVfx];
    let nextPlayerWalls = [...playerWalls];
    let nextActiveUltimates = [...activeUltimates];
    let nextGlobalEffects = [...globalEffects];
    let nextPlayerAether = playerAether;
    let nextFightDuration = isFightModeActive ? (now - simulationState.fightStartTime) / 1000 : 0;
    let nextBattleReport: BattleReportStats[] | undefined = undefined;
    let nextFightHistoryData: FightHistoryData | undefined = undefined;
    let nextRelationshipMatrix = JSON.parse(JSON.stringify(relationshipMatrix));
    let nextScreenFlash = screenFlash && now < screenFlash.endTime ? screenFlash : null;
    let nextScreenShake = screenShake && now < screenShake.endTime ? screenShake : null;
    const nextSimulationStats = {
      ...simulationStats,
      player: {
        ...simulationStats.player,
        timeWithToolActive: new Map(simulationStats.player.timeWithToolActive),
        abilitiesUsed: new Map(simulationStats.player.abilitiesUsed),
      },
       ultimatesUsed: new Map(simulationStats.ultimatesUsed),
    };

    const newLogs: string[] = [];
    let newWinner: Strand | null | undefined = undefined;
    let shouldShowVictoryScreen = false;
    const nextSimulationState = { ...simulationState };
    const relationshipEvents: RelationshipEvent[] = [];

    // --- Tick-wide effect accumulators ---
    const damageMap = new Map<number, { amount: number; source: Strand | null; isCrit: boolean }>();
    const healMap = new Map<number, { amount: number; source: Strand; isCrit: boolean }>();
    const healthSetMap = new Map<number, number>();
    const forces = new Map<number, Vector>();
    const jobForces = new Map<number, Vector>();
    const effects = new Map<number, { type: string, value: any }[]>();
    const ultimateChargeGains = new Map<number, number>();
    const healingBlocked = new Map<number, boolean>();
    const damageModifierMap = new Map<number, { targetId: number, multiplier: number }>();


    // Player Mode Logic
    if (gameMode === 'PLAYER') {
        const mouseVel = { x: mousePosition.x - prevMousePosition.x, y: mousePosition.y - prevMousePosition.y };
        const isMouseMoving = mouseVel.x !== 0 || mouseVel.y !== 0;

        let aetherDrain = 0;
        if (isGravityAnchorActive) {
            aetherDrain += PLAYER_CONFIG.GRAVITY_ANCHOR.AETHER_DRAIN_RATE * deltaSeconds;
            nextSimulationStats.player.gravityAnchorTime += deltaSeconds;
        } else if (isMouseMoving) {
            if (activePlayerTool === 'REPEL') {
                aetherDrain += PLAYER_CONFIG.REPEL.AETHER_COST_PER_MOVE * normalizedDelta;
                const newTime = (nextSimulationStats.player.timeWithToolActive.get('REPEL') || 0) + deltaSeconds;
                nextSimulationStats.player.timeWithToolActive.set('REPEL', newTime);
            } else if (activePlayerTool === 'CURRENT') {
                aetherDrain += PLAYER_CONFIG.CURRENT.AETHER_COST_PER_MOVE * normalizedDelta;
                 const newTime = (nextSimulationStats.player.timeWithToolActive.get('CURRENT') || 0) + deltaSeconds;
                nextSimulationStats.player.timeWithToolActive.set('CURRENT', newTime);
            }
        }

        if (aetherDrain > 0 && playerAether > 0) {
            const drained = Math.min(playerAether, aetherDrain);
            nextPlayerAether = playerAether - drained;
            nextSimulationStats.player.aetherSpent += drained;
        } else {
            nextPlayerAether = Math.min(PLAYER_CONFIG.AETHER_MAX, playerAether + PLAYER_CONFIG.AETHER_REGEN_RATE * deltaSeconds);
        }
        
        nextPlayerWalls = playerWalls.filter(wall => wall.endTime > now);
    }

    // --- Update Ultimates and Global Effects ---
    if (isFightModeActive) {
        const processUltimateResults = (res: any, ult: ActiveUltimate | GlobalEffect) => {
            const sourceId = 'sourceStrandId' in ult ? ult.sourceStrandId : ult.data.sourceId;
            const sourceStrand = nextStrands.find(s => s.id === sourceId);

            if (res.damageMap) res.damageMap.forEach((val: number, key: number) => damageMap.set(key, { amount: val, source: sourceStrand!, isCrit: false }));
            if (res.healMap) res.healMap.forEach((val: number, key: number) => healMap.set(key, { amount: val, source: sourceStrand!, isCrit: false }));
            if (res.healthSetMap) res.healthSetMap.forEach((val: number, key: number) => healthSetMap.set(key, val));
            if (res.forces) res.forces.forEach((force: Vector, strandId: number) => forces.set(strandId, { x: (forces.get(strandId)?.x || 0) + force.x, y: (forces.get(strandId)?.y || 0) + force.y }));
            if (res.effects) res.effects.forEach((eff: any) => {
                if (!effects.has(eff.strandId)) effects.set(eff.strandId, []);
                effects.get(eff.strandId)!.push({ type: eff.type, value: eff.value });
            });
            if (res.healingBlocked) res.healingBlocked.forEach((val: boolean, key: number) => healingBlocked.set(key, val));
            if (res.damageModifierMap) res.damageModifierMap.forEach((val: any, key: number) => damageModifierMap.set(key, val));

            if (res.instantDamage) res.instantDamage.forEach((val: number, key: number) => damageMap.set(key, { amount: val, source: sourceStrand!, isCrit: false }));
            if (res.instantChargeGain) res.instantChargeGain.forEach((val: number, key: number) => ultimateChargeGains.set(key, (ultimateChargeGains.get(key) || 0) + val));
            
            if (res.explosionTrigger) {
                nextExplosionEffects.push({ id: now + Math.random(), position: ('position' in ult ? ult.position : res.position), life: 1000, maxLife: 1000, intensity: 0.8 });
            }
            if (res.screenShake) {
                nextScreenShake = { endTime: now + 300, intensity: 15 };
            }

            if (res.visualEffects) {
                res.visualEffects.forEach((vfx: any) => {
                    switch (vfx.type) {
                        case 'BURN_FLASH':
                            nextCollisionVfx.push({ id: now + Math.random(), position: vfx.position, life: 300, maxLife: 300, type: 'crit', intensity: vfx.data.intensity || 0.8 });
                            break;
                        case 'CHARGE_SURGE':
                            nextTransientVfx.push({ id: now + Math.random(), type: 'CHARGE_SURGE', targetId: vfx.data.targetId, life: 1500, maxLife: 1500, data: { amount: vfx.data.amount, color: vfx.data.color } });
                            break;
                        case 'SCREEN_FLASH':
                            nextScreenFlash = { endTime: now + (vfx.data.duration * 1000), color: vfx.data.color };
                            break;
                        case 'COMBAT_TEXT':
                            nextCombatTextEffects.push({ id: now + Math.random(), position: vfx.position, text: vfx.data.text, color: vfx.data.color, life: 1200, maxLife: 1200, velocity: {x:0, y:-1}});
                            break;
                    }
                });
            }
        };

        nextActiveUltimates = nextActiveUltimates.map(ult => {
            ult.life -= deltaSeconds;
            const updater = ultimateUpdaters[ult.type as keyof typeof ultimateUpdaters];
            if (updater) {
                const res = (updater as any)(ult, nextStrands, deltaSeconds, now, (msg: string) => newLogs.push(msg), relationshipEvents, nextRelationshipMatrix);
                processUltimateResults(res, ult);
            }
            return ult;
        }).filter(ult => {
            if (ult.life <= 0) {
                const ender = ultimateEnders[ult.type as keyof typeof ultimateEnders];
                if (ender) ender(ult, nextStrands, (msg: string) => newLogs.push(msg));
                return false;
            }
            return true;
        });

        nextGlobalEffects = nextGlobalEffects.map(effect => {
            const updater = globalEffectUpdaters[effect.type as keyof typeof globalEffectUpdaters];
            if (updater) {
                const res = (updater as any)(effect, nextStrands, deltaSeconds, now, (msg: string) => newLogs.push(msg), relationshipEvents, nextRelationshipMatrix);
                processUltimateResults(res, effect);
            }
            return effect;
        }).filter(effect => {
            if (effect.endTime <= now) {
                const ender = globalEffectEnders[effect.type as keyof typeof globalEffectEnders];
                if (ender) ender(effect, nextStrands, (msg: string) => newLogs.push(msg));
                return false;
            }
            return true;
        });
    }

    // Fight Mode Timers & History
    if (isFightModeActive) {
        if (nextFightDuration - nextSimulationState.lastHistoryCaptureTime >= 1) {
            nextSimulationState.lastHistoryCaptureTime = Math.floor(nextFightDuration);
            const newSnapshot: StatSnapshot = {
                time: nextSimulationState.lastHistoryCaptureTime,
                stats: battleReport.map(r => ({
                    strandId: r.strandId, damageDealt: r.damageDealt, healingDone: r.healingDone, damageTaken: r.damageTaken,
                })),
                survivorCount: strands.filter(s => s.visible && !s.isDefeated).length,
            };
            nextFightHistoryData = [...historyData, newSnapshot];
        }
    }

    if (nextSimulationState.celebrationEndTime > 0 && now >= nextSimulationState.celebrationEndTime) {
        shouldShowVictoryScreen = true;
        nextSimulationState.celebrationEndTime = 0;
    }

    // Anomaly/Event Spawning
    if (now > nextSimulationState.nextEventTime && specialEvents.length === 0) {
        const eventTypes: SpecialEventType[] = ['METEOR_SHOWER', 'COLOR_SHIFT', 'SPEED_BOOST_ZONE'];
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const config = SPECIAL_EVENTS_CONFIG[type];
        const newEvent: ActiveSpecialEvent = { id: now, type, endTime: now + config.DURATION, data: {} };

        if (type === 'METEOR_SHOWER') {
            newEvent.data.meteors = Array.from({ length: SPECIAL_EVENTS_CONFIG.METEOR_SHOWER.COUNT }).map(() => ({
                position: { x: Math.random() * SCREEN_WIDTH, y: -20 },
                velocity: { x: (Math.random() - 0.5) * 4, y: SPECIAL_EVENTS_CONFIG.METEOR_SHOWER.SPEED }
            }));
            newLogs.push("A meteor shower begins!");
        } else if (type === 'SPEED_BOOST_ZONE') {
            newEvent.data.zone = { position: { x: Math.random() * SCREEN_WIDTH, y: Math.random() * SCREEN_HEIGHT }, radius: SPECIAL_EVENTS_CONFIG.SPEED_BOOST_ZONE.RADIUS };
            newLogs.push("A speed boost zone has appeared!");
        } else if (type === 'COLOR_SHIFT') {
            newEvent.data.hueShift = 0;
            newLogs.push("The cosmic colors are shifting!");
        }

        nextSpecialEvents.push(newEvent);
        nextSimulationState.nextEventTime = now + SPECIAL_EVENTS_CONFIG.MIN_INTERVAL + Math.random() * (SPECIAL_EVENTS_CONFIG.MAX_INTERVAL - SPECIAL_EVENTS_CONFIG.MIN_INTERVAL);
    }
    
    if (Math.random() < ANOMALY_CONFIG.STARDUST_MOTE.SPAWN_CHANCE * normalizedDelta && anomalies.filter(a => a.type === 'STARDUST_MOTE').length < ANOMALY_CONFIG.STARDUST_MOTE.MAX_COUNT) {
        nextAnomalies.push({ id: now, type: 'STARDUST_MOTE', position: { x: Math.random() * SCREEN_WIDTH, y: Math.random() * SCREEN_HEIGHT }, radius: ANOMALY_CONFIG.STARDUST_MOTE.RADIUS });
    }
    if (Math.random() < ANOMALY_CONFIG.WHISPERING_CRYSTAL.SPAWN_CHANCE * normalizedDelta && anomalies.filter(a => a.type === 'WHISPERING_CRYSTAL').length < ANOMALY_CONFIG.WHISPERING_CRYSTAL.MAX_COUNT) {
        newLogs.push("A Whispering Crystal has formed.");
        nextAnomalies.push({ id: now, type: 'WHISPERING_CRYSTAL', position: { x: Math.random() * (SCREEN_WIDTH - 200) + 100, y: Math.random() * (SCREEN_HEIGHT - 200) + 100 }, radius: ANOMALY_CONFIG.WHISPERING_CRYSTAL.RADIUS });
    }

    // Update effect lifecycles
    nextJobEffects = jobEffects
        .map(e => ({...e, life: e.life - adjustedDeltaTime}))
        .filter(e => e.life > 0);

    nextSpecialEvents = specialEvents.map(e => {
        if (e.type === 'METEOR_SHOWER' && e.data.meteors) {
            e.data.meteors.forEach(m => {
                m.position.x += m.velocity.x * normalizedDelta;
                m.position.y += m.velocity.y * normalizedDelta;
            });
            e.data.meteors = e.data.meteors.filter(m => m.position.y < SCREEN_HEIGHT + 20);
        } else if (e.type === 'COLOR_SHIFT' && e.data.hueShift !== undefined) {
            e.data.hueShift = (e.data.hueShift + SPECIAL_EVENTS_CONFIG.COLOR_SHIFT.SPEED * normalizedDelta) % 360;
        }
        return e;
    }).filter(e => e.endTime > now);

    nextExplosionEffects = explosionEffects
        .map(e => ({ ...e, life: e.life - adjustedDeltaTime }))
        .filter(e => e.life > 0);

    nextCombatTextEffects = combatTextEffects
        .map(e => ({ ...e, life: e.life - adjustedDeltaTime, position: { x: e.position.x + e.velocity.x * normalizedDelta, y: e.position.y + e.velocity.y * normalizedDelta }}))
        .filter(e => e.life > 0);

    nextCollisionVfx = collisionVfx
        .map(vfx => ({...vfx, life: vfx.life - adjustedDeltaTime}))
        .filter(vfx => vfx.life > 0);
        
    nextTransientVfx = transientVfx
        .map(vfx => ({...vfx, life: vfx.life - adjustedDeltaTime}))
        .filter(vfx => vfx.life > 0);
    
    particleSystem.update();
    
    // Update Strands
    nextStrands.forEach(s => {
        if (!s.visible || s.isDefeated) return;

        // Reset glow color at the beginning of each tick
        s.glowColor = null;

        // --- BOT MODE: JOB SYSTEM ---
        if (gameMode === 'BOT' && !isFightModeActive) {
            const jobUpdater = jobUpdaters[s.name];
            if (jobUpdater) {
                const jobResult = jobUpdater(s, nextStrands, now, relationshipMatrix);
                if (jobResult.newJobEffects) {
                    nextJobEffects.push(...jobResult.newJobEffects);
                }
                if (jobResult.newLogs) {
                    newLogs.push(...jobResult.newLogs);
                }
                if (jobResult.relationshipEvents) {
                    relationshipEvents.push(...jobResult.relationshipEvents);
                }
                if (jobResult.forces) {
                    jobResult.forces.forEach((force, strandId) => {
                        const currentForce = jobForces.get(strandId) || { x: 0, y: 0 };
                        jobForces.set(strandId, { x: currentForce.x + force.x, y: currentForce.y + force.y });
                    });
                }
            }
        }
        
        // --- FIGHT MODE: ULTIMATES & AI ---
        if (isFightModeActive) {
            // Low HP Behavior Check
            if (!simulationSettings.disableLowHpBehaviors) {
                const hpPercent = s.health / s.maxHealth;
                const threshold = LOW_HP_THRESHOLDS[s.name];
                if (hpPercent <= threshold && !s.isInLowHpState) {
                    s.isInLowHpState = true;
                    newLogs.push(`${s.name} is in a desperate state!`);
                    nextTransientVfx.push({
                        id: now + Math.random(),
                        type: 'LOW_HP_ACTIVATION',
                        targetId: s.id,
                        life: 500,
                        maxLife: 500,
                        data: {}
                    });
                } else if (hpPercent > threshold && s.isInLowHpState) {
                    s.isInLowHpState = false;
                }
            }

            if (gameMode === 'BOT') {
                let behaviorHandled = false;
                // Apply Low HP behavior if active
                if (s.isInLowHpState) {
                    const allies = nextStrands.filter(other => other.id !== s.id && (relationshipMatrix[s.name]?.[other.name] ?? 0) >= RelationshipLevel.Friend);
                    const enemies = nextStrands.filter(other => other.id !== s.id && (relationshipMatrix[s.name]?.[other.name] ?? 0) < RelationshipLevel.Friend);
                    const result = applyLowHpBehavior(s, enemies, allies, now);
                    const currentForce = forces.get(s.id) || { x: 0, y: 0 };
                    forces.set(s.id, { x: currentForce.x + result.force.x, y: currentForce.y + result.force.y });
                    behaviorHandled = true;
                }

                // Special duel attraction logic
                if (!behaviorHandled && simulationState.duelAttraction && nextStrands.filter(str => str.visible && !str.isDefeated).length === 2) {
                    const otherStrand = nextStrands.find(other => other.id !== s.id && other.visible && !other.isDefeated);
                    if (otherStrand) {
                        if (!s.jobState.duelState) {
                            s.jobState.duelState = { phase: 'STALK', phaseEndTime: now + 3000 + Math.random() * 2000 };
                        }
                        if (now > s.jobState.duelState.phaseEndTime) {
                            const currentPhase = s.jobState.duelState.phase;
                            if (currentPhase === 'STALK') { s.jobState.duelState = { phase: 'ENGAGE', phaseEndTime: now + 2000 + Math.random() * 2000 }; }
                            else if (currentPhase === 'ENGAGE') { s.jobState.duelState = { phase: Math.random() > 0.4 ? 'STALK' : 'REPOSITION', phaseEndTime: now + (Math.random() > 0.4 ? 3000 : 1000) + Math.random() * 2000 }; }
                            else { s.jobState.duelState = { phase: 'STALK', phaseEndTime: now + 3000 + Math.random() * 2000 }; }
                        }
                        const dx = otherStrand.position.x - s.position.x;
                        const dy = otherStrand.position.y - s.position.y;
                        const distance = Math.max(1, Math.hypot(dx, dy));
                        const angle = Math.atan2(dy, dx);
                        switch(s.jobState.duelState.phase) {
                            case 'STALK': {
                                const idealDistance = SCREEN_WIDTH / 4;
                                const distanceError = distance - idealDistance;
                                s.velocity.x += (dx / distance) * distanceError * 0.01 * normalizedDelta;
                                s.velocity.y += (dy / distance) * distanceError * 0.01 * normalizedDelta;
                                const circleDir = s.id > otherStrand.id ? 1 : -1;
                                s.velocity.x += (-dy / distance) * 0.03 * circleDir * normalizedDelta;
                                s.velocity.y += (dx / distance) * 0.03 * circleDir * normalizedDelta;
                                break;
                            }
                            case 'ENGAGE': {
                                const attractionStrength = Math.min(0.1, 0.02 + (0.003 * nextFightDuration));
                                s.velocity.x += Math.cos(angle) * attractionStrength * normalizedDelta;
                                s.velocity.y += Math.sin(angle) * attractionStrength * normalizedDelta;
                                break;
                            }
                            case 'REPOSITION': {
                                s.velocity.x -= Math.cos(angle) * 0.06 * normalizedDelta;
                                s.velocity.y -= Math.sin(angle) * 0.06 * normalizedDelta;
                                break;
                            }
                        }
                    }
                     behaviorHandled = true;
                } 
                
                if (!behaviorHandled) {
                     // --- AI Movement for BOTs in Fight Mode ---
                    let target: Strand | null = null;
                    let nearestEnemyDist = Infinity;
                    
                    for (const other of nextStrands) {
                        if (other.id === s.id || !other.visible || other.isDefeated) continue;
                        const rel = nextRelationshipMatrix[s.name]?.[other.name] ?? RelationshipLevel.Acquaintance;
                        if (rel <= RelationshipLevel.Acquaintance) {
                            const dist = Math.hypot(s.position.x - other.position.x, s.position.y - other.position.y);
                            if (dist < nearestEnemyDist) {
                                nearestEnemyDist = dist;
                                target = other;
                            }
                        }
                    }

                    if (target) {
                        const idealDistance = (s.radius + target.radius) * 3;
                        const distanceToTarget = nearestEnemyDist;
                        const angle = Math.atan2(target.position.y - s.position.y, target.position.x - s.position.x);
                        const aggressionFactor = 0.04;

                        if (distanceToTarget > idealDistance) {
                            s.velocity.x += Math.cos(angle) * aggressionFactor * normalizedDelta;
                            s.velocity.y += Math.sin(angle) * aggressionFactor * normalizedDelta;
                        } else {
                            const circlingForce = aggressionFactor * 0.5;
                            s.velocity.x += Math.cos(angle + Math.PI / 2) * circlingForce * normalizedDelta;
                            s.velocity.y += Math.sin(angle + Math.PI / 2) * circlingForce * normalizedDelta;
                        }
                    } else {
                        const wanderStrength = 0.01;
                        s.velocity.x += (Math.random() - 0.5) * wanderStrength * normalizedDelta;
                        s.velocity.y += (Math.random() - 0.5) * wanderStrength * normalizedDelta;
                    }
                }
            }
            
            // --- Ultimate logic ---
            s.ultimateCooldown = Math.max(0, s.ultimateCooldown - deltaSeconds);
            if (s.ultimateCooldown <= 0) {
                let chargeMultiplier = 1.0;
                const chargeBuff = s.tempBuffs?.find(b => b.type === 'LOW_HP_CHARGE' && b.endTime > now);
                if (chargeBuff) {
                    chargeMultiplier = chargeBuff.multiplier ?? 1.0;
                }
                
                let chargeThisFrame = (BASE_ULTIMATE_CHARGE_RATE * simulationSettings.ultimateChargeMultiplier * chargeMultiplier) * deltaSeconds;
                if(s.playerBuffs?.some(b => b.type === 'FAVOR' && b.endTime > now)) {
                    chargeThisFrame += PLAYER_CONFIG.FAVOR.CHARGE_BONUS * deltaSeconds;
                }
                if (ultimateChargeGains.has(s.id)) {
                    chargeThisFrame += ultimateChargeGains.get(s.id)!;
                }
                s.ultimateCharge = Math.min(s.maxUltimateCharge, s.ultimateCharge + chargeThisFrame);
            }

            // AI Ultimate Trigger Logic
            if (gameMode === 'BOT' && s.ultimateCharge >= s.maxUltimateCharge && s.ultimateCooldown <= 0) {
                const decisionMaker = ultimateDecisionMakers[s.name as keyof typeof ultimateDecisionMakers];
                if (decisionMaker && decisionMaker(s, nextStrands, nextActiveUltimates, nextGlobalEffects, simulationSettings.aiAggression)) {
                    const ultConfig = ULTIMATE_CONFIG[s.name];
                    const ultName = ultConfig.NAME;
                    
                    if (ultName in ultimateTriggers) {
                        const triggerFn = ultimateTriggers[ultName as keyof typeof ultimateTriggers];
                        const newUltimate = triggerFn(s, nextStrands, now, nextRelationshipMatrix);
                        nextActiveUltimates.push(newUltimate);
                    } else if (ultName in globalEffectTriggers) {
                        const triggerFn = globalEffectTriggers[ultName as keyof typeof globalEffectTriggers];
                        const newEffect = triggerFn(s, nextStrands, now, nextRelationshipMatrix);
                        nextGlobalEffects.push(newEffect);
                    }
                    
                    newLogs.push(`${s.name} used ${ultName.replace(/_/g, ' ')}!`);
                    
                    nextSimulationStats.ultimatesUsed.set(s.name, (nextSimulationStats.ultimatesUsed.get(s.name) || 0) + 1);
                    if (!nextBattleReport) {
                        nextBattleReport = [...battleReport];
                    }
                    nextBattleReport = nextBattleReport.map(r => 
                        r.name === s.name ? { ...r, ultimatesUsed: r.ultimatesUsed + 1 } : r
                    );

                    s.ultimateCharge = 0;
                    s.ultimateCooldown = STRAND_ULTIMATE_STATS[s.name].cooldown;
                }
            }
        }

        // Player Buffs/Debuffs
        s.playerBuffs = s.playerBuffs?.filter(b => b.endTime > now);
        s.tempBuffs = s.tempBuffs?.filter(b => b.endTime > now);
        const isStasised = s.playerBuffs?.some(b => b.type === 'STASIS');

        // Job Effect Physics
        nextJobEffects.forEach(effect => {
            if (effect.type === 'GRAVITY_WELL' && s.id !== effect.data?.sourceId) {
                const dist = Math.hypot(s.position.x - effect.position.x, s.position.y - effect.position.y);
                if (dist > 1 && dist < effect.radius!) {
                    const pullForce = (1 - dist / effect.radius!) * (effect.data?.strength || 0.02);
                    const angle = Math.atan2(effect.position.y - s.position.y, effect.position.x - s.position.x);
                    s.velocity.x += Math.cos(angle) * pullForce * normalizedDelta;
                    s.velocity.y += Math.sin(angle) * pullForce * normalizedDelta;
                }
            }
        });
        
        // Player Interaction Forces
        if (gameMode === 'PLAYER' && !isStasised) {
             const distToMouse = Math.hypot(s.position.x - mousePosition.x, s.position.y - mousePosition.y);
             if (isGravityAnchorActive && distToMouse < PLAYER_CONFIG.GRAVITY_ANCHOR.RADIUS) {
                 const angle = Math.atan2(mousePosition.y - s.position.y, mousePosition.x - s.position.x);
                 const force = (1 - distToMouse / PLAYER_CONFIG.GRAVITY_ANCHOR.RADIUS) * PLAYER_CONFIG.GRAVITY_ANCHOR.STRENGTH;
                 s.velocity.x += Math.cos(angle) * force;
                 s.velocity.y += Math.sin(angle) * force;
             } else if (activePlayerTool === 'REPEL' && distToMouse < PLAYER_CONFIG.REPEL.RADIUS) {
                 const angle = Math.atan2(s.position.y - mousePosition.y, s.position.x - mousePosition.x);
                 const force = (1 - distToMouse / PLAYER_CONFIG.REPEL.RADIUS) * PLAYER_CONFIG.REPEL.STRENGTH;
                 s.velocity.x += Math.cos(angle) * force;
                 s.velocity.y += Math.sin(angle) * force;
             } else if (activePlayerTool === 'CURRENT' && distToMouse < PLAYER_CONFIG.CURRENT.RADIUS) {
                const mouseVel = { x: mousePosition.x - prevMousePosition.x, y: mousePosition.y - prevMousePosition.y };
                const force = (1 - distToMouse / PLAYER_CONFIG.CURRENT.RADIUS) * PLAYER_CONFIG.CURRENT.STRENGTH;
                s.mouseVelocity = { x: mouseVel.x * force, y: mouseVel.y * force };
             }
        }

        // --- Add wandering force to prevent stagnation in BOT mode ---
        if (gameMode === 'BOT' && !isFightModeActive) {
            const isImmobileJob = s.jobState.isChanneling || s.jobState.isAnchoring;
            if (!isImmobileJob) {
                const wanderStrength = 0.01;
                s.velocity.x += (Math.random() - 0.5) * wanderStrength * normalizedDelta;
                s.velocity.y += (Math.random() - 0.5) * wanderStrength * normalizedDelta;
            }
        }

        // Apply forces from ultimates
        if (forces.has(s.id)) {
            const force = forces.get(s.id)!;
            s.velocity.x += force.x;
            s.velocity.y += force.y;
        }

        // Apply forces from jobs
        if (jobForces.has(s.id)) {
            const force = jobForces.get(s.id)!;
            s.velocity.x += force.x;
            s.velocity.y += force.y;
        }

        // Apply effects from ultimates
        if (effects.has(s.id)) {
            effects.get(s.id)!.forEach(effect => {
                if (effect.type === 'SPEED_MODIFIER') s.tempSpeedModifier *= effect.value;
                if (effect.type === 'IMMOBILIZE') { s.velocity = {x:0, y:0}; s.tempSpeedModifier = 0; }
            });
        }
        
        // Apply special event effects
        specialEvents.forEach(event => {
            if (event.type === 'METEOR_SHOWER' && event.data.meteors) {
                event.data.meteors.forEach(m => {
                    const dist = Math.hypot(s.position.x - m.position.x, s.position.y - m.position.y);
                    if (dist < s.radius + 10) {
                        const pushAngle = Math.atan2(s.position.y - m.position.y, s.position.x - m.position.x);
                        s.velocity.x += Math.cos(pushAngle) * SPECIAL_EVENTS_CONFIG.METEOR_SHOWER.PUSH_STRENGTH;
                        s.velocity.y += Math.sin(pushAngle) * SPECIAL_EVENTS_CONFIG.METEOR_SHOWER.PUSH_STRENGTH;
                    }
                });
            } else if (event.type === 'SPEED_BOOST_ZONE' && event.data.zone) {
                 const dist = Math.hypot(s.position.x - event.data.zone.position.x, s.position.y - event.data.zone.position.y);
                 if (dist < s.radius + event.data.zone.radius) {
                     s.tempSpeedModifier *= SPECIAL_EVENTS_CONFIG.SPEED_BOOST_ZONE.BOOST_FACTOR;
                 }
            }
        });
        
        // --- Cap total velocity to prevent runaway speeds ---
        const maxVelocity = 4.0;
        const speedSq = s.velocity.x * s.velocity.x + s.velocity.y * s.velocity.y;
        if (speedSq > maxVelocity * maxVelocity) {
            const speed = Math.sqrt(speedSq);
            s.velocity.x = (s.velocity.x / speed) * maxVelocity;
            s.velocity.y = (s.velocity.y / speed) * maxVelocity;
        }

        // Apply friction
        s.velocity.x *= simulationSettings.friction;
        s.velocity.y *= simulationSettings.friction;

        // --- UPDATE POSITION ---
        if (!isStasised && !s.jobState.isChanneling && !s.jobState.isAnchoring) {
            const finalSpeed = s.speed * s.tempSpeedModifier;
            s.position.x += (s.velocity.x + s.mouseVelocity.x) * finalSpeed * normalizedDelta;
            s.position.y += (s.velocity.y + s.mouseVelocity.y) * finalSpeed * normalizedDelta;
        }

        // --- BOUNDARY DETECTION ---
        const { bounciness, boundaryType } = simulationSettings;
        if (boundaryType === 'BOUNCE') {
             if (s.position.x - s.radius < 0) {
                s.position.x = s.radius;
                s.velocity.x *= -bounciness;
            } else if (s.position.x + s.radius > SCREEN_WIDTH) {
                s.position.x = SCREEN_WIDTH - s.radius;
                s.velocity.x *= -bounciness;
            }
            if (s.position.y - s.radius < 0) {
                s.position.y = s.radius;
                s.velocity.y *= -bounciness;
            } else if (s.position.y + s.radius > SCREEN_HEIGHT) {
                s.position.y = SCREEN_HEIGHT - s.radius;
                s.velocity.y *= -bounciness;
            }
        } else { // WRAP
            if (s.position.x + s.radius < 0) s.position.x = SCREEN_WIDTH + s.radius;
            if (s.position.x - s.radius > SCREEN_WIDTH) s.position.x = -s.radius;
            if (s.position.y + s.radius < 0) s.position.y = SCREEN_HEIGHT + s.radius;
            if (s.position.y - s.radius > SCREEN_HEIGHT) s.position.y = -s.radius;
        }
    });

    // --- Collision Detection and Resolution ---
    for (let i = 0; i < nextStrands.length; i++) {
        for (let j = i + 1; j < nextStrands.length; j++) {
            const s1 = nextStrands[i];
            const s2 = nextStrands[j];

            if (!s1.visible || !s2.visible || s1.isDefeated || s2.isDefeated) continue;

            const dx = s2.position.x - s1.position.x;
            const dy = s2.position.y - s1.position.y;
            const distance = Math.hypot(dx, dy);
            const minDistance = s1.radius + s2.radius;

            if (distance < minDistance) {
                nextSimulationStats.totalCollisions++;
                
                const overlap = minDistance - distance;
                const angle = Math.atan2(dy, dx);
                const pushX = (overlap / 2) * Math.cos(angle);
                const pushY = (overlap / 2) * Math.sin(angle);

                s1.position.x -= pushX;
                s1.position.y -= pushY;
                s2.position.x += pushX;
                s2.position.y += pushY;

                const normalX = dx / distance;
                const normalY = dy / distance;
                const tangentX = -normalY;
                const tangentY = normalX;

                const v1n = s1.velocity.x * normalX + s1.velocity.y * normalY;
                const v1t = s1.velocity.x * tangentX + s1.velocity.y * tangentY;
                const v2n = s2.velocity.x * normalX + s2.velocity.y * normalY;
                const v2t = s2.velocity.x * tangentX + s2.velocity.y * tangentY;

                const m1 = s1.radius * s1.radius;
                const m2 = s2.radius * s2.radius;

                const v1n_final = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
                const v2n_final = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);
                
                const { bounciness } = simulationSettings;
                s1.velocity.x = (v1n_final * normalX + v1t * tangentX) * bounciness;
                s1.velocity.y = (v1n_final * normalY + v1t * tangentY) * bounciness;
                s2.velocity.x = (v2n_final * normalX + v2t * tangentX) * bounciness;
                s2.velocity.y = (v2n_final * normalY + v2t * tangentY) * bounciness;
                
                if (isFightModeActive) {
                    const collisionPoint = { x: s1.position.x + pushX, y: s1.position.y + pushY };
                    handleFightCollision(s1, s2, collisionPoint, nextRelationshipMatrix, damageMap, healMap, nextCollisionVfx, relationshipEvents, now, deltaSeconds, simulationSettings);
                }
            }
        }
    }

     // --- Apply Damage and Healing & Check for Defeat ---
    if (isFightModeActive) {
        if (!nextBattleReport) {
            nextBattleReport = [...battleReport];
        }

        const livingStrandsBefore = nextStrands.filter(s => s.visible && !s.isDefeated).length;

        nextStrands.forEach(s => {
            if (s.isDefeated) return;
            let totalDamage = 0;
            let totalHeal = 0;

            if (healMap.has(s.id)) {
                const { amount, source, isCrit } = healMap.get(s.id)!;
                let finalHeal = amount;
                
                for(const interceptor of Object.values(healingInterceptors)) {
                    const result = interceptor(s.id, finalHeal, nextStrands, now);
                    if(result.blocked) {
                        finalHeal -= result.blockedAmount;
                        nextCollisionVfx.push({ id: now + Math.random(), position: s.position, life: 800, maxLife: 800, type: 'heal_blocked', intensity: 0.8 });
                        nextCombatTextEffects.push({ id: now + Math.random(), position: s.position, text: "Blocked", color: 'purple', life: 1000, maxLife: 1000, velocity: { x: 0, y: -0.5 } });
                    }
                }

                s.health = Math.min(s.maxHealth, s.health + finalHeal);
                totalHeal += finalHeal;

                if (finalHeal > 0) {
                    const text = isCrit ? `+${Math.round(finalHeal)}!!` : `+${Math.round(finalHeal)}`;
                    const color = isCrit ? 'yellow' : 'lightgreen';
                    nextCombatTextEffects.push({ id: now + Math.random(), position: s.position, text, color, life: 1000, maxLife: 1000, velocity: { x: Math.random() - 0.5, y: -0.8 } });
                }
            }

            if (damageMap.has(s.id)) {
                const { amount, source, isCrit } = damageMap.get(s.id)!;
                let finalDamage = amount;
                
                // Damage reduction/sharing from empathic resonance
                const empathicResonance = nextGlobalEffects.find(e => e.type === 'EMPATHIC_RESONANCE');
                if (empathicResonance) {
                    const { sharedDamage } = damageInterceptors.EMPATHIC_RESONANCE(s.id, finalDamage, empathicResonance, nextStrands, now);
                    sharedDamage.forEach((dmg, id) => {
                         // Apply shared damage to others, this is a bit complex for this spot
                    });
                    // For now, let's just apply the reduced damage to self
                    finalDamage = sharedDamage.get(s.id) || finalDamage;
                }
                
                s.health = Math.max(0, s.health - finalDamage);
                totalDamage += finalDamage;

                if (source) s.lastDamagedBy = source.name;
                
                 if (finalDamage > 0) {
                    const text = isCrit ? `${Math.round(finalDamage)}!!` : `${Math.round(finalDamage)}`;
                    const color = isCrit ? 'orange' : 'red';
                    nextCombatTextEffects.push({ id: now + Math.random(), position: s.position, text, color, life: 1000, maxLife: 1000, velocity: { x: Math.random() - 0.5, y: -0.8 } });
                }
            }
            
            // Update battle report
            nextBattleReport = nextBattleReport!.map(r => {
                if (r.strandId === s.id) {
                    return {
                        ...r,
                        damageTaken: r.damageTaken + totalDamage,
                        healingDone: r.healingDone + totalHeal,
                        timeSurvived: nextFightDuration,
                    };
                }
                const damageSource = damageMap.get(s.id)?.source;
                if (damageSource && r.strandId === damageSource.id) {
                    return {...r, damageDealt: r.damageDealt + totalDamage};
                }
                 const healSource = healMap.get(s.id)?.source;
                if (healSource && r.strandId === healSource.id) {
                    return {...r, healingDone: r.healingDone + totalHeal};
                }
                return r;
            });
            
            if (s.health <= 0) {
                s.isDefeated = true;
                newLogs.push(`${s.name} has been defeated by ${s.lastDamagedBy || 'the environment'}!`);
                nextExplosionEffects.push({ id: now + Math.random(), position: s.position, life: 500, maxLife: 500, intensity: 1 });
                 nextBattleReport = nextBattleReport!.map(r => {
                    if (r.strandId === s.id) {
                        return { ...r, causeOfDeath: s.lastDamagedBy || 'environment' };
                    }
                     const killer = nextStrands.find(str => str.name === s.lastDamagedBy);
                    if (killer && r.strandId === killer.id) {
                        return { ...r, kills: r.kills + 1 };
                    }
                    return r;
                });
            }
        });
    }

    // --- Win Condition Check ---
    if (isFightModeActive && !winner && nextSimulationState.celebrationEndTime === 0) {
        const survivors = nextStrands.filter(s => s.visible && !s.isDefeated);

        if (survivors.length <= 1 && simulationState.initialCombatantCount > 1) {
            newWinner = survivors.length === 1 ? survivors[0] : null;
            const winnerName = newWinner ? newWinner.name : "No one";
            newLogs.push(newWinner ? `FIGHT OVER! ${winnerName} is the winner!` : `FIGHT OVER! It's a draw!`);
            nextSimulationState.celebrationEndTime = now + 2000; // 2s celebration before showing screen
            
            nextBattleReport = nextBattleReport!.map(r => {
                if (newWinner && r.strandId === newWinner.id) {
                    return { ...r, isWinner: true };
                }
                return r;
            });
        }
    }
    
    // --- Action Cam Logic ---
    let nextCameraTarget: CameraTarget | undefined = undefined;
    if (isActionCamActive && isFightModeActive) {
        const { actionCam } = nextSimulationState;
        const livingCombatants = nextStrands.filter(s => s.visible && !s.isDefeated);
        const switchInterval = 5000;
        const zoomInTime = 1000;

        let currentTargetStrand = livingCombatants.find(s => s.id === actionCam.currentTargetId);

        if (!currentTargetStrand || (now - actionCam.lastSwitchTime > switchInterval && livingCombatants.length > 1)) {
            let newTargetStrand: Strand | undefined;
            if (livingCombatants.length > 0) {
                const otherCombatants = livingCombatants.filter(s => s.id !== actionCam.currentTargetId);
                if (otherCombatants.length > 0) {
                    newTargetStrand = otherCombatants[Math.floor(Math.random() * otherCombatants.length)];
                } else {
                    newTargetStrand = livingCombatants[0];
                }
            }

            if (newTargetStrand) {
                actionCam.currentTargetId = newTargetStrand.id;
                actionCam.lastSwitchTime = now;
                actionCam.timeOnTarget = 0;
                currentTargetStrand = newTargetStrand;
            } else {
                actionCam.currentTargetId = null;
            }
        }

        if (currentTargetStrand) {
            actionCam.timeOnTarget += deltaTime;
            const zoomProgress = Math.min(1.0, actionCam.timeOnTarget / zoomInTime);
            actionCam.currentTarget = {
                x: currentTargetStrand.position.x,
                y: currentTargetStrand.position.y,
                zoom: 1.0 + 1.5 * zoomProgress
            };
        } else {
             actionCam.currentTarget = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, zoom: 1.0 };
             actionCam.currentTargetId = null;
        }

        nextCameraTarget = actionCam.currentTarget;
    } else {
        nextSimulationState.actionCam.currentTargetId = null;
        nextSimulationState.actionCam.currentTarget = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, zoom: 1.0 };
        nextSimulationState.actionCam.lastSwitchTime = 0;
        nextSimulationState.actionCam.timeOnTarget = 0;
    }
    
    return {
        nextStrands,
        nextJobEffects,
        nextSpecialEvents,
        nextAnomalies,
        nextExplosionEffects,
        nextCombatTextEffects,
        nextCollisionVfx,
        nextTransientVfx,
        nextPlayerWalls,
        nextActiveUltimates,
        nextGlobalEffects,
        nextPlayerAether,
        nextFightDuration,
        nextRelationshipMatrix,
        nextSimulationStats,
        nextScreenFlash,
        nextScreenShake,
        nextBattleReport,
        nextFightHistoryData,
        newLogs,
        newWinner,
        shouldShowVictoryScreen,
        nextSimulationState,
        nextCameraTarget,
    };
};