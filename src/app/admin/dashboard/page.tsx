"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, FileText, Target, Zap } from 'lucide-react';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTests: 0,
        avgScore: 0,
        totalPoints: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [scoreDistribution, setScoreDistribution] = useState<{ range: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        // Total users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // All test results
        const { data: results } = await supabase
            .from('test_results')
            .select('score, points_awarded, completed_at, user_id, tests(title, type)')
            .order('completed_at', { ascending: false });

        // Recent activity with profile info
        const { data: recentResults } = await supabase
            .from('test_results')
            .select(`
                id,
                score,
                completed_at,
                profiles (full_name, username),
                tests (title, type)
            `)
            .order('completed_at', { ascending: false })
            .limit(8);

        if (results) {
            const avgScore = results.length > 0
                ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
                : 0;

            const totalPoints = results.reduce((acc, r) => acc + (r.points_awarded || 0), 0);

            // Score distribution
            const ranges = [
                { range: '0–20%', min: 0, max: 20 },
                { range: '21–40%', min: 21, max: 40 },
                { range: '41–60%', min: 41, max: 60 },
                { range: '61–80%', min: 61, max: 80 },
                { range: '81–100%', min: 81, max: 100 },
            ];

            const distribution = ranges.map(r => ({
                range: r.range,
                count: results.filter(res => res.score >= r.min && res.score <= r.max).length
            }));

            setStats({
                totalUsers: userCount || 0,
                totalTests: results.length,
                avgScore,
                totalPoints
            });

            setScoreDistribution(distribution);
        }

        if (recentResults) setRecentActivity(recentResults);
        setLoading(false);
    }

    const maxCount = Math.max(...scoreDistribution.map(d => d.count), 1);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black">Dashboard</h1>
                <p className="text-slate-500">Platform overview at a glance.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} />, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Tests Taken', value: stats.totalTests, icon: <FileText size={18} />, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Avg. Score', value: `${stats.avgScore}%`, icon: <Target size={18} />, color: 'text-green-600 bg-green-50' },
                    { label: 'Points Awarded', value: stats.totalPoints, icon: <Zap size={18} />, color: 'text-amber-600 bg-amber-50' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                            <p className="text-xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Score Distribution */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6">
                    <div>
                        <p className="font-black text-slate-900">Score Distribution</p>
                        <p className="text-xs text-slate-400">How students are scoring across all tests</p>
                    </div>

                    {scoreDistribution.every(d => d.count === 0) ? (
                        <p className="text-slate-400 text-sm italic text-center py-8">No results yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {scoreDistribution.map((d) => (
                                <div key={d.range} className="flex items-center gap-4">
                                    <p className="text-[10px] font-black text-slate-400 w-16 shrink-0">{d.range}</p>
                                    <div className="flex-1 bg-slate-50 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                            style={{ width: `${(d.count / maxCount) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 w-6 text-right shrink-0">{d.count}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6">
                    <div>
                        <p className="font-black text-slate-900">Recent Activity</p>
                        <p className="text-xs text-slate-400">Latest test completions</p>
                    </div>

                    {recentActivity.length === 0 ? (
                        <p className="text-slate-400 text-sm italic text-center py-8">No activity yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((r: any) => {
                                const name = r.profiles?.username
                                    ? `@${r.profiles.username}`
                                    : r.profiles?.full_name || 'Unknown';

                                return (
                                    <div key={r.id} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center font-black text-xs shrink-0">
                                                {(r.profiles?.full_name || '?').charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                    {name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {r.tests?.title || 'Unknown Test'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-black ${r.score >= 70 ? 'text-green-600' : 'text-red-400'}`}>
                                                {r.score}%
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {new Date(r.completed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}