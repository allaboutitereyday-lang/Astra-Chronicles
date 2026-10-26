/**
 * Visual Novel Prose & Dialogue Sanitizer for Astra Chronicles
 * 
 * Deterministically corrects common LLM artifacts:
 * - Duplicate quotation marks (e.g. ""text"" -> "text")
 * - Mixed or nested single/double quotes (e.g. "'Hello'" -> "Hello")
 * - Dangling or unclosed quotation marks at paragraph boundaries
 * - Unbalanced markdown asterisks (*italics*, **bold**)
 * - Leaked bracket intent tags (e.g. "[Combat]", "[Perci's Response]")
 * - Punctuation spacing anomalies and stray artifacts
 */

import {
  fixSingleQuotedSpeechWithApostrophes,
  stripErraticMarkdownFormatting,
  sanitizeNarrativeAndMechanics,
} from "./textSanitizer";

export { sanitizeNarrativeAndMechanics, fixSingleQuotedSpeechWithApostrophes, stripErraticMarkdownFormatting };

/**
 * Normalizes quotes and fixes duplicates / smart quotes / nested quotes.
 */
export function normalizeQuotes(text: string): string {
  if (!text) return "";

  const cleaned = text
    // Normalize unicode smart quotes to standard ascii quotes
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    // Fix triple or quadruple quotes
    .replace(/"{3,}/g, '"')
    // Fix duplicate double quotes: ""text"" -> "text"
    .replace(/""([^"\n]+)""/g, '"$1"')
    // Fix lingering double-double quotes
    .replace(/""+/g, '"')
    // Fix mixed wrapper quotes: "'text with don't inside'" -> "text with don't inside"
    .replace(/"'([^"\n]+?)'"/g, '"$1"')
    .replace(/'"([^'\n]+?)"'/g, '"$1"');

  return cleaned;
}

/**
 * Ensures all quotation marks in dialogue are balanced per paragraph.
 * If a character begins speaking with `"` but the quote is never closed before a paragraph break,
 * appends the missing closing quote.
 */
export function balanceQuotationMarks(paragraph: string): string {
  if (!paragraph) return "";

  // Count unescaped double quotes in this paragraph
  const quoteMatches = paragraph.match(/"/g);
  const quoteCount = quoteMatches ? quoteMatches.length : 0;

  if (quoteCount % 2 !== 0) {
    // Odd number of quotes - quote was left dangling
    const trimmed = paragraph.trimEnd();
    // If paragraph ends with punctuation, append quote outside
    if (/[.!?…]$/.test(trimmed)) {
      return `${trimmed}"`;
    }
    // If paragraph ends with word, append period and quote
    return `${trimmed}."`;
  }

  return paragraph;
}

/**
 * Repairs unbalanced markdown asterisks (*italics*, **bold**) in a text block.
 */
export function balanceMarkdownAsterisks(text: string): string {
  if (!text) return "";

  const lines = text.split("\n");
  const repairedLines = lines.map((line) => {
    let l = line.trimEnd();
    if (!l) return l;

    // Check if an italic was opened and never closed before an opening quote:
    // e.g. "*whispers to herself "Hello"" -> count * before first "
    const quoteIndex = l.indexOf('"');
    if (quoteIndex > 0) {
      const beforeQuote = l.slice(0, quoteIndex);
      const asteriskCountBefore = (beforeQuote.match(/\*/g) || []).length;
      if (asteriskCountBefore % 2 !== 0) {
        const trimmedBefore = beforeQuote.trimEnd();
        l = `${trimmedBefore}* ${l.slice(quoteIndex)}`;
      }
    }

    // Now check for unbalanced bold markdown: count occurrences of **
    const boldMatches = l.match(/\*\*/g);
    const boldCount = boldMatches ? boldMatches.length : 0;
    if (boldCount % 2 !== 0) {
      l = `${l}**`;
    }

    // Check for single italic asterisks that are not part of **
    const temp = l.replace(/\*\*/g, "\uE000");
    const italicMatches = temp.match(/\*/g);
    const italicCount = italicMatches ? italicMatches.length : 0;
    if (italicCount % 2 !== 0) {
      l = `${l}*`;
    }

    return l;
  });

  return repairedLines.join("\n");
}

/**
 * Strips leaked meta and bracket tags like "[Combat]", "[Combat/Aggressive]:", "[Perci's Response]", "[Inquire]".
 */
export function stripMetaAndBracketTags(text: string): string {
  if (!text) return "";

  return text
    // Remove model section headers like [PERCI'S RESPONSE] or [SCENE CONTINUATION]
    .replace(/^\[[A-Z0-9\s'_—\-\/:]+\](?::)?\s*/i, "")
    // Remove dual-intent bracket vectors like [Combat/Aggressive]: or [Arcana/Analytical]
    .replace(/^\[[A-Za-z\s]+\/[A-Za-z\s]+\](?::)?\s*/i, "")
    // Remove inline bracket action vectors like [Combat] or [Subterfuge]
    .replace(/^\[(Combat|Arcana|Subterfuge|Inquire|Composure|Force|Diplomacy|Stealth|Observe|Tactics|Pragmatism|Defiance|Resolve)\](?::)?\s*/i, "")
    .replace(/\s*\[[A-Za-z\s]+\/[A-Za-z\s]+\](?::)?\s*/gi, " ")
    .replace(/\s*\[(Combat|Arcana|Subterfuge|Inquire|Composure|Force|Diplomacy|Stealth|Observe|Tactics|Pragmatism|Defiance|Resolve)\](?::)?\s*/gi, " ")
    // Remove meta introductory phrases like "Here is Perci's response:"
    .replace(/^(Here is (the )?|Perci's response:?|The companion replies:?)\s*/i, "")
    .trim();
}

/**
 * Cleans up spacing anomalies around punctuation and whitespace.
 */
export function cleanPunctuationSpacing(text: string): string {
  if (!text) return "";

  return text
    .replace(/\s+([,.;!?…])/g, "$1") // Space before punctuation: "word ." -> "word."
    .replace(/([,.;!?…])\1{2,}/g, "$1$1") // Cap excessive punctuation: "!!!!" -> "!!"
    .replace(/\s{2,}/g, " ") // Collapse duplicate spaces
    .replace(/(\n\s*){3,}/g, "\n\n") // Collapse excessive blank lines
    .trim();
}

const CLICHE_PATTERNS = [
  /\s*The choice (of what happens next|is yours|now rests).*?([.!?]|$)/gi,
  /\s*What will (you|they|he|she|Vaughn) do next\??/gi,
  /\s*Only time will tell.*?([.!?]|$)/gi,
  /\s*.*?waits with bated breath to see how.*?proceeds?\.?/gi,
  /\s*The next (move|step|action) is (yours|up to you).*?([.!?]|$)/gi,
  /\s*The future hangs in the balance.*?([.!?]|$)/gi,
  /\s*How will (you|they|he|she|Vaughn) respond\??/gi,
];

/**
 * Strips lazy AI meta endings and cliffhanger clichés.
 */
export function stripMetaCliches(text: string): string {
  if (!text) return "";
  let cleaned = text;
  for (const pattern of CLICHE_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.trim();
}

/**
 * Converts dialogue wrapped in single quotes into proper double quotes.
 * e.g. 'Back down,' she said. -> "Back down," she said.
 */
export function normalizeSingleQuoteDialogue(text: string): string {
  if (!text) return "";
  return text
    .replace(/(^|\n)\s*'([A-Z][^'\n]{2,}?[,!?…])'/g, '$1"$2"')
    .replace(/([\s*])'([A-Z][^'\n]{2,}?[,!?…])'/g, '$1"$2"')
    .replace(/([\s*])'([A-Z][^'\n]{2,}?\.)'/g, '$1"$2"');
}

/**
 * Guarantees every suggested choice follows the strict format:
 * [Tone/Action]: Short summary of character action/dialogue
 */
export function ensureChoiceIntentTag(choice: string): string {
  if (!choice) return "";
  const trimmed = choice.trim();

  // If already matches [Tone/Action]: Summary or [Tone/Action] Summary
  const dualTagMatch = trimmed.match(/^\[([A-Za-z]+)\/([A-Za-z]+)\](?::)?\s*(.+)$/);
  if (dualTagMatch) {
    const tone = dualTagMatch[1];
    const action = dualTagMatch[2];
    const rest = dualTagMatch[3].trim();
    return `[${tone}/${action}]: ${rest}`;
  }

  // If matches single tag [Tag] Summary or [Tag]: Summary
  const singleTagMatch = trimmed.match(/^\[([A-Za-z\s]+)\](?::)?\s*(.+)$/);
  if (singleTagMatch) {
    const rawTag = singleTagMatch[1].trim().toLowerCase();
    const rest = singleTagMatch[2].trim();
    let dualTag = "[Tactics/Decisive]";

    if (rawTag.includes("combat") || rawTag.includes("force") || rawTag.includes("bold") || rawTag.includes("challenge") || rawTag.includes("attack")) {
      dualTag = "[Combat/Aggressive]";
    } else if (rawTag.includes("arcana") || rawTag.includes("magic") || rawTag.includes("spell")) {
      dualTag = "[Arcana/Analytical]";
    } else if (rawTag.includes("subterfuge") || rawTag.includes("stealth") || rawTag.includes("rogue") || rawTag.includes("shadow")) {
      dualTag = "[Subterfuge/Cunning]";
    } else if (rawTag.includes("inquire") || rawTag.includes("observation") || rawTag.includes("persuade") || rawTag.includes("diplomacy") || rawTag.includes("lore")) {
      dualTag = "[Inquire/Diplomatic]";
    } else if (rawTag.includes("composure") || rawTag.includes("gentle") || rawTag.includes("defiance") || rawTag.includes("resolve") || rawTag.includes("pragmatism")) {
      dualTag = "[Composure/Defiant]";
    } else if (rawTag.includes("romance") || rawTag.includes("intimate") || rawTag.includes("passion") || rawTag.includes("love") || rawTag.includes("tender") || rawTag.includes("seduce")) {
      dualTag = "[Romance/Intimate]";
    }

    return `${dualTag}: ${rest}`;
  }

  // If untagged text, infer dual intent tag
  const lower = trimmed.toLowerCase();
  let dualTag = "[Tactics/Decisive]";
  if (
    lower.includes("attack") ||
    lower.includes("strike") ||
    lower.includes("blade") ||
    lower.includes("fight") ||
    lower.includes("combat") ||
    lower.includes("kill") ||
    lower.includes("sword") ||
    lower.includes("charge") ||
    lower.includes("parry") ||
    lower.includes("block") ||
    lower.includes("draw")
  ) {
    dualTag = "[Combat/Aggressive]";
  } else if (
    lower.includes("spell") ||
    lower.includes("magic") ||
    lower.includes("arcana") ||
    lower.includes("channel") ||
    lower.includes("rune") ||
    lower.includes("smoke") ||
    lower.includes("enchant") ||
    lower.includes("focus")
  ) {
    dualTag = "[Arcana/Analytical]";
  } else if (
    lower.includes("sneak") ||
    lower.includes("hide") ||
    lower.includes("shadow") ||
    lower.includes("steal") ||
    lower.includes("feign") ||
    lower.includes("escape") ||
    lower.includes("ambush") ||
    lower.includes("retreat") ||
    lower.includes("dodge")
  ) {
    dualTag = "[Subterfuge/Cunning]";
  } else if (
    lower.includes("ask") ||
    lower.includes("inquire") ||
    lower.includes("demand") ||
    lower.includes("speak") ||
    lower.includes("talk") ||
    lower.includes("reason") ||
    lower.includes("negotiate") ||
    lower.includes("call out") ||
    lower.includes("question") ||
    lower.includes("whisper")
  ) {
    dualTag = "[Inquire/Diplomatic]";
  } else if (
    lower.includes("stand") ||
    lower.includes("refuse") ||
    lower.includes("calm") ||
    lower.includes("gaze") ||
    lower.includes("meet") ||
    lower.includes("wait")
  ) {
    dualTag = "[Composure/Defiant]";
  } else if (
    lower.includes("kiss") ||
    lower.includes("embrace") ||
    lower.includes("caress") ||
    lower.includes("touch") ||
    lower.includes("hug") ||
    lower.includes("comfort") ||
    lower.includes("intimate") ||
    lower.includes("hold her") ||
    lower.includes("hold his") ||
    lower.includes("stroke") ||
    lower.includes("seduce") ||
    lower.includes("undress") ||
    lower.includes("whisper softly")
  ) {
    dualTag = "[Romance/Intimate]";
  }

  return `${dualTag}: ${trimmed}`;
}

/**
 * Master prose sanitizer: runs all cleaning passes and guarantees
 * flawless visual novel typography, quotes, and markdown.
 */
export function sanitizeVisualNovelProse(rawText: string | null | undefined): string {
  if (!rawText || typeof rawText !== "string") return "";

  let processed = rawText.trim();

  // 1. Strip prompt/bracket tags
  processed = stripMetaAndBracketTags(processed);

  // 2. Strip AI cliché meta endings
  processed = stripMetaCliches(processed);

  // 3. Normalize single-quote spoken dialogue (including sentences with apostrophes) into double quotes
  processed = fixSingleQuotedSpeechWithApostrophes(processed);
  processed = normalizeSingleQuoteDialogue(processed);

  // 4. Strip erratic inline Markdown (**bold**, *italics*, broken tables, unclosed tags)
  processed = stripErraticMarkdownFormatting(processed);

  // 5. Normalize and fix duplicate quotation marks
  processed = normalizeQuotes(processed);

  // 6. Balance quotes per paragraph
  const paragraphs = processed.split(/\n\s*\n/);
  const balancedParagraphs = paragraphs.map((p) => balanceQuotationMarks(p.trim()));
  processed = balancedParagraphs.join("\n\n");

  // 7. Clean up punctuation spacing
  processed = cleanPunctuationSpacing(processed);

  return processed;
}

/**
 * Specific sanitizer for spoken dialogue strings (guarantees clean wrapping in quotes).
 */
export function sanitizeSpokenDialogue(rawDialogue: string | null | undefined): string {
  if (!rawDialogue || typeof rawDialogue !== "string") return "";

  let cleaned = sanitizeVisualNovelProse(rawDialogue);

  // If the dialogue contains no quotes at all, wrap spoken text cleanly
  if (!cleaned.includes('"')) {
    // If it starts with italics action, e.g. *smirks* Watch this -> *smirks* "Watch this"
    const actionMatch = cleaned.match(/^(\*[^*]+\*\s*)(.+)$/);
    if (actionMatch) {
      const action = actionMatch[1].trim();
      const speech = actionMatch[2].trim().replace(/^["']|["']$/g, "");
      cleaned = `${action} "${speech}"`;
    } else {
      const speech = cleaned.replace(/^["']|["']$/g, "");
      cleaned = `"${speech}"`;
    }
  }

  return cleaned;
}

