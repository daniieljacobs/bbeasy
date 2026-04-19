"use client";

import { useEffect, useState, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Target, Trophy, CheckCircle, ArrowUpRight, Lock } from 'lucide-react';
import { RoleContext } from '@/app/portal/layout';

const SUBJECTS = ['math', 'english', 'economics'] as const;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }
});

function RadarChart({ data }: { data: Record<string, number> }) {
    const entries = Object.entries(data);
    if (entries.length === 0) return (
        <div className="flex items-center justify-center h-44 text-[9px] uppercase tracking-[0.3em] text-slate-300">
            No data yet
        </div>
    );

    const size = 250;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 62;
    const levels = 4;
    const n = entries.length;

    function angleFor(i: number) { return (Math.PI * 2 * i) / n - Math.PI / 2; }
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
                    points={entries.map((_, i) => { const p = point(i, radius * level); return `${p.x},${p.y}`; }).join(' ')}
                    fill="none" stroke="#e2e8f0" strokeWidth="1"
                />
            ))}
            {entries.map((_, i) => {
                const p = point(i, radius);
                return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
            })}
            <polygon points={polygonPoints} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
            {entries.map(([label], i) => {
                const p = point(i, radius + 22); // Increased padding slightly for multi-line
                const words = label.split(' ');
                const lineHeight = 9; // Adjust based on fontSize

                return (
                    <text
                        key={i}
                        x={p.x}
                        y={p.y}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill="#94a3b8"
                        fontFamily="monospace"
                        style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                        {words.map((word, index) => (
                            <tspan
                                key={index}
                                x={p.x}
                                // dy centers the block: first line moves up by half total height, 
                                // subsequent lines move down by lineHeight
                                dy={index === 0 ? -(words.length - 1) * lineHeight / 2 : lineHeight}
                            >
                                {word}
                            </tspan>
                        ))}
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

    const { isPro } = useContext(RoleContext);

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
            .eq('is_practice', false)
            .order('completed_at', { ascending: false });

        if (results && results.length > 0) {
            const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
            //const avg = results.reduce((a, r) => a + r.score, 0) / results.length;
            const totalPoints = results.reduce((a, r) => a + (r.points_awarded || 0), 0);
            setStats({ totalPoints, testsCompleted: results.length, avgScore: avg });
            setTestHistory(results);

            const { data: allResults } = await supabase
                .from('test_results')
                .select('user_id, score')
                .eq('is_practice', false);

            if (allResults) {
                const { data: allProfiles } = await supabase
                    .from('profiles')
                    .select('id');

                const profileIds = new Set(allProfiles?.map(p => p.id) || []);

                const userAvgs: Record<string, number[]> = {};
                allResults.forEach((r: any) => {
                    if (!profileIds.has(r.user_id)) return; // exclude ghost users
                    if (!userAvgs[r.user_id]) userAvgs[r.user_id] = [];
                    userAvgs[r.user_id].push(r.score);
                });

                const avgs = Object.values(userAvgs).map(
                    scores => scores.reduce((a, b) => a + b, 0) / scores.length
                );


                const avg = results.reduce((a, r) => a + r.score, 0) / results.length;
                const below = avgs.filter(a => a < avg).length;
                setPercentile(Math.round((below / avgs.length) * 100));

                // const below = avgs.filter(a => a < avg).length;
                //setPercentile(Math.round((below / avgs.length) * 100));



                //LOGS
                console.log('profile avg', avg);
                console.log('profile universe size', avgs.length);
                console.log('profile below count', below);
            }
        }

        if (profileData?.role === 'pro' || profileData?.role === 'admin') {
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
        }

        setLoading(false);
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    const roleLabel: Record<string, string> = { free: 'Free', pro: 'Pro', admin: 'Admin' };
    const subjectAccent: Record<string, string> = {
        math: 'text-violet-400',
        english: 'text-emerald-400',
        economics: 'text-amber-400',
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-14 font-mono">
            {/* Header */}
            <motion.div {...fadeUp(0)} className="mb-14 border-b border-slate-200 pb-8 flex items-end justify-between">
                <div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Profile</p>
                    <div className="flex items-baseline gap-4">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                            {profile?.username ? `@${profile.username}` : profile?.full_name}
                        </h1>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1
                            ${profile?.role === 'pro' || profile?.role === 'admin'
                                ? 'bg-brand text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                            {roleLabel[profile?.role] ?? 'Free'}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-2">{profile?.full_name}</p>
                </div>
                {!isPro && (
                    <a
                        href="/portal/membership"
                        className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand hover:text-slate-900 transition-colors"
                    >
                        Upgrade to Pro
                        <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                )}
            </motion.div>

            {/* Stats */}
            <motion.div {...fadeUp(0.08)} className="mb-14 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Prep Points', value: stats.totalPoints, icon: <Zap size={15} /> },
                    { label: 'Tests Done', value: stats.testsCompleted, icon: <CheckCircle size={15} /> },
                    { label: 'Avg Score', value: isPro ? `${stats.avgScore}%` : <Lock size={14} className="text-slate-300" />, icon: <Target size={15} /> },
                    { label: 'Percentile', value: isPro ? (percentile !== null ? `Top ${100 - percentile}%` : '—') : <Lock size={14} className="text-slate-300" />, icon: <Trophy size={15} /> },
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

            {/* Spider Charts */}
            <motion.div {...fadeUp(0.16)} className="mb-14">
                <div className="flex items-baseline justify-between mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Performance by Subject</p>
                    {!isPro && (
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
                            <Lock size={9} /> Pro only
                        </span>
                    )}
                </div>

                {isPro ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200">
                        {SUBJECTS.map((subject, i) => {
                            const hasData = Object.keys(subjectData[subject] || {}).length > 0;
                            return (
                                <motion.div
                                    key={subject}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 + i * 0.07 }}
                                    className="bg-white px-6 pt-6 pb-8 flex flex-col items-center"
                                >
                                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] mb-5 ${subjectAccent[subject]}`}>
                                        {subject}
                                    </p>
                                    <RadarChart data={subjectData[subject] || {}} />
                                    {!hasData && (
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300 mt-3">
                                            Take tests to unlock
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200">
                        {SUBJECTS.map((subject, i) => (
                            <motion.div
                                key={subject}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 + i * 0.07 }}
                                className="bg-white px-6 py-12 flex flex-col items-center justify-center gap-4"
                            >
                                <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${subjectAccent[subject]}`}>
                                    {subject}
                                </p>
                                <Lock size={18} className="text-slate-200" />
                                <a
                                    href="/portal/membership"
                                    className="text-[9px] font-black uppercase tracking-[0.2em] text-brand hover:text-slate-900 transition-colors"
                                >
                                    Unlock with Pro
                                </a>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Test History */}
            <motion.div {...fadeUp(0.22)}>
                <div className="flex items-baseline justify-between mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Test History</p>
                    {testHistory.length > 0 && (
                        <p className="text-[9px] text-slate-300 uppercase tracking-widest">{testHistory.length} attempts</p>
                    )}
                </div>

                {testHistory.length === 0 ? (
                    <div className="py-24 text-center border border-dashed border-slate-200">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300 mb-2">No tests taken yet</p>
                        <p className="text-slate-400 text-sm">Complete your first test to see history here.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    {['Test', 'Type', 'Score', 'Points', 'Date'].map(h => (
                                        <th key={h} className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {testHistory.map((r: any, i: number) => (
                                    <motion.tr
                                        key={r.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.25 + i * 0.03 }}
                                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/portal/profile/results/${r.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-slate-900 group-hover:text-brand transition-colors">
                                                {r.tests?.title || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                {r.tests?.type || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-black ${r.score >= 70 ? 'text-emerald-500' : 'text-red-400'}`}>
                                                {r.score}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-400">
                                            +{r.points_awarded || 0}
                                        </td>
                                        <td className="px-6 py-4 text-[9px] text-slate-400 uppercase tracking-widest">
                                            {new Date(r.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}