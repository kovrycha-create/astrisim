import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['Vitarîs'];

export const triggerVitalBloom = (
    caster: Strand,
    strands: Strand[],
    now: number
): ActiveUltimate => {
    // Apply immediate speed boost to Vitarîs
    caster.tempSpeedModifier = config.SELF_SPEED_BOOST;
    caster.jobState.vitalBloomActive = true;
    caster.jobState.vitalBloomEndTime = now + config.DURATION * 1000;

    return {
        id: now + caster.id,
        type: 'VITAL_BLOOM',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position }, // Stationary field at cast position
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: config.RADIUS,
        maxRadius: config.RADIUS,
        color: 'rgba(50, 255, 100, 0.5)',
        data: {
            fieldPosition: { ...caster.position }, // Field doesn't move
            speedBoost: config.SPEED_BOOST,
            selfSpeedBoost: config.SELF_SPEED_BOOST,
            chargeBoostRate: config.CHARGE_BOOST_RATE,
            healPerSecond: config.HEAL_PER_SECOND,
            affectedStrands: new Set<number>(),
        }
    };
};

export const updateVitalBloom = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    healMap: Map<number, number>,
    effects: Array<{type: string, strandId: number, value: any}>,
    ultimateChargeGains: Map<number, number>
} => {
    const healMap = new Map<number, number>();
    const effects: Array<{type: string, strandId: number, value: any}> = [];
    const ultimateChargeGains = new Map<number, number>();
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) return { healMap, effects, ultimateChargeGains };

    // Maintain caster's speed boost
    if (caster.jobState.vitalBloomActive) {
        caster.tempSpeedModifier = config.SELF_SPEED_BOOST;
    }

    // Track who's in the field this frame
    const currentlyAffected = new Set<number>();

    // Apply effects to allies in the stationary field
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - ultimate.data.fieldPosition.x,
            strand.position.y - ultimate.data.fieldPosition.y
        );
        
        if (dist <= ultimate.radius) {
            const relationshipScore = caster.id === strand.id ? 1 :
                (relationshipMatrix[caster.name]?.[strand.name] ?? 0);

            const isAlly = relationshipScore >= RelationshipLevel.Friend || strand.id === caster.id;

            if (isAlly) {
                currentlyAffected.add(strand.id);
                
                // Apply speed boost (not to caster, they have their own)
                if (strand.id !== caster.id) {
                    effects.push({ 
                        type: 'SPEED_MODIFIER', 
                        strandId: strand.id, 
                        value: config.SPEED_BOOST 
                    });
                }
                
                // Apply healing
                const healAmount = config.HEAL_PER_SECOND * deltaSeconds;
                healMap.set(strand.id, healAmount);
                
                // Grant ultimate charge
                const chargeGain = config.CHARGE_BOOST_RATE * deltaSeconds;
                ultimateChargeGains.set(strand.id, chargeGain);
                
                // Track relationship improvement
                if (strand.id !== caster.id) {
                    relationshipEvents.push({
                        s1Name: caster.name,
                        s2Name: strand.name,
                        modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_HEAL_ALLY * deltaSeconds
                    });
                    relationshipEvents.push({
                        s1Name: caster.name,
                        s2Name: strand.name,
                        modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_SUPPORT_ALLY * deltaSeconds
                    });
                }
                
                // Log entry effect
                if (!ultimate.data.affectedStrands.has(strand.id)) {
                    ultimate.data.affectedStrands.add(strand.id);
                    if (strand.id !== caster.id) {
                        addLog(`${strand.name} enters the Vital Bloom!`);
                    }
                }
            }
        }
    });

    // Log exit effect
    ultimate.data.affectedStrands.forEach(id => {
        if (!currentlyAffected.has(id)) {
            const strand = strands.find(s => s.id === id);
            if (strand && strand.id !== caster.id) {
                addLog(`${strand.name} leaves the Vital Bloom.`);
            }
        }
    });
    ultimate.data.affectedStrands = currentlyAffected;

    return { healMap, effects, ultimateChargeGains };
};

export const onVitalBloomEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        caster.tempSpeedModifier = 1.0;
        delete caster.jobState.vitalBloomActive;
        delete caster.jobState.vitalBloomEndTime;
        addLog(`${caster.name}'s Vital Bloom dissipates.`);
    }
};

export const renderVitalBloom = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    // Guard against NaN values which can crash rendering.
    const safeLife = typeof ultimate.life === 'number' ? ultimate.life : 0;
    const safeMaxLife = typeof ultimate.maxLife === 'number' && ultimate.maxLife > 0 ? ultimate.maxLife : 1;
    const alpha = safeLife / safeMaxLife;

    const pulse = 0.8 + 0.2 * Math.sin(now / 200);
    
    // Create life energy gradient
    const gradient = ctx.createRadialGradient(
        ultimate.data.fieldPosition.x, ultimate.data.fieldPosition.y, 0,
        ultimate.data.fieldPosition.x, ultimate.data.fieldPosition.y, ultimate.radius
    );
    
    gradient.addColorStop(0, `rgba(150, 255, 150, ${0.1 * alpha * pulse})`);
    gradient.addColorStop(0.5, `rgba(50, 220, 100, ${0.3 * alpha * pulse})`);
    gradient.addColorStop(0.8, `rgba(50, 220, 100, ${0.4 * alpha * pulse})`);
    gradient.addColorStop(1, `rgba(0, 255, 120, ${0.1 * alpha * pulse})`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ultimate.data.fieldPosition.x, ultimate.data.fieldPosition.y, ultimate.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add life particle fountain
    for (let i = 0; i < 3; i++) {
        if (Math.random() < 0.3) {
            const angle = (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 3;
            const lifetime = Math.random() * 30;
            
            ctx.fillStyle = `rgba(100, 255, 150, ${alpha * (1 - lifetime / 30)})`;
            ctx.beginPath();
            ctx.arc(
                ultimate.data.fieldPosition.x + Math.cos(angle) * lifetime * 2,
                ultimate.data.fieldPosition.y - lifetime * speed,
                Math.max(0, 3 - (lifetime / 10)),
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    // Speed lines effect for boosted strands
    if (ultimate.data.affectedStrands.size > 0 && Math.random() < 0.2) {
        ctx.strokeStyle = `rgba(200, 255, 200, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        
        const angle = Math.random() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(
            ultimate.data.fieldPosition.x + Math.cos(angle) * 20,
            ultimate.data.fieldPosition.y + Math.sin(angle) * 20
        );
        ctx.lineTo(
            ultimate.data.fieldPosition.x + Math.cos(angle) * ultimate.radius * 0.8,
            ultimate.data.fieldPosition.y + Math.sin(angle) * ultimate.radius * 0.8
        );
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    ctx.restore();
};