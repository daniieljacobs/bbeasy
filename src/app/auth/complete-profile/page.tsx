"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function CompleteProfilePage() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        (async () => {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) {
                router.replace('/auth/login');
                return;
            }
            setEmail(user.email || '');

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, username, role, has_onboarded')
                .eq('id', user.id)
                .single();

            // Already complete → don't show this page, route them on.
            if (profile?.full_name && profile?.username) {
                if (!profile.has_onboarded) {
                    const firstName = profile.full_name.split(' ')[0] || '';
                    router.replace(`/auth/onboarding?name=${encodeURIComponent(firstName)}`);
                } else {
                    const target = profile.role === 'admin' ? '/admin/dashboard' : '/portal/dashboard';
                    router.replace(target);
                }
                return;
            }

            // Prefill from OAuth metadata when available.
            const meta = user.user_metadata || {};
            setFullName(profile?.full_name || meta.full_name || meta.name || '');
            setUsername(profile?.username || '');
            setChecking(false);
        })();
    }, [router]);

    const handleUsernameChange = (val: string) => {
        const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(cleaned);
        setUsernameError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setUsernameError('');

        const trimmedName = fullName.trim();
        const trimmedUsername = username.trim();

        if (trimmedUsername.length < 3) {
            setUsernameError('Username must be at least 3 characters.');
            setSubmitting(false);
            return;
        }

        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) {
            router.replace('/auth/login');
            return;
        }

        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', trimmedUsername)
            .neq('id', user.id)
            .maybeSingle();

        if (existing) {
            setUsernameError('Username already taken.');
            setSubmitting(false);
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: trimmedName,
                username: trimmedUsername,
                role: 'free',
            });

        if (error) {
            setUsernameError(error.message);
            setSubmitting(false);
            return;
        }

        const firstName = trimmedName.split(' ')[0] || '';
        router.replace(`/auth/onboarding?name=${encodeURIComponent(firstName)}`);
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 text-sm font-mono outline-none focus:border-brand transition-colors placeholder:text-slate-300";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    if (checking) {
        return (
            <div className="fixed inset-0 flex items-center justify-center font-mono">
                <Loader2 className="animate-spin text-slate-300" size={20} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center font-mono selection:bg-brand selection:text-white px-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-sm"
            >
                <div className="mb-8 border-b border-slate-200 pb-8">
                    <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-2">One last step</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                        Tell us who you are.
                    </h1>
                    {email && (
                        <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-4">
                            Signed in as <span className="text-slate-600 normal-case tracking-normal">{email}</span>
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={labelClass}>Full Name</label>
                        <input
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alex Mustermann"
                            className={inputClass}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Username</label>
                        <input
                            required
                            type="text"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            placeholder="alex_m"
                            maxLength={20}
                            minLength={3}
                            className={inputClass}
                        />
                        {usernameError ? (
                            <p className="text-[8px] uppercase tracking-[0.2em] text-red-500 mt-1.5">
                                {usernameError}
                            </p>
                        ) : (
                            <p className="text-[8px] uppercase tracking-[0.2em] text-slate-300 mt-1.5">
                                Letters, numbers and underscores · 3–20 characters
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !fullName.trim() || username.trim().length < 3}
                        className="w-full py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40 mt-2 flex items-center justify-center gap-2"
                    >
                        {submitting ? <><Loader2 className="animate-spin" size={12} /> Saving</> : 'Continue'}
                    </button>
                </form>

                <p className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-300 mt-6">
                    You can change these later in settings.
                </p>
            </motion.div>
        </div>
    );
}