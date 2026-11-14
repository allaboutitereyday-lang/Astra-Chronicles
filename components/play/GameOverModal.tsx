"use client";

import React from "react";
import { Skull, RotateCcw, Home, ShieldAlert, Flame } from "lucide-react";
import { MemorialRecord } from "@/types/starfall_labyrinth";
import { soundEffects } from "@/lib/audioEngine";

export interface GameOverModalProps {
  isOpen: boolean;
  playerName: string;
  causeOfDeath: string;
  killerOrHazard?: string;
  currentFloor: number;
  highestFloorCleared: number;
  memorial?: MemorialRecord[];
  onOpenSaveModal: () => void;
  onReturnToMenu: () => void;
}

export function GameOverModal({
  isOpen,
  playerName,
  causeOfDeath,
  killerOrHazard,
  currentFloor,
  highestFloorCleared,
  memorial = [],
  onOpenSaveModal,
  onReturnToMenu,
}: GameOverModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-b from-rose-950/60 via-zinc-950 to-black border border-rose-500/50 shadow-[0_0_90px_rgba(225,29,72,0.35)] p-6 sm:p-8 space-y-6 text-zinc-100 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-rose-600/20 blur-3xl pointer-events-none" />

        {/* HEADER */}
        <div className="relative z-10 text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/90 border border-rose-500/60 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <Skull className="w-8 h-8" />
          </div>
          <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-rose-400 pt-1">
            Covenant VI • Consciousness Severed
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white">
            STAR ASH — GAME OVER
          </h2>
          <p className="text-xs sm:text-sm font-mono text-rose-200/85 max-w-lg mx-auto">
            There is no timeline regression inside the Starfall Labyrinth.{" "}
            <strong className="text-white">{playerName}</strong>&apos;s summoning crystal has shattered on{" "}
            <strong className="text-rose-300">
              {currentFloor > 0 ? `Floor ${currentFloor}` : "Star Gate Plaza"}
            </strong>
            .
          </p>
        </div>

        {/* FATAL CAUSE CARD */}
        <div className="relative z-10 p-4 rounded-2xl bg-black/70 border border-rose-500/35 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between gap-2 text-rose-300 font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Fatal Record
            </span>
            {killerOrHazard && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200">
                {killerOrHazard}
              </span>
            )}
          </div>
          <p className="text-zinc-200 leading-relaxed">{causeOfDeath}</p>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              Location Reached:{" "}
              <strong className="text-zinc-200">
                {currentFloor > 0 ? `Floor ${currentFloor} / 100` : "Main Lobby"}
              </strong>
            </span>
            <span>
              Highest Floor Cleared:{" "}
              <strong className="text-amber-300">Floor {highestFloorCleared}</strong>
            </span>
          </div>
        </div>

        {/* MEMORIAL WALL SNAPSHOT */}
        {memorial.length > 0 && (
          <div className="relative z-10 p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Etched on the Memorial Wall Alongside You ({memorial.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
              {memorial.map((m, idx) => (
                <div
                  key={`${m.name}-${idx}`}
                  className="p-2 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono"
                >
                  <span className="text-rose-200 font-bold block">
                    ✝ {m.name} (Floor {m.floor})
                  </span>
                  <span className="text-[10px] text-zinc-400 line-clamp-1">
                    {m.cause}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenSaveModal();
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Load Save Archive</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onReturnToMenu();
            }}
            className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-zinc-200 font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Realm Select</span>
          </button>
        </div>
      </div>
    </div>
  );
}
