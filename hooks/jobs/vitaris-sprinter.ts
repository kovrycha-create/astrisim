import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { JobUpdateResult } from './index';

const DASH_COOLDOWN = 12000; // 12 seconds
const DASH_DURATION = 500; // 0.5 seconds
const DASH_SPEED_MULTIPLIER = 4.0;
const DASH_BASE_SPEED = 1.5;

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];

    // Check cooldown
    if (jobState.dashCooldown && now < jobState.dashCooldown) {
        return {};
    }

    // Handle dashing state
    if (jobState.isDashing && jobState.actionEndTime && now < jobState.actionEndTime) {
        strand.tempSpeedModifier = DASH_SPEED_MULTIPLIER;
        
        // Create energy trail effect
        if (now > (jobState.lastTrailTime || 0) + 50) {
            jobState.lastTrailTime = now;
            newJobEffects.push({
                id: now + Math.random(),
                type: 'ENERGY_TRAIL',
                position: { ...strand.position },
                life: 300,
                maxLife: 300,
                radius: strand.radius * 0.8,
                color: `rgba(${strand.originalColor.join(',')}, 0.6)`,
            });
        }
        return { newJobEffects };
    } else if (jobState.isDashing) {
        // End dashing action
        jobState.isDashing = false;
        strand.tempSpeedModifier = 1.0;
        jobState.dashCooldown = now + DASH_COOLDOWN + Math.random() * 3000;
    }

    // Decide to start a new dash
    if (Math.random() < 0.005) { // Low chance per frame to start
        jobState.isDashing = true;
        jobState.actionEndTime = now + DASH_DURATION;
        
        // Give a velocity boost in the current direction or a random one if static
        const currentSpeed = Math.hypot(strand.velocity.x, strand.velocity.y);
        if (currentSpeed > 0.05) {
            strand.velocity.x = (strand.velocity.x / currentSpeed) * DASH_BASE_SPEED;
            strand.velocity.y = (strand.velocity.y / currentSpeed) * DASH_BASE_SPEED;
        } else { // If not moving, dash in a random direction
            const angle = Math.random() * 2 * Math.PI;
            strand.velocity.x = Math.cos(angle) * DASH_BASE_SPEED;
            strand.velocity.y = Math.sin(angle) * DASH_BASE_SPEED;
        }
        
        return { newLogs: [`${strand.name} dashes forward with incredible speed!`] };
    }

    return {};
};