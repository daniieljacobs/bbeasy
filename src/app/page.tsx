import Link from 'next/link';
import { ArrowRight, GraduationCap, CheckCircle, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center pt-12">
      {/* Hero Section */}
      <section className="text-center mb-20 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-6 animate-fade-in">
          <GraduationCap size={14} /> 2026 ADMISSION PREP
        </div>
        <h1 className="text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
          Get started yesterday <br />
          <span className="text-blue-600">I love Sasha</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
          The most accurate BBE entrance exam simulation for WU Wien.
          Master Microeconomics, Mathematics, and English in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/portal/tests" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-2">
            Start Free Practice <ArrowRight size={20} />
          </Link>
          <Link href="/auth/register" className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition">
            Create Account
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid md:grid-cols-3 gap-8 w-full max-w-5xl px-6">
        {[
          { icon: <CheckCircle className="text-green-500" />, title: "T/F Format", desc: "Realistic multi-statement questions matching the WU style." },
          { icon: <BarChart3 className="text-blue-500" />, title: "Detailed Analytics", desc: "Identify your weak spots in Economics vs. Math." },
          { icon: <GraduationCap className="text-purple-500" />, title: "Expert Content", desc: "Curated questions based on the latest BBE syllabus." },
        ].map((f, i) => (
          <div key={i} className="p-8 bg-white/60 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm">
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}