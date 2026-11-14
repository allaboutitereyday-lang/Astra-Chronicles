"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Heart,
  Sparkles,
  Lock,
  Unlock,
  Coffee,
  Home,
  Info,
  BookOpen,
  Crown,
  Eye,
  AlertCircle,
  Layers,
  Award,
  Star,
  Skull,
  Shield,
} from "lucide-react";
import { StoryCompanion, CompanionCoreMemory, HeroineGuardTier } from "@/types/story";
import {
  STARFALL_HEROINE_DOSSIERS,
  HeroRosterEntry,
  StarRank,
} from "@/types/starfall_labyrinth";
import {
  getStarLevelCap,
  matchesHeroineName,
  computeHeroCombatStats,
} from "@/lib/starfallEngine";
import {
  PORT_SOLARIS_HEROINE_DOSSIERS,
  HeroineProfile,
  ShopRole,
  IslandFaction,
  BpmZone,
} from "@/types/port_solaris";
import {
  getBpmZone,
  getAffectionBpmCeiling,
  BOARDING_HOUSE_ROOMS,
} from "@/lib/portSolarisEngine";
import {
  getHeroineResistanceProfile,
  synthesizeDynamicCompanionSentiment,
  getRequiredExpForLevel,
} from "@/lib/progressionMechanics";
import { soundEffects } from "@/lib/audioEngine";

export interface CharacterCardCompanion {
  id?: string;
  name: string;
  title?: string;
  role?: string;
  gender?: "female" | "male" | "non-binary";
  personality?: string;
  values?: string[];
  dislikes?: string[];
  affection?: number;
  baseImageUrl?: string;
  expressionKey?: string;
  isPresent?: boolean;
  encountered?: boolean;
  currentSentiment?: string;
  trustProgress?: number;
  guardTier?: HeroineGuardTier;
  armorCrackCount?: number;
  unlockedCoreMemories?: string[];
  dynamicCoreMemories?: CompanionCoreMemory[];
  [key: string]: any;
}

export interface CharacterCardModalProps {
  companion: CharacterCardCompanion | StoryCompanion | null;
  isOpen: boolean;
  onClose: () => void;
  storyId?: string;
  liveBpm?: number;
  shopRole?: ShopRole | string;
  roomNumber?: number;
  npcKnowledge?: { knowsName?: boolean; knowsClass?: boolean; knowsOrigin?: boolean };
  onSelectRole?: (role: ShopRole) => void;
  starfallRosterEntry?: HeroRosterEntry | null;
}

export const STARFALL_PORTRAITS: Record<string, string> = {
  "pia hollis": "/characters/starfall-labyrinth/pia_hollis/neutral.png",
  "lotte klein": "/characters/starfall-labyrinth/lotte_klein/neutral.png",
  "sable ashgrove": "/characters/starfall-labyrinth/sable_ashgrove/neutral.png",
  "onyxia cryss": "/characters/starfall-labyrinth/onyxia_cryss/neutral.png",
  "vaelkor": "/characters/starfall-labyrinth/vaelkor/neutral.png",
  "dame odette varr": "/characters/starfall-labyrinth/odette_varr/neutral.png",
  "trinity valoren": "/characters/starfall-labyrinth/trinity_valoren/neutral.png",
  "abraxia": "/characters/starfall-labyrinth/abraxia/neutral.png",
  "garrick ironbrow": "/characters/starfall-labyrinth/garrick_ironbrow/neutral.png",
  "lyra nocturne": "/characters/starfall-labyrinth/lyra_nocturne/neutral.png",
  "mei zhou": "/characters/starfall-labyrinth/mei_zhou/neutral.png",
  "godiva": "/characters/starfall-labyrinth/godiva/neutral.png",
  "sir roland vance": "/characters/starfall-labyrinth/roland_vance/neutral.png",
  "aurelle, the seraph lance": "/characters/starfall-labyrinth/aurelle_seraph/neutral.png",
};

// Canonical transparent key art for Port Solaris heroines
export const PORT_SOLARIS_PORTRAITS: Record<string, string> = {
  "seraphina vane": "/characters/port-solaris/seraphina_vane.png",
  "vivienne laurent": "/characters/port-solaris/vivienne_laurent.png",
  "mia bellini": "/characters/port-solaris/mia_bellini.png",
  "colette moreau": "/characters/port-solaris/colette_moreau.png",
  "pippa reyes": "/characters/port-solaris/pippa_reyes.png",
  "kaede tachibana": "/characters/port-solaris/kaede_tachibana.png",
  "roxy vance": "/characters/port-solaris/roxy_vance.png",
  "chloe lin": "/characters/port-solaris/chloe_lin.png",
  "nadia saint-clair": "/characters/port-solaris/nadia_saint_clair.png",
  "zuri delacroix": "/characters/port-solaris/zuri_delacroix.png",
};

// Rom-Com Shadow Secrets & Vulnerabilities (Diegetic progression gating)
export const PORT_SOLARIS_SECRETS: Record<string, { publicFace: string; secret: string; unlockHint: string }> = {
  "seraphina vane": {
    publicFace: "Haughty Junior Chair of the Star Audit Committee sent to foreclose on The Stray Anchor.",
    secret:
      "Her father revoked her Platinum black cards until she learns 'practical fiscal management.' She lives in Room 201 on a strict allowance and secretly sneaks downstairs at midnight to devour your homecooked comfort meals while pretending to inspect kitchen sanitation.",
    unlockHint: "Unlock by raising Affection to 50% or triggering a midnight comfort food turn.",
  },
  "vivienne laurent": {
    publicFace: "Untouchable 'Ice Queen' billionaire heiress of the Laurent Luxury Shipping Dynasty.",
    secret:
      "Endearingly sheltered ditz about everyday life. She hires you under a fake-boyfriend contract to escape an arranged yacht-club marriage, and secretly cherishes mundane commoner dates—eating street cotton candy, riding Vespas, and folding warm laundry at the café.",
    unlockHint: "Unlock by raising Affection to 50% or completing the Fake Fiancé Boardwalk Tour.",
  },
  "mia bellini": {
    publicFace: "Fierce next-door artisanal competitor at Bellini Family Patisserie.",
    secret:
      "Your childhood friend who kept the spare key to The Stray Anchor on a ribbon around her neck for three years. She acts like a bossy, exasperated wife when sorting your groceries, but gets explosively jealous whenever wealthy heiresses sit at your counter.",
    unlockHint: "Unlock by raising Affection to 50% or reminiscing about childhood cove promises.",
  },
  "colette moreau": {
    publicFace: "Sultry, razor-sharp sommelier and exiled grand-resort master mixologist.",
    secret:
      "Secretly writes starry-eyed, cliché romance novels under a pen name late at night. The moment you inadvertently recreate one of her fictional tropes—like wiping a drop of wine from her collarbone—her unflappable persona melts into a crimson blush.",
    unlockHint: "Unlock by raising Affection to 50% or crafting a signature late-night cocktail.",
  },
  "pippa reyes": {
    publicFace: "Cheeky, trash-talking South Beach volleyball and surf prodigy.",
    secret:
      "Deathly terrified of sudden thunderstorms and spooky ghost tales. She constantly teases you as her 'goofy big bro,' but her heart rate spikes straight into the Blush Zone whenever you hold her hand or treat her like a desirable woman.",
    unlockHint: "Unlock by raising Affection to 50% or protecting her during a coastal storm.",
  },
  "kaede tachibana": {
    publicFace: "Stoic, bushido-driven kendo champion and Stray Anchor head bouncer.",
    secret:
      "Has an absolute, uncontrollable weakness for stray kittens, crane-game plushies, and warm steamed pork buns. She takes every casual joke 100% literally and completely short-circuits at the slightest romantic compliment.",
    unlockHint: "Unlock by raising Affection to 50% or winning her an arcade plushie.",
  },
  "roxy vance": {
    publicFace: "Shameless, fast-talking paparazzi Editor-in-Chief of The Solaris Siren.",
    secret:
      "A total glass cannon. She corners you with candid snapshots to blackmail you into investigative dates, but the split-second you turn the camera on her or lean close with genuine sincerity, she hides behind her telephoto lens in flustered panic.",
    unlockHint: "Unlock by raising Affection to 50% or stepping inside her personal space.",
  },
  "chloe lin": {
    publicFace: "Undefeated nocturnal arcade legend 'Zero' and Driftwood forensic tax accountant.",
    secret:
      "Feigns 'critically depleted battery' as a sham excuse to demand piggyback rides and lean against your shoulder for naps. She keeps a locked, private sketchbook filled with cozy domestic sketches of everyone living at The Stray Anchor.",
    unlockHint: "Unlock by raising Affection to 50% or beating her high score in fighting games.",
  },
  "nadia saint-clair": {
    publicFace: "Feared aesthetic and vintage appraiser for the Platinum Cliffs Heritage Trust.",
    secret:
      "Rents Room 205 at The Stray Anchor specifically to escape suffocating high-society galas. Her leather sketchbook is filled with romantic charcoal drawings of you cooking under the terrace lights, and her gold spectacles fog up completely when you feed her from the pan.",
    unlockHint: "Unlock by raising Affection to 50% or sharing a private tasting on the terrace.",
  },
  "zuri delacroix": {
    publicFace: "Sunset Rambla's slow-smiling botanical gelato and ceremonial matcha alchemist.",
    secret:
      "Loves leaning across the prep counter to tease you with pulse-spiking tastings, but possesses zero defense against direct physical affection. Wiping cream from her lip causes her to squeak and pull her thick green braids over her blushing face like curtains.",
    unlockHint: "Unlock by raising Affection to 50% or tasting her signature botanical matcha.",
  },
};

// Friendly titles & lore descriptions for Port Solaris core memories
export const CORE_MEMORY_CATALOG: Record<string, { title: string; hint: string }> = {
  midnight_ramen_addiction: {
    title: "Midnight Comfort Food Alliance",
    hint: "Discovered Seraphina raiding the kitchen for midnight comfort ramen in her oversized loungewear.",
  },
  father_resort_ultimatum: {
    title: "The Chairman's Eviction Notice",
    hint: "Witnessed the harsh corporate ultimatum issued by Chairman Alistair Vane at the marina.",
  },
  fake_fiance_clause_7: {
    title: "Contractual Romantic Entanglement",
    hint: "Signed the deadpan 'Commoner Boyfriend Protocol' under strict billionaire secrecy.",
  },
  first_street_crepe: {
    title: "First Commoner Street Delicacy",
    hint: "Watched Vivienne's aristocratic composure crack over a three-crown strawberry crepe.",
  },
  shared_cove_promise: {
    title: "Childhood Cove Keepsake",
    hint: "Uncovered the seashell ribbon Mia has preserved since the summer before the old café closed.",
  },
  secret_wedding_recipe_book: {
    title: "The Red-Ribboned Recipe Binder",
    hint: "Caught Mia frantically hiding her handwritten dessert menu annotated with joint initials.",
  },
  grand_resort_blacklisting: {
    title: "The Uncompromised Vintage",
    hint: "Learned why Colette poured a 5,000-crown fraudulent vintage down the drain of the VIP lounge.",
  },
  custom_midnight_vintage: {
    title: "The 100-Proof Blush Cocktail",
    hint: "Colette crafted an unlisted experimental blend named after your first night shift together.",
  },
  sprained_ankle_piggyback: {
    title: "Sunset Boardwalk Piggyback",
    hint: "Carried Pippa home after a high-stakes beach volley spike with a twisted ankle.",
  },
  not_just_your_kid_sister: {
    title: "Beyond the Kōhai Boundary",
    hint: "Pippa demanded you look at her as a woman rather than the neighborhood kid sister.",
  },
  rooftop_feng_shui_excuse: {
    title: "Sea-Breeze Feng Shui Defense",
    hint: "Kaede justified moving into Room 203 by analyzing the morning aerodynamic ki on your rooftop.",
  },
  first_heartbeat_realization: {
    title: "The Uncalculated Pulse",
    hint: "During dawn sword practice, Kaede felt her pulse spike above 85 BPM for reasons unrelated to cardio.",
  },
  deleted_scandal_negatives: {
    title: "The Shredded Headline",
    hint: "Roxy destroyed a career-making front-page exposé to protect The Stray Anchor from audit ruin.",
  },
  glass_cannon_confession: {
    title: "Behind the Telephoto Lens",
    hint: "Cornered the island's premier gossip broker until her smug teasing dissolved into sheer fluster.",
  },
  old_pier_arcade_crown: {
    title: "The 99-Win Token Champion",
    hint: "Fought shoulder-to-shoulder with Chloe to defend the Old Pier Arcade from syndicate bookies.",
  },
  shoulder_nap_dependency: {
    title: "Low Battery Shoulder Rest",
    hint: "Chloe systematically depleted her coffee just to claim an uninterrupted nap on your shoulder.",
  },
  charcoal_terrace_sketchbook: {
    title: "The Midnight Terrace Charcoal",
    hint: "Discovered Nadia's private sketchbook filled with intimate graphite studies of your kitchen work.",
  },
  fogged_glasses_tasting: {
    title: "The Steaming Pan Tasting",
    hint: "Fed Nadia a piping-hot butter sauce, causing her gold-chained glasses to steam over in shock.",
  },
  midnight_matcha_gelato_test: {
    title: "The Pulse-Spiking Parfait",
    hint: "Tested Zuri's botanical matcha blend while her slow cat-smirk pushed your heart rate to 90 BPM.",
  },
  braid_curtain_blush: {
    title: "The Twin-Braid Defensive Curtain",
    hint: "Wiped a drop of sweet cream from Zuri's mouth, forcing her to hide behind her twin emerald braids.",
  },
  // Legacy / Bonus Memory Aliases
  secret_charity_patron: {
    title: "The Anonymous Harbor Patron",
    hint: "Discovered Vivienne secretly funding Driftwood Cove student scholarships under an alias.",
  },
  fear_of_thunderstorms: {
    title: "Summer Squall Sanctuary",
    hint: "Stayed beside Vivienne when a midnight coastal thunderstorm knocked out the boarding house lights.",
  },
  sunrise_pier_kata: {
    title: "Dawn Kata on the Pier",
    hint: "Matched Kaede's bamboo shinai footwork as the sun rose over South Beach.",
  },
  plushie_claw_machine_master: {
    title: "The Secret Plushie Hoard",
    hint: "Won a giant stuffed harbour seal for Kaede at the Old Pier Arcade.",
  },
  flea_market_treasure_hunter: {
    title: "The Sunset Flea-Market Find",
    hint: "Watched Nadia's cool appraisal melt over a vintage brass watchmaker's loupe.",
  },
  handwritten_love_letters: {
    title: "Wax-Sealed Midnight Notes",
    hint: "Found Nadia's unsent fountain-pen reflections tucked inside her appraisal ledger.",
  },
  secret_romance_sketchbook: {
    title: "After-Hours Menu Sketches",
    hint: "Caught Colette doodling romantic cocktail names in the margins of the cellar inventory.",
  },
  vineyard_inheritance_dispute: {
    title: "The Moreau Vineyard Vow",
    hint: "Stood by Colette against the Platinum Cliffs sommelier cartel.",
  },
  undefeated_rhythm_queen: {
    title: "Neon Rhythm Cabinet Queen",
    hint: "Witnessed Chloe clear a max-difficulty arcade rhythm chart with one hand.",
  },
  sleepless_ledger_guardian: {
    title: "3 A.M. Clause 9B Audit",
    hint: "Found Chloe asleep over your tax ledgers after shaving 40% off the foreclosure interest.",
  },
  anonymous_stray_rescuer: {
    title: "The Dockside Stray Kittens",
    hint: "Caught Roxy sneaking leftover cream to the stray cats behind the Old Pier print shop.",
  },
  deleted_scoop_sacrifice: {
    title: "The Deleted Memory Card",
    hint: "Roxy formatted her own camera card rather than let the Platinum Board use her photos against you.",
  },
  childhood_promise_recipe: {
    title: "Nonna's Brioche Promise",
    hint: "Baked the exact recipe Mia swore she'd save for the day you returned to Port Solaris.",
  },
  jealous_apron_vigil: {
    title: "The Flour-Dusted Apron Vigil",
    hint: "Mia marched into the kitchen after hours to make sure hers was the last dish you tasted.",
  },
  sunset_lighthouse_confession: {
    title: "Sunset Lighthouse Breather",
    hint: "Shared a quiet citrus soda with Pippa at the point lighthouse after a brutal tournament rally.",
  },
  festival_fireworks_wish: {
    title: "South Shore Fireworks Wish",
    hint: "Held Pippa's hand on the lifeguard tower as the High Summer regatta shells lit the cove.",
  },
  moonlight_greenhouse_bloom: {
    title: "Moonlight Rooftop Bloom",
    hint: "Watched Zuri's night-blooming vanilla orchid open on the upstairs terrace.",
  },
  grandmother_apothecary_journal: {
    title: "The Delacroix Botanical Grimoire",
    hint: "Zuri entrusted you with her grandmother's secret herbal infusion notes.",
  },
};

export interface CharacterModalState {
  isOpen: boolean;
  companion: StoryCompanion | CharacterCardCompanion | null;
}

export type CharacterModalAction =
  | { type: "OPEN_MODAL"; companion: StoryCompanion | CharacterCardCompanion }
  | { type: "CLOSE_MODAL" }
  | { type: "HANDLE_KEY_DOWN"; key: string };

export function characterModalReducer(
  state: CharacterModalState,
  action: CharacterModalAction
): CharacterModalState {
  switch (action.type) {
    case "OPEN_MODAL":
      return { isOpen: true, companion: action.companion };
    case "CLOSE_MODAL":
      return { isOpen: false, companion: null };
    case "HANDLE_KEY_DOWN":
      if (action.key === "Escape") {
        return { isOpen: false, companion: null };
      }
      return state;
    default:
      return state;
  }
}

export function handleModalBackdropClick(
  event: { target: any; currentTarget: any },
  onClose: () => void
): boolean {
  if (event.target === event.currentTarget) {
    onClose();
    return true;
  }
  return false;
}

export function resolveCharacterCardBpm(
  companion: CharacterCardCompanion | StoryCompanion,
  propLiveBpm?: number
): { resolvedBpm: number; zone: BpmZone } {
  const compAffection = typeof companion.affection === "number" ? companion.affection : 15;
  const profile = getHeroineResistanceProfile(companion as Partial<StoryCompanion>);
  const ceiling = getAffectionBpmCeiling(compAffection, profile.guardTier);
  const dossier =
    PORT_SOLARIS_HEROINE_DOSSIERS[companion.name] ||
    Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
      (d) => companion.name.toLowerCase().includes(d.name.toLowerCase())
    );
  const rawBpm =
    typeof propLiveBpm === "number"
      ? propLiveBpm
      : dossier
      ? Math.round(dossier.heartRateBpm + Math.max(0, compAffection - 20) * 0.35)
      : 55;
  const resolvedBpm = Math.max(40, Math.min(ceiling, rawBpm));
  return {
    resolvedBpm,
    zone: getBpmZone(resolvedBpm).zone,
  };
}

export function resolveCharacterCardRole(
  companion: CharacterCardCompanion | StoryCompanion,
  propShopRole?: ShopRole | string
): string {
  const dossier =
    PORT_SOLARIS_HEROINE_DOSSIERS[companion.name] ||
    Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
      (d) => companion.name.toLowerCase().includes(d.name.toLowerCase())
    );
  return (propShopRole || dossier?.preferredShopRole || companion.role || "FLOOR_HOST")
    .toString()
    .replace(/_/g, " ")
    .toUpperCase();
}

export function getCharacterCardSentiment(
  affection: number,
  companion?: Partial<CharacterCardCompanion | StoryCompanion> | null,
  isStarfall: boolean = false
): string {
  if (companion && (companion.currentSentiment || companion.name)) {
    return synthesizeDynamicCompanionSentiment({
      companion: {
        ...companion,
        affection,
      } as Partial<StoryCompanion>,
      llmSentiment: companion.currentSentiment,
    });
  }
  const isMale =
    (companion?.gender || "").toLowerCase() === "male" ||
    /\b(vaelkor|garrick|roland)\b/i.test(companion?.name || "");
  const Subj = isMale ? "He" : "She";
  const poss = isMale ? "his" : "her";
  const obj = isMale ? "him" : "her";

  if (isStarfall) {
    if (affection < 25) {
      return `Guarded & Observant. ${Subj} maintains a strict tactical perimeter, testing whether a 1★ commander can survive Labyrinth attrition.`;
    } else if (affection < 45) {
      return `Tactical Respect. ${Subj} watches your floor callouts closely, loosening ${poss} guard whenever you keep the squad alive.`;
    } else if (affection < 70) {
      return `Trusted Vanguard Bond. ${Subj} relies on your positioning in lethal boss phases and confides the scars beneath ${poss} armor.`;
    } else if (affection < 90) {
      return `Sworn Resonance. Deep battlefield devotion. ${Subj} refuses to let any Command Seal separate your flanks and watches every blind spot around you.`;
    }
    return `Unshakeable Starfall Dyad. Absolute life-and-death trust forged across the Spire—standing behind you against the Administrator without hesitation.`;
  }

  if (affection < 25) {
    return `Guarded & Observant. ${Subj} maintains a professional perimeter, treating you with cautious skepticism while watching how you handle island pressures.`;
  } else if (affection < 45) {
    return `Curious & Warming. ${Subj} frequently lingers at your counter or door, finding excuses to engage in playful banter and test your composure.`;
  } else if (affection < 70) {
    return `Fond & Trusting. ${isMale ? "His" : "Her"} heart rate elevates noticeably in your presence. ${Subj} confides private vulnerabilities and values your comfort over high-society prestige.`;
  } else if (affection < 90) {
    return `Infatuated & Protective. Deep emotional resonance. ${Subj} softens at unexpected eye contact, fiercely defends The Stray Anchor, and views you as ${poss} irreplaceable partner.`;
  }
  return `Devoted Dyad Harmony. Unshakeable coastal devotion. ${Subj} holds nothing back toward ${obj === "him" ? "you" : "you"}, completely melting into radiant affection whenever your hands touch.`;
}

export function isCharacterCardSecretUnlocked(affection: number, intimacyRank: number = 1): boolean {
  return affection >= 50 || intimacyRank >= 2;
}

type ActiveModalTab = "overview" | "dossier" | "role" | "memories";

export function CharacterCardModal({
  companion,
  isOpen,
  onClose,
  storyId = "port-solaris",
  liveBpm: propLiveBpm,
  shopRole: propShopRole,
  roomNumber: propRoomNumber,
  npcKnowledge,
  onSelectRole,
  starfallRosterEntry,
}: CharacterCardModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveModalTab>("overview");
  const isStarfall = storyId === "starfall-labyrinth";

  // Handle ESC key dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const compNameLower = (companion?.name || "").toLowerCase();
  const dossier = useMemo(() => {
    if (!companion || isStarfall) return null;
    return (
      PORT_SOLARIS_HEROINE_DOSSIERS[companion.name] ||
      Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find(
        (d) => compNameLower.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(compNameLower)
      ) ||
      null
    );
  }, [companion, compNameLower, isStarfall]);

  const starfallDossier = useMemo(() => {
    if (!companion) return null;
    return (
      STARFALL_HEROINE_DOSSIERS[companion.name] ||
      Object.values(STARFALL_HEROINE_DOSSIERS).find((d) =>
        matchesHeroineName(d.name, companion.name, companion.id)
      ) ||
      null
    );
  }, [companion]);

  if (!isOpen || !companion) return null;

  const compAffection = typeof companion.affection === "number" ? companion.affection : 15;
  const effectiveStarRank: StarRank = (
    starfallRosterEntry?.starRank ||
    (companion as StoryCompanion).starRank ||
    starfallDossier?.baseStarRank ||
    1
  ) as StarRank;
  const effectiveBaseStarRank: StarRank = (
    starfallRosterEntry?.baseStarRank ||
    (companion as StoryCompanion).baseStarRank ||
    starfallDossier?.baseStarRank ||
    1
  ) as StarRank;
  const effectiveRosterLevel =
    starfallRosterEntry?.level || (companion as StoryCompanion).level || 1;
  const effectiveRosterExp =
    starfallRosterEntry?.exp ?? (companion as StoryCompanion).exp ?? 0;
  const effectiveRosterMaxExp =
    starfallRosterEntry?.maxExp ||
    (companion as StoryCompanion).maxExp ||
    getRequiredExpForLevel(effectiveRosterLevel);
  const effectiveStarCap = isStarfall ? getStarLevelCap(effectiveStarRank) : 60;
  const effectiveAwakenings =
    starfallRosterEntry?.awakenings ?? (companion as StoryCompanion).awakenings ?? 0;
  const effectiveHeroStatus =
    starfallRosterEntry?.status ||
    (companion as StoryCompanion).heroStatus ||
    (companion.isPresent ? "DEPLOYED" : "BENCHED");
  const isFallenHero = effectiveHeroStatus === "FALLEN";
  const fallenFloor =
    starfallRosterEntry?.fallenOnFloor || (companion as StoryCompanion).fallenOnFloor;
  const fallenCause =
    starfallRosterEntry?.fallenCause || (companion as StoryCompanion).fallenCause;

  // Resolve dynamic live BPM
  const { resolvedBpm } = resolveCharacterCardBpm(companion, propLiveBpm);
  const bpmState = getBpmZone(resolvedBpm);

  // Resolve shop role
  const resolvedRole = resolveCharacterCardRole(companion, propShopRole);

  // Resolve room number (normalizes 1-6 to 201-206)
  const rawRoom =
    typeof propRoomNumber === "number"
      ? propRoomNumber
      : dossier?.assignedRoomNumber || 201;
  const resolvedRoomNum = rawRoom >= 200 ? rawRoom : 200 + rawRoom;

  const roomInfo = BOARDING_HOUSE_ROOMS[resolvedRoomNum] || BOARDING_HOUSE_ROOMS[201];

  // Resolve high-res portrait art
  const portraitSrc =
    STARFALL_PORTRAITS[compNameLower] ||
    PORT_SOLARIS_PORTRAITS[compNameLower] ||
    companion.baseImageUrl ||
    "/characters/default.png";

  // Resolve gender-aware pronouns & enriched companion data
  const resolvedGender = (
    companion.gender ||
    starfallDossier?.gender ||
    "female"
  ).toLowerCase();
  const isMale = resolvedGender === "male";
  const possPronoun = isMale ? "his" : "her";
  const PossPronoun = isMale ? "His" : "Her";

  // Rom-Com / Labyrinth Secret & Knowledge Gating
  const secretData = !isStarfall ? PORT_SOLARIS_SECRETS[compNameLower] : undefined;
  const isSecretUnlocked = isCharacterCardSecretUnlocked(
    compAffection,
    !isStarfall ? dossier?.intimacyRank ?? 1 : 1
  );
  const resistanceProfile = getHeroineResistanceProfile({
    ...companion,
    gender: (companion.gender || starfallDossier?.gender) as StoryCompanion["gender"],
  } as Partial<StoryCompanion>);

  // Dynamic Sentiment Synthesis (reflects live player choices & heroine guard state)
  const getDynamicSentiment = () =>
    getCharacterCardSentiment(
      compAffection,
      {
        ...companion,
        gender: (companion.gender || starfallDossier?.gender) as StoryCompanion["gender"],
      },
      isStarfall
    );

  // Faction Styling
  const factionName: IslandFaction = dossier?.faction || "BOARDWALK_GUILD";
  const factionBadgeStyles: Record<IslandFaction, { label: string; border: string; bg: string; text: string }> = {
    PLATINUM_BOARD: {
      label: "Platinum Board (High-Society)",
      border: "border-amber-400/60",
      bg: "bg-amber-950/80",
      text: "text-amber-200",
    },
    BOARDWALK_GUILD: {
      label: "Boardwalk Guild (Culinary & Artisans)",
      border: "border-emerald-400/60",
      bg: "bg-emerald-950/80",
      text: "text-emerald-200",
    },
    BREAKERS_UNION: {
      label: "Breakers Union (Athletes & Docks)",
      border: "border-sky-400/60",
      bg: "bg-sky-950/80",
      text: "text-sky-200",
    },
    DRIFTWOOD_SYNDICATE: {
      label: "Driftwood Syndicate (Night-Market)",
      border: "border-purple-400/60",
      bg: "bg-purple-950/80",
      text: "text-purple-200",
    },
  };
  const factionMeta = factionBadgeStyles[factionName] || factionBadgeStyles.BOARDWALK_GUILD;

  return (
    <div
      onClick={(e) => handleModalBackdropClick(e, onClose)}
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92dvh] animate-in zoom-in-95 duration-200"
      >
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-white/10 border border-white/15 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-lg"
          title="Close Character Dossier (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: HERO VISUAL & LIVE TELEMETRY */}
        <div className="relative md:w-80 lg:w-96 shrink-0 bg-gradient-to-b from-zinc-900/60 via-zinc-950/80 to-black/95 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-end overflow-hidden p-4 min-h-[300px] md:min-h-[560px]">
          {/* Ambient Faction / Blush Aura */}
          <div
            className={`absolute -top-12 -left-12 w-64 h-64 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700 ${
              isStarfall
                ? compAffection >= 80
                  ? "bg-rose-500 animate-pulse"
                  : compAffection >= 50
                  ? "bg-amber-500"
                  : effectiveStarRank >= 5
                  ? "bg-indigo-500"
                  : "bg-cyan-500"
                : resolvedBpm >= 96
                ? "bg-rose-500 animate-pulse"
                : resolvedBpm >= 83
                ? "bg-pink-500"
                : resolvedBpm >= 69
                ? "bg-amber-500"
                : "bg-cyan-500"
            }`}
          />

          {/* Full-Height Heroine Portrait */}
          <div className="relative w-full h-[260px] md:h-[420px] flex items-end justify-center">
            <img
              src={portraitSrc}
              alt={companion.name}
              className={`w-full h-full object-contain object-bottom filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)] ${
                isFallenHero ? "grayscale opacity-65" : ""
              }`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/characters/default.png";
              }}
            />
          </div>

          {/* Telemetry Overlays at Base of Portrait */}
          <div className="relative z-10 w-full space-y-2 mt-2">
            {isStarfall ? (
              <>
                <div
                  className={`w-full py-1.5 px-3 rounded-2xl border text-center font-mono flex items-center justify-between gap-2 shadow-lg backdrop-blur-md transition-all ${
                    isFallenHero
                      ? "bg-rose-950/90 border-rose-500/70 text-rose-200"
                      : effectiveStarRank >= 5
                      ? "bg-amber-950/90 border-amber-400 text-amber-200"
                      : effectiveStarRank >= 4
                      ? "bg-purple-950/85 border-purple-400/70 text-purple-200"
                      : "bg-indigo-950/80 border-indigo-400/50 text-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isFallenHero ? (
                      <Skull className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    )}
                    <span className="text-xs font-black tracking-tight">
                      {"★".repeat(effectiveStarRank)} ({effectiveStarRank}★)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isFallenHero
                      ? `FALLEN${fallenFloor ? ` • FLOOR ${fallenFloor}` : ""}`
                      : `Lv.${effectiveRosterLevel} / ${effectiveStarCap}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="bg-black/70 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-zinc-300">
                    <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[8px] text-zinc-500 uppercase block leading-none">
                        Roster Status
                      </span>
                      <span
                        className={`font-bold truncate block ${
                          isFallenHero
                            ? "text-rose-300"
                            : effectiveHeroStatus === "DEPLOYED"
                            ? "text-emerald-300"
                            : "text-zinc-300"
                        }`}
                      >
                        {effectiveHeroStatus}
                      </span>
                    </div>
                  </div>

                  <div className="bg-black/70 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-zinc-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[8px] text-zinc-500 uppercase block leading-none">
                        Awakenings
                      </span>
                      <span className="font-bold text-indigo-200 truncate block">
                        {"◆".repeat(effectiveAwakenings)}
                        {"◇".repeat(Math.max(0, 4 - effectiveAwakenings))} ({effectiveAwakenings}/4)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Live BPM Badge */}
                <div
                  className={`w-full py-1.5 px-3 rounded-2xl border text-center font-mono flex items-center justify-between gap-2 shadow-lg backdrop-blur-md transition-all ${
                    resolvedBpm >= 96
                      ? "bg-amber-950/90 border-amber-400 text-amber-200 animate-bounce"
                      : resolvedBpm >= 83
                      ? "bg-pink-950/85 border-pink-400/70 text-pink-200 animate-pulse"
                      : resolvedBpm >= 69
                      ? "bg-amber-950/75 border-amber-500/50 text-amber-200"
                      : "bg-cyan-950/70 border-cyan-500/40 text-cyan-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Heart className={`w-4 h-4 fill-current ${resolvedBpm >= 83 ? "animate-pulse" : ""}`} />
                    <span className="text-xs font-black tracking-tight">{resolvedBpm} BPM</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {bpmState.label}
                  </span>
                </div>

                {/* Café Shop Role & Upstairs Room Badges */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="bg-black/70 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-zinc-300">
                    <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[8px] text-zinc-500 uppercase block leading-none">Café Role</span>
                      <span className="font-bold text-amber-200 truncate block">{resolvedRole}</span>
                    </div>
                  </div>

                  <div className="bg-black/70 border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-zinc-300">
                    <Home className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[8px] text-zinc-500 uppercase block leading-none">Upstairs Room</span>
                      <span className="font-bold text-sky-200 truncate block">
                        {dossier?.isBoardingHouseTenant ? `Room ${resolvedRoomNum}` : "Island Resident"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DOSSIER TABS & KNOWLEDGE GATING */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 p-5 sm:p-6 overflow-hidden">
          {/* HEADER: NAME, EPITHET, FACTION */}
          <div className="shrink-0 border-b border-white/10 pb-3.5 pr-10">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {companion.name}
              </h2>
              {isStarfall ? (
                <>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border bg-amber-950/80 border-amber-400/60 text-amber-200">
                    {effectiveStarRank}★ Summoned Hero (Base {effectiveBaseStarRank}★)
                  </span>
                  {isFallenHero && (
                    <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full border bg-rose-950 border-rose-500/70 text-rose-200">
                      ✝ MEMORIAL WALL — FLOOR {fallenFloor || "?"}
                    </span>
                  )}
                </>
              ) : (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${factionMeta.bg} ${factionMeta.border} ${factionMeta.text}`}
                >
                  {factionMeta.label}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>
                {starfallDossier?.epithet || dossier?.epithet || companion.title || "Summoned Companion"}
              </span>
            </p>
          </div>

          {/* TAB SWITCHER DOCK */}
          <div className="shrink-0 flex flex-wrap items-center gap-1.5 my-3 border-b border-white/10 pb-3">
            {(
              [
                { id: "overview", label: "Overview & Dyad", icon: <Layers className="w-3.5 h-3.5 shrink-0" /> },
                { id: "dossier", label: "Dossier & Quirks", icon: <Info className="w-3.5 h-3.5 shrink-0" /> },
                {
                  id: "role",
                  label: isStarfall ? "Star Rank & Cap" : "Stray Anchor Role",
                  icon: isStarfall ? (
                    <Star className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Coffee className="w-3.5 h-3.5 shrink-0" />
                  ),
                },
                { id: "memories", label: "Core Memories", icon: <Award className="w-3.5 h-3.5 shrink-0" /> },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isSelected
                      ? "bg-rose-500/20 border border-rose-400 text-rose-200 shadow-md"
                      : "bg-white/5 border border-transparent text-zinc-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 text-xs font-mono">
            {/* TAB 1: OVERVIEW & DYAD PASSIVE */}
            {activeTab === "overview" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Affection, Guard Tier & Dynamic Choice Sentiment */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      Heart Resonance (Affection)
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                          resistanceProfile.guardTier === "IRONCLAD"
                            ? "bg-amber-950/70 border-amber-400/50 text-amber-200"
                            : resistanceProfile.guardTier === "SELECTIVE"
                            ? "bg-purple-950/70 border-purple-400/50 text-purple-200"
                            : "bg-emerald-950/70 border-emerald-400/50 text-emerald-200"
                        }`}
                      >
                        {resistanceProfile.badgeLabel}
                      </span>
                      <span className="text-sm font-black text-rose-300 font-mono">
                        {compAffection}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-pink-400 to-amber-300 transition-all duration-500 rounded-full"
                      style={{ width: `${compAffection}%` }}
                    />
                  </div>
                  {(resistanceProfile.guardTier === "IRONCLAD" || resistanceProfile.guardTier === "SELECTIVE") &&
                    compAffection < resistanceProfile.guardedThreshold && (
                      <div className="flex items-center justify-between gap-2 text-[10px] px-2.5 py-1.5 rounded-xl bg-black/40 border border-rose-500/20">
                        <span className="text-rose-200/90 font-medium">
                          ✦ Cracks in {PossPronoun} Armor:{" "}
                          <strong className="text-rose-300">{companion.armorCrackCount || 0}</strong>
                        </span>
                        <span className="text-zinc-400 font-mono">
                          Next Trust Breakthrough: {Math.round(((companion.trustProgress || 0) % 1) * 100)}%
                        </span>
                      </div>
                    )}
                  <div className="p-2.5 rounded-xl bg-black/35 border border-white/5 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-rose-300/90 block">
                      Current Sentiment (Choice-Driven)
                    </span>
                    <p className="text-[11px] text-zinc-200 italic leading-relaxed">
                      {getDynamicSentiment()}
                    </p>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">
                      {isStarfall ? `How to Earn ${PossPronoun} Trust:` : `How to Earn ${PossPronoun} Heart:`}
                    </strong>{" "}
                    {resistanceProfile.whatEarnsAffection}
                  </p>
                </div>

                {/* Squad Combat Level & Synced Experience */}
                {!isFallenHero && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-amber-200 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        Squad Combat Level • Lv.{effectiveRosterLevel}
                        {isStarfall ? `/${effectiveStarCap}` : ""}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {effectiveRosterLevel >= effectiveStarCap
                          ? `MAX CAP (Lv.${effectiveStarCap})`
                          : `${effectiveRosterExp} / ${effectiveRosterMaxExp} EXP`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-200 transition-all duration-500 rounded-full"
                        style={{
                          width: `${
                            effectiveRosterLevel >= effectiveStarCap
                              ? 100
                              : Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    (effectiveRosterExp / Math.max(1, effectiveRosterMaxExp)) * 100
                                  )
                                )
                          }%`,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Earns synced EXP alongside you during active combat clashes, tactical breakthroughs, dungeon floor clears, and quest completions while deployed in your squad.
                    </p>
                  </div>
                )}

                {isFallenHero && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-200 font-bold">
                      <Skull className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        Memorial Record — Permanently Fallen on Floor {fallenFloor || "?"}
                      </span>
                    </div>
                    <p className="text-rose-200/85 text-[11px] leading-relaxed">
                      {fallenCause ||
                        "Shattered into Star Ash in the Starfall Labyrinth. Per Covenant VI, fallen heroes never return."}
                    </p>
                  </div>
                )}

                {/* Dyad Passive Ability Card */}
                {(dossier || starfallDossier) && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-zinc-900/80 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-bold text-amber-200 uppercase tracking-wide">
                        Dyad Passive: {(starfallDossier || dossier)?.dyadPassiveName}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {(starfallDossier || dossier)?.dyadPassiveDescription}
                    </p>
                  </div>
                )}

                {/* Conflict & Arc Premise */}
                {(dossier || starfallDossier) && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-1.5">
                    <span className="text-zinc-400 uppercase text-[10px] tracking-wider block font-bold">
                      {isStarfall ? "Act I Labyrinth Arc & Survival Conflict" : "Act I Island Arc & Conflict"}
                    </span>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {(starfallDossier || dossier)?.actOneConflict}
                    </p>
                  </div>
                )}

                {/* Diegetic Knowledge Status (What she knows about protagonist) */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2">
                  <span className="text-zinc-400 uppercase text-[10px] tracking-wider block font-bold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Diegetic Knowledge of Protagonist
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        npcKnowledge?.knowsName
                          ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                          : "bg-zinc-900 border-white/5 text-zinc-500"
                      }`}
                    >
                      <span className="font-bold block">True Name</span>
                      <span>{npcKnowledge?.knowsName ? "Disclosed" : "Unmet / Hidden"}</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border text-center ${
                        npcKnowledge?.knowsClass
                          ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                          : "bg-zinc-900 border-white/5 text-zinc-500"
                      }`}
                    >
                      <span className="font-bold block">
                        {isStarfall ? "Combat Class" : "Conduit Flair"}
                      </span>
                      <span>{npcKnowledge?.knowsClass ? "Recognized" : "Guarded"}</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border text-center ${
                        npcKnowledge?.knowsOrigin
                          ? "bg-purple-950/60 border-purple-500/50 text-purple-200"
                          : "bg-zinc-900 border-white/5 text-zinc-500"
                      }`}
                    >
                      <span className="font-bold block">
                        {isStarfall ? "Ex-Ranker Origin" : "Origin Truth"}
                      </span>
                      <span>{npcKnowledge?.knowsOrigin ? "Disclosed" : "Masked"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DOSSIER, PREFERENCES & SHADOW VULNERABILITIES */}
            {activeTab === "dossier" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Personality & Backstory */}
                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-1.5">
                  <span className="text-zinc-400 uppercase text-[10px] tracking-wider block font-bold">
                    Persona & Demeanor
                  </span>
                  <p className="text-zinc-200 text-[11px] leading-relaxed">
                    {companion.personality ||
                      starfallDossier?.personality ||
                      starfallDossier?.actOneConflict ||
                      dossier?.archetype ||
                      (isStarfall
                        ? "A summoned hero fighting to survive the Starfall Labyrinth."
                        : "A key figure on Port Solaris.")}
                  </p>
                </div>

                {/* Starfall Chronicle Quote & Voice Brief */}
                {isStarfall && starfallDossier && (
                  <div className="p-3.5 rounded-2xl bg-indigo-950/25 border border-indigo-500/25 space-y-2">
                    <span className="text-indigo-300 uppercase text-[10px] tracking-wider block font-bold">
                      Star Gate Summon Record
                    </span>
                    <p className="text-zinc-200 italic text-[11px] leading-relaxed">
                      &ldquo;{starfallDossier.summonQuote}&rdquo;
                    </p>
                  </div>
                )}

                {/* Likes / Values vs. Dislikes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                    <span className="text-emerald-300 font-bold uppercase text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Values & Likes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {((companion.values && companion.values.length > 0
                        ? companion.values
                        : starfallDossier?.values) ||
                        (isStarfall
                          ? ["Tactical Competence", "Squad Survival", "Honest Command"]
                          : ["Honesty", "Warm Comfort Food", "Island Loyalty"])
                      ).map((v, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-200 text-[10px]"
                        >
                          ✦ {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1.5">
                    <span className="text-rose-300 font-bold uppercase text-[10px] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Dislikes & Triggers
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {((companion.dislikes && companion.dislikes.length > 0
                        ? companion.dislikes
                        : starfallDossier?.dislikes) ||
                        (isStarfall
                          ? ["Reckless Command Seals", "Sacrificial Bait Orders", "Betrayal"]
                          : ["Arrogance", "Unearned Privilege", "Sloppy Recipes"])
                      ).map((d, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-200 text-[10px]"
                        >
                          ✖ {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROM-COM / LABYRINTH SECRET (GATED) */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    isSecretUnlocked
                      ? "bg-gradient-to-r from-rose-950/60 via-purple-950/50 to-zinc-900/80 border-rose-500/40"
                      : "bg-zinc-900/50 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1.5 text-rose-200 uppercase tracking-wide">
                      {isSecretUnlocked ? (
                        <>
                          <Unlock className="w-4 h-4 text-emerald-400" />
                          {isStarfall
                            ? "Labyrinth Dossier Unlocked: Hidden Trauma & Secret"
                            : "Rom-Com Secret Unlocked: Rom-Com Weakness"}
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-amber-400" />
                          {isStarfall ? "Labyrinth Secret Locked" : "Rom-Com Secret Locked"}
                        </>
                      )}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-black/50 text-zinc-400 border-white/10">
                      {isSecretUnlocked ? "Confided" : "Gated"}
                    </span>
                  </div>

                  {isSecretUnlocked && (secretData || starfallDossier) ? (
                    <div className="space-y-1.5 text-[11px] leading-relaxed text-zinc-200">
                      <p className="text-zinc-400 font-semibold">
                        Public Persona: {secretData?.publicFace || starfallDossier?.archetype}
                      </p>
                      <p className="text-rose-200 font-bold">
                        Secret Vulnerability: {secretData?.secret || starfallDossier?.traumaAndSecret}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-[11px] text-zinc-400">
                      <p>
                        {secretData?.publicFace ||
                          starfallDossier?.archetype ||
                          "A guarded secret known only to those who share genuine intimacy."}
                      </p>
                      <div className="p-2 rounded-xl bg-black/40 border border-amber-500/20 text-amber-300 text-[10px] flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>
                          {secretData?.unlockHint ||
                            `Reach 50% Affection to unlock ${possPronoun} hidden past.`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: STRAY ANCHOR ROLE OR STARFALL ROSTER PROGRESSION */}
            {activeTab === "role" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {isStarfall ? (
                  <>
                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              Star Rank: {"★".repeat(effectiveStarRank)} ({effectiveStarRank}★ • Base {effectiveBaseStarRank}★)
                            </h4>
                            <span className="text-[10px] text-zinc-400">
                              {starfallDossier?.combatRole || companion.role || "Labyrinth Combatant"}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold">
                          Level {effectiveRosterLevel} / Cap {effectiveStarCap}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Per Covenant II, a {effectiveStarRank}★ hero has a hard biological ceiling of{" "}
                        <strong className="text-amber-300">Level {effectiveStarCap}</strong> (1★=20, 2★=30, 3★=40, 4★=50, 5★=60). Reaching Heart Resonance milestones (25%, 50%, 75%, 90%) or absorbing duplicate Star Gate echoes triggers{" "}
                        <strong className="text-indigo-300">Resonance Awakening (+1★)</strong>, raising {possPronoun} cap by +10 up to 5★ (Lv.60).
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">
                          Resonance Awakening Nodes ({effectiveAwakenings} / 4)
                        </span>
                        <span className="text-[10px] text-indigo-300">
                          Milestones: 25% • 50% • 75% • 90%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        {[25, 50, 75, 90].map((ms, idx) => {
                          const unlocked = effectiveAwakenings > idx || compAffection >= ms;
                          return (
                            <div
                              key={ms}
                              className={`p-2 rounded-xl border ${
                                unlocked
                                  ? "bg-indigo-950/70 border-indigo-400/60 text-indigo-200 font-bold"
                                  : "bg-black/40 border-white/10 text-zinc-500"
                              }`}
                            >
                              <span className="block text-xs">{unlocked ? "◆" : "◇"}</span>
                              <span>{ms}% Bond</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* STAR-SCALED COMBAT STATS + ASCENSION PREVIEW */}
                    {(() => {
                      const curStats =
                        starfallRosterEntry?.combatStats ||
                        computeHeroCombatStats({
                          heroineName: companion.name,
                          starRank: effectiveStarRank,
                          level: effectiveRosterLevel,
                          awakenings: effectiveAwakenings,
                          isWounded: effectiveHeroStatus === "WOUNDED",
                        });
                      const nextRank =
                        effectiveStarRank < 5
                          ? ((effectiveStarRank + 1) as StarRank)
                          : null;
                      const nextStats = nextRank
                        ? computeHeroCombatStats({
                            heroineName: companion.name,
                            starRank: nextRank,
                            level: effectiveRosterLevel,
                            awakenings: Math.min(4, effectiveAwakenings + 1),
                            isWounded: false,
                          })
                        : null;

                      const statRows = [
                        { label: "Max HP", cur: curStats.maxHp, nxt: nextStats?.maxHp },
                        { label: "Max MP", cur: curStats.maxMp, nxt: nextStats?.maxMp },
                        { label: "ATK", cur: curStats.atk, nxt: nextStats?.atk },
                        { label: "DEF", cur: curStats.def, nxt: nextStats?.def },
                        { label: "SPD", cur: curStats.spd, nxt: nextStats?.spd },
                        { label: "CRIT", cur: `${curStats.critRate}%`, nxt: nextStats ? `${nextStats.critRate}%` : undefined },
                        { label: "EVA", cur: `${curStats.evasion}%`, nxt: nextStats ? `${nextStats.evasion}%` : undefined },
                      ];

                      return (
                        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-indigo-500/30 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-white text-xs">
                              Combat Telemetry &amp; Star Ascension Scaling
                            </span>
                            {nextRank ? (
                              <span className="text-[10px] font-mono text-amber-300">
                                Preview: {effectiveStarRank}★ → {nextRank}★ (Cap Lv.{getStarLevelCap(nextRank)})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-amber-300 font-bold">
                                MAX 5★ SOVEREIGN CAP REACHED
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                            {statRows.map((st) => (
                              <div
                                key={st.label}
                                className="p-2 rounded-xl bg-black/50 border border-white/10 flex flex-col"
                              >
                                <span className="text-[9px] text-zinc-400 uppercase">
                                  {st.label}
                                </span>
                                <span className="font-bold text-white">
                                  {st.cur}
                                  {st.nxt !== undefined && (
                                    <span className="text-emerald-300 text-[10px] ml-1">
                                      → {st.nxt}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4-MOVE OC SKILL KIT */}
                    {starfallDossier?.skillKit && (
                      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2.5">
                        <span className="font-bold text-white text-xs block">
                          Signature Tactical &amp; Swap Kit
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          {[
                            { slot: "Basic", move: starfallDossier.skillKit.basicAttack },
                            { slot: "Active Skill", move: starfallDossier.skillKit.activeSkill },
                            { slot: "Tag-Swap Assist", move: starfallDossier.skillKit.tagAssistSkill },
                            {
                              slot:
                                compAffection >= 50 || effectiveAwakenings >= 2
                                  ? "Bond Special (Unlocked)"
                                  : "Bond Special (50% Bond)",
                              move: starfallDossier.skillKit.bondSpecial,
                            },
                          ].map(({ slot, move }) => (
                            <div
                              key={move.id}
                              className="p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-1"
                            >
                              <div className="flex items-center justify-between gap-1 font-mono">
                                <span className="font-bold text-indigo-200 text-[11px] truncate">
                                  {move.name}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 shrink-0">
                                  {slot}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 leading-snug">
                                {move.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Café Shop Role Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Assigned Role: {resolvedRole}</h4>
                        <span className="text-[10px] text-zinc-400">The Stray Anchor Shift Staff</span>
                      </div>
                    </div>
                    {onSelectRole && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold">
                        Configurable
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Preferred assignment: {dossier?.preferredShopRole || "FLOOR_HOST"}. Heroines assigned to their
                    preferred role generate +25% bonus shift revenue and trigger special customer dialogue events!
                  </p>
                </div>

                {/* Upstairs Room Details */}
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-sky-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {dossier?.isBoardingHouseTenant
                          ? `Upstairs Tenant — ${roomInfo.name}`
                          : "Non-Tenant Island Resident"}
                      </h4>
                      <span className="text-[10px] text-sky-300">
                        {dossier?.isBoardingHouseTenant ? `Room ${roomInfo.roomNumber}` : "Private Residence"}
                      </span>
                    </div>
                  </div>
                  {dossier?.isBoardingHouseTenant ? (
                    <div className="space-y-2 text-[11px] text-zinc-300 leading-relaxed">
                      <p>
                        Assigned room at The Stray Anchor. Default tenant: {roomInfo.defaultTenantName}.
                      </p>
                      <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-200 text-[10px]">
                        ✦ Room Perk: {roomInfo.perkDescription} (+{roomInfo.dailyRevenueBonus} Crowns/day)
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      This heroine currently resides in her own island estate or guild quarters. Raising her intimacy to
                      Rank 3 allows inviting her to move into the Stray Anchor upstairs boarding house!
                    </p>
                  )}
                </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 4: CORE MEMORIES */}
            {activeTab === "memories" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-zinc-400 text-[11px]">
                  Pivotal {isStarfall ? "battlefield and personal" : "romantic"} memories, cracks in{" "}
                  {possPronoun} armor, and heartfelt breakthroughs forged by your choices and actions throughout the
                  story.
                </p>

                {/* SECTION A: PLAYER-FORGED DYNAMIC STORY MEMORIES */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      Memories Forged by Your Choices
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {Array.isArray(companion.dynamicCoreMemories) ? companion.dynamicCoreMemories.length : 0} Forged
                    </span>
                  </div>

                  {Array.isArray(companion.dynamicCoreMemories) && companion.dynamicCoreMemories.length > 0 ? (
                    companion.dynamicCoreMemories.map((mem, idx) => (
                      <div
                        key={mem.id || idx}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-900/80 to-zinc-900/90 border border-rose-500/30 flex items-start gap-3 hover:border-rose-400/60 transition-colors"
                      >
                        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 shrink-0">
                          <Heart className="w-4 h-4 fill-rose-400/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-xs">{mem.title}</h4>
                            <div className="flex items-center gap-1.5">
                              {mem.location && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10">
                                  {mem.location}
                                </span>
                              )}
                              {typeof mem.turnUnlocked === "number" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40 font-mono">
                                  Turn {mem.turnUnlocked}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-200 mt-1 leading-relaxed">{mem.hint}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 text-[11px] text-zinc-400">
                      Make bold, charismatic choices, keep promises, or break through {companion.name}&apos;s guard in
                      dialogue to forge personal story memories together.
                    </div>
                  )}
                </div>

                {/* SECTION B: SIGNATURE HERO / HEROINE CORE MEMORIES */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Signature {isMale ? "Hero" : "Heroine"} Core Memories
                  </span>

                  {(() => {
                    const starfallSigIds =
                      isStarfall && starfallDossier?.signatureMemories
                        ? starfallDossier.signatureMemories.map((m) => m.id)
                        : [];
                    const canonicalIds = Array.from(
                      new Set([
                        ...starfallSigIds,
                        ...(!isStarfall ? dossier?.unlockedCoreMemories || [] : []),
                        ...(Array.isArray(companion.unlockedCoreMemories)
                          ? companion.unlockedCoreMemories
                          : []),
                      ])
                    );

                    if (canonicalIds.length === 0) {
                      return (
                        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500">
                          <BookOpen className="w-5 h-5 mx-auto mb-1.5 opacity-50" />
                          <span>
                            Spend time with {companion.name} to uncover {possPronoun} signature core memories!
                          </span>
                        </div>
                      );
                    }

                    return canonicalIds.map((memId, idx) => {
                      const sfMeta = starfallDossier?.signatureMemories?.find((m) => m.id === memId);
                      const memMeta = sfMeta ||
                        CORE_MEMORY_CATALOG[memId] || {
                          title: memId.replace(/_/g, " ").toUpperCase(),
                          hint: isStarfall
                            ? "A pivotal shared memory forged inside the Starfall Labyrinth."
                            : "An unforgettable moment on Port Solaris.",
                        };

                      const requiredAffection = idx === 0 ? 50 : 75;
                      const isDynamicallyUnlockedByStory =
                        Array.isArray(companion.unlockedCoreMemories) &&
                        companion.unlockedCoreMemories.includes(memId);
                      const isUnlockedByRankOrAffection =
                        idx === 0
                          ? isCharacterCardSecretUnlocked(
                              compAffection,
                              !isStarfall ? dossier?.intimacyRank ?? 1 : 1
                            )
                          : compAffection >= 75 || (!isStarfall && (dossier?.intimacyRank ?? 1) >= 4);
                      const isMemUnlocked = isDynamicallyUnlockedByStory || isUnlockedByRankOrAffection;

                      return (
                        <div
                          key={memId}
                          className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                            isMemUnlocked
                              ? "bg-zinc-900/80 border-white/10 hover:border-rose-400/40"
                              : "bg-zinc-900/40 border-white/5 opacity-80"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl border shrink-0 ${
                              isMemUnlocked
                                ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                                : "bg-zinc-800/70 border-white/10 text-amber-400"
                            }`}
                          >
                            {isMemUnlocked ? <Award className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-white text-xs">
                                {isMemUnlocked ? memMeta.title : `Locked Signature Memory #${idx + 1}`}
                              </h4>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded border ${
                                  isMemUnlocked
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                }`}
                              >
                                {isMemUnlocked ? "Unlocked" : `Requires ${requiredAffection}% or Story Trigger`}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                              {isMemUnlocked
                                ? memMeta.hint
                                : `Reach ${requiredAffection}% Heart Resonance with ${companion.name} or trigger this personal moment through your choices in the story.`}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
