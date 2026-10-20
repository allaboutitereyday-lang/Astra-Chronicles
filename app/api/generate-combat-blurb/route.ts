import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";

export const runtime = "nodejs";

const FALLBACK_MODELS = [
  "deepseek/deepseek-v4-flash",
  "z-ai/glm-5.3-flash",
  "nvidia/nemotron-3.5-lightning:free",
];

function generateProceduralBlurb(
  actionType: string,
  actionName: string,
  protagonistName: string,
  protagonistRole: string,
  enemyName: string,
  damageDealt: number,
  enemyDamage: number
): string {
  const pName = protagonistName || "You";
  const eName = enemyName || "the target";

  if (actionType === "strike") {
    const templates = [
      `${pName} steps in with calculated footwork, driving a kinetic strike deep into ${eName}'s stance for ${damageDealt} damage!`,
      `With razor-sharp precision, ${pName} delivers a crushing blow that rattles ${eName}'s physical shell for ${damageDealt} damage!`,
      `${pName} lunges across the causal boundary, landing a fierce direct impact on ${eName} for ${damageDealt} kinetic damage!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  } else if (actionType === "relic") {
    const templates = [
      `Planar rifts fracture open as ${pName} phase-steps behind ${eName}, releasing an overclocked pulse for ${damageDealt} critical damage!`,
      `Harnessing stabilized relic frequencies, ${pName} shears through ${eName}'s defenses with a blinding burst of void energy for ${damageDealt} damage!`,
      `${pName} overclocks the active relic matrices, detonating spatial turbulence directly across ${eName} for ${damageDealt} massive damage!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  } else if (actionType === "companion") {
    const templates = [
      `A coordinated barrage erupts as allied conduits converge, bombarding ${eName} for ${damageDealt} damage and restoring vital composure!`,
      `${pName} links tactical rhythm with allied party resonance, punishing ${eName} for ${damageDealt} damage while knitting flesh and mana!`,
      `Allied firing lines overlap seamlessly, pinning ${eName} under concentrated crossfire for ${damageDealt} synergy damage!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  } else if (actionType === "anchor") {
    const templates = [
      `${pName} drives their causal anchor into the chamber floor, realigning personal timeline coherence and stabilizing vital organs.`,
      `Spatial boundaries freeze around ${pName}, dampening enemy resonance and purifying causal bleed.`,
      `${pName} fortifies their timeline anchor against dimensional collapse, breathing steadily as life force coalesces.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  return `${pName} unleashes ${actionName}, piercing ${eName}'s guard with decisive authority for ${damageDealt} damage!`;
}

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      actionType = "strike",
      actionName = "Kinetic Strike",
      protagonistName = "Protagonist",
      protagonistRole = "Voidstrider",
      enemyName = "Planar Construct",
      damageDealt = 30,
      enemyDamage = 14,
      sectorName = "Sector 01",
      causalModifier = "None",
      userAccessKey,
    } = body;

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);
    // Allow trials combat blurbs if key is valid, or fallback gracefully
    const hasValidKey = authCheck.valid;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        blurb: generateProceduralBlurb(
          actionType,
          actionName,
          protagonistName,
          protagonistRole,
          enemyName,
          damageDealt,
          enemyDamage
        ),
        model: "Procedural Engine Fallback",
      });
    }

    const enemyReactionPrompt = enemyDamage > 0 
      ? `After reeling from the blow, ${enemyName} retaliated with a counter-attack dealing ${enemyDamage} damage.`
      : `${enemyName} staggered backward, stunned by the kinetic force.`;

    const systemPrompt = `You are the LitRPG Administrator Combat Narrator for "Astra Chronicles".
Write a concise, visceral, and cinematic 1-2 sentence combat blurb describing the turn execution.
Strict Constraints:
- Exactly 1 to 2 sentences.
- Maximum 35 words.
- Dynamic, sensory, high-stakes LitRPG tone (impact, momentum, sound, void energy, or tactical coordination).
- You MUST mention the protagonist's action or impact (${actionName}) and the enemy's reaction (${enemyName}).
- Respond strictly with JSON: { "blurb": "..." }.`;

    const userPrompt = `Protagonist: ${protagonistName} (${protagonistRole})
Encounter: ${enemyName} in ${sectorName}
Active Causal Modifier: ${causalModifier}
Action Executed: ${actionName} [Type: ${actionType}] dealing ${damageDealt} damage.
${enemyReactionPrompt}`;

    let generatedBlurb: string | null = null;
    let modelUsed = "Unknown";

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://astra-chronicles.local",
            "X-Title": "Astra Chronicles LitRPG Trials",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 90,
          }),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) continue;

        try {
          const parsed = JSON.parse(rawContent);
          if (parsed && typeof parsed.blurb === "string" && parsed.blurb.trim().length > 0) {
            generatedBlurb = parsed.blurb.trim();
            modelUsed = model;
            break;
          }
        } catch {
          // If plain text was returned instead of JSON
          if (rawContent.trim().length > 0 && !rawContent.includes("{")) {
            generatedBlurb = rawContent.trim();
            modelUsed = model;
            break;
          }
        }
      } catch (err) {
        console.warn(`Model ${model} failed for combat blurb, attempting next:`, err);
      }
    }

    if (!generatedBlurb) {
      generatedBlurb = generateProceduralBlurb(
        actionType,
        actionName,
        protagonistName,
        protagonistRole,
        enemyName,
        damageDealt,
        enemyDamage
      );
      modelUsed = "Procedural Archetype Engine";
    }

    return NextResponse.json({
      blurb: generatedBlurb,
      model: modelUsed,
      success: true,
    });
  } catch (err: any) {
    console.error("Combat blurb generation top-level error:", err);
    return NextResponse.json({
      blurb: "Kinetic energy detonates across the causal chamber as strikes trade in rapid succession.",
      model: "Emergency Fallback",
      success: false,
    });
  }
}

