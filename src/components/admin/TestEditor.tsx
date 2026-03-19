"use client";

import { useState, useEffect } from 'react';
import {
    Plus, Trash2, CheckCircle2, XCircle, Save,
    Loader2, PlusCircle, BookOpen, X, Search, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Statement {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: string; // exists if from bank
    isFromBank?: boolean;
    categoryId: string;
    subcategoryId: string;
    questionText: string;
    statements: Statement[];
}

export default function TestEditor({ initialData, testId }: { initialData?: any, testId?: string }) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData?.title || "");
    const [type, setType] = useState(initialData?.type || "mock");
    const [subject, setSubject] = useState(initialData?.subject || "");
    const [minRole, setMinRole] = useState(initialData?.min_role || "free");
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [isSaving, setIsSaving] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]);

    // Side panel state
    const [panelOpen, setPanelOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [bankFilterCategory, setBankFilterCategory] = useState('');
    const [bankFilterSubcategory, setBankFilterSubcategory] = useState('');

    useEffect(() => {
        loadMetadata();
    }, []);

    async function loadMetadata() {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: subs } = await supabase.from('subcategories').select('*').order('name');
        if (cats) setCategories(cats);
        if (subs) setAllSubcategories(subs);
    }

    async function openPanel() {
        setPanelOpen(true);
        if (bankQuestions.length > 0) return;
        setBankLoading(true);

        const { data } = await supabase
            .from('questions')
            .select(`
                id,
                question_text,
                category_id,
                subcategory_id,
                question_items (id, item_text, is_correct)
            `)
            .order('created_at', { ascending: false });

        if (data) setBankQuestions(data);
        setBankLoading(false);
    }

    function addFromBank(bankQ: any) {
        // Prevent duplicates
        if (questions.some(q => q.id === bankQ.id)) return;

        setQuestions(prev => [...prev, {
            id: bankQ.id,
            isFromBank: true,
            categoryId: bankQ.category_id || '',
            subcategoryId: bankQ.subcategory_id || '',
            questionText: bankQ.question_text,
            statements: bankQ.question_items.map((item: any) => ({
                id: item.id,
                text: item.item_text,
                isCorrect: item.is_correct
            }))
        }]);
    }

    const filteredBankQuestions = bankQuestions.filter(q => {
        const matchesSearch = q.question_text.toLowerCase().includes(bankSearch.toLowerCase());
        const matchesCategory = !bankFilterCategory || q.category_id === bankFilterCategory;
        const matchesSubcategory = !bankFilterSubcategory || q.subcategory_id === bankFilterSubcategory;
        return matchesSearch && matchesCategory && matchesSubcategory;
    });

    const bankVisibleSubcategories = bankFilterCategory
        ? allSubcategories.filter(s => s.category_id === bankFilterCategory)
        : allSubcategories;

    // --- Inline Creation ---
    const handleCreateCategory = async (qIdx: number) => {
        const name = prompt("Enter new Category name:");
        if (!name) return;
        const { data, error } = await supabase.from('categories').insert({ name }).select().single();
        if (error) return alert("Error: " + error.message);
        setCategories([...categories, data]);
        updateQuestionField(qIdx, 'categoryId', data.id);
    };

    const handleCreateSubcategory = async (qIdx: number) => {
        const currentCatId = questions[qIdx].categoryId;
        if (!currentCatId) return alert("Please select a Category first.");
        const name = prompt("Enter new Subcategory name:");
        if (!name) return;
        const { data, error } = await supabase
            .from('subcategories')
            .insert({ category_id: currentCatId, name })
            .select()
            .single();
        if (error) return alert("Error: " + error.message);
        setAllSubcategories([...allSubcategories, data]);
        updateQuestionField(qIdx, 'subcategoryId', data.id);
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            categoryId: "",
            subcategoryId: "",
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

        try {
            const { data: testData, error: testErr } = await supabase
                .from('tests')
                .upsert({
                    id: testId,
                    title,
                    type,
                    subject: subject || null,
                    min_role: minRole
                })
                .select()
                .single();

            if (testErr) {
                alert(testErr.message);
                setIsSaving(false);
                return;
            }

            const currentTestId = testData.id;

            // Clear old links
            if (testId) {
                await supabase.from('test_questions').delete().eq('test_id', testId);
            }

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];

                if (q.isFromBank && q.id) {
                    // Already exists in bank — just link it
                    await supabase.from('test_questions').insert({
                        test_id: currentTestId,
                        question_id: q.id,
                        question_order: i + 1
                    });
                } else {
                    // New question — insert then link
                    const { data: qData, error: qErr } = await supabase
                        .from('questions')
                        .insert({
                            category_id: q.categoryId || null,
                            subcategory_id: q.subcategoryId || null,
                            question_text: q.questionText
                        })
                        .select()
                        .single();

                    if (qErr) continue;

                    await supabase.from('test_questions').insert({
                        test_id: currentTestId,
                        question_id: qData.id,
                        question_order: i + 1
                    });

                    await supabase.from('question_items').insert(
                        q.statements.map(s => ({
                            question_id: qData.id,
                            item_text: s.text,
                            is_correct: s.isCorrect
                        }))
                    );
                }
            }

            alert("Test saved!");
            router.push('/admin/tests');
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex gap-8 relative">

            {/* Main Editor */}
            <div className={`transition-all duration-300 ${panelOpen ? 'w-[60%]' : 'w-full'} max-w-5xl pb-24 space-y-8`}>

                {/* Test Header */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Test Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Full BBE Simulation 2026"
                            className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-brand outline-none pb-2 transition"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            >
                                <option value="assessment">Assessment</option>
                                <option value="mock">Full Mock</option>
                                <option value="subset">Topic Practice</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Subject</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={type !== 'subset'}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none disabled:opacity-40"
                            >
                                <option value="">None</option>
                                <option value="math">Math</option>
                                <option value="english">English</option>
                                <option value="economics">Economics</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Access</label>
                            <select
                                value={minRole}
                                onChange={(e) => setMinRole(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro Only</option>
                                <option value="admin">Admin Only</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-10 py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover transition shadow-xl shadow-blue-100"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Save Test
                        </button>
                        <button
                            onClick={openPanel}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition border ${panelOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'}`}
                        >
                            <BookOpen size={18} />
                            Question Bank
                        </button>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className={`bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden border-t-8 ${q.isFromBank ? 'border-t-green-400' : 'border-t-brand-tint0'}`}>

                            {/* Badge for bank questions */}
                            {q.isFromBank && (
                                <div className="px-8 pt-4">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                        From Bank
                                    </span>
                                </div>
                            )}

                            {/* Question Metadata */}
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 grid md:grid-cols-3 gap-6 items-center">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400">Category</label>
                                        {!q.isFromBank && (
                                            <button onClick={() => handleCreateCategory(qIdx)} className="text-[9px] font-bold text-brand hover:underline flex items-center gap-0.5">
                                                <PlusCircle size={10} /> NEW
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        value={q.categoryId}
                                        disabled={q.isFromBank}
                                        onChange={(e) => updateQuestionField(qIdx, 'categoryId', e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-60"
                                    >
                                        <option value="">Select Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400">Subcategory</label>
                                        {!q.isFromBank && (
                                            <button
                                                onClick={() => handleCreateSubcategory(qIdx)}
                                                disabled={!q.categoryId}
                                                className="text-[9px] font-bold text-brand hover:underline flex items-center gap-0.5 disabled:text-slate-300"
                                            >
                                                <PlusCircle size={10} /> NEW
                                            </button>
                                        )}
                                    </div>
                                    <select
                                        disabled={!q.categoryId || q.isFromBank}
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
                                    <button
                                        onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                                        className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="p-8 space-y-6">
                                <textarea
                                    value={q.questionText}
                                    disabled={q.isFromBank}
                                    onChange={(e) => updateQuestionField(qIdx, 'questionText', e.target.value)}
                                    placeholder="Enter the question stem..."
                                    className="w-full text-lg font-bold p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-brand-tint transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                />

                                <div className="space-y-3">
                                    {q.statements.map((s, sIdx) => (
                                        <div key={s.id} className="flex gap-3 items-center group/item">
                                            <button
                                                disabled={q.isFromBank}
                                                onClick={() => {
                                                    if (q.isFromBank) return;
                                                    const upd = [...questions];
                                                    upd[qIdx].statements[sIdx].isCorrect = !upd[qIdx].statements[sIdx].isCorrect;
                                                    setQuestions(upd);
                                                }}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${s.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                            >
                                                {s.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                            </button>
                                            <input
                                                value={s.text}
                                                disabled={q.isFromBank}
                                                onChange={(e) => {
                                                    const upd = [...questions];
                                                    upd[qIdx].statements[sIdx].text = e.target.value;
                                                    setQuestions(upd);
                                                }}
                                                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    ))}

                                    {!q.isFromBank && (
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
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full py-12 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:text-brand-tint0 hover:bg-brand-tint/20 transition-all group"
                    >
                        <Plus size={32} className="mb-2 group-hover:scale-110 transition" />
                        <span className="font-black uppercase tracking-widest text-xs">New Question</span>
                    </button>
                </div>
            </div>

            {/* Side Panel */}
            {panelOpen && (
                <div className="w-[40%] sticky top-6 h-[calc(100vh-3rem)] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">

                    {/* Panel Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div>
                            <p className="font-black text-slate-900">Question Bank</p>
                            <p className="text-xs text-slate-400">{filteredBankQuestions.length} questions</p>
                        </div>
                        <button
                            onClick={() => setPanelOpen(false)}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 border-b border-slate-100 space-y-3 shrink-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={bankSearch}
                                onChange={(e) => setBankSearch(e.target.value)}
                                placeholder="Search questions..."
                                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 transition"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={bankFilterCategory}
                                onChange={(e) => { setBankFilterCategory(e.target.value); setBankFilterSubcategory(''); }}
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select
                                value={bankFilterSubcategory}
                                disabled={!bankFilterCategory}
                                onChange={(e) => setBankFilterSubcategory(e.target.value)}
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none disabled:opacity-40"
                            >
                                <option value="">All Subcategories</option>
                                {bankVisibleSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Question List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                        {bankLoading && (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="animate-spin text-slate-300" size={24} />
                            </div>
                        )}

                        {!bankLoading && filteredBankQuestions.length === 0 && (
                            <p className="text-center text-slate-400 text-sm font-medium italic py-10">
                                No questions found.
                            </p>
                        )}

                        {!bankLoading && filteredBankQuestions.map((bq) => {
                            const alreadyAdded = questions.some(q => q.id === bq.id);
                            const category = categories.find(c => c.id === bq.category_id);

                            return (
                                <div
                                    key={bq.id}
                                    className={`p-4 rounded-2xl border transition ${alreadyAdded ? 'bg-slate-50 border-slate-100 opacity-50' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                >
                                    <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                        {bq.question_text}
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            {category && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand-tint px-2 py-0.5 rounded-full">
                                                    {category.name}
                                                </span>
                                            )}
                                            <span className="text-[9px] text-slate-400">
                                                {bq.question_items?.length || 0} statements
                                            </span>
                                        </div>
                                        <button
                                            disabled={alreadyAdded}
                                            onClick={() => addFromBank(bq)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-[9px] font-black uppercase rounded-xl hover:bg-brand-hover transition disabled:opacity-0"
                                        >
                                            Add <ChevronRight size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}