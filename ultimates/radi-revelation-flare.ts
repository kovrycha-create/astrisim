import type { Strand, ActiveUltimate, StrandName, Vector, TransientVfx, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['ℛadí'];

export const triggerRevelationFlare = (
    caster: Strand,
    strands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): ActiveUltimate => {
    // Instant effect - find all targets immediately
    const affectedEnemies: number[] = [];
    const affectedAllies: number[] = [];
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - caster.position.x,
            strand.position.y - caster.position.y
        );
        
        if (dist <= config.RADIUS) {
            const rel = relationshipMatrix[caster.name]?.[strand.name] ?? RelationshipLevel.Acquaintance;
            const isAlly = strand.id === caster.id || rel >= RelationshipLevel.Friend;
            
            if (isAlly) {
                affectedAllies.push(strand.id);
            } else {
                affectedEnemies.push(strand.id);
            }
        }
    });

    return {
        id: now + caster.id,
        type: 'REVELATION_FLARE',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position },
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: 0, // Will expand visually
        maxRadius: config.RADIUS,
        color: 'rgba(255, 255, 200, 0.9)',
        data: {
            instantBurst: true,
            enemiesHit: affectedEnemies,
            alliesBoosted: affectedAllies,
            damage: config.DAMAGE,
            chargeGain: config.CHARGE_GAIN,
            burstComplete: false,
            lightRays: generateLightRays(caster.position, config.RADIUS),
        }
    };
};

function generateLightRays(center: Vector, radius: number): Array<{angle: number, length: number, width: number}> {
    const rays = [];
    const numRays = 12 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numRays; i++) {
        rays.push({
            angle: (i / numRays) * Math.PI * 2 + Math.random() * 0.2,
            length: radius * (0.8 + Math.random() * 0.4),
            width: 5 + Math.random() * 10,
        });
    }
    
    return rays;
}

export const updateRevelationFlare = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    instantDamage: Map<number, number>,
    instantChargeGain: Map<number, number>,
    visualEffects: Array<{type: string, position: Vector, data: any}>
} => {
    const instantDamage = new Map<number, number>();
    const instantChargeGain = new Map<number, number>();
    const visualEffects: Array<{type: string, position: Vector, data: any}> = [];
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) return { instantDamage, instantChargeGain, visualEffects };

    // Apply instant burst on first frame
    if (!ultimate.data.burstComplete) {
        ultimate.data.burstComplete = true;
        
        // Damage enemies
        ultimate.data.enemiesHit.forEach((strandId: number) => {
            const strand = strands.find(s => s.id === strandId);
            if (strand && strand.visible && !strand.isDefeated) {
                instantDamage.set(strand.id, config.DAMAGE);
                
                visualEffects.push({
                    type: 'BURN_FLASH',
                    position: { ...strand.position },
                    data: { intensity: 0.8, color: 'white' }
                });
                
                // Track relationship impact
                relationshipEvents.push({
                    s1Name: caster.name,
                    s2Name: strand.name,
                    modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_BURST_DAMAGE_ENEMY
                });
            }
        });
        
        // Boost allies' ultimate charge
        ultimate.data.alliesBoosted.forEach((strandId: number) => {
            const strand = strands.find(s => s.id === strandId);
            if (strand && strand.visible && !strand.isDefeated) {
                // Don't boost self
                if (strand.id !== caster.id) {
                    instantChargeGain.set(strand.id, config.CHARGE_GAIN);
                    
                    visualEffects.push({
                        type: 'CHARGE_SURGE',
                        position: { ...strand.position },
                        data: { 
                            amount: config.CHARGE_GAIN,
                            color: 'gold',
                            targetId: strand.id
                        }
                    });
                    
                    // Track relationship improvement
                    relationshipEvents.push({
                        s1Name: caster.name,
                        s2Name: strand.name,
                        modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_SUPPORT_ALLY
                    });
                }
            }
        });
        
        addLog(`${caster.name}'s Revelation Flare empowers allies!`);
        
        // Screen flash effect
        visualEffects.push({
            type: 'SCREEN_FLASH',
            position: { ...ultimate.position },
            data: { intensity: 0.9, duration: 0.2, color: 'white' }
        });
    }
    
    // Expand visual radius for effect
    if (ultimate.radius < ultimate.maxRadius) {
        ultimate.radius = Math.min(
            ultimate.maxRadius,
            ultimate.radius + (ultimate.maxRadius * 4) * deltaSeconds // Very fast expansion
        );
    }

    return { instantDamage, instantChargeGain, visualEffects };
};

export const onRevelationFlareEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    // Short effect, minimal cleanup needed
};

export const renderRevelationFlare = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    const flashIntensity = alpha * alpha; // Quadratic falloff for sharp flash
    
    // Central brilliant flash
    const gradient = ctx.createRadialGradient(
        ultimate.position.x, ultimate.position.y, 0,
        ultimate.position.x, ultimate.position.y, ultimate.radius
    );
    
    gradient.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity * 0.9})`);
    gradient.addColorStop(0.2, `rgba(255, 255, 200, ${flashIntensity * 0.7})`);
    gradient.addColorStop(0.5, `rgba(255, 223, 100, ${flashIntensity * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Light rays emanating outward
    ctx.save();
    ctx.translate(ultimate.position.x, ultimate.position.y);
    
    ultimate.data.lightRays.forEach((ray: any) => {
        const rayAlpha = flashIntensity * (0.5 + Math.random() * 0.5);
        const rayGradient = ctx.createLinearGradient(0, 0, ray.length, 0);
        
        rayGradient.addColorStop(0, `rgba(255, 255, 200, ${rayAlpha})`);
        rayGradient.addColorStop(0.5, `rgba(255, 223, 100, ${rayAlpha * 0.6})`);
        rayGradient.addColorStop(1, `rgba(255, 200, 0, 0)`);
        
        ctx.save();
        ctx.rotate(ray.angle);
        ctx.fillStyle = rayGradient;
        ctx.beginPath();
        ctx.moveTo(0, -ray.width / 2);
        ctx.lineTo(ray.length, -ray.width / 4);
        ctx.lineTo(ray.length, ray.width / 4);
        ctx.lineTo(0, ray.width / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
    
    ctx.restore();
    
    // Expanding shockwave ring
    if (ultimate.radius > 10) {
        ctx.strokeStyle = `rgba(255, 255, 200, ${flashIntensity * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Charge particles flowing to allies
    if (ultimate.data.alliesBoosted.length > 0 && flashIntensity > 0.5) {
        ultimate.data.alliesBoosted.forEach((strandId: number, index: number) => {
            if (Math.random() < 0.3) {
                const progress = 1 - flashIntensity;
                const particlePos = {
                    x: ultimate.position.x + Math.cos(index) * ultimate.radius * progress,
                    y: ultimate.position.y + Math.sin(index) * ultimate.radius * progress
                };
                
                ctx.fillStyle = `rgba(255, 215, 0, ${flashIntensity})`;
                ctx.beginPath();
                ctx.arc(particlePos.x, particlePos.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    ctx.restore();
};
