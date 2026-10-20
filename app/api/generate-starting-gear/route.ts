import { NextResponse } from "next/server";
import { validateUserKey, recordUserTurn } from "@/lib/userAccess";

export const runtime = "nodejs";

const FAST_LLM_MODELS = [
  "deepseek/deepseek-v4-flash",
  "z-ai/glm-5.3-flash",
  "nvidia/nemotron-3.5-lightning:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
];

export interface GeneratedGearPiece {
  id: string;
  name: string;
  type: "weapon" | "armor" | "relic";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  effect: string;
  description: string;
  imagePrompt?: string;
  imageUrl?: string;
}

const ARCHETYPE_FALLBACK_GEAR: Record<string, GeneratedGearPiece[]> = {
  spellblade: [
    {
      id: "gear_spellblade_weapon",
      name: "Aether-Forged Runeblade",
      type: "weapon",
      rarity: "rare",
      effect: "+5 STR, +4 INT, Arcane Slash Conversion",
      description: "A ceremonial runic longsword forged from meteorite iron. Its fuller glows with azure leyline script that converts physical slashes into piercing planar cuts.",
      imagePrompt: "Game inventory icon of Aether-Forged Runeblade, glowing azure rune engravings on sharp steel edge, isolated dark background, RPG game asset",
    },
    {
      id: "gear_spellblade_armor",
      name: "Mantle of the Planar Weave",
      type: "armor",
      rarity: "uncommon",
      effect: "+20 Max MP, +10% Magic Resistance",
      description: "Reinforced midnight-blue leather cuirass studded with null-aether scales. Designed for agile spellswords who dodge through spatial folds.",
      imagePrompt: "Game inventory icon of Mantle of the Planar Weave, deep blue enchanted leather armor with silver rivets, isolated dark background, RPG game asset",
    },
    {
      id: "gear_spellblade_relic",
      name: "Chrono-Drift Gyroscope",
      type: "relic",
      rarity: "relic",
      effect: "+10% Cooldown Recovery, +1 Plausibility Anchor",
      description: "An intricate brass spherical talisman containing trapped chronal sand from a collapsed timeline. It gently stabilizes the wearer's causal coherence.",
      imagePrompt: "Game inventory icon of Chrono-Drift Gyroscope, intricate brass sphere with glowing amber sands inside, isolated dark background, RPG game asset",
    },
  ],
  mage: [
    {
      id: "gear_mage_weapon",
      name: "Staff of the Astral Gyre",
      type: "weapon",
      rarity: "rare",
      effect: "+7 INT, +25 Max MP, +8% Spell Piercing",
      description: "Carved from petrified world-tree heartwood, crowned by a levitating celestial starlight shard that hums with raw concentrated arcane power.",
      imagePrompt: "Game inventory icon of Staff of the Astral Gyre, levitating glowing purple crystal on twisted wood staff, isolated dark background, RPG game asset",
    },
    {
      id: "gear_mage_armor",
      name: "Robes of Leyline Inscription",
      type: "armor",
      rarity: "uncommon",
      effect: "+25 Max MP, +5 MP Regen on Turn Start",
      description: "Tailored from enchanted gossamer silk woven with starlight silver thread that constantly absorbs ambient ambient aether to restore mana.",
      imagePrompt: "Game inventory icon of Robes of Leyline Inscription, elegant dark purple robes with glowing silver embroidery, isolated dark background, RPG game asset",
    },
    {
      id: "gear_mage_relic",
      name: "Tear of the Arcane Horizon",
      type: "relic",
      rarity: "relic",
      effect: "+15% Elemental Stagger, +5 INT",
      description: "A tear-shaped sapphire pendant containing crystallised planar aether. Enhances the user's resonance with multi-elemental spellcraft.",
      imagePrompt: "Game inventory icon of Tear of the Arcane Horizon, glowing tear-shaped blue crystal pendant with gold chain, isolated dark background, RPG game asset",
    },
  ],
  rogue: [
    {
      id: "gear_rogue_weapon",
      name: "Shadow-Veil Stiletto & Kris",
      type: "weapon",
      rarity: "rare",
      effect: "+6 DEX, +15% Critical Strike Multiplier",
      description: "Paired daggers forged from midnight obsidian. The blades actively drink ambient light, masking their strike trajectory until flesh is severed.",
      imagePrompt: "Game inventory icon of Shadow-Veil Stiletto paired daggers, smoky black blades with purple edges, isolated dark background, RPG game asset",
    },
    {
      id: "gear_rogue_armor",
      name: "Nightstalker's Whisper Vest",
      type: "armor",
      rarity: "uncommon",
      effect: "+4 DEX, +20% Evasion against Ranged Blows",
      description: "Supple chimera hide treated with sound-dampening shadow oils, allowing the wearer to sprint over broken glass without a whisper.",
      imagePrompt: "Game inventory icon of Nightstalker's Whisper Vest, sleek black leather assassin vest with silver buckles, isolated dark background, RPG game asset",
    },
    {
      id: "gear_rogue_relic",
      name: "Ring of the Phantom Step",
      type: "relic",
      rarity: "relic",
      effect: "+10% Critical Rate, Minor Phase Shift",
      description: "A jagged dark ring with an inner void rune that briefly phases the bearer's heartbeat into an alternate reality to avoid lethal retaliation.",
      imagePrompt: "Game inventory icon of Ring of the Phantom Step, dark obsidian ring with glowing violet eye engraving, isolated dark background, RPG game asset",
    },
  ],
  warrior: [
    {
      id: "gear_warrior_weapon",
      name: "Causal Greatsword: Ruin",
      type: "weapon",
      rarity: "rare",
      effect: "+8 STR, +25% Poise Stagger Damage",
      description: "A colossal notched slab of primordial dark steel salvaged from the ruins of the First Cataclysm. Deals overwhelming poise damage.",
      imagePrompt: "Game inventory icon of Causal Greatsword Ruin, massive battle-worn greatsword with glowing crimson runes, isolated dark background, RPG game asset",
    },
    {
      id: "gear_warrior_armor",
      name: "Plate of the Iron Vanguard",
      type: "armor",
      rarity: "uncommon",
      effect: "+35 Max HP, -15% Physical Damage Taken",
      description: "Heavy masterwork steel breastplate tempered in dragon blood. Features thick beveled edges that deflect glancing blows with ease.",
      imagePrompt: "Game inventory icon of Plate of the Iron Vanguard, heavy steel knight cuirass with golden trim, isolated dark background, RPG game asset",
    },
    {
      id: "gear_warrior_relic",
      name: "Sigil of Unyielding Resolve",
      type: "relic",
      rarity: "relic",
      effect: "+4 STR, +10 HP Surge on Turn 1",
      description: "A battle-charred iron medallion smelling of ozone and burning aether, awakening fierce martial resilience when cornered.",
      imagePrompt: "Game inventory icon of Sigil of Unyielding Resolve, heavy iron crest with glowing orange war sigil, isolated dark background, RPG game asset",
    },
  ],
  paladin: [
    {
      id: "gear_paladin_weapon",
      name: "Dawnblade of the Radiant Order",
      type: "weapon",
      rarity: "rare",
      effect: "+5 STR, +4 INT, +15 Radiant Damage",
      description: "A consecrated broadsword infused with pure dawnlight. Slices through demonic corruption and creates bursts of blinding brilliance.",
      imagePrompt: "Game inventory icon of Dawnblade of the Radiant Order, shining golden holy sword with radiant glow, isolated dark background, RPG game asset",
    },
    {
      id: "gear_paladin_armor",
      name: "Cuirass of the Solar Bulwark",
      type: "armor",
      rarity: "uncommon",
      effect: "+25 Max HP, +15 Max MP, Holy Ward",
      description: "Mirrored white-gold armor polished to perfection. Emits a continuous warm radiance that repels planar miasma and dark curses.",
      imagePrompt: "Game inventory icon of Cuirass of the Solar Bulwark, radiant silver and gold armor with sun emblem, isolated dark background, RPG game asset",
    },
    {
      id: "gear_paladin_relic",
      name: "Pendant of the Seraphic Vow",
      type: "relic",
      rarity: "relic",
      effect: "+10% Healing Received, +5% Party Shield Passive",
      description: "A consecrated sunstone jewel blessed by the Dawn Sanctuary. Bolsters protective barriers when standing beside companions.",
      imagePrompt: "Game inventory icon of Pendant of the Seraphic Vow, brilliant amber gemstone set in winged gold casing, isolated dark background, RPG game asset",
    },
  ],
  necromancer: [
    {
      id: "gear_necro_weapon",
      name: "Scythe of the Soul-Tithe",
      type: "weapon",
      rarity: "rare",
      effect: "+7 INT, +15% Soul Leech Siphon",
      description: "Forged from blackened bone and grave-iron. Trails ghostly emerald mist and siphons fragments of enemy vitality into the wielder.",
      imagePrompt: "Game inventory icon of Scythe of the Soul-Tithe, eerie bone scythe blade with pale green ghost flames, isolated dark background, RPG game asset",
    },
    {
      id: "gear_necro_armor",
      name: "Shroud of the Crypt-Weaver",
      type: "armor",
      rarity: "uncommon",
      effect: "+15 Max HP, +20 Max MP, Necrotic Ward",
      description: "Tattered robes woven from spectral threads and etched bone beads. Disperses hostile elemental kinetic energy into the nether.",
      imagePrompt: "Game inventory icon of Shroud of the Crypt-Weaver, tattered dark gray necromancer cloak with bone charms, isolated dark background, RPG game asset",
    },
    {
      id: "gear_necro_relic",
      name: "Phylactery Fragment of the Nether Void",
      type: "relic",
      rarity: "relic",
      effect: "Survive 1 lethal blow with 1 HP per battle",
      description: "A chipped onyx phylactery holding an immortal spark. Feeds upon ambient demise to anchor the wielder's soul across fatal blows.",
      imagePrompt: "Game inventory icon of Phylactery Fragment of the Nether Void, fractured black diamond pulsing with green necrotic glow, isolated dark background, RPG game asset",
    },
  ],
  default: [
    {
      id: "gear_default_weapon",
      name: "Astra Masterwork Edge",
      type: "weapon",
      rarity: "rare",
      effect: "+5 STR, +4 DEX, +8% Critical Chance",
      description: "A finely balanced weapon crafted by master artisans of the Imperial Capital. Features keen double-beveled edges suited for versatile combat.",
      imagePrompt: "Game inventory icon of Astra Masterwork Edge, perfectly polished steel blade with gold crossguard, isolated dark background, RPG game asset",
    },
    {
      id: "gear_default_armor",
      name: "Traveler's Reinforced Cuirass",
      type: "armor",
      rarity: "uncommon",
      effect: "+25 Max HP, +10 Max MP, +5% Movement Speed",
      description: "Heavy treated leather layered with interlocking steel rings. Offers superb mobility and defense across hazardous frontiers.",
      imagePrompt: "Game inventory icon of Traveler's Reinforced Cuirass, studded brown leather and steel scale armor, isolated dark background, RPG game asset",
    },
    {
      id: "gear_default_relic",
      name: "Wanderer's Causal Astrolabe",
      type: "relic",
      rarity: "relic",
      effect: "+5% Loot Discovery, +5% Plausibility Stability",
      description: "An anomalous pocket chronometer whose needle spins toward moments of destiny and hidden relics.",
      imagePrompt: "Game inventory icon of Wanderer's Causal Astrolabe, antique brass celestial compass with spinning blue rings, isolated dark background, RPG game asset",
    },
  ],
};

function getLocalFallbackGear(role: string): GeneratedGearPiece[] {
  const r = (role || "").toLowerCase();
  let pool = ARCHETYPE_FALLBACK_GEAR.default;

  if (r.includes("spell") || r.includes("blade") || r.includes("magic sword") || r.includes("enchanter")) {
    pool = ARCHETYPE_FALLBACK_GEAR.spellblade;
  } else if (r.includes("mage") || r.includes("wizard") || r.includes("sorcerer") || r.includes("arcan")) {
    pool = ARCHETYPE_FALLBACK_GEAR.mage;
  } else if (r.includes("rogue") || r.includes("assassin") || r.includes("shadow") || r.includes("thief") || r.includes("ninja") || r.includes("scout")) {
    pool = ARCHETYPE_FALLBACK_GEAR.rogue;
  } else if (r.includes("warrior") || r.includes("knight") || r.includes("berserk") || r.includes("gladiator") || r.includes("fighter")) {
    pool = ARCHETYPE_FALLBACK_GEAR.warrior;
  } else if (r.includes("paladin") || r.includes("holy") || r.includes("cleric") || r.includes("templar") || r.includes("priest")) {
    pool = ARCHETYPE_FALLBACK_GEAR.paladin;
  } else if (r.includes("necro") || r.includes("warlock") || r.includes("dark") || r.includes("demon") || r.includes("death")) {
    pool = ARCHETYPE_FALLBACK_GEAR.necromancer;
  }

  return pool.map((item) => ({
    ...item,
    id: `${item.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  }));
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
      const fallback = getLocalFallbackGear(role);
      return NextResponse.json({ success: true, gear: fallback, source: "fallback" });
    }

    const systemPrompt = `You are the LitRPG 'SYSTEM' Administrator and Armament Architect for an interactive visual novel set in ${settingName} (Genre: ${genre}).

The protagonist has selected 'System Choice' for their starting loadout:
- Protagonist Name: "${name}"
- Custom Class / Archetype: "${role}"

Your mission: Synthesize exactly 3 distinct, lore-authentic, and mechanically rewarding pieces of starting equipment tailored specifically to the protagonist's class ("${role}").
The 3 pieces MUST be:
1. One starting Weapon (e.g., blade, staff, twin daggers, greatsword, scythe, bow, grimoire).
2. One starting Armor piece (e.g., cuirass, robes, mantle, light stealth garb, plate).
3. One starting Relic or Accessory (e.g., ring, gyroscope, amulet, talisman, brooch).

For each piece of gear, provide:
- "name": Evocative, high-fantasy / LitRPG equipment title (e.g., "Aether-Forged Runeblade", "Shroud of the Crypt-Weaver", "Ring of the Phantom Step").
- "type": "weapon" | "armor" | "relic"
- "rarity": "uncommon" | "rare" | "relic"
- "effect": Specific tactical stat bonus or combat modifier (e.g., "+6 STR, +15% Poise Stagger", "+20 Max MP, +5 MP Regen", "+10% Critical Rate").
- "description": 2-3 vivid sentences describing its craftsmanship, magical aura, historical origin, and how it channels the protagonist's class abilities.
- "imagePrompt": A detailed prompt for a game inventory asset icon (e.g., "Game inventory icon of [Item Name], [details], isolated dark slate background, RPG icon").

OUTPUT FORMAT:
Respond strictly in valid JSON matching this schema:
{
  "gear": [
    {
      "name": string,
      "type": "weapon",
      "rarity": "uncommon" | "rare" | "relic",
      "effect": string,
      "description": string,
      "imagePrompt": string
    },
    {
      "name": string,
      "type": "armor",
      "rarity": "uncommon" | "rare" | "relic",
      "effect": string,
      "description": string,
      "imagePrompt": string
    },
    {
      "name": string,
      "type": "relic",
      "rarity": "uncommon" | "rare" | "relic",
      "effect": string,
      "description": string,
      "imagePrompt": string
    }
  ]
}`;

    let lastError = null;

    for (const model of FAST_LLM_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astra-chronicles.local",
            "X-Title": "Astra Chronicles Gear Architect",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Generate the 3 pieces of starting System Choice gear for a Level 1 ${role} named ${name}. Output strictly JSON.`,
              },
            ],
            temperature: 0.75,
            max_tokens: 1200,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Model ${model} returned error ${response.status}: ${errText.slice(0, 160)}`);
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;

        let parsed: any = null;
        try {
          parsed = JSON.parse(content);
        } catch {
          const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
          parsed = JSON.parse(cleaned);
        }

        if (parsed && Array.isArray(parsed.gear) && parsed.gear.length === 3) {
          if (authCheck.valid && accessKey) {
            recordUserTurn(accessKey);
          }

          const finalizedGear: GeneratedGearPiece[] = parsed.gear.map((g: any, idx: number) => ({
            id: `gear_start_${g.type || "relic"}_${Date.now()}_${idx}`,
            name: g.name || `Class Armament #${idx + 1}`,
            type: (g.type === "weapon" || g.type === "armor" || g.type === "relic") ? g.type : (idx === 0 ? "weapon" : idx === 1 ? "armor" : "relic"),
            rarity: (g.rarity === "uncommon" || g.rarity === "rare" || g.rarity === "relic") ? g.rarity : "rare",
            effect: g.effect || "+5 All Attributes",
            description: g.description || "A powerful starting armament manifested by the System.",
            imagePrompt: g.imagePrompt || `Game inventory icon of ${g.name}, isolated dark background, RPG asset`,
          }));

          return NextResponse.json({
            success: true,
            gear: finalizedGear,
            source: model,
          });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Error generating gear with ${model}:`, err.message);
      }
    }

    // Fallback if all models fail
    console.warn("All LLM gear models failed. Returning local fallback gear:", lastError?.message);
    const fallback = getLocalFallbackGear(role);
    return NextResponse.json({ success: true, gear: fallback, source: "fallback" });
  } catch (err: any) {
    console.error("Critical error in /api/generate-starting-gear:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate gear." },
      { status: 500 }
    );
  }
}
