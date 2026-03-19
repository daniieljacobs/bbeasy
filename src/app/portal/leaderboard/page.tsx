"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Trophy, Zap, Target } from 'lucide-react';

type Tab = 'points' | 'score' | 'percentile';
type Period = 'week' | 'alltime';

interface LeaderboardEntry {
    userId: string;
    username: string;
    testsCompleted: number;
    totalPoints: number;
    avgScore: number;
    percentile: number;
}

export default function LeaderboardPage() {
    const [tab, setTab] = useState<Tab>('points');
    const [period, setPeriod] = useState<Period>('week');
    const [weekData, setWeekData] = useState<LeaderboardEntry[]>([]);
    const [allTimeData, setAllTimeData] = useState<LeaderboardEntry[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }
        setCurrentUserId(user.id);

        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        const [{ data: weekResults }, { data: allResults }, { data: profiles }] = await Promise.all([
            supabase.from('test_results').select('user_id, score, points_awarded').gte('completed_at', weekStart.toISOString()),
            supabase.from('test_results').select('user_id, score, points_awarded'),
            supabase.from('profiles').select('id, username, full_name'),
        ]);

        if (!allResults || !profiles) { setLoading(false); return; }

        function buildEntries(results: any[]): LeaderboardEntry[] {
            const userMap: Record<string, { scores: number[]; points: number; count: number }> = {};
            results.forEach((r: any) => {
                if (!userMap[r.user_id]) userMap[r.user_id] = { scores: [], points: 0, count: 0 };
                userMap[r.user_id].scores.push(r.score);
                userMap[r.user_id].points += r.points_awarded || 0;
                userMap[r.user_id].count++;
            });

            const built: LeaderboardEntry[] = Object.entries(userMap).map(([userId, data]) => {
                const profile = profiles!.find(p => p.id === userId);
                const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
                return {
                    userId,
                    username: profile?.username || profile?.full_name || 'Unknown',
                    testsCompleted: data.count,
                    totalPoints: data.points,
                    avgScore,
                    percentile: 0
                };
            });

            const sortedByScore = [...built].sort((a, b) => a.avgScore - b.avgScore);
            built.forEach(entry => {
                const below = sortedByScore.filter(e => e.avgScore < entry.avgScore).length;
                entry.percentile = Math.round((below / sortedByScore.length) * 100);
            });

            return built;
        }

        setWeekData(buildEntries(weekResults || []));
        setAllTimeData(buildEntries(allResults));
        setLoading(false);
    }

    const activeData = period === 'week' ? weekData : allTimeData;

    const sorted = [...activeData].sort((a, b) => {
        if (tab === 'points') return b.totalPoints - a.totalPoints;
        if (tab === 'score') return b.avgScore - a.avgScore;
        return b.percentile - a.percentile;
    }).slice(0, 20);

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'points', label: 'Prep Points', icon: <Zap size={13} /> },
        { key: 'score', label: 'Avg Score', icon: <Target size={13} /> },
        { key: 'percentile', label: 'Percentile', icon: <Trophy size={13} /> },
    ];

    const medalColors: Record<number, string> = {
        0: 'text-amber-400',
        1: 'text-slate-400',
        2: 'text-amber-600',
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leaderboard</h1>
                <p className="text-sm text-slate-400">Top 20 students across all applicants</p>
            </div>

            {/* Period Toggle */}
            <div className="flex items-center justify-center">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['week', 'alltime'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {p === 'week' ? 'This Week' : 'All Time'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-center gap-2">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.key
                                ? 'bg-brand text-white shadow-lg'
                                : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200'
                            }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {sorted.length === 0 ? (
                    <div className="py-20 text-center">
                        <p className="text-slate-400 italic text-sm">
                            {period === 'week' ? 'No activity this week yet.' : 'No data yet.'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-50">
                            <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="px-6 py-4 w-10">#</th>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4 text-right">Tests</th>
                                {tab === 'points' && <th className="px-6 py-4 text-right">Points</th>}
                                {tab === 'score' && <th className="px-6 py-4 text-right">Avg Score</th>}
                                {tab === 'percentile' && <th className="px-6 py-4 text-right">Percentile</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sorted.map((entry, idx) => {
                                const isCurrentUser = entry.userId === currentUserId;
                                return (
                                    <tr key={entry.userId} className={`transition ${isCurrentUser ? 'bg-brand-tint' : 'hover:bg-slate-50/50'}`}>
                                        <td className="px-6 py-4">
                                            {idx < 3 ? (
                                                <Trophy size={16} className={medalColors[idx]} />
                                            ) : (
                                                <span className="text-xs font-black text-slate-300">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[9px] font-black shrink-0">
                                                    {entry.username.charAt(0).toUpperCase()}
                                                </div>
                                                <p className={`text-sm font-black ${isCurrentUser ? 'text-brand' : 'text-slate-900'}`}>
                                                    @{entry.username}
                                                    {isCurrentUser && (
                                                        <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-brand opacity-60">you</span>
                                                    )}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-400">
                                            {entry.testsCompleted}
                                        </td>
                                        {tab === 'points' && (
                                            <td className="px-6 py-4 text-right font-black text-brand">{entry.totalPoints}</td>
                                        )}
                                        {tab === 'score' && (
                                            <td className={`px-6 py-4 text-right font-black ${entry.avgScore >= 70 ? 'text-green-600' : 'text-red-400'}`}>
                                                {entry.avgScore}%
                                            </td>
                                        )}
                                        {tab === 'percentile' && (
                                            <td className="px-6 py-4 text-right font-black text-brand">
                                                Top {100 - entry.percentile}%
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-center text-[9px] text-slate-300 uppercase tracking-widest">
                {period === 'week' ? 'Resets every monday · Only scored tests count' : 'All time · Only scored tests count'}
            </p>
        </div>
    );
}