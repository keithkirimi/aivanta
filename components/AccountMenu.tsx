"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function AccountMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);

  const user = session?.user;
  const name = user?.name || user?.email?.split("@")[0] || "Account";
  const initials = name.slice(0, 1).toUpperCase();

  async function signOut() {
    try {
      await authClient.signOut();
      setOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Could not sign out:", error);
    }
  }

  if (isPending) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className="flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
        >
          Pricing
        </Link>
        <Link
          href="/auth"
          className="flex h-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-blue-500/20 font-bold text-violet-200"
      >
        {user.image ? (
          <img
            src={user.image}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#151622] p-3 shadow-2xl shadow-black/50">
            <div className="border-b border-white/[0.08] px-3 pb-3">
              <p className="truncate text-sm font-bold text-white">{name}</p>
              <p className="mt-1 break-all text-xs text-gray-400">
                {user.email}
              </p>
            </div>

            <div className="space-y-1 pt-2">
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm text-violet-300 hover:bg-violet-500/10 hover:text-violet-200"
              >
                ✦ Pricing & Plans
              </Link>

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white"
              >
                Account settings
              </Link>

              <button
                type="button"
                onClick={signOut}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-red-500/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
