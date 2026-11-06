import { NextResponse } from "next/server";
import {
  describeProtagonistAvatar,
  extractProtagonistVisualDna,
} from "@/lib/visionEncoder";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      avatarBase64,
      name = "The Protagonist",
      role = "Adventurer",
      race = "Human",
      racialTraits = [],
      existingDescription = null,
    } = body;

    if (!avatarBase64 || typeof avatarBase64 !== "string") {
      return NextResponse.json(
        { error: "avatarBase64 is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const [visualDescription, visualDna] = await Promise.all([
      describeProtagonistAvatar(
        avatarBase64,
        name,
        role,
        apiKey,
        race,
        Array.isArray(racialTraits) ? racialTraits : []
      ),
      extractProtagonistVisualDna(
        avatarBase64,
        name,
        role,
        existingDescription,
        apiKey,
        race,
        Array.isArray(racialTraits) ? racialTraits : []
      ),
    ]);

    return NextResponse.json({
      success: true,
      visualDescription: visualDescription || visualDna?.fullPromptAnchor || null,
      visualDna,
    });
  } catch (err: any) {
    console.error("[/api/analyze-avatar] Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to analyze avatar." },
      { status: 500 }
    );
  }
}

