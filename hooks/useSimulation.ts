import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Strand, Theme, LogEntry, StrandName, ParticleSystem, Particle, Vector, ActiveUltimate, GlobalEffect, ActiveSpecialEvent, Anomaly, RelationshipMatrix, ExplosionEffect, BattleReportStats, FightHistoryData, GameMode, PlayerTool, PlayerWall, CombatTextEffect, CollisionVfx, ActiveJobEffect, SimulationStats } from '../types';
import { STRAND_NAMES, STRAND_CONFIG, SCREEN_WIDTH, SCREEN_HEIGHT, RELATIONSHIP_MATRIX, ASSET_URLS, ULTIMATE_COOLDOWN, FIGHT_MODE_HEALTH, PLAYER_CONFIG, SPECIAL_EVENTS_CONFIG } from '../constants';
import { loadImage } from '../services/assetLoader';
import { getCrystalLore } from '../services/geminiService';
import { runSimulationTick } from './simulationLogic';

const MAX_LOGS = 30;
const MAX_WIN_HISTORY = 5;

// Helper to deep copy the matrix
const copyRelationshipMatrix = (matrix: RelationshipMatrix): RelationshipMatrix => {
    return JSON.parse(JSON.stringify(matrix));
};

export const useSimulation = () => {
    const [strands, setStrands] = useState<Strand[]>([]);
    const [activeUltimates, setActiveUltimates] = useState<ActiveUltimate[]>([]);
    const [jobEffects, setJobEffects] = useState<ActiveJobEffect[]>([]);
    const [globalEffects, setGlobalEffects] = useState<GlobalEffect[]>([]);
    const [specialEvents, setSpecialEvents] = useState<ActiveSpecialEvent[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [explosionEffects, setExplosionEffects] = useState<ExplosionEffect[]>([]);
    const [combatTextEffects, setCombatTextEffects] = useState<CombatTextEffect[]>([]);
    const [collisionVfx, setCollisionVfx] = useState<CollisionVfx[]>([]);
    const [playerWalls, setPlayerWalls] = useState<PlayerWall[]>([]);
    const [activeStrandIndex, setActiveStrandIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isFightModeActive, setIsFightModeActive] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [theme, setTheme] = useState<Theme>('cosmic');
    const [winner, setWinner] = useState<Strand | null>(null);
    const [isVictoryScreenVisible, setIsVictoryScreenVisible] = useState(false);
    const [suddenDeathEffectTime, setSuddenDeathEffectTime] = useState(0);
    const [winHistory, setWinHistory] = useState<StrandName[]>([]);
    const [battleReport, setBattleReport] = useState<BattleReportStats[]>([]);
    const [fightHistoryData, setFightHistoryData] = useState<FightHistoryData>([]);
    const [fightDuration, setFightDuration] = useState(0);
    const [relationshipMatrix, setRelationshipMatrix] = useState<RelationshipMatrix>(copyRelationshipMatrix(RELATIONSHIP_MATRIX));
    const [simulationStats, setSimulationStats] = useState<SimulationStats>({
        sessionStartTime: Date.now(),
        totalCollisions: 0,
        totalUltimatesUsed: new Map(),
        anomaliesCollected: 0,
        player: {
            aetherSpent: 0,
            timeWithToolActive: new Map(),
            gravityAnchorTime: 0,
            abilitiesUsed: new Map(),
        },
    });


    // Player Mode State
    const [gameMode, setGameModeInternal] = useState<GameMode>('BOT');
    const [playerAether, setPlayerAether] = useState(PLAYER_CONFIG.AETHER_MAX);
    const [activePlayerTool, setActivePlayerTool] = useState<PlayerTool>('REPEL');
    const [isGravityAnchorActive, setIsGravityAnchorActive] = useState(false);
    const mousePosition = useRef<Vector>({ x: -1, y: -1 });
    const prevMousePosition = useRef<Vector>({ x: -1, y: -1 });

    const animationFrameId = useRef<number | null>(null);
    const lastTime = useRef<number>(0);
    
    // This ref is needed to pass a mutable object to the simulation logic
    // so it can be updated without causing re-renders in the logic file itself.
    const simulationStateRef = useRef({
        ellyFirstUltimateFired: false,
        nextEventTime: 0,
        celebrationEndTime: 0,
        initialCombatantCount: 0,
        fightStartTime: 0,
        lastHistoryCaptureTime: 0,
    });

    const addLog = useCallback((message: string) => {
        const newLog: LogEntry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            message,
        };
        setLogs(prevLogs => [newLog, ...prevLogs].slice(0, MAX_LOGS));
    }, []);

    const stopFight = useCallback(() => {
        addLog("Fight mode deactivated.");
        setIsFightModeActive(false);
        setWinner(null);
        setIsVictoryScreenVisible(false);
        simulationStateRef.current.celebrationEndTime = 0;
        setExplosionEffects([]);
        setCombatTextEffects([]);
        setCollisionVfx([]);
        setBattleReport([]);
        setFightHistoryData([]);
        setFightDuration(0);
        setRelationshipMatrix(copyRelationshipMatrix(RELATIONSHIP_MATRIX)); // Reset relationships
        setStrands(prev => prev.map(s => ({ ...s, isDefeated: false, visible: true, health: s.maxHealth, radius: s.originalRadius, lastDamagedBy: null, storedPower: 0 })));
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

    const startFight = useCallback(() => {
        if (gameMode === 'PLAYER') {
            addLog("Cannot start fight in Player Mode.");
            return;
        }
        addLog("FIGHT MODE ACTIVATED!");
        setIsFightModeActive(true);
        setWinner(null);
        setIsVictoryScreenVisible(false);
        simulationStateRef.current.celebrationEndTime = 0;
        setExplosionEffects([]);
        setCombatTextEffects([]);
        setCollisionVfx([]);
        simulationStateRef.current.fightStartTime = Date.now();
        setFightDuration(0);
        simulationStateRef.current.lastHistoryCaptureTime = 0;
        setFightHistoryData([]);
        setRelationshipMatrix(copyRelationshipMatrix(RELATIONSHIP_MATRIX)); // Reset relationships

        setStrands(prev => {
            simulationStateRef.current.initialCombatantCount = prev.filter(s => s.visible).length;
             const initialReport: BattleReportStats[] = prev
                .filter(s => s.visible)
                .map(s => ({
                    strandId: s.id,
                    name: s.name,
                    image: s.image,
                    damageDealt: 0,
                    damageTaken: 0,
                    healingDone: 0,
                    kills: 0,
                    ultimatesUsed: 0,
                    timeSurvived: 0,
                    causeOfDeath: 'survived',
                    isWinner: false,
                }));
            setBattleReport(initialReport);

            return prev.map(s => {
                if (s.visible) {
                    return {
                        ...s,
                        health: FIGHT_MODE_HEALTH,
                        maxHealth: FIGHT_MODE_HEALTH,
                        isDefeated: false,
                        ultimateCharge: 0,
                        ultimateCooldown: 0,
                        radius: s.originalRadius,
                        lastDamagedBy: null,
                        storedPower: 0,
                    }
                }
                return { ...s, isDefeated: true, lastDamagedBy: null };
            })
        });
    }, [addLog, gameMode]);

    const resetFight = useCallback(() => {
        setIsVictoryScreenVisible(false);
        setWinner(null);
        startFight();
        setIsPaused(false);
    }, [startFight]);

    const toggleFightMode = useCallback(() => {
        if (isFightModeActive) {
            stopFight();
        } else {
            startFight();
        }
    }, [isFightModeActive, startFight, stopFight]);

    const triggerSuddenDeath = useCallback(() => {
        if (!isFightModeActive) return;
        addLog("SUDDEN DEATH! All combatants at critical health!");
        setSuddenDeathEffectTime(Date.now() + 500); // Effect lasts 500ms
        setStrands(prev => prev.map(s => {
            if (s.visible && !s.isDefeated) {
                return { ...s, health: 100 };
            }
            return s;
        }));
    }, [isFightModeActive, addLog]);
    
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

    const manualTriggerUltimate = useCallback((strandId: number) => {
        setStrands(prevStrands => {
            const strandToTrigger = prevStrands.find(s => s.id === strandId);
            if (strandToTrigger && strandToTrigger.ultimateCharge >= 100 && strandToTrigger.ultimateCooldown <= 0 && strandToTrigger.ultimateEnabled) {
                addLog(`${strandToTrigger.name} ultimate triggered manually.`);
                // This is a direct state manipulation, so we just modify the charge/cooldown here
                // The actual ultimate logic is handled within simulationLogic
                return prevStrands.map(s => 
                    s.id === strandId 
                        ? { ...s, ultimateCharge: 0, ultimateCooldown: s.maxUltimateCooldown, jobState: { ...s.jobState, manualUltimateTrigger: true } } 
                        : s
                );
            }
            return prevStrands;
        });
        if (isFightModeActive) {
            setBattleReport(prev => prev.map(r => r.strandId === strandId ? { ...r, ultimatesUsed: r.ultimatesUsed + 1 } : r));
        }
    }, [addLog, isFightModeActive]);

    const handleAnomalyClick = useCallback(async (pos: Vector) => {
        let clickedAnomaly = null;
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
                addLog('Stardust Mote burst by user!');
                // The effect of the mote is handled inside simulationLogic now
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
    }, [anomalies, addLog]);

    useEffect(() => {
        const initializeStrands = async () => {
            const initialStrands: Strand[] = await Promise.all(
                STRAND_NAMES.map(async (name, index) => {
                    const config = STRAND_CONFIG[name];
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
                        ultimateEnabled: true,
                        glow: 0,
                        ultimateCharge: name === 'Elly' ? 75 : 0,
                        ultimateCooldown: 0,
                        maxUltimateCooldown: ULTIMATE_COOLDOWN,
                        jobState: {},
                        mood: 'Neutral',
                        moodEndTime: 0,
                        health: FIGHT_MODE_HEALTH,
                        maxHealth: FIGHT_MODE_HEALTH,
                        isDefeated: false,
                        lastDamagedBy: null,
                        debuffs: [],
                        playerBuffs: [],
                        storedPower: 0,
                    };
                })
            );
            setStrands(initialStrands);
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

        if (isVictoryScreenVisible) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
            return;
        }

        if (!isPaused && strands.length > 0) {
            const results = runSimulationTick({
                strands,
                activeUltimates,
                jobEffects,
                globalEffects,
                specialEvents,
                anomalies,
                explosionEffects,
                combatTextEffects,
                collisionVfx,
                playerWalls,
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
                deltaTime,
            });

            // Apply all state updates returned from the logic function
            setStrands(results.nextStrands);
            setActiveUltimates(results.nextActiveUltimates);
            setJobEffects(results.nextJobEffects);
            setGlobalEffects(results.nextGlobalEffects);
            setSpecialEvents(results.nextSpecialEvents);
            setAnomalies(results.nextAnomalies);
            setExplosionEffects(results.nextExplosionEffects);
            setCombatTextEffects(results.nextCombatTextEffects);
            setCollisionVfx(results.nextCollisionVfx);
            setPlayerWalls(results.nextPlayerWalls);
            setPlayerAether(results.nextPlayerAether);
            setFightDuration(results.nextFightDuration);
            setRelationshipMatrix(results.nextRelationshipMatrix);
            setSimulationStats(results.nextSimulationStats);
            
            if (results.nextBattleReport) {
                setBattleReport(results.nextBattleReport);
            }
             if (results.nextFightHistoryData) {
                setFightHistoryData(results.nextFightHistoryData);
            }

            if(results.newLogs.length > 0) {
                results.newLogs.forEach(log => addLog(log));
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
        isPaused, isVictoryScreenVisible, winner, strands, activeUltimates, jobEffects, globalEffects,
        specialEvents, anomalies, explosionEffects, combatTextEffects, collisionVfx, playerWalls,
        activeStrandIndex, isFightModeActive, battleReport, fightHistoryData, gameMode, playerAether,
        activePlayerTool, isGravityAnchorActive, addLog, particleSystem, relationshipMatrix, simulationStats
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
        activeUltimates,
        jobEffects,
        specialEvents,
        anomalies,
        explosionEffects,
        combatTextEffects,
        collisionVfx,
        playerWalls,
        activeStrandIndex,
        setActiveStrandIndex,
        isPaused,
        setIsPaused,
        isFightModeActive,
        toggleFightMode,
        logs,
        addLog,
        theme,
        setTheme,
        particleSystem,
        manualTriggerUltimate,
        handleAnomalyClick,
        winner,
        isVictoryScreenVisible,
        resetFight,
        triggerSuddenDeath,
        suddenDeathEffectTime,
        winHistory,
        battleReport,
        fightHistoryData,
        fightDuration,
        gameMode,
        setGameMode,
        playerAether,
        setMousePosition,
        applyPlayerAbility,
        activePlayerTool,
        setActivePlayerTool,
        isGravityAnchorActive,
        setIsGravityAnchorActive,
        createPlayerWall,
        relationshipMatrix,
        simulationStats,
    };
};