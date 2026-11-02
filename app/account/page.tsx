"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Sparkles,
  Cloud,
  CloudUpload,
  CloudDownload,
  Shield,
  Users,
  FolderOpen,
  Layers,
  BookOpen,
  Settings,
  Play,
  Trash2,
  Edit3,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Key,
  Volume2,
  VolumeX,
  ArrowLeft,
  Compass,
  Award,
  Zap,
  Globe,
  Mail,
  Lock,
  LogOut,
  Eye,
  EyeOff,
  Save,
  X,
  Cpu,
  History,
  Flame,
} from "lucide-react";
import { StoryContext } from "@/types/story";
import { getAllStories } from "@/lib/storyStorage";
import {
  SaveSlotPayload,
  loadAllGameSlots,
  deleteGameSlot,
  compressAvatarImage,
} from "@/lib/saveStorage";
import {
  SavedCharacterBlueprint,
  loadCharacterRoster,
  saveCharacterToRoster,
  deleteCharacterFromRoster,
  createBlueprintFromPlayer,
} from "@/lib/characterRosterStorage";
import {
  AstraProgressionBundle,
  collectProgressionBundle,
  applyProgressionBundle,
  downloadAstraBundleFile,
  parseAstraBundleFile,
  syncProgressionToCloud,
  fetchCloudProgression,
  isCloudAutoSyncEnabled,
  setCloudAutoSyncEnabled,
  getLastCloudSyncTimestamp,
} from "@/lib/crossSaveEngine";
import {
  CloudAccountUser,
  getActiveCloudUser,
  authenticateWithEmail,
  signInWithOAuthProvider,
  signOutCloudAccount,
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  updateCloudUserProfile,
  getTravelerProfileOverride,
  OAuthProviderType,
} from "@/lib/supabaseClient";
import { getCodexStats } from "@/lib/codexStorage";
import { validateKeyClientSide } from "@/lib/clientKeyValidation";
import { soundEffects } from "@/lib/audioEngine";
import { sanitizeImageUrl, DEFAULT_AVATAR } from "@/lib/imageUtils";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { CloudSyncModal } from "@/components/CloudSyncModal";
import {
  LlmConfig,
  DEFAULT_LLM_CONFIG,
  getStoredLlmConfig,
  saveStoredLlmConfig,
  LlmProviderModal,
  LlmQuickPill,
} from "@/components/LlmProviderSelector";

type AccountTabId = "overview" | "roster" | "vault" | "settings";

const PERSONALITY_PRESETS: { name: string; traits: string[] }[] = [
  {
    name: "Stoic Pragmatist",
    traits: ["Calculated", "Composed", "Observant", "Resolute"],
  },
  {
    name: "Charismatic Rogue",
    traits: ["Witty", "Silver-Tongued", "Daring", "Unpredictable"],
  },
  {
    name: "Compassionate Idealist",
    traits: ["Empathetic", "Protective", "Honorable", "Inspiring"],
  },
  {
    name: "Ruthless Conqueror",
    traits: ["Dominant", "Intimidating", "Ambitious", "Unforgiving"],
  },
  {
    name: "Arcane Scholar",
    traits: ["Analytical", "Inquisitive", "Methodical", "Perceptive"],
  },
];

const RACE_PRESETS: { name: string; traits: string[] }[] = [
  { name: "Human", traits: ["Adaptable", "Indomitable Will"] },
  { name: "High Elf", traits: ["Mana Resonance", "Ageless Sight"] },
  { name: "Voidborn", traits: ["Rift Walker", "Entropy Resistance"] },
  { name: "Dragonkin", traits: ["Draconic Scales", "Sovereign Presence"] },
  { name: "Cyber-Augmented", traits: ["Neural Overclock", "Tactical HUD"] },
  { name: "Nephilim", traits: ["Celestial Aegis", "Dual Bloodline"] },
];

const CLASS_PRESETS: string[] = [
  "Voidstrider",
  "Spellblade",
  "Chronomancer",
  "Aegis Vanguard",
  "Shadow Assassin",
  "Aether Technomancer",
];

const NARRATION_STYLE_OPTIONS: { id: string; label: string; desc: string }[] = [
  {
    id: "Light Novel",
    label: "Light Novel (Default)",
    desc: "Expressive character banter, kinetic action, and vivid emotional beats.",
  },
  {
    id: "Dark Fantasy",
    label: "Grim Dark Fantasy",
    desc: "Atmospheric, weighty, solemn prose with visceral stakes and ancient lore.",
  },
  {
    id: "Cinematic",
    label: "Cinematic Thriller",
    desc: "Fast-paced, visual, high-tension pacing with crisp dialogue.",
  },
  {
    id: "Poetic",
    label: "Lyrical & Mythic",
    desc: "Rich sensory imagery, philosophical undertones, and mythic cadence.",
  },
];

export default function AccountHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTabId>("overview");

  // Core Account & Progression State
  const [user, setUser] = useState<CloudAccountUser | null>(null);
  const [profileOverride, setProfileOverride] = useState(getTravelerProfileOverride());
  const [stories, setStories] = useState<StoryContext[]>([]);
  const [saveSlots, setSaveSlots] = useState<Record<number, SaveSlotPayload | null>>({
    0: null,
    1: null,
    2: null,
    3: null,
  });
  const [roster, setRoster] = useState<SavedCharacterBlueprint[]>([]);
  const [localBundle, setLocalBundle] = useState<AstraProgressionBundle | null>(null);
  const [cloudBundle, setCloudBundle] = useState<AstraProgressionBundle | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [codexStats, setCodexStats] = useState<{ totalScenes: number; totalLoot: number }>({
    totalScenes: 0,
    totalLoot: 0,
  });
  const [syncBusy, setSyncBusy] = useState<boolean>(false);

  // Status Banner
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState<boolean>(false);
  const [handleDraft, setHandleDraft] = useState<string>("");
  const [titleBadgeDraft, setTitleBadgeDraft] = useState<string>("");
  const [avatarDraft, setAvatarDraft] = useState<string>("");
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);

  // Inline Auth Form State (when Guest)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authDisplayName, setAuthDisplayName] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Character Roster Studio Editor State
  const [editingBlueprint, setEditingBlueprint] = useState<SavedCharacterBlueprint | null>(null);
  const [showBlueprintEditor, setShowBlueprintEditor] = useState<boolean>(false);
  const [bpName, setBpName] = useState<string>("");
  const [bpRole, setBpRole] = useState<string>("Voidstrider");
  const [bpRace, setBpRace] = useState<string>("Human");
  const [bpRacialTraits, setBpRacialTraits] = useState<string>("Adaptable, Indomitable Will");
  const [bpPersonality, setBpPersonality] = useState<string>("Stoic Pragmatist");
  const [bpPersonalityTraits, setBpPersonalityTraits] = useState<string>(
    "Calculated, Composed, Observant, Resolute"
  );
  const [bpNarrationStyle, setBpNarrationStyle] = useState<string>("Light Novel");
  const [bpVisualDesc, setBpVisualDesc] = useState<string>("");
  const [bpAvatar, setBpAvatar] = useState<string>("");
  const bpAvatarInputRef = useRef<HTMLInputElement | null>(null);

  // Deploy Character to World Modal State
  const [deployingCharacter, setDeployingCharacter] = useState<SavedCharacterBlueprint | null>(null);

  // Portable .astra import file ref
  const astraFileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings / Access Key / LLM / Audio
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(DEFAULT_LLM_CONFIG);
  const [showLlmModal, setShowLlmModal] = useState<boolean>(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>("");
  const [showKeySecret, setShowKeySecret] = useState<boolean>(false);
  const [userAuth, setUserAuth] = useState<{
    key: string;
    name: string;
    role: string;
    remainingTurns: number;
  } | null>(null);
  const [customSupaUrl, setCustomSupaUrl] = useState<string>("");
  const [customSupaKey, setCustomSupaKey] = useState<string>("");
  const [supaConfigured, setSupaConfigured] = useState<boolean>(false);

  const loadAllAccountData = async () => {
    setSyncBusy(true);
    try {
      const [allStories, slots, charRoster, cStats, activeUser, bundle] = await Promise.all([
        getAllStories(),
        loadAllGameSlots(),
        loadCharacterRoster(),
        getCodexStats().catch(() => ({ totalScenes: 0, totalLoot: 0 })),
        getActiveCloudUser(),
        collectProgressionBundle({ optimizeForCloud: false }),
      ]);

      setStories(allStories);
      setSaveSlots(slots);
      setRoster(charRoster);
      setCodexStats(cStats);
      setUser(activeUser);
      setLocalBundle(bundle);

      const override = getTravelerProfileOverride();
      setProfileOverride(override);
      setHandleDraft(
        activeUser?.displayName ||
          override.displayName ||
          bundle.summary.activeCharacterName ||
          "Astral Traveler"
      );
      setTitleBadgeDraft(override.titleBadge || "");
      setAvatarDraft(activeUser?.avatarUrl || override.avatarUrl || "");

      if (activeUser) {
        const remote = await fetchCloudProgression(activeUser);
        setCloudBundle(remote.bundle);
      } else {
        setCloudBundle(null);
      }
    } catch (err) {
      console.warn("Failed to load account hub data:", err);
    } finally {
      setSyncBusy(false);
    }
  };

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsAudioMuted(soundEffects.isMuted());
      setLlmConfig(getStoredLlmConfig());
      setAutoSync(isCloudAutoSyncEnabled());
      setLastSyncedAt(getLastCloudSyncTimestamp());

      const creds = getSupabaseCredentials();
      setSupaConfigured(creds.isConfigured);
      setCustomSupaUrl(creds.url);
      setCustomSupaKey(creds.anonKey);

      try {
        const storedKey = localStorage.getItem("astra_access_key");
        if (storedKey) {
          setKeyInput(storedKey);
          const validated = validateKeyClientSide(storedKey);
          if (validated.valid && validated.user) {
            setUserAuth(validated.user);
          }
        }
      } catch {}

      loadAllAccountData();
    }, 0);

    const handleStorageMutated = () => {
      loadAllAccountData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("astra-save-mutated", handleStorageMutated);
    }
    return () => {
      clearTimeout(initTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("astra-save-mutated", handleStorageMutated);
      }
    };
  }, []);

  // Compute Lifetime Multiverse Telemetry & Sovereign Rank
  const telemetry = useMemo(() => {
    const activeSlotList = Object.values(saveSlots).filter(
      (s): s is SaveSlotPayload => s !== null && Boolean(s.player)
    );
    const totalTurnsLogged = activeSlotList.reduce(
      (acc, s) => acc + (Array.isArray(s.chatLog) ? s.chatLog.length : 0),
      0
    );
    const highestLevel = activeSlotList.reduce(
      (max, s) => Math.max(max, Number(s.player?.level) || 1),
      0
    );
    const totalQuestsCompleted = activeSlotList.reduce(
      (acc, s) =>
        acc +
        (Array.isArray(s.systemState?.completedQuests)
          ? s.systemState.completedQuests.length
          : 0),
      0
    );
    const totalScarsAndCovenants = activeSlotList.reduce(
      (acc, s) =>
        acc +
        (Array.isArray(s.timelineScars) ? s.timelineScars.length : 0) +
        (Number(s.covenantState?.covenantsInvoked) || 0),
      0
    );
    const totalEchoes = localBundle?.summary.totalEchoes || 0;
    const totalRegressions = localBundle?. regressionHistoryByStory
      ? Object.values(localBundle.regressionHistoryByStory).reduce(
          (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
          0
        )
      : 0;
    const customWorldCount = localBundle?.summary.customWorldCount || 0;
    const totalCodexUnlocked = codexStats.totalLoot + codexStats.totalScenes;

    // Calculate Sovereign Meta-XP
    const metaXp =
      activeSlotList.length * 150 +
      highestLevel * 35 +
      totalTurnsLogged * 5 +
      roster.length * 120 +
      customWorldCount * 200 +
      totalCodexUnlocked * 50 +
      (totalEchoes + totalRegressions) * 40;

    const sovereignLevel = Math.max(1, Math.floor(metaXp / 300) + 1);
    const currentTierProgress = Math.round(((metaXp % 300) / 300) * 100);

    let rankTitle = "Rift Initiate";
    if (sovereignLevel >= 12) rankTitle = "Astral Sovereign";
    else if (sovereignLevel >= 8) rankTitle = "Arbiter of Echoes";
    else if (sovereignLevel >= 5) rankTitle = "Causal Vanguard";
    else if (sovereignLevel >= 3) rankTitle = "Chronicle Seeker";

    // Pick best fallback avatar from override, user, roster, or active saves
    const bestAvatar =
      profileOverride.avatarUrl ||
      user?.avatarUrl ||
      roster.find((r) => r.avatar)?.avatar ||
      activeSlotList.find((s) => s.playerAvatar)?.playerAvatar ||
      "";

    return {
      activeSlotCount: activeSlotList.length,
      totalTurnsLogged,
      highestLevel,
      totalQuestsCompleted,
      totalScarsAndCovenants,
      totalEchoes,
      totalRegressions,
      customWorldCount,
      totalCodexUnlocked,
      metaXp,
      sovereignLevel,
      currentTierProgress,
      rankTitle: profileOverride.titleBadge || rankTitle,
      bestAvatar,
    };
  }, [saveSlots, localBundle, codexStats, roster, profileOverride, user]);

  const effectiveDisplayName =
    user?.displayName ||
    profileOverride.displayName ||
    localBundle?.summary.activeCharacterName ||
    "Astral Traveler";

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    const res = await updateCloudUserProfile({
      displayName: handleDraft.trim() || "Astral Traveler",
      avatarUrl: avatarDraft,
      titleBadge: titleBadgeDraft.trim() || undefined,
    });
    setUser(res.user);
    setProfileOverride(res.override);
    setEditingProfile(false);
    setStatusBanner({
      type: "success",
      text: "Traveler Dossier identity updated!",
    });
  };

  const handleProfileAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = String(reader.result || "");
      const compressed = (await compressAvatarImage(rawDataUrl, 384)) || rawDataUrl;
      setAvatarDraft(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleOAuthLogin = async (provider: OAuthProviderType) => {
    soundEffects.playClick();
    setStatusBanner(null);
    const res = await signInWithOAuthProvider(provider);
    if (res.error) {
      setStatusBanner({ type: "error", text: res.error });
      setActiveTab("settings");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setAuthLoading(true);
    setStatusBanner(null);
    try {
      const res = await authenticateWithEmail({
        email: authEmail,
        password: authPassword,
        mode: authMode,
        displayName: authDisplayName,
      });
      if (res.error) {
        setStatusBanner({ type: "error", text: res.error });
      } else if (res.user) {
        setUser(res.user);
        setAuthPassword("");
        // Perform bidirectional sync on sign-in
        const remote = await fetchCloudProgression(res.user);
        if (remote.bundle) {
          await applyProgressionBundle(remote.bundle, "merge");
        }
        await syncProgressionToCloud(res.user);
        await loadAllAccountData();
        soundEffects.playQuestComplete();
        setStatusBanner({
          type: "success",
          text: `Connected as ${res.user.displayName} (${res.user.email}) — All Saves & Character Roster Synced!`,
        });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    soundEffects.playClick();
    await signOutCloudAccount();
    setUser(null);
    setCloudBundle(null);
    setStatusBanner({ type: "info", text: "Signed out of Cloud Sync account." });
  };

  const handlePushToCloud = async () => {
    if (!user) {
      setStatusBanner({
        type: "info",
        text: "Sign in with Google, Discord, GitHub, or Email above to sync to the Cloud Vault.",
      });
      return;
    }
    soundEffects.playClick();
    setSyncBusy(true);
    setStatusBanner(null);
    try {
      const res = await syncProgressionToCloud(user);
      if (!res.success) {
        setStatusBanner({ type: "error", text: res.error || "Failed to push to Cloud Vault." });
      } else {
        const now = res.updatedAt || new Date().toISOString();
        setLastSyncedAt(now);
        await loadAllAccountData();
        setStatusBanner({
          type: "success",
          text: `Cloud Vault synchronized! Backed up ${telemetry.activeSlotCount} save slot(s), ${roster.length} roster character(s), and ${telemetry.totalCodexUnlocked} Codex item(s).`,
        });
      }
    } finally {
      setSyncBusy(false);
    }
  };

  const handlePullFromCloud = async (mode: "merge" | "overwrite") => {
    if (!cloudBundle) return;
    soundEffects.playClick();
    setSyncBusy(true);
    setStatusBanner(null);
    try {
      const result = await applyProgressionBundle(cloudBundle, mode);
      const charCount = cloudBundle.characterRoster?.length ?? 0;
      await loadAllAccountData();
      setStatusBanner({
        type: "success",
        text: `Restored from Cloud Vault (${mode === "merge" ? "Smart Merge" : "Full Overwrite"}): ${result.restoredSlots} slot(s), ${charCount} character(s), and ${result.restoredStories} custom world(s)!`,
      });
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to pull cloud progression.",
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const handleExportAstraBackup = async () => {
    soundEffects.playClick();
    setSyncBusy(true);
    try {
      await downloadAstraBundleFile();
      setStatusBanner({
        type: "success",
        text: "Downloaded .astra Master Progression Backup file!",
      });
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to export .astra backup.",
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const handleImportAstraBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEffects.playClick();
    setSyncBusy(true);
    try {
      const parsed = await parseAstraBundleFile(file);
      const res = await applyProgressionBundle(parsed, "merge");
      const charCount = parsed.characterRoster?.length ?? 0;
      if (user && autoSync) {
        await syncProgressionToCloud(user);
      }
      await loadAllAccountData();
      setStatusBanner({
        type: "success",
        text: `Smart-merged "${file.name}": ${res.restoredSlots} save slot(s), ${charCount} character(s), and ${res.restoredLoot} Codex relic(s)!`,
      });
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Invalid .astra backup file.",
      });
    } finally {
      setSyncBusy(false);
      if (astraFileInputRef.current) astraFileInputRef.current.value = "";
    }
  };

  // Save Slot Actions
  const handleResumeSaveSlot = (slot: SaveSlotPayload) => {
    soundEffects.playClick();
    const targetStoryId = slot.storyId || stories[0]?.id || "solo-leveling-echoes";
    router.push(`/play/${encodeURIComponent(targetStoryId)}?loadSlot=${slot.slotId}`);
  };

  const handleExtractSlotToRoster = async (slot: SaveSlotPayload) => {
    if (!slot.player) return;
    soundEffects.playClick();
    const blueprint = createBlueprintFromPlayer({
      player: slot.player,
      avatar: slot.playerAvatar || "",
      narrationStyle: slot.narrationStyle || slot.player.narrationStyle || "Light Novel",
      originWorldTitle: slot.storyTitle || "Saved Campaign",
    });
    const nextRoster = await saveCharacterToRoster(blueprint);
    setRoster(nextRoster);
    if (user && autoSync) {
      syncProgressionToCloud(user).catch(() => {});
    }
    setStatusBanner({
      type: "success",
      text: `Saved "${blueprint.name}" (${blueprint.race} ${blueprint.role}) to your Cross-World Character Roster! (Identity only — level & items excluded)`,
    });
  };

  const handleDeleteSlot = async (slotId: number) => {
    const label = slotId === 0 ? "Auto-Save Slot 00" : `Save Slot 0${slotId}`;
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    soundEffects.playClick();
    await deleteGameSlot(slotId);
    await loadAllAccountData();
    setStatusBanner({ type: "info", text: `Cleared ${label}.` });
  };

  // Character Roster Studio Actions
  const openCreateCharacterBlueprint = () => {
    soundEffects.playClick();
    setEditingBlueprint(null);
    setBpName("");
    setBpRole("Voidstrider");
    setBpRace("Human");
    setBpRacialTraits("Adaptable, Indomitable Will");
    setBpPersonality("Stoic Pragmatist");
    setBpPersonalityTraits("Calculated, Composed, Observant, Resolute");
    setBpNarrationStyle(profileOverride.preferredNarrationStyle || "Light Novel");
    setBpVisualDesc("");
    setBpAvatar("");
    setShowBlueprintEditor(true);
  };

  const openEditCharacterBlueprint = (char: SavedCharacterBlueprint) => {
    soundEffects.playClick();
    setEditingBlueprint(char);
    setBpName(char.name);
    setBpRole(char.role);
    setBpRace(char.race);
    setBpRacialTraits((char.racialTraits || []).join(", "));
    setBpPersonality(char.personality);
    setBpPersonalityTraits((char.personalityTraits || []).join(", "));
    setBpNarrationStyle(char.narrationStyle || "Light Novel");
    setBpVisualDesc(char.visualDescription || "");
    setBpAvatar(char.avatar || "");
    setShowBlueprintEditor(true);
  };

  const handleBlueprintAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = String(reader.result || "");
      const compressed = (await compressAvatarImage(rawDataUrl, 384)) || rawDataUrl;
      setBpAvatar(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBlueprintForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpName.trim()) return;
    soundEffects.playClick();

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const cleanName = bpName.trim();
    const cleanRace = bpRace.trim() || "Human";
    const cleanRole = bpRole.trim() || "Voidstrider";

    const blueprint: SavedCharacterBlueprint = {
      id:
        editingBlueprint?.id ||
        `char_${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${cleanRace
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")}_${cleanRole.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      name: cleanName,
      role: cleanRole,
      race: cleanRace,
      racialTraits: bpRacialTraits
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      personality: bpPersonality.trim() || "Stoic Pragmatist",
      personalityTraits: bpPersonalityTraits
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      avatar: bpAvatar,
      visualDescription: bpVisualDesc.trim() || undefined,
      visualDna: editingBlueprint?.visualDna,
      narrationStyle: bpNarrationStyle,
      originWorldTitle: editingBlueprint?.originWorldTitle || "Traveler Roster Studio",
      createdAt: editingBlueprint?.createdAt || nowIso,
      updatedAt: nowIso,
      updatedAtMs: nowMs,
    };

    const nextRoster = await saveCharacterToRoster(blueprint);
    setRoster(nextRoster);
    setShowBlueprintEditor(false);
    setEditingBlueprint(null);

    if (user && autoSync) {
      syncProgressionToCloud(user).catch(() => {});
    }

    setStatusBanner({
      type: "success",
      text: `Saved "${blueprint.name}" to your Cross-World Character Roster!`,
    });
  };

  const handleDeleteRosterCharacter = async (char: SavedCharacterBlueprint) => {
    if (!confirm(`Remove "${char.name}" from your Cross-World Character Roster?`)) return;
    soundEffects.playClick();
    const nextRoster = await deleteCharacterFromRoster(char.id);
    setRoster(nextRoster);
    setStatusBanner({
      type: "info",
      text: `Removed "${char.name}" from Character Roster.`,
    });
  };

  const handleVerifyAccessKey = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    if (!keyInput.trim()) return;

    const clientRes = validateKeyClientSide(keyInput.trim());
    if (clientRes.valid && clientRes.user) {
      setUserAuth(clientRes.user);
      localStorage.setItem("astra_access_key", keyInput.trim());
      setStatusBanner({
        type: "success",
        text: `Access Key verified: ${clientRes.user.name} (${
          clientRes.user.remainingTurns === -1
            ? "Unlimited Turns"
            : `${clientRes.user.remainingTurns} Turns`
        }).`,
      });
      return;
    }

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: keyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid && data.user) {
        setUserAuth(data.user);
        localStorage.setItem("astra_access_key", keyInput.trim());
        setStatusBanner({
          type: "success",
          text: `Access Key verified: ${data.user.name}!`,
        });
      } else {
        setStatusBanner({
          type: "error",
          text: data.error || clientRes.error || "Invalid Access Key.",
        });
      }
    } catch {
      setStatusBanner({
        type: "error",
        text: clientRes.error || "Could not verify Access Key.",
      });
    }
  };

  const handleSaveSupabaseSettings = () => {
    soundEffects.playClick();
    saveCustomSupabaseCredentials(customSupaUrl, customSupaKey);
    const creds = getSupabaseCredentials();
    setSupaConfigured(creds.isConfigured);
    setStatusBanner({
      type: "success",
      text: creds.isConfigured
        ? "Custom Supabase Cloud endpoint saved! OAuth & Postgres Cloud Vault active."
        : "Cleared custom Supabase endpoint. Using environment or Local Realm Server.",
    });
    loadAllAccountData();
  };

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 font-sans text-zinc-100 overflow-x-hidden selection:bg-rose-500/30 selection:text-white">
      {/* Dynamic Background Backdrop */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none brightness-50 contrast-125"
        style={{ backgroundImage: `url("/backgrounds/imperial_capital_imperium.jpg")` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-zinc-950/90 to-zinc-950 pointer-events-none" />
      <div className="fixed inset-0 cinematic-vignette pointer-events-none" />
      <AtmosphericParticles location="Imperial Capital Imperium" intensity="gentle" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* TOP NAVIGATION HEADER */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={() => soundEffects.playClick()}
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-white/10 border border-white/10 hover:border-white/30 text-zinc-300 hover:text-white transition-all flex items-center justify-center"
              title="Back to Multiverse Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.35)]">
              <User className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                ASTRAL TRAVELER{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-300">
                  DOSSIER
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Account & Roster Hub
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Manage your Cross-Save Cloud Identity, Reusable Character Roster, Save Slots & Engine Settings
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <LlmQuickPill
              config={llmConfig}
              onClick={() => {
                soundEffects.playClick();
                setShowLlmModal(true);
              }}
            />
            <Link
              href="/codex"
              onClick={() => soundEffects.playClick()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-amber-500/40 text-xs font-mono text-amber-300 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Codex ({telemetry.totalCodexUnlocked})</span>
            </Link>
            <Link
              href="/"
              onClick={() => soundEffects.playClick()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 text-xs font-mono font-bold text-rose-200 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span>Explore Worlds</span>
            </Link>
          </div>
        </header>

        {/* STATUS FEEDBACK BANNER */}
        {statusBanner && (
          <div
            className={`px-4 py-3 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
              statusBanner.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                : statusBanner.type === "error"
                ? "bg-rose-950/60 border-rose-500/40 text-rose-200"
                : "bg-sky-950/60 border-sky-500/40 text-sky-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusBanner.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : statusBanner.type === "error" ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-zinc-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* HERO IDENTITY & SOVEREIGN RANK BANNER */}
        <section className="rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-950/95 to-sky-950/40 border border-white/15 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Avatar + Identity + Rank */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-sky-400/50 bg-zinc-900 shadow-[0_0_30px_rgba(56,189,248,0.2)] flex items-center justify-center">
                  {telemetry.bestAvatar ? (
                    <img
                      src={sanitizeImageUrl(telemetry.bestAvatar, DEFAULT_AVATAR)}
                      alt={effectiveDisplayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black font-mono text-sky-300">
                      {effectiveDisplayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-mono font-black text-[10px] shadow-lg">
                  RANK {telemetry.sovereignLevel}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white font-mono">
                    {effectiveDisplayName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    {telemetry.rankTitle}
                  </span>
                  {user ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      {user.provider.toUpperCase()} SYNCED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 border border-white/10">
                      Local Device Session
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 font-mono">
                  {user
                    ? `${user.email} • ${
                        lastSyncedAt
                          ? `Last Cloud Sync: ${new Date(lastSyncedAt).toLocaleString()}`
                          : "Cloud Vault Connected"
                      }`
                    : "Not signed in to Cloud Vault — Saves stored locally in IndexedDB"}
                </p>

                {/* Sovereign Meta-XP Progress Bar */}
                <div className="pt-1 max-w-md space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>Multiverse Resonance XP: {telemetry.metaXp} XP</span>
                    <span className="text-sky-300">{telemetry.currentTierProgress}% to Rank {telemetry.sovereignLevel + 1}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/80 border border-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400 transition-all duration-500"
                      style={{ width: `${telemetry.currentTierProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Profile Actions & Cloud Quick Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setEditingProfile((v) => !v);
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                Edit Traveler Profile
              </button>

              {user ? (
                <>
                  <button
                    type="button"
                    disabled={syncBusy}
                    onClick={handlePushToCloud}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-200 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncBusy ? "animate-spin" : ""}`} />
                    Sync Saves Now
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-rose-950/50 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 cursor-pointer transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowCloudSyncModal(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/50 text-xs font-mono font-bold text-sky-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                >
                  <Cloud className="w-4 h-4 text-sky-300" />
                  Connect OAuth / Cloud Vault
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Edit Profile Drawer */}
          {editingProfile && (
            <form
              onSubmit={handleSaveProfile}
              className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150"
            >
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Traveler Handle (Display Name)
                </label>
                <input
                  type="text"
                  value={handleDraft}
                  onChange={(e) => setHandleDraft(e.target.value)}
                  placeholder="e.g., Sovereign Kaelen"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Custom Title / Honorific (Optional)
                </label>
                <input
                  type="text"
                  value={titleBadgeDraft}
                  onChange={(e) => setTitleBadgeDraft(e.target.value)}
                  placeholder="e.g., Monarch of Shadows"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  Profile Avatar
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={profileAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profileAvatarInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-sky-300 cursor-pointer"
                  >
                    Upload Portrait
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Profile
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>

        {/* NAVIGATION TABS */}
        <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("overview");
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.18)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Dossier & Overview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("roster");
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "roster"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.18)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Character Roster ({roster.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("vault");
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "vault"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.18)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Save Slots & Cloud ({telemetry.activeSlotCount}/4)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("settings");
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.18)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Engine & Access Keys</span>
          </button>
        </nav>

        {/* TAB 1: MULTIVERSE DOSSIER & OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 6-Card Multiverse Telemetry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Chronicle Turns
                </span>
                <p className="text-xl font-black font-mono text-white">
                  {telemetry.totalTurnsLogged}
                </p>
                <span className="text-[10px] text-zinc-500 block">Across active slots</span>
              </div>

              <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Highest Level
                </span>
                <p className="text-xl font-black font-mono text-amber-300">
                  Lv.{telemetry.highestLevel || 1}
                </p>
                <span className="text-[10px] text-zinc-500 block">
                  {telemetry.totalQuestsCompleted} quests cleared
                </span>
              </div>

              <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" /> Saved Roster
                </span>
                <p className="text-xl font-black font-mono text-emerald-300">{roster.length}</p>
                <span className="text-[10px] text-zinc-500 block">Cross-world heroes</span>
              </div>

              <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-sky-400" /> Custom Worlds
                </span>
                <p className="text-xl font-black font-mono text-sky-300">
                  {telemetry.customWorldCount}
                </p>
                <span className="text-[10px] text-zinc-500 block">Forged in World Forge</span>
              </div>

              <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Codex Vault
                </span>
                <p className="text-xl font-black font-mono text-purple-300">
                  {telemetry.totalCodexUnlocked}
                </p>
                <span className="text-[10px] text-zinc-500 block">
                  {codexStats.totalLoot} relics • {codexStats.totalScenes} CGs
                </span>
              </div>

              <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-cyan-400" /> Loop Echoes
                </span>
                <p className="text-xl font-black font-mono text-cyan-300">
                  {telemetry.totalEchoes + telemetry.totalRegressions}
                </p>
                <span className="text-[10px] text-zinc-500 block">
                  {telemetry.totalScarsAndCovenants} causal scars
                </span>
              </div>
            </div>

            {/* If Not Signed In: Inline OAuth & Email Account Card */}
            {!user && (
              <div className="bg-zinc-900/80 border border-sky-500/30 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" /> Link Your Astra Chronicles Account
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Sign in with Google, Discord, GitHub, or Email to automatically sync your Save Slots (0–3) and Character Roster across all devices.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin("google")}
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin("discord")}
                    className="py-2.5 px-4 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-xs font-semibold text-indigo-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Continue with Discord</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin("github")}
                    className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-xs font-semibold text-zinc-100 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Continue with GitHub</span>
                  </button>
                </div>

                <form
                  onSubmit={handleEmailAuth}
                  className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
                >
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="traveler@astrachronicles.gg"
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/50 border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                      Traveler Handle (Optional)
                    </label>
                    <input
                      type="text"
                      value={authDisplayName}
                      onChange={(e) => setAuthDisplayName(e.target.value)}
                      placeholder="Sovereign Kael"
                      className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      disabled={authLoading}
                      onClick={() => setAuthMode("signin")}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/40 text-xs font-mono font-bold text-emerald-200 cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      onClick={() => setAuthMode("signup")}
                      className="flex-1 py-2 px-3 rounded-xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/40 text-xs font-mono font-bold text-sky-200 cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Quick Active Campaigns Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" /> Active Chronicle Save Slots
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("vault")}
                  className="text-xs font-mono text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  Manage All Slots & Cloud Vault →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((slotId) => {
                  const slot = saveSlots[slotId];
                  const slotTitle = slotId === 0 ? "AUTO-SAVE (SLOT 00)" : `MANUAL SLOT 0${slotId}`;
                  if (!slot || !slot.player) {
                    return (
                      <div
                        key={slotId}
                        className="rounded-2xl bg-zinc-900/40 border border-white/5 p-4 flex items-center justify-between text-zinc-500"
                      >
                        <span className="text-xs font-mono">{slotTitle} — Empty</span>
                        <Link
                          href="/"
                          className="text-[11px] font-mono text-zinc-400 hover:text-white underline"
                        >
                          Start a Chronicle
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slotId}
                      className="rounded-2xl bg-zinc-900/80 border border-white/15 hover:border-amber-500/40 p-4 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={sanitizeImageUrl(slot.playerAvatar, DEFAULT_AVATAR)}
                          alt={slot.player.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-400/40 shrink-0 bg-black"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {slotTitle}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {slot.player.name}
                            </span>
                            <span className="text-[11px] font-mono text-sky-300">
                              Lv.{slot.player.level || 1} {slot.player.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {slot.storyTitle || "Chronicle"} • {slot.gameState?.location || "Unknown Sector"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleExtractSlotToRoster(slot)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-amber-300 cursor-pointer"
                          title="Extract Character Identity to Cross-World Roster"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResumeSaveSlot(slot)}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Resume
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CROSS-WORLD CHARACTER ROSTER STUDIO */}
        {activeTab === "roster" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" /> Cross-World Character Roster Studio
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
                  Characters saved here preserve their **identity only** (Name, Portrait, Race & Racial Traits, Class Archetype, Personality & Dialogue Alignment, and Narration Style) — never level or inventory items — so you can deploy them fresh into any world or prologue introduction.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateCharacterBlueprint}
                className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <Plus className="w-4 h-4" />
                Create Character Blueprint
              </button>
            </div>

            {/* Quick Extract Bar from Active Save Slots */}
            {telemetry.activeSlotCount > 0 && (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-zinc-300">
                  Extract character identity from an existing Save Slot into your Roster:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 1, 2, 3].map((slotId) => {
                    const slot = saveSlots[slotId];
                    if (!slot || !slot.player) return null;
                    return (
                      <button
                        key={slotId}
                        type="button"
                        onClick={() => handleExtractSlotToRoster(slot)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/15 hover:border-amber-500/40 text-[11px] font-mono text-amber-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>
                          {slotId === 0 ? "Auto" : `Slot 0${slotId}`}: {slot.player.name} ({slot.player.role})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Character Blueprint Editor Drawer */}
            {showBlueprintEditor && (
              <form
                onSubmit={handleSaveBlueprintForm}
                className="bg-zinc-900/95 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-mono font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {editingBlueprint
                      ? `Edit Character Blueprint: ${editingBlueprint.name}`
                      : "Forge New Cross-World Character Blueprint"}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowBlueprintEditor(false)}
                    className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Character Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bpName}
                      onChange={(e) => setBpName(e.target.value)}
                      placeholder="e.g., Kaelen Vance"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Class / Combat Archetype
                    </label>
                    <input
                      type="text"
                      list="class-presets-list"
                      value={bpRole}
                      onChange={(e) => setBpRole(e.target.value)}
                      placeholder="e.g., Voidstrider"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                    <datalist id="class-presets-list">
                      {CLASS_PRESETS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Lineage / Race
                    </label>
                    <select
                      value={bpRace}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBpRace(val);
                        const match = RACE_PRESETS.find((r) => r.name === val);
                        if (match) setBpRacialTraits(match.traits.join(", "));
                      }}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {RACE_PRESETS.map((r) => (
                        <option key={r.name} value={r.name} className="bg-zinc-900">
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Racial Traits (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={bpRacialTraits}
                      onChange={(e) => setBpRacialTraits(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Personality Archetype (Drives Dialogue Options)
                    </label>
                    <select
                      value={bpPersonality}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBpPersonality(val);
                        const match = PERSONALITY_PRESETS.find((p) => p.name === val);
                        if (match) setBpPersonalityTraits(match.traits.join(", "));
                      }}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {PERSONALITY_PRESETS.map((p) => (
                        <option key={p.name} value={p.name} className="bg-zinc-900">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Personality Traits (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={bpPersonalityTraits}
                      onChange={(e) => setBpPersonalityTraits(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Preferred Narration Style
                    </label>
                    <select
                      value={bpNarrationStyle}
                      onChange={(e) => setBpNarrationStyle(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    >
                      {NARRATION_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-zinc-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                      Visual Appearance Notes (For AI Portraits & CGs)
                    </label>
                    <input
                      type="text"
                      value={bpVisualDesc}
                      onChange={(e) => setBpVisualDesc(e.target.value)}
                      placeholder="e.g., Silver hair, obsidian coat, glowing violet eyes"
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={bpAvatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBlueprintAvatarUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bpAvatarInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-amber-300 cursor-pointer"
                    >
                      Upload Portrait
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Blueprint
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Roster Cards Grid */}
            {roster.length === 0 ? (
              <div className="rounded-3xl bg-zinc-900/50 border border-white/10 p-10 text-center space-y-3">
                <Users className="w-10 h-10 text-amber-400/60 mx-auto" />
                <h4 className="text-sm font-mono font-bold text-white">
                  Your Cross-World Character Roster is Empty
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Create a character blueprint above, extract one from an active Save Slot, or click &ldquo;Save to Roster&rdquo; during Character Creation or inside your in-game Character Sheet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roster.map((char) => (
                  <div
                    key={char.id}
                    className="rounded-3xl bg-zinc-900/85 border border-white/15 hover:border-amber-500/40 p-4 flex flex-col justify-between gap-4 shadow-xl transition-all"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={sanitizeImageUrl(char.avatar, DEFAULT_AVATAR)}
                        alt={char.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-amber-400/40 bg-black shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white font-mono truncate">
                            {char.name}
                          </h4>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                            Identity Only
                          </span>
                        </div>
                        <p className="text-xs font-mono text-sky-300">
                          {char.race} • {char.role}
                        </p>
                        <p className="text-[11px] text-emerald-300/90 font-mono">
                          Personality: {char.personality}
                        </p>
                        {char.personalityTraits && char.personalityTraits.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {char.personalityTraits.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-zinc-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditCharacterBlueprint(char)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer"
                          title="Edit Blueprint"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRosterCharacter(char)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/50 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 cursor-pointer"
                          title="Delete Blueprint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setDeployingCharacter(char);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Launch into World...
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVE SLOTS (0-3) & CLOUD VAULT COMMAND CENTER */}
        {activeTab === "vault" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Cloud Vault Action Bar */}
            <div className="bg-zinc-900/85 border border-emerald-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-400" /> Astral Cloud Vault & Portable `.astra` Backup
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {user
                      ? `Connected as ${user.displayName} (${user.email}). Auto-Sync backs up your saves after every turn.`
                      : "Export a portable .astra archive anytime, or connect an account to enable automatic cloud sync."}
                  </p>
                </div>

                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      const next = !autoSync;
                      setAutoSync(next);
                      setCloudAutoSyncEnabled(next);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 cursor-pointer ${
                      autoSync
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-zinc-400 border-white/10"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Auto-Sync: {autoSync ? "ON" : "OFF"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={handlePushToCloud}
                  className="py-3 px-4 rounded-2xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-xs font-mono font-bold text-sky-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CloudUpload className="w-4 h-4 text-sky-300" />
                  Push Local to Cloud
                </button>

                <button
                  type="button"
                  disabled={syncBusy || !cloudBundle}
                  onClick={() => handlePullFromCloud("merge")}
                  className="py-3 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/35 disabled:opacity-40 border border-emerald-400/40 text-xs font-mono font-bold text-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CloudDownload className="w-4 h-4 text-emerald-300" />
                  Pull & Smart-Merge Cloud
                </button>

                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={handleExportAstraBackup}
                  className="py-3 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-xs font-mono font-bold text-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  Export .astra File
                </button>

                <input
                  ref={astraFileInputRef}
                  type="file"
                  accept=".astra,.json,application/json"
                  onChange={handleImportAstraBackup}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={() => astraFileInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/40 text-xs font-mono font-bold text-purple-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-purple-300" />
                  Import .astra File
                </button>
              </div>
            </div>

            {/* Detailed 4-Slot Campaign Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((slotId) => {
                const slot = saveSlots[slotId];
                const slotLabel = slotId === 0 ? "SLOT 00 • AUTO-SAVE" : `SLOT 0${slotId} • MANUAL SAVE`;

                if (!slot || !slot.player) {
                  return (
                    <div
                      key={slotId}
                      className="rounded-3xl bg-zinc-900/45 border border-white/10 p-5 flex flex-col justify-between min-h-[150px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-zinc-500">
                          {slotLabel}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase">Empty Slot</span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        No chronicle saved in this slot yet.
                      </p>
                      <Link
                        href="/"
                        className="text-xs font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                      >
                        Start a new campaign →
                      </Link>
                    </div>
                  );
                }

                const turnCount = Array.isArray(slot.chatLog) ? slot.chatLog.length : 0;
                const plausibility = slot.systemState?.plausibility ?? 100;

                return (
                  <div
                    key={slotId}
                    className="rounded-3xl bg-zinc-900/90 border border-white/15 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-4 shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={sanitizeImageUrl(slot.playerAvatar, DEFAULT_AVATAR)}
                          alt={slot.player.name}
                          className="w-16 h-16 rounded-2xl object-cover border border-emerald-400/40 bg-black shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-block">
                            {slotLabel}
                          </span>
                          <h4 className="text-base font-bold text-white font-mono truncate">
                            {slot.player.name}{" "}
                            <span className="text-xs text-amber-300">
                              (Lv.{slot.player.level || 1} {slot.player.race} {slot.player.role})
                            </span>
                          </h4>
                          <p className="text-xs text-zinc-300 truncate">
                            {slot.storyTitle || "Astral Chronicle"} •{" "}
                            <span className="text-sky-300">
                              {slot.gameState?.location || "Unknown Sector"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slotId)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 cursor-pointer"
                        title="Clear Save Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/5 rounded-2xl p-2.5 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block">Vitals</span>
                        <span className="text-xs font-bold text-emerald-300">
                          {slot.player.stats?.hp ?? 100} HP / {slot.player.stats?.mp ?? 60} MP
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block">Chronicle Log</span>
                        <span className="text-xs font-bold text-white">{turnCount} Entries</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block">Plausibility</span>
                        <span className="text-xs font-bold text-sky-300">{plausibility}%</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] font-mono text-zinc-500">
                        Saved: {slot.savedAt}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExtractSlotToRoster(slot)}
                          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          title="Save this character's identity (no level/items) to your Cross-World Roster"
                        >
                          <Users className="w-3.5 h-3.5" />
                          Save Character to Roster
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResumeSaveSlot(slot)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Resume Campaign
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AI ENGINE, ACCESS KEYS & PREFERENCES */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-150">
            {/* Access Key & Turn Quota Card */}
            <div className="bg-zinc-900/85 border border-white/15 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" /> Access Key & Turn Quota
                </h3>
                {userAuth && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {userAuth.role.toUpperCase()} •{" "}
                    {userAuth.remainingTurns === -1
                      ? "UNLIMITED TURNS"
                      : `${userAuth.remainingTurns} TURNS`}
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your Astra Chronicles Realm Access Key or OpenRouter API Key to unlock narrative turns.
              </p>

              <form onSubmit={handleVerifyAccessKey} className="space-y-3">
                <div className="relative">
                  <input
                    type={showKeySecret ? "text" : "password"}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Enter Realm Access Key (e.g., ASTRA-SOVEREIGN-...)"
                    className="w-full bg-black/60 border border-white/15 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/45 border border-purple-400/40 text-xs font-mono font-bold text-purple-200 cursor-pointer transition-all"
                >
                  Verify & Save Access Key
                </button>
              </form>
            </div>

            {/* AI Narrative Engine & Global Defaults Card */}
            <div className="bg-zinc-900/85 border border-white/15 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" /> AI Narrative Engine & Defaults
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowLlmModal(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-[11px] font-mono font-bold text-sky-200 cursor-pointer"
                >
                  Configure LLM Provider
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                    Default Preferred Narration Style
                  </label>
                  <select
                    value={profileOverride.preferredNarrationStyle || "Light Novel"}
                    onChange={async (e) => {
                      const nextStyle = e.target.value;
                      const res = await updateCloudUserProfile({
                        preferredNarrationStyle: nextStyle,
                      });
                      setProfileOverride(res.override);
                      setStatusBanner({
                        type: "success",
                        text: `Default Narration Style set to "${nextStyle}".`,
                      });
                    }}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  >
                    {NARRATION_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-zinc-900">
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-200 block">
                      UI & Combat Sound Effects
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Synthesized WebAudio feedback during choices and clashes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = soundEffects.toggleMute();
                      setIsAudioMuted(next);
                      if (!next) soundEffects.playClick();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-zinc-200 flex items-center gap-2 cursor-pointer"
                  >
                    {isAudioMuted ? (
                      <>
                        <VolumeX className="w-4 h-4 text-zinc-500" /> Muted
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-emerald-400" /> Active
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Supabase Cloud Endpoint Configuration */}
            <div className="lg:col-span-2 bg-zinc-900/85 border border-white/15 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Supabase Cloud Federation Endpoint
                </h3>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                    supaConfigured
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border-white/10"
                  }`}
                >
                  {supaConfigured ? "Supabase Cloud Active" : "Local Realm Server Active"}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Astra Chronicles uses your configured environment keys by default, or you can override the Supabase Project URL & Public Anon Key below:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="url"
                  value={customSupaUrl}
                  onChange={(e) => setCustomSupaUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <input
                  type="password"
                  value={customSupaKey}
                  onChange={(e) => setCustomSupaKey(e.target.value)}
                  placeholder="Supabase Public Anon Key (eyJ...)"
                  className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveSupabaseSettings}
                  className="py-2 px-4 rounded-xl bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/40 text-xs font-mono font-bold text-sky-200 cursor-pointer"
                >
                  Save Cloud Endpoint
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEPLOY SAVED CHARACTER TO WORLD MODAL */}
      {deployingCharacter && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setDeployingCharacter(null)}
        >
          <div
            className="w-full max-w-xl bg-zinc-950 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={sanitizeImageUrl(deployingCharacter.avatar, DEFAULT_AVATAR)}
                  alt={deployingCharacter.name}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-400/40"
                />
                <div>
                  <h3 className="text-sm font-mono font-bold text-white">
                    Deploy {deployingCharacter.name} Into a World
                  </h3>
                  <p className="text-[11px] text-amber-300 font-mono">
                    {deployingCharacter.race} {deployingCharacter.role} • {deployingCharacter.personality}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeployingCharacter(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Select a world below. {deployingCharacter.name}&apos;s identity, portrait, race, class, personality, and narration style will be pre-loaded into Character Creation at Level 1 so you can choose any prologue introduction:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {stories.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    router.push(
                      `/play/${encodeURIComponent(st.id)}?rosterCharId=${encodeURIComponent(
                        deployingCharacter.id
                      )}`
                    );
                  }}
                  className="w-full p-3 rounded-2xl bg-zinc-900 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 text-left transition-all cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-bold text-white truncate">{st.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{st.tagline}</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-mono font-bold text-[11px] shrink-0 flex items-center gap-1">
                    <Play className="w-3 h-3 fill-current" /> Launch
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LLM PROVIDER MODAL */}
      <LlmProviderModal
        isOpen={showLlmModal}
        config={llmConfig}
        onClose={() => setShowLlmModal(false)}
        onChange={(next: LlmConfig) => {
          setLlmConfig(next);
          saveStoredLlmConfig(next);
          setStatusBanner({
            type: "success",
            text: `AI Narrative Engine updated to ${next.modelId}.`,
          });
        }}
      />

      {/* CLOUD SYNC MODAL */}
      <CloudSyncModal
        isOpen={showCloudSyncModal}
        onClose={() => setShowCloudSyncModal(false)}
        onProgressionRestored={loadAllAccountData}
      />
    </div>
  );
}

