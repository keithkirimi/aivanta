
"use client";

import { useState } from "react";
import Link from "next/link";

type StudyContent = {
  title: string;
  notes: string[];
  questions: string[];
  flashcards: {
    question: string;
    answer: string;
  }[];
};

type StudyResponse = {
  success?: boolean;
  error?: string;
  content?: StudyContent;
};

function getStudyResponse(value: unknown): StudyResponse {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const rawContent = record.content;

  if (
    rawContent === null ||
    typeof rawContent !== "object" ||
    Array.isArray(rawContent)
  ) {
    return {
      success: record.success === true,
      error: typeof record.error === "string" ? record.error : undefined,
    };
  }

  const content = rawContent as Record<string, unknown>;

  const validFlashcards =
    Array.isArray(content.flashcards) &&
    content.flashcards.every(
      (card: unknown) =>
        card !== null &&
        typeof card === "object" &&
        !Array.isArray(card) &&
        typeof (card as Record<string, unknown>).question === "string" &&
        typeof (card as Record<string, unknown>).answer === "string",
    );

  const validContent =
    typeof content.title === "string" &&
    Array.isArray(content.notes) &&
    content.notes.every((note: unknown) => typeof note === "string") &&
    Array.isArray(content.questions) &&
    content.questions.every(
      (question: unknown) => typeof question === "string",
    ) &&
    validFlashcards;

  return {
    success: record.success === true,
    error: typeof record.error === "string" ? record.error : undefined,
    content: validContent
      ? {
          title: content.title as string,
          notes: content.notes as string[],
          questions: content.questions as string[],
          flashcards: content.flashcards as StudyContent["flashcards"],
        }
      : undefined,
  };
}

export default function StudyAssistant() {
  const [subject, setSubject] = useState("Science");
  const [level, setLevel] = useState("Beginner");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState<StudyContent | null>(null);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("Notes");
  const [loading, setLoading] = useState(false);

  async function generateStudyMaterial() {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setStatus("Please enter a topic first.");
      setContent(null);
      return;
    }

    setLoading(true);
    setStatus("Creating your personalised study material...");

    try {
      const response = await fetch("/api/study-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          level,
          topic: cleanTopic,
        }),
      });

      const parsed: unknown = await response.json().catch(() => ({}));
      const data = getStudyResponse(parsed);

      if (!response.ok || !data.success || !data.content) {
        throw new Error(
          data.error || "Unable to create study material. Please try again.",
        );
      }

      setContent(data.content);
      setActiveTab("Notes");
      setStatus("Your AI-generated study session is ready!");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied successfully!");
    } catch {
      setStatus("Copy unavailable. Please select the text manually.");
    }
  }

  function getAllNotes() {
    if (!content) return "";

    return [
      "AIVANTA STUDY ASSISTANT",
      `Subject: ${subject}`,
      `Level: ${level}`,
      `Topic: ${content.title}`,
      "",
      "STUDY NOTES",
      ...content.notes.map((note, index) => `${index + 1}. ${note}`),
      "",
      "PRACTICE QUESTIONS",
      ...content.questions.map(
        (question, index) => `${index + 1}. ${question}`,
      ),
      "",
      "FLASHCARDS",
      ...content.flashcards.flatMap((card, index) => [
        `${index + 1}. ${card.question}`,
        `Answer: ${card.answer}`,
      ]),
    ].join("\n");
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-block text-sm text-violet-400 transition hover:text-violet-300"
        >
          ← Back to Aivanta
        </Link>

        <div className="mt-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-3xl shadow-lg shadow-violet-500/20">
            🎓
          </div>

          <div className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-violet-300">
            AIVANTA STUDY ASSISTANT
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Learn smarter.
            <span className="block bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Study better.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-gray-400">
            Organise your learning, create study notes, practise questions,
            and test yourself with AI-generated flashcards.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-bold">Create your study session</h2>
            <p className="mt-2 text-sm text-gray-400">
              Choose what you want to study.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-[#11131b] px-4 py-3 text-white outline-none focus:border-violet-500 disabled:opacity-50"
                >
                  <option>Science</option>
                  <option>Mathematics</option>
                  <option>English</option>
                  <option>Computer Studies</option>
                  <option>History</option>
                  <option>Geography</option>
                  <option>Business Studies</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Learning level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-[#11131b] px-4 py-3 text-white outline-none focus:border-violet-500 disabled:opacity-50"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  What topic are you studying?
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Example: Photosynthesis, Algebra, HTML..."
                  rows={4}
                  maxLength={500}
                  disabled={loading}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#11131b] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-violet-500 disabled:opacity-50"
                />
                <p className="mt-1 text-right text-xs text-gray-500">
                  {topic.length}/500
                </p>
              </div>

              <button
                onClick={generateStudyMaterial}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-violet-500/10 transition hover:scale-[1.01] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating your study session..." : "Create Study Session ✨"}
              </button>

              {status && (
                <p
                  aria-live="polite"
                  className="text-center text-sm text-violet-300"
                >
                  {status}
                </p>
              )}
            </div>
          </section>

          <section className="min-h-[500px] rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            {!content ? (
              <div className="flex min-h-[450px] flex-col items-center justify-center text-center">
                {loading ? (
                  <>
                    <div className="text-6xl">✨</div>
                    <h2 className="mt-5 text-2xl font-bold">
                      Preparing your lesson
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
                      Aivanta is creating your study notes, practice questions,
                      and flashcards.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl">📚</div>
                    <h2 className="mt-5 text-2xl font-bold">
                      Your study space awaits
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
                      Enter a topic and create a study session to see your
                      notes, practice questions, and flashcards here.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                      Your AI study session
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      {content.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      {subject} · {level}
                    </p>
                  </div>

                  <button
                    onClick={() => copyText(getAllNotes())}
                    className="rounded-xl border border-violet-400/30 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/10"
                  >
                    Copy everything
                  </button>
                </div>

                <div className="mt-7 flex flex-wrap gap-2 border-b border-white/10 pb-4">
                  {["Notes", "Questions", "Flashcards"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        activeTab === tab
                          ? "bg-violet-600 text-white"
                          : "bg-white/[0.05] text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "Notes" && (
                  <div className="mt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold">Study notes</h3>
                      <button
                        onClick={() => copyText(content.notes.join("\n\n"))}
                        className="text-sm text-violet-300 hover:text-violet-200"
                      >
                        Copy notes
                      </button>
                    </div>

                    <div className="space-y-3">
                      {content.notes.map((note, index) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4"
                        >
                          <span className="font-bold text-violet-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className="text-sm leading-6 text-gray-300">
                            {note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "Questions" && (
                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-bold">
                      Test your understanding
                    </h3>

                    <div className="space-y-3">
                      {content.questions.map((question, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
                        >
                          <p className="text-xs font-semibold text-violet-300">
                            QUESTION {index + 1}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-gray-200">
                            {question}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                      Use these questions to practise and check your
                      understanding. Review important answers against your
                      class materials.
                    </p>
                  </div>
                )}

                {activeTab === "Flashcards" && (
                  <FlashcardSection
                    key={`${content.title}-${content.flashcards.length}`}
                    cards={content.flashcards}
                  />
                )}
              </>
            )}
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-5">
          <p className="text-sm font-bold text-violet-300">
            <span className="mr-2">✨</span>
            AI-powered study assistant
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Study notes, questions, and flashcards are generated by AI based
            on your selected subject, topic, and learning level. Always check
            important information against your textbooks and class materials.
          </p>
        </div>

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-sm text-gray-500">
          © 2026 Aivanta AI. Learn, create, and build.
        </footer>
      </div>
    </main>
  );
}

function FlashcardSection({
  cards,
}: {
  cards: { question: string; answer: string }[];
}) {
  const [revealed, setRevealed] = useState<number[]>([]);

  function toggleCard(index: number) {
    setRevealed((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  }

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-lg font-bold">Flashcards</h3>
      <p className="mb-5 text-sm text-gray-400">
        Select a card to reveal its answer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => toggleCard(index)}
            className="min-h-40 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-5 text-left transition hover:border-violet-400/50"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
              {revealed.includes(index) ? "Answer" : `Card ${index + 1}`}
            </p>
            <p className="mt-4 text-sm leading-6 text-white">
              {revealed.includes(index) ? card.answer : card.question}
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Click to {revealed.includes(index) ? "hide" : "reveal"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
