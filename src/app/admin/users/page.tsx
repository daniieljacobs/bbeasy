"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, ChevronDown, ChevronUp, Shield, User, Crown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [testHistory, setTestHistory] = useState<Record<string, any[]>>({});
    const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    async function fetchUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, email, role, total_points, updated_at')
            .order('updated_at', { ascending: false });
        if (error) { console.error(error.message); return; }
        if (data) setUsers(data);
        setLoading(false);
    }

    async function fetchTestHistory(userId: string) {
        if (testHistory[userId]) return;
        setLoadingHistory(userId);
        const { data } = await supabase
            .from('test_results')
            .select('id, score, points_awarded, completed_at, tests (title, type)')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });
        if (data) setTestHistory(prev => ({ ...prev, [userId]: data }));
        setLoadingHistory(null);
    }

    async function handleRoleChange(userId: string, newRole: string) {
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }

    async function handleDelete(userId: string, name: string) {
        const confirmed = confirm(`Delete ${name}'s account? This cannot be undone.`);
        if (!confirmed) return;
        await supabase.from('test_results').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
        setUsers(users.filter(u => u.id !== userId));
    }

    function toggleExpand(userId: string) {
        if (expandedId === userId) { setExpandedId(null); return; }
        setExpandedId(userId);
        fetchTestHistory(userId);
    }

    const roleColor: Record<string, string> = {
        free: 'text-slate-500',
        pro: 'text-amber-500',
        admin: 'text-brand',
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

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
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">Users.</h1>
                    <p className="text-slate-400 text-sm mt-2">{users.length} registered accounts</p>
                </div>
            </motion.div>

            {/* ── SEARCH ── */}
            <div className="relative mb-6">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, username or email..."
                    className="w-full pl-8 pr-8 py-3 bg-white border border-slate-200 text-xs font-mono outline-none focus:border-brand transition-colors placeholder:text-slate-300"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* ── USER LIST ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12 }}
                className="bg-white border border-slate-100"
            >
                {filteredUsers.length === 0 ? (
                    <div className="py-24 text-center">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-slate-300">
                            {search ? 'No users match your search' : 'No users yet'}
                        </p>
                    </div>
                ) : (
                    filteredUsers.map((user, i) => {
                        const isExpanded = expandedId === user.id;
                        const history = testHistory[user.id] || [];

                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-b border-slate-50 last:border-b-0"
                            >
                                {/* User row */}
                                <div className="px-6 py-4 flex items-center gap-5 group hover:bg-slate-50/50 transition-colors">

                                    {/* Avatar */}
                                    <div className="w-7 h-7 bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate">{user.full_name || 'Unknown'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {user.username && (
                                                <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400">@{user.username}</span>
                                            )}
                                            {user.email && (
                                                <span className="text-[9px] text-slate-300">{user.email}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="hidden md:block text-right shrink-0">
                                        <p className="text-sm font-black text-slate-900">{user.total_points || 0}</p>
                                        <p className="text-[8px] uppercase tracking-[0.2em] text-slate-300">pts</p>
                                    </div>

                                    {/* Role selector */}
                                    <div className="shrink-0">
                                        <select
                                            value={user.role || 'free'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`bg-transparent outline-none cursor-pointer text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200 px-2 py-1.5 hover:border-slate-400 transition-colors ${roleColor[user.role] ?? 'text-slate-500'}`}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleExpand(user.id)}
                                            className="p-2 text-slate-400 hover:text-brand transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id, user.full_name || 'this user')}
                                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded history */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden border-t border-slate-50"
                                        >
                                            <div className="px-6 py-5 bg-slate-50/30">
                                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">
                                                    Test History
                                                </p>

                                                {loadingHistory === user.id && (
                                                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">Loading...</p>
                                                )}

                                                {!loadingHistory && history.length === 0 && (
                                                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-300">No tests taken yet</p>
                                                )}

                                                {history.length > 0 && (
                                                    <div className="space-y-0 divide-y divide-slate-100">
                                                        {history.map((result: any) => (
                                                            <div key={result.id} className="flex items-center justify-between py-3">
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-900">{result.tests?.title || 'Unknown Test'}</p>
                                                                    <p className="text-[8px] uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                                                                        {result.tests?.type} · {new Date(result.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-6 text-right shrink-0">
                                                                    <div>
                                                                        <p className={`text-sm font-black ${result.score >= 70 ? 'text-emerald-500' : 'text-red-400'}`}>
                                                                            {result.score}%
                                                                        </p>
                                                                        <p className="text-[8px] uppercase tracking-[0.15em] text-slate-300">score</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-slate-600">+{result.points_awarded || 0}</p>
                                                                        <p className="text-[8px] uppercase tracking-[0.15em] text-slate-300">pts</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </div>
    );
}