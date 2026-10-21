import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

// Tiny 1x1 green image
const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testVisionEncoder() {
  const VISION_MODELS = [
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini",
    "qwen/qwen-2-vl-72b-instruct"
  ];

  for (const model of VISION_MODELS) {
    console.log(`Testing Vision Encoder with: ${model}...`);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://astra-chronicles.local",
          "X-Title": "Astra Chronicles Vision Encoder"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "You are a visual novel art director. In 2 concise, evocative sentences, describe the physical appearance, hair, attire, and expression in this character portrait for a dark fantasy visual novel protagonist named Varin (Exiled Vanguard Knight)."
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this protagonist portrait." },
                { type: "image_url", image_url: { url: dummyImage } }
              ]
            }
          ],
          max_tokens: 120,
          temperature: 0.7
        })
      });

      console.log(`Status for ${model}: ${res.status}`);
      if (res.ok) {
        const d = await res.json();
        console.log("Vision Output:", d.choices?.[0]?.message?.content?.trim());
        break;
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

testVisionEncoder();

