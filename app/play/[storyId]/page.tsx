"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Heart, 
  MapPin, 
  Sparkles, 
  Compass, 
  User, 
  Shield, 
  Zap, 
  Sword, 
  Scroll, 
  X, 
  Play, 
  Map as MapIcon, 
  Navigation,
  Save,
  FolderOpen,
  Package,
  Users,
  RotateCcw,
  Edit3,
  Check,
  Key,
  Volume2,
  VolumeX,
  Terminal,
  Trash2,
  BookOpen,
  ArrowLeft,
  Camera,
  Download,
  RefreshCw,
  Upload,
  ChevronsUp,
  ChevronsDown,
  GitBranch,
  Share2,
  Swords,
  Dices,
  Lock,
  Eye,
  EyeOff,
  Gift,
  Skull,
  Cloud,
  Bell,
  Settings2,
  LayoutGrid,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Plus,
  Info,
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { 
  SystemState, 
  SystemToastNotification, 
  SystemQuest, 
  PlausibilityTier, 
  PenaltyScenarioState, 
  DeathRegressionRecord,
  TimelineScar,
  CausalCovenantState,
  CompanionFrictionState,
  CompanionRivalryRecord,
  ActiveStoryClashState
} from "@/types/system";
import { checkCovenantAvailability } from "@/lib/causalCovenant";
import dynamic from "next/dynamic";
import { resolveCampUltimatum } from "@/lib/companionFriction";
import { initiateStoryClash, resolveClashTurn } from "@/lib/storyClashEngine";
import { AcquisitionAlertData } from "@/components/AcquisitionNotification";
import { GameNotificationStack, GameNotificationItem } from "@/components/GameNotificationStack";
import { 
  saveGameSlot, 
  loadGameSlot, 
  loadAllGameSlots, 
  deleteGameSlot, 
  compressAvatarImage,
  appendPersistentTimelineEcho,
  appendPersistentDeathRegression,
  normalizeSaveSlotData
} from "@/lib/saveStorage";
import {
  SavedCharacterBlueprint,
  loadCharacterRoster,
  saveCharacterToRoster,
  deleteCharacterFromRoster,
  createBlueprintFromPlayer,
  normalizeCharacterBlueprint,
} from "@/lib/characterRosterStorage";
import { StoryCompanion, StoryContext, VisitedStoryNode, AbilityDetail, TimelineEcho, RelicUnsealingCondition, RelicAwakenedForm, CharacterVisualDNA, HeroineGuardTier, CompanionCoreMemory } from "@/types/story";
import { ensureRelicUnsealingCondition, ensureInventoryRelicConditions, updateInventoryUnsealingProgress, awakenRelicItem } from "@/lib/relicAwakening";
import { SectorClashHud, ClashCombatPopup, ClashVisualHitEvent } from "@/components/play/SectorClashHud";
import { CharacterCardModal } from "@/components/play/CharacterCardModal";
import {
  isExplicitlyNudeOrUnclad,
  isFallbackVisualDescription,
  resolvePortraitAttireLabel,
} from "@/lib/visionEncoder";
import { MobileCommandSheet } from "@/components/play/MobileCommandSheet";
import { ActionInputBar } from "@/components/play/ActionInputBar";
import { ChatMessageItem } from "@/components/play/ChatMessageItem";
import {
  evaluateDeathAndRegression,
  CURSED_RELIC_TABLE,
  CAMP_GIFT_CATALOG,
  CombatStanceType,
  detectContextualEquipmentAcquisition,
  calculateEarnedAffectionDelta,
  synthesizeDynamicCompanionSentiment,
  evaluateDynamicCoreMemoryUnlock,
  getHeroineResistanceProfile,
  calibrateQuestRankAndRewards,
  clampTurnProgressionDeltas,
  BASE_LEVEL_ONE_MAX_EXP,
  getRequiredExpForLevel,
  resolveProtagonistExpGain,
  resolveCompanionExpGain,
  calculateClashVictoryExp,
} from "@/lib/progressionMechanics";
import { evaluateRelicSynergies } from "@/lib/relicSynergies";
import { decodeMultiverseSeed } from "@/lib/multiverseShare";
import { getStoryById } from "@/lib/storyStorage";
import { ASTRA_CHRONICLES_STORY } from "@/lib/defaultStory";
import {
  saveCodexScene,
  findSceneForContext,
  saveCodexLoot,
  getCodexLootByItem,
  hydrateInventoryItems,
} from "@/lib/codexStorage";
import { processImageUpload } from "@/lib/imageUtils";
import { validateKeyClientSide } from "@/lib/clientKeyValidation";
import { ScreenTransitionOverlay, ScreenTransitionConfig } from "@/components/ScreenTransitionOverlay";
import { GeneratedGearPiece } from "@/app/api/generate-starting-gear/route";
import { getNarrationStyleBadge } from "@/lib/narrationStyles";
import { CloudSyncModal } from "@/components/CloudSyncModal";
import { WorldGuidebookModal } from "@/components/WorldGuidebookModal";
import { triggerBackgroundCloudSync, downloadAstraBundleFile } from "@/lib/crossSaveEngine";
import {
  LlmConfig,
  DEFAULT_LLM_CONFIG,
  getStoredLlmConfig,
  saveStoredLlmConfig,
  LlmQuickPill,
  CLOUD_MODELS,
  LlmProviderModal,
} from "@/components/LlmProviderSelector";
import { SystemQuestModal } from "@/components/SystemQuestModal";
import { NotificationHistoryModal } from "@/components/NotificationHistoryModal";
import { WorldShareModal } from "@/components/WorldShareModal";
import { PortraitEditorModal } from "@/components/play/PortraitEditorModal";
import { GearManifestScreen } from "@/components/play/GearManifestScreen";
import {
  GENDER_PRESETS,
  GenderPreset,
  WORLD_ORIGIN_PRESETS,
  WorldOriginPreset,
  PERSONALITY_PRESETS,
  PersonalityPreset,
  analyzeChoiceVector,
  getDominantTendencyLabel,
  buildPersonalityFallbackChoices,
} from "@/lib/personalityArchitect";
import {
  isValidTacticalChoice,
  sanitizeAndFilterChoices,
} from "@/lib/proseSanitizer";
import {
  SOVEREIGN_ORIGIN_PRESETS,
  SOVEREIGN_CONDUIT_PRESETS,
  SOVEREIGN_HEROINE_DOSSIERS,
  SovereignOriginPreset,
  SovereignConduitPreset,
  SovereignOrigin,
  ConduitType,
  PatronWing,
} from "@/types/sovereign_spire";
import {
  PORT_SOLARIS_ORIGIN_PRESETS,
  PORT_SOLARIS_CONDUIT_PRESETS,
  PORT_SOLARIS_HEROINE_DOSSIERS,
  PortSolarisOriginPreset,
  PortSolarisConduitPreset,
  PortSolarisOrigin,
  FlairConduit,
  IslandFaction,
  BoardingHouseState,
  KeepsakeItem,
  ShopRole,
} from "@/types/port_solaris";
import {
  resolveSpotlightCompanion,
  isCompanionSpotlighted,
  getStageSpriteClasses,
  getStageHeroineAura,
  getAffectionBpmCeiling,
  getBpmZone,
  createInitialBoardingHouseState,
  createInitialFactionStandings,
  PORT_SOLARIS_CANONICAL_KEEPSAKES,
  buildPortSolarisRomanceMilestoneQuest,
  paydownDebt,
  calculateDailyCafeRevenue,
} from "@/lib/portSolarisEngine";
import {
  STARFALL_HEROINE_DOSSIERS,
  StarfallOriginPreset,
  StarfallOrigin,
  StarfallRole,
  StarfallFaction,
  StarRank,
  HeroStatus,
  FormationSlot,
  HeroCombatStats,
  LabyrinthState,
} from "@/types/starfall_labyrinth";
import {
  MAX_DEPLOYED_PARTY,
  SummonPullResult,
  isStarfallLobbyLocation,
  inferFloorFromLocation,
  getFloorType,
  getFloorTypeLabel,
  getStarLevelCap,
  matchesHeroineName,
  createInitialLabyrinthState,
  applyAwakening,
  clampProtagonistStarLevel,
  syncRosterWithParty,
} from "@/lib/starfallEngine";
import {
  getTowerThemeForFloor,
  getStarfallFloorBackgroundUrl,
} from "@/lib/starfallTowerThemes";
import {
  getWorldPresets,
  hasCustomWorldPresets,
  AnyWorldOriginPreset,
  AnyWorldConduitPreset,
} from "@/lib/worldRegistry";
import { SummonModal } from "@/components/play/SummonModal";
import { StarfallBarracksModal } from "@/components/play/StarfallBarracksModal";
import { StarfallTacticalCombatHud } from "@/components/play/StarfallTacticalCombatHud";
import { GameOverModal } from "@/components/play/GameOverModal";

// Dynamic code splitting for heavy interactive canvas graph
const FlowchartViewer = dynamic(
  () => import("@/components/FlowchartViewer").then((m) => m.FlowchartViewer),
  { ssr: false }
);

export interface InventoryItem {
  id: string;
  name: string;
  type: "weapon" | "armor" | "relic" | "consumable" | "material";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  description: string;
  effect?: string;
  imageUrl?: string;
  isGiftable?: boolean;
  isAwakened?: boolean;
  unsealingCondition?: RelicUnsealingCondition;
  awakenedForm?: RelicAwakenedForm;
}

export interface Companion {
  id?: string;
  name: string;
  title: string;
  role?: string;
  gender?: "female" | "male" | "non-binary";
  color: string;
  personality?: string;
  values?: string[];
  dislikes?: string[];
  highCompatibility?: string[];
  guardTier?: HeroineGuardTier;
  unlockedCoreMemories?: string[];
  dynamicCoreMemories?: CompanionCoreMemory[];
  currentSentiment?: string;
  trustProgress?: number;
  armorCrackCount?: number;
  baseAffection?: number;
  affection: number;
  heartRateBpm?: number;
  affectionLevel?: number;
  romancePath?: string;
  expressionKey: string;
  isPresent: boolean;
  encountered: boolean;
  relationshipStage?: "stranger" | "acquaintance" | "confidant" | "beloved" | "sworn_partner" | string;
  intimacyUnlocked?: boolean;
  milestonesReached?: number[];
  bespokeRomanceCgUrl?: string;
  seed?: number;
  baseImageUrl?: string;
  visualPrompt?: string;
  expressions?: Record<string, string>;
  starRank?: StarRank;
  baseStarRank?: StarRank;
  level?: number;
  exp?: number;
  maxExp?: number;
  heroStatus?: HeroStatus;
  formationSlot?: FormationSlot;
  combatStats?: HeroCombatStats;
  currentHp?: number;
  currentMp?: number;
  awakenings?: number;
  fallenOnFloor?: number;
  fallenCause?: string;
}

interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
  str: number;
  dex: number;
  int: number;
}

interface PlayerProfile {
  name: string;
  role: string;
  gender?: string;
  age?: string;
  worldOrigin?: string;
  worldOriginDetails?: string;
  race?: string;
  racialTraits?: string[];
  level: number;
  stats: PlayerStats;
  gear: { weapon: string; armor: string; relic: string };
  gearImages?: Record<string, string>;
  abilities: string[];
  abilityDetails?: Record<string, AbilityDetail>;
  inventory: InventoryItem[];
  gold?: number;
  deathCount?: number;
  activeStance?: CombatStanceType;
  narrationStyle?: string;
  visualDescription?: string;
  visualDna?: CharacterVisualDNA;
  personality?: string;
  personalityTraits?: string[];
  behavioralTendencies?: Record<string, number>;
  pinnedMemories?: string[];
  unspentStatPoints?: number;
  sovereignOrigin?: SovereignOrigin | PortSolarisOrigin | StarfallOrigin;
  conduit?: ConduitType | FlairConduit | StarfallRole;
  patronWing?: PatronWing | IslandFaction | StarfallFaction;
  matriculationRank?: number;
  semesterDebtQuota?: number;
  boardingHouse?: BoardingHouseState;
  factionStanding?: Record<IslandFaction, number>;
  equippedKeepsakes?: KeepsakeItem[];
  labyrinthState?: LabyrinthState;
  starRank?: StarRank;
}

interface RoleplayState {
  speaker: string;
  dialogue: string;
  location: string;
  mood: string;
  bgImage: string;
  presentCompanions: string[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "character";
  speakerName: string;
  text: string;
  mechanics?: string | null;
  vitalsImpact?: {
    hpDelta: number;
    mpDelta: number;
    reason?: string | null;
  } | null;
  timestamp: string;
  avatarSrc?: string;
  isPending?: boolean;
}

interface SaveSlotData {
  slotId: number;
  savedAt: string;
  player: PlayerProfile;
  playerAvatar: string | null;
  gameState: RoleplayState;
  party: Companion[];
  memories: string[];
  chatLog: ChatMessage[];
  systemState?: SystemState;
  storyId?: string;
  storyTitle?: string;
  choices?: string[];
  visitedNodes?: VisitedStoryNode[];
  selectedPrologueId?: string;
  narrationStyle?: string;
  unlockedCompanions?: string[];
  timelineScars?: TimelineScar[];
  covenantState?: CausalCovenantState;
  frictionState?: CompanionFrictionState;
  activeClash?: ActiveStoryClashState | null;
}

// ------------------------------------------------------------------
// SPRITE MAPPINGS
// ------------------------------------------------------------------
const ARIA_EXPRESSIONS: Record<string, string> = {
  neutral: "/characters/aria/aria_neutral.png",
  intrigued: "/characters/aria/aria_intrigued.png",
  flustered: "/characters/aria/aria_flustered.png",
  smug: "/characters/aria/aria_smug.png",
  surprised: "/characters/aria/aria_shocked.png",
  combat_ready: "/characters/aria/aria_combat.png",
  dangerous: "/characters/aria/aria_combat.png", 
  hurt: "/characters/aria/aria_hurt.png",
};

const EVELYN_EXPRESSIONS: Record<string, string> = {
  neutral: "/characters/evelyn/evelyn_neutral.png",
  intrigued: "/characters/evelyn/evelyn_intrigued.png",
  flustered: "/characters/evelyn/evelyn_flustered.png",
  smug: "/characters/evelyn/evelyn_smug.png",
  surprised: "/characters/evelyn/evelyn_shocked.png",
  combat_ready: "/characters/evelyn/evelyn_combat.png",
  dangerous: "/characters/evelyn/evelyn_combat.png",
  hurt: "/characters/evelyn/evelyn_hurt.png",
};

const SERENA_EXPRESSIONS: Record<string, string> = {
  neutral: "/characters/serena/serena_neutral.png",
  intrigued: "/characters/serena/serena_intrigued.png",
  flustered: "/characters/serena/serena_flustered.png",
  smug: "/characters/serena/serena_smug.png",
  surprised: "/characters/serena/serena_shocked.png",
  combat_ready: "/characters/serena/serena_combat.png",
  dangerous: "/characters/serena/serena_combat.png",
  hurt: "/characters/serena/serena_hurt.png",
};

const MORGANA_EXPRESSIONS: Record<string, string> = {
  neutral: "/characters/morgana/morgana_neutral.png",
  intrigued: "/characters/morgana/morgana_intrigued.png",
  flustered: "/characters/morgana/morgana_flustered.png",
  smug: "/characters/morgana/morgana_smug.png",
  surprised: "/characters/morgana/morgana_intrigued.png",
  combat_ready: "/characters/morgana/morgana_combat.png",
  dangerous: "/characters/morgana/morgana_combat.png",
  hurt: "/characters/morgana/morgana_hurt.png",
  beckon: "/characters/morgana/morgana_beckon.png",
};

const PERCI_EXPRESSIONS: Record<string, string> = {
  neutral: "/characters/perci/perci_neutral.png",
  intrigued: "/characters/perci/perci_intrigued.png",
  flustered: "/characters/perci/perci_flustered.png",
  smug: "/characters/perci/perci_smug.png",
  surprised: "/characters/perci/perci_shocked.png",
  combat_ready: "/characters/perci/perci_combat.png",
  dangerous: "/characters/perci/perci_combat.png",
  hurt: "/characters/perci/perci_hurt.png",
};

const DEFAULT_FALLBACK_SPRITE = "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80";

// ------------------------------------------------------------------
// BACKGROUND LOOKUPS
// ------------------------------------------------------------------
const LOCATION_BACKGROUNDS: Record<string, string> = {
  "Imperial Capital Imperium": "/backgrounds/imperial_capital_imperium.jpg",
  "Bloodrose Duchy": "/backgrounds/bloodrose_duchy.jpg",
  "Gray Zone": "/backgrounds/gray_zone.jpg",
  "Mage Tower": "/backgrounds/mage_tower.jpg",
  "Port City Fortus": "/backgrounds/port_city.jpg",
  "Archon Spire Vault": "/backgrounds/mage_tower.jpg",
  "Silvanes": "/backgrounds/imperial_capital_imperium.jpg",
  "Astra Leyline Rift": "/backgrounds/gray_zone.jpg",
  "Ashen Cathedral": "/backgrounds/bloodrose_duchy.jpg",
  "Demon Realm Border": "/backgrounds/gray_zone.jpg",
  "The Seal-Gate & Boarding Quays": "/backgrounds/sovereign-spire/seal_gate.jpg",
  "The Crucible": "/backgrounds/sovereign-spire/the_crucible.jpg",
  "The Glass Conservatory": "/backgrounds/sovereign-spire/glass_conservatory.jpg",
  "The Gilded Exchange": "/backgrounds/sovereign-spire/gilded_exchange.jpg",
  "The Velvet Spill & The Tribunal Pit": "/backgrounds/sovereign-spire/velvet_spill.jpg",
  "The Sky-Crown & Sovereign Terraces": "/backgrounds/sovereign-spire/sky_crown.jpg",
  "Stratum I: The Sunken Cloisters": "/backgrounds/sovereign-spire/seal_gate.jpg",
  "Stratum II: The Weeping Ossuary": "/backgrounds/sovereign-spire/velvet_spill.jpg",
  "Stratum III: The Chronos Scars": "/backgrounds/sovereign-spire/glass_conservatory.jpg",
  "Stratum IV: The Pulse": "/backgrounds/sovereign-spire/sky_crown.jpg",
  "Driftwood Cove (The Stray Anchor)": "/backgrounds/port-solaris/stray_anchor.jpg",
  "The Breakers Boardwalk & South Beach": "/backgrounds/port-solaris/breakers_boardwalk.jpg",
  "The Sunset Rambla": "/backgrounds/port-solaris/sunset_rambla.jpg",
  "The Campus Terrace (Solaris University)": "/backgrounds/port-solaris/campus_terrace.jpg",
  "The Platinum Cliffs": "/backgrounds/port-solaris/platinum_cliffs.jpg",
  "The Stray Anchor: Upstairs Boarding House & Rooftop Terrace": "/backgrounds/port-solaris/stray_anchor.jpg",
  "The Old Pier Arcade & Night Market": "/backgrounds/port-solaris/breakers_boardwalk.jpg",
  // Starfall Labyrinth — Floating Lobby Island & 100-Floor Tower Strata
  "Star Gate Plaza (Main Lobby)": "/backgrounds/starfall-labyrinth/star_gate_plaza.jpg",
  "The Iron Barracks (Lobby Quarters)": "/backgrounds/starfall-labyrinth/roster_barracks.jpg",
  "The Memorial Wall (Lobby Ossuary)": "/backgrounds/starfall-labyrinth/memorial_sanctum.jpg",
  "The Master's Conduit Chamber": "/backgrounds/starfall-labyrinth/masters_console.jpg",
  "Floor 1: The Verdant Antechamber": "/backgrounds/starfall-labyrinth/verdant_antechamber.jpg",
  "Floor 5: Safe Zone Lantern Bazaar": "/backgrounds/starfall-labyrinth/safe_zone_bazaar.jpg",
  "Floor 10: Gate of the Hollow King": "/backgrounds/starfall-labyrinth/hollow_king_gate.jpg",
  "Stratum I: The Sunken Reliquary (Floors 1–25)": "/backgrounds/starfall-labyrinth/sunken_reliquary.jpg",
  "Floor 25: Chronos Clocktower Ruins": "/backgrounds/starfall-labyrinth/clocktower_ruins.jpg",
  "Stratum II: The Chronos Foundry (Floors 26–50)": "/backgrounds/starfall-labyrinth/chronos_foundry.jpg",
  "Floor 40: Cinder Horizon & Unwound Sun Gate": "/backgrounds/starfall-labyrinth/cinder_horizon_gate.jpg",
  "Upper Safe Zone: Lantern Broker Sky-Sanctum": "/backgrounds/starfall-labyrinth/lantern_sky_oasis.jpg",
  "Stratum III: The Eclipse Sanctum (Floors 51–75)": "/backgrounds/starfall-labyrinth/eclipse_sanctum.jpg",
  "Floor 70: Blood-Moon Viaduct & Crimson Trial Court": "/backgrounds/starfall-labyrinth/crimson_trial_court.jpg",
  "Stratum IV: The Astral Singularity (Floors 76–99)": "/backgrounds/starfall-labyrinth/astral_singularity.jpg",
  "Floor 100: Throne of the Administrator": "/backgrounds/starfall-labyrinth/administrators_crown.jpg",
};

const DEFAULT_BG = "/backgrounds/imperial_capital_imperium.jpg";

export const RACE_PRESETS = [
  {
    id: "human",
    name: "Human",
    shortLabel: "Human",
    icon: "🛡️",
    defaultTraits: ["Adaptable physiology", "Expressive gaze"],
    description: "Resolute mortal lineage with high versatility.",
  },
  {
    id: "lycan",
    name: "Lycan / Beastkin",
    shortLabel: "Lycan",
    icon: "🐺",
    defaultTraits: ["Canine ears & fangs", "Dense lupine fur", "Heightened olfactory tracking", "Predatory posture"],
    description: "Lupine shapeshifter with razor fangs, thick pelt, and predatory senses.",
  },
  {
    id: "elf",
    name: "High Elf",
    shortLabel: "High Elf",
    icon: "🧝",
    defaultTraits: ["Elongated pointed ears", "Ethereal luminescence", "Refined noble cheekbones"],
    description: "Ancient graceful kin attuned to ambient ether and astral leylines.",
  },
  {
    id: "demonkin",
    name: "Demonkin",
    shortLabel: "Demonkin",
    icon: "😈",
    defaultTraits: ["Curved obsidian horns", "Glowing slit pupils", "Pointed fangs", "Barbed tail"],
    description: "Abyssal heritage bearing demonic horns, fiery eyes, and infernal resilience.",
  },
  {
    id: "dragonborn",
    name: "Dragonborn",
    shortLabel: "Dragonkin",
    icon: "🐉",
    defaultTraits: ["Fine draconic scales", "Reptilian slit irises", "Horns and crest", "Radiant body heat"],
    description: "Primordial drake lineage boasting armored scales and draconic majesty.",
  },
  {
    id: "vampire",
    name: "Vampire",
    shortLabel: "Vampire",
    icon: "🧛",
    defaultTraits: ["Elongated predatory fangs", "Pallid moonlit skin", "Crimson irises", "Cold noble bearing"],
    description: "Nocturnal bloodborn predator possessing unearthly allure and predatory fangs.",
  },
  {
    id: "custom",
    name: "Custom Lineage",
    shortLabel: "Custom",
    icon: "✨",
    defaultTraits: [],
    description: "Define your own unique species and anatomical physiology.",
  },
];

/**
 * Silently pre-caches companion expression sprites and key location backgrounds
 * into the browser cache during idle time to prevent blank flashes or image pop-in during dialogue.
 */
function preloadStoryAssets(): void {
  if (typeof window === "undefined") return;

  const runPreload = () => {
    const allUrls = [
      ...Object.values(ARIA_EXPRESSIONS),
      ...Object.values(EVELYN_EXPRESSIONS),
      ...Object.values(SERENA_EXPRESSIONS),
      ...Object.values(MORGANA_EXPRESSIONS),
      ...Object.values(PERCI_EXPRESSIONS),
      ...Object.values(LOCATION_BACKGROUNDS),
    ];

    const uniqueUrls = Array.from(new Set(allUrls.filter(Boolean)));
    uniqueUrls.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(runPreload, { timeout: 2000 });
  } else {
    setTimeout(runPreload, 300);
  }
}

/**
 * Normalizes system state, heals improperly completed quests, and deduplicates quests & directives.
 */
function normalizeSystemState(raw?: SystemState | null, playerLevel: number = 1): SystemState {
  if (!raw) {
    return {
      plausibility: 80,
      plausibilityTier: "Stable",
      activeQuests: [],
      completedQuests: [],
      systemDirectives: ["Administrator protocol engaged. Causal anchor established at 80%."],
    };
  }

  const activeQuests = Array.isArray(raw.activeQuests) ? [...raw.activeQuests] : [];
  const completedQuests = Array.isArray(raw.completedQuests) ? [...raw.completedQuests] : [];

  // Self-heal: If any quest in completedQuests was not claimed and has incomplete objectives, restore it to active
  const restoredQuests: SystemQuest[] = [];
  const validCompleted: SystemQuest[] = [];

  for (const q of completedQuests) {
    if (!q || !q.title) continue;
    const calibratedQ = calibrateQuestRankAndRewards(q, { playerLevel });
    const objs = Array.isArray(calibratedQ.objectives) ? calibratedQ.objectives : [];
    const allDone = objs.length === 0 || objs.every((o) => o && o.completed);
    if (!calibratedQ.isClaimed && !allDone && objs.length > 1) {
      // It was prematurely completed while having pending objectives
      restoredQuests.push({ ...calibratedQ, status: "active" });
    } else {
      const normalizedItem: SystemQuest = {
        ...calibratedQ,
        status: "completed",
        objectives: objs.map((o) => ({ ...o, completed: true })),
      };
      const qIdKey = (calibratedQ.id || "").toLowerCase().trim();
      const qTitleKey = (calibratedQ.title || "").toLowerCase().trim();
      const existingIdx = validCompleted.findIndex(
        (existing) =>
          (qIdKey && (existing.id || "").toLowerCase().trim() === qIdKey) ||
          (qTitleKey && (existing.title || "").toLowerCase().trim() === qTitleKey)
      );
      if (existingIdx !== -1) {
        // Merge duplicate completed quest (preserve claimed status if either copy was claimed)
        validCompleted[existingIdx] = {
          ...validCompleted[existingIdx],
          isClaimed: Boolean(validCompleted[existingIdx].isClaimed || normalizedItem.isClaimed),
        };
      } else {
        validCompleted.push(normalizedItem);
      }
    }
  }

  // Deduplicate activeQuests and exclude any quest already present in validCompleted
  const dedupedActive: SystemQuest[] = [];
  for (const q of [...activeQuests, ...restoredQuests]) {
    if (!q || !q.title) continue;
    const calibratedQ = calibrateQuestRankAndRewards(q, { playerLevel });
    const qIdKey = (calibratedQ.id || "").toLowerCase().trim();
    const qTitleKey = (calibratedQ.title || "").toLowerCase().trim();

    const alreadyCompleted = validCompleted.some(
      (c) =>
        (qIdKey && (c.id || "").toLowerCase().trim() === qIdKey) ||
        (qTitleKey && (c.title || "").toLowerCase().trim() === qTitleKey)
    );
    if (alreadyCompleted) continue;

    const alreadyActive = dedupedActive.some(
      (a) =>
        (qIdKey && (a.id || "").toLowerCase().trim() === qIdKey) ||
        (qTitleKey && (a.title || "").toLowerCase().trim() === qTitleKey)
    );
    if (alreadyActive) continue;

    const objs = Array.isArray(calibratedQ.objectives) ? calibratedQ.objectives : [];
    const allDone = objs.length > 0 && objs.every((o) => o && o.completed);
    dedupedActive.push({
      ...calibratedQ,
      status: allDone ? ("completed" as const) : ("active" as const),
    });
  }

  // Deduplicate directives across the log
  const rawDirs = Array.isArray(raw.systemDirectives) ? raw.systemDirectives : [];
  const dedupedDirs: string[] = [];
  const seenDirs = new Set<string>();
  for (const dir of rawDirs) {
    if (!dir || typeof dir !== "string") continue;
    const trimmed = dir.trim();
    const key = trimmed.toLowerCase();
    if (!seenDirs.has(key)) {
      seenDirs.add(key);
      dedupedDirs.push(trimmed);
    }
  }

  return {
    ...raw,
    activeQuests: dedupedActive,
    completedQuests: validCompleted,
    systemDirectives: dedupedDirs.slice(0, 40),
  };
}

// ------------------------------------------------------------------
// CONTINENT REGIONS MAP
// ------------------------------------------------------------------
const CONTINENT_REGIONS = [
  {
    name: "Imperial Capital Imperium",
    zone: "Baltia Empire",
    danger: "Low (Imperial Guard & Mage Tower)",
    description: "The fortified seat of the Baltia Empire, centered around the soaring Mage Tower overlooking the central plains.",
  },
  {
    name: "Bloodrose Duchy",
    zone: "Western Heartland",
    danger: "Moderate (Noble Conspiracies)",
    description: "Rolling estate plains carpeted in deep crimson flora and ancient aristocratic bloodline manors.",
  },
  {
    name: "Mage Tower",
    zone: "Imperial Sanctuaries",
    danger: "Guarded (Archon Wards)",
    description: "The colossal spire humming with concentrated celestial conduits, holding forbidden archives and teleportation circles.",
  },
  {
    name: "Port City Fortus",
    zone: "Southern Maritime",
    danger: "Moderate (Smugglers & Corsairs)",
    description: "A bustling stone dock city situated along the southern coast, where maritime trade meets underworld aether contraband.",
  },
  {
    name: "Silvanes",
    zone: "The Great Canopy",
    danger: "High (Primeval Beasts)",
    description: "An ancient, colossal canopy forest separating the Baltia Empire from the northern frontiers.",
  },
  {
    name: "Gray Zone",
    zone: "Eastern Borderlands",
    danger: "Deadly (Desolation & Corruption)",
    description: "A cracked, desiccated badlands forming the barren buffer right outside the volcanic Demon Realm.",
  },
];

export default function VisualNovelGame() {
  const params = useParams();
  const router = useRouter();
  const storyId = (params?.storyId as string) || "astra-chronicles";

  const [currentStory, setCurrentStory] = useState<StoryContext>(ASTRA_CHRONICLES_STORY);
  const [storyLoaded, setStoryLoaded] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [narrationStyle, setNarrationStyle] = useState("Grimdark & Atmospheric");
  const [selectedPrologue, setSelectedPrologue] = useState(0);

  // Neural Engine LLM Routing State
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(DEFAULT_LLM_CONFIG);
  const [showLlmModal, setShowLlmModal] = useState<boolean>(false);

  // Pre-Send Protagonist Action Drafting State
  const [isDraftingAction, setIsDraftingAction] = useState<boolean>(false);
  const [draftingChoiceIdx, setDraftingChoiceIdx] = useState<number | null>(null);
  const [draftActionText, setDraftActionText] = useState<string>("");
  const [draftActionVersion, setDraftActionVersion] = useState<number>(0);

  // Immersion & Transition States
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState<{
    location: string;
    speaker: string;
    quote: string;
  } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [statPoints, setStatPoints] = useState(10);
  const [gearPreference, setGearPreference] = useState<"system" | "canon" | "none">("system");
  const [selectedSovereignConduit, setSelectedSovereignConduit] = useState<string>("iron_chancellery_somatic");
  const [creationTab, setCreationTab] = useState<"identity" | "origin" | "conduit" | "prologue">("identity");
  const [showRosterDrawer, setShowRosterDrawer] = useState<boolean>(false);
  const [showWorldGuidebook, setShowWorldGuidebook] = useState<boolean>(false);

  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [fullPortraitViewer, setFullPortraitViewer] = useState<{
    imageUrl: string;
    name: string;
    subtitle?: string;
    canEdit?: boolean;
  } | null>(null);
  const [player, setPlayer] = useState<PlayerProfile>({
    name: "Caelen",
    role: "",
    gender: "Male",
    age: "22",
    worldOrigin: "Born & Raised (Native)",
    worldOriginDetails: WORLD_ORIGIN_PRESETS[0].defaultDetails,
    race: "Human",
    racialTraits: ["Adaptable physiology", "Expressive gaze"],
    personality: "Stoic Pragmatist",
    personalityTraits: ["Calculated", "Unflinching", "Efficient", "Vigilant"],
    behavioralTendencies: {},
    pinnedMemories: [],
    unspentStatPoints: 0,
    level: 1,
    stats: { hp: 100, maxHp: 100, mp: 60, maxMp: 60, exp: 0, maxExp: BASE_LEVEL_ONE_MAX_EXP, str: 10, dex: 10, int: 10 },
    gear: { weapon: "Pending...", armor: "Pending...", relic: "None" },
    abilities: [],
    abilityDetails: {},
    inventory: [],
  });
  const [selectedGenderPreset, setSelectedGenderPreset] = useState<string>("male");
  const [selectedWorldOriginPreset, setSelectedWorldOriginPreset] = useState<string>("native");
  const [selectedRacePreset, setSelectedRacePreset] = useState<string>("human");
  const [racialTraitsInput, setRacialTraitsInput] = useState<string>("Adaptable physiology, Expressive gaze");
  const [selectedPersonalityPreset, setSelectedPersonalityPreset] = useState<string>("stoic");
  const [personalityTraitsInput, setPersonalityTraitsInput] = useState<string>("Calculated, Unflinching, Efficient, Vigilant");
  const playerRef = useRef<PlayerProfile>(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  const isHydratingInventoryRef = useRef<boolean>(false);

  // Live EXP Gain & Visual Feedback State
  const [expFeedback, setExpFeedback] = useState<{ amount: number; reason?: string | null; id: number } | null>(null);
  const expFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerExpFeedback = useCallback((amount: number, reason?: string | null) => {
    if (amount <= 0) return;
    if (expFeedbackTimeoutRef.current) {
      clearTimeout(expFeedbackTimeoutRef.current);
    }
    setExpFeedback({ amount, reason: reason || null, id: Date.now() });
    expFeedbackTimeoutRef.current = setTimeout(() => {
      setExpFeedback(null);
    }, 3400);
  }, []);

  const applyExpProgression = useCallback((
    currentPlayer: PlayerProfile,
    expGained: number,
    opts?: { restoreVitalsOnLevelUp?: boolean; storyIdOverride?: string }
  ): { updatedPlayer: PlayerProfile; levelsGained: number; newLevel: number; hitLevelCap: boolean } => {
    const effectiveStoryId = opts?.storyIdOverride || currentStory?.id;
    const starCap =
      effectiveStoryId === "starfall-labyrinth"
        ? getStarLevelCap(currentPlayer.labyrinthState?.protagonistStarRank || currentPlayer.starRank || 1)
        : 60;

    const res = resolveProtagonistExpGain({
      level: currentPlayer.level,
      exp: currentPlayer.stats.exp,
      maxExp: currentPlayer.stats.maxExp,
      hp: currentPlayer.stats.hp,
      maxHp: currentPlayer.stats.maxHp,
      mp: currentPlayer.stats.mp,
      maxMp: currentPlayer.stats.maxMp,
      str: currentPlayer.stats.str,
      dex: currentPlayer.stats.dex,
      int: currentPlayer.stats.int,
      unspentStatPoints: currentPlayer.unspentStatPoints || 0,
      expGained,
      maxLevelCap: starCap,
      restoreVitalsOnLevelUp: opts?.restoreVitalsOnLevelUp ?? true,
    });

    const updatedPlayer: PlayerProfile = {
      ...currentPlayer,
      level: res.level,
      unspentStatPoints: res.unspentStatPoints,
      stats: {
        ...currentPlayer.stats,
        exp: res.exp,
        maxExp: res.maxExp,
        hp: res.hp,
        maxHp: res.maxHp,
        mp: res.mp,
        maxMp: res.maxMp,
        str: res.str,
        dex: res.dex,
        int: res.int,
      },
    };

    return {
      updatedPlayer,
      levelsGained: res.levelsGained,
      newLevel: res.level,
      hitLevelCap: res.hitLevelCap,
    };
  }, [currentStory?.id]);

  const [isRollingAbilities, setIsRollingAbilities] = useState(false);
  const [inspectedAbility, setInspectedAbility] = useState<AbilityDetail | null>(null);

  const handleRollAbilities = async () => {
    if (isRollingAbilities) return;
    setIsRollingAbilities(true);
    soundEffects.playClick();

    try {
      const res = await fetch("/api/generate-abilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          role: player.role || "Adventurer",
          name: player.name || "Protagonist",
          genre: currentStory.genre || "Grimdark LitRPG",
          settingName: currentStory.worldContext?.settingName || "Astra Continent",
          userAccessKey: accessKey,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.abilities) && data.abilities.length > 0) {
        soundEffects.playQuestComplete();
        const newAbilityNames = data.abilities.map((a: AbilityDetail) => a.name);
        const newDetailsMap: Record<string, AbilityDetail> = {};
        data.abilities.forEach((a: AbilityDetail) => {
          newDetailsMap[a.name] = a;
        });

        const nextPlayer = {
          ...player,
          abilities: newAbilityNames,
          abilityDetails: newDetailsMap,
        };
        playerRef.current = nextPlayer;
        setPlayer(nextPlayer);
      }
    } catch (err) {
      console.warn("Failed to roll abilities:", err);
    } finally {
      setIsRollingAbilities(false);
    }
  };

  const handleClearAbilities = () => {
    soundEffects.playClick();
    const nextPlayer = {
      ...player,
      abilities: [],
      abilityDetails: {},
    };
    playerRef.current = nextPlayer;
    setPlayer(nextPlayer);
  };

  const handleInspectAbility = (abilityName: string) => {
    soundEffects.playClick();
    const found = player.abilityDetails?.[abilityName] || {
      name: abilityName,
      description: `A formidable technique honed by ${player.name} (${player.role || "Adventurer"}). It channels the user's tactical focus and attributes in battle.`,
      type: "Active",
      cost: "12 MP",
      cooldown: "2 Turns",
      tier: "Adept",
    };
    setInspectedAbility(found);
  };

  // Step 2: System Choice Starting Gear State & Handlers
  const [creationStep, setCreationStep] = useState<"character" | "gear">("character");
  const [systemGearOptions, setSystemGearOptions] = useState<GeneratedGearPiece[]>([]);
  const [isGeneratingGear, setIsGeneratingGear] = useState<boolean>(false);
  const [generatingImageItemIds, setGeneratingImageItemIds] = useState<Record<string, boolean>>({});

  const handleGenerateStartingGear = async () => {
    if (isGeneratingGear) return;
    setIsGeneratingGear(true);
    soundEffects.playSystemNotification();

    try {
      const res = await fetch("/api/generate-starting-gear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          role: player.role || "Adventurer",
          name: player.name || "Protagonist",
          genre: currentStory.genre || "Grimdark LitRPG",
          settingName: currentStory.worldContext?.settingName || "the Astra Continent",
          userAccessKey: accessKey,
        }),
      });

      const data = await res.json();
      if (data.gear && Array.isArray(data.gear)) {
        setSystemGearOptions(data.gear);

        // Trigger parallel image generation for each piece
        data.gear.forEach(async (item: GeneratedGearPiece) => {
          setGeneratingImageItemIds((prev) => ({ ...prev, [item.id]: true }));
          try {
            const imgRes = await fetch("/api/generate-image", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-key": accessKey,
              },
              body: JSON.stringify({
                mode: "loot",
                item: {
                  name: item.name,
                  type: item.type,
                  rarity: item.rarity,
                  description: item.description,
                },
                prompt: item.imagePrompt,
                userAccessKey: accessKey,
              }),
            });
            const imgData = await imgRes.json();
            if (imgData.imageUrl) {
              setSystemGearOptions((prev) =>
                prev.map((g) => (g.id === item.id ? { ...g, imageUrl: imgData.imageUrl } : g))
              );

              // Gear continuity (Point 4): Immediately append image to player.inventory & player.gearImages
              // and perform autosave before any page refresh or unmount
              setPlayer((prev) => {
                const cleanName = item.name.trim().toLowerCase();
                const itemMatch = (prev.inventory || []).some(
                  (inv) => (inv.id && inv.id === item.id) || inv.name.trim().toLowerCase() === cleanName
                );
                const updatedGearImages = {
                  ...(prev.gearImages || {}),
                  [item.id]: imgData.imageUrl,
                  [item.name]: imgData.imageUrl,
                };

                if (!itemMatch) {
                  const nextP = { ...prev, gearImages: updatedGearImages };
                  playerRef.current = nextP;
                  return nextP;
                }

                const updatedInv = prev.inventory.map((inv) =>
                  (inv.id && inv.id === item.id) || inv.name.trim().toLowerCase() === cleanName
                    ? { ...inv, imageUrl: imgData.imageUrl }
                    : inv
                );
                const nextP = {
                  ...prev,
                  inventory: updatedInv,
                  gearImages: updatedGearImages,
                };
                playerRef.current = nextP;
                performAutoSave({ player: nextP });
                return nextP;
              });

              // Permanently register into Multiverse Codex
              try {
                await saveCodexLoot({
                  storyId: currentStory.id,
                  storyTitle: currentStory.title,
                  itemName: item.name,
                  itemType: item.type,
                  rarity: item.rarity,
                  description: item.description,
                  effect: item.effect,
                  imageUrl: imgData.imageUrl,
                  model: imgData.model || "Google: Nano Banana 2.1",
                });
              } catch {}
            }
          } catch (e) {
            console.warn("Failed generating image for gear:", item.name, e);
          } finally {
            setGeneratingImageItemIds((prev) => ({ ...prev, [item.id]: false }));
          }
        });
      }
    } catch (err) {
      console.error("Error generating gear:", err);
    } finally {
      setIsGeneratingGear(false);
    }
  };

  const handleProceedToGear = async () => {
    if (!player.role.trim()) {
      alert("Please define a custom class or archetype first.");
      return;
    }
    soundEffects.playClick();
    setCreationStep("gear");
    if (systemGearOptions.length === 0) {
      await handleGenerateStartingGear();
    }
  };

  const handleConfirmGearAndStart = async () => {
    soundEffects.playClick();
    const weaponItem = systemGearOptions.find((g) => g.type === "weapon") || systemGearOptions[0];
    const armorItem = systemGearOptions.find((g) => g.type === "armor") || systemGearOptions[1];
    const relicItem = systemGearOptions.find((g) => g.type === "relic") || systemGearOptions[2];

    const equippedGear = {
      weapon: weaponItem?.name || "Bare Hands",
      armor: armorItem?.name || "Rags",
      relic: relicItem?.name || "None",
    };

    const startingInventoryItems: InventoryItem[] = systemGearOptions.map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      rarity: g.rarity,
      description: g.description,
      effect: g.effect,
      imageUrl: g.imageUrl,
    }));

    await handleStartGame(equippedGear, startingInventoryItems);
  };

  // Dynamic Relic Set Synergies (Task 4)
  const activeRelicSynergies = useMemo(() => {
    return evaluateRelicSynergies(player.inventory, player.gear);
  }, [player.inventory, player.gear]);

  // Jump to Timeline Anchor (Task 2)
  const handleJumpToAnchor = (anchor: VisitedStoryNode) => {
    soundEffects.playClick();
    if (!anchor.gameStateSnapshot) {
      pushNotification({
        id: `anchor_warn_${Date.now()}`,
        type: "system_alert",
        title: "TIMELINE ANCHOR MISSING DATA",
        subtitle: `Cannot restore temporal snapshot for ${anchor.title}.`,
      });
      return;
    }

    soundEffects.playIntroBell();
    const snap = anchor.gameStateSnapshot;
    if (snap.gameState) {
      let sanitizedSpeaker = snap.gameState.speaker;
      const snapParty = snap.party || party;
      const snapPresent = snapParty.filter((c: any) => c.isPresent);
      if (sanitizedSpeaker && snap.player?.name && sanitizedSpeaker.trim().toLowerCase() === snap.player.name.trim().toLowerCase()) {
        sanitizedSpeaker = snapPresent.length > 0 ? snapPresent[0].name : "Narrator";
      }
      setGameState({
        ...snap.gameState,
        speaker: sanitizedSpeaker || snap.gameState.speaker || "Narrator",
      });
    }
    if (snap.party) setParty(snap.party);
    if (snap.player) {
      const currentInvMap = new Map(
        (playerRef.current.inventory || []).map((item) => [item.id || item.name, item.imageUrl])
      );
      const restoredInventory = Array.isArray(snap.player.inventory)
        ? snap.player.inventory.map((item: InventoryItem) => ({
            ...item,
            imageUrl: item.imageUrl || currentInvMap.get(item.id || item.name),
          }))
        : [];
      const restoredPlayer = {
        ...snap.player,
        gearImages: snap.player.gearImages || playerRef.current.gearImages,
        inventory: restoredInventory,
      };
      setPlayer(restoredPlayer);
      playerRef.current = restoredPlayer;
    }
    if (snap.systemState) setSystemState(normalizeSystemState(snap.systemState));
    if (snap.memories) setMemories(snap.memories);
    if (snap.chatLog) setChatLog(snap.chatLog);
    if (snap.choices) {
      const sanitizedSnapChoices = sanitizeAndFilterChoices(snap.choices);
      if (sanitizedSnapChoices.length >= 2) setChoices(sanitizedSnapChoices);
    }

    // Pillar 4: Log persistent timeline rewind echo
    const jumpEcho: TimelineEcho = {
      id: `echo_jump_${Date.now()}`,
      sourceNodeKey: anchor.nodeKey || anchor.id,
      sourceNodeTitle: anchor.title || "Rewind Point",
      choiceTaken: `[TIMELINE REWIND] Restored anchor ${anchor.title}`,
      consequenceSummary: `Protagonist regressed across timeline boundary. Retained memories from future branches.`,
      loopIteration: (snap.systemState?.regressionCount || 0) + 1,
      recordedAt: new Date().toISOString(),
    };
    appendPersistentTimelineEcho(storyId || "astra-chronicles", jumpEcho);
    setTimelineEchoes((prev) => [jumpEcho, ...prev]);

    setShowFlowchartModal(false);
    pushNotification({
      id: `anchor_jump_${Date.now()}`,
      type: "system_alert",
      title: "TIMELINE ANCHOR SYNCHRONIZED",
      subtitle: `Restored timeline reality: ${anchor.title || anchor.location}`,
    });
  };

  // Execute Sanctioned Death Regression Rewind (No Safeguard System)
  const handleExecuteRegressionRewind = () => {
    soundEffects.playIntroBell();
    setShowDeathModal(false);

    // Rewind to latest anchor node
    const safeAnchors = visitedStoryNodes.filter((n) => n.isAnchor || n.isStartingPoint);
    const targetAnchor = safeAnchors.length > 0 ? safeAnchors[safeAnchors.length - 1] : visitedStoryNodes[0];

    if (targetAnchor) {
      handleJumpToAnchor(targetAnchor);
    }

    // Fully restore HP & MP and restabilize plausibility
    setPlayer((prev) => ({
      ...prev,
      deathCount: (prev.deathCount || 0) + 1,
      stats: {
        ...prev.stats,
        hp: prev.stats.maxHp,
        mp: prev.stats.maxMp,
      },
    }));

    setSystemState((prev) => ({
      ...prev,
      plausibility: 80,
      plausibilityTier: "Stable",
      regressionCount: (prev.regressionCount || 0) + 1,
      systemDirectives: [
        `[SYSTEM: Protagonist core regressed into Loop #${(prev.regressionCount || 0) + 2}. Retained memories intact.]`,
        ...prev.systemDirectives,
      ],
    }));

    pushNotification({
      id: `reg_complete_${Date.now()}`,
      type: "regression_trigger",
      title: "SANCTIONED REGRESSION ENGAGED",
      subtitle: `Consciousness rewound to stable anchor. Death memory recorded in persistent regression archive.`,
      difficulty: "A",
    });
  };

  // Pillar 5: Execute Camp Gifting
  const handleExecuteGift = async (item: InventoryItem, recipientName: string) => {
    if (!item || !recipientName || isLoading) return;
    soundEffects.playFavorSound(true);
    setShowGiftingModal(false);

    // Remove item from inventory
    setPlayer((prev) => ({
      ...prev,
      inventory: (prev.inventory || []).filter((inv) => inv.id !== item.id),
    }));

    // Find recipient companion
    const comp = party.find((c) => c.name.toLowerCase().includes(recipientName.toLowerCase()));
    const compCap = getCompanionCap(recipientName);

    // Calculate gift affection gain
    const catalogItem = CAMP_GIFT_CATALOG.find((g) => g.itemId === item.id || g.name === item.name);
    const baseGain = catalogItem ? catalogItem.baseAffectionGain : 5;
    const isPreferred = catalogItem?.preferredCompanionIds.some((id) => recipientName.toLowerCase().includes(id));
    const finalGain = isPreferred ? baseGain + 2 : baseGain;

    if (catalogItem?.statBonus) {
      const sb = catalogItem.statBonus;
      setPlayer((prev) => {
        const statKey = sb.stat === "hp" ? "maxHp" : sb.stat === "mp" ? "maxMp" : sb.stat;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            [statKey]: prev.stats[statKey] + sb.amount,
          },
        };
      });
    }

    if (comp) {
      const newAff = Math.min(compCap, comp.affection + finalGain);
      setParty((prev) =>
        prev.map((c) => (c.name.toLowerCase() === comp.name.toLowerCase() ? { ...c, affection: newAff } : c))
      );
    }

    // Trigger turn with gift context
    await sendAction(`[GIFT PRESENTED: ${player.name} presents ${item.name} to ${recipientName}]`, true, {
      itemName: item.name,
      itemDescription: item.description,
      itemRarity: item.rarity,
      recipientCompanionName: recipientName,
      reactionPrompt: catalogItem?.reactionPrompt || "Be genuinely surprised and emotionally moved by this gift.",
    });
  };

  // Synthesize Bespoke Romance CG (Full-Context Climax)
  const handleSynthesizeMilestoneCG = async (companionName: string, threshold: number) => {
    if (isGeneratingMilestoneCG) return;
    setIsGeneratingMilestoneCG(true);
    soundEffects.playIntroBell();

    const comp = party.find((c) => c.name.toLowerCase().includes(companionName.toLowerCase())) ||
      currentStory.companions.find((c) => c.name.toLowerCase().includes(companionName.toLowerCase()));
    const compSeed = comp?.seed || 4892019;

    // Extract recent story narrative leading to this romantic climax
    const sceneTurns = chatLog.slice(-10);
    const recentDialogueHistory = sceneTurns.map((m) => ({
      speaker: m.speakerName || "Unknown",
      text: m.text,
    }));
    const fullNarrative = sceneTurns
      .map((m) => `${m.speakerName}: "${m.text}"`)
      .join("\n");

    const richContext = {
      location: gameState.location,
      speaker: companionName,
      dialogue: gameState.dialogue,
      fullNarrative,
      recentDialogueHistory,
      presentCharacters: [
        {
          name: companionName,
          title: comp?.title || "Heroine",
          role: comp?.role || "Companion",
          expression: "tender gaze, emotional vulnerability, soft blush",
          visualPrompt: comp?.visualPrompt || "expressive anime eyes, intricate hair and attire",
          seed: compSeed,
          affection: threshold,
          relationshipStage: threshold >= 100 ? "sworn_partner" : threshold >= 75 ? "beloved" : "confidant",
        },
      ],
      protagonist: {
        name: player.name || "Protagonist",
        role: player.role || "Voidstrider",
      },
      relationshipContext: `Climactic Romance Milestone (${threshold}% Affection Threshold). An unforgettable intimate breakthrough between ${companionName} and ${player.name || "the protagonist"}.`,
      mood: "Intimate, Heart-Fluttering & Cinematically Breathtaking",
      genre: currentStory.genre,
      storyTitle: currentStory.title,
      currentBg: gameState.bgImage,
    };

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          mode: "scene",
          characterSeed: compSeed,
          userAccessKey: accessKey,
          sceneContext: richContext,
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        await saveCodexScene({
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          location: gameState.location,
          speaker: companionName,
          prompt: data.prompt || `${companionName} looked upon you with unflinching sincerity, the boundary between mortal ambition and devotion fading away.`,
          imageUrl: data.imageUrl,
          model: data.model || "Google: Nano Banana 2.1",
        });

        setActiveBespokeCG({
          companionName,
          threshold,
          imageUrl: data.imageUrl,
          title: `${companionName}: ${threshold}% Climax`,
        });
        soundEffects.playQuestComplete();
      }
    } catch (err) {
      console.warn("Failed to generate bespoke romance CG:", err);
    } finally {
      setIsGeneratingMilestoneCG(false);
    }
  };

  const hydrateCompanionMetadata = (
    rawComp: any,
    storyCompanions?: StoryCompanion[],
    isStarfallStory?: boolean
  ): Companion => {
    const compName = (rawComp?.name || "").trim();
    const storyComp = Array.isArray(storyCompanions)
      ? storyCompanions.find(
          (sc) =>
            (rawComp?.id && sc.id && sc.id === rawComp.id) ||
            matchesHeroineName(sc.name, compName, sc.id)
        )
      : undefined;
    const sfDossier = isStarfallStory
      ? STARFALL_HEROINE_DOSSIERS[compName] ||
        Object.values(STARFALL_HEROINE_DOSSIERS).find((d) =>
          matchesHeroineName(d.name, compName, rawComp?.id)
        )
      : undefined;

    const pickList = (primary?: string[], secondary?: string[], tertiary?: string[]) => {
      if (Array.isArray(primary) && primary.length > 0) return primary;
      if (Array.isArray(secondary) && secondary.length > 0) return secondary;
      if (Array.isArray(tertiary) && tertiary.length > 0) return tertiary;
      return undefined;
    };

    const resolvedBaseImg =
      rawComp?.baseImageUrl ||
      storyComp?.baseImageUrl ||
      (sfDossier ? `/characters/starfall-labyrinth/${sfDossier.spriteSlug}/neutral.png` : undefined);

    const resolvedExpressions =
      rawComp?.expressions && Object.keys(rawComp.expressions).length > 0
        ? rawComp.expressions
        : storyComp?.expressions;

    return {
      ...rawComp,
      id: rawComp?.id || storyComp?.id || sfDossier?.id || compName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      title: rawComp?.title || storyComp?.title || sfDossier?.epithet || "",
      role: rawComp?.role || storyComp?.role || sfDossier?.combatRole,
      gender: rawComp?.gender || storyComp?.gender || sfDossier?.gender,
      personality: rawComp?.personality || storyComp?.personality || sfDossier?.personality,
      values: pickList(rawComp?.values, storyComp?.values, sfDossier?.values),
      dislikes: pickList(rawComp?.dislikes, storyComp?.dislikes, sfDossier?.dislikes),
      highCompatibility: pickList(rawComp?.highCompatibility, storyComp?.highCompatibility),
      guardTier: (rawComp?.guardTier || storyComp?.guardTier) as HeroineGuardTier | undefined,
      baseImageUrl: resolvedBaseImg,
      expressions: resolvedExpressions,
    };
  };

  useEffect(() => {
    let active = true;
    setLlmConfig(getStoredLlmConfig());
    getStoryById(storyId).then((story) => {
      if (active && story) {
        setCurrentStory(story);
        // Do not overwrite party, gameState, or player stats if a save slot is currently resuming or already active
        if (!isResumingSaveRef.current && !isConfiguredRef.current) {
          setSelectedPrologue(0);
          setNarrationStyle(story.narrationStyle || "Grimdark & Atmospheric");
          if (story.companions && story.companions.length > 0) {
            const startingSpeaker = story.startingNodes?.[0]?.speaker || story.companions[0].name;
            const isStarfallStory = story.id === "starfall-labyrinth";
            setParty(
              story.companions.map((c, idx) => {
                const isStarter = idx === 0 || c.name.toLowerCase() === startingSpeaker.toLowerCase();
                return hydrateCompanionMetadata(
                  {
                    ...c,
                    id: c.id || c.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
                    name: c.name,
                    title: c.title,
                    affection: c.affection ?? c.baseAffection ?? 15,
                    heartRateBpm: c.heartRateBpm ?? 55,
                    expressionKey: c.expressionKey || "neutral",
                    isPresent: isStarter,
                    encountered: isStarter,
                    color: c.color || "rose",
                    starRank: c.starRank,
                    baseStarRank: c.baseStarRank ?? c.starRank,
                    level: c.level || 1,
                    exp: c.exp || 0,
                    maxExp: c.maxExp || BASE_LEVEL_ONE_MAX_EXP,
                    heroStatus: isStarfallStory ? (isStarter ? "DEPLOYED" : "BENCHED") : undefined,
                    awakenings: 0,
                  },
                  story.companions,
                  isStarfallStory
                );
              })
            );
            const firstLoc = story.startingNodes?.[0]?.location || story.worldContext.locations[0]?.name || "Starting Point";
            const firstBg = (story.worldContext.locations.find((l) => l.name === firstLoc)?.bgImage) || story.coverImage || DEFAULT_BG;
            setGameState((prev) => ({
              ...prev,
              speaker: startingSpeaker,
              location: firstLoc,
              bgImage: firstBg,
              presentCompanions: [startingSpeaker],
            }));
          }
          const worldPreset = getWorldPresets(story.id);
          if (worldPreset) {
            const isSolaris = story.id === "port-solaris";
            const isStarfall = story.id === "starfall-labyrinth";
            const defOrigin = worldPreset.origins[0];
            const defConduit = worldPreset.conduits[0];
            const defTone = worldPreset.defaultTone;
            const initialStarterName =
              story.startingNodes?.[0]?.speaker || story.companions?.[0]?.name || "Pia Hollis";
            setNarrationStyle(defTone);
            setSelectedWorldOriginPreset(defOrigin.id);
            setSelectedSovereignConduit(defConduit.id);
            setGearPreference("canon");
            const abNames = defConduit.startingAbilities.map((a) => a.name);
            const abDetails: Record<string, AbilityDetail> = {};
            defConduit.startingAbilities.forEach((a) => {
              abDetails[a.name] = a;
            });
            setStatPoints(2);
            setPlayer((prev) => {
              const next: PlayerProfile = {
                ...prev,
                role: prev.role || defConduit.roleTitle,
                narrationStyle: defTone,
                worldOrigin: defOrigin.name,
                worldOriginDetails: defOrigin.defaultDetails,
                sovereignOrigin: defOrigin.id,
                conduit: defConduit.conduit,
                patronWing: defConduit.wing,
                matriculationRank: defOrigin.startingRank,
                semesterDebtQuota: defOrigin.semesterDebtQuota,
                gold: defOrigin.startingCrowns,
                abilities: abNames,
                abilityDetails: abDetails,
                ...(isSolaris
                  ? {
                      boardingHouse:
                        prev.boardingHouse ||
                        createInitialBoardingHouseState({
                          outstandingDebt: (defOrigin as PortSolarisOriginPreset).outstandingDebt ?? 5000,
                          daysUntilAudit: (defOrigin as PortSolarisOriginPreset).daysUntilAudit ?? 30,
                          starRating: (defOrigin as PortSolarisOriginPreset).startingStarRating ?? 0,
                        }),
                      factionStanding: prev.factionStanding || createInitialFactionStandings(),
                      equippedKeepsakes: prev.equippedKeepsakes || [],
                    }
                  : {}),
                ...(isStarfall
                  ? {
                      labyrinthState:
                        prev.labyrinthState ||
                        createInitialLabyrinthState(defOrigin.id as StarfallOrigin, {
                          startingHeroineName: initialStarterName,
                        }),
                      starRank: (defOrigin as StarfallOriginPreset).startingStarRank || 1,
                    }
                  : {}),
                stats: {
                  ...prev.stats,
                  ...(story.rpgRules?.baseStats || {}),
                  str: defConduit.statSpread.str,
                  dex: defConduit.statSpread.dex,
                  int: defConduit.statSpread.int,
                },
              };
              playerRef.current = next;
              return next;
            });
          } else if (story.rpgRules?.baseStats) {
            setPlayer((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                ...story.rpgRules.baseStats,
              },
            }));
          }
        }
        setStoryLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [storyId]);

  useEffect(() => {
    setIsAudioMuted(soundEffects.isMuted());
    // 1-Click Multiverse Seed Import Listener (Task 5)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const seedParam = urlParams.get("seed") || urlParams.get("multiverseSeed");
      if (seedParam) {
        const decoded = decodeMultiverseSeed(seedParam);
        if (decoded && decoded.story) {
          setCurrentStory(decoded.story);
          pushNotification({
            id: `seed_import_${Date.now()}`,
            type: "system_alert",
            title: "MULTIVERSE SEED SYNCHRONIZED",
            subtitle: `Loaded shared universe: "${decoded.story.title}" with custom seeds!`,
          });
        }
      }
    }

    const seen = sessionStorage.getItem("astra_welcome_seen");
    if (seen === "true") {
      setHasSeenWelcome(true);
    }
  }, []);

    const handleToggleAudio = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playClick();
    }
  };

  

  const [party, setParty] = useState<Companion[]>([
    {
      name: "Evelyn Abbandonato",
      title: "High Arcanist of House Abbandonato",
      affection: 15,
      expressionKey: "smug",
      isPresent: true,
      encountered: false,
      color: "rose",
    },
    {
      name: "Aria Shadowthorn",
      title: "Rogue Infiltrator of the Veil Seekers",
      affection: 12,
      expressionKey: "neutral",
      isPresent: false,
      encountered: false,
      color: "sky",
    },
    {
      name: "Serena",
      title: "Dutiful Demi-Human Combat Maid",
      affection: 15,
      expressionKey: "neutral",
      isPresent: false,
      encountered: false,
      color: "zinc",
    },
    {
      name: "Morgana",
      title: "Demon Realm Noblewoman",
      affection: 10,
      expressionKey: "neutral",
      isPresent: false,
      encountered: false,
      color: "purple",
    },
    {
      name: "Perci",
      title: "Timid Kitsune Rogue",
      affection: 12,
      expressionKey: "neutral",
      isPresent: false,
      encountered: false,
      color: "amber",
    },
  ]);

  const [memories, setMemories] = useState<string[]>([
    "Began exploration within the Astra Continent overlooking the Baltia Empire.",
  ]);

  const [gameState, setGameState] = useState<RoleplayState>({
    speaker: "Evelyn Abbandonato",
    dialogue: "",
    location: "Imperial Capital Imperium",
    mood: "Smug & Aristocratic",
    bgImage: LOCATION_BACKGROUNDS["Imperial Capital Imperium"] || DEFAULT_BG,
    presentCompanions: ["Evelyn Abbandonato"],
  });

  const [lastAffectionDelta, setLastAffectionDelta] = useState<{
    companion: string;
    delta: number;
    isCapped?: boolean;
    cap?: number;
  } | null>(null);
  const [notifications, setNotifications] = useState<GameNotificationItem[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<GameNotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [showNotificationHistory, setShowNotificationHistory] = useState<boolean>(false);

  // Pre-cache companion expression sprites during idle to ensure zero-flicker transitions
  useEffect(() => {
    preloadStoryAssets();
  }, []);

  // Load notification history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`astra_notif_history_${params?.storyId || "default"}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNotificationHistory(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load notification history:", e);
    }
  }, [params?.storyId]);

  // Persist notification history on change
  useEffect(() => {
    try {
      if (notificationHistory.length > 0) {
        localStorage.setItem(
          `astra_notif_history_${params?.storyId || "default"}`,
          JSON.stringify(notificationHistory.slice(0, 100))
        );
      }
    } catch (e) {
      console.warn("Failed to save notification history:", e);
    }
  }, [notificationHistory, params?.storyId]);

  const pushNotification = (notif: Omit<GameNotificationItem, "id"> & { id?: string }) => {
    const id = notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullItem: GameNotificationItem = {
      ...notif,
      id,
      timestamp: notif.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setNotifications((prev) => {
      const existingIdx = prev.findIndex((n) => n.id === id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...fullItem };
        return copy;
      }
      return [...prev, fullItem];
    });

    setNotificationHistory((prev) => {
      const existingIdx = prev.findIndex((n) => n.id === id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...fullItem };
        return copy;
      }
      return [fullItem, ...prev].slice(0, 100);
    });

    setUnreadNotificationCount((c) => c + 1);
  };

  const handleClearNotificationHistory = () => {
    soundEffects.playClick();
    setNotificationHistory([]);
    setUnreadNotificationCount(0);
    try {
      localStorage.removeItem(`astra_notif_history_${params?.storyId || "default"}`);
    } catch (e) {
      console.warn("Failed to clear notification history:", e);
    }
  };

  const handleDismissHistoryItem = (id: string) => {
    soundEffects.playClick();
    setNotificationHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(
          `astra_notif_history_${params?.storyId || "default"}`,
          JSON.stringify(updated)
        );
      } catch {}
      return updated;
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const setAcquisitionAlert = (
    updater: AcquisitionAlertData | null | ((prev: AcquisitionAlertData | null) => AcquisitionAlertData | null)
  ) => {
    if (typeof updater === "function") {
      setNotifications((prevList) => {
        const lootIdx = prevList.findIndex((n) => n.type === "loot");
        if (lootIdx === -1) return prevList;
        const current = prevList[lootIdx];
        const result = updater({
          id: current.id,
          type: (current.type as any) || "loot",
          title: current.title,
          subtitle: current.subtitle,
          imageUrl: current.imageUrl,
          rarity: current.rarity,
        });
        if (!result) return prevList;
        const copy = [...prevList];
        copy[lootIdx] = {
          ...copy[lootIdx],
          ...result,
        };
        return copy;
      });

      setNotificationHistory((prevList) => {
        const lootIdx = prevList.findIndex((n) => n.type === "loot");
        if (lootIdx === -1) return prevList;
        const current = prevList[lootIdx];
        const result = updater({
          id: current.id,
          type: (current.type as any) || "loot",
          title: current.title,
          subtitle: current.subtitle,
          imageUrl: current.imageUrl,
          rarity: current.rarity,
        });
        if (!result) return prevList;
        const copy = [...prevList];
        copy[lootIdx] = {
          ...copy[lootIdx],
          ...result,
        };
        return copy;
      });
      return;
    }

    if (!updater) return;
    pushNotification({
      id: updater.id,
      type: updater.type,
      title: updater.title,
      subtitle: updater.subtitle,
      imageUrl: updater.imageUrl,
      rarity: updater.rarity,
    });
  };

  const setSystemToast = (toast: SystemToastNotification | null) => {
    if (!toast) return;
    pushNotification({
      id: toast.id,
      type: toast.type,
      title: toast.title,
      subtitle: toast.subtitle,
      difficulty: toast.difficulty,
      timestamp: toast.timestamp,
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  
  // User Message Typewriter State (for chosen options & custom inputs)
  const [typingUserMsgId, setTypingUserMsgId] = useState<string | null>(null);
  const [displayedUserText, setDisplayedUserText] = useState("");
  const userTypewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearUserTypewriter = () => {
    if (userTypewriterIntervalRef.current) {
      clearInterval(userTypewriterIntervalRef.current);
      userTypewriterIntervalRef.current = null;
    }
  };
  
  const [pageLoaded, setPageLoaded] = useState(false);
  const [screenTransition, setScreenTransition] = useState<ScreenTransitionConfig>({
    isOpen: false,
    title: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 40);
    return () => clearTimeout(timer);
  }, []);

  const [showPlayerSheet, setShowPlayerSheet] = useState(false);
  const [showPartyDrawer, setShowPartyDrawer] = useState(false);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  const [showMobileCommandSheet, setShowMobileCommandSheet] = useState(false);
  const [showSummonModal, setShowSummonModal] = useState(false);
  const [showBarracksModal, setShowBarracksModal] = useState(false);
  const [showOocDrawer, setShowOocDrawer] = useState(false);
  const [directorNotes, setDirectorNotes] = useState("");
  const [starfallGameOver, setStarfallGameOver] = useState<{
    causeOfDeath: string;
    killerOrHazard?: string;
  } | null>(null);
  const [visitedStoryNodes, setVisitedStoryNodes] = useState<VisitedStoryNode[]>([]);
  const [spotlightHeroineName, setSpotlightHeroineName] = useState<string | null>(null);
  const [selectedCharacterCardComp, setSelectedCharacterCardComp] = useState<Companion | StoryCompanion | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [companionMilestones, setCompanionMilestones] = useState<Record<string, number[]>>({});
  const [companionCompletedMilestones, setCompanionCompletedMilestones] = useState<Record<string, number[]>>({});
  const [isChoicesCollapsed, setIsChoicesCollapsed] = useState(false);
  const [isRerollingChoices, setIsRerollingChoices] = useState(false);
  const [showSubtextPopover, setShowSubtextPopover] = useState(false);
  const [customMemoryInput, setCustomMemoryInput] = useState("");
  const [loadingPhaseIdx, setLoadingPhaseIdx] = useState(0);
  const [sectorBanner, setSectorBanner] = useState<{ name: string; sub: string } | null>(null);
  const prevLocationRef = useRef<string>("");

  useEffect(() => {
    if (!isLoading) {
      setLoadingPhaseIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPhaseIdx((prev) => (prev + 1) % 4);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const loc = (gameState.location || "").trim();
    if (!loc) return;
    const isInitialDefaultSync =
      prevLocationRef.current === "Imperial Capital Imperium" &&
      currentStory?.id !== "astra-chronicles";
    if (!isConfigured || !pageLoaded || !prevLocationRef.current || isInitialDefaultSync) {
      prevLocationRef.current = loc;
      return;
    }
    if (loc.toLowerCase() !== prevLocationRef.current.toLowerCase()) {
      prevLocationRef.current = loc;
      setSectorBanner({
        name: loc,
        sub: gameState.mood ? `Atmosphere: ${gameState.mood}` : "Sector Resonance Stabilized",
      });
    }
  }, [gameState.location, isConfigured, pageLoaded, currentStory?.id]);

  useEffect(() => {
    if (!sectorBanner) return;
    const timer = setTimeout(() => setSectorBanner(null), 3500);
    return () => clearTimeout(timer);
  }, [sectorBanner]);

  const activeConditionPills = useMemo(() => {
    const pills: { label: string; color: string; title: string }[] = [];
    const weaponLower = (player.gear?.weapon || "").toLowerCase();
    const armorLower = (player.gear?.armor || "").trim().toLowerCase();
    const isExplicitlyUnclad =
      isExplicitlyNudeOrUnclad(player.gear?.armor) ||
      isExplicitlyNudeOrUnclad(player.visualDescription);

    if (!weaponLower || weaponLower.includes("none") || weaponLower.includes("unarmed") || weaponLower.includes("bare")) {
      pills.push({
        label: "Unarmed",
        color: "border-amber-500/40 bg-amber-950/60 text-amber-300",
        title: "No primary weapon equipped — relying on raw physique or innate claws/magic.",
      });
    }
    if (isExplicitlyUnclad) {
      pills.push({
        label: "Unclad / Exposed",
        color: "border-rose-500/40 bg-rose-950/60 text-rose-300",
        title: "Lacking protective apparel — NPCs react to your exposed state and physical vulnerability.",
      });
    } else if (
      !armorLower ||
      armorLower === "none" ||
      armorLower.includes("unarmored") ||
      armorLower.includes("portrait attire")
    ) {
      pills.push({
        label: "Unarmored",
        color: "border-zinc-500/40 bg-zinc-900/70 text-zinc-300",
        title: "Wearing profile outfit without protective combat armor.",
      });
    }

    const hpRatio = player.stats.hp / Math.max(1, player.stats.maxHp);
    if (hpRatio <= 0.35) {
      pills.push({
        label: "Critical Trauma",
        color: "border-red-500/60 bg-red-950/80 text-red-300 animate-pulse",
        title: "Severe physical wounds — physical exertion carries heightened danger.",
      });
    } else if (hpRatio <= 0.65) {
      pills.push({
        label: "Bloodied",
        color: "border-orange-500/40 bg-orange-950/60 text-orange-300",
        title: "Visible bruising and lacerations from recent clashes.",
      });
    }

    const mpRatio = player.stats.mp / Math.max(1, player.stats.maxMp);
    if (mpRatio <= 0.25) {
      pills.push({
        label: "Mana Strained",
        color: "border-sky-500/40 bg-sky-950/60 text-sky-300",
        title: "Aether reserves running low — channeling high-tier arts may cause backlash.",
      });
    }

    if (player.race && player.race.toLowerCase() !== "human") {
      pills.push({
        label: `${player.race} Senses`,
        color: "border-purple-500/40 bg-purple-950/50 text-purple-300",
        title: (player.racialTraits || []).join(" • ") || `${player.race} physiology active in narrative.`,
      });
    }

    if (currentStory?.id === "sovereign-spire") {
      const baseRank = player.matriculationRank || 488;
      const simulatedRank = Math.max(1, baseRank - (player.level - 1) * 35);
      const rankTier =
        simulatedRank > 450
          ? "The Dross"
          : simulatedRank > 50
          ? "The Body"
          : simulatedRank > 10
          ? "Vanguard Elite"
          : "Sovereign Candidate";
      pills.push({
        label: `Rank #${simulatedRank} (${rankTier})`,
        color:
          simulatedRank > 450
            ? "border-rose-500/50 bg-rose-950/60 text-rose-300"
            : "border-amber-500/50 bg-amber-950/60 text-amber-300",
        title: `Sovereign Spire Matriculation Ladder Rank (Semester Quota: ${player.semesterDebtQuota || 400} Aether Cores) — Stay above #450 to avoid Proctor Sallow's Blood-Ledger foreclosure.`,
      });
      if (player.conduit || player.patronWing) {
        const wingPretty = (player.patronWing || "IRON_CHANCELLERY")
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        pills.push({
          label: `${player.conduit || "SOMATIC"} • ${wingPretty}`,
          color: "border-indigo-500/40 bg-indigo-950/60 text-indigo-200",
          title: `Active Dual-Conduit Pathway (${player.conduit || "SOMATIC"}) & Patron Wing Alignment (${wingPretty}).`,
        });
      }
      const strainPct = Math.min(100, Math.max(0, Math.round((1 - mpRatio) * 85)));
      pills.push({
        label:
          strainPct >= 50
            ? `⚡ The Brink (${strainPct}% Strain)`
            : `💎 Strain ${strainPct}%`,
        color:
          strainPct >= 50
            ? "border-purple-400/60 bg-purple-950/80 text-purple-200 animate-pulse"
            : "border-cyan-500/40 bg-cyan-950/50 text-cyan-300",
        title:
          "Calcification / Resonance Strain Gauge (0-49% Stable, 50-85% The Brink +30% DMG, 100% Calcification Lock — purge via skin-to-skin Soul-Grounding).",
      });
    } else if (currentStory?.id === "port-solaris") {
      const bh = player.boardingHouse || createInitialBoardingHouseState();
      const starRating = bh.starRating ?? 0;
      const daysLeft = bh.daysUntilAudit ?? 30;
      const debtLeft = bh.outstandingDebt ?? 5000;
      const starLabel =
        starRating === 0
          ? `0★ Probation (${daysLeft}d • ${debtLeft.toLocaleString()} Crowns)`
          : starRating === 1
          ? `1★ Provisional (${daysLeft}d • ${debtLeft.toLocaleString()} Crowns)`
          : starRating === 2
          ? `2★ Local Favorite (${daysLeft}d • ${debtLeft.toLocaleString()} Crowns)`
          : starRating === 3
          ? `3★ Island Hotspot (${daysLeft}d • ${debtLeft.toLocaleString()} Crowns)`
          : starRating === 4
          ? `4★ Premier Lounge (${daysLeft}d • ${debtLeft.toLocaleString()} Crowns)`
          : "5★ Island Sovereign (Deed Liberated!)";
      pills.push({
        label: starLabel,
        color:
          starRating === 0
            ? "border-rose-500/50 bg-rose-950/60 text-rose-300"
            : "border-amber-500/50 bg-amber-950/60 text-amber-300",
        title: `Solaris Star Ledger Rating for The Stray Anchor — Remaining Lease Debt: ${debtLeft.toLocaleString()} Solar Crowns | Audit Countdown: ${daysLeft} Days | Daily Shift Revenue: +${bh.dailyRevenue || 165} Crowns.`,
      });
      if (player.conduit || player.patronWing) {
        const wingPretty = (player.patronWing || "BOARDWALK_GUILD")
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const conduitPretty = (player.conduit || "PHYSICAL_TEMPO").replace(/_/g, " ");
        pills.push({
          label: `${conduitPretty} • ${wingPretty}`,
          color: "border-sky-500/40 bg-sky-950/60 text-sky-200",
          title: `Active Showdown Flair (${conduitPretty}) & Island Faction Alignment (${wingPretty}).`,
        });
      }
      const activeComp =
        party.find(
          (c) =>
            gameState.speaker &&
            c.name.toLowerCase() === gameState.speaker.toLowerCase()
        ) || party.find((c) => c.isPresent);
      const activeDossier = activeComp ? PORT_SOLARIS_HEROINE_DOSSIERS[activeComp.name] : undefined;
      const realBpm = Math.min(
        100,
        Math.max(40, Math.round(activeComp?.heartRateBpm ?? activeDossier?.heartRateBpm ?? 55))
      );
      const bpmZoneInfo = getBpmZone(realBpm);
      const isBlushOrHigher = realBpm >= 83;
      const isGuarded = realBpm >= 69 && realBpm < 83;
      pills.push({
        label:
          realBpm >= 96
            ? `💥 Short-Circuit (${realBpm} BPM)`
            : isBlushOrHigher
            ? `💓 Blush Zone (${realBpm} BPM)`
            : isGuarded
            ? `😳 Guarded (${realBpm} BPM)`
            : `😎 Composed (${realBpm} BPM)`,
        color:
          isBlushOrHigher
            ? "border-rose-400/60 bg-rose-950/80 text-rose-200 animate-pulse"
            : isGuarded
            ? "border-amber-400/50 bg-amber-950/60 text-amber-200"
            : "border-emerald-500/40 bg-emerald-950/50 text-emerald-300",
        title: `${activeComp?.name || "Partner"} Heart-Rate Gauge: ${realBpm} BPM (${bpmZoneInfo.label}) — 40-68 Composed, 69-82 Guarded Deflection, 83-95 The Blush Zone, 96-100 Short-Circuit.`,
      });
    } else if (currentStory?.id === "starfall-labyrinth") {
      const ls = player.labyrinthState || createInitialLabyrinthState();
      const inLobby = isStarfallLobbyLocation(gameState.location);
      const curFloor = inLobby ? 0 : ls.currentFloor || 0;
      const floorType = getFloorType(curFloor);
      pills.push({
        label: inLobby
          ? "💠 Main Lobby • Star Gate Ready"
          : `⚔ Floor ${curFloor}/100 (${getFloorTypeLabel(curFloor)})`,
        color: inLobby
          ? "border-indigo-400/60 bg-indigo-950/75 text-indigo-200"
          : floorType === "GATE_BOSS"
          ? "border-rose-500/60 bg-rose-950/80 text-rose-200 animate-pulse"
          : floorType === "SAFE_ZONE"
          ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-200"
          : "border-amber-500/50 bg-amber-950/60 text-amber-200",
        title: inLobby
          ? "Star Gate Plaza (Main Lobby) — Summoning Altar unlocked! Spend Star Shards to pull 1★–5★ allies before stepping onto Floor 1+."
          : `Starfall Labyrinth Floor ${curFloor} (${getFloorTypeLabel(curFloor)}) — Highest Cleared: Floor ${ls.highestFloorCleared}/100. Summoning is locked until you return to Star Gate Plaza (Main Lobby).`,
      });

      const pStar = ls.protagonistStarRank || 1;
      const pCap = getStarLevelCap(pStar);
      const starDisplay = ls.isHiddenRarity && pStar === 1 ? "?★ (1★)" : `${pStar}★`;
      pills.push({
        label: `${starDisplay} • Lv.${player.level}/${pCap}`,
        color:
          player.level >= pCap
            ? "border-amber-400/60 bg-amber-950/75 text-amber-200"
            : "border-sky-500/45 bg-sky-950/60 text-sky-200",
        title: `Covenant II Hard Star Level Cap: ${pStar}★ caps at Lv.${pCap} (1★=20, 2★=30, 3★=40, 4★=50, 5★=60). Break caps via Resonance Awakening or Gate Boss breakthroughs.`,
      });

      pills.push({
        label: `💠 ${ls.starShards} Shards • Pity ${ls.pityCounter}/90`,
        color: "border-cyan-500/45 bg-cyan-950/60 text-cyan-200",
        title: `Star Shards: ${ls.starShards} (30 per 1x pull, 300 per 10x pull in Main Lobby) • 5★ Hard Pity Counter: ${ls.pityCounter}/90 • Memorial Wall Fallen: ${(ls.memorial || []).length}.`,
      });

      pills.push({
        label: `🎖 Master Trust ${ls.masterTrust}%`,
        color:
          ls.masterTrust < 25
            ? "border-rose-500/55 bg-rose-950/75 text-rose-200"
            : "border-emerald-500/45 bg-emerald-950/55 text-emerald-200",
        title: `Unseen Master ("Account #0419 — KRONOS") Trust: ${ls.masterTrust}% — High trust earns Supply Drops & Summon backing; low trust risks Synthesis Bench disposal.`,
      });

      if (curFloor > (ls.metaKnowledgeCeiling || 40)) {
        pills.push({
          label: `⚠ BEYOND MEMORY (F${curFloor} > F${ls.metaKnowledgeCeiling})`,
          color: "border-red-500/70 bg-red-950/90 text-red-200 animate-pulse",
          title: `Floor ${curFloor} exceeds your former Ranker ceiling (Floor ${ls.metaKnowledgeCeiling}). Past meta-knowledge no longer applies — scout blind!`,
        });
      }
    }

    return pills;
  }, [player.gear, player.visualDescription, player.stats.hp, player.stats.maxHp, player.stats.mp, player.stats.maxMp, player.race, player.racialTraits, player.level, player.matriculationRank, player.semesterDebtQuota, player.conduit, player.patronWing, player.boardingHouse, player.labyrinthState, party, gameState.speaker, gameState.location, currentStory?.id]);

  // Helper to determine active threshold cap for any companion
  const getCompanionCap = (compName?: string | null): number => {
    if (!compName) return 25;
    const norm = compName.toLowerCase().trim();
    const completedQuests = systemState?.completedQuests || [];
    const completedList = companionCompletedMilestones[norm] || [];

    const is25Done =
      completedList.includes(25) ||
      completedQuests.some(
        (q) =>
          q.status === "completed" &&
          (q.id.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_25`) ||
            (q.title.toLowerCase().includes(norm) && q.title.includes("25%")))
      );
    if (!is25Done) return 25;

    const is50Done =
      completedList.includes(50) ||
      completedQuests.some(
        (q) =>
          q.status === "completed" &&
          (q.id.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_50`) ||
            (q.title.toLowerCase().includes(norm) && q.title.includes("50%")))
      );
    if (!is50Done) return 50;

    const is75Done =
      completedList.includes(75) ||
      completedQuests.some(
        (q) =>
          q.status === "completed" &&
          (q.id.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_75`) ||
            (q.title.toLowerCase().includes(norm) && q.title.includes("75%")))
      );
    if (!is75Done) return 75;

    const is90Done =
      completedList.includes(90) ||
      completedQuests.some(
        (q) =>
          q.status === "completed" &&
          (q.id.toLowerCase().includes(`milestone_${norm.replace(/[^a-z0-9]/g, "_")}_90`) ||
            (q.title.toLowerCase().includes(norm) && q.title.includes("90%")))
      );
    if (!is90Done) return 90;

    return 100;
  };
  const [isGeneratingMilestoneCG, setIsGeneratingMilestoneCG] = useState(false);
  const [activeBespokeCG, setActiveBespokeCG] = useState<{
    companionName: string;
    threshold: number;
    imageUrl: string;
    title: string;
  } | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [savedSlots, setSavedSlots] = useState<Record<number, SaveSlotData | null>>({ 0: null, 1: null, 2: null, 3: null });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);

  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const dialogueFeedRef = useRef<HTMLDivElement | null>(null);
  const isResumingSaveRef = useRef(false);

  // Self-heal corrupted choice arrays (e.g. from older saves or truncated JSON fragments)
  useEffect(() => {
    if (!choices || choices.length === 0) return;
    const needsSanitize =
      choices.length > 4 || choices.some((c) => !isValidTacticalChoice(c));
    if (!needsSanitize) return;

    const cleaned = sanitizeAndFilterChoices(choices);
    if (cleaned.length >= 2) {
      setChoices(cleaned);
      return;
    }

    const activeSpeakerName = gameState?.speaker || "Narrator";
    const isAlone =
      party.filter((c) => c.isPresent).length === 0 &&
      (!activeSpeakerName || activeSpeakerName === "Narrator");
    const fallback = sanitizeAndFilterChoices(
      buildPersonalityFallbackChoices({
        personality: player?.personality,
        personalityTraits: player?.personalityTraits,
        playerRole: player?.role,
        playerRace: player?.race,
        activeSpeaker: activeSpeakerName,
        location: gameState?.location || "this sector",
        isProtagonistAlone: isAlone,
        storyId: currentStory?.id,
        genre: currentStory?.genre,
        narrativeText: gameState?.dialogue,
      })
    );
    setChoices(fallback);
  }, [choices, player, gameState, party, currentStory]);

  // Editing and response regeneration state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // System Administrator & Quests State
  const [systemState, setSystemState] = useState<SystemState>({
    plausibility: 80,
    plausibilityTier: "Stable",
    activeQuests: [],
    completedQuests: [],
    systemDirectives: ["Administrator protocol engaged. Causal anchor established at 80%."],
    penaltyScenario: null,
  });
  const [showSystemModal, setShowSystemModal] = useState(false);

  // Major Feature Expansion State (Pillars 3, 4, 5 & No-Safeguard Deaths)
  const [timelineEchoes, setTimelineEchoes] = useState<TimelineEcho[]>([]);
  const [deathRegressionRecord, setDeathRegressionRecord] = useState<DeathRegressionRecord | null>(null);
  const [showDeathModal, setShowDeathModal] = useState(false);
  const [showGiftingModal, setShowGiftingModal] = useState(false);
  const [selectedGiftRecipient, setSelectedGiftRecipient] = useState<string>("");

  // Systems Evolution State (Pitches A, B, C)
  const [timelineScars, setTimelineScars] = useState<TimelineScar[]>([]);
  const [showCovenantModal, setShowCovenantModal] = useState<boolean>(false);
  const [showScarsModal, setShowScarsModal] = useState<boolean>(false);
  const [covenantIntentText, setCovenantIntentText] = useState<string>("");
  const [isSeveringCovenant, setIsSeveringCovenant] = useState<boolean>(false);

  const [frictionState, setFrictionState] = useState<CompanionFrictionState | null>(null);
  const [showCampUltimatumModal, setShowCampUltimatumModal] = useState<boolean>(false);
  const [activeUltimatumRivalry, setActiveUltimatumRivalry] = useState<CompanionRivalryRecord | null>(null);

  const [activeClash, setActiveClash] = useState<ActiveStoryClashState | null>(null);
  const [isExecutingClashAction, setIsExecutingClashAction] = useState<boolean>(false);

  // Live Refs to prevent stale React closure bugs in performAutoSave & handleExecuteClashAction
  const isConfiguredRef = useRef<boolean>(isConfigured);
  useEffect(() => { isConfiguredRef.current = isConfigured; }, [isConfigured]);
  const chatLogRef = useRef<ChatMessage[]>(chatLog);
  useEffect(() => { chatLogRef.current = chatLog; }, [chatLog]);
  const gameStateRef = useRef<RoleplayState>(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  const partyRef = useRef<Companion[]>(party);
  useEffect(() => { partyRef.current = party; }, [party]);
  const memoriesRef = useRef<string[]>(memories);
  useEffect(() => { memoriesRef.current = memories; }, [memories]);
  const systemStateRef = useRef<SystemState>(systemState);
  useEffect(() => { systemStateRef.current = systemState; }, [systemState]);
  const choicesRef = useRef<string[]>(choices);
  useEffect(() => { choicesRef.current = choices; }, [choices]);
  const activeClashRef = useRef<ActiveStoryClashState | null>(activeClash);
  useEffect(() => { activeClashRef.current = activeClash; }, [activeClash]);
  const visitedNodesRef = useRef<VisitedStoryNode[]>(visitedStoryNodes);
  useEffect(() => { visitedNodesRef.current = visitedStoryNodes; }, [visitedStoryNodes]);

  // Synchronize shared combat, tactical, floor, and quest EXP to living deployed/present companions
  const applySharedSquadExp = useCallback(
    (
      protagonistExpGained: number,
      opts?: { focalCompanionName?: string | null; skipStarfallRoster?: boolean }
    ) => {
      if (!protagonistExpGained || protagonistExpGained <= 0) return;
      const isStarfall = currentStory?.id === "starfall-labyrinth";
      const curParty = partyRef.current || [];
      if (curParty.length === 0) return;

      const curLs = playerRef.current?.labyrinthState;
      const leveledUp: { name: string; newLevel: number; cap: number }[] = [];

      // If advanceFloor already awarded floor EXP to deployed Starfall roster entries, just sync party from roster
      if (isStarfall && opts?.skipStarfallRoster && curLs?.roster) {
        const syncedParty = curParty.map((comp) => {
          const rMatch = curLs.roster.find((r) =>
            matchesHeroineName(r.heroineName, comp.name, r.heroineId)
          );
          if (!rMatch) return comp;
          const prevLvl = comp.level || 1;
          const nextLvl = rMatch.level || 1;
          if (nextLvl > prevLvl && rMatch.status !== "FALLEN") {
            leveledUp.push({
              name: comp.name,
              newLevel: nextLvl,
              cap: getStarLevelCap(rMatch.starRank),
            });
          }
          return {
            ...comp,
            level: nextLvl,
            exp: rMatch.exp || 0,
            maxExp: rMatch.maxExp || getRequiredExpForLevel(nextLvl),
          };
        });
        partyRef.current = syncedParty;
        setParty(syncedParty);
      } else {
        let updatedRoster = curLs?.roster ? curLs.roster.map((r) => ({ ...r })) : null;
        const nextParty = curParty.map((comp) => {
          const rMatchIdx = updatedRoster
            ? updatedRoster.findIndex((r) =>
                matchesHeroineName(r.heroineName, comp.name, r.heroineId)
              )
            : -1;
          const rMatch = rMatchIdx >= 0 && updatedRoster ? updatedRoster[rMatchIdx] : null;
          const isFallen = comp.heroStatus === "FALLEN" || rMatch?.status === "FALLEN";
          const isDeployedOrPresent = isStarfall
            ? rMatch
              ? rMatch.status === "DEPLOYED"
              : comp.isPresent
            : comp.isPresent;

          if (isFallen || !isDeployedOrPresent) {
            const safeLvl = rMatch?.level || comp.level || 1;
            return {
              ...comp,
              level: safeLvl,
              exp: rMatch?.exp ?? comp.exp ?? 0,
              maxExp: getRequiredExpForLevel(safeLvl),
            };
          }

          const cap = isStarfall
            ? getStarLevelCap(rMatch?.starRank || comp.starRank || 1)
            : 60;
          const isFocal = Boolean(
            opts?.focalCompanionName &&
              matchesHeroineName(comp.name, opts.focalCompanionName, comp.id)
          );
          const compRes = resolveCompanionExpGain({
            level: rMatch?.level ?? comp.level ?? 1,
            exp: rMatch?.exp ?? comp.exp ?? 0,
            expGained: protagonistExpGained,
            maxLevelCap: cap,
            isFocalOrSynergy: isFocal,
          });

          if (compRes.levelsGained > 0) {
            leveledUp.push({ name: comp.name, newLevel: compRes.level, cap });
          }

          if (rMatchIdx >= 0 && updatedRoster) {
            updatedRoster[rMatchIdx] = {
              ...updatedRoster[rMatchIdx],
              level: compRes.level,
              exp: compRes.exp,
              maxExp: compRes.maxExp,
            };
          }

          return {
            ...comp,
            encountered: true,
            level: compRes.level,
            exp: compRes.exp,
            maxExp: compRes.maxExp,
          };
        });

        partyRef.current = nextParty;
        setParty(nextParty);

        if (isStarfall && curLs && updatedRoster) {
          const nextLs: LabyrinthState = {
            ...curLs,
            roster: updatedRoster,
          };
          const syncUpdated: PlayerProfile = {
            ...playerRef.current,
            labyrinthState: nextLs,
          };
          playerRef.current = syncUpdated;
          setPlayer((prev) => ({
            ...prev,
            labyrinthState: nextLs,
          }));
        }
      }

      if (leveledUp.length > 0) {
        pushNotification({
          id: `squad_lvl_${Date.now()}`,
          type: "quest_completed",
          title:
            leveledUp.length === 1
              ? `SQUAD LEVEL UP: ${leveledUp[0].name.toUpperCase()} -> LV.${leveledUp[0].newLevel}`
              : `SQUAD LEVEL UP (${leveledUp.length} ALLIES ADVANCED)!`,
          subtitle: leveledUp
            .map((u) => `${u.name} reached Lv.${u.newLevel}/${u.cap}`)
            .join(" • "),
          difficulty: "B",
        });
      }
    },
    [currentStory?.id]
  );

  // Cross-World Individual Character Roster State & Handlers (Identity-only blueprints)
  const [characterRoster, setCharacterRoster] = useState<SavedCharacterBlueprint[]>([]);
  const [rosterNotice, setRosterNotice] = useState<string | null>(null);
  const rosterFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadCharacterRoster()
      .then((list) => setCharacterRoster(list))
      .catch((err) => console.warn("Failed to load character roster:", err));
  }, [showCloudSyncModal]);

  const handleSaveCharacterToRoster = async () => {
    soundEffects.playQuestComplete();
    const bp = createBlueprintFromPlayer({
      player: playerRef.current || player,
      avatar: playerAvatar || "",
      narrationStyle,
      originWorldTitle: currentStory?.title || "Astra Chronicles",
    });
    const updatedList = await saveCharacterToRoster(bp);
    setCharacterRoster(updatedList);
    setRosterNotice(`Saved "${bp.name}" (${bp.race} ${bp.role}) to Character Roster!`);
    setTimeout(() => setRosterNotice(null), 3500);
  };

  const handleLoadCharacterFromRoster = (bp: SavedCharacterBlueprint) => {
    soundEffects.playIntroBell();
    const loadedTraits = Array.isArray(bp.racialTraits) ? bp.racialTraits : [];
    const loadedPersonaTraits = Array.isArray(bp.personalityTraits)
      ? bp.personalityTraits
      : ["Calculated", "Composed", "Observant", "Resolute"];

    // Match race preset or mark as custom
    const matchedRace = RACE_PRESETS.find(
      (r) =>
        r.name.toLowerCase() === (bp.race || "").toLowerCase() ||
        ((r as any).shortLabel && (r as any).shortLabel.toLowerCase() === (bp.race || "").toLowerCase())
    );
    setSelectedRacePreset(matchedRace ? matchedRace.id : "custom");
    setRacialTraitsInput(loadedTraits.join(", "));

    // Match personality preset or mark as custom
    const matchedPersona = PERSONALITY_PRESETS.find(
      (p) =>
        p.name.toLowerCase() === (bp.personality || "").toLowerCase() ||
        p.shortLabel.toLowerCase() === (bp.personality || "").toLowerCase()
    );
    setSelectedPersonalityPreset(matchedPersona ? matchedPersona.id : "custom");
    setPersonalityTraitsInput(loadedPersonaTraits.join(", "));

    // Match gender preset or mark as custom
    const matchedGender = GENDER_PRESETS.find(
      (g) => g.name.toLowerCase() === (bp.gender || "Male").trim().toLowerCase()
    );
    setSelectedGenderPreset(matchedGender ? matchedGender.id : "custom");

    // Match world origin preset or mark as custom
    const matchedOrigin = WORLD_ORIGIN_PRESETS.find(
      (o) =>
        o.name.toLowerCase() === (bp.worldOrigin || "Born & Raised (Native)").trim().toLowerCase() ||
        o.shortLabel.toLowerCase() === (bp.worldOrigin || "").trim().toLowerCase()
    );
    setSelectedWorldOriginPreset(matchedOrigin ? matchedOrigin.id : "custom");

    if (bp.narrationStyle) {
      setNarrationStyle(bp.narrationStyle);
    }
    setPlayerAvatar(bp.avatar || null);

    // Strictly apply identity fields ONLY — keep fresh Lv.1 stats & empty inventory/gear for the new run
    setPlayer((prev) => {
      const baseStats = currentStory?.rpgRules?.baseStats || {
        hp: 100,
        maxHp: 100,
        mp: 60,
        maxMp: 60,
        exp: 0,
        maxExp: BASE_LEVEL_ONE_MAX_EXP,
        str: 10,
        dex: 10,
        int: 10,
      };
      const next: PlayerProfile = {
        ...prev,
        name: bp.name || "Caelen",
        role: bp.role || "",
        gender: bp.gender || "Male",
        age: bp.age || "22",
        worldOrigin: bp.worldOrigin || "Born & Raised (Native)",
        worldOriginDetails:
          bp.worldOriginDetails ||
          matchedOrigin?.defaultDetails ||
          WORLD_ORIGIN_PRESETS[0].defaultDetails,
        race: bp.race || "Human",
        racialTraits: loadedTraits,
        personality: bp.personality || "Stoic Pragmatist",
        personalityTraits: loadedPersonaTraits,
        visualDescription: bp.visualDescription || prev.visualDescription,
        visualDna: bp.visualDna || prev.visualDna,
        narrationStyle: bp.narrationStyle || narrationStyle,
        level: 1,
        stats: {
          hp: baseStats.hp ?? 100,
          maxHp: baseStats.maxHp ?? 100,
          mp: baseStats.mp ?? 60,
          maxMp: baseStats.maxMp ?? 60,
          exp: 0,
          maxExp: baseStats.maxExp ?? BASE_LEVEL_ONE_MAX_EXP,
          str: baseStats.str ?? 10,
          dex: baseStats.dex ?? 10,
          int: baseStats.int ?? 10,
        },
        gear: { weapon: "Pending...", armor: "Pending...", relic: "None" },
        inventory: [],
      };
      playerRef.current = next;
      return next;
    });
    setStatPoints(10);
    setRosterNotice(`Loaded "${bp.name}" into ${currentStory?.title || "this world"} (Fresh Lv.1 Start)!`);
    setTimeout(() => setRosterNotice(null), 3500);
  };

  const handleDeleteCharacterFromRoster = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    const updated = await deleteCharacterFromRoster(id);
    setCharacterRoster(updated);
    setRosterNotice(`Removed "${name}" from Character Roster.`);
    setTimeout(() => setRosterNotice(null), 2500);
  };

  const handleExportCharacterBlueprint = (bp: SavedCharacterBlueprint, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playClick();
    const clean = normalizeCharacterBlueprint(bp);
    if (!clean) return;
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${clean.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.character.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCharacterBlueprint = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || "{}"));
        const clean = normalizeCharacterBlueprint(parsed);
        if (!clean) {
          alert("Invalid character blueprint JSON file.");
          return;
        }
        const updated = await saveCharacterToRoster(clean);
        setCharacterRoster(updated);
        handleLoadCharacterFromRoster(clean);
      } catch {
        alert("Failed to parse character blueprint JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Nano Banana 2.1 Scene Generation & Item Inspection State
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);

  // Global Escape key listener for drawers and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedCharacterCardComp) { setSelectedCharacterCardComp(null); return; }
        if (showGiftingModal) { setShowGiftingModal(false); return; }
        if (activeBespokeCG) { setActiveBespokeCG(null); return; }
        if (showShareModal) { setShowShareModal(false); return; }
        if (showFlowchartModal) { setShowFlowchartModal(false); return; }
        if (showPlayerSheet) { setShowPlayerSheet(false); return; }
        if (showPartyDrawer) { setShowPartyDrawer(false); return; }
        if (showChronicle) { setShowChronicle(false); return; }
        if (showMap) { setShowMap(false); return; }
        if (showSaveModal) { setShowSaveModal(false); return; }
        if (showSystemModal) { setShowSystemModal(false); return; }
        if (showCovenantModal) { setShowCovenantModal(false); return; }
        if (showCampUltimatumModal) { setShowCampUltimatumModal(false); return; }
        if (showScarsModal) { setShowScarsModal(false); return; }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCharacterCardComp,
    showGiftingModal,
    activeBespokeCG,
    showShareModal,
    showFlowchartModal,
    showPlayerSheet,
    showPartyDrawer,
    showChronicle,
    showMap,
    showSaveModal,
    showSystemModal,
    showCovenantModal,
    showCampUltimatumModal,
    showScarsModal,
  ]);
  const [isCachedScene, setIsCachedScene] = useState(false);
  const [generatedScene, setGeneratedScene] = useState<{
    imageUrl: string;
    prompt: string;
    model: string;
    location: string;
    speaker: string;
  } | null>(null);
  const [sceneGenError, setSceneGenError] = useState<string | null>(null);
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [isGeneratingItemIcon, setIsGeneratingItemIcon] = useState(false);
  const [isAwakeningRelic, setIsAwakeningRelic] = useState(false);
  const [showPortraitEditor, setShowPortraitEditor] = useState(false);
  const [clashCombatPopups, setClashCombatPopups] = useState<ClashCombatPopup[]>([]);
  const [lastClashHitEvent, setLastClashHitEvent] = useState<ClashVisualHitEvent | null>(null);
  const [isGeneratingEnemyImage, setIsGeneratingEnemyImage] = useState(false);
  const [vitalsFeedback, setVitalsFeedback] = useState<{
    id: number;
    hpDelta: number;
    mpDelta: number;
    reason: string;
  } | null>(null);
  const vitalsFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerVitalsFeedback = (hpDelta: number, mpDelta: number, reason?: string | null) => {
    if (hpDelta === 0 && mpDelta === 0) return;
    if (vitalsFeedbackTimerRef.current) {
      clearTimeout(vitalsFeedbackTimerRef.current);
    }
    const defaultReason =
      hpDelta < 0
        ? "Damage Sustained"
        : hpDelta > 0
        ? "Vitality Restored"
        : mpDelta < 0
        ? "Mana Expended"
        : "Mana Restored";
    setVitalsFeedback({
      id: Date.now(),
      hpDelta,
      mpDelta,
      reason: reason || defaultReason,
    });
    vitalsFeedbackTimerRef.current = setTimeout(() => {
      setVitalsFeedback(null);
    }, 2600);
  };
  const sceneFileInputRef = useRef<HTMLInputElement | null>(null);
  const itemFileInputRef = useRef<HTMLInputElement | null>(null);

  // User Access & Token Tracking
  const [accessKey, setAccessKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [userAuth, setUserAuth] = useState<{
    key: string;
    name: string;
    role: string;
    maxTurns: number;
    turnsUsed: number;
    remainingTurns: number;
    totalTokens: number;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showKeySecret, setShowKeySecret] = useState<boolean>(false);
  const [revealActiveKey, setRevealActiveKey] = useState<boolean>(false);

  const verifyKey = async (keyToTest: string): Promise<boolean> => {
    if (!keyToTest.trim()) {
      setAuthError("Please enter an access key.");
      return false;
    }
    setAuthLoading(true);
    setAuthError(null);

    // 1. Client-side local key verification fallback
    const clientResult = validateKeyClientSide(keyToTest);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: keyToTest.trim() }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok && data.valid) {
          setUserAuth(data.user);
          setAccessKey(keyToTest.trim());
          localStorage.setItem("astra_access_key", keyToTest.trim());
          setAuthLoading(false);
          setShowAuthModal(false);
          return true;
        } else if (!clientResult.valid) {
          setAuthError(data.error || "Invalid access key or quota reached.");
          setAuthLoading(false);
          return false;
        }
      }
    } catch (err) {
      console.warn("Server auth verify bypassed, evaluating client credential:", err);
    }

    // 2. Fallback: If client validation succeeded, approve the key
    if (clientResult.valid && clientResult.user) {
      setUserAuth(clientResult.user);
      setAccessKey(keyToTest.trim());
      localStorage.setItem("astra_access_key", keyToTest.trim());
      setAuthLoading(false);
      setShowAuthModal(false);
      return true;
    }

    setAuthError(clientResult.error || "Invalid access key. Please verify your credentials.");
    setAuthLoading(false);
    return false;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("astra_access_key");
      if (stored) {
        setAccessKey(stored);
        setKeyInput(stored);
        verifyKey(stored);
      } else {
        setShowAuthModal(true);
      }
    } catch (e) {
      console.warn("Could not read stored access key:", e);
    }
  }, []);

  const prologues = currentStory.startingNodes && currentStory.startingNodes.length > 0
    ? currentStory.startingNodes
    : [
        {
          id: "default_prologue",
          speaker: currentStory.companions[0]?.name || "Guide",
          title: `${currentStory.title}: Prelude`,
          location: currentStory.worldContext?.locations[0]?.name || "Starting Point",
          sceneSetup: currentStory.worldContext?.loreSummary || "A new horizon unfolds before you.",
          dialogue: "You have arrived. State your intentions.",
          expressionKey: "neutral" as const,
          choices: [
            "[Observe] Survey the surroundings carefully.",
            "[Engage] Introduce yourself with composure.",
            "[Tactics] Ready your gear for any incoming danger.",
            "[Wait] Remain silent and evaluate the atmosphere."
          ]
        }
      ];

  useEffect(() => {
    loadAllGameSlots()
      .then((slots) => {
        setSavedSlots(slots as Record<number, SaveSlotData | null>);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const loadSlotParam = params.get("loadSlot");
          const isReturningFromTrials = params.get("resuming") === "true" || sessionStorage.getItem("astra_trials_returning") === "true";
          const isCodexDivergence = params.get("diverge") === "codex";

          if (isCodexDivergence) {
            try {
              const rawSnapshot = sessionStorage.getItem("astra_codex_divergence_snapshot");
              if (rawSnapshot) {
                sessionStorage.removeItem("astra_codex_divergence_snapshot");
                window.history.replaceState({}, document.title, window.location.pathname);
                const parsed = JSON.parse(rawSnapshot);
                const snap = parsed.timelineSnapshot || {};
                const baseSlot = slots[0];

                if (snap.player) {
                  setPlayer(snap.player);
                  playerRef.current = snap.player;
                } else if (baseSlot?.player) {
                  setPlayer(baseSlot.player);
                  playerRef.current = baseSlot.player;
                }
                if (baseSlot?.playerAvatar) {
                  setPlayerAvatar(baseSlot.playerAvatar);
                }
                if (Array.isArray(snap.party) && snap.party.length > 0) {
                  setParty(snap.party);
                } else if (baseSlot?.party && baseSlot.party.length > 0) {
                  setParty(baseSlot.party);
                }

                const branchLoc = snap.location || parsed.location || "Astral Convergence";
                const branchSpk = snap.speaker || parsed.speaker || "Astra";
                const branchDialogue =
                  snap.dialogue ||
                  snap.narrativeText ||
                  parsed.prompt ||
                  `Timeline diverged at ${branchLoc}. The Akashic currents await your new decree.`;
                const branchChoices: string[] = Array.isArray(snap.choices) && snap.choices.length > 0
                  ? snap.choices.map((c: any) => (typeof c === "string" ? c : c.text || "[Act] Forge a new path"))
                  : [
                      `[Tactical] Seize control of the situation in ${branchLoc}`,
                      `[Empathetic] Confer with ${branchSpk} using foresight from the Codex`,
                      `[Bold] Channel your stance resonance and alter fate`,
                    ];

                isResumingSaveRef.current = true;
                setGameState((prev) => ({
                  ...prev,
                  location: branchLoc,
                  speaker: branchSpk,
                  dialogue: branchDialogue,
                  bgImage: parsed.imageUrl || prev.bgImage,
                }));
                setDisplayedText(branchDialogue);
                setChoices(branchChoices);
                setChatLog([
                  {
                    id: `diverge_${Date.now()}`,
                    sender: "character",
                    speakerName: branchSpk,
                    text: branchDialogue,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ]);
                setHasSeenWelcome(true);
                setIsConfigured(true);
                setTimeout(() => {
                  soundEffects.playIntroBell();
                  pushNotification({
                    id: `codex_diverge_${Date.now()}`,
                    type: "quest_assigned",
                    title: "AKASHIC TIMELINE DIVERGED",
                    subtitle: `What-If Replay branched at ${branchLoc} with ${branchSpk}.`,
                  });
                }, 500);
                return;
              }
            } catch (divErr) {
              console.warn("Failed to hydrate Codex timeline divergence:", divErr);
            }
          }

          if (loadSlotParam !== null || isReturningFromTrials) {
            const slotNum = loadSlotParam !== null ? parseInt(loadSlotParam, 10) : 0;
            const targetData = (!isNaN(slotNum) && slots[slotNum]) ? slots[slotNum] : slots[0];
            if (targetData) {
              window.history.replaceState({}, document.title, window.location.pathname);
              sessionStorage.removeItem("astra_trials_returning");
              handleLoadSlot(slotNum, targetData as SaveSlotData);
            }
          }

          // Check if returning from trials with synchronization results
          try {
            const trialSyncRaw = localStorage.getItem("astra_trial_sync_result");
            if (trialSyncRaw) {
              localStorage.removeItem("astra_trial_sync_result");
              const syncData = JSON.parse(trialSyncRaw);
              setTimeout(() => {
                soundEffects.playQuestComplete();
                if (syncData.levelsGained > 0) {
                  setAcquisitionAlert({
                    id: `trial_sync_level_${Date.now()}`,
                    type: "level",
                    title: `TRIAL SYNC: LEVEL ADVANCEMENT (LV.${syncData.newLevel})`,
                    subtitle: `+${syncData.expGained} EXP Synchronized from Trials • Status Upgraded`,
                  });
                } else if (syncData.expGained > 0) {
                  setAcquisitionAlert({
                    id: `trial_sync_exp_${Date.now()}`,
                    type: "level",
                    title: `TRIAL RESULTS SYNCHRONIZED`,
                    subtitle: `+${syncData.expGained} EXP Synchronized to Protagonist`,
                  });
                }

                if (syncData.itemsEarned && syncData.itemsEarned.length > 0) {
                  setTimeout(() => {
                    setAcquisitionAlert({
                      id: `trial_loot_${Date.now()}`,
                      type: "loot",
                      title: `TRIAL LOOT RECOVERED (${syncData.itemsEarned.length} Items)`,
                      subtitle: syncData.itemsEarned.join(", "),
                      rarity: "relic",
                    });
                  }, 800);
                }
              }, 2200);
            }
          } catch (e) {
            console.warn("Failed to process trial sync result:", e);
          }
        }
      })
      .catch((e) => {
        console.error("Failed to read save slots", e);
      });

    try {
      const storedAutoSave = localStorage.getItem("astra_autosave_enabled");
      if (storedAutoSave !== null) {
        setAutoSaveEnabled(storedAutoSave === "true");
      }
    } catch {}
  }, [showSaveModal]);

  const syncAvatarAnalysisFromServer = async (
    avatarDataUrl: string | null | undefined,
    name?: string,
    role?: string,
    race?: string,
    racialTraits?: string[],
    existingDescription?: string
  ) => {
    if (!avatarDataUrl) return;
    try {
      const res = await fetch("/api/analyze-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarBase64: avatarDataUrl,
          name: name || playerRef.current.name || "The Protagonist",
          role: role || playerRef.current.role || "Adventurer",
          race: race || playerRef.current.race || "Human",
          racialTraits: racialTraits || playerRef.current.racialTraits || [],
          existingDescription: existingDescription || undefined,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.visualDescription || data.visualDna) {
        const detectedAttire = resolvePortraitAttireLabel(
          data.visualDna,
          data.visualDescription,
          ""
        );
        setPlayer((prev) => {
          const currentArmorLower = (prev.gear?.armor || "").trim().toLowerCase();
          const shouldUpdateArmor =
            Boolean(detectedAttire) &&
            (currentArmorLower === "none" ||
              currentArmorLower === "unarmored" ||
              currentArmorLower === "portrait attire (unarmored)");
          const next = {
            ...prev,
            visualDna: data.visualDna || prev.visualDna,
            visualDescription: data.visualDescription || data.visualDna?.fullPromptAnchor || prev.visualDescription,
            gear: shouldUpdateArmor ? { ...prev.gear, armor: detectedAttire } : prev.gear,
          };
          playerRef.current = next;
          performAutoSave({ player: next, playerAvatar: avatarDataUrl });
          return next;
        });
      }
    } catch (err) {
      console.warn("[AvatarUpload] Server vision analysis skipped:", err);
    }
  };

  const healedAvatarRef = useRef<string | null>(null);
  useEffect(() => {
    if (!playerAvatar) return;
    const avatarSig = `${playerAvatar.slice(0, 64)}_${playerAvatar.length}`;
    if (healedAvatarRef.current === avatarSig) return;
    if (!player.visualDescription || isFallbackVisualDescription(player.visualDescription)) {
      healedAvatarRef.current = avatarSig;
      syncAvatarAnalysisFromServer(
        playerAvatar,
        player.name,
        player.role,
        player.race || "Human",
        player.racialTraits || []
      );
    }
  }, [playerAvatar, player.visualDescription, player.name, player.role, player.race, player.racialTraits]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const raw = reader.result as string;
      const optimized = await compressAvatarImage(raw, 384);
      setPlayerAvatar(optimized);

      // Clear any stale/fallback visualDescription immediately and analyze on server with Vision model
      setPlayer((prev) => {
        const next = { ...prev, visualDescription: undefined };
        playerRef.current = next;
        return next;
      });

      syncAvatarAnalysisFromServer(
        optimized,
        playerRef.current.name,
        playerRef.current.role,
        playerRef.current.race || "Human",
        playerRef.current.racialTraits || []
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRacePreset = (preset: typeof RACE_PRESETS[0]) => {
    setSelectedRacePreset(preset.id);
    if (preset.id === "custom") {
      return;
    }
    const newTraits = [...preset.defaultTraits];
    const newTraitsStr = newTraits.join(", ");
    setRacialTraitsInput(newTraitsStr);
    setPlayer((prev) => {
      const next = {
        ...prev,
        race: preset.name,
        racialTraits: newTraits,
      };
      playerRef.current = next;

      // Re-anchor visual DNA on server if an avatar has already been uploaded
      if (playerAvatar) {
        syncAvatarAnalysisFromServer(
          playerAvatar,
          next.name,
          next.role,
          next.race,
          newTraits,
          next.visualDescription
        );
      }

      return next;
    });
  };

  const handleCustomRaceChange = (newRace: string) => {
    setPlayer((prev) => {
      const next = { ...prev, race: newRace };
      playerRef.current = next;

      if (playerAvatar) {
        syncAvatarAnalysisFromServer(
          playerAvatar,
          next.name,
          next.role,
          next.race,
          next.racialTraits || [],
          next.visualDescription
        );
      }

      return next;
    });
    const match = RACE_PRESETS.find((p) => p.name.toLowerCase() === newRace.trim().toLowerCase());
    if (match) {
      setSelectedRacePreset(match.id);
    } else {
      setSelectedRacePreset("custom");
    }
  };

  const handleRacialTraitsChange = (value: string) => {
    setRacialTraitsInput(value);
    const parsed = value.split(",").map((s) => s.trim()).filter(Boolean);
    setPlayer((prev) => {
      const next = { ...prev, racialTraits: parsed };
      playerRef.current = next;

      if (playerAvatar) {
        syncAvatarAnalysisFromServer(
          playerAvatar,
          next.name,
          next.role,
          next.race || "Human",
          parsed,
          next.visualDescription
        );
      }

      return next;
    });
  };

  const handleSelectPersonalityPreset = (preset: PersonalityPreset) => {
    setSelectedPersonalityPreset(preset.id);
    if (preset.id === "custom") {
      return;
    }
    const newTraits = [...preset.defaultTraits];
    const newTraitsStr = newTraits.join(", ");
    setPersonalityTraitsInput(newTraitsStr);
    setPlayer((prev) => {
      const next = {
        ...prev,
        personality: preset.name,
        personalityTraits: newTraits,
      };
      playerRef.current = next;
      return next;
    });
  };

  const handleCustomPersonalityChange = (newPersona: string) => {
    setPlayer((prev) => {
      const next = { ...prev, personality: newPersona };
      playerRef.current = next;
      return next;
    });
    const match = PERSONALITY_PRESETS.find((p) => p.name.toLowerCase() === newPersona.trim().toLowerCase());
    if (match) {
      setSelectedPersonalityPreset(match.id);
    } else {
      setSelectedPersonalityPreset("custom");
    }
  };

  const handlePersonalityTraitsChange = (raw: string) => {
    setPersonalityTraitsInput(raw);
    const parsed = raw.split(",").map((t) => t.trim()).filter(Boolean);
    setPlayer((prev) => {
      const next = { ...prev, personalityTraits: parsed };
      playerRef.current = next;
      return next;
    });
  };

  const handleSelectGenderPreset = (preset: GenderPreset) => {
    setSelectedGenderPreset(preset.id);
    if (preset.id === "custom") {
      return;
    }
    setPlayer((prev) => {
      const next = { ...prev, gender: preset.name };
      playerRef.current = next;
      return next;
    });
  };

  const handleCustomGenderChange = (newGender: string) => {
    setPlayer((prev) => {
      const next = { ...prev, gender: newGender };
      playerRef.current = next;
      return next;
    });
    const match = GENDER_PRESETS.find(
      (g) => g.id !== "custom" && g.name.toLowerCase() === newGender.trim().toLowerCase()
    );
    setSelectedGenderPreset(match ? match.id : "custom");
  };

  const handleSelectWorldOriginPreset = (preset: WorldOriginPreset) => {
    setSelectedWorldOriginPreset(preset.id);
    if (preset.id === "custom") {
      return;
    }
    setPlayer((prev) => {
      const next = {
        ...prev,
        worldOrigin: preset.name,
        worldOriginDetails: preset.defaultDetails,
      };
      playerRef.current = next;
      return next;
    });
  };

  const handleSelectSovereignOriginPreset = (preset: AnyWorldOriginPreset) => {
    soundEffects.playClick();
    setSelectedWorldOriginPreset(preset.id);
    setPlayer((prev) => {
      const isSolarisPreset = "outstandingDebt" in preset;
      const isStarfallPreset = "startingStarShards" in preset;
      const activeStarterName =
        prologues[selectedPrologue]?.speaker ||
        currentStory?.companions?.[0]?.name ||
        "Pia Hollis";
      const next: PlayerProfile = {
        ...prev,
        worldOrigin: preset.name,
        worldOriginDetails: preset.defaultDetails,
        sovereignOrigin: preset.id,
        matriculationRank: preset.startingRank,
        semesterDebtQuota: preset.semesterDebtQuota,
        gold: preset.startingCrowns,
        ...(isSolarisPreset
          ? {
              boardingHouse: createInitialBoardingHouseState({
                outstandingDebt: (preset as PortSolarisOriginPreset).outstandingDebt,
                daysUntilAudit: (preset as PortSolarisOriginPreset).daysUntilAudit,
                starRating: (preset as PortSolarisOriginPreset).startingStarRating,
              }),
            }
          : {}),
        ...(isStarfallPreset
          ? {
              labyrinthState: createInitialLabyrinthState(preset.id as StarfallOrigin, {
                startingHeroineName: activeStarterName,
              }),
              starRank: (preset as StarfallOriginPreset).startingStarRank,
            }
          : {}),
      };
      playerRef.current = next;
      return next;
    });
  };

  const handleSelectSovereignConduitPreset = (preset: AnyWorldConduitPreset) => {
    soundEffects.playClick();
    setSelectedSovereignConduit(preset.id);
    const abNames = preset.startingAbilities.map((a) => a.name);
    const abDetails: Record<string, AbilityDetail> = {};
    preset.startingAbilities.forEach((a) => {
      abDetails[a.name] = a;
    });
    const usedPoints =
      Math.max(0, preset.statSpread.str - 11) +
      Math.max(0, preset.statSpread.dex - 11) +
      Math.max(0, preset.statSpread.int - 11);
    setStatPoints(Math.max(0, 10 - usedPoints));
    setPlayer((prev) => {
      const next: PlayerProfile = {
        ...prev,
        role: preset.roleTitle,
        conduit: preset.conduit,
        patronWing: preset.wing,
        abilities: abNames,
        abilityDetails: abDetails,
        stats: {
          ...prev.stats,
          str: preset.statSpread.str,
          dex: preset.statSpread.dex,
          int: preset.statSpread.int,
        },
      };
      playerRef.current = next;
      return next;
    });
  };

  const handleStartWithCanonWingLoadout = async () => {
    soundEffects.playClick();
    const worldPreset = getWorldPresets(currentStory.id);
    const pool = worldPreset ? worldPreset.conduits : SOVEREIGN_CONDUIT_PRESETS;
    const activeConduit =
      pool.find((c) => c.id === selectedSovereignConduit) || pool[0];
    const loadout = activeConduit.canonLoadout;
    const equippedGear = {
      weapon: loadout.weapon,
      armor: loadout.armor,
      relic: loadout.relic,
    };
    const startingItems: InventoryItem[] = [
      {
        id: `canon_wpn_${activeConduit.id}`,
        name: loadout.weapon,
        type: "weapon",
        rarity: "rare",
        description: worldPreset
          ? worldPreset.uiLabels.weaponDescription(activeConduit.wingLabel, activeConduit.conduit)
          : `Standard-issue ${activeConduit.wingLabel} armament tuned for ${activeConduit.conduit} conduit channeling.`,
        effect: worldPreset ? worldPreset.uiLabels.weaponEffect : "+15% Conduit Strike Efficiency",
      },
      {
        id: `canon_arm_${activeConduit.id}`,
        name: loadout.armor,
        type: "armor",
        rarity: "uncommon",
        description: worldPreset
          ? worldPreset.uiLabels.armorDescription(activeConduit.wingLabel)
          : `Tailored ${activeConduit.wingLabel} initiate attire reinforced against Stratum I Astra-Miasma.`,
        effect: worldPreset ? worldPreset.uiLabels.armorEffect : "+10% Calcification & Miasma Resistance",
      },
      {
        id: `canon_rel_${activeConduit.id}`,
        name: loadout.relic,
        type: "relic",
        rarity: "relic",
        description: `[Slot: ${loadout.relicSlot} • Set: ${loadout.setId}] ${loadout.whisperFlaw}`,
        effect: `Set Echo (${loadout.setId}) & Tag-Flaw Active`,
      },
    ];
    await handleStartGame(equippedGear, startingItems);
  };

  const handleCustomWorldOriginChange = (newOrigin: string) => {
    setPlayer((prev) => {
      const next = { ...prev, worldOrigin: newOrigin };
      playerRef.current = next;
      return next;
    });
    const match = WORLD_ORIGIN_PRESETS.find(
      (o) =>
        o.id !== "custom" &&
        (o.name.toLowerCase() === newOrigin.trim().toLowerCase() ||
          o.shortLabel.toLowerCase() === newOrigin.trim().toLowerCase())
    );
    setSelectedWorldOriginPreset(match ? match.id : "custom");
  };

  const handleStatChange = (stat: "str" | "dex" | "int", amount: number) => {
    const currentValue = player.stats[stat];
    if (amount > 0 && statPoints > 0) {
      setPlayer((prev) => {
        const next = { ...prev, stats: { ...prev.stats, [stat]: currentValue + 1 } };
        playerRef.current = next;
        return next;
      });
      setStatPoints((prev) => prev - 1);
    } else if (amount < 0 && currentValue > 10) {
      setPlayer((prev) => {
        const next = { ...prev, stats: { ...prev.stats, [stat]: currentValue - 1 } };
        playerRef.current = next;
        return next;
      });
      setStatPoints((prev) => prev + 1);
    }
  };

  const handleEquipItem = (item: InventoryItem, silent: boolean = false) => {
    let slotName: "weapon" | "armor" | "relic" | null = null;
    if (item.type === "weapon") slotName = "weapon";
    else if (item.type === "armor") slotName = "armor";
    else if (item.type === "relic") slotName = "relic";

    if (!slotName) return;

    soundEffects.playEquipChime();

    setPlayer((prev) => {
      const nextGear = { ...prev.gear, [slotName!]: item.name };
      const nextGearImages = {
        ...(prev.gearImages || {}),
        [item.name]: item.imageUrl || prev.gearImages?.[item.name] || "",
        ...(item.id ? { [item.id]: item.imageUrl || "" } : {}),
      };

      // Sync Port Solaris equippedKeepsakes for Caught Red-Handed jealousy checks
      let nextEquippedKeepsakes = prev.equippedKeepsakes || [];
      if (slotName === "relic") {
        const lowerName = item.name.toLowerCase();
        const canonicalMatch = Object.values(PORT_SOLARIS_CANONICAL_KEEPSAKES).find(
          (k) =>
            k.name.toLowerCase() === lowerName ||
            lowerName.includes(k.name.toLowerCase()) ||
            (k.giftedByHeroineId && lowerName.includes(k.giftedByHeroineId.split(" ")[0].toLowerCase()))
        );
        if (canonicalMatch) {
          nextEquippedKeepsakes = [canonicalMatch];
        } else {
          // Check if item mentions any Port Solaris heroine
          const heroineMatch = Object.values(PORT_SOLARIS_HEROINE_DOSSIERS).find((d) =>
            lowerName.includes(d.name.split(" ")[0].toLowerCase())
          );
          if (heroineMatch) {
            nextEquippedKeepsakes = [
              {
                id: item.id || `keepsake_${heroineMatch.id}`,
                name: item.name,
                slot: "POCKET_CHARM",
                giftedByHeroineId: heroineMatch.name,
                statModifiers: { maxComposure: 15, panachePower: 15 },
              },
            ];
          }
        }
      }

      const nextPlayer = {
        ...prev,
        gear: nextGear,
        gearImages: nextGearImages,
        equippedKeepsakes: nextEquippedKeepsakes,
      };
      playerRef.current = nextPlayer;
      performAutoSave({ player: nextPlayer });
      return nextPlayer;
    });

    if (!silent) {
      pushNotification({
        id: `equip_${Date.now()}`,
        type: "loot",
        title: `${slotName.toUpperCase()} EQUIPPED`,
        subtitle: `${item.name} is now your active ${slotName}.`,
        rarity: item.rarity || "common",
        imageUrl: item.imageUrl,
        metadata: item,
      });
      setAcquisitionAlert({
        id: `equip_alert_${Date.now()}`,
        type: "gear",
        title: "EQUIPMENT EQUIPPED",
        subtitle: `${item.name} (${slotName.toUpperCase()})`,
        imageUrl: item.imageUrl,
      });
    }
  };

  const handleInspectItem = async (item: InventoryItem) => {
    if (!item.imageUrl) {
      try {
        const cached = await getCodexLootByItem(currentStory.id, item.name);
        if (cached && cached.imageUrl) {
          const enriched = { ...item, imageUrl: cached.imageUrl };
          setInspectedItem(enriched);
          setPlayer((prev) => {
            const cleanName = item.name.trim().toLowerCase();
            const nextInv = prev.inventory.map((inv) =>
              (inv.id && inv.id === item.id) || inv.name.trim().toLowerCase() === cleanName
                ? { ...inv, imageUrl: cached.imageUrl }
                : inv
            );
            const updatedGearImages = {
              ...(prev.gearImages || {}),
              [item.id]: cached.imageUrl,
              [item.name]: cached.imageUrl,
            };
            const nextP = { ...prev, inventory: nextInv, gearImages: updatedGearImages };
            playerRef.current = nextP;
            performAutoSave({ player: nextP });
            return nextP;
          });
          return;
        }
      } catch (err) {
        console.warn("Failed checking codex for inspected item:", err);
      }
    }
    setInspectedItem(item);
  };

  // Proactively auto-hydrate inventory images from Multiverse Codex whenever inventory has items with missing images
  useEffect(() => {
    if (!currentStory?.id || !player.inventory || player.inventory.length === 0) return;
    if (isHydratingInventoryRef.current) return;

    const hasMissingImages = player.inventory.some((i) => !i.imageUrl || i.imageUrl.trim().length === 0);
    if (!hasMissingImages) return;

    isHydratingInventoryRef.current = true;
    let active = true;

    hydrateInventoryItems(currentStory.id, player.inventory)
      .then(({ hydrated, updatedCount }) => {
        if (active && updatedCount > 0) {
          setPlayer((prev) => {
            const nextGearImages = { ...(prev.gearImages || {}) };
            hydrated.forEach((item) => {
              if (item.imageUrl) {
                nextGearImages[item.id] = item.imageUrl;
                nextGearImages[item.name] = item.imageUrl;
              }
            });
            const nextP = { ...prev, inventory: hydrated, gearImages: nextGearImages };
            playerRef.current = nextP;
            performAutoSave({ player: nextP });
            return nextP;
          });
        }
      })
      .catch((err) => {
        console.warn("Auto-hydrate inventory error:", err);
      })
      .finally(() => {
        isHydratingInventoryRef.current = false;
      });

    return () => {
      active = false;
    };
  }, [currentStory?.id, player.inventory]);

  // Ensure inventory is immediately checked whenever the player sheet / bag drawer is opened
  useEffect(() => {
    if (!showPlayerSheet || !currentStory?.id || !player.inventory || player.inventory.length === 0) return;
    const hasMissingImages = player.inventory.some((i) => !i.imageUrl || i.imageUrl.trim().length === 0);
    if (!hasMissingImages) return;

    hydrateInventoryItems(currentStory.id, player.inventory).then(({ hydrated, updatedCount }) => {
      if (updatedCount > 0) {
        setPlayer((prev) => {
          const nextP = { ...prev, inventory: hydrated };
          playerRef.current = nextP;
          performAutoSave({ player: nextP });
          return nextP;
        });
      }
    });
  }, [showPlayerSheet, currentStory?.id]);

  const handleGenerateSceneCG = async (forceRegenerate: boolean | React.MouseEvent = false) => {
    soundEffects.playClick();
    setShowSceneModal(true);
    setSceneGenError(null);

    const isForce = forceRegenerate === true;

    // 1. If not forcing a re-roll, check Multiverse Codex cache first
    if (!isForce) {
      try {
        const cached = await findSceneForContext(currentStory.id, gameState.location, gameState.speaker);
        if (cached && cached.imageUrl) {
          setGeneratedScene({
            imageUrl: cached.imageUrl,
            prompt: cached.prompt,
            model: cached.model || "Google: Nano Banana 2.1 (Codex Archive)",
            location: cached.location,
            speaker: cached.speaker,
          });
          setIsCachedScene(true);
          setIsGeneratingScene(false);
          return;
        }
      } catch (cacheErr) {
        console.warn("Codex cache lookup error:", cacheErr);
      }
    }

    // 2. Synthesize new scene with Nano Banana 2.1
    setIsGeneratingScene(true);
    setIsCachedScene(false);

    try {
      // 1. Full Multi-Turn Narrative & Dialogue History
      const sceneTurns = chatLog.slice(-10);
      const recentDialogueHistory = sceneTurns.map((m) => ({
        speaker: m.speakerName || "Unknown",
        text: m.text,
      }));
      const fullNarrative = sceneTurns
        .map((m) => `${m.speakerName}: "${m.text}"`)
        .join("\n");

      // 2. Identify characters present in the scene
      const presentCompanions = party.filter((c) => c.isPresent || c.encountered);
      const presentCharacters = presentCompanions.map((c) => ({
        name: c.name,
        title: c.title,
        role: c.role,
        expression: c.expressionKey || "neutral",
        visualPrompt: c.visualPrompt || "",
        seed: c.seed,
        affection: c.affectionLevel ?? c.affection ?? 0,
        romancePath: c.romancePath || "mono",
        relationshipStage: c.relationshipStage || "confidant",
      }));

      // 3. Protagonist details with full Visual DNA anchoring
      const protagonistData = {
        name: player.name || "Protagonist",
        role: player.role || "Voidstrider",
        race: player.race || "Human",
        racialTraits: player.racialTraits || [],
        weapon: player.gear?.weapon || "Blade",
        visualDescription: player.visualDescription || undefined,
        visualDna: player.visualDna || undefined,
        avatarUrl: playerAvatar || undefined,
      };

      // 4. Romance & Emotional Stakes
      const activeCompanion = party.find((c) => c.name.toLowerCase().includes(gameState.speaker.toLowerCase())) || presentCompanions[0];
      const relationshipContext = activeCompanion
        ? `Active Companion: ${activeCompanion.name} (Affection: ${activeCompanion.affectionLevel ?? activeCompanion.affection ?? 0}%, Stage: ${activeCompanion.relationshipStage || "confidant"}, Romance: ${activeCompanion.romancePath || "mono"}).`
        : "Solo scene or introspective moment.";

      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          mode: "scene",
          sceneContext: {
            location: gameState.location,
            speaker: gameState.speaker,
            dialogue: gameState.dialogue,
            fullNarrative,
            recentDialogueHistory,
            presentCharacters,
            protagonist: protagonistData,
            relationshipContext,
            mood: gameState.mood,
            genre: currentStory.genre,
            storyTitle: currentStory.title,
            currentBg: gameState.bgImage,
          },
          userAccessKey: accessKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate scene illustration.");
      }

      const sceneData = {
        imageUrl: data.imageUrl,
        prompt: data.prompt,
        model: data.model || "Google: Nano Banana 2.1",
        location: data.location || gameState.location,
        speaker: data.speaker || gameState.speaker,
      };

      setGeneratedScene(sceneData);

      // Permanently archive in Multiverse Codex (IndexedDB)
      await saveCodexScene({
        storyId: currentStory.id,
        storyTitle: currentStory.title,
        location: sceneData.location,
        speaker: sceneData.speaker,
        prompt: sceneData.prompt,
        imageUrl: sceneData.imageUrl,
        model: sceneData.model,
        timelineSnapshot: {
          location: sceneData.location,
          speaker: sceneData.speaker,
          emotion: gameState.mood,
          dialogue: gameState.dialogue,
          narrativeText: gameState.dialogue,
          choices: choices.map((c, idx) => ({ id: `choice_${idx}`, text: c, tone: "Adaptive" })),
          turnNumber: chatLog.length,
          causalPlausibility: (systemState.covenantState as any)?.currentPlausibility ?? 85,
          player: playerRef.current || player,
          party,
        },
      });

      soundEffects.playIntroBell();
    } catch (err: any) {
      console.error("Scene generation error:", err);
      setSceneGenError(err.message || "Scene illustration synthesis timed out.");
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const handleUploadSceneReplacement = async (file: File) => {
    if (!generatedScene) return;
    soundEffects.playClick();
    try {
      const compressed = await processImageUpload(file, 1280);
      const updatedScene = {
        ...generatedScene,
        imageUrl: compressed,
        model: "User Upload / Bespoke",
      };
      setGeneratedScene(updatedScene);
      setIsCachedScene(true);

      // Overwrite/Update in Multiverse Codex
      await saveCodexScene({
        storyId: currentStory.id,
        storyTitle: currentStory.title,
        location: updatedScene.location,
        speaker: updatedScene.speaker,
        prompt: updatedScene.prompt || "Custom user replaced illustration",
        imageUrl: compressed,
        model: "User Upload / Bespoke",
      });
      soundEffects.playIntroBell();
    } catch (err: any) {
      alert(err.message || "Failed to upload image replacement");
    }
  };

  const handleGenerateItemImage = async (targetItem: InventoryItem, customImageUrl?: string) => {
    soundEffects.playClick();
    setIsGeneratingItemIcon(true);
    try {
      let finalImageUrl = customImageUrl;
      let modelUsed = "User Upload / Bespoke";

      if (!finalImageUrl) {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-key": accessKey,
          },
          body: JSON.stringify({
            mode: "loot",
            item: targetItem,
            genre: currentStory.genre,
            userAccessKey: accessKey,
          }),
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          finalImageUrl = data.imageUrl;
          modelUsed = data.model || "Google: Nano Banana 2.1";
        }
      }

      if (finalImageUrl) {
        // Permanently archive in Multiverse Codex
        await saveCodexLoot({
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          itemName: targetItem.name,
          itemType: targetItem.type,
          rarity: targetItem.rarity,
          description: targetItem.description,
          effect: targetItem.effect,
          imageUrl: finalImageUrl,
          model: modelUsed,
        });

        const cleanTargetName = (targetItem.name || "").trim().toLowerCase();
        setPlayer((prev) => {
          const updatedInv = prev.inventory.map((inv) =>
            (inv.id && inv.id === targetItem.id) ||
            inv.name.trim().toLowerCase() === cleanTargetName
              ? { ...inv, imageUrl: finalImageUrl }
              : inv
          );
          const nextP = { ...prev, inventory: updatedInv };
          playerRef.current = nextP;
          performAutoSave({ player: nextP });
          return nextP;
        });

        setInspectedItem((prev) =>
          prev &&
          ((prev.id && prev.id === targetItem.id) ||
            prev.name.trim().toLowerCase() === cleanTargetName)
            ? { ...prev, imageUrl: finalImageUrl }
            : prev
        );
        soundEffects.playIntroBell();
      }
    } catch (err) {
      console.warn("Item icon generation error:", err);
    } finally {
      setIsGeneratingItemIcon(false);
    }
  };

  const handleUploadItemReplacement = async (file: File) => {
    if (!inspectedItem) return;
    try {
      const compressed = await processImageUpload(file, 512);
      await handleGenerateItemImage(inspectedItem, compressed);
    } catch (err: any) {
      alert(err.message || "Failed to upload custom icon");
    }
  };

  const handlePurifyAndAwakenRelic = async (targetItem: InventoryItem) => {
    if (isAwakeningRelic) return;
    soundEffects.playQuestComplete();
    setIsAwakeningRelic(true);

    try {
      const prepared = ensureRelicUnsealingCondition(targetItem);
      const { awakenedItem, statBonuses, unlockedSkill } = awakenRelicItem(prepared);

      let newIconUrl = awakenedItem.imageUrl;
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-key": accessKey,
          },
          body: JSON.stringify({
            mode: "loot",
            item: {
              name: awakenedItem.name,
              type: awakenedItem.type,
              rarity: "relic",
              description: awakenedItem.description,
            },
            genre: currentStory.genre,
            userAccessKey: accessKey,
          }),
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          newIconUrl = data.imageUrl;
        }
      } catch (imgErr) {
        console.warn("Awakened relic image synthesis fallback:", imgErr);
      }

      const finalAwakened: InventoryItem = {
        ...awakenedItem,
        imageUrl: newIconUrl,
      };

      const oldNameClean = (targetItem.name || "").trim().toLowerCase();
      setPlayer((prev) => {
        const updatedInventory = prev.inventory.map((inv) =>
          (inv.id && inv.id === targetItem.id) ||
          inv.name.trim().toLowerCase() === oldNameClean
            ? finalAwakened
            : inv
        );

        const updatedGear = { ...prev.gear };
        if (updatedGear.weapon?.trim().toLowerCase() === oldNameClean) {
          updatedGear.weapon = finalAwakened.name;
        }
        if (updatedGear.armor?.trim().toLowerCase() === oldNameClean) {
          updatedGear.armor = finalAwakened.name;
        }
        if (updatedGear.relic?.trim().toLowerCase() === oldNameClean) {
          updatedGear.relic = finalAwakened.name;
        }

        const updatedGearImages = { ...(prev.gearImages || {}) };
        if (newIconUrl) {
          updatedGearImages[finalAwakened.id] = newIconUrl;
          updatedGearImages[finalAwakened.name] = newIconUrl;
        }

        const updatedAbilities = unlockedSkill && !prev.abilities.includes(unlockedSkill.name)
          ? [...prev.abilities, unlockedSkill.name]
          : prev.abilities;

        const updatedAbilityDetails = unlockedSkill
          ? { ...(prev.abilityDetails || {}), [unlockedSkill.name]: unlockedSkill }
          : prev.abilityDetails;

        const hpBonus = statBonuses.maxHp || 25;
        const mpBonus = statBonuses.maxMp || 15;

        const nextP: PlayerProfile = {
          ...prev,
          stats: {
            ...prev.stats,
            maxHp: prev.stats.maxHp + hpBonus,
            hp: prev.stats.hp + hpBonus,
            maxMp: prev.stats.maxMp + mpBonus,
            mp: prev.stats.mp + mpBonus,
            str: prev.stats.str + (statBonuses.str || 4),
            dex: prev.stats.dex + (statBonuses.dex || 4),
            int: prev.stats.int + (statBonuses.int || 4),
          },
          gear: updatedGear,
          gearImages: updatedGearImages,
          abilities: updatedAbilities,
          abilityDetails: updatedAbilityDetails,
          inventory: updatedInventory,
        };
        playerRef.current = nextP;
        performAutoSave({ player: nextP });
        return nextP;
      });

      setInspectedItem(finalAwakened);

      if (newIconUrl) {
        await saveCodexLoot({
          storyId: currentStory.id,
          storyTitle: currentStory.title,
          itemName: finalAwakened.name,
          itemType: finalAwakened.type,
          rarity: "relic",
          description: finalAwakened.description,
          effect: finalAwakened.effect,
          imageUrl: newIconUrl,
          model: "Mythic Awakening Synthesis",
        });
      }

      pushNotification({
        id: `relic_awakened_${Date.now()}`,
        type: "loot",
        title: "MYTHIC RELIC AWAKENED",
        subtitle: `${targetItem.name} purified into ${finalAwakened.name}! Unlocked Skill: ${unlockedSkill.name}`,
        imageUrl: newIconUrl,
        rarity: "relic",
        metadata: finalAwakened,
      });
    } finally {
      setIsAwakeningRelic(false);
    }
  };

  const getSpriteSrc = (speaker: string, key: string) => {
    const safeSpeaker = String(speaker || "");
    const safeSpeakerLower = safeSpeaker.toLowerCase();
    const rawNormalized = key === "injured" ? "hurt" : key || "neutral";
    const matchingPartyHero = party.find(
      (p) =>
        Boolean(p?.name) &&
        (p.name.toLowerCase().includes(safeSpeakerLower) ||
          safeSpeakerLower.includes(p.name.toLowerCase()))
    );
    const matchingRosterHero = (player.labyrinthState?.roster || []).find((r) =>
      matchesHeroineName(r.heroineName, safeSpeaker, r.heroineId)
    );
    const isActuallyWounded =
      matchingPartyHero?.heroStatus === "WOUNDED" ||
      matchingRosterHero?.status === "WOUNDED";
    const normalizedKey =
      currentStory.id === "starfall-labyrinth" &&
      rawNormalized === "hurt" &&
      !isActuallyWounded &&
      !player.labyrinthState?.activeEncounter?.isActive
        ? "flustered"
        : rawNormalized;
    const validStarfallExpr = ["neutral", "intrigued", "flustered", "smug", "combat_ready", "hurt"].includes(
      normalizedKey
    )
      ? normalizedKey
      : "neutral";

    const companion = currentStory.companions?.find(
      (c) =>
        Boolean(c?.name) &&
        (c.name.toLowerCase().includes(safeSpeakerLower) ||
          safeSpeakerLower.includes(c.name.toLowerCase()))
    );
    if (companion) {
      if (companion.expressions && companion.expressions[normalizedKey]) {
        return companion.expressions[normalizedKey];
      }
      if (companion.expressions && companion.expressions.neutral) {
        return companion.expressions.neutral;
      }
      if (companion.baseImageUrl) {
        return companion.baseImageUrl;
      }
    }

    // Starfall Labyrinth 12-Heroine Expression Resolver (6 Core + 6 Google Drive OCs)
    if (safeSpeakerLower) {
      const sfMatch = Object.values(STARFALL_HEROINE_DOSSIERS).find((d) =>
        matchesHeroineName(d.name, safeSpeaker, d.id)
      );
      if (sfMatch?.spriteSlug) {
        return `/characters/starfall-labyrinth/${sfMatch.spriteSlug}/${validStarfallExpr}.png`;
      }
    }

    if (safeSpeakerLower.includes("evelyn")) {
      return EVELYN_EXPRESSIONS[normalizedKey] || EVELYN_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (safeSpeakerLower.includes("aria")) {
      return ARIA_EXPRESSIONS[normalizedKey] || ARIA_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (safeSpeakerLower.includes("serena")) {
      return SERENA_EXPRESSIONS[normalizedKey] || SERENA_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (safeSpeakerLower.includes("morgana")) {
      return MORGANA_EXPRESSIONS[normalizedKey] || MORGANA_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (safeSpeakerLower.includes("perci")) {
      return PERCI_EXPRESSIONS[normalizedKey] || PERCI_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (safeSpeakerLower.includes("cassia")) {
      return "/characters/sovereign-spire/cassia_valen.png";
    }
    if (safeSpeakerLower.includes("beatrix")) {
      return "/characters/sovereign-spire/beatrix_valorian.png";
    }
    if (safeSpeakerLower.includes("ysolde")) {
      return "/characters/sovereign-spire/ysolde_kaelen.png";
    }
    if (safeSpeakerLower.includes("aurelia")) {
      return "/characters/sovereign-spire/aurelia_solis.png";
    }
    if (safeSpeakerLower.includes("miri") || safeSpeakerLower.includes("mireille")) {
      return "/characters/sovereign-spire/miri_thorne.png";
    }
    if (safeSpeakerLower.includes("noelle")) {
      return "/characters/sovereign-spire/noelle_vesper.png";
    }
    if (safeSpeakerLower.includes("kestrel") || safeSpeakerLower.includes("kes ")) {
      return "/characters/sovereign-spire/kestrel_hollow.png";
    }
    if (safeSpeakerLower.includes("valeria")) {
      return "/characters/sovereign-spire/valeria_noctis.png";
    }
    if (safeSpeakerLower.includes("seraphina")) {
      return "/characters/port-solaris/seraphina_vane.png";
    }
    if (safeSpeakerLower.includes("vivienne")) {
      return "/characters/port-solaris/vivienne_laurent.png";
    }
    if (safeSpeakerLower.includes("mia")) {
      return "/characters/port-solaris/mia_bellini.png";
    }
    if (safeSpeakerLower.includes("colette")) {
      return "/characters/port-solaris/colette_moreau.png";
    }
    if (safeSpeakerLower.includes("pippa") || safeSpeakerLower.includes("pip ")) {
      return "/characters/port-solaris/pippa_reyes.png";
    }
    if (safeSpeakerLower.includes("kaede")) {
      return "/characters/port-solaris/kaede_tachibana.png";
    }
    if (safeSpeakerLower.includes("roxy")) {
      return "/characters/port-solaris/roxy_vance.png";
    }
    if (safeSpeakerLower.includes("chloe")) {
      return "/characters/port-solaris/chloe_lin.png";
    }
    if (safeSpeakerLower.includes("nadia") || safeSpeakerLower.includes("saint-clair")) {
      return "/characters/port-solaris/nadia_saint_clair.png";
    }
    if (safeSpeakerLower.includes("zuri") || safeSpeakerLower.includes("delacroix")) {
      return "/characters/port-solaris/zuri_delacroix.png";
    }
    return DEFAULT_FALLBACK_SPRITE;
  };

  const getLocationBg = (locName: string, floorOverride?: number): string => {
    if (!locName) return currentStory.coverImage || DEFAULT_BG;
    if (currentStory.id === "starfall-labyrinth") {
      const lowerLoc = locName.toLowerCase();
      if (lowerLoc.includes("iron barracks") || lowerLoc.includes("barracks")) {
        return "/backgrounds/starfall-labyrinth/roster_barracks.jpg";
      }
      if (lowerLoc.includes("memorial")) {
        return "/backgrounds/starfall-labyrinth/memorial_sanctum.jpg";
      }
      if (lowerLoc.includes("conduit chamber") || lowerLoc.includes("master's console")) {
        return "/backgrounds/starfall-labyrinth/masters_console.jpg";
      }
      if (isStarfallLobbyLocation(locName)) {
        if (typeof floorOverride === "number" && floorOverride > 0) {
          return getStarfallFloorBackgroundUrl(floorOverride, locName);
        }
        return "/backgrounds/starfall-labyrinth/star_gate_plaza.jpg";
      }
      const inferredFloor =
        typeof floorOverride === "number" && floorOverride > 0
          ? floorOverride
          : inferFloorFromLocation(
              locName,
              playerRef.current?.labyrinthState?.currentFloor || 0
            );
      if (inferredFloor > 0) {
        return getStarfallFloorBackgroundUrl(inferredFloor, locName);
      }
    }
    const match = currentStory.worldContext?.locations?.find(
      (l) =>
        Boolean(l?.name) &&
        (l.name.toLowerCase() === locName.toLowerCase() ||
          locName.toLowerCase().includes(l.name.toLowerCase()) ||
          l.name.toLowerCase().includes(locName.toLowerCase()))
    );
    if (match?.bgImage && match.bgImage.trim()) return match.bgImage.trim();
    if (LOCATION_BACKGROUNDS[locName]) return LOCATION_BACKGROUNDS[locName];
    return gameState?.bgImage || currentStory.coverImage || DEFAULT_BG;
  };

  const handleStartGame = async (
    customGear?: { weapon: string; armor: string; relic: string },
    customInventory?: InventoryItem[]
  ) => {
    if (!player.role.trim()) {
      alert("Please define a custom class or archetype.");
      return;
    }

    if (!accessKey) {
      setShowAuthModal(true);
      setAuthError("Please validate an access key before starting your journey.");
      return;
    }

    const chosen = prologues[selectedPrologue] || prologues[0];
    const initialBg = getLocationBg(chosen.location);

    soundEffects.playRiftTransition();

    setIsTransitioning({
      location: chosen.location,
      speaker: chosen.speaker,
      quote: "Observing mortal arrival & forging bespoke dynamic prologue...",
    });

    const basePlayer = playerRef.current || player;
    const portraitAttire = resolvePortraitAttireLabel(
      basePlayer.visualDna,
      basePlayer.visualDescription,
      "Portrait Attire (Unarmored)"
    );
    const initialGear = customGear || (gearPreference === "none"
      ? { weapon: "Unarmed", armor: portraitAttire, relic: "None" }
      : { weapon: "[System Pending]", armor: "[System Pending]", relic: "None" });

    const initialGearImages: Record<string, string> = { ...(player.gearImages || {}) };
    if (customInventory) {
      customInventory.forEach((item) => {
        if (item.imageUrl) {
          initialGearImages[item.id] = item.imageUrl;
          initialGearImages[item.name] = item.imageUrl;
        }
      });
    }

    const syncedStarfallState =
      currentStory.id === "starfall-labyrinth"
        ? createInitialLabyrinthState(
            (basePlayer.sovereignOrigin as StarfallOrigin) || "DISCARDED_EX_RANKER",
            {
              startingHeroineName: chosen.speaker,
              seed: basePlayer.labyrinthState?.summonSeed,
            }
          )
        : undefined;
    const finalStartingPlayer: PlayerProfile = {
      ...basePlayer,
      personality: player.personality || basePlayer.personality || "Stoic Pragmatist",
      personalityTraits:
        player.personalityTraits && player.personalityTraits.length > 0
          ? player.personalityTraits
          : basePlayer.personalityTraits || ["Calculated", "Unflinching", "Efficient", "Vigilant"],
      gear: initialGear,
      gearImages: initialGearImages,
      inventory: ensureInventoryRelicConditions(customInventory ? [...(basePlayer.inventory || []), ...customInventory] : (basePlayer.inventory || [])),
      narrationStyle,
      ...(syncedStarfallState ? { labyrinthState: syncedStarfallState } : {}),
    };
    setPlayer(finalStartingPlayer);
    playerRef.current = finalStartingPlayer;

    const startTime = Date.now();

    try {
      const res = await fetch("/api/prologue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          playerProfile: finalStartingPlayer,
          playerAvatarBase64: playerAvatar,
          startingHeroine: chosen.speaker,
          startingLocation: chosen.location,
          selectedPrologueNode: chosen,
          narrationStyle,
          userAccessKey: accessKey,
          storyContext: currentStory,
          activeSynergies: activeRelicSynergies,
          targetEnvironment: llmConfig.targetEnvironment,
          modelId: llmConfig.modelId,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.max_tokens,
          repetition_penalty: llmConfig.repetition_penalty,
          narrativeDepth: llmConfig.narrativeDepth,
        }),
      });

      if (!res.ok) {
        throw new Error("Prologue generation request returned error.");
      }

      const data = await res.json();
      if (data._userStats) {
        setUserAuth(data._userStats);
      }
      if (
        (data.visual_description && typeof data.visual_description === "string") ||
        data.portrait_attire ||
        data.visual_dna
      ) {
        setPlayer((prev) => {
          const resolvedDna = data.visual_dna || prev.visualDna;
          const resolvedDesc =
            data.visual_description && typeof data.visual_description === "string"
              ? data.visual_description
              : prev.visualDescription;
          const resolvedAttire =
            (typeof data.portrait_attire === "string" && data.portrait_attire.trim()) ||
            resolvePortraitAttireLabel(resolvedDna, resolvedDesc, "");
          const currentArmorLower = (prev.gear?.armor || "").trim().toLowerCase();
          const shouldUpdateArmor =
            Boolean(resolvedAttire) &&
            (gearPreference === "none" ||
              currentArmorLower === "none" ||
              currentArmorLower === "unarmored" ||
              currentArmorLower === "portrait attire (unarmored)");
          const next = {
            ...prev,
            visualDescription: resolvedDesc,
            visualDna: resolvedDna,
            gear: shouldUpdateArmor ? { ...prev.gear, armor: resolvedAttire } : prev.gear,
          };
          playerRef.current = next;
          return next;
        });
      }

      // Systems Evolution State Handling (Pillars A, B, C)
      if (data.state_updates?.covenant_update) {
        const covUpdate = data.state_updates.covenant_update;
        if (covUpdate.scar) {
          setTimelineScars((prev) => [covUpdate.scar, ...prev]);
        }
        if (covUpdate.systemToast) {
          setSystemToast(covUpdate.systemToast);
          pushNotification({
            id: covUpdate.systemToast.id || `covenant_${Date.now()}`,
            type: "covenant_severance",
            title: covUpdate.systemToast.title,
            subtitle: covUpdate.systemToast.subtitle,
            difficulty: covUpdate.systemToast.difficulty,
          });
        }
        soundEffects.playSystemAlert();
      }

      if (data.state_updates?.friction_state) {
        setFrictionState(data.state_updates.friction_state);
      }
      if (data.state_updates?.rivalry_alert) {
        soundEffects.playSystemAlert();
        pushNotification({
          id: `rivalry_${Date.now()}`,
          type: "companion_friction",
          title: data.state_updates.rivalry_alert.title || "INTERPERSONAL FRICTION ESCALATION",
          subtitle: data.state_updates.rivalry_alert.reason,
        });
      }
      if (data.state_updates?.triggered_ultimatum) {
        soundEffects.playSystemAlert();
        setActiveUltimatumRivalry(data.state_updates.triggered_ultimatum);
        setShowCampUltimatumModal(true);
      }

      if (data.state_updates?.story_clash) {
        setActiveClash(data.state_updates.story_clash);
      }

      const activeSpeaker = data.speaker || chosen.speaker;
      const initialAffection = typeof data.initial_affection === "number" ? data.initial_affection : 15;
      const rawExpr = data.expression_key || chosen.expressionKey || "neutral";
      const activeExpression =
        rawExpr === "hurt" && !data.state_updates?.story_clash ? "flustered" : rawExpr;
      const initialSprite = getSpriteSrc(activeSpeaker, activeExpression);
      const rawDialogue = (data.dialogue || chosen.dialogue || "").trim();
      const formattedDialogue = rawDialogue.includes('"') ? rawDialogue : `"${rawDialogue}"`;
      const sceneSetup = (data.scene_setup || chosen.sceneSetup || "").trim();
      const openingPrologueText = sceneSetup ? `${sceneSetup}\n\n${formattedDialogue}` : formattedDialogue;

      const initialPresentList: string[] =
        Array.isArray(chosen.presentCompanions) && chosen.presentCompanions.length > 0
          ? chosen.presentCompanions
          : Array.isArray(data.present_companions) && data.present_companions.length > 0
          ? data.present_companions
          : [activeSpeaker];

      setParty((prevParty) =>
        prevParty.map((comp) => {
          const isPrimary = comp.name.toLowerCase().includes(activeSpeaker.toLowerCase());
          const isPresentInScene =
            isPrimary ||
            initialPresentList.some((name) =>
              comp.name.toLowerCase().includes(name.toLowerCase())
            );
          return {
            ...comp,
            isPresent: isPresentInScene,
            encountered: isPresentInScene,
            affection: isPrimary ? initialAffection : comp.affection,
            expressionKey: isPrimary ? activeExpression : "neutral",
            ...(currentStory.id === "starfall-labyrinth"
              ? { heroStatus: isPresentInScene ? ("DEPLOYED" as HeroStatus) : ("BENCHED" as HeroStatus) }
              : {}),
          };
        })
      );

      setGameState({
        speaker: activeSpeaker,
        location: data.location || chosen.location,
        dialogue: openingPrologueText,
        mood: data.initial_mood || "Guarded & Observant",
        bgImage: initialBg,
        presentCompanions: initialPresentList,
      });

      setChatLog([
        {
          id: "start",
          sender: "character",
          speakerName: activeSpeaker,
          text: openingPrologueText,
          timestamp: "Prologue",
          avatarSrc: initialSprite,
        },
      ]);

      const activeOpeningChoices =
        Array.isArray(data.opening_choices) && data.opening_choices.length > 0
          ? data.opening_choices.slice(0, 4)
          : buildPersonalityFallbackChoices({
              personality: finalStartingPlayer.personality,
              personalityTraits: finalStartingPlayer.personalityTraits,
              playerRole: finalStartingPlayer.role,
              playerRace: finalStartingPlayer.race,
              activeSpeaker,
              location: data.location || chosen.location,
              isProtagonistAlone: false,
              storyId: currentStory?.id,
              genre: currentStory?.genre,
            });
      setChoices(activeOpeningChoices);

      const initPartyState = party.map((comp) => {
        const isPrimary = comp.name.toLowerCase().includes(activeSpeaker.toLowerCase());
        const isPresentInScene =
          isPrimary ||
          initialPresentList.some((name) =>
            comp.name.toLowerCase().includes(name.toLowerCase())
          );
        return {
          ...comp,
          isPresent: isPresentInScene,
          encountered: isPresentInScene,
          affection: isPrimary ? initialAffection : comp.affection,
          expressionKey: isPrimary ? activeExpression : "neutral",
        };
      });

      const initialOpeningAnchor: VisitedStoryNode = {
        id: `node_${chosen.id}`,
        nodeKey: chosen.id,
        title: chosen.title,
        speaker: activeSpeaker,
        location: data.location || chosen.location,
        visitedAt: new Date().toISOString(),
        choiceTaken: "Campaign Commenced",
        affectionSnapshot: { [activeSpeaker]: initialAffection },
        gameStateSnapshot: {
          gameState: {
            speaker: activeSpeaker,
            location: data.location || chosen.location,
            dialogue: openingPrologueText,
            mood: data.initial_mood || "Guarded & Observant",
            bgImage: initialBg,
            presentCompanions: initialPresentList,
          },
          party: initPartyState,
          player: playerRef.current || finalStartingPlayer,
          systemState: data.initial_quest
            ? {
                plausibility: typeof data.plausibility === "number" ? data.plausibility : 80,
                plausibilityTier: (typeof data.plausibility === "number" ? data.plausibility : 80) >= 70 ? "Stable" : "Strained",
                activeQuests: [data.initial_quest],
                completedQuests: [],
                systemDirectives: [data.system_announcement || `[SYSTEM: Scenario 1 assigned to ${player.name}.]`],
              }
            : systemState,
          memories: [],
          chatLog: [
            {
              id: "start",
              sender: "character",
              speakerName: activeSpeaker,
              text: openingPrologueText,
              timestamp: "Prologue",
              avatarSrc: initialSprite,
            },
          ],
          choices: activeOpeningChoices,
        },
        isAnchor: true,
        anchorLabel: `Prologue: ${chosen.title}`,
        isStartingPoint: true,
      };

      setVisitedStoryNodes([initialOpeningAnchor]);

      if (data.initial_quest) {
        const initQ: SystemQuest = data.initial_quest;
        const initPlausibility = typeof data.plausibility === "number" ? data.plausibility : 80;
        const initTier = initPlausibility >= 70 ? "Stable" : "Strained";
        const initDir = data.system_announcement || `[SYSTEM: Scenario 1 assigned to ${player.name}.]`;

        setSystemState({
          plausibility: initPlausibility,
          plausibilityTier: initTier,
          activeQuests: [initQ],
          completedQuests: [],
          systemDirectives: [initDir],
        });

        setTimeout(() => {
          soundEffects.playSystemNotification();
          setSystemToast({
            id: "init_quest",
            type: "quest_assigned",
            title: initQ.title,
            subtitle: initQ.description,
            difficulty: initQ.difficulty,
            timestamp: "Now",
          });
        }, 2200);
      }
    } catch (err) {
      console.warn("Prologue AI fallback:", err);

      const initialSprite = getSpriteSrc(chosen.speaker, chosen.expressionKey);
      const rawDialogue = (chosen.dialogue || "").trim();
      const formattedDialogue = rawDialogue.startsWith('"') ? rawDialogue : `"${rawDialogue}"`;
      const sceneSetup = (chosen.sceneSetup || "").trim();
      const openingPrologueText = sceneSetup ? `${sceneSetup}\n\n${formattedDialogue}` : formattedDialogue;

      const fallbackPresentList: string[] =
        Array.isArray(chosen.presentCompanions) && chosen.presentCompanions.length > 0
          ? chosen.presentCompanions
          : [chosen.speaker];

      setParty((prevParty) =>
        prevParty.map((comp) => {
          const isPrimary = comp.name.toLowerCase().includes(chosen.speaker.toLowerCase());
          const isPresentInScene =
            isPrimary ||
            fallbackPresentList.some((name) =>
              comp.name.toLowerCase().includes(name.toLowerCase())
            );
          return {
            ...comp,
            isPresent: isPresentInScene,
            encountered: isPresentInScene,
            affection: isPrimary ? 15 : comp.affection,
            expressionKey: isPrimary ? chosen.expressionKey : "neutral",
          };
        })
      );

      setGameState({
        speaker: chosen.speaker,
        location: chosen.location,
        dialogue: openingPrologueText,
        mood: "Guarded & Observant",
        bgImage: initialBg,
        presentCompanions: fallbackPresentList,
      });

      setChatLog([
        {
          id: "start",
          sender: "character",
          speakerName: chosen.speaker,
          text: openingPrologueText,
          timestamp: "Prologue",
          avatarSrc: initialSprite,
        },
      ]);
      const fallbackPersonaChoices = buildPersonalityFallbackChoices({
        personality: finalStartingPlayer.personality,
        personalityTraits: finalStartingPlayer.personalityTraits,
        playerRole: finalStartingPlayer.role,
        playerRace: finalStartingPlayer.race,
        activeSpeaker: chosen.speaker,
        location: chosen.location,
        isProtagonistAlone: false,
        storyId: currentStory?.id,
        genre: currentStory?.genre,
      });
      setChoices(fallbackPersonaChoices);

      const fallbackPartyState = party.map((comp) => {
        const isPrimary = comp.name.toLowerCase().includes(chosen.speaker.toLowerCase());
        const isPresentInScene =
          isPrimary ||
          fallbackPresentList.some((name) =>
            comp.name.toLowerCase().includes(name.toLowerCase())
          );
        return {
          ...comp,
          isPresent: isPresentInScene,
          encountered: isPresentInScene,
          affection: isPrimary ? 15 : comp.affection,
          expressionKey: isPrimary ? chosen.expressionKey : "neutral",
        };
      });

      const fallbackOpeningAnchor: VisitedStoryNode = {
        id: `node_${chosen.id}`,
        nodeKey: chosen.id,
        title: chosen.title,
        speaker: chosen.speaker,
        location: chosen.location,
        visitedAt: new Date().toISOString(),
        choiceTaken: "Campaign Commenced",
        affectionSnapshot: { [chosen.speaker]: 15 },
        gameStateSnapshot: {
          gameState: {
            speaker: chosen.speaker,
            location: chosen.location,
            dialogue: openingPrologueText,
            mood: "Guarded & Observant",
            bgImage: initialBg,
            presentCompanions: fallbackPresentList,
          },
          party: fallbackPartyState,
          player: finalStartingPlayer,
          systemState,
          memories: [],
          chatLog: [
            {
              id: "start",
              sender: "character",
              speakerName: chosen.speaker,
              text: openingPrologueText,
              timestamp: "Prologue",
              avatarSrc: initialSprite,
            },
          ],
          choices: chosen.choices,
        },
        isAnchor: true,
        anchorLabel: `Prologue: ${chosen.title}`,
        isStartingPoint: true,
      };

      setVisitedStoryNodes([fallbackOpeningAnchor]);
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 2200 - elapsed);

      setTimeout(() => {
        isConfiguredRef.current = true;
        setIsConfigured(true);
        setIsTransitioning(null);
        performAutoSave({
          player: playerRef.current || finalStartingPlayer,
          choices: choicesRef.current.length === 4 ? choicesRef.current : chosen.choices,
          selectedPrologueId: chosen.id,
        });
      }, remainingDelay);
    }
  };

  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);

  const handleDeleteSlot = async (slotId: number) => {
    soundEffects.playClick();
    try {
      await deleteGameSlot(slotId);
      setSavedSlots((prev) => ({ ...prev, [slotId]: null }));
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setConfirmDeleteSlot(null);
  };

  const handleSaveSlot = async (slotId: number) => {
    soundEffects.playClick();
    let currentAvatar = playerAvatar;
    if (currentAvatar && currentAvatar.length > 80000) {
      currentAvatar = await compressAvatarImage(currentAvatar, 384);
      setPlayerAvatar(currentAvatar);
    }

    const payload: SaveSlotData = {
      slotId,
      savedAt: new Date().toLocaleString(),
      player: playerRef.current || player,
      playerAvatar: currentAvatar,
      gameState,
      party,
      memories,
      chatLog,
      systemState,
      storyId: currentStory.id,
      storyTitle: currentStory.title,
      choices,
      visitedNodes: visitedStoryNodes,
      selectedPrologueId: prologues[selectedPrologue]?.id,
      narrationStyle: narrationStyle || playerRef.current?.narrationStyle || "Grimdark & Atmospheric",
      unlockedCompanions: (party || []).filter((c: any) => c.encountered || c.isPresent).map((c: any) => c.id || c.name),
      timelineScars,
      covenantState: systemState.covenantState,
      frictionState: frictionState || undefined,
      activeClash: activeClash || null,
    };

    try {
      await saveGameSlot(slotId, payload);
      setSavedSlots((prev) => ({ ...prev, [slotId]: payload }));
      triggerBackgroundCloudSync();
    } catch (err) {
      console.error("Save slot error:", err);
    }
  };

  const performAutoSave = async (override?: {
    player?: any;
    playerAvatar?: string | null;
    gameState?: any;
    party?: any[];
    memories?: string[];
    chatLog?: any[];
    systemState?: any;
    choices?: string[];
    visitedNodes?: VisitedStoryNode[];
    selectedPrologueId?: string;
    timelineScars?: TimelineScar[];
    frictionState?: CompanionFrictionState | null;
    activeClash?: ActiveStoryClashState | null;
  }) => {
    if (!autoSaveEnabled) return;

    const finalChatLog = override?.chatLog || chatLogRef.current || chatLog;
    // Never overwrite Auto-Save Slot 0 while still on the Character Creation screen with an empty chatLog
    if (!isConfiguredRef.current && (!finalChatLog || finalChatLog.length === 0)) {
      return;
    }

    setIsAutoSaving(true);
    try {
      const currentAvatar = override?.playerAvatar !== undefined ? override.playerAvatar : playerAvatar;
      const finalPlayer = override?.player || playerRef.current || player;
      const finalGameState = override?.gameState || gameStateRef.current || gameState;
      const finalParty = override?.party || partyRef.current || party;
      const finalMemories = override?.memories || memoriesRef.current || memories;
      const finalSystemState = override?.systemState || systemStateRef.current || systemState;
      const finalChoices = override?.choices || choicesRef.current || choices;
      const finalVisitedNodes = override?.visitedNodes || visitedNodesRef.current || visitedStoryNodes;
      const finalPrologueId = override?.selectedPrologueId || prologues[selectedPrologue]?.id;
      const finalActiveClash =
        override?.activeClash !== undefined ? override.activeClash : (activeClashRef.current ?? activeClash ?? null);

      const payload: SaveSlotData = {
        slotId: 0,
        savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        player: finalPlayer,
        playerAvatar: currentAvatar,
        gameState: finalGameState,
        party: finalParty,
        memories: finalMemories,
        chatLog: finalChatLog,
        systemState: finalSystemState,
        storyId: currentStory.id,
        storyTitle: currentStory.title,
        choices: finalChoices,
        visitedNodes: finalVisitedNodes,
        selectedPrologueId: finalPrologueId,
        narrationStyle: narrationStyle || finalPlayer?.narrationStyle || "Grimdark & Atmospheric",
        unlockedCompanions: (finalParty || []).filter((c: any) => c.encountered || c.isPresent).map((c: any) => c.id || c.name),
        timelineScars: override?.timelineScars !== undefined ? override.timelineScars : timelineScars,
        covenantState: finalSystemState?.covenantState,
        frictionState: override?.frictionState !== undefined ? (override.frictionState || undefined) : (frictionState || undefined),
        activeClash: finalActiveClash,
      };

      await saveGameSlot(0, payload);
      setSavedSlots((prev) => ({ ...prev, [0]: payload }));
      triggerBackgroundCloudSync();

      setShowAutoSaveIndicator(true);
      setTimeout(() => setShowAutoSaveIndicator(false), 2400);
    } catch (err) {
      console.warn("Auto-save failed silently:", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleNavigateToTrials = async () => {
    soundEffects.playRiftTransition();
    setScreenTransition({
      isOpen: true,
      title: "ENTERING LITRPG TRIALS",
      subtitle: "Saving Story Snapshot • Synchronizing Causal Matrix...",
      theme: "cyan",
      icon: "swords",
    });

    // Snapshot the exact current story turn into Slot 0 so returning restores this exact point
    const currentAvatar = playerAvatar;
    const finalPlayer = playerRef.current || player;
    const payload: SaveSlotData = {
      slotId: 0,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      player: finalPlayer,
      playerAvatar: currentAvatar,
      gameState,
      party,
      memories,
      chatLog,
      systemState,
      storyId: currentStory.id,
      storyTitle: currentStory.title,
      choices,
      visitedNodes: visitedStoryNodes,
      selectedPrologueId: prologues[selectedPrologue]?.id,
      narrationStyle: narrationStyle || playerRef.current?.narrationStyle || "Grimdark & Atmospheric",
      unlockedCompanions: (party || []).filter((c: any) => c.encountered || c.isPresent).map((c: any) => c.id || c.name),
      timelineScars,
      covenantState: systemState.covenantState,
      frictionState: frictionState || undefined,
      activeClash: activeClash || null,
    };

    try {
      await saveGameSlot(0, payload);
      setSavedSlots((prev) => ({ ...prev, [0]: payload }));
    } catch (err) {
      console.warn("Could not save pre-trials snapshot:", err);
    }

    const returnUrl = `/play/${encodeURIComponent(currentStory.id)}`;
    try {
      sessionStorage.setItem("astra_trials_story_id", currentStory.id);
      sessionStorage.setItem("astra_trials_return_url", returnUrl);
    } catch {}

    setTimeout(() => {
      router.push(`/trials?storyId=${encodeURIComponent(currentStory.id)}&returnTo=${encodeURIComponent(returnUrl)}`);
    }, 350);
  };

  const handleNavigateToCodex = () => {
    soundEffects.playIntroBell();
    setScreenTransition({
      isOpen: true,
      title: "ACCESSING MULTIVERSE CODEX",
      subtitle: "Querying Indexed Relics, Story CGs & Neural Art Cache...",
      theme: "amber",
      icon: "book",
    });
    setTimeout(() => {
      router.push("/codex");
    }, 320);
  };

  const handleNavigateToCatalogue = () => {
    soundEffects.playClick();
    setScreenTransition({
      isOpen: true,
      title: "RETURNING TO STORY CATALOGUE",
      subtitle: "Archiving Chronicle Anchors & Active Flowchart Reality...",
      theme: "purple",
      icon: "arrow",
    });
    setTimeout(() => {
      router.push("/");
    }, 320);
  };

  const handleLoadSlot = async (slotId: number, explicitData?: SaveSlotData) => {
    const rawData = explicitData || savedSlots[slotId] || (await loadGameSlot(slotId));
    const data = normalizeSaveSlotData(rawData) as SaveSlotData | null;
    if (!data) return;

    soundEffects.playIntroBell();
    isResumingSaveRef.current = true;
    isConfiguredRef.current = true;

    // If the save slot belongs to a different story, load that story context so lore & companions match
    let activeStoryForSave = currentStory;
    if (data.storyId && data.storyId !== currentStory.id) {
      try {
        const matchedStory = await getStoryById(data.storyId);
        if (matchedStory) {
          activeStoryForSave = matchedStory;
          setCurrentStory(matchedStory);
          if (typeof window !== "undefined") {
            window.history.replaceState({}, document.title, `/play/${encodeURIComponent(matchedStory.id)}`);
          }
        }
      } catch (storyErr) {
        console.warn("Could not switch story context for loaded slot:", storyErr);
      }
    }

    // Auto-hydrate items from Multiverse Codex in case the save lacked image URLs
    let loadedPlayer = data.player;
    if (loadedPlayer && Array.isArray(loadedPlayer.inventory) && loadedPlayer.inventory.length > 0) {
      try {
        const { hydrated, updatedCount } = await hydrateInventoryItems(
          data.storyId || activeStoryForSave.id,
          loadedPlayer.inventory
        );
        if (updatedCount > 0) {
          loadedPlayer = { ...loadedPlayer, inventory: hydrated };
        }
      } catch (err) {
        console.warn("Failed to hydrate loaded inventory from codex:", err);
      }
    }

    const loadedParty = data.party && data.party.length > 0
      ? (data.party as any[]).map((c: any) =>
          hydrateCompanionMetadata(
            {
              ...c,
              encountered: typeof c.encountered === "boolean" ? c.encountered : (c.isPresent || c.affection !== 50),
            },
            activeStoryForSave?.companions,
            (data.storyId || activeStoryForSave?.id) === "starfall-labyrinth"
          )
        )
      : party;

    const loadedPresentComps = loadedParty.filter((c: any) => c.isPresent);
    const isLoadedAlone = loadedPresentComps.length === 0;

    let sanitizedSpeaker = data.gameState?.speaker;
    if (sanitizedSpeaker && loadedPlayer?.name && sanitizedSpeaker.trim().toLowerCase() === loadedPlayer.name.trim().toLowerCase()) {
      sanitizedSpeaker = isLoadedAlone ? "Narrator" : loadedPresentComps[0].name;
    }
    const sanitizedGameState = {
      ...data.gameState,
      speaker: sanitizedSpeaker || data.gameState?.speaker || (isLoadedAlone ? "Narrator" : "Companion"),
    };

    let safeLoadedPlayer: PlayerProfile = {
      ...loadedPlayer,
      gender: loadedPlayer?.gender || "Male",
      age: loadedPlayer?.age || "22",
      worldOrigin: loadedPlayer?.worldOrigin || "Born & Raised (Native)",
      worldOriginDetails:
        loadedPlayer?.worldOriginDetails || WORLD_ORIGIN_PRESETS[0].defaultDetails,
      race: loadedPlayer?.race || "Human",
      racialTraits: loadedPlayer?.racialTraits || [],
      personality: loadedPlayer?.personality || "Stoic Pragmatist",
      personalityTraits: loadedPlayer?.personalityTraits || ["Calculated", "Unflinching", "Efficient", "Vigilant"],
      behavioralTendencies: loadedPlayer?.behavioralTendencies || {},
      pinnedMemories: Array.isArray(loadedPlayer?.pinnedMemories) ? loadedPlayer.pinnedMemories : [],
      unspentStatPoints: typeof loadedPlayer?.unspentStatPoints === "number" ? loadedPlayer.unspentStatPoints : 0,
    };

    // Normalize maxExp to the steeper 1.35x RPG curve and self-heal any legacy corrupted S-rank quest surges
    const turnCount = Math.max(1, Math.floor((data.chatLog?.length || 0) / 2));
    const claimedQuestsCount = (data.systemState?.completedQuests || []).filter((q) => q && q.isClaimed).length;
    const maxExpectedLevelForProgress = Math.max(
      6,
      Math.min(20, 2 + Math.ceil((turnCount * 28 + claimedQuestsCount * 180) / 160))
    );
    if ((safeLoadedPlayer.level || 1) > maxExpectedLevelForProgress + 4) {
      const basePlayerAtLv1: PlayerProfile = {
        ...safeLoadedPlayer,
        level: 1,
        unspentStatPoints: 0,
        stats: {
          ...safeLoadedPlayer.stats,
          hp: 100,
          maxHp: 100,
          mp: 60,
          maxMp: 60,
          exp: 0,
          maxExp: BASE_LEVEL_ONE_MAX_EXP,
          str: Math.min(18, Math.max(10, (safeLoadedPlayer.stats?.str || 12) - ((safeLoadedPlayer.level || 1) - 1) * 2)),
          dex: Math.min(18, Math.max(10, (safeLoadedPlayer.stats?.dex || 12) - ((safeLoadedPlayer.level || 1) - 1) * 2)),
          int: Math.min(18, Math.max(10, (safeLoadedPlayer.stats?.int || 12) - ((safeLoadedPlayer.level || 1) - 1) * 2)),
        },
      };
      const expectedTotalExp = claimedQuestsCount * 120 + Math.floor(turnCount * 8);
      const healedProg = applyExpProgression(basePlayerAtLv1, expectedTotalExp, { storyIdOverride: data.storyId });
      safeLoadedPlayer = healedProg.updatedPlayer;
    } else {
      const expectedMaxExp = getRequiredExpForLevel(safeLoadedPlayer.level || 1);
      safeLoadedPlayer = {
        ...safeLoadedPlayer,
        stats: {
          ...safeLoadedPlayer.stats,
          maxExp: expectedMaxExp,
          exp: Math.min(expectedMaxExp - 1, Math.max(0, safeLoadedPlayer.stats?.exp || 0)),
        },
      };
    }

    playerRef.current = safeLoadedPlayer;
    setPlayer(safeLoadedPlayer);
    if (loadedPlayer?.gender) {
      const gMatch = GENDER_PRESETS.find(
        (g) => g.id !== "custom" && g.name.toLowerCase() === loadedPlayer.gender!.trim().toLowerCase()
      );
      setSelectedGenderPreset(gMatch ? gMatch.id : "custom");
    }
    if (loadedPlayer?.worldOrigin) {
      const oMatch = WORLD_ORIGIN_PRESETS.find(
        (o) =>
          o.id !== "custom" &&
          (o.name.toLowerCase() === loadedPlayer.worldOrigin!.trim().toLowerCase() ||
            o.shortLabel.toLowerCase() === loadedPlayer.worldOrigin!.trim().toLowerCase())
      );
      setSelectedWorldOriginPreset(oMatch ? oMatch.id : "custom");
    }
    if (loadedPlayer?.personality) {
      const match = PERSONALITY_PRESETS.find((p) => p.name.toLowerCase() === loadedPlayer.personality!.trim().toLowerCase());
      setSelectedPersonalityPreset(match ? match.id : "custom");
    }
    if (loadedPlayer?.personalityTraits) {
      setPersonalityTraitsInput(loadedPlayer.personalityTraits.join(", "));
    }
    setPlayerAvatar(data.playerAvatar);
    if (data.narrationStyle || loadedPlayer?.narrationStyle) {
      setNarrationStyle((data.narrationStyle || loadedPlayer?.narrationStyle) as string);
    }
    gameStateRef.current = sanitizedGameState;
    setGameState(sanitizedGameState);
    setDisplayedText(sanitizedGameState.dialogue || "");
    partyRef.current = loadedParty;
    setParty(loadedParty);
    memoriesRef.current = data.memories || [];
    setMemories(data.memories || []);
    chatLogRef.current = data.chatLog || [];
    setChatLog(data.chatLog || []);
    if (data.systemState) {
      const normSys = normalizeSystemState(data.systemState, safeLoadedPlayer.level || 1);
      systemStateRef.current = normSys;
      setSystemState(normSys);
    }

    if (data.timelineScars && Array.isArray(data.timelineScars)) {
      setTimelineScars(data.timelineScars);
    } else {
      setTimelineScars([]);
    }
    if (data.frictionState) {
      setFrictionState(data.frictionState);
    } else {
      setFrictionState(null);
    }
    if (data.activeClash) {
      activeClashRef.current = data.activeClash;
      setActiveClash(data.activeClash);
    } else {
      activeClashRef.current = null;
      setActiveClash(null);
    }

    if (data.visitedNodes && Array.isArray(data.visitedNodes) && data.visitedNodes.length > 0) {
      setVisitedStoryNodes(data.visitedNodes);
    } else if (currentStory?.startingNodes) {
      const matchingPrologue = currentStory.startingNodes.find((sn) =>
        (data.selectedPrologueId && sn.id === data.selectedPrologueId) ||
        sn.speaker.toLowerCase() === (data.gameState?.speaker || "").toLowerCase()
      ) || currentStory.startingNodes[0];
      setVisitedStoryNodes([
        {
          id: `node_${matchingPrologue.id}`,
          nodeKey: matchingPrologue.id,
          title: matchingPrologue.title,
          speaker: matchingPrologue.speaker,
          location: matchingPrologue.location,
          visitedAt: data.savedAt || new Date().toISOString(),
          isAnchor: true,
          anchorLabel: `Prologue: ${matchingPrologue.title}`,
          isStartingPoint: true,
        },
      ]);
    }

    // 1. Immediately provide scene-relevant presets so the UI is responsive
    const speaker = sanitizedGameState.speaker;
    const location = sanitizedGameState.location || "Area";
    const playerRole = loadedPlayer?.role || "Wanderer";

    const sceneDefaultChoices = isLoadedAlone
      ? [
          `[Survey] Scrutinize the surroundings in ${location} for hidden runes, traps, or anomalies.`,
          `[Tactics] Stay low and steady your breathing, securing a quiet defensive perimeter.`,
          `[System] Check the LitRPG interface to analyze causal stability and active directives.`,
          `[Action] Draw your weapon and advance cautiously into the quiet expanse.`,
        ]
      : [
          `[Inquire] Press ${speaker} on the deeper implications of what was just disclosed in ${location}.`,
          `[Pragmatism] Evaluate the tactical stakes and propose a calculated compromise with ${speaker}.`,
          `[Action] Step forward as a ${playerRole} and assert your intent directly.`,
          `[Empathy] Read ${speaker}'s expression and look for unspoken motives behind their demeanor.`,
        ];

    const sanitizedSavedChoices = sanitizeAndFilterChoices(data.choices);
    if (sanitizedSavedChoices.length >= 2) {
      setChoices(sanitizedSavedChoices);
    } else {
      setChoices(sanitizeAndFilterChoices(sceneDefaultChoices));
    }

    // 2. Dynamically author fresh, highly contextual choices via LLM in the context of the loaded scene
    fetch("/api/generate-choices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-key": accessKey,
      },
      body: JSON.stringify({
        storyContext: currentStory,
        gameState: sanitizedGameState,
        playerProfile: loadedPlayer,
        partyMembers: loadedParty,
        memories: data.memories || [],
        recentHistory: (data.chatLog || []).slice(-6).map((m: any) => ({
          speaker: m.speakerName,
          text: m.text,
        })),
        systemState: data.systemState,
        userAccessKey: accessKey,
        narrationStyle: data.narrationStyle || loadedPlayer?.narrationStyle || narrationStyle,
      }),
    })
      .then((res) => res.json())
      .then((choiceData) => {
        const filteredDynamicChoices = sanitizeAndFilterChoices(choiceData?.choices);
        if (filteredDynamicChoices.length >= 2) {
          setChoices(filteredDynamicChoices);
          // Persist the freshly generated choices into the saved slot in state
          setSavedSlots((prev) => {
            const currentSlot = prev[slotId];
            if (!currentSlot) return prev;
            return {
              ...prev,
              [slotId]: {
                ...currentSlot,
                choices: filteredDynamicChoices,
              },
            };
          });
        }
      })
      .catch((err) => {
        console.warn("Dynamic choices generation error:", err);
      });

    setShowSaveModal(false);

    setIsTransitioning({
      location: data.gameState.location,
      speaker: data.gameState.speaker,
      quote: `Resuming chronicle with ${data.player.name} (${data.player.role})...`,
    });

    setTimeout(() => {
      setIsConfigured(true);
      setIsTransitioning(null);
    }, 1800);
  };

  // Handle deep-linked ?loadSlot=0..3 or ?rosterCharId=... from the /account page
  const handledAccountDeepLinkRef = useRef<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined" || handledAccountDeepLinkRef.current) return;
    const url = new URL(window.location.href);
    const loadSlotParam = url.searchParams.get("loadSlot");
    const rosterCharIdParam = url.searchParams.get("rosterCharId");

    if (loadSlotParam === null && !rosterCharIdParam) return;
    handledAccountDeepLinkRef.current = true;

    // Clean up query params from browser URL bar
    try {
      url.searchParams.delete("loadSlot");
      url.searchParams.delete("rosterCharId");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch {}

    if (loadSlotParam !== null) {
      const slotNum = Number(loadSlotParam);
      if ([0, 1, 2, 3].includes(slotNum)) {
        loadGameSlot(slotNum).then((slotData) => {
          if (slotData) {
            handleLoadSlot(slotNum, slotData as SaveSlotData);
          }
        });
      }
    } else if (rosterCharIdParam) {
      loadCharacterRoster().then((list) => {
        const match = list.find((c) => c.id === rosterCharIdParam);
        if (match) {
          handleLoadCharacterFromRoster(match);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (dialogueFeedRef.current) {
      dialogueFeedRef.current.scrollTop = dialogueFeedRef.current.scrollHeight;
    }
  }, [chatLog, displayedText, displayedUserText]);

  const scrollToTop = () => {
    soundEffects.playClick();
    if (displayedText.length < gameState.dialogue.length) {
      setDisplayedText(gameState.dialogue);
    }
    if (dialogueFeedRef.current) {
      dialogueFeedRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const scrollToBottom = () => {
    soundEffects.playClick();
    if (dialogueFeedRef.current) {
      dialogueFeedRef.current.scrollTo({
        top: dialogueFeedRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const target = gameState.dialogue;
    if (!target) {
      setDisplayedText("");
      return;
    }

    // If resuming from a save, display immediately without typewriter recursion
    if (isResumingSaveRef.current) {
      isResumingSaveRef.current = false;
      setDisplayedText(target);
      return;
    }

    // Stream smoothly in capped ticks to prevent React update depth recursion
    const step = Math.max(4, Math.ceil(target.length / 30));
    let index = 0;
    setDisplayedText("");

    let blipCounter = 0;
    const interval = setInterval(() => {
      index += step;
      if (index >= target.length) {
        setDisplayedText(target);
        clearInterval(interval);
      } else {
        setDisplayedText(target.slice(0, index));
        blipCounter++;
        if (blipCounter % 3 === 0) {
          soundEffects.playDialogueBlip();
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [gameState.dialogue]);

  const handleStartEdit = useCallback((msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingText("");
  }, []);

  const handleSaveEdit = async (id: string, nextText?: string, shouldRegenerate?: boolean) => {
    const resolvedText = nextText !== undefined ? nextText : editingText;
    setEditingMessageId(null);
    setEditingText("");

    if (shouldRegenerate) {
      // Find the edited user message index and prune everything from that index onward, then replay the edited action
      const targetIdx = chatLog.findIndex((m) => m.id === id);
      if (targetIdx !== -1 && chatLog[targetIdx].sender === "user") {
        const previousHistory = chatLog.slice(0, targetIdx);
        setChatLog(previousHistory);
        await sendAction(resolvedText, true);
        return;
      }
    }

    setChatLog((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (lastMsg && lastMsg.id === id && lastMsg.sender === "character") {
        setGameState((gs) => ({ ...gs, dialogue: resolvedText }));
        setDisplayedText(resolvedText);
      }
      return prev.map((msg) => (msg.id === id ? { ...msg, text: resolvedText } : msg));
    });
  };

  const handleDeleteMessage = useCallback(
    (id: string) => {
      if (isLoading) return;
      soundEffects.playClick();
      if (editingMessageId === id) {
        setEditingMessageId(null);
        setEditingText("");
      }

      setChatLog((prev) => {
        const nextLog = prev.filter((msg) => msg.id !== id);
        chatLogRef.current = nextLog;

        // Find the new latest character message to keep the visual novel stage & typewriter in sync
        let nextLatestChar: ChatMessage | undefined;
        for (let i = nextLog.length - 1; i >= 0; i--) {
          if (nextLog[i].sender === "character") {
            nextLatestChar = nextLog[i];
            break;
          }
        }

        if (nextLatestChar) {
          setGameState((gs) => {
            const nextGs = {
              ...gs,
              speaker: nextLatestChar!.speakerName || gs.speaker,
              dialogue: nextLatestChar!.text,
            };
            gameStateRef.current = nextGs;
            performAutoSave({ chatLog: nextLog, gameState: nextGs });
            return nextGs;
          });
          setDisplayedText(nextLatestChar.text);
        } else {
          performAutoSave({ chatLog: nextLog });
        }

        return nextLog;
      });
    },
    [isLoading, editingMessageId]
  );

  const handleSkipTypewriter = useCallback((msg: ChatMessage, isLatestCharacterTurn: boolean) => {
    if (isLatestCharacterTurn) {
      setDisplayedText(gameState.dialogue);
    }
    if (msg.id === typingUserMsgId) {
      clearUserTypewriter();
      setDisplayedUserText(msg.text);
      setTypingUserMsgId(null);
    }
  }, [gameState.dialogue, typingUserMsgId, clearUserTypewriter]);

  const handleRegenerateTurn = async () => {
    if (isLoading || chatLog.length === 0) return;

    // Locate the most recent user message to replay
    let lastUserIdx = -1;
    for (let i = chatLog.length - 1; i >= 0; i--) {
      if (chatLog[i].sender === "user") {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx !== -1) {
      const lastUserMsg = chatLog[lastUserIdx];
      const previousHistory = chatLog.slice(0, lastUserIdx);
      setChatLog(previousHistory);
      await sendAction(lastUserMsg.text, true);
      return;
    }

    // If on the opening Prologue (no user message yet), regenerate the opening scene turn
    await handleStartGame(player.gear, player.inventory);
  };

  const handleSummonExecuted = (payload: {
    count: 1 | 10;
    results: SummonPullResult[];
    newState: LabyrinthState;
  }) => {
    const { results, newState } = payload;
    const nextPlayer: PlayerProfile = {
      ...(playerRef.current || player),
      labyrinthState: newState,
    };
    playerRef.current = nextPlayer;
    setPlayer(nextPlayer);

    const currentParty = partyRef.current || party;
    const nextParty = currentParty.map((comp) => {
      const rosterMatch = (newState.roster || []).find((r) =>
        matchesHeroineName(r.heroineName, comp.name, r.heroineId)
      );
      if (!rosterMatch) return comp;
      const isDead = rosterMatch.status === "FALLEN";
      const isDeployed = rosterMatch.status === "DEPLOYED" || rosterMatch.status === "WOUNDED";
      return {
        ...comp,
        encountered: isDead ? comp.encountered : true,
        isPresent: isDead ? false : isDeployed,
        starRank: rosterMatch.starRank,
        baseStarRank: rosterMatch.baseStarRank,
        level: rosterMatch.level || comp.level || 1,
        exp: rosterMatch.exp ?? comp.exp ?? 0,
        maxExp: rosterMatch.maxExp || getRequiredExpForLevel(rosterMatch.level || 1),
        heroStatus: rosterMatch.status,
        formationSlot: rosterMatch.formationSlot,
        combatStats: rosterMatch.combatStats,
        currentHp: rosterMatch.currentHp,
        currentMp: rosterMatch.currentMp,
        awakenings: rosterMatch.awakenings,
        fallenOnFloor: rosterMatch.fallenOnFloor,
        fallenCause: rosterMatch.fallenCause,
      };
    });
    partyRef.current = nextParty;
    setParty(nextParty);

    const deployedNames = nextParty
      .filter((c) => c.isPresent && c.heroStatus !== "FALLEN")
      .map((c) => c.name);

    setGameState((prev) => {
      const nextGs = {
        ...prev,
        presentCompanions: deployedNames.length > 0 ? deployedNames : prev.presentCompanions,
      };
      gameStateRef.current = nextGs;
      return nextGs;
    });

    const newAllies = results.filter((r) => r.isNew);
    const awakenedAllies = results.filter((r) => r.awakenedToRank);
    if (newAllies.length > 0) {
      pushNotification({
        id: `summon_new_${Date.now()}`,
        type: "quest_completed",
        title: `STAR GATE SUMMON: ${newAllies.map((a) => `${a.heroineName} (${a.starRank}★)`).join(", ")}`,
        subtitle: "New summoned ally materialized in Star Gate Plaza and joined your Roster!",
        difficulty: newAllies.some((a) => a.starRank === 5) ? "S" : "A",
      });
    } else if (awakenedAllies.length > 0) {
      pushNotification({
        id: `summon_awaken_${Date.now()}`,
        type: "system_alert",
        title: "DUPLICATE RESONANCE AWAKENING!",
        subtitle: awakenedAllies
          .map((a) => `${a.heroineName} ascended to ${a.awakenedToRank}★ (Cap Lv.${getStarLevelCap(a.awakenedToRank!)})`)
          .join(" • "),
        difficulty: "A",
      });
    }

    performAutoSave({
      player: nextPlayer,
      party: nextParty,
    });
  };

  const handleNarrateSummonArrival = async (results: SummonPullResult[]) => {
    setShowSummonModal(false);
    const newlySummonedNames = Array.from(
      new Set(results.filter((r) => r.isNew).map((r) => r.heroineName))
    );
    const newNamesWithStars = Array.from(
      new Set(results.filter((r) => r.isNew).map((r) => `${r.heroineName} (${r.starRank}★)`))
    );
    const summaryText =
      newNamesWithStars.length > 0
        ? `Step forward to the Star Gate Summoning Altar in Star Gate Plaza and greet the newly materialized summon${newNamesWithStars.length > 1 ? "s" : ""}: ${newNamesWithStars.join(", ")}.`
        : `Inspect the shimmering Star Gate Altar resonance after absorbing ${results.length} Star-Echo pull${results.length > 1 ? "s" : ""}.`;
    await sendAction(summaryText, true, null, null, false, {
      playerSnapshot: playerRef.current || player,
      summonContext: {
        results,
        count: results.length,
        newlySummonedNames,
        pullSummary: summaryText,
      },
    });
  };

  const handleUpdateLabyrinthStateFromBarracks = useCallback(
    (nextState: LabyrinthState) => {
      const nextPlayer: PlayerProfile = {
        ...(playerRef.current || player),
        labyrinthState: nextState,
      };
      playerRef.current = nextPlayer;
      setPlayer(nextPlayer);

      const currentParty = partyRef.current || party;
      const nextParty = currentParty.map((comp) => {
        const rosterMatch = (nextState.roster || []).find((r) =>
          matchesHeroineName(r.heroineName, comp.name, r.heroineId)
        );
        if (!rosterMatch) return comp;
        const isDead = rosterMatch.status === "FALLEN";
        const isActiveInSquad =
          !isDead &&
          (rosterMatch.status === "DEPLOYED" || rosterMatch.status === "WOUNDED");
        return {
          ...comp,
          isPresent: isActiveInSquad,
          encountered: isDead ? comp.encountered : true,
          starRank: rosterMatch.starRank,
          baseStarRank: rosterMatch.baseStarRank,
          level: rosterMatch.level || comp.level || 1,
          exp: rosterMatch.exp ?? comp.exp ?? 0,
          maxExp: rosterMatch.maxExp || getRequiredExpForLevel(rosterMatch.level || 1),
          heroStatus: rosterMatch.status,
          formationSlot: rosterMatch.formationSlot,
          combatStats: rosterMatch.combatStats,
          currentHp: rosterMatch.currentHp,
          currentMp: rosterMatch.currentMp,
          awakenings: rosterMatch.awakenings,
        };
      });
      partyRef.current = nextParty;
      setParty(nextParty);

      const deployedNames = nextParty
        .filter((c) => c.isPresent && c.heroStatus !== "FALLEN")
        .map((c) => c.name);
      setGameState((prev) => {
        const nextGs = {
          ...prev,
          presentCompanions: deployedNames,
        };
        gameStateRef.current = nextGs;
        return nextGs;
      });

      performAutoSave({
        player: nextPlayer,
        party: nextParty,
      });
    },
    [party, player]
  );

  const handleToggleStarfallDeployment = (compName: string) => {
    const curLs = (playerRef.current || player).labyrinthState;
    if (!curLs) return;
    const inLobbyOrSafe =
      isStarfallLobbyLocation(gameState.location) ||
      getFloorType(curLs.currentFloor || 0) === "SAFE_ZONE";
    if (!inLobbyOrSafe) {
      soundEffects.playSystemAlert();
      pushNotification({
        id: `deploy_lock_${Date.now()}`,
        type: "system_alert",
        title: "SQUAD DEPLOYMENT LOCKED IN COMBAT",
        subtitle: "Return to Star Gate Plaza (Main Lobby) or a Safe Zone (Floor 5, 15, 25...) to swap Deployed & Benched heroes.",
        difficulty: "C",
      });
      return;
    }

    const idx = (curLs.roster || []).findIndex((r) =>
      matchesHeroineName(r.heroineName, compName, r.heroineId)
    );
    if (idx === -1) return;
    const entry = curLs.roster[idx];
    if (entry.status === "FALLEN") return;

    const deployedCount = (curLs.roster || []).filter((r) => r.status === "DEPLOYED").length;
    const nextStatus: HeroStatus = entry.status === "DEPLOYED" ? "BENCHED" : "DEPLOYED";
    if (nextStatus === "DEPLOYED" && deployedCount >= MAX_DEPLOYED_PARTY) {
      soundEffects.playSystemAlert();
      pushNotification({
        id: `deploy_cap_${Date.now()}`,
        type: "system_alert",
        title: `MAX DEPLOYED SQUAD REACHED (${MAX_DEPLOYED_PARTY})`,
        subtitle: "Bench an active heroine first before deploying another into the 5-hero vanguard.",
        difficulty: "C",
      });
      return;
    }

    soundEffects.playEquipChime();
    const updatedRoster = curLs.roster.map((r, i) =>
      i === idx ? { ...r, status: nextStatus } : r
    );
    const nextLs: LabyrinthState = { ...curLs, roster: updatedRoster };
    const nextPlayer: PlayerProfile = {
      ...(playerRef.current || player),
      labyrinthState: nextLs,
    };
    playerRef.current = nextPlayer;
    setPlayer(nextPlayer);

    const nextParty = (partyRef.current || party).map((c) => {
      if (!matchesHeroineName(c.name, compName, c.id)) return c;
      return {
        ...c,
        isPresent: nextStatus === "DEPLOYED",
        heroStatus: nextStatus,
      };
    });
    partyRef.current = nextParty;
    setParty(nextParty);

    const deployedNames = nextParty
      .filter((c) => c.isPresent && c.heroStatus !== "FALLEN")
      .map((c) => c.name);
    setGameState((prev) => ({
      ...prev,
      presentCompanions: deployedNames,
    }));
    performAutoSave({ player: nextPlayer, party: nextParty });
  };

  const sendAction = async (
    rawAction: string, 
    isCustom: boolean = false, 
    giftContext: any = null,
    covenantContext: { intent: string; targetPlausibility?: number } | null = null,
    isOOC: boolean = false,
    turnOverrides?: {
      playerSnapshot?: PlayerProfile;
      clashSnapshot?: ActiveStoryClashState | null;
      isClashResolutionTurn?: boolean;
      summonContext?: {
        results: SummonPullResult[];
        count: number;
        newlySummonedNames?: string[];
        pullSummary?: string;
      } | null;
    }
  ) => {
    if (!rawAction.trim() || isLoading) return;

    if (!accessKey) {
      setShowAuthModal(true);
      setAuthError("Please enter a valid access key before taking action.");
      return;
    }

    const formattedPayload = isOOC ? `[OOC: ${rawAction.trim()}]` : rawAction.trim();
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isClashTurn = Boolean(turnOverrides?.isClashResolutionTurn);
    const currentClashSnapshot =
      turnOverrides?.clashSnapshot !== undefined
        ? turnOverrides.clashSnapshot
        : (activeClashRef.current ?? activeClash);

    // Track emergent behavioral tendencies based on player action choices
    const activePlayerSnapshot = turnOverrides?.playerSnapshot || playerRef.current || player;
    const vectorKey = analyzeChoiceVector(formattedPayload);
    const updatedTendencies = {
      ...(activePlayerSnapshot.behavioralTendencies || {}),
      [vectorKey]: ((activePlayerSnapshot.behavioralTendencies || {})[vectorKey] || 0) + 1,
    };
    const playerWithTendencies: PlayerProfile = {
      ...activePlayerSnapshot,
      personality: player.personality || activePlayerSnapshot.personality || "Stoic Pragmatist",
      personalityTraits:
        player.personalityTraits && player.personalityTraits.length > 0
          ? player.personalityTraits
          : activePlayerSnapshot.personalityTraits || ["Calculated", "Unflinching", "Efficient", "Vigilant"],
      behavioralTendencies: updatedTendencies,
    };
    setPlayer(playerWithTendencies);
    playerRef.current = playerWithTendencies;

    setIsLoading(true);
    setChoices([]);

    const playerMsgId = `player_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialUserText = isCustom
      ? formattedPayload
      : formattedPayload.replace(/^\[[^\]]+\](?::)?\s*/, "").trim() || formattedPayload;

    const playerMsg: ChatMessage = {
      id: playerMsgId,
      sender: "user",
      speakerName: playerWithTendencies.name,
      text: initialUserText,
      timestamp: timeString,
      avatarSrc: playerAvatar || undefined,
      isPending: !isCustom,
    };

    const chatBeforeTurn = chatLogRef.current || chatLog;
    const optimisticChat = [...chatBeforeTurn, playerMsg];
    chatLogRef.current = optimisticChat;
    setChatLog(optimisticChat);

    if (isCustom) {
      clearUserTypewriter();
      setTypingUserMsgId(playerMsgId);
      setDisplayedUserText("");

      const userTarget = formattedPayload;
      const userStep = Math.max(1, Math.ceil(userTarget.length / 28));
      let userIndex = 0;
      let blipCounter = 0;

      userTypewriterIntervalRef.current = setInterval(() => {
        userIndex += userStep;
        if (userIndex >= userTarget.length) {
          setDisplayedUserText(userTarget);
          setTypingUserMsgId(null);
          clearUserTypewriter();
        } else {
          setDisplayedUserText(userTarget.slice(0, userIndex));
          blipCounter++;
          if (blipCounter % 3 === 0) {
            soundEffects.playDialogueBlip();
          }
        }
      }, 18);
    } else {
      clearUserTypewriter();
      setTypingUserMsgId(null);
      setDisplayedUserText("");
    }

    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          action: formattedPayload,
          isCustom,
          gameState: gameStateRef.current || gameState,
          partyMembers: partyRef.current || party,
          playerProfile: playerWithTendencies,
          playerAvatarBase64: playerAvatar,
          narrationStyle: narrationStyle || playerWithTendencies?.narrationStyle || currentStory?.narrationStyle || "Grimdark & Atmospheric",
          plotMemories: memoriesRef.current || memories,
          userAccessKey: accessKey,
          systemState: systemStateRef.current || systemState,
          storyContext: currentStory,
          timelineEchoes,
          activeStance: playerWithTendencies.activeStance || "neutral",
          giftItemContext: giftContext,
          targetEnvironment: llmConfig.targetEnvironment,
          modelId: llmConfig.modelId,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.max_tokens,
          repetition_penalty: llmConfig.repetition_penalty,
          narrativeDepth: llmConfig.narrativeDepth,
          recentHistory: chatBeforeTurn.slice(-14).map((m) => ({
            speaker: m.speakerName,
            text: m.text,
          })),
          // Systems Evolution Fields (Pillars A, B, C)
          covenantAction: covenantContext || (formattedPayload.toLowerCase().includes("covenant: reality severance") ? { intent: formattedPayload } : null),
          activeClash: currentClashSnapshot || null,
          frictionState: frictionState || null,
          timelineScars: timelineScars || [],
          currentTurnNumber: chatBeforeTurn.length + 1,
          summonContext: turnOverrides?.summonContext || null,
          directorNotes: directorNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          setAuthError(err.error || "Turn quota exceeded or invalid access key.");
          setShowAuthModal(true);
        }
        throw new Error(err.error || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data._userStats) {
        setUserAuth(data._userStats);
      }
      if (
        (data.visual_description && typeof data.visual_description === "string") ||
        data.portrait_attire ||
        data.visual_dna
      ) {
        setPlayer((prev) => {
          const resolvedDna = data.visual_dna || prev.visualDna;
          const resolvedDesc =
            data.visual_description && typeof data.visual_description === "string"
              ? data.visual_description
              : prev.visualDescription;
          const resolvedAttire =
            (typeof data.portrait_attire === "string" && data.portrait_attire.trim()) ||
            resolvePortraitAttireLabel(resolvedDna, resolvedDesc, "");
          const currentArmorLower = (prev.gear?.armor || "").trim().toLowerCase();
          const shouldUpdateArmor =
            Boolean(resolvedAttire) &&
            (currentArmorLower === "none" ||
              currentArmorLower === "unarmored" ||
              currentArmorLower === "portrait attire (unarmored)");
          const next = {
            ...prev,
            visualDescription: resolvedDesc,
            visualDna: resolvedDna,
            gear: shouldUpdateArmor ? { ...prev.gear, armor: resolvedAttire } : prev.gear,
          };
          playerRef.current = next;
          return next;
        });
      }

      // 1. Determine presence (strictly excluding permanently FALLEN Starfall heroines)
      const starfallUpdates = data.starfall_updates || data.state_updates?.starfall_updates;
      const incomingFallenNames = new Set<string>(
        currentStory?.id === "starfall-labyrinth"
          ? [
              ...((playerRef.current?.labyrinthState?.memorial || []).map((m) => (m?.name || "").toLowerCase())),
              ...((starfallUpdates?.labyrinthState?.memorial || []).map((m: any) => (m?.name || "").toLowerCase())),
              ...((starfallUpdates?.casualtiesResolved || []).map((n: string) => (n || "").toLowerCase())),
            ].filter(Boolean)
          : []
      );
      const isNameFallen = (candidate?: string | null) => {
        if (!candidate || incomingFallenNames.size === 0) return false;
        return Array.from(incomingFallenNames).some((fn) => matchesHeroineName(candidate, fn));
      };

      const currentPresentComps = party.filter(
        (c) => c.isPresent && c.heroStatus !== "FALLEN" && !isNameFallen(c.name)
      );
      const isCurrentlyAlone = currentPresentComps.length === 0;

      // 2. Resolve present companions list from state updates
      const rawPresentList = data.state_updates?.present_companions;
      const unfilteredPresentList: string[] = Array.isArray(rawPresentList)
        ? rawPresentList
        : (isCurrentlyAlone ? [] : currentPresentComps.map((c) => c.name));
      const presentList: string[] = unfilteredPresentList.filter(
        (pName) => typeof pName === "string" && !isNameFallen(pName)
      );

      const isSceneAlone = presentList.length === 0;

      // 3. Sanitize speakerName: PROHIBIT player.name or FALLEN heroines as visual novel speaker
      let rawSpeaker = (data.speaker || gameState.speaker || (isSceneAlone ? "Narrator" : "Companion")).trim();
      if (rawSpeaker.toLowerCase() === player.name.toLowerCase() || isNameFallen(rawSpeaker)) {
        rawSpeaker = isSceneAlone ? "Narrator" : (presentList[0] || currentPresentComps[0]?.name || "Narrator");
      }
      const speakerName = rawSpeaker;
      const narrative =
        (typeof data.narrative_text === "string" && data.narrative_text.trim()) ||
        (typeof data.narrative === "string" && data.narrative.trim()) ||
        `Across ${data.state_updates?.current_location || gameState.location}, the momentum of ${playerWithTendencies.name}'s maneuver reshapes the immediate encounter.`;
      
      let playerText = "";
      if (isCustom) {
        playerText = formattedPayload;
      } else if (data.player_execution && data.player_execution.trim()) {
        playerText = data.player_execution.trim().replace(/^\[[^\]]+\](?::)?\s*/, "");
      } else {
        playerText = initialUserText;
      }
      
      const nextExpression = data.state_updates?.expression_key || "neutral";
      const nextLocation = data.state_updates?.current_location || gameState.location;
      let nextBg = getLocationBg(nextLocation);

      // 4. Affected companion and favor delta: absent heroines cannot gain/lose favor
      let rawAffected = data.state_updates?.affected_companion;
      if (rawAffected && typeof rawAffected === "string" && rawAffected.trim().toLowerCase() === (player.name || "").toLowerCase()) {
        rawAffected = null;
      }
      const affectedComp = (typeof rawAffected === "string" ? rawAffected : null) || (isSceneAlone ? null : speakerName);
      const isCompPhysicallyPresent = affectedComp
        ? presentList.some((p) => typeof p === "string" && p.toLowerCase().includes(affectedComp.toLowerCase()))
        : false;

      const rawDelta = typeof data.state_updates?.affection_delta === "number" ? data.state_updates.affection_delta : 0;
      let effectiveDelta = 0;
      let hitCapNotice = false;
      let currentCap = 25;
      let activeEarnedEval: ReturnType<typeof calculateEarnedAffectionDelta> | null = null;

      if (isCompPhysicallyPresent && affectedComp) {
        currentCap = getCompanionCap(affectedComp);
        const compTarget = party.find((c) => c.name.toLowerCase().includes(affectedComp.toLowerCase()));
        if (compTarget) {
          const currentAff = compTarget.affection;
          if (rawDelta > 0 && currentAff >= currentCap && currentCap < 100) {
            effectiveDelta = 0;
            hitCapNotice = true;
          } else {
            activeEarnedEval = calculateEarnedAffectionDelta({
              companion: compTarget as StoryCompanion,
              rawDelta,
              actionText: formattedPayload,
              activeCap: currentCap,
              isGiftInteraction: Boolean(giftContext),
            });
            effectiveDelta = activeEarnedEval.appliedDelta;
            if (rawDelta > 0 && activeEarnedEval.newAffection >= currentCap && currentCap < 100) {
              hitCapNotice = true;
            }
          }
        }
      }

      const delta = effectiveDelta;

      if (hitCapNotice && affectedComp) {
        soundEffects.playSystemAlert();
        setLastAffectionDelta({ companion: affectedComp, delta: 0, isCapped: true, cap: currentCap });
        setTimeout(() => setLastAffectionDelta(null), 4000);
        pushNotification({
          id: `cap_notice_${Date.now()}`,
          type: "quest_assigned",
          title: "HEART RESONANCE LOCKED",
          subtitle: `${affectedComp} favor is locked at ${currentCap}%. Complete her Companion Quest to break through this emotional barrier!`,
          difficulty: "B",
        });
      } else if (typeof delta === "number" && delta !== 0 && affectedComp) {
        soundEffects.playFavorSound(delta > 0);
        setLastAffectionDelta({ companion: affectedComp, delta });
        setTimeout(() => setLastAffectionDelta(null), 3500);
      } else if (activeEarnedEval?.isArmorCracked && activeEarnedEval.resistanceNote && affectedComp) {
        soundEffects.playFavorSound(true);
        pushNotification({
          id: `armor_crack_${Date.now()}`,
          type: "system_alert",
          title: `CRACK IN ${affectedComp.toUpperCase()}'S ARMOR`,
          subtitle: activeEarnedEval.resistanceNote,
          difficulty: "C",
        });
      }

      const newlyMet: string[] = Array.isArray(data.state_updates?.newly_encountered_heroines)
        ? data.state_updates.newly_encountered_heroines
        : [];

      const portUpdates = data.port_solaris_updates || data.state_updates?.port_solaris_updates;
      if (portUpdates && portUpdates.isShortCircuit) {
        soundEffects.playSystemAlert();
        pushNotification({
          id: `short_circuit_${Date.now()}`,
          type: "system_alert",
          title: "100 BPM SHORT-CIRCUIT TRIGGERED!",
          subtitle: `${portUpdates.speakerName || "Heroine"} reached maximum emotional overload! Romantic composure broke.`,
          difficulty: "S",
        });
      }

      const currentTurnNumber = Math.max(1, Math.floor(chatBeforeTurn.length / 2) + 1);
      const nextPartyState = party.map((comp) => {
        const compNameLower = (comp.name || "").toLowerCase();
        const compFellNow = comp.heroStatus === "FALLEN" || isNameFallen(comp.name);
        const isCurrentSpeaker = !compFellNow && compNameLower.includes((speakerName || "").toLowerCase());
        const isAffected = !compFellNow && affectedComp ? compNameLower.includes(affectedComp.toLowerCase()) : false;
        const isPresent = !compFellNow && presentList.some((p) => typeof p === "string" && compNameLower.includes(p.toLowerCase()));
        const isNewlyMet = !compFellNow && newlyMet.some((n) => typeof n === "string" && compNameLower.includes(n.toLowerCase()));

        const nowEncountered = comp.encountered || isCurrentSpeaker || isPresent || isAffected || isNewlyMet;
        const targetCap = getCompanionCap(comp.name);
        const profile = getHeroineResistanceProfile(comp as StoryCompanion);

        let updatedAffection = comp.affection;
        let updatedTrustProgress = (comp as any).trustProgress ?? 0;
        let updatedArmorCrackCount = (comp as any).armorCrackCount ?? 0;

        if (isAffected && isCompPhysicallyPresent) {
          if (activeEarnedEval) {
            updatedAffection = activeEarnedEval.newAffection;
            updatedTrustProgress = activeEarnedEval.updatedTrustProgress;
            updatedArmorCrackCount = activeEarnedEval.updatedArmorCrackCount;
          } else if (typeof delta === "number") {
            if (delta > 0) {
              updatedAffection = Math.min(targetCap, comp.affection + delta);
            } else if (delta < 0) {
              updatedAffection = Math.max(0, comp.affection + delta);
            }
          }
        }

        const bpmCeiling = getAffectionBpmCeiling(updatedAffection, profile.guardTier);
        let updatedBpm = (comp as any).heartRateBpm;
        const hasServerBpmUpdate =
          portUpdates && comp.name.toLowerCase().includes((portUpdates.speakerName || "").toLowerCase());
        if (hasServerBpmUpdate) {
          updatedBpm = Math.min(bpmCeiling, portUpdates.bpm);
        } else if ((isAffected || isCurrentSpeaker) && activeEarnedEval?.bpmSpikeBonus && typeof updatedBpm === "number") {
          updatedBpm = Math.min(bpmCeiling, updatedBpm + activeEarnedEval.bpmSpikeBonus);
        } else if (typeof updatedBpm === "number") {
          updatedBpm = Math.min(bpmCeiling, updatedBpm);
        }

        let updatedSentiment = (comp as any).currentSentiment;
        let updatedCatalogMemoryIds = Array.isArray((comp as any).unlockedCoreMemories)
          ? [...(comp as any).unlockedCoreMemories]
          : [];
        let updatedDynamicMemories = Array.isArray((comp as any).dynamicCoreMemories)
          ? [...(comp as any).dynamicCoreMemories]
          : [];

        if ((isCurrentSpeaker || isAffected) && isPresent) {
          updatedSentiment = synthesizeDynamicCompanionSentiment({
            companion: {
              ...(comp as StoryCompanion),
              affection: updatedAffection,
            },
            llmSentiment: data.state_updates?.companion_sentiment || null,
            actionText: formattedPayload,
            appliedDelta: isAffected ? delta : 0,
            isArmorCracked: Boolean(activeEarnedEval?.isArmorCracked),
            activeCap: targetCap,
          });

          const memEval = evaluateDynamicCoreMemoryUnlock({
            companion: {
              ...(comp as StoryCompanion),
              unlockedCoreMemories: updatedCatalogMemoryIds,
              dynamicCoreMemories: updatedDynamicMemories,
            },
            llmCoreMemory: data.state_updates?.core_memory_unlocked || null,
            legacyMemoryText: data.new_memory_unlocked || null,
            actionText: formattedPayload,
            narrativeText: narrative,
            oldAffection: comp.affection,
            newAffection: updatedAffection,
            turnNumber: currentTurnNumber,
            location: nextLocation,
            isArmorCracked: Boolean(activeEarnedEval?.isArmorCracked),
          });

          updatedCatalogMemoryIds = memEval.updatedCatalogIds;
          updatedDynamicMemories = memEval.updatedDynamicMemories;

          if (memEval.newlyUnlockedTitles.length > 0) {
            pushNotification({
              id: `core_mem_${comp.id}_${Date.now()}`,
              type: "quest_completed",
              title: `CORE MEMORY FORGED (${comp.name.toUpperCase()})`,
              subtitle: `"${memEval.newlyUnlockedTitles[0]}" added to ${comp.name}'s Core Memories!`,
              difficulty: "A",
            });
          }
        }

        return {
          ...comp,
          isPresent,
          encountered: nowEncountered,
          expressionKey: isCurrentSpeaker ? nextExpression : comp.expressionKey,
          affection: updatedAffection,
          heartRateBpm: updatedBpm,
          guardTier: profile.guardTier,
          trustProgress: updatedTrustProgress,
          armorCrackCount: updatedArmorCrackCount,
          currentSentiment: updatedSentiment,
          unlockedCoreMemories: updatedCatalogMemoryIds,
          dynamicCoreMemories: updatedDynamicMemories,
        };
      });

      let resolvedPartyState = nextPartyState;

      if (currentStory?.id === "starfall-labyrinth") {
        const baseLs: LabyrinthState =
          starfallUpdates?.labyrinthState ||
          starfallUpdates?.labyrinth_state ||
          playerRef.current.labyrinthState ||
          createInitialLabyrinthState();

        // Sync Resonance Awakenings (+1★ at 25/50/75/90% affection) and FALLEN status
        const awakenedNotices: { name: string; newRank: StarRank }[] = [];
        const syncedLs = syncRosterWithParty(baseLs, nextPartyState as StoryCompanion[]);
        const updatedRoster = (syncedLs.roster || []).map((r) => {
          const matchingComp = nextPartyState.find((c) =>
            matchesHeroineName(c.name, r.heroineName, c.id)
          );
          if (!matchingComp || r.status === "FALLEN") return r;
          const awakened = applyAwakening(r, matchingComp.affection);
          if (awakened.starRank > r.starRank) {
            awakenedNotices.push({ name: r.heroineName, newRank: awakened.starRank });
          }
          return awakened;
        });

        // Promote protagonist Star Rank on major Labyrinth floor milestones
        let nextProtagStar: StarRank = syncedLs.protagonistStarRank || 1;
        const highestCleared = syncedLs.highestFloorCleared || 0;
        const milestoneRank: StarRank =
          highestCleared >= 75
            ? 5
            : highestCleared >= 50
            ? 4
            : highestCleared >= 25
            ? 3
            : highestCleared >= 10
            ? 2
            : 1;
        if (milestoneRank > nextProtagStar) {
          nextProtagStar = milestoneRank;
          pushNotification({
            id: `protag_star_up_${Date.now()}`,
            type: "quest_completed",
            title: `PROTAGONIST STAR ASCENSION (${nextProtagStar}★)!`,
            subtitle: `Gate Breakthrough shattered your Covenant ceiling! New Level Cap: Lv.${getStarLevelCap(nextProtagStar)}.`,
            difficulty: "S",
          });
        }

        const finalLs: LabyrinthState = {
          ...syncedLs,
          protagonistStarRank: nextProtagStar,
          roster: updatedRoster,
        };

        resolvedPartyState = nextPartyState.map((c) => {
          const rMatch = updatedRoster.find((r) =>
            matchesHeroineName(r.heroineName, c.name, r.heroineId)
          );
          if (!rMatch) return c;
          const isDead = rMatch.status === "FALLEN";
          const isDeployedInSquad =
            !isDead && (rMatch.status === "DEPLOYED" || rMatch.status === "WOUNDED");
          return {
            ...c,
            isPresent: isDead ? false : isDeployedInSquad || c.isPresent,
            starRank: rMatch.starRank,
            baseStarRank: rMatch.baseStarRank,
            level: rMatch.level || c.level || 1,
            exp: rMatch.exp ?? c.exp ?? 0,
            maxExp: rMatch.maxExp || getRequiredExpForLevel(rMatch.level || 1),
            heroStatus: rMatch.status,
            formationSlot: rMatch.formationSlot,
            combatStats: rMatch.combatStats,
            currentHp: rMatch.currentHp,
            currentMp: rMatch.currentMp,
            awakenings: rMatch.awakenings,
            fallenOnFloor: rMatch.fallenOnFloor,
            fallenCause: rMatch.fallenCause,
          };
        });

        nextBg = getLocationBg(nextLocation, finalLs.currentFloor);
        const syncStarfallPlayer: PlayerProfile = {
          ...playerRef.current,
          labyrinthState: finalLs,
          starRank: finalLs.protagonistStarRank,
        };
        playerRef.current = syncStarfallPlayer;
        setPlayer((prev) => ({
          ...prev,
          labyrinthState: finalLs,
          starRank: finalLs.protagonistStarRank,
        }));

        awakenedNotices.forEach((aw) => {
          soundEffects.playQuestComplete();
          pushNotification({
            id: `starfall_awaken_${aw.name}_${Date.now()}`,
            type: "quest_completed",
            title: `RESONANCE AWAKENING: ${aw.name.toUpperCase()} (${aw.newRank}★)!`,
            subtitle: `Bond resonance broke her rarity seal! Level cap raised to Lv.${getStarLevelCap(aw.newRank)}.`,
            difficulty: "A",
          });
        });

        if (Array.isArray(starfallUpdates?.casualtiesResolved) && starfallUpdates.casualtiesResolved.length > 0) {
          soundEffects.playSystemAlert();
          starfallUpdates.casualtiesResolved.forEach((fallenName: string) => {
            const memRec = (finalLs.memorial || []).find((m) =>
              matchesHeroineName(m.name, fallenName)
            );
            pushNotification({
              id: `starfall_fallen_${fallenName}_${Date.now()}`,
              type: "penalty_quest",
              title: `✝ MEMORIAL WALL: ${fallenName.toUpperCase()} HAS FALLEN`,
              subtitle: memRec
                ? `Floor ${memRec.floor}: ${memRec.cause}. Covenant VI is absolute — she will never return.`
                : `${fallenName} dissolved into Star Ash. Her name is etched onto the Memorial Wall forever.`,
              difficulty: "Calamity",
            });
          });
        }

        if (starfallUpdates?.floorCleared) {
          soundEffects.playQuestComplete();
          if (starfallUpdates.clearedAll100) {
            pushNotification({
              id: `starfall_f100_${Date.now()}`,
              type: "quest_completed",
              title: "★ FLOOR 100 CLEARED — STARFALL SUMMIT LIBERATED! ★",
              subtitle: `You defied Covenant fate, conquered The Administrator's Summit, and earned +${starfallUpdates.shardsAwarded || 45} Star Shards!`,
              difficulty: "S",
            });
          } else {
            pushNotification({
              id: `starfall_floor_${starfallUpdates.clearedFloor}_${Date.now()}`,
              type: "quest_completed",
              title: `FLOOR ${starfallUpdates.clearedFloor} CLEARED (+${starfallUpdates.shardsAwarded || 15} 💠)`,
              subtitle: starfallUpdates.beyondMemory
                ? `Advancing into Uncharted Stratum (Floor ${finalLs.currentFloor} — Beyond Ranker Memory)!`
                : `Squad advancing to Floor ${finalLs.currentFloor} (${getFloorTypeLabel(finalLs.currentFloor)}).`,
              difficulty: starfallUpdates.isGateBoss ? "A" : "B",
            });
          }
        }
      }

      partyRef.current = resolvedPartyState;
      setParty(resolvedPartyState);

      if (portUpdates) {
        const nextHouse =
          portUpdates.boardingHouse ||
          playerRef.current.boardingHouse ||
          createInitialBoardingHouseState();
        const revenueGoldBonus = Math.max(0, Math.round((portUpdates.dailyRevenueDelta || 0) * 0.25));
        const syncPortPlayer: PlayerProfile = {
          ...playerRef.current,
          gold: (playerRef.current.gold || 0) + revenueGoldBonus,
          boardingHouse: nextHouse,
        };
        playerRef.current = syncPortPlayer;
        setPlayer((prev) => ({
          ...prev,
          gold: (prev.gold || 0) + revenueGoldBonus,
          boardingHouse: portUpdates.boardingHouse || prev.boardingHouse || createInitialBoardingHouseState(),
        }));

        if (portUpdates.starUpgrade && portUpdates.boardingHouse) {
          pushNotification({
            id: `solaris_star_${Date.now()}`,
            type: "quest_completed",
            title: `SOLARIS STAR LEDGER UPGRADE (${portUpdates.boardingHouse.starRating}★)`,
            subtitle: `The Stray Anchor has climbed to ${portUpdates.boardingHouse.starRating}★ on the Solaris Star Ledger!`,
            difficulty: "A",
          });
        }
        if (portUpdates.inspectionAlert) {
          pushNotification({
            id: `solaris_audit_${Date.now()}`,
            type: "quest_assigned",
            title: "ISLAND CHARTER AUDIT NOTICE",
            subtitle: portUpdates.inspectionAlert,
            difficulty: "B",
          });
        }
      }

      // Finalize user message and clear pending state
      playerMsg.text = playerText;
      playerMsg.isPending = false;

      const turnMaxExpCap =
        starfallUpdates?.floorCleared ||
        starfallUpdates?.floor_cleared ||
        isClashTurn
          ? 800
          : 150;
      const isAmbientSpeaker = ["narrator", "system", "inner monologue"].some((s) => speakerName.toLowerCase().includes(s));
      const clampedVitalsPreview = clampTurnProgressionDeltas({
        expGained: data.player_progression?.exp_gained,
        hpChange: data.player_progression?.hp_change,
        mpChange: data.player_progression?.mp_change,
        maxHp: playerRef.current.stats.maxHp,
        maxMp: playerRef.current.stats.maxMp,
        maxExpCap: turnMaxExpCap,
      });
      const rawHpDelta = clampedVitalsPreview.hpChange;
      const rawMpDelta = clampedVitalsPreview.mpChange;
      const rawVitalsReason = data.player_progression?.vitals_reason || null;

      const companionMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "character",
        speakerName,
        text: narrative,
        mechanics: data.mechanics || null,
        vitalsImpact:
          rawHpDelta !== 0 || rawMpDelta !== 0
            ? {
                hpDelta: rawHpDelta,
                mpDelta: rawMpDelta,
                reason: rawVitalsReason,
              }
            : null,
        timestamp: timeString,
        avatarSrc: isAmbientSpeaker ? undefined : getSpriteSrc(speakerName, nextExpression),
      };

      const updatedChatLog = [
        ...chatBeforeTurn.filter((m) => m.id !== playerMsgId),
        { ...playerMsg, isPending: false, text: playerText },
        companionMsg,
      ];
      chatLogRef.current = updatedChatLog;
      setChatLog(updatedChatLog);

      if (!isCustom) {
        // Run typewriter on the LLM-generated protagonist execution
        clearUserTypewriter();
        setTypingUserMsgId(playerMsgId);
        setDisplayedUserText("");

        const userTarget = playerText;
        const userStep = Math.max(2, Math.ceil(userTarget.length / 32));
        let userIndex = 0;
        let blipCounter = 0;

        userTypewriterIntervalRef.current = setInterval(() => {
          userIndex += userStep;
          if (userIndex >= userTarget.length) {
            setDisplayedUserText(userTarget);
            setTypingUserMsgId(null);
            clearUserTypewriter();
          } else {
            setDisplayedUserText(userTarget.slice(0, userIndex));
            blipCounter++;
            if (blipCounter % 3 === 0) {
              soundEffects.playDialogueBlip();
            }
          }
        }, 16);
      } else {
        clearUserTypewriter();
        setDisplayedUserText(playerText);
        setTypingUserMsgId(null);
      }

      if (data.player_progression) {
        const prog = data.player_progression;
        let updatedInventory = [...playerRef.current.inventory];

        // 0. Contextual Equipment Acquisition detection (immediate client-side assurance)
        // If the player picked up / looted / claimed equipment in action or narrative,
        // guarantee it's injected into prog.items_dropped and prog.gear_granted.
        const combinedActionContext = `${formattedPayload || ""} ${playerText || ""}`.trim();
        const contextualEquip = detectContextualEquipmentAcquisition({
          action: combinedActionContext,
          storyText: narrative || "",
          currentGear: playerRef.current.gear,
        });

        if (contextualEquip) {
          if (!prog.items_dropped) {
            prog.items_dropped = [];
          }
          const alreadyInDrops = prog.items_dropped.some(
            (i: any) => i && i.name && i.name.toLowerCase() === contextualEquip.name.toLowerCase()
          );
          if (!alreadyInDrops) {
            prog.items_dropped.push(contextualEquip);
          }
          if (!prog.gear_granted) {
            prog.gear_granted = {};
          }
          if (!prog.gear_granted[contextualEquip.slot]) {
            prog.gear_granted[contextualEquip.slot] = contextualEquip.name;
          }
        }

        const newlyEquippedItems: { name: string; slot: "weapon" | "armor" | "relic"; item: InventoryItem }[] = [];

        if (prog.items_dropped && Array.isArray(prog.items_dropped) && prog.items_dropped.length > 0) {
          const rawDroppedList: InventoryItem[] = prog.items_dropped.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `loot_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          }));

          // 1. Immediately check Codex cache for all dropped items
          const { hydrated: initialHydratedDrops } = await hydrateInventoryItems(
            currentStory.id,
            rawDroppedList
          );

          updatedInventory = [...updatedInventory, ...initialHydratedDrops];

          const itemNames = initialHydratedDrops.map((i: InventoryItem) => i.name).join(", ");
          const lootNotifId = `loot_${Date.now()}`;
          const primaryItem = initialHydratedDrops[0];
          pushNotification({
            id: lootNotifId,
            type: "loot",
            title: initialHydratedDrops.length > 1 ? "TREASURES ACQUIRED" : "TREASURE ACQUIRED",
            subtitle: itemNames,
            rarity: primaryItem?.rarity || "rare",
            imageUrl: primaryItem?.imageUrl,
            metadata: primaryItem,
          });

          // Check if any dropped equipment should auto-equip
          const defaultGearNames = [
            "bare hands",
            "unarmed",
            "unarmored",
            "portrait attire (unarmored)",
            "rags",
            "none",
            "[system pending]",
            "",
          ];
          initialHydratedDrops.forEach((drop) => {
            if (drop.type === "weapon" || drop.type === "armor" || drop.type === "relic") {
              const slot = drop.type as "weapon" | "armor" | "relic";
              const currentSlotVal = (playerRef.current.gear?.[slot] || "").trim().toLowerCase();
              const isDefaultGear = defaultGearNames.includes(currentSlotVal);
              const isExplicitlyGranted =
                prog.gear_granted &&
                prog.gear_granted[slot]?.trim().toLowerCase() === drop.name.trim().toLowerCase();

              if (isDefaultGear || isExplicitlyGranted) {
                if (!newlyEquippedItems.some((e) => e.name.toLowerCase() === drop.name.toLowerCase())) {
                  newlyEquippedItems.push({ name: drop.name, slot, item: drop });
                }
              }
            }
          });

          // 2. Synthesize artwork with Nano Banana 2.1 for items that don't have an image in Codex yet
          const itemsNeedingGen = initialHydratedDrops.filter((item) => !item.imageUrl);
          itemsNeedingGen.forEach(async (droppedItem: InventoryItem) => {
            try {
              const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-key": accessKey,
                },
                body: JSON.stringify({
                  mode: "loot",
                  item: droppedItem,
                  genre: currentStory.genre,
                  userAccessKey: accessKey,
                }),
              });
              const lootData = await res.json();
              if (lootData.success && lootData.imageUrl) {
                // Permanently archive in Multiverse Codex
                await saveCodexLoot({
                  storyId: currentStory.id,
                  storyTitle: currentStory.title,
                  itemName: droppedItem.name,
                  itemType: droppedItem.type,
                  rarity: droppedItem.rarity,
                  description: droppedItem.description,
                  effect: droppedItem.effect,
                  imageUrl: lootData.imageUrl,
                  model: lootData.model || "Google: Nano Banana 2.1",
                });

                // Update player inventory and persist immediately to Auto-Save
                setPlayer((prev) => {
                  const cleanName = droppedItem.name.trim().toLowerCase();
                  const updated = prev.inventory.map((inv) =>
                    (inv.id && inv.id === droppedItem.id) ||
                    inv.name.trim().toLowerCase() === cleanName
                      ? { ...inv, imageUrl: lootData.imageUrl }
                      : inv
                  );
                  const updatedGearImages = {
                    ...(prev.gearImages || {}),
                    [droppedItem.id]: lootData.imageUrl,
                    [droppedItem.name]: lootData.imageUrl,
                  };
                  const nextP = { ...prev, inventory: updated, gearImages: updatedGearImages };
                  playerRef.current = nextP;
                  performAutoSave({ player: nextP });
                  return nextP;
                });

                pushNotification({
                  id: lootNotifId,
                  type: "loot",
                  title: initialHydratedDrops.length > 1 ? "TREASURES ACQUIRED" : "TREASURE ACQUIRED",
                  subtitle: itemNames,
                  imageUrl: lootData.imageUrl,
                  rarity: droppedItem.rarity || "rare",
                  metadata: { ...droppedItem, imageUrl: lootData.imageUrl },
                });
              }
            } catch (lootErr) {
              console.warn("Async loot image synthesis error:", lootErr);
            }
          });
        }

        const updatedGear = { ...playerRef.current.gear };
        if (prog.gear_granted) {
          if (prog.gear_granted.weapon) updatedGear.weapon = prog.gear_granted.weapon;
          if (prog.gear_granted.armor) updatedGear.armor = prog.gear_granted.armor;
          if (prog.gear_granted.relic) updatedGear.relic = prog.gear_granted.relic;

          // Ensure granted gear is registered in inventory if not already present
          const slots: ("weapon" | "armor" | "relic")[] = ["weapon", "armor", "relic"];
          for (const slot of slots) {
            const grantedName = prog.gear_granted[slot];
            if (grantedName && typeof grantedName === "string" && grantedName.trim()) {
              const cleanGranted = grantedName.trim();
              const exists = updatedInventory.some(
                (inv) => inv.name.trim().toLowerCase() === cleanGranted.toLowerCase()
              );
              if (!exists) {
                const syntheticItem: InventoryItem = {
                  id: `gear_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  name: cleanGranted,
                  type: slot,
                  rarity: "common",
                  description: `Equipment contextually acquired and equipped to ${slot.toUpperCase()} slot.`,
                  effect:
                    slot === "weapon"
                      ? "+8 ATK • Equipped Weapon"
                      : slot === "armor"
                      ? "+6 DEF • Equipped Armor"
                      : "+10 MP • Equipped Relic",
                };
                updatedInventory.push(syntheticItem);
                if (!newlyEquippedItems.some((e) => e.name.toLowerCase() === cleanGranted.toLowerCase())) {
                  newlyEquippedItems.push({ name: cleanGranted, slot, item: syntheticItem });
                }
              }
            }
          }
        }

        // Apply newly equipped items to updatedGear
        newlyEquippedItems.forEach((eq) => {
          updatedGear[eq.slot] = eq.name;
        });

        // Fire audio and visual feedback for newly equipped equipment
        if (newlyEquippedItems.length > 0) {
          soundEffects.playEquipChime();
          const firstEquipped = newlyEquippedItems[0];
          setAcquisitionAlert({
            id: `equip_${Date.now()}`,
            type: "gear",
            title: "EQUIPMENT EQUIPPED",
            subtitle: `${firstEquipped.name} (${firstEquipped.slot.toUpperCase()})`,
            imageUrl:
              firstEquipped.item.imageUrl ||
              (playerRef.current.gearImages && playerRef.current.gearImages[firstEquipped.name]),
          });
          pushNotification({
            id: `equip_notif_${Date.now()}`,
            type: "gear",
            title: "EQUIPMENT EQUIPPED",
            subtitle: `${firstEquipped.name} is now active in your ${firstEquipped.slot.toUpperCase()} slot.`,
            imageUrl: firstEquipped.item.imageUrl,
            rarity: firstEquipped.item.rarity || "uncommon",
            metadata: firstEquipped.item,
          });
        }

        let updatedAbilities = [...playerRef.current.abilities];
        const updatedAbilityDetails = { ...(playerRef.current.abilityDetails || {}) };
        if (prog.new_ability_unlocked) {
          const newSkill = prog.new_ability_unlocked.trim();
          if (!updatedAbilities.includes(newSkill)) {
            updatedAbilities = [...updatedAbilities, newSkill];
            updatedAbilityDetails[newSkill] = {
              name: newSkill,
              description: `A newly awakened technique forged through trials in ${nextLocation}. Channels the user's growing power.`,
              type: "Active",
              cost: "15 MP",
              cooldown: "2 Turns",
              tier: "Adept",
            };
          }
          soundEffects.playIntroBell();
          setAcquisitionAlert({
            id: `skill_${Date.now()}`,
            type: "skill",
            title: "NEW SKILL AWAKENED",
            subtitle: newSkill,
          });
        }

        const clampedProg = clampTurnProgressionDeltas({
          expGained: prog.exp_gained,
          hpChange: prog.hp_change,
          mpChange: prog.mp_change,
          maxHp: playerRef.current.stats.maxHp,
          maxMp: playerRef.current.stats.maxMp,
          maxExpCap: turnMaxExpCap,
        });
        const expGained = clampedProg.expGained;
        triggerExpFeedback(expGained, prog.exp_reason || null);

        const starCap =
          currentStory?.id === "starfall-labyrinth"
            ? getStarLevelCap(playerRef.current.labyrinthState?.protagonistStarRank || 1)
            : 60;

        const expRes = resolveProtagonistExpGain({
          level: playerRef.current.level,
          exp: playerRef.current.stats.exp,
          maxExp: playerRef.current.stats.maxExp,
          hp: playerRef.current.stats.hp,
          maxHp: playerRef.current.stats.maxHp,
          mp: playerRef.current.stats.mp,
          maxMp: playerRef.current.stats.maxMp,
          str: playerRef.current.stats.str,
          dex: playerRef.current.stats.dex,
          int: playerRef.current.stats.int,
          unspentStatPoints: playerRef.current.unspentStatPoints || 0,
          expGained,
          maxLevelCap: starCap,
          restoreVitalsOnLevelUp: false,
        });

        const newLevel = expRes.level;
        const newExp = expRes.exp;
        const newMaxExp = expRes.maxExp;
        const newMaxHp = expRes.maxHp;
        const newMaxMp = expRes.maxMp;
        const newStr = expRes.str;
        const newDex = expRes.dex;
        const newInt = expRes.int;
        const levelsGained = expRes.levelsGained;

        // Share earned combat/tactical/floor EXP with living deployed/present squadmates
        if (expGained > 0) {
          applySharedSquadExp(expGained, {
            focalCompanionName: affectedComp,
            skipStarfallRoster: Boolean(starfallUpdates?.floorCleared || starfallUpdates?.floor_cleared),
          });
        }

        if (levelsGained > 0) {
          soundEffects.playQuestComplete();
          setAcquisitionAlert({
            id: `level_${Date.now()}`,
            type: "level",
            title: `LEVEL ADVANCEMENT (LV.${newLevel})`,
            subtitle: `+${levelsGained * 20} HP • +${levelsGained * 10} MP • +${levelsGained * 2} Free Attribute Points`,
          });
        }

        const maxAff = Math.max(0, ...party.map((c) => c.affection || 0));
        const unsealTurnRes = updateInventoryUnsealingProgress(
          ensureInventoryRelicConditions(updatedInventory),
          "any_turn",
          1,
          maxAff
        );
        let finalTurnInventory = unsealTurnRes.updatedInventory;
        // When handleExecuteClashAction already resolved combat vitals for this turn, skip duplicate server HP/MP deltas
        const hpDeltaToApply = isClashTurn ? 0 : clampedProg.hpChange;
        const mpDeltaToApply = isClashTurn ? 0 : clampedProg.mpChange;
        const levelUpHpBonus = levelsGained * 20;
        const levelUpMpBonus = levelsGained * 10;
        const resolvedHp = Math.max(0, Math.min(newMaxHp, playerRef.current.stats.hp + levelUpHpBonus + hpDeltaToApply));
        const resolvedMp = Math.max(0, Math.min(newMaxMp, playerRef.current.stats.mp + levelUpMpBonus + mpDeltaToApply));

        if (hpDeltaToApply !== 0 || mpDeltaToApply !== 0) {
          if (hpDeltaToApply < 0) {
            soundEffects.playFavorSound(false);
          } else if (hpDeltaToApply > 0) {
            soundEffects.playFavorSound(true);
          }
          triggerVitalsFeedback(hpDeltaToApply, mpDeltaToApply, prog.vitals_reason || null);
        }

        if (resolvedHp > 0 && resolvedHp <= newMaxHp * 0.6) {
          const lowHpRes = updateInventoryUnsealingProgress(finalTurnInventory, "low_hp_survival", 1, maxAff);
          finalTurnInventory = lowHpRes.updatedInventory;
          unsealTurnRes.newlyReadyItems.push(...lowHpRes.newlyReadyItems);
        }
        if (unsealTurnRes.newlyReadyItems.length > 0) {
          unsealTurnRes.newlyReadyItems.forEach((readyItem) => {
            pushNotification({
              id: `unseal_ready_${readyItem.id}_${Date.now()}`,
              type: "loot",
              title: "RELIC UNSEALING COMPLETE",
              subtitle: `${readyItem.name} is ready for Mythic Purification in your Inventory!`,
              rarity: "relic",
              metadata: readyItem,
            });
          });
        }

        const nextPlayerState: PlayerProfile = {
          ...playerRef.current,
          visualDescription: data.visual_description || playerRef.current.visualDescription,
          level: newLevel,
          stats: {
            ...playerRef.current.stats,
            hp: resolvedHp,
            mp: resolvedMp,
            exp: newExp,
            maxExp: newMaxExp,
            maxHp: newMaxHp,
            maxMp: newMaxMp,
            str: newStr,
            dex: newDex,
            int: newInt,
          },
          gear: updatedGear,
          abilities: updatedAbilities,
          abilityDetails: updatedAbilityDetails,
          inventory: finalTurnInventory,
          unspentStatPoints: expRes.unspentStatPoints,
        };

        playerRef.current = nextPlayerState;
        setPlayer(nextPlayerState);
      }

      // Check if the LLM escalated a hostile story moment into a Random Encounter / Story Clash
      // (Skip if this turn was already a clash action/victory/retreat resolution)
      if (
        !isClashTurn &&
        data.state_updates?.story_clash &&
        data.state_updates.story_clash.isActive &&
        (!currentClashSnapshot || !currentClashSnapshot.isActive)
      ) {
        const incomingClash: ActiveStoryClashState = data.state_updates.story_clash;
        activeClashRef.current = incomingClash;
        setActiveClash(incomingClash);
        soundEffects.playSystemAlert();
        pushNotification({
          id: `encounter_escalated_${Date.now()}`,
          type: "story_clash",
          title: `HOSTILE ENCOUNTER: ${incomingClash.enemyName.toUpperCase()}`,
          subtitle: `Rank ${incomingClash.threatRank || "C"} ${incomingClash.enemyArchetype || "Adversary"} (${incomingClash.enemyHp} HP) engaged in ${nextLocation}!`,
          difficulty: incomingClash.threatRank || "B",
        });
        // Automatically synthesize a bespoke AI portrait for the enemy in the background
        handleGenerateEnemyImage(incomingClash.enemyVisualPrompt, incomingClash);
      }

      let nextMemories = memories;
      if (data.new_memory_unlocked && data.new_memory_unlocked.trim().length > 0) {
        nextMemories = [...memories, data.new_memory_unlocked.trim()];
        setMemories(nextMemories);
      }

      if (data.system_updates) {
        const sysUpdates = data.system_updates;
        let questNotificationShown = false;

        setSystemState((prevSys) => {
          const updatedActive = [...prevSys.activeQuests];
          const updatedCompleted = [...prevSys.completedQuests];
          const updatedDirectives = [...prevSys.systemDirectives];

          const appendDirective = (dirText: string) => {
            const clean = dirText.trim();
            if (!clean) return;
            // Prevent immediate or redundant duplicate directives
            const isDuplicate = updatedDirectives.slice(0, 3).some(
              (existing) =>
                existing.toLowerCase() === clean.toLowerCase() ||
                (clean.startsWith("[SYSTEM:") && existing.toLowerCase() === clean.toLowerCase())
            );
            if (!isDuplicate) {
              updatedDirectives.unshift(clean);
            }
          };

          // 1. Process quest updates
          if (Array.isArray(sysUpdates.quest_updates) && sysUpdates.quest_updates.length > 0) {
            sysUpdates.quest_updates.forEach((update: any) => {
              if (!update) return;
              const updateId = (update.quest_id || "").toLowerCase().trim();
              let qIndex = updatedActive.findIndex((q) => {
                const qId = (q.id || "").toLowerCase().trim();
                const qTitle = (q.title || "").toLowerCase().trim();
                return (
                  qId === updateId ||
                  qTitle === updateId ||
                  (updateId.length > 3 && (qTitle.includes(updateId) || updateId.includes(qTitle)))
                );
              });

              // If only 1 active quest, fall back to it if not strictly matched
              if (qIndex === -1 && updatedActive.length === 1) {
                qIndex = 0;
              }

              if (qIndex !== -1) {
                const targetQuest = { ...updatedActive[qIndex] };
                let anyNewlyCompleted = false;

                // Update objectives
                if (Array.isArray(update.completed_objective_indices)) {
                  targetQuest.objectives = (targetQuest.objectives || []).map((obj, idx) => {
                    const shouldBeCompleted = update.completed_objective_indices.includes(idx) || obj.completed;
                    if (shouldBeCompleted && !obj.completed) {
                      anyNewlyCompleted = true;
                    }
                    return {
                      ...obj,
                      completed: shouldBeCompleted,
                    };
                  });
                }

                if (update.progress_note) {
                  targetQuest.progressNote = update.progress_note;
                }

                // Check completion condition: ALL objectives must be fulfilled
                const totalObjectives = (targetQuest.objectives || []).length;
                const completedCount = (targetQuest.objectives || []).filter((o) => o.completed).length;
                const allObjectivesDone = totalObjectives > 0 && completedCount === totalObjectives;

                if (update.status === "failed") {
                  targetQuest.status = "failed";
                  updatedActive.splice(qIndex, 1);
                  appendDirective(`[SYSTEM: Scenario Failed - '${targetQuest.title}']`);
                  setSystemToast({
                    id: `quest_failed_${Date.now()}`,
                    type: "penalty_quest",
                    title: `SCENARIO FAILED: ${targetQuest.title}`,
                    subtitle: targetQuest.progressNote || "Scenario objectives compromised.",
                    difficulty: targetQuest.difficulty,
                    timestamp: "Just now",
                  });
                  questNotificationShown = true;
                } else if (allObjectivesDone || (totalObjectives <= 1 && update.status === "completed")) {
                  targetQuest.status = "completed";
                  targetQuest.objectives = (targetQuest.objectives || []).map((o) => ({ ...o, completed: true }));
                  targetQuest.isClaimed = false;

                  // Move to completed archive (deduplicating if an identical quest ID or title is already archived)
                  updatedActive.splice(qIndex, 1);
                  const existingCompIdx = updatedCompleted.findIndex(
                    (c) =>
                      (c.id || "").toLowerCase().trim() === (targetQuest.id || "").toLowerCase().trim() ||
                      (c.title || "").toLowerCase().trim() === (targetQuest.title || "").toLowerCase().trim()
                  );
                  if (existingCompIdx !== -1) {
                    updatedCompleted[existingCompIdx] = {
                      ...targetQuest,
                      isClaimed: Boolean(updatedCompleted[existingCompIdx].isClaimed),
                    };
                  } else {
                    updatedCompleted.unshift(targetQuest);
                  }

                  soundEffects.playQuestComplete();
                  setSystemToast({
                    id: `quest_ready_${Date.now()}`,
                    type: "quest_completed",
                    title: `CLEARANCE READY: ${targetQuest.title}`,
                    subtitle:
                      targetQuest.progressNote ||
                      "All scenario objectives fulfilled! Access SYSTEM interface to claim resonance rewards.",
                    difficulty: targetQuest.difficulty,
                    timestamp: "Just now",
                  });
                  questNotificationShown = true;
                  appendDirective(`[SYSTEM: Scenario Cleared - '${targetQuest.title}' (Clearance Ready to Claim)]`);
                } else {
                  // Scenario remains ACTIVE and in progress with pending objectives
                  targetQuest.status = "active";
                  updatedActive[qIndex] = targetQuest;

                  if (anyNewlyCompleted) {
                    soundEffects.playSystemNotification();
                    setSystemToast({
                      id: `quest_update_${Date.now()}`,
                      type: "quest_updated",
                      title: `OBJECTIVE UPDATED (${completedCount}/${totalObjectives})`,
                      subtitle: `${targetQuest.title}: ${targetQuest.progressNote || "Objective progress confirmed."}`,
                      difficulty: targetQuest.difficulty,
                      timestamp: "Just now",
                    });
                    questNotificationShown = true;
                    appendDirective(
                      `[SYSTEM: Objective Progress - '${targetQuest.title}' (${completedCount}/${totalObjectives})]`
                    );
                  }
                }
              }
            });
          }

          // 2. Process new quest assignment (calibrated by actual difficulty, objective count, and player level)
          if (sysUpdates.new_quest && typeof sysUpdates.new_quest === "object" && sysUpdates.new_quest.title) {
            const rawQ = sysUpdates.new_quest;
            const newQ: SystemQuest = calibrateQuestRankAndRewards(rawQ, {
              playerLevel: playerRef.current.level || 1,
              turnCount: currentTurnNumber,
            });

            const isDuplicate =
              updatedActive.some((q) => q.id === newQ.id || (q.title || "").toLowerCase() === (newQ.title || "").toLowerCase()) ||
              updatedCompleted.some((q) => q.id === newQ.id || (q.title || "").toLowerCase() === (newQ.title || "").toLowerCase());

            if (!isDuplicate) {
              updatedActive.push(newQ);
              appendDirective(`[SYSTEM: New Scenario Assigned - '${newQ.title}']`);

              if (!questNotificationShown) {
                soundEffects.playSystemNotification();
              }
              setSystemToast({
                id: `new_quest_${Date.now()}`,
                type: "quest_assigned",
                title: `NEW SCENARIO: ${newQ.title}`,
                subtitle: newQ.description,
                difficulty: newQ.difficulty,
                timestamp: "Just now",
              });
              questNotificationShown = true;
            }
          }

          // 3. Plausibility shift & High-Stakes Penalty Scenario (Pillar 3)
          let nextPlausibility = prevSys.plausibility;
          if (typeof sysUpdates.plausibility_delta === "number" && !isNaN(sysUpdates.plausibility_delta)) {
            nextPlausibility = Math.max(0, Math.min(100, prevSys.plausibility + sysUpdates.plausibility_delta));
          }

          let nextCovenantState: CausalCovenantState = prevSys.covenantState || {
            covenantsInvoked: 0,
            maxPlausibilityCap: 100,
            timelineScars: [],
            activeAnomalies: [],
          };
          if (data.state_updates?.covenant_update?.newCap) {
            nextCovenantState = {
              covenantsInvoked: (nextCovenantState.covenantsInvoked || 0) + 1,
              maxPlausibilityCap: data.state_updates.covenant_update.newCap,
              timelineScars: data.state_updates.covenant_update.scar
                ? [data.state_updates.covenant_update.scar, ...(nextCovenantState.timelineScars || [])]
                : (nextCovenantState.timelineScars || []),
              activeAnomalies: nextCovenantState.activeAnomalies || [],
            };
            nextPlausibility = Math.min(nextCovenantState.maxPlausibilityCap, 85);
          }
          const nextTier: PlausibilityTier =
            nextPlausibility >= 70
              ? "Stable"
              : nextPlausibility >= 40
              ? "Strained"
              : nextPlausibility >= 20
              ? "Volatile"
              : "Critical";

          let activePenalty: PenaltyScenarioState | null = prevSys.penaltyScenario || null;
          if (nextPlausibility < 25 && (!activePenalty || !activePenalty.isActive)) {
            soundEffects.playSystemAlert();
            activePenalty = {
              isActive: true,
              scenarioId: `penalty_void_${Date.now()}`,
              scenarioTitle: "DIMENSIONAL VOID RIFT SURVIVAL",
              survivalTurnsRequired: 3,
              currentSurvivalTurn: 0,
              hazardEffectDescription: "Causal plausibility depleted (<25%). Reality boundary fractured. Survive 3 void turns.",
              riskPenalty: "Causal oblivion & -25% permanent EXP penalty upon failure.",
              resolutionRewardRelicId: "relic_cursed_void_heart",
              beganAtPlausibility: nextPlausibility,
            };
            setSystemToast({
              id: `penalty_alert_${Date.now()}`,
              type: "penalty_quest",
              title: "PENALTY SCENARIO INITIATED",
              subtitle: "Causal plausibility dropped below Critical! Survive 3 turns in the Dimensional Void Rift to avoid obliteration.",
              difficulty: "Calamity",
              timestamp: "Just now",
            });
          } else if (activePenalty && activePenalty.isActive) {
            const nextSurv = activePenalty.currentSurvivalTurn + 1;
            if (nextSurv >= activePenalty.survivalTurnsRequired) {
              soundEffects.playQuestComplete();
              nextPlausibility = 80;
              activePenalty = null;
              const cursedRelic = CURSED_RELIC_TABLE[0];
              setPlayer((p) => ({
                ...p,
                inventory: [...(p.inventory || []), cursedRelic],
              }));
              setSystemToast({
                id: `penalty_clear_${Date.now()}`,
                type: "penalty_quest",
                title: "PENALTY SCENARIO OVERCOME",
                subtitle: `Surviving the Void Rift restabilized Plausibility to 80% and awarded [CURSED RELIC] ${cursedRelic.name}!`,
                difficulty: "S",
                timestamp: "Just now",
              });
            } else {
              activePenalty = {
                ...activePenalty,
                currentSurvivalTurn: nextSurv,
              };
            }
          }

          // 4. System announcement
          if (sysUpdates.system_announcement && typeof sysUpdates.system_announcement === "string") {
            const announcement = sysUpdates.system_announcement.trim();
            if (announcement.length > 0) {
              const isRedundant = updatedDirectives.slice(0, 3).some((existing) => {
                const eLower = existing.toLowerCase();
                const aLower = announcement.toLowerCase();
                return (
                  eLower === aLower ||
                  (aLower.includes("scenario cleared") && eLower.includes("scenario cleared")) ||
                  (aLower.includes("objective complete") && eLower.includes("objective complete"))
                );
              });
              if (!isRedundant) {
                appendDirective(announcement);
              }
              if (!questNotificationShown) {
                soundEffects.playSystemNotification();
                setSystemToast({
                  id: `sys_alert_${Date.now()}`,
                  type: "system_alert",
                  title: "SYSTEM DIRECTIVE",
                  subtitle: announcement,
                  timestamp: "Just now",
                });
                questNotificationShown = true;
              }
            }
          }

          return {
            plausibility: nextPlausibility,
            plausibilityTier: nextTier,
            activeQuests: updatedActive,
            completedQuests: updatedCompleted,
            systemDirectives: updatedDirectives.slice(0, 40),
            penaltyScenario: activePenalty,
            covenantState: nextCovenantState,
          };
        });
      }

      // NO-SAFEGUARD: Check for death event or fatal HP collapse
      const liveResolvedHp = playerRef.current?.stats?.hp ?? player.stats?.hp;
      if (data.death_event?.is_fatal || (liveResolvedHp !== undefined && liveResolvedHp <= 0)) {
        soundEffects.playSystemAlert();
        const deathCause = data.death_event?.cause_of_death || "Physical core collapsed under fatal trauma.";
        const killer = data.death_event?.killer_or_hazard || "Overwhelming Hostile Force";
        if (currentStory?.id === "starfall-labyrinth") {
          // Covenant VI: No timeline regression in Starfall Labyrinth — fatal protagonist death is Game Over
          setStarfallGameOver({
            causeOfDeath: deathCause,
            killerOrHazard: killer,
          });
        } else {
          const evalResult = evaluateDeathAndRegression({
            player: playerRef.current || player,
            causeOfDeath: deathCause,
            location: nextLocation,
            killerOrHazard: killer,
            currentPlausibility: systemState.plausibility,
            regressionCount: systemState.regressionCount || 0,
            anchorNodeId: visitedStoryNodes[visitedStoryNodes.length - 1]?.id,
          });
          appendPersistentDeathRegression(storyId || "astra-chronicles", evalResult.deathRecord);
          appendPersistentTimelineEcho(storyId || "astra-chronicles", evalResult.timelineEcho);
          setTimelineEchoes((prev) => [evalResult.timelineEcho, ...prev]);
          setDeathRegressionRecord(evalResult.deathRecord);
          setShowDeathModal(true);
        }
      }

      // Record Visited Timeline Anchor for Flowchart & Timeline Echoes (Task 2 & Pillar 4)
      const turnNodeKey = `turn_node_${Date.now()}`;

      if (data.timeline_echo_unlocked) {
        // Timeline Echo Unlocked
        const echo: TimelineEcho = {
          id: `echo_${Date.now()}`,
          sourceNodeKey: turnNodeKey,
          sourceNodeTitle: data.timeline_echo_unlocked.title || nextLocation,
          choiceTaken: isCustom ? formattedPayload : (data.player_execution || formattedPayload),
          consequenceSummary: data.timeline_echo_unlocked.summary,
          loopIteration: (systemState.regressionCount || 0) + 1,
          recordedAt: new Date().toISOString(),
          foreshadowKey: data.timeline_echo_unlocked.foreshadow_key,
        };
        appendPersistentTimelineEcho(storyId || "astra-chronicles", echo);
        setTimelineEchoes((prev) => [echo, ...prev]);
      }

      setGameState((prev) => ({
        ...prev,
        speaker: speakerName,
        dialogue: narrative,
        location: nextLocation,
        bgImage: nextBg,
        mood: data.state_updates?.mood ?? prev.mood,
        presentCompanions: presentList,
      }));

      let resolvedChoices = choices;
      if (data.suggested_choices && Array.isArray(data.suggested_choices)) {
        const filteredChoices = sanitizeAndFilterChoices(data.suggested_choices);
        const finalTurnChoices =
          filteredChoices.length >= 2
            ? filteredChoices
            : sanitizeAndFilterChoices(
                buildPersonalityFallbackChoices({
                  personality: playerRef.current?.personality,
                  personalityTraits: playerRef.current?.personalityTraits,
                  playerRole: playerRef.current?.role,
                  playerRace: playerRef.current?.race,
                  activeSpeaker: speakerName || "Narrator",
                  location: nextLocation || "this sector",
                  isProtagonistAlone:
                    presentList.length === 0 &&
                    (!speakerName || speakerName === "Narrator"),
                  storyId: currentStory?.id,
                  genre: currentStory?.genre,
                  narrativeText: narrative,
                })
              );
        setChoices(finalTurnChoices);
        resolvedChoices = finalTurnChoices;
      }

      const snapshotPlayer = {
        ...playerRef.current,
        gearImages: undefined,
        inventory: Array.isArray(playerRef.current.inventory)
          ? playerRef.current.inventory.map((item) => {
              if (item.imageUrl && item.imageUrl.length > 500) {
                const { imageUrl, ...restItem } = item;
                return restItem;
              }
              return item;
            })
          : [],
      };

      const newTimelineAnchor: VisitedStoryNode = {
        id: turnNodeKey,
        nodeKey: turnNodeKey,
        title: `${nextLocation}: ${speakerName}`,
        speaker: speakerName,
        location: nextLocation,
        visitedAt: new Date().toISOString(),
        choiceTaken: isCustom ? formattedPayload : (data.player_execution || formattedPayload),
        affectionSnapshot: resolvedPartyState.reduce((acc, c) => ({ ...acc, [c.name]: c.affection }), {}),
        gameStateSnapshot: {
          gameState: {
            speaker: speakerName,
            dialogue: narrative,
            location: nextLocation,
            bgImage: nextBg,
            mood: data.state_updates?.mood ?? gameState.mood,
            presentCompanions: presentList,
          },
          party: partyRef.current?.length ? partyRef.current : resolvedPartyState,
          player: snapshotPlayer,
          systemState: systemState,
          memories: nextMemories,
          chatLog: [...chatLog, playerMsg, companionMsg].slice(-20),
          choices: resolvedChoices,
        },
        isAnchor: true,
        anchorLabel: `Turn Anchor: ${nextLocation}`,
      };
      setVisitedStoryNodes((prev) => {
        const nextNodes = [...prev, newTimelineAnchor];
        const snapshotKeepCutoff = Math.max(0, nextNodes.length - 15);
        return nextNodes.map((node, idx) => {
          if (idx < snapshotKeepCutoff && !node.isStartingPoint && node.gameStateSnapshot) {
            const { gameStateSnapshot, ...lightNode } = node;
            return lightNode;
          }
          return node;
        });
      });

      // Affection Milestones (25%, 50%, 75%, 90%, 100%) & Companion Quests (Task 3)
      if (typeof delta === "number" && delta > 0 && affectedComp) {
        const compObj = party.find((c) => c.name.toLowerCase().includes(affectedComp.toLowerCase()));
        if (compObj) {
          const canonicalName = compObj.name;
          const compSlug = canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "_");
          const oldAffection = compObj.affection;
          const newAffection = Math.min(100, oldAffection + delta);
          [25, 50, 75, 90, 100].forEach((threshold) => {
            const milestoneId = `milestone_${compSlug}_${threshold}`;
            const questTitle = `[COMPANION QUEST] ${canonicalName}: ${threshold}% Heart Resonance`;

            const alreadyTracked =
              (companionMilestones[canonicalName] || []).includes(threshold) ||
              (companionMilestones[affectedComp] || []).includes(threshold) ||
              (companionCompletedMilestones[canonicalName.toLowerCase()] || []).includes(threshold) ||
              (systemState.activeQuests || []).some(
                (q) =>
                  q.id.toLowerCase() === milestoneId ||
                  q.title.toLowerCase() === questTitle.toLowerCase() ||
                  (q.title.toLowerCase().includes(canonicalName.toLowerCase()) && q.title.includes(`${threshold}%`))
              ) ||
              (systemState.completedQuests || []).some(
                (q) =>
                  q.id.toLowerCase() === milestoneId ||
                  q.title.toLowerCase() === questTitle.toLowerCase() ||
                  (q.title.toLowerCase().includes(canonicalName.toLowerCase()) && q.title.includes(`${threshold}%`))
              );

            if (oldAffection < threshold && newAffection >= threshold && !alreadyTracked) {
              setCompanionMilestones((prev) => ({
                ...prev,
                [canonicalName]: [...(prev[canonicalName] || []), threshold],
              }));

              const isSolarisStory = currentStory.id === "port-solaris";
              const solarisMilestoneQuest = isSolarisStory
                ? buildPortSolarisRomanceMilestoneQuest(
                    canonicalName,
                    threshold as 25 | 50 | 75 | 90 | 100
                  )
                : null;
              const questDifficulty = solarisMilestoneQuest
                ? solarisMilestoneQuest.difficulty
                : threshold >= 100
                ? "S"
                : threshold >= 75
                ? "A"
                : threshold >= 50
                ? "B"
                : "C";
              const finalQuestTitle = solarisMilestoneQuest
                ? `[HOUSEMATE QUEST] ${solarisMilestoneQuest.title}`
                : questTitle;
              const questDesc = solarisMilestoneQuest
                ? solarisMilestoneQuest.description
                : `${canonicalName} has reached the ${threshold}% emotional barrier! Her favor is locked at ${threshold}% until this scenario is resolved. Complete this milestone to deepen your bond and unlock a bespoke CG illustration.`;
              const questObjectives = solarisMilestoneQuest
                ? solarisMilestoneQuest.objectives
                : [
                    { text: `Share a private one-on-one moment with ${canonicalName}`, completed: false },
                    { text: `Overcome ${canonicalName}'s guarded defenses at ${threshold}% Favor`, completed: false },
                  ];
              const questRewards = solarisMilestoneQuest
                ? solarisMilestoneQuest.rewards
                : {
                    exp: threshold * 3,
                    gold: threshold * 6,
                    items: threshold >= 100 ? [`${canonicalName}'s Keepsake`] : undefined,
                  };

              setSystemState((prevSys) => {
                const existsInSys =
                  prevSys.activeQuests.some(
                    (q) =>
                      q.id.toLowerCase() === milestoneId ||
                      q.title.toLowerCase() === finalQuestTitle.toLowerCase()
                  ) ||
                  prevSys.completedQuests.some(
                    (q) =>
                      q.id.toLowerCase() === milestoneId ||
                      q.title.toLowerCase() === finalQuestTitle.toLowerCase()
                  );
                if (existsInSys) return prevSys;

                return {
                  ...prevSys,
                  activeQuests: [
                    {
                      id: milestoneId,
                      title: finalQuestTitle,
                      description: questDesc,
                      type: "scenario",
                      difficulty: questDifficulty as any,
                      objectives: questObjectives,
                      rewards: questRewards,
                      status: "active",
                    },
                    ...prevSys.activeQuests,
                  ],
                  systemDirectives: [
                    `[SYSTEM: Companion Arc Locked - '${finalQuestTitle}' (Favor Capped at ${threshold}%)]`,
                    ...prevSys.systemDirectives,
                  ],
                };
              });

              soundEffects.playQuestComplete();
              pushNotification({
                id: `milestone_${Date.now()}`,
                type: "quest_assigned",
                title: "ROMANCE MILESTONE QUEST UNLOCKED",
                subtitle: `${canonicalName} favor reached ${threshold}%! Complete her Companion Quest to unlock further affection.`,
                difficulty: questDifficulty,
              });
            }
          });
        }
      }

      // Auto-Save after every successful turn
      const nextGameStateSnapshot = {
        speaker: speakerName,
        dialogue: narrative,
        location: nextLocation,
        bgImage: nextBg,
        mood: data.state_updates?.mood ?? gameState.mood,
        presentCompanions: presentList,
      };
      const finalPartySnapshot = partyRef.current?.length ? partyRef.current : resolvedPartyState;
      gameStateRef.current = nextGameStateSnapshot;
      partyRef.current = finalPartySnapshot;
      memoriesRef.current = nextMemories;
      choicesRef.current = resolvedChoices;

      performAutoSave({
        player: playerRef.current,
        party: finalPartySnapshot,
        memories: nextMemories,
        chatLog: updatedChatLog,
        gameState: nextGameStateSnapshot,
        choices: resolvedChoices,
        activeClash: activeClashRef.current,
        systemState: systemStateRef.current,
      });
    } catch (err: any) {
      console.error(err);
      clearUserTypewriter();
      setTypingUserMsgId(null);
      // Preserve the user's prompt in chatLog (un-pending it) so it never vanishes and can be retried via Regenerate
      setChatLog((prev) =>
        prev.map((m) =>
          m.id === playerMsgId ? { ...m, isPending: false, text: initialUserText } : m
        )
      );
      pushNotification({
        id: `turn_err_${Date.now()}`,
        type: "system_alert",
        title: "TURN RESPONSE INTERRUPTED",
        subtitle: "Your prompt was preserved in the log. Click Regenerate (↻) on the message to retry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Systems Evolution Handlers (Pitches A, B, C)
  const covenantCheck = useMemo(() => {
    return checkCovenantAvailability(systemState, gameState, player.stats.hp, player.stats.maxHp);
  }, [systemState, gameState, player.stats.hp, player.stats.maxHp]);

  const handleConfirmCovenant = async (intent: string) => {
    if (!intent.trim() || isSeveringCovenant) return;
    setIsSeveringCovenant(true);
    soundEffects.playSystemAlert();
    setShowCovenantModal(false);

    const formattedCovenantChoice = `[COVENANT: REALITY SEVERANCE]: ${intent.trim()}`;
    setPlayer((prev) => {
      const covUnseal = updateInventoryUnsealingProgress(
        ensureInventoryRelicConditions(prev.inventory || []),
        "covenant_invoked",
        2
      );
      const next = { ...prev, inventory: covUnseal.updatedInventory };
      playerRef.current = next;
      return next;
    });
    await sendAction(formattedCovenantChoice, false, null, {
      intent: intent.trim(),
      targetPlausibility: 85,
    });
    setIsSeveringCovenant(false);
  };

  const handleGenerateEnemyImage = async (
    customPrompt?: string,
    clashOverride?: ActiveStoryClashState
  ) => {
    const targetClash = clashOverride || activeClash;
    if (!targetClash || isGeneratingEnemyImage) return;

    setIsGeneratingEnemyImage(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          mode: "monster",
          enemyName: targetClash.enemyName,
          enemyDesc: targetClash.enemyDesc,
          location: gameState.location,
          modifier: `${targetClash.threatRank || "C"}-Rank ${targetClash.enemyArchetype || "Adversary"}`,
          genre: currentStory.genre || "Dark Fantasy LitRPG",
          prompt: customPrompt || targetClash.enemyVisualPrompt || undefined,
          userAccessKey: accessKey,
        }),
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setActiveClash((prev) => {
          if (!prev) return prev;
          const updated: ActiveStoryClashState = {
            ...prev,
            enemyImageUrl: data.imageUrl,
            enemyVisualPrompt: customPrompt || prev.enemyVisualPrompt,
          };
          performAutoSave({ activeClash: updated });
          return updated;
        });

        try {
          await saveCodexScene({
            storyId: currentStory.id,
            storyTitle: currentStory.title,
            location: gameState.location,
            speaker: `Adversary: ${targetClash.enemyName}`,
            prompt:
              data.prompt ||
              customPrompt ||
              targetClash.enemyDesc ||
              `Hostile encounter with ${targetClash.enemyName}`,
            imageUrl: data.imageUrl,
            model: data.model || "Google: Nano Banana 2.1",
          });
        } catch (codexErr) {
          console.warn("Could not archive enemy portrait in Codex:", codexErr);
        }
      }
    } catch (err) {
      console.warn("Enemy portrait generation failed:", err);
    } finally {
      setIsGeneratingEnemyImage(false);
    }
  };

  const handleExecuteClashAction = async (
    actionType: "strike" | "burst" | "synergy" | "defense" | "flee"
  ) => {
    if (!activeClash || !activeClash.isActive || isLoading || isExecutingClashAction) return;

    setIsExecutingClashAction(true);
    try {
      soundEffects.playClick();

      const assistingComp = party.find((c) => c.isPresent && (c.name === activeClash.companionAssistingName || true)) || null;

      const result = resolveClashTurn(
        activeClash,
        actionType,
        player.role || "Voidstrider",
        assistingComp,
        player.stats,
        (player.activeStance as any) || "neutral"
      );

      const newPopups: ClashCombatPopup[] = [];
      if (result.isRetreat) {
        newPopups.push({
          id: `flee_${Date.now()}`,
          text: "DISENGAGED!",
          subtext: result.enemyDamageTaken > 0 ? `-${result.enemyDamageTaken} HP Graze` : "Clean Escape",
          colorClass: "border-amber-400 text-amber-300",
        });
      } else {
        newPopups.push({
          id: `dmg_${Date.now()}`,
          text: result.isCrit ? `CRIT! -${result.damageDealt} HP` : `-${result.damageDealt} HP`,
          subtext: result.isStaggered ? "STAGGERED!" : `${(player.activeStance || "neutral").toUpperCase()} STANCE`,
          colorClass: result.isCrit
            ? "border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
            : "border-rose-500/60 text-rose-300",
        });
      }

      if (result.isEvaded && !result.isRetreat) {
        newPopups.push({
          id: `evade_${Date.now()}`,
          text: "PHASE EVADED!",
          subtext: "0 Counter DMG",
          colorClass: "border-violet-400 text-violet-300",
        });
      } else if (result.enemyDamageTaken > 0) {
        newPopups.push({
          id: `counter_${Date.now()}`,
          text: `-${result.enemyDamageTaken} Player HP`,
          subtext: result.isRetreat ? "Parting Strike" : "Enemy Counter",
          colorClass: "border-red-500/60 text-red-300",
        });
      }
      const clashVictoryReward = result.isVictory
        ? calculateClashVictoryExp({
            threatRank: activeClash.threatRank,
            enemyMaxHp: activeClash.enemyMaxHp,
            playerLevel: playerRef.current.level,
            enemyName: activeClash.enemyName,
          })
        : null;

      if (clashVictoryReward) {
        newPopups.push({
          id: `clash_exp_${Date.now()}`,
          text: `+${clashVictoryReward.expGained} EXP`,
          subtext: `Rank ${activeClash.threatRank || "C"} Victory`,
          colorClass: "border-amber-400 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.55)]",
        });
      }

      setClashCombatPopups(newPopups);
      setTimeout(() => setClashCombatPopups([]), 2400);

      setLastClashHitEvent({
        id: Date.now(),
        damageDealt: result.damageDealt,
        enemyDamageTaken: result.enemyDamageTaken,
        hpHealed: result.hpHealed,
        isCrit: result.isCrit,
        isStaggered: result.isStaggered,
        isEvaded: result.isEvaded,
      });

      const hpAfterHeal = Math.min(player.stats.maxHp, player.stats.hp + result.hpHealed);
      const hpFinal = Math.max(0, hpAfterHeal - result.enemyDamageTaken);
      const mpCost = result.mpCost;
      const mpGain = actionType === "strike" ? 5 : actionType === "defense" ? 15 : 0;
      const mpFinal = Math.max(0, Math.min(player.stats.maxMp, player.stats.mp - mpCost + mpGain));

      const netHpDelta = hpFinal - player.stats.hp;
      const netMpDelta = mpFinal - player.stats.mp;
      if (netHpDelta !== 0 || netMpDelta !== 0) {
        triggerVitalsFeedback(
          netHpDelta,
          netMpDelta,
          netHpDelta < 0
            ? `${activeClash.enemyName} Counter-Attack`
            : netHpDelta > 0
            ? "Tactical Synergy Heal"
            : `${actionType.toUpperCase()} Stance Exchange`
        );
      }

      const unsealAfterClash = result.isVictory
        ? updateInventoryUnsealingProgress(
            ensureInventoryRelicConditions(playerRef.current.inventory || []),
            "clash_victory",
            3
          )
        : { updatedInventory: playerRef.current.inventory || [], newlyReadyItems: [] };

      let updatedPlayerState: PlayerProfile = {
        ...playerRef.current,
        inventory: unsealAfterClash.updatedInventory,
        stats: {
          ...playerRef.current.stats,
          hp: hpFinal,
          mp: mpFinal,
        },
      };

      if (clashVictoryReward) {
        triggerExpFeedback(clashVictoryReward.expGained, clashVictoryReward.reason);
        const clashProg = applyExpProgression(updatedPlayerState, clashVictoryReward.expGained);
        updatedPlayerState = clashProg.updatedPlayer;
        applySharedSquadExp(clashVictoryReward.expGained, {
          focalCompanionName: assistingComp?.name || null,
        });

        if (clashProg.levelsGained > 0) {
          setAcquisitionAlert({
            id: `level_clash_${Date.now()}`,
            type: "level",
            title: `LEVEL ADVANCEMENT (LV.${clashProg.newLevel})`,
            subtitle: `+${clashProg.levelsGained * 20} HP • +${clashProg.levelsGained * 10} MP • +${clashProg.levelsGained * 2} Free Attribute Points • Core Restored`,
          });
        }
      }

      playerRef.current = updatedPlayerState;
      setPlayer(updatedPlayerState);
      activeClashRef.current = result.updatedClashState.isActive ? result.updatedClashState : null;
      setActiveClash(result.updatedClashState);

      if (result.isVictory) {
        soundEffects.playQuestComplete();
        pushNotification({
          id: `clash_win_${Date.now()}`,
          type: "story_clash",
          title: `SECTOR CLASH VICTORY (+${clashVictoryReward?.expGained || 0} EXP)`,
          subtitle: `${activeClash.enemyName} neutralized! Sector secured and squad combat EXP awarded.`,
          difficulty: "S",
        });
      } else if (result.isRetreat) {
        soundEffects.playFavorSound(false);
        pushNotification({
          id: `clash_flee_${Date.now()}`,
          type: "story_clash",
          title: "TACTICAL DISENGAGEMENT",
          subtitle: `Broke combat engagement with ${activeClash.enemyName}.`,
        });
      } else {
        soundEffects.playFavorSound(false);
        pushNotification({
          id: `clash_hit_${Date.now()}`,
          type: "story_clash",
          title: actionType.toUpperCase() + " RESOLVED",
          subtitle: `Dealt ${result.damageDealt} DMG. ${result.enemyDamageTaken > 0 ? `Took ${result.enemyDamageTaken} DMG counter.` : ""}`,
        });
      }

      setIsExecutingClashAction(false);
      await sendAction(result.narrativePromptAction, false, null, null, false, {
        playerSnapshot: updatedPlayerState,
        clashSnapshot: result.updatedClashState,
        isClashResolutionTurn: true,
      });
    } finally {
      setIsExecutingClashAction(false);
    }
  };

  const handleInitiateSectorClash = (enemyName: string = "Sector Anomaly Golem", enemyHp: number = 75) => {
    const assistingComp = party.find((c) => c.isPresent)?.name;
    const clash = initiateStoryClash({
      enemyName,
      enemyHp,
      tacticalObjective: `Neutralize the ${enemyName} before causal perimeter breaches.`,
      companionAssistingName: assistingComp,
      genre: currentStory.genre || "Dark Fantasy LitRPG",
    });
    setActiveClash(clash);
    soundEffects.playSystemAlert();
    pushNotification({
      id: `clash_start_${Date.now()}`,
      type: "story_clash",
      title: "TACTICAL CLASH ENGAGED",
      subtitle: `${enemyName} (HP: ${enemyHp}) detected within combat radius. Class Arsenal primed.`,
      difficulty: "A",
    });
    handleGenerateEnemyImage(clash.enemyVisualPrompt, clash);
  };

  const handleResolveCampUltimatum = async (choiceKey: "reconcile" | "comp1" | "comp2" | "command") => {
    if (!activeUltimatumRivalry || !frictionState) return;

    let choiceText = "";
    if (choiceKey === "reconcile") {
      choiceText = `[Reconcile/Triad]: Challenge both ${activeUltimatumRivalry.companion1Name} and ${activeUltimatumRivalry.companion2Name} to rise above their past and unite their strengths into an unbreakable triad bond.`;
    } else if (choiceKey === "comp1") {
      choiceText = `[Affirm/${activeUltimatumRivalry.companion1Name}]: Affirm ${activeUltimatumRivalry.companion1Name}'s core philosophy and declare your unwavering loyalty to her side.`;
    } else if (choiceKey === "comp2") {
      choiceText = `[Affirm/${activeUltimatumRivalry.companion2Name}]: Affirm ${activeUltimatumRivalry.companion2Name}'s convictions and declare your unwavering loyalty to her side.`;
    } else {
      choiceText = `[Command/Stern]: Reject both emotional ultimatums, demanding absolute tactical discipline under your command.`;
    }

    const resolution = resolveCampUltimatum(choiceText, frictionState);

    setParty((prevParty) =>
      prevParty.map((c) => {
        if (resolution.chosenAllegiance === "reconciled") {
          if (c.name.includes(activeUltimatumRivalry.companion1Name) || c.name.includes(activeUltimatumRivalry.companion2Name)) {
            return { ...c, affection: Math.min(100, c.affection + 6) };
          }
        } else if (resolution.chosenAllegiance === "comp1" && c.name.includes(activeUltimatumRivalry.companion1Name)) {
          return { ...c, affection: Math.min(100, c.affection + 12) };
        } else if (resolution.chosenAllegiance === "comp2" && c.name.includes(activeUltimatumRivalry.companion2Name)) {
          return { ...c, affection: Math.min(100, c.affection + 12) };
        } else if (resolution.chosenAllegiance === "neutral") {
          return { ...c, affection: Math.min(100, c.affection + 2) };
        }
        return c;
      })
    );

    setShowCampUltimatumModal(false);
    setActiveUltimatumRivalry(null);

    pushNotification({
      id: `ultimatum_res_${Date.now()}`,
      type: "companion_friction",
      title: "CAMP ULTIMATUM RESOLVED",
      subtitle: resolution.narrativeResolution,
    });

    await sendAction(choiceText, false);
  };

  const handleSendCustomAction = (text: string, isOOC: boolean) => {
    sendAction(text, true, null, null, isOOC);
  };

  const handleSelectPresetChoice = async (choiceText: string, idx: number) => {
    if (isLoading || isDraftingAction) return;
    soundEffects.playClick();
    setIsDraftingAction(true);
    setDraftingChoiceIdx(idx);

    const activePlayer = playerRef.current || player;
    const activeGame = gameStateRef.current || gameState;
    const activeParty = partyRef.current || party;

    try {
      const res = await fetch("/api/expand-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          action: choiceText,
          playerProfile: activePlayer,
          gameState: activeGame,
          partyMembers: activeParty,
          activeStance: activePlayer.activeStance || "neutral",
          narrationStyle:
            narrationStyle ||
            activePlayer?.narrationStyle ||
            currentStory?.narrationStyle ||
            "Grimdark & Atmospheric",
          recentHistory: chatLog.slice(-8).map((m) => ({
            speaker: m.speakerName,
            text: m.text,
          })),
          targetEnvironment: llmConfig.targetEnvironment,
          modelId: llmConfig.modelId,
          temperature: llmConfig.temperature,
          repetition_penalty: llmConfig.repetition_penalty,
          userAccessKey: accessKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.expanded_action && typeof data.expanded_action === "string") {
          setDraftActionText(data.expanded_action.trim());
          setDraftActionVersion((v) => v + 1);
          return;
        }
      }

      // Fallback if response wasn't ok
      const stripped = choiceText.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
      setDraftActionText(stripped);
      setDraftActionVersion((v) => v + 1);
    } catch (err) {
      console.warn("[ExpandAction] Fallback to clean choice text:", err);
      const stripped = choiceText.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
      setDraftActionText(stripped);
      setDraftActionVersion((v) => v + 1);
    } finally {
      setIsDraftingAction(false);
      setDraftingChoiceIdx(null);
    }
  };

  const getChoiceResonanceBadge = (choiceText: string): { label: string; color: string } | null => {
    const lower = choiceText.toLowerCase();
    const raceName = (player.race || "Human").trim();
    if (
      raceName.toLowerCase() !== "human" &&
      (lower.includes("fang") ||
        lower.includes("scent") ||
        lower.includes("growl") ||
        lower.includes("instinct") ||
        lower.includes("predator") ||
        lower.includes("ears") ||
        lower.includes("claws") ||
        lower.includes("blood") ||
        lower.includes(raceName.toLowerCase()))
    ) {
      return {
        label: `🐺 ${raceName} Instinct`,
        color: "border-purple-500/40 bg-purple-950/70 text-purple-300",
      };
    }
    if (
      lower.includes("[aggressive]") ||
      lower.includes("strike") ||
      lower.includes("grab") ||
      lower.includes("force") ||
      lower.includes("intimidate") ||
      lower.includes("shove") ||
      lower.includes("stand your ground") ||
      lower.includes("blade")
    ) {
      return {
        label: `⚔️ STR ${player.stats.str}`,
        color: "border-rose-500/40 bg-rose-950/70 text-rose-300",
      };
    }
    if (
      lower.includes("[tactical]") ||
      lower.includes("step") ||
      lower.includes("evade") ||
      lower.includes("circle") ||
      lower.includes("flank") ||
      lower.includes("dart") ||
      lower.includes("reflex") ||
      lower.includes("distance")
    ) {
      return {
        label: `⚡ DEX ${player.stats.dex}`,
        color: "border-emerald-500/40 bg-emerald-950/70 text-emerald-300",
      };
    }
    if (
      lower.includes("[Stoic") ||
      lower.includes("[analytical]") ||
      lower.includes("deduce") ||
      lower.includes("inquire") ||
      lower.includes("question") ||
      lower.includes("analyze") ||
      lower.includes("observe") ||
      lower.includes("enlighten")
    ) {
      return {
        label: `👁️ INT ${player.stats.int}`,
        color: "border-sky-500/40 bg-sky-950/70 text-sky-300",
      };
    }
    return null;
  };

  const handleRerollChoices = async () => {
    if (isLoading || isRerollingChoices || isDraftingAction) return;
    soundEffects.playClick();
    setIsRerollingChoices(true);
    try {
      const res = await fetch("/api/generate-choices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyContext: currentStory,
          gameState,
          partyMembers: party,
          memories,
          systemState,
          narrationStyle: narrationStyle || player.narrationStyle || currentStory?.narrationStyle,
          modelId: llmConfig.modelId,
          storyTitle: currentStory.title,
          location: gameState.location,
          mood: gameState.mood,
          speaker: gameState.speaker,
          dialogue: gameState.dialogue,
          playerProfile: {
            name: player.name,
            gender: player.gender,
            age: player.age,
            worldOrigin: player.worldOrigin,
            worldOriginDetails: player.worldOriginDetails,
            race: player.race,
            racialTraits: player.racialTraits,
            role: player.role,
            personality: player.personality,
            personalityTraits: player.personalityTraits,
            abilities: player.abilities,
            activeStance: player.activeStance,
            behavioralTendencies: player.behavioralTendencies,
          },
          recentHistory: chatLog.slice(-6).map((m) => ({
            speaker: m.speakerName,
            text: m.text,
          })),
          userAccessKey: accessKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const sanitizedReroll = sanitizeAndFilterChoices(data.choices);
        if (sanitizedReroll.length > 0) {
          setChoices(sanitizedReroll);
          pushNotification({
            id: `reroll_${Date.now()}`,
            type: "level",
            title: "TACTICAL VECTORS REFRESHED",
            subtitle: `Synthesized ${sanitizedReroll.length} alternative protagonist choices for the current scene.`,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to reroll choices:", err);
    } finally {
      setIsRerollingChoices(false);
    }
  };

  const handleTogglePinMemory = useCallback((factText: string) => {
    const clean = factText.trim();
    if (!clean) return;
    soundEffects.playClick();
    setPlayer((prev) => {
      const current = prev.pinnedMemories || [];
      const exists = current.includes(clean);
      let next: string[];
      if (exists) {
        next = current.filter((m) => m !== clean);
      } else {
        if (current.length >= 6) {
          pushNotification({
            id: `pin_limit_${Date.now()}`,
            type: "level",
            title: "CORE CANON CAPACITY (6/6)",
            subtitle: "Unpin an existing memory in the Chronicle drawer before pinning a new one.",
          });
          return prev;
        }
        next = [...current, clean];
        pushNotification({
          id: `pin_added_${Date.now()}`,
          type: "level",
          title: "📌 PINNED TO CORE CANON",
          subtitle: clean,
        });
      }
      const updated = { ...prev, pinnedMemories: next };
      playerRef.current = updated;
      return updated;
    });
  }, []);

  const handleAddCustomPinnedMemory = () => {
    const clean = customMemoryInput.trim();
    if (!clean) return;
    handleTogglePinMemory(clean);
    setCustomMemoryInput("");
  };

  const handlePinTurnMessage = useCallback(
    (text: string, speakerName: string) => {
      const raw = text.replace(/\s+/g, " ").trim();
      const snippet = raw.length > 210 ? `${raw.slice(0, 207)}...` : raw;
      const formatted = `[${speakerName}]: ${snippet}`;
      handleTogglePinMemory(formatted);
    },
    [handleTogglePinMemory]
  );

  const handleViewMessagePortrait = useCallback(
    (imgUrl: string, speaker?: string) => {
      const p = playerRef.current;
      const isPlayerSpeaker =
        !speaker || speaker.toLowerCase() === (p.name || "").toLowerCase();
      handleOpenPlayerFullPortrait(
        undefined,
        imgUrl,
        speaker || p.name,
        isPlayerSpeaker
          ? `Lv.${p.level} ${p.race || "Human"} • ${p.role || "Adventurer"}`
          : "Companion Portrait"
      );
    },
    []
  );

  const handleAllocateLevelStat = (statKey: "str" | "dex" | "int") => {
    if ((player.unspentStatPoints || 0) <= 0) return;
    soundEffects.playClick();
    setPlayer((prev) => {
      if ((prev.unspentStatPoints || 0) <= 0) return prev;
      const updated: PlayerProfile = {
        ...prev,
        unspentStatPoints: (prev.unspentStatPoints || 0) - 1,
        stats: {
          ...prev.stats,
          [statKey]: prev.stats[statKey] + 1,
        },
      };
      playerRef.current = updated;
      return updated;
    });
  };

  const handleCompleteQuest = (questId: string) => {
    // 1. Synchronously find the target quest from current systemState
    let activeIdx = systemState.activeQuests.findIndex((q) => q.id === questId);
    let completedIdx = systemState.completedQuests.findIndex((q) => q.id === questId);

    if (activeIdx === -1 && completedIdx === -1) {
      activeIdx = systemState.activeQuests.findIndex((q) => q.title.toLowerCase().includes(questId.toLowerCase()));
      if (activeIdx === -1) {
        completedIdx = systemState.completedQuests.findIndex((q) => q.title.toLowerCase().includes(questId.toLowerCase()));
      }
    }

    if (activeIdx === -1 && completedIdx === -1) {
      console.warn(`[SystemQuest] Quest not found for completion: ${questId}`);
      return;
    }

    const isFromActive = activeIdx !== -1;
    const rawTarget = isFromActive ? systemState.activeQuests[activeIdx] : systemState.completedQuests[completedIdx];

    if (rawTarget.isClaimed) {
      return;
    }

    // Safety guard: Cannot claim rewards if any objectives are still pending
    const rawObjs = rawTarget.objectives || [];
    const allDone = rawObjs.length === 0 || rawObjs.every((o) => o?.completed);
    if (!allDone) {
      console.warn(`[SystemQuest] Quest ${questId} has pending objectives; cannot claim clearance.`);
      return;
    }

    const calibratedTarget = calibrateQuestRankAndRewards(rawTarget, {
      playerLevel: (playerRef.current || player).level || 1,
    });
    const targetQuest: SystemQuest = {
      ...calibratedTarget,
      status: "completed" as const,
      isClaimed: true,
      claimedAt: Date.now(),
      objectives: (calibratedTarget.objectives || []).map((o) => ({ ...o, completed: true })),
    };

    const expRewardToApply = Number(targetQuest.rewards?.exp || 0);
    const statRewardToApply = Number(targetQuest.rewards?.statPoints || 0);
    const goldRewardToApply = Number(targetQuest.rewards?.gold || 0);
    const itemsRewardToApply = Array.isArray(targetQuest.rewards?.items) ? targetQuest.rewards.items : [];

    // 2. Synchronously create the new systemState
    const nextActive = systemState.activeQuests.filter((q) => q.id !== targetQuest.id);
    const nextCompleted = [...systemState.completedQuests];
    const existingCompIdx = nextCompleted.findIndex((q) => q.id === targetQuest.id);
    if (existingCompIdx !== -1) {
      nextCompleted[existingCompIdx] = targetQuest;
    } else {
      nextCompleted.unshift(targetQuest);
    }

    const verifyMsg = `[SYSTEM: Clearance Verified - '${targetQuest.title}']`;
    const curDirs = systemState.systemDirectives || [];
    const updatedDirs = curDirs.length > 0 && curDirs[0].toLowerCase() === verifyMsg.toLowerCase()
      ? curDirs
      : [verifyMsg, ...curDirs];

    const nextSystemState: SystemState = {
      ...systemState,
      activeQuests: nextActive,
      completedQuests: nextCompleted,
      systemDirectives: updatedDirs.slice(0, 40),
    };

    setSystemState(nextSystemState);

    // 3. Grant EXP rewards with live bar feedback, squad EXP sharing & level-up checks
    let latestPlayer = { ...(playerRef.current || player) };
    if (expRewardToApply > 0) {
      triggerExpFeedback(expRewardToApply, `Quest Cleared: ${targetQuest.title}`);
      const { updatedPlayer, levelsGained, newLevel } = applyExpProgression(latestPlayer, expRewardToApply);
      latestPlayer = updatedPlayer;
      playerRef.current = updatedPlayer;
      setPlayer(updatedPlayer);
      applySharedSquadExp(expRewardToApply);

      if (levelsGained > 0) {
        soundEffects.playQuestComplete();
        setAcquisitionAlert({
          id: `level_quest_${Date.now()}`,
          type: "level",
          title: `LEVEL ADVANCEMENT (LV.${newLevel})`,
          subtitle: `+${levelsGained * 20} HP • +${levelsGained * 10} MP • +${levelsGained * 2} STR / DEX / INT • Core Restored`,
        });
      }
    }

    // 4. Grant Stat Points
    if (statRewardToApply > 0) {
      setStatPoints((prev) => prev + statRewardToApply);
    }

    // 5. Grant Gold
    if (goldRewardToApply > 0) {
      latestPlayer = {
        ...latestPlayer,
        gold: (latestPlayer.gold || 0) + goldRewardToApply,
      };
      playerRef.current = latestPlayer;
      setPlayer(latestPlayer);
    }

    // 6. Grant Item Rewards if any
    if (itemsRewardToApply.length > 0) {
      const newItems: InventoryItem[] = itemsRewardToApply.map((itemText, i) => ({
        id: `reward_item_${Date.now()}_${i}`,
        name: itemText,
        type: "material" as const,
        rarity: "rare" as const,
        description: `Reward acquired from clearing system scenario: ${targetQuest.title}.`,
        effect: "Resonance Catalyst",
      }));
      latestPlayer = {
        ...latestPlayer,
        inventory: [...latestPlayer.inventory, ...newItems],
      };
      playerRef.current = latestPlayer;
      setPlayer(latestPlayer);
    }

    // 7. Persist to Auto-Save
    performAutoSave({ player: latestPlayer, systemState: nextSystemState });

    // 8. Companion Milestone & Notification Logic
    const milestoneMatch = targetQuest.id.match(/^milestone_([a-z0-9_]+)_(\d+)$/i);
    let compKey = milestoneMatch && milestoneMatch[1] ? milestoneMatch[1] : null;
    let thresholdNum = milestoneMatch && milestoneMatch[2] ? parseInt(milestoneMatch[2], 10) : null;

    if (!compKey && targetQuest.title.includes("[COMPANION QUEST]")) {
      const thresholdFound = [25, 50, 75, 100].find((t) => targetQuest.title.includes(`${t}%`));
      thresholdNum = thresholdFound || 25;
      const compFound = party.find((c) => targetQuest.title.toLowerCase().includes(c.name.toLowerCase()));
      compKey = compFound ? compFound.name.toLowerCase().replace(/[^a-z0-9]/g, "_") : "companion";
    }

    if (compKey && thresholdNum) {
      const matchedComp = party.find(
        (c) =>
          c.name.toLowerCase().replace(/[^a-z0-9]/g, "_") === compKey ||
          c.name.toLowerCase().includes(compKey)
      );
      const canonicalName = matchedComp?.name || compKey;
      const nextCap = thresholdNum === 25 ? 50 : thresholdNum === 50 ? 75 : 100;

      setCompanionCompletedMilestones((prev) => ({
        ...prev,
        [canonicalName.toLowerCase()]: [...(prev[canonicalName.toLowerCase()] || []), thresholdNum!],
      }));

      soundEffects.playQuestComplete();
      pushNotification({
        id: `manual_breakthrough_${Date.now()}`,
        type: "quest_completed",
        title: "HEART RESONANCE BREAKTHROUGH",
        subtitle: `${canonicalName}'s emotional barrier shattered! Affection cap raised to ${nextCap}%.`,
        difficulty: targetQuest.difficulty,
      });
    } else {
      soundEffects.playQuestComplete();
      pushNotification({
        id: `quest_claimed_${Date.now()}`,
        type: "quest_completed",
        title: "SCENARIO CLEARANCE CLAIMED",
        subtitle: `${targetQuest.title} clearance archived. +${expRewardToApply} EXP${statRewardToApply > 0 ? ` • +${statRewardToApply} Stat Points` : ""}${goldRewardToApply > 0 ? ` • +${goldRewardToApply} Gold` : ""}.`,
        difficulty: targetQuest.difficulty,
      });
    }
  };

  const hasUnclaimedClearance = useMemo(() => {
    if (!systemState) return false;
    const activeReady = (systemState.activeQuests || []).some(
      (q) =>
        (q.status === "completed" ||
          ((q.objectives || []).length > 0 && (q.objectives || []).every((o) => o?.completed))) &&
        !q.isClaimed
    );
    const completedReady = (systemState.completedQuests || []).some((q) => !q.isClaimed);
    return activeReady || completedReady;
  }, [systemState]);

  const presentComps = party.filter((c) => c.isPresent && c.heroStatus !== "FALLEN");
  const isProtagonistAlone = presentComps.length === 0;
  const isSpeakingHeroine = party.find((c) => c.name.toLowerCase().includes(gameState.speaker.toLowerCase()));
  const activeSpeakerComp = isSpeakingHeroine || (presentComps.length > 0 ? presentComps[0] : party[0]);
  const heroineForMeter = isProtagonistAlone ? null : (isSpeakingHeroine || (presentComps.length > 0 ? presentComps[0] : null));

  const renderSaveModal = () => (
    <>
    {showSaveModal && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4 max-h-[90dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-sky-400" /> Character Save Slots
            </h2>
            <button onClick={() => { setShowSaveModal(false); setConfirmDeleteSlot(null); }} className="text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cross-Save Cloud Vault & Portable .astra Backup Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-sky-950/35 via-zinc-900/70 to-amber-950/25 border border-sky-500/30 px-3.5 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-white block">Cross-Save Progression Vault</span>
                <span className="text-[10px] text-zinc-400 font-sans">Cloud Account Sync & Portable .astra Backup</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  downloadAstraBundleFile();
                }}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="Download .astra Master Save File"
              >
                <Download className="w-3 h-3" /> .astra
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowCloudSyncModal(true);
                }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 border border-sky-400/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all cursor-pointer flex items-center gap-1"
              >
                <Cloud className="w-3 h-3" /> Cloud Sync Hub
              </button>
            </div>
          </div>

          {/* Auto-Save Status & Preference Toggle */}
          <div className="flex items-center justify-between bg-black/40 border border-white/10 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-mono font-bold text-zinc-200 block">Auto-Save Matrix</span>
                <span className="text-[10px] text-zinc-400 font-sans">Saves journey progress after every turn</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                const next = !autoSaveEnabled;
                setAutoSaveEnabled(next);
                try {
                  localStorage.setItem("astra_autosave_enabled", String(next));
                } catch {}
              }}
              className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                autoSaveEnabled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                  : "bg-white/5 text-zinc-500 border-white/10 hover:text-zinc-300"
              }`}
            >
              {autoSaveEnabled ? "ENABLED" : "DISABLED"}
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {/* AUTO-SAVE (SLOT 0) */}
            {(() => {
              const autoSave = savedSlots[0];
              return (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden shadow-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" /> AUTO-SAVE
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        System Slot
                      </span>
                    </div>
                    {autoSave ? (
                      <div className="mt-1">
                        <p className="text-sm font-bold text-white">
                          {autoSave.player.name}{" "}
                          <span className="text-xs text-zinc-400 font-normal">
                            (Lv.{autoSave.player.level} {autoSave.player.role})
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {autoSave.storyTitle ? `${autoSave.storyTitle} • ` : ""}
                          {autoSave.gameState.speaker} • {autoSave.gameState.location}
                        </p>
                        {autoSave.savedAt && (
                          <p className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                            Auto-saved: {autoSave.savedAt}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 mt-1 italic">
                        No auto-save recorded yet. Auto-save triggers after every turn.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {autoSave && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadSlot(0)}
                          className="px-3.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 rounded-xl text-xs font-semibold text-emerald-200 cursor-pointer transition-all shadow-md active:scale-95"
                        >
                          Resume
                        </button>

                        {confirmDeleteSlot === 0 ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(0)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                            >
                              Clear?
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSlot(null)}
                              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs transition-all cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setConfirmDeleteSlot(0);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                            title="Clear Auto-Save Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Divider */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 pt-1">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span>MANUAL CHRONICLE SLOTS</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>

            {/* MANUAL SLOTS 1, 2, 3 */}
            {[1, 2, 3].map((slot) => {
              const s = savedSlots[slot];
              return (
                <div key={slot} className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold text-rose-400">SLOT 0{slot}</span>
                    {s ? (
                      <div className="mt-0.5">
                        <p className="text-sm font-bold text-white">{s.player.name} <span className="text-xs text-zinc-400 font-normal">(Lv.{s.player.level} {s.player.role})</span></p>
                        <p className="text-[11px] text-zinc-500 font-mono">{s.storyTitle ? `${s.storyTitle} • ` : ""}{s.gameState.speaker} • {s.gameState.location}</p>
                        {s.savedAt && (
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Saved: {s.savedAt}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 mt-1 italic">Empty Save Slot</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isConfigured && (
                      <button
                        onClick={() => handleSaveSlot(slot)}
                        className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 rounded-xl text-xs font-semibold text-amber-200 cursor-pointer transition-all active:scale-95"
                      >
                        Save
                      </button>
                    )}
                    {s && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLoadSlot(slot)}
                          className="px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 rounded-xl text-xs font-semibold text-sky-200 cursor-pointer transition-all active:scale-95"
                        >
                          Load
                        </button>

                        {confirmDeleteSlot === slot ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                              title="Confirm Permanent Deletion"
                            >
                              Delete?
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSlot(null)}
                              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs transition-all cursor-pointer"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setConfirmDeleteSlot(slot);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                            title="Delete Save Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    <CloudSyncModal
      isOpen={showCloudSyncModal}
      onClose={() => setShowCloudSyncModal(false)}
      onProgressionRestored={() => {
        loadAllGameSlots().then((slots) => setSavedSlots(slots as any));
      }}
    />
    </>
  );

  const renderAuthModal = () => (
    showAuthModal && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4 max-h-[90dvh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" /> Guild Gate & Access Control
            </h2>
            {userAuth && (
              <button onClick={() => setShowAuthModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {userAuth ? (
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">Active Key Holder</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                    {userAuth.role}
                  </span>
                </div>
                <p className="text-sm font-bold text-white font-mono">{userAuth.name}</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <p className="text-xs font-mono text-zinc-400">
                    Key:{" "}
                    <span className="text-zinc-200">
                      {revealActiveKey
                        ? userAuth.key
                        : userAuth.key.length > 8
                        ? `${userAuth.key.slice(0, 4)}••••••••${userAuth.key.slice(-3)}`
                        : "••••••••••••"}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setRevealActiveKey(!revealActiveKey)}
                    className="text-[11px] font-mono text-zinc-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {revealActiveKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{revealActiveKey ? "Hide" : "Reveal"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-mono uppercase text-zinc-400">Remaining Turns</p>
                  <p className="text-lg font-bold text-rose-300 font-mono mt-1">
                    {userAuth.remainingTurns === -1 ? "Unlimited" : `${userAuth.remainingTurns} / ${userAuth.maxTurns}`}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Used: {userAuth.turnsUsed} turns</p>
                </div>
                <div className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl">
                  <p className="text-[10px] font-mono uppercase text-zinc-400">Tokens Tracked</p>
                  <p className="text-lg font-bold text-sky-300 font-mono mt-1">
                    {userAuth.totalTokens.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">via OpenRouter API</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setUserAuth(null);
                    setAccessKey("");
                    setKeyInput("");
                    localStorage.removeItem("astra_access_key");
                  }}
                  className="px-3.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 rounded-xl cursor-pointer"
                >
                  Switch Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter an authorized realm access key. Your key connects directly to OpenRouter API quotas and tracks usage per session:
              </p>

              <div className="space-y-2">
                <div className="relative flex items-center">
                  <input
                    type={showKeySecret ? "text" : "password"}
                    placeholder="Enter realm access key..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        verifyKey(keyInput);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl pl-4 pr-11 py-2.5 text-base sm:text-sm font-mono text-white focus:outline-none focus:border-purple-500/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-3 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    title={showKeySecret ? "Mask key" : "Show key"}
                  >
                    {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {authError && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
                    {authError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-[11px] text-zinc-400">
                <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Encrypted locally in browser storage. Your credentials remain private and are verified via secure proxy.</span>
              </div>

              <button
                type="button"
                disabled={authLoading || !keyInput.trim()}
                onClick={() => verifyKey(keyInput)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs font-mono flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
              >
                {authLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" /> Validate Key & Enter Realm
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );

  const renderTransitionOverlay = () => (
    isTransitioning && (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-between items-center py-8 px-6 select-none animate-title-reveal pointer-events-auto">
        <AtmosphericParticles location={isTransitioning.location} intensity="intense" />
        <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

        {/* Top letterbox banner */}
        <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-zinc-500 font-mono text-xs tracking-widest border-b border-white/10 pb-4">
          <span className="flex items-center gap-2 text-rose-400 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> ASTRA CONTINENT CHRONICLES
          </span>
          <span className="text-zinc-400 uppercase">PROLOGUE CONVERGENCE</span>
        </div>

        {/* Centerpiece title card */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl space-y-6 my-auto">
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 via-purple-500/25 to-sky-500/20 border border-white/20 flex items-center justify-center shadow-[0_0_60px_rgba(244,63,94,0.4)]">
            <Sparkles className="w-9 h-9 text-rose-300 animate-spin" style={{ animationDuration: "12s" }} />
            <div className="absolute inset-0 rounded-full border border-rose-500/40 animate-ping opacity-30" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              Crossing the Leyline Barrier
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-mono text-white tracking-wide drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)]">
              {isTransitioning.location}
            </h2>
          </div>

          <div className="bg-zinc-950/85 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-2 max-w-lg">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-rose-300 uppercase tracking-wider">
              <span>Encountering {isTransitioning.speaker}</span>
            </div>
            <p className="text-sm italic text-zinc-200 leading-relaxed font-serif pt-1">
              &ldquo;{isTransitioning.quote}&rdquo;
            </p>
          </div>

          <p className="text-xs font-mono text-zinc-400">
            Protagonist: <span className="text-white font-semibold">{player.name}</span> <span className="text-rose-400 font-mono">({player.role})</span>
          </p>
        </div>

        {/* Bottom letterbox bar */}
        <div className="relative z-10 w-full max-w-4xl flex items-center justify-center text-[11px] font-mono text-zinc-500 border-t border-white/10 pt-4">
          <span className="flex items-center gap-2 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Planar resonance aligned • Manifesting reality...
          </span>
        </div>
      </div>
    )
  );

  const renderSceneModal = () =>
    showSceneModal && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        {/* Hidden File Picker for Scene Artwork Replacement */}
        <input
          type="file"
          ref={sceneFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleUploadSceneReplacement(e.target.files[0]);
          }}
        />

        <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4 max-h-[90dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold font-mono text-white">Cinematic Scene Canvas</h2>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isCachedScene
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {isCachedScene ? "Codex Archived" : "Nano Banana 2.1"}
              </span>
            </div>
            <button
              onClick={() => setShowSceneModal(false)}
              className="text-zinc-400 hover:text-white cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isGeneratingScene ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="relative">
                <RefreshCw className="w-10 h-10 text-rose-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white font-mono">Synthesizing Scene with Nano Banana 2.1...</p>
                <p className="text-xs text-zinc-400 font-mono">
                  Rendering {gameState.location} • {gameState.speaker}
                </p>
              </div>
            </div>
          ) : sceneGenError ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono space-y-3">
              <p>{sceneGenError}</p>
              <button
                onClick={() => handleGenerateSceneCG(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-all"
              >
                Retry Generation
              </button>
            </div>
          ) : generatedScene ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl group">
                <img
                  src={generatedScene.imageUrl}
                  alt={generatedScene.location}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-xs text-zinc-300 font-mono line-clamp-2">
                    {generatedScene.prompt}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Location: <strong className="text-white">{generatedScene.location}</strong></span>
                <span>Model: <strong className="text-rose-400">{generatedScene.model}</strong></span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setGameState((prev) => ({ ...prev, bgImage: generatedScene.imageUrl }));
                    setShowSceneModal(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Check className="w-3.5 h-3.5" /> Active Backdrop
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sceneFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Replace with an image from your PC"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-400" /> Replace Art
                  </button>

                  <button
                    onClick={() => handleGenerateSceneCG(true)}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Re-render scene illustration with Nano Banana 2.1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-roll
                  </button>

                  <button
                    onClick={handleNavigateToCodex}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Open Multiverse Codex"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Codex
                  </button>

                  <a
                    href={generatedScene.imageUrl}
                    download={`${currentStory.id}_scene.png`}
                    className="px-3 py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 text-sky-200 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> HD
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );

  const renderItemModal = () =>
    inspectedItem && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        {/* Hidden File Picker for Item Icon Replacement */}
        <input
          type="file"
          ref={itemFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleUploadItemReplacement(e.target.files[0]);
          }}
        />

        <div className="w-full max-w-sm bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4 max-h-[90dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Artifact Inspection
            </span>
            <button onClick={() => setInspectedItem(null)} className="text-zinc-400 hover:text-white cursor-pointer p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/80 border-2 border-white/15 shadow-2xl flex items-center justify-center group">
            {inspectedItem.imageUrl ? (
              <>
                <img src={inspectedItem.imageUrl} alt={inspectedItem.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingItemIcon}
                    onClick={() => handleGenerateItemImage(inspectedItem)}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                    title="Re-roll icon with Nano Banana 2.1"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingItemIcon ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => itemFileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                    title="Upload icon from PC"
                  >
                    <Upload className="w-4 h-4 text-sky-400" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500 p-4 text-center">
                <Package className="w-12 h-12 text-zinc-600" />
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    disabled={isGeneratingItemIcon}
                    onClick={() => handleGenerateItemImage(inspectedItem)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono hover:bg-amber-500/30 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {isGeneratingItemIcon ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Synthesizing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Nano Banana
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => itemFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono cursor-pointer flex items-center gap-1"
                    title="Upload icon from PC"
                  >
                    <Upload className="w-3 h-3 text-sky-400" /> Upload
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">{inspectedItem.name}</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10">
                {inspectedItem.rarity} • {inspectedItem.type}
              </span>
            </div>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">{inspectedItem.description}</p>
            {inspectedItem.effect && (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300">
                ✦ {inspectedItem.effect}
              </div>
            )}

            {/* Cursed & Relic Purification / Mythic Awakening Section */}
            {(inspectedItem.rarity === "cursed" || inspectedItem.rarity === "relic") && (() => {
              const preparedRelic = ensureRelicUnsealingCondition(inspectedItem);
              const cond = preparedRelic.unsealingCondition;
              const awakenedForm = preparedRelic.awakenedForm;
              if (preparedRelic.isAwakened) {
                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/60 via-purple-950/40 to-amber-950/60 border border-amber-400/50 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mythic Awakening Complete
                      </span>
                      <span>Purified Sovereign Relic</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      This artifact&apos;s abyssal seal has been shattered and permanently transmuted into its Sovereign Mythic Form.
                    </p>
                  </div>
                );
              }
              if (!cond || !awakenedForm) return null;
              const pct = Math.min(100, Math.round((cond.currentValue / Math.max(1, cond.targetValue)) * 100));
              return (
                <div className="p-3 rounded-2xl bg-zinc-900/90 border border-rose-500/35 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-rose-400" /> Unsealing Trial: {cond.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      {cond.currentValue} / {cond.targetValue} ({pct}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                    {cond.description}
                  </p>
                  <div className="w-full bg-black/80 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 h-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono text-zinc-400 truncate">
                      Awakens: <strong className="text-amber-300">{awakenedForm.awakenedName}</strong>
                    </div>
                    <button
                      type="button"
                      disabled={isAwakeningRelic}
                      onClick={() => handlePurifyAndAwakenRelic(preparedRelic)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        cond.isMet
                          ? "bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.45)]"
                          : "bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200"
                      }`}
                      title={cond.isMet ? "Unsealing condition met! Awaken Mythic Form" : "Channel Astral Resonance to force-purify and awaken now"}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAwakeningRelic ? "animate-spin" : ""}`} />
                      <span>
                        {isAwakeningRelic
                          ? "Awakening..."
                          : cond.isMet
                          ? "Purify & Awaken Relic"
                          : "Force Purify & Awaken"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            {["weapon", "armor", "relic"].includes(inspectedItem.type) && (
              <button
                onClick={() => {
                  handleEquipItem(inspectedItem);
                  setInspectedItem(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold cursor-pointer transition-all"
              >
                Equip Artifact
              </button>
            )}
            <button
              onClick={() => setInspectedItem(null)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );

  const renderAbilityModal = () =>
    inspectedAbility && (
      <div 
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        onClick={() => setInspectedAbility(null)}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-3 sm:gap-4 max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-150"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Ability Dossier
            </span>
            <button 
              onClick={() => setInspectedAbility(null)} 
              className="text-zinc-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {inspectedAbility.name}
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Class Archetype: {player.role || "Adventurer"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                {inspectedAbility.tier || "Novice"} Tier
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                {inspectedAbility.type || "Active"}
              </span>
            </div>
          </div>

          {/* Cost & Cooldown Row */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-xl border border-white/5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase">Resource Cost</p>
                <p className="text-xs font-mono font-bold text-sky-300">{inspectedAbility.cost || "None"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-xl border border-white/5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[9px] font-mono text-zinc-500 uppercase">Cooldown / Cast</p>
                <p className="text-xs font-mono font-bold text-emerald-300">{inspectedAbility.cooldown || "Instant"}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-zinc-500 block">Ability Description & Mechanics</label>
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-200 font-sans leading-relaxed shadow-inner">
              {inspectedAbility.description}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-zinc-500">
            <span className="flex items-center gap-1 text-zinc-400">
              <Shield className="w-3 h-3 text-sky-400" /> System Verified Ability
            </span>
            <button
              onClick={() => setInspectedAbility(null)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );

  const handleOpenPlayerFullPortrait = (
    e?: React.MouseEvent,
    customAvatar?: string | null,
    customName?: string,
    customSubtitle?: string
  ) => {
    if (e) {
      e.stopPropagation();
    }
    const targetUrl = (customAvatar ?? playerAvatar)?.trim();
    if (!targetUrl) return;
    soundEffects.playClick();
    setFullPortraitViewer({
      imageUrl: targetUrl,
      name: customName || player.name || "Wanderer",
      subtitle:
        customSubtitle ||
        `Lv.${player.level || 1} ${player.race || "Human"} • ${player.role || "Adventurer"}`,
      canEdit: !customAvatar && isConfigured,
    });
  };

  const renderCharacterPortraitViewerModal = () =>
    fullPortraitViewer && (
      <div
        className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-150"
        onClick={() => setFullPortraitViewer(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-zinc-950/95 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92dvh] animate-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <span>{fullPortraitViewer.name}</span>
              </h3>
              {fullPortraitViewer.subtitle && (
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  {fullPortraitViewer.subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFullPortraitViewer(null)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Close Full Image View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 bg-black/80 border border-white/10 rounded-2xl p-2 sm:p-4 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[70dvh]">
            <img
              src={fullPortraitViewer.imageUrl}
              alt={fullPortraitViewer.name}
              className="max-h-[66dvh] max-w-full w-auto h-auto object-contain rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <a
              href={fullPortraitViewer.imageUrl}
              download={`${(fullPortraitViewer.name || "character").replace(/\s+/g, "_")}_portrait.png`}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Full Image</span>
            </a>

            <div className="flex items-center gap-2">
              {fullPortraitViewer.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setFullPortraitViewer(null);
                    setShowPortraitEditor(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 hover:text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Edit / Change Portrait</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setFullPortraitViewer(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // 1. OPENING / WELCOME SPLASH SCREEN (FIRST LOAD)
  if (!isConfigured && !hasSeenWelcome) {
    return (
      <div className={`relative h-screen w-screen overflow-hidden bg-black font-sans flex flex-col items-center justify-center select-none transition-all duration-300 ease-out ${
        pageLoaded && !screenTransition.isOpen ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
      }`}>
        <div 
          className="fixed inset-0 bg-cover bg-center transition-all duration-1000 brightness-[0.38] contrast-125 scale-105 pointer-events-none select-none z-0"
          style={{ backgroundImage: `url("${currentStory.coverImage || DEFAULT_BG}")` }}
        />
        <div className="fixed inset-0 bg-gradient-to-t from-black via-black/60 to-black/80 pointer-events-none z-0" />
        <div className="fixed inset-0 cinematic-vignette pointer-events-none z-0" />

        <div className="fixed inset-0 pointer-events-none z-0">
          <AtmosphericParticles location="Imperial Capital Imperium" intensity="intense" />
        </div>

        <div className="absolute top-5 left-5 z-30 flex items-center gap-2">
          <button
            onClick={handleNavigateToCatalogue}
            className="px-3.5 py-2 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg flex items-center gap-2 font-mono text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" /> Back to Catalogue
          </button>
        </div>

        <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
          <button
            onClick={handleToggleAudio}
            className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
            title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>
        </div>

        <div className="relative z-20 flex flex-col items-center text-center max-w-2xl px-6 animate-title-reveal space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-rose-300 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> {currentStory.genre || "Visual Novel Engine"}
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_10px_35px_rgba(244,63,94,0.45)]">
              {currentStory.title.split(" ")[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">{currentStory.title.split(" ").slice(1).join(" ") || "CHRONICLES"}</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300 font-sans max-w-lg mx-auto leading-relaxed">
              {currentStory.tagline || currentStory.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-4">
            <button
              onClick={() => {
                soundEffects.playIntroBell();
                setHasSeenWelcome(true);
                sessionStorage.setItem("astra_welcome_seen", "true");
              }}
              className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-bold font-mono text-sm shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_45px_rgba(244,63,94,0.6)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Play className="w-4 h-4 fill-white" /> Begin Chronicle
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setShowWorldGuidebook(true);
              }}
              className="w-full sm:w-auto py-3.5 px-5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white rounded-2xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Read World Lore, Heroines, Locations, Stats & Keywords"
            >
              <BookOpen className="w-4 h-4 text-amber-400" /> World Guide
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setShowSaveModal(true);
              }}
              className="w-full sm:w-auto py-3.5 px-5 bg-black/60 hover:bg-black/90 border border-white/15 hover:border-sky-500/50 text-zinc-300 hover:text-white rounded-2xl font-mono text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-sky-400" /> Load Game
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto py-3.5 px-4 bg-black/60 hover:bg-black/90 border border-white/15 hover:border-purple-500/50 text-zinc-300 hover:text-white rounded-2xl font-mono text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Access Key"
            >
              <Key className="w-4 h-4 text-purple-400" />
            </button>
          </div>

          <div className="pt-6 flex items-center gap-5 text-xs text-zinc-500 font-mono">
            <span>{currentStory.companions?.length || 5} Heroines</span>
            <span>•</span>
            <span>AI Dynamic Lore</span>
            <span>•</span>
            <span>{currentStory.worldContext?.settingName?.split("(")[0]?.split("&")[0]?.trim() || "Astra Continent"}</span>
          </div>
        </div>

        {renderSaveModal()}
        {renderAuthModal()}
        <WorldGuidebookModal
          isOpen={showWorldGuidebook}
          onClose={() => setShowWorldGuidebook(false)}
          story={currentStory}
          labyrinthState={player.labyrinthState}
        />
        <ScreenTransitionOverlay {...screenTransition} />
      </div>
    );
  }

  // 2. CHARACTER CREATOR SCREEN
  if (!isConfigured) {
    if (creationStep === "gear") {
      return (
        <GearManifestScreen
          pageLoaded={pageLoaded}
          isScreenTransitionOpen={screenTransition.isOpen}
          defaultBg={currentStory.coverImage || DEFAULT_BG}
          playerName={player.name}
          playerRole={player.role || "Adventurer"}
          settingName={currentStory.worldContext?.settingName || currentStory.title || "Astra Continent"}
          isGeneratingGear={isGeneratingGear}
          systemGearOptions={systemGearOptions}
          generatingImageItemIds={generatingImageItemIds}
          onBackToSetup={() => setCreationStep("character")}
          onRerollGear={handleGenerateStartingGear}
          onConfirmGearAndStart={handleConfirmGearAndStart}
        >
          {renderSaveModal()}
          {renderAuthModal()}
          {renderTransitionOverlay()}
          {renderAbilityModal()}
          {renderCharacterPortraitViewerModal()}
          <ScreenTransitionOverlay {...screenTransition} />
          <LlmProviderModal
            isOpen={showLlmModal}
            onClose={() => setShowLlmModal(false)}
            config={llmConfig}
            onChange={(newConfig: LlmConfig) => {
              setLlmConfig(newConfig);
              saveStoredLlmConfig(newConfig);
            }}
          />
        </GearManifestScreen>
      );
    }

    return (
      <div className={`relative min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 py-8 md:py-12 overflow-y-auto transition-all duration-300 ease-out ${
        pageLoaded && !screenTransition.isOpen ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
      }`}>
        <div 
          className="fixed inset-0 bg-cover bg-center brightness-[0.22] contrast-125 pointer-events-none select-none z-0"
          style={{ backgroundImage: `url("${currentStory.coverImage || DEFAULT_BG}")` }}
        />
        <div className="fixed inset-0 cinematic-vignette pointer-events-none z-0" />
        <div className="fixed inset-0 pointer-events-none z-0">
          <AtmosphericParticles location="Imperial Capital Imperium" intensity="gentle" />
        </div>

        <div className="relative z-10 w-full max-w-4xl bg-zinc-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl space-y-4 sm:space-y-5 my-auto">
          <div className="space-y-3 border-b border-white/10 pb-3.5">
            {/* Top Utility Navigation Bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleNavigateToCatalogue}
                className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/30 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer font-mono shrink-0"
                title="Return to Story Catalogue"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-mono text-xs">Catalogue</span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={handleToggleAudio}
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-white/15 text-xs text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
                >
                  {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowWorldGuidebook(true);
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-xs text-amber-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                  title="Open World Lore Guidebook (Characters, Locations, Stats & Keywords)"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-xs">World Guide</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    router.push("/account");
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-emerald-300 hover:text-white hover:border-emerald-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Astral Traveler Account Dossier & Character Roster Hub"
                >
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-xs">Account</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setShowAuthModal(true);
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-zinc-300 hover:text-white hover:border-purple-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Realm Access Key"
                >
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono text-xs">{userAuth ? userAuth.name.split(" ")[0] : "Key"}</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setShowSaveModal(true);
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-zinc-300 hover:text-white hover:border-rose-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                  <span className="font-mono text-xs sm:hidden">Load</span>
                  <span className="hidden sm:inline">Load Game</span>
                </button>
              </div>
            </div>

            {/* Full-Width Story Title Row (Never Truncated) */}
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2 min-w-0">
                <Sparkles className="text-rose-400 w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
                <span className="break-words">{currentStory.title.toUpperCase()}</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-zinc-500 border border-white/10 bg-zinc-950/70 px-2.5 py-1 rounded-lg shrink-0">
                Origin Protocol
              </span>
            </div>

            {/* 4-Step Tab Navigation Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2">
              {(
                [
                  {
                    id: "identity" as const,
                    step: "01",
                    label: "Identity & Persona",
                    sub: `${player.name || "Caelen"} • ${player.race || "Human"}`,
                  },
                  {
                    id: "origin" as const,
                    step: "02",
                    label:
                      currentStory.id === "sovereign-spire"
                        ? "Matriculation Origin"
                        : currentStory.id === "port-solaris"
                        ? "Proprietor Background"
                        : currentStory.id === "starfall-labyrinth"
                        ? "Summoned Origin"
                        : "World Origin",
                    sub:
                      currentStory.id === "sovereign-spire"
                        ? `Rank #${player.matriculationRank || 488}`
                        : currentStory.id === "port-solaris"
                        ? `0★ Probation • ${player.semesterDebtQuota || 1200} Crowns`
                        : currentStory.id === "starfall-labyrinth"
                        ? `${player.labyrinthState?.isHiddenRarity ? "?★" : `${player.labyrinthState?.protagonistStarRank || 1}★`} • ${player.labyrinthState?.starShards ?? 60} Shards`
                        : player.worldOrigin?.split("(")[0]?.trim() || "Native",
                  },
                  {
                    id: "conduit" as const,
                    step: "03",
                    label:
                      currentStory.id === "sovereign-spire"
                        ? "Conduit & Wing"
                        : currentStory.id === "port-solaris"
                        ? "Flair & Faction"
                        : currentStory.id === "starfall-labyrinth"
                        ? "Squad Role & Kit"
                        : "Class & Arsenal",
                    sub:
                      hasCustomWorldPresets(currentStory.id)
                        ? `${(player.conduit || "SOMATIC").replace(/_/g, " ")} • ${gearPreference.toUpperCase()}`
                        : player.role || "Choose Class",
                  },
                  {
                    id: "prologue" as const,
                    step: "04",
                    label:
                      hasCustomWorldPresets(currentStory.id)
                        ? "Act I Prelude"
                        : "Starting Scenario",
                    sub: prologues[selectedPrologue]?.speaker || "Select Node",
                  },
                ]
              ).map((tab) => {
                const isActive = creationTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setCreationTab(tab.id);
                    }}
                    className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-0.5 ${
                      isActive
                        ? "bg-gradient-to-br from-rose-950/70 via-zinc-900 to-amber-950/50 border-rose-500/80 text-white shadow-lg ring-1 ring-rose-500/30"
                        : "bg-zinc-950/80 border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold text-rose-400">
                        STEP {tab.step}
                      </span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold truncate">
                      {tab.label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 truncate">
                      {tab.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              TAB 1: IDENTITY, LINEAGE & PERSONA
             ========================================================= */}
          {creationTab === "identity" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Collapsible Cross-World Character Roster */}
              <div className="bg-gradient-to-r from-indigo-950/50 via-zinc-950/90 to-purple-950/50 border border-indigo-500/30 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <input
                  ref={rosterFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportCharacterBlueprint}
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowRosterDrawer((prev) => !prev);
                    }}
                    className="flex items-center gap-2 text-left cursor-pointer min-w-0"
                  >
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Cross-World Character Roster
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-bold">
                      {characterRoster.length} Saved
                    </span>
                    {showRosterDrawer ? (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => rosterFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 hover:border-indigo-400/50 text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Import a .character.json blueprint file"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Import</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCharacterToRoster}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="Save current character identity (Name, Portrait, Race, Class, Personality) to Roster"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Character</span>
                    </button>
                  </div>
                </div>

                {rosterNotice && (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{rosterNotice}</span>
                  </div>
                )}

                {showRosterDrawer && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Load a saved protagonist blueprint (Name, Portrait, Lineage, &amp; Persona) into {currentStory.title}.
                    </p>
                    {characterRoster.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 pt-0.5">
                        {characterRoster.map((bp) => {
                          const isActiveMatch =
                            player.name.trim().toLowerCase() === bp.name.trim().toLowerCase() &&
                            (player.race || "Human").trim().toLowerCase() === (bp.race || "Human").trim().toLowerCase();
                          return (
                            <div
                              key={bp.id}
                              onClick={() => handleLoadCharacterFromRoster(bp)}
                              className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                isActiveMatch
                                  ? "bg-indigo-950/60 border-indigo-400/80 text-white shadow-md"
                                  : "bg-zinc-900/85 hover:bg-zinc-900 border-white/10 hover:border-indigo-500/50 text-zinc-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  onClick={(e) => {
                                    if (bp.avatar && bp.avatar.trim()) {
                                      handleOpenPlayerFullPortrait(
                                        e,
                                        bp.avatar,
                                        bp.name,
                                        `${bp.race || "Human"} • ${bp.role || "Adventurer"}`
                                      );
                                    }
                                  }}
                                  className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-white/15 flex items-center justify-center shrink-0"
                                >
                                  {bp.avatar && bp.avatar.trim() ? (
                                    <img src={bp.avatar} alt={bp.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-5 h-5 text-indigo-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-mono font-bold text-white truncate">
                                      {bp.name}
                                    </span>
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0">
                                      {bp.race || "Human"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] font-mono text-indigo-300 truncate">
                                    {bp.role || "Adventurer"} • {bp.personality || "Stoic Pragmatist"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleExportCharacterBlueprint(bp, e)}
                                  className="p-1.5 rounded-lg bg-black/50 hover:bg-indigo-950 text-zinc-400 hover:text-indigo-300 border border-white/10 transition-colors cursor-pointer"
                                  title="Export Character JSON"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCharacterFromRoster(bp.id, bp.name, e)}
                                  className="p-1.5 rounded-lg bg-black/50 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
                                  title="Remove from Roster"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-zinc-500 bg-black/40 border border-dashed border-white/10 rounded-xl px-3 py-2 text-center">
                        No saved characters yet. Customize your protagonist below and click &ldquo;Save Character&rdquo;!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Portrait & Name Row */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (playerAvatar && playerAvatar.trim()) {
                        handleOpenPlayerFullPortrait(e);
                      }
                    }}
                    title={
                      playerAvatar && playerAvatar.trim()
                        ? "Click to view full character image"
                        : "Upload a character portrait to preview"
                    }
                    className={`group relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/15 flex items-center justify-center shrink-0 transition-all ${
                      playerAvatar && playerAvatar.trim()
                        ? "cursor-pointer hover:border-rose-500/70 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                        : "cursor-default"
                    }`}
                  >
                    {playerAvatar && playerAvatar.trim() ? (
                      <>
                        <img
                          src={playerAvatar}
                          alt="Character Avatar"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <User className="w-8 h-8 text-zinc-600" />
                    )}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-mono text-zinc-300 font-bold">
                        Protagonist Portrait (Visual AI Anchor)
                      </label>
                      {playerAvatar && playerAvatar.trim() && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenPlayerFullPortrait(e)}
                          className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Eye className="w-3 h-3 text-rose-400" />
                          <span>View Full Image</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-600/30 file:text-rose-200 hover:file:bg-rose-600/50 cursor-pointer"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Visual AI scans your portrait to anchor species features, eye color, and attire in generated scenes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-white/5 items-end">
                  <div className="md:col-span-5">
                    <label className="text-xs font-mono text-zinc-300 font-bold block mb-1">
                      Character Name
                    </label>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => setPlayer((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-zinc-300 font-bold">Gender</label>
                      <span className="text-[10px] font-mono text-sky-300">{player.gender || "Male"}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {GENDER_PRESETS.map((g) => {
                        const isSelected =
                          selectedGenderPreset === g.id ||
                          (!selectedGenderPreset && g.id === "male" && (player.gender || "Male") === "Male");
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleSelectGenderPreset(g)}
                            className={`px-1.5 py-1.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-sky-950/40 border-sky-500/80 text-sky-200 font-bold"
                                : "bg-zinc-900/80 border-white/5 text-zinc-400 hover:border-white/20"
                            }`}
                          >
                            <span className="text-xs leading-none">{g.icon}</span>
                            <span className="text-[10px] truncate">{g.shortLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-mono text-zinc-300 font-bold block mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      value={player.age ?? "22"}
                      onChange={(e) =>
                        setPlayer((prev) => {
                          const next = { ...prev, age: e.target.value };
                          playerRef.current = next;
                          return next;
                        })
                      }
                      placeholder="e.g., 19, 22..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
                {selectedGenderPreset === "custom" && (
                  <input
                    type="text"
                    value={player.gender || ""}
                    onChange={(e) => handleCustomGenderChange(e.target.value)}
                    placeholder="Custom gender or pronouns (e.g. Genderfluid, They/Them)..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-zinc-600 font-mono"
                  />
                )}
              </div>

              {/* LINEAGE & ANATOMICAL VISION PROFILE */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <label className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Lineage &amp; Anatomical Physiology</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5 leading-relaxed">
                      Heroines react to non-human anatomy (fangs, wolf ears, draconic scales, abyssal eyes) during close-quarters sensory scenes.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 self-start shrink-0 whitespace-nowrap font-bold">
                    Race: {player.race || "Human"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {RACE_PRESETS.map((p) => {
                    const isSelected = selectedRacePreset === p.id || (!selectedRacePreset && p.id === "human" && player.race === "Human");
                    const displayLabel = (p as any).shortLabel || p.name.split("/")[0].trim();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectRacePreset(p)}
                        className={`px-1.5 py-2 rounded-xl border text-xs font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                          isSelected
                            ? "bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-md ring-1 ring-amber-500/30 font-bold"
                            : "bg-zinc-900/80 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                        }`}
                        title={p.description}
                      >
                        <span className="text-base leading-none">{p.icon}</span>
                        <span className="text-[10px] leading-tight whitespace-nowrap">{displayLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 items-end">
                  <div>
                    <label className="text-xs font-mono text-zinc-400 block mb-1">Lineage / Race Name</label>
                    <input
                      type="text"
                      value={player.race || ""}
                      onChange={(e) => handleCustomRaceChange(e.target.value)}
                      placeholder="e.g. Human, Lycan, Void Chimera..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label className="text-xs font-mono text-zinc-400 truncate">Anatomical Traits</label>
                      <span className="text-[10px] text-zinc-500 font-mono">Comma-separated</span>
                    </div>
                    <input
                      type="text"
                      value={racialTraitsInput}
                      onChange={(e) => handleRacialTraitsChange(e.target.value)}
                      placeholder="e.g. sharp canine fangs, silver eyes..."
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* CHARACTER DEMEANOR & CRAFTED PERSONA */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <label className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>Character Demeanor &amp; Persona</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5 leading-relaxed">
                      Shapes your protagonist&apos;s dialogue voice, inner monologue, and how the 4 tactical action choices are phrased each turn.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 self-start shrink-0 whitespace-nowrap font-bold">
                    Persona: {player.personality || "Stoic Pragmatist"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {PERSONALITY_PRESETS.map((p) => {
                    const isSelected = selectedPersonalityPreset === p.id || (!selectedPersonalityPreset && p.id === "stoic" && player.personality === "Stoic Pragmatist");
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPersonalityPreset(p)}
                        className={`px-1.5 py-2 rounded-xl border text-xs font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                          isSelected
                            ? "bg-rose-950/40 border-rose-500/80 text-rose-200 shadow-md ring-1 ring-rose-500/30 font-bold"
                            : "bg-zinc-900/80 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                        }`}
                        title={p.description}
                      >
                        <span className="text-base leading-none">{p.icon}</span>
                        <span className="text-[10px] leading-tight whitespace-nowrap">{p.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 items-end">
                  <div>
                    <label className="text-xs font-mono text-zinc-400 block mb-1">Core Demeanor</label>
                    <input
                      type="text"
                      value={player.personality || ""}
                      onChange={(e) => handleCustomPersonalityChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-zinc-400 block mb-1">Roleplay Traits</label>
                    <input
                      type="text"
                      value={personalityTraitsInput}
                      onChange={(e) => handlePersonalityTraitsChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-rose-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Step 1 Footer Navigation */}
              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setCreationTab("origin");
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-mono font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>
                    Next:{" "}
                    {currentStory.id === "sovereign-spire"
                      ? "Matriculation Origin & Standing"
                      : currentStory.id === "port-solaris"
                      ? "Proprietor Background & Lease Stakes"
                      : currentStory.id === "starfall-labyrinth"
                      ? "Summoned Origin & Master Account"
                      : "World Origin"}{" "}
                    →
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 2: MATRICULATION ORIGIN & BLOOD-LEDGER STANDING
             ========================================================= */}
          {creationTab === "origin" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <label className="text-sm font-mono text-emerald-300 font-bold flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {currentStory.id === "sovereign-spire"
                          ? "Matriculation Origin & Blood-Ledger Standing"
                          : currentStory.id === "port-solaris"
                          ? "Proprietor Background & The Stray Anchor Lease Stakes"
                          : currentStory.id === "starfall-labyrinth"
                          ? "Summoned Origin & Master Account Standing"
                          : "World Origin & System Familiarity"}
                      </span>
                    </label>
                    <p className="text-xs text-zinc-400 font-sans mt-1 leading-relaxed">
                      {currentStory.id === "sovereign-spire"
                        ? "Select how you were enrolled into the Sovereign Spire. Each origin shapes your starting Matriculation Rank (#500–#1), semester Aether Core debt quota, faculty scrutiny, and which Heroines naturally trust or test you in Act I."
                        : currentStory.id === "port-solaris"
                        ? "Select how you inherited the deed and debt to The Stray Anchor in Driftwood Cove. Each background shapes your starting Solar Crowns, weekly rent quota, island reputation, and which Heroines naturally gravitate toward your boarding house."
                        : currentStory.id === "starfall-labyrinth"
                        ? "Select how your consciousness was pulled into Celestia Summons as a 1★ Lv.1 hero. Shapes your starting Star Shards (for Main Lobby summons), Unseen Master trust, meta-knowledge floor ceiling, and opening squad synergy."
                        : "Choose how you entered this world and how deeply you understand the System and its factions."}
                    </p>
                  </div>
                  {hasCustomWorldPresets(currentStory.id) && (
                    <div className="flex items-center gap-1.5 self-start shrink-0">
                      <span className="text-xs font-mono px-3 py-1 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 whitespace-nowrap font-bold">
                        {currentStory.id === "port-solaris"
                          ? `0★ Probation • ${player.semesterDebtQuota || 1200} Crowns Rent`
                          : currentStory.id === "starfall-labyrinth"
                          ? `1★ Cap Lv.20 • 💠 ${player.labyrinthState?.starShards ?? 60} Shards`
                          : `Rank #${player.matriculationRank || 488} • ${player.semesterDebtQuota || 400} Core Quota`}
                      </span>
                    </div>
                  )}
                </div>

                {(() => {
                  const worldPreset = getWorldPresets(currentStory.id);
                  if (!worldPreset) {
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                        {WORLD_ORIGIN_PRESETS.map((o) => {
                          const isSelected =
                            selectedWorldOriginPreset === o.id ||
                            (!selectedWorldOriginPreset && o.id === "native");
                          return (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => handleSelectWorldOriginPreset(o)}
                              className={`px-2 py-2 rounded-xl border text-xs font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center ${
                                isSelected
                                  ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-200 shadow-md ring-1 ring-emerald-500/30 font-bold"
                                  : "bg-zinc-900/80 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                              }`}
                              title={o.description}
                            >
                              <span className="text-base leading-none">{o.icon}</span>
                              <span className="text-[10px] leading-tight whitespace-nowrap">{o.shortLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  }

                  const originPool = worldPreset.origins;
                  const activeOrigin =
                    originPool.find(
                      (so) =>
                        so.id === selectedWorldOriginPreset ||
                        so.id === player.sovereignOrigin
                    ) || originPool[0];

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {originPool.map((so) => {
                          const isSelected =
                            selectedWorldOriginPreset === so.id ||
                            player.sovereignOrigin === so.id;
                          return (
                            <button
                              key={so.id}
                              type="button"
                              onClick={() => handleSelectSovereignOriginPreset(so)}
                              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                                isSelected
                                  ? "bg-emerald-950/50 border-emerald-400 text-white shadow-xl ring-1 ring-emerald-400/40"
                                  : "bg-zinc-900/85 border-white/10 text-zinc-300 hover:border-emerald-500/40"
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="space-y-1.5">
                                  <span className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-1.5 leading-snug">
                                    <span className="text-base shrink-0">{so.icon}</span>
                                    <span>{so.shortLabel}</span>
                                  </span>
                                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/70 border border-rose-500/40 text-rose-300 font-bold">
                                    {so.rankTierLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-300 leading-relaxed">
                                  {so.actOneStakes}
                                </p>
                              </div>
                              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 pt-2.5 border-t border-white/10">
                                <span>
                                  {currentStory.id === "port-solaris"
                                    ? `Rent: ${so.semesterDebtQuota} Crowns`
                                    : currentStory.id === "starfall-labyrinth"
                                    ? `Memory: F1–F${(so as StarfallOriginPreset).metaKnowledgeCeiling ?? 40}`
                                    : `Quota: ${so.semesterDebtQuota} Cores`}
                                </span>
                                <span className="text-amber-300 font-bold">
                                  {so.startingCrowns} {worldPreset.uiLabels.originFundsSuffix}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Detailed Impact Breakdown Card for Selected Origin */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/35 via-zinc-950/95 to-rose-950/25 border border-emerald-500/35 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{activeOrigin.icon}</span>
                            <div>
                              <h3 className="text-xs sm:text-sm font-mono font-bold text-white">
                                How &ldquo;{activeOrigin.shortLabel}&rdquo; Shapes Your Opening Scenario
                              </h3>
                              <p className="text-[11px] font-mono text-emerald-300">
                                {worldPreset.uiLabels.originImpactSubtitle(activeOrigin)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                          {activeOrigin.defaultDetails}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="p-3.5 rounded-xl bg-black/50 border border-rose-500/25 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                              Act I Political &amp; Rival Pressure
                            </span>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                              {activeOrigin.actOneStakes}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/25 space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                              High-Resonance Heroines
                            </span>
                            <div className="flex flex-col gap-1.5">
                              {activeOrigin.highResonanceHeroines.map((hName) => {
                                const hDossier =
                                  SOVEREIGN_HEROINE_DOSSIERS[hName] ||
                                  PORT_SOLARIS_HEROINE_DOSSIERS[hName] ||
                                  STARFALL_HEROINE_DOSSIERS[hName];
                                return (
                                  <div
                                    key={hName}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-between gap-2"
                                  >
                                    <span className="text-[11px] font-mono text-emerald-200 font-bold shrink-0">
                                      ★ {hName}
                                    </span>
                                    {hDossier && (
                                      <span className="text-[10px] font-mono text-emerald-300/80 truncate">
                                        {hDossier.epithet}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-sans">
                              Highlighted with an &ldquo;Origin Resonance&rdquo; badge on the Act I Prelude tab.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Editable Origin Backstory & Custom Overrides */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-white/10 items-start">
                  <div className="md:col-span-4">
                    <label className="text-xs font-mono text-zinc-400 block mb-1">
                      Origin Title (Editable)
                    </label>
                    <input
                      type="text"
                      value={player.worldOrigin || ""}
                      onChange={(e) => handleCustomWorldOriginChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-8">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label className="text-xs font-mono text-zinc-400">
                        Origin Backstory &amp; Narrative Directive
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">Injected into AI Prologue</span>
                    </div>
                    <textarea
                      rows={3}
                      value={player.worldOriginDetails || ""}
                      onChange={(e) =>
                        setPlayer((prev) => {
                          const next = { ...prev, worldOriginDetails: e.target.value };
                          playerRef.current = next;
                          return next;
                        })
                      }
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none font-sans leading-relaxed resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 Footer Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setCreationTab("identity");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-mono cursor-pointer transition-all"
                >
                  ← Back: Identity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setCreationTab("conduit");
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white text-xs font-mono font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>
                    Next:{" "}
                    {currentStory.id === "sovereign-spire"
                      ? "Conduit, Wing & Relic Loadout"
                      : currentStory.id === "port-solaris"
                      ? "Flair Conduit, Faction & Keepsakes"
                      : currentStory.id === "starfall-labyrinth"
                      ? "1★ Squad Role & Deployment Kit"
                      : "Class & Arsenal"}{" "}
                    →
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 3: DUAL-CONDUIT, PATRON WING & STARTING ARSENAL
             ========================================================= */}
          {creationTab === "conduit" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {(() => {
                const worldPreset = getWorldPresets(currentStory.id);
                if (!worldPreset) return null;
                return (
                  <div className="bg-gradient-to-br from-amber-950/35 via-zinc-950/90 to-indigo-950/35 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-sm font-mono text-amber-300 font-bold flex items-center gap-2">
                          <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            {currentStory.id === "port-solaris"
                              ? "Showdown Flair Conduit & Island Faction"
                              : currentStory.id === "starfall-labyrinth"
                              ? "1★ Squad Combat Role & Labyrinth Faction"
                              : "Dual-Conduit & Patron Wing Doctrine"}
                          </span>
                        </label>
                        <p className="text-xs text-zinc-400 font-sans mt-0.5 leading-relaxed">
                          {worldPreset.uiLabels.conduitSectionDescription}
                        </p>
                      </div>
                      <span className="text-xs font-mono px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-200 font-bold self-start shrink-0">
                        {(player.conduit || "SOMATIC").replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {worldPreset.conduits.map((preset) => {
                        const isSelected = selectedSovereignConduit === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectSovereignConduitPreset(preset)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                              isSelected
                                ? "bg-amber-950/50 border-amber-400 text-white shadow-xl ring-1 ring-amber-400/35"
                                : "bg-zinc-900/85 border-white/10 text-zinc-300 hover:border-amber-500/40"
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                  <span className="text-base">{preset.icon}</span>
                                  <span>{preset.shortLabel}</span>
                                </span>
                                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-black/70 border border-amber-500/35 text-amber-300 shrink-0">
                                  {preset.conduit.replace(/_/g, " ")} • {preset.wingLabel.replace("The ", "")}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-300 leading-relaxed">
                                {preset.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/10">
                              <span className="text-amber-300 truncate">
                                {worldPreset.uiLabels.relicOrKeepsakeLabel}: {preset.canonLoadout.relic}
                              </span>
                              <span className="text-sky-300 font-bold shrink-0 ml-2">
                                {preset.statSpread.str}/{preset.statSpread.dex}/{preset.statSpread.int}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Custom Class Title Override */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4">
                <label className="text-xs font-mono text-zinc-300 font-bold block mb-1">
                  {hasCustomWorldPresets(currentStory.id)
                    ? "Active Specialty / Conduit Title (Editable)"
                    : "Custom Class / Archetype"}
                </label>
                <input
                  type="text"
                  placeholder={
                    getWorldPresets(currentStory.id)?.uiLabels.rolePlaceholder ||
                    "e.g., Regressed Spellblade..."
                  }
                  value={player.role}
                  onChange={(e) => setPlayer((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              {/* Attribute Allocation */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-xs font-mono text-zinc-300 font-bold">
                    {getWorldPresets(currentStory.id)?.uiLabels.attributeAllocationLabel ||
                      "Attribute Allocation"}
                  </label>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    Unspent Points: {statPoints}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {(["str", "dex", "int"] as const).map((stat) => {
                    const customDef = currentStory.rpgRules?.statDefinitions?.[stat];
                    const shortTitle = customDef
                      ? customDef.split("(")[0].trim()
                      : stat === "str"
                      ? "Strength"
                      : stat === "dex"
                      ? "Dexterity"
                      : "Intelligence";
                    return (
                      <div
                        key={stat}
                        title={customDef || shortTitle}
                        className="flex items-center justify-between gap-2 bg-zinc-900/90 rounded-xl px-3 py-2.5 border border-white/5 min-w-0"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-mono font-bold text-zinc-200 uppercase leading-tight">
                            {stat}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono truncate leading-tight">
                            {shortTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStatChange(stat, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold cursor-pointer text-sm shrink-0"
                          >
                            -
                          </button>
                          <span className="text-sm font-bold text-white w-6 text-center font-mono">
                            {player.stats[stat]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStatChange(stat, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-white font-bold cursor-pointer text-sm shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Starting Loadout & Whisper Flaw Preview */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <label className="text-xs font-mono text-zinc-300 font-bold block">
                  {getWorldPresets(currentStory.id)?.uiLabels.loadoutSectionLabel ||
                    "Starting Armament & Relic Loadout"}
                </label>
                <div className={`grid grid-cols-1 ${hasCustomWorldPresets(currentStory.id) ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}>
                  {hasCustomWorldPresets(currentStory.id) && (
                    <button
                      type="button"
                      onClick={() => setGearPreference("canon")}
                      className={`py-2.5 px-3 text-xs font-mono rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        gearPreference === "canon"
                          ? "bg-indigo-900/50 border-indigo-400 text-indigo-100 shadow-md ring-1 ring-indigo-400/30 font-bold"
                          : "bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/30"
                      }`}
                    >
                      <Swords className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        {getWorldPresets(currentStory.id)?.uiLabels.canonLoadoutButtonLabel || "Canon Wing Loadout"}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setGearPreference("system")}
                    className={`py-2.5 px-3 text-xs font-mono rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      gearPreference === "system"
                        ? "bg-rose-900/40 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/30 font-bold"
                        : "bg-zinc-900 border-white/10 text-zinc-500 hover:border-white/30"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>System Choice (3 Cards)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGearPreference("none")}
                    className={`py-2.5 px-3 text-xs font-mono rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      gearPreference === "none"
                        ? "bg-amber-900/40 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/30 font-bold"
                        : "bg-zinc-900 border-white/10 text-zinc-500 hover:border-white/30"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unarmed &amp; Unarmored</span>
                  </button>
                </div>

                {(() => {
                  const worldPreset = getWorldPresets(currentStory.id);
                  if (!worldPreset || gearPreference !== "canon") return null;
                  const conduitPool = worldPreset.conduits;
                  const activeConduit =
                    conduitPool.find((c) => c.id === selectedSovereignConduit) ||
                    conduitPool[0];
                  return (
                    <div className="p-3.5 rounded-xl bg-indigo-950/35 border border-indigo-500/35 text-xs font-mono space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-indigo-200">
                        <span className="font-bold">
                          ⚔️ {activeConduit.canonLoadout.weapon}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-200 font-bold">
                          Slot [{activeConduit.canonLoadout.relicSlot}] • Set: {activeConduit.canonLoadout.setId}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 font-sans">
                        <span className="text-indigo-300 font-mono font-bold">Attire:</span> {activeConduit.canonLoadout.armor} • <span className="text-purple-300 font-mono font-bold">{worldPreset.uiLabels.relicOrKeepsakeLabel}:</span> {activeConduit.canonLoadout.relic}
                      </p>
                      <p className="text-[11px] text-zinc-300 font-sans pt-1 border-t border-white/10">
                        <span className="text-rose-400 font-mono font-bold">
                          {worldPreset.uiLabels.flawLabel}
                        </span>{" "}
                        {activeConduit.canonLoadout.whisperFlaw}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Starting Abilities */}
              <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Starting Conduit Techniques
                    </label>
                    <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                      Click any technique to inspect its cost and cooldown, or roll bespoke AI abilities for <span className="text-zinc-300 font-mono">{player.role || "your class"}</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {player.abilities.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAbilities}
                        className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isRollingAbilities}
                      onClick={handleRollAbilities}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600/80 to-rose-600/80 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Dices className={`w-3.5 h-3.5 ${isRollingAbilities ? "animate-spin" : ""}`} />
                      <span>{isRollingAbilities ? "Synthesizing..." : "Roll Custom Abilities"}</span>
                    </button>
                  </div>
                </div>

                {player.abilities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {player.abilities.map((abName, i) => {
                      const detail = player.abilityDetails?.[abName];
                      return (
                        <div
                          key={i}
                          onClick={() => handleInspectAbility(abName)}
                          className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-amber-500/30 hover:border-amber-400/60 p-3.5 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col gap-1.5"
                          title="Click to inspect full ability modal"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{abName}</span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono text-sky-400 bg-sky-950/50 border border-sky-500/25 px-2 py-0.5 rounded">
                                {detail?.cost || "Cost: 10 MP"}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-300 bg-black/50 border border-white/10 px-2 py-0.5 rounded">
                                {detail?.cooldown || "Instant"}
                              </span>
                              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                                {detail?.type || "Active"}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {detail?.description || "Click to inspect full ability mechanics..."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2.5 px-3 border border-dashed border-white/10 rounded-xl bg-zinc-950/40">
                    <p className="text-xs text-zinc-500 font-sans italic">
                      Select a Conduit Doctrine above or click &ldquo;Roll Custom Abilities&rdquo; to generate techniques.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3 Footer Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setCreationTab("origin");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-mono cursor-pointer transition-all"
                >
                  ← Back: Origin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setCreationTab("prologue");
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-mono font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Next: Choose Act I Prelude &amp; Dyad Partner →</span>
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              TAB 4: ACT I PRELUDE, DYAD PARTNER & LAUNCH
             ========================================================= */}
          {creationTab === "prologue" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Live Build Impact Banner: How Your Choices Shape the Opening Scene */}
              {(() => {
                const worldPreset = getWorldPresets(currentStory.id);
                if (!worldPreset) return null;
                const originPool = worldPreset.origins;
                const conduitPool = worldPreset.conduits;
                const activeOrigin =
                  originPool.find(
                    (so) =>
                      so.id === selectedWorldOriginPreset ||
                      so.id === player.sovereignOrigin
                  ) || originPool[0];
                const activeConduit =
                  conduitPool.find((c) => c.id === selectedSovereignConduit) ||
                  conduitPool[0];
                const activeNode = prologues[selectedPrologue] || prologues[0];
                const activeDossier = activeNode
                  ? worldPreset.heroineDossiers[activeNode.speaker]
                  : undefined;
                const isResonant = Boolean(
                  activeNode &&
                    (activeNode.id === "prologue_act1_seal_gate" ||
                      activeNode.id === "prologue_act1_article9_wager" ||
                      activeNode.id === "prologue_starfall_synthesis_bench" ||
                      activeOrigin.highResonanceHeroines.includes(activeNode.speaker))
                );

                return (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-950/95 to-indigo-950/40 border border-rose-500/35 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>How Your Choices Shape This Opening Scenario</span>
                      </span>
                      {isResonant && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-bold">
                          ★ High Origin Synergy Active
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                        <span className="text-[10px] font-mono text-emerald-400 block font-bold">
                          {activeOrigin.icon} {activeOrigin.shortLabel} ({activeOrigin.rankTierLabel})
                        </span>
                        <p className="text-zinc-300 mt-0.5 leading-snug">
                          {activeOrigin.actOneStakes}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                        <span className="text-[10px] font-mono text-amber-300 block font-bold">
                          {activeConduit.icon} {activeConduit.shortLabel} ({activeConduit.conduit.replace(/_/g, " ")})
                        </span>
                        <p className="text-zinc-300 mt-0.5 leading-snug">
                          Aligned with {activeConduit.wingLabel}. Carrying {activeConduit.canonLoadout.relic} ([{activeConduit.canonLoadout.relicSlot}]).
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
                        <span className="text-[10px] font-mono text-rose-300 block font-bold">
                          🤝 {worldPreset.uiLabels.partnerTargetLabel} {activeNode?.speaker}
                        </span>
                        <p className="text-zinc-300 mt-0.5 leading-snug">
                          {activeDossier
                            ? `${activeDossier.actOneConflict}`
                            : "Cold-open confrontation before the seasonal trials begin."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Scenario Cards Grid */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>
                        {currentStory.id === "sovereign-spire"
                          ? "Act I Introduction Scenario & Dyad Partner"
                          : currentStory.id === "port-solaris"
                          ? "Act I Opening Scenario & Boarding House Heroine"
                          : currentStory.id === "starfall-labyrinth"
                          ? "Act I Star Gate Arrival & Starting Squadmate"
                          : "Select Starting Scenario & Companion"}
                      </span>
                    </label>
                    {hasCustomWorldPresets(currentStory.id) && (
                      <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                        Select a scenario below to read its full prelude setup, partner passive, and your 4 opening tactical choices.
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 self-start shrink-0 font-bold">
                    {prologues.length} Scenarios Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1.5">
                  {prologues.map((p, i) => {
                    const isSelected = selectedPrologue === i;
                    const sfDossier =
                      currentStory.id === "starfall-labyrinth"
                        ? STARFALL_HEROINE_DOSSIERS[p.speaker]
                        : undefined;
                    const dossier =
                      currentStory.id === "port-solaris"
                        ? PORT_SOLARIS_HEROINE_DOSSIERS[p.speaker]
                        : currentStory.id === "sovereign-spire"
                        ? SOVEREIGN_HEROINE_DOSSIERS[p.speaker]
                        : undefined;
                    const isColdOpen =
                      p.id === "prologue_act1_seal_gate" ||
                      p.id === "prologue_act1_article9_wager" ||
                      p.id === "prologue_starfall_synthesis_bench";
                    const isEntranceCeremony =
                      p.id === "prologue_entrance_ceremony" ||
                      p.id === "prologue_solaris_grand_audit";
                    const ensembleHeroines =
                      Array.isArray(p.presentCompanions) && p.presentCompanions.length > 1
                        ? p.presentCompanions
                        : null;
                    const activeWorldPreset = getWorldPresets(currentStory.id);
                    const originPool = activeWorldPreset ? activeWorldPreset.origins : SOVEREIGN_ORIGIN_PRESETS;
                    const activeOriginPreset = activeWorldPreset
                      ? originPool.find(
                          (so) =>
                            so.id === selectedWorldOriginPreset ||
                            so.id === player.sovereignOrigin
                        )
                      : undefined;
                    const isOriginResonant = Boolean(
                      activeOriginPreset &&
                        (isColdOpen ||
                          isEntranceCeremony ||
                          activeOriginPreset.highResonanceHeroines.includes(p.speaker))
                    );
                    const spriteUrl = getSpriteSrc(
                      p.speaker,
                      (p as any).expressionKey || "neutral"
                    );

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setSelectedPrologue(i);
                        }}
                        className={`p-3.5 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? "bg-rose-950/45 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/35"
                            : "bg-zinc-950/90 border-white/10 text-zinc-400 hover:border-white/25"
                        } ${
                          isColdOpen || isEntranceCeremony
                            ? "sm:col-span-2 bg-gradient-to-r from-rose-950/50 via-zinc-950/95 to-amber-950/40"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {ensembleHeroines ? (
                            <div className="flex items-center -space-x-2.5 shrink-0 pt-0.5">
                              {ensembleHeroines.slice(0, 4).map((hName) => (
                                <img
                                  key={hName}
                                  src={getSpriteSrc(hName, "neutral")}
                                  alt={hName}
                                  title={hName}
                                  className="w-10 h-12 rounded-xl object-cover object-top bg-zinc-900 border-2 border-zinc-950 ring-1 ring-amber-400/40 shadow-md"
                                />
                              ))}
                              {ensembleHeroines.length > 4 && (
                                <div className="w-8 h-12 rounded-xl bg-amber-950/90 border border-amber-400/50 flex items-center justify-center text-[10px] font-mono font-bold text-amber-200 shadow-md">
                                  +{ensembleHeroines.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/15 shrink-0">
                              <img
                                src={spriteUrl}
                                alt={p.speaker}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5 flex-wrap mb-0.5">
                              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider truncate">
                                {p.location}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {isEntranceCeremony && (
                                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/60 text-amber-200">
                                    ★ Grand Convocation • {ensembleHeroines?.length || 6} Heroines Present
                                  </span>
                                )}
                                {isColdOpen && (
                                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200">
                                    ★ Flagship Act I Cold-Open
                                  </span>
                                )}
                                {isOriginResonant && !isColdOpen && !isEntranceCeremony && (
                                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                                    Origin Resonance
                                  </span>
                                )}
                                {(sfDossier || dossier) && !isEntranceCeremony && (
                                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/35 text-indigo-200">
                                    {sfDossier
                                      ? `${sfDossier.baseStarRank}★ ${sfDossier.combatRole.split("&")[0].trim()}`
                                      : dossier!.conduit.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-sm text-zinc-100 leading-snug">
                              {p.title}
                            </p>
                            {ensembleHeroines ? (
                              <p className="text-[10px] font-mono text-amber-300/95 mt-0.5">
                                Present Heroines: {ensembleHeroines.join(" • ")}
                              </p>
                            ) : sfDossier ? (
                              <p className="text-[10px] font-mono text-amber-300/90 mt-0.5 truncate">
                                {sfDossier.epithet} • {sfDossier.combatRole} • Passive: {sfDossier.dyadPassiveName}
                              </p>
                            ) : (
                              dossier && (
                                <p className="text-[10px] font-mono text-amber-300/90 mt-0.5 truncate">
                                  {dossier.epithet} • {dossier.wing.replace(/_/g, " ")} • Passive: {dossier.dyadPassiveName}
                                </p>
                              )
                            )}
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {p.dialogue}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-white/5">
                          <span className="truncate">
                            {ensembleHeroines
                              ? currentStory.id === "port-solaris"
                                ? "All 4 Island Factions Present • 30-Day Star Audit & Roommate Stampede"
                                : "All 4 Patron Wings Present • High Sovereign Vane & Proctor Sallow Presiding"
                              : sfDossier
                              ? `Hook: ${sfDossier.actOneConflict}`
                              : dossier
                              ? `Hook: ${dossier.rivalBossTieIn}`
                              : `Companion: ${p.speaker}`}
                          </span>
                          <span className="text-rose-300/90 shrink-0 ml-2">
                            {p.choices.length} Entry Vectors
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Act I Scenario & Full Unclamped Entry Vectors Preview Drawer */}
                {prologues[selectedPrologue] && (() => {
                  const activeNode = prologues[selectedPrologue];
                  const activeDossier =
                    SOVEREIGN_HEROINE_DOSSIERS[activeNode.speaker] ||
                    PORT_SOLARIS_HEROINE_DOSSIERS[activeNode.speaker] ||
                    STARFALL_HEROINE_DOSSIERS[activeNode.speaker];
                  return (
                    <div className="p-4 rounded-2xl bg-zinc-950/95 border border-rose-500/35 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div>
                          <span className="text-xs sm:text-sm font-mono font-bold text-white block">
                            Selected Prelude: {activeNode.title}
                          </span>
                          <span className="text-[11px] font-mono text-rose-300">
                            Location: {activeNode.location} •{" "}
                            {Array.isArray(activeNode.presentCompanions) &&
                            activeNode.presentCompanions.length > 1
                              ? `Present Heroines: ${activeNode.presentCompanions.join(", ")}`
                              : `Speaker: ${activeNode.speaker}`}
                          </span>
                        </div>
                        {activeDossier && (
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 font-bold">
                            Partner Passive: {activeDossier.dyadPassiveName} — {activeDossier.dyadPassiveDescription}
                          </span>
                        )}
                      </div>
                      {activeNode.sceneSetup && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                            Opening Scene Setup
                          </span>
                          <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                            {activeNode.sceneSetup}
                          </p>
                        </div>
                      )}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                          Opening Tactical Entry Vectors (Available on Turn 1)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {activeNode.choices.map((ch, cIdx) => (
                            <div
                              key={cIdx}
                              className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-[11px] font-mono text-zinc-200 leading-snug"
                            >
                              <span className="text-rose-400 font-bold mr-1.5">#{cIdx + 1}</span>
                              {ch}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Compact Narration Tone & AI Model Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-zinc-950/80 border border-white/10 rounded-xl p-3">
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">
                    Narration Atmosphere &amp; Tone
                  </label>
                  <select
                    value={narrationStyle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNarrationStyle(val);
                      setPlayer((prev) => ({ ...prev, narrationStyle: val }));
                    }}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
                  >
                    <option>Tactical Dungeon Survival (Tense, strategic, grounded human grit)</option>
                    <option>Sun-Drenched Coastal Rom-Com (Sparkling banter, sensory warmth, romantic tension)</option>
                    <option>Grimdark & Atmospheric (Tense, visceral, sensory)</option>
                    <option>Light Novel High Fantasy (Dynamic pacing, witty banter, heroic)</option>
                    <option>Noir Arcana (Brooding, cynical, sharp monologues)</option>
                  </select>
                </div>

                <div className="bg-zinc-950/80 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      AI Roleplay Engine
                    </span>
                    <span className="text-xs font-mono font-bold text-white truncate block mt-0.5">
                      {CLOUD_MODELS.find((m) => m.id === llmConfig.modelId)?.shortName || llmConfig.modelId.split("/").pop()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowLlmModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/15 hover:border-rose-500/40 text-xs font-mono text-zinc-200 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Model</span>
                  </button>
                </div>
              </div>

              {/* Step 4 Launch Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setCreationTab("conduit");
                  }}
                  className="px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-mono cursor-pointer transition-all shrink-0"
                >
                  ← Back: Conduit &amp; Gear
                </button>

                <div className="flex-1">
                  {gearPreference === "canon" &&
                  hasCustomWorldPresets(currentStory.id) ? (
                    <button
                      onClick={handleStartWithCanonWingLoadout}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-rose-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-mono text-xs sm:text-sm"
                    >
                      <Swords className="w-4 h-4" />{" "}
                      {currentStory.id === "port-solaris"
                        ? "Open The Stray Anchor (Equip Canon Faction Loadout) →"
                        : currentStory.id === "starfall-labyrinth"
                        ? "Materialize at Star Gate Plaza (Equip 1★ Squad Kit) →"
                        : "Enter The Sovereign Spire (Equip Canon Wing Loadout) →"}
                    </button>
                  ) : gearPreference === "system" ? (
                    <button
                      onClick={handleProceedToGear}
                      className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-mono text-xs sm:text-sm"
                    >
                      <Sparkles className="w-4 h-4 fill-white" /> Next: Manifest System Gear (3 Cards) →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartGame()}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-mono text-xs sm:text-sm"
                    >
                      <Play className="w-4 h-4 fill-white" /> Enter {currentStory.worldContext?.settingName || currentStory.title || "Astra Continent"} (Unarmed)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {renderSaveModal()}
        {renderAuthModal()}
        {renderTransitionOverlay()}
        {renderAbilityModal()}
        {renderCharacterPortraitViewerModal()}
        <WorldGuidebookModal
          isOpen={showWorldGuidebook}
          onClose={() => setShowWorldGuidebook(false)}
          story={currentStory}
          labyrinthState={player.labyrinthState}
        />
        <ScreenTransitionOverlay {...screenTransition} />
        <LlmProviderModal
          isOpen={showLlmModal}
          onClose={() => setShowLlmModal(false)}
          config={llmConfig}
          onChange={(newConfig: LlmConfig) => {
            setLlmConfig(newConfig);
            saveStoredLlmConfig(newConfig);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`relative h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-screen overflow-hidden bg-zinc-950 font-sans transition-all duration-300 ease-out ${
      pageLoaded && !screenTransition.isOpen ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
    }`}>
      
      <div 
        key={gameState.bgImage}
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out brightness-75 contrast-105 pointer-events-none select-none"
        style={{ backgroundImage: `url("${gameState.bgImage}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />
      <div className="absolute inset-0 cinematic-vignette pointer-events-none z-10" />
      <AtmosphericParticles location={gameState.location} />

      {/* FULL-SCREEN STORY DAMAGE / VITALS IMPACT FEEDBACK OVERLAY */}
      {vitalsFeedback && (
        <div
          key={vitalsFeedback.id}
          className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center pt-16 sm:pt-20 overflow-hidden"
        >
          {vitalsFeedback.hpDelta < 0 && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background:
                  "radial-gradient(circle at center, transparent 45%, rgba(220, 38, 38, 0.42) 100%)",
                boxShadow: "inset 0 0 90px rgba(239, 68, 68, 0.65)",
              }}
            />
          )}
          {vitalsFeedback.hpDelta > 0 && (
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background:
                  "radial-gradient(circle at center, transparent 55%, rgba(16, 185, 129, 0.25) 100%)",
              }}
            />
          )}
          <div
            className={`relative px-4 py-1.5 rounded-2xl border backdrop-blur-xl font-mono text-xs font-black tracking-wider shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200 ${
              vitalsFeedback.hpDelta < 0
                ? "bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                : vitalsFeedback.hpDelta > 0
                ? "bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                : "bg-sky-950/95 border-sky-400 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.4)]"
            }`}
          >
            {vitalsFeedback.hpDelta !== 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current" />
                {vitalsFeedback.hpDelta > 0 ? `+${vitalsFeedback.hpDelta}` : vitalsFeedback.hpDelta} HP
              </span>
            )}
            {vitalsFeedback.mpDelta !== 0 && (
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-2.5 fill-current" />
                {vitalsFeedback.mpDelta > 0 ? `+${vitalsFeedback.mpDelta}` : vitalsFeedback.mpDelta} MP
              </span>
            )}
            <span className="text-[10px] font-normal opacity-85">
              • {vitalsFeedback.reason}
            </span>
          </div>
        </div>
      )}

      <GameNotificationStack
        notifications={notifications}
        onDismiss={dismissNotification}
        onOpenSystemWindow={() => setShowSystemModal(true)}
        onInspectItem={(item) => handleInspectItem(item)}
        onOpenHistory={() => {
          soundEffects.playClick();
          setShowNotificationHistory(true);
          setUnreadNotificationCount(0);
        }}
      />

      {/* TOP HUD */}
      <header className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-6 md:inset-x-8 z-40 pointer-events-auto select-none">
        {/* MOBILE TOP HUD (< sm) */}
        <div className="flex sm:hidden items-center justify-between gap-1.5 w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Back Button */}
            <button
              onClick={handleNavigateToCatalogue}
              className="w-9 h-9 rounded-xl bg-black/85 hover:bg-black/95 backdrop-blur-md border border-white/10 hover:border-white/30 flex items-center justify-center text-zinc-300 shadow-lg cursor-pointer shrink-0 active:scale-95"
              title="Return to Story Catalogue"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Compact Mobile Player Pill */}
            <button
              onClick={() => setShowPlayerSheet(true)}
              className={`relative h-9 px-2 rounded-xl bg-black/85 hover:bg-black/95 backdrop-blur-md border shadow-lg flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                vitalsFeedback && vitalsFeedback.hpDelta < 0
                  ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                  : vitalsFeedback && vitalsFeedback.hpDelta > 0
                  ? "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : player.stats.hp <= player.stats.maxHp * 0.35
                  ? "border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                  : "border-white/10 hover:border-rose-500/50"
              }`}
              title="Open Character Sheet"
            >
              {/* Floating Delta Badge */}
              {vitalsFeedback && (
                <div
                  key={`mobile_hud_delta_${vitalsFeedback.id}`}
                  className={`pointer-events-none absolute -bottom-6 left-1 z-30 px-1.5 py-0.5 rounded-md border font-mono text-[9px] font-black shadow-xl animate-bounce ${
                    vitalsFeedback.hpDelta < 0
                      ? "bg-red-950 border-red-400 text-red-200"
                      : vitalsFeedback.hpDelta > 0
                      ? "bg-emerald-950 border-emerald-400 text-emerald-200"
                      : "bg-sky-950 border-sky-400 text-sky-200"
                  }`}
                >
                  {vitalsFeedback.hpDelta !== 0
                    ? `${vitalsFeedback.hpDelta > 0 ? "+" : ""}${vitalsFeedback.hpDelta} HP`
                    : `${vitalsFeedback.mpDelta > 0 ? "+" : ""}${vitalsFeedback.mpDelta} MP`}
                </div>
              )}

              <div
                onClick={(e) => {
                  if (playerAvatar && playerAvatar.trim()) {
                    handleOpenPlayerFullPortrait(e);
                  }
                }}
                title={
                  playerAvatar && playerAvatar.trim()
                    ? "Click to view full character image"
                    : undefined
                }
                className="w-6 h-6 rounded-full overflow-hidden bg-rose-600/30 border border-rose-500/60 flex items-center justify-center font-bold text-[10px] text-rose-300 shrink-0 hover:ring-2 hover:ring-rose-400/70 transition-all"
              >
                {playerAvatar && playerAvatar.trim() ? (
                  <img src={playerAvatar} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  player.name.charAt(0)
                )}
              </div>

              <div className="flex flex-col justify-center gap-0.5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold leading-none">
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5 fill-rose-500" />
                    {player.stats.hp}
                  </span>
                  <span className="text-sky-400 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-sky-500" />
                    {player.stats.mp}
                  </span>
                  {currentStory.id === "port-solaris" && (
                    <span className="text-amber-300 px-1 rounded bg-amber-500/20 border border-amber-500/40 text-[8px]">
                      {player.matriculationRank ?? 0}★
                    </span>
                  )}
                  {currentStory.id === "sovereign-spire" && (
                    <span className="text-amber-300 px-1 rounded bg-amber-500/20 border border-amber-500/40 text-[8px]">
                      #{player.matriculationRank || 488}
                    </span>
                  )}
                </div>
                {/* Mini EXP progress track */}
                <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/10 relative">
                  <div
                    className={`h-full transition-all duration-700 ${
                      expFeedback
                        ? "bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                        : "bg-gradient-to-r from-amber-600 to-yellow-500"
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (player.stats.exp / Math.max(1, player.stats.maxExp)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile Quick Guidebook Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowWorldGuidebook(true);
              }}
              className="w-9 h-9 rounded-xl bg-black/85 hover:bg-black/95 backdrop-blur-md border border-amber-500/35 text-amber-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shrink-0"
              title="Open World Guidebook"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Mobile Quick Party / Housemates Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowPartyDrawer(true);
              }}
              className="w-9 h-9 rounded-xl bg-black/85 hover:bg-black/95 backdrop-blur-md border border-rose-500/35 text-rose-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shrink-0 relative"
              title={currentStory.id === "port-solaris" ? "Open Housemates & Blush Matrix" : "Open Party & Favor"}
            >
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-mono font-bold px-1 rounded-full bg-rose-950 border border-rose-500/50 text-rose-200 leading-tight">
                {party.filter((p) => p.isPresent).length}
              </span>
            </button>

            {/* SYSTEM Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowSystemModal(true);
              }}
              className={`w-9 h-9 rounded-xl bg-black/85 hover:bg-black/95 backdrop-blur-md border flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shrink-0 relative ${
                systemState.activeQuests.length > 0
                  ? "border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                  : "border-white/10 text-zinc-300"
              }`}
              title="Open System Administrator Interface & Quests"
            >
              <Terminal className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              {/* Unclaimed Clearance Beacon */}
              {hasUnclaimedClearance && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5" title="Clearance Ready to Claim">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black shadow-[0_0_8px_#10b981]" />
                </span>
              )}
            </button>

            {/* Mobile Command Menu Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowMobileCommandSheet(true);
              }}
              className="w-9 h-9 rounded-xl bg-black/85 hover:bg-black/95 backdrop-blur-md border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 shadow-lg shrink-0 relative"
              title="Open Mobile Command Dock"
            >
              <LayoutGrid className="w-4 h-4 text-rose-400" />
              {/* Notification / Unclaimed Beacon */}
              {(unreadNotificationCount > 0 || hasUnclaimedClearance) && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-black shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* DESKTOP TOP HUD (>= sm) */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 w-full min-w-0">
          {/* LEFT CLUSTER: Navigation, Player Anchor & LitRPG System */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 max-w-full flex-wrap">
            <button
              onClick={handleNavigateToCatalogue}
              className="flex items-center gap-1.5 bg-black/80 hover:bg-black/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/10 hover:border-white/30 shadow-lg text-xs text-zinc-300 transition-all cursor-pointer shrink-0"
              title="Return to Story Catalogue"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
              <span className="hidden xl:inline font-mono text-[11px]">Catalogue</span>
            </button>

            {/* Character Identity & Status Card with Live Vitals Bars & Hit Feedback */}
            <button
              onClick={() => setShowPlayerSheet(true)}
              className={`relative flex items-center gap-1.5 sm:gap-2 bg-black/85 hover:bg-black/95 backdrop-blur-md p-1 pr-2.5 rounded-2xl border shadow-lg text-xs text-zinc-200 transition-all cursor-pointer group shrink-0 overflow-hidden max-w-[220px] lg:max-w-[250px] xl:max-w-[285px] ${
                vitalsFeedback && vitalsFeedback.hpDelta < 0
                  ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.65)] translate-x-[2px]"
                  : vitalsFeedback && vitalsFeedback.hpDelta > 0
                  ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                  : player.stats.hp <= player.stats.maxHp * 0.35
                  ? "border-red-500/70 shadow-[0_0_16px_rgba(239,68,68,0.3)]"
                  : "border-white/10 hover:border-rose-500/50"
              }`}
              title={`Open Character Sheet & Inventory (${player.name} — Lv.${player.level} ${player.race ? `${player.race} ` : ""}${player.role})`}
            >
              {/* Floating Delta Badge on Top HUD Player Card */}
              {vitalsFeedback && (
                <div
                  key={`hud_delta_${vitalsFeedback.id}`}
                  className={`pointer-events-none absolute -bottom-6 left-2 z-30 px-2 py-0.5 rounded-lg border font-mono text-[10px] font-black shadow-xl animate-bounce ${
                    vitalsFeedback.hpDelta < 0
                      ? "bg-red-950 border-red-400 text-red-200"
                      : vitalsFeedback.hpDelta > 0
                      ? "bg-emerald-950 border-emerald-400 text-emerald-200"
                      : "bg-sky-950 border-sky-400 text-sky-200"
                  }`}
                >
                  {vitalsFeedback.hpDelta !== 0
                    ? `${vitalsFeedback.hpDelta > 0 ? "+" : ""}${vitalsFeedback.hpDelta} HP`
                    : `${vitalsFeedback.mpDelta > 0 ? "+" : ""}${vitalsFeedback.mpDelta} MP`}
                </div>
              )}

              <div
                onClick={(e) => {
                  if (playerAvatar && playerAvatar.trim()) {
                    handleOpenPlayerFullPortrait(e);
                  }
                }}
                title={
                  playerAvatar && playerAvatar.trim()
                    ? "Click to view full character image"
                    : undefined
                }
                className="w-8 h-8 rounded-full overflow-hidden bg-rose-600/30 border border-rose-500/60 flex items-center justify-center font-bold text-rose-300 shrink-0 hover:ring-2 hover:ring-rose-400/70 hover:scale-105 transition-all"
              >
                {playerAvatar && playerAvatar.trim() ? (
                  <img src={playerAvatar} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  player.name.charAt(0)
                )}
              </div>
              <div className="text-left hidden sm:block min-w-[64px] lg:min-w-[82px] max-w-[115px] shrink-0">
                <p className="font-semibold leading-tight text-white group-hover:text-rose-300 transition-colors truncate">
                  {player.name}
                </p>
                <p className="text-[10px] text-zinc-400 font-mono truncate">
                  Lv.{player.level} {player.race ? `${player.race} ` : ""}{player.role}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 pl-1 min-w-[64px] sm:min-w-[74px] shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono leading-none">
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <Heart className="w-2.5 h-2.5 fill-rose-500" />
                      {player.stats.hp}/{player.stats.maxHp}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        player.stats.hp <= player.stats.maxHp * 0.35
                          ? "bg-gradient-to-r from-red-600 to-rose-400 animate-pulse"
                          : "bg-gradient-to-r from-rose-600 to-emerald-400"
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (player.stats.hp / Math.max(1, player.stats.maxHp)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono leading-none">
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      <Zap className="w-2.5 h-2.5 fill-sky-500" />
                      {player.stats.mp}/{player.stats.maxMp}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-300"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (player.stats.mp / Math.max(1, player.stats.maxMp)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono leading-none">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      {player.stats.exp}/{player.stats.maxExp}
                    </span>
                    {expFeedback && (
                      <span
                        className="text-[9px] font-mono font-bold text-amber-300 animate-bounce drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]"
                        title={expFeedback.reason || "Earned Experience"}
                      >
                        +{expFeedback.amount} EXP
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/10 relative">
                    <div
                      className={`h-full transition-all duration-1000 ease-out relative ${
                        expFeedback
                          ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                          : "bg-gradient-to-r from-amber-600 to-yellow-500"
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (player.stats.exp / Math.max(1, player.stats.maxExp)) * 100)
                        )}%`,
                      }}
                    >
                      {expFeedback && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#f59e0b] rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {(player.unspentStatPoints || 0) > 0 && (
                <div className="hidden xl:flex items-center pl-1.5 border-l border-white/10 shrink-0">
                  <span
                    className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[9px] font-mono font-bold animate-pulse"
                    title="Click to allocate unspent Level-Up Attribute Points"
                  >
                    +{player.unspentStatPoints} PTS
                  </span>
                </div>
              )}
            </button>

            {/* SECTOR ENTRY CINEMATIC BANNER */}
            {sectorBanner && (
              <div
                onClick={() => setSectorBanner(null)}
                title="Click to dismiss"
                className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-top-3 duration-500"
              >
                <div className="px-6 py-2.5 rounded-2xl bg-zinc-950/90 hover:bg-zinc-900/95 border border-emerald-500/40 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.25)] text-center transition-colors">
                  <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-emerald-400">
                    ✦ Sector Transition ✦
                  </p>
                  <p className="text-sm sm:text-base font-serif font-bold text-white tracking-wide mt-0.5">
                    {sectorBanner.name}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{sectorBanner.sub}</p>
                </div>
              </div>
            )}

            {/* SYSTEM Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowSystemModal(true);
              }}
              className={`bg-black/80 hover:bg-black/95 backdrop-blur-md px-2 lg:px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 relative shadow-lg shrink-0 ${
                systemState.activeQuests.length > 0
                  ? "border-rose-500/60 text-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.3)] hover:border-rose-400"
                  : "border-white/10 text-zinc-300 hover:border-rose-500/40 hover:text-white"
              }`}
              title="Open System Administrator Interface & Quests"
            >
              <Terminal className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider hidden md:inline">SYSTEM</span>
              {systemState.activeQuests.length > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                  {systemState.activeQuests.length}
                </span>
              )}
              {/* Unclaimed Clearance Notification Beacon */}
              {hasUnclaimedClearance && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3" title="Clearance Ready to Claim">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-black shadow-[0_0_10px_#10b981]" />
                </span>
              )}
            </button>

            {/* STAR GATE SUMMON & IRON BARRACKS BUTTONS (Starfall Labyrinth Only) */}
            {currentStory.id === "starfall-labyrinth" && (() => {
              const inLobby = isStarfallLobbyLocation(gameState.location);
              const shards = player.labyrinthState?.starShards ?? 0;
              const deployedCount = (player.labyrinthState?.roster || []).filter(
                (r) => r.status === "DEPLOYED" || r.status === "WOUNDED"
              ).length;
              return (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowSummonModal(true);
                    }}
                    className={`backdrop-blur-md px-2 lg:px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 relative shadow-lg shrink-0 ${
                      inLobby
                        ? "bg-indigo-950/90 hover:bg-indigo-900/95 border-indigo-400/70 text-indigo-100 shadow-[0_0_18px_rgba(99,102,241,0.35)] hover:border-amber-300"
                        : "bg-black/80 hover:bg-black/95 border-white/15 text-zinc-400 hover:border-white/30"
                    }`}
                    title={
                      inLobby
                        ? `Open Star Gate Summoning Altar (${shards} Star Shards Available)`
                        : "Star Gate Summoning is locked outside Star Gate Plaza (Main Lobby). Click to inspect Banner Codex."
                    }
                  >
                    {inLobby ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                    <span className="text-[11px] font-mono font-bold tracking-wider hidden xl:inline">
                      SUMMON
                    </span>
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full ${
                        inLobby
                          ? "bg-amber-500/25 border border-amber-300/60 text-amber-200"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      💠 {shards}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowBarracksModal(true);
                    }}
                    className="bg-amber-950/85 hover:bg-amber-900/90 backdrop-blur-md px-2 lg:px-2.5 py-1.5 rounded-2xl border border-amber-500/50 hover:border-amber-300 text-amber-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shrink-0"
                    title="Open Iron Barracks — Hero Star Stats, Skill Kits & Frontline/Reserve Formation"
                  >
                    <Shield className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-[11px] font-mono font-bold tracking-wider hidden xl:inline">
                      BARRACKS
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-200">
                      {deployedCount}/{MAX_DEPLOYED_PARTY}
                    </span>
                  </button>
                </>
              );
            })()}
          </div>

          {/* RIGHT CLUSTER: Auto-Save Pulse, LLM Engine Pill & Unified Glass Command Dock */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <LlmQuickPill
              config={llmConfig}
              className="hidden lg:flex"
              onClick={() => {
                soundEffects.playClick();
                setShowLlmModal(true);
              }}
            />

            {showAutoSaveIndicator && (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_15px_rgba(52,211,153,0.3)] backdrop-blur-md">
                <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Saved</span>
              </div>
            )}

            {/* Mobile Command Menu Button (for tablets: sm to lg) */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowMobileCommandSheet(true);
              }}
              className="hidden sm:flex lg:hidden p-2.5 rounded-2xl bg-black/85 hover:bg-black/95 border border-rose-500/40 text-rose-300 hover:text-white backdrop-blur-md shadow-lg items-center justify-center relative cursor-pointer active:scale-95"
              title="Open Mobile Command Dock"
            >
              <LayoutGrid className="w-4 h-4 text-rose-400" />
              {/* Notification / Unclaimed Beacon */}
              {(unreadNotificationCount > 0 || hasUnclaimedClearance) && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-black shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                </span>
              )}
            </button>

            {/* Desktop Glass Command Dock (>= lg) */}
            <div className="hidden lg:flex items-center bg-black/80 backdrop-blur-md border border-white/10 p-1 rounded-2xl shadow-lg shrink-0 gap-0.5">
              {/* World Lore & Guidebook Button */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowWorldGuidebook(true);
                }}
                className="p-1.5 rounded-xl hover:bg-amber-950/40 text-amber-300 hover:text-amber-200 transition-all cursor-pointer flex items-center gap-1"
                title="World Lore Guidebook (Characters, Locations, Stats & Keywords)"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
              </button>

              {/* Interactive Flowchart Button (Task 2) */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowFlowchartModal(true);
                }}
                className="p-1.5 rounded-xl hover:bg-cyan-950/40 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1"
                title="Interactive Flowchart & Timeline Anchors"
              >
                <GitBranch className="w-4 h-4 text-cyan-400" />
              </button>

              {/* LitRPG Trials Link (Task 4) */}
              <button
                onClick={handleNavigateToTrials}
                className="p-1.5 rounded-xl hover:bg-blue-950/40 text-blue-400 hover:text-blue-300 transition-all cursor-pointer flex items-center gap-1"
                title="LitRPG Daily Roguelite Trials (Auto-saves story progress)"
              >
                <Swords className="w-4 h-4 text-blue-400" />
              </button>

              {/* Share World & Seed (Task 5) */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowShareModal(true);
                }}
                className="p-1.5 rounded-xl hover:bg-purple-950/40 text-purple-400 hover:text-purple-300 transition-all cursor-pointer flex items-center gap-1"
                title="Share Multiverse Setup & Card"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
              </button>

              {/* Timeline Scars Inspector (Pitch A) */}
              {timelineScars.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowScarsModal(true);
                  }}
                  className="p-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse"
                  title={`View ${timelineScars.length} Timeline Scars incurred from Causal Covenants`}
                >
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-mono font-bold">{timelineScars.length}</span>
                </button>
              )}

              {/* Illustrate Scene (Nano Banana 2.1) */}
              <button
                onClick={() => handleGenerateSceneCG(false)}
                disabled={isGeneratingScene}
                className="p-1.5 rounded-xl hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1 group disabled:opacity-50"
                title="Generate Cinematic Scene CG (Nano Banana 2.1)"
              >
                <Sparkles className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

              {/* Party */}
              <button
                onClick={() => setShowPartyDrawer(true)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                title="Party Roster"
              >
                <Users className="w-4 h-4 text-rose-400" />
                <span className="text-[10px] font-mono font-bold text-zinc-300">
                  {party.filter((p) => p.isPresent).length}
                </span>
              </button>

              {/* Log / Memories */}
              <button
                onClick={() => setShowChronicle(true)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                title="Chronicle Memories"
              >
                <Scroll className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] font-mono font-bold text-zinc-300">
                  {memories.length}
                </span>
              </button>

              {/* Save Game */}
              <button
                onClick={() => setShowSaveModal(true)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1"
                title="Save or Load Game"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* Notification History Bell */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowNotificationHistory(true);
                  setUnreadNotificationCount(0);
                }}
                className="p-1.5 rounded-xl hover:bg-rose-950/40 text-zinc-400 hover:text-white transition-all cursor-pointer relative flex items-center gap-1"
                title="Notification Archive & System Broadcasts"
              >
                <Bell className="w-4 h-4 text-rose-400" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-mono font-bold rounded-full bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

              {/* Realm Access Key & Quota */}
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-1.5 rounded-xl hover:bg-purple-950/40 text-purple-300 hover:text-purple-200 transition-all cursor-pointer flex items-center gap-1"
                title={userAuth ? `Active Realm Key: ${userAuth.name} (${userAuth.remainingTurns === -1 ? "∞" : `${userAuth.remainingTurns} turns remaining`})` : "Configure Access Key"}
              >
                <Key className="w-3.5 h-3.5 text-purple-400" />
                {userAuth && (
                  <span className="hidden xl:inline text-[10px] font-mono">
                    {userAuth.remainingTurns === -1 ? "∞" : userAuth.remainingTurns}
                  </span>
                )}
              </button>

              {/* Audio Mute Toggle */}
              <button
                onClick={handleToggleAudio}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DIALOGUE & SPRITE TERMINAL */}
      <div className="absolute top-14 sm:top-24 md:top-24 bottom-2 sm:bottom-3 inset-x-2 sm:inset-x-6 md:inset-x-10 lg:inset-x-16 z-30 flex flex-col justify-end gap-1.5 sm:gap-2 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        <div className="pointer-events-auto relative bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[42dvh] sm:max-h-[50vh] md:max-h-[54vh]">
          <div className="absolute -top-1 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/70 to-transparent" />

          {/* Pillar 3: Penalty Scenario Warning Banner */}
          {systemState.penaltyScenario?.isActive && (
            <div className="bg-gradient-to-r from-red-950/90 via-rose-950/90 to-purple-950/90 border-b border-red-500/40 px-4 py-2 flex items-center justify-between text-xs animate-pulse select-none">
              <div className="flex items-center gap-2 text-rose-300">
                <Skull className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                <span className="font-mono font-bold tracking-wider text-rose-100 uppercase text-[11px] sm:text-xs">
                  [PENALTY SCENARIO: {systemState.penaltyScenario.scenarioTitle}]
                </span>
                <span className="text-zinc-300 text-[11px] hidden md:inline truncate max-w-md">
                  {systemState.penaltyScenario.hazardEffectDescription}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-amber-300 bg-black/70 px-2 py-0.5 rounded border border-amber-500/40 text-[11px]">
                  Survival Turn: {systemState.penaltyScenario.currentSurvivalTurn} / {systemState.penaltyScenario.survivalTurnsRequired}
                </span>
                <span className="font-mono text-red-300 font-bold bg-red-900/60 px-2 py-0.5 rounded border border-red-500/50 text-[10px]">
                  CALAMITY
                </span>
              </div>
            </div>
          )}

          <div className="shrink-0 px-3 py-2 sm:px-4 sm:py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 select-none">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Speaker Badge (Clickable to open Character Card Modal) */}
              {isSpeakingHeroine ? (
                <div
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedCharacterCardComp(isSpeakingHeroine);
                  }}
                  className="inline-flex items-center gap-1.5 bg-rose-600/25 border border-rose-500/40 hover:border-rose-400 hover:bg-rose-600/35 px-2.5 py-1 rounded-xl shadow-sm shrink-0 max-w-[150px] sm:max-w-[190px] cursor-pointer transition-all group"
                  title={`Click to open ${isSpeakingHeroine.name}'s Character Card Dossier`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold tracking-wide text-rose-200 uppercase font-mono truncate">
                    {isSpeakingHeroine.name}
                  </span>
                </div>
              ) : isProtagonistAlone ? (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-sky-950/60 border border-sky-500/40 px-2.5 sm:px-3 py-1 rounded-xl shadow-sm shrink-0">
                  <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-200 uppercase font-mono truncate">
                    {gameState.speaker || "Narrator"}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-sky-950/60 border border-sky-500/30 px-2.5 sm:px-3 py-1 rounded-xl shadow-sm shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wide text-sky-200 uppercase font-mono truncate">
                    {gameState.speaker || "Narrator"}
                  </span>
                </div>
              )}

              {/* Status / Presence Indicator */}
              {isSpeakingHeroine ? (
                <div
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedCharacterCardComp(isSpeakingHeroine);
                  }}
                  className="relative inline-flex items-center gap-1.5 bg-black/60 border border-white/10 hover:border-rose-400/50 px-2 sm:px-2.5 py-1 rounded-xl shadow-inner shrink-0 cursor-pointer transition-colors"
                  title={`Heart Resonance (${isSpeakingHeroine.name}: ${isSpeakingHeroine.affection}%) • Click to open Dossier`}
                >
                  {lastAffectionDelta !== null && lastAffectionDelta.companion.toLowerCase().includes(isSpeakingHeroine.name.toLowerCase()) && (
                    <div 
                      className={`absolute -top-7 left-2 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold animate-bounce shadow-lg z-20 flex items-center gap-1 whitespace-nowrap ${
                        lastAffectionDelta.isCapped
                          ? "bg-amber-950 text-amber-300 border border-amber-500/60"
                          : lastAffectionDelta.delta > 0 
                          ? "bg-rose-600/90 text-white border border-rose-400" 
                          : "bg-zinc-800 text-zinc-400 border border-zinc-600"
                      }`}
                    >
                      {lastAffectionDelta.isCapped ? (
                        <>
                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span>Locked at {lastAffectionDelta.cap}%</span>
                        </>
                      ) : lastAffectionDelta.delta > 0 ? (
                        `+${lastAffectionDelta.delta} Favor`
                      ) : (
                        `${lastAffectionDelta.delta} Favor`
                      )}
                    </div>
                  )}
                  <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 fill-rose-500/80 shrink-0" />
                  <span className="text-[10px] font-mono font-medium text-rose-300 hidden xl:inline">Favor:</span>
                  {isSpeakingHeroine.encountered ? (
                    <>
                      <div className="w-10 sm:w-14 md:w-16 bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${isSpeakingHeroine.affection}%` }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-300 flex items-center gap-0.5">
                        {isSpeakingHeroine.affection}%
                        {(() => {
                          const cap = getCompanionCap(isSpeakingHeroine.name);
                          return isSpeakingHeroine.affection >= cap && cap < 100 ? (
                            <span title={`Favor locked at ${cap}%. Complete her Companion Quest to break through.`}>
                              <Lock className="w-2.5 h-2.5 text-amber-400 inline" />
                            </span>
                          ) : null;
                        })()}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 italic px-1">???</span>
                  )}
                </div>
              ) : isProtagonistAlone ? (
                <div className="inline-flex items-center gap-1.5 bg-sky-950/40 border border-sky-500/30 px-2 sm:px-2.5 py-1 rounded-xl shadow-inner shrink-0">
                  <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-[10px] font-mono font-bold text-sky-300">Solo</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-black/60 border border-white/10 px-2 sm:px-2.5 py-1 rounded-xl shadow-inner shrink-0">
                  <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-[10px] font-mono font-medium text-rose-300 hidden md:inline">With:</span>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    {presentComps.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setSpotlightHeroineName(c.name);
                          setSelectedCharacterCardComp(c);
                        }}
                        className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-300 hover:text-white hover:underline cursor-pointer truncate max-w-[90px] sm:max-w-none"
                        title={`Focus ${c.name} on stage / View Dossier`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Port Solaris Live BPM & Blush Badge in Speaker Bar */}
              {isSpeakingHeroine && currentStory.id === "port-solaris" && (() => {
                const solarisMeta = PORT_SOLARIS_HEROINE_DOSSIERS[isSpeakingHeroine.name];
                const speakingProfile = getHeroineResistanceProfile(isSpeakingHeroine as StoryCompanion);
                const bpmCeiling = getAffectionBpmCeiling(isSpeakingHeroine.affection, speakingProfile.guardTier);
                const rawBpm =
                  (isSpeakingHeroine as any).heartRateBpm ??
                  (solarisMeta ? Math.round(solarisMeta.heartRateBpm + Math.max(0, isSpeakingHeroine.affection - 20) * 0.35) : 55);
                const liveBpm = Math.max(40, Math.min(bpmCeiling, rawBpm));
                const bpmZoneInfo = getBpmZone(liveBpm);
                const isShortCircuit = bpmZoneInfo.zone === "SHORT_CIRCUIT";
                const isBlush = bpmZoneInfo.zone === "BLUSH_ZONE" || bpmZoneInfo.zone === "FEVER_PITCH";
                const isGuardedIntrigued = bpmZoneInfo.zone === "GUARDED_DEFLECTION";

                return (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedCharacterCardComp(isSpeakingHeroine);
                    }}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border font-mono text-[10px] font-bold shadow-inner shrink-0 transition-all cursor-pointer ${
                      isShortCircuit
                        ? "bg-amber-950/90 border-amber-400 text-amber-200 animate-bounce"
                        : isBlush
                        ? "bg-pink-950/85 border-pink-400/70 text-pink-200 animate-pulse"
                        : isGuardedIntrigued
                        ? "bg-amber-950/70 border-amber-500/40 text-amber-200"
                        : "bg-black/60 border-white/10 text-zinc-300 hover:border-white/20"
                    }`}
                    title={`Live Heart-Rate: ${liveBpm} BPM (${bpmZoneInfo.label}) • Click to open Dossier`}
                  >
                    <Heart className={`w-3 h-3 text-rose-400 fill-rose-400 shrink-0 ${liveBpm >= 83 ? "animate-pulse" : ""}`} />
                    <span className="whitespace-nowrap">{liveBpm} BPM</span>
                    <span className="hidden xl:inline">•</span>
                    <span className="hidden xl:inline uppercase whitespace-nowrap">
                      {isShortCircuit ? "Short-Circuit!" : isBlush ? "Blush Zone" : isGuardedIntrigued ? "Intrigued" : "Composed"}
                    </span>
                  </button>
                );
              })()}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 min-w-0 ml-auto">
              {/* Relocated Area Map / Sector Button */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowMap(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/45 hover:bg-emerald-900/65 border border-emerald-500/35 hover:border-emerald-400/75 text-emerald-300 text-[10px] sm:text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm group min-w-0 max-w-[140px] sm:max-w-[210px]"
                title={`Current Location: ${gameState.location} (Click to View Area Map)`}
              >
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{gameState.location}</span>
                <Compass className="w-3 h-3 text-emerald-400/70 shrink-0 group-hover:text-emerald-200 transition-colors hidden sm:inline" />
              </button>

              {isSpeakingHeroine && (() => {
                const rawExpr = isSpeakingHeroine.expressionKey || "neutral";
                const resolvedExpr =
                  currentStory.id === "starfall-labyrinth" &&
                  rawExpr === "hurt" &&
                  isSpeakingHeroine.heroStatus !== "WOUNDED" &&
                  !player.labyrinthState?.activeEncounter?.isActive
                    ? "flustered"
                    : rawExpr;
                return (
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-lg border border-white/5 hidden md:inline-block shrink-0">
                    {resolvedExpr}
                  </span>
                );
              })()}
              {isProtagonistAlone && (
                <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider bg-sky-950/40 px-2 py-1 rounded-lg border border-sky-500/20 hidden md:inline-block shrink-0">
                  Solitary Arc
                </span>
              )}
              <div className="relative hidden lg:inline-block min-w-0">
                <button
                  type="button"
                  onClick={() => setShowSubtextPopover((v) => !v)}
                  title={`Mood: ${gameState.mood} — Click to inspect companion micro-expression & psychological subtext`}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-mono inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/25 transition-all cursor-pointer max-w-[180px] xl:max-w-[260px]"
                >
                  <span className="truncate">• Mood: {gameState.mood}</span>
                  <Eye className="w-3 h-3 text-amber-400/80 shrink-0" />
                </button>
                {showSubtextPopover && (
                  <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-xl bg-zinc-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl z-40 text-left space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        👁️ Subtext & Micro-Expression
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSubtextPopover(false)}
                        className="text-zinc-400 hover:text-white text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-200 leading-relaxed">
                      <span className="text-amber-300 font-semibold">{gameState.speaker || "Scene"}:</span>{" "}
                      Surface demeanor projects <span className="italic text-amber-200">{gameState.mood}</span>
                      {isSpeakingHeroine
                        ? ` (${isSpeakingHeroine.expressionKey} posture, ${isSpeakingHeroine.affection}% Bond). ${
                            (isSpeakingHeroine as any).currentSentiment ||
                            "Guarded curiosity beneath the outward composure."
                          }`
                        : ". Ambient tension lingers across the sector."}
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleGenerateSceneCG(false)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm hover:border-rose-400 shrink-0"
                title="Illustrate this scene in real-time with Nano Banana 2.1"
              >
                <Camera className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="whitespace-nowrap">Illustrate CG</span>
              </button>
            </div>
          </div>

          <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
            {/* DYNAMIC SPRITE STAGE (REDESIGNED FOR FULL-SIZE SPOTLIGHT & COMPANION SWITCHER) */}
            <div className="hidden sm:flex relative w-56 sm:w-64 md:w-80 lg:w-96 bg-gradient-to-b from-zinc-900/40 via-zinc-950/60 to-black/90 border-r border-white/10 items-end justify-center overflow-hidden shrink-0 select-none">
              {/* SLEEK COMPANION AVATAR SWITCHER STRIP */}
              {presentComps.length > 0 && (
                <div className="absolute top-2 inset-x-2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 overflow-x-auto no-scrollbar shadow-xl pointer-events-auto">
                  {presentComps.map((comp) => {
                    const isSpotlighted = isCompanionSpotlighted(comp.name, presentComps, gameState.speaker, spotlightHeroineName);
                    const isSpeaking = gameState.speaker.toLowerCase().includes(comp.name.toLowerCase());
                    const thumbSrc = getSpriteSrc(comp.name, comp.expressionKey);
                    const solarisMeta = currentStory.id === "port-solaris" ? PORT_SOLARIS_HEROINE_DOSSIERS[comp.name] : undefined;
                    const compBpm =
                      currentStory.id === "port-solaris"
                        ? (comp as any).heartRateBpm ??
                          (solarisMeta
                            ? Math.min(100, Math.round(solarisMeta.heartRateBpm + (comp.affection - 20) * 0.45))
                            : undefined)
                        : undefined;

                    return (
                      <div
                        key={comp.name}
                        onClick={() => {
                          soundEffects.playClick();
                          setSpotlightHeroineName(comp.name);
                        }}
                        onDoubleClick={() => {
                          soundEffects.playClick();
                          setSelectedCharacterCardComp(comp);
                        }}
                        className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-xl transition-all cursor-pointer shrink-0 border select-none ${
                          isSpotlighted
                            ? "bg-rose-950/80 border-rose-400/80 shadow-[0_0_12px_rgba(244,63,94,0.35)] scale-102"
                            : "bg-zinc-900/60 border-white/10 hover:border-white/30 hover:bg-zinc-800/80"
                        }`}
                        title={`Click to focus ${comp.name} on stage • Double-click to open Dossier`}
                      >
                        <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 bg-zinc-950 shrink-0">
                          <img
                            src={(thumbSrc && thumbSrc.trim()) || DEFAULT_FALLBACK_SPRITE}
                            alt={comp.name}
                            className="w-full h-full object-cover object-top"
                          />
                          {isSpeaking && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 pr-0.5">
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-mono font-bold truncate max-w-[65px] ${isSpotlighted ? "text-rose-200" : "text-zinc-300"}`}>
                              {comp.name.split(" ")[0]}
                            </span>
                            {isSpeaking && <Sparkles className="w-2.5 h-2.5 text-rose-400 shrink-0" />}
                          </div>
                          {compBpm !== undefined ? (
                            <span className="text-[8px] font-mono text-rose-300 leading-none">
                              ♥ {compBpm}
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono text-rose-300/90 leading-none">
                              {comp.starRank ? `${comp.starRank}★ • ` : ""}♥ {comp.affection}%
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEffects.playClick();
                            setSelectedCharacterCardComp(comp);
                          }}
                          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title={`Open ${comp.name}'s Dossier`}
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="relative w-full h-full flex items-end justify-center px-2 pt-14">
                {(() => {
                  if (presentComps.length === 0) {
                    return (
                      /* SOLO / NO HEROINE SCENE: DISPLAY PROTAGONIST SPRITE */
                      <div className="relative h-full w-full flex items-end justify-center animate-in fade-in duration-500">
                        <div 
                          className="absolute bottom-6 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-30"
                          style={{
                            background: "radial-gradient(circle, rgba(14,165,233,0.5) 0%, transparent 70%)"
                          }}
                        />
                        {playerAvatar && playerAvatar.trim() ? (
                          <img
                            src={playerAvatar}
                            alt={player.name}
                            onClick={(e) => handleOpenPlayerFullPortrait(e)}
                            title="Click to view full character image"
                            className="h-full w-full object-contain object-bottom filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] cursor-pointer hover:brightness-110 transition-all"
                          />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                            <div className="w-24 h-24 rounded-full bg-zinc-800/80 border-2 border-white/10 flex items-center justify-center text-zinc-500 mb-2 shadow-inner">
                              <User className="w-12 h-12 text-zinc-500" />
                            </div>
                            <span className="text-xs font-mono text-zinc-300 font-semibold">{player.name}</span>
                            <span className="text-[10px] font-mono text-zinc-500">{player.role || "Protagonist"}</span>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-black/80 border border-sky-500/30 text-sky-300 shadow-md inline-flex items-center justify-center gap-1.5 mx-auto">
                            <Shield className="w-3 h-3 text-sky-400" />
                            <span>{player.name} • Solo in {gameState.location}</span>
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Multi-character scene: Spotlight active speaker or player-selected heroine at FULL SIZE!
                  const spotlightComp = resolveSpotlightCompanion(presentComps, gameState.speaker, spotlightHeroineName) || presentComps[0];

                  const isSpeaking = gameState.speaker.toLowerCase().includes(spotlightComp.name.toLowerCase());
                  const spriteSrc = getSpriteSrc(spotlightComp.name, spotlightComp.expressionKey);

                  return (
                    <div 
                      key={spotlightComp.name}
                      className="relative h-full w-full flex items-end justify-center transition-all duration-500"
                    >
                      {/* Ambient Heroine Aura */}
                      <div 
                        className="absolute bottom-6 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
                        style={{
                          background: getStageHeroineAura(spotlightComp.name).background
                        }}
                      />

                      {/* Full-Size Spotlight Sprite (Never shrinks to thumbnail sliver) */}
                      <img
                        src={(spriteSrc && spriteSrc.trim()) || DEFAULT_FALLBACK_SPRITE}
                        alt={spotlightComp.name}
                        decoding="async"
                        onClick={() => {
                          soundEffects.playClick();
                          setSelectedCharacterCardComp(spotlightComp);
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FALLBACK_SPRITE;
                        }}
                        title={`Click to open ${spotlightComp.name}'s Character Card Dossier`}
                        className={getStageSpriteClasses(isSpeaking)}
                      />

                      {/* Spotlight Character Info Bar / Dossier Trigger */}
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            setSelectedCharacterCardComp(spotlightComp);
                          }}
                          className="px-2.5 py-1 rounded-full bg-black/85 hover:bg-zinc-900 border border-white/20 hover:border-rose-400 text-white text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all cursor-pointer group"
                          title="Click to view full dossier & stats"
                        >
                          <Sparkles className="w-3 h-3 text-rose-400 group-hover:rotate-12 transition-transform" />
                          <span className="truncate max-w-[130px]">{spotlightComp.name}</span>
                          <span className="text-[9px] text-rose-300 opacity-80">• Dossier</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
            </div>

            {/* MESSAGE FEED (SELECTABLE AND EDITABLE) */}
            <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
              <div 
                ref={dialogueFeedRef}
                className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 select-text pb-14"
              >
              {(() => {
                let latestCharIdx = -1;
                let latestUserIdx = -1;
                for (let i = chatLog.length - 1; i >= 0; i--) {
                  if (latestCharIdx === -1 && chatLog[i].sender === "character") latestCharIdx = i;
                  if (latestUserIdx === -1 && chatLog[i].sender === "user") latestUserIdx = i;
                  if (latestCharIdx !== -1 && latestUserIdx !== -1) break;
                }

                return chatLog.map((msg, idx) => {
                  const isLatestCharacterTurn = idx === latestCharIdx;
                  const isLatestUserTurn = idx === latestUserIdx;
                  const isTypingUser = msg.id === typingUserMsgId;
                  const isEditing = editingMessageId === msg.id;

                  const isMsgAmbient =
                    msg.sender === "character" &&
                    ["narrator", "system", "inner monologue"].some((s) =>
                      msg.speakerName.toLowerCase().includes(s)
                    );
                  const resolvedSpriteSrc =
                    msg.sender === "character" && !isMsgAmbient
                      ? (msg.avatarSrc && msg.avatarSrc.trim()) ||
                        getSpriteSrc(msg.speakerName, activeSpeakerComp.expressionKey) ||
                        DEFAULT_FALLBACK_SPRITE
                      : DEFAULT_FALLBACK_SPRITE;

                  return (
                    <ChatMessageItem
                      key={msg.id}
                      msg={msg}
                      isLatestCharacterTurn={isLatestCharacterTurn}
                      isLatestUserTurn={isLatestUserTurn}
                      isTypingUser={isTypingUser}
                      isEditing={isEditing}
                      isLoading={isLoading}
                      playerAvatar={playerAvatar}
                      playerName={player.name}
                      resolvedSpriteSrc={resolvedSpriteSrc}
                      defaultFallbackSprite={DEFAULT_FALLBACK_SPRITE}
                      streamedContent={
                        isLatestCharacterTurn
                          ? displayedText
                          : isTypingUser
                          ? displayedUserText
                          : undefined
                      }
                      isStreaming={
                        isLatestCharacterTurn
                          ? displayedText.length < gameState.dialogue.length
                          : isTypingUser
                          ? displayedUserText.length < msg.text.length
                          : false
                      }
                      onStartEdit={handleStartEdit}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onDeleteMessage={handleDeleteMessage}
                      onRegenerateTurn={handleRegenerateTurn}
                      onSkipTypewriter={handleSkipTypewriter}
                      onPinMemory={handlePinTurnMessage}
                      onViewPortrait={handleViewMessagePortrait}
                    />
                  );
                });
              })()}

              {/* DIEGETIC ROTATING LOADING STATUS BANNER */}
              {isLoading && (
                <div className="w-full rounded-2xl border border-rose-500/30 bg-zinc-950/90 px-4 py-3 flex items-center justify-between gap-3 animate-pulse shadow-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-rose-400 animate-spin shrink-0" />
                    <span className="text-xs font-mono text-zinc-200 truncate">
                      {loadingPhaseIdx === 0 &&
                        `Weaving ${gameState.speaker && gameState.speaker !== "Narrator" ? `${gameState.speaker}'s` : "world"} response in ${gameState.location}...`}
                      {loadingPhaseIdx === 1 &&
                        `Evaluating ${player.name}'s ${player.race || "Human"} instincts & active stance...`}
                      {loadingPhaseIdx === 2 &&
                        `Consulting ${ (player.pinnedMemories || []).length > 0 ? `${player.pinnedMemories!.length} Pinned Core Memories & ` : "" }Chronicle Canon...`}
                      {loadingPhaseIdx === 3 &&
                        `Synthesizing multi-paragraph literary prose & tactical vectors...`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400/80 uppercase tracking-wider shrink-0">
                    {llmConfig.narrativeDepth === "deep_novelistic"
                      ? "5-7+ Paragraphs"
                      : llmConfig.narrativeDepth === "expansive"
                      ? "3-5 Paragraphs"
                      : "2-3 Paragraphs"}
                  </span>
                </div>
              )}
              </div>

              {/* RETURN TO TOP & RETURN TO BOTTOM QUICK SCROLL BUTTONS */}
              {chatLog.length > 0 && (
                <div className="absolute right-3.5 bottom-3.5 flex items-center gap-1.5 z-20 pointer-events-auto">
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-950/85 hover:bg-zinc-900 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-white backdrop-blur-md shadow-xl text-[11px] font-mono transition-all cursor-pointer active:scale-95 group/top"
                    title="Return to Top of dialogue"
                  >
                    <ChevronsUp className="w-3.5 h-3.5 text-zinc-400 group-hover/top:text-rose-400 group-hover/top:-translate-y-0.5 transition-all" />
                    <span className="hidden sm:inline">Top</span>
                  </button>
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-950/85 hover:bg-zinc-900 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-white backdrop-blur-md shadow-xl text-[11px] font-mono transition-all cursor-pointer active:scale-95 group/bottom"
                    title="Return to Bottom of dialogue"
                  >
                    <ChevronsDown className="w-3.5 h-3.5 text-zinc-400 group-hover/bottom:text-rose-400 group-hover/bottom:translate-y-0.5 transition-all" />
                    <span className="hidden sm:inline">Bottom</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Starfall Labyrinth Turn-Based Tactical Combat HUD (Hidden 1d20 Checks + Party Hot-Swapping) */}
        {currentStory.id === "starfall-labyrinth" &&
          player.labyrinthState?.activeEncounter?.isActive && (
            <div className="pointer-events-auto mb-1.5">
              <StarfallTacticalCombatHud
                encounter={player.labyrinthState.activeEncounter}
                labyrinthState={player.labyrinthState}
                protagonistName={player.name}
                protagonistRole={player.role}
                protagonistAbilities={player.abilityDetails}
                protagonistHp={player.stats.hp}
                protagonistMaxHp={player.stats.maxHp}
                protagonistMp={player.stats.mp}
                protagonistMaxMp={player.stats.maxMp}
                partyMembers={party as StoryCompanion[]}
                isSending={isLoading}
                onExecuteCombatCommand={(cmd) => sendAction(cmd, true)}
                onOpenBarracks={() => setShowBarracksModal(true)}
              />
            </div>
          )}

        {/* Pitch C & Upgrade 2A: Integrated Sector Clash Tactical Combat Dock with Universal 6-Stance Matrix */}
        {currentStory.id !== "starfall-labyrinth" && activeClash && activeClash.isActive && (
          <SectorClashHud
            activeClash={activeClash}
            storyId={currentStory.id}
            isPortSolaris={currentStory.id === "port-solaris"}
            playerName={player.name}
            playerRole={player.role || "Voidstrider"}
            playerHp={player.stats.hp}
            playerMaxHp={player.stats.maxHp}
            playerMp={player.stats.mp}
            playerMaxMp={player.stats.maxMp}
            activeStance={(player.activeStance as any) || "neutral"}
            onSelectStance={(nextStance) => {
              setPlayer((prev) => {
                const updated = { ...prev, activeStance: nextStance };
                playerRef.current = updated;
                return updated;
              });
            }}
            assistingCompanion={party.find((c) => c.isPresent && (c.name === activeClash.companionAssistingName || true)) || null}
            isLoading={isLoading}
            isExecutingClashAction={isExecutingClashAction}
            onExecuteClashAction={handleExecuteClashAction}
            onGenerateEnemyImage={(customPrompt) => handleGenerateEnemyImage(customPrompt)}
            isGeneratingEnemyImage={isGeneratingEnemyImage}
            combatPopups={clashCombatPopups}
            lastHitEvent={lastClashHitEvent}
            playerAbilities={player.abilities}
            abilityDetails={player.abilityDetails}
          />
        )}

        {/* Pitch A: The Causal Covenant Reality Severance Trigger */}
        {covenantCheck.available &&
          (!activeClash || !activeClash.isActive) &&
          !player.labyrinthState?.activeEncounter?.isActive && (
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setShowCovenantModal(true);
            }}
            className="pointer-events-auto w-full mb-1.5 sm:mb-2 py-2 px-3.5 rounded-xl border border-purple-500/60 bg-gradient-to-r from-purple-950/80 via-zinc-950/90 to-purple-950/80 hover:border-purple-400 text-purple-200 hover:text-white font-mono text-xs font-semibold flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] transition-all cursor-pointer group select-none"
            title={covenantCheck.reason}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>✦ [COVENANT: REALITY SEVERANCE]</span>
            </div>
            <span className="text-[10px] text-purple-300/80 group-hover:text-purple-200 font-mono hidden sm:inline">
              Burn Cap (-15%) → Overwrite Cosmic Fate
            </span>
          </button>
        )}

        {choices.length > 0 &&
          !isLoading &&
          (!activeClash || !activeClash.isActive) && (
          <div className="pointer-events-auto flex flex-col gap-1 select-none shrink-0">
            {/* Choice Tray Control Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  ✦ {choices.length} Tactical Vectors
                </span>
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                  (Click card to Draft & Edit • Click ⚡ to Send Immediately)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRerollChoices}
                  disabled={isRerollingChoices || isDraftingAction || isLoading}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-amber-500/40 text-[10px] font-mono text-zinc-300 hover:text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                  title="Generate 4 alternative protagonist choices for this scene"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isRerollingChoices ? "animate-spin text-amber-400" : ""}`} />
                  <span>{isRerollingChoices ? "Rerolling..." : "Reroll Choices"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsChoicesCollapsed((v) => !v)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-[10px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title={isChoicesCollapsed ? "Expand suggested choices" : "Minimize suggested choices to view more story"}
                >
                  {isChoicesCollapsed ? (
                    <>
                      <ChevronUp className="w-3 h-3 text-rose-400" />
                      <span>Expand Choices</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 text-zinc-400" />
                      <span>Minimize</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isChoicesCollapsed && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 max-h-28 sm:max-h-36 overflow-y-auto pr-0.5">
                {choices.map((choice, idx) => {
                  const tagMatch = choice.match(/^(\[[^\]]+\](?::)?)\s*(.*)$/);
                  const tag = tagMatch ? tagMatch[1] : null;
                  const text = tagMatch ? tagMatch[2] : choice;
                  const isThisChoiceDrafting = isDraftingAction && draftingChoiceIdx === idx;
                  const resonanceBadge = getChoiceResonanceBadge(choice);

                  return (
                    <div
                      key={`${idx}_${choice.slice(0, 16)}`}
                      className={`group bg-zinc-900/95 hover:bg-zinc-900 border backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-left transition-all duration-150 shadow-md flex items-center justify-between gap-2 ${
                        isThisChoiceDrafting
                          ? "border-sky-400 ring-1 ring-sky-500/40 bg-sky-950/30"
                          : "border-white/10 hover:border-sky-500/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectPresetChoice(choice, idx)}
                        disabled={isLoading || isDraftingAction}
                        title="Click to expand into a 2-paragraph draft in the text box for editing before sending"
                        className="flex-1 min-w-0 text-left cursor-pointer disabled:opacity-60"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          {tag && (
                            <span className="font-mono text-[10px] font-semibold text-rose-400/90 group-hover:text-rose-300 shrink-0">
                              {tag}
                            </span>
                          )}
                          {resonanceBadge && (
                            <span
                              className={`px-1.5 py-0.2 rounded border text-[9px] font-mono font-semibold ${resonanceBadge.color}`}
                            >
                              {resonanceBadge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-[13px] text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                          {isThisChoiceDrafting
                            ? `Drafting 2-paragraph response for ${player.name}...`
                            : text}
                        </p>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectPresetChoice(choice, idx)}
                          disabled={isLoading || isDraftingAction}
                          title="Draft & Edit in text box"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400/50 text-zinc-400 hover:text-sky-300 transition-all cursor-pointer"
                        >
                          {isThisChoiceDrafting ? (
                            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                          ) : (
                            <Edit3 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLoading || isDraftingAction) return;
                            const clean = choice.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
                            sendAction(clean, false);
                          }}
                          disabled={isLoading || isDraftingAction}
                          title="⚡ Send Immediately (Skip Drafting)"
                          className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* OOC.ai Stage Direction & Persistent Director Note Bar */}
        <div className="pointer-events-auto flex flex-col gap-1 px-0.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowOocDrawer((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-mono transition-all cursor-pointer ${
                directorNotes.trim()
                  ? "bg-indigo-950/85 border-indigo-400/60 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                  : "bg-zinc-950/80 border-white/10 text-zinc-400 hover:text-indigo-200 hover:border-indigo-500/40"
              }`}
              title="Steer pacing, subtext, or scene mood out-of-character without breaking immersion (or type (OOC: ...) directly in your message)"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              <span>
                {directorNotes.trim()
                  ? "OOC Director Note Active"
                  : "OOC Stage Direction"}
              </span>
              {showOocDrawer ? (
                <ChevronDown className="w-2.5 h-2.5 opacity-70" />
              ) : (
                <ChevronUp className="w-2.5 h-2.5 opacity-70" />
              )}
            </button>
            {currentStory.id === "starfall-labyrinth" &&
              !player.labyrinthState?.activeEncounter?.isActive &&
              isStarfallLobbyLocation(gameState.location) && (
                <button
                  type="button"
                  onClick={() =>
                    sendAction(
                      `Enter Floor ${Math.max(1, (player.labyrinthState?.highestFloorCleared || 0) + 1)} with the deployed vanguard.`,
                      true
                    )
                  }
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-950/80 hover:bg-amber-900/90 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-200 transition-all cursor-pointer disabled:opacity-50"
                  title="Step directly through the Star Gate into your next Labyrinth floor"
                >
                  <span>
                    ⚔ Deploy to Floor{" "}
                    {Math.max(1, (player.labyrinthState?.highestFloorCleared || 0) + 1)}
                  </span>
                </button>
              )}
          </div>
          {showOocDrawer && (
            <div className="flex items-center gap-2 bg-zinc-950/95 border border-indigo-500/40 rounded-xl px-3 py-1.5 shadow-lg">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 shrink-0">
                OOC:
              </span>
              <input
                type="text"
                value={directorNotes}
                onChange={(e) => setDirectorNotes(e.target.value)}
                placeholder='e.g. "Slow burn tension—have her notice my bandaged hand without mentioning it outright." (Or write (OOC: ...) inline)'
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              {directorNotes.trim() && (
                <button
                  type="button"
                  onClick={() => setDirectorNotes("")}
                  className="text-[10px] font-mono text-zinc-400 hover:text-rose-300 cursor-pointer shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <ActionInputBar
          onSend={handleSendCustomAction}
          isLoading={isLoading}
          isDraftingAction={isDraftingAction}
          draftText={draftActionText}
          draftVersion={draftActionVersion}
          playerName={player.name}
          hasParty={party.length > 0}
          onOpenGifting={() => {
            if (party.length > 0 && !selectedGiftRecipient) {
              setSelectedGiftRecipient(party[0].name);
            }
            setShowGiftingModal(true);
          }}
        />
      </div>

      {renderSaveModal()}
      {renderAuthModal()}
      {renderTransitionOverlay()}
      {renderSceneModal()}
      {renderItemModal()}
      {renderAbilityModal()}
      {renderCharacterPortraitViewerModal()}

      {(() => {
        const rawCardComp = selectedCharacterCardComp
          ? party.find(
              (c) =>
                (selectedCharacterCardComp.id && c.id === selectedCharacterCardComp.id) ||
                c.name.toLowerCase() === selectedCharacterCardComp.name.toLowerCase()
            ) || selectedCharacterCardComp
          : null;
        const liveCardComp = rawCardComp
          ? hydrateCompanionMetadata(
              rawCardComp,
              currentStory?.companions,
              currentStory.id === "starfall-labyrinth"
            )
          : null;
        const cardKnowledge = liveCardComp
          ? currentStory?.npcKnowledgeMap?.[liveCardComp.name.toLowerCase().trim()]
          : undefined;
        const cardRosterEntry =
          liveCardComp && currentStory.id === "starfall-labyrinth"
            ? (player.labyrinthState?.roster || []).find((r) =>
                matchesHeroineName(r.heroineName, liveCardComp.name, r.heroineId)
              ) || null
            : null;
        return (
          <CharacterCardModal
            companion={liveCardComp}
            isOpen={liveCardComp !== null}
            onClose={() => setSelectedCharacterCardComp(null)}
            storyId={currentStory.id}
            liveBpm={(liveCardComp as any)?.heartRateBpm}
            shopRole={(liveCardComp as any)?.shopRole}
            roomNumber={(liveCardComp as any)?.assignedRoomNumber}
            starfallRosterEntry={cardRosterEntry}
            npcKnowledge={cardKnowledge}
          />
        );
      })()}



      <SystemQuestModal
        isOpen={showSystemModal}
        onClose={() => setShowSystemModal(false)}
        systemState={normalizeSystemState(systemState)}
        onCompleteQuest={handleCompleteQuest}
      />

      <NotificationHistoryModal
        isOpen={showNotificationHistory}
        onClose={() => setShowNotificationHistory(false)}
        history={notificationHistory}
        onClearHistory={handleClearNotificationHistory}
        onDismissItem={handleDismissHistoryItem}
        onOpenSystemWindow={() => setShowSystemModal(true)}
        onInspectItem={(item) => handleInspectItem(item)}
      />

      {/* Mobile Command Dock Sheet */}
      <MobileCommandSheet
        isOpen={showMobileCommandSheet}
        onClose={() => setShowMobileCommandSheet(false)}
        storyId={currentStory.id}
        onGenerateSceneCG={() => handleGenerateSceneCG(false)}
        isGeneratingScene={isGeneratingScene}
        onOpenFlowchart={() => setShowFlowchartModal(true)}
        onOpenScarsModal={() => setShowScarsModal(true)}
        timelineScarsCount={timelineScars.length}
        onOpenPlayerSheet={() => setShowPlayerSheet(true)}
        onOpenPartyDrawer={() => setShowPartyDrawer(true)}
        partyCount={party.filter((p) => p.isPresent && p.heroStatus !== "FALLEN").length}
        onOpenSystemModal={() => setShowSystemModal(true)}
        hasUnclaimedClearance={hasUnclaimedClearance}
        onOpenCodex={handleNavigateToCodex}
        onOpenGuidebook={() => setShowWorldGuidebook(true)}
        onNavigateToTrials={handleNavigateToTrials}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenSaveModal={() => setShowSaveModal(true)}
        isAutoSaved={showAutoSaveIndicator}
        onOpenChronicle={() => setShowChronicle(true)}
        memoriesCount={memories.length}
        onOpenLlmModal={() => setShowLlmModal(true)}
        llmConfigName={llmConfig.modelId.split("/").pop() || llmConfig.modelId}
        onOpenNotifications={() => {
          setShowNotificationHistory(true);
          setUnreadNotificationCount(0);
        }}
        unreadNotificationsCount={unreadNotificationCount}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onOpenMap={() => setShowMap(true)}
        locationName={gameState.location}
        onOpenAuthModal={() => setShowAuthModal(true)}
        userAuthName={userAuth ? userAuth.name.split(" ")[0] : undefined}
        onOpenSummonModal={() => setShowSummonModal(true)}
        isStarfallInLobby={isStarfallLobbyLocation(gameState.location)}
        starShardsCount={player.labyrinthState?.starShards ?? 0}
      />

      {/* PARTY ROSTER DRAWER */}
      {showPartyDrawer && (
        <div 
          onClick={() => setShowPartyDrawer(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end max-sm:justify-end max-sm:flex-col select-none animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950/95 sm:border-l border-white/10 sm:h-full max-sm:h-[88dvh] max-sm:rounded-t-3xl max-sm:border-t border-rose-500/30 flex flex-col p-6 overflow-y-auto space-y-4 animate-in sm:slide-in-from-right max-sm:slide-in-from-bottom duration-300 ease-out shadow-2xl"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/20 self-center -mt-2 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white font-mono">
                  {currentStory.id === "port-solaris"
                    ? "Housemates & Blush Matrix"
                    : currentStory.id === "sovereign-spire"
                    ? "Dyad Cohort & Resonance"
                    : currentStory.id === "starfall-labyrinth"
                    ? "Squad Roster & Memorial"
                    : "Party & Affection"}
                </h2>
              </div>
              <button onClick={() => setShowPartyDrawer(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              {currentStory.id === "port-solaris"
                ? "Boarding house tenants & island heroines across Port Solaris:"
                : currentStory.id === "sovereign-spire"
                ? "Cadet heroines & Dyad candidates of The Sovereign Spire:"
                : currentStory.id === "starfall-labyrinth"
                ? "Summoned allies in Account #0419 (Deploy up to 4 + Protagonist • Permadeath active on Floors):"
                : "Companions traveling alongside you across Astra:"}
            </p>

            {currentStory.id === "starfall-labyrinth" && (() => {
              const ls = player.labyrinthState || createInitialLabyrinthState();
              const inLobby = isStarfallLobbyLocation(gameState.location);
              const deployedCount = (ls.roster || []).filter((r) => r.status === "DEPLOYED").length;
              const fallenCount = (ls.memorial || []).length;
              return (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-zinc-900/90 to-zinc-950 border border-indigo-500/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-200 uppercase tracking-wider">
                      💠 Starfall Roster ({deployedCount}/{MAX_DEPLOYED_PARTY} Deployed)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold">
                      {inLobby ? "Main Lobby" : `Floor ${ls.currentFloor}/100`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[9px] text-zinc-400 block">Star Shards</span>
                      <span className="text-xs font-bold text-cyan-300">💠 {ls.starShards}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[9px] text-zinc-400 block">5★ Pity</span>
                      <span className="text-xs font-bold text-amber-300">{ls.pityCounter}/90</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[9px] text-zinc-400 block">Memorial</span>
                      <span className="text-xs font-bold text-rose-300">✝ {fallenCount}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowPartyDrawer(false);
                      setShowSummonModal(true);
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      inLobby
                        ? "bg-indigo-600/30 hover:bg-indigo-600/45 border-indigo-400/70 text-indigo-100"
                        : "bg-zinc-900/80 hover:bg-zinc-800 border-white/15 text-zinc-400"
                    }`}
                  >
                    {inLobby ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Open Star Gate Summoning Altar (30 💠 / Pull)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Summon Altar Locked on Floor {ls.currentFloor} (View Roster)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}

            {currentStory.id === "port-solaris" && (() => {
              const bh = player.boardingHouse || createInitialBoardingHouseState();
              const canPayDebt = (player.gold || 0) >= 250 && (bh.outstandingDebt || 0) > 0;
              return (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/35 via-zinc-900/90 to-zinc-950 border border-amber-500/35 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                      ⚓ The Stray Anchor ({bh.starRating}★ Ledger)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 font-bold">
                      {bh.daysUntilAudit}d Until Audit
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[9px] text-zinc-400 block">Lease Debt</span>
                      <span className="text-xs font-bold text-rose-300">
                        {(bh.outstandingDebt ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[9px] text-zinc-400 block">Daily Shift</span>
                      <span className="text-xs font-bold text-emerald-300">
                        +{bh.dailyRevenue ?? 165}/turn
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/50 border border-white/10">
                      <span className="text-[9px] text-zinc-400 block">Scandal Heat</span>
                      <span className="text-xs font-bold text-amber-300">
                        {bh.scandalHeat ?? 15}%
                      </span>
                    </div>
                  </div>
                  {canPayDebt && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playEquipChime();
                        setPlayer((prev) => {
                          const currentHouse = prev.boardingHouse || createInitialBoardingHouseState();
                          const paid = paydownDebt(currentHouse, 250);
                          const nextPlayer: PlayerProfile = {
                            ...prev,
                            gold: Math.max(0, (prev.gold || 0) - paid.effectivePayment),
                            boardingHouse: paid.newState,
                          };
                          playerRef.current = nextPlayer;
                          performAutoSave({ player: nextPlayer });
                          return nextPlayer;
                        });
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-mono font-bold transition-all cursor-pointer"
                    >
                      Pay 250 Solar Crowns Toward Lease Debt (Have: {player.gold || 0})
                    </button>
                  )}
                </div>
              );
            })()}

            <div className="space-y-3">
              {party.map((comp) => {
                const sprite = getSpriteSrc(comp.name, comp.expressionKey);
                const solarisMeta =
                  currentStory.id === "port-solaris"
                    ? PORT_SOLARIS_HEROINE_DOSSIERS[comp.name]
                    : undefined;
                const sovereignMeta =
                  currentStory.id === "sovereign-spire"
                    ? SOVEREIGN_HEROINE_DOSSIERS[comp.name]
                    : undefined;
                const starfallMeta =
                  currentStory.id === "starfall-labyrinth"
                    ? STARFALL_HEROINE_DOSSIERS[comp.name]
                    : undefined;
                const starfallRosterEntry =
                  currentStory.id === "starfall-labyrinth"
                    ? (player.labyrinthState?.roster || []).find((r) =>
                        matchesHeroineName(r.heroineName, comp.name, r.heroineId)
                      )
                    : undefined;
                const isFallenHero =
                  comp.heroStatus === "FALLEN" || starfallRosterEntry?.status === "FALLEN";
                const liveBpm = solarisMeta
                  ? Math.min(100, Math.max(40, Math.round((comp as any).heartRateBpm ?? solarisMeta.heartRateBpm)))
                  : undefined;
                const isBlushZone = liveBpm !== undefined && liveBpm >= 83;
                const isAssignedShift =
                  solarisMeta &&
                  player.boardingHouse?.shopAssignments?.[solarisMeta.preferredShopRole] === comp.name;

                return (
                  <div
                    key={comp.name}
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedCharacterCardComp(comp);
                    }}
                    className="bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-rose-500/40 p-4 rounded-2xl flex items-start gap-3 transition-all cursor-pointer group"
                    title={`Click to open ${comp.name}'s Character Card Dossier`}
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shrink-0">
                      <img 
                        src={(sprite && sprite.trim()) || DEFAULT_FALLBACK_SPRITE} 
                        alt={comp.name} 
                        className={`w-full h-full object-cover object-top ${!comp.encountered ? "brightness-30 grayscale contrast-150" : ""}`} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white truncate group-hover:text-rose-200 transition-colors">
                          {comp.encountered ? comp.name : "???"}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {comp.encountered && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                              <span>Card</span>
                            </span>
                          )}
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
                            isFallenHero
                              ? "bg-rose-950/90 text-rose-300 border border-rose-500/50 font-bold"
                              : !comp.encountered 
                              ? "bg-zinc-800 text-zinc-500" 
                              : comp.isPresent 
                              ? "bg-emerald-500/20 text-emerald-300" 
                              : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {isFallenHero
                              ? `✝ Fallen (F${starfallRosterEntry?.fallenOnFloor || comp.fallenOnFloor || 1})`
                              : !comp.encountered
                              ? "Unmet"
                              : comp.isPresent
                              ? "Deployed"
                              : "Benched"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {comp.encountered ? comp.title : "Mystery Heroine • Path yet to cross"}
                      </p>

                      {comp.encountered && solarisMeta && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-200">
                            {solarisMeta.isBoardingHouseTenant
                              ? `Room 20${solarisMeta.assignedRoomNumber || 1} Tenant`
                              : "Island VIP"}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundEffects.playClick();
                              setPlayer((prev) => {
                                const currentHouse = prev.boardingHouse || createInitialBoardingHouseState();
                                const nextAssignments = {
                                  ...(currentHouse.shopAssignments || {}),
                                  [solarisMeta.preferredShopRole]: comp.name,
                                };
                                const tempHouse: BoardingHouseState = {
                                  ...currentHouse,
                                  shopAssignments: nextAssignments,
                                };
                                const rev = calculateDailyCafeRevenue(tempHouse, party as any, nextAssignments);
                                const nextHouse: BoardingHouseState = {
                                  ...tempHouse,
                                  dailyRevenue: rev.revenue,
                                };
                                const nextPlayer: PlayerProfile = {
                                  ...prev,
                                  boardingHouse: nextHouse,
                                };
                                playerRef.current = nextPlayer;
                                performAutoSave({ player: nextPlayer });
                                return nextPlayer;
                              });
                            }}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                              isAssignedShift
                                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 font-bold"
                                : "bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/30 text-sky-200"
                            }`}
                            title="Click to assign this heroine to her preferred Café Shift under Article 8"
                          >
                            {isAssignedShift
                              ? `✓ Shift: ${solarisMeta.preferredShopRole.replace(/_/g, " ")}`
                              : `+ Assign: ${solarisMeta.preferredShopRole.replace(/_/g, " ")}`}
                          </button>
                          {liveBpm !== undefined && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                                isBlushZone
                                  ? "bg-rose-500/20 border-rose-400/50 text-rose-200 animate-pulse"
                                  : "bg-zinc-800/80 border-white/10 text-zinc-300"
                              }`}
                            >
                              ♥ {liveBpm} BPM {isBlushZone ? "(Blush Zone)" : ""}
                            </span>
                          )}
                        </div>
                      )}

                      {comp.encountered && sovereignMeta && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-200">
                            {sovereignMeta.epithet}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                            {sovereignMeta.wing.replace(/_/g, " ")}
                          </span>
                        </div>
                      )}

                      {comp.encountered && starfallMeta && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-200 font-bold">
                            {"★".repeat(starfallRosterEntry?.starRank || comp.starRank || starfallMeta.baseStarRank)} • Lv.{starfallRosterEntry?.level || 1}/{getStarLevelCap(starfallRosterEntry?.starRank || comp.starRank || starfallMeta.baseStarRank)}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                            {starfallMeta.combatRole}
                          </span>
                          {!isFallenHero && starfallRosterEntry && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStarfallDeployment(comp.name);
                              }}
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                                starfallRosterEntry.status === "DEPLOYED"
                                  ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 font-bold"
                                  : "bg-zinc-800 hover:bg-zinc-700 border-white/15 text-zinc-300"
                              }`}
                              title="Toggle Deployed / Benched squad status (Available in Main Lobby or Safe Zones)"
                            >
                              {starfallRosterEntry.status === "DEPLOYED" ? "✓ Deployed (Bench)" : "+ Deploy to Squad"}
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-2">
                        {comp.encountered ? (
                          <>
                            {(() => {
                              const cap = getCompanionCap(comp.name);
                              const isLocked = comp.affection >= cap && cap < 100;
                              return (
                                <>
                                  <div className="flex justify-between items-center text-[10px] font-mono mb-1 text-rose-300">
                                    <span>Affection / Favor</span>
                                    <span className="flex items-center gap-1.5">
                                      <span className="font-bold text-white">{comp.affection}%</span>
                                      {isLocked ? (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/40 font-mono flex items-center gap-0.5">
                                          <Lock className="w-2.5 h-2.5" /> Locked at {cap}%
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-zinc-500 font-mono">
                                          Cap: {cap}%
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        isLocked 
                                          ? "bg-gradient-to-r from-amber-500 to-rose-500" 
                                          : "bg-gradient-to-r from-rose-500 to-pink-400"
                                      }`} 
                                      style={{ width: `${comp.affection}%` }} 
                                    />
                                  </div>
                                  {isLocked && (
                                    <div className="mt-1.5 text-[10px] font-mono text-amber-300/90 bg-amber-950/30 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5">
                                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span>Locked at {cap}%. Complete her Companion Quest to break through.</span>
                                    </div>
                                  )}
                                  {!isFallenHero && (() => {
                                    const compLvl = starfallRosterEntry?.level || comp.level || 1;
                                    const compExp = starfallRosterEntry?.exp ?? comp.exp ?? 0;
                                    const compMaxExp =
                                      starfallRosterEntry?.maxExp ||
                                      comp.maxExp ||
                                      getRequiredExpForLevel(compLvl);
                                    const compCap = starfallMeta
                                      ? getStarLevelCap(
                                          starfallRosterEntry?.starRank ||
                                            comp.starRank ||
                                            starfallMeta.baseStarRank
                                        )
                                      : 60;
                                    const atLvlCap = compLvl >= compCap;
                                    const expPct = atLvlCap
                                      ? 100
                                      : Math.max(0, Math.min(100, (compExp / Math.max(1, compMaxExp)) * 100));
                                    return (
                                      <div className="mt-2 pt-1.5 border-t border-white/5 space-y-1">
                                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                                          <span className="flex items-center gap-1 text-amber-300/90 font-semibold">
                                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                            Lv.{compLvl}{starfallMeta ? `/${compCap}` : ""}
                                          </span>
                                          <span className="text-[9px] text-zinc-400">
                                            {atLvlCap ? "MAX CAP" : `${compExp}/${compMaxExp} EXP`}
                                          </span>
                                        </div>
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
                                            style={{ width: `${expPct}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </>
                              );
                            })()}
                            {(() => {
                              const storyComp = currentStory.companions?.find(
                                (sc) => sc.name.toLowerCase() === comp.name.toLowerCase()
                              );
                              return storyComp?.seed ? (
                                <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                                  <span>IPAdapter Seed</span>
                                  <span className="text-amber-400/80">#{storyComp.seed} (Locked)</span>
                                </div>
                              ) : null;
                            })()}
                          </>
                        ) : (
                          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                            <span>Affection</span>
                            <span className="italic text-zinc-500">??? (Not Yet Encountered)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* REGION MAP MODAL */}
      {showMap && (
        <div 
          onClick={() => setShowMap(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center max-sm:items-end justify-center sm:p-4 select-none animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:border-emerald-500/30 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5 max-h-[88dvh] overflow-y-auto animate-in sm:zoom-in-95 max-sm:slide-in-from-bottom duration-300 ease-out"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/20 self-center -mt-2 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white font-mono">{currentStory.worldContext?.settingName || "World Map"}</h2>
              </div>
              <button onClick={() => setShowMap(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">Click a sector to direct your party toward that territory on your next action:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(currentStory.worldContext?.locations || CONTINENT_REGIONS).map((region, idx) => {
                const isCurrent = gameState.location.toLowerCase().includes(region.name.toLowerCase());
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setShowMap(false);
                      sendAction(`[Move to ${region.name}]`, false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isCurrent
                        ? "bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg"
                        : "bg-zinc-900/80 border-white/10 hover:border-white/20 hover:bg-zinc-900"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-zinc-400 uppercase">{region.zone}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                            Current Location
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-white mt-1">{region.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{region.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                      <span className="text-rose-400">{region.danger}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        Travel <Navigation className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PLAYER SHEET & INVENTORY DRAWER */}
      {showPlayerSheet && (
        <div 
          onClick={() => setShowPlayerSheet(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-start max-sm:justify-end max-sm:flex-col select-none animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950/95 sm:border-r border-white/10 sm:h-full max-sm:h-[88dvh] max-sm:rounded-t-3xl max-sm:border-t border-rose-500/30 flex flex-col p-6 overflow-y-auto space-y-6 animate-in sm:slide-in-from-left max-sm:slide-in-from-bottom duration-300 ease-out shadow-2xl"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/20 self-center -mt-2 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    if (playerAvatar && playerAvatar.trim()) {
                      handleOpenPlayerFullPortrait(e);
                    } else {
                      soundEffects.playClick();
                      setShowPortraitEditor(true);
                    }
                  }}
                  className="group relative w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/15 hover:border-rose-500/60 shrink-0 flex items-center justify-center cursor-pointer transition-all shadow-md"
                  title={
                    playerAvatar && playerAvatar.trim()
                      ? "Click to View Full Character Image"
                      : "Click to Edit Character Portrait"
                  }
                >
                  {playerAvatar && playerAvatar.trim() ? (
                    <img src={playerAvatar} alt={player.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <User className="w-6 h-6 text-zinc-500 group-hover:text-rose-400 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {playerAvatar && playerAvatar.trim() ? (
                      <Eye className="w-4 h-4 text-white" />
                    ) : (
                      <Edit3 className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white font-mono">{player.name}</h2>
                  <p className="text-xs text-rose-400 font-mono">Level {player.level} {player.race ? `${player.race} • ` : ""}{player.role}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                      Race: {player.race || "Human"}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                      Tone: {getNarrationStyleBadge(narrationStyle || player.narrationStyle)}
                    </span>
                    {playerAvatar && playerAvatar.trim() && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenPlayerFullPortrait(e)}
                        className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-200 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Eye className="w-3 h-3 text-sky-400" />
                        <span>View Full Image</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setShowPortraitEditor(true);
                      }}
                      className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-200 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Edit3 className="w-3 h-3 text-rose-400" />
                      <span>Edit Portrait</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveCharacterToRoster();
                        pushNotification({
                          id: `roster_save_${Date.now()}`,
                          type: "system_alert",
                          title: "CHARACTER SAVED TO ROSTER",
                          subtitle: `${player.name}'s identity (${player.race || "Human"} ${player.role}) is now available across all worlds & prologues!`,
                        });
                      }}
                      className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/40 text-indigo-200 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                      title="Save this character's identity (without level/items) to use in other worlds or introductions"
                    >
                      <Save className="w-3 h-3 text-indigo-400" />
                      <span>Save to Roster</span>
                    </button>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold">
                      Persona: {player.personality || "Stoic Pragmatist"}
                    </span>
                    {(player.gender || player.age) && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold">
                        {[player.gender, player.age ? `Age ${player.age}` : ""].filter(Boolean).join(" • ")}
                      </span>
                    )}
                    {player.worldOrigin && (
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold"
                        title={player.worldOriginDetails || undefined}
                      >
                        Origin: {player.worldOrigin}
                      </span>
                    )}
                    {player.behavioralTendencies && Object.keys(player.behavioralTendencies).length > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold" title="Dominant Choice Alignment">
                        Alignment: {getDominantTendencyLabel(player.behavioralTendencies)}
                      </span>
                    )}
                  </div>
                  {player.personalityTraits && player.personalityTraits.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[9px] font-mono text-zinc-500">Traits:</span>
                      {player.personalityTraits.slice(0, 4).map((trait, tIdx) => (
                        <span key={tIdx} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950/40 border border-rose-500/20 text-rose-300">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                  {player.racialTraits && player.racialTraits.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[9px] font-mono text-zinc-500">Anatomy:</span>
                      {player.racialTraits.slice(0, 4).map((trait, tIdx) => (
                        <span key={tIdx} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800/80 border border-white/10 text-zinc-300">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setShowPlayerSheet(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-zinc-900/70 p-4 rounded-2xl border border-white/5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-rose-300">
                  <span>
                    {currentStory.id === "port-solaris"
                      ? "COMPOSURE / COOL (HP)"
                      : "HEALTH (HP)"}
                  </span>
                  <span>{player.stats.hp} / {player.stats.maxHp}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${(player.stats.hp / player.stats.maxHp) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-sky-300">
                  <span>
                    {currentStory.id === "port-solaris"
                      ? "FLAIR / HYPE (MP)"
                      : currentStory.id === "sovereign-spire"
                      ? "AETHER RESONANCE (MP)"
                      : "MANA (MP)"}
                  </span>
                  <span>{player.stats.mp} / {player.stats.maxMp}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full transition-all" style={{ width: `${(player.stats.mp / player.stats.maxMp) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 relative overflow-hidden">
                <div className="flex justify-between items-center text-xs font-mono text-amber-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    EXPERIENCE (EXP)
                  </span>
                  <div className="flex items-center gap-2">
                    {expFeedback && (
                      <span className="text-[11px] font-mono font-bold text-amber-300 animate-bounce bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.6)]">
                        +{expFeedback.amount} EXP{expFeedback.reason ? ` • ${expFeedback.reason}` : ""}
                      </span>
                    )}
                    <span className="font-mono text-amber-200">
                      {player.stats.exp} / {player.stats.maxExp} ({Math.round((player.stats.exp / Math.max(1, player.stats.maxExp)) * 100)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                  <div
                    className={`h-full transition-all duration-1000 ease-out relative ${
                      expFeedback
                        ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.9)] animate-pulse"
                        : "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400"
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (player.stats.exp / Math.max(1, player.stats.maxExp)) * 100)
                      )}%`,
                    }}
                  >
                    {/* Glowing Leading Edge Spark Indicator - only rendered during active EXP gain */}
                    {expFeedback && (
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#fbbf24] rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(currentStory.id === "port-solaris" || currentStory.id === "sovereign-spire") && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-mono uppercase font-bold text-amber-300">
                    {currentStory.id === "port-solaris"
                      ? "The Stray Anchor • Star Ledger"
                      : "Sovereign Spire • Blood-Ledger"}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 font-bold">
                    {currentStory.id === "port-solaris"
                      ? `${player.matriculationRank ?? 0}★ Probation`
                      : `Seat #${player.matriculationRank || 488}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-zinc-400 block">
                      {currentStory.id === "port-solaris" ? "Solar Crowns" : "Sovereign Crowns"}
                    </span>
                    <span className="text-amber-300 font-bold">{player.gold ?? 120} Crowns</span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-zinc-400 block">
                      {currentStory.id === "port-solaris" ? "Lease Debt Quota" : "Semester Debt"}
                    </span>
                    <span className="text-rose-300 font-bold">{player.semesterDebtQuota ?? 5000}</span>
                  </div>
                </div>
              </div>
            )}

            {activeConditionPills.length > 0 && (
              <div>
                <h3 className="text-xs font-mono uppercase text-zinc-400 mb-2">Active Narrative Conditions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeConditionPills.map((pill, idx) => (
                    <span
                      key={idx}
                      title={pill.title}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-semibold ${pill.color}`}
                    >
                      {pill.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase text-zinc-400">Attributes</h3>
                {(player.unspentStatPoints || 0) > 0 && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-lg animate-pulse">
                    +{player.unspentStatPoints} Unspent Stat Points
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["str", "dex", "int"] as const).map((statKey) => (
                  <div
                    key={statKey}
                    className="bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-center relative flex flex-col items-center justify-center"
                  >
                    <p className="text-[10px] text-zinc-400 font-mono uppercase">{statKey}</p>
                    <p className="text-base font-bold text-white">{player.stats[statKey]}</p>
                    {(player.unspentStatPoints || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAllocateLevelStat(statKey)}
                        className="mt-1.5 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold transition-all cursor-pointer"
                        title={`Allocate +1 ${statKey.toUpperCase()}`}
                      >
                        <Plus className="w-2.5 h-2.5" />1
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-2">
                {currentStory.id === "port-solaris"
                  ? "Equipped Flair Loadout & Keepsake"
                  : "Equipped Gear"}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                  <Sword className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-200 font-semibold truncate">{player.gear.weapon}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {currentStory.id === "port-solaris" ? "Tool of the Trade" : "Main Weapon"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-200 font-semibold truncate">{player.gear.armor}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {currentStory.id === "port-solaris" ? "Signature Attire" : "Armor"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-zinc-200 font-semibold truncate">{player.gear.relic}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {currentStory.id === "port-solaris"
                        ? "Personal Keepsake (Caught Red-Handed)"
                        : "Relic"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Abilities & Talents
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">{player.abilities.length} Mastered</span>
              </div>
              {player.abilities.length > 0 ? (
                <div className="space-y-2">
                  {player.abilities.map((abName, i) => {
                    const detail = player.abilityDetails?.[abName];
                    return (
                      <div
                        key={i}
                        onClick={() => handleInspectAbility(abName)}
                        className="group bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/5 hover:border-amber-500/30 p-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-between gap-2 select-none"
                        title="Click to view full ability description"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors truncate">
                                {abName}
                              </p>
                              {detail?.tier && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/50 text-amber-300 border border-amber-500/20">
                                  {detail.tier}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-sans line-clamp-1 mt-0.5">
                              {detail?.description || "Click to inspect full ability mechanics..."}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 text-[10px] font-mono text-zinc-500">
                          <span className="text-sky-400 font-semibold">{detail?.cost || "10 MP"}</span>
                          <span className="text-zinc-400">{detail?.type || "Active"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic bg-zinc-900/40 p-3 rounded-xl border border-white/5">
                  No abilities unlocked yet.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-zinc-400" /> Bag & Loot
                </h3>
                <span className="text-[10px] font-mono text-zinc-500">{player.inventory.length} Items</span>
              </div>

              {player.inventory.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {player.inventory.map((item) => {
                    const rarityColors: Record<string, string> = {
                      common: "text-zinc-300 border-white/10 bg-zinc-900/60",
                      uncommon: "text-emerald-300 border-emerald-500/30 bg-emerald-950/20",
                      rare: "text-sky-300 border-sky-500/30 bg-sky-950/20",
                      relic: "text-amber-300 border-amber-500/40 bg-amber-950/20",
                      cursed: "text-rose-400 border-rose-500/40 bg-rose-950/20",
                    };

                    const style = rarityColors[item.rarity] || rarityColors.common;
                    const canEquip = ["weapon", "armor", "relic"].includes(item.type);

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-2xl border flex items-start gap-3 transition-all ${style}`}
                      >
                        {/* Square Loot Thumbnail */}
                        <div
                          onClick={() => handleInspectItem(item)}
                          className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 relative cursor-pointer group flex items-center justify-center shadow-inner"
                          title="Click to inspect artifact"
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-zinc-500 group-hover:text-amber-300 transition-colors" />
                          )}
                          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              onClick={() => handleInspectItem(item)}
                              className="font-bold text-xs hover:underline cursor-pointer truncate"
                            >
                              {item.name}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/50 text-zinc-400 shrink-0">
                              {item.rarity}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight line-clamp-1 mt-0.5">{item.description}</p>
                          {item.effect && (
                            <p className="text-[10px] font-mono text-amber-400/90 mt-0.5">✦ {item.effect}</p>
                          )}
                          <div className="flex items-center justify-between pt-1 mt-1 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => handleInspectItem(item)}
                              className="text-[10px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Inspect
                            </button>
                            {canEquip && (
                              <button
                                type="button"
                                onClick={() => handleEquipItem(item)}
                                className="px-2 py-0.5 text-[10px] font-mono bg-white/10 hover:bg-white/20 rounded-md text-white cursor-pointer transition-all"
                              >
                                Equip
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Inventory is currently empty.</p>
              )}
            </div>

            {/* Quick Access to Multiverse Codex */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleNavigateToCodex}
                className="w-full py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Open Multiverse Codex</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INTERACTIVE BRANCHING FLOWCHART (Task 2 & Pillar 4) */}
      <FlowchartViewer
        isOpen={showFlowchartModal}
        onClose={() => setShowFlowchartModal(false)}
        flowchartTree={currentStory?.flowchartTree}
        visitedNodes={visitedStoryNodes}
        currentNodeKey={gameState.location}
        onJumpToAnchor={handleJumpToAnchor}
        causalPlausibility={systemState.plausibility}
        timelineEchoes={timelineEchoes}
      />

      {/* MULTIVERSE SEED SHARE MODAL (Task 5) */}
      <WorldShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        story={currentStory}
      />

      {/* BESPOKE ROMANCE CG REVELATION MODAL (Task 3) */}
      {activeBespokeCG && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300"
          onClick={() => setActiveBespokeCG(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-zinc-950 border border-rose-500/50 rounded-3xl shadow-2xl p-6 text-center space-y-4 overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-bold">
                ✦ Bespoke Romance Milestone Climax ✦
              </span>
              <button
                onClick={() => setActiveBespokeCG(null)}
                className="p-1 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/15 aspect-square max-h-[55vh] mx-auto bg-black shadow-2xl">
              <img
                src={activeBespokeCG.imageUrl}
                alt={activeBespokeCG.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white font-serif">{activeBespokeCG.title}</h3>
              <p className="text-xs text-rose-300 font-mono mt-1">
                Synthesized dynamically via Nano Banana 2.1 • Archived permanently in Multiverse Codex
              </p>
            </div>

            <button
              onClick={() => setActiveBespokeCG(null)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-mono text-xs font-bold shadow-lg"
            >
              Continue Chronicle
            </button>
          </div>
        </div>
      )}

      {/* CHRONICLE LOG DRAWER */}
      {showChronicle && (
        <div 
          onClick={() => setShowChronicle(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end max-sm:justify-end max-sm:flex-col select-none animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950/95 sm:border-l border-white/10 sm:h-full max-sm:h-[88dvh] max-sm:rounded-t-3xl max-sm:border-t border-sky-500/30 flex flex-col p-6 overflow-y-auto space-y-4 animate-in sm:slide-in-from-right max-sm:slide-in-from-bottom duration-300 ease-out shadow-2xl"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/20 self-center -mt-2 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white font-mono">Astra Chronicle</h2>
              </div>
              <button onClick={() => setShowChronicle(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PINNED CORE MEMORIES (PERMANENT AI CONTEXT) */}
            <div className="rounded-2xl border border-amber-500/35 bg-amber-950/15 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Pinned Core Canon ({(player.pinnedMemories || []).length}/6)
                </span>
                <span className="text-[10px] font-mono text-amber-400/80">Never Forgotten</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Facts pinned here are permanently injected into every turn so the AI never forgets your physical state, origin, vows, or secrets.
              </p>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customMemoryInput}
                  onChange={(e) => setCustomMemoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomPinnedMemory();
                    }
                  }}
                  placeholder="Pin a custom canon fact (e.g., Currently unclad in Gray Zone)..."
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPinnedMemory}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold cursor-pointer transition-all"
                >
                  Pin
                </button>
              </div>

              {(player.pinnedMemories || []).length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {(player.pinnedMemories || []).map((fact, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-start justify-between gap-2 bg-black/50 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-100"
                    >
                      <span className="leading-relaxed select-text">📌 {fact}</span>
                      <button
                        type="button"
                        onClick={() => handleTogglePinMemory(fact)}
                        className="text-zinc-400 hover:text-rose-400 text-[10px] font-mono shrink-0 mt-0.5 cursor-pointer"
                        title="Unpin from Core Canon"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500 italic">
                  No core memories pinned yet. Click &ldquo;Pin&rdquo; on any turn message or add one above.
                </p>
              )}
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              Major milestones and irreversible plot beats recorded by the chronicle engine:
            </p>

            <div className="space-y-3">
              {memories.map((entry, idx) => {
                const isPinned = (player.pinnedMemories || []).includes(entry.trim());
                return (
                  <div
                    key={idx}
                    className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-xl text-xs text-zinc-200 leading-relaxed flex gap-3 select-text items-start"
                  >
                    <span className="font-mono text-sky-400 font-bold select-none">#{idx + 1}</span>
                    <div className="flex-1">
                      <MarkdownRenderer content={entry} className="text-xs" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePinMemory(entry)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-mono shrink-0 cursor-pointer transition-all ${
                        isPinned
                          ? "border-amber-400/60 bg-amber-500/20 text-amber-300"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:text-amber-300 hover:border-amber-500/40"
                      }`}
                      title={isPinned ? "Unpin from Core Canon" : "Pin to Core Canon"}
                    >
                      {isPinned ? "Pinned" : "📌 Pin"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* NO-SAFEGUARD: FATAL DEATH & SANCTIONED REGRESSION MODAL */}
      {showDeathModal && deathRegressionRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative w-full max-w-xl bg-zinc-950 border-2 border-red-600/70 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.35)] p-4 sm:p-6 md:p-8 text-center space-y-4 sm:space-y-6 max-h-[90dvh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-mono text-xs uppercase tracking-widest">
              <Skull className="w-4 h-4 text-red-400 animate-bounce" />
              <span>Sanctioned Regression Protocol</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-red-500 font-mono tracking-tight">
                MORTAL FATALITY DETECTED
              </h2>
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Loop Iteration #{(systemState.regressionCount || 0) + 1} • Fatal Incident #{deathRegressionRecord.deathNumber}
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-red-500/30 rounded-2xl p-4 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-start border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase">Fatal Incident:</span>
                <span className="text-red-300 font-bold text-right ml-2">{deathRegressionRecord.causeOfDeath}</span>
              </div>
              <div className="flex justify-between items-start border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase">Location:</span>
                <span className="text-zinc-300 font-semibold">{deathRegressionRecord.location}</span>
              </div>
              <div className="flex justify-between items-start border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase">Lethal Threat:</span>
                <span className="text-red-400 font-semibold">{deathRegressionRecord.killerOrHazard}</span>
              </div>
              <div className="flex justify-between items-start border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase">System Protocol:</span>
                <span className="text-amber-400 font-bold">{deathRegressionRecord.systemVerdict}</span>
              </div>

              {deathRegressionRecord.retainedKnowledgeSummary && (
                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3">
                  <div className="text-red-400 font-bold uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-red-400" />
                    <span>Unlocked Timeline Insight (Causal Echo):</span>
                  </div>
                  <p className="text-rose-200 text-xs italic leading-relaxed">
                    &ldquo;{deathRegressionRecord.retainedKnowledgeSummary}&rdquo;
                  </p>
                </div>
              )}

              {deathRegressionRecord.retainedAbilities && deathRegressionRecord.retainedAbilities.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="text-zinc-500 uppercase text-[10px]">Preserved Class Abilities ({deathRegressionRecord.retainedExpPercent}% Core EXP):</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {deathRegressionRecord.retainedAbilities.map((ab, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-amber-500/30 text-[10px]">
                        {ab}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-zinc-400 leading-relaxed font-mono">
              The SYSTEM has intervened under the Regression Mandate. The mortal frame collapses, but memories and causal insight transcend back to the nearest timeline anchor.
            </div>

            <button
              onClick={handleExecuteRegressionRewind}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-mono text-sm font-bold shadow-[0_0_25px_rgba(225,29,72,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Engage Sanctioned Regression Rewind</span>
            </button>
          </div>
        </div>
      )}

      {/* PILLAR 5: CAMP GIFTING MODAL */}
      {showGiftingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-rose-500/40 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90dvh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white font-mono">Camp Gift Presentation</h3>
              </div>
              <button
                onClick={() => setShowGiftingModal(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Select Companion Recipient:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {party.map((comp) => {
                  const isSelected = (selectedGiftRecipient || party[0]?.name) === comp.name;
                  return (
                    <button
                      key={comp.name}
                      type="button"
                      onClick={() => setSelectedGiftRecipient(comp.name)}
                      className={`p-2.5 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-rose-950/60 border-rose-500 text-white shadow-sm ring-1 ring-rose-500/30"
                          : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{comp.name}</div>
                      <div className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                        <Heart className="w-3 h-3 fill-rose-500/50" />
                        <span>{comp.affection ?? 0}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gift Items List */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Choose Item from Inventory or Camp Provisions:</label>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {/* Inventory items */}
                {(player.inventory || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-zinc-900/80 border border-white/10 rounded-xl flex items-center justify-between hover:border-rose-500/50 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/10">
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExecuteGift(item, selectedGiftRecipient || party[0]?.name)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold cursor-pointer shrink-0 ml-3 transition-all"
                    >
                      Gift
                    </button>
                  </div>
                ))}

                {/* Camp Catalog provisions if player inventory is empty or sparse */}
                {CAMP_GIFT_CATALOG.map((gift) => {
                  const recipient = selectedGiftRecipient || party[0]?.name || "";
                  const isAffinity = gift.preferredCompanionIds.some((id) => recipient.toLowerCase().includes(id));
                  const asItem: InventoryItem = {
                    id: gift.itemId,
                    name: gift.name,
                    description: gift.description,
                    type: "consumable",
                    rarity: gift.rarity,
                    isGiftable: true,
                  };
                  return (
                    <div
                      key={gift.itemId}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isAffinity
                          ? "bg-rose-950/30 border-rose-500/40"
                          : "bg-zinc-900/80 border-white/10 hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                          <span>{gift.name}</span>
                          {isAffinity && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-500/50">
                              ★ Preferred
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-rose-400">
                            +{gift.baseAffectionGain + (isAffinity ? 2 : 0)} Favor
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{gift.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExecuteGift(asItem, recipient)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-mono text-xs font-bold cursor-pointer shrink-0 ml-3 transition-all shadow-sm"
                      >
                        Gift
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 font-mono italic">
              Presenting gifts deepens affection, yields stat boosts, and triggers dynamic camp downtime interactions. Other present companions will react to your attentiveness.
            </div>
          </div>
        </div>
      )}

      {/* Pitch A: The Causal Covenant Confirmation Modal */}
      {showCovenantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-purple-500/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-zinc-200 select-none max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
                <h3 className="font-bold text-sm tracking-wide text-purple-200">THE CAUSAL COVENANT: REALITY SEVERANCE</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCovenantModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200">
                <p className="font-semibold text-purple-300 mb-1">⚠️ Cosmic Price of Spacetime Severance:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-purple-200/90 font-mono">
                  <li>Permanent Maximum Plausibility Cap burn: -15% (Will drop from {systemState.covenantState?.maxPlausibilityCap ?? 100}% to {Math.max(30, (systemState.covenantState?.maxPlausibilityCap ?? 100) - 15)}%).</li>
                  <li>Incurs an indelible Timeline Scar upon reality.</li>
                  <li>Companions will react with profound moral distress.</li>
                </ul>
              </div>

              <p className="text-zinc-400">Select or declare your Reality Severance intent:</p>

              <div className="space-y-2">
                {[
                  "[Breakthrough/Survival]: Shatter the fatal causal nexus to force an absolute survival breakthrough.",
                  "[Obliteration/Cosmic]: Sever the spacetime anchor of all opposing anomalies in this sector.",
                  "[Preservation/Shielding]: Freeze local casualty coordinates to shield all present allies from death.",
                ].map((presetIntent, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleConfirmCovenant(presetIntent)}
                    disabled={isSeveringCovenant}
                    className="w-full p-2.5 rounded-xl border border-purple-500/20 bg-zinc-900/80 hover:bg-purple-950/60 hover:border-purple-400 text-left font-mono text-[11px] text-purple-200 hover:text-white transition-all cursor-pointer"
                  >
                    {presetIntent}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Or enter custom severance intent..."
                  value={covenantIntentText}
                  onChange={(e) => setCovenantIntentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && covenantIntentText.trim() && !isSeveringCovenant) {
                      handleConfirmCovenant(covenantIntentText);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-base sm:text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowCovenantModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Abort
              </button>
              <button
                type="button"
                disabled={!covenantIntentText.trim() || isSeveringCovenant}
                onClick={() => handleConfirmCovenant(covenantIntentText)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                Execute Severance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pitch B: Camp Ultimatum Ideological Conflict Modal */}
      {showCampUltimatumModal && activeUltimatumRivalry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-rose-500/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] text-zinc-200 select-none max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20 mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-rose-400 animate-pulse" />
                <h3 className="font-bold text-sm tracking-wide text-rose-200">CAMP ULTIMATUM: IDEOLOGICAL CONFLICT</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/40 text-rose-300">
                Friction: {activeUltimatumRivalry.frictionScore}%
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 text-xs leading-relaxed text-zinc-300">
                <p className="font-semibold text-white mb-1">
                  {activeUltimatumRivalry.companion1Name} vs. {activeUltimatumRivalry.companion2Name}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono mb-2">
                  Conflict Axis: {activeUltimatumRivalry.ideologicalAxis}
                </p>
                <p className="italic text-zinc-300">
                  &ldquo;The unresolved hostility between {activeUltimatumRivalry.companion1Name} and {activeUltimatumRivalry.companion2Name} has fractured party discipline. Both demand you declare your loyalty.&rdquo;
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleResolveCampUltimatum("reconcile")}
                  className="w-full p-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-950/60 hover:border-cyan-400 text-left font-mono text-xs text-cyan-200 hover:text-white transition-all cursor-pointer"
                >
                  [Reconcile/Triad]: Challenge both to unite above past grievances into an unbreakable triad bond (+Affection to both, unlocks Duo Synergy).
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveCampUltimatum("comp1")}
                  className="w-full p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-950/60 hover:border-rose-400 text-left font-mono text-xs text-rose-200 hover:text-white transition-all cursor-pointer"
                >
                  [Affirm/{activeUltimatumRivalry.companion1Name}]: Declare unwavering allegiance to {activeUltimatumRivalry.companion1Name}&rsquo;s principles (+Major Favor).
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveCampUltimatum("comp2")}
                  className="w-full p-3 rounded-xl border border-purple-500/30 bg-purple-950/30 hover:bg-purple-950/60 hover:border-purple-400 text-left font-mono text-xs text-purple-200 hover:text-white transition-all cursor-pointer"
                >
                  [Affirm/{activeUltimatumRivalry.companion2Name}]: Declare unwavering allegiance to {activeUltimatumRivalry.companion2Name}&rsquo;s principles (+Major Favor).
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveCampUltimatum("command")}
                  className="w-full p-3 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-left font-mono text-xs text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  [Command/Stern]: Reject emotional drama and impose strict commander discipline (+Survival Focus).
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Scars Inspector Modal */}
      {showScarsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-purple-500/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] text-zinc-200 select-none max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm tracking-wide text-purple-200">TIMELINE SCARS ({timelineScars.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScarsModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 mb-4">
              {timelineScars.length === 0 ? (
                <p className="text-zinc-500 text-xs italic text-center py-6">
                  No timeline scars incurred. Reality remains pristine and unsevered.
                </p>
              ) : (
                timelineScars.map((scar) => (
                  <div key={scar.id} className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-purple-300">{scar.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 uppercase">
                        {scar.scarType}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed mb-1.5">{scar.description}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Turn {scar.createdAtTurn} • {scar.createdAtTime}</span>
                      <span className="text-purple-400">-{scar.plausibilityCapReduction}% Plausibility Cap</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowScarsModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Transition Overlay */}
      <ScreenTransitionOverlay {...screenTransition} />

      {/* Dynamic Character Portrait Editor Modal */}
      <PortraitEditorModal
        isOpen={showPortraitEditor}
        onClose={() => setShowPortraitEditor(false)}
        currentAvatar={playerAvatar}
        playerName={player.name || "Wanderer"}
        playerRole={player.role || "Adventurer"}
        storyGenre={currentStory.genre}
        accessKey={accessKey}
        onSaveAvatar={(newAvatarUrl) => {
          setPlayerAvatar(newAvatarUrl);
          setPlayer((prev) => {
            const next = { ...prev };
            playerRef.current = next;
            performAutoSave({ player: next, playerAvatar: newAvatarUrl });
            return next;
          });

          // Asynchronously extract and anchor Visual DNA from the edited portrait via server vision route
          syncAvatarAnalysisFromServer(
            newAvatarUrl,
            playerRef.current.name,
            playerRef.current.role,
            playerRef.current.race || "Human",
            playerRef.current.racialTraits || []
          );

          pushNotification({
            id: `avatar_updated_${Date.now()}`,
            type: "quest_assigned",
            title: "CHARACTER PORTRAIT UPDATED",
            subtitle: "New protagonist portrait and Visual DNA synchronized to HUD and save state.",
          });
        }}
      />

      {/* Dynamic LLM Engine Selector Modal */}
      <LlmProviderModal
        isOpen={showLlmModal}
        onClose={() => setShowLlmModal(false)}
        config={llmConfig}
        onChange={(newConfig: LlmConfig) => {
          setLlmConfig(newConfig);
          saveStoredLlmConfig(newConfig);
        }}
      />

      {/* World Lore & Guidebook Modal */}
      <WorldGuidebookModal
        isOpen={showWorldGuidebook}
        onClose={() => setShowWorldGuidebook(false)}
        story={currentStory}
        labyrinthState={player.labyrinthState}
      />
      {/* Star Gate Summoning Altar Modal (Starfall Labyrinth) */}
      {currentStory.id === "starfall-labyrinth" && (
        <SummonModal
          isOpen={showSummonModal}
          onClose={() => setShowSummonModal(false)}
          labyrinthState={player.labyrinthState || createInitialLabyrinthState()}
          currentLocation={gameState.location}
          storyCompanions={currentStory.companions}
          isSendingTurn={isLoading}
          onSummonExecuted={handleSummonExecuted}
          onNarrateSummonArrival={handleNarrateSummonArrival}
          onOpenBarracks={() => {
            setShowSummonModal(false);
            setShowBarracksModal(true);
          }}
        />
      )}

      {/* Iron Barracks — Hero Star Stats, Skill Kits & Vanguard/Reserve Formation Modal */}
      {currentStory.id === "starfall-labyrinth" && (
        <StarfallBarracksModal
          isOpen={showBarracksModal}
          onClose={() => setShowBarracksModal(false)}
          labyrinthState={player.labyrinthState || createInitialLabyrinthState()}
          protagonistName={player.name || "Summoned Hero"}
          protagonistLevel={player.level || 1}
          protagonistRole={player.role || "Field Tactician"}
          partyMembers={party as StoryCompanion[]}
          onUpdateLabyrinthState={handleUpdateLabyrinthStateFromBarracks}
        />
      )}

      {/* Covenant VI Irreversible Game Over Modal (Starfall Labyrinth) */}
      {currentStory.id === "starfall-labyrinth" && (
        <GameOverModal
          isOpen={starfallGameOver !== null}
          playerName={player.name || "Summoned Hero"}
          causeOfDeath={starfallGameOver?.causeOfDeath || "Fell inside the Starfall Labyrinth."}
          killerOrHazard={starfallGameOver?.killerOrHazard}
          currentFloor={player.labyrinthState?.currentFloor || 0}
          highestFloorCleared={player.labyrinthState?.highestFloorCleared || 0}
          memorial={player.labyrinthState?.memorial || []}
          onOpenSaveModal={() => {
            setStarfallGameOver(null);
            setShowSaveModal(true);
          }}
          onReturnToMenu={() => {
            setStarfallGameOver(null);
            handleNavigateToCatalogue();
          }}
        />
      )}
    </div>
  );
}
