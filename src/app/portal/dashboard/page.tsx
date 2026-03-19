"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { CheckCircle, BookOpen, ChevronRight, Zap, Target, Trophy, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
    const [tests, setTests] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avgScore: 0, completedCount: 0, totalPoints: 0 });
    const [assessmentTaken, setAssessmentTaken] = useState(false);
    const [assessmentId, setAssessmentId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('full_name, username, total_points')
                .eq('id', user.id)
                .single();

            if (profileData) setProfile(profileData);

            // Fetch all tests with question counts via test_questions
            const { data: allTests } = await supabase
                .from('tests')
                .select('id, title, type, subject, min_role, test_questions(question_id)');

            // Fetch user results
            const { data: userResults } = await supabase
                .from('test_results')
                .select('test_id, score, points_awarded')
                .eq('user_id', user.id);

            if (allTests) {
                // Check if assessment has been taken
                const assessmentTest = allTests.find(t => t.type === 'assessment');
                if (assessmentTest) {
                    setAssessmentId(assessmentTest.id);
                    const assessmentResult = userResults?.find(r => r.test_id === assessmentTest.id);
                    setAssessmentTaken(!!assessmentResult);
                }

                const formattedTests = allTests
                    .filter(t => t.type !== 'assessment')
                    .map(test => {
                        const resultsForTest = userResults?.filter(r => r.test_id === test.id) || [];
                        return {
                            ...test,
                            questionCount: test.test_questions?.length || 0,
                            completed: resultsForTest.length > 0,
                            bestScore: resultsForTest.length > 0
                                ? Math.max(...resultsForTest.map(r => r.score))
                                : null
                        };
                    });

                setTests(formattedTests);

                if (userResults && userResults.length > 0) {
                    const avg = userResults.reduce((acc, r) => acc + r.score, 0) / userResults.length;
                    const totalPoints = userResults.reduce((acc, r) => acc + (r.points_awarded || 0), 0);
                    setStats({
                        avgScore: Math.round(avg),
                        completedCount: userResults.length,
                        totalPoints
                    });
                }
            }

            setLoading(false);
        }

        fetchData();
    }, []);

    const mockTests = tests.filter(t => t.type === 'mock');
    const subsetTests = tests.filter(t => t.type === 'subset');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}.` : 'Study Portal'}
                </h1>
                <p className="text-slate-500 font-medium mt-1">Pick a simulation and start practicing.</p>
            </div>

            {/* Assessment Banner */}
            {!assessmentTaken && assessmentId && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-brand text-white rounded-[2rem] px-10 py-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="font-black text-lg">Start with your assessment</p>
                            <p className="text-blue-200 text-sm font-medium">Find out where you stand and identify your weak areas before practicing.</p>
                        </div>
                    </div>
                    <Link
                        href={`/portal/tests/take/${assessmentId}`}
                        className="flex items-center gap-2 px-8 py-4 bg-white text-brand text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-tint transition-all shrink-0"
                    >
                        Take Assessment <ChevronRight size={14} />
                    </Link>
                </div>
            )}

            {/* Progress Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 px-6 py-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-10 h-10 bg-brand-tint rounded-xl flex items-center justify-center">
                        <Target size={18} className="text-brand" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avg. Score</p>
                        <p className="text-xl font-black text-slate-900">{stats.avgScore}%</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-10 h-10 bg-brand-tint rounded-xl flex items-center justify-center">
                        <CheckCircle size={18} className="text-brand" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tests Completed</p>
                        <p className="text-xl font-black text-slate-900">{stats.completedCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 px-6 py-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="w-10 h-10 bg-brand-tint rounded-xl flex items-center justify-center">
                        <Zap size={18} className="text-brand" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Prep Points</p>
                        <p className="text-xl font-black text-slate-900">{stats.totalPoints}</p>
                    </div>
                </div>
            </div>

            {/* Full Mock Tests */}
            {mockTests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Full Mock Exams</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockTests.map((test) => (
                            <TestCard key={test.id} test={test} />
                        ))}
                    </div>
                </div>
            )}

            {/* Subset Tests */}
            {subsetTests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Topic Practice</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subsetTests.map((test) => (
                            <TestCard key={test.id} test={test} />
                        ))}
                    </div>
                </div>
            )}

            {tests.length === 0 && (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold italic text-lg">No tests have been published yet.</p>
                    <p className="text-slate-400 text-sm">Check back later or contact an admin.</p>
                </div>
            )}
        </div>
    );
}

function TestCard({ test }: { test: any }) {
    return (
        <div className="group bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${test.completed ? 'bg-green-50 text-green-600' : 'bg-brand-tint text-brand'}`}>
                    {test.completed ? <CheckCircle size={24} /> : <BookOpen size={24} />}
                </div>
                {test.completed && (
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Best Score</p>
                        <p className="text-lg font-black text-slate-900">{test.bestScore}%</p>
                    </div>
                )}
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight group-hover:text-brand transition-colors">
                {test.title}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                {test.questionCount} Questions
            </p>

            <div className="mt-auto">
                <Link
                    href={`/portal/tests/take/${test.id}`}
                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand transition-all"
                >
                    {test.completed ? 'Retake' : 'Start'}
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    );
}