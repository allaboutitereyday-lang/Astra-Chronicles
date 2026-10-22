/**
 * Strict JSON & Plain-Text Sanitizer for Visual Novel Narrative & LitRPG Mechanics
 *
 * Prevents broken or erratic LLM Markdown (unclosed asterisks, random bold/italic clauses,
 * broken tables, mismatched brackets, and single-quoted speech containing apostrophes)
 * from polluting the Visual Novel UI.
 */

export interface SanitizedTurnPayload {
  narrative: string;
  mechanics: string;
}

/**
 * Converts single-quoted spoken sentences into standard double quotes ("...")
 * even when the spoken clause contains internal apostrophes (e.g., that's, you're, Inquisition's).
 */
export function fixSingleQuotedSpeechWithApostrophes(text: string): string {
  if (!text) return "";

  return text
    // Normalize smart single/double quotes first
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Match single-quoted speech preceded by start-of-line, whitespace, or punctuation
    // and ending with sentence punctuation before the closing single quote:
    // e.g. 'You tread dangerous ground.. but I suppose that's why you're still breathing.'
    .replace(
      /(^|[\s—–(-])'([A-Z][^"\n]{2,}?[.!?…]+)'(?=\s|$|[.,;!?—–)])/gm,
      '$1"$2"'
    )
    .replace(
      /(^|[\s—–(-])'([A-Z][^"\n]{2,}?,)'(?=\s+[a-z])/gm,
      '$1"$2"'
    );
}

/**
 * Strips inline Markdown tags (**bold**, *italics*, __underline__, ~~strike~~, # headers,
 * > blockquotes, and broken table pipes) while preserving clean prose and paragraph breaks.
 */
export function stripErraticMarkdownFormatting(text: string): string {
  if (!text) return "";

  return text
    // Remove code fences if any leaked inside a string field
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```/g, "")
    // Remove markdown headings at start of line
    .replace(/^\s*#{1,6}\s+/gm, "")
    // Remove blockquote carets at start of line
    .replace(/^\s*>\s?/gm, "")
    // Replace bold/italic/underline wrappers with their inner text
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/___([^_]+)___/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    // Strip any remaining dangling/unclosed asterisks or backticks
    .replace(/[*`]/g, "")
    // Strip broken markdown table rows (e.g. |--- | ---|)
    .replace(/^\s*\|[\s\-:|]+\|\s*$/gm, "")
    // Convert any remaining pipe-delimited cells into clean middle-dot separated text
    .replace(/\s*\|\s*/g, " • ")
    // Fix two-dot ellipsis artifacts ("ground.." -> "ground...")
    .replace(/\.{2}(?!\.)/g, "...")
    // Fix unclosed or stray single brackets if any leaked
    .replace(/\[([^\][\n]{1,80})(?=\n|$)/g, "[$1]");
}

/**
 * Separates inline LitRPG system announcements or mechanical tags (e.g. [SYSTEM: ...])
 * from pure story narrative prose, returning clean `narrative` and `mechanics` strings.
 */
export function sanitizeNarrativeAndMechanics(
  rawNarrative: string | null | undefined,
  rawMechanics?: string | null | undefined
): SanitizedTurnPayload {
  const extractedMechanics: string[] = [];

  if (rawMechanics && typeof rawMechanics === "string" && rawMechanics.trim()) {
    extractedMechanics.push(
      stripErraticMarkdownFormatting(rawMechanics.trim())
    );
  }

  let narrativeWork = typeof rawNarrative === "string" ? rawNarrative : "";

  // Extract inline [SYSTEM: ...] or [LITRPG: ...] blocks out of narrative prose into mechanics
  narrativeWork = narrativeWork.replace(
    /\[\s*(?:SYSTEM|ADMINISTRATOR|LITRPG|STATUS|DIRECTIVE|QUEST\s+UPDATE)\s*:?\s*([^\]]+)\]/gi,
    (_match, inner) => {
      const cleanedNotice = stripErraticMarkdownFormatting(inner.trim());
      if (cleanedNotice) {
        extractedMechanics.push(`[SYSTEM: ${cleanedNotice}]`);
      }
      return "";
    }
  );

  // Fix single-quoted speech containing apostrophes before stripping markdown
  narrativeWork = fixSingleQuotedSpeechWithApostrophes(narrativeWork);

  // Strip erratic bold/italic/table/unclosed markdown symbols
  narrativeWork = stripErraticMarkdownFormatting(narrativeWork);

  const uniqueMechanics = Array.from(new Set(extractedMechanics.filter(Boolean)));

  return {
    narrative: narrativeWork.trim(),
    mechanics: uniqueMechanics.join(" • "),
  };
}

