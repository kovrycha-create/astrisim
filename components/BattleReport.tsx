import React, { useMemo } from 'react';
import type { BattleReportStats } from '../types';
import { CrownIcon, DamageIcon, HealIcon, SkullIcon, ClockIcon, UltimateIcon } from './Icons';

interface BattleReportProps {
    report: BattleReportStats[];
    onClose: () => void;
}

const StatBar: React.FC<{ value: number; max: number; color: string; }> = ({ value, max, color }) => {
    const widthPercent = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="w-full bg-gray-900 rounded-full h-4 relative overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
                style={{ width: `${widthPercent}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/90">
                {Math.round(value)}
            </span>
        </div>
    );
};

export const BattleReport: React.FC<BattleReportProps> = ({ report, onClose }) => {
    const sortedReport = useMemo(() => {
        return [...report].sort((a, b) => {
            if (a.isWinner) return -1;
            if (b.isWinner) return 1;
            if (a.kills !== b.kills) return b.kills - a.kills;
            return b.damageDealt - a.damageDealt;
        });
    }, [report]);

    const maxDamage = useMemo(() => Math.max(1, ...report.map(r => r.damageDealt)), [report]);
    const maxHealing = useMemo(() => Math.max(1, ...report.map(r => r.healingDone)), [report]);
    const maxDamageTaken = useMemo(() => Math.max(1, ...report.map(r => r.damageTaken)), [report]);

    return (
         <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-purple-500/50 rounded-lg shadow-2xl p-6 w-full max-w-4xl mx-4 transform transition-all flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-3xl font-bold text-purple-300">Battle Report</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-4 space-y-3">
                    {sortedReport.map((stats, index) => (
                        <div key={stats.strandId} className={`p-3 rounded-lg flex items-center gap-4 transition-all duration-300 ${stats.isWinner ? 'bg-yellow-500/20 border-2 border-yellow-400' : 'bg-gray-900/50 border border-gray-700'}`}>
                            <div className="flex flex-col items-center w-24 flex-shrink-0">
                                <div className="text-3xl font-bold text-gray-500">#{index + 1}</div>
                                {stats.isWinner && <CrownIcon className="w-10 h-10 text-yellow-400" />}
                                {stats.image && <img src={stats.image.src} alt={stats.name} className="w-16 h-16 rounded-full mt-1" />}
                                <span className="font-semibold mt-1 text-center">{stats.name}</span>
                            </div>
                            <div className="flex-grow grid grid-cols-2 gap-x-6 gap-y-3">
                                {/* Damage Dealt */}
                                <div className="flex items-center gap-2">
                                    <DamageIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <StatBar value={stats.damageDealt} max={maxDamage} color="bg-red-500" />
                                </div>
                                {/* Kills */}
                                <div className="flex items-center gap-2 text-xl font-bold">
                                    <SkullIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-white">{stats.kills}</span>
                                    <span className="text-gray-500 text-sm">Kills</span>
                                </div>
                                {/* Damage Taken */}
                                <div className="flex items-center gap-2">
                                    <DamageIcon className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                    <StatBar value={stats.damageTaken} max={maxDamageTaken} color="bg-orange-500" />
                                </div>
                                 {/* Ultimates Used */}
                                <div className="flex items-center gap-2 text-xl font-bold">
                                    <UltimateIcon className="w-5 h-5 text-purple-400" />
                                    <span className="text-white">{stats.ultimatesUsed}</span>
                                     <span className="text-gray-500 text-sm">Ults</span>
                                </div>
                                {/* Healing Done */}
                                <div className="flex items-center gap-2">
                                    <HealIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <StatBar value={stats.healingDone} max={maxHealing} color="bg-green-500" />
                                </div>
                                {/* Time Survived */}
                                 <div className="flex items-center gap-2 text-xl font-bold">
                                    <ClockIcon className="w-5 h-5 text-blue-400" />
                                    <span className="text-white">{stats.timeSurvived.toFixed(1)}s</span>
                                     <span className="text-gray-500 text-sm">Survived</span>
                                </div>
                                {/* Cause of Death */}
                                <div className="col-span-2 text-center text-sm text-gray-400">
                                   Defeated by: <span className="font-semibold text-gray-300">{stats.causeOfDeath === 'survived' ? '—' : stats.causeOfDeath}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
