import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const runtime = "nodejs";

type RequestBody = {
  prompt?: unknown;
  image?: unknown;
};

type CloudflareResponse = {
  success?: boolean;
  errors?: unknown;
  result?: {
    image?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in to edit photos." },
        { status: 401 }
      );
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Photo editing is not configured." },
        { status: 500 }
      );
    }

    const parsedBody: unknown = await request.json();
    const body: RequestBody = isRecord(parsedBody) ? parsedBody : {};

    const prompt = body.prompt;
    const imageData = body.image;

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.trim().length > 1500
    ) {
      return NextResponse.json(
        { error: "Enter an editing instruction between 1 and 1500 characters." },
        { status: 400 }
      );
    }

    if (typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Please provide a photo to edit." },
        { status: 400 }
      );
    }

    const match = imageData.match(
      /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/
    );

    if (!match) {
      return NextResponse.json(
        { error: "Use a PNG, JPG, or WebP image." },
        { status: 400 }
      );
    }

    const mimeType = match[1];
    const base64 = match[2];
    const imageBytes = Buffer.from(base64, "base64");

    if (
      imageBytes.length === 0 ||
      imageBytes.length > MAX_IMAGE_BYTES
    ) {
      return NextResponse.json(
        { error: "The photo is too large. Please use an image under 5 MB." },
        { status: 400 }
      );
    }

    const form = new FormData();
    form.append("prompt", prompt.trim());

    form.append(
      "input_image_0",
      new Blob([new Uint8Array(imageBytes)], { type: mimeType }),
      `reference.${mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1]}`
    );

    form.append("width", "1024");
    form.append("height", "1024");

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        body: form,
        cache: "no-store",
      }
    );

    const raw = await response.text();

    let data: CloudflareResponse;

    try {
      const parsed: unknown = JSON.parse(raw);
      data = isRecord(parsed) ? parsed as CloudflareResponse : {};
    } catch {
      return NextResponse.json(
        { error: "The photo editing service returned an invalid response." },
        { status: 502 }
      );
    }

    if (!response.ok || data.success === false) {
      console.error("Photo editing error:", data.errors ?? response.status);

      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "The photo editing service is busy. Please try again later."
              : "Aivanta couldn't edit that photo. Please try another image or instruction.",
        },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const image = data.result?.image;

    if (typeof image !== "string" || !image.length) {
      return NextResponse.json(
        { error: "The editing model did not return an image." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${image}`,
      model: MODEL,
    });
  } catch (error) {
    console.error("Aivanta photo editing API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while editing your photo." },
      { status: 500 }
    );
  }
}
