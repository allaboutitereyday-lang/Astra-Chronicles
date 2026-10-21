"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Bell,
  BellOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Award,
  Package,
  Terminal,
  BookOpen,
  RotateCcw,
  Skull,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";
import { GameNotificationItem, NotificationType } from "./GameNotificationStack";
import { QuestDifficulty } from "@/types/system";
import { soundEffects } from "@/lib/audioEngine";

export interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GameNotificationItem[];
  onClearHistory: () => void;
  onDismissItem?: (id: string) => void;
  onOpenSystemWindow?: () => void;
  onInspectItem?: (item: any) => void;
}

type FilterCategory = "all" | "quests" | "loot" | "progression" | "system";

const DIFFICULTY_BADGES: Record<QuestDifficulty, string> = {
  E: "text-emerald-300 border-emerald-500/50 bg-emerald-950/60",
  D: "text-green-300 border-green-500/50 bg-green-950/60",
  C: "text-sky-300 border-sky-500/50 bg-sky-950/60",
  B: "text-purple-300 border-purple-500/50 bg-purple-950/60",
  A: "text-rose-300 border-rose-500/60 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
  S: "text-amber-300 border-amber-500/60 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
  Calamity: "text-rose-400 border-rose-500/80 bg-rose-950/80 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse",
};

export function NotificationHistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDismissItem,
  onOpenSystemWindow,
  onInspectItem,
}: NotificationHistoryModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset confirmation state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      setSearchQuery("");
    }
  }, [isOpen]);

  const categoryCounts = useMemo(() => {
    const counts = {
      all: history.length,
      quests: 0,
      loot: 0,
      progression: 0,
      system: 0,
    };

    history.forEach((item) => {
      if (item.type.startsWith("quest")) counts.quests++;
      else if (item.type === "loot") counts.loot++;
      else if (["skill", "level", "codex"].includes(item.type)) counts.progression++;
      else if (["system_alert", "penalty_quest", "regression_trigger"].includes(item.type)) counts.system++;
    });

    return counts;
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Category filter
      if (activeFilter === "quests" && !item.type.startsWith("quest")) return false;
      if (activeFilter === "loot" && item.type !== "loot") return false;
      if (activeFilter === "progression" && !["skill", "level", "codex"].includes(item.type)) return false;
      if (activeFilter === "system" && !["system_alert", "penalty_quest", "regression_trigger"].includes(item.type)) return false;

      // Text search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const subMatch = item.subtitle?.toLowerCase().includes(query);
        const typeMatch = item.type.toLowerCase().includes(query);
        const rarityMatch = item.rarity?.toLowerCase().includes(query);
        return titleMatch || subMatch || typeMatch || rarityMatch;
      }

      return true;
    });
  }, [history, activeFilter, searchQuery]);

  if (!isOpen) return null;

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    soundEffects.playClick();
    onClearHistory();
    setConfirmClear(false);
  };

  const handleItemClick = (item: GameNotificationItem) => {
    if (
      [
        "quest_assigned",
        "quest_completed",
        "quest_updated",
        "quest_failed",
        "penalty_quest",
        "regression_trigger",
        "system_alert",
      ].includes(item.type)
    ) {
      soundEffects.playClick();
      onOpenSystemWindow?.();
      onClose();
    } else if (item.type === "loot" && item.metadata) {
      soundEffects.playClick();
      onInspectItem?.(item.metadata);
      onClose();
    }
  };

  const getItemTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "quest_completed":
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      case "quest_assigned":
        return <Terminal className="w-4 h-4 text-sky-400" />;
      case "quest_failed":
        return <Skull className="w-4 h-4 text-red-400" />;
      case "penalty_quest":
        return <AlertTriangle className="w-4 h-4 text-purple-400" />;
      case "regression_trigger":
        return <RotateCcw className="w-4 h-4 text-cyan-400" />;
      case "system_alert":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case "skill":
        return <Sparkles className="w-4 h-4 text-rose-300" />;
      case "level":
        return <Award className="w-4 h-4 text-amber-400" />;
      case "codex":
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case "loot":
        return <Package className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getItemColorTheme = (item: GameNotificationItem) => {
    switch (item.type) {
      case "quest_completed":
        return "border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70";
      case "quest_assigned":
        return "border-sky-500/40 bg-sky-950/20 hover:border-sky-500/70";
      case "quest_failed":
        return "border-red-600/50 bg-red-950/30 hover:border-red-600/80";
      case "penalty_quest":
        return "border-purple-500/50 bg-purple-950/30 hover:border-purple-500/80";
      case "regression_trigger":
        return "border-cyan-500/50 bg-cyan-950/30 hover:border-cyan-500/80";
      case "system_alert":
        return "border-rose-500/40 bg-rose-950/25 hover:border-rose-500/70";
      case "loot":
        if (item.rarity === "relic") return "border-amber-500/50 bg-amber-950/25 hover:border-amber-400";
        if (item.rarity === "cursed") return "border-rose-600/60 bg-rose-950/30 hover:border-rose-500";
        if (item.rarity === "uncommon") return "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400";
        return "border-sky-500/40 bg-sky-950/20 hover:border-sky-400";
      case "skill":
      case "level":
        return "border-amber-500/40 bg-zinc-900/80 hover:border-amber-500/70";
      default:
        return "border-white/10 bg-zinc-900/60 hover:border-white/25";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh] animate-in zoom-in-95 duration-200"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/80 to-transparent" />

        {/* Corner Glyphs */}
        <span className="absolute top-1.5 left-2 text-[9px] font-mono text-rose-500/40 pointer-events-none">┌</span>
        <span className="absolute top-1.5 right-2 text-[9px] font-mono text-rose-500/40 pointer-events-none">┐</span>
        <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-rose-500/40 pointer-events-none">└</span>
        <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-rose-500/40 pointer-events-none">┘</span>

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)] shrink-0">
              <Bell className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-wide">
                  Notification Archive & Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300">
                  {history.length} {history.length === 1 ? "Broadcast" : "Broadcasts"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                LitRPG Matrix Telemetry • Quest updates, unlocked skills & relic acquisitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  confirmClear
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse"
                    : "bg-zinc-900/80 hover:bg-rose-950/50 border-white/10 hover:border-rose-500/50 text-zinc-400 hover:text-rose-300"
                }`}
                title={confirmClear ? "Click again to confirm clearing all history" : "Clear all notification history"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmClear ? "Confirm Clear?" : "Clear History"}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="px-5 py-3 border-b border-white/5 bg-zinc-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveFilter("all");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                activeFilter === "all"
                  ? "bg-rose-600/30 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                  : "bg-zinc-900/60 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              All ({categoryCounts.all})
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveFilter("quests");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                activeFilter === "quests"
                  ? "bg-sky-600/30 text-sky-300 border border-sky-500/60 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                  : "bg-zinc-900/60 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              Quests ({categoryCounts.quests})
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveFilter("loot");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                activeFilter === "loot"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  : "bg-zinc-900/60 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              Loot & Relics ({categoryCounts.loot})
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveFilter("progression");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                activeFilter === "progression"
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  : "bg-zinc-900/60 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              Progression ({categoryCounts.progression})
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveFilter("system");
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer shrink-0 ${
                activeFilter === "system"
                  ? "bg-rose-600/30 text-rose-300 border border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]"
                  : "bg-zinc-900/60 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              Alerts ({categoryCounts.system})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0 sm:w-56">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/80 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 font-mono focus:outline-none focus:border-rose-500/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar min-h-[240px]">
          {filteredHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center text-zinc-500">
              <div className="p-4 rounded-full bg-zinc-900/60 border border-white/5 mb-3">
                <BellOff className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-sm font-mono text-zinc-400">
                {searchQuery || activeFilter !== "all"
                  ? "No notifications matching your filter criteria"
                  : "Matrix Broadcast Chronicle Empty"}
              </p>
              <p className="text-xs text-zinc-600 font-sans max-w-sm mt-1">
                {searchQuery || activeFilter !== "all"
                  ? "Try resetting your filter or searching for a different keyword."
                  : "Telemetric updates, quest assignments, and item acquisitions will automatically record here as you journey."}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isInteractive = Boolean(
                [
                  "quest_assigned",
                  "quest_completed",
                  "quest_updated",
                  "quest_failed",
                  "penalty_quest",
                  "regression_trigger",
                  "system_alert",
                ].includes(item.type) ||
                  (item.type === "loot" && item.metadata)
              );

              return (
                <div
                  key={item.id}
                  onClick={() => isInteractive && handleItemClick(item)}
                  className={`group relative rounded-2xl p-3.5 border transition-all duration-200 flex items-start gap-3.5 ${
                    isInteractive ? "cursor-pointer" : ""
                  } ${getItemColorTheme(item)}`}
                >
                  {/* Thumbnail / Category Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/10 bg-zinc-950 relative overflow-hidden shadow-md">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      getItemTypeIcon(item.type)
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold tracking-wide text-white group-hover:text-rose-300 transition-colors">
                        {item.title}
                      </span>

                      {item.difficulty && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            DIFFICULTY_BADGES[item.difficulty] || DIFFICULTY_BADGES.C
                          }`}
                        >
                          Rank {item.difficulty}
                        </span>
                      )}

                      {item.rarity && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/60 border border-white/10 text-amber-300">
                          {item.rarity}
                        </span>
                      )}

                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-zinc-400">
                        {item.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                      {item.subtitle}
                    </p>

                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-zinc-500">
                      <div className="flex items-center gap-2">
                        {item.type.startsWith("quest") || item.type === "penalty_quest" || item.type === "regression_trigger" ? (
                          <span className="text-rose-400 group-hover:underline flex items-center gap-1">
                            Inspect in System Window <ArrowRight className="w-3 h-3" />
                          </span>
                        ) : item.type === "loot" && item.metadata ? (
                          <span className="text-amber-400 group-hover:underline flex items-center gap-1">
                            Inspect Artifact <ArrowRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span>LitRPG Broadcast Telemetry</span>
                        )}
                      </div>
                      <span>{item.timestamp || "Just now"}</span>
                    </div>
                  </div>

                  {/* Single Item Dismiss */}
                  {onDismissItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissItem(item.id);
                      }}
                      className="absolute top-2.5 right-2.5 p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Archive synchronizes automatically across sessions</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white transition-all cursor-pointer font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationHistoryModal;
