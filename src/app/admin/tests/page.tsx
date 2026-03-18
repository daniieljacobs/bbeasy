import { supabase } from '@/lib/supabase';
import { Edit3, Trash2, Plus, PlayCircle } from 'lucide-react';

export default async function AdminTestsPage() {
    // Fetch tests and their associated results count/average
    const { data: tests } = await supabase
        .from('tests')
        .select(`
      *,
      test_results (score)
    `);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black">Content Management</h1>
                    <p className="text-slate-500">Monitor and edit exam simulations.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100">
                    <Plus size={18} /> Create New Test
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-50">
                        <tr className="text-xs font-black uppercase text-slate-400 tracking-widest">
                            <th className="px-8 py-5">Test Title</th>
                            <th className="px-8 py-5">Attempts</th>
                            <th className="px-8 py-5">Avg. Score</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {tests?.map((test) => {
                            const attempts = test.test_results?.length || 0;
                            const avg = attempts > 0
                                ? (test.test_results.reduce((a, b) => a + b.score, 0) / attempts).toFixed(1)
                                : 'N/A';

                            return (
                                <tr key={test.id} className="group hover:bg-slate-50/50 transition">
                                    <td className="px-8 py-5">
                                        <p className="font-bold">{test.title}</p>
                                        <p className="text-xs text-slate-400">{test.category}</p>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium">{attempts}</td>
                                    <td className="px-8 py-5">
                                        <span className={`font-bold ${Number(avg) < 50 ? 'text-orange-500' : 'text-slate-900'}`}>{avg}%</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-full">Active</span>
                                    </td>
                                    <td className="px-8 py-5 text-right space-x-2">
                                        <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition"><Edit3 size={18} /></button>
                                        <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}