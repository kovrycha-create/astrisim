import React from 'react';
import type { Strand, StrandName } from '../types';

interface StrandControlProps {
    strand: Strand;
    onUpdate: (name: StrandName, updates: Partial<Strand>) => void;
    onLearnMore: (strand: Strand) => void;
    onTriggerUltimate: (strandId: number) => void;
    isFightModeActive: boolean;
}

const UltimateBar: React.FC<{ strand: Strand; onClick?: () => void; disabled: boolean }> = ({ strand, onClick, disabled }) => {
    const isReady = strand.ultimateCharge >= 100;
    const onCooldown = strand.ultimateCooldown > 0;
    const canTrigger = !onCooldown && isReady && !disabled;

    let barColor = 'bg-gray-600';
    let widthPercent = (strand.ultimateCharge / 100) * 100;
    let text = `${Math.floor(strand.ultimateCharge)}%`;

    if (onCooldown) {
        barColor = 'bg-red-800';
        widthPercent = (strand.ultimateCooldown / strand.maxUltimateCooldown) * 100;
        text = `${strand.ultimateCooldown.toFixed(1)}s`;
    } else if (isReady) {
        barColor = 'bg-purple-500';
        widthPercent = 100;
        text = 'READY';
    }
    
    return (
        <div 
            className={`w-full bg-gray-900 rounded-full h-4 relative overflow-hidden ${canTrigger ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${disabled ? 'opacity-50' : ''}`}
            onClick={canTrigger ? onClick : undefined}
            aria-label={`Ultimate charge: ${text}`}
        >
            <div
                className={`h-full rounded-full transition-all duration-200 ease-linear ${barColor}`}
                style={{ width: `${widthPercent}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/90">
                {text}
            </span>
        </div>
    );
};

const HealthBar: React.FC<{strand: Strand}> = ({ strand }) => {
    const healthPercent = (strand.health / strand.maxHealth) * 100;
    return (
         <div className="w-full bg-gray-900 rounded-full h-3 relative overflow-hidden border border-gray-700">
            <div
                className="h-full rounded-full bg-green-500 transition-all duration-200 ease-linear"
                style={{ width: `${healthPercent}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-white/90 font-bold" style={{fontSize: '0.6rem'}}>
                {Math.round(strand.health)} / {strand.maxHealth}
            </span>
        </div>
    );
};


export const StrandControl: React.FC<StrandControlProps> = ({ strand, onUpdate, onLearnMore, onTriggerUltimate, isFightModeActive }) => {
    const isDisabled = strand.isDefeated;

    return (
        <div className={`p-2 bg-black/30 rounded-md space-y-2 transition-opacity ${isDisabled ? 'opacity-40' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={strand.visible}
                        onChange={(e) => onUpdate(strand.name, { visible: e.target.checked })}
                        className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        disabled={isDisabled}
                    />
                    <label className="font-medium">{strand.name}</label>
                </div>
                <div className="flex items-center gap-2">
                    {strand.mood !== 'Neutral' && (
                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full">{strand.mood}</span>
                    )}
                    <button 
                        onClick={() => onLearnMore(strand)}
                        className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                        disabled={isDisabled}
                    >
                        Lore
                    </button>
                </div>
            </div>
            
            {isFightModeActive && <HealthBar strand={strand} />}

            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10">Speed</span>
                <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={strand.speed}
                    onChange={(e) => onUpdate(strand.name, { speed: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    disabled={isDisabled}
                />
            </div>
             <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10">Ult</span>
                <UltimateBar strand={strand} onClick={() => onTriggerUltimate(strand.id)} disabled={isDisabled} />
                <label htmlFor={`ult-toggle-${strand.id}`} className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input 
                            id={`ult-toggle-${strand.id}`} 
                            type="checkbox" 
                            className="sr-only" 
                            checked={strand.ultimateEnabled}
                            onChange={(e) => onUpdate(strand.name, { ultimateEnabled: e.target.checked })}
                            disabled={isDisabled}
                        />
                        <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${strand.ultimateEnabled ? 'translate-x-4 bg-purple-400' : ''}`}></div>
                    </div>
                </label>
            </div>
        </div>
    );
};