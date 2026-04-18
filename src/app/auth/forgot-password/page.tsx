"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        setSent(true);
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 text-sm font-mono outline-none focus:border-brand transition-colors placeholder:text-slate-300";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    return (
        <div className="fixed inset-0 flex items-center justify-center font-mono selection:bg-brand selection:text-white px-4">
            <AnimatePresence mode="wait">
                {!sent ? (
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
                            <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-2">Account</p>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                                Reset password.
                            </h1>
                            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                                Enter your email and we'll send you a link to set a new password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            {error && (
                                <p className="text-[9px] uppercase tracking-[0.2em] text-red-400 font-black">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <p className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-6">
                            <Link
                                href="/auth/login"
                                className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors font-black"
                            >
                                <ArrowLeft size={11} /> Back to login
                            </Link>
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-sm text-center"
                    >
                        <div className="mb-10 text-center">
                            <Link href="/" className="font-black text-2xl tracking-tight hover:opacity-70 transition-opacity">
                                BB<span className="text-brand">EASY</span>
                            </Link>
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <CheckCircle size={24} className="text-emerald-500" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
                            Check your email.
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed mb-8">
                            We sent a reset link to <span className="font-black text-slate-600">{email}</span>. It expires in 1 hour.
                        </p>

                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={11} /> Back to login
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}