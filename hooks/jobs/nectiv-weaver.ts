import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { RelationshipLevel } from '../../types';
import { JobUpdateResult } from './index';

const TETHER_COOLDOWN = 16000; // 16 seconds
const TETHER_DURATION = 6000; // 6 seconds
const TETHER_RANGE = 400;

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;

    // Check cooldown
    if (jobState.tetherCooldown && now < jobState.tetherCooldown) {
        return {};
    }

    // End previous tether state
    if (jobState.isTethering) {
        jobState.isTethering = false;
        jobState.tetherCooldown = now + TETHER_COOLDOWN + Math.random() * 5000;
    }

    // Decide to start tethering
    if (Math.random() < 0.005) {
        const friends = allStrands.filter(s => {
            if (!s.visible || s.id === strand.id || s.isDefeated) return false;
            const rel = relationshipMatrix[strand.name]?.[s.name] ?? RelationshipLevel.Acquaintance;
            return rel >= RelationshipLevel.Friend && Math.hypot(strand.position.x - s.position.x, strand.position.y - s.position.y) < TETHER_RANGE;
        });

        if (friends.length > 0) {
            const target = friends[Math.floor(Math.random() * friends.length)];
            
            jobState.isTethering = true;
            
            const newJobEffect: ActiveJobEffect = {
                id: now + Math.random(),
                type: 'WEAVER_TETHER',
                position: { ...strand.position }, 
                life: TETHER_DURATION,
                maxLife: TETHER_DURATION,
                color: 'rgba(255, 215, 0, 0.8)',
                data: {
                    sourceId: strand.id,
                    targetId: target.id,
                }
            };

            // Small, immediate relationship boost
            const relationshipEvents = [{ s1Name: strand.name, s2Name: target.name, modifier: 0.02 }];

            return {
                newJobEffects: [newJobEffect],
                newLogs: [`${strand.name} weaves a tether of friendship to ${target.name}.`],
                relationshipEvents,
            };
        }
    }

    return {};
};