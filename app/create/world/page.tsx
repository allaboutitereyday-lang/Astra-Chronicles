"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Compass,
  MapPin,
  Shield,
  BookOpen,
  Wand2,
  Plus,
  Trash2,
  Layers,
  Terminal,
  HelpCircle,
  Globe,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { StoryWorldContext, StoryRPGRules } from "@/types/story";
import { processImageUpload, sanitizeImageUrl, DEFAULT_BG } from "@/lib/imageUtils";

const GENRE_TEMPLATES = [
  {
    genre: "High Fantasy / Grimdark",
    title: "Sovereign of the Ashen Ley",
    settingName: "Valoria Continent",
    tagline: "Ancient dynastic bloodlines, cataclysmic aether rifts, and brutal feudal wars.",
    narrationStyle: "Grimdark & Atmospheric",
    loreSummary: "Three fractured empires wage war over crumbling celestial conduits. Rogue sorcerers and hollowed knights roam the blighted borderlands.",
    locations: [
      {
        name: "Valoria High Citadel",
        zone: "Imperial Heartland",
        danger: "Low (Palace Wardens)",
        description: "Gilded marble ramparts and soaring bell towers overlooking the sunlit plains.",
        bgImage: "/backgrounds/imperial_capital_imperium.jpg",
      },
      {
        name: "Ashen Leyline Scar",
        zone: "Outer Periphery",
        danger: "Deadly (Aether Storms)",
        description: "A colossal crater burning with ethereal azure plasma and anomalous temporal rifts.",
        bgImage: "/backgrounds/gray_zone.jpg",
      },
      {
        name: "Crimson Spire",
        zone: "Arcane Bastion",
        danger: "Guarded (High Arcanists)",
        description: "Humming sanctuary of forbidden sorcerous archives and celestial gyres.",
        bgImage: "/backgrounds/mage_tower.jpg",
      }
    ],
    coverImage: "/backgrounds/imperial_capital_imperium.jpg",
    systemName: "LitRPG System Administrator",
    causalAnchorName: "Causal Plausibility",
    currencyName: "Gold",
  },
  {
    genre: "Cyberpunk / Tech-Noir",
    title: "Neon Protocol: Sector Zero",
    settingName: "Neo-Kyoto Underground",
    tagline: "Sub-dermal chrome, rogue artificial intelligences, and rain-slicked syndicate neon.",
    narrationStyle: "Tech-Noir & Visceral Cinematic",
    loreSummary: "Megacorporations hoard synthetic consciousness in orbital arrays while street ronin and netrunners trade black-market wetware in the subterranean alleys.",
    locations: [
      {
        name: "OmniTech Stratum Spire",
        zone: "Upper Sector",
        danger: "Lethal (EMP Sentry Drones)",
        description: "Gleaming corporate monolith piercing smog clouds with laser defense grids.",
        bgImage: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Rust Promenade Sub-03",
        zone: "The Sinks",
        danger: "High (Chrome Syndicate Enforcers)",
        description: "Perpetual acid drizzle over neon signs, ramen stalls, and black cybernetic clinics.",
        bgImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      }
    ],
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
    systemName: "Neural Sync Core",
    causalAnchorName: "Neural Coherence",
    currencyName: "Creds (¥Cr)",
  },
  {
    genre: "Cosmic Sci-Fi / Space Opera",
    title: "Aegis Horizon: Starbound Odyssey",
    settingName: "The Orion Rift Nexus",
    tagline: "Derelict colony flagships, alien biosignatures, and deep-space gravitational anomalies.",
    narrationStyle: "Epic Hard Sci-Fi & Psychological Space Thriller",
    loreSummary: "A multi-species exploratory fleet investigates an anomalous hyperlane rift that swallowed an entire sector station.",
    locations: [
      {
        name: "USS Hyperion Command Deck",
        zone: "Fleet Flagship",
        danger: "Secure (Naval Marines)",
        description: "Pressurized bridge with panoramic viewports displaying the swirling blue event horizon.",
        bgImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
      },
      {
        name: "Derelict Biosphere Station",
        zone: "Uncharted Sector",
        danger: "Hostile (Mutated Xenoflora)",
        description: "Cracked zero-g hydroponic domes drifting through planetary debris fields.",
        bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      }
    ],
    coverImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80",
    systemName: "Aegis Shipboard AI",
    causalAnchorName: "Hull & Sanity Integrity",
    currencyName: "Quantum Nanites",
  }
];

export default function CreateWorldPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [genre, setGenre] = useState("High Fantasy / Grimdark");
  const [narrationStyle, setNarrationStyle] = useState("Grimdark & Atmospheric");
  const [settingName, setSettingName] = useState("");
  const [loreSummary, setLoreSummary] = useState("");
  const [coverImage, setCoverImage] = useState("/backgrounds/imperial_capital_imperium.jpg");

  // RPG System Rules
  const [systemName, setSystemName] = useState("LitRPG System Administrator");
  const [causalAnchorName, setCausalAnchorName] = useState("Causal Plausibility");
  const [currencyName, setCurrencyName] = useState("Gold");

  // Locations List
  const [locations, setLocations] = useState<
    { name: string; zone: string; danger: string; description: string; bgImage: string }[]
  >([
    {
      name: "Capital Citadel",
      zone: "Central Plains",
      danger: "Low (Guarded)",
      description: "The fortified center of power and commerce.",
      bgImage: "/backgrounds/imperial_capital_imperium.jpg",
    },
    {
      name: "Forbidden Sanctuary",
      zone: "Outlands",
      danger: "Deadly (Anomalies)",
      description: "A mysterious territory humming with ancient power.",
      bgImage: "/backgrounds/gray_zone.jpg",
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLocationIdx, setUploadingLocationIdx] = useState<number | null>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    soundEffects.playClick();
    try {
      const compressed = await processImageUpload(file, 1200);
      setCoverImage(compressed);
      soundEffects.playIntroBell();
    } catch (err: any) {
      alert(err.message || "Failed to upload image.");
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleLocationImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLocationIdx(index);
    soundEffects.playClick();
    try {
      const compressed = await processImageUpload(file, 1024);
      handleUpdateLocation(index, "bgImage", compressed);
      soundEffects.playIntroBell();
    } catch (err: any) {
      alert(err.message || "Failed to upload location image.");
    } finally {
      setUploadingLocationIdx(null);
      if (e.target) e.target.value = "";
    }
  };

  useEffect(() => {
    // Check if draft exists in sessionStorage
    try {
      const draft = sessionStorage.getItem("astra_draft_world");
      if (draft) {
        const parsed = JSON.parse(draft);
        setTitle(parsed.title || "");
        setTagline(parsed.tagline || "");
        setGenre(parsed.genre || "High Fantasy / Grimdark");
        setNarrationStyle(parsed.narrationStyle || "Grimdark & Atmospheric");
        setSettingName(parsed.settingName || "");
        setLoreSummary(parsed.loreSummary || "");
        setCoverImage(parsed.coverImage || "/backgrounds/imperial_capital_imperium.jpg");
        setSystemName(parsed.systemName || "LitRPG System Administrator");
        setCausalAnchorName(parsed.causalAnchorName || "Causal Plausibility");
        setCurrencyName(parsed.currencyName || "Gold");
        if (parsed.locations?.length) setLocations(parsed.locations);
      } else {
        // Pre-fill with first template
        applyTemplate(GENRE_TEMPLATES[0]);
      }
    } catch {}
  }, []);

  const applyTemplate = (tpl: (typeof GENRE_TEMPLATES)[0]) => {
    soundEffects.playClick();
    setTitle(tpl.title);
    setTagline(tpl.tagline);
    setGenre(tpl.genre);
    setNarrationStyle(tpl.narrationStyle);
    setSettingName(tpl.settingName);
    setLoreSummary(tpl.loreSummary);
    setCoverImage(tpl.coverImage);
    setSystemName(tpl.systemName);
    setCausalAnchorName(tpl.causalAnchorName);
    setCurrencyName(tpl.currencyName);
    setLocations(tpl.locations);
  };

  const handleAddLocation = () => {
    soundEffects.playClick();
    setLocations((prev) => [
      ...prev,
      {
        name: `New Sector ${prev.length + 1}`,
        zone: "Frontier",
        danger: "Moderate",
        description: "An unexplored territory awaiting exploration.",
        bgImage: coverImage || "/backgrounds/imperial_capital_imperium.jpg",
      },
    ]);
  };

  const handleRemoveLocation = (index: number) => {
    soundEffects.playClick();
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLocation = (index: number, field: string, value: string) => {
    setLocations((prev) =>
      prev.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc))
    );
  };

  const handleAiAutoGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    soundEffects.playClick();

    try {
      const storedKey = localStorage.getItem("astra_access_key") || "";
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          genre,
          mode: "world",
          userAccessKey: storedKey,
        }),
      });

      if (!res.ok) {
        throw new Error("AI generation request failed");
      }

      const data = await res.json();
      if (data.story) {
        soundEffects.playIntroBell();
        const s = data.story;
        if (s.title) setTitle(s.title);
        if (s.tagline) setTagline(s.tagline);
        if (s.genre) setGenre(s.genre);
        if (s.narrationStyle) setNarrationStyle(s.narrationStyle);
        if (s.worldContext?.settingName) setSettingName(s.worldContext.settingName);
        if (s.worldContext?.loreSummary) setLoreSummary(s.worldContext.loreSummary);
        if (s.worldContext?.locations?.length) setLocations(s.worldContext.locations);
        if (s.rpgRules?.systemName) setSystemName(s.rpgRules.systemName);
        if (s.rpgRules?.causalAnchorName) setCausalAnchorName(s.rpgRules.causalAnchorName);
        if (s.rpgRules?.currencyName) setCurrencyName(s.rpgRules.currencyName);
      }
    } catch (err) {
      console.warn("AI generation fallback:", err);
      alert("Could not reach AI generator. You can continue configuring manually or use the presets.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextStep = () => {
    if (!title.trim() || !settingName.trim()) {
      alert("Please provide at least a World Title and Setting Name.");
      return;
    }

    soundEffects.playIntroBell();

    const worldPayload = {
      title: title.trim(),
      tagline: tagline.trim(),
      genre,
      narrationStyle,
      settingName: settingName.trim(),
      loreSummary: loreSummary.trim(),
      coverImage,
      systemName,
      causalAnchorName,
      currencyName,
      locations,
    };

    sessionStorage.setItem("astra_draft_world", JSON.stringify(worldPayload));
    router.push("/create/companions");
  };

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 font-sans text-zinc-100 overflow-x-hidden selection:bg-rose-500/30">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-15 pointer-events-none brightness-40 contrast-125"
        style={{ backgroundImage: `url("${sanitizeImageUrl(coverImage, DEFAULT_BG)}")` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-zinc-950/95 to-zinc-950 pointer-events-none" />
      <div className="fixed inset-0 cinematic-vignette pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* HEADER BREADCRUMB */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Catalogue
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30">
              Step 1 of 2: World Architecture
            </span>
          </div>
        </header>

        {/* TITLE BANNER */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-widest">
            <Compass className="w-4 h-4" /> World Creation Engine
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
            Forge Your Universe & Lore
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Configure the setting, factions, and rules of engagement for your custom visual novel. In the next step, you will summon and lock companions.
          </p>
        </div>

        {/* AI QUICK-SUMMON BAR */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900/80 to-purple-950/40 border border-white/15 backdrop-blur-xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-rose-400 animate-pulse" /> AI Rapid Lore Generator
            </label>
            <span className="text-[10px] font-mono text-zinc-400">OpenRouter LLM Assisted</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. A dystopian underwater city ruled by bio-luminescent aristocrats and rogue sirens..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white placeholder:text-zinc-500 font-mono"
            />
            <button
              onClick={handleAiAutoGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="px-5 py-2.5 min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              {isGenerating ? "Manifesting..." : "Generate World"}
            </button>
          </div>
        </div>

        {/* PRESET ARCHETYPE TEMPLATES */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" /> Or Select an Archetype Template
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GENRE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.title}
                onClick={() => applyTemplate(tpl)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  title === tpl.title
                    ? "bg-rose-950/40 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500"
                    : "bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900"
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold">{tpl.genre}</span>
                  <h4 className="font-bold text-sm text-white mt-1">{tpl.title}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{tpl.tagline}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{tpl.locations.length} Locations • {tpl.systemName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* WORLD PARAMETERS FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/60 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-xl">
          
          <div className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-rose-400 font-bold border-b border-white/10 pb-2">
              1. Identity & Narrative Tone
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">Story Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chronicles of the Shattered Void"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">Setting / Continent Name</label>
              <input
                type="text"
                value={settingName}
                onChange={(e) => setSettingName(e.target.value)}
                placeholder="e.g. Astra Continent, Neo-Veridia, Oakhaven"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">Genre & Subgenres</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. High Fantasy / Grimdark / LitRPG"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">Narration Atmosphere Style</label>
              <input
                type="text"
                value={narrationStyle}
                onChange={(e) => setNarrationStyle(e.target.value)}
                placeholder="e.g. Grimdark & Atmospheric, Sensory-rich, Poetic"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">Tagline / Hook</label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="A one-sentence hook summarizing the stakes..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white font-mono resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">World Lore Overview</label>
              <textarea
                rows={4}
                value={loreSummary}
                onChange={(e) => setLoreSummary(e.target.value)}
                placeholder="Describe the geopolitical conflicts, magic/tech systems, and historical crises..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-base sm:text-xs text-white font-mono resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-sky-400 font-bold border-b border-white/10 pb-2">
              2. LitRPG System & Anchor Rules
            </h3>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1">LitRPG Administrator Title</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g. LitRPG System Administrator, Neural Sync Core"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-sky-500 text-base sm:text-xs text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Causal Anchor</label>
                <input
                  type="text"
                  value={causalAnchorName}
                  onChange={(e) => setCausalAnchorName(e.target.value)}
                  placeholder="e.g. Causal Plausibility"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-sky-500 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Currency Unit</label>
                <input
                  type="text"
                  value={currencyName}
                  onChange={(e) => setCurrencyName(e.target.value)}
                  placeholder="e.g. Gold, Credits, Shards"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 focus:border-sky-500 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* WORLD COVER IMAGE & PC UPLOAD */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-zinc-300">World Cover / Realm Backdrop</label>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/60 border border-white/10">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/15 bg-zinc-950 shrink-0 relative">
                  <img
                    src={sanitizeImageUrl(coverImage, DEFAULT_BG)}
                    alt="World Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      disabled={uploadingCover}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {uploadingCover ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3" /> Upload Cover from PC
                        </>
                      )}
                    </button>
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    {coverImage && coverImage.startsWith("data:") && (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> PC Uploaded
                      </span>
                    )}
                  </div>

                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="Or paste image URL (/backgrounds/... or https://...)"
                    className="w-full px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/5 text-[10px] text-zinc-300 font-mono focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTORS / LOCATIONS */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Key Sectors & Locations ({locations.length})
                </label>
                <button
                  onClick={handleAddLocation}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono hover:bg-emerald-900/60 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Sector
                </button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {locations.map((loc, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={loc.name}
                        onChange={(e) => handleUpdateLocation(idx, "name", e.target.value)}
                        placeholder="Location Name"
                        className="font-bold text-xs text-white bg-transparent border-b border-white/10 focus:border-emerald-400 focus:outline-none flex-1 font-mono"
                      />
                      {locations.length > 1 && (
                        <button
                          onClick={() => handleRemoveLocation(idx)}
                          className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <input
                        type="text"
                        value={loc.zone}
                        onChange={(e) => handleUpdateLocation(idx, "zone", e.target.value)}
                        placeholder="Zone / Region"
                        className="px-2 py-1 rounded bg-zinc-900/80 border border-white/5 text-zinc-300 font-mono"
                      />
                      <input
                        type="text"
                        value={loc.danger}
                        onChange={(e) => handleUpdateLocation(idx, "danger", e.target.value)}
                        placeholder="Danger Level"
                        className="px-2 py-1 rounded bg-zinc-900/80 border border-white/5 text-rose-300 font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      value={loc.description}
                      onChange={(e) => handleUpdateLocation(idx, "description", e.target.value)}
                      placeholder="Atmospheric sensory description..."
                      className="w-full px-2 py-1 rounded bg-zinc-900/80 border border-white/5 text-[11px] text-zinc-400 font-mono"
                    />

                    {/* Sector Backdrop Image & PC Upload */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                        <img
                          src={sanitizeImageUrl(loc.bgImage, DEFAULT_BG)}
                          alt={loc.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input
                        type="text"
                        value={loc.bgImage}
                        onChange={(e) => handleUpdateLocation(idx, "bgImage", e.target.value)}
                        placeholder="Backdrop URL or path"
                        className="flex-1 px-2 py-1 rounded bg-zinc-900/80 border border-white/5 text-[10px] text-zinc-300 font-mono focus:outline-none"
                      />
                      <label
                        htmlFor={`loc-file-${idx}`}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        {uploadingLocationIdx === idx ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <Upload className="w-2.5 h-2.5 text-emerald-400" />
                        )}
                        <span>PC Photo</span>
                      </label>
                      <input
                        id={`loc-file-${idx}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLocationImageUpload(idx, e)}
                        className="hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/30 text-xs font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </Link>
          <button
            onClick={handleNextStep}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-pink-500 text-white font-mono text-xs font-bold shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            Next: Define Companions & Leads <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

