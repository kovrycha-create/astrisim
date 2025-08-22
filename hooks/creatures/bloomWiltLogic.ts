import type { Creature, ActiveJobEffect, CombatTextEffect, Debuff, BloomWiltStance } from '../../types';
import { CREATURE_CONFIG } from '../../constants';

const config = CREATURE_CONFIG.BLOOM_WILT;

const generatePressure = (creature: Creature, amount: number) => {
    if (creature.stance === 'BLOOM') {
        creature.state.verdantPressure = Math.min(100, creature.state.verdantPressure + amount);
    } else {
        creature.state.hollowPressure = Math.min(100, creature.state.hollowPressure + amount);
    }
};

const switchStance = (creature: Creature, now: number, forced: boolean) => {
    const oldStance = creature.stance!;
    const newStance: BloomWiltStance = oldStance === 'BLOOM' ? 'WILT' : 'BLOOM';
    creature.stance = newStance;
    creature.state.lastStanceSwitch = now;
    
    let newImageUrl: string;
    if (newStance === 'WILT') {
        const wiltConfig = config.wilt;
        creature.speed = wiltConfig.speed;
        creature.abilities = wiltConfig.abilities.map(a => ({...a, lastUsed: 0}));
        newImageUrl = wiltConfig.imageUrl;
        creature.state.name = wiltConfig.name;
    } else {
        const bloomConfig = config.bloom;
        creature.speed = bloomConfig.speed;
        creature.abilities = bloomConfig.abilities.map(a => ({...a, lastUsed: 0}));
        newImageUrl = bloomConfig.imageUrl;
        creature.state.name = bloomConfig.name;
    }
    creature.imageUrl = newImageUrl;

    const burstType = oldStance === 'BLOOM' ? 'Life→Death' : 'Death→Life';
    
    const newEffect: ActiveJobEffect = {
        id: now,
        type: 'EQUINOX_BURST',
        position: creature.position,
        life: 1000,
        maxLife: 1000,
        radius: 0,
        maxRadius: 300,
        data: { from: oldStance, forced }
    };

    if (!forced) {
        if (oldStance === 'BLOOM') creature.state.verdantPressure = 0;
        else creature.state.hollowPressure = 0;
    } else {
        creature.state.verdantPressure = 0;
        creature.state.hollowPressure = 0;
    }

    return { newEffect, burstType, newImageUrl, forced };
};

export const updateBloomWilt = (creature: Creature, allCreatures: Creature[], now: number) => {
    let newEffects: ActiveJobEffect[] = [];
    let newCombatText: CombatTextEffect[] = [];
    let newLogs: string[] = [];
    let stanceSwitched = false;
    let stanceSwitchResult: { newEffect: ActiveJobEffect, burstType: string, newImageUrl: string, forced: boolean } | null = null;

    // Pressure decay
    creature.state.verdantPressure = Math.max(0, creature.state.verdantPressure - 0.05);
    creature.state.hollowPressure = Math.max(0, creature.state.hollowPressure - 0.05);

    // Stance Switching Logic
    const pressure = creature.stance === 'BLOOM' ? creature.state.verdantPressure : creature.state.hollowPressure;
    
    // Forced switch
    if (pressure >= 100) {
        stanceSwitchResult = switchStance(creature, now, true);
    }
    // Voluntary switch AI
    else if (pressure > 50 && now > creature.state.lastStanceSwitch + config.pressureSwitchCooldown) {
         stanceSwitchResult = switchStance(creature, now, false);
    }

    if (stanceSwitchResult) {
        newEffects.push(stanceSwitchResult.newEffect);
        newLogs.push(`${creature.type} ${stanceSwitchResult.forced ? 'has a forced' : 'voluntarily triggers'} Equinox Burst! (${stanceSwitchResult.burstType})`);
        stanceSwitched = true;
    }

    // Ability Usage AI
    if (!stanceSwitched) {
        if (creature.stance === 'BLOOM') {
            const pulseAbility = creature.abilities.find(a => a.name === 'Verdant Pulse')!;
            if (now > pulseAbility.lastUsed + pulseAbility.cooldownDuration && creature.health < creature.maxHealth * 0.8) {
                pulseAbility.lastUsed = now;
                generatePressure(creature, 20);
                creature.health = Math.min(creature.maxHealth, creature.health + creature.maxHealth * 0.15);
                newEffects.push({
                    id: now, type: 'VERDANT_PULSE', position: creature.position, life: 1000, maxLife: 1000,
                    radius: 0, maxRadius: 250, data: { sourceId: creature.id }
                });
            }
        } else { // WILT
            const touchAbility = creature.abilities.find(a => a.name === 'Entropy Touch')!;
             if (now > touchAbility.lastUsed + touchAbility.cooldownDuration) {
                const nearestEnemy = allCreatures.find(c => c.team !== creature.team && !c.isDefeated);
                 if (nearestEnemy && Math.hypot(creature.position.x - nearestEnemy.position.x, creature.position.y - nearestEnemy.position.y) < 200) {
                     touchAbility.lastUsed = now;
                     generatePressure(creature, 20);
                     creature.state.entropyTouchCharges = 3;
                     creature.state.entropyTouchEndTime = now + 5000;
                 }
             }
        }
    }
    
    // Process Decay
     allCreatures.forEach(c => {
        c.debuffs = c.debuffs.filter(d => {
            if (d.type === 'DECAY' && now > (d.lastTick || 0) + 1000) {
                const damage = c.maxHealth * 0.02 * d.stacks;
                c.health = Math.max(0, c.health - damage);
                newCombatText.push({
                    id: now + Math.random(), position: c.position, text: `${Math.round(damage)}`,
                    color: 'purple', life: 1000, maxLife: 1000, velocity: {x: 0, y: -0.5}
                });
                d.lastTick = now;
            }
            return d.endTime > now;
        });
    });

    return { newEffects, newCombatText, newLogs, newImageUrl: stanceSwitchResult?.newImageUrl };
};
