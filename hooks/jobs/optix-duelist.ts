import type { Strand, RelationshipMatrix } from '../../types';
import { RelationshipLevel } from '../../types';
import { JobUpdateResult } from './index';

const SCAN_COOLDOWN = 8000;
const CHALLENGE_COOLDOWN = 20000;
const SCAN_DURATION = 1500;
const CHALLENGE_DURATION = 2500;

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const relationshipEvents = [];

    // Clear finished states
    if (jobState.isScanning && now > (jobState.actionEndTime || 0)) jobState.isScanning = false;
    if (jobState.isChallenging && now > (jobState.actionEndTime || 0)) jobState.isChallenging = false;

    // Handle ongoing actions
    if (jobState.isScanning) {
        strand.glowColor = [255, 50, 50]; // Red scanning glow
        return {};
    }
    if (jobState.isChallenging) {
        strand.glowColor = [255, 165, 0]; // Orange challenge glow
        const target = allStrands.find(s => s.id === jobState.targetId);
        if (target) {
            // Accelerate towards target
            const angle = Math.atan2(target.position.y - strand.position.y, target.position.x - strand.position.x);
            strand.velocity.x += Math.cos(angle) * 0.1;
            strand.velocity.y += Math.sin(angle) * 0.1;
        }
        return {};
    }
    
    // Decide on a new action if not on cooldown
    if (now > (jobState.scanCooldown || 0) && Math.random() < 0.008) {
        const target = allStrands.find(s => s.id !== strand.id && s.visible && !s.isDefeated);
        if (target) {
            jobState.isScanning = true;
            jobState.targetId = target.id;
            jobState.actionEndTime = now + SCAN_DURATION;
            jobState.scanCooldown = now + SCAN_COOLDOWN;
            return { newLogs: [`${strand.name} is scanning ${target.name}.`] };
        }
    }
    
    // Decide to challenge after a scan
    if (now > (jobState.challengeCooldown || 0) && jobState.targetId !== undefined && !jobState.isScanning && Math.random() < 0.01) {
        const target = allStrands.find(s => s.id === jobState.targetId);
        if (target) {
            jobState.isChallenging = true;
            jobState.actionEndTime = now + CHALLENGE_DURATION;
            jobState.challengeCooldown = now + CHALLENGE_COOLDOWN;

            const rel = relationshipMatrix[strand.name]?.[target.name] ?? RelationshipLevel.Acquaintance;
            const modifier = rel > RelationshipLevel.Acquaintance ? 0.01 : -0.01;
            relationshipEvents.push({s1Name: strand.name, s2Name: target.name, modifier});
            
            return { newLogs: [`${strand.name} challenges ${target.name}!`], relationshipEvents };
        }
    }

    return {};
};