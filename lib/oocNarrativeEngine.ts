/**
 * OOC.ai-Grade Two-Pass Narrative & Autonomous Character Performance Engine
 *
 * Solves the root causes of robotic / padded RPG LLM writing:
 * 1. Decouples Creative Prose Generation (Pass 1 — Pure Unescaped Plain Text on Claude Sonnet 4.6 / DeepSeek V3.2 / Euryale)
 *    from Structured LitRPG State & Choice Extraction (Pass 2 — Fast JSON-mode Gemini 2.5 Flash).
 * 2. Eliminates `[COMPLETED PRIOR TURN...]` log pollution and mid-sentence slicing, feeding up to 16 clean,
 *    unmutilated `user` / `assistant` turns so prose rhythm compounds naturally.
 * 3. Prunes off-screen companions and irrelevant world rules (~60% smaller creative system prompt).
 * 4. Injects live Autonomous NPC Subtext Agendas (physical business, unspoken wants, independent friction)
 *    so characters act like living people rather than sycophantic Q&A bots.
 * 5. Supports inline `(OOC: ...)` / `[OOC: ...]` stage directions + persistent Director Notes.
 */

import {
  getNarrationProseDirective,
  NarrativeDepthMode,
  UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE,
} from "@/lib/narrationStyles";
import {
  buildActiveSpeakerPersonaLock,
  getCompanionPersonaFingerprint,
} from "@/lib/characterPersonas";
import { parseModelJsonLenient } from "@/lib/jsonSalvage";
import { LabyrinthState } from "@/types/starfall_labyrinth";

export interface ParsedOocInput {
  inCharacterAction: string;
  inlineOocDirective: string | null;
  combinedDirectorNotes: string | null;
  isPureOocNote: boolean;
}

/**
 * Extracts inline `(OOC: ...)` or `[OOC: ...]` stage directions from player input
 * and merges them with any persistent Director Notes from the UI drawer.
 */
export function parseOocInput(
  rawAction: string,
  persistentDirectorNotes?: string | null
): ParsedOocInput {
  const raw = String(rawAction || "").trim();
  const extractedNotes: string[] = [];

  if (persistentDirectorNotes && persistentDirectorNotes.trim()) {
    extractedNotes.push(persistentDirectorNotes.trim());
  }

  // Match `(OOC: ...)` or `[OOC: ...]` or `// OOC: ...`
  let stripped = raw
    .replace(/\(\s*OOC\s*:\s*([^)]+)\)/gi, (_m, inner) => {
      if (inner && inner.trim()) extractedNotes.push(inner.trim());
      return "";
    })
    .replace(/\[\s*OOC\s*:\s*([^\]]+)\]/gi, (_m, inner) => {
      if (inner && inner.trim()) extractedNotes.push(inner.trim());
      return "";
    })
    .trim();

  // Also support messages starting with `OOC:` directly
  if (/^OOC\s*:/i.test(stripped)) {
    const body = stripped.replace(/^OOC\s*:\s*/i, "").trim();
    if (body) extractedNotes.push(body);
    stripped = "";
  }

  const inlineOnly = extractedNotes
    .filter((n) => n !== persistentDirectorNotes?.trim())
    .join(" | ");

  const isPureOocNote = stripped.length === 0 && extractedNotes.length > 0;
  const inCharacterAction = isPureOocNote
    ? "[Continue the current scene following the OOC Director Note]"
    : stripped || raw;

  return {
    inCharacterAction,
    inlineOocDirective: inlineOnly || null,
    combinedDirectorNotes:
      extractedNotes.length > 0 ? extractedNotes.join("\n- ") : null,
    isPureOocNote,
  };
}

/**
 * Builds clean, unmutilated `user` / `assistant` turn history (up to 16 turns)
 * WITHOUT meta-log headers (`[COMPLETED PRIOR TURN...]`) or mid-sentence `...` truncation.
 */
export function buildCleanConversationHistory(
  recentHistory: { speaker: string; text: string }[] | undefined | null,
  playerName: string,
  maxTurns: number = 16
): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(recentHistory) || recentHistory.length === 0) {
    return [];
  }

  const cleanPlayer = (playerName || "Wanderer").trim().toLowerCase();
  const sliced = recentHistory.slice(-maxTurns);
  const out: { role: "user" | "assistant"; content: string }[] = [];

  for (const item of sliced) {
    const rawText = String(item?.text || "").trim();
    if (!rawText) continue;
    // Strip any legacy meta wrappers if present in old saves
    const cleaned = rawText
      .replace(/^\[COMPLETED PRIOR TURN[^\]]*\]:?\s*/i, "")
      .trim();
    if (!cleaned) continue;

    const speakerLower = String(item?.speaker || "").trim().toLowerCase();
    const role: "user" | "assistant" =
      speakerLower === cleanPlayer || speakerLower === "player" || speakerLower === "you"
        ? "user"
        : "assistant";

    // Merge consecutive messages of the same role so strict alternating APIs (Anthropic/DeepSeek) never complain
    if (out.length > 0 && out[out.length - 1].role === role) {
      out[out.length - 1].content += `\n\n${cleaned}`;
    } else {
      out.push({ role, content: cleaned });
    }
  }

  // Ensure history starts with `user` or if it starts with `assistant` (e.g. prologue), keep it valid
  return out;
}

/**
 * Generates live, autonomous NPC subtext agendas for ONLY the characters physically in the room.
 * Prevents companions from acting like passive interview bots waiting to praise the player.
 */
export function buildAutonomousSceneSubtext(params: {
  presentCompanions: any[];
  activeSpeakerName: string;
  location: string;
  labyrinthState?: LabyrinthState | null;
  turnNumber?: number;
}): string {
  const { presentCompanions, activeSpeakerName, location, labyrinthState, turnNumber = 1 } =
    params;
  if (!presentCompanions || presentCompanions.length === 0) {
    return `--- SOLITUDE SCENE LOCK ---
No companions are physically present in ${location}. Focus strictly on tactile atmosphere, environmental tension, and the protagonist's immediate physical reality.`;
  }

  const lines = presentCompanions.map((comp, idx) => {
    const fp = getCompanionPersonaFingerprint(comp);
    const affection = typeof comp?.affection === "number" ? comp.affection : 15;
    const rosterEntry = labyrinthState?.roster?.find(
      (r) => r.heroineName.toLowerCase() === String(comp?.name || "").toLowerCase()
    );
    const isWounded = rosterEntry?.status === "WOUNDED";
    const negSwitch = Boolean(rosterEntry?.negativeSwitchActive);

    // Rotate subtle physical business seeds by turn number so props never repeat back-to-back!
    const physicalSeeds = [
      "checking sightlines, adjusting a strap or cuff, or interacting with something concrete in the room",
      "shifting weight off a sore step, rationing gear, or studying the protagonist's posture before answering",
      "doing something practical with her hands while speaking rather than standing like a statue",
    ];
    const physicalHabit = physicalSeeds[(turnNumber + idx) % physicalSeeds.length];

    let immediateAgenda =
      affection < 25
        ? "Guarded and testing whether the protagonist's competence is real or luck; gives nothing away for free."
        : affection < 55
        ? "Invested in keeping the unit alive and quietly curious about what drives the protagonist, though quick to push back on reckless calls."
        : "Deeply loyal and attuned to the protagonist's smallest tells, balancing sharp banter with unspoken protective closeness.";

    if (isWounded) {
      immediateAgenda =
        "Hiding pain from a critical dungeon wound (-30% vitality) so she won't be benched, breathing shallower while stubbornly holding her post.";
    } else if (negSwitch) {
      immediateAgenda =
        "Currently locked in Negative Switch overdrive—eerily calm, surgical, speaking in spare razor-sharp phrases while fighting to stay tethered to the protagonist's voice.";
    }

    const isPrimary =
      fp.name.toLowerCase() === String(activeSpeakerName || "").toLowerCase();

    return `${idx + 1}. ${fp.name} (${fp.archetype})${isPrimary ? " [PRIMARY SCENE FOCUS]" : " [IN ROOM]"} — Affection: ${affection}%
   - Autonomous Subtext & Agenda: ${immediateAgenda}
   - Live Physicality: Ground her speech in ${physicalHabit}. Never reuse the exact same prop gesture from the last message.`;
  });

  return `--- AUTONOMOUS CHARACTER SUBTEXT & LIVE SCENE BLOCKING (PRESENT CAST ONLY) ---
Off-screen characters are strictly absent and CANNOT speak or appear unless newly entering.
${lines.join("\n")}`;
}

/**
 * Resolves the Pass 1 creative model priority list for OpenRouter.
 */
export function resolveCreativeModelChain(requestedModel?: string): string[] {
  const m = String(requestedModel || "").trim();
  const defaults = [
    "anthropic/claude-sonnet-4.6",
    "deepseek/deepseek-v3.2",
    "sao10k/l3.1-euryale-70b",
    "google/gemini-2.5-flash",
  ];

  if (
    !m ||
    m === "orchestrated-hybrid" ||
    m === "ooc-two-pass-sonnet" ||
    m === "anthropic/claude-sonnet-4.6"
  ) {
    return defaults;
  }

  if (
    m === "orchestrated-hybrid-deepseek" ||
    m === "ooc-two-pass-deepseek" ||
    m === "deepseek/deepseek-v3.2"
  ) {
    return [
      "deepseek/deepseek-v3.2",
      "anthropic/claude-sonnet-4.6",
      "sao10k/l3.1-euryale-70b",
      "google/gemini-2.5-flash",
    ];
  }

  return [m, ...defaults.filter((d) => d !== m)];
}

/**
 * Checks whether the current request should execute the OOC.ai Two-Pass Creative + State Engine.
 * Enabled for all Cloud turns whenever OpenRouter API key is present!
 */
export function shouldUseOocTwoPassEngine(params: {
  isLocal: boolean;
  apiKey?: string;
  modelId?: string;
}): boolean {
  if (params.isLocal || !params.apiKey) return false;
  // Allow explicit single-pass override only if user specifically selects legacy flash-only fast mode
  if (params.modelId === "single-pass-flash") return false;
  return true;
}

export function extractOpenRouterErrorInfo(
  status: number,
  rawBody: string
): { detail: string; isAccountAuthError: boolean } {
  let detail = rawBody.slice(0, 160);
  try {
    const parsedErr = JSON.parse(rawBody);
    detail = parsedErr?.error?.message || parsedErr?.message || detail;
  } catch {}
  const isAccountAuthError =
    status === 401 ||
    status === 402 ||
    (status === 403 &&
      /key|credit|limit|quota|insufficient|unauthorized|forbidden/i.test(detail));
  return { detail, isAccountAuthError };
}

/**
 * Executes Pass 1 (Pure Unescaped Creative Prose) + Pass 2 (Fast Gemini 2.5 Flash Structured JSON Extractor).
 */
export async function executeOocTwoPassTurn(params: {
  apiKey: string;
  userKey: string;
  requestedModelId?: string;
  temperature: number;
  maxTokens: number;
  repetitionPenalty: number;
  narrativeDepth: NarrativeDepthMode;
  narrationTone: string;
  storyId?: string;
  storyTitle: string;
  settingName: string;
  location: string;
  timeOfDay?: string;
  playerProfile: any;
  presentCompanions: any[];
  activeSpeakerName: string;
  speakerAffection: number;
  speakerKnowsPlayerName: boolean;
  recentHistory: { speaker: string; text: string }[];
  rawAction: string;
  isCustomAction: boolean;
  persistentDirectorNotes?: string | null;
  pendingObjectives: string[];
  worldSpecificDirective?: string;
  combatTelemetryDirective?: string;
  specialEventDirective?: string;
  knowledgeGateDirective?: string;
  earnedRomanceDirective?: string;
  turnNumber: number;
}): Promise<{
  responseData: any;
  creativeModelUsed: string;
  usage: any;
  parsedOoc: ParsedOocInput;
}> {
  const parsedOoc = parseOocInput(
    params.rawAction,
    params.persistentDirectorNotes
  );

  const playerName = (params.playerProfile?.name || "Wanderer").trim();
  const playerFirstName = playerName.split(/\s+/)[0] || playerName;

  const proseStyleDirective = getNarrationProseDirective(
    params.narrationTone,
    params.narrativeDepth
  );

  const subtextBlock = buildAutonomousSceneSubtext({
    presentCompanions: params.presentCompanions,
    activeSpeakerName: params.activeSpeakerName,
    location: params.location,
    labyrinthState: params.playerProfile?.labyrinthState || null,
    turnNumber: params.turnNumber,
  });

  const speakerLock = buildActiveSpeakerPersonaLock(
    params.activeSpeakerName,
    params.speakerAffection,
    params.speakerKnowsPlayerName,
    playerName,
    params.playerProfile?.gender || "Male"
  );

  const directorBlock = parsedOoc.combinedDirectorNotes
    ? `\n================================================================================
[HIGH-PRIORITY OOC DIRECTOR STAGE NOTES — OBEY SEAMLESSLY WITHOUT BREAKING FOURTH WALL]
- ${parsedOoc.combinedDirectorNotes}
(Never mention "OOC" or "Director Notes" in the story prose—simply steer the scene, tone, and character choices to fulfill this direction naturally.)
================================================================================`
    : "";

  const conditionalWorldBlocks = [
    params.worldSpecificDirective,
    params.combatTelemetryDirective,
    params.specialEventDirective,
    params.knowledgeGateDirective,
    params.earnedRomanceDirective,
  ]
    .filter((b) => Boolean(b && b.trim()))
    .join("\n\n");

  // =========================================================================
  // PASS 1 SYSTEM PROMPT: LEAN, PURE NOVELIST & CHARACTER ACTOR (ZERO JSON!)
  // =========================================================================
  const pass1SystemPrompt = `You are an elite interactive novelist and character actor running "${params.storyTitle}" (${params.settingName}).
Write with the effortless human immediacy, psychological subtext, dry wit, and grounded physical presence of top-tier roleplay fiction—NEVER like an AI game-master summarizing a checklist.

--- ACTIVE SCENE GROUNDING ---
- Location: ${params.location}${params.timeOfDay ? ` (${params.timeOfDay})` : ""}
- Protagonist: ${playerName} (${params.playerProfile?.gender || "Male"} ${params.playerProfile?.role || "Tactician"}, Lv.${params.playerProfile?.level || 1}${
    params.playerProfile?.personalityTraits?.length
      ? `, Vibe: ${params.playerProfile.personalityTraits.join(", ")}`
      : ""
  })
${
  params.pendingObjectives.length > 0
    ? `- Active Thread: ${params.pendingObjectives.slice(0, 2).join(" | ")}`
    : ""
}

${proseStyleDirective}

${UNIVERSAL_IMMERSION_AND_GRAMMAR_DIRECTIVE}

${subtextBlock}

${conditionalWorldBlocks}

${speakerLock}
${directorBlock}

--- CRITICAL OUTPUT FORMAT (PLAIN UNESCAPED TEXT — DO NOT OUTPUT JSON!) ---
- Output ONLY pure story prose and spoken dialogue in standard double quotes ("...").
- NEVER output JSON braces, markdown code fences, asterisks (*), stat blocks, choice lists, or bracketed headers unless requested below.
- NEVER write spoken lines or unprompted decisions for ${playerFirstName} inside the world/NPC scene response!`;

  const cleanHistory = buildCleanConversationHistory(
    params.recentHistory,
    playerName,
    16
  );

  const pass1UserPrompt = params.isCustomAction
    ? `${playerFirstName}'s action / dialogue:\n${parsedOoc.inCharacterAction}\n\nWrite the immediate, lived-in scene consequence and character reaction directly in plain prose (no headers, no JSON, no protagonist puppeteering).`
    : `${playerFirstName} commits to this choice vector: "${parsedOoc.inCharacterAction}"

Output your plain-text response in EXACTLY two sections separated by "=== SCENE RESPONSE ===":
=== PROTAGONIST BEAT ===
(1 to 2 crisp paragraphs in past tense depicting ${playerFirstName} physically executing that move and speaking a natural in-character line in double quotes—strip any bracket tags.)

=== SCENE RESPONSE ===
(The vivid world & character reaction to ${playerFirstName}'s move—elastic pacing, real subtext, natural human dialogue in double quotes, zero JSON or choice lists.)`;

  const pass1Messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: pass1SystemPrompt },
    ...cleanHistory,
    { role: "user", content: pass1UserPrompt },
  ];

  const creativeChain = resolveCreativeModelChain(params.requestedModelId);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://astra-chronicles.local",
    "X-Title": "Astra Chronicles",
  };

  let rawCreativeText = "";
  let creativeModelUsed = creativeChain[0];
  let combinedUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let lastPass1Err: Error | null = null;

  for (let i = 0; i < creativeChain.length; i++) {
    const candidateModel = creativeChain[i];
    const isAnthropic =
      candidateModel.startsWith("anthropic/") || candidateModel.includes("claude");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(i === 0 ? 42000 : 25000),
        body: JSON.stringify({
          model: candidateModel,
          messages: pass1Messages,
          user: params.userKey,
          temperature: Math.max(0.55, Math.min(1.05, params.temperature)),
          max_tokens: Math.min(2200, params.maxTokens),
          ...(isAnthropic ? {} : { repetition_penalty: params.repetitionPenalty }),
          provider: { allow_fallbacks: true, sort: "throughput" },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const { detail, isAccountAuthError } = extractOpenRouterErrorInfo(
          res.status,
          errBody
        );
        if (isAccountAuthError) {
          lastPass1Err = new Error(`OpenRouter API (${res.status}): ${detail}`);
          break;
        }
        lastPass1Err = new Error(
          `Pass 1 (${candidateModel}) HTTP ${res.status}: ${detail}`
        );
        continue;
      }

      const data = await res.json();
      const text = String(data?.choices?.[0]?.message?.content || "").trim();
      if (text.length < 40) {
        lastPass1Err = new Error(`Pass 1 (${candidateModel}) returned stub text (${text.length} chars)`);
        continue;
      }

      rawCreativeText = text;
      creativeModelUsed = candidateModel;
      if (data?.usage) {
        combinedUsage.prompt_tokens += data.usage.prompt_tokens || 0;
        combinedUsage.completion_tokens += data.usage.completion_tokens || 0;
        combinedUsage.total_tokens += data.usage.total_tokens || 0;
      }
      break;
    } catch (err: any) {
      lastPass1Err = err;
    }
  }

  if (!rawCreativeText) {
    throw lastPass1Err || new Error("OOC Pass 1 creative prose models failed.");
  }

  // Split Pass 1 output into player_execution (if preset choice) and narrative_text
  let extractedPlayerExecution: string | null = null;
  let extractedNarrativeProse = rawCreativeText;

  if (rawCreativeText.includes("=== SCENE RESPONSE ===")) {
    const parts = rawCreativeText.split(/===\s*SCENE RESPONSE\s*===/i);
    const beatPart = (parts[0] || "")
      .replace(/===\s*PROTAGONIST BEAT\s*===/gi, "")
      .trim();
    const scenePart = (parts[1] || "").trim();
    if (beatPart.length >= 20) {
      extractedPlayerExecution = beatPart;
    }
    if (scenePart.length >= 25) {
      extractedNarrativeProse = scenePart;
    }
  } else {
    extractedNarrativeProse = rawCreativeText
      .replace(/===\s*PROTAGONIST BEAT\s*===/gi, "")
      .trim();
  }

  // =========================================================================
  // PASS 2: FAST DETERMINISTIC STATE & CHOICE EXTRACTOR (GEMINI 2.5 FLASH JSON)
  // =========================================================================
  const isStarfall = params.storyId === "starfall-labyrinth";
  const presentNamesList = params.presentCompanions.map((c) => c.name);
  const allKnownCompanionNames = presentNamesList.length > 0 ? presentNamesList.join(", ") : "None (Solo)";

  const pass2SystemPrompt = `You are a deterministic RPG State & Choice Extractor. Read the newly authored scene turn and output ONLY a valid JSON object tracking speaker, expressions, affection shift, location, and 4 sharp in-character next choices for ${playerFirstName}.

RULES:
1. "speaker": Must be the primary companion speaking in SCENE PROSE (from [${allKnownCompanionNames}]), or "Narrator" if nobody else spoke. NEVER set "speaker" to "${playerName}".
2. "expression_key": One of "neutral" | "intrigued" | "flustered" | "smug" | "combat_ready" | "hurt" matching the speaker's closing mood.
3. "affection_delta": Integer from -5 to +4 (0 for routine tactical chat, +1 to +3 only when genuinely earned by cleverness, protection, or emotional resonance, negative if reckless/cold).
4. "suggested_choices": Array of EXACTLY 4 concise, punchy first-person/action choice strings (12–24 words each) prefixed with an intent tag:
   - Choice 1: "[Advance]: ..." (push the immediate objective/fight/deal forward)
   - Choice 2: "[Banter]: ..." or "[Deepen]: ..." (probe subtext, tease, or share a real human moment with the speaker)
   - Choice 3: "[Tactical]: ..." (bold environmental, observational, or signature skill play)
   - Choice 4: "[Move/Transition]: ..." (lead toward a new room/floor/area when ready)
${
  isStarfall
    ? `5. "starfall_updates": Include { "floor_cleared": boolean (true ONLY if the prose explicitly cleared the current dungeon floor and opened the way up), "hero_casualties": [], "star_shards_earned": 0, "master_trust_delta": number (-5..+5), "master_command": string | null }.`
    : ""
}

JSON SCHEMA:
{
  "speaker": "string",
  "expression_key": "neutral",
  "suggested_choices": ["string", "string", "string", "string"],
  "state_updates": {
    "current_location": "${params.location}",
    "present_companions": ${JSON.stringify(presentNamesList)},
    "affected_companion": ${presentNamesList[0] ? `"${presentNamesList[0]}"` : "null"},
    "affection_delta": 0,
    "companion_sentiment": "short 1-sentence internal thought of the speaker",
    "new_plot_memory": null,
    "completed_objectives": []
  },
  "player_progression": {
    "exp_gained": 0,
    "exp_reason": null,
    "hp_change": 0,
    "mp_change": 0,
    "vitals_reason": null,
    "items_dropped": null
  },
  "system_updates": {
    "plausibility_score": 92,
    "system_announcement": null,
    "new_quest": null
  }${
    isStarfall
      ? `,
  "starfall_updates": {
    "floor_cleared": false,
    "hero_casualties": [],
    "star_shards_earned": 0,
    "master_trust_delta": 0,
    "master_command": null
  }`
      : ""
  }
}`;

  const pass2UserContent = `CURRENT LOCATION: ${params.location}
PLAYER ACTION: ${parsedOoc.inCharacterAction}
${extractedPlayerExecution ? `PROTAGONIST EXECUTION:\n${extractedPlayerExecution}\n\n` : ""}SCENE PROSE:\n${extractedNarrativeProse}`;

  let extractedMeta: any = null;
  try {
    const pass2Res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(18000),
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: pass2SystemPrompt },
          { role: "user", content: pass2UserContent },
        ],
        user: params.userKey,
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
        provider: { allow_fallbacks: true, sort: "throughput" },
      }),
    });

    if (pass2Res.ok) {
      const p2Json = await pass2Res.json();
      if (p2Json?.usage) {
        combinedUsage.prompt_tokens += p2Json.usage.prompt_tokens || 0;
        combinedUsage.completion_tokens += p2Json.usage.completion_tokens || 0;
        combinedUsage.total_tokens += p2Json.usage.total_tokens || 0;
      }
      const p2Content = String(p2Json?.choices?.[0]?.message?.content || "");
      extractedMeta = parseModelJsonLenient(p2Content, params.activeSpeakerName);
    }
  } catch (p2Err: any) {
    console.warn("OOC Pass 2 metadata extractor fallback triggered:", p2Err?.message);
  }

  const safeMeta =
    extractedMeta && typeof extractedMeta === "object" && !Array.isArray(extractedMeta)
      ? extractedMeta
      : {};

  const mergedResponseData = {
    speaker: safeMeta.speaker || params.activeSpeakerName || "Narrator",
    expression_key: safeMeta.expression_key || "neutral",
    player_execution: extractedPlayerExecution,
    narrative_text: extractedNarrativeProse,
    narrative: extractedNarrativeProse,
    suggested_choices: Array.isArray(safeMeta.suggested_choices)
      ? safeMeta.suggested_choices
      : [],
    state_updates: {
      current_location:
        safeMeta.state_updates?.current_location || params.location,
      present_companions: Array.isArray(safeMeta.state_updates?.present_companions)
        ? safeMeta.state_updates.present_companions
        : presentNamesList,
      affected_companion:
        safeMeta.state_updates?.affected_companion ??
        (presentNamesList[0] || null),
      affection_delta: Number(safeMeta.state_updates?.affection_delta || 0),
      companion_sentiment: safeMeta.state_updates?.companion_sentiment || null,
      new_plot_memory: safeMeta.state_updates?.new_plot_memory || null,
      completed_objectives: Array.isArray(
        safeMeta.state_updates?.completed_objectives
      )
        ? safeMeta.state_updates.completed_objectives
        : [],
    },
    player_progression: safeMeta.player_progression || {
      exp_gained: 0,
      exp_reason: null,
      hp_change: 0,
      mp_change: 0,
      vitals_reason: null,
      items_dropped: null,
    },
    system_updates: safeMeta.system_updates || {
      plausibility_score: 92,
      system_announcement: null,
      new_quest: null,
    },
    ...(isStarfall && safeMeta.starfall_updates
      ? { starfall_updates: safeMeta.starfall_updates }
      : {}),
    _oocEngine: {
      twoPass: true,
      creativeModel: creativeModelUsed,
      stateModel: "google/gemini-2.5-flash",
      directorNotesApplied: Boolean(parsedOoc.combinedDirectorNotes),
    },
  };

  return {
    responseData: mergedResponseData,
    creativeModelUsed,
    usage: combinedUsage,
    parsedOoc,
  };
}
