"use client";

import React, { useEffect } from "react";
import { Terminal, CheckCircle2, AlertTriangle, Sparkles, X } from "lucide-react";
import { SystemToastNotification, QuestDifficulty } from "@/types/system";

interface SystemNotificationToastProps {
  notification: SystemToastNotification | null;
  onClose: () => void;
  onOpenSystemWindow: () => void;
}

const DIFFICULTY_COLORS: Record<QuestDifficulty, string> = {
  E: "text-emerald-300 border-emerald-500/50 bg-emerald-950/60",
  D: "text-green-300 border-green-500/50 bg-green-950/60",
  C: "text-cyan-300 border-cyan-500/50 bg-cyan-950/60",
  B: "text-blue-300 border-blue-500/50 bg-blue-950/60",
  A: "text-purple-300 border-purple-500/50 bg-purple-950/60",
  S: "text-amber-300 border-amber-500/50 bg-amber-950/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
  Calamity: "text-rose-400 border-rose-500/80 bg-rose-950/80 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse",
};

export function SystemNotificationToast({
  notification,
  onClose,
  onOpenSystemWindow,
}: SystemNotificationToastProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isAlert = notification.type === "system_alert";
  const isCompleted = notification.type === "quest_completed";

  return (
    <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        onClick={onOpenSystemWindow}
        className={`pointer-events-auto max-w-md w-full relative overflow-hidden rounded-2xl p-4 cursor-pointer select-none transition-all duration-300 shadow-2xl backdrop-blur-xl border-2 transform animate-in slide-in-from-top-6 duration-300 ${
          isAlert
            ? "bg-rose-950/90 border-rose-500 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.4)]"
            : isCompleted
            ? "bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_35px_rgba(52,211,153,0.4)]"
            : "bg-cyan-950/90 border-cyan-400/80 text-cyan-50 shadow-[0_0_40px_rgba(6,182,212,0.45)]"
        }`}
      >
        {/* Holographic Scanlines Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Geometric Corner Brackets (Manhwa Style) */}
        <span className="absolute top-1 left-1 text-[10px] font-mono text-cyan-400/70 select-none">┌</span>
        <span className="absolute top-1 right-1 text-[10px] font-mono text-cyan-400/70 select-none">┐</span>
        <span className="absolute bottom-1 left-1 text-[10px] font-mono text-cyan-400/70 select-none">└</span>
        <span className="absolute bottom-1 right-1 text-[10px] font-mono text-cyan-400/70 select-none">┘</span>

        <div className="flex items-start gap-3 relative z-10">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isAlert
                ? "bg-rose-900/60 border-rose-400 text-rose-300"
                : isCompleted
                ? "bg-emerald-900/60 border-emerald-400 text-emerald-300"
                : "bg-cyan-900/60 border-cyan-300 text-cyan-300"
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
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
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
            <p className="text-xs text-cyan-200/80 line-clamp-2 mt-0.5 leading-relaxed font-sans">
              {notification.subtitle}
            </p>

            <span className="text-[9px] font-mono text-cyan-400/60 block mt-1 hover:underline">
              Tap to open System Interface →
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-cyan-400/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemNotificationToast;
