import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Strand, Theme, LogEntry, StrandName, ParticleSystem, Particle, Vector, ActiveSpecialEvent, Anomaly, RelationshipMatrix, ExplosionEffect, BattleReportStats, FightHistoryData, GameMode, PlayerTool, PlayerWall, CombatTextEffect, CollisionVfx, ActiveJobEffect, SimulationStats, ActiveUltimate, GlobalEffect, TransientVfx, BoundaryType, AIAggression, FightSettings, CameraTarget } from '../types';
import { STRAND_NAMES, STRAND_CONFIG, SCREEN_WIDTH, SCREEN_HEIGHT, RELATIONSHIP_MATRIX, ASSET_URLS, FIGHT_MODE_HEALTH, PLAYER_CONFIG, SPECIAL_EVENTS_CONFIG, ULTIMATE_CONFIG, STRAND_ULTIMATE_STATS, ANOMALY_CONFIG, SIMULATION_DEFAULTS } from '../constants';
import { loadImage } from '../services/assetLoader';
import { getCrystalLore, getFightCommentary } from '../services/geminiService';
import { runSimulationTick } from './simulationLogic';
import { ultimateTriggers, globalEffectTriggers } from '../ultimates';
import { RelationshipLevel } from '../types';


const MAX_LOGS = 30;
const MAX_WIN_HISTORY = 5;

// Helper to deep copy the matrix
const copyRelationshipMatrix = (matrix: RelationshipMatrix): RelationshipMatrix => {
    return JSON.parse(JSON.stringify(matrix));
};

const deepCopyStrands = (strandsToCopy: Strand[]): Strand[] => {
    return strandsToCopy.map(s => ({
        ...s,
        position: { ...s.position },
        velocity: { ...s.velocity },
        color: [...s.color] as [number, number, number],
        originalColor: [...s.originalColor] as [number, number, number],
        jobState: { ...s.jobState },
        playerBuffs: s.playerBuffs ? s.playerBuffs.map(b => ({...b})) : [],
        tempBuffs: s.tempBuffs ? s.tempBuffs.map(b => ({...b})) : [],
        debuffs: s.debuffs ? s.debuffs.map(d => ({...d})) : [],
        // image can be a shallow copy
    }));
};

export const useSimulation = () => {
    const [strands, setStrands] = useState<Strand[]>([]);
    const [jobEffects, setJobEffects] = useState<ActiveJobEffect[]>([]);
    const [specialEvents, setSpecialEvents] = useState<ActiveSpecialEvent[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [explosionEffects, setExplosionEffects] = useState<ExplosionEffect[]>([]);
    const [combatTextEffects, setCombatTextEffects] = useState<CombatTextEffect[]>([]);
    const [collisionVfx, setCollisionVfx] = useState<CollisionVfx[]>([]);
    const [transientVfx, setTransientVfx] = useState<TransientVfx[]>([]);
    const [playerWalls, setPlayerWalls] = useState<PlayerWall[]>([]);
    const [activeUltimates, setActiveUltimates] = useState<ActiveUltimate[]>([]);
    const [globalEffects, setGlobalEffects] = useState<GlobalEffect[]>([]);
    const [activeStrandIndex, setActiveStrandIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isFightModeActive, setIsFightModeActive] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [theme, setTheme] = useState<Theme>('cosmic');
    const [winner, setWinner] = useState<Strand | null>(null);
    const [isVictoryScreenVisible, setIsVictoryScreenVisible] = useState(false);
    const [suddenDeathEffectTime, setSuddenDeathEffectTime] = useState(0);
    const [screenFlash, setScreenFlash] = useState<{ endTime: number; color: string } | null>(null);
    const [screenShake, setScreenShake] = useState<{ endTime: number; intensity: number } | null>(null);
    const [winHistory, setWinHistory] = useState<StrandName[]>([]);
    const [battleReport, setBattleReport] = useState<BattleReportStats[]>([]);
    const [fightHistoryData, setFightHistoryData] = useState<FightHistoryData>([]);
    const [fightDuration, setFightDuration] = useState(0);
    const [relationshipMatrix, setRelationshipMatrix] = useState<RelationshipMatrix>(copyRelationshipMatrix(RELATIONSHIP_MATRIX));
    const [simulationStats, setSimulationStats] = useState<SimulationStats>({
        sessionStartTime: Date.now(),
        totalCollisions: 0,
        anomaliesCollected: 0,
        ultimatesUsed: new Map(),
        player: {
            aetherSpent: 0,
            timeWithToolActive: new Map(),
            gravityAnchorTime: 0,
            abilitiesUsed: new Map(),
        },
    });
    const [isRelationshipOverlayVisible, setIsRelationshipOverlayVisible] = useState(false);
    const [isDrawingWall, setIsDrawingWall] = useState(false);
    const [wallStartPos, setWallStartPos] = useState<Vector | null>(null);
    const [isFocusModeActive, setIsFocusModeActive] = useState(false);
    const [focusedStrandId, setFocusedStrandId] = useState<number | null>(null);
    const [isActionCamActive, setIsActionCamActive] = useState(false);

    // AI Commentator State
    const [aiCommentary, setAiCommentary] = useState<string>('');
    const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

    // New Simulation Settings
    const [simulationSettings, setSimulationSettings] = useState(SIMULATION_DEFAULTS);

    // Player Mode State
    const [gameMode, setGameModeInternal] = useState<GameMode>('BOT');
    const [playerAether, setPlayerAether] = useState(PLAYER_CONFIG.AETHER_MAX);
    const [activePlayerTool, setActivePlayerTool] = useState<PlayerTool>('REPEL');
    const [isGravityAnchorActive, setIsGravityAnchorActive] = useState(false);
    const mousePosition = useRef<Vector>({ x: -1, y: -1 });
    const prevMousePosition = useRef<Vector>({ x: -1, y: -1 });
    const cameraTarget = useRef<CameraTarget>({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, zoom: 1.0 });

    const animationFrameId = useRef<number | null>(null);
    const lastTime = useRef<number>(0);
    const originalStrandsRef = useRef<Strand[]>([]);
    
    // This ref is needed to pass a mutable object to the simulation logic
    // so it can be updated without causing re-renders in the logic file itself.
    const simulationStateRef = useRef({
        nextEventTime: 0,
        celebrationEndTime: 0,
        initialCombatantCount: 0,
        fightStartTime: 0,
        lastHistoryCaptureTime: 0,
        duelAttraction: false,
        aiCommentaryCooldown: 0,
        commentaryMilestones: [] as number[],
        actionCam: {
            currentTargetId: null as number | null,
            currentTarget: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, zoom: 1.0 },
            timeOnTarget: 0,
            lastSwitchTime: 0,
        },
    });

    const addLog = useCallback((message: string) => {
        const newLog: LogEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            message,
        };
        setLogs(prevLogs => [newLog, ...prevLogs].slice(0, MAX_LOGS));
    }, []);

    const serializeGameStateForAI = useCallback(() => {
        const livingStrands = strands.filter(s => s.visible && !s.isDefeated);
        const strandData = livingStrands.map(s => 
            `- ${s.name}: ${Math.round(s.health / s.maxHealth * 100)}% Health, ${Math.round(s.ultimateCharge / s.maxUltimateCharge * 100)}% Ultimate`
        ).join('\n');
        
        const recentLogs = logs.slice(0, 5).map(l => l.message).join('\n- ');

        return `
== Astrisim Battle State ==
Fight Duration: ${fightDuration.toFixed(1)} seconds
Survivors: ${livingStrands.length} / ${simulationStateRef.current.initialCombatantCount}
--
Living Strands:
${strandData}
--
Recent Events:
- ${recentLogs}
        `;
    }, [strands, logs, fightDuration]);

    const fetchAiCommentary = useCallback(async (context: 'prediction' | 'update' | 'event', eventDescription?: string) => {
        const now = Date.now();
        if (isAiThinking || now < simulationStateRef.current.aiCommentaryCooldown) {
            return;
        }

        setIsAiThinking(true);
        simulationStateRef.current.aiCommentaryCooldown = now + 25000; // 25s cooldown

        try {
            const gameStateSummary = serializeGameStateForAI();
            let promptContext = '';
            switch (context) {
                case 'prediction': promptContext = 'The fight is about to begin. Analyze the combatants and predict a winner based on their relationships and potential synergies.'; break;
                case 'update': promptContext = `Give a mid-fight status update based on this major development: "${eventDescription}". Who has the momentum?`; break;
                case 'event': promptContext = `A major event just happened: "${eventDescription}". React to it with excitement and analysis.`; break;
            }
            const fullPrompt = `${gameStateSummary}\n\nTask: ${promptContext}`;
            const commentary = await getFightCommentary(fullPrompt);
            setAiCommentary(commentary);
        } catch (error) {
            console.error("AI commentary failed:", error);
            setAiCommentary("The Oracle's connection is unstable...");
        } finally {
            setIsAiThinking(false);
        }
    }, [isAiThinking, serializeGameStateForAI]);

    const stopFight = useCallback(() => {
        addLog("Fight mode deactivated.");
        setIsFightModeActive(false);
        setWinner(null);
        setIsVictoryScreenVisible(false);
        simulationStateRef.current.celebrationEndTime = 0;
        simulationStateRef.current.duelAttraction = false;
        setExplosionEffects([]);
        setCombatTextEffects([]);
        setCollisionVfx([]);
        setTransientVfx([]);
        setActiveUltimates([]);
        setGlobalEffects([]);
        setScreenFlash(null);
        setScreenShake(null);
        setBattleReport([]);
        setFightHistoryData([]);
        setFightDuration(0);
        setRelationshipMatrix(copyRelationshipMatrix(RELATIONSHIP_MATRIX));
        setStrands(originalStrandsRef.current);
        setAiCommentary('');
        setIsAiThinking(false);
    }, [addLog]);
    
    const setGameMode = useCallback((mode: GameMode) => {
        if (mode === gameMode) return;

        if (mode === 'PLAYER' && isFightModeActive) {
            stopFight();
        }
        if (mode === 'BOT') {
            setStrands(prev => prev.map(s => ({...s, playerBuffs: []})));
            setPlayerAether(PLAYER_CONFIG.AETHER_MAX);
            setIsGravityAnchorActive(false);
            setPlayerWalls([]);
        }
        setGameModeInternal(mode);
        addLog(`Switched to ${mode} mode.`);
    }, [isFightModeActive, stopFight, addLog, gameMode]);
    
    const setMousePosition = useCallback((pos: Vector) => {
        mousePosition.current = pos;
    }, []);

    const createPlayerWall = useCallback((start: Vector, end: Vector) => {
        if (gameMode !== 'PLAYER') return;
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        const cost = length * PLAYER_CONFIG.WALL_OF_LIGHT.AETHER_COST_PER_PIXEL;
        if (playerAether >= cost) {
            setPlayerAether(prev => prev - cost);
            setSimulationStats(prev => ({
                ...prev,
                player: {
                    ...prev.player,
                    aetherSpent: prev.player.aetherSpent + cost,
                }
            }));
            const newWall: PlayerWall = {
                id: Date.now(),
                start,
                end,
                endTime: Date.now() + PLAYER_CONFIG.WALL_OF_LIGHT.DURATION * 1000,
            };
            setPlayerWalls(prev => [...prev, newWall]);
            addLog('Wall of Light created.');
        } else {
            addLog('Not enough Aether to create wall.');
        }
    }, [gameMode, playerAether, addLog]);
    
    const applyPlayerAbility = useCallback((ability: 'FAVOR' | 'STASIS' | 'BURDEN', targetId: number) => {
        if (gameMode !== 'PLAYER') return;
        
        let cost = 0;
        let config: any;
        let abilityName = '';
        switch(ability) {
            case 'FAVOR': 
                cost = PLAYER_CONFIG.FAVOR.COST; 
                config = PLAYER_CONFIG.FAVOR;
                abilityName = 'Favor';
                break;
            case 'STASIS': 
                cost = PLAYER_CONFIG.STASIS.COST; 
                config = PLAYER_CONFIG.STASIS;
                abilityName = 'Stasis';
                break;
            case 'BURDEN':
                cost = PLAYER_CONFIG.BURDEN.COST;
                config = PLAYER_CONFIG.BURDEN;
                abilityName = 'Burden';
                break;
        }

        if (playerAether >= cost) {
            const targetStrand = strands.find(s => s.id === targetId);
            if (targetStrand && targetStrand.visible) {
                setPlayerAether(prev => prev - cost);
                 setSimulationStats(prev => {
                    const newStats = { ...prev };
                    const newAbilitiesUsed = new Map(newStats.player.abilitiesUsed);
                    newAbilitiesUsed.set(ability, (newAbilitiesUsed.get(ability) || 0) + 1);
                    newStats.player = {
                        ...newStats.player,
                        aetherSpent: newStats.player.aetherSpent + cost,
                        abilitiesUsed: newAbilitiesUsed,
                    };
                    return newStats;
                });
                setStrands(prev => prev.map(s => {
                    if (s.id === targetId) {
                        const newBuffs = s.playerBuffs?.filter(b => b.type !== ability) || [];
                        newBuffs.push({ type: ability, endTime: Date.now() + config.DURATION * 1000 });
                        return { ...s, playerBuffs: newBuffs };
                    }
                    return s;
                }));
                addLog(`Applied ${abilityName} to ${targetStrand.name}.`);
            }
        } else {
            addLog(`Not enough Aether for ${abilityName}.`);
        }
    }, [gameMode, playerAether, strands, addLog]);

    const startFight = useCallback((settings: FightSettings) => {
        if (gameMode === 'PLAYER') {
            addLog("Cannot start fight in Player Mode.");
            return;
        }
        addLog("FIGHT MODE ACTIVATED!");
        setIsFightModeActive(true);
        setWinner(null);
        setIsVictoryScreenVisible(false);
        simulationStateRef.current.celebrationEndTime = 0;
        simulationStateRef.current.duelAttraction = false; // Default for all fights
        setExplosionEffects([]); setCombatTextEffects([]); setCollisionVfx([]);
        setTransientVfx([]); setActiveUltimates([]); setGlobalEffects([]);
        setScreenFlash(null); setScreenShake(null);
        simulationStateRef.current.fightStartTime = Date.now();
        setFightDuration(0);
        simulationStateRef.current.lastHistoryCaptureTime = 0;
        setFightHistoryData([]);

        // Handle relationships
        if (settings.disableRelationships) {
            const neutralMatrix = {} as RelationshipMatrix;
            STRAND_NAMES.forEach(s1 => {
                neutralMatrix[s1] = {};
                STRAND_NAMES.forEach(s2 => {
                    if (s1 !== s2) neutralMatrix[s1][s2] = RelationshipLevel.Acquaintance;
                });
            });
            setRelationshipMatrix(neutralMatrix);
            addLog("Relationships disabled for this fight.");
        } else {
            setRelationshipMatrix(copyRelationshipMatrix(RELATIONSHIP_MATRIX));
        }

        // Prepare combatants
        const baseStrands = deepCopyStrands(originalStrandsRef.current);
        let fightRoster: Strand[] = [];

        switch (settings.mode) {
            case 'DOUBLE':
                addLog("Starting 2x Fight!");
                const visible = baseStrands.filter(s => s.visible);
                const duplicates = deepCopyStrands(visible).map(s => ({
                    ...s,
                    id: s.id + STRAND_NAMES.length,
                    position: { x: s.position.x + Math.random() * 40 - 20, y: s.position.y + Math.random() * 40 - 20 },
                }));
                fightRoster = [...visible, ...duplicates];
                break;
            case 'MIRROR':
                if (settings.mirrorStrand) {
                    addLog(`Starting Mirror Match: ${settings.mirrorStrand}!`);
                    const template = baseStrands.find(s => s.name === settings.mirrorStrand);
                    if (template) {
                        fightRoster = Array.from({ length: 12 }, (_, i) => {
                            const angle = (i / 12) * 2 * Math.PI;
                            return {
                                ...deepCopyStrands([template])[0],
                                id: 100 + i, // Use high IDs to avoid collision
                                position: { x: SCREEN_WIDTH / 2 + Math.cos(angle) * (SCREEN_WIDTH / 3.5), y: SCREEN_HEIGHT / 2 + Math.sin(angle) * (SCREEN_HEIGHT / 3.5) },
                            };
                        });
                    }
                }
                break;
            case 'DUEL':
                simulationStateRef.current.duelAttraction = settings.duelAttraction ?? true;
                if (simulationStateRef.current.duelAttraction) {
                    addLog("Duel attraction is ON.");
                }
                if (settings.duelStrands && settings.duelStrands[0] && settings.duelStrands[1]) {
                    addLog(`Starting Duel: ${settings.duelStrands[0]} vs ${settings.duelStrands[1]}!`);
                    const s1 = baseStrands.find(s => s.name === settings.duelStrands![0]);
                    const s2 = baseStrands.find(s => s.name === settings.duelStrands![1]);
                    if (s1 && s2) {
                        s1.radius = s1.originalRadius * 2;
                        s1.position = { x: SCREEN_WIDTH * 0.25, y: SCREEN_HEIGHT / 2 };
                        s2.radius = s2.originalRadius * 2;
                        s2.position = { x: SCREEN_WIDTH * 0.75, y: SCREEN_HEIGHT / 2 };
                        fightRoster = [s1, s2];
                    }
                }
                break;
            case 'NORMAL':
            default:
                addLog("Starting Normal Fight!");
                fightRoster = baseStrands.filter(s => s.visible);
                break;
        }

        simulationStateRef.current.initialCombatantCount = fightRoster.length;

        const initialReport: BattleReportStats[] = fightRoster.map(s => ({
            strandId: s.id, name: s.name, image: s.image, damageDealt: 0, damageTaken: 0,
            healingDone: 0, kills: 0, timeSurvived: 0, causeOfDeath: 'survived', isWinner: false, ultimatesUsed: 0
        }));
        setBattleReport(initialReport);

        const multipliedHealth = FIGHT_MODE_HEALTH * simulationSettings.combatStatMultiplier;
        const finalCombatants = fightRoster.map(s => ({
            ...s, health: multipliedHealth, maxHealth: multipliedHealth,
            isDefeated: false, visible: true, lastDamagedBy: null, storedPower: 0, ultimateCharge: 0, ultimateCooldown: 0,
            isInLowHpState: false, tempBuffs: [],
        }));

        setStrands(finalCombatants);
        
        // AI Commentator
        setAiCommentary('');
        simulationStateRef.current.commentaryMilestones = [0.75, 0.50, 0.25];
        fetchAiCommentary('prediction');

    }, [addLog, gameMode, simulationSettings.combatStatMultiplier, fetchAiCommentary]);

    const resetFight = useCallback(() => {
        setIsVictoryScreenVisible(false);
        setWinner(null);
        // This will be handled by the UI now which opens the setup modal again.
        // We don't call startFight here anymore directly.
    }, []);

    const toggleFightMode = useCallback(() => {
        if (isFightModeActive) {
            stopFight();
        } else {
            // This is now handled by App.tsx opening the modal
            console.warn("toggleFightMode should be handled by opening FightSetupModal");
        }
    }, [isFightModeActive, stopFight]);

    const triggerSuddenDeath = useCallback(() => {
        if (!isFightModeActive) return;
        addLog("SUDDEN DEATH! All combatants at critical health!");
        fetchAiCommentary('event', 'Sudden Death has been triggered!');
        setSuddenDeathEffectTime(Date.now() + 500); // Effect lasts 500ms
        setStrands(prev => prev.map(s => {
            if (s.visible && !s.isDefeated) {
                return { ...s, health: 100 };
            }
            return s;
        }));
    }, [isFightModeActive, addLog, fetchAiCommentary]);

    const triggerUltimate = useCallback((strandId: number) => {
        if (!isFightModeActive) return;

        setStrands(currentStrands => {
            const caster = currentStrands.find(s => s.id === strandId);
            if (!caster || caster.ultimateCharge < caster.maxUltimateCharge || caster.ultimateCooldown > 0) {
                return currentStrands;
            }

            const ultConfig = ULTIMATE_CONFIG[caster.name as keyof typeof ULTIMATE_CONFIG];
            if (!ultConfig) return currentStrands;
            
            const ultName = ultConfig.NAME;
            const now = Date.now();
            
            if (ultName in ultimateTriggers) {
                const triggerFn = ultimateTriggers[ultName as keyof typeof ultimateTriggers];
                const newUltimate = triggerFn(caster, currentStrands, now, relationshipMatrix);
                if (newUltimate) {
                    setActiveUltimates(prev => [...prev, newUltimate]);
                } else {
                    addLog(`${caster.name} failed to use ${ultName.replace(/_/g, ' ')} (no valid targets).`);
                    return currentStrands;
                }
            } else if (ultName in globalEffectTriggers) {
                const triggerFn = globalEffectTriggers[ultName as keyof typeof globalEffectTriggers];
                const newEffect = triggerFn(caster, currentStrands, now, relationshipMatrix);
                if (newEffect) {
                    setGlobalEffects(prev => [...prev, newEffect]);
                } else {
                     addLog(`${caster.name} failed to use ${ultName.replace(/_/g, ' ')} (no valid targets).`);
                    return currentStrands;
                }
            } else {
                addLog(`Ultimate for ${caster.name} is not implemented yet.`);
                return currentStrands; 
            }

            addLog(`${caster.name} used ${ultName.replace(/_/g, ' ')}!`);
            fetchAiCommentary('event', `${caster.name} used ${ultName.replace(/_/g, ' ')}!`);
            
            setSimulationStats(prev => {
                const newStats = { ...prev };
                const newUltimatesUsed = new Map(newStats.ultimatesUsed);
                newUltimatesUsed.set(caster.name, (newUltimatesUsed.get(caster.name) || 0) + 1);
                newStats.ultimatesUsed = newUltimatesUsed;
                return newStats;
            });
            
            setBattleReport(prevReport => prevReport.map(r => {
                if (r.name === caster.name) {
                    return { ...r, ultimatesUsed: r.ultimatesUsed + 1 };
                }
                return r;
            }));

            return currentStrands.map(s => {
                if (s.id === strandId) {
                    return {
                        ...s,
                        ultimateCharge: 0,
                        ultimateCooldown: STRAND_ULTIMATE_STATS[s.name].cooldown,
                    };
                }
                return s;
            });
        });

    }, [isFightModeActive, addLog, relationshipMatrix, fetchAiCommentary]);
    
    const particleSystem = useMemo<ParticleSystem>(() => {
        const particles: Particle[] = [];
        return {
            particles,
            emit(position: Vector, color: string) {
                const numParticles = 3;
                for (let i = 0; i < numParticles; i++) {
                    const particle: Particle = {
                        id: Math.random(),
                        position: { x: position.x, y: position.y },
                        velocity: {
                            x: (Math.random() - 0.5) * 2,
                            y: (Math.random() - 0.5) * 2
                        },
                        radius: Math.random() * 2 + 1,
                        color,
                        life: 100,
                    };
                    particles.push(particle);
                }
            },
            update() {
                this.particles = this.particles.filter(p => p.life > 0);
                this.particles.forEach(p => {
                    p.position.x += p.velocity.x;
                    p.position.y += p.velocity.y;
                    p.life -= 1;
                });
            }
        };
    }, []);

    const handleAnomalyClick = useCallback(async (pos: Vector) => {
        let clickedAnomaly: Anomaly | null = null;
        for (const anomaly of anomalies) {
            const dist = Math.hypot(pos.x - anomaly.position.x, pos.y - anomaly.position.y);
            if (dist < anomaly.radius) {
                clickedAnomaly = anomaly;
                break;
            }
        }

        if (clickedAnomaly) {
            setAnomalies(prev => prev.filter(a => a.id !== clickedAnomaly!.id));
            setSimulationStats(prev => ({ ...prev, anomaliesCollected: prev.anomaliesCollected + 1 }));

            if (clickedAnomaly.type === 'STARDUST_MOTE') {
                addLog('Stardust Mote collected!');
                if(isFightModeActive) {
                    const config = ANOMALY_CONFIG.STARDUST_MOTE;
                    setStrands(prevStrands => prevStrands.map(s => {
                        if (!s.visible || s.isDefeated) return s;
                        const dist = Math.hypot(s.position.x - clickedAnomaly!.position.x, s.position.y - clickedAnomaly!.position.y);
                        if (dist < config.SPEED_BOOST.RADIUS && s.ultimateCooldown <= 0) {
                            return {
                                ...s,
                                ultimateCharge: Math.min(s.maxUltimateCharge, s.ultimateCharge + config.ULT_CHARGE_GAIN)
                            };
                        }
                        return s;
                    }));
                }
            } else if (clickedAnomaly.type === 'WHISPERING_CRYSTAL') {
                addLog('A Whispering Crystal shatters...');
                try {
                    const lore = await getCrystalLore();
                    addLog(lore);
                } catch (e) {
                    addLog("The crystal's whisper fades into static.");
                }
            }
        }
    }, [anomalies, addLog, isFightModeActive]);
    
    const toggleActionCam = useCallback(() => {
        setIsActionCamActive(prev => {
            const next = !prev;
            if (next) { // if turning on
                setIsFocusModeActive(false);
                setFocusedStrandId(null);
            }
            return next;
        });
    }, [setIsFocusModeActive, setFocusedStrandId]);

    useEffect(() => {
        const initializeStrands = async () => {
            const initialStrands: Strand[] = await Promise.all(
                STRAND_NAMES.map(async (name, index) => {
                    const config = STRAND_CONFIG[name];
                    const ultStats = STRAND_ULTIMATE_STATS[name];
                    const angle = (index / STRAND_NAMES.length) * 2 * Math.PI;
                    const speed = (Math.random() * 0.5 + 0.5) * 1.5;
                    
                    let image: HTMLImageElement | null = null;
                    try {
                        image = await loadImage(ASSET_URLS[name].url);
                    } catch (e) {
                        console.warn(`Could not load image for ${name}, falling back to circle.`);
                        addLog(`Asset for ${name} failed to load. Using fallback.`);
                    }

                    return {
                        id: index,
                        name: name,
                        position: {
                            x: SCREEN_WIDTH / 2 + Math.cos(angle) * (SCREEN_WIDTH / 4) + (Math.random() * 100 - 50),
                            y: SCREEN_HEIGHT / 2 + Math.sin(angle) * (SCREEN_HEIGHT / 4) + (Math.random() * 100 - 50),
                        },
                        velocity: {
                            x: Math.cos(angle + Math.PI / 2) * speed,
                            y: Math.sin(angle + Math.PI / 2) * speed,
                        },
                        radius: config.radius,
                        originalRadius: config.radius,
                        color: config.color,
                        originalColor: config.color,
                        speed: 1.0,
                        originalSpeed: 1.0,
                        tempSpeedModifier: 1.0,
                        visible: true,
                        image,
                        glow: 0,
                        jobState: {},
                        mood: 'Neutral',
                        moodEndTime: 0,
                        health: FIGHT_MODE_HEALTH,
                        maxHealth: FIGHT_MODE_HEALTH,
                        isDefeated: false,
                        lastDamagedBy: null,
                        playerBuffs: [],
                        storedPower: 0,
                        ultimateCharge: 0,
                        maxUltimateCharge: ultStats.maxCharge,
                        ultimateCooldown: 0,
                    };
                })
            );
            setStrands(initialStrands);
            originalStrandsRef.current = deepCopyStrands(initialStrands);
            setActiveStrandIndex(Math.floor(Math.random() * initialStrands.length));
            addLog("Astrisim simulation initialized.");
            simulationStateRef.current.nextEventTime = Date.now() + SPECIAL_EVENTS_CONFIG.MIN_INTERVAL + Math.random() * (SPECIAL_EVENTS_CONFIG.MAX_INTERVAL - SPECIAL_EVENTS_CONFIG.MIN_INTERVAL);
        };

        initializeStrands();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const gameLoop = useCallback((timestamp: number) => {
        if (!lastTime.current) {
            lastTime.current = timestamp;
        }
        const deltaTime = (timestamp - lastTime.current);
        lastTime.current = timestamp;
        const now = Date.now();

        if (isVictoryScreenVisible) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }

        if (!isPaused && strands.length > 0) {
            const prevStrands = strands;
            const results = runSimulationTick({
                strands,
                jobEffects,
                specialEvents,
                anomalies,
                explosionEffects,
                combatTextEffects,
                collisionVfx,
                transientVfx,
                playerWalls,
                activeUltimates,
                globalEffects,
                activeStrandIndex,
                isFightModeActive,
                isVictoryScreenVisible,
                winner,
                battleReport,
                historyData: fightHistoryData,
                gameMode,
                playerAether,
                activePlayerTool,
                isGravityAnchorActive,
                mousePosition: mousePosition.current,
                prevMousePosition: prevMousePosition.current,
                relationshipMatrix,
                particleSystem,
                simulationState: simulationStateRef.current,
                simulationStats,
                screenFlash,
                screenShake,
                deltaTime,
                simulationSettings,
                isActionCamActive,
            });

            // Apply all state updates returned from the logic function
            setStrands(results.nextStrands);
            setJobEffects(results.nextJobEffects);
            setSpecialEvents(results.nextSpecialEvents);
            setAnomalies(results.nextAnomalies);
            setExplosionEffects(results.nextExplosionEffects);
            setCombatTextEffects(results.nextCombatTextEffects);
            setCollisionVfx(results.nextCollisionVfx);
            setTransientVfx(results.nextTransientVfx);
            setPlayerWalls(results.nextPlayerWalls);
            setActiveUltimates(results.nextActiveUltimates);
            setGlobalEffects(results.nextGlobalEffects);
            setPlayerAether(results.nextPlayerAether);
            setFightDuration(results.nextFightDuration);
            setRelationshipMatrix(results.nextRelationshipMatrix);
            setSimulationStats(results.nextSimulationStats);
            setScreenFlash(results.nextScreenFlash);
            setScreenShake(results.nextScreenShake);
            
            if (results.nextCameraTarget) {
                cameraTarget.current = results.nextCameraTarget;
            }
            if (results.nextBattleReport) {
                setBattleReport(results.nextBattleReport);
            }
             if (results.nextFightHistoryData) {
                setFightHistoryData(results.nextFightHistoryData);
            }

            if(results.newLogs.length > 0) {
                results.newLogs.forEach(log => addLog(log));
            }

            // --- AI Commentary Triggers ---
            if (isFightModeActive) {
                // Check for newly defeated strands to trigger AI commentary
                const newlyDefeated = results.nextStrands.filter(s => 
                    s.isDefeated && !prevStrands.find(oldS => oldS.id === s.id && oldS.isDefeated)
                );
                if (newlyDefeated.length > 0) {
                    const defeatLog = newlyDefeated.map(s => `${s.name} defeated by ${s.lastDamagedBy || 'unknown'}`).join(', ');
                    fetchAiCommentary('event', defeatLog);
                }

                // Check for battle milestones (e.g., half of combatants defeated)
                const livingCount = results.nextStrands.filter(s => s.visible && !s.isDefeated).length;
                const initialCount = simulationStateRef.current.initialCombatantCount;

                if (initialCount > 0) {
                    const livingRatio = livingCount / initialCount;
                    const nextMilestone = simulationStateRef.current.commentaryMilestones[0];
                    
                    if (nextMilestone && livingRatio <= nextMilestone) {
                        let contextMessage = '';
                        if (nextMilestone === 0.75) contextMessage = "The first quarter of combatants have fallen.";
                        if (nextMilestone === 0.50) contextMessage = "Half of the combatants have been eliminated. The fight enters a critical phase.";
                        if (nextMilestone === 0.25) contextMessage = "Only a quarter of the combatants remain. The end is near.";
                        
                        fetchAiCommentary('update', contextMessage);
                        simulationStateRef.current.commentaryMilestones.shift();
                    }
                }
            }
            
            if(results.newWinner !== undefined) {
                setWinner(results.newWinner);
                 if (results.newWinner) {
                    setWinHistory(prev => [results.newWinner!.name, ...prev].slice(0, MAX_WIN_HISTORY));
                }
            }
            if (results.shouldShowVictoryScreen) {
                setIsVictoryScreenVisible(true);
            }

            // Update mutable ref state
            simulationStateRef.current = results.nextSimulationState;
        }

        prevMousePosition.current = mousePosition.current;
        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [
        isPaused, isVictoryScreenVisible, winner, strands, jobEffects,
        specialEvents, anomalies, explosionEffects, combatTextEffects, collisionVfx, transientVfx, playerWalls,
        activeUltimates, globalEffects, activeStrandIndex, isFightModeActive, battleReport, fightHistoryData, 
        gameMode, playerAether, activePlayerTool, isGravityAnchorActive, addLog, particleSystem, relationshipMatrix, simulationStats,
        screenFlash, screenShake, simulationSettings, isActionCamActive, fetchAiCommentary
    ]);

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameLoop]);

    return {
        strands,
        setStrands,
        jobEffects,
        specialEvents,
        anomalies,
        explosionEffects,
        combatTextEffects,
        collisionVfx,
        transientVfx,
        playerWalls,
        activeUltimates,
        globalEffects,
        activeStrandIndex,
        setActiveStrandIndex,
        isPaused,
        setIsPaused,
        isFightModeActive,
        toggleFightMode,
        startFight,
        stopFight,
        logs,
        addLog,
        theme,
        setTheme,
        particleSystem,
        handleAnomalyClick,
        winner,
        isVictoryScreenVisible,
        resetFight,
        triggerSuddenDeath,
        triggerUltimate,
        suddenDeathEffectTime,
        screenFlash,
        screenShake,
        winHistory,
        battleReport,
        fightHistoryData,
        fightDuration,
        gameMode,
        setGameMode,
        playerAether,
        setMousePosition,
        mousePosition,
        applyPlayerAbility,
        activePlayerTool,
        setActivePlayerTool,
        isGravityAnchorActive,
        setIsGravityAnchorActive,
        createPlayerWall,
        relationshipMatrix,
        simulationStats,
        isDrawingWall,
        wallStartPos,
        isRelationshipOverlayVisible,
        setIsRelationshipOverlayVisible,
        simulationSettings,
        setSimulationSettings,
        isFocusModeActive,
        setIsFocusModeActive,
        focusedStrandId,
        setFocusedStrandId,
        isActionCamActive,
        toggleActionCam,
        cameraTarget,
        aiCommentary,
        isAiThinking,
    };
};