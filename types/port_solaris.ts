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
      "Blacklisted from the 4-Star cliffside cellar L'Étoile d'Or after exposing Executive Sommelier Marcel Vance's counterfeit vintage wine scam—and knocking out the handsy Platinum VIP he was serving with a silver champagne bucket. Begrudgingly takes over The Stray Anchor's evening bar (and Room 204), where she secretly writes starry-eyed romance novels under the pen name 'Lady Cerise' and melts into a flustered mess when you genuinely praise her craft.",
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

export interface PortSolarisCharterClause {
  clauseId: string;
  title: string;
  summary: string;
  gameplayEffect: string;
}

export interface PortSolarisCharterArticle {
  articleNumber: string;
  title: string;
  category: "Governance & Star Ledger" | "Audit & Foreclosure" | "Domestic & Heritage" | "Sanctioned Showdowns";
  summary: string;
  clauses: PortSolarisCharterClause[];
}

export const PORT_SOLARIS_CHARTER_ARTICLES: PortSolarisCharterArticle[] = [
  {
    articleNumber: "Article 1",
    title: "Island Sovereignty, Coastal Tiers & The Four Factions",
    category: "Governance & Star Ledger",
    summary:
      "Establishes the joint municipal charter of Port Solaris between Solaris University and the four recognized island factions across the five coastal tiers.",
    clauses: [
      {
        clauseId: "Clause 1A",
        title: "Five-Tier Coastal Jurisdiction",
        summary:
          "Divides Port Solaris into five regulated zones: Tier 1 (Driftwood Cove), Tier 2 (Breakers Boardwalk & Old Pier), Tier 3 (Sunset Rambla), Tier 4 (Solaris University Campus Terrace), and Tier 5 (The Platinum Cliffs).",
        gameplayEffect:
          "Higher-tier zones carry stricter social scrutiny and higher-ranked Article 9 challengers.",
      },
      {
        clauseId: "Clause 1B",
        title: "The Four Recognized Faction Charters",
        summary:
          "Grants formal representation on the Island Council to The Platinum Board, The Boardwalk Guild, The Breakers Union, and The Driftwood Syndicate.",
        gameplayEffect:
          "Building Faction Standing (Neutral → Respected → Honored → Exalted) unlocks wholesale discounts, bouncer shields, and audit grace periods.",
      },
    ],
  },
  {
    articleNumber: "Article 2",
    title: "Commercial Deeds, Inheritance & Solar Crown Currency",
    category: "Governance & Star Ledger",
    summary:
      "Governs the transfer of waterfront business deeds, inherited liabilities, and the island's official Solar Crown currency.",
    clauses: [
      {
        clauseId: "Clause 2A",
        title: "Inherited Waterfront Deeds & Encumbrances",
        summary:
          "An heir who claims an independent beachfront deed (such as The Stray Anchor) assumes both full proprietorship and its outstanding seasonal lease debt (5,000 Solar Crowns).",
        gameplayEffect:
          "Establishes your starting proprietorship of The Stray Anchor Café & 6-Room Boarding House in Driftwood Cove.",
      },
      {
        clauseId: "Clause 2B",
        title: "Solar Crown Legal Tender & Shift Revenue",
        summary:
          "Recognizes Solar Crowns earned from café shifts, boarding rent, and sanctioned Showdown pots as legal tender for retiring municipal lease debt.",
        gameplayEffect:
          "35% of each turn's café shift revenue automatically pays down your lease debt, or you can manually pay 250 Crowns from the Ledger.",
      },
    ],
  },
  {
    articleNumber: "Article 3",
    title: "Public Peace, Non-Violence & Press Freedom",
    category: "Domestic & Heritage",
    summary:
      "Protects Port Solaris's sun-drenched resort atmosphere by outlawing lethal force and regulating campus/boardwalk tabloid journalism.",
    clauses: [
      {
        clauseId: "Clause 3A",
        title: "Strict Prohibition of Lethal Force & Arson",
        summary:
          "Lethal weapons, violent property destruction, and covert sabotage result in immediate island expulsion; all conflicts must be channeled into non-lethal Article 9 contests.",
        gameplayEffect:
          "Ensures all Port Solaris encounters use non-lethal Composure, Hype, and Cool vitals rather than mortal HP bleed.",
      },
      {
        clauseId: "Clause 3B",
        title: "Freedom of the Boardwalk Press & Scandal Heat",
        summary:
          "Protects student and syndicate publications (such as Roxy Vance's 'The Solaris Siren') covering public dates, audit drama, and beachfront wagers.",
        gameplayEffect:
          "Drives the Scandal Heat meter (0–100%): higher heat boosts café foot-traffic up to +50% while raising romantic jealousy risk.",
      },
    ],
  },
  {
    articleNumber: "Article 4",
    title: "The Solaris Star Ledger & Commercial Tiering",
    category: "Governance & Star Ledger",
    summary:
      "Establishes the 0★ to 5★ rating system jointly administered by Solaris University and the Platinum Hospitality Conglomerate, governing supply rights, beachfront zoning, and festival sponsorship.",
    clauses: [
      {
        clauseId: "Clause 4A",
        title: "0★ Probation to 5★ Sovereign Thresholds",
        summary:
          "Every commercial lease is graded from 0★ (5,000 Debt) to 1★ (≤4,000), 2★ (≤3,000), 3★ (≤2,000), 4★ (≤1,000), and 5★ (0 Debt) based on debt retirement, inspector sign-offs, and Showdown victories.",
        gameplayEffect:
          "Each Star upgrade multiplies daily café revenue (1.0x at 0★ up to 6.0x at 5★) and unlocks mid/late-act story nodes.",
      },
      {
        clauseId: "Clause 4B",
        title: "Cultural & Culinary Merit Certification",
        summary:
          "An establishment may bypass corporate franchise fees if certified for 'Irreplaceable Culinary or Cultural Merit' by a senior Platinum Cliffs Heritage Appraiser (such as Nadia Saint-Clair) or Boardwalk Guild Sommelier.",
        gameplayEffect:
          "Winning Nadia's or Colette's blind-tasting appraisal grants +1★ audit credit and shields your menu from conglomerate copycat injunctions.",
      },
    ],
  },
  {
    articleNumber: "Article 5",
    title: "Supply Lines, Artisanal Licensing & Festival Booths",
    category: "Governance & Star Ledger",
    summary:
      "Prevents conglomerate hoarding of Sunset Rambla ingredients and regulates promotional booths along South Beach.",
    clauses: [
      {
        clauseId: "Clause 5A",
        title: "Open Artisanal Supply & Anti-Monopoly Rule",
        summary:
          "Forbids 5-Star resorts from locking independent cafés out of Sunset Rambla bakeries, vineyards, or botanical gelato labs if the café holds at least a 1★ Provisional License.",
        gameplayEffect:
          "Allows Mia Bellini, Colette Moreau, and Zuri Delacroix to legally supply The Stray Anchor's kitchen and bar.",
      },
      {
        clauseId: "Clause 5B",
        title: "South-Shore Tournament & Festival Staging",
        summary:
          "Reserves boardwalk promotional booths and High Summer Festival stage slots for establishments backed by active Breakers Union athletes (challenging Captain Rex Vance's volleyball monopoly and Master Kenji Tachibana's Dojo Pier trials).",
        gameplayEffect:
          "Partnering with Pippa Reyes and Kaede Tachibana unlocks South Beach promotional rallies and festival Hype bonuses.",
      },
    ],
  },
  {
    articleNumber: "Article 6",
    title: "The 30-Day Seasonal Audit & Foreclosure Mandate",
    category: "Audit & Foreclosure",
    summary:
      "Governs seasonal debt settlement, property condemnation, and the rights of Platinum Board auditors inspecting 0-Star waterfront properties.",
    clauses: [
      {
        clauseId: "Clause 6A",
        title: "The 30-Day Eviction & Bulldozing Rule",
        summary:
          "Any beachfront establishment remaining at 0★ or carrying unpaid lease debt at the close of the 30-day High Summer Audit forfeits its deed to the Vane-Valorian Marina Expansion.",
        gameplayEffect:
          "Triggers formal inspections on Days 25, 20, 10, 5, and Day 0. Retiring the 5,000 Solar Crown debt before Day 0 liberates The Stray Anchor permanently.",
      },
      {
        clauseId: "Clause 6B",
        title: "The On-Site Resident Auditor Clause",
        summary:
          "If a Lead Platinum Board Auditor places a property under daily probation oversight, the proprietor may invoke Clause 6B requiring the auditor to reside on-site in standard tenant quarters to verify round-the-clock operations.",
        gameplayEffect:
          "The legal loophole that forces Seraphina Vane to move into Upstairs Room 201 and work floor shifts while her father freezes her black cards.",
      },
    ],
  },
  {
    articleNumber: "Article 7",
    title: "High-Society Conduct, Sponsorship & Family Pacts",
    category: "Domestic & Heritage",
    summary:
      "Regulates Platinum Cliffs dynastic charters, VIP black-card sponsorships, and the legal exemptions protecting engaged heirs from arranged corporate marriages.",
    clauses: [
      {
        clauseId: "Clause 7A",
        title: "Betrothal Autonomy & Fake-Fiancé Exemption ('Clause 7')",
        summary:
          "Under Platinum Cliffs family charters (colloquially known as 'Clause 7'), an heir or heiress who registers an active courtship pact with an independent island proprietor is granted a 90-day moratorium from parentally arranged mergers (such as Lord Cassian Sterling's suit).",
        gameplayEffect:
          "Unlocks Vivienne Laurent's 'Fake-Fiancé Clause 7' Core Memory and her 'Black-Card Escort Clause' Dyad Passive, shielding The Stray Anchor from hostile buyouts.",
      },
      {
        clauseId: "Clause 7B",
        title: "VIP Patronage & Escort Immunity",
        summary:
          "Any establishment hosting a registered Platinum Cliffs patron in good standing cannot have its utilities, deliveries, or patio permits suspended without a public hearing.",
        gameplayEffect:
          "Reduces Scandal Heat penalties and blocks Chairman Alistair Vane from shutting down your kitchen via administrative red tape.",
      },
    ],
  },
  {
    articleNumber: "Article 8",
    title: "The Boarding House Co-Tenancy & Work-Study Act",
    category: "Domestic & Heritage",
    summary:
      "Originally drafted for student co-ops and coastal inns, Article 8 governs mixed-use café boarding houses and live-in staff leases.",
    clauses: [
      {
        clauseId: "Clause 8A",
        title: "Work-for-Rent Tenant Covenant (Rooms 201–206)",
        summary:
          "Allows proprietors of 6-room coastal inns to commute tenant rent in exchange for specialist shop shifts (Chef, Mixologist, Floor Host, Bouncer, or Promoter).",
        gameplayEffect:
          "Assigning heroines to Upstairs Rooms 201–206 and active Café Roles multiplies daily Solar Crown revenue and triggers rooftop/shared-bath proximity scenes.",
      },
      {
        clauseId: "Clause 8B",
        title: "Rooftop Sanctuary & Quiet Hours",
        summary:
          "Designates the upstairs hallway and rooftop terrace as private tenant sanctuary after 11:00 PM, requiring the landlord to personally mediate roommate turf wars.",
        gameplayEffect:
          "Governs late-night Heart-to-Heart cooldowns (reducing 100% BPM Short-Circuits) and Rooftop Rivalry Ultimatums when housemate tension peaks.",
      },
    ],
  },
  {
    articleNumber: "Article 9",
    title: "Sanctioned Public Turf Showdowns & Fair Wager Code",
    category: "Sanctioned Showdowns",
    summary:
      "The cornerstone law of Port Solaris: bans violent sabotage and corporate lawsuits in favor of televised public contests of Culinary Craft, Mixology, Beach Athletics, or Social Panache.",
    clauses: [
      {
        clauseId: "Clause 9A",
        title: "Mandatory Public Turf Resolution",
        summary:
          "Any dispute over commercial leases, supplier monopolies, boardwalk booth rights, or personal honor may be settled by a binding Article 9 Showdown judged by crowd Hype (Path A: Physical Tempo) and panel Cool (Path B: Social Panache).",
        gameplayEffect:
          "Replaces lethal combat with non-lethal Composure/Poise Showdowns where breaking a rival's Composure to 100% BPM triggers a public Flustered Meltdown.",
      },
      {
        clauseId: "Clause 9B",
        title: "Anti-Usury & Compound Interest Cap",
        summary:
          "Prohibits compound interest traps and hidden balloon clauses on inherited small-business deeds if uncovered by a certified forensic bookkeeper.",
        gameplayEffect:
          "Chloe 'Zero' Lin's 'Frame-Perfect Audit Cancel' invokes Clause 9B to slash predatory debt interest by 25%–40%.",
      },
      {
        clauseId: "Clause 9C",
        title: "Emergency All-In Deed Wager",
        summary:
          "When facing imminent foreclosure or an unwinnable audit, a proprietor may stake The Stray Anchor's deed in an all-in Clause 9C Grand Twist—forcing an immediate victory at the cost of heightened Scandal Heat and Composure strain.",
        gameplayEffect:
          "Port Solaris's equivalent of the Causal Covenant: guarantees an instant Showdown/Audit breakthrough in exchange for permanent Composure cap pressure.",
      },
    ],
  },
  {
    articleNumber: "Article 10",
    title: "Five-Star Island Sovereign Landmark Immunity",
    category: "Governance & Star Ledger",
    summary:
      "The ultimate prize of the Solaris Star Ledger: permanent protection and sovereign status for any independent establishment that achieves a 5★ rating and zero debt.",
    clauses: [
      {
        clauseId: "Clause 10A",
        title: "Perpetual Deed Liberation",
        summary:
          "An establishment that reaches 5★ and retires its lease debt before the Day 0 Grand Festival Sunset receives perpetual immunity from corporate eminent domain.",
        gameplayEffect:
          "Permanently secures The Stray Anchor's deed against Chairman Alistair Vane's marina expansion.",
      },
      {
        clauseId: "Clause 10B",
        title: "Island Festival Council Seat & Sovereign Ending",
        summary:
          "Seats the 5★ proprietor and their chosen partner at the head of the High Summer Fireworks Gala over Driftwood Cove.",
        gameplayEffect:
          "Unlocks the '5★ Island Sovereign: Fireworks Over Driftwood Cove' finale and permanent Heart-Lock endings.",
      },
    ],
  },
];

// ============================================================================
// CANONICAL ARCHITECTURE, UNCLE MARCO DEED LORE & SIGNATURE HOUSE MENU
// ============================================================================

export interface PortSolarisDeedLore {
  founderName: string;
  heirloomRelic: string;
  deedHistory: string;
  debtOrigin: string;
  proprietorQuarters: string;
  sharedBathQuirk: string;
}

export const PORT_SOLARIS_UNCLE_AND_DEED_LORE: PortSolarisDeedLore = {
  founderName: "Late Uncle Marco ('Skipper' Marco) & Grandfather's Brass Tamper",
  heirloomRelic: "Heirloom Brass Espresso Tamper (Stamped with the Stray Anchor Crest)",
  deedHistory:
    "Founded twenty-five years ago by your grandfather and run by your late Uncle Marco—a retired merchant mariner and legendary midnight cook who treated Driftwood Cove as a safe harbor for misfits, broke students, and runaway heiresses. Whether you returned after being blacklisted from the Vane-Valorian Grand Resort, retired from the martial arts circuit, or won back the final hold-note in a late-night Old Pier poker game, you inherited Uncle Marco's deed and his prized brass espresso tamper.",
  debtOrigin:
    "After last autumn's tropical typhoon damaged the cove seawall and timber deck, Uncle Marco took out a 5,000 Solar Crown emergency restoration mortgage. Chairman Alistair Vane's Platinum Hospitality Conglomerate quietly bought up the note, slapping it with a 30-day High Summer Audit ultimatum (Article 6, Clause 6A) to foreclose on the cove and bulldoze it for a private superyacht marina.",
  proprietorQuarters:
    "The 3rd-Floor Captain's Attic Loft (Room 301): Your private cedar-beamed loft sits on the third level directly opening onto the string-lit Rooftop Laundry & Herb Terrace. Every tenant going up to the rooftop after 11:00 PM passes right by your door.",
  sharedBathQuirk:
    "The Infamous 2nd-Floor Shared Bath: Rooms 201–206 share a single tiled Mediterranean bathroom at the end of the creaky cedar hallway. Its finicky vintage brass water heater drops pressure whenever someone pulls an espresso shot downstairs—making 7:00 AM towel-wrapped hallway collisions and foggy-mirror encounters an everyday hazard.",
};

export interface PortSolarisFloorplanEntry {
  locationCode: string;
  title: string;
  occupant: string;
  faction: IslandFaction | "PROPRIETOR";
  roleAndPerks: string;
  loreNotes: string;
}

export const PORT_SOLARIS_FLOORPLAN_CANON: PortSolarisFloorplanEntry[] = [
  {
    locationCode: "1st Floor",
    title: "Sea-Level Café Deck, Open-Flame Kitchen & Mahogany Bar",
    occupant: "All Active Shift Staff (5 Café Roles)",
    faction: "PROPRIETOR",
    roleAndPerks: "Base 100 Crowns/shift + Role & Star Multipliers (1.0x → 6.0x)",
    loreNotes:
      "Features a 40-seat weathered timber patio overlooking Driftwood Cove, a brass two-group espresso machine, an open-flame flat-top range, Colette's evening walnut cocktail bar, and Corner Booth #1 (Seraphina's favorite spot).",
  },
  {
    locationCode: "Room 201",
    title: "The Tsundere Heiress Suite (Front Cove View)",
    occupant: "Seraphina Vane (Live-In Tenant • Clause 6B)",
    faction: "PLATINUM_BOARD",
    roleAndPerks: "Floor Host • -20% Audit Penalties & +30 Crowns/day VIP Referrals",
    loreNotes:
      "Moved in on Night 1 with two designer suitcases under Article 6 Clause 6B ('strictly as an on-site resident auditor') after her father froze her credit cards. Sneaks downstairs at midnight for your garlic-butter seafood pasta.",
  },
  {
    locationCode: "Room 202",
    title: "The Shaded Arcade Den (North Shade Corner)",
    occupant: "Chloe 'Zero' Lin (Live-In Tenant)",
    faction: "DRIFTWOOD_SYNDICATE",
    roleAndPerks: "Floor Host / Night Auditor • -25% Debt Interest (Clause 9B) & +25 Crowns/day",
    loreNotes:
      "Blackout curtains, dual fiber-optic monitors, custom Sanwa fight-sticks, and a beanbag throne. Demands iced quad-espresso and morning piggyback rides downstairs.",
  },
  {
    locationCode: "Room 203",
    title: "The Tatami Sea-Breeze Room (East Pier View)",
    occupant: "Kaede Tachibana (Live-In Tenant)",
    faction: "BREAKERS_UNION",
    roleAndPerks: "Head Bouncer • +10 Morning Composure & -10% Scandal Heat Decay/shift",
    loreNotes:
      "Woven rush tatami mats, a wooden bokken rack, sandalwood incense, and a secret stash of stray-kitten treats and arcade plushies hidden inside her closet.",
  },
  {
    locationCode: "Room 204",
    title: "The Tasting Parlor & Velvet Desk (West Sunset View)",
    occupant: "Colette Moreau (Live-In Tenant)",
    faction: "BOARDWALK_GUILD",
    roleAndPerks: "Master Mixologist • +20% Bar Revenue & +35% Blush Zone Infliction",
    loreNotes:
      "Lined with rare botanical tinctures, vintage coupe glasses, and a locked rosewood writing desk where she secretly pens her starry-eyed romance novel 'Velvet Tides' under the pen name 'Lady Cerise'.",
  },
  {
    locationCode: "Room 205",
    title: "The Velvet Atelier (Private Sea-Breeze Balcony)",
    occupant: "Nadia Saint-Clair (Live-In Tenant)",
    faction: "PLATINUM_BOARD",
    roleAndPerks: "VIP Sommelier & Appraiser • +30% VIP Prestige & Clause 4B Merit (+30 Crowns/day)",
    loreNotes:
      "Her quiet sanctuary away from suffocating Platinum Cliffs galas. Contains an easel, charcoal sketchbooks filled with candid drawings of you in the kitchen, and unpretentious coastal vintages.",
  },
  {
    locationCode: "Room 206",
    title: "The Botanical Greenhouse Suite (Sunny Gables)",
    occupant: "Zuri Delacroix (Live-In Tenant)",
    faction: "BOARDWALK_GUILD",
    roleAndPerks: "Botanical Patissier • +30% Café Dessert Tips & Mood Infusions (+25 Crowns/day)",
    loreNotes:
      "Packed with hanging terracotta herb pots, ceremonial matcha whisks, night-blooming orchids, and small-batch copper gelato churners.",
  },
  {
    locationCode: "3rd Floor (Room 301)",
    title: "The Proprietor's Attic Loft & Rooftop Sanctuary",
    occupant: "You (The Proprietor) • Open to Late-Night Visitors",
    faction: "PROPRIETOR",
    roleAndPerks: "Article 8 Clause 8B Sanctuary • Heart-to-Heart Cooldowns (-25 BPM)",
    loreNotes:
      "Your private loft opens directly onto the lantern-lit cedar rooftop laundry and herb terrace. Protected by Quiet Hours after 11:00 PM for one-on-one confessions and mediating housemate ultimatums.",
  },
  {
    locationCode: "Next Door (15 ft)",
    title: "Bellini Artisan Patisserie (2nd-Floor Apartment)",
    occupant: "Mia Bellini (Next-Door Neighbor & Spare-Key Holder)",
    faction: "BOARDWALK_GUILD",
    roleAndPerks: "Head Chef • +30% Culinary Hype & +25% Morning Composure Brioche",
    loreNotes:
      "Lives right across the narrow cobblestone lane above her family bakery (founded by Nonna Bellini). Her bedroom window faces your 2nd-floor landing, and she uses her childhood spare key to barge into your kitchen every dawn.",
  },
  {
    locationCode: "Cliffside / Loft",
    title: "Villa Laurent (Platinum Cliffs) & Your Loft Daybed",
    occupant: "Vivienne Laurent (Clause 7A Fake-Fiancé Commuter)",
    faction: "PLATINUM_BOARD",
    roleAndPerks: "VIP Promoter • Unlocks Platinum Cliffs & Reflects 30% Snobby Composure Damage",
    loreNotes:
      "Officially resides at Villa Laurent on Tier 5, but slips past her bodyguards via the Cliffside Funicular Tram to hide out at The Stray Anchor—keeping a secret stash of casual boardwalk sundresses in your 3rd-floor loft.",
  },
  {
    locationCode: "South-Shore Dorms",
    title: "Breakers Lifeguard Dorms & Café Booth #4",
    occupant: "Pippa 'Pip' Reyes (Boardwalk Mascot & Frequent Crasher)",
    faction: "BREAKERS_UNION",
    roleAndPerks: "Beach Promoter • +30 Starting Beach Tournament Hype",
    loreNotes:
      "Officially assigned to the Solaris University athletic dorms on South Beach, but stores her custom surfboards under your deck and routinely crashes on Kaede's tatami mat in Room 203 or your rooftop hammock.",
  },
  {
    locationCode: "Campus Terrace",
    title: "The Solaris Siren Press Studio & Darkroom",
    occupant: "Roxy Vance (Campus Commuter & Bar Counter Regular)",
    faction: "DRIFTWOOD_SYNDICATE",
    roleAndPerks: "PR Promoter • Converts Scandal Heat into +35% Café Foot Traffic",
    loreNotes:
      "Maintains a red-lit 35mm darkroom above the Campus Terrace student union, but treats Barstool #7 at The Stray Anchor as her personal night-market newsroom.",
  },
];

export interface PortSolarisMenuItem {
  name: string;
  category: "Midnight Entrée" | "Artisan Pastry" | "Signature Cocktail" | "Botanical Gelato & Parfait";
  craftedBy: string;
  effectSummary: string;
  loreDescription: string;
}

export const PORT_SOLARIS_SIGNATURE_MENU: PortSolarisMenuItem[] = [
  {
    name: "Midnight Garlic-Butter Cove Seafood Pasta",
    category: "Midnight Entrée",
    craftedBy: "The Proprietor (Uncle Marco's Secret Recipe)",
    effectSummary: "Melts Ironclad Composure & triggers Seraphina's 'Midnight Ramen/Pasta' Core Memory",
    loreDescription:
      "Fresh-caught Driftwood Cove prawns seared in white wine, roasted garlic butter, chili flakes, and lemon zest—the dish that broke Seraphina Vane's eviction resolve on Night 1.",
  },
  {
    name: "Toasted Ligurian Saffron & Aged Parmigiano Risotto",
    category: "Midnight Entrée",
    craftedBy: "The Proprietor & Nadia Saint-Clair",
    effectSummary: "Unlocks Clause 4B Cultural Merit Appraisal (+1★ Credit) & fogs Nadia's spectacles",
    loreDescription:
      "Slow-simmered coastal carnaroli rice finished with golden saffron threads and sea-breeze herbs; the unpretentious copper-pan dish that won over Platinum Trust critic Nadia Saint-Clair.",
  },
  {
    name: "Nonna Bellini's Brown-Butter Almond Croissant & Morning Brioche",
    category: "Artisan Pastry",
    craftedBy: "Mia Bellini (Bellini Artisan Patisserie)",
    effectSummary: "+30% Culinary Showdown Hype & Restores +25% Composure each morning",
    loreDescription:
      "Flaky 27-layer laminated pastry dusted with powdered sugar and paired with The Stray Anchor's double-shot brass-tampered espresso.",
  },
  {
    name: "Braised Sea-Salt & Ginger Steamed Pork Buns",
    category: "Artisan Pastry",
    craftedBy: "The Proprietor (5:30 AM Dawn Batch)",
    effectSummary: "Recruits Kaede Tachibana for 12-hour Bouncer shifts & calms boardwalk stray cats",
    loreDescription:
      "Pillowy warm steamed buns filled with caramelized sea-salt pork belly—Kaede Tachibana's weakness after dawn kendo kata on the Dojo Pier.",
  },
  {
    name: "100-Proof 'Velvet Tides' Blood-Orange & Peach Bellini",
    category: "Signature Cocktail",
    craftedBy: "Colette Moreau (Room 204 Reserve)",
    effectSummary: "Inflicts +35% Blush Zone vulnerability on Showdown judges & +25% Evening Bar Revenue",
    loreDescription:
      "Sparkling coastal prosecco layered with charred oak bitters, white peach purée, and blood-orange oil sheen—served in a chilled crystal coupe.",
  },
  {
    name: "Blush-Zone Ceremonial Pistachio-Matcha Affogato",
    category: "Botanical Gelato & Parfait",
    craftedBy: "Zuri Delacroix (Room 206 Botanical Lab)",
    effectSummary: "+30% Café Dessert Tips & spikes target Heart-Rate BPM by +15–30 BPM",
    loreDescription:
      "Velvety stone-ground Uji matcha and Sicilian pistachio gelato drowned in a hot shot of Stray Anchor espresso and garnished with night-blooming orchid sugar.",
  },
  {
    name: "South-Shore Championship Towering Mango-Tajín Parfait",
    category: "Botanical Gelato & Parfait",
    craftedBy: "The Proprietor & Pippa Reyes",
    effectSummary: "+30 Starting Hype in Beach Tournaments & fuels Breakers Union rallies",
    loreDescription:
      "A foot-tall glass layered with fresh island mango, coconut sorbet, whipped cream, and chili-lime crunch—Pippa Reyes's mandatory post-volleyball victory fuel.",
  },
  {
    name: "Zero's 2:00 AM Quad-Shot Cold Brew & Noon Buttermilk Pancakes",
    category: "Midnight Entrée",
    craftedBy: "The Proprietor (Room 202 Room Service)",
    effectSummary: "Powers Chloe Lin's Clause 9B Forensic Audit Cancel (-25% to -40% Debt Interest)",
    loreDescription:
      "An ice-cold quad-espresso flask delivered to the Old Pier Arcade at 2:00 AM, followed by warm honey-butter pancakes whenever Chloe finally wakes up at noon.",
  },
];


