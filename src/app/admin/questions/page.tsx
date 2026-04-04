"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Save, Loader2, PlusCircle, Plus, X, Sparkles, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MathText from '@/components/MathText';

interface Statement {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface NewQuestion {
    categoryId: string;
    subcategoryId: string;
    questionText: string;
    points: number;
    contextText: string;
    contextImageUrl: string;
    statements: Statement[];
}

const generateId = () => crypto.randomUUID();

const emptyStatements = (): Statement[] => [
    { id: generateId(), text: '', isCorrect: true }
];

const emptyQuestion = (): NewQuestion => ({
    categoryId: '', subcategoryId: '', questionText: '', points: 0,
    contextText: '', contextImageUrl: '',
    statements: emptyStatements()
});

const DEFAULT_PROMPT = `Generate a challenging but fair exam question suitable for university entrance level.
The question should test understanding of core concepts in the given category and subcategory.
Statements should be precise, unambiguous, and require genuine knowledge to evaluate correctly.
Mix true and false statements. Avoid trick questions — difficulty should come from depth of knowledge required.`;

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
    const [showNewForm, setShowNewForm] = useState(false);
    const [isSavingNew, setIsSavingNew] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newQuestion, setNewQuestion] = useState<NewQuestion>(emptyQuestion);

    // AI generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenConfig, setShowGenConfig] = useState(false);
    const [genPrompt, setGenPrompt] = useState(DEFAULT_PROMPT);
    const [genExtraContext, setGenExtraContext] = useState('');
    const [genError, setGenError] = useState('');

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: subs } = await supabase.from('subcategories').select('*').order('name');
        const { data: qs } = await supabase
            .from('questions')
            .select(`id, question_text, category_id, subcategory_id, points, context_text, context_image_url,
                question_items (id, item_text, is_correct),
                test_questions (tests (id, title))`)
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
                    points: q.points ?? (q.question_items.length - 1),
                    contextText: q.context_text || "",
                    contextImageUrl: q.context_image_url || "",
                    statements: q.question_items.map((item: any) => ({
                        id: item.id, text: item.item_text, isCorrect: item.is_correct
                    }))
                };
            });
            setEditState(initialEdit);
        }
        setLoading(false);
    }

    function resetNewForm() {
        setNewQuestion(emptyQuestion());
        setGenExtraContext('');
        setGenError('');
    }

    async function handleGenerate() {
        if (!newQuestion.categoryId) {
            setGenError('Select a category first.');
            return;
        }
        setIsGenerating(true);
        setGenError('');

        const categoryName = categories.find(c => c.id === newQuestion.categoryId)?.name || '';
        const subcategoryName = allSubcategories.find(s => s.id === newQuestion.subcategoryId)?.name || '';

        try {
            const res = await fetch('/api/generate-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: genPrompt,
                    categoryName,
                    subcategoryName,
                    extraContext: genExtraContext,
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                setGenError(data.error || 'Generation failed.');
                return;
            }

            setNewQuestion(prev => ({
                ...prev,
                questionText: data.questionText || '',
                contextText: data.contextText || '',
                points: data.statements?.length ? data.statements.length - 1 : 0,
                statements: (data.statements || []).map((s: any) => ({
                    id: generateId(),
                    text: s.text,
                    isCorrect: s.isCorrect,
                }))
            }));
        } catch (err: any) {
            setGenError(err.message || 'Unexpected error.');
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleImageUpload(file: File, onUrl: (url: string) => void) {
        setUploadingImage(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `question-context/${generateId()}.${ext}`;
            const { error } = await supabase.storage.from('question-images').upload(path, file);
            if (error) { alert('Upload failed: ' + error.message); return; }
            const { data } = supabase.storage.from('question-images').getPublicUrl(path);
            onUrl(data.publicUrl);
        } finally {
            setUploadingImage(false);
        }
    }

    async function handleCreateCategory() {
        const name = prompt("New category name:");
        if (!name) return;
        const { data, error } = await supabase.from('categories').insert({ name }).select().single();
        if (error) return alert("Error: " + error.message);
        setCategories([...categories, data]);
        setNewQuestion(prev => ({ ...prev, categoryId: data.id }));
    }

    async function handleCreateSubcategory() {
        if (!newQuestion.categoryId) return alert("Select a category first.");
        const name = prompt("New subcategory name:");
        if (!name) return;
        const { data, error } = await supabase
            .from('subcategories').insert({ category_id: newQuestion.categoryId, name }).select().single();
        if (error) return alert("Error: " + error.message);
        setAllSubcategories([...allSubcategories, data]);
        setNewQuestion(prev => ({ ...prev, subcategoryId: data.id }));
    }

    async function handleSaveNew() {
        if (!newQuestion.questionText) return alert("Question text is required.");
        if (newQuestion.statements.some(s => !s.text)) return alert("All statements must have text.");
        setIsSavingNew(true);
        try {
            const points = newQuestion.points || (newQuestion.statements.length - 1);
            const { data: qData, error: qErr } = await supabase
                .from('questions')
                .insert({
                    category_id: newQuestion.categoryId || null,
                    subcategory_id: newQuestion.subcategoryId || null,
                    question_text: newQuestion.questionText,
                    points,
                    context_text: newQuestion.contextText || null,
                    context_image_url: newQuestion.contextImageUrl || null,
                })
                .select().single();
            if (qErr) { alert("Error: " + qErr.message); return; }
            await supabase.from('question_items').insert(
                newQuestion.statements.map(s => ({ question_id: qData.id, item_text: s.text, is_correct: s.isCorrect }))
            );
            await fetchAll();
            resetNewForm();
            setShowNewForm(false);
        } catch (err) {
            alert("Unexpected error.");
        } finally {
            setIsSavingNew(false);
        }
    }

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
        await supabase.from('questions').update({
            question_text: edit.questionText,
            category_id: edit.categoryId || null,
            subcategory_id: edit.subcategoryId || null,
            points: edit.points,
            context_text: edit.contextText || null,
            context_image_url: edit.contextImageUrl || null,
        }).eq('id', qId);
        for (const s of edit.statements) {
            await supabase.from('question_items')
                .update({ item_text: s.text, is_correct: s.isCorrect }).eq('id', s.id);
        }
        await fetchAll();
        setSavingId(null);
        setExpandedId(null);
    }

    function updateEdit(qId: string, field: string, value: any) {
        setEditState(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
    }

    function updateStatement(qId: string, sIdx: number, field: string, value: any) {
        const statements = [...editState[qId].statements];
        statements[sIdx] = { ...statements[sIdx], [field]: value };
        updateEdit(qId, 'statements', statements);
    }

    const selectClass = "w-full px-3 py-2 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors text-slate-600";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-6 py-14 font-mono">

            {/* ── HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mb-14 border-b border-slate-200 pb-8 flex items-end justify-between"
            >
                <div>
                    <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Admin</p>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Questions.</h1>
                    <p className="text-slate-400 text-sm mt-2">{questions.length} questions in bank</p>
                </div>
                <button
                    onClick={() => { setShowNewForm(!showNewForm); resetNewForm(); }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] border transition-colors
                        ${showNewForm
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-brand text-white border-brand hover:bg-slate-900 hover:border-slate-900'
                        }`}
                >
                    {showNewForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> New Question</>}
                </button>
            </motion.div>

            {/* ── NEW QUESTION FORM ── */}
            <AnimatePresence>
                {showNewForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8 bg-white border-l-2 border-l-brand border border-slate-100"
                    >
                        {/* Form header */}
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-4 gap-4 items-end">
                            <div>
                                <label className={labelClass}>Category</label>
                                <div className="flex items-center gap-1.5">
                                    <select
                                        value={newQuestion.categoryId}
                                        onChange={(e) => setNewQuestion(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                                        className={selectClass}
                                    >
                                        <option value="">Category...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button onClick={handleCreateCategory} className="text-slate-300 hover:text-brand transition-colors shrink-0">
                                        <PlusCircle size={12} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Subcategory</label>
                                <div className="flex items-center gap-1.5">
                                    <select
                                        disabled={!newQuestion.categoryId}
                                        value={newQuestion.subcategoryId}
                                        onChange={(e) => setNewQuestion(prev => ({ ...prev, subcategoryId: e.target.value }))}
                                        className={`${selectClass} disabled:opacity-30`}
                                    >
                                        <option value="">Subcategory...</option>
                                        {allSubcategories.filter(s => s.category_id === newQuestion.categoryId).map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleCreateSubcategory}
                                        disabled={!newQuestion.categoryId}
                                        className="text-slate-300 hover:text-brand transition-colors shrink-0 disabled:opacity-20"
                                    >
                                        <PlusCircle size={12} />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Points</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={newQuestion.points || (newQuestion.statements.length - 1)}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 text-[9px] font-black text-center outline-none focus:border-brand transition-colors"
                                />
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                                    {newQuestion.statements.length} statements · n-1 = {newQuestion.statements.length - 1} pts
                                </span>
                            </div>
                        </div>

                        {/* ── AI GENERATION BAR ── */}
                        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !newQuestion.categoryId}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-violet-700 transition-colors disabled:opacity-40"
                            >
                                {isGenerating
                                    ? <><Loader2 size={11} className="animate-spin" /> Generating...</>
                                    : <><Sparkles size={11} /> Generate</>
                                }
                            </button>
                            <button
                                onClick={() => setShowGenConfig(!showGenConfig)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] border transition-colors
                                    ${showGenConfig ? 'bg-slate-100 text-slate-600 border-slate-200' : 'text-slate-400 border-slate-200 hover:text-brand hover:border-brand'}`}
                            >
                                <Settings2 size={11} /> Config
                            </button>
                            {!newQuestion.categoryId && (
                                <span className="text-[9px] uppercase tracking-[0.2em] text-amber-400">Select a category to generate</span>
                            )}
                            {genError && (
                                <span className="text-[9px] uppercase tracking-[0.2em] text-red-400">{genError}</span>
                            )}
                            {newQuestion.categoryId && !isGenerating && !genError && (
                                <span className="text-[9px] uppercase tracking-[0.2em] text-slate-300">
                                    {categories.find(c => c.id === newQuestion.categoryId)?.name}
                                    {newQuestion.subcategoryId && ` · ${allSubcategories.find(s => s.id === newQuestion.subcategoryId)?.name}`}
                                </span>
                            )}
                        </div>

                        {/* ── AI CONFIG PANEL ── */}
                        <AnimatePresence>
                            {showGenConfig && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-b border-slate-100"
                                >
                                    <div className="px-6 py-4 bg-violet-50/40 space-y-3">
                                        <div>
                                            <label className="text-[8px] font-black uppercase tracking-[0.3em] text-violet-400 mb-1.5 block">
                                                Generation Prompt
                                            </label>
                                            <textarea
                                                value={genPrompt}
                                                onChange={(e) => setGenPrompt(e.target.value)}
                                                rows={4}
                                                className="w-full text-xs text-slate-700 p-3 bg-white border border-violet-100 outline-none focus:border-violet-400 transition-colors resize-none"
                                            />
                                            <button
                                                onClick={() => setGenPrompt(DEFAULT_PROMPT)}
                                                className="mt-1 text-[8px] font-black uppercase tracking-[0.2em] text-violet-300 hover:text-violet-500 transition-colors"
                                            >
                                                Reset to default
                                            </button>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black uppercase tracking-[0.3em] text-violet-400 mb-1.5 block">
                                                Extra Context (optional)
                                            </label>
                                            <textarea
                                                value={genExtraContext}
                                                onChange={(e) => setGenExtraContext(e.target.value)}
                                                placeholder="Paste source material, topic hints, or specific instructions..."
                                                rows={3}
                                                className="w-full text-xs text-slate-700 p-3 bg-white border border-violet-100 outline-none focus:border-violet-400 transition-colors resize-none placeholder:text-slate-300"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form body */}
                        <div className="p-6 space-y-4">
                            {/* Question text with MathText preview */}
                            <div className="space-y-2">
                                <textarea
                                    value={newQuestion.questionText}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                                    placeholder="Enter question stem..."
                                    rows={2}
                                    className="w-full text-sm font-bold text-slate-900 p-4 bg-slate-50 border border-slate-100 outline-none focus:border-brand transition-colors resize-none placeholder:text-slate-300"
                                />
                                {newQuestion.questionText && (
                                    <div className="px-4 py-2 bg-white border border-slate-100 text-sm font-bold text-slate-700">
                                        <MathText text={newQuestion.questionText} />
                                    </div>
                                )}
                            </div>

                            {/* Context fields */}
                            <div className="border border-dashed border-slate-200 p-4 space-y-3">
                                <p className={labelClass}>Context (optional) — shown above question</p>
                                <textarea
                                    value={newQuestion.contextText}
                                    onChange={(e) => setNewQuestion(prev => ({ ...prev, contextText: e.target.value }))}
                                    placeholder="Paste text context here (supports $LaTeX$ inline and $$block$$)..."
                                    rows={3}
                                    className="w-full text-xs text-slate-700 p-3 bg-white border border-slate-100 outline-none focus:border-brand transition-colors resize-none placeholder:text-slate-300"
                                />
                                {newQuestion.contextText && (
                                    <div className="px-3 py-2 bg-white border border-slate-100 text-xs text-slate-600">
                                        <MathText text={newQuestion.contextText} />
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    {newQuestion.contextImageUrl ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <img src={newQuestion.contextImageUrl} alt="context" className="h-12 object-contain border border-slate-100" />
                                            <button
                                                onClick={() => setNewQuestion(prev => ({ ...prev, contextImageUrl: '' }))}
                                                className="text-[9px] uppercase tracking-[0.2em] text-red-400 font-black"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center gap-2 cursor-pointer text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand transition-colors">
                                            <Plus size={11} />
                                            {uploadingImage ? 'Uploading...' : 'Add Image'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file, url => setNewQuestion(prev => ({ ...prev, contextImageUrl: url })));
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {newQuestion.statements.map((s, sIdx) => (
                                    <div key={s.id} className="flex gap-3 items-start">
                                        <button
                                            onClick={() => {
                                                const updated = [...newQuestion.statements];
                                                updated[sIdx].isCorrect = !updated[sIdx].isCorrect;
                                                setNewQuestion(prev => ({ ...prev, statements: updated }));
                                            }}
                                            className={`w-8 h-8 flex items-center justify-center transition-colors shrink-0 mt-0.5
                                                ${s.isCorrect ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'}`}
                                        >
                                            {s.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                        </button>
                                        <div className="flex-1 space-y-1">
                                            <input
                                                value={s.text}
                                                onChange={(e) => {
                                                    const updated = [...newQuestion.statements];
                                                    updated[sIdx].text = e.target.value;
                                                    setNewQuestion(prev => ({ ...prev, statements: updated }));
                                                }}
                                                placeholder={`Statement ${sIdx + 1}...`}
                                                className="w-full px-4 py-2 bg-white border border-slate-100 text-sm outline-none focus:border-brand transition-colors placeholder:text-slate-300"
                                            />
                                            {s.text && (
                                                <div className="px-4 py-1 text-xs text-slate-500">
                                                    <MathText text={s.text} />
                                                </div>
                                            )}
                                        </div>
                                        {newQuestion.statements.length > 1 && (
                                            <button
                                                onClick={() => setNewQuestion(prev => ({
                                                    ...prev,
                                                    statements: prev.statements.filter((_, i) => i !== sIdx)
                                                }))}
                                                className="text-slate-200 hover:text-red-400 transition-colors mt-2"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={() => setNewQuestion(prev => ({
                                        ...prev,
                                        statements: [...prev.statements, { id: generateId(), text: '', isCorrect: true }]
                                    }))}
                                    className="w-full py-2.5 border border-dashed border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-brand hover:border-brand transition-colors"
                                >
                                    + Add Statement
                                </button>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveNew}
                                    disabled={isSavingNew}
                                    className="flex items-center gap-2 px-8 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                                >
                                    {isSavingNew ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    Save to Bank
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FILTERS ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08 }}
                className="flex items-center gap-3 mb-6"
            >
                <select
                    value={filterCategory}
                    onChange={(e) => { setFilterCategory(e.target.value); setFilterSubcategory(""); }}
                    className="px-3 py-2 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors text-slate-600"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    value={filterSubcategory}
                    onChange={(e) => setFilterSubcategory(e.target.value)}
                    disabled={!filterCategory}
                    className="px-3 py-2 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors disabled:opacity-30 text-slate-600"
                >
                    <option value="">All Subcategories</option>
                    {visibleSubcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {(filterCategory || filterSubcategory) && (
                    <button
                        onClick={() => { setFilterCategory(""); setFilterSubcategory(""); }}
                        className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        Clear
                    </button>
                )}
                <span className="ml-auto text-[9px] uppercase tracking-[0.2em] text-slate-300">
                    {filteredQuestions.length} shown
                </span>
            </motion.div>

            {/* ── QUESTION LIST ── */}
            <div className="bg-white border border-slate-100">
                {filteredQuestions.length === 0 ? (
                    <div className="py-24 text-center border border-dashed border-slate-200">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300 mb-2">No questions found</p>
                    </div>
                ) : (
                    filteredQuestions.map((q, i) => {
                        const isExpanded = expandedId === q.id;
                        const edit = editState[q.id];
                        const category = categories.find(c => c.id === q.category_id);
                        const subcategory = allSubcategories.find(s => s.id === q.subcategory_id);
                        const linkedTests = q.test_questions?.map((tq: any) => tq.tests).filter(Boolean) || [];

                        return (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-b border-slate-50 last:border-b-0"
                            >
                                {/* Row */}
                                <div className="px-6 py-4 flex items-center gap-4 group hover:bg-slate-50/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate">{q.question_text}</p>
                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                            {category && (
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand">
                                                    {category.name}
                                                </span>
                                            )}
                                            {subcategory && (
                                                <span className="text-[8px] uppercase tracking-[0.2em] text-slate-400">
                                                    {subcategory.name}
                                                </span>
                                            )}
                                            <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                                                {q.question_items?.length || 0} statements · {q.points ?? (q.question_items?.length - 1)} pts
                                            </span>
                                            {linkedTests.length > 0 ? (
                                                <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                                                    {linkedTests.map((t: any) => t.title).join(', ')}
                                                </span>
                                            ) : (
                                                <span className="text-[8px] uppercase tracking-[0.2em] text-amber-400">
                                                    Unlinked
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                            className="p-2 text-slate-400 hover:text-brand transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded edit */}
                                <AnimatePresence>
                                    {isExpanded && edit && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="border-t border-slate-100 overflow-hidden"
                                        >
                                            <div className="px-6 py-5 space-y-4 bg-slate-50/30">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className={labelClass}>Category</label>
                                                        <select
                                                            value={edit.categoryId}
                                                            onChange={(e) => updateEdit(q.id, 'categoryId', e.target.value)}
                                                            className={selectClass}
                                                        >
                                                            <option value="">None</option>
                                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Subcategory</label>
                                                        <select
                                                            value={edit.subcategoryId}
                                                            disabled={!edit.categoryId}
                                                            onChange={(e) => updateEdit(q.id, 'subcategoryId', e.target.value)}
                                                            className={`${selectClass} disabled:opacity-30`}
                                                        >
                                                            <option value="">None</option>
                                                            {allSubcategories
                                                                .filter(s => s.category_id === edit.categoryId)
                                                                .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Points</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={edit.points}
                                                            onChange={(e) => updateEdit(q.id, 'points', parseInt(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 text-[9px] font-black text-center outline-none focus:border-brand transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={edit.questionText}
                                                    onChange={(e) => updateEdit(q.id, 'questionText', e.target.value)}
                                                    rows={2}
                                                    className="w-full text-sm font-bold text-slate-900 p-4 bg-white border border-slate-100 outline-none focus:border-brand transition-colors resize-none"
                                                />
                                                <div className="border border-dashed border-slate-200 p-4 space-y-3">
                                                    <p className={labelClass}>Context (optional)</p>
                                                    <textarea
                                                        value={edit.contextText || ''}
                                                        onChange={(e) => updateEdit(q.id, 'contextText', e.target.value)}
                                                        placeholder="Text context (supports $LaTeX$)..."
                                                        rows={2}
                                                        className="w-full text-xs text-slate-700 p-3 bg-white border border-slate-100 outline-none focus:border-brand transition-colors resize-none placeholder:text-slate-300"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        {edit.contextImageUrl ? (
                                                            <div className="flex items-center gap-2">
                                                                <img src={edit.contextImageUrl} alt="context" className="h-12 object-contain border border-slate-100" />
                                                                <button
                                                                    onClick={() => updateEdit(q.id, 'contextImageUrl', '')}
                                                                    className="text-[9px] uppercase tracking-[0.2em] text-red-400 font-black"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="flex items-center gap-2 cursor-pointer text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand transition-colors">
                                                                <Plus size={11} />
                                                                {uploadingImage ? 'Uploading...' : 'Add Image'}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleImageUpload(file, url => updateEdit(q.id, 'contextImageUrl', url));
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {edit.statements.map((s: any, sIdx: number) => (
                                                        <div key={s.id} className="flex gap-3 items-center">
                                                            <button
                                                                onClick={() => updateStatement(q.id, sIdx, 'isCorrect', !s.isCorrect)}
                                                                className={`w-8 h-8 flex items-center justify-center transition-colors shrink-0
                                                                    ${s.isCorrect ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'}`}
                                                            >
                                                                {s.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                            </button>
                                                            <input
                                                                value={s.text}
                                                                onChange={(e) => updateStatement(q.id, sIdx, 'text', e.target.value)}
                                                                className="flex-1 px-4 py-2 bg-white border border-slate-100 text-sm outline-none focus:border-brand transition-colors"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleSave(q.id)}
                                                        disabled={savingId === q.id}
                                                        className="flex items-center gap-2 px-8 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                                                    >
                                                        {savingId === q.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                        Save Changes
                                                    </button>
                                                </div>
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