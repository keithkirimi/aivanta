import { NextResponse } from "next/server";
import {
  generateAIText,
  CloudflareAIError,
} from "@/lib/ai/cloudflare";

const SYSTEM_PROMPT = `
You are Aivanta AI Writer, a professional writing assistant.

Your job is to create original, high-quality writing based on the user's instructions.

Rules:
- Follow the requested writing type, topic, tone and length.
- Write naturally and avoid repetitive or generic filler.
- Use clear structure and appropriate headings where useful.
- Make the writing relevant, detailed and coherent.
- Do not invent facts, statistics, sources or quotations.
- If information is missing, make reasonable assumptions without pretending they are facts.
- Return the finished writing directly.
- Do not include unnecessary introductions about being an AI.
`;

const allowedTypes = [
  "Essay",
  "Article",
  "Blog Post",
  "Story",
  "Email",
  "Letter",
  "Report",
  "Speech",
  "Description",
  "Other",
];

const allowedTones = [
  "Professional",
  "Friendly",
  "Formal",
  "Casual",
  "Persuasive",
  "Creative",
  "Academic",
  "Simple",
];

const allowedLengths = [
  "Short",
  "Medium",
  "Long",
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

    const topic =
      typeof data.topic === "string" ? data.topic.trim() : "";

    const type =
      typeof data.type === "string" && allowedTypes.includes(data.type)
        ? data.type
        : "Essay";

    const tone =
      typeof data.tone === "string" && allowedTones.includes(data.tone)
        ? data.tone
        : "Professional";

    const length =
      typeof data.length === "string" && allowedLengths.includes(data.length)
        ? data.length
        : "Medium";

    if (!topic) {
      return NextResponse.json(
        { error: "Please enter a topic first." },
        { status: 400 }
      );
    }

    if (topic.length > 5000) {
      return NextResponse.json(
        { error: "Your topic is too long. Please keep it under 5,000 characters." },
        { status: 400 }
      );
    }

    const prompt = `
Create the following piece of writing.

Writing type: ${type}
Topic and instructions: ${topic}
Tone: ${tone}
Length: ${length}

Make sure the result is complete, useful and ready for the user to edit or use.
`;

    const result = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: length === "Long" ? 2400 : 1400,
      temperature: 0.75,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("AI Writer error:", error);

    if (error instanceof CloudflareAIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "AI Writer could not complete your request. Please try again." },
      { status: 500 }
    );
  }
}
