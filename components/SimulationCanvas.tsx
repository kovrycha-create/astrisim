import React, { useRef, useEffect, forwardRef } from 'react';
import type { Strand, Theme, ParticleSystem, ActiveSpecialEvent, ActiveJobEffect, Anomaly, Mood, Vector, ExplosionEffect, GameMode, PlayerTool, PlayerWall, RelationshipMatrix, CombatTextEffect, CollisionVfx, ActiveUltimate, GlobalEffect, TransientVfx, CameraTarget } from '../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT, PLAYER_CONFIG } from '../constants';
import { RelationshipLevel } from '../types';
import { ultimateRenderers, globalEffectRenderers, transientVfxRenderers } from '../ultimates';

interface SimulationCanvasProps {
    strands: Strand[];
    specialEvents: ActiveSpecialEvent[];
    jobEffects: ActiveJobEffect[];
    anomalies: Anomaly[];
    explosionEffects: ExplosionEffect[];
    combatTextEffects: CombatTextEffect[];
    collisionVfx: CollisionVfx[];
    transientVfx: TransientVfx[];
    playerWalls: PlayerWall[];
    activeUltimates: ActiveUltimate[];
    globalEffects: GlobalEffect[];
    activeStrandIndex: number;
    theme: Theme;
    particleSystem: ParticleSystem;
    onCanvasClick: (position: Vector, event: React.MouseEvent) => void;
    winner: Strand | null;
    isVictoryScreenVisible: boolean;
    suddenDeathEffectTime: number;
    screenFlash: { endTime: number; color: string } | null;
    screenShake: { endTime: number; intensity: number } | null;
    gameMode: GameMode;
    mousePosition: Vector;
    activePlayerTool: PlayerTool;
    isGravityAnchorActive: boolean;
    isDrawingWall: boolean;
    wallStartPos: Vector | null;
    isRelationshipOverlayVisible: boolean;
    relationshipMatrix: RelationshipMatrix;
    focusedStrandId: number | null;
    isActionCamActive?: boolean;
    cameraTarget?: CameraTarget;
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
    strands, specialEvents, jobEffects, anomalies, explosionEffects, combatTextEffects, collisionVfx, transientVfx, playerWalls,
    activeUltimates, globalEffects, activeStrandIndex, theme, particleSystem, onCanvasClick, winner,
    isVictoryScreenVisible, suddenDeathEffectTime, screenFlash, screenShake, gameMode, mousePosition,
    activePlayerTool, isGravityAnchorActive, isDrawingWall, wallStartPos,
    isRelationshipOverlayVisible, relationshipMatrix, focusedStrandId, isActionCamActive, cameraTarget
}, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRef = ref || internalCanvasRef;
    const mouseTrailRef = useRef<Vector[]>([]);
    const cameraRef = useRef({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, zoom: 1.0 });

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
            
            context.save();
            
            // Screen Shake Effect
            if (screenShake && now < screenShake.endTime) {
                const shakeX = (Math.random() - 0.5) * screenShake.intensity;
                const shakeY = (Math.random() - 0.5) * screenShake.intensity;
                context.translate(shakeX, shakeY);
            }

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

            // Camera Transformation
            context.save();

            const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

            // Determine target camera state
            let targetX = SCREEN_WIDTH / 2;
            let targetY = SCREEN_HEIGHT / 2;
            let targetZoom = 1.0;

            if (isActionCamActive && cameraTarget) {
                targetX = cameraTarget.x;
                targetY = cameraTarget.y;
                targetZoom = cameraTarget.zoom;
            } else if (focusedStrandId !== null) {
                const focused = strands.find(s => s.id === focusedStrandId);
                if (focused) {
                    targetX = focused.position.x;
                    targetY = focused.position.y;
                    targetZoom = 2.5;
                }
            }

            // Lerp camera state for smooth transition
            const camera = cameraRef.current;
            const lerpAmount = 0.08;
            camera.x = lerp(camera.x, targetX, lerpAmount);
            camera.y = lerp(camera.y, targetY, lerpAmount);
            camera.zoom = lerp(camera.zoom, targetZoom, lerpAmount);
            
            // Apply camera transformations
            context.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            context.scale(camera.zoom, camera.zoom);
            context.translate(-camera.x, -camera.y);

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

            // Draw Global Effects (before strands)
            globalEffects.forEach(effect => {
                const renderer = globalEffectRenderers[effect.type as keyof typeof globalEffectRenderers];
                if(renderer) {
                    (renderer as any)(context, effect, strands, now);
                }
            });

            // Draw Player tool indicators
            if (gameMode === 'PLAYER') {
                context.save();
                context.globalAlpha = 0.5;
                if (isGravityAnchorActive) {
                    const radius = PLAYER_CONFIG.GRAVITY_ANCHOR.RADIUS;
                    const gradient = context.createRadialGradient(mousePosition.x, mousePosition.y, 0, mousePosition.x, mousePosition.y, radius);
                    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
                    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
                    context.fillStyle = gradient;
                    context.beginPath();
                    context.arc(mousePosition.x, mousePosition.y, radius, 0, Math.PI * 2);
                    context.fill();
                } else if (activePlayerTool === 'REPEL') {
                    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    context.lineWidth = 2;
                    context.beginPath();
                    context.arc(mousePosition.x, mousePosition.y, PLAYER_CONFIG.REPEL.RADIUS, 0, Math.PI * 2);
                    context.stroke();
                } else if (activePlayerTool === 'CURRENT') {
                     context.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                     context.lineWidth = 2;
                     context.beginPath();
                     context.arc(mousePosition.x, mousePosition.y, PLAYER_CONFIG.CURRENT.RADIUS, 0, Math.PI * 2);
                     context.stroke();
                } else if (activePlayerTool === 'WALL' && isDrawingWall && wallStartPos) {
                     context.strokeStyle = 'rgba(255, 223, 0, 0.8)';
                     context.lineWidth = 5;
                     context.setLineDash([10, 5]);
                     context.beginPath();
                     context.moveTo(wallStartPos.x, wallStartPos.y);
                     context.lineTo(mousePosition.x, mousePosition.y);
                     context.stroke();
                     context.setLineDash([]);
                }
                context.restore();
            }

            // Draw Anomalies
            anomalies.forEach(anomaly => {
                context.save();
                const pulse = 1 + 0.2 * Math.sin(now / 200);
                if (anomaly.type === 'STARDUST_MOTE') {
                    context.fillStyle = `rgba(255, 223, 0, ${0.8 * pulse})`;
                    context.shadowColor = 'gold';
                    context.shadowBlur = 15;
                } else if (anomaly.type === 'WHISPERING_CRYSTAL') {
                     context.fillStyle = `rgba(219, 112, 219, ${0.9 * pulse})`;
                     context.shadowColor = 'magenta';
                     context.shadowBlur = 20;
                }
                context.beginPath();
                context.arc(anomaly.position.x, anomaly.position.y, anomaly.radius * pulse, 0, 2 * Math.PI);
                context.fill();
                context.restore();
            });

            // Draw job effects (like ripples)
            jobEffects.forEach(effect => {
                context.save();
                const life = effect.life / effect.maxLife;
                switch (effect.type) {
                    case 'RIPPLE':
                    case 'LIGHT_PULSE':
                        context.strokeStyle = effect.color || 'white';
                        context.lineWidth = 3 * life;
                        context.globalAlpha = life;
                        context.beginPath();
                        context.arc(effect.position.x, effect.position.y, effect.radius! + (effect.maxRadius! - effect.radius!) * (1 - life), 0, Math.PI * 2);
                        context.stroke();
                        break;
                    case 'EDGE_GLITCH':
                        context.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
                        context.globalAlpha = life;
                        context.fillRect(
                            effect.position.x + (Math.random() - 0.5) * 10,
                            effect.position.y + (Math.random() - 0.5) * 10,
                            effect.data!.width!,
                            effect.data!.height!
                        );
                        break;
                     case 'ENERGY_TRAIL':
                        context.fillStyle = effect.color || 'white';
                        context.globalAlpha = life;
                        context.beginPath();
                        context.arc(effect.position.x, effect.position.y, effect.radius! * life, 0, Math.PI * 2);
                        context.fill();
                        break;
                    case 'DREAM_DISTORTION':
                        context.save();
                        context.globalAlpha = life * 0.5;
                        context.translate(effect.position.x, effect.position.y);
                        context.scale(1 - life, 1 - life);
                        context.rotate((1-life) * Math.PI);
                        context.drawImage(canvas, -effect.position.x, -effect.position.y);
                        context.restore();
                        break;
                    case 'GROUNDING_AURA':
                        const auraPulse = 0.9 + 0.1 * Math.sin(now / 100);
                        context.fillStyle = effect.color || 'white';
                        context.globalAlpha = life * 0.2 * auraPulse;
                        context.beginPath();
                        context.arc(effect.position.x, effect.position.y, effect.radius! * auraPulse, 0, 2 * Math.PI);
                        context.fill();
                        break;
                    case 'VOID_MOTE':
                        context.fillStyle = effect.color || 'black';
                        context.globalAlpha = life;
                        context.beginPath();
                        context.arc(effect.position.x, effect.position.y, effect.radius! * life, 0, 2*Math.PI);
                        context.fill();
                        break;
                    case 'GRAVITY_WELL':
                        const wellPulse = 0.95 + 0.05 * Math.sin(now / 200);
                        const wellGradient = context.createRadialGradient(effect.position.x, effect.position.y, 0, effect.position.x, effect.position.y, effect.radius! * wellPulse);
                        wellGradient.addColorStop(0, 'rgba(180, 180, 255, 0)');
                        wellGradient.addColorStop(0.8, `rgba(180, 180, 255, ${0.1 * life})`);
                        wellGradient.addColorStop(1, `rgba(180, 180, 255, ${0.3 * life})`);
                        context.fillStyle = wellGradient;
                        context.beginPath();
                        context.arc(effect.position.x, effect.position.y, effect.radius! * wellPulse, 0, 2*Math.PI);
                        context.fill();
                        break;
                    case 'JUDGEMENT_LINK':
                    case 'EMPATHIC_LINK':
                    case 'WEAVER_TETHER':
                        const strand1 = strands.find(s => s.id === effect.data!.targetId);
                        const strand2 = strands.find(s => s.id === effect.data!.target2Id || s.id === effect.data!.sourceId);
                        if(strand1 && strand2) {
                            context.strokeStyle = effect.color || 'white';
                            context.lineWidth = 3 * life;
                            context.globalAlpha = life;
                            context.setLineDash([10, 5]);
                            context.beginPath();
                            context.moveTo(strand1.position.x, strand1.position.y);
                            context.lineTo(strand2.position.x, strand2.position.y);
                            context.stroke();
                            context.setLineDash([]);
                        }
                        break;
                }
                context.restore();
            });

            // Draw Strands
            strands.forEach(strand => {
                if (!strand.visible) return;

                context.save();
                context.globalAlpha = strand.isDefeated ? 0.3 : 1;
                
                 if (strand.image) {
                    context.save();
                    context.beginPath();
                    context.arc(strand.position.x, strand.position.y, strand.radius, 0, Math.PI * 2);
                    context.clip();
                    context.drawImage(strand.image, strand.position.x - strand.radius, strand.position.y - strand.radius, strand.radius * 2, strand.radius * 2);
                    context.restore();
                } else {
                    const [r, g, b] = strand.color;
                    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    context.beginPath();
                    context.arc(strand.position.x, strand.position.y, strand.radius, 0, Math.PI * 2);
                    context.fill();
                }

                // Low HP State Overlay
                if (strand.isInLowHpState) {
                    const pulse = 0.8 + 0.2 * Math.sin(now / 150);
                    context.fillStyle = `rgba(255, 50, 50, ${0.3 * pulse})`;
                    context.beginPath();
                    context.arc(strand.position.x, strand.position.y, strand.radius, 0, Math.PI * 2);
                    context.fill();
                }

                // Mood aura
                if (strand.mood !== 'Neutral' && now < strand.moodEndTime) {
                    context.strokeStyle = MOOD_COLORS[strand.mood];
                    context.lineWidth = 4;
                    context.beginPath();
                    context.arc(strand.position.x, strand.position.y, strand.radius + 5, 0, Math.PI * 2);
                    context.stroke();
                }
                
                // Player Buffs/Debuffs Visuals
                if (strand.playerBuffs) {
                    strand.playerBuffs.forEach(buff => {
                        if (buff.endTime > now) {
                            context.save();
                            const buffAlpha = Math.min(1, (buff.endTime - now) / 2000);
                            context.globalAlpha = buffAlpha;
                            if (buff.type === 'FAVOR') context.strokeStyle = 'gold';
                            if (buff.type === 'STASIS') context.strokeStyle = 'cyan';
                            if (buff.type === 'BURDEN') context.strokeStyle = 'maroon';
                            context.lineWidth = 3;
                            context.beginPath();
                            context.arc(strand.position.x, strand.position.y, strand.radius + 3, 0, Math.PI * 2);
                            context.stroke();
                            context.restore();
                        }
                    });
                }
                
                 // Glow effect
                if (strand.glow > 0 || strand.glowColor) {
                    context.shadowBlur = strand.glow * 15;
                    const [r,g,b] = strand.glowColor ?? strand.color;
                    context.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                    // Redraw to apply shadow
                    if (strand.image) {
                         context.drawImage(strand.image, strand.position.x - strand.radius, strand.position.y - strand.radius, strand.radius * 2, strand.radius * 2);
                    } else {
                         context.beginPath();
                         context.arc(strand.position.x, strand.position.y, strand.radius, 0, Math.PI * 2);
                         context.fill();
                    }
                }

                context.restore();
            });

            // Draw player walls
            playerWalls.forEach(wall => {
                context.save();
                const life = (wall.endTime - now) / (PLAYER_CONFIG.WALL_OF_LIGHT.DURATION * 1000);
                const gradient = context.createLinearGradient(wall.start.x, wall.start.y, wall.end.x, wall.end.y);
                gradient.addColorStop(0, 'rgba(255, 223, 0, 0)');
                gradient.addColorStop(0.5, `rgba(255, 223, 0, ${life})`);
                gradient.addColorStop(1, 'rgba(255, 223, 0, 0)');
                context.strokeStyle = gradient;
                context.lineWidth = 10;
                context.shadowColor = 'gold';
                context.shadowBlur = 20 * life;
                context.beginPath();
                context.moveTo(wall.start.x, wall.start.y);
                context.lineTo(wall.end.x, wall.end.y);
                context.stroke();
                context.restore();
            });

            // Draw Active Ultimates
            activeUltimates.forEach(ult => {
                const renderer = ultimateRenderers[ult.type as keyof typeof ultimateRenderers];
                if(renderer) {
                    (renderer as any)(context, ult, strands, now);
                }
            });

            // Draw Transient VFX
             transientVfx.forEach(vfx => {
                const renderer = transientVfxRenderers[vfx.type as keyof typeof transientVfxRenderers];
                if (renderer) {
                    const target = strands.find(s => s.id === vfx.targetId);
                    if (target) {
                        (renderer as any)(context, target, vfx, now);
                    }
                }
            });
            
            // Draw Relationship Overlay
            if(isRelationshipOverlayVisible) {
                context.save();
                context.lineWidth = 2;
                for (let i = 0; i < strands.length; i++) {
                    for (let j = i + 1; j < strands.length; j++) {
                        const s1 = strands[i];
                        const s2 = strands[j];
                        if(!s1.visible || !s2.visible) continue;

                        const rel = relationshipMatrix[s1.name]?.[s2.name];
                        if (rel === undefined) continue;

                        let color = 'rgba(255, 255, 255, 0.1)';
                        if (rel >= RelationshipLevel.Friend) color = `rgba(100, 255, 100, ${0.2 + (rel - RelationshipLevel.Friend)})`;
                        if (rel <= RelationshipLevel.Acquaintance) color = `rgba(255, 100, 100, ${0.2 + Math.abs(rel)})`;

                        context.strokeStyle = color;
                        context.beginPath();
                        context.moveTo(s1.position.x, s1.position.y);
                        context.lineTo(s2.position.x, s2.position.y);
                        context.stroke();
                    }
                }
                context.restore();
            }

            // Draw Collision VFX
            collisionVfx.forEach(vfx => {
                context.save();
                const life = vfx.life / vfx.maxLife;
                const radius = 10 + 40 * vfx.intensity * (1 - life);
                let color = 'white';
                if(vfx.type === 'damage') color = '255, 100, 100';
                if(vfx.type === 'heal') color = '100, 255, 100';
                if(vfx.type === 'crit') color = '255, 165, 0';
                if(vfx.type === 'heal_blocked') color = '128, 0, 128';

                const gradient = context.createRadialGradient(vfx.position.x, vfx.position.y, 0, vfx.position.x, vfx.position.y, radius);
                gradient.addColorStop(0, `rgba(${color}, ${life * 0.8})`);
                gradient.addColorStop(1, `rgba(${color}, 0)`);

                context.fillStyle = gradient;
                context.beginPath();
                context.arc(vfx.position.x, vfx.position.y, radius, 0, 2 * Math.PI);
                context.fill();
                context.restore();
            });

            context.restore(); // Restore from camera transform

             // Draw Sudden Death Vignette
            if (now < suddenDeathEffectTime) {
                const vignetteAlpha = (suddenDeathEffectTime - now) / 500;
                const gradient = context.createRadialGradient(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, SCREEN_WIDTH/3, SCREEN_WIDTH/2, SCREEN_HEIGHT/2, SCREEN_WIDTH/1.5);
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(1, `rgba(150, 0, 0, ${vignetteAlpha * 0.8})`);
                context.fillStyle = gradient;
                context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            }
            
            context.restore(); // Restore from screen shake

            // Draw Screen Flash
            if (screenFlash && now < screenFlash.endTime) {
                const flashAlpha = (screenFlash.endTime - now) / 200; // Assuming 200ms flash
                context.fillStyle = screenFlash.color;
                context.globalAlpha = flashAlpha;
                context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                context.globalAlpha = 1.0;
            }

            // Draw Combat Text
            context.save();
            context.textAlign = 'center';
            context.shadowColor = 'black';
            context.shadowBlur = 5;
            combatTextEffects.forEach(text => {
                const life = text.life / text.maxLife;
                context.globalAlpha = life;
                context.fillStyle = text.color;
                context.font = `bold ${16 + 10 * (1 - life)}px sans-serif`;
                context.fillText(text.text, text.position.x, text.position.y);
            });
            context.restore();
            
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    });

    return (
        <canvas
            ref={canvasRef as React.RefObject<HTMLCanvasElement>}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
            className="absolute top-0 left-0 w-full h-full"
        />
    );
});
