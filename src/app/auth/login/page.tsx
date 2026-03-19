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

    // Animation states
    const [loginSuccess, setLoginSuccess] = useState(false);
    // We no longer need the userName state for the UI here, as it's passed to the URL!

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(error.message);
            setLoading(false);
            return;
        }

        // Fetch role and full_name for the routing handoff
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .single();

        // Extract first name
        const firstName = profile?.full_name?.split(' ')[0] || '';

        // 1. Trigger the fast fade to solid color
        setLoginSuccess(true);

        // 2. Fire the router almost immediately (400ms) with the welcome parameter
        setTimeout(() => {
            if (profile?.role === 'admin') {
                router.push(`/admin/dashboard?welcome=${firstName}`);
            } else {
                router.push(`/portal/dashboard?welcome=${firstName}`);
            }
        }, 400);
    };

    return (
        <div className="fixed inset-0 z-40 bg-none flex items-center justify-center font-mono selection:bg-brand selection:text-white">
            <AnimatePresence mode="wait">
                {!loginSuccess ? (
                    <motion.form
                        key="login-form"
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        onSubmit={handleLogin}
                        className="w-full max-w-md p-10 bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-xl shadow-black/5 border border-slate-100 space-y-6"
                    >
                        <div className="text-center mb-8">
                            <h1 className="font-black text-2xl tracking-tight mb-6">
                                BB<span className="text-brand">EASY</span>
                            </h1>
                            <h2 className="text-3xl font-black text-slate-900">welcome back</h2>
                            <p className="text-slate-500 mt-2">pick up where you left off.</p>
                        </div>


                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-2 block">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="alex@wu.ac.at"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-2 block">Password</label>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand outline-none transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover shadow-lg shadow-brand/20 transition duration-300 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="text-center text-sm text-slate-500 pt-2">
                            Don't have an account?{' '}
                            <Link href="/auth/register" className="text-brand font-bold hover:underline">Register</Link>
                        </p>
                    </motion.form>
                ) : (
                    // The "Bridge" screen: Fades to a solid background to hide the Next.js route swap
                    <motion.div
                        key="bridge-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-50 bg-slate-50"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}