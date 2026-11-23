"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import { authClient } from "@/lib/auth-client";

type Chat = {
  id: string;
  title: string;
  updatedAt: number;
};

const HISTORY_KEY = "aivanta-chat-history-v1";
const ACTIVE_KEY = "aivanta-active-chat-v1";

const tools = [
  { name: "AI Writer", href: "/writer", icon: "✍️" },
  { name: "Business Names", href: "/business-name-generator", icon: "💡" },
  { name: "CV Builder", href: "/cv-builder", icon: "📄" },
  { name: "Social Media", href: "/social-media-generator", icon: "📱" },
  { name: "Coding Assistant", href: "/coding-assistant", icon: "💻" },
  { name: "Study Assistant", href: "/study-assistant", icon: "🎓" },
];

export default function AivantaAssistant({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [open, setOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState("");

  const isAuthPage = pathname.startsWith("/auth");
  const user = session?.user;

  function refreshHistory() {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (Array.isArray(parsed)) {
        setChats(
          parsed.sort(
            (a: Chat, b: Chat) => b.updatedAt - a.updatedAt
          )
        );
      }

      setActiveChat(localStorage.getItem(ACTIVE_KEY) || "");
    } catch {
      setChats([]);
    }
  }

  useEffect(() => {
    refreshHistory();

    const update = () => refreshHistory();

    window.addEventListener("aivanta:history-updated", update);
    window.addEventListener("storage", update);

    return () => {
      window.removeEventListener("aivanta:history-updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  function newChat() {
    const chat: Chat = {
      id: crypto.randomUUID(),
      title: "New conversation",
      updatedAt: Date.now(),
    };

    const updated = [chat, ...chats];

    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_KEY, chat.id);

    setChats(updated);
    setActiveChat(chat.id);

    router.push("/");

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("aivanta:new-chat", {
          detail: chat.id,
        })
      );
    }, 100);
  }

  function selectChat(chat: Chat) {
    localStorage.setItem(ACTIVE_KEY, chat.id);
    setActiveChat(chat.id);

    router.push("/");

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("aivanta:select-chat", {
          detail: chat.id,
        })
      );
    }, 100);
  }

  function clearHistory() {
    if (
      !window.confirm(
        "Delete all saved conversations from this browser?"
      )
    ) {
      return;
    }

    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem("aivanta-messages-v1");
    localStorage.removeItem(ACTIVE_KEY);

    const id = crypto.randomUUID();

    const updated = [
      {
        id,
        title: "New conversation",
        updatedAt: Date.now(),
      },
    ];

    localStorage.setItem(ACTIVE_KEY, id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    setChats(updated);
    setActiveChat(id);

    router.push("/");

    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("aivanta:new-chat", {
          detail: id,
        })
      );
    }, 100);
  }

  // The homepage has its own header, so its account menu is positioned there.
  if (isAuthPage || pathname === "/") {
    return <>{children}</>;
  }

  const accountName =
    user?.name || user?.email?.split("@")[0] || "Aivanta account";

  return (
    <div className="min-h-screen bg-[#080910] text-white">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#0c0d17] transition-all duration-300 ${
          open ? "w-[270px]" : "w-[76px]"
        }`}
      >
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.07] px-5">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/aivanta-logo.svg"
              alt="Aivanta logo"
              width={42}
              height={42}
              priority
            />
            {open && (
              <span className="text-xl font-black tracking-tight">
                Aivanta<span className="text-fuchsia-400">.</span>
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
            className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            {open ? "‹" : "›"}
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={newChat}
            title="New chat"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-fuchsia-600 px-3 py-3.5 text-sm font-bold shadow-lg shadow-violet-950/30 transition hover:brightness-110"
          >
            <span className="text-xl">＋</span>
            {open && "New chat"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {open ? (
            <>
              <p className="mb-3 mt-5 px-3 text-[10px] font-bold tracking-[.2em] text-gray-500">
                WORKSPACE
              </p>

              <Link
                href="/"
                className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-300 hover:bg-white/[0.06]"
              >
                <span>⌂</span> Home
              </Link>

              <p className="mb-3 mt-7 px-3 text-[10px] font-bold tracking-[.2em] text-gray-500">
                YOUR CHATS
              </p>

              {chats.length === 0 ? (
                <p className="px-3 py-3 text-xs leading-5 text-gray-600">
                  Start a conversation and it will appear here.
                </p>
              ) : (
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${
                        activeChat === chat.id
                          ? "bg-violet-500/15 text-violet-200"
                          : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span>◷</span>
                      <span className="min-w-0 flex-1 truncate">
                        {chat.title}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={clearHistory}
                    className="mt-3 px-3 py-2 text-xs text-gray-600 hover:text-red-300"
                  >
                    Clear chat history
                  </button>
                </div>
              )}

              <p className="mb-3 mt-8 px-3 text-[10px] font-bold tracking-[.2em] text-gray-500">
                AI TOOLS
              </p>

              <div className="space-y-1">
                {tools.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                      pathname === tool.href
                        ? "bg-violet-500/15 text-violet-200"
                        : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span>{tool.icon}</span>
                    {tool.name}
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-5 space-y-3">
              {tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  title={tool.name}
                  className="flex h-11 items-center justify-center rounded-xl text-xl text-gray-400 hover:bg-white/10 hover:text-white"
                >
                  {tool.icon}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.07] p-3">
          <Link
            href="/settings"
            title="Settings"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span>⚙</span>
            {open && "Settings"}
          </Link>

          {!isPending && (
            <Link
              href={user ? "/settings" : "/auth"}
              title={user ? "Account settings" : "Sign in or create account"}
              className="mt-1 flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 hover:bg-white/[0.06] hover:text-white"
            >
              <span>{user ? "👤" : "↪"}</span>
              {open && (
                <span className="min-w-0 truncate">
                  {user ? accountName : "Sign in / Sign up"}
                </span>
              )}
            </Link>
          )}

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 font-bold">
              A
            </div>
            {open && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">Aivanta</p>
                <p className="truncate text-[10px] text-gray-500">
                  {user ? "Signed in" : "AI workspace"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          open ? "ml-[270px]" : "ml-[76px]"
        }`}
      >
        <header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-white/[0.06] bg-[#080910]/90 px-6 backdrop-blur-xl">
          <div className="text-sm text-gray-400">
            {pathname === "/settings"
              ? "Settings"
              : tools.find((tool) => tool.href === pathname)?.name ||
                "Aivanta Workspace"}
          </div>

          <AccountMenu />
        </header>

        {children}
      </div>
    </div>
  );
}
