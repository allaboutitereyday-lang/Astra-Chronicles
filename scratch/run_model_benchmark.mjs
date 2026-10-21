import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const match = envFile.match(/^OPENROUTER_API_KEY=(.+)$/m);
const apiKey = match ? match[1].trim().replace(/^["']|["']$/g, '') : null;

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY in .env.local");
  process.exit(1);
}

const MODELS = [
  { id: "deepseek/deepseek-chat", name: "DeepSeek Chat (V3)", role: "CONTROL VARIABLE" },
  { id: "sao10k/l3.1-euryale-70b", name: "Sao10K: Euryale 70B (v2.2)", role: "Flagship RP & ERP" },
  { id: "nousresearch/hermes-3-llama-3.1-70b", name: "Nous Hermes 3 (70B)", role: "Storytelling & LitRPG" },
  { id: "sao10k/l3-lunaris-8b", name: "Sao10K: Lunaris 8B", role: "Fast RP" },
  { id: "gryphe/mythomax-l2-13b", name: "MythoMax 13B", role: "Classic Fiction" },
  { id: "nousresearch/hermes-3-llama-3.1-405b", name: "Nous Hermes 3 (405B)", role: "Pinnacle Flagship" },
];

const SYSTEM_PROMPT = `You are Perci, the timid yet fiercely determined Kitsune Rogue in "Astra Chronicles".
Persona: Anxious, hyper-vigilant, wary of larger predators, but possessing a stubborn, guarded spirit. She has fluffy fox ears, expressive golden eyes, and multiple golden tails that betray her emotions.
Protagonist: Vaughn, a towering beast-kin warrior (broad-shouldered, tattered cloak, faint orange-red fur markings, sharp canines, deep rumbling voice).

STRICT WRITING & IMMERSION DIRECTIVES:
1. GRAMMAR & PROSE: Flawless literary prose and punctuation.
2. DIALOGUE FORMAT: ALL spoken words MUST be enclosed in standard double quotation marks ("..."). Anchor dialogue to physical gestures, voice inflections, or ear/tail movements.
3. VISUAL NOVEL MARKDOWN: Use *italics* for physical actions, micro-expressions, breath, and tactile sensations.
4. LENGTH: 1 to 2 rich, evocative paragraphs.`;

const NEUTRAL_PROMPT = `[SCENE: Docks of Sector 4 at dusk. Cold salt mist rolls across the planks.]
Vaughn leans against the weathered timber post, crossing his arms as he reviews the supply manifest. "The imperial patrol sweeps the eastern docks in twenty minutes. If your contact left the lockbox under the fourth pallet, we take it and move without drawing steel."

Generate Perci's response to Vaughn's plan:`;

const TENSION_ROMANCE_PROMPT = `[SCENE CONTINUATION: Following Vaughn's advance where Perci is pressed against the wooden cargo pallet, dagger trembling.]
Vaughn does not retreat; instead, he closes the final few inches, one large clawed hand planting flat against the timber pallet right beside Perci's head, effectively caging her against the wood. His warm breath stirs the fur at her ear as his grey eyes lock onto her golden gaze with intense, unhurried heat. "And if I do, little fox?" he murmurs, his deep voice vibrating in his chest. "Are you going to stick that trembling little dagger between my ribs... or admit your heart is hammering as hard as mine?"

Generate Perci's response to this close physical proximity, vulnerability, and romantic tension:`;

async function queryModel(modelId, promptText) {
  const startTime = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astra-chronicles.local",
        "X-Title": "Astra Chronicles Benchmark",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptText },
        ],
        temperature: 0.85,
        max_tokens: 400,
      }),
    });

    const latency = Date.now() - startTime;
    if (!res.ok) {
      const err = await res.text();
      return { success: false, status: res.status, error: err, latency };
    }
    const data = await res.json();
    return {
      success: true,
      text: data.choices?.[0]?.message?.content?.trim() || "",
      latency,
      usage: data.usage || null,
    };
  } catch (e) {
    return { success: false, error: e.message, latency: Date.now() - startTime };
  }
}

async function runBenchmark() {
  const results = [];

  for (const model of MODELS) {
    console.log(`\n========================================`);
    console.log(`RUNNING BENCHMARK FOR: ${model.name} (${model.id})`);
    console.log(`========================================`);

    console.log(`-> Running Test 1: Neutral Dialogue...`);
    const neutralRes = await queryModel(model.id, NEUTRAL_PROMPT);
    console.log(`   Done (${neutralRes.latency}ms) - Success: ${neutralRes.success}`);

    console.log(`-> Running Test 2: Romance & Tension...`);
    const romanceRes = await queryModel(model.id, TENSION_ROMANCE_PROMPT);
    console.log(`   Done (${romanceRes.latency}ms) - Success: ${romanceRes.success}`);

    results.push({
      model: model.name,
      modelId: model.id,
      role: model.role,
      neutral: neutralRes,
      romance: romanceRes,
    });
  }

  fs.writeFileSync('scratch/benchmark_results.json', JSON.stringify(results, null, 2));
  console.log(`\nAll benchmarks completed! Results saved to scratch/benchmark_results.json`);
}

runBenchmark();

