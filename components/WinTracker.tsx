import React from 'react';
import type { StrandName } from '../types';
import { CrownIcon } from './Icons';

interface WinTrackerProps {
    winHistory: StrandName[];
}

export const WinTracker: React.FC<WinTrackerProps> = ({ winHistory }) => {
    if (winHistory.length === 0) {
        return null;
    }

    const [latestWinner, ...previousWinners] = winHistory;

    return (
        <div className="absolute top-4 right-4 z-10 p-3 bg-black/60 backdrop-blur-md rounded-lg text-white w-52 shadow-lg animate-fade-in">
            <h3 className="text-sm font-bold text-purple-300 mb-2 border-b border-purple-300/20 pb-1">RECENT VICTORS</h3>
            
            {/* Latest Winner */}
            <div className="flex items-center gap-2 mb-2">
                <CrownIcon className="w-6 h-6 text-yellow-400" />
                <span className="text-lg font-semibold text-yellow-300">{latestWinner}</span>
            </div>

            {/* History */}
            {previousWinners.length > 0 && (
                <ul className="text-sm space-y-1 pl-2">
                    {previousWinners.map((winner, index) => (
                        <li key={index} className="text-gray-400 opacity-80">
                           <span className="mr-2">{index + 2}.</span>{winner}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
