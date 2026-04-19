"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, CheckCircle2, XCircle, ChevronDown, ChevronUp, Save, Loader2, PlusCircle, Plus, X, Sparkles, Settings2, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
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

interface ImportedQuestion {
    questionText: string;
    contextText?: string;
    contextImageUrl?: string;
    points?: number;
    categoryName?: string;
    subcategoryName?: string;
    statements: { text: string; isCorrect: boolean }[];
}

interface ImportPreview {
    questions: ImportedQuestion[];
    errors: string[];
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

const JSON_SCHEMA_HINT = `Expected format (single or array):
{
  "questionText": "...",
  "contextText": "...",        // optional
  "categoryName": "Math",      // optional
  "subcategoryName": "Algebra",// optional
  "points": 4,                 // optional, defaults to n-1
  "statements": [
    { "text": "...", "isCorrect": true },
    { "text": "...", "isCorrect": false }
  ]
}`;

function parseImportJson(raw: string): ImportPreview {
    const errors: string[] = [];
    let parsed: any;

    try {
        parsed = JSON.parse(raw);
    } catch (e: any) {
        return { questions: [], errors: [`Invalid JSON: ${e.message}`] };
    }

    const items: any[] = Array.isArray(parsed) ? parsed : [parsed];
    const questions: ImportedQuestion[] = [];

    items.forEach((item, idx) => {
        const label = `Question ${idx + 1}`;
        if (typeof item !== 'object' || item === null) {
            errors.push(`${label}: not an object`);
            return;
        }
        if (!item.questionText || typeof item.questionText !== 'string') {
            errors.push(`${label}: missing or invalid "questionText"`);
            return;
        }
        if (!Array.isArray(item.statements) || item.statements.length === 0) {
            errors.push(`${label}: "statements" must be a non-empty array`);
            return;
        }
        const stmtErrors: string[] = [];
        const statements = item.statements.map((s: any, si: number) => {
            if (!s.text || typeof s.text !== 'string') stmtErrors.push(`statement ${si + 1} missing "text"`);
            if (typeof s.isCorrect !== 'boolean') stmtErrors.push(`statement ${si + 1} "isCorrect" must be boolean`);
            return { text: s.text || '', isCorrect: !!s.isCorrect };
        });
        if (stmtErrors.length) {
            errors.push(`${label}: ${stmtErrors.join(', ')}`);
            return;
        }
        questions.push({
            questionText: item.questionText,
            contextText: item.contextText || '',
            contextImageUrl: item.contextImageUrl || '',
            points: typeof item.points === 'number' ? item.points : statements.length - 1,
            categoryName: item.categoryName || '',
            subcategoryName: item.subcategoryName || '',
            statements,
        });
    });

    return { questions, errors };
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

    // JSON import state
    const [showImport, setShowImport] = useState(false);
    const [importRaw, setImportRaw] = useState('');
    const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState<number | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

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

    // ── JSON IMPORT HANDLERS ──

    function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setImportRaw(text);
            setImportPreview(parseImportJson(text));
            setImportSuccess(null);
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function handleImportTextChange(val: string) {
        setImportRaw(val);
        setImportSuccess(null);
        if (val.trim()) {
            setImportPreview(parseImportJson(val));
        } else {
            setImportPreview(null);
        }
    }

    async function handleImportSave() {
        if (!importPreview || importPreview.questions.length === 0) return;
        setIsImporting(true);

        let savedCount = 0;
        const localCats = [...categories];
        const localSubs = [...allSubcategories];

        for (const iq of importPreview.questions) {
            let categoryId: string | null = null;
            if (iq.categoryName) {
                let cat = localCats.find(c => c.name.toLowerCase() === iq.categoryName!.toLowerCase());
                if (!cat) {
                    const { data } = await supabase.from('categories').insert({ name: iq.categoryName }).select().single();
                    if (data) { localCats.push(data); cat = data; }
                }
                categoryId = cat?.id || null;
            }

            let subcategoryId: string | null = null;
            if (iq.subcategoryName && categoryId) {
                let sub = localSubs.find(s => s.name.toLowerCase() === iq.subcategoryName!.toLowerCase() && s.category_id === categoryId);
                if (!sub) {
                    const { data } = await supabase.from('subcategories').insert({ category_id: categoryId, name: iq.subcategoryName }).select().single();
                    if (data) { localSubs.push(data); sub = data; }
                }
                subcategoryId = sub?.id || null;
            }

            const { data: qData, error: qErr } = await supabase
                .from('questions')
                .insert({
                    category_id: categoryId,
                    subcategory_id: subcategoryId,
                    question_text: iq.questionText,
                    points: iq.points,
                    context_text: iq.contextText || null,
                    context_image_url: iq.contextImageUrl || null,
                })
                .select().single();

            if (qErr || !qData) continue;

            await supabase.from('question_items').insert(
                iq.statements.map(s => ({ question_id: qData.id, item_text: s.text, is_correct: s.isCorrect }))
            );
            savedCount++;
        }

        setCategories(localCats);
        setAllSubcategories(localSubs);
        await fetchAll();
        setIsImporting(false);
        setImportSuccess(savedCount);
        setImportRaw('');
        setImportPreview(null);
    }

    function closeImport() {
        setShowImport(false);
        setImportRaw('');
        setImportPreview(null);
        setImportSuccess(null);
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowImport(!showImport); if (showImport) closeImport(); }}
                        className={`flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] border transition-colors
                            ${showImport
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand hover:text-brand'
                            }`}
                    >
                        <FileJson size={12} /> Import JSON
                    </button>
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
                </div>
            </motion.div>

            {/* ── JSON IMPORT PANEL ── */}
            <AnimatePresence>
                {showImport && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="mb-8 bg-white border-l-2 border-l-emerald-400 border border-slate-100"
                    >
                        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileJson size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Import from JSON</span>
                                <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">Single question or bulk array</span>
                            </div>
                            <button
                                onClick={() => importFileRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                            >
                                <Upload size={11} /> Upload .json file
                            </button>
                            <input
                                ref={importFileRef}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={handleImportFileChange}
                            />
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={labelClass}>Paste JSON</label>
                                    <textarea
                                        value={importRaw}
                                        onChange={(e) => handleImportTextChange(e.target.value)}
                                        placeholder={`[\n  { "questionText": "...", "statements": [...] },\n  ...\n]`}
                                        rows={10}
                                        className="w-full text-xs text-slate-700 p-3 bg-slate-50 border border-slate-100 outline-none focus:border-emerald-400 transition-colors resize-none font-mono placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Schema Reference</label>
                                    <pre className="text-[10px] leading-relaxed text-slate-400 bg-slate-50 border border-slate-100 p-3 overflow-auto h-full whitespace-pre-wrap">
                                        {JSON_SCHEMA_HINT}
                                    </pre>
                                </div>
                            </div>

                            <AnimatePresence>
                                {importPreview && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        {importPreview.errors.length > 0 && (
                                            <div className="mb-3 p-3 bg-red-50 border border-red-100 space-y-1">
                                                {importPreview.errors.map((err, i) => (
                                                    <div key={i} className="flex items-start gap-2">
                                                        <AlertCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
                                                        <span className="text-[10px] text-red-500">{err}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {importPreview.questions.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                        Preview — {importPreview.questions.length} question{importPreview.questions.length !== 1 ? 's' : ''} ready
                                                    </span>
                                                </div>
                                                <div className="border border-slate-100 divide-y divide-slate-50 max-h-64 overflow-y-auto">
                                                    {importPreview.questions.map((iq, i) => (
                                                        <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50">
                                                            <span className="text-[8px] font-black text-slate-300 pt-0.5 w-5 shrink-0">
                                                                {String(i + 1).padStart(2, '0')}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-slate-800 truncate">{iq.questionText}</p>
                                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                    {iq.categoryName && (
                                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">{iq.categoryName}</span>
                                                                    )}
                                                                    {iq.subcategoryName && (
                                                                        <span className="text-[8px] uppercase tracking-[0.2em] text-slate-400">{iq.subcategoryName}</span>
                                                                    )}
                                                                    <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                                                                        {iq.statements.length} statements · {iq.points} pts
                                                                    </span>
                                                                    <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                                                                        {iq.statements.filter(s => s.isCorrect).length}✓ {iq.statements.filter(s => !s.isCorrect).length}✗
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {importSuccess !== null && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100"
                                    >
                                        <CheckCircle size={12} className="text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">
                                            {importSuccess} question{importSuccess !== 1 ? 's' : ''} imported successfully
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center justify-between pt-1">
                                <button
                                    onClick={closeImport}
                                    className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleImportSave}
                                    disabled={isImporting || !importPreview || importPreview.questions.length === 0}
                                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-colors disabled:opacity-30"
                                >
                                    {isImporting
                                        ? <><Loader2 size={12} className="animate-spin" /> Importing...</>
                                        : <><Save size={12} /> Import {importPreview && importPreview.questions.length > 0 ? `${importPreview.questions.length} Question${importPreview.questions.length !== 1 ? 's' : ''}` : 'Questions'}</>
                                    }
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

                                                {/* Question text + preview */}
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={edit.questionText}
                                                        onChange={(e) => updateEdit(q.id, 'questionText', e.target.value)}
                                                        rows={2}
                                                        className="w-full text-sm font-bold text-slate-900 p-4 bg-white border border-slate-100 outline-none focus:border-brand transition-colors resize-none"
                                                    />
                                                    {edit.questionText && (
                                                        <div className="px-4 py-2 bg-white border border-slate-100 text-sm font-bold text-slate-700">
                                                            <MathText text={edit.questionText} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Context + preview */}
                                                <div className="border border-dashed border-slate-200 p-4 space-y-3">
                                                    <p className={labelClass}>Context (optional)</p>
                                                    <textarea
                                                        value={edit.contextText || ''}
                                                        onChange={(e) => updateEdit(q.id, 'contextText', e.target.value)}
                                                        placeholder="Text context (supports $LaTeX$)..."
                                                        rows={2}
                                                        className="w-full text-xs text-slate-700 p-3 bg-white border border-slate-100 outline-none focus:border-brand transition-colors resize-none placeholder:text-slate-300"
                                                    />
                                                    {edit.contextText && (
                                                        <div className="px-3 py-2 bg-white border border-slate-100 text-xs text-slate-600">
                                                            <MathText text={edit.contextText} />
                                                        </div>
                                                    )}
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

                                                {/* Statements + per-statement preview */}
                                                <div className="space-y-2">
                                                    {edit.statements.map((s: any, sIdx: number) => (
                                                        <div key={s.id} className="flex gap-3 items-start">
                                                            <button
                                                                onClick={() => updateStatement(q.id, sIdx, 'isCorrect', !s.isCorrect)}
                                                                className={`w-8 h-8 flex items-center justify-center transition-colors shrink-0 mt-0.5
                                                                    ${s.isCorrect ? 'text-emerald-500 bg-emerald-50' : 'text-red-400 bg-red-50'}`}
                                                            >
                                                                {s.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                            </button>
                                                            <div className="flex-1 space-y-1">
                                                                <input
                                                                    value={s.text}
                                                                    onChange={(e) => updateStatement(q.id, sIdx, 'text', e.target.value)}
                                                                    className="w-full px-4 py-2 bg-white border border-slate-100 text-sm outline-none focus:border-brand transition-colors"
                                                                />
                                                                {s.text && (
                                                                    <div className="px-4 py-1 text-xs text-slate-500">
                                                                        <MathText text={s.text} />
                                                                    </div>
                                                                )}
                                                            </div>
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