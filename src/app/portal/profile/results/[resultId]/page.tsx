import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Target, ArrowLeft, RotateCcw, Timer, Trophy, Lock } from 'lucide-react'; // Added Trophy and Lock
import ResultsReview from '@/components/ResultsReview';

interface PageProps {
    params: Promise<{ resultId: string }>;
}

function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export default async function ProfileResultPage({ params }: PageProps) {
    const { resultId } = await params;

    // 1. Fetch the specific result
    const { data: result, error } = await supabase
        .from('test_results')
        .select(`
            id,
            user_id,
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
                    is_correct,
                    questions (
                        id,
                        question_text,
                        context_text,
                        context_image_url,
                        points
                    )
                )
            )
        `)
        .eq('id', resultId)
        .single();

    if (error || !result) return notFound();

    // 2. Fetch user profile to check for Pro status
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', result.user_id)
        .single();

    const isPro = profile?.role === 'pro' || profile?.role === 'admin';

    // 3. Calculate Percentile (Only for Pro)
    let testPercentile: number | null = null;
    if (isPro) {
        const { data: allLatest } = await supabase
            .from('test_results')
            .select('user_id, score, completed_at')
            .eq('test_id', result.test_id) // Usually percentile is relative to the specific test
            .eq('is_practice', false)
            .order('completed_at', { ascending: false });

        const seenUsers = new Set();
        const latestPerUser = allLatest?.filter(r => {
            if (seenUsers.has(r.user_id)) return false;
            seenUsers.add(r.user_id);
            return true;
        }) ?? [];

        const below = latestPerUser.filter(r => r.score < result.score).length;
        testPercentile = latestPerUser.length > 0
            ? Math.round((below / latestPerUser.length) * 100)
            : null;
    }

    const questionMap = new Map<string, any>();
    result.user_answers.forEach((answer: any) => {
        const question = answer.question_items?.questions;
        if (!question) return;
        if (!questionMap.has(question.id)) {
            questionMap.set(question.id, {
                questionText: question.question_text,
                contextText: question.context_text ?? null,
                contextImageUrl: question.context_image_url ?? null,
                points: question.points ?? 0,
                statements: []
            });
        }
        questionMap.get(question.id)!.statements.push({
            text: answer.question_items.item_text,
            correctAnswer: answer.question_items.is_correct,
            userChoice: answer.user_choice,
            isCorrect: answer.is_correct,
        });
    });

    const questions = Array.from(questionMap.values());
    const passed = result.score >= 70;
    const timeTaken = result.time_taken ?? 0;
    const earnedPoints = result.correct_count ?? 0;
    const totalPoints = result.total_count ?? 0;
    const completedAt = new Date(result.completed_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: '2-digit'
    });

    return (
        <div className="max-w-4xl mx-auto px-6 py-14 font-mono space-y-10">

            {/* ── NAV ── */}
            <div className="flex items-center justify-between">
                <Link
                    href="/portal/profile"
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={12} /> Profile
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
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">
                    {(result.tests as any)?.title}
                </p>
                <p className="text-[8px] uppercase tracking-[0.3em] text-slate-300 mb-4">
                    {completedAt}
                </p>
                <div className={`text-[7rem] font-black leading-none mb-3 ${passed ? 'text-brand' : 'text-slate-300'}`}>
                    {result.score}%
                </div>
                <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${passed ? 'text-brand' : 'text-slate-400'}`}>
                    {passed ? '✓ Passed' : 'Keep practicing'}
                </p>

                {/* Updated Stats row to grid-cols-3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-10 max-w-2xl mx-auto">
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
                            icon: <Trophy size={14} />,
                            label: 'Test Percentile',
                            value: isPro
                                ? (testPercentile !== null ? `Top ${100 - testPercentile}%` : '—')
                                : <div className="flex items-center justify-center gap-1.5"><Lock size={12} className="text-slate-300" /> <span className="text-slate-300">PRO</span></div>,
                        },
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 py-5 bg-white border border-slate-100 relative overflow-hidden">
                            <span className="text-slate-400">{s.icon}</span>
                            <div className="text-xl font-black text-slate-900">{s.value}</div>
                            <p className="text-[8px] uppercase tracking-[0.25em] text-slate-400">{s.label}</p>
                            {!isPro && i === 2 && (
                                <Link href="/portal/membership" className="absolute inset-0 bg-white/40 backdrop-blur-[1px] hover:backdrop-blur-0 transition-all flex items-center justify-center">
                                    <span className="sr-only">Upgrade to view</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── QUESTION REVIEW ── */}
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
                    href="/portal/profile"
                    className="px-8 py-3 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand transition-colors"
                >
                    Back to Profile
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