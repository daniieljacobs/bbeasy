import { MOCK_TESTS } from "@/lib/mock-data";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import Link from "next/link"; // 1. Import Link

export default function TestLibrary() {
    return (
        <div className="py-8">
            <header className="mb-10">
                <h2 className="text-3xl font-bold">Available Assessments</h2>
                <p className="text-slate-500">Practice under exam conditions to improve your performance.</p>
            </header>

            <div className="grid md:grid-cols-2 gap-6">
                {MOCK_TESTS.map((test) => (
                    <div key={test.id} className="group p-6 bg-white/80 border border-slate-200 rounded-2xl hover:shadow-xl hover:border-blue-300 transition-all duration-500 backdrop-blur-md">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2 block">{test.category}</span>
                        <h3 className="text-xl font-bold mb-4">{test.title}</h3>

                        <div className="flex gap-4 mb-6 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5"><BookOpen size={16} /> {test.questionsCount} Qs</div>
                            <div className="flex items-center gap-1.5"><Clock size={16} /> {test.timeLimit}</div>
                        </div>

                        {/* 2. Change <button> to <Link> and add the href */}
                        <Link
                            href={`/portal/tests/take/${test.id}`}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold flex justify-center items-center gap-2 group-hover:bg-blue-900 transition-colors"
                        >
                            Start Test <ArrowRight size={18} />
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}