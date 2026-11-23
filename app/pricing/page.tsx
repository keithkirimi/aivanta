"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const plans = [
  {
    name: "Basic",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started with AI.",
    badge: "FREE FOREVER",
    color: "border-white/10",
    button: "Create free account",
    features: [
      "50 AI messages per month",
      "5 image generations per month",
      "5 MB maximum file size",
      "Access to all six AI tools",
      "AI Assistant",
      "AI Writer and CV Builder",
      "Coding and Study Assistant",
      "Business Name Generator",
      "Social Media Generator",
    ],
  },
  {
    name: "Pro",
    price: "$5",
    period: "per month after your free month",
    description: "More room to create, learn and get things done.",
    badge: "1 MONTH FREE",
    color: "border-violet-400/60",
    button: "Continue with PayPal",
    popular: true,
    features: [
      "1,000 AI messages per month",
      "100 image generations per month",
      "20 MB maximum file size",
      "Everything included in Basic",
      "Larger document uploads",
      "More room for coding projects",
      "Access to future Pro features",
      "One free month per eligible account",
    ],
  },
  {
    name: "Ultimate",
    price: "$15",
    period: "per month",
    description: "The complete Aivanta experience.",
    badge: "ULTIMATE EXPERIENCE",
    color: "border-blue-400/40",
    button: "Continue with PayPal",
    features: [
      "3,000 AI messages per month",
      "300 image generations per month",
      "50 MB maximum file size",
      "Everything included in Pro",
      "Largest document uploads",
      "More room for complex projects",
      "Access to future Ultimate features",
      "Premium account experience",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  async function startCheckout(plan: "pro" | "ultimate") {
    setCheckoutError("");

    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.push("/auth");
      return;
    }

    setLoadingPlan(plan);

    try {
      const response = await fetch("/api/paypal/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json()) as {
  error?: unknown;
  success?: unknown;
  approvalURL?: unknown;
};

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Unable to start checkout. Please try again."
        );
      }

      if (
        data.success !== true ||
        typeof data.approvalURL !== "string" ||
        !data.approvalURL.startsWith("https://")
      ) {
        throw new Error("PayPal did not return a valid checkout link.");
      }

      window.location.assign(data.approvalURL);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );

      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#08090e] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-xl font-black">
              A
            </div>

            <div>
              <p className="text-lg font-black tracking-wide">AIVANTA</p>
              <p className="text-[9px] font-semibold tracking-[0.25em] text-gray-500">
                AI WORKSPACE
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:border-violet-400/40 hover:text-white"
          >
            ← Back to workspace
          </Link>
        </header>

        <section className="mx-auto max-w-3xl pb-12 pt-20 text-center">
          <span className="inline-flex rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-bold tracking-wide text-violet-300">
            SIMPLE PLANS. POWERFUL POSSIBILITIES.
          </span>

          <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-6xl">
            Choose your
            <span className="block bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Aivanta experience.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
            From getting started to taking on bigger projects, find the plan
            that gives you the tools and room to do more.
          </p>
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border ${plan.color} ${
                plan.popular
                  ? "bg-gradient-to-b from-violet-500/[0.13] to-[#11121c] shadow-2xl shadow-violet-950/30"
                  : "bg-white/[0.025]"
              } p-6 transition duration-300 hover:-translate-y-1 sm:p-8`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-1.5 text-[10px] font-black tracking-wider text-white shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-5">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold tracking-wider text-gray-300">
                  {plan.badge}
                </span>
              </div>

              <h2 className="text-2xl font-black">{plan.name}</h2>

              <p className="mt-2 min-h-12 text-sm leading-6 text-gray-400">
                {plan.description}
              </p>

              <div className="mt-7">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">
                    {plan.price}
                  </span>

                  {plan.name === "Pro" ? (
                    <span className="inline-flex items-center rounded-full border border-green-400/60 bg-green-400/15 px-3 py-1.5 text-xs font-black tracking-wide text-green-300 shadow-[0_0_10px_rgba(74,222,128,0.45),0_0_24px_rgba(74,222,128,0.25)] animate-pulse">
                      1ST MONTH FREE
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {plan.period}
                    </span>
                  )}
                </div>

                {plan.name === "Pro" && (
                  <p className="mt-2 text-xs font-semibold text-violet-300">
                    Then $5/month. Automatically renews until cancelled.
                  </p>
                )}
              </div>

              <div className="my-7 h-px bg-white/10" />

              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                What's included
              </p>

              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.name === "Basic" ? (
                <Link
                  href="/auth"
                  className="mt-9 flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-bold transition hover:bg-white/10"
                >
                  {plan.button}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startCheckout(
                      plan.name === "Pro" ? "pro" : "ultimate"
                    )
                  }
                  disabled={loadingPlan !== null || isPending}
                  className={`mt-9 min-h-12 rounded-xl px-4 text-sm font-bold transition ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-950/30 hover:brightness-110"
                      : "border border-blue-400/30 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {loadingPlan === plan.name.toLowerCase()
                    ? "Connecting to PayPal..."
                    : isPending
                      ? "Checking account..."
                      : plan.button}
                </button>
              )}
            </article>
          ))}
        </section>

        {checkoutError && (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-center text-sm text-red-200"
          >
            {checkoutError}
          </div>
        )}

        <section className="mx-auto mt-20 max-w-5xl">
          <h2 className="text-center text-2xl font-black sm:text-3xl">
            Compare the plans
          </h2>

          <p className="mt-3 text-center text-sm text-gray-500">
            See what each membership is designed to offer.
          </p>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-white/[0.04]">
                <tr>
                  <th className="p-4 font-semibold text-gray-300">Feature</th>
                  <th className="p-4 text-center font-bold">Basic</th>
                  <th className="p-4 text-center font-bold text-violet-300">
                    Pro
                  </th>
                  <th className="p-4 text-center font-bold text-blue-300">
                    Ultimate
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.07]">
                {[
                  ["AI messages / month", "50", "1,000", "3,000"],
                  ["Image generations / month", "5", "100", "300"],
                  ["Maximum file size", "5 MB", "20 MB", "50 MB"],
                  ["AI tools", "All 6", "All 6", "All 6"],
                  ["Monthly price", "Free", "$5 after trial", "$15"],
                ].map((row) => (
                  <tr key={row[0]} className="text-gray-300">
                    <td className="p-4 font-medium">{row[0]}</td>
                    <td className="p-4 text-center">{row[1]}</td>
                    <td className="p-4 text-center">{row[2]}</td>
                    <td className="p-4 text-center">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-4xl rounded-3xl border border-violet-400/20 bg-gradient-to-r from-violet-500/[0.10] to-blue-500/[0.08] p-7 sm:p-10">
          <h2 className="text-2xl font-black">A little more about Pro</h2>

          <p className="mt-3 leading-7 text-gray-400">
            Eligible new Pro subscribers get their first month free. After the
            free month, the subscription automatically renews at $5 per month
            through PayPal unless cancelled before the renewal date. The trial
            is limited to one per eligible account.
          </p>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            You will be shown the billing terms before confirming a subscription.
            Cancellation and renewal details will also be available in account
            settings once subscriptions are launched.
          </p>
        </section>

        <section className="mx-auto max-w-3xl py-16 text-center">
          <h2 className="text-2xl font-black">Ready to get started?</h2>

          <p className="mt-3 text-sm text-gray-400">
            Create your free Aivanta account and explore the workspace.
          </p>

          <Link
            href="/auth"
            className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-8 py-3.5 text-sm font-bold shadow-lg shadow-violet-950/30 transition hover:brightness-110"
          >
            Get started for free
          </Link>
        </section>

        <footer className="border-t border-white/[0.08] py-7 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Aivanta. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
