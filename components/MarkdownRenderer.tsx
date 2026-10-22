"use client";

import React from "react";
import { Terminal } from "lucide-react";
import { sanitizeNarrativeAndMechanics } from "@/lib/textSanitizer";

interface MarkdownRendererProps {
  content: string;
  mechanics?: string | null;
  isUser?: boolean;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Renders a single paragraph with spoken double-quoted dialogue ("...")
 * styled distinctly from surrounding narrative description, without relying on
 * fragile Markdown asterisk parsing.
 */
function renderFormattedParagraph(paragraph: string, isUser: boolean) {
  const parts = paragraph.split(/("[^"\n]+")/g);
  return parts.map((part, idx) => {
    if (part.startsWith('"') && part.endsWith('"') && part.length >= 2) {
      return (
        <span
          key={idx}
          className={
            isUser
              ? "text-white font-medium"
              : "text-rose-100 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]"
          }
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function MarkdownRenderer({
  content,
  mechanics = null,
  isUser = false,
  isStreaming = false,
  className = "",
}: MarkdownRendererProps) {
  if (!content && !mechanics) {
    return isStreaming ? (
      <span
        className={`inline-block w-1.5 h-3.5 ml-1 animate-pulse align-middle ${
          isUser
            ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
        }`}
      />
    ) : null;
  }

  const sanitized = sanitizeNarrativeAndMechanics(content, mechanics);
  const paragraphs = sanitized.narrative
    ? sanitized.narrative
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className={`text-sm leading-relaxed space-y-2.5 ${
        isUser ? "text-white" : "text-zinc-200"
      } ${className}`}
    >
      {/* Structured Narrative Prose Container */}
      <div className="space-y-2">
        {paragraphs.map((para, pIdx) => {
          const isLastParagraph = pIdx === paragraphs.length - 1;
          return (
            <p
              key={pIdx}
              className="leading-relaxed font-normal tracking-[0.01em]"
            >
              {renderFormattedParagraph(para, isUser)}
              {isStreaming && isLastParagraph && (
                <span
                  className={`inline-block w-1.5 h-3.5 ml-1 animate-pulse align-middle ${
                    isUser
                      ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      : "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"
                  }`}
                />
              )}
            </p>
          );
        })}
      </div>

      {/* Dedicated LitRPG System / Mechanics Container */}
      {sanitized.mechanics && !isUser && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-cyan-950/35 border border-cyan-500/30 text-cyan-200 font-mono text-xs flex items-start gap-2 shadow-inner">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{sanitized.mechanics}</span>
        </div>
      )}
    </div>
  );
}

export default MarkdownRenderer;
