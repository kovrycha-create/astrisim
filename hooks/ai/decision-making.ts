import type { Strand, ActiveUltimate, GlobalEffect, AIAggression } from '../../types';
import { ULTIMATE_CONFIG, RELATIONSHIP_MATRIX } from '../../constants';
import { RelationshipLevel } from '../../types';

type DecisionMaker = (
    caster: Strand,
    allStrands: Strand[],
    activeUltimates: ActiveUltimate[],
    globalEffects: GlobalEffect[],
    aiAggression: AIAggression
) => boolean;

// --- Helper Functions ---

const getLivingAllies = (caster: Strand, allStrands: Strand[]): Strand[] => {
    return allStrands.filter(s => {
        if (s.id === caster.id || !s.visible || s.isDefeated) return false;
        const rel = RELATIONSHIP_MATRIX[caster.name]?.[s.name] ?? RelationshipLevel.Acquaintance;
        return rel >= RelationshipLevel.Friend;
    });
};

const getLivingEnemies = (caster: Strand, allStrands: Strand[]): Strand[] => {
    return allStrands.filter(s => {
        if (s.id === caster.id || !s.visible || s.isDefeated) return false;
        const rel = RELATIONSHIP_MATRIX[caster.name]?.[s.name] ?? RelationshipLevel.Acquaintance;
        return rel <= RelationshipLevel.Acquaintance;
    });
};

// --- Individual AI Logic ---

const shouldUseTranquilityNexus: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (activeUltimates.some(ult => ult.type === 'TRANQUILITY_NEXUS')) {
        return false; // Don't stack this ultimate.
    }
    const config = ULTIMATE_CONFIG['lotŭr'];
    const allies = getLivingAllies(caster, allStrands);
    const alliesInRange = allies.filter(ally =>
        Math.hypot(ally.position.x - caster.position.x, ally.position.y - caster.position.y) < config.RADIUS
    );

    const woundedAllies = alliesInRange.filter(ally => ally.health / ally.maxHealth < 0.6);
    
    const threshold = aiAggression === 'AGGRESSIVE' ? 1 : (aiAggression === 'PASSIVE' ? 3 : 2);
    return woundedAllies.length >= threshold;
};

const shouldUseVitalBloom: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (activeUltimates.some(ult => ult.type === 'VITAL_BLOOM')) {
        return false;
    }
    const config = ULTIMATE_CONFIG['Vitarîs'];
    const allies = getLivingAllies(caster, allStrands);
    const alliesInRange = allies.filter(ally =>
        Math.hypot(ally.position.x - caster.position.x, ally.position.y - caster.position.y) < config.RADIUS
    );
    const threshold = aiAggression === 'AGGRESSIVE' ? 1 : (aiAggression === 'PASSIVE' ? 3 : 2);
    return alliesInRange.length >= threshold;
};

const shouldUseFissure: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (activeUltimates.some(ult => ult.type === 'FISSURE')) {
        return false;
    }
    const config = ULTIMATE_CONFIG['Elly'];
    const enemies = getLivingEnemies(caster, allStrands);
    const enemiesInRange = enemies.filter(enemy =>
        Math.hypot(enemy.position.x - caster.position.x, enemy.position.y - caster.position.y) < config.MAX_RADIUS
    );
    const threshold = aiAggression === 'AGGRESSIVE' ? 1 : (aiAggression === 'PASSIVE' ? 3 : 2);
    return enemiesInRange.length >= threshold;
};

const shouldUseGravitationalCollapse: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (activeUltimates.some(ult => ult.type === 'GRAVITATIONAL_COLLAPSE')) {
        return false;
    }
    const config = ULTIMATE_CONFIG['Cozmik'];
    const enemies = getLivingEnemies(caster, allStrands);
    const enemiesInRange = enemies.filter(enemy =>
        Math.hypot(enemy.position.x - caster.position.x, enemy.position.y - caster.position.y) < config.RADIUS
    );

    const threshold = aiAggression === 'AGGRESSIVE' ? 2 : (aiAggression === 'PASSIVE' ? 4 : 3);
    if (enemiesInRange.length < threshold) {
        return false;
    }

    // Check for clustering: simple average distance check
    let totalDist = 0;
    let pairs = 0;
    for (let i = 0; i < enemiesInRange.length; i++) {
        for (let j = i + 1; j < enemiesInRange.length; j++) {
            totalDist += Math.hypot(
                enemiesInRange[i].position.x - enemiesInRange[j].position.x,
                enemiesInRange[i].position.y - enemiesInRange[j].position.y
            );
            pairs++;
        }
    }
    const avgDist = pairs > 0 ? totalDist / pairs : 0;
    return avgDist < config.RADIUS * 0.75; // They are in a reasonable cluster
};

const shouldUseCorruption: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (globalEffects.some(effect => effect.type === 'CORRUPTION')) {
        return false;
    }
    const enemies = getLivingEnemies(caster, allStrands);
    
    const hasEnemyHealer = enemies.some(enemy => enemy.name === 'lotŭr' || enemy.name === 'Vitarîs');
    const healthThreshold = aiAggression === 'AGGRESSIVE' ? 0.95 : (aiAggression === 'PASSIVE' ? 0.7 : 0.8);
    const targetCount = aiAggression === 'AGGRESSIVE' ? 1 : 2;

    const damagedEnemies = enemies.filter(enemy => enemy.health / enemy.maxHealth < healthThreshold);
    
    // Aggressive AI will use it more freely
    if (aiAggression === 'AGGRESSIVE') {
        return damagedEnemies.length >= targetCount;
    }
    
    // Normal and Passive require an enemy healer to be present
    return hasEnemyHealer && damagedEnemies.length >= targetCount;
};

const shouldUseRevelationFlare: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    const config = ULTIMATE_CONFIG['ℛadí'];
    const allies = getLivingAllies(caster, allStrands);
    const enemies = getLivingEnemies(caster, allStrands);

    const enemyInRange = enemies.some(enemy => 
        Math.hypot(enemy.position.x - caster.position.x, enemy.position.y - caster.position.y) < config.RADIUS
    );
    if (!enemyInRange) {
        return false;
    }
    
    const chargeThreshold = aiAggression === 'AGGRESSIVE' ? 0.8 : (aiAggression === 'PASSIVE' ? 0.4 : 0.6);
    const alliesNeedingCharge = allies.filter(ally => ally.ultimateCharge / ally.maxUltimateCharge < chargeThreshold);
    
    const allyCountThreshold = aiAggression === 'AGGRESSIVE' ? 1 : 2;
    return alliesNeedingCharge.length >= allyCountThreshold;
};

const shouldUseEquilibriumBurst: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (globalEffects.some(effect => effect.type === 'EQUILIBRIUM_BURST')) {
        return false;
    }
    
    const allies = getLivingAllies(caster, allStrands);
    allies.push(caster);
    const enemies = getLivingEnemies(caster, allStrands);
    
    if (allies.length === 0 || enemies.length === 0) {
        return false;
    }

    const allyTotalHealth = allies.reduce((sum, s) => sum + (s.health / s.maxHealth), 0);
    const enemyTotalHealth = enemies.reduce((sum, s) => sum + (s.health / s.maxHealth), 0);
    
    const allyAvgHealthPercent = allyTotalHealth / allies.length;
    const enemyAvgHealthPercent = enemyTotalHealth / enemies.length;

    const healthDisadvantageRatio = aiAggression === 'AGGRESSIVE' ? 0.85 : (aiAggression === 'PASSIVE' ? 0.6 : 0.7);
    const casterHealthThreshold = aiAggression === 'AGGRESSIVE' ? 1.0 : (aiAggression === 'PASSIVE' ? 0.8 : 0.9);

    return allyAvgHealthPercent < (enemyAvgHealthPercent * healthDisadvantageRatio) && (caster.health / caster.maxHealth < casterHealthThreshold);
};

const shouldUseDuelArena: DecisionMaker = (caster, allStrands, activeUltimates, globalEffects, aiAggression) => {
    if (activeUltimates.some(ult => ult.type === 'DUEL_ARENA')) {
        return false;
    }
    const config = ULTIMATE_CONFIG['OptiX'];
    
    const casterHealthThreshold = aiAggression === 'AGGRESSIVE' ? 0.3 : (aiAggression === 'PASSIVE' ? 0.8 : 0.6);
    if (caster.health / caster.maxHealth < casterHealthThreshold) {
        return false;
    }

    const enemies = getLivingEnemies(caster, allStrands);
    let bestTarget: Strand | null = null;
    let minDistance = Infinity;

    const targetHealthThreshold = aiAggression === 'AGGRESSIVE' ? 1.0 : (aiAggression === 'PASSIVE' ? 0.7 : 0.9);

    enemies.forEach(enemy => {
        if (enemy.health / enemy.maxHealth < targetHealthThreshold) {
            const dist = Math.hypot(enemy.position.x - caster.position.x, enemy.position.y - caster.position.y);
            if (dist < minDistance) {
                minDistance = dist;
                bestTarget = enemy;
            }
        }
    });
    
    return bestTarget !== null && minDistance < config.RADIUS * 1.5;
};


// --- Decision Maker Dispatcher ---

export const ultimateDecisionMakers: Partial<Record<Strand['name'], DecisionMaker>> = {
    "lotŭr": shouldUseTranquilityNexus,
    "Vitarîs": shouldUseVitalBloom,
    "Elly": shouldUseFissure,
    "Cozmik": shouldUseGravitationalCollapse,
    "VOIDROT": shouldUseCorruption,
    "ℛadí": shouldUseRevelationFlare,
    "Virtuō": shouldUseEquilibriumBurst,
    "OptiX": shouldUseDuelArena,
};
