"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Swords,
  Flame,
  Snowflake,
  Zap,
  Moon,
  Orbit,
  Shield,
  Sparkles,
} from "lucide-react";
import { ActiveStoryClashState, CombatStanceType } from "@/types/story";
import { getStoryClashChoices } from "@/lib/storyClashEngine";
import { soundEffects } from "@/lib/audioEngine";

export interface ClashCombatPopup {
  id: string;
  text: string;
  subtext?: string;
  colorClass: string;
}

interface SectorClashHudProps {
  activeClash: ActiveStoryClashState;
  playerRole: string;
  playerMp: number;
  activeStance: CombatStanceType;
  onSelectStance: (stance: CombatStanceType) => void;
  assistingCompanion?: { name: string; role?: string } | null;
  isLoading: boolean;
  isExecutingClashAction: boolean;
  onExecuteClashAction: (actionType: "strike" | "burst" | "synergy" | "defense") => void;
  combatPopups?: ClashCombatPopup[];
}

const STANCE_CONFIG: {
  id: CombatStanceType;
  label: string;
  bonusText: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    id: "neutral",
    label: "Adaptive",
    bonusText: "+8% Balanced Output",
    icon: Shield,
    activeClass: "bg-zinc-800 border-zinc-400 text-white shadow-[0_0_12px_rgba(161,161,170,0.3)]",
  },
  {
    id: "flame",
    label: "Solaris",
    bonusText: "+30% ATK • Burn DoT",
    icon: Flame,
    activeClass: "bg-orange-950/90 border-orange-400 text-orange-200 shadow-[0_0_14px_rgba(249,115,22,0.4)]",
  },
  {
    id: "frost",
    label: "Cryo-Ward",
    bonusText: "-40% DMG Taken • Ward",
    icon: Snowflake,
    activeClass: "bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)]",
  },
  {
    id: "phase",
    label: "Blink",
    bonusText: "35% Evade Counter",
    icon: Zap,
    activeClass: "bg-violet-950/90 border-violet-400 text-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.4)]",
  },
  {
    id: "shadow",
    label: "Lethality",
    bonusText: "45% Crit (1.6x DMG)",
    icon: Moon,
    activeClass: "bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]",
  },
  {
    id: "graviton",
    label: "Crusher",
    bonusText: "+20% DMG • 35% Stagger",
    icon: Orbit,
    activeClass: "bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.4)]",
  },
];

export function SectorClashHud({
  activeClash,
  playerRole,
  playerMp,
  activeStance,
  onSelectStance,
  assistingCompanion,
  isLoading,
  isExecutingClashAction,
  onExecuteClashAction,
  combatPopups = [],
}: SectorClashHudProps) {
  const hpPercent = Math.max(
    0,
    Math.min(100, (activeClash.enemyHp / Math.max(1, activeClash.enemyMaxHp)) * 100)
  );
  const [ghostHpPercent, setGhostHpPercent] = useState(hpPercent);
  const prevHpRef = useRef(hpPercent);

  useEffect(() => {
    if (hpPercent < prevHpRef.current) {
      const timer = setTimeout(() => {
        setGhostHpPercent(hpPercent);
      }, 450);
      prevHpRef.current = hpPercent;
      return () => clearTimeout(timer);
    } else {
      setGhostHpPercent(hpPercent);
      prevHpRef.current = hpPercent;
    }
  }, [hpPercent]);

  const choices = getStoryClashChoices(
    playerRole || "Voidstrider",
    assistingCompanion || undefined,
    playerMp,
    activeStance
  );

  const currentStanceMeta =
    STANCE_CONFIG.find((s) => s.id === activeStance) || STANCE_CONFIG[0];

  return (
    <div className="relative pointer-events-auto bg-gradient-to-b from-zinc-900/95 via-black/95 to-zinc-950/95 border border-red-500/45 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-[0_0_35px_rgba(239,68,68,0.22)] mb-2 select-none overflow-hidden">
      {/* Floating Combat Popups */}
      {combatPopups.length > 0 && (
        <div className="pointer-events-none absolute top-2 right-4 z-30 flex flex-col items-end gap-1">
          {combatPopups.map((popup) => (
            <div
              key={popup.id}
              className={`px-2.5 py-1 rounded-xl bg-black/90 border font-mono text-xs font-black tracking-wider shadow-xl animate-bounce ${popup.colorClass}`}
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

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="font-bold text-xs sm:text-sm text-red-200 tracking-wide">
            {activeClash.enemyName}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-red-300">
            Turn {activeClash.clashTurn} / {activeClash.maxClashTurns}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-red-300 font-bold">
            {activeClash.enemyHp} / {activeClash.enemyMaxHp} HP
          </span>
          {activeClash.companionAssistingName && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-rose-400" />
              Synergy: {activeClash.companionAssistingName}
            </span>
          )}
        </div>
      </div>

      {/* Enemy HP Bar with Delayed Ghost Depletion */}
      <div className="relative w-full bg-zinc-900/90 rounded-full h-2.5 overflow-hidden border border-red-950/80 mb-3">
        <div
          className="absolute inset-y-0 left-0 bg-amber-200/60 transition-all duration-500 ease-out"
          style={{ width: `${ghostHpPercent}%` }}
        />
        <div
          className="relative bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 h-full transition-all duration-200"
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* Universal 6-Stance Matrix Selector */}
      <div className="mb-3 bg-black/60 border border-white/10 rounded-xl p-2">
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            Universal Combat Stance Matrix
          </span>
          <span className="text-[10px] font-mono text-amber-300 font-semibold">
            {currentStanceMeta.label}: {currentStanceMeta.bonusText}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {STANCE_CONFIG.map((stance) => {
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
                className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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

      {/* 4 Stance-Infused Tactical Clash Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2">
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
    </div>
  );
}

