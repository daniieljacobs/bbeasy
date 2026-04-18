"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function MathText({
    text,
    className = "",
}: {
    text: string;
    className?: string;
}) {
    if (!text) return null;

    return (
        <span className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({ children }) => <span className="block">{children}</span>,
                    table: ({ children }) => (
                        <table className="w-full border-collapse border border-slate-300 my-4">
                            {children}
                        </table>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-slate-100">{children}</thead>
                    ),
                    th: ({ children }) => (
                        <th className="border border-slate-300 px-3 py-2 text-left font-semibold">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-slate-300 px-3 py-2">
                            {children}
                        </td>
                    ),
                }}
            >
                {text}
            </ReactMarkdown>
        </span>
    );
}