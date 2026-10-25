"use client";

import React from "react";
import {
  X,
  Sparkles,
  GitBranch,
  Swords,
  Share2,
  Users,
  Scroll,
  Save,
  Bell,
  Volume2,
  VolumeX,
  Compass,
  Zap,
  Terminal,
  Cpu,
  User,
  CheckCircle2,
  MapPin,
  Key,
} from "lucide-react";

export interface MobileCommandSheetProps {
  isOpen: boolean;
  onClose: () => void;
  // Tactical Tools
  onGenerateSceneCG: () => void;
  isGeneratingScene: boolean;
  onOpenFlowchart: () => void;
  onOpenScarsModal: () => void;
  timelineScarsCount: number;
  // Character & Systems
  onOpenPlayerSheet: () => void;
  onOpenPartyDrawer: () => void;
  partyCount: number;
  onOpenSystemModal: () => void;
  hasUnclaimedClearance: boolean;
  onOpenCodex: () => void;
  onOpenMap?: () => void;
  locationName?: string;
  // Progression & Multiverse
  onNavigateToTrials: () => void;
  onOpenShareModal: () => void;
  onOpenSaveModal: () => void;
  isAutoSaved?: boolean;
  onOpenChronicle: () => void;
  memoriesCount: number;
  // Settings & Engine
  onOpenLlmModal: () => void;
  llmConfigName: string;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onOpenAuthModal?: () => void;
  userAuthName?: string;
}

export function MobileCommandSheet({
  isOpen,
  onClose,
  onGenerateSceneCG,
  isGeneratingScene,
  onOpenFlowchart,
  onOpenScarsModal,
  timelineScarsCount,
  onOpenPlayerSheet,
  onOpenPartyDrawer,
  partyCount,
  onOpenSystemModal,
  hasUnclaimedClearance,
  onOpenCodex,
  onOpenMap,
  locationName,
  onNavigateToTrials,
  onOpenShareModal,
  onOpenSaveModal,
  isAutoSaved,
  onOpenChronicle,
  memoriesCount,
  onOpenLlmModal,
  llmConfigName,
  onOpenNotifications,
  unreadNotificationsCount,
  isAudioMuted,
  onToggleAudio,
  onOpenAuthModal,
  userAuthName,
}: MobileCommandSheetProps) {
  if (!isOpen) return null;

  const handleAction = (cb: () => void) => {
    onClose();
    cb();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none animate-in fade-in duration-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-zinc-950/98 border-t border-rose-500/30 rounded-t-3xl p-5 max-h-[85dvh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out overflow-hidden"
      >
        {/* Drag Handle & Header */}
        <div className="flex flex-col items-center gap-2 mb-4 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
          <div className="w-full flex items-center justify-between pt-1 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-300">
                <Terminal className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white font-mono tracking-wider">COMMAND DOCK</h2>
              {isAutoSaved && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-saved
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {/* CATEGORY 1: TACTICAL TOOLS & STORY VISUALS */}
          <div>
            <p className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-widest mb-2 px-1">
              Tactical & Story Engine
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onGenerateSceneCG)}
                disabled={isGeneratingScene}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-rose-200">
                    {isGeneratingScene ? "Synthesizing..." : "Illustrate Scene"}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Nano Banana CG
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenFlowchart)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-cyan-200">
                    Flowchart
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Timeline Branches
                  </span>
                </div>
              </button>

              {timelineScarsCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenScarsModal)}
                  className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 hover:border-purple-300 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm col-span-2"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-400/50 flex items-center justify-center text-purple-300 group-hover:scale-105 transition-transform shrink-0">
                    <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-purple-200 block truncate">
                      Timeline Scars ({timelineScarsCount})
                    </span>
                    <span className="text-[10px] text-purple-300/80 font-mono block truncate">
                      Permanent Reality Distortions Active
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY 2: HERO & LITRPG SYSTEMS */}
          <div>
            <p className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest mb-2 px-1">
              Character & Party
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onOpenPlayerSheet)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-amber-200">
                    Character Sheet
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Stats & Inventory
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenPartyDrawer)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-rose-200">
                      Party & Favor
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300">
                      {partyCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Affection Matrix
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenSystemModal)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/40 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm relative overflow-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                  <Terminal className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-rose-200">
                      System Quests
                    </span>
                    {hasUnclaimedClearance && (
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-black animate-pulse">
                        READY
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Scenarios & Admin
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenCodex)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-emerald-200">
                    Codex & Travel
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    CGs & Reliquary
                  </span>
                </div>
              </button>

              {onOpenMap && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenMap)}
                  className="p-3 rounded-2xl bg-zinc-900/90 border border-teal-500/30 hover:border-teal-400 hover:bg-teal-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-teal-950/60 border border-teal-500/40 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-teal-200">
                      Area Map
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block truncate">
                      {locationName || "Sectors & Realm"}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY 3: PROGRESSION & MULTIVERSE */}
          <div>
            <p className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-widest mb-2 px-1">
              Progression & Multiverse
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onNavigateToTrials)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Swords className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-blue-200">
                    Daily Trials
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Roguelite Arena
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenShareModal)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-purple-200">
                    Share World
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Multiverse Seed
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenSaveModal)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Save className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-amber-200">
                    Save / Load Slots
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Manual Archives
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenChronicle)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-500/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shrink-0">
                  <Scroll className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-sky-200">
                      Chronicle Log
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300">
                      {memoriesCount}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Unlocked Memories
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* CATEGORY 4: ENGINE & SETTINGS */}
          <div>
            <p className="text-[10px] font-mono uppercase text-zinc-400 font-bold tracking-widest mb-2 px-1">
              Engine & Settings
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onOpenLlmModal)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/15 flex items-center justify-center text-zinc-300 group-hover:scale-105 transition-transform shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 block truncate">
                    AI Engine
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    {llmConfigName || "DeepSeek"}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenNotifications)}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-rose-400/50 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm relative"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/15 flex items-center justify-center text-zinc-300 group-hover:scale-105 transition-transform shrink-0">
                  <Bell className="w-4 h-4 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-100 block truncate">
                      Notifications
                    </span>
                    {unreadNotificationsCount > 0 && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-600 text-white">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Broadcast Archive
                  </span>
                </div>
              </button>

              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenAuthModal)}
                  className="p-3 rounded-2xl bg-zinc-900/90 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-zinc-100 block truncate group-hover:text-purple-200">
                      Realm Key
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block truncate">
                      {userAuthName || "Quota & Access"}
                    </span>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleAudio}
                className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/30 flex items-center gap-3 transition-all cursor-pointer text-left group shadow-sm col-span-2"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/15 flex items-center justify-center text-zinc-300 shrink-0">
                  {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-zinc-100 block truncate">
                    {isAudioMuted ? "Sound Muted" : "Sound Enabled"}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono block truncate">
                    Atmospheric Audio & Sound Effects
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400">
                  {isAudioMuted ? "OFF" : "ON"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

