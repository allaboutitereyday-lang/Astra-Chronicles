/**
 * The Causal Covenant Engine (Pitch A) for Astra Chronicles
 * 
 * Provides forbidden reality severance mechanics, permanent plausibility cap burn,
 * procedural timeline scars, and companion moral reactions when the player
 * chooses to defy cosmic fate.
 */

import {
  TimelineScar,
  CausalCovenantState,
  SystemState,
  SystemToastNotification,
} from "@/types/system";

export const COVENANT_CAP_BURN_AMOUNT = 15;
export const MINIMUM_ALLOWED_CAP = 30;

/**
 * Evaluates whether the forbidden Causal Covenant can be invoked on the active turn.
 */
export function checkCovenantAvailability(
  systemState?: SystemState | null,
  gameState?: any,
  playerHp: number = 100,
  playerMaxHp: number = 100
): { available: boolean; reason?: string } {
  const currentCap = systemState?.covenantState?.maxPlausibilityCap ?? 100;
  if (currentCap <= MINIMUM_ALLOWED_CAP) {
    return {
      available: false,
      reason: "Timeline Integrity Critical: Maximum Causal Anchor exhausted. Further reality severance would cause total timeline collapse.",
    };
  }

  const hpRatio = playerMaxHp > 0 ? playerHp / playerMaxHp : 1.0;
  const isHpCritical = hpRatio <= 0.35;
  const isPlausibilityStrained = (systemState?.plausibility ?? 80) <= 45;
  const isPenaltyActive = Boolean(systemState?.penaltyScenario?.isActive);
  const isTenseNarrative =
    gameState?.mood?.toLowerCase().includes("tense") ||
    gameState?.mood?.toLowerCase().includes("combat") ||
    gameState?.mood?.toLowerCase().includes("danger") ||
    gameState?.mood?.toLowerCase().includes("lethal") ||
    gameState?.dialogue?.toLowerCase().includes("die") ||
    gameState?.dialogue?.toLowerCase().includes("kill") ||
    gameState?.dialogue?.toLowerCase().includes("end");

  if (isHpCritical || isPlausibilityStrained || isPenaltyActive || isTenseNarrative) {
    return {
      available: true,
      reason: "Critical Spacetime Fracture Detected: Reality severance protocol ready to overwrite impossible odds.",
    };
  }

  return {
    available: false,
    reason: "Timeline Coherent: Covenant protocols remain dormant until life-or-death crisis occurs.",
  };
}

/**
 * Procedurally generates a Timeline Scar when reality is overwritten.
 */
export function generateTimelineScar(context: {
  turnNumber: number;
  companionName?: string;
  locationName?: string;
  genre?: string;
}): TimelineScar {
  const turn = context.turnNumber || 1;
  const comp = context.companionName || "Companion";
  const loc = context.locationName || "the sector";
  const isCyber = (context.genre || "").toLowerCase().includes("cyber");

  const scarTypes: ("amnesia" | "blight" | "chronal_shadow" | "severance")[] = [
    "amnesia",
    "blight",
    "chronal_shadow",
    "severance",
  ];
  const selectedType = scarTypes[(turn + Math.floor(Math.random() * 4)) % scarTypes.length];

  if (selectedType === "amnesia") {
    return {
      id: `scar_amnesia_${Date.now()}`,
      title: `Severed Memory: ${comp}'s Hollowed Recollection`,
      description: isCyber
        ? `The timeline was forcibly rewritten to save ${comp}'s neural core, but the sector of their memory holding your prior private conversation was irrevocably wiped.`
        : `The timeline was rewritten to preserve ${comp}'s life, but a cherished shared memory has vanished from their mind like morning mist.`,
      scarType: "amnesia",
      affectedCompanionName: comp,
      affectedLocationName: loc,
      plausibilityCapReduction: COVENANT_CAP_BURN_AMOUNT,
      createdAtTurn: turn,
      createdAtTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (selectedType === "blight") {
    return {
      id: `scar_blight_${Date.now()}`,
      title: `Planar Blight: ${loc} Dimensional Fracture`,
      description: isCyber
        ? `Overclocking the spacetime buffer caused a permanent data-bleed in ${loc}. Holographic static and floating neon debris now glitch continuously across the perimeter.`
        : `Unnatural miracle shattered the regional leylines in ${loc}. The ground is now permanently split by hovering, jagged obsidian shards pulsing with violet void energy.`,
      scarType: "blight",
      affectedCompanionName: comp,
      affectedLocationName: loc,
      plausibilityCapReduction: COVENANT_CAP_BURN_AMOUNT,
      createdAtTurn: turn,
      createdAtTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  if (selectedType === "chronal_shadow") {
    return {
      id: `scar_shadow_${Date.now()}`,
      title: "Chronal Phantom: The Discarded Self",
      description:
        "The timeline branch where you died did not completely vanish. An eerie, hollow phantom of your fallen self now lurks in the periphery of your peripheral vision, observing your moves.",
      scarType: "chronal_shadow",
      affectedCompanionName: comp,
      affectedLocationName: loc,
      plausibilityCapReduction: COVENANT_CAP_BURN_AMOUNT,
      createdAtTurn: turn,
      createdAtTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  // Default: Severance
  return {
    id: `scar_severance_${Date.now()}`,
    title: "Aetheric Severance: Cosmic Covenant Tear",
    description:
      "A raw, unhealed scar across the multiverse fabric. The LitRPG Administrator's warning runes burn permanently into the sky, demanding future causal restitution.",
    scarType: "severance",
    affectedCompanionName: comp,
    affectedLocationName: loc,
    plausibilityCapReduction: COVENANT_CAP_BURN_AMOUNT,
    createdAtTurn: turn,
    createdAtTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Returns distinct moral reactions from companions when reality is corrupted.
 */
export function getCompanionMoralReactionDirective(companionName?: string): string {
  const name = (companionName || "").toLowerCase();
  if (name.includes("evelyn")) {
    return "Evelyn is visibly shaken and torn: her rigid adherence to imperial law and natural order recoils at your forbidden cosmic miracle, yet her heart is pierced by your willingness to defile reality itself to shield her.";
  }
  if (name.includes("aria")) {
    return "Aria's cynical smirk drops completely. Having spent her life in dark alleys, she recognizes the stench of a lethal pact. She watches you with guarded intensity, warning you that the universe always collects its debts.";
  }
  if (name.includes("serena")) {
    return "Serena falls to her knees, clutching her holy rosary/blade. She senses the permanent strain on your soul anchor and vows with fierce devotion to serve as your physical shield so you never bear this dark toll again.";
  }
  if (name.includes("morgana")) {
    return "Morgana's crimson eyes dilate with dark fascination and intoxicating respect. She loves that you dared to tear the heavens in two, urging you forward with predatory charm.";
  }
  if (name.includes("perci")) {
    return "Perci cowers behind your mantle, her fox ears flattened in terror at the blinding spatial rift. She whispers tremulously, clinging to your arm to assure herself you are still real.";
  }
  return "The companion looks upon the shattered spacetime rift with awe and dread, realizing you command powers beyond mortal boundaries.";
}

/**
 * Executes the Causal Covenant, applying cap burn and generating the timeline scar.
 */
export function executeCausalCovenant(
  systemState: SystemState,
  currentTurn: number,
  context: { companionName?: string; locationName?: string; genre?: string }
): {
  scar: TimelineScar;
  newCap: number;
  systemToast: SystemToastNotification;
  narrativeDirective: string;
} {
  const existingCovenant = systemState.covenantState || {
    covenantsInvoked: 0,
    maxPlausibilityCap: 100,
    timelineScars: [],
    activeAnomalies: [],
  };

  const newCap = Math.max(MINIMUM_ALLOWED_CAP, existingCovenant.maxPlausibilityCap - COVENANT_CAP_BURN_AMOUNT);
  const scar = generateTimelineScar({
    turnNumber: currentTurn,
    companionName: context.companionName,
    locationName: context.locationName,
    genre: context.genre,
  });

  const updatedScars = [...existingCovenant.timelineScars, scar];
  const updatedAnomalies = [...existingCovenant.activeAnomalies, scar.title];

  systemState.covenantState = {
    covenantsInvoked: existingCovenant.covenantsInvoked + 1,
    maxPlausibilityCap: newCap,
    timelineScars: updatedScars,
    activeAnomalies: updatedAnomalies,
  };

  // Re-anchor current plausibility to new cap
  systemState.plausibility = newCap;

  const moralReaction = getCompanionMoralReactionDirective(context.companionName);

  const narrativeDirective = `--- CAUSAL COVENANT EXECUTED: TIMELINE OVERWRITE EVENT ---
The protagonist has invoked the forbidden "Causal Covenant: Reality Severance".
- Cosmic Stakes: The protagonist has forcibly rewritten the outcome of the lethal crisis, achieving an absolute, reality-defying victory/miracle.
- Dark Price Paid: The maximum causal anchor of reality has permanently burned by -${COVENANT_CAP_BURN_AMOUNT}% (New Anchor Cap: ${newCap}%).
- Permanent Timeline Scar: "${scar.title}" - ${scar.description}
- Companion Moral Reaction: ${moralReaction}
- Narration Instruction: Narrate this moment with breathtaking dark fantasy intensity. Describe the fabric of spacetime tearing open in shimmering violet and starlight fractals as the fatal outcome is incinerated into dust, followed by the harrowing weight of the permanent scar settling into the world.`;

  const systemToast: SystemToastNotification = {
    id: `toast_covenant_${Date.now()}`,
    type: "covenant_severance",
    title: "CAUSAL COVENANT INVOKED",
    subtitle: `Reality Severed: ${scar.title} • Anchor Burned to ${newCap}%`,
    difficulty: "Calamity",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  return {
    scar,
    newCap,
    systemToast,
    narrativeDirective,
  };
}

