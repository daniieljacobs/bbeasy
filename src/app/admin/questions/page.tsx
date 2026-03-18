"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Save, Loader2, PlusCircle, Plus, X } from 'lucide-react';

interface Statement {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface NewQuestion {
    categoryId: string;
    subcategoryId: string;
    questionText: string;
    statements: Statement[];
}

export default function QuestionBankPage() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterSubcategory, setFilterSubcategory] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [editState, setEditState] = useState<Record<string, any>>({});

    // New question form state
    const [showNewForm, setShowNewForm] = useState(false);
    const [isSavingNew, setIsSavingNew] = useState(false);
    const [newQuestion, setNewQuestion] = useState<NewQuestion>({
        categoryId: '',
        subcategoryId: '',
        questionText: '',
        statements: [{ id: crypto.randomUUID(), text: '', isCorrect: true }]
    });

    useEffect(() => {
        fetchAll();
    }, []);

    async function fetchAll() {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: subs } = await supabase.from('subcategories').select('*').order('name');

        const { data: qs } = await supabase
            .from('questions')
            .select(`
                id,
                question_text,
                category_id,
                subcategory_id,
                question_items (id, item_text, is_correct),
                test_questions (
                    tests (id, title)
                )
            `)
            .order('created_at', { ascending: false });

        if (cats) setCategories(cats);
        if (subs) setAllSubcategories(subs);
        if (qs) {
            setQuestions(qs);
            const initialEdit: Record<string, any> = {};
            qs.forEach((q: any) => {
                initialEdit[q.id] = {
                    questionText: q.question_text,
                    categoryId: q.category_id || "",
                    subcategoryId: q.subcategory_id || "",
                    statements: q.question_items.map((item: any) => ({
                        id: item.id,
                        text: item.item_text,
                        isCorrect: item.is_correct
                    }))
                };
            });
            setEditState(initialEdit);
        }

        setLoading(false);
    }

    // --- New question handlers ---
    function resetNewForm() {
        setNewQuestion({
            categoryId: '',
            subcategoryId: '',
            questionText: '',
            statements: [{ id: crypto.randomUUID(), text: '', isCorrect: true }]
        });
    }

    async function handleCreateCategory() {
        const name = prompt("Enter new Category name:");
        if (!name) return;
        const { data, error } = await supabase.from('categories').insert({ name }).select().single();
        if (error) return alert("Error: " + error.message);
        setCategories([...categories, data]);
        setNewQuestion(prev => ({ ...prev, categoryId: data.id }));
    }

    async function handleCreateSubcategory() {
        if (!newQuestion.categoryId) return alert("Please select a Category first.");
        const name = prompt("Enter new Subcategory name:");
        if (!name) return;
        const { data, error } = await supabase
            .from('subcategories')
            .insert({ category_id: newQuestion.categoryId, name })
            .select()
            .single();
        if (error) return alert("Error: " + error.message);
        setAllSubcategories([...allSubcategories, data]);
        setNewQuestion(prev => ({ ...prev, subcategoryId: data.id }));
    }

    async function handleSaveNew() {
        if (!newQuestion.questionText) return alert("Question text is required.");
        if (newQuestion.statements.some(s => !s.text)) return alert("All statements must have text.");
        setIsSavingNew(true);

        try {
            const { data: qData, error: qErr } = await supabase
                .from('questions')
                .insert({
                    category_id: newQuestion.categoryId || null,
                    subcategory_id: newQuestion.subcategoryId || null,
                    question_text: newQuestion.questionText
                })
                .select()
                .single();

            if (qErr) {
                alert("Error saving question: " + qErr.message);
                return;
            }

            await supabase.from('question_items').insert(
                newQuestion.statements.map(s => ({
                    question_id: qData.id,
                    item_text: s.text,
                    is_correct: s.isCorrect
                }))
            );

            await fetchAll();
            resetNewForm();
            setShowNewForm(false);
        } catch (err) {
            console.error(err);
            alert("Unexpected error.");
        } finally {
            setIsSavingNew(false);
        }
    }

    // --- Existing question handlers ---
    const filteredQuestions = questions.filter(q => {
        if (filterCategory && q.category_id !== filterCategory) return false;
        if (filterSubcategory && q.subcategory_id !== filterSubcategory) return false;
        return true;
    });

    const visibleSubcategories = filterCategory
        ? allSubcategories.filter(s => s.category_id === filterCategory)
        : allSubcategories;

    async function handleDelete(id: string) {
        const confirmed = confirm("Delete this question? It will be removed from all linked tests.");
        if (!confirmed) return;

        await supabase.from('question_items').delete().eq('question_id', id);
        await supabase.from('test_questions').delete().eq('question_id', id);
        await supabase.from('questions').delete().eq('id', id);

        setQuestions(questions.filter(q => q.id !== id));
    }

    async function handleSave(qId: string) {
        setSavingId(qId);
        const edit = editState[qId];

        await supabase
            .from('questions')
            .update({
                question_text: edit.questionText,
                category_id: edit.categoryId || null,
                subcategory_id: edit.subcategoryId || null
            })
            .eq('id', qId);

        for (const s of edit.statements) {
            await supabase
                .from('question_items')
                .update({ item_text: s.text, is_correct: s.isCorrect })
                .eq('id', s.id);
        }

        await fetchAll();
        setSavingId(null);
        setExpandedId(null);
    }

    function updateEdit(qId: string, field: string, value: any) {
        setEditState(prev => ({
            ...prev,
            [qId]: { ...prev[qId], [field]: value }
        }));
    }

    function updateStatement(qId: string, sIdx: number, field: string, value: any) {
        const statements = [...editState[qId].statements];
        statements[sIdx] = { ...statements[sIdx], [field]: value };
        updateEdit(qId, 'statements', statements);
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
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black">Question Bank</h1>
                    <p className="text-slate-500">{questions.length} questions total</p>
                </div>
                <button
                    onClick={() => { setShowNewForm(!showNewForm); resetNewForm(); }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition ${showNewForm ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'}`}
                >
                    {showNewForm ? <><X size={18} /> Cancel</> : <><Plus size={18} /> New Question</>}
                </button>
            </div>

            {/* New Question Form */}
            {showNewForm && (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-t-8 border-t-blue-500">
                    <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 grid md:grid-cols-3 gap-6 items-center">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Category</label>
                                <button onClick={handleCreateCategory} className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                                    <PlusCircle size={10} /> NEW
                                </button>
                            </div>
                            <select
                                value={newQuestion.categoryId}
                                onChange={(e) => setNewQuestion(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                            >
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black uppercase text-slate-400">Subcategory</label>
                                <button
                                    onClick={handleCreateSubcategory}
                                    disabled={!newQuestion.categoryId}
                                    className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-0.5 disabled:text-slate-300"
                                >
                                    <PlusCircle size={10} /> NEW
                                </button>
                            </div>
                            <select
                                disabled={!newQuestion.categoryId}
                                value={newQuestion.subcategoryId}
                                onChange={(e) => setNewQuestion(prev => ({ ...prev, subcategoryId: e.target.value }))}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50 outline-none"
                            >
                                <option value="">Select Subcategory...</option>
                                {allSubcategories.filter(s => s.category_id === newQuestion.categoryId).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end pt-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                New Question
                            </span>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <textarea
                            value={newQuestion.questionText}
                            onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                            placeholder="Enter the question stem..."
                            rows={3}
                            className="w-full text-lg font-bold p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-50 transition-all"
                        />

                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Statements</label>
                            {newQuestion.statements.map((s, sIdx) => (
                                <div key={s.id} className="flex gap-3 items-center group/item">
                                    <button
                                        onClick={() => {
                                            const updated = [...newQuestion.statements];
                                            updated[sIdx].isCorrect = !updated[sIdx].isCorrect;
                                            setNewQuestion(prev => ({ ...prev, statements: updated }));
                                        }}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition shrink-0 ${s.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                                    >
                                        {s.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                    </button>
                                    <div className="flex-1 relative">
                                        <input
                                            value={s.text}
                                            onChange={(e) => {
                                                const updated = [...newQuestion.statements];
                                                updated[sIdx].text = e.target.value;
                                                setNewQuestion(prev => ({ ...prev, statements: updated }));
                                            }}
                                            placeholder={`Statement ${sIdx + 1}...`}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition"
                                        />
                                        {newQuestion.statements.length > 1 && (
                                            <button
                                                onClick={() => setNewQuestion(prev => ({
                                                    ...prev,
                                                    statements: prev.statements.filter((_, i) => i !== sIdx)
                                                }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setNewQuestion(prev => ({
                                    ...prev,
                                    statements: [...prev.statements, { id: crypto.randomUUID(), text: '', isCorrect: true }]
                                }))}
                                className="w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-300 text-xs font-black hover:bg-slate-50 transition-all"
                            >
                                + ADD STATEMENT
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveNew}
                                disabled={isSavingNew}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isSavingNew ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save to Bank
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select
                    value={filterSubcategory}
                    onChange={(e) => setFilterSubcategory(e.target.value)}
                    disabled={!filterCategory}
                    className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none disabled:opacity-40"
                >
                    <option value="">All Subcategories</option>
                    {visibleSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {(filterCategory || filterSubcategory) && (
                    <button
                        onClick={() => { setFilterCategory(""); setFilterSubcategory(""); }}
                        className="px-4 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Question List */}
            <div className="space-y-4">
                {filteredQuestions.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold italic">No questions found.</p>
                    </div>
                )}

                {filteredQuestions.map((q) => {
                    const isExpanded = expandedId === q.id;
                    const edit = editState[q.id];
                    const category = categories.find(c => c.id === q.category_id);
                    const subcategory = allSubcategories.find(s => s.id === q.subcategory_id);
                    const linkedTests = q.test_questions?.map((tq: any) => tq.tests).filter(Boolean) || [];

                    return (
                        <div key={q.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{q.question_text}</p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        {category && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                {category.name}
                                            </span>
                                        )}
                                        {subcategory && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                                {subcategory.name}
                                            </span>
                                        )}
                                        {linkedTests.length > 0 ? (
                                            <span className="text-[10px] font-medium text-slate-400">
                                                Linked to: {linkedTests.map((t: any) => t.title).join(', ')}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-orange-400">
                                                Not linked to any test
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition"
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {isExpanded && edit && (
                                <div className="border-t border-slate-100 px-8 py-6 space-y-6 bg-slate-50/50">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Category</label>
                                            <select
                                                value={edit.categoryId}
                                                onChange={(e) => updateEdit(q.id, 'categoryId', e.target.value)}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                            >
                                                <option value="">None</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Subcategory</label>
                                            <select
                                                value={edit.subcategoryId}
                                                disabled={!edit.categoryId}
                                                onChange={(e) => updateEdit(q.id, 'subcategoryId', e.target.value)}
                                                className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none disabled:opacity-40"
                                            >
                                                <option value="">None</option>
                                                {allSubcategories
                                                    .filter(s => s.category_id === edit.categoryId)
                                                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block tracking-widest">Question</label>
                                        <textarea
                                            value={edit.questionText}
                                            onChange={(e) => updateEdit(q.id, 'questionText', e.target.value)}
                                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">Statements</label>
                                        {edit.statements.map((s: any, sIdx: number) => (
                                            <div key={s.id} className="flex gap-3 items-center">
                                                <button
                                                    onClick={() => updateStatement(q.id, sIdx, 'isCorrect', !s.isCorrect)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 ${s.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                                                >
                                                    {s.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                                </button>
                                                <input
                                                    value={s.text}
                                                    onChange={(e) => updateStatement(q.id, sIdx, 'text', e.target.value)}
                                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => handleSave(q.id)}
                                            disabled={savingId === q.id}
                                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            {savingId === q.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}