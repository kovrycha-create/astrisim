import React, { useRef, useEffect, forwardRef } from 'react';
import type { Strand, Theme, ParticleSystem, ActiveUltimate, ActiveSpecialEvent, ActiveJobEffect, Anomaly, Mood, Vector, ExplosionEffect, GameMode, PlayerTool, PlayerWall, RelationshipMatrix, CombatTextEffect, CollisionVfx } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_CONFIG } from '../constants';
import { RelationshipLevel } from '../types';

interface SimulationCanvasProps {
    strands: Strand[];
    activeUltimates: ActiveUltimate[];
    specialEvents: ActiveSpecialEvent[];
    jobEffects: ActiveJobEffect[];
    anomalies: Anomaly[];
    explosionEffects: ExplosionEffect[];
    combatTextEffects: CombatTextEffect[];
    collisionVfx: CollisionVfx[];
    playerWalls: PlayerWall[];
    activeStrandIndex: number;
    theme: Theme;
    particleSystem: ParticleSystem;
    onCanvasClick: (position: Vector, event: React.MouseEvent) => void;
    winner: Strand | null;
    isVictoryScreenVisible: boolean;
    suddenDeathEffectTime: number;
    gameMode: GameMode;
    mousePosition: Vector;
    activePlayerTool: PlayerTool;
    isGravityAnchorActive: boolean;
    isDrawingWall: boolean;
    wallStartPos: Vector | null;
    isRelationshipOverlayVisible: boolean;
    relationshipMatrix: RelationshipMatrix;
}

const THEME_COLORS = {
    day: { bg1: '#87CEEB', bg2: '#E0F2F7', star: 'transparent' },
    night: { bg1: '#000033', bg2: '#0b0b4b', star: '#FFFFFF' },
    cosmic: { bg1: '#020024', bg2: '#2c0979', star: '#FFFFFF' },
};

const MOOD_COLORS: Record<Mood, string> = {
    'Neutral': 'transparent',
    'Calm': 'rgba(100, 200, 255, 0.9)',
    'Agitated': 'rgba(255, 100, 50, 0.9)',
    'Playful': 'rgba(255, 105, 180, 0.9)',
};

let stars: {x: number, y: number, r: number}[] = [];
const initializeStars = () => {
    if (stars.length === 0) {
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT,
                r: Math.random() * 1.5,
            });
        }
    }
};


export const SimulationCanvas = forwardRef<HTMLCanvasElement, SimulationCanvasProps>(({
    strands, activeUltimates, specialEvents, jobEffects, anomalies, explosionEffects, combatTextEffects, collisionVfx, playerWalls,
    activeStrandIndex, theme, particleSystem, onCanvasClick, winner,
    isVictoryScreenVisible, suddenDeathEffectTime, gameMode, mousePosition,
    activePlayerTool, isGravityAnchorActive, isDrawingWall, wallStartPos,
    isRelationshipOverlayVisible, relationshipMatrix,
}, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = ref || internalCanvasRef;
    const mouseTrailRef = useRef<Vector[]>([]);

     const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>)?.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        onCanvasClick({ x, y }, event);
    };

    const handleCanvasContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
        event.preventDefault();
    };

    useEffect(() => {
        initializeStars();
        const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>)?.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        let animationFrameId: number;

        const render = () => {
            context.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            const now = Date.now();

            // Draw background
            const { bg1, bg2, star } = THEME_COLORS[theme];
            const gradient = context.createRadialGradient(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 0, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, Math.max(SCREEN_WIDTH, SCREEN_HEIGHT));
            gradient.addColorStop(0, bg2);
            gradient.addColorStop(1, bg1);
            context.fillStyle = gradient;
            context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            
            if (theme !== 'day') {
                context.fillStyle = star;
                stars.forEach(s => {
                    context.beginPath();
                    context.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                    context.fill();
                });
            }
             // Draw Special Events
            specialEvents.forEach(event => {
                context.save();
                const alpha = Math.max(0, (event.endTime - now) / (event.endTime - (event.id)));

                switch (event.type) {
                    case 'METEOR_SHOWER':
                        context.fillStyle = 'rgba(255, 255, 200, 0.8)';
                        context.shadowColor = 'white';
                        context.shadowBlur = 10;
                        event.data.meteors?.forEach(m => {
                            context.beginPath();
                            context.arc(m.position.x, m.position.y, 3, 0, Math.PI * 2);
                            context.fill();
                        });
                        break;
                    case 'SPEED_BOOST_ZONE':
                        if (event.data.zone) {
                            const zone = event.data.zone;
                            const pulse = 0.9 + 0.1 * Math.sin(now / 150);
                            const boostGradient = context.createRadialGradient(zone.position.x, zone.position.y, 0, zone.position.x, zone.position.y, zone.radius * pulse);
                            boostGradient.addColorStop(0, `rgba(255, 223, 0, ${0 * alpha})`);
                            boostGradient.addColorStop(0.9, `rgba(255, 223, 0, ${0.3 * alpha})`);
                            boostGradient.addColorStop(1, `rgba(255, 223, 0, ${0 * alpha})`);
                            context.fillStyle = boostGradient;
                            context.beginPath();
                            context.arc(zone.position.x, zone.position.y, zone.radius * pulse, 0, 2 * Math.PI);
                            context.fill();
                        }
                        break;
                    case 'COLOR_SHIFT':
                         if(event.data.hueShift !== undefined) {
                            context.globalCompositeOperation = 'hue';
                            context.fillStyle = `hsl(${event.data.hueShift}, 50%, 50%)`;
                            context.globalAlpha = 0.3 * alpha;
                            context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                         }
                        break;
                }
                context.restore();
            });

            // Draw Anomalies
            anomalies.forEach(anomaly => {
                context.save();
                const pulse = 1 + 0.1 * Math.sin(now / (anomaly.type === 'STARDUST_MOTE' ? 100 : 300));
                
                if (anomaly.type === 'STARDUST_MOTE') {
                    context.fillStyle = 'rgba(255, 255, 0, 0.8)';
                    context.shadowColor = 'yellow';
                    context.shadowBlur = 15;
                    context.beginPath();
                    context.arc(anomaly.position.x, anomaly.position.y, anomaly.radius * pulse, 0, Math.PI * 2);
                    context.fill();
                } else if (anomaly.type === 'WHISPERING_CRYSTAL') {
                    context.strokeStyle = 'rgba(200, 150, 255, 0.9)';
                    context.fillStyle = 'rgba(200, 150, 255, 0.3)';
                    context.shadowColor = '#d1b3ff';
                    context.shadowBlur = 20;
                    context.lineWidth = 2;
                    context.beginPath();
                    const size = anomaly.radius * pulse;
                    for (let i = 0; i < 6; i++) {
                         const angle = (i / 6) * 2 * Math.PI;
                         const x = anomaly.position.x + Math.cos(angle) * size;
                         const y = anomaly.position.y + Math.sin(angle) * size;
                         if(i === 0) context.moveTo(x, y);
                         else context.lineTo(x, y);
                    }
                    context.closePath();
                    context.stroke();
                    context.fill();
                }
                context.restore();
            });
            
            // Draw Relationship Overlay
            if (isRelationshipOverlayVisible) {
                context.save();
                context.lineWidth = 1;

                for (let i = 0; i < strands.length; i++) {
                    for (let j = i + 1; j < strands.length; j++) {
                        const s1 = strands[i];
                        const s2 = strands[j];

                        if (!s1.visible || !s2.visible) continue;

                        const level = relationshipMatrix[s1.name]?.[s2.name] ?? RelationshipLevel.Acquaintance;
                        
                        let shouldDraw = true;
                        context.globalAlpha = 0.7;
                        context.shadowBlur = 0;
                        context.setLineDash([]);

                        switch(level) {
                            case RelationshipLevel.BestFriend:
                                context.strokeStyle = 'gold';
                                context.lineWidth = 3;
                                context.shadowColor = 'gold';
                                context.shadowBlur = 10;
                                break;
                            case RelationshipLevel.Ally:
                                context.strokeStyle = '#FFFF99'; // Light Yellow
                                context.lineWidth = 2;
                                break;
                            case RelationshipLevel.Friend:
                                context.strokeStyle = '#87CEFA'; // Light Sky Blue
                                context.lineWidth = 1.5;
                                break;
                            case RelationshipLevel.Acquaintance:
                                context.strokeStyle = '#999999';
                                context.lineWidth = 1;
                                context.setLineDash([5, 10]);
                                context.globalAlpha = 0.4;
                                break;
                            case RelationshipLevel.MortalEnemy:
                                context.strokeStyle = '#FF4444';
                                context.lineWidth = 2;
                                context.setLineDash([8, 8]);
                                break;
                            default:
                                shouldDraw = false;
                        }

                        if (shouldDraw) {
                            context.beginPath();
                            context.moveTo(s1.position.x, s1.position.y);
                            context.lineTo(s2.position.x, s2.position.y);
                            context.stroke();
                        }
                    }
                }

                context.restore();
            }


            // Draw Active Ultimates
            activeUltimates.forEach(ult => {
                context.save();
                const alpha = Math.max(0, ult.life / ult.maxLife);
                context.globalAlpha = alpha;
                
                switch (ult.type) {
                    case 'FISSURE':
                        context.strokeStyle = ult.color;
                        context.lineWidth = 20 * alpha;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.stroke();
                        break;
                    case 'VITAL_BLOOM': {
                        const bloomGradient = context.createRadialGradient(ult.position.x, ult.position.y, 0, ult.position.x, ult.position.y, ult.radius);
                        const pulse = 0.8 + 0.2 * Math.sin(now / 200);
                        bloomGradient.addColorStop(0, `rgba(150, 255, 150, ${0 * alpha * pulse})`);
                        bloomGradient.addColorStop(0.8, `rgba(50, 220, 100, ${0.4 * alpha * pulse})`);
                        bloomGradient.addColorStop(1, `rgba(0, 255, 120, ${0 * alpha * pulse})`);
                        context.fillStyle = bloomGradient;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.fill();
                        break;
                    }
                    case 'REVELATION_FLARE': {
                        const flareGradient = context.createRadialGradient(ult.position.x, ult.position.y, 0, ult.position.x, ult.position.y, ult.radius);
                        flareGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alpha})`);
                        flareGradient.addColorStop(1, `rgba(255, 255, 200, ${0 * alpha})`);
                        context.fillStyle = flareGradient;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.fill();
                        break;
                    }
                    case 'GRAVITATIONAL_COLLAPSE': {
                        const collapseGradient = context.createRadialGradient(ult.position.x, ult.position.y, 0, ult.position.x, ult.position.y, ult.maxRadius);
                        collapseGradient.addColorStop(0, 'rgba(0,0,0,0.9)');
                        collapseGradient.addColorStop(0.2, 'rgba(25,0,50,0.6)');
                        collapseGradient.addColorStop(1, 'rgba(25,0,50,0)');
                        context.fillStyle = collapseGradient;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.maxRadius, 0, 2 * Math.PI);
                        context.fill();
                        break;
                    }
                    case 'EQUILIBRIUM_BURST':
                        context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                        context.fillRect(0,0, SCREEN_WIDTH, SCREEN_HEIGHT);
                        break;
                    case 'TRANQUILITY_NEXUS': {
                        const nexusGradient = context.createRadialGradient(ult.position.x, ult.position.y, 0, ult.position.x, ult.position.y, ult.radius);
                        const pulse = 0.9 + 0.1 * Math.sin(now / 400);
                        nexusGradient.addColorStop(0, `rgba(100, 200, 255, ${0})`);
                        nexusGradient.addColorStop(1, `rgba(100, 200, 255, ${0.3 * alpha * pulse})`);
                        context.fillStyle = nexusGradient;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.fill();
                        break;
                    }
                    case 'EMPATHIC_RESONANCE_VISUAL': {
                        const waveGradient = context.createRadialGradient(ult.position.x, ult.position.y, 0, ult.position.x, ult.position.y, ult.radius);
                        waveGradient.addColorStop(0, `rgba(180, 111, 255, 0)`);
                        waveGradient.addColorStop(0.9, `rgba(180, 111, 255, ${0.4 * alpha})`);
                        waveGradient.addColorStop(1, `rgba(180, 111, 255, 0)`);
                        context.fillStyle = waveGradient;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.fill();
                        break;
                    }
                     case 'BEACON_OF_KNOWLEDGE':
                     case 'UNITY_PULSE': {
                        const sourceStrand = strands.find(s => s.id === ult.sourceStrandId);
                        if (!sourceStrand) break;
                        context.strokeStyle = ult.color;
                        context.lineWidth = 2 * alpha;
                        ult.data?.participants?.forEach(id => {
                            const target = strands.find(s => s.id === id);
                            if(target) {
                                context.beginPath();
                                context.moveTo(sourceStrand.position.x, sourceStrand.position.y);
                                context.lineTo(target.position.x, target.position.y);
                                context.stroke();
                            }
                        });
                        break;
                    }
                    case 'DUEL_ARENA':
                        context.strokeStyle = ult.color;
                        context.lineWidth = 10;
                        context.shadowColor = 'red';
                        context.shadowBlur = 20;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.stroke();
                        break;
                    case 'DECREE_OF_NULL':
                        context.strokeStyle = ult.color;
                        context.lineWidth = 10;
                        context.shadowColor = '#000000';
                        context.shadowBlur = 20;
                        context.beginPath();
                        context.arc(ult.position.x, ult.position.y, ult.radius, 0, 2 * Math.PI);
                        context.stroke();
                        break;
                }
                
                context.restore();
            });

            // Draw Job Effects
            jobEffects.forEach(effect => {
                context.save();
                const alpha = Math.max(0, effect.life / effect.maxLife);
                context.globalAlpha = alpha;

                switch (effect.type) {
                    case 'RIPPLE':
                        if (effect.data?.isDethapartPulse) {
                            const pulseGradient = context.createRadialGradient(effect.position.x, effect.position.y, 0, effect.position.x, effect.position.y, effect.radius!);
                            pulseGradient.addColorStop(0, `rgba(10, 0, 20, ${alpha * 0.9})`);
                            pulseGradient.addColorStop(1, `rgba(10, 0, 20, 0)`);
                            context.fillStyle = pulseGradient;
                            context.beginPath();
                            context.arc(effect.position.x, effect.position.y, effect.radius!, 0, 2 * Math.PI);
                            context.fill();
                        } else {
                            context.strokeStyle = effect.color || 'rgba(255,255,255,0.5)';
                            context.lineWidth = 3 * alpha;
                            context.beginPath();
                            context.arc(effect.position.x, effect.position.y, effect.radius!, 0, 2 * Math.PI);
                            context.stroke();
                        }
                        break;
                    case 'EDGE_GLITCH':
                        context.fillStyle = `rgba(200, 50, 255, ${0.3 + Math.random() * 0.4})`;
                        const { width = 10, height = 100 } = effect.data || {};
                        let { x, y } = effect.position;
                        const glitchAmount = 30;
                        if (x > SCREEN_WIDTH / 2) x -= width;
                        if (y > SCREEN_HEIGHT / 2) y -= height;
                        context.clearRect(x, y, width, height);
                        context.fillRect(
                            x + (Math.random() - 0.5) * glitchAmount,
                            y + (Math.random() - 0.5) * glitchAmount,
                            width,
                            height
                        );
                        break;
                }

                context.restore();
            });

            // Draw particles
            particleSystem.particles.forEach(p => {
                context.globalAlpha = p.life / 100;
                context.fillStyle = p.color;
                context.beginPath();
                context.arc(p.position.x, p.position.y, p.radius, 0, 2 * Math.PI);
                context.fill();
                context.globalAlpha = 1;
            });

            // Draw Player Walls
            playerWalls.forEach(wall => {
                context.save();
                const alpha = Math.max(0, (wall.endTime - now) / (PLAYER_CONFIG.WALL_OF_LIGHT.DURATION * 1000));
                const wallGradient = context.createLinearGradient(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
                wallGradient.addColorStop(0, `rgba(255, 255, 224, ${alpha * 0.8})`);
                wallGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
                wallGradient.addColorStop(1, `rgba(255, 255, 224, ${alpha * 0.8})`);

                context.strokeStyle = wallGradient;
                context.lineWidth = 10;
                context.lineCap = 'round';
                context.shadowColor = 'white';
                context.shadowBlur = 20 * alpha;
                
                context.beginPath();
                context.moveTo(wall.start.x, wall.start.y);
                context.lineTo(wall.end.x, wall.end.y);
                context.stroke();
                context.restore();
            });
            
            // Draw strands
            const colorShiftEvent = specialEvents.find(e => e.type === 'COLOR_SHIFT');

            strands.forEach((strand, index) => {
                if (!strand.visible) return;

                context.save();
                context.translate(strand.position.x, strand.position.y);
                
                // Player Buffs
                strand.playerBuffs?.forEach(buff => {
                    const now = Date.now();
                    const config = PLAYER_CONFIG[buff.type];
                    const alpha = (buff.endTime - now) / (config.DURATION * 1000);

                    switch(buff.type) {
                        case 'FAVOR': {
                            context.beginPath();
                            const pulse = 1 + 0.1 * Math.sin(now / 100);
                            const favorGradient = context.createRadialGradient(0, 0, 0, 0, 0, (strand.radius + 10) * pulse);
                            favorGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
                            favorGradient.addColorStop(0.7, `rgba(255, 215, 0, ${0.5 * alpha})`);
                            favorGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                            context.fillStyle = favorGradient;
                            context.arc(0, 0, (strand.radius + 10) * pulse, 0, Math.PI * 2);
                            context.fill();
                            break;
                        }
                        case 'STASIS': {
                            context.fillStyle = `rgba(173, 216, 230, ${0.4 * alpha})`;
                            context.strokeStyle = `rgba(255, 255, 255, ${0.8 * alpha})`;
                            context.lineWidth = 2;
                            context.beginPath();
                            context.arc(0, 0, strand.radius, 0, Math.PI * 2);
                            context.fill();
                            context.stroke();
                            // Cracks
                            for (let i = 0; i < 3; i++) {
                                context.beginPath();
                                context.moveTo(Math.cos(i*2.1) * strand.radius * 0.5, Math.sin(i*2.1) * strand.radius * 0.5);
                                context.lineTo(Math.cos(i*2.1 + 0.5) * strand.radius, Math.sin(i*2.1 + 0.5) * strand.radius);
                                context.stroke();
                            }
                            break;
                        }
                        case 'BURDEN': {
                            context.beginPath();
                            const pulse = 1 + 0.05 * Math.sin(now/120);
                            const burdenGradient = context.createRadialGradient(0, 0, 0, 0, 0, strand.radius * 1.5 * pulse);
                            burdenGradient.addColorStop(0.6, 'rgba(50, 0, 80, 0)');
                            burdenGradient.addColorStop(1, `rgba(50, 0, 80, ${0.6 * alpha})`);
                            context.fillStyle = burdenGradient;
                            context.arc(0, 0, strand.radius * 1.5 * pulse, 0, Math.PI * 2);
                            context.fill();
                            // Particles
                            context.fillStyle = `rgba(80, 40, 120, ${alpha})`;
                            const particleCount = 5;
                            for (let i = 0; i < particleCount; i++) {
                                const angle = (i/particleCount) * Math.PI * 2 + (now/800);
                                const dist = strand.radius * 1.2;
                                context.fillRect(Math.cos(angle) * dist, Math.sin(angle) * dist, 2, 2);
                            }
                            break;
                        }
                    }
                });

                // Draw Mark of Closure
                if (strand.debuffs?.some(d => d.type === 'MARK_OF_CLOSURE')) {
                    context.strokeStyle = `rgba(80, 70, 100, ${0.7 + 0.3 * Math.sin(now / 100)})`;
                    context.lineWidth = 4;
                    context.beginPath();
                    context.arc(0, 0, strand.radius + 6, 0, Math.PI * 2);
                    context.stroke();
                }

                // Draw Mood Indicator
                if (strand.mood !== 'Neutral') {
                    context.fillStyle = MOOD_COLORS[strand.mood];
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 1;
                    context.beginPath();
                    context.arc(strand.radius - 8, -strand.radius + 8, 5, 0, 2 * Math.PI);
                    context.fill();
                    context.stroke();
                }

                // Custom Glow for DxD job
                if (strand.glowColor) {
                    context.beginPath();
                    const glowGradient = context.createRadialGradient(0, 0, strand.radius, 0, 0, strand.radius + 20);
                    const [r, g, b] = strand.glowColor;
                    glowGradient.addColorStop(0, `rgba(${r},${g},${b}, 0.6)`);
                    glowGradient.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
                    context.fillStyle = glowGradient;
                    context.arc(0, 0, strand.radius + 20, 0, Math.PI * 2);
                    context.fill();
                }
                
                // Active Halo
                if (index === activeStrandIndex && gameMode === 'BOT') {
                    context.beginPath();
                    const haloGradient = context.createRadialGradient(0, 0, strand.radius, 0, 0, strand.radius + 15);
                    haloGradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
                    haloGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                    context.fillStyle = haloGradient;
                    context.arc(0, 0, strand.radius + 15, 0, Math.PI * 2);
                    context.fill();
                }

                 // Idle effects
                if (index !== activeStrandIndex) {
                    if (strand.name === 'Vitarîs' && strand.jobState.pulseTimer) {
                         const pulseSize = strand.radius * (1 + 0.08 * Math.sin(strand.jobState.pulseTimer));
                         const pulseGradient = context.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
                         pulseGradient.addColorStop(0, `rgba(${strand.originalColor.join(',')}, 0.3)`);
                         pulseGradient.addColorStop(1, `rgba(${strand.originalColor.join(',')}, 0)`);
                         context.fillStyle = pulseGradient;
                         context.beginPath();
                         context.arc(0, 0, pulseSize, 0, 2 * Math.PI);
                         context.fill();
                    }
                    if (strand.name === "Dræmin'") {
                         context.filter = 'blur(1px)';
                    }
                }

                // Dream Weave Effect
                if (strand.temporaryState) {
                    context.strokeStyle = `rgba(200, 100, 255, ${0.5 + 0.5 * Math.sin(now / 150)})`;
                    context.lineWidth = 3;
                    context.beginPath();
                    context.arc(0, 0, strand.radius + 5, 0, Math.PI * 2);
                    context.stroke();
                }

                if (strand.image) {
                    if (colorShiftEvent && colorShiftEvent.data.hueShift !== undefined) {
                        context.filter = `hue-rotate(${colorShiftEvent.data.hueShift}deg) brightness(1.2)`;
                    }
                     context.drawImage(strand.image, -strand.radius, -strand.radius, strand.radius * 2, strand.radius * 2);
                } else {
                    context.beginPath();
                    context.arc(0, 0, strand.radius, 0, Math.PI * 2);
                    let color = `rgb(${strand.color.join(',')})`;
                     if (colorShiftEvent && colorShiftEvent.data.hueShift !== undefined) {
                        color = `hsl(${colorShiftEvent.data.hueShift}, 80%, 70%)`;
                    }
                    context.fillStyle = color;
                    context.fill();
                    context.strokeStyle = `rgba(255,255,255,0.5)`;
                    context.stroke();
                }
                
                 if (index !== activeStrandIndex && strand.name === "Dræmin'") {
                    context.filter = 'none';
                }

                context.restore();
            });

            // Draw Explosion Effects
            explosionEffects.forEach(effect => {
                context.save();
                const progress = 1 - (effect.life / effect.maxLife);

                // 1. Expanding Shockwave
                const shockwaveRadius = (50 + effect.intensity * 250) * progress;
                const shockwaveAlpha = 1 - progress;
                context.strokeStyle = `rgba(255, 255, 220, ${shockwaveAlpha * 0.8})`;
                context.lineWidth = 1 + effect.intensity * 8;
                context.beginPath();
                context.arc(effect.position.x, effect.position.y, shockwaveRadius, 0, Math.PI * 2);
                context.stroke();

                // 2. Central Flash
                const flashProgress = Math.min(1, progress * 4); // Flash happens in the first 25% of the effect's life
                const flashAlpha = 1 - flashProgress;
                const flashRadius = 30 + effect.intensity * 90;
                
                if (flashAlpha > 0) {
                    const flashGradient = context.createRadialGradient(effect.position.x, effect.position.y, 0, effect.position.x, effect.position.y, flashRadius);
                    flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
                    flashGradient.addColorStop(0.5, `rgba(255, 255, 200, ${flashAlpha * 0.7})`);
                    flashGradient.addColorStop(1, `rgba(255, 200, 100, 0)`);

                    context.fillStyle = flashGradient;
                    context.beginPath();
                    context.arc(effect.position.x, effect.position.y, flashRadius, 0, Math.PI * 2);
                    context.fill();
                }

                context.restore();
            });
            
            // Draw Collision VFX
            collisionVfx.forEach(vfx => {
                context.save();
                const progress = 1 - (vfx.life / vfx.maxLife);
                const alpha = 1 - progress;
                const size = 10 + vfx.intensity * 40;

                switch (vfx.type) {
                    case 'heal':
                        context.strokeStyle = `rgba(50, 255, 100, ${alpha * 0.9})`;
                        context.lineWidth = 2 + vfx.intensity * 4;
                        context.beginPath();
                        context.arc(vfx.position.x, vfx.position.y, size * progress, 0, Math.PI * 2);
                        context.stroke();
                        break;
                    case 'neutral':
                        context.strokeStyle = `rgba(200, 200, 200, ${alpha * 0.7})`;
                        context.lineWidth = 1 + vfx.intensity * 2;
                        context.beginPath();
                        context.arc(vfx.position.x, vfx.position.y, size * progress * 0.5, 0, Math.PI * 2);
                        context.stroke();
                        break;
                    case 'damage':
                    case 'crit':
                        context.strokeStyle = vfx.type === 'crit' ? `rgba(255, 165, 0, ${alpha})` : `rgba(255, 50, 50, ${alpha})`;
                        context.lineWidth = vfx.type === 'crit' ? 3 + vfx.intensity * 4 : 2 + vfx.intensity * 3;
                        const spikes = vfx.type === 'crit' ? 8 : 5;
                        const rotation = progress * Math.PI;
                        context.beginPath();
                        for (let i = 0; i < spikes * 2; i++) {
                            const radius = i % 2 === 0 ? size * (1 - progress) : size * 0.5 * (1 - progress);
                            const angle = (i / (spikes * 2)) * Math.PI * 2 + rotation;
                            const x = vfx.position.x + Math.cos(angle) * radius;
                            const y = vfx.position.y + Math.sin(angle) * radius;
                            if (i === 0) context.moveTo(x, y);
                            else context.lineTo(x, y);
                        }
                        context.closePath();
                        context.stroke();
                        break;
                }
                context.restore();
            });

            // Draw Combat Text
            combatTextEffects.forEach(effect => {
                context.save();
                const alpha = Math.min(1, (effect.life / effect.maxLife) * 2);
                const isCrit = effect.color === 'orange';
                const fontSize = isCrit ? 24 : 18;
                context.font = `bold ${fontSize}px sans-serif`;
                context.fillStyle = effect.color;
                context.globalAlpha = alpha;
                context.shadowColor = 'black';
                context.shadowBlur = 4;
                context.textAlign = 'center';
                context.fillText(effect.text, effect.position.x, effect.position.y);
                context.restore();
            });


            // Draw Winner Celebration
            if (winner && !isVictoryScreenVisible) {
                context.save();
                context.translate(winner.position.x, winner.position.y);

                const celebrationTime = now;
                const pulse = 1 + 0.2 * Math.sin(celebrationTime / 150);
                const rotation = (celebrationTime / 1000) * (Math.PI / 2);

                // Pulsating golden halo
                const haloGradient = context.createRadialGradient(0, 0, 0, 0, 0, winner.radius * 2 * pulse);
                haloGradient.addColorStop(0, 'rgba(255, 223, 0, 0)');
                haloGradient.addColorStop(0.7, 'rgba(255, 223, 0, 0.6)');
                haloGradient.addColorStop(1, 'rgba(255, 223, 0, 0)');
                context.fillStyle = haloGradient;
                context.beginPath();
                context.arc(0, 0, winner.radius * 2 * pulse, 0, Math.PI * 2);
                context.fill();

                // Rotating sunbeams
                context.strokeStyle = 'rgba(255, 255, 200, 0.7)';
                context.lineWidth = 4;
                context.shadowColor = 'white';
                context.shadowBlur = 15;
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + rotation;
                    context.beginPath();
                    context.moveTo(Math.cos(angle) * (winner.radius + 10), Math.sin(angle) * (winner.radius + 10));
                    context.lineTo(Math.cos(angle) * (winner.radius + 40), Math.sin(angle) * (winner.radius + 40));
                    context.stroke();
                }
                
                context.restore();
            }
            
            // Draw Player Mouse Interaction
            if (gameMode === 'PLAYER' && mousePosition.x > 0) {
                context.save();
                
                // Manage trail for Cosmic Current
                mouseTrailRef.current.push({ ...mousePosition });
                if (mouseTrailRef.current.length > 20) {
                    mouseTrailRef.current.shift();
                }

                if (isGravityAnchorActive) {
                    const config = PLAYER_CONFIG.GRAVITY_ANCHOR;
                    const pulse = 1 + 0.1 * Math.sin(now / 100);
                    const rotation = (now / 500) % (Math.PI * 2);
                    
                    const anchorGradient = context.createRadialGradient(mousePosition.x, mousePosition.y, 0, mousePosition.x, mousePosition.y, config.RADIUS * pulse);
                    anchorGradient.addColorStop(0, 'rgba(180, 111, 255, 0)');
                    anchorGradient.addColorStop(0.8, 'rgba(180, 111, 255, 0.5)');
                    anchorGradient.addColorStop(1, 'rgba(180, 111, 255, 0)');
                    context.fillStyle = anchorGradient;
                    context.beginPath();
                    context.arc(mousePosition.x, mousePosition.y, config.RADIUS * pulse, 0, Math.PI * 2);
                    context.fill();

                    context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    context.lineWidth = 2;
                    context.beginPath();
                    for(let i=0; i < 3; i++) {
                        const armAngle = i * (Math.PI * 2 / 3) + rotation;
                        context.moveTo(mousePosition.x, mousePosition.y);
                        context.quadraticCurveTo(
                            mousePosition.x + Math.cos(armAngle - 0.5) * config.RADIUS * 0.6,
                            mousePosition.y + Math.sin(armAngle - 0.5) * config.RADIUS * 0.6,
                            mousePosition.x + Math.cos(armAngle) * config.RADIUS,
                            mousePosition.y + Math.sin(armAngle) * config.RADIUS,
                        );
                    }
                    context.stroke();

                } else if (activePlayerTool === 'REPEL') {
                    const pulse = 1 + 0.05 * Math.sin(now / 150);
                    context.strokeStyle = `rgba(255, 255, 255, 0.3)`;
                    context.lineWidth = 2;
                    context.beginPath();
                    context.arc(mousePosition.x, mousePosition.y, PLAYER_CONFIG.REPEL.RADIUS * pulse, 0, 2 * Math.PI);
                    context.stroke();
                } else if (activePlayerTool === 'CURRENT') {
                    context.lineWidth = 3;
                    context.lineCap = 'round';
                    for (let i = mouseTrailRef.current.length - 1; i > 0; i--) {
                        const p1 = mouseTrailRef.current[i];
                        const p2 = mouseTrailRef.current[i-1];
                        const alpha = i / mouseTrailRef.current.length;
                        context.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.5})`;
                        context.beginPath();
                        context.moveTo(p1.x, p1.y);
                        context.lineTo(p2.x, p2.y);
                        context.stroke();
                    }
                } else if (activePlayerTool === 'WALL' && isDrawingWall && wallStartPos) {
                    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    context.lineWidth = 5;
                    context.setLineDash([10, 10]);
                    context.beginPath();
                    context.moveTo(wallStartPos.x, wallStartPos.y);
                    context.lineTo(mousePosition.x, mousePosition.y);
                    context.stroke();
                }
                 context.restore();
            } else {
                 if (mouseTrailRef.current.length > 0) mouseTrailRef.current = [];
            }

            // Draw Sudden Death effect
            if (now < suddenDeathEffectTime) {
                const effectDuration = 500; // should match duration in useSimulation
                const timeRemaining = suddenDeathEffectTime - now;
                const peakTime = effectDuration * 0.2;
                let alpha;
                if (timeRemaining > effectDuration - peakTime) {
                    alpha = 1 - (timeRemaining - (effectDuration - peakTime)) / peakTime;
                } else {
                    alpha = timeRemaining / (effectDuration - peakTime);
                }
                alpha = Math.max(0, Math.min(1, alpha));

                context.save();
                const vignetteGradient = context.createRadialGradient(
                    SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 2,
                    SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH / 1.5
                );
                vignetteGradient.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.1})`);
                vignetteGradient.addColorStop(1, `rgba(150, 0, 0, ${alpha * 0.6})`);

                context.fillStyle = vignetteGradient;
                context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                context.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [strands, activeStrandIndex, theme, particleSystem, activeUltimates, specialEvents, jobEffects, anomalies, explosionEffects, combatTextEffects, collisionVfx, playerWalls, winner, isVictoryScreenVisible, suddenDeathEffectTime, gameMode, mousePosition, activePlayerTool, isGravityAnchorActive, isDrawingWall, wallStartPos, isRelationshipOverlayVisible, relationshipMatrix]);

    return <canvas ref={canvasRef} onClick={handleCanvasClick} onContextMenu={handleCanvasContextMenu} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} className="absolute top-0 left-0 w-full h-full cursor-crosshair" />;
});