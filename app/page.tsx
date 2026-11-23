
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import ImageGenerator from "@/components/ImageGenerator";
import AccountMenu from "@/components/AccountMenu";
import { authClient } from "@/lib/auth-client";

type Attachment = {
  id: string;
  name: string;
  size: number;
  imageId?: string;
  dataUrl?: string;
  textContent?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: Attachment[];
  image?: string;
  imageId?: string;
};

type Chat = {
  id: string;
  title: string;
  updatedAt: number;
};

const HISTORY_KEY = "aivanta-chat-history-v1";
const MESSAGE_KEY = "aivanta-messages-v1";
const ACTIVE_KEY = "aivanta-active-chat-v1";
const IMAGE_DB = "aivanta-image-storage-v1";

const tools = [
  { name: "AI Writer", href: "/writer", icon: "✍️" },
  { name: "Business Names", href: "/business-name-generator", icon: "💡" },
  { name: "CV Builder", href: "/cv-builder", icon: "📄" },
  { name: "Social Media", href: "/social-media-generator", icon: "📱" },
  { name: "Coding Assistant", href: "/coding-assistant", icon: "💻" },
  { name: "Study Assistant", href: "/study-assistant", icon: "🎓" },
];

function makeId() {
  return crypto.randomUUID();
}

function getResponseRecord(value: unknown): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return {};
}

function openImageDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveImage(id: string, dataUrl: string) {
  const db = await openImageDB();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("images", "readwrite");
    transaction.objectStore("images").put({ id, dataUrl });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

  db.close();
}

async function readImage(id: string): Promise<string | undefined> {
  const db = await openImageDB();

  const result = await new Promise<string | undefined>((resolve, reject) => {
    const transaction = db.transaction("images", "readonly");
    const request = transaction.objectStore("images").get(id);

    request.onsuccess = () => resolve(request.result?.dataUrl);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return result;
}

async function deleteChatImages(messages: Message[]) {
  const ids = messages
    .flatMap((message) => [
      message.imageId,
      ...message.attachments.map((attachment) => attachment.imageId),
    ])
    .filter((id): id is string => Boolean(id));

  if (!ids.length) return;

  const db = await openImageDB();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");

    ids.forEach((id) => store.delete(id));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

  db.close();
}

async function hydrateMessages(messages: Message[]): Promise<Message[]> {
  return Promise.all(
    messages.map(async (message) => {
      const image = message.imageId
        ? await readImage(message.imageId).catch(() => undefined)
        : undefined;

      const attachments = await Promise.all(
        message.attachments.map(async (attachment) => ({
          ...attachment,
          dataUrl: attachment.imageId
            ? await readImage(attachment.imageId).catch(() => undefined)
            : undefined,
        }))
      );

      return {
        ...message,
        image: image || message.image,
        attachments,
      };
    })
  );
}

function getMessages(id: string): Message[] {
  try {
    const all = JSON.parse(localStorage.getItem(MESSAGE_KEY) || "{}");
    return Array.isArray(all[id]) ? all[id] : [];
  } catch {
    return [];
  }
}

function storeMessages(id: string, messages: Message[]) {
  try {
    const all = JSON.parse(localStorage.getItem(MESSAGE_KEY) || "{}");

    all[id] = messages.map((message) => ({
      ...message,
      image: undefined,
      attachments: message.attachments.map(
        ({ dataUrl, ...attachment }) => attachment
      ),
    }));

    localStorage.setItem(MESSAGE_KEY, JSON.stringify(all));
  } catch {
    console.warn("Could not save conversation.");
  }
}

function getHistory(): Chat[] {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function isImageRequest(text: string) {
  const request = text.trim();

  return (
    /^(?:please\s+)?(?:create|generate|make|draw|design|produce|paint)\b[\s\S]{0,250}\b(?:image|picture|artwork|illustration|photo|wallpaper|thumbnail)\b/i.test(
      request
    ) ||
    /^(?:please\s+)?(?:draw|paint)\s+(?:me\s+)?(?:a|an)\b/i.test(request) ||
    /^\/image\b/i.test(request)
  );
}

function isImageEditRequest(text: string) {
  return (
    /^(?:please\s+)?(?:make|change|turn|edit|modify|replace|remove|add|adjust|color|colour|transform)\b/i.test(
      text.trim()
    ) ||
    /\b(?:make|change|turn|edit|modify|replace|remove|add)\b.{0,100}\b(?:red|blue|green|purple|black|white|bright|dark|lighter|darker|different|water|sky|background|color|colour)\b/i.test(
      text
    )
  );
}

function getImagePrompt(text: string) {
  return text.replace(/^\/image\s*/i, "").trim();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));

    reader.readAsDataURL(file);
  });
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Home() {
  const [chatId, setChatId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("Fast");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [creatingImage, setCreatingImage] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceInputUsed, setVoiceInputUsed] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: session, isPending: authPending } = authClient.useSession();

  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLElement>(null);
  const inputBox = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<any>(null);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const loadChat = useCallback(async (id: string) => {
    setChatId(id);
    setMessages([]);
    setAttachments([]);
    setInput("");
    setVoiceInputUsed(false);

    localStorage.setItem(ACTIVE_KEY, id);

    const loaded = await hydrateMessages(getMessages(id));

    if (localStorage.getItem(ACTIVE_KEY) === id) {
      setMessages(loaded);
    }
  }, []);

  useEffect(() => {
    setVoiceSupported(
      "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
    );

    let id = localStorage.getItem(ACTIVE_KEY);

    if (!id) {
      id = makeId();
      localStorage.setItem(ACTIVE_KEY, id);
    }

    loadChat(id);
    refreshHistory();

    const handleNew = (event: Event) => {
      const nextId = (event as CustomEvent<string>).detail;
      if (nextId) loadChat(nextId);
    };

    const handleSelect = (event: Event) => {
      const nextId = (event as CustomEvent<string>).detail;
      if (nextId) loadChat(nextId);
    };

    const handleHistory = () => refreshHistory();

    window.addEventListener("aivanta:new-chat", handleNew);
    window.addEventListener("aivanta:select-chat", handleSelect);
    window.addEventListener("aivanta:history-updated", handleHistory);

    return () => {
      window.removeEventListener("aivanta:new-chat", handleNew);
      window.removeEventListener("aivanta:select-chat", handleSelect);
      window.removeEventListener("aivanta:history-updated", handleHistory);
    };
  }, [loadChat, refreshHistory]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function updateHistory(id: string, text: string) {
    try {
      const current = getHistory();

      const title =
        text.length > 35
          ? text.slice(0, 35) + "…"
          : text || "New conversation";

      const exists = current.some((chat) => chat.id === id);

      const updated = exists
        ? current.map((chat) =>
            chat.id === id
              ? { ...chat, title, updatedAt: Date.now() }
              : chat
          )
        : [{ id, title, updatedAt: Date.now() }, ...current];

      updated.sort((a, b) => b.updatedAt - a.updatedAt);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      refreshHistory();

      window.dispatchEvent(new CustomEvent("aivanta:history-updated"));
    } catch {
      console.warn("Could not update chat history.");
    }
  }

  function newLocalChat() {
    if (sending) return;

    const id = makeId();

    localStorage.setItem(ACTIVE_KEY, id);
    loadChat(id);
    setSidebarOpen(false);

    requestAnimationFrame(() => {
      composer.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

      inputBox.current?.focus();
    });
  }

  async function deleteChat(id: string) {
    if (sending) return;

    const savedMessages = getMessages(id);

    if (
      !window.confirm(
        "Delete this conversation and its saved images?"
      )
    ) {
      return;
    }

    await deleteChatImages(savedMessages).catch((error) => {
      console.warn("Could not delete saved chat images.", error);
    });

    try {
      const all = JSON.parse(localStorage.getItem(MESSAGE_KEY) || "{}");
      delete all[id];

      localStorage.setItem(MESSAGE_KEY, JSON.stringify(all));

      const updatedHistory = getHistory().filter(
        (chat) => chat.id !== id
      );

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );

      refreshHistory();

      if (chatId === id) {
        const nextId = makeId();

        localStorage.setItem(ACTIVE_KEY, nextId);
        await loadChat(nextId);
      }

      window.dispatchEvent(new CustomEvent("aivanta:history-updated"));
    } catch {
      console.warn("Could not delete conversation.");
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);

    event.target.value = "";

    if (!selected.length) return;

    if (!session?.user) {
      window.alert("Please log in before attaching files.");
      return;
    }

    setUploading(true);

    try {
      for (const file of selected) {
        if (file.size === 0 || file.size > 5 * 1024 * 1024) {
          window.alert(`${file.name} is too large. Files must be under 5 MB.`);
          continue;
        }

        const isImage = file.type.startsWith("image/");

        if (isImage) {
          if (
            !["image/png", "image/jpeg", "image/webp"].includes(file.type)
          ) {
            window.alert("Images must be PNG, JPG, or WebP.");
            continue;
          }

          const dataUrl = await readFileAsDataUrl(file);
          const imageId = makeId();

          await saveImage(imageId, dataUrl);

          setAttachments((current) => [
            ...current,
            {
              id: makeId(),
              name: file.name,
              size: file.size,
              imageId,
              dataUrl,
            },
          ]);

          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/parse-attachment", {
          method: "POST",
          body: formData,
        });

        const rawData: unknown = await response.json();
        const data = getResponseRecord(rawData);

        if (!response.ok || data.success !== true) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : `Could not read ${file.name}.`
          );
        }

        setAttachments((current) => [
          ...current,
          {
            id: makeId(),
            name: file.name,
            size: file.size,
            textContent:
              typeof data.text === "string" ? data.text : "",
          },
        ]);
      }
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not attach that file."
      );
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removed = current.find((file) => file.id === id);

      if (removed?.imageId) {
        const dbId = removed.imageId;

        openImageDB()
          .then((db) => {
            const transaction = db.transaction("images", "readwrite");
            transaction.objectStore("images").delete(dbId);
            transaction.oncomplete = () => db.close();
            transaction.onerror = () => db.close();
          })
          .catch(() => undefined);
      }

      return current.filter((file) => file.id !== id);
    });
  }

  function startVoiceInput() {
    if (!voiceSupported || listening) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const instance = new SpeechRecognition();

    instance.lang = "en-US";
    instance.continuous = false;
    instance.interimResults = true;

    instance.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      const spokenText = finalText || interimText;

      if (spokenText) {
        setInput((current) =>
          current ? `${current} ${spokenText}` : spokenText
        );
      }

      if (finalText) setVoiceInputUsed(true);
    };

    instance.onerror = () => setListening(false);
    instance.onend = () => setListening(false);

    recognition.current = instance;
    setListening(true);
    instance.start();
  }

  function stopVoiceInput() {
    recognition.current?.stop();
    setListening(false);
  }

  async function sendMessage() {
    const text = input.trim();

    if ((!text && attachments.length === 0) || !chatId || sending) {
      return;
    }

    const currentChatId = chatId;
    const selectedFiles = [...attachments];
    const usedVoice = voiceInputUsed;

    setVoiceInputUsed(false);

    const messageContent =
      text ||
      `I attached these files: ${selectedFiles
        .map((file) => file.name)
        .join(", ")}.`;

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: messageContent,
      attachments: selectedFiles,
    };

    const updated = [...messages, userMessage];

    setMessages(updated);
    storeMessages(currentChatId, updated);

    if (messages.length === 0) {
      updateHistory(currentChatId, text || "File attachment");
    }

    setInput("");
    setAttachments([]);
    setSending(true);

    const generateImage = text.length > 0 && isImageRequest(text);

    const uploadedImage = selectedFiles.find(
      (file) => Boolean(file.dataUrl)
    );

    const previousImage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "assistant" && Boolean(message.image)
      );

    const editImage =
      !generateImage &&
      text.length > 0 &&
      (Boolean(uploadedImage) ||
        (Boolean(previousImage) && isImageEditRequest(text)));

    setCreatingImage(generateImage || editImage);

    try {
      let reply: Message;

      if (generateImage) {
        const prompt = getImagePrompt(text);

        if (!prompt) {
          throw new Error("Please describe the image you want to create.");
        }

        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            style: "Realistic",
            count: 1,
            size: "Square",
          }),
        });

        const rawData: unknown = await response.json();
        const data = getResponseRecord(rawData);
        const images = Array.isArray(data.images) ? data.images : [];
        const firstImage = getResponseRecord(images[0]);
        const generatedImage = firstImage.image;

        if (
          !response.ok ||
          data.success !== true ||
          !Array.isArray(data.images)
        ) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "AI Vanta couldn't generate that image."
          );
        }

        if (
          typeof generatedImage !== "string" ||
          !generatedImage.startsWith("data:image/")
        ) {
          throw new Error("The image model did not return an image.");
        }

        const imageId = makeId();
        await saveImage(imageId, generatedImage);

        reply = {
          id: makeId(),
          role: "assistant",
          content:
            "Here's the image I created for you! You can ask me to change it.",
          attachments: [],
          image: generatedImage,
          imageId,
        };
      } else if (editImage) {
        let sourceImage = uploadedImage?.dataUrl;

        if (!sourceImage && previousImage) {
          sourceImage = previousImage.image;
        }

        if (!sourceImage) {
          throw new Error(
            "I couldn't find the image. Please attach it again."
          );
        }

        const response = await fetch("/api/edit-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: text,
            image: sourceImage,
          }),
        });

        const rawData: unknown = await response.json();
        const data = getResponseRecord(rawData);

        if (
          !response.ok ||
          data.success !== true ||
          typeof data.image !== "string"
        ) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "AI Vanta couldn't edit that photo."
          );
        }

        const imageId = makeId();
        await saveImage(imageId, data.image);

        reply = {
          id: makeId(),
          role: "assistant",
          content: "Here's your edited image!",
          attachments: [],
          image: data.image,
          imageId,
        };
      } else {
        const conversation = updated.map((message) => {
          const attachmentText = message.attachments
            .filter((file) => Boolean(file.textContent))
            .map(
              (file) => `File: ${file.name}\n${file.textContent}`
            )
            .join("\n\n");

          return {
            role: message.role,
            content: attachmentText
              ? `${message.content}\n\nAttached file contents:\n${attachmentText}`
              : message.content,
          };
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conversation,
            usesAttachments: selectedFiles.length > 0,
            voiceInput: usedVoice,
          }),
        });

        const rawData: unknown = await response.json();
        const data = getResponseRecord(rawData);

        if (!response.ok || typeof data.reply !== "string") {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "AI Vanta couldn't respond. Please try again."
          );
        }

        reply = {
          id: makeId(),
          role: "assistant",
          content: data.reply,
          attachments: [],
        };
      }

      const finalMessages = [...updated, reply];

      if (localStorage.getItem(ACTIVE_KEY) === currentChatId) {
        setMessages(finalMessages);
      }

      storeMessages(currentChatId, finalMessages);
      updateHistory(currentChatId, text || messageContent);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      const errorReply: Message = {
        id: makeId(),
        role: "assistant",
        content: `Sorry, ${errorMessage}`,
        attachments: [],
      };

      const finalMessages = [...updated, errorReply];

      if (localStorage.getItem(ACTIVE_KEY) === currentChatId) {
        setMessages(finalMessages);
      }

      storeMessages(currentChatId, finalMessages);
    } finally {
      setSending(false);
      setCreatingImage(false);
      inputBox.current?.focus();
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  const signedIn = Boolean(session?.user);

  return (
    <main className="flex h-[100dvh] overflow-hidden bg-[#080910] text-white">
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.07] bg-[#0c0d17] transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-black">
              AI
            </div>
            <span className="text-xl font-black tracking-tight">
              AI <span className="text-violet-400">Vanta</span>
            </span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 md:hidden"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={newLocalChat}
            disabled={sending}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-fuchsia-600 px-4 py-3.5 text-sm font-bold shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:opacity-50"
          >
            <span className="text-xl">＋</span>
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="mb-3 mt-4 px-3 text-[10px] font-bold tracking-[.2em] text-gray-500">
            WORKSPACE
          </p>

          <Link
            href="/"
            className="mb-1 flex items-center gap-3 rounded-xl bg-violet-500/10 px-3 py-3 text-sm text-violet-200"
          >
            <span>⌂</span>
            Home
          </Link>

          <p className="mb-3 mt-7 px-3 text-[10px] font-bold tracking-[.2em] text-gray-500">
            YOUR CHATS
          </p>

          {history.length === 0 ? (
            <p className="px-3 py-3 text-xs leading-5 text-gray-600">
              Start a conversation and it will appear here.
            </p>
          ) : (
            <div className="space-y-1">
              {history.map((chat) => (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-xl ${
                    chat.id === chatId
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <button
                    onClick={() => {
                      loadChat(chat.id);
                      setSidebarOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm"
                  >
                    <span>◷</span>
                    <span className="min-w-0 flex-1 truncate">
                      {chat.title}
                    </span>
                  </button>

                  <button
                    onClick={() => deleteChat(chat.id)}
                    title="Delete conversation"
                    aria-label={`Delete ${chat.title}`}
                    className="mr-2 rounded-lg px-2 py-1 text-gray-600 opacity-100 transition hover:bg-red-500/10 hover:text-red-300 md:opacity-0 md:group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
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
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <span>{tool.icon}</span>
                {tool.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span>✦</span>
            Plans and pricing
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 hover:bg-white/[0.06] hover:text-white"
          >
            <span>⚙</span>
            Settings
          </Link>

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-500 font-bold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {session?.user?.name || "AI Vanta"}
              </p>
              <p className="truncate text-[10px] text-gray-500">
                {authPending
                  ? "Loading account..."
                  : signedIn
                    ? "Signed in"
                    : "AI workspace"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#080910]/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="rounded-lg p-2 text-gray-400 hover:bg-white/10 md:hidden"
            >
              ☰
            </button>

            <div>
              <p className="text-sm font-semibold text-white">AI Vanta</p>
              <p className="text-[11px] text-gray-500">
                Your AI workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              aria-label="Response mode"
              className="rounded-lg border border-white/10 bg-[#111321] px-3 py-2 text-xs text-gray-300 outline-none focus:border-violet-500"
            >
              <option value="Fast">Fast</option>
            </select>

            <AccountMenu />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-3 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center pb-10 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-2xl font-black shadow-xl shadow-violet-950/30">
                  AI
                </div>

                <p className="mb-3 text-xs font-bold uppercase tracking-[.25em] text-violet-400">
                  Your AI workspace
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  What can I help you
                  <span className="block bg-gradient-to-r from-violet-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
                    create today?
                  </span>
                </h1>

                <p className="mt-5 max-w-lg text-sm leading-7 text-gray-400">
                  Ask questions, write content, explore ideas, understand
                  code, work with files, or create images.
                </p>

                <div className="mt-9 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: "✍️",
                      title: "Write something",
                      prompt: "Help me write a professional introduction.",
                    },
                    {
                      icon: "💡",
                      title: "Explore an idea",
                      prompt: "Help me develop a creative business idea.",
                    },
                    {
                      icon: "💻",
                      title: "Build with code",
                      prompt: "Help me plan and build a website.",
                    },
                    {
                      icon: "🎨",
                      title: "Create an image",
                      prompt: "Create an image of a futuristic city at sunset.",
                    },
                  ].map((suggestion) => (
                    <button
                      key={suggestion.title}
                      onClick={() => {
                        setInput(suggestion.prompt);
                        inputBox.current?.focus();
                      }}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:border-violet-500/40 hover:bg-violet-500/[0.06]"
                    >
                      <span className="text-xl">{suggestion.icon}</span>
                      <p className="mt-3 text-sm font-semibold">
                        {suggestion.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {suggestion.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-7">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user"
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-violet-600 to-blue-600"
                          : "bg-white/10 text-gray-200"
                      }`}
                    >
                      {message.role === "assistant" ? "AI" : "You"}
                    </div>

                    <div
                      className={`min-w-0 max-w-[88%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-violet-600/20 text-gray-100"
                          : "border border-white/[0.06] bg-white/[0.035] text-gray-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {message.content}
                      </p>

                      {message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-2"
                            >
                              {file.dataUrl ? (
                                <img
                                  src={file.dataUrl}
                                  alt={file.name}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                                  📄
                                </span>
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {file.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {formatSize(file.size)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.image && (
                        <img
                          src={message.image}
                          alt="AI generated image"
                          className="mt-4 max-h-[520px] w-full rounded-xl border border-white/10 object-contain"
                        />
                      )}
                    </div>
                  </article>
                ))}

                {sending && (
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-black">
                      AI
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.035] px-4 py-3">
                      <span className="animate-pulse">
                        {creatingImage
                          ? "Working on your image..."
                          : "AI Vanta is thinking..."}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={bottom} />
              </div>
            )}
          </div>

          <section
            ref={composer}
            className="shrink-0 border-t border-white/[0.06] bg-[#080910] px-3 pb-4 pt-3 sm:px-6"
          >
            <div className="mx-auto max-w-3xl">
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex max-w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2"
                    >
                      {file.dataUrl ? (
                        <img
                          src={file.dataUrl}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                          📄
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="max-w-[150px] truncate text-xs font-medium">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {formatSize(file.size)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeAttachment(file.id)}
                        aria-label={`Remove ${file.name}`}
                        className="ml-1 rounded-lg px-2 py-1 text-gray-500 hover:bg-red-500/10 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-[#111321] shadow-2xl shadow-black/20 transition focus-within:border-violet-500/50">
                <textarea
                  ref={inputBox}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Message AI Vanta..."
                  rows={2}
                  className="max-h-48 min-h-[64px] w-full resize-y bg-transparent px-4 pb-2 pt-4 text-sm leading-6 text-white outline-none placeholder:text-gray-600"
                />

                <div className="flex items-center justify-between gap-2 px-3 pb-3">
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.xlsx,.csv,.txt,.md,.markdown,.json,.xml,.yaml,.yml,.rtf,.js,.jsx,.ts,.tsx,.html,.css,.py,.java,.cpp,.c,.sql,.sh,.png,.jpg,.jpeg,.webp"
                      onChange={handleFiles}
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInput.current?.click()}
                      disabled={uploading || sending}
                      title="Attach files"
                      className="rounded-xl px-3 py-2 text-lg text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                    >
                      ＋
                    </button>

                    {voiceSupported && (
                      <button
                        onClick={listening ? stopVoiceInput : startVoiceInput}
                        disabled={sending}
                        title={listening ? "Stop voice input" : "Use voice input"}
                        className={`rounded-xl px-3 py-2 text-base transition ${
                          listening
                            ? "bg-red-500/15 text-red-300"
                            : "text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {listening ? "■" : "🎙"}
                      </button>
                    )}

                    <span className="hidden pl-2 text-[10px] text-gray-600 sm:inline">
                      {uploading
                        ? "Reading file..."
                        : listening
                          ? "Listening..."
                          : "Enter to send · Shift + Enter for new line"}
                    </span>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={
                      sending ||
                      uploading ||
                      (!input.trim() && attachments.length === 0)
                    }
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? "Working..." : "Send"}
                    <span>↑</span>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] text-gray-600">
                AI Vanta can make mistakes. Check important information.
              </p>
            </div>
          </section>
        </div>
      </section>

      <ImageGenerator />
    </main>
  );
}


