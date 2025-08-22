import React, { useState, useMemo } from 'react';
import type { StrandName, FightSettings, FightModeType } from '../types';
import { STRAND_NAMES } from '../constants';
import { Modal } from './Modal';

interface FightSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartFight: (settings: FightSettings) => void;
}

const RadioButton: React.FC<{ label: string; value: FightModeType; current: FightModeType; onChange: (value: FightModeType) => void; description: string }> = ({ label, value, current, onChange, description }) => (
    <label className={`block p-3 rounded-lg cursor-pointer transition-all ${current === value ? 'bg-purple-600/30 ring-2 ring-purple-500' : 'bg-black/30 hover:bg-white/10'}`}>
        <div className="flex items-center">
            <input
                type="radio"
                name="fight-mode"
                checked={current === value}
                onChange={() => onChange(value)}
                className="form-radio h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"
            />
            <span className="ml-3 font-semibold">{label}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 ml-7">{description}</p>
    </label>
);

const StrandSelector: React.FC<{ value: StrandName | null, onChange: (value: StrandName) => void, placeholder: string, disabledValues?: (StrandName | null)[] }> = ({ value, onChange, placeholder, disabledValues = [] }) => {
    const availableOptions = useMemo(() => STRAND_NAMES.filter(name => !disabledValues.includes(name)), [disabledValues]);
    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value as StrandName)}
            className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:ring-purple-500 focus:border-purple-500"
        >
            <option value="" disabled>{placeholder}</option>
            {availableOptions.map(name => (
                <option key={name} value={name}>{name}</option>
            ))}
        </select>
    );
};

export const FightSetupModal: React.FC<FightSetupModalProps> = ({ isOpen, onClose, onStartFight }) => {
    const [mode, setMode] = useState<FightModeType>('NORMAL');
    const [disableRelationships, setDisableRelationships] = useState(false);
    const [mirrorStrand, setMirrorStrand] = useState<StrandName | null>(null);
    const [duelStrand1, setDuelStrand1] = useState<StrandName | null>(null);
    const [duelStrand2, setDuelStrand2] = useState<StrandName | null>(null);
    const [duelAttraction, setDuelAttraction] = useState(true);
    
    const isStartDisabled = useMemo(() => {
        if (mode === 'MIRROR' && !mirrorStrand) return true;
        if (mode === 'DUEL' && (!duelStrand1 || !duelStrand2)) return true;
        return false;
    }, [mode, mirrorStrand, duelStrand1, duelStrand2]);
    
    const handleStart = () => {
        if (isStartDisabled) return;
        
        onStartFight({
            mode,
            disableRelationships,
            mirrorStrand: mode === 'MIRROR' ? mirrorStrand : undefined,
            duelStrands: mode === 'DUEL' ? [duelStrand1, duelStrand2] : undefined,
            duelAttraction: mode === 'DUEL' ? duelAttraction : undefined,
        });
    };
    
    const handleModeChange = (newMode: FightModeType) => {
        setMode(newMode);
        // Reset specific settings when mode changes
        setMirrorStrand(null);
        setDuelStrand1(null);
        setDuelStrand2(null);
        setDuelAttraction(true);
    };

    if (!isOpen) return null;

    return (
        <Modal title="Fight Setup" onClose={onClose}>
            <div className="space-y-6 text-white">
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-300">Fight Mode</h3>
                    <div className="space-y-2">
                        <RadioButton label="Normal" value="NORMAL" current={mode} onChange={handleModeChange} description="A standard battle with all active Strands." />
                        <RadioButton label="2x Mode" value="DOUBLE" current={mode} onChange={handleModeChange} description="Duplicates every active Strand for a chaotic battle." />
                        <RadioButton label="Mirror Match" value="MIRROR" current={mode} onChange={handleModeChange} description="A 12-Strand free-for-all using only one type of Strand." />
                        <RadioButton label="Duel" value="DUEL" current={mode} onChange={handleModeChange} description="A 1v1 battle between two selected Strands of immense size." />
                    </div>
                </div>

                {mode === 'MIRROR' && (
                    <div className="pl-8 animate-fade-in">
                        <StrandSelector value={mirrorStrand} onChange={setMirrorStrand} placeholder="Select a Strand for Mirror Match" />
                    </div>
                )}
                
                {mode === 'DUEL' && (
                     <div className="pl-8 space-y-2 animate-fade-in">
                        <StrandSelector value={duelStrand1} onChange={setDuelStrand1} placeholder="Select Combatant 1" disabledValues={[duelStrand2]}/>
                        <StrandSelector value={duelStrand2} onChange={setDuelStrand2} placeholder="Select Combatant 2" disabledValues={[duelStrand1]}/>
                        <label className="flex items-center p-2 rounded-lg bg-black/20 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={duelAttraction}
                                onChange={(e) => setDuelAttraction(e.target.checked)}
                                className="form-checkbox h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"
                            />
                            <span className="ml-3 text-sm">Attract Combatants</span>
                        </label>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-300">Rules</h3>
                    <label className="flex items-center p-3 rounded-lg bg-black/30 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={disableRelationships}
                            onChange={(e) => setDisableRelationships(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-purple-600 bg-gray-800 border-gray-600 focus:ring-purple-500"
                        />
                        <span className="ml-3">Disable Relationships</span>
                    </label>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-purple-500/20">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleStart} disabled={isStartDisabled} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        Start Fight
                    </button>
                </div>
            </div>
        </Modal>
    );
};