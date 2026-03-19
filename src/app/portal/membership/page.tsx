"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react'; // Added X icon

const tiers = [
    {
        name: "Basic",
        price: "€0",
        period: "forever",
        role: "free",
        features: [
            "3 mock exams",
            "Core assessment",
            "Basic score tracking",
        ],
        button: "Current Plan",
        href: null,
        featured: false
    },
    {
        name: "Premium",
        price: "€10",
        period: "per month",
        role: "pro",
        features: [
            "Unlimited mock exams",
            "Percentile rankings",
            "Spider chart analytics",
            "Full test history",
            "Preparation points & leaderboard",
        ],
        button: "Upgrade to Premium",
        href: "/portal/checkout?plan=pro",
        featured: true
    },
    {
        name: "Lifetime",
        price: "€30",
        period: "one time",
        role: "lifetime",
        features: [
            "Everything in Premium",
            "Lifetime access",
            "Priority content updates",
            "Early access to new features",
        ],
        button: "Get Lifetime Access",
        href: "/portal/checkout?plan=lifetime",
        featured: false
    }
];

export default function MembershipPage() {
    const [currentRole, setCurrentRole] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchRole() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (data) setCurrentRole(data.role);
            setLoading(false);
        }
        fetchRole();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    return (
        // Added 'relative' to the main container
        <div className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-16 font-mono">

            {/* Close Button */}
            <button
                onClick={() => router.push('/portal/dashboard')}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                aria-label="Back to dashboard"
            >
                <X size={24} />
            </button>

            <div className="text-center mb-16">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-3">Membership</p>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    Choose your plan
                </h1>
                <p className="text-slate-400 text-sm mt-3">
                    Upgrade anytime. Cancel anytime.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full">
                {tiers.map((tier) => {
                    const isCurrent = currentRole === tier.role;

                    return (
                        <div
                            key={tier.name}
                            className={`relative p-10 rounded-[2.5rem] border flex flex-col transition-all ${tier.featured
                                ? 'border-brand/25 bg-brand-tint shadow-2xl shadow-brand/10'
                                : 'border-white/60 bg-white/40 backdrop-blur-2xl shadow-xl shadow-black/5'
                                }`}
                        >
                            {isCurrent && (
                                <div className="absolute top-6 right-6">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-white px-2.5 py-1 rounded-full border border-brand/20">
                                        Current
                                    </span>
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${tier.featured ? 'text-brand' : 'text-slate-400'}`}>
                                    {tier.name}
                                </h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{tier.price}</span>
                                    <span className="text-xs text-slate-400 mb-1.5 font-medium">{tier.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-4 flex-grow mb-10">
                                {tier.features.map(f => (
                                    <li key={f} className="flex items-center gap-3 text-xs text-slate-500">
                                        <Check size={13} className={tier.featured ? 'text-brand' : 'text-slate-300'} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {isCurrent ? (
                                <div className="w-full py-4 text-[11px] font-black text-center rounded-2xl bg-slate-100 text-slate-400 uppercase tracking-widest">
                                    Current Plan
                                </div>
                            ) : (
                                <a href={tier.href || '#'} className={`block w-full py-4 text-[11px] font-black text-center rounded-2xl transition-all tracking-widest uppercase ${tier.featured ? 'bg-brand text-white hover:bg-brand-hover' : 'bg-slate-900/5 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
                                    {tier.button}
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="text-[9px] text-slate-400 uppercase tracking-[0.4em] mt-16 opacity-40">
                Secure Checkout &middot; Instant Activation
            </p>
        </div>
    );
}