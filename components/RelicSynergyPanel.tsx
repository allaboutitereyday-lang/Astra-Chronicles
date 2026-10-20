"use client";

import React from "react";
import { Sparkles, Shield, Zap, Lock, CheckCircle2 } from "lucide-react";
import { RelicSynergy } from "@/types/story";

interface RelicSynergyPanelProps {
  synergies: RelicSynergy[];
  onSelectSynergyChoice?: (prefix: string) => void;
}

export function RelicSynergyPanel({
  synergies,
  onSelectSynergyChoice,
}: RelicSynergyPanelProps) {
  if (!synergies || synergies.length === 0) return null;

  const activeSynergies = synergies.filter((s) => s.isActive);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            Relic Set Synergies
          </h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          <strong className="text-amber-300">{activeSynergies.length}</strong> / {synergies.length} Active
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {synergies.map((synergy) => {
          const reqCount = Math.max(1, synergy.requiredCount || 2);
          const currentCount = Math.max(0, synergy.pieceCount || 0);
          const progressPercent = Math.min(
            100,
            Math.round((currentCount / reqCount) * 100)
          );

          return (
            <div
              key={synergy.id}
              className={`p-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                synergy.isActive
                  ? "bg-amber-950/25 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
                  : "bg-zinc-950/60 border-white/5 opacity-75"
              }`}
            >
              {synergy.isActive && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-xl pointer-events-none rounded-full" />
              )}

              {/* Set Title & Progress */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {synergy.isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold font-serif truncate ${
                      synergy.isActive ? "text-amber-200" : "text-zinc-400"
                    }`}
                  >
                    {synergy.bonusName}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                    synergy.isActive
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                  }`}
                >
                  {synergy.setName} {synergy.pieceCount}/{synergy.requiredCount}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-2 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    synergy.isActive
                      ? "bg-gradient-to-r from-amber-500 to-rose-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                      : "bg-zinc-700"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Description */}
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans mb-2">
                {synergy.bonusDescription}
              </p>

              {/* Exclusive Action Vector Badge */}
              {synergy.isActive ? (
                <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Unlocked Vector:</span>
                    <span className="font-bold text-amber-200">
                      {synergy.unlockedExclusiveChoicePrefix}
                    </span>
                  </div>

                  {onSelectSynergyChoice && (
                    <button
                      type="button"
                      onClick={() => onSelectSynergyChoice(synergy.unlockedExclusiveChoicePrefix)}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[9px] font-mono text-amber-200 cursor-pointer transition-all active:scale-95"
                    >
                      Use Intent
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-1 text-[10px] font-mono text-zinc-500 italic">
                  Equip {Math.max(1, reqCount - currentCount)} more {synergy.setName} piece to awaken resonance.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
