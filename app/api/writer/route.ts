import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { topic, type, tone, length } = await request.json();

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

    const safeType = typeof type === "string" ? type : "Other";
    const safeTone = typeof tone === "string" ? tone : "Professional";
    const safeLength = typeof length === "string" ? length : "Medium";

    const result = `AIVANTA AI WRITER — DEMO MODE

Writing type: ${safeType}
Tone: ${safeTone}
Length: ${safeLength}

Your topic:
${topic}

DEMO CONTENT

This is a demonstration of the Aivanta AI Writer interface.

Your topic has been received successfully. The writing tool is currently running in local demo mode, so this is sample content rather than AI-generated writing.

Your selected writing style is ${safeTone.toLowerCase()}.

When a suitable AI service is connected, Aivanta will generate original content based on your instructions.

Thank you for testing Aivanta!`;

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
