import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Target, Zap, ArrowLeft, RotateCcw, Timer, TrendingUp } from 'lucide-react';
import ResultsReview from '@/components/ResultsReview';

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
            tests (
                title,
                time_limit,
                test_questions (
                    question_order,
                    questions (
                        id,
                        question_text,
                        context_text,
                        context_image_url,
                        points,
                        question_items (
                            id,
                            item_text,
                            is_correct
                        )
                    )
                )
            ),
            user_answers (
                is_correct,
                user_choice,
                question_items (
                    id
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error || !result) {
        console.error("Fetch error:", error);
        return notFound();
    }

    // Build a lookup of answered statements from user_answers
    const answerMap = new Map<string, { userChoice: boolean; isCorrect: boolean }>();
    result.user_answers.forEach((ua: any) => {
        const itemId = ua.question_items?.id;
        if (itemId) answerMap.set(itemId, { userChoice: ua.user_choice, isCorrect: ua.is_correct });
    });

    // Build questions from the full test question list, merging in user answers
    const testObj = result.tests as any;
    const questions = (testObj?.test_questions ?? [])
        .sort((a: any, b: any) => a.question_order - b.question_order)
        .map((tq: any) => {
            const q = tq.questions;
            return {
                questionText: q.question_text,
                contextText: q.context_text ?? null,
                contextImageUrl: q.context_image_url ?? null,
                points: q.points ?? 0,
                statements: q.question_items.map((item: any) => {
                    const answer = answerMap.get(item.id);
                    if (!answer) {
                        return {
                            text: item.item_text,
                            correctAnswer: item.is_correct,
                            userChoice: null as boolean | null,
                            isCorrect: false,
                            wasSkipped: true,
                        };
                    }
                    return {
                        text: item.item_text,
                        correctAnswer: item.is_correct,
                        userChoice: answer.userChoice as boolean | null,
                        isCorrect: answer.isCorrect,
                        wasSkipped: false,
                    };
                }),
            };
        });

    const passed = result.score >= 70;
    const timeTaken = result.time_taken ?? 0;
    const timeLimit = testObj?.time_limit ?? 0;
    const timeLimitSecs = timeLimit * 60;
    const multiplier = getMultiplier(timeTaken, timeLimitSecs);
    const netPoints = result.correct_count ?? 0;
    const totalPoints = result.total_count ?? 0;
    // Clamp display to 0 — consistent with the score percentage which is also clamped
    const displayPoints = Math.max(0, netPoints);

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
                    {testObj?.title}
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
                            value: `${displayPoints.toFixed(1)} / ${totalPoints}`,
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

                {!passed && (
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-4">
                        Score below 70% — no prep points awarded
                    </p>
                )}
            </div>

            {/* ── SLIDING QUESTION REVIEW ── */}
            <div>
                <div className="flex items-baseline justify-between mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-slate-400">Question Review</p>
                    <p className="text-[9px] text-slate-300 uppercase tracking-widest">{questions.length} questions</p>
                </div>
                <ResultsReview questions={questions} />
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
