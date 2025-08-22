import type { Strand, RelationshipMatrix, ActiveJobEffect, Vector } from '../../types';
import { RelationshipLevel } from '../../types';
import { JobUpdateResult } from './index';

const JUDGE_COOLDOWN = 22000; // 22 seconds
const JUDGE_DURATION = 5000; // 5 seconds
const FORCE_STRENGTH = 0.03;

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;

    // Check cooldown
    if (jobState.judgeCooldown && now < jobState.judgeCooldown) {
        return {};
    }
    
    // End any previous action
    if (jobState.isJudging) {
        jobState.isJudging = false;
        jobState.judgeCooldown = now + JUDGE_COOLDOWN + Math.random() * 8000;
    }

    // Decide to start judging
    if (Math.random() < 0.003) {
        let bestFriendsPair: [Strand, Strand] | null = null;
        let mortalEnemiesPair: [Strand, Strand] | null = null;

        // Find pairs with extreme relationships
        for (let i = 0; i < allStrands.length; i++) {
            for (let j = i + 1; j < allStrands.length; j++) {
                const s1 = allStrands[i];
                const s2 = allStrands[j];
                if (!s1.visible || !s2.visible || s1.isDefeated || s2.isDefeated) continue;

                const rel = relationshipMatrix[s1.name]?.[s2.name];
                if (rel === RelationshipLevel.BestFriend) {
                    bestFriendsPair = [s1, s2];
                } else if (rel === RelationshipLevel.MortalEnemy) {
                    mortalEnemiesPair = [s1, s2];
                }
            }
        }
        
        const pairToJudge = Math.random() > 0.5 ? bestFriendsPair : mortalEnemiesPair;
        
        if (pairToJudge) {
            jobState.isJudging = true;
            const [s1, s2] = pairToJudge;
            const isFriendly = relationshipMatrix[s1.name]?.[s2.name] === RelationshipLevel.BestFriend;
            
            const newJobEffect: ActiveJobEffect = {
                id: now + Math.random(),
                type: 'JUDGEMENT_LINK',
                position: { x: 0, y: 0 }, // Not needed as it links two strands
                life: JUDGE_DURATION,
                maxLife: JUDGE_DURATION,
                color: isFriendly ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 50, 50, 0.8)',
                data: {
                    targetId: s1.id,
                    target2Id: s2.id,
                }
            };

            const angle = Math.atan2(s2.position.y - s1.position.y, s2.position.x - s1.position.x);
            const force: Vector = {
                x: Math.cos(angle) * FORCE_STRENGTH,
                y: Math.sin(angle) * FORCE_STRENGTH,
            };

            const forces = new Map<number, Vector>();
            if (isFriendly) {
                // Nudge friends apart
                forces.set(s1.id, { x: -force.x, y: -force.y });
                forces.set(s2.id, force);
            } else {
                // Pull enemies together
                forces.set(s1.id, force);
                forces.set(s2.id, { x: -force.x, y: -force.y });
            }

            return {
                newJobEffects: [newJobEffect],
                newLogs: [`${strand.name} passes judgment on the bond between ${s1.name} and ${s2.name}.`],
                forces,
            };
        }
    }

    return {};
};