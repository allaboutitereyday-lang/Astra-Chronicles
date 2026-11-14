"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Sparkles,
  Lock,
  ShieldAlert,
  Users,
  Skull,
  ArrowRight,
  Info,
  Eye,
  BookOpen,
  Quote,
  FastForward,
  Wand2,
  Flame,
  Zap,
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

type RitualStage = "idle" | "charging" | "meteor" | "showcase" | "cards";

function getStarColorClasses(rank: StarRank) {
  switch (rank) {
    case 5:
      return {
        border: "border-amber-300/90 shadow-[0_0_32px_rgba(251,191,36,0.48)]",
        bg: "from-amber-950/85 via-zinc-900/95 to-black",
        cardBack:
          "from-amber-500/35 via-rose-900/50 to-zinc-950 border-amber-300/90 shadow-[0_0_34px_rgba(251,191,36,0.55)]",
        badge: "bg-amber-500/25 border-amber-300/70 text-amber-200",
        stars: "text-amber-300",
        hex: "#fbbf24",
        hexSecondary: "#f43f5e",
        auraBg: "from-amber-500/30 via-rose-500/20 to-indigo-950/90",
        beam: "from-amber-200 via-amber-400 to-rose-500",
        beamLabel: "5★ SOVEREIGN CONSTELLATION MANIFESTED!",
        sealTitle: "SOLAR APEX SEAL BROKEN",
      };
    case 4:
      return {
        border: "border-purple-400/85 shadow-[0_0_24px_rgba(192,132,252,0.38)]",
        bg: "from-purple-950/80 via-zinc-900/95 to-black",
        cardBack:
          "from-purple-600/35 via-indigo-950/65 to-zinc-950 border-purple-400/85 shadow-[0_0_26px_rgba(192,132,252,0.45)]",
        badge: "bg-purple-500/25 border-purple-300/60 text-purple-200",
        stars: "text-purple-300",
        hex: "#c084fc",
        hexSecondary: "#6366f1",
        auraBg: "from-purple-600/30 via-fuchsia-600/20 to-indigo-950/90",
        beam: "from-fuchsia-300 via-purple-500 to-indigo-500",
        beamLabel: "4★ ASTRAL BANNER RESONANCE!",
        sealTitle: "AMETHYST CONSTELLATION SEAL",
      };
    case 3:
      return {
        border: "border-sky-400/75 shadow-[0_0_16px_rgba(56,189,248,0.28)]",
        bg: "from-sky-950/70 via-zinc-900/95 to-black",
        cardBack:
          "from-sky-500/30 via-cyan-950/55 to-zinc-950 border-sky-400/75 shadow-[0_0_18px_rgba(56,189,248,0.35)]",
        badge: "bg-sky-500/20 border-sky-400/50 text-sky-200",
        stars: "text-sky-300",
        hex: "#38bdf8",
        hexSecondary: "#0ea5e9",
        auraBg: "from-sky-500/25 via-cyan-600/15 to-zinc-950/95",
        beam: "from-cyan-200 via-sky-500 to-blue-600",
        beamLabel: "3★ VANGUARD CRYSTAL SHATTERED!",
        sealTitle: "SAPPHIRE VANGUARD SEAL",
      };
    case 2:
      return {
        border: "border-emerald-400/60",
        bg: "from-emerald-950/60 via-zinc-900/95 to-black",
        cardBack:
          "from-emerald-600/25 via-zinc-900 to-zinc-950 border-emerald-400/60",
        badge: "bg-emerald-500/20 border-emerald-400/45 text-emerald-200",
        stars: "text-emerald-300",
        hex: "#34d399",
        hexSecondary: "#10b981",
        auraBg: "from-emerald-500/20 via-teal-700/15 to-zinc-950/95",
        beam: "from-emerald-300 via-teal-500 to-cyan-700",
        beamLabel: "2★ SURVIVOR SIGNAL LOCKED",
        sealTitle: "EMERALD CONDUIT SEAL",
      };
    default:
      return {
        border: "border-cyan-500/40",
        bg: "from-zinc-900/90 via-zinc-950 to-black",
        cardBack: "from-indigo-900/35 via-zinc-900 to-black border-cyan-500/45",
        badge: "bg-zinc-800/80 border-zinc-600/50 text-zinc-200",
        stars: "text-zinc-300",
        hex: "#94a3b8",
        hexSecondary: "#6366f1",
        auraBg: "from-indigo-500/20 via-slate-800/30 to-zinc-950/95",
        beam: "from-cyan-200 via-indigo-400 to-slate-600",
        beamLabel: "1★ STAR GATE SUMMON",
        sealTitle: "ASTRAL QUARTZ SEAL",
      };
  }
}

/**
 * Reusable Arcane Magic Circle SVG with counter-rotating geometric rings & rune ticks
 */
function ArcaneMagicCircleSvg({
  primaryColor = "#818cf8",
  secondaryColor = "#fbbf24",
  fast = false,
  className = "w-64 h-64",
}: {
  primaryColor?: string;
  secondaryColor?: string;
  fast?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative flex items-center justify-center pointer-events-none ${className}`}>
      {/* Outer Runic Ring */}
      <svg
        viewBox="0 0 240 240"
        className={`w-full h-full ${fast ? "animate-[spin_4s_linear_infinite]" : "animate-[spin_26s_linear_infinite]"}`}
      >
        <defs>
          <radialGradient id="arcaneGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
            <stop offset="65%" stopColor={secondaryColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="112" fill="url(#arcaneGlow)" />
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.4"
          strokeDasharray="6 4 2 4"
          opacity="0.85"
        />
        <circle
          cx="120"
          cy="120"
          r="98"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1"
          opacity="0.65"
        />
        {/* 12 Zodiac Constellation Nodes */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x = 120 + Math.cos(angle) * 103;
          const y = 120 + Math.sin(angle) * 103;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i % 3 === 0 ? 3 : 1.7}
              fill={i % 3 === 0 ? secondaryColor : primaryColor}
              opacity="0.9"
            />
          );
        })}
        {/* Outer Hexagon */}
        <polygon
          points="120,24 203,72 203,168 120,216 37,168 37,72"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.2"
          opacity="0.6"
        />
      </svg>

      {/* Inner Counter-Rotating Geometric Seal */}
      <svg
        viewBox="0 0 240 240"
        className={`w-[78%] h-[78%] absolute ${
          fast ? "animate-[spin_3s_linear_infinite_reverse]" : "animate-[spin_16s_linear_infinite_reverse]"
        }`}
      >
        <circle
          cx="120"
          cy="120"
          r="84"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.4"
          strokeDasharray="10 6"
          opacity="0.8"
        />
        <polygon
          points="120,38 191,161 49,161"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="1.3"
          opacity="0.75"
        />
        <polygon
          points="120,202 191,79 49,79"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.3"
          opacity="0.75"
        />
        <circle
          cx="120"
          cy="120"
          r="42"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.6"
          opacity="0.9"
        />
      </svg>
    </div>
  );
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
  const [ritualStage, setRitualStage] = useState<RitualStage>("idle");
  const [ritualDisplayTier, setRitualDisplayTier] = useState<StarRank>(1);
  const [ritualFinalTier, setRitualFinalTier] = useState<StarRank>(1);
  const [ritualCount, setRitualCount] = useState<1 | 10>(1);
  const [ritualEscalating, setRitualEscalating] = useState(false);
  const [showcaseResult, setShowcaseResult] = useState<SummonPullResult | null>(null);
  const [hoveredPull, setHoveredPull] = useState<1 | 10 | null>(null);
  const [spotlightQuoteResult, setSpotlightQuoteResult] =
    useState<SummonPullResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unintroducedResults, setUnintroducedResults] = useState<SummonPullResult[]>([]);
  const [isCascadingReveal, setIsCascadingReveal] = useState(false);

  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearAllTimers();
        setRitualStage("idle");
        onClose();
      }
    },
    [onClose, clearAllTimers]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      clearAllTimers();
      setRitualStage((prev) => (prev === "cards" ? "cards" : "idle"));
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown, clearAllTimers]);

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

  const getHeadlineShowcaseCandidate = (results: SummonPullResult[]): SummonPullResult | null => {
    if (!results || results.length === 0) return null;
    const sorted = [...results].sort((a, b) => {
      const aScore = (a.isNew ? 100 : 0) + (a.awakenedToRank ? 50 : 0) + a.starRank * 10;
      const bScore = (b.isNew ? 100 : 0) + (b.awakenedToRank ? 50 : 0) + b.starRank * 10;
      return bScore - aScore;
    });
    const top = sorted[0];
    if (top && (top.isNew || top.awakenedToRank || top.starRank >= 4 || results.length === 1)) {
      return top;
    }
    return null;
  };

  const finishRitualToCards = (
    results: SummonPullResult[],
    count: 1 | 10,
    headline: SummonPullResult | null
  ) => {
    setRitualEscalating(false);
    if (count === 1) {
      setRevealedIndices({ 0: true });
      setSpotlightQuoteResult(results[0] || null);
    } else {
      setRevealedIndices({});
      setSpotlightQuoteResult(headline);
    }
    setRitualStage("cards");
  };

  const triggerMeteorAndShowcase = (
    results: SummonPullResult[],
    highestStar: StarRank,
    count: 1 | 10
  ) => {
    clearAllTimers();
    setRitualDisplayTier(highestStar);
    setRitualEscalating(false);
    setRitualStage("meteor");
    soundEffects.playSummonShatter(highestStar);

    const headline = getHeadlineShowcaseCandidate(results);
    scheduleTimeout(() => {
      if (headline && (headline.isNew || headline.awakenedToRank || headline.starRank >= 4)) {
        setShowcaseResult(headline);
        setRitualStage("showcase");
        soundEffects.playCardFlip(headline.starRank);
      } else {
        finishRitualToCards(results, count, headline);
      }
    }, 950);
  };

  const handleSkipRitual = () => {
    clearAllTimers();
    setRitualEscalating(false);
    setShowcaseResult(null);
    const allMap: Record<number, boolean> = {};
    lastResults.forEach((_, i) => {
      allMap[i] = true;
    });
    setRevealedIndices(allMap);
    const headline = getHeadlineShowcaseCandidate(lastResults);
    setSpotlightQuoteResult(headline || lastResults[0] || null);
    setRitualStage("cards");
    soundEffects.playCardFlip(ritualFinalTier);
  };

  const handlePull = (count: 1 | 10) => {
    if (ritualStage === "charging" || ritualStage === "meteor") return;
    setErrorMessage(null);
    clearAllTimers();
    setIsCascadingReveal(false);

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

    setLastResults(outcome.results);
    setRevealedIndices({});
    setSpotlightQuoteResult(null);
    setShowcaseResult(null);
    setRitualCount(count);
    setRitualFinalTier(highestStar);
    setUnintroducedResults((prev) => [...prev, ...outcome.results]);
    onSummonExecuted({
      count,
      results: outcome.results,
      newState: outcome.newState,
    });

    // Build dramatic rarity fake-out escalation steps!
    const steps: StarRank[] =
      highestStar >= 5
        ? [3, 4, 5]
        : highestStar === 4
        ? [2, 3, 4]
        : highestStar === 3
        ? [2, 3]
        : [highestStar];

    setRitualDisplayTier(steps[0]);
    setRitualStage("charging");
    soundEffects.playSummonChannel();

    if (steps.length > 1) {
      steps.slice(1).forEach((stepRank, idx) => {
        scheduleTimeout(() => {
          setRitualDisplayTier(stepRank);
          setRitualEscalating(true);
          soundEffects.playRarityEscalation(stepRank);
          scheduleTimeout(() => setRitualEscalating(false), 320);
        }, (idx + 1) * 540);
      });
    }

    const totalChannelMs = Math.max(1250, steps.length * 560 + 350);
    scheduleTimeout(() => {
      triggerMeteorAndShowcase(outcome.results, highestStar, count);
    }, totalChannelMs);
  };

  const handleFlipCard = (idx: number, res: SummonPullResult) => {
    soundEffects.playCardFlip(res.starRank);
    setRevealedIndices((prev) => ({ ...prev, [idx]: true }));
    if (res.isNew || res.starRank >= 4 || res.awakenedToRank) {
      setSpotlightQuoteResult(res);
    }
  };

  const handleCascadeReveal = () => {
    const unrevealed = lastResults
      .map((res, idx) => ({ res, idx }))
      .filter((item) => !revealedIndices[item.idx]);
    if (unrevealed.length === 0 || isCascadingReveal) return;

    setIsCascadingReveal(true);
    unrevealed.forEach((item, order) => {
      scheduleTimeout(() => {
        soundEffects.playCardFlip(item.res.starRank);
        setRevealedIndices((prev) => ({ ...prev, [item.idx]: true }));
        if (item.res.isNew || item.res.starRank >= 4 || item.res.awakenedToRank) {
          setSpotlightQuoteResult(item.res);
        }
        if (order === unrevealed.length - 1) {
          setIsCascadingReveal(false);
        }
      }, order * 175);
    });
  };

  const handleRevealAll = () => {
    clearAllTimers();
    setIsCascadingReveal(false);
    soundEffects.playSummonShatter(ritualFinalTier);
    const allMap: Record<number, boolean> = {};
    lastResults.forEach((_, i) => {
      allMap[i] = true;
    });
    setRevealedIndices(allMap);
    const best =
      getHeadlineShowcaseCandidate(lastResults) || lastResults[0] || null;
    setSpotlightQuoteResult(best);
  };

  const allCardsRevealed =
    lastResults.length > 0 &&
    lastResults.every((_, idx) => Boolean(revealedIndices[idx]));

  const sortedCodexDossiers = Object.values(STARFALL_HEROINE_DOSSIERS).sort(
    (a, b) => b.baseStarRank - a.baseStarRank
  );

  const ritualStyle = getStarColorClasses(ritualDisplayTier);
  const altarPreviewTier: StarRank =
    hoveredPull === 10
      ? 5
      : pity >= 70
      ? 5
      : hoveredPull === 1
      ? 4
      : 3;
  const altarPreviewStyle = getStarColorClasses(altarPreviewTier);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && ritualStage !== "charging" && ritualStage !== "meteor") {
          onClose();
        }
      }}
      className="fixed inset-0 z-[85] bg-black/88 backdrop-blur-xl flex items-center justify-center p-2.5 sm:p-5 select-none animate-in fade-in duration-200"
    >
      {/* SCOPED MAGIC SUMMON KEYFRAMES */}
      <style>{`
        @keyframes starfallShake {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-6px, 4px) scale(1.03); }
          40% { transform: translate(6px, -4px) scale(1.05); }
          60% { transform: translate(-4px, -3px) scale(1.04); }
          80% { transform: translate(4px, 3px) scale(1.02); }
        }
        @keyframes starfallMeteor {
          0% { transform: translate(42vw, -38vh) scale(0.4) rotate(-38deg); opacity: 0; }
          20% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate(0, 0) scale(1.25) rotate(-38deg); opacity: 0; }
        }
        @keyframes starfallCardUnseal {
          0% { transform: perspective(900px) rotateY(88deg) scale(0.86); opacity: 0.2; }
          65% { transform: perspective(900px) rotateY(-8deg) scale(1.04); opacity: 1; }
          100% { transform: perspective(900px) rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes starfallFloatMote {
          0% { transform: translateY(18px) scale(0.7); opacity: 0; }
          35% { opacity: 0.9; }
          100% { transform: translateY(-48px) scale(1.2); opacity: 0; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-6xl max-h-[93dvh] bg-zinc-950/98 border border-indigo-500/35 rounded-3xl shadow-[0_0_95px_rgba(99,102,241,0.3)] flex flex-col overflow-hidden text-zinc-100 ${
          ritualEscalating ? "animate-[starfallShake_0.32s_ease-in-out]" : ""
        }`}
      >
        {/* =================================================================
            PHASE 1: ARCANE SEAL CHANNELING & RARITY FAKE-OUT OVERLAY
           ================================================================= */}
        {ritualStage === "charging" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl overflow-hidden animate-in fade-in duration-150">
            {/* Ambient Gradient Bloom */}
            <div
              className={`absolute inset-0 bg-gradient-radial ${ritualStyle.auraBg} opacity-90 transition-all duration-300`}
            />
            <div
              className={`w-64 sm:w-96 h-full bg-gradient-to-b ${ritualStyle.beam} blur-3xl opacity-35 animate-pulse absolute transition-all duration-300`}
            />

            {/* Floating Arcane Motes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[15, 28, 42, 58, 72, 85].map((leftPct, i) => (
                <div
                  key={i}
                  style={{
                    left: `${leftPct}%`,
                    bottom: `${18 + (i % 3) * 14}%`,
                    backgroundColor: ritualStyle.hex,
                    animation: `starfallFloatMote ${1.6 + (i % 3) * 0.4}s ease-in-out ${i * 0.15}s infinite`,
                  }}
                  className="absolute w-2 h-2 rounded-full blur-[1px]"
                />
              ))}
            </div>

            {/* Skip Ritual Button */}
            <button
              type="button"
              onClick={handleSkipRitual}
              className="absolute top-5 right-5 z-20 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <span>Skip Ritual</span>
              <FastForward className="w-3.5 h-3.5" />
            </button>

            {/* Interactive Magic Circle Trigger */}
            <button
              type="button"
              onClick={() => triggerMeteorAndShowcase(lastResults, ritualFinalTier, ritualCount)}
              className="relative z-10 flex flex-col items-center justify-center gap-4 cursor-pointer group p-6"
            >
              <div className="relative flex items-center justify-center">
                <ArcaneMagicCircleSvg
                  primaryColor={ritualStyle.hex}
                  secondaryColor={ritualStyle.hexSecondary}
                  fast
                  className="w-64 h-64 sm:w-80 sm:h-80 transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  style={{ borderColor: ritualStyle.hex }}
                  className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 bg-black/75 flex flex-col items-center justify-center shadow-[0_0_45px_rgba(255,255,255,0.25)] group-active:scale-90 transition-transform"
                >
                  <Sparkles className={`w-8 h-8 sm:w-10 sm:h-10 ${ritualStyle.stars} animate-pulse`} />
                  <span className="text-[10px] font-mono font-black tracking-widest text-white mt-1">
                    {ritualDisplayTier}★ SEAL
                  </span>
                </div>
              </div>

              <div className="text-center space-y-1.5">
                <div
                  className={`text-2xl sm:text-4xl font-black tracking-[0.25em] ${ritualStyle.stars} drop-shadow-[0_0_24px_rgba(255,255,255,0.6)] transition-all duration-200`}
                >
                  {"★".repeat(ritualDisplayTier)}
                </div>
                <p className="text-sm sm:text-base font-mono font-black tracking-widest text-white uppercase">
                  {ritualStyle.sealTitle}
                </p>
                <p className="text-xs font-mono text-zinc-300 animate-pulse">
                  Tap the Astral Seal to Unleash Starfall Convergence!
                </p>
              </div>
            </button>
          </div>
        )}

        {/* =================================================================
            PHASE 2: SHOOTING STAR METEOR CONVERGENCE & PRISM SHATTER
           ================================================================= */}
        {ritualStage === "meteor" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 overflow-hidden animate-in fade-in duration-100">
            <div
              className={`w-48 sm:w-72 h-full bg-gradient-to-b ${ritualStyle.beam} blur-3xl opacity-80 animate-pulse absolute`}
            />

            {/* Shooting Star Meteors */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {(lastResults.length > 0 ? lastResults : [{ starRank: ritualFinalTier }]).map((item, i) => {
                const st = getStarColorClasses((item as SummonPullResult).starRank || ritualFinalTier);
                const delay = (i % 5) * 0.09;
                const offsetX = ((i % 4) - 1.5) * 28;
                const offsetY = ((Math.floor(i / 4)) - 1) * 24;
                return (
                  <div
                    key={i}
                    style={{
                      marginLeft: `${offsetX}px`,
                      marginTop: `${offsetY}px`,
                      animation: `starfallMeteor 0.68s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
                    }}
                    className="absolute flex items-center"
                  >
                    <div
                      style={{
                        background: `linear-gradient(90deg, ${st.hex}, transparent)`,
                      }}
                      className="w-32 sm:w-52 h-1.5 rounded-full blur-[1px]"
                    />
                    <div
                      style={{ backgroundColor: st.hex, boxShadow: `0 0 22px ${st.hex}` }}
                      className="w-3.5 h-3.5 rounded-full -ml-2"
                    />
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 text-center space-y-3 px-6 animate-in zoom-in-90 duration-300">
              <div
                className={`text-4xl sm:text-6xl font-black tracking-widest ${ritualStyle.stars} drop-shadow-[0_0_32px_rgba(255,255,255,0.8)]`}
              >
                {"★".repeat(ritualFinalTier)}
              </div>
              <p className="text-base sm:text-xl font-mono font-black tracking-widest text-white uppercase">
                {ritualStyle.beamLabel}
              </p>
            </div>
          </div>
        )}

        {/* =================================================================
            PHASE 3: FULL-MODAL HEADLINE HEROINE SPLASH SHOWCASE
           ================================================================= */}
        {ritualStage === "showcase" && showcaseResult && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-zinc-950/98 overflow-y-auto animate-in fade-in zoom-in-95 duration-250">
            {(() => {
              const sStyle = getStarColorClasses(showcaseResult.starRank);
              const sDossier = getHeroineDossier(showcaseResult.heroineName);
              return (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-b ${sStyle.auraBg} opacity-75 pointer-events-none`} />

                  <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full border text-xs font-mono font-black uppercase ${sStyle.badge}`}>
                        {showcaseResult.isNew
                          ? "✦ NEW COVENANT MANIFESTATION"
                          : showcaseResult.awakenedToRank
                          ? `★ RESONANCE ASCENSION → ${showcaseResult.awakenedToRank}★`
                          : "★ CONSTELLATION SPOTLIGHT"}
                      </span>
                      {showcaseResult.isPityTriggered && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-400 text-black text-xs font-mono font-black">
                          90-PULL PITY GUARANTEED
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        finishRitualToCards(lastResults, ritualCount, showcaseResult)
                      }
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold text-white cursor-pointer"
                    >
                      Continue to Cards →
                    </button>
                  </div>

                  <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-center px-6 sm:px-10 py-6">
                    {/* HEROINE PORTRAIT WITH ROTATING MAGIC HALO */}
                    <div className="md:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[340px]">
                      <ArcaneMagicCircleSvg
                        primaryColor={sStyle.hex}
                        secondaryColor={sStyle.hexSecondary}
                        className="w-64 h-64 sm:w-80 sm:h-80 absolute opacity-85"
                      />
                      <img
                        src={resolvePortrait(showcaseResult.heroineName, showcaseResult.spriteSlug)}
                        alt={showcaseResult.heroineName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/characters/default.png";
                        }}
                        className={`relative z-10 max-h-72 sm:max-h-96 object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] animate-in zoom-in-90 duration-300 ${
                          showcaseResult.isFallenEcho ? "grayscale opacity-60" : ""
                        }`}
                      />
                    </div>

                    {/* HEROINE DETAILS & SUMMON QUOTE */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="space-y-1">
                        <div className={`text-2xl sm:text-3xl font-black tracking-widest ${sStyle.stars}`}>
                          {"★".repeat(showcaseResult.starRank)}
                        </div>
                        <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                          {showcaseResult.heroineName}
                        </h3>
                        <p className="text-xs sm:text-sm font-mono text-indigo-300 font-bold">
                          {sDossier?.combatRole || "Star Gate Hero"}
                          {showcaseResult.epithet ? ` — ${showcaseResult.epithet}` : ""}
                        </p>
                      </div>

                      {showcaseResult.summonQuote && (
                        <div className="p-4 rounded-2xl bg-black/65 border border-white/15 text-sm sm:text-base text-zinc-100 italic flex items-start gap-2.5">
                          <Quote className="w-4 h-4 text-amber-300 shrink-0 mt-1" />
                          <span>&ldquo;{showcaseResult.summonQuote}&rdquo;</span>
                        </div>
                      )}

                      {sDossier && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10">
                            <div className="text-sky-300 font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Active Skill
                            </div>
                            <div className="text-white font-bold mt-0.5 truncate">
                              {sDossier.skillKit.activeSkill.name}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10">
                            <div className="text-emerald-300 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Tag-Assist
                            </div>
                            <div className="text-white font-bold mt-0.5 truncate">
                              {sDossier.skillKit.tagAssistSkill.name}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-amber-400/25">
                            <div className="text-amber-300 font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Bond Ultimate
                            </div>
                            <div className="text-white font-bold mt-0.5 truncate">
                              {sDossier.skillKit.bondSpecial.name}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            finishRitualToCards(lastResults, ritualCount, showcaseResult)
                          }
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-mono text-sm font-black shadow-[0_0_28px_rgba(251,191,36,0.35)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {ritualCount === 1
                              ? "Accept Manifestation Card"
                              : `Unseal All ${lastResults.length} Constellation Cards`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* TOP HEADER */}
        <div className="relative px-5 sm:px-7 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-indigo-950/65 via-zinc-950 to-amber-950/35 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Star Gate Monolith • Celestial Invocation Altar
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
                <Wand2 className="w-3.5 h-3.5" />
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
                    className={`h-full transition-all ${
                      pity >= 70
                        ? "bg-gradient-to-r from-amber-400 via-rose-400 to-amber-200 animate-pulse"
                        : "bg-gradient-to-r from-indigo-500 via-purple-400 to-amber-300"
                    }`}
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
                  All <strong className="text-white">Starfall &amp; Astral Anomaly Heroines</strong> can ascend to{" "}
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
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/characters/default.png";
                          }}
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

              {/* INTERACTIVE ARCANE ASTROLABE ALTAR + SPELLCAST PULL BUTTONS */}
              <div className="relative rounded-3xl bg-gradient-to-b from-indigo-950/45 via-zinc-900/85 to-black/90 border border-indigo-400/25 p-5 overflow-hidden shadow-2xl space-y-5">
                {/* Ambient Magic Circle Stage */}
                <div className="relative flex flex-col items-center justify-center py-2">
                  <div className="relative flex items-center justify-center">
                    <ArcaneMagicCircleSvg
                      primaryColor={altarPreviewStyle.hex}
                      secondaryColor={altarPreviewStyle.hexSecondary}
                      fast={hoveredPull !== null}
                      className="w-44 h-44 sm:w-52 sm:h-52 transition-all duration-300"
                    />
                    <div className="absolute flex flex-col items-center text-center pointer-events-none">
                      <Wand2
                        style={{ color: altarPreviewStyle.hex }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 ${
                          hoveredPull !== null ? "scale-125" : ""
                        }`}
                      />
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-white mt-1.5">
                        {pity >= 70 ? "High Resonance" : "Astral Conduit"}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {pullsUntilGuaranteedFiveStar} pulls to 5★ Lock
                      </span>
                    </div>
                  </div>
                </div>

                {/* SPELLCAST ACTION BUTTONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                  <button
                    type="button"
                    disabled={!inLobby || shards < SUMMON_COST || isSendingTurn}
                    onMouseEnter={() => setHoveredPull(1)}
                    onMouseLeave={() => setHoveredPull(null)}
                    onClick={() => handlePull(1)}
                    className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/85 to-cyan-900/75 hover:from-indigo-800 hover:to-cyan-800 disabled:from-zinc-900 disabled:to-zinc-900 border border-cyan-400/50 disabled:border-white/10 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between group shadow-lg active:scale-[0.98]"
                  >
                    <div>
                      <span className="text-sm font-black font-mono text-white block group-hover:text-cyan-200">
                        ✦ Single Invocation (1x Pull)
                      </span>
                      <span className="text-[11px] font-mono text-cyan-200/80">
                        Channel 1 Celestial Hero or Echo
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-black/55 border border-cyan-400/40 font-mono text-xs font-black text-cyan-300 shrink-0">
                      💠 {SUMMON_COST}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={!inLobby || shards < SUMMON_TEN_COST || isSendingTurn}
                    onMouseEnter={() => setHoveredPull(10)}
                    onMouseLeave={() => setHoveredPull(null)}
                    onClick={() => handlePull(10)}
                    className="p-4 rounded-2xl bg-gradient-to-r from-amber-600/85 via-rose-700/80 to-purple-800/85 hover:from-amber-500 hover:via-rose-600 hover:to-purple-700 disabled:from-zinc-900 disabled:to-zinc-900 border border-amber-300/70 disabled:border-white/10 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-between group shadow-[0_0_28px_rgba(251,191,36,0.28)] active:scale-[0.98]"
                  >
                    <div>
                      <span className="text-sm font-black font-mono text-white block group-hover:text-amber-100">
                        ✦ Grand Constellation (10x Pull)
                      </span>
                      <span className="text-[11px] font-mono text-amber-100/90">
                        10 Enchanted Tarot Cards • Cascade Flip Reveal
                      </span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-black/55 border border-amber-300/60 font-mono text-xs font-black text-amber-200 shrink-0">
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
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/characters/default.png";
                    }}
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

              {/* SUMMON REVEAL RESULTS (3D ARCANE TAROT CARD FLIP + CASCADE REVEAL) */}
              {lastResults.length > 0 && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Star Gate Manifestation ({lastResults.length} Card
                      {lastResults.length > 1 ? "s" : ""})
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      {!allCardsRevealed && (
                        <>
                          <button
                            type="button"
                            disabled={isCascadingReveal}
                            onClick={handleCascadeReveal}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 border border-purple-300/60 text-white font-mono text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-amber-200" />
                            <span>{isCascadingReveal ? "Unsealing..." : "Cascade Reveal"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRevealAll}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-300/60 text-amber-100 font-mono text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-300" />
                            <span>Reveal All</span>
                          </button>
                        </>
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
                            className={`h-64 rounded-2xl bg-gradient-to-b ${style.cardBack} border p-3 flex flex-col items-center justify-center gap-3 cursor-pointer hover:scale-[1.04] hover:-translate-y-1 transition-all group relative overflow-hidden`}
                          >
                            {/* Spinning Arcane Sigil Card Back */}
                            <ArcaneMagicCircleSvg
                              primaryColor={style.hex}
                              secondaryColor={style.hexSecondary}
                              fast={res.starRank >= 4}
                              className="w-32 h-32 opacity-75 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                              <Sparkles
                                className={`w-6 h-6 ${style.stars} ${
                                  res.starRank >= 4 ? "animate-pulse" : ""
                                }`}
                              />
                              <span className={`font-mono text-sm font-black tracking-widest ${style.stars}`}>
                                {"★".repeat(res.starRank)}
                              </span>
                            </div>
                            <span className="mt-auto text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-200 group-hover:text-white bg-black/50 px-2.5 py-0.5 rounded-full border border-white/10">
                              Tap to Unseal
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={res.pullNumber}
                          onClick={() => {
                            soundEffects.playClick();
                            setSpotlightQuoteResult(res);
                          }}
                          style={{
                            animation: "starfallCardUnseal 0.42s cubic-bezier(0.22,1,0.36,1) forwards",
                          }}
                          className={`rounded-2xl bg-gradient-to-b ${style.bg} border ${style.border} p-3 flex flex-col justify-between gap-2 relative overflow-hidden cursor-pointer hover:brightness-110 transition-all`}
                        >
                          {/* Subtle Holo Sheen for 4★ / 5★ */}
                          {res.starRank >= 4 && (
                            <div
                              style={{
                                background: `radial-gradient(circle at 50% 18%, ${style.hex}33, transparent 70%)`,
                              }}
                              className="absolute inset-0 pointer-events-none"
                            />
                          )}

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

                          <div className="relative h-36 w-full flex items-end justify-center overflow-hidden rounded-xl bg-black/50 border border-white/10">
                            <img
                              src={resolvePortrait(res.heroineName, res.spriteSlug)}
                              alt={res.heroineName}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = "/characters/default.png";
                              }}
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

                  {/* CONVENIENT CHAIN-PULL ACTION BAR */}
                  {allCardsRevealed && inLobby && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-white/10 font-mono">
                      <span className="text-[11px] text-zinc-400 mr-auto">
                        💠 {shards.toLocaleString()} Shards Remaining • Pity {pity}/{PITY_THRESHOLD}
                      </span>
                      <button
                        type="button"
                        disabled={shards < SUMMON_COST || isSendingTurn}
                        onClick={() => handlePull(1)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600/35 hover:bg-indigo-600/55 border border-cyan-400/50 text-xs font-black text-cyan-100 cursor-pointer disabled:opacity-45"
                      >
                        Pull 1x Again ({SUMMON_COST} 💠)
                      </button>
                      <button
                        type="button"
                        disabled={shards < SUMMON_TEN_COST || isSendingTurn}
                        onClick={() => handlePull(10)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/80 to-rose-700/80 hover:from-amber-500 hover:to-rose-600 border border-amber-300/60 text-xs font-black text-white cursor-pointer disabled:opacity-45"
                      >
                        Pull 10x Again ({SUMMON_TEN_COST} 💠)
                      </button>
                    </div>
                  )}
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
