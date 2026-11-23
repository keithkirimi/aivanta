
import { NextResponse } from "next/server";
import {
  generateAIText,
  CloudflareAIError,
} from "@/lib/ai/cloudflare";

const SYSTEM_PROMPT = `
You are Aivanta Coding Assistant, an experienced programming tutor and code reviewer.

Help users understand, debug and improve code accurately.

Rules:
- Analyze the actual code provided, not imaginary code.
- Explain findings clearly and use examples where helpful.
- For error checking, distinguish confirmed errors from possible issues.
- Never claim code was executed or tested when it was not.
- For improvements, return a complete improved version of the user's code in a code block, followed by a clear explanation of important changes.
- Preserve the original purpose and functionality.
- Do not remove important features without explaining why.
- Point out security concerns when relevant.
- If the code is incomplete, explain what information is missing.
- Never pretend uncertain findings are confirmed.
`;

const allowedLanguages = ["Python", "JavaScript", "HTML", "CSS"];
const allowedActions = ["Explain Code", "Find Errors", "Improve Code"];

const actionInstructions: Record<string, string> = {
  "Explain Code": `
Explain the supplied code step by step.
Describe its purpose, important variables, functions, elements and logic.
Explain difficult sections in beginner-friendly language.
Mention any obvious problems you notice, but keep the main focus on explanation.
`,
  "Find Errors": `
Review the supplied code carefully for syntax errors, logical errors,
potential runtime problems and likely bugs.
Separate confirmed errors from possible issues.
For each finding, explain where it occurs and how to fix it.
If you do not find an obvious issue, say so without guaranteeing the code is error-free.
`,
  "Improve Code": `
Improve the supplied code while preserving its purpose and existing functionality.
Return the complete improved code in a fenced code block using the correct language.
After the code, explain the most important improvements.
Do not invent requirements or claim the code was tested.
`,
};

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const language =
      typeof data.language === "string" &&
      allowedLanguages.includes(data.language)
        ? data.language
        : "";

    const action =
      typeof data.action === "string" &&
      allowedActions.includes(data.action)
        ? data.action
        : "";

    const code =
      typeof data.code === "string" ? data.code.trim() : "";

    if (!language || !action) {
      return NextResponse.json(
        { error: "Please select a supported language and action." },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Please enter some code first." },
        { status: 400 }
      );
    }

    if (code.length > 12000) {
      return NextResponse.json(
        { error: "Your code is too long. Please keep it under 12,000 characters." },
        { status: 400 }
      );
    }

    const result = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `
Programming language: ${language}
Requested action: ${action}

INSTRUCTIONS:
${actionInstructions[action]}

CODE TO ANALYZE:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`
`,
        },
      ],
      maxTokens: 3000,
      temperature: 0.35,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Coding Assistant error:", error);

    if (error instanceof CloudflareAIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Coding Assistant could not complete your request. Please try again." },
      { status: 500 }
    );
  }
}
