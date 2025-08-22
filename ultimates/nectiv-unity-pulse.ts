import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG['Nectiv'];

export const triggerUnityPulse = (
    caster: Strand,
    strands: Strand[],
    now: number
): ActiveUltimate => {
    // Find nearest enemy to designate as anchor
    let nearestEnemy: Strand | null = null;
    let nearestDistance = Infinity;
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === caster.id) return;
        
        const dist = Math.hypot(
            strand.position.x - caster.position.x,
            strand.position.y - caster.position.y
        );
        
        // Check if enemy (simplified - would use relationship matrix)
        const isEnemy = Math.random() > 0.3; // More likely to be enemy
        
        if (isEnemy && dist < nearestDistance) {
            nearestDistance = dist;
            nearestEnemy = strand;
        }
    });
    
    if (!nearestEnemy) {
        // No valid anchor target
        return null as any; // Would handle properly
    }

    // Find all strands in radius to pull
    const pulledStrands: number[] = [];
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - nearestEnemy!.position.x,
            strand.position.y - nearestEnemy!.position.y
        );
        
        if (dist <= config.RADIUS && strand.id !== nearestEnemy!.id) {
            pulledStrands.push(strand.id);
        }
    });

    return {
        id: now + caster.id,
        type: 'UNITY_PULSE',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...nearestEnemy.position }, // Will follow anchor
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: config.RADIUS,
        maxRadius: config.RADIUS,
        color: 'rgba(255, 160, 0, 0.5)',
        data: {
            anchorId: nearestEnemy.id,
            anchorName: nearestEnemy.name,
            participants: pulledStrands,
            pullStrength: config.PULL_STRENGTH,
            damagePerSecond: config.DAMAGE_PER_SECOND,
            tethers: [],
            pullWaves: [],
            totalPulled: 0,
        }
    };
};

export const updateUnityPulse = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    forces: Map<number, Vector>,
    damageMap: Map<number, number>,
    visualEffects: Array<{type: string, data: any}>,
    ended: boolean
} => {
    const forces = new Map<number, Vector>();
    const damageMap = new Map<number, number>();
    const visualEffects: Array<{type: string, data: any}> = [];
    let ended = false;
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    const anchor = strands.find(s => s.id === ultimate.data.anchorId);
    
    if (!caster || !anchor || !anchor.visible || anchor.isDefeated) {
        ended = true;
        if (!anchor || anchor.isDefeated) {
            addLog(`Unity Pulse ends - anchor defeated.`);
        }
        return { forces, damageMap, visualEffects, ended };
    }

    // Update position to follow anchor
    ultimate.position = { ...anchor.position };

    // Generate pull waves periodically
    if (Math.random() < 0.05) {
        ultimate.data.pullWaves.push({
            radius: 0,
            maxRadius: ultimate.radius,
            life: 1,
            alpha: 1
        });
    }
    
    // Update pull waves
    ultimate.data.pullWaves = ultimate.data.pullWaves.filter((wave: any) => {
        wave.radius += ultimate.radius * deltaSeconds;
        wave.life -= deltaSeconds;
        wave.alpha = wave.life;
        return wave.life > 0;
    });

    // Update tethers and apply pull forces
    ultimate.data.tethers = [];
    let activePullCount = 0;
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === anchor.id) return;
        
        const dist = Math.hypot(
            strand.position.x - anchor.position.x,
            strand.position.y - anchor.position.y
        );
        
        if (dist <= ultimate.radius) {
            // Create tether visual
            ultimate.data.tethers.push({
                from: { ...anchor.position },
                to: { ...strand.position },
                strength: 1 - (dist / ultimate.radius),
                isEnemy: strand.id !== caster.id && Math.random() > 0.3
            });
            
            // Calculate pull force
            const pullDirection = {
                x: anchor.position.x - strand.position.x,
                y: anchor.position.y - strand.position.y
            };
            
            const pullMagnitude = ultimate.data.pullStrength * (1 - dist / ultimate.radius);
            const normalizedPull = Math.sqrt(pullDirection.x ** 2 + pullDirection.y ** 2);
            
            if (normalizedPull > 0) {
                const force: Vector = {
                    x: (pullDirection.x / normalizedPull) * pullMagnitude,
                    y: (pullDirection.y / normalizedPull) * pullMagnitude
                };
                
                forces.set(strand.id, force);
                activePullCount++;
                
                // Apply damage to enemies
                const isEnemy = strand.id !== caster.id && Math.random() > 0.3; // Simplified
                if (isEnemy) {
                    const damage = config.DAMAGE_PER_SECOND * deltaSeconds;
                    damageMap.set(strand.id, damage);
                    
                    // Track relationship impact
                    relationshipEvents.push({
                        s1Name: caster.name,
                        s2Name: strand.name,
                        modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_DAMAGE_ENEMY * deltaSeconds
                    });
                }
            }
            
            // Add gravitational distortion particles
            if (Math.random() < 0.1) {
                visualEffects.push({
                    type: 'GRAVITY_PARTICLE',
                    data: {
                        position: { ...strand.position },
                        velocity: {
                            x: (anchor.position.x - strand.position.x) * 0.1,
                            y: (anchor.position.y - strand.position.y) * 0.1
                        }
                    }
                });
            }
        }
    });
    
    ultimate.data.totalPulled = activePullCount;

    return { forces, damageMap, visualEffects, ended };
};

export const onUnityPulseEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        addLog(`${caster.name}'s Unity Pulse dissipates. ${ultimate.data.totalPulled} strands affected.`);
    }
};

export const renderUnityPulse = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    const anchor = strands.find(s => s.id === ultimate.data.anchorId);
    
    if (!anchor) {
        ctx.restore();
        return;
    }
    
    // Draw gravitational field
    const fieldGradient = ctx.createRadialGradient(
        anchor.position.x, anchor.position.y, 0,
        anchor.position.x, anchor.position.y, ultimate.radius
    );
    
    fieldGradient.addColorStop(0, `rgba(255, 160, 0, ${alpha * 0.3})`);
    fieldGradient.addColorStop(0.5, `rgba(255, 160, 0, ${alpha * 0.1})`);
    fieldGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    
    ctx.fillStyle = fieldGradient;
    ctx.beginPath();
    ctx.arc(anchor.position.x, anchor.position.y, ultimate.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pull waves
    ultimate.data.pullWaves.forEach((wave: any) => {
        ctx.strokeStyle = `rgba(255, 160, 0, ${wave.alpha * alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(anchor.position.x, anchor.position.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Draw tethers
    ultimate.data.tethers.forEach((tether: any) => {
        const tetherAlpha = alpha * tether.strength * 0.6;
        const color = tether.isEnemy ? '255, 100, 0' : '255, 200, 0';
        
        ctx.strokeStyle = `rgba(${color}, ${tetherAlpha})`;
        ctx.lineWidth = 1 + tether.strength * 2;
        ctx.beginPath();
        ctx.moveTo(tether.from.x, tether.from.y);
        ctx.lineTo(tether.to.x, tether.to.y);
        ctx.stroke();
        
        // Energy particles along tether
        if (Math.random() < 0.1) {
            const t = Math.random();
            const particleX = tether.from.x + (tether.to.x - tether.from.x) * t;
            const particleY = tether.from.y + (tether.to.y - tether.from.y) * t;
            
            ctx.fillStyle = `rgba(${color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw anchor indicator
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * (0.5 + 0.5 * Math.sin(now / 200))})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(anchor.position.x, anchor.position.y, anchor.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Anchor label
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANCHOR', anchor.position.x, anchor.position.y - anchor.radius - 15);
    
    // Gravitational distortion effect
    if (Math.random() < 0.05) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.1;
        const distortSize = 20 + Math.random() * 40;
        const distortX = anchor.position.x + (Math.random() - 0.5) * ultimate.radius;
        const distortY = anchor.position.y + (Math.random() - 0.5) * ultimate.radius;
        
        ctx.strokeStyle = 'rgba(255, 160, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(distortX, distortY, distortSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    ctx.restore();
};