import type { Strand, RelationshipMatrix } from '../../types';
import { JobUpdateResult } from './index';

const STUDY_COOLDOWN = 15000; // 15 seconds
const STUDY_DURATION = 3000; // 3 seconds
const STUDY_RANGE = 300;

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const relationshipEvents = [];

    // Check cooldown
    if (jobState.studyCooldown && now < jobState.studyCooldown) {
        return {};
    }

    // Handle studying state
    if (jobState.isStudying && jobState.actionEndTime && now < jobState.actionEndTime) {
        strand.glowColor = [240, 240, 150]; // Yellow study glow
        const target = allStrands.find(s => s.id === jobState.targetId);
        if (target) {
            // Gently move closer to the target
            const dist = Math.hypot(strand.position.x - target.position.x, strand.position.y - target.position.y);
            if (dist > STUDY_RANGE * 0.5) {
                const angle = Math.atan2(target.position.y - strand.position.y, target.position.x - strand.position.x);
                strand.velocity.x += Math.cos(angle) * 0.02;
                strand.velocity.y += Math.sin(angle) * 0.02;
            } else {
                strand.velocity.x *= 0.95;
                strand.velocity.y *= 0.95;
            }
        }
        return {};
    } else if (jobState.isStudying) {
        // End studying action
        jobState.isStudying = false;
        jobState.studyCooldown = now + STUDY_COOLDOWN + Math.random() * 5000;
        const target = allStrands.find(s => s.id === jobState.targetId);
        if (target) {
            // Apply a small, neutral relationship change for the observation
            relationshipEvents.push({ s1Name: strand.name, s2Name: target.name, modifier: 0.005 });
            return { relationshipEvents };
        }
    }

    // Decide to start studying someone
    if (Math.random() < 0.004) {
        const potentialTargets = allStrands.filter(s =>
            s.visible && s.id !== strand.id && !s.isDefeated &&
            Math.hypot(strand.position.x - s.position.x, strand.position.y - s.position.y) < STUDY_RANGE * 2
        );

        if (potentialTargets.length > 0) {
            const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            jobState.isStudying = true;
            jobState.targetId = target.id;
            jobState.actionEndTime = now + STUDY_DURATION;
            return { newLogs: [`${strand.name} is studying ${target.name}.`] };
        }
    }

    return {};
};