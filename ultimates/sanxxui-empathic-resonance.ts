import type { Strand, GlobalEffect, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG['丂anxxui'];

interface DamageShareEvent {
    originalTargetId: number;
    originalDamage: number;
    sharedDamage: number;
    linkedStrands: number[];
    timestamp: number;
}

export const triggerEmpathicResonance = (
    caster: Strand,
    strands: Strand[],
    now: number
): GlobalEffect => {
    // Find all allies to link
    const linkedAllies: number[] = [caster.id];
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === caster.id) return;
        
        // Check if ally (simplified - would use relationship matrix)
        const isAlly = Math.random() > 0.5; // Simplified
        
        if (isAlly) {
            linkedAllies.push(strand.id);
        }
    });

    return {
        type: 'EMPATHIC_RESONANCE',
        endTime: now + config.DURATION * 1000,
        data: {
            sourceId: caster.id,
            sourceName: caster.name,
            linkedStrands: linkedAllies,
            damageShareEvents: [],
            energyTethers: generateTetherConnections(linkedAllies, strands),
            resonanceWaves: [],
            totalDamageShared: 0,
            totalDamagePrevented: 0,
        }
    };
};

function generateTetherConnections(
    linkedIds: number[],
    strands: Strand[]
): Array<{from: number, to: number, strength: number}> {
    const connections = [];
    
    // Create connections between all linked strands
    for (let i = 0; i < linkedIds.length; i++) {
        for (let j = i + 1; j < linkedIds.length; j++) {
            connections.push({
                from: linkedIds[i],
                to: linkedIds[j],
                strength: 1.0,
            });
        }
    }
    
    return connections;
}

export const updateEmpathicResonance = (
    effect: GlobalEffect,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    damageRedirection: Map<number, {newDamage: number, originalDamage: number}>,
    visualEffects: Array<{type: string, data: any}>,
    tetherPulses: Array<{fromId: number, toId: number, intensity: number}>
} => {
    const damageRedirection = new Map<number, {newDamage: number, originalDamage: number}>();
    const visualEffects: Array<{type: string, data: any}> = [];
    const tetherPulses: Array<{fromId: number, toId: number, intensity: number}> = [];
    
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (!caster) return { damageRedirection, visualEffects, tetherPulses };

    // Update resonance waves (visual effect)
    effect.data.resonanceWaves = effect.data.resonanceWaves.filter((wave: any) => {
        wave.radius += 200 * deltaSeconds;
        wave.alpha -= deltaSeconds;
        return wave.alpha > 0;
    });

    // Check for any damage events this frame (would be passed from main simulation)
    // This is where damage sharing logic would occur
    
    // For demonstration, let's handle a hypothetical damage event
    const activeDamageEvents = new Map<number, number>(); // strandId -> damage
    
    // If there are damage events to linked strands
    if (activeDamageEvents.size > 0) {
        const activeLinkedStrands = effect.data.linkedStrands.filter((id: number) => {
            const strand = strands.find(s => s.id === id);
            return strand && strand.visible && !strand.isDefeated;
        });
        
        const numLinked = activeLinkedStrands.length;
        
        activeDamageEvents.forEach((damage, targetId) => {
            if (effect.data.linkedStrands.includes(targetId)) {
                // Calculate shared damage
                const sharedDamage = damage / numLinked;
                const damagePrevented = damage - sharedDamage;
                
                // Apply shared damage to all linked strands
                activeLinkedStrands.forEach((linkedId: number) => {
                    damageRedirection.set(linkedId, {
                        newDamage: sharedDamage,
                        originalDamage: linkedId === targetId ? damage : 0
                    });
                    
                    // Create tether pulse effect
                    if (linkedId !== targetId) {
                        tetherPulses.push({
                            fromId: targetId,
                            toId: linkedId,
                            intensity: Math.min(1, damage / 100)
                        });
                    }
                });
                
                // Track the event
                const shareEvent: DamageShareEvent = {
                    originalTargetId: targetId,
                    originalDamage: damage,
                    sharedDamage: sharedDamage,
                    linkedStrands: activeLinkedStrands,
                    timestamp: now
                };
                
                effect.data.damageShareEvents.push(shareEvent);
                effect.data.totalDamageShared += damage;
                effect.data.totalDamagePrevented += damagePrevented;
                
                // Create resonance wave at target position
                const targetStrand = strands.find(s => s.id === targetId);
                if (targetStrand) {
                    effect.data.resonanceWaves.push({
                        position: { ...targetStrand.position },
                        radius: 0,
                        alpha: 1.0,
                        color: 'purple'
                    });
                    
                    visualEffects.push({
                        type: 'DAMAGE_SHARED',
                        data: {
                            position: targetStrand.position,
                            originalDamage: damage,
                            sharedDamage: sharedDamage,
                            numLinked: numLinked
                        }
                    });
                }
                
                // Track relationships - sharing damage strengthens bonds
                activeLinkedStrands.forEach((id1: number) => {
                    const strand1 = strands.find(s => s.id === id1);
                    activeLinkedStrands.forEach((id2: number) => {
                        if (id1 >= id2) return;
                        const strand2 = strands.find(s => s.id === id2);
                        if (strand1 && strand2) {
                            relationshipEvents.push({
                                s1Name: strand1.name,
                                s2Name: strand2.name,
                                modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_SUPPORT_ALLY * deltaSeconds
                            });
                        }
                    });
                });
            }
        });
    }

    return { damageRedirection, visualEffects, tetherPulses };
};

export const interceptDamage = (
    targetId: number,
    damage: number,
    effect: GlobalEffect,
    strands: Strand[],
    now: number
): { sharedDamage: Map<number, number>, prevented: number } => {
    const sharedDamage = new Map<number, number>();
    let prevented = 0;
    
    if (!effect.data.linkedStrands.includes(targetId)) {
        // Not linked, no sharing
        sharedDamage.set(targetId, damage);
        return { sharedDamage, prevented };
    }
    
    // Get all active linked strands
    const activeLinked = effect.data.linkedStrands.filter((id: number) => {
        const strand = strands.find(s => s.id === id);
        return strand && strand.visible && !strand.isDefeated;
    });
    
    if (activeLinked.length <= 1) {
        // No one to share with
        sharedDamage.set(targetId, damage);
        return { sharedDamage, prevented };
    }
    
    // Calculate shared damage
    const damagePerStrand = damage / activeLinked.length;
    prevented = damage - damagePerStrand;
    
    // Distribute damage
    activeLinked.forEach((id: number) => {
        sharedDamage.set(id, damagePerStrand);
    });
    
    return { sharedDamage, prevented };
};

export const onEmpathicResonanceEnd = (
    effect: GlobalEffect,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (caster) {
        addLog(`${caster.name}'s Empathic Resonance fades. Total damage prevented: ${Math.round(effect.data.totalDamagePrevented)}`);
    }
};

export const renderEmpathicResonance = (
    ctx: CanvasRenderingContext2D,
    effect: GlobalEffect,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const timeRemaining = (effect.endTime - now) / 1000;
    const alpha = Math.min(1, timeRemaining / config.DURATION);
    
    // Draw tethers between all linked strands
    effect.data.energyTethers.forEach((tether: any) => {
        const fromStrand = strands.find(s => s.id === tether.from);
        const toStrand = strands.find(s => s.id === tether.to);
        
        if (!fromStrand || !toStrand || !fromStrand.visible || !toStrand.visible) return;
        
        // Base tether
        ctx.strokeStyle = `rgba(180, 111, 255, ${alpha * 0.4 * tether.strength})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromStrand.position.x, fromStrand.position.y);
        ctx.lineTo(toStrand.position.x, toStrand.position.y);
        ctx.stroke();
        
        // Energy flow animation
        const flowOffset = (now / 100) % 1;
        const numParticles = 3;
        
        for (let i = 0; i < numParticles; i++) {
            const t = (flowOffset + i / numParticles) % 1;
            const particleX = fromStrand.position.x + (toStrand.position.x - fromStrand.position.x) * t;
            const particleY = fromStrand.position.y + (toStrand.position.y - fromStrand.position.y) * t;
            
            ctx.fillStyle = `rgba(200, 150, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw resonance waves
    effect.data.resonanceWaves.forEach((wave: any) => {
        ctx.strokeStyle = `rgba(180, 111, 255, ${wave.alpha * alpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(wave.position.x, wave.position.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Visual indicator on linked strands
    effect.data.linkedStrands.forEach((strandId: number) => {
        const strand = strands.find(s => s.id === strandId);
        if (!strand || !strand.visible) return;
        
        // Empathic aura
        const pulse = 0.8 + 0.2 * Math.sin(now / 200 + strandId);
        const gradient = ctx.createRadialGradient(
            strand.position.x, strand.position.y, strand.radius,
            strand.position.x, strand.position.y, strand.radius + 15 * pulse
        );
        
        gradient.addColorStop(0, 'rgba(180, 111, 255, 0)');
        gradient.addColorStop(0.7, `rgba(180, 111, 255, ${alpha * 0.2})`);
        gradient.addColorStop(1, 'rgba(180, 111, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(strand.position.x, strand.position.y, strand.radius + 15 * pulse, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Show "LINKED" text periodically
    if (Math.random() < 0.01) {
        const randomLinked = effect.data.linkedStrands[Math.floor(Math.random() * effect.data.linkedStrands.length)];
        const strand = strands.find(s => s.id === randomLinked);
        if (strand) {
            ctx.fillStyle = `rgba(180, 111, 255, ${alpha})`;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LINKED', strand.position.x, strand.position.y - strand.radius - 10);
        }
    }
    
    ctx.restore();
};

export const renderDamageSharedEffect = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    originalDamage: number,
    sharedDamage: number,
    numLinked: number
): void => {
    ctx.save();
    
    // Show damage distribution
    ctx.fillStyle = 'rgba(180, 111, 255, 0.9)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    
    ctx.fillText(
        `${Math.round(originalDamage)} → ${Math.round(sharedDamage)} × ${numLinked}`,
        position.x,
        position.y - 30
    );
    
    ctx.fillStyle = 'rgba(100, 255, 100, 0.9)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(
        `SHARED`,
        position.x,
        position.y - 15
    );
    
    ctx.restore();
};