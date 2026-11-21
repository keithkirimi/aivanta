
"use client";

import { useState } from "react";

export default function AivantaAssistant() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [expanded, setExpanded] = useState(false);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    const text = message.trim();
    if (!text) return;

    setReply(
      `Aivanta received: "${text}"\n\nYou're using Aivanta Demo Mode. The chat interface is working, but a real AI model is not connected yet.`
    );

    setMessage("");
    setExpanded(true);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090d]/95 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 font-bold text-white">
              A
            </span>
            <span className="text-xl font-bold text-white">
              aivanta<span className="text-violet-400">.</span>
            </span>
          </a>

          <form onSubmit={sendMessage} className="flex min-w-0 flex-1 gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask Aivanta anything..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-500"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              Send ↑
            </button>
          </form>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left text-xs text-violet-300 sm:text-center"
          >
            {expanded ? "Hide chat" : "Demo assistant"}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.07] p-4">
            <p className="mb-2 text-xs font-semibold text-violet-300">
              AIVANTA ASSISTANT · DEMO MODE
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
              {reply || "Hello! This is the Aivanta chat demo. Send a message to test the interface."}
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
