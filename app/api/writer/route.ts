
import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { topic, type, tone, length } = body;

    if (
      typeof topic !== "string" ||
      !topic.trim() ||
      topic.length > 5000
    ) {
      return NextResponse.json(
        { error: "Please enter instructions under 5,000 characters." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "Essay", "Email", "Article", "Product description",
      "Blog post", "Story", "Business proposal", "Other"
    ];

    const allowedTones = [
      "Professional", "Casual", "Creative",
      "Academic", "Friendly", "Persuasive"
    ];

    const allowedLengths = ["Short", "Medium", "Long"];

    const safeType = allowedTypes.includes(type) ? type : "Other";
    const safeTone = allowedTones.includes(tone) ? tone : "Professional";
    const safeLength = allowedLengths.includes(length) ? length : "Medium";

    const tokenLimits: Record<string, number> = {
      Short: 500,
      Medium: 1000,
      Long: 1600
    };

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "You are Aivanta AI Writer. Create clear, original, useful writing based on the user's request. Follow the requested format, tone, and length.",
      input: `Writing type: ${safeType}
Tone: ${safeTone}
Length: ${safeLength}

User instructions:
${topic}`,
      max_output_tokens: tokenLimits[safeLength]
    });

    return NextResponse.json({
      result: response.output_text
    });
  } catch (error) {
    console.error("Aivanta Writer error:", error);

    return NextResponse.json(
      { error: "Writing generation failed. Please check the server terminal." },
      { status: 500 }
    );
  }
}
