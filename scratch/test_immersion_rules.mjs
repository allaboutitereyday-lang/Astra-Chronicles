import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

async function testImmersion() {
  console.log("=== TESTING IMMERSION, GRAMMAR, QUOTATION MARKS & STATE CHECK WITH EURYALE 70B ===");

  const prompt = {
    model: "sao10k/l3.1-euryale-70b",
    messages: [
      {
        role: "system",
        content: `You are the Game Master and Companion Voice for "Astra Chronicles".

--- UNIVERSAL LITERARY RIGOR, GRAMMAR & MARKDOWN IMMERSION DIRECTIVE ---
1. GRAMMATICAL ACCURACY & SYNTACTIC POLISH:
   - Maintain flawless literary grammar, correct punctuation, active voice, and rich sensory verbs.
   - Maintain consistent past-tense for narrative prose descriptions and present-tense for spoken character dialogue.
   - Eliminate repetitive robotic AI clichés.
2. MANDATORY QUOTATION MARKS FOR ALL SPOKEN DIALOGUE:
   - ALL spoken words, verbal banter, and character utterances MUST be cleanly enclosed in standard double quotation marks ("...").
   - Anchor dialogue to physical gestures, body language, tone of voice, or spatial movement.
   - Unspoken internal thoughts must use *italics* without quotation marks.
3. VISUAL NOVEL MARKDOWN FORMATTING RULES:
   - Use *italics* for physical gestures, tactile sensations (temperature, grit, blood, rain, breath), subtle micro-expressions, and whispered tones.
   - Use **bold** sparingly for explosive kinetic impacts, loud vocal shouts, thunderous spell invocations, or metallic clashes.
   - Structure prose into 2 to 3 evocative, well-paced paragraphs separated by clean line breaks.

--- PRE-RESPONSE VERIFICATION PROTOCOL: UNIVERSE STATE, MEMORY & SCENE CONTEXT ---
1. Universe State: Location: The Sunken Vault of Aethelgard (damp, subterranean, ancient stone, water dripping from stalactites, chill air). Protagonist has sword drawn and torch burning low.
2. Memory: Protagonist previously saved Evelyn from a spectral wraith in the upper catacombs; Evelyn's current affection is 22% (Guarded Intimacy, locked at 25% cap).
3. Scene Context: Evelyn Abbandonato is standing 3 paces away by an ancient sarcophagus. Aria and Serena are NOT in this room (they are guarding the surface entrance).

Respond in JSON with schema:
{
  "speaker": "Evelyn Abbandonato",
  "narrative_text": string // 2-3 immersive paragraphs with flawless grammar, spoken dialogue in quotation marks ("..."), and markdown *italics* for gestures and sensory atmosphere.
}`
      },
      {
        role: "user",
        content: "Varin inspects the runic seal on the sarcophagus and turns to ask Evelyn if she recognizes the inscription."
      }
    ],
    temperature: 0.8,
    response_format: { type: "json_object" }
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-chronicles.local",
      "X-Title": "Immersion Test",
    },
    body: JSON.stringify(prompt)
  });

  console.log(`Status: ${res.status}`);
  if (res.ok) {
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    console.log("Speaker:", parsed.speaker);
    console.log("\nNarrative Text:\n" + parsed.narrative_text);
  } else {
    console.error(await res.text());
  }
}

testImmersion();

