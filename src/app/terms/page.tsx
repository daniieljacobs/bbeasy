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
        title: "About BBEasy",
        content: [
            "BBEasy is an online exam preparation platform for the WU Wien BBE entrance exam, operated by a private individual. By creating an account or using BBEasy, you agree to these terms.",
        ],
    },
    {
        title: "Eligibility",
        content: [
            "You must be at least 16 years old to use BBEasy. By registering, you confirm that the information you provide is accurate.",
        ],
    },
    {
        title: "Your account",
        content: [
            "You are responsible for keeping your login credentials secure. Do not share your account with others. Each account is for a single user only.",
            "If you become aware of any unauthorised use of your account, notify us immediately at hello@bbeasy.at.",
        ],
    },
    {
        title: "Free and Pro plans",
        subsections: [
            {
                heading: "Free plan",
                body: "Includes 3 full mock exams with unlimited attempts, a starter assessment, and access to the leaderboard. No payment required.",
            },
            {
                heading: "Pro plan",
                body: "Available as a monthly subscription (€20/month) or a one-time lifetime payment (€40). Pro gives you unlimited mock exams, personalised practice drills, subject analytics, and full leaderboard features. Prices are in euros and include applicable VAT.",
            },
        ],
    },
    {
        title: "Payments and refunds",
        content: [
            "Payments are processed securely by Stripe. By purchasing a Pro plan, you authorise us to charge your payment method for the amount stated at checkout.",
            "Monthly subscriptions renew automatically each month until cancelled. You can cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period and you will retain Pro access until then.",
            "Lifetime plans are a one-time payment with no recurring charges.",
            "Due to the digital nature of the product, we generally do not offer refunds once access has been granted. If you have a problem with your purchase, contact us at hello@bbeasy.at and we will do our best to resolve it.",
        ],
    },
    {
        title: "Acceptable use",
        content: [
            "You agree not to share your account or allow others to use your access, attempt to scrape or reproduce the question bank or any content from BBEasy, reverse engineer or tamper with the platform, use BBEasy for any unlawful purpose, or attempt to gain unauthorised access to any part of the platform.",
            "We reserve the right to suspend or terminate accounts that violate these terms without refund.",
        ],
    },
    {
        title: "Intellectual property",
        content: [
            "All content on BBEasy — including exam questions, explanations, software, and design — is owned by or licensed to BBEasy. You may not reproduce, distribute, or create derivative works from any BBEasy content without written permission.",
            "Your exam results and performance data belong to you. See the Privacy Policy for details on how we handle your data.",
        ],
    },
    {
        title: "Disclaimer",
        content: [
            "BBEasy is an independent preparation tool and is not affiliated with, endorsed by, or officially connected to WU Wien or any examination body.",
            "We make every effort to ensure our questions are accurate and representative of the BBE exam format. However, we make no guarantee that using BBEasy will result in passing the BBE exam or gaining admission to WU Wien.",
            "The platform is provided as-is. We do not warrant that the service will be uninterrupted, error-free, or always available.",
        ],
    },
    {
        title: "Limitation of liability",
        content: [
            "To the maximum extent permitted by law, BBEasy and its operator shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including exam results or admission outcomes.",
            "Our total liability for any claim arising from these terms or your use of BBEasy shall not exceed the amount you paid us in the 3 months preceding the claim.",
        ],
    },
    {
        title: "Changes to the service",
        content: [
            "We may modify, suspend, or discontinue any part of BBEasy at any time. If we make significant changes that affect paid users, we will provide reasonable notice by email.",
            "We may also update these terms from time to time. Continued use of BBEasy after changes are posted constitutes acceptance of the updated terms.",
        ],
    },
    {
        title: "Governing law",
        content: [
            "These terms are governed by the laws of the Czech Republic and the European Union, including applicable EU consumer protection regulations. Any disputes shall be subject to the jurisdiction of the competent courts.",
        ],
    },
];

export default function TermsPage() {
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
                    Terms of Service.
                </motion.h1>

                {/* Intro */}
                <motion.p {...fadeUp(0.16)} className="text-sm text-slate-500 leading-relaxed mb-10">
                    Plain language, no legalese. By using BBEasy you agree to these terms. Questions? Email hello@bbeasy.at.
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
                                            <p className="text-sm text-slate-500 leading-relaxed">{sub.body}</p>
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