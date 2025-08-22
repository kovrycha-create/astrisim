import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const MOTE_INTERVAL = 400; // 0.4 seconds

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];

    // Check if it's time to leave a mote
    if (now > (jobState.lastMoteTime || 0) + MOTE_INTERVAL) {
        jobState.lastMoteTime = now;
        
        const speed = Math.hypot(strand.velocity.x, strand.velocity.y);
        
        // Only leave motes if moving
        if (speed > 0.5) {
            newJobEffects.push({
                id: now + Math.random(),
                type: 'VOID_MOTE',
                position: { ...strand.position },
                life: 3000,
                maxLife: 3000,
                radius: 3 + Math.random() * 3,
                color: 'rgba(50, 50, 50, 0.8)',
            });
        }
    }

    return { newJobEffects };
};