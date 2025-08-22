import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const PACIFY_RANGE = 250;
const CHANNEL_DURATION = 3000; // 3 seconds
const COOLDOWN = 10000; // 10 seconds

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];

    // Check if on cooldown
    if (jobState.pacifyCooldown && now < jobState.pacifyCooldown) {
        return {};
    }

    // Handle channeling state
    if (jobState.isChanneling && jobState.channelEndTime && now < jobState.channelEndTime) {
        strand.velocity.x *= 0.9; // Slow down while channeling
        strand.velocity.y *= 0.9;
        
        // Emit ripple effect
        if (now > (jobState.lastRippleTime || 0) + 500) {
            jobState.lastRippleTime = now;
            newJobEffects.push({
                id: now + Math.random(),
                type: 'RIPPLE',
                position: { ...strand.position },
                life: 1000,
                maxLife: 1000,
                radius: 10,
                maxRadius: PACIFY_RANGE,
                color: 'rgba(100, 200, 255, 0.7)',
            });
        }
        
        // Pacify target
        const target = allStrands.find(s => s.id === jobState.targetId);
        if (target && target.mood === 'Agitated') {
             const dist = Math.hypot(strand.position.x - target.position.x, strand.position.y - target.position.y);
             if(dist < PACIFY_RANGE) {
                target.mood = 'Calm';
                target.moodEndTime = now + 5000;
             }
        }

        return { newJobEffects };
    } else if (jobState.isChanneling) {
        // End channeling
        jobState.isChanneling = false;
        jobState.pacifyCooldown = now + COOLDOWN;
    }

    // Find a target
    const agitatedStrands = allStrands.filter(s =>
        s.visible && s.id !== strand.id && s.mood === 'Agitated' &&
        Math.hypot(strand.position.x - s.position.x, strand.position.y - s.position.y) < PACIFY_RANGE
    );

    if (agitatedStrands.length > 0) {
        const target = agitatedStrands[0];
        jobState.isChanneling = true;
        jobState.channelEndTime = now + CHANNEL_DURATION;
        jobState.targetId = target.id;
        
        return { newLogs: [`${strand.name} begins to pacify ${target.name}.`] };
    }

    return {};
};