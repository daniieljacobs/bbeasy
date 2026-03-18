import Link from 'next/link';
import { Database, Users, LayoutDashboard, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col gap-8">
                <div className="font-black text-xl tracking-tighter uppercase px-2">
                    BBE <span className="text-blue-600">Admin</span>
                </div>
                <nav className="flex flex-col gap-2">
                    {[
                        { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
                        { name: 'Tests/Content', href: '/admin/tests', icon: <Database size={18} /> },
                        { name: 'User Management', href: '/admin/users', icon: <Users size={18} /> },
                    ].map((item) => (
                        <Link key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition">
                            {item.icon} {item.name}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}