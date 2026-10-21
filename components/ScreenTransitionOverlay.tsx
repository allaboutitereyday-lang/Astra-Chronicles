"use client";

import React from "react";
import { Swords, BookOpen, Sparkles, ArrowLeft, RotateCcw, Compass, Shield, Terminal } from "lucide-react";

export interface ScreenTransitionConfig {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  theme?: "cyan" | "rose" | "amber" | "purple" | "emerald";
  icon?: "swords" | "book" | "sparkles" | "arrow" | "rotate" | "compass" | "shield" | "terminal";
}

export function ScreenTransitionOverlay({
  isOpen,
  title,
  subtitle = "Calibrating Spatial Strata • Synchronizing Timeline Reality...",
  theme = "cyan",
  icon = "swords",
}: ScreenTransitionConfig) {
  if (!isOpen) return null;

  const getThemeStyles = () => {
    switch (theme) {
      case "rose":
        return {
          glow: "from-rose-500/25 via-pink-500/15 to-transparent",
          border: "border-rose-500/40",
          iconBg: "bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.4)]",
          bar: "from-rose-500 via-pink-500 to-rose-400",
          accent: "text-rose-400",
        };
      case "amber":
        return {
          glow: "from-amber-500/25 via-yellow-500/15 to-transparent",
          border: "border-amber-500/40",
          iconBg: "bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.4)]",
          bar: "from-amber-500 via-yellow-500 to-amber-400",
          accent: "text-amber-400",
        };
      case "purple":
        return {
          glow: "from-purple-500/25 via-fuchsia-500/15 to-transparent",
          border: "border-purple-500/40",
          iconBg: "bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.4)]",
          bar: "from-purple-500 via-fuchsia-500 to-purple-400",
          accent: "text-purple-400",
        };
      case "emerald":
        return {
          glow: "from-emerald-500/25 via-teal-500/15 to-transparent",
          border: "border-emerald-500/40",
          iconBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.4)]",
          bar: "from-emerald-500 via-teal-500 to-emerald-400",
          accent: "text-emerald-400",
        };
      default: // cyan
        return {
          glow: "from-cyan-500/25 via-blue-500/15 to-transparent",
          border: "border-cyan-500/40",
          iconBg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.4)]",
          bar: "from-blue-500 via-cyan-400 to-teal-400",
          accent: "text-cyan-400",
        };
    }
  };

  const styles = getThemeStyles();

  const renderIcon = () => {
    const cls = "w-8 h-8";
    switch (icon) {
      case "book":
        return <BookOpen className={cls} />;
      case "sparkles":
        return <Sparkles className={cls} />;
      case "arrow":
        return <ArrowLeft className={cls} />;
      case "rotate":
        return <RotateCcw className={cls} />;
      case "compass":
        return <Compass className={cls} />;
      case "shield":
        return <Shield className={cls} />;
      case "terminal":
        return <Terminal className={cls} />;
      case "swords":
      default:
        return <Swords className={cls} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      {/* Background radial glow */}
      <div className={`absolute inset-0 bg-radial ${styles.glow} pointer-events-none opacity-40`} />
      <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

      {/* Centerpiece Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-6">
        {/* Pulsing Icon Emblem */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-3xl border ${styles.iconBg} flex items-center justify-center relative z-10 transition-transform duration-500 scale-100 hover:scale-105`}>
            {renderIcon()}
          </div>
          {/* Subtle Outer Ping Ripple */}
          <div className={`absolute inset-0 rounded-3xl border ${styles.border} animate-ping opacity-25`} />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <span className={`text-[10px] font-mono tracking-widest uppercase font-bold ${styles.accent} flex items-center justify-center gap-1.5`}>
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: "6s" }} />
            PLANAR CONDUIT SHIFT
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide drop-shadow-md">
            {title}
          </h2>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Shimmer Telemetry Progress Bar */}
        <div className="w-64 h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
          <div className={`h-full w-full bg-gradient-to-r ${styles.bar} animate-pulse`} />
        </div>
      </div>
    </div>
  );
}
