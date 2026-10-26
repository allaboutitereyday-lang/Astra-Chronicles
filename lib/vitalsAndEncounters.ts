/**
 * Protagonist Vitals Awareness, Narrative Damage Synchronization &
 * Hostile Story Encounter Escalation Engine for Astra Chronicles
 */

import { PlayerStats, ActiveStoryClashState, EnemyCombatIntent } from "@/types/story";
import { QuestDifficulty } from "@/types/system";
import { generateProceduralMonsterSvg } from "./proceduralArt";

export interface VitalsConditionEvaluation {
  hp: number;
  maxHp: number;
  hpPercent: number;
  hpTier: "unscathed" | "grazed" | "bloodied" | "critical" | "collapsing";
  hpTierLabel: string;
  mp: number;
  maxMp: number;
  mpPercent: number;
  mpTier: "resonant" | "channeling" | "strained" | "depleted";
  mpTierLabel: string;
  summaryLine: string;
  directiveBlock: string;
}

/**
 * Evaluates the protagonist's current HP and MP pools and generates both a concise
 * state readout and a detailed LLM directive so companions naturally comment on
 * the player's wounds, exhaustion, or mana strain in conversation.
 */
export function evaluatePlayerVitalsCondition(
  stats?: Partial<PlayerStats> | null,
  playerName: string = "Protagonist"
): VitalsConditionEvaluation {
  const maxHp = Math.max(1, stats?.maxHp ?? 100);
  const hp = Math.max(0, Math.min(maxHp, stats?.hp ?? maxHp));
  const hpPercent = Math.round((hp / maxHp) * 100);

  const maxMp = Math.max(1, stats?.maxMp ?? 60);
  const mp = Math.max(0, Math.min(maxMp, stats?.mp ?? maxMp));
  const mpPercent = Math.round((mp / maxMp) * 100);

  let hpTier: VitalsConditionEvaluation["hpTier"] = "unscathed";
  let hpTierLabel = "Unscathed & Combat-Ready";
  let hpNarrativeCue = `${playerName} is physically unscathed (${hp}/${maxHp} HP).`;

  if (hpPercent <= 20) {
    hpTier = "collapsing";
    hpTierLabel = "Critical / Near Collapse";
    hpNarrativeCue = `CRITICAL PHYSICAL TRAUMA (${hp}/${maxHp} HP, ${hpPercent}%): ${playerName} is gravely wounded, bleeding heavily, and struggling to stay upright. Companions MUST react with immediate urgency, alarm, or protective intervention in their dialogue and body language.`;
  } else if (hpPercent <= 45) {
    hpTier = "critical";
    hpTierLabel = "Severely Wounded & Bleeding";
    hpNarrativeCue = `SEVERELY WOUNDED (${hp}/${maxHp} HP, ${hpPercent}%): ${playerName} bears visible lacerations, battered armor, and labored breathing. Companions MUST acknowledge these injuries in the conversation (e.g., commenting on the blood, offering support, or questioning if ${playerName} can keep fighting).`;
  } else if (hpPercent <= 75) {
    hpTier = "bloodied";
    hpTierLabel = "Bloodied & Bruised";
    hpNarrativeCue = `BLOODIED / BRUISED (${hp}/${maxHp} HP, ${hpPercent}%): ${playerName} shows fresh scrapes, singed gear, or a slight wince from recent impacts. Companions should naturally notice or remark on ${playerName}'s wear and tear in context.`;
  } else if (hpPercent < 100) {
    hpTier = "grazed";
    hpTierLabel = "Lightly Grazed";
    hpNarrativeCue = `LIGHTLY GRAZED (${hp}/${maxHp} HP, ${hpPercent}%): ${playerName} has minor superficial scratches or dust from recent exertion, though still in strong fighting shape.`;
  }

  let mpTier: VitalsConditionEvaluation["mpTier"] = "resonant";
  let mpTierLabel = "Resonant & Full";
  let mpNarrativeCue = `Arcane/Mana reserves are steady (${mp}/${maxMp} MP).`;

  if (mpPercent <= 15) {
    mpTier = "depleted";
    mpTierLabel = "Arcane Exhaustion";
    mpNarrativeCue = `MANA DEPLETED (${mp}/${maxMp} MP, ${mpPercent}%): ${playerName}'s arcane channels are nearly burned out, causing aether fatigue or trembling focus. Companions with magical sensitivity should comment on ${playerName}'s dimmed aura.`;
  } else if (mpPercent <= 40) {
    mpTier = "strained";
    mpTierLabel = "Mana-Strained";
    mpNarrativeCue = `MANA STRAINED (${mp}/${maxMp} MP, ${mpPercent}%): ${playerName}'s mana pool is running low after heavy channeling; companions may note the flickering aura or advise conserving energy.`;
  } else if (mpPercent < 75) {
    mpTier = "channeling";
    mpTierLabel = "Moderate Reserves";
    mpNarrativeCue = `Mana reserves are moderately active (${mp}/${maxMp} MP, ${mpPercent}%).`;
  }

  const summaryLine = `HP: ${hp}/${maxHp} (${hpPercent}% - ${hpTierLabel}) | MP: ${mp}/${maxMp} (${mpPercent}% - ${mpTierLabel})`;

  const directiveBlock = `--- PROTAGONIST VITALS, DAMAGE & HOSTILE ENCOUNTER DIRECTIVE ---
1. LIVE VITALS AWARENESS IN CONVERSATION:
   - Current Vitals: ${summaryLine}
   - Physical Condition Context: ${hpNarrativeCue}
   - Mana / Aura Context: ${mpNarrativeCue}
   - MANDATORY CONVERSATIONAL INTEGRATION: Whenever ${playerName} has taken damage (HP < 85%) or is low on mana (MP < 45%), OR when ${playerName} suffers a new wound/drain on this turn, the active companion or narrator MUST naturally weave awareness of ${playerName}'s physical condition or mana state into their spoken dialogue and physical interactions (e.g., glancing at a bleeding pauldron, steadying ${playerName}, teasing their recklessness, or warning them about their depleted reserves).
2. ACCURATE STORY DAMAGE & RESOURCE SYNCHRONIZATION ("player_progression"):
   - Whenever ${playerName} takes damage from ANY source in the story (an enemy strike, ambush, trap, environmental hazard, dark essence burn, or recoil), you MUST set a negative integer in "player_progression.hp_change":
     * Minor graze, slap, thorn, or smoldering touch: -4 to -8
     * Solid weapon slash, hound bite, spell blast, or trap impact: -10 to -18
     * Crushing blow, lethal ambush, or catastrophic hazard: -20 to -32
   - Whenever ${playerName} is healed, bandaged, drinks a potion, or rests, set a positive integer in "player_progression.hp_change" (+12 to +30).
   - Whenever ${playerName} casts a spell, invokes an arcane ability, or channels heavy mana in the story, set a negative integer in "player_progression.mp_change" (-8 to -20). If recovering mana, set +8 to +20.
   - Populate "player_progression.vitals_reason" with a short 2-5 word cause whenever hp_change or mp_change is non-zero (e.g., "Inquisition Hound Bite", "Smoldering Dark Essence", "Crimson Elixir Restored").
3. HOSTILE STORY ENCOUNTER ESCALATION ("state_updates.story_clash"):
   - ONLY when the narrative escalates into an active, immediate hostile combat confrontation (e.g., monsters/hounds lunging to attack, an assassin springing an ambush, or a hostile adversary drawing weapons to fight right now), trigger the tactical Combat UI by populating "state_updates.story_clash":
     {
       "isActive": true,
       "enemyName": "Specific Name of the Hostile Adversary or Pack",
       "enemyHp": 80,
       "enemyMaxHp": 80,
       "enemyDesc": "1-sentence atmospheric description of the enemy and its fighting style.",
       "enemyVisualPrompt": "Detailed visual description of the enemy's appearance, armor/fur/scales, weapons, glowing runes, and setting for AI portrait generation.",
       "threatRank": "C",
       "enemyArchetype": "Beast Pack | Inquisition Enforcer | Arcane Construct | Rift Anomaly | Assassin",
       "enemyAttackPower": 16,
       "tacticalObjective": "Short tactical goal for this combat encounter."
     }
   - Do NOT populate "story_clash" during peaceful conversations, tense verbal banter where no battle has started, or after an enemy has already been defeated.`;

  return {
    hp,
    maxHp,
    hpPercent,
    hpTier,
    hpTierLabel,
    mp,
    maxMp,
    mpPercent,
    mpTier,
    mpTierLabel,
    summaryLine,
    directiveBlock,
  };
}

export interface InferredVitalsDelta {
  hpChange: number;
  mpChange: number;
  vitalsReason: string | null;
  wasInferredFallback: boolean;
}

/**
 * Deterministic fallback evaluator:
 * If the LLM narrates the player taking damage, getting burned/wounded, healing,
 * or expending mana in prose while leaving `hp_change` / `mp_change` at 0,
 * calculates a calibrated delta and descriptive reason.
 */
export function inferFallbackVitalsDelta(params: {
  storyText: string;
  actionText: string;
  reportedHpChange?: number;
  reportedMpChange?: number;
  reportedReason?: string | null;
  isClashTurn?: boolean;
}): InferredVitalsDelta {
  const {
    storyText = "",
    actionText = "",
    reportedHpChange = 0,
    reportedMpChange = 0,
    reportedReason = null,
    isClashTurn = false,
  } = params;

  let hpChange = typeof reportedHpChange === "number" && !isNaN(reportedHpChange) ? Math.round(reportedHpChange) : 0;
  let mpChange = typeof reportedMpChange === "number" && !isNaN(reportedMpChange) ? Math.round(reportedMpChange) : 0;
  let vitalsReason: string | null = reportedReason ? String(reportedReason).trim() : null;
  let wasInferredFallback = false;

  // During an active SectorClash turn, combat math is already applied deterministically by resolveClashTurn
  if (isClashTurn) {
    return { hpChange: 0, mpChange: 0, vitalsReason: null, wasInferredFallback: false };
  }

  const prose = storyText.toLowerCase();
  const act = actionText.toLowerCase();

  // 1. Check if LLM forgot to set hp_change despite narrating protagonist damage or healing
  if (hpChange === 0 && prose.length > 15) {
    // Severe damage patterns
    const severeDamageMatch = prose.match(
      /\b(impale[sd]?|shatter(?:s|ed)? your (?:ribs|guard|shield)|blood (?:spurts|erupts|gushes) from your|slam(?:s|med)? you into the (?:wall|stone|ground)|pierce[sd]? your (?:shoulder|chest|side|flesh)|crushing blow to your|cough(?:s|ing)? up blood|searing agony tears through you)\b/i
    );
    // Moderate damage patterns
    const moderateDamageMatch = prose.match(
      /\b(slash(?:es|ed)? across your|claws? (?:rake|tear|dig) into your|bite[sd]? into your|bolt (?:strikes|grazes|ears) your|blade (?:cuts|bites|slices) into your|burn(?:s|ed|ing)? your (?:skin|flesh|palm|arm|shoulder)|draws blood from your|crimson line across your|stagger(?:s|ed)? back in pain|wince[sd]? as the (?:impact|strike|heat|hex|shockwave))\b/i
    );
    // Light graze / smoldering / environmental damage patterns
    const lightDamageMatch = prose.match(
      /\b(graze[sd]? your (?:cheek|arm|shoulder|pauldron)|singed your|smolder(?:s|ing)? (?:of dark essence|against your)|thorns? scratch|bruise[sd]? your|sharp sting of|shockwave knocks you)\b/i
    );
    // Healing / restoration patterns
    const healMatch = prose.match(
      /\b(wounds? (?:knit|close|mend|heal)|vitality (?:surges|flows|restores)|drink(?:s|ing)? the (?:elixir|potion|draught)|warmth mends your (?:flesh|bruises|injuries)|bandage[sd]? your wounds)\b/i
    );

    if (severeDamageMatch) {
      hpChange = -18;
      vitalsReason = "Severe Narrative Trauma";
      wasInferredFallback = true;
    } else if (moderateDamageMatch) {
      hpChange = -11;
      vitalsReason = "Hostile Strike / Hazard";
      wasInferredFallback = true;
    } else if (lightDamageMatch) {
      hpChange = -5;
      vitalsReason = "Grazing Impact / Scorch";
      wasInferredFallback = true;
    } else if (healMatch) {
      hpChange = 15;
      vitalsReason = "Vitality Restoration";
      wasInferredFallback = true;
    }
  }

  // 2. Check if LLM forgot to set mp_change when player casts a spell / arcane technique
  if (mpChange === 0) {
    const arcaneCastMatch =
      act.match(/\b(\[arcana|cast|channel|invoke|unleash.*(?:mana|spell|rune|rift|hex|aether))\b/i) ||
      prose.match(/\b(your mana (?:drains|surges|burns)|channel(?:s|ing)? arcane energy|weave(?:s|d)? a spell|aether (?:depletes|radiates from your palms))\b/i);

    const manaRestoreMatch = prose.match(
      /\b(mana (?:replenishes|restores|flows back)|arcane reserves? recover|aetherial clarity returns)\b/i
    );

    if (manaRestoreMatch) {
      mpChange = 12;
      if (!vitalsReason) vitalsReason = "Mana Resonance Recovery";
      wasInferredFallback = true;
    } else if (arcaneCastMatch) {
      mpChange = -10;
      if (!vitalsReason) vitalsReason = "Arcane Technique Channeling";
      wasInferredFallback = true;
    }
  }

  if (!vitalsReason && (hpChange !== 0 || mpChange !== 0)) {
    if (hpChange < 0) vitalsReason = "Story Combat / Hazard Damage";
    else if (hpChange > 0) vitalsReason = "Health Restored";
    else if (mpChange < 0) vitalsReason = "Mana Expended";
    else if (mpChange > 0) vitalsReason = "Mana Restored";
  }

  return {
    hpChange,
    mpChange,
    vitalsReason,
    wasInferredFallback,
  };
}

/**
 * Generates a telegraphed enemy combat intent for the next round so the player
 * can make tactical stance choices in the Random Encounter Combat UI.
 */
export function generateEnemyIntent(
  enemyName: string,
  baseAttackPower: number = 16,
  turnNumber: number = 1,
  threatRank: QuestDifficulty = "C"
): EnemyCombatIntent {
  const rankMult =
    threatRank === "S" || threatRank === "Calamity"
      ? 1.35
      : threatRank === "A"
      ? 1.2
      : threatRank === "B"
      ? 1.1
      : 1.0;

  const cycle = turnNumber % 4;

  if (cycle === 2) {
    const dmg = Math.round(baseAttackPower * 1.4 * rankMult);
    return {
      label: `Crushing Execution`,
      estimatedDamage: dmg,
      type: "heavy",
      counterStanceHint: "Counter with Defensive Stance (-40% DMG) or Stagger Stance (Stun)",
    };
  }
  if (cycle === 3) {
    const dmg = Math.round(baseAttackPower * 1.25 * rankMult);
    return {
      label: `Aether Piercer / Hex Barrage`,
      estimatedDamage: dmg,
      type: "arcane",
      counterStanceHint: "Counter with Evasion Stance (35% Evade) or Aggressive Burst",
    };
  }
  if (cycle === 0) {
    const dmg = Math.round(baseAttackPower * 0.9 * rankMult);
    return {
      label: `Predatory Feint & Sunder`,
      estimatedDamage: dmg,
      type: "debuff",
      counterStanceHint: "Counter with Lethality Stance (45% Crit) to punish opening",
    };
  }

  const dmg = Math.round(baseAttackPower * rankMult);
  return {
    label: `Vicious Lunge`,
    estimatedDamage: dmg,
    type: "strike",
    counterStanceHint: "Counter with Offensive Stance (+30% ATK) or Balanced Flow",
  };
}

/**
 * Resolves and normalizes a hostile story encounter ONLY when the LLM escalates
 * a hostile story moment (either via `llmStoryClash` in JSON or unmistakable
 * immediate combat eruption in the narrative).
 */
export function resolveHostileEncounterEscalation(params: {
  llmStoryClash: any;
  existingClash?: ActiveStoryClashState | null;
  storyText: string;
  actionText: string;
  location: string;
  genre?: string;
  assistingCompanionName?: string;
}): ActiveStoryClashState | null {
  const {
    llmStoryClash,
    existingClash,
    storyText = "",
    actionText = "",
    location = "Uncharted Sector",
    genre = "Dark Fantasy LitRPG",
    assistingCompanionName,
  } = params;

  // If an encounter is already active, keep it managed by the clash engine
  if (existingClash && existingClash.isActive) {
    return existingClash;
  }

  // Case 1: The LLM explicitly populated `state_updates.story_clash` with `isActive: true`
  if (
    llmStoryClash &&
    typeof llmStoryClash === "object" &&
    llmStoryClash.isActive === true &&
    typeof llmStoryClash.enemyName === "string" &&
    llmStoryClash.enemyName.trim().length > 0
  ) {
    // Anti-False-Positive Guard: If the player action was explicitly non-combat (stealth, diplomacy,
    // dialogue, observation, investigation) and no physical attacks, charges, or injuries occurred in
    // the narrative, do NOT lock the player into combat simply because an enemy is nearby or spotted.
    const nonCombatActionRegex = /\[(Subterfuge|Stealth|Diplomacy|Inquire|Observe|Dialogue|Explore|Flee|Perception|Insight|Camp)/i;
    const isExplicitlyNonCombatAction = nonCombatActionRegex.test(actionText || "");
    const hasActiveViolentClashInProse = /\b(lunges?|strikes?|slashes?|swings?|casts?|detonates?|punches?|shoots?|fires?|charges? at|attacks?|inflicts?|bleeding|wound|stagger|parr(?:y|ies|ied)|dodges?|deflects?|teeth|claws|fangs)\b/i.test(storyText || "");

    if (isExplicitlyNonCombatAction && !hasActiveViolentClashInProse) {
      return null;
    }

    const eName = llmStoryClash.enemyName.trim();
    const maxHp = Math.max(40, Number(llmStoryClash.enemyMaxHp || llmStoryClash.enemyHp) || 85);
    const hp = Math.max(1, Math.min(maxHp, Number(llmStoryClash.enemyHp) || maxHp));
    const atk = Math.max(10, Number(llmStoryClash.enemyAttackPower) || 16);
    const rank: QuestDifficulty = ["E", "D", "C", "B", "A", "S", "Calamity"].includes(
      llmStoryClash.threatRank
    )
      ? llmStoryClash.threatRank
      : maxHp >= 130
      ? "A"
      : maxHp >= 95
      ? "B"
      : "C";

    const eDesc =
      llmStoryClash.enemyDesc ||
      `A hostile adversary intercepting you in ${location}.`;
    const eVisualPrompt =
      llmStoryClash.enemyVisualPrompt ||
      `Epic anime visual novel boss monster portrait: "${eName}". ${eDesc}. Encountered in ${location}. Menacing combat stance, dark glowing runes, volumetric lighting, ${genre} concept art, 16:9 widescreen.`;

    const fallbackSvg = generateProceduralMonsterSvg({
      name: eName,
      rank,
      genre,
      modifier: llmStoryClash.enemyArchetype || "Hostile Escalation",
    });

    return {
      isActive: true,
      enemyName: eName,
      enemyHp: hp,
      enemyMaxHp: maxHp,
      enemyDesc: eDesc,
      enemyAttackPower: atk,
      enemyImageUrl: llmStoryClash.enemyImageUrl || fallbackSvg,
      enemyVisualPrompt: eVisualPrompt,
      threatRank: rank,
      enemyArchetype: llmStoryClash.enemyArchetype || "Hostile Adversary",
      enemyIntent: generateEnemyIntent(eName, atk, 1, rank),
      isRandomEncounter: true,
      clashTurn: 1,
      maxClashTurns: Number(llmStoryClash.maxClashTurns) || 6,
      tacticalObjective:
        llmStoryClash.tacticalObjective ||
        `Defeat ${eName} in ${location} before your defenses are overwhelmed.`,
      status: "ongoing",
      companionAssistingName:
        llmStoryClash.companionAssistingName || assistingCompanionName,
      log: [
        `[HOSTILE ENCOUNTER ESCALATED]: ${eName} (Rank ${rank} • ${hp}/${maxHp} HP) engages in ${location}!`,
      ],
    };
  }

  // Case 2: Fallback escalation detector ONLY if the LLM explicitly narrated an immediate
  // lethal ambush / monster lunge erupting at the end of the turn without setting the JSON flag.
  const explicitCombatEruption = storyText.match(
    /\b(lunges? at you with (?:bared fangs|drawn blades|claws)|ambush(?:es|ed)? you from the shadows|inquisition(?:'s)? hounds? (?:leap|snarl and lunge|charge) straight at|pack of .*? lunges? to tear|draws? a (?:corrupted|bloodied|runic) blade and charges? at you|initiative is forced as .*? attacks!)\b/i
  );

  if (explicitCombatEruption) {
    const lower = storyText.toLowerCase();
    let inferredName = "Ambushing Adversary";
    let inferredArchetype = "Hostile Ambush";
    let inferredDesc = `A lethal threat that lunged from the shadows of ${location}.`;

    if (lower.includes("hound")) {
      inferredName = "Inquisition Hound-Pack";
      inferredArchetype = "Beast Pack";
      inferredDesc = "Armor-plated hunting beasts wreathed in smoldering inquisitorial runes, bred to tear through warded steel.";
    } else if (lower.includes("sentinel") || lower.includes("construct") || lower.includes("golem")) {
      inferredName = "Runic Breach Sentinel";
      inferredArchetype = "Arcane Construct";
      inferredDesc = "An ancient stone-and-aether automaton awakened by unauthorized presence in the sector.";
    } else if (lower.includes("assassin") || lower.includes("stalker") || lower.includes("shade") || lower.includes("wraith")) {
      inferredName = "Umbral Rift-Stalker";
      inferredArchetype = "Void Assassin";
      inferredDesc = "A phase-shifting predator condensed from fractured aether and malice.";
    }

    const rank: QuestDifficulty = "B";
    const fallbackSvg = generateProceduralMonsterSvg({
      name: inferredName,
      rank,
      genre,
      modifier: inferredArchetype,
    });

    return {
      isActive: true,
      enemyName: inferredName,
      enemyHp: 85,
      enemyMaxHp: 85,
      enemyDesc: inferredDesc,
      enemyAttackPower: 16,
      enemyImageUrl: fallbackSvg,
      enemyVisualPrompt: `Epic anime visual novel monster portrait of "${inferredName}". ${inferredDesc}. Set in ${location}, dramatic combat lighting, glowing runes, ${genre} masterpiece.`,
      threatRank: rank,
      enemyArchetype: inferredArchetype,
      enemyIntent: generateEnemyIntent(inferredName, 16, 1, rank),
      isRandomEncounter: true,
      clashTurn: 1,
      maxClashTurns: 6,
      tacticalObjective: `Break the ${inferredName}'s offensive before they overwhelm your perimeter.`,
      status: "ongoing",
      companionAssistingName: assistingCompanionName,
      log: [
        `[HOSTILE ENCOUNTER ESCALATED]: ${inferredName} (Rank ${rank} • 85/85 HP) springs a lethal attack in ${location}!`,
      ],
    };
  }

  return null;
}

