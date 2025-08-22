import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['OptiX'];

export const triggerDuelArena = (
    caster: Strand,
    strands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): ActiveUltimate => {
    let nearestEnemy: Strand | null = null;
    let minDistance = Infinity;

    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === caster.id) return;
        
        const rel = relationshipMatrix[caster.name]?.[strand.name] ?? RelationshipLevel.Acquaintance;
        const isEnemy = rel <= RelationshipLevel.Acquaintance;

        if (isEnemy) {
            const dist = Math.hypot(strand.position.x - caster.position.x, strand.position.y - caster.position.y);
            if (dist < minDistance) {
                minDistance = dist;
                nearestEnemy = strand;
            }
        }
    });

    const targetId = nearestEnemy ? nearestEnemy.id : -1;

    return {
        id: now + caster.id,
        type: 'DUEL_ARENA',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position },
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: config.RADIUS,
        maxRadius: config.RADIUS,
        color: 'rgba(255, 50, 50, 0.7)',
        data: {
            duelists: { sourceId: caster.id, targetId },
            damageBonus: config.DAMAGE_BONUS,
        }
    };
};

export const updateDuelArena = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    forces: Map<number, Vector>,
    damageModifierMap: Map<number, { targetId: number, multiplier: number }>,
} => {
    const forces = new Map<number, Vector>();
    const damageModifierMap = new Map<number, { targetId: number, multiplier: number }>();
    const { sourceId, targetId } = ultimate.data.duelists;

    // Apply damage bonus between duelists
    damageModifierMap.set(sourceId, { targetId: targetId, multiplier: ultimate.data.damageBonus });
    damageModifierMap.set(targetId, { targetId: sourceId, multiplier: ultimate.data.damageBonus });

    // Handle barrier physics
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        const isDuelist = strand.id === sourceId || strand.id === targetId;
        const dist = Math.hypot(strand.position.x - ultimate.position.x, strand.position.y - ultimate.position.y);

        if (isDuelist) {
            // Keep duelists inside
            if (dist > ultimate.radius - strand.radius) {
                const angle = Math.atan2(ultimate.position.y - strand.position.y, ultimate.position.x - strand.position.x);
                const pushForce: Vector = {
                    x: Math.cos(angle) * 0.5,
                    y: Math.sin(angle) * 0.5,
                };
                forces.set(strand.id, pushForce);
            }
        } else {
            // Push outsiders away from the barrier
            if (dist < ultimate.radius + strand.radius) {
                const angle = Math.atan2(strand.position.y - ultimate.position.y, strand.position.x - ultimate.position.x);
                 const pushForce: Vector = {
                    x: Math.cos(angle) * 0.8,
                    y: Math.sin(angle) * 0.8,
                };
                forces.set(strand.id, pushForce);
            }
        }
    });

    return { forces, damageModifierMap };
};

export const onDuelArenaEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        addLog(`${caster.name}'s Duel Arena collapses.`);
    }
};

export const renderDuelArena = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    const pulse = 1 + 0.02 * Math.sin(now / 100);
    const radius = ultimate.radius * pulse;

    // Shimmering barrier
    ctx.strokeStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
    ctx.lineWidth = 10;
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 20 * alpha;
    ctx.beginPath();
    ctx.arc(ultimate.position.x, ultimate.position.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner energy effect
    const gradient = ctx.createRadialGradient(
        ultimate.position.x, ultimate.position.y, 0,
        ultimate.position.x, ultimate.position.y, radius
    );
    gradient.addColorStop(0, `rgba(100, 0, 0, 0)`);
    gradient.addColorStop(0.9, `rgba(100, 0, 0, ${alpha * 0.1})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, ${alpha * 0.3})`);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Rotating energy motes on the barrier
    ctx.fillStyle = 'white';
    const numMotes = 8;
    for (let i = 0; i < numMotes; i++) {
        const angle = (i / numMotes) * Math.PI * 2 + (now / 1000);
        const x = ultimate.position.x + Math.cos(angle) * radius;
        const y = ultimate.position.y + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
};