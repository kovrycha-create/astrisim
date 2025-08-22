import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { RelationshipLevel } from '../../types';
import { JobUpdateResult } from './index';

const STALK_COOLDOWN = 25000; // 25 seconds
const STALK_DURATION = 10000; // 10 seconds
const PULSE_INTERVAL = 2000; // 2 seconds

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
    if (jobState.stalkCooldown && now < jobState.stalkCooldown) {
        return {};
    }

    // Handle stalking state
    if (jobState.isStalking && jobState.actionEndTime && now < jobState.actionEndTime) {
        const target = allStrands.find(s => s.id === jobState.targetId && s.visible && !s.isDefeated);
        if (target) {
            // Move towards target
            const angle = Math.atan2(target.position.y - strand.position.y, target.position.x - strand.position.x);
            strand.velocity.x += Math.cos(angle) * 0.05;
            strand.velocity.y += Math.sin(angle) * 0.05;

            // Emit dark pulse
            if (now > (jobState.lastPulseTime || 0) + PULSE_INTERVAL) {
                jobState.lastPulseTime = now;
                newJobEffects.push({
                    id: now + Math.random(),
                    type: 'RIPPLE',
                    position: { ...strand.position },
                    life: 1500,
                    maxLife: 1500,
                    radius: 10,
                    maxRadius: 150,
                    color: 'rgba(80, 70, 100, 0.5)',
                    data: { isDethapartPulse: true },
                });
                // If pulse hits target, degrade relationship
                const dist = Math.hypot(strand.position.x - target.position.x, strand.position.y - target.position.y);
                if (dist < 150) {
                    relationshipEvents.push({s1Name: strand.name, s2Name: target.name, modifier: -0.02});
                }
            }
        } else {
            // Target lost, end stalking
            jobState.isStalking = false;
        }
        return { newJobEffects, relationshipEvents };
    } else if (jobState.isStalking) {
        // End stalking action
        jobState.isStalking = false;
        jobState.stalkCooldown = now + STALK_COOLDOWN + Math.random() * 5000;
    }

    // Decide to start stalking
    if (Math.random() < 0.003) {
        let worstEnemy: Strand | null = null;
        let minRelationship = RelationshipLevel.Acquaintance;

        for (const other of allStrands) {
            if (other.id === strand.id || !other.visible || other.isDefeated) continue;
            const rel = relationshipMatrix[strand.name]?.[other.name];
            if (rel !== undefined && rel < minRelationship) {
                minRelationship = rel;
                worstEnemy = other;
            }
        }

        if (worstEnemy && minRelationship <= RelationshipLevel.MortalEnemy) {
            jobState.isStalking = true;
            jobState.targetId = worstEnemy.id;
            jobState.actionEndTime = now + STALK_DURATION;
            return { newLogs: [`${strand.name} begins stalking its prey, ${worstEnemy.name}...`] };
        }
    }

    return {};
};