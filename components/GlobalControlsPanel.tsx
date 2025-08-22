import React from 'react';
import type { Theme, GameMode } from '../types';
import { PlayIcon, PauseIcon, SunIcon, MoonIcon, SparklesIcon, FightIcon, LinkIcon, MoveIcon, SettingsIcon } from './Icons';

interface GlobalControlsPanelProps {
    isPaused: boolean;
    onPauseToggle: () => void;
    isFightModeActive: boolean;
    onFightToggle: () => void;
    onTriggerSuddenDeath: () => void;
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    gameMode: GameMode;
    onGameModeChange: (mode: GameMode) => void;
    isRelationshipOverlayVisible: boolean;
    onToggleRelationshipOverlay: () => void;
    onMouseDown?: (event: React.MouseEvent) => void;
    onOpenSettings?: () => void;
}

export const GlobalControlsPanel: React.FC<GlobalControlsPanelProps> = ({
    isPaused, onPauseToggle, theme, onThemeChange, isFightModeActive, onFightToggle, onTriggerSuddenDeath, gameMode, onGameModeChange, isRelationshipOverlayVisible, onToggleRelationshipOverlay, onMouseDown, onOpenSettings
}) => {
    const isFightDisabled = gameMode === 'PLAYER';

    return (
        <div className="w-[350px] flex flex-col gap-4 bg-gray-900/80 backdrop-blur-lg text-white shadow-2xl animate-fade-in border-2 border-purple-500/20 rounded-lg p-4">
            <div 
                onMouseDown={onMouseDown}
                className={`flex-shrink-0 flex items-center justify-between text-center border-b-2 border-purple-500/20 pb-2 mb-2 ${onMouseDown ? 'cursor-move' : ''}`}
            >
                <div className="w-6 h-6">
                     {onOpenSettings && (
                        <button onClick={onOpenSettings} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Open Settings">
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <h1 className="text-xl font-bold text-purple-300 tracking-wider">Global Controls</h1>
                {onMouseDown ? <MoveIcon className="w-6 h-6 text-gray-400" /> : <div className="w-6 h-6" />}
            </div>
            
            <div className="space-y-4">
                {/* Simulation State Group */}
                <div className="p-2 bg-black/20 rounded-lg">
                    <h4 className="text-xs text-gray-400 mb-2">Simulation State</h4>
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
                </div>

                {/* Visuals Group */}
                <div className="p-2 bg-black/20 rounded-lg">
                    <h4 className="text-xs text-gray-400 mb-2">Visuals</h4>
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
                </div>

                {/* Fight Mode Group */}
                <div className="p-2 bg-black/20 rounded-lg" title={isFightDisabled ? 'Fight Mode is disabled in Player Mode' : ''}>
                    <h4 className="text-xs text-gray-400 mb-2">Combat</h4>
                    <div className="flex items-center gap-2">
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
                           <button
                                onClick={onTriggerSuddenDeath}
                                className="flex-shrink-0 px-3 py-2 text-sm font-bold rounded-lg transition-colors bg-orange-600 hover:bg-orange-700 text-white"
                                title="Sudden Death"
                            >
                                SD
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
