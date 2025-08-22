import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const WELL_COOLDOWN = 25000; // 25 seconds
const WELL_DURATION = 8000; // 8 seconds
const WELL_RADIUS = 180;
const WELL_STRENGTH = 0.02;

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;

    // Check cooldown and decide to create a well
    if (now > (jobState.lastWellTime || 0) + WELL_COOLDOWN && Math.random() < 0.003) {
        jobState.lastWellTime = now;
        
        // Slow down Cozmik while a well is active
        strand.jobState.isCreatingWell = true;
        strand.jobState.wellEndTime = now + WELL_DURATION;

        const newJobEffect: ActiveJobEffect = {
            id: now + Math.random(),
            type: 'GRAVITY_WELL',
            position: { ...strand.position },
            life: WELL_DURATION,
            maxLife: WELL_DURATION,
            radius: WELL_RADIUS,
            data: {
                strength: WELL_STRENGTH,
                sourceId: strand.id,
            },
        };

        return { 
            newJobEffects: [newJobEffect],
            newLogs: [`${strand.name} creates a miniature gravity well.`]
        };
    }
    
    // Handle state
    if (jobState.isCreatingWell && now < (jobState.wellEndTime || 0)) {
        strand.velocity.x *= 0.96;
        strand.velocity.y *= 0.96;
    } else if (jobState.isCreatingWell) {
        jobState.isCreatingWell = false;
    }

    return {};
};