import React, { useMemo } from 'react';
import type { SimulationStats, RelationshipMatrix, StrandName } from '../types';
import { RelationshipLevel } from '../types';
import { STRAND_NAMES } from '../constants';

const StatCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white/5 p-3 rounded-lg">
        <h3 className="text-sm font-semibold text-purple-300 mb-2">{title}</h3>
        <div className="space-y-2 text-gray-300 text-sm">{children}</div>
    </div>
);

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono font-semibold text-white">{value}</span>
    </div>
);

const StatBar: React.FC<{ value: number; max: number; color: string; label: string; }> = ({ value, max, color, label }) => {
    const widthPercent = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-mono font-semibold text-white">{typeof value === 'number' ? value.toFixed(1) + 's' : value}</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-3 relative overflow-hidden border border-gray-700">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                    style={{ width: `${widthPercent}%` }}
                ></div>
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: [string, number][]; title: string; color: string }> = ({ data, title, color }) => {
    if (data.length === 0) return null;
    const maxValue = Math.max(1, ...data.map(d => d[1]));
    return (
        <StatCard title={title}>
            <div className="space-y-2">
                {data.sort((a,b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => (
                    <div key={label} className="grid grid-cols-3 items-center gap-2">
                        <span className="text-xs text-gray-300 truncate col-span-1">{label}</span>
                        <div className="col-span-2">
                             <div className="w-full bg-gray-900 rounded-full h-4 relative overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${color}`}
                                    style={{ width: `${(value / maxValue) * 100}%` }}
                                ></div>
                                <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-white/90">
                                    {value}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </StatCard>
    );
};

interface AnalyticsTabProps {
    stats: SimulationStats;
    relationshipMatrix: RelationshipMatrix;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats, relationshipMatrix }) => {

    const ultimatesUsedArray = useMemo(() => Array.from(stats.ultimatesUsed.entries()), [stats.ultimatesUsed]);
    const timeWithToolActiveArray = useMemo(() => Array.from(stats.player.timeWithToolActive.entries()), [stats.player.timeWithToolActive]);
    const abilitiesUsedArray = useMemo(() => Array.from(stats.player.abilitiesUsed.entries()), [stats.player.abilitiesUsed]);

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
        
        return {
            alliances,
            rivalries,
            strongestBondName: strongestBond.names,
            fiercestRivalryName: fiercestRivalry.names,
            totalUltsUsed: ultimatesUsedArray.reduce((sum, entry) => sum + entry[1], 0),
        };
    }, [relationshipMatrix, ultimatesUsedArray]);

    const sessionDuration = useMemo(() => {
        const seconds = Math.floor((Date.now() - stats.sessionStartTime) / 1000);
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }, [stats.sessionStartTime]);
    
    const totalToolTime = useMemo(() => {
        return Math.max(1, timeWithToolActiveArray.reduce((sum, entry) => sum + entry[1], 0));
    }, [timeWithToolActiveArray]);


    return (
        <div className="p-4 flex flex-col gap-4 bg-gray-900/80 backdrop-blur-lg text-white w-full shadow-2xl animate-fade-in border-2 border-purple-500/20 rounded-lg">
            <div className="flex-shrink-0 text-center border-b-2 border-purple-500/20 pb-4">
                <h2 className="text-2xl font-bold text-purple-300">Session Analytics</h2>
                <p className="font-mono text-gray-400">Runtime: {sessionDuration}</p>
            </div>

            <div className="space-y-4 pr-2">
                <StatCard title="Global Stats">
                    <StatItem label="Anomalies Collected" value={stats.anomaliesCollected} />
                    <StatItem label="Total Collisions" value={stats.totalCollisions.toLocaleString()} />
                    <StatItem label="Total Ultimates Used" value={derivedStats.totalUltsUsed} />
                </StatCard>
                
                <BarChart data={ultimatesUsedArray} title="Ultimates Usage" color="bg-purple-500"/>

                <StatCard title="Relationship Analysis">
                    <StatItem label="Active Alliances" value={derivedStats.alliances} />
                    <StatItem label="Active Rivalries" value={derivedStats.rivalries} />
                     <div className="pt-2 mt-2 border-t border-white/10 text-xs">
                         <StatItem label="Strongest Bond" value={derivedStats.strongestBondName} />
                         <StatItem label="Fiercest Rivalry" value={derivedStats.fiercestRivalryName} />
                    </div>
                </StatCard>

                <StatCard title="Player Mode: Tool Usage">
                     <StatBar value={timeWithToolActiveArray.find(t=>t[0] === 'REPEL')?.[1] || 0} max={totalToolTime} color="bg-blue-500" label="Repel"/>
                     <StatBar value={timeWithToolActiveArray.find(t=>t[0] === 'CURRENT')?.[1] || 0} max={totalToolTime} color="bg-cyan-500" label="Current"/>
                     <StatItem label="Gravity Anchor Time" value={`${stats.player.gravityAnchorTime.toFixed(1)}s`} />
                     <StatItem label="Aether Spent" value={Math.round(stats.player.aetherSpent).toLocaleString()} />
                </StatCard>
                
                 <BarChart data={abilitiesUsedArray} title="Player Mode: Abilities Used" color="bg-green-500"/>
            </div>
        </div>
    );
};