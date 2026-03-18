"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, ChevronDown, ChevronUp, Shield, User, Crown } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [testHistory, setTestHistory] = useState<Record<string, any[]>>({});
    const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                username,
                email,
                role,
                total_points,
                updated_at
            `)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error.message);
            return;
        }

        if (data) setUsers(data);
        setLoading(false);
    }

    async function fetchTestHistory(userId: string) {
        if (testHistory[userId]) return;
        setLoadingHistory(userId);

        const { data } = await supabase
            .from('test_results')
            .select(`
                id,
                score,
                points_awarded,
                completed_at,
                tests (title, type)
            `)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });

        if (data) setTestHistory(prev => ({ ...prev, [userId]: data }));
        setLoadingHistory(null);
    }

    async function handleRoleChange(userId: string, newRole: string) {
        await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

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
        if (expandedId === userId) {
            setExpandedId(null);
        } else {
            setExpandedId(userId);
            fetchTestHistory(userId);
        }
    }

    const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
        free: { label: 'Free', color: 'bg-slate-100 text-slate-600', icon: User },
        pro: { label: 'Pro', color: 'bg-amber-100 text-amber-700', icon: Crown },
        admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: Shield },
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

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
            <div>
                <h1 className="text-3xl font-black">User Management</h1>
                <p className="text-slate-500">{users.length} registered users</p>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, username or email..."
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 font-bold text-xs"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* User List */}
            <div className="space-y-4">
                {filteredUsers.length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold italic">
                            {search ? 'No users match your search.' : 'No users yet.'}
                        </p>
                    </div>
                )}

                {filteredUsers.map((user) => {
                    const isExpanded = expandedId === user.id;
                    const role = roleConfig[user.role] || roleConfig.free;
                    const RoleIcon = role.icon;
                    const history = testHistory[user.id] || [];

                    return (
                        <div key={user.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

                            {/* User Row */}
                            <div className="px-8 py-6 flex items-center gap-6">

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center font-black text-sm shrink-0">
                                    {user.full_name?.charAt(0) || '?'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900">{user.full_name || 'Unknown'}</p>
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        {user.username && (
                                            <span className="text-xs text-slate-400 font-medium">@{user.username}</span>
                                        )}
                                        {user.email && (
                                            <span className="text-xs text-slate-400">{user.email}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Points */}
                                <div className="text-right shrink-0 hidden md:block">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Points</p>
                                    <p className="font-black text-slate-900">{user.total_points || 0}</p>
                                </div>

                                {/* Role Selector */}
                                <div className="shrink-0">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${role.color}`}>
                                        <RoleIcon size={12} />
                                        <select
                                            value={user.role || 'free'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="bg-transparent outline-none cursor-pointer font-black uppercase text-[10px]"
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => toggleExpand(user.id)}
                                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition"
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id, user.full_name || 'this user')}
                                        className="p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Test History */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 px-8 py-6 bg-slate-50/50 space-y-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Test History</p>

                                    {loadingHistory === user.id && (
                                        <p className="text-sm text-slate-400 font-medium">Loading...</p>
                                    )}

                                    {!loadingHistory && history.length === 0 && (
                                        <p className="text-sm text-slate-400 font-medium italic">No tests taken yet.</p>
                                    )}

                                    {history.length > 0 && (
                                        <div className="space-y-2">
                                            {history.map((result: any) => (
                                                <div key={result.id} className="flex items-center justify-between px-5 py-4 bg-white rounded-2xl border border-slate-100">
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-900">{result.tests?.title || 'Unknown Test'}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {result.tests?.type} · {new Date(result.completed_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-right">
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Score</p>
                                                            <p className={`font-black ${result.score >= 70 ? 'text-green-600' : 'text-red-400'}`}>
                                                                {result.score}%
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Points</p>
                                                            <p className="font-black text-slate-900">+{result.points_awarded || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}