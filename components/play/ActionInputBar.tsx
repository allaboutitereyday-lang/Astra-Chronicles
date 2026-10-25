"use client";

import React, { useState, memo } from "react";
import { Send, Gift, MessageSquareCode } from "lucide-react";

export interface ActionInputBarProps {
  onSend: (text: string, isOOC: boolean) => void;
  isLoading: boolean;
  playerName: string;
  hasParty: boolean;
  onOpenGifting?: () => void;
}

export const ActionInputBar = memo(function ActionInputBar({
  onSend,
  isLoading,
  playerName,
  hasParty,
  onOpenGifting,
}: ActionInputBarProps) {
  const [inputAction, setInputAction] = useState("");
  const [isOOCMode, setIsOOCMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputAction.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed, isOOCMode);
    setInputAction("");
  };

  return (
    <form onSubmit={handleSubmit} className="pointer-events-auto flex gap-1.5 sm:gap-2 select-none shrink-0">
      {/* Camp Gifting Trigger */}
      {hasParty && onOpenGifting && (
        <button
          type="button"
          onClick={onOpenGifting}
          className="px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-rose-400 active:scale-95"
          title="Camp Gifting: Present an item to a companion"
        >
          <Gift className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Gift</span>
        </button>
      )}

      {/* OOC Mode Toggle */}
      <button
        type="button"
        onClick={() => setIsOOCMode((prev) => !prev)}
        className={`px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
          isOOCMode
            ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            : "bg-zinc-900/90 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        }`}
      >
        <MessageSquareCode className="w-4 h-4" />
        <span>OOC</span>
      </button>

      {/* Action Input Field */}
      <input
        type="text"
        value={inputAction}
        onChange={(e) => setInputAction(e.target.value)}
        placeholder={isOOCMode ? "OOC Directive..." : `What will ${playerName} do or say? (Markdown supported)`}
        disabled={isLoading}
        className={`flex-1 bg-zinc-900/90 backdrop-blur-md rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] text-base sm:text-sm text-zinc-100 placeholder-zinc-500 border focus:outline-none transition-all select-text min-w-0 ${
          isOOCMode
            ? "border-amber-500/40 focus:border-amber-400 ring-1 ring-amber-500/20"
            : "border-white/15 focus:border-rose-500/60 ring-1 ring-rose-500/20"
        }`}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !inputAction.trim()}
        className="px-3.5 sm:px-5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[48px] bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </form>
  );
});
