
import { NextResponse } from "next/server";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";

const STYLE_PROMPTS: Record<string, string> = {
  Realistic:
    "Photorealistic, realistic materials, natural lighting, detailed textures.",
  Anime:
    "Anime illustration style, expressive details, beautiful anime artwork.",
  "3D":
    "High-quality 3D rendered artwork, detailed geometry, realistic materials, professional 3D lighting.",
  Cartoon:
    "Colorful cartoon illustration, clean shapes, expressive design, polished animation artwork.",
};

const ALLOWED_STYLES = ["Realistic", "Anime", "3D", "Cartoon"];
const ALLOWED_SIZES = ["Square", "Portrait", "Landscape"];
const ALLOWED_COUNTS = [1, 2, 4];

type RequestBody = {
  prompt?: unknown;
  style?: unknown;
  count?: unknown;
  size?: unknown;
};

type CloudflareResponse = {
  success?: boolean;
  errors?: unknown;
  result?: {
    image?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export async function POST(request: Request) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Image generation is not configured." },
        { status: 500 }
      );
    }

    const parsedBody: unknown = await request.json();

    const body: RequestBody = isRecord(parsedBody)
      ? (parsedBody as RequestBody)
      : {};

    const prompt = body.prompt;
    const style = body.style ?? "Realistic";
    const count = body.count ?? 1;
    const size = body.size ?? "Square";

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.trim().length > 2048
    ) {
      return NextResponse.json(
        {
          error:
            "Enter an image description between 1 and 2048 characters.",
        },
        { status: 400 }
      );
    }

    if (
      typeof style !== "string" ||
      !ALLOWED_STYLES.includes(style)
    ) {
      return NextResponse.json(
        { error: "Choose a valid image style." },
        { status: 400 }
      );
    }

    if (
      typeof count !== "number" ||
      !ALLOWED_COUNTS.includes(count)
    ) {
      return NextResponse.json(
        { error: "Choose 1, 2, or 4 images." },
        { status: 400 }
      );
    }

    if (
      typeof size !== "string" ||
      !ALLOWED_SIZES.includes(size)
    ) {
      return NextResponse.json(
        { error: "Choose a valid image shape." },
        { status: 400 }
      );
    }

    const finalPrompt = `${prompt.trim()}. ${STYLE_PROMPTS[style]}`;

    const images: { image: string }[] = [];
    let generationError = "";

    // Generate sequentially to avoid sending several requests at once.
    for (let index = 0; index < count; index++) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: finalPrompt,
            steps: 4,
          }),
          cache: "no-store",
        }
      );

      const raw = await response.text();

      let data: CloudflareResponse;

      try {
        const parsed: unknown = JSON.parse(raw);

        data = isRecord(parsed)
          ? (parsed as CloudflareResponse)
          : {};
      } catch {
        generationError =
          "The image service returned an invalid response.";
        break;
      }

      if (!response.ok || data.success === false) {
        console.error(
          "Image generation error:",
          data.errors ?? response.status
        );

        generationError =
          response.status === 429
            ? "Aivanta has reached a temporary image-generation limit. Please try again later."
            : "Aivanta couldn't generate the next image. Please try again.";

        break;
      }

      const image = data.result?.image;

      if (typeof image !== "string" || !image.length) {
        console.error("Image model returned no image.");
        generationError = "The image model did not return an image.";
        break;
      }

      images.push({
        image: `data:image/jpeg;base64,${image}`,
      });
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: generationError || "Image generation failed." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      images,
      model: MODEL,
      style,
      displayShape: size,
      warning: generationError || null,
    });
  } catch (error) {
    console.error("Aivanta image API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating your images." },
      { status: 500 }
    );
  }
}
