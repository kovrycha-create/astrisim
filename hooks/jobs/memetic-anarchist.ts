import type { Strand, RelationshipMatrix, ActiveJobEffect } from '../../types';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../../constants';
import { JobUpdateResult } from './index';

const GLITCH_COOLDOWN = 15000; // 15 seconds
const ACTION_DURATION = 2000; // 2 seconds

export const update = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix
): JobUpdateResult => {
    const { jobState } = strand;
    const newJobEffects: ActiveJobEffect[] = [];

    // Check cooldown
    if (jobState.glitchCooldown && now < jobState.glitchCooldown) {
        return {};
    }

    // If currently glitching, create visual effects
    if (jobState.isGlitching && jobState.actionEndTime && now < jobState.actionEndTime) {
        strand.velocity.x *= 0.8;
        strand.velocity.y *= 0.8;
        
        if (Math.random() < 0.1) { // Throttle effect creation
            newJobEffects.push({
                id: now + Math.random(),
                type: 'EDGE_GLITCH',
                position: { ...jobState.glitchPosition },
                life: 500,
                maxLife: 500,
                data: {
                    width: 10 + Math.random() * 20,
                    height: 50 + Math.random() * 150,
                }
            });
        }
        return { newJobEffects };
    } else if (jobState.isGlitching) {
        // End glitching action
        jobState.isGlitching = false;
        jobState.glitchCooldown = now + GLITCH_COOLDOWN + Math.random() * 5000;
    }

    // Decide to start a new glitch action
    if (Math.random() < 0.005) { // Low chance per frame to start
        jobState.isGlitching = true;
        jobState.actionEndTime = now + ACTION_DURATION;
        
        // Pick a random edge
        const edge = Math.floor(Math.random() * 4);
        let pos = { x: 0, y: 0 };
        switch (edge) {
            case 0: pos = { x: 0, y: Math.random() * SCREEN_HEIGHT }; break; // Left
            case 1: pos = { x: SCREEN_WIDTH, y: Math.random() * SCREEN_HEIGHT }; break; // Right
            case 2: pos = { x: Math.random() * SCREEN_WIDTH, y: 0 }; break; // Top
            case 3: pos = { x: Math.random() * SCREEN_WIDTH, y: SCREEN_HEIGHT }; break; // Bottom
        }
        jobState.glitchPosition = pos;

        // Move towards the edge
        const angle = Math.atan2(pos.y - strand.position.y, pos.x - strand.position.x);
        strand.velocity.x = Math.cos(angle) * strand.speed * 2;
        strand.velocity.y = Math.sin(angle) * strand.speed * 2;
        
        return { newLogs: [`${strand.name} is drawn to a flaw in reality...`] };
    }

    return {};
};