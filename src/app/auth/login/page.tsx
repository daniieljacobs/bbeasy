"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
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
        } else {
            router.push('/portal/tests');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900">Welcome back</h2>
                <p className="text-slate-500 mt-2">Pick up where you left off.</p>
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
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition duration-300 disabled:opacity-50"
            >
                {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-slate-500">
                Don't have an account? <Link href="/auth/register" className="text-blue-600 font-bold hover:underline">Register</Link>
            </p>
        </form>
    );
}