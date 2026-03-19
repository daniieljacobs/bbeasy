"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, FileText, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }
});

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ totalUsers: 0, totalTests: 0, avgScore: 0, totalPoints: 0 });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [scoreDistribution, setScoreDistribution] = useState<{ range: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboardData(); }, []);

    async function fetchDashboardData() {
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { data: results } = await supabase
            .from('test_results')
            .select('score, points_awarded, completed_at, user_id, tests(title, type)')
            .order('completed_at', { ascending: false });

        const { data: recentResults } = await supabase
            .from('test_results')
            .select(`id, score, completed_at, profiles (full_name, username), tests (title, type)`)
            .order('completed_at', { ascending: false })
            .limit(8);

        if (results) {
            const avgScore = results.length > 0
                ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
                : 0;
            const totalPoints = results.reduce((acc, r) => acc + (r.points_awarded || 0), 0);
            const ranges = [
                { range: '0–20%', min: 0, max: 20 },
                { range: '21–40%', min: 21, max: 40 },
                { range: '41–60%', min: 41, max: 60 },
                { range: '61–80%', min: 61, max: 80 },
                { range: '81–100%', min: 81, max: 100 },
            ];
            setStats({ totalUsers: userCount || 0, totalTests: results.length, avgScore, totalPoints });
            setScoreDistribution(ranges.map(r => ({
                range: r.range,
                count: results.filter(res => res.score >= r.min && res.score <= r.max).length
            })));
        }

        if (recentResults) setRecentActivity(recentResults);
        setLoading(false);
    }

    const maxCount = Math.max(...scoreDistribution.map(d => d.count), 1);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-14 font-mono">

            {/* ── HEADER ── */}
            <motion.div {...fadeUp(0)} className="mb-14 border-b border-slate-200 pb-8">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Admin</p>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Dashboard.</h1>
                <p className="text-slate-400 text-sm mt-2">Platform overview at a glance.</p>
            </motion.div>

            {/* ── STATS ── */}
            <motion.div {...fadeUp(0.08)} className="mb-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={15} /> },
                    { label: 'Tests Taken', value: stats.totalTests, icon: <FileText size={15} /> },
                    { label: 'Avg. Score', value: `${stats.avgScore}%`, icon: <Target size={15} /> },
                    { label: 'Points Awarded', value: stats.totalPoints, icon: <Zap size={15} /> },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="flex flex-col gap-2 py-6 border-t-2 border-slate-900"
                    >
                        <span className="text-slate-400">{s.icon}</span>
                        <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400">{s.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── SCORE DISTRIBUTION ── */}
                <motion.div {...fadeUp(0.16)} className="bg-white border border-slate-100 p-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Score Distribution</p>
                    <p className="text-xs text-slate-400 mb-8">How students are scoring across all tests</p>

                    {scoreDistribution.every(d => d.count === 0) ? (
                        <div className="py-16 text-center">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300">No results yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {scoreDistribution.map((d, i) => (
                                <div key={d.range} className="flex items-center gap-4">
                                    <p className="text-[9px] font-black text-slate-400 w-16 shrink-0 uppercase tracking-[0.1em]">
                                        {d.range}
                                    </p>
                                    <div className="flex-1 h-1 bg-slate-100 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(d.count / maxCount) * 100}%` }}
                                            transition={{ duration: 0.6, delay: 0.2 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                                            className="h-full bg-brand"
                                        />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 w-4 text-right shrink-0">{d.count}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* ── RECENT ACTIVITY ── */}
                <motion.div {...fadeUp(0.2)} className="bg-white border border-slate-100 p-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Recent Activity</p>
                    <p className="text-xs text-slate-400 mb-8">Latest test completions</p>

                    {recentActivity.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300">No activity yet</p>
                        </div>
                    ) : (
                        <div className="space-y-0 divide-y divide-slate-50">
                            {recentActivity.map((r: any, i: number) => {
                                const name = r.profiles?.username
                                    ? `@${r.profiles.username}`
                                    : r.profiles?.full_name || 'Unknown';

                                return (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.25 + i * 0.04 }}
                                        className="flex items-center justify-between gap-4 py-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-6 h-6 bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                                                {(r.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-900 truncate">{name}</p>
                                                <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400 truncate">
                                                    {r.tests?.title || 'Unknown Test'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-black ${r.score >= 70 ? 'text-emerald-500' : 'text-red-400'}`}>
                                                {r.score}%
                                            </p>
                                            <p className="text-[9px] uppercase tracking-[0.1em] text-slate-300">
                                                {new Date(r.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}