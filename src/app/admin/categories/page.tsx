"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Subcategory {
    id: string;
    name: string;
    questionCount: number;
}

interface Category {
    id: string;
    name: string;
    questionCount: number;
    subcategories: Subcategory[];
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);

        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: subs } = await supabase.from('subcategories').select('*').order('name');
        const { data: questions } = await supabase.from('questions').select('id, category_id, subcategory_id');

        if (!cats) { setLoading(false); return; }

        const built: Category[] = cats.map(cat => {
            const catQuestions = questions?.filter(q => q.category_id === cat.id) || [];
            const catSubs = (subs || []).filter(s => s.category_id === cat.id).map(sub => ({
                id: sub.id,
                name: sub.name,
                questionCount: questions?.filter(q => q.subcategory_id === sub.id).length || 0,
            }));

            return {
                id: cat.id,
                name: cat.name,
                questionCount: catQuestions.length,
                subcategories: catSubs,
            };
        });

        setCategories(built);
        setLoading(false);
    }

    async function handleAddCategory() {
        const name = prompt('New category name:');
        if (!name?.trim()) return;
        const { error } = await supabase.from('categories').insert({ name: name.trim() });
        if (error) return alert('Error: ' + error.message);
        fetchAll();
    }

    async function handleAddSubcategory(categoryId: string) {
        const name = prompt('New subcategory name:');
        if (!name?.trim()) return;
        const { error } = await supabase.from('subcategories').insert({ category_id: categoryId, name: name.trim() });
        if (error) return alert('Error: ' + error.message);
        fetchAll();
    }

    async function handleDeleteCategory(cat: Category) {
        if (cat.questionCount > 0) {
            const confirmed = confirm(
                `"${cat.name}" has ${cat.questionCount} question${cat.questionCount !== 1 ? 's' : ''} linked to it. Deleting will unlink all questions. Continue?`
            );
            if (!confirmed) return;
        } else {
            const confirmed = confirm(`Delete category "${cat.name}"?`);
            if (!confirmed) return;
        }

        setDeletingId(cat.id);
        try {
            // Null out category references on questions
            await supabase.from('questions').update({ category_id: null, subcategory_id: null }).eq('category_id', cat.id);
            // Delete subcategories first
            await supabase.from('subcategories').delete().eq('category_id', cat.id);
            // Delete category
            await supabase.from('categories').delete().eq('id', cat.id);
            await fetchAll();
        } finally {
            setDeletingId(null);
        }
    }

    async function handleDeleteSubcategory(sub: Subcategory, catName: string) {
        if (sub.questionCount > 0) {
            const confirmed = confirm(
                `"${sub.name}" has ${sub.questionCount} question${sub.questionCount !== 1 ? 's' : ''} linked to it. Deleting will unlink those questions from this subcategory. Continue?`
            );
            if (!confirmed) return;
        } else {
            const confirmed = confirm(`Delete subcategory "${sub.name}" from "${catName}"?`);
            if (!confirmed) return;
        }

        setDeletingId(sub.id);
        try {
            await supabase.from('questions').update({ subcategory_id: null }).eq('subcategory_id', sub.id);
            await supabase.from('subcategories').delete().eq('id', sub.id);
            await fetchAll();
        } finally {
            setDeletingId(null);
        }
    }

    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400";

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    const totalQuestions = categories.reduce((sum, c) => sum + c.questionCount, 0);

    return (
        <div className="max-w-4xl mx-auto px-6 py-14 font-mono">

            {/* ── HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-14 border-b border-slate-200 pb-8 flex items-end justify-between"
            >
                <div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Admin</p>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Categories.</h1>
                    <p className="text-slate-400 text-sm mt-2">
                        {categories.length} categories · {categories.reduce((s, c) => s + c.subcategories.length, 0)} subcategories · {totalQuestions} questions
                    </p>
                </div>
                <button
                    onClick={handleAddCategory}
                    className="flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] border bg-brand text-white border-brand hover:bg-slate-900 hover:border-slate-900 transition-colors"
                >
                    <Plus size={12} /> New Category
                </button>
            </motion.div>

            {/* ── CATEGORY LIST ── */}
            <div className="space-y-3">
                {categories.length === 0 ? (
                    <div className="py-24 text-center border border-dashed border-slate-200">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300">No categories yet</p>
                    </div>
                ) : (
                    categories.map((cat, i) => {
                        const isExpanded = expandedId === cat.id;
                        const isDeleting = deletingId === cat.id;

                        return (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-white border border-slate-100"
                            >
                                {/* Category row */}
                                <div className="px-6 py-4 flex items-center gap-4 group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900">{cat.name}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <span className={labelClass}>
                                                {cat.questionCount} question{cat.questionCount !== 1 ? 's' : ''}
                                            </span>
                                            <span className={labelClass}>
                                                {cat.subcategories.length} subcategor{cat.subcategories.length !== 1 ? 'ies' : 'y'}
                                            </span>
                                            {/* Question distribution bar */}
                                            {totalQuestions > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-brand transition-all"
                                                            style={{ width: `${Math.round((cat.questionCount / totalQuestions) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={labelClass}>
                                                        {Math.round((cat.questionCount / totalQuestions) * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleAddSubcategory(cat.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border border-slate-200 hover:text-brand hover:border-brand transition-colors"
                                        >
                                            <Plus size={10} /> Sub
                                        </button>
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                                            className="p-2 text-slate-400 hover:text-brand transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat)}
                                            disabled={isDeleting}
                                            className="p-2 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40"
                                        >
                                            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-t border-slate-50"
                                        >
                                            <div className="px-6 py-3 space-y-1 bg-slate-50/30">
                                                {cat.subcategories.length === 0 ? (
                                                    <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300 py-2">No subcategories</p>
                                                ) : (
                                                    cat.subcategories.map(sub => {
                                                        const isDeletingSub = deletingId === sub.id;
                                                        return (
                                                            <div key={sub.id} className="flex items-center gap-4 py-2 px-3 group/sub hover:bg-white transition-colors">
                                                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                                                    <p className="text-xs font-bold text-slate-700">{sub.name}</p>
                                                                    <span className={labelClass}>
                                                                        {sub.questionCount} question{sub.questionCount !== 1 ? 's' : ''}
                                                                    </span>
                                                                    {cat.questionCount > 0 && (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-16 h-0.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-slate-400 transition-all"
                                                                                    style={{ width: `${Math.round((sub.questionCount / cat.questionCount) * 100)}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className={labelClass}>
                                                                                {Math.round((sub.questionCount / cat.questionCount) * 100)}%
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteSubcategory(sub, cat.name)}
                                                                    disabled={isDeletingSub}
                                                                    className="p-1.5 text-slate-200 hover:text-red-400 transition-colors opacity-0 group-hover/sub:opacity-100 disabled:opacity-40"
                                                                >
                                                                    {isDeletingSub ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}