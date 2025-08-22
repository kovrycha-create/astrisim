
import type { Creature, Vector, ActiveJobEffect } from '../../types';
import { CREATURE_CONFIG } from '../../constants';

const findNearest = (source: Creature, targets: Creature[]): Creature | null => {
    if (targets.length === 0) return null;
    let nearest = targets[0];
    let minDistSq = Infinity;
    for (const target of targets) {
        if (target.isDefeated) continue;
        const distSq = (source.position.x - target.position.x)**2 + (source.position.y - target.position.y)**2;
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearest = target;
        }
    }
    return nearest;
};

const updateNit1Movement = (creature: Creature, allies: Creature[], enemies: Creature[], now: number) => {
    const force: Vector = { x: 0, y: 0 };
    const newEffects: ActiveJobEffect[] = [];
    const config = CREATURE_CONFIG.NIT_LINE.stages[1];

    const nearestAlly = findNearest(creature, allies);
    const nearestEnemy = findNearest(creature, enemies);
    
    // Fleeing takes priority
    if (nearestEnemy && Math.hypot(creature.position.x - nearestEnemy.position.x, creature.position.y - nearestEnemy.position.y) < 200) {
        creature.state.movementState = 'fleeing';
    } else if (creature.state.movementState === 'fleeing') {
         creature.state.movementState = 'idling';
    }

    if (creature.state.movementState === 'fleeing' && nearestEnemy) {
        const angle = Math.atan2(creature.position.y - nearestEnemy.position.y, creature.position.x - nearestEnemy.position.x);
        force.x += Math.cos(angle);
        force.y += Math.sin(angle);
    } else if (nearestAlly) {
        // "Anxious Orbiting"
        creature.state.movementState = 'orbiting';
        creature.state.movementTargetId = nearestAlly.id;

        const dist = Math.hypot(creature.position.x - nearestAlly.position.x, creature.position.y - nearestAlly.position.y);
        const comfortDist = (config as any).movement.comfortDistance.min;
        
        const orbitAngle = creature.state.orbitAngle || 0;
        const targetX = nearestAlly.position.x + Math.cos(orbitAngle) * comfortDist * 1.2; // Elliptical
        const targetY = nearestAlly.position.y + Math.sin(orbitAngle) * comfortDist;

        const angleToTarget = Math.atan2(targetY - creature.position.y, targetX - creature.position.x);
        force.x += Math.cos(angleToTarget);
        force.y += Math.sin(angleToTarget);

        creature.state.orbitAngle = (orbitAngle + 0.01);
    } else {
        // Wander aimlessly
        creature.state.movementState = 'idling';
        if (Math.random() < 0.02) {
            creature.state.wanderAngle = Math.random() * Math.PI * 2;
        }
        force.x += Math.cos(creature.state.wanderAngle || 0) * 0.1;
        force.y += Math.sin(creature.state.wanderAngle || 0) * 0.1;
    }
    
    // Trail effect (simplified whiskers)
    if (now > (creature.state.lastTrailTime || 0) + 200) {
        creature.state.lastTrailTime = now;
        newEffects.push({
            id: now + Math.random(),
            type: 'CREATURE_TRAIL',
            position: { ...creature.position },
            life: 500,
            maxLife: 500,
            radius: 3,
            color: 'rgba(200, 200, 220, 0.5)'
        });
    }


    return { force, newEffects, newLogs: [] };
};

const updateGenericPursuit = (creature: Creature, enemies: Creature[]) => {
    const force = {x: 0, y: 0};
    const target = findNearest(creature, enemies);
    if (target) {
        const angle = Math.atan2(target.position.y - creature.position.y, target.position.x - creature.position.x);
        force.x = Math.cos(angle);
        force.y = Math.sin(angle);
    }
    return { force };
};

export const updateCreatureMovementAI = (creature: Creature, allCreatures: Creature[], now: number): { force: Vector; newEffects: ActiveJobEffect[]; newLogs: string[] } => {
    const allies = allCreatures.filter(c => c.team === creature.team && c.id !== creature.id);
    const enemies = allCreatures.filter(c => c.team !== creature.team);
    let result = { force: {x: 0, y: 0}, newEffects: [], newLogs: [] };

    switch(creature.type) {
        case 'NIT_LINE':
            switch(creature.evolutionStage) {
                case 1:
                    result = updateNit1Movement(creature, allies, enemies, now);
                    break;
                case 2:
                case 3:
                case 4:
                    // Higher stages are more aggressive
                    result = updateGenericPursuit(creature, enemies) as any;
                    // Simplified trail for higher stages for now
                    if (now > (creature.state.lastTrailTime || 0) + 100) {
                        creature.state.lastTrailTime = now;
                        result.newEffects.push({
                            id: now + Math.random(),
                            type: 'CREATURE_TRAIL',
                            position: { ...creature.position },
                            life: 1000, maxLife: 1000, radius: creature.evolutionStage,
                            color: 'rgba(220, 220, 255, 0.7)'
                        });
                    }
                    break;
            }
            break;
        case 'BLOOM_WILT':
            if (creature.stance === 'BLOOM') {
                const damagedAlly = findNearest(creature, allies.filter(a => a.health < a.maxHealth));
                if (damagedAlly) {
                     const angle = Math.atan2(damagedAlly.position.y - creature.position.y, damagedAlly.position.x - creature.position.x);
                     result.force.x = Math.cos(angle) * 0.5;
                     result.force.y = Math.sin(angle) * 0.5;
                } else {
                     // Drift aimlessly
                     if (Math.random() < 0.02) creature.state.wanderAngle = Math.random() * Math.PI * 2;
                     result.force.x = Math.cos(creature.state.wanderAngle || 0) * 0.1;
                     result.force.y = Math.sin(creature.state.wanderAngle || 0) * 0.1;
                }
                 if (now > (creature.state.lastTrailTime || 0) + 500) {
                    creature.state.lastTrailTime = now;
                    result.newEffects.push({
                        id: now + Math.random(), type: 'CREATURE_TRAIL', position: { ...creature.position },
                        life: 1000, maxLife: 1000, radius: 8, color: 'rgba(100, 220, 100, 0.4)'
                    });
                 }
            } else { // WILT
                result = updateGenericPursuit(creature, enemies) as any;
                 if (now > (creature.state.lastTrailTime || 0) + 200) {
                    creature.state.lastTrailTime = now;
                    result.newEffects.push({
                        id: now + Math.random(), type: 'CREATURE_TRAIL', position: { ...creature.position },
                        life: 2000, maxLife: 2000, radius: 5, color: 'rgba(50, 50, 50, 0.6)'
                    });
                 }
            }
            break;
    }

    return result;
};
