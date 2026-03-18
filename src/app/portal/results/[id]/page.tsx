import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Trophy, Target, Zap, ArrowLeft, RotateCcw } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
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
            completed_at,
            test_id,
            tests (title),
            user_answers (
                id,
                is_correct,
                user_choice,
                question_items (
                    id,
                    item_text,
                    questions (
                        id,
                        question_text
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
    const questionMap = new Map<string, { questionText: string; statements: any[] }>();
    result.user_answers.forEach((answer: any) => {
        const question = answer.question_items?.questions;
        if (!question) return;
        if (!questionMap.has(question.id)) {
            questionMap.set(question.id, {
                questionText: question.question_text,
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

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href="/portal/dashboard"
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition"
                >
                    <ArrowLeft size={14} /> Dashboard
                </Link>
                <Link
                    href={`/portal/tests/take/${result.test_id}`}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition"
                >
                    <RotateCcw size={14} /> Retake
                </Link>
            </div>

            {/* Score Card */}
            <div className={`rounded-[2.5rem] p-10 text-center border ${passed ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">
                    {(result.tests as any)?.title}
                </p>
                <div className={`text-8xl font-black mb-4 ${passed ? 'text-blue-900' : 'text-slate-400'}`}>
                    {result.score}%
                </div>
                <p className={`text-sm font-bold uppercase tracking-widest ${passed ? 'text-blue-600' : 'text-slate-400'}`}>
                    {passed ? 'Well done' : 'Keep practicing'}
                </p>

                {/* Stats Row */}
                <div className="flex justify-center gap-6 mt-8">
                    <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Target size={16} className="text-slate-400" />
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Correct</p>
                            <p className="text-sm font-black text-slate-900">{result.correct_count} / {result.total_count}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Zap size={16} className="text-slate-400" />
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Points</p>
                            <p className="text-sm font-black text-slate-900">+{result.points_awarded}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Trophy size={16} className="text-slate-400" />
                        <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                            <p className="text-sm font-black text-slate-900">{passed ? 'Passed' : 'Failed'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Breakdown */}
            <div className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Breakdown</h2>
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-4">
                        <p className="font-black text-slate-900 leading-tight">{q.questionText}</p>
                        <div className="space-y-2">
                            {q.statements.map((s: any, sIdx: number) => (
                                <div
                                    key={sIdx}
                                    className={`flex items-center justify-between p-4 rounded-2xl border ${s.isCorrect
                                        ? 'bg-green-50 border-green-100'
                                        : 'bg-red-50 border-red-100'
                                        }`}
                                >
                                    <p className="text-sm text-slate-600 italic pr-4">{s.text}</p>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            {s.userChoice ? 'True' : 'False'}
                                        </span>
                                        {s.isCorrect
                                            ? <CheckCircle size={18} className="text-green-500" />
                                            : <XCircle size={18} className="text-red-400" />
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom CTA */}
            <div className="flex gap-4 justify-center pt-4">
                <Link
                    href="/portal/dashboard"
                    className="px-8 py-4 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-900 transition-all shadow-lg"
                >
                    Back to Dashboard
                </Link>
                <Link
                    href={`/portal/tests/take/${result.test_id}`}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-900 text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:border-blue-900 hover:text-blue-900 transition-all"
                >
                    Retake Test
                </Link>
            </div>
        </div>
    );
}