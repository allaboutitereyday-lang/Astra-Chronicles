"use client";

import React, { useState, useEffect } from "react";
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
  Users,
  Terminal,
  Shield,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  Lock,
  Eye,
  EyeOff,
  X
} from "lucide-react";
import { StoryContext } from "@/types/story";
import { getAllStories, deleteStory } from "@/lib/storyStorage";
import { soundEffects } from "@/lib/audioEngine";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { loadAllGameSlots } from "@/lib/saveStorage";
import { sanitizeImageUrl, DEFAULT_BG, DEFAULT_AVATAR } from "@/lib/imageUtils";
import { getCodexStats } from "@/lib/codexStorage";
import { validateKeyClientSide } from "@/lib/clientKeyValidation";

export default function StoryCataloguePage() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [recentSaves, setRecentSaves] = useState<Record<number, any>>({});
  const [codexStats, setCodexStats] = useState<{ totalScenes: number; totalLoot: number } | null>(null);

  // Auth Modal State
  const [accessKey, setAccessKey] = useState<string>("");
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

  useEffect(() => {
    setIsAudioMuted(soundEffects.isMuted());
    loadStories();

    // Load active save slots
    loadAllGameSlots().then((slots) => {
      setRecentSaves(slots);
    });

    // Load Multiverse Codex stats
    getCodexStats().then((stats) => {
      setCodexStats(stats);
    }).catch((err) => console.warn("Failed to load codex stats:", err));

    try {
      const stored = localStorage.getItem("astra_access_key");
      if (stored) {
        setAccessKey(stored);
        setKeyInput(stored);
        verifyKey(stored);
      }
    } catch (e) {
      console.warn("Could not read access key:", e);
    }
  }, []);

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

  const verifyKey = async (keyToTest: string) => {
    if (!keyToTest.trim()) return;
    setAuthError(null);

    // 1. Check client-side known realm keys & OpenRouter keys
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
          setShowAuthModal(false);
          setAuthError(null);
          return;
        } else if (!clientResult.valid) {
          setAuthError(data.error || "Invalid key.");
          return;
        }
      }
    } catch (e) {
      // In Electron desktop file:// mode or static builds, network/route handler may not be an HTTP server
      console.warn("Server auth verify bypassed, evaluating client credential:", e);
    }

    // 2. Fallback: If client validation succeeded, approve the key
    if (clientResult.valid && clientResult.user) {
      setUserAuth(clientResult.user);
      setAccessKey(keyToTest.trim());
      localStorage.setItem("astra_access_key", keyToTest.trim());
      setShowAuthModal(false);
      setAuthError(null);
    } else {
      setAuthError(clientResult.error || "Invalid access key. Please verify your credentials.");
    }
  };

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

  const allGenres = ["All", ...Array.from(new Set(stories.map((s) => s.genre?.split("/")[0].trim()).filter(Boolean)))];

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.companions.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGenre =
      selectedGenre === "All" || story.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP NAVIGATION BAR */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                ASTRA <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">CHRONICLES</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Multiverse Hub
                </span>
              </h1>
              <p className="text-xs text-zinc-400">Dynamic Multi-Story Visual Novel Engine & World Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleAudio}
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-white/30 text-zinc-400 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-lg"
              title={isAudioMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setShowAuthModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-purple-500/50 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
            >
              <Key className="w-3.5 h-3.5 text-purple-400" />
              <span>{userAuth ? `${userAuth.name.split(" ")[0]} (${userAuth.remainingTurns === -1 ? "âˆž" : `${userAuth.remainingTurns} turns`})` : "Access Key"}</span>
            </button>

            {/* Multiverse Codex Navigation Link */}
            <Link
              href="/codex"
              onClick={() => soundEffects.playClick()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-amber-500/50 text-xs font-mono text-amber-300 hover:text-white transition-all cursor-pointer shadow-lg"
              title="Multiverse Codex - Scene CGs & Loot Reliquary"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Codex</span>
              {codexStats && (codexStats.totalScenes > 0 || codexStats.totalLoot > 0) && (
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {codexStats.totalScenes + codexStats.totalLoot}
                </span>
              )}
            </Link>

            <Link
              href="/create/world"
              onClick={() => soundEffects.playClick()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-mono font-bold shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Forge New World
            </Link>
          </div>
        </header>

        {/* HERO BANNER */}
        <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-rose-950/30 via-zinc-900/60 to-purple-950/30 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rose-300 text-xs font-mono">
              <Terminal className="w-3.5 h-3.5 text-rose-400" /> Transcendent LitRPG Story Matrix
            </span>
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white leading-tight">
              Enter Infinite Realities. Forge Bespoke Characters.
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans">
              Choose from classic dark-fantasy realms or summon entirely custom sci-fi, cyberpunk, or eldritch chronicles powered by structured LLM narrative directors and IPAdapter/ControlNet visual consistency.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/play/astra-chronicles"
                onClick={() => soundEffects.playIntroBell()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-black font-mono font-bold text-xs hover:bg-zinc-200 transition-all shadow-xl cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Play Astra Chronicles
              </Link>
              <Link
                href="/create/world"
                onClick={() => soundEffects.playClick()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-black/60 border border-white/20 text-white font-mono text-xs hover:bg-black/90 hover:border-rose-500/50 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" /> AI Story Generator
              </Link>
              <Link
                href="/codex"
                onClick={() => soundEffects.playClick()}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-black/60 border border-amber-500/30 text-amber-300 font-mono text-xs hover:bg-black/90 hover:border-amber-400 transition-all cursor-pointer shadow-lg"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Multiverse Codex
              </Link>
            </div>
          </div>
        </section>

        {/* RECENT SAVES QUICK-RESUME BAR (IF ANY) */}
        {Object.values(recentSaves).some((s) => s !== null) && (
          <section className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-400" /> Active Chronicle Saves
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Click to resume story</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((slotId) => {
                const save = recentSaves[slotId];
                if (!save) return null;
                const targetStoryId = save.storyId || "astra-chronicles";
                const isAuto = slotId === 0;
                return (
                  <button
                    key={slotId}
                    onClick={() => {
                      soundEffects.playIntroBell();
                      router.push(`/play/${targetStoryId}?loadSlot=${slotId}`);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-black/50 border transition-all text-left cursor-pointer group ${
                      isAuto
                        ? "border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/20 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                        : "border-white/10 hover:border-sky-500/50 hover:bg-black/80"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isAuto
                          ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                          : "bg-sky-950/60 border-sky-500/30 text-sky-300"
                      }`}
                    >
                      {isAuto ? "AUTO" : `#${slotId}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate transition-colors ${
                          isAuto ? "text-emerald-200 group-hover:text-emerald-300" : "text-white group-hover:text-sky-300"
                        }`}
                      >
                        {save.player?.name} â€¢ Lv.{save.player?.level} {save.player?.role}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">
                        {save.storyTitle || "Astra Chronicles"} â€¢ {save.gameState?.location || "En Route"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* SEARCH & GENRE FILTER */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worlds, heroines, themes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 focus:border-rose-500/60 focus:outline-none text-xs text-zinc-200 placeholder:text-zinc-500 font-mono transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedGenre(genre);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer shrink-0 ${
                  selectedGenre === genre
                    ? "bg-rose-600 text-white font-bold shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </section>

        {/* STORY CATALOGUE GRID */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-rose-400" /> Available Realities ({filteredStories.length})
            </h3>
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
                    className="group relative rounded-3xl border border-white/10 hover:border-rose-500/50 bg-zinc-900/70 hover:bg-zinc-900/90 transition-all duration-300 overflow-hidden flex flex-col shadow-xl cursor-pointer hover:shadow-[0_0_35px_rgba(244,63,94,0.2)] hover:-translate-y-1"
                  >
                    {/* Story Cover Image Header */}
                    <div className="relative h-48 w-full overflow-hidden bg-black/80">
                      <img
                        src={sanitizeImageUrl(story.coverImage, DEFAULT_BG)}
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 brightness-90 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/50" />

                      {/* Genre Tag */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-rose-300 uppercase">
                          {story.genre}
                        </span>
                      </div>

                      {/* Preset / Custom Tag */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isPreset ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold">
                            CANON PRESET
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteStory(e, story.id, story.title)}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors"
                            title="Delete Custom Story"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Title & Tagline overlay */}
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

                      {/* Companions Avatars Preview */}
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-rose-400" /> Cast & Companions ({story.companions?.length || 0})
                          </span>
                          <span className="text-[10px] text-zinc-500">{story.worldContext?.locations?.length || 0} Sectors</span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {(story.companions || []).slice(0, 5).map((comp) => (
                            <div
                              key={comp.id || comp.name}
                              className="w-8 h-8 rounded-full overflow-hidden bg-zinc-950 border border-white/15 shrink-0"
                              title={`${comp.name} (${comp.role})`}
                            >
                              <img
                                src={sanitizeImageUrl(comp.baseImageUrl || comp.expressions?.neutral, DEFAULT_AVATAR)}
                                alt={comp.name}
                                className="w-full h-full object-cover object-top"
                              />
                            </div>
                          ))}
                          {(story.companions || []).length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-mono text-zinc-400 shrink-0">
                              +{story.companions.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enter Realm Button */}
                      <div className="pt-2">
                        <div className="w-full py-2.5 px-4 rounded-xl bg-white/5 group-hover:bg-rose-600 text-zinc-300 group-hover:text-white border border-white/10 group-hover:border-rose-500 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all">
                          <Play className="w-3.5 h-3.5 fill-current" /> Enter Realm
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
                <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10 text-rose-300 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  Launch World Creator â†’
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
                <Key className="w-4 h-4 text-purple-400" /> OpenRouter Access Validation
              </h2>
              <button
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
              <span>Encrypted locally in browser storage. Your credentials remain private and are verified via secure proxy.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => verifyKey(keyInput)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all"
              >
                Verify & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
