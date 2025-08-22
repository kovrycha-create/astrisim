
import type { StrandName, RelationshipMatrix, BoundaryType, AIAggression } from './types';
import { RelationshipLevel } from './types';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;
export const FIGHT_MODE_HEALTH = 1000;

export const STRAND_NAMES: StrandName[] = [
    "lotŭr", "Vitarîs", "丂anxxui", "Askänu", "Virtuō", "ℛadí", "Dræmin'",
    "Nectiv", "OptiX", "Memetic", "Elly", "Cozmik", "VOIDROT", "Ðethapart"
];

export const STRAND_CONFIG: Record<StrandName, { radius: number; color: [number, number, number] }> = {
    "lotŭr": { radius: 40, color: [100, 200, 255] },
    "Vitarîs": { radius: 45, color: [255, 100, 100] },
    "丂anxxui": { radius: 44, color: [180, 111, 255] },
    "Askänu": { radius: 44, color: [240, 240, 150] },
    "Virtuō": { radius: 46, color: [220, 220, 220] },
    "ℛadí": { radius: 43, color: [255, 255, 180] },
    "Dræmin'": { radius: 42, color: [200, 100, 255] },
    "Nectiv": { radius: 45, color: [255, 160, 0] },
    "OptiX": { radius: 48, color: [255, 50, 50] },
    "Memetic": { radius: 41, color: [255, 0, 255] },
    "Elly": { radius: 47, color: [0, 200, 0] },
    "Cozmik": { radius: 44, color: [180, 180, 255] },
    "VOIDROT": { radius: 49, color: [50, 50, 50] },
    "Ðethapart": { radius: 45, color: [80, 70, 100] }
};

export const ASSET_URLS: Record<StrandName, { url: string; file: string }> = {
  "lotŭr":   {"url": "https://defyx.icu/strands/lotur.png",   "file": "lotur.png"},
  "Vitarîs": {"url": "https://defyx.icu/strands/vitaris.png", "file": "vitaris.png"},
  "丂anxxui": {"url": "https://defyx.icu/strands/sanxxui.png", "file": "sanxxui.png"},
  "Askänu":  {"url": "https://defyx.icu/strands/askanu.png",  "file": "askanu.png"},
  "Virtuō":  {"url": "https://defyx.icu/strands/virtuo.png",  "file": "virtuo.png"},
  "ℛadí":    {"url": "https://defyx.icu/strands/radi.png",    "file": "radi.png"},
  "Dræmin'": {"url": "https://defyx.icu/strands/dr%C3%A6min'.png", "file": "draemin.png"},
  "Nectiv":  {"url": "https://defyx.icu/strands/nectiv.png",  "file": "nectiv.png"},
  "OptiX":     {"url": "https://defyx.icu/strands/optix.png",     "file": "optix.png"},
  "Memetic": {"url": "https://defyx.icu/strands/memetic.png", "file": "memetic.png"},
  "Elly":    {"url": "https://defyx.icu/strands/elly.png",    "file": "elly.png"},
  "Cozmik":  {"url": "https://defyx.icu/strands/cozmik.png",  "file": "cozmik.png"},
  "VOIDROT": {"url": "https://defyx.icu/strands/voidrot.png", "file": "voidrot.png"},
  "Ðethapart": {"url": "https://defyx.icu/strands/dethapart.png", "file": "dethapart.png"}
};

export const SPECIAL_EVENTS_CONFIG = {
    MIN_INTERVAL: 15 * 1000, // 15 seconds
    MAX_INTERVAL: 30 * 1000, // 30 seconds
    METEOR_SHOWER: {
        DURATION: 10 * 1000,
        COUNT: 50,
        SPEED: 15,
        PUSH_STRENGTH: 5,
    },
    COLOR_SHIFT: {
        DURATION: 12 * 1000,
        SPEED: 0.1, // degrees per frame
    },
    SPEED_BOOST_ZONE: {
        DURATION: 15 * 1000,
        RADIUS: 200,
        BOOST_FACTOR: 1.8,
    },
};

export const RELATIONSHIP_MODIFIERS = {
    // Collision interactions (per collision)
    COLLISION_HEAL_FRIEND: 0.001,
    COLLISION_DAMAGE_ENEMY: -0.0005,
    COLLISION_CRIT_ENEMY: -0.001,
    COLLISION_DAMAGE_NEUTRAL: -0.0001,
    // Ultimate interactions (per second)
    ULTIMATE_HEAL_ALLY: 0.005,
    ULTIMATE_DAMAGE_ENEMY: -0.002,
    ULTIMATE_SUPPORT_ALLY: 0.003,
    // Ultimate interactions (instant)
    ULTIMATE_BURST_DAMAGE_ENEMY: -0.05,
};

export const MOOD_CONFIG = {
    DURATION: 15 * 1000, // 15 seconds default duration
    AGITATED: {
        JITTER: 0.1,
    },
    PLAYFUL: {
        SPEED_MOD: 1.1,
    },
};

export const ANOMALY_CONFIG = {
    STARDUST_MOTE: {
        SPAWN_CHANCE: 0.001, // per frame
        MAX_COUNT: 5,
        RADIUS: 15,
        ULT_CHARGE_GAIN: 25,
        SPEED_BOOST: {
            DURATION: 5000, // 5 seconds in ms
            FACTOR: 1.4,
            RADIUS: 150,
        },
    },
    WHISPERING_CRYSTAL: {
        SPAWN_CHANCE: 0.0001, // very rare
        MAX_COUNT: 1,
        RADIUS: 25,
    },
};

const { Acquaintance, Friend, BestFriend, Ally, MortalEnemy } = RelationshipLevel;

export const RELATIONSHIP_MATRIX: RelationshipMatrix = {
    "lotŭr": { "Vitarîs": Ally, "丂anxxui": Friend, "Askänu": Ally, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Ally, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Vitarîs": { "lotŭr": Ally, "丂anxxui": Friend, "Askänu": Ally, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Ally, "VOIDROT": MortalEnemy, "Ðethapart": MortalEnemy },
    "丂anxxui": { "lotŭr": Friend, "Vitarîs": Friend, "Askänu": Friend, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Acquaintance, "OptiX": Acquaintance, "Memetic": Friend, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Askänu": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Friend, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Virtuō": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Ally, "Askänu": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Ally },
    "ℛadí": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Ally, "Askänu": Ally, "Virtuō": Ally, "Dræmin'": BestFriend, "Nectiv": Friend, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Dræmin'": { "lotŭr": Acquaintance, "Vitarîs": Acquaintance, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": BestFriend, "Nectiv": Acquaintance, "OptiX": Acquaintance, "Memetic": Friend, "Elly": Acquaintance, "Cozmik": Ally, "VOIDROT": Acquaintance, "Ðethapart": Friend },
    "Nectiv": { "lotŭr": Friend, "Vitarîs": Friend, "丂anxxui": Acquaintance, "Askänu": Friend, "Virtuō": Friend, "ℛadí": Friend, "Dræmin'": Acquaintance, "OptiX": Acquaintance, "Memetic": BestFriend, "Elly": Acquaintance, "Cozmik": Friend, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "OptiX": { "lotŭr": Acquaintance, "Vitarîs": Acquaintance, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": Acquaintance, "Dræmin'": Acquaintance, "Nectiv": Acquaintance, "Memetic": Acquaintance, "Elly": Acquaintance, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Memetic": { "lotŭr": Acquaintance, "Vitarîs": Acquaintance, "丂anxxui": Friend, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": Acquaintance, "Dræmin'": Friend, "Nectiv": BestFriend, "OptiX": Acquaintance, "Elly": Acquaintance, "Cozmik": Acquaintance, "VOIDROT": Ally, "Ðethapart": Acquaintance },
    "Elly": { "lotŭr": Friend, "Vitarîs": Friend, "丂anxxui": Friend, "Askänu": Friend, "Virtuō": Friend, "ℛadí": Friend, "Dræmin'": Acquaintance, "Nectiv": Acquaintance, "OptiX": Acquaintance, "Memetic": Acquaintance, "Cozmik": BestFriend, "VOIDROT": MortalEnemy, "Ðethapart": Friend },
    "Cozmik": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": Acquaintance, "Dræmin'": Ally, "Nectiv": Friend, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": BestFriend, "VOIDROT": Acquaintance, "Ðethapart": Acquaintance },
    "VOIDROT": { "lotŭr": MortalEnemy, "Vitarîs": MortalEnemy, "丂anxxui": MortalEnemy, "Askänu": MortalEnemy, "Virtuō": MortalEnemy, "ℛadí": MortalEnemy, "Dræmin'": Acquaintance, "Nectiv": MortalEnemy, "OptiX": MortalEnemy, "Memetic": Ally, "Elly": MortalEnemy, "Cozmik": Acquaintance, "Ðethapart": MortalEnemy },
    "Ðethapart": { "lotŭr": Acquaintance, "Vitarîs": MortalEnemy, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Ally, "ℛadí": Acquaintance, "Dræmin'": Friend, "Nectiv": Acquaintance, "OptiX": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy }
};

export const PLAYER_CONFIG = {
    AETHER_MAX: 100,
    AETHER_REGEN_RATE: 5, // units per second
    REPEL: {
        RADIUS: 150,
        STRENGTH: 0.05,
        AETHER_COST_PER_MOVE: 0.05, // Aether drained per frame of mouse movement
    },
    CURRENT: {
        RADIUS: 180,
        STRENGTH: 0.08, // How strongly it pushes strands
        AETHER_COST_PER_MOVE: 0.07,
    },
    GRAVITY_ANCHOR: {
        RADIUS: 300,
        STRENGTH: 0.12,
        AETHER_DRAIN_RATE: 35, // Aether per second
    },
    FAVOR: {
        COST: 30,
        DURATION: 10, // seconds
        CHARGE_BONUS: 2, // bonus ultimate charge per second
    },
    WALL_OF_LIGHT: {
        AETHER_COST_PER_PIXEL: 0.1,
        DURATION: 8, // seconds
        MIN_LENGTH: 50,
    },
    STASIS: {
        COST: 50,
        DURATION: 3, // seconds
    },
    BURDEN: {
        COST: 40,
        DURATION: 12, // seconds
        DAMAGE_MULTIPLIER: 1.3, // 30% increased damage
    },
};

export const BASE_ULTIMATE_CHARGE_RATE = 2.5; // points per second

export const STRAND_ULTIMATE_STATS: Record<StrandName, { maxCharge: number; cooldown: number }> = {
    "lotŭr":   { maxCharge: 100, cooldown: 15 },
    "Vitarîs": { maxCharge: 100, cooldown: 12 },
    "丂anxxui": { maxCharge: 100, cooldown: 15 },
    "Askänu":  { maxCharge: 100, cooldown: 15 },
    "Virtuō":  { maxCharge: 120, cooldown: 25 },
    "ℛadí":    { maxCharge: 90,  cooldown: 8 },
    "Dræmin'": { maxCharge: 110, cooldown: 18 },
    "Nectiv":  { maxCharge: 100, cooldown: 15 },
    "OptiX":     { maxCharge: 110, cooldown: 20 },
    "Memetic": { maxCharge: 120, cooldown: 22 },
    "Elly":    { maxCharge: 120, cooldown: 20 },
    "Cozmik":  { maxCharge: 120, cooldown: 20 },
    "VOIDROT": { maxCharge: 110, cooldown: 18 },
    "Ðethapart": { maxCharge: 110, cooldown: 16 },
};

export const ULTIMATE_CONFIG: Record<StrandName, { NAME: string, [key: string]: any }> = {
    "lotŭr": {
        NAME: 'TRANQUILITY_NEXUS',
        DURATION: 8, // seconds
        RADIUS: 450, // pixels
        HEAL_PER_SECOND: 25, // flat heal
        SLOW_FACTOR: 0.4, // reduces speed to 40%
    },
    "Vitarîs": {
        NAME: 'VITAL_BLOOM',
        DURATION: 10,
        RADIUS: 400,
        SPEED_BOOST: 1.5,
        SELF_SPEED_BOOST: 2.0,
        CHARGE_BOOST_RATE: 5, // points per second
        HEAL_PER_SECOND: 10,
    },
    "Elly": {
        NAME: 'FISSURE',
        DURATION: 12,
        MAX_RADIUS: 350,
        DAMAGE_PER_SECOND: 40,
        SLOW_FACTOR: 0.3,
    },
    "Cozmik": {
        NAME: 'GRAVITATIONAL_COLLAPSE',
        PULL_DURATION: 3,
        PUSH_DURATION: 0.5,
        RADIUS: 500,
        PULL_STRENGTH: 0.2,
        PUSH_STRENGTH: 20,
        PUSH_DAMAGE: 250,
    },
    "VOIDROT": {
        NAME: 'CORRUPTION',
        DURATION: 10,
        DAMAGE_PER_SECOND: 15,
        HEAL_BLOCK: true,
    },
    "ℛadí": {
        NAME: 'REVELATION_FLARE',
        DURATION: 1.5, // Visual effect duration
        RADIUS: 600,
        DAMAGE: 150,
        CHARGE_GAIN: 35,
    },
    "Virtuō": {
        NAME: 'EQUILIBRIUM_BURST',
        DURATION: 1.5, // Visual effect duration
    },
    "OptiX": {
        NAME: 'DUEL_ARENA',
        DURATION: 10, // seconds
        RADIUS: 300, // pixels
        DAMAGE_BONUS: 1.5, // 50% extra damage
    },
    "丂anxxui": { 
        NAME: 'EMPATHIC_RESONANCE',
        DURATION: 10, // seconds
    },
    "Askänu": { 
        NAME: 'BEACON_OF_KNOWLEDGE',
        DURATION: 8,
        RADIUS: 400,
        SYNC_STRENGTH: 0.5,
    },
    "Dræmin'": {
        NAME: 'DREAM_WEAVE',
        DURATION: 7,
        SWAP_DELAY: 3,
        DAMAGE_PER_SECOND: 10,
    },
    "Nectiv": {
        NAME: 'UNITY_PULSE',
        DURATION: 6,
        RADIUS: 350,
        PULL_STRENGTH: 0.08,
        DAMAGE_PER_SECOND: 20,
    },
    "Memetic": {
        NAME: 'ECHO_STORM',
        DURATION: 8,
        DAMAGE_CHANCE: 0.05, // chance per frame per strand
        ECHO_RADIUS: 100,
        DAMAGE_AMOUNT: 15,
    },
    "Ðethapart": {
        NAME: 'DECREE_OF_NULL',
        DURATION: 10, // Mark duration
        RADIUS: 700, // Cast range
        DAMAGE: 100, // Initial hit damage
        EXECUTE_THRESHOLD: 0.2, // 20% health
    }
};

export const COLLISION_CONFIG = {
    BASE_DAMAGE: 10,
    BASE_HEAL: 8,
    NEUTRAL_DAMAGE_MULTIPLIER: 0.2,
    CRIT_CHANCE: 0.15,
    CRIT_MULTIPLIER: 1.75,
    STORED_POWER_BONUS: 0.01, // 1% bonus per point of stored power
    VELOCITY_FACTOR: 2.5, // Multiplier for collision velocity
};

export const CREATURE_CONFIG = {
    'NIT_LINE': {
        stages: {
            1: {
                name: 'Nit',
                imageUrl: 'https://astrisim.neocities.org/creatures/nit/nit_evolve-1.png',
                hp: 800,
                speed: 3.0,
                acceleration: 0.025, // 3 / (2 * 60)
                collisionDamageMultiplier: 0.5,
                radius: 68,
                size: { width: 135, height: 135 },
                abilities: [{ name: 'Whisper Buffer', cooldownDuration: 6000 }],
                evolutionThresholdTime: 20,
                evolutionThresholdDebuffs: 3,
                movement: {
                    comfortDistance: { min: 300, max: 480 }, // 5-8 units * 60 pixels/unit (estimated)
                    flinchDashSpeed: 1.5,
                },
            },
            2: {
                name: 'Nitelink',
                imageUrl: 'https://astrisim.neocities.org/creatures/nit/nit_evolve-2.png',
                hp: 1200,
                speed: 4.0,
                acceleration: 0.083, // 4 / (0.8 * 60)
                collisionDamageMultiplier: 1.0,
                radius: 79,
                size: { width: 158, height: 158 },
                abilities: [
                    { name: 'Sympathy Thread', cooldownDuration: 7000 },
                    { name: 'Position Swap', cooldownDuration: 10000 },
                ],
                evolutionThresholdTime: 50, // total time from start
                evolutionThresholdTethers: 5,
            },
            3: {
                name: 'Nitrift',
                imageUrl: 'https://astrisim.neocities.org/creatures/nit/nit_evolve-3.png',
                hp: 1800,
                speed: 5.0,
                acceleration: 0.208, // 5 / (0.4 * 60)
                collisionDamageMultiplier: 1.5,
                radius: 90,
                size: { width: 180, height: 180 },
                abilities: [
                    { name: 'Fault Line', cooldownDuration: 5000 },
                    { name: 'Shatter Point', cooldownDuration: 4000 },
                ],
                evolutionThresholdTime: 100, // total time from start
                evolutionThresholdFractures: 6,
            },
            4: {
                name: 'Nit Prime',
                imageUrl: 'https://astrisim.neocities.org/creatures/nit/nit_evolve-4.png',
                hp: 2500,
                speed: 4.5,
                acceleration: 999, // Instant
                collisionDamageMultiplier: 2.0,
                radius: 101,
                size: { width: 203, height: 203 },
                abilities: [
                     { name: 'Echo Pattern', cooldownDuration: 3000 },
                     { name: 'Temporal Shear', cooldownDuration: 8000 },
                ],
            },
        }
    },
    'BLOOM_WILT': {
        pressureSwitchCooldown: 15000,
        bloom: {
            name: 'Bloom',
            imageUrl: 'https://astrisim.neocities.org/creatures/lifendeath/life.png',
            hp: 1600,
            speed: 3.0,
            acceleration: 0.0167, // 3 / (3 * 60)
            collisionDamageMultiplier: 0.7,
            radius: 90,
            size: { width: 191, height: 191 },
            abilities: [
                { name: 'Verdant Pulse', cooldownDuration: 5000 },
                { name: 'Overgrowth Shot', cooldownDuration: 6000 },
                { name: 'Life Fountain', cooldownDuration: 10000 },
            ],
        },
        wilt: {
            name: 'Wilt',
            imageUrl: 'https://astrisim.neocities.org/creatures/lifendeath/death.png',
            hp: 1600,
            speed: 5.5,
            acceleration: 0.183, // 5.5 / (0.5 * 60)
            collisionDamageMultiplier: 1.8,
            radius: 90,
            size: { width: 191, height: 191 },
            abilities: [
                { name: 'Entropy Touch', cooldownDuration: 5000 },
                { name: 'Hollow Lance', cooldownDuration: 7000 },
                { name: 'Inevitable End', cooldownDuration: 12000 },
            ],
        }
    }
};

// Strand: { damageFactor, healFactor, storedPowerRate }
// damage/heal factors are multipliers on base collision effect.
// storedPowerRate is points per second.
export const STRAND_COMBAT_STATS: Record<StrandName, { collisionDamageFactor: number, collisionHealFactor: number, storedPowerRate: number }> = {
    "lotŭr":   { collisionDamageFactor: 0.5, collisionHealFactor: 1.8, storedPowerRate: 3.5 },
    "Vitarîs": { collisionDamageFactor: 1.0, collisionHealFactor: 2.0, storedPowerRate: 2.5 },
    "丂anxxui": { collisionDamageFactor: 0.9, collisionHealFactor: 1.2, storedPowerRate: 2.0 },
    "Askänu":  { collisionDamageFactor: 0.7, collisionHealFactor: 0.7, storedPowerRate: 3.0 },
    "Virtuō":  { collisionDamageFactor: 1.1, collisionHealFactor: 1.1, storedPowerRate: 4.0 },
    "ℛadí":    { collisionDamageFactor: 1.5, collisionHealFactor: 0.5, storedPowerRate: 1.5 },
    "Dræmin'": { collisionDamageFactor: 1.0, collisionHealFactor: 1.0, storedPowerRate: 2.0 },
    "Nectiv":  { collisionDamageFactor: 1.2, collisionHealFactor: 1.0, storedPowerRate: 2.0 },
    "OptiX":     { collisionDamageFactor: 2.2, collisionHealFactor: 0.1, storedPowerRate: 1.0 },
    "Memetic": { collisionDamageFactor: 0.8, collisionHealFactor: 0.8, storedPowerRate: 2.5 },
    "Elly":    { collisionDamageFactor: 1.0, collisionHealFactor: 1.0, storedPowerRate: 4.5 },
    "Cozmik":  { collisionDamageFactor: 1.8, collisionHealFactor: 0.2, storedPowerRate: 1.5 },
    "VOIDROT": { collisionDamageFactor: 2.5, collisionHealFactor: 0.1, storedPowerRate: 1.0 },
    "Ðethapart": { collisionDamageFactor: 1.9, collisionHealFactor: 0.1, storedPowerRate: 3.5 },
};

export const LOW_HP_THRESHOLDS: Record<StrandName, number> = {
    "lotŭr": 0.25,   // Defensive, triggers early
    "Vitarîs": 0.20, // Flees to survive
    "丂anxxui": 0.22, // Seeks allies for protection
    "Askänu": 0.18,  // Cautious, tries to avoid combat
    "Virtuō": 0.15,  // Balanced, desperate power
    "ℛadí": 0.15,    // Tries for a final burst of power
    "Dræmin'": 0.20, // Becomes erratic and unpredictable
    "Nectiv": 0.22,  // Huddles with friends
    "OptiX": 0.15,     // Berserker, fights harder
    "Memetic": 0.18, // Becomes chaotic
    "Elly": 0.20,    // Takes a defensive stance
    "Cozmik": 0.15,  // Desperate gravitational pull
    "VOIDROT": 0.10, // Reckless aggression
    "Ðethapart": 0.10, // Goes for a final kill
};

export const SIMULATION_DEFAULTS = {
    globalSpeed: 1.0,
    bounciness: 1.0,
    friction: 0.99,
    boundaryType: 'BOUNCE' as BoundaryType,
    combatStatMultiplier: 1.0,
    ultimateChargeMultiplier: 1.0,
    aiAggression: 'NORMAL' as AIAggression,
    disableLowHpBehaviors: false,
};
