import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

async function testQuick(model, useJsonFormat) {
  console.log(`\nTesting ${model} (response_format: ${useJsonFormat ? "json_object" : "none"})...`);
  const t0 = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const body = {
      model,
      messages: [
        { role: "system", content: "You are the Game Master for Astra Chronicles. Respond strictly in valid JSON matching: {\"speaker\": \"Evelyn\", \"player_execution\": \"Vaughn draws his sword...\", \"narrative_text\": \"Evelyn smiles...\", \"suggested_choices\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"]}" },
        { role: "user", content: "Action: Draw blade to protect Evelyn from incoming guards." }
      ],
      temperature: 0.8,
      max_tokens: 600,
    };
    if (useJsonFormat) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    console.log(`HTTP ${res.status} in ${elapsed}s`);

    if (!res.ok) {
      const err = await res.text();
      console.log(`Error: ${err}`);
      return;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    console.log(`Generated ${content.length} chars:`);
    console.log(content.slice(0, 400));
    try {
      JSON.parse(content.replace(/^```json/m, "").replace(/^```/m, "").replace(/```$/m, "").trim());
      console.log(`-> JSON Valid!`);
    } catch (e) {
      console.log(`-> JSON INVALID: ${e.message}`);
    }
  } catch (err) {
    console.log(`Failed/Aborted: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  await testQuick("deepseek/deepseek-chat", true);
  await testQuick("sao10k/l3.1-euryale-70b", true);
  await testQuick("sao10k/l3.1-euryale-70b", false);
  await testQuick("nousresearch/hermes-3-llama-3.1-70b", true);
}

main();

