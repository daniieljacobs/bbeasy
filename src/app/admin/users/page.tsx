import { supabase } from '@/lib/supabase';
import { Ban, ShieldCheck, Eye } from 'lucide-react';

export default async function AdminUsersPage() {
    const { data: profiles } = await supabase.from('profiles').select('*');

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-black">User Management</h1>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-50">
                    {profiles?.map((user) => (
                        <div key={user.id} className="px-8 py-6 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                                    {user.full_name?.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold">{user.full_name}</h4>
                                    <p className="text-xs text-slate-400">Joined {new Date(user.updated_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-400 uppercase">Target Score</p>
                                    <p className="font-bold">{user.target_score}%</p>
                                </div>
                                <div className="flex gap-2">
                                    <button title="View History" className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition"><Eye size={18} /></button>
                                    <button title="Ban User" className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Ban size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}