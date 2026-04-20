"use client";

import { useEffect, useState, Suspense, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { LogOut, Crown, Timer, ArrowUpRight, ShieldCheck, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── ROLE CONTEXT ────────────────────────────────────────────────────────────
export const RoleContext = createContext<{ effectiveRole: string; isPro: boolean }>({
    effectiveRole: 'free',
    isPro: false,
});

function WelcomeOverlay() {
    const searchParams = useSearchParams();
    const welcomeName = searchParams.get('welcome');
    const isOnboarding = searchParams.get('onboarding');
    const newUserName = searchParams.get('name');

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

function ExamCountdown() {
    const [mounted, setMounted] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        setMounted(true);
        const targetDate = new Date('2026-06-30T03:00:00').getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000)
                });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    const h = timeLeft.hours.toString().padStart(2, '0');
    const m = timeLeft.minutes.toString().padStart(2, '0');
    const s = timeLeft.seconds.toString().padStart(2, '0');

    return (
        <div className="fixed bottom-6 left-6 z-40 pointer-events-none flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-400">
            <Timer size={14} className="opacity-50" />
            <span>{timeLeft.days}D : {h}H : {m}M : {s}S</span>
        </div>
    );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<any>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const [previewRole, setPreviewRole] = useState<string | null>(null);

    async function handleLogout() {
        setIsLoggingOut(true);
        setMobileMenuOpen(false);
        setTimeout(async () => {
            await supabase.auth.signOut();
            router.push('/');
        }, 1200);
    }

    const navLinks = [
        { label: 'dashboard', href: '/portal/dashboard' },
        { label: 'leaderboard', href: '/portal/leaderboard' },
    ];

    const effectiveRole = previewRole ?? profile?.role;
    const isPro = effectiveRole === 'pro' || effectiveRole === 'admin';
    const isAdmin = profile?.role === 'admin';

    return (
        <RoleContext.Provider value={{ effectiveRole, isPro }}>
            <div className="flex flex-col min-h-screen relative overflow-x-hidden">
                <Suspense fallback={null}>
                    <WelcomeOverlay />
                </Suspense>

                {/* Logout overlay */}
                <AnimatePresence>
                    {isLoggingOut && (
                        <motion.div
                            key="logout-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center font-mono"
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
                                    THANK YOU FOR USING BBEASY
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── NAVBAR ── */}
                <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
                    <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

                        <Link href="/portal/dashboard" className="font-black text-lg tracking-tight shrink-0">
                            BB<span className="text-brand">EASY</span>
                        </Link>
                        <motion.span
                            className="px-2 py-0.5 border border-brand/20 bg-brand/5 text-brand text-[8px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5"
                        >
                            <span className="w-1 h-1 bg-brand rounded-full animate-pulse" />
                            Early Access
                        </motion.span>

                        {/* ── DESKTOP NAV ── */}
                        <div className="hidden md:flex items-center gap-1 flex-1">
                            {navLinks.map(link => {
                                const isActive = pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all ${isActive
                                            ? 'text-slate-900 bg-slate-100'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* ── DESKTOP RIGHT ── */}
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                            {isAdmin && (
                                <Link
                                    href="/admin/dashboard"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-brand border border-brand/20 hover:bg-brand hover:text-white hover:border-brand transition-all"
                                >
                                    <ShieldCheck size={11} /> Admin
                                </Link>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        const roles = ['admin', 'pro', 'free'];
                                        const current = previewRole ?? profile?.role;
                                        const next = roles[(roles.indexOf(current) + 1) % roles.length];
                                        setPreviewRole(next === profile?.role ? null : next);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] border transition-all
                                    ${previewRole
                                            ? 'border-amber-300 text-amber-600 bg-amber-50'
                                            : 'border-slate-200 text-slate-400 hover:border-slate-400'
                                        }`}
                                >
                                    {previewRole ? `👁 ${previewRole}` : '👁 view as'}
                                </button>
                            )}
                            {profile && (
                                <Link
                                    href="/portal/profile"
                                    className={`flex items-center gap-2 px-3 py-1.5  border transition ${pathname === '/portal/profile'
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

                        {/* ── MOBILE RIGHT ── */}
                        <div className="flex md:hidden items-center gap-3">
                            {profile && (
                                <div className="w-7 h-7 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[10px] font-black shrink-0">
                                    {profile.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* ── MOBILE DROPDOWN ── */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="md:hidden overflow-hidden border-t border-slate-100 bg-white"
                            >
                                <div className="px-6 py-4 space-y-1 font-mono">

                                    {/* Profile row */}
                                    {profile && (
                                        <Link
                                            href="/portal/profile"
                                            className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-brand-tint text-brand flex items-center justify-center text-[10px] font-black">
                                                {profile.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {profile.username ? `@${profile.username}` : profile.full_name}
                                                </p>
                                                {isPro && (
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand">Pro</span>
                                                )}
                                            </div>
                                        </Link>
                                    )}

                                    <div className="h-px bg-slate-100 my-2" />

                                    {/* Nav links */}
                                    {navLinks.map(link => {
                                        const isActive = pathname.startsWith(link.href);
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={`flex items-center px-3 py-2.5 text-xs font-bold tracking-widest uppercase transition-all ${isActive
                                                    ? 'text-slate-900 bg-slate-100'
                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}

                                    {/* Admin links */}
                                    {isAdmin && (
                                        <>
                                            <div className="h-px bg-slate-100 my-2" />
                                            <Link
                                                href="/admin/dashboard"
                                                className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-brand hover:bg-brand/5 transition-colors"
                                            >
                                                <ShieldCheck size={13} /> Admin Panel
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    const roles = ['admin', 'pro', 'free'];
                                                    const current = previewRole ?? profile?.role;
                                                    const next = roles[(roles.indexOf(current) + 1) % roles.length];
                                                    setPreviewRole(next === profile?.role ? null : next);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors
                                                    ${previewRole ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                👁 {previewRole ? `Viewing as ${previewRole}` : 'View as role'}
                                            </button>
                                        </>
                                    )}

                                    <div className="h-px bg-slate-100 my-2" />

                                    {/* Logout */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-50 transition-colors uppercase tracking-widest"
                                    >
                                        <LogOut size={13} /> Logout
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                <main className="flex-1">
                    {children}
                </main>

                <ExamCountdown />
            </div>
        </RoleContext.Provider>
    );
}