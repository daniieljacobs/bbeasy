"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PracticeRunner from '@/components/PracticeRunner';
import Link from 'next/link';
import { ArrowUpRight, RefreshCw } from 'lucide-react';

const QUESTION_COUNT = 12;
const WEAK_BIAS = 0.7; // 70% chance to pick from weak subcategories

export default function PracticePage() {
    const params = useParams();
    const router = useRouter();
    const subject = params.subject as string;

    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [finished, setFinished] = useState(false);
    const [results, setResults] = useState<{ correct: number; total: number } | null>(null);

    useEffect(() => {
        if (subject) generateQuestions();
    }, [subject]);

    async function generateQuestions() {
        setLoading(true);
        setError(null);

        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) { router.push('/auth/login'); return; }

            // Check role — practice is pro only
            const { data: profileData } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profileData || (profileData.role !== 'pro' && profileData.role !== 'admin')) {
                router.push('/portal/membership');
                return;
            }

            // Get user's weak subcategories for this subject
            const { data: userResults } = await supabase
                .from('test_results')
                .select('id')
                .eq('user_id', user.id);

            const resultIds = userResults?.map(r => r.id) || [];
            let weakSubcatIds = new Set<string>();

            if (resultIds.length > 0) {
                const { data: answers } = await supabase
                    .from('user_answers')
                    .select('is_correct, question_items (questions (categories (subject), subcategory_id, subcategories (id, name)))')
                    .in('result_id', resultIds);

                if (answers) {
                    const subcatMap: Record<string, { correct: number; total: number }> = {};
                    answers.forEach((a: any) => {
                        const answerSubject = a.question_items?.questions?.categories?.subject;
                        const subcatId = a.question_items?.questions?.subcategory_id;
                        if (answerSubject !== subject || !subcatId) return;
                        if (!subcatMap[subcatId]) subcatMap[subcatId] = { correct: 0, total: 0 };
                        subcatMap[subcatId].total++;
                        if (a.is_correct) subcatMap[subcatId].correct++;
                    });

                    // Bottom 3 subcategories by accuracy
                    weakSubcatIds = new Set(
                        Object.entries(subcatMap)
                            .filter(([, v]) => v.total >= 2)
                            .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))
                            .slice(0, 3)
                            .map(([id]) => id)
                    );
                }
            }

            // Fetch all questions for this subject with items

            const { data: allQuestions } = await supabase
                .from('questions')
                .select(`
                    id, question_text, points, subcategory_id,
                    context_text, context_image_url,
                    categories!inner(subject),
                    question_items!inner(id, item_text, is_correct)
                `)
                .eq('categories.subject', subject)
                .not('question_items', 'is', null);


            if (!allQuestions || allQuestions.length === 0) {
                setError(`No questions available for ${subject} yet.`);
                setLoading(false);
                return;
            }

            // Split into weak and normal pools
            const weakPool = allQuestions.filter(q => weakSubcatIds.has(q.subcategory_id));
            const normalPool = allQuestions.filter(q => !weakSubcatIds.has(q.subcategory_id));

            // Shuffle both
            const shuffle = (arr: any[]) => [...arr].sort(() => Math.random() - 0.5);
            const shuffledWeak = shuffle(weakPool);
            const shuffledNormal = shuffle(normalPool);

            // Pick questions with weak bias
            const selected: any[] = [];
            const total = Math.min(QUESTION_COUNT, allQuestions.length);

            for (let i = 0; i < total; i++) {
                const useWeak = shuffledWeak.length > 0 && Math.random() < WEAK_BIAS;
                if (useWeak) {
                    selected.push(shuffledWeak.shift());
                } else if (shuffledNormal.length > 0) {
                    selected.push(shuffledNormal.shift());
                } else if (shuffledWeak.length > 0) {
                    selected.push(shuffledWeak.shift());
                }
            }

            // Format for PracticeRunner
            const formatted = selected.map(q => ({
                id: q.id,
                questionText: q.question_text,
                contextText: q.context_text || '',
                contextImageUrl: q.context_image_url || '',
                points: q.points ?? (q.question_items.length - 1),
                statements: q.question_items.map((item: any) => ({
                    id: item.id,
                    text: item.item_text,
                    isCorrect: item.is_correct
                }))
            }));
            setQuestions(formatted);
        } catch (err) {
            console.error(err);
            setError('Something went wrong generating your practice session.');
        } finally {
            setLoading(false);
        }
    }

    function handleFinish(res: { correct: number; total: number }) {
        setResults(res);
        setFinished(true);
    }

    const subjectColor = subject === 'math' ? 'text-violet-400' :
        subject === 'english' ? 'text-emerald-400' : 'text-amber-400';

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">
                    Building your practice set...
                </p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-[60vh] font-mono">
            <div className="text-center">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-4">{error}</p>
                <Link href="/portal/dashboard" className="text-[9px] uppercase tracking-[0.2em] text-brand font-black hover:text-slate-900 transition-colors">
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );

    if (finished && results) return (
        <div className="flex items-center justify-center min-h-[60vh] px-6 font-mono">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center max-w-sm w-full"
            >
                <p className={`text-[9px] font-black uppercase tracking-[0.4em] mb-4 ${subjectColor}`}>
                    {subject} · Practice Complete
                </p>

                <div className="text-[6rem] font-black text-slate-900 leading-none mb-2">
                    {Math.round((results.correct / results.total) * 100)}%
                </div>

                <p className="text-slate-400 text-sm mb-2">
                    {results.correct} / {results.total} statements correct
                </p>

                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-10">
                    Your profile insights have been updated.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => { setFinished(false); setResults(null); generateQuestions(); }}
                        className="flex items-center gap-2 px-6 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors"
                    >
                        <RefreshCw size={11} /> Practice Again
                    </button>
                    <Link
                        href="/portal/dashboard"
                        className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] hover:border-slate-400 transition-colors"
                    >
                        Dashboard <ArrowUpRight size={11} />
                    </Link>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <PracticeRunner
                questions={questions}
                subject={subject}
                onFinish={handleFinish}
            />
        </div>
    );
}