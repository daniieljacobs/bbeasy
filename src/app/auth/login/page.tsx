"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const router = useRouter();

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
                                disabled={loading}
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