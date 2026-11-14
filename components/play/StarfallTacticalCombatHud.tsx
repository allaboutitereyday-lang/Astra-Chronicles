"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Swords,
  Shield,
  ArrowLeftRight,
  Zap,
  Sparkles,
  AlertTriangle,
  Dices,
  ChevronDown,
  ChevronUp,
  Layers,
  LogOut,
  Flame,
  Eye,
  Minimize2,
  Send,
  X,
} from "lucide-react";
import {
  LabyrinthState,
  STARFALL_ROLE_PRESETS,
  StarfallCombatState,
} from "@/types/starfall_labyrinth";
import { StoryCompanion, AbilityDetail } from "@/types/story";
import {
  computeHeroCombatStats,
  getHeroineDossier,
  matchesHeroineName,
} from "@/lib/starfallEngine";
import { soundEffects } from "@/lib/audioEngine";

export interface StarfallTacticalCombatHudProps {
  encounter: StarfallCombatState;
  labyrinthState: LabyrinthState;
  protagonistName: string;
  protagonistRole?: string;
  protagonistAbilities?: Record<string, AbilityDetail>;
  protagonistHp: number;
  protagonistMaxHp: number;
  protagonistMp: number;
  protagonistMaxMp: number;
  partyMembers?: StoryCompanion[];
  isSending: boolean;
  onExecuteCombatCommand: (commandString: string) => void;
  onOpenBarracks?: () => void;
}

const TIER_BADGE_MAP = {
  COMMON: {
    label: "COMMON HOSTILE",
    classes: "bg-emerald-500/15 border-emerald-400/40 text-emerald-200",
  },
  ELITE: {
    label: "ELITE THREAT",
    classes: "bg-amber-500/20 border-amber-400/50 text-amber-200",
  },
  BOSS: {
    label: "SOVEREIGN / GATE BOSS",
    classes: "bg-rose-500/25 border-rose-400/60 text-rose-100",
  },
} as const;

export function StarfallTacticalCombatHud({
  encounter,
  labyrinthState,
  protagonistName,
  protagonistRole,
  protagonistAbilities,
  protagonistHp,
  protagonistMaxHp,
  protagonistMp,
  protagonistMaxMp,
  partyMembers = [],
  isSending,
  onExecuteCombatCommand,
  onOpenBarracks,
}: StarfallTacticalCombatHudProps) {
  const [isArenaOpen, setIsArenaOpen] = useState(false);
  const [showInlineRollLog, setShowInlineRollLog] = useState(false);
  const [arenaTab, setArenaTab] = useState<"skills" | "terrain" | "rolls">("skills");
  const [arenaCustomInput, setArenaCustomInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!encounter?.isActive || encounter.status !== "ongoing") {
      setIsArenaOpen(false);
    }
  }, [encounter?.isActive, encounter?.status]);

  useEffect(() => {
    if (!isArenaOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSending) {
        setIsArenaOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isArenaOpen, isSending]);

  if (!encounter || !encounter.isActive) return null;

  const isVicinity = encounter.engagementPhase === "vicinity";
  const resolvedTier =
    encounter.enemyTier || (encounter.isBoss ? "BOSS" : "COMMON");
  const tierMeta = TIER_BADGE_MAP[resolvedTier] || TIER_BADGE_MAP.COMMON;

  const hpPct =
    encounter.enemyMaxHp > 0
      ? Math.max(0, Math.min(100, Math.round((encounter.enemyHp / encounter.enemyMaxHp) * 100)))
      : 0;
  const poisePct =
    encounter.enemyMaxPoise > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((encounter.enemyPoise / encounter.enemyMaxPoise) * 100)
          )
        )
      : 0;

  const roster = labyrinthState.roster || [];
  const frontlineEntries = encounter.frontlineHeroines
    .map((n) => roster.find((r) => matchesHeroineName(r.heroineName, n, r.heroineId)))
    .filter(Boolean);
  const reserveEntries = encounter.reserveHeroines
    .map((n) => roster.find((r) => matchesHeroineName(r.heroineName, n, r.heroineId)))
    .filter(Boolean);

  const normalizedRole = (protagonistRole || "").trim().toLowerCase();
  const matchedRolePreset =
    STARFALL_ROLE_PRESETS.find(
      (r) =>
        r.id.toLowerCase() === normalizedRole ||
        r.conduit.toLowerCase() === normalizedRole ||
        r.shortLabel.toLowerCase() === normalizedRole ||
        r.roleTitle.toLowerCase() === normalizedRole ||
        (normalizedRole && normalizedRole.includes(r.shortLabel.toLowerCase())) ||
        (normalizedRole && normalizedRole.includes(r.conduit.toLowerCase()))
    ) || STARFALL_ROLE_PRESETS[0];

  const customActiveAbilities = Object.values(protagonistAbilities || {}).filter(
    (a) => a && String(a.type || "").toLowerCase() === "active"
  );
  const activeRoleAbilities =
    customActiveAbilities.length > 0
      ? customActiveAbilities
      : matchedRolePreset.startingAbilities.filter((a) => a.type === "Active");

  const activeConditions = encounter.activeConditions || [];
  const latestRoll =
    encounter.lastDiceRolls && encounter.lastDiceRolls.length > 0
      ? encounter.lastDiceRolls[0]
      : null;

  const fireCmd = (cmd: string) => {
    if (isSending) return;
    soundEffects.playClick();
    onExecuteCombatCommand(cmd);
  };

  const handleOpenArena = () => {
    soundEffects.playClick();
    setIsArenaOpen(true);
  };

  const handleArenaCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = arenaCustomInput.trim();
    if (!trimmed || isSending) return;
    setArenaCustomInput("");
    fireCmd(trimmed);
  };

  const resolvePortrait = (heroName: string): string => {
    const d = getHeroineDossier(heroName);
    if (d?.spriteSlug) {
      return `/characters/starfall-labyrinth/${d.spriteSlug}/neutral.png`;
    }
    const pm = partyMembers.find((p) => matchesHeroineName(p.name, heroName, p.id));
    return pm?.baseImageUrl || "/characters/default.png";
  };

  const themeSurface =
    encounter.themeId === "SUNKEN_RELIQUARY"
      ? {
          border: "border-emerald-500/35",
          glow: "shadow-[0_12px_40px_rgba(16,185,129,0.14)]",
          gradient: "from-emerald-950/60 via-zinc-950/95 to-black/95",
          accentText: "text-emerald-300",
        }
      : encounter.themeId === "CHRONOS_FOUNDRY"
      ? {
          border: "border-amber-500/35",
          glow: "shadow-[0_12px_40px_rgba(245,158,11,0.14)]",
          gradient: "from-amber-950/60 via-zinc-950/95 to-black/95",
          accentText: "text-amber-300",
        }
      : encounter.themeId === "ECLIPSE_SANCTUM"
      ? {
          border: "border-rose-500/40",
          glow: "shadow-[0_12px_40px_rgba(244,63,94,0.16)]",
          gradient: "from-rose-950/60 via-zinc-950/95 to-black/95",
          accentText: "text-rose-300",
        }
      : {
          border: "border-indigo-500/45",
          glow: "shadow-[0_12px_40px_rgba(99,102,241,0.18)]",
          gradient: "from-indigo-950/65 via-zinc-950/95 to-black/95",
          accentText: "text-indigo-300",
        };

  const rollBadgeClass = (outcome: string) =>
    outcome === "CRITICAL_BREACH"
      ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
      : outcome === "CLEAN_HIT"
      ? "bg-emerald-500/20 border-emerald-400/45 text-emerald-200"
      : outcome === "GRAZE"
      ? "bg-sky-500/20 border-sky-400/45 text-sky-200"
      : "bg-rose-500/20 border-rose-400/50 text-rose-200";

  // Dedicated Tactical Combat Screen Modal (Remake Standard Design Language)
  const tacticalArenaModal =
    isArenaOpen && mounted
      ? createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSending) setIsArenaOpen(false);
            }}
            className="fixed inset-0 z-[120] bg-black/82 backdrop-blur-xl flex items-center justify-center p-2.5 sm:p-5 select-none animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-6xl max-h-[94dvh] bg-zinc-950/98 border ${themeSurface.border} rounded-3xl ${themeSurface.glow} flex flex-col overflow-hidden text-zinc-100`}
            >
              {/* TOP ARENA HEADER */}
              <div className={`px-5 sm:px-7 pt-4 pb-3.5 border-b border-white/10 bg-gradient-to-r ${themeSurface.gradient} flex flex-wrap items-center justify-between gap-3 shrink-0`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-black uppercase ${tierMeta.classes}`}>
                      <Swords className="w-3 h-3" />
                      {tierMeta.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-zinc-100 text-[10px] font-mono font-bold">
                      <Layers className="w-3 h-3 text-cyan-300" />
                      Floor {encounter.floor} • Turn {encounter.turnNumber} • {encounter.layoutName}
                    </span>
                    <span
                      className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 text-zinc-300 text-[10px] font-mono"
                      title={encounter.environmentalLawEffect}
                    >
                      Law: {encounter.environmentalLawName}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                    <span>{encounter.enemyName}</span>
                    <span className="text-xs sm:text-sm font-normal text-zinc-400">
                      — {encounter.enemyTitle}
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => {
                      soundEffects.playClick();
                      setIsArenaOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/15 text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Minimize back to Story View to fight via RP text or Choice Vectors"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>RP Text Mode</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() =>
                      fireCmd(
                        `[COMBAT:RETREAT_TO_LOBBY] Emergency recall! Fall back and extract the squad to Star Gate Plaza!`
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/75 border border-rose-500/40 text-xs font-mono font-bold text-rose-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Attempt emergency 1d20 extraction back to Star Gate Plaza"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Extract</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => setIsArenaOpen(false)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* MAIN ARENA BODY */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* 1. ENEMY STAGE DOSSIER & VITALS */}
                <div className="rounded-2xl bg-black/65 border border-white/10 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {encounter.layoutGeometry}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {encounter.isEnemyBroken && (
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-mono font-black animate-pulse">
                            ★ POISE BROKEN • +50% CRIT WINDOW
                          </span>
                        )}
                        {encounter.hexSealsOnEnemy > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/50 text-purple-200 text-[10px] font-mono font-bold">
                            Hex Seals {encounter.hexSealsOnEnemy}/5
                          </span>
                        )}
                        {encounter.activeShieldPool > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/50 text-sky-200 text-[10px] font-mono font-bold">
                            Squad Barrier +{encounter.activeShieldPool}
                          </span>
                        )}
                        {encounter.phantomEchoesActive > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/50 text-indigo-200 text-[10px] font-mono font-bold">
                            Phantoms ×{encounter.phantomEchoesActive}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 font-mono">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <span className="text-[10px] text-zinc-400 uppercase mr-1">Weakness:</span>
                        {encounter.enemyWeaknesses.map((wk) => (
                          <span
                            key={wk}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-amber-200 font-bold"
                          >
                            {wk.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                      {encounter.enemyResistances && encounter.enemyResistances.length > 0 && (
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <span className="text-[10px] text-zinc-500 uppercase mr-1">Resist:</span>
                          {encounter.enemyResistances.map((resTag) => (
                            <span
                              key={resTag}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-white/10 text-zinc-400"
                            >
                              {resTag.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HP & POISE BARS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 font-mono">
                    <div className="md:col-span-7 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-rose-300 font-bold uppercase tracking-wider">Hostile HP</span>
                        <span className="text-white font-black">
                          {encounter.enemyHp} / {encounter.enemyMaxHp} ({hpPct}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-5 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-cyan-300 font-bold uppercase tracking-wider">Poise Guard</span>
                        <span className="text-cyan-200 font-bold">
                          {encounter.isEnemyBroken
                            ? "SHATTERED"
                            : `${encounter.enemyPoise} / ${encounter.enemyMaxPoise}`}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full transition-all duration-300 ${
                            encounter.isEnemyBroken
                              ? "bg-amber-400"
                              : "bg-gradient-to-r from-sky-500 to-cyan-300"
                          }`}
                          style={{ width: `${encounter.isEnemyBroken ? 100 : poisePct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* INCOMING TELEGRAPH */}
                  {!encounter.isEnemyBroken && (
                    <div className="p-3 rounded-xl bg-amber-950/35 border border-amber-500/40 flex items-start justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-mono font-black text-amber-300 uppercase">
                            Incoming Telegraph [{encounter.currentTelegraph.label}]:{" "}
                          </span>
                          <span className="text-amber-100">{encounter.currentTelegraph.telegraphText}</span>
                        </div>
                      </div>
                      {encounter.currentTelegraph.interruptibleBy &&
                        encounter.currentTelegraph.interruptibleBy.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1 shrink-0 font-mono">
                            <span className="text-[10px] text-amber-300/80 uppercase">Interrupt:</span>
                            {encounter.currentTelegraph.interruptibleBy.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-bold"
                              >
                                {tag.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {/* COMMAND SEAL OVERRIDE */}
                  {encounter.masterSealOrder && !encounter.masterSealOrder.resolved && (
                    <div className="p-3.5 rounded-xl bg-rose-950/45 border border-rose-500/50 space-y-2.5">
                      <p className="text-xs font-mono font-bold text-rose-100">
                        ⚡ {encounter.masterSealOrder.commandText}
                      </p>
                      <div className="flex flex-wrap gap-2 font-mono">
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() =>
                            fireCmd(
                              `[COMBAT:SEAL_LOOPHOLE] Twist the Command Seal's literal wording via a tactical feint so nobody gets sacrificed!`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                        >
                          ✦ Exploit Seal Loophole (INT d20)
                        </button>
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() =>
                            fireCmd(
                              `[COMBAT:SEAL_DEFY] Openly defy the Master's reckless Command Seal and raise a protective formation!`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/50 text-amber-100 text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          Defy ({encounter.masterSealOrder.trustLossOnDefy}% Trust, +Barrier)
                        </button>
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() =>
                            fireCmd(
                              `[COMBAT:SEAL_COMPLY] Obey the Master's Command Seal and commit to an all-out rush!`
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/15 text-zinc-200 text-xs cursor-pointer disabled:opacity-50"
                        >
                          Comply (+{encounter.masterSealOrder.trustGainOnComply}% Trust, Reckless)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ARENA NAVIGATION TABS */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-xl bg-zinc-900/90 p-1 border border-white/10 font-mono">
                    <button
                      type="button"
                      onClick={() => setArenaTab("skills")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        arenaTab === "skills"
                          ? "bg-rose-600 text-white shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      ⚔ Party &amp; Skills
                    </button>
                    <button
                      type="button"
                      onClick={() => setArenaTab("terrain")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        arenaTab === "terrain"
                          ? "bg-emerald-600 text-white shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      ✦ Terrain Exploits ({encounter.terrainTags.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setArenaTab("rolls")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        arenaTab === "rolls"
                          ? "bg-indigo-600 text-white shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      🎲 1d20 Roll Feed ({encounter.lastDiceRolls.length})
                    </button>
                  </div>

                  {onOpenBarracks && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsArenaOpen(false);
                        onOpenBarracks();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-400/40 text-xs font-mono font-bold text-indigo-200 cursor-pointer"
                    >
                      Inspect Squad in Barracks
                    </button>
                  )}
                </div>

                {/* TAB CONTENT */}
                {arenaTab === "skills" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* LEFT 8 COLS: PROTAGONIST & FRONTLINE HEROINES */}
                    <div className="lg:col-span-8 space-y-3">
                      {/* PROTAGONIST DECK */}
                      <div className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                              <Shield className="w-4 h-4" />
                              {protagonistName} — {matchedRolePreset.shortLabel}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              HP {protagonistHp}/{protagonistMaxHp} • MP {protagonistMp}/{protagonistMaxMp}
                            </span>
                          </div>
                          {activeConditions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {activeConditions.map((cond, idx) => (
                                <span
                                  key={`${cond.type}-${cond.target}-${idx}`}
                                  className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/50 text-rose-200 font-bold"
                                >
                                  {cond.type} ({cond.target} • {cond.turnsRemaining}T)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                          <button
                            type="button"
                            disabled={isSending}
                            onClick={() =>
                              fireCmd(
                                `[COMBAT:BASIC_ATTACK] Press the frontline opening and strike ${encounter.enemyName} cleanly!`
                              )
                            }
                            className="p-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-white/15 text-left transition-all cursor-pointer disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between text-xs font-black text-white">
                              <span className="flex items-center gap-1.5">
                                <Swords className="w-3.5 h-3.5 text-zinc-300" />
                                Tactical Strike
                              </span>
                              <span className="text-[10px] text-emerald-300">0 MP</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1">
                              Clean blade/conduit strike + 1d20 check vs {encounter.enemyName}.
                            </p>
                          </button>

                          {activeRoleAbilities.map((ability) => {
                            const mpCostNum =
                              parseInt(String(ability.cost || "12").replace(/[^\d]/g, ""), 10) || 12;
                            const lowMp = protagonistMp < mpCostNum;
                            return (
                              <button
                                key={ability.name}
                                type="button"
                                disabled={isSending || lowMp}
                                onClick={() =>
                                  fireCmd(
                                    `[COMBAT:ROLE_SKILL:${ability.name}] Unleash ${ability.name} against ${encounter.enemyName}!`
                                  )
                                }
                                className="p-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/75 border border-indigo-400/45 text-left transition-all cursor-pointer disabled:opacity-45"
                              >
                                <div className="flex items-center justify-between text-xs font-black text-indigo-100">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Zap className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                                    {ability.name}
                                  </span>
                                  <span className="text-[10px] text-sky-300 shrink-0">
                                    -{mpCostNum} MP
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
                                  {ability.description}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* FRONTLINE HEROINE PORTRAIT CARDS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {frontlineEntries.map((hero) => {
                          if (!hero) return null;
                          const dossier = getHeroineDossier(hero.heroineName);
                          const stats =
                            hero.combatStats ||
                            computeHeroCombatStats({
                              heroineName: hero.heroineName,
                              starRank: hero.starRank,
                              level: hero.level,
                              awakenings: hero.awakenings,
                              isWounded: hero.status === "WOUNDED",
                            });
                          const pm = partyMembers.find((p) =>
                            matchesHeroineName(p.name, hero.heroineName, p.id)
                          );
                          const aff = pm?.affection ?? 15;
                          const bondUnlocked = aff >= 50 || (hero.awakenings || 0) >= 2;
                          const activeMove = dossier?.skillKit.activeSkill;
                          const bondMove = dossier?.skillKit.bondSpecial;
                          const heroHp = hero.currentHp ?? stats.maxHp;
                          const heroMp = hero.currentMp ?? stats.maxMp;
                          const heroHpPct = Math.max(0, Math.min(100, Math.round((heroHp / stats.maxHp) * 100)));
                          const heroMpPct = Math.max(0, Math.min(100, Math.round((heroMp / stats.maxMp) * 100)));
                          const activeCd = activeMove ? hero.skillCooldowns?.[activeMove.id] || 0 : 0;
                          const bondCd = bondMove ? hero.skillCooldowns?.[bondMove.id] || 0 : 0;
                          const activeNoMp = activeMove ? heroMp < activeMove.mpCost : false;
                          const bondNoMp = bondMove ? heroMp < bondMove.mpCost : false;
                          const countersWeakness = Boolean(
                            activeMove?.weaknessTag &&
                              encounter.enemyWeaknesses.includes(activeMove.weaknessTag)
                          );
                          const interruptsTelegraph = Boolean(
                            activeMove?.weaknessTag &&
                              encounter.currentTelegraph.interruptibleBy?.includes(
                                activeMove.weaknessTag
                              )
                          );

                          return (
                            <div
                              key={hero.heroineName}
                              className={`p-3.5 rounded-2xl border space-y-3 ${
                                hero.status === "WOUNDED"
                                  ? "bg-rose-950/35 border-rose-500/75 shadow-[0_0_24px_rgba(244,63,94,0.2)]"
                                  : "bg-zinc-900/80 border-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={resolvePortrait(hero.heroineName)}
                                  alt={hero.heroineName}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = "/characters/default.png";
                                  }}
                                  className="w-12 h-12 rounded-xl object-cover object-top border border-white/15 bg-black/50 shrink-0"
                                />
                                <div className="flex-1 min-w-0 font-mono">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-sm font-black text-white truncate">
                                      {hero.heroineName}
                                    </span>
                                    <span className="text-[11px] text-amber-300 shrink-0">
                                      {"★".repeat(hero.starRank)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    {dossier?.combatRole || "Vanguard"} • Lv.{hero.level}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                                    <div>
                                      <div className="flex justify-between text-[9px] text-emerald-300">
                                        <span>HP</span>
                                        <span>
                                          {heroHp}/{stats.maxHp}
                                        </span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-black/70 overflow-hidden">
                                        <div
                                          className="h-full bg-emerald-400 transition-all"
                                          style={{ width: `${heroHpPct}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-[9px] text-sky-300">
                                        <span>MP</span>
                                        <span>
                                          {heroMp}/{stats.maxMp}
                                        </span>
                                      </div>
                                      <div className="h-1.5 rounded-full bg-black/70 overflow-hidden">
                                        <div
                                          className="h-full bg-sky-400 transition-all"
                                          style={{ width: `${heroMpPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {hero.status === "WOUNDED" && (
                                <div className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-400/60 text-[10px] font-mono font-black text-rose-200 animate-pulse">
                                  ⚠ WOUNDED PERMADEATH RISK — Tag in Rearguard Reserve!
                                </div>
                              )}

                              <div className="space-y-1.5 font-mono">
                                {activeMove && (
                                  <button
                                    type="button"
                                    disabled={isSending || activeCd > 0 || activeNoMp}
                                    onClick={() =>
                                      fireCmd(
                                        `[COMBAT:HEROINE_SKILL:${hero.heroineName}] Order ${hero.heroineName} to unleash [${activeMove.name}]!`
                                      )
                                    }
                                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-45 ${
                                      interruptsTelegraph
                                        ? "bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/70"
                                        : countersWeakness
                                        ? "bg-indigo-500/25 hover:bg-indigo-500/35 border-indigo-400/70"
                                        : "bg-indigo-950/50 hover:bg-indigo-900/60 border-indigo-400/35"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 text-xs font-black text-white">
                                      <span className="truncate">{activeMove.name}</span>
                                      <span className="text-[10px] text-sky-300 shrink-0">
                                        {activeCd > 0 ? `CD ${activeCd}T` : `-${activeMove.mpCost} MP`}
                                      </span>
                                    </div>
                                    {(interruptsTelegraph || countersWeakness) && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {interruptsTelegraph && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-black">
                                            ★ INTERRUPTS TELEGRAPH
                                          </span>
                                        )}
                                        {countersWeakness && (
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-400/20 border border-emerald-400/60 text-emerald-200 font-bold">
                                            WEAKNESS MATCH
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2">
                                      {activeMove.description}
                                    </p>
                                  </button>
                                )}

                                {bondMove && bondUnlocked && (
                                  <button
                                    type="button"
                                    disabled={isSending || bondCd > 0 || bondNoMp}
                                    onClick={() =>
                                      fireCmd(
                                        `[COMBAT:BOND_SPECIAL:${hero.heroineName}] Synchronize with ${hero.heroineName} for Bond Special [${bondMove.name}]!`
                                      )
                                    }
                                    className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-rose-600/25 hover:from-amber-600/45 hover:to-rose-600/40 border border-amber-400/60 text-left transition-all cursor-pointer disabled:opacity-45"
                                  >
                                    <div className="flex items-center justify-between text-xs font-black text-amber-200">
                                      <span className="flex items-center gap-1.5 truncate">
                                        <Flame className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                        {bondMove.name}
                                      </span>
                                      <span className="text-[10px] shrink-0">
                                        {bondCd > 0 ? `CD ${bondCd}T` : `-${bondMove.mpCost} MP`}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-amber-100/80 mt-0.5 line-clamp-1">
                                      {bondMove.description}
                                    </p>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* RIGHT 4 COLS: REARGUARD HOT-SWAP + CUSTOM ACTION */}
                    <div className="lg:col-span-4 space-y-3 font-mono">
                      <div className="p-4 rounded-2xl bg-sky-950/25 border border-sky-500/35 space-y-3">
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                            <ArrowLeftRight className="w-4 h-4 text-sky-400" />
                            Rearguard Hot-Swap ({reserveEntries.length}/2)
                          </span>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            {encounter.isEnemyBroken
                              ? "Enemy staggered! Tag in for a +30% Chain Swap Burst."
                              : "Tag in to trigger -40% Intercept Guard + 0 MP Assist."}
                          </p>
                        </div>

                        {reserveEntries.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-[11px] text-zinc-500">
                            No Reserve allies assigned. Recruit or assign Rearguard allies in Barracks.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {reserveEntries.map((resHero) => {
                              if (!resHero) return null;
                              const d = getHeroineDossier(resHero.heroineName);
                              const tagSkill = d?.skillKit.tagAssistSkill;
                              const onCd = (resHero.swapCooldown || 0) > 0;
                              const swapMode = encounter.isEnemyBroken
                                ? "CHAIN_SWAP"
                                : "INTERCEPT_SWAP";
                              const woundedFrontline = frontlineEntries.find(
                                (f) => f?.status === "WOUNDED"
                              );
                              const swapOutName =
                                woundedFrontline?.heroineName ||
                                frontlineEntries[0]?.heroineName ||
                                "";

                              return (
                                <button
                                  key={resHero.heroineName}
                                  type="button"
                                  disabled={isSending || onCd}
                                  onClick={() =>
                                    fireCmd(
                                      `[COMBAT:${swapMode}:${resHero.heroineName}:${swapOutName}] Tag in ${resHero.heroineName} from Rearguard Reserve with [${
                                        tagSkill?.name || "Tag-Assist"
                                      }]${swapOutName ? ` to cover ${swapOutName}` : ""}!`
                                    )
                                  }
                                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-45 ${
                                    encounter.isEnemyBroken
                                      ? "bg-amber-950/50 hover:bg-amber-900/60 border-amber-400/60 text-amber-100"
                                      : woundedFrontline
                                      ? "bg-rose-950/45 hover:bg-rose-900/60 border-rose-400/60 text-rose-100"
                                      : "bg-sky-950/55 hover:bg-sky-900/65 border-sky-400/50 text-sky-100"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 text-xs font-black">
                                    <span className="truncate">
                                      ⇄ {resHero.heroineName}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${
                                        woundedFrontline && !onCd
                                          ? "bg-rose-600 text-white animate-pulse"
                                          : "bg-black/50"
                                      }`}
                                    >
                                      {onCd
                                        ? `CD ${resHero.swapCooldown}T`
                                        : woundedFrontline
                                        ? `SAVE ${woundedFrontline.heroineName.split(" ")[0].toUpperCase()}!`
                                        : encounter.isEnemyBroken
                                        ? "CHAIN SWAP"
                                        : "INTERCEPT"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-300 mt-1 line-clamp-2">
                                    Assist: {tagSkill?.name || "Vanguard Assist"} (0 MP)
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* CUSTOM STUNT INPUT INSIDE ARENA */}
                      <form
                        onSubmit={handleArenaCustomSubmit}
                        className="p-4 rounded-2xl bg-zinc-900/75 border border-white/10 space-y-2.5"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Custom RP Stunt (Hidden 1d20 Check)</span>
                        </div>
                        <textarea
                          rows={2}
                          value={arenaCustomInput}
                          onChange={(e) => setArenaCustomInput(e.target.value)}
                          disabled={isSending}
                          placeholder={`Describe a custom tactic against ${encounter.enemyName}...`}
                          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/50 resize-none font-sans"
                        />
                        <button
                          type="submit"
                          disabled={isSending || !arenaCustomInput.trim()}
                          className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Execute RP Tactic</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {arenaTab === "terrain" && (
                  <div className="p-4 rounded-2xl bg-zinc-900/75 border border-emerald-500/30 space-y-3 font-mono">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-emerald-300">
                        Environmental Exploits — {encounter.layoutName}
                      </h3>
                      <p className="text-xs text-zinc-300 font-sans">
                        {encounter.layoutTacticalHint}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {encounter.terrainTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          disabled={isSending}
                          onClick={() =>
                            fireCmd(
                              `[COMBAT:TERRAIN_STUNT:${tag}] Weaponize the [${tag}] in ${encounter.layoutName} to stagger ${encounter.enemyName}!`
                            )
                          }
                          className="p-3.5 rounded-xl bg-emerald-950/55 hover:bg-emerald-900/70 border border-emerald-400/45 text-left transition-all cursor-pointer disabled:opacity-50 space-y-1"
                        >
                          <div className="text-xs font-black text-emerald-200">
                            ⚡ Exploit: {tag}
                          </div>
                          <div className="text-[10px] text-emerald-300/80">
                            Grants +4 Tactical Advantage &amp; Heavy Poise Damage
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {arenaTab === "rolls" && (
                  <div className="p-4 rounded-2xl bg-black/75 border border-indigo-500/35 space-y-3 font-mono">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Hidden 1d20 Tabletop Combat Resolution Log
                    </div>
                    {encounter.lastDiceRolls.length === 0 ? (
                      <p className="text-xs text-zinc-400">
                        No dice checks rolled yet in this encounter. Select any skill or submit a custom action to roll!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {encounter.lastDiceRolls.map((roll, i) => (
                          <div
                            key={`${roll.actorName}-${i}`}
                            className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-zinc-200">{roll.summaryText}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${rollBadgeClass(
                                roll.outcome
                              )}`}
                            >
                              {roll.outcome.replace(/_/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {encounter.combatLog && encounter.combatLog.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        <div className="text-[10px] uppercase text-zinc-500 font-bold">
                          Recent Arena Telemetry:
                        </div>
                        {encounter.combatLog.slice(-5).map((entry, i) => (
                          <p key={i} className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                            {entry}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LOADING STATUS FOOTER */}
              {isSending && (
                <div className="px-6 py-2.5 bg-indigo-950/90 border-t border-indigo-400/40 text-xs font-mono font-bold text-indigo-200 flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Resolving 1d20 combat checks &amp; generating scene choreography...</span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* SLEEK INLINE HOSTILE VICINITY / ACTIVE COMBAT DOCK (MATCHES REMAKE UI) */}
      <div
        className={`w-full rounded-2xl bg-gradient-to-r ${themeSurface.gradient} border ${themeSurface.border} ${themeSurface.glow} backdrop-blur-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 space-y-2.5 text-zinc-100`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* LEFT: TIER, PHASE, ENEMY NAME & WEAKNESSES */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-black uppercase ${
                isVicinity
                  ? "bg-amber-500/20 border-amber-400/55 text-amber-200"
                  : "bg-rose-500/25 border-rose-400/60 text-rose-100"
              }`}
            >
              <Eye className="w-3 h-3" />
              {isVicinity
                ? `Hostile in Vicinity • F${encounter.floor}`
                : `Engaged • F${encounter.floor} Turn ${encounter.turnNumber}`}
            </span>

            <span className={`px-2 py-0.5 rounded-md border text-[9px] font-mono font-bold uppercase ${tierMeta.classes}`}>
              {resolvedTier}
            </span>

            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-black text-white tracking-tight">
                {encounter.enemyName}
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                — {encounter.enemyTitle}
              </span>
            </div>

            {encounter.isEnemyBroken && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-400 text-black font-mono font-black animate-pulse">
                POISE BROKEN
              </span>
            )}
          </div>

          {/* RIGHT: CTA BUTTONS */}
          <div className="flex items-center gap-2 shrink-0 font-mono">
            {latestRoll && (
              <button
                type="button"
                onClick={() => setShowInlineRollLog((v) => !v)}
                className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 cursor-pointer ${rollBadgeClass(
                  latestRoll.outcome
                )}`}
                title={latestRoll.summaryText}
              >
                <Dices className="w-3 h-3" />
                <span>
                  1d20({latestRoll.naturalD20}): {latestRoll.outcome.replace(/_/g, " ")}
                </span>
                {showInlineRollLog ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenArena}
              disabled={isSending}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 border border-rose-300/40 text-white text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{isVicinity ? "Begin Encounter" : "Open Tactical Arena"}</span>
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={() =>
                fireCmd(
                  `[COMBAT:RETREAT_TO_LOBBY] Emergency recall! Fall back and extract the squad to Star Gate Plaza!`
                )
              }
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-rose-950/70 border border-white/10 hover:border-rose-400/40 text-[11px] text-zinc-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Attempt emergency 1d20 extraction back to Star Gate Plaza"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Extract</span>
            </button>
          </div>
        </div>

        {/* INLINE VITALS + TELEGRAPH + DUAL-MODE HINT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center font-mono">
          <div className="md:col-span-4 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-rose-300 font-bold">HP {hpPct}%</span>
              <span className="text-zinc-200">
                {encounter.enemyHp}/{encounter.enemyMaxHp}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-300"
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-cyan-300 font-bold">POISE</span>
              <span className="text-cyan-200">
                {encounter.isEnemyBroken ? "BROKEN" : `${encounter.enemyPoise}/${encounter.enemyMaxPoise}`}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-300 ${
                  encounter.isEnemyBroken
                    ? "bg-amber-400"
                    : "bg-gradient-to-r from-sky-500 to-cyan-300"
                }`}
                style={{ width: `${encounter.isEnemyBroken ? 100 : poisePct}%` }}
              />
            </div>
          </div>

          <div className="md:col-span-5 flex items-center justify-between gap-2 text-[11px] px-2.5 py-1 rounded-xl bg-black/50 border border-white/10">
            <span className="text-zinc-300 truncate">
              <span className="text-amber-300 font-bold">Telegraph: </span>
              {encounter.currentTelegraph.label}
            </span>
            <span className="text-[10px] text-zinc-400 hidden xl:inline shrink-0">
              RP Choices below roll 1d20 silently
            </span>
          </div>
        </div>

        {/* EXPANDABLE INLINE 1D20 LOG */}
        {showInlineRollLog && encounter.lastDiceRolls.length > 0 && (
          <div className="p-2.5 rounded-xl bg-black/75 border border-indigo-500/35 space-y-1 text-[11px] font-mono">
            {encounter.lastDiceRolls.map((roll, i) => (
              <div
                key={`${roll.actorName}-${i}`}
                className="flex items-center justify-between gap-2 text-zinc-200"
              >
                <span>{roll.summaryText}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${rollBadgeClass(roll.outcome)}`}>
                  {roll.outcome}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {tacticalArenaModal}
    </>
  );
}
