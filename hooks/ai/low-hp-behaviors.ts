import type { Strand, Vector } from '../../types';

const findNearest = (source: Strand, targets: Strand[]): Strand | null => {
    let nearest: Strand | null = null;
    let minDistSq = Infinity;
    for (const target of targets) {
        if (!target.visible || target.isDefeated) continue;
        const distSq = (source.position.x - target.position.x)**2 + (source.position.y - target.position.y)**2;
        if (distSq < minDistSq) {
            minDistSq = distSq;
            nearest = target;
        }
    }
    return nearest;
};

const findCenterOfMass = (strands: Strand[]): Vector | null => {
    if (strands.length === 0) return null;
    const sum = strands.reduce((acc, s) => ({ x: acc.x + s.position.x, y: acc.y + s.position.y }), { x: 0, y: 0 });
    return { x: sum.x / strands.length, y: sum.y / strands.length };
};

export const applyLowHpBehavior = (
    strand: Strand,
    enemies: Strand[],
    allies: Strand[],
    now: number
): { force: Vector } => {
    const force: Vector = { x: 0, y: 0 };
    const nearestEnemy = findNearest(strand, enemies);
    const nearestAlly = findNearest(strand, allies);

    // Ensure tempBuffs array exists
    if (!strand.tempBuffs) strand.tempBuffs = [];
    strand.tempBuffs = strand.tempBuffs.filter(b => b.endTime > now);

    const addBuff = (type: string, duration: number, multiplier: number) => {
        if (!strand.tempBuffs?.some(b => b.type === type)) {
             strand.tempBuffs?.push({ type, endTime: now + duration, multiplier });
        }
    };

    switch (strand.name) {
        // --- Flee Behavior ---
        case 'Vitarîs':
        case 'Askänu':
            if (nearestEnemy) {
                const angle = Math.atan2(strand.position.y - nearestEnemy.position.y, strand.position.x - nearestEnemy.position.x);
                force.x = Math.cos(angle) * 0.1;
                force.y = Math.sin(angle) * 0.1;
            }
            strand.tempSpeedModifier *= 1.5;
            break;

        // --- Berserk Behavior ---
        case 'OptiX':
        case 'VOIDROT':
        case 'Ðethapart':
        case 'Cozmik':
            if (nearestEnemy) {
                const angle = Math.atan2(nearestEnemy.position.y - strand.position.y, nearestEnemy.position.x - strand.position.x);
                force.x = Math.cos(angle) * 0.08;
                force.y = Math.sin(angle) * 0.08;
            }
            strand.tempSpeedModifier *= 1.2;
            addBuff('LOW_HP_BERSERK', 1000, 1.3);
            break;

        // --- Defensive/Seek Ally Behavior ---
        case 'lotŭr':
        case 'Elly':
            if (nearestAlly) {
                const angle = Math.atan2(nearestAlly.position.y - strand.position.y, nearestAlly.position.x - strand.position.x);
                force.x = Math.cos(angle) * 0.07;
                force.y = Math.sin(angle) * 0.07;
            } else if (nearestEnemy) { // If no allies, flee
                const angle = Math.atan2(strand.position.y - nearestEnemy.position.y, strand.position.x - nearestEnemy.position.x);
                force.x = Math.cos(angle) * 0.05;
                force.y = Math.sin(angle) * 0.05;
            }
            strand.tempSpeedModifier *= 1.2;
            break;
            
        // --- Huddle with Allies Behavior ---
        case '丂anxxui':
        case 'Nectiv':
             const allyCenter = findCenterOfMass(allies);
             if(allyCenter) {
                 const angle = Math.atan2(allyCenter.y - strand.position.y, allyCenter.x - strand.position.x);
                 force.x = Math.cos(angle) * 0.06;
                 force.y = Math.sin(angle) * 0.06;
             }
             strand.tempSpeedModifier *= 1.1;
            break;

        // --- Desperate Power Behavior ---
        case 'ℛadí':
        case 'Virtuō':
            addBuff('LOW_HP_CHARGE', 1000, 3.0); // 3x ult charge rate
            break;

        // --- Erratic Behavior ---
        case 'Dræmin\'':
        case 'Memetic':
            force.x = (Math.random() - 0.5) * 0.2;
            force.y = (Math.random() - 0.5) * 0.2;
            strand.tempSpeedModifier *= 1.8;
            break;
            
        default:
             if (nearestEnemy) { // Default to fleeing
                const angle = Math.atan2(strand.position.y - nearestEnemy.position.y, strand.position.x - nearestEnemy.position.x);
                force.x = Math.cos(angle) * 0.05;
                force.y = Math.sin(angle) * 0.05;
            }
            break;
    }
    
    return { force };
};
