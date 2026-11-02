"use client";
/* eslint-disable @next/next/no-img-element */

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
  ChevronDown,
  ChevronUp,
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
  const prevPlayerHpRef = useRef(playerHpPercent);

  const playerMpPercent = Math.max(
    0,
    Math.min(100, (playerMp / Math.max(1, playerMaxMp)) * 100)
  );

  const [enemyDamagedFlash, setEnemyDamagedFlash] = useState(false);
  const [playerDamagedFlash, setPlayerDamagedFlash] = useState(false);
  const [playerHealedFlash, setPlayerHealedFlash] = useState(false);
  const [showPortraitLightbox, setShowPortraitLightbox] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [customEnemyPromptDraft, setCustomEnemyPromptDraft] = useState<string | null>(null);
  const customEnemyPrompt = customEnemyPromptDraft ?? (activeClash.enemyVisualPrompt || "");
  const setCustomEnemyPrompt = (val: string) => setCustomEnemyPromptDraft(val);

  useEffect(() => {
    if (enemyHpPercent < prevEnemyHpRef.current) {
      const startFlashTimer = setTimeout(() => setEnemyDamagedFlash(true), 0);
      const flashTimer = setTimeout(() => setEnemyDamagedFlash(false), 450);
      const ghostTimer = setTimeout(() => setGhostEnemyHpPercent(enemyHpPercent), 550);
      prevEnemyHpRef.current = enemyHpPercent;
      return () => {
        clearTimeout(startFlashTimer);
        clearTimeout(flashTimer);
        clearTimeout(ghostTimer);
      };
    } else {
      const syncGhostTimer = setTimeout(() => setGhostEnemyHpPercent(enemyHpPercent), 0);
      prevEnemyHpRef.current = enemyHpPercent;
      return () => clearTimeout(syncGhostTimer);
    }
  }, [enemyHpPercent]);

  useEffect(() => {
    if (playerHpPercent < prevPlayerHpRef.current) {
      const startFlashTimer = setTimeout(() => setPlayerDamagedFlash(true), 0);
      const flashTimer = setTimeout(() => setPlayerDamagedFlash(false), 550);
      prevPlayerHpRef.current = playerHpPercent;
      return () => {
        clearTimeout(startFlashTimer);
        clearTimeout(flashTimer);
      };
    } else if (playerHpPercent > prevPlayerHpRef.current) {
      const startHealTimer = setTimeout(() => setPlayerHealedFlash(true), 0);
      const healTimer = setTimeout(() => setPlayerHealedFlash(false), 600);
      prevPlayerHpRef.current = playerHpPercent;
      return () => {
        clearTimeout(startHealTimer);
        clearTimeout(healTimer);
      };
    } else {
      prevPlayerHpRef.current = playerHpPercent;
    }
  }, [playerHpPercent]);

  const clashChoices = getStoryClashChoices(
    playerRole,
    assistingCompanion,
    playerMp,
    activeStance,
    playerAbilities,
    abilityDetails
  );

  const classStances = useMemo(() => getClassStanceConfig(playerRole), [playerRole]);

  const stanceButtons: {
    id: CombatStanceType;
    label: string;
    shortLabel: string;
    bonusHint: string;
    bonusText: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      id: "neutral",
      label: classStances.neutral.label,
      shortLabel: classStances.neutral.label.split(" ")[0],
      bonusHint: classStances.neutral.bonusHint,
      bonusText: classStances.neutral.bonusText,
      icon: <Shield className="w-2.5 h-2.5" />,
      activeClass: "bg-zinc-800 border-white/40 text-white",
    },
    {
      id: "flame",
      label: classStances.flame.label,
      shortLabel: classStances.flame.label.split(" ")[0],
      bonusHint: classStances.flame.bonusHint,
      bonusText: classStances.flame.bonusText,
      icon: <Flame className="w-2.5 h-2.5 text-orange-400" />,
      activeClass: "bg-orange-950/90 border-orange-500 text-orange-200",
    },
    {
      id: "frost",
      label: classStances.frost.label,
      shortLabel: classStances.frost.label.split(" ")[0],
      bonusHint: classStances.frost.bonusHint,
      bonusText: classStances.frost.bonusText,
      icon: <Snowflake className="w-2.5 h-2.5 text-cyan-400" />,
      activeClass: "bg-cyan-950/90 border-cyan-400 text-cyan-200",
    },
    {
      id: "shadow",
      label: classStances.shadow.label,
      shortLabel: classStances.shadow.label.split(" ")[0],
      bonusHint: classStances.shadow.bonusHint,
      bonusText: classStances.shadow.bonusText,
      icon: <Moon className="w-2.5 h-2.5 text-purple-400" />,
      activeClass: "bg-purple-950/90 border-purple-500 text-purple-200",
    },
    {
      id: "graviton",
      label: classStances.graviton.label,
      shortLabel: classStances.graviton.label.split(" ")[0],
      bonusHint: classStances.graviton.bonusHint,
      bonusText: classStances.graviton.bonusText,
      icon: <Orbit className="w-2.5 h-2.5 text-amber-400" />,
      activeClass: "bg-amber-950/90 border-amber-500 text-amber-200",
    },
    {
      id: "phase",
      label: classStances.phase.label,
      shortLabel: classStances.phase.label.split(" ")[0],
      bonusHint: classStances.phase.bonusHint,
      bonusText: classStances.phase.bonusText,
      icon: <Zap className="w-2.5 h-2.5 text-emerald-400" />,
      activeClass: "bg-emerald-950/90 border-emerald-500 text-emerald-200",
    },
  ];

  const activeStanceInfo = stanceButtons.find((s) => s.id === activeStance) || stanceButtons[0];
  const threatRank = activeClash.threatRank || "B";
  const rankBadgeStyle =
    threatRank === "S" || threatRank === "Calamity"
      ? "bg-red-950/90 border-red-500 text-red-200"
      : threatRank === "A"
      ? "bg-rose-950/90 border-rose-500/70 text-rose-200"
      : "bg-amber-950/80 border-amber-500/60 text-amber-200";

  return (
    <div
      className={`shrink-0 mx-2 sm:mx-4 mb-1.5 rounded-xl bg-gradient-to-r from-red-950/95 via-zinc-950/95 to-rose-950/95 border px-2.5 py-1.5 shadow-[0_0_20px_rgba(244,63,94,0.22)] relative overflow-hidden transition-all duration-200 ${
        playerDamagedFlash
          ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.65)]"
          : enemyDamagedFlash
          ? "border-amber-400/90 shadow-[0_0_25px_rgba(251,191,36,0.45)]"
          : "border-rose-500/45"
      }`}
    >
      {/* Floating Combat Popups */}
      {combatPopups.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-1 z-30 flex flex-col items-center gap-0.5">
          {combatPopups.map((p) => (
            <div
              key={p.id}
              className={`px-2.5 py-0.5 rounded-lg border backdrop-blur-md font-mono text-[10px] font-black tracking-wide shadow-lg animate-bounce ${p.colorClass}`}
            >
              <span>{p.text}</span>
              {p.subtext && <span className="ml-1.5 text-[9px] font-normal opacity-90">{p.subtext}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Enemy Portrait Lightbox Modal */}
      {showPortraitLightbox && activeClash.enemyImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowPortraitLightbox(false)}
        >
          <div
            className="relative max-w-md w-full bg-zinc-950 border border-rose-500/50 rounded-2xl p-3 shadow-2xl space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  {activeClash.enemyName}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${rankBadgeStyle}`}>
                  Rank {threatRank}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPortraitLightbox(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-white/5 cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              <img
                src={activeClash.enemyImageUrl}
                alt={activeClash.enemyName}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-[11px] font-mono text-zinc-300 leading-relaxed">
              {activeClash.enemyDesc || activeClash.tacticalObjective}
            </p>
          </div>
        </div>
      )}

      {/* Enemy Portrait Prompt Editor Modal */}
      {showPromptEditor && onGenerateEnemyImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowPromptEditor(false)}
        >
          <div
            className="relative max-w-lg w-full bg-zinc-950 border border-rose-500/50 rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Synthesize Enemy Portrait: {activeClash.enemyName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptEditor(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={customEnemyPrompt}
              onChange={(e) => setCustomEnemyPrompt(e.target.value)}
              placeholder={`Describe ${activeClash.enemyName}'s appearance...`}
              className="w-full rounded-xl bg-zinc-900 border border-white/15 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPromptEditor(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isGeneratingEnemyImage}
                onClick={() => {
                  soundEffects.playClick();
                  onGenerateEnemyImage(customEnemyPrompt.trim() || undefined);
                  setShowPromptEditor(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-[11px] font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render Portrait</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROW 1: COMPACT UNIFIED TELEMETRY (ENEMY + INTENT + PLAYER VITALS + CONTROLS) */}
      <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
        {/* Left: Compact Enemy Thumbnail + Name + Enemy HP Bar */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative shrink-0 group">
            <div
              onClick={() => activeClash.enemyImageUrl && setShowPortraitLightbox(true)}
              className={`w-9 h-9 rounded-lg overflow-hidden border bg-zinc-900 cursor-pointer relative shadow-md transition-transform ${
                enemyDamagedFlash ? "border-amber-300 scale-95" : "border-rose-500/60 hover:border-rose-400"
              }`}
              title="Click to inspect adversary portrait"
            >
              {activeClash.enemyImageUrl ? (
                <img
                  src={activeClash.enemyImageUrl}
                  alt={activeClash.enemyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Swords className="w-4 h-4 text-rose-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-3 h-3 text-white" />
              </div>
            </div>
            {onGenerateEnemyImage && (
              <button
                type="button"
                disabled={isGeneratingEnemyImage}
                onClick={() => {
                  soundEffects.playClick();
                  onGenerateEnemyImage(customEnemyPrompt.trim() || undefined);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowPromptEditor(true);
                }}
                title="Generate AI Boss Portrait (Right-click to edit prompt)"
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-700 hover:bg-rose-500 border border-rose-300/60 text-white flex items-center justify-center shadow cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isGeneratingEnemyImage ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-extrabold text-white uppercase tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
                {activeClash.enemyName}
              </span>
              <span className={`text-[8px] font-mono font-black px-1 py-0.2 rounded border uppercase ${rankBadgeStyle}`}>
                {threatRank}
              </span>
              <span className="text-[9px] font-mono text-rose-300/90 bg-black/50 px-1.5 py-0.2 rounded border border-rose-500/30">
                T{activeClash.clashTurn}/{activeClash.maxClashTurns}
              </span>
              {activeClash.enemyIntent && (
                <span
                  className="text-[9px] font-mono text-amber-200 bg-amber-950/70 border border-amber-500/40 px-1.5 py-0.2 rounded inline-flex items-center gap-1 truncate max-w-[180px]"
                  title={activeClash.enemyIntent.counterStanceHint || activeClash.enemyIntent.label}
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate">{activeClash.enemyIntent.label}</span>
                  <span className="text-red-300 font-bold shrink-0">~{activeClash.enemyIntent.estimatedDamage}</span>
                </span>
              )}
            </div>

            {/* Enemy HP Bar */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 max-w-[220px] h-1.5 bg-black/90 rounded-full overflow-hidden border border-rose-500/30 relative">
                <div
                  className="absolute inset-y-0 left-0 bg-amber-300/70 transition-all duration-500"
                  style={{ width: `${ghostEnemyHpPercent}%` }}
                />
                <div
                  className="relative h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 transition-all duration-200"
                  style={{ width: `${enemyHpPercent}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-rose-200 shrink-0">
                {activeClash.enemyHp}/{activeClash.enemyMaxHp} HP
              </span>
              {lastHitEvent && lastHitEvent.damageDealt > 0 && (
                <span className="text-[9px] font-mono font-black text-amber-300 animate-pulse shrink-0">
                  -{lastHitEvent.damageDealt}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Compact Player Vitals + Disengage + Log Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-lg bg-black/70 border text-[10px] font-mono ${
              playerDamagedFlash
                ? "border-red-500"
                : playerHealedFlash
                ? "border-emerald-400"
                : "border-white/10"
            }`}
          >
            <span className="text-zinc-300 font-bold hidden md:inline truncate max-w-[80px]">{playerName}</span>
            <span className="flex items-center gap-0.5 text-emerald-300 font-bold" title="Player Health">
              <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
              {playerHp}/{playerMaxHp}
            </span>
            <div className="w-10 h-1.5 bg-zinc-900 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-emerald-400"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <span className="flex items-center gap-0.5 text-sky-300 font-bold" title="Player Mana">
              <Zap className="w-2.5 h-2.5 text-sky-400 fill-sky-400" />
              {playerMp}/{playerMaxMp}
            </span>
            <div className="w-8 h-1.5 bg-zinc-900 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-400"
                style={{ width: `${playerMpPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || isExecutingClashAction}
            onClick={() => {
              soundEffects.playClick();
              onExecuteClashAction("flee");
            }}
            className="px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-amber-950/70 border border-white/15 hover:border-amber-500/50 text-zinc-300 hover:text-amber-200 text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
            title="Break engagement and retreat (-10 MP or take minor grazing hit)"
          >
            <Footprints className="w-2.5 h-2.5 text-amber-400" />
            <span className="hidden sm:inline">Disengage</span>
          </button>

          {activeClash.log && activeClash.log.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCombatLog((v) => !v)}
              className="p-1 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              title={showCombatLog ? "Hide Combat Log" : "Show Combat Log"}
            >
              {showCombatLog ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: ULTRA-SLIM STANCE PILL STRIP */}
      <div className="flex items-center justify-between gap-1.5 mt-1 pt-1 border-t border-white/10 relative z-10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-400 mr-0.5 hidden sm:inline">
            Stance:
          </span>
          {stanceButtons.map((st) => {
            const isSelected = activeStance === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onSelectStance(st.id);
                }}
                title={`${st.label}: ${st.bonusText}`}
                className={`px-1.5 py-0.5 rounded-md border text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? `${st.activeClass} font-bold shadow-sm`
                    : "bg-zinc-900/70 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/25"
                }`}
              >
                {st.icon}
                <span>{st.shortLabel}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[9px] font-mono text-amber-300/90 truncate hidden md:inline">
          {activeStanceInfo.label}: {activeStanceInfo.bonusHint}
        </span>
      </div>

      {/* ROW 3: COMPACT 4-COLUMN TACTICAL ARSENAL BUTTONS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5 relative z-10">
        {clashChoices.map((c) => {
          const isBurst = c.actionType === "burst";
          const isSynergy = c.actionType === "synergy";
          const isDefense = c.actionType === "defense";

          return (
            <button
              key={c.actionType}
              type="button"
              disabled={isLoading || isExecutingClashAction || c.disabled}
              onClick={() => onExecuteClashAction(c.actionType)}
              title={`${c.actionName} — ${c.description}${c.reasonDisabled ? ` (${c.reasonDisabled})` : ""}`}
              className={`px-2 py-1.5 rounded-lg border text-left transition-all flex items-center justify-between gap-1.5 relative overflow-hidden ${
                c.disabled
                  ? "bg-zinc-950/50 border-white/5 text-zinc-600 cursor-not-allowed opacity-60"
                  : isBurst
                  ? "bg-gradient-to-r from-rose-950/90 to-amber-950/80 hover:from-rose-900 hover:to-amber-900 border-rose-500/50 hover:border-amber-400 text-rose-100 cursor-pointer shadow-sm"
                  : isSynergy
                  ? "bg-gradient-to-r from-purple-950/90 to-indigo-950/80 hover:from-purple-900 hover:to-indigo-900 border-purple-500/50 hover:border-purple-400 text-purple-100 cursor-pointer shadow-sm"
                  : isDefense
                  ? "bg-zinc-900/90 hover:bg-emerald-950/70 border-emerald-500/35 hover:border-emerald-400 text-emerald-100 cursor-pointer"
                  : "bg-zinc-900/90 hover:bg-rose-950/80 border-white/15 hover:border-rose-500/60 text-zinc-100 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0">
                  {c.actionType === "strike" && <Swords className="w-3 h-3 text-rose-400" />}
                  {c.actionType === "burst" && <Flame className="w-3 h-3 text-amber-400" />}
                  {c.actionType === "synergy" && <Sparkles className="w-3 h-3 text-purple-400" />}
                  {c.actionType === "defense" && <Shield className="w-3 h-3 text-emerald-400" />}
                </span>
                <span className="text-[10px] font-mono font-bold truncate leading-tight">
                  {c.actionName}
                </span>
              </div>
              <span
                className={`text-[8px] font-mono px-1 py-0.2 rounded shrink-0 ${
                  c.mpCost > 0
                    ? c.disabled
                      ? "bg-red-950/80 text-red-400 border border-red-500/30"
                      : "bg-sky-950/90 text-sky-300 border border-sky-500/30"
                    : "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {c.mpCost > 0 ? `${c.mpCost}MP` : c.actionType === "defense" ? "+15MP" : "0MP"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Collapsible Combat Log (Only shown when toggled open) */}
      {showCombatLog && activeClash.log && activeClash.log.length > 0 && (
        <div className="mt-1.5 pt-1 border-t border-white/10 text-[9px] font-mono text-rose-200/90 space-y-0.5 max-h-16 overflow-y-auto relative z-10">
          {activeClash.log.slice(-3).map((entry, idx) => (
            <div key={idx} className="truncate">
              {entry}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
