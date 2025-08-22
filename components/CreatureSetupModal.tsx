
import React, { useState } from 'react';
import type { CreatureType } from '../types';
import { Modal } from './Modal';

interface CreatureSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartFight: (teamA: CreatureType[], teamB: CreatureType[]) => void;
}

export const CreatureSetupModal: React.FC<CreatureSetupModalProps> = ({ isOpen, onClose, onStartFight }) => {
    
    const handleStart = () => {
        // For now, hardcode a 1v1 fight
        onStartFight(['NIT_LINE'], ['BLOOM_WILT']);
    };

    if (!isOpen) return null;

    return (
        <Modal title="Creature Fight Setup" onClose={onClose}>
            <div className="space-y-6 text-white">
                <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-300">Choose Combatants</h3>
                    <div className="p-4 bg-black/30 rounded-lg">
                        <p className="text-center text-gray-300">
                            A 1v1 battle will be set up between the two available creature lines:
                        </p>
                        <div className="flex justify-around items-center mt-4">
                            <div className="text-center">
                                <p className="text-xl font-bold text-blue-300">Nit Evolution Line</p>
                                <p className="text-sm text-gray-400">The Quiet Spark</p>
                            </div>
                            <p className="text-2xl font-bold">VS</p>
                            <div className="text-center">
                                <p className="text-xl font-bold text-green-300">Bloom/Wilt</p>
                                <p className="text-sm text-gray-400">The Cycle Keeper</p>
                            </div>
                        </div>
                         <p className="text-xs text-gray-500 text-center mt-6">
                            (Future versions will allow for 2v2 and other matchups)
                        </p>
                    </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-purple-500/20">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleStart} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                        Start 1v1 Fight
                    </button>
                </div>
            </div>
        </Modal>
    );
};
