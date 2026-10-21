/**
 * Story-Adaptive Procedural Trials Engine for Astra Chronicles
 * 
 * Dynamically synthesizes 5-sector LitRPG roguelite anomaly sectors,
 * enemy profiles, causal modifiers, and contextual loot drops based on
 * the active StoryContext (Fantasy, Cyberpunk, Cosmic Sci-Fi).
 */

import { InventoryItem, TrialModifier } from "@/types/story";
import { generateProceduralMonsterSvg, generateProceduralLootSvg } from "./proceduralArt";
import { PREDEFINED_TRIAL_MODIFIERS } from "./trialModifiers";

export { PREDEFINED_TRIAL_MODIFIERS };

export interface SectorDefinition {
  sectorNumber: number;
  title: string;
  codename: string;
  difficulty: "D-Rank" | "C-Rank" | "B-Rank" | "A-Rank" | "S-Rank";
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyDesc: string;
  causalModifier: TrialModifier;
  enemyImageUrl?: string;
}

interface SectorArchetype {
  title: string;
  codename: string;
  difficulty: "D-Rank" | "C-Rank" | "B-Rank" | "A-Rank" | "S-Rank";
  enemyName: string;
  enemyHp: number;
  enemyDesc: string;
}

const GENRE_SECTOR_ARCHETYPES: Record<string, SectorArchetype[]> = {
  cyberpunk: [
    {
      title: "Sector 01: Sub-Grid Firewall Incursion",
      codename: "GRID-ALPHA",
      difficulty: "D-Rank",
      enemyName: "Rogue ICE Net-Stalker",
      enemyHp: 65,
      enemyDesc: "A twitching cyber-arachnid construct deployed by rogue subroutines to quarantine intruding minds.",
    },
    {
      title: "Sector 02: Rust Gutter Megastructure",
      codename: "RUST-BETA",
      difficulty: "C-Rank",
      enemyName: "Chrome Syndicate Heavy Mech",
      enemyHp: 100,
      enemyDesc: "An augmented corporate demolition unit equipped with pneumatic piledrivers and thermal shielding.",
    },
    {
      title: "Sector 03: Black-ICE Neural Core",
      codename: "CIPHER-GAMMA",
      difficulty: "B-Rank",
      enemyName: "Apex Netrunner Construct 'Zero-Day'",
      enemyHp: 145,
      enemyDesc: "An autonomous AI consciousness manifesting through high-voltage plasma filaments and neural spikes.",
    },
    {
      title: "Sector 04: Megacorp Orbital Laboratory",
      codename: "NEXUS-DELTA",
      difficulty: "A-Rank",
      enemyName: "Arasaka Prototype Chimera Drone",
      enemyHp: 210,
      enemyDesc: "A military gunship drone armed with particle-beam emitters and hyper-dense composite plating.",
    },
    {
      title: "Sector 05: The Spire Datastream",
      codename: "SINGULARITY-OMEGA",
      difficulty: "S-Rank",
      enemyName: "The Ghost of Neo-Kyoto (AI Overlord)",
      enemyHp: 290,
      enemyDesc: "The sentient master mainframe orchestrating corporate warfare across the city, testing your resolve.",
    },
  ],
  cosmic: [
    {
      title: "Sector 01: Derelict Station Airlock",
      codename: "AIRLOCK-ALPHA",
      difficulty: "D-Rank",
      enemyName: "Nanite Swarm Scavenger",
      enemyHp: 60,
      enemyDesc: "A self-assembling cloud of microscopic repair drones gone feral inside the abandoned airlock.",
    },
    {
      title: "Sector 02: Graviton Decay Chamber",
      codename: "GRAVITON-BETA",
      difficulty: "C-Rank",
      enemyName: "Voidborn Star-Predator",
      enemyHp: 95,
      enemyDesc: "A bio-luminescent predatory organism that feeds directly upon micro-singularities.",
    },
    {
      title: "Sector 03: Tachyon Bridge",
      codename: "TACHYON-GAMMA",
      difficulty: "B-Rank",
      enemyName: "Quantum Singularity Phantom",
      enemyHp: 140,
      enemyDesc: "A timeline remnant trapped in an infinite superposition loop, weaponizing compressed chronological bursts.",
    },
    {
      title: "Sector 04: Pulsar Observatory",
      codename: "PULSAR-DELTA",
      difficulty: "A-Rank",
      enemyName: "Derelict Dreadnought Core AI",
      enemyHp: 205,
      enemyDesc: "The cold, unblinking targeting processor of an ancient cosmic battleship refusing to go dark.",
    },
    {
      title: "Sector 05: The Event Horizon Spire",
      codename: "EVENT-OMEGA",
      difficulty: "S-Rank",
      enemyName: "The Dimensional Arch-Overseer",
      enemyHp: 285,
      enemyDesc: "An omniscient entity observing the birth and heat-death of star clusters, judging timeline worth.",
    },
  ],
  fantasy: [
    {
      title: "Sector 01: Causal Fracture Outpost",
      codename: "FRACTURE-ALPHA",
      difficulty: "D-Rank",
      enemyName: "Planar Glitch Stalker",
      enemyHp: 60,
      enemyDesc: "A twitching arachnid construct composed of fractured spacetime shards.",
    },
    {
      title: "Sector 02: Void Rift Incursion",
      codename: "RIFT-BETA",
      difficulty: "C-Rank",
      enemyName: "Obsidian Void Predator",
      enemyHp: 95,
      enemyDesc: "A predatory quad-ped beast phasing between the physical realm and the void vacuum.",
    },
    {
      title: "Sector 03: Chrono-Stasis Crucible",
      codename: "CHRONO-GAMMA",
      difficulty: "B-Rank",
      enemyName: "Time-Lost Archon Sentinel",
      enemyHp: 140,
      enemyDesc: "Ancient gilded guardian animated by compressed timeline conduits.",
    },
    {
      title: "Sector 04: Abyssal Foundry Chamber",
      codename: "ABYSS-DELTA",
      difficulty: "A-Rank",
      enemyName: "Calamity Automaton Titan",
      enemyHp: 200,
      enemyDesc: "Colossal imperial war automaton forged from corrupted celestial iron.",
    },
    {
      title: "Sector 05: Apex Administrator Spire",
      codename: "SINGULARITY-OMEGA",
      difficulty: "S-Rank",
      enemyName: "The Causal Arbitrator (Avatar)",
      enemyHp: 280,
      enemyDesc: "The manifestation of the Multiverse Administrator evaluating your timeline coherence.",
    },
  ],
};

/**
 * Detects the normalized genre key from story context.
 */
export function detectGenreKey(storyContext?: any): "cyberpunk" | "cosmic" | "fantasy" {
  if (!storyContext) return "fantasy";
  const id = (storyContext.id || "").toLowerCase();
  const genre = (storyContext.genre || storyContext.worldContext?.genre || "").toLowerCase();

  if (id.includes("neon") || genre.includes("cyber") || genre.includes("neon") || genre.includes("noir")) {
    return "cyberpunk";
  }
  if (genre.includes("cosmic") || genre.includes("space") || genre.includes("sci-fi") || genre.includes("stellar")) {
    return "cosmic";
  }
  return "fantasy";
}

/**
 * Generates 5 story-adapted sectors matching the story world and current seed.
 */
export function generateStorySectors(
  storyContext?: any,
  runModifiers: TrialModifier[] = [],
  customSectorModifiers: Record<number, TrialModifier> = {},
  runSeed: number = 42
): SectorDefinition[] {
  const genreKey = detectGenreKey(storyContext);
  const archetypes = GENRE_SECTOR_ARCHETYPES[genreKey] || GENRE_SECTOR_ARCHETYPES.fantasy;

  return archetypes.map((arch, idx) => {
    const modifier = customSectorModifiers[idx] || runModifiers[idx] || PREDEFINED_TRIAL_MODIFIERS[idx % PREDEFINED_TRIAL_MODIFIERS.length];

    // Procedurally render an anomaly portrait for instant zero-latency visual fidelity
    const enemyImageUrl = generateProceduralMonsterSvg({
      name: arch.enemyName,
      rank: arch.difficulty.charAt(0),
      genre: genreKey,
      modifier: modifier.name,
    });

    return {
      sectorNumber: idx + 1,
      title: arch.title,
      codename: arch.codename,
      difficulty: arch.difficulty,
      enemyName: arch.enemyName,
      enemyHp: arch.enemyHp,
      enemyMaxHp: arch.enemyHp,
      enemyDesc: arch.enemyDesc,
      causalModifier: modifier,
      enemyImageUrl,
    };
  });
}

/**
 * Generates genre-adapted sector loot drops.
 */
export function generateStoryLootTable(storyContext?: any): InventoryItem[] {
  const genreKey = detectGenreKey(storyContext);

  if (genreKey === "cyberpunk") {
    return [
      {
        id: "trial_loot_s1_cyber",
        name: "Sub-Grid Data Shard",
        type: "material",
        rarity: "uncommon",
        description: "An encrypted military-grade data shard salvaged from the Grid-Alpha firewall.",
        effect: "+5% Neural Processing • Usable in cybernetic tuning",
        imageUrl: generateProceduralLootSvg({ name: "Sub-Grid Data Shard", rarity: "uncommon", type: "tech" }),
      },
      {
        id: "trial_loot_s2_cyber",
        name: "Overclocked Neural Anchor",
        type: "relic",
        rarity: "rare",
        description: "Stripped from a syndicate heavy mech. Prevents brain fry under high-voltage ICE counterattacks.",
        effect: "+15 Max MP • Syndicate Netrunner Synergy Catalyst",
        imageUrl: generateProceduralLootSvg({ name: "Overclocked Neural Anchor", rarity: "rare", type: "relic" }),
      },
      {
        id: "trial_loot_s3_cyber",
        name: "Nano-Repair Inhaler",
        type: "consumable",
        rarity: "rare",
        description: "A pressurized aerosol mist carrying millions of medical nanites.",
        effect: "Instantly restores 50 HP and 40 MP in tactical combat",
        imageUrl: generateProceduralLootSvg({ name: "Nano-Repair Inhaler", rarity: "rare", type: "potion" }),
      },
      {
        id: "trial_loot_s4_cyber",
        name: "Graphene Weave Carapace",
        type: "armor",
        rarity: "relic",
        description: "Reinforced ballistic armor woven from laboratory-grade carbon nanotube filaments.",
        effect: "+25 Max HP • Reduces incoming burst damage by 15%",
        imageUrl: generateProceduralLootSvg({ name: "Graphene Weave Carapace", rarity: "relic", type: "armor" }),
      },
      {
        id: "trial_loot_s5_cyber",
        name: "Omni-Corp Master Override Deck",
        type: "relic",
        rarity: "relic",
        description: "An untraceable root access deck gifted by the Spire's fallen intelligence network.",
        effect: "+35 Max HP • +25 Max MP • Syndicate Netrunner Capstone",
        imageUrl: generateProceduralLootSvg({ name: "Omni-Corp Master Override Deck", rarity: "relic", type: "tech" }),
      },
    ];
  }

  if (genreKey === "cosmic") {
    return [
      {
        id: "trial_loot_s1_cosmic",
        name: "Nanite Core Cluster",
        type: "material",
        rarity: "uncommon",
        description: "A pulsating cluster of nanites salvaged from the station airlock.",
        effect: "+5% Quantum Coherence • Usable in vessel fabrication",
        imageUrl: generateProceduralLootSvg({ name: "Nanite Core Cluster", rarity: "uncommon", type: "material" }),
      },
      {
        id: "trial_loot_s2_cosmic",
        name: "Graviton Micro-Singularity",
        type: "relic",
        rarity: "rare",
        description: "A stabilized micro-black hole held in electromagnetic suspension.",
        effect: "+15 Max MP • Voidstrider Catalyst",
        imageUrl: generateProceduralLootSvg({ name: "Graviton Micro-Singularity", rarity: "rare", type: "relic" }),
      },
      {
        id: "trial_loot_s3_cosmic",
        name: "Stellar Tachyon Ampoule",
        type: "consumable",
        rarity: "rare",
        description: "Concentrated tachyon serum capable of reversing local cellular entropy.",
        effect: "Instantly restores 50 HP and 40 MP in high-stakes combat",
        imageUrl: generateProceduralLootSvg({ name: "Stellar Tachyon Ampoule", rarity: "rare", type: "potion" }),
      },
      {
        id: "trial_loot_s4_cosmic",
        name: "Dreadnought Hull Fragment",
        type: "armor",
        rarity: "relic",
        description: "Super-dense armor plating scavenged from the Pulsar Dreadnought.",
        effect: "+25 Max HP • Reduces incoming burst damage by 15%",
        imageUrl: generateProceduralLootSvg({ name: "Dreadnought Hull Fragment", rarity: "relic", type: "armor" }),
      },
      {
        id: "trial_loot_s5_cosmic",
        name: "Overseer's Event Horizon Glyph",
        type: "relic",
        rarity: "relic",
        description: "A celestial authority glyph radiating with starlight from the galactic rim.",
        effect: "+35 Max HP • +25 Max MP • Singularity Sovereign Synergy Capstone",
        imageUrl: generateProceduralLootSvg({ name: "Overseer's Event Horizon Glyph", rarity: "relic", type: "relic" }),
      },
    ];
  }

  // Default Fantasy
  return [
    {
      id: "trial_loot_s1",
      name: "Causal Fracture Shard",
      type: "material",
      rarity: "uncommon",
      description: "A crystalline spacetime fragment salvaged from Fracture-Alpha. Emits faint temporal resonance.",
      effect: "+5% Arcane Resonance • Usable in artifact infusion",
      imageUrl: generateProceduralLootSvg({ name: "Causal Fracture Shard", rarity: "uncommon", type: "material" }),
    },
    {
      id: "trial_loot_s2",
      name: "Obsidian Void Core",
      type: "relic",
      rarity: "rare",
      description: "Extracted from the Obsidian Void Predator. Houses stabilized gravitational void matter.",
      effect: "+15 Max MP • Voidstrider & Singularity Synergy Catalyst",
      imageUrl: generateProceduralLootSvg({ name: "Obsidian Void Core", rarity: "rare", type: "relic" }),
    },
    {
      id: "trial_loot_s3",
      name: "Chrono-Stasis Elixir",
      type: "consumable",
      rarity: "rare",
      description: "A liquid suspension of halted seconds created by the Time-Lost Archon.",
      effect: "Instantly restores 50 HP and 40 MP in high-stakes combat",
      imageUrl: generateProceduralLootSvg({ name: "Chrono-Stasis Elixir", rarity: "rare", type: "potion" }),
    },
    {
      id: "trial_loot_s4",
      name: "Titan Calamity Plating",
      type: "armor",
      rarity: "relic",
      description: "Heavy plate alloy scavenged from the Calamity Automaton Titan.",
      effect: "+25 Max HP • Reduces incoming burst damage by 15%",
      imageUrl: generateProceduralLootSvg({ name: "Titan Calamity Plating", rarity: "relic", type: "armor" }),
    },
    {
      id: "trial_loot_s5",
      name: "Administrator's Singularity Seal",
      type: "relic",
      rarity: "relic",
      description: "An authentic authority glyph bestowed by the Causal Arbitrator for conquering all 5 trial sectors.",
      effect: "+35 Max HP • +25 Max MP • Singularity Sovereign Synergy Capstone",
      imageUrl: generateProceduralLootSvg({ name: "Administrator's Singularity Seal", rarity: "relic", type: "relic" }),
    },
  ];
}
