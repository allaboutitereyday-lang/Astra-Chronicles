export type IslandFaction =
  | "PLATINUM_BOARD"
  | "BOARDWALK_GUILD"
  | "BREAKERS_UNION"
  | "DRIFTWOOD_SYNDICATE";

export type FlairConduit = "PHYSICAL_TEMPO" | "SOCIAL_PANACHE" | "HYBRID";

export type KeepsakeSlot =
  | "TIMEPIECE"
  | "ATTIRE"
  | "TOOL_OF_THE_TRADE"
  | "POCKET_CHARM"
  | "HOUSE_EMBLEM";

export type ShopRole =
  | "CHEF"
  | "MIXOLOGIST"
  | "FLOOR_HOST"
  | "BOUNCER"
  | "PROMOTER";

export type PortSolarisOrigin =
  | "CULINARY_DROPOUT"
  | "EX_DOJO_PRODIGY"
  | "SILVER_TONGUED_HUSTLER";

export interface KeepsakeItem {
  id: string;
  name: string;
  slot: KeepsakeSlot;
  giftedByHeroineId?: string; // Triggers jealousy check if worn on another heroine's date
  statModifiers: {
    maxComposure?: number;
    tempoPower?: number;
    panachePower?: number;
    shopRevenueBonus?: number;
    blushDamageBonus?: number;
  };
  jealousyQuirk?: {
    description: string;
    composurePenaltyOnOtherDates: number;
  };
}

export type BpmZone =
  | "COMPOSED"
  | "GUARDED_DEFLECTION"
  | "BLUSH_ZONE"
  | "FEVER_PITCH"
  | "SHORT_CIRCUIT";

export type ScandalTier = "LOW" | "BUZZING" | "TABLOID" | "WILDFIRE";

export type FactionTier = "NEUTRAL" | "RESPECTED" | "HONORED" | "EXALTED";

export type ShowdownContestType =
  | "CULINARY_CLASH"
  | "DOJO_EXHIBITION"
  | "VIP_DEBATE"
  | "BEACH_TOURNAMENT";

export type CoastalStanceType =
  | "FLOW_STATE_RHYTHM"
  | "SUN_DRENCHED_TEMPO"
  | "HIGH_HEAT_RUSH"
  | "UNFLAPPABLE_COOL"
  | "TEASING_COUNTER"
  | "VELVET_PROVOCATION"
  | "SHOWSTOPPER_FINALE";

export interface HeroineProfile {
  id: string;
  name: string;
  epithet: string;
  faction: IslandFaction;
  wing: IslandFaction;
  conduit: FlairConduit;
  preferredShopRole: ShopRole;
  intimacyRank: 0 | 1 | 2 | 3 | 4 | 5; // Rank 3 = Moves into Boarding House; Rank 5 = True Route
  affectionPoints: number;
  heartRateBpm: number; // 40 to 100 (40-68 = Composed, 69-82 = Guarded Deflection, 83-95 = Blush Zone, 96-100 = Short-Circuit)
  isBoardingHouseTenant: boolean;
  assignedRoomNumber?: number; // 1-6 or 201-206
  unlockedCoreMemories: string[];
}

export interface ShowdownWager {
  id: string;
  opponentName: string;
  faction: IslandFaction;
  challengeType: ShowdownContestType;
  playerStakes: string;
  opponentStakes: string; // e.g., "+1 Star Rating & 1-Week Maid Shift Penalty"
  recommendedConduit: FlairConduit;
}

export interface BoardingHouseState {
  shopName: string;
  starRating: 0 | 1 | 2 | 3 | 4 | 5;
  daysUntilAudit: number;
  dailyRevenue: number;
  outstandingDebt: number;
  scandalHeat: number; // 0 to 100 (Drives foot traffic + Jealousy Collision chance)
  activeTenants: string[]; // Heroine IDs living upstairs
  shopAssignments?: Partial<Record<ShopRole, string>>;
  roomAssignments?: Partial<Record<number, string>>;
  totalRevenueCollected?: number;
  totalDebtPaid?: number;
}

export interface PlayerState {
  name: string;
  background: PortSolarisOrigin;
  primaryConduit: FlairConduit;
  composureGauge: number; // 0 to 100
  hypeResource: number; // 0 to 100 (Physical Tempo resource)
  coolResource: number; // 100 to 0 (Social Panache resource)
  solarCrowns: number;
  factionStanding: Record<IslandFaction, number>;
  equippedKeepsakes: Partial<Record<KeepsakeSlot, KeepsakeItem>>;
  boardingHouse: BoardingHouseState;
  activePartnerId: string | null;
}

export interface PortSolarisOriginPreset {
  id: PortSolarisOrigin;
  name: string;
  shortLabel: string;
  icon: string;
  startingStarRating: 0 | 1 | 2 | 3 | 4 | 5;
  starTierLabel: string;
  startingSolarCrowns: number;
  outstandingDebt: number;
  daysUntilAudit: number;
  // Unified UI compatibility aliases
  startingRank: number;
  rankTierLabel: string;
  semesterDebtQuota: number;
  startingCrowns: number;
  defaultDetails: string;
  actOneStakes: string;
  highResonanceHeroines: string[];
}

export const PORT_SOLARIS_ORIGIN_PRESETS: PortSolarisOriginPreset[] = [
  {
    id: "CULINARY_DROPOUT",
    name: "Culinary Dropout (Blacklisted 5-Star Sous-Chef)",
    shortLabel: "Culinary Dropout",
    icon: "🍳",
    startingStarRating: 0,
    starTierLabel: "0★ Probation (The Stray Anchor)",
    startingSolarCrowns: 120,
    outstandingDebt: 5000,
    daysUntilAudit: 30,
    startingRank: 0,
    rankTierLabel: "0★ Probation (The Stray Anchor)",
    semesterDebtQuota: 5000,
    startingCrowns: 120,
    defaultDetails:
      "Once a rising culinary prodigy at the Vane-Valorian Grand Resort, you were blacklisted after publicly humbling an executive chef over subpar ingredients. Now inheriting the deed and 5,000 Solar Crown debt to the dilapidated 0-Star beachfront café & boarding house 'The Stray Anchor', you have 30 days to earn your first Star—or watch the Platinum Board bulldoze your cove.",
    actOneStakes:
      "Seraphina Vane marches in on Day 1 with an eviction audit—only to get hooked on your midnight comfort cooking; childhood friend Mia Bellini barges in every morning to boss your kitchen around, while exiled mixologist Colette Moreau tests whether your palate deserves her cocktails.",
    highResonanceHeroines: ["Seraphina Vane", "Mia Bellini", "Colette Moreau", "Zuri Delacroix"],
  },
  {
    id: "EX_DOJO_PRODIGY",
    name: "Ex-Dojo Prodigy (Retired Undefeated Striker)",
    shortLabel: "Ex-Dojo Prodigy",
    icon: "🥋",
    startingStarRating: 0,
    starTierLabel: "0★ Probation (The Stray Anchor)",
    startingSolarCrowns: 90,
    outstandingDebt: 4500,
    daysUntilAudit: 30,
    startingRank: 0,
    rankTierLabel: "0★ Probation (The Stray Anchor)",
    semesterDebtQuota: 4500,
    startingCrowns: 90,
    defaultDetails:
      "You walked away from the national martial arts circuit at the peak of your undefeated streak to run your late uncle's beachfront tavern and six-room boarding house in quiet peace. Unfortunately, Port Solaris settles every commercial lease dispute, delivery-van parking feud, and romantic misunderstanding under Island Charter Article 9—via public Turf Showdowns.",
    actOneStakes:
      "Dojo Pier champion Kaede Tachibana moves into Room 3 claiming your rooftop has 'optimal feng shui' and demands daily sparring; cheeky beach star Pippa 'Pip' Reyes camps at your counter demanding free parfaits and piggyback rides; Breakers Union enforcers test your retired reflexes.",
    highResonanceHeroines: ["Kaede Tachibana", "Pippa Reyes", "Mia Bellini", "Zuri Delacroix"],
  },
  {
    id: "SILVER_TONGUED_HUSTLER",
    name: "Silver-Tongued Hustler (Scholarship Fixer & Fake Fiancé)",
    shortLabel: "Silver-Tongued Hustler",
    icon: "😎",
    startingStarRating: 0,
    starTierLabel: "0★ Probation (The Stray Anchor)",
    startingSolarCrowns: 220,
    outstandingDebt: 6000,
    daysUntilAudit: 30,
    startingRank: 0,
    rankTierLabel: "0★ Probation (The Stray Anchor)",
    semesterDebtQuota: 6000,
    startingCrowns: 220,
    defaultDetails:
      "A sharp-witted Solaris University scholarship student who acquired 'The Stray Anchor' deed in a late-night Old Pier poker game. Armed with effortless bluffing, contract loopholes, and audacious charm, you plan to turn the 0-Star cove into the hottest after-hours lounge on the island—if the tangled web of fake-dating pacts and gossip columns doesn't short-circuit you first.",
    actOneStakes:
      "Billionaire heiress Vivienne Laurent hires you under a strict 'Fake Boyfriend / Commoner Tour Guide' contract; gossip editor Roxy Vance corners you with candid paparazzi photos; sleepy arcade savant Chloe 'Zero' Lin offers to launder your chaotic tax ledgers for iced espresso and shoulder naps.",
    highResonanceHeroines: ["Vivienne Laurent", "Roxy Vance", "Chloe Lin", "Nadia Saint-Clair"],
  },
];

export interface PortSolarisConduitPreset {
  id: string;
  conduit: FlairConduit;
  faction: IslandFaction;
  factionLabel: string;
  wing: IslandFaction;
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
    weapon: string; // Tool of the Trade / Primary Flair Instrument
    armor: string; // Signature Attire
    relic: string; // Signature Keepsake & House Emblem
    keepsakeSlot: KeepsakeSlot;
    factionSet: string;
    jealousyQuirk: string;
    relicSlot: KeepsakeSlot;
    setId: string;
    whisperFlaw: string;
  };
}

export const PORT_SOLARIS_CONDUIT_PRESETS: PortSolarisConduitPreset[] = [
  {
    id: "boardwalk_guild_tempo",
    conduit: "PHYSICAL_TEMPO",
    faction: "BOARDWALK_GUILD",
    factionLabel: "The Boardwalk Guild",
    wing: "BOARDWALK_GUILD",
    wingLabel: "The Boardwalk Guild",
    roleTitle: "Midnight Chef & Culinary Duelist (Boardwalk Guild)",
    shortLabel: "Culinary Maestro",
    icon: "🔥",
    statSpread: { str: 13, dex: 16, int: 12 },
    description:
      "Path A: Physical Tempo (Craft & Reflex). Builds Hype (0 → 100) through razor-sharp knife work, espresso rush combos, and sensory comfort dishes that melt even 5-Star heiresses into The Blush Zone.",
    startingAbilities: [
      {
        name: "Midnight Comfort Special (Crowd-Pleaser)",
        description:
          "Whip up an aromatic, soul-warming late-night dish with effortless flair, dealing massive Composure / Blush damage (50–85% BPM) to hungry rivals and snooty inspectors.",
        type: "Active",
        cost: "25 Hype",
        cooldown: "1 Turn",
        tier: "Signature",
      },
      {
        name: "Flow-State Kitchen Rush",
        description:
          "Slow down time during high-speed Showdowns—catching falling crystal glassware, reading an opponent's next move, or plating three orders simultaneously.",
        type: "Active",
        cost: "20 Hype",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Proprietor's Palate",
        description:
          "Instantly discern the hidden ingredient, emotional craving, or secret vulnerability behind any heroine's public facade.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Damascus Chef's Santoku & Brass Espresso Tamper",
      armor: "Rolled-Sleeve Linen Proprietor Shirt & Bistro Apron",
      relic: "Mia's Hand-Stitched Gingham Apron Charm",
      keepsakeSlot: "ATTIRE",
      factionSet: "Boardwalk Artisan",
      jealousyQuirk:
        "Caught Red-Handed: Embroidered with Mia Bellini's initials inside the hem—boosts culinary Tempo by +20%, but spikes Seraphina or Colette's Heart-Rate volatility by +40% if they spot it.",
      relicSlot: "ATTIRE",
      setId: "Boardwalk Artisan",
      whisperFlaw:
        "Caught Red-Handed: Embroidered with Mia Bellini's initials inside the hem—boosts culinary Tempo by +20%, but spikes Seraphina or Colette's Heart-Rate volatility by +40% if they spot it.",
    },
  },
  {
    id: "breakers_union_tempo",
    conduit: "PHYSICAL_TEMPO",
    faction: "BREAKERS_UNION",
    factionLabel: "The Breakers Union",
    wing: "BREAKERS_UNION",
    wingLabel: "The Breakers Union",
    roleTitle: "Dojo Pier Striker & Beach Bouncer (Breakers Union)",
    shortLabel: "Breakers Striker",
    icon: "🌊",
    statSpread: { str: 16, dex: 15, int: 10 },
    description:
      "Path A: Physical Tempo (Brawn & Reflex). Dominates Article 9 beach tournaments, kendo exhibitions, and rowdy bar-brawls with sun-bronzed athleticism and accidental close-proximity catches.",
    startingAbilities: [
      {
        name: "Article 9 Pier Parry & Grapple",
        description:
          "Deflect a rival's strike or kendo shinai cleanly and pull them into a sudden collarbone-distance lock, spiking both Hype and their Heart-Rate BPM.",
        type: "Active",
        cost: "20 Hype",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "South-Shore Spike Finisher",
        description:
          "Unleash an explosive athletic flourish on the sand courts or boardwalk ring that shatters opponent Composure and sends spectator tips soaring.",
        type: "Active",
        cost: "30 Hype",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Lifeguard's Reflex Catch",
        description:
          "Automatically intercept trips, wardrobe malfunctions, or flying trays—resulting in classic rom-com close-contact collisions.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Seasoned Oak Bokken & Taped Lifeguard Whistle",
      armor: "Unbuttoned Breakers Boardwalk Windbreaker & Surf Trunks",
      relic: "Kaede's Braided Dojo Wrist-Cord",
      keepsakeSlot: "POCKET_CHARM",
      factionSet: "South-Shore Champion",
      jealousyQuirk:
        "Caught Red-Handed: Smells faintly of sea salt and Kaede's sandalwood dojo incense—grants +25% Physical Tempo reflex, but triggers immediate pouting from Pippa Reyes.",
      relicSlot: "POCKET_CHARM",
      setId: "South-Shore Champion",
      whisperFlaw:
        "Caught Red-Handed: Smells faintly of sea salt and Kaede's sandalwood dojo incense—grants +25% Physical Tempo reflex, but triggers immediate pouting from Pippa Reyes.",
    },
  },
  {
    id: "platinum_board_panache",
    conduit: "SOCIAL_PANACHE",
    faction: "PLATINUM_BOARD",
    factionLabel: "The Platinum Board",
    wing: "PLATINUM_BOARD",
    wingLabel: "The Platinum Board",
    roleTitle: "VIP Floor Host & Contract Escort (Platinum Board)",
    shortLabel: "VIP Raconteur",
    icon: "🥂",
    statSpread: { str: 10, dex: 14, int: 17 },
    description:
      "Path B: Social Panache (Charm, Wit & Audacity). Spends Cool (100% → 0%) to dismantle snobby 5-Star elites, flip eviction audits, and weaponize fake-fiancé contracts into genuine blushes.",
    startingAbilities: [
      {
        name: "Table-Turn Audit Counter",
        description:
          "Interrupt a Platinum Board inspector's smug monologue by citing an obscure municipal clause or exposing their secret midnight visits, reflecting Composure damage back onto them.",
        type: "Active",
        cost: "20 Cool",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Audacious Fake-Fiancé Gambit",
        description:
          "Spend heavy Cool to make a bold romantic declaration in front of the entire yacht club or boardwalk, forcing a heroine straight into The Blush Zone (50–85% BPM).",
        type: "Active",
        cost: "25 Cool",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "Velvet Rope Poise",
        description:
          "Maintain effortless eye contact and teasing composure under high-society scrutiny, reducing incoming Composure damage by 20%.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Monogrammed Platinum Fountain Pen & VIP Lease Binder",
      armor: "Tailored Riviera Linen Blazer (Unbuttoned Collar)",
      relic: "Seraphina's Gold-Crested Audit Signet Watch",
      keepsakeSlot: "TIMEPIECE",
      factionSet: "Cliffside VIP",
      jealousyQuirk:
        "Caught Red-Handed: Engraved with the Vane-Valorian family crest—opens 3-Star VIP doors, but sparks instant suspicion from Mia Bellini and Vivienne Laurent.",
      relicSlot: "TIMEPIECE",
      setId: "Cliffside VIP",
      whisperFlaw:
        "Caught Red-Handed: Engraved with the Vane-Valorian family crest—opens 3-Star VIP doors, but sparks instant suspicion from Mia Bellini and Vivienne Laurent.",
    },
  },
  {
    id: "driftwood_syndicate_hybrid",
    conduit: "HYBRID",
    faction: "DRIFTWOOD_SYNDICATE",
    factionLabel: "The Driftwood Syndicate",
    wing: "DRIFTWOOD_SYNDICATE",
    wingLabel: "The Driftwood Syndicate",
    roleTitle: "After-Hours Mixologist & Rumor Fixer (Driftwood Syndicate)",
    shortLabel: "Nightlife Fixer",
    icon: "📸",
    statSpread: { str: 11, dex: 15, int: 15 },
    description:
      "Hybrid Conduit. Blends slick bartender dexterity with weaponized gossip from 'The Solaris Siren', rigging Article 9 betting odds and turning paparazzi ambushes into romantic counter-teases.",
    startingAbilities: [
      {
        name: "Reverse-Paparazzi Tease",
        description:
          "Step inside a blackmailer's personal space and call their bluff with a low, intimate whisper—shattering glass-cannon Composure gauges.",
        type: "Active",
        cost: "18 Cool / Hype",
        cooldown: "1 Turn",
        tier: "Initiate",
      },
      {
        name: "Solaris Siren Scandal Spin",
        description:
          "Leak a curated rumor to the night market that boosts The Stray Anchor's foot traffic and tips while throwing rival factions into jealous chaos.",
        type: "Active",
        cost: "22 Cool",
        cooldown: "2 Turns",
        tier: "Adept",
      },
      {
        name: "After-Hours Counter Confessional",
        description:
          "Serving a custom midnight drink on the rooftop or closed bar lowers a heroine's guard, doubling Heart-to-Heart intimacy gains.",
        type: "Passive",
        cost: "0 MP",
        cooldown: "Passive",
        tier: "Initiate",
      },
    ],
    canonLoadout: {
      weapon: "Weighted Copper Cocktail Shaker & Press-Pass Camera",
      armor: "Midnight Boardwalk Leather Jacket & Tinted Shades",
      relic: "Chloe's Custom Neon-Cyan Arcade Token Charm",
      keepsakeSlot: "HOUSE_EMBLEM",
      factionSet: "Old Pier Night-Owl",
      jealousyQuirk:
        "Caught Red-Handed: Grants free access to the Old Pier Arcade VIP booth and +15% Scandal Heat control, but Roxy Vance will immediately ask why Zero gave you her lucky token.",
      relicSlot: "HOUSE_EMBLEM",
      setId: "Old Pier Night-Owl",
      whisperFlaw:
        "Caught Red-Handed: Grants free access to the Old Pier Arcade VIP booth and +15% Scandal Heat control, but Roxy Vance will immediately ask why Zero gave you her lucky token.",
    },
  },
];

export const PORT_SOLARIS_HEROINE_DOSSIERS: Record<
  string,
  HeroineProfile & {
    archetype: string;
    combatDoctrine: string;
    actOneConflict: string;
    rivalBossTieIn: string;
    dyadPassiveName: string;
    dyadPassiveDescription: string;
  }
> = {
  "Seraphina Vane": {
    id: "comp_seraphina",
    name: "Seraphina Vane",
    epithet: "The Tsundere Resort Heiress",
    faction: "PLATINUM_BOARD",
    wing: "PLATINUM_BOARD",
    conduit: "SOCIAL_PANACHE",
    preferredShopRole: "FLOOR_HOST",
    intimacyRank: 1,
    affectionPoints: 18,
    heartRateBpm: 52,
    isBoardingHouseTenant: true,
    assignedRoomNumber: 1,
    unlockedCoreMemories: ["midnight_ramen_addiction", "father_resort_ultimatum"],
    archetype: "Haughty Tsundere Ojou-sama / Secret Midnight Regular",
    combatDoctrine: "Social Panache / Audit Committee Chair & VIP Floor Host",
    actOneConflict:
      "Marches into The Stray Anchor on Day 1 to serve your 30-day eviction notice, loses a midnight cooking wager, and moves into Room 1 'strictly as an undercover auditor' while sneaking down for late-night comfort food.",
    rivalBossTieIn: "Chairman Alistair Vane & Julian Sterling (Platinum Board)",
    dyadPassiveName: "Five-Star Audit Immunity",
    dyadPassiveDescription:
      "+25% Social Panache in VIP Debates; her haughty glare intimidates snobby customers into leaving double tips.",
  },
  "Vivienne Laurent": {
    id: "comp_vivienne",
    name: "Vivienne Laurent",
    epithet: "The Sheltered 'Ice Queen' VIP",
    faction: "PLATINUM_BOARD",
    wing: "PLATINUM_BOARD",
    conduit: "SOCIAL_PANACHE",
    preferredShopRole: "PROMOTER",
    intimacyRank: 1,
    affectionPoints: 20,
    heartRateBpm: 45,
    isBoardingHouseTenant: false,
    unlockedCoreMemories: ["fake_fiance_clause_7", "first_street_crepe"],
    archetype: "Deadpan Kuudere Billionaire Heiress / Fake-Dating Partner",
    combatDoctrine: "Social Panache / High-Society Patron & VIP Promoter",
    actOneConflict:
      "Hires you under a strict 'Fake Boyfriend / Commoner Tour Guide' contract to dodge an arranged marriage—treating mundane dates like sharing a street crepe or riding a Vespa with intense, deadpan fascination.",
    rivalBossTieIn: "Lord Cassian Sterling (Arranged Fiancé & Yacht Club Commodore)",
    dyadPassiveName: "Black-Card Escort Clause",
    dyadPassiveDescription:
      "Unlocks immediate access to The Platinum Cliffs and reflects 30% of snobby Composure attacks with deadpan aristocratic poise.",
  },
  "Mia Bellini": {
    id: "comp_mia",
    name: "Mia Bellini",
    epithet: "The Childhood Friend & Next-Door Baker",
    faction: "BOARDWALK_GUILD",
    wing: "BOARDWALK_GUILD",
    conduit: "PHYSICAL_TEMPO",
    preferredShopRole: "CHEF",
    intimacyRank: 2,
    affectionPoints: 30,
    heartRateBpm: 58,
    isBoardingHouseTenant: false,
    unlockedCoreMemories: ["shared_cove_promise", "secret_wedding_recipe_book"],
    archetype: "Bossy Wife-Mode Childhood Friend / Jealous Next-Door Rival",
    combatDoctrine: "Physical Tempo / Artisan Pastry Chef & Rush-Hour Anchor",
    actOneConflict:
      "Runs the popular family bakery across the street, barges into your apartment every morning with her spare key to manage your grocery budget like a wife, and gets explosively jealous whenever a Platinum heiress sits at your counter.",
    rivalBossTieIn: "Chef Dante Moretti (Boardwalk Guild President & 4-Star Tyrant)",
    dyadPassiveName: "Homestyle Hearth Rush",
    dyadPassiveDescription:
      "+30% Hype generation during Culinary Clashes and restores 25% Composure each morning with fresh-baked brioche.",
  },
  "Colette Moreau": {
    id: "comp_colette",
    name: "Colette Moreau",
    epithet: "The Perfectionist Sommelier",
    faction: "BOARDWALK_GUILD",
    wing: "BOARDWALK_GUILD",
    conduit: "HYBRID",
    preferredShopRole: "MIXOLOGIST",
    intimacyRank: 1,
    affectionPoints: 16,
    heartRateBpm: 48,
    isBoardingHouseTenant: true,
    assignedRoomNumber: 4,
    unlockedCoreMemories: ["grand_resort_blacklisting", "custom_midnight_vintage"],
    archetype: "Sharp-Tongued Prideful Prodigy / Praise-Weak Tsundere",
    combatDoctrine: "Hybrid Flair / Exiled Beverage Prodigy & Master Mixologist",
    actOneConflict:
      "Blacklisted from the 5-Star Grand Resort after refusing to serve counterfeit vintage wine to a corrupt executive. Begrudgingly takes over The Stray Anchor's bar and melts into a flustered mess when you genuinely praise her craft.",
    rivalBossTieIn: "Executive Sommelier Marcel Vance & Chef Dante Moretti",
    dyadPassiveName: "100-Proof Blush Elixir",
    dyadPassiveDescription:
      "Her signature cocktails inflict +35% Blush Zone vulnerability on Showdown judges and boost Evening Shift revenue.",
  },
  "Pippa Reyes": {
    id: "comp_pippa",
    name: "Pippa Reyes",
    epithet: "The Cheeky Beach Prodigy",
    faction: "BREAKERS_UNION",
    wing: "BREAKERS_UNION",
    conduit: "PHYSICAL_TEMPO",
    preferredShopRole: "PROMOTER",
    intimacyRank: 2,
    affectionPoints: 28,
    heartRateBpm: 55,
    isBoardingHouseTenant: false,
    assignedRoomNumber: 6,
    unlockedCoreMemories: ["sprained_ankle_piggyback", "not_just_your_kid_sister"],
    archetype: "Cheeky Spoiled Imōto / Kōhai Firecracker",
    combatDoctrine: "Physical Tempo / Junior Surf & Beach Volleyball Star",
    actOneConflict:
      "Lounges at your counter demanding free parfaits and teasing you whenever older girls fluster you—only to get fiercely territorial when anyone monopolizes her 'Big Bro' or short-circuit when you treat her like a woman.",
    rivalBossTieIn: "Captain Rex Vance (Breakers Union Dock Boss)",
    dyadPassiveName: "Boardwalk Mascot Spike",
    dyadPassiveDescription:
      "Starts every Beach Tournament with +30 Hype and weaponizes smug kōhai commentary to tilt rival composure.",
  },
  "Kaede Tachibana": {
    id: "comp_kaede",
    name: "Kaede Tachibana",
    epithet: "The Stoic Kendo & Surf Rival",
    faction: "BREAKERS_UNION",
    wing: "BREAKERS_UNION",
    conduit: "PHYSICAL_TEMPO",
    preferredShopRole: "BOUNCER",
    intimacyRank: 1,
    affectionPoints: 22,
    heartRateBpm: 40,
    isBoardingHouseTenant: true,
    assignedRoomNumber: 3,
    unlockedCoreMemories: ["rooftop_feng_shui_excuse", "first_heartbeat_realization"],
    archetype: "Literal-Minded Martial Arts Beauty / Zero Romantic Awareness",
    combatDoctrine: "Physical Tempo / Dojo Pier Champion, Lifeguard & Head Bouncer",
    actOneConflict:
      "Takes every joke and flirtation 100% literally. Moves into Room 3 of The Stray Anchor claiming your rooftop deck has 'optimal sea-breeze feng shui' for dawn meditation—while challenging you to daily sparring.",
    rivalBossTieIn: "Master Kenji Tachibana & Captain Rex Vance",
    dyadPassiveName: "Shinai Sea-Breeze Guard",
    dyadPassiveDescription:
      " effortlessly bounces gatecrashers and counters Physical Tempo attacks with a 2.5s Flow-State parry window.",
  },
  "Roxy Vance": {
    id: "comp_roxy",
    name: "Roxy Vance",
    epithet: "The Teasing Paparazzi Editor",
    faction: "DRIFTWOOD_SYNDICATE",
    wing: "DRIFTWOOD_SYNDICATE",
    conduit: "SOCIAL_PANACHE",
    preferredShopRole: "PROMOTER",
    intimacyRank: 1,
    affectionPoints: 20,
    heartRateBpm: 62,
    isBoardingHouseTenant: false,
    unlockedCoreMemories: ["deleted_scandal_negatives", "glass_cannon_confession"],
    archetype: "Flirty Gossip Broker / Glass-Cannon Tease",
    combatDoctrine: "Social Panache / Editor-in-Chief of 'The Solaris Siren'",
    actOneConflict:
      "Constantly corners you with candid telephoto snapshots to blackmail you into 'exclusive investigative dates'—only for her glass-cannon Composure Gauge to shatter to 100% BPM the second you lean in and flirt back.",
    rivalBossTieIn: "The Platinum Board PR Directorate & Night-Market Bookies",
    dyadPassiveName: "Front-Page Scandal Spin",
    dyadPassiveDescription:
      "Converts Scandal Heat into +35% Café Foot Traffic and exposes opponents' embarrassing secrets mid-Showdown.",
  },
  "Chloe Lin": {
    id: "comp_chloe",
    name: "Chloe Lin",
    epithet: "The Sleepy Arcade & Tax Savant",
    faction: "DRIFTWOOD_SYNDICATE",
    wing: "DRIFTWOOD_SYNDICATE",
    conduit: "HYBRID",
    preferredShopRole: "FLOOR_HOST",
    intimacyRank: 2,
    affectionPoints: 26,
    heartRateBpm: 42,
    isBoardingHouseTenant: true,
    assignedRoomNumber: 2,
    unlockedCoreMemories: ["old_pier_arcade_crown", "shoulder_nap_dependency"],
    archetype: "Deadpan Hoodie Night-Owl / Cozy Shoulder-Napper",
    combatDoctrine: "Hybrid Flair / Undefeated Arcade Champion & Forensic Bookkeeper",
    actOneConflict:
      "Survives on iced espresso, destroys everyone at fighting games in the Old Pier Arcade, and casually audits your shop's chaotic tax ledgers to block Platinum Board foreclosures in exchange for free meals and shoulder naps.",
    rivalBossTieIn: "Platinum Board Corporate Auditors & Old Pier High-Rollers",
    dyadPassiveName: "Frame-Perfect Audit Cancel",
    dyadPassiveDescription:
      "Slashes semester debt interest by 25% and reads rival Showdown patterns with fighting-game frame data precision.",
  },
  "Nadia Saint-Clair": {
    id: "comp_nadia",
    name: "Nadia Saint-Clair",
    epithet: "The Velvet Appraiser",
    faction: "PLATINUM_BOARD",
    wing: "PLATINUM_BOARD",
    conduit: "SOCIAL_PANACHE",
    preferredShopRole: "FLOOR_HOST",
    intimacyRank: 1,
    affectionPoints: 18,
    heartRateBpm: 52,
    isBoardingHouseTenant: true,
    assignedRoomNumber: 5,
    unlockedCoreMemories: ["charcoal_terrace_sketchbook", "fogged_glasses_tasting"],
    archetype: "Cool-Beauty Sommelier & Secret Sketchbook Romantic (Kuudere / Megane Perfectionist)",
    combatDoctrine: "Social Panache / Senior Heritage & Vintage Appraiser for the Platinum Cliffs Trust",
    actOneConflict:
      "Publicly the most feared aesthetic and vintage critic on the Platinum Cliffs whose quiet 'Derivative. Two out of ten.' can sink a resort lounge—yet she secretly rents Room 5 at The Stray Anchor to escape high-society galas, sketching charcoal portraits of you on the midnight terrace and fumbling her gold eyeglass chain whenever you feed her straight from the pan.",
    rivalBossTieIn: "The Platinum Cliffs Heritage Committee & Chef Laurent D'Artagnan",
    dyadPassiveName: "Gold-Chain Vintage Appraisal",
    dyadPassiveDescription:
      "Elevates VIP table prestige by +30% and exposes the pretentious flaws in rival 5-Star sommelier and culinary Showdowns.",
  },
  "Zuri Delacroix": {
    id: "comp_zuri",
    name: "Zuri Delacroix",
    epithet: "The Matcha Alchemist",
    faction: "BOARDWALK_GUILD",
    wing: "BOARDWALK_GUILD",
    conduit: "HYBRID",
    preferredShopRole: "CHEF",
    intimacyRank: 2,
    affectionPoints: 24,
    heartRateBpm: 60,
    isBoardingHouseTenant: true,
    assignedRoomNumber: 6,
    unlockedCoreMemories: ["midnight_matcha_gelato_test", "braid_curtain_blush"],
    archetype: "Teasing Botanical Patissier & Sensory Provocateur (Playful Flirt / Glass-Hearted Counter-Target)",
    combatDoctrine: "Hybrid Flair / Sunset Rambla Artisanal Gelato, Matcha & Herbal Infusion Prodigy",
    actOneConflict:
      "Moves her botanical espresso-and-gelato lab into Room 6 and loves leaning across your prep counter with a slow, cat-like smirk to test 'heart-rate-spiking pistachio-matcha parfaits' on you—only to squeak and hide her face behind her thick green twin braids the second you wipe a dab of cream from her lips.",
    rivalBossTieIn: "Chef Laurent D'Artagnan & Sunset Rambla Franchise Cartel",
    dyadPassiveName: "Botanical Euphoria Infusion",
    dyadPassiveDescription:
      "Boosts Café Dessert Tips by +30% and infuses Physical Tempo dishes with aromatic sensory notes that push rivals straight into The Blush Zone.",
  },
};
