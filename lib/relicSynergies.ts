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
  // Port Solaris Coastal Faction Gear Sets
  {
    setName: "Boardwalk Artisan",
    requiredCount: 2,
    bonusName: "Boardwalk Guild 5-Star Gastronomic Flair",
    bonusDescription: "+25% Café Shift Revenue and +20 Starting Hype in Culinary & Mixology Article 9 Showdowns.",
    choicePrefix: "[Boardwalk Artisan Flair]",
    actionGuidance: "Permits dazzling open-kitchen culinary showmanship, aromatic plating rushes, and artisan sommelier pairings.",
    matchingItems: [
      "Hand-Forged Damascus Santoku & Copper Shaker",
      "Crisp Rolled-Sleeve Bistro Shirt & Indigo Apron",
      "Grandfather's Brass Espresso Tamper (Stray Anchor Deed)",
      "Grandfather's Brass Espresso Tamper",
      "Nonna Bellini's Brass Espresso Tamper & Seashell Ribbon",
      "Silver Sugar-Tongs & Velvet Cellar Key of L'Étoile",
      "Hand-Carved Olivewood Gelato Spade & Night-Blooming Orchid Vial",
    ],
  },
  {
    setName: "South-Shore Champion",
    requiredCount: 2,
    bonusName: "Breakers Union Unbeaten Sand & Pier Tempo",
    bonusDescription: "2.5s Flow-State parry window in physical showdowns and +25% Composure recovery after athletic turns.",
    choicePrefix: "[South-Shore Champion Tempo]",
    actionGuidance: "Permits acrobatic beach-court spikes, bamboo shinai parries, and effortless crowd-pleasing athleticism.",
    matchingItems: [
      "Sun-Bleached Kendo Shinai & Pro Tour Volleyball",
      "Cropped Red-and-White Lifeguard Windbreaker & Boardshorts",
      "Silver South-Shore Championship Whistle",
      "Mia's Hand-Stitched Linen Bistro Apron & Kaede's Woven Dojo Wrist-Wrap",
      "Gold-Plated South-Shore Lifeguard Whistle on Braided Cord",
      "Woven Crimson Dojo Wrist-Cord & Harbour Seal Charm",
    ],
  },
  {
    setName: "Cliffside VIP",
    requiredCount: 2,
    bonusName: "Platinum Board Clause 7 Diplomatic Immunity",
    bonusDescription: "Reflects 30% of snobby Composure attacks, slashes audit fines by 25%, and unlocks VIP gala table turns.",
    choicePrefix: "[Cliffside VIP Panache]",
    actionGuidance: "Permits citing Island Charter loopholes, flashing VIP black-card patronage, and turning aristocratic snobbery back on rivals.",
    matchingItems: [
      "Gold-Nibbed Charter Audit Pen & Sommelier Tastevin",
      "Unbuttoned White Resort Blazer & Silk Pocket Square",
      "Revoked Vane-Valorian VIP Black Card",
      "Black Sand Pearl Necklace",
      "Vintage Platinum Audit Pocket Watch",
      "Black Sand Pearl Cufflinks & Clause 7 Signet",
      "24k Gold-Chain Jeweler's Loupe & Signed Charcoal Portrait",
    ],
  },
  {
    setName: "Old Pier Night-Owl",
    requiredCount: 2,
    bonusName: "Driftwood Syndicate Frame-Perfect Scoop & Audit Cancel",
    bonusDescription: "Converts Scandal Heat into +35% Café Foot Traffic and invokes Clause 9B to cut predatory debt interest.",
    choicePrefix: "[Old Pier Syndicate Spin]",
    actionGuidance: "Permits frame-perfect betting counter-plays, forensic ledger ambushes, and turning tabloid gossip into viral publicity.",
    matchingItems: [
      "Modded Sanwa Fight-Stick & 35mm Rangefinder Camera",
      "Off-Shoulder Pastel Arcade Hoodie & Press Lanyard",
      "Encrypted Solaris Siren Rumor Ledger",
      "Chloe's Gold-Plated Old Pier Arcade Token",
      "35mm Brass Film Canister ('DO NOT DEVELOP') & Press Badge",
      "Gold-Plated 99-Win Old Pier Arcade Token & Pastel Hoodie Drawstring",
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
