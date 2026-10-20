"use client";

import React, { useState } from "react";
import { 
  X, 
  Terminal, 
  CheckCircle2, 
  Circle, 
  Award, 
  Coins, 
  Package, 
  Zap, 
  Activity, 
  Info,
  Sparkles
} from "lucide-react";
import { SystemState, QuestDifficulty, PlausibilityTier } from "@/types/system";

interface SystemQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState;
  onCompleteQuest?: (questId: string) => void;
}

const DIFFICULTY_STYLES: Record<QuestDifficulty, { label: string; badge: string }> = {
  E: {
    label: "E-RANK",
    badge: "text-emerald-300 border-emerald-500/50 bg-emerald-950/60",
  },
  D: {
    label: "D-RANK",
    badge: "text-green-300 border-green-500/50 bg-green-950/60",
  },
  C: {
    label: "C-RANK",
    badge: "text-sky-300 border-sky-500/50 bg-sky-950/60",
  },
  B: {
    label: "B-RANK",
    badge: "text-purple-300 border-purple-500/50 bg-purple-950/60",
  },
  A: {
    label: "A-RANK",
    badge: "text-rose-300 border-rose-500/60 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
  },
  S: {
    label: "S-RANK",
    badge: "text-amber-300 border-amber-500/60 bg-amber-950/70 shadow-[0_0_16px_rgba(245,158,11,0.4)]",
  },
  Calamity: {
    label: "CALAMITY",
    badge: "text-rose-400 border-rose-500/80 bg-rose-950/80 shadow-[0_0_24px_rgba(244,63,94,0.6)] animate-pulse",
  },
};

const TIER_COLORS: Record<PlausibilityTier, { badge: string; text: string; bg: string }> = {
  Stable: {
    badge: "border-rose-500/40 bg-rose-950/40 text-rose-300",
    text: "text-rose-300",
    bg: "from-rose-500 via-pink-500 to-amber-500",
  },
  Strained: {
    badge: "border-amber-400/50 bg-amber-950/50 text-amber-300",
    text: "text-amber-300",
    bg: "from-amber-500 to-yellow-500",
  },
  Volatile: {
    badge: "border-orange-500/60 bg-orange-950/60 text-orange-300 animate-pulse",
    text: "text-orange-300",
    bg: "from-orange-600 to-rose-500",
  },
  Critical: {
    badge: "border-rose-500/80 bg-rose-950/80 text-rose-300 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]",
    text: "text-rose-400",
    bg: "from-rose-600 to-red-600",
  },
};

export function SystemQuestModal({ isOpen, onClose, systemState, onCompleteQuest }: SystemQuestModalProps) {
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "directives">("active");
  const activeQuests = Array.isArray(systemState?.activeQuests) ? systemState.activeQuests : [];
  const completedQuests = Array.isArray(systemState?.completedQuests) ? systemState.completedQuests : [];
  const systemDirectives = Array.isArray(systemState?.systemDirectives) ? systemState.systemDirectives : [];

  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(
    activeQuests[0]?.id || completedQuests[0]?.id || null
  );
  const [showPlausibilityInfo, setShowPlausibilityInfo] = useState(false);

  if (!isOpen) return null;

  const currentQuests = activeTab === "active" ? activeQuests : completedQuests;
  const selectedQuest =
    activeQuests.find((q) => q.id === selectedQuestId) ||
    completedQuests.find((q) => q.id === selectedQuestId) ||
    currentQuests[0];

  const plausibility = typeof systemState?.plausibility === "number" ? systemState.plausibility : 80;
  const tier = systemState?.plausibilityTier || "Stable";
  const tierInfo = TIER_COLORS[tier] || TIER_COLORS.Stable;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl h-[90vh] max-h-[760px] bg-zinc-950/95 border-2 border-rose-500/50 rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.25)] flex flex-col overflow-hidden relative"
        style={{
          boxShadow: "0 0 50px rgba(244,63,94,0.2), inset 0 0 30px rgba(244,63,94,0.05)",
        }}
      >
        {/* Subtle Ambient Scanline Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(244,63,94,0.2) 1px, transparent 1px)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Manhwa Stylized Corner Brackets */}
        <span className="absolute top-2 left-2 text-xs font-mono text-rose-400/60 pointer-events-none">┌ SYSTEM ┐</span>
        <span className="absolute top-2 right-2 text-xs font-mono text-rose-400/60 pointer-events-none">┌ PROTOCOL ┐</span>
        <span className="absolute bottom-2 left-2 text-xs font-mono text-rose-400/60 pointer-events-none">└ V4.2 ┘</span>
        <span className="absolute bottom-2 right-2 text-xs font-mono text-rose-400/60 pointer-events-none">└ ADMIN ┘</span>

        {/* SYSTEM HEADER BAR */}
        <div className="p-4 sm:p-5 border-b border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-30 bg-rose-950/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.35)]">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-rose-400 uppercase font-bold">
                  WORLD ADMINISTRATOR PROTOCOL
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 border border-rose-500/30 rounded text-rose-300/80 bg-rose-950/60">
                  ONLINE
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                SYSTEM INTERFACE <span className="text-rose-400/60 text-xs font-normal">// QUEST & CAUSALITY</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PLAUSIBILITY GAUGE */}
            <div 
              onClick={() => setShowPlausibilityInfo(!showPlausibilityInfo)}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-950/40 hover:border-rose-400/60 transition-all cursor-pointer relative group"
            >
              <Activity className={`w-4 h-4 ${tierInfo.text} animate-pulse`} />
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="text-zinc-400">PROBABILITY</span>
                  <span className={`font-bold ${tierInfo.text}`}>{plausibility}% [{tier.toUpperCase()}]</span>
                </div>
                <div className="w-28 sm:w-36 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-1">
                  <div 
                    className={`h-full bg-gradient-to-r ${tierInfo.bg} transition-all duration-700`}
                    style={{ width: `${Math.min(100, Math.max(0, plausibility))}%` }}
                  />
                </div>
              </div>
              <Info className="w-3.5 h-3.5 text-rose-400/60 hover:text-rose-300 transition-colors" />

              {/* Tooltip info */}
              {showPlausibilityInfo && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPlausibilityInfo(false);
                    }}
                  />
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3.5 bg-zinc-950/98 backdrop-blur-xl border border-rose-500/70 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),_0_0_20px_rgba(244,63,94,0.2)] z-50 text-xs text-zinc-300 leading-relaxed font-sans"
                  >
                    <div className="flex items-center gap-1.5 text-rose-400 font-mono font-bold mb-1 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>CAUSAL PLAUSIBILITY / PROBABILITY</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      Governs cosmic balance. Grounded actions maintain stability. Extreme, reality-defying, or suicidal bluffs drain probability, triggering high-rank enemy anomalies, severe difficulty escalation, and penalty quests.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS HEADER */}
        <div className="px-4 sm:px-6 pt-3 border-b border-rose-500/20 flex gap-2 sm:gap-4 bg-rose-950/15">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`pb-2.5 px-3 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "active"
                ? "border-rose-500 text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ACTIVE SCENARIOS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/40">
              {activeQuests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`pb-2.5 px-3 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "completed"
                ? "border-rose-500 text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLETED ARCHIVE</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
              {completedQuests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("directives")}
            className={`pb-2.5 px-3 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "directives"
                ? "border-rose-500 text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>ADMINISTRATIVE LOGS</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col md:flex-row gap-4 relative z-10">
          {activeTab === "directives" ? (
            /* ADMINISTRATIVE DIRECTIVES / SYSTEM LOG */
            <div className="w-full h-full overflow-y-auto space-y-3 font-mono text-xs pr-2">
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl text-rose-300 text-[11px] mb-4">
                &gt; SYSTEM CORE STATUS: MONITORING ASTRA CONTINENT TEMPORAL STRAND...
              </div>
              {systemDirectives.length === 0 ? (
                <div className="text-zinc-500 italic p-6 text-center">No administrative logs recorded yet.</div>
              ) : (
                systemDirectives.map((directive, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-rose-500/20 text-zinc-300 leading-relaxed flex items-start gap-3"
                  >
                    <span className="text-rose-400 font-bold shrink-0">#{systemDirectives.length - idx}</span>
                    <span className="flex-1">{directive}</span>
                  </div>
                ))
              )}
            </div>
          ) : currentQuests.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-center p-12 text-zinc-500">
              <Terminal className="w-12 h-12 text-rose-500/30 mb-3" />
              <p className="text-sm font-mono text-zinc-400">
                {activeTab === "active" ? "No active system scenarios assigned." : "No completed quests archived yet."}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Advance narrative turns to trigger scenario objectives.</p>
            </div>
          ) : (
            <>
              {/* QUEST LIST DRAWER */}
              <div className="w-full md:w-5/12 overflow-y-auto space-y-2.5 pr-2 max-h-[240px] md:max-h-full">
                {currentQuests.map((quest) => {
                  const diffStyle = DIFFICULTY_STYLES[quest.difficulty] || DIFFICULTY_STYLES.E;
                  const isSelected = selectedQuest?.id === quest.id;
                  const questObjs = Array.isArray(quest.objectives) ? quest.objectives : [];
                  const completedObjectives = questObjs.filter((o) => o && o.completed).length;

                  return (
                    <div
                      key={quest.id}
                      onClick={() => setSelectedQuestId(quest.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                        isSelected
                          ? "bg-rose-950/40 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/40"
                          : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:border-rose-500/30 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${diffStyle.badge}`}
                        >
                          {diffStyle.label}
                        </span>
                        <span className="text-[10px] font-mono text-rose-400/80 uppercase">
                          {quest.type}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-100 line-clamp-1">{quest.title}</h4>

                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                        <span>Progress</span>
                        <span className={completedObjectives === questObjs.length ? "text-emerald-400" : "text-rose-300"}>
                          {completedObjectives} / {questObjs.length} Objectives
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QUEST DETAIL VIEW */}
              {selectedQuest && (
                <div className="w-full md:w-7/12 flex-1 bg-zinc-900/90 border border-rose-500/25 rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-rose-500/20 pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                              DIFFICULTY_STYLES[selectedQuest.difficulty]?.badge || DIFFICULTY_STYLES.E.badge
                            }`}
                          >
                            {DIFFICULTY_STYLES[selectedQuest.difficulty]?.label || "E-RANK"}
                          </span>
                          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest">
                            [{selectedQuest.type.toUpperCase()}]
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide font-mono">
                          {selectedQuest.title}
                        </h3>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full uppercase font-bold border ${
                          selectedQuest.status === "completed"
                            ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                            : selectedQuest.status === "failed"
                            ? "bg-rose-950/80 border-rose-500 text-rose-300"
                            : "bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse"
                        }`}
                      >
                        {selectedQuest.status}
                      </span>
                    </div>

                    {/* Quest Description */}
                    <div>
                      <p className="text-xs font-mono text-zinc-400 block mb-1">SCENARIO DIRECTIVE</p>
                      <p className="text-xs text-zinc-200 leading-relaxed bg-black/40 border border-white/10 p-3 rounded-xl font-sans">
                        {selectedQuest.description}
                      </p>
                    </div>

                    {/* Objectives */}
                    <div>
                      <p className="text-xs font-mono text-zinc-400 block mb-2">OBJECTIVES</p>
                      <div className="space-y-2">
                        {(selectedQuest.objectives || []).map((obj, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-xl border flex items-center gap-3 text-xs ${
                              obj?.completed
                                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-80"
                                : "bg-black/50 border-rose-500/20 text-zinc-200"
                            }`}
                          >
                            {obj?.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span className="flex-1">{obj?.text || "Investigate objective"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedQuest.progressNote && (
                      <div className="text-[11px] font-mono text-rose-300/80 bg-rose-950/30 border border-rose-500/30 p-2.5 rounded-xl">
                        &gt; {selectedQuest.progressNote}
                      </div>
                    )}
                  </div>

                  {/* Rewards Preview */}
                  <div className="pt-4 mt-4 border-t border-rose-500/20">
                    <p className="text-[11px] font-mono text-rose-300 block mb-2 font-bold uppercase tracking-wider">
                      SYSTEM CLEAR REWARDS
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Boolean(selectedQuest.rewards?.exp && selectedQuest.rewards.exp > 0) && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-400/40 text-rose-300 font-mono flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> +{selectedQuest.rewards?.exp} EXP
                        </span>
                      )}
                      {Boolean(selectedQuest.rewards?.gold && selectedQuest.rewards.gold > 0) && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-400/40 text-amber-300 font-mono flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5" /> +{selectedQuest.rewards?.gold} Gold
                        </span>
                      )}
                      {Boolean(selectedQuest.rewards?.statPoints && selectedQuest.rewards.statPoints > 0) && (
                        <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-400/40 text-purple-300 font-mono flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> +{selectedQuest.rewards?.statPoints} Stat Points
                        </span>
                      )}
                      {Boolean(selectedQuest.rewards?.title) && (
                        <span className="px-2.5 py-1 rounded-lg bg-pink-950/60 border border-pink-400/40 text-pink-300 font-mono flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Title: {selectedQuest.rewards?.title}
                        </span>
                      )}
                      {Array.isArray(selectedQuest.rewards?.items) &&
                        selectedQuest.rewards.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-white/20 text-zinc-200 font-mono flex items-center gap-1.5"
                          >
                            <Package className="w-3.5 h-3.5" /> {item}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Interactive Claim Clearance Action for Completed Objectives */}
                  {activeTab === "active" && 
                   selectedQuest.objectives && 
                   selectedQuest.objectives.length > 0 && 
                   selectedQuest.objectives.every((o) => o.completed) && 
                   onCompleteQuest && (
                    <div className="pt-3 border-t border-rose-500/20">
                      <button
                        onClick={() => onCompleteQuest(selectedQuest.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Claim Clearance & Unlock Resonance Cap</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemQuestModal;
