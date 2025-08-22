import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const LINK_COOLDOWN = 18000; // 18 seconds
const LINK_DURATION = 8000; // 8 seconds
const LINK_RANGE = 300;
const RELATIONSHIP_IMPROVEMENT_RATE_PER_FRAME = 0.01 / 60; // per frame, assumes 60fps

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];
    const relationshipEvents = [];

    // Check cooldown
    if (jobState.linkCooldown && now < jobState.linkCooldown) {
        return {};
    }

    // Handle ongoing link effect
    if (jobState.isLinking && jobState.actionEndTime && now < jobState.actionEndTime) {
        const s1 = allStrands.find(s => s.id === jobState.target1Id);
        const s2 = allStrands.find(s => s.id === jobState.target2Id);

        if (s1 && s2) {
            // Improve relationship over time
             relationshipEvents.push({ s1Name: s1.name, s2Name: s2.name, modifier: RELATIONSHIP_IMPROVEMENT_RATE_PER_FRAME });
        } else {
             jobState.isLinking = false; // One of the targets disappeared
        }
        return { relationshipEvents };
    } else if (jobState.isLinking) {
        jobState.isLinking = false;
        jobState.linkCooldown = now + LINK_COOLDOWN + Math.random() * 4000;
    }


    // Decide to start linking
    if (Math.random() < 0.004) {
        const nearbyStrands = allStrands.filter(s =>
            s.visible && s.id !== strand.id && !s.isDefeated &&
            Math.hypot(strand.position.x - s.position.x, strand.position.y - s.position.y) < LINK_RANGE * 2
        );

        if (nearbyStrands.length >= 2) {
            // Select two random nearby strands
            const target1 = nearbyStrands.splice(Math.floor(Math.random() * nearbyStrands.length), 1)[0];
            const target2 = nearbyStrands[Math.floor(Math.random() * nearbyStrands.length)];
            
            jobState.isLinking = true;
            jobState.target1Id = target1.id;
            jobState.target2Id = target2.id;
            jobState.actionEndTime = now + LINK_DURATION;

            const newJobEffect: ActiveJobEffect = {
                id: now + Math.random(),
                type: 'EMPATHIC_LINK',
                position: { x: 0, y: 0 },
                life: LINK_DURATION,
                maxLife: LINK_DURATION,
                color: 'rgba(255, 105, 180, 0.7)',
                data: {
                    targetId: target1.id,
                    target2Id: target2.id,
                }
            };
            
            return { 
                newJobEffects: [newJobEffect],
                newLogs: [`${strand.name} forges an empathic link between ${target1.name} and ${target2.name}.`]
            };
        }
    }

    return {};
};