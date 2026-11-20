"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Map as MapIcon,
  Shirt,
  Camera,
  Sparkles,
  Flame,
  Heart,
  Shield,
  Crown,
  Wine,
  DollarSign,
  Clock,
  Info,
  AlertTriangle,
  Key,
  User,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import {
  ASH_VELVET_HEROINE_DOSSIERS,
  AshVelvetHouseState,
  AshVelvetTurnDeltaSummary,
} from "@/types/ash_and_velvet";
import {
  ASH_VELVET_TIME_SLOT_DISPLAY,
  getAffectionBondTier,
  getLustStateLabel,
  getSensitivityStageLabel,
  getSubmissionDynamicLabel,
  getViceLabel,
  isBedroomKeyUnlocked,
  resolveHeroineMeters,
  shortenAshVelvetLocation,
} from "@/lib/ashVelvetEngine";

export interface AshVelvetStageCompanion {
  id?: string;
  name: string;
  title?: string;
  affection?: number;
  lust?: number;
  sensitivity?: number;
  submission?: number;
  trust?: number;
  jealousy?: number;
  expressionKey: string;
  isPresent: boolean;
  encountered: boolean;
  activeWardrobe?: string;
  wardrobeLabels?: Record<string, string>;
  baseImageUrl?: string;
}

interface SegmentedGaugeProps {
  label: string;
  value: number;
  delta?: number;
  sublabel?: string;
  fillClass: (segmentIdx: number, total: number) => string;
  accentTextClass: string;
  icon: React.ReactNode;
}

function SegmentedComicGauge({
  label,
  value,
  delta = 0,
  sublabel,
  fillClass,
  accentTextClass,
  icon,
}: SegmentedGaugeProps) {
  const segments = 10;
  const filledCount = Math.round((Math.max(0, Math.min(100, value)) / 100) * segments);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 min-w-0">
          {icon}
          <span className="text-[10px] font-mono font-black tracking-wider uppercase text-zinc-100 truncate">
            {label}
          </span>
          {sublabel && (
            <span className={`text-[9px] font-mono font-semibold truncate ${accentTextClass}`}>
              • {sublabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {delta !== 0 && (
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-mono font-black border animate-bounce ${
                delta > 0
                  ? "bg-amber-500/20 border-amber-400 text-amber-200"
                  : "bg-rose-950/90 border-rose-500 text-rose-300"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className={`text-xs font-mono font-black tabular-nums ${accentTextClass}`}>
            {Math.round(value)}
          </span>
        </div>
      </div>

      {/* 10 Discrete Ink-Bordered Comic Gauge Segments */}
      <div className="grid grid-cols-10 gap-[3px] p-[2px] bg-[#07070A] border border-zinc-800 rounded-[2px]">
        {Array.from({ length: segments }).map((_, idx) => {
          const isFilled = idx < filledCount;
          return (
            <div
              key={idx}
              className={`h-2.5 rounded-[1px] transition-all duration-300 ${
                isFilled ? fillClass(idx, segments) : "bg-zinc-900/90"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export interface AshVelvetScenePanelProps {
  bgImage: string;
  location: string;
  mood: string;
  speaker: string;
  houseState: AshVelvetHouseState;
  presentCompanions: AshVelvetStageCompanion[];
  spotlightComp: AshVelvetStageCompanion | null;
  playerName: string;
  playerAvatar: string | null;
  getSpriteSrc: (name: string, expressionKey?: string) => string;
  fallbackSprite: string;
  lastDeltas?: AshVelvetTurnDeltaSummary | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenDossier: (comp: AshVelvetStageCompanion) => void;
  onOpenMap: () => void;
  onIllustrateCg: () => void;
  onChangeWardrobe?: (compName: string, nextWardrobe: string) => void;
}

/**
 * Concept B Upper Widescreen Graphic-Novel Scene Panel
 * Displays the transparent Style A heroine directly inside the atmospheric 16:9 room background
 * with zero white box, angled amber location ribbon, and overlapping hot-magenta nameplate.
 */
export function AshVelvetScenePanel({
  bgImage,
  location,
  mood,
  speaker,
  houseState,
  presentCompanions,
  spotlightComp,
  playerName,
  playerAvatar,
  getSpriteSrc,
  fallbackSprite,
  lastDeltas,
  isCollapsed = false,
  onToggleCollapse,
  onOpenDossier,
  onOpenMap,
  onIllustrateCg,
  onChangeWardrobe,
}: AshVelvetScenePanelProps) {
  const activeComp = presentCompanions.length > 0 ? spotlightComp || presentCompanions[0] : null;
  const activeSpriteSrc = activeComp
    ? getSpriteSrc(activeComp.name, "neutral") || activeComp.baseImageUrl || fallbackSprite
    : fallbackSprite;
  const activeOutfitLabel = activeComp
    ? activeComp.wardrobeLabels?.[activeComp.activeWardrobe || "base"] ||
      activeComp.activeWardrobe ||
      "base"
    : "";
  const activeFirstName = activeComp ? activeComp.name.split(" ")[0].toUpperCase() : "SOLO";
  const isSpeaking =
    Boolean(activeComp) && speaker.toLowerCase().includes(activeComp!.name.toLowerCase());

  const prevLocationRef = useRef<string>(location);
  const prevBgRef = useRef<string>(bgImage);
  const [roomTransition, setRoomTransition] = useState<{
    fromLocation: string;
    toLocation: string;
    prevBg: string;
    key: number;
  } | null>(null);

  useEffect(() => {
    const cleanNext = (location || "").trim();
    const cleanPrev = (prevLocationRef.current || "").trim();
    if (cleanNext && cleanPrev && cleanNext.toLowerCase() !== cleanPrev.toLowerCase()) {
      setRoomTransition({
        fromLocation: cleanPrev,
        toLocation: cleanNext,
        prevBg: prevBgRef.current || bgImage,
        key: Date.now(),
      });
      prevLocationRef.current = cleanNext;
      prevBgRef.current = bgImage;
      const timer = setTimeout(() => {
        setRoomTransition(null);
      }, 1750);
      return () => clearTimeout(timer);
    }
    prevLocationRef.current = cleanNext || prevLocationRef.current;
    prevBgRef.current = bgImage || prevBgRef.current;
  }, [location, bgImage]);

  if (isCollapsed) {
    return (
      <div className="shrink-0 px-2.5 py-1.5 bg-[#161520] border-2 border-[#07070A] shadow-[3px_3px_0_#07070A] flex items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenMap}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500 text-[#09090D] font-mono text-[10px] font-black uppercase tracking-wider -skew-x-12 border-2 border-[#07070A] shadow-[2px_2px_0_#07070A] cursor-pointer hover:bg-amber-400"
          >
            <span className="skew-x-12 truncate max-w-[240px]">
              {location} • {houseState.clockLabel}
            </span>
          </button>
          <span className="text-[10px] font-mono font-bold text-amber-200 uppercase hidden sm:inline">
            Day {houseState.day} • {ASH_VELVET_TIME_SLOT_DISPLAY[houseState.timeSlot]}
          </span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 hover:bg-amber-500 text-amber-300 hover:text-[#09090D] border-2 border-[#07070A] text-[10px] font-mono font-black uppercase cursor-pointer"
          >
            <ChevronDown className="w-3 h-3" />
            <span>Show Scene</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0 h-[31vh] min-h-[195px] max-h-[290px] w-full bg-[#16151E] border-2 border-[#07070A] shadow-[4px_4px_0px_#07070A] overflow-hidden select-none">
      {/* Atmospheric Room Background with Crossfade & Subtle Zoom on Location Transition */}
      <div
        key={bgImage || location}
        className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
          roomTransition ? "animate-in fade-in zoom-in-105 duration-700" : ""
        }`}
        style={{ backgroundImage: `url('${bgImage || "/backgrounds/ash-and-velvet/shared_kitchen.jpg"}')` }}
      />
      {/* Graphic-Novel Panel Wipe & Room Transition Banner Overlay */}
      {roomTransition && (
        <div
          key={roomTransition.key}
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-gradient-to-r from-[#07070A]/75 via-[#07070A]/35 to-[#07070A]/75 animate-in fade-in duration-200"
        >
          <div className="px-4 py-2 bg-[#14131D]/95 border-2 border-amber-400 shadow-[4px_4px_0px_#07070A] -skew-x-12 flex flex-col items-center gap-0.5 animate-in zoom-in-95 slide-in-from-left-6 duration-300">
            <div className="skew-x-12 flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              <span>{shortenAshVelvetLocation(roomTransition.fromLocation)}</span>
              <span className="text-amber-400">➔</span>
              <span className="text-amber-300">{houseState.clockLabel}</span>
            </div>
            <div className="skew-x-12 text-xs sm:text-sm font-mono font-black italic uppercase tracking-wider text-amber-400">
              {roomTransition.toLocation}
            </div>
          </div>
        </div>
      )}
      {/* Subtle cinematic vignette so character ink outlines & HUD badges pop */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-black/35 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />

      {/* Top-Left Angled Amber-Gold Location Ribbon (Concept B Signature) */}
      <div className="absolute top-2.5 left-3 z-20 flex flex-wrap items-center gap-1.5 max-w-[78%]">
        <button
          type="button"
          onClick={onOpenMap}
          title={`Current Room: ${location} — Click to open 14-Room Map`}
          className="bg-amber-500 hover:bg-amber-400 text-[#09090D] px-3 py-1 border-2 border-[#07070A] shadow-[3px_3px_0px_#07070A] -skew-x-12 transition-transform active:translate-y-0.5 cursor-pointer"
        >
          <span className="skew-x-12 inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-black italic uppercase tracking-wider">
            <span className="truncate max-w-[175px] sm:max-w-[270px]">{location}</span>
            <span className="opacity-65">•</span>
            <span className="whitespace-nowrap">{houseState.clockLabel}</span>
          </span>
        </button>

        <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-[#14131B]/90 border-2 border-[#07070A] text-amber-200 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_#07070A]">
          <Clock className="w-3 h-3 text-amber-400" />
          Day {houseState.day} • {ASH_VELVET_TIME_SLOT_DISPLAY[houseState.timeSlot]}
        </span>
      </div>

      {/* Top-Right Compact Scene Controls */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onIllustrateCg}
          title="Generate a bespoke Style A Graphic-Novel Scene CG"
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#191722]/95 hover:bg-pink-600 text-pink-200 hover:text-white border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] text-[10px] font-mono font-black uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Camera className="w-3 h-3" />
          <span>CG</span>
        </button>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Minimize stage to expand dialogue log"
            className="p-1 bg-[#191722]/95 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* TRANSPARENT STYLE A HEROINE STANDING DIRECTLY IN THE ROOM (Mathematically guaranteed below top ribbon!) */}
      {activeComp ? (
        <div
          onClick={() => onOpenDossier(activeComp)}
          title={`Click to open ${activeComp.name}'s Psychological Dossier`}
          className="absolute bottom-0 left-3 sm:left-7 md:left-10 z-10 h-[calc(100%-44px)] flex items-end cursor-pointer group"
        >
          <img
            src={activeSpriteSrc}
            alt={activeComp.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackSprite;
            }}
            className="h-full w-auto max-w-[260px] object-contain object-bottom drop-shadow-[0_6px_18px_rgba(0,0,0,0.88)] transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="absolute bottom-2 left-5 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#14131B]/90 border-2 border-[#07070A] shadow-[3px_3px_0px_#07070A]">
          {playerAvatar ? (
            <img
              src={playerAvatar}
              alt={playerName}
              className="w-8 h-8 rounded-full object-cover border border-sky-400"
            />
          ) : (
            <User className="w-5 h-5 text-sky-400" />
          )}
          <span className="text-xs font-mono font-bold text-sky-200 uppercase">
            {playerName} • Solo Scene
          </span>
        </div>
      )}

      {/* Floating Turn Stat Change Indicator Strip above Speaker Nameplate */}
      {lastDeltas && (
        <div className="absolute bottom-10 left-3 sm:left-5 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          {lastDeltas.affectionDelta !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider ${
                lastDeltas.affectionDelta > 0
                  ? "bg-rose-600 text-white"
                  : "bg-red-950 text-red-200 border-red-500"
              }`}
            >
              <Heart className="w-3 h-3 fill-current" />
              <span>
                {lastDeltas.affectionDelta > 0
                  ? `+${lastDeltas.affectionDelta}`
                  : lastDeltas.affectionDelta}{" "}
                Affection
              </span>
            </span>
          )}
          {lastDeltas.lustDelta !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider ${
                lastDeltas.lustDelta > 0
                  ? "bg-fuchsia-600 text-white"
                  : "bg-zinc-900 text-zinc-300"
              }`}
            >
              <Flame className="w-3 h-3 fill-current" />
              <span>
                {lastDeltas.lustDelta > 0
                  ? `+${lastDeltas.lustDelta}`
                  : lastDeltas.lustDelta}{" "}
                Lust
              </span>
            </span>
          )}
          {(lastDeltas.sensitivityDelta ?? 0) !== 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-500 text-[#09090D] border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>
                +{lastDeltas.sensitivityDelta} Sensitivity
              </span>
            </span>
          )}
          {lastDeltas.trustDelta !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider ${
                lastDeltas.trustDelta > 0
                  ? "bg-teal-600 text-white"
                  : "bg-red-950 text-red-200 border-red-500"
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>
                {lastDeltas.trustDelta > 0
                  ? `+${lastDeltas.trustDelta}`
                  : lastDeltas.trustDelta}{" "}
                Trust
              </span>
            </span>
          )}
          {lastDeltas.submissionDelta !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider ${
                lastDeltas.submissionDelta > 0
                  ? "bg-purple-600 text-white"
                  : "bg-indigo-950 text-indigo-200"
              }`}
            >
              <Crown className="w-3 h-3" />
              <span>
                {lastDeltas.submissionDelta > 0
                  ? `+${lastDeltas.submissionDelta}`
                  : lastDeltas.submissionDelta}{" "}
                Submission
              </span>
            </span>
          )}
          {lastDeltas.jealousyDelta !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider ${
                lastDeltas.jealousyDelta > 0
                  ? "bg-amber-500 text-[#09090D]"
                  : "bg-emerald-950 text-emerald-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>
                {lastDeltas.jealousyDelta > 0
                  ? `+${lastDeltas.jealousyDelta}`
                  : lastDeltas.jealousyDelta}{" "}
                Jealousy
              </span>
            </span>
          )}
        </div>
      )}

      {/* Bottom-Left Angled Hot-Magenta Speaker Nameplate + Outfit State Pill */}
      {activeComp && (
        <div className="absolute bottom-2 left-3 sm:left-5 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDossier(activeComp)}
            className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white px-3.5 py-0.5 border-2 border-[#07070A] shadow-[3px_3px_0px_#07070A] -skew-x-12 cursor-pointer transition-transform hover:scale-105"
          >
            <span className="skew-x-12 inline-flex items-center gap-1.5 text-xs font-mono font-black italic uppercase tracking-widest">
              {isSpeaking && <Sparkles className="w-3 h-3 text-amber-200" />}
              <span>{activeFirstName}</span>
              <Info className="w-3 h-3 opacity-80" />
            </span>
          </button>

          {onChangeWardrobe &&
          activeComp.wardrobeLabels &&
          Object.keys(activeComp.wardrobeLabels).length > 1 ? (
            <label className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0C0B10]/95 border border-white/20 text-[9px] font-mono font-black uppercase tracking-wider text-amber-300 shadow max-w-[220px] cursor-pointer hover:border-pink-400/70">
              <Shirt className="w-2.5 h-2.5 shrink-0 text-pink-400" />
              <select
                aria-label={`${activeComp.name} outfit state`}
                value={activeComp.activeWardrobe || "base"}
                onChange={(e) => onChangeWardrobe(activeComp.name, e.target.value)}
                className="bg-transparent text-amber-300 text-[9px] font-mono font-black uppercase tracking-wider focus:outline-none cursor-pointer truncate max-w-[180px]"
              >
                {Object.entries(activeComp.wardrobeLabels).map(([wKey, wLabel]) => (
                  <option key={wKey} value={wKey} className="bg-[#111018] text-amber-200">
                    {wLabel}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0C0B10]/90 border border-white/15 text-[9px] font-mono font-black uppercase tracking-wider text-amber-300 shadow max-w-[200px] truncate">
              <Shirt className="w-2.5 h-2.5 shrink-0 text-pink-400" />
              <span className="truncate">{activeOutfitLabel}</span>
            </span>
          )}
        </div>
      )}

      {/* Bottom-Right Atmospheric Mood Stamp */}
      <div className="hidden sm:flex absolute bottom-2 right-2.5 z-20 px-2.5 py-1 bg-[#111018]/90 border-2 border-[#07070A] shadow-[3px_3px_0px_#07070A] text-right max-w-[230px] flex-col">
        <span className="text-[8px] font-mono uppercase tracking-widest text-amber-400 font-black leading-tight">
          Scene Mood
        </span>
        <span className="text-[11px] font-mono font-bold text-zinc-100 truncate">
          {mood || "Quiet Tension"}
        </span>
      </div>
    </div>
  );
}

export interface AshVelvetTelemetryRailProps {
  location: string;
  houseState: AshVelvetHouseState;
  allCompanions: AshVelvetStageCompanion[];
  presentCompanions: AshVelvetStageCompanion[];
  spotlightComp: AshVelvetStageCompanion | null;
  getSpriteSrc: (name: string, expressionKey?: string) => string;
  fallbackSprite: string;
  lastDeltas: AshVelvetTurnDeltaSummary | null;
  onSelectSpotlight: (name: string) => void;
  onOpenDossier: (comp: AshVelvetStageCompanion) => void;
  onChangeWardrobe: (compName: string, wardrobeKey: string) => void;
  onOpenMap: () => void;
  onTravelToRoom?: (locationName: string) => void;
}

/**
 * Concept B Full-Height Right Comic Telemetry Rail
 * Spans the full height of the workspace so Affection, Lust, Submission, Trust, Jealousy,
 * Vice, Composure, Cash/Rent, Outfit Selector, and Room Map NEVER clip on any viewport!
 */
export function AshVelvetTelemetryRail({
  location,
  houseState,
  allCompanions,
  presentCompanions,
  spotlightComp,
  getSpriteSrc,
  fallbackSprite,
  lastDeltas,
  onSelectSpotlight,
  onOpenDossier,
  onChangeWardrobe,
  onOpenMap,
  onTravelToRoom,
}: AshVelvetTelemetryRailProps) {
  const [showWardrobeList, setShowWardrobeList] = useState(false);

  const activeComp = spotlightComp || presentCompanions[0] || allCompanions[0] || null;
  const meters = activeComp ? resolveHeroineMeters(activeComp) : null;
  const viceInfo = getViceLabel(houseState.viceLevel);
  const daysLeft = Math.max(0, houseState.rentDueDay - houseState.day);
  const bedroomUnlocked = meters ? isBedroomKeyUnlocked(meters) : false;
  const activeDossierMeta = activeComp ? ASH_VELVET_HEROINE_DOSSIERS[activeComp.name] : undefined;
  const wLabels = activeComp?.wardrobeLabels || null;
  const activeWardrobeKey = activeComp?.activeWardrobe || "base";
  const activeFirstName = activeComp ? activeComp.name.split(" ")[0].toUpperCase() : "HEROINE";

  const isDeltaForActive =
    Boolean(lastDeltas) &&
    Boolean(activeComp) &&
    lastDeltas!.companionName.toLowerCase().includes(activeComp!.name.toLowerCase());

  return (
    <aside className="w-full lg:w-[278px] xl:w-[298px] shrink-0 bg-[#161520] border-2 border-[#07070A] shadow-[4px_4px_0px_#07070A] p-3 flex flex-col gap-3 overflow-y-auto select-none">
      {/* 1. TOP ROW: HOUSEMATE LIVE AVATAR & WHEREABOUTS STRIP */}
      <div className="pb-2.5 border-b border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400">
            412 Maplewood Cast
          </span>
          <span className="text-[9px] font-mono text-zinc-400">
            {presentCompanions.length} in room
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {allCompanions.slice(0, 7).map((comp) => {
            const isFocused = activeComp?.name.toLowerCase() === comp.name.toLowerCase();
            const isHere = presentCompanions.some(
              (p) => p.name.toLowerCase() === comp.name.toLowerCase()
            );
            const thumb =
              getSpriteSrc(comp.name, "neutral") || comp.baseImageUrl || fallbackSprite;
            const compRoom = isHere
              ? location
              : houseState.heroineLocations[comp.name] ||
                ASH_VELVET_HEROINE_DOSSIERS[comp.name]?.bedroomLocation ||
                "412 Maplewood";
            const shortRoom = isHere ? "HERE" : shortenAshVelvetLocation(compRoom);

            return (
              <button
                key={comp.name}
                type="button"
                onClick={() => onSelectSpotlight(comp.name)}
                onDoubleClick={() => onOpenDossier(comp)}
                title={`${comp.name} — ${isHere ? "Present here" : `At ${compRoom}`} (Click to inspect • Double-click Dossier)`}
                className="flex flex-col items-center gap-1 cursor-pointer focus:outline-none group"
              >
                <div
                  className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all bg-[#252334] ${
                    isFocused
                      ? "border-amber-400 ring-2 ring-amber-400/35 scale-105"
                      : isHere
                      ? "border-pink-500/80 hover:border-amber-300"
                      : "border-zinc-700 opacity-75 hover:opacity-100 hover:border-zinc-400"
                  }`}
                >
                  <img
                    src={thumb}
                    alt={comp.name}
                    className="w-full h-full object-cover object-top"
                  />
                  {isHere && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#07070A]" />
                  )}
                </div>
                <span
                  className={`text-[8px] font-mono font-black uppercase tracking-tighter truncate max-w-[48px] leading-none ${
                    isHere
                      ? "text-emerald-300"
                      : isFocused
                      ? "text-amber-300"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  {shortRoom}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE HEROINE HEADER + 4 SEGMENTED COMIC STAT GAUGES */}
      {activeComp && meters && (
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenDossier(activeComp)}
              className="text-left group cursor-pointer min-w-0"
              title="Click to open full Psychological Dossier"
            >
              <div className="text-base font-mono font-black italic uppercase tracking-wide text-white group-hover:text-amber-300 transition-colors truncate">
                {activeComp.name}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-zinc-400">
                <span className="text-rose-300">{getAffectionBondTier(meters.affection)}</span>
                <span>•</span>
                <span className="text-purple-300 truncate">
                  {getSubmissionDynamicLabel(meters.submission)}
                </span>
              </div>
            </button>

            {activeDossierMeta && (
              <button
                type="button"
                onClick={() =>
                  bedroomUnlocked && onTravelToRoom
                    ? onTravelToRoom(activeDossierMeta.bedroomLocation)
                    : onOpenDossier(activeComp)
                }
                title={
                  bedroomUnlocked
                    ? `Private Room Unlocked — Click to visit ${activeDossierMeta.bedroomLocation}`
                    : `${activeDossierMeta.roomLabel} Locked (Reach 50 Trust or 45 Affection + 40 Lust)`
                }
                className={`px-1.5 py-0.5 border text-[9px] font-mono font-black uppercase inline-flex items-center gap-1 shrink-0 cursor-pointer ${
                  bedroomUnlocked
                    ? "bg-amber-500/20 border-amber-400 text-amber-200 hover:bg-amber-500/35"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {bedroomUnlocked ? <Key className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                <span>{activeDossierMeta.roomLabel.replace("Room ", "")}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <SegmentedComicGauge
              label="Affection"
              value={meters.affection}
              delta={isDeltaForActive ? lastDeltas?.affectionDelta : 0}
              accentTextClass="text-rose-300"
              icon={<Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />}
              fillClass={(i) =>
                i >= 7 ? "bg-rose-400" : i >= 4 ? "bg-rose-500" : "bg-rose-600"
              }
            />

            <SegmentedComicGauge
              label="Lust"
              value={meters.lust}
              delta={isDeltaForActive ? lastDeltas?.lustDelta : 0}
              sublabel={getLustStateLabel(meters.lust)}
              accentTextClass="text-fuchsia-300"
              icon={<Flame className="w-3 h-3 text-fuchsia-400 shrink-0" />}
              fillClass={(i) =>
                i >= 7 ? "bg-orange-400" : i >= 4 ? "bg-pink-500" : "bg-fuchsia-600"
              }
            />

            <SegmentedComicGauge
              label="Sensitivity"
              value={meters.sensitivity ?? 15}
              delta={isDeltaForActive ? lastDeltas?.sensitivityDelta : 0}
              sublabel={getSensitivityStageLabel(meters.sensitivity ?? 15)}
              accentTextClass="text-pink-300"
              icon={<Sparkles className="w-3 h-3 text-pink-400 shrink-0" />}
              fillClass={(i) =>
                i >= 7 ? "bg-rose-400" : i >= 4 ? "bg-pink-400" : "bg-pink-600"
              }
            />

            <SegmentedComicGauge
              label="Submission"
              value={meters.submission}
              delta={isDeltaForActive ? lastDeltas?.submissionDelta : 0}
              accentTextClass="text-purple-300"
              icon={<Crown className="w-3 h-3 text-purple-400 shrink-0" />}
              fillClass={(i) =>
                i >= 7 ? "bg-amber-400" : i >= 4 ? "bg-purple-400" : "bg-purple-600"
              }
            />

            <SegmentedComicGauge
              label="Trust"
              value={meters.trust}
              delta={isDeltaForActive ? lastDeltas?.trustDelta : 0}
              accentTextClass="text-teal-300"
              icon={<Shield className="w-3 h-3 text-teal-400 shrink-0" />}
              fillClass={(i) =>
                i >= 7 ? "bg-teal-400" : i >= 4 ? "bg-amber-400" : "bg-amber-500"
              }
            />
          </div>

          {/* Jealousy & Vice Compact Status Strip */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 border font-mono text-[9px] font-black uppercase tracking-wider ${viceInfo.toneClass}`}
              title={`Vice / Intoxication: ${houseState.viceLevel}/100`}
            >
              <Wine className="w-2.5 h-2.5" />
              <span>VICE: {viceInfo.label}</span>
            </span>

            {meters.jealousy >= 20 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-950/90 border border-red-500 text-red-200 font-mono text-[9px] font-black uppercase animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                <span>JEALOUSY {meters.jealousy}</span>
              </span>
            ) : (
              <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase">
                JEALOUSY: <span className="text-zinc-200">{meters.jealousy}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. HOUSE & TENANT VITALS CARD */}
      <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#100F17] border-2 border-[#07070A] text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[8px] uppercase text-zinc-500 font-bold leading-none">Composure</div>
            <div className="font-black text-sky-200">{houseState.composure}%</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[8px] uppercase text-zinc-500 font-bold leading-none">
              Rent ({daysLeft}d)
            </div>
            <div className="font-black text-emerald-300">
              ${houseState.cashUsd}
              <span className="text-zinc-500 font-normal">/${houseState.rentAmountUsd}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONCEPT B ACTION BUTTONS: OUTFIT + ROOM MAP + DOSSIER */}
      <div className="space-y-1.5 mt-auto pt-1 border-t border-white/10">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={!activeComp || !wLabels}
            onClick={() => setShowWardrobeList((v) => !v)}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
              showWardrobeList
                ? "bg-pink-600 text-white"
                : "bg-[#232131] hover:bg-[#2E2B40] text-zinc-100"
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Outfit</span>
          </button>

          <button
            type="button"
            onClick={onOpenMap}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#232131] hover:bg-amber-500 text-zinc-100 hover:text-[#09090D] border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] font-mono text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Room Map</span>
          </button>
        </div>

        {/* Inline Expandable 5-Outfit Wardrobe List (Scrolls cleanly inside rail — ZERO clipping!) */}
        {showWardrobeList && activeComp && wLabels && (
          <div className="p-2 bg-[#100F17] border-2 border-pink-500/70 space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-[9px] font-mono font-black uppercase tracking-wider text-pink-300">
                {activeFirstName}&apos;s Outfits
              </span>
              <button
                type="button"
                onClick={() => setShowWardrobeList(false)}
                className="text-zinc-400 hover:text-white text-[10px] font-mono font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {Object.entries(wLabels).map(([wKey, wLabel]) => {
                const isSelected = activeWardrobeKey === wKey;
                return (
                  <button
                    key={wKey}
                    type="button"
                    onClick={() => onChangeWardrobe(activeComp.name, wKey)}
                    className={`w-full text-left px-2 py-1 text-[10px] font-mono font-bold border transition-colors cursor-pointer truncate ${
                      isSelected
                        ? "bg-pink-600 border-pink-400 text-white"
                        : "bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-amber-400 hover:text-amber-200"
                    }`}
                  >
                    {isSelected ? "● " : "○ "}
                    {String(wLabel)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeComp && (
          <button
            type="button"
            onClick={() => onOpenDossier(activeComp)}
            className="w-full py-1.5 px-2 bg-[#121119] hover:bg-zinc-800 border-2 border-[#07070A] text-amber-300 hover:text-amber-200 font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>Open {activeFirstName}&apos;s Dossier</span>
          </button>
        )}
      </div>
    </aside>
  );
}
