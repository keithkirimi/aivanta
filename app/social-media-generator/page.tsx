
"use client";

import { useState } from "react";
import Link from "next/link";

type Platform = "Instagram" | "TikTok" | "Facebook" | "X";
type Tone =
  | "Friendly"
  | "Professional"
  | "Funny"
  | "Inspirational"
  | "Bold";

type SocialMediaResponse = {
  success?: boolean;
  error?: string;
  caption?: string;
  hashtags?: string[];
};

function getSocialMediaResponse(value: unknown): SocialMediaResponse {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  const record = value as Record<string, unknown>;

  return {
    success: record.success === true,
    error: typeof record.error === "string" ? record.error : undefined,
    caption: typeof record.caption === "string" ? record.caption : undefined,
    hashtags:
      Array.isArray(record.hashtags) &&
      record.hashtags.every((tag) => typeof tag === "string")
        ? record.hashtags
        : undefined,
  };
}

export default function SocialMediaGenerator() {
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [tone, setTone] = useState<Tone>("Friendly");
  const [topic, setTopic] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function generatePost() {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setStatus("Please enter a topic for your post.");
      return;
    }

    if (cleanTopic.length > 500) {
      setStatus("Please keep your topic under 500 characters.");
      return;
    }

    setLoading(true);
    setStatus("Aivanta AI is creating your post...");
    setCaption("");
    setHashtags([]);

    try {
      const response = await fetch("/api/social-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          tone,
          topic: cleanTopic,
        }),
      });

      const parsed: unknown = await response.json().catch(() => ({}));
      const data = getSocialMediaResponse(parsed);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not generate your post.");
      }

      if (
        typeof data.caption !== "string" ||
        !Array.isArray(data.hashtags)
      ) {
        throw new Error("Aivanta returned incomplete post content.");
      }

      setCaption(data.caption);
      setHashtags(data.hashtags);
      setStatus("Your AI-generated post is ready!");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyPost() {
    const fullPost = `${caption}\n\n${hashtags.join(" ")}`;

    try {
      await navigator.clipboard.writeText(fullPost);
      setStatus("Post copied to clipboard!");
    } catch {
      setStatus("Copy unavailable. Please select and copy the post manually.");
    }
  }

  function resetForm() {
    setTopic("");
    setCaption("");
    setHashtags([]);
    setStatus("");
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

        <div className="mb-12 mt-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-3xl">
            📱
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
            Aivanta Creator Tools
          </p>

          <h1 className="text-4xl font-black sm:text-5xl">
            Social Media Generator
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Create engaging captions and relevant hashtags using Aivanta AI.
          </p>

          <span className="mt-5 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300">
            ✨ AI Powered
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <h2 className="mb-7 text-xl font-bold">Create your post</h2>

            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-300">
                Choose a platform
              </label>

              <div className="grid grid-cols-2 gap-3">
                {(
                  ["Instagram", "TikTok", "Facebook", "X"] as Platform[]
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlatform(item)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      platform === item
                        ? "border-violet-500 bg-violet-500/15 text-violet-300"
                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.07]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="topic"
                className="mb-3 block text-sm font-medium text-gray-300"
              >
                What is your post about?
              </label>

              <textarea
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Example: My new clothing brand, a football match, a new product..."
                className="w-full resize-y rounded-xl border border-white/10 bg-[#08090d] px-4 py-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-500"
              />

              <p className="mt-2 text-right text-xs text-gray-500">
                {topic.length}/500
              </p>
            </div>

            <div className="mb-8">
              <label
                htmlFor="tone"
                className="mb-3 block text-sm font-medium text-gray-300"
              >
                Choose a tone
              </label>

              <select
                id="tone"
                value={tone}
                onChange={(event) => setTone(event.target.value as Tone)}
                className="w-full rounded-xl border border-white/10 bg-[#08090d] px-4 py-4 text-sm text-white outline-none focus:border-violet-500"
              >
                <option>Friendly</option>
                <option>Professional</option>
                <option>Funny</option>
                <option>Inspirational</option>
                <option>Bold</option>
              </select>
            </div>

            <button
              type="button"
              onClick={generatePost}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "⏳ Generating with AI..." : "✨ Generate post"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="mt-3 w-full rounded-xl border border-white/10 px-6 py-3 text-sm text-gray-400 transition hover:bg-white/[0.05] disabled:opacity-50"
            >
              Clear form
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Your generated post</h2>

              <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                {platform}
              </span>
            </div>

            {caption ? (
              <div className="rounded-xl border border-white/10 bg-[#08090d] p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Caption
                </p>

                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-200">
                  {caption}
                </p>

                <div className="my-6 h-px bg-white/10" />

                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Hashtags
                </p>

                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={copyPost}
                  className="mt-7 w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 font-semibold text-violet-300 transition hover:bg-violet-500/20"
                >
                  Copy caption and hashtags
                </button>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#08090d] px-6 text-center">
                <span className="mb-5 text-5xl">
                  {loading ? "✨" : "✍️"}
                </span>

                <h3 className="text-lg font-semibold text-gray-300">
                  {loading
                    ? "Creating your post..."
                    : "Your post will appear here"}
                </h3>

                <p className="mt-3 max-w-xs text-sm leading-6 text-gray-500">
                  {loading
                    ? "Aivanta AI is writing a caption and finding relevant hashtags."
                    : "Enter a topic, choose your preferences and generate your first post."}
                </p>
              </div>
            )}

            {status && (
              <p
                aria-live="polite"
                className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-gray-300"
              >
                {status}
              </p>
            )}
          </section>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-6 text-gray-600">
          Powered by Aivanta AI. Review generated content for accuracy and suitability before publishing.
        </p>
      </div>
    </main>
  );
}
