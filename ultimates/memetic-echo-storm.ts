import type { Strand, GlobalEffect, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG['Memetic'];

interface MiniEcho {
    type: 'MINI_FISSURE' | 'MINI_FLARE' | 'MINI_PULSE' | 'MINI_HEAL' | 'MINI_SPEED';
    position: Vector;
    targetId?: number;
    radius: number;
    life: number;
    maxLife: number;
    intensity: number;
}

export const triggerEchoStorm = (
    caster: Strand,
    strands: Strand[],
    now: number
): GlobalEffect => {
    return {
        type: 'ECHO_STORM',
        endTime: now + config.DURATION * 1000,
        data: {
            sourceId: caster.id,
            sourceName: caster.name,
            activeEchoes: [],
            totalDamageDealt: 0,
            totalHealingDone: 0,
            chaosParticles: [],
            glitchZones: [],
            echoTypes: ['MINI_FISSURE', 'MINI_FLARE', 'MINI_PULSE', 'MINI_HEAL', 'MINI_SPEED'],
        }
    };
};

export const updateEchoStorm = (
    effect: GlobalEffect,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    damageMap: Map<number, number>,
    healMap: Map<number, number>,
    effects: Array<{type: string, strandId: number, value: any}>,
    visualEffects: Array<{type: string, data: any}>
} => {
    const damageMap = new Map<number, number>();
    const healMap = new Map<number, number>();
    const effects: Array<{type: string, strandId: number, value: any}> = [];
    const visualEffects: Array<{type: string, data: any}> = [];
    
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (!caster) return { damageMap, healMap, effects, visualEffects };

    // Spawn random mini-echoes
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated) return;
        
        // Random chance to spawn echo on any strand
        if (Math.random() < config.DAMAGE_CHANCE) {
            const echoType = effect.data.echoTypes[Math.floor(Math.random() * effect.data.echoTypes.length)];
            const newEcho: MiniEcho = {
                type: echoType,
                position: { ...strand.position },
                targetId: strand.id,
                radius: config.ECHO_RADIUS * (0.5 + Math.random() * 0.5),
                life: 0.5,
                maxLife: 0.5,
                intensity: 0.3 + Math.random() * 0.7
            };
            
            effect.data.activeEchoes.push(newEcho);
            
            // Apply immediate effect based on type
            switch (echoType) {
                case 'MINI_FISSURE':
                    // Small damage area
                    strands.forEach(s => {
                        if (!s.visible || s.isDefeated) return;
                        const dist = Math.hypot(s.position.x - newEcho.position.x, s.position.y - newEcho.position.y);
                        if (dist <= newEcho.radius) {
                            const damage = config.DAMAGE_AMOUNT * newEcho.intensity;
                            damageMap.set(s.id, (damageMap.get(s.id) || 0) + damage);
                            effect.data.totalDamageDealt += damage;
                        }
                    });
                    break;
                    
                case 'MINI_FLARE':
                    // Burst damage at position
                    const damage = config.DAMAGE_AMOUNT * newEcho.intensity * 1.5;
                    damageMap.set(strand.id, (damageMap.get(strand.id) || 0) + damage);
                    effect.data.totalDamageDealt += damage;
                    break;
                    
                case 'MINI_PULSE':
                    // Small pull effect
                    strands.forEach(s => {
                        if (!s.visible || s.isDefeated || s.id === strand.id) return;
                        const dist = Math.hypot(s.position.x - newEcho.position.x, s.position.y - newEcho.position.y);
                        if (dist <= newEcho.radius && dist > 0) {
                            const pullStrength = 0.05 * newEcho.intensity;
                            const angle = Math.atan2(newEcho.position.y - s.position.y, newEcho.position.x - s.position.x);
                            effects.push({
                                type: 'MINI_PULL',
                                strandId: s.id,
                                value: { x: Math.cos(angle) * pullStrength, y: Math.sin(angle) * pullStrength }
                            });
                        }
                    });
                    break;
                    
                case 'MINI_HEAL':
                    // Random healing (can heal enemies too!)
                    const healing = 10 * newEcho.intensity;
                    healMap.set(strand.id, (healMap.get(strand.id) || 0) + healing);
                    effect.data.totalHealingDone += healing;
                    
                    // Healing an enemy creates negative relationship
                    if (strand.id !== caster.id && Math.random() > 0.5) {
                        relationshipEvents.push({
                            s1Name: caster.name,
                            s2Name: strand.name,
                            modifier: -RELATIONSHIP_MODIFIERS.ULTIMATE_HEAL_ALLY
                        });
                    }
                    break;
                    
                case 'MINI_SPEED':
                    // Random speed boost (can boost enemies too!)
                    effects.push({
                        type: 'SPEED_BOOST',
                        strandId: strand.id,
                        value: { multiplier: 1.5, duration: 0.5 }
                    });
                    break;
            }
            
            visualEffects.push({
                type: 'ECHO_SPAWN',
                data: {
                    echoType,
                    position: newEcho.position,
                    radius: newEcho.radius,
                    intensity: newEcho.intensity
                }
            });
        }
    });
    
    // Update active echoes
    effect.data.activeEchoes = effect.data.activeEchoes.filter((echo: MiniEcho) => {
        echo.life -= deltaSeconds;
        return echo.life > 0;
    });
    
    // Generate chaos particles
    if (Math.random() < 0.3) {
        effect.data.chaosParticles.push({
            position: {
                x: Math.random() * 1920, // Screen width
                y: Math.random() * 1080  // Screen height
            },
            velocity: {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5
            },
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: 2 + Math.random() * 5,
            life: 1
        });
    }
    
    // Update chaos particles
    effect.data.chaosParticles = effect.data.chaosParticles.filter((p: any) => {
        p.position.x += p.velocity.x;
        p.position.y += p.velocity.y;
        p.life -= deltaSeconds;
        p.size *= 0.95;
        return p.life > 0;
    });
    
    // Create random glitch zones
    if (Math.random() < 0.05) {
        effect.data.glitchZones.push({
            x: Math.random() * 1920,
            y: Math.random() * 1080,
            width: 50 + Math.random() * 100,
            height: 50 + Math.random() * 100,
            life: 0.2
        });
    }
    
    // Update glitch zones
    effect.data.glitchZones = effect.data.glitchZones.filter((zone: any) => {
        zone.life -= deltaSeconds;
        return zone.life > 0;
    });

    return { damageMap, healMap, effects, visualEffects };
};

export const onEchoStormEnd = (
    effect: GlobalEffect,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === effect.data.sourceId);
    if (caster) {
        addLog(`${caster.name}'s Echo Storm subsides. Chaos dealt: ${Math.round(effect.data.totalDamageDealt)} damage, ${Math.round(effect.data.totalHealingDone)} healing.`);
    }
};

export const renderEchoStorm = (
    ctx: CanvasRenderingContext2D,
    effect: GlobalEffect,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const timeRemaining = (effect.endTime - now) / 1000;
    const alpha = Math.min(1, timeRemaining / config.DURATION);
    
    // Render glitch zones
    effect.data.glitchZones.forEach((zone: any) => {
        ctx.save();
        ctx.globalAlpha = zone.life * 2;
        
        // Random color shift
        ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.3)`;
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        // Glitch lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(zone.x, zone.y + Math.random() * zone.height);
            ctx.lineTo(zone.x + zone.width, zone.y + Math.random() * zone.height);
            ctx.stroke();
        }
        
        ctx.restore();
    });
    
    // Render active echoes
    effect.data.activeEchoes.forEach((echo: MiniEcho) => {
        const echoAlpha = (echo.life / echo.maxLife) * alpha;
        
        switch (echo.type) {
            case 'MINI_FISSURE':
                ctx.strokeStyle = `rgba(139, 69, 19, ${echoAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(echo.position.x, echo.position.y, echo.radius, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'MINI_FLARE':
                const flareGradient = ctx.createRadialGradient(
                    echo.position.x, echo.position.y, 0,
                    echo.position.x, echo.position.y, echo.radius
                );
                flareGradient.addColorStop(0, `rgba(255, 255, 100, ${echoAlpha})`);
                flareGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
                ctx.fillStyle = flareGradient;
                ctx.beginPath();
                ctx.arc(echo.position.x, echo.position.y, echo.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'MINI_PULSE':
                ctx.strokeStyle = `rgba(255, 160, 0, ${echoAlpha})`;
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(echo.position.x, echo.position.y, echo.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
                
            case 'MINI_HEAL':
                ctx.fillStyle = `rgba(100, 255, 100, ${echoAlpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(echo.position.x, echo.position.y, echo.radius, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'MINI_SPEED':
                ctx.strokeStyle = `rgba(100, 200, 255, ${echoAlpha})`;
                ctx.lineWidth = 2;
                const speedLines = 6;
                for (let i = 0; i < speedLines; i++) {
                    const angle = (i / speedLines) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(
                        echo.position.x + Math.cos(angle) * echo.radius * 0.5,
                        echo.position.y + Math.sin(angle) * echo.radius * 0.5
                    );
                    ctx.lineTo(
                        echo.position.x + Math.cos(angle) * echo.radius,
                        echo.position.y + Math.sin(angle) * echo.radius
                    );
                    ctx.stroke();
                }
                break;
        }
    });
    
    // Render chaos particles
    effect.data.chaosParticles.forEach((particle: any) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life * alpha;
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Static/noise overlay
    if (Math.random() < 0.1) {
        ctx.globalAlpha = alpha * 0.05;
        ctx.fillStyle = 'white';
        for (let i = 0; i < 20; i++) {
            ctx.fillRect(
                Math.random() * ctx.canvas.width,
                Math.random() * ctx.canvas.height,
                Math.random() * 3,
                Math.random() * 50
            );
        }
    }
    
    // Chaos indicator text
    if (Math.random() < 0.02) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        const messages = ['CHAOS', 'ERROR', 'ECHO', '???', 'GLITCH'];
        const message = messages[Math.floor(Math.random() * messages.length)];
        ctx.fillText(
            message,
            Math.random() * ctx.canvas.width,
            Math.random() * ctx.canvas.height
        );
    }
    
    ctx.restore();
};