"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Edit3, Trash2, Plus, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminTestsPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => { fetchTests(); }, []);

    async function fetchTests() {
        const { data } = await supabase
            .from('tests')
            .select(`*, test_results (score)`)
            .order('created_at', { ascending: false });
        if (data) setTests(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        const confirmed = confirm("Delete this test? This cannot be undone.");
        if (!confirmed) return;
        await supabase.from('test_questions').delete().eq('test_id', id);
        await supabase.from('test_results').delete().eq('test_id', id);
        await supabase.from('tests').delete().eq('id', id);
        setTests(tests.filter(t => t.id !== id));
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-14 font-mono">

            {/* ── HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-14 border-b border-slate-200 pb-8 flex items-end justify-between"
            >
                <div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Admin</p>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Tests.</h1>
                    <p className="text-slate-400 text-sm mt-2">Manage and monitor exam simulations.</p>
                </div>
                <Link
                    href="/admin/tests/new"
                    className="group flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors"
                >
                    <Plus size={12} /> New Test
                </Link>
            </motion.div>

            {/* ── TABLE ── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
                {tests.length === 0 ? (
                    <div className="py-24 text-center border border-dashed border-slate-200">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300 mb-2">No tests yet</p>
                        <p className="text-slate-400 text-sm">Create your first test to get started.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-100">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    {['Test', 'Type', 'Access', 'Attempts', 'Avg. Score', ''].map((h, i) => (
                                        <th key={i} className="px-6 py-4 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map((test, i) => {
                                    const attempts = test.test_results?.length || 0;
                                    const avg = attempts > 0
                                        ? (test.test_results.reduce((a: number, b: any) => a + b.score, 0) / attempts).toFixed(1)
                                        : null;

                                    const typeDot: Record<string, string> = {
                                        assessment: 'bg-violet-400',
                                        mock: 'bg-brand',
                                        subset: 'bg-emerald-400',
                                    };

                                    const accessColor: Record<string, string> = {
                                        pro: 'text-amber-500',
                                        admin: 'text-red-400',
                                        free: 'text-emerald-500',
                                        new: 'text-emerald-500',
                                    };

                                    return (
                                        <motion.tr
                                            key={test.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.1 + i * 0.04 }}
                                            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group"
                                        >
                                            {/* Title */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-black text-slate-900">{test.title}</p>
                                                {test.subject && (
                                                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-0.5">{test.subject}</p>
                                                )}
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot[test.type] ?? 'bg-slate-300'}`} />
                                                    {test.type || 'mock'}
                                                </span>
                                            </td>

                                            {/* Access */}
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${accessColor[test.min_role] ?? 'text-slate-400'}`}>
                                                    {test.min_role === 'new' ? 'Free' : test.min_role ?? 'Free'}
                                                </span>
                                            </td>

                                            {/* Attempts */}
                                            <td className="px-6 py-4 text-sm font-black text-slate-600">{attempts}</td>

                                            {/* Avg score */}
                                            <td className="px-6 py-4">
                                                {avg ? (
                                                    <span className={`text-sm font-black ${Number(avg) < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {avg}%
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-black text-slate-300">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => router.push(`/admin/tests/${test.id}/edit`)}
                                                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/5 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(test.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}