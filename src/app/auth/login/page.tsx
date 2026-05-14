"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return;
            supabase.from('profiles').select('role').eq('id', session.user.id).single()
                .then(({ data }) => {
                    router.replace(data?.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard');
                });
        });
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            alert(error.message);
            setLoading(false);
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

        const firstName = profile?.full_name?.split(' ')[0] || '';
        setLoginSuccess(true);

        setTimeout(() => {
            if (profile?.role === 'admin') {
                router.push(`/admin/dashboard?welcome=${firstName}`);
            } else {
                router.push(`/portal/dashboard?welcome=${firstName}`);
            }
        }, 400);
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/oauth/callback`,
            },
        });
        if (error) {
            alert(error.message);
            setGoogleLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 text-sm font-mono outline-none focus:border-brand transition-colors placeholder:text-slate-300";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    return (
        <div className="fixed inset-0 flex items-center justify-center font-mono selection:bg-brand selection:text-white px-4">
            <AnimatePresence mode="wait">
                {!loginSuccess ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-sm"
                    >
                        {/* Logo */}
                        <div className="mb-10 text-center">
                            <Link href="/" className="font-black text-2xl tracking-tight hover:opacity-70 transition-opacity">
                                BB<span className="text-brand">EASY</span>
                            </Link>
                        </div>

                        {/* Header */}
                        <div className="mb-8 border-b border-slate-200 pb-8">
                            <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-2">Portal</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                                Welcome back.
                            </h1>
                        </div>

                        {/* Google OAuth */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading || loading}
                            className="w-full py-3 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] transition-colors disabled:opacity-40 flex items-center justify-center gap-3"
                        >
                            <GoogleIcon />
                            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-slate-200" />
                            <span className="text-[8px] uppercase tracking-[0.3em] text-slate-300">or</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@wu.ac.at"
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className={labelClass} style={{ margin: 0 }}>Password</label>
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300 hover:text-brand transition-colors"
                                    >
                                        Forgot?
                                    </Link>
                                </div>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={inputClass}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || googleLoading}
                                className="w-full py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40 mt-2"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <p className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-6">
                            No account?{' '}
                            <Link href="/auth/register" className="text-brand font-black hover:text-slate-900 transition-colors">
                                Register
                            </Link>
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="bridge"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-slate-50"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Google "G" mark ─────────────────────────────────────────────────────────

function GoogleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
        </svg>
    );
}