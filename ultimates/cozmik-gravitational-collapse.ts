import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['Cozmik'];

export const triggerGravitationalCollapse = (
    caster: Strand,
    strands: Strand[],
    now: number
): ActiveUltimate => {
    return {
        id: now + caster.id,
        type: 'GRAVITATIONAL_COLLAPSE',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position },
        life: config.PULL_DURATION + config.PUSH_DURATION,
        maxLife: config.PULL_DURATION + config.PUSH_DURATION,
        radius: config.RADIUS,
        maxRadius: config.RADIUS,
        color: 'rgba(25, 0, 50, 0.9)',
        phase: 'pull',
        data: {
            pullDuration: config.PULL_DURATION,
            pushDuration: config.PUSH_DURATION,
            pullStrength: config.PULL_STRENGTH,
            pushStrength: config.PUSH_STRENGTH,
            pushDamage: config.PUSH_DAMAGE,
            phaseStartTime: now,
            pulledStrands: new Set<number>(),
            eventHorizon: config.RADIUS * 0.1, // Central singularity
            spiralAngle: 0,
        }
    };
};

export const updateGravitationalCollapse = (
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
    forces: Map<number, Vector>,
    explosionTrigger: boolean
} => {
    const damageMap = new Map<number, number>();
    const effects: Array<{type: string, strandId: number, value: any}> = [];
    const forces = new Map<number, Vector>();
    let explosionTrigger = false;
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) return { damageMap, effects, forces, explosionTrigger };

    // Update spiral angle for visual effect
    ultimate.data.spiralAngle += 0.1;

    // Phase transition
    if (ultimate.phase === 'pull' && ultimate.life <= config.PUSH_DURATION) {
        ultimate.phase = 'push';
        ultimate.data.phaseStartTime = now;
        explosionTrigger = true;
        addLog(`${caster.name}'s singularity explodes!`);
    }

    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - ultimate.position.x,
            strand.position.y - ultimate.position.y
        );
        
        if (dist <= ultimate.radius) {
            if (ultimate.phase === 'pull') {
                // PULL PHASE - Gravitational attraction
                const pullForce = (1 - dist / ultimate.radius) * ultimate.data.pullStrength;
                const angle = Math.atan2(
                    ultimate.position.y - strand.position.y,
                    ultimate.position.x - strand.position.x
                );
                
                // Add spiral motion for visual interest
                const spiralOffset = Math.PI / 6;
                const spiralAngle = angle + spiralOffset;
                
                const force: Vector = {
                    x: Math.cos(spiralAngle) * pullForce,
                    y: Math.sin(spiralAngle) * pullForce
                };
                
                forces.set(strand.id, force);
                ultimate.data.pulledStrands.add(strand.id);
                
                // Slow strands as they approach event horizon
                if (dist < ultimate.data.eventHorizon * 3) {
                    effects.push({
                        type: 'SPEED_MODIFIER',
                        strandId: strand.id,
                        value: 0.5
                    });
                }
                
                // Apply spaghettification visual stretch near center
                if (dist < ultimate.data.eventHorizon * 2) {
                    effects.push({
                        type: 'VISUAL_STRETCH',
                        strandId: strand.id,
                        value: 1 + (1 - dist / (ultimate.data.eventHorizon * 2))
                    });
                }
            } else {
                // PUSH PHASE - Explosive repulsion
                if (ultimate.data.pulledStrands.has(strand.id)) {
                    const pushForce = ultimate.data.pushStrength * (1 - dist / ultimate.radius);
                    const angle = Math.atan2(
                        strand.position.y - ultimate.position.y,
                        strand.position.x - ultimate.position.x
                    );
                    
                    const force: Vector = {
                        x: Math.cos(angle) * pushForce,
                        y: Math.sin(angle) * pushForce
                    };
                    
                    forces.set(strand.id, force);
                    
                    // Apply damage based on proximity during explosion
                    const proximityFactor = Math.max(0, 1 - dist / (ultimate.radius * 0.5));
                    const damage = ultimate.data.pushDamage * proximityFactor;
                    
                    if (damage > 0) {
                        damageMap.set(strand.id, damage);
                        
                        // Track relationships for enemies only
                        const rel = relationshipMatrix[caster.name]?.[strand.name] ?? RelationshipLevel.Acquaintance;
                        const isEnemy = rel <= RelationshipLevel.Acquaintance;

                        if (strand.id !== caster.id && isEnemy) {
                            relationshipEvents.push({
                                s1Name: caster.name,
                                s2Name: strand.name,
                                modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_DAMAGE_ENEMY
                            });
                        }
                    }
                }
            }
        }
    });

    return { damageMap, effects, forces, explosionTrigger };
};

export const onGravitationalCollapseEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        addLog(`${caster.name}'s gravitational field dissipates.`);
    }
};

export const renderGravitationalCollapse = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    
    if (ultimate.phase === 'pull') {
        // Black hole effect
        const gradient = ctx.createRadialGradient(
            ultimate.position.x, ultimate.position.y, 0,
            ultimate.position.x, ultimate.position.y, ultimate.maxRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        gradient.addColorStop(0.1, 'rgba(25, 0, 50, 0.8)');
        gradient.addColorStop(0.3, 'rgba(25, 0, 50, 0.6)');
        gradient.addColorStop(0.7, 'rgba(25, 0, 50, 0.3)');
        gradient.addColorStop(1, 'rgba(25, 0, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.maxRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Event horizon
        ctx.strokeStyle = `rgba(100, 50, 200, ${alpha * (0.5 + 0.5 * Math.sin(now / 100))})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, ultimate.data.eventHorizon, 0, Math.PI * 2);
        ctx.stroke();
        
        // Accretion disk spirals
        ctx.strokeStyle = `rgba(150, 100, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            const startAngle = ultimate.data.spiralAngle + (i * Math.PI * 2 / 3);
            for (let j = 0; j < 100; j++) {
                const t = j / 100;
                const radius = ultimate.data.eventHorizon + (ultimate.radius * 0.7 - ultimate.data.eventHorizon) * t;
                const angle = startAngle + t * Math.PI * 4;
                const x = ultimate.position.x + Math.cos(angle) * radius;
                const y = ultimate.position.y + Math.sin(angle) * radius;
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Gravitational lensing distortion (simplified)
        if (Math.random() < 0.1) {
            const distortRadius = ultimate.radius * 0.3;
            ctx.strokeStyle = `rgba(100, 100, 255, ${alpha * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                ultimate.position.x + (Math.random() - 0.5) * distortRadius,
                ultimate.position.y + (Math.random() - 0.5) * distortRadius,
                distortRadius * Math.random(),
                0, Math.PI * 2
            );
            ctx.stroke();
        }
    } else {
        // PUSH PHASE - Explosion
        const pushProgress = 1 - (ultimate.life / config.PUSH_DURATION);
        const explosionRadius = ultimate.radius * pushProgress;
        
        // White flash at center
        const flashGradient = ctx.createRadialGradient(
            ultimate.position.x, ultimate.position.y, 0,
            ultimate.position.x, ultimate.position.y, explosionRadius
        );
        
        flashGradient.addColorStop(0, `rgba(255, 255, 255, ${(1 - pushProgress) * 0.9})`);
        flashGradient.addColorStop(0.3, `rgba(200, 150, 255, ${(1 - pushProgress) * 0.6})`);
        flashGradient.addColorStop(1, `rgba(100, 50, 200, 0)`);
        
        ctx.fillStyle = flashGradient;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, explosionRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Shockwave rings
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - pushProgress) * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ultimate.position.x, ultimate.position.y, explosionRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Energy bolts shooting outward
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + ultimate.data.spiralAngle;
            const boltLength = explosionRadius * 0.3;
            
            ctx.strokeStyle = `rgba(200, 150, 255, ${(1 - pushProgress) * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                ultimate.position.x + Math.cos(angle) * explosionRadius * 0.7,
                ultimate.position.y + Math.sin(angle) * explosionRadius * 0.7
            );
            ctx.lineTo(
                ultimate.position.x + Math.cos(angle) * (explosionRadius * 0.7 + boltLength),
                ultimate.position.y + Math.sin(angle) * (explosionRadius * 0.7 + boltLength)
            );
            ctx.stroke();
        }
    }
    
    ctx.restore();
};