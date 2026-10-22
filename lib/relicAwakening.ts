// Cursed Relic Purification & Mythic Awakening Engine
// Assigns deterministic unsealing quests to Cursed & Relic-tier artifacts, tracks progression across campaign events,
// and executes Awakened Mythic Form transformations with new stats and active abilities.

import {
  StoryRelicItem,
  RelicUnsealingCondition,
  RelicUnsealingConditionType,
  RelicAwakenedForm,
  AbilityDetail,
} from "@/types/story";

function deterministicHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Ensures any 'cursed' or 'relic' rarity item has a deterministic Unsealing Condition and Awakened Mythic Form.
 * Safe to call repeatedly on inventory arrays; already-initialized or awakened items are preserved.
 */
export function ensureRelicUnsealingCondition<T extends StoryRelicItem>(item: T): T {
  if (!item || (item.rarity !== "cursed" && item.rarity !== "relic")) {
    return item;
  }
  if (item.isAwakened || (item.unsealingCondition && item.awakenedForm)) {
    return item;
  }

  const seed = deterministicHash(`${item.name || "Relic"}_${item.type || "relic"}`);
  const conditionTypes: RelicUnsealingConditionType[] = [
    "clash_victory",
    "turns_survived",
    "covenant_invoked",
    "low_hp_survival",
    "high_affection",
  ];
  const chosenType = conditionTypes[seed % conditionTypes.length];

  let condition: RelicUnsealingCondition;
  switch (chosenType) {
    case "clash_victory":
      condition = {
        id: `unseal_${item.id || seed}_clash`,
        type: "clash_victory",
        label: "Blood-Forged Triumph",
        description: "Triumph in a Sector Clash or endure 3 narrative turns while bearing this artifact.",
        currentValue: 0,
        targetValue: 3,
        isMet: false,
      };
      break;
    case "low_hp_survival":
      condition = {
        id: `unseal_${item.id || seed}_lowhp`,
        type: "low_hp_survival",
        label: "Abyssal Brink Resonance",
        description: "Survive a turn below 60% Integrity or endure 2 narrative turns while carrying this seal.",
        currentValue: 0,
        targetValue: 2,
        isMet: false,
      };
      break;
    case "covenant_invoked":
      condition = {
        id: `unseal_${item.id || seed}_covenant`,
        type: "covenant_invoked",
        label: "Causal Severance Catalyst",
        description: "Invoke a Reality Severance Covenant or complete 2 narrative turns with this relic.",
        currentValue: 0,
        targetValue: 2,
        isMet: false,
      };
      break;
    case "high_affection":
      condition = {
        id: `unseal_${item.id || seed}_bond`,
        type: "high_affection",
        label: "Heart-Sync Purification",
        description: "Attain 20% Affection with any companion or resonate across 2 narrative turns.",
        currentValue: 0,
        targetValue: 2,
        isMet: false,
      };
      break;
    case "turns_survived":
    default:
      condition = {
        id: `unseal_${item.id || seed}_turns`,
        type: "turns_survived",
        label: "Temporal Tempering",
        description: "Resonate with the artifact across 3 narrative turns without succumbing to its curse.",
        currentValue: 0,
        targetValue: 3,
        isMet: false,
      };
      break;
  }

  const prefixes = ["Sovereign", "Unshackled", "Astral", "Transcended", "Celestial", "Zenith"];
  const prefix = prefixes[seed % prefixes.length];
  const baseNameClean = (item.name || "Artifact").replace(/^(Cursed|Sealed|Fractured|Tainted)\s+/i, "");
  const awakenedName = `${prefix} ${baseNameClean}`;

  const skillVerbs = ["Nova", "Severance", "Aegis", "Cataclysm", "Resonance", "Override"];
  const skillVerb = skillVerbs[(seed >> 3) % skillVerbs.length];

  const signatureSkill: AbilityDetail = {
    name: `${awakenedName}: ${skillVerb}`,
    description: `Unleashes the purified core of ${awakenedName}, dealing massive stance-piercing resonance and shielding the wielder's integrity.`,
    type: "Active",
    cost: "15 MP",
    cooldown: "2 Turns",
    tier: "Mythic",
  };

  const statBonuses =
    item.type === "weapon"
      ? { str: 6, dex: 4, maxHp: 25, maxMp: 10 }
      : item.type === "armor"
      ? { str: 3, int: 4, maxHp: 40, maxMp: 15 }
      : { str: 4, dex: 4, int: 6, maxHp: 30, maxMp: 25 };

  const awakenedForm: RelicAwakenedForm = {
    awakenedName,
    awakenedDescription: `The abyssal seal upon ${item.name} has been shattered and purified. Its dormant astral lattice now blazes with sovereign authority, converting its former curse into overwhelming mythic resonance.`,
    awakenedEffect:
      item.type === "weapon"
        ? "Purified Mythic Edge: +6 STR, +4 DEX, +25 Max HP & Unlocks Mythic Skill"
        : item.type === "armor"
        ? "Purified Mythic Ward: +40 Max HP, +15 Max MP, +4 INT & Unlocks Mythic Skill"
        : "Purified Astral Core: +6 INT, +4 STR/DEX, +30 Max HP & Unlocks Mythic Skill",
    visualPrompt: `Mythic awakened celestial fantasy RPG ${item.type} icon, ${awakenedName}, radiant golden and astral starlight aura, intricate sacred engravings, dark obsidian background`,
    signatureSkill,
    statBonuses,
  };

  return {
    ...item,
    unsealingCondition: item.unsealingCondition || condition,
    awakenedForm: item.awakenedForm || awakenedForm,
  };
}

/**
 * Ensures an entire inventory list has deterministic unsealing conditions on all cursed/relic items.
 */
export function ensureInventoryRelicConditions<T extends StoryRelicItem>(inventory: T[]): T[] {
  if (!Array.isArray(inventory)) return [];
  return inventory.map((item) => ensureRelicUnsealingCondition(item));
}

/**
 * Advances unsealing progress across all unawakened cursed/relic items in the player's inventory.
 * Returns the updated inventory and a list of items that newly became ready to awaken on this event.
 */
export function updateInventoryUnsealingProgress<T extends StoryRelicItem>(
  inventory: T[],
  eventType: RelicUnsealingConditionType | "any_turn",
  amount: number = 1,
  maxPartyAffection: number = 0
): { updatedInventory: T[]; newlyReadyItems: T[] } {
  if (!Array.isArray(inventory) || inventory.length === 0) {
    return { updatedInventory: [], newlyReadyItems: [] };
  }

  const newlyReadyItems: T[] = [];

  const updatedInventory = inventory.map((rawItem) => {
    const item = ensureRelicUnsealingCondition(rawItem);
    if (item.isAwakened || !item.unsealingCondition) {
      return item;
    }

    const cond = { ...item.unsealingCondition };
    const wasReady = cond.isMet;

    let delta = 0;
    if (eventType === cond.type) {
      delta = amount;
    } else if (eventType === "any_turn") {
      delta = 1;
      if (cond.type === "high_affection" && maxPartyAffection >= 20) {
        delta = cond.targetValue;
      }
    }

    if (delta > 0) {
      cond.currentValue = Math.min(cond.targetValue, cond.currentValue + delta);
      if (cond.currentValue >= cond.targetValue) {
        cond.isMet = true;
      }
    }

    const updatedItem: T = {
      ...item,
      unsealingCondition: cond,
    };

    if (!wasReady && cond.isMet) {
      newlyReadyItems.push(updatedItem);
    }

    return updatedItem;
  });

  return { updatedInventory, newlyReadyItems };
}

/**
 * Purifies and awakens a cursed/relic item into its Awakened Mythic Form.
 */
export function awakenRelicItem<T extends StoryRelicItem>(
  item: T,
  newImageUrl?: string
): {
  awakenedItem: T;
  statBonuses: RelicAwakenedForm["statBonuses"];
  unlockedSkill: AbilityDetail;
} {
  const prepared = ensureRelicUnsealingCondition(item);
  const form = prepared.awakenedForm!;

  const awakenedItem: T = {
    ...prepared,
    name: form.awakenedName,
    rarity: "relic",
    description: form.awakenedDescription,
    effect: form.awakenedEffect,
    imageUrl: newImageUrl || prepared.imageUrl,
    isAwakened: true,
    cursedEffect: undefined,
    unsealingCondition: prepared.unsealingCondition
      ? {
          ...prepared.unsealingCondition,
          currentValue: prepared.unsealingCondition.targetValue,
          isMet: true,
        }
      : undefined,
  };

  return {
    awakenedItem,
    statBonuses: form.statBonuses || { str: 4, dex: 4, int: 4, maxHp: 25, maxMp: 15 },
    unlockedSkill: form.signatureSkill,
  };
}

