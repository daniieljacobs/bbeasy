"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle, BarChart3, Trophy, Shuffle } from 'lucide-react';

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const v = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: visible ? 1 : 0, y: visible ? 0 : 16 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }
  });

  const features = [
    { icon: <CheckCircle size={16} className="text-emerald-500" />, title: "True/False Format", desc: "Multi-statement questions matching the exact BBE style." },
    { icon: <BarChart3 size={16} className="text-brand" />, title: "Subject Analytics", desc: "Track weak spots across Economics, Maths, and English." },
    { icon: <Trophy size={16} className="text-amber-500" />, title: "Leaderboard", desc: "See where you stand against other applicants." },
    { icon: <Shuffle size={16} className="text-violet-500" />, title: "Practice Mode", desc: "Personalised drills that target your weakest areas." },
  ];

  const proFeatures = [
    'Unlimited mock exams',
    'Personalised practice drills',
    'Spider graph by subject',
    'Avg. score & percentile',
    'Leaderboard score tab',
    'Weak area targeting',
  ];

  return (
    <div className="min-h-screen font-mono bg-slate-50 selection:bg-brand selection:text-white">

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md border-b border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-black text-lg tracking-tight">
            BB<span className="text-brand">EASY</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors"
            >
              Get Started <ArrowUpRight size={10} />
            </Link>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-6xl mx-auto px-6">

        {/* ── HERO ── */}
        <div className="pt-24 pb-20 border-b border-slate-200">
          <motion.p {...v(0.05)} className="text-[9px] font-black uppercase tracking-[0.4em] text-brand mb-6">
            WU Wien · BBE Entrance Exam · 2026
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <div>
              <motion.h1 {...v(0.1)} className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.95] mb-8">
                The BBE<br />
                prep tool<br />
                <span className="text-brand">built right.</span>
              </motion.h1>
              <motion.div {...v(0.2)} className="flex items-center gap-3">
                <Link
                  href="/auth/register"
                  className="flex items-center gap-2 px-8 py-3.5 bg-brand text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors shadow-lg shadow-brand/20"
                >
                  Start for free <ArrowUpRight size={11} />
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-3.5 border border-slate-200 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-slate-400 hover:text-slate-900 transition-colors"
                >
                  Sign in
                </Link>
              </motion.div>
            </div>

            <motion.div {...v(0.15)} className="space-y-3">
              <p className="text-slate-500 text-sm leading-relaxed">
                Built by a student, for students. While competitors charge €300–500,
                BBEasy gives you everything you need to prepare for the WU Wien BBE
                entrance exam — at a fraction of the cost.
              </p>
              <div className="flex items-center gap-6 pt-2">
                <div>
                  <p className="text-3xl font-black text-slate-900">€0</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">to start</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-3xl font-black text-slate-900">€19</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">vs €300–500 elsewhere</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-3xl font-black text-slate-900">3</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400">subjects covered</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="py-20 border-b border-slate-200">
          <motion.p {...v(0.05)} className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10">
            What's included
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: visible ? 1 : 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="bg-slate-50 px-6 py-8"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-2">{f.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── PRICING ── */}
        <div className="py-20 border-b border-slate-200">
          <motion.p {...v(0.05)} className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">
            Pricing
          </motion.p>
          <motion.p {...v(0.08)} className="text-slate-400 text-sm mb-10">
            Start monthly, upgrade to lifetime anytime. Cancel whenever you want.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 items-stretch">

            {/* Free */}
            <motion.div {...v(0.1)} className="bg-slate-50 px-8 py-10 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Free</p>
              <p className="text-5xl font-black text-slate-900 mb-1">€0</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-8">Always free</p>
              <ul className="space-y-3 flex-1">
                {['3 mock exams', 'Starter assessment', 'Prep points & leaderboard'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-1 h-1 bg-slate-400 rounded-full shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="h-10" />
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 py-3 border border-slate-300 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-slate-600 hover:text-slate-900 transition-colors"
              >
                Get started free
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div {...v(0.15)} className="bg-brand px-8 py-10 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mb-4">Pro</p>
              <div className="mb-8">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mb-1">Starting at</p>
                <p className="text-5xl font-black text-white mb-1">€19</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">/ month · or €59 lifetime</p>
              </div>
              <ul className="space-y-3 flex-1">
                {proFeatures.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/80">
                    <span className="w-1 h-1 bg-white/60 rounded-full shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="h-10" />
              <Link
                href="/auth/register"
                className="flex items-center justify-center gap-2 py-3 bg-white text-brand text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-colors"
              >
                Get Pro <ArrowUpRight size={11} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <motion.div {...v(0.1)} className="py-10 flex items-center justify-between">
          <span className="font-black text-sm tracking-tight text-slate-400">
            BB<span className="text-brand">EASY</span>
          </span>
          <p className="text-[9px] uppercase tracking-[0.3em] text-slate-300">
            WU Wien · BBE 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}