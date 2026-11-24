/**
 * Shared scene presence utilities used by both the turn API (backend)
 * and the play page (frontend) to keep `presentCompanions` & `party.isPresent`
 * accurately synchronized with who is actually physically present in the room—
 * while strictly ignoring absent characters who are merely mentioned in dialogue.
 */

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips all spoken dialogue spans ("..." and “...”) so names mentioned aloud
 * by another character never trigger narrator physical-presence detection.
 */
export function stripQuotedDialogue(text: string): string {
  if (!text) return "";
  return text
    .replace(/“[^”]*”/g, ' "" ')
    .replace(/"[^"\n]*"/g, ' "" ');
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

  // 3. First-name match (when candidate starts with or equals a unique cast member's first name)
  const candFirst = cleanLower.split(/[\s,(]+/)[0];
  if (candFirst && candFirst.length >= 3) {
    const firstMatches = castNames.filter(
      (n) => n.toLowerCase().split(/\s+/)[0] === candFirst
    );
    if (firstMatches.length === 1) return firstMatches[0];
  }

  return null;
}

const SUBJECT_ACTION_VERBS_SOURCE =
  "(?:says?|said|asks?|asked|replies|replied|answers?|answered|laughs?|laughed|chuckles?|chuckled|giggles?|giggled|snorts?|snorted|scoffs?|scoffed|smirks?|smirked|grins?|grinned|smiles?|smiled|frowns?|frowned|sighs?|sighed|mutters?|muttered|murmurs?|murmured|whispers?|whispered|snaps?|snapped|teases?|teased|calls?\\s+out|chimes?\\s+in|interrupts?|interrupted|retorts?|retorted|groans?|groaned|blinks?|blinked|nods?|nodded|shrugs?|shrugged|shakes?\\s+her\\s+head|raises?|raised|lifts?|lifted|sets?\\s+down|pours?|poured|leans?|leaned|sits?|sat|stands?|stood|steps?|stepped|turns?|turned|looks?|looked|glances?|glanced|stares?|stared|watches?|watched|eyes|eyed|crosses?\\s+her\\s+arms|tucks?|tucked|wipes?|wiped|reaches?|reached|grabs?|grabbed|holds?|held|slides?|slid|hands?|handed|points?|pointed|waves?|waved|walks?\\s+in|walked\\s+in|walks?\\s+into|walked\\s+into|comes?\\s+in|came\\s+in|enters?|entered|appears?|appeared|freezes?|froze|flushes?|flushed|blushes?|blushed|bites?\\s+her\\s+lip|taps?|tapped|perches?|perched|lounges?|lounged|cooks?|cooked|stirs?|stirred|sips?|sipped|drinks?|drank|exhales?|exhaled|inhales?|inhaled|tilts?\\s+her\\s+head|rolls?\\s+her\\s+eyes|hums?|hummed|snickers?|snickered|cuts?\\s+in|pipes?\\s+up|adds?|added|gestures?|gestured|shifts?|shifted|rises?|rose|catches?|caught|nudges?|nudged|elbows?|elbowed|pulls?|pulled|pushes?|pushed|presses?|pressed)\\b";

const BODY_POSSESSIVE_SOURCE =
  "['’]s\\s+(?:eyes|gaze|voice|hand|hands|fingers|lips|mouth|smile|smirk|grin|brow|eyebrow|eyebrows|chin|shoulder|shoulders|hip|hips|waist|thigh|thighs|breath|laugh|chuckle|sigh|expression|posture)\\s+(?:widen\\w*|narrow\\w*|lock\\w*|flick\\w*|drop\\w*|soften\\w*|tighten\\w*|brush\\w*|rest\\w*|curl\\w*|part\\w*|twitch\\w*|lift\\w*|arch\\w*|catch\\w*|hitch\\w*|echo\\w*|cut\\w*|ring\\w*|trail\\w*|land\\w*|meet\\w*|find\\w*|darken\\w*|light\\w*|flush\\w*|warm\\w*|slip\\w*|press\\w*|lingers?|darts?|drifts?|snaps?|breaks?)\\b";

const INDIRECT_OR_HEARSAY_PREFIX_PATTERN =
  /\b(?:about|mention(?:s|ed|ing)?|ask(?:s|ed|ing)?\s+about|talk(?:s|ed|ing)?\s+about|think(?:s|ing)?\s+(?:of|about)|thought\s+(?:of|about)|remind(?:s|ed)?\s+\w+\s+of|like|unlike|than|except|besides|without|where|whether|if|text(?:s|ed|ing)?|voicemail\s+from|message\s+from|note\s+from|waiting\s+for|looking\s+for|check(?:s|ed|ing)?\s+on)\s*$/i;

const NON_PRESENCE_POSSESSIVE_SUFFIX_PATTERN =
  /^['’]s\s+(?:room|bedroom|studio|parlor|door|bed|desk|closet|clothes|laundry|mug|cup|glass|note|car|shift|schedule|text|texts|message|voicemail|stuff|things|shoes|heels|boots|jacket|coat|keys|towel|phone|side|name|rent|share|sister|mother|ex)\b/i;

const ABSENCE_OR_HEARSAY_SENTENCE_PATTERN =
  /\b(?:isn['’]t\s+here|is\s+not\s+here|wasn['’]t\s+here|not\s+in\s+the\s+(?:room|kitchen|house|hallway)|still\s+(?:upstairs|downstairs|asleep|sleeping|in\s+her\s+room|at\s+work|out)|upstairs\s+in\s+(?:her|room)|at\s+the\s+(?:diner|lounge|bar|office|club)|out\s+for\s+the\s+night|wonder\s+where|haven['’]t\s+seen|texted\s+(?:you|me|her)|on\s+the\s+phone|over\s+the\s+phone|left\s+a\s+note|at\s+work\s+until)\b/i;

const DEPARTURE_VERB_SOURCE =
  "(?:walks?\\s+out|walked\\s+out|steps?\\s+out|stepped\\s+out|leaves?\\s+the\\s+(?:room|kitchen|living\\s+room|den|parlor|hallway|patio|porch|diner|bar|lounge|house)|left\\s+the\\s+(?:room|kitchen|living\\s+room|den|parlor|hallway|patio|porch|diner|bar|lounge|house)|heads?\\s+(?:upstairs|out|back\\s+to\\s+her\\s+room|for\\s+the\\s+door|to\\s+work)|headed\\s+(?:upstairs|out|back\\s+to\\s+her\\s+room|for\\s+the\\s+door|to\\s+work)|disappears?\\s+(?:upstairs|down\\s+the\\s+hall|around\\s+the\\s+corner|out\\s+the\\s+door)|closes?\\s+the\\s+door\\s+behind\\s+her|shuts?\\s+the\\s+door\\s+behind\\s+her|slips?\\s+out\\s+of\\s+the\\s+room)\\b";

/**
 * Inspects ONLY unquoted narrator stage directions to determine whether a cast member
 * is physically acting/speaking in the room as a grammatical subject (or explicitly walked out).
 */
export function evaluateNarratorPhysicalEvidence(params: {
  unquotedProse: string;
  fullName: string;
  useFirstName: boolean;
}): { hasPhysicalPresence: boolean; departedAtEnd: boolean; mentionedOutsideQuotes: boolean } {
  const first = params.fullName.split(/\s+/)[0];
  const nameGroup = params.useFirstName
    ? `(?:${escapeRegex(params.fullName)}|${escapeRegex(first)})`
    : `(?:${escapeRegex(params.fullName)})`;

  const anyUnquotedNameRegex = new RegExp(`\\b${nameGroup}\\b`, "i");
  if (!anyUnquotedNameRegex.test(params.unquotedProse)) {
    return { hasPhysicalPresence: false, departedAtEnd: false, mentionedOutsideQuotes: false };
  }

  const subjectActionRegex = new RegExp(
    `\\b(${nameGroup})(?:\\s*,?\\s+(?:already|still|quietly|softly|slowly|abruptly|suddenly|immediately|barely|just|finally|meanwhile|though|even\\s+now))?\\s+${SUBJECT_ACTION_VERBS_SOURCE}`,
    "ig"
  );
  const bodyPossessiveRegex = new RegExp(`\\b(${nameGroup})${BODY_POSSESSIVE_SOURCE}`, "ig");
  const departureSubjectRegex = new RegExp(
    `\\b(${nameGroup})(?:\\s+[^.!?;,]{0,28})?\\s+${DEPARTURE_VERB_SOURCE}`,
    "i"
  );

  const paragraphs = params.unquotedProse
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let hasPhysicalPresence = false;
  let departedAtEnd = false;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    if (!anyUnquotedNameRegex.test(para)) continue;

    const sentences = para.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const sent of sentences) {
      if (!anyUnquotedNameRegex.test(sent)) continue;

      if (departureSubjectRegex.test(sent)) {
        if (pIdx >= Math.max(0, paragraphs.length - 2)) {
          departedAtEnd = true;
        }
        continue;
      }

      if (ABSENCE_OR_HEARSAY_SENTENCE_PATTERN.test(sent)) {
        continue;
      }

      // Check subject-verb matches while verifying prefix isn't "about <Name>" / "like <Name>"
      subjectActionRegex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = subjectActionRegex.exec(sent)) !== null) {
        const prefix = sent.slice(0, match.index);
        const afterName = sent.slice(match.index + match[1].length);
        if (INDIRECT_OR_HEARSAY_PREFIX_PATTERN.test(prefix)) continue;
        if (NON_PRESENCE_POSSESSIVE_SUFFIX_PATTERN.test(afterName)) continue;
        hasPhysicalPresence = true;
        departedAtEnd = false;
        break;
      }

      if (!hasPhysicalPresence) {
        bodyPossessiveRegex.lastIndex = 0;
        let pMatch: RegExpExecArray | null;
        while ((pMatch = bodyPossessiveRegex.exec(sent)) !== null) {
          const prefix = sent.slice(0, pMatch.index);
          if (INDIRECT_OR_HEARSAY_PREFIX_PATTERN.test(prefix)) continue;
          hasPhysicalPresence = true;
          departedAtEnd = false;
          break;
        }
      }
    }
  }

  return { hasPhysicalPresence, departedAtEnd, mentionedOutsideQuotes: true };
}

/**
 * Reconciles which cast members are physically present in the scene at the end of a turn:
 * 1. Strips all spoken dialogue ("...") BEFORE scanning prose so mentioned guests never spawn as ghosts.
 * 2. Filters out Pass 2 `rawPresentList` hallucinations when a character was NOT previously in the room,
 *    NOT scheduled in the room, NOT the active speaker, and has ZERO unquoted narrator physical actions.
 * 3. Removes characters who explicitly walked out / departed at the end of the turn.
 */
export function detectPresentCompanionsFromProse(params: {
  prose: string;
  speaker?: string | null;
  rawPresentList?: string[] | null;
  previouslyPresentNames?: string[] | null;
  scheduledInRoomNames?: string[] | null;
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

  const firstNameCounts = new Map<string, number>();
  for (const fullName of validCast) {
    const first = fullName.split(/\s+/)[0].toLowerCase();
    firstNameCounts.set(first, (firstNameCounts.get(first) || 0) + 1);
  }

  const prose = (params.prose || "").trim();
  const unquotedProse = stripQuotedDialogue(prose);

  // Pre-evaluate narrator physical evidence for each cast member
  const evidenceByCast = new Map<
    string,
    { hasPhysicalPresence: boolean; departedAtEnd: boolean; mentionedOutsideQuotes: boolean; mentionedInRawProse: boolean }
  >();
  for (const fullName of validCast) {
    const first = fullName.split(/\s+/)[0];
    const useFirstName =
      first.length >= 3 && (firstNameCounts.get(first.toLowerCase()) || 0) === 1;
    const rawRegex = useFirstName
      ? new RegExp(`\\b(?:${escapeRegex(fullName)}|${escapeRegex(first)})\\b`, "i")
      : new RegExp(`\\b${escapeRegex(fullName)}\\b`, "i");
    const ev = prose
      ? evaluateNarratorPhysicalEvidence({ unquotedProse, fullName, useFirstName })
      : { hasPhysicalPresence: false, departedAtEnd: false, mentionedOutsideQuotes: false };
    evidenceByCast.set(fullName.toLowerCase(), {
      ...ev,
      mentionedInRawProse: prose ? rawRegex.test(prose) : false,
    });
  }

  const trustedBaselineSet = new Set<string>();
  const hasBaselineContext =
    Array.isArray(params.previouslyPresentNames) || Array.isArray(params.scheduledInRoomNames);

  for (const prev of params.previouslyPresentNames || []) {
    const canon = matchCanonicalCompanionName(prev, validCast);
    if (canon) trustedBaselineSet.add(canon.toLowerCase());
  }
  for (const sched of params.scheduledInRoomNames || []) {
    const canon = matchCanonicalCompanionName(sched, validCast);
    if (canon) trustedBaselineSet.add(canon.toLowerCase());
  }

  const canonicalSpeaker = matchCanonicalCompanionName(params.speaker, validCast);
  const result: string[] = [];
  const addUnique = (name: string | null) => {
    if (!name) return;
    if (fallenSet.has(name.toLowerCase())) return;
    if (!result.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      result.push(name);
    }
  };

  // 1. Validate explicit `rawPresentList` against spoken-mention hallucinations
  if (Array.isArray(params.rawPresentList)) {
    for (const rawName of params.rawPresentList) {
      const canon = matchCanonicalCompanionName(rawName, validCast);
      if (!canon) continue;
      const key = canon.toLowerCase();
      const ev = evidenceByCast.get(key);
      if (ev?.departedAtEnd) continue;

      const isSpeaker =
        Boolean(canonicalSpeaker) && canonicalSpeaker!.toLowerCase() === key;
      const isTrustedBaseline = trustedBaselineSet.has(key);

      if (!prose) {
        addUnique(canon);
        continue;
      }

      // If her name ONLY appeared inside spoken quotation marks (0 unquoted occurrences) and she wasn't already here/scheduled, reject!
      if (ev && ev.mentionedInRawProse && !ev.mentionedOutsideQuotes && !isTrustedBaseline && !isSpeaker) {
        continue;
      }

      // When baseline context is known, any newly added companion MUST either be the speaker, scheduled here, or have unquoted physical action
      if (hasBaselineContext && !isTrustedBaseline && !isSpeaker && !ev?.hasPhysicalPresence) {
        continue;
      }

      addUnique(canon);
    }
  }

  // 2. Include canonical speaker (unless she explicitly departed at the end of the turn)
  if (canonicalSpeaker) {
    const spkEv = evidenceByCast.get(canonicalSpeaker.toLowerCase());
    if (!spkEv?.departedAtEnd) {
      addUnique(canonicalSpeaker);
    }
  }

  // 3. Add any cast member who has clear unquoted narrator subject-verb physical presence in the scene
  for (const fullName of validCast) {
    const ev = evidenceByCast.get(fullName.toLowerCase());
    if (ev?.hasPhysicalPresence && !ev.departedAtEnd) {
      addUnique(fullName);
    }
  }

  return result;
}
