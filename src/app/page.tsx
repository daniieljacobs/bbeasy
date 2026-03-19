"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, GraduationCap, CheckCircle, BarChart3, Trophy } from 'lucide-react';

export default function LandingPage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <CheckCircle size={20} className="text-green-500" />,
      title: "T/F Format",
      desc: "Realistic multi-statement questions matching the exact WU BBE style."
    },
    {
      icon: <BarChart3 size={20} className="text-brand" />,
      title: "Detailed Analytics",
      desc: "Track weak spots across Economics, Math, and English over time."
    },
    {
      icon: <Trophy size={20} className="text-amber-500" />,
      title: "Leaderboards",
      desc: "See where you stand against other applicants with percentile rankings."
    },
    {
      icon: <GraduationCap size={20} className="text-purple-500" />,
      title: "Expert Content",
      desc: "Curated questions based on the latest BBE syllabus and past exams."
    },
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center font-mono selection:bg-brand selection:text-white px-6">

      {/* Top nav */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -10 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-10 py-6"
      >
        <span className="font-black text-lg tracking-tight">
          BB<span className="text-brand">EASY</span>
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 uppercase tracking-widest transition"
          >
            login
          </Link>
          <Link
            href="/auth/register"
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand transition"
          >
            register
          </Link>
        </div>
      </motion.div>

      {/* Hero */}
      <div className="max-w-4xl w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-tint border border-blue-100 text-brand text-[10px] font-bold uppercase tracking-widest mb-8">
            <GraduationCap size={12} /> 2026 BBE Admission Prep
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-[1.05] mb-6">
            Stop guessing.<br />
            <span className="text-brand">Start scoring.</span>
          </h1>
          <p className="text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
            The only platform built specifically for the WU Wien BBE entrance exam.
            Simulate the real thing, track your progress, and know exactly where you stand.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            href="/auth/register"
            className="flex items-center gap-2 px-8 py-4 bg-brand text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition shadow-xl shadow-blue-200"
          >
            Get started free <ArrowRight size={14} />
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 bg-white/60 backdrop-blur-sm border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-white transition"
          >
            Sign in
          </Link>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 15 }}
              transition={{ duration: 0.8, delay: 0.5 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
              className="p-6 bg-white/40 backdrop-blur-sm border border-white/60 rounded-[1.5rem] shadow-sm text-left"
            >
              <div className="mb-3">{f.icon}</div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">{f.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.9 }}
        className="absolute bottom-6 text-[9px] text-slate-400 uppercase tracking-[0.5em] opacity-40"
      >
        BBEasy &middot; WU Wien &middot; 2026
      </motion.p>
    </div>
  );
}