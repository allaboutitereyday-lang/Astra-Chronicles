/**
 * Dynamic Story & Companion Assembler for Astra Chronicles Creator Studio
 * 
 * Synthesizes rich introductory prologue nodes, strict [Tone/Action] choice vectors,
 * genre-tailored starting relic inventories, and initial 3-tier branching flowchart trees.
 */

import {
  StoryContext,
  StoryStartingNode,
  StoryCompanion,
  StoryRelicItem,
  StoryFlowNode,
} from "@/types/story";
import { generateProceduralLootSvg } from "./proceduralArt";

/**
 * Generates 4 strictly formatted starting choices conforming to:
 * [Tone/Action]: Short summary of character action/dialogue
 */
export function generateDynamicPrologueChoices(
  companion: StoryCompanion,
  locationName: string,
  genre: string
): [string, string, string, string] {
  const compName = companion.name || "the companion";
  const role = companion.role || "Wanderer";
  const isCyber = genre.toLowerCase().includes("cyber") || genre.toLowerCase().includes("tech");
  const isCosmic = genre.toLowerCase().includes("cosmic") || genre.toLowerCase().includes("space");

  if (isCyber) {
    return [
      `[Decrypt/Analytical]: Transmit your encrypted personal cipher and request an immediate tactical exchange.`,
      `[Subterfuge/Hacking]: Scan ${compName}'s neural emissions for tracking spyware before acknowledging their callout.`,
      `[Composure/Diplomatic]: Step calmly into the neon spill and slide a certified cred-chip across the wet terminal.`,
      `[Combat/Defiant]: Ready your sidearm, hold the firing line, and advise ${compName} not to make sudden moves.`,
    ];
  }

  if (isCosmic) {
    return [
      `[Inquire/Analytical]: Broadcast your bioscan telemetry and query ${compName} regarding the ship's anomaly status.`,
      `[Tactics/Vigilant]: Keep your magnetic boots anchored and check your environmental suit's oxygen reserves.`,
      `[Diplomacy/Measured]: Raise an open hand in the zero-g corridor and propose a mutual survival truce.`,
      `[Combat/Decisive]: Prime your energy carbine and demand proof that ${compName} has not been compromised by xenoflora.`,
    ];
  }

  // Default High Fantasy / Grimdark
  return [
    `[Composure/Diplomatic]: Step forward into the light, meet ${compName}'s gaze evenly, and offer a contract of alliance.`,
    `[Tactics/Analytical]: Detail an acute tactical anomaly you observed along the perimeter of ${locationName}.`,
    `[Subterfuge/Cunning]: Keep your hand near your concealed blade and subtly test whether ${compName} is shadowed by guards.`,
    `[Combat/Defiant]: Draw your steel with a measured scrape and state that you yield the right-of-way to no one.`,
  ];
}

/**
 * Synthesizes an evocative, sensory-rich prologue encounter node for a companion.
 */
export function synthesizeHeroinePrologueNode(
  companion: StoryCompanion,
  location: { name: string; description?: string; bgImage?: string },
  worldDraft: any,
  index: number
): StoryStartingNode {
  const locName = location.name || "Starting Point";
  const compName = companion.name || "Companion";
  const compTitle = companion.title || companion.role || "Ally";
  const personality = companion.personality || "Observant and guarded";
  const genre = worldDraft.genre || "High Fantasy";

  const isCyber = genre.toLowerCase().includes("cyber") || genre.toLowerCase().includes("tech");
  const isCosmic = genre.toLowerCase().includes("cosmic") || genre.toLowerCase().includes("space");

  let sceneSetup = "";
  let dialogue = "";

  if (isCyber) {
    sceneSetup = `Rain slicks the ferrocrete walkways of ${locName}, reflecting fractured ribbons of holographic advertisements and humming neon conduits. Through the steam rising from a geothermal grating, ${compName} (${compTitle}) detaches from the perimeter shadows, their ocular implants glowing with a cool, appraisal hum.`;
    dialogue = `"Your biometric signature just pinged three private security frequencies in ${locName}. State your objective before the corporate hounds trace you to my coordinates."`;
  } else if (isCosmic) {
    sceneSetup = `Emergency lumens flicker amber through the bulkheads of ${locName}. The silence of deep space presses against the observation viewport. Emerging from a depressurized airlock, ${compName} (${compTitle}) pauses, posture poised with professional vigilance as environmental seals hiss shut.`;
    dialogue = `"Anomaly readings just spiked across this corridor. Identify yourself and verify your causal stability before you take another step."`;
  } else {
    sceneSetup = `Winds whip through the ancient stones of ${locName}, carrying the scent of ozone and dormant arcane leylines. Across the courtyard, ${compName} (${compTitle}) stands motionless, hand resting lightly upon their weapon, their gaze reading your stride with sharp, practiced discernment. ${personality.slice(0, 100)}`;
    dialogue = `"You walk unanchored through ${locName}. Speak your purpose with clarity, traveler—the lines between ally and sovereign threat blur quickly in these lands."`;
  }

  return {
    id: `prologue_${companion.id || index}`,
    speaker: compName,
    title: `${compName}: ${locName}`,
    location: locName,
    sceneSetup,
    dialogue,
    expressionKey: "neutral",
    initialAffection: companion.baseAffection || 15,
    bgImage: location.bgImage || worldDraft.coverImage,
    choices: generateDynamicPrologueChoices(companion, locName, genre),
  };
}

/**
 * Generates an initial starter relic inventory aligned with the world's power system.
 */
export function buildDefaultRelicSetForGenre(genre: string): StoryRelicItem[] {
  const isCyber = genre.toLowerCase().includes("cyber") || genre.toLowerCase().includes("tech");
  const isCosmic = genre.toLowerCase().includes("cosmic") || genre.toLowerCase().includes("space");

  if (isCyber) {
    return [
      {
        id: "relic_cyber_starter_1",
        name: "Sub-Dermal Neural Anchor",
        setName: "Syndicate Netrunner",
        type: "relic",
        rarity: "uncommon",
        description: "A hardened cortical implant that dampens feedback from unauthorized brain-computer queries.",
        effect: "+10 Max MP • +5% Shock Resistance",
        imageUrl: generateProceduralLootSvg({ name: "Sub-Dermal Neural Anchor", rarity: "uncommon", type: "tech" }),
      },
      {
        id: "relic_cyber_starter_2",
        name: "Graphene Trench Knife",
        setName: "Syndicate Netrunner",
        type: "weapon",
        rarity: "common",
        description: "Monofilament-edged combat knife designed for silent perimeter clearances.",
        effect: "+8 Base Attack Prowess",
        imageUrl: generateProceduralLootSvg({ name: "Graphene Trench Knife", rarity: "common", type: "weapon" }),
      },
    ];
  }

  if (isCosmic) {
    return [
      {
        id: "relic_cosmic_starter_1",
        name: "Graviton Nav-Compass",
        setName: "Voidstrider",
        type: "relic",
        rarity: "uncommon",
        description: "A gyro-stabilized chronometer tracking micro-singularities and hyperlane drift.",
        effect: "+15 Max MP • Causal Horizon Catalyst",
        imageUrl: generateProceduralLootSvg({ name: "Graviton Nav-Compass", rarity: "uncommon", type: "relic" }),
      },
      {
        id: "relic_cosmic_starter_2",
        name: "Nanite Fiber Undersuit",
        setName: "Voidstrider",
        type: "armor",
        rarity: "common",
        description: "A pressurized flight garment woven with radiation-deflecting graphene threads.",
        effect: "+12 Max HP",
        imageUrl: generateProceduralLootSvg({ name: "Nanite Fiber Undersuit", rarity: "common", type: "armor" }),
      },
    ];
  }

  // Default Fantasy
  return [
    {
      id: "relic_fantasy_starter_1",
      name: "Causal Horizon Talisman",
      setName: "Voidstrider",
      type: "relic",
      rarity: "uncommon",
      description: "An engraved obsidian talisman that hums softly when dimensional boundaries ripple.",
      effect: "+10 Max MP • Void Resonance Catalyst",
      imageUrl: generateProceduralLootSvg({ name: "Causal Horizon Talisman", rarity: "uncommon", type: "relic" }),
    },
    {
      id: "relic_fantasy_starter_2",
      name: "Tempered Iron Broadsword",
      type: "weapon",
      rarity: "common",
      description: "A well-balanced imperial steel blade bearing standard citadel proof marks.",
      effect: "+10 Base Attack Prowess",
      imageUrl: generateProceduralLootSvg({ name: "Tempered Iron Broadsword", rarity: "common", type: "weapon" }),
    },
  ];
}

/**
 * Builds a structured initial 3-tier interactive flowchart tree.
 */
export function buildInitialFlowchartTree(
  startingNodes: StoryStartingNode[],
  storyTitle: string
): StoryFlowNode[] {
  const tree: StoryFlowNode[] = [];

  // Tier 1: Starting Nodes (one per companion encounter)
  startingNodes.forEach((node, idx) => {
    tree.push({
      id: node.id,
      nodeKey: `start_node_${idx + 1}`,
      title: node.title,
      speaker: node.speaker,
      location: node.location,
      summary: `Initial encounter with ${node.speaker} in ${node.location}.`,
      isStartingPoint: true,
      connectedTo: ["node_act1_crossroads"],
    });
  });

  // Tier 2: Act I Narrative Crossroads
  tree.push({
    id: "node_act1_crossroads",
    nodeKey: "act1_crossroads",
    title: "Act I: Causal Crossroads",
    speaker: "Narrator",
    location: startingNodes[0]?.location || "Sanctuary",
    summary: `The immediate threats of the opening encounter are resolved. The party coordinates their next strategic advance toward the primary spacetime anomaly.`,
    connectedTo: ["node_act1_climax", "node_glitch_singularity"],
  });

  // Tier 3: Act I Climax Convergence
  tree.push({
    id: "node_act1_climax",
    nodeKey: "act1_climax",
    title: "Act I Climax: Anomaly Convergence",
    speaker: startingNodes[0]?.speaker || "Companion",
    location: "Spacetime Fracture",
    summary: `The sovereign directive reveals itself as planar barriers shatter. An ominous trial gauntlet awaits.`,
    connectedTo: [],
    unlockRequirement: {
      minAffection: 20,
    },
  });

  // Secret Glitch Node (unlocked only under low plausibility)
  tree.push({
    id: "node_glitch_singularity",
    nodeKey: "glitch_singularity",
    title: "Glitch Node: The Unwritten Timeline",
    speaker: "The Multiverse Administrator",
    location: "Null-Space Void",
    summary: `A hidden fracture where timeline continuity fails, revealing forbidden glimpses of the world's architect.`,
    isGlitchNode: true,
    glitchRequirement: {
      maxPlausibility: 35,
      paradoxSecret: `Timeline divergence detected in ${storyTitle}.`,
    },
    connectedTo: [],
  });

  return tree;
}

/**
 * Assembles the full production-ready StoryContext with all features initialized.
 */
export function assembleFullStoryContext(
  worldDraft: any,
  companions: StoryCompanion[]
): StoryContext {
  const rawSlug = worldDraft.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const storySlug =
    rawSlug === "astra-chronicles" || rawSlug === "neon-eclipse"
      ? `${rawSlug}-${Date.now().toString().slice(-4)}`
      : rawSlug || `story-${Date.now()}`;

  const locations = worldDraft.locations && worldDraft.locations.length > 0
    ? worldDraft.locations
    : [
        {
          name: "Starting Sanctuary",
          zone: "Borderlands",
          danger: "Low",
          description: "An atmospheric gateway into the realm.",
          bgImage: worldDraft.coverImage || "/backgrounds/imperial_capital_imperium.jpg",
        },
      ];

  // Synthesize Starting Nodes with strict [Tone/Action] choice guidelines
  const startingNodes: StoryStartingNode[] = companions.map((comp, idx) => {
    const loc = locations[idx % locations.length];
    return synthesizeHeroinePrologueNode(comp, loc, worldDraft, idx);
  });

  // Construct initial 3-tier flowchart graph
  const flowchartTree = buildInitialFlowchartTree(startingNodes, worldDraft.title);

  // Build genre-tailored starting relic inventory
  const relicInventory = buildDefaultRelicSetForGenre(worldDraft.genre || "Fantasy");

  const fullStory: StoryContext = {
    id: storySlug,
    title: worldDraft.title,
    tagline: worldDraft.tagline,
    description: worldDraft.loreSummary,
    coverImage: worldDraft.coverImage,
    genre: worldDraft.genre,
    themes: [
      (worldDraft.genre || "Fantasy").split("/")[0].trim(),
      "Dynamic Companions",
      "LitRPG System",
      "Branching Flowchart",
    ],
    narrationStyle: worldDraft.narrationStyle || "Grimdark & Atmospheric",
    createdAt: new Date().toISOString(),
    author: "Realm Creator",
    isPreset: false,
    worldContext: {
      settingName: worldDraft.settingName,
      loreSummary: worldDraft.loreSummary,
      locations,
    },
    rpgRules: {
      systemName: worldDraft.systemName || "LitRPG System Administrator",
      currencyName: worldDraft.currencyName || "Gold",
      causalAnchorName: worldDraft.causalAnchorName || "Causal Plausibility",
      defaultPlausibility: 80,
      statDefinitions: {
        str: "Strength / Power Output",
        dex: "Dexterity / Reaction Speed",
        int: "Intelligence / Arcana Analysis",
      },
      startingLevel: 1,
      baseStats: {
        hp: 100,
        maxHp: 100,
        mp: 60,
        maxMp: 60,
        exp: 0,
        maxExp: 100,
        str: 10,
        dex: 10,
        int: 10,
      },
    },
    startingNodes,
    companions,
    romancePath: "uncommitted",
    relicInventory,
    activeSynergies: [],
    visitedNodes: [],
    flowchartTree,
  };

  return fullStory;
}

