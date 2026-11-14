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
    .replace(/[ \t]+([,.;!?…])/g, "$1") // Space before punctuation: "word ." -> "word."
    .replace(/([,.;!?…])\1{2,}/g, "$1$1") // Cap excessive punctuation: "!!!!" -> "!!"
    .replace(/[ \t]{2,}/g, " ") // Collapse duplicate horizontal spaces without stripping \n\n paragraph breaks
    .replace(/\n[ \t]+\n/g, "\n\n") // Clean whitespace-only lines
    .replace(/\n{3,}/g, "\n\n") // Collapse 3+ newlines into clean double newline paragraph breaks
    .trim();
}

const CLICHE_PATTERNS = [
  /\s*The choice (of what happens next|is yours|now rests)[^.!?\n]*([.!?]|$)/gi,
  /\s*What will (you|they|he|she|Vaughn) do next\??/gi,
  /\s*Only time will tell[^.!?\n]*([.!?]|$)/gi,
  /\s*(?:The (?:hall|room|chamber|crowd|assembly|world)|She|He|They)\s+waits? with bated breath to see how[^.!?\n]*proceeds?\.?/gi,
  /\s*The next (move|step|action) is (yours|up to you)[^.!?\n]*([.!?]|$)/gi,
  /\s*The future hangs in the balance[^.!?\n]*([.!?]|$)/gi,
  /\s*How will (you|they|he|she|Vaughn) respond\??/gi,
];

const CATALOG_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bNotched Chancellery Longsword\s*\(Edge-Resonance Tang\)/gi, "notched longsword"],
  [/\bIron-Grey Initiate Greatcoat\s*&\s*Brigandine\b/gi, "iron-grey greatcoat"],
  [/\bFractured Ashen Legion Spine-Node\b/gi, "fractured spine-node"],
  [/\bRite-Etched Aetherial Catalyst Blade\b/gi, "rite-etched catalyst blade"],
  [/\bHigh-Collared Obsidian Choir Robes\b/gi, "dark Choir vestments"],
  [/\bChoir of Thorns Heart-Crystal\b/gi, "thorny heart-crystal"],
  [/\bQuick-Swap Artificer Estoc\s*&\s*Wire Snares\b/gi, "artificer estoc"],
  [/\bVial-Lined Tailor Vest\s*&\s*Brass Lenses\b/gi, "vial-lined vest"],
  [/\bAppraiser's Overcharged Crown-Lens\b/gi, "overcharged brass lens"],
  [/\bConcealed Punch-Dagger\s*&\s*Curved Mist-Saber\b/gi, "curved saber"],
  [/\bTwin Mist-Sabers\s*&\s*Runic Handwraps\b/gi, "curved sabers"],
  [/\bShadow-Weave Syndicate Jacket\b/gi, "dark coat"],
  [/\bBlack-Bell Sensory Dampener Ring\b/gi, "tarnished dampening ring"],
  [/\bStratum I:\s*The Sunken Cloisters\b/gi, "the Sunken Cloisters"],
  [/\bStratum II:\s*The Weeping Ossuary\b/gi, "the Weeping Ossuary"],
  [/\bStratum III:\s*The Chronos Scars\b/gi, "the Chronos Scars"],
  [/\bStratum IV:\s*The Pulse\b/gi, "the Pulse"],
  [/\bThe Seal-Gate\s*&\s*Boarding Quays\b/gi, "the Seal-Gate"],
  [/\bThe Velvet Spill\s*&\s*The Tribunal Pit\b/gi, "the Velvet Spill"],
  [/\bThe Sky-Crown\s*&\s*Sovereign Terraces\b/gi, "the Sky-Crown terraces"],
  [/\bHand-Forged Damascus Santoku\s*&\s*Copper Shaker\b/gi, "Damascus chef knife"],
  [/\bCrisp Rolled-Sleeve Bistro Shirt\s*&\s*Indigo Apron\b/gi, "indigo bistro apron"],
  [/\bGrandfather's Brass Espresso Tamper\s*\(Stray Anchor Deed\)/gi, "brass espresso tamper"],
  [/\bGold-Nibbed Charter Audit Pen\s*&\s*Sommelier Tastevin\b/gi, "gold-nibbed fountain pen"],
  [/\bUnbuttoned White Resort Blazer\s*&\s*Silk Pocket Square\b/gi, "white resort blazer"],
  [/\bRevoked Vane-Valorian VIP Black Card\b/gi, "revoked VIP black card"],
  [/\bSun-Bleached Kendo Shinai\s*&\s*Pro Tour Volleyball\b/gi, "bamboo shinai"],
  [/\bCropped Red-and-White Lifeguard Windbreaker\s*&\s*Boardshorts\b/gi, "lifeguard windbreaker"],
  [/\bSilver South-Shore Championship Whistle\b/gi, "silver lifeguard whistle"],
  [/\bModded Sanwa Fight-Stick\s*&\s*35mm Rangefinder Camera\b/gi, "custom arcade fight-stick"],
  [/\bOff-Shoulder Pastel Arcade Hoodie\s*&\s*Press Lanyard\b/gi, "arcade hoodie"],
  [/\bEncrypted Solaris Siren Rumor Ledger\b/gi, "rumor ledger"],
  [/\bDriftwood Cove\s*\(The Stray Anchor\)/gi, "The Stray Anchor"],
  [/\bThe Campus Terrace\s*\(Solaris University\)/gi, "the Campus Terrace"],
  // Strip robotic inline rank parentheticals in prose/dialogue like "(Rank #184)" or "(#142)"
  [/\s*\((?:Rank\s*)?#\d{1,3}\)/gi, ""],
];

const COMPANION_FULL_NAMES: Array<[string, string]> = [
  ["Evelyn Abbandonato", "Evelyn"],
  ["Aria Shadowthorn", "Aria"],
  ["Cassia Valen", "Cassia"],
  ["Beatrix Valorian", "Beatrix"],
  ["Ysolde Kaelen", "Ysolde"],
  ["Aurelia Solis", "Aurelia"],
  ["Miri Thorne", "Miri"],
  ["Noelle Vesper", "Noelle"],
  ["Kestrel Hollow", "Kestrel"],
  ["Valeria Noctis", "Valeria"],
  ["Seraphina Vane", "Seraphina"],
  ["Vivienne Laurent", "Vivienne"],
  ["Mia Bellini", "Mia"],
  ["Colette Moreau", "Colette"],
  ["Pippa Reyes", "Pippa"],
  ["Kaede Tachibana", "Kaede"],
  ["Roxy Vance", "Roxy"],
  ["Chloe Lin", "Chloe"],
  ["Nadia Saint-Clair", "Nadia"],
  ["Zuri Delacroix", "Zuri"],
];

/**
 * Converts a UI equipment label (e.g. "Concealed Punch-Dagger & Curved Mist-Saber")
 * into a natural, lowercase physical description for LLM prompts and fallback prose.
 */
const UNEQUIPPED_GEAR_VALUES = new Set([
  "",
  "none",
  "unarmed",
  "unarmored",
  "pending...",
  "[system pending]",
  "portrait attire",
  "portrait attire (unarmored)",
]);

export function humanizeGearForProse(rawGear?: string | null, fallback: string = "weapon"): string {
  if (!rawGear || typeof rawGear !== "string") return fallback;
  let cleaned = rawGear.trim();
  if (UNEQUIPPED_GEAR_VALUES.has(cleaned.toLowerCase())) {
    return fallback;
  }
  for (const [pattern, replacement] of CATALOG_PHRASE_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, "").trim();
  if (UNEQUIPPED_GEAR_VALUES.has(cleaned.toLowerCase())) {
    return fallback;
  }
  if (cleaned.includes("&")) {
    const parts = cleaned.split("&").map((p) => p.trim().toLowerCase());
    return parts.join(" and ");
  }
  return cleaned.toLowerCase();
}

/**
 * Converts a UI map-banner title (e.g. "The Seal-Gate & Boarding Quays" or "Stratum I: The Sunken Cloisters")
 * into a natural prose phrase.
 */
export function humanizeLocationForProse(rawLocation?: string | null): string {
  if (!rawLocation || typeof rawLocation !== "string") return "the chamber";
  let cleaned = rawLocation.trim();
  for (const [pattern, replacement] of CATALOG_PHRASE_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  return cleaned;
}

/**
 * Replaces repetitive catalog labels and converts repeated Full Names into natural First Names.
 */
export function humanizeCatalogAndNameRepetition(text: string, collapseAllFullNames: boolean = false): string {
  if (!text) return "";
  let out = text;

  for (const [pattern, replacement] of CATALOG_PHRASE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }

  for (const [fullName, firstName] of COMPANION_FULL_NAMES) {
    const regex = new RegExp(`\\b${fullName}\\b`, "g");
    let count = 0;
    out = out.replace(regex, (match) => {
      count += 1;
      if (collapseAllFullNames || count > 1) {
        return firstName;
      }
      return match;
    });
  }

  return out;
}

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
  const trimmed = humanizeCatalogAndNameRepetition(choice.trim(), true);

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

const LEAKED_JSON_SCHEMA_FIELDS = new Set([
  "current_location",
  "present_companions",
  "affected_companion",
  "affection_delta",
  "companion_sentiment",
  "expression_key",
  "core_memory_unlocked",
  "new_memory_unlocked",
  "player_progression",
  "exp_gained",
  "exp_reason",
  "system_event",
  "combat_encounter",
  "story_clash",
  "state_updates",
  "narrative_text",
  "player_execution",
  "suggested_choices",
  "opening_choices",
  "options",
  "choices",
  "mood",
  "speaker",
  "location",
]);

/**
 * Validates that a tactical choice string is a real player action/dialogue option
 * and not a leaked JSON schema key, bare companion name, or bare location label.
 */
export function isValidTacticalChoice(choice: string): boolean {
  if (!choice || typeof choice !== "string") return false;
  const trimmed = choice.trim();
  if (!trimmed || trimmed.includes("{") || trimmed.includes("}") || trimmed.includes('"state_updates"')) {
    return false;
  }

  const body = trimmed.replace(/^\[[^\]]+\](?::)?\s*/, "").trim();
  if (!body || body.length < 12) return false;

  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/i.test(body)) return false;
  if (LEAKED_JSON_SCHEMA_FIELDS.has(body.toLowerCase())) return false;

  const hasSentencePunctuation = /[.!?…"”']/.test(body);
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  if (!hasSentencePunctuation && wordCount < 6) {
    return false;
  }

  return true;
}

/**
 * Sanitizes, filters out any leaked JSON fragments or bare labels, applies
 * [Tone/Action] tags, and caps choices to at most 4 tactical vectors.
 */
export function sanitizeAndFilterChoices(choices?: any[] | null): string[] {
  if (!Array.isArray(choices)) return [];
  const seen = new Set<string>();
  const valid: string[] = [];

  for (const raw of choices) {
    if (typeof raw !== "string") continue;
    const cleaned = sanitizeVisualNovelProse(raw.trim());
    if (!isValidTacticalChoice(cleaned)) continue;
    const tagged = ensureChoiceIntentTag(cleaned);
    if (!isValidTacticalChoice(tagged)) continue;
    const key = tagged.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    valid.push(tagged);
    if (valid.length >= 4) break;
  }

  return valid;
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

  // 2b. Humanize catalog labels and collapse repetitive full names
  processed = humanizeCatalogAndNameRepetition(processed, false);

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

