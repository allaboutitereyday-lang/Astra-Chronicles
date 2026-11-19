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
  },
  AFTERNOON: {
    "Clara Callahan": "Clara's Kitchen & Living Room",
    "Hannah Lindqvist": "Hannah's Studio Bedroom (Room 202)",
    "Brianna Chen": "Brianna's Bedroom (Room 203)",
    "Sierra Holloway": "Starlight Retro Diner",
    "Chloe Bellamy": "After-Hours Bourbon Lounge",
  },
  EVENING: {
    "Clara Callahan": "Clara's Kitchen & Living Room",
    "Hannah Lindqvist": "Velvet Static Dive Bar",
    "Brianna Chen": "Backyard Porch & Smoke Patio",
    "Sierra Holloway": "Starlight Retro Diner",
    "Chloe Bellamy": "After-Hours Bourbon Lounge",
  },
  LATE_NIGHT: {
    "Clara Callahan": "Clara's Late-Night Den",
    "Hannah Lindqvist": "Velvet Static Dive Bar",
    "Brianna Chen": "Brianna's Bedroom (Room 203)",
    "Sierra Holloway": "Backyard Porch & Smoke Patio",
    "Chloe Bellamy": "Chloe's Executive Bedroom (Room 205)",
  },
  AFTER_MIDNIGHT: {
    "Clara Callahan": "Clara's Late-Night Den",
    "Hannah Lindqvist": "Backyard Porch & Smoke Patio",
    "Brianna Chen": "Brianna's Bedroom (Room 203)",
    "Sierra Holloway": "Sierra's Bedroom (Room 204)",
    "Chloe Bellamy": "Chloe's Executive Bedroom (Room 205)",
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
  return { affection: 15, lust: 15, submission: 25, trust: 20, jealousy: 5 };
}

export function resolveHeroineMeters(comp: {
  name: string;
  affection?: number;
  lust?: number;
  submission?: number;
  trust?: number;
  jealousy?: number;
}): AshVelvetHeroineMeters {
  const base = getHeroineStartingMeters(comp.name);
  return {
    affection: clampMeter(typeof comp.affection === "number" ? comp.affection : base.affection),
    lust: clampMeter(typeof comp.lust === "number" ? comp.lust : base.lust),
    submission: clampMeter(typeof comp.submission === "number" ? comp.submission : base.submission),
    trust: clampMeter(typeof comp.trust === "number" ? comp.trust : base.trust),
    jealousy: clampMeter(typeof comp.jealousy === "number" ? comp.jealousy : base.jealousy),
  };
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
  if (startingNodeId === "av_hallway_morning") {
    timeSlot = "MORNING";
    clockLabel = "7:40 AM";
  } else if (startingNodeId === "av_velvet_static_night") {
    timeSlot = "LATE_NIGHT";
    clockLabel = "11:50 PM";
  }

  return {
    day: 1,
    timeSlot,
    clockLabel,
    composure: 85,
    viceLevel: startingNodeId === "av_velvet_static_night" ? 30 : 0,
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
  return "base";
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
    activeWardrobe?: string;
  }>;
  location: string;
}): string {
  const hs = params.houseState || createInitialAshVelvetState();
  const viceInfo = getViceLabel(hs.viceLevel);

  const heroineLines =
    params.presentCompanions.length > 0
      ? params.presentCompanions
          .map((c) => {
            const m = resolveHeroineMeters(c);
            return `  * ${c.name} [Outfit: ${c.activeWardrobe || "base"}]: Affection ${m.affection}/100 (${getAffectionBondTier(m.affection)}), Lust ${m.lust}/100 (${getLustStateLabel(m.lust)}), Submission ${m.submission}/100 (${getSubmissionDynamicLabel(m.submission)}), Trust ${m.trust}/100, Jealousy ${m.jealousy}/100`;
          })
          .join("\n")
      : "  * Protagonist is currently alone in this room.";

  return `--- ASH & VELVET: 18+ SHARED HOUSE VN & PSYCHOLOGICAL TRACKING DIRECTIVE ---
- SETTING & GROUNDED REALISM: Contemporary Western graphic-novel adult drama at 412 Maplewood Ave (Redbridge District). NO fantasy magic, NO swords, NO dungeon spells, NO LitRPG mana jargon. Tension flows from abusive-home recovery, shared-house friction, rent pressure ($${hs.cashUsd} cash on hand; $${hs.rentAmountUsd} rent due Day ${hs.rentDueDay}), alcohol/vice, volatile exes, jealousy, power dynamics, and intimate romance.
- LIVE HOUSE STATUS: Day ${hs.day} • ${ASH_VELVET_TIME_SLOT_DISPLAY[hs.timeSlot]} (${hs.clockLabel}) | Location: ${params.location} | Protagonist Composure: ${hs.composure}/100 | Vice/Intoxication: ${hs.viceLevel}/100 (${viceInfo.label}).
- PRESENT HEROINE PSYCHOLOGY (MUST SHAPE DIALOGUE, BODY LANGUAGE & POWER DYNAMIC):
${heroineLines}
- HOW METERS SHAPE BEHAVIOR:
  * AFFECTION: Governs emotional warmth, loyalty, and willingness to open up about scars/secrets.
  * LUST: Governs physical closeness, breathiness, flirtatious tension, and sensual escalation. High Lust with low Affection creates sharp, reckless, vice-charged heat; High Lust + High Affection unlocks tender passion.
  * SUBMISSION (0–100 Power Gradient): Low (0–25) = guarded, challenging, takes charge (especially Chloe & Brianna); Mid (26–55) = charged push-pull banter; High (56–100) = softening, yielding to protagonist's lead, craving his steady control.
  * TRUST: Distinct from Lust; honest follow-through raises Trust and unlocks private bedroom invitations (Rooms 101–205). Lies or reckless betrayal slash Trust.
  * JEALOUSY: Flirting openly near rivals (Clara ↔ Chloe, Brianna ↔ Chloe, Hannah ↔ Clara) spikes Jealousy and sparks sharp territorial banter.
- EXACT 5 APPROVED STYLE A WARDROBE KEYS PER HEROINE (ONLY output keys from this list in "state_updates.wardrobe_key"):
  * Clara Callahan: "base" (knit & trousers), "kitchen" (cardigan & apron), "lounge" (off-shoulder sweater & denim shorts), "date" (emerald velvet wrap dress), "nightwear" (rose satin & kimono)
  * Hannah Lindqvist: "base" (off-shoulder sweater & plaid skirt), "overalls" (paint-flecked studio overalls), "nightout" (dive-bar flannel & bandeau), "lounge" (crescent tee & sleep shorts), "nightwear" (slate-blue satin & cardigan)
  * Brianna Chen: "base" (hallway shower towel), "casual" (lilac halter & white shorts), "party" (crimson keyhole mini-dress), "lounge" (borrowed navy hoodie & shorts), "nightwear" (peacock-teal satin & lace)
  * Sierra Holloway: "base" (knotted crop tee & denim shorts), "diner" (retro mint diner dress & apron), "swim" (emerald bikini & sarong), "lounge" (olive cardigan & lounge shorts), "nightwear" (honey-apricot henley sleep set)
  * Chloe Bellamy: "base" (white button-down & charcoal shorts), "office" (lavender blouse & pencil skirt), "afterhours" (burgundy satin slip dress), "lounge" (cashmere wrap & espresso trousers), "nightwear" (midnight-plum satin & lace)
- 14 CANON PLAYABLE LOCATIONS:
  "Clara's Kitchen & Living Room", "Upstairs Hallway & Shared Bath", "Upstairs Shared Bathroom", "Clara's Late-Night Den", "The Attic Sanctuary Room", "Velvet Static Dive Bar", "Backyard Porch & Smoke Patio", "Clara's Master Bedroom (Room 101)", "Hannah's Studio Bedroom (Room 202)", "Brianna's Bedroom (Room 203)", "Sierra's Bedroom (Room 204)", "Chloe's Executive Bedroom (Room 205)", "Starlight Retro Diner", "After-Hours Bourbon Lounge".
- STRUCTURED PSYCHOLOGICAL DELTAS: Always populate realistic integer deltas inside "state_updates" for the active speaker/scene:
  * "affection_delta": -8 to +8
  * "lust_delta": -6 to +10
  * "submission_delta": -6 to +8 (positive when protagonist displays calm commanding confidence or heroine yields; negative if protagonist acts timid or heroine asserts dominance)
  * "trust_delta": -10 to +8
  * "jealousy_delta": -5 to +10
  * "vice_delta": -10 to +20 (positive when drinking/smoking/partying; negative when hydrating/resting)
  * "composure_delta": -12 to +12
  * "cash_delta": integer USD earned or spent (0 if none)
  * "advance_time_slot": boolean (true ONLY when a scene genuinely wraps up or transitions to a later part of day/night)
- SUGGESTED CHOICES FORMATTING: Give 4 distinct, grounded choices tagged with varied intent prefixes such as [Heart], [Flame], [Dom], [Bold], or [Cool] so each option offers a genuinely different emotional/power vector.`;
}
