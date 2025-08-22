import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const DREAM_COOLDOWN = 18000; // 18 seconds
const DREAM_DURATION = 5000; // 5 seconds

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];

    // Check cooldown
    if (jobState.dreamCooldown && now < jobState.dreamCooldown) {
        return {};
    }

    // Handle dreaming state
    if (jobState.isDreaming && jobState.actionEndTime && now < jobState.actionEndTime) {
        strand.velocity.x *= 0.95; // Slow down while dreaming
        strand.velocity.y *= 0.95;
        
        // Emit distortion effect
        if (now > (jobState.lastDistortionTime || 0) + 800) {
            jobState.lastDistortionTime = now;
            newJobEffects.push({
                id: now + Math.random(),
                type: 'DREAM_DISTORTION',
                position: { ...strand.position },
                life: 2000,
                maxLife: 2000,
                radius: 10,
                maxRadius: 200,
            });
        }
        return { newJobEffects };
    } else if (jobState.isDreaming) {
        // End dreaming action
        jobState.isDreaming = false;
        jobState.dreamCooldown = now + DREAM_COOLDOWN + Math.random() * 4000;
    }

    // Decide to start a new dream action
    if (Math.random() < 0.004) {
        jobState.isDreaming = true;
        jobState.actionEndTime = now + DREAM_DURATION;
        return { newLogs: [`${strand.name} begins to dream, warping reality.`] };
    }

    return {};
};