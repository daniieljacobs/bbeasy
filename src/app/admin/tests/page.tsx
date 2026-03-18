"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Edit3, Trash2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminTestsPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchTests();
    }, []);

    async function fetchTests() {
        const { data } = await supabase
            .from('tests')
            .select(`*, test_results (score)`)
            .order('created_at', { ascending: false });

        if (data) setTests(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        const confirmed = confirm("Are you sure you want to delete this test? This cannot be undone.");
        if (!confirmed) return;

        await supabase.from('test_questions').delete().eq('test_id', id);
        await supabase.from('test_results').delete().eq('test_id', id);
        await supabase.from('tests').delete().eq('id', id);

        setTests(tests.filter(t => t.id !== id));
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black">Content Management</h1>
                    <p className="text-slate-500">Monitor and edit exam simulations.</p>
                </div>
                <Link
                    href="/admin/tests/new"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Create New Test
                </Link>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-50">
                        <tr className="text-xs font-black uppercase text-slate-400 tracking-widest">
                            <th className="px-8 py-5">Test Title</th>
                            <th className="px-8 py-5">Type</th>
                            <th className="px-8 py-5">Attempts</th>
                            <th className="px-8 py-5">Avg. Score</th>
                            <th className="px-8 py-5">Access</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tests.map((test) => {
                            const attempts = test.test_results?.length || 0;
                            const avg = attempts > 0
                                ? (test.test_results.reduce((a: number, b: any) => a + b.score, 0) / attempts).toFixed(1)
                                : null;

                            return (
                                <tr key={test.id} className="group hover:bg-slate-50/50 transition">
                                    <td className="px-8 py-5">
                                        <p className="font-bold">{test.title}</p>
                                        {test.subject && (
                                            <p className="text-xs text-slate-400 capitalize">{test.subject}</p>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${test.type === 'assessment' ? 'bg-purple-100 text-purple-700' :
                                                test.type === 'subset' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {test.type || 'mock'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium">{attempts}</td>
                                    <td className="px-8 py-5">
                                        {avg ? (
                                            <span className={`font-bold ${Number(avg) < 50 ? 'text-orange-500' : 'text-slate-900'}`}>
                                                {avg}%
                                            </span>
                                        ) : (
                                            <span className="text-slate-300 font-bold">—</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${test.min_role === 'pro' ? 'bg-amber-100 text-amber-700' :
                                                test.min_role === 'admin' ? 'bg-red-100 text-red-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            {test.min_role === 'new' ? 'Free' : test.min_role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right space-x-2">
                                        <button
                                            onClick={() => router.push(`/admin/tests/${test.id}/edit`)}
                                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(test.id)}
                                            className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {tests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                                    No tests created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}