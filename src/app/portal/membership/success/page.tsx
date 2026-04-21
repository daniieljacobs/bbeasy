"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

declare function gtag(...args: unknown[]): void

export default function MembershipSuccessPage() {
    useEffect(() => {
        gtag('event', 'conversion', { send_to: 'AW-18089399359/UtQKCNOc9p8cEL-o2bFD' });
    }, []);

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-6 font-mono">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
                className="text-center max-w-sm w-full"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="flex justify-center mb-6"
                >
                    <CheckCircle size={48} className="text-emerald-500" />
                </motion.div>

                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">
                    Payment Successful
                </p>

                <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">
                    You're in.
                </h1>

                <p className="text-slate-400 text-sm mb-10">
                    Your account has been upgraded. Start practicing now and track your progress.
                </p>

                <Link
                    href="/portal/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors"
                >
                    Go to Dashboard <ArrowRight size={12} />
                </Link>
            </motion.div>
        </div>
    );
}