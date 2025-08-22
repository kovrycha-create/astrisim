import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { WinTracker } from './components/WinTracker';
import { RealtimeAnalytics } from './components/RealtimeAnalytics';
import { VictoryScreen } from './components/VictoryScreen';
import { BattleReport } from './components/BattleReport';

const channel = new BroadcastChannel('astrisim-state');

const TrackerApp = () => {
    const [simState, setSimState] = useState<any | null>(null);
    const [isBattleReportVisible, setIsBattleReportVisible] = useState(false);

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

    const handleReset = () => {
        setIsBattleReportVisible(false);
        postAction('reset-fight');
    }

    const handleViewReport = () => {
        setIsBattleReportVisible(true);
    }
    
    if (!simState) {
        return <div className="p-4 text-white">Connecting to simulation...</div>;
    }
    
    if (isBattleReportVisible) {
        return (
            <BattleReport 
                report={simState.battleReport} 
                onClose={() => setIsBattleReportVisible(false)}
            />
        );
    }

    if (simState.isVictoryScreenVisible) {
        return (
            <VictoryScreen 
                winner={simState.winner} 
                onReset={handleReset} 
                onViewReport={handleViewReport}
            />
        );
    }

    if (simState.isFightModeActive) {
        return (
            <RealtimeAnalytics
                report={simState.battleReport}
                historyData={simState.fightHistoryData}
                duration={simState.fightDuration}
                strands={simState.strands}
            />
        );
    }

    return (
        <div className="p-4 h-full animate-fade-in">
            <WinTracker winHistory={simState.winHistory} strands={simState.strands} />
        </div>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TrackerApp />
  </React.StrictMode>
);