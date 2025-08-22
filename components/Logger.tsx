import React from 'react';
import type { LogEntry } from '../types';
import { SwordIcon, CrystalIcon, MegaphoneIcon, SparklesIcon, FightIcon } from './Icons';

interface LoggerProps {
    logs: LogEntry[];
}

const getLogIcon = (message: string) => {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('fight mode')) return <FightIcon className="text-red-400" />;
    if (lowerCaseMessage.includes('sudden death')) return <SwordIcon className="text-orange-400" />;
    if (lowerCaseMessage.includes('winner') || lowerCaseMessage.includes('draw')) return <SwordIcon className="text-yellow-400" />;
    if (lowerCaseMessage.includes('used')) return <SparklesIcon className="text-purple-400" />;
    if (lowerCaseMessage.includes('crystal whisper') || lowerCaseMessage.includes('lore')) return <CrystalIcon className="text-fuchsia-400" />;
    if (lowerCaseMessage.includes('meteor shower') || lowerCaseMessage.includes('speed boost zone') || lowerCaseMessage.includes('colors are shifting') || lowerCaseMessage.includes('has formed')) return <MegaphoneIcon className="text-cyan-400"/>;
    return <span className="text-gray-600 font-bold text-xs">●</span>;
};


export const Logger: React.FC<LoggerProps> = ({ logs }) => {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold text-purple-300 mb-2 flex-shrink-0">Event Log</h2>
            <div className="overflow-y-auto flex-grow text-sm font-mono bg-black/20 p-2 rounded h-full">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 mb-1">
                        <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center pt-0.5">{getLogIcon(log.message)}</div>
                        <span className="text-gray-300 break-words w-full">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};