import {
  ASH_VELVET_HEROINE_DOSSIERS,
  AshVelvetHeroineMeters,
  AshVelvetHouseState,
  AshVelvetTimeSlot,
} from "@/types/ash_and_velvet";

export const ASH_VELVET_TIME_SLOTS: AshVelvetTimeSlot[] = [
  "MORNING",
  "AFTERNOON",
  "EVENING",
  "LATE_NIGHT",
  "AFTER_MIDNIGHT",
];

const TIME_SLOT_CLOCK_LABELS: Record<AshVelvetTimeSlot, string> = {
  MORNING: "8:15 AM",
  AFTERNOON: "2:40 PM",
  EVENING: "7:30 PM",
  LATE_NIGHT: "11:45 PM",
  AFTER_MIDNIGHT: "2:14 AM",
};

export const ASH_VELVET_TIME_SLOT_DISPLAY: Record<AshVelvetTimeSlot, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
  LATE_NIGHT: "Late Night",
  AFTER_MIDNIGHT: "After Midnight",
};

/**
 * Default daily schedule mapping every heroine to a natural location across all 14 rooms
 * based on the current Time Slot.
 */
export const HEROINE_SCHEDULE_BY_SLOT: Record<AshVelvetTimeSlot, Record<string, string>> = {
  MORNING: {
    "Clara Callahan": "Clara's Kitchen & Living Room",
    "Hannah Lindqvist": "Hannah's Studio Bedroom (Room 202)",
    "Brianna Chen": "Upstairs Hallway & Shared Bath",
    "Sierra Holloway": "Clara's Kitchen & Living Room",
    "Chloe Bellamy": "Chloe's Executive Bedroom (Room 205)",
    "Jill Smith": "Clara's Kitchen & Living Room",
    "Tina Smith": "Tina's Bedroom (Room 206)",
  },
  AFTERNOON: {
    "Clara Callahan": "Clara's Kitchen & Living Room",
    "Hannah Lindqvist": "Hannah's Studio Bedroom (Room 202)",
    "Brianna Chen": "Brianna's Bedroom (Room 203)",
    "Sierra Holloway": "Starlight Retro Diner",
    "Chloe Bellamy": "After-Hours Bourbon Lounge",
    "Jill Smith": "Clara's Kitchen & Living Room",
    "Tina Smith": "Tina's Bedroom (Room 206)",
  },
  EVENING: {
    "Clara Callahan": "Clara's Kitchen & Living Room",
    "Hannah Lindqvist": "Velvet Static Dive Bar",
    "Brianna Chen": "Backyard Porch & Smoke Patio",
    "Sierra Holloway": "Starlight Retro Diner",
    "Chloe Bellamy": "After-Hours Bourbon Lounge",
    "Jill Smith": "Backyard Porch & Smoke Patio",
    "Tina Smith": "Clara's Kitchen & Living Room",
  },
  LATE_NIGHT: {
    "Clara Callahan": "Clara's Late-Night Den",
    "Hannah Lindqvist": "Velvet Static Dive Bar",
    "Brianna Chen": "Brianna's Bedroom (Room 203)",
    "Sierra Holloway": "Backyard Porch & Smoke Patio",
    "Chloe Bellamy": "Chloe's Executive Bedroom (Room 205)",
    "Jill Smith": "Clara's Late-Night Den",
    "Tina Smith": "Tina's Bedroom (Room 206)",
  },
  AFTER_MIDNIGHT: {
    "Clara Callahan": "Clara's Late-Night Den",
    "Hannah Lindqvist": "Backyard Porch & Smoke Patio",
    "Brianna Chen": "Brianna's Bedroom (Room 203)",
    "Sierra Holloway": "Sierra's Bedroom (Room 204)",
    "Chloe Bellamy": "Chloe's Executive Bedroom (Room 205)",
    "Jill Smith": "Clara's Late-Night Den",
    "Tina Smith": "Tina's Bedroom (Room 206)",
  },
};

export const HEROINE_SHORT_LOCATION_LABELS: Record<string, string> = {
  "Clara's Kitchen & Living Room": "Kitchen",
  "Upstairs Hallway & Shared Bath": "Hallway",
  "Upstairs Shared Bathroom": "Bathroom",
  "Clara's Late-Night Den": "Den",
  "The Attic Sanctuary Room": "Attic",
  "Velvet Static Dive Bar": "Dive Bar",
  "Backyard Porch & Smoke Patio": "Patio",
  "Clara's Master Bedroom (Room 101)": "Rm 101",
  "Hannah's Studio Bedroom (Room 202)": "Rm 202",
  "Brianna's Bedroom (Room 203)": "Rm 203",
  "Sierra's Bedroom (Room 204)": "Rm 204",
  "Chloe's Executive Bedroom (Room 205)": "Rm 205",
  "Tina's Bedroom (Room 206)": "Rm 206",
  "Starlight Retro Diner": "Diner",
  "After-Hours Bourbon Lounge": "Lounge",
};

export function shortenAshVelvetLocation(loc: string): string {
  if (!loc) return "412 Maplewood";
  if (HEROINE_SHORT_LOCATION_LABELS[loc]) return HEROINE_SHORT_LOCATION_LABELS[loc];
  const lower = loc.toLowerCase();
  if (lower.includes("kitchen")) return "Kitchen";
  if (lower.includes("bathroom")) return "Bathroom";
  if (lower.includes("hallway")) return "Hallway";
  if (lower.includes("den")) return "Den";
  if (lower.includes("attic")) return "Attic";
  if (lower.includes("velvet static") || lower.includes("dive")) return "Dive Bar";
  if (lower.includes("patio") || lower.includes("porch")) return "Patio";
  if (lower.includes("diner")) return "Diner";
  if (lower.includes("bourbon") || lower.includes("lounge")) return "Lounge";
  if (lower.includes("101") || lower.includes("clara's master")) return "Rm 101";
  if (lower.includes("202") || lower.includes("hannah")) return "Rm 202";
  if (lower.includes("203") || lower.includes("brianna")) return "Rm 203";
  if (lower.includes("204") || lower.includes("sierra")) return "Rm 204";
  if (lower.includes("205") || lower.includes("chloe")) return "Rm 205";
  if (lower.includes("206") || lower.includes("tina")) return "Rm 206";
  return loc.length > 14 ? `${loc.slice(0, 12)}…` : loc;
}

export function clampMeter(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function getHeroineStartingMeters(name: string): AshVelvetHeroineMeters {
  const key = Object.keys(ASH_VELVET_HEROINE_DOSSIERS).find(
    (k) => k.toLowerCase() === (name || "").toLowerCase()
  );
  if (key) {
    return { ...ASH_VELVET_HEROINE_DOSSIERS[key].startingMeters };
  }
  return { affection: 15, lust: 15, submission: 25, trust: 20, jealousy: 5, sensitivity: 15 };
}

export function resolveHeroineMeters(comp: {
  name: string;
  affection?: number;
  lust?: number;
  submission?: number;
  trust?: number;
  jealousy?: number;
  sensitivity?: number;
}): AshVelvetHeroineMeters {
  const base = getHeroineStartingMeters(comp.name);
  return {
    affection: clampMeter(typeof comp.affection === "number" ? comp.affection : base.affection),
    lust: clampMeter(typeof comp.lust === "number" ? comp.lust : base.lust),
    submission: clampMeter(typeof comp.submission === "number" ? comp.submission : base.submission),
    trust: clampMeter(typeof comp.trust === "number" ? comp.trust : base.trust),
    jealousy: clampMeter(typeof comp.jealousy === "number" ? comp.jealousy : base.jealousy),
    sensitivity: clampMeter(
      typeof comp.sensitivity === "number" ? comp.sensitivity : base.sensitivity ?? 15
    ),
  };
}

export function getSensitivityStageLabel(sensitivity: number): string {
  if (sensitivity >= 85) return "Corrupted & Addicted";
  if (sensitivity >= 65) return "Hypersensitive";
  if (sensitivity >= 40) return "Craving Gaze & Touch";
  if (sensitivity >= 20) return "Body Aware & Tingling";
  return "Unconditioned";
}

export function isHeroineSecretUnlocked(
  heroineName: string,
  meters: AshVelvetHeroineMeters
): boolean {
  const dossier = ASH_VELVET_HEROINE_DOSSIERS[heroineName];
  const req = dossier?.secretUnlockRequirement || { minTrust: 42, minAffection: 38 };
  return meters.trust >= req.minTrust || meters.affection >= req.minAffection + 8;
}

export type AshVelvetCompatibilitySynergy = "MATCHED" | "NEUTRAL" | "CLASH";

export function evaluatePersonalityCompatibility(params: {
  heroineName: string;
  playerPersonality?: string;
  playerConduit?: string;
  playerRole?: string;
  actionText?: string;
}): {
  synergy: AshVelvetCompatibilitySynergy;
  multiplier: number;
  thresholdReduction: number;
  summaryLabel: string;
} {
  const dossier = ASH_VELVET_HEROINE_DOSSIERS[params.heroineName];
  if (!dossier) {
    return {
      synergy: "NEUTRAL",
      multiplier: 1.0,
      thresholdReduction: 0,
      summaryLabel: "Neutral Dynamic",
    };
  }

  const pText = `${params.playerPersonality || ""} ${params.playerRole || ""}`.toLowerCase();
  const conduit = (params.playerConduit || "").toUpperCase();
  const actLower = (params.actionText || "").toLowerCase();

  const matchesPersona = dossier.preferredPersonalities.some((pref) => {
    const words = pref.toLowerCase().split(/\s+/);
    return words.some((w) => w.length >= 4 && pText.includes(w));
  });
  const matchesApproach = dossier.preferredApproaches.includes(conduit as any);

  const nLower = params.heroineName.toLowerCase();
  const matchesIntent =
    ((nLower.includes("chloe") || nLower.includes("brianna")) &&
      /\[dom\]|\[cool\]|call her bluff|command|hold her gaze|steady/i.test(actLower)) ||
    ((nLower.includes("clara") || nLower.includes("sierra") || nLower.includes("jill")) &&
      /\[heart\]|\[dom\]|protect|gentle|tease|warm|close/i.test(actLower)) ||
    ((nLower.includes("hannah") || nLower.includes("tina")) &&
      /\[bold\]|\[dom\]|dare|bet|drink|reckless|play along/i.test(actLower));

  if ((matchesPersona && matchesApproach) || (matchesPersona && matchesIntent) || (matchesApproach && matchesIntent)) {
    return {
      synergy: "MATCHED",
      multiplier: 1.4,
      thresholdReduction: 14,
      summaryLabel: "High Chemistry Match (1.4x Sensitivity & Receptive)",
    };
  }
  if (matchesPersona || matchesApproach || matchesIntent) {
    return {
      synergy: "MATCHED",
      multiplier: 1.25,
      thresholdReduction: 10,
      summaryLabel: "Compatible Vibe (1.25x Sensitivity & Receptive)",
    };
  }

  const isClashingCruelty =
    /\b(insult|mock her trauma|slap|yell at her|humiliate|cruel)\b/i.test(actLower);
  if (isClashingCruelty) {
    return {
      synergy: "CLASH",
      multiplier: 0.6,
      thresholdReduction: -15,
      summaryLabel: "Hostile Clash (Guard Hardened)",
    };
  }

  return {
    synergy: "NEUTRAL",
    multiplier: 1.0,
    thresholdReduction: 0,
    summaryLabel: "Standard Chemistry",
  };
}

export type AshVelvetEscalationTier =
  | "NONE"
  | "TIER_1_GAZE_AND_TEASE"
  | "TIER_2_LIGHT_TOUCH_AND_FLIRT"
  | "TIER_3_HEAVY_ESCALATION_OR_UNDRESS"
  | "TIER_4_EXPLICIT_CORRUPTION";

export function classifyAshVelvetEscalationTier(actionText: string): AshVelvetEscalationTier {
  const act = (actionText || "").toLowerCase();
  if (!act.trim()) return "NONE";

  // Tier 4: Full explicit / raw sexual escalation or demanding full submission/stripping
  if (
    /\b(fuck|sex|penetrat|spread her legs|on her knees|strip naked|take off everything|bend her over|ride|oral|blowjob|cunnilingus|inside her|breed|climax|orgasm)\b/i.test(
      act
    )
  ) {
    return "TIER_4_EXPLICIT_CORRUPTION";
  }

  // Tier 3: Heavy physical escalation, kissing lips/neck, hands under clothes, groping breasts/ass, pulling off towel/lingerie
  if (
    /\b(kiss her|pull off her towel|drop the towel|unbutton|unzip|undress|under her shirt|under her skirt|fondle|grope|squeeze her|cup her breast|grab her ass|straddle|pin her down|push her onto the bed|lick|bite her neck|suck)\b/i.test(
      act
    )
  ) {
    return "TIER_3_HEAVY_ESCALATION_OR_UNDRESS";
  }

  // Tier 2: Close flirtatious touch, waist/thigh/hip/chin contact, leaning in close, whispering against ear
  if (
    /\b(touch|brush|graze|hand on her waist|hand on her thigh|hand on her hip|stroke her|caress|pull her close|step closer|lean in|whisper in her ear|tuck her hair|chin|hold her hand|arm around her|sit between)\b/i.test(
      act
    )
  ) {
    return "TIER_2_LIGHT_TOUCH_AND_FLIRT";
  }

  // Tier 1: Doujin Gaze / Perving / Checking her out / Shameless teasing / Eye contact
  if (
    /\b(stare|gaze|look at her|eye her|check her out|checking out|peek|admire|watch her|cleavage|breasts|thighs|hips|legs|towel|curves|blush|tease|flirt|compliment|wink|smirk|shameless|eyes up)\b/i.test(
      act
    ) ||
    /\[flame\]|\[dom\]|\[bold\]/i.test(act)
  ) {
    return "TIER_1_GAZE_AND_TEASE";
  }

  return "NONE";
}

export function evaluateAshVelvetAdvanceAndBoundary(params: {
  heroineName: string;
  meters: AshVelvetHeroineMeters;
  viceLevel?: number;
  playerPersonality?: string;
  playerConduit?: string;
  playerRole?: string;
  actionText: string;
  location?: string;
}): {
  tier: AshVelvetEscalationTier;
  compatibility: ReturnType<typeof evaluatePersonalityCompatibility>;
  effectiveReceptiveScore: number;
  requiredScore: number;
  didBackfire: boolean;
  sensitivityDelta: number;
  bonusLustDelta: number;
  backfirePenalties: {
    affectionDelta: number;
    trustDelta: number;
    lustDelta: number;
    composureDelta: number;
    jealousyDelta: number;
  } | null;
  narrativeOutcomeDirective: string;
} {
  const m = params.meters;
  const sens = m.sensitivity ?? 15;
  const vice = params.viceLevel ?? 0;
  const tier = classifyAshVelvetEscalationTier(params.actionText);
  const compatibility = evaluatePersonalityCompatibility({
    heroineName: params.heroineName,
    playerPersonality: params.playerPersonality,
    playerConduit: params.playerConduit,
    playerRole: params.playerRole,
    actionText: params.actionText,
  });

  const isPrivateRoom = /room|bedroom|den|bathroom|attic/i.test(params.location || "");
  const guardPenalty =
    params.heroineName.includes("Chloe")
      ? 10
      : params.heroineName.includes("Clara") ||
        params.heroineName.includes("Hannah") ||
        params.heroineName.includes("Brianna")
      ? 4
      : 0;

  const effectiveReceptiveScore = Math.round(
    Math.max(m.lust, sens) +
      m.affection * 0.35 +
      m.trust * 0.25 +
      vice * 0.2 +
      (isPrivateRoom ? 8 : 0) +
      compatibility.thresholdReduction -
      guardPenalty
  );

  const requiredScore =
    tier === "TIER_4_EXPLICIT_CORRUPTION"
      ? 68
      : tier === "TIER_3_HEAVY_ESCALATION_OR_UNDRESS"
      ? 44
      : tier === "TIER_2_LIGHT_TOUCH_AND_FLIRT"
      ? 18
      : 0;

  // Check if player overstepped boundaries on Tier 2/3/4
  const didBackfire =
    (tier === "TIER_3_HEAVY_ESCALATION_OR_UNDRESS" ||
      tier === "TIER_4_EXPLICIT_CORRUPTION" ||
      (tier === "TIER_2_LIGHT_TOUCH_AND_FLIRT" && compatibility.synergy === "CLASH")) &&
    effectiveReceptiveScore < requiredScore &&
    sens < (tier === "TIER_4_EXPLICIT_CORRUPTION" ? 62 : 40) &&
    m.lust < (tier === "TIER_4_EXPLICIT_CORRUPTION" ? 65 : 45);

  if (didBackfire) {
    const severity = tier === "TIER_4_EXPLICIT_CORRUPTION" ? 1.5 : 1.0;
    const penalties = {
      affectionDelta: -Math.round(4 * severity),
      trustDelta: -Math.round(5 * severity),
      lustDelta: -Math.round(3 * severity),
      composureDelta: -Math.round(8 * severity),
      jealousyDelta: Math.round(3 * severity),
    };
    return {
      tier,
      compatibility,
      effectiveReceptiveScore,
      requiredScore,
      didBackfire: true,
      sensitivityDelta: 0,
      bonusLustDelta: penalties.lustDelta,
      backfirePenalties: penalties,
      narrativeOutcomeDirective: `🚨 BOUNDARY OVERSTEP BACKFIRE (${params.heroineName.toUpperCase()}): The protagonist forced a ${tier.replace(/_/g, " ")} advance while ${params.heroineName}'s Receptive Score (${effectiveReceptiveScore}) & Sensitivity (${sens}/100) are below the required threshold (${requiredScore})! She MUST reject/slap away the advance sharply in character, pull her clothes/guard tight, and call him out for moving way too fast without earning her trust or conditioning her body first. Set affection_delta=${penalties.affectionDelta}, trust_delta=${penalties.trustDelta}, lust_delta=${penalties.lustDelta}, and wardrobe_key to her covered everyday outfit!`,
    };
  }

  // Successful Gaze / Tease / Touch conditioning (Marginal gains by default, larger only on Tier 3/4 or Kink Match!)
  const dossier = ASH_VELVET_HEROINE_DOSSIERS[params.heroineName];
  const actLower = (params.actionText || "").toLowerCase();
  const matchedKink = (dossier?.kinks || []).find((k) =>
    k.triggerKeywords.some((kw) => kw.length >= 3 && actLower.includes(kw.toLowerCase()))
  );
  const kinkBonus = matchedKink ? 1 : 0;

  const baseSensGain =
    tier === "TIER_4_EXPLICIT_CORRUPTION"
      ? 4
      : tier === "TIER_3_HEAVY_ESCALATION_OR_UNDRESS"
      ? 3
      : tier === "TIER_2_LIGHT_TOUCH_AND_FLIRT"
      ? 1 + (compatibility.synergy === "MATCHED" ? 1 : 0)
      : tier === "TIER_1_GAZE_AND_TEASE"
      ? 1
      : 0;
  const isMajorEscalation =
    tier === "TIER_3_HEAVY_ESCALATION_OR_UNDRESS" || tier === "TIER_4_EXPLICIT_CORRUPTION";
  const maxSensCap = isMajorEscalation ? 5 : 2;
  const sensitivityDelta =
    baseSensGain + kinkBonus > 0
      ? Math.max(1, Math.min(maxSensCap, baseSensGain + kinkBonus))
      : 0;

  const baseLustGain =
    tier === "TIER_4_EXPLICIT_CORRUPTION"
      ? 4
      : tier === "TIER_3_HEAVY_ESCALATION_OR_UNDRESS"
      ? 3
      : tier === "TIER_2_LIGHT_TOUCH_AND_FLIRT"
      ? 1 + (compatibility.synergy === "MATCHED" ? 1 : 0)
      : tier === "TIER_1_GAZE_AND_TEASE"
      ? 1
      : 0;
  const maxLustCap = isMajorEscalation ? 5 : 2;
  const bonusLustDelta =
    baseLustGain + kinkBonus > 0
      ? Math.max(1, Math.min(maxLustCap, baseLustGain + kinkBonus))
      : 0;

  const nextSens = clampMeter(sens + sensitivityDelta);
  const stageLabel = getSensitivityStageLabel(nextSens);

  return {
    tier,
    compatibility,
    effectiveReceptiveScore,
    requiredScore,
    didBackfire: false,
    sensitivityDelta,
    bonusLustDelta,
    backfirePenalties: null,
    narrativeOutcomeDirective:
      tier !== "NONE" || matchedKink
        ? `🔥 DOUJIN GAZE/TOUCH CONDITIONING ACTIVE (${params.heroineName.toUpperCase()} — Sensitivity ${sens}% -> ${nextSens}% [${stageLabel}] | ${compatibility.summaryLabel}${matchedKink ? ` | KINK TRIGGERED: "${matchedKink.name}"` : ""}): ${params.heroineName}'s body reacts vividly to the protagonist's gaze/advance (${dossier?.gazeReactionTell || "her skin flushes and her breath catches under his eyes"})${matchedKink ? ` — and because his action directly hits her "${matchedKink.name}" kink (${matchedKink.description}), her pulse and arousal spike sharply!` : "."} Because her Receptive Score (${effectiveReceptiveScore} >= ${requiredScore}) supports this ${tier.replace(/_/g, " ")} move, she is receptive—her body tingles and craves more of his gaze and touch${nextSens >= 35 || compatibility.synergy === "MATCHED" || matchedKink ? ", and she should actively lean closer or make a bold flirtatious/physical move back on him!" : "."}`
        : nextSens >= 35 || compatibility.synergy === "MATCHED"
        ? `💓 RECEPTIVE & PROACTIVE CHEMISTRY (${params.heroineName.toUpperCase()} — Sensitivity ${sens}% [${stageLabel}] | ${compatibility.summaryLabel}): ${params.heroineName} is drawn to the protagonist's vibe and conditioned to his gaze—have her actively flirt, show off her figure, or initiate close physical contact with him!`
        : "",
  };
}

/**
 * Enforces marginal stat shifts (-2 to +2) on routine turns while allowing larger shifts (-8 to +5)
 * only on major milestones (Tier 3/4 explicit breakthrough, Core Memory unlocked, Quest completed, or Boundary Backfire).
 */
export function clampAshVelvetTurnDelta(
  rawDelta: number,
  options?: { isMajorEvent?: boolean; isBackfire?: boolean }
): number {
  if (!Number.isFinite(rawDelta) || rawDelta === 0) return 0;
  const rounded = Math.round(rawDelta);
  if (options?.isBackfire) {
    return Math.max(-8, Math.min(5, rounded));
  }
  if (options?.isMajorEvent) {
    return rounded > 0 ? Math.max(1, Math.min(5, rounded)) : Math.max(-5, Math.min(-1, rounded));
  }
  // Routine conversational / flirt turn: strictly marginal (-2 to +2)
  if (rounded > 0) {
    return rounded >= 4 ? 2 : 1;
  }
  return rounded <= -4 ? -2 : -1;
}

export function getAffectionBondTier(affection: number): string {
  if (affection >= 85) return "Devoted";
  if (affection >= 65) return "Lover";
  if (affection >= 40) return "Confidant";
  if (affection >= 18) return "Housemate";
  return "Stranger";
}

export function getLustStateLabel(lust: number): string {
  if (lust >= 85) return "Consumed";
  if (lust >= 65) return "Heated";
  if (lust >= 40) return "Simmering";
  if (lust >= 20) return "Sparked";
  return "Cool";
}

export function getSubmissionDynamicLabel(submission: number): string {
  if (submission >= 80) return "Devotedly Submissive";
  if (submission >= 60) return "Yielding";
  if (submission >= 40) return "Softening";
  if (submission >= 22) return "Push-Pull";
  return "Guarded / Dominant";
}

export function getViceLabel(viceLevel: number): {
  label: string;
  toneClass: string;
} {
  if (viceLevel >= 75) {
    return { label: "RECKLESS", toneClass: "text-rose-300 border-rose-500/80 bg-rose-950/80" };
  }
  if (viceLevel >= 45) {
    return { label: "TIPSY", toneClass: "text-fuchsia-200 border-fuchsia-500/80 bg-fuchsia-950/80" };
  }
  if (viceLevel >= 20) {
    return { label: "BUZZED", toneClass: "text-amber-200 border-amber-500/80 bg-amber-950/80" };
  }
  return { label: "SOBER", toneClass: "text-emerald-200 border-emerald-500/70 bg-emerald-950/70" };
}

export function isBedroomKeyUnlocked(meters: AshVelvetHeroineMeters): boolean {
  return meters.trust >= 50 || (meters.affection >= 45 && meters.lust >= 40);
}

export function createInitialAshVelvetState(
  startingNodeId?: string,
  startingCash: number = 65
): AshVelvetHouseState {
  let timeSlot: AshVelvetTimeSlot = "AFTER_MIDNIGHT";
  let clockLabel = "2:14 AM";
  let initialVice = 0;
  if (startingNodeId === "av_hallway_morning") {
    timeSlot = "MORNING";
    clockLabel = "7:40 AM";
  } else if (startingNodeId === "av_velvet_static_night") {
    timeSlot = "LATE_NIGHT";
    clockLabel = "11:50 PM";
    initialVice = 30;
  } else if (startingNodeId === "av_bourbon_lounge_chloe") {
    timeSlot = "LATE_NIGHT";
    clockLabel = "11:30 PM";
    initialVice = 25;
  } else if (startingNodeId === "av_parlor_sisters_late") {
    timeSlot = "AFTER_MIDNIGHT";
    clockLabel = "1:15 AM";
    initialVice = 15;
  } else if (startingNodeId === "av_tina_stairwell_crash") {
    timeSlot = "AFTERNOON";
    clockLabel = "3:20 PM";
    initialVice = 0;
  }

  return {
    day: 1,
    timeSlot,
    clockLabel,
    composure: 85,
    viceLevel: initialVice,
    cashUsd: startingCash,
    rentDueDay: 7,
    rentAmountUsd: 450,
    heroineLocations: { ...HEROINE_SCHEDULE_BY_SLOT[timeSlot] },
  };
}

export function advanceAshVelvetClock(state: AshVelvetHouseState): AshVelvetHouseState {
  const idx = ASH_VELVET_TIME_SLOTS.indexOf(state.timeSlot);
  const nextIdx = (idx + 1) % ASH_VELVET_TIME_SLOTS.length;
  const wrappedDay = nextIdx === 0 ? state.day + 1 : state.day;
  const nextSlot = ASH_VELVET_TIME_SLOTS[nextIdx];
  const viceDecay = nextSlot === "MORNING" ? 45 : 10;

  return {
    ...state,
    day: wrappedDay,
    timeSlot: nextSlot,
    clockLabel: TIME_SLOT_CLOCK_LABELS[nextSlot],
    viceLevel: clampMeter(state.viceLevel - viceDecay),
    heroineLocations: { ...HEROINE_SCHEDULE_BY_SLOT[nextSlot] },
  };
}

function parseClockLabelToMinutes(label: string, fallbackSlot: AshVelvetTimeSlot): number {
  const match = (label || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    const def = TIME_SLOT_CLOCK_LABELS[fallbackSlot] || "2:40 PM";
    return parseClockLabelToMinutes(def, "AFTERNOON");
  }
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function formatMinutesToClockLabel(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${paddedMins} ${period}`;
}

function resolveTimeSlotFromMinutes(totalMinutes: number): AshVelvetTimeSlot {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  // 1:00 AM (60) to 5:59 AM (359) -> AFTER_MIDNIGHT
  if (normalized >= 60 && normalized < 360) return "AFTER_MIDNIGHT";
  // 6:00 AM (360) to 11:59 AM (719) -> MORNING
  if (normalized >= 360 && normalized < 720) return "MORNING";
  // 12:00 PM (720) to 5:59 PM (1079) -> AFTERNOON
  if (normalized >= 720 && normalized < 1080) return "AFTERNOON";
  // 6:00 PM (1080) to 10:29 PM (1349) -> EVENING
  if (normalized >= 1080 && normalized < 1350) return "EVENING";
  // 10:30 PM (1350) to 12:59 AM (59) -> LATE_NIGHT
  return "LATE_NIGHT";
}

export function isOffSiteRedbridgeLocation(loc: string): boolean {
  const lower = (loc || "").toLowerCase();
  return (
    lower.includes("diner") ||
    lower.includes("starlight") ||
    lower.includes("velvet static") ||
    lower.includes("dive") ||
    lower.includes("bourbon") ||
    lower.includes("lounge")
  );
}

/**
 * Advances the Ash & Velvet clock at a realistic conversational pace:
 * - Routine dialogue turn in the same room: +4 minutes
 * - Walking to another room inside 412 Maplewood Ave: +6 minutes
 * - Traveling to/from an off-site Redbridge venue (Diner, Dive Bar, Lounge): +18 minutes
 * - Explicit multi-hour time jump (sleeping, working a shift, waiting until evening/morning): advances to next Time Slot.
 */
export function tickAshVelvetClock(
  state: AshVelvetHouseState,
  options?: {
    explicitTimeJump?: boolean;
    movedOffSite?: boolean;
    movedRoomInHouse?: boolean;
  }
): AshVelvetHouseState {
  if (options?.explicitTimeJump) {
    return advanceAshVelvetClock(state);
  }

  const deltaMinutes = options?.movedOffSite
    ? 18
    : options?.movedRoomInHouse
    ? 6
    : 4;

  const prevMinutes = parseClockLabelToMinutes(state.clockLabel, state.timeSlot);
  const rawNextMinutes = prevMinutes + deltaMinutes;
  const nextMinutes = rawNextMinutes % 1440;
  const nextClockLabel = formatMinutesToClockLabel(nextMinutes);
  const nextSlot = resolveTimeSlotFromMinutes(nextMinutes);
  const slotChanged = nextSlot !== state.timeSlot;
  // Day increments when crossing 6:00 AM into MORNING from AFTER_MIDNIGHT/LATE_NIGHT
  const crossedMorningBoundary = prevMinutes < 360 && rawNextMinutes >= 360;
  const nextDay = crossedMorningBoundary ? state.day + 1 : state.day;
  const viceDecay = slotChanged ? (nextSlot === "MORNING" ? 45 : 8) : 1;

  return {
    ...state,
    day: nextDay,
    timeSlot: nextSlot,
    clockLabel: nextClockLabel,
    viceLevel: clampMeter(state.viceLevel - viceDecay),
    heroineLocations: slotChanged
      ? { ...HEROINE_SCHEDULE_BY_SLOT[nextSlot] }
      : { ...state.heroineLocations },
  };
}

export function inferNaturalWardrobeKey(
  heroineName: string,
  location: string,
  timeSlot: AshVelvetTimeSlot
): string {
  const n = (heroineName || "").toLowerCase();
  const l = (location || "").toLowerCase();

  if (n.includes("clara")) {
    if (l.includes("kitchen")) return "kitchen";
    if (l.includes("den") || l.includes("101") || timeSlot === "AFTER_MIDNIGHT") return "nightwear";
    if (l.includes("lounge") || l.includes("dive")) return "date";
    if (l.includes("patio")) return "lounge";
    return "base";
  }
  if (n.includes("hannah")) {
    if (l.includes("202") && (timeSlot === "MORNING" || timeSlot === "AFTERNOON")) return "overalls";
    if (l.includes("dive") || l.includes("velvet static")) return "nightout";
    if (timeSlot === "AFTER_MIDNIGHT") return "nightwear";
    if (l.includes("patio") || l.includes("attic")) return "lounge";
    return "base";
  }
  if (n.includes("brianna")) {
    if (l.includes("hallway") || l.includes("bathroom")) return "base";
    if (l.includes("dive") || l.includes("lounge")) return "party";
    if (timeSlot === "AFTER_MIDNIGHT" || (l.includes("203") && timeSlot === "LATE_NIGHT")) return "nightwear";
    if (l.includes("patio") || l.includes("attic")) return "lounge";
    return "casual";
  }
  if (n.includes("sierra")) {
    if (l.includes("diner")) return "diner";
    if (l.includes("204") && (timeSlot === "LATE_NIGHT" || timeSlot === "AFTER_MIDNIGHT")) return "nightwear";
    if (l.includes("patio") || l.includes("kitchen")) return "lounge";
    return "base";
  }
  if (n.includes("chloe")) {
    if (l.includes("lounge") || l.includes("dive")) return "afterhours";
    if (timeSlot === "MORNING" || timeSlot === "AFTERNOON") return "office";
    if (timeSlot === "AFTER_MIDNIGHT" || (l.includes("205") && timeSlot === "LATE_NIGHT")) return "nightwear";
    if (l.includes("den") || l.includes("patio")) return "lounge";
    return "base";
  }
  if (n.includes("jill")) {
    if (l.includes("lounge") || l.includes("dive")) return "date";
    if (timeSlot === "AFTER_MIDNIGHT") return "nightwear";
    if (l.includes("den") && timeSlot === "LATE_NIGHT") return "lounge";
    if (l.includes("patio") || l.includes("hallway")) return "casual";
    return "base";
  }
  return "base";
}

export const ASH_VELVET_CANON_OUTFIT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  "Clara Callahan": {
    base: "a fitted cream ribbed V-neck knit sweater with an emerald gold pendant resting in her cleavage and high-waisted tan trousers",
    kitchen: "a warm knit cardigan over a fitted top with a kitchen apron tied around her waist",
    lounge: "a slouchy off-shoulder sweater and fitted denim shorts showing her curves",
    date: "a sultry emerald-green velvet wrap dress with a deep neckline",
    nightwear: "a rose-pink satin camisole slip and loosely tied silk kimono robe",
    lingerie: "black floral lace lingerie with sheer thigh-high stockings",
  },
  "Brianna Chen": {
    base: "nothing but a dangerously short damp white bath towel wrapped tight around her wet curves and gold hoop earrings",
    casual: "a fitted lilac halter top and tight white denim shorts",
    party: "a skin-tight crimson keyhole mini-dress",
    lounge: "an oversized borrowed navy hoodie and bare legs",
    nightwear: "a peacock-teal satin camisole and lace trim tap shorts",
    lingerie: "a black lace bra, garter belt, and sheer stockings",
  },
  "Hannah Lindqvist": {
    base: "a slouchy off-shoulder black ribbed knit sweater, pearl choker, silver headphones around her neck, and a crimson plaid pleated mini-skirt with a belt chain",
    overalls: "paint-flecked denim studio overalls worn loose over a cropped tank top",
    nightout: "an unbuttoned flannel shirt over a tight black bandeau top and short skirt",
    lounge: "an oversized vintage graphic tee and sleep shorts",
    nightwear: "a slate-blue satin slip cami and soft knit cardigan",
    lingerie: "black scalloped lace lingerie",
  },
  "Sierra Holloway": {
    base: "a tight yellow short-sleeve ribbed crop top showing her soft midriff, high-waisted blue denim cutoff shorts with a brown leather belt, and silver wrist cuffs",
    diner: "a retro mint-green Starlight Diner waitress dress with a white waist apron",
    swim: "an emerald-green string bikini and sheer sarong wrap",
    lounge: "a cozy olive cardigan over a fitted tank and soft lounge shorts",
    nightwear: "a honey-apricot buttoned henley sleep top and matching shorts",
    lingerie: "emerald-green rose-lace lingerie",
  },
  "Chloe Bellamy": {
    base: "a form-fitting off-shoulder pale lavender-white vertical-striped knit top, pearl pendant necklace, pearl earrings, and high-waisted dark navy tailored trousers",
    office: "a tailored lavender satin office blouse and form-hugging charcoal pencil skirt",
    afterhours: "a sultry deep-burgundy satin slip dress",
    lounge: "a soft cashmere wrap top and tailored espresso lounge trousers",
    nightwear: "a midnight-plum satin camisole and lace shorts",
    lingerie: "a sapphire satin and black lace lingerie set",
  },
  "Jill Smith": {
    base: "a yellow cable-knit sweater vest over a crisp white rolled-sleeve collared shirt with a red plaid bow tie and a short red plaid pleated mini-skirt",
    casual: "a fitted pink zip hoodie and short denim skirt",
    date: "a lilac off-shoulder skater dress",
    lounge: "an oversized blue college tee and soft sleep shorts",
    nightwear: "an ivory satin camisole and matching lace-trimmed sleep shorts",
    swim: "a coral bikini and sheer beach wrap",
    lingerie: "black floral-lace lingerie",
  },
  "Tina Smith": {
    base: "a partially unbuttoned white short-sleeve button-down shirt slipping off one shoulder to reveal her collarbone and cleavage, a dangerously short navy-blue pleated mini-skirt, and sheer black lace-top thigh-high stockings",
    nsfw_1: "her white button-down shirt pulled open and short navy-blue skirt hiked up with black lace-top thigh-high stockings",
    nsfw_2: "only her sheer black lace-top thigh-high stockings and undone shirt",
  },
};

export function describeHeroineVisibleOutfit(heroineName: string, wardrobeKey: string = "base"): string {
  const byHeroine = ASH_VELVET_CANON_OUTFIT_DESCRIPTIONS[heroineName];
  if (!byHeroine) return "her signature everyday outfit";
  return byHeroine[wardrobeKey] || byHeroine.base || "her signature everyday outfit";
}

export type AshVelvetChoiceIntent = "HEART" | "FLAME" | "DOM" | "BOLD" | "COOL";

export function classifyChoiceIntent(choiceText: string): {
  intent: AshVelvetChoiceIntent;
  cleanLabel: string;
} {
  const raw = (choiceText || "").trim();
  const tagMatch = raw.match(/^\[([^\]]+)\]\s*:?\s*/);
  const tagLower = (tagMatch ? tagMatch[1] : "").toLowerCase();
  const fullLower = raw.toLowerCase();

  let intent: AshVelvetChoiceIntent = "COOL";
  if (
    tagLower.includes("flame") ||
    tagLower.includes("lust") ||
    tagLower.includes("flirt") ||
    tagLower.includes("tease") ||
    tagLower.includes("seduc") ||
    fullLower.includes("kiss") ||
    fullLower.includes("trace") ||
    fullLower.includes("closer") ||
    fullLower.includes("towel") ||
    fullLower.includes("lips") ||
    fullLower.includes("tease right back") ||
    fullLower.includes("flush")
  ) {
    intent = "FLAME";
  } else if (
    tagLower.includes("dom") ||
    tagLower.includes("command") ||
    tagLower.includes("assert") ||
    tagLower.includes("firm") ||
    fullLower.includes("command") ||
    fullLower.includes("order her") ||
    fullLower.includes("chin") ||
    fullLower.includes("hold her gaze") ||
    fullLower.includes("shut it completely off") ||
    fullLower.includes("pin")
  ) {
    intent = "DOM";
  } else if (
    tagLower.includes("heart") ||
    tagLower.includes("warm") ||
    tagLower.includes("tender") ||
    tagLower.includes("honest") ||
    tagLower.includes("trust") ||
    tagLower.includes("care") ||
    fullLower.includes("thank") ||
    fullLower.includes("comfort") ||
    fullLower.includes("protect") ||
    fullLower.includes("listen") ||
    fullLower.includes("water") ||
    fullLower.includes("guard drop")
  ) {
    intent = "HEART";
  } else if (
    tagLower.includes("bold") ||
    tagLower.includes("vice") ||
    tagLower.includes("dare") ||
    tagLower.includes("grit") ||
    tagLower.includes("rebel") ||
    fullLower.includes("drink") ||
    fullLower.includes("whiskey") ||
    fullLower.includes("bourbon") ||
    fullLower.includes("fight") ||
    fullLower.includes("match her") ||
    fullLower.includes("pay off") ||
    fullLower.includes("fixing whatever") ||
    fullLower.includes("rent") ||
    fullLower.includes("reckless")
  ) {
    intent = "BOLD";
  }

  return {
    intent,
    cleanLabel: raw,
  };
}

/**
 * Builds the comprehensive Ash & Velvet psychological, wardrobe, and shared-house prompt directive
 * injected into `/api/turn` so the AI responds naturally to Affection, Lust, Submission, Trust,
 * Jealousy, Vice, Composure, and all 14 playable rooms.
 */
export function buildAshVelvetPromptDirective(params: {
  houseState?: AshVelvetHouseState | null;
  presentCompanions: Array<{
    name: string;
    affection?: number;
    lust?: number;
    submission?: number;
    trust?: number;
    jealousy?: number;
    sensitivity?: number;
    activeWardrobe?: string;
  }>;
  location: string;
  playerPersonality?: string;
  playerConduit?: string;
  playerRole?: string;
  playerAction?: string;
}): string {
  const hs = params.houseState || createInitialAshVelvetState();
  const viceInfo = getViceLabel(hs.viceLevel);

  const heroineLines =
    params.presentCompanions.length > 0
      ? params.presentCompanions
          .map((c) => {
            const m = resolveHeroineMeters(c);
            const sens = m.sensitivity ?? 15;
            const dossier = ASH_VELVET_HEROINE_DOSSIERS[c.name];
            const secretUnlocked = isHeroineSecretUnlocked(c.name, m);
            const secretLine = secretUnlocked
              ? `UNLOCKED SECRET (Can confide): ${dossier?.secretBio}`
              : `SECRET LOCKED (Requires Trust ${dossier?.secretUnlockRequirement?.minTrust ?? 42}+; do NOT reveal her deepest secret yet—make him earn her emotional trust!)`;
            const evalResult = evaluateAshVelvetAdvanceAndBoundary({
              heroineName: c.name,
              meters: m,
              viceLevel: hs.viceLevel,
              playerPersonality: params.playerPersonality,
              playerConduit: params.playerConduit,
              playerRole: params.playerRole,
              actionText: params.playerAction || "",
              location: params.location,
            });
            const kinkSummaryLine = dossier?.kinks?.length
              ? `Kinks & Fetishes (${dossier.kinkDynamicSummary}): ${dossier.kinks.map((k) => `${k.name} [${k.intensity}]`).join("; ")}`
              : "";
            const outfitDesc = describeHeroineVisibleOutfit(c.name, c.activeWardrobe || "base");
            return `  * ${c.name} [Current Visible Outfit (${c.activeWardrobe || "base"}): Wearing ${outfitDesc} | Synergy: ${evalResult.compatibility.summaryLabel}]: Affection ${m.affection}/100 (${getAffectionBondTier(m.affection)}), Lust ${m.lust}/100 (${getLustStateLabel(m.lust)}), Body Sensitivity ${sens}/100 (${getSensitivityStageLabel(sens)}), Submission ${m.submission}/100 (${getSubmissionDynamicLabel(m.submission)}), Trust ${m.trust}/100, Jealousy ${m.jealousy}/100\n    - Gaze/Body Tell: ${dossier?.gazeReactionTell || "Flushes under your lingering gaze."}${kinkSummaryLine ? `\n    - ${kinkSummaryLine}` : ""}\n    - Emotional Guard & Secret Status: ${secretLine}${evalResult.narrativeOutcomeDirective ? `\n    - THIS TURN DIRECTIVE: ${evalResult.narrativeOutcomeDirective}` : ""}`;
          })
          .join("\n")
      : "  * Protagonist is currently alone in this room.";

  return `--- ASH & VELVET: 18+ SANDBOX CORRUPTION, DOUJIN SENSITIVITY & RELATIONSHIP GUARDRAILS DIRECTIVE ---
- SETTING & GROUNDED REALISM: Contemporary Western graphic-novel adult drama at 412 Maplewood Ave (Redbridge District). NO fantasy magic, NO swords, NO dungeon spells, NO LitRPG mana jargon. Tension flows from abusive-home recovery, shared-house friction, rent pressure ($${hs.cashUsd} cash on hand; $${hs.rentAmountUsd} rent due Day ${hs.rentDueDay}), alcohol/vice, volatile exes, jealousy, power dynamics, and doujin-style physical conditioning.
- LIVE HOUSE STATUS: Day ${hs.day} • ${ASH_VELVET_TIME_SLOT_DISPLAY[hs.timeSlot]} (${hs.clockLabel}) | Location: ${params.location} | Protagonist Composure: ${hs.composure}/100 | Vice/Intoxication: ${hs.viceLevel}/100 (${viceInfo.label}).
- PRESENT HEROINE PSYCHOLOGY, VISIBLE OUTFIT, SENSITIVITY, KINKS & BOUNDARY STATE (DESCRIBE HER EXACT CURRENT VISIBLE OUTFIT IN PROSE — NEVER INVENT CONTRADICTORY CLOTHING!):
${heroineLines}
- DUAL-TRACK PROGRESSION (DOUJIN BODY SENSITIVITY vs. PORT SOLARIS EMOTIONAL GUARDRAILS):
  * TRACK 1 — DOUJIN GAZE/TOUCH CONDITIONING & BODY SENSITIVITY (0–100): If the protagonist stares at her curves, checks her out, teases her shamelessly, or brushes against her within her receptive threshold, her body grows physically conditioned ("sensitive") to his gaze and touch. At Sensitivity 20–39% her skin tingles and flushes under his eyes; at 40–64% she craves his gaze, shows off more skin, and starts making bold moves on him; at 65%+ her body trembles and yields to his touch even when her pride tries to resist.
  * TRACK 2 — EARNED AFFECTION, TRUST & SECRETS: True emotional Affection and personal secrets are guarded just like Port Solaris. Do NOT dump her locked secretBio early—he must earn her Trust.
  * PERSONALITY SYNERGY, KINKS & PROACTIVE ADVANCES: When the protagonist's personality/vibe matches hers, or when he leans into her specific Kinks & Fetishes listed above, she responds with heightened arousal and may actively flirt, invade his personal space, or make a move on him first.
  * BOUNDARY OVERSTEP BACKFIRE: If "THIS TURN DIRECTIVE" above flags a 🚨 BOUNDARY OVERSTEP BACKFIRE, you MUST write her rejecting/slapping away his premature advance with sharp consequences—never reward unearned raw escalation!
- EXACT APPROVED WARDROBE KEYS PER HEROINE (ONLY output keys from this list in "state_updates.wardrobe_key"; ONLY use "nsfw_*" keys when Lust >= 50, Sensitivity >= 50, or in a private/intimate scene):
  * Clara Callahan (Age 41): "base" (fitted cream ribbed V-neck knit sweater & high-waisted tan trousers), "kitchen" (cardigan & apron), "lounge" (off-shoulder sweater & denim shorts), "date" (emerald velvet wrap dress), "nightwear" (rose satin & kimono), "lingerie" (black lace lingerie & stockings), "nsfw_1", "nsfw_2", "nsfw_3"
  * Hannah Lindqvist (Age 23): "base" (off-shoulder black ribbed sweater, pearl choker, silver headphones & crimson plaid pleated mini-skirt), "overalls" (paint-flecked studio overalls), "nightout" (dive-bar flannel & bandeau), "lounge" (crescent tee & sleep shorts), "nightwear" (slate-blue satin & cardigan), "lingerie" (black scalloped lace lingerie), "nsfw_1", "nsfw_2", "nsfw_3", "nsfw_4"
  * Brianna Chen (Age 24): "base" (short damp white bath towel & gold hoop earrings), "casual" (lilac halter & white shorts), "party" (crimson keyhole mini-dress), "lounge" (borrowed navy hoodie & shorts), "nightwear" (peacock-teal satin & lace), "lingerie" (black lace & garter set), "nsfw_1", "nsfw_2", "nsfw_3"
  * Sierra Holloway (Age 24): "base" (yellow ribbed crop tee, denim cutoff shorts & wrist cuffs), "diner" (retro mint diner dress & apron), "swim" (emerald bikini & sarong), "lounge" (olive cardigan & lounge shorts), "nightwear" (honey-apricot henley sleep set), "lingerie" (emerald rose-lace lingerie), "nsfw_1", "nsfw_2", "nsfw_3", "nsfw_4"
  * Chloe Bellamy (Age 28): "base" (off-shoulder striped knit top, pearl necklace & dark navy tailored trousers), "office" (lavender blouse & pencil skirt), "afterhours" (burgundy satin slip dress), "lounge" (cashmere wrap & espresso trousers), "nightwear" (midnight-plum satin & lace), "lingerie" (sapphire satin & black lace set), "nsfw_1", "nsfw_2", "nsfw_3", "nsfw_4"
  * Jill Smith (Age 21, older sister): "base" (yellow cable-knit sweater vest over white collared shirt, red plaid bow tie & red plaid pleated mini-skirt), "casual" (pink zip hoodie & denim skirt), "date" (lilac off-shoulder skater dress), "lounge" (oversized blue tee & sleep shorts), "nightwear" (ivory satin cami & sleep shorts), "swim" (coral bikini & sheer wrap), "lingerie" (black floral-lace lingerie), "nsfw_1", "nsfw_2"
  * Tina Smith (Age 18, bratty/spoiled younger sister): "base" (partially unbuttoned white short-sleeve button-down shirt slipping off one shoulder, short navy-blue skirt & sheer black lace-top thigh-high stockings), "nsfw_1", "nsfw_2"
- 15 CANON PLAYABLE LOCATIONS:
  "Clara's Kitchen & Living Room", "Upstairs Hallway & Shared Bath", "Upstairs Shared Bathroom", "Clara's Late-Night Den", "The Attic Sanctuary Room", "Velvet Static Dive Bar", "Backyard Porch & Smoke Patio", "Clara's Master Bedroom (Room 101)", "Hannah's Studio Bedroom (Room 202)", "Brianna's Bedroom (Room 203)", "Sierra's Bedroom (Room 204)", "Chloe's Executive Bedroom (Room 205)", "Tina's Bedroom (Room 206)", "Starlight Retro Diner", "After-Hours Bourbon Lounge".
- STRUCTURED PSYCHOLOGICAL DELTAS (MARGINAL BY DEFAULT — MAJOR GAINS ONLY ON BREAKTHROUGHS):
  Keep stat changes marginal (+1 or +2, -1 or -2) on routine conversational or flirting turns; reserve +3 to +5 (or -4 to -8 on boundary backfire) ONLY for major emotional/intimate milestones:
  * "affection_delta": -2 to +2 on normal turns (+3 to +5 ONLY on major heart-to-heart breakthrough or memory unlock; -3 to -6 on betrayal/backfire)
  * "lust_delta": -1 to +2 on normal turns (+3 to +5 ONLY on heavy physical escalation or kink trigger)
  * "submission_delta": -2 to +2 on normal turns (positive when protagonist displays calm commanding confidence or triggers her submissive kink; +3 to +4 on major power-exchange climax)
  * "trust_delta": -2 to +2 on normal turns (+3 to +5 on major protective/honest breakthrough; -4 to -8 on boundary overstep)
  * "jealousy_delta": -1 to +2 on normal turns (+3 to +5 when flirting with a rival in front of her)
  * "vice_delta": -5 to +12 (positive when drinking/smoking/partying; negative when hydrating/resting)
  * "composure_delta": -8 to +8
  * "cash_delta": integer USD earned or spent (0 if none)
  * "advance_time_slot": boolean (true ONLY when a scene genuinely wraps up or transitions to a later part of day/night)
- SUGGESTED CHOICES FORMATTING: Give 4 distinct, grounded choices tagged with varied intent prefixes such as [Heart], [Flame], [Dom], [Bold], or [Cool] so each option offers a genuinely different emotional/power vector.`;
}
