import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

// Tiny 1x1 base64 png
const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const testModels = [
  "sao10k/l3-lunaris-8b",
  "sao10k/l3.1-euryale-70b",
  "deepseek/deepseek-chat"
];

async function testVisionPayload(model) {
  console.log(`\nTesting ${model} with image_url payload...`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://astra-chronicles.local",
      "X-Title": "Astra Chronicles"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe what you see." },
            { type: "image_url", image_url: { url: dummyImage } }
          ]
        }
      ]
    })
  });

  console.log(`Status for ${model}: ${res.status}`);
  const text = await res.text();
  console.log(`Body for ${model}:`, text);
}

async function run() {
  for (const m of testModels) {
    await testVisionPayload(m);
  }
}

run();

