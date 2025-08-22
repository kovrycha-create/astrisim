import React from 'react';
import { Modal } from './Modal';
import { CollapsibleSection } from './CollapsibleSection';
import type { BoundaryType, AIAggression } from '../types';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: {
        globalSpeed: number;
        bounciness: number;
        friction: number;
        boundaryType: BoundaryType;
        combatStatMultiplier: number;
        ultimateChargeMultiplier: number;
        aiAggression: AIAggression;
        disableLowHpBehaviors: boolean;
    };
    onSettingChange: (setting: keyof SettingsPanelProps['settings'], value: any) => void;
}

const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-sm">
            <label className="text-gray-300">{label}</label>
            <span className="font-mono text-white bg-black/20 px-2 py-0.5 rounded">{value.toFixed(2)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const ToggleControl: React.FC<{
    label: string;
    options: string[];
    value: string;
    onChange: (value: any) => void;
}> = ({ label, options, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-sm text-gray-300">{label}</label>
        <div className="flex items-center gap-1 p-1 bg-black/30 rounded-full">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${value.toLowerCase() === option.toLowerCase() ? 'bg-purple-600' : 'hover:bg-white/20'}`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);


export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onSettingChange }) => {
    if (!isOpen) return null;

    return (
        <Modal title="Simulation Settings" onClose={onClose}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-white">
                <CollapsibleSection title="Simulation & Physics" isOpen={true} onToggle={() => {}}>
                    <div className="space-y-4 p-2 bg-black/20 rounded">
                        <SliderControl
                            label="Global Speed"
                            value={settings.globalSpeed}
                            min={0.1} max={3.0} step={0.1}
                            onChange={(v) => onSettingChange('globalSpeed', v)}
                        />
                         <SliderControl
                            label="Bounciness"
                            value={settings.bounciness}
                            min={0.1} max={1.5} step={0.05}
                            onChange={(v) => onSettingChange('bounciness', v)}
                        />
                         <SliderControl
                            label="Friction"
                            value={settings.friction}
                            min={0.9} max={1.0} step={0.005}
                            onChange={(v) => onSettingChange('friction', v)}
                        />
                        <ToggleControl
                            label="World Boundaries"
                            options={['Bounce', 'Wrap']}
                            value={settings.boundaryType}
                            onChange={(v) => onSettingChange('boundaryType', v.toUpperCase())}
                        />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Combat Parameters" isOpen={true} onToggle={() => {}}>
                     <div className="space-y-4 p-2 bg-black/20 rounded">
                        <SliderControl
                            label="Fight Stats Multiplier"
                            value={settings.combatStatMultiplier}
                            min={0.25} max={2.0} step={0.05}
                            onChange={(v) => onSettingChange('combatStatMultiplier', v)}
                        />
                         <SliderControl
                            label="Ultimate Charge Rate"
                            value={settings.ultimateChargeMultiplier}
                            min={0.1} max={5.0} step={0.1}
                            onChange={(v) => onSettingChange('ultimateChargeMultiplier', v)}
                        />
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="AI Behavior" isOpen={true} onToggle={() => {}}>
                     <div className="space-y-4 p-2 bg-black/20 rounded">
                        <ToggleControl
                            label="AI Aggression"
                            options={['Passive', 'Normal', 'Aggressive']}
                            value={settings.aiAggression}
                            onChange={(v) => onSettingChange('aiAggression', v.toUpperCase())}
                        />
                         <ToggleControl
                            label="Low-HP Behaviors"
                            options={['Enabled', 'Disabled']}
                            value={!settings.disableLowHpBehaviors ? 'Enabled' : 'Disabled'}
                            onChange={(v) => onSettingChange('disableLowHpBehaviors', v === 'Disabled')}
                        />
                    </div>
                </CollapsibleSection>
            </div>
        </Modal>
    );
};
