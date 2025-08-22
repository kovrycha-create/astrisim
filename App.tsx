
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SimulationCanvas } from './components/SimulationCanvas';
import { useSimulation } from './hooks/useSimulation';
import type { Vector, Strand, FightSettings, CreatureType } from './types';
import { PlayerHUD } from './components/PlayerHUD';
import { PLAYER_CONFIG } from './constants';

import { ControlPanel } from './components/ControlPanel';
import { AnalyticsTab } from './components/AnalyticsTab';
import { WinTracker } from './components/WinTracker';
import { RealtimeAnalytics } from './components/RealtimeAnalytics';
import { VictoryScreen } from './components/VictoryScreen';
import { BattleReport } from './components/BattleReport';
import { Modal } from './components/Modal';
import { FightSetupModal } from './components/FightSetupModal';
import { getStrandDescription } from './services/geminiService';
import { LayoutSidebarLeftCollapse, LayoutSidebarLeftExpand, LayoutSidebarRightCollapse, LayoutSidebarRightExpand, PanelBottomClose, PanelBottomOpen, PanelTopClose, PanelTopOpen } from './components/Icons';
import { Logger } from './components/Logger';
import { GlobalControlsPanel } from './components/GlobalControlsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AICommentatorPanel } from './components/AICommentatorPanel';
import { CreatureSetupModal } from './components/CreatureSetupModal';
import { CreatureHUD } from './components/CreatureHUD';

const App: React.FC = () => {
    const simulation = useSimulation();
    const {
        strands, jobEffects, specialEvents, anomalies, explosionEffects, combatTextEffects,
        collisionVfx, transientVfx, playerWalls, activeUltimates, globalEffects,
        activeStrandIndex, theme, particleSystem, handleAnomalyClick, winner,
        isVictoryScreenVisible, suddenDeathEffectTime, screenFlash, screenShake, gameMode,
        setMousePosition, applyPlayerAbility, activePlayerTool, isGravityAnchorActive,
        isDrawingWall, wallStartPos, isRelationshipOverlayVisible, relationshipMatrix,
        playerAether, setActivePlayerTool, simulationSettings, setSimulationSettings,
        isFocusModeActive, setIsFocusModeActive, focusedStrandId, setFocusedStrandId,
        isActionCamActive, toggleActionCam, aiCommentary, isAiThinking,
        creatures, creatureWinner
    } = simulation;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // GUI State
    const [panels, setPanels] = useState({ left: true, right: true, bottom: true });
    const [isLogPanelVisible, setIsLogPanelVisible] = useState(true);
    const [isOraclePanelVisible, setIsOraclePanelVisible] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: '' });
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    const [isBattleReportVisible, setIsBattleReportVisible] = useState(false);
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [isFightSetupModalOpen, setIsFightSetupModalOpen] = useState(false);
    const [isCreatureSetupModalOpen, setIsCreatureSetupModalOpen] = useState(false);
    const wasPausedBeforeSettingsRef = useRef(false);
    
    // Draggable Panel State
    const [globalControlsPos, setGlobalControlsPos] = useState({ x: window.innerWidth - 350 - 24, y: window.innerHeight - 340 - 24 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const globalControlsRef = useRef<HTMLDivElement>(null);

    const handleLearnMore = async (strand: Strand) => {
        setIsModalOpen(true);
        setIsLoadingModal(true);
        setModalContent({ title: strand.name, body: '' });
        try {
            const description = await getStrandDescription(strand.name);
            setModalContent({ title: strand.name, body: description });
        } catch (error) {
            console.error("Gemini API call failed:", error);
            setModalContent({ title: strand.name, body: "Could not retrieve the strand's story at this time. Please check your API key and network connection." });
        } finally {
            setIsLoadingModal(false);
        }
    };
    
    const handleResetFight = () => {
        setIsBattleReportVisible(false);
        if (gameMode === 'CREATURE') {
            setIsCreatureSetupModalOpen(true);
        } else {
            setIsFightSetupModalOpen(true);
        }
    };

    const handleStartFight = (settings: FightSettings) => {
        setIsFightSetupModalOpen(false);
        simulation.startFight(settings);
    };
    
    const handleStartCreatureFight = (teamA: CreatureType[], teamB: CreatureType[]) => {
        setIsCreatureSetupModalOpen(false);
        simulation.startCreatureFight(teamA, teamB);
    };


    const handleFightToggle = () => {
        if (simulation.isFightModeActive) {
            simulation.stopFight();
        } else {
             if (gameMode === 'CREATURE') {
                setIsCreatureSetupModalOpen(true);
            } else {
                setIsFightSetupModalOpen(true);
            }
        }
    };

    const handleStrandOrderChange = useCallback((newStrands: Strand[]) => {
        simulation.setStrands(newStrands);
    }, [simulation.setStrands]);

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
    
    const handleOpenSettings = () => {
        wasPausedBeforeSettingsRef.current = simulation.isPaused;
        simulation.setIsPaused(true);
        setIsSettingsPanelOpen(true);
    };
    
    const handleCloseSettings = () => {
        setIsSettingsPanelOpen(false);
        if (!wasPausedBeforeSettingsRef.current) {
            simulation.setIsPaused(false);
        }
    };
    
    const handleToggleFocusMode = useCallback(() => {
        setIsFocusModeActive(prev => {
            const next = !prev;
            if (!next) { // if turning off
                setFocusedStrandId(null);
            }
            return next;
        });
    }, [setIsFocusModeActive, setFocusedStrandId]);
    
    const handleSetFocusedStrand = useCallback((id: number | null) => {
        setFocusedStrandId(id);
    }, [setFocusedStrandId]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const newPos = getCanvasRelativePos(e);
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
                    return;
                }
                if (event.ctrlKey && !event.shiftKey) {
                    applyPlayerAbility('BURDEN', clickedStrand.id);
                    return;
                }
            }
        }
        handleAnomalyClick(pos);
    }, [gameMode, strands, applyPlayerAbility, handleAnomalyClick]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (globalControlsRef.current) {
            e.preventDefault();
            const panelRect = globalControlsRef.current.getBoundingClientRect();
            dragOffsetRef.current = {
                x: e.clientX - panelRect.left,
                y: e.clientY - panelRect.top,
            };
            setIsDragging(true);
        }
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        e.preventDefault();
        setGlobalControlsPos({
            x: e.clientX - dragOffsetRef.current.x,
            y: e.clientY - dragOffsetRef.current.y,
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const isFightActive = simulation.isFightModeActive;

    return (
        <div className="relative w-screen h-screen font-sans bg-gray-900">
            <SimulationCanvas
                ref={canvasRef}
                strands={strands}
                creatures={creatures}
                jobEffects={jobEffects}
                specialEvents={specialEvents}
                anomalies={anomalies}
                explosionEffects={explosionEffects}
                combatTextEffects={combatTextEffects}
                collisionVfx={collisionVfx}
                transientVfx={transientVfx}
                playerWalls={playerWalls}
                activeUltimates={activeUltimates}
                globalEffects={globalEffects}
                activeStrandIndex={activeStrandIndex}
                theme={theme}
                particleSystem={particleSystem}
                onCanvasClick={handleCanvasClick}
                winner={winner}
                isVictoryScreenVisible={isVictoryScreenVisible}
                suddenDeathEffectTime={suddenDeathEffectTime}
                screenFlash={screenFlash}
                screenShake={screenShake}
                gameMode={gameMode}
                mousePosition={simulation.mousePosition.current}
                activePlayerTool={activePlayerTool}
                isGravityAnchorActive={isGravityAnchorActive}
                isDrawingWall={isDrawingWall}
                wallStartPos={wallStartPos}
                isRelationshipOverlayVisible={isRelationshipOverlayVisible}
                relationshipMatrix={relationshipMatrix}
                focusedStrandId={focusedStrandId}
                isActionCamActive={isActionCamActive}
                cameraTarget={simulation.cameraTarget.current}
            />

            {/* Top Log Panel */}
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[250px] z-20 transition-all duration-300 ease-in-out ${isLogPanelVisible ? 'translate-y-0' : '-translate-y-[270px]'}`}>
                <div className="h-full bg-gray-900/80 backdrop-blur-lg text-white w-full shadow-2xl overflow-hidden animate-fade-in border-2 border-purple-500/20 rounded-lg p-4 flex flex-col">
                    <Logger logs={simulation.logs} />
                </div>
            </div>

            {/* Oracle Panel */}
            <div
                className="absolute left-1/2 -translate-x-1/2 w-full max-w-3xl z-20 transition-all duration-500 ease-in-out"
                style={{ top: isLogPanelVisible ? '262px' : '4px' }}
            >
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFightActive && isOraclePanelVisible ? 'opacity-100 max-h-[120px]' : 'opacity-0 max-h-0'}`}>
                    <AICommentatorPanel commentary={aiCommentary} isThinking={isAiThinking} />
                </div>
            </div>

            {/* Left Panel (Strand Manager) */}
             <div className={`absolute top-4 left-4 bottom-4 w-[400px] z-20 transition-transform duration-300 ease-in-out ${panels.left ? 'translate-x-0' : '-translate-x-[420px]'}`}>
                {gameMode === 'CREATURE' ? (
                     <div className="h-full flex flex-col gap-4 bg-gray-900/80 backdrop-blur-lg text-white w-full shadow-2xl overflow-y-hidden animate-fade-in border-2 border-purple-500/20 rounded-lg p-4">
                        <h1 className="text-3xl font-bold text-purple-300 tracking-wider text-center border-b-2 border-purple-500/20 pb-4">Creature Mode</h1>
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-gray-400 text-center">Creature controls and analytics will appear here.</p>
                        </div>
                    </div>
                ) : (
                    <ControlPanel
                        strands={simulation.strands}
                        onStrandUpdate={(name, updates) => simulation.setStrands(prev => prev.map(s => (s.name === name ? { ...s, ...updates } : s)))}
                        onTriggerUltimate={simulation.triggerUltimate}
                        onLearnMore={handleLearnMore}
                        isFightModeActive={simulation.isFightModeActive}
                        onStrandOrderChange={handleStrandOrderChange}
                        isFocusModeActive={isFocusModeActive}
                        onToggleFocusMode={handleToggleFocusMode}
                        onSetFocusedStrand={handleSetFocusedStrand}
                        isActionCamActive={isActionCamActive}
                        onToggleActionCam={toggleActionCam}
                    />
                )}
            </div>


            {/* Draggable Global Controls Panel */}
            <div
                ref={globalControlsRef}
                className="absolute z-20"
                style={{ top: globalControlsPos.y, left: globalControlsPos.x }}
            >
                <GlobalControlsPanel
                    isPaused={simulation.isPaused}
                    onPauseToggle={() => simulation.setIsPaused(p => !p)}
                    isFightModeActive={simulation.isFightModeActive}
                    onFightToggle={handleFightToggle}
                    onTriggerSuddenDeath={simulation.triggerSuddenDeath}
                    theme={simulation.theme}
                    onThemeChange={simulation.setTheme}
                    gameMode={simulation.gameMode}
                    onGameModeChange={simulation.setGameMode}
                    isRelationshipOverlayVisible={simulation.isRelationshipOverlayVisible}
                    onToggleRelationshipOverlay={() => simulation.setIsRelationshipOverlayVisible(p => !p)}
                    onMouseDown={handleMouseDown}
                    onOpenSettings={handleOpenSettings}
                />
            </div>

            {/* Right Panel */}
             <div className={`absolute top-4 right-4 w-[336px] z-20 transition-transform duration-300 ease-in-out ${panels.right ? 'translate-x-0' : 'translate-x-[352px]'}`}>
                <AnalyticsTab stats={simulation.simulationStats} relationshipMatrix={simulation.relationshipMatrix} />
            </div>

            {/* Bottom Panel */}
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[300px] z-20 transition-transform duration-300 ease-in-out ${panels.bottom ? 'translate-y-0' : 'translate-y-[320px]'}`}>
                {simulation.isFightModeActive && !isVictoryScreenVisible && gameMode !== 'CREATURE' ? (
                    <div className="w-full h-full bg-black/70 backdrop-blur-md text-white shadow-2xl flex flex-col gap-4 border-2 border-purple-500/20 rounded-lg">
                        <RealtimeAnalytics
                            report={simulation.battleReport}
                            historyData={simulation.fightHistoryData}
                            duration={simulation.fightDuration}
                            strands={simulation.strands}
                        />
                    </div>
                ) : gameMode !== 'CREATURE' ? (
                    <div className="p-4 h-full">
                        <WinTracker winHistory={simulation.winHistory} strands={simulation.strands} />
                    </div>
                ) : null }
            </div>

            {/* Panel Toggles */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <button onClick={() => setIsLogPanelVisible(p => !p)} className={`p-2 bg-gray-800/80 backdrop-blur-md rounded-md hover:bg-purple-600 transition-all duration-300 ease-in-out ${isLogPanelVisible ? 'translate-y-[258px]' : 'translate-y-0'}`}>
                    {isLogPanelVisible ? <PanelTopClose /> : <PanelTopOpen />}
                </button>
            </div>
             {isFightActive && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ease-in-out"
                    style={{ top: isLogPanelVisible ? '262px' : '4px' }}
                >
                    <button onClick={() => setIsOraclePanelVisible(p => !p)} className={`p-2 bg-gray-800/80 backdrop-blur-md rounded-md hover:bg-purple-600 transition-all duration-300 ease-in-out ${isOraclePanelVisible ? 'translate-y-[128px]' : 'translate-y-0'}`}>
                        {isOraclePanelVisible ? <PanelTopClose /> : <PanelTopOpen />}
                    </button>
                </div>
            )}
            <div className="absolute top-4 left-4 z-30">
                <button onClick={() => setPanels(p => ({ ...p, left: !p.left }))} className={`p-2 bg-gray-800/80 backdrop-blur-md rounded-md hover:bg-purple-600 transition-all duration-300 ease-in-out ${panels.left ? 'translate-x-[408px]' : 'translate-x-0'}`}>
                    {panels.left ? <LayoutSidebarLeftCollapse /> : <LayoutSidebarLeftExpand />}
                </button>
            </div>
             <div className="absolute top-4 right-4 z-30">
                <button onClick={() => setPanels(p => ({ ...p, right: !p.right }))} className={`p-2 bg-gray-800/80 backdrop-blur-md rounded-md hover:bg-purple-600 transition-all duration-300 ease-in-out ${panels.right ? '-translate-x-[344px]' : 'translate-x-0'}`}>
                    {panels.right ? <LayoutSidebarRightCollapse /> : <LayoutSidebarRightExpand />}
                </button>
            </div>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                <button onClick={() => setPanels(p => ({ ...p, bottom: !p.bottom }))} className={`p-2 bg-gray-800/80 backdrop-blur-md rounded-md hover:bg-purple-600 transition-all duration-300 ease-in-out ${panels.bottom ? '-translate-y-[308px]' : 'translate-y-0'}`}>
                    {panels.bottom ? <PanelBottomClose /> : <PanelBottomOpen />}
                </button>
            </div>
            
            {/* Player & Creature HUDs */}
            <div className={`absolute left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ease-in-out ${panels.bottom ? 'bottom-[320px]' : 'bottom-4'}`}>
                {gameMode === 'PLAYER' && (
                    <PlayerHUD
                        aether={playerAether}
                        maxAether={PLAYER_CONFIG.AETHER_MAX}
                        activeTool={activePlayerTool}
                        onToolChange={setActivePlayerTool}
                    />
                )}
                 {gameMode === 'CREATURE' && isFightActive && !isVictoryScreenVisible &&(
                    <CreatureHUD creatures={creatures} />
                )}
            </div>
            
            {/* Overlays */}
             <CreatureSetupModal
                isOpen={isCreatureSetupModalOpen}
                onClose={() => setIsCreatureSetupModalOpen(false)}
                onStartFight={handleStartCreatureFight}
            />
            <FightSetupModal 
                isOpen={isFightSetupModalOpen}
                onClose={() => setIsFightSetupModalOpen(false)}
                onStartFight={handleStartFight}
            />
            <SettingsPanel
                isOpen={isSettingsPanelOpen}
                onClose={handleCloseSettings}
                settings={simulationSettings}
                onSettingChange={(setting, value) => setSimulationSettings(prev => ({ ...prev, [setting]: value }))}
            />
            {isVictoryScreenVisible && (
                 <VictoryScreen 
                    winner={gameMode === 'CREATURE' ? creatureWinner : winner} 
                    onReset={handleResetFight} 
                    onViewReport={() => setIsBattleReportVisible(true)}
                />
            )}
            {isBattleReportVisible && (
                <BattleReport
                    report={simulation.battleReport}
                    onClose={() => setIsBattleReportVisible(false)}
                />
            )}
            {isModalOpen && (
                <Modal title={modalContent.title} onClose={() => setIsModalOpen(false)}>
                    {isLoadingModal ? (
                         <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : (
                        <p className="text-gray-300 whitespace-pre-wrap">{modalContent.body}</p>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default App;
