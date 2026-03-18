"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function OnboardingPage() {
    const [stage, setStage] = useState('welcome');

    useEffect(() => {
        const timer = setTimeout(() => setStage('pricing'), 2400);
        return () => clearTimeout(timer);
    }, []);

    const tiers = [
        {
            name: "Basic",
            price: "€0",
            features: ["3 high-quality mocks", "Core assessment"],
            button: "Choose Basic",
            href: "/portal/dashboard",
            featured: false
        },
        {
            name: "Premium",
            price: "€10",
            features: ["50+ mock exams", "Percentile ranking", "AI Personal Reports"],
            button: "Upgrade Now",
            href: "/portal/checkout?plan=pro",
            featured: true
        },
        {
            name: "Lifetime",
            price: "€30",
            features: ["Unlimited access", "Priority updates"],
            button: "Get Lifetime",
            href: "/portal/checkout?plan=lifetime",
            featured: false
        }
    ];

    return (
        <div className="h-screen flex items-center justify-center font-mono selection:bg-blue-900 selection:text-white overflow-hidden">
            <AnimatePresence mode="wait">
                {stage === 'welcome' ? (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center"
                    >
                        <h1 className="text-5xl font-bold text-slate-800 tracking-tighter">
                            BBEasy
                        </h1>
                        <p className="text-[10px] text-slate-400 mt-6 uppercase tracking-[0.5em] font-medium">
                            Welcome
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="pricing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                        className="max-w-6xl w-full mx-auto px-8"
                    >
                        <div className="text-center mb-16">
                            <h2 className="text-xl font-bold text-slate-600 tracking-tight">
                                Select your membership
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-10 items-stretch">
                            {tiers.map((tier, idx) => (
                                <motion.div
                                    key={tier.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.3 + (idx * 0.15),
                                        duration: 0.8,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className={`relative p-10 rounded-[2.5rem] border flex flex-col
                                        ${tier.featured
                                            ? 'border-blue-900/25 bg-[#F0F4FF] backdrop-blur-2xl shadow-2xl shadow-blue-900/10'
                                            : 'border-white/60 bg-white/40 backdrop-blur-2xl shadow-xl shadow-black/5'
                                        }`}
                                >
                                    <div className="mb-10">
                                        <h3 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${tier.featured ? 'text-blue-900' : 'text-slate-400'}`}>
                                            {tier.name}
                                        </h3>
                                        <div className="text-4xl font-bold text-slate-800 tracking-tighter">
                                            {tier.price}
                                        </div>
                                    </div>

                                    <ul className="space-y-5 flex-grow mb-8">
                                        {tier.features.map(f => (
                                            <li key={f} className="text-xs text-slate-500 flex items-center gap-3">
                                                <div className={`w-1 h-1 rounded-full shrink-0 ${tier.featured ? 'bg-blue-900/30' : 'bg-slate-300'}`} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={tier.href}
                                        className={`block w-full py-4 text-[11px] font-bold text-center rounded-2xl transition-all tracking-wide
                                            ${tier.featured
                                                ? 'bg-blue-900 text-white hover:bg-slate-900 duration-300'
                                                : 'bg-slate-900/[0.05] text-slate-600 hover:bg-slate-900 duration-300 hover:text-white'
                                            }`}
                                    >
                                        {tier.button}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <footer className="mt-16 text-center">
                            <p className="text-[9px] text-slate-400 uppercase tracking-[0.5em] opacity-40">
                                Secure Checkout &middot; Instant Activation
                            </p>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}