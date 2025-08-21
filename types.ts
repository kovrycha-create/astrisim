export type GameMode = 'BOT' | 'PLAYER';
export type PlayerTool = 'REPEL' | 'CURRENT' | 'WALL';

export type StrandName = 
    | "lotŭr" | "Vitarîs" | "丂anxxui" | "Askänu" | "Virtuō" | "ℛadí" 
    | "Dræmin'" | "Nectiv" | "DxD" | "Memetic" | "Elly" | "Cozmik" | "VOIDROT" | "Ðethapart";

export interface Vector {
    x: number;
    y: number;
}

export type Mood = 'Neutral' | 'Calm' | 'Agitated' | 'Playful';

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
    image: HTMLImageElement | null;
    ultimateEnabled: boolean;
    glow: number;
    ultimateCharge: number; // 0-100
    ultimateCooldown: number; // in seconds
    maxUltimateCooldown: number;
    temporaryState?: { // For Dream Weave
        swapTargetId: number;
    } | null;
    jobState: { [key: string]: any }; // For idle/job behaviors
    glowColor?: [number, number, number] | null; // For DxD's job
    mood: Mood;
    moodEndTime: number;
    health: number;
    maxHealth: number;
    isDefeated: boolean;
    lastDamagedBy: StrandName | null;
    debuffs?: { type: 'MARK_OF_CLOSURE'; endTime: number; }[];
    playerBuffs?: { type: 'FAVOR' | 'STASIS' | 'BURDEN'; endTime: number; }[];
    storedPower: number; // For collision ramp-up damage/heal
    mouseVelocity?: Vector; // For cosmic current
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

export type UltimateType = 
    | 'FISSURE' 
    | 'VITAL_BLOOM' 
    | 'REVELATION_FLARE'
    | 'GRAVITATIONAL_COLLAPSE'
    | 'EQUILIBRIUM_BURST'
    | 'TRANQUILITY_NEXUS'
    | 'BEACON_OF_KNOWLEDGE'
    | 'UNITY_PULSE'
    | 'DUEL_ARENA'
    | 'EMPATHIC_RESONANCE_VISUAL'
    | 'DECREE_OF_NULL'; // Visual only for a global effect

export interface ActiveUltimate {
    id: number;
    type: UltimateType;
    sourceStrandId: number;
    sourceStrandName: StrandName;
    position: Vector;
    life: number;
    maxLife: number;
    radius: number;
    maxRadius: number;
    color: string;
    phase?: 'pull' | 'push';
    data?: {
        participants?: number[]; // For DxD, Nectiv, Askanu
        [key: string]: any;
    };
}

// Global, timed effects that aren't tied to a specific location
export interface GlobalEffect {
    type: 'ECHO_STORM' | 'CORRUPTION' | 'EMPATHIC_RESONANCE' | 'DREAM_WEAVE';
    endTime: number;
    data?: {
        swappedPair?: [number, number];
    };
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

export type JobEffectType = 'RIPPLE' | 'EDGE_GLITCH';

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
    type: 'heal' | 'neutral' | 'damage' | 'crit';
    intensity: number; // from 0 to 1
}

export interface BattleReportStats {
    strandId: number;
    name: StrandName;
    image: HTMLImageElement | null;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    kills: number;
    ultimatesUsed: number;
    timeSurvived: number;
    causeOfDeath: StrandName | 'survived' | 'draw' | 'environment';
    isWinner: boolean;
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
    totalUltimatesUsed: Map<StrandName, number>;
    anomaliesCollected: number;
    player: {
        aetherSpent: number;
        timeWithToolActive: Map<PlayerTool, number>;
        gravityAnchorTime: number; // in seconds
        abilitiesUsed: Map<'FAVOR' | 'STASIS' | 'BURDEN', number>;
    };
}