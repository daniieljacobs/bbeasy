"use client";

import { useState, useEffect } from 'react';
import {
    Plus, Trash2, CheckCircle2, XCircle, Save,
    Loader2, BookOpen, Layers, Trash, ChevronDown, PlusCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Statement {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: string;
    categoryId: string;
    subcategoryId: string;
    topic: string;
    questionText: string;
    statements: Statement[];
}

export default function TestEditor({ initialData, testId }: { initialData?: any, testId?: string }) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData?.title || "");
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [isSaving, setIsSaving] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]);

    useEffect(() => {
        loadMetadata();
    }, []);

    async function loadMetadata() {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: subs } = await supabase.from('subcategories').select('*').order('name');
        if (cats) setCategories(cats);
        if (subs) setAllSubcategories(subs);
    }

    // --- Inline Creation Logic ---

    const handleCreateCategory = async (qIdx: number) => {
        const name = prompt("Enter new Category name (e.g., Mathematics):");
        if (!name) return;

        const { data, error } = await supabase
            .from('categories')
            .insert({ name })
            .select()
            .single();

        if (error) {
            alert("Error creating category: " + error.message);
        } else {
            setCategories([...categories, data]);
            updateQuestionField(qIdx, 'categoryId', data.id); // Auto-select it
        }
    };

    const handleCreateSubcategory = async (qIdx: number) => {
        const currentCatId = questions[qIdx].categoryId;
        if (!currentCatId) return alert("Please select a Category first.");

        const name = prompt("Enter new Subcategory name (e.g., Linear Algebra):");
        if (!name) return;

        const { data, error } = await supabase
            .from('subcategories')
            .insert({ category_id: currentCatId, name })
            .select()
            .single();

        if (error) {
            alert("Error creating subcategory: " + error.message);
        } else {
            setAllSubcategories([...allSubcategories, data]);
            updateQuestionField(qIdx, 'subcategoryId', data.id); // Auto-select it
        }
    };

    // --- Core Management ---

    const addQuestion = () => {
        setQuestions([...questions, {
            categoryId: "",
            subcategoryId: "",
            topic: "",
            questionText: "",
            statements: [{ id: crypto.randomUUID(), text: "", isCorrect: true }]
        }]);
    };

    const updateQuestionField = (qIdx: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        // @ts-ignore
        updated[qIdx][field] = value;
        if (field === 'categoryId') updated[qIdx].subcategoryId = "";
        setQuestions(updated);
    };

    const handleSave = async () => {
        if (!title) return alert("Test title is required!");
        setIsSaving(true);

        const { data: testData, error: testErr } = await supabase
            .from('tests')
            .upsert({ id: testId, title })
            .select()
            .single();

        if (testErr) {
            alert(testErr.message);
            setIsSaving(false);
            return;
        }

        const currentTestId = testData.id;
        if (testId) await supabase.from('questions').delete().eq('test_id', testId);

        for (const q of questions) {
            const { data: qData, error: qErr } = await supabase
                .from('questions')
                .insert({
                    test_id: currentTestId,
                    category_id: q.categoryId || null,
                    subcategory_id: q.subcategoryId || null,
                    question_text: q.questionText
                })
                .select()
                .single();

            if (qErr) continue;

            const itemsToInsert = q.statements.map(s => ({
                question_id: qData.id,
                item_text: s.text,
                is_correct: s.isCorrect
            }));

            await supabase.from('question_items').insert(itemsToInsert);
        }

        alert("Test structure saved!");
        setIsSaving(false);
        router.push('/admin/tests');
    };

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-8 px-4">
            {/* 1. Global Header */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Master Test Title</label>
                    <input
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Full BBE Simulation 2026"
                        className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-blue-600 outline-none pb-2 transition"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Full Test
                </button>
            </div>

            {/* 2. Questions List */}
            <div className="space-y-10">
                {questions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden border-t-8 border-t-blue-500">

                        {/* Question Metadata Selectors */}
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 grid md:grid-cols-3 gap-6 items-center">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block">Category</label>
                                    <button onClick={() => handleCreateCategory(qIdx)} className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                                        <PlusCircle size={10} /> NEW
                                    </button>
                                </div>
                                <select
                                    value={q.categoryId}
                                    onChange={(e) => updateQuestionField(qIdx, 'categoryId', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                >
                                    <option value="">Select Category...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block">Subcategory</label>
                                    <button
                                        onClick={() => handleCreateSubcategory(qIdx)}
                                        disabled={!q.categoryId}
                                        className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 disabled:text-slate-300"
                                    >
                                        <PlusCircle size={10} /> NEW
                                    </button>
                                </div>
                                <select
                                    disabled={!q.categoryId}
                                    value={q.subcategoryId}
                                    onChange={(e) => updateQuestionField(qIdx, 'subcategoryId', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
                                >
                                    <option value="">Select Subcategory...</option>
                                    {allSubcategories.filter(s => s.category_id === q.categoryId).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Question Content */}
                        <div className="p-8 space-y-6">
                            <textarea
                                value={q.questionText}
                                onChange={(e) => updateQuestionField(qIdx, 'questionText', e.target.value)}
                                placeholder="Enter the question stem..."
                                className="w-full text-lg font-bold p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-50 transition-all"
                            />

                            <div className="space-y-3">
                                {q.statements.map((s, sIdx) => (
                                    <div key={s.id} className="flex gap-3 items-center group/item">
                                        <button
                                            onClick={() => {
                                                const upd = [...questions];
                                                upd[qIdx].statements[sIdx].isCorrect = !upd[qIdx].statements[sIdx].isCorrect;
                                                setQuestions(upd);
                                            }}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${s.isCorrect ? 'bg-green-100 text-green-600 shadow-sm' : 'bg-red-100 text-red-600 shadow-sm'}`}
                                        >
                                            {s.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                        </button>
                                        <div className="flex-1 relative">
                                            <input
                                                value={s.text}
                                                onChange={(e) => {
                                                    const upd = [...questions];
                                                    upd[qIdx].statements[sIdx].text = e.target.value;
                                                    setQuestions(upd);
                                                }}
                                                placeholder={`Statement ${sIdx + 1}...`}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition"
                                            />
                                            <button
                                                onClick={() => {
                                                    const upd = [...questions];
                                                    upd[qIdx].statements = upd[qIdx].statements.filter((_, i) => i !== sIdx);
                                                    setQuestions(upd);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const upd = [...questions];
                                        upd[qIdx].statements.push({ id: crypto.randomUUID(), text: "", isCorrect: true });
                                        setQuestions(upd);
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-xs font-black hover:bg-slate-50 transition-all"
                                >
                                    + ADD STATEMENT
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addQuestion}
                    className="w-full py-12 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50/20 transition-all group"
                >
                    <Plus size={32} className="mb-2 group-hover:scale-110 transition" />
                    <span className="font-black uppercase tracking-widest text-xs">New Question Block</span>
                </button>
            </div>
        </div>
    );
}