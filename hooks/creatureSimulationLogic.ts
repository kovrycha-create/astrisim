import type { Creature, ActiveJobEffect, CombatTextEffect, TransientVfx, Vector, CreatureType } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, CREATURE_CONFIG } from '../../constants';
import { updateNit } from './creatures/nitLogic';
import { updateBloomWilt } from './creatures/bloomWiltLogic';

interface CreatureSimState {
    creatures: Creature[];
    jobEffects: ActiveJobEffect[];
    combatTextEffects: CombatTextEffect[];
    transientVfx: TransientVfx[];
    deltaTime: number;
    now: number;
}

interface CreatureSimResult {
    nextCreatures: Creature[];
    nextJobEffects: ActiveJobEffect[];
    nextCombatTextEffects: CombatTextEffect[];
    nextTransientVfx: TransientVfx[];
    newLogs: string[];
    winner: Creature | null | undefined;
    imageUpdates?: { creatureId: number, newImageUrl: string }[];
}

const handleCreatureCollision = (c1: Creature, c2: Creature) => {
    const dx = c2.position.x - c1.position.x;
    const dy = c2.position.y - c1.position.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = c1.radius + c2.radius;

    if (distance < minDistance) {
        const overlap = minDistance - distance;
        const angle = Math.atan2(dy, dx);
        const pushX = (overlap / 2) * Math.cos(angle);
        const pushY = (overlap / 2) * Math.sin(angle);

        c1.position.x -= pushX;
        c1.position.y -= pushY;
        c2.position.x += pushX;
        c2.position.y += pushY;
        
        // Simplified bounce
        const tempVelX = c1.velocity.x;
        const tempVelY = c1.velocity.y;
        c1.velocity.x = c2.velocity.x * 0.8;
        c1.velocity.y = c2.velocity.y * 0.8;
        c2.velocity.x = tempVelX * 0.8;
        c2.velocity.y = tempVelY * 0.8;

        // Entropy Touch application from Bloom/Wilt
        const applyEntropyTouch = (attacker: Creature, target: Creature) => {
             if(attacker.type === 'BLOOM_WILT' && attacker.state.entropyTouchCharges > 0) {
                attacker.state.entropyTouchCharges--;
                let decay = target.debuffs.find(d => d.type === 'DECAY');
                if (decay) {
                    decay.stacks = Math.min(3, decay.stacks + 1);
                    decay.endTime = attacker.state.entropyTouchEndTime;
                } else {
                    target.debuffs.push({
                        type: 'DECAY',
                        endTime: attacker.state.entropyTouchEndTime,
                        source: 'BLOOM_WILT',
                        stacks: 1,
                        lastTick: 0,
                    });
                }
            }
        };
        applyEntropyTouch(c1, c2);
        applyEntropyTouch(c2, c1);
    }
};


export const runCreatureSimulationTick = (state: CreatureSimState): CreatureSimResult => {
    const { creatures, jobEffects, combatTextEffects, transientVfx, deltaTime, now } = state;
    const deltaSeconds = deltaTime / 1000;
    
    let nextJobEffects = [...jobEffects].filter(e => e.life > 0);
    let nextCombatTextEffects = [...combatTextEffects].filter(e => e.life > 0);
    let nextTransientVfx = [...transientVfx].filter(v => v.life > 0);
    const newLogs: string[] = [];
    const imageUpdates: { creatureId: number, newImageUrl: string }[] = [];

    // Update effects
    nextJobEffects.forEach(e => e.life -= deltaTime);
    nextCombatTextEffects.forEach(e => {
        e.life -= deltaTime;
        e.position.x += e.velocity.x;
        e.position.y += e.velocity.y;
    });
    nextTransientVfx.forEach(v => v.life -= deltaTime);

    // Update creatures with immutability by creating new objects in a new array
    const nextCreatures = creatures.map(creature => {
        // Create a deep enough copy to avoid mutation issues.
        const c: Creature = {
            ...creature,
            position: { ...creature.position },
            velocity: { ...creature.velocity },
            size: { ...creature.size },
            state: { ...creature.state },
            abilities: creature.abilities.map(a => ({ ...a })),
            debuffs: creature.debuffs.map(d => ({ ...d })),
        };

        if (c.isDefeated) {
            return c;
        }

        // Debuff processing (stun)
        c.debuffs = c.debuffs.filter(d => d.endTime > now);
        const isStunned = c.debuffs.some(d => d.type === 'STUN');

        // AI, Abilities, and Movement
        if (!isStunned) {
            let result: any = {};
            if (c.type === 'NIT_LINE') {
                if(c.evolutionProgress !== undefined) {
                    c.evolutionProgress = Math.max(0, c.evolutionProgress - deltaSeconds);
                }
                result = updateNit(c, creatures, now);
            } else if (c.type === 'BLOOM_WILT') {
                result = updateBloomWilt(c, creatures, now);
            }
            if (result.newEffects) nextJobEffects.push(...result.newEffects);
            if (result.newCombatText) nextCombatTextEffects.push(...result.newCombatText);
            if (result.newLogs) newLogs.push(...result.newLogs);
            if (result.newImageUrl) {
                imageUpdates.push({ creatureId: c.id, newImageUrl: result.newImageUrl });
            }

            if (result.evolution) {
                newLogs.push(`${c.state.name} has evolved!`);
                nextTransientVfx.push({ id: now, type: 'EVOLUTION', targetId: c.id, life: 2000, maxLife: 2000, data:{} });
            }

            // --- Movement AI ---
            const target = creatures.find(other => other.team !== c.team && !other.isDefeated);
            if (target) {
                const angle = Math.atan2(target.position.y - c.position.y, target.position.x - c.position.x);
                const acceleration = 0.03;
                c.velocity.x += Math.cos(angle) * acceleration;
                c.velocity.y += Math.sin(angle) * acceleration;

                const maxVelocity = 1.5;
                const speedSq = c.velocity.x * c.velocity.x + c.velocity.y * c.velocity.y;
                if (speedSq > maxVelocity * maxVelocity) {
                    const speed = Math.sqrt(speedSq);
                    c.velocity.x = (c.velocity.x / speed) * maxVelocity;
                    c.velocity.y = (c.velocity.y / speed) * maxVelocity;
                }
            }

            // --- Position Update ---
            c.position.x += c.velocity.x * c.speed * deltaSeconds * 60;
            c.position.y += c.velocity.y * c.speed * deltaSeconds * 60;
            c.rotation = Math.atan2(c.velocity.y, c.velocity.x);
        }

        // Friction
        c.velocity.x *= 0.98;
        c.velocity.y *= 0.98;
        
        // Boundaries
        if (c.position.x < c.radius) { c.position.x = c.radius; c.velocity.x *= -0.5; }
        if (c.position.x > SCREEN_WIDTH - c.radius) { c.position.x = SCREEN_WIDTH - c.radius; c.velocity.x *= -0.5; }
        if (c.position.y < c.radius) { c.position.y = c.radius; c.velocity.y *= -0.5; }
        if (c.position.y > SCREEN_HEIGHT - c.radius) { c.position.y = SCREEN_HEIGHT - c.radius; c.velocity.y *= -0.5; }
        
        // Check defeat
        if (c.health <= 0) {
            c.isDefeated = true;
            newLogs.push(`${c.state.name || c.type} has been defeated!`);
        }

        return c;
    });

    // Collisions (mutates objects within the new `nextCreatures` array)
    for (let i = 0; i < nextCreatures.length; i++) {
        for (let j = i + 1; j < nextCreatures.length; j++) {
            const c1 = nextCreatures[i];
            const c2 = nextCreatures[j];
            if (!c1.isDefeated && !c2.isDefeated) {
                handleCreatureCollision(c1, c2);
            }
        }
    }

    // Win condition check
    const livingCreatures = nextCreatures.filter(c => !c.isDefeated);
    let winner: Creature | null | undefined = undefined;
    if (livingCreatures.length <= 1) {
        winner = livingCreatures[0] || null;
    }


    return {
        nextCreatures,
        nextJobEffects,
        nextCombatTextEffects,
        nextTransientVfx,
        newLogs,
        winner,
        imageUpdates,
    };
};