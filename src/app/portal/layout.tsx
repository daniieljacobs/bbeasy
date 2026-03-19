"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LogOut, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. The Welcome / Onboarding Overlay ---
function WelcomeOverlay() {
    const searchParams = useSearchParams();
    const welcomeName = searchParams.get('welcome');
    const isOnboarding = searchParams.get('onboarding');
    const newUserName = searchParams.get('name');

    // Show overlay if EITHER welcome OR onboarding is in the URL
    const [showOverlay, setShowOverlay] = useState(!!welcomeName || !!isOnboarding);

    const loginMessages = [
        "INITIALIZING WORKSPACE",
        "PREPARING ASSESSMENT ENVIRONMENT",
        "COMPILING STUDY ANALYTICS",
        "ASSEMBLING COURSE MATERIALS"
    ];
    const [message] = useState(() => loginMessages[Math.floor(Math.random() * loginMessages.length)]);

    useEffect(() => {
        if (welcomeName || isOnboarding) {
            const timer = setTimeout(() => {
                setShowOverlay(false);
                window.history.replaceState(null, '', '/portal/dashboard');
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [welcomeName, isOnboarding]);

    return (
        <AnimatePresence>
            {showOverlay && (
                <motion.div
                    key="portal-welcome"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center font-mono selection:bg-brand selection:text-white"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="text-center"
                    >
                        {isOnboarding ? (
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                                Let's get started{newUserName ? `, ${newUserName}` : ''}
                            </h1>
                        ) : (
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                                Welcome back{welcomeName && welcomeName !== 'true' ? `, ${welcomeName}` : ''}
                            </h1>
                        )}

                        <p className="text-[10px] text-brand mt-6 uppercase tracking-[0.4em] font-bold">
                            {isOnboarding ? 'GENERATING DIAGNOSTIC EXAM' : message}
                        </p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.7 }}
                            className="mt-8 flex gap-2 justify-center"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// --- 2. The Main Layout ---
export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<any>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false); // Added logout state
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }
            const { data } = await supabase
                .from('profiles')
                .select('full_name, username, role')
                .eq('id', user.id)
                .single();
            if (data) setProfile(data);
        }
        fetchProfile();
    }, [router]);

    // Added animation logic to logout
    async function handleLogout() {
        setIsLoggingOut(true);
        setTimeout(async () => {
            await supabase.auth.signOut();
            router.push('/auth/login');
        }, 1200);
    }

    const navLinks = [
        { label: 'dashboard', href: '/portal/dashboard' },
        { label: 'leaderboard', href: '/portal/leaderboard' },
    ];

    const isPro = profile?.role === 'pro' || profile?.role === 'admin';

    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Suspense wrapper required by Next.js for useSearchParams */}
            <Suspense fallback={null}>
                <WelcomeOverlay />
            </Suspense>

            {/* Logout Bridge Overlay */}
            <AnimatePresence>
                {isLoggingOut && (
                    <motion.div
                        key="logout-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center font-mono selection:bg-brand selection:text-white"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                                See you next time.
                            </h1>
                            <p className="text-[10px] text-brand mt-6 uppercase tracking-[0.4em] font-bold">
                                SECURELY LOGGING OUT
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

                    <Link href="/portal/dashboard" className="font-black text-lg tracking-tight shrink-0">
                        BB<span className="text-brand">EASY</span>
                    </Link>

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

                    <div className="flex items-center gap-3 shrink-0">

                        {profile && (
                            <Link
                                href="/portal/profile"
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition ${pathname === '/portal/profile'
                                    ? 'bg-slate-100 border-slate-200'
                                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                    }`}
                            >
                                <div className="w-5 h-5 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[9px] font-black">
                                    {profile.full_name?.charAt(0) || '?'}
                                </div>
                                <span className="text-xs font-bold text-slate-600">
                                    {profile.username ? `@${profile.username}` : profile.full_name}
                                </span>
                                {isPro && (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand bg-brand-tint px-1.5 py-0.5 rounded-full">
                                        pro
                                    </span>
                                )}
                            </Link>
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

            <main className="flex-1">
                {children}
            </main>

            {!isPro && (
                <Link
                    href="/portal/membership"
                    className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 px-5 py-4 rounded-2xl transition-all hover:scale-105 hover:shadow-2xl"
                    style={{
                        background: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(46,74,122,0.15)',
                        boxShadow: '0 4px 24px rgba(46,74,122,0.1)',
                    }}
                >
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand">
                        <Crown size={12} /> unlock insights
                    </span>
                    <ul className="flex flex-col gap-1">
                        {['unlimited exams', 'know your weak spots', 'see your percentile'].map(f => (
                            <li key={f} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 normal-case tracking-normal">
                                <span className="w-1 h-1 rounded-full bg-brand opacity-40 shrink-0 inline-block" />
                                {f}
                            </li>
                        ))}
                    </ul>
                </Link>
            )}
        </div>
    );
}