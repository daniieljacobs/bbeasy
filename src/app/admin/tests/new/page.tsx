import TestEditor from "@/components/admin/TestEditor";

export default function NewTestPage() {
    return (
        <div className="max-w-6xl mx-auto px-6 py-14 font-mono">
            <div className="mb-14 border-b border-slate-200 pb-8">
                <p className="text-[9px] uppercase tracking-[0.4em] text-slate-400 mb-3">Admin</p>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">New Test.</h1>
                <p className="text-slate-400 text-sm mt-2">Build a test and link questions from the bank.</p>
            </div>
            <TestEditor />
        </div>
    );
}