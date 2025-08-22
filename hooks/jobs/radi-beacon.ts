import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const PULSE_COOLDOWN = 10000; // 10 seconds

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;

    // Check cooldown and decide to pulse
    if (now > (jobState.lastPulseTime || 0) + PULSE_COOLDOWN && Math.random() < 0.008) {
        jobState.lastPulseTime = now;
        
        const newJobEffect: ActiveJobEffect = {
            id: now + Math.random(),
            type: 'LIGHT_PULSE',
            position: { ...strand.position },
            life: 2500,
            maxLife: 2500,
            radius: 10,
            maxRadius: 250,
            color: `rgba(${strand.originalColor.join(',')}, 0.5)`,
        };

        return { 
            newJobEffects: [newJobEffect],
            newLogs: [`${strand.name} emits a gentle pulse of light.`]
        };
    }

    return {};
};