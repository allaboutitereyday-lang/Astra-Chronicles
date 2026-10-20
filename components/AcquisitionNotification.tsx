"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Award, Package, Shield, Zap } from "lucide-react";

export interface AcquisitionAlertData {
  id: string;
  type: "skill" | "level" | "loot";
  title: string;
  subtitle: string;
}

interface AcquisitionNotificationProps {
  alert: AcquisitionAlertData | null;
  onDismiss: () => void;
}

export function AcquisitionNotification({ alert, onDismiss }: AcquisitionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      // Trigger smooth fluid fade-in
      const inTimer = setTimeout(() => setIsVisible(true), 20);
      const outTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 600); // Wait for fade-out transition
      }, 4500);

      return () => {
        clearTimeout(inTimer);
        clearTimeout(outTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [alert, onDismiss]);

  if (!alert) return null;

  const isSkill = alert.type === "skill";
  const isLevel = alert.type === "level";

  return (
    <div className="fixed top-16 inset-x-0 z-50 flex justify-center pointer-events-none px-4 select-none">
      <div
        className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 sm:px-6 sm:py-3.5 backdrop-blur-2xl border-2 transition-all duration-700 ease-out transform shadow-2xl flex items-center gap-4 max-w-lg w-full ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95"
        } ${
          isSkill
            ? "bg-zinc-950/95 border-rose-500/70 text-rose-100 shadow-[0_0_40px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/30"
            : isLevel
            ? "bg-zinc-950/95 border-amber-500/70 text-amber-100 shadow-[0_0_40px_rgba(245,158,11,0.35)] ring-1 ring-amber-500/30"
            : "bg-zinc-950/95 border-sky-500/70 text-sky-100 shadow-[0_0_40px_rgba(14,165,233,0.35)] ring-1 ring-sky-500/30"
        }`}
      >
        {/* Subtle Ambient Radial Backlight */}
        <div
          className="absolute -inset-4 rounded-full blur-2xl opacity-30 pointer-events-none transition-all duration-700"
          style={{
            background: isSkill
              ? "radial-gradient(circle, rgba(244,63,94,0.6) 0%, transparent 70%)"
              : isLevel
              ? "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(14,165,233,0.6) 0%, transparent 70%)",
          }}
        />

        {/* Manhwa Fantasy Corner Glyphs */}
        <span className="absolute top-1 left-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">┌</span>
        <span className="absolute top-1 right-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">┐</span>
        <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">└</span>
        <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-rose-400/50 pointer-events-none">┘</span>

        {/* Leading Glowing Icon Badge */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border relative z-10 ${
            isSkill
              ? "bg-rose-950/80 border-rose-400/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
              : isLevel
              ? "bg-amber-950/80 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              : "bg-sky-950/80 border-sky-400/60 text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.5)]"
          }`}
        >
          {isSkill ? (
            <Sparkles className="w-5 h-5 animate-pulse text-rose-300" />
          ) : isLevel ? (
            <Award className="w-5 h-5 animate-bounce text-amber-300" />
          ) : (
            <Package className="w-5 h-5 text-sky-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-mono tracking-widest uppercase font-bold ${
                isSkill
                  ? "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                  : isLevel
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  : "text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]"
              }`}
            >
              {alert.title}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase px-1.5 py-0.2 rounded border border-white/10 bg-black/40">
              {alert.type}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {alert.subtitle}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default AcquisitionNotification;
