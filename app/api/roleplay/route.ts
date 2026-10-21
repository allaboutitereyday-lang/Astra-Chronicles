import { NextResponse } from "next/server";
import {
  UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE,
  UNIVERSE_STATE_AND_MEMORY_CHECKLIST,
} from "@/lib/narrationStyles";
import { sanitizeVisualNovelProse } from "@/lib/proseSanitizer";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ARCHITECTURAL NOTICE / ROUTE GOVERNANCE:
 * 
 * Core visual novel roleplay progression in Astra Chronicles is orchestrated by:
 * - `/api/turn`: Multi-agent DeepSeek V3 GM turn engine (dialogue, actions, choices, inventory, quests, affection).
 * - `/api/prologue`: Dynamic heroine opening monologue & sensory scene generator.
 * - `/api/generate-choices`: Standalone situation-aware decision authoring engine.
 * 
 * `/api/roleplay` serves as an auxiliary raw multi-turn completion proxy for benchmark testing
 * and direct LLM evaluation. It applies universal prose sanitization and system directives to all outputs.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      targetEnvironment = "cloud", // "local" | "cloud"
      modelId,
      messages = [],
      prompt,
      temperature = 0.85,
      max_tokens = 1024,
      repetition_penalty = 1.1,
    } = body;

    // Standardize OpenAI-style messages array
    const rawMessages =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : [{ role: "user", content: prompt || "Continue the chronicle." }];

    // Inject Universal Immersion, Grammar & State Verification directives
    const hasSystemMessage = rawMessages.some((m: any) => m.role === "system");
    let formattedMessages = [...rawMessages];

    if (hasSystemMessage) {
      formattedMessages = formattedMessages.map((m: any) => {
        if (m.role === "system") {
          const content = m.content || "";
          if (!content.includes("UNIVERSAL LITERARY RIGOR")) {
            return {
              ...m,
              content: `${content}\n\n${UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE}\n\n${UNIVERSE_STATE_AND_MEMORY_CHECKLIST}`,
            };
          }
        }
        return m;
      });
    } else {
      formattedMessages.unshift({
        role: "system",
        content: `You are the Game Master, Narrator, and Companion Roleplay Engine for Astra Chronicles.

${UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE}

${UNIVERSE_STATE_AND_MEMORY_CHECKLIST}`,
      });
    }

    let endpointUrl: string;
    let headers: Record<string, string>;
    let targetModel: string;

    // Smart auto-detection: If targetEnvironment is local but modelId has a cloud slug (e.g. sao10k/...),
    // auto-route to cloud!
    let effectiveEnvironment = targetEnvironment;
    if (effectiveEnvironment === "local" && modelId && modelId.includes("/")) {
      console.warn(`Local environment requested with cloud model ID "${modelId}". Auto-routing to cloud.`);
      effectiveEnvironment = "cloud";
    }

    // Route logic: Assign fetch URL, headers, and model string
    if (effectiveEnvironment === "local") {
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
      const resolvedModelId = modelId === "orchestrated-hybrid" ? "sao10k/l3.1-euryale-70b" : modelId;
      targetModel = resolvedModelId || "sao10k/l3.1-euryale-70b";
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
    const cleanedText = sanitizeVisualNovelProse(rawContent);

    return NextResponse.json({
      success: true,
      text: cleanedText,
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

