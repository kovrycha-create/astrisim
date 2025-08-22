import type { Strand, ActiveUltimate, StrandName, Vector, RelationshipMatrix } from '../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MODIFIERS } from '../constants';

const config = ULTIMATE_CONFIG['Askänu'];

interface SynchronizedStrand {
    id: number;
    name: StrandName;
    syncStrength: number;
    lastPosition: Vector;
    syncVector: Vector;
}

export const triggerBeaconOfKnowledge = (
    caster: Strand,
    strands: Strand[],
    now: number
): ActiveUltimate => {
    // Find all allies in radius to synchronize
    const synchronized: SynchronizedStrand[] = [];
    
    strands.forEach(strand => {
        if (!strand.visible || strand.isDefeated || strand.id === caster.id) return;
        
        const dist = Math.hypot(
            strand.position.x - caster.position.x,
            strand.position.y - caster.position.y
        );
        
        if (dist <= config.RADIUS) {
            // Check if ally (simplified - would use relationship matrix)
            const isAlly = Math.random() > 0.5; // Simplified
            
            if (isAlly) {
                synchronized.push({
                    id: strand.id,
                    name: strand.name,
                    syncStrength: config.SYNC_STRENGTH * (1 - dist / config.RADIUS), // Stronger sync when closer
                    lastPosition: { ...strand.position },
                    syncVector: { x: 0, y: 0 }
                });
            }
        }
    });

    return {
        id: now + caster.id,
        type: 'BEACON_OF_KNOWLEDGE',
        sourceStrandId: caster.id,
        sourceStrandName: caster.name,
        position: { ...caster.position },
        life: config.DURATION,
        maxLife: config.DURATION,
        radius: config.RADIUS,
        maxRadius: config.RADIUS,
        color: 'rgba(240, 240, 150, 0.5)',
        data: {
            participants: synchronized.map(s => s.id),
            synchronizedStrands: synchronized,
            knowledgeGrid: generateKnowledgeGrid(caster.position, config.RADIUS),
            informationFlows: [],
            coordinationScore: 0,
            perfectSyncMoments: 0,
        }
    };
};

function generateKnowledgeGrid(center: Vector, radius: number): Array<{x: number, y: number, active: boolean}> {
    const grid = [];
    const gridSize = 50;
    const gridRadius = Math.ceil(radius / gridSize);
    
    for (let i = -gridRadius; i <= gridRadius; i++) {
        for (let j = -gridRadius; j <= gridRadius; j++) {
            const x = center.x + i * gridSize;
            const y = center.y + j * gridSize;
            const dist = Math.hypot(x - center.x, y - center.y);
            
            if (dist <= radius) {
                grid.push({
                    x,
                    y,
                    active: Math.random() < 0.3
                });
            }
        }
    }
    
    return grid;
}

export const updateBeaconOfKnowledge = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    deltaSeconds: number,
    now: number,
    addLog: (msg: string) => void,
    relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>,
    relationshipMatrix: RelationshipMatrix
): {
    movementModifiers: Map<number, Vector>,
    visualEffects: Array<{type: string, data: any}>,
    coordinationBonus: number
} => {
    const movementModifiers = new Map<number, Vector>();
    const visualEffects: Array<{type: string, data: any}> = [];
    let coordinationBonus = 0;
    
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (!caster) return { movementModifiers, visualEffects, coordinationBonus };

    // Update position to follow caster
    ultimate.position = { ...caster.position };

    // Calculate caster's movement vector
    const casterMovement = {
        x: caster.velocity.x * caster.speed,
        y: caster.velocity.y * caster.speed
    };
    
    // Update synchronized strands
    let totalCoordination = 0;
    let activeSyncCount = 0;
    
    ultimate.data.synchronizedStrands.forEach((syncData: SynchronizedStrand) => {
        const strand = strands.find(s => s.id === syncData.id);
        if (!strand || !strand.visible || strand.isDefeated) return;
        
        const dist = Math.hypot(
            strand.position.x - caster.position.x,
            strand.position.y - caster.position.y
        );
        
        // Only sync if still in radius
        if (dist <= ultimate.radius) {
            activeSyncCount++;
            
            // Calculate sync vector based on caster's movement
            const syncVector = {
                x: casterMovement.x * syncData.syncStrength,
                y: casterMovement.y * syncData.syncStrength
            };
            
            // Apply gentle guidance toward caster's direction
            movementModifiers.set(strand.id, syncVector);
            
            // Update sync data
            syncData.syncVector = syncVector;
            
            // Calculate coordination score based on alignment
            const strandMovement = {
                x: strand.velocity.x * strand.speed,
                y: strand.velocity.y * strand.speed
            };
            
            const dotProduct = (strandMovement.x * casterMovement.x + strandMovement.y * casterMovement.y);
            const magnitudes = Math.sqrt(strandMovement.x ** 2 + strandMovement.y ** 2) * 
                              Math.sqrt(casterMovement.x ** 2 + casterMovement.y ** 2);
            
            const alignment = magnitudes > 0 ? dotProduct / magnitudes : 0;
            totalCoordination += alignment;
            
            // Create information flow effect
            if (Math.random() < 0.1) {
                ultimate.data.informationFlows.push({
                    from: { ...caster.position },
                    to: { ...strand.position },
                    progress: 0,
                    lifetime: 1
                });
            }
            
            // Track relationship improvement for good coordination
            if (alignment > 0.8) {
                relationshipEvents.push({
                    s1Name: caster.name,
                    s2Name: strand.name,
                    modifier: RELATIONSHIP_MODIFIERS.ULTIMATE_SUPPORT_ALLY * deltaSeconds
                });
            }
        }
    });
    
    // Update coordination score
    if (activeSyncCount > 0) {
        ultimate.data.coordinationScore = totalCoordination / activeSyncCount;
        coordinationBonus = ultimate.data.coordinationScore;
        
        // Check for perfect sync moments
        if (ultimate.data.coordinationScore > 0.95) {
            ultimate.data.perfectSyncMoments++;
            if (ultimate.data.perfectSyncMoments % 30 === 0) { // Every 30 frames of perfect sync
                visualEffects.push({
                    type: 'PERFECT_SYNC',
                    data: {
                        position: caster.position,
                        participants: ultimate.data.participants.length
                    }
                });
                addLog(`Perfect synchronization achieved!`);
            }
        }
    }
    
    // Update information flows
    ultimate.data.informationFlows = ultimate.data.informationFlows.filter((flow: any) => {
        flow.progress += deltaSeconds * 2;
        flow.lifetime -= deltaSeconds;
        return flow.lifetime > 0;
    });
    
    // Update knowledge grid
    ultimate.data.knowledgeGrid.forEach((node: any) => {
        if (Math.random() < 0.05) {
            node.active = !node.active;
        }
    });

    return { movementModifiers, visualEffects, coordinationBonus };
};

export const onBeaconOfKnowledgeEnd = (
    ultimate: ActiveUltimate,
    strands: Strand[],
    addLog: (msg: string) => void
): void => {
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    if (caster) {
        const score = Math.round(ultimate.data.coordinationScore * 100);
        addLog(`${caster.name}'s Beacon fades. Coordination score: ${score}%`);
    }
};

export const renderBeaconOfKnowledge = (
    ctx: CanvasRenderingContext2D,
    ultimate: ActiveUltimate,
    strands: Strand[],
    now: number
): void => {
    ctx.save();
    
    const alpha = ultimate.life / ultimate.maxLife;
    const caster = strands.find(s => s.id === ultimate.sourceStrandId);
    
    // Draw knowledge grid overlay
    ctx.strokeStyle = `rgba(240, 240, 150, ${alpha * 0.1})`;
    ctx.lineWidth = 1;
    
    ultimate.data.knowledgeGrid.forEach((node: any) => {
        if (node.active) {
            ctx.fillStyle = `rgba(240, 240, 150, ${alpha * 0.3})`;
            ctx.fillRect(node.x - 2, node.y - 2, 4, 4);
        }
    });
    
    // Draw synchronization lines
    if (caster) {
        ultimate.data.participants.forEach((participantId: number) => {
            const participant = strands.find(s => s.id === participantId);
            if (!participant || !participant.visible) return;
            
            // Connection line
            ctx.strokeStyle = `rgba(240, 240, 150, ${alpha * 0.4})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(caster.position.x, caster.position.y);
            ctx.lineTo(participant.position.x, participant.position.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Sync indicator
            const syncData = ultimate.data.synchronizedStrands.find((s: SynchronizedStrand) => s.id === participantId);
            if (syncData) {
                const syncStrength = syncData.syncStrength;
                ctx.fillStyle = `rgba(240, 240, 150, ${alpha * syncStrength})`;
                ctx.beginPath();
                ctx.arc(participant.position.x, participant.position.y, participant.radius + 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    // Draw information flows
    ultimate.data.informationFlows.forEach((flow: any) => {
        const x = flow.from.x + (flow.to.x - flow.from.x) * flow.progress;
        const y = flow.from.y + (flow.to.y - flow.from.y) * flow.progress;
        
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * (1 - flow.progress)})`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw coordination score
    if (ultimate.data.coordinationScore > 0 && caster) {
        const barWidth = 100;
        const barHeight = 10;
        const barX = caster.position.x - barWidth / 2;
        const barY = caster.position.y - caster.radius - 30;
        
        // Background
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Fill
        const fillColor = ultimate.data.coordinationScore > 0.8 ? '100, 255, 100' : '240, 240, 150';
        ctx.fillStyle = `rgba(${fillColor}, ${alpha * 0.8})`;
        ctx.fillRect(barX, barY, barWidth * ultimate.data.coordinationScore, barHeight);
        
        // Text
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SYNC: ${Math.round(ultimate.data.coordinationScore * 100)}%`, caster.position.x, barY - 5);
    }
    
    // Perfect sync flash
    if (ultimate.data.perfectSyncMoments % 30 < 5) {
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.2})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    ctx.restore();
};
