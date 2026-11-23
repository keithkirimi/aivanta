
import { NextRequest, NextResponse } from "next/server";
import {
  generateAIText,
  CloudflareAIError,
} from "@/lib/ai/cloudflare";

type StudyMaterial = {
  title: string;
  notes: string[];
  questions: string[];
  flashcards: {
    question: string;
    answer: string;
  }[];
};

type RequestBody = {
  subject?: unknown;
  level?: unknown;
  topic?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractJson(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The AI returned an invalid response. Please try again.");
  }

  return cleaned.slice(start, end + 1);
}

function validateMaterial(value: unknown): StudyMaterial {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The AI returned an invalid study session.");
  }

  const data = value as Record<string, unknown>;

  const isStringArray = (items: unknown): items is string[] =>
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (item) => typeof item === "string" && item.trim().length > 0
    );

  if (
    typeof data.title !== "string" ||
    !isStringArray(data.notes) ||
    !isStringArray(data.questions) ||
    !Array.isArray(data.flashcards) ||
    data.flashcards.length === 0
  ) {
    throw new Error(
      "The AI returned incomplete study material. Please try again."
    );
  }

  const flashcards = data.flashcards.filter(
    (card): card is { question: string; answer: string } =>
      !!card &&
      typeof card === "object" &&
      typeof (card as Record<string, unknown>).question === "string" &&
      typeof (card as Record<string, unknown>).answer === "string"
  );

  if (flashcards.length === 0) {
    throw new Error(
      "The AI did not create valid flashcards. Please try again."
    );
  }

  return {
    title: data.title.trim().slice(0, 200),
    notes: data.notes.slice(0, 15).map((note) => note.trim()),
    questions: data.questions
      .slice(0, 15)
      .map((question) => question.trim()),
    flashcards: flashcards.slice(0, 15).map((card) => ({
      question: card.question.trim(),
      answer: card.answer.trim(),
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const parsedBody: unknown = await request.json();

    const body: RequestBody = isRecord(parsedBody)
      ? (parsedBody as RequestBody)
      : {};

    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";

    const level =
      typeof body.level === "string" ? body.level.trim() : "";

    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    const allowedSubjects = [
      "Science",
      "Mathematics",
      "English",
      "Computer Studies",
      "History",
      "Geography",
      "Business Studies",
      "Other",
    ];

    const allowedLevels = ["Beginner", "Intermediate", "Advanced"];

    if (!allowedSubjects.includes(subject)) {
      return NextResponse.json(
        { success: false, error: "Please choose a valid subject." },
        { status: 400 }
      );
    }

    if (!allowedLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: "Please choose a valid learning level." },
        { status: 400 }
      );
    }

    if (!topic || topic.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a topic between 1 and 500 characters.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Aivanta Study Assistant, a careful and helpful educational tutor.

Create accurate, clear, useful study material for the learner.

SUBJECT: ${subject}
LEARNING LEVEL: ${level}
TOPIC: ${topic}

Adapt explanations to the selected level:
- Beginner: explain foundational ideas using simple language and examples.
- Intermediate: explain concepts with useful detail and connections.
- Advanced: include deeper reasoning, precise terminology, and challenging ideas.

Requirements:
1. Create a clear title for the study topic.
2. Create 6 to 10 informative study notes. Each note should teach a real fact, concept, definition, process, or useful example about the topic. Do not create generic study advice.
3. Create 5 to 8 relevant practice questions that test understanding of the actual topic.
4. Create 5 to 8 flashcards. Each must have a meaningful question and a correct, concise answer.
5. Keep all material relevant to the selected subject and topic.
6. Do not invent facts, quotations, sources, or curriculum requirements. If a detail is uncertain, avoid presenting it as certain.
7. Use age-appropriate educational language.

Return ONLY valid JSON in exactly this structure:
{
  "title": "Topic title",
  "notes": ["Study note 1", "Study note 2"],
  "questions": ["Practice question 1", "Practice question 2"],
  "flashcards": [
    {
      "question": "Flashcard question",
      "answer": "Correct answer"
    }
  ]
}`;

    const result = await generateAIText({
      systemPrompt,
      messages: [
        {
          role: "user",
          content: `Create my study material for: ${topic}`,
        },
      ],
      maxTokens: 2200,
      temperature: 0.5,
    });

    const parsed: unknown = JSON.parse(extractJson(result));
    const material = validateMaterial(parsed);

    return NextResponse.json({
      success: true,
      content: material,
    });
  } catch (error) {
    console.error("Study assistant error:", error);

    if (error instanceof CloudflareAIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create study material right now. Please try again.",
      },
      { status: 500 }
    );
  }
}

