import React from 'react';
import type { Strand, StrandName } from '../types';
import { SparklesIcon } from './Icons';
import { STRAND_ULTIMATE_STATS } from '../constants';

interface StrandControlProps {
    strand: Strand;
    onUpdate: (name: StrandName, updates: Partial<Strand>) => void;
    onLearnMore: (strand: Strand) => void;
    onTriggerUltimate: (id: number) => void;
    isFightModeActive: boolean;
    isFocusModeActive?: boolean;
    onSetFocusedStrand?: (id: number | null) => void;
    // Drag-and-drop props
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
    isDragging?: boolean;
    isDragOver?: boolean;
}

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

const UltimateBar: React.FC<{strand: Strand, onTriggerUltimate: (id: number) => void}> = ({ strand, onTriggerUltimate }) => {
    const chargePercent = (strand.ultimateCharge / strand.maxUltimateCharge) * 100;
    const isReady = chargePercent >= 100 && strand.ultimateCooldown <= 0;
    
    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onTriggerUltimate(strand.id)}
                disabled={!isReady}
                className={`p-1 rounded-md transition-colors ${isReady ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 opacity-50 cursor-not-allowed'}`}
                title="Trigger Ultimate"
            >
                <SparklesIcon className="w-4 h-4" />
            </button>
            <div className="w-full bg-gray-900 rounded-full h-3 relative overflow-hidden border border-gray-700">
                {strand.ultimateCooldown > 0 ? (
                    <div className="h-full rounded-full bg-red-800" style={{width: `${(strand.ultimateCooldown / STRAND_ULTIMATE_STATS[strand.name].cooldown) * 100}%`}}></div>
                ) : (
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${chargePercent}%` }}></div>
                )}
                <span className="absolute inset-0 flex items-center justify-center text-white/90 font-bold" style={{fontSize: '0.6rem'}}>
                    {strand.ultimateCooldown > 0 ? `${strand.ultimateCooldown.toFixed(1)}s` : `${Math.floor(chargePercent)}%`}
                </span>
            </div>
        </div>
    );
};


export const StrandControl: React.FC<StrandControlProps> = ({ 
    strand, 
    onUpdate, 
    onLearnMore, 
    onTriggerUltimate, 
    isFightModeActive,
    isFocusModeActive,
    onSetFocusedStrand,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onDragLeave,
    isDragging,
    isDragOver,
}) => {
    const isDisabled = strand.isDefeated;
    const imageUrl = strand.image?.src;
    const isDraggable = onDragStart && !isFightModeActive;
    
    const isSelectableForFocus = isFocusModeActive && !isDisabled && strand.visible;

    const handleClick = () => {
        if (isSelectableForFocus && onSetFocusedStrand) {
            onSetFocusedStrand(strand.id);
        }
    };

    return (
        <div 
            onClick={handleClick}
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            onDragLeave={onDragLeave}
            className={`p-2 bg-black/30 rounded-lg space-y-2 transition-all duration-150
                ${isDisabled ? 'opacity-40' : ''}
                ${isDragging ? 'opacity-30' : ''}
                ${isDragOver ? 'bg-purple-500/30 ring-2 ring-purple-400' : ''}
                ${isDraggable ? 'cursor-move' : ''}
                ${isSelectableForFocus ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900 cursor-pointer hover:bg-purple-500/20' : ''}
            `}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {imageUrl && <img src={imageUrl} alt={strand.name} className="w-8 h-8 rounded-full" />}
                    <div className="flex items-center gap-1.5">
                        <input
                            type="checkbox"
                            checked={strand.visible}
                            onChange={(e) => onUpdate(strand.name, { visible: e.target.checked })}
                            className="form-checkbox h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                            disabled={isDisabled || isFightModeActive}
                            title={isFightModeActive ? "Visibility cannot be changed during a fight." : ""}
                        />
                        <label className="font-semibold text-sm truncate">{strand.name}</label>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {strand.mood !== 'Neutral' && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded-full">{strand.mood}</span>
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onLearnMore(strand); }}
                        className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                        disabled={isDisabled}
                    >
                        Lore
                    </button>
                </div>
            </div>
            
            {isFightModeActive && (
                <div className="space-y-1">
                    <HealthBar strand={strand} />
                    <UltimateBar strand={strand} onTriggerUltimate={onTriggerUltimate} />
                </div>
            )}


            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8">Speed</span>
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
                 <span className="text-xs font-mono text-white w-8 text-center">{strand.speed.toFixed(1)}</span>
            </div>
        </div>
    );
};