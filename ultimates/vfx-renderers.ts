
import type { Strand, TransientVfx } from '../types';

export const renderChargeGainEffect = (
    ctx: CanvasRenderingContext2D,
    strand: Strand,
    vfx: TransientVfx,
    now: number
): void => {
    ctx.save();
    
    const alpha = vfx.life / vfx.maxLife;

    // Golden surge effect around strand
    const pulse = 1 + 0.2 * Math.sin(now / 100);
    const gradient = ctx.createRadialGradient(
        strand.position.x, strand.position.y, strand.radius,
        strand.position.x, strand.position.y, strand.radius + 20 * pulse
    );
    
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${0.4 * alpha})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(strand.position.x, strand.position.y, strand.radius + 20 * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // "+35 CHARGE" text
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+${Math.round(vfx.data.amount)} CHARGE`, strand.position.x, strand.position.y - strand.radius - 15 - (20 * (1-alpha)) );
    
    ctx.restore();
};

export const renderLowHpActivation = (
    ctx: CanvasRenderingContext2D,
    strand: Strand,
    vfx: TransientVfx,
    now: number
): void => {
    ctx.save();
    const life = vfx.life / vfx.maxLife;
    const radius = strand.radius + 60 * (1 - life);
    const alpha = life * life;

    ctx.strokeStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
    ctx.lineWidth = 5 * alpha;
    ctx.shadowColor = 'red';
    ctx.shadowBlur = 20 * alpha;
    
    ctx.beginPath();
    ctx.arc(strand.position.x, strand.position.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
};
