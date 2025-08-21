import React, { useMemo } from 'react';
import type { SimulationStats, RelationshipMatrix, StrandName, PlayerTool } from '../types';
import { RelationshipLevel } from '../types';
import { AnalyticsIcon, ChevronRightIcon, ChevronLeftIcon } from './Icons';
import { STRAND_NAMES } from '../constants';

interface AnalyticsTabProps {
    isVisible: boolean;
    onToggleVisibility: () => void;
    stats: SimulationStats;
    relationshipMatrix: RelationshipMatrix;
}

const StatCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/5 p-3 rounded-lg">
        <h3 className="text-sm font-semibold text-purple-300 mb-2">{title}</h3>
        <div className="space-y-1 text-gray-300 text-sm">{children}</div>
    </div>
);

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono font-semibold text-white">{value}</span>
    </div>
);


export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ isVisible, onToggleVisibility, stats, relationshipMatrix }) => {

    const derivedStats = useMemo(() => {
        let alliances = 0;
        let rivalries = 0;
        let strongestBond = { names: 'N/A', score: RelationshipLevel.Friend - 0.01 };
        let fiercestRivalry = { names: 'N/A', score: RelationshipLevel.MortalEnemy + 0.01 };

        const checkedPairs = new Set<string>();
        for (const s1 of STRAND_NAMES) {
            for (const s2 of STRAND_NAMES) {
                if (s1 === s2) continue;
                const pairKey = [s1, s2].sort().join('-');
                if (checkedPairs.has(pairKey)) continue;

                const score = relationshipMatrix[s1]?.[s2];
                if (score !== undefined) {
                    if (score >= RelationshipLevel.Friend) alliances++;
                    if (score <= RelationshipLevel.MortalEnemy) rivalries++;
                    
                    if (score > strongestBond.score) {
                        strongestBond = { names: `${s1} & ${s2}`, score };
                    }
                    if (score < fiercestRivalry.score) {
                        fiercestRivalry = { names: `${s1} & ${s2}`, score };
                    }
                }
                checkedPairs.add(pairKey);
            }
        }
        
        const mostUsedUltimate = [...stats.totalUltimatesUsed.entries()].reduce((max, entry) => entry[1] > max[1] ? entry : max, [null, 0]);
        
        const mostUsedTool = [...stats.player.timeWithToolActive.entries()].reduce((max, entry) => entry[1] > max[1] ? entry : max, [null, 0]);
        
        const mostUsedAbility = [...stats.player.abilitiesUsed.entries()].reduce((max, entry) => entry[1] > max[1] ? entry : max, [null, 0]);

        return {
            alliances,
            rivalries,
            strongestBondName: strongestBond.names,
            fiercestRivalryName: fiercestRivalry.names,
            mostUsedUltimateName: mostUsedUltimate[0] ?? 'N/A',
            mostUsedUltimateCount: mostUsedUltimate[1],
            mostUsedToolName: mostUsedTool[0] ?? 'N/A',
            mostUsedAbilityName: mostUsedAbility[0] ?? 'N/A',
        };
    }, [relationshipMatrix, stats]);

    const sessionDuration = useMemo(() => {
        const seconds = Math.floor((Date.now() - stats.sessionStartTime) / 1000);
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }, [stats.sessionStartTime]);


    return (
        <>
            <button
                onClick={onToggleVisibility}
                className={`absolute top-1/2 -translate-y-1/2 right-4 z-20 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all duration-300 shadow-lg ${isVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                aria-label="Expand Analytics Panel"
            >
                <AnalyticsIcon />
            </button>
            
            <div className={`absolute top-0 right-0 h-full p-4 flex flex-col gap-4 bg-black/60 backdrop-blur-md text-white w-80 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out z-10 ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex-shrink-0 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-purple-300">Session Analytics</h2>
                     <button onClick={onToggleVisibility} className="p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Minimize Panel">
                        <ChevronRightIcon />
                    </button>
                </div>

                <StatCard title="Session Overview">
                    <StatItem label="Runtime" value={sessionDuration} />
                    <StatItem label="Anomalies Collected" value={stats.anomaliesCollected} />
                </StatCard>

                <StatCard title="Relationship Analysis">
                    <StatItem label="Total Alliances" value={derivedStats.alliances} />
                    <StatItem label="Total Rivalries" value={derivedStats.rivalries} />
                     <div className="pt-1 mt-1 border-t border-white/10">
                         <StatItem label="Strongest Bond" value={derivedStats.strongestBondName} />
                         <StatItem label="Fiercest Rivalry" value={derivedStats.fiercestRivalryName} />
                    </div>
                </StatCard>
                
                <StatCard title="Performance Metrics">
                     <StatItem label="Total Collisions" value={stats.totalCollisions.toLocaleString()} />
                     <StatItem label="Ultimates Used" value={[...stats.totalUltimatesUsed.values()].reduce((a,b) => a + b, 0)} />
                     <div className="pt-1 mt-1 border-t border-white/10">
                        <StatItem label="Most Active" value={`${derivedStats.mostUsedUltimateName} (${derivedStats.mostUsedUltimateCount})`} />
                    </div>
                </StatCard>

                <StatCard title="Player Mode Stats">
                    <StatItem label="Aether Spent" value={Math.round(stats.player.aetherSpent).toLocaleString()} />
                    <StatItem label="Gravity Anchor Time" value={`${stats.player.gravityAnchorTime.toFixed(1)}s`} />
                     <div className="pt-1 mt-1 border-t border-white/10">
                        <StatItem label="Most Used Tool" value={derivedStats.mostUsedToolName} />
                        <StatItem label="Most Used Ability" value={derivedStats.mostUsedAbilityName} />
                    </div>
                </StatCard>

            </div>
        </>
    );
};