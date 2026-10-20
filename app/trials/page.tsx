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
  Bot,
  Wand2,
  Skull,
  Target,
  X,
  Lock,
  Moon,
  CloudFog,
  Compass
} from "lucide-react";
import { soundEffects } from "@/lib/audioEngine";
import { loadGameSlot, saveGameSlot, SaveSlotPayload } from "@/lib/saveStorage";
import { saveCodexLoot } from "@/lib/codexStorage";
import { InventoryItem, PlayerProfile, AbilityDetail, StoryCompanion, TrialModifier } from "@/types/story";
import { evaluateRelicSynergies } from "@/lib/relicSynergies";
import { getClassArsenal, ClassArsenal, ClassTacticalAction } from "@/lib/trialsClassArsenals";
import {
  buildActiveTrialCompanion,
  ActiveTrialCompanion,
  getCompanionAffectionTier,
  COMBAT_STANCES,
  CombatStanceType,
  getAvailableStancesForRole,
  resolveEvolvedAbilityName,
  PREDEFINED_TRIAL_MODIFIERS,
  getSectorModifiersForRun,
  getRandomSectorModifier,
  getDiscoveredCompanions,
} from "@/lib/progressionMechanics";

interface SectorDefinition {
  sectorNumber: number;
  title: string;
  codename: string;
  difficulty: "D-Rank" | "C-Rank" | "B-Rank" | "A-Rank" | "S-Rank";
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyDesc: string;
  causalModifier: TrialModifier;
  enemyImageUrl?: string;
}

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

  // Pillar 1 & 2 State: Co-Op Companion & Tactical Stance
  const [activeCompanion, setActiveCompanion] = useState<ActiveTrialCompanion | null>(null);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [activeStance, setActiveStance] = useState<CombatStanceType>("neutral");
  const [activeShield, setActiveShield] = useState(0);
  const [trialTurnCount, setTrialTurnCount] = useState(0);

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

          // Hydrate active companion from slot party (state-filtered to discovered characters only)
          if (slot.party && Array.isArray(slot.party) && slot.party.length > 0) {
            const discovered = getDiscoveredCompanions(slot.party, slot.unlockedCompanions);
            if (discovered.length > 0) {
              const savedCompId = slot.activeTrialCompanionId;
              const comp = discovered.find((c: any) => c.id === savedCompId || c.name === savedCompId) || discovered[0];
              if (comp) {
                setActiveCompanion(buildActiveTrialCompanion(comp));
              }
            } else {
              setActiveCompanion(null);
            }
          }

          // Hydrate active stance
          if (slot.activeStance) {
            setActiveStance(slot.activeStance as CombatStanceType);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load slot 0 in trials:", err);
      });
  }, []);

  // State-Filtered companions available for trial deployment
  const discoveredCompanions = useMemo(() => {
    return getDiscoveredCompanions(activeSlot0?.party, activeSlot0?.unlockedCompanions);
  }, [activeSlot0?.party, activeSlot0?.unlockedCompanions]);

  // Compute available stances for protagonist role (Pillar 2)
  const availableStances = useMemo(() => {
    return getAvailableStancesForRole(syncedPlayer?.role);
  }, [syncedPlayer?.role]);

  // Compute active synergies from synced gear & inventory
  const activeSynergies = useMemo(() => {
    if (!syncedPlayer) return [];
    return evaluateRelicSynergies(syncedPlayer.inventory || [], syncedPlayer.gear);
  }, [syncedPlayer]);

  // Dynamically resolved Class Tactical Arsenal based on Protagonist's class role
  const classArsenal: ClassArsenal = useMemo(() => {
    return getClassArsenal(syncedPlayer?.role);
  }, [syncedPlayer?.role]);

  // Persistent Gear Image lookup from cache (Story Item or gearImages)
  const getGearImageUrl = (gearName?: string): string | null => {
    if (!gearName || gearName === "Bare Hands" || gearName === "Rags" || gearName === "None" || gearName.includes("Pending")) return null;
    const invMatch = syncedPlayer?.inventory?.find((i) => i.name.toLowerCase() === gearName.toLowerCase());
    if (invMatch?.imageUrl) return invMatch.imageUrl;
    if (syncedPlayer?.gearImages?.[gearName]) return syncedPlayer.gearImages[gearName];
    return null;
  };

  // Predefined Trial Modifiers for the active run (Pillar 1 Upgrade)
  const runModifiers = useMemo(() => {
    return getSectorModifiersForRun(5, todayDateString);
  }, [todayDateString]);

  // 5 Consecutive Roguelite Sectors with Predefined Modifiers
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
        causalModifier: runModifiers[0] || PREDEFINED_TRIAL_MODIFIERS[0],
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
        causalModifier: runModifiers[1] || PREDEFINED_TRIAL_MODIFIERS[1],
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
        causalModifier: runModifiers[2] || PREDEFINED_TRIAL_MODIFIERS[2],
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
        causalModifier: runModifiers[3] || PREDEFINED_TRIAL_MODIFIERS[3],
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
        causalModifier: runModifiers[4] || PREDEFINED_TRIAL_MODIFIERS[7],
      },
    ],
    [runModifiers]
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
        blurb: `Modifier Detected: ${activeSector.causalModifier.name} — ${activeSector.causalModifier.description} (Effect: ${activeSector.causalModifier.statEffectLabel})`,
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
    const className = classArsenal.className;
    if (type === "strike") {
      return `${pName} (${className}) steps into range, executing ${actionName} on ${targetName} for ${dmg} damage!`;
    } else if (type === "burst" || type === "relic") {
      return `Overclocking their ${className} core, ${pName} detonates ${actionName} across ${targetName} for ${dmg} massive damage!`;
    } else if (type === "synergy" || type === "companion") {
      return `${pName} invokes ${actionName}, weaving tactical resonance to bombard ${targetName} for ${dmg} damage while infusing vitality!`;
    } else if (type === "defense" || type === "anchor") {
      return `${pName} assumes ${actionName}, stabilizing personal timeline boundaries and knitting vital wounds.`;
    }
    return `${pName} unleashes ${actionName}, striking ${targetName} with decisive precision for ${dmg} damage!`;
  };

  // Turn Action Execution with Protagonist Class, Stances, and Co-Op Resonance
  const handleTacticalAction = (
    actionType: "strike" | "burst" | "synergy" | "defense" | "ability" | "relic" | "companion" | "anchor" | "duo_ultimate",
    customAbility?: AbilityDetail
  ) => {
    if (isResolvingTurn || trialCompleted || trialFailed || isSyncingBack) return;
    setIsResolvingTurn(true);
    setTrialTurnCount((prev) => prev + 1);
    soundEffects.playClick();

    setTimeout(() => {
      let playerDamage = 0;
      let mpUsed = 0;
      let hpRegen = 0;
      let plausibilityShift = 0;
      let isStunned = false;
      let actionName = classArsenal.actions.strike.name;

      const pStr = syncedPlayer?.stats?.str || 10;
      const pDex = syncedPlayer?.stats?.dex || 10;
      const pInt = syncedPlayer?.stats?.int || 10;
      const pLevel = syncedPlayer?.level || 1;

      // 0. Awakened Duo Ultimate (Pillar 1 - Beloved Tier 75%+)
      if (actionType === "duo_ultimate" && activeCompanion) {
        const ult = activeCompanion.resonance.belovedUltimate;
        actionName = `[DUO ULTIMATE] ${ult.name}`;
        if (playerMp >= ult.mpCost) {
          mpUsed = ult.mpCost;
          const baseUlt = 75 + Math.floor((pStr + pDex + pInt) * 1.5) + pLevel * 4;
          playerDamage = Math.floor(baseUlt * ult.multiplier);
          plausibilityShift = 6;
          isStunned = ult.inflictsStun;
          soundEffects.playQuestComplete();
        } else {
          actionName = `${ult.name} (Insufficient MP)`;
          playerDamage = 20;
          plausibilityShift = -2;
        }

      // 1. Basic Class Strike (0 MP)
      } else if (actionType === "strike") {
        const actionCfg = classArsenal.actions.strike;
        actionName = actionCfg.name;
        let statBonus = 0;
        if (actionCfg.scalingStat === "str") statBonus = Math.floor(pStr * 1.6);
        else if (actionCfg.scalingStat === "dex") statBonus = Math.floor(pDex * 1.65);
        else if (actionCfg.scalingStat === "int") statBonus = Math.floor(pInt * 1.6);
        else statBonus = Math.floor((pStr + pDex) * 0.9);

        const base = (actionCfg.baseDamage || 26) + statBonus + pLevel * 2;
        playerDamage = Math.floor(base + Math.random() * 14);
        hpRegen = actionCfg.baseHeal || 0;
        plausibilityShift = actionCfg.coherenceDelta || 2;

      // 2. Class Signature Burst / Overclock (20-25 MP)
      } else if (actionType === "burst" || actionType === "relic") {
        const actionCfg = classArsenal.actions.burst;
        actionName = activeSynergies[0]?.bonusName
          ? `[${activeSynergies[0].bonusName}] ${actionCfg.name}`
          : actionCfg.name;

        if (playerMp >= actionCfg.costMp) {
          mpUsed = actionCfg.costMp;
          let statBonus = 0;
          if (actionCfg.scalingStat === "str") statBonus = Math.floor(pStr * 2.2);
          else if (actionCfg.scalingStat === "dex") statBonus = Math.floor(pDex * 2.4);
          else if (actionCfg.scalingStat === "int") statBonus = Math.floor(pInt * 2.3);
          else statBonus = Math.floor((pStr + pInt) * 1.2);

          const hasVoidstrider = activeSynergies.some((s) => s.setName.toLowerCase().includes("voidstrider") && s.isActive);
          const bonus = hasVoidstrider ? 20 : 0;
          const base = (actionCfg.baseDamage || 62) + statBonus + pLevel * 3 + bonus;
          playerDamage = Math.floor(base + Math.random() * 24);
          plausibilityShift = 4;
        } else {
          actionName = `${actionCfg.name} (Exhausted)`;
          playerDamage = 18;
          plausibilityShift = -3;
        }

      // 3. Class Tactical Synergy / Technique (15-20 MP)
      } else if (actionType === "synergy" || actionType === "companion") {
        const actionCfg = classArsenal.actions.synergy;
        actionName = actionCfg.name;
        if (playerMp >= actionCfg.costMp) {
          mpUsed = actionCfg.costMp;
          let statBonus = 0;
          if (actionCfg.scalingStat === "dex") statBonus = Math.floor(pDex * 1.5);
          else if (actionCfg.scalingStat === "str") statBonus = Math.floor(pStr * 1.5);
          else statBonus = Math.floor(pInt * 1.5);

          const base = (actionCfg.baseDamage || 32) + statBonus + pLevel * 2;
          playerDamage = Math.floor(base + Math.random() * 16);
          hpRegen = (actionCfg.baseHeal || 25) + Math.floor(pLevel * 2);
          plausibilityShift = actionCfg.coherenceDelta || 3;
        } else {
          actionName = `${actionCfg.name} (Low MP)`;
          playerDamage = 18;
          hpRegen = 10;
        }

      // 4. Class Defensive Stance / Reality Anchor (0 MP)
      } else if (actionType === "defense" || actionType === "anchor") {
        const actionCfg = classArsenal.actions.defense;
        actionName = actionCfg.name;
        hpRegen = (actionCfg.baseHeal || 35) + Math.floor(pLevel * 3);
        plausibilityShift = actionCfg.coherenceDelta || 6;

      // 5. Awakened Custom Archetype Ability (from Character Creation)
      } else if (actionType === "ability" && customAbility) {
        actionName = customAbility.name;
        const costMatch = (customAbility.cost || "").match(/\d+/);
        const costNum = costMatch ? parseInt(costMatch[0], 10) : 15;
        if (playerMp >= costNum) {
          mpUsed = costNum;
          const base = 42 + Math.floor((pStr + pInt + pDex) * 0.9) + pLevel * 3;
          playerDamage = Math.floor(base + Math.random() * 22);
          plausibilityShift = 4;
        } else {
          playerDamage = 16;
          plausibilityShift = -2;
        }
      }

      // Apply Combat Stance Multiplier (Pillar 2)
      const currentStanceConfig = COMBAT_STANCES[activeStance as CombatStanceType] || COMBAT_STANCES.neutral;
      playerDamage = Math.floor(playerDamage * currentStanceConfig.damageMultiplier);

      // Trigger Confidant Passive Co-Op (Pillar 1)
      if (activeCompanion && ["Confidant", "Beloved", "Sworn Partner"].includes(activeCompanion.tier)) {
        const passive = activeCompanion.resonance.confidantPassive;
        const isCrisis = playerHp < playerMaxHp * 0.45;
        const isInterval = (trialTurnCount + 1) % 3 === 0;
        if (isCrisis || isInterval) {
          if (passive.type === "shield") {
            setActiveShield((prev) => Math.min(65, prev + passive.value));
          } else if (passive.type === "heal") {
            hpRegen += passive.value;
          }
        }
      }

      // Apply to enemy
      const nextEnemyHp = Math.max(0, currentEnemyHp - playerDamage);
      setCurrentEnemyHp(nextEnemyHp);
      setPlayerMp((prev) => Math.max(0, prev - mpUsed));
      setPlayerHp((prev) => Math.min(playerMaxHp, prev + hpRegen));
      setCausalPlausibility((prev) => Math.max(10, Math.min(100, prev + plausibilityShift)));

      // Enemy Counter-attack if alive and not stunned
      let enemyDamage = 0;
      if (nextEnemyHp > 0) {
        if (isStunned) {
          enemyDamage = 0; // Stunned!
        } else {
          let rawEnemyDamage = Math.floor(14 + Math.random() * 14 + currentSectorIdx * 6);
          // Absorb with shield
          if (activeShield > 0) {
            if (activeShield >= rawEnemyDamage) {
              setActiveShield((prev) => prev - rawEnemyDamage);
              enemyDamage = 0;
            } else {
              enemyDamage = rawEnemyDamage - activeShield;
              setActiveShield(0);
            }
          } else {
            enemyDamage = rawEnemyDamage;
          }

          if (enemyDamage > 0) {
            setPlayerHp((prev) => {
              const nextHp = prev - enemyDamage;
              if (nextHp <= 0) {
                setTrialFailed(true);
                soundEffects.playSystemAlert();
              }
              return Math.max(0, nextHp);
            });
          }
        }
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

      // Trigger AI narrative synthesis with Co-Op companion and active stance
      fetch("/api/generate-combat-blurb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType,
          actionName,
          protagonistName: syncedPlayer?.name || "Protagonist",
          protagonistRole: classArsenal.className,
          enemyName: activeSector.enemyName,
          damageDealt: playerDamage,
          enemyDamage,
          sectorName: activeSector.title,
          causalModifier: activeSector.causalModifier.name,
          activeCompanion: activeCompanion
            ? {
                name: activeCompanion.name,
                role: activeCompanion.role,
                affection: activeCompanion.affection,
                tier: activeCompanion.tier,
                ultimateName: activeCompanion.resonance?.belovedUltimate?.name,
              }
            : null,
          activeStance,
          isDuoUltimate: actionType === "duo_ultimate",
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

        // Save back into Slot 0 with Co-Op companion and stance
        const updatedSlot0: SaveSlotPayload = {
          ...slot0,
          savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          player: updatedPlayer,
          activeTrialCompanionId: activeCompanion?.id,
          activeStance,
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

  // Custom abilities rolled in Character Creator with Skill Evolution (Pillar 2)
  const availableCustomAbilities: AbilityDetail[] = useMemo(() => {
    if (!syncedPlayer?.abilities || syncedPlayer.abilities.length === 0) return [];
    const details = syncedPlayer.abilityDetails || {};
    const pLevel = syncedPlayer.level || 1;
    return syncedPlayer.abilities.map((name) => {
      const evo = resolveEvolvedAbilityName(name, pLevel, syncedPlayer.role);
      const base = details[name] || {
        name,
        type: "Active",
        cost: "15 MP",
        description: `Custom technique awakened by ${syncedPlayer.name || "Protagonist"}.`,
        tier: "Novice",
      };
      return {
        ...base,
        name: evo.name,
        tier: evo.tier,
        description: evo.description || base.description,
      };
    });
  }, [syncedPlayer]);

  // Helper to render action icons based on tactical archetype
  const renderActionIcon = (iconType: string, className = "w-4 h-4") => {
    switch (iconType) {
      case "sword":
        return <Sword className={className} />;
      case "zap":
        return <Zap className={className} />;
      case "sparkles":
        return <Sparkles className={className} />;
      case "shield":
        return <Shield className={className} />;
      case "flame":
        return <Flame className={className} />;
      case "skull":
        return <Skull className={className} />;
      case "wand":
        return <Wand2 className={className} />;
      case "dagger":
      case "target":
        return <Target className={className} />;
      default:
        return <Sword className={className} />;
    }
  };

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

            {/* Causal Modifier Banner (Predefined Modifiers) */}
            <div className={`mb-5 p-3 rounded-2xl bg-black/60 border flex items-start gap-3 ${
              activeSector.causalModifier.colorTheme === "rose"
                ? "border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                : activeSector.causalModifier.colorTheme === "purple"
                ? "border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                : activeSector.causalModifier.colorTheme === "amber"
                ? "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                : "border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            }`}>
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                activeSector.causalModifier.colorTheme === "rose"
                  ? "text-rose-400"
                  : activeSector.causalModifier.colorTheme === "purple"
                  ? "text-purple-400"
                  : activeSector.causalModifier.colorTheme === "amber"
                  ? "text-amber-400"
                  : "text-cyan-400"
              }`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">
                    Active Modifier: <span className="text-amber-300">{activeSector.causalModifier.name}</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  {activeSector.causalModifier.description}
                </p>
                <div className="text-[10px] font-mono text-cyan-300 font-bold mt-1">
                  ✦ Effect: {activeSector.causalModifier.statEffectLabel}
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
              <div className="space-y-3">
                {/* Pillar 1: Companion Co-Op Resonance Banner */}
                <div className="p-3 rounded-2xl bg-black/60 border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-950/80 border border-purple-500/40 shrink-0 flex items-center justify-center">
                      {activeCompanion?.avatarUrl ? (
                        <img src={activeCompanion.avatarUrl} alt={activeCompanion.name} className="w-full h-full object-cover" />
                      ) : (
                        <Heart className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {activeCompanion ? activeCompanion.name : "Solo Deploy"}
                        </span>
                        {activeCompanion && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            ["Beloved", "Sworn Partner"].includes(activeCompanion.tier)
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                              : activeCompanion.tier === "Confidant"
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/40"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                          }`}>
                            {activeCompanion.tier} ({activeCompanion.affection}%)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                        {activeCompanion
                          ? `Passive: ${activeCompanion.resonance?.confidantPassive?.name || "Guardian Oath"}`
                          : "No companion selected. Deploy a companion for resonance passives."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCompanionModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white font-mono text-[10px] font-bold shrink-0 transition-all cursor-pointer"
                  >
                    Switch Companion
                  </button>
                </div>

                {/* Pillar 2: Combat Stance / Mode Toggles */}
                {availableStances.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> Tactical Stance:
                    </span>
                    {availableStances.map((stId) => {
                      const cfg = COMBAT_STANCES[stId];
                      const isActive = activeStance === stId;
                      return (
                        <button
                          key={stId}
                          onClick={() => {
                            setActiveStance(stId);
                            soundEffects.playClick();
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono transition-all cursor-pointer shrink-0 border ${
                            isActive
                              ? "bg-cyan-950/90 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                              : "bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                          title={cfg.modifierLabel}
                        >
                          {cfg.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Class Tactical Arsenal Banner */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      {classArsenal.className} Arsenal
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 truncate max-w-xs">
                      • {classArsenal.classTagline}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                    Scaling: {classArsenal.primaryStat}
                  </span>
                </div>

                {/* Awakened Duo Ultimate (Pillar 1 - Beloved Tier 75%+) */}
                {activeCompanion && ["Beloved", "Sworn Partner"].includes(activeCompanion.tier) && (
                  <button
                    onClick={() => handleTacticalAction("duo_ultimate")}
                    disabled={isResolvingTurn || playerMp < (activeCompanion.resonance?.belovedUltimate?.mpCost || 28)}
                    className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-600/30 via-purple-600/40 to-pink-600/30 hover:from-amber-600/50 hover:via-purple-600/60 hover:to-pink-600/50 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.35)] text-left transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-95 disabled:opacity-50 animate-pulse"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300">
                        <Sparkles className="w-4 h-4 animate-spin" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-amber-200">
                            {activeCompanion.resonance?.belovedUltimate?.name || "Awakened Duo Ultimate"}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400 text-amber-300">
                            DUO ULTIMATE
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300/80 block mt-0.5">
                          {activeCompanion.resonance?.belovedUltimate?.voiceLine || "Together through the ash!"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-300 block">
                        {activeCompanion.resonance?.belovedUltimate?.mpCost || 28} MP
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300 block">
                        Guaranteed Stun • {activeCompanion.resonance?.belovedUltimate?.multiplier || 3.4}x DMG
                      </span>
                    </div>
                  </button>
                )}

                {/* Class Dynamic Tactical Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 1. Class Basic Strike (0 MP) */}
                  <button
                    onClick={() => handleTacticalAction("strike")}
                    disabled={isResolvingTurn}
                    className="p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-blue-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    {renderActionIcon(classArsenal.actions.strike.iconType, "w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform")}
                    <div>
                      <span className="text-xs font-bold text-zinc-100 block truncate">
                        {classArsenal.actions.strike.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 block truncate">
                        0 MP • {classArsenal.actions.strike.badgeText}
                      </span>
                    </div>
                  </button>

                  {/* 2. Class Signature Burst / Overclock (20-25 MP) */}
                  <button
                    onClick={() => handleTacticalAction("burst")}
                    disabled={isResolvingTurn || playerMp < classArsenal.actions.burst.costMp}
                    className="p-3 rounded-2xl bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/30 hover:border-amber-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    {renderActionIcon(classArsenal.actions.burst.iconType, "w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform")}
                    <div>
                      <span className="text-xs font-bold text-amber-200 block truncate">
                        {activeSynergies[0]?.bonusName
                          ? `[${activeSynergies[0].bonusName}] ${classArsenal.actions.burst.name}`
                          : classArsenal.actions.burst.name}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300/80 block truncate">
                        {classArsenal.actions.burst.costMp} MP • {classArsenal.actions.burst.badgeText}
                      </span>
                    </div>
                  </button>

                  {/* 3. Class Tactical Synergy / Technique (15-20 MP) */}
                  <button
                    onClick={() => handleTacticalAction("synergy")}
                    disabled={isResolvingTurn || playerMp < classArsenal.actions.synergy.costMp}
                    className="p-3 rounded-2xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    {renderActionIcon(classArsenal.actions.synergy.iconType, "w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform")}
                    <div>
                      <span className="text-xs font-bold text-rose-200 block truncate">
                        {classArsenal.actions.synergy.name}
                      </span>
                      <span className="text-[10px] font-mono text-rose-300/80 block truncate">
                        {classArsenal.actions.synergy.costMp} MP • {classArsenal.actions.synergy.badgeText}
                      </span>
                    </div>
                  </button>

                  {/* 4. Class Defensive Stance / Reality Anchor (0 MP) */}
                  <button
                    onClick={() => handleTacticalAction("defense")}
                    disabled={isResolvingTurn}
                    className="p-3 rounded-2xl bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group active:scale-95 disabled:opacity-50"
                  >
                    {renderActionIcon(classArsenal.actions.defense.iconType, "w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform")}
                    <div>
                      <span className="text-xs font-bold text-cyan-200 block truncate">
                        {classArsenal.actions.defense.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300/80 block truncate">
                        0 MP • {classArsenal.actions.defense.badgeText}
                      </span>
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
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Heart className="w-3.5 h-3.5" /> HP
                  {activeShield > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-cyan-950/80 border border-cyan-500/50 text-[10px] text-cyan-300 font-bold animate-pulse">
                      +{activeShield} Shield
                    </span>
                  )}
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

            {/* Active Gear Summary (with persistent image continuity) */}
            {syncedPlayer?.gear && (
              <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-zinc-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Sword className="w-3 h-3 text-cyan-400" /> Weapon:
                  </span>
                  <div className="flex items-center gap-1.5 max-w-[170px]">
                    {getGearImageUrl(syncedPlayer.gear.weapon) && (
                      <img
                        src={getGearImageUrl(syncedPlayer.gear.weapon)!}
                        alt={syncedPlayer.gear.weapon}
                        className="w-4 h-4 rounded object-cover border border-cyan-500/30 shrink-0"
                      />
                    )}
                    <span className="text-zinc-200 truncate">{syncedPlayer.gear.weapon || "Bare Hands"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Shield className="w-3 h-3 text-purple-400" /> Armor:
                  </span>
                  <div className="flex items-center gap-1.5 max-w-[170px]">
                    {getGearImageUrl(syncedPlayer.gear.armor) && (
                      <img
                        src={getGearImageUrl(syncedPlayer.gear.armor)!}
                        alt={syncedPlayer.gear.armor}
                        className="w-4 h-4 rounded object-cover border border-purple-500/30 shrink-0"
                      />
                    )}
                    <span className="text-zinc-200 truncate">{syncedPlayer.gear.armor || "Rags"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Relic:
                  </span>
                  <div className="flex items-center gap-1.5 max-w-[170px]">
                    {getGearImageUrl(syncedPlayer.gear.relic) && (
                      <img
                        src={getGearImageUrl(syncedPlayer.gear.relic)!}
                        alt={syncedPlayer.gear.relic}
                        className="w-4 h-4 rounded object-cover border border-amber-500/30 shrink-0"
                      />
                    )}
                    <span className="text-amber-300 truncate">{syncedPlayer.gear.relic || "None"}</span>
                  </div>
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

      {/* COMPANION SELECTION MODAL (Pillar 1) */}
      {showCompanionModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setShowCompanionModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-400">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Deploy Co-Op Story Companion</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Select an active companion to fight alongside you in the 5-sector trials.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompanionModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Companions Roster (State-Filtered to encountered characters only) */}
            <div className="space-y-2.5">
              {discoveredCompanions && discoveredCompanions.length > 0 ? (
                discoveredCompanions.map((comp: any) => {
                  const trialComp = buildActiveTrialCompanion(comp);
                  const isSelected = activeCompanion?.id === trialComp.id;
                  const isBeloved = ["Beloved", "Sworn Partner"].includes(trialComp.tier);
                  const isConfidant = trialComp.tier === "Confidant" || isBeloved;

                  return (
                    <div
                      key={trialComp.id}
                      onClick={() => {
                        setActiveCompanion(trialComp);
                        setShowCompanionModal(false);
                        soundEffects.playClick();
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          : "bg-zinc-900/60 hover:bg-zinc-900 border-white/10 hover:border-purple-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                          {trialComp.avatarUrl ? (
                            <img src={trialComp.avatarUrl} alt={trialComp.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <Heart className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{trialComp.name}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isBeloved
                                ? "bg-amber-500/10 text-amber-300 border-amber-500/40"
                                : isConfidant
                                ? "bg-purple-500/10 text-purple-300 border-purple-500/40"
                                : "bg-zinc-800 text-zinc-400 border-zinc-700"
                            }`}>
                              {trialComp.tier} ({trialComp.affection}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">
                            {trialComp.role}
                          </p>
                          <div className="text-[10px] font-mono text-zinc-400 mt-1 space-y-0.5">
                            <div>
                              ✦ <strong className="text-purple-300">{trialComp.resonance.confidantPassive.name}</strong>: {trialComp.resonance.confidantPassive.description}
                            </div>
                            {isBeloved && (
                              <div className="text-amber-300">
                                ✦ <strong className="text-amber-200">Awakened Duo Ultimate</strong>: {trialComp.resonance.belovedUltimate.name} (Stun & 3.4x DMG)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                        }`}
                      >
                        {isSelected ? "Active" : "Select"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 rounded-2xl bg-zinc-900/60 border border-dashed border-white/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white font-serif">NO COMPANIONS UNLOCKED</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      You have not encountered any story companions yet. Progress through the narrative campaign to meet heroines and deploy their trial resonance passives.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
