"use client";

import { useState } from "react";
import Link from "next/link";

export default function BusinessNameGenerator() {
  const [industry, setIndustry] = useState("");
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState("Modern");
  const [names, setNames] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateNames() {
    if (!industry.trim()) {
      setNames([]);
      setStatus("Please enter your business industry.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setNames([]);
    setStatus("Aivanta AI is creating your business names...");

    try {
      const response = await fetch("/api/business-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          industry: industry.trim(),
          keyword: keyword.trim(),
          style,
        }),
      });

      const data: unknown = await response.json();

      if (!data || typeof data !== "object") {
        throw new Error("Aivanta returned an invalid response.");
      }

      const result = data as {
        success?: boolean;
        names?: unknown;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Could not generate business names."
        );
      }

      if (
        !Array.isArray(result.names) ||
        !result.names.every((name) => typeof name === "string")
      ) {
        throw new Error("Aivanta returned invalid name suggestions.");
      }

      setNames(result.names);
      setStatus(
        `Successfully generated ${result.names.length} AI business name ideas!`
      );
    } catch (error) {
      setNames([]);
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyName(name: string) {
    try {
      await navigator.clipboard.writeText(name);
      setStatus(`Copied "${name}"!`);
    } catch {
      setStatus("Copy unavailable. Please select the name manually.");
    }
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-block text-sm text-violet-400 hover:text-violet-300"
        >
          ← Back to Aivanta
        </Link>

        <div className="mb-10 mt-12">
          <div className="mb-5 text-5xl">💡</div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
            AIVANTA BUSINESS TOOLS
          </p>

          <h1 className="text-4xl font-bold sm:text-5xl">
            Business Name Generator
            <span className="text-violet-400">.</span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-400">
            Find inspiration for your next brand. Explore original AI-generated
            name ideas based on your industry, keywords and preferred style.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="mb-7 text-xl font-semibold">
              Describe your business
            </h2>

            <label className="mb-2 block text-sm text-gray-300">
              Business industry
            </label>

            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Clothing, technology, food"
              maxLength={150}
              className="mb-6 w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-violet-500"
            />

            <label className="mb-2 block text-sm text-gray-300">
              Keyword (optional)
            </label>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Future, luxury, nature"
              maxLength={100}
              className="mb-6 w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-violet-500"
            />

            <label className="mb-2 block text-sm text-gray-300">
              Naming style
            </label>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="mb-7 w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-4 text-white outline-none focus:border-violet-500"
            >
              <option>Modern</option>
              <option>Luxury</option>
              <option>Creative</option>
              <option>Simple</option>
              <option>Bold</option>
            </select>

            <button
              type="button"
              onClick={generateNames}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating names...
                </>
              ) : (
                <>✨ Generate name ideas</>
              )}
            </button>

            {status && (
              <p className="mt-4 text-sm text-violet-300" role="status">
                {status}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Name ideas</h2>

              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                AI powered
              </span>
            </div>

            {names.length > 0 ? (
              <div className="space-y-3">
                {names.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#151620] p-4"
                  >
                    <span className="min-w-0 break-words font-medium">
                      {name}
                    </span>

                    <button
                      type="button"
                      onClick={() => copyName(name)}
                      className="shrink-0 text-sm text-violet-400 hover:text-violet-300"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <div className="mb-5 text-5xl">
                  {loading ? "✨" : "💡"}
                </div>

                <h3 className="font-semibold">
                  {loading
                    ? "Creating your ideas..."
                    : "Your ideas will appear here"}
                </h3>

                <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
                  {loading
                    ? "Aivanta AI is thinking of creative names for your business."
                    : "Describe your business and generate your first AI name ideas."}
                </p>
              </div>
            )}

            <p className="mt-6 text-xs leading-5 text-gray-500">
              AI-generated suggestions are not guaranteed to be unique or
              legally available. Check domain availability, trademarks and
              business-name registration before choosing a name.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
