import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type OAuthProviderType = "google" | "discord" | "github";

export interface CloudAccountUser {
  id: string;
  email: string;
  displayName: string;
  provider: "email" | "google" | "discord" | "github" | "local_realm";
  linkedProviders?: string[];
  lastSignInAt?: string;
  avatarUrl?: string;
  mode: "supabase" | "local_server";
}

export function notifyCloudAuthChanged(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("astra-auth-changed", { detail: { timestamp: Date.now() } }));
  } catch {}
}

/**
 * Checks if the current URL contains an OAuth error returned by Supabase or Google
 */
export function extractOAuthCallbackError(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const searchErrDesc = url.searchParams.get("error_description");
    const searchErr = url.searchParams.get("error");
    if (searchErrDesc || searchErr) {
      return decodeURIComponent((searchErrDesc || searchErr || "").replace(/\+/g, " "));
    }
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashErrDesc = hashParams.get("error_description");
      const hashErr = hashParams.get("error");
      if (hashErrDesc || hashErr) {
        return decodeURIComponent((hashErrDesc || hashErr || "").replace(/\+/g, " "));
      }
    }
  } catch {}
  return null;
}

const LOCAL_ACCOUNT_STORAGE_KEY = "astra_cloud_account_session";
const CUSTOM_SUPABASE_CFG_KEY = "astra_custom_supabase_config";
const TRAVELER_PROFILE_OVERRIDE_KEY = "astra_traveler_profile_override";

/**
 * Decodes a base64url JWT payload safely in the browser.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Captures the Supabase OAuth `#access_token=...` JWT from `window.location.hash` before
 * `@supabase/supabase-js` strips the hash (which otherwise discards the Google session if
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` is set to the project ID instead of the `eyJ...` anon key).
 */
export function captureOAuthSessionFromUrlHash(): CloudAccountUser | null {
  if (typeof window === "undefined" || !window.location.hash) return null;
  try {
    const rawHash = window.location.hash.replace(/^#/, "");
    if (!rawHash.includes("access_token=")) return null;

    const params = new URLSearchParams(rawHash);
    const accessToken = params.get("access_token");
    if (!accessToken) return null;

    const payload = decodeJwtPayload(accessToken);
    if (!payload || typeof payload.sub !== "string") return null;

    const userMeta = (payload.user_metadata || {}) as Record<string, unknown>;
    const appMeta = (payload.app_metadata || {}) as Record<string, unknown>;
    const providersSet = new Set<string>();

    if (typeof appMeta.provider === "string") {
      providersSet.add(appMeta.provider.toLowerCase());
    }
    if (Array.isArray(appMeta.providers)) {
      for (const p of appMeta.providers) {
        if (typeof p === "string") providersSet.add(p.toLowerCase());
      }
    }
    if (typeof userMeta.iss === "string" && userMeta.iss.includes("google")) {
      providersSet.add("google");
    }
    const pendingProvider = window.sessionStorage?.getItem("astra_oauth_pending");
    if (pendingProvider) {
      providersSet.add(pendingProvider.toLowerCase());
    }

    let resolvedProvider: CloudAccountUser["provider"] = "google";
    if (providersSet.has("google")) resolvedProvider = "google";
    else if (providersSet.has("discord")) resolvedProvider = "discord";
    else if (providersSet.has("github")) resolvedProvider = "github";
    else if (typeof appMeta.provider === "string") {
      resolvedProvider = appMeta.provider as CloudAccountUser["provider"];
    }

    const email =
      (typeof payload.email === "string" && payload.email) ||
      (typeof userMeta.email === "string" && userMeta.email) ||
      `${payload.sub.slice(0, 8)}@astral.nexus`;

    const displayName =
      (typeof userMeta.full_name === "string" && userMeta.full_name) ||
      (typeof userMeta.name === "string" && userMeta.name) ||
      (typeof userMeta.user_name === "string" && userMeta.user_name) ||
      email.split("@")[0] ||
      "Astral Traveler";

    const avatarUrl =
      (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
      (typeof userMeta.picture === "string" && userMeta.picture) ||
      undefined;

    const capturedUser: CloudAccountUser = {
      id: payload.sub,
      email,
      displayName,
      provider: resolvedProvider,
      linkedProviders: Array.from(providersSet.size > 0 ? providersSet : [resolvedProvider]),
      lastSignInAt: new Date().toISOString(),
      avatarUrl,
      mode: "supabase",
    };

    window.localStorage?.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(capturedUser));
    return capturedUser;
  } catch {
    return null;
  }
}

// Immediately inspect URL hash when module loads in browser before Supabase client clears it
if (typeof window !== "undefined") {
  captureOAuthSessionFromUrlHash();
}

export interface TravelerProfileOverride {
  displayName?: string;
  avatarUrl?: string;
  titleBadge?: string;
  preferredNarrationStyle?: string;
}

export function getTravelerProfileOverride(): TravelerProfileOverride {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(TRAVELER_PROFILE_OVERRIDE_KEY);
    if (raw) {
      return JSON.parse(raw) as TravelerProfileOverride;
    }
  } catch {}
  return {};
}

export function saveTravelerProfileOverride(patch: Partial<TravelerProfileOverride>): TravelerProfileOverride {
  const current = getTravelerProfileOverride();
  const next: TravelerProfileOverride = { ...current, ...patch };
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(TRAVELER_PROFILE_OVERRIDE_KEY, JSON.stringify(next));
    } catch {}
  }
  return next;
}

let cachedSupabaseClient: SupabaseClient | null = null;
let cachedConfigKey = "";

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const envKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (envUrl && envKey && envUrl.startsWith("http")) {
    return { url: envUrl, anonKey: envKey, isConfigured: true };
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(CUSTOM_SUPABASE_CFG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.url && parsed?.anonKey && String(parsed.url).startsWith("http")) {
          return {
            url: String(parsed.url).trim(),
            anonKey: String(parsed.anonKey).trim(),
            isConfigured: true,
          };
        }
      }
    } catch {}
  }

  return { url: "", anonKey: "", isConfigured: false };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (!cleanUrl || !cleanKey) {
    localStorage.removeItem(CUSTOM_SUPABASE_CFG_KEY);
  } else {
    localStorage.setItem(CUSTOM_SUPABASE_CFG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  }
  cachedSupabaseClient = null;
  cachedConfigKey = "";
}

export function getSupabaseClient(): SupabaseClient | null {
  captureOAuthSessionFromUrlHash();
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  const nextKey = `${url}::${anonKey}`;
  if (cachedSupabaseClient && cachedConfigKey === nextKey) {
    return cachedSupabaseClient;
  }

  cachedSupabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "implicit",
    },
  });
  cachedConfigKey = nextKey;
  return cachedSupabaseClient;
}

/**
 * Retrieves the currently signed-in cross-save user (from Supabase Auth or Local Realm Server session)
 */
export async function getActiveCloudUser(): Promise<CloudAccountUser | null> {
  captureOAuthSessionFromUrlHash();
  const override = getTravelerProfileOverride();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const u = data.user;
        const providersSet = new Set<string>();
        if (typeof u.app_metadata?.provider === "string") {
          providersSet.add(u.app_metadata.provider.toLowerCase());
        }
        if (Array.isArray(u.app_metadata?.providers)) {
          for (const p of u.app_metadata.providers) {
            if (typeof p === "string") providersSet.add(p.toLowerCase());
          }
        }
        if (Array.isArray(u.identities)) {
          for (const idObj of u.identities) {
            if (typeof idObj?.provider === "string") {
              providersSet.add(idObj.provider.toLowerCase());
            }
          }
        }

        const linkedProviders = Array.from(providersSet);
        let resolvedProvider: CloudAccountUser["provider"] = "email";
        if (providersSet.has("google")) resolvedProvider = "google";
        else if (providersSet.has("discord")) resolvedProvider = "discord";
        else if (providersSet.has("github")) resolvedProvider = "github";
        else if (typeof u.app_metadata?.provider === "string") {
          resolvedProvider = u.app_metadata.provider as CloudAccountUser["provider"];
        }

        const metaName =
          override.displayName ||
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.user_metadata?.user_name ||
          u.email?.split("@")[0] ||
          "Astral Traveler";
        const resolvedUser: CloudAccountUser = {
          id: u.id,
          email: u.email || `${u.id.slice(0, 8)}@astral.nexus`,
          displayName: metaName,
          provider: resolvedProvider,
          linkedProviders,
          lastSignInAt: u.last_sign_in_at,
          avatarUrl:
            override.avatarUrl ||
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture,
          mode: "supabase",
        };
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(resolvedUser));
          } catch {}
        }
        return resolvedUser;
      }
    } catch (err) {
      console.warn("Supabase getUser check failed:", err);
    }
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_ACCOUNT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CloudAccountUser;
        if (parsed && parsed.id && parsed.email) {
          return {
            ...parsed,
            displayName: override.displayName || parsed.displayName,
            avatarUrl: override.avatarUrl || parsed.avatarUrl,
            linkedProviders: parsed.linkedProviders || [parsed.provider || "local_realm"],
          };
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Signs in or registers via Email + Password.
 * Uses Supabase Auth when configured, or falls back to the built-in `/api/cloud-sync` account auth.
 */
export async function authenticateWithEmail(params: {
  email: string;
  password: string;
  mode: "signin" | "signup";
  displayName?: string;
}): Promise<{ user: CloudAccountUser | null; error?: string; message?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const password = params.password;

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { user: null, error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { user: null, error: "Password must be at least 6 characters." };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (params.mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: params.displayName?.trim() || cleanEmail.split("@")[0],
            },
          },
        });
        if (error) return { user: null, error: error.message };
        if (data?.user) {
          const user: CloudAccountUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            displayName:
              params.displayName?.trim() ||
              data.user.user_metadata?.full_name ||
              cleanEmail.split("@")[0],
            provider: "email",
            mode: "supabase",
          };
          if (!data.session) {
            return {
              user,
              message: "Confirmation email sent! Check your inbox to activate cloud sync, or sign in once verified.",
            };
          }
          return { user };
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) return { user: null, error: error.message };
        if (data?.user) {
          const user: CloudAccountUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            displayName:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              cleanEmail.split("@")[0],
            provider: "email",
            mode: "supabase",
          };
          return { user };
        }
      }
    } catch (err: unknown) {
      return { user: null, error: err instanceof Error ? err.message : "Supabase authentication failed." };
    }
  }

  // Fallback: Authenticate against `/api/cloud-sync` local server account store
  try {
    const res = await fetch("/api/cloud-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: params.mode === "signup" ? "register" : "login",
        email: cleanEmail,
        password,
        displayName: params.displayName?.trim() || cleanEmail.split("@")[0],
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { user: null, error: data.error || "Authentication failed." };
    }

    const user: CloudAccountUser = {
      id: data.user.id,
      email: data.user.email,
      displayName: data.user.displayName,
      provider: "local_realm",
      mode: "local_server",
    };

    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(user));
    }

    return { user };
  } catch {
    // Offline / static desktop fallback: deterministic local account profile
    const deterministicId = `local_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`;
    const user: CloudAccountUser = {
      id: deterministicId,
      email: cleanEmail,
      displayName: params.displayName?.trim() || cleanEmail.split("@")[0],
      provider: "local_realm",
      mode: "local_server",
    };
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(user));
    }
    return { user };
  }
}

/**
 * Initiates 1-click OAuth sign-in with Google, Discord, or GitHub via Supabase Auth.
 */
export async function signInWithOAuthProvider(
  provider: OAuthProviderType
): Promise<{ redirected: boolean; error?: string }> {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  const supabase = getSupabaseClient();
  if (!supabase || !isConfigured) {
    return {
      redirected: false,
      error: `To use ${provider.toUpperCase()} OAuth, configure NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY (or paste them in Cloud Settings below), or sign in immediately with Email & Password.`,
    };
  }

  // Pre-flight check Supabase Auth settings so the browser never navigates to a raw 400 "Unsupported provider: provider is not enabled" JSON page
  try {
    const settingsRes = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings?.external && settings.external[provider] === false) {
        const callbackUrl = `${url.replace(/\/+$/, "")}/auth/v1/callback`;
        return {
          redirected: false,
          error: `${provider.toUpperCase()} is not enabled in your Supabase Dashboard yet. Go to Supabase Dashboard → Authentication → Providers → ${provider.toUpperCase()}, toggle it ON, and paste your Client ID & Secret (Callback URL: ${callbackUrl}). Or use the Email Cross-Save Account form below right now!`,
        };
      }
    }
  } catch {}

  try {
    let redirectTo: string | undefined = undefined;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("astra_oauth_pending", provider);
      } catch {}
      redirectTo = `${window.location.origin}${window.location.pathname}`;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
    if (error) {
      return { redirected: false, error: error.message };
    }
    return { redirected: true };
  } catch (err: unknown) {
    return { redirected: false, error: err instanceof Error ? err.message : `Failed to start ${provider} OAuth.` };
  }
}

/**
 * Updates the Traveler Handle and/or Avatar URL across local overrides, Local Realm session, and Supabase Auth metadata.
 */
export async function updateCloudUserProfile(params: {
  displayName?: string;
  avatarUrl?: string;
  titleBadge?: string;
  preferredNarrationStyle?: string;
}): Promise<{ user: CloudAccountUser | null; override: TravelerProfileOverride }> {
  const cleanPatch: Partial<TravelerProfileOverride> = {};
  if (params.displayName !== undefined) cleanPatch.displayName = params.displayName.trim();
  if (params.avatarUrl !== undefined) cleanPatch.avatarUrl = params.avatarUrl;
  if (params.titleBadge !== undefined) cleanPatch.titleBadge = params.titleBadge;
  if (params.preferredNarrationStyle !== undefined) {
    cleanPatch.preferredNarrationStyle = params.preferredNarrationStyle;
  }

  const override = saveTravelerProfileOverride(cleanPatch);

  // Update local account session if present
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_ACCOUNT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CloudAccountUser;
        if (parsed && parsed.id) {
          const updatedLocal: CloudAccountUser = {
            ...parsed,
            displayName: override.displayName || parsed.displayName,
            avatarUrl: override.avatarUrl || parsed.avatarUrl,
          };
          localStorage.setItem(LOCAL_ACCOUNT_STORAGE_KEY, JSON.stringify(updatedLocal));
        }
      }
    } catch {}
  }

  // Update Supabase user_metadata if connected
  const supabase = getSupabaseClient();
  if (supabase && (params.displayName !== undefined || params.avatarUrl !== undefined)) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        await supabase.auth.updateUser({
          data: {
            ...(params.displayName !== undefined ? { full_name: params.displayName.trim() } : {}),
            ...(params.avatarUrl !== undefined ? { avatar_url: params.avatarUrl } : {}),
          },
        });
      }
    } catch {}
  }

  const activeUser = await getActiveCloudUser();
  notifyCloudAuthChanged();
  return { user: activeUser, override };
}

/**
 * Signs out from both Supabase Auth and Local Realm Server session
 */
export async function signOutCloudAccount(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.removeItem(LOCAL_ACCOUNT_STORAGE_KEY);
  }
  notifyCloudAuthChanged();
}

/**
 * Subscribes to both Supabase Auth state changes (including OAuth URL token exchange)
 * and custom local account changes so UI components immediately update when Google Auth completes.
 */
export function subscribeToCloudAuthChanges(
  onAuthChange: (user: CloudAccountUser | null) => void
): () => void {
  const refresh = () => {
    getActiveCloudUser()
      .then((u) => onAuthChange(u))
      .catch(() => {});
  };

  const supabase = getSupabaseClient();
  const { data: sub } = supabase
    ? supabase.auth.onAuthStateChange(() => {
        refresh();
      })
    : { data: { subscription: null } };

  if (typeof window !== "undefined") {
    window.addEventListener("astra-auth-changed", refresh);
  }

  return () => {
    if (sub?.subscription) {
      sub.subscription.unsubscribe();
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("astra-auth-changed", refresh);
    }
  };
}

