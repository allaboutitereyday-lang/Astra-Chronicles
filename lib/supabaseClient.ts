import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type OAuthProviderType = "google" | "discord" | "github";

export interface CloudAccountUser {
  id: string;
  email: string;
  displayName: string;
  provider: "email" | "google" | "discord" | "github" | "local_realm";
  avatarUrl?: string;
  mode: "supabase" | "local_server";
}

const LOCAL_ACCOUNT_STORAGE_KEY = "astra_cloud_account_session";
const CUSTOM_SUPABASE_CFG_KEY = "astra_custom_supabase_config";
const TRAVELER_PROFILE_OVERRIDE_KEY = "astra_traveler_profile_override";

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
    },
  });
  cachedConfigKey = nextKey;
  return cachedSupabaseClient;
}

/**
 * Retrieves the currently signed-in cross-save user (from Supabase Auth or Local Realm Server session)
 */
export async function getActiveCloudUser(): Promise<CloudAccountUser | null> {
  const override = getTravelerProfileOverride();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        const u = data.user;
        const appProvider = (u.app_metadata?.provider || "email") as CloudAccountUser["provider"];
        const metaName =
          override.displayName ||
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.user_metadata?.user_name ||
          u.email?.split("@")[0] ||
          "Astral Traveler";
        return {
          id: u.id,
          email: u.email || `${u.id.slice(0, 8)}@astral.nexus`,
          displayName: metaName,
          provider: appProvider,
          avatarUrl: override.avatarUrl || u.user_metadata?.avatar_url,
          mode: "supabase",
        };
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
      const currentUrl = new URL(window.location.href.split("#")[0]);
      currentUrl.searchParams.set("oauth_connected", provider);
      redirectTo = currentUrl.toString();
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
}

