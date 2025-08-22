import type { Creature, ActiveJobEffect, CombatTextEffect, Debuff } from '../../types';
import { CREATURE_CONFIG } from '../../constants';

const config = CREATURE_CONFIG.NIT_LINE;

const updateNitStage1 = (creature: Creature, allCreatures: Creature[], now: number) => {
    const newEffects: ActiveJobEffect[] = [];
    // AI: Use Whisper Buffer if an enemy is close
    const ability = creature.abilities[0];
    if (now > ability.lastUsed + ability.cooldownDuration) {
        const nearestEnemy = allCreatures.find(c => c.team !== creature.team && !c.isDefeated);
        if (nearestEnemy) {
            const dist = Math.hypot(creature.position.x - nearestEnemy.position.x, creature.position.y - nearestEnemy.position.y);
            if (dist < 300) {
                ability.lastUsed = now;
                creature.state.isBuffering = true;
                creature.state.bufferEndTime = now + 2000;
                newEffects.push({
                    id: now,
                    type: 'WHISPER_BUFFER_FIELD',
                    position: creature.position,
                    life: 2000,
                    maxLife: 2000,
                    radius: creature.radius + 20,
                    data: { sourceId: creature.id }
                });
            }
        }
    }

    if (creature.state.isBuffering && now > creature.state.bufferEndTime) {
        creature.state.isBuffering = false;
    }
    
    return { newEffects };
};

const updateNitStage2 = (creature: Creature, allCreatures: Creature[], now: number) => {
    const newEffects: ActiveJobEffect[] = [];
    const threadAbility = creature.abilities.find(a => a.name === 'Sympathy Thread')!;
    const swapAbility = creature.abilities.find(a => a.name === 'Position Swap')!;
    
    // AI: Use Sympathy Thread on nearest enemy if not already tethered
    if (!creature.state.tetheredTo && now > threadAbility.lastUsed + threadAbility.cooldownDuration) {
        const nearestEnemy = allCreatures.find(c => c.team !== creature.team && !c.isDefeated);
        if (nearestEnemy) {
            const dist = Math.hypot(creature.position.x - nearestEnemy.position.x, creature.position.y - nearestEnemy.position.y);
            if (dist < 400) {
                threadAbility.lastUsed = now;
                creature.state.tetheredTo = nearestEnemy.id;
                creature.state.tetherEndTime = now + 4000;
                creature.state.successfulTethers = (creature.state.successfulTethers || 0) + 1;
                newEffects.push({
                    id: now,
                    type: 'SYMPATHY_THREAD',
                    position: creature.position,
                    life: 4000,
                    maxLife: 4000,
                    data: { sourceId: creature.id, targetId: nearestEnemy.id }
                });
            }
        }
    }
    
    if (creature.state.tetheredTo && now > creature.state.tetherEndTime) {
        creature.state.tetheredTo = null;
    }

    // AI: Use Position Swap for aggression
    if (creature.state.tetheredTo && now > swapAbility.lastUsed + swapAbility.cooldownDuration) {
        swapAbility.lastUsed = now;
        const target = allCreatures.find(c => c.id === creature.state.tetheredTo)!;
        
        // Swap positions
        const tempPos = { ...creature.position };
        creature.position = { ...target.position };
        target.position = tempPos;
        
        // Brief stun
        const stunDebuff: Debuff = { type: 'STUN', endTime: now + 300, source: 'NIT_LINE' };
        creature.debuffs.push(stunDebuff);
        target.debuffs.push(stunDebuff);
        
        creature.state.tetheredTo = null;
    }


    return { newEffects };
};


export const updateNit = (creature: Creature, allCreatures: Creature[], now: number) => {
    let stageConfig;
    let evolutionCheck = false;
    let newEffects: ActiveJobEffect[] = [];
    let newCombatText: CombatTextEffect[] = [];
    let newImageUrl: string | undefined;

    // Process echo damage
    creature.debuffs = creature.debuffs.filter(d => {
        if (d.type === 'ECHO_DAMAGE' && d.tickTime && now > d.tickTime) {
            creature.health = Math.max(0, creature.health - d.damagePerTick);
            newCombatText.push({
                id: now + Math.random(),
                position: creature.position,
                text: `${Math.round(d.damagePerTick)}`,
                color: 'purple',
                life: 1000,
                maxLife: 1000,
                velocity: { x: 0, y: -0.5 }
            });
            d.ticksRemaining--;
            d.tickTime = now + d.interval;
        }
        return d.type !== 'ECHO_DAMAGE' || d.ticksRemaining > 0;
    });

    switch(creature.evolutionStage) {
        case 1:
            stageConfig = config.stages[1];
            if ((creature.evolutionProgress || 0) <= 0 || (creature.state.debuffsAbsorbed || 0) >= stageConfig.evolutionThresholdDebuffs) {
                evolutionCheck = true;
            }
            const res1 = updateNitStage1(creature, allCreatures, now);
            newEffects.push(...res1.newEffects);
            break;
        case 2:
            stageConfig = config.stages[2];
             if ((creature.evolutionProgress || 0) <= 0 || (creature.state.successfulTethers || 0) >= stageConfig.evolutionThresholdTethers) {
                evolutionCheck = true;
            }
            const res2 = updateNitStage2(creature, allCreatures, now);
            newEffects.push(...res2.newEffects);
            break;
        case 3:
             stageConfig = config.stages[3];
             if ((creature.evolutionProgress || 0) <= 0 || (creature.state.successfulFractures || 0) >= stageConfig.evolutionThresholdFractures) {
                evolutionCheck = true;
            }
            // Placeholder for higher stages
            break;
        case 4:
            // No evolution from here
            break;
    }

    if (evolutionCheck && creature.evolutionStage! < 4) {
        const nextStage = (creature.evolutionStage! + 1) as 1|2|3|4;
        const newConfig = config.stages[nextStage];
        creature.evolutionStage = nextStage;
        creature.maxHealth = newConfig.hp;
        creature.health = newConfig.hp;
        creature.speed = newConfig.speed;
        creature.size = newConfig.size;
        creature.radius = newConfig.radius;
        creature.abilities = newConfig.abilities.map(a => ({...a, lastUsed: 0}));
        creature.state.name = newConfig.name;
        
        const currentTotalTime = (stageConfig && 'evolutionThresholdTime' in stageConfig) ? stageConfig.evolutionThresholdTime : 0;
        const nextTotalTime = ('evolutionThresholdTime' in newConfig) ? newConfig.evolutionThresholdTime : 0;
        creature.evolutionProgress = nextTotalTime > 0 ? nextTotalTime - currentTotalTime : undefined;

        creature.imageUrl = newConfig.imageUrl;
        newImageUrl = newConfig.imageUrl;
        // Reset action-based counters
        creature.state.debuffsAbsorbed = 0;
        creature.state.successfulTethers = 0;
        return { evolution: true, newEffects, newCombatText, newImageUrl };
    }


    return { evolution: false, newEffects, newCombatText, newImageUrl };
};
