import type { Strand, GlobalEffect, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';
import { RelationshipLevel } from '../types';

const config = ULTIMATE_CONFIG['VOIDROT'];

export const triggerCorruption = (
    caster: Strand,
    strands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): GlobalEffect => {
    // Apply corruption debuff to all enemies
    const enemies = strands.filter(s => {
        if (!s.visible || s.isDefeated || s.id === caster.id) return false;
        const rel = relationshipMatrix[caster.name]?.[s.name] ?? RelationshipLevel.Acquaintance;
        return rel <= RelationshipLevel.Acquaintance;
    });

    enemies.forEach(enemy => {
        // Add corruption debuff
        if (!enemy.debuffs) enemy.debuffs = [];
        enemy.debuffs.push({
            type: 'CORRUPTION',
            endTime: now + config.DURATION * 1000,
            source: caster.name,
            healBlock: true,
            damagePerSecond: config.DAMAGE_PER_SECOND
        });
    });

    return {
        type: 'CORRUPTION',
        endTime: now + config.DURATION * 1000,
        data: {
            sourceId: caster.id,
            sourceName: caster.name,
            affectedStrands: enemies.map(e => e.id),
            damagePerSecond: config.DAMAGE_PER_SECOND,
            healBlock: config.HEAL_BLOCK,
            voidParticles: [],
        }
    };
};

export const updateCorruption = (
    effect: GlobalEffect,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    damageMap: Map<number, number>,
    healingBlocked: Map<number, boolean>,
    voidEffects: Array<{strandId: number, particles: Vector[]}>
} => {
    const damageMap = new Map<number, number>();
    const healingBlocked = new Map<number, boolean>();
    const voidEffects: Array<{strandId: number, particles: Vector[]}> = [];
    
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (!caster) return { damageMap, healingBlocked, voidEffects };

    // Generate void particles for visual effect
    if (!effect.data.voidParticles) {
        effect.data.voidParticles = [];
    }
    
    // Update void particles
    effect.data.voidParticles = effect.data.voidParticles.filter((p: any) => p.life > 0);
    effect.data.voidParticles.forEach((p: any) => {
        p.y -= p.speed * deltaSeconds * 60;
        p.life -= deltaSeconds;
        p.x += Math.sin(p.wobble) * 0.5;
        p.wobble += 0.1;
    });

    // Process each corrupted strand
    effect.data.affectedStrands.forEach((strandId: number) => {
        const strand = strands.find(s => s.id === strandId);
        if (!strand || !strand.visible || strand.isDefeated) return;

        // Check if still has corruption debuff
        const corruptionDebuff = strand.debuffs?.find(d => 
            d.type === 'CORRUPTION' && d.endTime > now
        );
        
        if (corruptionDebuff) {
            // Apply damage over time
            const damage = config.DAMAGE_PER_SECOND * deltaSeconds;
            damageMap.set(strand.id, damage);
            
            // Block all healing
            healingBlocked.set(strand.id, true);
            
            // Generate void particles from corrupted strand
            if (Math.random() < 0.1) {
                const newParticles = [];
                for (let i = 0; i < 3; i++) {
                    newParticles.push({
                        x: strand.position.x + (Math.random() - 0.5) * strand.radius,
                        y: strand.position.y + strand.radius,
                        speed: 0.5 + Math.random() * 1,
                        life: 2,
                        size: 2 + Math.random() * 3,
                        wobble: Math.random() * Math.PI * 2,
                    });
                }
                effect.data.voidParticles.push(...newParticles);
                voidEffects.push({ strandId: strand.id, particles: newParticles });
            }
            
            // Track relationship degradation
            relationshipEvents.push({
                s1Name: caster.name,
                s2Name: strand.name,
                modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_DAMAGE_ENEMY * deltaSeconds
            });
        }
    });

    return { damageMap, healingBlocked, voidEffects };
};

export const onCorruptionEnd = (
    effect: GlobalEffect,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (caster) {
        addLog(`${caster.name}'s Corruption dissipates.`);
    }
    
    // Remove corruption debuffs
    effect.data.affectedStrands.forEach((strandId: number) => {
        const strand = strands.find(s => s.id === strandId);
        if (strand && strand.debuffs) {
            strand.debuffs = strand.debuffs.filter(d => 
                !(d.type === 'CORRUPTION' && d.source === effect.data.sourceName)
            );
        }
    });
};

export const interceptHealing = (
    strandId: number,
    healAmount: number,
    strands: Strand[],
    now: number
): { blocked: boolean, blockedAmount: number, effect?: any } => {
    const strand = strands.find(s => s.id === strandId);
    if (!strand) return { blocked: false, blockedAmount: 0 };
    
    const corruptionDebuff = strand.debuffs?.find(d => 
        d.type === 'CORRUPTION' && d.endTime > now
    );
    
    if (corruptionDebuff && corruptionDebuff.healBlock) {
        return {
            blocked: true,
            blockedAmount: healAmount,
            effect: {
                type: 'HEAL_BLOCKED',
                position: { ...strand.position },
                text: 'CORRUPTED',
                color: 'rgba(150, 0, 200, 0.9)'
            }
        };
    }
    
    return { blocked: false, blockedAmount: 0 };
};

export const renderCorruption = (
    ctx: CanvasRenderingContext2D,
    effect: GlobalEffect,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const timeRemaining = (effect.endTime - now) / 1000;
    const alpha = Math.min(1, timeRemaining / config.DURATION);
    
    // Global corruption overlay
    ctx.fillStyle = `rgba(50, 0, 80, ${alpha * 0.1})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Void particles
    effect.data.voidParticles?.forEach((particle: any) => {
        const particleAlpha = particle.life / 2;
        ctx.fillStyle = `rgba(100, 0, 150, ${particleAlpha * alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Corruption aura on affected strands
    effect.data.affectedStrands.forEach((strandId: number) => {
        const strand = strands.find(s => s.id === strandId);
        if (!strand || !strand.visible) return;
        
        // Dark purple corruption aura
        const gradient = ctx.createRadialGradient(
            strand.position.x, strand.position.y, strand.radius,
            strand.position.x, strand.position.y, strand.radius + 20
        );
        
        gradient.addColorStop(0, 'rgba(50, 0, 80, 0)');
        gradient.addColorStop(0.5, `rgba(100, 0, 150, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(50, 0, 80, ${alpha * 0.6})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(strand.position.x, strand.position.y, strand.radius + 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Corruption veins
        if (Math.random() < 0.05) {
            ctx.strokeStyle = `rgba(150, 0, 200, ${alpha * 0.7})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const numVeins = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numVeins; i++) {
                const angle = (i / numVeins) * Math.PI * 2 + Math.random() * 0.5;
                ctx.moveTo(
                    strand.position.x + Math.cos(angle) * strand.radius * 0.5,
                    strand.position.y + Math.sin(angle) * strand.radius * 0.5
                );
                ctx.lineTo(
                    strand.position.x + Math.cos(angle) * strand.radius,
                    strand.position.y + Math.sin(angle) * strand.radius
                );
            }
            ctx.stroke();
        }
        
        // "CORRUPTED" indicator
        if (Math.random() < 0.02) {
            ctx.fillStyle = `rgba(200, 0, 250, ${alpha})`;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CORRUPTED', strand.position.x, strand.position.y - strand.radius - 10);
        }
    });
    
    ctx.restore();
};

export const renderHealBlocked = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    now: number
): void => {
    ctx.save();
    
    // Red X over heal attempt
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.lineWidth = 3;
    
    const size = 15;
    ctx.beginPath();
    ctx.moveTo(position.x - size, position.y - size);
    ctx.lineTo(position.x + size, position.y + size);
    ctx.moveTo(position.x + size, position.y - size);
    ctx.lineTo(position.x - size, position.y + size);
    ctx.stroke();
    
    // "HEAL BLOCKED" text
    ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEAL BLOCKED', position.x, position.y - 25);
    
    ctx.restore();
};
