import React from 'react';
import type { PlayerTool } from '../types';
import { RepelIcon, CurrentIcon, GravityIcon, WallIcon, StasisIcon, BurdenIcon } from './Icons';

interface PlayerHUDProps {
    aether: number;
    maxAether: number;
    activeTool: PlayerTool;
    onToolChange: (tool: PlayerTool) => void;
}

const ToolButton: React.FC<{
    label: string;
    hotkey: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ label, hotkey, isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-20 h-20 ${isActive ? 'bg-purple-600/80' : 'bg-black/50 hover:bg-white/20'}`}
        aria-label={`Select ${label} tool (Hotkey ${hotkey})`}
        title={`${label} (Hotkey ${hotkey})`}
    >
        {children}
        <div className="flex items-center gap-1 mt-1">
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-xs bg-gray-900/50 rounded px-1.5 py-0.5">{hotkey}</span>
        </div>
    </button>
);

const StaticAbility: React.FC<{label: string; hotkey: string; children: React.ReactNode;}> = ({label, hotkey, children}) => (
     <div className="flex flex-col items-center justify-center p-2 w-20 h-20 bg-black/50 rounded-lg" title={`${label} (${hotkey})`}>
        {children}
        <div className="flex items-center gap-1 mt-1">
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-xs bg-gray-900/50 rounded px-1.5 py-0.5">{hotkey}</span>
        </div>
    </div>
);

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ aether, maxAether, activeTool, onToolChange }) => {
    const aetherPercent = (aether / maxAether) * 100;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl animate-fade-in flex flex-col items-center gap-3">
             {/* Aether Bar */}
            <div className="bg-black/50 backdrop-blur-md rounded-lg p-2 shadow-lg w-full">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-300 text-sm">AETHER</span>
                    <div className="w-full bg-gray-900 rounded-full h-5 relative overflow-hidden border-2 border-purple-500/50">
                        <div
                            className="h-full rounded-full bg-purple-500 transition-all duration-200 ease-linear"
                            style={{ width: `${aetherPercent}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/90">
                            {Math.floor(aether)} / {maxAether}
                        </span>
                    </div>
                </div>
            </div>
            {/* Tool/Ability Bar */}
            <div className="flex items-center justify-center gap-2">
                <ToolButton label="Repel" hotkey="1" isActive={activeTool === 'REPEL'} onClick={() => onToolChange('REPEL')}>
                    <RepelIcon />
                </ToolButton>
                 <ToolButton label="Current" hotkey="2" isActive={activeTool === 'CURRENT'} onClick={() => onToolChange('CURRENT')}>
                    <CurrentIcon />
                </ToolButton>
                 <ToolButton label="Wall" hotkey="3" isActive={activeTool === 'WALL'} onClick={() => onToolChange('WALL')}>
                    <WallIcon />
                </ToolButton>
                <div className="w-px h-16 bg-white/20 mx-2"></div>
                 <StaticAbility label="Gravity" hotkey="RMB">
                    <GravityIcon />
                </StaticAbility>
                <StaticAbility label="Stasis" hotkey="S+RMB">
                    <StasisIcon />
                </StaticAbility>
                 <StaticAbility label="Burden" hotkey="C+LMB">
                    <BurdenIcon />
                </StaticAbility>
            </div>
        </div>
    );
};
