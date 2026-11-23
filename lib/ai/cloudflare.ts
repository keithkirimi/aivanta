const MODEL = "@cf/google/gemma-4-26b-a4b-it";

export type AIMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerateAIOptions = {
  systemPrompt: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
};

type CloudflareResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
  };
};

export class CloudflareAIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CloudflareAIError";
    this.status = status;
  }
}

export async function generateAIText({
  systemPrompt,
  messages,
  maxTokens = 1200,
  temperature = 0.7,
}: GenerateAIOptions): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new CloudflareAIError(
      "Aivanta AI is not configured.",
      500
    );
  }

  if (!messages.length) {
    throw new CloudflareAIError(
      "Please provide a message.",
      400
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...messages,
        ],
        max_completion_tokens: maxTokens,
        temperature,
        chat_template_kwargs: {
          enable_thinking: false,
        },
      }),
      cache: "no-store",
    }
  );

  const rawResponse = await response.text();
  let data: CloudflareResponse;

  try {
    data = JSON.parse(rawResponse) as CloudflareResponse;
  } catch {
    throw new CloudflareAIError(
      "Aivanta received an invalid response. Please try again.",
      502
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new CloudflareAIError(
        "Aivanta AI is temporarily busy. Please try again shortly.",
        429
      );
    }

    console.error(
      "Cloudflare AI request failed:",
      response.status,
      data.error?.message || "Unknown provider error"
    );

    throw new CloudflareAIError(
      "Cloudflare could not complete the AI request.",
      502
    );
  }

  const result = data.choices?.[0]?.message?.content;

  if (typeof result !== "string" || !result.trim()) {
    throw new CloudflareAIError(
      "Aivanta did not receive a normal answer. Please try again.",
      502
    );
  }

  return result.trim();
}
