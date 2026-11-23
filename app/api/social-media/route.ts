
import { NextResponse } from "next/server";
import {
  generateAIText,
  CloudflareAIError,
} from "@/lib/ai/cloudflare";

const SYSTEM_PROMPT = `You are Aivanta's expert social media content creator.

Create engaging, original social media posts based on the user's topic, platform, and requested tone.

Platform guidance:
- Instagram: engaging caption, suitable emojis, community interaction, and relevant hashtags.
- TikTok: short, attention-grabbing, conversational caption with a strong hook and relevant hashtags.
- Facebook: natural, clear caption that encourages meaningful discussion.
- X: concise, impactful post that respects the platform's short-form style.

Tone guidance:
- Friendly: warm, approachable, conversational.
- Professional: polished, clear, credible.
- Funny: light-hearted and humorous where appropriate.
- Inspirational: positive, encouraging, motivating.
- Bold: confident, direct, attention-grabbing.

Rules:
- Stay relevant to the user's topic.
- Do not invent facts, statistics, endorsements, or promises.
- Avoid irrelevant or excessive hashtags.
- Return 5 to 8 useful hashtags, each beginning with #.
- Do not include explanations outside the requested output.
- Return valid JSON only, using this exact structure:
{
  "caption": "The complete caption",
  "hashtags": ["#Example", "#AnotherExample"]
}`;

const PLATFORMS = ["Instagram", "TikTok", "Facebook", "X"];
const TONES = [
  "Friendly",
  "Professional",
  "Funny",
  "Inspirational",
  "Bold",
];

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request." },
        { status: 400 }
      );
    }

    const { platform, tone, topic } = body as Record<string, unknown>;

    if (
      typeof platform !== "string" ||
      !PLATFORMS.includes(platform)
    ) {
      return NextResponse.json(
        { success: false, error: "Please select a valid platform." },
        { status: 400 }
      );
    }

    if (
      typeof tone !== "string" ||
      !TONES.includes(tone)
    ) {
      return NextResponse.json(
        { success: false, error: "Please select a valid tone." },
        { status: 400 }
      );
    }

    if (typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter a topic." },
        { status: 400 }
      );
    }

    if (topic.trim().length > 500) {
      return NextResponse.json(
        { success: false, error: "Your topic must be 500 characters or fewer." },
        { status: 400 }
      );
    }

    const result = await generateAIText({
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Platform: ${platform}\nTone: ${tone}\nTopic: ${topic.trim()}\n\nCreate the post now.`,
        },
      ],
      maxTokens: 900,
      temperature: 0.8,
    });

    let parsed: unknown;

    try {
      const cleaned = result
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "The AI returned an unexpected response. Please try again.",
        },
        { status: 502 }
      );
    }

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { success: false, error: "The AI response was incomplete." },
        { status: 502 }
      );
    }

    const data = parsed as {
      caption?: unknown;
      hashtags?: unknown;
    };

    if (
      typeof data.caption !== "string" ||
      !Array.isArray(data.hashtags)
    ) {
      return NextResponse.json(
        { success: false, error: "The AI response was incomplete. Please try again." },
        { status: 502 }
      );
    }

    const hashtags = data.hashtags
      .filter(
        (tag): tag is string =>
          typeof tag === "string" && /^#[a-zA-Z0-9_]+$/.test(tag)
      )
      .slice(0, 10);

    if (!data.caption.trim() || hashtags.length === 0) {
      return NextResponse.json(
        { success: false, error: "The AI could not create a complete post. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      caption: data.caption.trim(),
      hashtags,
    });
  } catch (error) {
    console.error("Social media generation error:", error);

    if (error instanceof CloudflareAIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong while generating your post. Please try again.",
      },
      { status: 500 }
    );
  }
}
