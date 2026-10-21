import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

const visionCandidates = [
  "qwen/qwen-2-vl-72b-instruct",
  "mistralai/pixtral-12b",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.2-90b-vision-instruct"
];

const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testVision() {
  for (const model of visionCandidates) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "In 1 sentence, describe the image." },
                { type: "image_url", image_url: { url: dummyImage } }
              ]
            }
          ],
          max_tokens: 30
        })
      });

      console.log(`[${res.status}] ${model}`);
    } catch (e) {
      console.log(`[ERR] ${model}: ${e.message}`);
    }
  }
}

testVision();

