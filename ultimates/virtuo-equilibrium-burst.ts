
import type { Strand, GlobalEffect, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG['Virtuō'];

export const triggerEquilibriumBurst = (
    caster: Strand,
    strands: Strand[],
    now: number
): GlobalEffect => {
    const livingStrands = strands.filter(s => s.visible && !s.isDefeated);
    
    const totalHealth = livingStrands.reduce((sum, s) => sum + s.health, 0);
    const averageHealth = livingStrands.length > 0 ? totalHealth / livingStrands.length : 0;

    const originalHealths = new Map<number, number>();
    livingStrands.forEach(s => {
        originalHealths.set(s.id, s.health);
    });

    return {
        type: 'EQUILIBRIUM_BURST',
        endTime: now + config.DURATION * 1000,
        data: {
            sourceId: caster.id,
            sourceName: caster.name,
            averageHealth: averageHealth,
            originalHealths: originalHealths,
            burstComplete: false,
        }
    };
};

export const updateEquilibriumBurst = (
    effect: GlobalEffect,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    healthSetMap: Map<number, number>,
    visualEffects: Array<{type: string, position: Vector, data: any}>
} => {
    const healthSetMap = new Map<number, number>();
    const visualEffects: Array<{type: string, position: Vector, data: any}> = [];
    
    if (!effect.data.burstComplete) {
        effect.data.burstComplete = true;

        const caster = strands.find(s => s.id === effect.data.sourceId);
        if(caster) addLog(`${caster.name} unleashes Equilibrium Burst!`);
        
        effect.data.originalHealths.forEach((originalHealth: number, strandId: number) => {
            const strand = strands.find(s => s.id === strandId);
            if (strand && strand.visible && !strand.isDefeated) {
                healthSetMap.set(strandId, effect.data.averageHealth);

                const healthChange = effect.data.averageHealth - originalHealth;
                const changeText = healthChange >= 0 ? `+${Math.round(healthChange)}` : `${Math.round(healthChange)}`;
                const color = healthChange >= 0 ? 'lightgreen' : 'red';
                
                 visualEffects.push({
                    type: 'COMBAT_TEXT',
                    position: { ...strand.position },
                    data: { text: changeText, color: color }
                });
            }
        });

         visualEffects.push({
            type: 'SCREEN_FLASH',
            position: { x: 0, y: 0 },
            data: { intensity: 0.8, duration: 0.3, color: 'white' }
        });
    }

    return { healthSetMap, visualEffects };
};

export const onEquilibriumBurstEnd = (
    effect: GlobalEffect,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    // Effect is instant, visual fades out.
};

export const renderEquilibriumBurst = (
    ctx: CanvasRenderingContext2D,
    effect: GlobalEffect,
    strands: Strand[],
    now: number
): void => {
    ctx.save();

    const timeSinceEnd = effect.endTime - now;
    const duration = config.DURATION * 1000;
    const progress = 1 - (timeSinceEnd / duration);
    const alpha = 1 - progress;

    const radius = ctx.canvas.width * progress;
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Expanding shockwave of balance
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.1})`);
    gradient.addColorStop(0.9, `rgba(220, 220, 220, ${alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw two intertwined expanding rings, one black, one white
    ctx.lineWidth = 10 * alpha;
    
    // White Ring
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    // Black Ring
    ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(0, radius * 0.8 - ctx.lineWidth), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
};
