
import React, { useState } from 'react';
import type { Strand, StrandName, Theme, LogEntry, GameMode } from '../types';
import { StrandControl } from './StrandControl';
import { GlobalControlsPanel } from './GlobalControlsPanel';
import { Logger } from './Logger';
import { CollapsibleSection } from './CollapsibleSection';
import { CrosshairIcon, CameraIcon } from './Icons';

interface ControlPanelProps {
    strands: Strand[];
    onStrandUpdate: (name: StrandName, updates: Partial<Strand>) => void;
    onTriggerUltimate: (strandId: number) => void;
    onLearnMore: (strand: Strand) => void;
    isFightModeActive: boolean;
    onStrandOrderChange?: (strands: Strand[]) => void;
    isFocusModeActive?: boolean;
    onToggleFocusMode?: () => void;
    onSetFocusedStrand?: (id: number | null) => void;
    isActionCamActive?: boolean;
    onToggleActionCam?: () => void;
    // Props for the full control panel view (from controls.tsx)
    isPaused?: boolean;
    onPauseToggle?: () => void;
    onFightToggle?: () => void;
    onTriggerSuddenDeath?: () => void;
    theme?: Theme;
    onThemeChange?: (theme: Theme) => void;
    logs?: LogEntry[];
    gameMode?: GameMode;
    onGameModeChange?: (mode: GameMode) => void;
    isRelationshipOverlayVisible?: boolean;
    onToggleRelationshipOverlay?: () => void;
    sectionsVisibility?: {
        globalControls: boolean;
        strandManager: boolean;
        eventLog: boolean;
    };
    onToggleSection?: (section: 'globalControls' | 'strandManager' | 'eventLog') => void;
}


export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const [draggingStrandId, setDraggingStrandId] = useState<number | null>(null);
    const [dragOverStrandId, setDragOverStrandId] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, strandId: number) => {
        setDraggingStrandId(strandId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', strandId.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, strandId: number) => {
        e.preventDefault();
        if (strandId !== dragOverStrandId) {
            setDragOverStrandId(strandId);
        }
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setDragOverStrandId(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetStrandId: number) => {
        if (draggingStrandId === null || draggingStrandId === dropTargetStrandId) {
            setDragOverStrandId(null);
            setDraggingStrandId(null);
            return;
        }

        const newStrandsOrder = [...props.strands];
        const draggingIndex = newStrandsOrder.findIndex(s => s.id === draggingStrandId);
        const dropIndex = newStrandsOrder.findIndex(s => s.id === dropTargetStrandId);

        if (draggingIndex === -1 || dropIndex === -1) return;

        const [draggedItem] = newStrandsOrder.splice(draggingIndex, 1);
        newStrandsOrder.splice(dropIndex, 0, draggedItem);

        props.onStrandOrderChange?.(newStrandsOrder);

        setDragOverStrandId(null);
        setDraggingStrandId(null);
    };

    const handleDragEnd = () => {
        setDragOverStrandId(null);
        setDraggingStrandId(null);
    };


    // Check if we are in the multi-window 'controls' context vs the main app context
    if (!props.sectionsVisibility) {
        // Render original Strand Manager for main App.tsx
        return (
            <div className="h-full flex flex-col gap-4 bg-gray-900/80 backdrop-blur-lg text-white w-full shadow-2xl overflow-y-hidden animate-fade-in border-2 border-purple-500/20 rounded-lg">
                <div className="flex-shrink-0 flex items-center justify-between border-b-2 border-purple-500/20 pb-4 p-4">
                     <button 
                        onClick={props.onToggleActionCam}
                        disabled={!props.isFightModeActive}
                        title={!props.isFightModeActive ? "Only available during fights" : (props.isActionCamActive ? "Disable Action Cam" : "Enable Action Cam")}
                        className={`p-2 rounded-full transition-colors ${props.isActionCamActive ? 'bg-purple-600' : 'bg-gray-700/50 hover:bg-purple-700'} ${!props.isFightModeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                         <CameraIcon className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-bold text-purple-300 tracking-wider">Strand Manager</h1>
                    <button 
                        onClick={props.onToggleFocusMode}
                        title={props.isFocusModeActive ? "Disable Focus Mode" : "Enable Focus Mode"}
                        className={`p-2 rounded-full transition-colors ${props.isFocusModeActive ? 'bg-purple-600' : 'bg-gray-700/50 hover:bg-purple-700'}`}
                    >
                         <CrosshairIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-grow flex flex-col min-h-0 px-4 pb-4">
                    <div className="overflow-y-auto flex-grow pr-2 grid grid-cols-2 gap-2 content-start">
                        {props.strands.map(strand => (
                            <StrandControl
                                key={strand.id}
                                strand={strand}
                                onUpdate={props.onStrandUpdate}
                                onLearnMore={props.onLearnMore}
                                onTriggerUltimate={props.onTriggerUltimate}
                                isFightModeActive={props.isFightModeActive}
                                onDragStart={(e) => handleDragStart(e, strand.id)}
                                onDragOver={(e) => handleDragOver(e, strand.id)}
                                onDrop={(e) => handleDrop(e, strand.id)}
                                onDragEnd={handleDragEnd}
                                onDragLeave={handleDragLeave}
                                isDragging={draggingStrandId === strand.id}
                                isDragOver={dragOverStrandId === strand.id && draggingStrandId !== strand.id}
                                isFocusModeActive={props.isFocusModeActive}
                                onSetFocusedStrand={props.onSetFocusedStrand}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Render new full control panel for controls.tsx
    return (
        <div className="h-full flex flex-col gap-4 bg-gray-900/80 backdrop-blur-lg text-white w-full shadow-2xl overflow-y-auto animate-fade-in border-2 border-purple-500/20 rounded-lg p-4 space-y-4">
            <CollapsibleSection
                title="Global Controls"
                isOpen={props.sectionsVisibility.globalControls}
                onToggle={() => props.onToggleSection!('globalControls')}
            >
                <GlobalControlsPanel
                    isPaused={props.isPaused!}
                    onPauseToggle={props.onPauseToggle!}
                    isFightModeActive={props.isFightModeActive}
                    onFightToggle={props.onFightToggle!}
                    onTriggerSuddenDeath={props.onTriggerSuddenDeath!}
                    theme={props.theme!}
                    onThemeChange={props.onThemeChange!}
                    gameMode={props.gameMode!}
                    onGameModeChange={props.onGameModeChange!}
                    isRelationshipOverlayVisible={props.isRelationshipOverlayVisible!}
                    onToggleRelationshipOverlay={props.onToggleRelationshipOverlay!}
                />
            </CollapsibleSection>

            <CollapsibleSection
                title="Strand Manager"
                isOpen={props.sectionsVisibility.strandManager}
                onToggle={() => props.onToggleSection!('strandManager')}
            >
                 <div className="space-y-2">
                    {props.strands.map(strand => (
                        <StrandControl
                            key={strand.id}
                            strand={strand}
                            onUpdate={props.onStrandUpdate}
                            onLearnMore={props.onLearnMore}
                            onTriggerUltimate={props.onTriggerUltimate}
                            isFightModeActive={props.isFightModeActive}
                        />
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection
                title="Event Log"
                isOpen={props.sectionsVisibility.eventLog}
                onToggle={() => props.onToggleSection!('eventLog')}
            >
                <div className="h-[300px]">
                    <Logger logs={props.logs!} />
                </div>
            </CollapsibleSection>
        </div>
    );
};
