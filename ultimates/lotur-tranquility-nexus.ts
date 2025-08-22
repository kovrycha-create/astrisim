import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['lotŭr'];

export const triggerTranquilityNexus = (
    caster: Strand,
    strands: Strand[],
    now: number
): ActiveUltimate => {
    // Immobilize lotŭr
    caster.velocity = { x: 0, y: 0 };
    caster.jobState.isChanneling = true;
    caster.jobState.channelEndTime = now + config.DURATION * 1000;

    return {
        id: now + caster.id,
        type: 'TRANQUILITY_NEXUS',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position },
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: 0, // Will expand to config.RADIUS
        maxRadius: config.RADIUS,
        color: 'rgba(100, 200, 255, 0.5)',
        data: {
            isImmobilizing: true,
            healPerSecond: config.HEAL_PER_SECOND,
            slowFactor: config.SLOW_FACTOR,
        }
    };
};

export const updateTranquilityNexus = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    damageMap: Map<number, number>,
    healMap: Map<number, number>,
    effects: Array<{type: string, strandId: number, value: any}>
} => {
    const damageMap = new Map<number, number>();
    const healMap = new Map<number, number>();
    const effects: Array<{type: string, strandId: number, value: any}> = [];
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) return { damageMap, healMap, effects };

    // Keep caster immobilized
    if (caster.jobState.isChanneling) {
        caster.velocity = { x: 0, y: 0 };
        effects.push({ type: 'IMMOBILIZE', strandId: caster.id, value: true });
    }

    // Expand radius gradually
    if (ultimate.radius < ultimate.maxRadius) {
        ultimate.radius = Math.min(
            ultimate.maxRadius,
            ultimate.radius + (ultimate.maxRadius / 2) * deltaSeconds
        );
    }

    // Apply effects to strands in radius
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - ultimate.position.x,
            strand.position.y - ultimate.position.y
        );
        
        if (dist <= ultimate.radius) {
            const relationshipScore = caster.id === strand.id ? 1 :
                (relationshipMatrix[caster.name]?.[strand.name] ?? 0);

            const isAlly = relationshipScore >= RelationshipLevel.Friend || strand.id === caster.id;

            if (isAlly) {
                // Heal allies
                const healAmount = config.HEAL_PER_SECOND * deltaSeconds;
                healMap.set(strand.id, healAmount);
                
                // Track relationship improvement
                if (strand.id !== caster.id) {
                    relationshipEvents.push({
                        s1Name: caster.name,
                        s2Name: strand.name,
                        modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_HEAL_ALLY * deltaSeconds
                    });
                }
            } else {
                // Slow enemies
                effects.push({ 
                    type: 'SPEED_MODIFIER', 
                    strandId: strand.id, 
                    value: config.SLOW_FACTOR 
                });
                
                // Track relationship impact
                relationshipEvents.push({
                    s1Name: caster.name,
                    s2Name: strand.name,
                    modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_DAMAGE_ENEMY * deltaSeconds
                });
            }
        }
    });

    return { damageMap, healMap, effects };
};

export const onTranquilityNexusEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        delete caster.jobState.isChanneling;
        delete caster.jobState.channelEndTime;
        addLog(`${caster.name}'s Tranquility Nexus fades.`);
    }
};

export const renderTranquilityNexus = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    const pulse = 0.9 + 0.1 * Math.sin(now / 400);
    
    // Create sanctuary gradient
    const gradient = ctx.createRadialGradient(
        ultimate.position.x, ultimate.position.y, 0,
        ultimate.position.x, ultimate.position.y, ultimate.radius * pulse
    );
    
    gradient.addColorStop(0, `rgba(100, 200, 255, 0)`);
    gradient.addColorStop(0.7, `rgba(100, 200, 255, ${0.2 * alpha * pulse})`);
    gradient.addColorStop(1, `rgba(100, 200, 255, ${0.3 * alpha * pulse})`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Add peaceful particle effect
    if (Math.random() < 0.1) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * ultimate.radius;
        ctx.fillStyle = `rgba(150, 220, 255, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(
            ultimate.position.x + Math.cos(angle) * dist,
            ultimate.position.y + Math.sin(angle) * dist,
            2, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    ctx.restore();
};