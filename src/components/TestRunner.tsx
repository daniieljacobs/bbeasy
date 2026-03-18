"use client";

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function TestRunner({ questions }: { questions: any[] }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, Record<number, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const params = useParams(); // To get the test ID from the URL ([id])

    const currentQ = questions[currentIdx];

    const handleSelect = (sIdx: number, val: string) => {
        setAnswers({
            ...answers,
            [currentIdx]: { ...(answers[currentIdx] || {}), [sIdx]: val }
        });
    };

    const isQuestionComplete = (qIdx: number) => {
        const qAnswers = answers[qIdx] || {};
        return Object.keys(qAnswers).length === questions[qIdx].statements.length;
    };

    // Calculate final score based on T/F correctness
    const calculateFinalScore = () => {
        let totalPoints = 0;
        let earnedPoints = 0;

        questions.forEach((q, qIdx) => {
            q.statements.forEach((s: any, sIdx: number) => {
                totalPoints++;
                const userAns = answers[qIdx]?.[sIdx];
                const correctStr = s.isCorrect ? 'True' : 'False';
                if (userAns === correctStr) earnedPoints++;
            });
        });

        return Math.round((earnedPoints / totalPoints) * 100);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("You must be logged in to save results.");
            setIsSubmitting(false);
            return;
        }

        const finalScore = calculateFinalScore();

        // 2. Insert into Supabase
        const { data, error } = await supabase
            .from('test_results')
            .insert({
                user_id: user.id,
                test_id: params.id, // Takes 'test-1' etc from URL
                score: finalScore,
                answers: answers // Stores the JSON of their choices
            })
            .select()
            .single();

        if (error) {
            console.error(error);
            alert("Error saving results: " + error.message);
            setIsSubmitting(false);
        } else {
            // 3. Send them to their specific result review page
            router.push(`/portal/results/${data.id}`);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-slate-200 shadow-xl min-h-[400px]">
                <div className="mb-6">
                    <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">{currentQ.topic}</span>
                    <h2 className="text-xl font-bold mt-2">{currentQ.questionText}</h2>
                </div>

                <div className="space-y-4">
                    {currentQ.statements.map((s: any, sIdx: number) => (
                        <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <p className="text-slate-700 pr-4 text-sm md:text-base">{s.text}</p>
                            <div className="flex gap-2 shrink-0">
                                {['True', 'False'].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleSelect(sIdx, val)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${answers[currentIdx]?.[sIdx] === val
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
                    <button
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx(prev => prev - 1)}
                        className="flex items-center gap-2 text-slate-400 disabled:opacity-0 transition hover:text-slate-600"
                    >
                        <ChevronLeft size={20} /> Previous
                    </button>

                    {currentIdx === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-100 transition hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Complete Exam <Send size={18} /></>}
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentIdx(prev => prev + 1)}
                            className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition hover:bg-slate-700"
                        >
                            Next <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-center flex-wrap gap-3">
                {questions.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-all ${currentIdx === idx ? 'ring-4 ring-blue-100 border-2 border-blue-600 text-blue-600 bg-white' :
                                isQuestionComplete(idx) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                            }`}
                    >
                        {idx + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}