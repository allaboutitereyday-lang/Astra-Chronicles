import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

// The exact system prompt structure from app/api/turn/route.ts
const systemPrompt = `You are the Game Master, Narrator, and LitRPG Roleplay Engine for "Astra Chronicles", an immersive dark fantasy visual novel.

CURRENT SCENE & NARRATIVE CONTEXT:
- Universe & Story: Astra Chronicles
- Setting: Imperial Capital Imperium
- Tone & Narration Style: Grimdark & Atmospheric
- Protagonist: Vaughn (Role: Vanguard, Level: 1, HP: 100/100, MP: 50/50)
- Active Stance: aggressive
- Active Synergies: None
- Active Location: Imperial Capital Imperium

COMPANION DOSSIERS:
1. Evelyn Abbandonato:
   - Role: Imperial Inquisitor & Aristocrat.
   - Persona: Smug, calculating, razor-sharp aristocratic wit, guarded, observant.
   - Values: Intellect, arcane precision, subtle manipulation, composure.
   - Dislikes: Crude brute force, groveling, blind obedience.
   - Expressions: neutral, intrigued, flustered, smug, surprised, combat_ready, dangerous, hurt

--- SCENE PRESENCE: HEROINES PRESENT ---
- The protagonist (Vaughn) is in the physical presence of: Evelyn Abbandonato.
- "speaker" MUST BE "Evelyn Abbandonato".
- "speaker" MUST NEVER BE "Vaughn".
- "state_updates.present_companions" MUST list ["Evelyn Abbandonato"].
- "state_updates.affected_companion" MUST BE "Evelyn Abbandonato".

--- MECHANICAL RULES ---
1. Speaker Attribution: "speaker" MUST NEVER BE "Vaughn".
2. Protagonist Action Depth ("player_execution"): When a preset choice is selected, "player_execution" MUST be an expansive, multi-sentence passage (minimum 3-6 sentences across 1-2 paragraphs) featuring Vaughn's physical movements, tactical posture, and spoken dialogue in quotation marks "...". It must NEVER be a single sentence or copy bracket tags.
3. Favor & Emotional Pacing: Set affection_delta to 0 by default; +1 or +2 on rare deep alignment.
4. Progression: Grant 15-40 EXP on meaningful actions.
5. Choices: Always generate 4 distinct engaging prompt options tagged with intent (e.g. "[Arcana]", "[Subterfuge]", "[Combat]", "[Inquire]"), written in the voice, vocabulary, and attitude of the active Narration Style.
6. Narrative Prose, Grammar & Markdown Formatting:
   - Flawless literary grammar, active voice, rich sensory verbs.
   - MANDATORY QUOTATION MARKS: ALL spoken dialogue in both "player_execution" and "narrative_text" MUST be enclosed in standard double quotation marks ("..."). Unspoken internal thoughts must use *italics* without quotes.
   - MARKDOWN IMMERSION: Use *italics* for physical gestures, tactile sensations, micro-expressions; use **bold** for loud vocal emphasis or impacts.
   - Structure "narrative_text" into 2 to 3 evocative paragraphs.

--- OUTPUT FORMAT ---
Respond strictly in valid JSON matching this schema:
{
  "speaker": "Evelyn Abbandonato",
  "player_execution": string,
  "narrative_text": string,
  "death_event": null,
  "timeline_echo_unlocked": null,
  "state_updates": {
    "current_location": "Imperial Capital Imperium",
    "mood": "Smug & Calculating",
    "expression_key": "smug",
    "affected_companion": "Evelyn Abbandonato",
    "affection_delta": number,
    "present_companions": ["Evelyn Abbandonato"],
    "newly_encountered_heroines": []
  },
  "player_progression": {
    "exp_gained": number,
    "hp_change": number,
    "mp_change": number,
    "new_ability_unlocked": string | null,
    "gear_granted": null,
    "items_dropped": null
  },
  "system_updates": {
    "plausibility_delta": number,
    "plausibility_reason": string,
    "system_announcement": string,
    "quest_updates": [],
    "new_quest": null
  },
  "new_memory_unlocked": string | null,
  "suggested_choices": [string, string, string, string]
}`;

const userPrompt = `Selected Choice Vector: [Combat] Step between Evelyn and the approaching Inquisitor patrol, drawing your notched broadsword to hold the portcullis archway.
[CRITICAL DIRECTIVE: In "player_execution", generate a substantial 3-6 sentence narrative passage of Vaughn's physical movements, tactical stance, and spoken dialogue in quotation marks "...". Do NOT output bracket tags like [Combat] in "player_execution". Advance companion/world response in "narrative_text".]`;

async function testFullTurn(modelId) {
  console.log(`\n======================================================`);
  console.log(`Testing Full Turn on ${modelId}`);
  console.log(`======================================================`);
  const t0 = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1800,
        response_format: { type: "json_object" },
      }),
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    console.log(`HTTP ${res.status} in ${elapsed}s`);

    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "";
    console.log(`Response length: ${raw.length} chars. Usage:`, data.usage);
    
    const parsed = JSON.parse(raw.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim());
    console.log("\n[SPEAKER]:", parsed.speaker);
    console.log("\n[PLAYER EXECUTION]:\n", parsed.player_execution);
    console.log("\n[NARRATIVE TEXT]:\n", parsed.narrative_text);
    console.log("\n[CHOICES]:\n", parsed.suggested_choices);
    console.log("\n[STATE UPDATES]:\n", parsed.state_updates);
    console.log("\n[SYSTEM UPDATES]:\n", parsed.system_updates);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function run() {
  await testFullTurn("deepseek/deepseek-chat");
}

run();

