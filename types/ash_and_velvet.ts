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
    highResonanceHeroines: ["Clara Callahan", "Sierra Holloway", "Hannah Lindqvist", "Jill Smith"],
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

export interface AshVelvetScheduleWindow {
  startMinute: number; // 0..1439 (minutes since 12:00 AM)
  endMinute: number;   // 1..1440
  timeRangeLabel: string; // e.g. "6:30 AM – 9:30 AM"
  location: string;    // Exact canonical 15-room name
  activity: string;    // What she is doing during this window
  wardrobeKey: string; // Natural outfit key for this window
}

export interface AshVelvetHeroineMeters {
  affection: number;    // 0-100 emotional warmth, romantic bond & loyalty
  lust: number;         // 0-100 physical heat, craving & late-night tension
  submission: number;   // 0-100 power gradient (0=Guarded/Dominant -> 100=Devotedly Submissive)
  trust: number;        // 0-100 psychological safety & bedroom key unlock gate
  jealousy: number;     // 0-100 rival friction & hallway tension
  sensitivity?: number; // 0-100 doujin-style physical conditioning to protagonist's gaze, teasing & touch
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
  sensitivityDelta?: number;
  boundaryBackfired?: boolean;
  viceDelta: number;
  composureDelta: number;
  cashDelta: number;
  timestamp: number;
}

export interface AshVelvetHeroineKink {
  name: string;
  intensity: "Core Fetish" | "Secret Craving" | "Conditioned Trigger";
  description: string;
  triggerKeywords: string[];
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
  preferredPersonalities: string[];
  preferredApproaches: AshVelvetApproach[];
  gazeReactionTell: string;
  kinks: AshVelvetHeroineKink[];
  kinkDynamicSummary: string;
  secretUnlockRequirement: { minTrust: number; minAffection: number };
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
    startingMeters: { affection: 18, lust: 14, submission: 10, trust: 26, jealousy: 5, sensitivity: 12 },
    secretBio:
      "Keeps a stack of overdue mortgage notices hidden inside her den desk—she refuses to let anyone see her cry until someone finally takes care of her instead of leaning on her.",
    preferredPersonalities: ["Stoic Pragmatist", "Gentle Protector", "Chivalrous Guardian", "Quiet Protector"],
    preferredApproaches: ["STEADY_GRIT", "SMOOTH_CHARM"],
    gazeReactionTell:
      "Her freckled chest flushes warm beneath her collar as she pretends to adjust her cardigan—only to leave the neckline a fraction looser where your eyes were resting.",
    kinkDynamicSummary: "Service Top Turned Pampered Submissive • Praise, Collarbone Worship & Breaking Her own House Rules",
    kinks: [
      {
        name: "Overwhelmed Caretaker Surrender",
        intensity: "Core Fetish",
        description:
          "Being firmly told to sit down, stop playing the responsible landlady, and let a younger, commanding man take complete control of her body.",
        triggerKeywords: ["sit down", "take care of you", "my turn", "stop working", "relax", "let me"],
      },
      {
        name: "Praise & Worship",
        intensity: "Secret Craving",
        description:
          "Hearing raw, reverent praise about her mature curves, freckled skin, and how desirable she is while her hands are held still.",
        triggerKeywords: ["gorgeous", "beautiful", "perfect", "good girl", "admire", "worship"],
      },
      {
        name: "Forbidden House-Rule Taboo",
        intensity: "Conditioned Trigger",
        description:
          "Being taken against the kitchen counter or inside her private den late at night where any tenant could almost walk past.",
        triggerKeywords: ["house rule", "counter", "quiet", "someone might hear", "den", "landlady"],
      },
    ],
    secretUnlockRequirement: { minTrust: 45, minAffection: 40 },
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
    startingMeters: { affection: 12, lust: 28, submission: 30, trust: 15, jealousy: 10, sensitivity: 20 },
    secretBio:
      "Never stopped painting—her easel is packed with raw charcoal portraits she hides under drop cloths whenever anyone knocks, terrified of being abandoned again if she lets someone close.",
    preferredPersonalities: ["Audacious Rebel", "Cynical Rogue", "Charismatic Flirt", "Reckless Night-Owl"],
    preferredApproaches: ["RAW_EDGE", "SMOOTH_CHARM"],
    gazeReactionTell:
      "Her heavy-lidded icy-blue eyes lock onto yours with a slow shiver, her fingers unconsciously tugging her off-shoulder sweater lower as she leans into your gaze.",
    kinkDynamicSummary: "Sensory Intensity & Rough Possession • Breath Play, Choking, Biting & Claiming Marks",
    kinks: [
      {
        name: "Breath Play & Throat Grip (Choking)",
        intensity: "Core Fetish",
        description:
          "Having a warm, steady hand wrap firmly around her throat to tilt her chin up—quieting her racing thoughts until her eyelids flutter.",
        triggerKeywords: ["throat", "choke", "neck", "grip", "chin up", "breathe"],
      },
      {
        name: "Possessive Biting & Marking",
        intensity: "Secret Craving",
        description:
          "Rough kisses, teeth grazing her collarbone and neck, and leaving visible hickeys/bite marks that prove she belongs to someone who won't leave.",
        triggerKeywords: ["bite", "mark", "hickey", "claim", "mine", "collarbone"],
      },
      {
        name: "Nude Muse Exhibitionism",
        intensity: "Conditioned Trigger",
        description:
          "Posing bare or half-undressed under her studio lamps while you stare intensely at every inch of her body.",
        triggerKeywords: ["pose", "canvas", "paint", "watch me", "look at me", "strip"],
      },
    ],
    secretUnlockRequirement: { minTrust: 42, minAffection: 38 },
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
    startingMeters: { affection: 12, lust: 24, submission: 18, trust: 16, jealousy: 12, sensitivity: 18 },
    secretBio:
      "Acts fearless and shameless in the hallway, yet completely melts whenever someone calls her bluff with calm confidence and refuses to back down from her teasing.",
    preferredPersonalities: ["Charismatic Flirt", "Dominant Sovereign", "Audacious Rebel", "Smooth Talker"],
    preferredApproaches: ["SMOOTH_CHARM", "RAW_EDGE"],
    gazeReactionTell:
      "Her wicked smirk falters into a hot pink blush across her ears—her breath catching as she shifts her hips to make sure you keep staring instead of looking away.",
    kinkDynamicSummary: "Brat Taming & Public Shamelessness • Pinning, Spanking & Semi-Public Exhibitionism",
    kinks: [
      {
        name: "Brat Taming & Physical Pinning",
        intensity: "Core Fetish",
        description:
          "Provoking you with cocky teasing until you call her bluff, back her against the wall or mattress, and pin her wrists so she can't talk her way out.",
        triggerKeywords: ["call her bluff", "pin", "wall", "wrists", "shut up", "make me", "brat"],
      },
      {
        name: "Exhibitionism & Towel Drop Risks",
        intensity: "Secret Craving",
        description:
          "Showing off her curves in a thin towel or keyhole dress in shared hallways and getting touched where housemates could almost catch her.",
        triggerKeywords: ["towel", "hallway", "catch us", "peek", "stare", "show off"],
      },
      {
        name: "Over-the-Knee Spanking & Tease Denial",
        intensity: "Conditioned Trigger",
        description:
          "Having her smug attitude punished with a firm smack on her bare hips or being edged until she begs cleanly.",
        triggerKeywords: ["spank", "smack", "ass", "beg", "tease", "punish"],
      },
    ],
    secretUnlockRequirement: { minTrust: 40, minAffection: 38 },
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
    startingMeters: { affection: 16, lust: 18, submission: 42, trust: 24, jealousy: 4, sensitivity: 16 },
    secretBio:
      "Walked out of her own controlling household two years ago with a single suitcase—she still keeps her diner tips rolled in a tin under her mattress just in case she ever has to run again.",
    preferredPersonalities: ["Gentle Protector", "Stoic Pragmatist", "Chivalrous Guardian", "Quiet Protector"],
    preferredApproaches: ["STEADY_GRIT", "SMOOTH_CHARM"],
    gazeReactionTell:
      "Every freckle on her shoulders and soft cleavage seems to glow warmer under your eyes; she bites her lip and steps closer so your arm brushes against her plush curves.",
    kinkDynamicSummary: "Devoted Service & Plush Body Worship • Praise Kink, Oral Service & Protective Breeding Heat",
    kinks: [
      {
        name: "Plush Curve Worship & Massage",
        intensity: "Core Fetish",
        description:
          "Having strong hands knead, cup, and worship her soft, full curves after a long shift while whispering how good she feels.",
        triggerKeywords: ["massage", "rub", "curves", "soft", "hold", "waist", "hips"],
      },
      {
        name: "Devoted Service & Praise Kink",
        intensity: "Secret Craving",
        description:
          "Eagerly pleasing you on her knees or in bed while being stroked on the head and called a good girl.",
        triggerKeywords: ["good girl", "knees", "please you", "sweet", "praise", "stroke her hair"],
      },
      {
        name: "Deep Claiming & Breeding Intimacy",
        intensity: "Conditioned Trigger",
        description:
          "Being held tight in a protective embrace during deep, slow, possessive intimacy where she feels completely safe and claimed.",
        triggerKeywords: ["hold tight", "deep", "inside", "breed", "safe", "keep you"],
      },
    ],
    secretUnlockRequirement: { minTrust: 42, minAffection: 36 },
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
    startingMeters: { affection: 10, lust: 22, submission: 12, trust: 12, jealousy: 15, sensitivity: 14 },
    secretBio:
      "Spends twelve hours a day commanding boardrooms and intimidating senior partners—behind closed doors after midnight, she secretly aches for someone strong enough to make her stop being in charge.",
    preferredPersonalities: ["Dominant Sovereign", "Stoic Pragmatist", "Calculating Tactician", "Smooth Talker"],
    preferredApproaches: ["SMOOTH_CHARM", "STEADY_GRIT"],
    gazeReactionTell:
      "Her throat bobbles as she swallows hard under your unblinking stare—her thighs pressing together beneath her skirt while her cool executive posture trembles at the edges.",
    kinkDynamicSummary: "Executive Submissive • Silk Bondage, Blindfolds, Strict Orders & Total Power Exchange",
    kinks: [
      {
        name: "Bondage & Wrist Restraint",
        intensity: "Core Fetish",
        description:
          "Having her wrists bound with a silk tie, belt, or grip behind her back or above her head so she is physically stripped of executive control.",
        triggerKeywords: ["tie", "bind", "bondage", "wrists", "restraint", "belt", "silk", "cuff"],
      },
      {
        name: "Total Domination & Verbal Commands",
        intensity: "Core Fetish",
        description:
          "Being given calm, non-negotiable orders ('kneel', 'strip', 'don't move') by someone who refuses to be intimidated by her status.",
        triggerKeywords: ["kneel", "order", "command", "obey", "strip", "don't move", "on your knees"],
      },
      {
        name: "Blindfolding & Power-Surrender Degradation",
        intensity: "Secret Craving",
        description:
          "Having her eyes covered and her spotless office attire slowly undone while she is made to beg out loud for release.",
        triggerKeywords: ["blindfold", "close your eyes", "beg", "office", "skirt", "helpless"],
      },
    ],
    secretUnlockRequirement: { minTrust: 50, minAffection: 45 },
  },
  "Jill Smith": {
    actOneConflict:
      "Sweet, preppy 21-year-old college transfer crashing in Clara's downstairs parlor while hiding how overwhelmed she is by strict family expectations, her bratty 18-year-old younger sister Tina, and late-night loneliness.",
    dyadPassiveName: "Fresh Spark",
    dyadPassiveDescription:
      "Boosts early Affection gains and warms awkward late-night conversations around the house.",
    bedroomLocation: "Clara's Late-Night Den",
    roomLabel: "Parlor",
    accentHex: "#F472B6",
    startingMeters: { affection: 20, lust: 16, submission: 38, trust: 22, jealousy: 6, sensitivity: 16 },
    secretBio:
      "Keeps her preppy yellow sweater vest and textbook stack spotless to look like an ideal 21-year-old honor student, yet secretly craves someone patient enough to let her drop the polite act after dark.",
    preferredPersonalities: ["Gentle Protector", "Charismatic Flirt", "Dominant Sovereign", "Quiet Protector"],
    preferredApproaches: ["STEADY_GRIT", "SMOOTH_CHARM"],
    gazeReactionTell:
      "A rosy blush spreads from her cheeks down to her collarbone; she fidgets with the hem of her red plaid pleated mini-skirt, secretly thrilled that your eyes keep drifting down her bare thighs.",
    kinkDynamicSummary: "Good-Girl Corruption • Skirt Lifting, Gentle Domination, Guided Hands & Quiet Moans",
    kinks: [
      {
        name: "Good-Girl Corruption & Praise",
        intensity: "Core Fetish",
        description:
          "Being praised as a 'good girl' while you slowly coax her into doing naughty, shameless things she'd never admit to her strict parents.",
        triggerKeywords: ["good girl", "honor student", "naughty", "teach", "guide", "innocent"],
      },
      {
        name: "Uniform / Pleated Skirt Play",
        intensity: "Secret Craving",
        description:
          "Having her preppy red plaid pleated skirt hiked up around her waist while she stays dressed in her neat yellow sweater vest.",
        triggerKeywords: ["skirt", "pleated", "thighs", "lift", "sweater", "uniform"],
      },
      {
        name: "Muffled Moans & Hand-Over-Mouth",
        intensity: "Conditioned Trigger",
        description:
          "Having your fingers gently cover her lips or slip into her mouth to keep her quiet on the parlor sofa while Tina or Clara is nearby.",
        triggerKeywords: ["quiet", "cover her mouth", "shh", "parlor", "fingers", "sofa"],
      },
    ],
    secretUnlockRequirement: { minTrust: 38, minAffection: 35 },
  },
  "Tina Smith": {
    actOneConflict:
      "Jill Smith's bratty, spoiled, and mischievous 18-year-old younger sister crashing in Room 206, testing everyone with mouthy attitude until someone with a firm hand puts her in her place.",
    dyadPassiveName: "Double Trouble",
    dyadPassiveDescription:
      "Accelerates brat-taming Submission and shared-secret Lust/Trust gains when you stand firm against her teasing.",
    bedroomLocation: "Tina's Bedroom (Room 206)",
    roomLabel: "Room 206",
    accentHex: "#FB7185",
    startingMeters: { affection: 16, lust: 18, submission: 34, trust: 20, jealousy: 8, sensitivity: 18 },
    secretBio:
      "Acts like a spoiled, untouchable 18-year-old brat who can talk circles around her 21-year-old sister Jill—yet the second a strong, dominant man grabs her, calls her bluff, and puts her firmly in her place, she melts into an obedient, needy mess.",
    preferredPersonalities: ["Dominant Sovereign", "Audacious Rebel", "Charismatic Flirt", "Reckless Night-Owl"],
    preferredApproaches: ["RAW_EDGE", "SMOOTH_CHARM", "STEADY_GRIT"],
    gazeReactionTell:
      "She catches you staring at her unbuttoned white shirt and short navy-blue skirt, arching her back with a bratty, smug grin while rubbing her lace-stockinged foot against your leg to see if you're man enough to grab her.",
    kinkDynamicSummary: "Spoiled Brat Correction & Footplay • Firm Discipline, Stocking Footplay, Sister Rivalry & Rough Manhandling",
    kinks: [
      {
        name: "Spoiled Brat Discipline & Being Put in Her Place",
        intensity: "Core Fetish",
        description:
          "Running her mouth until you pin her down, grip her chin or wrists with a firm hand, and make her obey and stay in her place.",
        triggerKeywords: ["brat", "place", "firm", "behave", "shut up", "obey", "spoiled", "lesson", "discipline"],
      },
      {
        name: "Footplay & Stocking/Barefoot Teasing",
        intensity: "Core Fetish",
        description:
          "Teasing you with her feet in lace-top thigh-high stockings or bare toes, and having her arches, ankles, and soles firmly gripped, massaged, or worshipped while she squirms.",
        triggerKeywords: ["foot", "feet", "toes", "barefoot", "sole", "arch", "ankle", "footplay", "stocking", "step on"],
      },
      {
        name: "Risk of Getting Caught & Sister Rivalry",
        intensity: "Secret Craving",
        description:
          "Sneaking touches, kisses, or quiet quickies when her 21-year-old older sister Jill is just in the next room—thrilled that you chose her.",
        triggerKeywords: ["jill", "sister", "secret", "catch us", "sneak", "next room", "dare"],
      },
      {
        name: "Hair-Pulling & Rough Manhandling",
        intensity: "Conditioned Trigger",
        description:
          "Having her hair tugged back, her hips spanked, or being lifted effortlessly onto the counter or bed when her bratty teasing goes too far.",
        triggerKeywords: ["hair", "pull", "grab", "lift", "rough", "pin", "spank"],
      },
    ],
    secretUnlockRequirement: { minTrust: 50, minAffection: 50 },
  },
};
