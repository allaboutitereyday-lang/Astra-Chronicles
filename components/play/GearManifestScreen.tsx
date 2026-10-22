"use client";

import React from "react";
import {
  ArrowLeft,
  Check,
  Dices,
  Play,
  Shield,
  Sparkles,
  Sword,
} from "lucide-react";
import { GeneratedGearPiece } from "@/app/api/generate-starting-gear/route";
import { AtmosphericParticles } from "@/components/AtmosphericParticles";
import { soundEffects } from "@/lib/audioEngine";

interface GearManifestScreenProps {
  pageLoaded: boolean;
  isScreenTransitionOpen: boolean;
  defaultBg: string;
  playerName: string;
  playerRole: string;
  settingName: string;
  isGeneratingGear: boolean;
  systemGearOptions: GeneratedGearPiece[];
  generatingImageItemIds: Record<string, boolean>;
  onBackToSetup: () => void;
  onRerollGear: () => void;
  onConfirmGearAndStart: () => void;
  children?: React.ReactNode;
}

export function GearManifestScreen({
  pageLoaded,
  isScreenTransitionOpen,
  defaultBg,
  playerName,
  playerRole,
  settingName,
  isGeneratingGear,
  systemGearOptions,
  generatingImageItemIds,
  onBackToSetup,
  onRerollGear,
  onConfirmGearAndStart,
  children,
}: GearManifestScreenProps) {
  return (
    <div
      className={`relative min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4 py-8 md:py-12 overflow-y-auto transition-all duration-300 ease-out ${
        pageLoaded && !isScreenTransitionOpen
          ? "opacity-100 scale-100"
          : "opacity-0 scale-[0.99]"
      }`}
    >
      <div
        className="fixed inset-0 bg-cover bg-center brightness-[0.22] contrast-125 pointer-events-none select-none z-0"
        style={{ backgroundImage: `url("${defaultBg}")` }}
      />
      <div className="fixed inset-0 cinematic-vignette pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0">
        <AtmosphericParticles
          location="Imperial Capital Imperium"
          intensity="gentle"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl bg-zinc-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-auto">
        {/* Top Navigation & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                onBackToSetup();
              }}
              className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/30 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Setup</span>
            </button>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              Step 2 of 2: System Choice Starting Gear
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingGear}
              onClick={onRerollGear}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600/80 to-rose-600/80 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              title="Resynthesize 3 starting gear pieces with the LLM"
            >
              <Dices
                className={`w-3.5 h-3.5 ${isGeneratingGear ? "animate-spin" : ""}`}
              />
              <span>
                {isGeneratingGear ? "Forging Armaments..." : "Reroll Gear (3 Cards)"}
              </span>
            </button>
          </div>
        </div>

        {/* Header Titles */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-widest font-bold">
            <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Class Armament Manifestation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            System Loadout for <span className="text-rose-400">{playerName}</span> (
            {playerRole || "Adventurer"})
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The System has synthesized 3 bespoke starting pieces based upon your
            chosen class:{" "}
            <strong className="text-zinc-200 font-mono">{playerRole}</strong>. Each
            item features custom lore descriptions and generated iconography.
          </p>
        </div>

        {/* The 3 Cards */}
        {isGeneratingGear && systemGearOptions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-950/60 rounded-2xl border border-white/10 p-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center animate-pulse shadow-lg">
              <Sparkles className="w-7 h-7 text-rose-400 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                [SYSTEM: Analyzing Class Archetype &amp; Synthesizing 3 Gear Pieces...]
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Querying System Armament Architect for {playerRole}... Generating lore
                descriptions and visual assets.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {systemGearOptions.map((item, idx) => {
              const isWeapon = item.type === "weapon";
              const isArmor = item.type === "armor";
              const isGeneratingImage = generatingImageItemIds[item.id];

              return (
                <div
                  key={item.id || idx}
                  className="relative bg-zinc-950/90 border border-white/15 hover:border-rose-500/50 rounded-2xl p-4.5 flex flex-col justify-between transition-all duration-300 shadow-xl group overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

                  <div className="space-y-3">
                    {/* Slot badge & Rarity badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isWeapon
                            ? "bg-rose-950/80 border border-rose-500/50 text-rose-300"
                            : isArmor
                            ? "bg-sky-950/80 border border-sky-500/50 text-sky-300"
                            : "bg-amber-950/80 border border-amber-500/50 text-amber-300"
                        }`}
                      >
                        {isWeapon ? (
                          <Sword className="w-3 h-3" />
                        ) : isArmor ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{item.type}</span>
                      </span>

                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-amber-300 font-bold">
                        {item.rarity}
                      </span>
                    </div>

                    {/* Image Container */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/70 border border-white/10 shadow-inner flex items-center justify-center group-hover:border-white/20 transition-all">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : isGeneratingImage ? (
                        <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                          <Sparkles className="w-6 h-6 text-rose-400 animate-spin" />
                          <span className="text-[10px] font-mono text-zinc-400 animate-pulse">
                            Synthesizing Asset via Nano Banana...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center space-y-2">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
                              isWeapon
                                ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
                                : isArmor
                                ? "bg-sky-950/60 border-sky-500/40 text-sky-300"
                                : "bg-amber-950/60 border-amber-500/40 text-amber-300"
                            }`}
                          >
                            {isWeapon ? (
                              <Sword className="w-6 h-6" />
                            ) : isArmor ? (
                              <Shield className="w-6 h-6" />
                            ) : (
                              <Sparkles className="w-6 h-6" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">
                            System Asset Manifested
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name & Stat Modifier */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-sm text-white font-mono leading-snug group-hover:text-rose-300 transition-colors">
                        {item.name}
                      </h3>
                      <div className="inline-block px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/10 text-[11px] font-mono text-amber-300 font-bold">
                        {item.effect}
                      </div>
                    </div>

                    {/* Description generated by the LLM */}
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed line-clamp-4 pt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer Card Status */}
                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-emerald-400 select-none">
                    <span className="flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assigned to {item.type}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">
                      Starting Gear
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Confirmation Bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onBackToSetup}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Character Setup
          </button>

          <button
            type="button"
            onClick={onConfirmGearAndStart}
            className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-mono text-sm font-bold shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>
              Confirm Loadout &amp; Enter {settingName || "Astra Continent"} →
            </span>
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

