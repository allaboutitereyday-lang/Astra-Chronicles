"use client";

import React from "react";
import { Cloud, Sparkles, X, Settings2, Check, Zap } from "lucide-react";

export type TargetEnvironment = "local" | "cloud";

export interface LlmConfig {
  targetEnvironment: TargetEnvironment;
  modelId: string;
  temperature?: number;
  max_tokens?: number;
  repetition_penalty?: number;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  targetEnvironment: "cloud",
  modelId: "orchestrated-hybrid",
  temperature: 0.85,
  max_tokens: 1024,
  repetition_penalty: 1.1,
};

export function getStoredLlmConfig(): LlmConfig {
  if (typeof window === "undefined") return DEFAULT_LLM_CONFIG;
  try {
    const raw = localStorage.getItem("astra_llm_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        // Enforce cloud environment for all sessions
        parsed.targetEnvironment = "cloud";
        // If modelId is empty or an old local model, default to Smart Hybrid
        if (!parsed.modelId || (!parsed.modelId.includes("/") && parsed.modelId !== "orchestrated-hybrid")) {
          parsed.modelId = DEFAULT_LLM_CONFIG.modelId;
        }
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_LLM_CONFIG;
}

export function saveStoredLlmConfig(config: LlmConfig): void {
  if (typeof window === "undefined") return;
  try {
    const cloudOnlyConfig = { ...config, targetEnvironment: "cloud" as const };
    localStorage.setItem("astra_llm_config", JSON.stringify(cloudOnlyConfig));
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
  { id: "hermes3:8b", name: "Nous Hermes 3 (8B) • Local Inference" },
  { id: "hermes3:70b", name: "Nous Hermes 3 (70B) • High Capacity Local" },
];

export const CLOUD_MODELS = [
  {
    id: "orchestrated-hybrid",
    name: "Smart Hybrid (DeepSeek V3 + Euryale 70B)",
    shortName: "Smart Hybrid",
    description: "Automatic Multi-Model Orchestration: DeepSeek V3 handles instant background stats, abilities & choices, while Sao10K Euryale 70B drives uncensored story, romance & dialogue.",
    badge: "Recommended",
  },
  {
    id: "sao10k/l3.1-euryale-70b",
    name: "Sao10K: Euryale 70B (v2.2)",
    shortName: "Euryale 70B",
    description: "Best-in-class uncensored roleplay & ERP. Nuanced character chemistry, deep psychological reactions, and evocative dark fantasy prose.",
    badge: "Flagship RP",
  },
  {
    id: "nousresearch/hermes-3-llama-3.1-70b",
    name: "Nous Hermes 3 (70B)",
    shortName: "Hermes 3 70B",
    description: "Exceptional multi-turn storytelling, creative dialogue, and precise adherence to LitRPG system state and combat mechanics.",
    badge: "Story & LitRPG",
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek Chat (V3)",
    shortName: "DeepSeek Chat",
    description: "Cutting-edge 671B MoE model. Ultra-fast, highly intelligent, capable of deep narrative reasoning and intricate tactical choices.",
    badge: "Intelligence",
  },
  {
    id: "sao10k/l3-lunaris-8b",
    name: "Sao10K: Lunaris 8B",
    shortName: "Lunaris 8B",
    description: "Fast, uncensored 8B model with strong romantic and adventure dialogue. Highly responsive with minimal generation latency.",
    badge: "Fast & Light",
  },
  {
    id: "gryphe/mythomax-l2-13b",
    name: "MythoMax 13B",
    shortName: "MythoMax 13B",
    description: "Legendary visual novel & fictional roleplay merge. Fluid conversational pacing and poetic descriptive style.",
    badge: "Classic Fiction",
  },
  {
    id: "nousresearch/hermes-3-llama-3.1-405b",
    name: "Nous Hermes 3 (405B)",
    shortName: "Hermes 3 405B",
    description: "Colossal 405B parameter flagship model. Pinnacle narrative depth, intricate lore preservation, and uncensored world simulation.",
    badge: "Maximum Scale",
  },
];

/**
 * Executes a roleplay turn through the unified /api/roleplay route.
 */
export async function sendRoleplayTurn(
  messages: ChatMessage[],
  config: LlmConfig
): Promise<RoleplayApiResponse> {
  const resolvedModel = config.modelId === "orchestrated-hybrid" ? "sao10k/l3.1-euryale-70b" : config.modelId;

  const res = await fetch("/api/roleplay", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetEnvironment: "cloud",
      modelId: resolvedModel,
      messages,
      temperature: config.temperature ?? 0.85,
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
 * Clean UI dropdown and model card selector for OpenRouter Cloud LLMs.
 */
export function LlmProviderSelector({ config, onChange, className = "" }: LlmProviderSelectorProps) {
  const selectedModel = CLOUD_MODELS.find((m) => m.id === config.modelId) || CLOUD_MODELS[0];

  const handleModelChange = (selectedModelId: string) => {
    onChange({
      ...config,
      targetEnvironment: "cloud",
      modelId: selectedModelId,
    });
  };

  return (
    <div className={`p-4 rounded-2xl bg-zinc-950/90 border border-white/10 space-y-4 backdrop-blur-md shadow-xl ${className}`}>
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-mono font-semibold text-zinc-200 tracking-wider uppercase">
            AI Story &amp; Roleplay Engine
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-cyan-950/40 border-cyan-500/40 text-cyan-400 text-[10px] font-mono">
          <Cloud className="w-3 h-3 text-cyan-400" />
          <span>OpenRouter Cloud</span>
        </div>
      </div>

      {/* Model Selection Dropdown */}
      <div>
        <label className="text-[11px] font-mono text-zinc-400 block mb-1.5">
          Active AI Engine
        </label>
        <select
          value={config.modelId}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white font-sans focus:border-rose-500 focus:outline-none transition-colors cursor-pointer"
        >
          {CLOUD_MODELS.map((m) => (
            <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
              {m.name} [{m.badge}]
            </option>
          ))}
        </select>
      </div>

      {/* Active Model Highlight Card */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            {selectedModel.name}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-950/50 border border-rose-500/30 text-rose-300">
            {selectedModel.badge}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
          {selectedModel.description}
        </p>
      </div>

      {/* Endpoint & Vision Info Tip */}
      <div className="text-[10px] font-mono text-zinc-500 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5 space-y-1">
        <div className="flex items-center gap-1 text-cyan-400">
          <Cloud className="w-3 h-3 shrink-0" />
          <span>Direct OpenRouter Cloud Routing</span>
        </div>
        <div>
          Target: <code className="text-zinc-300">openrouter.ai/api/v1</code> &bull; Vision-to-Text Character Pipeline &bull; Automated Spell &amp; Quote Sanitizer
        </div>
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
 * Floating Backdrop Modal for configuring AI Cloud Model settings
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
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-rose-600/30 border border-cyan-500/40">
              <Cloud className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                AI ENGINE SELECTION
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Select your cloud model or smart hybrid orchestration
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
            Apply &amp; Close
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
  const activeModel = CLOUD_MODELS.find((m) => m.id === config.modelId);
  const displayName = activeModel ? activeModel.shortName : (config.modelId.split("/").pop() || config.modelId);
  const isHybrid = config.modelId === "orchestrated-hybrid";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer shadow-lg text-xs font-mono backdrop-blur-md ${
        isHybrid
          ? "bg-gradient-to-r from-rose-950/60 to-cyan-950/60 border-rose-500/50 hover:border-rose-400 text-white shadow-rose-950/30"
          : "bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/40 hover:border-cyan-500/70 text-cyan-300"
      } ${className}`}
      title={`AI Story Engine: ${displayName} (Click to switch engine)`}
    >
      {isHybrid ? (
        <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      ) : (
        <Cloud className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      )}
      <span className="font-semibold text-[11px]">
        <span className="text-zinc-400">AI:</span>{" "}
        <span className="text-white">{displayName}</span>
      </span>
    </button>
  );
}
