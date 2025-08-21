
import React from 'react';
import type { LogEntry } from '../types';

interface LoggerProps {
    logs: LogEntry[];
}

export const Logger: React.FC<LoggerProps> = ({ logs }) => {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-2 flex-shrink-0">Event Log</h2>
            <div className="overflow-y-auto flex-grow text-sm font-mono bg-black/20 p-2 rounded">
                {logs.map((log) => (
                    <div key={log.id} className="flex">
                        <span className="text-gray-500 mr-2 flex-shrink-0">{log.timestamp}</span>
                        <span className="text-gray-300">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
