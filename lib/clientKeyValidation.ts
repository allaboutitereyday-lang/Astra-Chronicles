export interface ClientUserStatus {
  key: string;
  name: string;
  role: string;
  maxTurns: number;
  turnsUsed: number;
  remainingTurns: number;
  totalTokens: number;
}

export const KNOWN_REALM_KEYS: Record<string, { name: string; role: string; maxTurns: number }> = {
  "ASTRA-DEV-2026": {
    name: "Realm Architect (Admin)",
    role: "admin",
    maxTurns: 1000,
  },
  "CHRONICLE-VIP-01": {
    name: "Alpha Adventurer 1",
    role: "tester",
    maxTurns: 50,
  },
  "CHRONICLE-VIP-02": {
    name: "Alpha Adventurer 2",
    role: "tester",
    maxTurns: 50,
  },
  "CHRONICLE-GUEST": {
    name: "Traveling Nomad",
    role: "guest",
    maxTurns: 20,
  },
};

/**
 * Validates a key client-side. Works universally in Electron desktop builds,
 * offline mode, or when static hosting prevents server API execution.
 */
export function validateKeyClientSide(rawKey?: string | null): {
  valid: boolean;
  user?: ClientUserStatus;
  error?: string;
} {
  if (!rawKey || typeof rawKey !== "string") {
    return { valid: false, error: "Please enter an access key." };
  }

  const key = rawKey.trim();

  // 1. Direct OpenRouter API key format
  if (key.startsWith("sk-or-") || (key.startsWith("sk-") && key.length > 20)) {
    return {
      valid: true,
      user: {
        key,
        name: "OpenRouter Direct Access",
        role: "admin",
        maxTurns: -1,
        turnsUsed: 0,
        remainingTurns: -1,
        totalTokens: 0,
      },
    };
  }

  // 2. Known Realm / Allowed Access Keys
  const matched = KNOWN_REALM_KEYS[key] || KNOWN_REALM_KEYS[key.toUpperCase()];
  if (matched) {
    return {
      valid: true,
      user: {
        key,
        name: matched.name,
        role: matched.role,
        maxTurns: matched.maxTurns,
        turnsUsed: 0,
        remainingTurns: matched.maxTurns,
        totalTokens: 0,
      },
    };
  }

  return {
    valid: false,
    error: "Invalid access key. Please check your credentials or request entry.",
  };
}

