"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
});

const SECTIONS = [
    {
        title: "Who is responsible for your data?",
        content: [
            "BBEasy is operated by a private individual based in the Czech Republic. For any questions about your data, contact hello@bbeasy.at.",
            "As BBEasy is offered to users in the European Union, this policy is written in accordance with the General Data Protection Regulation (GDPR).",
        ],
    },
    {
        title: "What data we collect and why",
        subsections: [
            {
                heading: "Account data",
                body: "When you register, we collect your first and last name, username, email address, and password. Passwords are stored as a secure hash — we never see your actual password.",
                legal: "Legal basis: Contract performance (Art. 6(1)(b) GDPR).",
            },
            {
                heading: "Exam and performance data",
                body: "We store your exam results, scores, and practice history to show you your progress, generate your performance radar chart, and calculate your leaderboard rank.",
                legal: "Legal basis: Contract performance (Art. 6(1)(b) GDPR).",
            },
            {
                heading: "Payment data",
                body: "If you upgrade to Pro, payments are processed by Stripe. We do not store your card details. Stripe may retain payment information in accordance with their own privacy policy at stripe.com/privacy.",
                legal: "Legal basis: Contract performance (Art. 6(1)(b) GDPR).",
            },
            {
                heading: "Email communications",
                body: "We send transactional emails only — account confirmation and password reset. We do not currently send marketing emails. If we introduce marketing emails in the future, we will ask for your explicit consent first and you can opt out at any time.",
                legal: "Legal basis: Legitimate interest for transactional emails (Art. 6(1)(f) GDPR); consent for any future marketing (Art. 6(1)(a) GDPR).",
            },
        ],
    },
    {
        title: "Cookies and tracking",
        content: [
            "We use strictly necessary session cookies to keep you logged in. These are deleted when you close your browser or log out.",
            "With your consent, we use Google Ads (Google LLC) to measure the effectiveness of our advertising campaigns. Google Ads may set cookies and collect data about your visit to help us understand how users reach our platform. This data may be used to show you relevant ads on Google's advertising network. Google's privacy policy is available at policies.google.com/privacy.",
            "We use Google Consent Mode v2. This means no advertising or analytics cookies are set until you explicitly accept via our cookie banner. You can withdraw your consent at any time by clearing your browser's local storage or cookies.",
            "Stripe, our payment processor, may set its own cookies during checkout. These are governed by Stripe's privacy policy at stripe.com/privacy.",
        ],
    },
    {
        title: "Who we share your data with",
        content: [
            "We do not sell your data. We do not share your data with third parties for marketing purposes.",
            "We share data only with Stripe for payment processing, and any future service providers necessary to operate BBEasy, bound by data processing agreements.",
            "Your leaderboard username and percentile rank are visible to other logged-in users as part of the live rankings feature. Your real name and email are never publicly displayed.",
        ],
    },
    {
        title: "How long we keep your data",
        content: [
            "We keep your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or tax purposes.",
            "Payment records may be retained for up to 10 years for tax compliance purposes.",
        ],
    },
    {
        title: "Your rights under GDPR",
        content: [
            "You have the right to access a copy of the data we hold about you, correct inaccurate data, delete your data, receive your data in a portable format, restrict how we use your data, object to processing based on legitimate interest, and withdraw consent at any time where processing is based on consent.",
            "To exercise any of these rights, email hello@bbeasy.at. We will respond within 30 days.",
            "You also have the right to lodge a complaint with your local data protection authority. In Austria, this is the Datenschutzbehörde at dsb.gv.at.",
        ],
    },
    {
        title: "Data security",
        content: [
            "We take reasonable technical measures to protect your data, including password hashing and encrypted connections (HTTPS). No system is perfectly secure. If you become aware of any security issue, please contact us immediately at hello@bbeasy.at.",
        ],
    },
    {
        title: "Changes to this policy",
        content: [
            "We may update this policy from time to time. If we make significant changes, we will notify you by email or by a notice on the site.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <div className="relative min-h-screen font-mono">
            <div className="relative z-10 max-w-xl mx-auto px-6 py-16">

                {/* Top bar */}
                <motion.div {...fadeUp(0.05)} className="flex items-center justify-between mb-14">
                    <Link
                        href="/"
                        className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all duration-200 px-4 py-2"
                    >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="group-hover:-translate-x-0.5 transition-transform duration-200">
                            <path d="M8 2L4 6l4 4" />
                        </svg>
                        Back
                    </Link>
                </motion.div>

                {/* Eyebrow */}
                <motion.p {...fadeUp(0.1)} className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 mb-3">
                    BBEasy · Last updated April 2026
                </motion.p>

                {/* Title */}
                <motion.h1 {...fadeUp(0.12)} className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-10">
                    Privacy Policy.
                </motion.h1>

                {/* Intro */}
                <motion.p {...fadeUp(0.16)} className="text-sm text-slate-500 leading-relaxed mb-10">
                    We keep this short and plain. If you have any questions, email hello@bbeasy.at.
                </motion.p>

                {/* Sections */}
                <div className="flex flex-col gap-10">
                    {SECTIONS.map((section, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.05 }}
                        >
                            {/* Section number + title */}
                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-[9px] font-black text-slate-300 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">{section.title}</h2>
                            </div>

                            {/* Plain content */}
                            {section.content && (
                                <div className="flex flex-col gap-3 pl-7">
                                    {section.content.map((para, j) => (
                                        <p key={j} className="text-sm text-slate-500 leading-relaxed">{para}</p>
                                    ))}
                                </div>
                            )}

                            {/* Subsections */}
                            {section.subsections && (
                                <div className="flex flex-col gap-5 pl-7">
                                    {section.subsections.map((sub, j) => (
                                        <div key={j} className="border-l border-slate-100 pl-4">
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] mb-2">{sub.heading}</p>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-1">{sub.body}</p>
                                            <p className="text-[10px] text-slate-300 italic">{sub.legal}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-slate-100 my-12" />

                {/* Footer note */}
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
                    hello@bbeasy.at · bbeasy.at
                </p>

            </div>
        </div>
    );
}