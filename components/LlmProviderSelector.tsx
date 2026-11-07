"use client";

import React from "react";
import { Cloud, Sparkles, X, Settings2, Check, Zap, BookOpen } from "lucide-react";
import type { NarrativeDepthMode } from "@/lib/narrationStyles";

export type { NarrativeDepthMode };
export type TargetEnvironment = "local" | "cloud";

export interface LlmConfig {
  targetEnvironment: TargetEnvironment;
  modelId: string;
  temperature?: number;
  max_tokens?: number;
  repetition_penalty?: number;
  narrativeDepth?: NarrativeDepthMode;
}

export const NARRATIVE_DEPTH_OPTIONS: Array<{
  id: NarrativeDepthMode;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: "deep_novelistic",
    label: "Deep Novelistic (5–7+ Paragraphs)",
    badge: "Maximum Depth",
    description: "Multi-beat literary scenes with deep sensory grounding, psychological subtext, physical micro-tells, and multi-stage spoken dialogue.",
  },
  {
    id: "expansive",
    label: "Expansive (3–5 Paragraphs)",
    badge: "Rich Pacing",
    description: "Detailed environmental choreography, multi-sentence character reactions, and extended conversational interplay.",
  },
  {
    id: "standard",
    label: "Standard (2–3 Paragraphs)",
    badge: "Classic VN",
    description: "Concise visual novel pacing with focused scene descriptions and direct dialogue exchanges.",
  },
];

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  targetEnvironment: "cloud",
  modelId: "orchestrated-hybrid",
  temperature: 0.85,
  max_tokens: 3584,
  repetition_penalty: 1.1,
  narrativeDepth: "deep_novelistic",
};

export const LEGACY_MODEL_MIGRATIONS: Record<string, string> = {
  "nousresearch/hermes-3-llama-3.1-70b": "nousresearch/hermes-4-405b",
  "nousresearch/hermes-3-llama-3.1-405b": "nousresearch/hermes-4-405b",
  "deepseek/deepseek-chat": "deepseek/deepseek-v3.2",
};

export function normalizeLegacyModelId(modelId?: string | null): string {
  if (!modelId) return DEFAULT_LLM_CONFIG.modelId;
  const trimmed = modelId.trim();
  return LEGACY_MODEL_MIGRATIONS[trimmed] || trimmed;
}

export function isHybridModelId(modelId?: string | null): boolean {
  return modelId === "orchestrated-hybrid" || modelId === "orchestrated-hybrid-deepseek";
}

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
        if (
          !parsed.modelId ||
          (!parsed.modelId.includes("/") && !isHybridModelId(parsed.modelId))
        ) {
          parsed.modelId = DEFAULT_LLM_CONFIG.modelId;
        } else {
          parsed.modelId = normalizeLegacyModelId(parsed.modelId);
        }
        // Migrate legacy 1024 max_tokens cap to the expanded 3584 budget
        if (!parsed.max_tokens || parsed.max_tokens <= 1024) {
          parsed.max_tokens = DEFAULT_LLM_CONFIG.max_tokens;
        }
        if (
          parsed.narrativeDepth !== "standard" &&
          parsed.narrativeDepth !== "expansive" &&
          parsed.narrativeDepth !== "deep_novelistic"
        ) {
          parsed.narrativeDepth = DEFAULT_LLM_CONFIG.narrativeDepth;
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
    name: "Smart Hybrid (Gemini 2.5 Flash + Euryale 70B)",
    shortName: "Smart Hybrid (Gemini)",
    description: "OOC.ai-Style Multi-Model Orchestration: Gemini 2.5 Flash (1M context & native vision) orchestrates fast visual-novel turns, LitRPG systems & dynamic choices, paired with Euryale 70B for flagship roleplay.",
    badge: "Recommended",
  },
  {
    id: "orchestrated-hybrid-deepseek",
    name: "Smart Hybrid (DeepSeek V3.2 + Euryale 70B)",
    shortName: "Smart Hybrid (V3.2)",
    description: "Uncensored Multi-Model Orchestration: DeepSeek V3.2 orchestrates tactical game mastery, LitRPG systems & high-variety narrative turns, combined with Euryale 70B companion roleplay.",
    badge: "Hybrid • V3.2",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6 (OOC.ai Pro Engine)",
    shortName: "Claude Sonnet 4.6",
    description: "Flagship OOC.ai / Wrtn Crack Pro narrative engine. Unmatched character psychology, witty anime & rom-com banter, zero-repetition scene pacing, and 1M context.",
    badge: "OOC Pro Flagship",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash (1M Context • Fast VN)",
    shortName: "Gemini 2.5 Flash",
    description: "High-speed 1M-token context engine used by OOC.ai for deep chronicle memory retention, native portrait vision, and snappy anime/visual-novel pacing.",
    badge: "Anime & Memory",
  },
  {
    id: "anthracite-org/magnum-v4-72b",
    name: "Magnum v4 72B (Uncensored Claude-Style)",
    shortName: "Magnum v4 72B",
    description: "Fine-tuned on 72B parameters specifically to replicate Claude Sonnet/Opus literary prose and character depth without safety refusals or lecturing.",
    badge: "Uncensored Pro",
  },
  {
    id: "sao10k/l3.1-euryale-70b",
    name: "Sao10K: Euryale 70B (v2.2)",
    shortName: "Euryale 70B",
    description: "Best-in-class uncensored roleplay & ERP. Nuanced character chemistry, deep psychological reactions, and evocative dark fantasy prose.",
    badge: "Flagship RP",
  },
  {
    id: "thedrummer/cydonia-24b-v4.1",
    name: "TheDrummer: Cydonia 24B v4.1",
    shortName: "Cydonia 24B v4.1",
    description: "Purpose-built 'Anti-Slop' roleplay model (131K context) tuned specifically to eliminate repetitive AI clichés, looping props, and purple prose.",
    badge: "Anti-Repetition",
  },
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2 (Next-Gen 671B MoE)",
    shortName: "DeepSeek V3.2",
    description: "Upgraded 671B MoE model replacing V3.0. Ultra-fast, lower cost, stronger creative prose variety, and intricate tactical LitRPG reasoning.",
    badge: "Intelligence",
  },
  {
    id: "nousresearch/hermes-4-405b",
    name: "Nous Hermes 4 (405B)",
    shortName: "Hermes 4 405B",
    description: "Colossal 405B parameter flagship model replacing Hermes 3. Pinnacle narrative depth, intricate lore preservation, and uncensored world simulation.",
    badge: "Maximum Scale",
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
];

/**
 * Executes a roleplay turn through the unified /api/roleplay route.
 */
export async function sendRoleplayTurn(
  messages: ChatMessage[],
  config: LlmConfig
): Promise<RoleplayApiResponse> {
  const normalizedId = normalizeLegacyModelId(config.modelId);
  const resolvedModel = isHybridModelId(normalizedId) ? "sao10k/l3.1-euryale-70b" : normalizedId;

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
      max_tokens: config.max_tokens ?? 3584,
      repetition_penalty: config.repetition_penalty ?? 1.1,
      narrativeDepth: config.narrativeDepth ?? "deep_novelistic",
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
  defaultOpenSettings?: boolean;
}

/**
 * Clean UI dropdown, model card selector, and interactive Model Settings for OpenRouter Cloud LLMs.
 */
export function LlmProviderSelector({
  config,
  onChange,
  className = "",
  defaultOpenSettings = false,
}: LlmProviderSelectorProps) {
  const [showSettings, setShowSettings] = React.useState(defaultOpenSettings);
  const selectedModel = CLOUD_MODELS.find((m) => m.id === config.modelId) || CLOUD_MODELS[0];
  const currentDepth: NarrativeDepthMode = config.narrativeDepth || "deep_novelistic";
  const selectedDepthOption = NARRATIVE_DEPTH_OPTIONS.find((d) => d.id === currentDepth) || NARRATIVE_DEPTH_OPTIONS[0];

  const handleModelChange = (selectedModelId: string) => {
    onChange({
      ...config,
      targetEnvironment: "cloud",
      modelId: selectedModelId,
    });
  };

  const handleDepthChange = (depth: NarrativeDepthMode) => {
    onChange({
      ...config,
      narrativeDepth: depth,
    });
  };

  const handleParamChange = (field: keyof LlmConfig, value: number) => {
    onChange({
      ...config,
      [field]: value,
    });
  };

  const handleResetDefaults = () => {
    onChange({
      ...config,
      temperature: DEFAULT_LLM_CONFIG.temperature,
      max_tokens: DEFAULT_LLM_CONFIG.max_tokens,
      repetition_penalty: DEFAULT_LLM_CONFIG.repetition_penalty,
      narrativeDepth: DEFAULT_LLM_CONFIG.narrativeDepth,
    });
  };

  const currentTemp = config.temperature ?? DEFAULT_LLM_CONFIG.temperature!;
  const currentTokens = config.max_tokens ?? DEFAULT_LLM_CONFIG.max_tokens!;
  const currentRepPenalty = config.repetition_penalty ?? DEFAULT_LLM_CONFIG.repetition_penalty!;

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono transition-all cursor-pointer ${
              showSettings
                ? "bg-rose-950/70 border-rose-500/50 text-rose-300 font-bold"
                : "bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white"
            }`}
            title="Adjust Temperature, Max Tokens, and Repetition Penalty"
          >
            <Settings2 className="w-3 h-3 text-rose-400" />
            <span>Model Settings</span>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-cyan-950/40 border-cyan-500/40 text-cyan-400 text-[10px] font-mono">
            <Cloud className="w-3 h-3 text-cyan-400" />
            <span>OpenRouter Cloud</span>
          </div>
        </div>
      </div>

      {/* Model Selection Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-mono text-zinc-400 block">
            Active AI Engine
          </label>
          <span className="text-[10px] font-mono text-zinc-500">
            {CLOUD_MODELS.length} Models Available
          </span>
        </div>
        <select
          value={config.modelId}
          onChange={(e) => handleModelChange(e.target.value)}
          className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white font-sans focus:border-rose-500 focus:outline-none transition-colors cursor-pointer"
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

      {/* Narrative Depth & Response Length Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-rose-400" />
            <span>Narrative Depth &amp; Response Length</span>
          </label>
          <span className="text-[10px] font-mono text-rose-300">
            {selectedDepthOption.badge}
          </span>
        </div>
        <select
          value={currentDepth}
          onChange={(e) => handleDepthChange(e.target.value as NarrativeDepthMode)}
          className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white font-sans focus:border-rose-500 focus:outline-none transition-colors cursor-pointer"
        >
          {NARRATIVE_DEPTH_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
              {opt.label} [{opt.badge}]
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-[11px] text-zinc-400 leading-relaxed font-sans">
          {selectedDepthOption.description}
        </p>
      </div>

      {/* Interactive Model Settings Panel */}
      {showSettings && (
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-rose-500/30 space-y-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-rose-400">
              <Settings2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                Inference Parameters
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[10px] font-mono text-zinc-400 hover:text-rose-300 underline cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>

          {/* Temperature Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-300 font-medium">Temperature (Creativity)</span>
              <span className="text-rose-400 font-bold">{currentTemp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.5"
              step="0.05"
              value={currentTemp}
              onChange={(e) => handleParamChange("temperature", parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>0.2 (Precise / Factual)</span>
              <span>0.85 (Balanced RP)</span>
              <span>1.5 (Wild / Novel)</span>
            </div>
          </div>

          {/* Max Tokens Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-300 font-medium">Max Output Tokens</span>
              <span className="text-cyan-400 font-bold">{currentTokens} tokens</span>
            </div>
            <input
              type="range"
              min="512"
              max="4096"
              step="128"
              value={currentTokens}
              onChange={(e) => handleParamChange("max_tokens", parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>512 (Compact)</span>
              <span>2048 (Expansive)</span>
              <span>4096 (Deep Novelistic)</span>
            </div>
          </div>

          {/* Repetition Penalty Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-300 font-medium">Repetition Penalty</span>
              <span className="text-amber-400 font-bold">{currentRepPenalty.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.3"
              step="0.02"
              value={currentRepPenalty}
              onChange={(e) => handleParamChange("repetition_penalty", parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>1.00 (Off)</span>
              <span>1.10 (Standard)</span>
              <span>1.30 (Strict Novelty)</span>
            </div>
          </div>
        </div>
      )}

      {/* Endpoint & Vision Info Tip */}
      <div className="text-[10px] font-mono text-zinc-500 leading-relaxed bg-white/[0.02] p-2.5 rounded-lg border border-white/5 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-cyan-400">
            <Cloud className="w-3 h-3 shrink-0" />
            <span>Direct OpenRouter Cloud Routing</span>
          </div>
          <span className="text-zinc-400">
            T: {currentTemp.toFixed(2)} &bull; {currentTokens} tok &bull; R: {currentRepPenalty.toFixed(2)}
          </span>
        </div>
        <div>
          Target: <code className="text-zinc-300">openrouter.ai/api/v1</code> &bull; Vision-to-Text Pipeline &bull; Automated LitRPG Parser
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
  initialOpenSettings?: boolean;
}

/**
 * Floating Backdrop Modal for configuring AI Cloud Model settings
 */
export function LlmProviderModal({
  isOpen,
  onClose,
  config,
  onChange,
  initialOpenSettings = false,
}: LlmProviderModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-rose-600/30 border border-cyan-500/40">
              <Cloud className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                AI ENGINE &amp; MODEL SETTINGS
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans">
                Configure your cloud model, temperature, and generation tokens
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

        <LlmProviderSelector
          config={config}
          onChange={onChange}
          defaultOpenSettings={initialOpenSettings}
        />

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
  const normalizedId = normalizeLegacyModelId(config.modelId);
  const activeModel = CLOUD_MODELS.find((m) => m.id === normalizedId);
  const displayName = activeModel ? activeModel.shortName : (normalizedId.split("/").pop() || normalizedId);
  const isHybrid = isHybridModelId(normalizedId);

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
