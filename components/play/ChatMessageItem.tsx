"use client";

import React, { useState, useEffect, memo } from "react";
import {
  User,
  Terminal,
  BookOpen,
  Edit3,
  RotateCcw,
  Check,
  Heart,
  Zap,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export interface ChatMessageData {
  id: string;
  sender: "user" | "character";
  speakerName: string;
  text: string;
  mechanics?: string | null;
  vitalsImpact?: {
    hpDelta: number;
    mpDelta: number;
    reason?: string | null;
  } | null;
  timestamp: string;
  avatarSrc?: string;
  isPending?: boolean;
}

export interface ChatMessageItemProps {
  msg: ChatMessageData;
  isLatestCharacterTurn: boolean;
  isEditing: boolean;
  isTypingUser: boolean;
  streamedContent?: string;
  isStreaming?: boolean;
  isLoading: boolean;
  playerAvatar: string | null;
  playerName: string;
  resolvedSpriteSrc: string;
  defaultFallbackSprite: string;
  onStartEdit: (msg: ChatMessageData) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string, newText: string) => void;
  onRegenerateTurn: () => void;
  onSkipTypewriter: (msg: ChatMessageData, isLatestCharacterTurn: boolean) => void;
}

export const ChatMessageItem = memo(function ChatMessageItem({
  msg,
  isLatestCharacterTurn,
  isEditing,
  isTypingUser,
  streamedContent,
  isStreaming = false,
  isLoading,
  playerAvatar,
  playerName,
  resolvedSpriteSrc,
  defaultFallbackSprite,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerateTurn,
  onSkipTypewriter,
}: ChatMessageItemProps) {
  const [localEditText, setLocalEditText] = useState(msg.text);

  useEffect(() => {
    if (isEditing) {
      setLocalEditText(msg.text);
    }
  }, [isEditing, msg.text]);

  const isMsgAmbient =
    msg.sender === "character" &&
    ["narrator", "system", "inner monologue"].some((s) =>
      msg.speakerName.toLowerCase().includes(s)
    );

  return (
    <div
      className={`flex flex-col group ${
        msg.sender === "user" ? "items-end" : "items-start"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 px-1">
        {msg.sender === "user" ? (
          <>
            {!isEditing && (
              <button
                onClick={() => onStartEdit(msg)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                title="Edit action"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[11px] text-zinc-500 font-mono select-none">
              {msg.timestamp}
            </span>
            <span className="text-xs font-semibold text-zinc-200 select-none">
              {msg.speakerName}
            </span>
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-400/80 bg-zinc-800 shadow-md flex items-center justify-center shrink-0 select-none">
              {(msg.avatarSrc && msg.avatarSrc.trim()) ||
              (playerAvatar && playerAvatar.trim()) ? (
                <img
                  src={
                    (msg.avatarSrc && msg.avatarSrc.trim()) ||
                    playerAvatar ||
                    defaultFallbackSprite
                  }
                  alt="User"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-sky-300" />
              )}
            </div>
          </>
        ) : (
          <>
            {isMsgAmbient ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-sky-400/80 bg-zinc-950 shadow-md flex items-center justify-center shrink-0 select-none">
                {msg.speakerName.toLowerCase().includes("system") ? (
                  <Terminal className="w-4 h-4 text-sky-400" />
                ) : (
                  <BookOpen className="w-4 h-4 text-sky-400" />
                )}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-rose-400/80 bg-zinc-900 shadow-md flex items-center justify-center shrink-0 select-none">
                <img
                  src={resolvedSpriteSrc || defaultFallbackSprite}
                  alt={msg.speakerName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultFallbackSprite;
                  }}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}
            <span
              className={`text-xs font-semibold select-none ${
                isMsgAmbient ? "text-sky-300" : "text-rose-300"
              }`}
            >
              {msg.speakerName}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono select-none">
              {msg.timestamp}
            </span>

            {!isEditing && !msg.isPending && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1 select-none">
                <button
                  onClick={() => onStartEdit(msg)}
                  className="p-1 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                  title="Edit response"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {isLatestCharacterTurn && !isLoading && (
                  <button
                    onClick={onRegenerateTurn}
                    className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    title="Regenerate response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm select-text transition-colors ${
          msg.sender === "user"
            ? "bg-gradient-to-br from-rose-600 to-pink-600 text-white rounded-tr-none"
            : "bg-zinc-900/95 border border-white/10 text-zinc-200 rounded-tl-none font-normal"
        }`}
        onClick={() => onSkipTypewriter(msg, isLatestCharacterTurn)}
      >
        {isEditing ? (
          <div className="flex flex-col gap-2 min-w-[260px] sm:min-w-[340px]">
            <textarea
              value={localEditText}
              onChange={(e) => setLocalEditText(e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-xl p-2.5 text-base sm:text-xs text-zinc-100 focus:outline-none focus:border-rose-400 font-sans resize-y min-h-[90px]"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">
                Supports markdown (*action*, **bold**, &gt; quote)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white rounded-lg border border-white/10 bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onSaveEdit(msg.id, localEditText)}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
              </div>
            </div>
          </div>
        ) : msg.isPending ? (
          <div className="flex items-center gap-2.5 py-1 text-rose-100 font-sans select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-100"></span>
            </span>
            <span className="text-xs font-medium tracking-wide italic text-rose-100/90">
              {playerName} is taking action...
            </span>
          </div>
        ) : isLatestCharacterTurn || isTypingUser ? (
          <MarkdownRenderer
            content={streamedContent ?? msg.text}
            mechanics={isLatestCharacterTurn ? msg.mechanics : undefined}
            isUser={msg.sender === "user"}
            isStreaming={isStreaming}
          />
        ) : (
          <MarkdownRenderer
            content={msg.text}
            mechanics={msg.mechanics}
            isUser={msg.sender === "user"}
          />
        )}

        {/* Inline Story Vitals Impact Pill (Damage Taken / Healed / Mana Expended) */}
        {msg.vitalsImpact &&
          (msg.vitalsImpact.hpDelta !== 0 || msg.vitalsImpact.mpDelta !== 0) && (
            <div
              className={`mt-2.5 px-3 py-1.5 rounded-xl border font-mono text-xs flex flex-wrap items-center justify-between gap-2 ${
                msg.vitalsImpact.hpDelta < 0
                  ? "bg-red-950/50 border-red-500/40 text-red-200"
                  : msg.vitalsImpact.hpDelta > 0
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                  : "bg-sky-950/50 border-sky-500/40 text-sky-200"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {msg.vitalsImpact.hpDelta !== 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    {msg.vitalsImpact.hpDelta > 0
                      ? `+${msg.vitalsImpact.hpDelta} HP Restored`
                      : `${msg.vitalsImpact.hpDelta} HP Damage Taken`}
                  </span>
                )}
                {msg.vitalsImpact.mpDelta !== 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {msg.vitalsImpact.mpDelta > 0
                      ? `+${msg.vitalsImpact.mpDelta} MP`
                      : `${msg.vitalsImpact.mpDelta} MP`}
                  </span>
                )}
              </div>
              {msg.vitalsImpact.reason && (
                <span className="text-[10px] opacity-85">
                  {msg.vitalsImpact.reason}
                </span>
              )}
            </div>
          )}
      </div>
    </div>
  );
});

