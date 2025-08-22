import React from 'react';
import type { Strand } from '../types';

interface VictoryScreenProps {
    winner: Strand | null;
    onReset: () => void;
    onViewReport: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ winner, onReset, onViewReport }) => {
    const imageUrl = winner?.imageUrl ?? winner?.image?.src;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
            <div className="text-center text-white p-8 rounded-lg bg-gray-900/50 border-2 border-purple-500 shadow-2xl animate-fade-in relative">
                <h1 className="text-6xl font-bold text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.7)] mb-2 animate-pulse">
                    {winner ? 'VICTORY' : 'DRAW'}
                </h1>
                {winner && (
                    <div className="my-6 flex flex-col items-center">
                         {imageUrl && <img src={imageUrl} alt={winner.name} className="w-32 h-32 rounded-full border-4 border-yellow-400 shadow-lg"/>}
                        <p className="text-3xl font-semibold mt-4">
                            <span className="text-purple-300">{winner.name}</span> is the winner!
                        </p>
                    </div>
                )}
                 {!winner && (
                    <p className="text-2xl font-semibold my-10">All combatants have been defeated.</p>
                )}
                <div className="flex gap-4">
                    <button
                        onClick={onReset}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xl transition-transform transform hover:scale-105"
                    >
                        Fight Again
                    </button>
                    <button
                        onClick={onViewReport}
                        className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg text-xl transition-transform transform hover:scale-105"
                    >
                        View Battle Report
                    </button>
                </div>
            </div>
        </div>
    );
};