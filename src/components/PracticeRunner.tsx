"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, Timer, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import MathText from '@/components/MathText';

interface Statement {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    questionText: string;
    points: number;
    statements: Statement[];
}

type AnswerMap = Record<string, string>; // statement id → 'True' | 'False'

export default function PracticeRunner({
    questions,
    subject,
    onFinish,
}: {
    questions: Question[];
    subject: string;
    onFinish: (results: { correct: number; total: number }) => void;
}) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<AnswerMap>({});
    const [checked, setChecked] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [sessionResults, setSessionResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const startTimeRef = useRef<number>(Date.now());
    const timeLimitSecs = 15 * 60; // 15 minutes soft limit

    const currentQ = questions[currentIdx];
    const isLast = currentIdx === questions.length - 1;
    const allAnswered = currentQ.statements.every(s => answers[s.id]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const timeRatio = Math.min(elapsed / timeLimitSecs, 1);
    const isOverTime = elapsed >= timeLimitSecs;

    function handleSelect(sId: string, val: string) {
        if (checked) return;
        setAnswers(prev => ({ ...prev, [sId]: val }));
    }

    async function handleCheck() {
        setChecked(true);

        // Count correct statements for this question
        let correct = 0;
        let total = currentQ.statements.length;
        currentQ.statements.forEach(s => {
            const userBool = answers[s.id] === 'True';
            if (userBool === s.isCorrect) correct++;
        });

        setSessionResults(prev => ({
            correct: prev.correct + correct,
            total: prev.total + total
        }));

        // Save answers to Supabase so spider graphs update
        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) return;

            // Create a lightweight practice result row
            const { data: resultData } = await supabase
                .from('test_results')
                .insert({
                    user_id: user.id,
                    test_id: null, // practice session, no formal test
                    score: Math.round((correct / total) * 100),
                    correct_count: correct,
                    total_count: total,
                    points_awarded: 0, // no points for practice
                    time_taken: Math.floor((Date.now() - startTimeRef.current) / 1000),
                    is_practice: true
                })
                .select()
                .single();

            if (resultData) {
                await supabase.from('user_answers').insert(
                    currentQ.statements.map(s => ({
                        result_id: resultData.id,
                        question_item_id: s.id,
                        user_choice: answers[s.id] === 'True',
                        is_correct: (answers[s.id] === 'True') === s.isCorrect
                    }))
                );
            }
        } catch (err) {
            console.error('Failed to save practice answers:', err);
        }
    }

    function handleNext() {
        if (isLast) {
            onFinish(sessionResults);
            return;
        }
        setAnswers({});
        setChecked(false);
        setCurrentIdx(prev => prev + 1);
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-12 font-mono space-y-6">

            {/* ── STATUS BAR ── */}
            <div className="flex items-center gap-4">
                <a
                    href="/portal/dashboard"
                    className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors font-black shrink-0"
                >
                    <ArrowLeft size={11} /> Exit
                </a>

                <div className="flex-1 h-0.5 bg-slate-100 overflow-hidden">
                    {/* Question progress */}
                    <motion.div
                        className="h-full bg-brand"
                        style={{ width: `${((currentIdx + (checked ? 1 : 0)) / questions.length) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                        {currentIdx + 1}/{questions.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <Timer size={11} className={isOverTime ? 'text-amber-400' : 'text-slate-400'} />
                        <span className={`text-[9px] font-black tabular-nums ${isOverTime ? 'text-amber-500' : 'text-slate-500'}`}>
                            {formatTime(elapsed)}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── QUESTION ── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white border border-slate-100"
                >
                    {/* Question header */}
                    <div className="px-8 pt-8 pb-6 border-b border-slate-50">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-[9px] font-black uppercase tracking-[0.3em] ${subject === 'math' ? 'text-violet-400' :
                                    subject === 'english' ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                {subject}
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-300">
                                {currentQ.statements.length} statements
                            </span>
                        </div>

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

                        <h2 className="text-lg font-black text-slate-900 leading-snug">
                            <MathText text={currentQ.questionText} />
                        </h2>
                    </div>

                    {/* Statements */}
                    <div className="divide-y divide-slate-50">
                        {currentQ.statements.map((s) => {
                            const userAnswer = answers[s.id];
                            const userBool = userAnswer === 'True';
                            const isRight = checked ? userBool === s.isCorrect : null;

                            return (
                                <div
                                    key={s.id}
                                    className={`px-8 py-5 transition-colors ${checked
                                            ? isRight ? 'bg-emerald-50/50' : 'bg-red-50/50'
                                            : 'hover:bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <p className="text-sm text-slate-600 leading-relaxed italic flex-1">
                                            <MathText text={s.text} />
                                        </p>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {/* True/False buttons */}
                                            <div className="flex gap-2">
                                                {['True', 'False'].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => handleSelect(s.id, val)}
                                                        disabled={checked}
                                                        className={`px-4 py-1.5 text-[9px] font-black tracking-widest uppercase border transition-all disabled:cursor-default
                                                            ${userAnswer === val
                                                                ? checked
                                                                    ? isRight
                                                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                                                        : 'bg-red-400 text-white border-red-400'
                                                                    : 'bg-brand text-white border-brand'
                                                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 disabled:hover:border-slate-200'
                                                            }`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Feedback icon + correct answer */}
                                            {checked && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    {isRight
                                                        ? <CheckCircle size={16} className="text-emerald-500" />
                                                        : (
                                                            <div className="flex items-center gap-1.5">
                                                                <XCircle size={16} className="text-red-400" />
                                                                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-red-400">
                                                                    {s.isCorrect ? 'True' : 'False'}
                                                                </span>
                                                            </div>
                                                        )
                                                    }
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Action button */}
                    <div className="px-8 py-5 border-t border-slate-50 flex justify-end">
                        {!checked ? (
                            <button
                                onClick={handleCheck}
                                disabled={!allAnswered}
                                className="px-10 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand transition-colors disabled:opacity-20"
                            >
                                Check
                            </button>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleNext}
                                className="flex items-center gap-2 px-10 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors"
                            >
                                {isLast ? 'Finish' : 'Next Question'}
                                <ChevronRight size={13} />
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ── SESSION SCORE (live) ── */}
            {sessionResults.total > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between px-1"
                >
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                        Session accuracy
                    </p>
                    <p className="text-[9px] font-black text-slate-600">
                        {sessionResults.correct}/{sessionResults.total} correct ({Math.round((sessionResults.correct / sessionResults.total) * 100)}%)
                    </p>
                </motion.div>
            )}
        </div>
    );
}