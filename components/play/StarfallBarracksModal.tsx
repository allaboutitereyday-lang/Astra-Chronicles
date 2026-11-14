"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Shield,
  Swords,
  Star,
  Users,
  Skull,
  ArrowLeftRight,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  HeroRosterEntry,
  HeroStatus,
  LabyrinthState,
  StarRank,
} from "@/types/starfall_labyrinth";
import { StoryCompanion } from "@/types/story";
import {
  computeHeroCombatStats,
  getHeroineDossier,
  getStarLevelCap,
  hydrateRosterEntryStats,
  matchesHeroineName,
  MAX_DEPLOYED_PARTY,
  normalizeSquadFormations,
  toggleHeroFormationSlot,
} from "@/lib/starfallEngine";
import { getTowerThemeForFloor } from "@/lib/starfallTowerThemes";
import { soundEffects } from "@/lib/audioEngine";

export interface StarfallBarracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  labyrinthState: LabyrinthState;
  protagonistName: string;
  protagonistLevel: number;
  protagonistRole?: string;
  partyMembers?: StoryCompanion[];
  onUpdateLabyrinthState: (nextState: LabyrinthState) => void;
}

export function StarfallBarracksModal({
  isOpen,
  onClose,
  labyrinthState,
  protagonistName,
  protagonistLevel,
  protagonistRole = "Field Tactician",
  partyMembers = [],
  onUpdateLabyrinthState,
}: StarfallBarracksModalProps) {
  const [selectedHeroName, setSelectedHeroName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"formation" | "memorial">("formation");

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      if (!selectedHeroName && (labyrinthState.roster || []).length > 0) {
        setSelectedHeroName(labyrinthState.roster[0].heroineName);
      }
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown, labyrinthState.roster, selectedHeroName]);

  if (!isOpen) return null;

  const roster = normalizeSquadFormations(labyrinthState.roster || []);
  const activeSquad = roster.filter(
    (r) => r.status === "DEPLOYED" || r.status === "WOUNDED"
  );
  const frontline = activeSquad.filter(
    (r) => (r.formationSlot || "FRONTLINE") === "FRONTLINE"
  );
  const reserve = activeSquad.filter((r) => r.formationSlot === "RESERVE");
  const benched = roster.filter((r) => r.status === "BENCHED");

  const selectedEntry: HeroRosterEntry | undefined =
    roster.find((r) => matchesHeroineName(r.heroineName, selectedHeroName)) ||
    roster[0];

  const selectedDossier = getHeroineDossier(selectedEntry?.heroineName);
  const selectedCompanion = partyMembers.find((c) =>
    matchesHeroineName(c.name, selectedEntry?.heroineName, c.id)
  );
  const selectedAffection = selectedCompanion?.affection ?? 15;

  const resolvePortrait = (name?: string): string => {
    const d = getHeroineDossier(name);
    if (d?.spriteSlug) {
      return `/characters/starfall-labyrinth/${d.spriteSlug}/neutral.png`;
    }
    return selectedCompanion?.baseImageUrl || "/characters/default.png";
  };

  const handleToggleSlot = (heroName: string) => {
    soundEffects.playClick();
    const updated = toggleHeroFormationSlot(labyrinthState, heroName);
    onUpdateLabyrinthState(updated);
  };

  const handleToggleDeployBench = (entry: HeroRosterEntry) => {
    if (entry.status === "FALLEN") return;
    soundEffects.playClick();
    const currentlyActive =
      entry.status === "DEPLOYED" || entry.status === "WOUNDED";

    if (currentlyActive) {
      // Prevent benching the very last deployed unit if possible, though protagonist is always deployed
      const nextRoster = roster.map((r) =>
        matchesHeroineName(r.heroineName, entry.heroineName)
          ? { ...r, status: "BENCHED" as HeroStatus, formationSlot: undefined }
          : r
      );
      onUpdateLabyrinthState({
        ...labyrinthState,
        roster: normalizeSquadFormations(nextRoster),
      });
    } else {
      if (activeSquad.length >= MAX_DEPLOYED_PARTY) {
        // Swap out the last reserve unit so 1-click deploy works smoothly
        const swapOutTarget = reserve[reserve.length - 1] || frontline[frontline.length - 1];
        const nextRoster = roster.map((r) => {
          if (matchesHeroineName(r.heroineName, entry.heroineName)) {
            return hydrateRosterEntryStats(
              { ...r, status: "DEPLOYED" as HeroStatus, formationSlot: "RESERVE" },
              "RESERVE"
            );
          }
          if (swapOutTarget && matchesHeroineName(r.heroineName, swapOutTarget.heroineName)) {
            return { ...r, status: "BENCHED" as HeroStatus, formationSlot: undefined };
          }
          return r;
        });
        onUpdateLabyrinthState({
          ...labyrinthState,
          roster: normalizeSquadFormations(nextRoster),
        });
      } else {
        const nextRoster = roster.map((r) =>
          matchesHeroineName(r.heroineName, entry.heroineName)
            ? hydrateRosterEntryStats({
                ...r,
                status: "DEPLOYED" as HeroStatus,
                formationSlot: frontline.length < 2 ? "FRONTLINE" : "RESERVE",
              })
            : r
        );
        onUpdateLabyrinthState({
          ...labyrinthState,
          roster: normalizeSquadFormations(nextRoster),
        });
      }
    }
  };

  const activeTheme = getTowerThemeForFloor(labyrinthState.currentFloor || 1);
  const protagCap = getStarLevelCap(labyrinthState.protagonistStarRank || 1);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[93dvh] bg-zinc-950/98 border border-indigo-500/35 rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.25)] flex flex-col overflow-hidden text-zinc-100"
      >
        {/* TOP HEADER */}
        <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-white/10 bg-gradient-to-r from-zinc-950 via-indigo-950/50 to-zinc-950 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-[10px] font-mono font-bold uppercase">
                <Shield className="w-3 h-3 text-indigo-300" />
                Iron Barracks • Formation &amp; Star Ascension Telemetry
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 text-[10px] font-mono">
                <Layers className="w-3 h-3" />
                {labyrinthState.currentFloor === 0
                  ? "Lobby Ready"
                  : `Floor ${labyrinthState.currentFloor} (${activeTheme.floorRangeLabel}: ${activeTheme.name})`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-mono text-white">
              Squad Formation, Hero Star Ranks &amp; Combat Stats
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-black/60 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("formation")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                  activeTab === "formation"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Squad &amp; Stats ({roster.filter((r) => r.status !== "FALLEN").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("memorial")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer flex items-center gap-1 ${
                  activeTab === "memorial"
                    ? "bg-rose-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Memorial ({(labyrinthState.memorial || []).length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === "memorial" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/35 text-xs font-mono text-rose-100">
                <p className="font-bold uppercase tracking-wider text-rose-300 mb-1">
                  Covenant IV — The Black Stone Memorial Wall
                </p>
                <p className="text-rose-200/85 leading-relaxed">
                  In Starfall Labyrinth, frontline knockouts first trigger{" "}
                  <strong>[WOUNDED]</strong> rescue protection (-30% stats until a Safe Zone or Lobby). Taking a second unshielded lethal blow while Wounded permanently claims a hero&apos;s life. Fallen heroes never respawn.
                </p>
              </div>

              {(labyrinthState.memorial || []).length === 0 ? (
                <div className="p-10 rounded-2xl bg-zinc-900/50 border border-white/10 text-center space-y-2">
                  <Shield className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-mono font-bold text-emerald-300">
                    Zero Casualties Recorded
                  </p>
                  <p className="text-xs font-mono text-zinc-400">
                    Every summoned hero in your roster is still breathing. Keep rotating wounded teammates to Rearguard Reserve!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {labyrinthState.memorial.map((m, idx) => (
                    <div
                      key={`${m.name}-${idx}`}
                      className="p-4 rounded-2xl bg-black/70 border border-rose-500/40 space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-rose-200">
                          ✝ {m.name}{" "}
                          {m.starRank ? `(${"★".repeat(m.starRank)})` : ""}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-500/40 text-rose-300">
                          Floor {m.floor}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{m.cause}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT 7 COLS: SQUAD FORMATION SLOTS + BENCH */}
              <div className="lg:col-span-7 space-y-4">
                {/* PROTAGONIST COMMANDER BAR */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-zinc-900/90 to-amber-950/30 border border-indigo-400/40 flex flex-wrap items-center justify-between gap-3 font-mono">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 font-black">
                        {labyrinthState.isHiddenRarity
                          ? `?★ (${labyrinthState.protagonistStarRank}★)`
                          : `${"★".repeat(labyrinthState.protagonistStarRank)}`}
                      </span>
                      <span className="text-sm font-black text-white">
                        {protagonistName} (Shot-Caller Lead)
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-300 block mt-0.5">
                      {protagonistRole} • Lv.{protagonistLevel}/{protagCap} • Memory Horizon: Floor{" "}
                      {labyrinthState.metaKnowledgeCeiling}
                    </span>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-cyan-300 font-bold block">
                      Master Trust: {labyrinthState.masterTrust}%
                    </span>
                    <span className="text-zinc-400">
                      Highest Cleared: F{labyrinthState.highestFloorCleared}
                    </span>
                  </div>
                </div>

                {/* FRONTLINE VANGUARD (MAX 2) */}
                <div className="p-4 rounded-2xl bg-zinc-900/75 border border-emerald-500/35 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-emerald-400" />
                      Frontline Vanguard ({frontline.length} / 2 Heroines)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Active Skill &amp; Direct Aggro Line
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {frontline.map((hero) => {
                      const st = hero.combatStats || computeHeroCombatStats({
                        heroineName: hero.heroineName,
                        starRank: hero.starRank,
                        level: hero.level,
                        awakenings: hero.awakenings,
                        isWounded: hero.status === "WOUNDED",
                      });
                      const isSel = matchesHeroineName(
                        hero.heroineName,
                        selectedEntry?.heroineName
                      );
                      return (
                        <div
                          key={hero.heroineName}
                          onClick={() => setSelectedHeroName(hero.heroineName)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSel
                              ? "bg-emerald-950/45 border-emerald-400/80 shadow-md"
                              : "bg-black/55 border-white/10 hover:border-emerald-400/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={resolvePortrait(hero.heroineName)}
                              alt={hero.heroineName}
                              className="w-11 h-14 object-contain object-bottom rounded-lg bg-zinc-900 border border-white/10 shrink-0"
                            />
                            <div className="min-w-0 flex-1 font-mono">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black text-white truncate">
                                  {hero.heroineName}
                                </span>
                                <span className="text-[10px] text-amber-300 shrink-0">
                                  {"★".repeat(hero.starRank)}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 block">
                                Lv.{hero.level}/{getStarLevelCap(hero.starRank)} • HP{" "}
                                {hero.currentHp ?? st.maxHp}/{st.maxHp}
                              </span>
                              {hero.status === "WOUNDED" && (
                                <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/25 border border-amber-400/60 text-amber-200 font-bold">
                                  ⚠ WOUNDED (-30%)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSlot(hero.heroineName);
                              }}
                              className="flex-1 py-1 px-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-[10px] font-mono font-bold text-indigo-200 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              <span>Move to Reserve</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDeployBench(hero);
                              }}
                              className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-[10px] font-mono text-zinc-300 cursor-pointer"
                            >
                              Bench
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {frontline.length === 0 && (
                      <p className="text-xs font-mono text-zinc-400 col-span-2 py-2">
                        No heroines assigned to Frontline Vanguard. Deploy or rotate a Reserve unit forward!
                      </p>
                    )}
                  </div>
                </div>

                {/* REARGUARD RESERVE (MAX 2) */}
                <div className="p-4 rounded-2xl bg-zinc-900/75 border border-sky-500/35 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                      <ArrowLeftRight className="w-4 h-4 text-sky-400" />
                      Rearguard Reserve ({reserve.length} / 2 Heroines)
                    </span>
                    <span className="text-[10px] font-mono text-sky-200/80">
                      +8% MP/Turn • Ready for Intercept / Chain Swap!
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {reserve.map((hero) => {
                      const st = hero.combatStats || computeHeroCombatStats({
                        heroineName: hero.heroineName,
                        starRank: hero.starRank,
                        level: hero.level,
                        awakenings: hero.awakenings,
                        isWounded: hero.status === "WOUNDED",
                      });
                      const isSel = matchesHeroineName(
                        hero.heroineName,
                        selectedEntry?.heroineName
                      );
                      return (
                        <div
                          key={hero.heroineName}
                          onClick={() => setSelectedHeroName(hero.heroineName)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSel
                              ? "bg-sky-950/45 border-sky-400/80 shadow-md"
                              : "bg-black/55 border-white/10 hover:border-sky-400/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={resolvePortrait(hero.heroineName)}
                              alt={hero.heroineName}
                              className="w-11 h-14 object-contain object-bottom rounded-lg bg-zinc-900 border border-white/10 shrink-0"
                            />
                            <div className="min-w-0 flex-1 font-mono">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black text-white truncate">
                                  {hero.heroineName}
                                </span>
                                <span className="text-[10px] text-amber-300 shrink-0">
                                  {"★".repeat(hero.starRank)}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 block">
                                Lv.{hero.level}/{getStarLevelCap(hero.starRank)} • HP{" "}
                                {hero.currentHp ?? st.maxHp}/{st.maxHp}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSlot(hero.heroineName);
                              }}
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-200 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              <span>Move to Frontline</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDeployBench(hero);
                              }}
                              className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-[10px] font-mono text-zinc-300 cursor-pointer"
                            >
                              Bench
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {reserve.length === 0 && (
                      <p className="text-xs font-mono text-zinc-400 col-span-2 py-2">
                        Summon more allies at Star Gate Plaza to fill Rearguard Reserve for mid-combat Tag-Swaps!
                      </p>
                    )}
                  </div>
                </div>

                {/* BENCHED BARRACKS ROSTER */}
                <div className="p-4 rounded-2xl bg-zinc-900/55 border border-white/10 space-y-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    Barracks Standby Bench ({benched.length})
                  </span>
                  {benched.length === 0 ? (
                    <p className="text-[11px] font-mono text-zinc-500">
                      All summoned heroes are currently deployed in your active squad.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {benched.map((hero) => (
                        <div
                          key={hero.heroineName}
                          onClick={() => setSelectedHeroName(hero.heroineName)}
                          className="p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-indigo-400/40 flex items-center justify-between gap-2 cursor-pointer font-mono"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {hero.heroineName}{" "}
                              <span className="text-amber-300">
                                {"★".repeat(hero.starRank)}
                              </span>
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              Lv.{hero.level}/{getStarLevelCap(hero.starRank)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDeployBench(hero);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
                          >
                            Deploy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT 5 COLS: SELECTED HERO INSPECTOR, STAR STATS & OC SKILL KIT */}
              <div className="lg:col-span-5">
                {selectedEntry ? (
                  (() => {
                    const curStats =
                      selectedEntry.combatStats ||
                      computeHeroCombatStats({
                        heroineName: selectedEntry.heroineName,
                        starRank: selectedEntry.starRank,
                        level: selectedEntry.level,
                        awakenings: selectedEntry.awakenings,
                        isWounded: selectedEntry.status === "WOUNDED",
                      });
                    const nextStar =
                      selectedEntry.starRank < 5
                        ? ((selectedEntry.starRank + 1) as StarRank)
                        : null;
                    const nextStats = nextStar
                      ? computeHeroCombatStats({
                          heroineName: selectedEntry.heroineName,
                          starRank: nextStar,
                          level: selectedEntry.level,
                          awakenings: Math.min(4, (selectedEntry.awakenings || 0) + 1),
                          isWounded: false,
                        })
                      : null;
                    const cap = getStarLevelCap(selectedEntry.starRank);

                    return (
                      <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/45 via-zinc-900/90 to-black border border-indigo-400/40 space-y-4 sticky top-0">
                        {/* HERO HEADER + GACHA SPLASH */}
                        <div className="flex items-end gap-3.5">
                          <div className="w-28 h-36 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-end justify-center shrink-0">
                            <img
                              src={resolvePortrait(selectedEntry.heroineName)}
                              alt={selectedEntry.heroineName}
                              className="w-full h-full object-contain object-bottom"
                            />
                          </div>
                          <div className="flex-1 min-w-0 font-mono space-y-1">
                            <div className="flex items-center gap-1 text-amber-300 text-sm font-black">
                              <span>{"★".repeat(selectedEntry.starRank)}</span>
                              <span className="text-zinc-600">
                                {"★".repeat(Math.max(0, 5 - selectedEntry.starRank))}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-white leading-tight">
                              {selectedEntry.heroineName}
                            </h3>
                            <p className="text-[11px] text-indigo-300">
                              {selectedDossier?.combatRole || "Labyrinth Hero"}
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold">
                                Lv.{selectedEntry.level} / Cap {cap}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-200">
                                ♥ {selectedAffection}% Bond
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CONCRETE STATS + NEXT STAR PREVIEW */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-zinc-200 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400" />
                              Combat Stats
                            </span>
                            {nextStar ? (
                              <span className="text-emerald-300">
                                Ascension Preview ({selectedEntry.starRank}★ → {nextStar}★)
                              </span>
                            ) : (
                              <span className="text-amber-300 font-bold">5★ MAX</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                            {[
                              { k: "HP", v: `${selectedEntry.currentHp ?? curStats.maxHp}/${curStats.maxHp}`, n: nextStats?.maxHp },
                              { k: "MP", v: `${selectedEntry.currentMp ?? curStats.maxMp}/${curStats.maxMp}`, n: nextStats?.maxMp },
                              { k: "ATK", v: curStats.atk, n: nextStats?.atk },
                              { k: "DEF", v: curStats.def, n: nextStats?.def },
                              { k: "SPD", v: curStats.spd, n: nextStats?.spd },
                              { k: "CRIT", v: `${curStats.critRate}%`, n: nextStats ? `${nextStats.critRate}%` : undefined },
                              { k: "EVA", v: `${curStats.evasion}%`, n: nextStats ? `${nextStats.evasion}%` : undefined },
                              { k: "DUPES", v: selectedEntry.duplicateCount || 0, n: undefined },
                            ].map((item) => (
                              <div
                                key={item.k}
                                className="p-2 rounded-xl bg-black/60 border border-white/10"
                              >
                                <span className="text-[9px] text-zinc-400 block">
                                  {item.k}
                                </span>
                                <span className="font-bold text-white text-[11px]">
                                  {item.v}
                                  {item.n !== undefined && (
                                    <span className="text-emerald-300 text-[10px] block">
                                      → {item.n}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4-MOVE OC SKILL KIT */}
                        {selectedDossier?.skillKit && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-mono font-bold text-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              Tactical &amp; Tag-Swap Ability Kit
                            </span>
                            <div className="space-y-1.5 text-[11px]">
                              {[
                                { tag: "BASIC", m: selectedDossier.skillKit.basicAttack },
                                {
                                  tag: `SKILL (${selectedDossier.skillKit.activeSkill.mpCost} MP)`,
                                  m: selectedDossier.skillKit.activeSkill,
                                },
                                { tag: "TAG-SWAP", m: selectedDossier.skillKit.tagAssistSkill },
                                {
                                  tag:
                                    selectedAffection >= 50 ||
                                    (selectedEntry.awakenings || 0) >= 2
                                      ? "BOND SPECIAL ★"
                                      : "BOND (50% ♥)",
                                  m: selectedDossier.skillKit.bondSpecial,
                                },
                              ].map(({ tag, m }) => (
                                <div
                                  key={m.id}
                                  className="p-2.5 rounded-xl bg-black/60 border border-white/10"
                                >
                                  <div className="flex items-center justify-between gap-2 font-mono">
                                    <span className="font-bold text-white">
                                      {m.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                                      {tag}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                                    {m.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 text-xs font-mono text-zinc-400">
                    Select a hero from your formation to inspect her Star Ascension curve and combat skills.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
