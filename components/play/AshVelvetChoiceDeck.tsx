"use client";

import React from "react";
import { Edit3 } from "lucide-react";
import { AshVelvetChoiceIntent, classifyChoiceIntent } from "@/lib/ashVelvetEngine";

export interface AshVelvetChoiceDeckProps {
  choices: string[];
  disabled?: boolean;
  onSelectChoice: (choiceText: string) => void;
  onDraftChoice?: (choiceText: string) => void;
}

const INTENT_STYLES: Record<
  AshVelvetChoiceIntent,
  { badgeBg: string; hoverBorder: string; numBg: string }
> = {
  HEART: {
    badgeBg: "bg-rose-600 text-white border-[#07070A]",
    hoverBorder: "hover:border-rose-400",
    numBg: "group-hover:bg-rose-500 group-hover:text-white",
  },
  FLAME: {
    badgeBg: "bg-gradient-to-r from-pink-600 to-orange-500 text-white border-[#07070A]",
    hoverBorder: "hover:border-pink-400",
    numBg: "group-hover:bg-pink-500 group-hover:text-white",
  },
  DOM: {
    badgeBg: "bg-purple-600 text-white border-[#07070A]",
    hoverBorder: "hover:border-purple-400",
    numBg: "group-hover:bg-purple-500 group-hover:text-white",
  },
  BOLD: {
    badgeBg: "bg-amber-500 text-[#09090D] border-[#07070A]",
    hoverBorder: "hover:border-amber-400",
    numBg: "group-hover:bg-amber-400 group-hover:text-[#09090D]",
  },
  COOL: {
    badgeBg: "bg-teal-500 text-[#09090D] border-[#07070A]",
    hoverBorder: "hover:border-teal-400",
    numBg: "group-hover:bg-teal-400 group-hover:text-[#09090D]",
  },
};

export function AshVelvetChoiceDeck({
  choices,
  disabled = false,
  onSelectChoice,
  onDraftChoice,
}: AshVelvetChoiceDeckProps) {
  if (!choices || choices.length === 0) return null;

  return (
    <div className="p-2 bg-[#121118] border-b-2 border-[#07070A] grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[145px] overflow-y-auto">
      {choices.map((choice, idx) => {
        const { intent, cleanLabel } = classifyChoiceIntent(choice);
        const style = INTENT_STYLES[intent];
        const displayChoice = cleanLabel.replace(/^\[[^\]]+\]\s*:?\s*/, "");

        return (
          <div key={idx} className="group flex items-stretch gap-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectChoice(choice)}
              className={`flex-1 flex items-center justify-between gap-2 text-left px-2 py-1.5 bg-[#1A1924] hover:bg-[#232132] border-2 border-[#07070A] ${style.hoverBorder} shadow-[2px_2px_0px_#07070A] transition-all cursor-pointer disabled:opacity-45 active:translate-y-[1px] min-w-0`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 shrink-0 flex items-center justify-center bg-[#0D0C12] border border-zinc-700 text-amber-300 font-mono text-[10px] font-black italic transition-colors ${style.numBg}`}
                >
                  {idx + 1}
                </span>
                <span className="text-xs font-sans font-medium text-zinc-100 group-hover:text-white leading-snug line-clamp-2">
                  {displayChoice}
                </span>
              </div>

              <span
                className={`shrink-0 px-1.5 py-0.5 border text-[8px] font-mono font-black uppercase tracking-widest -skew-x-12 shadow-[2px_2px_0px_#07070A] ${style.badgeBg}`}
              >
                <span className="skew-x-12 inline-block">{intent}</span>
              </span>
            </button>

            {onDraftChoice && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDraftChoice(choice)}
                title="Expand & customize this choice before sending"
                className="px-1.5 bg-[#1A1924] hover:bg-amber-500 text-zinc-400 hover:text-[#09090D] border-2 border-[#07070A] shadow-[2px_2px_0px_#07070A] transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center shrink-0"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
