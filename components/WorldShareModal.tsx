"use client";

import React, { useState, useMemo } from "react";
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Globe, 
  Shield, 
  Zap, 
  Heart,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { StoryContext } from "@/types/story";
import { 
  encodeMultiverseSeed, 
  generateShareableUrl, 
  generateDiscordRedditWorldCard 
} from "@/lib/multiverseShare";
import { soundEffects } from "@/lib/audioEngine";

interface WorldShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: StoryContext;
}

export function WorldShareModal({ isOpen, onClose, story }: WorldShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<"card" | "link" | "json">("card");

  const shareUrl = useMemo(() => {
    if (!isOpen) return "";
    return generateShareableUrl(story);
  }, [isOpen, story]);

  const cardMarkdown = useMemo(() => {
    if (!isOpen) return "";
    return generateDiscordRedditWorldCard(story, shareUrl);
  }, [isOpen, story, shareUrl]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCard = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(cardMarkdown);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2200);
  };

  const handleCopyJson = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(JSON.stringify(story, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2200);
  };

  const handleDownloadJson = () => {
    soundEffects.playClick();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(story, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${story.id || "astra-world"}-multiverse-seed.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/80 to-transparent" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">
                Share Multiverse Setup
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Export locked character seeds, custom world rules, and synergies for 1-click player import.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB BUTTONS */}
        <div className="px-6 pt-4 flex gap-2 border-b border-white/5 bg-zinc-950">
          <button
            onClick={() => setActiveTab("card")}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "card"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community Card (Discord / Reddit)</span>
          </button>

          <button
            onClick={() => setActiveTab("link")}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "link"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>1-Click Seed Link</span>
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`pb-2.5 px-3 text-xs font-mono font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "json"
                ? "border-purple-500 text-purple-300"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Raw JSON Data</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === "card" && (
            <div className="space-y-4">
              {/* Visual Preview Card */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-purple-500/30 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                      World Card Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40">
                    {story.genre}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white font-serif">{story.title}</h4>
                  <p className="text-xs text-zinc-300 italic mt-0.5 font-sans">"{story.tagline}"</p>
                </div>

                {/* Companions and Seeds Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  {(story.companions || []).slice(0, 4).map((c) => (
                    <div
                      key={c.id || c.name}
                      className="p-2 rounded-xl bg-black/50 border border-white/5 flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-purple-400/50 overflow-hidden shrink-0">
                        {c.baseImageUrl && (
                          <img
                            src={c.baseImageUrl}
                            alt={c.name}
                            className="w-full h-full object-cover object-top"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-200 truncate">{c.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">
                          Seed: <span className="text-purple-300">{c.seed}</span> • {c.romancePath || "Mono"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Narration: {story.narrationStyle}</span>
                  <span className="text-emerald-400">✦ 1-Click Instant Import Ready</span>
                </div>
              </div>

              {/* Copy Markdown Button */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-xs text-zinc-400">
                  Copy formatted card markdown ready to paste on Discord, Reddit, or Steam forums:
                </span>
                <button
                  onClick={handleCopyCard}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shrink-0 cursor-pointer active:scale-95"
                >
                  {copiedCard ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Card Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Card Markdown</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "link" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                This share link contains the complete compressed base64 world seed. Anyone opening this link can
                instantly load this exact story universe, complete with companion face seeds and custom world rules.
              </p>

              <div className="flex items-center gap-2 p-2 rounded-2xl bg-black/60 border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs text-zinc-300 font-mono focus:outline-none truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === "json" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Inspect or download the raw JSON schema for external tooling, offline backup, or modding:
              </p>

              <pre className="p-4 rounded-2xl bg-black/80 border border-white/10 text-[11px] font-mono text-purple-200/90 max-h-56 overflow-y-auto leading-relaxed select-text">
                {JSON.stringify(story, null, 2)}
              </pre>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedJson ? "JSON Copied!" : "Copy JSON"}</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .json File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
