"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Trash2
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SystemState, SystemToastNotification, SystemQuest } from "@/types/system";
import { SystemNotificationToast } from "@/components/SystemNotificationToast";
import { SystemQuestModal } from "@/components/SystemQuestModal";

export interface InventoryItem {
  id: string;
  name: string;
  type: "weapon" | "armor" | "relic" | "consumable" | "material";
  rarity: "common" | "uncommon" | "rare" | "relic" | "cursed";
  description: string;
  effect?: string;
}

export interface Companion {
  name: string;
  title: string;
  affection: number;
  expressionKey: string;
  isPresent: boolean;
  encountered: boolean;
  color: string;
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

  useEffect(() => {
    setIsAudioMuted(soundEffects.isMuted());
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
    inventory: [],
  });

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

  const [lastAffectionDelta, setLastAffectionDelta] = useState<{ companion: string; delta: number } | null>(null);
  const [levelUpAlert, setLevelUpAlert] = useState<string | null>(null);
  const [inputAction, setInputAction] = useState("");
  const [isOOCMode, setIsOOCMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  
  const [showPlayerSheet, setShowPlayerSheet] = useState(false);
  const [showPartyDrawer, setShowPartyDrawer] = useState(false);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedSlots, setSavedSlots] = useState<Record<number, SaveSlotData | null>>({ 1: null, 2: null, 3: null });

  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const dialogueFeedRef = useRef<HTMLDivElement | null>(null);

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
  const [systemToast, setSystemToast] = useState<SystemToastNotification | null>(null);

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

  const prologues = [
    {
      speaker: "Evelyn Abbandonato",
      title: "Evelyn: The Imperium Spire Ramparts",
      location: "Imperial Capital Imperium",
      sceneSetup:
        "Wind off the great eastern gulf whips through the imperial parapets, carrying the sharp scent of ozone and cooling masonry. Below, the capital city of Imperium glitters in tiered rings of stone and polished copper, eclipsed only by the colossal Mage Tower pulsing with celestial resonance. You slipped past the second watch-ward only to find the high terrace occupied.\n\nLeaning against the carved balustrade, Evelyn Abbandonato swivels deliberately. Her heavy-lidded blue eyes sweep over your stance, lingering on your equipment and evaluating the threat before a smirk forms.",
      dialogue:
        "Lurking along the imperial ramparts while the Mage Tower aligns its planar gyres? How deliciously pedestrian.\n\nState your house, your master, or whatever pitiful guild sent you before I have the gargoyle sentinels toss you into the river gates below.",
      expressionKey: "smug",
      choices: [
        "[Subterfuge] Show the forged imperial cipher you lifted from the guard captain at the lower docks.",
        "[Arcana] Point out that the Mage Tower's secondary focus ring is misaligned by three degrees.",
        "[Composure] Step forward into the lantern light, meet her gaze evenly, and offer your services in contract.",
        "[Force] Keep your hand resting close to your weapon and demand passage through the upper corridor.",
      ],
    },
    {
      speaker: "Aria Shadowthorn",
      title: "Aria: The Archon Vault Undercroft",
      location: "Archon Spire Vault",
      sceneSetup:
        "Damp obsidian masonry echoes with the dull rhythmic thrum of suppressed leyline wards. The floor is lined with shattered containment seals—remnants of an archive break-in that happened mere minutes ago. You drop down through a ventilation conduit into an octagonal vault lit only by floating azure glyphs.\n\nA shadow disengages from the central pedestal. Twin blackened daggers catch the glyph light, held low and reverse-gripped. Aria tilts her head, gaze zeroed in on your footing.",
      dialogue:
        "Don't twitch. You bypassed the third silence ward without setting off the alarm chimes... which means either the Veil Seekers sent a second scout without telling me, or House Abbandonato's hounds are getting unusually quiet.\n\nHands where I can see them. Who signed your contract tonight?",
      expressionKey: "combat_ready",
      choices: [
        "[Subterfuge] Signal the covert Veil Seeker counter-cipher with your left hand.",
        "[Observation] Note that her daggers are leaking residual ward-discharge—she triggered the inner glyphs herself.",
        "[Persuade] Propose a split: she takes the astral grimoire on the pedestal, you take the vault ciphers.",
        "[Combat] Drop your center of gravity and prepare to counter her first lunge.",
      ],
    },
    {
      speaker: "Serena",
      title: "Serena: The Ruined Estate",
      location: "Bloodrose Duchy",
      sceneSetup:
        "The smoking ruins of a minor noble's manor crumble around you. Mercenaries from the Gray Zone lie scattered across the courtyard, their armor caved in by blunt-force trauma. In the center of the carnage stands a demi-human maid with soft white sheep ears and curling ram horns. She gracefully steps over a shattered halberd, producing a pristine white handkerchief to wipe a single speck of ash from the massive, iron-spiked mace resting effortlessly on her shoulder.\n\nHer ears twitch as you approach. She curtsies, the movement flawless despite the cratered stone beneath her boots.",
      dialogue:
        "Welcome back. I apologize for the unsightly state of the courtyard. The intruders were remarkably persistent, but the perimeter has been thoroughly swept.\n\nShall I prepare tea, or is there another nuisance you require me to crush?",
      expressionKey: "neutral",
      choices: [
        "[Observation] Note that she isn't even out of breath, and ask how many mercenaries are left in the woods.",
        "[Composure] Ignore the carnage entirely and request Earl Grey tea, black.",
        "[Tactics] Draw your weapon and suggest clearing the remaining western wing together.",
        "[Persuade] Ask her gently to lower the mace before she accidentally collapses the rest of the portico."
      ],
    },
    {
      speaker: "Morgana",
      title: "Morgana: Fringe of the Demon Realm",
      location: "Gray Zone",
      sceneSetup:
        "The soil here is blistered and black, choked by sulfuric vapor seeping from the eastern volcanic chasms. Resting against a cracked basalt monolith stands Morgana. Her curved ram horns curl through her dark hair, and large bat wings are folded gracefully behind her back. She clutches her wine chalice lazily, heavy-lidded amber eyes trailing your footsteps with detached, predatory curiosity.",
      dialogue:
        "A mortal walking the border of the volcanic wastes alone... how exquisitely reckless.\n\nDid you flee the Empire's pious inquisitors, or did you venture this close to the Demon Realm hoping someone would put an end to your tedious existence?",
      expressionKey: "neutral",
      choices: [
        "[Composure] Step to the rim of the fissure, meet her gaze, and say you seek planar power, not death.",
        "[Arcana] Identify the demonic seal binding her goblet and ask how she crossed the Gray Zone wards.",
        "[Pragmatism] Offer mutual assistance against the Imperial hunting parties tracking both of you.",
        "[Defiance] Keep a hand on your weapon and state that the wastes belong to whoever survives them."
      ],
    },
    {
      speaker: "Perci",
      title: "Perci: Port Fortus Shadow Alleys",
      location: "Port City Fortus",
      sceneSetup:
        "Mist drifts through the damp cobblestone alleyways of Port City Fortus. Behind a stack of salt-crusted maritime crates, you hear the quiet, metallic clink of a blade being hastily sheathed. Stepping around the corner, you find a golden-blonde kitsune girl. Her sarashi bandage wrap is taut, her red robe hangs loosely off her trembling shoulders, and her fluffy fox ears twitch backward in alarm as her golden eyes widen at your arrival.",
      dialogue:
        "P-Please don't come any closer...! I... I wasn't doing anything forbidden, I promise. I just... needed somewhere quiet where the harbor watch wouldn't see my ears.\n\nA-Are you... here to turn me in?",
      expressionKey: "flustered",
      choices: [
        "[Gentle] Step back, lower your hands, and reassure her you have no interest in the harbor watch bounties.",
        "[Observation] Point out the blood on her sleeve and ask if she was the one who cut down the corsairs at the slipway.",
        "[Survival] Offer to hide her from the upcoming patrol in exchange for a local guide through the lower docks.",
        "[Rogue] Show your own covert guild sign, proving you are an operative rather than an imperial guard."
      ],
    }
  ];

  useEffect(() => {
    try {
      const s1 = localStorage.getItem("astra_save_slot_1");
      const s2 = localStorage.getItem("astra_save_slot_2");
      const s3 = localStorage.getItem("astra_save_slot_3");
      setSavedSlots({
        1: s1 ? JSON.parse(s1) : null,
        2: s2 ? JSON.parse(s2) : null,
        3: s3 ? JSON.parse(s3) : null,
      });
    } catch (e) {
      console.error("Failed to read save slots", e);
    }
  }, [showSaveModal]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPlayerAvatar(reader.result as string);
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

  const getSpriteSrc = (speaker: string, key: string) => {
    const normalizedKey = key === "injured" ? "hurt" : key;
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

    const chosen = prologues[selectedPrologue];
    const initialBg = LOCATION_BACKGROUNDS[chosen.location] || DEFAULT_BG;

    soundEffects.playRiftTransition();

    setIsTransitioning({
      location: chosen.location,
      speaker: chosen.speaker,
      quote: "Observing mortal arrival & forging bespoke dynamic prologue...",
    });

    const initialGear = gearPreference === "none"
      ? { weapon: "Bare Hands", armor: "Rags", relic: "None" }
      : { weapon: "[System Pending]", armor: "[System Pending]", relic: "None" };

    setPlayer((prev) => ({ ...prev, gear: initialGear }));

    const startTime = Date.now();

    try {
      const res = await fetch("/api/prologue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          playerProfile: { ...player, gear: initialGear },
          playerAvatarBase64: playerAvatar,
          startingHeroine: chosen.speaker,
          startingLocation: chosen.location,
          narrationStyle,
          userAccessKey: accessKey,
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

      setChoices(data.opening_choices && data.opening_choices.length === 4 ? data.opening_choices : chosen.choices);

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
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 2200 - elapsed);

      setTimeout(() => {
        setIsConfigured(true);
        setIsTransitioning(null);
      }, remainingDelay);
    }
  };

  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);

  const handleDeleteSlot = (slotId: number) => {
    soundEffects.playClick();
    localStorage.removeItem(`astra_save_slot_${slotId}`);
    setSavedSlots((prev) => ({ ...prev, [slotId]: null }));
    setConfirmDeleteSlot(null);
  };

  const handleSaveSlot = (slotId: number) => {
    soundEffects.playClick();
    const payload: SaveSlotData = {
      slotId,
      savedAt: new Date().toLocaleString(),
      player,
      playerAvatar,
      gameState,
      party,
      memories,
      chatLog,
      systemState,
    };
    localStorage.setItem(`astra_save_slot_${slotId}`, JSON.stringify(payload));
    setSavedSlots((prev) => ({ ...prev, [slotId]: payload }));
  };

  const handleLoadSlot = (slotId: number) => {
    const data = savedSlots[slotId];
    if (!data) return;

    soundEffects.playIntroBell();
    setPlayer(data.player);
    setPlayerAvatar(data.playerAvatar);
    setGameState(data.gameState);
    if (data.party) {
      setParty(
        data.party.map((c) => ({
          ...c,
          encountered: typeof c.encountered === "boolean" ? c.encountered : (c.isPresent || c.affection !== 50),
        }))
      );
    }
    setMemories(data.memories);
    setChatLog(data.chatLog);
    if (data.systemState) {
      setSystemState(data.systemState);
    }
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

  useEffect(() => {
    let index = 0;
    const target = gameState.dialogue;
    setDisplayedText("");
    if (!target) return;

    let blipCounter = 0;
    const interval = setInterval(() => {
      index += 2;
      setDisplayedText(target.slice(0, index));
      blipCounter++;
      if (blipCounter % 4 === 0) {
        soundEffects.playDialogueBlip();
      }
      if (index >= target.length) {
        setDisplayedText(target);
        clearInterval(interval);
      }
    }, 12);

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
          recentHistory: chatLog.slice(-4).map((m) => ({
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
      const speakerName = data.speaker || gameState.speaker;
      const narrative = data.narrative_text || gameState.dialogue;
      
      const playerText = isCustom ? formattedPayload : (data.player_execution || formattedPayload);
      
      const nextExpression = data.state_updates?.expression_key || "neutral";
      const nextLocation = data.state_updates?.current_location || gameState.location;
      const nextBg = LOCATION_BACKGROUNDS[nextLocation] || gameState.bgImage;
      const presentList: string[] = data.state_updates?.present_companions || [speakerName];

      const affectedComp = data.state_updates?.affected_companion || speakerName;
      const delta = data.state_updates?.affection_delta;

      if (typeof delta === "number" && delta !== 0) {
        soundEffects.playFavorSound(delta > 0);
        setLastAffectionDelta({ companion: affectedComp, delta });
        setTimeout(() => setLastAffectionDelta(null), 3500);
      }

      const newlyMet: string[] = data.state_updates?.newly_encountered_heroines || [];

      setParty((prevParty) =>
        prevParty.map((comp) => {
          const isCurrentSpeaker = comp.name.toLowerCase().includes(speakerName.toLowerCase());
          const isAffected = comp.name.toLowerCase().includes(affectedComp.toLowerCase());
          const isPresent = presentList.some((p) => comp.name.toLowerCase().includes(p.toLowerCase()));
          const isNewlyMet = newlyMet.some((n) => comp.name.toLowerCase().includes(n.toLowerCase()));

          const nowEncountered = comp.encountered || isCurrentSpeaker || isPresent || isAffected || isNewlyMet;

          return {
            ...comp,
            isPresent,
            encountered: nowEncountered,
            expressionKey: isCurrentSpeaker ? nextExpression : comp.expressionKey,
            affection: isAffected && typeof delta === "number"
              ? Math.max(0, Math.min(100, comp.affection + delta))
              : comp.affection,
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

      const companionMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "character",
        speakerName,
        text: narrative,
        timestamp: timeString,
        avatarSrc: getSpriteSrc(speakerName, nextExpression),
      };

      setChatLog((prev) => [...prev, playerMsg, companionMsg]);

      if (data.player_progression) {
        const prog = data.player_progression;

        if (prog.items_dropped && Array.isArray(prog.items_dropped) && prog.items_dropped.length > 0) {
          setPlayer((prev) => ({
            ...prev,
            inventory: [...prev.inventory, ...prog.items_dropped],
          }));

          const itemNames = prog.items_dropped.map((i: InventoryItem) => i.name).join(", ");
          setLevelUpAlert(`LOOT ACQUIRED: ${itemNames}`);
          setTimeout(() => setLevelUpAlert(null), 4000);
        }

        if (prog.gear_granted && (prog.gear_granted.weapon || prog.gear_granted.armor)) {
          setPlayer((prev) => ({
            ...prev,
            gear: { ...prev.gear, ...prog.gear_granted },
          }));
        }

        if (prog.new_ability_unlocked) {
          setPlayer((prev) => ({ ...prev, abilities: [...prev.abilities, prog.new_ability_unlocked] }));
          setLevelUpAlert(`NEW SKILL UNLOCKED: ${prog.new_ability_unlocked}`);
          setTimeout(() => setLevelUpAlert(null), 4000);
        }

        const expGained = prog.exp_gained || 20;
        setPlayer((prev) => {
          let newExp = prev.stats.exp + expGained;
          let newLevel = prev.level;
          let newMaxExp = prev.stats.maxExp;
          let newMaxHp = prev.stats.maxHp;
          let newMaxMp = prev.stats.maxMp;
          let newStr = prev.stats.str;
          let newDex = prev.stats.dex;
          let newInt = prev.stats.int;

          if (newExp >= prev.stats.maxExp) {
            newLevel += 1;
            newExp = newExp - prev.stats.maxExp;
            newMaxExp = newLevel * 100;
            newMaxHp += 20;
            newMaxMp += 10;
            newStr += 2;
            newDex += 2;
            newInt += 2;
            setLevelUpAlert(`LEVEL UP! You reached Level ${newLevel}!`);
            setTimeout(() => setLevelUpAlert(null), 4000);
          }

          return {
            ...prev,
            level: newLevel,
            stats: {
              ...prev.stats,
              hp: Math.max(0, Math.min(newMaxHp, prev.stats.hp + (prog.hp_change || 0))),
              mp: Math.max(0, Math.min(newMaxMp, prev.stats.mp + (prog.mp_change || 0))),
              exp: newExp,
              maxExp: newMaxExp,
              maxHp: newMaxHp,
              maxMp: newMaxMp,
              str: newStr,
              dex: newDex,
              int: newInt,
            },
          };
        });
      }

      if (data.new_memory_unlocked && data.new_memory_unlocked.trim().length > 0) {
        setMemories((prev) => [...prev, data.new_memory_unlocked]);
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

      if (data.suggested_choices && Array.isArray(data.suggested_choices)) {
        const validChoices = data.suggested_choices.filter(
          (c: any) => typeof c === "string" && !c.includes("state_updates") && !c.includes("{")
        );
        setChoices(validChoices);
      }
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

  const activeSpeakerComp = party.find((c) => c.name.toLowerCase().includes(gameState.speaker.toLowerCase())) || party[0];
  const presentComps = party.filter((c) => c.isPresent);

  const renderSaveModal = () => (
    showSaveModal && (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-sky-400" /> Character Save Slots
            </h2>
            <button onClick={() => { setShowSaveModal(false); setConfirmDeleteSlot(null); }} className="text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-zinc-400">Save your current progress or load an existing chronicle:</p>

          <div className="space-y-3">
            {[1, 2, 3].map((slot) => {
              const s = savedSlots[slot];
              return (
                <div key={slot} className="bg-zinc-900/80 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-xs font-mono font-bold text-rose-400">SLOT 0{slot}</span>
                    {s ? (
                      <div className="mt-0.5">
                        <p className="text-sm font-bold text-white">{s.player.name} <span className="text-xs text-zinc-400 font-normal">(Lv.{s.player.level} {s.player.role})</span></p>
                        <p className="text-[11px] text-zinc-500 font-mono">{s.gameState.speaker} • {s.gameState.location}</p>
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
                <p className="text-xs font-mono text-zinc-500">Key: {userAuth.key}</p>
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
                <input
                  type="text"
                  placeholder="e.g. ASTRA-DEV-2026"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      verifyKey(keyInput);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500/80"
                />

                {authError && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl">
                    {authError}
                  </p>
                )}
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 text-[11px] text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Quick Test Keys (configured in allowed_users.json):</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["ASTRA-DEV-2026", "CHRONICLE-VIP-01", "CHRONICLE-GUEST"].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => {
                        setKeyInput(sample);
                        verifyKey(sample);
                      }}
                      className="px-2 py-0.5 font-mono text-[10px] bg-white/5 hover:bg-white/15 border border-white/10 rounded text-purple-300 cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
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
            <Sparkles className="w-3.5 h-3.5 text-rose-400" /> High-Fantasy Visual Novel Engine
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_10px_35px_rgba(244,63,94,0.45)]">
              ASTRA <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">CHRONICLES</span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300 font-sans max-w-lg mx-auto leading-relaxed">
              Planar gyres align across a continent on the brink of war. Forge your destiny alongside five lethal heroines.
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
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <Sparkles className="text-rose-400 w-6 h-6 animate-pulse" /> ASTRA CHRONICLES
            </h1>
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
              {playerAvatar ? (
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
            <Play className="w-4 h-4 fill-white" /> Enter Astra Continent
          </button>
        </div>

        {renderSaveModal()}
        {renderAuthModal()}
        {renderTransitionOverlay()}
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

      {levelUpAlert && (
        <div className="absolute top-16 inset-x-0 z-50 flex justify-center pointer-events-none animate-bounce select-none">
          <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold px-6 py-2 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2">
            <Award className="w-5 h-5" /> {levelUpAlert}
          </div>
        </div>
      )}

      {/* TOP HUD */}
      <header className="absolute top-4 inset-x-4 md:inset-x-8 z-20 flex items-center justify-between pointer-events-auto select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlayerSheet(true)}
            className="flex items-center gap-3 bg-black/75 hover:bg-black/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 hover:border-rose-500/50 shadow-lg text-xs md:text-sm text-zinc-200 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-600/30 border border-rose-500/60 flex items-center justify-center font-bold text-rose-300 shrink-0">
              {playerAvatar ? (
                <img src={playerAvatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                player.name.charAt(0)
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold leading-tight text-white">{player.name}</p>
              <p className="text-[11px] text-zinc-400 font-mono">Lv.{player.level} {player.role}</p>
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
                <Heart className="w-3 h-3 fill-rose-500" /> {player.stats.hp}/{player.stats.maxHp}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-sky-400 font-mono">
                <Zap className="w-3 h-3 fill-sky-500" /> {player.stats.mp}/{player.stats.maxMp}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-amber-400 font-mono">
                <Award className="w-2.5 h-2.5" /> {player.stats.exp}/{player.stats.maxExp} XP
              </div>
            </div>
          </button>

          {/* SYSTEM ADMINISTRATOR & QUESTS BUTTON */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setShowSystemModal(true);
            }}
            className={`bg-black/80 hover:bg-black/95 backdrop-blur-md px-3 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 relative shadow-lg ${
              systemState.activeQuests.length > 0
                ? "border-cyan-400 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.35)]"
                : "border-white/10 text-zinc-300 hover:border-cyan-500/50 hover:text-cyan-200"
            }`}
            title="Open System Administrator Interface & Quests"
          >
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider">SYSTEM</span>
            {systemState.activeQuests.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-cyan-400 text-black shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                {systemState.activeQuests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowPartyDrawer(true)}
            className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 hover:border-rose-500/50 shadow-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Party Roster"
          >
            <Users className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Party ({party.filter((p) => p.isPresent).length})</span>
          </button>

          <button
            onClick={() => setShowChronicle(true)}
            className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 hover:border-sky-500/50 shadow-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Astra Chronicle Memories"
          >
            <Scroll className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Log ({memories.length})</span>
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 hover:border-amber-500/50 shadow-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Save or Load Game"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 hover:border-purple-500/50 shadow-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Access & Token Quota"
          >
            <Key className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">
              {userAuth
                ? `${userAuth.name.split(" ")[0]} (${userAuth.remainingTurns === -1 ? "∞" : `${userAuth.remainingTurns} left`})`
                : "Access"}
            </span>
          </button>

          <button
            onClick={handleToggleAudio}
            className="bg-black/75 hover:bg-black/90 backdrop-blur-md px-3 py-2.5 rounded-2xl border border-white/10 hover:border-white/30 shadow-lg text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-2 bg-black/75 hover:bg-black/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 hover:border-emerald-500/50 shadow-lg text-xs md:text-sm text-zinc-200 transition-all cursor-pointer group"
          >
            <MapPin className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-emerald-300">{gameState.location}</span>
            <Compass className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors ml-1" />
          </button>

          <div className="relative flex items-center gap-2 bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
            {lastAffectionDelta !== null && (
              <div 
                className={`absolute -top-7 right-4 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold animate-bounce shadow-lg ${
                  lastAffectionDelta.delta > 0 
                    ? "bg-rose-600/90 text-white border border-rose-400" 
                    : "bg-zinc-800 text-zinc-400 border border-zinc-600"
                }`}
              >
                {lastAffectionDelta.delta > 0 ? `+${lastAffectionDelta.delta} Favor` : `${lastAffectionDelta.delta} Favor`}
              </div>
            )}
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/80" />
            {activeSpeakerComp.encountered ? (
              <>
                <div className="w-16 sm:w-24 bg-zinc-800 rounded-full h-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${activeSpeakerComp.affection}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-rose-300">{activeSpeakerComp.affection}%</span>
              </>
            ) : (
              <span className="text-xs font-mono text-zinc-500 italic px-1">??? Favor</span>
            )}
          </div>
        </div>
      </header>

      {/* DIALOGUE & SPRITE TERMINAL */}
      <div className="absolute top-20 bottom-3 inset-x-3 sm:inset-x-6 md:inset-x-10 lg:inset-x-16 z-30 flex flex-col justify-end gap-2 pointer-events-none">
        <div className="pointer-events-auto relative bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1 min-h-[160px] max-h-[46vh] sm:max-h-[50vh] md:max-h-[54vh]">
          <div className="absolute -top-1 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/70 to-transparent" />

          <div className="shrink-0 px-4 py-2 sm:px-5 sm:py-2.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 select-none">
            <div className="inline-flex items-center gap-2 bg-rose-600/25 border border-rose-500/40 px-3 py-1 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs md:text-sm font-semibold tracking-wide text-rose-200 uppercase font-mono">
                {gameState.speaker}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-md border border-white/5">
                {activeSpeakerComp.expressionKey}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-amber-400 font-mono">Mood: {gameState.mood}</span>
            </div>
          </div>

          <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
            {/* DYNAMIC MULTI-COMPANION SPRITE STAGE */}
            <div className="hidden sm:flex relative w-56 sm:w-64 md:w-80 lg:w-96 bg-gradient-to-b from-zinc-900/40 via-zinc-950/60 to-black/90 border-r border-white/10 items-end justify-center overflow-hidden shrink-0 select-none">
              <div className="relative w-full h-full flex items-end justify-center px-2">
                {presentComps.map((comp) => {
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
                        src={spriteSrc}
                        alt={comp.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FALLBACK_SPRITE;
                        }}
                        className="h-full w-full object-contain object-bottom filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.95)] pointer-events-none"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
            </div>

            {/* MESSAGE FEED (SELECTABLE AND EDITABLE) */}
            <div 
              ref={dialogueFeedRef}
              className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 scroll-smooth select-text"
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
                            {msg.avatarSrc ? (
                              <img src={msg.avatarSrc} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-sky-300" />
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-rose-400/80 bg-zinc-900 shadow-md flex items-center justify-center shrink-0 select-none">
                            <img 
                              src={msg.avatarSrc || getSpriteSrc(msg.speakerName, activeSpeakerComp.expressionKey)} 
                              alt={msg.speakerName} 
                              onError={(e) => { 
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = DEFAULT_FALLBACK_SPRITE; 
                              }}
                              className="w-full h-full object-cover object-top" 
                            />
                          </div>
                          <span className="text-xs font-semibold text-rose-300 select-none">{msg.speakerName}</span>
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
                        src={sprite} 
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
                            <div className="flex justify-between text-[10px] font-mono mb-1 text-rose-300">
                              <span>Affection / Favor</span>
                              <span>{comp.affection}%</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full transition-all" style={{ width: `${comp.affection}%` }} />
                            </div>
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
                <h2 className="text-lg font-bold text-white font-mono">Astra Continent Chart</h2>
              </div>
              <button onClick={() => setShowMap(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">Click a sector to direct your party toward that territory on your next action:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONTINENT_REGIONS.map((region, idx) => {
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
                  {playerAvatar ? (
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
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-2">Abilities</h3>
              {player.abilities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {player.abilities.map((ab, i) => (
                    <span key={i} className="text-xs bg-rose-950/40 border border-rose-500/30 text-rose-300 px-3 py-1 rounded-lg">
                      {ab}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No abilities unlocked yet.</p>
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
                      <div key={item.id} className={`p-2.5 rounded-xl border flex flex-col gap-1 ${style}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{item.name}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/40 text-zinc-400">
                            {item.rarity} • {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-tight">{item.description}</p>
                        {item.effect && (
                          <p className="text-[10px] font-mono text-amber-400/90">Effect: {item.effect}</p>
                        )}
                        {canEquip && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleEquipItem(item)}
                              className="px-2 py-0.5 text-[10px] font-mono bg-white/10 hover:bg-white/20 rounded text-white cursor-pointer"
                            >
                              Equip
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Inventory is currently empty.</p>
              )}
            </div>

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