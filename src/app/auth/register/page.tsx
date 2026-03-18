"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });

        if (error) {
            alert(error.message);
        } else {
            alert('Registration successful! Check your email for a confirmation link.');
            router.push('/portal/onboarding');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleRegister} className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900">Join the portal</h2>
                <p className="text-slate-500 mt-2">Start your BBE preparation today.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-2 block">Full Name</label>
                    <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Mustermann"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>
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
                {loading ? 'Creating account...' : 'Create My Account'}
            </button>

            <p className="text-center text-sm text-slate-500">
                Already have an account? <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">Log in</Link>
            </p>
        </form>
    );
}