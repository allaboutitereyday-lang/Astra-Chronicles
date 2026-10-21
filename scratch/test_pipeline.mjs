import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY in .env.local");
  process.exit(1);
}

// Read real portrait from public/characters/evelyn/evelyn_neutral.png
const imgBuffer = fs.readFileSync('public/characters/evelyn/evelyn_neutral.png');
const sampleAvatar = `data:image/png;base64,${imgBuffer.toString('base64')}`;

console.log(`Loaded character image: ${imgBuffer.length} bytes`);

async function runTest() {
  console.log("=== STEP 1: TEST VISION ENCODER (Gemini 2.5 Flash on OpenRouter) ===");
  const startTime = Date.now();

  const visionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-chronicles.local",
      "X-Title": "Astra Chronicles Vision Test",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are the Art Director for an immersive dark fantasy visual novel. In 2 vivid sentences, describe the physical appearance, attire, and expression in this portrait for the protagonist (Evelyn, Arcane Sorceress). Highlight hair, eyes, clothing, and overall demeanor.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this character portrait:" },
            { type: "image_url", image_url: { url: sampleAvatar } },
          ],
        },
      ],
      max_tokens: 150,
      temperature: 0.6,
    }),
  });

  console.log(`Vision Response Status: ${visionRes.status} (${Date.now() - startTime}ms)`);
  if (!visionRes.ok) {
    console.error("Vision failed:", await visionRes.text());
    return;
  }

  const visionData = await visionRes.json();
  const visualDescription = visionData.choices?.[0]?.message?.content?.trim();
  console.log(`Visual Description:\n"${visualDescription}"\n`);

  console.log("=== STEP 2: FEED VISUAL DESCRIPTION TO EURYALE 70B (TEXT-ONLY MODEL) ===");
  const euryaleStart = Date.now();

  const euryaleRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-chronicles.local",
      "X-Title": "Astra Chronicles Euryale RP Test",
    },
    body: JSON.stringify({
      model: "sao10k/l3.1-euryale-70b",
      messages: [
        {
          role: "system",
          content: `You are Aria Shadowthorn, cynical rogue infiltrator, in a dark fantasy visual novel.

--- PROTAGONIST VISUAL APPEARANCE (DERIVED FROM AVATAR) ---
Appearance of the protagonist:
"${visualDescription}"

CRITICAL DIRECTIVE: This is your first encounter with the protagonist. You MUST explicitly observe and remark upon her physical appearance, aristocratic attire, or demeanor in your dialogue or thoughts.

Respond in JSON with schema:
{
  "speaker": "Aria Shadowthorn",
  "dialogue": string,
  "internal_impression": string
}`,
        },
        {
          role: "user",
          content: "The protagonist steps out from the shadows into the lantern light of the alleyway.",
        },
      ],
      max_tokens: 300,
      temperature: 0.85,
      response_format: { type: "json_object" },
    }),
  });

  console.log(`Euryale 70B Response Status: ${euryaleRes.status} (${Date.now() - euryaleStart}ms)`);
  if (!euryaleRes.ok) {
    console.error("Euryale failed:", await euryaleRes.text());
    return;
  }

  const euryaleData = await euryaleRes.json();
  const content = euryaleData.choices?.[0]?.message?.content?.trim();
  console.log("Euryale 70B JSON Response:\n", content);
  console.log("\n=== PIPELINE TEST PASSED WITH 100% SUCCESS! ===");
}

runTest();

