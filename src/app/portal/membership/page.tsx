"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Check, Loader2, Zap, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MembershipPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }
            setUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            setCurrentPlan(profile?.role || 'free');

            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setSubscription(sub);
            setLoading(false);
        }
        fetchUser();
    }, [router]);

    async function handleCheckout(plan: 'monthly' | 'annual') {
        if (!userId) return;
        setLoadingPlan(plan);

        const priceId = plan === 'monthly'
            ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
            : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL;

        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId, plan, userId }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Something went wrong. Please try again.');
            }
        } catch (err) {
            alert('Something went wrong. Please try again.');
        } finally {
            setLoadingPlan(null);
        }
    }

    async function handleManage() {
        if (!userId) return;
        setLoadingPlan('manage');
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } finally {
            setLoadingPlan(null);
        }
    }

    const isPro = currentPlan === 'pro' || currentPlan === 'admin';

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3 font-mono">
                <div className="w-px h-10 bg-brand animate-pulse" />
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400">Loading</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-6 py-14 font-mono">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                className="text-center mb-14"
            >
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Membership</p>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
                    Get Access.
                </h1>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Full access to the question bank, practice sessions, and performance tracking.
                    Cancel anytime.
                </p>
            </motion.div>

            {/* Current plan banner */}
            {isPro && subscription && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 px-6 py-4 bg-emerald-50 border border-emerald-200 flex items-center justify-between"
                >
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-1">
                            Active — {subscription.plan === 'monthly' ? 'Monthly Plan' : 'Exam Pass'}
                        </p>
                        <p className="text-xs text-emerald-700">
                            Access until {new Date(subscription.current_period_end).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                    {subscription.plan === 'monthly' && (
                        <button
                            onClick={handleManage}
                            disabled={loadingPlan === 'manage'}
                            className="flex items-center gap-2 px-4 py-2 border border-emerald-300 text-emerald-700 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-100 transition-colors disabled:opacity-40"
                        >
                            {loadingPlan === 'manage' ? <Loader2 size={11} className="animate-spin" /> : null}
                            Manage
                        </button>
                    )}
                </motion.div>
            )}

            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Monthly */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="bg-white border border-slate-200 p-8 flex flex-col"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Zap size={14} className="text-brand" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Monthly</span>
                    </div>

                    <div className="mb-6">
                        <span className="text-5xl font-black text-slate-900">€20</span>
                        <span className="text-slate-400 text-sm ml-2">/ month</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                        {[
                            'Full question bank access',
                            'Unlimited practice sessions',
                            'Performance tracking & insights',
                            'Weak area targeting',
                            'Cancel anytime',
                        ].map(feature => (
                            <li key={feature} className="flex items-center gap-3">
                                <Check size={13} className="text-emerald-500 shrink-0" />
                                <span className="text-xs text-slate-600">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleCheckout('monthly')}
                        disabled={!!loadingPlan || isPro}
                        className="w-full py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {loadingPlan === 'monthly' ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isPro && subscription?.plan === 'monthly' ? 'Current Plan' : 'Get Monthly Access'}
                    </button>
                </motion.div>

                {/* Exam Pass */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="bg-slate-900 border border-slate-900 p-8 flex flex-col relative overflow-hidden"
                >
                    <div className="absolute top-4 right-4 px-2 py-1 bg-brand text-white text-[8px] font-black uppercase tracking-[0.2em]">
                        Best Value
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Exam Pass</span>
                    </div>

                    <div className="mb-2">
                        <span className="text-5xl font-black text-white">€40</span>
                        <span className="text-slate-400 text-sm ml-2">one-time</span>
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-6">
                        Access until 31 July 2025
                    </p>

                    <ul className="space-y-3 mb-8 flex-1">
                        {[
                            'Full question bank access',
                            'Unlimited practice sessions',
                            'Performance tracking & insights',
                            'Weak area targeting',
                            'Valid until 1 month after exam',
                        ].map(feature => (
                            <li key={feature} className="flex items-center gap-3">
                                <Check size={13} className="text-emerald-400 shrink-0" />
                                <span className="text-xs text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleCheckout('annual')}
                        disabled={!!loadingPlan || isPro}
                        className="w-full py-3 bg-white text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {loadingPlan === 'annual' ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isPro && subscription?.plan === 'annual' ? 'Current Plan' : 'Get Exam Pass'}
                    </button>
                </motion.div>
            </div>

            <p className="text-center text-[9px] uppercase tracking-[0.2em] text-slate-300 mt-8">
                Secure payment via Stripe · No hidden fees
            </p>
        </div>
    );
}