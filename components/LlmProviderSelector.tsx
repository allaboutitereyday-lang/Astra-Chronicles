"use client";

import React, { useState } from "react";
import { Cpu, Cloud, Check, Loader2, Sparkles, X, Settings2 } from "lucide-react";

export type TargetEnvironment = "local" | "cloud";

export interface LlmConfig {
  targetEnvironment: TargetEnvironment;
  modelId: string;
  temperature?: number;
  max_tokens?: number;
  repetition_penalty?: number;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  targetEnvironment: "local",
  modelId: "hermes3:8b",
  temperature: 0.8,
  max_tokens: 1024,
  repetition_penalty: 1.1,
};

export function getStoredLlmConfig(): LlmConfig {
  if (typeof window === "undefined") return DEFAULT_LLM_CONFIG;
  try {
    const raw = localStorage.getItem("astra_llm_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.targetEnvironment === "local" || parsed.targetEnvironment === "cloud")) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_LLM_CONFIG;
}

export function saveStoredLlmConfig(config: LlmConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("astra_llm_config", JSON.stringify(config));
  } catch {}
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface RoleplayApiResponse {
  success: boolean;
  text: string;
  model: string;
  targetEnvironment: TargetEnvironment;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
  error?: string;
}

export const LOCAL_MODELS = [
  { id: "hermes3:8b", name: "Nous Hermes 3 (8B) • Recommended for 6GB VRAM" },
  { id: "hermes3:70b", name: "Nous Hermes 3 (70B) • High Capacity / CPU Offload" },
  { id: "llama3.2:3b", name: "Llama 3.2 (3B) • Ultra-Fast Local" },
  { id: "qwen2.5:7b", name: "Qwen 2.5 (7B) • High Reasoning" },
];

export const CLOUD_MODELS = [
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat (V3) • Fast & Creative" },
  { id: "nousresearch/hermes-3-llama-3.1-405b", name: "Nous Hermes 3 (405B) • Flagship Cloud" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 (70B) Instruct" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
];

/**
 * Executes a roleplay turn through the unified /api/roleplay route.
 */
export async function sendRoleplayTurn(
  messages: ChatMessage[],
  config: LlmConfig
): Promise<RoleplayApiResponse> {
  const res = await fetch("/api/roleplay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetEnvironment: config.targetEnvironment,
      modelId: config.modelId,
      messages,
      temperature: config.temperature ?? 0.8,
      max_tokens: config.max_tokens ?? 1024,
      repetition_penalty: config.repetition_penalty ?? 1.1,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}: Failed to generate narrative response.`);
  }

  return data;
}

interface LlmProviderSelectorProps {
  config: LlmConfig;
  onChange: (newConfig: LlmConfig) => void;
  className?: string;
}

/**
 * Reusable UI toggle and dropdown selector for dynamic LLM routing.
 */
export function LlmProviderSelector({ config, onChange, className = "" }: LlmProviderSelectorProps) {
  const isLocal = config.targetEnvironment === "local";

  const handleEnvironmentChange = (env: TargetEnvironment) => {
    const defaultModel = env === "local" ? "hermes3:8b" : "deepseek/deepseek-chat";
    onChange({
      ...config,
      targetEnvironment: env,
      modelId: defaultModel,
    });
  };

  const handleModelChange = (modelId: string) => {
    onChange({
      ...config,
      modelId,
    });
  };

  const activeOptions = isLocal ? LOCAL_MODELS : CLOUD_MODELS;

  return (
    <div className={`p-4 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-3.5 backdrop-blur-md shadow-xl ${className}`}>
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-mono font-semibold text-zinc-200 tracking-wider uppercase">
            Neural Engine Route
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isLocal
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
              : "bg-cyan-950/40 border-cyan-500/40 text-cyan-400"
          }`}
        >
          {isLocal ? "Ollama :11434" : "OpenRouter Cloud"}
        </span>
      </div>

      {/* Target Environment Segmented Toggle */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => handleEnvironmentChange("local")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono transition-all cursor-pointer ${
            isLocal
              ? "bg-zinc-800 text-white shadow-sm border border-white/10 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local (Hermes 3)</span>
        </button>

        <button
          type="button"
          onClick={() => handleEnvironmentChange("cloud")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-mono transition-all cursor-pointer ${
            !isLocal
              ? "bg-zinc-800 text-white shadow-sm border border-white/10 font-bold"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cloud (OpenRouter)</span>
        </button>
      </div>

      {/* Model Selection Dropdown */}
      <div>
        <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">
          Active Model Designation
        </label>
        <select
          value={config.modelId}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-sans focus:border-rose-500 focus:outline-none transition-colors"
        >
          {activeOptions.map((m) => (
            <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Endpoint Info Tip */}
      <div className="text-[10px] font-mono text-zinc-500 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
        {isLocal ? (
          <span>
            Target: <code className="text-zinc-300">http://127.0.0.1:11434/v1</code> &bull; Local zero-latency inference via Ollama.
          </span>
        ) : (
          <span>
            Target: <code className="text-zinc-300">openrouter.ai/api/v1</code> &bull; Authenticated via <code className="text-zinc-300">OPENROUTER_API_KEY</code>.
          </span>
        )}
      </div>
    </div>
  );
}

interface LlmProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LlmConfig;
  onChange: (newConfig: LlmConfig) => void;
}

/**
 * Floating Backdrop Modal for configuring LLM Neural Engine settings
 */
export function LlmProviderModal({ isOpen, onClose, config, onChange }: LlmProviderModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600/30 to-purple-600/30 border border-rose-500/40">
              <Settings2 className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                AI ENGINE CONFIGURATION
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Select inference engine for roleplay turns & world generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <LlmProviderSelector config={config} onChange={onChange} />

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-900/40"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface LlmQuickPillProps {
  config: LlmConfig;
  onClick: () => void;
  className?: string;
}

/**
 * Compact Pill button showing current AI backend, clickable to open the configuration modal
 */
export function LlmQuickPill({ config, onClick, className = "" }: LlmQuickPillProps) {
  const isLocal = config.targetEnvironment === "local";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer shadow-lg text-xs font-mono backdrop-blur-md ${
        isLocal
          ? "bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-500/40 hover:border-emerald-500/70 text-emerald-300"
          : "bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/40 hover:border-cyan-500/70 text-cyan-300"
      } ${className}`}
      title={`AI Engine: ${isLocal ? "Local Ollama" : "Cloud OpenRouter"} (${config.modelId})`}
    >
      {isLocal ? (
        <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
      ) : (
        <Cloud className="w-3.5 h-3.5 text-cyan-400" />
      )}
      <span className="font-semibold text-[11px]">
        {isLocal ? "Local" : "Cloud"}:{" "}
        <span className="text-white">
          {config.modelId.includes("hermes3") ? "Hermes 3" : config.modelId.split("/").pop() || config.modelId}
        </span>
      </span>
    </button>
  );
}
