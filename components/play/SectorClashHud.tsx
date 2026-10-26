"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Swords,
  Flame,
  Snowflake,
  Zap,
  Moon,
  Orbit,
  Shield,
  Sparkles,
  Heart,
  Wand2,
  Eye,
  Footprints,
  AlertTriangle,
  RefreshCw,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { ActiveStoryClashState, CombatStanceType, AbilityDetail } from "@/types/story";
import { getStoryClashChoices } from "@/lib/storyClashEngine";
import { soundEffects } from "@/lib/audioEngine";
import { getClassStanceConfig } from "@/lib/progressionMechanics";

export interface ClashCombatPopup {
  id: string;
  text: string;
  subtext?: string;
  colorClass: string;
}

export interface ClashVisualHitEvent {
  id: number;
  damageDealt: number;
  enemyDamageTaken: number;
  hpHealed: number;
  isCrit: boolean;
  isStaggered: boolean;
  isEvaded: boolean;
}

interface SectorClashHudProps {
  activeClash: ActiveStoryClashState;
  playerName?: string;
  playerRole: string;
  playerHp?: number;
  playerMaxHp?: number;
  playerMp: number;
  playerMaxMp?: number;
  activeStance: CombatStanceType;
  onSelectStance: (stance: CombatStanceType) => void;
  assistingCompanion?: { name: string; role?: string } | null;
  isLoading: boolean;
  isExecutingClashAction: boolean;
  onExecuteClashAction: (actionType: "strike" | "burst" | "synergy" | "defense" | "flee") => void;
  onGenerateEnemyImage?: (customPrompt?: string) => void;
  isGeneratingEnemyImage?: boolean;
  combatPopups?: ClashCombatPopup[];
  lastHitEvent?: ClashVisualHitEvent | null;
  playerAbilities?: string[];
  abilityDetails?: Record<string, AbilityDetail>;
}

export function SectorClashHud({
  activeClash,
  playerName = "Protagonist",
  playerRole,
  playerHp = 100,
  playerMaxHp = 100,
  playerMp,
  playerMaxMp = 60,
  activeStance,
  onSelectStance,
  assistingCompanion,
  isLoading,
  isExecutingClashAction,
  onExecuteClashAction,
  onGenerateEnemyImage,
  isGeneratingEnemyImage = false,
  combatPopups = [],
  lastHitEvent = null,
  playerAbilities,
  abilityDetails,
}: SectorClashHudProps) {
  const enemyHpPercent = Math.max(
    0,
    Math.min(100, (activeClash.enemyHp / Math.max(1, activeClash.enemyMaxHp)) * 100)
  );
  const [ghostEnemyHpPercent, setGhostEnemyHpPercent] = useState(enemyHpPercent);
  const prevEnemyHpRef = useRef(enemyHpPercent);

  const playerHpPercent = Math.max(
    0,
    Math.min(100, (playerHp / Math.max(1, playerMaxHp)) * 100)
  );
  const [ghostPlayerHpPercent, setGhostPlayerHpPercent] = useState(playerHpPercent);
  const prevPlayerHpRef = useRef(playerHpPercent);

  const playerMpPercent = Math.max(
    0,
    Math.min(100, (playerMp / Math.max(1, playerMaxMp)) * 100)
  );

  // Visual impact states for dealing and taking damage
  const [enemyHitFlash, setEnemyHitFlash] = useState(false);
  const [playerHitFlash, setPlayerHitFlash] = useState<"damage" | "heal" | "evade" | null>(null);
  const [showEnemyLightbox, setShowEnemyLightbox] = useState(false);
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false);
  const [customEnemyPrompt, setCustomEnemyPrompt] = useState(
    activeClash.enemyVisualPrompt || activeClash.enemyDesc || ""
  );

  useEffect(() => {
    if (!showEnemyLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        soundEffects.playClick();
        setShowEnemyLightbox(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEnemyLightbox]);

  useEffect(() => {
    if (enemyHpPercent < prevEnemyHpRef.current) {
      setEnemyHitFlash(true);
      const flashTimer = setTimeout(() => setEnemyHitFlash(false), 650);
      const ghostTimer = setTimeout(() => {
        setGhostEnemyHpPercent(enemyHpPercent);
      }, 500);
      prevEnemyHpRef.current = enemyHpPercent;
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(ghostTimer);
      };
    } else {
      setGhostEnemyHpPercent(enemyHpPercent);
      prevEnemyHpRef.current = enemyHpPercent;
    }
  }, [enemyHpPercent]);

  useEffect(() => {
    if (playerHpPercent < prevPlayerHpRef.current) {
      setPlayerHitFlash("damage");
      const flashTimer = setTimeout(() => setPlayerHitFlash(null), 700);
      const ghostTimer = setTimeout(() => {
        setGhostPlayerHpPercent(playerHpPercent);
      }, 500);
      prevPlayerHpRef.current = playerHpPercent;
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(ghostTimer);
      };
    } else if (playerHpPercent > prevPlayerHpRef.current) {
      setPlayerHitFlash("heal");
      setGhostPlayerHpPercent(playerHpPercent);
      prevPlayerHpRef.current = playerHpPercent;
      const flashTimer = setTimeout(() => setPlayerHitFlash(null), 700);
      return () => clearTimeout(flashTimer);
    } else {
      setGhostPlayerHpPercent(playerHpPercent);
      prevPlayerHpRef.current = playerHpPercent;
    }
  }, [playerHpPercent]);

  useEffect(() => {
    if (!lastHitEvent) return;
    if (lastHitEvent.damageDealt > 0) {
      setEnemyHitFlash(true);
      setTimeout(() => setEnemyHitFlash(false), 650);
    }
    if (lastHitEvent.enemyDamageTaken > 0) {
      setPlayerHitFlash("damage");
      setTimeout(() => setPlayerHitFlash(null), 700);
    } else if (lastHitEvent.isEvaded) {
      setPlayerHitFlash("evade");
      setTimeout(() => setPlayerHitFlash(null), 700);
    } else if (lastHitEvent.hpHealed > 0) {
      setPlayerHitFlash("heal");
      setTimeout(() => setPlayerHitFlash(null), 700);
    }
  }, [lastHitEvent]);

  const stanceConfigMap = useMemo(() => getClassStanceConfig(playerRole), [playerRole]);
  const stanceList = useMemo<{
    id: CombatStanceType;
    label: string;
    bonusText: string;
    icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
  }[]>(() => [
    {
      id: "neutral" as CombatStanceType,
      label: stanceConfigMap.neutral.label,
      bonusText: stanceConfigMap.neutral.bonusText,
      icon: Shield,
      activeClass: stanceConfigMap.neutral.activeClass,
    },
    {
      id: "flame" as CombatStanceType,
      label: stanceConfigMap.flame.label,
      bonusText: stanceConfigMap.flame.bonusText,
      icon: Flame,
      activeClass: stanceConfigMap.flame.activeClass,
    },
    {
      id: "frost" as CombatStanceType,
      label: stanceConfigMap.frost.label,
      bonusText: stanceConfigMap.frost.bonusText,
      icon: Snowflake,
      activeClass: stanceConfigMap.frost.activeClass,
    },
    {
      id: "phase" as CombatStanceType,
      label: stanceConfigMap.phase.label,
      bonusText: stanceConfigMap.phase.bonusText,
      icon: Zap,
      activeClass: stanceConfigMap.phase.activeClass,
    },
    {
      id: "shadow" as CombatStanceType,
      label: stanceConfigMap.shadow.label,
      bonusText: stanceConfigMap.shadow.bonusText,
      icon: Moon,
      activeClass: stanceConfigMap.shadow.activeClass,
    },
    {
      id: "graviton" as CombatStanceType,
      label: stanceConfigMap.graviton.label,
      bonusText: stanceConfigMap.graviton.bonusText,
      icon: Orbit,
      activeClass: stanceConfigMap.graviton.activeClass,
    },
  ], [stanceConfigMap]);

  const choices = getStoryClashChoices(
    playerRole || "Voidstrider",
    assistingCompanion || undefined,
    playerMp,
    activeStance,
    playerAbilities,
    abilityDetails
  );

  const currentStanceMeta =
    stanceList.find((s) => s.id === activeStance) || stanceList[0];

  const rankBadgeColor =
    activeClash.threatRank === "S" || activeClash.threatRank === "Calamity"
      ? "bg-purple-950/90 border-purple-400 text-purple-200"
      : activeClash.threatRank === "A"
      ? "bg-rose-950/90 border-rose-400 text-rose-200"
      : activeClash.threatRank === "B"
      ? "bg-amber-950/90 border-amber-400 text-amber-200"
      : "bg-red-950/80 border-red-500/40 text-red-200";

  return (
    <>
      <div
        className={`relative pointer-events-auto bg-gradient-to-b from-zinc-900/95 via-black/95 to-zinc-950/95 border rounded-2xl p-3 sm:p-4 backdrop-blur-xl mb-2 select-none overflow-hidden max-h-[52dvh] sm:max-h-none overflow-y-auto transition-all duration-200 ${
          playerHitFlash === "damage"
            ? "border-red-500 shadow-[0_0_45px_rgba(239,68,68,0.55)] translate-x-[2px]"
            : enemyHitFlash
            ? "border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.35)]"
            : "border-red-500/45 shadow-[0_0_35px_rgba(239,68,68,0.22)]"
        }`}
      >
        {/* Top Crimson/Amber Hit Flash Overlay when Dealing or Taking Damage */}
        {playerHitFlash === "damage" && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-red-600/25 via-transparent to-red-600/25 animate-pulse z-20" />
        )}
        {enemyHitFlash && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-rose-500/15 z-20" />
        )}

        {/* Floating Combat Popups */}
        {combatPopups.length > 0 && (
          <div className="pointer-events-none absolute top-2.5 right-4 z-30 flex flex-col items-end gap-1.5">
            {combatPopups.map((popup) => (
              <div
                key={popup.id}
                className={`px-3 py-1 rounded-xl bg-black/95 border font-mono text-xs font-black tracking-wider shadow-2xl animate-bounce ${popup.colorClass}`}
              >
                <span>{popup.text}</span>
                {popup.subtext && (
                  <span className="ml-1.5 text-[10px] font-normal opacity-90">
                    ({popup.subtext})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ENCOUNTER TOP HEADER: ENEMY PORTRAIT + VITALS + PLAYER VITALS */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3 border-b border-red-500/20 pb-3 mb-2.5">
          {/* Left: Enemy Portrait & AI Art Generator Card */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border bg-zinc-950 shrink-0 group transition-transform duration-150 ${
                enemyHitFlash
                  ? "border-amber-400 scale-95 ring-2 ring-amber-400/60"
                  : "border-red-500/40 hover:border-red-400"
              }`}
            >
              {activeClash.enemyImageUrl ? (
                <img
                  src={activeClash.enemyImageUrl}
                  alt={activeClash.enemyName}
                  onClick={() => setShowEnemyLightbox(true)}
                  className={`w-full h-full object-cover cursor-pointer transition-all duration-200 ${
                    enemyHitFlash ? "brightness-150 contrast-125 saturate-150" : "group-hover:scale-105"
                  }`}
                />
              ) : (
                <div
                  onClick={() => setShowEnemyLightbox(true)}
                  className="w-full h-full flex flex-col items-center justify-center text-red-400/70 cursor-pointer"
                >
                  <Swords className="w-6 h-6" />
                </div>
              )}

              {/* Slash Impact Overlay on Enemy Portrait when Dealt Damage */}
              {enemyHitFlash && lastHitEvent && lastHitEvent.damageDealt > 0 && (
                <div className="pointer-events-none absolute inset-0 bg-red-600/45 flex flex-col items-center justify-center animate-in zoom-in-75 duration-150">
                  <span className="font-mono text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                    -{lastHitEvent.damageDealt}
                  </span>
                  {lastHitEvent.isCrit && (
                    <span className="text-[9px] font-mono font-black text-amber-300 uppercase">
                      CRIT!
                    </span>
                  )}
                </div>
              )}

              {/* Loading Spinner During Enemy Portrait Synthesis */}
              {isGeneratingEnemyImage && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-amber-300">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-[8px] font-mono uppercase tracking-tighter">
                    Forging...
                  </span>
                </div>
              )}

              {/* Quick Inspect / Expand Button */}
              <button
                type="button"
                onClick={() => setShowEnemyLightbox(true)}
                className="absolute bottom-1 right-1 p-1 rounded-md bg-black/75 text-zinc-300 hover:text-white border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Inspect Enemy Portrait & Dossier"
              >
                <Eye className="w-3 h-3" />
              </button>
            </div>

            {/* Enemy Info, HP Bar & Intent Telegraph */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${rankBadgeColor}`}
                  >
                    Rank {activeClash.threatRank || "C"}
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-red-100 truncate">
                    {activeClash.enemyName}
                  </span>
                  {activeClash.enemyArchetype && (
                    <span className="hidden sm:inline text-[10px] font-mono text-zinc-400 truncate">
                      • {activeClash.enemyArchetype}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-red-300">
                    Turn {activeClash.clashTurn}/{activeClash.maxClashTurns || 6}
                  </span>
                  {onGenerateEnemyImage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isGeneratingEnemyImage}
                        onClick={() => {
                          soundEffects.playClick();
                          onGenerateEnemyImage(customEnemyPrompt || undefined);
                        }}
                        className="px-2 py-0.5 rounded-md bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-200 text-[10px] font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        title="Generate AI Portrait for this Enemy"
                      >
                        <Wand2 className="w-2.5 h-2.5 text-amber-400" />
                        <span className="hidden sm:inline">
                          {isGeneratingEnemyImage ? "Generating..." : "Enemy Art"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomPromptInput((prev) => !prev)}
                        className={`p-1 rounded-md border text-[10px] transition-colors cursor-pointer ${
                          showCustomPromptInput
                            ? "bg-amber-500/20 border-amber-400 text-amber-200"
                            : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white"
                        }`}
                        title="Customize Enemy Visual Prompt"
                      >
                        <SlidersHorizontal className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Enemy HP Bar with Delayed Ghost Depletion */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400 truncate max-w-[65%]">
                    {activeClash.enemyDesc || activeClash.tacticalObjective}
                  </span>
                  <span className="text-red-300 font-bold shrink-0">
                    {activeClash.enemyHp} / {activeClash.enemyMaxHp} HP ({Math.round(enemyHpPercent)}%)
                  </span>
                </div>
                <div className="relative w-full bg-zinc-900/90 rounded-full h-2.5 overflow-hidden border border-red-950/80">
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-200/70 transition-all duration-500 ease-out"
                    style={{ width: `${ghostEnemyHpPercent}%` }}
                  />
                  <div
                    className={`relative h-full transition-all duration-200 ${
                      enemyHitFlash
                        ? "bg-gradient-to-r from-amber-300 via-white to-amber-300"
                        : "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"
                    }`}
                    style={{ width: `${enemyHpPercent}%` }}
                  />
                </div>
              </div>

              {/* Telegraphed Enemy Intent Row */}
              {activeClash.enemyIntent && (
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 px-2 py-1 rounded-lg bg-red-950/35 border border-red-500/25 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-red-200">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="font-bold">
                      Intent: {activeClash.enemyIntent.label} (~{activeClash.enemyIntent.estimatedDamage} DMG)
                    </span>
                  </div>
                  <span className="text-amber-300/90 text-[9px] truncate">
                    {activeClash.enemyIntent.counterStanceHint}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Player Vitals Telemetry Card (HP & MP with Hit Feedback) */}
          <div
            className={`lg:w-64 shrink-0 rounded-xl p-2.5 border transition-all duration-200 flex flex-col justify-between ${
              playerHitFlash === "damage"
                ? "bg-red-950/60 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.45)]"
                : playerHitFlash === "heal"
                ? "bg-emerald-950/50 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                : playerHitFlash === "evade"
                ? "bg-violet-950/50 border-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.35)]"
                : "bg-black/65 border-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-zinc-200 truncate">
                {playerName} • {playerRole}
              </span>
              {playerHitFlash === "damage" && lastHitEvent?.enemyDamageTaken ? (
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-red-600 text-white animate-bounce">
                  -{lastHitEvent.enemyDamageTaken} HP
                </span>
              ) : playerHitFlash === "heal" && lastHitEvent?.hpHealed ? (
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white animate-bounce">
                  +{lastHitEvent.hpHealed} HP
                </span>
              ) : playerHitFlash === "evade" ? (
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-violet-600 text-white">
                  EVADED!
                </span>
              ) : activeClash.companionAssistingName ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-rose-400" />
                  {activeClash.companionAssistingName}
                </span>
              ) : null}
            </div>

            {/* Player HP Bar */}
            <div className="space-y-1 mb-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-300 flex items-center gap-1 font-semibold">
                  <Heart className="w-2.5 h-2.5 text-emerald-400" /> VITALS (HP)
                </span>
                <span
                  className={`font-bold ${
                    playerHpPercent <= 35 ? "text-red-400 animate-pulse" : "text-emerald-300"
                  }`}
                >
                  {playerHp} / {playerMaxHp}
                </span>
              </div>
              <div className="relative w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="absolute inset-y-0 left-0 bg-red-400/70 transition-all duration-500 ease-out"
                  style={{ width: `${ghostPlayerHpPercent}%` }}
                />
                <div
                  className={`relative h-full transition-all duration-200 ${
                    playerHpPercent <= 30
                      ? "bg-gradient-to-r from-red-600 to-rose-500"
                      : "bg-gradient-to-r from-emerald-600 to-teal-400"
                  }`}
                  style={{ width: `${playerHpPercent}%` }}
                />
              </div>
            </div>

            {/* Player MP Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-sky-300 flex items-center gap-1 font-semibold">
                  <Zap className="w-2.5 h-2.5 text-sky-400" /> MANA (MP)
                </span>
                <span className="text-sky-300 font-bold">
                  {playerMp} / {playerMaxMp}
                </span>
              </div>
              <div className="relative w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-sky-600 to-cyan-400 h-full transition-all duration-200"
                  style={{ width: `${playerMpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Custom Enemy Prompt Bar */}
        {showCustomPromptInput && onGenerateEnemyImage && (
          <div className="mb-2.5 p-2 rounded-xl bg-black/80 border border-amber-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in duration-150">
            <input
              type="text"
              value={customEnemyPrompt}
              onChange={(e) => setCustomEnemyPrompt(e.target.value)}
              placeholder="Describe enemy appearance for AI portrait synthesis..."
              className="flex-1 bg-zinc-900/90 border border-white/15 rounded-lg px-2.5 py-1.5 text-base sm:text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              disabled={isGeneratingEnemyImage}
              onClick={() => {
                soundEffects.playClick();
                onGenerateEnemyImage(customEnemyPrompt);
                setShowCustomPromptInput(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Synthesize Enemy Art</span>
            </button>
          </div>
        )}

        {/* Universal 6-Stance Matrix Selector */}
        <div className="mb-2.5 bg-black/60 border border-white/10 rounded-xl p-2">
          <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Universal Combat Stance Matrix
            </span>
            <span className="text-[10px] font-mono text-amber-300 font-semibold">
              {currentStanceMeta.label}: {currentStanceMeta.bonusText}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {stanceList.map((stance) => {
              const Icon = stance.icon;
              const isSelected = activeStance === stance.id;
              return (
                <button
                  key={stance.id}
                  type="button"
                  disabled={isLoading || isExecutingClashAction}
                  onClick={() => {
                    soundEffects.playClick();
                    onSelectStance(stance.id);
                  }}
                  className={`px-2 py-1.5 min-h-[36px] rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? stance.activeClass
                      : "bg-zinc-950/80 hover:bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200"
                  }`}
                  title={`${stance.label} Stance (${stance.bonusText})`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{stance.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Stance-Infused Tactical Clash Actions + Disengage Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 mb-2">
          {choices.map((clashChoice, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading || isExecutingClashAction || clashChoice.disabled}
              onClick={() => onExecuteClashAction(clashChoice.actionType)}
              className={`group p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                clashChoice.disabled
                  ? "bg-zinc-950/40 border-white/5 opacity-40 cursor-not-allowed"
                  : "bg-zinc-900/90 hover:bg-zinc-800 border-red-500/30 hover:border-red-400 shadow-md active:scale-[0.99]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-red-200 group-hover:text-white">
                  {clashChoice.actionName}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {clashChoice.mpCost > 0 ? `-${clashChoice.mpCost} MP` : "0 MP"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 group-hover:text-zinc-100 line-clamp-2">
                {clashChoice.label}
              </p>
            </button>
          ))}
        </div>

        {/* Combat Telemetry Log & Tactical Disengage Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/10 text-[10px] font-mono text-zinc-400">
          <span className="truncate max-w-[70%] text-zinc-400">
            {activeClash.log?.[activeClash.log.length - 1] || activeClash.tacticalObjective}
          </span>
          <button
            type="button"
            disabled={isLoading || isExecutingClashAction}
            onClick={() => {
              soundEffects.playClick();
              onExecuteClashAction("flee");
            }}
            className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/15 hover:border-amber-400/50 text-zinc-300 hover:text-amber-200 flex items-center gap-1 transition-all cursor-pointer shrink-0"
            title="Break combat engagement and retreat to cover (-10 MP or grazing hit)"
          >
            <Footprints className="w-3 h-3 text-amber-400" />
            <span>Break & Disengage</span>
          </button>
        </div>
      </div>

      {/* ENEMY PORTRAIT & TACTICAL DOSSIER LIGHTBOX MODAL */}
      {showEnemyLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto select-none"
          onClick={() => {
            soundEffects.playClick();
            setShowEnemyLightbox(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-zinc-950 border border-red-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-72 w-full bg-black">
              {activeClash.enemyImageUrl && (
                <img
                  src={activeClash.enemyImageUrl}
                  alt={activeClash.enemyName}
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40 pointer-events-none" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEffects.playClick();
                  setShowEnemyLightbox(false);
                }}
                className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 pointer-events-auto"
                title="Close Tactical Dossier (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                <div>
                  <span
                    className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border uppercase ${rankBadgeColor}`}
                  >
                    Threat Rank {activeClash.threatRank || "C"} • {activeClash.enemyArchetype || "Hostile"}
                  </span>
                  <h3 className="text-lg font-bold text-white font-mono mt-1">
                    {activeClash.enemyName}
                  </h3>
                </div>
                {onGenerateEnemyImage && (
                  <button
                    type="button"
                    disabled={isGeneratingEnemyImage}
                    onClick={() => {
                      soundEffects.playClick();
                      onGenerateEnemyImage(customEnemyPrompt || undefined);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isGeneratingEnemyImage ? "Synthesizing..." : "Re-Forge AI Portrait"}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs font-mono">
              <p className="text-zinc-300 font-sans leading-relaxed">
                {activeClash.enemyDesc}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/10">
                  <span className="text-zinc-500 block">Vital Integrity</span>
                  <span className="text-red-300 font-bold">
                    {activeClash.enemyHp} / {activeClash.enemyMaxHp} HP
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/80 border border-white/10">
                  <span className="text-zinc-500 block">Attack Power</span>
                  <span className="text-amber-300 font-bold">
                    ~{activeClash.enemyAttackPower || 16} DMG / Round
                  </span>
                </div>
              </div>
              {activeClash.log && activeClash.log.length > 0 && (
                <div className="p-2.5 rounded-xl bg-black/70 border border-white/10 max-h-28 overflow-y-auto space-y-1 text-[10px] text-zinc-400">
                  {activeClash.log.map((entry, idx) => (
                    <div key={idx}>{entry}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
