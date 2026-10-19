import fs from "fs";
import path from "path";

export interface UserConfig {
  name: string;
  maxTurns: number; // 0 or negative means unlimited
  role?: "admin" | "tester" | "guest" | string;
}

export interface UserUsage {
  totalTurns: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  lastActive?: string;
  lastModel?: string;
}

export interface UserStatus {
  key: string;
  name: string;
  role: string;
  maxTurns: number;
  turnsUsed: number;
  remainingTurns: number; // -1 if unlimited
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  lastActive?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "allowed_users.json");
const USAGE_FILE = path.join(DATA_DIR, "usage_tracking.json");

// In-memory fallback if disk writes are restricted (e.g. serverless)
const memoryUsageCache: Record<string, UserUsage> = {};

/**
 * Loads allowed users list from environment variable or JSON file.
 */
export function getAllowedUsers(): Record<string, UserConfig> {
  const envConfig = process.env.ALLOWED_USERS?.trim();

  if (envConfig) {
    try {
      if (envConfig.startsWith("{")) {
        return JSON.parse(envConfig);
      }
      // Parse format: "KEY1:Alice:100,KEY2:Bob:50"
      const result: Record<string, UserConfig> = {};
      const pairs = envConfig.split(",");
      for (const pair of pairs) {
        const [rawKey, name, rawMax] = pair.split(":");
        if (rawKey) {
          result[rawKey.trim()] = {
            name: name?.trim() || "Adventurer",
            maxTurns: rawMax ? parseInt(rawMax.trim(), 10) : 100,
            role: "tester",
          };
        }
      }
      return result;
    } catch (err) {
      console.warn("Failed to parse ALLOWED_USERS env var:", err);
    }
  }

  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Failed to read allowed_users.json:", err);
  }

  // Built-in fallback keys
  return {
    "ASTRA-DEV-2026": {
      name: "Realm Architect (Admin)",
      maxTurns: 1000,
      role: "admin",
    },
    "CHRONICLE-GUEST": {
      name: "Traveling Nomad",
      maxTurns: 25,
      role: "guest",
    },
  };
}

/**
 * Retrieves tracked usage data from file or memory.
 */
export function getUserUsageMap(): Record<string, UserUsage> {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const content = fs.readFileSync(USAGE_FILE, "utf-8");
      const diskData = JSON.parse(content);
      return { ...diskData, ...memoryUsageCache };
    }
  } catch (err) {
    console.warn("Could not read usage_tracking.json:", err);
  }
  return { ...memoryUsageCache };
}

/**
 * Persists updated usage map to disk and memory.
 */
function saveUserUsageMap(data: Record<string, UserUsage>) {
  Object.assign(memoryUsageCache, data);

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Disk write might fail on certain serverless environments; memory cache remains active
    console.warn("Could not save to usage_tracking.json (using memory cache):", err);
  }
}

/**
 * Validates whether a user key exists and has remaining turns.
 */
export function validateUserKey(rawKey?: string | null): {
  valid: boolean;
  error?: string;
  user?: UserStatus;
} {
  if (!rawKey || typeof rawKey !== "string") {
    return { valid: false, error: "Access key is required to enter Astra Chronicles." };
  }

  const key = rawKey.trim();
  const allowed = getAllowedUsers();
  const config = allowed[key];

  if (!config) {
    return { valid: false, error: "Invalid access key. Please check your credentials or request entry." };
  }

  const usageMap = getUserUsageMap();
  const usage = usageMap[key] || {
    totalTurns: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
  };

  const maxTurns = config.maxTurns ?? 0;
  const turnsUsed = usage.totalTurns;
  const isUnlimited = maxTurns <= 0;
  const remainingTurns = isUnlimited ? -1 : Math.max(0, maxTurns - turnsUsed);

  if (!isUnlimited && turnsUsed >= maxTurns) {
    return {
      valid: false,
      error: `Turn quota reached for key "${key}" (${turnsUsed}/${maxTurns} turns used).`,
      user: {
        key,
        name: config.name,
        role: config.role || "tester",
        maxTurns,
        turnsUsed,
        remainingTurns: 0,
        totalTokens: usage.totalTokens,
        promptTokens: usage.totalPromptTokens,
        completionTokens: usage.totalCompletionTokens,
        lastActive: usage.lastActive,
      },
    };
  }

  return {
    valid: true,
    user: {
      key,
      name: config.name,
      role: config.role || "tester",
      maxTurns,
      turnsUsed,
      remainingTurns,
      totalTokens: usage.totalTokens,
      promptTokens: usage.totalPromptTokens,
      completionTokens: usage.totalCompletionTokens,
      lastActive: usage.lastActive,
    },
  };
}

/**
 * Records tokens and turn count for a user after an OpenRouter generation.
 */
export function recordUserTurn(
  rawKey: string,
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
  model?: string
): UserStatus {
  const key = rawKey.trim();
  const allowed = getAllowedUsers();
  const config = allowed[key] || { name: "Adventurer", maxTurns: 100, role: "tester" };
  const usageMap = getUserUsageMap();

  const current = usageMap[key] || {
    totalTurns: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
  };

  const pTokens = usage?.prompt_tokens || 0;
  const cTokens = usage?.completion_tokens || 0;
  const tTokens = usage?.total_tokens || (pTokens + cTokens);

  const updated: UserUsage = {
    totalTurns: current.totalTurns + 1,
    totalPromptTokens: current.totalPromptTokens + pTokens,
    totalCompletionTokens: current.totalCompletionTokens + cTokens,
    totalTokens: current.totalTokens + tTokens,
    lastActive: new Date().toISOString(),
    lastModel: model || current.lastModel,
  };

  usageMap[key] = updated;
  saveUserUsageMap(usageMap);

  const maxTurns = config.maxTurns ?? 0;
  const isUnlimited = maxTurns <= 0;
  const remainingTurns = isUnlimited ? -1 : Math.max(0, maxTurns - updated.totalTurns);

  return {
    key,
    name: config.name,
    role: config.role || "tester",
    maxTurns,
    turnsUsed: updated.totalTurns,
    remainingTurns,
    totalTokens: updated.totalTokens,
    promptTokens: updated.totalPromptTokens,
    completionTokens: updated.totalCompletionTokens,
    lastActive: updated.lastActive,
  };
}
