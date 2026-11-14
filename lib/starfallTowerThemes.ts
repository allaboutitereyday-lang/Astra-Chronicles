/**
 * Starfall Labyrinth — 25-Floor Shifting Tower Themes & Procedural Stratum Generator
 * Every 25 floors (1–25, 26–50, 51–75, 76–100) completely transforms the Tower's:
 * - Architectural Layout Geometry & Exploit Terrain Tags
 * - Environmental Field Hazard / Law
 * - Enemy Bestiary, Poise Gauges, Elemental/Tactical Weaknesses & Telegraphs
 * - Quarter-Tower Threshold Sanctums (F25, F75) & Sovereign Gate Bosses (F10..F100)
 */

export type TowerThemeId =
  | "SUNKEN_RELIQUARY"
  | "CHRONOS_FOUNDRY"
  | "ECLIPSE_SANCTUM"
  | "ASTRAL_SINGULARITY";

export type TacticalWeaknessTag =
  | "HOLY_PURGE"
  | "BLUNT_STAGGER"
  | "PIERCE_VITALS"
  | "ASTRAL_ARCANE"
  | "SHADOW_HEX"
  | "VENOM_PARALYSIS"
  | "CORE_INTERRUPT"
  | "CRYSTAL_SHATTER";

export interface EnemyIntentTemplate {
  id: string;
  label: string;
  telegraphText: string;
  targetMode: "SINGLE_FRONTLINE" | "LOWEST_HP" | "ALL_FRONTLINE" | "ENTIRE_PARTY" | "SELF_BUFF";
  damageMultiplier: number;
  poiseGuard?: boolean;
  appliesCondition?: "BLEED" | "POISON" | "STUN" | "MANA_DRAIN" | "TIME_REWIND" | "HEX_WEAKEN";
  interruptibleBy?: TacticalWeaknessTag[];
}

export type EnemyTelegraphIntent = EnemyIntentTemplate;

export type StarfallEnemyTier = "COMMON" | "ELITE" | "BOSS";

export interface TowerEnemyTemplate {
  id: string;
  name: string;
  title: string;
  tier?: StarfallEnemyTier;
  aliases?: string[];
  isBoss?: boolean;
  isThresholdGuardian?: boolean;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  maxPoise: number;
  weaknesses: TacticalWeaknessTag[];
  resistances?: TacticalWeaknessTag[];
  visualBrief: string;
  mechanicsSummary: string;
  intents: EnemyIntentTemplate[];
}

export interface FloorLayoutTemplate {
  id: string;
  name: string;
  geometrySummary: string;
  tacticalHint: string;
  terrainTags: string[];
  favoredRoles: ("TACTICIAN" | "VANGUARD" | "STRIKER" | "ARCANIST")[];
}

export interface TowerThemeDefinition {
  id: TowerThemeId;
  tierNumber: 1 | 2 | 3 | 4;
  floorRangeLabel: string;
  minFloor: number;
  maxFloor: number;
  name: string;
  subtitle: string;
  accentColor: "emerald" | "amber" | "rose" | "indigo";
  backgroundUrl: string;
  atmosphereSensory: string;
  environmentalLawName: string;
  environmentalLawEffect: string;
  layouts: FloorLayoutTemplate[];
  regularEnemies: TowerEnemyTemplate[];
  bossByFloor: Record<number, TowerEnemyTemplate>;
}

function hashThemeSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const STARFALL_TOWER_THEMES: TowerThemeDefinition[] = [
  // =========================================================================
  // TIER I: FLOORS 1–25 — THE SUNKEN RELIQUARY & VERDANT OSSUARY
  // =========================================================================
  {
    id: "SUNKEN_RELIQUARY",
    tierNumber: 1,
    floorRangeLabel: "Floors 1–25",
    minFloor: 1,
    maxFloor: 25,
    name: "The Sunken Reliquary & Verdant Ossuary",
    subtitle: "Flooded crypt corridors, bone-choked culverts & drowned cathedral gates",
    accentColor: "emerald",
    backgroundUrl: "/backgrounds/starfall-labyrinth/sunken_reliquary.jpg",
    atmosphereSensory:
      "Cold ankle-deep brine lapping over cracked flagstones, bioluminescent grave-moss clinging to wet limestone arches, rusted iron portcullises dripping black silt, and distant echoes of drowned cathedral bells.",
    environmentalLawName: "Rusted Undertow & Claustrophobic Stone",
    environmentalLawEffect:
      "Narrow crypt corridors reward Vanguard shield-blocks (+15% Intercept Guard mitigation), while flooded tiles amplify lightning/crystal shatters and slow unguarded retreats.",
    layouts: [
      {
        id: "ossuary_chokepoint",
        name: "Narrow Ossuary Chokepoint",
        geometrySummary:
          "A three-pace-wide vaulted tunnel lined with skull niches, a rusted overhead chandelier chain, and slick moss flagstones.",
        tacticalHint:
          "Vanguards can lock down the entire corridor width; severing the rusted chain or pinning foes against the wet stone shatters Poise.",
        terrainTags: ["Rusted Chandelier Chain", "Narrow Stone Chokepoint", "Slick Moss Flagstones"],
        favoredRoles: ["VANGUARD", "TACTICIAN"],
      },
      {
        id: "flooded_nave",
        name: "Knee-Deep Brine Basilica",
        geometrySummary:
          "A half-submerged reliquary nave broken by crumbling marble pillars, raised altar steps, and dark underwater grates.",
        tacticalHint:
          "Hold the raised altar steps to avoid brine drag; crystal/arcane blasts conduct across the flooded floor.",
        terrainTags: ["Flooded Brine Floor", "Crumbling Altar Steps", "Broken Marble Pillars"],
        favoredRoles: ["ARCANIST", "VANGUARD"],
      },
      {
        id: "mimic_vault",
        name: "Reliquary Mimic Alcoves",
        geometrySummary:
          "Cross-shaped burial chamber packed with gilded iron coffers, pressure-plate tiles, and shadowed side vents.",
        tacticalHint:
          "Recon scouts can trigger floor pressure-plates onto enemies or blind ambushers from the side vents.",
        terrainTags: ["Spring Pressure Plates", "Shadowed Side Vents", "Iron Coffer Barricades"],
        favoredRoles: ["STRIKER", "TACTICIAN"],
      },
    ],
    regularEnemies: [
      {
        id: "verdant_stalker",
        name: "Verdant Stalker",
        title: "Root-Camouflaged Crypt Predator",
        tier: "COMMON",
        aliases: ["verdant stalker", "stalker", "crypt lynx", "moss stalker"],
        baseHp: 92,
        baseAtk: 18,
        baseDef: 11,
        baseSpd: 17,
        maxPoise: 45,
        weaknesses: ["PIERCE_VITALS", "ASTRAL_ARCANE", "HOLY_PURGE"],
        resistances: ["VENOM_PARALYSIS"],
        visualBrief:
          "Sinewy quadrupedal ambush hunter wrapped in wet grave-moss and thorny subterranean vines that blend seamlessly with sunken stonework.",
        mechanicsSummary:
          "Stalks corridors ahead of direct engagement, circling flanking blind spots until pinned by tentacles, webs, or piercing strikes.",
        intents: [
          {
            id: "blind_spot_pounce",
            label: "Blind-Spot Pounce",
            telegraphText:
              "The Verdant Stalker crouches low in the moss shadows, coiling for a flanking pounce!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.2,
            appliesCondition: "BLEED",
            interruptibleBy: ["PIERCE_VITALS", "CORE_INTERRUPT"],
          },
          {
            id: "spore_vine_snare",
            label: "Thorn-Spore Lash",
            telegraphText:
              "Blighted vines uncoil along the stalker's spine to whip across the frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.0,
            appliesCondition: "POISON",
          },
        ],
      },
      {
        id: "bone_shield_goblin_pack",
        name: "Ossuary Bone-Shield Marauders",
        title: "Floor Scavenger Pack",
        tier: "COMMON",
        aliases: ["bone-shield marauders", "bone shield", "goblin pack", "marauders", "goblins"],
        baseHp: 88,
        baseAtk: 16,
        baseDef: 12,
        baseSpd: 13,
        maxPoise: 45,
        weaknesses: ["BLUNT_STAGGER", "ASTRAL_ARCANE"],
        resistances: ["PIERCE_VITALS"],
        visualBrief: "Hunched crypt goblins interlocking Femur-lashed tower shields and barbed rusted spears.",
        mechanicsSummary: "Raises Bone Phalanx to halve frontal slashes until broken by heavy blunt stagger or arcane AoE.",
        intents: [
          {
            id: "spear_jab",
            label: "Barbed Spear Thrust",
            telegraphText: "The Bone-Shield pack levels rusted spears at the exposed flank!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.0,
            appliesCondition: "BLEED",
          },
          {
            id: "phalanx_ram",
            label: "Interlocked Shield Rush",
            telegraphText: "They lock bone shields together, winding up a heavy corridor charge!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.25,
            poiseGuard: true,
            interruptibleBy: ["BLUNT_STAGGER", "CRYSTAL_SHATTER"],
          },
        ],
      },
      {
        id: "brine_moss_hound",
        name: "Brine-Moss Crypt Hound",
        title: "Scent-Tracking Pack Hunter",
        tier: "COMMON",
        aliases: ["brine-moss hound", "crypt hound", "moss hound"],
        baseHp: 84,
        baseAtk: 17,
        baseDef: 10,
        baseSpd: 16,
        maxPoise: 40,
        weaknesses: ["PIERCE_VITALS", "BLUNT_STAGGER"],
        resistances: ["ASTRAL_ARCANE"],
        visualBrief: "Lean flooded-ossuary hound with exposed rib-plate calcified in luminescent green brine-moss.",
        mechanicsSummary: "Fast initiator that rushes down exposed casters unless intercepted by Vanguard guard.",
        intents: [
          {
            id: "hamstring_snap",
            label: "Hamstring Lunge",
            telegraphText: "The Brine-Moss Hound bares rusted fangs, splashing fast toward your lead leg!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.15,
            appliesCondition: "BLEED",
          },
          {
            id: "drowned_howl",
            label: "Echoing Pack Howl",
            telegraphText: "Brine rattles inside its chest cavity as it inhales for a disorienting tunnel howl!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 0.75,
            appliesCondition: "HEX_WEAKEN",
            interruptibleBy: ["CORE_INTERRUPT", "PIERCE_VITALS"],
          },
        ],
      },
      {
        id: "drowned_reliquary_acolyte",
        name: "Drowned Reliquary Acolyte",
        title: "Silt-Choked Choir Husk",
        tier: "COMMON",
        aliases: ["drowned acolyte", "reliquary acolyte", "choir husk"],
        baseHp: 80,
        baseAtk: 19,
        baseDef: 11,
        baseSpd: 12,
        maxPoise: 40,
        weaknesses: ["HOLY_PURGE", "CORE_INTERRUPT", "PIERCE_VITALS"],
        resistances: ["SHADOW_HEX"],
        visualBrief: "Sodden robed cultist husk swinging a barnacle-encrusted incense censer that bleeds cold grave-brine.",
        mechanicsSummary: "Casts mana-sapping brine bolts from cover; crumbles quickly once closed in on.",
        intents: [
          {
            id: "brine_hex_bolt",
            label: "Silt-Curse Bolt",
            telegraphText: "Black reliquary brine spins around the Acolyte's censer toward your mages!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.15,
            appliesCondition: "MANA_DRAIN",
            interruptibleBy: ["CORE_INTERRUPT", "HOLY_PURGE"],
          },
          {
            id: "rusted_censer_swing",
            label: "Censer Chain Whip",
            telegraphText: "It whips the heavy iron censer chain across the narrow flagstone passage!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.05,
          },
        ],
      },
      {
        id: "carrion_mimic",
        name: "Gilded Reliquary Mimic",
        title: "Elite Ambush Predator",
        tier: "ELITE",
        aliases: ["reliquary mimic", "gilded mimic", "mimic"],
        baseHp: 112,
        baseAtk: 21,
        baseDef: 14,
        baseSpd: 15,
        maxPoise: 55,
        weaknesses: ["PIERCE_VITALS", "VENOM_PARALYSIS", "CORE_INTERRUPT"],
        resistances: ["BLUNT_STAGGER"],
        visualBrief: "An ornate iron chest split into rows of scrimshawed fangs and lashing abyssal tongues.",
        mechanicsSummary: "Attempts to grapple the lowest-HP unit unless blinded or pinned mid-lunge.",
        intents: [
          {
            id: "tongue_snare",
            label: "Devouring Maw Lunge",
            telegraphText: "The Mimic's iron lid snaps wide, aiming its barbed tongue at your most vulnerable ally!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.35,
            appliesCondition: "STUN",
            interruptibleBy: ["PIERCE_VITALS", "VENOM_PARALYSIS"],
          },
          {
            id: "iron_slam",
            label: "Coffer Crunch",
            telegraphText: "The Mimic rears up to slam its heavy iron hull onto the frontline!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.15,
          },
        ],
      },
      {
        id: "rusted_crown_revenant",
        name: "Rusted-Crown Crypt Knight",
        title: "Elite Fallen Party Corpse-Guard",
        tier: "ELITE",
        aliases: ["crypt knight", "rusted-crown crypt knight", "revenant knight"],
        baseHp: 128,
        baseAtk: 22,
        baseDef: 16,
        baseSpd: 11,
        maxPoise: 65,
        weaknesses: ["HOLY_PURGE", "BLUNT_STAGGER"],
        resistances: ["PIERCE_VITALS", "VENOM_PARALYSIS"],
        visualBrief: "Waterlogged plate-armored corpse of an old rookie squad leader dragging a notched claymore.",
        mechanicsSummary: "Resistant to ordinary slashes; Holy Purge and blunt strikes crack its rusted breastplate.",
        intents: [
          {
            id: "grave_cleave",
            label: "Notched Claymore Sweep",
            telegraphText: "The Crypt Knight drags its claymore across the stone, winding up a wide cleave!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.3,
            appliesCondition: "BLEED",
          },
          {
            id: "drowned_wail",
            label: "Miasma Exhale",
            telegraphText: "Black brine froths through its visor as it prepares a mana-sapping corpse shriek!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 0.85,
            appliesCondition: "MANA_DRAIN",
            interruptibleBy: ["HOLY_PURGE", "CORE_INTERRUPT"],
          },
        ],
      },
      {
        id: "sunken_bell_executioner",
        name: "Sunken Bell-Executioner",
        title: "Elite Toll-Keeper of the Drowned Nave",
        tier: "ELITE",
        aliases: ["bell-executioner", "sunken bell", "executioner"],
        baseHp: 140,
        baseAtk: 24,
        baseDef: 17,
        baseSpd: 10,
        maxPoise: 75,
        weaknesses: ["HOLY_PURGE", "CORE_INTERRUPT", "ASTRAL_ARCANE"],
        resistances: ["BLUNT_STAGGER", "VENOM_PARALYSIS"],
        visualBrief: "Seven-foot brass-helmed revenant dragging a cracked cathedral bell fused to an executioner's poleaxe.",
        mechanicsSummary: "Slow but lethal shockwave tolls; Poise cracks sharply when hit by Core Interrupt or Arcane shock.",
        intents: [
          {
            id: "resonant_bell_cleaver",
            label: "Resonant Bell-Cleaver",
            telegraphText: "The Executioner swings its bronze bell-halberd overhead in a slow, bone-crushing arc!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.4,
            appliesCondition: "STUN",
          },
          {
            id: "deafening_knell",
            label: "Deafening Drowned Knell",
            telegraphText: "CRITICAL TELEGRAPH: Its helmet bell begins humming with sub-aqueous shockwaves!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.15,
            appliesCondition: "HEX_WEAKEN",
            interruptibleBy: ["CORE_INTERRUPT", "ASTRAL_ARCANE"],
          },
        ],
      },
    ],
    bossByFloor: {
      10: {
        id: "boss_f10_hollow_king",
        name: "Aldric, the Hollow King",
        title: "Floor 10 Gate Boss • Sovereign of Rusted Oaths",
        isBoss: true,
        baseHp: 240,
        baseAtk: 28,
        baseDef: 18,
        baseSpd: 14,
        maxPoise: 100,
        weaknesses: ["HOLY_PURGE", "BLUNT_STAGGER", "CORE_INTERRUPT"],
        resistances: ["VENOM_PARALYSIS", "SHADOW_HEX"],
        visualBrief:
          "Twelve-foot revenant monarch draped in sodden funeral chains, wielding a crackedexecutioner greatsword pulsing with pale grave-fire.",
        mechanicsSummary:
          "Telegraphs 'Decree of Ash' room-wide cleave every 3rd exchange unless his exposed sternum rib-lantern is shattered or parried by a Vanguard.",
        intents: [
          {
            id: "royal_execution",
            label: "Greatsword Guillotine",
            telegraphText: "Aldric raises his rusted greatsword overhead, locking onto your frontline anchor!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.5,
            appliesCondition: "BLEED",
          },
          {
            id: "decree_of_ash",
            label: "Decree of Ash (Lethal Gate Cleave)",
            telegraphText: "CRITICAL TELEGRAPH: Pale grave-fire floods Aldric's rib-lantern—he is charging 'Decree of Ash' across the entire chamber!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.75,
            interruptibleBy: ["CORE_INTERRUPT", "HOLY_PURGE", "BLUNT_STAGGER"],
          },
        ],
      },
      20: {
        id: "boss_f20_charybdis",
        name: "Charybdis, the Choir Leviathan",
        title: "Floor 20 Gate Boss • Drowned Basilica Warden",
        isBoss: true,
        baseHp: 340,
        baseAtk: 34,
        baseDef: 21,
        baseSpd: 16,
        maxPoise: 120,
        weaknesses: ["PIERCE_VITALS", "CRYSTAL_SHATTER", "ASTRAL_ARCANE"],
        resistances: ["VENOM_PARALYSIS", "SHADOW_HEX"],
        visualBrief:
          "Multi-headed abyssal brine serpent coiled around the sunken basilica bell-tower, singing a hypnotic choir hymn.",
        mechanicsSummary:
          "Channels 'Drowning Aria' to flood the arena unless interrupted via the central bell-chain or high-burst arcane/crystal shatter.",
        intents: [
          {
            id: "brine_fang_snap",
            label: "Twin-Headed Fang Snap",
            telegraphText: "Two serpent necks whip low across the flooded pillars toward the vanguard!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.35,
            appliesCondition: "POISON",
          },
          {
            id: "drowning_aria",
            label: "Drowning Aria (Tidal Surge)",
            telegraphText: "CRITICAL TELEGRAPH: Charybdis inhales deeply beneath the rusted bell-chain to unleash 'Drowning Aria'!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.8,
            appliesCondition: "MANA_DRAIN",
            interruptibleBy: ["CORE_INTERRUPT", "CRYSTAL_SHATTER", "ASTRAL_ARCANE"],
          },
        ],
      },
      25: {
        id: "boss_f25_stratum_warden",
        name: "Sluice-Gate Warden Velk",
        title: "Floor 25 Stratum Threshold Guardian",
        isBoss: true,
        isThresholdGuardian: true,
        baseHp: 390,
        baseAtk: 37,
        baseDef: 24,
        baseSpd: 17,
        maxPoise: 130,
        weaknesses: ["HOLY_PURGE", "CRYSTAL_SHATTER", "VENOM_PARALYSIS"],
        resistances: ["BLUNT_STAGGER", "PIERCE_VITALS"],
        visualBrief:
          "Half-submerged brass-and-bone colossus sealing the great vertical lift from the Sunken Reliquary up into the Chronos Foundry.",
        mechanicsSummary:
          "Guards the Floor 25 Threshold Sanctum seal; breaking its pressure-valve core opens Tier II (The Chronos Foundry).",
        intents: [
          {
            id: "anchor_crush",
            label: "Drowned Anchor Smash",
            telegraphText: "Warden Velk swings its barnacle-encrusted iron anchor at your lead fighter!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.55,
            appliesCondition: "STUN",
          },
          {
            id: "boiling_sluice",
            label: "Scalding Sluice Vent",
            telegraphText: "Foundry steam hisses from the ceiling lift as Velk vents scalding brine across the hall!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.4,
            interruptibleBy: ["CORE_INTERRUPT", "CRYSTAL_SHATTER"],
          },
        ],
      },
    },
  },

  // =========================================================================
  // TIER II: FLOORS 26–50 — THE CHRONOS FOUNDRY & CINDER CLOCKWORK
  // =========================================================================
  {
    id: "CHRONOS_FOUNDRY",
    tierNumber: 2,
    floorRangeLabel: "Floors 26–50",
    minFloor: 26,
    maxFloor: 50,
    name: "The Chronos Foundry & Cinder Clockwork",
    subtitle: "Pendulum gear-chasms, molten glass conduits & the Floor 40 Memory Horizon",
    accentColor: "amber",
    backgroundUrl: "/backgrounds/starfall-labyrinth/chronos_foundry.jpg",
    atmosphereSensory:
      "Deafening rhythmic ticks of cathedral-sized brass escapement gears, waves of dry furnace heat rising from molten glass channels, ozone sparks, and copper dust glittering in amber shaft-light.",
    environmentalLawName: "Temporal Pendulum Cadence",
    environmentalLawEffect:
      "Every odd-numbered combat round accelerates SPD/Crit checks (+12%), while mechanical constructs rewind minor damage unless their pendulum cores are pinned or shattered.",
    layouts: [
      {
        id: "pendulum_catwalk",
        name: "Swinging Pendulum Gear-Bridge",
        geometrySummary:
          "A suspended brass catwalk spanning an abyssal gear-shaft where razor pendulums sweep across marked notches.",
        tacticalHint:
          "Knockbacks, Damascus chains, and timing callouts can shove clockwork sentries directly into swinging pendulums!",
        terrainTags: ["Swinging Brass Pendulums", "Elevated Gear Catwalk", "Unfenced Drop Chasm"],
        favoredRoles: ["TACTICIAN", "STRIKER"],
      },
      {
        id: "molten_glass_conduit",
        name: "Molten Mirror Smeltery",
        geometrySummary:
          "Tiered iron Crucible walkways flanked by glowing channels of liquid glass and pressurized steam valves.",
        tacticalHint:
          "Cracking steam valves blinds ranged inquisitors; blunt impacts shatter heat-brittle crystal/glass plating.",
        terrainTags: ["Pressurized Steam Valves", "Molten Slag Channels", "Heat-Brittle Glass Scaffolds"],
        favoredRoles: ["STRIKER", "ARCANIST"],
      },
      {
        id: "escapement_rotunda",
        name: "Chronos Escapement Rotunda",
        geometrySummary:
          "A rotating circular dial arena whose outer brass rings shift cover pillars every turn.",
        tacticalHint:
          "Fast Blink/Whisper-Trail strikers excel at crossing rotating rings to snipe backline arcanist cores.",
        terrainTags: ["Rotating Dial Floor", "Copper Lightning Rods", "Clockwork Cover Pylons"],
        favoredRoles: ["ARCANIST", "VANGUARD"],
      },
    ],
    regularEnemies: [
      {
        id: "slag_jaw_clockwork_hound",
        name: "Slag-Jaw Clockwork Hound",
        title: "Furnace Patrol Automaton",
        tier: "COMMON",
        aliases: ["clockwork hound", "slag-jaw hound", "brass hound"],
        baseHp: 145,
        baseAtk: 28,
        baseDef: 18,
        baseSpd: 21,
        maxPoise: 60,
        weaknesses: ["BLUNT_STAGGER", "CORE_INTERRUPT"],
        resistances: ["VENOM_PARALYSIS"],
        visualBrief: "Quadrupedal blackened-brass hunting construct venting ember sparks between jagged saw-teeth.",
        mechanicsSummary: "Fast pack skirmisher that locks onto flanking strikers unless shattered with blunt force.",
        intents: [
          {
            id: "cinder_bite",
            label: "Superheated Fang Snap",
            telegraphText: "The Clockwork Hound's furnace jaw glows white-hot as it darts for an open ankle!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.15,
            appliesCondition: "BLEED",
          },
          {
            id: "gear_sprint",
            label: "Spring-Coiled Pounce",
            telegraphText: "Coiled torsion springs whine loudly before it catapults across the catwalk!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.25,
            interruptibleBy: ["BLUNT_STAGGER", "CORE_INTERRUPT"],
          },
        ],
      },
      {
        id: "cinder_glass_drone",
        name: "Cinder-Glass Surveillance Drone",
        title: "Clockwork Spotter Unit",
        tier: "COMMON",
        aliases: ["surveillance drone", "cinder-glass drone", "clockwork drone"],
        baseHp: 132,
        baseAtk: 30,
        baseDef: 16,
        baseSpd: 22,
        maxPoise: 55,
        weaknesses: ["CRYSTAL_SHATTER", "PIERCE_VITALS", "CORE_INTERRUPT"],
        resistances: ["ASTRAL_ARCANE"],
        visualBrief: "Spinning brass gyroscope eye trailing molten glass filaments through gear-shaft updrafts.",
        mechanicsSummary: "Paints priority targets with optical flares until pierced or shattered.",
        intents: [
          {
            id: "optical_scorch",
            label: "Focused Optical Beam",
            telegraphText: "The hovering drone aligns a razor filament beam at your backline support!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.2,
          },
          {
            id: "steam_flash",
            label: "Overpressure Flare",
            telegraphText: "Valves shriek open around the gyroscope for a blinding heat flash!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.1,
            appliesCondition: "HEX_WEAKEN",
            interruptibleBy: ["CRYSTAL_SHATTER", "PIERCE_VITALS"],
          },
        ],
      },
      {
        id: "time_stutter_automaton",
        name: "Time-Stutter Automaton",
        title: "Elite Chronos Sentinel",
        tier: "ELITE",
        aliases: ["time-stutter automaton", "chronos sentinel", "brass automaton"],
        baseHp: 175,
        baseAtk: 31,
        baseDef: 22,
        baseSpd: 18,
        maxPoise: 80,
        weaknesses: ["CORE_INTERRUPT", "BLUNT_STAGGER", "CRYSTAL_SHATTER"],
        resistances: ["VENOM_PARALYSIS", "PIERCE_VITALS"],
        visualBrief: "Porcelain-and-brass clockwork knight with an inverted glowing hourglass spinning inside its chest.",
        mechanicsSummary: "Attempts to rewind 20% HP if left un-staggered when winding its chest spring.",
        intents: [
          {
            id: "halberd_tick",
            label: "Clockwork Halberd Double-Slash",
            telegraphText: "The Automaton's gears click twice—jumping forward for a rapid twin halberd slash!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.25,
          },
          {
            id: "rewind_spring",
            label: "Three-Second Temporal Rewind",
            telegraphText: "Its chest hourglass spins backward to mend hull damage and empower its next strike!",
            targetMode: "SELF_BUFF",
            damageMultiplier: 0,
            appliesCondition: "TIME_REWIND",
            interruptibleBy: ["CORE_INTERRUPT", "BLUNT_STAGGER", "PIERCE_VITALS"],
          },
        ],
      },
      {
        id: "brass_inquisitor",
        name: "Cinder-Glass Inquisitor",
        title: "Elite Anti-Mana Artillery Construct",
        tier: "ELITE",
        aliases: ["cinder-glass inquisitor", "brass inquisitor", "glass inquisitor"],
        baseHp: 155,
        baseAtk: 35,
        baseDef: 18,
        baseSpd: 15,
        maxPoise: 70,
        weaknesses: ["PIERCE_VITALS", "SHADOW_HEX"],
        resistances: ["ASTRAL_ARCANE", "VENOM_PARALYSIS"],
        visualBrief: "Floating tri-lens brass prism firing concentrated molten light beams that burn MP.",
        mechanicsSummary: "Targets high-MP casters with silence/drain rays unless hexed or flanked.",
        intents: [
          {
            id: "prism_lance",
            label: "Molten Refraction Beam",
            telegraphText: "All three glass lenses converge on your backline/frontline caster!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.35,
            appliesCondition: "MANA_DRAIN",
          },
          {
            id: "slag_flare",
            label: "Furnace Flashburst",
            telegraphText: "White-hot furnace light builds inside the prism to scorch the entire frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.2,
            interruptibleBy: ["SHADOW_HEX", "CRYSTAL_SHATTER"],
          },
        ],
      },
      {
        id: "molten_crucible_golem",
        name: "Molten Crucible Golem",
        title: "Elite Foundry Furnace Juggernaut",
        tier: "ELITE",
        aliases: ["crucible golem", "molten golem"],
        baseHp: 210,
        baseAtk: 34,
        baseDef: 25,
        baseSpd: 12,
        maxPoise: 95,
        weaknesses: ["CRYSTAL_SHATTER", "ASTRAL_ARCANE", "CORE_INTERRUPT"],
        resistances: ["PIERCE_VITALS", "BLUNT_STAGGER"],
        visualBrief: "Heavy slag-iron colossus dripping liquid gold through bolted furnace grates.",
        mechanicsSummary: "Shrugs off physical blows until crystal shatter or astral chill cools its molten core.",
        intents: [
          {
            id: "slag_sweep",
            label: "Ladle Hammer Cleave",
            telegraphText: "The Golem hefts a white-hot iron ladle toward the frontline ranks!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.35,
          },
          {
            id: "furnace_vent",
            label: "Crucible Spillover",
            telegraphText: "Bolts hiss across its chest hatch—liquid slag is about to erupt across the arena!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.25,
            interruptibleBy: ["CRYSTAL_SHATTER", "CORE_INTERRUPT"],
          },
        ],
      },
    ],
    bossByFloor: {
      30: {
        id: "boss_f30_orpheon",
        name: "Orpheon, Warden of Stopped Hours",
        title: "Floor 30 Gate Boss • Twin-Scythed Clockwork Seraph",
        isBoss: true,
        baseHp: 480,
        baseAtk: 42,
        baseDef: 26,
        baseSpd: 22,
        maxPoise: 145,
        weaknesses: ["CORE_INTERRUPT", "BLUNT_STAGGER", "SHADOW_HEX"],
        resistances: ["VENOM_PARALYSIS", "PIERCE_VITALS"],
        visualBrief: "Six-winged brass seraph wielding minute-and-hour scythes above the Escapement Throne.",
        mechanicsSummary: "Freezes high-rarity units in temporal glass unless a low-star/agile ally shatters the inverse hourglass.",
        intents: [
          {
            id: "pendulum_reap",
            label: "Twin-Hand Scythe Cross",
            telegraphText: "Orpheon crosses both clock-hand scythes in a supersonic arc toward the frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.45,
            appliesCondition: "BLEED",
          },
          {
            id: "stopped_hour",
            label: "Stasis Glass Prison",
            telegraphText: "CRITICAL TELEGRAPH: Twelve chimes toll—Orpheon raises the Inverse Hourglass to shatter frozen glass across the squad!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.85,
            appliesCondition: "STUN",
            interruptibleBy: ["CORE_INTERRUPT", "BLUNT_STAGGER"],
          },
        ],
      },
      40: {
        id: "boss_f40_ignis_zero",
        name: "Ignis-Zero, the Cinder Colossus",
        title: "Floor 40 Gate Boss • End of Pre-Isekai Ranker Memory",
        isBoss: true,
        baseHp: 620,
        baseAtk: 49,
        baseDef: 31,
        baseSpd: 17,
        maxPoise: 170,
        weaknesses: ["CRYSTAL_SHATTER", "PIERCE_VITALS", "ASTRAL_ARCANE"],
        resistances: ["SHADOW_HEX", "VENOM_PARALYSIS"],
        visualBrief:
          "Towering obsidian-and-molten-gold furnace titan standing before the sealed Floor 41 Abyssal Lift—the exact ceiling of your past-life server clears.",
        mechanicsSummary:
          "Superheats the arena floor each phase; cracking its cooling conduits drops its armor by 40%.",
        intents: [
          {
            id: "crucible_fist",
            label: "Molten Anvil Fist",
            telegraphText: "Ignis-Zero drives a white-hot crucible fist straight down at your lead defender!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.65,
          },
          {
            id: "horizon_meltdown",
            label: "Cinder Horizon Eruption",
            telegraphText: "CRITICAL TELEGRAPH: Ignis-Zero vents its furnace heart—molten glass rises across the entire gallery!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.9,
            interruptibleBy: ["CRYSTAL_SHATTER", "ASTRAL_ARCANE", "CORE_INTERRUPT"],
          },
        ],
      },
      50: {
        id: "boss_f50_krona",
        name: "Arch-Mechanist Krona, Sovereign of the Unwound Sun",
        title: "Floor 50 Half-Tower Sovereign Boss",
        isBoss: true,
        isThresholdGuardian: true,
        baseHp: 760,
        baseAtk: 55,
        baseDef: 34,
        baseSpd: 24,
        maxPoise: 195,
        weaknesses: ["SHADOW_HEX", "VENOM_PARALYSIS", "CORE_INTERRUPT"],
        resistances: ["BLUNT_STAGGER", "HOLY_PURGE"],
        visualBrief:
          "Ancient cyber-alchemical sovereign fused into a miniature dying brass sun-engine that bridges the Foundry and the Blood-Moon Eclipse.",
        mechanicsSummary:
          "Alternates solar overdrive blasts with time-stutter clones; defeating her unlocks Tier III (The Eclipse Sanctum).",
        intents: [
          {
            id: "unwound_ray",
            label: "Helios Gear Barrage",
            telegraphText: "Krona's orbiting brass rings align to rake the frontline with concentrated sunfire!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.55,
          },
          {
            id: "eclipse_collapse",
            label: "Zero-Hour Collapse",
            telegraphText: "CRITICAL TELEGRAPH: The Unwound Sun turns pitch-violet as Krona compresses a room-wide singularity!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 2.0,
            interruptibleBy: ["SHADOW_HEX", "CORE_INTERRUPT"],
          },
        ],
      },
    },
  },

  // =========================================================================
  // TIER III: FLOORS 51–75 — THE ECLIPSE SANCTUM & BLOOD-MOON COURTS
  // =========================================================================
  {
    id: "ECLIPSE_SANCTUM",
    tierNumber: 3,
    floorRangeLabel: "Floors 51–75",
    minFloor: 51,
    maxFloor: 75,
    name: "The Eclipse Sanctum & Blood-Moon Courts",
    subtitle: "Uncharted territory beyond memory: mirror cloisters, undying ember phantoms & crimson trials",
    accentColor: "rose",
    backgroundUrl: "/backgrounds/starfall-labyrinth/eclipse_sanctum.jpg",
    atmosphereSensory:
      "Crimson moonlight bleeding through shattered gothic stained glass, black obsidian mirrors reflecting distorted memories, flickering green-and-ember cathedral bonfires, and an oppressive hush beyond any ranker's guide.",
    environmentalLawName: "Uncharted Eclipse Veil",
    environmentalLawEffect:
      "Beyond Floor 40 Ranker Memory: enemy telegraphs require keen recon/true-sight, while dark/eclipse foes take +25% bonus damage from Holy Purge, Purging Blades, and Black Sun Negative Mana.",
    layouts: [
      {
        id: "mirror_cloister",
        name: "Non-Euclidean Mirror Cloister",
        geometrySummary:
          "Gothic colonnade of towering black-silver mirrors that spawn reflection angles and mask flanking strikes.",
        tacticalHint:
          "True-sight and sonokinetic/vibration senses pierce mirror illusions instantly; shattering mirrors showers razor glass.",
        terrainTags: ["Obsidian Illusion Mirrors", "Crimson Stained-Glass Alcoves", "Shattered Balustrade"],
        favoredRoles: ["ARCANIST", "TACTICIAN"],
      },
      {
        id: "undying_cathedral",
        name: "Buried Bonfire Cathedral",
        geometrySummary:
          "Ruined gothic sanctuary centered around an eerie unextinguishable ember bonfire surrounded by ash-covered pews.",
        tacticalHint:
          "Snuffing or hex-sealing the central ember altar stops undead guardians from rekindling their Poise!",
        terrainTags: ["Ashen Cathedral Bonfire", "Collapsed Stone Pews", "Sanctuary Bell Rope"],
        favoredRoles: ["STRIKER", "VANGUARD"],
      },
    ],
    regularEnemies: [
      {
        id: "blood_moon_chalice_thrall",
        name: "Blood-Moon Chalice Thrall",
        title: "Crimson Sanctuary Acolyte",
        tier: "COMMON",
        aliases: ["chalice thrall", "blood-moon thrall", "crimson acolyte"],
        baseHp: 205,
        baseAtk: 41,
        baseDef: 22,
        baseSpd: 20,
        maxPoise: 80,
        weaknesses: ["HOLY_PURGE", "PIERCE_VITALS"],
        resistances: ["SHADOW_HEX"],
        visualBrief: "Crimson-veiled basilica penitent swinging a silver incense thurible brimming with boiling blood-wine.",
        mechanicsSummary: "Feeds healing rituals across neighboring monsters unless purged or sniped early.",
        intents: [
          {
            id: "sanguine_whip",
            label: "Consecrated Blood Lash",
            telegraphText: "The Chalice Thrall whips a ribbon of scalding scarlet nectar toward your frontline!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.25,
            appliesCondition: "BLEED",
          },
          {
            id: "crimson_litany",
            label: "Chalice Leech Litany",
            telegraphText: "The thrall lifts the overflowing chalice to siphon vitality from the wounded!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.15,
            appliesCondition: "HEX_WEAKEN",
            interruptibleBy: ["HOLY_PURGE", "CORE_INTERRUPT"],
          },
        ],
      },
      {
        id: "mirror_shard_wraith",
        name: "Mirror-Shard Wraith",
        title: "Refracted Cloister Stalker",
        tier: "COMMON",
        aliases: ["mirror wraith", "mirror-shard wraith", "shard wraith"],
        baseHp: 190,
        baseAtk: 45,
        baseDef: 19,
        baseSpd: 26,
        maxPoise: 75,
        weaknesses: ["CRYSTAL_SHATTER", "BLUNT_STAGGER", "ASTRAL_ARCANE"],
        resistances: ["PIERCE_VITALS"],
        visualBrief: "Translucent phantom whose ribcage and limbs are stitched from razor silver-glass mirror slivers.",
        mechanicsSummary: "Blinks between mirror frames; blunt stagger and crystal shatter crack its glass shell.",
        intents: [
          {
            id: "glass_backstab",
            label: "Mirror-Step Slash",
            telegraphText: "Silver reflection shards flutter behind your striker's blind spot!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.35,
            appliesCondition: "BLEED",
          },
          {
            id: "refracted_glare",
            label: "Shattered Kaleidoscope",
            telegraphText: "Mirror fragments swirl in midair to tear across the frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.2,
            interruptibleBy: ["CRYSTAL_SHATTER", "BLUNT_STAGGER"],
          },
        ],
      },
      {
        id: "undying_ember_knight",
        name: "Ashen Cathedral Vengeful Knight",
        title: "Elite Undying Bonfire Phantom",
        tier: "ELITE",
        aliases: ["ashen knight", "vengeful knight", "ember knight"],
        baseHp: 245,
        baseAtk: 44,
        baseDef: 28,
        baseSpd: 21,
        maxPoise: 105,
        weaknesses: ["SHADOW_HEX", "HOLY_PURGE", "CRYSTAL_SHATTER"],
        resistances: ["BLUNT_STAGGER", "VENOM_PARALYSIS"],
        visualBrief: "Faceless soot-stained knight wreathed in unquenchable orange-red cathedral cinders that refuse to die.",
        mechanicsSummary: "Inspired by legends of the Undying Faraam—uses 'Shining Light' flash-steps and rekindles HP once unless cursed by Hex Seals or Holy Purge.",
        intents: [
          {
            id: "shining_flash_cut",
            label: "Shining-Light Flash Slash",
            telegraphText: "Cinders swirl around the phantom knight as it blurs into a blinding light-speed lunge!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.45,
          },
          {
            id: "blessing_of_fire",
            label: "Undying Ember Shockwave",
            telegraphText: "The knight drives its blade into the ash, erupting a searing crimson shockwave across the frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.35,
            interruptibleBy: ["SHADOW_HEX", "HOLY_PURGE"],
          },
        ],
      },
      {
        id: "star_ash_doppelganger",
        name: "Star-Ash Mirror Doppelganger",
        title: "Elite Eclipse Memory Mimic",
        tier: "ELITE",
        aliases: ["mirror doppelganger", "star-ash doppelganger", "doppelganger"],
        baseHp: 220,
        baseAtk: 47,
        baseDef: 24,
        baseSpd: 25,
        maxPoise: 95,
        weaknesses: ["VENOM_PARALYSIS", "PIERCE_VITALS", "ASTRAL_ARCANE"],
        resistances: ["SHADOW_HEX", "BLUNT_STAGGER"],
        visualBrief: "Mercurial silver-black silhouette wearing the cracked faces and weapons of fallen gacha heroes.",
        mechanicsSummary: "High evasion and crit rate; neurotoxin paralysis and true-sight shatter its form.",
        intents: [
          {
            id: "mirrored_fang",
            label: "Echoed Signature Assassination",
            telegraphText: "The Doppelganger mirrors your striker's stance, aiming directly for your most wounded teammate!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.5,
            appliesCondition: "BLEED",
          },
          {
            id: "eclipse_hex",
            label: "Blood-Moon Despair Choir",
            telegraphText: "Whispers of the Memorial Wall echo from the mirrors, draining squad defenses!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.0,
            appliesCondition: "HEX_WEAKEN",
            interruptibleBy: ["HOLY_PURGE", "ASTRAL_ARCANE"],
          },
        ],
      },
      {
        id: "weeping_gargoyle_sentinel",
        name: "Weeping Gargoyle Sentinel",
        title: "Elite Crimson Cloister Guardian",
        tier: "ELITE",
        aliases: ["gargoyle sentinel", "weeping gargoyle"],
        baseHp: 265,
        baseAtk: 46,
        baseDef: 31,
        baseSpd: 18,
        maxPoise: 115,
        weaknesses: ["BLUNT_STAGGER", "HOLY_PURGE", "CRYSTAL_SHATTER"],
        resistances: ["PIERCE_VITALS", "VENOM_PARALYSIS"],
        visualBrief: "Obsidian-and-verdigris winged cathedral statue crying hot mercury tears.",
        mechanicsSummary: "Stone carapace resists piercing cuts; heavy blunt impacts and Holy Purge fracture its wings.",
        intents: [
          {
            id: "obsidian_dive",
            label: "Cloister Wing Smash",
            telegraphText: "The Gargoyle flares stone wings above the colonnade to crush the vanguard!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.4,
            appliesCondition: "STUN",
          },
          {
            id: "mercury_wail",
            label: "Quicksilver Petrify Tears",
            telegraphText: "Molten mercury mist sprays across the chamber unless interrupted!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.15,
            appliesCondition: "MANA_DRAIN",
            interruptibleBy: ["BLUNT_STAGGER", "CORE_INTERRUPT"],
          },
        ],
      },
    ],
    bossByFloor: {
      60: {
        id: "boss_f60_noctis_vey",
        name: "Noctis-Vey, the Mirror Martyr",
        title: "Floor 60 Gate Boss • Prelate of Fractured Selves",
        isBoss: true,
        baseHp: 880,
        baseAtk: 58,
        baseDef: 36,
        baseSpd: 26,
        maxPoise: 210,
        weaknesses: ["HOLY_PURGE", "PIERCE_VITALS", "SHADOW_HEX"],
        resistances: ["ASTRAL_ARCANE", "BLUNT_STAGGER"],
        visualBrief: "Weeping silver-masked arch-prelate suspended between seven floating obsidian mirrors.",
        mechanicsSummary: "Reflects raw frontal spells until the true bleeding mirror is identified and cracked.",
        intents: [
          {
            id: "glass_crucifix",
            label: "Sevenfold Mirror Lance",
            telegraphText: "Seven mirrors flash crimson in unison, converging razor beams on the vanguard!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.55,
          },
          {
            id: "shattered_liturgy",
            label: "Liturgy of the Discarded",
            telegraphText: "CRITICAL TELEGRAPH: Noctis-Vey raises the Bleeding Chalice to shatter every mirror in the cathedral!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.95,
            appliesCondition: "BLEED",
            interruptibleBy: ["PIERCE_VITALS", "HOLY_PURGE"],
          },
        ],
      },
      70: {
        id: "boss_f70_vesper",
        name: "Vesper, the Crimson Lancer",
        title: "Floor 70 Contested Gate • Kaiser Valdane's 5★ Apex Champion",
        isBoss: true,
        baseHp: 1020,
        baseAtk: 66,
        baseDef: 39,
        baseSpd: 30,
        maxPoise: 230,
        weaknesses: ["CORE_INTERRUPT", "VENOM_PARALYSIS", "BLUNT_STAGGER"],
        resistances: ["SHADOW_HEX", "ASTRAL_ARCANE"],
        visualBrief:
          "Aurelle's ruthless 5★ dark mirror clad in blood-crimson valkyrie plate, wielding a sacrificial spear Empowered by Kaiser Valdane's Command Seals.",
        mechanicsSummary:
          "Relentless single-target boss-killer; Vanguard Intercept Swaps and coordinated Poise breaks are essential to deny her lethal 'Crimson Culling' thrust.",
        intents: [
          {
            id: "valkyrie_rend",
            label: "Sacrificial Spear Flurry",
            telegraphText: "Vesper's crimson lance blurs three times toward your frontline!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.65,
            appliesCondition: "BLEED",
          },
          {
            id: "crimson_culling",
            label: "Command Seal: Crimson Culling",
            telegraphText: "CRITICAL TELEGRAPH: Kaiser's red Command Seal brands Vesper's brow—she vaults skyward to impale your lowest-HP comrade!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 2.15,
            interruptibleBy: ["CORE_INTERRUPT", "BLUNT_STAGGER", "VENOM_PARALYSIS"],
          },
        ],
      },
      75: {
        id: "boss_f75_malakor",
        name: "Malakor, Sovereign of the Eclipsed Star",
        title: "Floor 75 Stratum Threshold Sovereign",
        isBoss: true,
        isThresholdGuardian: true,
        baseHp: 1150,
        baseAtk: 70,
        baseDef: 42,
        baseSpd: 27,
        maxPoise: 250,
        weaknesses: ["HOLY_PURGE", "ASTRAL_ARCANE", "SHADOW_HEX"],
        resistances: ["VENOM_PARALYSIS", "PIERCE_VITALS"],
        visualBrief: "Crowned abyssal seraph cradling a miniature black eclipse sun before the final Astral Spire lift.",
        mechanicsSummary: "Seals healing unless cleansed or staggered; clearing Floor 75 unlocks Tier IV (The Astral Singularity).",
        intents: [
          {
            id: "black_corona",
            label: "Black Corona Sweep",
            telegraphText: "Negative-colored corona flames whip across the frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.6,
            appliesCondition: "HEX_WEAKEN",
          },
          {
            id: "total_eclipse",
            label: "Total Star Eclipse",
            telegraphText: "CRITICAL TELEGRAPH: All light dies in the court as Malakor unleashes 'Total Star Eclipse'!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 2.1,
            interruptibleBy: ["HOLY_PURGE", "ASTRAL_ARCANE"],
          },
        ],
      },
    },
  },

  // =========================================================================
  // TIER IV: FLOORS 76–100 — THE ASTRAL SINGULARITY & ADMINISTRATOR'S SPIRE
  // =========================================================================
  {
    id: "ASTRAL_SINGULARITY",
    tierNumber: 4,
    floorRangeLabel: "Floors 76–100",
    minFloor: 76,
    maxFloor: 100,
    name: "The Astral Singularity & Administrator's Spire",
    subtitle: "Zero-gravity starlight causeways, raw system-code monoliths & Floor 100's Star Gate Throne",
    accentColor: "indigo",
    backgroundUrl: "/backgrounds/starfall-labyrinth/astral_singularity.jpg",
    atmosphereSensory:
      "Shattered crystal walkways suspended in cosmic indigo void directly beneath the cracked glass sky of the Master's Console, silver system-code glyphs raining upward, and humming constellations of raw Star Shards.",
    environmentalLawName: "Rarity Inversion & Raw System Resonance",
    environmentalLawEffect:
      "Awakened bonds defy system limits: units who rose from 1★–3★ gain +20% all-stat resonance against System Arbiters, while uncountered Arbiter decrees drain MP.",
    layouts: [
      {
        id: "starlight_causeway",
        name: "Fractured Starlight Causeway",
        geometrySummary:
          "Floating white-obsidian prism tiles drifting through low-gravity astral void between silver obelisks.",
        tacticalHint:
          "Low gravity extends leaps, Whisper-Trail dashes, and ranged crystal/arcane volleys across void gaps.",
        terrainTags: ["Zero-G Prism Tiles", "Silver System Obelisks", "Astral Void Rift"],
        favoredRoles: ["ARCANIST", "STRIKER", "TACTICIAN"],
      },
      {
        id: "furnace_conduit_core",
        name: "Synthesis Core Conduit",
        geometrySummary:
          "Concentric silver rings surrounding raw conduits of compressed Star Shards and discarded hero echoes.",
        tacticalHint:
          "Shattering a Star-Shard conduit floods the squad with emergency MP and cracks Arbiter shields.",
        terrainTags: ["Star-Shard Conduits", "Gravity Anchor Rings", "Glass-Sky Fracture"],
        favoredRoles: ["VANGUARD", "TACTICIAN"],
      },
    ],
    regularEnemies: [
      {
        id: "null_light_choir_thrall",
        name: "Null-Light Choir Thrall",
        title: "Fractured Star-Code Husk",
        tier: "COMMON",
        aliases: ["null-light thrall", "choir thrall", "star-code husk"],
        baseHp: 280,
        baseAtk: 56,
        baseDef: 32,
        baseSpd: 26,
        maxPoise: 105,
        weaknesses: ["ASTRAL_ARCANE", "CORE_INTERRUPT", "PIERCE_VITALS"],
        resistances: ["HOLY_PURGE"],
        visualBrief: "Translucent silver-indigo silhouette whose limbs dissolve into drifting Covenant hex-glyphs.",
        mechanicsSummary: "Swarms low-star formations with system static bolts until core-interrupted.",
        intents: [
          {
            id: "glyph_volley",
            label: "Null-Code Shard Volley",
            telegraphText: "Ascending silver runes sharpen into needles aimed across your vanguard!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.25,
          },
          {
            id: "static_siphon",
            label: "Protocol Mana Drain",
            telegraphText: "The Choir Thrall projects a violet null-ring around your caster!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.15,
            appliesCondition: "MANA_DRAIN",
            interruptibleBy: ["CORE_INTERRUPT", "ASTRAL_ARCANE"],
          },
        ],
      },
      {
        id: "fractured_memory_echo",
        name: "Fractured Memory Echo",
        title: "Discarded Server Phantom",
        tier: "COMMON",
        aliases: ["memory echo", "memory phantom", "server phantom"],
        baseHp: 265,
        baseAtk: 59,
        baseDef: 29,
        baseSpd: 30,
        maxPoise: 95,
        weaknesses: ["SHADOW_HEX", "PIERCE_VITALS", "HOLY_PURGE"],
        resistances: ["VENOM_PARALYSIS"],
        visualBrief: "Glitched golden-violet afterimage of a forgotten gacha warrior wielding static-static starlight.",
        mechanicsSummary: "Strikes with unpredictable lag-steps; Shadow Hex and Pierce Vitals anchor its flicker.",
        intents: [
          {
            id: "glitched_lunge",
            label: "Packet-Skip Lunge",
            telegraphText: "The Memory Echo stutters forward through dead frames straight at your flank!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.35,
            appliesCondition: "BLEED",
          },
          {
            id: "corruption_pulse",
            label: "Overflow Static Shock",
            telegraphText: "Static snow crackles along the prism tiles before an AoE burst!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.2,
            interruptibleBy: ["SHADOW_HEX", "CORE_INTERRUPT"],
          },
        ],
      },
      {
        id: "system_arbiter_construct",
        name: "System Arbiter Enforcer",
        title: "Elite Administrator's Audit Unit",
        tier: "ELITE",
        aliases: ["system arbiter", "arbiter enforcer", "audit unit"],
        baseHp: 320,
        baseAtk: 62,
        baseDef: 38,
        baseSpd: 28,
        maxPoise: 130,
        weaknesses: ["ASTRAL_ARCANE", "SHADOW_HEX", "CORE_INTERRUPT"],
        resistances: ["HOLY_PURGE", "VENOM_PARALYSIS"],
        visualBrief: "Geometric silver-and-cyan angelic construct inscribed with live Covenant enforcement runes.",
        mechanicsSummary: "Attempts to Quarantine low-star anomalies unless interrupted.",
        intents: [
          {
            id: "audit_lance",
            label: "Covenant Purge Ray",
            telegraphText: "Silver system rings lock onto your frontline for a precision purge beam!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.5,
          },
          {
            id: "null_protocol",
            label: "Mana Quarantine Pulse",
            telegraphText: "The Arbiter projects a silver grid to drain MP and weaken frontline defenses!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.35,
            appliesCondition: "MANA_DRAIN",
            interruptibleBy: ["CORE_INTERRUPT", "SHADOW_HEX"],
          },
        ],
      },
      {
        id: "unindexed_seraph",
        name: "Unindexed Star-Eater Seraph",
        title: "Elite Apex Spire Anomaly",
        tier: "ELITE",
        aliases: ["star-eater seraph", "unindexed seraph", "blade-seraph"],
        baseHp: 360,
        baseAtk: 68,
        baseDef: 35,
        baseSpd: 31,
        maxPoise: 140,
        weaknesses: ["HOLY_PURGE", "PIERCE_VITALS", "CRYSTAL_SHATTER"],
        resistances: ["ASTRAL_ARCANE", "VENOM_PARALYSIS"],
        visualBrief: "Crystalline multi-winged astral predator born from deleted high-rarity whale accounts.",
        mechanicsSummary: "High-speed true-damage dives; vulnerable right after flaring its crystal pinions.",
        intents: [
          {
            id: "starfall_dive",
            label: "Astral Pinion Dive",
            telegraphText: "The Seraph folds six crystal wings, diving straight toward your most exposed unit!",
            targetMode: "LOWEST_HP",
            damageMultiplier: 1.6,
          },
          {
            id: "shard_storm",
            label: "Fractured Banner Storm",
            telegraphText: "Razor shards of broken summoning crystals swirl to shred the entire squad!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 1.45,
            interruptibleBy: ["CRYSTAL_SHATTER", "HOLY_PURGE"],
          },
        ],
      },
    ],
    bossByFloor: {
      80: {
        id: "boss_f80_furnace_core",
        name: "Aegis-Omega, Heart of the Synthesis Furnace",
        title: "Floor 80 Gate Boss • Engine of Discarded Stars",
        isBoss: true,
        baseHp: 1320,
        baseAtk: 74,
        baseDef: 46,
        baseSpd: 25,
        maxPoise: 270,
        weaknesses: ["HOLY_PURGE", "BLUNT_STAGGER", "CRYSTAL_SHATTER"],
        resistances: ["VENOM_PARALYSIS", "SHADOW_HEX"],
        visualBrief: "Colossal silver furnace core powered by the compressed weapons of ten thousand foddered 1★ heroes.",
        mechanicsSummary: "Attempts to pull a frontline unit into synthesis locks unless staggered.",
        intents: [
          {
            id: "fodder_chains",
            label: "Synthesis Chain Grapple",
            telegraphText: "Glowing white chains lash out from the Furnace Core to drag in your lead fighter!",
            targetMode: "SINGLE_FRONTLINE",
            damageMultiplier: 1.7,
            appliesCondition: "STUN",
          },
          {
            id: "incineration_cycle",
            label: "Mass Synthesis Incineration",
            telegraphText: "CRITICAL TELEGRAPH: Furnace vents roar white-gold for a full-chamber Synthesis Burn!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 2.15,
            interruptibleBy: ["HOLY_PURGE", "BLUNT_STAGGER", "CORE_INTERRUPT"],
          },
        ],
      },
      90: {
        id: "boss_f90_apex_sovereign",
        name: "Grand Arbiter Seraphiel",
        title: "Floor 90 Penultimate Gate Boss • Right Hand of the Administrator",
        isBoss: true,
        baseHp: 1550,
        baseAtk: 82,
        baseDef: 50,
        baseSpd: 34,
        maxPoise: 300,
        weaknesses: ["SHADOW_HEX", "PIERCE_VITALS", "ASTRAL_ARCANE"],
        resistances: ["HOLY_PURGE", "BLUNT_STAGGER"],
        visualBrief: "Twelve-winged platinum arbiter standing before the cracked glass ceiling of the 100th Floor.",
        mechanicsSummary: "Tests every party swap and synergy bond before the final throne.",
        intents: [
          {
            id: "covenant_spear",
            label: "Eighth Covenant Judgment",
            telegraphText: "Seraphiel levels a spear of pure silver system-law at your frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.75,
          },
          {
            id: "account_deletion",
            label: "Protocol: Roster Deletion",
            telegraphText: "CRITICAL TELEGRAPH: Seraphiel inscribes 'DELETE' across the sky—unleashing lethal astral erasure!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 2.25,
            interruptibleBy: ["SHADOW_HEX", "ASTRAL_ARCANE", "CORE_INTERRUPT"],
          },
        ],
      },
      100: {
        id: "boss_f100_administrator",
        name: "The Administrator, Sovereign of the Star Gate",
        title: "Floor 100 Final Sovereign • Architect of Celestia Summons",
        isBoss: true,
        isThresholdGuardian: true,
        baseHp: 1900,
        baseAtk: 90,
        baseDef: 55,
        baseSpd: 36,
        maxPoise: 350,
        weaknesses: ["HOLY_PURGE", "ASTRAL_ARCANE", "SHADOW_HEX", "PIERCE_VITALS"],
        resistances: ["VENOM_PARALYSIS", "BLUNT_STAGGER"],
        visualBrief:
          "Luminous faceless entity enthroned beneath the shattered Fourth Wall where the Master's screen meets the living world.",
        mechanicsSummary:
          "Rewrites Command Seals and tests the unbreakable bond between a 1★ tactician and every surviving heroine.",
        intents: [
          {
            id: "fourth_wall_sever",
            label: "Console Severance Slash",
            telegraphText: "The Administrator slices the boundary of space across your active frontline!",
            targetMode: "ALL_FRONTLINE",
            damageMultiplier: 1.8,
          },
          {
            id: "genesis_reset",
            label: "Server Genesis Reset",
            telegraphText: "CRITICAL TELEGRAPH: Five falling stars converge in The Administrator's palm to reset the entire Spire!",
            targetMode: "ENTIRE_PARTY",
            damageMultiplier: 2.4,
            interruptibleBy: ["CORE_INTERRUPT", "HOLY_PURGE", "ASTRAL_ARCANE", "SHADOW_HEX"],
          },
        ],
      },
    },
  },
];

/**
 * Resolves the active 25-Floor Tower Theme for any floor (1-100).
 * Floor 0 (Lobby) previews Tier I or the highest unlocked stratum.
 */
export function getTowerThemeForFloor(floor: number): TowerThemeDefinition {
  const effectiveFloor = floor <= 0 ? 1 : Math.min(100, Math.max(1, Math.floor(floor)));
  return (
    STARFALL_TOWER_THEMES.find(
      (t) => effectiveFloor >= t.minFloor && effectiveFloor <= t.maxFloor
    ) || STARFALL_TOWER_THEMES[0]
  );
}

/**
 * Resolves the exact 16:9 background image path for any Starfall Labyrinth floor (0-100),
 * distinguishing Floating-Island Lobby (0), Floor 1 Antechamber, Safe Zones, Milestone Gate Bosses,
 * and the four 25-Floor Shifting Tower Strata.
 */
export function getStarfallFloorBackgroundUrl(
  floor: number,
  locationHint?: string | null
): string {
  let f = Math.floor(floor || 0);
  const hint = typeof locationHint === "string" ? locationHint.trim().toLowerCase() : "";
  if (
    f <= 0 &&
    hint &&
    !hint.includes("star gate plaza") &&
    !hint.includes("main lobby") &&
    !hint.includes("floating lobby") &&
    !hint.includes("barracks") &&
    !hint.includes("memorial") &&
    !hint.includes("conduit") &&
    /(?:sunken reliquary|verdant antechamber|narrow ascent|starfall dungeon|labyrinth|ossuary|drowned|flooded)/i.test(
      hint
    )
  ) {
    f = 1;
  }
  if (f <= 0) {
    return "/backgrounds/starfall-labyrinth/star_gate_plaza.jpg";
  }
  if (f === 1) {
    if (
      hint &&
      (hint.includes("sunken reliquary") ||
        hint.includes("drowned") ||
        hint.includes("flooded") ||
        hint.includes("ossuary"))
    ) {
      return "/backgrounds/starfall-labyrinth/sunken_reliquary.jpg";
    }
    return "/backgrounds/starfall-labyrinth/verdant_antechamber.jpg";
  }
  if (f === 10) {
    return "/backgrounds/starfall-labyrinth/hollow_king_gate.jpg";
  }
  if (f === 25) {
    return "/backgrounds/starfall-labyrinth/clocktower_ruins.jpg";
  }
  if (f === 40 || f === 50) {
    return "/backgrounds/starfall-labyrinth/cinder_horizon_gate.jpg";
  }
  if (f === 70 || f === 75) {
    return "/backgrounds/starfall-labyrinth/crimson_trial_court.jpg";
  }
  if (f >= 100) {
    return "/backgrounds/starfall-labyrinth/administrators_crown.jpg";
  }
  // Safe Zones on floors ending in 5 (5, 15 -> underground Lantern Bazaar; 35, 45, 55, 65, 85, 95 -> high-altitude Sky-Sanctum)
  if (f % 10 === 5) {
    return f <= 15
      ? "/backgrounds/starfall-labyrinth/safe_zone_bazaar.jpg"
      : "/backgrounds/starfall-labyrinth/lantern_sky_oasis.jpg";
  }
  return getTowerThemeForFloor(f).backgroundUrl;
}

/**
 * Deterministically picks the architectural layout & terrain tags for a floor.
 */
export function getFloorLayout(floor: number, seed: string = "starfall"): FloorLayoutTemplate {
  const theme = getTowerThemeForFloor(floor);
  const idx = hashThemeSeed(`${seed}:layout:${floor}`) % theme.layouts.length;
  return theme.layouts[idx] || theme.layouts[0];
}

/**
 * Returns the curated Common, Elite, and Gate/Threshold Boss monster roster for a given floor's stratum.
 */
export function getCuratedStratumBestiarySummary(floor: number): {
  commons: string[];
  elites: string[];
  bosses: string[];
  allTemplates: TowerEnemyTemplate[];
} {
  const theme = getTowerThemeForFloor(floor);
  const commons: string[] = [];
  const elites: string[] = [];
  const bosses: string[] = [];

  for (const e of theme.regularEnemies) {
    const tier = e.tier || "COMMON";
    if (tier === "ELITE") {
      elites.push(e.name);
    } else if (tier === "BOSS") {
      bosses.push(e.name);
    } else {
      commons.push(e.name);
    }
  }

  const bossEntries = Object.entries(theme.bossByFloor)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, b]) => b);

  for (const b of bossEntries) {
    bosses.push(b.name);
  }

  return {
    commons,
    elites,
    bosses,
    allTemplates: [...theme.regularEnemies, ...bossEntries],
  };
}

/**
 * Matches a canonical monster template from the stratum bestiary if mentioned by name or alias in prose.
 */
export function matchCuratedEnemyFromProse(
  floor: number,
  text: string | null | undefined
): TowerEnemyTemplate | null {
  const clean = typeof text === "string" ? text.trim().toLowerCase() : "";
  if (!clean) return null;

  const { allTemplates } = getCuratedStratumBestiarySummary(floor);
  const fallbackTemplates = STARFALL_TOWER_THEMES.flatMap((t) => [
    ...t.regularEnemies,
    ...Object.values(t.bossByFloor),
  ]);

  const searchList = [...allTemplates, ...fallbackTemplates.filter((ft) => !allTemplates.some((at) => at.id === ft.id))];

  // Check exact full names first (longest first to prevent partial prefix collisions)
  const byNameLen = [...searchList].sort((a, b) => b.name.length - a.name.length);
  for (const tpl of byNameLen) {
    if (clean.includes(tpl.name.toLowerCase())) {
      return tpl;
    }
  }

  // Check explicit curated aliases
  for (const tpl of byNameLen) {
    if (Array.isArray(tpl.aliases)) {
      const sortedAliases = [...tpl.aliases].sort((a, b) => b.length - a.length);
      for (const alias of sortedAliases) {
        const aliasLower = alias.toLowerCase();
        const escaped = aliasLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${escaped}\\b`, "i").test(clean)) {
          return tpl;
        }
      }
    }
  }

  return null;
}

/**
 * Deterministically selects and scales the enemy encounter for a given floor (1-100).
 */
export function generateScaledFloorEnemy(
  floor: number,
  seed: string = "starfall",
  preferredEnemyTemplate?: TowerEnemyTemplate | null
): {
  theme: TowerThemeDefinition;
  layout: FloorLayoutTemplate;
  enemy: TowerEnemyTemplate;
  enemyTier: StarfallEnemyTier;
  scaledStats: {
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
    maxPoise: number;
  };
  isThresholdFloor: boolean;
} {
  const clampedFloor = Math.max(1, Math.min(100, Math.floor(floor || 1)));
  const theme = getTowerThemeForFloor(clampedFloor);
  const layout = getFloorLayout(clampedFloor, seed);

  const bossTemplate = theme.bossByFloor[clampedFloor];
  const isThresholdFloor =
    clampedFloor === 25 || clampedFloor === 50 || clampedFloor === 75 || clampedFloor === 100;

  let chosenEnemy: TowerEnemyTemplate;
  if (bossTemplate) {
    chosenEnemy = bossTemplate;
  } else if (preferredEnemyTemplate) {
    chosenEnemy = preferredEnemyTemplate;
  } else {
    const commons = theme.regularEnemies.filter((e) => (e.tier || "COMMON") === "COMMON");
    const elites = theme.regularEnemies.filter((e) => e.tier === "ELITE");
    const stratumOffset = clampedFloor - theme.minFloor;
    // Floors 1-3 (start of a run / Stratum I entry) always draw from COMMON monsters unless Elite/Boss floor
    const preferCommonPool =
      commons.length > 0 &&
      (clampedFloor <= 3 || (stratumOffset % 3 !== 2 && hashThemeSeed(`${seed}:tier:${clampedFloor}`) % 100 < 68));
    const pool = preferCommonPool
      ? commons
      : elites.length > 0 && hashThemeSeed(`${seed}:elite:${clampedFloor}`) % 100 < 65
      ? elites
      : theme.regularEnemies;
    const idx = hashThemeSeed(`${seed}:enemy:${clampedFloor}`) % pool.length;
    chosenEnemy = pool[idx] || theme.regularEnemies[0];
  }

  const enemyTier: StarfallEnemyTier =
    bossTemplate || chosenEnemy.isBoss ? "BOSS" : chosenEnemy.tier || "COMMON";

  // Smooth intra-stratum scaling so Floor 24 hits harder than Floor 2
  const stratumOffset = clampedFloor - theme.minFloor; // 0..24
  const scaleFactor = bossTemplate ? 1.0 : 1 + stratumOffset * 0.045;

  return {
    theme,
    layout,
    enemy: chosenEnemy,
    enemyTier,
    scaledStats: {
      maxHp: Math.round(chosenEnemy.baseHp * scaleFactor),
      atk: Math.round(chosenEnemy.baseAtk * scaleFactor),
      def: Math.round(chosenEnemy.baseDef * scaleFactor),
      spd: Math.round(chosenEnemy.baseSpd * (1 + stratumOffset * 0.015)),
      maxPoise: Math.round(chosenEnemy.maxPoise * (bossTemplate ? 1 : 1 + stratumOffset * 0.02)),
    },
    isThresholdFloor,
  };
}
