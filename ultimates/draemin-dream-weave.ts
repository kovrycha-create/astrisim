import type { Strand, GlobalEffect, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG["Dræmin'"];

interface DreamSwap {
    strand1Id: number;
    strand2Id: number;
    strand1Name: StrandName;
    strand2Name: StrandName;
    originalPos1: Vector;
    originalPos2: Vector;
    originalVel1: Vector;
    originalVel2: Vector;
    swapTime: number;
    swapped: boolean;
}

export const triggerDreamWeave = (
    caster: Strand,
    strands: Strand[],
    now: number
): GlobalEffect => {
    // Randomly select two visible, non-defeated strands
    const eligibleStrands = strands.filter(s => s.visible && !s.isDefeated);
    
    if (eligibleStrands.length < 2) {
        // Not enough strands to swap
        return null as any; // Would handle this properly
    }
    
    // Randomly pick two different strands
    const indices = [];
    while (indices.length < 2) {
        const idx = Math.floor(Math.random() * eligibleStrands.length);
        if (!indices.includes(idx)) {
            indices.push(idx);
        }
    }
    
    const strand1 = eligibleStrands[indices[0]];
    const strand2 = eligibleStrands[indices[1]];
    
    const swapData: DreamSwap = {
        strand1Id: strand1.id,
        strand2Id: strand2.id,
        strand1Name: strand1.name,
        strand2Name: strand2.name,
        originalPos1: { ...strand1.position },
        originalPos2: { ...strand2.position },
        originalVel1: { ...strand1.velocity },
        originalVel2: { ...strand2.velocity },
        swapTime: now + config.SWAP_DELAY * 1000,
        swapped: false
    };

    return {
        type: 'DREAM_WEAVE',
        endTime: now + config.DURATION * 1000,
        data: {
            sourceId: caster.id,
            sourceName: caster.name,
            swapData,
            dreamParticles: [],
            distortionWaves: [],
            chaosLevel: 0,
            damagePerSecond: config.DAMAGE_PER_SECOND,
        }
    };
};

export const updateDreamWeave = (
    effect: GlobalEffect,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    damageMap: Map<number, number>,
    positionSwap: {strand1Id: number, strand2Id: number, pos1: Vector, pos2: Vector, vel1: Vector, vel2: Vector} | null,
    visualEffects: Array<{type: string, data: any}>
} => {
    const damageMap = new Map<number, number>();
    let positionSwap = null;
    const visualEffects: Array<{type: string, data: any}> = [];
    
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (!caster) return { damageMap, positionSwap, visualEffects };
    
    const swap = effect.data.swapData;
    const strand1 = strands.find(s => s.id === swap.strand1Id);
    const strand2 = strands.find(s => s.id === swap.strand2Id);
    
    if (!strand1 || !strand2) {
        // One of the strands is gone, effect fails
        return { damageMap, positionSwap, visualEffects };
    }

    // Generate dream particles
    if (Math.random() < 0.2) {
        effect.data.dreamParticles.push({
            position: {
                x: strand1.position.x + (Math.random() - 0.5) * 100,
                y: strand1.position.y + (Math.random() - 0.5) * 100
            },
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: -Math.random() * 2
            },
            life: 2,
            color: Math.random() < 0.5 ? 'purple' : 'pink',
            size: 5 + Math.random() * 10
        });
        
        effect.data.dreamParticles.push({
            position: {
                x: strand2.position.x + (Math.random() - 0.5) * 100,
                y: strand2.position.y + (Math.random() - 0.5) * 100
            },
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: -Math.random() * 2
            },
            life: 2,
            color: Math.random() < 0.5 ? 'purple' : 'pink',
            size: 5 + Math.random() * 10
        });
    }
    
    // Update dream particles
    effect.data.dreamParticles = effect.data.dreamParticles.filter((p: any) => {
        p.position.x += p.velocity.x;
        p.position.y += p.velocity.y;
        p.life -= deltaSeconds;
        p.size *= 0.98;
        return p.life > 0;
    });

    // Check if it's time to swap
    if (!swap.swapped && now >= swap.swapTime) {
        swap.swapped = true;
        
        // Perform the swap
        positionSwap = {
            strand1Id: strand1.id,
            strand2Id: strand2.id,
            pos1: { ...strand2.position },
            pos2: { ...strand1.position },
            vel1: { ...strand2.velocity },
            vel2: { ...strand1.velocity }
        };
        
        // Apply the swap
        const tempPos = { ...strand1.position };
        const tempVel = { ...strand1.velocity };
        strand1.position = { ...strand2.position };
        strand1.velocity = { ...strand2.velocity };
        strand2.position = tempPos;
        strand2.velocity = tempVel;
        
        // Also swap some other properties for extra chaos
        const tempSpeed = strand1.speed;
        strand1.speed = strand2.speed;
        strand2.speed = tempSpeed;
        
        // Mark them with temporary state
        strand1.temporaryState = { swapTargetId: strand2.id };
        strand2.temporaryState = { swapTargetId: strand1.id };
        
        addLog(`${strand1.name} and ${strand2.name} swap places in the dream!`);
        
        // Create distortion wave
        effect.data.distortionWaves.push({
            position1: tempPos,
            position2: strand2.position,
            radius: 0,
            maxRadius: 200,
            life: 1
        });
        
        visualEffects.push({
            type: 'DREAM_SWAP',
            data: {
                pos1: tempPos,
                pos2: strand2.position,
                strand1Name: strand1.name,
                strand2Name: strand2.name
            }
        });
        
        // Chaos increases relationships between swapped strands (they share an experience)
        relationshipEvents.push({
            s1Name: strand1.name,
            s2Name: strand2.name,
            modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_SUPPORT_ALLY
        });
    }

    // Apply damage over time to swapped strands
    if (swap.swapped) {
        if (strand1.visible && !strand1.isDefeated) {
            damageMap.set(strand1.id, config.DAMAGE_PER_SECOND * deltaSeconds);
        }
        if (strand2.visible && !strand2.isDefeated) {
            damageMap.set(strand2.id, config.DAMAGE_PER_SECOND * deltaSeconds);
        }
        
        // Increase chaos level
        effect.data.chaosLevel = Math.min(1, effect.data.chaosLevel + deltaSeconds * 0.2);
    }
    
    // Update distortion waves
    effect.data.distortionWaves = effect.data.distortionWaves.filter((wave: any) => {
        wave.radius += 150 * deltaSeconds;
        wave.life -= deltaSeconds;
        return wave.life > 0;
    });

    return { damageMap, positionSwap, visualEffects };
};

export const onDreamWeaveEnd = (
    effect: GlobalEffect,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const swap = effect.data.swapData;
    const strand1 = strands.find(s => s.id === swap.strand1Id);
    const strand2 = strands.find(s => s.id === swap.strand2Id);
    
    // Clear temporary states
    if (strand1) {
        strand1.temporaryState = null;
        // Restore original speed
        strand1.speed = strand1.originalSpeed;
    }
    if (strand2) {
        strand2.temporaryState = null;
        strand2.speed = strand2.originalSpeed;
    }
    
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (caster) {
        addLog(`${caster.name}'s Dream Weave unravels.`);
    }
};

export const renderDreamWeave = (
    ctx: CanvasRenderingContext2D,
    effect: GlobalEffect,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const timeRemaining = (effect.endTime - now) / 1000;
    const alpha = Math.min(1, timeRemaining / config.DURATION);
    const swap = effect.data.swapData;
    
    // Dream haze overlay
    ctx.fillStyle = `rgba(200, 100, 255, ${alpha * 0.05 * (1 + effect.data.chaosLevel)})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw dream tether between marked strands
    const strand1 = strands.find(s => s.id === swap.strand1Id);
    const strand2 = strands.find(s => s.id === swap.strand2Id);
    
    if (strand1 && strand2 && strand1.visible && strand2.visible) {
        // Countdown timer before swap
        if (!swap.swapped) {
            const timeToSwap = (swap.swapTime - now) / 1000;
            
            // Pulsing tether
            const pulse = 1 + 0.3 * Math.sin(now / 100);
            const tetherAlpha = alpha * (0.5 + 0.5 * (1 - timeToSwap / config.SWAP_DELAY));
            
            const gradient = ctx.createLinearGradient(
                strand1.position.x, strand1.position.y,
                strand2.position.x, strand2.position.y
            );
            gradient.addColorStop(0, `rgba(200, 100, 255, ${tetherAlpha})`);
            gradient.addColorStop(0.5, `rgba(255, 100, 200, ${tetherAlpha * pulse})`);
            gradient.addColorStop(1, `rgba(200, 100, 255, ${tetherAlpha})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3 * pulse;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(strand1.position.x, strand1.position.y);
            ctx.lineTo(strand2.position.x, strand2.position.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Countdown numbers
            if (timeToSwap < 3) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                
                ctx.fillText(
                    Math.ceil(timeToSwap).toString(),
                    strand1.position.x,
                    strand1.position.y - strand1.radius - 20
                );
                ctx.fillText(
                    Math.ceil(timeToSwap).toString(),
                    strand2.position.x,
                    strand2.position.y - strand2.radius - 20
                );
            }
        } else {
            // After swap - dream distortion
            ctx.strokeStyle = `rgba(200, 100, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(strand1.position.x, strand1.position.y, strand1.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(strand2.position.x, strand2.position.y, strand2.radius + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Draw distortion waves
    effect.data.distortionWaves.forEach((wave: any) => {
        const waveAlpha = wave.life * alpha;
        ctx.strokeStyle = `rgba(200, 100, 255, ${waveAlpha * 0.5})`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(wave.position1.x, wave.position1.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(wave.position2.x, wave.position2.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Draw dream particles
    effect.data.dreamParticles.forEach((particle: any) => {
        const particleAlpha = (particle.life / 2) * alpha;
        const color = particle.color === 'purple' ? '200, 100, 255' : '255, 100, 200';
        
        ctx.fillStyle = `rgba(${color}, ${particleAlpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Dream bubble effect
        ctx.strokeStyle = `rgba(${color}, ${particleAlpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size + 3, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Chaos distortion effect
    if (effect.data.chaosLevel > 0.5) {
        const distortAmount = effect.data.chaosLevel * 10;
        ctx.save();
        ctx.globalAlpha = alpha * 0.1;
        ctx.filter = `blur(${distortAmount}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
    }
    
    ctx.restore();
};