"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Users,
  User,
  Heart,
  Shield,
  Zap,
  Plus,
  Trash2,
  Wand2,
  Camera,
  Check,
  Lock,
  RefreshCw,
  Image as ImageIcon,
  Play,
  Upload,
  CheckCircle
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { StoryCompanion, StoryContext, StoryStartingNode } from "@/types/story";
import { saveStory } from "@/lib/storyStorage";
import { processImageUpload, sanitizeImageUrl, DEFAULT_AVATAR, DEFAULT_BG } from "@/lib/imageUtils";

const DEFAULT_COMPANION_PRESETS: Partial<StoryCompanion>[] = [
  {
    name: "Lyra Valmont",
    title: "Disgraced Inquisitor of the Dawn",
    role: "Aether Blade Inquisitor",
    gender: "female",
    color: "rose",
    personality: "Stern, unyielding, fiercely loyal once trust is earned. Carries lingering guilt over imperial purges.",
    values: ["Honor", "Relentless Resolve", "Direct Truth", "Martial Discipline"],
    dislikes: ["Cowardice", "Venal Aristocrats", "Subterfuge", "Broken Oaths"],
    highCompatibility: ["Knights", "Paladins", "Disciplined Warriors", "Stoic Tacticians"],
    baseAffection: 15,
    seed: 5829104,
    baseImageUrl: "/characters/evelyn/evelyn_neutral.png",
    visualPrompt: "masterpiece anime portrait, proud female knight inquisitor, braided platinum blonde hair, azure eyes, silver plate armor with gold filigree, white silk cloak, determined gaze, medieval stone sanctuary background",
  },
  {
    name: "Kaelen Vane",
    title: "Shadow Operative of the Black Syndicate",
    role: "Covert Saboteur & Informant",
    gender: "male",
    color: "sky",
    personality: "Dry-witted, hyper-observant, calculating. Views survival as a chess match.",
    values: ["Stealth", "Calculated Risk", "Intellectual Autonomy", "Tradecraft"],
    dislikes: ["Loud Boasting", "Martyrdom", "Blind Fanaticism"],
    highCompatibility: ["Rogues", "Assassins", "Information Brokers", "Pragmatists"],
    baseAffection: 12,
    seed: 8421935,
    baseImageUrl: "/characters/aria/aria_neutral.png",
    visualPrompt: "masterpiece anime portrait, handsome male covert operative, dark wind-swept hair, keen amber eyes, high-collar leather mantle, tactical chest rig, rain-drenched rooftop background",
  },
];

export default function CreateCompanionsPage() {
  const router = useRouter();

  const [worldDraft, setWorldDraft] = useState<any>(null);
  const [companions, setCompanions] = useState<StoryCompanion[]>([]);
  const [activeCompanionIdx, setActiveCompanionIdx] = useState(0);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState<number | null>(null);
  const [isAssembling, setIsAssembling] = useState(false);

  const portraitFileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);

  const handlePortraitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPortrait(true);
    soundEffects.playClick();
    const newLockedSeed = Math.floor(1000000 + Math.random() * 9000000);

    try {
      const compressed = await processImageUpload(file, 512);
      soundEffects.playIntroBell();
      setCompanions((prev) =>
        prev.map((c, i) =>
          i === activeCompanionIdx
            ? {
                ...c,
                seed: c.seed || newLockedSeed,
                baseImageUrl: compressed,
                expressions: {
                  ...c.expressions,
                  neutral: compressed,
                  smug: compressed,
                  combat_ready: compressed,
                  flustered: compressed,
                  hurt: compressed,
                },
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to process image.");
    } finally {
      setUploadingPortrait(false);
      if (e.target) e.target.value = "";
    }
  };

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("astra_draft_world");
      if (!stored) {
        router.push("/create/world");
        return;
      }
      const parsedWorld = JSON.parse(stored);
      setWorldDraft(parsedWorld);

      // Initialize with 2 companions
      setCompanions([
        {
          id: `comp_${Date.now()}_1`,
          name: DEFAULT_COMPANION_PRESETS[0].name!,
          title: DEFAULT_COMPANION_PRESETS[0].title!,
          role: DEFAULT_COMPANION_PRESETS[0].role!,
          gender: DEFAULT_COMPANION_PRESETS[0].gender!,
          color: DEFAULT_COMPANION_PRESETS[0].color! as any,
          personality: DEFAULT_COMPANION_PRESETS[0].personality!,
          values: DEFAULT_COMPANION_PRESETS[0].values!,
          dislikes: DEFAULT_COMPANION_PRESETS[0].dislikes!,
          highCompatibility: DEFAULT_COMPANION_PRESETS[0].highCompatibility!,
          baseAffection: DEFAULT_COMPANION_PRESETS[0].baseAffection!,
          affection: DEFAULT_COMPANION_PRESETS[0].baseAffection!,
          expressionKey: "neutral",
          isPresent: true,
          encountered: false,
          seed: DEFAULT_COMPANION_PRESETS[0].seed!,
          baseImageUrl: DEFAULT_COMPANION_PRESETS[0].baseImageUrl!,
          visualPrompt: DEFAULT_COMPANION_PRESETS[0].visualPrompt!,
          expressions: {
            neutral: DEFAULT_COMPANION_PRESETS[0].baseImageUrl!,
            smug: "/characters/evelyn/evelyn_smug.png",
            combat_ready: "/characters/evelyn/evelyn_combat.png",
            flustered: "/characters/evelyn/evelyn_flustered.png",
          },
        },
        {
          id: `comp_${Date.now()}_2`,
          name: DEFAULT_COMPANION_PRESETS[1].name!,
          title: DEFAULT_COMPANION_PRESETS[1].title!,
          role: DEFAULT_COMPANION_PRESETS[1].role!,
          gender: DEFAULT_COMPANION_PRESETS[1].gender!,
          color: DEFAULT_COMPANION_PRESETS[1].color! as any,
          personality: DEFAULT_COMPANION_PRESETS[1].personality!,
          values: DEFAULT_COMPANION_PRESETS[1].values!,
          dislikes: DEFAULT_COMPANION_PRESETS[1].dislikes!,
          highCompatibility: DEFAULT_COMPANION_PRESETS[1].highCompatibility!,
          baseAffection: DEFAULT_COMPANION_PRESETS[1].baseAffection!,
          affection: DEFAULT_COMPANION_PRESETS[1].baseAffection!,
          expressionKey: "neutral",
          isPresent: false,
          encountered: false,
          seed: DEFAULT_COMPANION_PRESETS[1].seed!,
          baseImageUrl: DEFAULT_COMPANION_PRESETS[1].baseImageUrl!,
          visualPrompt: DEFAULT_COMPANION_PRESETS[1].visualPrompt!,
          expressions: {
            neutral: DEFAULT_COMPANION_PRESETS[1].baseImageUrl!,
            combat_ready: "/characters/aria/aria_combat.png",
            intrigued: "/characters/aria/aria_intrigued.png",
          },
        },
      ]);
    } catch {
      router.push("/create/world");
    }
  }, [router]);

  const activeCompanion = companions[activeCompanionIdx] || companions[0];

  const handleUpdateActive = (field: string, value: any) => {
    setCompanions((prev) =>
      prev.map((c, i) => (i === activeCompanionIdx ? { ...c, [field]: value } : c))
    );
  };

  const handleAddCompanion = () => {
    soundEffects.playClick();
    const newSeed = Math.floor(1000000 + Math.random() * 9000000);
    const newComp: StoryCompanion = {
      id: `comp_${Date.now()}_${companions.length + 1}`,
      name: `Companion ${companions.length + 1}`,
      title: "Heroine / Ally",
      role: "Wanderer",
      gender: "female",
      color: "rose",
      personality: "Guarded yet observant. Evaluates companions with measured caution.",
      values: ["Loyalty", "Pragmatism"],
      dislikes: ["Betrayal"],
      highCompatibility: ["Adventurers"],
      baseAffection: 15,
      affection: 15,
      expressionKey: "neutral",
      isPresent: false,
      encountered: false,
      seed: newSeed,
      baseImageUrl: "/characters/serena/serena_neutral.png",
      visualPrompt: "masterpiece anime portrait, anime heroine, captivating eyes, detailed fantasy clothing, cinematic lighting",
      expressions: {
        neutral: "/characters/serena/serena_neutral.png",
        smug: "/characters/serena/serena_smug.png",
        combat_ready: "/characters/serena/serena_combat.png",
      },
    };

    setCompanions((prev) => [...prev, newComp]);
    setActiveCompanionIdx(companions.length);
  };

  const handleRemoveCompanion = (index: number) => {
    if (companions.length <= 1) return;
    soundEffects.playClick();
    setCompanions((prev) => prev.filter((_, i) => i !== index));
    setActiveCompanionIdx(Math.max(0, index - 1));
  };

  // Image Generation / Synthesis Hookup (Task 4 integration)
  const handleSynthesizePortrait = async (index: number) => {
    setIsGeneratingPortrait(index);
    soundEffects.playClick();

    const targetComp = companions[index];
    const newLockedSeed = Math.floor(1000000 + Math.random() * 9000000);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetComp.visualPrompt,
          seed: targetComp.seed || newLockedSeed,
          characterName: targetComp.name,
          gender: targetComp.gender,
        }),
      });

      if (!res.ok) throw new Error("Image generation failed");
      const data = await res.json();

      if (data.imageUrl) {
        soundEffects.playIntroBell();
        const baseImg = data.imageUrl;
        const matchHeroine = ["evelyn", "aria", "serena", "morgana", "perci"].find((h) =>
          baseImg.toLowerCase().includes(h)
        );
        const derivedExpressions: Record<string, string> = {
          neutral: baseImg,
          smug: matchHeroine ? `/characters/${matchHeroine}/${matchHeroine}_smug.png` : baseImg,
          combat_ready: matchHeroine ? `/characters/${matchHeroine}/${matchHeroine}_combat.png` : baseImg,
          flustered: matchHeroine ? `/characters/${matchHeroine}/${matchHeroine}_flustered.png` : baseImg,
          hurt: matchHeroine ? `/characters/${matchHeroine}/${matchHeroine}_hurt.png` : baseImg,
          intrigued: matchHeroine ? `/characters/${matchHeroine}/${matchHeroine}_intrigued.png` : baseImg,
        };

        setCompanions((prev) =>
          prev.map((c, i) =>
            i === index
              ? {
                  ...c,
                  seed: data.seed || newLockedSeed,
                  baseImageUrl: baseImg,
                  expressions: derivedExpressions,
                }
              : c
          )
        );
      }
    } catch (e) {
      console.warn("Portrait synthesis notice:", e);
      // Fallback: lock new seed and assign existing themed character sprite
      const fallbackSprites = [
        "/characters/evelyn/evelyn_neutral.png",
        "/characters/aria/aria_neutral.png",
        "/characters/serena/serena_neutral.png",
        "/characters/morgana/morgana_neutral.png",
        "/characters/perci/perci_neutral.png",
      ];
      const selectedFallback = fallbackSprites[index % fallbackSprites.length];

      setCompanions((prev) =>
        prev.map((c, i) =>
          i === index
            ? {
                ...c,
                seed: newLockedSeed,
                baseImageUrl: selectedFallback,
                expressions: {
                  ...c.expressions,
                  neutral: selectedFallback,
                },
              }
            : c
        )
      );
    } finally {
      setIsGeneratingPortrait(null);
    }
  };

  const handleAssembleAndLaunch = async () => {
    if (!worldDraft || companions.length === 0) return;
    setIsAssembling(true);
    soundEffects.playIntroBell();

    const rawSlug = worldDraft.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const storySlug =
      rawSlug === "astra-chronicles" || rawSlug === "neon-eclipse"
        ? `${rawSlug}-${Date.now().toString().slice(-4)}`
        : rawSlug;

    // Generate Starting Prologue Nodes for each companion
    const startingNodes: StoryStartingNode[] = companions.map((comp, idx) => {
      const loc = worldDraft.locations[idx % worldDraft.locations.length] || {
        name: "Starting Sanctuary",
        description: "An atmospheric entry point.",
      };

      return {
        id: `prologue_${comp.id || idx}`,
        speaker: comp.name,
        title: `${comp.name}: ${loc.name}`,
        location: loc.name,
        sceneSetup: `The atmosphere of ${loc.name} hangs thick in the air. Amidst the shifting currents, ${comp.name} (${comp.title}) emerges from the perimeter, evaluating your sudden arrival.`,
        dialogue: `You walk unanchored through ${loc.name}. State your purpose before our fates become tangled.`,
        expressionKey: "neutral",
        initialAffection: comp.baseAffection || 15,
        bgImage: loc.bgImage || worldDraft.coverImage,
        choices: [
          "[Composure] Step forward into the light, meet their gaze evenly, and offer a contract of alliance.",
          "[Observation] Detail an acute tactical anomaly you observed in their perimeter defense.",
          "[Subterfuge] Produce a forged credential claiming authorization from local authorities.",
          "[Defiance] Keep a hand on your weapon and declare that you owe an explanation to no one.",
        ],
      };
    });

    const fullStory: StoryContext = {
      id: storySlug || `story_${Date.now()}`,
      title: worldDraft.title,
      tagline: worldDraft.tagline,
      description: worldDraft.loreSummary,
      coverImage: worldDraft.coverImage,
      genre: worldDraft.genre,
      themes: [worldDraft.genre.split("/")[0].trim(), "Dynamic Companions", "LitRPG System"],
      narrationStyle: worldDraft.narrationStyle,
      createdAt: new Date().toISOString(),
      author: "Realm Creator",
      isPreset: false,
      worldContext: {
        settingName: worldDraft.settingName,
        loreSummary: worldDraft.loreSummary,
        locations: worldDraft.locations,
      },
      rpgRules: {
        systemName: worldDraft.systemName || "LitRPG System Administrator",
        currencyName: worldDraft.currencyName || "Gold",
        causalAnchorName: worldDraft.causalAnchorName || "Causal Plausibility",
        defaultPlausibility: 80,
        statDefinitions: {
          str: "Strength / Power Output",
          dex: "Dexterity / Reaction Speed",
          int: "Intelligence / Arcana Analysis",
        },
        startingLevel: 1,
        baseStats: {
          hp: 100,
          maxHp: 100,
          mp: 60,
          maxMp: 60,
          exp: 0,
          maxExp: 100,
          str: 10,
          dex: 10,
          int: 10,
        },
      },
      startingNodes,
      companions,
    };

    // Save story to persistent storage
    await saveStory(fullStory);

    // Clear draft
    sessionStorage.removeItem("astra_draft_world");

    // Launch directly into visual novel engine for the story
    router.push(`/play/${fullStory.id}`);
  };

  if (!worldDraft) return null;

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 font-sans text-zinc-100 overflow-x-hidden selection:bg-rose-500/30">
      <div
        className="fixed inset-0 bg-cover bg-center opacity-15 pointer-events-none brightness-40 contrast-125"
        style={{ backgroundImage: `url("${sanitizeImageUrl(worldDraft.coverImage, DEFAULT_BG)}")` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/85 via-zinc-950/95 to-zinc-950 pointer-events-none" />
      <div className="fixed inset-0 cinematic-vignette pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* HEADER BREADCRUMB */}
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/create/world"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to World Settings
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Step 2 of 2: Cast & Companions
            </span>
          </div>
        </header>

        {/* TITLE BANNER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-widest">
              <Users className="w-4 h-4" /> Companion Roster & Visual Consistency
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
              Summon Male Leads & Heroines
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              World: <strong className="text-white">{worldDraft.title}</strong> • Setting: {worldDraft.settingName}
            </p>
          </div>

          <button
            onClick={handleAddCompanion}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-rose-400" /> Add Companion
          </button>
        </div>

        {/* COMPANION TABS ROW */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {companions.map((comp, idx) => (
            <button
              key={comp.id || idx}
              onClick={() => {
                soundEffects.playClick();
                setActiveCompanionIdx(idx);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-mono transition-all cursor-pointer shrink-0 ${
                activeCompanionIdx === idx
                  ? "bg-rose-950/50 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500"
                  : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-950 border border-white/20">
                <img src={sanitizeImageUrl(comp.baseImageUrl, DEFAULT_AVATAR)} alt={comp.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold">{comp.name || `Companion ${idx + 1}`}</span>
              <span className="text-[10px] text-zinc-500 uppercase">({comp.gender || "female"})</span>
            </button>
          ))}
        </div>

        {/* ACTIVE COMPANION WORKSPACE */}
        {activeCompanion && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-zinc-900/70 border border-white/10 p-6 sm:p-8 rounded-3xl backdrop-blur-2xl">
            
            {/* COLUMN 1: VISUAL AI PORTRAIT STAGE & SEED LOCK */}
            <div className="space-y-4 flex flex-col items-center text-center p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="relative w-48 h-64 rounded-2xl overflow-hidden border-2 border-white/15 bg-zinc-950 shadow-2xl group">
                <img
                  src={sanitizeImageUrl(activeCompanion.baseImageUrl, DEFAULT_AVATAR)}
                  alt={activeCompanion.name}
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-2.5 inset-x-2 text-left">
                  <p className="text-xs font-bold text-white font-mono">{activeCompanion.name}</p>
                  <p className="text-[10px] text-rose-300 font-mono truncate">{activeCompanion.title}</p>
                </div>
              </div>

              {/* Seed & ControlNet / IPAdapter Status */}
              <div className="w-full space-y-2 text-left bg-zinc-900/80 p-3 rounded-xl border border-white/10 text-[11px] font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Locked AI Seed
                  </span>
                  <span className="text-amber-300 font-bold">#{activeCompanion.seed}</span>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  This seed is fed to ControlNet & IPAdapter in gameplay turns to preserve facial structure across moods.
                </p>
              </div>

              {/* PC Upload & AI Synthesis Action Buttons */}
              <div className="w-full space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => portraitFileInputRef.current?.click()}
                    disabled={uploadingPortrait}
                    className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/10 shadow-md"
                    title="Upload custom portrait picture directly from your PC"
                  >
                    {uploadingPortrait ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 text-sky-400" /> Upload from PC
                      </>
                    )}
                  </button>
                  <input
                    ref={portraitFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePortraitUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => handleSynthesizePortrait(activeCompanionIdx)}
                    disabled={isGeneratingPortrait === activeCompanionIdx}
                    className="py-2.5 px-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 disabled:opacity-50 text-white font-mono text-[11px] font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Generate consistent AI character portrait with locked seed"
                  >
                    {isGeneratingPortrait === activeCompanionIdx ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3 text-rose-300" /> AI Synthesize
                      </>
                    )}
                  </button>
                </div>

                {activeCompanion.baseImageUrl && activeCompanion.baseImageUrl.startsWith("data:") && (
                  <div className="w-full text-center">
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Custom PC Portrait Loaded
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full text-left space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase">Or Paste Portrait Image URL</label>
                <input
                  type="text"
                  value={activeCompanion.baseImageUrl}
                  onChange={(e) => handleUpdateActive("baseImageUrl", e.target.value)}
                  placeholder="/characters/... or https://..."
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-[11px] text-zinc-300 font-mono focus:border-rose-500 focus:outline-none"
                />
              </div>

              {companions.length > 1 && (
                <button
                  onClick={() => handleRemoveCompanion(activeCompanionIdx)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 pt-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Companion
                </button>
              )}
            </div>

            {/* COLUMN 2 & 3: FORM FIELDS */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Character Name</label>
                  <input
                    type="text"
                    value={activeCompanion.name}
                    onChange={(e) => handleUpdateActive("name", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Honorific / Title</label>
                  <input
                    type="text"
                    value={activeCompanion.title}
                    onChange={(e) => handleUpdateActive("title", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Combat Role / Archetype</label>
                  <input
                    type="text"
                    value={activeCompanion.role}
                    onChange={(e) => handleUpdateActive("role", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Gender</label>
                  <select
                    value={activeCompanion.gender || "female"}
                    onChange={(e) => handleUpdateActive("gender", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white font-mono"
                  >
                    <option value="female">Heroine (Female)</option>
                    <option value="male">Male Lead (Male)</option>
                    <option value="non-binary">Companion (Non-Binary)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">Personality Profile & Voice</label>
                <textarea
                  rows={2}
                  value={activeCompanion.personality}
                  onChange={(e) => handleUpdateActive("personality", e.target.value)}
                  placeholder="How they speak, behavioral quirks, vocal cadence..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white font-mono resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  AI Visual Prompt (IPAdapter Reference Prompt)
                </label>
                <textarea
                  rows={2}
                  value={activeCompanion.visualPrompt}
                  onChange={(e) => handleUpdateActive("visualPrompt", e.target.value)}
                  placeholder="Describe hair, eye color, attire, armor, signature weapon..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-rose-500 text-xs text-white font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Values (Comma Separated)</label>
                  <input
                    type="text"
                    value={activeCompanion.values?.join(", ") || ""}
                    onChange={(e) =>
                      handleUpdateActive(
                        "values",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="Honor, Arcana, Quick Wit"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Dislikes / Pet Peeves</label>
                  <input
                    type="text"
                    value={activeCompanion.dislikes?.join(", ") || ""}
                    onChange={(e) =>
                      handleUpdateActive(
                        "dislikes",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="Cowardice, Whining, Brute Force"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">
                    High Compatibility Protagonist Archetypes
                  </label>
                  <input
                    type="text"
                    value={activeCompanion.highCompatibility?.join(", ") || ""}
                    onChange={(e) =>
                      handleUpdateActive(
                        "highCompatibility",
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="Knights, Spellblades, Pragmatists"
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Starting Base Favor (%)</label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={activeCompanion.baseAffection}
                    onChange={(e) => handleUpdateActive("baseAffection", parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono"
                  />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between border-t border-white/10 pt-6">
          <Link
            href="/create/world"
            className="px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/30 text-xs font-mono text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            ← Back to World
          </Link>

          <button
            onClick={handleAssembleAndLaunch}
            disabled={isAssembling || companions.length === 0}
            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-pink-500 text-white font-mono text-xs font-bold shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            {isAssembling ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Assembling Reality Matrix...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Assemble Story & Enter Visual Novel
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
