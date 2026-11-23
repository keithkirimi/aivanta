
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PricingSuccessPage() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus("waiting");
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#080b14] px-6 py-12 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-4xl">
          {status === "checking" ? "⏳" : "✓"}
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
          Aivanta
        </p>

        <h1 className="mb-4 text-3xl font-bold">
          Thank you for subscribing!
        </h1>

        <p className="mb-6 leading-7 text-gray-300">
          PayPal has returned you to Aivanta. Your subscription confirmation
          is being checked. This may take a little time.
        </p>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm leading-6 text-gray-400">
            {status === "checking"
              ? "Checking subscription status..."
              : "Your account will receive subscription access after our server verifies the PayPal confirmation."}
          </p>
        </div>

        <p className="mb-8 text-sm text-gray-400">
          If your plan does not appear immediately, please wait a moment and
          check your account again. Do not make another payment.
        </p>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Return to Aivanta
        </Link>

        <p className="mt-6 text-xs text-gray-500">
          Subscription access is controlled by verified payment notifications.
        </p>
      </div>
    </main>
  );
}
