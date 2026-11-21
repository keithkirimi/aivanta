
"use client";

import { useState } from "react";
import Link from "next/link";

export default function BusinessNameGenerator() {
  const [industry, setIndustry] = useState("");
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState("Modern");
  const [names, setNames] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  function generateNames() {
    if (!industry.trim()) {
      setNames([]);
      setStatus("Please enter your business industry.");
      return;
    }

    const cleanWord = (keyword.trim() || industry.trim())
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .split(/\s+/)[0];

    if (!cleanWord) {
      setNames([]);
      setStatus("Please enter a valid keyword or industry.");
      return;
    }

    const prefixes: Record<string, string[]> = {
      Modern: ["Nova", "Nexa", "Vanta", "Nexora", "Zentra"],
      Luxury: ["Luxe", "Velora", "Aurelia", "Prestige", "Royale"],
      Creative: ["Pixel", "Dream", "Spark", "Wonder", "Imagine"],
      Simple: ["Pure", "Bright", "Ever", "True", "Clear"],
      Bold: ["Titan", "Apex", "Prime", "Vertex", "Maverick"],
    };

    const suffixes = [
      "Labs",
      "Studio",
      "Works",
      "Hub",
      "Co",
      "House",
      "Group",
      "Collective",
      "Solutions",
      "Edge",
    ];

    const selected = prefixes[style] || prefixes.Modern;

    const generated = [
      `${selected[0]} ${cleanWord}`,
      `${cleanWord} ${suffixes[0]}`,
      `${selected[1]} ${suffixes[1]}`,
      `${cleanWord} ${suffixes[2]}`,
      `${selected[2]} ${suffixes[3]}`,
      `${cleanWord} ${suffixes[4]}`,
      `${selected[3]} ${cleanWord}`,
      `${cleanWord} ${suffixes[5]}`,
      `${selected[4]} ${suffixes[6]}`,
      `${cleanWord} ${suffixes[7]}`,
    ];

    setNames([...new Set(generated)]);
    setStatus("Here are your demo name ideas!");
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
            Find inspiration for your next brand. Explore name ideas based on
            your industry, keywords and preferred style.
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
              className="mb-6 w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-4 text-white outline-none placeholder:text-gray-600 focus:border-violet-500"
            />

            <label className="mb-2 block text-sm text-gray-300">
              Keyword (optional)
            </label>

            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Future, luxury, nature"
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
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-semibold transition hover:opacity-90"
            >
              ✨ Generate name ideas
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

              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                Demo mode
              </span>
            </div>

            {names.length > 0 ? (
              <div className="space-y-3">
                {names.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#151620] p-4"
                  >
                    <span className="font-medium">{name}</span>

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
                <div className="mb-5 text-5xl">✨</div>

                <h3 className="font-semibold">
                  Your ideas will appear here
                </h3>

                <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
                  Describe your business and generate your first name ideas.
                </p>
              </div>
            )}

            <p className="mt-6 text-xs leading-5 text-gray-500">
              Demo-generated suggestions only. Check domain availability and
              business-name registration before choosing a name.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
