import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SimulationCanvas } from './components/SimulationCanvas';
import { useSimulation } from './hooks/useSimulation';
import type { Strand, Theme, StrandName, LogEntry, Vector, GameMode, PlayerTool, CombatTextEffect, CollisionVfx } from './types';
import { getStrandDescription } from './services/geminiService';
import { Modal } from './components/Modal';
import { VictoryScreen } from './components/VictoryScreen';
import { WinTracker } from './components/WinTracker';
import { BattleReport } from './components/BattleReport';
import { RealtimeAnalytics } from './components/RealtimeAnalytics';
import { PlayerHUD } from './components/PlayerHUD';
import { PLAYER_CONFIG } from './constants';
import { AnalyticsTab } from './components/AnalyticsTab';

const App: React.FC = () => {
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const {
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
    } = useSimulation();

    const [selectedStrand, setSelectedStrand] = useState<Strand | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [isBattleReportVisible, setIsBattleReportVisible] = useState(false);
    const [isAnalyticsVisible, setIsAnalyticsVisible] = useState(false);
    const [isAnalyticsTabVisible, setIsAnalyticsTabVisible] = useState(false);
    const [mousePosition, setMousePos] = useState<Vector>({ x: -1, y: -1 });
    const [isDrawingWall, setIsDrawingWall] = useState(false);
    const [wallStartPos, setWallStartPos] = useState<Vector | null>(null);
    const [isRelationshipOverlayVisible, setIsRelationshipOverlayVisible] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const activeStrandSwitchInterval = useRef<number | null>(null);

    const getCanvasRelativePos = (e: MouseEvent): Vector => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: e.clientX, y: e.clientY };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const newPos = getCanvasRelativePos(e);
            setMousePos(newPos);
            setMousePosition(newPos);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [setMousePosition]);
    
    const handleCanvasClick = useCallback((pos: Vector, event: React.MouseEvent) => {
        if (gameMode === 'PLAYER') {
            const clickedStrand = strands.find(s => {
                if (!s.visible) return false;
                const dist = Math.hypot(pos.x - s.position.x, pos.y - s.position.y);
                return dist < s.radius;
            });

            if (clickedStrand) {
                 if (event.shiftKey && !event.ctrlKey) {
                    applyPlayerAbility('FAVOR', clickedStrand.id);
                    return; // Don't process anomaly click if ability was used
                }
                if (event.ctrlKey && !event.shiftKey) {
                    applyPlayerAbility('BURDEN', clickedStrand.id);
                    return;
                }
            }
        }
        handleAnomalyClick(pos);
    }, [gameMode, strands, applyPlayerAbility, handleAnomalyClick]);


    const switchActiveStrand = useCallback(() => {
        const visibleStrands = strands.filter(s => s.visible);
        if (visibleStrands.length === 0) return;

        const currentActiveStrand = strands[activeStrandIndex];
        let newActiveIndex;
        do {
            newActiveIndex = Math.floor(Math.random() * strands.length);
        } while (!strands[newActiveIndex].visible || (visibleStrands.length > 1 && newActiveIndex === activeStrandIndex));
        
        setActiveStrandIndex(newActiveIndex);
        if (currentActiveStrand) {
            addLog(`Active Strand switched from ${currentActiveStrand.name} to ${strands[newActiveIndex].name}.`);
        } else {
            addLog(`Active Strand set to ${strands[newActiveIndex].name}.`);
        }

    }, [strands, activeStrandIndex, setActiveStrandIndex, addLog]);

    useEffect(() => {
        if (activeStrandSwitchInterval.current) {
            clearInterval(activeStrandSwitchInterval.current);
        }
        activeStrandSwitchInterval.current = window.setInterval(switchActiveStrand, 30000);

        return () => {
            if (activeStrandSwitchInterval.current) {
                clearInterval(activeStrandSwitchInterval.current);
            }
        };
    }, [switchActiveStrand]);

    const togglePanelVisibility = useCallback(() => {
        setIsPanelVisible(prev => !prev);
    }, []);
    
    const toggleRelationshipOverlay = useCallback(() => {
        setIsRelationshipOverlayVisible(prev => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'h') togglePanelVisibility();
            if (e.key.toLowerCase() === 'p') setIsPaused(prev => !prev);
            if (e.key.toLowerCase() === 'd') setTheme('day');
            if (e.key.toLowerCase() === 'n') setTheme('night');
            if (e.key.toLowerCase() === 'c') setTheme('cosmic');

            if (gameMode === 'PLAYER') {
                if (e.key === '1') setActivePlayerTool('REPEL');
                if (e.key === '2') setActivePlayerTool('CURRENT');
                if (e.key === '3') setActivePlayerTool('WALL');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsPaused, setTheme, togglePanelVisibility, gameMode, setActivePlayerTool]);

     useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
             if (gameMode !== 'PLAYER') return;
             const pos = getCanvasRelativePos(e);

            if (e.button === 2) { // Right mouse button
                e.preventDefault();
                if (e.shiftKey) {
                    const clickedStrand = strands.find(s => {
                        if (!s.visible) return false;
                        const dist = Math.hypot(pos.x - s.position.x, pos.y - s.position.y);
                        return dist < s.radius;
                    });
                    if(clickedStrand) {
                        applyPlayerAbility('STASIS', clickedStrand.id);
                    }
                } else {
                     setIsGravityAnchorActive(true);
                }
            } else if (e.button === 0) { // Left mouse button
                if (activePlayerTool === 'WALL') {
                    setIsDrawingWall(true);
                    setWallStartPos(pos);
                }
            }
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (gameMode !== 'PLAYER') return;
            const pos = getCanvasRelativePos(e);

            if (e.button === 2) { // Right mouse button
                setIsGravityAnchorActive(false);
            } else if (e.button === 0) { // Left mouse button
                if(isDrawingWall && wallStartPos) {
                    const wallLength = Math.hypot(pos.x - wallStartPos.x, pos.y - wallStartPos.y);
                    if (wallLength > PLAYER_CONFIG.WALL_OF_LIGHT.MIN_LENGTH) {
                        createPlayerWall(wallStartPos, pos);
                    }
                }
                setIsDrawingWall(false);
                setWallStartPos(null);
            }
        };
        const handleContextMenu = (e: MouseEvent) => {
             if (gameMode === 'PLAYER') e.preventDefault();
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('contextmenu', handleContextMenu);
            // Cleanup states on effect unmount
            setIsGravityAnchorActive(false);
            setIsDrawingWall(false);
            setWallStartPos(null);
        };
    }, [gameMode, setIsGravityAnchorActive, activePlayerTool, isDrawingWall, wallStartPos, createPlayerWall, applyPlayerAbility, strands]);


    const handleStrandUpdate = (name: StrandName, updates: Partial<Strand>) => {
        setStrands(prevStrands =>
            prevStrands.map(s => (s.name === name ? { ...s, ...updates } : s))
        );
        if (updates.visible !== undefined) {
             addLog(`${name} visibility set to ${updates.visible ? 'On' : 'Off'}.`);
        }
        if (updates.speed !== undefined) {
             addLog(`${name} speed set to ${updates.speed.toFixed(1)}.`);
        }
        if (updates.ultimateEnabled !== undefined) {
             addLog(`${name} ultimate ability ${updates.ultimateEnabled ? 'enabled' : 'disabled'}.`);
        }
    };

    const handleLearnMore = async (strand: Strand) => {
        setSelectedStrand(strand);
        setIsModalOpen(true);
        setIsLoadingModal(true);
        setModalContent('');
        try {
            const description = await getStrandDescription(strand.name);
            setModalContent(description);
        } catch (error) {
            console.error("Gemini API call failed:", error);
            setModalContent("Could not retrieve the strand's story at this time. Please check your API key and network connection.");
        } finally {
            setIsLoadingModal(false);
        }
    };
    
    return (
        <div className="relative w-screen h-screen font-sans">
            <SimulationCanvas
                ref={canvasRef}
                strands={strands}
                activeUltimates={activeUltimates}
                jobEffects={jobEffects}
                specialEvents={specialEvents}
                anomalies={anomalies}
                explosionEffects={explosionEffects}
                combatTextEffects={combatTextEffects}
                collisionVfx={collisionVfx}
                playerWalls={playerWalls}
                activeStrandIndex={activeStrandIndex}
                theme={theme}
                particleSystem={particleSystem}
                onCanvasClick={handleCanvasClick}
                winner={winner}
                isVictoryScreenVisible={isVictoryScreenVisible}
                suddenDeathEffectTime={suddenDeathEffectTime}
                gameMode={gameMode}
                mousePosition={mousePosition}
                activePlayerTool={activePlayerTool}
                isGravityAnchorActive={isGravityAnchorActive}
                isDrawingWall={isDrawingWall}
                wallStartPos={wallStartPos}
                isRelationshipOverlayVisible={isRelationshipOverlayVisible}
                relationshipMatrix={relationshipMatrix}
            />
            <WinTracker winHistory={winHistory} />
            <ControlPanel
                isVisible={isPanelVisible}
                onToggleVisibility={togglePanelVisibility}
                strands={strands}
                onStrandUpdate={handleStrandUpdate}
                isPaused={isPaused}
                onPauseToggle={() => setIsPaused(!isPaused)}
                isFightModeActive={isFightModeActive}
                onFightToggle={toggleFightMode}
                onTriggerSuddenDeath={triggerSuddenDeath}
                onToggleAnalytics={() => setIsAnalyticsVisible(prev => !prev)}
                theme={theme}
                onThemeChange={setTheme}
                logs={logs}
                onLearnMore={handleLearnMore}
                onTriggerUltimate={manualTriggerUltimate}
                gameMode={gameMode}
                onGameModeChange={setGameMode}
                isRelationshipOverlayVisible={isRelationshipOverlayVisible}
                onToggleRelationshipOverlay={toggleRelationshipOverlay}
            />
             <AnalyticsTab
                isVisible={isAnalyticsTabVisible}
                onToggleVisibility={() => setIsAnalyticsTabVisible(prev => !prev)}
                stats={simulationStats}
                relationshipMatrix={relationshipMatrix}
            />
            {gameMode === 'PLAYER' && (
                <PlayerHUD
                    aether={playerAether}
                    maxAether={PLAYER_CONFIG.AETHER_MAX}
                    activeTool={activePlayerTool}
                    onToolChange={setActivePlayerTool}
                />
            )}
             {isFightModeActive && isAnalyticsVisible && (
                <RealtimeAnalytics
                    report={battleReport}
                    historyData={fightHistoryData}
                    duration={fightDuration}
                    strands={strands}
                />
            )}
            {isModalOpen && selectedStrand && (
                <Modal
                    title={selectedStrand.name}
                    onClose={() => setIsModalOpen(false)}
                >
                    {isLoadingModal ? (
                         <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : (
                        <p className="text-gray-300 whitespace-pre-wrap">{modalContent}</p>
                    )}
                </Modal>
            )}
             {isVictoryScreenVisible && (
                <VictoryScreen winner={winner} onReset={resetFight} onViewReport={() => setIsBattleReportVisible(true)} />
            )}
             {isBattleReportVisible && (
                <BattleReport
                    report={battleReport}
                    onClose={() => setIsBattleReportVisible(false)}
                />
            )}
        </div>
    );
};

export default App;