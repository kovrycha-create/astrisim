import React from 'react';
import type { Strand, StrandName } from '../types';
import { CrownIcon } from './Icons';

interface WinTrackerProps {
    winHistory: StrandName[];
    strands: Strand[];
}

export const WinTracker: React.FC<WinTrackerProps> = ({ winHistory, strands }) => {
    if (winHistory.length === 0) {
        return (
            <div className="p-3 bg-gray-900/80 rounded-lg text-white w-full h-full flex flex-col border-2 border-purple-500/20 backdrop-blur-lg">
                <h3 className="text-xl text-center font-bold text-yellow-300 border-b-2 border-yellow-300/20 pb-2 mb-4">HALL OF FAME</h3>
                <div className="flex-grow flex items-center justify-center text-gray-400">
                    No victors yet.
                </div>
            </div>
        );
    }
    
    const getImageUrl = (name: StrandName) => {
        const strand = strands.find(s => s.name === name);
        return strand?.image?.src;
    };

    const winners = winHistory.slice(0, 5).map(name => ({
        name,
        imageUrl: getImageUrl(name),
    }));

    const [first, second, third, ...others] = winners;

    return (
        <div className="p-4 bg-gray-900/80 rounded-lg text-white w-full h-full flex flex-col border-2 border-purple-500/20 backdrop-blur-lg">
            <h3 className="text-xl text-center font-bold text-yellow-300 border-b-2 border-yellow-300/20 pb-2 mb-4">HALL OF FAME</h3>
            <div className="flex-grow flex flex-col justify-around">
                {/* Podium */}
                <div className="flex items-end justify-center gap-4">
                    {second && second.imageUrl && (
                        <div className="text-center flex flex-col items-center animate-fade-in" style={{animationDelay: '200ms'}}>
                            <img src={second.imageUrl} alt={second.name} className="w-16 h-16 rounded-full border-4 border-gray-400"/>
                            <span className="font-semibold mt-1">{second.name}</span>
                            <div className="bg-gray-400 text-gray-900 font-bold w-16 h-12 flex items-center justify-center text-2xl rounded-t-md">2</div>
                        </div>
                    )}
                     {first && first.imageUrl && (
                        <div className="text-center flex flex-col items-center animate-fade-in">
                            <CrownIcon className="w-8 h-8 text-yellow-400 mb-1"/>
                            <img src={first.imageUrl} alt={first.name} className="w-24 h-24 rounded-full border-4 border-yellow-400"/>
                            <span className="font-bold text-lg mt-1">{first.name}</span>
                            <div className="bg-yellow-400 text-yellow-900 font-bold w-20 h-20 flex items-center justify-center text-4xl rounded-t-md">1</div>
                        </div>
                    )}
                     {third && third.imageUrl && (
                        <div className="text-center flex flex-col items-center animate-fade-in" style={{animationDelay: '400ms'}}>
                            <img src={third.imageUrl} alt={third.name} className="w-16 h-16 rounded-full border-4 border-orange-400"/>
                            <span className="font-semibold mt-1">{third.name}</span>
                            <div className="bg-orange-400 text-orange-900 font-bold w-16 h-10 flex items-center justify-center text-xl rounded-t-md">3</div>
                        </div>
                    )}
                </div>
                {/* Other recent winners */}
                {others.length > 0 && (
                    <div className="mt-4 pt-2 border-t border-purple-300/10">
                        <h4 className="text-xs text-center text-gray-400">RECENT</h4>
                         <ul className="text-sm space-y-1 text-center mt-1">
                            {others.map((winner, index) => (
                                <li key={index} className="text-gray-300 opacity-80">
                                   <span className="mr-2 text-gray-500">{index + 4}.</span>{winner.name}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
