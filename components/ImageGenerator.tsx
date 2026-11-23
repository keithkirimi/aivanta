
"use client";

import { useEffect, useState } from "react";

type Style = "Realistic" | "Anime" | "3D" | "Cartoon";
type ImageSize = "Square" | "Portrait" | "Landscape";

type GalleryItem = {
  id: string;
  image: string;
  prompt: string;
  style: Style;
  size: ImageSize;
  createdAt: number;
};

type GenerateImageResponse = {
  success?: boolean;
  error?: string;
  images?: unknown[];
};

function getGenerateImageResponse(value: unknown): GenerateImageResponse {
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
    images: Array.isArray(record.images) ? record.images : undefined,
  };
}

const DB_NAME = "aivanta-image-gallery";
const STORE_NAME = "images";

function openGalleryDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getGallery(): Promise<GalleryItem[]> {
  const db = await openGalleryDB();

  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME).getAll();

    request.onsuccess = () => {
      resolve((request.result as GalleryItem[]).sort(
        (a, b) => b.createdAt - a.createdAt
      ));
      db.close();
    };

    request.onerror = () => {
      reject(request.error);
      db.close();
    };
  });
}

async function saveGalleryItem(item: GalleryItem): Promise<void> {
  const db = await openGalleryDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(item);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function removeGalleryItem(id: string): Promise<void> {
  const db = await openGalleryDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export default function ImageGenerator() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<Style>("Realistic");
  const [size, setSize] = useState<ImageSize>("Square");
  const [count, setCount] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [tab, setTab] = useState<"create" | "gallery">("create");

  useEffect(() => {
    getGallery()
      .then(setGallery)
      .catch(() => setNotice("Your browser could not load the saved gallery."));
  }, []);

  async function generateImage() {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError("");
    setNotice("");
    setImages([]);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          count,
          size,
        }),
      });

      const parsed: unknown = await response.json().catch(() => ({}));
      const data = getGenerateImageResponse(parsed);

      if (!response.ok || !data.success || !data.images) {
        throw new Error(data.error || "Image generation failed.");
      }

      const generatedImages = data.images
        .map((item: unknown) => {
          if (
            item !== null &&
            typeof item === "object" &&
            !Array.isArray(item)
          ) {
            const image = (item as Record<string, unknown>).image;
            return typeof image === "string" ? image : undefined;
          }

          return undefined;
        })
        .filter(
          (image): image is string =>
            typeof image === "string" && image.startsWith("data:image/")
        );

      if (generatedImages.length === 0) {
        throw new Error("The image model did not return any images.");
      }

      setImages(generatedImages);

      const newItems: GalleryItem[] = generatedImages.map(
        (image: string) => ({
          id: crypto.randomUUID(),
          image,
          prompt: prompt.trim(),
          style,
          size,
          createdAt: Date.now(),
        })
      );

      try {
        for (const item of newItems) {
          await saveGalleryItem(item);
        }
        setGallery((previous) => [...newItems, ...previous]);
      } catch {
        setNotice(
          "Images generated successfully, but your browser could not save them to the gallery. Download them to keep them."
        );
      }

      if (generatedImages.length < count) {
        setNotice(
          `Aivanta generated ${generatedImages.length} of ${count} requested images. Check your Cloudflare usage limits and try again later.`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteImage(id: string) {
    try {
      await removeGalleryItem(id);
      setGallery((previous) => previous.filter((item) => item.id !== id));
    } catch {
      setNotice("Could not delete that image from your gallery.");
    }
  }

  function downloadImage(image: string, index: number) {
    const link = document.createElement("a");
    link.href = image;
    link.download = `aivanta-image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  const aspectClass =
    size === "Portrait"
      ? "aspect-[3/4]"
      : size === "Landscape"
        ? "aspect-[4/3]"
        : "aspect-square";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-30 rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:scale-105 active:scale-95"
      >
        🎨 Create image
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#11121a] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">
                  Aivanta Image Studio
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Create images with Aivanta AI.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-gray-400 hover:bg-white/10 hover:text-white"
                aria-label="Close Image Studio"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 flex gap-2 rounded-xl bg-black/30 p-1">
              <button
                onClick={() => setTab("create")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  tab === "create"
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                ✨ Create
              </button>
              <button
                onClick={() => setTab("gallery")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  tab === "gallery"
                    ? "bg-violet-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                🖼️ My Gallery ({gallery.length})
              </button>
            </div>

            {tab === "create" && (
              <>
                <label className="mb-2 block text-xs font-semibold text-gray-300">
                  Describe the image you want
                </label>

                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="A beautiful futuristic city at sunset, cinematic lighting..."
                  rows={4}
                  maxLength={2048}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#08090e] p-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-violet-500/50"
                />

                <p className="mt-2 text-right text-[10px] text-gray-600">
                  {prompt.length}/2048
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-300">
                      Art style
                    </label>
                    <select
                      value={style}
                      onChange={(event) => setStyle(event.target.value as Style)}
                      className="w-full rounded-xl border border-white/10 bg-[#08090e] p-3 text-sm text-white outline-none focus:border-violet-500"
                    >
                      <option>Realistic</option>
                      <option>Anime</option>
                      <option>3D</option>
                      <option>Cartoon</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-300">
                      Display shape
                    </label>
                    <select
                      value={size}
                      onChange={(event) => setSize(event.target.value as ImageSize)}
                      className="w-full rounded-xl border border-white/10 bg-[#08090e] p-3 text-sm text-white outline-none focus:border-violet-500"
                    >
                      <option>Square</option>
                      <option>Portrait</option>
                      <option>Landscape</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-gray-300">
                      Number of images
                    </label>
                    <select
                      value={count}
                      onChange={(event) => setCount(Number(event.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#08090e] p-3 text-sm text-white outline-none focus:border-violet-500"
                    >
                      <option value={1}>1 image</option>
                      <option value={2}>2 images</option>
                      <option value={4}>4 images</option>
                    </select>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                  Shape controls the preview crop. FLUX.1 Schnell currently
                  generates its model's default dimensions. Multiple images
                  use multiple generation requests and count toward your
                  Cloudflare usage limits.
                </p>

                <button
                  onClick={generateImage}
                  disabled={!prompt.trim() || loading}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading
                    ? "Aivanta is creating..."
                    : `✨ Generate ${count === 1 ? "image" : `${count} images`}`}
                </button>

                {loading && (
                  <div className="py-8 text-center text-sm text-violet-300">
                    Creating {count} {count === 1 ? "image" : "images"}.
                    This may take a little while...
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {notice && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                    {notice}
                  </div>
                )}

                {images.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-bold text-white">
                      Your creations
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {images.map((image, index) => (
                        <div key={index} className="min-w-0">
                          <div className={`${aspectClass} overflow-hidden rounded-2xl border border-white/10 bg-black/30`}>
                            <img
                              src={image}
                              alt={`Aivanta generated image ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => downloadImage(image, index)}
                            className="mt-2 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20"
                          >
                            ↓ Download image {index + 1}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "gallery" && (
              <div>
                {gallery.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-12 text-center">
                    <div className="text-4xl">🖼️</div>
                    <p className="mt-3 font-semibold text-white">
                      Your gallery is empty
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Images you generate will appear here.
                    </p>
                    <button
                      onClick={() => setTab("create")}
                      className="mt-5 rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white"
                    >
                      Create your first image
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {gallery.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                      >
                        <div className="aspect-square overflow-hidden bg-black/30">
                          <img
                            src={item.image}
                            alt={item.prompt}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-xs text-gray-300">
                            {item.prompt}
                          </p>
                          <p className="mt-2 text-[10px] text-gray-500">
                            {item.style} · {item.size} ·{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => downloadImage(item.image, 0)}
                              className="flex-1 rounded-lg bg-violet-600/20 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-600/30"
                            >
                              ↓ Download
                            </button>
                            <button
                              onClick={() => deleteImage(item.id)}
                              className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

