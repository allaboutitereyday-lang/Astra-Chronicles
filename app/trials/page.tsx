"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Terminal, 
  Shield, 
  Sword, 
  Zap, 
  Flame, 
  AlertTriangle, 
  RotateCcw, 
  ArrowLeft, 
  CheckCircle2, 
  Crosshair, 
  Award, 
  Sparkles, 
  Heart, 
  ChevronRight,
  RefreshCw,
  Trophy,
  Package,
  Layers,
  Activity,
  Bot
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { loadGameSlot, saveGameSlot, SaveSlotPayload } from "@/lib/saveStorage";
import { saveCodexLoot } from "@/lib/codexStorage";
import { InventoryItem, PlayerProfile, AbilityDetail } from "@/types/story";
import { evaluateRelicSynergies } from "@/lib/relicSynergies";

interface SectorDefinition {
  sectorNumber: number;
  title: string;
  codename: string;
  difficulty: "D-Rank" | "C-Rank" | "B-Rank" | "A-Rank" | "S-Rank";
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyDesc: string;
  causalModifier: {
    name: string;
    description: string;
    statEffect: string;
  };
}

const DAILY_MODIFIERS = [
  {
    name: "Entropy Cascade",
    description: "Causal boundaries fluctuate wildly. Kinetic impacts pierce dimensional barriers.",
    statEffect: "+30% Critical Damage, +15% Enemy Lethality",
  },
  {
    name: "Temporal Dilation",
    description: "Planar conduits warp the flow of time within this sector.",
    statEffect: "-25% Skill MP Costs, Stagger Vulnerability Increased",
  },
  {
    name: "Quantum Bleed",
    description: "Spatial fissures leak concentrated aether across the battlefield.",
    statEffect: "+20% Arcane Resonance, -10% Natural Regeneration",
  },
  {
    name: "Voidstrider Interference",
    description: "The void strata echoes through the chamber, enhancing phase mechanics.",
    statEffect: "Relic Synergies deal +40% Stagger Damage",
  },
  {
    name: "Singularity Horizon",
    description: "The Administrator's final trial chamber. Maximum causal pressure.",
    statEffect: "High Plausibility Drain, S-Rank Loot Protocol Active",
  },
];

// Guaranteed sector completion loot drops
const SECTOR_LOOT_TABLE: InventoryItem[] = [
  {
    id: "trial_loot_s1",
    name: "Causal Fracture Shard",
    type: "material",
    rarity: "uncommon",
    description: "A crystalline spacetime fragment salvaged from Fracture-Alpha. Emits faint temporal resonance.",
    effect: "+5% Arcane Resonance • Usable in artifact infusion",
  },
  {
    id: "trial_loot_s2",
    name: "Obsidian Void Core",
    type: "relic",
    rarity: "rare",
    description: "Extracted from the Obsidian Void Predator. Houses stabilized gravitational void matter.",
    effect: "+15 Max MP • Voidstrider & Singularity Synergy Catalyst",
  },
  {
    id: "trial_loot_s3",
    name: "Chrono-Stasis Elixir",
    type: "consumable",
    rarity: "rare",
    description: "A liquid suspension of halted seconds created by the Time-Lost Archon.",
    effect: "Instantly restores 50 HP and 40 MP in high-stakes combat",
  },
  {
    id: "trial_loot_s4",
    name: "Titan Calamity Plating",
    type: "armor",
    rarity: "relic",
    description: "Heavy plate alloy scavenged from the Calamity Automaton Titan.",
    effect: "+25 Max HP • Reduces incoming burst damage by 15%",
  },
  {
    id: "trial_loot_s5",
    name: "Administrator's Singularity Seal",
    type: "relic",
    rarity: "relic",
    description: "An authentic authority glyph bestowed by the Causal Arbitrator for conquering all 5 trial sectors.",
    effect: "+35 Max HP • +25 Max MP • Singularity Sovereign Synergy Capstone",
  },
];

export interface CombatTelemetry {
  damageDealt?: number;
  mpCost?: number;
  hpHealed?: number;
  plausibilityShift?: number;
  enemyDamage?: number;
  enemyRemainingHp?: number;
  enemyMaxHp?: number;
}

export interface CombatFeedEntry {
  id: string;
  time: string;
  type: "protocol" | "combat" | "victory" | "loot";
  title: string;
  actionName?: string;
  blurb?: string;
  isAiGenerated?: boolean;
  telemetry?: CombatTelemetry;
}

function LitRPGTrialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active Story Context Tracking
  const storyId = searchParams.get("storyId") || (typeof window !== "undefined" ? sessionStorage.getItem("astra_trials_story_id") : null) || "astra-chronicles";
  const returnTo = searchParams.get("returnTo") || (typeof window !== "undefined" ? sessionStorage.getItem("astra_trials_return_url") : null) || `/play/${storyId}`;

  // Loaded Save Slot 0 (Story Auto-Save)
  const [activeSlot0, setActiveSlot0] = useState<SaveSlotPayload | null>(null);
  const [syncedPlayer, setSyncedPlayer] = useState<PlayerProfile | null>(null);

  const [currentSectorIdx, setCurrentSectorIdx] = useState(0);
  const [trialCompleted, setTrialCompleted] = useState(false);
  const [trialFailed, setTrialFailed] = useState(false);
  const [isResolvingTurn, setIsResolvingTurn] = useState(false);
  const [isSyncingBack, setIsSyncingBack] = useState(false);

  // Structured Administrator Feed
  const [combatFeed, setCombatFeed] = useState<CombatFeedEntry[]>([]);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const loggedSectorsRef = useRef<Set<number>>(new Set());

  // Player Stats for Trial Run (hydrated from active character)
  const [playerHp, setPlayerHp] = useState(120);
  const [playerMaxHp, setPlayerMaxHp] = useState(120);
  const [playerMp, setPlayerMp] = useState(80);
  const [playerMaxMp, setPlayerMaxMp] = useState(80);
  const [causalPlausibility, setCausalPlausibility] = useState(85);
  const [trialExpGained, setTrialExpGained] = useState(0);
  const [trialLootEarned, setTrialLootEarned] = useState<InventoryItem[]>([]);

  // Daily Seed calculation
  const todayDateString = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Hydrate protagonist on mount from Slot 0
  useEffect(() => {
    loadGameSlot(0)
      .then((slot) => {
        if (slot && slot.player) {
          setActiveSlot0(slot);
          setSyncedPlayer(slot.player);
          const p = slot.player;
          const maxHp = p.stats?.maxHp || 120;
          const maxMp = p.stats?.maxMp || 80;
          setPlayerMaxHp(maxHp);
          setPlayerHp(p.stats?.hp ? Math.min(p.stats.hp, maxHp) : maxHp);
          setPlayerMaxMp(maxMp);
          setPlayerMp(p.stats?.mp ? Math.min(p.stats.mp, maxMp) : maxMp);
        }
      })
      .catch((err) => {
        console.warn("Could not load slot 0 in trials:", err);
      });
  }, []);

  // Compute active synergies from synced gear & inventory
  const activeSynergies = useMemo(() => {
    if (!syncedPlayer) return [];
    return evaluateRelicSynergies(syncedPlayer.inventory || [], syncedPlayer.gear);
  }, [syncedPlayer]);

  // 5 Consecutive Roguelite Sectors
  const sectors: SectorDefinition[] = useMemo(
    () => [
      {
        sectorNumber: 1,
        title: "Sector 01: Causal Fracture Outpost",
        codename: "FRACTURE-ALPHA",
        difficulty: "D-Rank",
        enemyName: "Planar Glitch Stalker",
        enemyHp: 60,
        enemyMaxHp: 60,
        enemyDesc: "A twitching arachnid construct composed of fractured spacetime shards.",
        causalModifier: DAILY_MODIFIERS[0],
      },
      {
        sectorNumber: 2,
        title: "Sector 02: Void Rift Incursion",
        codename: "RIFT-BETA",
        difficulty: "C-Rank",
        enemyName: "Obsidian Void Predator",
        enemyHp: 95,
        enemyMaxHp: 95,
        enemyDesc: "A predatory quad-ped beast phasing between the physical realm and the void vacuum.",
        causalModifier: DAILY_MODIFIERS[1],
      },
      {
        sectorNumber: 3,
        title: "Sector 03: Chrono-Stasis Crucible",
        codename: "CHRONO-GAMMA",
        difficulty: "B-Rank",
        enemyName: "Time-Lost Archon Sentinel",
        enemyHp: 140,
        enemyMaxHp: 140,
        enemyDesc: "Ancient gilded guardian animated by compressed timeline conduits.",
        causalModifier: DAILY_MODIFIERS[2],
      },
      {
        sectorNumber: 4,
        title: "Sector 04: Abyssal Foundry Chamber",
        codename: "ABYSS-DELTA",
        difficulty: "A-Rank",
        enemyName: "Calamity Automaton Titan",
        enemyHp: 200,
        enemyMaxHp: 200,
        enemyDesc: "Colossal imperial war automaton forged from corrupted celestial iron.",
        causalModifier: DAILY_MODIFIERS[3],
      },
      {
        sectorNumber: 5,
        title: "Sector 05: Apex Administrator Spire",
        codename: "SINGULARITY-OMEGA",
        difficulty: "S-Rank",
        enemyName: "The Causal Arbitrator (Avatar)",
        enemyHp: 280,
        enemyMaxHp: 280,
        enemyDesc: "The manifestation of the Multiverse Administrator evaluating your timeline coherence.",
        causalModifier: DAILY_MODIFIERS[4],
      },
    ],
    []
  );

  const activeSector = sectors[currentSectorIdx] || sectors[0];
  const [currentEnemyHp, setCurrentEnemyHp] = useState(activeSector.enemyHp);

  // Sync enemy HP and log protocol ONLY ONCE per sector transition (prevents duplicates)
  useEffect(() => {
    setCurrentEnemyHp(activeSector.enemyHp);
    if (!loggedSectorsRef.current.has(currentSectorIdx)) {
      loggedSectorsRef.current.add(currentSectorIdx);
      const protocolEntry: CombatFeedEntry = {
        id: `protocol_sec_${currentSectorIdx}_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "protocol",
        title: `Protocol Initialized: ${activeSector.title} [${activeSector.codename}]`,
        blurb: `Modifier Detected: ${activeSector.causalModifier.name} — ${activeSector.causalModifier.description} (Effect: ${activeSector.causalModifier.statEffect})`,
      };
      setCombatFeed((prev) => [protocolEntry, ...prev]);
    }
  }, [currentSectorIdx, activeSector]);

  // Procedural Immediate Fallback Blurb
  const getProceduralBlurb = (
    type: string,
    actionName: string,
    targetName: string,
    dmg: number,
    counterDmg: number
  ) => {
    const pName = syncedPlayer?.name || "You";
    if (type === "strike") {
      return `${pName} steps in with calculated footwork, driving a kinetic strike deep into ${targetName}'s stance for ${dmg} damage!`;
    } else if (type === "relic") {
      return `Planar rifts fracture open as ${pName} phase-steps behind ${targetName}, detonating an overclocked void burst for ${dmg} critical damage!`;
    } else if (type === "companion") {
      return `Allied firing lines coordinate in overlapping crossfire, bombarding ${targetName} for ${dmg} damage while infusing vitality!`;
    } else if (type === "anchor") {
      return `${pName} grounds their causal anchor into the chamber floor, solidifying spatial boundaries and restoring vital equilibrium.`;
    }
    return `${pName} unleashes ${actionName}, striking ${targetName} with decisive precision for ${dmg} damage!`;
  };

  // Turn Action Execution with Protagonist Stat Scaling & Dynamic AI Blurb Generation
  const handleTacticalAction = (
    actionType: "strike" | "relic" | "companion" | "anchor" | "ability",
    customAbility?: AbilityDetail
  ) => {
    if (isResolvingTurn || trialCompleted || trialFailed || isSyncingBack) return;
    setIsResolvingTurn(true);
    soundEffects.playClick();

    setTimeout(() => {
      let playerDamage = 0;
      let mpUsed = 0;
      let hpRegen = 0;
      let plausibilityShift = 0;
      let actionName = "Kinetic Strike";

      const pStr = syncedPlayer?.stats?.str || 10;
      const pInt = syncedPlayer?.stats?.int || 10;
      const pLevel = syncedPlayer?.level || 1;

      if (actionType === "strike") {
        actionName = "Kinetic Strike";
        const base = 26 + Math.floor(pStr * 1.4) + pLevel * 2;
        playerDamage = Math.floor(base + Math.random() * 16);
        plausibilityShift = 2;
      } else if (actionType === "relic") {
        actionName = activeSynergies[0]?.bonusName || "Voidstrider Phase Burst";
        if (playerMp >= 25) {
          mpUsed = 25;
          const hasVoidstrider = activeSynergies.some((s) => s.setName.toLowerCase().includes("voidstrider") && s.isActive);
          const bonus = hasVoidstrider ? 20 : 0;
          const base = 48 + Math.floor(pInt * 1.8) + pLevel * 3 + bonus;
          playerDamage = Math.floor(base + Math.random() * 24);
          plausibilityShift = 4;
        } else {
          playerDamage = 18;
          plausibilityShift = -3;
        }
      } else if (actionType === "companion") {
        actionName = "Duo Synergy Barrage";
        if (playerMp >= 20) {
          mpUsed = 20;
          const base = 34 + pLevel * 3;
          playerDamage = Math.floor(base + Math.random() * 18);
          hpRegen = 25 + Math.floor(pLevel * 2);
          plausibilityShift = 3;
        } else {
          playerDamage = 20;
        }
      } else if (actionType === "anchor") {
        actionName = "Causal Anchor Stabilization";
        hpRegen = 35 + Math.floor(pLevel * 3);
        plausibilityShift = 8;
      } else if (actionType === "ability" && customAbility) {
        actionName = customAbility.name;
        // Parse MP cost (e.g. "15 MP" -> 15)
        const costMatch = (customAbility.cost || "").match(/\d+/);
        const costNum = costMatch ? parseInt(costMatch[0], 10) : 15;
        if (playerMp >= costNum) {
          mpUsed = costNum;
          const base = 42 + Math.floor((pStr + pInt) * 1.1) + pLevel * 3;
          playerDamage = Math.floor(base + Math.random() * 22);
          plausibilityShift = 4;
        } else {
          playerDamage = 16;
          plausibilityShift = -2;
        }
      }

      // Apply to enemy
      const nextEnemyHp = Math.max(0, currentEnemyHp - playerDamage);
      setCurrentEnemyHp(nextEnemyHp);
      setPlayerMp((prev) => Math.max(0, prev - mpUsed));
      setPlayerHp((prev) => Math.min(playerMaxHp, prev + hpRegen));
      setCausalPlausibility((prev) => Math.max(10, Math.min(100, prev + plausibilityShift)));

      // Enemy Counter-attack if alive
      let enemyDamage = 0;
      if (nextEnemyHp > 0) {
        enemyDamage = Math.floor(14 + Math.random() * 14 + currentSectorIdx * 6);
        setPlayerHp((prev) => {
          const nextHp = prev - enemyDamage;
          if (nextHp <= 0) {
            setTrialFailed(true);
            soundEffects.playSystemAlert();
          }
          return Math.max(0, nextHp);
        });
      }

      // Generate turn entry ID & Initial Procedural Blurb
      const turnId = `feed_turn_${Date.now()}`;
      const initialBlurb = getProceduralBlurb(actionType, actionName, activeSector.enemyName, playerDamage, enemyDamage);

      const combatEntry: CombatFeedEntry = {
        id: turnId,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "combat",
        title: actionName,
        actionName,
        blurb: initialBlurb,
        isAiGenerated: false,
        telemetry: {
          damageDealt: playerDamage,
          mpCost: mpUsed,
          hpHealed: hpRegen,
          plausibilityShift,
          enemyDamage,
          enemyRemainingHp: nextEnemyHp,
          enemyMaxHp: activeSector.enemyMaxHp,
        },
      };

      // Add to feed immediately
      setCombatFeed((prev) => [combatEntry, ...prev]);

      // Trigger AI narrative synthesis in background
      fetch("/api/generate-combat-blurb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          actionName,
          protagonistName: syncedPlayer?.name || "Protagonist",
          protagonistRole: syncedPlayer?.role || "Voidstrider",
          enemyName: activeSector.enemyName,
          damageDealt: playerDamage,
          enemyDamage,
          sectorName: activeSector.title,
          causalModifier: activeSector.causalModifier.name,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.blurb && typeof data.blurb === "string") {
            setCombatFeed((prev) =>
              prev.map((entry) =>
                entry.id === turnId
                  ? { ...entry, blurb: data.blurb, isAiGenerated: true }
                  : entry
              )
            );
          }
        })
        .catch((err) => {
          console.warn("AI combat blurb async error:", err);
        });

      // Sector Victory Check
      if (nextEnemyHp === 0) {
        soundEffects.playQuestComplete();
        const sectorExp = 60 + (currentSectorIdx + 1) * 40;
        setTrialExpGained((prev) => prev + sectorExp);

        const lootDrop = SECTOR_LOOT_TABLE[currentSectorIdx];
        if (lootDrop) {
          setTrialLootEarned((prev) => {
            if (prev.some((item) => item.id === lootDrop.id)) return prev;
            return [...prev, lootDrop];
          });
        }

        const isFinal = currentSectorIdx + 1 >= sectors.length;
        const victoryEntry: CombatFeedEntry = {
          id: `feed_vic_${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          type: "victory",
          title: isFinal
            ? `[TRIAL CONCLUDED]: All 5 Administrator Sectors Cleared!`
            : `[SECTOR CLEARED]: ${activeSector.title} Eliminated!`,
          blurb: `Secured +${sectorExp} EXP. ${lootDrop ? `Loot Recovered: [${lootDrop.rarity.toUpperCase()}] ${lootDrop.name}.` : ""} ${isFinal ? "Daily Sovereign Clearance Verified." : `Advancing to Sector 0${currentSectorIdx + 2}...`}`,
        };

        setCombatFeed((prev) => [victoryEntry, ...prev]);

        if (!isFinal) {
          setCurrentSectorIdx((prev) => prev + 1);
        } else {
          setTrialCompleted(true);
        }
      }

      setIsResolvingTurn(false);
    }, 380);
  };

  const handleRestartTrial = () => {
    soundEffects.playClick();
    loggedSectorsRef.current.clear();
    setCurrentSectorIdx(0);
    setCurrentEnemyHp(sectors[0].enemyHp);
    setTrialCompleted(false);
    setTrialFailed(false);
    setPlayerHp(playerMaxHp);
    setPlayerMp(playerMaxMp);
    setCausalPlausibility(85);
    setTrialExpGained(0);
    setTrialLootEarned([]);
    setCombatFeed([
      {
        id: `feed_reset_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "protocol",
        title: "Administrator Matrix Re-Initialized",
        blurb: "Timeline anomaly parameters reset to Sector 01. Combat telemetry active.",
      },
    ]);
  };

  /**
   * Synchronizes EXP, Level Advances, and Trial Loot drops directly into the story's Auto-Save Slot (Slot 0),
   * then routes back to the exact story scene / turn.
   */
  const handleReturnToStory = async () => {
    if (isSyncingBack) return;
    setIsSyncingBack(true);
    soundEffects.playIntroBell();

    try {
      const slot0 = activeSlot0 || (await loadGameSlot(0));

      if (slot0 && slot0.player) {
        const currentPlayer = slot0.player;
        const currentStats = currentPlayer.stats || {
          hp: 100, maxHp: 100, mp: 60, maxMp: 60, exp: 0, maxExp: 100, str: 10, dex: 10, int: 10
        };

        // Calculate Level Up & EXP advancement
        let newExp = (currentStats.exp || 0) + trialExpGained;
        let newLevel = currentPlayer.level || 1;
        let newMaxExp = currentStats.maxExp || (newLevel * 100);
        let newMaxHp = currentStats.maxHp || 100;
        let newMaxMp = currentStats.maxMp || 60;
        let newStr = currentStats.str || 10;
        let newDex = currentStats.dex || 10;
        let newInt = currentStats.int || 10;
        let levelsGained = 0;

        while (newExp >= newMaxExp) {
          newExp -= newMaxExp;
          newLevel += 1;
          levelsGained += 1;
          newMaxExp = newLevel * 100;
          newMaxHp += 20;
          newMaxMp += 10;
          newStr += 2;
          newDex += 2;
          newInt += 2;
        }

        // Merge newly acquired trial loot into inventory
        const existingInventory: InventoryItem[] = Array.isArray(currentPlayer.inventory) ? currentPlayer.inventory : [];
        const mergedInventory: InventoryItem[] = [...existingInventory];

        for (const item of trialLootEarned) {
          if (!mergedInventory.some((inv) => inv.id === item.id || inv.name.toLowerCase() === item.name.toLowerCase())) {
            mergedInventory.push(item);

            // Register in Multiverse Codex for persistent retention
            try {
              await saveCodexLoot({
                storyId: slot0.storyId || storyId,
                storyTitle: slot0.storyTitle || "LitRPG Daily Roguelite Trials",
                itemName: item.name,
                rarity: item.rarity,
                description: item.description,
                itemType: item.type,
                effect: item.effect,
                imageUrl: item.imageUrl || "",
                model: "LitRPG Administrator Protocol",
              });
            } catch (codexErr) {
              console.warn("Failed to persist trial item in codex:", codexErr);
            }
          }
        }

        // Calculate final HP & MP
        const finalHp = Math.max(15, Math.min(newMaxHp, playerHp > 0 ? playerHp : Math.floor(newMaxHp * 0.5)));
        const finalMp = Math.max(10, Math.min(newMaxMp, playerMp > 0 ? playerMp : Math.floor(newMaxMp * 0.5)));

        const updatedPlayer: PlayerProfile = {
          ...currentPlayer,
          level: newLevel,
          inventory: mergedInventory,
          stats: {
            ...currentStats,
            exp: newExp,
            maxExp: newMaxExp,
            hp: finalHp,
            maxHp: newMaxHp,
            mp: finalMp,
            maxMp: newMaxMp,
            str: newStr,
            dex: newDex,
            int: newInt,
          },
        };

        // Save back into Slot 0
        const updatedSlot0: SaveSlotPayload = {
          ...slot0,
          savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          player: updatedPlayer,
        };

        await saveGameSlot(0, updatedSlot0);

        // Store sync notification payload for story display
        try {
          localStorage.setItem(
            "astra_trial_sync_result",
            JSON.stringify({
              expGained: trialExpGained,
              levelsGained,
              newLevel,
              itemsEarned: trialLootEarned.map((i) => i.name),
              timestamp: Date.now(),
            })
          );
          sessionStorage.setItem("astra_trials_returning", "true");
        } catch {}
      }
    } catch (err) {
      console.error("Failed to sync trial results to story slot:", err);
    }

    // Direct route back to the active story route and resume turn
    const baseReturn = returnTo || `/play/${storyId}`;
    const connector = baseReturn.includes("?") ? "&" : "?";
    router.push(`${baseReturn}${connector}loadSlot=0&resuming=true`);
  };

  // Custom abilities rolled in Character Creator
  const availableCustomAbilities: AbilityDetail[] = useMemo(() => {
    if (!syncedPlayer?.abilities || syncedPlayer.abilities.length === 0) return [];
    const details = syncedPlayer.abilityDetails || {};
    return syncedPlayer.abilities.map((name) => {
      return (
        details[name] || {
          name,
          type: "Active",
          cost: "15 MP",
          description: `Custom technique awakened by ${syncedPlayer.name || "Protagonist"}.`,
          tier: "Novice",
        }
      );
    });
  }, [syncedPlayer]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-zinc-950 to-black pointer-events-none" />
      <div className="absolute -top-40 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER BAR */}
      <header className="relative z-10 px-4 sm:px-8 py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReturnToStory}
            disabled={isSyncingBack}
            className="p-2 sm:px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-mono disabled:opacity-50"
            title="Return to Story and synchronize character stats & loot"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>{isSyncingBack ? "Synchronizing Story..." : "Return to Story"}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
              <Terminal className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white font-mono tracking-wider flex items-center gap-2">
                <span>SYSTEM ADMINISTRATOR: LITRPG TRIALS</span>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Daily Seed {todayDateString}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Causal Stability Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Causal Coherence:</span>
            <strong className="text-cyan-300">{causalPlausibility}%</strong>
          </div>
          <button
            onClick={handleRestartTrial}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Restart Trial"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN TRIAL DASHBOARD */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SECTOR PROGRESSION & COMBAT STAGE */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sector Step Tracker */}
          <div className="grid grid-cols-5 gap-2 bg-zinc-900/60 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
            {sectors.map((sec, idx) => {
              const isPast = idx < currentSectorIdx;
              const isCurrent = idx === currentSectorIdx;
              return (
                <div
                  key={sec.sectorNumber}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-blue-950/80 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/30"
                      : isPast
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-black/40 border-white/5 text-zinc-600"
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase font-bold flex items-center justify-center gap-1">
                    {isPast ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : `S${sec.sectorNumber}`}
                  </div>
                  <div className="text-[9px] font-mono truncate mt-0.5">{sec.difficulty}</div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE COMBAT ENCOUNTER CARD */}
          <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-white/15 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/80 to-transparent" />

            {/* Sector Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                  {activeSector.codename}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white font-serif tracking-wide">
                  {activeSector.title}
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                {activeSector.difficulty} Anomaly
              </span>
            </div>

            {/* Causal Modifier Banner */}
            <div className="mb-5 p-3 rounded-2xl bg-black/60 border border-blue-500/30 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    Active Modifier: {activeSector.causalModifier.name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {activeSector.causalModifier.description}
                </p>
                <div className="text-[10px] font-mono text-cyan-300 font-bold mt-1">
                  ✦ Effect: {activeSector.causalModifier.statEffect}
                </div>
              </div>
            </div>

            {/* Enemy Display & Health Bar */}
            <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-rose-200 font-serif">
                    {activeSector.enemyName}
                  </h3>
                  <p className="text-xs text-zinc-400 italic mt-0.5">{activeSector.enemyDesc}</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-rose-400 font-bold">{currentEnemyHp}</span> / {activeSector.enemyMaxHp} HP
                </div>
              </div>

              {/* Enemy Health Bar */}
              <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-300"
                  style={{ width: `${(currentEnemyHp / activeSector.enemyMaxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* PLAYER TACTICAL COMMAND DOCK */}
            {trialCompleted ? (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-3">
                <Trophy className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-lg font-bold text-emerald-300 font-serif">
                  TRIAL VICTORY: SOVEREIGN RECOGNITION
                </h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto">
                  The LitRPG Administrator has validated your causal stability across all 5 sectors. Total EXP
                  Earned: <strong className="text-emerald-400 font-mono">+{trialExpGained} EXP</strong>.
                </p>

                {trialLootEarned.length > 0 && (
                  <div className="py-2 max-w-md mx-auto">
                    <span className="text-[11px] font-mono uppercase text-zinc-400 block mb-1.5 font-bold">
                      ✦ Recovered Trial Loot ({trialLootEarned.length} Items):
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {trialLootEarned.map((loot) => (
                        <span
                          key={loot.id}
                          className="px-2.5 py-1 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {loot.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleReturnToStory}
                    disabled={isSyncingBack}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isSyncingBack ? "Synchronizing Story..." : "Return to Campaign (Sync All)"}</span>
                  </button>
                  <button
                    onClick={handleRestartTrial}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs cursor-pointer"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            ) : trialFailed ? (
              <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto animate-pulse" />
                <h3 className="text-lg font-bold text-rose-300 font-serif">CAUSAL DESYNCHRONIZATION</h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto">
                  Your timeline coherence collapsed in {activeSector.title}. Re-anchor your reality to attempt the
                  trial again or return to the active story.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleRestartTrial}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    Re-Attempt Trial
                  </button>
                  <button
                    onClick={handleReturnToStory}
                    disabled={isSyncingBack}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isSyncingBack ? "Syncing..." : "Return to Story"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Standard Tactical Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleTacticalAction("strike")}
                    disabled={isResolvingTurn}
                    className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-blue-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    <Sword className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-zinc-100 block">Kinetic Strike</span>
                      <span className="text-[10px] font-mono text-zinc-400">0 MP • High Stability</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTacticalAction("relic")}
                    disabled={isResolvingTurn || playerMp < 25}
                    className="p-3 rounded-2xl bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-amber-200 block truncate">
                        {activeSynergies[0]?.bonusName || "[Relic] Burst"}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300/80">25 MP • Massive Burst</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTacticalAction("companion")}
                    disabled={isResolvingTurn || playerMp < 20}
                    className="p-3 rounded-2xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-rose-200 block">Duo Synergy</span>
                      <span className="text-[10px] font-mono text-rose-300/80">20 MP • Damage & Heal</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTacticalAction("anchor")}
                    disabled={isResolvingTurn}
                    className="p-3 rounded-2xl bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-xs font-bold text-cyan-200 block">Anchor Reality</span>
                      <span className="text-[10px] font-mono text-cyan-300/80">0 MP • Restore +35 HP</span>
                    </div>
                  </button>
                </div>

                {/* Rolled Archetype Abilities (if player created custom abilities) */}
                {availableCustomAbilities.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" /> Awakened Archetype Abilities
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {availableCustomAbilities.map((ab) => (
                        <button
                          key={ab.name}
                          onClick={() => handleTacticalAction("ability", ab)}
                          disabled={isResolvingTurn || playerMp < 15}
                          className="p-2.5 rounded-2xl bg-purple-950/25 hover:bg-purple-950/45 border border-purple-500/30 hover:border-purple-400 text-left transition-all cursor-pointer flex items-center justify-between gap-2 group disabled:opacity-50"
                        >
                          <div>
                            <span className="text-xs font-bold text-purple-200 block">{ab.name}</span>
                            <span className="text-[10px] font-mono text-zinc-400 line-clamp-1">{ab.description}</span>
                          </div>
                          <span className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 shrink-0">
                            {ab.cost || "15 MP"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROTAGONIST STATUS & SYSTEM TERMINAL FEED */}
        <div className="lg:col-span-5 space-y-4">
          {/* Protagonist Status Widget */}
          <div className="p-4 rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex flex-col">
                <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Protagonist Sync
                </h3>
                <span className="text-[11px] font-bold text-white">
                  {syncedPlayer?.name || "Protagonist"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                Lv.{syncedPlayer?.level || 1} {syncedPlayer?.role || "Voidstrider"}
              </span>
            </div>

            {/* Health */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3.5 h-3.5" /> HP
                </span>
                <span>
                  {playerHp} / {playerMaxHp}
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100))}%` }}
                />
              </div>
            </div>

            {/* Mana */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Zap className="w-3.5 h-3.5" /> MP
                </span>
                <span>
                  {playerMp} / {playerMaxMp}
                </span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (playerMp / playerMaxMp) * 100))}%` }}
                />
              </div>
            </div>

            {/* Cumulative EXP */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Trial EXP Stored:</span>
              <span className="text-emerald-400 font-bold">+{trialExpGained} EXP</span>
            </div>

            {/* Active Gear Summary */}
            {syncedPlayer?.gear && (
              <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span>Equipped Weapon:</span>
                  <span className="text-zinc-200 truncate max-w-[140px]">{syncedPlayer.gear.weapon || "Bare Hands"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipped Relic:</span>
                  <span className="text-amber-300 truncate max-w-[140px]">{syncedPlayer.gear.relic || "None"}</span>
                </div>
              </div>
            )}

            {/* Acquired Trial Loot */}
            {trialLootEarned.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Package className="w-3.5 h-3.5" /> Trial Loot
                  </span>
                  <span className="text-amber-300 font-bold">{trialLootEarned.length}</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {trialLootEarned.map((loot) => (
                    <div
                      key={loot.id}
                      className="p-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-[10px] font-mono flex items-center justify-between gap-1"
                    >
                      <span className="text-zinc-200 truncate">{loot.name}</span>
                      <span className="text-[9px] uppercase px-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {loot.rarity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SYSTEM ADMINISTRATOR LIVE FEED */}
          <div className="p-4 rounded-3xl bg-black/85 border border-white/10 backdrop-blur-md space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-mono text-white font-bold tracking-wider flex items-center gap-1.5">
                    <span>ADMINISTRATOR FEED</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <span className="text-[9px] font-mono text-zinc-500">Live Combat Telemetry & Neural Synthesis</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/60 px-2 py-0.5 rounded-md border border-white/5">
                {combatFeed.length} Events
              </span>
            </div>

            {/* Structured Combat Telemetry & Narrative Feed */}
            <div
              ref={feedContainerRef}
              className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800"
            >
              {combatFeed.length === 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-zinc-500 text-xs font-mono">
                  No telemetry recorded. Initiate a tactical action to begin combat analysis.
                </div>
              ) : (
                combatFeed.map((entry) => {
                  if (entry.type === "protocol") {
                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-1 text-left"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-blue-400">
                          <span className="flex items-center gap-1 font-bold">
                            <Terminal className="w-3 h-3" /> [SYSTEM PROTOCOL]
                          </span>
                          <span className="text-zinc-500">{entry.time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-200 font-mono">
                          {entry.title}
                        </h4>
                        {entry.blurb && (
                          <p className="text-[11px] text-zinc-400 leading-snug font-sans">
                            {entry.blurb}
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (entry.type === "victory") {
                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 space-y-1 text-left shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <Trophy className="w-3.5 h-3.5" /> {entry.title}
                          </span>
                          <span className="text-zinc-500">{entry.time}</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-snug">
                          {entry.blurb}
                        </p>
                      </div>
                    );
                  }

                  // Combat Action Entry with Telemetry & AI Combat Blurb
                  const telem = entry.telemetry;
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-2xl bg-zinc-900/90 border border-blue-500/30 shadow-lg space-y-2 relative overflow-hidden backdrop-blur-md text-left"
                    >
                      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

                      {/* Header */}
                      <div className="flex items-center justify-between pb-1 border-b border-white/5">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Sword className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-white">{entry.actionName}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">{entry.time}</span>
                      </div>

                      {/* Telemetry Chips */}
                      {telem && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          {telem.damageDealt !== undefined && telem.damageDealt > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1">
                              <Zap className="w-3 h-3 text-rose-400" /> {telem.damageDealt} DMG
                            </span>
                          )}
                          {telem.mpCost !== undefined && telem.mpCost > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                              💧 -{telem.mpCost} MP
                            </span>
                          )}
                          {telem.hpHealed !== undefined && telem.hpHealed > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                              💚 +{telem.hpHealed} HP
                            </span>
                          )}
                          {telem.plausibilityShift !== undefined && telem.plausibilityShift !== 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300">
                              🛡️ {telem.plausibilityShift > 0 ? "+" : ""}{telem.plausibilityShift}% Coherence
                            </span>
                          )}
                        </div>
                      )}

                      {/* AI-Generated / Procedural Combat Blurb */}
                      {entry.blurb && (
                        <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                          <p className="text-[11px] text-zinc-200 italic leading-relaxed font-sans">
                            "{entry.blurb}"
                          </p>
                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                            <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                              {entry.isAiGenerated ? "AI Combat Narration" : "Procedural Telemetry"}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Enemy Counter Attack Telemetry */}
                      {telem?.enemyDamage !== undefined && telem.enemyDamage > 0 && (
                        <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                          <span className="text-rose-400/90 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Counter-Attack: {activeSector.enemyName}
                          </span>
                          <span className="text-rose-300 font-bold">
                            -{telem.enemyDamage} HP
                          </span>
                        </div>
                      )}

                      {/* Remaining Enemy HP Micro-Bar */}
                      {telem?.enemyRemainingHp !== undefined && telem?.enemyMaxHp !== undefined && (
                        <div className="space-y-0.5 pt-1 border-t border-white/5 text-[9px] font-mono text-zinc-400">
                          <div className="flex justify-between">
                            <span>Target Status:</span>
                            <span className="text-rose-300 font-bold">
                              {telem.enemyRemainingHp} / {telem.enemyMaxHp} HP
                            </span>
                          </div>
                          <div className="w-full bg-black/60 h-1 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-rose-600 to-pink-500 transition-all duration-300"
                              style={{
                                width: `${Math.max(0, Math.min(100, (telem.enemyRemainingHp / telem.enemyMaxHp) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LitRPGTrialsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 text-zinc-300 flex items-center justify-center font-mono text-xs">
          <Terminal className="w-4 h-4 text-blue-400 animate-pulse mr-2" />
          Synchronizing Administrator Trial Chamber...
        </div>
      }
    >
      <LitRPGTrialsContent />
    </Suspense>
  );
}
