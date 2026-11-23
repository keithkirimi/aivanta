
"use client";

import { useState } from "react";

type WriterResponse = {
  error?: string;
  result?: string;
};

function getWriterResponse(value: unknown): WriterResponse {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    error: typeof record.error === "string" ? record.error : undefined,
    result: typeof record.result === "string" ? record.result : undefined,
  };
}

export default function WriterPage() {
  const [type, setType] = useState("Essay");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!topic.trim()) {
      setStatus("Please enter a topic or instructions first.");
      return;
    }

    setLoading(true);
    setResult("");
    setStatus("Aivanta is writing your content...");

    try {
      const response = await fetch("/api/writer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          type,
          tone,
          length,
        }),
      });

      const parsed: unknown = await response.json().catch(() => ({}));
      const data = getWriterResponse(parsed);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      if (!data.result) {
        throw new Error("The AI returned an empty response. Try again.");
      }

      setResult(data.result);
      setStatus("Your writing is ready!");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not generate writing. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        setStatus("Copied to clipboard!");
      } catch {
        setStatus("Could not copy. Please select and copy the text manually.");
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
          ← Back to Aivanta
        </a>

        <div className="mb-10 mt-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-3xl">
            ✍️
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
            AIVANTA AI TOOLS
          </p>

          <h1 className="text-4xl font-bold sm:text-5xl">
            AI Writer<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-4 max-w-xl text-gray-400">
            Turn your ideas into polished writing. Create essays, emails,
            articles and professional content.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="mb-7 text-xl font-semibold">Create something</h2>

            <label className="mb-2 block text-sm font-medium text-gray-300">
              What do you want to write?
            </label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mb-6 w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-4 text-white outline-none focus:border-violet-500"
            >
              <option>Essay</option>
              <option>Email</option>
              <option>Article</option>
              <option>Product description</option>
              <option>Blog post</option>
              <option>Story</option>
              <option>Business proposal</option>
              <option>Other</option>
            </select>

            <label className="mb-2 block text-sm font-medium text-gray-300">
              Topic and instructions
            </label>

            <textarea
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setStatus("");
              }}
              placeholder="Describe what you want the AI to write..."
              rows={7}
              className="mb-6 w-full resize-y rounded-xl border border-white/10 bg-[#151620] px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-violet-500"
            />

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Writing tone
                </label>

                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#151620] px-3 py-3 text-white outline-none focus:border-violet-500"
                >
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Creative</option>
                  <option>Academic</option>
                  <option>Friendly</option>
                  <option>Persuasive</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Length
                </label>

                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#151620] px-3 py-3 text-white outline-none focus:border-violet-500"
                >
                  <option>Short</option>
                  <option>Medium</option>
                  <option>Long</option>
                </select>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "⏳ Generating..." : "✨ Generate writing"}
            </button>

            {status && (
              <p className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-300">
                {status}
              </p>
            )}
          </section>

          <section className="flex min-h-[500px] flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your result</h2>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                AI Writer
              </span>
            </div>

            {result ? (
              <div className="flex-1 whitespace-pre-wrap text-gray-200">
                {result}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-5 text-5xl">✍️</div>
                <h3 className="text-lg font-semibold">
                  Your writing will appear here
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
                  Enter your instructions and choose your writing preferences.
                  Your generated content will appear in this space.
                </p>
              </div>
            )}

            <button
              onClick={copyResult}
              disabled={!result}
              className="mt-6 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Copy result
            </button>
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          Aivanta AI Writer · Your ideas, brought to life.
        </p>
      </div>
    </main>
  );
}
