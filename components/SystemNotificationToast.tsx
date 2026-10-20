"use client";

import React, { useEffect, useState } from "react";
import { Terminal, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { SystemToastNotification, QuestDifficulty } from "@/types/system";

interface SystemNotificationToastProps {
  notification: SystemToastNotification | null;
  onClose: () => void;
  onOpenSystemWindow: () => void;
}

const DIFFICULTY_COLORS: Record<QuestDifficulty, string> = {
  E: "text-emerald-300 border-emerald-500/50 bg-emerald-950/60",
  D: "text-green-300 border-green-500/50 bg-green-950/60",
  C: "text-sky-300 border-sky-500/50 bg-sky-950/60",
  B: "text-purple-300 border-purple-500/50 bg-purple-950/60",
  A: "text-rose-300 border-rose-500/60 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]",
  S: "text-amber-300 border-amber-500/60 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
  Calamity: "text-rose-400 border-rose-500/80 bg-rose-950/80 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse",
};

export function SystemNotificationToast({
  notification,
  onClose,
  onOpenSystemWindow,
}: SystemNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      const inTimer = setTimeout(() => setIsVisible(true), 20);
      const outTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 600);
      }, 5500);

      return () => {
        clearTimeout(inTimer);
        clearTimeout(outTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const isAlert = notification.type === "system_alert";
  const isCompleted = notification.type === "quest_completed";

  return (
    <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none select-none">
      <div
        onClick={onOpenSystemWindow}
        className={`pointer-events-auto max-w-md w-full relative overflow-hidden rounded-2xl p-4 cursor-pointer select-none transition-all duration-700 ease-out shadow-2xl backdrop-blur-2xl border-2 transform ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
        } ${
          isAlert
            ? "bg-rose-950/95 border-rose-500 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/30"
            : isCompleted
            ? "bg-zinc-950/95 border-amber-500/70 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/30"
            : "bg-zinc-950/95 border-rose-500/60 text-zinc-100 shadow-[0_0_35px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/20"
        }`}
      >
        {/* Ambient Radial Backlight */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: isAlert
              ? "radial-gradient(circle at top left, rgba(244,63,94,0.4) 0%, transparent 70%)"
              : isCompleted
              ? "radial-gradient(circle at top left, rgba(245,158,11,0.35) 0%, transparent 70%)"
              : "radial-gradient(circle at top left, rgba(244,63,94,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Geometric Corner Brackets */}
        <span className="absolute top-1 left-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">┌</span>
        <span className="absolute top-1 right-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">┐</span>
        <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">└</span>
        <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">┘</span>

        <div className="flex items-start gap-3 relative z-10">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isAlert
                ? "bg-rose-900/60 border-rose-400 text-rose-300"
                : isCompleted
                ? "bg-amber-950/80 border-amber-400 text-amber-300"
                : "bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
            }`}
          >
            {isAlert ? (
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-5 h-5 animate-pulse" />
            ) : (
              <Terminal className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-[10px] font-mono tracking-widest uppercase font-bold ${
                  isAlert
                    ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                    : isCompleted
                    ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    : "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                }`}
              >
                {isAlert
                  ? "[ SYSTEM ALERT ]"
                  : isCompleted
                  ? "[ SYSTEM : QUEST COMPLETED ]"
                  : "[ SYSTEM NOTIFICATION ]"}
              </span>
              {notification.difficulty && (
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    DIFFICULTY_COLORS[notification.difficulty]
                  }`}
                >
                  {notification.difficulty}-RANK
                </span>
              )}
            </div>

            <h4 className="font-bold text-sm text-white tracking-wide truncate drop-shadow-sm">
              {notification.title}
            </h4>
            <p className="text-xs text-zinc-300/90 line-clamp-2 mt-0.5 leading-relaxed font-sans">
              {notification.subtitle}
            </p>

            <span className="text-[9px] font-mono text-rose-400/70 block mt-1 hover:text-rose-300">
              Tap to open System Interface →
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(onClose, 600);
            }}
            className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemNotificationToast;
