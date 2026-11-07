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
    // 1. Convert comma-terminated single-quoted speech first (allows internal contractions like don't / Isaiah's,
    //    never bridges across separate single-quoted clauses, and supports capitalized speaker names like "Mia muttered"):
    .replace(
      /(^|[\s—–(-])'([A-Z][^"\n']*?(?:['’][a-zA-Z]+[^"\n']*?)*,)'(?=\s+[A-Za-z])/gm,
      '$1"$2"'
    )
    // 2. Convert sentence-punctuated single-quoted speech (without bridging across separate quotes):
    .replace(
      /(^|[\s—–(-])'([A-Z][^"\n']*?(?:['’][a-zA-Z]+[^"\n']*?)*[.!?…]+)'(?=\s|$|[.,;!?—–)])/gm,
      '$1"$2"'
    )
    // 3. Repair LLM mixed-quote dialogue clauses where opening quote is " and closing before attribution is ,'
    .replace(/"([^"\n']*?(?:['’][a-zA-Z]+[^"\n']*?)*,)'(?=\s+[A-Za-z])/g, '"$1"')
    // 4. Repair LLM mixed-quote dialogue continuations where resumption opens with ' and closes with "
    .replace(/(^|[\s—–(-])'([A-Z][^"\n']*?(?:['’][a-zA-Z]+[^"\n']*?)*[.!?…,]+)"/gm, '$1"$2"');
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

  // 1. Strip erratic bold/italic/table/unclosed markdown symbols and normalize .. -> ... first
  narrativeWork = stripErraticMarkdownFormatting(narrativeWork);

  // 2. Fix single-quoted speech containing apostrophes into standard double quotes ("...")
  narrativeWork = fixSingleQuotedSpeechWithApostrophes(narrativeWork);

  // 3. Final pass to ensure zero stray markdown symbols remain
  narrativeWork = stripErraticMarkdownFormatting(narrativeWork);

  const uniqueMechanics = Array.from(new Set(extractedMechanics.filter(Boolean)));

  return {
    narrative: narrativeWork.trim(),
    mechanics: uniqueMechanics.join(" • "),
  };
}

