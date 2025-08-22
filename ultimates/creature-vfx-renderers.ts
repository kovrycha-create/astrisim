
import type { Creature, Strand, ActiveJobEffect, TransientVfx } from '../types';

export const renderWhisperBufferField = (ctx: CanvasRenderingContext2D, effect: ActiveJobEffect, entities: { creatures: Creature[] }, now: number) => {
    const life = effect.life / effect.maxLife;
    const pulse = 1 + 0.1 * Math.sin(now / 100);
    
    const gradient = ctx.createRadialGradient(
        effect.position.x, effect.position.y, 0,
        effect.position.x, effect.position.y, effect.radius! * pulse
    );
    gradient.addColorStop(0, 'rgba(180, 180, 220, 0)');
    gradient.addColorStop(0.8, `rgba(180, 180, 220, ${0.2 * life})`);
    gradient.addColorStop(1, `rgba(180, 180, 220, ${0.4 * life})`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(effect.position.x, effect.position.y, effect.radius! * pulse, 0, Math.PI * 2);
    ctx.fill();
};

export const renderSympathyThread = (ctx: CanvasRenderingContext2D, effect: ActiveJobEffect, entities: { creatures: Creature[] }, now: number) => {
    const life = effect.life / effect.maxLife;
    const source = entities.creatures.find(c => c.id === effect.data!.sourceId);
    const target = entities.creatures.find(c => c.id === effect.data!.targetId);

    if (!source || !target) return;

    const pulse = 1 + 0.05 * Math.sin(now / 50);

    ctx.strokeStyle = `rgba(220, 220, 255, ${life * 0.8})`;
    ctx.lineWidth = 2 * pulse;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(source.position.x, source.position.y);
    ctx.lineTo(target.position.x, target.position.y);
    ctx.stroke();
    ctx.setLineDash([]);
};

export const renderVerdantPulse = (ctx: CanvasRenderingContext2D, effect: ActiveJobEffect, entities: { creatures: Creature[] }, now: number) => {
    const life = effect.life / effect.maxLife;
    const currentRadius = effect.radius! + (effect.maxRadius! - effect.radius!) * (1 - life);

    const gradient = ctx.createRadialGradient(
        effect.position.x, effect.position.y, 0,
        effect.position.x, effect.position.y, currentRadius
    );
    gradient.addColorStop(0, 'rgba(100, 255, 100, 0)');
    gradient.addColorStop(0.7, `rgba(100, 255, 100, ${0.3 * life})`);
    gradient.addColorStop(1, 'rgba(100, 255, 100, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(effect.position.x, effect.position.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
};

export const renderEquinoxBurst = (ctx: CanvasRenderingContext2D, effect: ActiveJobEffect, entities: { creatures: Creature[] }, now: number) => {
    const life = effect.life / effect.maxLife;
    const radius = effect.maxRadius! * (1 - life);
    const fromBloom = effect.data!.from === 'BLOOM';
    const color = fromBloom ? '100, 255, 150' : '200, 50, 100';

    const gradient = ctx.createRadialGradient(
        effect.position.x, effect.position.y, 0,
        effect.position.x, effect.position.y, radius
    );
    gradient.addColorStop(0, `rgba(${color}, ${0.8 * life})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
    ctx.fill();
};

export const renderEvolution = (ctx: CanvasRenderingContext2D, target: Creature, vfx: TransientVfx, now: number) => {
    const life = vfx.life / vfx.maxLife;
    
    // Expanding light ring
    const ringRadius = target.radius + 100 * (1 - life);
    ctx.strokeStyle = `rgba(255, 255, 255, ${life})`;
    ctx.lineWidth = 5 * life;
    ctx.beginPath();
    ctx.arc(target.position.x, target.position.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Ascending particles
    if (Math.random() > 0.5) {
        ctx.fillStyle = `rgba(200, 200, 255, ${life})`;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * target.radius;
        const x = target.position.x + Math.cos(angle) * dist;
        const y = target.position.y + Math.sin(angle) * dist - (100 * (1 - life));
        ctx.beginPath();
        ctx.arc(x, y, 3 * life, 0, Math.PI * 2);
        ctx.fill();
    }
};

export const renderStanceSwitch = (ctx: CanvasRenderingContext2D, target: Creature, vfx: TransientVfx, now: number) => {
     const life = vfx.life / vfx.maxLife;
     const fromBloom = vfx.data.from === 'BLOOM';
     const color = fromBloom ? 'rgba(255, 100, 150, 0.8)' : 'rgba(100, 255, 150, 0.8)';
     const radius = target.radius + 50 * Math.sin(Math.PI * (1 - life)); // In-out pulse

    ctx.strokeStyle = color;
    ctx.lineWidth = 5 * life;
    ctx.beginPath();
    ctx.arc(target.position.x, target.position.y, radius, 0, Math.PI * 2);
    ctx.stroke();
};
