"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  User,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Shield,
  FolderOpen,
  Layers,
  BookOpen,
  Settings,
  X,
  Mail,
  Lock,
  FileJson,
  Zap,
  Globe,
  HardDrive,
} from "lucide-react";
import {
  CloudAccountUser,
  getActiveCloudUser,
  authenticateWithEmail,
  signInWithOAuthProvider,
  signOutCloudAccount,
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  OAuthProviderType,
  extractOAuthCallbackError,
  subscribeToCloudAuthChanges,
} from "@/lib/supabaseClient";
import {
  AstraProgressionBundle,
  collectProgressionBundle,
  applyProgressionBundle,
  downloadAstraBundleFile,
  parseAstraBundleFile,
  syncProgressionToCloud,
  fetchCloudProgression,
  isCloudAutoSyncEnabled,
  setCloudAutoSyncEnabled,
  getLastCloudSyncTimestamp,
} from "@/lib/crossSaveEngine";
import { soundEffects } from "@/lib/audioEngine";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgressionRestored?: () => void;
  initialTab?: "cloud" | "portable";
  defaultAuthMode?: "signin" | "signup";
  isFirstVisitPrompt?: boolean;
}

export function CloudSyncModal({
  isOpen,
  onClose,
  onProgressionRestored,
  initialTab = "cloud",
  defaultAuthMode,
  isFirstVisitPrompt = false,
}: CloudSyncModalProps) {
  const [activeTab, setActiveTab] = useState<"cloud" | "portable">(initialTab);
  const [user, setUser] = useState<CloudAccountUser | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">(
    defaultAuthMode ?? (isFirstVisitPrompt ? "signup" : "signin")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Progression snapshots
  const [localBundle, setLocalBundle] = useState<AstraProgressionBundle | null>(null);
  const [cloudBundle, setCloudBundle] = useState<AstraProgressionBundle | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [syncBusy, setSyncBusy] = useState<boolean>(false);

  // Portable .astra import preview state
  const [pendingImportBundle, setPendingImportBundle] = useState<AstraProgressionBundle | null>(null);
  const [pendingImportFilename, setPendingImportFilename] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional custom Supabase connection drawer
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [customSupaUrl, setCustomSupaUrl] = useState("");
  const [customSupaKey, setCustomSupaKey] = useState("");
  const [supaConfigured, setSupaConfigured] = useState(false);

  // Automatic OAuth return welcome & confirmation screen state
  const [oauthWelcomeOpen, setOauthWelcomeOpen] = useState(false);
  const [showConnectedConfirmation, setShowConnectedConfirmation] = useState(false);
  const [initialSyncComplete, setInitialSyncComplete] = useState(false);

  const performInitialAccountSync = async (activeUser: CloudAccountUser) => {
    setSyncBusy(true);
    setInitialSyncComplete(false);
    try {
      // 1. Check remote Cloud Vault first
      const remote = await fetchCloudProgression(activeUser);
      if (remote.bundle) {
        // Smart-merge any cloud saves, character roster, custom worlds, and codex relics into local device
        await applyProgressionBundle(remote.bundle, "merge");
      }

      // 2. Push unified progression bundle back to Cloud Vault so both device & cloud are 100% in sync
      const pushRes = await syncProgressionToCloud(activeUser);
      const syncedTimestamp = pushRes.updatedAt || remote.updatedAt || new Date().toISOString();

      // 3. Refresh local + cloud snapshots for the confirmation screen
      const unifiedLocal = await collectProgressionBundle({ optimizeForCloud: false });
      setLocalBundle(unifiedLocal);
      setCloudBundle(unifiedLocal);
      setCloudUpdatedAt(syncedTimestamp);
      setLastSyncedAt(syncedTimestamp);
      setInitialSyncComplete(true);
      soundEffects.playQuestComplete();

      if (onProgressionRestored) {
        onProgressionRestored();
      }
    } catch (err) {
      console.warn("Initial OAuth account sync warning:", err);
      const fallbackLocal = await collectProgressionBundle({ optimizeForCloud: false });
      setLocalBundle(fallbackLocal);
      setInitialSyncComplete(true);
    } finally {
      setSyncBusy(false);
    }
  };

  const refreshSnapshots = async () => {
    setSyncBusy(true);
    try {
      const [local, currentUser] = await Promise.all([
        collectProgressionBundle({ optimizeForCloud: false }),
        getActiveCloudUser(),
      ]);
      setLocalBundle(local);
      setUser(currentUser);

      if (currentUser) {
        const remote = await fetchCloudProgression(currentUser);
        setCloudBundle(remote.bundle);
        setCloudUpdatedAt(remote.updatedAt);
      } else {
        setCloudBundle(null);
        setCloudUpdatedAt(null);
      }
    } catch (err) {
      console.warn("Failed to refresh cross-save snapshots:", err);
    } finally {
      setSyncBusy(false);
    }
  };

  // Detect OAuth redirect return or error on mount even when parent's `isOpen` is false
  useEffect(() => {
    if (typeof window === "undefined") return;

    const oauthErr = extractOAuthCallbackError();
    if (oauthErr) {
      try {
        window.sessionStorage?.removeItem("astra_oauth_pending");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("error");
        cleanUrl.searchParams.delete("error_description");
        cleanUrl.searchParams.delete("oauth_connected");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
      } catch { }
      setOauthWelcomeOpen(true);
      setStatusBanner({
        type: "error",
        text: `Google / OAuth Sign-In Error: ${oauthErr}`,
      });
      return;
    }

    const url = new URL(window.location.href);
    const hasOAuthParam = url.searchParams.has("oauth_connected");
    const hasPendingSession = Boolean(window.sessionStorage?.getItem("astra_oauth_pending"));
    const hasAuthHash =
      window.location.hash.includes("access_token=") ||
      window.location.hash.includes("refresh_token=");

    const unsubAuth = subscribeToCloudAuthChanges((u) => {
      setUser(u);
    });

    if (!hasOAuthParam && !hasPendingSession && !hasAuthHash) {
      return () => {
        unsubAuth();
      };
    }

    let cancelled = false;

    const verifyAndSyncOAuthReturn = async () => {
      const creds = getSupabaseCredentials();
      setSupaConfigured(creds.isConfigured);
      setCustomSupaUrl(creds.url);
      setCustomSupaKey(creds.anonKey);
      setAutoSync(isCloudAutoSyncEnabled());

      // Wait briefly if needed for Supabase URL session exchange to complete
      let activeUser = await getActiveCloudUser();
      if (!activeUser) {
        await new Promise((r) => setTimeout(r, 450));
        activeUser = await getActiveCloudUser();
      }

      if (cancelled || !activeUser) return;

      // Clean up OAuth query param and sessionStorage flag now that session is established
      try {
        window.sessionStorage?.removeItem("astra_oauth_pending");
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("oauth_connected");
        window.history.replaceState({}, "", cleanUrl.pathname + cleanUrl.search);
      } catch { }

      setUser(activeUser);
      setActiveTab("cloud");
      setOauthWelcomeOpen(true);
      setShowConnectedConfirmation(true);

      await performInitialAccountSync(activeUser);
    };

    verifyAndSyncOAuthReturn();

    return () => {
      cancelled = true;
      unsubAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen && !oauthWelcomeOpen) return;
    const initTimer = setTimeout(() => {
      if (defaultAuthMode) {
        setAuthMode(defaultAuthMode);
      } else if (isFirstVisitPrompt) {
        setAuthMode("signup");
      }
      setPendingImportBundle(null);
      setAutoSync(isCloudAutoSyncEnabled());
      setLastSyncedAt(getLastCloudSyncTimestamp());

      const creds = getSupabaseCredentials();
      setSupaConfigured(creds.isConfigured);
      setCustomSupaUrl(creds.url);
      setCustomSupaKey(creds.anonKey);

      if (!showConnectedConfirmation) {
        refreshSnapshots();
      }
    }, 0);
    return () => clearTimeout(initTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, oauthWelcomeOpen, isFirstVisitPrompt, defaultAuthMode]);

  if (!isOpen && !oauthWelcomeOpen) return null;

  const handleCloseModal = () => {
    soundEffects.playClick();
    setOauthWelcomeOpen(false);
    setShowConnectedConfirmation(false);
    onClose();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setAuthLoading(true);
    setStatusBanner(null);

    try {
      const res = await authenticateWithEmail({
        email,
        password,
        mode: authMode,
        displayName,
      });

      if (res.error) {
        setStatusBanner({ type: "error", text: res.error });
      } else if (res.user) {
        setUser(res.user);
        setPassword("");
        if (res.message) {
          setStatusBanner({ type: "info", text: res.message });
        }
        setShowConnectedConfirmation(true);
        await performInitialAccountSync(res.user);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: OAuthProviderType) => {
    soundEffects.playClick();
    setStatusBanner(null);
    const res = await signInWithOAuthProvider(provider);
    if (res.error) {
      setStatusBanner({ type: "error", text: res.error });
      setShowSupabaseConfig(true);
    }
  };

  const handleSignOut = async () => {
    soundEffects.playClick();
    await signOutCloudAccount();
    setUser(null);
    setCloudBundle(null);
    setCloudUpdatedAt(null);
    setStatusBanner({ type: "info", text: "Signed out of Cloud Sync account." });
  };

  const handlePushToCloud = async () => {
    if (!user) return;
    soundEffects.playClick();
    setSyncBusy(true);
    setStatusBanner(null);

    try {
      const res = await syncProgressionToCloud(user);
      if (!res.success) {
        setStatusBanner({ type: "error", text: res.error || "Failed to push progression to cloud." });
      } else {
        const now = res.updatedAt || new Date().toISOString();
        setLastSyncedAt(now);
        setCloudUpdatedAt(now);
        const freshLocal = await collectProgressionBundle({ optimizeForCloud: true });
        setCloudBundle(freshLocal);
        setLocalBundle(freshLocal);
        setStatusBanner({
          type: "success",
          text: `Cloud Vault updated! Synced ${freshLocal.summary.populatedSlots} save slot(s), ${freshLocal.summary.customWorldCount} custom world(s), and ${freshLocal.summary.codexLootCount} Codex relic(s).`,
        });
      }
    } finally {
      setSyncBusy(false);
    }
  };

  const handlePullFromCloud = async (mode: "merge" | "overwrite") => {
    if (!cloudBundle) return;
    soundEffects.playClick();
    setSyncBusy(true);
    setStatusBanner(null);

    try {
      const result = await applyProgressionBundle(cloudBundle, mode);
      const refreshedLocal = await collectProgressionBundle({ optimizeForCloud: false });
      setLocalBundle(refreshedLocal);
      setStatusBanner({
        type: "success",
        text: `Restored from Cloud (${mode === "merge" ? "Smart Merge" : "Full Replace"}): ${result.restoredSlots} save slot(s), ${result.restoredStories} custom world(s), and ${result.restoredLoot} Codex relic(s)!`,
      });
      if (onProgressionRestored) {
        onProgressionRestored();
      }
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to apply cloud progression.",
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const handleDownloadAstraFile = async () => {
    soundEffects.playClick();
    setSyncBusy(true);
    setStatusBanner(null);
    try {
      const bundle = await downloadAstraBundleFile();
      setLocalBundle(bundle);
      setStatusBanner({
        type: "success",
        text: `Downloaded .astra master backup (${bundle.summary.populatedSlots} save slots, ${bundle.summary.customWorldCount} custom worlds, ${bundle.summary.codexLootCount} relics).`,
      });
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to export .astra file.",
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSelectAstraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEffects.playClick();
    setStatusBanner(null);

    try {
      const parsed = await parseAstraBundleFile(file);
      setPendingImportBundle(parsed);
      setPendingImportFilename(file.name);
      setStatusBanner({
        type: "info",
        text: `Loaded "${file.name}". Review the snapshot preview below and choose Smart Merge or Full Replace.`,
      });
    } catch (err: unknown) {
      setPendingImportBundle(null);
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Invalid .astra file.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImportFile = async (mode: "merge" | "overwrite") => {
    if (!pendingImportBundle) return;
    soundEffects.playClick();
    setSyncBusy(true);
    setStatusBanner(null);

    try {
      const result = await applyProgressionBundle(pendingImportBundle, mode);
      const refreshedLocal = await collectProgressionBundle({ optimizeForCloud: false });
      setLocalBundle(refreshedLocal);
      setPendingImportBundle(null);

      // If signed in and auto-sync is enabled, also push the newly imported progression to cloud
      if (user && autoSync) {
        await syncProgressionToCloud(user);
        const remote = await fetchCloudProgression(user);
        setCloudBundle(remote.bundle);
        setCloudUpdatedAt(remote.updatedAt);
      }

      setStatusBanner({
        type: "success",
        text: `Successfully imported "${pendingImportFilename}" (${result.restoredSlots} save slot(s), ${result.restoredStories} custom world(s), ${result.restoredLoot} Codex relic(s))!`,
      });

      if (onProgressionRestored) {
        onProgressionRestored();
      }
    } catch (err: unknown) {
      setStatusBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to restore .astra backup file.",
      });
    } finally {
      setSyncBusy(false);
    }
  };

  const handleSaveSupabaseConfig = () => {
    soundEffects.playClick();
    saveCustomSupabaseCredentials(customSupaUrl, customSupaKey);
    const creds = getSupabaseCredentials();
    setSupaConfigured(creds.isConfigured);
    setShowSupabaseConfig(false);
    setStatusBanner({
      type: "success",
      text: creds.isConfigured
        ? "Supabase Cloud credentials saved! OAuth & Postgres Cloud Sync active."
        : "Cleared custom Supabase credentials. Using built-in Local Realm Server.",
    });
    refreshSnapshots();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                Astral Nexus Cross-Save Hub
              </h2>
              <p className="text-[11px] text-zinc-400">
                Sync Save Slots 0–3, Timeline Echoes, Custom Worlds & Codex Relics across devices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account"
              onClick={handleCloseModal}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all"
              title="Open Full Astral Traveler Account & Roster Hub"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Account Hub</span>
            </Link>
            <button
              type="button"
              onClick={handleCloseModal}
              className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("cloud");
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${activeTab === "cloud"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            <Cloud className="w-4 h-4" />
            Cloud Account & Auto-Sync
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab("portable");
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${activeTab === "portable"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            <FileJson className="w-4 h-4" />
            Portable .astra Backup File
          </button>
        </div>

        {/* Status Feedback Banner */}
        {statusBanner && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${statusBanner.type === "success"
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
                : statusBanner.type === "error"
                  ? "bg-rose-950/50 border-rose-500/40 text-rose-200"
                  : "bg-sky-950/50 border-sky-500/40 text-sky-200"
              }`}
          >
            {statusBanner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusBanner.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            )}
            <span className="flex-1 leading-relaxed">{statusBanner.text}</span>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === "cloud" ? (
            <>
              {!user ? (
                /* AUTHENTICATION VIEW (OAUTH + EMAIL) */
                <div className="space-y-4">
                  {/* First-Visit Account Registration Callout */}
                  {isFirstVisitPrompt && (
                    <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-900/90 to-sky-950/50 border border-emerald-500/40 rounded-2xl p-4 space-y-2 shadow-[0_0_25px_rgba(16,185,129,0.12)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" /> Welcome to Astra Chronicles
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Recommended for New Travelers
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white font-mono">
                        Register Your Astral Traveler Account
                      </h3>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Sign in with <strong className="text-white">1-Click Google OAuth</strong> or register an Astra Chronicles account below to automatically back up your{" "}
                        <span className="text-emerald-300 font-semibold">Save Slots (0–3)</span>,{" "}
                        <span className="text-amber-300 font-semibold">Cross-World Character Roster</span>, and{" "}
                        <span className="text-sky-300 font-semibold">Custom Worlds</span> across devices.
                      </p>
                    </div>
                  )}

                  {/* OAuth Providers */}
                  <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-sky-400" /> 1-Click OAuth Federation
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${supaConfigured
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border-white/10"
                          }`}
                      >
                        {supaConfigured ? "Supabase Cloud Active" : "Local Realm Server + Supabase Ready"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleOAuthLogin("google")}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-emerald-400/35 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                          />
                        </svg>
                        Continue with Google
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOAuthLogin("discord")}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 text-xs font-semibold text-indigo-200 transition-all cursor-pointer active:scale-95"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                        </svg>
                        Discord
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOAuthLogin("github")}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/15 text-xs font-semibold text-zinc-100 transition-all cursor-pointer active:scale-95"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3" />
                        </svg>
                        GitHub
                      </button>
                    </div>
                  </div>

                  {/* Email & Password Form */}
                  <form
                    onSubmit={handleEmailAuth}
                    className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" /> Email Cross-Save Account
                      </span>
                      <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                        <button
                          type="button"
                          onClick={() => setAuthMode("signin")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-all ${authMode === "signin"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "text-zinc-400 hover:text-white"
                            }`}
                        >
                          SIGN IN
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMode("signup")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-all ${authMode === "signup"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "text-zinc-400 hover:text-white"
                            }`}
                        >
                          REGISTER
                        </button>
                      </div>
                    </div>

                    {authMode === "signup" && (
                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                          Traveler Handle (Optional)
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g., Sovereign Kael"
                            className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="traveler@astrachronicles.gg"
                            className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-400/40 text-xs font-mono font-bold text-emerald-200 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      {authMode === "signup"
                        ? "Create Cross-Save Account & Link Device"
                        : "Sign In & Connect Cloud Vault"}
                    </button>
                  </form>

                  {isFirstVisitPrompt && (
                    <div className="flex items-center justify-center pt-1">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white text-xs font-mono transition-all cursor-pointer"
                      >
                        Skip for Now — Continue as Local Guest (Saves Stored on This Browser Only)
                      </button>
                    </div>
                  )}
                </div>
              ) : showConnectedConfirmation ? (
                /* OAUTH & ACCOUNT CONNECTED + SAVES SYNCED CONFIRMATION SCREEN */
                <div className="bg-gradient-to-b from-emerald-950/40 via-zinc-900/90 to-sky-950/30 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                  {/* Glowing Emblem */}
                  <div className="relative mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.35)]">
                    {syncBusy && !initialSyncComplete ? (
                      <RefreshCw className="w-8 h-8 text-sky-300 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                    )}
                    <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-sky-500 text-zinc-950 font-mono font-black text-[9px] uppercase tracking-wider shadow">
                      {user.provider}
                    </span>
                  </div>

                  {/* Title & Identity */}
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" />
                      {syncBusy && !initialSyncComplete
                        ? "Synchronizing Astral Cloud Vault..."
                        : user.provider === "google" || user.linkedProviders?.includes("google")
                          ? "✓ Authenticated Through Google OAuth • Saves Synced"
                          : "All Saves & Character Roster Synced"}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white font-mono">
                      {user.provider === "google" || user.linkedProviders?.includes("google")
                        ? "Google Account Connected to Astra Chronicles"
                        : "Signed In to Astra Chronicles"}
                    </h3>
                    <p className="text-xs text-zinc-300">
                      Welcome, <span className="text-sky-300 font-semibold">{user.displayName}</span>{" "}
                      <span className="text-zinc-500 font-mono">({user.email})</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Your account is linked and Auto-Sync is active. Your Save Slots (0–3), Saved Character Roster, Custom Worlds, and Codex Relics are backed up across devices.
                    </p>
                  </div>

                  {/* Synced Progression Summary Grid */}
                  {localBundle && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                      <div className="bg-black/45 border border-white/10 rounded-2xl p-3">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                          Save Slots
                        </span>
                        <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
                          {localBundle.summary.populatedSlots} / 4 Synced
                        </span>
                      </div>
                      <div className="bg-black/45 border border-white/10 rounded-2xl p-3">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                          Character Roster
                        </span>
                        <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">
                          {localBundle.characterRoster?.length ?? 0} Saved
                        </span>
                      </div>
                      <div className="bg-black/45 border border-white/10 rounded-2xl p-3">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                          Custom Worlds
                        </span>
                        <span className="text-sm font-bold text-sky-300 font-mono mt-0.5 block">
                          {localBundle.summary.customWorldCount} Worlds
                        </span>
                      </div>
                      <div className="bg-black/45 border border-white/10 rounded-2xl p-3">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                          Codex Vault
                        </span>
                        <span className="text-sm font-bold text-purple-300 font-mono mt-0.5 block">
                          {localBundle.summary.codexLootCount} Relics
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Primary & Secondary CTAs */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-98 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Continue to Astra Chronicles
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setShowConnectedConfirmation(false);
                      }}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-200 font-mono font-semibold text-xs transition-all cursor-pointer"
                    >
                      Manage Cloud Vault & Slots
                    </button>
                  </div>
                </div>
              ) : (
                /* AUTHENTICATED CLOUD SYNC DASHBOARD */
                <div className="space-y-4">
                  {/* Connected User Card */}
                  <div className="bg-gradient-to-r from-sky-950/40 via-zinc-900/80 to-emerald-950/30 border border-sky-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 font-mono font-bold text-sm">
                        {user.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{user.displayName}</span>
                          {user.provider === "google" || user.linkedProviders?.includes("google") ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Google OAuth Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              {user.mode === "supabase" ? `Supabase • ${user.provider}` : "Realm Cloud Vault"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
                        {lastSyncedAt && (
                          <p className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                            Last Cloud Sync: {new Date(lastSyncedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          const next = !autoSync;
                          setAutoSync(next);
                          setCloudAutoSyncEnabled(next);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${autoSync
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-white/5 text-zinc-400 border-white/10"
                          }`}
                        title="Automatically push saves to Cloud Vault after every turn"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Auto-Sync: {autoSync ? "ON" : "OFF"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison: This Device vs Cloud Vault */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Local Device Card */}
                    <div className="bg-zinc-900/75 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-amber-400" /> THIS DEVICE
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {localBundle?.deviceLabel || "Local Browser"}
                        </span>
                      </div>

                      {localBundle ? (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[10px] text-zinc-500 font-mono block">Save Slots</span>
                              <span className="text-sm font-bold text-white font-mono">
                                {localBundle.summary.populatedSlots} / 4 Active
                              </span>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[10px] text-zinc-500 font-mono block">Highest Lv.</span>
                              <span className="text-sm font-bold text-amber-300 font-mono">
                                {localBundle.summary.highestLevel > 0
                                  ? `Lv.${localBundle.summary.highestLevel} ${localBundle.summary.activeCharacterName || ""}`
                                  : "No Character"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                            <span>Custom Worlds: {localBundle.summary.customWorldCount}</span>
                            <span>Codex Relics: {localBundle.summary.codexLootCount}</span>
                            <span>Echoes: {localBundle.summary.totalEchoes}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">Scanning local storage...</p>
                      )}
                    </div>

                    {/* Cloud Vault Card */}
                    <div className="bg-zinc-900/75 border border-sky-500/25 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-sky-400" /> CLOUD VAULT
                        </span>
                        <button
                          type="button"
                          onClick={refreshSnapshots}
                          disabled={syncBusy}
                          className="text-[10px] font-mono text-sky-400 hover:text-sky-200 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncBusy ? "animate-spin" : ""}`} />
                          Refresh
                        </button>
                      </div>

                      {cloudBundle ? (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[10px] text-zinc-500 font-mono block">Cloud Slots</span>
                              <span className="text-sm font-bold text-white font-mono">
                                {cloudBundle.summary.populatedSlots} / 4 Active
                              </span>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded-xl p-2">
                              <span className="text-[10px] text-zinc-500 font-mono block">Highest Lv.</span>
                              <span className="text-sm font-bold text-sky-300 font-mono">
                                {cloudBundle.summary.highestLevel > 0
                                  ? `Lv.${cloudBundle.summary.highestLevel} ${cloudBundle.summary.activeCharacterName || ""}`
                                  : "No Character"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                            <span>Custom Worlds: {cloudBundle.summary.customWorldCount}</span>
                            <span>Codex Relics: {cloudBundle.summary.codexLootCount}</span>
                            <span>Echoes: {cloudBundle.summary.totalEchoes}</span>
                          </div>

                          {cloudUpdatedAt && (
                            <p className="text-[10px] text-sky-400/80 font-mono">
                              Uploaded: {new Date(cloudUpdatedAt).toLocaleString()} ({cloudBundle.deviceLabel || "Remote"})
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-xs text-zinc-400">No Cloud Vault snapshot uploaded yet.</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Click &ldquo;Push Local to Cloud&rdquo; below to initialize your cross-save vault.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cloud Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={syncBusy}
                      onClick={handlePushToCloud}
                      className="py-3 px-4 rounded-2xl bg-sky-600/25 hover:bg-sky-600/40 border border-sky-400/40 text-xs font-mono font-bold text-sky-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-lg"
                    >
                      <CloudUpload className="w-4 h-4 text-sky-300" />
                      Push Local Progression to Cloud
                    </button>

                    <button
                      type="button"
                      disabled={syncBusy || !cloudBundle}
                      onClick={() => handlePullFromCloud("merge")}
                      className="py-3 px-4 rounded-2xl bg-emerald-600/25 hover:bg-emerald-600/40 disabled:opacity-40 border border-emerald-400/40 text-xs font-mono font-bold text-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-lg"
                    >
                      <CloudDownload className="w-4 h-4 text-emerald-300" />
                      Pull & Smart-Merge from Cloud
                    </button>
                  </div>

                  {cloudBundle && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={syncBusy}
                        onClick={() => handlePullFromCloud("overwrite")}
                        className="text-[11px] font-mono text-zinc-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
                      >
                        Or Replace All Local Slots with Exact Cloud Vault Snapshot
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Supabase Connection Settings Accordion */}
              <div className="border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupabaseConfig(!showSupabaseConfig)}
                  className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-500" />
                  {showSupabaseConfig ? "Hide" : "Configure"} Custom Supabase Cloud Project Keys (Optional)
                </button>

                {showSupabaseConfig && (
                  <div className="mt-2.5 bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      By default, Astra Chronicles uses your environment keys or the built-in Local Realm Server API. You can also connect your own Supabase project URL and Anon Key here for Google/Discord/GitHub OAuth and global Postgres sync:
                    </p>
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={customSupaUrl}
                        onChange={(e) => setCustomSupaUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                      <input
                        type="password"
                        value={customSupaKey}
                        onChange={(e) => setCustomSupaKey(e.target.value)}
                        placeholder="Supabase Public Anon Key (eyJ...)"
                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveSupabaseConfig}
                        className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/35 border border-sky-400/40 text-xs font-mono font-bold text-sky-200 cursor-pointer"
                      >
                        Save Cloud Endpoint
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* PORTABLE .ASTRA FILE EXPORT / IMPORT TAB */
            <div className="space-y-4">
              {/* Export Card */}
              <div className="bg-zinc-900/70 border border-amber-500/25 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-400" /> Export Master .astra Progression File
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Packages all 4 Save Slots (Auto-Save + Slots 1–3), Timeline Echoes & Death Regressions, Custom Created Worlds, and Multiverse Codex Relics into a single portable <code className="text-amber-300">.astra</code> file.
                    </p>
                  </div>
                </div>

                {localBundle && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-center">
                      <FolderOpen className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-xs font-mono font-bold text-white block">
                        {localBundle.summary.populatedSlots} Slots
                      </span>
                      <span className="text-[10px] text-zinc-500">Save Campaigns</span>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-center">
                      <Layers className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-xs font-mono font-bold text-white block">
                        {localBundle.summary.customWorldCount} Worlds
                      </span>
                      <span className="text-[10px] text-zinc-500">Custom Stories</span>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-center">
                      <BookOpen className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                      <span className="text-xs font-mono font-bold text-white block">
                        {localBundle.summary.codexLootCount} Relics
                      </span>
                      <span className="text-[10px] text-zinc-500">Codex Vault</span>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 text-center">
                      <Sparkles className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                      <span className="text-xs font-mono font-bold text-white block">
                        {localBundle.summary.totalEchoes} Echoes
                      </span>
                      <span className="text-[10px] text-zinc-500">Loop Memories</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={syncBusy}
                  onClick={handleDownloadAstraFile}
                  className="w-full py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-xs font-mono font-bold text-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Download .astra Master Progression Backup
                </button>
              </div>

              {/* Import Card */}
              <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Upload className="w-4 h-4 text-sky-400" /> Restore or Merge from .astra Backup File
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Select a <code className="text-sky-300">.astra</code> or <code className="text-sky-300">.json</code> save file from another browser, PC, or mobile device to merge or replace your progression.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".astra,.json,application/json"
                  onChange={handleSelectAstraFile}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-white/20 hover:border-sky-400/50 rounded-2xl bg-black/30 hover:bg-sky-950/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-zinc-300"
                >
                  <Upload className="w-5 h-5 text-sky-400" />
                  <span className="text-xs font-mono font-bold">
                    Click to Select .astra Save File
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Supports full progression bundles & individual save slot exports
                  </span>
                </button>

                {/* Pending File Preview */}
                {pendingImportBundle && (
                  <div className="bg-sky-950/30 border border-sky-500/40 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-300">
                        Preview: {pendingImportFilename}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Exported: {new Date(pendingImportBundle.exportedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {pendingImportBundle.summary.slotPreviews.map((sp) => (
                        <div
                          key={sp.slotId}
                          className="text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between"
                        >
                          <span className="font-mono font-bold text-white">
                            {sp.slotId === 0 ? "AUTO-SAVE" : `SLOT 0${sp.slotId}`}: {sp.playerName}{" "}
                            <span className="text-sky-300">(Lv.{sp.level} {sp.role})</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {sp.storyTitle} • {sp.location}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        disabled={syncBusy}
                        onClick={() => handleConfirmImportFile("merge")}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-400/50 text-xs font-mono font-bold text-emerald-200 cursor-pointer transition-all"
                      >
                        Smart Merge into Device (Recommended)
                      </button>
                      <button
                        type="button"
                        disabled={syncBusy}
                        onClick={() => handleConfirmImportFile("overwrite")}
                        className="py-2.5 px-3 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-400/40 text-xs font-mono font-bold text-rose-200 cursor-pointer transition-all"
                      >
                        Overwrite All Local Slots
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

