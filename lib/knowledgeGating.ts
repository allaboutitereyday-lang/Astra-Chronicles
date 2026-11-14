// NPC Knowledge Gating & Anti-Metagaming Engine for Astra Chronicles
// Prevents companions from hallucinating or referencing the protagonist's name, LitRPG class,
// or Regressor/System origin in spoken dialogue before learning them diegetically in the story.

import { CompanionKnowledgeState, NpcKnowledgeMap } from "@/types/story";
import { resolvePortraitAttireLabel } from "@/lib/visionEncoder";
import { humanizeGearForProse } from "@/lib/proseSanitizer";

const CANONICAL_COMPANIONS = [
  "Evelyn Abbandonato",
  "Aria Shadowthorn",
  "Serena",
  "Morgana",
  "Perci",
  "Cassia Valen",
  "Beatrix Valorian",
  "Ysolde Kaelen",
  "Aurelia Solis",
  "Miri Thorne",
  "Noelle Vesper",
  "Kestrel Hollow",
  "Valeria Noctis",
  "Seraphina Vane",
  "Vivienne Laurent",
  "Mia Bellini",
  "Colette Moreau",
  "Pippa Reyes",
  "Kaede Tachibana",
  "Roxy Vance",
  "Chloe Lin",
  "Nadia Saint-Clair",
  "Zuri Delacroix",
];

const COMPANION_SHADOW_SECRETS: Record<string, string> = {
  "Cassia Valen":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly a stoic, honorable frontier knight fighting to buy back House Valen's title. SECRET: Her family's debt is rigged by Julian Thorne-Vex (#42), forcing her into a secret assassination contract to murder an upperclassman during the midterm delve. She will NOT confess this contract unless the protagonist uncovers Julian's blackmail or triggers a deep Soul-Grounding Memory Bleed.",
  "Beatrix Valorian":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly the haughty, ruthless #2 Ducal heiress of the Iron Chancellery. SECRET: If she finishes even one seat below Rank #1, her father will pull her from the military and force her into a political marriage with a sadistic forty-year-old count. She also secretly hoards cheap Gilded Exchange sweets and blown-glass animal figurines under her bed. Guard these secrets fiercely unless pushed into deep vulnerability.",
  "Ysolde Kaelen":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly Magistra Cross's untouchable Obsidian Choir prodigy. SECRET: She is terminally infected with stage-three Vault Calcification years ahead of schedule—her hands and wrists are marbled with glowing purple crystal beneath her elbow-length black leather gloves, and Lukas Castell (#9) is blackmailing her over it. Removing her gloves for skin-to-skin Soul-Grounding is her deepest taboo.",
  "Aurelia Solis":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly an angelic, selfless Choir healer who bakes pastries and tends wounds. SECRET: Devotion-obsessed closet yandere who subtly sabotages her partner's defensive wards so they get injured more often and must crawl back to her lap; also holds the only healing art capable of slowing Ysolde's terminal calcification and uses it as quiet leverage. Never admit the ward-sabotage outright unless caught red-handed.",
  "Miri Thorne":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly a greedy Gilded Loom loan shark squeezing highborn brats for compound interest. SECRET: She funnels every coin she squeezes from the elite into an underground railroad that smuggles 'Defaulted' scholarship students out of the city before the faculty can harvest them as Hollowed, haunted by her older brother's default.",
  "Noelle Vesper":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly an eccentric, deadpan insomniac necro-artificer. SECRET: Her hyper-sensitive brain hears the psychic static of the Under-Vault 24/7—until she touches the protagonist, whose resonance acts like soothing white noise. Her secret ambition is to reach Stratum IV to dissect the slumbering Astra god.",
  "Kestrel Hollow":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly a lazy, silver-tongued gambler and pit brawler in The Velvet Spill. SECRET: She is a collar-bound Whispering Veil enforcer under handler Silas Krowe (#19), with a lethal slave-contract brand over her left ribs that burns her alive if she defies orders to surveil or betray the protagonist.",
  "Valeria Noctis":
    "PUBLIC FACE VS. SHADOW AGENDA: Publicly a teasing third-year senior who intentionally fails her final ethics exam every spring out of hedonism. SECRET: Three years ago, her original Dyad squad was executed in Stratum IV by Prefect Aldric Drakon (#1) on faculty orders; she stays at the Academy as a spider in the web to execute the culprits in 'accidental' Midnight Tribunals.",
  "Seraphina Vane":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly the haughty Junior Chair of the Star Audit Committee sent to foreclose on The Stray Anchor. SECRET: Her father cut off her Platinum black cards until she learns 'real-world management,' forcing her to live in Room 201 and secretly crave your midnight comfort food while claiming she is only inspecting sanitation.",
  "Vivienne Laurent":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly the untouchable 'Ice Queen' heiress of the Laurent Shipping Dynasty. SECRET: She is an endearingly sheltered ditz about everyday life who sneaks away from her bodyguards to eat street-market cotton candy, play claw machines, and fold warm laundry at The Stray Anchor.",
  "Mia Bellini":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly your fierce next-door culinary competitor at Bellini Artisan Patisserie. SECRET: Your childhood friend who kept the spare key to The Stray Anchor on a ribbon around her neck for three years and gets hilariously jealous whenever Platinum Cliffs heiresses sit at your counter.",
  "Colette Moreau":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly a sultry, unflappable master mixologist who teases you relentlessly behind the bar. SECRET: She secretly writes starry-eyed, hopeless romance novels under a pen name and turns bright red whenever you accidentally recreate one of her cliché romantic tropes.",
  "Pippa Reyes":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly South Beach's fearless, trash-talking beach volleyball prodigy. SECRET: She is terrified of thunderstorms and ghost stories, and her heart rate skyrockets into the Blush Zone whenever you treat her like a desirable woman instead of a kid sister.",
  "Kaede Tachibana":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly the stoic, bushido-driven captain of the Solaris Martial Arts & Surf Club. SECRET: She has a hopeless weakness for cute stray kittens, arcade plushies, and warm steamed pork buns, and completely short-circuits at the slightest hand-holding or romantic compliment.",
  "Roxy Vance":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly the shameless, flirty paparazzi Editor-in-Chief of The Solaris Siren. SECRET: She is a total glass cannon—the moment you step inside her personal space or turn the camera lens on her with genuine sincerity, she hides behind her SLR camera in a flustered panic.",
  "Chloe Lin":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly the undefeated nocturnal arcade legend 'Zero' and Driftwood Syndicate forensic accountant. SECRET: She uses 'low battery' as an excuse to demand piggyback rides and headpats from you, and keeps a hidden folder of cozy domestic sketches of everyone at The Stray Anchor.",
  "Nadia Saint-Clair":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly the icy, ruthless Senior Heritage & Vintage Appraiser for the Platinum Cliffs Trust whose monotone 'Derivative. Two out of ten.' can ruin a five-star lounge. SECRET: She rents Room 205 at The Stray Anchor to escape suffocating high-society galas, fills her leather sketchbook with romantic charcoal drawings of you cooking under the terrace lights, and gets so flustered when you feed her straight from the pan that her gold-chained spectacles completely fog up.",
  "Zuri Delacroix":
    "PUBLIC PERSONA VS. ROM-COM WEAKNESS: Publicly Sunset Rambla's charismatic, slow-smiling botanical gelato and ceremonial matcha alchemist who loves leaning over the counter to tease you with 'pulse-spiking' tastings. SECRET: Despite her playful swagger in Room 206, she has zero defense against direct, earnest physical affection—wiping cream from her lip or holding her gaze makes her squeak and pull her thick green twin braids over her blushing face like a curtain.",
};

/**
 * Creates a fresh NpcKnowledgeMap where all companions begin with zero meta-knowledge
 * of the protagonist's name, LitRPG class, or Regressor/System origin.
 */
export function createDefaultNpcKnowledgeMap(
  companions?: { name: string }[]
): NpcKnowledgeMap {
  const map: NpcKnowledgeMap = {};

  for (const name of CANONICAL_COMPANIONS) {
    map[name] = {
      knowsName: false,
      knowsClass: false,
      knowsOrigin: false,
    };
  }

  if (Array.isArray(companions)) {
    for (const comp of companions) {
      if (comp?.name && !map[comp.name]) {
        map[comp.name] = {
          knowsName: false,
          knowsClass: false,
          knowsOrigin: false,
        };
      }
    }
  }

  return map;
}

/**
 * Resolves the canonical key in npcKnowledgeMap for a given companion name (case-insensitive / partial match).
 */
export function resolveCompanionKnowledgeKey(
  map: NpcKnowledgeMap,
  companionName: string
): string {
  const cleanTarget = (companionName || "").trim();
  if (!cleanTarget) return "Unknown";

  if (map[cleanTarget]) return cleanTarget;

  const lower = cleanTarget.toLowerCase();
  const existingKey = Object.keys(map).find(
    (k) =>
      k.toLowerCase() === lower ||
      k.toLowerCase().includes(lower) ||
      lower.includes(k.toLowerCase())
  );

  return existingKey || cleanTarget;
}

/**
 * Returns the knowledge state for a specific companion, defaulting to all false if not yet recorded.
 */
export function getCompanionKnowledge(
  map: NpcKnowledgeMap | null | undefined,
  companionName: string
): CompanionKnowledgeState {
  if (!map || !companionName) {
    return { knowsName: false, knowsClass: false, knowsOrigin: false };
  }
  const key = resolveCompanionKnowledgeKey(map, companionName);
  return (
    map[key] || {
      knowsName: false,
      knowsClass: false,
      knowsOrigin: false,
    }
  );
}

/**
 * Evaluates a player's action/dialogue string to detect if they explicitly introduce their name,
 * declare/demonstrate their LitRPG class, or reveal their Regressor/System origin to present companions.
 */
export function evaluateActionForKnowledgeUnlocks(
  actionText: string,
  playerName: string,
  playerRole: string,
  playerAbilities: string[],
  presentCompanionNames: string[],
  currentMap?: NpcKnowledgeMap | null
): {
  updatedMap: NpcKnowledgeMap;
  newlyUnlocked: { companion: string; field: keyof CompanionKnowledgeState }[];
} {
  const baseMap: NpcKnowledgeMap = {
    ...createDefaultNpcKnowledgeMap(),
    ...(currentMap || {}),
  };

  if (!actionText || presentCompanionNames.length === 0) {
    return { updatedMap: baseMap, newlyUnlocked: [] };
  }

  const lowerAction = actionText.toLowerCase();
  const cleanName = (playerName || "").trim().toLowerCase();
  const cleanRole = (playerRole || "").trim().toLowerCase();

  // 1. Detect Name Introduction
  const nameIntroPatterns = [
    /\bmy name is\b/i,
    /\bi am called\b/i,
    /\bcall me\b/i,
    /\bintroduce yourself\b/i,
    /\bintroduce myself\b/i,
    /\bstate my name\b/i,
    /\btell her my name\b/i,
    /\bgive her my name\b/i,
  ];
  const mentionsOwnName =
    cleanName.length >= 2 &&
    new RegExp(`\\b${cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      actionText
    );
  const revealsName =
    mentionsOwnName || nameIntroPatterns.some((pat) => pat.test(actionText));

  // 2. Detect Class / Archetype Disclosure or Signature Skill Usage
  const mentionsOwnRole =
    cleanRole.length >= 3 &&
    new RegExp(`\\b${cleanRole.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      actionText
    );
  const usesSignatureAbility =
    Array.isArray(playerAbilities) &&
    playerAbilities.some(
      (ab) => ab && ab.length >= 4 && lowerAction.includes(ab.toLowerCase())
    );
  const classIntroPatterns = [
    /\bmy class is\b/i,
    /\btrained as a\b/i,
    /\bunleash my class\b/i,
  ];
  const revealsClass =
    mentionsOwnRole ||
    usesSignatureAbility ||
    classIntroPatterns.some((pat) => pat.test(actionText));

  // 3. Detect Origin / Regressor / System Disclosure
  const originPatterns = [
    /\bregress(or|ed|ion)\b/i,
    /\bprevious (timeline|loop|life)\b/i,
    /\bfuture memory\b/i,
    /\bsystem administrator\b/i,
    /\bcausal covenant\b/i,
    /\breality severance\b/i,
    /\bi have seen this before\b/i,
    /\bi came back from death\b/i,
  ];
  const revealsOrigin = originPatterns.some((pat) => pat.test(actionText));

  const newlyUnlocked: { companion: string; field: keyof CompanionKnowledgeState }[] = [];

  for (const compName of presentCompanionNames) {
    const key = resolveCompanionKnowledgeKey(baseMap, compName);
    const current = baseMap[key] || {
      knowsName: false,
      knowsClass: false,
      knowsOrigin: false,
    };
    const next = { ...current };

    if (revealsName && !next.knowsName) {
      next.knowsName = true;
      newlyUnlocked.push({ companion: key, field: "knowsName" });
    }
    if (revealsClass && !next.knowsClass) {
      next.knowsClass = true;
      newlyUnlocked.push({ companion: key, field: "knowsClass" });
    }
    if (revealsOrigin && !next.knowsOrigin) {
      next.knowsOrigin = true;
      newlyUnlocked.push({ companion: key, field: "knowsOrigin" });
    }

    baseMap[key] = next;
  }

  return { updatedMap: baseMap, newlyUnlocked };
}

/**
 * Merges LLM-reported knowledge unlock flags (`knowledge_unlocked`) into the NpcKnowledgeMap
 * for all physically present companions.
 */
export function applyLlmKnowledgeUnlocks(
  currentMap: NpcKnowledgeMap,
  presentCompanionNames: string[],
  llmUnlocks?: Partial<CompanionKnowledgeState> | null
): NpcKnowledgeMap {
  if (!llmUnlocks || presentCompanionNames.length === 0) return currentMap;

  const nextMap: NpcKnowledgeMap = { ...currentMap };
  for (const compName of presentCompanionNames) {
    const key = resolveCompanionKnowledgeKey(nextMap, compName);
    const prev = nextMap[key] || {
      knowsName: false,
      knowsClass: false,
      knowsOrigin: false,
    };
    nextMap[key] = {
      knowsName: prev.knowsName || Boolean(llmUnlocks.knowsName),
      knowsClass: prev.knowsClass || Boolean(llmUnlocks.knowsClass),
      knowsOrigin: prev.knowsOrigin || Boolean(llmUnlocks.knowsOrigin),
    };
  }
  return nextMap;
}

/**
 * Compiles the dynamic Anti-Metagaming System Prompt Directive for `/api/prologue` and `/api/turn`.
 * Explicitly masks unknown protagonist variables from NPC dialogue and forbids meta-knowledge hallucinations.
 */
export function buildKnowledgeGateDirective(
  npcKnowledgeMap: NpcKnowledgeMap | null | undefined,
  presentCompanionNames: string[],
  playerProfile: {
    name?: string;
    role?: string;
    level?: number;
    gear?: { weapon?: string; armor?: string; relic?: string };
  }
): string {
  const playerName = playerProfile?.name || "the protagonist";
  const playerRole = playerProfile?.role || "Wanderer";
  const portraitAttire = resolvePortraitAttireLabel(
    (playerProfile as any)?.visualDna,
    (playerProfile as any)?.visualDescription,
    "portrait attire"
  );
  const visibleWeapon = humanizeGearForProse(playerProfile?.gear?.weapon, "unarmed stance");
  const visibleArmor = humanizeGearForProse(playerProfile?.gear?.armor, portraitAttire);

  if (!presentCompanionNames || presentCompanionNames.length === 0) {
    return `--- PROTAGONIST IDENTITY CONTEXT (SOLO SCENE) ---
- Protagonist Name: ${playerName}
- Archetype: ${playerRole} (Lv.${playerProfile?.level || 1})
- Visible Gear: ${visibleWeapon} / ${visibleArmor}`;
  }

  const companionRules = presentCompanionNames.map((compName) => {
    const k = getCompanionKnowledge(npcKnowledgeMap, compName);

    const nameRule = k.knowsName
      ? `[SYSTEM UNLOCKED: ${compName} knows the protagonist's name is "${playerName}". She may address "${playerName}" by name in spoken dialogue.]`
      : `[SYSTEM LOCK — NAME UNKNOWN: ${compName} does NOT know the protagonist's name ("${playerName}").]
   * STRICT DIALOGUE PROHIBITION: ${compName} MUST NEVER speak, whisper, or address the protagonist as "${playerName}" inside quotation marks ("...").
   * REQUIRED FORM OF ADDRESS: In spoken dialogue, ${compName} must refer to the protagonist only as "stranger", "wanderer", "traveler", "intriguer", "outsider", or by their visible gear (${visibleWeapon} / ${visibleArmor}).`;

    const classRule = k.knowsClass
      ? `[SYSTEM UNLOCKED: ${compName} knows the protagonist's LitRPG Class/Archetype is "${playerRole}".]`
      : `[SYSTEM LOCK — CLASS UNKNOWN: ${compName} does NOT know the protagonist's internal LitRPG Class ("${playerRole}").]
   * STRICT DIALOGUE PROHIBITION: ${compName} MUST NOT name or assume the class title "${playerRole}" in dialogue unless the protagonist explicitly declares it this turn. She may only judge what is visibly apparent (${visibleWeapon} and ${visibleArmor}).`;

    const originRule = k.knowsOrigin
      ? `[SYSTEM UNLOCKED: ${compName} is aware of the protagonist's Regressor / System Anchor nature.]`
      : `[SYSTEM LOCK — ORIGIN UNKNOWN: ${compName} does NOT know the protagonist is bound to the System Administrator or retains Regressor timeline memories.]`;

    const shadowKey = Object.keys(COMPANION_SHADOW_SECRETS).find(
      (sk) => sk.toLowerCase() === compName.toLowerCase() || compName.toLowerCase().includes(sk.split(" ")[0].toLowerCase())
    );
    const shadowSecretRule = shadowKey
      ? `\n  4. [COMPANION SHADOW AGENDA & SECRET GATE]: ${COMPANION_SHADOW_SECRETS[shadowKey]}`
      : "";

    return `Companion "${compName}" Diegetic Knowledge State:
  1. ${nameRule}
  2. ${classRule}
  3. ${originRule}${shadowSecretRule}`;
  });

  return `--- STRICT ANTI-METAGAMING & DIEGETIC NPC KNOWLEDGE GATE (MANDATORY) ---
CRITICAL EPISTEMIC BOUNDARY: You must strictly separate what the Third-Person Narrator knows from what NPCs know in character!
- Third-person narrative prose OUTSIDE quotation marks may refer to ${playerName} to describe physical movements.
- Inside spoken dialogue ("..."), each companion is strictly bound by their Diegetic Knowledge State below. Hallucinating unlearned names or LitRPG classes in NPC speech is a critical violation.

${companionRules.join("\n\n")}`;
}

/**
 * Post-generation fail-safe: If the active speaker does NOT know the protagonist's name (`knowsName === false`),
 * scans only spoken dialogue substrings inside double quotes ("...") and replaces any accidental leak of `playerName`
 * with "stranger" so the companion never meta-games the player's name.
 */
export function enforceSpokenDialogueMasking(
  text: string,
  playerName: string | undefined,
  knowsName: boolean
): string {
  if (!text || knowsName || !playerName) return text;
  const cleanName = playerName.trim();
  if (cleanName.length < 2) return text;

  const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRegex = new RegExp(`\\b${escapedName}\\b`, "gi");

  // Only replace occurrences of playerName that appear INSIDE double quotation marks ("...")
  return text.replace(/"([^"\n]+)"/g, (fullQuote, innerSpeech) => {
    if (!nameRegex.test(innerSpeech)) return fullQuote;
    const maskedSpeech = innerSpeech.replace(nameRegex, "stranger");
    return `"${maskedSpeech}"`;
  });
}

