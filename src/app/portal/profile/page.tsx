"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Zap, Target, Trophy, CheckCircle } from 'lucide-react';

const SUBJECTS = ['math', 'english', 'economics'] as const;

function RadarChart({ data, subject }: { data: Record<string, number>, subject: string }) {
    const entries = Object.entries(data);
    if (entries.length === 0) return (
        <div className="flex items-center justify-center h-48 text-xs text-slate-400 italic">
            No data yet
        </div>
    );

    const size = 180;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 65;
    const levels = 4;
    const n = entries.length;

    function angleFor(i: number) {
        return (Math.PI * 2 * i) / n - Math.PI / 2;
    }

    function point(i: number, r: number) {
        const a = angleFor(i);
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }

    const gridLevels = Array.from({ length: levels }, (_, i) => (i + 1) / levels);
    const dataPoints = entries.map(([, val], i) => point(i, (val / 100) * radius));
    const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
    const color = '#2E4A7A';

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {gridLevels.map((level, li) => (
                <polygon
                    key={li}
                    points={entries.map((_, i) => {
                        const p = point(i, radius * level);
                        return `${p.x},${p.y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                />
            ))}
            {entries.map((_, i) => {
                const p = point(i, radius);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
            })}
            <polygon points={polygonPoints} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
            ))}
            {entries.map(([label], i) => {
                const p = point(i, radius + 18);
                return (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#94a3b8" fontFamily="monospace" style={{ textTransform: 'uppercase' }}>
                        {label.length > 10 ? label.slice(0, 10) + '…' : label}
                    </text>
                );
            })}
        </svg>
    );
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ totalPoints: 0, testsCompleted: 0, avgScore: 0 });
    const [testHistory, setTestHistory] = useState<any[]>([]);
    const [subjectData, setSubjectData] = useState<Record<string, Record<string, number>>>({});
    const [percentile, setPercentile] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/auth/login'); return; }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, username, role, total_points')
            .eq('id', user.id)
            .single();

        if (profileData) setProfile(profileData);

        const { data: results } = await supabase
            .from('test_results')
            .select('id, score, points_awarded, completed_at, tests (title, type, subject)')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

        if (results && results.length > 0) {
            const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
            setStats({ totalPoints: profileData?.total_points || 0, testsCompleted: results.length, avgScore: avg });
            setTestHistory(results);

            const { data: allResults } = await supabase.from('test_results').select('user_id, score');
            if (allResults) {
                const userAvgs: Record<string, number[]> = {};
                allResults.forEach((r: any) => {
                    if (!userAvgs[r.user_id]) userAvgs[r.user_id] = [];
                    userAvgs[r.user_id].push(r.score);
                });
                const avgs = Object.values(userAvgs).map(scores => scores.reduce((a, b) => a + b, 0) / scores.length);
                const below = avgs.filter(a => a < avg).length;
                setPercentile(Math.round((below / avgs.length) * 100));
            }
        }

        const { data: answers } = await supabase
            .from('user_answers')
            .select('is_correct, question_items (questions (categories (name, subject), subcategories (name)))')
            .in('result_id', results?.map(r => r.id) || []);

        if (answers) {
            const subjectMap: Record<string, Record<string, { correct: number; total: number }>> = {
                math: {}, english: {}, economics: {}
            };
            answers.forEach((a: any) => {
                const category = a.question_items?.questions?.categories;
                const subcategory = a.question_items?.questions?.subcategories;
                if (!category?.subject || !subcategory?.name) return;
                const subject = category.subject;
                const sub = subcategory.name;
                if (!subjectMap[subject]) return;
                if (!subjectMap[subject][sub]) subjectMap[subject][sub] = { correct: 0, total: 0 };
                subjectMap[subject][sub].total++;
                if (a.is_correct) subjectMap[subject][sub].correct++;
            });
            const computed: Record<string, Record<string, number>> = {};
            Object.entries(subjectMap).forEach(([subject, subs]) => {
                computed[subject] = {};
                Object.entries(subs).forEach(([sub, { correct, total }]) => {
                    computed[subject][sub] = Math.round((correct / total) * 100);
                });
            });
            setSubjectData(computed);
        }

        setLoading(false);
    }

    const roleConfig: Record<string, { label: string; color: string }> = {
        free: { label: 'Free', color: 'bg-slate-100 text-slate-600' },
        pro: { label: 'Pro', color: 'bg-brand-tint text-brand' },
        admin: { label: 'Admin', color: 'bg-brand-tint text-brand' },
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    const role = roleConfig[profile?.role] || roleConfig.free;

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {profile?.username ? `@${profile.username}` : profile?.full_name}
                        </h1>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${role.color}`}>
                            {role.label}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">{profile?.full_name}</p>
                </div>
                {profile?.role === 'free' && (
                    <a href="/portal/membership" className="px-6 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-hover transition">
                        Upgrade to Pro
                    </a>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Prep Points', value: stats.totalPoints, icon: <Zap size={16} /> },
                    { label: 'Tests Done', value: stats.testsCompleted, icon: <CheckCircle size={16} /> },
                    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: <Target size={16} /> },
                    { label: 'Percentile', value: percentile !== null ? `Top ${100 - percentile}%` : '—', icon: <Trophy size={16} /> },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-3 shadow-sm">
                        <div className="text-brand">{s.icon}</div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                            <p className="text-lg font-black text-slate-900">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Spider Charts */}
            <div className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Performance by Subject</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {SUBJECTS.map(subject => (
                        <div key={subject} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 capitalize">{subject}</p>
                            <RadarChart data={subjectData[subject] || {}} subject={subject} />
                            {Object.keys(subjectData[subject] || {}).length === 0 && (
                                <p className="text-[10px] text-slate-300 italic mt-2">Take tests to see data</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Test History */}
            <div className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Test History</h2>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    {testHistory.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-slate-400 italic text-sm">No tests taken yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-50">
                                <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                    <th className="px-6 py-4">Test</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Points</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {testHistory.map((r: any) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4 font-bold text-sm text-slate-900">{r.tests?.title || '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                                {r.tests?.type || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-black ${r.score >= 70 ? 'text-green-600' : 'text-red-400'}`}>
                                                {r.score}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-600">+{r.points_awarded || 0}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{new Date(r.completed_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}