import type { Creature, ActiveJobEffect, CombatTextEffect, TransientVfx, Vector, CreatureType, Debuff } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, CREATURE_CONFIG } from '../../constants';
import { updateNit } from './creatures/nitLogic';
import { updateBloomWilt } from './creatures/bloomWiltLogic';
import { updateCreatureMovementAI } from './creatures/movementAI';

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

const handleCreatureCollision = (c1: Creature, c2: Creature, combatTextEffects: CombatTextEffect[]) => {
    const dx = c2.position.x - c1.position.x;
    const dy = c2.position.y - c1.position.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = c1.radius + c2.radius;

    if (distance < minDistance) {
        // --- Physical Resolution ---
        const overlap = minDistance - distance;
        const angle = Math.atan2(dy, dx);
        const pushX = (overlap / 2) * Math.cos(angle);
        const pushY = (overlap / 2) * Math.sin(angle);

        c1.position.x -= pushX;
        c1.position.y -= pushY;
        c2.position.x += pushX;
        c2.position.y += pushY;
        
        // --- Damage Calculation ---
        const v1_mag = Math.hypot(c1.velocity.x, c1.velocity.y);
        const v2_mag = Math.hypot(c2.velocity.x, c2.velocity.y);

        const damage1 = v1_mag * c1.radius * c1.collisionDamageMultiplier * 0.1;
        const damage2 = v2_mag * c2.radius * c2.collisionDamageMultiplier * 0.1;

        if (c1.team !== c2.team) {
            c1.health = Math.max(0, c1.health - damage2);
            c2.health = Math.max(0, c2.health - damage1);
            
            if (damage1 > 1) {
                combatTextEffects.push({id: Date.now() + Math.random(), position: c2.position, text: `${Math.round(damage1)}`, color: 'orange', life: 1000, maxLife: 1000, velocity: {x:0, y:-0.5}});
            }
            if (damage2 > 1) {
                combatTextEffects.push({id: Date.now() + Math.random(), position: c1.position, text: `${Math.round(damage2)}`, color: 'orange', life: 1000, maxLife: 1000, velocity: {x:0, y:-0.5}});
            }
        }

        // --- Knockback and Bounce ---
        let mass1 = c1.radius * c1.radius;
        let mass2 = c2.radius * c2.radius;

        // Larger evolution wins collision
        if ((c1.evolutionStage || 1) > (c2.evolutionStage || 1)) mass1 *= 2;
        if ((c2.evolutionStage || 1) > (c1.evolutionStage || 1)) mass2 *= 2;

        const normalX = dx / distance;
        const normalY = dy / distance;

        const kx = c1.velocity.x - c2.velocity.x;
        const ky = c1.velocity.y - c2.velocity.y;
        const p = 2.0 * (normalX * kx + normalY * ky) / (mass1 + mass2);

        c1.velocity.x -= p * mass2 * normalX;
        c1.velocity.y -= p * mass2 * normalY;
        c2.velocity.x += p * mass1 * normalX;
        c2.velocity.y += p * mass1 * normalY;


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

    const nextCreatures = creatures.map(creature => {
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

        c.debuffs = c.debuffs.filter(d => d.endTime > now);
        const isStunned = c.debuffs.some(d => d.type === 'STUN');

        if (!isStunned) {
            let result: any = {};
            if (c.type === 'NIT_LINE') {
                if(c.evolutionProgress !== undefined) c.evolutionProgress = Math.max(0, c.evolutionProgress - deltaSeconds);
                result = updateNit(c, creatures, now);
            } else if (c.type === 'BLOOM_WILT') {
                result = updateBloomWilt(c, creatures, now);
            }
            if (result.newEffects) nextJobEffects.push(...result.newEffects);
            if (result.newCombatText) nextCombatTextEffects.push(...result.newCombatText);
            if (result.newLogs) newLogs.push(...result.newLogs);
            if (result.newImageUrl) imageUpdates.push({ creatureId: c.id, newImageUrl: result.newImageUrl });

            if (result.evolution) {
                newLogs.push(`${c.state.name} has evolved!`);
                nextTransientVfx.push({ id: now, type: 'EVOLUTION', targetId: c.id, life: 2000, maxLife: 2000, data:{} });
            }

            const { force, newEffects: movementEffects, newLogs: movementLogs } = updateCreatureMovementAI(c, creatures, now);
            c.velocity.x += force.x * c.acceleration;
            c.velocity.y += force.y * c.acceleration;
            if(movementEffects) nextJobEffects.push(...movementEffects);
            if(movementLogs) newLogs.push(...movementLogs);


            const speed = Math.hypot(c.velocity.x, c.velocity.y);
            const maxSpeed = c.speed;
            if (speed > maxSpeed) {
                c.velocity.x = (c.velocity.x / speed) * maxSpeed;
                c.velocity.y = (c.velocity.y / speed) * maxSpeed;
            }

            c.position.x += c.velocity.x * 60 * deltaSeconds;
            c.position.y += c.velocity.y * 60 * deltaSeconds;
            if (speed > 0.1) {
                 c.rotation = Math.atan2(c.velocity.y, c.velocity.x);
            }
        }

        c.velocity.x *= 0.98; // Friction
        c.velocity.y *= 0.98;
        
        const wallStun = () => {
             if(!c.debuffs.some(d => d.type === 'STUN')) {
                const stunDebuff: Debuff = { type: 'STUN', endTime: now + 300, source: c.type };
                c.debuffs.push(stunDebuff);
            }
        };

        if (c.position.x < c.radius) { c.position.x = c.radius; c.velocity.x *= -0.5; wallStun(); }
        if (c.position.x > SCREEN_WIDTH - c.radius) { c.position.x = SCREEN_WIDTH - c.radius; c.velocity.x *= -0.5; wallStun(); }
        if (c.position.y < c.radius) { c.position.y = c.radius; c.velocity.y *= -0.5; wallStun(); }
        if (c.position.y > SCREEN_HEIGHT - c.radius) { c.position.y = SCREEN_HEIGHT - c.radius; c.velocity.y *= -0.5; wallStun(); }
        
        if (c.health <= 0) {
            c.isDefeated = true;
            newLogs.push(`${c.state.name || c.type} has been defeated!`);
        }

        return c;
    });

    for (let i = 0; i < nextCreatures.length; i++) {
        for (let j = i + 1; j < nextCreatures.length; j++) {
            const c1 = nextCreatures[i];
            const c2 = nextCreatures[j];
            if (!c1.isDefeated && !c2.isDefeated) {
                handleCreatureCollision(c1, c2, nextCombatTextEffects);
            }
        }
    }

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
