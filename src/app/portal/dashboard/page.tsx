"use client";

import { useEffect, useState, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Target, AlertCircle, Lock, ArrowUpRight, Shuffle, RefreshCw } from 'lucide-react';
import { RoleContext } from '@/app/portal/layout';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }
});

const SUBJECTS = [
    { key: 'math', label: 'Math', color: 'text-violet-400', dot: 'bg-violet-400' },
    { key: 'english', label: 'English', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    { key: 'economics', label: 'Economics', color: 'text-amber-400', dot: 'bg-amber-400' },
];

export default function UserDashboard() {
    const [mockTests, setMockTests] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgScore: 0, completedCount: 0, totalPoints: 0 });
    const [assessmentTaken, setAssessmentTaken] = useState(false);
    const [assessmentId, setAssessmentId] = useState<string | null>(null);
    const [weakSubcategories, setWeakSubcategories] = useState<Record<string, string[]>>({});
    const [mockTemplate, setMockTemplate] = useState<any>(null);
    const [subjectTemplates, setSubjectTemplates] = useState<Record<string, any>>({});
    const [isGenerating, setIsGenerating] = useState<string | null>(null); // subject key or 'mock'

    const { isPro: isProContext } = useContext(RoleContext);
    const [localRole, setLocalRole] = useState<string | null>(null);
    const isPro = isProContext || localRole === 'pro' || localRole === 'admin';

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, username, total_points, role')
            .eq('id', user.id)
            .single();
        if (profileData) {
            setProfile(profileData);
            setLocalRole(profileData.role);
        }

        // Fetch real mock tests only
        const { data: allTests } = await supabase
            .from('tests')
            .select('id, title, type, subject, min_role, is_generated, test_questions(question_id)')
            .eq('is_generated', false);

        const { data: userResults } = await supabase
            .from('test_results')
            .select('test_id, score, points_awarded')
            .eq('user_id', user.id)
            .eq('is_practice', false);

        // Fetch templates
        const { data: templates } = await supabase
            .from('generated_test_templates')
            .select('id, name, type, subject, time_limit');

        if (templates) {
            const mockTmpl = templates.find(t => t.type === 'mock');
            if (mockTmpl) setMockTemplate(mockTmpl);
            const subjectMap: Record<string, any> = {};
            templates.filter(t => t.type === 'subset' && t.subject).forEach(t => {
                subjectMap[t.subject] = t;
            });
            setSubjectTemplates(subjectMap);
        }

        if (allTests) {
            const assessmentTest = allTests.find(t => t.type === 'assessment');
            if (assessmentTest) {
                setAssessmentId(assessmentTest.id);
                setAssessmentTaken(!!userResults?.find(r => r.test_id === assessmentTest.id));
            }

            const mocks = allTests
                .filter(t => t.type === 'mock')
                .map(test => {
                    const results = userResults?.filter(r => r.test_id === test.id) || [];
                    return {
                        ...test,
                        questionCount: test.test_questions?.length || 0,
                        completed: results.length > 0,
                        bestScore: results.length > 0 ? Math.max(...results.map((r: any) => r.score)) : null,
                    };
                });
            setMockTests(mocks);

            if (userResults && userResults.length > 0) {
                const avg = userResults.reduce((acc, r) => acc + r.score, 0) / userResults.length;
                const totalPoints = userResults.reduce((acc, r) => acc + (r.points_awarded || 0), 0);
                setStats({ avgScore: Math.round(avg), completedCount: userResults.length, totalPoints });
            }
        }

        // Weak subcategories per subject (pro only based on real role)
        if (profileData?.role === 'pro' || profileData?.role === 'admin') {
            const resultIds = userResults?.map(r => r.test_id) || [];
            if (resultIds.length > 0) {
                const { data: answers } = await supabase
                    .from('user_answers')
                    .select('is_correct, question_items (questions (categories (subject), subcategories (name)))')
                    .in('result_id', resultIds);

                if (answers) {
                    const subMap: Record<string, Record<string, { correct: number; total: number }>> = {};
                    answers.forEach((a: any) => {
                        const subject = a.question_items?.questions?.categories?.subject;
                        const subcat = a.question_items?.questions?.subcategories?.name;
                        if (!subject || !subcat) return;
                        if (!subMap[subject]) subMap[subject] = {};
                        if (!subMap[subject][subcat]) subMap[subject][subcat] = { correct: 0, total: 0 };
                        subMap[subject][subcat].total++;
                        if (a.is_correct) subMap[subject][subcat].correct++;
                    });

                    const weak: Record<string, string[]> = {};
                    Object.entries(subMap).forEach(([subject, subcats]) => {
                        weak[subject] = Object.entries(subcats)
                            .filter(([, v]) => v.total >= 2)
                            .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
                            .slice(0, 2)
                            .map(([name]) => name);
                    });
                    setWeakSubcategories(weak);
                }
            }
        }

        setLoading(false);
    }

    async function generateFromTemplate(templateId: string, key: string) {
        setIsGenerating(key);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: tmpl } = await supabase
                .from('generated_test_templates')
                .select(`
                    id, name, type, subject, time_limit,
                    template_slots (
                        id, points_override, slot_order,
                        template_slot_categories (category_id, subcategory_id)
                    )
                `)
                .eq('id', templateId)
                .single();

            if (!tmpl) { alert('Template not found.'); return; }

            const slots = tmpl.template_slots.sort((a: any, b: any) => a.slot_order - b.slot_order);
            const selectedQuestions: any[] = [];

            for (const slot of slots) {
                const cats = slot.template_slot_categories;

                let query = supabase
                    .from('questions')
                    .select('id, points, category_id, subcategory_id, question_items(id)');

                if (cats && cats.length > 0) {
                    const catIds = cats.map((c: any) => c.category_id).filter(Boolean);
                    query = query.in('category_id', catIds);
                }

                const { data: pool } = await query;
                if (!pool || pool.length === 0) continue;

                // Filter by subcategory if specified
                let filtered = pool;
                if (cats && cats.length > 0) {
                    const hasSubcatFilter = cats.some((c: any) => c.subcategory_id);
                    if (hasSubcatFilter) {
                        filtered = pool.filter((q: any) =>
                            cats.some((c: any) =>
                                q.category_id === c.category_id &&
                                (!c.subcategory_id || q.subcategory_id === c.subcategory_id)
                            )
                        );
                    }
                }

                // Exclude already selected
                const available = filtered.filter((q: any) =>
                    !selectedQuestions.find(s => s.id === q.id)
                );
                if (available.length === 0) continue;

                // Get weak subcategory ids for this subject
                const weakSubcatNames = Object.values(weakSubcategories).flat();

                // Fetch subcategory names to match against weak list
                const { data: subcatData } = await supabase
                    .from('subcategories')
                    .select('id, name')
                    .in('id', available.map((q: any) => q.subcategory_id).filter(Boolean));

                const weakSubcatIds = new Set(
                    (subcatData || [])
                        .filter((s: any) => weakSubcatNames.includes(s.name))
                        .map((s: any) => s.id)
                );

                // Split pool into weak and normal, prefer weak 70% of the time
                const weakPool = available.filter((q: any) => weakSubcatIds.has(q.subcategory_id));
                const normalPool = available.filter((q: any) => !weakSubcatIds.has(q.subcategory_id));

                let picked;
                if (weakPool.length > 0 && Math.random() < 0.7) {
                    picked = weakPool[Math.floor(Math.random() * weakPool.length)];
                } else {
                    picked = available[Math.floor(Math.random() * available.length)];
                }

                selectedQuestions.push({ ...picked, points_override: slot.points_override });
            }

            if (selectedQuestions.length === 0) {
                alert('Not enough questions in the bank to generate this test.');
                return;
            }

            const { data: testData, error } = await supabase
                .from('tests')
                .insert({
                    title: `${tmpl.name} · ${new Date().toLocaleDateString('en-GB')}`,
                    type: tmpl.type,
                    subject: tmpl.subject || null,
                    min_role: 'pro',
                    time_limit: tmpl.time_limit,
                    is_generated: true,
                    is_practice: false,
                    template_id: tmpl.id
                })
                .select().single();

            if (error || !testData) { alert('Could not create test.'); return; }

            await supabase.from('test_questions').insert(
                selectedQuestions.map((q: any, i: number) => ({
                    test_id: testData.id,
                    question_id: q.id,
                    question_order: i + 1
                }))
            );

            window.location.href = `/portal/tests/take/${testData.id}`;
        } catch (err) {
            console.error(err);
            alert('Something went wrong.');
        } finally {
            setIsGenerating(null);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 font-mono">Loading</p>
            </div>
        </div>
    );

    const firstName = profile?.full_name?.split(' ')[0] ?? null;

    return (
        <div className="max-w-5xl mx-auto px-6 py-14 font-mono">

            {/* ── HEADER ── */}
            <motion.div {...fadeUp(0)} className="mb-14">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                    {firstName ? `Hello, ${firstName}.` : 'Study Portal.'}
                </h1>
                <p className="text-slate-400 text-sm mt-3">Pick up where you left off.</p>
            </motion.div>

            {/* ── ASSESSMENT BANNER ── */}
            {!assessmentTaken && assessmentId && (
                <motion.div {...fadeUp(0.05)} className="mb-10">
                    <Link
                        href={`/portal/tests/take/${assessmentId}`}
                        className="group flex items-center justify-between bg-brand/5 border border-brand/20 hover:border-brand hover:bg-brand/10 transition-all duration-300 px-8 py-6"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-full border border-brand/30 flex items-center justify-center group-hover:border-brand transition-colors">
                                <AlertCircle size={16} className="text-brand" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900">Start your Starter Assessment</p>
                                <p className="text-xs text-slate-500 mt-0.5">Identify your weak areas before practicing.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-brand text-[9px] font-black uppercase tracking-[0.2em]">
                            Begin <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* ── STATS ── */}
            <motion.div {...fadeUp(0.1)} className="mb-14 grid grid-cols-3 gap-6">
                {[
                    { label: 'Avg. Score', value: `${stats.avgScore}%`, icon: <Target size={15} /> },
                    { label: 'Tests Done', value: stats.completedCount, icon: <CheckCircle size={15} /> },
                    { label: 'Prep Points', value: stats.totalPoints, icon: <Zap size={15} /> },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 + i * 0.06 }}
                        className="flex flex-col gap-2 py-6 border-t-2 border-slate-900"
                    >
                        <span className="text-slate-400">{s.icon}</span>
                        <p className="text-3xl font-black text-slate-900 mt-1">{s.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400">{s.label}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── TWO COLUMN LAYOUT ── */}
            <motion.div {...fadeUp(0.16)} className="grid grid-cols-5 gap-4">

                {/* ── LEFT: MOCK EXAMS (bigger) ── */}
                <div className="col-span-3 space-y-3">
                    <div className="flex items-baseline justify-between mb-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Full Mock Exams</p>
                    </div>

                    {/* Real mock tests */}
                    {mockTests.map((test, i) => (
                        <motion.div
                            key={test.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.06 }}
                        >
                            <Link href={`/portal/tests/take/${test.id}`}>
                                <div className="group bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                                        {test.completed && (
                                            <div className="text-right">
                                                <p className="text-[8px] uppercase tracking-widest text-slate-300">Best</p>
                                                <p className="text-lg font-black text-slate-900">{test.bestScore}%</p>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 group-hover:text-brand transition-colors leading-tight mb-1">
                                        {test.title}
                                    </h3>
                                    <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 mb-6">
                                        {test.questionCount} questions · full exam
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black group-hover:text-brand transition-colors">
                                        {test.completed ? 'Retake' : 'Start'}
                                        <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}

                    {/* Randomised mock tile */}
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + mockTests.length * 0.06 }}
                    >
                        {isPro && mockTemplate ? (
                            <button
                                onClick={() => generateFromTemplate(mockTemplate.id, 'mock')}
                                disabled={isGenerating === 'mock'}
                                className="group w-full bg-white border border-slate-100 hover:border-brand hover:shadow-sm transition-all p-6 text-left disabled:opacity-60"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-2 h-2 rounded-full bg-brand/30 mt-1.5 shrink-0" />
                                    <Shuffle size={14} className="text-slate-300 group-hover:text-brand transition-colors" />
                                </div>
                                <h3 className="text-base font-black text-slate-900 group-hover:text-brand transition-colors leading-tight mb-1">
                                    Randomised Mock
                                </h3>
                                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-400 mb-6">
                                    {mockTemplate.time_limit} min · generated fresh
                                </p>
                                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black group-hover:text-brand transition-colors">
                                    {isGenerating === 'mock' ? (
                                        <><RefreshCw size={11} className="animate-spin" /> Generating...</>
                                    ) : (
                                        <><Shuffle size={11} /> Generate<ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
                                    )}
                                </div>
                            </button>
                        ) : (
                            <div className="bg-white border border-dashed border-slate-200 p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <Lock size={13} className="text-slate-300 mt-0.5" />
                                </div>
                                <h3 className="text-base font-black text-slate-400 leading-tight mb-1">
                                    Randomised Mock
                                </h3>
                                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-300 mb-6">
                                    {isPro ? 'No template configured yet' : 'Fresh questions every time · Pro only'}
                                </p>
                                {!isPro && (
                                    <Link
                                        href="/portal/membership"
                                        className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-brand font-black hover:text-slate-900 transition-colors"
                                    >
                                        Unlock Pro <ArrowUpRight size={11} />
                                    </Link>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {mockTests.length === 0 && !mockTemplate && (
                        <div className="py-12 text-center border border-dashed border-slate-200">
                            <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300">No mock exams published yet</p>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: TOPIC PRACTICE (smaller, 3 tiles) ── */}
                <div className="col-span-2 space-y-3">
                    <div className="flex items-baseline justify-between mb-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Topic Practice</p>
                    </div>

                    {SUBJECTS.map((subject, i) => {
                        const weak = weakSubcategories[subject.key] || [];
                        const generating = isGenerating === subject.key;

                        return (
                            <motion.div
                                key={subject.key}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.07 }}
                            >
                                {isPro ? (
                                    <Link href={`/portal/practice/${subject.key}`}>
                                        <div className="group bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all p-5 cursor-pointer">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${subject.dot}`} />
                                                <ArrowUpRight size={12} className="text-slate-300 group-hover:text-brand transition-colors" />
                                            </div>
                                            <p className={`text-xs font-black mb-1 ${subject.color}`}>{subject.label}</p>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-brand transition-colors leading-tight mb-3">
                                                Practice
                                            </p>
                                            {weak.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {weak.map(w => (
                                                        <span key={w} className="text-[8px] uppercase tracking-[0.1em] text-amber-600 bg-amber-50 px-1.5 py-0.5">
                                                            ↓ {w}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[9px] uppercase tracking-[0.15em] text-slate-300">
                                                    Personalised drills
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="bg-white p-5 border border-dashed border-slate-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-1.5 h-1.5 rounded-full ${subject.dot} opacity-40`} />
                                            <Lock size={11} className="text-slate-300" />
                                        </div>
                                        <p className={`text-xs font-black mb-1 opacity-40 ${subject.color}`}>{subject.label}</p>
                                        <p className="text-sm font-black text-slate-400 leading-tight mb-3">
                                            Practice
                                        </p>
                                        <p className="text-[9px] uppercase tracking-[0.15em] text-slate-300 mb-3">
                                            Pro only
                                        </p>
                                        <Link
                                            href="/portal/membership"
                                            className="flex items-center gap-1 text-[9px] uppercase tracking-[0.15em] text-brand font-black hover:text-slate-900 transition-colors"
                                        >
                                            Unlock <ArrowUpRight size={10} />
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}