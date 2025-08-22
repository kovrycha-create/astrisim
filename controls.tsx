import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { ControlPanel } from './components/ControlPanel';
import { Modal } from './components/Modal';
import { getStrandDescription } from './services/geminiService';
import type { Strand, StrandName, GameMode, Theme } from './types';

const channel = new BroadcastChannel('astrisim-state');

const ControlsApp = () => {
    const [simState, setSimState] = useState<any | null>(null);
    const [selectedStrand, setSelectedStrand] = useState<Strand | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [isLoadingModal, setIsLoadingModal] = useState(false);
    
    const [sectionsVisibility, setSectionsVisibility] = useState({
        globalControls: true,
        strandManager: true,
        eventLog: true,
    });

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'STATE_UPDATE') {
                setSimState(event.data.payload);
            }
        };
        channel.addEventListener('message', handleMessage);
        
        channel.postMessage({ type: 'REQUEST_INITIAL_STATE' });

        return () => channel.removeEventListener('message', handleMessage);
    }, []);

    const postAction = useCallback((action: string, payload?: any) => {
        channel.postMessage({ type: 'ACTION', payload: { action, payload } });
    }, []);

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
    
    const handleStrandUpdate = (name: StrandName, updates: Partial<Strand>) => {
        postAction('update-strand', { name, updates });
    };

    if (!simState) {
        return <div className="p-4 text-white">Connecting to simulation...</div>;
    }

    return (
        <>
            <ControlPanel
                strands={simState.strands}
                onStrandUpdate={handleStrandUpdate}
                isPaused={simState.isPaused}
                onPauseToggle={() => postAction('toggle-pause')}
                isFightModeActive={simState.isFightModeActive}
                onFightToggle={() => postAction('toggle-fight-mode')}
                onTriggerSuddenDeath={() => postAction('trigger-sudden-death')}
                onTriggerUltimate={(id) => postAction('trigger-ultimate', id)}
                theme={simState.theme}
                onThemeChange={(theme) => postAction('change-theme', theme)}
                logs={simState.logs}
                onLearnMore={handleLearnMore}
                gameMode={simState.gameMode}
                onGameModeChange={(mode) => postAction('change-game-mode', mode)}
                isRelationshipOverlayVisible={simState.isRelationshipOverlayVisible}
                onToggleRelationshipOverlay={() => postAction('toggle-relationship-overlay')}
                sectionsVisibility={sectionsVisibility}
                onToggleSection={(section) => setSectionsVisibility(prev => ({...prev, [section]: !prev[section]}))}
            />
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
        </>
    );
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ControlsApp />
  </React.StrictMode>
);