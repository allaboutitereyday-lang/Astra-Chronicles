import { RelicSynergy, StoryRelicItem } from "@/types/story";

export interface RelicSetDefinition {
  setName: string;
  requiredCount: number;
  bonusName: string;
  bonusDescription: string;
  choicePrefix: string;
  actionGuidance: string;
  matchingItems: string[];
}

export const KNOWN_RELIC_SETS: RelicSetDefinition[] = [
  {
    setName: "Voidstrider",
    requiredCount: 2,
    bonusName: "Voidstrider Resonance",
    bonusDescription: "Phase-step through solid matter and evade kinetic strikes by shifting into planar rifts.",
    choicePrefix: "[Voidstrider Resonance]",
    actionGuidance: "Permits instantaneous short-range phase stepping through physical barriers or lethal attacks.",
    matchingItems: [
      "Voidstrider Boots",
      "Voidstrider Mantle",
      "Voidstrider Dagger",
      "Voidstrider Signet",
      "Echo of the Void",
      "Voidstrider Thread",
      "Obsidian Void Core",
    ],
  },
  {
    setName: "Singularity Sovereign",
    requiredCount: 2,
    bonusName: "Administrator's Singularity Distortion",
    bonusDescription: "Bend causal timelines and collapse local spatial fields to disintegrate enemy barriers.",
    choicePrefix: "[Singularity Distortion]",
    actionGuidance: "Permits absolute causal distortion and sovereign intervention in planar laws.",
    matchingItems: [
      "Administrator's Singularity Seal",
      "Titan Calamity Plating",
      "Causal Fracture Shard",
      "Obsidian Void Core",
      "Singularity Core",
    ],
  },
  {
    setName: "Solarion",
    requiredCount: 2,
    bonusName: "Solarion Radiance",
    bonusDescription: "Channel consecrated solar flare energy to blind eldritch abominations and purify miasma.",
    choicePrefix: "[Solarion Radiance]",
    actionGuidance: "Permits dazzling solar bursts, ward dispelling, and searing radiant strikes.",
    matchingItems: [
      "Solarion Crest",
      "Solarion Blade",
      "Solarion Aegis",
      "Solarion Amulet",
      "Dawnfire Core",
    ],
  },
  {
    setName: "Abyssal Weaver",
    requiredCount: 2,
    bonusName: "Abyssal Weaver Convergence",
    bonusDescription: "Weave planar threads to bind enemy movements and manipulate spatial gravity.",
    choicePrefix: "[Abyssal Weaver]",
    actionGuidance: "Permits gravitational snaring and puppet-string thread manipulation.",
    matchingItems: [
      "Abyssal Silk Robe",
      "Abyssal Loom Ring",
      "Weaver Spindle",
      "Shadowbound Ribbon",
    ],
  },
];

/**
 * Evaluates an item inventory and equipped gear to compute all active set synergies
 */
export function evaluateRelicSynergies(
  inventory: Array<{ name: string; setName?: string; type?: string }>,
  gear?: { weapon?: string; armor?: string; relic?: string }
): RelicSynergy[] {
  const itemNames = new Set<string>();

  // Collect from inventory
  (inventory || []).forEach((item) => {
    if (item.name) itemNames.add(item.name.toLowerCase().trim());
  });

  // Collect from gear
  if (gear) {
    if (gear.weapon) itemNames.add(gear.weapon.toLowerCase().trim());
    if (gear.armor) itemNames.add(gear.armor.toLowerCase().trim());
    if (gear.relic) itemNames.add(gear.relic.toLowerCase().trim());
  }

  const results: RelicSynergy[] = [];

  KNOWN_RELIC_SETS.forEach((setDef) => {
    // Count matches by set name keyword or explicit item matches
    let pieceCount = 0;
    const setNameLower = setDef.setName.toLowerCase();

    // Check by setName keyword in inventory
    (inventory || []).forEach((item) => {
      const iName = (item.name || "").toLowerCase();
      const sName = (item.setName || "").toLowerCase();
      if (sName === setNameLower || iName.includes(setNameLower)) {
        pieceCount++;
      }
    });

    // Check gear for set name keyword
    if (gear) {
      ["weapon", "armor", "relic"].forEach((slot) => {
        const val = ((gear as any)[slot] || "").toLowerCase();
        if (val.includes(setNameLower)) {
          pieceCount++;
        }
      });
    }

    // Deduplicate against exact item definitions
    setDef.matchingItems.forEach((mItem) => {
      if (itemNames.has(mItem.toLowerCase())) {
        // If not already counted
        if (pieceCount < 1) pieceCount = 1;
      }
    });

    const isActive = pieceCount >= setDef.requiredCount;

    results.push({
      id: `synergy_${setDef.setName.toLowerCase()}`,
      setName: setDef.setName,
      pieceCount,
      requiredCount: setDef.requiredCount,
      isActive,
      bonusName: setDef.bonusName,
      bonusDescription: setDef.bonusDescription,
      unlockedExclusiveChoicePrefix: setDef.choicePrefix,
    });
  });

  return results;
}

/**
 * Injects active synergy directives into the OpenRouter LLM context
 */
export function buildSynergyPromptDirective(synergies: RelicSynergy[]): string {
  const activeSets = synergies.filter((s) => s.isActive);
  if (activeSets.length === 0) return "";

  return `
--- ACTIVE RELIC SET SYNERGIES & EXCLUSIVE INTENTS ---
The protagonist has completed the following Relic Set Synergies:
${activeSets
  .map(
    (s) =>
      `* [ACTIVE SET BONUS] "${s.bonusName}" (${s.pieceCount}/${s.requiredCount} ${s.setName} Pieces Equipped)
   - Perk: ${s.bonusDescription}
   - Mandatory Unlocked Vector Prefix: "${s.unlockedExclusiveChoicePrefix}"`
  )
  .join("\n")}

CRITICAL CHOICE GENERATION MANDATE:
Because the player has active Relic Set Synergies, you MUST author at least ONE of the 4 suggested dialogue/action options prefixed with the unlocked synergy bracket (e.g. "${activeSets[0].unlockedExclusiveChoicePrefix} ...").
This choice must dynamically leverage the unique mechanical advantage of the gear (e.g., phase stepping through kinetic barriers, deploying celestial dawnfire, or spatial thread weaving).
`;
}
