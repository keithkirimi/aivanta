
import { NextResponse } from "next/server";
import {
  generateAIText,
  CloudflareAIError,
} from "@/lib/ai/cloudflare";

const SYSTEM_PROMPT = `
You are Aivanta's professional CV assistant.

Help users improve their CV using only information they provide.

Rules:
- Never invent employers, job titles, dates, qualifications, achievements, skills or experience.
- Improve grammar, clarity, structure and professional wording.
- Keep the user's original meaning.
- If information is insufficient, explain what is missing instead of making it up.
- Keep suggestions realistic and relevant.
- Return the requested result directly, without unnecessary introductions.
`;

const allowedActions = [
  "summary",
  "experience",
  "skills",
  "review",
];

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

    const action =
      typeof data.action === "string" &&
      allowedActions.includes(data.action)
        ? data.action
        : "";

    const name =
      typeof data.name === "string" ? data.name.trim() : "";

    const title =
      typeof data.title === "string" ? data.title.trim() : "";

    const summary =
      typeof data.summary === "string" ? data.summary.trim() : "";

    const experience =
      typeof data.experience === "string"
        ? data.experience.trim()
        : "";

    const education =
      typeof data.education === "string"
        ? data.education.trim()
        : "";

    const skills =
      typeof data.skills === "string" ? data.skills.trim() : "";

    const details = [
      `Name: ${name || "Not provided"}`,
      `Professional title: ${title || "Not provided"}`,
      `Current summary: ${summary || "Not provided"}`,
      `Experience: ${experience || "Not provided"}`,
      `Education: ${education || "Not provided"}`,
      `Skills: ${skills || "Not provided"}`,
    ].join("\n");

    if (!action) {
      return NextResponse.json(
        { error: "Please select a valid CV action." },
        { status: 400 }
      );
    }

    if (details.length > 12000) {
      return NextResponse.json(
        { error: "Your CV information is too long. Please shorten it." },
        { status: 400 }
      );
    }

    const instructions: Record<string, string> = {
      summary:
        "Write an improved professional CV summary based only on the supplied details. If there is not enough information, ask for the missing details rather than inventing them.",
      experience:
        "Rewrite the supplied work experience into clear, professional CV descriptions. Preserve the actual responsibilities and achievements. Do not invent results, numbers or duties.",
      skills:
        "Organize and improve the presentation of the skills the user actually listed. You may suggest additional skills separately, but clearly label them as suggestions to learn or verify, not skills the user already possesses.",
      review:
        "Review this CV information. Give an overall assessment, identify missing sections, explain what could be improved, and provide practical suggestions. Never assume missing qualifications or experience.",
    };

    const result = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${instructions[action]}\n\nCV INFORMATION:\n${details}`,
        },
      ],
      maxTokens: 1600,
      temperature: 0.55,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("CV Assistant error:", error);

    if (error instanceof CloudflareAIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "CV Assistant could not complete your request. Please try again." },
      { status: 500 }
    );
  }
}
