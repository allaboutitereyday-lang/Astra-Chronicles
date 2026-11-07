/**
 * Interpersonal Friction & Romantic Allegiances Engine (Pitch B)
 * for Astra Chronicles
 * 
 * Manages the Ideological Resonance Matrix, companion rivalry scores,
 * dynamic multi-character cross-talk banter injection, and high-tension
 * Camp Ultimatum Interludes.
 */

import { StoryCompanion } from "@/types/story";
import { CompanionFrictionState, CompanionRivalryRecord } from "@/types/system";

export const RIVALRY_PAIRS_CATALOG: {
  pairKey: string;
  comp1: string;
  comp2: string;
  ideologicalAxis: string;
  banterTone: string;
}[] = [
  {
    pairKey: "evelyn_aria",
    comp1: "Evelyn Abbandonato",
    comp2: "Aria Shadowthorn",
    ideologicalAxis: "Imperial Aristocratic Law vs. Underworld Rogue Anarchy",
    banterTone: "Haughty aristocratic condescension clashing with razor-sharp cynical street sarcasm.",
  },
  {
    pairKey: "serena_morgana",
    comp1: "Serena",
    comp2: "Morgana",
    ideologicalAxis: "Absolute Devoted Duty vs. Demonic Hedonistic Will",
    banterTone: "Pious, restrained martial etiquette clashing with seductive, predatory demonic audacity.",
  },
  {
    pairKey: "perci_evelyn",
    comp1: "Perci",
    comp2: "Evelyn Abbandonato",
    ideologicalAxis: "Vulnerable Commoner Survival vs. Unyielding Imperial High Caste",
    banterTone: "Timid, defensive kitsune wariness clashing with towering aristocratic authority.",
  },
  {
    pairKey: "aria_morgana",
    comp1: "Aria Shadowthorn",
    comp2: "Morgana",
    ideologicalAxis: "Pragmatic Thief Cunning vs. Ancient Eldritch Pride",
    banterTone: "Guarded professional underworld paranoia clashing with amused noble demonic amusement.",
  },
  {
    pairKey: "cassia_beatrix",
    comp1: "Cassia Valen",
    comp2: "Beatrix Valorian",
    ideologicalAxis: "Disgraced Frontier Survival Steel vs. Gilded Ducal Supremacy",
    banterTone: "Cold, economical battlefield pragmatism clashing with fiery, imperious highborn pride.",
  },
  {
    pairKey: "ysolde_aurelia",
    comp1: "Ysolde Kaelen",
    comp2: "Aurelia Solis",
    ideologicalAxis: "Fierce Autonomous Secrecy vs. Suffocating Devotional Co-Dependency",
    banterTone: "Glacial, surgical distance clashing with syrupy, possessive saintly blackmail over Ysolde's calcification cure.",
  },
  {
    pairKey: "miri_beatrix",
    comp1: "Miri Thorne",
    comp2: "Beatrix Valorian",
    ideologicalAxis: "Underground Commoner Abolitionism vs. Lawful Noble Hierarchy",
    banterTone: "Sharp-tongued mercantile mockery of noble privilege clashing with outraged aristocratic indignation.",
  },
  {
    pairKey: "kestrel_valeria",
    comp1: "Kestrel Hollow",
    comp2: "Valeria Noctis",
    ideologicalAxis: "Collared Street Brawler Survival vs. Apex Senior Spider Manipulation",
    banterTone: "Scrappy, defensive underworld grit clashing with smoky, predatory third-year teasing.",
  },
  {
    pairKey: "noelle_ysolde",
    comp1: "Noelle Vesper",
    comp2: "Ysolde Kaelen",
    ideologicalAxis: "Blunt Unfiltered Anatomical Curiosity vs. Guarded Aristocratic Dignity",
    banterTone: "Sleepy deadpan questions about Ysolde's crystallized hands clashing with lethal amethyst-eyed embarrassment.",
  },
  {
    pairKey: "seraphina_mia",
    comp1: "Seraphina Vane",
    comp2: "Mia Bellini",
    ideologicalAxis: "5-Star Platinum Cliffs Aristocratic Standards vs. Childhood-Friend Artisan Hearth Pride",
    banterTone: "Haughty tsundere audit critiques clashing with flour-dusted next-door baker jealousy over who feeds the Landlord best.",
  },
  {
    pairKey: "colette_seraphina",
    comp1: "Colette Moreau",
    comp2: "Seraphina Vane",
    ideologicalAxis: "Sultry Boardwalk Mixology Teasing vs. Uptight High-Society Propriety",
    banterTone: "Purring older-sister bartender innuendos effortlessly pushing Seraphina's BPM into the Blush Zone.",
  },
  {
    pairKey: "vivienne_roxy",
    comp1: "Vivienne Laurent",
    comp2: "Roxy Vance",
    ideologicalAxis: "Sheltered VIP Innocence vs. Tabloid Paparazzi Scoop-Hunting",
    banterTone: "Polite, literal-minded heiress curiosity disarming Roxy's shameless front-page gossip traps.",
  },
  {
    pairKey: "pippa_mia",
    comp1: "Pippa Reyes",
    comp2: "Mia Bellini",
    ideologicalAxis: "High-Hype Beach Parfait Mooches vs. Protective Kitchen Manager Discipline",
    banterTone: "Cheeky little-sister sports energy clashing with protective childhood-friend territoriality.",
  },
  {
    pairKey: "kaede_chloe",
    comp1: "Kaede Tachibana",
    comp2: "Chloe Lin",
    ideologicalAxis: "5 AM Bushido Dawn Kata vs. 4 AM Nocturnal Arcade Grind",
    banterTone: "Overly formal samurai discipline clashing with sleepy, deadpan gaming-metaphor sarcasm.",
  },
  {
    pairKey: "nadia_zuri",
    comp1: "Nadia Saint-Clair",
    comp2: "Zuri Delacroix",
    ideologicalAxis: "Minimalist Sommelier Precision vs. Playful Botanical Sensory Chaos",
    banterTone: "Cool black-lipstick aesthetic critiques clashing with teasing matcha-gelato tastings and Room 205/206 balcony banter.",
  },
];

/**
 * Normalizes companion names to match pair keys.
 */
function normalizeName(name?: string): string {
  if (!name || typeof name !== "string") return "";
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds or creates a rivalry record between two companions.
 */
export function getOrCreateRivalry(
  c1Name: string,
  c2Name: string,
  existingState?: CompanionFrictionState | null
): CompanionRivalryRecord {
  const norm1 = normalizeName(c1Name);
  const norm2 = normalizeName(c2Name);
  const sortedKey = norm1 < norm2 ? `${norm1}_${norm2}` : `${norm2}_${norm1}`;

  // Check predefined catalog first to get canonical pairKey (e.g. evelyn_aria)
  const catalogMatch = RIVALRY_PAIRS_CATALOG.find((p) => {
    const pn1 = normalizeName(p.comp1);
    const pn2 = normalizeName(p.comp2);
    return (
      (norm1.includes(pn1) && norm2.includes(pn2)) ||
      (norm1.includes(pn2) && norm2.includes(pn1))
    );
  });

  const canonicalKey = catalogMatch ? catalogMatch.pairKey : sortedKey;

  if (existingState?.rivalries?.[canonicalKey]) {
    return existingState.rivalries[canonicalKey];
  }
  if (existingState?.rivalries?.[sortedKey]) {
    return existingState.rivalries[sortedKey];
  }

  return {
    pairKey: canonicalKey,
    companion1Name: c1Name,
    companion2Name: c2Name,
    frictionScore: catalogMatch ? 35 : 15,
    ideologicalAxis: catalogMatch?.ideologicalAxis || "Conflicting Philosophical Motivations",
  };
}

/**
 * Updates interpersonal friction across the party when a primary companion receives affection.
 */
export function evaluateInterpersonalFriction(
  party: StoryCompanion[],
  primaryCompanionName: string,
  favorDelta: number,
  currentFrictionState?: CompanionFrictionState | null
): {
  updatedState: CompanionFrictionState;
  rivalryAlert?: {
    rivalName: string;
    frictionIncrease: number;
    newFrictionScore: number;
    axis: string;
  };
  triggeredUltimatum?: {
    companionName: string;
    rivalName: string;
    triggerMilestone: number;
    prompt: string;
    choices: [string, string, string, string];
  };
} {
  const state: CompanionFrictionState = currentFrictionState
    ? {
        rivalries: { ...currentFrictionState.rivalries },
        activeJealousyEvents: [...currentFrictionState.activeJealousyEvents],
        swornPartnerId: currentFrictionState.swornPartnerId,
        pendingUltimatum: currentFrictionState.pendingUltimatum,
      }
    : {
        rivalries: {},
        activeJealousyEvents: [],
        swornPartnerId: null,
        pendingUltimatum: null,
      };

  if (favorDelta <= 0 || party.length < 2) {
    return { updatedState: state };
  }

  const primaryComp = party.find(
    (c) => normalizeName(c.name) === normalizeName(primaryCompanionName)
  );
  if (!primaryComp) {
    return { updatedState: state };
  }

  let rivalryAlert: any = undefined;
  let triggeredUltimatum: any = undefined;

  for (const other of party) {
    if (normalizeName(other.name) === normalizeName(primaryCompanionName)) continue;

    const rivalry = getOrCreateRivalry(primaryComp.name, other.name, state);
    const frictionIncrease = Math.min(10, Math.max(2, Math.round(favorDelta * 1.5)));
    const newScore = Math.min(100, rivalry.frictionScore + frictionIncrease);

    rivalry.frictionScore = newScore;
    state.rivalries[rivalry.pairKey] = rivalry;

    if (!rivalryAlert) {
      rivalryAlert = {
        rivalName: other.name,
        frictionIncrease,
        newFrictionScore: newScore,
        axis: rivalry.ideologicalAxis,
      };
    }

    // Check for Camp Ultimatum Trigger (Threshold 75+ friction and affection >= 45)
    if (newScore >= 75 && (primaryComp.affection || 0) >= 45 && !state.pendingUltimatum) {
      triggeredUltimatum = {
        companionName: primaryComp.name,
        rivalName: other.name,
        triggerMilestone: primaryComp.affection || 50,
        prompt: `Under the dim glow of camp embers, ${other.name} blocks your path, her gaze burning with unresolved tension. "You can't keep playing both sides, Vaughn. Walking the line between my truth and ${primaryComp.name}'s poison will get us both killed. Where does your true allegiance lie?"`,
        choices: [
          `[Reconcile/Diplomatic]: Stand firm between both heroines and forge an unyielding tactical compromise.`,
          `[Affirm ${primaryComp.name}/Decisive]: Look ${other.name} in the eye and make it clear you stand with ${primaryComp.name}.`,
          `[Affirm ${other.name}/Passionate]: Step closer to ${other.name}, acknowledge her vulnerability, and promise your protection.`,
          `[Pragmatism/Stern]: Remind them both that survival against the Multiverse Administrator supersedes petty rivalries.`,
        ],
      };
      state.pendingUltimatum = triggeredUltimatum;
      state.activeJealousyEvents.push(`${primaryComp.name} vs ${other.name} Camp Ultimatum`);
    }
  }

  return {
    updatedState: state,
    rivalryAlert,
    triggeredUltimatum,
  };
}

/**
 * Builds the Dynamic Cross-Talk Banter Directive to inject into `/api/turn`.
 */
export function generateCrossTalkBanterDirective(
  presentCompanions: (StoryCompanion | string | any)[],
  frictionState?: CompanionFrictionState | null,
  activeSpeaker?: string
): string {
  if (!presentCompanions || presentCompanions.length < 2) {
    return "";
  }

  const names = presentCompanions.map((c) => (typeof c === "string" ? c : c?.name || ""));
  const activeRivalries: CompanionRivalryRecord[] = [];

  for (let i = 0; i < presentCompanions.length; i++) {
    for (let j = i + 1; j < presentCompanions.length; j++) {
      const c1 = typeof presentCompanions[i] === "string" ? presentCompanions[i] : presentCompanions[i]?.name;
      const c2 = typeof presentCompanions[j] === "string" ? presentCompanions[j] : presentCompanions[j]?.name;
      if (c1 && c2) {
        const rec = getOrCreateRivalry(c1, c2, frictionState);
        if (rec.frictionScore >= 30) {
          activeRivalries.push(rec);
        }
      }
    }
  }

  if (activeRivalries.length === 0) {
    return `--- PARTY BANTER DIRECTIVE (MULTIPLE COMPANIONS PRESENT: ${names.join(", ")}) ---
Both ${names.join(" and ")} are physically present in this scene. Rather than a solitary monologue, allow both companions to exchange natural reactive dialogue, commentary, or mutual appraisals regarding the current situation.`;
  }

  const topRivalry = activeRivalries.sort((a, b) => b.frictionScore - a.frictionScore)[0];
  const catalogEntry = RIVALRY_PAIRS_CATALOG.find((p) => p.pairKey === topRivalry.pairKey);

  return `--- INTERPERSONAL FRICTION & CROSS-TALK DIRECTIVE ---
Multiple heroines are physically present in this scene: ${names.join(", ")}.
Key Interpersonal Tension: ${topRivalry.companion1Name} ⚡ ${topRivalry.companion2Name}
- Philosophical Axis: ${topRivalry.ideologicalAxis}
- Current Friction Intensity: ${topRivalry.frictionScore}/100
- Banter Dynamic: ${catalogEntry?.banterTone || "Sharp ideological disagreement and covert romantic jealousy."}
Narration & Pacing Instruction:
- Keep the primary spotlight on ${activeSpeaker || topRivalry.companion1Name} directly answering the protagonist's new action.
- If a secondary present companion (${names.filter((n) => n !== activeSpeaker).join(" or ")}) interjects, their reaction MUST address the specific new development of THIS turn—NEVER repeat an interruption, quip, nickname, or prop action (such as setting down a basket, rustling an apron, or polishing a glass) that already occurred in the previous turn!`;
}

/**
 * Resolves the Camp Ultimatum choice selection.
 */
export function resolveCampUltimatum(
  choiceText: string,
  frictionState: CompanionFrictionState
): {
  narrativeResolution: string;
  duoUltimateUnlocked: boolean;
  chosenAllegiance: "reconciled" | "comp1" | "comp2" | "neutral";
} {
  const lower = choiceText.toLowerCase();

  if (lower.includes("reconcile") || lower.includes("compromise")) {
    // Both reconciled: friction significantly reduced, duo synergy unlocked!
    for (const key of Object.keys(frictionState.rivalries)) {
      frictionState.rivalries[key].frictionScore = Math.max(10, frictionState.rivalries[key].frictionScore - 40);
    }
    frictionState.pendingUltimatum = null;
    return {
      narrativeResolution: "Against all odds, you broke through their ideological hostility and forged an unbreakable triad bond.",
      duoUltimateUnlocked: true,
      chosenAllegiance: "reconciled",
    };
  }

  if (lower.includes("affirm") || lower.includes("stand with")) {
    frictionState.pendingUltimatum = null;
    return {
      narrativeResolution: "You made your romantic allegiance clear, cementing deep devotion with one while accepting the tragic distance of the other.",
      duoUltimateUnlocked: false,
      chosenAllegiance: "comp1",
    };
  }

  frictionState.pendingUltimatum = null;
  return {
    narrativeResolution: "You placed survival and duty above personal affection, imposing stern discipline over the party.",
    duoUltimateUnlocked: false,
    chosenAllegiance: "neutral",
  };
}

