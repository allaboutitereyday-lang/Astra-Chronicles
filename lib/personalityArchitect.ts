export interface PersonalityPreset {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  description: string;
  defaultTraits: string[];
}

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: "stoic",
    name: "Stoic Pragmatist",
    shortLabel: "Stoic",
    icon: "🛡️",
    description: "Calculated, survival-focused, unflinching composure. Speaks with cold efficiency.",
    defaultTraits: ["Calculated", "Unflinching", "Efficient", "Vigilant"],
  },
  {
    id: "noble",
    name: "Noble Protector",
    shortLabel: "Noble",
    icon: "⚔️",
    description: "Honorable, gallant, protective of allies. Stands firmly against injustice and cruelty.",
    defaultTraits: ["Honorable", "Protective", "Righteous", "Valiant"],
  },
  {
    id: "cynical",
    name: "Cynical Outlaw",
    shortLabel: "Cynical",
    icon: "🗡️",
    description: "Sharp-tongued, opportunistic, skeptical. Prioritizes tactical advantage and survival.",
    defaultTraits: ["Cynical", "Deadpan Wit", "Opportunistic", "Self-Reliant"],
  },
  {
    id: "scholar",
    name: "Enigmatic Scholar",
    shortLabel: "Scholar",
    icon: "📜",
    description: "Intellectual, analytical, curious about forbidden arcana, planar anomalies, and ancient lore.",
    defaultTraits: ["Analytical", "Inquisitive", "Arcane Focus", "Observant"],
  },
  {
    id: "daredevil",
    name: "Passionate Daredevil",
    shortLabel: "Daredevil",
    icon: "🔥",
    description: "Bold, emotionally fierce, leaps into danger with defiant grit and raw loyalty.",
    defaultTraits: ["Defiant", "Bold", "Hot-Blooded", "Fierce Loyalty"],
  },
  {
    id: "trickster",
    name: "Sly Trickster",
    shortLabel: "Trickster",
    icon: "🎭",
    description: "Playful, deceptive, charming. Turns perilous situations around with cunning wit.",
    defaultTraits: ["Charming", "Deceptive", "Bantering", "Unpredictable"],
  },
  {
    id: "custom",
    name: "Custom Persona",
    shortLabel: "Custom",
    icon: "✨",
    description: "Craft your own custom demeanor, moral code, and conversational mannerisms.",
    defaultTraits: [],
  },
];

export interface DynamicChoiceContext {
  playerName: string;
  playerRole: string;
  playerRace?: string;
  racialTraits?: string[];
  personality?: string;
  personalityTraits?: string[];
  behavioralTendencies?: Record<string, number>;
  activeStance?: string;
  abilities?: string[];
  location: string;
  activeSpeaker: string;
  latestDialogue?: string;
  mood?: string;
  isProtagonistAlone: boolean;
  presentHeroineNames: string[];
}

/**
 * Builds the authoritative Dynamic Choice Authoring Directive for LLM prompts.
 * Enforces dynamic adaptation to scene stakes, player personality, moral counterpoints, and racial/class traits.
 */
export function buildDynamicChoiceDirective(ctx: DynamicChoiceContext): string {
  const personaName = ctx.personality || "Pragmatic Adventurer";
  const traits = (ctx.personalityTraits && ctx.personalityTraits.length > 0)
    ? ctx.personalityTraits.join(", ")
    : "Alert, Self-reliant, Resourceful";

  // Identify dominant emergent tendency if tracked
  let dominantTendency = "";
  if (ctx.behavioralTendencies && Object.keys(ctx.behavioralTendencies).length > 0) {
    const sorted = Object.entries(ctx.behavioralTendencies).sort((a, b) => b[1] - a[1]);
    if (sorted[0] && sorted[0][1] > 0) {
      dominantTendency = sorted[0][0].toUpperCase();
    }
  }

  const raceAnatomy = (ctx.racialTraits && ctx.racialTraits.length > 0)
    ? ctx.racialTraits.join(", ")
    : (ctx.playerRace && ctx.playerRace.toLowerCase() !== "human" ? `${ctx.playerRace} physiology` : "Standard physiology");

  const abilitiesSnippet = (ctx.abilities && ctx.abilities.length > 0)
    ? ctx.abilities.slice(0, 3).join(", ")
    : "Martial prowess";

  const companionClause = ctx.isProtagonistAlone
    ? `The protagonist is PHYSICALLY ALONE in ${ctx.location}. Never address or converse with absent companions.`
    : `Accompanied by: ${ctx.presentHeroineNames.join(", ")}. Choices can converse with, protect, command, or banter with present allies.`;

  return `--- DYNAMIC 4-CHOICE SCENE & PERSONALITY DIRECTIVE (MANDATORY) ---
The player is actively CRAFTING the identity and personality of ${ctx.playerName}:
- Archetype & Class: ${ctx.playerRole} | Lineage: ${ctx.playerRace || "Human"}
- Crafted Personality / Demeanor: "${personaName}"
- Key Persona Traits: [${traits}]
${dominantTendency ? `- Emergent Behavioral Alignment: [${dominantTendency} TENDENCY]\n` : ""}- Physical Lineage & Anatomical Traits: [${raceAnatomy}]
- Tactical Stance / Active Arts: [${(ctx.activeStance || "Neutral").toUpperCase()} Stance | ${abilitiesSnippet}]
- Scene Context: ${companionClause}

SCENE-AWARE & STORY-PROGRESSIVE AUTHORING INSTRUCTIONS (CRITICAL):
Do NOT generate static, repetitive, or passive options that keep the characters standing in the same place talking.
Every single choice MUST actively push the story forward, alter the physical or tactical state, and channel ${ctx.playerName}'s crafted persona ("${personaName}" — [${traits}]):

1. [OPTION 1 - DECISIVE SCENE TRAVERSAL / PHYSICAL PROGRESSION]:
   - Physically moves ${ctx.playerName}${ctx.isProtagonistAlone ? "" : ` and ${ctx.presentHeroineNames[0] || "their companion"}`} to a new vantage point, across an obstacle, or through a threshold in ${ctx.location} (e.g. vaulting across rooftops, slipping into an undercroft grate, breaching a chamber door, advancing down a shadowed corridor).
   - Must combine concrete physical movement with ${ctx.playerName}'s "${personaName}" demeanor.

2. [OPTION 2 - TACTICAL COUNTERMEASURE / ENVIRONMENTAL ENGAGEMENT]:
   - Actively manipulates the environment or confronts the immediate threat/puzzle (e.g. setting an ambush, extinguishing lanterns for stealth, disarming a ward, seizing high ground, or drawing steel to intercept pursuers).

3. [OPTION 3 - PROGRESSIVE INTERPERSONAL / PLOT ESCALATION DIALOGUE]:
   - Pushes the conversation into NEW territory: demanding actionable intel, deciding on a specific escape/attack route, striking a binding bargain, or confronting an unspoken secret.
   - STRICT ANTI-REPETITION RULE: NEVER generate redundant reassurance or vows already spoken (e.g. do NOT repeat "You're safe with me", "Hold tight", or "I won't let them take you"). Once comfort is given, move immediately to action or strategy!

4. [OPTION 4 - LINEAGE ANATOMY, CLASS ABILITY, OR STANCE FEAT]:
   - Unleashes ${ctx.playerName}'s non-human physiology (${raceAnatomy}), signature class powers (${abilitiesSnippet}), or [${(ctx.activeStance || "Neutral").toUpperCase()}] stance to overcome the current obstacle in a way only a ${ctx.playerRace || "Human"} ${ctx.playerRole} can (e.g. digitigrade rooftop leap, predatory scent-lock, arcane blade surge).

FORMAT & VARIETY REQUIREMENTS:
- Every choice MUST strictly follow the dual-tag pattern: "[Tone/Action]: Action summary with fresh dialogue or decisive movement"
  Examples:
  - "[Traversal/Agile]: 'The canal roofs—now!' Vault across the gap toward the lower district."
  - "[Tactics/Ambush]: Kick over the brazier to flood the alley with smoke and prepare a counter-strike."
  - "[Command/Strategic]: 'Perci, which tunnel leads to the safehouse? Point the way while I hold the flank.'"
  - "[${ctx.playerRace && ctx.playerRace !== "Human" ? ctx.playerRace.split("/")[0].trim() : "Class"}/Feat]: Tap your ${raceAnatomy} and launch into a high-speed burst past the cordon."
- All 4 options MUST have completely different verbs, intentions, and outcomes.
- Exactly 4 options. No bare brackets like [Combat]. Always use the [Tone/Action]: format.
- Output MUST be plain text inside the JSON "suggested_choices" (or "choices") string array without Markdown asterisks.`;
}

/**
 * Analyzes a choice text vector and returns the primary category tag to increment behavioral metrics.
 */
export function analyzeChoiceVector(choiceText: string): string {
  if (!choiceText || typeof choiceText !== "string") return "pragmatic";
  const lower = choiceText.toLowerCase();

  const match = lower.match(/^\[([a-z0-9_\-\s]+)\/([a-z0-9_\-\s]+)\]/);
  const tagContent = match ? `${match[1]} ${match[2]}` : lower.slice(0, 30);

  if (tagContent.includes("combat") || tagContent.includes("aggressive") || tagContent.includes("strike") || tagContent.includes("lunge") || tagContent.includes("blade")) {
    return "combat";
  }
  if (tagContent.includes("cynic") || tagContent.includes("rogue") || tagContent.includes("stealth") || tagContent.includes("subterfuge") || tagContent.includes("shadow")) {
    return "subterfuge";
  }
  if (tagContent.includes("arcana") || tagContent.includes("scholar") || tagContent.includes("analytic") || tagContent.includes("survey") || tagContent.includes("spell")) {
    return "analytical";
  }
  if (tagContent.includes("empath") || tagContent.includes("gentle") || tagContent.includes("protect") || tagContent.includes("care") || tagContent.includes("comfort")) {
    return "empathetic";
  }
  if (tagContent.includes("diplomat") || tagContent.includes("inquire") || tagContent.includes("pact") || tagContent.includes("bargain") || tagContent.includes("negotiate")) {
    return "diplomatic";
  }
  if (tagContent.includes("defiant") || tagContent.includes("bold") || tagContent.includes("dare") || tagContent.includes("challenge") || tagContent.includes("taunt")) {
    return "defiant";
  }
  if (tagContent.includes("lupine") || tagContent.includes("beast") || tagContent.includes("scent") || tagContent.includes("fang") || tagContent.includes("instinct")) {
    return "instinctive";
  }

  return "pragmatic";
}

/**
 * Formats dominant behavioral tendencies for display in Character Sheet or HUD.
 */
export function getDominantTendencyLabel(tendencies?: Record<string, number>): string {
  if (!tendencies || Object.keys(tendencies).length === 0) return "Emergent";
  const entries = Object.entries(tendencies).filter(([_, count]) => count > 0);
  if (entries.length === 0) return "Emergent";

  entries.sort((a, b) => b[1] - a[1]);
  const topCategories = entries.slice(0, 2).map(([cat]) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  });

  return topCategories.join(" • ");
}

