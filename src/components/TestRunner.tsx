"use client";

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function TestRunner({ questions }: { questions: any[] }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const params = useParams();
    const testId = params.id as string;

    const currentQ = questions[currentIdx];

    const handleSelect = (qId: string, sId: string, val: string) => {
        setAnswers({
            ...answers,
            [qId]: { ...(answers[qId] || {}), [sId]: val }
        });
    };

    const isQuestionComplete = (qIdx: number) => {
        const q = questions[qIdx];
        const qAnswers = answers[q.id] || {};
        return Object.keys(qAnswers).length === q.statements.length;
    };

    const isTestComplete = questions.every((_, idx) => isQuestionComplete(idx));

    const handleSubmit = async () => {
        if (!testId) {
            alert("Error: Test ID not found in URL.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            const user = authData?.user;

            if (authError || !user) {
                alert("Your session has expired. Please log in to save results.");
                setIsSubmitting(false);
                return;
            }

            let totalStatements = 0;
            let correctStatements = 0;
            const answerRecords: any[] = [];

            questions.forEach((q) => {
                q.statements.forEach((s: any) => {
                    totalStatements++;

                    const userChoiceString = answers[q.id]?.[s.id];
                    const userChoiceBool = userChoiceString === 'True';
                    const isCorrect = userChoiceBool === s.isCorrect;

                    if (isCorrect) correctStatements++;

                    answerRecords.push({
                        question_item_id: s.id,
                        user_choice: userChoiceBool,
                        is_correct: isCorrect
                    });
                });
            });

            const finalScore = (correctStatements / totalStatements) * 100;
            const pointsAwarded = finalScore >= 70 ? Math.round(finalScore * 10) : 0;

            const { data: resultData, error: resultErr } = await supabase
                .from('test_results')
                .insert({
                    user_id: user.id,
                    test_id: testId,
                    score: Math.round(finalScore),
                    correct_count: correctStatements,
                    total_count: totalStatements,
                    points_awarded: pointsAwarded
                })
                .select()
                .single();

            if (resultErr) {
                console.error("Database Error:", resultErr.message);
                alert(`Could not save result: ${resultErr.message}`);
                setIsSubmitting(false);
                return;
            }

            const finalAnswers = answerRecords.map(record => ({
                ...record,
                result_id: resultData.id
            }));

            const { error: answerErr } = await supabase
                .from('user_answers')
                .insert(finalAnswers);

            if (answerErr) {
                console.error("Answer Sync Error:", answerErr.message);
            }

            if (pointsAwarded > 0) {
                await supabase.rpc('increment_points', {
                    user_id: user.id,
                    points: pointsAwarded
                });
            }

            router.push(`/portal/results/${resultData.id}`);

        } catch (err) {
            console.error("Unexpected Error:", err);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 font-mono">
            <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/20 shadow-2xl min-h-[450px] flex flex-col">
                <div className="mb-8">
                    <span className="text-blue-900 font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">
                        {currentQ.topic || "Section Assessment"}
                    </span>
                    <h2 className="text-xl font-bold mt-2 text-slate-800 tracking-tight leading-tight">
                        {currentQ.questionText}
                    </h2>
                </div>

                <div className="space-y-3 flex-grow">
                    {currentQ.statements.map((s: any) => (
                        <div key={s.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 group transition-all hover:bg-white/10">
                            <p className="text-slate-600 pr-4 text-sm leading-relaxed mb-4 md:mb-0 italic">
                                {s.text}
                            </p>
                            <div className="flex gap-2 shrink-0">
                                {['True', 'False'].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleSelect(currentQ.id, s.id, val)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${answers[currentQ.id]?.[s.id] === val
                                            ? 'bg-blue-900 text-white shadow-lg'
                                            : 'bg-white/20 border border-white/20 text-slate-400 hover:border-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mt-12 pt-8 border-t border-slate-100/50">
                    <button
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                        className="flex items-center gap-2 text-xs font-bold text-slate-400 disabled:opacity-0 transition hover:text-slate-900 uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} /> prev
                    </button>

                    {currentIdx === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isTestComplete}
                            className="px-10 py-4 bg-blue-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all disabled:opacity-20 shadow-xl shadow-blue-900/10 flex items-center gap-2"
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin" size={14} /> Processing</> : "Finalize_Test"}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white text-[10px] font-bold rounded-2xl uppercase tracking-[0.2em] transition hover:bg-blue-900 shadow-lg shadow-black/5"
                        >
                            next <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-center flex-wrap gap-4">
                {questions.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-500 ${currentIdx === idx
                            ? 'bg-blue-900 scale-150 shadow-lg shadow-blue-900/20'
                            : isQuestionComplete(idx)
                                ? 'bg-blue-900/40'
                                : 'bg-slate-200'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}