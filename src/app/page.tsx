"use client";

import { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle, BarChart3, Trophy, Shuffle, Menu, X, Layers } from 'lucide-react';

// ── RADAR CHART ──
function RadarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const n = entries.length;

  function angleFor(i: number) { return (Math.PI * 2 * i) / n - Math.PI / 2; }
  function point(i: number, r: number) {
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  const gridLevels = Array.from({ length: 4 }, (_, i) => (i + 1) / 4);
  const dataPoints = entries.map(([, val], i) => point(i, (val / 100) * radius));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');
  const color = '#2E4A7A';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {gridLevels.map((level, li) => (
        <polygon key={li} points={entries.map((_, i) => { const p = point(i, radius * level); return `${p.x},${p.y}`; }).join(' ')} fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {entries.map((_, i) => {
        const p = point(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        points={polygonPoints}
        fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />)}
      {entries.map(([label], i) => {
        const p = point(i, radius + 28);
        const words = label.split(' ');
        const lineHeight = 9;
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" fontSize="9" fontWeight="900" fill="#94a3b8" fontFamily="monospace" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {words.map((word, idx) => (
              <tspan key={idx} x={p.x} dy={idx === 0 ? -(words.length - 1) * lineHeight / 2 : lineHeight}>{word}</tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

// ── LEADERBOARD PREVIEW (mobile-responsive) ──
function LeaderboardPreview() {
  const rows = [
    { rank: 1, name: 'vienna_pro', score: 94, exams: 18, top: 1 },
    { rank: 2, name: 'bbe_master', score: 91, exams: 24, top: 2 },
    { rank: 3, name: 'future_wu', score: 88, exams: 11, top: 4 },
    { rank: 4, name: 'wu_applicant', score: 86, exams: 20, top: 5 },
    { rank: 5, name: 'maths_enjoyer', score: 83, exams: 9, top: 7 },
    { rank: 6, name: 'econqueen', score: 81, exams: 15, top: 9 },
  ];

  // Mobile: # | User | Score | Percentile  (Exams hidden)
  // Desktop: # | User | Score | Exams | Percentile
  const gridCls =
    "grid grid-cols-[1.5rem_1fr_3rem_4.5rem] sm:grid-cols-[2rem_1fr_4rem_4rem_5rem] gap-2 sm:gap-4 px-3 sm:px-4";

  return (
    <div className="w-full font-mono">
      <div className={`${gridCls} pb-3 border-b border-slate-200`}>
        <span className="text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-300">#</span>
        <span className="text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-300">User</span>
        <span className="text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-300 text-right">Score</span>
        <span className="hidden sm:block text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 text-right">Exams</span>
        <span className="text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-300 text-right">Pctl</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((e, i) => (
          <motion.div
            key={e.rank}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`${gridCls} py-2.5 sm:py-3 items-center`}
          >
            <span className="text-[11px] font-black text-slate-300">{e.rank}</span>
            <span className="text-xs font-black text-slate-800 truncate">@{e.name}</span>
            <span className="text-xs font-black text-slate-700 text-right">{e.score}%</span>
            <span className="hidden sm:block text-[11px] font-black text-slate-400 text-right">{e.exams}</span>
            <span className="text-[10px] font-black text-brand uppercase tracking-widest text-right">Top {e.top}%</span>
          </motion.div>
        ))}
      </div>
      <div className={`${gridCls} py-2.5 sm:py-3 items-center border-t-2 border-brand/20 bg-brand/5 mt-1`}>
        <span className="text-[11px] font-black text-brand">42</span>
        <span className="text-xs font-black text-brand truncate">@you</span>
        <span className="text-xs font-black text-brand/70 text-right">71%</span>
        <span className="hidden sm:block text-[11px] font-black text-brand/50 text-right">3</span>
        <span className="text-[10px] font-black text-brand/60 uppercase tracking-widest text-right border-b border-dashed border-brand/30">Top 34%</span>
      </div>
    </div>
  );
}

// ── SECTION DOT NAV (hidden on mobile) ──
function SectionDots({ current, total, onClick }: { current: number; total: number; onClick: (i: number) => void }) {
  return (
    <div className="hidden md:flex fixed right-5 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className="group flex items-center justify-end gap-2"
          aria-label={`Go to section ${i + 1}`}
        >
          <span className={`block h-px transition-all duration-300 ${i === current ? 'w-5 bg-brand' : 'w-2 bg-slate-300 group-hover:w-3 group-hover:bg-slate-500'}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-brand scale-125' : 'bg-slate-300 group-hover:bg-slate-500'}`} />
        </button>
      ))}
    </div>
  );
}

function ExamCountdown({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const target = new Date('2026-06-30T03:00:00').getTime();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white w-fit">
        <Timer size={10} className="text-brand shrink-0" />
        <span className="text-[10px] font-black tabular-nums text-slate-900 tracking-wide">
          {time.days}d · {pad(time.hours)}h · {pad(time.minutes)}m · {pad(time.seconds)}s
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">to exam</span>
      </div>
    );
  }

  return (
    <div className="border-l-2 border-brand/30 pl-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Timer size={11} className="text-brand" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand">Exam Countdown</p>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">{time.days}</p>
          <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-0.5">days</p>
        </div>
        <span className="text-slate-300 font-black text-lg mb-3">:</span>
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">{pad(time.hours)}</p>
          <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-0.5">hrs</p>
        </div>
        <span className="text-slate-300 font-black text-lg mb-3">:</span>
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">{pad(time.minutes)}</p>
          <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-0.5">min</p>
        </div>
        <span className="text-slate-300 font-black text-lg mb-3">:</span>
        <div className="text-center">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-none">{pad(time.seconds)}</p>
          <p className="text-[8px] uppercase tracking-widest text-slate-400 mt-0.5">sec</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const TOTAL_SECTIONS = 6;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setCurrentSection(Math.min(idx, TOTAL_SECTIONS - 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll showcase — desktop only (touch devices skip it)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Skip on touch / small screens to avoid fighting the user
    const isTouch = typeof window !== 'undefined' && (
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    );
    if (isTouch) return;

    let cancelled = false;
    const cancel = () => { cancelled = true; };
    el.addEventListener('wheel', cancel, { once: true, passive: true });
    el.addEventListener('touchstart', cancel, { once: true, passive: true });
    el.addEventListener('keydown', cancel, { once: true });
    el.addEventListener('click', cancel, { once: true });

    const DWELL = 2800;
    const TRANSITION = 900;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function scrollTo(target: number): Promise<void> {
      return new Promise(resolve => {
        const start = el!.scrollTop;
        const diff = target - start;
        const t0 = performance.now();
        function step(now: number) {
          if (cancelled) return resolve();
          const p = Math.min((now - t0) / TRANSITION, 1);
          el!.scrollTop = start + diff * easeInOut(p);
          p < 1 ? requestAnimationFrame(step) : resolve();
        }
        requestAnimationFrame(step);
      });
    }

    async function run() {
      await new Promise(r => setTimeout(r, 2500));
      for (let i = 1; i < TOTAL_SECTIONS; i++) {
        if (cancelled) break;
        await scrollTo(i * el!.clientHeight);
        if (cancelled) break;
        if (i < TOTAL_SECTIONS - 1) await new Promise(r => setTimeout(r, DWELL));
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  const scrollToSection = (i: number) => {
    scrollRef.current?.scrollTo({ top: i * (scrollRef.current?.clientHeight ?? 0), behavior: 'smooth' });
  };

  const v = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  });

  const demoStats = {
    "Logic": 85,
    "Algebra": 62,
    "Functions": 92,
    "Calculus": 48,
    "Finance": 75,
    "Probability": 21
  };

  const features = [
    {
      icon: <CheckCircle size={16} className="text-emerald-500" />,
      title: "True / False Format",
      desc: "Multi-statement questions built to match the exact BBE exam structure.",
    },
    {
      icon: <Layers size={16} className="text-blue-900" />,
      title: "Official Exam Format",
      desc: "Questions built to match the exact structure and logic of the real BBE assessment.",
    },
    {
      icon: <Trophy size={16} className="text-amber-500" />,
      title: "Live Leaderboard",
      desc: "See how you rank against other applicants in real time.",
    },
    {
      icon: <Shuffle size={16} className="text-violet-500" />,
      title: "Practice Mode",
      desc: "Adaptive drills that zero in on the topics you need most.",
    },
  ];

  const freeFeatures = [
    'Free full mock exams (unlimited attempts)',
    'Starter self-assessment',
    'Prep points & leaderboard',
  ];

  const proFeatures = [
    'Unlimited mock exams',
    'Personalised practice drills',
    'Spider graph by subject',
    'Average score & live percentile',
    'Leaderboard ranking',
    'Weak-area targeting',
  ];

  return (
    <>
      <SectionDots current={currentSection} total={TOTAL_SECTIONS} onClick={scrollToSection} />

      <div
        ref={scrollRef}
        className="h-screen overflow-y-scroll snap-y snap-proximity md:snap-mandatory font-mono bg-slate-50 selection:bg-brand selection:text-white"
      >
        {/* ── NAVBAR ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-black text-lg tracking-tight">
              BB<span className="text-brand">EASY</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/about" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">About</Link>
              <Link href="/auth/login" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">Login</Link>
              <Link href="/auth/register" className="flex items-center gap-1.5 px-4 py-1.5 bg-brand text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors ml-2">
                Get started <ArrowUpRight size={10} />
              </Link>
            </div>

            {/* Mobile: primary CTA + hamburger */}
            <div className="flex sm:hidden items-center gap-2">
              <Link
                href="/auth/register"
                className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-slate-900 transition-colors"
              >
                Start free <ArrowUpRight size={10} />
              </Link>
              <button
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="p-1.5 text-slate-700"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="sm:hidden border-t border-slate-200 bg-slate-50/95 backdrop-blur-md">
              <div className="px-4 py-3 flex flex-col">
                <Link
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600"
                >
                  About
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 border-t border-slate-200"
                >
                  Login
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* ── S1: HERO ── */}
        <section className="snap-start min-h-screen flex flex-col justify-center px-5 sm:px-6 pt-20 pb-12 sm:pt-14 sm:pb-0">
          <div className="max-w-6xl mx-auto w-full">
            <motion.p {...v(0.05)} className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-brand mb-5 sm:mb-6">
              WU Wien · BBE · 2026
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-end">
              <div>
                <motion.h1
                  {...v(0.1)}
                  className="text-[2.5rem] leading-[1.02] sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight md:leading-[0.95] mb-5 sm:mb-8"
                >
                  Get a Free
                  <br />
                  Mock Test.
                  <br />
                  <span className="text-brand">BBE Entrance Exam.</span>
                </motion.h1>

                {/* Compact countdown — mobile only */}
                <motion.div {...v(0.15)} className="md:hidden mb-5">
                  <ExamCountdown compact />
                </motion.div>

                <motion.div {...v(0.2)} className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link
                    href="/auth/register"
                    className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 bg-brand text-white text-[10px] sm:text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-colors shadow-lg shadow-brand/20"
                  >
                    Start for free <ArrowUpRight size={11} />
                  </Link>
                  <Link
                    href="/auth/login"
                    className="hidden sm:flex items-center justify-center px-6 sm:px-8 py-3.5 border border-slate-200 text-[10px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-slate-400 hover:text-slate-900 transition-colors"
                  >
                    Sign in
                  </Link>
                </motion.div>
                <motion.p {...v(0.25)} className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-3">
                  Free to start · No credit card required
                </motion.p>
              </div>

              {/* Right column — desktop only */}
              <motion.div {...v(0.15)} className="hidden md:flex flex-col space-y-6">
                <ExamCountdown />
                <p className="text-slate-500 text-sm leading-relaxed">
                  The digitally-native simulator for the WU BBE entrance exam. Modelled strictly after the 2026 syllabus and official literature.
                </p>
                <div className="flex items-center gap-6 border-t border-slate-200 pt-6">
                  <div>
                    <p className="text-3xl font-black text-slate-900">€0</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-0.5">to start</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div>
                    <p className="text-3xl font-black text-slate-900">150+</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-0.5">exam questions</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── S2: FEATURES ── */}
        <section className="snap-start min-h-screen flex flex-col justify-center px-5 sm:px-6 py-20 sm:py-0 border-y border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto w-full">
            <motion.p {...v(0.05)} className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-400 mb-8 sm:mb-10">
              Platform Features
            </motion.p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200">
              {features.map((f, i) => (
                <motion.div key={i} {...v(0.1 + i * 0.05)} className="bg-white px-4 sm:px-6 py-6 sm:py-12 flex flex-col gap-2 sm:gap-4">
                  <div>{f.icon}</div>
                  <h3 className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-[0.15em]">{f.title}</h3>
                  <p className="hidden sm:block text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── S3: FULL SYLLABUS ANATOMY ── */}
        <section className="snap-start min-h-screen flex flex-col justify-center px-5 sm:px-6 bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto w-full py-20">
            <motion.div {...v(0.05)} className="mb-10 sm:mb-12">
              <p className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-brand mb-4">Exhaustive Blueprint</p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                2026 Syllabus Coverage.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              {/* BUSINESS */}
              <motion.div {...v(0.1)} className="space-y-5 sm:space-y-6">
                <div className="pb-4 border-b-2 border-slate-900">
                  <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Section 01</p>
                  <h3 className="text-lg font-black text-slate-900">Business & Economy</h3>
                </div>
                <ul className="space-y-2 text-[11px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight list-none">
                  <li>• Economic & Market</li>
                  <li>• Business Environment</li>
                  <li>• Legal & Finance</li>
                  <li>• Marketing</li>
                  <li>• Accounting & Ratio Analysis</li>
                </ul>
                <p className="text-[9px] sm:text-[8px] text-slate-300 italic">Ref: B. Fuhrmann (2019)</p>
              </motion.div>

              {/* MATHS */}
              <motion.div {...v(0.15)} className="space-y-5 sm:space-y-6">
                <div className="pb-4 border-b-2 border-brand">
                  <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-brand">Section 02</p>
                  <h3 className="text-lg font-black text-slate-900">Mathematics</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 text-[11px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  <div>
                    <p className="text-slate-900 mb-1 border-b border-slate-100">Logic</p>
                  </div>
                  <div>
                    <p className="text-slate-900 mb-1 border-b border-slate-100">Algebra & Equations</p>
                    <p className="hidden sm:block text-[9px] lowercase font-normal leading-tight text-slate-400">
                      Elementary Algebra, Equations, Linear Equations (2 unknowns), Inequalities.
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-900 mb-1 border-b border-slate-100">Functions</p>
                    <p className="hidden sm:block text-[9px] lowercase font-normal leading-tight text-slate-400">
                      Linear/Quadratic, Power, Polynomial, Exponential & Logarithmic.
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-900 mb-1 border-b border-slate-100">Calculus</p>
                    <p className="hidden sm:block text-[9px] lowercase font-normal leading-tight text-slate-400">
                      Differentiation & Single Variable Optimisation.
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-900 mb-1 border-b border-slate-100">Financial Math</p>
                    <p className="hidden sm:block text-[9px] lowercase font-normal leading-tight text-slate-400">
                      Elementary Financial Mathematics.
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-900 mb-1 border-b border-slate-100">Probability & Stats</p>
                    <p className="hidden sm:block text-[9px] lowercase font-normal leading-tight text-slate-400">
                      Elementary Probability, Binomial Distribution.
                    </p>
                  </div>
                </div>
                <p className="text-[9px] sm:text-[8px] text-slate-300 italic">Ref: Sydsaeter et al. (2022)</p>
              </motion.div>

              {/* ENGLISH */}
              <motion.div {...v(0.2)} className="space-y-5 sm:space-y-6">
                <div className="pb-4 border-b-2 border-slate-900">
                  <p className="text-[11px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Section 03</p>
                  <h3 className="text-lg font-black text-slate-900">English</h3>
                </div>
                <ul className="space-y-2 text-[11px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight list-none">
                  <li>• Vocabulary</li>
                  <li>• Grammar</li>
                  <li>• Reading Comprehension</li>
                </ul>
                <p className="text-[9px] sm:text-[8px] text-slate-300 italic">WU BBE Standard Assessment</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── S4: ANALYTICS ── */}
        <section className="snap-start min-h-screen flex flex-col justify-center px-5 sm:px-6 py-20 md:py-0 bg-slate-50">
          <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <motion.h2 {...v(0.1)} className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.05] md:leading-none mb-4 sm:mb-6">
                See exactly where<br />to focus.
              </motion.h2>
              <motion.p {...v(0.15)} className="text-slate-500 text-sm leading-relaxed max-w-md">
                Stop guessing. Your dashboard breaks results into granular categories so you know whether to drill Calculus or shore up English Vocabulary.
              </motion.p>
            </div>
            <motion.div {...v(0.1)} className="flex justify-center order-1 md:order-2">
              <div className="bg-white p-5 sm:p-8 border border-slate-200 shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-slate-100 pb-4">
                  <p className="text-xs font-black text-slate-900">Performance Matrix</p>
                  <BarChart3 size={14} className="text-brand" />
                </div>
                <div className="h-56 sm:h-64 flex items-center justify-center">
                  <RadarChart data={demoStats} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── S5: LEADERBOARD ── */}
        <section className="snap-start min-h-screen flex flex-col justify-center px-5 sm:px-6 py-20 md:py-0 bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto w-full grid md:grid-cols-[1fr_1.7fr] gap-10 md:gap-16 items-center">
            <div>
              <motion.h2 {...v(0.1)} className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.05] md:leading-none mb-4 sm:mb-6">
                Know your<br />percentile.
              </motion.h2>
              <motion.p {...v(0.2)} className="text-slate-500 text-sm leading-relaxed mb-6 sm:mb-8 max-w-sm">
                WU admits the top 6–7% of applicants. Track your rank against real performance data so you know how far you have to climb.
              </motion.p>
              <div className="inline-block px-5 sm:px-6 py-4 border border-slate-200 bg-slate-50">
                <p className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-brand mb-1">Entrance cutoff</p>
                <p className="text-2xl font-black text-slate-900">TOP 7%</p>
              </div>
            </div>
            <motion.div {...v(0.1)} className="bg-slate-50 border border-slate-200 p-3 sm:p-6 overflow-x-auto">
              <LeaderboardPreview />
            </motion.div>
          </div>
        </section>

        {/* ── S6: PRICING ── */}
        <section className="snap-start min-h-screen flex flex-col justify-center px-5 sm:px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto w-full py-20">
            <motion.p {...v(0.05)} className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-400 mb-2">Pricing</motion.p>
            <motion.p {...v(0.08)} className="text-slate-400 text-sm mb-8 sm:mb-10">
              Start free. Upgrade when you're ready. Cancel anytime.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 items-stretch mb-16 sm:mb-20">
              <motion.div {...v(0.1)} className="bg-slate-50 px-6 sm:px-8 py-8 sm:py-10 flex flex-col">
                <p className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Free</p>
                <p className="text-4xl sm:text-5xl font-black text-slate-900">€0</p>
                <p className="text-[10px] sm:text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-1 mb-6 sm:mb-8">Always free</p>
                <ul className="space-y-3 flex-1 mb-6 sm:mb-8">
                  {freeFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-slate-600">
                      <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="flex items-center justify-center gap-2 py-3 border border-slate-300 text-[10px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:border-slate-600 hover:text-slate-900 transition-colors">
                  Get started free
                </Link>
              </motion.div>

              <motion.div {...v(0.15)} className="bg-brand px-6 sm:px-8 py-8 sm:py-10 flex flex-col text-white">
                <p className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">Pro</p>
                <p className="text-4xl sm:text-5xl font-black text-white">€20</p>
                <p className="text-[10px] sm:text-[9px] uppercase tracking-[0.2em] text-white/50 mt-1 mb-6 sm:mb-8">/ month · or €40 lifetime</p>
                <ul className="space-y-3 flex-1 mb-6 sm:mb-8">
                  {proFeatures.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-xs text-white/80">
                      <span className="w-1 h-1 bg-white/40 rounded-full shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className="flex items-center justify-center gap-2 py-3 bg-white text-brand text-[10px] sm:text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-colors">
                  Get Pro <ArrowUpRight size={11} />
                </Link>
              </motion.div>
            </div>

            <footer className="pt-8 sm:pt-10 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-6">
              <span className="font-black text-sm tracking-tight">BB<span className="text-brand">EASY</span></span>
              <div className="flex gap-4 text-[10px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-slate-300">
                <Link href="/terms">Terms</Link>
                <Link href="/privacy">Privacy</Link>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </>
  );
}