import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const ANCHOR_COOLDOWN = 20000; // 20 seconds
const ANCHOR_DURATION = 6000; // 6 seconds

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];

    // Check cooldown
    if (jobState.anchorCooldown && now < jobState.anchorCooldown) {
        return {};
    }

    // Handle anchoring state
    if (jobState.isAnchoring && jobState.actionEndTime && now < jobState.actionEndTime) {
        strand.velocity.x *= 0.9; // Greatly slow down
        strand.velocity.y *= 0.9;
        
        // Emit grounding aura effect
        if (now > (jobState.lastAuraTime || 0) + 1500) {
            jobState.lastAuraTime = now;
            newJobEffects.push({
                id: now + Math.random(),
                type: 'GROUNDING_AURA',
                position: { ...strand.position },
                life: 1500,
                maxLife: 1500,
                radius: 120,
                color: `rgba(${strand.originalColor.join(',')}, 0.6)`,
            });
        }
        return { newJobEffects };
    } else if (jobState.isAnchoring) {
        // End anchoring action
        jobState.isAnchoring = false;
        jobState.anchorCooldown = now + ANCHOR_COOLDOWN + Math.random() * 5000;
    }

    // Decide to start a new anchor action
    if (Math.random() < 0.003) {
        jobState.isAnchoring = true;
        jobState.actionEndTime = now + ANCHOR_DURATION;
        return { newLogs: [`${strand.name} anchors itself, creating an aura of stability.`] };
    }

    return {};
};