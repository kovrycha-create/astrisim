
import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['Elly'];

export const triggerFissure = (
    caster: Strand,
    strands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): ActiveUltimate => {
    // Mark enemies in range for trapping
    const trappedEnemies: number[] = [];
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === caster.id) return;
        
        const dist = Math.hypot(
            strand.position.x - caster.position.x,
            strand.position.y - caster.position.y
        );
        
        if (dist <= config.MAX_RADIUS) {
            const rel = relationshipMatrix[caster.name]?.[strand.name] ?? RelationshipLevel.Acquaintance;
            const isEnemy = rel <= RelationshipLevel.Acquaintance;
            if (isEnemy) {
                trappedEnemies.push(strand.id);
            }
        }
    });

    return {
        id: now + caster.id,
        type: 'FISSURE',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position },
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: 0, // Will expand to MAX_RADIUS
        maxRadius: config.MAX_RADIUS,
        color: 'rgba(139, 69, 19, 0.8)',
        data: {
            expansionPhase: true,
            expansionTime: 1.0, // 1 second to expand and trap
            trappedStrands: trappedEnemies,
            wallClosed: false,
            damagePerSecond: config.DAMAGE_PER_SECOND,
            slowFactor: config.SLOW_FACTOR,
            crackLines: generateCrackLines(caster.position, config.MAX_RADIUS),
        }
    };
};

function generateCrackLines(center: Vector, radius: number): Array<{start: Vector, end: Vector}> {
    const lines = [];
    const numCracks = 8 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numCracks; i++) {
        const angle = (i / numCracks) * Math.PI * 2 + Math.random() * 0.3;
        const length = radius * (0.3 + Math.random() * 0.7);
        lines.push({
            start: {
                x: center.x + Math.cos(angle) * 20,
                y: center.y + Math.sin(angle) * 20
            },
            end: {
                x: center.x + Math.cos(angle) * length,
                y: center.y + Math.sin(angle) * length
            }
        });
    }
    
    return lines;
}

export const updateFissure = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    damageMap: Map<number, number>,
    effects: Array<{type: string, strandId: number, value: any}>,
    screenShake: boolean
} => {
    const damageMap = new Map<number, number>();
    const effects: Array<{type: string, strandId: number, value: any}> = [];
    let screenShake = false;
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) return { damageMap, effects, screenShake };

    // Handle expansion phase
    if (ultimate.data.expansionPhase) {
        ultimate.radius = Math.min(
            ultimate.maxRadius,
            ultimate.radius + (ultimate.maxRadius / ultimate.data.expansionTime) * deltaSeconds
        );
        
        // Close the trap after expansion
        if (ultimate.radius >= ultimate.maxRadius && !ultimate.data.wallClosed) {
            ultimate.data.wallClosed = true;
            ultimate.data.expansionPhase = false;
            addLog(`${caster.name}'s Fissure trap closes!`);
            screenShake = true;
        }
    }

    // Apply effects to trapped enemies
    ultimate.data.trappedStrands.forEach(strandId => {
        const strand = strands.find(s => s.id === strandId);
        if (!strand || !strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - ultimate.position.x,
            strand.position.y - ultimate.position.y
        );
        
        // Keep enemies trapped inside
        if (ultimate.data.wallClosed && dist > ultimate.radius - strand.radius) {
            // Push back inside
            const angle = Math.atan2(
                strand.position.y - ultimate.position.y,
                strand.position.x - ultimate.position.x
            );
            const targetDist = ultimate.radius - strand.radius - 5;
            strand.position.x = ultimate.position.x + Math.cos(angle) * targetDist;
            strand.position.y = ultimate.position.y + Math.sin(angle) * targetDist;
            
            // Bounce velocity
            strand.velocity.x *= -0.8;
            strand.velocity.y *= -0.8;
        }
        
        // Apply slow
        effects.push({ 
            type: 'SPEED_MODIFIER', 
            strandId: strand.id, 
            value: config.SLOW_FACTOR 
        });
        
        // Apply damage
        const damageAmount = config.DAMAGE_PER_SECOND * deltaSeconds;
        damageMap.set(strand.id, damageAmount);
        
        // Add slight shake to trapped enemies
        if (Math.random() < 0.1) {
            strand.position.x += (Math.random() - 0.5) * 2;
            strand.position.y += (Math.random() - 0.5) * 2;
        }
        
        // Track relationship impact
        relationshipEvents.push({
            s1Name: caster.name,
            s2Name: strand.name,
            modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_DAMAGE_ENEMY * deltaSeconds
        });
    });

    return { damageMap, effects, screenShake };
};

export const onFissureEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        addLog(`${caster.name}'s Fissure closes.`);
    }
    
    // Release trapped strands
    ultimate.data.trappedStrands = [];
};

export const renderFissure = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    
    // Draw crack lines
    ctx.strokeStyle = `rgba(80, 40, 10, ${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ultimate.data.crackLines.forEach((crack: {start: Vector, end: Vector}) => {
        const progress = Math.min(1, ultimate.radius / ultimate.maxRadius);
        ctx.beginPath();
        ctx.moveTo(crack.start.x, crack.start.y);
        ctx.lineTo(
            crack.start.x + (crack.end.x - crack.start.x) * progress,
            crack.start.y + (crack.end.y - crack.start.y) * progress
        );
        ctx.stroke();
    });
    
    // Draw chasm circle
    if (ultimate.data.wallClosed) {
        // Solid perimeter wall
        ctx.strokeStyle = `rgba(139, 69, 19, ${alpha})`;
        ctx.lineWidth = 20 * alpha;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner darkness
        const gradient = ctx.createRadialGradient(
            ultimate.position.x, ultimate.position.y, ultimate.radius * 0.5,
            ultimate.position.x, ultimate.position.y, ultimate.radius
        );
        gradient.addColorStop(0, `rgba(20, 10, 5, ${alpha * 0.9})`);
        gradient.addColorStop(1, `rgba(60, 30, 15, ${alpha * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, Math.max(0, ultimate.radius - 10), 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Expanding warning ring
        ctx.strokeStyle = `rgba(255, 100, 50, ${alpha * (0.5 + 0.5 * Math.sin(now / 100))})}`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Earth particles
    for (let i = 0; i < 5; i++) {
        if (Math.random() < 0.2 * alpha) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * ultimate.radius;
            ctx.fillStyle = `rgba(100, 60, 30, ${alpha * Math.random()})`;
            ctx.fillRect(
                ultimate.position.x + Math.cos(angle) * dist - 2,
                ultimate.position.y + Math.sin(angle) * dist - 2,
                4, 4
            );
        }
    }
    
    ctx.restore();
};
