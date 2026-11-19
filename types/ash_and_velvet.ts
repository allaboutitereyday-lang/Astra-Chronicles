export type AshVelvetCircle =
  | "CALLAHAN_HOUSE"
  | "NIGHTLIFE_UNDERBELLY"
  | "DOWNTOWN_HUSTLE";

export type AshVelvetApproach = "STEADY_GRIT" | "SMOOTH_CHARM" | "RAW_EDGE";

export type AshVelvetOrigin =
  | "RUNAWAY_SURVIVOR"
  | "NIGHT_SHIFT_ESCAPEE"
  | "DISOWNED_REBEL";

export interface AshVelvetOriginPreset {
  id: AshVelvetOrigin;
  name: string;
  shortLabel: string;
  icon: string;
  startingRank: number;
  rankTierLabel: string;
  semesterDebtQuota: number;
  startingCrowns: number;
  defaultDetails: string;
  actOneStakes: string;
  highResonanceHeroines: string[];
}

export const ASH_VELVET_ORIGIN_PRESETS: AshVelvetOriginPreset[] = [
  {
    id: "RUNAWAY_SURVIVOR",
    name: "Rain-Soaked Runaway (Fled Abusive Home)",
    shortLabel: "Rain-Soaked Runaway",
    icon: "🌧️",
    startingRank: 1,
    rankTierLabel: "Attic Room Tenant (Probation)",
    semesterDebtQuota: 450,
    startingCrowns: 65,
    defaultDetails:
      "You walked out of your family's house at 2 AM with a bruised jaw, a single duffel bag, and sixty-five dollars in crumpled bills—refusing to take one more night of yelling and broken glass. Clara Callahan answered the porch bell in a silk robe, handed you a warm mug without asking for an apology, and gave you the attic room above her chaotic shared house.",
    actOneStakes:
      "Clara sets strict house rules to keep you safe even as late-night loneliness blurs her boundaries; Brianna corners you in the upstairs bathroom hallway; and Hannah invites you out to a smoky neon dive bar where alcohol and bad decisions wait.",
    highResonanceHeroines: ["Clara Callahan", "Sierra Holloway", "Hannah Lindqvist"],
  },
  {
    id: "NIGHT_SHIFT_ESCAPEE",
    name: "Night-Shift Escapee (Broke Diner & Bar Hand)",
    shortLabel: "Night-Shift Escapee",
    icon: "🥃",
    startingRank: 1,
    rankTierLabel: "Attic Room Tenant (Working Shift)",
    semesterDebtQuota: 450,
    startingCrowns: 110,
    defaultDetails:
      "After cutting ties with a controlling, volatile household, you bounced between graveyard shifts washing dishes and hauling liquor crates until Clara offered you a cheap room in her boarding house. You know how to keep your head down around drunk brawlers—and how to hold a conversation when the city goes quiet past midnight.",
    actOneStakes:
      "Sierra shares your late-night diner exhaustion and starts sneaking onto the backyard smoke deck with you; Chloe drops her icy paralegal armor after two glasses of bourbon; and your old family starts texting threats that test how far you'll go to protect your new home.",
    highResonanceHeroines: ["Sierra Holloway", "Chloe Bellamy", "Clara Callahan"],
  },
  {
    id: "DISOWNED_REBEL",
    name: "Cut-Off Rebel (Burned Bridges, Hungry for Freedom)",
    shortLabel: "Cut-Off Rebel",
    icon: "🔥",
    startingRank: 1,
    rankTierLabel: "Attic Room Tenant (Unfiltered)",
    semesterDebtQuota: 500,
    startingCrowns: 85,
    defaultDetails:
      "You finally fought back against an abusive stepfather, packed whatever fit in your jacket, and burned every bridge behind you. Living under Clara Callahan's roof is your first real taste of freedom—and the messy, intoxicating world of shared-house tension, cheap whiskey, late-night parties, and women who don't pull punches.",
    actOneStakes:
      "Brianna immediately tests your temper with razor-sharp hallway teasing; Hannah drags you into after-hours warehouse parties and reckless vices; and Chloe dares you to match her poise behind closed doors.",
    highResonanceHeroines: ["Brianna Chen", "Hannah Lindqvist", "Chloe Bellamy"],
  },
];

export interface AshVelvetConduitPreset {
  id: string;
  conduit: AshVelvetApproach;
  wing: AshVelvetCircle;
  wingLabel: string;
  roleTitle: string;
  shortLabel: string;
  icon: string;
  statSpread: { str: number; dex: number; int: number };
  description: string;
  startingAbilities: {
    name: string;
    description: string;
    type: "Active" | "Passive" | "Ultimate";
    cost: string;
    cooldown: string;
    tier: string;
  }[];
  canonLoadout: {
    weapon: string;
    armor: string;
    relic: string;
    relicSlot: string;
    setId: string;
    whisperFlaw: string;
  };
}

export const ASH_VELVET_CONDUIT_PRESETS: AshVelvetConduitPreset[] = [
  {
    id: "steady_protector",
    conduit: "STEADY_GRIT",
    wing: "CALLAHAN_HOUSE",
    wingLabel: "Callahan Shared House",
    roleTitle: "Quiet Protector & Handyman",
    shortLabel: "Quiet Protector",
    icon: "🛠️",
    statSpread: { str: 14, dex: 12, int: 13 },
    description:
      "Grounded, dependable, and fiercely loyal. You earn trust by fixing broken locks, stepping between drunks at the bar, and showing up when housemates fall apart at 3 AM.",
    startingAbilities: [
      {
        name: "Steady Presence",
        description:
          "Calm a heated argument or panic spiral with quiet composure, lowering tension while earning deep emotional trust.",
        type: "Active",
        cost: "15 Composure",
        cooldown: "1 Turn",
        tier: "Core",
      },
      {
        name: "Stand Your Ground",
        description:
          "Refuse to flinch when confronted by bullies, aggressive barflies, or toxic family pullbacks.",
        type: "Passive",
        cost: "Passive",
        cooldown: "None",
        tier: "Core",
      },
    ],
    canonLoadout: {
      weapon: "Worn Multi-Tool & Heavy Keyring",
      armor: "Faded Charcoal Flannel & Dark Jeans",
      relic: "Clara's Brass Attic Key",
      relicSlot: "POCKET_CHARM",
      setId: "callahan_sanctuary",
      whisperFlaw: "Hypervigilance — sudden slammed doors spike your adrenaline until trust settles in.",
    },
  },
  {
    id: "smooth_confidant",
    conduit: "SMOOTH_CHARM",
    wing: "DOWNTOWN_HUSTLE",
    wingLabel: "After-Hours Downtown",
    roleTitle: "Late-Night Bartender & Confidant",
    shortLabel: "Smooth Confidant",
    icon: "🍸",
    statSpread: { str: 10, dex: 14, int: 15 },
    description:
      "Perceptive, playful, and dangerously good at reading people between drinks. You disarm sharp-tongued roommates and unlock guarded confessions with effortless timing.",
    startingAbilities: [
      {
        name: "Read the Room",
        description:
          "Spot hidden vulnerability, jealousy, or unspoken desire in a housemate's body language before they say a word.",
        type: "Active",
        cost: "10 Composure",
        cooldown: "1 Turn",
        tier: "Core",
      },
      {
        name: "Midnight Pour",
        description:
          "Turn a tense kitchen or bar conversation into an intimate late-night heart-to-heart.",
        type: "Passive",
        cost: "Passive",
        cooldown: "None",
        tier: "Core",
      },
    ],
    canonLoadout: {
      weapon: "Silver Zippo & Bartender's Corkscrew",
      armor: "Rolled-Sleeve Black Henley & Leather Jacket",
      relic: "Cracked Vintage Watch",
      relicSlot: "TIMEPIECE",
      setId: "velvet_afterhours",
      whisperFlaw: "Deflection — uses humor and flirting to dodge talking about his own scars.",
    },
  },
  {
    id: "reckless_nightowl",
    conduit: "RAW_EDGE",
    wing: "NIGHTLIFE_UNDERBELLY",
    wingLabel: "Neon Dive Circuit",
    roleTitle: "Reckless Night-Owl & Street Hustler",
    shortLabel: "Reckless Night-Owl",
    icon: "⚡",
    statSpread: { str: 13, dex: 15, int: 11 },
    description:
      "Restless, bold, and drawn to the glow of dive bars, smoky patios, and forbidden lines. You live fast to outrun the past—pulling the housemates into wild nights and intense sparks.",
    startingAbilities: [
      {
        name: "No Hesitation",
        description:
          "Cut straight through polite small talk with bold honesty or daring physical closeness that catches rivals off guard.",
        type: "Active",
        cost: "15 Composure",
        cooldown: "1 Turn",
        tier: "Core",
      },
      {
        name: "Last Call Grit",
        description:
          "Keep your cool under alcohol, nightlife chaos, and back-alley pressure.",
        type: "Passive",
        cost: "Passive",
        cooldown: "None",
        tier: "Core",
      },
    ],
    canonLoadout: {
      weapon: "Taped Knuckles & Pocket Flask",
      armor: "Scuffed Denim Jacket & Graphic Tee",
      relic: "Neon Bar Stamp & Spare Lighter",
      relicSlot: "POCKET_CHARM",
      setId: "neon_vice",
      whisperFlaw: "Vice Temptation — leans on cheap whiskey and reckless thrills when old trauma resurfaces.",
    },
  },
];

export type AshVelvetTimeSlot =
  | "MORNING"
  | "AFTERNOON"
  | "EVENING"
  | "LATE_NIGHT"
  | "AFTER_MIDNIGHT";

export interface AshVelvetHeroineMeters {
  affection: number;  // 0-100 emotional warmth, romantic bond & loyalty
  lust: number;       // 0-100 physical heat, craving & late-night tension
  submission: number; // 0-100 power gradient (0=Guarded/Dominant -> 100=Devotedly Submissive)
  trust: number;      // 0-100 psychological safety & bedroom key unlock gate
  jealousy: number;   // 0-100 rival friction & hallway tension
}

export interface AshVelvetHouseState {
  day: number;
  timeSlot: AshVelvetTimeSlot;
  clockLabel: string; // e.g. "2:14 AM", "7:45 AM", "11:50 PM"
  composure: number;  // 0-100 protagonist psychological steadiness
  viceLevel: number;  // 0-100 intoxication / recklessness (Sober -> Buzzed -> Tipsy -> Reckless)
  cashUsd: number;
  rentDueDay: number;
  rentAmountUsd: number;
  heroineLocations: Record<string, string>; // Companion Name -> Current Room Name
}

export interface AshVelvetTurnDeltaSummary {
  companionName: string;
  affectionDelta: number;
  lustDelta: number;
  submissionDelta: number;
  trustDelta: number;
  jealousyDelta: number;
  viceDelta: number;
  composureDelta: number;
  cashDelta: number;
  timestamp: number;
}

export interface AshVelvetHeroineDossierMeta {
  actOneConflict: string;
  dyadPassiveName?: string;
  dyadPassiveDescription?: string;
  bedroomLocation: string;
  roomLabel: string;
  accentHex: string;
  startingMeters: AshVelvetHeroineMeters;
  secretBio: string;
}

export const ASH_VELVET_HEROINE_DOSSIERS: Record<string, AshVelvetHeroineDossierMeta> = {
  "Clara Callahan": {
    actOneConflict:
      "Balances fiercely protective motherly care with mounting mortgage pressure and quiet late-night loneliness after a bitter divorce.",
    dyadPassiveName: "Warm Harbor",
    dyadPassiveDescription:
      "Restores composure during domestic scenes and steadies trauma spikes when Clara is present.",
    bedroomLocation: "Clara's Master Bedroom (Room 101)",
    roomLabel: "Room 101",
    accentHex: "#F59E0B",
    startingMeters: { affection: 18, lust: 14, submission: 32, trust: 26, jealousy: 5 },
    secretBio:
      "Keeps a stack of overdue mortgage notices hidden inside her den desk—she refuses to let anyone see her cry until someone finally takes care of her instead of leaning on her.",
  },
  "Hannah Lindqvist": {
    actOneConflict:
      "Spiraling between dropped art-school ambitions, late-night dive-bar pills/drinks, and a toxic ex who keeps showing up at parties.",
    dyadPassiveName: "Velvet Static",
    dyadPassiveDescription:
      "Heightens raw emotional breakthroughs during nightlife scenes and quiet 3 AM confessions.",
    bedroomLocation: "Hannah's Studio Bedroom (Room 202)",
    roomLabel: "Room 202",
    accentHex: "#38BDF8",
    startingMeters: { affection: 12, lust: 28, submission: 30, trust: 15, jealousy: 10 },
    secretBio:
      "Never stopped painting—her easel is packed with raw charcoal portraits she hides under drop cloths whenever anyone knocks, terrified of being abandoned again if she lets someone close.",
  },
  "Brianna Chen": {
    actOneConflict:
      "Uses razor-sharp teasing, hallway towel run-ins, and fierce independence to hide fear of getting too close to anyone under the same roof.",
    dyadPassiveName: "Hallway Heat",
    dyadPassiveDescription:
      "Turns playful bickering and domestic friction into rapid chemistry and flirtatious momentum.",
    bedroomLocation: "Brianna's Bedroom (Room 203)",
    roomLabel: "Room 203",
    accentHex: "#EC4899",
    startingMeters: { affection: 12, lust: 24, submission: 18, trust: 16, jealousy: 12 },
    secretBio:
      "Acts fearless and shameless in the hallway, yet completely melts whenever someone calls her bluff with calm confidence and refuses to back down from her teasing.",
  },
  "Sierra Holloway": {
    actOneConflict:
      "Working exhausting double shifts at the retro diner to stay independent after fleeing her own rough family, hiding soft longing behind sunny warmth.",
    dyadPassiveName: "Safe Shoulder",
    dyadPassiveDescription:
      "Boosts mutual trust recovery and opens tender slow-burn intimacy faster when you look out for her.",
    bedroomLocation: "Sierra's Bedroom (Room 204)",
    roomLabel: "Room 204",
    accentHex: "#10B981",
    startingMeters: { affection: 16, lust: 18, submission: 42, trust: 24, jealousy: 4 },
    secretBio:
      "Walked out of her own controlling household two years ago with a single suitcase—she still keeps her diner tips rolled in a tin under her mattress just in case she ever has to run again.",
  },
  "Chloe Bellamy": {
    actOneConflict:
      "Polished paralegal enforcing spotless composure by day—only to crave unfiltered release, bourbon, and control-shedding heat after midnight.",
    dyadPassiveName: "After-Hours Clause",
    dyadPassiveDescription:
      "Unlocks high-tension midnight encounters and sharpens poise during tense confrontations.",
    bedroomLocation: "Chloe's Executive Bedroom (Room 205)",
    roomLabel: "Room 205",
    accentHex: "#A855F7",
    startingMeters: { affection: 10, lust: 22, submission: 12, trust: 12, jealousy: 15 },
    secretBio:
      "Spends twelve hours a day commanding boardrooms and intimidating senior partners—behind closed doors after midnight, she secretly aches for someone strong enough to make her stop being in charge.",
  },
};
