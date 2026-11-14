"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Lock,
  ShieldAlert,
  Star,
  Users,
  Skull,
  ArrowRight,
  Info,
  Eye,
  BookOpen,
  Quote,
} from "lucide-react";
import {
  LabyrinthState,
  StarRank,
  STARFALL_HEROINE_DOSSIERS,
} from "@/types/starfall_labyrinth";
import { StoryCompanion } from "@/types/story";
import {
  SUMMON_COST,
  SUMMON_TEN_COST,
  PITY_THRESHOLD,
  SUMMON_RATES,
  SummonPullResult,
  isStarfallLobbyLocation,
  rollSummon,
  getStarLevelCap,
  getHeroineDossier,
  matchesHeroineName,
} from "@/lib/starfallEngine";
import { soundEffects } from "@/lib/audioEngine";

export const STARFALL_PORTRAIT_FALLBACKS: Record<string, string> = {
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

export interface SummonModalProps {
  isOpen: boolean;
  onClose: () => void;
  labyrinthState: LabyrinthState;
  currentLocation?: string | null;
  storyCompanions?: StoryCompanion[];
  isSendingTurn?: boolean;
  onSummonExecuted: (payload: {
    count: 1 | 10;
    results: SummonPullResult[];
    newState: LabyrinthState;
  }) => void;
  onNarrateSummonArrival?: (results: SummonPullResult[]) => void;
  onOpenBarracks?: () => void;
}

function getStarColorClasses(rank: StarRank) {
  switch (rank) {
    case 5:
      return {
        border: "border-amber-300/90 shadow-[0_0_28px_rgba(251,191,36,0.45)]",
        bg: "from-amber-950/85 via-zinc-900/95 to-black",
        cardBack:
          "from-amber-500/35 via-rose-900/45 to-zinc-950 border-amber-300/90 shadow-[0_0_30px_rgba(251,191,36,0.5)]",
        badge: "bg-amber-500/25 border-amber-300/70 text-amber-200",
        stars: "text-amber-300",
        beam: "from-amber-300 via-yellow-500 to-rose-500",
        beamLabel: "5★ SOVEREIGN CONSTELLATION MANIFESTED!",
      };
    case 4:
      return {
        border: "border-purple-400/80 shadow-[0_0_20px_rgba(192,132,252,0.34)]",
        bg: "from-purple-950/80 via-zinc-900/95 to-black",
        cardBack:
          "from-purple-600/35 via-indigo-950/60 to-zinc-950 border-purple-400/80 shadow-[0_0_22px_rgba(192,132,252,0.4)]",
        badge: "bg-purple-500/25 border-purple-300/60 text-purple-200",
        stars: "text-purple-300",
        beam: "from-fuchsia-400 via-purple-500 to-indigo-500",
        beamLabel: "4★ ASTRAL BANNER RESONANCE!",
      };
    case 3:
      return {
        border: "border-sky-400/70 shadow-[0_0_14px_rgba(56,189,248,0.24)]",
        bg: "from-sky-950/70 via-zinc-900/95 to-black",
        cardBack:
          "from-sky-500/30 via-cyan-950/50 to-zinc-950 border-sky-400/70",
        badge: "bg-sky-500/20 border-sky-400/50 text-sky-200",
        stars: "text-sky-300",
        beam: "from-cyan-300 via-sky-500 to-blue-600",
        beamLabel: "3★ VANGUARD CRYSTAL SHATTERED!",
      };
    case 2:
      return {
        border: "border-emerald-400/55",
        bg: "from-emerald-950/60 via-zinc-900/95 to-black",
        cardBack:
          "from-emerald-600/25 via-zinc-900 to-zinc-950 border-emerald-400/55",
        badge: "bg-emerald-500/20 border-emerald-400/45 text-emerald-200",
        stars: "text-emerald-300",
        beam: "from-emerald-300 via-teal-500 to-cyan-700",
        beamLabel: "2★ SURVIVOR SIGNAL LOCKED",
      };
    default:
      return {
        border: "border-zinc-500/45",
        bg: "from-zinc-900/90 via-zinc-950 to-black",
        cardBack: "from-zinc-700/30 via-zinc-900 to-black border-zinc-500/50",
        badge: "bg-zinc-800/80 border-zinc-600/50 text-zinc-200",
        stars: "text-zinc-300",
        beam: "from-zinc-300 via-slate-400 to-indigo-600",
        beamLabel: "1★ STAR GATE SUMMON",
      };
  }
}

export function SummonModal({
  isOpen,
  onClose,
  labyrinthState,
  currentLocation,
  storyCompanions = [],
  isSendingTurn = false,
  onSummonExecuted,
  onNarrateSummonArrival,
  onOpenBarracks,
}: SummonModalProps) {
  const [activeView, setActiveView] = useState<"summon" | "codex">("summon");
  const [lastResults, setLastResults] = useState<SummonPullResult[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<Record<number, boolean>>({});
  const [beamRarityFlash, setBeamRarityFlash] = useState<StarRank | null>(null);
  const [spotlightQuoteResult, setSpotlightQuoteResult] =
    useState<SummonPullResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unintroducedResults, setUnintroducedResults] = useState<
    SummonPullResult[]
  >([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const inLobby = isStarfallLobbyLocation(currentLocation);
  const shards = labyrinthState.starShards ?? 0;
  const pity = labyrinthState.pityCounter ?? 0;
  const pityPct = Math.min(100, Math.round((pity / PITY_THRESHOLD) * 100));
  const pullsUntilGuaranteedFiveStar = Math.max(1, PITY_THRESHOLD - pity);

  const resolvePortrait = (heroineName: string, spriteSlug?: string): string => {
    if (spriteSlug) {
      return `/characters/starfall-labyrinth/${spriteSlug}/neutral.png`;
    }
    const key = heroineName.trim().toLowerCase();
    const dossier = getHeroineDossier(heroineName);
    if (dossier?.spriteSlug) {
      return `/characters/starfall-labyrinth/${dossier.spriteSlug}/neutral.png`;
    }
    const matchComp = storyCompanions.find((c) =>
      matchesHeroineName(c.name, heroineName, c.id)
    );
    return (
      STARFALL_PORTRAIT_FALLBACKS[key] ||
      matchComp?.baseImageUrl ||
      matchComp?.expressions?.neutral ||
      "/characters/default.png"
    );
  };

  const handlePull = (count: 1 | 10) => {
    setErrorMessage(null);
    const outcome = rollSummon(
      labyrinthState,
      labyrinthState.summonSeed,
      count,
      currentLocation ?? ""
    );

    if (outcome.error) {
      soundEffects.playClick();
      setErrorMessage(outcome.error);
      return;
    }

    const highestStar = outcome.results.reduce<StarRank>(
      (acc, r) => (r.starRank > acc ? r.starRank : acc),
      1
    );
    if (highestStar >= 4 || outcome.results.some((r) => r.isNew)) {
      soundEffects.playIntroBell();
    } else {
      soundEffects.playClick();
    }

    // Trigger short Rarity-Beam flash
    setBeamRarityFlash(highestStar);
    setTimeout(() => {
      setBeamRarityFlash(null);
    }, 850);

    setLastResults(outcome.results);
    // Single pull reveals right after beam; 10x pull lets player flip 1-by-1 or click Reveal All!
    if (count === 1) {
      setRevealedIndices({ 0: true });
      setSpotlightQuoteResult(outcome.results[0] || null);
    } else {
      setRevealedIndices({});
      setSpotlightQuoteResult(null);
    }

    setUnintroducedResults((prev) => [...prev, ...outcome.results]);
    onSummonExecuted({
      count,
      results: outcome.results,
      newState: outcome.newState,
    });
  };

  const handleFlipCard = (idx: number, res: SummonPullResult) => {
    soundEffects.playClick();
    setRevealedIndices((prev) => ({ ...prev, [idx]: true }));
    if (res.isNew || res.starRank >= 4 || res.awakenedToRank) {
      setSpotlightQuoteResult(res);
    }
  };

  const handleRevealAll = () => {
    soundEffects.playIntroBell();
    const allMap: Record<number, boolean> = {};
    lastResults.forEach((_, i) => {
      allMap[i] = true;
    });
    setRevealedIndices(allMap);
    const best =
      [...lastResults]
        .filter((r) => r.isNew || r.awakenedToRank || r.starRank >= 4)
        .sort((a, b) => b.starRank - a.starRank)[0] || null;
    setSpotlightQuoteResult(best);
  };

  const allCardsRevealed =
    lastResults.length > 0 &&
    lastResults.every((_, idx) => Boolean(revealedIndices[idx]));

  const sortedCodexDossiers = Object.values(STARFALL_HEROINE_DOSSIERS).sort(
    (a, b) => b.baseStarRank - a.baseStarRank
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[93dvh] bg-zinc-950/98 border border-indigo-500/35 rounded-3xl shadow-[0_0_90px_rgba(99,102,241,0.28)] flex flex-col overflow-hidden text-zinc-100"
      >
        {/* CINEMATIC RARITY BEAM OVERLAY */}
        {beamRarityFlash && (
          <div
            onClick={() => setBeamRarityFlash(null)}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          >
            <div
              className={`w-28 sm:w-40 h-full bg-gradient-to-b ${
                getStarColorClasses(beamRarityFlash).beam
              } blur-2xl opacity-75 animate-pulse absolute`}
            />
            <div className="relative z-10 text-center space-y-3 px-6">
              <div
                className={`text-3xl sm:text-5xl font-black tracking-widest ${
                  getStarColorClasses(beamRarityFlash).stars
                } drop-shadow-[0_0_24px_rgba(255,255,255,0.65)]`}
              >
                {"★".repeat(beamRarityFlash)}
              </div>
              <p className="text-sm sm:text-lg font-mono font-black tracking-widest text-white uppercase">
                {getStarColorClasses(beamRarityFlash).beamLabel}
              </p>
              <p className="text-[11px] font-mono text-zinc-300">
                Star Gate Monolith fracturing astral quartz...
              </p>
            </div>
          </div>
        )}

        {/* TOP HEADER */}
        <div className="relative px-5 sm:px-7 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-indigo-950/65 via-zinc-950 to-amber-950/35 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Star Gate Monolith • 12-Heroine Celestia Pool
                </span>
                {inLobby ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                    ● Main Lobby Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-200 text-[10px] font-mono font-bold uppercase">
                    <Lock className="w-3 h-3" /> Locked Outside Main Lobby
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                Star Gate Summoning Altar
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {onOpenBarracks && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    onClose();
                    onOpenBarracks();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-200 text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Barracks &amp; Stats</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onClose();
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Close Star Gate (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* VIEW TABS + CURRENCY & PITY BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
            <div className="inline-flex rounded-xl bg-black/60 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveView("summon")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === "summon"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summon Altar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("codex")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === "codex"
                    ? "bg-amber-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Banner Codex ({sortedCodexDossiers.length} Heroes)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/35 text-cyan-300 font-black">
                💠 {shards.toLocaleString()} Shards
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/35 text-amber-200 flex items-center gap-2">
                <span>
                  5★ Pity: <strong>{pity}</strong>/{PITY_THRESHOLD}
                </span>
                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-400 to-amber-300"
                    style={{ width: `${pityPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-300/90">
                  ({pullsUntilGuaranteedFiveStar} left)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeView === "codex" ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-300">
                  All <strong className="text-white">12 Starfall &amp; Astral Anomaly Heroines</strong> can ascend to{" "}
                  <strong className="text-amber-300">5★ (Lv.60)</strong> via Heart Resonance or Duplicate Echoes.
                </span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold">
                    5★ {(SUMMON_RATES[5] * 100).toFixed(1)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200">
                    4★ {(SUMMON_RATES[4] * 100).toFixed(1)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-200">
                    3★ {(SUMMON_RATES[3] * 100).toFixed(0)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                    2★ {(SUMMON_RATES[2] * 100).toFixed(0)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-600/50 text-zinc-300">
                    1★ {(SUMMON_RATES[1] * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sortedCodexDossiers.map((hero) => {
                  const st = getStarColorClasses(hero.baseStarRank);
                  const ownedEntry = (labyrinthState.roster || []).find((r) =>
                    matchesHeroineName(r.heroineName, hero.name, r.heroineId)
                  );
                  const isFallen = ownedEntry?.status === "FALLEN";
                  return (
                    <div
                      key={hero.id}
                      className={`rounded-2xl bg-gradient-to-b ${st.bg} border ${st.border} p-3.5 flex gap-3 items-stretch`}
                    >
                      <div className="w-24 h-32 shrink-0 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex items-end justify-center">
                        <img
                          src={resolvePortrait(hero.name, hero.spriteSlug)}
                          alt={hero.name}
                          className={`w-full h-full object-contain object-bottom ${
                            isFallen ? "grayscale opacity-50" : ""
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-mono font-black ${st.stars}`}>
                              {"★".repeat(hero.baseStarRank)}
                            </span>
                            {ownedEntry ? (
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  isFallen
                                    ? "bg-rose-950 border-rose-500/50 text-rose-300"
                                    : "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                                }`}
                              >
                                {isFallen
                                  ? "FALLEN"
                                  : `OWNED (${ownedEntry.starRank}★ Lv.${ownedEntry.level})`}
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
                                UNSUMMONED
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-mono font-black text-white truncate mt-0.5">
                            {hero.name}
                          </h4>
                          <p className="text-[10px] font-mono text-indigo-300 truncate">
                            {hero.combatRole}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                            {hero.epithet} • Signature:{" "}
                            <strong className="text-zinc-200">
                              {hero.skillKit.bondSpecial.name}
                            </strong>
                          </p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] font-mono text-zinc-300 flex items-center justify-between">
                          <span>Tag: {hero.skillKit.tagAssistSkill.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* MAIN LOBBY LOCK WARNING */}
              {!inLobby && (
                <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 flex items-start gap-3 text-rose-100">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs font-mono">
                    <p className="font-bold text-rose-200 uppercase tracking-wide">
                      Star Gate Locked — Active Floor Deployment ({currentLocation || "Labyrinth Floor"})
                    </p>
                    <p className="text-rose-200/85 leading-relaxed">
                      Per Covenant I, summoning can only be performed from{" "}
                      <strong className="text-white">Star Gate Plaza (Main Lobby)</strong>. Extract or clear to a return gate to pull new heroes.
                    </p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs font-mono text-amber-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!inLobby || shards < SUMMON_COST || isSendingTurn}
                    onClick={() => handlePull(1)}
                    className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/80 to-cyan-900/70 hover:from-indigo-800 hover:to-cyan-800 disabled:from-zinc-900 disabled:to-zinc-900 border border-cyan-400/50 disabled:border-white/10 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between group shadow-lg"
                  >
                    <div>
                      <span className="text-sm font-black font-mono text-white block group-hover:text-cyan-200">
                        Single Resonance (1x Pull)
                      </span>
                      <span className="text-[11px] font-mono text-cyan-200/80">
                        Materialize 1 Hero from the 12-Unit Pool
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-black/50 border border-cyan-400/40 font-mono text-xs font-black text-cyan-300 shrink-0">
                      💠 {SUMMON_COST}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!inLobby || shards < SUMMON_TEN_COST || isSendingTurn}
                    onClick={() => handlePull(10)}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-700/80 via-rose-800/75 to-purple-900/80 hover:from-amber-600 hover:via-rose-700 hover:to-purple-800 disabled:from-zinc-900 disabled:to-zinc-900 border border-amber-400/60 disabled:border-white/10 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between group shadow-[0_0_25px_rgba(251,191,36,0.2)]"
                  >
                    <div>
                      <span className="text-sm font-black font-mono text-white block group-hover:text-amber-200">
                        Grand Constellation (10x Pull)
                      </span>
                      <span className="text-[11px] font-mono text-amber-200/90">
                        10 Constellation Cards • Interactive Flip Reveal
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-300/50 font-mono text-xs font-black text-amber-300 shrink-0">
                      💠 {SUMMON_TEN_COST}
                    </span>
                  </button>
                </div>
              </div>

              {/* SPOKEN SUMMON QUOTE SPOTLIGHT */}
              {spotlightQuoteResult && spotlightQuoteResult.summonQuote && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-zinc-900/90 to-amber-950/40 border border-amber-400/45 flex items-center gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <img
                    src={resolvePortrait(
                      spotlightQuoteResult.heroineName,
                      spotlightQuoteResult.spriteSlug
                    )}
                    alt={spotlightQuoteResult.heroineName}
                    className="w-14 h-16 object-contain object-bottom rounded-xl bg-black/50 border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-amber-300">
                        {"★".repeat(spotlightQuoteResult.starRank)}{" "}
                        {spotlightQuoteResult.heroineName}
                      </span>
                      {spotlightQuoteResult.epithet && (
                        <span className="text-[10px] font-mono text-indigo-300">
                          — {spotlightQuoteResult.epithet}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-100 italic mt-1 flex items-start gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>&ldquo;{spotlightQuoteResult.summonQuote}&rdquo;</span>
                    </p>
                  </div>
                </div>
              )}

              {/* SUMMON REVEAL RESULTS (CARD FLIP + REVEAL ALL) */}
              {lastResults.length > 0 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Star Gate Manifestation ({lastResults.length} Pull
                      {lastResults.length > 1 ? "s" : ""})
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      {!allCardsRevealed && (
                        <button
                          type="button"
                          onClick={handleRevealAll}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-300/60 text-amber-100 font-mono text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>Reveal All Cards</span>
                        </button>
                      )}

                      {onNarrateSummonArrival &&
                        allCardsRevealed &&
                        unintroducedResults.some(
                          (r) => r.isNew || r.awakenedToRank
                        ) && (
                          <button
                            type="button"
                            disabled={isSendingTurn}
                            onClick={() => {
                              const batch = [...unintroducedResults];
                              setUnintroducedResults([]);
                              onClose();
                              onNarrateSummonArrival(batch);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                          >
                            <span>Greet Summoned Allies in Story</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                    </div>
                  </div>

                  <div
                    className={`grid gap-3 ${
                      lastResults.length === 1
                        ? "grid-cols-1 max-w-sm mx-auto"
                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                    }`}
                  >
                    {lastResults.map((res, idx) => {
                      const style = getStarColorClasses(res.starRank);
                      const isRevealed = Boolean(revealedIndices[idx]);
                      const dossier = getHeroineDossier(res.heroineName);

                      if (!isRevealed) {
                        return (
                          <button
                            key={res.pullNumber}
                            type="button"
                            onClick={() => handleFlipCard(idx, res)}
                            className={`h-60 rounded-2xl bg-gradient-to-b ${style.cardBack} border p-3 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.03] transition-all group relative overflow-hidden`}
                          >
                            <div className="w-14 h-14 rounded-full border border-white/20 bg-black/40 flex items-center justify-center group-hover:rotate-12 transition-transform">
                              <Sparkles className={`w-6 h-6 ${style.stars}`} />
                            </div>
                            <span className={`font-mono text-sm font-black ${style.stars}`}>
                              {"★".repeat(res.starRank)}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 group-hover:text-white">
                              Tap to Materialize
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={res.pullNumber}
                          onClick={() => setSpotlightQuoteResult(res)}
                          className={`rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} p-3 flex flex-col justify-between gap-2 relative overflow-hidden animate-in zoom-in-95 duration-200 cursor-pointer`}
                        >
                          <div className="flex items-center justify-between gap-1 z-10">
                            <span className={`font-mono text-xs font-black ${style.stars}`}>
                              {"★".repeat(res.starRank)}
                            </span>
                            {res.isPityTriggered && (
                              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-400 text-black">
                                PITY!
                              </span>
                            )}
                          </div>

                          <div className="relative h-36 w-full flex items-end justify-center overflow-hidden rounded-xl bg-black/45 border border-white/5">
                            <img
                              src={resolvePortrait(res.heroineName, res.spriteSlug)}
                              alt={res.heroineName}
                              className={`h-full w-full object-contain object-bottom ${
                                res.isFallenEcho ? "grayscale opacity-50" : ""
                              }`}
                            />
                          </div>

                          <div className="space-y-1 z-10">
                            <p className="text-xs font-mono font-bold text-white truncate">
                              {res.heroineName}
                            </p>
                            <p className="text-[10px] font-mono text-zinc-400 truncate">
                              {dossier?.combatRole || "Summoned Hero"}
                            </p>

                            {res.isNew ? (
                              <span className="inline-block w-full text-center text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/50 text-emerald-200">
                                ✦ NEW RECRUIT!
                              </span>
                            ) : res.isFallenEcho ? (
                              <span className="inline-block w-full text-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300">
                                ✝ FALLEN ASH (+{res.shardsRefunded} 💠)
                              </span>
                            ) : res.awakenedToRank ? (
                              <span className="inline-block w-full text-center text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/60 text-amber-200">
                                ★ ASCENDED → {res.awakenedToRank}★ (+{res.shardsRefunded} 💠)
                              </span>
                            ) : (
                              <span className="inline-block w-full text-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-200">
                                ECHO (+{res.shardsRefunded} 💠)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ROSTER & MEMORIAL SUMMARY */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                <div className="lg:col-span-8 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      Summoned Account Roster (
                      {(labyrinthState.roster || []).filter((r) => r.status !== "FALLEN").length}{" "}
                      Living)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      2 Frontline + 2 Reserve + You
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(labyrinthState.roster || []).map((entry) => {
                      const isFallen = entry.status === "FALLEN";
                      const isWounded = entry.status === "WOUNDED";
                      const cap = getStarLevelCap(entry.starRank);
                      return (
                        <div
                          key={entry.heroineName}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono ${
                            isFallen
                              ? "bg-rose-950/25 border-rose-500/30 opacity-70"
                              : isWounded
                              ? "bg-amber-950/35 border-amber-400/45"
                              : entry.status === "DEPLOYED"
                              ? "bg-indigo-950/35 border-indigo-400/40"
                              : "bg-black/50 border-white/10"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white truncate">
                                {entry.heroineName}
                              </span>
                              <span className="text-amber-300 text-[10px] shrink-0">
                                {"★".repeat(entry.starRank)}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block">
                              Lv.{entry.level}/{cap} •{" "}
                              {entry.formationSlot ? `[${entry.formationSlot}]` : "Benched"}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                              isFallen
                                ? "bg-rose-950 border-rose-500/50 text-rose-300"
                                : isWounded
                                ? "bg-amber-950/80 border-amber-400/60 text-amber-200"
                                : entry.status === "DEPLOYED"
                                ? "bg-emerald-950/80 border-emerald-400/50 text-emerald-300"
                                : "bg-zinc-800 border-white/15 text-zinc-300"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-4 p-4 rounded-2xl bg-zinc-900/60 border border-rose-500/25 space-y-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    Memorial Wall ({(labyrinthState.memorial || []).length})
                  </span>
                  {(labyrinthState.memorial || []).length === 0 ? (
                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      Zero casualties etched into the black stone. Rotate wounded allies to Reserve!
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {labyrinthState.memorial.map((m, idx) => (
                        <div
                          key={`${m.name}-${idx}`}
                          className="p-2 rounded-lg bg-black/60 border border-rose-500/30 text-[10px] font-mono space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-rose-200 font-bold">
                            <span>✝ {m.name}</span>
                            <span>Floor {m.floor}</span>
                          </div>
                          <p className="text-zinc-400 leading-snug">{m.cause}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
