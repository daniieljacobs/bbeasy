"use client";

import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Loader2, Timer, Brain, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import MathText from '@/components/MathText';

// ─── GET READY SCREEN ───────────────────────────────────────────────────────

function GetReadyScreen({ testTitle, timeLimitMins, onStart }: { testTitle: string; timeLimitMins: number; onStart: () => void }) {
    const [phase, setPhase] = useState<'intro' | 'countdown' | 'go'>('intro');
    const [count, setCount] = useState(3);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        if (phase !== 'countdown') return;
        if (count === 0) { setPhase('go'); return; }
        const t = setTimeout(() => setCount(c => c - 1), 900);
        return () => clearTimeout(t);
    }, [phase, count]);

    const disclaimers = [
        { icon: <Brain size={14} />, text: "No AI assistance" },
        { icon: <Shield size={14} />, text: "Treat this as the real exam" },
        { icon: <Timer size={14} />, text: `${timeLimitMins} min limit · 1.5x bonus for finishing in the first half` },
    ];

    return (
        <div className="flex items-center justify-center px-4 py-20 font-mono">
            <AnimatePresence mode="wait">

                {phase === 'intro' && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -24, scale: 0.97 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center max-w-lg w-full"
                    >
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4"
                        >
                            You are about to begin
                        </motion.p>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-10"
                        >
                            {testTitle}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="border border-slate-200 bg-white p-6 mb-10 space-y-4"
                        >
                            {disclaimers.map((d, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-center gap-3 text-slate-500"
                                >
                                    <span className="text-brand/60 shrink-0">{d.icon}</span>
                                    <span className="text-xs">{d.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
                            onClick={() => setPhase('countdown')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-14 py-4 bg-brand text-white text-[9px] font-black uppercase tracking-[0.25em] hover:bg-slate-900 transition-colors shadow-xl shadow-brand/20"
                        >
                            I'm Ready
                        </motion.button>

                        <motion.a
                            href="/portal/dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="block mt-5 text-[9px] uppercase tracking-[0.25em] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            ← Back to Dashboard
                        </motion.a>
                    </motion.div>
                )}

                {phase === 'countdown' && (
                    <motion.div
                        key="countdown"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.3 }}
                        className="text-center"
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={count}
                                initial={{ opacity: 0, scale: 0.4, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.6, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="text-[10rem] font-black text-brand leading-none block"
                            >
                                {count}
                            </motion.span>
                        </AnimatePresence>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            className="text-[9px] uppercase tracking-[0.4em] text-slate-500 mt-4"
                        >
                            Get ready
                        </motion.p>
                    </motion.div>
                )}

                {phase === 'go' && (
                    <motion.div
                        key="go"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        onAnimationComplete={() => setTimeout(onStart, 500)}
                        className="text-center"
                    >
                        <span className="text-[6rem] font-black text-brand leading-none tracking-tight">GO.</span>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}

// ─── SCORING HELPERS ─────────────────────────────────────────────────────────

function getTimeMultiplier(timeTaken: number, timeLimitSecs: number): number {
    const half = timeLimitSecs * 0.5;
    if (timeTaken <= half) return 1.5;
    if (timeTaken >= timeLimitSecs) return 1.0;
    const progress = (timeTaken - half) / half;
    return 1.5 - progress * 0.5;
}

// ─── TEST RUNNER ─────────────────────────────────────────────────────────────

function TestRunnerInner({ questions, timeLimitSecs }: { questions: any[]; timeLimitSecs: number }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [showTimeWarning, setShowTimeWarning] = useState(false);
    const startTimeRef = useRef<number>(Date.now());

    const router = useRouter();
    const params = useParams();
    const testId = params.id as string;
    const currentQ = questions[currentIdx];

    useEffect(() => {
        const interval = setInterval(() => {
            const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsed(secs);
            if (secs >= timeLimitSecs && !showTimeWarning) setShowTimeWarning(true);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLimitSecs, showTimeWarning]);

    useEffect(() => {
        if (!showTimeWarning) return;
        const t = setTimeout(() => handleSubmit(true), 30000);
        return () => clearTimeout(t);
    }, [showTimeWarning]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const timeRatio = Math.min(elapsed / timeLimitSecs, 1);
    const isOverTime = elapsed >= timeLimitSecs;
    const multiplierNow = getTimeMultiplier(elapsed, timeLimitSecs);

    const handleSelect = (qId: string, sId: string, val: string) => {
        setAnswers({ ...answers, [qId]: { ...(answers[qId] || {}), [sId]: val } });
    };

    const isQuestionComplete = (qIdx: number) => {
        const q = questions[qIdx];
        return Object.keys(answers[q.id] || {}).length === q.statements.length;
    };

    const isTestComplete = questions.every((_, idx) => isQuestionComplete(idx));
    const answeredCount = questions.filter((_, idx) => isQuestionComplete(idx)).length;

    const handleSubmit = async (autoSubmit = false) => {
        if (!testId) return;
        setIsSubmitting(true);
        setShowTimeWarning(false);

        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            const user = authData?.user;
            if (authError || !user) {
                alert("Session expired. Please log in.");
                setIsSubmitting(false);
                return;
            }

            const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
            let totalPossible = 0;
            let totalEarned = 0;
            const answerRecords: any[] = [];

            questions.forEach((q) => {
                const qPoints = q.points ?? (q.statements.length - 1);
                const statementValue = qPoints / q.statements.length;
                totalPossible += qPoints;

                q.statements.forEach((s: any) => {
                    const userChoiceBool = answers[q.id]?.[s.id] === 'True';
                    const isCorrect = userChoiceBool === s.isCorrect;
                    if (isCorrect) totalEarned += statementValue;
                    answerRecords.push({ question_item_id: s.id, user_choice: userChoiceBool, is_correct: isCorrect });
                });
            });

            const score = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
            const multiplier = getTimeMultiplier(timeTaken, timeLimitSecs);
            const prepPoints = score >= 70 ? Math.round(totalEarned * multiplier) : 0;

            const { data: resultData, error: resultErr } = await supabase
                .from('test_results')
                .insert({
                    user_id: user.id,
                    test_id: testId,
                    score,
                    correct_count: parseFloat(totalEarned.toFixed(2)),
                    total_count: totalPossible,
                    points_awarded: prepPoints,
                    time_taken: timeTaken
                })
                .select()
                .single();

            if (resultErr) { alert(`Could not save result: ${resultErr.message}`); setIsSubmitting(false); return; }

            await supabase.from('user_answers').insert(answerRecords.map(r => ({ ...r, result_id: resultData.id })));
            if (prepPoints > 0) await supabase.rpc('increment_points', { user_id: user.id, points: prepPoints });
            router.push(`/portal/results/${resultData.id}`);

        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4 font-mono"
        >
            {/* ── TIME WARNING MODAL ── */}
            <AnimatePresence>
                {showTimeWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white border border-slate-200 p-10 max-w-md w-full text-center font-mono"
                        >
                            <p className="text-[9px] uppercase tracking-[0.4em] text-amber-500 mb-4">Time's up</p>
                            <h2 className="text-3xl font-black text-slate-900 mb-3">Time limit reached.</h2>
                            <p className="text-sm text-slate-500 mb-8">No time bonus will apply. Auto-submitting in 30 seconds.</p>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitting}
                                className="px-10 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Now'}
                            </button>
                            <button
                                onClick={() => setShowTimeWarning(false)}
                                className="block mx-auto mt-4 text-[9px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Keep going
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── STATUS BAR ── */}
            <div className="bg-white border border-slate-100 px-6 py-3 flex items-center gap-4">
                <Timer size={13} className={isOverTime ? 'text-amber-400' : 'text-slate-400'} />
                <span className={`text-sm font-black tabular-nums ${isOverTime ? 'text-amber-500' : 'text-slate-700'}`}>
                    {formatTime(elapsed)}
                </span>
                <span className="text-slate-300 text-xs">/ {formatTime(timeLimitSecs)}</span>

                <div className="flex-1 h-1 bg-slate-100 overflow-hidden">
                    <motion.div
                        className={`h-full transition-colors duration-1000 ${isOverTime ? 'bg-amber-400' : timeRatio > 0.8 ? 'bg-amber-400' : 'bg-brand'}`}
                        style={{ width: `${Math.min(timeRatio * 100, 100)}%` }}
                    />
                </div>

                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 shrink-0">
                    {answeredCount}/{questions.length} done
                </span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] shrink-0 ${multiplierNow > 1.0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {multiplierNow.toFixed(1)}x
                </span>
            </div>

            {/* ── QUESTION CARD ── */}
            <div className="bg-white border border-slate-100 shadow-sm">
                <div className="px-8 pt-8 pb-6 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                            Question {currentIdx + 1} of {questions.length}
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-300">
                            {currentQ.statements.length} statements · {currentQ.points ?? currentQ.statements.length - 1} pts
                        </span>
                    </div>

                    <h2 className="text-lg font-black text-slate-900 leading-snug">
                        <MathText text={currentQ.questionText} />
                    </h2>
                    <br></br>

                    {/* Context — text */}
                    {currentQ.contextText && (
                        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            <MathText text={currentQ.contextText} />
                        </div>
                    )}

                    {/* Context — image */}
                    {currentQ.contextImageUrl && (
                        <div className="mb-4">
                            <img
                                src={currentQ.contextImageUrl}
                                alt="Question context"
                                className="max-h-64 object-contain border border-slate-100"
                            />
                        </div>
                    )}


                </div>

                <div className="divide-y divide-slate-50">
                    {currentQ.statements.map((s: any) => {
                        const selected = answers[currentQ.id]?.[s.id];
                        return (
                            <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-colors">
                                <p className="text-sm text-slate-600 leading-relaxed mb-4 md:mb-0 md:pr-8 italic">
                                    <MathText text={s.text} />
                                </p>
                                <div className="flex gap-2 shrink-0">
                                    {['True', 'False'].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleSelect(currentQ.id, s.id, val)}
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

                <div className="flex justify-between items-center px-8 py-5 border-t border-slate-50">
                    <button
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                        className="flex items-center gap-2 text-[9px] font-black text-slate-400 disabled:opacity-0 transition hover:text-slate-900 uppercase tracking-widest"
                    >
                        <ChevronLeft size={14} /> Prev
                    </button>

                    {currentIdx === questions.length - 1 ? (
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting || !isTestComplete}
                            className="flex items-center gap-2 px-10 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-20 shadow-lg shadow-brand/10"
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin" size={12} /> Processing</> : 'Submit Test'}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="flex items-center gap-2 px-10 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] transition hover:bg-brand"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── PROGRESS DOTS ── */}
            <div className="flex justify-center flex-wrap gap-3 py-2">
                {questions.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIdx === idx
                            ? 'bg-brand scale-125 shadow-md shadow-brand/30'
                            : isQuestionComplete(idx)
                                ? 'bg-brand/30'
                                : 'bg-slate-200'
                            }`}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function TestRunner({ questions, testTitle, timeLimitMins = 180 }: {
    questions: any[];
    testTitle?: string;
    timeLimitMins?: number;
}) {
    const [started, setStarted] = useState(false);
    const timeLimitSecs = timeLimitMins * 60;

    return (
        <AnimatePresence mode="wait">
            {!started ? (
                <motion.div key="ready" exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }}>
                    <GetReadyScreen
                        testTitle={testTitle || "Assessment"}
                        timeLimitMins={timeLimitMins}
                        onStart={() => setStarted(true)}
                    />
                </motion.div>
            ) : (
                <motion.div key="test">
                    <TestRunnerInner questions={questions} timeLimitSecs={timeLimitSecs} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}