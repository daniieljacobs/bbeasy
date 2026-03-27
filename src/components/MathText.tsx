"use client";

import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * Renders text with optional LaTeX math.
 * Inline math: $x^2 + y^2$
 * Block math: $$\frac{a}{b}$$
 */
export default function MathText({ text, className = '' }: { text: string; className?: string }) {
    if (!text) return null;

    // Split on block math first ($$...$$), then inline ($...$)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Process block math $$...$$
    const blockRegex = /\$\$([\s\S]+?)\$\$/g;
    const inlineRegex = /\$((?:[^$]|\\.)+?)\$/g;

    // Replace block math first
    const segments = remaining.split(/(\$\$[\s\S]+?\$\$)/g);

    segments.forEach(segment => {
        if (segment.startsWith('$$') && segment.endsWith('$$')) {
            const math = segment.slice(2, -2);
            parts.push(<BlockMath key={key++} math={math} />);
        } else {
            // Process inline math within this segment
            const inlineParts = segment.split(/(\$(?:[^$]|\\.)+?\$)/g);
            inlineParts.forEach(part => {
                if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                    const math = part.slice(1, -1);
                    try {
                        parts.push(<InlineMath key={key++} math={math} />);
                    } catch {
                        parts.push(<span key={key++}>{part}</span>);
                    }
                } else if (part) {
                    parts.push(<span key={key++}>{part}</span>);
                }
            });
        }
    });

    return <span className={className}>{parts}</span>;
}