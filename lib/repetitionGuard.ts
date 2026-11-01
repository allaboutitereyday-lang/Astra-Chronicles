/**
 * Narrative Anti-Repetition & Scene Progression Guard
 *
 * Prevents LLM attractor loops where the protagonist and companion repeat
 * identical dialogue, vows, or physical reassurance gestures across consecutive turns.
 */

export interface TurnHistoryEntry {
  speaker: string;
  text: string;
}

/**
 * Extracts quoted dialogue strings ("...") and key sentences from a text block.
 */
export function extractQuotesAndSentences(text: string): {
  quotes: string[];
  sentences: string[];
} {
  if (!text || typeof text !== "string") {
    return { quotes: [], sentences: [] };
  }

  const quotes: string[] = [];
  const quoteRegex = /"([^"]{6,})"/g;
  let match: RegExpExecArray | null;
  while ((match = quoteRegex.exec(text)) !== null) {
    quotes.push(match[1].trim());
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  return { quotes, sentences };
}

/**
 * Normalizes a string for similarity comparison.
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes word-level Jaccard similarity between two strings.
 */
export function computeWordSimilarity(a: string, b: string): number {
  const normA = normalizeForComparison(a);
  const normB = normalizeForComparison(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const wordsA = new Set(normA.split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Builds the strict Anti-Repetition & Forward Scene Momentum prompt directive
 * from the last 4 messages in `recentHistory`.
 */
export function buildAntiRepetitionDirective(
  recentHistory: TurnHistoryEntry[] = [],
  playerName: string = "Protagonist",
  location: string = "Current Sector"
): string {
  if (!Array.isArray(recentHistory) || recentHistory.length === 0) {
    return `--- FORWARD NARRATIVE PROGRESSION DIRECTIVE ---
- Every turn MUST advance the physical scene, plot stakes, or tactical situation in ${location}.
- Never stall in place with repetitive dialogue.`;
  }

  const lastEntries = recentHistory.slice(-4);
  const recentQuotes: string[] = [];
  const recentFirstSentences: string[] = [];

  for (const entry of lastEntries) {
    const { quotes, sentences } = extractQuotesAndSentences(entry.text || "");
    for (const q of quotes.slice(-3)) {
      recentQuotes.push(`[${entry.speaker}]: "${q}"`);
    }
    if (sentences[0]) {
      recentFirstSentences.push(`[${entry.speaker}]: ${sentences[0]}`);
    }
  }

  const forbiddenQuotesBlock =
    recentQuotes.length > 0
      ? `ALREADY SPOKEN DIALOGUE (STRICTLY FORBIDDEN TO REPEAT OR PARAPHRASE):\n${recentQuotes
          .slice(-6)
          .map((q) => `  * ${q}`)
          .join("\n")}`
      : "";

  const forbiddenBeatsBlock =
    recentFirstSentences.length > 0
      ? `ALREADY EXECUTED OPENING BEATS (DO NOT ECHO THESE SENTENCE STRUCTURES OR GESTURES):\n${recentFirstSentences
          .slice(-4)
          .map((s) => `  * ${s}`)
          .join("\n")}`
      : "";

  return `--- ANTI-REPETITION & FORWARD SCENE MOMENTUM DIRECTIVE (CRITICAL — ZERO LOOP TOLERANCE) ---
${forbiddenQuotesBlock}
${forbiddenBeatsBlock}

MANDATORY ANTI-LOOP RULES:
1. ZERO DIALOGUE REPETITION:
   - You are STRICTLY FORBIDDEN from repeating, reusing, or closely paraphrasing any dialogue line listed above!
   - If ${playerName} has already reassured a companion (e.g., "You're safe with me", "Hold tight", "I won't let them take you"), DO NOT repeat that vow again. That promise is already established canon!
   - If the companion has already expressed initial trust or urgency (e.g., "I believe you", "We should go"), they MUST NOT repeat those lines or the same physical gestures (e.g., breath hitching, claws retracting, tail curling around waist, touching forearm).
2. MANDATORY PHYSICAL & PLOT PROGRESSION:
   - Characters CANNOT remain frozen in the same spot having the same emotional exchange twice!
   - In "player_execution" and "narrative_text", you MUST physically move the characters forward: cross into a new sub-area or landmark, engage or evade the threat, trigger an environmental shift, or introduce new plot revelation.
   - Open both "player_execution" and "narrative_text" with fresh verbs, new spatial positioning, and new sensory details.`;
}

/**
 * Checks whether the newly generated `player_execution` or `narrative_text`
 * has fallen into a repetition loop against `recentHistory`.
 */
export function detectRepetitionLoop(
  newExecution: string | null | undefined,
  newNarrative: string | null | undefined,
  recentHistory: TurnHistoryEntry[] = []
): {
  isExecutionRepeated: boolean;
  isNarrativeRepeated: boolean;
} {
  if (!Array.isArray(recentHistory) || recentHistory.length === 0) {
    return { isExecutionRepeated: false, isNarrativeRepeated: false };
  }

  const recentTexts = recentHistory.slice(-4).map((h) => h.text || "");
  let isExecutionRepeated = false;
  let isNarrativeRepeated = false;

  if (newExecution && newExecution.trim().length > 20) {
    const newExecQuotes = extractQuotesAndSentences(newExecution).quotes;
    for (const prevText of recentTexts) {
      if (computeWordSimilarity(newExecution, prevText) >= 0.52) {
        isExecutionRepeated = true;
        break;
      }
      const prevQuotes = extractQuotesAndSentences(prevText).quotes;
      for (const nq of newExecQuotes) {
        for (const pq of prevQuotes) {
          if (computeWordSimilarity(nq, pq) >= 0.65) {
            isExecutionRepeated = true;
            break;
          }
        }
      }
    }
  }

  if (newNarrative && newNarrative.trim().length > 20) {
    const newNarrQuotes = extractQuotesAndSentences(newNarrative).quotes;
    for (const prevText of recentTexts) {
      if (computeWordSimilarity(newNarrative, prevText) >= 0.50) {
        isNarrativeRepeated = true;
        break;
      }
      const prevQuotes = extractQuotesAndSentences(prevText).quotes;
      for (const nq of newNarrQuotes) {
        for (const pq of prevQuotes) {
          if (computeWordSimilarity(nq, pq) >= 0.65) {
            isNarrativeRepeated = true;
            break;
          }
        }
      }
    }
  }

  return { isExecutionRepeated, isNarrativeRepeated };
}

/**
 * Server-side circuit breaker: if the LLM still outputs a repeated paragraph or quote loop,
 * dynamically rewrites/accelerates the beat so the player never sees duplicate text.
 */
export function breakStagnationLoop(params: {
  playerExecution: string | null;
  narrativeText: string;
  isExecutionRepeated: boolean;
  isNarrativeRepeated: boolean;
  action: string;
  playerName: string;
  playerRole: string;
  playerRace?: string;
  speakerName: string;
  location: string;
  isProtagonistAlone: boolean;
}): {
  playerExecution: string | null;
  narrativeText: string;
} {
  let {
    playerExecution,
    narrativeText,
    isExecutionRepeated,
    isNarrativeRepeated,
    action,
    playerName,
    playerRole,
    playerRace,
    speakerName,
    location,
    isProtagonistAlone,
  } = params;

  const cleanAction = action.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
  const raceDescriptor =
    playerRace && playerRace.toLowerCase() !== "human"
      ? `${playerRace.toLowerCase()} instincts`
      : `${playerRole.toLowerCase()} reflexes`;

  if (isExecutionRepeated && playerExecution) {
    playerExecution = `Without wasting another breath, ${playerName} channels ${raceDescriptor} into immediate forward momentum, cutting through the shadows of ${location}. Every stride is decisive and calculated, leaving the previous vantage point behind as ${playerName} commits fully to the next move. "${cleanAction || "Stay on my heels—we're breaking through the perimeter now."}"`;
  }

  if (isNarrativeRepeated) {
    if (isProtagonistAlone || speakerName === "Narrator" || speakerName === "System") {
      narrativeText = `The air across ${location} shifts sharply as ${playerName} advances into a new sector. Distant echoes fade behind the stonework while fresh tactical pathways open ahead—a narrow stone Causeway leading toward the lower vaults and an elevated ridge overlooking the district lantern-posts. The quiet tension demands an immediate choice of route.`;
    } else {
      narrativeText = `The moment of hesitation shatters as sharp steel clangs against stone just behind their previous position. ${speakerName} matches ${playerName}'s pace as they burst past the threshold into a shadowed passageway of ${location}, breathing hard as the layout opens into two diverging routes ahead. "They've cut off the main avenue," ${speakerName} says urgently, pointing toward a concealed iron grate and a narrow stone archway beyond. "Which way are we taking—through the undercroft or across the high bridge?"`;
    }
  }

  return {
    playerExecution,
    narrativeText,
  };
}

