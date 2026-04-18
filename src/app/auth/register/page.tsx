"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            alert('Username already taken, please choose another.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });

        if (error) {
            alert(error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                full_name: fullName,
                username,
                role: 'free'
            });
        }

        const firstName = fullName.split(' ')[0] || '';
        router.push(`/portal/dashboard?onboarding=true&name=${firstName}`);
        setLoading(false);
    };

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 text-sm font-mono outline-none focus:border-brand transition-colors placeholder:text-slate-300";
    const labelClass = "text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1.5 block";

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm font-mono"
        >
            {/* Logo */}
            <div className="mb-10 text-center">
                <Link href="/" className="font-black text-2xl tracking-tight hover:opacity-70 transition-opacity">
                    BB<span className="text-brand">EASY</span>
                </Link>
            </div>
            {/* Header */}
            <div className="mb-8 border-b border-slate-200 pb-8">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-2">Create account</p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                    Join the portal.
                </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Mustermann"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Username</label>
                    <input
                        required
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="alex_m"
                        maxLength={20}
                        className={inputClass}
                    />
                    <p className="text-[8px] uppercase tracking-[0.2em] text-slate-300 mt-1.5">
                        Letters, numbers and underscores only
                    </p>
                </div>
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
                    <label className={labelClass}>Password</label>
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
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>
            </form>

            <p className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-6">
                Already registered?{' '}
                <Link href="/auth/login" className="text-brand font-black hover:text-slate-900 transition-colors">
                    Sign in
                </Link>
            </p>
        </motion.div>
    );
}