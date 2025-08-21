import React from 'react';
import type { Strand, Theme, StrandName, LogEntry, GameMode } from '../types';
import { StrandControl } from './StrandControl';
import { Logger } from './Logger';
import { PlayIcon, PauseIcon, SunIcon, MoonIcon, SparklesIcon, FightIcon, ChevronLeftIcon, ChevronRightIcon, ChartIcon, LinkIcon } from './Icons';

interface ControlPanelProps {
    isVisible: boolean;
    onToggleVisibility: () => void;
    strands: Strand[];
    onStrandUpdate: (name: StrandName, updates: Partial<Strand>) => void;
    onTriggerUltimate: (strandId: number) => void;
    isPaused: boolean;
    onPauseToggle: () => void;
    isFightModeActive: boolean;
    onFightToggle: () => void;
    onTriggerSuddenDeath: () => void;
    onToggleAnalytics: () => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    logs: LogEntry[];
    onLearnMore: (strand: Strand) => void;
    gameMode: GameMode;
    onGameModeChange: (mode: GameMode) => void;
    isRelationshipOverlayVisible: boolean;
    onToggleRelationshipOverlay: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    isVisible, onToggleVisibility, strands, onStrandUpdate, isPaused, onPauseToggle, theme, onThemeChange, logs, onLearnMore, onTriggerUltimate, isFightModeActive, onFightToggle, onTriggerSuddenDeath, onToggleAnalytics, gameMode, onGameModeChange, isRelationshipOverlayVisible, onToggleRelationshipOverlay
}) => {

    const isFightDisabled = gameMode === 'PLAYER';

    return (
        <>
            {/* Expand Button: shown when panel is not visible */}
            <button
                onClick={onToggleVisibility}
                className={`absolute top-4 left-4 z-20 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 shadow-lg ${isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                aria-label="Expand Panel"
            >
                <ChevronRightIcon />
            </button>
            
            <div className={`absolute top-0 left-0 h-full p-4 flex flex-col gap-4 bg-black/60 backdrop-blur-md text-white w-96 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out z-10 ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex-shrink-0 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-purple-300">Astrisim</h1>
                        <p className="text-gray-400">Live Wallpaper Simulation</p>
                    </div>
                    <button onClick={onToggleVisibility} className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Minimize Panel">
                        <ChevronLeftIcon />
                    </button>
                </div>
                
                {/* Status & Theme Controls */}
                <div className="flex-shrink-0 p-3 bg-white/10 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 p-1 bg-black/30 rounded-full">
                            <button onClick={() => onGameModeChange('BOT')} className={`px-4 py-1 rounded-full text-sm ${gameMode === 'BOT' ? 'bg-purple-600' : 'hover:bg-white/20'}`}>Bot</button>
                            <button onClick={() => onGameModeChange('PLAYER')} className={`px-4 py-1 rounded-full text-sm ${gameMode === 'PLAYER' ? 'bg-purple-600' : 'hover:bg-white/20'}`}>Player</button>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className={`px-2 py-1 text-sm rounded ${isPaused ? 'bg-red-500' : 'bg-green-500'}`}>
                                {isPaused ? 'PAUSED' : 'RUNNING'}
                            </span>
                            <button onClick={onPauseToggle} className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label={isPaused ? 'Play' : 'Pause'}>
                                {isPaused ? <PlayIcon /> : <PauseIcon />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                         <div className="flex items-center gap-1 p-1 bg-black/30 rounded-full">
                            <button onClick={() => onThemeChange('day')} className={`p-2 rounded-full ${theme === 'day' ? 'bg-purple-500' : 'hover:bg-white/20'}`} aria-label="Day Theme"><SunIcon /></button>
                            <button onClick={() => onThemeChange('night')} className={`p-2 rounded-full ${theme === 'night' ? 'bg-purple-500' : 'hover:bg-white/20'}`} aria-label="Night Theme"><MoonIcon /></button>
                            <button onClick={() => onThemeChange('cosmic')} className={`p-2 rounded-full ${theme === 'cosmic' ? 'bg-purple-500' : 'hover:bg-white/20'}`} aria-label="Cosmic Theme"><SparklesIcon /></button>
                            <div className="w-px h-6 bg-white/20 mx-1"></div>
                            <button 
                                onClick={onToggleRelationshipOverlay} 
                                className={`p-2 rounded-full ${isRelationshipOverlayVisible ? 'bg-purple-500' : 'hover:bg-white/20'}`} 
                                aria-label="Toggle Relationship Overlay"
                                title="Toggle Relationship Overlay"
                            >
                                <LinkIcon />
                            </button>
                         </div>
                    </div>
                     <div className="mt-2 flex items-center gap-2" title={isFightDisabled ? 'Fight Mode is disabled in Player Mode' : ''}>
                        <button 
                            onClick={onFightToggle} 
                            disabled={isFightDisabled}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                                isFightModeActive 
                                ? 'bg-red-600 hover:bg-red-700 text-white flex-grow' 
                                : 'bg-gray-600 hover:bg-gray-700 text-gray-200 w-full'
                            } ${isFightDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <FightIcon />
                            {isFightModeActive ? 'Stop Fight' : 'Start Fight Mode'}
                        </button>
                        {isFightModeActive && !isFightDisabled && (
                           <>
                                <button
                                    onClick={onTriggerSuddenDeath}
                                    className="flex-shrink-0 px-3 py-2 text-sm font-bold rounded-lg transition-colors bg-orange-600 hover:bg-orange-700 text-white"
                                    aria-label="Trigger Sudden Death"
                                >
                                    Sudden Death
                                </button>
                                <button
                                    onClick={onToggleAnalytics}
                                    className="p-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                                    aria-label="Toggle Realtime Analytics"
                                >
                                    <ChartIcon />
                                </button>
                           </>
                        )}
                    </div>
                </div>

                {/* Strand Controls */}
                <div className="flex-grow flex flex-col bg-white/10 rounded-lg p-3 min-h-0">
                    <h2 className="text-xl font-semibold mb-2 flex-shrink-0">Strands</h2>
                    <div className="overflow-y-auto flex-grow pr-2 space-y-2">
                        {strands.map(strand => (
                            <StrandControl
                                key={strand.id}
                                strand={strand}
                                onUpdate={onStrandUpdate}
                                onLearnMore={onLearnMore}
                                onTriggerUltimate={onTriggerUltimate}
                                isFightModeActive={isFightModeActive}
                            />
                        ))}
                    </div>
                </div>

                {/* Logger */}
                <div className="flex-shrink-0 bg-white/10 rounded-lg p-3 h-1/4">
                    <Logger logs={logs} />
                </div>
            </div>
        </>
    );
};