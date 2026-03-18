"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('full_name, username, role')
                .eq('id', user.id)
                .single();
            if (data) setProfile(data);
        }
        fetchProfile();
    }, []);

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/auth/login');
    }

    const navLinks = [
        { label: 'dashboard', href: '/portal/dashboard' },
        { label: 'tests', href: '/portal/tests' },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Top Bar */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

                    {/* Logo */}
                    <Link href="/portal/dashboard" className="font-black text-lg tracking-tight shrink-0">
                        BB<span className="text-blue-600">EASY</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1 flex-1">
                        {navLinks.map(link => {
                            const isActive = pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${isActive
                                            ? 'text-slate-900 bg-slate-100'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 shrink-0">
                        {profile && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-[9px] font-black">
                                    {profile.full_name?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs font-bold text-slate-600">
                                    {profile.username ? `@${profile.username}` : profile.full_name}
                                </span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
                        >
                            <LogOut size={13} /> logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}