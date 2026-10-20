"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Heart, 
  MapPin, 
  Sparkles, 
  Send, 
  MessageSquareCode, 
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
  Award,
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
  ShieldCheck
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SystemState, SystemToastNotification, SystemQuest, PlausibilityTier } from "@/types/system";
import { SystemNotificationToast } from "@/components/SystemNotificationToast";
import { SystemQuestModal } from "@/components/SystemQuestModal";
import { AcquisitionNotification, AcquisitionAlertData } from "@/components/AcquisitionNotification";
import { GameNotificationStack, GameNotificationItem } from "@/components/GameNotificationStack";
import { saveGameSlot, loadGameSlot, loadAllGameSlots, deleteGameSlot, compressAvatarImage } from "@/lib/saveStorage";
import { StoryContext, VisitedStoryNode, AbilityDetail } from "@/types/story";
import { FlowchartViewer } from "@/components/FlowchartViewer";
import { RelicSynergyPanel } from "@/components/RelicSynergyPanel";
import { evaluateRelicSynergies } from "@/lib/relicSynergies";
import { WorldShareModal } from "@/components/WorldShareModal";
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

export interface InventoryItem {
  id: string;
  name: string;
  type: "weapon" | "armor" | "relic" | "consumable" | "material";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  description: string;
  effect?: string;
  imageUrl?: string;
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
  baseAffection?: number;
  affection: number;
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
  level: number;
  stats: PlayerStats;
  gear: { weapon: string; armor: string; relic: string };
  abilities: string[];
  abilityDetails?: Record<string, AbilityDetail>;
  inventory: InventoryItem[];
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
  timestamp: string;
  avatarSrc?: string;
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
};

const DEFAULT_BG = "/backgrounds/imperial_capital_imperium.jpg";

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

  // Immersion & Transition States
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState<{
    location: string;
    speaker: string;
    quote: string;
  } | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [statPoints, setStatPoints] = useState(10);
  const [gearPreference, setGearPreference] = useState<"system" | "none">("system");

  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerProfile>({
    name: "Caelen",
    role: "",
    level: 1,
    stats: { hp: 100, maxHp: 100, mp: 60, maxMp: 60, exp: 0, maxExp: 100, str: 10, dex: 10, int: 10 },
    gear: { weapon: "Pending...", armor: "Pending...", relic: "None" },
    abilities: [],
    abilityDetails: {},
    inventory: [],
  });
  const playerRef = useRef<PlayerProfile>(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  const isHydratingInventoryRef = useRef<boolean>(false);

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
      setPlayer(snap.player);
      playerRef.current = snap.player;
    }
    if (snap.systemState) setSystemState(snap.systemState);
    if (snap.memories) setMemories(snap.memories);
    if (snap.chatLog) setChatLog(snap.chatLog);
    if (snap.choices) setChoices(snap.choices);

    setShowFlowchartModal(false);
    pushNotification({
      id: `anchor_jump_${Date.now()}`,
      type: "system_alert",
      title: "TIMELINE ANCHOR SYNCHRONIZED",
      subtitle: `Restored timeline reality: ${anchor.title || anchor.location}`,
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

  useEffect(() => {
    let active = true;
    getStoryById(storyId).then((story) => {
      if (active && story) {
        setCurrentStory(story);
        setSelectedPrologue(0);
        setNarrationStyle(story.narrationStyle || "Grimdark & Atmospheric");
        if (story.companions && story.companions.length > 0) {
          const startingSpeaker = story.startingNodes?.[0]?.speaker || story.companions[0].name;
          setParty(
            story.companions.map((c, idx) => ({
              name: c.name,
              title: c.title,
              affection: c.affection ?? c.baseAffection ?? 15,
              expressionKey: c.expressionKey || "neutral",
              isPresent: idx === 0 || c.name.toLowerCase() === startingSpeaker.toLowerCase(),
              encountered: idx === 0 || c.name.toLowerCase() === startingSpeaker.toLowerCase(),
              color: c.color || "rose",
            }))
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
        if (story.rpgRules?.baseStats) {
          setPlayer((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              ...story.rpgRules.baseStats,
            },
          }));
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

  const pushNotification = (notif: Omit<GameNotificationItem, "id"> & { id?: string }) => {
    const id = notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setNotifications((prev) => {
      const existingIdx = prev.findIndex((n) => n.id === id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...notif, id };
        return copy;
      }
      return [...prev, { ...notif, id }];
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

  const [inputAction, setInputAction] = useState("");
  const [isOOCMode, setIsOOCMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  
  const [showPlayerSheet, setShowPlayerSheet] = useState(false);
  const [showPartyDrawer, setShowPartyDrawer] = useState(false);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showFlowchartModal, setShowFlowchartModal] = useState(false);
  const [visitedStoryNodes, setVisitedStoryNodes] = useState<VisitedStoryNode[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [companionMilestones, setCompanionMilestones] = useState<Record<string, number[]>>({});
  const [companionCompletedMilestones, setCompanionCompletedMilestones] = useState<Record<string, number[]>>({});

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
  const [savedSlots, setSavedSlots] = useState<Record<number, SaveSlotData | null>>({ 0: null, 1: null, 2: null, 3: null });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);

  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const dialogueFeedRef = useRef<HTMLDivElement | null>(null);
  const isResumingSaveRef = useRef(false);

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
  });
  const [showSystemModal, setShowSystemModal] = useState(false);

  // Nano Banana 2.1 Scene Generation & Item Inspection State
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);

  // Global Escape key listener for drawers and modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeBespokeCG) { setActiveBespokeCG(null); return; }
        if (showShareModal) { setShowShareModal(false); return; }
        if (showFlowchartModal) { setShowFlowchartModal(false); return; }
        if (showPlayerSheet) { setShowPlayerSheet(false); return; }
        if (showPartyDrawer) { setShowPartyDrawer(false); return; }
        if (showChronicle) { setShowChronicle(false); return; }
        if (showMap) { setShowMap(false); return; }
        if (showSaveModal) { setShowSaveModal(false); return; }
        if (showSystemModal) { setShowSystemModal(false); return; }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeBespokeCG,
    showShareModal,
    showFlowchartModal,
    showPlayerSheet,
    showPartyDrawer,
    showChronicle,
    showMap,
    showSaveModal,
    showSystemModal,
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
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: keyToTest.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setAuthError(data.error || "Invalid access key or quota reached.");
        setAuthLoading(false);
        return false;
      }
      setUserAuth(data.user);
      setAccessKey(keyToTest.trim());
      localStorage.setItem("astra_access_key", keyToTest.trim());
      setAuthLoading(false);
      setShowAuthModal(false);
      return true;
    } catch (err: any) {
      setAuthError(err.message || "Failed to reach verification service.");
      setAuthLoading(false);
      return false;
    }
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const raw = reader.result as string;
      const optimized = await compressAvatarImage(raw, 384);
      setPlayerAvatar(optimized);
    };
    reader.readAsDataURL(file);
  };

  const handleStatChange = (stat: "str" | "dex" | "int", amount: number) => {
    const currentValue = player.stats[stat];
    if (amount > 0 && statPoints > 0) {
      setPlayer({ ...player, stats: { ...player.stats, [stat]: currentValue + 1 } });
      setStatPoints((prev) => prev - 1);
    } else if (amount < 0 && currentValue > 10) {
      setPlayer({ ...player, stats: { ...player.stats, [stat]: currentValue - 1 } });
      setStatPoints((prev) => prev + 1);
    }
  };

  const handleEquipItem = (item: InventoryItem) => {
    if (item.type === "weapon") {
      setPlayer((prev) => ({ ...prev, gear: { ...prev.gear, weapon: item.name } }));
    } else if (item.type === "armor") {
      setPlayer((prev) => ({ ...prev, gear: { ...prev.gear, armor: item.name } }));
    } else if (item.type === "relic") {
      setPlayer((prev) => ({ ...prev, gear: { ...prev.gear, relic: item.name } }));
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
            const nextP = { ...prev, inventory: nextInv };
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
            const nextP = { ...prev, inventory: hydrated };
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

      // 3. Protagonist details
      const protagonistData = {
        name: player.name || "Protagonist",
        role: player.role || "Voidstrider",
        weapon: player.gear?.weapon || "Blade",
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

  const getSpriteSrc = (speaker: string, key: string) => {
    const normalizedKey = key === "injured" ? "hurt" : key;
    const companion = currentStory.companions?.find(
      (c) =>
        c.name.toLowerCase().includes(speaker.toLowerCase()) ||
        speaker.toLowerCase().includes(c.name.toLowerCase())
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

    if (speaker.toLowerCase().includes("evelyn")) {
      return EVELYN_EXPRESSIONS[normalizedKey] || EVELYN_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (speaker.toLowerCase().includes("aria")) {
      return ARIA_EXPRESSIONS[normalizedKey] || ARIA_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (speaker.toLowerCase().includes("serena")) {
      return SERENA_EXPRESSIONS[normalizedKey] || SERENA_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (speaker.toLowerCase().includes("morgana")) {
      return MORGANA_EXPRESSIONS[normalizedKey] || MORGANA_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    if (speaker.toLowerCase().includes("perci")) {
      return PERCI_EXPRESSIONS[normalizedKey] || PERCI_EXPRESSIONS.neutral || DEFAULT_FALLBACK_SPRITE;
    }
    return DEFAULT_FALLBACK_SPRITE;
  };

  const getLocationBg = (locName: string): string => {
    if (!locName) return currentStory.coverImage || DEFAULT_BG;
    const match = currentStory.worldContext?.locations?.find(
      (l) =>
        l.name.toLowerCase() === locName.toLowerCase() ||
        locName.toLowerCase().includes(l.name.toLowerCase()) ||
        l.name.toLowerCase().includes(locName.toLowerCase())
    );
    if (match?.bgImage && match.bgImage.trim()) return match.bgImage.trim();
    if (LOCATION_BACKGROUNDS[locName]) return LOCATION_BACKGROUNDS[locName];
    return gameState?.bgImage || currentStory.coverImage || DEFAULT_BG;
  };

  const handleStartGame = async () => {
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

    const initialGear = gearPreference === "none"
      ? { weapon: "Bare Hands", armor: "Rags", relic: "None" }
      : { weapon: "[System Pending]", armor: "[System Pending]", relic: "None" };

    const finalStartingPlayer: PlayerProfile = {
      ...player,
      gear: initialGear,
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
          narrationStyle,
          userAccessKey: accessKey,
          storyContext: currentStory,
          activeSynergies: activeRelicSynergies,
        }),
      });

      if (!res.ok) {
        throw new Error("Prologue generation request returned error.");
      }

      const data = await res.json();
      if (data._userStats) {
        setUserAuth(data._userStats);
      }

      const activeSpeaker = data.speaker || chosen.speaker;
      const initialAffection = typeof data.initial_affection === "number" ? data.initial_affection : 15;
      const activeExpression = data.expression_key || chosen.expressionKey || "neutral";
      const initialSprite = getSpriteSrc(activeSpeaker, activeExpression);
      const openingPrologueText = `${data.scene_setup || chosen.sceneSetup}\n\n"${data.dialogue || chosen.dialogue}"`;

      setParty((prevParty) =>
        prevParty.map((comp) => {
          const isSelected = comp.name.toLowerCase().includes(activeSpeaker.toLowerCase());
          return {
            ...comp,
            isPresent: isSelected,
            encountered: isSelected, // Only the starting heroine is known initially!
            affection: isSelected ? initialAffection : comp.affection,
            expressionKey: isSelected ? activeExpression : "neutral",
          };
        })
      );

      setGameState({
        speaker: activeSpeaker,
        location: data.location || chosen.location,
        dialogue: data.dialogue || chosen.dialogue,
        mood: data.initial_mood || "Guarded & Observant",
        bgImage: initialBg,
        presentCompanions: [activeSpeaker],
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

      const activeOpeningChoices = data.opening_choices && data.opening_choices.length === 4 ? data.opening_choices : chosen.choices;
      setChoices(activeOpeningChoices);

      const initPartyState = party.map((comp) => {
        const isSelected = comp.name.toLowerCase().includes(activeSpeaker.toLowerCase());
        return {
          ...comp,
          isPresent: isSelected,
          encountered: isSelected,
          affection: isSelected ? initialAffection : comp.affection,
          expressionKey: isSelected ? activeExpression : "neutral",
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
            dialogue: data.dialogue || chosen.dialogue,
            mood: data.initial_mood || "Guarded & Observant",
            bgImage: initialBg,
            presentCompanions: [activeSpeaker],
          },
          party: initPartyState,
          player: finalStartingPlayer,
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
      const openingPrologueText = `${chosen.sceneSetup}\n\n"${chosen.dialogue}"`;

      setParty((prevParty) =>
        prevParty.map((comp) => {
          const isSelected = comp.name.toLowerCase().includes(chosen.speaker.toLowerCase());
          return {
            ...comp,
            isPresent: isSelected,
            encountered: isSelected,
            affection: isSelected ? 15 : comp.affection,
            expressionKey: isSelected ? chosen.expressionKey : "neutral",
          };
        })
      );

      setGameState({
        speaker: chosen.speaker,
        location: chosen.location,
        dialogue: chosen.dialogue,
        mood: "Guarded & Observant",
        bgImage: initialBg,
        presentCompanions: [chosen.speaker],
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
      setChoices(chosen.choices);

      const fallbackPartyState = party.map((comp) => {
        const isSelected = comp.name.toLowerCase().includes(chosen.speaker.toLowerCase());
        return {
          ...comp,
          isPresent: isSelected,
          encountered: isSelected,
          affection: isSelected ? 15 : comp.affection,
          expressionKey: isSelected ? chosen.expressionKey : "neutral",
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
            dialogue: chosen.dialogue,
            mood: "Guarded & Observant",
            bgImage: initialBg,
            presentCompanions: [chosen.speaker],
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
        setIsConfigured(true);
        setIsTransitioning(null);
        performAutoSave({
          player: finalStartingPlayer,
          choices: chosen.choices,
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
    };

    try {
      await saveGameSlot(slotId, payload);
      setSavedSlots((prev) => ({ ...prev, [slotId]: payload }));
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
  }) => {
    if (!autoSaveEnabled) return;

    setIsAutoSaving(true);
    try {
      const currentAvatar = override?.playerAvatar !== undefined ? override.playerAvatar : playerAvatar;
      const finalPlayer = override?.player || playerRef.current || player;
      const finalGameState = override?.gameState || gameState;
      const finalParty = override?.party || party;
      const finalMemories = override?.memories || memories;
      const finalChatLog = override?.chatLog || chatLog;
      const finalSystemState = override?.systemState || systemState;
      const finalChoices = override?.choices || choices;
      const finalVisitedNodes = override?.visitedNodes || visitedStoryNodes;
      const finalPrologueId = override?.selectedPrologueId || prologues[selectedPrologue]?.id;

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
      };

      await saveGameSlot(0, payload);
      setSavedSlots((prev) => ({ ...prev, [0]: payload }));

      setShowAutoSaveIndicator(true);
      setTimeout(() => setShowAutoSaveIndicator(false), 2400);
    } catch (err) {
      console.warn("Auto-save failed silently:", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleNavigateToTrials = async () => {
    soundEffects.playClick();

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

    router.push(`/trials?storyId=${encodeURIComponent(currentStory.id)}&returnTo=${encodeURIComponent(returnUrl)}`);
  };

  const handleLoadSlot = async (slotId: number, explicitData?: SaveSlotData) => {
    const data = explicitData || savedSlots[slotId] || (await loadGameSlot(slotId));
    if (!data) return;

    soundEffects.playIntroBell();
    isResumingSaveRef.current = true;

    // Auto-hydrate items from Multiverse Codex in case the save lacked image URLs
    let loadedPlayer = data.player;
    if (loadedPlayer && Array.isArray(loadedPlayer.inventory) && loadedPlayer.inventory.length > 0) {
      try {
        const { hydrated, updatedCount } = await hydrateInventoryItems(
          data.storyId || currentStory.id,
          loadedPlayer.inventory
        );
        if (updatedCount > 0) {
          loadedPlayer = { ...loadedPlayer, inventory: hydrated };
        }
      } catch (err) {
        console.warn("Failed to hydrate loaded inventory from codex:", err);
      }
    }

    const loadedParty = data.party
      ? (data.party as any[]).map((c: any) => ({
          ...c,
          encountered: typeof c.encountered === "boolean" ? c.encountered : (c.isPresent || c.affection !== 50),
        }))
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

    playerRef.current = loadedPlayer;
    setPlayer(loadedPlayer);
    setPlayerAvatar(data.playerAvatar);
    setGameState(sanitizedGameState);
    setDisplayedText(sanitizedGameState.dialogue || "");
    setParty(loadedParty);
    setMemories(data.memories);
    setChatLog(data.chatLog);
    if (data.systemState) {
      setSystemState(data.systemState);
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

    if (data.choices && Array.isArray(data.choices) && data.choices.length === 4) {
      setChoices(data.choices);
    } else {
      setChoices(sceneDefaultChoices);
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
      }),
    })
      .then((res) => res.json())
      .then((choiceData) => {
        if (choiceData && Array.isArray(choiceData.choices) && choiceData.choices.length === 4) {
          setChoices(choiceData.choices);
          // Persist the freshly generated choices into the saved slot in state
          setSavedSlots((prev) => {
            const currentSlot = prev[slotId];
            if (!currentSlot) return prev;
            return {
              ...prev,
              [slotId]: {
                ...currentSlot,
                choices: choiceData.choices,
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

  useEffect(() => {
    if (dialogueFeedRef.current) {
      dialogueFeedRef.current.scrollTop = dialogueFeedRef.current.scrollHeight;
    }
  }, [chatLog, displayedText]);

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
    const step = Math.max(3, Math.ceil(target.length / 40));
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
    }, 20);

    return () => clearInterval(interval);
  }, [gameState.dialogue]);

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };

  const handleSaveEdit = (id: string) => {
    setChatLog((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: editingText } : msg))
    );

    const lastMsg = chatLog[chatLog.length - 1];
    if (lastMsg && lastMsg.id === id && lastMsg.sender === "character") {
      setGameState((prev) => ({ ...prev, dialogue: editingText }));
      setDisplayedText(editingText);
    }

    setEditingMessageId(null);
    setEditingText("");
  };

  const handleRegenerateTurn = async () => {
    if (isLoading || chatLog.length < 2) return;

    const lastCharacterMsg = chatLog[chatLog.length - 1];
    const lastUserMsg = chatLog[chatLog.length - 2];

    if (lastCharacterMsg.sender !== "character" || lastUserMsg.sender !== "user") return;

    // Prune the latest character turn and replay action
    const previousHistory = chatLog.slice(0, -2);
    setChatLog(previousHistory);

    await sendAction(lastUserMsg.text, true);
  };

  const sendAction = async (rawAction: string, isCustom: boolean = false) => {
    if (!rawAction.trim() || isLoading) return;

    if (!accessKey) {
      setShowAuthModal(true);
      setAuthError("Please enter a valid access key before taking action.");
      return;
    }

    const formattedPayload = isOOCMode ? `[OOC: ${rawAction.trim()}]` : rawAction.trim();
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setIsLoading(true);
    setChoices([]);

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
          gameState,
          partyMembers: party,
          playerProfile: player,
          playerAvatarBase64: playerAvatar,
          narrationStyle,
          plotMemories: memories,
          userAccessKey: accessKey,
          systemState,
          storyContext: currentStory,
          recentHistory: chatLog.slice(-14).map((m) => ({
            speaker: m.speakerName,
            text: m.text,
          })),
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

      // 1. Determine presence
      const currentPresentComps = party.filter((c) => c.isPresent);
      const isCurrentlyAlone = currentPresentComps.length === 0;

      // 2. Resolve present companions list from state updates
      const rawPresentList = data.state_updates?.present_companions;
      const presentList: string[] = Array.isArray(rawPresentList)
        ? rawPresentList
        : (isCurrentlyAlone ? [] : currentPresentComps.map((c) => c.name));

      const isSceneAlone = presentList.length === 0;

      // 3. Sanitize speakerName: PROHIBIT player.name as visual novel speaker
      let rawSpeaker = (data.speaker || gameState.speaker || (isSceneAlone ? "Narrator" : "Companion")).trim();
      if (rawSpeaker.toLowerCase() === player.name.toLowerCase()) {
        rawSpeaker = isSceneAlone ? "Narrator" : (presentList[0] || currentPresentComps[0]?.name || "Narrator");
      }
      const speakerName = rawSpeaker;
      const narrative = data.narrative_text || gameState.dialogue;
      
      const playerText = isCustom ? formattedPayload : (data.player_execution || formattedPayload);
      
      const nextExpression = data.state_updates?.expression_key || "neutral";
      const nextLocation = data.state_updates?.current_location || gameState.location;
      const nextBg = getLocationBg(nextLocation);

      // 4. Affected companion and favor delta: absent heroines cannot gain/lose favor
      let rawAffected = data.state_updates?.affected_companion;
      if (rawAffected && rawAffected.trim().toLowerCase() === player.name.toLowerCase()) {
        rawAffected = null;
      }
      const affectedComp = rawAffected || (isSceneAlone ? null : speakerName);
      const isCompPhysicallyPresent = affectedComp
        ? presentList.some((p) => p.toLowerCase().includes(affectedComp.toLowerCase()))
        : false;

      const rawDelta = data.state_updates?.affection_delta;
      let effectiveDelta = 0;
      let hitCapNotice = false;
      let currentCap = 25;

      if (isCompPhysicallyPresent && typeof rawDelta === "number" && affectedComp) {
        currentCap = getCompanionCap(affectedComp);
        const compTarget = party.find((c) => c.name.toLowerCase().includes(affectedComp.toLowerCase()));
        const currentAff = compTarget ? compTarget.affection : 15;

        if (rawDelta > 0) {
          // Paced gradual gain: damp positive turn delta to maximum +2
          const pacedDelta = Math.min(2, rawDelta);

          if (currentAff >= currentCap && currentCap < 100) {
            // Already at or exceeding cap: locked by companion quest!
            effectiveDelta = 0;
            hitCapNotice = true;
          } else {
            const nextPossible = currentAff + pacedDelta;
            const finalCapped = Math.min(currentCap, nextPossible);
            effectiveDelta = Math.max(0, finalCapped - currentAff);
            if (nextPossible >= currentCap && currentCap < 100) {
              hitCapNotice = true;
            }
          }
        } else if (rawDelta < 0) {
          // Decreases allowed (capped at -4 to avoid instant collapse)
          effectiveDelta = Math.max(-4, rawDelta);
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
      }

      const newlyMet: string[] = Array.isArray(data.state_updates?.newly_encountered_heroines)
        ? data.state_updates.newly_encountered_heroines
        : [];

      setParty((prevParty) =>
        prevParty.map((comp) => {
          const isCurrentSpeaker = comp.name.toLowerCase().includes(speakerName.toLowerCase());
          const isAffected = affectedComp ? comp.name.toLowerCase().includes(affectedComp.toLowerCase()) : false;
          const isPresent = presentList.some((p) => comp.name.toLowerCase().includes(p.toLowerCase()));
          const isNewlyMet = newlyMet.some((n) => comp.name.toLowerCase().includes(n.toLowerCase()));

          const nowEncountered = comp.encountered || isCurrentSpeaker || isPresent || isAffected || isNewlyMet;
          const targetCap = getCompanionCap(comp.name);

          let updatedAffection = comp.affection;
          if (isAffected && isCompPhysicallyPresent && typeof delta === "number") {
            if (delta > 0) {
              updatedAffection = Math.min(targetCap, comp.affection + delta);
            } else if (delta < 0) {
              updatedAffection = Math.max(0, comp.affection + delta);
            }
          }

          return {
            ...comp,
            isPresent,
            encountered: nowEncountered,
            expressionKey: isCurrentSpeaker ? nextExpression : comp.expressionKey,
            affection: updatedAffection,
          };
        })
      );

      const playerMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "user",
        speakerName: player.name,
        text: playerText,
        timestamp: timeString,
        avatarSrc: playerAvatar || undefined,
      };

      const isAmbientSpeaker = ["narrator", "system", "inner monologue"].some((s) => speakerName.toLowerCase().includes(s));
      const companionMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "character",
        speakerName,
        text: narrative,
        timestamp: timeString,
        avatarSrc: isAmbientSpeaker ? undefined : getSpriteSrc(speakerName, nextExpression),
      };

      setChatLog((prev) => [...prev, playerMsg, companionMsg]);

      if (data.player_progression) {
        const prog = data.player_progression;
        let updatedInventory = [...playerRef.current.inventory];

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
                  const nextP = { ...prev, inventory: updated };
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

        let updatedGear = { ...playerRef.current.gear };
        if (prog.gear_granted && (prog.gear_granted.weapon || prog.gear_granted.armor)) {
          updatedGear = { ...updatedGear, ...prog.gear_granted };
        }

        let updatedAbilities = [...playerRef.current.abilities];
        let updatedAbilityDetails = { ...(playerRef.current.abilityDetails || {}) };
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

        const expGained = prog.exp_gained || 20;
        let newExp = playerRef.current.stats.exp + expGained;
        let newLevel = playerRef.current.level;
        let newMaxExp = playerRef.current.stats.maxExp;
        let newMaxHp = playerRef.current.stats.maxHp;
        let newMaxMp = playerRef.current.stats.maxMp;
        let newStr = playerRef.current.stats.str;
        let newDex = playerRef.current.stats.dex;
        let newInt = playerRef.current.stats.int;

        if (newExp >= playerRef.current.stats.maxExp) {
          newLevel += 1;
          newExp = newExp - playerRef.current.stats.maxExp;
          newMaxExp = newLevel * 100;
          newMaxHp += 20;
          newMaxMp += 10;
          newStr += 2;
          newDex += 2;
          newInt += 2;
          soundEffects.playQuestComplete();
          setAcquisitionAlert({
            id: `level_${Date.now()}`,
            type: "level",
            title: `LEVEL ADVANCEMENT (LV.${newLevel})`,
            subtitle: "+20 HP • +10 MP • +2 STR / DEX / INT",
          });
        }

        const nextPlayerState: PlayerProfile = {
          ...playerRef.current,
          level: newLevel,
          stats: {
            ...playerRef.current.stats,
            hp: Math.max(0, Math.min(newMaxHp, playerRef.current.stats.hp + (prog.hp_change || 0))),
            mp: Math.max(0, Math.min(newMaxMp, playerRef.current.stats.mp + (prog.mp_change || 0))),
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
          inventory: updatedInventory,
        };

        playerRef.current = nextPlayerState;
        setPlayer(nextPlayerState);
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
          let updatedActive = [...prevSys.activeQuests];
          let updatedCompleted = [...prevSys.completedQuests];
          let updatedDirectives = [...prevSys.systemDirectives];

          // 1. Process quest updates
          if (Array.isArray(sysUpdates.quest_updates) && sysUpdates.quest_updates.length > 0) {
            sysUpdates.quest_updates.forEach((update: any) => {
              if (!update) return;
              const updateId = (update.quest_id || "").toLowerCase().trim();
              let qIndex = updatedActive.findIndex(
                (q) =>
                  q.id.toLowerCase() === updateId ||
                  q.title.toLowerCase().includes(updateId) ||
                  updateId.includes(q.id.toLowerCase()) ||
                  updateId.includes(q.title.toLowerCase())
              );

              // If only 1 active quest, fall back to it if not strictly matched
              if (qIndex === -1 && updatedActive.length === 1) {
                qIndex = 0;
              }

              if (qIndex !== -1) {
                const targetQuest = { ...updatedActive[qIndex] };
                let anyNewlyCompleted = false;

                // Update objectives
                if (Array.isArray(update.completed_objective_indices)) {
                  targetQuest.objectives = targetQuest.objectives.map((obj, idx) => {
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

                // Check if all objectives are completed or status is completed
                const allObjectivesDone =
                  targetQuest.objectives.length > 0 && targetQuest.objectives.every((o) => o.completed);
                const isNowCompleted = update.status === "completed" || allObjectivesDone;

                if (isNowCompleted) {
                  targetQuest.status = "completed";
                  targetQuest.objectives = targetQuest.objectives.map((o) => ({ ...o, completed: true }));

                  // Move to completed
                  updatedActive.splice(qIndex, 1);
                  updatedCompleted.unshift(targetQuest);

                  // Check if targetQuest is a companion milestone quest
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
                      id: `breakthrough_${Date.now()}`,
                      type: "quest_completed",
                      title: "HEART RESONANCE BREAKTHROUGH",
                      subtitle: `${canonicalName}'s emotional barrier shattered! Affection cap raised from ${thresholdNum}% to ${nextCap}%.`,
                      difficulty: targetQuest.difficulty,
                    });
                    updatedDirectives.unshift(`[SYSTEM: Heart Resonance Breakthrough - ${canonicalName} Cap Raised to ${nextCap}%]`);
                  }

                  // Grant quest rewards if any
                  if (targetQuest.rewards) {
                    const rExp = targetQuest.rewards.exp || 0;
                    if (rExp > 0) {
                      setPlayer((prevP) => ({
                        ...prevP,
                        stats: {
                          ...prevP.stats,
                          exp: prevP.stats.exp + rExp,
                        },
                      }));
                    }
                  }

                  soundEffects.playQuestComplete();
                  setSystemToast({
                    id: `quest_complete_${Date.now()}`,
                    type: "quest_completed",
                    title: `QUEST CLEARED: ${targetQuest.title}`,
                    subtitle:
                      targetQuest.progressNote ||
                      "All objective parameters verified. Clearance rewards archived.",
                    difficulty: targetQuest.difficulty,
                    timestamp: "Just now",
                  });
                  questNotificationShown = true;
                  updatedDirectives.unshift(`[SYSTEM: Scenario Cleared - '${targetQuest.title}']`);
                } else {
                  updatedActive[qIndex] = targetQuest;

                  if (anyNewlyCompleted) {
                    soundEffects.playSystemNotification();
                    const completedCount = targetQuest.objectives.filter((o) => o.completed).length;
                    const totalCount = targetQuest.objectives.length;
                    setSystemToast({
                      id: `quest_update_${Date.now()}`,
                      type: "quest_updated",
                      title: `OBJECTIVE UPDATED (${completedCount}/${totalCount})`,
                      subtitle: `${targetQuest.title}: ${targetQuest.progressNote || "Objective progress confirmed."}`,
                      difficulty: targetQuest.difficulty,
                      timestamp: "Just now",
                    });
                    questNotificationShown = true;
                    updatedDirectives.unshift(
                      `[SYSTEM: Objective Complete - '${targetQuest.title}' (${completedCount}/${totalCount})]`
                    );
                  }
                }
              }
            });
          }

          // 2. Process new quest assignment
          if (sysUpdates.new_quest && typeof sysUpdates.new_quest === "object" && sysUpdates.new_quest.title) {
            const rawQ = sysUpdates.new_quest;
            const newQ: SystemQuest = {
              id: rawQ.id || `quest_${Date.now()}`,
              title: rawQ.title || "Unforeseen Scenario",
              description: rawQ.description || "System protocol initiated.",
              type: rawQ.type || "scenario",
              difficulty: rawQ.difficulty || "C",
              objectives: Array.isArray(rawQ.objectives)
                ? rawQ.objectives.map((o: any) => ({
                    text: typeof o === "string" ? o : o.text || "Investigate anomalies",
                    completed: Boolean(o?.completed),
                  }))
                : [{ text: "Investigate current surroundings", completed: false }],
              rewards: rawQ.rewards || { exp: 50 },
              status: "active",
            };

            const isDuplicate =
              updatedActive.some((q) => q.id === newQ.id || q.title.toLowerCase() === newQ.title.toLowerCase()) ||
              updatedCompleted.some((q) => q.id === newQ.id || q.title.toLowerCase() === newQ.title.toLowerCase());

            if (!isDuplicate) {
              updatedActive.push(newQ);
              updatedDirectives.unshift(`[SYSTEM: New Scenario Assigned - '${newQ.title}']`);

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

          // 3. Plausibility shift
          let nextPlausibility = prevSys.plausibility;
          if (typeof sysUpdates.plausibility_delta === "number" && !isNaN(sysUpdates.plausibility_delta)) {
            nextPlausibility = Math.max(0, Math.min(100, prevSys.plausibility + sysUpdates.plausibility_delta));
          }
          const nextTier: PlausibilityTier =
            nextPlausibility >= 70
              ? "Stable"
              : nextPlausibility >= 40
              ? "Strained"
              : nextPlausibility >= 20
              ? "Volatile"
              : "Critical";

          // 4. System announcement
          if (sysUpdates.system_announcement && typeof sysUpdates.system_announcement === "string") {
            const announcement = sysUpdates.system_announcement.trim();
            if (announcement.length > 0) {
              updatedDirectives.unshift(announcement);
              if (!questNotificationShown) {
                soundEffects.playSystemNotification();
              }
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

          return {
            plausibility: nextPlausibility,
            plausibilityTier: nextTier,
            activeQuests: updatedActive,
            completedQuests: updatedCompleted,
            systemDirectives: updatedDirectives.slice(0, 30),
          };
        });
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
        const validChoices = data.suggested_choices.filter(
          (c: any) => typeof c === "string" && !c.includes("state_updates") && !c.includes("{")
        );
        setChoices(validChoices);
        resolvedChoices = validChoices;
      }

      // Record Visited Timeline Anchor for Flowchart (Task 2)
      const turnNodeKey = `turn_node_${Date.now()}`;
      const newTimelineAnchor: VisitedStoryNode = {
        id: turnNodeKey,
        nodeKey: turnNodeKey,
        title: `${nextLocation}: ${speakerName}`,
        speaker: speakerName,
        location: nextLocation,
        visitedAt: new Date().toISOString(),
        choiceTaken: isCustom ? formattedPayload : (data.player_execution || formattedPayload),
        affectionSnapshot: party.reduce((acc, c) => ({ ...acc, [c.name]: c.affection }), {}),
        gameStateSnapshot: {
          gameState: {
            speaker: speakerName,
            dialogue: narrative,
            location: nextLocation,
            bgImage: nextBg,
            mood: data.state_updates?.mood ?? gameState.mood,
            presentCompanions: presentList,
          },
          party: party,
          player: playerRef.current,
          systemState: systemState,
          memories: nextMemories,
          chatLog: [...chatLog, playerMsg, companionMsg],
          choices: resolvedChoices,
        },
        isAnchor: true,
        anchorLabel: `Turn Anchor: ${nextLocation}`,
      };
      setVisitedStoryNodes((prev) => [...prev, newTimelineAnchor]);

      // Affection Milestones (25%, 50%, 75%, 100%) & Companion Quests (Task 3)
      if (typeof delta === "number" && delta > 0 && affectedComp) {
        const compObj = party.find((c) => c.name.toLowerCase().includes(affectedComp.toLowerCase()));
        if (compObj) {
          const oldAffection = compObj.affection;
          const newAffection = Math.min(100, oldAffection + delta);
          [25, 50, 75, 100].forEach((threshold) => {
            if (
              oldAffection < threshold &&
              newAffection >= threshold &&
              !(companionMilestones[affectedComp] || []).includes(threshold)
            ) {
              setCompanionMilestones((prev) => ({
                ...prev,
                [affectedComp]: [...(prev[affectedComp] || []), threshold],
              }));

              const questDifficulty = threshold >= 100 ? "Calamity" : threshold >= 75 ? "S" : threshold >= 50 ? "A" : "B";
              const questTitle = `[COMPANION QUEST] ${affectedComp}: ${threshold}% Heart Resonance`;
              const questDesc = `${affectedComp} has reached the ${threshold}% emotional barrier! Her favor is locked at ${threshold}% until this crisis is resolved. Complete this scenario to shatter her defenses and synthesize a bespoke CG illustration.`;

              setSystemState((prevSys) => ({
                ...prevSys,
                activeQuests: [
                  {
                    id: `milestone_${affectedComp.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${threshold}`,
                    title: questTitle,
                    description: questDesc,
                    type: "scenario",
                    difficulty: questDifficulty as any,
                    objectives: [
                      { text: `Complete private audience with ${affectedComp}`, completed: false },
                      { text: `Overcome emotional vulnerability or planar crisis with ${affectedComp}`, completed: false },
                    ],
                    rewards: { exp: threshold * 5, gold: threshold * 10, items: [`${affectedComp}'s Keepsake`] },
                    status: "active",
                  },
                  ...prevSys.activeQuests,
                ],
                systemDirectives: [`[SYSTEM: Companion Arc Locked - '${questTitle}' (Favor Capped at ${threshold}%)]`, ...prevSys.systemDirectives],
              }));

              soundEffects.playQuestComplete();
              pushNotification({
                id: `milestone_${Date.now()}`,
                type: "quest_assigned",
                title: "ROMANCE MILESTONE QUEST UNLOCKED",
                subtitle: `${affectedComp} favor reached ${threshold}%! Complete her Companion Quest to unlock further affection.`,
                difficulty: questDifficulty,
              });
            }
          });
        }
      }

      // Auto-Save after every successful turn
      performAutoSave({
        player: playerRef.current,
        memories: nextMemories,
        chatLog: [...chatLog, playerMsg, companionMsg],
        gameState: {
          speaker: speakerName,
          dialogue: narrative,
          location: nextLocation,
          bgImage: nextBg,
          mood: data.state_updates?.mood ?? gameState.mood,
          presentCompanions: presentList,
        },
        choices: resolvedChoices,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAction.trim() || isLoading) return;
    const text = inputAction;
    setInputAction("");
    sendAction(text, true);
  };

  const handleCompleteQuest = (questId: string) => {
    setSystemState((prevSys) => {
      const activeIdx = prevSys.activeQuests.findIndex((q) => q.id === questId);
      if (activeIdx === -1) return prevSys;

      const targetQuest = { ...prevSys.activeQuests[activeIdx], status: "completed" as const };
      targetQuest.objectives = targetQuest.objectives.map((o) => ({ ...o, completed: true }));

      const nextActive = [...prevSys.activeQuests];
      nextActive.splice(activeIdx, 1);
      const nextCompleted = [targetQuest, ...prevSys.completedQuests];

      // Grant rewards if any
      if (targetQuest.rewards?.exp) {
        setPlayer((prevP) => ({
          ...prevP,
          stats: { ...prevP.stats, exp: prevP.stats.exp + targetQuest.rewards!.exp },
        }));
      }

      // Check if targetQuest is a companion milestone quest
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
      }

      return {
        ...prevSys,
        activeQuests: nextActive,
        completedQuests: nextCompleted,
        systemDirectives: [`[SYSTEM: Scenario Cleared - '${targetQuest.title}']`, ...prevSys.systemDirectives],
      };
    });
  };

  const presentComps = party.filter((c) => c.isPresent);
  const isProtagonistAlone = presentComps.length === 0;
  const isSpeakingHeroine = party.find((c) => c.name.toLowerCase().includes(gameState.speaker.toLowerCase()));
  const activeSpeakerComp = isSpeakingHeroine || (presentComps.length > 0 ? presentComps[0] : party[0]);
  const heroineForMeter = isProtagonistAlone ? null : (isSpeakingHeroine || (presentComps.length > 0 ? presentComps[0] : null));

  const renderSaveModal = () => (
    showSaveModal && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-sky-400" /> Character Save Slots
            </h2>
            <button onClick={() => { setShowSaveModal(false); setConfirmDeleteSlot(null); }} className="text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
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

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {/* AUTO-SAVE (SLOT 0) */}
            {(() => {
              const autoSave = savedSlots[0];
              return (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-4 relative overflow-hidden shadow-lg">
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

                  <div className="flex items-center gap-2">
                    {autoSave && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadSlot(0)}
                          className="px-3.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 rounded-xl text-xs font-semibold text-emerald-200 cursor-pointer transition-all shadow-md"
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
                <div key={slot} className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-4">
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
                  <div className="flex items-center gap-2">
                    {isConfigured && (
                      <button
                        onClick={() => handleSaveSlot(slot)}
                        className="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 rounded-xl text-xs font-semibold text-amber-200 cursor-pointer transition-all"
                      >
                        Save
                      </button>
                    )}
                    {s && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLoadSlot(slot)}
                          className="px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/40 rounded-xl text-xs font-semibold text-sky-200 cursor-pointer transition-all"
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
    )
  );

  const renderAuthModal = () => (
    showAuthModal && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
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
                    className="w-full bg-zinc-900 border border-white/15 rounded-xl pl-4 pr-11 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500/80"
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
              "{isTransitioning.quote}"
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

        <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
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
                    onClick={() => {
                      soundEffects.playClick();
                      router.push("/codex");
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Open Multiverse Codex"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Codex
                  </button>

                  <a
                    href={generatedScene.imageUrl}
                    download={`${currentStory.id}_scene_${Date.now()}.png`}
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

        <div className="w-full max-w-sm bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
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
          className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150"
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

  // 1. OPENING / WELCOME SPLASH SCREEN (FIRST LOAD)
  if (!isConfigured && !hasSeenWelcome) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-black font-sans flex flex-col items-center justify-center select-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 brightness-[0.38] contrast-125 scale-105 pointer-events-none"
          style={{ backgroundImage: `url("${DEFAULT_BG}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80 pointer-events-none" />
        <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

        <AtmosphericParticles location="Imperial Capital Imperium" intensity="intense" />

        <div className="absolute top-5 left-5 z-30 flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
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
            <span>5 Heroines</span>
            <span>•</span>
            <span>AI Dynamic Lore</span>
            <span>•</span>
            <span>Astra Continent</span>
          </div>
        </div>

        {renderSaveModal()}
        {renderAuthModal()}
      </div>
    );
  }

  // 2. CHARACTER CREATOR SCREEN
  if (!isConfigured) {
    return (
      <div className="relative h-screen w-screen bg-zinc-950 flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-[0.22] contrast-125 pointer-events-none"
          style={{ backgroundImage: `url("${DEFAULT_BG}")` }}
        />
        <div className="absolute inset-0 cinematic-vignette pointer-events-none" />
        <AtmosphericParticles location="Imperial Capital Imperium" intensity="gentle" />

        <div className="relative z-10 w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="px-2.5 py-1.5 rounded-xl border border-white/10 hover:border-white/30 text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer font-mono"
                title="Return to Story Catalogue"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Catalogue</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                <Sparkles className="text-rose-400 w-5 h-5 animate-pulse" /> {currentStory.title.toUpperCase()}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleAudio}
                className="px-3 py-1.5 rounded-xl border border-white/15 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowAuthModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-zinc-300 hover:text-white hover:border-purple-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>{userAuth ? userAuth.name.split(" ")[0] : "Access Key"}</span>
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowSaveModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-white/15 text-xs text-zinc-300 hover:text-white hover:border-rose-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-sky-400" /> Load Game
              </button>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/15 flex items-center justify-center shrink-0">
              {playerAvatar && playerAvatar.trim() ? (
                <img src={playerAvatar} alt="Character Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-zinc-600" />
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-mono text-zinc-300 block mb-1">Character Portrait (Visual AI Input)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-600/30 file:text-rose-200 hover:file:bg-rose-600/50 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">OpenRouter will inspect your image to describe your traits in narrative turns.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">Character Name</label>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => setPlayer({ ...player, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">Custom Class / Archetype</label>
                <input
                  type="text"
                  placeholder="e.g., Regressed Spellblade..."
                  value={player.role}
                  onChange={(e) => setPlayer({ ...player, role: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-rose-500 focus:outline-none placeholder-zinc-700"
                />
              </div>
            </div>

            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-mono text-zinc-400">Attribute Allocation</label>
                <span className="text-xs font-mono font-bold text-sky-400">Points: {statPoints}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["str", "dex", "int"].map((stat) => (
                  <div key={stat} className="flex items-center justify-between bg-zinc-900 rounded-xl p-2 border border-white/5">
                    <span className="text-xs font-mono text-zinc-300 uppercase">{stat}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleStatChange(stat as any, -1)} className="w-5 h-5 flex items-center justify-center bg-zinc-800 rounded hover:bg-zinc-700 text-white cursor-pointer">-</button>
                      <span className="text-sm font-bold text-white w-4 text-center">{player.stats[stat as keyof PlayerStats]}</span>
                      <button onClick={() => handleStatChange(stat as any, 1)} className="w-5 h-5 flex items-center justify-center bg-zinc-800 rounded hover:bg-zinc-700 text-white cursor-pointer">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-2">Starting Loadout</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGearPreference("system")}
                  className={`flex-1 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${gearPreference === "system" ? "bg-rose-900/40 border-rose-500 text-rose-200" : "bg-zinc-950 border-white/10 text-zinc-500 hover:border-white/30"}`}
                >
                  System Assigned
                </button>
                <button
                  type="button"
                  onClick={() => setGearPreference("none")}
                  className={`flex-1 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${gearPreference === "none" ? "bg-amber-900/40 border-amber-500 text-amber-200" : "bg-zinc-950 border-white/10 text-zinc-500 hover:border-white/30"}`}
                >
                  Unarmed & Unarmored
                </button>
              </div>
            </div>

            {/* STARTING ABILITIES (LLM ROLL) */}
            <div className="bg-zinc-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Starting Abilities (System Roll)
                  </label>
                  <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                    Awaken 1-2 random starting abilities generated by the LLM for <span className="text-zinc-300 font-mono">{player.role || "your class"}</span>.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {player.abilities.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAbilities}
                      className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                      title="Clear starting abilities"
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
                    <span>{isRollingAbilities ? "Synthesizing..." : player.abilities.length > 0 ? "Reroll Abilities" : "Roll Abilities"}</span>
                  </button>
                </div>
              </div>

              {/* Display Rolled Abilities */}
              {player.abilities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {player.abilities.map((abName, i) => {
                    const detail = player.abilityDetails?.[abName];
                    return (
                      <div
                        key={i}
                        onClick={() => handleInspectAbility(abName)}
                        className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-amber-500/30 hover:border-amber-400/60 p-3 rounded-xl transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                        title="Click to view full ability description"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              {abName}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/60 text-amber-300 border border-amber-500/20">
                              {detail?.type || "Active"}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {detail?.description || "Click to inspect full ability mechanics..."}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 mt-2 border-t border-white/5">
                          <span className="text-sky-400">{detail?.cost || "Cost: 10 MP"}</span>
                          <span className="text-zinc-400">{detail?.cooldown || "Instant"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-2.5 px-3 border border-dashed border-white/10 rounded-xl bg-zinc-950/40">
                  <p className="text-xs text-zinc-500 font-sans italic">
                    Optional: Click "Roll Abilities" to let the System generate 1-2 random starting techniques based on <span className="text-zinc-300 font-mono">{player.role || "your class"}</span>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1">Narration Atmosphere & Tone</label>
            <select
              value={narrationStyle}
              onChange={(e) => setNarrationStyle(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-rose-500 focus:outline-none"
            >
              <option>Grimdark & Atmospheric (Tense, visceral, sensory)</option>
              <option>Light Novel High Fantasy (Dynamic pacing, witty banter, heroic)</option>
              <option>Noir Arcana (Brooding, cynical, sharp monologues)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-2">Select Starting Scenario & Companion</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
              {prologues.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPrologue(i)}
                  className={`p-3.5 text-left rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    selectedPrologue === i 
                      ? "bg-rose-950/40 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/30" 
                      : "bg-zinc-950 border-white/10 text-zinc-400 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">{p.location}</span>
                    </div>
                    <p className="font-semibold text-sm text-zinc-200">{p.title}</p>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{p.dialogue}</p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                    {p.choices.length} Interactive Entry Vectors
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" /> Enter {currentStory.worldContext?.settingName || currentStory.title || "Astra Continent"}
          </button>
        </div>

        {renderSaveModal()}
        {renderAuthModal()}
        {renderTransitionOverlay()}
        {renderAbilityModal()}
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-zinc-950 font-sans">
      
      <div 
        key={gameState.bgImage}
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out brightness-75 contrast-105 pointer-events-none select-none"
        style={{ backgroundImage: `url("${gameState.bgImage}")` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />
      <div className="absolute inset-0 cinematic-vignette pointer-events-none z-10" />
      <AtmosphericParticles location={gameState.location} />

      <GameNotificationStack
        notifications={notifications}
        onDismiss={dismissNotification}
        onOpenSystemWindow={() => setShowSystemModal(true)}
        onInspectItem={(item) => handleInspectItem(item)}
      />

      {/* TOP HUD */}
      <header className="absolute top-3 inset-x-3 sm:inset-x-6 md:inset-x-8 z-20 flex items-center justify-between gap-3 pointer-events-auto select-none">
        
        {/* LEFT CLUSTER: Navigation, Player Anchor & LitRPG System */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 bg-black/80 hover:bg-black/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 hover:border-white/30 shadow-lg text-xs text-zinc-300 transition-all cursor-pointer"
            title="Return to Story Catalogue"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            <span className="hidden md:inline font-mono text-[11px]">Catalogue</span>
          </button>

          {/* Character Identity & Status Card */}
          <button
            onClick={() => setShowPlayerSheet(true)}
            className="flex items-center gap-2.5 bg-black/80 hover:bg-black/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 hover:border-rose-500/50 shadow-lg text-xs text-zinc-200 transition-all cursor-pointer group"
            title="Open Character Sheet & Inventory"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-600/30 border border-rose-500/60 flex items-center justify-center font-bold text-rose-300 shrink-0">
              {playerAvatar && playerAvatar.trim() ? (
                <img src={playerAvatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                player.name.charAt(0)
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold leading-tight text-white group-hover:text-rose-300 transition-colors">
                {player.name}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">Lv.{player.level} {player.role}</p>
            </div>
            <div className="hidden lg:flex flex-col gap-0.5 pl-1">
              <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
                <Heart className="w-2.5 h-2.5 fill-rose-500" /> {player.stats.hp}/{player.stats.maxHp}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-sky-400 font-mono">
                <Zap className="w-2.5 h-2.5 fill-sky-500" /> {player.stats.mp}/{player.stats.maxMp}
              </div>
            </div>
          </button>

          {/* SYSTEM Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setShowSystemModal(true);
            }}
            className={`bg-black/80 hover:bg-black/95 backdrop-blur-md px-3 py-2 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 relative shadow-lg ${
              systemState.activeQuests.length > 0
                ? "border-rose-500/60 text-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.3)] hover:border-rose-400"
                : "border-white/10 text-zinc-300 hover:border-rose-500/40 hover:text-white"
            }`}
            title="Open System Administrator Interface & Quests"
          >
            <Terminal className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider hidden sm:inline">SYSTEM</span>
            {systemState.activeQuests.length > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-rose-600 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                {systemState.activeQuests.length}
              </span>
            )}
          </button>
        </div>

        {/* CENTER CLUSTER: Spatial Location / Realm Anchor */}
        <div className="flex-1 flex justify-center max-w-sm md:max-w-md lg:max-w-lg min-w-0">
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-2 bg-black/80 hover:bg-black/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 hover:border-emerald-500/50 shadow-lg text-xs text-zinc-200 transition-all cursor-pointer group min-w-0 max-w-full"
            title="View Area Map & Sectors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-[11px] md:text-xs text-emerald-300 truncate">{gameState.location}</span>
            <Compass className="w-3 h-3 text-zinc-500 shrink-0 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* RIGHT CLUSTER: Auto-Save Pulse & Unified Glass Command Dock */}
        <div className="flex items-center gap-2 shrink-0">
          {showAutoSaveIndicator && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_15px_rgba(52,211,153,0.3)] backdrop-blur-md">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Auto-saved</span>
            </div>
          )}

          <div className="flex items-center bg-black/80 backdrop-blur-md border border-white/10 p-1 rounded-2xl shadow-lg shrink-0 gap-0.5">
            {/* Interactive Flowchart Button (Task 2) */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowFlowchartModal(true);
              }}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-cyan-950/40 text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer flex items-center gap-1.5"
              title="Interactive Flowchart & Timeline Anchors"
            >
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline text-[10px] font-mono">Flowchart</span>
            </button>

            {/* LitRPG Trials Link (Task 4) */}
            <button
              onClick={handleNavigateToTrials}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-blue-950/40 text-blue-400 hover:text-blue-300 transition-all cursor-pointer flex items-center gap-1.5"
              title="LitRPG Daily Roguelite Trials (Auto-saves story progress)"
            >
              <Swords className="w-4 h-4 text-blue-400" />
              <span className="hidden xl:inline text-[10px] font-mono">Trials</span>
            </button>

            {/* Share World & Seed (Task 5) */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowShareModal(true);
              }}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-purple-950/40 text-purple-400 hover:text-purple-300 transition-all cursor-pointer flex items-center gap-1.5"
              title="Share Multiverse Setup & Card"
            >
              <Share2 className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline text-[10px] font-mono">Share</span>
            </button>

            {/* Illustrate Scene (Nano Banana 2.1) */}
            <button
              onClick={() => handleGenerateSceneCG(false)}
              disabled={isGeneratingScene}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1.5 group disabled:opacity-50"
              title="Generate Cinematic Scene CG (Nano Banana 2.1)"
            >
              <Sparkles className="w-4 h-4 text-rose-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden xl:inline text-[11px] font-mono font-bold">Illustrate</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

            {/* Party */}
            <button
              onClick={() => setShowPartyDrawer(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
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
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
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
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1"
              title="Save or Load Game"
            >
              <Save className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

            {/* Realm Access Key & Quota */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-purple-950/40 text-purple-300 hover:text-purple-200 transition-all cursor-pointer flex items-center gap-1"
              title={userAuth ? `Active Realm Key: ${userAuth.name} (${userAuth.remainingTurns === -1 ? "∞" : `${userAuth.remainingTurns} turns remaining`})` : "Configure Access Key"}
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden lg:inline text-[10px] font-mono">
                {userAuth ? (userAuth.remainingTurns === -1 ? "∞" : userAuth.remainingTurns) : "Key"}
              </span>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={handleToggleAudio}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
            </button>
          </div>
        </div>

      </header>

      {/* DIALOGUE & SPRITE TERMINAL */}
      <div className="absolute top-20 bottom-3 inset-x-3 sm:inset-x-6 md:inset-x-10 lg:inset-x-16 z-30 flex flex-col justify-end gap-2 pointer-events-none">
        <div className="pointer-events-auto relative bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[160px] max-h-[46vh] sm:max-h-[50vh] md:max-h-[54vh]">
          <div className="absolute -top-1 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/70 to-transparent" />

          <div className="shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 select-none">
            <div className="flex items-center gap-2.5">
              {/* Speaker Badge */}
              {isSpeakingHeroine ? (
                <div className="inline-flex items-center gap-2 bg-rose-600/25 border border-rose-500/40 px-3 py-1 rounded-xl shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs md:text-sm font-semibold tracking-wide text-rose-200 uppercase font-mono">
                    {isSpeakingHeroine.name}
                  </span>
                </div>
              ) : isProtagonistAlone ? (
                <div className="inline-flex items-center gap-2 bg-sky-950/60 border border-sky-500/40 px-3 py-1 rounded-xl shadow-sm">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs md:text-sm font-semibold tracking-wide text-sky-200 uppercase font-mono">
                    {gameState.speaker || "Narrator"}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-sky-950/60 border border-sky-500/30 px-3 py-1 rounded-xl shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs md:text-sm font-semibold tracking-wide text-sky-200 uppercase font-mono">
                    {gameState.speaker || "Narrator"}
                  </span>
                </div>
              )}

              {/* Status / Presence Indicator */}
              {isSpeakingHeroine ? (
                <div className="relative inline-flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded-xl shadow-inner">
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
                          <span>Locked at {lastAffectionDelta.cap}% [Quest Pending]</span>
                        </>
                      ) : lastAffectionDelta.delta > 0 ? (
                        `+${lastAffectionDelta.delta} Favor`
                      ) : (
                        `${lastAffectionDelta.delta} Favor`
                      )}
                    </div>
                  )}
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/80" />
                  <span className="text-[10px] font-mono font-medium text-rose-300 hidden sm:inline">{isSpeakingHeroine.name}:</span>
                  {isSpeakingHeroine.encountered ? (
                    <>
                      <div className="w-14 sm:w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${isSpeakingHeroine.affection}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-rose-300 flex items-center gap-1">
                        {isSpeakingHeroine.affection}%
                        {(() => {
                          const cap = getCompanionCap(isSpeakingHeroine.name);
                          return isSpeakingHeroine.affection >= cap && cap < 100 ? (
                            <span title={`Favor locked at ${cap}%. Complete her Companion Quest to break through.`}>
                              <Lock className="w-3 h-3 text-amber-400 inline" />
                            </span>
                          ) : null;
                        })()}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 italic px-1">??? Favor</span>
                  )}
                </div>
              ) : isProtagonistAlone ? (
                <div className="inline-flex items-center gap-1.5 bg-sky-950/40 border border-sky-500/30 px-2.5 py-1 rounded-xl shadow-inner">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-mono font-bold text-sky-300">Solo Exploration</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-1 rounded-xl shadow-inner">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">With:</span>
                  <span className="text-[11px] font-mono font-bold text-rose-300">
                    {presentComps.map((c) => c.name).join(", ")}
                  </span>
                  <span className="text-zinc-600 mx-0.5">•</span>
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500/80" />
                  <span className="text-[10px] font-mono text-rose-300 font-bold">{presentComps[0].affection}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSpeakingHeroine && (
                <>
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">
                    {isSpeakingHeroine.expressionKey}
                  </span>
                  <span className="text-zinc-600">•</span>
                </>
              )}
              {isProtagonistAlone && (
                <>
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-500/20">
                    Solitary Arc
                  </span>
                  <span className="text-zinc-600">•</span>
                </>
              )}
              <span className="text-xs text-amber-400 font-mono">Mood: {gameState.mood}</span>
              <button
                type="button"
                onClick={() => handleGenerateSceneCG(false)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm hover:border-rose-400"
                title="Illustrate this scene in real-time with Nano Banana 2.1"
              >
                <Camera className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">Illustrate CG</span>
              </button>
            </div>
          </div>

          <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
            {/* DYNAMIC SPRITE STAGE */}
            <div className="hidden sm:flex relative w-56 sm:w-64 md:w-80 lg:w-96 bg-gradient-to-b from-zinc-900/40 via-zinc-950/60 to-black/90 border-r border-white/10 items-end justify-center overflow-hidden shrink-0 select-none">
              <div className="relative w-full h-full flex items-end justify-center px-2">
                {presentComps.length > 0 ? (
                  presentComps.map((comp) => {
                    const isSpeaking = gameState.speaker.toLowerCase().includes(comp.name.toLowerCase());
                    const spriteSrc = getSpriteSrc(comp.name, comp.expressionKey);

                    return (
                      <div 
                        key={comp.name}
                        className={`relative h-full flex items-end justify-center transition-all duration-500 ${
                          presentComps.length > 1 ? "w-1/2" : "w-full"
                        } ${isSpeaking ? "opacity-100 scale-100 z-10 brightness-105 animate-float-sway" : "opacity-45 scale-95 z-0 brightness-75"}`}
                      >
                        {/* Ambient Heroine Aura */}
                        {isSpeaking && (
                          <div 
                            className="absolute bottom-6 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
                            style={{
                              background: comp.name.includes("Evelyn") 
                                ? "radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)"
                                : comp.name.includes("Aria")
                                ? "radial-gradient(circle, rgba(6,182,212,0.7) 0%, transparent 70%)"
                                : comp.name.includes("Serena")
                                ? "radial-gradient(circle, rgba(244,63,94,0.7) 0%, transparent 70%)"
                                : comp.name.includes("Morgana")
                                ? "radial-gradient(circle, rgba(225,29,72,0.7) 0%, transparent 70%)"
                                : "radial-gradient(circle, rgba(234,179,8,0.7) 0%, transparent 70%)"
                            }}
                          />
                        )}
                        <img
                          src={(spriteSrc && spriteSrc.trim()) || DEFAULT_FALLBACK_SPRITE}
                          alt={comp.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_FALLBACK_SPRITE;
                          }}
                          className="h-full w-full object-contain object-bottom filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] pointer-events-none"
                        />
                      </div>
                    );
                  })
                ) : (
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
                        className="h-full w-full object-contain object-bottom filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] pointer-events-none"
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
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
            </div>

            {/* MESSAGE FEED (SELECTABLE AND EDITABLE) */}
            <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
              <div 
                ref={dialogueFeedRef}
                className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 scroll-smooth select-text pb-14"
              >
              {chatLog.map((msg, idx) => {
                const isLast = idx === chatLog.length - 1;
                const isLatestCharacterTurn = isLast && msg.sender === "character";
                const isEditing = editingMessageId === msg.id;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col group ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {msg.sender === "user" ? (
                        <>
                          {!isEditing && (
                            <button
                              onClick={() => handleStartEdit(msg)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                              title="Edit action"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-[11px] text-zinc-500 font-mono select-none">{msg.timestamp}</span>
                          <span className="text-xs font-semibold text-zinc-200 select-none">{msg.speakerName}</span>
                          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-400/80 bg-zinc-800 shadow-md flex items-center justify-center shrink-0 select-none">
                            {(msg.avatarSrc && msg.avatarSrc.trim()) || (playerAvatar && playerAvatar.trim()) ? (
                              <img src={(msg.avatarSrc && msg.avatarSrc.trim()) || playerAvatar || DEFAULT_FALLBACK_SPRITE} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-sky-300" />
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {(() => {
                            const isMsgAmbient = ["narrator", "system", "inner monologue"].some((s) => msg.speakerName.toLowerCase().includes(s));
                            if (isMsgAmbient) {
                              return (
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-400/80 bg-zinc-950 shadow-md flex items-center justify-center shrink-0 select-none">
                                  {msg.speakerName.toLowerCase().includes("system") ? (
                                    <Terminal className="w-4 h-4 text-sky-400" />
                                  ) : (
                                    <BookOpen className="w-4 h-4 text-sky-400" />
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-rose-400/80 bg-zinc-900 shadow-md flex items-center justify-center shrink-0 select-none">
                                <img 
                                  src={(msg.avatarSrc && msg.avatarSrc.trim()) || getSpriteSrc(msg.speakerName, activeSpeakerComp.expressionKey) || DEFAULT_FALLBACK_SPRITE} 
                                  alt={msg.speakerName} 
                                  onError={(e) => { 
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = DEFAULT_FALLBACK_SPRITE; 
                                  }}
                                  className="w-full h-full object-cover object-top" 
                                />
                              </div>
                            );
                          })()}
                          <span className={`text-xs font-semibold select-none ${["narrator", "system", "inner monologue"].some((s) => msg.speakerName.toLowerCase().includes(s)) ? "text-sky-300" : "text-rose-300"}`}>
                            {msg.speakerName}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono select-none">{msg.timestamp}</span>

                          {!isEditing && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 select-none">
                              <button
                                onClick={() => handleStartEdit(msg)}
                                className="p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                                title="Edit response"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {isLatestCharacterTurn && !isLoading && (
                                <button
                                  onClick={handleRegenerateTurn}
                                  className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                  title="Regenerate response"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div 
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm select-text transition-colors ${
                        msg.sender === "user"
                          ? "bg-gradient-to-br from-rose-600 to-pink-600 text-white rounded-tr-none"
                          : "bg-zinc-900/95 border border-white/10 text-zinc-200 rounded-tl-none font-normal"
                      }`}
                      onClick={() => {
                        if (isLatestCharacterTurn && displayedText.length < gameState.dialogue.length) {
                          setDisplayedText(gameState.dialogue);
                        }
                      }}
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[260px] sm:min-w-[340px]">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-black/60 border border-white/20 rounded-xl p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-rose-400 font-sans resize-y min-h-[90px]"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Supports markdown (*action*, **bold**, &gt; quote)
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMessageId(null)}
                                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded-lg border border-white/10 bg-zinc-800 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" /> Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : isLatestCharacterTurn ? (
                        <MarkdownRenderer
                          content={displayedText}
                          isUser={false}
                          isStreaming={displayedText.length < gameState.dialogue.length}
                        />
                      ) : (
                        <MarkdownRenderer
                          content={msg.text}
                          isUser={msg.sender === "user"}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
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

        {choices.length > 0 && !isLoading && (
          <div className="pointer-events-auto grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 select-none shrink-0 max-h-32 sm:max-h-36 overflow-y-auto pr-0.5">
            {choices.map((choice, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendAction(choice, false)}
                disabled={isLoading}
                className="group bg-zinc-900/95 hover:bg-zinc-850 border border-white/10 hover:border-rose-500/60 backdrop-blur-md px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-left transition-all duration-150 shadow-md flex items-center justify-between cursor-pointer active:scale-[0.99]"
              >
                <span className="text-xs sm:text-sm text-zinc-200 group-hover:text-white line-clamp-2 pr-2">
                  {choice}
                </span>
                <span className="text-rose-400/50 group-hover:text-rose-400 transition-colors shrink-0 text-xs">
                  →
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="pointer-events-auto flex gap-2 select-none shrink-0">
          <button
            type="button"
            onClick={() => setIsOOCMode(!isOOCMode)}
            className={`px-3.5 py-2.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOOCMode 
                ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]" 
                : "bg-zinc-900/90 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <MessageSquareCode className="w-4 h-4" />
            <span>OOC</span>
          </button>

          <input
            type="text"
            value={inputAction}
            onChange={(e) => setInputAction(e.target.value)}
            placeholder={isOOCMode ? "OOC Directive..." : `What will ${player.name} do or say? (Markdown supported)`}
            disabled={isLoading}
            className={`flex-1 bg-zinc-900/90 backdrop-blur-md rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 border focus:outline-none transition-all select-text ${
              isOOCMode
                ? "border-amber-500/40 focus:border-amber-400 ring-1 ring-amber-500/20"
                : "border-white/15 focus:border-rose-500/60 ring-1 ring-rose-500/20"
            }`}
          />

          <button
            type="submit"
            disabled={isLoading || !inputAction.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg flex items-center justify-center transition-all cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      {renderSaveModal()}
      {renderAuthModal()}
      {renderTransitionOverlay()}
      {renderSceneModal()}
      {renderItemModal()}
      {renderAbilityModal()}



      <SystemQuestModal
        isOpen={showSystemModal}
        onClose={() => setShowSystemModal(false)}
        systemState={systemState}
        onCompleteQuest={handleCompleteQuest}
      />

      {/* PARTY ROSTER DRAWER */}
      {showPartyDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end select-none">
          <div className="w-full max-w-md bg-zinc-950/95 border-l border-white/10 h-full flex flex-col p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                <h2 className="text-lg font-bold text-white font-mono">Party & Affection</h2>
              </div>
              <button onClick={() => setShowPartyDrawer(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">Companions traveling alongside you across Astra:</p>

            <div className="space-y-3">
              {party.map((comp) => {
                const sprite = getSpriteSrc(comp.name, comp.expressionKey);

                return (
                  <div key={comp.name} className="bg-zinc-900/80 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15 bg-zinc-950 shrink-0">
                      <img 
                        src={(sprite && sprite.trim()) || DEFAULT_FALLBACK_SPRITE} 
                        alt={comp.name} 
                        className={`w-full h-full object-cover object-top ${!comp.encountered ? "brightness-30 grayscale contrast-150" : ""}`} 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">
                          {comp.encountered ? comp.name : "???"}
                        </p>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          !comp.encountered 
                            ? "bg-zinc-800 text-zinc-500" 
                            : comp.isPresent 
                            ? "bg-emerald-500/20 text-emerald-300" 
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          {!comp.encountered ? "Unmet" : comp.isPresent ? "In Scene" : "Absent"}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {comp.encountered ? comp.title : "Mystery Heroine • Path yet to cross"}
                      </p>
                      
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-start select-none">
          <div className="w-full max-w-md bg-zinc-950/95 border-r border-white/10 h-full flex flex-col p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-900 border border-white/15 shrink-0 flex items-center justify-center">
                  {playerAvatar && playerAvatar.trim() ? (
                    <img src={playerAvatar} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-mono">{player.name}</h2>
                  <p className="text-xs text-rose-400 font-mono">Level {player.level} {player.role}</p>
                </div>
              </div>
              <button onClick={() => setShowPlayerSheet(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 bg-zinc-900/70 p-4 rounded-2xl border border-white/5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-rose-300">
                  <span>HEALTH (HP)</span>
                  <span>{player.stats.hp} / {player.stats.maxHp}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${(player.stats.hp / player.stats.maxHp) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-sky-300">
                  <span>MANA (MP)</span>
                  <span>{player.stats.mp} / {player.stats.maxMp}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full transition-all" style={{ width: `${(player.stats.mp / player.stats.maxMp) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-amber-300">
                  <span>EXPERIENCE (EXP)</span>
                  <span>{player.stats.exp} / {player.stats.maxExp}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full transition-all" style={{ width: `${(player.stats.exp / player.stats.maxExp) * 100}%` }} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-2">Attributes</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-400 font-mono">STR</p>
                  <p className="text-base font-bold text-white">{player.stats.str}</p>
                </div>
                <div className="bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-400 font-mono">DEX</p>
                  <p className="text-base font-bold text-white">{player.stats.dex}</p>
                </div>
                <div className="bg-zinc-900 border border-white/5 p-2.5 rounded-xl text-center">
                  <p className="text-[10px] text-zinc-400 font-mono">INT</p>
                  <p className="text-base font-bold text-white">{player.stats.int}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-2">Equipped Gear</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                  <Sword className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-zinc-200 font-semibold">{player.gear.weapon}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Main Weapon</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-zinc-200 font-semibold">{player.gear.armor}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Armor</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-zinc-200 font-semibold">{player.gear.relic}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Relic</p>
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
                onClick={() => {
                  soundEffects.playClick();
                  router.push("/codex");
                }}
                className="w-full py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Open Multiverse Codex</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INTERACTIVE BRANCHING FLOWCHART (Task 2) */}
      <FlowchartViewer
        isOpen={showFlowchartModal}
        onClose={() => setShowFlowchartModal(false)}
        flowchartTree={currentStory?.flowchartTree}
        visitedNodes={visitedStoryNodes}
        currentNodeKey={gameState.location}
        onJumpToAnchor={handleJumpToAnchor}
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end select-none">
          <div className="w-full max-w-md bg-zinc-950/95 border-l border-white/10 h-full flex flex-col p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-sky-400" />
                <h2 className="text-lg font-bold text-white font-mono">Astra Chronicle</h2>
              </div>
              <button onClick={() => setShowChronicle(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">Major milestones and irreversible plot beats recorded by the chronicle engine:</p>

            <div className="space-y-3">
              {memories.map((entry, idx) => (
                <div key={idx} className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-xl text-xs text-zinc-200 leading-relaxed flex gap-3 select-text">
                  <span className="font-mono text-sky-400 font-bold select-none">#{idx + 1}</span>
                  <div className="flex-1">
                    <MarkdownRenderer content={entry} className="text-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}