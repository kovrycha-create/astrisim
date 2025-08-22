export type GameMode = 'BOT' | 'PLAYER';
export type PlayerTool = 'REPEL' | 'CURRENT' | 'WALL';
export type BoundaryType = 'BOUNCE' | 'WRAP';
export type AIAggression = 'PASSIVE' | 'NORMAL' | 'AGGRESSIVE';

export type FightModeType = 'NORMAL' | 'DOUBLE' | 'MIRROR' | 'DUEL';

export interface FightSettings {
    mode: FightModeType;
    disableRelationships: boolean;
    mirrorStrand?: StrandName;
    duelStrands?: [StrandName | null, StrandName | null];
    duelAttraction?: boolean;
}

export interface CameraTarget {
    x: number;
    y: number;
    zoom: number;
}


export type StrandName = 
    | "lotŭr" | "Vitarîs" | "丂anxxui" | "Askänu" | "Virtuō" | "ℛadí" 
    | "Dræmin'" | "Nectiv" | "OptiX" | "Memetic" | "Elly" | "Cozmik" | "VOIDROT" | "Ðethapart";

export type UltimateName = 
    | 'TRANQUILITY_NEXUS' 
    | 'VITAL_BLOOM'
    | 'FISSURE'
    | 'GRAVITATIONAL_COLLAPSE'
    | 'REVELATION_FLARE'
    | 'DUEL_ARENA'
    | 'BEACON_OF_KNOWLEDGE'
    | 'UNITY_PULSE'
    | 'DECREE_OF_NULL';

export interface ActiveUltimate {
    id: number;
    type: UltimateName;
    sourceStrandId: number;
    sourceStrandName: StrandName;
    position: Vector;
    life: number; // in seconds
    maxLife: number; // in seconds
    radius: number;
    maxRadius: number;
    color: string;
    phase?: 'pull' | 'push'; // For multi-stage ultimates like Cozmik's
    data: {
        [key: string]: any;
    };
}

export type TransientVfxType = 'CHARGE_SURGE' | 'LOW_HP_ACTIVATION';

export interface TransientVfx {
    id: number;
    type: TransientVfxType;
    targetId: number;
    life: number;
    maxLife: number;
    data: {
        [key: string]: any;
    };
}

export interface GlobalEffect {
    type: 'CORRUPTION' | 'EQUILIBRIUM_BURST' | 'EMPATHIC_RESONANCE' | 'DREAM_WEAVE' | 'ECHO_STORM';
    endTime: number;
    data: {
        [key: string]: any;
    };
}

export interface Vector {
    x: number;
    y: number;
}

export type Mood = 'Neutral' | 'Calm' | 'Agitated' | 'Playful';

export interface Debuff {
    type: 'CORRUPTION' | 'MARK_OF_CLOSURE';
    endTime: number;
    source: StrandName;
    [key: string]: any;
}

export interface Strand {
    id: number;
    name: StrandName;
    position: Vector;
    velocity: Vector;
    radius: number;
    originalRadius: number;
    color: [number, number, number];
    originalColor: [number, number, number];
    speed: number;
    originalSpeed: number; // To properly handle dream weave swaps
    tempSpeedModifier: number;
    visible: boolean;
    image?: HTMLImageElement | null;
    imageUrl?: string;
    glow: number;
    jobState: { 
        [key: string]: any;
        isChanneling?: boolean;
        duelState?: {
            phase: 'STALK' | 'ENGAGE' | 'REPOSITION';
            phaseEndTime: number;
        };
    };
    glowColor?: [number, number, number] | null; // For OptiX's job
    mood: Mood;
    moodEndTime: number;
    health: number;
    maxHealth: number;
    isDefeated: boolean;
    isInLowHpState?: boolean;
    lastDamagedBy: StrandName | null;
    playerBuffs?: { type: 'FAVOR' | 'STASIS' | 'BURDEN'; endTime: number; }[];
    tempBuffs?: { type: string; endTime: number; multiplier?: number; }[];
    debuffs?: Debuff[];
    storedPower: number; // For collision ramp-up damage/heal
    mouseVelocity?: Vector; // For cosmic current
    ultimateCharge: number;
    maxUltimateCharge: number;
    ultimateCooldown: number; // in seconds
    temporaryState?: { [key: string]: any } | null;
}

export type Theme = 'day' | 'night' | 'cosmic';

export interface LogEntry {
    id: number;
    timestamp: string;
    message: string;
}

export enum RelationshipLevel {
    MortalEnemy = -1.0,
    Acquaintance = 0.1,
    Friend = 0.5,
    Ally = 0.7,
    BestFriend = 0.8,
}

export type RelationshipMatrix = {
    [key in StrandName]: {
        [key in StrandName]?: RelationshipLevel;
    };
};

export interface Particle {
    id: number;
    position: Vector;
    velocity: Vector;
    radius: number;
    color: string;
    life: number;
}

export interface ParticleSystem {
    particles: Particle[];
    emit: (position: Vector, color: string) => void;
    update: () => void;
}

export type SpecialEventType = 'METEOR_SHOWER' | 'COLOR_SHIFT' | 'SPEED_BOOST_ZONE';

export interface ActiveSpecialEvent {
    id: number;
    type: SpecialEventType;
    endTime: number;
    // Data for visual rendering or physics
    data: {
        meteors?: { position: Vector; velocity: Vector; }[];
        hueShift?: number;
        zone?: { position: Vector; radius: number; };
    };
}

export type JobEffectType = 'RIPPLE' | 'EDGE_GLITCH' | 'ENERGY_TRAIL' | 'DREAM_DISTORTION' | 'GROUNDING_AURA' | 'LIGHT_PULSE' | 'VOID_MOTE' | 'GRAVITY_WELL' | 'JUDGEMENT_LINK' | 'EMPATHIC_LINK' | 'WEAVER_TETHER';

export interface ActiveJobEffect {
    id: number;
    type: JobEffectType;
    position: Vector;
    life: number;
    maxLife: number;
    radius?: number;
    maxRadius?: number;
    color?: string;
    data?: {
        [key: string]: any;
        width?: number;
        height?: number;
    };
}

export type AnomalyType = 'STARDUST_MOTE' | 'WHISPERING_CRYSTAL';

export interface Anomaly {
    id: number;
    type: AnomalyType;
    position: Vector;
    radius: number;
}

export interface ExplosionEffect {
    id: number;
    position: Vector;
    life: number;
    maxLife: number;
    intensity: number;
}

export interface CombatTextEffect {
    id: number;
    position: Vector;
    text: string;
    color: string;
    life: number;
    maxLife: number;
    velocity: Vector;
}

export interface CollisionVfx {
    id: number;
    position: Vector;
    life: number;
    maxLife: number;
    type: 'heal' | 'neutral' | 'damage' | 'crit' | 'heal_blocked';
    intensity: number; // from 0 to 1
}

export interface BattleReportStats {
    strandId: number;
    name: StrandName;
    image?: HTMLImageElement | null;
    imageUrl?: string;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    kills: number;
    timeSurvived: number;
    causeOfDeath: StrandName | 'survived' | 'draw' | 'environment';
    isWinner: boolean;
    ultimatesUsed: number;
}

export interface StatSnapshot {
    time: number; // seconds from fight start
    stats: {
        strandId: number;
        damageDealt: number;
        healingDone: number;
        damageTaken: number;
    }[];
    survivorCount: number;
}

export type FightHistoryData = StatSnapshot[];

export interface PlayerWall {
    id: number;
    start: Vector;
    end: Vector;
    endTime: number;
}

export interface SimulationStats {
    sessionStartTime: number;
    totalCollisions: number;
    anomaliesCollected: number;
    ultimatesUsed: Map<StrandName, number>;
    player: {
        aetherSpent: number;
        timeWithToolActive: Map<PlayerTool, number>;
        gravityAnchorTime: number; // in seconds
        abilitiesUsed: Map<'FAVOR' | 'STASIS' | 'BURDEN', number>;
    };
}
