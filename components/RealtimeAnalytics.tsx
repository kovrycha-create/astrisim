import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { BattleReportStats, FightHistoryData, Strand } from '../types';
import { STRAND_CONFIG } from '../constants';

type SortKey = 'damageDealt' | 'healingDone' | 'dps' | 'hps' | 'dtps';
type GraphType = 'damage' | 'healing' | 'survivors';

interface RealtimeAnalyticsProps {
    report: BattleReportStats[];
    historyData: FightHistoryData;
    duration: number;
    strands: Strand[];
}

const LeaderboardHeader: React.FC<{ title: string, sortKey: SortKey, currentSort: SortKey, onSort: (key: SortKey) => void }> = ({ title, sortKey, currentSort, onSort }) => (
    <th 
        className="p-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
        onClick={() => onSort(sortKey)}
    >
        {title} {currentSort === sortKey && '▼'}
    </th>
);

export const RealtimeAnalytics: React.FC<RealtimeAnalyticsProps> = ({ report, historyData, duration, strands }) => {
    const [sortKey, setSortKey] = useState<SortKey>('damageDealt');
    const [graphType, setGraphType] = useState<GraphType>('damage');
    const graphCanvasRef = useRef<HTMLCanvasElement>(null);

    const sortedReport = useMemo(() => {
        return [...report].sort((a, b) => {
            const a_dps = duration > 0 ? a.damageDealt / duration : 0;
            const b_dps = duration > 0 ? b.damageDealt / duration : 0;
            const a_hps = duration > 0 ? a.healingDone / duration : 0;
            const b_hps = duration > 0 ? b.healingDone / duration : 0;
            const a_dtps = duration > 0 ? a.damageTaken / duration : 0;
            const b_dtps = duration > 0 ? b.damageTaken / duration : 0;

            switch (sortKey) {
                case 'dps': return b_dps - a_dps;
                case 'hps': return b_hps - a_hps;
                case 'dtps': return b_dtps - a_dtps;
                case 'healingDone': return b.healingDone - a.healingDone;
                case 'damageDealt':
                default:
                    return b.damageDealt - a.damageDealt;
            }
        });
    }, [report, sortKey, duration]);

    useEffect(() => {
        const canvas = graphCanvasRef.current;
        if (!canvas || historyData.length === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const padding = 30;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find max values for scaling
        let maxValue = 1;
        if (graphType === 'damage') {
            maxValue = Math.max(1, ...historyData.flatMap(snap => snap.stats.map(s => s.damageDealt)));
        } else if (graphType === 'healing') {
            maxValue = Math.max(1, ...historyData.flatMap(snap => snap.stats.map(s => s.healingDone)));
        } else if (graphType === 'survivors') {
            maxValue = strands.filter(s => s.visible).length;
        }
        const maxTime = Math.max(1, historyData[historyData.length - 1].time);

        // Draw axes
        ctx.strokeStyle = '#4a5568';
        ctx.fillStyle = '#a0aec0';
        ctx.lineWidth = 1;
        ctx.font = '10px sans-serif';

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding / 2);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        for (let i = 0; i <= 4; i++) {
            const y = height - padding - i * ((height - padding * 1.5) / 4);
            ctx.fillText(Math.round(i * maxValue / 4).toString(), 5, y + 3);
            ctx.beginPath();
            ctx.moveTo(padding - 4, y);
            ctx.lineTo(padding, y);
            ctx.stroke();
        }

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding / 2, height - padding);
        ctx.stroke();
        for (let i = 0; i <= 4; i++) {
            const x = padding + i * ((width - padding * 1.5) / 4);
            ctx.fillText(Math.round(i * maxTime / 4).toString() + 's', x - 5, height - padding + 15);
            ctx.beginPath();
            ctx.moveTo(x, height - padding);
            ctx.lineTo(x, height - padding + 4);
            ctx.stroke();
        }

        // Draw lines
        const combatantIds = report.map(r => r.strandId);
        combatantIds.forEach(id => {
            const strand = strands.find(s => s.id === id);
            if (!strand) return;
            const [r,g,b] = strand.originalColor;
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 2;
            ctx.beginPath();

            let firstPoint = true;
            historyData.forEach(snapshot => {
                const x = padding + (snapshot.time / maxTime) * (width - padding * 1.5);
                let yValue = 0;
                
                if (graphType === 'damage') {
                    yValue = snapshot.stats.find(s => s.strandId === id)?.damageDealt || 0;
                } else if (graphType === 'healing') {
                    yValue = snapshot.stats.find(s => s.strandId === id)?.healingDone || 0;
                } else if (graphType === 'survivors') {
                    yValue = snapshot.survivorCount;
                }

                if (graphType === 'survivors' && firstPoint) {
                     // For survivors, we only need one line
                } else {
                     const y = height - padding - (yValue / maxValue) * (height - padding * 1.5);
                     if (firstPoint) {
                         ctx.moveTo(x, y);
                         firstPoint = false;
                     } else {
                         ctx.lineTo(x, y);
                     }
                }
            });

            if (graphType === 'survivors') {
                ctx.strokeStyle = '#a0aec0';
                historyData.forEach((snapshot, index) => {
                    const x = padding + (snapshot.time / maxTime) * (width - padding * 1.5);
                    const y = height - padding - (snapshot.survivorCount / maxValue) * (height - padding * 1.5);
                     if (index === 0) {
                         ctx.moveTo(x, y);
                     } else {
                        const prevSnapshot = historyData[index-1];
                        const prevX = padding + (prevSnapshot.time / maxTime) * (width - padding * 1.5);
                        const prevY = height - padding - (prevSnapshot.survivorCount / maxValue) * (height - padding * 1.5);
                        ctx.lineTo(prevX, y);
                        ctx.lineTo(x, y);
                     }
                });
            }

            ctx.stroke();
        });


    }, [historyData, graphType, strands, report]);

    return (
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-black/70 backdrop-blur-md text-white shadow-2xl animate-fade-in flex gap-4" style={{ height: '300px' }}>
            {/* Leaderboard */}
            <div className="w-1/2 h-full bg-black/30 rounded-lg p-2 flex flex-col">
                <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Real-Time Analytics</h3>
                <div className="overflow-y-auto flex-grow">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                                <th className="p-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Strand</th>
                                <LeaderboardHeader title="Damage" sortKey="damageDealt" currentSort={sortKey} onSort={setSortKey} />
                                <LeaderboardHeader title="Healing" sortKey="healingDone" currentSort={sortKey} onSort={setSortKey} />
                                <LeaderboardHeader title="DPS" sortKey="dps" currentSort={sortKey} onSort={setSortKey} />
                                <LeaderboardHeader title="HPS" sortKey="hps" currentSort={sortKey} onSort={setSortKey} />
                                <LeaderboardHeader title="DTPS" sortKey="dtps" currentSort={sortKey} onSort={setSortKey} />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedReport.map((stats, index) => {
                                const dps = duration > 0 ? stats.damageDealt / duration : 0;
                                const hps = duration > 0 ? stats.healingDone / duration : 0;
                                const dtps = duration > 0 ? stats.damageTaken / duration : 0;
                                const strandInfo = strands.find(s => s.id === stats.strandId);
                                const isDefeated = strandInfo?.isDefeated;
                                const color = strandInfo ? `rgb(${strandInfo.originalColor.join(',')})` : 'white';

                                return (
                                    <tr key={stats.strandId} className={`border-b border-gray-700/50 ${isDefeated ? 'opacity-40' : ''}`}>
                                        <td className="p-1.5 text-sm">{index + 1}</td>
                                        <td className="p-1.5 text-sm font-semibold" style={{ color: color }}>{stats.name}</td>
                                        <td className="p-1.5 text-sm">{Math.round(stats.damageDealt)}</td>
                                        <td className="p-1.5 text-sm">{Math.round(stats.healingDone)}</td>
                                        <td className="p-1.5 text-sm">{dps.toFixed(1)}</td>
                                        <td className="p-1.5 text-sm">{hps.toFixed(1)}</td>
                                        <td className="p-1.5 text-sm">{dtps.toFixed(1)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Graph */}
            <div className="w-1/2 h-full bg-black/30 rounded-lg p-2 flex flex-col">
                 <div className="flex justify-between items-center mb-2 flex-shrink-0">
                    <h3 className="text-lg font-semibold">Battle Graph</h3>
                    <div className="flex items-center gap-1 p-1 bg-black/30 rounded-full text-xs">
                        <button onClick={() => setGraphType('damage')} className={`px-3 py-1 rounded-full ${graphType === 'damage' ? 'bg-purple-600' : 'hover:bg-white/20'}`}>Damage</button>
                        <button onClick={() => setGraphType('healing')} className={`px-3 py-1 rounded-full ${graphType === 'healing' ? 'bg-purple-600' : 'hover:bg-white/20'}`}>Healing</button>
                        <button onClick={() => setGraphType('survivors')} className={`px-3 py-1 rounded-full ${graphType === 'survivors' ? 'bg-purple-600' : 'hover:bg-white/20'}`}>Survivors</button>
                    </div>
                 </div>
                 <div className="flex-grow">
                    <canvas ref={graphCanvasRef} width="500" height="200" className="w-full h-full"></canvas>
                 </div>
            </div>
        </div>
    );
};