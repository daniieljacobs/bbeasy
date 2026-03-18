import { supabase } from '@/lib/supabase';
import TestRunner from '@/components/TestRunner';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TakeTestPage({ params }: PageProps) {
    const { id } = await params;

    const { data: test, error } = await supabase
        .from('tests')
        .select(`
            id,
            title,
            test_questions (
                question_order,
                questions (
                    id,
                    question_text,
                    category_id,
                    subcategory_id,
                    question_items (
                        id,
                        item_text,
                        is_correct
                    )
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error || !test) {
        console.error("Fetch error:", error);
        return notFound();
    }

    const formattedQuestions = test.test_questions
        .sort((a: any, b: any) => a.question_order - b.question_order)
        .map((tq: any) => ({
            id: tq.questions.id,
            topic: "Assessment Section",
            questionText: tq.questions.question_text,
            statements: tq.questions.question_items.map((item: any) => ({
                id: item.id,
                text: item.item_text,
                isCorrect: item.is_correct
            }))
        }));

    return (
        <div className="py-8 max-w-4xl mx-auto px-4">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-black text-slate-900">{test.title}</h1>
                <p className="text-slate-500 font-medium mt-2">
                    Carefully evaluate every statement.
                </p>
            </header>

            <TestRunner questions={formattedQuestions} />
        </div>
    );
}