import { NextRequest, NextResponse } from 'next/server';
import {
    BUSINESS_MASTER_PROMPT,
    MATH_MASTER_PROMPT,
    ENGLISH_MASTER_PROMPT
} from '@/lib/prompts';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = 'gemini-3.1-pro-preview';

export async function POST(req: NextRequest) {
    try {
        const { prompt, categoryName, subcategoryName, extraContext } = await req.json();

        // 1. Select Expert Domain Knowledge based on Category
        let expertRules = "";
        switch (categoryName) {
            case "Maths":
                expertRules = MATH_MASTER_PROMPT;
                break;
            case "English":
                expertRules = ENGLISH_MASTER_PROMPT;
                break;
            case "Economics":
                expertRules = BUSINESS_MASTER_PROMPT;
                break;
            default:
                expertRules = "Focus on academic excellence and high-stakes exam quality.";
        }

        // 2. Build the System Prompt using your structure but adding the Expert Logic
        const systemPrompt = `You are an expert exam question writer for the WU BBE (Vienna University of Economics and Business) entrance exam.

### EXPERT DOMAIN RULES & EXAMPLES:
${expertRules}

### OUTPUT FORMAT:
Return a single high-quality exam question in this JSON format:
{
  "questionText": "The question stem goes here",
  "contextText": "Optional context (reading snippet or quote) shown above the question",
  "statements": [
    { "text": "Statement 1", "isCorrect": true },
    { "text": "Statement 2", "isCorrect": false },
    { "text": "Statement 3", "isCorrect": true }
  ]
}

Categorization and question contents:
### Business & Economy
- Basic Economic Principles & Market Mechanics
- Business Classification & Environment
- Legal Structures & Business Finance
- Marketing Strategy & Strategic Tools
- Financial Accounting & Ratio Analysis

### English
- Vocabulary
- Grammar
- Reading Comprehension

### Maths
- Logic
- Algebra & Equations
	- Elementary Algebra
	- Equations
	- Linear Equations in two unknowns
	- Inequalities
- Functions
	- Linear and quadratic functions
	- Power functions
	- Polynomial functions
	- Exponential and logarithmic functions
- Calculus
	- Differentiation and single variable optimisation
- Financial Mathematics
	- Elementary financial mathematics
- Probability & Statistics
	- Elementary probability
	- Binomial distribution

Rules:
- Generate EXACTLY 5 statements per question (to match the BBE standard).
- Statements must be plausible — wrong ones should be "near-misses."
- LaTeX math is REQUIRED for all mathematical notations using $inline$ and $$block$$ syntax.
- Return ONLY valid JSON, no markdown, no explanation, no backticks.`;

        // 3. Construct the User Message as per your template
        const userMessage = `Category: ${categoryName}${subcategoryName ? `\nSubcategory: ${subcategoryName}` : ''}

Prompt instructions:
${prompt}

${extraContext ? `Additional context (e.g. Fuhrmann book snippet):\n${extraContext}` : ''}

Generate one exam question following the JSON format exactly.`;


        console.log("--- FULL PROMPT SENT TO GEMINI ---");
        console.log(`${systemPrompt}\n\n${userMessage}`);
        console.log("--- END OF PROMPT ---");

        // 4. API Call
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 56000,
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            return NextResponse.json({ error: `Gemini API error: ${err}` }, { status: 500 });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });

        // 5. Extract JSON using your Regex wrapper
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return NextResponse.json({ error: 'Could not extract JSON from response' }, { status: 500 });

        const parsed = JSON.parse(jsonMatch[0]);

        return NextResponse.json(parsed);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    }
}