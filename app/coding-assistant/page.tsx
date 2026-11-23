
"use client";

import { useState } from "react";
import Link from "next/link";

type Language = "Python" | "JavaScript" | "HTML" | "CSS";
type Action = "Explain Code" | "Find Errors" | "Improve Code";

const examples: Record<Language, string> = {
  Python: `name = "Aivanta"

def welcome():
    print("Welcome to " + name)

welcome()`,
  JavaScript: `const name = "Aivanta";

function welcome() {
  console.log("Welcome to " + name);
}

welcome();`,
  HTML: `<h1>Welcome to Aivanta</h1>
<p>Your creative workspace.</p>
<button>Get Started</button>`,
  CSS: `body {
  background: #08090d;
  color: white;
  font-family: Arial, sans-serif;
}

button {
  padding: 12px 20px;
  border-radius: 10px;
}`,
};

export default function CodingAssistant() {
  const [language, setLanguage] = useState<Language>("JavaScript");
  const [code, setCode] = useState(examples.JavaScript);
  const [result, setResult] = useState("");
  const [activeAction, setActiveAction] = useState<Action | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    setCode(examples[nextLanguage]);
    setResult("");
    setActiveAction("");
    setError("");
    setStatus("");
  }

  async function analyzeCode(action: Action) {
    if (!code.trim()) {
      setError("Please enter some code before using this tool.");
      setResult("");
      return;
    }

    setLoading(true);
    setActiveAction(action);
    setResult("");
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/coding-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          action,
          code,
        }),
      });

      const parsed: unknown = await response.json().catch(() => ({}));

      const data: Record<string, unknown> =
        parsed !== null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : {};

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The AI request failed."
        );
      }

      if (
        typeof data.result !== "string" ||
        !data.result.trim()
      ) {
        throw new Error(
          "Aivanta returned an empty result. Please try again."
        );
      }

      setResult(data.result);
      setStatus("AI analysis complete.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function applyImprovedCode() {
    if (activeAction !== "Improve Code" || !result) return;

    const match = result.match(/```(?:[a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)```/);

    if (!match?.[1]?.trim()) {
      setError(
        "No complete code block was found. Copy the suggested code manually."
      );
      return;
    }

    setCode(match[1].trim());
    setResult("");
    setError("");
    setStatus("Improved code applied to the editor.");
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("Code copied!");
    } catch {
      setStatus("Copy unavailable. Select the code and copy it manually.");
    }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      setStatus("Result copied!");
    } catch {
      setStatus("Copy unavailable. Select the result manually.");
    }
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

        <div className="mb-10 mt-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-3xl">
            💻
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
            Aivanta Developer Tools
          </p>

          <h1 className="text-4xl font-black sm:text-5xl">
            Coding Assistant
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Understand code, find possible bugs and improve your programming
            with Aivanta AI.
          </p>

          <span className="mt-5 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-medium text-violet-300">
            ✦ AI Powered
          </span>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101116]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-semibold">Code Editor</p>
                <p className="mt-1 text-xs text-gray-500">
                  Edit your code below
                </p>
              </div>

              <select
                value={language}
                onChange={(event) =>
                  changeLanguage(event.target.value as Language)
                }
                className="rounded-lg border border-white/10 bg-[#08090d] px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
              >
                <option>JavaScript</option>
                <option>Python</option>
                <option>HTML</option>
                <option>CSS</option>
              </select>
            </div>

            <div className="flex items-center gap-2 border-b border-white/10 bg-[#0b0c11] px-5 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-500">
                main.{language === "JavaScript" ? "js" : language.toLowerCase()}
              </span>
            </div>

            <textarea
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setResult("");
                setError("");
                setStatus("");
              }}
              spellCheck={false}
              aria-label="Code editor"
              className="min-h-[420px] w-full resize-y bg-[#0b0c11] p-5 font-mono text-sm leading-7 text-green-300 outline-none"
              placeholder="Write or paste your code here..."
            />

            <div className="flex flex-wrap gap-3 border-t border-white/10 p-5">
              <button
                type="button"
                onClick={copyCode}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.05]"
              >
                Copy Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode(examples[language]);
                  setResult("");
                  setError("");
                  setStatus("Example loaded.");
                }}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.05]"
              >
                Load Example
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <h2 className="mb-5 text-xl font-bold">AI Code Tools</h2>

              <div className="space-y-3">
                {(
                  [
                    ["Explain Code", "Understand what your code does", "📖"],
                    ["Find Errors", "Find bugs and possible issues", "🔍"],
                    ["Improve Code", "Get an improved version of your code", "✨"],
                  ] as [Action, string, string][]
                ).map(([action, description, icon]) => (
                  <button
                    key={action}
                    type="button"
                    disabled={loading}
                    onClick={() => analyzeCode(action)}
                    className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      activeAction === action
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-[#0b0c11] hover:border-violet-500/30"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="mt-3 block font-semibold">
                      {loading && activeAction === action
                        ? "Analyzing..."
                        : action}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">AI Results</h2>

                {result && (
                  <button
                    type="button"
                    onClick={copyResult}
                    className="text-xs font-semibold text-violet-400 hover:text-violet-300"
                  >
                    Copy result
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0b0c11] px-5 text-center">
                  <span className="mb-4 text-3xl">✦</span>
                  <p className="font-semibold text-gray-200">
                    Aivanta is analyzing your code...
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    This may take a little while.
                  </p>
                </div>
              ) : result ? (
                <div className="rounded-xl border border-white/10 bg-[#0b0c11] p-4">
                  <pre className="max-h-[450px] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-7 text-gray-300">
                    {result}
                  </pre>

                  {activeAction === "Improve Code" && (
                    <button
                      type="button"
                      onClick={applyImprovedCode}
                      className="mt-5 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                    >
                      Apply Improved Code to Editor
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0b0c11] px-5 text-center">
                  <span className="mb-4 text-4xl">🧠</span>
                  <p className="font-semibold text-gray-300">
                    Ready to review your code
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose an AI tool above to get started.
                  </p>
                </div>
              )}

              {error && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              {status && (
                <p className="mt-4 text-center text-xs text-gray-400">
                  {status}
                </p>
              )}
            </div>
          </section>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-6 text-gray-600">
          AI suggestions can contain mistakes. Review important changes and
          test your code in its intended environment.
        </p>
      </div>
    </main>
  );
}
