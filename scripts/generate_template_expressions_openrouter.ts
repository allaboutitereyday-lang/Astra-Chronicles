import fs from "fs";
import path from "path";
import {
  DEFAULT_COMFYUI_URL,
  isComfyUiOnline,
  extractAlphaCutoutWithComfyUi,
} from "../lib/comfyUiClient";

const EXPRESSION_KEYS = [
  "neutral",
  "intrigued",
  "flustered",
  "smug",
  "combat_ready",
  "hurt",
] as const;

type ExpressionKey = (typeof EXPRESSION_KEYS)[number];

interface CharacterSpec {
  slug: string;
  name: string;
  templatePath: string;
  existingNeutralPath?: string;
  anchorOnly?: boolean;
  existingRenders?: Partial<Record<ExpressionKey, string>>;
  maskOffset?: number;
  identityLock: string;
  expressions: Record<ExpressionKey, string>;
}

const ARTIFACT_DIR =
  "C:/Users/isawi/.gemini/antigravity/brain/d332398a-536d-469f-b9f7-d456241ce71b";

const CHARACTER_SPECS: Record<string, CharacterSpec> = {
  garrick_ironbrow: {
    slug: "garrick_ironbrow",
    name: "Garrick Ironbrow",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/garrick_ironbrow.jpg",
    existingNeutralPath: `${ARTIFACT_DIR}/garrick_tpl_neutral_1794627792639.jpg`,
    existingRenders: {
      smug: `${ARTIFACT_DIR}/garrick_or_smug.png`,
    },
    maskOffset: -1,
    identityLock:
      "Preserve 100% of the exact semi-realistic painterly anime-fantasy rendering style, lineweight, weathered scarred steel cuirass with leather cross-straps, chainmail skirt, white topknot hair, thick white beard and mustache, facial scars, and heavy iron double-bitted battleaxe from the reference images. Do NOT flatten into cartoon cel-shading and do NOT include any text or 'BABAYAGA' watermark.",
    expressions: {
      neutral:
        "Stoic, composed veteran gaze straight ahead, heavy iron double-bitted battleaxe resting over his right shoulder held by his right gloved hand, left gauntleted hand resting at his side.",
      intrigued:
        "One white eyebrow raised in sharp tactical interest, slight knowing half-smirk beneath his mustache, leaning subtly forward.",
      flustered:
        "Red blush across his scarred cheeks and nose bridge, gruffly averting his eyes to the side while rubbing the back of his neck with his left gauntleted hand, right hand holding the battleaxe on his right shoulder.",
      smug: "Hearty, battle-seasoned veteran grin showing teeth beneath his white mustache, amused crinkles around his eyes, right gloved hand holding the battleaxe shaft over his right shoulder, left gauntleted hand hooked confidently onto his leather waist belt.",
      combat_ready:
        "Fierce front-line war-cry expression, brows furrowed, gripping the heavy iron double-bitted battleaxe across his chest with BOTH gauntleted hands in a bracing vanguard guard stance, steel pauldrons angled forward.",
      hurt: "Visibly wounded and reeling from a heavy blow while keeping his EXACT two-arm stance from neutral (right gloved hand gripping the battleaxe shaft over his right shoulder, left gauntleted hand clenched tightly at his side — DO NOT add any extra arm across his chest or stomach!): one eye squeezed half-shut, teeth gritted in sharp pain, fresh bleeding cuts on his brow and cheek, sweat on his face, shoulders hunched forward under impact, and deep fresh dents, cracks, and blood streaks across his scarred steel cuirass and pauldron.",
    },
  },
  lyra_nocturne: {
    slug: "lyra_nocturne",
    name: "Lyra Nocturne",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/lyra_nocturne.jpg",
    maskOffset: -1,
    identityLock:
      "Preserve 100% of the exact high-fashion painterly anime-fantasy illustration style, crisp ink linework, brushwork textures, and exact character design from the reference template: long straight jet-black hair with blunt straight bangs and glowing emerald-teal inner hair highlights, piercing emerald-teal eyes with warm coral eyeshadow, gold drop earrings, black-and-white high-collared astral vestments with cutout chest strap detail, ornate antique-gold filigree chains and astronomical ring ornaments at her hip, wide flowing black sleeves with emerald-teal inner lining, the circular glowing emerald-teal runic halo floating behind her head, and her tall ornate brass astrolabe staff with glowing teal runes. Do NOT flatten into generic cel-shading.",
    expressions: {
      neutral:
        "Cool, serene, enigmatic astral-scholar gaze looking slightly down at the viewer with parted lips, standing upright in a composed 3:4 thigh-up pose; right gloved hand holding her tall ornate brass astrolabe staff vertically beside her, left pale-gloved hand slightly raised palm-up with subtle emerald-teal stardust motes.",
      intrigued:
        "Head tilted slightly with narrowed, fascinated emerald-teal eyes and a faint, perceptive curve to her lips as if reading a rare constellation in the viewer's fate; right hand holding the vertical brass astrolabe staff, left hand gently touching her chin in thought.",
      flustered:
        "Uncharacteristic soft rose blush across her pale cheeks and ears, emerald-teal eyes widened and darting sideways in guarded embarrassment, pressing her left sleeved hand lightly near her collar while her right hand grips her brass astrolabe staff closer.",
      smug: "Haughty, knowing faint smirk with half-lidded emerald-teal eyes and chin subtly lifted in quiet intellectual superiority; right hand resting high on her vertical brass astrolabe staff, left hand poised elegantly at her waist.",
      combat_ready:
        "Sharp, commanding battle-focus expression with glowing emerald-teal eyes and billowing black-and-teal sleeves; thrusting her ornate brass astrolabe staff forward-diagonally with her right hand while her left hand weaves a bright emerald-teal astral rune sigil, the runic halo behind her head blazing brightly.",
      hurt: "Pained grimace with gritted teeth, slight scuffing on her cheek and torn sleeve trim, emerald-teal runic halo flickering unevenly; leaning her weight onto her planted brass astrolabe staff with her right hand while her left hand clutches her upper arm.",
    },
  },
  lotte_klein: {
    slug: "lotte_klein",
    name: "Lotte Klein",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/lotte_klein.png",
    maskOffset: -1,
    identityLock:
      "Preserve 100% of the exact moody, atmospheric painterly dark-fantasy anime illustration style, textured shading, and exact character design from the reference template: pale porcelain grey-undertone skin, dark charcoal-black hair worn in two thick twin braids draping over her shoulders with the signature single dark bang lock falling down the center between her brows, eerie glowing ringed yellow-gold eyes with dark sleepy under-eye shading, stitched suture scar line across the base of her throat, white collared peasant blouse with rolled sleeves under a dark forest-green laced bodice/apron dress with small floral buttons, and her eerie shadowy dark-smoke nightmare spirit companion with glowing mint-teal eyes and a wide toothy grin lurking just behind her right shoulder. Render a complete, clean, uncropped 3:4 thigh-up silhouette (smoothly completing her sleeves, skirt, and coherent wisps of dark shadow-spirit behind her shoulder with NO harsh rectangular crop edges from the reference). Do NOT flatten into bright cartoon cel-shading.",
    expressions: {
      neutral:
        "Uncanny, tranquil, slightly sleepy half-smile with glowing ringed yellow-gold eyes gazing calmly at the viewer, standing in a clean 3:4 thigh-up pose; both hands clasped loosely together in front of her dark green apron dress while the grinning teal-eyed shadow-spirit peeks quietly over her right shoulder.",
      intrigued:
        "Head tilted curiously to one side, glowing yellow-gold eyes wide and unblinking with eerie childlike fascination, right index finger raised lightly against her cheek while her left arm rests at her waist; the shadow-spirit behind her shoulder leans in curiously too.",
      flustered:
        "Warm dusty-rose blush blooming across her pale cheeks, yellow-gold eyes darting away shyly with a startled, bashful expression, holding both hands nervously against her chest/braids while the shadow-spirit behind her looks startled.",
      smug: "Eerie,delighted, unsettling little knowing grin (matching the uncanny charm of the template) with half-lidded glowing yellow-gold eyes and chin resting lightly against her right hand while her left hand rests at her waist, the grinning teal-eyed shadow-spirit mirroring her grin behind her shoulder.",
      combat_ready:
        "Intense, eerie medium's trance expression with brightly glowing ringed yellow-gold eyes and floating twin braids; both pale hands raised in front of her channeling dark teal-edged nightmare smoke as the grinning shadow-spirit surges larger and more menacingly over her shoulders.",
      hurt: "Wincing in pain with furrowed brows, teary glowing yellow-gold eyes, scuffed blouse sleeve; clutching her left shoulder with her right hand while her left arm hangs defensively across her waist, the shadow-spirit coiling protectively around her.",
    },
  },
  trinity_valoren: {
    slug: "trinity_valoren",
    name: "Trinity Valoren",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/trinity_valoren.jpg",
    existingNeutralPath: `${ARTIFACT_DIR}/trinity_valoren_or_neutral.png`,
    anchorOnly: true,
    maskOffset: -1,
    identityLock:
      "Keep 100% of the exact luminous anime-fantasy digital painting style, brushwork, hair, twin curved oni horns, gold wheel forehead ornament with turquoise gem, face, and complete royal-violet kimono haori, crimson obi sash, and dark battle attire exactly identical to the provided reference character sprite. Do NOT change her outfit or art style.",
    expressions: {
      neutral:
        "Poised, confident slight smile with glowing lavender-violet eyes gazing calmly at the viewer, standing upright in a clean eye-level 3:4 thigh-up pose; both hands resting lightly on her obi sash.",
      intrigued:
        "Head tilted playfully with one brow arched and glowing violet eyes sparkling with sharp curiosity; right hand raised lightly with one finger touching her chin while her left hand rests on her waist sash.",
      flustered:
        "Soft rose blush across her cheeks and ears, glowing violet eyes widened and looking sideways in bashful surprise with slightly parted lips; right hand raised shyly near her cheek while her left hand rests on her crimson obi sash.",
      smug: "Confident, playful duelist smirk with half-lidded glowing violet eyes and chin lifted proudly; right hand resting on her hip while her left hand is raised slightly conjuring a faint violet arcane spark.",
      combat_ready:
        "Focused, sharp swordswoman battle expression with glowing lavender-violet eyes and flowing purple sleeves; gripping twin sleek violet-gleaming wakizashi blades in a poised guard stance with faint violet mirage wisps.",
      hurt: "Wincing in pain with gritted teeth, minor scrapes on her cheek and scuffed sleeve; right hand holding her bruised left upper arm while her left hand rests defensively at her waist sash.",
    },
  },
  sable_ashgrove: {
    slug: "sable_ashgrove",
    name: "Sable Ashgrove",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/sable_ashgrove.jpg",
    existingNeutralPath: `${ARTIFACT_DIR}/sable_ashgrove_or_smug.png`,
    anchorOnly: true,
    maskOffset: -1,
    identityLock:
      "Keep 100% of the exact upright standing 3:4 thigh-up framing, moody semi-realistic dark-fantasy anime painting style, pale jade-porcelain skin, long emerald-green hair, two dark ridged curved horns, pointed elf ears, sage-emerald eyes, black-and-white ruffled gothic maid outfit, black clawed opera gloves with silver armlet buckles, lace-top stockings, and sleek dark abyssal tentacles behind her back from the reference sprite. She MUST be standing upright at eye level (NOT kneeling or crawling).",
    expressions: {
      neutral:
        "Standing upright at eye level in a calm 3:4 thigh-up pose: cool, watchful, deadpan-composed survivor expression with neutral relaxed lips and sage-emerald eyes gazing straight ahead; both black clawed opera-gloved hands resting naturally down along the sides of her white apron while dark abyssal tentacles curl calmly behind her.",
      intrigued:
        "Skeptical yet intrigued head tilt, one dark-green brow slightly raised, sage-emerald eyes narrowed perceptively; right black-clawed gloved hand raised near her chin while her left gloved hand rests on her hip, tentacles perking up behind her.",
      flustered:
        "Standing upright at eye level in a 3:4 thigh-up pose: warm rosy blush across her cheeks and pointed ear tips, emerald eyes wide and darting sideways in bashful annoyance; her right black clawed opera-gloved hand raised shyly near her collar while her ONLY left black opera-gloved hand rests at her waist (strictly 2 arms total!), dark tentacles coiling closer behind her.",
      smug: "Dry, street-smart, knowing half-smirk with half-lidded sage-emerald eyes; arms loosely crossed in her black clawed opera gloves while the abyssal tentacles sway smugly behind her shoulders.",
      combat_ready:
        "Sharp, lethal dungeon-scout focus with narrowed glowing emerald eyes; crouched slightly in a 3:4 thigh-up rogue stance holding a sleek obsidian dagger in her right clawed glove, left clawed hand poised forward as her dark abyssal tentacles flare aggressively behind her.",
      hurt: "Grimacing through pain with clenched teeth, scuffed cheek and torn white maid-apron frill; right black-gloved hand pressing against her bruised ribs while her left gloved arm hangs guardedly at her side, tentacles coiled tightly in defense.",
    },
  },
  onyxia_cryss: {
    slug: "onyxia_cryss",
    name: "Onyxia Cryss",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/onyxia_cryss.jpg",
    maskOffset: -1,
    identityLock:
      "Preserve 100% of the exact detailed dark-fantasy manhwa/anime illustration style, crisp ink linework, warm antique-gold and espresso-black palette, and exact character design from the reference template: long wavy platinum-white hair parted down the center with small side-buns, wide black blindfold mask across her eyes set with a central ornate bronze-gold bezel holding a glowing amethyst-purple third-eye gem connected to a forehead chain, serene porcelain lower face with soft rose lips, dark drop earrings, high buckled black-and-brass throat collar, ivory-white draped bodice under a structured dark leather waist-corset and flowing espresso-black outer robes with gold astronomical shoulder embroidery, heavy bronze manacles around both wrists linked by an iron chain to her waist belt, her round ornate brass-and-amethyst Geode Oculus orb with its glowing purple crystal eye-core, and high-slit dark skirt showing her bronze thigh-band and hip lattice. Completely EXCLUDE the background stone circular arch ring and library shelves — isolate ONLY Onyxia and her handheld/floating Oculus orb on pure white #FFFFFF.",
    expressions: {
      neutral:
        "Solemn, serene, statuesque poise with chin slightly lifted and soft calm lips beneath her purple-gemmed blindfold, standing upright in a 3:4 thigh-up pose cradling her round brass-and-amethyst Oculus orb symmetrically in both manacled hands in front of her chest (matching the iconic pose of the template).",
      intrigued:
        "Head tilted attentively to the side as the purple third-eye gem on her blindfold and the amethyst Oculus orb both glow brighter in curiosity; holding the Oculus orb in her left manacled hand while her right manacled hand touches the edge of the brass sphere.",
      flustered:
        "Soft pink blush warming her porcelain cheeks beneath the black blindfold, lips parted in a quiet startled gasp; clutching the brass-and-amethyst Oculus orb tightly against her chest with both manacled hands, wrist chains taut.",
      smug: "Subtle, serene, dryly amused upward curve of her lips with her chin lifted regally, the purple gem on her blindfold glinting; cradling her glowing amethyst Oculus orb effortlessly in her manacled hands.",
      combat_ready:
        "Commanding arcane battle stance with platinum hair billowing and the amethyst third-eye gem on her blindfold blazing with violet refraction light; both manacled hands thrusting forward slightly as her brass-and-amethyst Oculus orb levitates inches between her palms, radiating sharp crystalline purple runes.",
      hurt: "Teeth gritted in quiet stoic pain beneath her blindfold, slight scuffing on her jaw and cracked violet flicker in her blindfold's purple gem; holding her brass Oculus orb protectively against her waist with both manacled hands, shoulders slightly hunched.",
    },
  },
  odette_varr: {
    slug: "odette_varr",
    name: "Dame Odette Varr",
    templatePath:
      "public/characters/starfall-labyrinth/_templates/odette_varr.jpg",
    maskOffset: -1,
    identityLock:
      "Preserve 100% of the exact dramatic gothic-aristocratic anime-manhwa illustration style, high-contrast alabaster and obsidian-violet shading, crisp ink linework, and exact character design from the reference template: pale alabaster-white wavy hair seamlessly intertwined with a regal crown of 6–7 live albino-white vipers/serpents with glowing pale-gold/rose eyes rising around her head, marble-pale skin with subtle faint porcelain-stone vein lines on her upper arm, luminous pupilless glowing pale-lavender eyes with dark smoky eyeshadow, dark plum lips, high black velvet mock-neck collar, sleeveless form-fitting black gothic halter gown adorned with intricate dark-silver/violet baroque floral filigree embroidery, and detached sheer/feathered black gothic forearm drapes trailing from her lower arms. Remove the flat grey rectangle at the bottom of the reference and complete her thigh-up black gothic gown silhouette cleanly; keep ALL white crown-serpents completely inside the canvas margins on flat #FFFFFF.",
    expressions: {
      neutral:
        "Regal, dignified, composed aristocratic gaze over a three-quarter shoulder angle (or poised upright 3:4 thigh-up), luminous pale-lavender eyes calm and unwavering while her white crown-serpents coil serenely around her head; right arm poised gracefully at her side and left hand resting lightly near her hip.",
      intrigued:
        "Refined, perceptive head tilt with one pale brow slightly raised, glowing lavender eyes focused intently as two of her white crown-serpents lean forward curiously in unison; right hand raised lightly to her collar while her left arm rests at her waist.",
      flustered:
        "Unmistakable soft lavender-rose blush across her marble-pale cheeks, normally dignified poise cracking into stiff, flustered embarrassment as she averts her glowing eyes and clears her throat with her right hand raised near her cheek while her left arm stays at her waist — her white crown-serpents curling inward shyly in comic sympathy.",
      smug: "Cool, aristocratic, triumphant slight smirk with chin lifted in noble pride, her white crown-serpents rising tall like a royal diadem; arms folded gracefully across her filigree black bodice.",
      combat_ready:
        "Fierce, unyielding Gorgon warden stance with blazing pupilless white-violet eyes and all her albino crown-serpents flaring wide with bared fangs; right hand extended forward conjuring a jagged translucent obsidian-alabaster petrification aegis sigil while her left arm braces back.",
      hurt: "Wincing with gritted teeth and furrowed brows, faint stone-cracks glinting along her cheek and shoulder, black gothic gown scuffed; right hand clutching her bruised left shoulder while her left arm guards across her waist, her white crown-serpents coiling defensively.",
    },
  },
};

function getOpenRouterApiKey(): string {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/^OPENROUTER_API_KEY=(.+)$/m);
  if (!match) {
    throw new Error("OPENROUTER_API_KEY missing in .env.local");
  }
  return match[1].trim().replace(/^['"]|['"]$/g, "");
}

function fileToDataUrl(filePath: string): string {
  const resolved = path.resolve(filePath);
  const buf = fs.readFileSync(resolved);
  const lower = resolved.toLowerCase();
  const mime = lower.endsWith(".png")
    ? "image/png"
    : lower.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function generateViaOpenRouter(params: {
  apiKey: string;
  model: string;
  referencePaths: string[];
  prompt: string;
  outPath: string;
}): Promise<string> {
  const content: Array<Record<string, unknown>> = params.referencePaths.map(
    (p) => ({
      type: "image_url",
      image_url: { url: fileToDataUrl(p) },
    })
  );
  content.push({ type: "text", text: params.prompt });

  const body = {
    model: params.model,
    modalities: ["image", "text"],
    image_config: {
      aspect_ratio: "3:4",
    },
    messages: [
      {
        role: "user",
        content,
      },
    ],
  };

  const attemptModels = [
    params.model,
    params.model,
    "google/gemini-2.5-flash-image",
    "openai/gpt-5-image-mini",
  ];

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attemptModels.length; attempt++) {
    const activeModel = attemptModels[attempt - 1];
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body, model: activeModel }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || json.error) {
        throw new Error(
          `OpenRouter HTTP ${res.status}: ${JSON.stringify(json.error || json)}`
        );
      }

      const msg = json.choices?.[0]?.message || {};
      const imgUrl: string | undefined =
        msg.images?.[0]?.image_url?.url ||
        (Array.isArray(msg.content)
          ? msg.content.find((p: any) => p.type === "image_url")?.image_url?.url
          : undefined);

      if (!imgUrl) {
        throw new Error(
          `No image returned in message: ${JSON.stringify(msg).slice(0, 300)}`
        );
      }

      const m = imgUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!m) {
        throw new Error(`Unexpected image URL format: ${imgUrl.slice(0, 80)}`);
      }

      fs.writeFileSync(params.outPath, Buffer.from(m[2], "base64"));
      return params.outPath;
    } catch (err) {
      lastErr = err;
      console.warn(
        `[openrouter] Attempt ${attempt}/3 failed: ${err instanceof Error ? err.message : String(err)
        }`
      );
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2500 * attempt));
      }
    }
  }
  throw lastErr;
}

async function processCharacter(
  spec: CharacterSpec,
  onlyFilter: Set<ExpressionKey> | null,
  apiKey: string,
  model: string
) {
  const outDir = path.resolve(
    process.cwd(),
    "public",
    "characters",
    "starfall-labyrinth",
    spec.slug
  );
  fs.mkdirSync(outDir, { recursive: true });

  let neutralAnchorPath = spec.existingNeutralPath;

  for (const expr of EXPRESSION_KEYS) {
    if (onlyFilter && !onlyFilter.has(expr)) {
      continue;
    }

    let rawRenderPath = spec.existingRenders?.[expr];
    if (!rawRenderPath || !fs.existsSync(rawRenderPath)) {
      rawRenderPath = `${ARTIFACT_DIR}/${spec.slug}_or_${expr}.png`;
      const refs = spec.anchorOnly && neutralAnchorPath
        ? [neutralAnchorPath]
        : expr === "neutral" || !neutralAnchorPath
          ? [spec.templatePath]
          : [spec.templatePath, neutralAnchorPath];

      const prompt = `Generate the "${expr}" expression sprite for ${spec.name} using the provided reference image${refs.length > 1
        ? "s (Image 1: original character art template; Image 2: neutral thigh-up sprite anchor on #FFFFFF)"
        : " (Image 1: original character art template)"
        }.
CRITICAL REQUIREMENTS:
1. ${spec.identityLock}
2. Framing & Background: Isolated vertical 3:4 thigh-up character sprite centered cleanly on a completely flat, solid, uniform pure white background (#FFFFFF) with NO background scenery, NO ground shadow, NO vignette, NO border, and NO text/signature. Keep the full head/halo/hat and weapon silhouette cleanly framed inside the canvas.
3. Expression & Pose ("${expr}"): ${spec.expressions[expr]}
4. STRICT TWO-ARM ANATOMY RULE: Double-check anatomy so ${spec.name} has EXACTLY TWO HUMAN ARMS total. When raising or moving an arm for a gesture, the resting arm from the template MUST move — never leave a duplicate third arm at the hip, chin, or side.`;

      console.log(`[${spec.slug}] Generating ${expr} via OpenRouter (${model})...`);
      await generateViaOpenRouter({
        apiKey,
        model,
        referencePaths: refs,
        prompt,
        outPath: rawRenderPath,
      });
      console.log(`[${spec.slug}] Raw render saved -> ${rawRenderPath}`);
    } else {
      console.log(`[${spec.slug}] Reusing existing render for ${expr}: ${rawRenderPath}`);
    }

    if (expr === "neutral" && !neutralAnchorPath) {
      neutralAnchorPath = rawRenderPath;
    }

    console.log(`[${spec.slug}] Extracting RMBG-2.0 RGBA cutout for ${expr}...`);
    const srcBuf = fs.readFileSync(rawRenderPath);
    const rgbaBuf = await extractAlphaCutoutWithComfyUi({
      imageBuffer: srcBuf,
      uploadFilename: `tpl_${spec.slug}_${expr}${path.extname(rawRenderPath) || ".png"}`,
      filenamePrefix: `starfall_tpl/${spec.slug}_${expr}`,
      processRes: 1216,
      maskBlur: 0,
      maskOffset: spec.maskOffset ?? -1,
    });

    const finalPngPath = path.join(outDir, `${expr}.png`);
    fs.writeFileSync(finalPngPath, rgbaBuf);
    console.log(
      `[${spec.slug}] Saved RGBA sprite -> ${finalPngPath} (${(
        rgbaBuf.byteLength / 1024
      ).toFixed(1)} KB)`
    );
  }
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const slugArg = getArg("--slug");
  const onlyArg = getArg("--only");
  const model = getArg("--model") || "google/gemini-3.1-flash-image";

  const online = await isComfyUiOnline(DEFAULT_COMFYUI_URL, 4000);
  if (!online) {
    throw new Error(`ComfyUI is offline at ${DEFAULT_COMFYUI_URL}`);
  }

  const apiKey = getOpenRouterApiKey();
  const onlyFilter = onlyArg
    ? new Set(onlyArg.split(",").map((s) => s.trim() as ExpressionKey))
    : null;

  const targets = slugArg
    ? [CHARACTER_SPECS[slugArg]]
    : [
      CHARACTER_SPECS.garrick_ironbrow,
      CHARACTER_SPECS.lyra_nocturne,
      CHARACTER_SPECS.lotte_klein,
    ];

  for (const spec of targets) {
    if (!spec) {
      throw new Error(`Unknown character slug: ${slugArg}`);
    }
    await processCharacter(spec, onlyFilter, apiKey, model);
  }

  console.log("All requested OpenRouter + RMBG-2.0 sprite sets finished!");
}

main().catch((err) => {
  console.error("[generate_template_expressions_openrouter] Fatal:", err);
  process.exit(1);
});
