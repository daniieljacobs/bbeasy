import { MOCK_RESULTS } from "@/lib/mock-data";

export default function AdminDashboard() {
    return (
        <div className="py-8">
            <h2 className="text-3xl font-bold mb-8">Admin Console</h2>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">User</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Test</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Score</th>
                            <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {MOCK_RESULTS.map((res) => (
                            <tr key={res.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 font-medium">{res.userName}</td>
                                <td className="px-6 py-4 text-slate-600">{res.testTitle}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${res.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {res.score}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">{res.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}