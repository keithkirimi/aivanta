import { NextResponse } from "next/server";
import {
  generateAIText,
  CloudflareAIError,
} from "@/lib/ai/cloudflare";

const SYSTEM_PROMPT = `
You are Aivanta's expert brand naming strategist.

Generate original, memorable and creative business name ideas.

Rules:
- Generate exactly 12 distinct name ideas.
- Make every name relevant to the business industry.
- Use the supplied keyword naturally when provided.
- Follow the requested naming style carefully.
- Avoid generic combinations and repetitive names.
- Prefer names that are easy to pronounce, spell and remember.
- Do not claim that names are legally available or trademark-free.
- Do not copy famous existing company names.
- Return exactly 12 numbered names, one per line.
- Do not include introductions, explanations or markdown headings.
`;

const styles = ["Modern", "Luxury", "Creative", "Simple", "Bold"];

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

    const industry =
      typeof data.industry === "string" ? data.industry.trim() : "";

    const keyword =
      typeof data.keyword === "string" ? data.keyword.trim() : "";

    const style =
      typeof data.style === "string" && styles.includes(data.style)
        ? data.style
        : "Modern";

    if (!industry) {
      return NextResponse.json(
        { error: "Please enter your business industry." },
        { status: 400 }
      );
    }

    if (industry.length > 150 || keyword.length > 100) {
      return NextResponse.json(
        { error: "Please shorten your industry or keyword." },
        { status: 400 }
      );
    }

    const result = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `
Business industry: ${industry}
Keyword: ${keyword || "Use your creativity"}
Naming style: ${style}

Generate 12 distinctive business names.
`,
        },
      ],
      maxTokens: 900,
      temperature: 0.9,
    });

    const names = result
      .split("\n")
      .map((line) => line.replace(/^\s*(?:\d+[\.\)]|[-*])\s*/, "").trim())
      .filter((line) => line.length > 0 && line.length <= 70)
      .map((line) => line.replace(/^["'“”]+|["'“”]+$/g, ""))
      .filter((line) => line.length > 0);

    const uniqueNames = [...new Set(names)].slice(0, 12);

    if (uniqueNames.length < 5) {
      throw new CloudflareAIError(
        "The AI did not generate enough name ideas. Please try again.",
        502
      );
    }

    return NextResponse.json({
      success: true,
      names: uniqueNames,
    });
  } catch (error) {
    console.error("Business Name Generator error:", error);

    if (error instanceof CloudflareAIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "Could not generate business names. Please try again." },
      { status: 500 }
    );
  }
}
