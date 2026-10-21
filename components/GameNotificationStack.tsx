"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Award,
  Package,
  Zap,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  X,
  BookOpen,
  RotateCcw,
  Skull,
  Bell,
} from "lucide-react";
import { QuestDifficulty } from "@/types/system";
import { soundEffects } from "@/lib/audioEngine";

export type NotificationType =
  | "quest_assigned"
  | "quest_completed"
  | "quest_updated"
  | "quest_failed"
  | "penalty_quest"
  | "regression_trigger"
  | "system_alert"
  | "loot"
  | "skill"
  | "level"
  | "codex";

export interface GameNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  imageUrl?: string;
  rarity?: "common" | "uncommon" | "rare" | "relic" | "cursed";
  difficulty?: QuestDifficulty;
  timestamp?: string;
  durationMs?: number;
  metadata?: any;
}

export interface GameNotificationStackProps {
  notifications: GameNotificationItem[];
  onDismiss: (id: string) => void;
  onOpenSystemWindow?: () => void;
  onInspectItem?: (item: any) => void;
  onOpenHistory?: () => void;
  maxVisible?: number;
  staggerDelayMs?: number;
}

const DIFFICULTY_BADGES: Record<QuestDifficulty, string> = {
  E: "text-emerald-300 border-emerald-500/50 bg-emerald-950/60",
  D: "text-green-300 border-green-500/50 bg-green-950/60",
  C: "text-sky-300 border-sky-500/50 bg-sky-950/60",
  B: "text-purple-300 border-purple-500/50 bg-purple-950/60",
  A: "text-rose-300 border-rose-500/60 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
  S: "text-amber-300 border-amber-500/60 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
  Calamity: "text-rose-400 border-rose-500/80 bg-rose-950/80 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse",
};

interface NotificationCardProps {
  item: GameNotificationItem;
  onDismiss: (id: string) => void;
  onOpenSystemWindow?: () => void;
  onInspectItem?: (item: any) => void;
}

function NotificationCard({
  item,
  onDismiss,
  onOpenSystemWindow,
  onInspectItem,
}: NotificationCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);

  const duration =
    item.durationMs ||
    (item.type === "level" || item.type === "regression_trigger" || item.difficulty === "Calamity"
      ? 6500
      : 5000);

  useEffect(() => {
    // Smooth lateral entrance
    const enterTimer = setTimeout(() => setIsVisible(true), 25);
    return () => clearTimeout(enterTimer);
  }, []);

  // Duration countdown timer
  useEffect(() => {
    if (isHovered) return; // Pause timer on hover

    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(item.id), 280);
    }, duration);

    return () => clearTimeout(dismissTimer);
  }, [item.id, duration, isHovered, onDismiss]);

  // Smooth progress bar calculation
  useEffect(() => {
    if (isHovered) return;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isHovered]);

  const handleManualDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => onDismiss(item.id), 250);
  };

  const handleCardClick = () => {
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
      onOpenSystemWindow?.();
    } else if (item.type === "loot" && item.metadata) {
      onInspectItem?.(item.metadata);
    }
  };

  // Theming & Accents
  const getThemeClasses = () => {
    switch (item.type) {
      case "quest_completed":
        return {
          card: "bg-zinc-950/95 border-amber-500/70 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/30",
          iconBg: "bg-amber-950/80 border-amber-400 text-amber-300",
          accentColor: "#f59e0b",
        };
      case "quest_assigned":
        return {
          card: "bg-zinc-950/95 border-sky-500/70 text-sky-100 shadow-[0_0_35px_rgba(14,165,233,0.35)] ring-1 ring-sky-500/30",
          iconBg: "bg-sky-950/80 border-sky-400 text-sky-300",
          accentColor: "#0ea5e9",
        };
      case "quest_failed":
        return {
          card: "bg-zinc-950/95 border-red-600 text-red-100 shadow-[0_0_40px_rgba(220,38,38,0.45)] ring-1 ring-red-600/40",
          iconBg: "bg-red-950/90 border-red-500 text-red-400",
          accentColor: "#dc2626",
        };
      case "penalty_quest":
        return {
          card: "bg-purple-950/95 border-purple-500 text-purple-100 shadow-[0_0_45px_rgba(168,85,247,0.5)] ring-1 ring-purple-500/50 animate-pulse",
          iconBg: "bg-purple-900/90 border-purple-400 text-purple-300",
          accentColor: "#a855f7",
        };
      case "regression_trigger":
        return {
          card: "bg-cyan-950/95 border-cyan-400 text-cyan-100 shadow-[0_0_45px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400/50",
          iconBg: "bg-cyan-900/90 border-cyan-300 text-cyan-200",
          accentColor: "#22d3ee",
        };
      case "system_alert":
        return {
          card: "bg-rose-950/95 border-rose-500 text-rose-100 shadow-[0_0_40px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/40",
          iconBg: "bg-rose-900/80 border-rose-400 text-rose-300",
          accentColor: "#f43f5e",
        };
      case "skill":
        return {
          card: "bg-zinc-950/95 border-rose-500/70 text-rose-100 shadow-[0_0_40px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/30",
          iconBg: "bg-rose-950/80 border-rose-400 text-rose-300",
          accentColor: "#f43f5e",
        };
      case "level":
        return {
          card: "bg-zinc-950/95 border-amber-400/80 text-amber-100 shadow-[0_0_40px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/40",
          iconBg: "bg-amber-950/80 border-amber-400 text-amber-300",
          accentColor: "#fbbf24",
        };
      case "codex":
        return {
          card: "bg-zinc-950/95 border-purple-500/70 text-purple-100 shadow-[0_0_35px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/30",
          iconBg: "bg-purple-950/80 border-purple-400 text-purple-300",
          accentColor: "#a855f7",
        };
      case "loot": {
        const rarity = item.rarity || "rare";
        if (rarity === "cursed") {
          return {
            card: "bg-zinc-950/95 border-rose-500/70 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.4)] ring-1 ring-rose-500/30",
            iconBg: "bg-rose-950/80 border-rose-400 text-rose-300",
            accentColor: "#e11d48",
          };
        }
        if (rarity === "relic") {
          return {
            card: "bg-zinc-950/95 border-amber-400/80 text-amber-100 shadow-[0_0_40px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/30",
            iconBg: "bg-amber-950/80 border-amber-400 text-amber-300",
            accentColor: "#f59e0b",
          };
        }
        if (rarity === "uncommon") {
          return {
            card: "bg-zinc-950/95 border-emerald-500/70 text-emerald-100 shadow-[0_0_30px_rgba(52,211,153,0.3)] ring-1 ring-emerald-500/30",
            iconBg: "bg-emerald-950/80 border-emerald-400 text-emerald-300",
            accentColor: "#10b981",
          };
        }
        return {
          card: "bg-zinc-950/95 border-sky-500/70 text-sky-100 shadow-[0_0_35px_rgba(14,165,233,0.35)] ring-1 ring-sky-500/30",
          iconBg: "bg-sky-950/80 border-sky-400 text-sky-300",
          accentColor: "#0ea5e9",
        };
      }
      default:
        return {
          card: "bg-zinc-950/95 border-rose-500/60 text-zinc-100 shadow-[0_0_35px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/20",
          iconBg: "bg-rose-950/80 border-rose-500/50 text-rose-300",
          accentColor: "#f43f5e",
        };
    }
  };

  const theme = getThemeClasses();
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-3.5 sm:p-4 backdrop-blur-2xl border-2 shadow-2xl transition-all duration-400 ease-out transform max-w-sm sm:max-w-md w-full select-none ${
        isInteractive ? "cursor-pointer hover:scale-[1.01]" : ""
      } ${
        isVisible
          ? "opacity-100 translate-x-0 scale-100"
          : "opacity-0 translate-x-10 scale-95"
      } ${theme.card}`}
    >
      {/* Ambient Radial Backlight */}
      <div
        className="absolute -inset-4 rounded-full blur-2xl opacity-25 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top left, ${theme.accentColor} 0%, transparent 70%)`,
        }}
      />

      {/* LitRPG Corner Glyphs */}
      <span className="absolute top-1 left-1.5 text-[8px] font-mono text-rose-400/50 pointer-events-none">┌</span>
      <span className="absolute top-1 right-1.5 text-[8px] font-mono text-rose-400/50 pointer-events-none">┐</span>
      <span className="absolute bottom-1 left-1.5 text-[8px] font-mono text-rose-400/50 pointer-events-none">└</span>
      <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-rose-400/50 pointer-events-none">┘</span>

      <div className="flex items-start gap-3 relative z-10">
        {/* Leading Visual / Thumbnail */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border relative overflow-hidden shadow-lg ${theme.iconBg}`}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover rounded-lg" />
          ) : item.type === "system_alert" ? (
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          ) : item.type === "quest_failed" ? (
            <Skull className="w-5 h-5 text-red-400 animate-pulse" />
          ) : item.type === "penalty_quest" ? (
            <AlertTriangle className="w-5 h-5 text-purple-300 animate-bounce" />
          ) : item.type === "regression_trigger" ? (
            <RotateCcw className="w-5 h-5 text-cyan-300 animate-spin" />
          ) : item.type === "quest_completed" ? (
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
          ) : item.type === "skill" ? (
            <Sparkles className="w-5 h-5 animate-pulse text-rose-300" />
          ) : item.type === "level" ? (
            <Award className="w-5 h-5 animate-bounce text-amber-300" />
          ) : item.type === "codex" ? (
            <BookOpen className="w-5 h-5 text-purple-300" />
          ) : item.type === "loot" ? (
            <Package className="w-5 h-5" />
          ) : (
            <Terminal className="w-5 h-5" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-rose-300">
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
          </div>

          <p className="text-xs text-zinc-200 font-sans mt-0.5 leading-snug line-clamp-2">
            {item.subtitle}
          </p>

          <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-zinc-500">
            {item.type.startsWith("quest") || item.type === "penalty_quest" || item.type === "regression_trigger" ? (
              <span className="text-rose-400/80 hover:underline">Click to view in System Interface →</span>
            ) : item.type === "loot" && item.metadata ? (
              <span className="text-amber-400/80 hover:underline">Click to inspect artifact →</span>
            ) : (
              <span>LitRPG Matrix Broadcast</span>
            )}
            <span>{item.timestamp || "Just now"}</span>
          </div>
        </div>

        {/* Manual Dismiss Button */}
        <button
          type="button"
          onClick={handleManualDismiss}
          className="absolute top-0 right-0 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress countdown indicator */}
      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-black/50 overflow-hidden">
        <div
          className="h-full transition-all duration-75 ease-linear opacity-90"
          style={{
            width: `${progress}%`,
            backgroundColor: theme.accentColor,
          }}
        />
      </div>
    </div>
  );
}

export function GameNotificationStack({
  notifications,
  onDismiss,
  onOpenSystemWindow,
  onInspectItem,
  onOpenHistory,
  maxVisible = 2,
  staggerDelayMs = 750,
}: GameNotificationStackProps) {
  const [visibleItems, setVisibleItems] = useState<GameNotificationItem[]>([]);
  const pendingQueueRef = useRef<GameNotificationItem[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const seenIdsRef = useRef<Set<string>>(new Set<string>());
  const staggerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [queueTick, setQueueTick] = useState<number>(0);

  // Clear running stagger timer on unmount
  useEffect(() => {
    return () => {
      if (staggerTimerRef.current) {
        clearTimeout(staggerTimerRef.current);
        staggerTimerRef.current = null;
      }
    };
  }, []);

  // Synchronize incoming notifications into pending queue
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      pendingQueueRef.current = [];
      setVisibleItems([]);
      setPendingCount(0);
      return;
    }

    let addedNew = false;
    notifications.forEach((notif) => {
      if (!seenIdsRef.current.has(notif.id)) {
        seenIdsRef.current.add(notif.id);
        pendingQueueRef.current.push(notif);
        addedNew = true;
      }
    });

    // Reconcile updates to already visible items (e.g. metadata or image updates)
    setVisibleItems((prev) =>
      prev.map((vis) => {
        const updated = notifications.find((n) => n.id === vis.id);
        return updated ? { ...vis, ...updated } : vis;
      })
    );

    if (addedNew) {
      setPendingCount(pendingQueueRef.current.length);
      setQueueTick((t) => t + 1);
    }
  }, [notifications]);

  // Sequential queue processor: releases notifications one at a time with staggerDelay
  useEffect(() => {
    // If a stagger timer is already in progress, let it run
    if (staggerTimerRef.current) return;
    if (pendingQueueRef.current.length === 0) return;
    if (visibleItems.length >= maxVisible) return;

    // Pop the next valid item from queue that exists in current notifications
    let nextItem: GameNotificationItem | undefined;
    while (pendingQueueRef.current.length > 0) {
      const candidate = pendingQueueRef.current.shift();
      if (!candidate) break;
      if (notifications.some((n) => n.id === candidate.id)) {
        nextItem = candidate;
        break;
      }
    }

    if (!nextItem) {
      setPendingCount(pendingQueueRef.current.length);
      return;
    }

    try {
      soundEffects.playSystemNotification();
    } catch {
      // Audio engine fallback
    }

    setVisibleItems((prev) => [...prev, nextItem!]);
    setPendingCount(pendingQueueRef.current.length);

    // Schedule next staggered release without clearing when visibleItems changes
    staggerTimerRef.current = setTimeout(() => {
      staggerTimerRef.current = null;
      setQueueTick((t) => t + 1);
    }, staggerDelayMs);
  }, [visibleItems.length, queueTick, maxVisible, staggerDelayMs, notifications]);

  const handleCardDismiss = (id: string) => {
    setVisibleItems((prev) => prev.filter((item) => item.id !== id));
    onDismiss(id);
    setQueueTick((t) => t + 1);
  };

  const handleFlushNext = () => {
    if (staggerTimerRef.current) {
      clearTimeout(staggerTimerRef.current);
      staggerTimerRef.current = null;
    }
    if (pendingQueueRef.current.length > 0) {
      const nextItem = pendingQueueRef.current.shift();
      if (nextItem) {
        try {
          soundEffects.playSystemNotification();
        } catch {}
        setVisibleItems((prev) => [...prev, nextItem]);
        setPendingCount(pendingQueueRef.current.length);
      }
    }
  };

  if (visibleItems.length === 0 && pendingCount === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-16 sm:top-20 right-3 sm:right-6 md:right-8 z-50 pointer-events-none flex flex-col items-end gap-3 max-w-sm sm:max-w-md w-full transition-all"
    >
      {visibleItems.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          onDismiss={handleCardDismiss}
          onOpenSystemWindow={onOpenSystemWindow}
          onInspectItem={onInspectItem}
        />
      ))}

      {/* Subtle, reassuring indicator when subsequent alerts are waiting in queue */}
      {pendingCount > 0 && (
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/95 border border-rose-500/40 hover:border-rose-400 text-[10px] font-mono text-zinc-300 shadow-xl backdrop-blur-md transition-all select-none group">
          <button
            type="button"
            onClick={() => onOpenHistory?.()}
            className="flex items-center gap-1.5 hover:text-white cursor-pointer"
            title="Open Notification Archive"
          >
            <Bell className="w-3.5 h-3.5 text-rose-400 animate-bounce group-hover:scale-110 transition-transform" />
            <span>
              +{pendingCount} more update{pendingCount > 1 ? "s" : ""} queued
            </span>
            {onOpenHistory && (
              <span className="text-[9px] text-rose-400 underline ml-0.5">Archive</span>
            )}
          </button>
          <div className="w-[1px] h-3 bg-white/20" />
          <button
            type="button"
            onClick={handleFlushNext}
            className="hover:text-amber-300 text-zinc-400 cursor-pointer text-[9px]"
            title="Display next notification immediately"
          >
            Show Now ⏭
          </button>
        </div>
      )}
    </div>
  );
}

export default GameNotificationStack;
