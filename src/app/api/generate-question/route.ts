import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-3.1-pro-preview';

export async function POST(req: NextRequest) {
    try {
        const { prompt, categoryName, subcategoryName, extraContext } = await req.json();

        const systemPrompt = `You are an expert exam question writer for the WU BBE (Vienna University of Economics and Business — Business, Economics and Social Sciences) entrance exam.

Your task is to generate a single high-quality exam question in the following JSON format:
{
  "questionText": "The question stem goes here",
  "contextText": "Optional context shown above the question (can be empty string)",
  "statements": [
    { "text": "Statement 1", "isCorrect": true },
    { "text": "Statement 2", "isCorrect": false },
    { "text": "Statement 3", "isCorrect": true }
  ]
}

Rules:
- Generate between 3 and 6 statements per question
- Each statement must be clearly true or false based on the subject matter
- The question stem should clearly frame what the statements are about
- Statements should be plausible — wrong ones should not be obviously wrong
- Use contextText for passages, tables, or data that statements refer to (leave empty if not needed)
- LaTeX math is supported using $inline$ and $$block$$ syntax
- Match the difficulty and style of the WU BBE entrance exam
- Return ONLY valid JSON, no markdown, no explanation, no backticks`;

        const userMessage = `Category: ${categoryName}${subcategoryName ? `\nSubcategory: ${subcategoryName}` : ''}

Prompt instructions:
${prompt}

${extraContext ? `Additional context from user:\n${extraContext}` : ''}

Generate one exam question following the JSON format exactly.`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json({ error: `Gemini API error: ${err}` }, { status: 500 });
        }

        const data = await response.json();

        console.log('Gemini raw response:', JSON.stringify(data, null, 2));

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log('RAW GEMINI TEXT:', text);
        console.log('FINISH REASON:', data.candidates?.[0]?.finishReason);

        if (!text) return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });

        // Extract JSON from anywhere in the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return NextResponse.json({ error: 'Could not extract JSON from response' }, { status: 500 });

        const parsed = JSON.parse(jsonMatch[0]);

        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    }
}