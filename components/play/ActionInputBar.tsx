"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Send, Gift, MessageSquareCode, Sparkles, X } from "lucide-react";

export interface BufferedTextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (val: string) => void;
  debounceMs?: number;
}

/**
 * Isolates keystroke state locally so typing never triggers re-renders of the parent tree.
 * Flushes changes after a brief pause or immediately on blur / Enter key.
 */
export const BufferedTextInput = memo(function BufferedTextInput({
  value,
  onValueChange,
  debounceMs = 150,
  onBlur,
  onKeyDown,
  ...rest
}: BufferedTextInputProps) {
  const [localVal, setLocalVal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalVal(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onValueChangeRef.current(next);
    }, debounceMs);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (localVal !== value) {
      onValueChangeRef.current(localVal);
    }
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onValueChangeRef.current(localVal);
    }
    onKeyDown?.(e);
  };

  return (
    <input
      {...rest}
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
});

export interface ActionInputBarProps {
  onSend: (text: string, isOOC: boolean) => void;
  isLoading: boolean;
  isDraftingAction?: boolean;
  draftText?: string;
  draftVersion?: number;
  playerName: string;
  hasParty: boolean;
  onOpenGifting?: () => void;
}

export const ActionInputBar = memo(function ActionInputBar({
  onSend,
  isLoading,
  isDraftingAction = false,
  draftText = "",
  draftVersion = 0,
  playerName,
  hasParty,
  onOpenGifting,
}: ActionInputBarProps) {
  const [inputAction, setInputAction] = useState("");
  const [isOOCMode, setIsOOCMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(Math.max(el.scrollHeight, 44), 220);
    el.style.height = `${nextHeight}px`;
  }, []);

  // Populate textarea when an AI-expanded protagonist response draft arrives
  useEffect(() => {
    if (draftVersion > 0 && draftText) {
      setInputAction(draftText);
      requestAnimationFrame(() => {
        adjustTextareaHeight();
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(draftText.length, draftText.length);
        }
      });
    }
  }, [draftVersion, draftText, adjustTextareaHeight]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputAction, adjustTextareaHeight]);

  const submitCurrentAction = () => {
    const trimmed = inputAction.trim();
    if (!trimmed || isLoading || isDraftingAction) return;
    onSend(trimmed, isOOCMode);
    setInputAction("");
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCurrentAction();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a line break
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitCurrentAction();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pointer-events-auto flex items-end gap-1.5 sm:gap-2 select-none shrink-0">
      {/* Camp Gifting Trigger */}
      {hasParty && onOpenGifting && (
        <button
          type="button"
          onClick={onOpenGifting}
          className="px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-rose-400 active:scale-95 shrink-0"
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
        className={`px-2.5 sm:px-3 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0 ${
          isOOCMode
            ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            : "bg-zinc-900/90 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        }`}
      >
        <MessageSquareCode className="w-4 h-4" />
        <span>OOC</span>
      </button>

      {/* Multi-Line Vertically Expanding Action Textarea */}
      <div className="relative flex-1 min-w-0 flex items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputAction}
          onChange={(e) => setInputAction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDraftingAction
              ? `Drafting ${playerName}'s 2-paragraph response for you to edit...`
              : isOOCMode
              ? "OOC Directive... (Shift+Enter for new line)"
              : `What will ${playerName} do or say? (Click a choice above to draft & edit, Shift+Enter for new line)`
          }
          disabled={isLoading || isDraftingAction}
          className={`w-full bg-zinc-900/95 backdrop-blur-md rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-8 min-h-[40px] sm:min-h-[44px] max-h-[220px] overflow-y-auto resize-y text-base sm:text-sm leading-relaxed text-zinc-100 placeholder-zinc-500 border focus:outline-none transition-colors select-text ${
            isDraftingAction
              ? "border-rose-400/60 ring-1 ring-rose-500/30 animate-pulse"
              : isOOCMode
              ? "border-amber-500/40 focus:border-amber-400 ring-1 ring-amber-500/20"
              : "border-white/15 focus:border-rose-500/60 ring-1 ring-rose-500/20"
          }`}
        />
        {isDraftingAction ? (
          <div className="absolute right-2.5 bottom-3 flex items-center gap-1 text-rose-400 pointer-events-none">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
        ) : inputAction.length > 0 && !isLoading ? (
          <button
            type="button"
            onClick={() => {
              setInputAction("");
              if (textareaRef.current) {
                textareaRef.current.style.height = "44px";
                textareaRef.current.focus();
              }
            }}
            title="Clear text box"
            className="absolute right-2 bottom-2.5 p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isDraftingAction || !inputAction.trim()}
        className="px-3.5 sm:px-5 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[48px] bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
        title="Send action (Enter to send, Shift+Enter for new line)"
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

