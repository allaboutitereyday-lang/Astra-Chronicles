import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";
import { AbilityDetail } from "@/types/story";

export const runtime = "nodejs";
export const maxDuration = 60;

const FALLBACK_MODELS = [
  "deepseek/deepseek-chat",
  "nousresearch/hermes-3-llama-3.1-70b",
  "sao10k/l3-lunaris-8b",
];

const ARCHETYPE_FALLBACKS: Record<string, AbilityDetail[]> = {
  spellblade: [
    {
      name: "Aether Infusion",
      type: "Active",
      cost: "12 MP",
      cooldown: "Instant",
      tier: "Novice",
      description: "Channels volatile planar aether along the weapon edge, converting physical slashes into piercing arcane strikes that bypass 25% of enemy armor.",
    },
    {
      name: "Blink Riposte",
      type: "Active",
      cost: "18 MP",
      cooldown: "2 Turns",
      tier: "Adept",
      description: "Briefly collapses local space to evade an incoming lethal assault, instantly reappearing behind the attacker with a counter-cleave.",
    },
    {
      name: "Arcane Harmony",
      type: "Passive",
      cost: "Passive",
      cooldown: "None",
      tier: "Novice",
      description: "Synchronizes physical momentum with the user's mana pool, restoring 5 MP on critical melee strikes.",
    },
  ],
  mage: [
    {
      name: "Arcane Shockwave",
      type: "Active",
      cost: "15 MP",
      cooldown: "1 Turn",
      tier: "Novice",
      description: "Detonates a sphere of compressed mana outward, scattering nearby attackers and staggering enemy spellcasters.",
    },
    {
      name: "Prismatic Barrier",
      type: "Active",
      cost: "20 MP",
      cooldown: "3 Turns",
      tier: "Adept",
      description: "Weaves hexagonal crystal plates of refracted light that absorb up to 45 damage from elemental and physical blows.",
    },
    {
      name: "Leyline Conduit",
      type: "Passive",
      cost: "Passive",
      cooldown: "None",
      tier: "Novice",
      description: "Taps into underground ambient mana currents, accelerating MP regeneration by 15% during sustained combat.",
    },
  ],
  rogue: [
    {
      name: "Shadow Meld",
      type: "Active",
      cost: "10 MP",
      cooldown: "2 Turns",
      tier: "Novice",
      description: "Coats the user's silhouette in ambient gloom, increasing evasion by 30% and enabling ambush critical strikes.",
    },
    {
      name: "Ghoststrike",
      type: "Active",
      cost: "14 MP",
      cooldown: "1 Turn",
      tier: "Adept",
      description: "A lightning-fast dual-blade strike that pierces vulnerable arteries, inflicting bleeding damage that scales with DEX.",
    },
    {
      name: "Serrated Instinct",
      type: "Passive",
      cost: "Passive",
      cooldown: "None",
      tier: "Novice",
      description: "Heightens situational awareness, granting a +15% critical hit rate against foes unaware of the user's presence.",
    },
  ],
  warrior: [
    {
      name: "Causal Cleave",
      type: "Active",
      cost: "10 MP",
      cooldown: "Instant",
      tier: "Novice",
      description: "A mighty overhead swing executed with immense physical force, dealing heavy poise damage and rupturing light barriers.",
    },
    {
      name: "Ironclad Resolve",
      type: "Passive",
      cost: "Passive",
      cooldown: "None",
      tier: "Novice",
      description: "Hardens the muscles and bone density under stress; when HP drops below 40%, physical damage taken is reduced by 25%.",
    },
    {
      name: "War Cry: Unyielding",
      type: "Active",
      cost: "15 MP",
      cooldown: "3 Turns",
      tier: "Adept",
      description: "Unleashes an authoritative roar that intimidates weaker enemies while granting temporary immunity to fear and disorientation.",
    },
  ],
  paladin: [
    {
      name: "Solar Smite",
      type: "Active",
      cost: "15 MP",
      cooldown: "Instant",
      tier: "Novice",
      description: "Bathes the weapon in searing celestial fire, burning through demonic corruption and dealing bonus radiant damage.",
    },
    {
      name: "Sanctuary Aegis",
      type: "Active",
      cost: "22 MP",
      cooldown: "3 Turns",
      tier: "Adept",
      description: "Erects a consecrated perimeter of golden light that repels hostile entities and heals allies for a small percentage of max HP.",
    },
  ],
  necromancer: [
    {
      name: "Soul Leech",
      type: "Active",
      cost: "12 MP",
      cooldown: "1 Turn",
      tier: "Novice",
      description: "Grasps the target's life thread with spectral tendrils, dealing necrotic damage and siphoning 50% of the damage as HP.",
    },
    {
      name: "Grim Resonance",
      type: "Passive",
      cost: "Passive",
      cooldown: "None",
      tier: "Novice",
      description: "Feeds upon death in the immediate vicinity; slaying an enemy instantly replenishes 10 HP and 10 MP.",
    },
  ],
  default: [
    {
      name: "Second Wind",
      type: "Active",
      cost: "None",
      cooldown: "1 Battle",
      tier: "Novice",
      description: "Taps into hidden reserves of adrenaline, recovering 25 HP and dispelling minor physical fatigue.",
    },
    {
      name: "Keen Observation",
      type: "Passive",
      cost: "Passive",
      cooldown: "None",
      tier: "Novice",
      description: "The System sharpens the user's perception, exposing structural flaws in enemy stances and granting +10% hit accuracy.",
    },
  ],
};

function getLocalFallbackAbilities(role: string): AbilityDetail[] {
  const r = (role || "").toLowerCase();
  let pool = ARCHETYPE_FALLBACKS.default;

  if (r.includes("spell") || r.includes("blade") || r.includes("magic sword") || r.includes("enchanter")) {
    pool = ARCHETYPE_FALLBACKS.spellblade;
  } else if (r.includes("mage") || r.includes("wizard") || r.includes("sorcerer") || r.includes("arcan")) {
    pool = ARCHETYPE_FALLBACKS.mage;
  } else if (r.includes("rogue") || r.includes("assassin") || r.includes("shadow") || r.includes("thief") || r.includes("ninja") || r.includes("scout")) {
    pool = ARCHETYPE_FALLBACKS.rogue;
  } else if (r.includes("warrior") || r.includes("knight") || r.includes("berserk") || r.includes("gladiator") || r.includes("fighter")) {
    pool = ARCHETYPE_FALLBACKS.warrior;
  } else if (r.includes("paladin") || r.includes("holy") || r.includes("cleric") || r.includes("templar") || r.includes("priest")) {
    pool = ARCHETYPE_FALLBACKS.paladin;
  } else if (r.includes("necro") || r.includes("warlock") || r.includes("dark") || r.includes("demon") || r.includes("death")) {
    pool = ARCHETYPE_FALLBACKS.necromancer;
  }

  // Randomly pick either 1 or 2 distinct abilities
  const count = Math.random() < 0.5 ? 1 : 2;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length));
}

export async function POST(req: Request) {
  try {
    const headerKey = req.headers.get("x-user-key");
    const body = await req.json();

    const {
      role = "Adventurer",
      name = "Protagonist",
      genre = "Grimdark Visual Novel",
      settingName = "the Astra Continent",
      userAccessKey,
    } = body;

    const accessKey = headerKey || userAccessKey;
    const authCheck = validateUserKey(accessKey);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      const fallback = getLocalFallbackAbilities(role);
      return NextResponse.json({ success: true, abilities: fallback, source: "fallback" });
    }

    // Randomize requested count: 1 or 2 abilities
    const targetCount = Math.random() < 0.45 ? 1 : 2;

    const systemPrompt = `You are the LitRPG 'SYSTEM' Administrator and Archetype Architect for an interactive visual novel set in ${settingName} (Genre: ${genre}).

The protagonist is establishing their starting build:
- Name: "${name}"
- Custom Class / Archetype: "${role}"

Your mission: Dynamically author exactly ${targetCount} random, lore-accurate, and mechanically engaging starting abilities tailored specifically to this class ("${role}").
Starting abilities must feel authentic, distinct, and suitable for a Level 1 character (Novice or Adept tier).

For each ability, provide:
1. "name": Evocative, high-fantasy / LitRPG ability name (e.g., "Aether Riposte", "Shadow Veil", "Bloodbound Surge", "Void Aegis").
2. "type": "Active" | "Passive" | "Stance" | "Ultimate".
3. "cost": Resource cost (e.g. "12 MP", "15 HP", "Passive", "None").
4. "cooldown": Cooldown description (e.g. "Instant", "2 Turns", "1 Battle", "None").
5. "tier": "Novice" | "Adept" | "Unique".
6. "description": 2-3 vivid sentences describing what the ability accomplishes both mechanically and narratively.

OUTPUT FORMAT:
Respond strictly in valid JSON matching this schema:
{
  "abilities": [
    {
      "name": string,
      "type": "Active" | "Passive" | "Stance" | "Ultimate",
      "cost": string,
      "cooldown": string,
      "tier": "Novice" | "Adept" | "Unique",
      "description": string
    }
  ]
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Roll ${targetCount} random starting abilities for a ${role} named ${name}.`,
      },
    ];

    let responseData = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astra-chronicles.local",
            "X-Title": "Astra Chronicles",
          },
          body: JSON.stringify({
            model,
            messages,
            user: authCheck.user?.key || "guest",
            temperature: 0.85,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          console.warn(`Model ${model} failed for abilities (${response.status})`);
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim();

        responseData = JSON.parse(content);
        if (responseData && Array.isArray(responseData.abilities) && responseData.abilities.length > 0) {
          if (authCheck.valid && authCheck.user) {
            recordUserTurn(authCheck.user.key, data.usage, model);
          }
          break;
        }
      } catch (err: any) {
        console.warn(`Abilities error on model ${model}:`, err.message);
      }
    }

    if (responseData && Array.isArray(responseData.abilities) && responseData.abilities.length > 0) {
      // Ensure each ability has valid shape
      const cleaned = responseData.abilities.map((a: any) => ({
        name: String(a.name || "Awakened Strike"),
        type: a.type || "Active",
        cost: a.cost || "10 MP",
        cooldown: a.cooldown || "Instant",
        tier: a.tier || "Novice",
        description: String(a.description || "A foundational class technique mastered by the protagonist."),
      }));
      return NextResponse.json({ success: true, abilities: cleaned, source: "openrouter" });
    }

    // Fallback if LLM failed
    const fallback = getLocalFallbackAbilities(role);
    return NextResponse.json({ success: true, abilities: fallback, source: "fallback" });
  } catch (error: any) {
    console.error("Generate abilities error:", error);
    const fallback = getLocalFallbackAbilities("Adventurer");
    return NextResponse.json({ success: true, abilities: fallback, source: "error_fallback" });
  }
}

