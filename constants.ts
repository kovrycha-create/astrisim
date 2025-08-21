import type { StrandName, RelationshipMatrix } from './types';
import { RelationshipLevel } from './types';

export const SCREEN_WIDTH = 1920;
export const SCREEN_HEIGHT = 1080;
export const FIGHT_MODE_HEALTH = 1000;

export const STRAND_NAMES: StrandName[] = [
    "lotŭr", "Vitarîs", "丂anxxui", "Askänu", "Virtuō", "ℛadí", "Dræmin'",
    "Nectiv", "DxD", "Memetic", "Elly", "Cozmik", "VOIDROT", "Ðethapart"
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
    "DxD": { radius: 48, color: [255, 50, 50] },
    "Memetic": { radius: 41, color: [255, 0, 255] },
    "Elly": { radius: 47, color: [0, 200, 0] },
    "Cozmik": { radius: 44, color: [180, 180, 255] },
    "VOIDROT": { radius: 49, color: [50, 50, 50] },
    "Ðethapart": { radius: 45, color: [80, 70, 100] }
};

export const ASSET_URLS: Record<StrandName, { url: string; file: string }> = {
  "lotŭr":   {"url": "https://defyx.icu/strands/lotur-mr.png",   "file": "lotur.png"},
  "Vitarîs": {"url": "https://defyx.icu/strands/vitaris-mr.png", "file": "vitaris.png"},
  "丂anxxui": {"url": "https://defyx.icu/strands/sanxxui-mr.png", "file": "sanxxui.png"},
  "Askänu":  {"url": "https://defyx.icu/strands/askanu-mr.png",  "file": "askanu.png"},
  "Virtuō":  {"url": "https://defyx.icu/strands/virtuo-mr.png",  "file": "virtuo.png"},
  "ℛadí":    {"url": "https://defyx.icu/strands/rad-mr.png",    "file": "radi.png"},
  "Dræmin'": {"url": "https://defyx.icu/strands/dr%C3%A6min'-mr.png", "file": "draemin.png"},
  "Nectiv":  {"url": "https://defyx.icu/strands/nectiv-mr.png",  "file": "nectiv.png"},
  "DxD":     {"url": "https://defyx.icu/strands/foro4-mr.png",     "file": "dxd.png"},
  "Memetic": {"url": "https://defyx.icu/strands/memetic-mr.png", "file": "memetic.png"},
  "Elly":    {"url": "https://defyx.icu/strands/elly-mr.png",    "file": "elly.png"},
  "Cozmik":  {"url": "https://defyx.icu/strands/cozmik-mr.png",  "file": "cozmik.png"},
  "VOIDROT": {"url": "https://defyx.icu/strands/voidrot-mr.png", "file": "voidrot.png"},
  "Ðethapart": {"url": "https://defyx.icu/strands/dethapart-mr.png", "file": "dethapart.png"}
};

export const ULTIMATE_COOLDOWN = 45; // seconds
export const AI_ULTIMATE_CHANCE = 0.0005; // Chance per frame for an AI to use a ready ultimate

export const ULTIMATE_CHARGE_VALUES = {
    // Passive gains (per frame, adjusted by normalizedDelta)
    PASSIVE_SLOW: 0.02,  // For Elly
    PASSIVE_CALM: 0.03,  // For lotur
    PASSIVE_RANDOM_CHUNK: 20, // For Draemin'
    PASSIVE_RANDOM_CHANCE: 0.001,
    
    // State-based gains (per frame)
    NEAR_EDGE: 0.05, // For VOIDROT
    NEAR_FRIEND: 0.005, // For Sanxxui
    HIGH_SPEED: 0.04, // For Vitaris
    NEAR_ACTIVE_STRAND: 0.06, // For Askanu

    // Event-based gains (on occurrence)
    WALL_BOUNCE: 2.5,
    ANY_COLLISION: 1.5,
    FRIEND_COLLISION: 4.0,
    ENEMY_COLLISION: 5.0,
    ULTIMATE_USED_NEARBY: 15, // For Radi
    ULTIMATE_ENDED: 20, // For Dethapart
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

export const ULTIMATE_CONFIG = {
    'Elly': { // Fissure
        DURATION: 8,
        MAX_RADIUS: 300,
        SLOW_FACTOR: 0.4,
        DAMAGE_PER_SECOND: 50,
    },
    'Vitarîs': { // Vital Bloom
        DURATION: 7,
        RADIUS: 250,
        SPEED_BOOST: 1.5,
        CHARGE_BOOST_RATE: ULTIMATE_CHARGE_VALUES.PASSIVE_SLOW * 25,
        HEAL_PER_SECOND: 40,
    },
    'ℛadí': { // Revelation Flare
        DURATION: 0.5,
        RADIUS: 400,
        CHARGE_GAIN: 35,
        DAMAGE: 150,
    },
    'Cozmik': { // Gravitational Collapse
        PULL_DURATION: 3,
        PUSH_DURATION: 1,
        RADIUS: 800,
        PULL_STRENGTH: 0.15,
        PUSH_STRENGTH: 15,
        PUSH_DAMAGE: 250,
    },
    'Virtuō': { // Equilibrium Burst
        DURATION: 1.0,
        HEAL_PERCENT: 0.15, // 15% of max health
    },
    'Memetic': { // Echo Storm
        DURATION: 4,
        DAMAGE_CHANCE: 0.02,
        DAMAGE_AMOUNT: 20,
    },
    'VOIDROT': { // Corruption
        DURATION: 12,
        DAMAGE_PER_SECOND: 15,
    },
    'lotŭr': { // Tranquility Nexus
        DURATION: 10,
        RADIUS: 280,
        SLOW_FACTOR: 0.6,
        HEAL_PER_SECOND: 25,
    },
    '丂anxxui': { // Empathic Resonance
        DURATION: 8,
    },
    'Askänu': { // Beacon of Knowledge
        DURATION: 7,
        RADIUS: 350,
        SYNC_STRENGTH: 0.05,
    },
    "Dræmin'": { // Dream Weave
        DURATION: 10,
        DAMAGE_PER_SECOND: 10,
    },
    'Nectiv': { // Unity Pulse
        DURATION: 6,
        RADIUS: 300,
        PULL_STRENGTH: 0.08,
        DAMAGE_PER_SECOND: 20,
    },
    'DxD': { // Duel Arena
        DURATION: 12,
        RADIUS: 250,
        DAMAGE_BONUS: 1.5, // 50% bonus damage
    },
    'Ðethapart': { // Decree of Null
        DURATION: 10, // Duration of the mark
        RADIUS: 450,
        DAMAGE: 100,
        EXECUTE_THRESHOLD: 0.15, // 15% health
    },
};

export const RELATIONSHIP_MODIFIERS = {
    // Ultimate interactions (per second of effect)
    ULTIMATE_HEAL_ALLY: 0.005,
    ULTIMATE_SUPPORT_ALLY: 0.004,
    ULTIMATE_DAMAGE_ENEMY: -0.002,
    ULTIMATE_DAMAGE_FRIEND: -0.01, // Friendly fire hurts relationships more
    ULTIMATE_DAMAGE_NEUTRAL: -0.001,

    // One-time ultimate burst effects
    ULTIMATE_BURST_HEAL_ALLY: 0.025,
    ULTIMATE_BURST_DAMAGE_ENEMY: -0.01,
    ULTIMATE_BURST_DAMAGE_FRIEND: -0.05,
    ULTIMATE_BURST_DAMAGE_NEUTRAL: -0.005,

    // Collision interactions (per collision)
    COLLISION_HEAL_FRIEND: 0.001,
    COLLISION_DAMAGE_ENEMY: -0.0005,
    COLLISION_CRIT_ENEMY: -0.001,
    COLLISION_DAMAGE_NEUTRAL: -0.0001,
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
        ULT_CHARGE_GAIN: 20,
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
    "lotŭr": { "Vitarîs": Ally, "丂anxxui": Friend, "Askänu": Ally, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Ally, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Vitarîs": { "lotŭr": Ally, "丂anxxui": Friend, "Askänu": Ally, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Ally, "VOIDROT": MortalEnemy, "Ðethapart": MortalEnemy },
    "丂anxxui": { "lotŭr": Friend, "Vitarîs": Friend, "Askänu": Friend, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Acquaintance, "DxD": Acquaintance, "Memetic": Friend, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Askänu": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Friend, "Virtuō": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Virtuō": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Ally, "Askänu": Ally, "ℛadí": Ally, "Dræmin'": Acquaintance, "Nectiv": Friend, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Ally },
    "ℛadí": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Ally, "Askänu": Ally, "Virtuō": Ally, "Dræmin'": BestFriend, "Nectiv": Friend, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Dræmin'": { "lotŭr": Acquaintance, "Vitarîs": Acquaintance, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": BestFriend, "Nectiv": Acquaintance, "DxD": Acquaintance, "Memetic": Friend, "Elly": Acquaintance, "Cozmik": Ally, "VOIDROT": Acquaintance, "Ðethapart": Friend },
    "Nectiv": { "lotŭr": Friend, "Vitarîs": Friend, "丂anxxui": Acquaintance, "Askänu": Friend, "Virtuō": Friend, "ℛadí": Friend, "Dræmin'": Acquaintance, "DxD": Acquaintance, "Memetic": BestFriend, "Elly": Acquaintance, "Cozmik": Friend, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "DxD": { "lotŭr": Acquaintance, "Vitarîs": Acquaintance, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": Acquaintance, "Dræmin'": Acquaintance, "Nectiv": Acquaintance, "Memetic": Acquaintance, "Elly": Acquaintance, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy, "Ðethapart": Acquaintance },
    "Memetic": { "lotŭr": Acquaintance, "Vitarîs": Acquaintance, "丂anxxui": Friend, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": Acquaintance, "Dræmin'": Friend, "Nectiv": BestFriend, "DxD": Acquaintance, "Elly": Acquaintance, "Cozmik": Acquaintance, "VOIDROT": Ally, "Ðethapart": Acquaintance },
    "Elly": { "lotŭr": Friend, "Vitarîs": Friend, "丂anxxui": Friend, "Askänu": Friend, "Virtuō": Friend, "ℛadí": Friend, "Dræmin'": Acquaintance, "Nectiv": Acquaintance, "DxD": Acquaintance, "Memetic": Acquaintance, "Cozmik": BestFriend, "VOIDROT": MortalEnemy, "Ðethapart": Friend },
    "Cozmik": { "lotŭr": Ally, "Vitarîs": Ally, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Acquaintance, "ℛadí": Acquaintance, "Dræmin'": Ally, "Nectiv": Friend, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": BestFriend, "VOIDROT": Acquaintance, "Ðethapart": Acquaintance },
    "VOIDROT": { "lotŭr": MortalEnemy, "Vitarîs": MortalEnemy, "丂anxxui": MortalEnemy, "Askänu": MortalEnemy, "Virtuō": MortalEnemy, "ℛadí": MortalEnemy, "Dræmin'": Acquaintance, "Nectiv": MortalEnemy, "DxD": MortalEnemy, "Memetic": Ally, "Elly": MortalEnemy, "Cozmik": Acquaintance, "Ðethapart": MortalEnemy },
    "Ðethapart": { "lotŭr": Acquaintance, "Vitarîs": MortalEnemy, "丂anxxui": Acquaintance, "Askänu": Acquaintance, "Virtuō": Ally, "ℛadí": Acquaintance, "Dræmin'": Friend, "Nectiv": Acquaintance, "DxD": Acquaintance, "Memetic": Acquaintance, "Elly": Friend, "Cozmik": Acquaintance, "VOIDROT": MortalEnemy }
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
        CHARGE_BONUS: 2, // bonus charge per second
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

export const COLLISION_CONFIG = {
    BASE_DAMAGE: 10,
    BASE_HEAL: 8,
    NEUTRAL_DAMAGE_MULTIPLIER: 0.2,
    CRIT_CHANCE: 0.15,
    CRIT_MULTIPLIER: 1.75,
    STORED_POWER_BONUS: 0.01, // 1% bonus per point of stored power
    VELOCITY_FACTOR: 2.5, // Multiplier for collision velocity
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
    "DxD":     { collisionDamageFactor: 2.2, collisionHealFactor: 0.1, storedPowerRate: 1.0 },
    "Memetic": { collisionDamageFactor: 0.8, collisionHealFactor: 0.8, storedPowerRate: 2.5 },
    "Elly":    { collisionDamageFactor: 1.0, collisionHealFactor: 1.0, storedPowerRate: 4.5 },
    "Cozmik":  { collisionDamageFactor: 1.8, collisionHealFactor: 0.2, storedPowerRate: 1.5 },
    "VOIDROT": { collisionDamageFactor: 2.5, collisionHealFactor: 0.1, storedPowerRate: 1.0 },
    "Ðethapart": { collisionDamageFactor: 1.9, collisionHealFactor: 0.1, storedPowerRate: 3.5 },
};