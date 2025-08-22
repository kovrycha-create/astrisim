import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG['Ðethapart'];

interface MarkOfClosure {
    targetId: number;
    targetName: StrandName;
    appliedTime: number;
    endTime: number;
    executeThreshold: number;
    executionWarnings: number;
}

export const triggerDecreeOfNull = (
    caster: Strand,
    strands: Strand[],
    now: number
): ActiveUltimate => {
    // Find enemy with lowest health percentage in radius
    let lowestHealthEnemy: Strand | null = null;
    let lowestHealthPercent = 1.0;
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === caster.id) return;
        
        const dist = Math.hypot(
            strand.position.x - caster.position.x,
            strand.position.y - caster.position.y
        );
        
        if (dist <= config.RADIUS) {
            // Check if enemy (simplified - would use relationship matrix)
            const isEnemy = true; // Simplified
            
            if (isEnemy) {
                const healthPercent = strand.health / strand.maxHealth;
                if (healthPercent < lowestHealthPercent) {
                    lowestHealthPercent = healthPercent;
                    lowestHealthEnemy = strand;
                }
            }
        }
    });
    
    if (!lowestHealthEnemy) {
        // No valid target
        return null as any; // Would handle properly
    }

    // Create seeking projectile data
    const projectileData = {
        position: { ...caster.position },
        targetId: lowestHealthEnemy.id,
        speed: 10,
        trail: [{ ...caster.position }],
        hit: false,
    };

    return {
        id: now + caster.id,
        type: 'DECREE_OF_NULL',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position }, // Will follow projectile, then target
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: 50, // Projectile/mark visual radius
        maxRadius: config.RADIUS,
        color: 'rgba(80, 70, 100, 0.9)',
        data: {
            projectile: projectileData,
            mark: null as MarkOfClosure | null,
            deathPulses: [],
            voidRipples: [],
            executionPending: false,
        }
    };
};

export const updateDecreeOfNull = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    instantDamage: Map<number, number>,
    instantExecute: number | null,
    visualEffects: Array<{type: string, data: any}>,
    ended: boolean
} => {
    const instantDamage = new Map<number, number>();
    let instantExecute: number | null = null;
    const visualEffects: Array<{type: string, data: any}> = [];
    let ended = false;
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) {
        ended = true;
        return { instantDamage, instantExecute, visualEffects, ended };
    }

    // Handle projectile phase
    if (!ultimate.data.projectile.hit) {
        const target = strands.find(s => s.id === ultimate.data.projectile.targetId);
        
        if (!target || !target.visible || target.isDefeated) {
            // Target lost, end ultimate
            ended = true;
            addLog(`${caster.name}'s Decree fails - target lost.`);
            return { instantDamage, instantExecute, visualEffects, ended };
        }
        
        // Move projectile toward target
        const dist = Math.hypot(
            target.position.x - ultimate.data.projectile.position.x,
            target.position.y - ultimate.data.projectile.position.y
        );
        
        if (dist < target.radius) {
            // Projectile hit!
            ultimate.data.projectile.hit = true;
            
            // Apply initial damage
            instantDamage.set(target.id, config.DAMAGE);
            
            // Apply mark
            ultimate.data.mark = {
                targetId: target.id,
                targetName: target.name,
                appliedTime: now,
                endTime: now + config.DURATION * 1000,
                executeThreshold: config.EXECUTE_THRESHOLD * target.maxHealth,
                executionWarnings: 0
            };
            
            // Add mark debuff to target
            if (!target.debuffs) target.debuffs = [];
            target.debuffs.push({
                type: 'MARK_OF_CLOSURE',
                endTime: now + config.DURATION * 1000,
                source: caster.name,
            });
            
            addLog(`${caster.name} marks ${target.name} for execution!`);
            
            visualEffects.push({
                type: 'MARK_APPLIED',
                data: {
                    position: { ...target.position },
                    targetName: target.name
                }
            });
            
            // Track relationship impact
            relationshipEvents.push({
                s1Name: caster.name,
                s2Name: target.name,
                modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_BURST_DAMAGE_ENEMY
            });
        } else {
            // Move projectile
            const moveSpeed = ultimate.data.projectile.speed * 60 * deltaSeconds;
            const angle = Math.atan2(
                target.position.y - ultimate.data.projectile.position.y,
                target.position.x - ultimate.data.projectile.position.x
            );
            
            ultimate.data.projectile.position.x += Math.cos(angle) * moveSpeed;
            ultimate.data.projectile.position.y += Math.sin(angle) * moveSpeed;
            
            // Update trail
            ultimate.data.projectile.trail.push({ ...ultimate.data.projectile.position });
            if (ultimate.data.projectile.trail.length > 20) {
                ultimate.data.projectile.trail.shift();
            }
            
            // Check for body blocking
            strands.forEach(strand => {
                if (strand.id === ultimate.data.projectile.targetId || !strand.visible || strand.isDefeated) return;
                
                const blockDist = Math.hypot(
                    strand.position.x - ultimate.data.projectile.position.x,
                    strand.position.y - ultimate.data.projectile.position.y
                );
                
                if (blockDist < strand.radius) {
                    // Body blocked! Apply to blocker instead
                    ultimate.data.projectile.targetId = strand.id;
                    addLog(`${strand.name} intercepts the Decree!`);
                }
            });
        }
        
        // Update ultimate position to follow projectile
        ultimate.position = { ...ultimate.data.projectile.position };
    } else if (ultimate.data.mark) {
        // Mark phase - check for execution
        const target = strands.find(s => s.id === ultimate.data.mark!.targetId);
        
        if (!target || !target.visible || target.isDefeated) {
            // Target defeated by other means
            ended = true;
            return { instantDamage, instantExecute, visualEffects, ended };
        }
        
        // Update position to follow marked target
        ultimate.position = { ...target.position };
        
        // Check execution threshold
        if (target.health <= ultimate.data.mark.executeThreshold) {
            if (!ultimate.data.executionPending) {
                ultimate.data.executionPending = true;
                visualEffects.push({
                    type: 'EXECUTION_IMMINENT',
                    data: { position: { ...target.position } }
                });
            }
            
            // Execute!
            instantExecute = target.id;
            target.health = 0;
            target.isDefeated = true;
            target.visible = false;
            
            addLog(`${caster.name} executes ${target.name} with Decree of Null!`);
            
            // Create death pulse
            ultimate.data.deathPulses.push({
                position: { ...target.position },
                radius: 0,
                maxRadius: 200,
                life: 1
            });
            
            visualEffects.push({
                type: 'EXECUTION',
                data: {
                    position: { ...target.position },
                    targetName: target.name
                }
            });
            
            // Major relationship impact
            relationshipEvents.push({
                s1Name: caster.name,
                s2Name: target.name,
                modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_DAMAGE_ENEMY * 10 // Execution is memorable
            });
            
            ended = true;
        } else {
            // Warning pulses as health approaches threshold
            const healthPercent = target.health / target.maxHealth;
            const thresholdPercent = config.EXECUTE_THRESHOLD;
            
            if (healthPercent < thresholdPercent * 2) {
                ultimate.data.mark.executionWarnings++;
                
                if (ultimate.data.mark.executionWarnings % 30 === 0) {
                    ultimate.data.voidRipples.push({
                        position: { ...target.position },
                        radius: 0,
                        maxRadius: 100,
                        life: 0.5
                    });
                }
            }
        }
        
        // Check if mark duration expired
        if (now >= ultimate.data.mark.endTime) {
            // Remove mark
            target.debuffs = target.debuffs?.filter(d => d.type !== 'MARK_OF_CLOSURE');
            addLog(`${caster.name}'s mark on ${target.name} fades.`);
            ended = true;
        }
    }
    
    // Update visual effects
    ultimate.data.deathPulses = ultimate.data.deathPulses.filter((pulse: any) => {
        pulse.radius += 150 * deltaSeconds;
        pulse.life -= deltaSeconds;
        return pulse.life > 0;
    });
    
    ultimate.data.voidRipples = ultimate.data.voidRipples.filter((ripple: any) => {
        ripple.radius += 100 * deltaSeconds;
        ripple.life -= deltaSeconds;
        return ripple.life > 0;
    });

    return { instantDamage, instantExecute, visualEffects, ended };
};

export const onDecreeOfNullEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    // Clean up any remaining marks
    if (ultimate.data.mark) {
        const target = strands.find(s => s.id === ultimate.data.mark.targetId);
        if (target && target.debuffs) {
            target.debuffs = target.debuffs.filter(d => d.type !== 'MARK_OF_CLOSURE');
        }
    }
};

export const renderDecreeOfNull = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    
    // Render based on phase
    if (!ultimate.data.projectile.hit) {
        // Projectile phase
        const projectile = ultimate.data.projectile;
        
        // Trail
        ctx.strokeStyle = `rgba(80, 70, 100, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        projectile.trail.forEach((point: Vector, index: number) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Projectile head
        const gradient = ctx.createRadialGradient(
            projectile.position.x, projectile.position.y, 0,
            projectile.position.x, projectile.position.y, 20
        );
        gradient.addColorStop(0, `rgba(80, 70, 100, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(100, 50, 150, ${alpha * 0.8})`);
        gradient.addColorStop(1, 'rgba(50, 30, 80, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(projectile.position.x, projectile.position.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Death skull symbol
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀', projectile.position.x, projectile.position.y + 5);
    } else if (ultimate.data.mark) {
        // Mark phase
        const target = strands.find(s => s.id === ultimate.data.mark.targetId);
        if (target && target.visible) {
            // Mark of Closure visual
            const pulse = 0.7 + 0.3 * Math.sin(now / 100);
            
            // Outer ring
            ctx.strokeStyle = `rgba(80, 70, 100, ${alpha * pulse})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(target.position.x, target.position.y, target.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // Death mark symbol
            ctx.save();
            ctx.translate(target.position.x, target.position.y - target.radius - 20);
            ctx.rotate(now / 500);
            
            ctx.fillStyle = `rgba(150, 50, 200, ${alpha})`;
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✗', 0, 5);
            
            ctx.restore();
            
            // Execution threshold indicator
            const healthPercent = target.health / target.maxHealth;
            const thresholdPercent = config.EXECUTE_THRESHOLD;
            
            if (healthPercent < thresholdPercent * 2) {
                // Warning glow
                const warningGradient = ctx.createRadialGradient(
                    target.position.x, target.position.y, target.radius,
                    target.position.x, target.position.y, target.radius + 30
                );
                
                const warningIntensity = 1 - (healthPercent / (thresholdPercent * 2));
                warningGradient.addColorStop(0, 'rgba(150, 0, 200, 0)');
                warningGradient.addColorStop(1, `rgba(150, 0, 200, ${alpha * warningIntensity * pulse})`);
                
                ctx.fillStyle = warningGradient;
                ctx.beginPath();
                ctx.arc(target.position.x, target.position.y, target.radius + 30, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Execution imminent warning
            if (ultimate.data.executionPending) {
                ctx.fillStyle = `rgba(255, 0, 0, ${alpha * pulse})`;
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('EXECUTE!', target.position.x, target.position.y + target.radius + 20);
            }
        }
    }
    
    // Death pulses
    ultimate.data.deathPulses.forEach((pulse: any) => {
        const pulseAlpha = pulse.life * alpha;
        ctx.strokeStyle = `rgba(80, 70, 100, ${pulseAlpha})`;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(pulse.position.x, pulse.position.y, pulse.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Void ripples
    ultimate.data.voidRipples.forEach((ripple: any) => {
        const rippleAlpha = ripple.life * alpha * 0.5;
        ctx.strokeStyle = `rgba(150, 50, 200, ${rippleAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ripple.position.x, ripple.position.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    ctx.restore();
};