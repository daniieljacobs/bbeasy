"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import MathText from '@/components/MathText';

interface Statement {
    text: string;
    correctAnswer: boolean;
    userChoice: boolean | null;
    isCorrect: boolean;
    wasSkipped: boolean;
}

interface ReviewQuestion {
    questionText: string;
    contextText: string | null;
    contextImageUrl: string | null;
    points: number;
    statements: Statement[];
}

function calcNetEarned(statements: Statement[], points: number): number {
    const n = statements.length;
    if (n === 0) return 0;
    const sv = points / n;
    return statements.reduce((acc, s) => s.wasSkipped ? acc : s.isCorrect ? acc + sv : acc - sv, 0);
}

function QuestionScore({ statements, points }: { statements: Statement[]; points: number }) {
    const net = calcNetEarned(statements, points);
    const earned = Math.max(0, net);
    const noneAnswered = statements.every(s => s.wasSkipped);
    const color = noneAnswered
        ? 'text-slate-400'
        : earned >= points - 0.001
            ? 'text-emerald-500'
            : earned === 0
                ? 'text-red-400'
                : 'text-amber-500';
    return (
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${color}`}>
            {earned % 1 === 0 ? earned.toFixed(0) : earned.toFixed(1)} / {points} pts
        </span>
    );
}

export default function ResultsReview({ questions }: { questions: ReviewQuestion[] }) {
    const [idx, setIdx] = useState(0);
    const [direction, setDirection] = useState(1);

    if (questions.length === 0) return null;

    const q = questions[idx];
    const qNet = calcNetEarned(q.statements, q.points);
    const qEarned = Math.max(0, qNet);
    const qNoneAnswered = q.statements.every(s => s.wasSkipped);

    function go(next: number) {
        setDirection(next > idx ? 1 : -1);
        setIdx(next);
    }

    const accentColor = qNoneAnswered
        ? 'border-l-slate-300'
        : qEarned >= q.points - 0.001
            ? 'border-l-emerald-400'
            : qEarned === 0
                ? 'border-l-red-400'
                : 'border-l-amber-400';

    return (
        <div className="space-y-4">
            {/* Sliding card */}
            <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={idx}
                        custom={direction}
                        variants={{
                            enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
                            center: { x: 0, opacity: 1 },
                            exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className={`bg-white border border-slate-100 border-l-2 ${accentColor}`}
                    >
                        {/* Card header */}
                        <div className="px-6 py-5 border-b border-slate-50">
                            <div className="flex items-start justify-between gap-4 mb-1">
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">
                                    Question {idx + 1} of {questions.length}
                                </p>
                                <div className="flex items-center gap-3 shrink-0">
                                    <QuestionScore statements={q.statements} points={q.points} />
                                </div>
                            </div>
                            <p className="text-sm font-black text-slate-900 leading-snug mt-2">
                                <MathText text={q.questionText} />
                            </p>

                            {/* Context */}
                            {q.contextText && (
                                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 text-xs text-slate-500 leading-relaxed">
                                    <MathText text={q.contextText} />
                                </div>
                            )}
                            {q.contextImageUrl && (
                                <div className="mt-3">
                                    <img src={q.contextImageUrl} alt="context" className="max-h-48 object-contain border border-slate-100" />
                                </div>
                            )}
                        </div>

                        {/* Statements */}
                        <div className="divide-y divide-slate-50">
                            {q.statements.map((s, sIdx) => {
                                const correctLabel = s.correctAnswer ? 'True' : 'False';

                                return (
                                    <div
                                        key={sIdx}
                                        className={`px-6 py-4 ${s.wasSkipped ? 'bg-slate-50/30' : s.isCorrect ? 'bg-white' : 'bg-red-50/40'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Status icon */}
                                            <div className="mt-0.5 shrink-0">
                                                {s.wasSkipped
                                                    ? <MinusCircle size={15} className="text-slate-300" />
                                                    : s.isCorrect
                                                        ? <CheckCircle2 size={15} className="text-emerald-500" />
                                                        : <XCircle size={15} className="text-red-400" />
                                                }
                                            </div>

                                            {/* Statement text */}
                                            <p className="text-sm text-slate-600 leading-relaxed flex-1 italic">
                                                <MathText text={s.text} />
                                            </p>

                                            {/* Answer pills */}
                                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                {s.wasSkipped ? (
                                                    <>
                                                        {/* Skipped indicator */}
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[7px] uppercase tracking-[0.2em] text-slate-300 font-black">You</span>
                                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border bg-slate-50 border-slate-200 text-slate-400">
                                                                Skipped
                                                            </span>
                                                        </div>
                                                        {/* Always show correct answer for skipped */}
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[7px] uppercase tracking-[0.2em] text-slate-300 font-black">Ans</span>
                                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border bg-emerald-50 border-emerald-200 text-emerald-600">
                                                                {correctLabel}
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* User's pick */}
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[7px] uppercase tracking-[0.2em] text-slate-300 font-black">You</span>
                                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border
                                                                ${s.isCorrect
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                                                    : 'bg-red-50 border-red-200 text-red-500'
                                                                }`}>
                                                                {s.userChoice ? 'True' : 'False'}
                                                            </span>
                                                        </div>
                                                        {/* Correct answer — only show if wrong */}
                                                        {!s.isCorrect && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[7px] uppercase tracking-[0.2em] text-slate-300 font-black">Ans</span>
                                                                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] border bg-emerald-50 border-emerald-200 text-emerald-600">
                                                                    {correctLabel}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation row */}
            <div className="flex items-center justify-between px-1">
                {/* Prev */}
                <button
                    onClick={() => go(idx - 1)}
                    disabled={idx === 0}
                    className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-20"
                >
                    <ChevronLeft size={13} /> Prev
                </button>

                {/* Dot navigation */}
                <div className="flex items-center gap-1.5">
                    {questions.map((qDot, i) => {
                        const dotNet = calcNetEarned(qDot.statements, qDot.points);
                        const dotEarned = Math.max(0, dotNet);
                        const dotNoneAnswered = qDot.statements.every(s => s.wasSkipped);
                        const dotColor = dotNoneAnswered
                            ? 'bg-slate-300'
                            : dotEarned >= qDot.points - 0.001
                                ? 'bg-emerald-400'
                                : dotEarned === 0
                                    ? 'bg-red-400'
                                    : 'bg-amber-400';

                        return (
                            <button
                                key={i}
                                onClick={() => go(i)}
                                className={`transition-all rounded-full ${i === idx
                                    ? `w-5 h-2 ${dotColor}`
                                    : `w-2 h-2 ${dotColor} opacity-30 hover:opacity-60`
                                    }`}
                            />
                        );
                    })}
                </div>

                {/* Next */}
                <button
                    onClick={() => go(idx + 1)}
                    disabled={idx === questions.length - 1}
                    className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors disabled:opacity-20"
                >
                    Next <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}
