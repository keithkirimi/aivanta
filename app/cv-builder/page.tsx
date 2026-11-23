
"use client";

import { useState } from "react";
import Link from "next/link";

type AIAction = "summary" | "experience" | "skills" | "review";

type AIResponse = {
  error?: string;
  result?: string;
};

function getAIResponse(value: unknown): AIResponse {
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

const actions: {
  id: AIAction;
  label: string;
  description: string;
}[] = [
  {
    id: "summary",
    label: "Improve Summary",
    description: "Make your professional introduction clearer and stronger.",
  },
  {
    id: "experience",
    label: "Improve Experience",
    description: "Rewrite your work experience professionally.",
  },
  {
    id: "skills",
    label: "Organize Skills",
    description: "Improve the presentation of your listed skills.",
  },
  {
    id: "review",
    label: "Review My CV",
    description: "Get feedback and suggestions for your CV.",
  },
];

export default function CVBuilder() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");

  const [loading, setLoading] = useState<AIAction | null>(null);
  const [result, setResult] = useState("");
  const [resultAction, setResultAction] = useState<AIAction | null>(null);
  const [error, setError] = useState("");

  const skillList = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  async function runAI(action: AIAction) {
    setLoading(action);
    setError("");
    setResult("");
    setResultAction(null);

    try {
      const response = await fetch("/api/cv-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          name,
          title,
          summary,
          experience,
          education,
          skills,
        }),
      });

      const parsed: unknown = await response.json().catch(() => ({}));
      const data = getAIResponse(parsed);

      if (!response.ok) {
        throw new Error(data.error || "The AI request failed.");
      }

      if (typeof data.result !== "string" || !data.result.trim()) {
        throw new Error("Aivanta returned an empty result. Please try again.");
      }

      setResult(data.result);
      setResultAction(action);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(null);
    }
  }

  function applyResult() {
    if (!result || !resultAction) return;

    if (resultAction === "summary") {
      setSummary(result);
    } else if (resultAction === "experience") {
      setExperience(result);
    } else if (resultAction === "skills") {
      setSkills(result);
    }

    setResult("");
    setResultAction(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-block text-sm text-violet-400 hover:text-violet-300"
        >
          ← Back to Aivanta
        </Link>

        <div className="mb-10 mt-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-400">
            AIVANTA CAREER TOOLS
          </p>

          <h1 className="text-4xl font-bold sm:text-5xl">
            CV Builder<span className="text-violet-400">.</span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-gray-400">
            Create a professional CV, improve your writing with AI and watch
            your document take shape instantly.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* EDITOR */}
          <section className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 print:hidden">
            <div>
              <h2 className="text-xl font-semibold">Your information</h2>
              <p className="mt-2 text-sm text-gray-500">
                Fill in the sections you want included in your CV.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Professional title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Web Developer"
                className="w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Professional summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a short introduction about yourself..."
                rows={4}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => runAI("summary")}
                disabled={loading !== null}
                className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "summary" ? "Improving..." : "✨ Improve Summary"}
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Work experience
              </label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder={"Job title — Company — Dates\nDescribe your responsibilities and achievements."}
                rows={5}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => runAI("experience")}
                disabled={loading !== null}
                className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "experience" ? "Improving..." : "✨ Improve Experience"}
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Education
              </label>
              <textarea
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder={"School or institution — Dates\nQualification or course"}
                rows={4}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Skills
              </label>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="JavaScript, HTML, CSS, Communication..."
                rows={3}
                className="w-full resize-y rounded-xl border border-white/10 bg-[#151620] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                Separate each skill with a comma.
              </p>
              <button
                type="button"
                onClick={() => runAI("skills")}
                disabled={loading !== null}
                className="mt-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "skills" ? "Organizing..." : "✨ Organize Skills"}
              </button>
            </div>

            <div className="border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => runAI("review")}
                disabled={loading !== null}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "review" ? "Reviewing your CV..." : "✦ Review My CV with AI"}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Get feedback on your CV and discover what you could improve.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.07] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">Aivanta AI Result</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setResult("");
                      setResultAction(null);
                    }}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-gray-200">
                  {result}
                </div>

                {resultAction && resultAction !== "review" && (
                  <button
                    type="button"
                    onClick={applyResult}
                    className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    Apply to my CV
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="mt-2 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"
                >
                  Copy AI result
                </button>
              </div>
            )}
          </section>

          {/* LIVE CV PREVIEW */}
          <section className="lg:sticky lg:top-28">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div>
                <h2 className="text-xl font-semibold">Live CV preview</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Updates as you type
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Print / Save as PDF ↓
              </button>
            </div>

            <article className="min-h-[750px] rounded-xl bg-white p-7 text-gray-800 shadow-2xl sm:p-10 print:min-h-0 print:rounded-none print:p-8 print:shadow-none">
              <div className="border-b-2 border-violet-600 pb-6">
                <h2 className="break-words text-3xl font-bold text-gray-900">
                  {name || "Your Name"}
                </h2>

                <p className="mt-2 text-lg font-medium text-violet-700">
                  {title || "Your Professional Title"}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                  {email && <span>{email}</span>}
                  {phone && <span>{phone}</span>}
                  {location && <span>{location}</span>}
                </div>
              </div>

              <div className="mt-7 space-y-7">
                {summary && (
                  <section>
                    <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-widest text-violet-700">
                      Professional Summary
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {summary}
                    </p>
                  </section>
                )}

                {experience && (
                  <section>
                    <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-widest text-violet-700">
                      Work Experience
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {experience}
                    </p>
                  </section>
                )}

                {education && (
                  <section>
                    <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-widest text-violet-700">
                      Education
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {education}
                    </p>
                  </section>
                )}

                {skillList.length > 0 && (
                  <section>
                    <h3 className="mb-3 border-b border-gray-200 pb-2 text-sm font-bold uppercase tracking-widest text-violet-700">
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skillList.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="rounded-md bg-violet-50 px-3 py-2 text-xs font-medium text-violet-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {!summary &&
                  !experience &&
                  !education &&
                  skillList.length === 0 && (
                    <p className="py-16 text-center text-sm text-gray-400">
                      Your CV sections will appear here as you fill in the form.
                    </p>
                  )}
              </div>

              <div className="mt-12 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
                Created with Aivanta CV Builder
              </div>
            </article>

            <p className="mt-4 text-center text-xs text-gray-500 print:hidden">
              Your entries stay in this page session. This page does not save
              them to an account.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
