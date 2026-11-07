/**
 * Narrative Anti-Repetition & Scene Progression Guard
 *
 * Prevents LLM attractor loops where the protagonist and companion repeat
 * identical dialogue, vows, physical micro-beats, or shuffled paragraphs across consecutive turns.
 */

import { fixSingleQuotedSpeechWithApostrophes } from "./textSanitizer";

export interface TurnHistoryEntry {
  speaker: string;
  text: string;
}

/**
 * Extracts quoted dialogue strings ("...") and key sentences from a text block.
 * Normalizes single/mixed quotes first so split dialogue is accurately captured.
 */
export function extractQuotesAndSentences(text: string): {
  quotes: string[];
  sentences: string[];
} {
  if (!text || typeof text !== "string") {
    return { quotes: [], sentences: [] };
  }

  const normalizedText = fixSingleQuotedSpeechWithApostrophes(text);

  const quotes: string[] = [];
  const quoteRegex = /"([^"]{8,})"/g;
  let match: RegExpExecArray | null;
  while ((match = quoteRegex.exec(normalizedText)) !== null) {
    quotes.push(match[1].trim());
  }

  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  return { quotes, sentences };
}

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "your", "you",
  "his", "her", "hers", "him", "she", "they", "them", "their", "was",
  "were", "are", "been", "have", "had", "has", "not", "but", "what",
  "all", "when", "who", "will", "more", "out", "into", "just", "like",
  "over", "back", "down", "only", "then", "than", "some", "very",
]);

/**
 * Normalizes a string for similarity comparison.
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getContentWordArray(str: string): string[] {
  const norm = normalizeForComparison(str);
  if (!norm) return [];
  return norm.split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function getContentWords(str: string): Set<string> {
  return new Set(getContentWordArray(str));
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
 * Computes clause/sentence similarity combining Jaccard, content-word overlap coefficient,
 * and 4-content-word phrase matching (catching reused half-sentences like
 * "Her gaze lingered on his scar tracing his neck, ..." or "From behind the bar, Colette Moreau smirked...").
 */
export function computeClauseSimilarity(a: string, b: string): number {
  const jaccard = computeWordSimilarity(a, b);
  if (jaccard >= 0.85) return jaccard;

  const arrA = getContentWordArray(a);
  const arrB = getContentWordArray(b);
  const contentA = new Set(arrA);
  const contentB = new Set(arrB);
  if (contentA.size < 3 || contentB.size < 3) return jaccard;

  let shared = 0;
  for (const w of contentA) {
    if (contentB.has(w)) shared++;
  }
  const contentUnion = contentA.size + contentB.size - shared;
  const contentJaccard = contentUnion === 0 ? 0 : shared / contentUnion;
  const minSize = Math.min(contentA.size, contentB.size);
  const overlapCoeff = minSize >= 3 ? (shared / minSize) * 0.88 : 0;

  // Check if they share any contiguous 4-content-word n-gram (e.g. "gaze lingered scar tracing neck")
  let ngramScore = 0;
  if (arrA.length >= 4 && arrB.length >= 4) {
    const ngramsB = new Set<string>();
    for (let i = 0; i <= arrB.length - 4; i++) {
      ngramsB.add(arrB.slice(i, i + 4).join(" "));
    }
    for (let i = 0; i <= arrA.length - 4; i++) {
      if (ngramsB.has(arrA.slice(i, i + 4).join(" "))) {
        ngramScore = 0.78;
        break;
      }
    }
  }

  return Math.max(jaccard, contentJaccard, overlapCoeff, ngramScore);
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
  const playerFirstName = (playerName || "Protagonist").trim().split(/\s+/)[0] || playerName;

  if (!Array.isArray(recentHistory) || recentHistory.length === 0) {
    return `--- FORWARD NARRATIVE PROGRESSION DIRECTIVE ---
- Every turn MUST advance the physical scene, plot stakes, or tactical situation in ${location}.
- Never stall in place with repetitive dialogue.
- In "narrative_text", depict ONLY the companions' and world's reaction—do NOT write spoken dialogue for ${playerFirstName}.`;
  }

  const lastEntries = recentHistory.slice(-4);
  const recentQuotes: string[] = [];
  const recentActionBeats: string[] = [];

  for (const entry of lastEntries) {
    const { quotes, sentences } = extractQuotesAndSentences(entry.text || "");
    const substantiveQuotes = quotes.filter((q) => q.trim().split(/\s+/).length >= 4);
    for (const q of substantiveQuotes.slice(-10)) {
      const formattedQuote = `[${entry.speaker}]: "${q}"`;
      if (!recentQuotes.includes(formattedQuote)) {
        recentQuotes.push(formattedQuote);
      }
    }
    // Extract narrative action sentences across ALL paragraphs (not just sentences[0])
    const nonQuoteSentences = sentences
      .map((s) => s.replace(/"[^"]*"/g, "").trim())
      .filter((s) => s.length >= 25);
    for (const s of nonQuoteSentences.slice(-8)) {
      const formattedBeat = `[${entry.speaker}]: ${s}`;
      if (!recentActionBeats.includes(formattedBeat)) {
        recentActionBeats.push(formattedBeat);
      }
    }
  }

  const forbiddenQuotesBlock =
    recentQuotes.length > 0
      ? `ALREADY SPOKEN DIALOGUE IN PRIOR TURNS (STRICTLY FORBIDDEN TO REPEAT, REORDER, OR PARAPHRASE):\n${recentQuotes
          .slice(-16)
          .map((q) => `  * ${q}`)
          .join("\n")}`
      : "";

  const forbiddenBeatsBlock =
    recentActionBeats.length > 0
      ? `ALREADY EXECUTED PHYSICAL BEATS & DESCRIPTIONS (COMPLETED IN PAST TURNS — DO NOT RE-STAGE OR SHUFFLE INTO THIS TURN):\n${recentActionBeats
          .slice(-12)
          .map((s) => `  * ${s}`)
          .join("\n")}`
      : "";

  return `--- ANTI-REPETITION & FORWARD SCENE MOMENTUM DIRECTIVE (CRITICAL — ZERO LOOP TOLERANCE) ---
${forbiddenQuotesBlock}
${forbiddenBeatsBlock}

MANDATORY ANTI-LOOP & SCENE ADVANCEMENT RULES:
1. ZERO DIALOGUE OR PARAGRAPH SHUFFLING:
   - You are STRICTLY FORBIDDEN from repeating, reordering, or paraphrasing any spoken quote or physical beat listed above!
   - NEVER take the paragraphs from the previous assistant turn and shuffle their order! Every turn represents a NEW chronological moment AFTER the previous turn has already finished.
2. DO NOT RE-STAGE COMPLETED PROPS OR GAGS:
   - If a character already sipped a drink, dropped or tapped their clipboard, adjusted their blazer, polished a glass, set down a basket, stared at a scar/biceps, or made a teasing quip in the previous turn, that moment is OVER. Do NOT have them repeat the same physical reaction or catchphrase again!
3. DO NOT PUPPETEER ${playerFirstName.toUpperCase()} INSIDE "narrative_text":
   - ${playerFirstName}'s action and spoken dialogue belong EXCLUSIVELY in "player_execution".
   - In "narrative_text", NEVER write spoken dialogue for ${playerFirstName} (e.g., NEVER write '${playerFirstName} chuckled, "Relax..."' inside "narrative_text"). "narrative_text" must strictly portray how the companions and environment respond to ${playerFirstName}'s NEW action!
4. DIRECT CAUSAL RESPONSE TO THE NEW ACTION:
   - Your response MUST directly answer the specific new choice/action the player just took, introducing fresh dialogue topics, new spatial movement, and new narrative progression in ${location}.`;
}

/**
 * Checks whether the newly generated `player_execution` or `narrative_text`
 * has fallen into a repetition loop against `recentHistory` at the whole-text,
 * paragraph, sentence, or quote level.
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

  const recentTexts = recentHistory.slice(-4).map((h) => h.text || "").filter(Boolean);
  const prevQuotes: string[] = [];
  const prevSentences: string[] = [];
  const prevParagraphs: string[] = [];

  for (const prevText of recentTexts) {
    const { quotes, sentences } = extractQuotesAndSentences(prevText);
    prevQuotes.push(...quotes);
    prevSentences.push(...sentences);
    const paras = prevText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);
    prevParagraphs.push(...paras);
  }

  let isExecutionRepeated = false;
  let isNarrativeRepeated = false;

  if (newExecution && newExecution.trim().length > 20) {
    const { quotes: newExecQuotes, sentences: newExecSentences } = extractQuotesAndSentences(newExecution);
    for (const prevText of recentTexts) {
      if (computeWordSimilarity(newExecution, prevText) >= 0.68) {
        isExecutionRepeated = true;
        break;
      }
    }
    if (!isExecutionRepeated) {
      for (const nq of newExecQuotes) {
        if (nq.split(/\s+/).length < 4) continue;
        if (prevQuotes.some((pq) => pq.split(/\s+/).length >= 4 && computeClauseSimilarity(nq, pq) >= 0.68)) {
          isExecutionRepeated = true;
          break;
        }
      }
    }
    if (!isExecutionRepeated) {
      let repeatedSentenceCount = 0;
      for (const ns of newExecSentences) {
        if (prevSentences.some((ps) => computeClauseSimilarity(ns, ps) >= 0.68)) {
          repeatedSentenceCount++;
        }
      }
      if (repeatedSentenceCount >= 1) {
        isExecutionRepeated = true;
      }
    }
  }

  if (newNarrative && newNarrative.trim().length > 20) {
    const { quotes: newNarrQuotes, sentences: newNarrSentences } = extractQuotesAndSentences(newNarrative);
    const newParas = newNarrative
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    // 1. Whole-turn similarity check (catches shuffled paragraphs with same vocabulary)
    for (const prevText of recentTexts) {
      if (computeWordSimilarity(newNarrative, prevText) >= 0.6) {
        isNarrativeRepeated = true;
        break;
      }
    }

    // 2. Paragraph-to-paragraph similarity check
    if (!isNarrativeRepeated) {
      for (const np of newParas) {
        if (prevParagraphs.some((pp) => computeWordSimilarity(np, pp) >= 0.58)) {
          isNarrativeRepeated = true;
          break;
        }
      }
    }

    // 3. Quote-to-quote similarity check
    if (!isNarrativeRepeated) {
      for (const nq of newNarrQuotes) {
        if (nq.split(/\s+/).length < 4) continue;
        if (prevQuotes.some((pq) => pq.split(/\s+/).length >= 4 && computeClauseSimilarity(nq, pq) >= 0.62)) {
          isNarrativeRepeated = true;
          break;
        }
      }
    }

    // 4. Sentence-to-sentence similarity check across all paragraphs
    if (!isNarrativeRepeated) {
      for (const ns of newNarrSentences) {
        if (prevSentences.some((ps) => computeClauseSimilarity(ns, ps) >= 0.62)) {
          isNarrativeRepeated = true;
          break;
        }
      }
    }
  }

  return { isExecutionRepeated, isNarrativeRepeated };
}

/**
 * Server-side circuit breaker: strips repeated paragraphs, sentences, and quotes
 * that duplicate `recentHistory`, while preserving all genuinely fresh paragraphs/sentences.
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
  recentHistory?: TurnHistoryEntry[];
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
    speakerName,
    location,
    isProtagonistAlone,
    recentHistory = [],
  } = params;

  const cleanAction = action.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
  const playerFirstName = (playerName || "Protagonist").trim().split(/\s+/)[0] || playerName;
  const recentTexts = recentHistory.slice(-4).map((h) => h.text || "").filter(Boolean);

  const prevSentences: string[] = [];
  const prevQuotes: string[] = [];
  const prevParagraphs: string[] = [];
  for (const prev of recentTexts) {
    const { quotes, sentences } = extractQuotesAndSentences(prev);
    prevQuotes.push(...quotes);
    prevSentences.push(...sentences);
    const paras = prev
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);
    prevParagraphs.push(...paras);
  }

  if (isExecutionRepeated && playerExecution) {
    const normalizedExec = fixSingleQuotedSpeechWithApostrophes(playerExecution);
    const sentences = normalizedExec.split(/(?<=[.!?])\s+/).filter(Boolean);
    const freshSentences = sentences.filter((s) => {
      if (prevSentences.some((ps) => computeClauseSimilarity(s, ps) >= 0.62)) {
        return false;
      }
      const { quotes } = extractQuotesAndSentences(s);
      if (quotes.some((q) => prevQuotes.some((pq) => computeClauseSimilarity(q, pq) >= 0.62))) {
        return false;
      }
      return true;
    });

    if (freshSentences.length >= 2) {
      playerExecution = freshSentences.join(" ");
    } else {
      playerExecution = `${playerFirstName} shifts posture across ${location} and follows through decisively on the move. "${cleanAction}"`;
    }
  }

  if (isNarrativeRepeated && narrativeText) {
    const normalizedNarr = fixSingleQuotedSpeechWithApostrophes(narrativeText);
    const paragraphs = normalizedNarr.split(/\n\s*\n/).filter(Boolean);
    const cleanedParagraphs: string[] = [];

    for (const para of paragraphs) {
      // If the entire paragraph closely matches a previous paragraph, drop the whole paragraph
      if (prevParagraphs.some((pp) => computeWordSimilarity(para, pp) >= 0.58)) {
        continue;
      }

      // If any quote in this paragraph is a near-duplicate of a prior quote, check sentences
      const { quotes: paraQuotes } = extractQuotesAndSentences(para);
      const hasRepeatedQuote = paraQuotes.some(
        (q) =>
          q.split(/\s+/).length >= 4 &&
          prevQuotes.some((pq) => pq.split(/\s+/).length >= 4 && computeClauseSimilarity(q, pq) >= 0.6)
      );

      const sentences = para.split(/(?<=[.!?])\s+/).filter(Boolean);
      const survivingSentences = sentences.filter((s) => {
        if (prevSentences.some((ps) => computeClauseSimilarity(s, ps) >= 0.62)) {
          return false;
        }
        const { quotes } = extractQuotesAndSentences(s);
        if (
          quotes.some(
            (q) =>
              q.split(/\s+/).length >= 4 &&
              prevQuotes.some((pq) => pq.split(/\s+/).length >= 4 && computeClauseSimilarity(q, pq) >= 0.6)
          )
        ) {
          return false;
        }
        return true;
      });

      // If a paragraph had a repeated multi-sentence quote and lost half its sentences (leaving fragments), drop it
      if (hasRepeatedQuote && survivingSentences.length < sentences.length) {
        const rebuiltCandidate = survivingSentences.join(" ").trim();
        const quoteCount = (rebuiltCandidate.match(/"/g) || []).length;
        // If stripping broke a multi-sentence quote or left only a short setup line for a deleted quote, skip the paragraph
        if (quoteCount % 2 !== 0 || survivingSentences.length * 2 <= sentences.length) {
          continue;
        }
      }

      if (survivingSentences.length > 0) {
        const rebuilt = survivingSentences.join(" ").trim();
        if (rebuilt.length >= 25) {
          cleanedParagraphs.push(rebuilt);
        }
      }
    }

    if (cleanedParagraphs.length > 0) {
      narrativeText = cleanedParagraphs.join("\n\n");
    } else {
      const speakerFirst = (speakerName || "Narrator").trim().split(/\s+/)[0] || speakerName;
      narrativeText =
        isProtagonistAlone || speakerName === "Narrator" || speakerName === "System"
          ? `The atmosphere in ${location} shifts in immediate response to ${playerFirstName}'s move, pushing the encounter onto new ground as the tension settles into the next beat.`
          : `${speakerFirst}'s attention locks onto ${playerFirstName} as the new move changes the rhythm across ${location}. Setting aside what just passed between them, ${speakerFirst} meets ${playerFirstName}'s gaze and addresses the gesture directly.`;
    }
  }

  return {
    playerExecution,
    narrativeText,
  };
}
