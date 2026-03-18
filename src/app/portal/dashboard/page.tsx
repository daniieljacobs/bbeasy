"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Play, CheckCircle, Clock, BookOpen, ChevronRight } from 'lucide-react';

export default function UserDashboard() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgScore: 0, completedCount: 0 });

    useEffect(() => {
        async function fetchRealData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Tests + Question Counts + User Results
            // We use the count: 'exact' to see how many questions belong to each test
            const { data: testsData, error } = await supabase
                .from('tests')
                .select(`
                    id,
                    title,
                    min_role,
                    questions (id),
                    test_results!inner (
                        score,
                        user_id
                    )
                `)
                // This filter ensures we get the results for THIS user
                .eq('test_results.user_id', user.id);

            // Note: If a test has no results, the !inner join might hide it. 
            // Better approach: Fetch tests and results separately for a dashboard.

            const { data: allTests } = await supabase
                .from('tests')
                .select('id, title, min_role, questions(id)');

            const { data: userResults } = await supabase
                .from('test_results')
                .select('test_id, score')
                .eq('user_id', user.id);

            if (allTests) {
                const formattedTests = allTests.map(test => {
                    const resultsForTest = userResults?.filter(r => r.test_id === test.id) || [];
                    return {
                        ...test,
                        questionCount: test.questions?.length || 0,
                        completed: resultsForTest.length > 0,
                        bestScore: resultsForTest.length > 0 ? Math.max(...resultsForTest.map(r => r.score)) : null
                    };
                });
                setTests(formattedTests);

                // Calculate Stats
                if (userResults && userResults.length > 0) {
                    const avg = userResults.reduce((acc, r) => acc + r.score, 0) / userResults.length;
                    setStats({ avgScore: Math.round(avg), completedCount: userResults.length });
                }
            }
            setLoading(false);
        }

        fetchRealData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Study Portal</h1>
                    <p className="text-slate-500 font-medium">Pick a simulation and start practicing.</p>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg. Score</p>
                        <p className="text-xl font-black text-blue-600">{stats.avgScore}%</p>
                    </div>
                    <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Completed</p>
                        <p className="text-xl font-black text-slate-900">{stats.completedCount}</p>
                    </div>
                </div>
            </div>

            {/* Test Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tests.map((test) => (
                    <div key={test.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${test.completed ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                {test.completed ? <CheckCircle size={28} /> : <BookOpen size={28} />}
                            </div>
                            {test.completed && (
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Best Score</p>
                                    <p className="text-lg font-black text-slate-900">{test.bestScore}%</p>
                                </div>
                            )}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                            {test.title}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">
                            {test.questionCount} Questions
                        </p>

                        <div className="mt-auto">
                            <Link
                                href={`/portal/tests/take/${test.id}`}
                                className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-slate-100"
                            >
                                {test.completed ? 'Retake Exam' : 'Start Assessment'}
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {tests.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold italic text-lg">No tests have been published yet.</p>
                    <p className="text-slate-400 text-sm">Check back later or contact an admin.</p>
                </div>
            )}
        </div>
    );
}