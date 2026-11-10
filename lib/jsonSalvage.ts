/**
 * Lenient JSON Parser & Comprehensive Field Salvage Engine for LLM Outputs
 *
 * Specifically engineered to handle multi-paragraph literary JSON outputs from
 * Claude Sonnet 4.6, Gemini 2.5 Flash, DeepSeek V3.2, Magnum, Cydonia, Euryale, and Hermes:
 * 1. Literal newlines (\n / \r / \t) inside multi-paragraph JSON strings ("narrative_text", "player_execution")
 * 2. Invalid single-quote escape sequences (\' inside single-quoted choice dialogue)
 * 3. Unescaped interior double quotes ("...") inside narrative prose or dialogue strings
 * 4. Trailing commas before } or ]
 * 5. Key alias normalization ("suggested_choices" / "opening_choices" / "choices" / "options")
 * 6. Full field salvage (including choices, state_updates, sentiment, mood, expression, and memories)
 *    even when a response is truncated mid-stream at max_tokens.
 */

const VALID_JSON_ESCAPES = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);

/**
 * Strips markdown code fences and extracts from the first '{' to the last '}' (or end of string if truncated).
 */
export function extractJsonBody(rawContent: string): string {
  if (!rawContent || typeof rawContent !== "string") return "";
  let cleaned = rawContent
    .replace(/^[\s\S]*?```(?:json)?\s*/i, (match) => (match.includes("{") && match.indexOf("{") < match.indexOf("```") ? match : ""))
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) return cleaned;

  // Walk from firstBrace tracking strings and brace depth to find the true matching outer '}'
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = firstBrace; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          return cleaned.slice(firstBrace, i + 1);
        }
      }
    }
  }

  // If depth > 0, the JSON was truncated before the final '}' — return everything from firstBrace
  return cleaned.slice(firstBrace);
}

/**
 * Repairs literal control characters (\n, \r, \t) inside JSON string literals,
 * strips illegal escape sequences like \' (turning \' into '), and removes trailing commas.
 */
export function repairJsonControlCharsAndEscapes(input: string): string {
  if (!input) return "";
  let out = "";
  let inString = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (inString) {
      if (ch === "\\") {
        const next = input[i + 1];
        if (next === undefined) {
          out += "\\\\";
          i += 1;
          continue;
        }
        if (VALID_JSON_ESCAPES.has(next)) {
          out += "\\" + next;
          i += 2;
          continue;
        }
        if (next === "'") {
          // Illegal \' in JSON string -> output bare single quote '
          out += "'";
          i += 2;
          continue;
        }
        if (next === "\n") {
          out += "\\n";
          i += 2;
          continue;
        }
        if (next === "\r") {
          if (input[i + 2] === "\n") i += 3;
          else i += 2;
          out += "\\n";
          continue;
        }
        // Unknown escape sequence -> escape the backslash itself
        out += "\\\\" + next;
        i += 2;
        continue;
      }

      if (ch === '"') {
        inString = false;
        out += '"';
        i += 1;
        continue;
      }

      if (ch === "\n") {
        out += "\\n";
        i += 1;
        continue;
      }
      if (ch === "\r") {
        if (input[i + 1] === "\n") {
          i += 1;
        }
        out += "\\n";
        i += 1;
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        i += 1;
        continue;
      }

      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += "\\u" + code.toString(16).padStart(4, "0");
        i += 1;
        continue;
      }

      out += ch;
      i += 1;
    } else {
      if (ch === '"') {
        inString = true;
        out += '"';
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
    }
  }

  // Remove trailing commas outside strings before } or ]
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Repairs unescaped interior double quotes ("...") inside JSON object string values and array elements,
 * while also escaping literal newlines and invalid \' escapes.
 */
export function repairUnescapedInteriorQuotes(input: string): string {
  if (!input) return "";
  let out = "";
  let inString = false;
  let stringRole: "key" | "objectValue" | "arrayElement" = "key";
  const stack: Array<"object" | "array"> = [];
  let expectingKey = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (inString) {
      if (ch === "\\") {
        const next = input[i + 1];
        if (next === undefined) {
          out += "\\\\";
          i += 1;
          continue;
        }
        if (VALID_JSON_ESCAPES.has(next)) {
          out += "\\" + next;
          i += 2;
          continue;
        }
        if (next === "'") {
          out += "'";
          i += 2;
          continue;
        }
        if (next === "\n" || next === "\r") {
          if (next === "\r" && input[i + 2] === "\n") i += 3;
          else i += 2;
          out += "\\n";
          continue;
        }
        out += "\\\\" + next;
        i += 2;
        continue;
      }

      if (ch === '"') {
        const rest = input.slice(i + 1);
        let isClosingQuote = false;

        if (stringRole === "key") {
          isClosingQuote = /^\s*:/.test(rest);
        } else if (stringRole === "objectValue") {
          // A string value inside a JSON object only closes before `}`, `,"next_key":`, `,}`, or EOF
          isClosingQuote =
            /^\s*\}/.test(rest) ||
            /^\s*,\s*"[A-Za-z0-9_]+"\s*:/.test(rest) ||
            /^\s*,\s*\}/.test(rest) ||
            /^\s*$/.test(rest);
        } else {
          // Inside a JSON array of strings (e.g. suggested_choices)
          isClosingQuote =
            /^\s*\]/.test(rest) ||
            /^\s*,\s*(?:"|\{|\[|\]|true|false|null|-?\d)/.test(rest) ||
            /^\s*$/.test(rest);
        }

        if (isClosingQuote) {
          inString = false;
          out += '"';
          i += 1;
          continue;
        } else {
          // Interior unescaped quote in prose -> escape it!
          out += '\\"';
          i += 1;
          continue;
        }
      }

      if (ch === "\n") {
        out += "\\n";
        i += 1;
        continue;
      }
      if (ch === "\r") {
        if (input[i + 1] === "\n") i += 1;
        out += "\\n";
        i += 1;
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        i += 1;
        continue;
      }

      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        out += "\\u" + code.toString(16).padStart(4, "0");
        i += 1;
        continue;
      }

      out += ch;
      i += 1;
    } else {
      if (ch === "{") {
        stack.push("object");
        expectingKey = true;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "}") {
        stack.pop();
        expectingKey = false;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "[") {
        stack.push("array");
        expectingKey = false;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "]") {
        stack.pop();
        expectingKey = false;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === ":") {
        expectingKey = false;
        out += ch;
        i += 1;
        continue;
      }
      if (ch === ",") {
        const top = stack[stack.length - 1];
        expectingKey = top === "object";
        out += ch;
        i += 1;
        continue;
      }
      if (ch === '"') {
        inString = true;
        const top = stack[stack.length - 1];
        if (top === "object") {
          stringRole = expectingKey ? "key" : "objectValue";
        } else if (top === "array") {
          stringRole = "arrayElement";
        } else {
          stringRole = "objectValue";
        }
        out += '"';
        i += 1;
        continue;
      }
      out += ch;
      i += 1;
    }
  }

  return out.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Normalizes any choice array or object structure into an array of clean choice strings.
 */
export function normalizeExtractedChoices(rawChoices: any): string[] {
  if (!rawChoices) return [];

  if (Array.isArray(rawChoices)) {
    const result: string[] = [];
    for (const item of rawChoices) {
      if (typeof item === "string") {
        const cleaned = item
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .trim();
        if (cleaned.length > 4 && !cleaned.includes('"state_updates"') && !cleaned.startsWith("{")) {
          result.push(cleaned);
        }
      } else if (item && typeof item === "object") {
        const tag = item.tag || item.tone || item.intent || item.category || item.prefix || "";
        const text =
          item.text ||
          item.choice ||
          item.action ||
          item.dialogue ||
          item.label ||
          item.description ||
          item.content ||
          "";
        if (typeof text === "string" && text.trim().length > 4) {
          const cleanText = text.replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
          if (tag && typeof tag === "string" && !cleanText.startsWith("[")) {
            const cleanTag = tag.replace(/^\[|\]$/g, "").trim();
            result.push(`[${cleanTag}]: ${cleanText}`);
          } else {
            result.push(cleanText);
          }
        }
      }
    }
    return result;
  }

  if (typeof rawChoices === "object") {
    const values = Object.values(rawChoices);
    return normalizeExtractedChoices(values);
  }

  return [];
}

/**
 * Extracts a choice array from raw JSON text even when the surrounding JSON object failed to parse or was truncated.
 */
export function extractChoicesFromRawText(rawContent: string): string[] {
  if (!rawContent || typeof rawContent !== "string") return [];

  const keyRegex = /"(?:suggested_choices|opening_choices|choices|options)"\s*:\s*\[/g;
  let keyMatch: RegExpExecArray | null;

  while ((keyMatch = keyRegex.exec(rawContent)) !== null) {
    const startIdx = keyMatch.index + keyMatch[0].length;
    let inString = false;
    let escaped = false;
    let depth = 1;
    let endIdx = rawContent.length;

    for (let i = startIdx; i < rawContent.length; i++) {
      const ch = rawContent[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
      } else {
        if (ch === '"') {
          inString = true;
        } else if (ch === "[") {
          depth++;
        } else if (ch === "]") {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    const arrayBody = rawContent.slice(startIdx, endIdx);
    try {
      const repairedArray = repairJsonControlCharsAndEscapes(`[${arrayBody}]`);
      const parsed = JSON.parse(repairedArray);
      const normalized = normalizeExtractedChoices(parsed);
      if (normalized.length > 0) return normalized;
    } catch {
      const items: string[] = [];
      const itemRegex = /"((?:[^"\\]|\\[\s\S])*)"/g;
      let itemMatch: RegExpExecArray | null;
      while ((itemMatch = itemRegex.exec(arrayBody)) !== null) {
        const val = itemMatch[1]
          .replace(/\\n/g, " ")
          .replace(/\\r/g, " ")
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\")
          .trim();
        if (val.length > 8 && !val.includes('"state_updates"')) {
          items.push(val);
        }
      }
      if (items.length > 0) return items;
    }
  }

  return [];
}

/**
 * Unescapes a regex-captured JSON string value cleanly.
 */
function unescapeCapturedJsonString(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, " ")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .trim();
}

/**
 * Extracts a string property from raw JSON text even when unescaped newlines or truncation occurred.
 */
export function extractStringFieldFromRawText(rawContent: string, fieldName: string): string | null {
  if (!rawContent) return null;
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // First try standard escaped-string capture (matches literal newlines too since [^"\\] includes \n)
  const regex = new RegExp(`"${escapedField}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)(?:"|$)`);
  const match = rawContent.match(regex);
  if (match && match[1] && match[1].trim().length > 0) {
    return unescapeCapturedJsonString(match[1]);
  }
  return null;
}

/**
 * Unwraps a parsed JSON value into a plain object, rejecting primitive arrays like `[1]` or `[]`.
 */
function unwrapCandidateObject(candidate: any): Record<string, any> | null {
  if (!candidate || typeof candidate !== "object") return null;
  if (Array.isArray(candidate)) {
    const firstObj = candidate.find(
      (item) => item && typeof item === "object" && !Array.isArray(item)
    );
    return firstObj || null;
  }
  return candidate;
}

/**
 * Comprehensive salvage and normalization of LLM JSON responses.
 * Returns the parsed object with all salvaged fields (including suggested_choices, opening_choices,
 * player_execution, narrative_text, and state_updates) populated.
 */
export function parseModelJsonLenient(
  rawContent: string,
  fallbackSpeaker?: string
): Record<string, any> | null {
  if (!rawContent || typeof rawContent !== "string") return null;

  const extracted = extractJsonBody(rawContent);
  let parsed: Record<string, any> | null = null;

  // Attempt 1: Direct JSON.parse
  try {
    parsed = unwrapCandidateObject(JSON.parse(extracted));
  } catch {
    // Proceed to repair passes
  }

  // Attempt 2: Control-character, literal newline, and invalid \' escape repair
  if (!parsed) {
    try {
      const repaired = repairJsonControlCharsAndEscapes(extracted);
      parsed = unwrapCandidateObject(JSON.parse(repaired));
    } catch {
      // Proceed to interior-quote repair
    }
  }

  // Attempt 3: Heuristic interior unescaped double-quote repair
  if (!parsed) {
    try {
      const quoteRepaired = repairUnescapedInteriorQuotes(extracted);
      parsed = unwrapCandidateObject(JSON.parse(quoteRepaired));
    } catch {
      // Proceed to comprehensive field salvage
    }
  }

  // Attempt 4: Comprehensive field salvage on truncated or severely malformed JSON
  if (!parsed) {
    const repairedSource = repairUnescapedInteriorQuotes(extracted);
    const speaker =
      extractStringFieldFromRawText(repairedSource, "speaker") ||
      extractStringFieldFromRawText(rawContent, "speaker") ||
      fallbackSpeaker ||
      "Narrator";
    const playerExecution =
      extractStringFieldFromRawText(repairedSource, "player_execution") ||
      extractStringFieldFromRawText(rawContent, "player_execution");
    const narrativeText =
      extractStringFieldFromRawText(repairedSource, "narrative_text") ||
      extractStringFieldFromRawText(rawContent, "narrative_text") ||
      extractStringFieldFromRawText(repairedSource, "narrate_text") ||
      extractStringFieldFromRawText(rawContent, "narrate_text") ||
      extractStringFieldFromRawText(repairedSource, "narrative") ||
      extractStringFieldFromRawText(repairedSource, "story_text") ||
      extractStringFieldFromRawText(repairedSource, "response");
    const sceneSetup =
      extractStringFieldFromRawText(repairedSource, "scene_setup") ||
      extractStringFieldFromRawText(rawContent, "scene_setup");
    const dialogue =
      extractStringFieldFromRawText(repairedSource, "dialogue") ||
      extractStringFieldFromRawText(rawContent, "dialogue");
    const mechanics =
      extractStringFieldFromRawText(repairedSource, "mechanics") ||
      extractStringFieldFromRawText(rawContent, "mechanics");
    const systemAnnouncement =
      extractStringFieldFromRawText(repairedSource, "system_announcement") ||
      extractStringFieldFromRawText(rawContent, "system_announcement");

    const salvagedChoices = extractChoicesFromRawText(rawContent);

    // Salvage state_updates fields
    const currentLocation =
      extractStringFieldFromRawText(repairedSource, "current_location") ||
      extractStringFieldFromRawText(rawContent, "location");
    const mood =
      extractStringFieldFromRawText(repairedSource, "mood") ||
      extractStringFieldFromRawText(repairedSource, "initial_mood");
    const expressionKey = extractStringFieldFromRawText(repairedSource, "expression_key");
    const affectedCompanion = extractStringFieldFromRawText(repairedSource, "affected_companion");
    const companionSentiment = extractStringFieldFromRawText(repairedSource, "companion_sentiment");
    const newMemoryUnlocked = extractStringFieldFromRawText(repairedSource, "new_memory_unlocked");

    const affectionDeltaMatch = rawContent.match(/"affection_delta"\s*:\s*(-?\d+)/);
    const affectionDelta = affectionDeltaMatch ? parseInt(affectionDeltaMatch[1], 10) : 0;

    const initialAffectionMatch = rawContent.match(/"initial_affection"\s*:\s*(\d+)/);
    const initialAffection = initialAffectionMatch ? parseInt(initialAffectionMatch[1], 10) : undefined;

    // Salvage core_memory_unlocked if present
    let coreMemoryUnlocked: { id: string; title: string; summary: string } | null = null;
    const coreMemMatch = rawContent.match(/"core_memory_unlocked"\s*:\s*\{([\s\S]*?)\}/);
    if (coreMemMatch && coreMemMatch[1]) {
      const memBlock = coreMemMatch[1];
      const memTitle = extractStringFieldFromRawText(memBlock, "title");
      const memSummary = extractStringFieldFromRawText(memBlock, "summary");
      const memId = extractStringFieldFromRawText(memBlock, "id") || `mem_${Date.now()}`;
      if (memTitle && memSummary) {
        coreMemoryUnlocked = { id: memId, title: memTitle, summary: memSummary };
      }
    }

    if (narrativeText || sceneSetup || dialogue || salvagedChoices.length > 0) {
      parsed = {
        speaker,
        player_execution: playerExecution || null,
        narrative_text: narrativeText || undefined,
        scene_setup: sceneSetup || undefined,
        dialogue: dialogue || undefined,
        mechanics: mechanics || null,
        system_announcement: systemAnnouncement || undefined,
        initial_affection: initialAffection,
        initial_mood: mood || undefined,
        expression_key: expressionKey || "neutral",
        new_memory_unlocked: newMemoryUnlocked || null,
        suggested_choices: salvagedChoices,
        opening_choices: salvagedChoices,
        choices: salvagedChoices,
        state_updates: {
          current_location: currentLocation || undefined,
          mood: mood || undefined,
          expression_key: expressionKey || "neutral",
          affected_companion: affectedCompanion || (speaker !== "Narrator" ? speaker : null),
          affection_delta: affectionDelta,
          companion_sentiment: companionSentiment || null,
          core_memory_unlocked: coreMemoryUnlocked,
        },
      };
    } else if (
      !rawContent.includes("{") &&
      !rawContent.trim().startsWith("[") &&
      rawContent.trim().length > 60
    ) {
      // Attempt 5: Plain-text roleplay prose salvage when an RP model omits JSON braces entirely
      const cleanRawProse = rawContent
        .replace(/^```(?:json|markdown|text)?\s*/im, "")
        .replace(/\s*```\s*$/m, "")
        .trim();
      if (cleanRawProse.length > 60) {
        parsed = {
          speaker: fallbackSpeaker || "Narrator",
          player_execution: null,
          narrative_text: cleanRawProse,
          suggested_choices: [],
          state_updates: {
            expression_key: "neutral",
            affected_companion: fallbackSpeaker && fallbackSpeaker !== "Narrator" ? fallbackSpeaker : null,
            affection_delta: 0,
          },
        };
      }
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  // Normalize common model key typos for narrative_text (e.g. Cydonia's "narrate_text")
  if (!parsed.narrative_text) {
    const altNarrative =
      parsed.narrate_text ??
      parsed.narrative ??
      parsed.story_text ??
      parsed.response ??
      parsed.text;
    if (typeof altNarrative === "string" && altNarrative.trim().length > 0) {
      parsed.narrative_text = altNarrative;
    } else if (Array.isArray(altNarrative)) {
      parsed.narrative_text = altNarrative.filter((p: any) => typeof p === "string").join("\n\n");
    }
  }

  if (!parsed.speaker && fallbackSpeaker) {
    parsed.speaker = fallbackSpeaker;
  }

  // Always normalize choice key aliases across suggested_choices, opening_choices, choices, options
  const rawChoiceCandidates =
    parsed.suggested_choices ??
    parsed.opening_choices ??
    parsed.choices ??
    parsed.options ??
    parsed.state_updates?.suggested_choices ??
    parsed.state_updates?.choices;

  let normalizedChoices = normalizeExtractedChoices(rawChoiceCandidates);
  if (normalizedChoices.length === 0) {
    normalizedChoices = extractChoicesFromRawText(rawContent);
  }

  if (normalizedChoices.length > 0) {
    parsed.suggested_choices = normalizedChoices;
    if (!parsed.opening_choices || !Array.isArray(parsed.opening_choices) || parsed.opening_choices.length === 0) {
      parsed.opening_choices = normalizedChoices;
    }
    if (!parsed.choices || !Array.isArray(parsed.choices) || parsed.choices.length === 0) {
      parsed.choices = normalizedChoices;
    }
  }

  return parsed;
}
