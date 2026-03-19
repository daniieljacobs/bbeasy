import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Trophy, Target, Zap, ArrowLeft, RotateCcw, Timer, TrendingUp } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getMultiplier(timeTaken: number, timeLimit: number): number {
    if (!timeLimit) return 1.0;
    const half = timeLimit * 0.5;
    if (timeTaken <= half) return 1.5;
    if (timeTaken >= timeLimit) return 1.0;
    const progress = (timeTaken - half) / half;
    return Math.round((1.5 - progress * 0.5) * 100) / 100;
}

export default async function ResultsPage({ params }: PageProps) {
    const { id } = await params;

    const { data: result, error } = await supabase
        .from('test_results')
        .select(`
            id,
            score,
            correct_count,
            total_count,
            points_awarded,
            time_taken,
            completed_at,
            test_id,
            tests (title, time_limit),
            user_answers (
                id,
                is_correct,
                user_choice,
                question_items (
                    id,
                    item_text,
                    questions (
                        id,
                        question_text,
                        points
                    )
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error || !result) {
        console.error("Fetch error:", error);
        return notFound();
    }

    // Group answers by question
    const questionMap = new Map<string, { questionText: string; points: number; statements: any[] }>();
    result.user_answers.forEach((answer: any) => {
        const question = answer.question_items?.questions;
        if (!question) return;
        if (!questionMap.has(question.id)) {
            questionMap.set(question.id, {
                questionText: question.question_text,
                points: question.points ?? 0,
                statements: []
            });
        }
        questionMap.get(question.id)!.statements.push({
            text: answer.question_items.item_text,
            isCorrect: answer.is_correct,
            userChoice: answer.user_choice
        });
    });

    const questions = Array.from(questionMap.values());
    const passed = result.score >= 70;
    const timeTaken = result.time_taken ?? 0;
    const timeLimit = (result.tests as any)?.time_limit ?? 0;
    const timeLimitSecs = timeLimit * 60;
    const multiplier = getMultiplier(timeTaken, timeLimitSecs);

    // Points breakdown
    const earnedPoints = result.correct_count ?? 0;
    const totalPoints = result.total_count ?? 0;

    return (
        <div className="max-w-4xl mx-auto px-6 py-14 font-mono space-y-10">

            {/* ── NAV ── */}
            <div className="flex items-center justify-between">
                <Link
                    href="/portal/dashboard"
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={12} /> Dashboard
                </Link>
                <Link
                    href={`/portal/tests/take/${result.test_id}`}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <RotateCcw size={12} /> Retake
                </Link>
            </div>

            {/* ── SCORE CARD ── */}
            <div className={`p-10 text-center border ${passed ? 'bg-brand/5 border-brand/20' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4">
                    {(result.tests as any)?.title}
                </p>
                <div className={`text-[7rem] font-black leading-none mb-3 ${passed ? 'text-brand' : 'text-slate-300'}`}>
                    {result.score}%
                </div>
                <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${passed ? 'text-brand' : 'text-slate-400'}`}>
                    {passed ? '✓ Passed' : 'Keep practicing'}
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
                    {[
                        {
                            icon: <Target size={14} />,
                            label: 'Points Earned',
                            value: `${earnedPoints.toFixed(1)} / ${totalPoints}`,
                        },
                        {
                            icon: <Timer size={14} />,
                            label: 'Time Taken',
                            value: timeTaken ? formatTime(timeTaken) : '—',
                        },
                        {
                            icon: <TrendingUp size={14} />,
                            label: 'Time Bonus',
                            value: passed ? `${multiplier}x` : '—',
                        },
                        {
                            icon: <Zap size={14} />,
                            label: 'Prep Points',
                            value: `+${result.points_awarded ?? 0}`,
                        },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 py-5 bg-white border border-slate-100">
                            <span className="text-slate-400">{s.icon}</span>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                            <p className="text-[8px] uppercase tracking-[0.25em] text-slate-400">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Points not awarded notice */}
                {!passed && (
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-4">
                        Score below 70% — no prep points awarded
                    </p>
                )}
            </div>

            {/* ── BREAKDOWN ── */}
            <div>
                <div className="flex items-baseline justify-between mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Question Breakdown</p>
                    <p className="text-[9px] text-slate-300 uppercase tracking-widest">{questions.length} questions</p>
                </div>

                <div className="space-y-3">
                    {questions.map((q, qIdx) => {
                        const correctCount = q.statements.filter((s: any) => s.isCorrect).length;
                        const allCorrect = correctCount === q.statements.length;
                        const noneCorrect = correctCount === 0;

                        return (
                            <div key={qIdx} className={`bg-white border ${allCorrect ? 'border-l-2 border-l-emerald-400 border-slate-100' : noneCorrect ? 'border-l-2 border-l-red-400 border-slate-100' : 'border-l-2 border-l-amber-400 border-slate-100'}`}>
                                {/* Question header */}
                                <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                                    <p className="text-sm font-black text-slate-900 leading-tight">{q.questionText}</p>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                                            {correctCount}/{q.statements.length} correct
                                        </span>
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-300">
                                            {q.points}pts
                                        </span>
                                    </div>
                                </div>

                                {/* Statements */}
                                <div className="divide-y divide-slate-50">
                                    {q.statements.map((s: any, sIdx: number) => (
                                        <div
                                            key={sIdx}
                                            className="flex items-center justify-between px-6 py-3"
                                        >
                                            <p className="text-sm text-slate-600 italic pr-4">{s.text}</p>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${s.userChoice ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {s.userChoice ? 'True' : 'False'}
                                                </span>
                                                {s.isCorrect
                                                    ? <CheckCircle size={14} className="text-emerald-500" />
                                                    : <XCircle size={14} className="text-red-400" />
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── BOTTOM CTA ── */}
            <div className="flex gap-3 justify-center pt-4">
                <Link
                    href="/portal/dashboard"
                    className="px-8 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand transition-colors"
                >
                    Dashboard
                </Link>
                <Link
                    href={`/portal/tests/take/${result.test_id}`}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] hover:border-brand hover:text-brand transition-colors"
                >
                    Retake
                </Link>
            </div>
        </div>
    );
}