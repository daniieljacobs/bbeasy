"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database, Users, LayoutDashboard, BookOpen, Layers, ArrowUpRight } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={15} /> },
    { name: 'Tests', href: '/admin/tests', icon: <Database size={15} /> },
    { name: 'Templates', href: '/admin/templates', icon: <Layers size={15} /> },
    { name: 'Question Bank', href: '/admin/questions', icon: <BookOpen size={15} /> },
    { name: 'User Management', href: '/admin/users', icon: <Users size={15} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    // Client-side guard — middleware handles server side, this is a fallback
    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profile?.role !== 'admin') {
                router.push('/portal/dashboard');
                return;
            }
            setChecked(true);
        }
        checkAdmin();
    }, [router]);

    if (!checked) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Verifying access</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen font-mono">

            {/* ── TOP NAVBAR ── */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

                    {/* Logo + badge */}
                    <span className="font-black text-lg tracking-tight shrink-0">
                        BB<span className="text-brand">EASY</span>
                        <span className="ml-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Admin</span>
                    </span>

                    {/* Nav links */}
                    <div className="flex items-center gap-1 flex-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all
                                        ${isActive
                                            ? 'text-slate-900 bg-slate-100'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {item.icon} {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Back to portal */}
                    <Link
                        href="/portal/dashboard"
                        className="group flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand transition-colors shrink-0"
                    >
                        Portal
                        <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>
            </nav>

            {/* ── CONTENT ── */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}