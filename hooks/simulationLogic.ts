import type {
    Strand, ActiveUltimate, GlobalEffect, ActiveSpecialEvent, Anomaly,
    ExplosionEffect, BattleReportStats, FightHistoryData, StatSnapshot,
    GameMode, PlayerTool, PlayerWall, CombatTextEffect, CollisionVfx,
    Vector, ParticleSystem, RelationshipMatrix, ActiveJobEffect, SpecialEventType, StrandName, UltimateType, SimulationStats
} from '../types';
import {
    SCREEN_WIDTH, SCREEN_HEIGHT, ULTIMATE_CONFIG, SPECIAL_EVENTS_CONFIG, ULTIMATE_CHARGE_VALUES,
    RELATIONSHIP_MODIFIERS, MOOD_CONFIG, ANOMALY_CONFIG, PLAYER_CONFIG, COLLISION_CONFIG,
    STRAND_COMBAT_STATS, AI_ULTIMATE_CHANCE
} from '../constants';
import { RelationshipLevel } from '../types';

interface SimulationState {
    strands: Strand[];
    activeUltimates: ActiveUltimate[];
    jobEffects: ActiveJobEffect[];
    globalEffects: GlobalEffect[];
    specialEvents: ActiveSpecialEvent[];
    anomalies: Anomaly[];
    explosionEffects: ExplosionEffect[];
    combatTextEffects: CombatTextEffect[];
    collisionVfx: CollisionVfx[];
    playerWalls: PlayerWall[];
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
        ellyFirstUltimateFired: boolean;
        nextEventTime: number;
        celebrationEndTime: number;
        initialCombatantCount: number;
        fightStartTime: number;
        lastHistoryCaptureTime: number;
    };
    simulationStats: SimulationStats;
    deltaTime: number;
}

interface SimulationTickResult {
    nextStrands: Strand[];
    nextActiveUltimates: ActiveUltimate[];
    nextJobEffects: ActiveJobEffect[];
    nextGlobalEffects: GlobalEffect[];
    nextSpecialEvents: ActiveSpecialEvent[];
    nextAnomalies: Anomaly[];
    nextExplosionEffects: ExplosionEffect[];
    nextCombatTextEffects: CombatTextEffect[];
    nextCollisionVfx: CollisionVfx[];
    nextPlayerWalls: PlayerWall[];
    nextPlayerAether: number;
    nextFightDuration: number;
    nextRelationshipMatrix: RelationshipMatrix;
    nextSimulationStats: SimulationStats;
    nextBattleReport?: BattleReportStats[];
    nextFightHistoryData?: FightHistoryData;
    newLogs: string[];
    newWinner: Strand | null | undefined; // undefined means no change
    shouldShowVictoryScreen: boolean;
    nextSimulationState: SimulationState['simulationState'];
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

export const runSimulationTick = (state: SimulationState): SimulationTickResult => {
    const {
        strands, activeUltimates, jobEffects, globalEffects, specialEvents, anomalies,
        explosionEffects, combatTextEffects, collisionVfx, playerWalls, activeStrandIndex,
        isFightModeActive, winner, battleReport, historyData, gameMode, playerAether,
        activePlayerTool, isGravityAnchorActive, mousePosition, prevMousePosition,
        relationshipMatrix, particleSystem, simulationState, simulationStats, deltaTime
    } = state;

    const deltaSeconds = deltaTime / 1000;
    const normalizedDelta = Math.min(2, deltaTime / 16.67);
    const now = Date.now();

    let nextStrands = strands.map(s => ({ ...s, tempSpeedModifier: 1.0, mouseVelocity: { x: 0, y: 0 } }));
    let nextActiveUltimates = [...activeUltimates];
    let nextJobEffects = [...jobEffects];
    let nextGlobalEffects = [...globalEffects];
    let nextSpecialEvents = [...specialEvents];
    let nextAnomalies = [...anomalies];
    let nextExplosionEffects = [...explosionEffects];
    let nextCombatTextEffects = [...combatTextEffects];
    let nextCollisionVfx = [...collisionVfx];
    let nextPlayerWalls = [...playerWalls];
    let nextPlayerAether = playerAether;
    let nextFightDuration = isFightModeActive ? (now - simulationState.fightStartTime) / 1000 : 0;
    let nextBattleReport: BattleReportStats[] | undefined = undefined;
    let nextFightHistoryData: FightHistoryData | undefined = undefined;
    let nextRelationshipMatrix = JSON.parse(JSON.stringify(relationshipMatrix));
    const nextSimulationStats = {
      ...simulationStats,
      player: {
        ...simulationStats.player,
        timeWithToolActive: new Map(simulationStats.player.timeWithToolActive),
        abilitiesUsed: new Map(simulationStats.player.abilitiesUsed),
      },
      totalUltimatesUsed: new Map(simulationStats.totalUltimatesUsed),
    };


    const newLogs: string[] = [];
    let newWinner: Strand | null | undefined = undefined;
    let shouldShowVictoryScreen = false;
    const nextSimulationState = { ...simulationState };
    const relationshipEvents: RelationshipEvent[] = [];

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
    nextActiveUltimates = activeUltimates.filter(u => u.life > 0).map(u => ({...u, life: u.life - deltaSeconds}));
    nextJobEffects = jobEffects.filter(e => e.life > 0).map(e => ({...e, life: e.life - deltaTime}));
    nextGlobalEffects = globalEffects.filter(e => e.endTime > now);
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

    nextExplosionEffects = explosionEffects.filter(e => e.life > 0).map(e => ({ ...e, life: e.life - deltaTime }));
    nextCombatTextEffects = combatTextEffects.filter(e => e.life > 0).map(e => ({ ...e, life: e.life - deltaTime, position: { x: e.position.x + e.velocity.x * normalizedDelta, y: e.position.y + e.velocity.y * normalizedDelta }}));
    nextCollisionVfx = collisionVfx.filter(vfx => vfx.life > 0).map(vfx => ({...vfx, life: vfx.life - deltaTime}));
    
    particleSystem.update();

    const damageMap = new Map<number, { amount: number; source: Strand | null; isCrit: boolean }>();
    const healMap = new Map<number, { amount: number; source: Strand; isCrit: boolean }>();

    // Process Ultimates
    nextActiveUltimates.forEach(ult => {
        // Update ultimate state (e.g., radius expansion)
        if (ult.radius < ult.maxRadius) {
            ult.radius += (ult.maxRadius / (ult.maxLife * 50)) * normalizedDelta; // expand over time
        }
        // ... specific ultimate logic ...
    });

    const newlyTriggeredUltimates: ActiveUltimate[] = [];

    // Update Strands
    nextStrands.forEach(s => {
        if (!s.visible || s.isDefeated) return;

        // Player Buffs/Debuffs
        s.playerBuffs = s.playerBuffs?.filter(b => b.endTime > now);
        const isStasised = s.playerBuffs?.some(b => b.type === 'STASIS');
        if (s.playerBuffs?.some(b => b.type === 'FAVOR')) {
            s.ultimateCharge += PLAYER_CONFIG.FAVOR.CHARGE_BONUS * deltaSeconds;
        }
        
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

        // Update Cooldowns and Charges
        if (s.ultimateCooldown > 0) s.ultimateCooldown = Math.max(0, s.ultimateCooldown - deltaSeconds);
        s.ultimateCharge += ULTIMATE_CHARGE_VALUES.PASSIVE_SLOW * normalizedDelta; // Base passive charge for all
        s.ultimateCharge = Math.min(100, s.ultimateCharge);
        
        // AI & Manual Ultimate Trigger
        if (s.ultimateEnabled && s.ultimateCharge >= 100 && s.ultimateCooldown <= 0) {
             if (s.jobState.manualUltimateTrigger || (!isFightModeActive && Math.random() < AI_ULTIMATE_CHANCE * normalizedDelta)) {
                let ultType: UltimateType | null = null;
                const config = ULTIMATE_CONFIG[s.name as keyof typeof ULTIMATE_CONFIG];
                const duration = 'DURATION' in config ? config.DURATION : config.PULL_DURATION + config.PUSH_DURATION;
                let newUlt: Partial<ActiveUltimate> = {
                    id: now + s.id,
                    sourceStrandId: s.id,
                    sourceStrandName: s.name,
                    position: {...s.position},
                    maxLife: duration,
                    life: duration,
                };

                // Simplified placeholder for all ultimate types
                const ultTypes: Record<StrandName, UltimateType> = {
                    "Elly": "FISSURE",
                    "Vitarîs": "VITAL_BLOOM",
                    "ℛadí": "REVELATION_FLARE",
                    "Cozmik": "GRAVITATIONAL_COLLAPSE",
                    "Virtuō": "EQUILIBRIUM_BURST",
                    "lotŭr": "TRANQUILITY_NEXUS",
                    "Askänu": "BEACON_OF_KNOWLEDGE",
                    "Nectiv": "UNITY_PULSE",
                    "DxD": "DUEL_ARENA",
                    "丂anxxui": "EMPATHIC_RESONANCE_VISUAL",
                    "Ðethapart": "DECREE_OF_NULL",
                    "VOIDROT": "DECREE_OF_NULL", // Placeholder for Corruption global effect
                    "Memetic": "EMPATHIC_RESONANCE_VISUAL", // Placeholder for Echo Storm global effect
                    "Dræmin'": "EMPATHIC_RESONANCE_VISUAL", // Placeholder for Dream Weave global effect
                };
                ultType = ultTypes[s.name] || null;

                if (ultType) {
                   newUlt.type = ultType;
                   // Add any specific properties based on type if needed
                   newlyTriggeredUltimates.push(newUlt as ActiveUltimate);
                   newLogs.push(`${s.name} used its ultimate!`);
                   const currentUltCount = nextSimulationStats.totalUltimatesUsed.get(s.name) || 0;
                   nextSimulationStats.totalUltimatesUsed.set(s.name, currentUltCount + 1);

                   s.ultimateCharge = 0;
                   s.ultimateCooldown = s.maxUltimateCooldown;
                   if (s.jobState.manualUltimateTrigger) delete s.jobState.manualUltimateTrigger;
                }
             }
        }


        // Movement
        if (!isStasised) {
            const speedMultiplier = s.speed * s.tempSpeedModifier;
            s.position.x += (s.velocity.x + (s.mouseVelocity?.x || 0)) * speedMultiplier * normalizedDelta;
            s.position.y += (s.velocity.y + (s.mouseVelocity?.y || 0)) * speedMultiplier * normalizedDelta;
        } else {
            s.velocity.x = 0;
            s.velocity.y = 0;
        }

        // Screen boundary collision
        if (s.position.x < s.radius || s.position.x > SCREEN_WIDTH - s.radius) {
            s.velocity.x *= -1;
            s.ultimateCharge += ULTIMATE_CHARGE_VALUES.WALL_BOUNCE;
        }
        if (s.position.y < s.radius || s.position.y > SCREEN_HEIGHT - s.radius) {
            s.velocity.y *= -1;
            s.ultimateCharge += ULTIMATE_CHARGE_VALUES.WALL_BOUNCE;
        }
        s.position.x = Math.max(s.radius, Math.min(SCREEN_WIDTH - s.radius, s.position.x));
        s.position.y = Math.max(s.radius, Math.min(SCREEN_HEIGHT - s.radius, s.position.y));
        
        // Player Wall collision
        nextPlayerWalls.forEach(wall => {
            const closest = closestPointOnSegment(s.position, wall.start, wall.end);
            const dist = Math.hypot(s.position.x - closest.x, s.position.y - closest.y);
            if (dist < s.radius) {
                const wallVec = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
                const wallNormal = { x: -wallVec.y, y: wallVec.x };
                const wallNormalMag = Math.hypot(wallNormal.x, wallNormal.y);
                const unitNormal = { x: wallNormal.x / wallNormalMag, y: wallNormal.y / wallNormalMag };
                
                const dot = s.velocity.x * unitNormal.x + s.velocity.y * unitNormal.y;
                s.velocity.x -= 2 * dot * unitNormal.x;
                s.velocity.y -= 2 * dot * unitNormal.y;
                
                const penetration = s.radius - dist;
                s.position.x += unitNormal.x * penetration;
                s.position.y += unitNormal.y * penetration;
            }
        });

        // Stored Power
        if (isFightModeActive) {
            const stats = STRAND_COMBAT_STATS[s.name];
            s.storedPower = Math.min(100, s.storedPower + stats.storedPowerRate * deltaSeconds);
        }
    });
    
    nextActiveUltimates.push(...newlyTriggeredUltimates);


    // Strand-to-Strand Collisions
    for (let i = 0; i < nextStrands.length; i++) {
        for (let j = i + 1; j < nextStrands.length; j++) {
            const s1 = nextStrands[i];
            const s2 = nextStrands[j];
            if (!s1.visible || !s2.visible || s1.isDefeated || s2.isDefeated) continue;

            const dist = Math.hypot(s1.position.x - s2.position.x, s1.position.y - s2.position.y);
            if (dist < s1.radius + s2.radius) {
                nextSimulationStats.totalCollisions++;
                // Physics Response
                const overlap = s1.radius + s2.radius - dist;
                const normal = { x: (s2.position.x - s1.position.x) / dist, y: (s2.position.y - s1.position.y) / dist };
                s1.position.x -= normal.x * overlap / 2; s1.position.y -= normal.y * overlap / 2;
                s2.position.x += normal.x * overlap / 2; s2.position.y += normal.y * overlap / 2;
                const relVel = { x: s1.velocity.x - s2.velocity.x, y: s1.velocity.y - s2.velocity.y };
                const impulse = (relVel.x * normal.x + relVel.y * normal.y) * -1.0;
                s1.velocity.x += impulse * normal.x; s1.velocity.y += impulse * normal.y;
                s2.velocity.x -= impulse * normal.x; s2.velocity.y -= impulse * normal.y;

                // Fight Mode Logic
                if (isFightModeActive) {
                    const rel = relationshipMatrix[s1.name]?.[s2.name] ?? RelationshipLevel.Acquaintance;
                    const vMag = Math.hypot(relVel.x, relVel.y);
                    const impactForce = vMag * COLLISION_CONFIG.VELOCITY_FACTOR;
                    const s1Stats = STRAND_COMBAT_STATS[s1.name];
                    const s2Stats = STRAND_COMBAT_STATS[s2.name];

                    if (rel <= RelationshipLevel.MortalEnemy) {
                        const isCrit1 = Math.random() < COLLISION_CONFIG.CRIT_CHANCE;
                        const isCrit2 = Math.random() < COLLISION_CONFIG.CRIT_CHANCE;
                        const damage1 = (COLLISION_CONFIG.BASE_DAMAGE + impactForce) * s2Stats.collisionDamageFactor * (1 + s2.storedPower * COLLISION_CONFIG.STORED_POWER_BONUS) * (isCrit1 ? COLLISION_CONFIG.CRIT_MULTIPLIER : 1);
                        const damage2 = (COLLISION_CONFIG.BASE_DAMAGE + impactForce) * s1Stats.collisionDamageFactor * (1 + s1.storedPower * COLLISION_CONFIG.STORED_POWER_BONUS) * (isCrit2 ? COLLISION_CONFIG.CRIT_MULTIPLIER : 1);
                        
                        damageMap.set(s1.id, { amount: damage1, source: s2, isCrit: isCrit1 });
                        damageMap.set(s2.id, { amount: damage2, source: s1, isCrit: isCrit2 });
                        relationshipEvents.push({ s1Name: s1.name, s2Name: s2.name, modifier: isCrit1 || isCrit2 ? RELATIONSHIP_MODIFIERS.COLLISION_CRIT_ENEMY : RELATIONSHIP_MODIFIERS.COLLISION_DAMAGE_ENEMY });
                    } else if (rel >= RelationshipLevel.Friend) {
                        const heal1 = (COLLISION_CONFIG.BASE_HEAL + impactForce / 2) * s2Stats.collisionHealFactor * (1 + s2.storedPower * COLLISION_CONFIG.STORED_POWER_BONUS) * rel;
                        const heal2 = (COLLISION_CONFIG.BASE_HEAL + impactForce / 2) * s1Stats.collisionHealFactor * (1 + s1.storedPower * COLLISION_CONFIG.STORED_POWER_BONUS) * rel;
                        
                        healMap.set(s1.id, { amount: heal1, source: s2, isCrit: false });
                        healMap.set(s2.id, { amount: heal2, source: s1, isCrit: false });
                        relationshipEvents.push({ s1Name: s1.name, s2Name: s2.name, modifier: RELATIONSHIP_MODIFIERS.COLLISION_HEAL_FRIEND });
                    } else { // Acquaintance
                        const damage = (COLLISION_CONFIG.BASE_DAMAGE + impactForce) * COLLISION_CONFIG.NEUTRAL_DAMAGE_MULTIPLIER;
                        damageMap.set(s1.id, { amount: damage, source: s2, isCrit: false });
                        damageMap.set(s2.id, { amount: damage, source: s1, isCrit: false });
                        relationshipEvents.push({ s1Name: s1.name, s2Name: s2.name, modifier: RELATIONSHIP_MODIFIERS.COLLISION_DAMAGE_NEUTRAL });
                    }
                    s1.storedPower = 0;
                    s2.storedPower = 0;
                }
            }
        }
    }

    // Apply Damage & Heals
    if (isFightModeActive) {
        const reportUpdates = {
            damageDealt: new Map<StrandName, number>(),
            damageTaken: new Map<StrandName, number>(),
            healingDone: new Map<StrandName, number>(),
            kills: new Map<StrandName, number>(),
        };

        const applyUpdate = (map: Map<StrandName, number>, key: StrandName, value: number) => {
            map.set(key, (map.get(key) || 0) + value);
        };

        damageMap.forEach(({ amount, source, isCrit }, targetId) => {
            const target = nextStrands.find(s => s.id === targetId);
            if (!target) return;
            const burdenBuff = target.playerBuffs?.find(b => b.type === 'BURDEN');
            const finalAmount = burdenBuff ? amount * PLAYER_CONFIG.BURDEN.DAMAGE_MULTIPLIER : amount;
            target.health -= finalAmount;
            target.lastDamagedBy = source?.name ?? null;

            applyUpdate(reportUpdates.damageTaken, target.name, finalAmount);
            if(source) applyUpdate(reportUpdates.damageDealt, source.name, finalAmount);
            
            nextCombatTextEffects.push({ id: now + Math.random(), position: {...target.position}, text: `${Math.round(finalAmount)}`, color: isCrit ? 'orange' : 'red', life: 1000, maxLife: 1000, velocity: {x:0, y:-1}});
            nextCollisionVfx.push({ id: now + Math.random(), position: {...target.position}, life: 500, maxLife: 500, type: isCrit ? 'crit' : 'damage', intensity: Math.min(1, finalAmount / 100)});
        });
        
        healMap.forEach(({ amount, source }, targetId) => {
            const target = nextStrands.find(s => s.id === targetId);
            if (!target) return;
            target.health = Math.min(target.maxHealth, target.health + amount);
            
            applyUpdate(reportUpdates.healingDone, source.name, amount);

            nextCombatTextEffects.push({ id: now + Math.random(), position: {...target.position}, text: `+${Math.round(amount)}`, color: 'lightgreen', life: 1000, maxLife: 1000, velocity: {x:0, y:-1}});
            nextCollisionVfx.push({ id: now + Math.random(), position: {...target.position}, life: 500, maxLife: 500, type: 'heal', intensity: Math.min(1, amount / 50)});
        });

        // Check for defeats
        nextStrands.forEach(s => {
            if (s.health <= 0 && !s.isDefeated) {
                s.isDefeated = true;
                s.visible = false;
                const remaining = nextStrands.filter(s => s.visible && !s.isDefeated).length;
                const total = nextSimulationState.initialCombatantCount;
                const intensity = 1 - (remaining / Math.max(1, total - 1));
                nextExplosionEffects.push({ id: now + s.id, position: {...s.position}, life: 1000, maxLife: 1000, intensity });

                if (s.lastDamagedBy) {
                    applyUpdate(reportUpdates.kills, s.lastDamagedBy, 1);
                }
            }
        });
        
        // Update Battle Report
        nextBattleReport = battleReport.map(r => {
            const strand = nextStrands.find(s => s.id === r.strandId);
            return {
                ...r,
                damageDealt: r.damageDealt + (reportUpdates.damageDealt.get(r.name) || 0),
                damageTaken: r.damageTaken + (reportUpdates.damageTaken.get(r.name) || 0),
                healingDone: r.healingDone + (reportUpdates.healingDone.get(r.name) || 0),
                kills: r.kills + (reportUpdates.kills.get(r.name) || 0),
                timeSurvived: strand?.isDefeated ? r.timeSurvived : nextFightDuration,
                causeOfDeath: strand?.isDefeated && r.causeOfDeath === 'survived' ? strand.lastDamagedBy || 'environment' : r.causeOfDeath,
            };
        });
        
        // Check for winner
        const remaining = nextStrands.filter(s => s.visible && !s.isDefeated);
        if (remaining.length === 1 && !winner && nextSimulationState.celebrationEndTime === 0) {
            newWinner = remaining[0];
            nextSimulationState.celebrationEndTime = now + 4000;
            newLogs.push(`${newWinner.name} is the winner!`);
            nextBattleReport = nextBattleReport.map(r => r.strandId === newWinner!.id ? {...r, isWinner: true, causeOfDeath: 'survived'} : r);
        } else if (remaining.length <= 0 && !winner && nextSimulationState.celebrationEndTime === 0) {
            newWinner = null;
            nextSimulationState.celebrationEndTime = now + 4000;
            newLogs.push("All combatants defeated! It's a draw.");
            nextBattleReport = nextBattleReport.map(r => ({...r, causeOfDeath: r.causeOfDeath === 'survived' ? 'draw' : r.causeOfDeath}));
        }
    }

    // Process Relationship Events
    relationshipEvents.forEach(event => {
        const { s1Name, s2Name, modifier } = event;
        const currentScore = nextRelationshipMatrix[s1Name]?.[s2Name] ?? 0;
        const currentLevel = getRelationshipLevelFromScore(currentScore);
        
        const newScore = Math.max(-1, Math.min(1, currentScore + modifier));
        
        nextRelationshipMatrix[s1Name][s2Name] = newScore as RelationshipLevel;
        nextRelationshipMatrix[s2Name][s1Name] = newScore as RelationshipLevel;

        const newLevel = getRelationshipLevelFromScore(newScore);
        
        if (newLevel !== currentLevel) {
            const oldLevelName = getRelationshipLevelName(currentLevel);
            const newLevelName = getRelationshipLevelName(newLevel);
            newLogs.push(`${s1Name} and ${s2Name}'s relationship changed from ${oldLevelName} to ${newLevelName}.`);
        }
    });
    
    return {
        nextStrands,
        nextActiveUltimates,
        nextJobEffects,
        nextGlobalEffects,
        nextSpecialEvents,
        nextAnomalies,
        nextExplosionEffects,
        nextCombatTextEffects,
        nextCollisionVfx,
        nextPlayerWalls,
        nextPlayerAether,
        nextFightDuration,
        nextRelationshipMatrix,
        nextSimulationStats,
        nextBattleReport,
        nextFightHistoryData,
        newLogs,
        newWinner,
        shouldShowVictoryScreen,
        nextSimulationState,
    };
};