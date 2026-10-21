"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  Heart,
  Search,
  MapPin,
  Package,
  Shield,
  Sword,
  Eye,
  X,
  Check,
  Layers,
  Terminal,
  Zap,
  Flame,
  Key,
} from "lucide-react";
import {
  CodexSceneEntry,
  CodexLootEntry,
  getAllCodexScenes,
  getAllCodexLoot,
  updateCodexSceneImage,
  updateCodexLootImage,
  deleteCodexScene,
  deleteCodexLoot,
  toggleCodexSceneFavorite,
} from "@/lib/codexStorage";
import { soundEffects } from "@/lib/audioEngine";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { processImageUpload } from "@/lib/imageUtils";
import { ScreenTransitionOverlay, ScreenTransitionConfig } from "@/components/ScreenTransitionOverlay";

export default function MultiverseCodexPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"scenes" | "loot">("scenes");
  const [scenes, setScenes] = useState<CodexSceneEntry[]>([]);
  const [loot, setLoot] = useState<CodexLootEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [screenTransition, setScreenTransition] = useState<ScreenTransitionConfig>({
    isOpen: false,
    title: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStory, setSelectedStory] = useState<string>("all");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modals & Inspection
  const [activeScene, setActiveScene] = useState<CodexSceneEntry | null>(null);
  const [activeLoot, setActiveLoot] = useState<CodexLootEntry | null>(null);

  // Action States
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // File Upload Refs
  const sceneFileRef = useRef<HTMLInputElement | null>(null);
  const lootFileRef = useRef<HTMLInputElement | null>(null);

  // Load Codex Entries
  useEffect(() => {
    loadCodex();
  }, []);

  const loadCodex = async () => {
    setLoading(true);
    try {
      const [scenesData, lootData] = await Promise.all([
        getAllCodexScenes(),
        getAllCodexLoot(),
      ]);
      setScenes(scenesData);
      setLoot(lootData);
    } catch (err) {
      console.error("Failed to load Multiverse Codex:", err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct story list for universe filter
  const universeList = useMemo(() => {
    const map = new Map<string, string>();
    scenes.forEach((s) => map.set(s.storyId, s.storyTitle || s.storyId));
    loot.forEach((l) => map.set(l.storyId, l.storyTitle || l.storyId));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [scenes, loot]);

  // Filtered Scenes
  const filteredScenes = useMemo(() => {
    return scenes.filter((scene) => {
      if (selectedStory !== "all" && scene.storyId !== selectedStory) return false;
      if (onlyFavorites && !scene.isFavorite) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        scene.location.toLowerCase().includes(q) ||
        scene.speaker.toLowerCase().includes(q) ||
        scene.storyTitle.toLowerCase().includes(q) ||
        scene.prompt.toLowerCase().includes(q)
      );
    });
  }, [scenes, selectedStory, onlyFavorites, searchQuery]);

  // Filtered Loot
  const filteredLoot = useMemo(() => {
    return loot.filter((item) => {
      if (selectedStory !== "all" && item.storyId !== selectedStory) return false;
      if (selectedRarity !== "all" && item.rarity !== selectedRarity) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.effect && item.effect.toLowerCase().includes(q)) ||
        item.storyTitle.toLowerCase().includes(q) ||
        item.itemType.toLowerCase().includes(q)
      );
    });
  }, [loot, selectedStory, selectedRarity, searchQuery]);

  // Handle Toggle Favorite
  const handleToggleFavorite = async (sceneId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundEffects.playClick();
    const newFav = await toggleCodexSceneFavorite(sceneId);
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, isFavorite: newFav } : s))
    );
    if (activeScene && activeScene.id === sceneId) {
      setActiveScene((prev) => (prev ? { ...prev, isFavorite: newFav } : null));
    }
  };

  // Handle Scene Deletion
  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm("Permanently remove this scene chronicle from your Multiverse Codex?")) return;
    soundEffects.playClick();
    await deleteCodexScene(sceneId);
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    if (activeScene && activeScene.id === sceneId) {
      setActiveScene(null);
    }
  };

  // Handle Loot Deletion
  const handleDeleteLoot = async (lootId: string) => {
    if (!confirm("Permanently remove this relic from your Multiverse Codex?")) return;
    soundEffects.playClick();
    await deleteCodexLoot(lootId);
    setLoot((prev) => prev.filter((l) => l.id !== lootId));
    if (activeLoot && activeLoot.id === lootId) {
      setActiveLoot(null);
    }
  };

  // Handle Scene Upload Replacement
  const handleUploadSceneReplacement = async (file: File) => {
    if (!activeScene) return;
    soundEffects.playClick();
    try {
      setStatusMessage("Compressing & replacing scene chronicle...");
      const compressedUrl = await processImageUpload(file, 1280);
      const updated = await updateCodexSceneImage(activeScene.id, compressedUrl, "User Upload / Bespoke");
      if (updated) {
        setScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setActiveScene(updated);
        setStatusMessage("Scene illustration successfully updated!");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to process image upload");
      setStatusMessage(null);
    }
  };

  // Handle Loot Upload Replacement
  const handleUploadLootReplacement = async (file: File) => {
    if (!activeLoot) return;
    soundEffects.playClick();
    try {
      setStatusMessage("Compressing & replacing relic icon...");
      const compressedUrl = await processImageUpload(file, 512);
      const updated = await updateCodexLootImage(activeLoot.id, compressedUrl, "User Upload / Bespoke");
      if (updated) {
        setLoot((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setActiveLoot(updated);
        setStatusMessage("Relic icon successfully updated!");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to process icon upload");
      setStatusMessage(null);
    }
  };

  // Handle Re-roll Scene with Nano Banana 2.1
  const handleRerollScene = async () => {
    if (!activeScene) return;
    soundEffects.playClick();
    setIsRegenerating(true);
    setStatusMessage("Synthesizing alternative render with Neural Visual Engine...");

    try {
      const accessKey = typeof window !== "undefined" ? localStorage.getItem("astra_access_key") || "" : "";
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          mode: "scene",
          prompt: activeScene.prompt,
          sceneContext: {
            location: activeScene.location,
            speaker: activeScene.speaker,
            storyTitle: activeScene.storyTitle,
          },
          userAccessKey: accessKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "Failed to regenerate scene.");
      }

      const updated = await updateCodexSceneImage(
        activeScene.id,
        data.imageUrl,
        data.model || "FLUX.1 / Neural Visual Engine"
      );
      if (updated) {
        setScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setActiveScene(updated);
        soundEffects.playIntroBell();
        setStatusMessage("Scene re-rendered successfully!");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Scene re-roll failed");
      setStatusMessage(null);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle Re-roll Loot with Nano Banana 2.1
  const handleRerollLoot = async () => {
    if (!activeLoot) return;
    soundEffects.playClick();
    setIsRegenerating(true);
    setStatusMessage("Synthesizing alternative icon with Procedural & Neural Engine...");

    try {
      const accessKey = typeof window !== "undefined" ? localStorage.getItem("astra_access_key") || "" : "";
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          mode: "loot",
          item: {
            name: activeLoot.itemName,
            type: activeLoot.itemType,
            rarity: activeLoot.rarity,
            description: activeLoot.description,
          },
          genre: activeLoot.storyTitle,
          userAccessKey: accessKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "Failed to regenerate loot icon.");
      }

      const updated = await updateCodexLootImage(
        activeLoot.id,
        data.imageUrl,
        data.model || "FLUX.1 / Neural Visual Engine"
      );
      if (updated) {
        setLoot((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setActiveLoot(updated);
        soundEffects.playIntroBell();
        setStatusMessage("Relic icon re-rendered successfully!");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Loot icon re-roll failed");
      setStatusMessage(null);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Rarity Visual Helper
  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case "cursed":
        return "bg-rose-950/60 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
      case "relic":
        return "bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]";
      case "rare":
        return "bg-sky-950/60 border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]";
      case "uncommon":
        return "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]";
      default:
        return "bg-zinc-900/60 border-zinc-700/50 text-zinc-300";
    }
  };

  const handleReturnFromCodex = () => {
    soundEffects.playClick();
    setScreenTransition({
      isOpen: true,
      title: "RETURNING TO STORY CATALOGUE",
      subtitle: "Archiving Codex State • Calibrating Reality Matrix...",
      theme: "purple",
      icon: "arrow",
    });
    setTimeout(() => {
      router.push("/");
    }, 320);
  };

  return (
    <main className={`relative min-h-screen w-full bg-black text-zinc-100 overflow-x-hidden select-none font-sans transition-all duration-300 ease-out ${
      pageLoaded && !screenTransition.isOpen ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
    }`}>
      {/* Background Ambience */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-15 pointer-events-none brightness-50 contrast-125"
        style={{ backgroundImage: `url("/backgrounds/imperial_capital_imperium.jpg")` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/90 via-zinc-950/95 to-black pointer-events-none" />
      <div className="fixed inset-0 cinematic-vignette pointer-events-none" />
      <AtmosphericParticles location="Imperial Capital Imperium" intensity="gentle" />

      {/* Hidden file inputs for image replacements */}
      <input
        type="file"
        ref={sceneFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUploadSceneReplacement(e.target.files[0]);
        }}
      />
      <input
        type="file"
        ref={lootFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUploadLootReplacement(e.target.files[0]);
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* TOP NAVIGATION BAR */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundEffects.playClick();
                handleReturnFromCodex();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/60 hover:bg-black/90 border border-white/10 hover:border-white/30 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
              title="Return to Story Catalogue"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
              <span>Back to Catalogue</span>
            </button>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

            <div>
              <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-400" />
                MULTIVERSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400">CODEX</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Permanent Archive
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-sans">
                Unified account-wide chronicle of illustrated event scenes & discovered relics
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono flex items-center gap-2 shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-zinc-400">Scenes:</span>
              <strong className="text-white">{scenes.length}</strong>
            </div>

            <div className="px-3.5 py-1.5 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono flex items-center gap-2 shadow-lg">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400">Relics:</span>
              <strong className="text-white">{loot.length}</strong>
            </div>
          </div>
        </header>

        {/* CONTROLS / TAB SELECTOR & FILTERS */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-zinc-950/70 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
          
          {/* Main Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab("scenes");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activeTab === "scenes"
                  ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scene Chronicles ({scenes.length})</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveTab("loot");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activeTab === "loot"
                  ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Reliquary & Loot ({loot.length})</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={activeTab === "scenes" ? "Search locations, speakers..." : "Search items, effects..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Universe / Story Filter */}
            {universeList.length > 0 && (
              <select
                value={selectedStory}
                onChange={(e) => setSelectedStory(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
              >
                <option value="all">All Universes</option>
                {universeList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title}
                  </option>
                ))}
              </select>
            )}

            {/* Rarity Filter (for Loot Tab) */}
            {activeTab === "loot" && (
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-2xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="all">All Rarities</option>
                <option value="cursed">Cursed</option>
                <option value="relic">Relic</option>
                <option value="rare">Rare</option>
                <option value="uncommon">Uncommon</option>
                <option value="common">Common</option>
              </select>
            )}

            {/* Favorite Filter (for Scenes Tab) */}
            {activeTab === "scenes" && (
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                  onlyFavorites
                    ? "bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                    : "bg-black/60 border-white/10 text-zinc-400 hover:text-white"
                }`}
                title="Filter Favorites Only"
              >
                <Heart className={`w-4 h-4 ${onlyFavorites ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* FEED / GRID DISPLAY */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
            <p className="font-mono text-xs text-zinc-400">Accessing Multiverse Akashic Vaults...</p>
          </div>
        ) : activeTab === "scenes" ? (
          filteredScenes.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-12 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-xl">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="font-mono text-base font-bold text-white">No Scene Chronicles Archived</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                As you journey through worlds, trigger "Illustrate" in any dialogue scene to permanently preserve high-definition event CG illustrations here.
              </p>
              <Link
                href="/play/astra-chronicles"
                onClick={() => soundEffects.playClick()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all shadow-lg"
              >
                Embark on Astra Chronicles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScenes.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveScene(scene);
                  }}
                  className="group relative rounded-3xl overflow-hidden bg-zinc-950/80 border border-white/10 hover:border-rose-500/50 shadow-xl hover:shadow-[0_0_25px_rgba(244,63,94,0.3)] transition-all cursor-pointer flex flex-col"
                >
                  {/* Image Frame */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={scene.imageUrl}
                      alt={scene.location}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                        {scene.storyTitle}
                      </span>
                      <button
                        onClick={(e) => handleToggleFavorite(scene.id, e)}
                        className="pointer-events-auto p-1.5 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                        title={scene.isFavorite ? "Unfavorite" : "Favorite"}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            scene.isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-300"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Location Badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono">
                      <span className="flex items-center gap-1.5 text-white font-bold drop-shadow-md truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {scene.location}
                      </span>
                      <span className="text-[10px] text-zinc-400 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                        {scene.speaker}
                      </span>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                    <p className="text-xs text-zinc-400 font-mono line-clamp-2 leading-relaxed">
                      {scene.prompt}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                      <span>Model: <strong className="text-rose-400 font-bold">{scene.model.split("/").pop()}</strong></span>
                      <span>{new Date(scene.unlockedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredLoot.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="font-mono text-base font-bold text-white">No Relics Discovered Yet</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Defeat adversaries, explore ruins, and complete system directives to uncover legendary gear and artifacts synthesized by the Neural & Procedural Art Engine.
            </p>
            <Link
              href="/play/astra-chronicles"
              onClick={() => soundEffects.playClick()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold transition-all shadow-lg"
            >
              Explore the Realm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredLoot.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  soundEffects.playClick();
                  setActiveLoot(item);
                }}
                className={`group relative rounded-3xl p-3 bg-zinc-950/80 border transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg hover:scale-[1.02] ${
                  item.rarity === "cursed"
                    ? "border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                    : item.rarity === "relic"
                    ? "border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : item.rarity === "rare"
                    ? "border-sky-500/40 hover:border-sky-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                    : item.rarity === "uncommon"
                    ? "border-emerald-500/40 hover:border-emerald-400"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                {/* Icon Box */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/90 border border-white/10 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="w-10 h-10 text-zinc-600" />
                  )}
                  {item.discoveredCount && item.discoveredCount > 1 && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.2 rounded-full bg-black/80 border border-white/10 text-[9px] font-mono font-bold text-amber-300">
                      x{item.discoveredCount}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold font-sans text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                      {item.itemName}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border ${getRarityBadge(item.rarity)}`}>
                      {item.rarity}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{item.itemType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SCENE LIGHTBOX MODAL */}
      {/* ------------------------------------------------------------- */}
      {activeScene && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <h3 className="font-mono text-sm sm:text-base font-bold text-white">
                  Scene Chronicle: <span className="text-rose-300">{activeScene.location}</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveScene(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-white/10 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Image Display */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
              <img
                src={activeScene.imageUrl}
                alt={activeScene.location}
                className="w-full h-full object-cover"
              />
              {isRegenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                  <p className="font-mono text-xs text-white">Synthesizing high-fidelity scene render...</p>
                </div>
              )}
            </div>

            {/* Status Toast */}
            {statusMessage && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs font-mono text-rose-200 text-center animate-in fade-in">
                {statusMessage}
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-black/40 p-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Universe</span>
                <strong className="text-white truncate block">{activeScene.storyTitle}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Speaker</span>
                <strong className="text-white truncate block">{activeScene.speaker}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Model</span>
                <strong className="text-rose-400 truncate block">{activeScene.model.split("/").pop()}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase">Archived At</span>
                <strong className="text-zinc-300 block">{new Date(activeScene.unlockedAt).toLocaleDateString()}</strong>
              </div>
            </div>

            {/* Prompt View */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Visual Prompt</span>
              <p className="text-xs text-zinc-300 font-mono bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
                {activeScene.prompt}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFavorite(activeScene.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                    activeScene.isFavorite
                      ? "bg-rose-950/60 border-rose-500 text-rose-300"
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${activeScene.isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{activeScene.isFavorite ? "Favorited" : "Add to Favorites"}</span>
                </button>

                <button
                  onClick={() => handleDeleteScene(activeScene.id)}
                  className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Delete from Multiverse Codex"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Upload Custom PC Replacement */}
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={() => sceneFileRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title="Replace with your own picture from PC"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Replace Art</span>
                </button>

                {/* Re-roll with Nano Banana 2.1 */}
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRerollScene}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  title="Re-synthesize Scene Visuals"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>Re-roll Scene</span>
                </button>

                {/* Download HD */}
                <a
                  href={activeScene.imageUrl}
                  download={`${activeScene.storyId}_scene_${Date.now()}.png`}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HD</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LOOT / RELIC INSPECTION MODAL */}
      {/* ------------------------------------------------------------- */}
      {activeLoot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${getRarityBadge(activeLoot.rarity)}`}>
                {activeLoot.rarity} • {activeLoot.itemType}
              </span>
              <button
                onClick={() => setActiveLoot(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Icon Box */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/90 border-2 border-white/15 shadow-2xl flex items-center justify-center">
              {activeLoot.imageUrl ? (
                <img
                  src={activeLoot.imageUrl}
                  alt={activeLoot.itemName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-16 h-16 text-zinc-600" />
              )}
              {isRegenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                  <p className="font-mono text-xs text-white">Synthesizing icon...</p>
                </div>
              )}
            </div>

            {/* Status Toast */}
            {statusMessage && (
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs font-mono text-amber-200 text-center animate-in fade-in">
                {statusMessage}
              </div>
            )}

            {/* Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white">{activeLoot.itemName}</h3>
                {activeLoot.discoveredCount && activeLoot.discoveredCount > 1 && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Discovered {activeLoot.discoveredCount}x
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">{activeLoot.description}</p>
              {activeLoot.effect && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs font-mono text-amber-300">
                  ✦ {activeLoot.effect}
                </div>
              )}
            </div>

            {/* Story & Metadata */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-white/5">
              <span>Universe: <strong className="text-zinc-300">{activeLoot.storyTitle}</strong></span>
              <span>Model: <strong className="text-amber-400">{activeLoot.model.split("/").pop()}</strong></span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => handleDeleteLoot(activeLoot.id)}
                className="p-2 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-mono cursor-pointer transition-all"
                title="Remove from Codex"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                {/* Upload PC replacement */}
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={() => lootFileRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Upload image file from your PC"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Replace</span>
                </button>

                {/* Re-roll with Nano Banana */}
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRerollLoot}
                  className="px-3 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 text-amber-200 font-mono text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Synthesize new item icon"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                  <span>Re-roll</span>
                </button>

                <button
                  onClick={() => setActiveLoot(null)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Screen Transition Overlay */}
      <ScreenTransitionOverlay {...screenTransition} />
    </main>
  );
}

