
import React from 'react';
import type { Creature, Ability } from '../types';

interface CreatureHUDProps {
    creatures: Creature[];
}

const AbilityIcon: React.FC<{ ability: Ability, now: number }> = ({ ability, now }) => {
    const cooldownRemaining = Math.max(0, (ability.lastUsed + ability.cooldownDuration - now) / 1000);
    const isReady = cooldownRemaining <= 0;

    return (
        <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-md border-2 ${isReady ? 'border-purple-400' : 'border-gray-600'} bg-black/50 flex items-center justify-center relative overflow-hidden`}>
                <span className="text-xs text-center font-bold text-white p-1">{ability.name.split(' ').map(w => w[0]).join('')}</span>
                {!isReady && (
                    <div className="absolute bottom-0 left-0 right-0 bg-purple-800/70" style={{ height: `${(cooldownRemaining * 1000 / ability.cooldownDuration) * 100}%` }}></div>
                )}
                 {!isReady && (
                    <span className="absolute text-sm font-bold text-white">{cooldownRemaining.toFixed(1)}</span>
                )}
            </div>
             <span className="text-xs mt-1 text-gray-300 truncate w-12 text-center">{ability.name}</span>
        </div>
    );
};

const CreaturePanel: React.FC<{ creature: Creature, now: number }> = ({ creature, now }) => {
    const hpPercent = (creature.health / creature.maxHealth) * 100;
    
    return (
        <div className="w-[450px] bg-gray-900/80 backdrop-blur-md border-2 border-purple-500/30 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center gap-3">
                {creature.imageUrl && <img src={creature.imageUrl} alt={creature.state.name || creature.type} className="w-16 h-16 rounded-full" />}
                <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                        <h3 className="text-xl font-bold">{creature.state.name || creature.type}</h3>
                        <span className="text-sm font-mono text-gray-400">Stage {creature.evolutionStage}</span>
                    </div>
                    {/* HP Bar */}
                    <div className="w-full bg-gray-900 rounded-full h-5 relative overflow-hidden border border-gray-700 mt-1">
                        <div className="h-full rounded-full bg-green-500 transition-all duration-200 ease-linear" style={{ width: `${hpPercent}%` }}></div>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/90">{Math.round(creature.health)} / {creature.maxHealth}</span>
                    </div>
                </div>
            </div>
            
             {/* Special Gauges */}
            <div className="h-8">
            {creature.type === 'NIT_LINE' && creature.evolutionStage && creature.evolutionStage < 4 && (
                <div className="flex flex-col justify-center h-full">
                     <p className="text-xs text-gray-400 text-center">Evolves in: {Math.max(0, creature.evolutionProgress || 0).toFixed(1)}s</p>
                </div>
            )}
            {creature.type === 'BLOOM_WILT' && (
                <div className="flex gap-2 h-full items-center">
                    <div className="w-full bg-gray-800 rounded-full h-3 relative overflow-hidden border border-green-500/50">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${creature.state.verdantPressure || 0}%`}}></div>
                         <span className="absolute inset-0 text-xs font-bold flex items-center justify-center text-black/80">BLOOM</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 relative overflow-hidden border border-red-500/50">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${creature.state.hollowPressure || 0}%`}}></div>
                        <span className="absolute inset-0 text-xs font-bold flex items-center justify-center text-white/80">WILT</span>
                    </div>
                </div>
            )}
            </div>

            {/* Abilities */}
            <div className="flex justify-center gap-2 pt-2 border-t border-purple-500/20">
                {creature.abilities.map(ability => (
                    <AbilityIcon key={ability.name} ability={ability} now={now} />
                ))}
            </div>
        </div>
    );
};

export const CreatureHUD: React.FC<CreatureHUDProps> = ({ creatures }) => {
    const now = Date.now();
    const teamA = creatures.filter(c => c.team === 'A');
    const teamB = creatures.filter(c => c.team === 'B');

    return (
        <div className="flex justify-between w-screen max-w-[950px] p-4 text-white">
             {teamA.map(c => <CreaturePanel key={c.id} creature={c} now={now} />)}
             {teamB.map(c => <CreaturePanel key={c.id} creature={c} now={now} />)}
        </div>
    );
};
