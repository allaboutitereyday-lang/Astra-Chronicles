"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Play,
  Plus,
  BookOpen,
  Trash2,
  Key,
  Volume2,
  VolumeX,
  Compass,
  User,
  Users,
  Search,
  ChevronRight,
  FolderOpen,
  Lock,
  Eye,
  EyeOff,
  X,
  Cloud,
  MapPin,
  Shield,
  Layers,
} from "lucide-react";
import { StoryContext } from "@/types/story";
import { getAllStories, deleteStory } from "@/lib/storyStorage";
import { soundEffects } from "@/lib/audioEngine";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { loadAllGameSlots, SaveSlotPayload } from "@/lib/saveStorage";
import { loadCharacterRoster, SavedCharacterBlueprint } from "@/lib/characterRosterStorage";
import { sanitizeImageUrl, DEFAULT_BG, DEFAULT_AVATAR } from "@/lib/imageUtils";
import { getCodexStats } from "@/lib/codexStorage";
import { validateKeyClientSide } from "@/lib/clientKeyValidation";
import { CloudSyncModal } from "@/components/CloudSyncModal";
import {
  getActiveCloudUser,
  CloudAccountUser,
  subscribeToCloudAuthChanges,
} from "@/lib/supabaseClient";
import {
  LlmConfig,
  DEFAULT_LLM_CONFIG,
  getStoredLlmConfig,
  saveStoredLlmConfig,
  LlmProviderModal,
  LlmQuickPill,
} from "@/components/LlmProviderSelector";

export default function StoryCataloguePage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [recentSaves, setRecentSaves] = useState<Record<number, SaveSlotPayload | null>>({});
  const [roster, setRoster] = useState<SavedCharacterBlueprint[]>([]);
  const [codexStats, setCodexStats] = useState<{ totalScenes: number; totalLoot: number } | null>(
    null
  );

  // Auth Modal State
  const [keyInput, setKeyInput] = useState<string>("");
  const [userAuth, setUserAuth] = useState<{
    key: string;
    name: string;
    role: string;
    remainingTurns: number;
  } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showKeySecret, setShowKeySecret] = useState<boolean>(false);

  // LLM Provider Routing State
  const [llmConfig, setLlmConfig] = useState<LlmConfig>(DEFAULT_LLM_CONFIG);
  const [showLlmModal, setShowLlmModal] = useState<boolean>(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState<boolean>(false);
  const [isFirstVisitPrompt, setIsFirstVisitPrompt] = useState<boolean>(false);
  const [cloudUser, setCloudUser] = useState<CloudAccountUser | null>(null);

  const loadStories = async () => {
    try {
      const all = await getAllStories();
      setStories(all);
    } catch (err) {
      console.error("Failed to load stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllProgression = () => {
    loadStories();
    loadAllGameSlots().then((slots) => setRecentSaves(slots));
    loadCharacterRoster()
      .then((list) => setRoster(list))
      .catch(() => {});
    getCodexStats()
      .then((stats) => setCodexStats(stats))
      .catch((err) => console.warn("Failed to load codex stats:", err));
    getActiveCloudUser()
      .then((u) => setCloudUser(u))
      .catch(() => {});
  };

  const verifyKey = async (keyToTest: string) => {
    if (!keyToTest.trim()) return;
    setAuthError(null);

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
          localStorage.setItem("astra_access_key", keyToTest.trim());
          setShowAuthModal(false);
          setAuthError(null);
          return;
        } else if (!clientResult.valid) {
          setAuthError(data.error || "Invalid key.");
          return;
        }
      }
    } catch (e) {
      console.warn("Server auth verify bypassed, evaluating client credential:", e);
    }

    if (clientResult.valid && clientResult.user) {
      setUserAuth(clientResult.user);
      localStorage.setItem("astra_access_key", keyToTest.trim());
      setShowAuthModal(false);
      setAuthError(null);
    } else {
      setAuthError(clientResult.error || "Invalid access key. Please verify your credentials.");
    }
  };

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsAudioMuted(soundEffects.isMuted());
      setLlmConfig(getStoredLlmConfig());
      refreshAllProgression();

      // Check whether the user is signed in; if not and they haven't dismissed the registration prompt this session,
      // automatically prompt them to register an Astra Chronicles account / sign in with Google
      getActiveCloudUser()
        .then((u) => {
          setCloudUser(u);
          if (!u && typeof window !== "undefined") {
            const hasOAuthPending =
              Boolean(window.sessionStorage?.getItem("astra_oauth_pending")) ||
              window.location.search.includes("oauth_connected") ||
              window.location.hash.includes("access_token=");
            const alreadyDismissed = Boolean(
              window.sessionStorage?.getItem("astra_welcome_register_prompt_dismissed")
            );
            if (!hasOAuthPending && !alreadyDismissed) {
              setIsFirstVisitPrompt(true);
              setShowCloudSyncModal(true);
            }
          }
        })
        .catch(() => {});

      try {
        const stored = localStorage.getItem("astra_access_key");
        if (stored) {
          setKeyInput(stored);
          verifyKey(stored);
        }
      } catch (e) {
        console.warn("Could not read access key:", e);
      }
    }, 0);

    const unsubscribeAuth = subscribeToCloudAuthChanges((u) => {
      setCloudUser(u);
      if (u) {
        setIsFirstVisitPrompt(false);
      }
    });

    return () => {
      clearTimeout(initTimer);
      unsubscribeAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) soundEffects.playClick();
  };

  const handleDeleteStory = async (e: React.MouseEvent, storyId: string, title: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      soundEffects.playClick();
      await deleteStory(storyId);
      await loadStories();
    }
  };

  const allGenres = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(stories.map((s) => s.genre?.split("/")[0].trim()).filter(Boolean))
      ),
    ],
    [stories]
  );

  const filteredStories = useMemo(
    () =>
      stories.filter((story) => {
        const matchesSearch =
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.companions.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesGenre =
          selectedGenre === "All" ||
          story.genre.toLowerCase().includes(selectedGenre.toLowerCase());

        return matchesSearch && matchesGenre;
      }),
    [stories, searchQuery, selectedGenre]
  );

  // Pick the freshest populated save slot for the Hero Spotlight & Primary Resume CTA
  const latestSave = useMemo(() => {
    const populated = [0, 1, 2, 3]
      .map((id) => recentSaves[id])
      .filter((s): s is SaveSlotPayload => Boolean(s && s.player));
    if (populated.length === 0) return null;

    return [...populated].sort((a, b) => {
      const tA = a.savedAtISO ? Date.parse(a.savedAtISO) || 0 : 0;
      const tB = b.savedAtISO ? Date.parse(b.savedAtISO) || 0 : 0;
      return tB - tA;
    })[0];
  }, [recentSaves]);

  const populatedSaveCount = useMemo(
    () => [0, 1, 2, 3].filter((id) => Boolean(recentSaves[id]?.player)).length,
    [recentSaves]
  );

  const totalCodexCount = (codexStats?.totalScenes || 0) + (codexStats?.totalLoot || 0);

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 font-sans text-zinc-100 overflow-x-hidden selection:bg-rose-500/30 selection:text-white">
      {/* Dynamic Background Backdrop */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-20 pointer-events-none brightness-50 contrast-125"
        style={{ backgroundImage: `url("/backgrounds/imperial_capital_imperium.jpg")` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-zinc-950/90 to-zinc-950 pointer-events-none" />
      <div className="fixed inset-0 cinematic-vignette pointer-events-none" />
      <AtmosphericParticles location="Imperial Capital Imperium" intensity="gentle" />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
        {/* 1. STREAMLINED SINGLE-ROW TOP NAVIGATION BAR */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          {/* Brand Cluster */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-[0_0_24px_rgba(244,63,94,0.45)] shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  ASTRA{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                    CHRONICLES
                  </span>
                </h1>
                <span className="whitespace-nowrap text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Multiverse Hub
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                AI-Directed Dark Fantasy & Sci-Fi Visual Novel Engine
              </p>
            </div>
          </div>

          {/* Unified Right Command Bar (Never wraps onto an orphan line on desktop) */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
            {/* LLM Engine Selector Pill */}
            <LlmQuickPill
              config={llmConfig}
              onClick={() => {
                soundEffects.playClick();
                setShowLlmModal(true);
              }}
            />

            {/* Grouped Utility Dock */}
            <div className="flex items-center gap-1 bg-zinc-900/80 border border-white/10 rounded-2xl p-1 backdrop-blur-md shadow-lg">
              {/* Account & Roster Dossier (with explicit Google OAuth indicator) */}
              <Link
                href="/account"
                onClick={() => soundEffects.playClick()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono text-emerald-300 hover:text-white transition-all whitespace-nowrap"
                title={
                  cloudUser
                    ? cloudUser.provider === "google" ||
                      cloudUser.linkedProviders?.includes("google")
                      ? `Authenticated with Google OAuth (${cloudUser.email}) — Click to open Account Dossier`
                      : `Signed in via ${cloudUser.provider} (${cloudUser.email}) — Click to open Account Dossier`
                    : "Not Signed In — Click to open Account Dossier & verify Google OAuth status"
                }
              >
                {cloudUser &&
                (cloudUser.provider === "google" ||
                  cloudUser.linkedProviders?.includes("google")) ? (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                      />
                    </svg>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span>Google: {cloudUser.displayName.split(" ")[0]}</span>
                  </>
                ) : cloudUser ? (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    <span>{cloudUser.displayName.split(" ")[0]}</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-amber-200">Account (Guest)</span>
                  </>
                )}
              </Link>

              <div className="h-4 w-px bg-white/10" />

              {/* Cloud Sync / Register Quick Modal */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setIsFirstVisitPrompt(false);
                  setShowCloudSyncModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono text-sky-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                title={
                  cloudUser
                    ? "Cross-Save Cloud Sync & Portable .astra Backup"
                    : "Sign In with Google or Register an Astra Chronicles Account"
                }
              >
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">{cloudUser ? "Sync" : "Sign In / Register"}</span>
                {cloudUser && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
              </button>

              <div className="h-4 w-px bg-white/10" />

              {/* Access Key / Turn Quota */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                title="Verify Realm Access Key & Turn Quota"
              >
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {userAuth
                    ? userAuth.remainingTurns === -1
                      ? "Unlimited"
                      : `${userAuth.remainingTurns}t`
                    : "Key"}
                </span>
              </button>

              <div className="h-4 w-px bg-white/10" />

              {/* Multiverse Codex */}
              <Link
                href="/codex"
                onClick={() => soundEffects.playClick()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-xs font-mono text-amber-300 hover:text-white transition-all whitespace-nowrap"
                title="Multiverse Codex - Scene CGs & Loot Reliquary"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Codex</span>
                {totalCodexCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {totalCodexCount}
                  </span>
                )}
              </Link>

              <div className="h-4 w-px bg-white/10" />

              {/* Audio Mute Toggle */}
              <button
                type="button"
                onClick={handleToggleAudio}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isAudioMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                )}
              </button>
            </div>

            {/* Primary World Forge CTA */}
            <Link
              href="/create/world"
              onClick={() => soundEffects.playClick()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Forge World</span>
            </Link>
          </div>
        </header>

        {/* 2. SPLIT-COLUMN HERO BANNER WITH LIVE TRAVELER & SAVE SPOTLIGHT */}
        <section className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-rose-950/35 via-zinc-900/80 to-indigo-950/35 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
          {/* Subtle decorative radial glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Column (7 cols): Headline, Narrative Hook & Primary CTAs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rose-300 text-[11px] font-mono">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Interactive LitRPG & Visual Novel Multiverse</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-black font-mono tracking-tight text-white leading-[1.15]">
                Enter Infinite Realities.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-200 to-sky-300">
                  Forge Your Legend.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
                Command your own dark-fantasy, sci-fi, or cyberpunk chronicle. Shape companion loyalties, clash with calamity-rank bosses, and carry your custom characters across worlds and timelines.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <Link
                  href="/play/astra-chronicles"
                  onClick={() => soundEffects.playIntroBell()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-mono font-bold text-xs transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-zinc-950" />
                  <span>Play Canon Chronicle</span>
                </Link>

                <Link
                  href="/account"
                  onClick={() => soundEffects.playClick()}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/60 hover:bg-black/90 border border-emerald-500/35 hover:border-emerald-400 text-emerald-300 font-mono font-bold text-xs transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Character Roster & Dossier</span>
                </Link>

                <Link
                  href="/create/world"
                  onClick={() => soundEffects.playClick()}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/15 hover:border-rose-500/50 text-zinc-200 hover:text-white font-mono text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  <span>AI World Generator</span>
                </Link>
              </div>
            </div>

            {/* Right Column (5 cols): Live Latest Chronicle & Traveler Telemetry Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-zinc-950/85 border border-white/15 p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-md">
                {latestSave && latestSave.player ? (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Continue Latest Chronicle
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400">
                        {latestSave.slotId === 0 ? "AUTO-SAVE" : `SLOT #${latestSave.slotId}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <img
                        src={sanitizeImageUrl(latestSave.playerAvatar, DEFAULT_AVATAR)}
                        alt={latestSave.player.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/50 bg-black shrink-0 shadow-lg"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white font-mono truncate">
                            {latestSave.player.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                            Lv.{latestSave.player.level || 1} {latestSave.player.role}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-sky-300 truncate">
                          {latestSave.storyTitle || "Astra Chronicles"}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{latestSave.gameState?.location || "Imperial Capital"}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playIntroBell();
                        const targetStoryId = latestSave.storyId || "astra-chronicles";
                        router.push(
                          `/play/${encodeURIComponent(targetStoryId)}?loadSlot=${latestSave.slotId}`
                        );
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-zinc-950" />
                      <span>Resume {latestSave.player.name}&apos;s Journey</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-rose-400" />
                        Featured Origin Realm
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        CANON CAMPAIGN
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white font-mono">
                        Astra Chronicles: Imperial Convergence
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Awaken in the Baltia Empire alongside Evelyn, Cassia, Seraphina, and Perci. Choose your origin prologue and ascend the causal ranks.
                      </p>
                    </div>

                    <Link
                      href="/play/astra-chronicles"
                      onClick={() => soundEffects.playIntroBell()}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Initialize New Chronicle</span>
                    </Link>
                  </>
                )}

                {/* Mini Multiverse Telemetry Strip */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
                  <Link
                    href="/account"
                    className="rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 p-2 transition-colors"
                  >
                    <span className="text-xs font-mono font-black text-emerald-300 block">
                      {roster.length}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-zinc-400">
                      Saved Heroes
                    </span>
                  </Link>
                  <Link
                    href="/account"
                    className="rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 p-2 transition-colors"
                  >
                    <span className="text-xs font-mono font-black text-sky-300 block">
                      {populatedSaveCount} / 4
                    </span>
                    <span className="text-[9px] font-mono uppercase text-zinc-400">
                      Save Slots
                    </span>
                  </Link>
                  <Link
                    href="/codex"
                    className="rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 p-2 transition-colors"
                  >
                    <span className="text-xs font-mono font-black text-amber-300 block">
                      {totalCodexCount}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-zinc-400">
                      Codex Relics
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. PORTRAIT-RICH ACTIVE CHRONICLE SAVES STRIP */}
        {populatedSaveCount > 0 && (
          <section className="bg-zinc-900/60 border border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-400" /> Active Chronicle Saves ({populatedSaveCount}/4)
              </h3>
              <Link
                href="/account"
                onClick={() => soundEffects.playClick()}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
              >
                <span>Manage Slots & Character Roster</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((slotId) => {
                const save = recentSaves[slotId];
                if (!save || !save.player) return null;
                const targetStoryId = save.storyId || "astra-chronicles";
                const isAuto = slotId === 0;
                return (
                  <button
                    key={slotId}
                    type="button"
                    onClick={() => {
                      soundEffects.playIntroBell();
                      router.push(`/play/${encodeURIComponent(targetStoryId)}?loadSlot=${slotId}`);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl bg-black/55 border transition-all text-left cursor-pointer group ${
                      isAuto
                        ? "border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/20 shadow-[0_0_20px_rgba(52,211,153,0.12)]"
                        : "border-white/10 hover:border-sky-500/50 hover:bg-zinc-900/90"
                    }`}
                  >
                    {/* Character Avatar Portrait with Corner Slot Badge */}
                    <div className="relative shrink-0">
                      <img
                        src={sanitizeImageUrl(save.playerAvatar, DEFAULT_AVATAR)}
                        alt={save.player.name}
                        className={`w-11 h-11 rounded-xl object-cover border bg-zinc-950 ${
                          isAuto ? "border-emerald-400/50" : "border-sky-400/40"
                        }`}
                      />
                      <span
                        className={`absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-md text-[8px] font-mono font-black uppercase shadow ${
                          isAuto
                            ? "bg-emerald-500 text-zinc-950"
                            : "bg-sky-500 text-zinc-950"
                        }`}
                      >
                        {isAuto ? "AUTO" : `#${slotId}`}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs font-bold truncate font-mono ${
                            isAuto
                              ? "text-emerald-200 group-hover:text-emerald-300"
                              : "text-white group-hover:text-sky-300"
                          }`}
                        >
                          {save.player.name}
                        </p>
                        <span className="text-[10px] font-mono text-amber-300 shrink-0">
                          Lv.{save.player.level || 1}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-300 font-mono truncate">
                        {save.player.role}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono truncate">
                        {save.storyTitle || "Astra Chronicles"} • {save.gameState?.location || "En Route"}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 4. UNIFIED REALITIES TOOLBAR & STORY CATALOGUE GRID */}
        <section className="space-y-5">
          {/* Unified Header + Search + Genre Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-zinc-900/50 border border-white/10 rounded-2xl p-3 sm:p-3.5 backdrop-blur-md">
            <div className="flex items-center gap-2.5 pl-1">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Available Realities</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300">
                    {filteredStories.length}
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-400 hidden sm:block">
                  Select a canon realm or launch a custom world with any character from your roster
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Genre Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedGenre(genre);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all cursor-pointer shrink-0 ${
                      selectedGenre === genre
                        ? "bg-rose-600 text-white font-bold shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                        : "bg-black/40 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search worlds, heroines..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500/60 focus:outline-none text-xs text-zinc-200 placeholder:text-zinc-500 font-mono transition-all"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-mono text-sm animate-pulse">
              Manifesting story matrix...
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-zinc-900/30 rounded-3xl border border-white/5">
              <Compass className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-mono text-zinc-400">No stories match your criteria.</p>
              <Link
                href="/create/world"
                className="inline-flex items-center gap-2 text-xs font-mono text-rose-400 hover:text-rose-300 underline"
              >
                Create a new world now <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => {
                const isPreset = story.isPreset || story.id === "astra-chronicles";
                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      soundEffects.playIntroBell();
                      router.push(`/play/${story.id}`);
                    }}
                    className="group relative rounded-3xl border border-white/10 hover:border-rose-500/50 bg-zinc-900/75 hover:bg-zinc-900/95 transition-all duration-300 overflow-hidden flex flex-col shadow-xl cursor-pointer hover:shadow-[0_0_35px_rgba(244,63,94,0.2)] hover:-translate-y-1"
                  >
                    {/* Story Cover Image Header */}
                    <div className="relative h-52 w-full overflow-hidden bg-black/80">
                      <img
                        src={sanitizeImageUrl(story.coverImage, DEFAULT_BG)}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-90 group-hover:brightness-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-black/50" />

                      {/* Top Row: Genre Tag & Preset/Custom Badge (Flex-spaced so they never overlap) */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                        <span
                          className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-mono text-rose-300 uppercase truncate min-w-0"
                          title={story.genre}
                        >
                          {story.genre}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPreset ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold flex items-center gap-1 whitespace-nowrap">
                              <Shield className="w-2.5 h-2.5 shrink-0" /> CANON REALM
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteStory(e, story.id, story.title)}
                              className="p-1.5 rounded-full bg-black/60 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                              title="Delete Custom Story"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title overlay */}
                      <div className="absolute bottom-3 inset-x-4">
                        <h4 className="text-lg font-bold text-white font-mono leading-tight group-hover:text-rose-300 transition-colors">
                          {story.title}
                        </h4>
                      </div>
                    </div>

                    {/* Story Details Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {story.tagline || story.description}
                      </p>

                      {/* Overlapping Companions Avatars Preview & Sectors */}
                      <div className="space-y-2 pt-2.5 border-t border-white/10">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-rose-400" />
                            <span>Heroines & Cast ({story.companions?.length || 0})</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400">
                            {story.worldContext?.locations?.length || 0} Sectors
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center -space-x-2 overflow-hidden py-0.5 pl-0.5">
                            {(story.companions || []).slice(0, 6).map((comp) => (
                              <div
                                key={comp.id || comp.name}
                                className="w-8 h-8 rounded-full overflow-hidden bg-zinc-950 border-2 border-zinc-900 ring-1 ring-white/20 shrink-0 transition-transform hover:scale-110 hover:z-10"
                                title={`${comp.name} (${comp.role})`}
                              >
                                <img
                                  src={sanitizeImageUrl(
                                    comp.baseImageUrl || comp.expressions?.neutral,
                                    DEFAULT_AVATAR
                                  )}
                                  alt={comp.name}
                                  className="w-full h-full object-cover object-top"
                                />
                              </div>
                            ))}
                            {(story.companions || []).length > 6 && (
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-300 shrink-0">
                                +{story.companions.length - 6}
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[140px]">
                            {(story.companions || [])
                              .slice(0, 2)
                              .map((c) => c.name.split(" ")[0])
                              .join(", ")}
                            {(story.companions || []).length > 2 ? "..." : ""}
                          </span>
                        </div>
                      </div>

                      {/* Enter Realm Button */}
                      <div className="pt-1">
                        <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-amber-500 text-zinc-200 group-hover:text-white border border-white/10 group-hover:border-rose-400/50 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Enter Realm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* CARD: FORGE A NEW WORLD CTA */}
              <Link
                href="/create/world"
                onClick={() => soundEffects.playClick()}
                className="group relative rounded-3xl border-2 border-dashed border-white/15 hover:border-rose-500/60 bg-zinc-900/30 hover:bg-zinc-900/60 transition-all duration-300 p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:shadow-[0_0_30px_rgba(244,63,94,0.15)] min-h-[380px]"
              >
                <div className="w-14 h-14 rounded-3xl bg-rose-950/40 border border-rose-500/30 group-hover:border-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-7 h-7 text-rose-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-white font-mono group-hover:text-rose-300 transition-colors">
                    Forge a Custom Reality
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                    Define custom genres, write lore prompts, summon unique heroines, and generate locked visual assets.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-rose-300 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  Launch World Creator →
                </span>
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* AUTHENTICATION / ACCESS MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" /> Realm Access Validation
              </h2>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your whitelisted access key to authorize AI story generation and dialogue turns.
            </p>

            <div className="space-y-2">
              <div className="relative flex items-center">
                <input
                  type={showKeySecret ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Enter realm access key..."
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-zinc-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
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
              {authError && <p className="text-xs text-rose-400 font-mono">{authError}</p>}
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-[11px] text-zinc-400">
              <Lock className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Encrypted locally in browser storage. Your credentials remain private and are verified via secure proxy.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => verifyKey(keyInput)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
              >
                Verify & Save
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Cross-Save Cloud & Portable .astra Backup Modal */}
      <CloudSyncModal
        isOpen={showCloudSyncModal}
        isFirstVisitPrompt={isFirstVisitPrompt}
        defaultAuthMode={isFirstVisitPrompt ? "signup" : undefined}
        onClose={() => {
          setShowCloudSyncModal(false);
          setIsFirstVisitPrompt(false);
          try {
            window.sessionStorage?.setItem("astra_welcome_register_prompt_dismissed", "true");
          } catch {}
          getActiveCloudUser()
            .then((u) => setCloudUser(u))
            .catch(() => {});
        }}
        onProgressionRestored={() => {
          refreshAllProgression();
        }}
      />
    </div>
  );
}
