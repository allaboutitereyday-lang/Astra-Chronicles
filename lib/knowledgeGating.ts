// NPC Knowledge Gating & Anti-Metagaming Engine for Astra Chronicles
// Prevents companions from hallucinating or referencing the protagonist's name, LitRPG class,
// or Regressor/System origin in spoken dialogue before learning them diegetically in the story.

import { CompanionKnowledgeState, NpcKnowledgeMap } from "@/types/story";

const CANONICAL_COMPANIONS = [
  "Evelyn Abbandonato",
  "Aria Shadowthorn",
  "Serena",
  "Morgana",
  "Perci",
];

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
  const visibleWeapon = playerProfile?.gear?.weapon || "unarmed stance";
  const visibleArmor = playerProfile?.gear?.armor || "traveler attire";

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

    return `Companion "${compName}" Diegetic Knowledge State:
  1. ${nameRule}
  2. ${classRule}
  3. ${originRule}`;
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

