import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AnalyticsTab } from './components/AnalyticsTab';

const channel = new BroadcastChannel('astrisim-state');

const AnalyticsApp = () => {
    const [simState, setSimState] = useState<any | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'STATE_UPDATE') {
                setSimState(event.data.payload);
            }
        };
        channel.addEventListener('message', handleMessage);
        
        // Request initial state when the component mounts
        channel.postMessage({ type: 'REQUEST_INITIAL_STATE' });

        return () => channel.removeEventListener('message', handleMessage);
    }, []);

    if (!simState) {
        return <div className="p-4 text-white">Connecting to simulation...</div>;
    }

    return (
        <AnalyticsTab
            stats={simState.simulationStats}
            relationshipMatrix={simState.relationshipMatrix}
        />
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AnalyticsApp />
  </React.StrictMode>
);
