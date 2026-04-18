"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const [sessionReady, setSessionReady] = useState(false);
    const router = useRouter();

    // Supabase sends the user back with a session in the URL hash.
    // We listen for the PASSWORD_RECOVERY event to confirm the session is live.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        setDone(true);
        setTimeout(() => router.push('/auth/login'), 2500);
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 text-sm font-mono outline-none focus:border-brand transition-colors placeholder:text-slate-300";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    // Strength indicator
    const strength = password.length === 0 ? null
        : password.length < 8 ? 'weak'
            : password.length < 12 ? 'fair'
                : 'strong';
    const strengthColor = strength === 'strong' ? 'bg-emerald-400' : strength === 'fair' ? 'bg-amber-400' : 'bg-red-400';
    const strengthWidth = strength === 'strong' ? 'w-full' : strength === 'fair' ? 'w-2/3' : 'w-1/3';

    return (
        <div className="fixed inset-0 flex items-center justify-center font-mono selection:text-white px-4">
            <AnimatePresence mode="wait">
                {done ? (
                    <motion.div
                        key="done"
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
                            Password updated.
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Redirecting you to login...
                        </p>
                    </motion.div>
                ) : (
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
                                New password.
                            </h1>
                            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                                Choose something strong — at least 8 characters.
                            </p>
                        </div>

                        {!sessionReady && (
                            <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-100">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-amber-500 font-black">
                                    Verifying reset link...
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={labelClass}>New Password</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`${inputClass} pr-10`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {password.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="h-0.5 w-full bg-slate-100 overflow-hidden">
                                            <motion.div
                                                className={`h-full ${strengthColor} ${strengthWidth}`}
                                                initial={false}
                                                animate={{ width: strengthWidth === 'w-full' ? '100%' : strengthWidth === 'w-2/3' ? '66%' : '33%' }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                        <p className={`text-[8px] uppercase tracking-[0.25em] font-black ${strength === 'strong' ? 'text-emerald-500' : strength === 'fair' ? 'text-amber-500' : 'text-red-400'
                                            }`}>
                                            {strength}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Confirm Password</label>
                                <input
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className={`${inputClass} ${confirm && confirm !== password ? 'border-red-200 focus:border-red-400' : ''}`}
                                />
                                {confirm && confirm !== password && (
                                    <p className="text-[8px] uppercase tracking-[0.2em] text-red-400 font-black mt-1.5">
                                        Passwords don't match
                                    </p>
                                )}
                            </div>

                            {error && (
                                <p className="text-[9px] uppercase tracking-[0.2em] text-red-400 font-black">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !sessionReady || !password || password !== confirm}
                                className="w-full py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40"
                            >
                                {loading ? 'Updating...' : 'Set New Password'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}