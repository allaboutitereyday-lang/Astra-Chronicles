import fs from "fs";
import path from "path";
import {
  DEFAULT_COMFYUI_URL,
  GACHA_QUALITY_PREFIX,
  GACHA_NEGATIVE_PROMPT,
  isComfyUiOnline,
  uploadReferenceToComfyUi,
  generateComfyCharacterSprite,
} from "../lib/comfyUiClient";

interface HeroineArtSpec {
  slug: string;
  name: string;
  starRank: number;
  baseSeed: number;
  appearanceAnchor: string;
  expressions: Record<
    "neutral" | "intrigued" | "flustered" | "smug" | "combat_ready" | "hurt",
    string
  >;
}

const EXPRESSION_KEYS = [
  "neutral",
  "intrigued",
  "flustered",
  "smug",
  "combat_ready",
  "hurt",
] as const;

export const STARFALL_HEROINE_ART_SPECS: HeroineArtSpec[] = [
  {
    slug: "pia_hollis",
    name: "Pia Hollis",
    starRank: 1,
    baseSeed: 410201,
    appearanceAnchor:
      "young woman, 19 years old, soft silver-white hair in neat side-braided bob with wispy bangs, warm luminous amber-gold eyes, long eyelashes, petite slender curves, ivory and navy sanctuary cleric vestments with gold trim, hand-stitched linen wrist wraps, small glowing sanctuary lantern charm at chest, fantasy gacha healer aesthetic",
    expressions: {
      neutral:
        "gentle earnest smile, hands clasped lightly near chest, calm warm posture, looking at viewer",
      intrigued:
        "curious tilted head, bright hopeful eyes widened slightly, finger touching chin thoughtfully",
      flustered:
        "deep rosy blush across cheeks, flustered startled expression, hands raised defensively near face, shy stammering look",
      smug:
        "proud determined little grin, hands on hips, puffed chest, triumphant underdog expression",
      combat_ready:
        "fierce protective glare, raising glowing golden healing staff and sanctuary ward sigil, dynamic battle stance",
      hurt:
        "wincing in pain, scuffed cheek, frayed sleeve, clutching bruised shoulder, breathing hard, stubborn tear in corner of eye",
    },
  },
  {
    slug: "lotte_klein",
    name: "Lotte Klein",
    starRank: 1,
    baseSeed: 410202,
    appearanceAnchor:
      "23 year old Eurasian woman, vibrant glowing electric-blue medium hair with messy stylish layers, luminous bright cyan-blue eyes, sleepy heavy-lidded yet energetic changeling fae charm, curvy slender figure, tailored black dress shirt with loosened black bowtie, high-waisted black pants with blue belt, sleek dark headphones resting around neck, faint pink-blue fae glamour wisps",
    expressions: {
      neutral:
        "playful half-sleepy smile, relaxed stylish posture, fingers lightly tutting to a beat, looking at viewer",
      intrigued:
        "perked up expression, glowing blue eyes sparkling with curiosity, leaning forward slightly with mischievous interest",
      flustered:
        "bright blush on cheeks, wide surprised eyes, tugging at bowtie collar nervously, flustered grin",
      smug:
        "cocky DJ smirk, one eyebrow raised, winking, faint dual pink-and-violet dream glamour aura around fingertips",
      combat_ready:
        "intense dual fae aura, half sweet-dream arcane barrier runes and half dark shadow ribbons coiling around hands, sharp battle focus",
      hurt:
        "scuffed shirt, grimacing in pain, clutching side, tousled blue hair, exhausted breathless look",
    },
  },
  {
    slug: "sable_ashgrove",
    name: "Sable Ashgrove",
    starRank: 2,
    baseSeed: 410203,
    appearanceAnchor:
      "22 year old agile rogue woman, messy dark charcoal-ash wolf-cut hair with thin side braid, sharp piercing emerald-green eyes, subtle beauty mark under eye, lithe athletic build, fitted dark slate leather scout corset vest, weathered hooded half-cloak over one shoulder, leather thigh straps and twin curved daggers at hip",
    expressions: {
      neutral:
        "cool dry half-smirk, arms loosely crossed, observant street-smart gaze, looking at viewer",
      intrigued:
        "skeptical raised eyebrow, intrigued sideways glance, twirling a small iron lockpick between fingers",
      flustered:
        "rare flustered blush, looking away slightly, pulling cloak collar up to hide reddened cheeks, biting lip",
      smug:
        "sharp teasing grin, resting hand on dagger pommel, confident victorious posture",
      combat_ready:
        "low lethal assassin stance, drawing twin dark steel daggers with shadow wisps, razor-sharp focus",
      hurt:
        "cut on cheek, torn cloak edge, gritting teeth while pressing hand over wounded ribs, defiant survivor glare",
    },
  },
  {
    slug: "onyxia_cryss",
    name: "Onyxia Cryss",
    starRank: 2,
    baseSeed: 410204,
    appearanceAnchor:
      "24 year old slender curvy woman, long silky pale-silver grey hair parted by two small glossy black horns on head, mesmerizing jewel-faceted violet and amethyst crystal eyes, delicate crystalline purple mark around right eye, black choker with polished onyx gem, sleeveless cropped black gothic maid-tactical top with white frill accents, multiple vintage pocket-watches and wristwatch straps along forearms, pleated black skirt, striped thigh-highs",
    expressions: {
      neutral:
        "calm composed expression, slight polite tilt of head, hands neatly folded, jewel eyes gleaming softly",
      intrigued:
        "fascinated wide jewel-purple eyes, holding up an ornate silver pocket watch, curious attentive expression",
      flustered:
        "shy flustered blush on pale cheeks, nervous fidgeting fingers, embarrassed introverted look",
      smug:
        "confident subtle smirk, brushing grey hair back, glowing violet crystal shards floating beside palm",
      combat_ready:
        "dynamic gunner stance, aiming twin ornate gold and silver pistols with glowing violet crystal muzzle shards",
      hurt:
        "hairline crystal cracks on shoulder, scuffed outfit, wincing softly while holding forearm, fading eye mark",
    },
  },
  {
    slug: "odette_varr",
    name: "Dame Odette Varr",
    starRank: 3,
    baseSeed: 410205,
    appearanceAnchor:
      "23 year old noble knight woman, lustrous platinum-blonde hair tied in a high regal ponytail with blue ribbon, clear earnest sapphire-blue eyes, tall statuesque build, ornate silver-and-royal-blue filigree knight breastplate over dark navy bodysuit, white gold-trimmed half-cape, embossed silver gauntlets",
    expressions: {
      neutral:
        "dignified upright posture, hand resting on sword hilt, calm honorable gaze, faint noble poise",
      intrigued:
        "earnest attentive expression, eyes slightly widened with respect, listening intently",
      flustered:
        "stiff flustered crimson blush, clearing throat with fist near mouth, averted embarrassed sapphire eyes",
      smug:
        "proud chivalric smile, chin lifted high, confident knightly assurance",
      combat_ready:
        "braced frontline vanguard stance, summoning radiant translucent azure greatshield Wall of Aesthul and raised broadsword",
      hurt:
        "dented scuffed pauldron, scratches on cheek, breathing heavily, holding cracked shield arm yet standing firm",
    },
  },
  {
    slug: "trinity_valoren",
    name: "Trinity Valoren",
    starRank: 3,
    baseSeed: 410206,
    appearanceAnchor:
      "22 year old athletic hourglass woman, vibrant teal-and-seafoam blue-green medium-long hair with swept bangs, striking deep obsidian-black eyes with silver starlight catchlights, fair skin, sleek dark-azure and silver adventurer duelist coat, leather utility belt with herb vials, refined ancient Greek-inscribed silver straight-sword in a cobalt-blue scabbard",
    expressions: {
      neutral:
        "warm confident adventurous smile, relaxed hand on blue sword scabbard, lively upright posture",
      intrigued:
        "sharp curious gaze, leaning in with adventurous interest, faint silver aura glinting along blade hilt",
      flustered:
        "surprised pink blush, flustered laugh, rubbing back of neck sheepishly",
      smug:
        "fearless playful grin,resting drawn silver sword lightly across shoulder, carefree confidence",
      combat_ready:
        "blistering sword-draw stance, silver Whisper Trail afterimage and translucent spectral phantom swordsman aura behind her",
      hurt:
        "torn sleeve, light graze on cheek and collarbone, gritting teeth while gripping sword hilt tightly",
    },
  },
  {
    slug: "abraxia",
    name: "Abraxia",
    starRank: 3,
    baseSeed: 410207,
    appearanceAnchor:
      "25 year old curvy draconian assassin woman, cascading claret-crimson wavy hair, pair of sleek curved ebon-black dragon horns arching back from crown, piercing crystalline amber-slit eyes with smoky eyeliner, alabaster skin with subtle crimson-and-obsidian dragon scales along shoulders and hips, removable spiked black lower-face half-mask pulled down around neck, form-fitting dark silver-steel ebon corset armor with dragon-bone pauldron spikes, twin curved silver kopis blades and steel waist-chain",
    expressions: {
      neutral:
        "silent intense gaze, calm lethal composure, arms folded lightly, mask resting at collar",
      intrigued:
        "narrowed calculating eyes, slight tilt of horned head, studying viewer with quiet fascination",
      flustered:
        "unexpected heat flushing pale cheeks, pulling black mask halfway up toward chin, fierce embarrassed glare",
      smug:
        "dangerous predatory smirk, glinting fang, needle-tipped gauntlet raised near lips",
      combat_ready:
        "coiled lethal strike pose, mask snapped over lower face, twin silver-steel kopis blades gleaming with green neurotoxin and ember wisps",
      hurt:
        "cracked armor plate, scorched mark on shoulder, snarling silently through pain, clutching side",
    },
  },
  {
    slug: "lyra_nocturne",
    name: "Lyra Nocturne",
    starRank: 4,
    baseSeed: 410208,
    appearanceAnchor:
      "20 year old aristocratic prodigy mage woman, long lustrous midnight-purple hair in elegant twin drill curls with silver star hairpins, glowing amethyst-violet eyes, pale porcelain skin, ornate dark-indigo and gold astral sorceress off-shoulder gown with constellation embroidery, sheer starlight sleeves, floating gilded grimoire",
    expressions: {
      neutral:
        "haughty refined expression, chin slightly raised, one hand poised gracefully, looking down slightly at viewer",
      intrigued:
        "amethyst eyes gleaming with analytical fascination, flipping grimoire page, intrigued subtle smile",
      flustered:
        "intense tsundere crimson blush, teary embarrassed eyes, pointing accusingly while looking sideways",
      smug:
        "triumphant aristocratic smirk, back of hand near lips, smug prodigy confidence",
      combat_ready:
        "dramatic spellcasting stance, hair floating slightly, blazing golden-violet constellation magic circle and starlight barrage",
      hurt:
        "disheveled twin curls, singed dress hem, wincing from mana backlash, gripping chest tightly",
    },
  },
  {
    slug: "mei_zhou",
    name: "Mei Zhou",
    starRank: 4,
    baseSeed: 410209,
    appearanceAnchor:
      "23 year old toned curvy martial artist woman, fiery crimson-red hair in a high spiky ponytail, bright warm golden-amber eyes, sun-kissed fair skin, open-shoulder crimson-and-black festival brawler cropped jacket with gold cloud trim, bandages across midriff, heavy scarred red-and-gold iron gauntlets, martial shorts with thigh wraps",
    expressions: {
      neutral:
        "big warm fearless grin, fist resting against palm, energetic big-sister posture",
      intrigued:
        "excited sparkling amber eyes, leaning forward with wide grin, eager for action",
      flustered:
        "flustered red face, startled bashful expression, waving armored hands awkwardly, shy smile",
      smug:
        "boisterous cocky laugh, thumb pointed at chest, fiery confident smirk",
      combat_ready:
        "explosive martial arts stance, emerald-and-crimson Demon's Fist flame erupting around heavy gauntlets, fierce battle cry",
      hurt:
        "bruised cheek, cracked gauntlet, wiping blood from corner of lip with a stubborn grit-teeth grin",
    },
  },
  {
    slug: "godiva",
    name: "Godiva",
    starRank: 4,
    baseSeed: 410210,
    appearanceAnchor:
      "23 year old mysterious Void Walker sorceress woman, long flowing obsidian-black hair with glowing violet inner streaks, striking luminous lavender-purple eyes, pale skin, ornate dark-violet hooded mystic cloak with silver rune clasps, fitted black-and-purple arcane corset dress, ornate porcelain soul-mask hanging at hip, dark leather Grimoire Naturom Demonto with purple void wisps",
    expressions: {
      neutral:
        "enigmatic composed gaze, faint reckless half-smile, holding dark grimoire against hip",
      intrigued:
        "fascinated glowing violet eyes, tracing a floating purple hex rune in mid-air",
      flustered:
        "caught-off-guard blush across pale cheeks, clutching grimoire tightly to chest, flustered blink",
      smug:
        "wicked alluring smirk, tilting porcelain void mask at side, dark arcane confidence",
      combat_ready:
        "unleashing twin glowing violet Hex Seal magic circles and dark void lightning from palm, billowing purple cloak",
      hurt:
        "exhausted pale expression, scuffed cloak, wincing from reckless spell strain while steadying breathing",
    },
  },
  {
    slug: "aurelle_seraph",
    name: "Aurelle, the Seraph Lance",
    starRank: 5,
    baseSeed: 410211,
    appearanceAnchor:
      "24 year old mythic valkyrie woman, waist-length flowing champagne-silver hair with feathered winged hairpiece, piercing crystalline ice-blue eyes, serene flawless features, resplendent white-and-gold mythic valkyrie plate armor with celestial blue silk, translucent spectral golden-white aural wings at shoulders, ornate radiant astral lance",
    expressions: {
      neutral:
        "cool untouchable serene expression, upright sovereign posture, holding astral lance vertically at side",
      intrigued:
        "subtle softening of ice-blue eyes, slight tilt of head, quiet attentive curiosity",
      flustered:
        "delicate rare pink blush on cool cheeks, parted lips in quiet surprise, averting gaze slightly",
      smug:
        "serene faint confident smile, golden starlight shimmering softly around shoulders, effortless supremacy",
      combat_ready:
        "mythic boss-slayer stance, four radiant spectral wings flared wide, leveling blazing eight-foot Lance of Holy Light",
      hurt:
        "cracked gold breastplate, tousled silver hair, bleeding scratch on cheek, cold unwavering gaze despite injury",
    },
  },
  {
    slug: "tashair_vice",
    name: "Ta'Shair Vice",
    starRank: 5,
    baseSeed: 410212,
    appearanceAnchor:
      "exotic Lamia monster-girl woman, Maiden of the Black Sun, soft pale-amethyst lavender skin, gorgeous glowing golden-yellow diamond-pupil eyes with dark black sclera, long sangria-burgundy hair with cropped bangs and two central locks framing nose, ornate golden-and-obsidian summoning headdress, fitted cropped black top, voluptuous hips transitioning into sleek wine-purple coiled serpent lamia lower body with lighter lavender underbelly scales",
    expressions: {
      neutral:
        "playful alluring grin, relaxed coiled lamia posture, golden diamond eyes gleaming with ancient amusement",
      intrigued:
        "curious head tilt, Forked tongue tip barely visible in playful smile, leaning closer with glowing yellow eyes",
      flustered:
        "deep violet-rose blush on amethyst cheeks, startled wide yellow eyes, hands raised in flustered surprise, tail coiling tightly",
      smug:
        "teasing dominant smirk, holding a glowing inverted-color mana card token between two fingers, smug confidence",
      combat_ready:
        "menacing mythic spellcast, negative-color black-sun halo and four glowing arcane Omen portals opening behind her, fierce gaze",
      hurt:
        "wincing in pain, cracked headdress ornament, clutching bruised arm, hissed breath, coiled defensive stance",
    },
  },
];

async function run() {
  const comfyUrl = DEFAULT_COMFYUI_URL;
  console.log(`[ComfyUI Batch] Checking ComfyUI server at ${comfyUrl}...`);

  let online = false;
  for (let attempt = 1; attempt <= 30; attempt++) {
    online = await isComfyUiOnline(comfyUrl, 3000);
    if (online) break;
    console.log(`[ComfyUI Batch] Waiting for ComfyUI to finish booting (${attempt}/30)...`);
    await new Promise((r) => setTimeout(r, 2500));
  }

  if (!online) {
    throw new Error(`ComfyUI is not reachable at ${comfyUrl}`);
  }
  console.log(`[ComfyUI Batch] Connected! Starting generation for ${STARFALL_HEROINE_ART_SPECS.length} heroines (72 sprites)...`);

  const forceRegen = process.argv.includes("--force");
  const filterSlug = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1];

  const specs = filterSlug
    ? STARFALL_HEROINE_ART_SPECS.filter((s) => s.slug === filterSlug)
    : STARFALL_HEROINE_ART_SPECS;

  for (const heroine of specs) {
    const outDir = path.join(
      process.cwd(),
      "public",
      "characters",
      "starfall-labyrinth",
      heroine.slug
    );
    fs.mkdirSync(outDir, { recursive: true });

    const markerPath = path.join(outDir, ".comfy_illustrious_v1.json");
    if (!forceRegen && fs.existsSync(markerPath)) {
      const allExist = EXPRESSION_KEYS.every((k) =>
        fs.existsSync(path.join(outDir, `${k}.png`))
      );
      if (allExist) {
        console.log(`[Skip] ${heroine.name} (${heroine.slug}) already has complete IllustriousXL sprite set.`);
        continue;
      }
    }

    console.log(`\n=== Generating ${heroine.starRank}★ ${heroine.name} (${heroine.slug}) ===`);

    // Pass A: Neutral Key Sprite + Clean White-BG Reference for IPAdapter
    const neutralPositive = `${GACHA_QUALITY_PREFIX}, ${heroine.appearanceAnchor}, ${heroine.expressions.neutral}`;
    console.log(`  [1/6] Rendering base neutral sprite (seed ${heroine.baseSeed})...`);
    const neutralRes = await generateComfyCharacterSprite({
      positivePrompt: neutralPositive,
      negativePrompt: GACHA_NEGATIVE_PROMPT,
      seed: heroine.baseSeed,
      steps: 24,
      cfg: 6.0,
      saveRawReference: true,
      filenamePrefix: `starfall/${heroine.slug}_neutral`,
      comfyUrl,
    });

    const neutralOutPath = path.join(outDir, "neutral.png");
    fs.writeFileSync(neutralOutPath, neutralRes.alphaImageBuffer);
    console.log(`  -> Saved ${neutralOutPath} (${(neutralRes.alphaImageBuffer.length / 1024).toFixed(1)} KB)`);

    const refBuffer = neutralRes.rawWhiteBgBuffer || neutralRes.alphaImageBuffer;
    const uploadedRefName = await uploadReferenceToComfyUi(
      refBuffer,
      `starfall_ref_${heroine.slug}.png`,
      comfyUrl
    );
    console.log(`  -> Uploaded IPAdapter identity lock reference: ${uploadedRefName}`);

    // Pass B: 5 Consistent Expressions locked to Pass A via IPAdapterAdvanced
    const remainingKeys = EXPRESSION_KEYS.filter((k) => k !== "neutral");
    for (let idx = 0; idx < remainingKeys.length; idx++) {
      const exprKey = remainingKeys[idx];
      const exprPrompt = `${GACHA_QUALITY_PREFIX}, ${heroine.appearanceAnchor}, ${heroine.expressions[exprKey]}`;
      const exprSeed = heroine.baseSeed + (idx + 1) * 17;
      console.log(`  [${idx + 2}/6] Rendering expression '${exprKey}' via IPAdapterAdvanced (seed ${exprSeed})...`);

      const exprRes = await generateComfyCharacterSprite({
        positivePrompt: exprPrompt,
        negativePrompt: GACHA_NEGATIVE_PROMPT,
        seed: exprSeed,
        steps: 22,
        cfg: 6.0,
        referenceImageFilename: uploadedRefName,
        ipAdapterWeight: exprKey === "combat_ready" ? 0.68 : 0.74,
        ipAdapterEndAt: 0.90,
        filenamePrefix: `starfall/${heroine.slug}_${exprKey}`,
        comfyUrl,
      });

      const exprOutPath = path.join(outDir, `${exprKey}.png`);
      fs.writeFileSync(exprOutPath, exprRes.alphaImageBuffer);
      console.log(`  -> Saved ${exprOutPath} (${(exprRes.alphaImageBuffer.length / 1024).toFixed(1)} KB)`);
    }

    fs.writeFileSync(
      markerPath,
      JSON.stringify(
        {
          heroine: heroine.name,
          slug: heroine.slug,
          checkpoint: "illustriousXL_v01.safetensors",
          generatedAt: new Date().toISOString(),
          baseSeed: heroine.baseSeed,
        },
        null,
        2
      )
    );
  }

  console.log("\n[ComfyUI Batch] All 12 Starfall heroines (72 gacha sprites) generated successfully!");
}

run().catch((err) => {
  console.error("[ComfyUI Batch Fatal Error]:", err);
  process.exit(1);
});
