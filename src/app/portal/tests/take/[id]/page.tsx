import { supabase } from '@/lib/supabase';
import TestRunner from '@/components/TestRunner';
import { notFound } from 'next/navigation';

// 1. Make the props type a Promise
interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TakeTestPage({ params }: PageProps) {
    // 2. Await the params before using them
    const { id } = await params;

    // 3. Perform the fetch with the resolved ID
    const { data: test, error } = await supabase
        .from('tests')
        .select(`
            id,
            title,
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
        `)
        .eq('id', id) // Using the awaited id
        .single();

    if (error || !test) {
        console.error("Fetch error:", error);
        // This is usually where "22P02" happens if ID is "undefined" or malformed
        return notFound();
    }

    const formattedQuestions = test.questions.map((q: any) => ({
        id: q.id,
        topic: "Assessment Section",
        questionText: q.question_text,
        statements: q.question_items.map((item: any) => ({
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