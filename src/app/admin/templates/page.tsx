"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Save, Loader2, ChevronDown, ChevronUp, PlusCircle } from 'lucide-react';

interface SlotCategory {
    id?: string;
    category_id: string;
    subcategory_id: string | null;
    tempId: string;
}

interface Slot {
    id?: string;
    points_override: number | null;
    slot_order: number;
    categories: SlotCategory[];
    tempId: string;
}

interface Template {
    id?: string;
    name: string;
    type: 'mock' | 'subset';
    subject: string;
    time_limit: number;
    slots: Slot[];
}

const emptyTemplate = (): Template => ({
    name: '',
    type: 'mock',
    subject: '',
    time_limit: 180,
    slots: []
});

const emptySlot = (order: number): Slot => ({
    points_override: null,
    slot_order: order,
    categories: [],
    tempId: crypto.randomUUID()
});

const emptySlotCategory = (): SlotCategory => ({
    category_id: '',
    subcategory_id: null,
    tempId: crypto.randomUUID()
});

export default function AdminTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newTemplate, setNewTemplate] = useState<Template>(emptyTemplate());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        const { data: cats } = await supabase.from('categories').select('*').order('name');
        const { data: subs } = await supabase.from('subcategories').select('*').order('name');
        const { data: tmpl } = await supabase
            .from('generated_test_templates')
            .select(`
                id, name, type, subject, time_limit, created_at,
                template_slots (
                    id, points_override, slot_order,
                    template_slot_categories (
                        id, category_id, subcategory_id,
                        categories (name),
                        subcategories (name)
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (cats) setCategories(cats);
        if (subs) setSubcategories(subs);
        if (tmpl) setTemplates(tmpl);
        setLoading(false);
    }

    // ── New template helpers ──────────────────────────────────────────────────

    function addSlot() {
        setNewTemplate(prev => ({
            ...prev,
            slots: [...prev.slots, emptySlot(prev.slots.length + 1)]
        }));
    }

    function removeSlot(tempId: string) {
        setNewTemplate(prev => ({
            ...prev,
            slots: prev.slots.filter(s => s.tempId !== tempId)
                .map((s, i) => ({ ...s, slot_order: i + 1 }))
        }));
    }

    function updateSlot(tempId: string, field: keyof Slot, value: any) {
        setNewTemplate(prev => ({
            ...prev,
            slots: prev.slots.map(s => s.tempId === tempId ? { ...s, [field]: value } : s)
        }));
    }

    function addSlotCategory(slotTempId: string) {
        setNewTemplate(prev => ({
            ...prev,
            slots: prev.slots.map(s => s.tempId === slotTempId
                ? { ...s, categories: [...s.categories, emptySlotCategory()] }
                : s
            )
        }));
    }

    function removeSlotCategory(slotTempId: string, catTempId: string) {
        setNewTemplate(prev => ({
            ...prev,
            slots: prev.slots.map(s => s.tempId === slotTempId
                ? { ...s, categories: s.categories.filter(c => c.tempId !== catTempId) }
                : s
            )
        }));
    }

    function updateSlotCategory(slotTempId: string, catTempId: string, field: keyof SlotCategory, value: any) {
        setNewTemplate(prev => ({
            ...prev,
            slots: prev.slots.map(s => s.tempId === slotTempId
                ? {
                    ...s, categories: s.categories.map(c => c.tempId === catTempId
                        ? { ...c, [field]: value, ...(field === 'category_id' ? { subcategory_id: null } : {}) }
                        : c
                    )
                }
                : s
            )
        }));
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    async function handleSave() {
        if (!newTemplate.name) return alert('Template name is required.');
        if (newTemplate.slots.length === 0) return alert('Add at least one question slot.');
        setIsSaving(true);

        try {
            const { data: tmplData, error: tmplErr } = await supabase
                .from('generated_test_templates')
                .insert({
                    name: newTemplate.name,
                    type: newTemplate.type,
                    subject: newTemplate.subject || null,
                    time_limit: newTemplate.time_limit
                })
                .select().single();

            if (tmplErr || !tmplData) { alert('Error: ' + tmplErr?.message); return; }

            for (const slot of newTemplate.slots) {
                const { data: slotData, error: slotErr } = await supabase
                    .from('template_slots')
                    .insert({
                        template_id: tmplData.id,
                        points_override: slot.points_override,
                        slot_order: slot.slot_order
                    })
                    .select().single();

                if (slotErr || !slotData) continue;

                if (slot.categories.length > 0) {
                    await supabase.from('template_slot_categories').insert(
                        slot.categories
                            .filter(c => c.category_id)
                            .map(c => ({
                                slot_id: slotData.id,
                                category_id: c.category_id,
                                subcategory_id: c.subcategory_id || null
                            }))
                    );
                }
            }

            await fetchAll();
            setNewTemplate(emptyTemplate());
            setShowNewForm(false);
        } catch (err) {
            alert('Unexpected error.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id: string) {
        const confirmed = confirm('Delete this template? This cannot be undone.');
        if (!confirmed) return;
        await supabase.from('generated_test_templates').delete().eq('id', id);
        setTemplates(templates.filter(t => t.id !== id));
    }

    // ── Total points calculation ──────────────────────────────────────────────

    function calcTotalPoints(slots: Slot[]) {
        return slots.reduce((sum, s) => sum + (s.points_override ?? 0), 0);
    }

    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";
    const selectClass = "w-full px-3 py-2 bg-white border border-slate-200 text-[9px] font-black uppercase tracking-[0.1em] outline-none focus:border-brand transition-colors text-slate-600";

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
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Templates.</h1>
                    <p className="text-slate-400 text-sm mt-2">Configure randomised test generation.</p>
                </div>
                <button
                    onClick={() => { setShowNewForm(!showNewForm); setNewTemplate(emptyTemplate()); }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] border transition-colors
                        ${showNewForm
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-brand text-white border-brand hover:bg-slate-900 hover:border-slate-900'
                        }`}
                >
                    {showNewForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> New Template</>}
                </button>
            </motion.div>

            {/* ── NEW TEMPLATE FORM ── */}
            <AnimatePresence>
                {showNewForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="mb-10 bg-white border-l-2 border-l-brand border border-slate-100"
                    >
                        {/* Template metadata */}
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30">
                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="col-span-2">
                                    <label className={labelClass}>Template Name</label>
                                    <input
                                        value={newTemplate.name}
                                        onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Full BBE Mock"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 text-sm font-black outline-none focus:border-brand transition-colors placeholder:text-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Type</label>
                                    <select
                                        value={newTemplate.type}
                                        onChange={e => setNewTemplate(p => ({ ...p, type: e.target.value as 'mock' | 'subset' }))}
                                        className={selectClass}
                                    >
                                        <option value="mock">Full Mock</option>
                                        <option value="subset">Topic Practice</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Time Limit (min)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={newTemplate.time_limit}
                                        onChange={e => setNewTemplate(p => ({ ...p, time_limit: parseInt(e.target.value) || 180 }))}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 text-[9px] font-black text-center outline-none focus:border-brand transition-colors"
                                    />
                                </div>
                            </div>
                            {newTemplate.type === 'subset' && (
                                <div className="w-48">
                                    <label className={labelClass}>Subject</label>
                                    <select
                                        value={newTemplate.subject}
                                        onChange={e => setNewTemplate(p => ({ ...p, subject: e.target.value }))}
                                        className={selectClass}
                                    >
                                        <option value="">Select subject...</option>
                                        <option value="math">Math</option>
                                        <option value="english">English</option>
                                        <option value="economics">Economics</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Slots */}
                        <div className="px-6 py-5 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className={labelClass}>Question Slots — {newTemplate.slots.length} questions</p>
                                <div className="flex items-center gap-4">
                                    {newTemplate.slots.length > 0 && (
                                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">
                                            Total: <span className="font-black text-slate-700">
                                                {calcTotalPoints(newTemplate.slots)} pts
                                            </span>
                                        </p>
                                    )}
                                    <button
                                        onClick={addSlot}
                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-brand hover:text-slate-900 transition-colors"
                                    >
                                        <PlusCircle size={12} /> Add Slot
                                    </button>
                                </div>
                            </div>

                            {newTemplate.slots.length === 0 && (
                                <div className="py-8 text-center border border-dashed border-slate-200">
                                    <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300">No slots yet — add a question slot above</p>
                                </div>
                            )}

                            {newTemplate.slots.map((slot, idx) => (
                                <div key={slot.tempId} className="border border-slate-100 bg-white">
                                    {/* Slot header */}
                                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                                            Slot {idx + 1}
                                        </span>

                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">pts override</span>
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder="auto"
                                                value={slot.points_override ?? ''}
                                                onChange={e => updateSlot(slot.tempId, 'points_override', e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-16 px-2 py-1 bg-white border border-slate-200 text-[9px] font-black text-center outline-none focus:border-brand transition-colors"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => addSlotCategory(slot.tempId)}
                                                className="text-[9px] font-black uppercase tracking-[0.15em] text-brand hover:text-slate-900 transition-colors flex items-center gap-1"
                                            >
                                                <PlusCircle size={11} /> Category
                                            </button>
                                            <button
                                                onClick={() => removeSlot(slot.tempId)}
                                                className="text-slate-300 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slot categories */}
                                    <div className="px-4 py-3 space-y-2">
                                        {slot.categories.length === 0 && (
                                            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300">
                                                No categories — will pick from entire bank
                                            </p>
                                        )}
                                        {slot.categories.map((cat, ci) => (
                                            <div key={cat.tempId} className="flex items-center gap-2">
                                                <span className="text-[8px] text-slate-300 w-4 shrink-0">{ci + 1}.</span>
                                                <select
                                                    value={cat.category_id}
                                                    onChange={e => updateSlotCategory(slot.tempId, cat.tempId, 'category_id', e.target.value)}
                                                    className="flex-1 px-2 py-1.5 bg-white border border-slate-200 text-[9px] font-black outline-none focus:border-brand transition-colors text-slate-600"
                                                >
                                                    <option value="">Any category...</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                                <select
                                                    value={cat.subcategory_id ?? ''}
                                                    disabled={!cat.category_id}
                                                    onChange={e => updateSlotCategory(slot.tempId, cat.tempId, 'subcategory_id', e.target.value || null)}
                                                    className="flex-1 px-2 py-1.5 bg-white border border-slate-200 text-[9px] font-black outline-none focus:border-brand transition-colors disabled:opacity-30 text-slate-600"
                                                >
                                                    <option value="">Any subcategory</option>
                                                    {subcategories
                                                        .filter(s => s.category_id === cat.category_id)
                                                        .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <button
                                                    onClick={() => removeSlotCategory(slot.tempId, cat.tempId)}
                                                    className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-8 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                                >
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TEMPLATE LIST ── */}
            <div className="bg-white border border-slate-100">
                {templates.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300 mb-2">No templates yet</p>
                        <p className="text-slate-400 text-sm">Create your first template to enable randomised tests.</p>
                    </div>
                ) : templates.map((t, i) => {
                    const isExpanded = expandedId === t.id;
                    const slots = t.template_slots?.sort((a: any, b: any) => a.slot_order - b.slot_order) || [];
                    const totalPts = slots.reduce((sum: number, s: any) => sum + (s.points_override ?? 0), 0);

                    return (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-slate-50 last:border-b-0"
                        >
                            {/* Row */}
                            <div className="px-6 py-4 flex items-center gap-4 group hover:bg-slate-50/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900">{t.name}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[8px] uppercase tracking-[0.2em] text-slate-400">
                                            {t.type} · {slots.length} questions · {t.time_limit} min
                                        </span>
                                        {totalPts > 0 && (
                                            <span className="text-[8px] uppercase tracking-[0.2em] text-brand font-black">
                                                {totalPts} pts total
                                            </span>
                                        )}
                                        {t.subject && (
                                            <span className="text-[8px] uppercase tracking-[0.2em] text-slate-300">
                                                {t.subject}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                                        className="p-2 text-slate-400 hover:text-brand transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded slots */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden border-t border-slate-50"
                                    >
                                        <div className="px-6 py-5 bg-slate-50/30 space-y-2">
                                            {slots.map((slot: any) => (
                                                <div key={slot.id} className="flex items-start gap-4 py-2 border-b border-slate-100 last:border-0">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 w-12 shrink-0 pt-0.5">
                                                        Slot {slot.slot_order}
                                                    </span>
                                                    <div className="flex-1 flex flex-wrap gap-2">
                                                        {slot.template_slot_categories?.length === 0 && (
                                                            <span className="text-[9px] text-slate-300 uppercase tracking-widest">Any question</span>
                                                        )}
                                                        {slot.template_slot_categories?.map((c: any) => (
                                                            <span key={c.id} className="text-[9px] font-black uppercase tracking-[0.1em] text-brand bg-brand/5 px-2 py-1">
                                                                {c.categories?.name}
                                                                {c.subcategories?.name && ` / ${c.subcategories.name}`}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-500 shrink-0">
                                                        {slot.points_override != null ? `${slot.points_override} pts` : 'auto pts'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}