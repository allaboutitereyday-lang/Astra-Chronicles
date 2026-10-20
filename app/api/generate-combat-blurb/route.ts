import { NextResponse } from "next/server";
import { validateUserKey } from "@/lib/userAccess";

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
  enemyDamage: number,
  activeCompanion?: any,
  isDuoUltimate?: boolean
): string {
  const pName = protagonistName || "You";
  const eName = enemyName || "the target";
  const role = (protagonistRole || "Voidstrider").toLowerCase();
  const compName = activeCompanion?.name;

  if (isDuoUltimate && compName) {
    return `In flawless sync, ${pName} and ${compName} channel their awakened bond, unleashing ${actionName} to shatter ${eName} for ${damageDealt} catastrophic damage!`;
  }

  // Class-specific procedural styling
  if (role.includes("void") || role.includes("space") || role.includes("singularity")) {
    if (actionType === "strike" || actionName.toLowerCase().includes("void")) {
      return `${pName} cleaves through local spacetime with ${actionName}, collapsing dimensional matter across ${eName} for ${damageDealt} gravitational damage!`;
    } else if (actionType === "burst" || actionType === "relic") {
      return `Gravitational rifts tear open as ${pName} triggers ${actionName}, detonating an event horizon directly within ${eName} for ${damageDealt} catastrophic damage!`;
    } else if (actionType === "synergy" || actionType === "companion") {
      const helper = compName ? `alongside ${compName}` : "weaving tactical resonance";
      return `${pName} stabilizes the sector with ${actionName} ${helper}, trapping ${eName} in planar crossfire for ${damageDealt} damage while mending wounds!`;
    } else if (actionType === "defense" || actionType === "anchor") {
      return `${pName} enters ${actionName}, phasing physical mass into sub-dimensional space to purify trauma and realign timeline coherence.`;
    }
  }

  if (role.includes("spell") || role.includes("blade") || role.includes("inquisitor")) {
    if (actionType === "strike" || actionName.toLowerCase().includes("aether")) {
      return `${pName} channels shimmering aether along their weapon edge, driving ${actionName} into ${eName}'s armor for ${damageDealt} piercing damage!`;
    } else if (actionType === "burst" || actionType === "relic") {
      return `Prismatic runes ignite along the blade as ${pName} executes ${actionName}, overwhelming ${eName} in an elemental tempest for ${damageDealt} damage!`;
    } else if (actionType === "synergy" || actionType === "companion") {
      const helper = compName ? `synchronized with ${compName}'s blade` : "with allied resonance";
      return `${pName} links aether conduits ${helper}, bombarding ${eName} with ${actionName} for ${damageDealt} damage while restoring vital mana!`;
    } else if (actionType === "defense" || actionType === "anchor") {
      return `${pName} raises their weapon in ${actionName}, weaving a shimmering runic ward that blunts kinetic shock and soothes vital nerves.`;
    }
  }

  if (role.includes("mage") || role.includes("wizard") || role.includes("sorcerer") || role.includes("arcan") || role.includes("celestial")) {
    if (actionType === "strike" || actionName.toLowerCase().includes("mana")) {
      return `${pName} thrusts a focused beam of pure starlight with ${actionName}, piercing cleanly through ${eName}'s defenses for ${damageDealt} arcane damage!`;
    } else if (actionType === "burst" || actionType === "relic") {
      return `A blazing star coalesces at ${pName}'s command before detonating in ${actionName}, vaporizing ${eName}'s outer shell for ${damageDealt} cataclysmic damage!`;
    } else if (actionType === "synergy" || actionType === "companion") {
      return `${pName} siphons ambient chamber aether with ${actionName}, blasting ${eName} for ${damageDealt} damage while replenishing health and mana pools!`;
    } else if (actionType === "defense" || actionType === "anchor") {
      return `${pName} invokes ${actionName}, spinning the local timeline backward to undo bodily trauma and recover arcane composure.`;
    }
  }

  if (role.includes("rogue") || role.includes("assassin") || role.includes("shadow")) {
    if (actionType === "strike" || actionName.toLowerCase().includes("shadow")) {
      return `Blurring into ambient gloom, ${pName} drives ${actionName} into ${eName}'s structural flaw for ${damageDealt} critical puncture damage!`;
    } else if (actionType === "burst" || actionType === "relic") {
      return `${pName} flickers behind ${eName}'s blind spot to execute ${actionName}, severing energy lines for ${damageDealt} devastating assassination damage!`;
    } else if (actionType === "synergy" || actionType === "companion") {
      return `${pName} triggers ${actionName}, delivering a lethal pincer flank on ${eName} for ${damageDealt} damage while completely slipping past retaliation!`;
    } else if (actionType === "defense" || actionType === "anchor") {
      return `${pName} vanishes into smoke with ${actionName}, resetting combat tempo, tending wounds, and masking physical presence.`;
    }
  }

  if (role.includes("warrior") || role.includes("berserk") || role.includes("juggernaut")) {
    if (actionType === "strike" || actionName.toLowerCase().includes("cleave")) {
      return `With terrifying physical momentum, ${pName} crashes down with ${actionName}, splintering ${eName}'s barrier for ${damageDealt} crushing damage!`;
    } else if (actionType === "burst" || actionType === "relic") {
      return `${pName} fractures the arena floor with ${actionName}, unleashing a concussive seismic wave that pulverizes ${eName} for ${damageDealt} damage!`;
    } else if (actionType === "synergy" || actionType === "companion") {
      return `${pName} lets loose ${actionName}, breaking ${eName}'s poise under joint assault for ${damageDealt} damage while stoking combat fury!`;
    } else if (actionType === "defense" || actionType === "anchor") {
      return `${pName} braces in ${actionName}, hardening muscle and armor against planar entropy while life force surges back.`;
    }
  }

  if (role.includes("paladin") || role.includes("solar") || role.includes("holy")) {
    if (actionType === "strike" || actionName.toLowerCase().includes("radiant")) {
      return `Consecrated starlight erupts from ${pName}'s strike, searing ${eName} with ${actionName} for ${damageDealt} radiant holy damage!`;
    } else if (actionType === "burst" || actionType === "relic") {
      return `A blazing pillar of dawn incinerates the sector as ${pName} calls ${actionName}, purging ${eName} for ${damageDealt} thermonuclear solar damage!`;
    } else if (actionType === "synergy" || actionType === "companion") {
      return `${pName} manifests ${actionName}, bathing both allies in restorative warmth while punishing ${eName} for ${damageDealt} divine damage!`;
    } else if (actionType === "defense" || actionType === "anchor") {
      return `${pName} raises ${actionName}, holding an inviolable golden aegis that purges timeline decay and restores life force.`;
    }
  }

  // Fallback procedural
  if (actionType === "defense" || actionType === "anchor") {
    return `${pName} fortifies their timeline anchor with ${actionName}, breathing steadily as vital life force coalesces and stabilizes.`;
  }

  return `${pName} executes ${actionName}, striking ${eName} with calculated authority for ${damageDealt} damage!`;
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
      // Pillar 1 & 2 Inputs
      activeCompanion = null, // { name: string, role: string, affection: number, tier: string, ultimateName?: string }
      activeStance = "neutral",
      isDuoUltimate = false,
      isCriticalHit = false,
    } = body;

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);

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
          enemyDamage,
          activeCompanion,
          isDuoUltimate
        ),
        model: "Procedural Engine Fallback",
      });
    }

    const enemyReactionPrompt = enemyDamage > 0 
      ? `After reeling from the blow, ${enemyName} retaliated with a counter-attack dealing ${enemyDamage} damage.`
      : `${enemyName} staggered backward, stunned by the kinetic force.`;

    const companionContext = activeCompanion
      ? `Active Co-Op Companion: ${activeCompanion.name} (${activeCompanion.role}, Affection Tier: ${activeCompanion.tier || "Confidant"} [${activeCompanion.affection || 50}%]).`
      : "The protagonist is fighting solo in this trial sector.";

    const coOpDirective = activeCompanion
      ? isDuoUltimate
        ? `- This turn is an AWAKENED DUO ULTIMATE with ${activeCompanion.name}. Highlight their unified combination strike (${activeCompanion.ultimateName || actionName}) and shared synchronization line or banter.`
        : `- When appropriate or on critical strikes (${isCriticalHit ? "YES" : "NO"}), integrate ${activeCompanion.name}'s tactical presence, supportive covering fire, or brief in-combat banter reflecting their ${activeCompanion.tier} bond.`
      : `- Focus exclusively on ${protagonistName}'s solo execution.`;

    const stanceDirective = activeStance && activeStance !== "neutral"
      ? `- Combat Stance active: [${activeStance.toUpperCase()} INFUSION]. Reflect elemental energy (e.g. Frost chilling / Flame burning / Void phasing).`
      : "";

    const systemPrompt = `You are the LitRPG Administrator Combat Narrator for "Astra Chronicles".
Write a concise, visceral, and cinematic 1-2 sentence combat blurb describing the turn execution.
Strict Constraints:
- Exactly 1 to 2 sentences.
- Maximum 38 words.
- Dynamic, sensory, high-stakes LitRPG tone reflecting the protagonist's class (${protagonistRole}) and current stance.
${coOpDirective}
${stanceDirective}
- You MUST mention the protagonist's action or impact (${actionName}) and the enemy's reaction (${enemyName}).
- Respond strictly with JSON: { "blurb": "..." }.`;

    const userPrompt = `Protagonist: ${protagonistName} (${protagonistRole})
${companionContext}
Encounter: ${enemyName} in ${sectorName}
Active Causal Modifier: ${causalModifier}
Action Executed: ${actionName} [Type: ${actionType}] dealing ${damageDealt} damage. Critical Hit: ${isCriticalHit ? "YES" : "NO"}.
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
            max_tokens: 95,
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
        enemyDamage,
        activeCompanion,
        isDuoUltimate
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
