import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Unified Dynamic LLM Router for Astra Chronicles
 * Dynamically routes requests between Local Ollama (Nous Hermes 3)
 * and Cloud inference (OpenRouter).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      targetEnvironment = "cloud", // "local" | "cloud"
      modelId,
      messages = [],
      prompt,
      temperature = 0.8,
      max_tokens = 1024,
      repetition_penalty = 1.1,
    } = body;

    // Standardize OpenAI-style messages array
    const formattedMessages =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : [{ role: "user", content: prompt || "Continue the chronicle." }];

    let endpointUrl: string;
    let headers: Record<string, string>;
    let targetModel: string;

    // Route logic: Assign fetch URL, headers, and model string
    if (targetEnvironment === "local") {
      endpointUrl = "http://127.0.0.1:11434/v1/chat/completions";
      targetModel = modelId || "hermes3:8b";
      headers = {
        "Content-Type": "application/json",
      };
    } else {
      // Cloud environment via OpenRouter
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "OPENROUTER_API_KEY environment variable is not configured on the server." },
          { status: 500 }
        );
      }

      endpointUrl = "https://openrouter.ai/api/v1/chat/completions";
      targetModel = modelId || "deepseek/deepseek-chat";
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://astra-chronicles.local",
        "X-Title": "Astra Chronicles",
      };
    }

    // Uniform payload structure supported by both Ollama and OpenRouter
    const payload = {
      model: targetModel,
      messages: formattedMessages,
      temperature: Number(temperature),
      max_tokens: Number(max_tokens),
      repetition_penalty: Number(repetition_penalty),
    };

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Inference failed on ${targetEnvironment} endpoint (${response.status}): ${errorText}`,
          targetEnvironment,
          endpointUrl,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      success: true,
      text: rawContent,
      model: targetModel,
      targetEnvironment,
      usage: data.usage ?? null,
    });
  } catch (error: any) {
    console.error("Unified LLM Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during LLM routing." },
      { status: 500 }
    );
  }
}

