"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ExternalLink } from "lucide-react";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

const REFERENCES = [
    {
        authors: "Roediger, H. L., & Karpicke, J. D. (2006)",
        title: "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention.",
        meta: "Psychological Science, 17(3), 249–255",
        doi: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
        doiLabel: "doi.org/10.1111/j.1467-9280.2006.01693.x",
    },
    {
        authors: "Karpicke, J. D., & Roediger, H. L. (2008)",
        title: "The Critical Importance of Retrieval for Learning.",
        meta: "Science, 319(5865), 966–968",
        doi: "https://doi.org/10.1126/science.1152408",
        doiLabel: "doi.org/10.1126/science.1152408",
    },
    {
        authors:
            "Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013)",
        title:
            "Improving Students\\u2019 Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology.",
        meta: "Psychological Science in the Public Interest, 14(1), 4–58",
        doi: "https://doi.org/10.1177/1529100612453266",
        doiLabel: "doi.org/10.1177/1529100612453266",
    },
];

export default function AboutPage() {
    return (
        <div className="relative min-h-screen font-mono">


            <div className="relative z-10 max-w-xl mx-auto px-6 py-16">

                {/* Top bar */}
                <motion.div
                    {...fadeUp(0.05)}
                    className="flex items-center justify-between mb-14"
                >
                    <Link
                        href="/"
                        className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 px-4 py-2"
                    >
                        <svg
                            width="11"
                            height="11"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="group-hover:-translate-x-0.5 transition-transform duration-200"
                        >
                            <path d="M8 2L4 6l4 4" />
                        </svg>
                        Back
                    </Link>
                </motion.div>

                {/* Eyebrow */}
                <motion.p
                    {...fadeUp(0.1)}
                    className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 mb-3"
                >
                    BBEasy
                </motion.p>

                {/* Title */}
                <motion.h1
                    {...fadeUp(0.12)}
                    className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-10"
                >
                    The Story Behind BBEasy.
                </motion.h1>

                {/* Body */}
                <motion.div {...fadeUp(0.18)} className="flex flex-col gap-6 mb-10">
                    <p className="text-sm text-slate-500 leading-relaxed">
                        I built this platform because my girlfriend is applying for the WU
                        BBE entrance exam this year. When we started looking for prep
                        materials, I was surprised. Almost everything out there was either a
                        €500 course or a single mock exam priced at €75 for a public
                        university entrance exam. Both have their place, but a single exam
                        doesn't give you the repetition needed to actually internalize the format,
                        and €500 is a lot to spend before you've even sat the test.
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        I've always approached exams differently. When I applied to law
                        school at Masaryk University in Czechia, I barely opened the textbooks
                        and focused almost entirely on mock exams, learning the question
                        patterns, the timing, and the logic behind each section. That
                        approach landed me in the{" "}
                        <span className="font-black text-slate-900">98.96th percentile</span>.
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        It turns out that wasn't just luck. Educational psychologists call
                        it the{" "}
                        <span className="font-black text-slate-900">Testing Effect</span>
                        , a concept backed by a landmark study from Roediger &amp; Karpicke
                        (2006), which showed that active retrieval practice is significantly
                        more effective for long-term retention than traditional studying.
                        BBEasy is built around that principle.
                    </p>
                </motion.div>

                {/* Divider */}
                <motion.div
                    {...fadeUp(0.26)}
                    className="w-full h-px bg-slate-100 mb-8"
                />

                {/* References label */}
                <motion.p
                    {...fadeUp(0.28)}
                    className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 mb-5"
                >
                    References
                </motion.p>

                {/* Reference cards */}
                <div className="flex flex-col gap-3">
                    {REFERENCES.map((ref, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.3 + i * 0.07 }}
                            className="bg-white border border-slate-100 hover:border-slate-200 transition-all duration-200 p-5"
                        >
                            <p className="text-[10px] font-black text-slate-900 mb-1">
                                {ref.authors}
                            </p>
                            <p className="text-[10px] text-slate-500 italic leading-relaxed mb-1">
                                {ref.title}
                            </p>
                            <p className="text-[9px] text-slate-300 mb-2">{ref.meta}</p>
                            <a
                                href={ref.doi}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[9px] text-slate-300 hover:text-slate-500 transition-colors duration-150 break-all"
                            >
                                {ref.doiLabel}
                                <ExternalLink size={9} className="shrink-0" />
                            </a>
                        </motion.div>
                    ))}
                </div>

            </div>
        </div>
    );
}
