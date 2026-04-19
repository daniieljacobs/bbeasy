"use client";

import { useEffect, useState, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Zap, Target, Lock } from 'lucide-react';
import { RoleContext } from '@/app/portal/layout';

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

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }
});

export default function LeaderboardPage() {
    const [tab, setTab] = useState<Tab>('points');
    const [period, setPeriod] = useState<Period>('week');
    const [weekData, setWeekData] = useState<LeaderboardEntry[]>([]);
    const [allTimeData, setAllTimeData] = useState<LeaderboardEntry[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { isPro: isProContext } = useContext(RoleContext);
    const [localRole, setLocalRole] = useState<string | null>(null);
    const isPro = isProContext || localRole === 'pro' || localRole === 'admin';
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }
        setCurrentUserId(user.id);

        const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        if (profileData) setLocalRole(profileData.role);

        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        const [{ data: weekResults }, { data: allResults }, { data: profiles }] = await Promise.all([
            supabase.from('test_results').select('user_id, score, points_awarded').gte('completed_at', weekStart.toISOString()).eq('is_practice', false),
            supabase.from('test_results').select('user_id, score, points_awarded').eq('is_practice', false),
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

            // LOGS
            console.log('lb avgScore', currentUserEntry?.avgScore);
            console.log('lb universe size', sortedByScore.length);

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

    const currentUserEntry = activeData.find(e => e.userId === currentUserId);
    const currentUserRank = sorted.findIndex(e => e.userId === currentUserId) + 1;

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-6 py-14 font-mono">

            {/* ── HEADER ── */}
            <motion.div {...fadeUp(0)} className="mb-14 border-b border-slate-200 pb-8">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">BBEasy</p>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Leaderboard.</h1>
                <p className="text-slate-400 text-sm mt-2">Top 20 students across all applicants.</p>
            </motion.div>

            {/* ── CONTROLS ── */}
            <motion.div {...fadeUp(0.08)} className="flex items-center justify-between mb-8">
                {/* Period toggle */}
                <div className="flex items-center gap-px border border-slate-200">
                    {(['week', 'alltime'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-colors
                                ${period === p
                                    ? 'bg-slate-900 text-white'
                                    : 'text-slate-400 hover:text-slate-600 bg-white'
                                }`}
                        >
                            {p === 'week' ? 'This Week' : 'All Time'}
                        </button>
                    ))}
                </div>

                {/* Tab selector */}
                <div className="flex items-center gap-px border border-slate-200">
                    {([
                        { key: 'points', label: 'Points', icon: <Zap size={11} />, proOnly: false },
                        { key: 'score', label: 'Score', icon: <Target size={11} />, proOnly: true },
                        { key: 'percentile', label: 'Percentile', icon: <Trophy size={11} />, proOnly: true },
                    ] as { key: Tab; label: string; icon: React.ReactNode; proOnly: boolean }[]).map(t => {
                        const locked = t.proOnly && !isPro;
                        return (
                            <button
                                key={t.key}
                                onClick={() => !locked && setTab(t.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-colors
                                    ${locked
                                        ? 'text-slate-300 bg-white cursor-default'
                                        : tab === t.key
                                            ? 'bg-brand text-white'
                                            : 'text-slate-400 hover:text-slate-600 bg-white'
                                    }`}
                            >
                                {locked ? <Lock size={10} /> : t.icon} {t.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── YOUR RANK (if not in top 20) ── */}
            {currentUserEntry && currentUserRank === 0 && (
                <motion.div {...fadeUp(0.1)} className="mb-4 px-6 py-3 border border-brand/20 bg-brand/5 flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-brand font-black">Your rank</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                        #{activeData.indexOf(currentUserEntry) + 1} ·{' '}
                        {tab === 'points' && `${currentUserEntry.totalPoints} pts`}
                        {tab === 'score' && `${currentUserEntry.avgScore}%`}
                        {tab === 'percentile' && `Top ${100 - currentUserEntry.percentile}%`}
                    </p>
                </motion.div>
            )}

            {/* ── TABLE ── */}
            <motion.div {...fadeUp(0.12)} className="bg-white border border-slate-100">
                {sorted.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300 mb-2">
                            {period === 'week' ? 'No activity this week yet' : 'No data yet'}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                {['#', 'Student', 'Tests', tab === 'points' ? 'Points' : tab === 'score' ? 'Avg Score' : 'Percentile'].map((h, i) => (
                                    <th key={i} className={`px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 ${i > 1 ? 'text-right' : ''}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((entry, idx) => {
                                const isCurrentUser = entry.userId === currentUserId;
                                const medal = idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-600' : null;

                                return (
                                    <motion.tr
                                        key={entry.userId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 + idx * 0.03 }}
                                        className={`border-b border-slate-50 last:border-0 transition-colors
                                            ${isCurrentUser ? 'bg-brand/5' : 'hover:bg-slate-50/50'}`}
                                    >
                                        {/* Rank */}
                                        <td className="px-6 py-4 w-10">
                                            {medal
                                                ? <Trophy size={14} className={medal} />
                                                : <span className="text-[9px] font-black text-slate-300">{idx + 1}</span>
                                            }
                                        </td>

                                        {/* Username */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                                                    {entry.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`text-sm font-black ${isCurrentUser ? 'text-brand' : 'text-slate-900'}`}>
                                                    @{entry.username}
                                                </span>
                                                {isCurrentUser && (
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand/50">you</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Tests */}
                                        <td className="px-6 py-4 text-right text-[9px] font-black text-slate-400">
                                            {entry.testsCompleted}
                                        </td>

                                        {/* Metric */}
                                        <td className="px-6 py-4 text-right">
                                            {tab === 'points' && (
                                                <span className="text-sm font-black text-brand">{entry.totalPoints}</span>
                                            )}
                                            {tab === 'score' && (
                                                <span className={`text-sm font-black ${entry.avgScore >= 70 ? 'text-emerald-500' : 'text-red-400'}`}>
                                                    {entry.avgScore}%
                                                </span>
                                            )}
                                            {tab === 'percentile' && (
                                                <span className="text-sm font-black text-brand">
                                                    Top {100 - entry.percentile}%
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </motion.div>

            {/* ── FOOTER NOTE ── */}
            <motion.p {...fadeUp(0.2)} className="text-center text-[8px] uppercase tracking-[0.3em] text-slate-300 mt-6">
                {period === 'week' ? 'Resets every Monday' : 'All time'} · Practice sessions excluded
            </motion.p>
        </div>
    );
}