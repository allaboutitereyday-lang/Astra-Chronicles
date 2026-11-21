/**
 * Shared scene presence utilities used by both the turn API (backend)
 * and the play page (frontend) to keep `presentCompanions` & `party.isPresent`
 * accurately synchronized with who is actually physically present in the room.
 */

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves a raw/partial companion name (e.g., "Clara", "Clara Callahan (Landlady)", "Tina")
 * to its exact canonical full name from `castNames`.
 */
export function matchCanonicalCompanionName(
  candidate: string | null | undefined,
  castNames: string[]
): string | null {
  if (!candidate || typeof candidate !== "string") return null;
  const clean = candidate.trim();
  if (!clean) return null;
  const cleanLower = clean.toLowerCase();

  if (
    cleanLower === "narrator" ||
    cleanLower === "system" ||
    cleanLower === "inner monologue" ||
    cleanLower === "none" ||
    cleanLower === "solo"
  ) {
    return null;
  }

  // 1. Exact full-name match
  const exact = castNames.find((n) => n.toLowerCase() === cleanLower);
  if (exact) return exact;

  // 2. Substring match in either direction (e.g. "Clara Callahan (Landlady)" vs "Clara Callahan")
  const bidir = castNames.find((n) => {
    const nl = n.toLowerCase();
    return nl.includes(cleanLower) || cleanLower.includes(nl);
  });
  if (bidir) return bidir;

  // 3. First-name match (when candidate starts with or equals a cast member's first name)
  const candFirst = cleanLower.split(/[\s,(]+/)[0];
  if (candFirst && candFirst.length >= 3) {
    const firstMatches = castNames.filter(
      (n) => n.toLowerCase().split(/\s+/)[0] === candFirst
    );
    if (firstMatches.length === 1) return firstMatches[0];
  }

  return null;
}

const PHYSICAL_ACTION_VERB_PATTERN =
  /\b(?:says?|said|asks?|asked|replies|replied|answers?|answered|laughs?|laughed|chuckles?|chuckled|giggles?|giggled|snorts?|snorted|scoffs?|scoffed|smirks?|smirked|grins?|grinned|smiles?|smiled|frowns?|frowned|sighs?|sighed|mutters?|muttered|murmurs?|murmured|whispers?|whispered|snaps?|snapped|teases?|teased|calls?\s+out|chimes?\s+in|interrupts?|interrupted|retorts?|retorted|groans?|groaned|blinks?|blinked|nods?|nodded|shrugs?|shrugged|shakes?\s+her\s+head|raises?|raised|lifts?|lifted|sets?\s+down|pours?|poured|leans?|leaned|sits?|sat|stands?|stood|steps?|stepped|turns?|turned|looks?|looked|glances?|glanced|stares?|stared|watches?|watched|eyes|eyed|crosses?\s+her\s+arms|tucks?|tucked|wipes?|wiped|reaches?|reached|grabs?|grabbed|holds?|held|slides?|slid|hands?|handed|points?|pointed|waves?|waved|walks?\s+in|walked\s+in|comes?\s+in|came\s+in|enters?|entered|appears?|appeared|freezes?|froze|flushes?|flushed|blushes?|blushed|bites?\s+her\s+lip|taps?|tapped|perches?|perched|lounges?|lounged|cooks?|cooked|stirs?|stirred|sips?|sipped|drinks?|drank|exhales?|exhaled|inhales?|inhaled|tilts?\s+her\s+head|rolls?\s+her\s+eyes|hums?|hummed|snickers?|snickered|cuts?\s+in|pipes?\s+up|adds?|added|gestures?|gestured|shifts?|shifted|rises?|rose|drops?|dropped|catches?|caught|nudges?|nudged|elbows?|elbowed|pulls?|pulled|pushes?|pushed|presses?|pressed)\b/i;

const POSSESSIVE_PRESENCE_PATTERN =
  /['’]s\s+(?:eyes|gaze|voice|hand|hands|fingers|lips|mouth|smile|smirk|grin|brow|eyebrow|eyebrows|chin|shoulder|shoulders|hip|hips|waist|thigh|thighs|knees|legs|hair|head|cheek|cheeks|neck|collarbone|chest|mug|cup|glass|coffee|phone|cigarette|bottle|apron|towel|robe|shirt|heel|heels|foot|feet|expression|tone|laugh|chuckle|sigh)\b/i;

const ABSENCE_OR_HEARSAY_PATTERN =
  /\b(?:isn['’]t\s+here|is\s+not\s+here|wasn['’]t\s+here|not\s+in\s+the\s+(?:room|kitchen|house|hallway)|still\s+(?:upstairs|downstairs|asleep|in\s+her\s+room|at\s+work|out)|at\s+the\s+(?:diner|lounge|bar|office|club)|out\s+for\s+the\s+night|wonder\s+where|haven['’]t\s+seen|texted\s+(?:you|me|her)|on\s+the\s+phone|over\s+the\s+phone|left\s+a\s+note)\b/i;

const DEPARTURE_PATTERN =
  /\b(?:walks?\s+out|walked\s+out|steps?\s+out|stepped\s+out|leaves?\s+the\s+(?:room|kitchen|living\s+room|den|hallway|patio|diner|bar|lounge)|left\s+the\s+(?:room|kitchen|living\s+room|den|hallway|patio|diner|bar|lounge)|heads?\s+(?:upstairs|back\s+to\s+her\s+room|out\s+the\s+door)|headed\s+(?:upstairs|back\s+to\s+her\s+room|out\s+the\s+door)|disappears?\s+(?:upstairs|down\s+the\s+hall|around\s+the\s+corner)|closes?\s+the\s+door\s+behind\s+her|shuts?\s+the\s+door\s+behind\s+her)\b/i;

/**
 * Reconciles which cast members are physically present in the scene at the end of a turn,
 * combining explicit model output (`rawPresentList`, `speaker`) with conservative prose
 * evidence so multi-character scenes (e.g. multiple heroines in the kitchen) never get
 * stuck in "Solo Scene" or drop newly arrived heroines.
 */
export function detectPresentCompanionsFromProse(params: {
  prose: string;
  speaker?: string | null;
  rawPresentList?: string[] | null;
  castNames: string[];
  fallenNames?: Set<string> | string[];
}): string[] {
  const fallenSet = new Set<string>(
    Array.from(params.fallenNames || []).map((n) => String(n || "").trim().toLowerCase())
  );
  const validCast = (params.castNames || []).filter(
    (n) => Boolean(n) && !fallenSet.has(n.trim().toLowerCase())
  );
  if (validCast.length === 0) return [];

  const result: string[] = [];
  const addUnique = (name: string | null) => {
    if (!name) return;
    if (fallenSet.has(name.toLowerCase())) return;
    if (!result.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      result.push(name);
    }
  };

  // 1. Normalize explicit present_companions returned by the model
  if (Array.isArray(params.rawPresentList)) {
    for (const rawName of params.rawPresentList) {
      addUnique(matchCanonicalCompanionName(rawName, validCast));
    }
  }

  // 2. Include active speaker if it maps to a valid non-fallen cast member
  addUnique(matchCanonicalCompanionName(params.speaker, validCast));

  // 3. Scan prose for any cast members clearly physically present & acting/speaking
  const prose = (params.prose || "").trim();
  if (!prose) return result;

  // Build unique-first-name map so shared first names never false-match
  const firstNameCounts = new Map<string, number>();
  for (const fullName of validCast) {
    const first = fullName.split(/\s+/)[0].toLowerCase();
    firstNameCounts.set(first, (firstNameCounts.get(first) || 0) + 1);
  }

  const paragraphs = prose
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const fullName of validCast) {
    const first = fullName.split(/\s+/)[0];
    const useFirstName =
      first.length >= 3 && (firstNameCounts.get(first.toLowerCase()) || 0) === 1;
    const nameRegex = useFirstName
      ? new RegExp(`\\b(?:${escapeRegex(fullName)}|${escapeRegex(first)})\\b`, "i")
      : new RegExp(`\\b${escapeRegex(fullName)}\\b`, "i");

    let hasPhysicalPresence = false;
    let departedAtEnd = false;

    for (let idx = 0; idx < paragraphs.length; idx++) {
      const para = paragraphs[idx];
      if (!nameRegex.test(para)) continue;

      // Split into sentences so another character's sentence doesn't taint this one
      const sentences = para.split(/(?<=[.!?]["”']?)\s+/).filter(Boolean);
      for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
        const sent = sentences[sIdx];
        if (!nameRegex.test(sent)) continue;

        if (DEPARTURE_PATTERN.test(sent)) {
          // If this is near the end of the passage, note that she left the room
          if (idx >= paragraphs.length - 2) {
            departedAtEnd = true;
          }
          continue;
        }

        if (ABSENCE_OR_HEARSAY_PATTERN.test(sent)) {
          continue;
        }

        // Check for physical action verb, possessive body/prop cue, or direct dialogue attribution
        const hasAction = PHYSICAL_ACTION_VERB_PATTERN.test(sent);
        const hasPossessive = new RegExp(
          `(?:${escapeRegex(fullName)}${useFirstName ? `|${escapeRegex(first)}` : ""})${POSSESSIVE_PRESENCE_PATTERN.source}`,
          "i"
        ).test(sent);
        const hasDialogueInPara = /["“][^"”]{2,}["”]/.test(para);

        if (hasAction || hasPossessive || (hasDialogueInPara && sent.length <= 220)) {
          hasPhysicalPresence = true;
          departedAtEnd = false;
        }
      }
    }

    if (hasPhysicalPresence && !departedAtEnd) {
      addUnique(fullName);
    } else if (departedAtEnd) {
      // Remove if she explicitly walked out at the end of the turn
      const removeIdx = result.findIndex((r) => r.toLowerCase() === fullName.toLowerCase());
      if (removeIdx !== -1 && result.length > 0) {
        result.splice(removeIdx, 1);
      }
    }
  }

  return result;
}
