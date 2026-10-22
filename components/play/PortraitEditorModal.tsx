"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  X,
  RefreshCw,
  Check,
  User,
} from "lucide-react";
import { processImageUpload } from "@/lib/imageUtils";
import { soundEffects } from "@/lib/audioEngine";

interface PortraitEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  playerName: string;
  playerRole: string;
  storyGenre?: string;
  accessKey?: string;
  onSaveAvatar: (newAvatarUrl: string) => void;
}

export function PortraitEditorModal({
  isOpen,
  onClose,
  currentAvatar,
  playerName,
  playerRole,
  storyGenre = "Dark Fantasy LitRPG",
  accessKey = "",
  onSaveAvatar,
}: PortraitEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"prompt" | "url" | "upload">("prompt");
  const [promptText, setPromptText] = useState(
    `${playerName}, ${playerRole}, striking dark fantasy anime protagonist portrait, expressive eyes, detailed class attire, atmospheric lighting`
  );
  const [directUrl, setDirectUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleGenerateFromPrompt = async () => {
    if (!promptText.trim() || isGenerating) return;
    soundEffects.playClick();
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-key": accessKey,
        },
        body: JSON.stringify({
          mode: "character",
          prompt: promptText.trim(),
          character: {
            name: playerName,
            role: playerRole,
            visualPrompt: promptText.trim(),
          },
          genre: storyGenre,
          userAccessKey: accessKey,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "Failed to generate character portrait.");
      }
      setPreviewUrl(data.imageUrl);
      soundEffects.playIntroBell();
    } catch (err: any) {
      setErrorMsg(err.message || "Portrait synthesis failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyUrl = () => {
    if (!directUrl.trim()) return;
    soundEffects.playClick();
    setErrorMsg(null);
    setPreviewUrl(directUrl.trim());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEffects.playClick();
    setErrorMsg(null);
    try {
      const compressed = await processImageUpload(file, 512);
      setPreviewUrl(compressed);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process image file.");
    }
  };

  const handleConfirmSave = () => {
    if (!previewUrl) return;
    soundEffects.playIntroBell();
    onSaveAvatar(previewUrl);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
              Edit Character Portrait
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Portrait Preview */}
        <div className="flex items-center gap-4 bg-zinc-900/70 p-3.5 rounded-2xl border border-white/10">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-black border border-rose-500/40 shrink-0 flex items-center justify-center shadow-lg">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-zinc-600" />
            )}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-rose-400 animate-spin" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-bold text-white font-mono truncate">
              {playerName}
            </p>
            <p className="text-xs text-rose-400 font-mono truncate">
              {playerRole}
            </p>
            <p className="text-[11px] text-zinc-400 font-sans leading-snug">
              Updating your portrait syncs across the HUD, dialogue feed, and save state.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("prompt");
            }}
            className={`py-2 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "prompt"
                ? "bg-rose-600 text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Prompt</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("url");
            }}
            className={`py-2 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "url"
                ? "bg-rose-600 text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("upload");
            }}
            className={`py-2 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-rose-600 text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>PC Upload</span>
          </button>
        </div>

        {/* Tab Body */}
        {activeTab === "prompt" && (
          <div className="space-y-3">
            <label className="text-[11px] font-mono text-zinc-400 block">
              Appearance / ComfyUI Generation Prompt
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={3}
              placeholder="Describe hair, eyes, armor, aura, expression..."
              className="w-full bg-black/70 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-sans resize-none"
            />
            <button
              type="button"
              disabled={isGenerating || !promptText.trim()}
              onClick={handleGenerateFromPrompt}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>
                {isGenerating ? "Synthesizing Portrait..." : "Generate New Portrait"}
              </span>
            </button>
          </div>
        )}

        {activeTab === "url" && (
          <div className="space-y-3">
            <label className="text-[11px] font-mono text-zinc-400 block">
              Direct Image URL (HTTPS or Data URI)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://example.com/portrait.png"
                className="flex-1 bg-black/70 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold cursor-pointer transition-all"
              >
                Preview
              </button>
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-rose-500/50 bg-black/40 hover:bg-black/60 flex flex-col items-center justify-center gap-2 text-zinc-300 hover:text-white cursor-pointer transition-all"
            >
              <Upload className="w-6 h-6 text-rose-400" />
              <span className="text-xs font-mono font-bold">
                Click to Select Portrait Image from PC
              </span>
              <span className="text-[10px] text-zinc-500 font-sans">
                Automatically cropped &amp; optimized for instant save persistence
              </span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white font-mono text-xs cursor-pointer transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl || isGenerating}
            onClick={handleConfirmSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shadow-lg"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Portrait</span>
          </button>
        </div>
      </div>
    </div>
  );
}
