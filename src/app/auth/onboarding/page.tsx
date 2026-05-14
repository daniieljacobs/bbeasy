"use client";

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Check, Zap, Calendar } from 'lucide-react';
import MathText from '@/components/MathText';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Paste the question ID from the DB to use as the benchmark question.
// Leave empty to fall back to the oldest question in the bank.
const BENCHMARK_QUESTION_ID = '15dbaeb4-cdd9-4223-a4bd-fb99b7bc2e8e';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Stage = 'welcome' | 'intro' | 'question' | 'result' | 'pricing';

type QuestionData = {
    id: string;
    questionText: string;
    contextText: string | null;
    statements: { id: string; text: string; isCorrect: boolean }[];
};

type Result = {
    correct: number;
    total: number;
    outperformed: number | null;
    sampleSize: number;
};

// ─── INTRO STAGE ─────────────────────────────────────────────────────────────

function IntroStage({ name, onStart, onSkip }: { name: string; onStart: () => void; onSkip: () => void }) {
    return (
        <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-sm w-full mx-auto px-6 text-center"
        >
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6"
            >
                Before we start{name ? `, ${name}` : ''}
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="border border-slate-200 bg-white p-8 mb-8 space-y-5 text-left"
            >
                {[
                    { label: '1 question', detail: 'A real BBE exam statement question' },
                    { label: '~60 seconds', detail: 'No timer — go at your own pace' },
                    { label: 'Instant ranking', detail: 'See how you compare to real candidates' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-start gap-4"
                    >
                        <span className="text-brand font-black text-sm shrink-0 w-24">{item.label}</span>
                        <span className="text-xs text-slate-500">{item.detail}</span>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-3"
            >
                <motion.button
                    onClick={onStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-14 py-4 bg-brand text-white text-[9px] font-black uppercase tracking-[0.25em] hover:bg-slate-900 transition-colors shadow-xl shadow-brand/20 w-full"
                >
                    Start benchmark →
                </motion.button>
                <button
                    onClick={onSkip}
                    className="text-[9px] uppercase tracking-[0.25em] text-slate-300 hover:text-slate-500 transition-colors"
                >
                    Skip to plans
                </button>
            </motion.div>
        </motion.div>
    );
}

// ─── QUESTION STAGE ──────────────────────────────────────────────────────────

function QuestionStage({ question, onResult }: {
    question: QuestionData;
    onResult: (result: Result) => void;
}) {
    const [answers, setAnswers] = useState<Record<string, 'True' | 'False'>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = (sId: string, val: 'True' | 'False') => {
        setAnswers(prev => ({ ...prev, [sId]: val }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        let correct = 0;
        question.statements.forEach(s => {
            const ans = answers[s.id];
            if (ans !== undefined && (ans === 'True') === s.isCorrect) correct++;
        });
        const total = question.statements.length;
        const userScore = total > 0 ? correct / total : 0;

        const statementIds = question.statements.map(s => s.id);
        const { data: pastAnswers } = await supabase
            .from('user_answers')
            .select('result_id, is_correct')
            .in('question_item_id', statementIds);

        let outperformed: number | null = null;
        let sampleSize = 0;

        if (pastAnswers && pastAnswers.length > 0) {
            const resultMap = new Map<string, { correct: number; total: number }>();
            (pastAnswers as any[]).forEach(a => {
                if (!resultMap.has(a.result_id)) resultMap.set(a.result_id, { correct: 0, total: 0 });
                const r = resultMap.get(a.result_id)!;
                r.total++;
                if (a.is_correct) r.correct++;
            });
            const scores = Array.from(resultMap.values()).map(r => r.correct / r.total);
            sampleSize = scores.length;
            if (sampleSize >= 3) {
                const below = scores.filter(s => s < userScore).length;
                outperformed = Math.round((below / sampleSize) * 100);
            }
        }

        setIsSubmitting(false);
        onResult({ correct, total, outperformed, sampleSize });
    };

    return (
        <motion.div
            key="question"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl w-full mx-auto px-6"
        >
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3 text-center"
            >
                Benchmark question
            </motion.p>
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-sm text-slate-500 mb-8"
            >
                Mark each statement True or False — or skip any you're unsure about.
            </motion.p>

            <div className="bg-white border border-slate-200">
                <div className="px-7 pt-7 pb-5 border-b border-slate-100">
                    <p className="text-base font-black text-slate-900 leading-snug">
                        <MathText text={question.questionText} />
                    </p>
                    {question.contextText && (
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            <MathText text={question.contextText} />
                        </div>
                    )}
                </div>

                <div className="divide-y divide-slate-100">
                    {question.statements.map(s => {
                        const selected = answers[s.id];
                        return (
                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-7 py-5 gap-3">
                                <p className="text-sm text-slate-600 leading-relaxed italic flex-1 sm:pr-6">
                                    <MathText text={s.text} />
                                </p>
                                <div className="flex gap-2 shrink-0">
                                    {(['True', 'False'] as const).map(val => (
                                        <button
                                            key={val}
                                            onClick={() => handleSelect(s.id, val)}
                                            className={`px-5 py-2 text-[9px] font-black tracking-widest uppercase transition-all border ${selected === val
                                                ? 'bg-brand text-white border-brand shadow-md shadow-brand/20'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-700'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="px-7 py-5 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                        No penalty — you may skip
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={12} /> Working</> : 'See my result →'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ─── RESULT STAGE ─────────────────────────────────────────────────────────────

function ResultStage({ result, onContinue }: { result: Result; onContinue: () => void }) {
    const hasPercentile = result.outperformed !== null;

    const copy = hasPercentile
        ? result.outperformed! >= 70
            ? "You're ahead of most candidates. Keep that edge sharp."
            : result.outperformed! >= 40
                ? "Solid start. Let's get you to the top."
                : "The gap is closable. BBEasy is built for exactly this."
        : "Your result is locked in. You'll be ranked as more candidates join.";

    return (
        <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full mx-auto px-6 text-center"
        >
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8"
            >
                Your benchmark
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="mb-2"
            >
                <span className="text-[7rem] font-black text-brand leading-none">{result.correct}</span>
                <span className="text-3xl font-black text-slate-300">/{result.total}</span>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-[9px] uppercase tracking-[0.3em] text-slate-400 mb-10"
            >
                statements correct
            </motion.p>

            {hasPercentile ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-brand/5 border border-brand/15 px-8 py-6 mb-8"
                >
                    <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 mb-2">
                        vs {result.sampleSize} BBE candidates
                    </p>
                    <p className="text-3xl font-black text-brand">
                        Better than {result.outperformed}%
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{copy}</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-slate-50 border border-slate-200 px-8 py-6 mb-8"
                >
                    <p className="text-sm font-black text-slate-700 mb-1">You're among the first.</p>
                    <p className="text-xs text-slate-500">{copy}</p>
                </motion.div>
            )}

            <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                onClick={onContinue}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-14 py-4 bg-brand text-white text-[9px] font-black uppercase tracking-[0.25em] hover:bg-slate-900 transition-colors shadow-xl shadow-brand/20"
            >
                See your preparation plan →
            </motion.button>
        </motion.div>
    );
}

// ─── PRICING STAGE ────────────────────────────────────────────────────────────

function PricingStage() {
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                supabase.from('profiles').update({ has_onboarded: true }).eq('id', data.user.id);
            }
        });
    }, []);

    const freeFeatures = ['3 high-quality mocks', 'Core assessment'];
    const proFeatures = [
        'Full question bank access',
        'Unlimited practice sessions',
        'Performance tracking & insights',
        'Weak area targeting',
        'Cancel anytime',
    ];
    const passFeatures = [
        'Full question bank access',
        'Unlimited practice sessions',
        'Performance tracking & insights',
        'Weak area targeting',
        'Valid until 1 month after exam',
    ];

    return (
        <motion.div
            key="pricing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl w-full mx-auto px-6"
        >
            <div className="text-center mb-12">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Almost there</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                    Choose your plan.
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">

                {/* Free */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="bg-white border border-slate-200 p-8 flex flex-col"
                >
                    <div className="mb-6">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Basic</p>
                        <span className="text-4xl font-black text-slate-900">€0</span>
                        <span className="text-slate-400 text-sm ml-2">free</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        {freeFeatures.map(f => (
                            <li key={f} className="flex items-center gap-3">
                                <Check size={13} className="text-emerald-500 shrink-0" />
                                <span className="text-xs text-slate-600">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/portal/dashboard"
                        className="block w-full py-3 bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors text-center"
                    >
                        Get Started Free
                    </Link>
                </motion.div>

                {/* Monthly */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="bg-white border border-slate-200 p-8 flex flex-col"
                >
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={13} className="text-brand" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Monthly</p>
                        </div>
                        <span className="text-4xl font-black text-slate-900">€20</span>
                        <span className="text-slate-400 text-sm ml-2">/ month</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                        {proFeatures.map(f => (
                            <li key={f} className="flex items-center gap-3">
                                <Check size={13} className="text-emerald-500 shrink-0" />
                                <span className="text-xs text-slate-600">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/portal/membership"
                        className="block w-full py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors text-center"
                    >
                        Get Monthly Access
                    </Link>
                </motion.div>

                {/* Exam Pass */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="bg-slate-900 border border-slate-900 p-8 flex flex-col relative overflow-hidden"
                >
                    <div className="absolute top-4 right-4 px-2 py-1 bg-brand text-white text-[8px] font-black uppercase tracking-[0.2em]">
                        Best Value
                    </div>
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={13} className="text-slate-400" />
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Exam Pass</p>
                        </div>
                        <span className="text-4xl font-black text-white">€40</span>
                        <span className="text-slate-400 text-sm ml-2">one-time</span>
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-6">
                        Access until 31 July 2025
                    </p>
                    <ul className="space-y-3 mb-8 flex-1">
                        {passFeatures.map(f => (
                            <li key={f} className="flex items-center gap-3">
                                <Check size={13} className="text-emerald-400 shrink-0" />
                                <span className="text-xs text-slate-300">{f}</span>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/portal/membership"
                        className="block w-full py-3 bg-white text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-colors text-center"
                    >
                        Get Exam Pass
                    </Link>
                </motion.div>

            </div>

            <p className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-300 mt-8">
                Secure payment via Stripe · No hidden fees
            </p>
        </motion.div>
    );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function OnboardingPageInner() {
    const searchParams = useSearchParams();
    const name = searchParams.get('name') || '';

    const [stage, setStage] = useState<Stage>('welcome');
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [result, setResult] = useState<Result | null>(null);

    // Welcome auto-advances to intro
    useEffect(() => {
        const t = setTimeout(() => setStage('intro'), 1800);
        return () => clearTimeout(t);
    }, []);

    // Fetch benchmark question in background while user reads intro
    useEffect(() => {
        const query = BENCHMARK_QUESTION_ID
            ? supabase
                .from('questions')
                .select('id, question_text, context_text, question_items (id, item_text, is_correct)')
                .eq('id', BENCHMARK_QUESTION_ID)
                .single()
            : supabase
                .from('questions')
                .select('id, question_text, context_text, question_items (id, item_text, is_correct)')
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

        query.then(({ data }) => {
            if (data && (data as any).question_items?.length > 0) {
                setQuestion({
                    id: (data as any).id,
                    questionText: (data as any).question_text,
                    contextText: (data as any).context_text ?? null,
                    statements: (data as any).question_items.map((i: any) => ({
                        id: i.id,
                        text: i.item_text,
                        isCorrect: i.is_correct,
                    })),
                });
            }
        });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center font-mono selection:bg-brand selection:text-white overflow-hidden py-12">
            <AnimatePresence mode="wait">

                {stage === 'welcome' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center"
                    >
                        <h1 className="text-5xl font-bold text-slate-800 tracking-tighter">
                            BB<span className="text-brand">EASY</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-[0.5em] font-medium">
                            Welcome{name ? `, ${name}` : ''}
                        </p>
                    </motion.div>
                )}

                {stage === 'intro' && (
                    <IntroStage
                        name={name}
                        onStart={() => setStage('question')}
                        onSkip={() => setStage('pricing')}
                    />
                )}

                {stage === 'question' && (
                    question ? (
                        <QuestionStage
                            question={question}
                            onResult={r => { setResult(r); setStage('result'); }}
                        />
                    ) : (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Loader2 className="animate-spin text-brand" size={24} />
                            <button
                                onClick={() => setStage('pricing')}
                                className="text-[9px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors mt-4"
                            >
                                Skip to plans →
                            </button>
                        </motion.div>
                    )
                )}

                {stage === 'result' && result && (
                    <ResultStage result={result} onContinue={() => setStage('pricing')} />
                )}

                {stage === 'pricing' && <PricingStage />}

            </AnimatePresence>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={null}>
            <OnboardingPageInner />
        </Suspense>
    );
}
