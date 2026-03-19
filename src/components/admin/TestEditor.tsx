"use client";

import { useState, useEffect } from 'react';
import {
    Plus, Trash2, CheckCircle2, XCircle, Save,
    Loader2, PlusCircle, BookOpen, X, Search, ArrowUpRight, Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Statement {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id?: string;
    isFromBank?: boolean;
    categoryId: string;
    subcategoryId: string;
    questionText: string;
    points: number;
    statements: Statement[];
}

export default function TestEditor({ initialData, testId }: { initialData?: any, testId?: string }) {
    const router = useRouter();

    const [title, setTitle] = useState(initialData?.title || "");
    const [type, setType] = useState(initialData?.type || "mock");
    const [subject, setSubject] = useState(initialData?.subject || "");
    const [minRole, setMinRole] = useState(initialData?.min_role || "free");
    const [timeLimit, setTimeLimit] = useState(initialData?.time_limit || 180);
    const [questions, setQuestions] = useState<Question[]>(initialData?.questions || []);
    const [isSaving, setIsSaving] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [allSubcategories, setAllSubcategories] = useState<any[]>([]);

    const [panelOpen, setPanelOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const [bankFilterCategory, setBankFilterCategory] = useState('');
    const [bankFilterSubcategory, setBankFilterSubcategory] = useState('');

    useEffect(() => { loadMetadata(); }, []);

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
            .select(`id, question_text, category_id, subcategory_id, question_items (id, item_text, is_correct)`)
            .order('created_at', { ascending: false });
        if (data) setBankQuestions(data);
        setBankLoading(false);
    }

    function addFromBank(bankQ: any) {
        if (questions.some(q => q.id === bankQ.id)) return;
        const statementCount = bankQ.question_items.length;
        setQuestions(prev => [...prev, {
            id: bankQ.id,
            isFromBank: true,
            categoryId: bankQ.category_id || '',
            subcategoryId: bankQ.subcategory_id || '',
            questionText: bankQ.question_text,
            points: bankQ.points ?? (statementCount - 1),
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

    const handleCreateCategory = async (qIdx: number) => {
        const name = prompt("New category name:");
        if (!name) return;
        const { data, error } = await supabase.from('categories').insert({ name }).select().single();
        if (error) return alert("Error: " + error.message);
        setCategories([...categories, data]);
        updateQuestionField(qIdx, 'categoryId', data.id);
    };

    const handleCreateSubcategory = async (qIdx: number) => {
        const currentCatId = questions[qIdx].categoryId;
        if (!currentCatId) return alert("Select a category first.");
        const name = prompt("New subcategory name:");
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
            points: 0, // auto-updates to n-1 as statements are added
            statements: [{ id: crypto.randomUUID(), text: "", isCorrect: true }]
        }]);
    };

    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const lines = text.trim().split('\n');
            const rows = lines.slice(1); // skip header
            const imported: Question[] = [];

            for (const row of rows) {
                // Parse CSV respecting quoted fields
                const cols: string[] = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    if (char === '"') { inQuotes = !inQuotes; continue; }
                    if (char === ',' && !inQuotes) { cols.push(current.trim()); current = ''; continue; }
                    current += char;
                }
                cols.push(current.trim());

                const questionText = cols[0];
                if (!questionText) continue;

                // Second column is optional points override
                let colOffset = 1;
                let pointsOverride: number | null = null;
                if (cols[1] && !isNaN(Number(cols[1]))) {
                    pointsOverride = parseInt(cols[1]);
                    colOffset = 2;
                }

                const statements: Statement[] = [];
                for (let i = colOffset; i + 1 < cols.length; i += 2) {
                    const text = cols[i];
                    const isCorrect = cols[i + 1]?.toLowerCase() === 'true';
                    if (text) statements.push({ id: crypto.randomUUID(), text, isCorrect });
                }

                if (statements.length > 0) {
                    const points = pointsOverride ?? (statements.length - 1);
                    imported.push({ categoryId: '', subcategoryId: '', questionText, points, statements });
                }
            }

            if (imported.length === 0) return alert('No valid questions found in CSV.');
            setQuestions(prev => [...prev, ...imported]);
            e.target.value = '';
        };
        reader.readAsText(file);
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
                .upsert({ id: testId, title, type, subject: subject || null, min_role: minRole, time_limit: timeLimit })
                .select()
                .single();

            if (testErr) { alert(testErr.message); setIsSaving(false); return; }

            const currentTestId = testData.id;
            if (testId) await supabase.from('test_questions').delete().eq('test_id', testId);

            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (q.isFromBank && q.id) {
                    await supabase.from('test_questions').insert({
                        test_id: currentTestId, question_id: q.id, question_order: i + 1
                    });
                } else {
                    const { data: qData, error: qErr } = await supabase
                        .from('questions')
                        .insert({
                            category_id: q.categoryId || null,
                            subcategory_id: q.subcategoryId || null,
                            question_text: q.questionText,
                            points: q.points
                        })
                        .select().single();
                    if (qErr) continue;
                    await supabase.from('test_questions').insert({
                        test_id: currentTestId, question_id: qData.id, question_order: i + 1
                    });
                    await supabase.from('question_items').insert(
                        q.statements.map(s => ({ question_id: qData.id, item_text: s.text, is_correct: s.isCorrect }))
                    );
                }
            }
            router.push('/admin/tests');
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const selectClass = "w-full px-3 py-2.5 bg-white border border-slate-200 text-xs font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors text-slate-600";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    return (
        <div className="flex gap-6 relative font-mono">

            {/* ── MAIN EDITOR ── */}
            <div className={`transition-all duration-300 ${panelOpen ? 'w-[58%]' : 'w-full'} max-w-5xl pb-24 space-y-6`}>

                {/* Test metadata */}
                <div className="bg-white border border-slate-100 p-8 space-y-6">

                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Test title..."
                        className="w-full text-3xl font-black bg-transparent border-b-2 border-slate-100 focus:border-brand outline-none pb-3 transition-colors placeholder:text-slate-200 text-slate-900"
                    />

                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Type</label>
                            <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                                <option value="assessment">Assessment</option>
                                <option value="mock">Full Mock</option>
                                <option value="subset">Topic Practice</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Subject</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={type !== 'subset'}
                                className={`${selectClass} disabled:opacity-30`}
                            >
                                <option value="">None</option>
                                <option value="math">Math</option>
                                <option value="english">English</option>
                                <option value="economics">Economics</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Access</label>
                            <select value={minRole} onChange={(e) => setMinRole(e.target.value)} className={selectClass}>
                                <option value="free">Free</option>
                                <option value="pro">Pro Only</option>
                                <option value="admin">Admin Only</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Time Limit (min)</label>
                            <input
                                type="number"
                                min={1}
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 180)}
                                className={selectClass}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-8 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                            Save Test
                        </button>
                        <button
                            onClick={panelOpen ? () => setPanelOpen(false) : openPanel}
                            className={`flex items-center gap-2 px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] border transition-colors
                                ${panelOpen
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900'
                                }`}
                        >
                            <BookOpen size={12} />
                            {panelOpen ? 'Close Bank' : 'Question Bank'}
                        </button>

                        {/* CSV Import */}
                        <label className="flex items-center gap-2 px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200 text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-colors cursor-pointer">
                            <Upload size={12} />
                            Import CSV
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVImport}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                    {questions.map((q, qIdx) => (
                        <motion.div
                            key={qIdx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`bg-white border-l-2 border border-slate-100 ${q.isFromBank ? 'border-l-emerald-400' : 'border-l-brand'}`}
                        >
                            {/* Question header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-300">
                                        Q{qIdx + 1}
                                    </span>
                                    {q.isFromBank && (
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">
                                            From Bank
                                        </span>
                                    )}

                                    {/* Category + subcategory */}
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <select
                                                value={q.categoryId}
                                                disabled={q.isFromBank}
                                                onChange={(e) => updateQuestionField(qIdx, 'categoryId', e.target.value)}
                                                className="text-[9px] font-black uppercase tracking-[0.1em] bg-white border border-slate-200 px-2 py-1.5 outline-none focus:border-brand transition-colors disabled:opacity-40 text-slate-600"
                                            >
                                                <option value="">Category...</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {!q.isFromBank && (
                                                <button onClick={() => handleCreateCategory(qIdx)} className="text-slate-300 hover:text-brand transition-colors">
                                                    <PlusCircle size={12} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <select
                                                disabled={!q.categoryId || q.isFromBank}
                                                value={q.subcategoryId}
                                                onChange={(e) => updateQuestionField(qIdx, 'subcategoryId', e.target.value)}
                                                className="text-[9px] font-black uppercase tracking-[0.1em] bg-white border border-slate-200 px-2 py-1.5 outline-none focus:border-brand transition-colors disabled:opacity-30 text-slate-600"
                                            >
                                                <option value="">Subcategory...</option>
                                                {allSubcategories.filter(s => s.category_id === q.categoryId).map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {!q.isFromBank && (
                                                <button
                                                    onClick={() => handleCreateSubcategory(qIdx)}
                                                    disabled={!q.categoryId}
                                                    className="text-slate-300 hover:text-brand transition-colors disabled:opacity-20"
                                                >
                                                    <PlusCircle size={12} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Points — auto n-1, manually overrideable */}
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">pts</span>
                                            <input
                                                type="number"
                                                min={0}
                                                value={q.points === 0 && !q.isFromBank
                                                    ? q.statements.length - 1
                                                    : q.points}
                                                disabled={q.isFromBank}
                                                onChange={(e) => updateQuestionField(qIdx, 'points', parseInt(e.target.value) || 0)}
                                                className="w-12 px-2 py-1.5 text-[9px] font-black text-center bg-white border border-slate-200 outline-none focus:border-brand transition-colors disabled:opacity-40"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                                    className="text-slate-300 hover:text-red-400 transition-colors ml-4"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Question body */}
                            <div className="p-6 space-y-4">
                                <textarea
                                    value={q.questionText}
                                    disabled={q.isFromBank}
                                    onChange={(e) => updateQuestionField(qIdx, 'questionText', e.target.value)}
                                    placeholder="Enter question stem..."
                                    rows={2}
                                    className="w-full text-sm font-bold text-slate-900 p-4 bg-slate-50 border border-slate-100 outline-none focus:border-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed resize-none placeholder:text-slate-300"
                                />

                                <div className="space-y-2">
                                    {q.statements.map((s, sIdx) => (
                                        <div key={s.id} className="flex gap-3 items-center">
                                            <button
                                                disabled={q.isFromBank}
                                                onClick={() => {
                                                    if (q.isFromBank) return;
                                                    const upd = [...questions];
                                                    upd[qIdx].statements[sIdx].isCorrect = !upd[qIdx].statements[sIdx].isCorrect;
                                                    setQuestions(upd);
                                                }}
                                                className={`w-8 h-8 flex items-center justify-center transition-colors shrink-0 disabled:cursor-not-allowed
                                                    ${s.isCorrect ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'}`}
                                            >
                                                {s.isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                                            </button>
                                            <input
                                                value={s.text}
                                                disabled={q.isFromBank}
                                                onChange={(e) => {
                                                    const upd = [...questions];
                                                    upd[qIdx].statements[sIdx].text = e.target.value;
                                                    setQuestions(upd);
                                                }}
                                                placeholder={`Statement ${sIdx + 1}...`}
                                                className="flex-1 px-4 py-2.5 bg-white border border-slate-100 text-sm outline-none focus:border-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-300"
                                            />
                                            {!q.isFromBank && q.statements.length > 1 && (
                                                <button
                                                    onClick={() => {
                                                        const upd = [...questions];
                                                        upd[qIdx].statements = upd[qIdx].statements.filter((_, i) => i !== sIdx);
                                                        setQuestions(upd);
                                                    }}
                                                    className="text-slate-200 hover:text-red-400 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {!q.isFromBank && (
                                        <button
                                            onClick={() => {
                                                const upd = [...questions];
                                                upd[qIdx].statements.push({ id: crypto.randomUUID(), text: "", isCorrect: true });
                                                setQuestions(upd);
                                            }}
                                            className="w-full py-2.5 border border-dashed border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-brand hover:border-brand transition-colors"
                                        >
                                            + Add Statement
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Add question */}
                    <button
                        onClick={addQuestion}
                        className="group w-full py-10 border border-dashed border-slate-200 flex flex-col items-center gap-2 text-slate-300 hover:text-brand hover:border-brand transition-colors"
                    >
                        <Plus size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">New Question</span>
                    </button>
                </div>
            </div>

            {/* ── QUESTION BANK PANEL ── */}
            <AnimatePresence>
                {panelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-[42%] sticky top-6 h-[calc(100vh-3rem)] bg-white border border-slate-100 flex flex-col overflow-hidden"
                    >
                        {/* Panel header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <p className="text-sm font-black text-slate-900">Question Bank</p>
                                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-0.5">
                                    {filteredBankQuestions.length} questions
                                </p>
                            </div>
                            <button
                                onClick={() => setPanelOpen(false)}
                                className="text-slate-300 hover:text-slate-900 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-6 py-4 border-b border-slate-100 space-y-3 shrink-0">
                            <div className="relative">
                                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={bankSearch}
                                    onChange={(e) => setBankSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 text-xs outline-none focus:border-brand transition-colors placeholder:text-slate-300"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={bankFilterCategory}
                                    onChange={(e) => { setBankFilterCategory(e.target.value); setBankFilterSubcategory(''); }}
                                    className="flex-1 px-2 py-2 bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors text-slate-600"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select
                                    value={bankFilterSubcategory}
                                    disabled={!bankFilterCategory}
                                    onChange={(e) => setBankFilterSubcategory(e.target.value)}
                                    className="flex-1 px-2 py-2 bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors disabled:opacity-30 text-slate-600"
                                >
                                    <option value="">All Subcategories</option>
                                    {bankVisibleSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Question list */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                            {bankLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-slate-300" size={20} />
                                </div>
                            )}

                            {!bankLoading && filteredBankQuestions.length === 0 && (
                                <div className="py-16 text-center">
                                    <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300">No questions found</p>
                                </div>
                            )}

                            {!bankLoading && filteredBankQuestions.map((bq) => {
                                const alreadyAdded = questions.some(q => q.id === bq.id);
                                const category = categories.find(c => c.id === bq.category_id);

                                return (
                                    <div
                                        key={bq.id}
                                        className={`p-4 border transition-colors ${alreadyAdded
                                            ? 'border-slate-100 opacity-40'
                                            : 'border-slate-100 hover:border-slate-300 bg-white'
                                            }`}
                                    >
                                        <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-3">
                                            {bq.question_text}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {category && (
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand">
                                                        {category.name}
                                                    </span>
                                                )}
                                                <span className="text-[8px] text-slate-300 uppercase tracking-widest">
                                                    {bq.question_items?.length || 0} statements
                                                </span>
                                            </div>
                                            <button
                                                disabled={alreadyAdded}
                                                onClick={() => addFromBank(bq)}
                                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.15em] text-brand hover:text-slate-900 transition-colors disabled:opacity-0"
                                            >
                                                Add <ArrowUpRight size={10} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}