
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanEmail || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (mode === "signup") {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
        setError(
          "Username must be 3–20 characters using letters, numbers, or underscores."
        );
        return;
      }

      if (password.length < 8) {
        setError("Your password must contain at least 8 characters.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          name: displayName.trim() || cleanUsername,
          email: cleanEmail,
          password,
          username: cleanUsername,
          displayUsername: cleanUsername,
        });

        if (result.error) {
          throw new Error(result.error.message || "Account creation failed.");
        }

        setMessage("Your account was created successfully. Welcome to Aivanta!");

        router.push("/");
        router.refresh();
      } else {
        const result = await authClient.signIn.email({
          email: cleanEmail,
          password,
        });

        if (result.error) {
          throw new Error(result.error.message || "Login failed.");
        }

        router.push("/");
        router.refresh();
      }
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

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08090d] px-5 py-12 text-white">
      <div className="pointer-events-none absolute left-[-150px] top-[-100px] h-[450px] w-[450px] rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-150px] right-[-100px] h-[450px] w-[450px] rounded-full bg-blue-600/15 blur-[120px]" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#10111a]/90 shadow-2xl shadow-black/40 lg:grid-cols-2">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-950 via-[#17132d] to-[#0c1930] p-12 lg:flex">
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-violet-300/10" />
          <div className="absolute -right-12 top-32 h-48 w-48 rounded-full border border-violet-300/10" />
          <div className="absolute bottom-20 left-10 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

          <Link href="/" className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-blue-500 text-xl font-black">
              A
            </div>
            <span className="text-2xl font-black">
              aivanta<span className="text-violet-400">.</span>
            </span>
          </Link>

          <div className="relative my-16">
            <span className="text-sm font-bold tracking-[0.25em] text-violet-300">
              YOUR IDEAS. YOUR WORKSPACE.
            </span>

            <h1 className="mt-6 text-5xl font-black leading-tight">
              Make room
              <br />
              for bigger
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-blue-300 bg-clip-text text-transparent">
                possibilities.
              </span>
            </h1>

            <p className="mt-7 max-w-sm leading-7 text-gray-300">
              One workspace for writing, coding, learning, creating, and
              bringing your ideas to life.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3">
              {[
                ["✍️", "Create"],
                ["💻", "Build"],
                ["🎓", "Learn"],
                ["🚀", "Explore"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4"
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-gray-400">
            © 2026 Aivanta AI. Your ideas start here.
          </p>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 font-bold">
                A
              </span>
              <span className="text-xl font-black">
                aivanta<span className="text-violet-400">.</span>
              </span>
            </Link>

            <Link
              href="/"
              className="ml-auto text-sm text-gray-400 transition hover:text-white"
            >
              ← Back home
            </Link>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-violet-400">
              WELCOME TO AIVANTA
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              {mode === "signup"
                ? "Create your account and start exploring your workspace."
                : "Sign in to continue to your Aivanta workspace."}
            </p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className={`rounded-lg py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
              className={`rounded-lg py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-violet-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-semibold text-gray-200">
              Email and password
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Google, Apple, Microsoft sign-in and password recovery will be
              available after their setup is complete.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Display name
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={60}
                    autoComplete="name"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-300">
                    Username
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    maxLength={20}
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-violet-500"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    3–20 letters, numbers, or underscores.
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-violet-500"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-300">
                  Password
                </label>
                {mode === "login" && (
                  <span className="text-xs text-gray-500">
                    Reset setup pending
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-gray-600 focus:border-violet-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-violet-300"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm leading-6 text-red-300"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-sm leading-6 text-violet-200"
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create my account →"
                  : "Log in to Aivanta →"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-6 text-gray-500">
            By continuing, you agree to use Aivanta responsibly and keep your
            account credentials secure.
          </p>
        </section>
      </div>
    </main>
  );
}
