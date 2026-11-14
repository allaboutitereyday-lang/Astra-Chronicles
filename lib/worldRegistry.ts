import {
  SOVEREIGN_ORIGIN_PRESETS,
  SOVEREIGN_CONDUIT_PRESETS,
  SOVEREIGN_HEROINE_DOSSIERS,
  SovereignOriginPreset,
  SovereignConduitPreset,
} from "@/types/sovereign_spire";
import {
  PORT_SOLARIS_ORIGIN_PRESETS,
  PORT_SOLARIS_CONDUIT_PRESETS,
  PORT_SOLARIS_HEROINE_DOSSIERS,
  PortSolarisOriginPreset,
  PortSolarisConduitPreset,
} from "@/types/port_solaris";
import {
  STARFALL_ORIGIN_PRESETS,
  STARFALL_ROLE_PRESETS,
  STARFALL_HEROINE_DOSSIERS,
  StarfallOriginPreset,
  StarfallRolePreset,
} from "@/types/starfall_labyrinth";

export type AnyWorldOriginPreset =
  | SovereignOriginPreset
  | PortSolarisOriginPreset
  | StarfallOriginPreset;

export type AnyWorldConduitPreset =
  | SovereignConduitPreset
  | PortSolarisConduitPreset
  | StarfallRolePreset;

export interface WorldPresetRegistryEntry {
  storyId: string;
  origins: AnyWorldOriginPreset[];
  conduits: AnyWorldConduitPreset[];
  defaultTone: string;
  heroineDossiers: Record<string, { actOneConflict: string; dyadPassiveName?: string; dyadPassiveDescription?: string }>;
  uiLabels: {
    originQuotaPrefix: string;
    originFundsSuffix: string;
    originImpactSubtitle: (origin: AnyWorldOriginPreset) => string;
    conduitSectionDescription: string;
    relicOrKeepsakeLabel: string;
    rolePlaceholder: string;
    attributeAllocationLabel: string;
    loadoutSectionLabel: string;
    canonLoadoutButtonLabel: string;
    flawLabel: string;
    partnerTargetLabel: string;
    weaponDescription: (wingLabel: string, conduit: string) => string;
    weaponEffect: string;
    armorDescription: (wingLabel: string) => string;
    armorEffect: string;
  };
}

export const WORLD_PRESETS: Record<string, WorldPresetRegistryEntry> = {
  "sovereign-spire": {
    storyId: "sovereign-spire",
    origins: SOVEREIGN_ORIGIN_PRESETS,
    conduits: SOVEREIGN_CONDUIT_PRESETS,
    defaultTone: "Grimdark & Atmospheric (Tense, visceral, sensory)",
    heroineDossiers: SOVEREIGN_HEROINE_DOSSIERS,
    uiLabels: {
      originQuotaPrefix: "Quota",
      originFundsSuffix: "Crowns",
      originImpactSubtitle: (origin) =>
        `Starting Rank #${origin.startingRank} • Semester Debt Quota: ${origin.semesterDebtQuota} Aether Cores • ${origin.startingCrowns} Imperial Crowns`,
      conduitSectionDescription:
        "Choose your Astra biological pathway and Patron Wing pledge. Determines how you fight in the Crucible, your starting techniques, and your socketed Vault Relic.",
      relicOrKeepsakeLabel: "Relic",
      rolePlaceholder: "e.g., Somatic Vanguard (Iron Chancellery)...",
      attributeAllocationLabel: "Dual-Conduit Attribute Allocation",
      loadoutSectionLabel: "Starting Armament & Relic Loadout",
      canonLoadoutButtonLabel: "Canon Wing Loadout",
      flawLabel: "Whisper Flaw:",
      partnerTargetLabel: "Dyad Target:",
      weaponDescription: (wingLabel, conduit) =>
        `Standard-issue ${wingLabel} armament tuned for ${conduit} conduit channeling.`,
      weaponEffect: "+15% Conduit Strike Efficiency",
      armorDescription: (wingLabel) =>
        `Tailored ${wingLabel} initiate attire reinforced against Stratum I Astra-Miasma.`,
      armorEffect: "+10% Calcification & Miasma Resistance",
    },
  },
  "port-solaris": {
    storyId: "port-solaris",
    origins: PORT_SOLARIS_ORIGIN_PRESETS,
    conduits: PORT_SOLARIS_CONDUIT_PRESETS,
    defaultTone:
      "Sun-Drenched Coastal Rom-Com (Sparkling banter, sensory warmth, romantic tension)",
    heroineDossiers: PORT_SOLARIS_HEROINE_DOSSIERS,
    uiLabels: {
      originQuotaPrefix: "Rent",
      originFundsSuffix: "Crowns",
      originImpactSubtitle: (origin) =>
        `${origin.rankTierLabel} • Weekly Rent Quota: ${origin.semesterDebtQuota} Solar Crowns • Starting Funds: ${origin.startingCrowns} Solar Crowns`,
      conduitSectionDescription:
        "Choose your Article 9 Showdown style (Physical Tempo vs. Social Panache) and Island Faction alignment. Determines your café & turf skills and your signature Keepsake.",
      relicOrKeepsakeLabel: "Keepsake",
      rolePlaceholder: "e.g., Head Chef & Mixology Duelist (Boardwalk Guild)...",
      attributeAllocationLabel:
        "Physical Tempo, Flair Reflex & Social Panache Allocation",
      loadoutSectionLabel:
        "Starting Tool of the Trade, Attire & Keepsake Loadout",
      canonLoadoutButtonLabel: "Canon Faction Loadout",
      flawLabel: "Romantic Tag-Flaw:",
      partnerTargetLabel: "Housemate / Partner:",
      weaponDescription: (wingLabel, conduit) =>
        `Signature ${wingLabel} tool of the trade tuned for ${conduit} showdowns.`,
      weaponEffect: "+15% Article 9 Showdown Efficiency",
      armorDescription: (wingLabel) =>
        `Tailored ${wingLabel} resort and boardwalk attire.`,
      armorEffect: "+10% Composure & BPM Stability",
    },
  },
  "starfall-labyrinth": {
    storyId: "starfall-labyrinth",
    origins: STARFALL_ORIGIN_PRESETS,
    conduits: STARFALL_ROLE_PRESETS,
    defaultTone:
      "Tactical Dungeon Survival (Tense, strategic, grounded human grit)",
    heroineDossiers: STARFALL_HEROINE_DOSSIERS,
    uiLabels: {
      originQuotaPrefix: "Goal: Floor",
      originFundsSuffix: "Shards",
      originImpactSubtitle: (origin) => {
        const sf = origin as StarfallOriginPreset;
        return `${origin.rankTierLabel} • Master Trust: ${sf.startingMasterTrust ?? 30}% • Starting Star Shards: ${origin.startingCrowns}`;
      },
      conduitSectionDescription:
        "Choose your 1★ deployment combat role. Determines how you call boss telegraphs, protect deployed heroines from permadeath, and compensate for your Lv.20 star cap.",
      relicOrKeepsakeLabel: "Emblem",
      rolePlaceholder: "e.g., 1★ Field Tactician & Shot-Caller...",
      attributeAllocationLabel:
        "Vanguard Might, Skirmish Tempo & Ranker Tactics Allocation",
      loadoutSectionLabel: "Starting 1★ Deployment Kit & Survivor Emblem",
      canonLoadoutButtonLabel: "Canon 1★ Squad Kit",
      flawLabel: "Covenant Risk:",
      partnerTargetLabel: "First Squadmate:",
      weaponDescription: (wingLabel, conduit) =>
        `Salvaged Star Gate deployment steel tuned for ${conduit} (${wingLabel}) survival.`,
      weaponEffect: "+15% Weak-Spot & Telegraph Precision",
      armorDescription: (wingLabel) =>
        `Battle-worn 1★ deployment gear rigged for ${wingLabel} labyrinth runs.`,
      armorEffect: "+10% Ambush & Boss Cleave Mitigation",
    },
  },
};

export function getWorldPresets(
  storyId?: string | null
): WorldPresetRegistryEntry | null {
  if (!storyId) return null;
  return WORLD_PRESETS[storyId] ?? null;
}

export function hasCustomWorldPresets(storyId?: string | null): boolean {
  return Boolean(storyId && WORLD_PRESETS[storyId]);
}
