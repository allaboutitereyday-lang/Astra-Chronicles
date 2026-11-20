import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const COMFY_URL = "http://127.0.0.1:8188";
const PYTHON_EXE = "D:\\AI ImageGen\\ComfyUI\\ComfyUI\\.venv\\Scripts\\python.exe";
const WORKSPACE = "c:/Users/isawi/Astra Chronicles";
const ART_DIR = "C:/Users/isawi/.gemini/antigravity/brain/d332398a-536d-469f-b9f7-d456241ce71b";
const SCRATCH_DIR = `${ART_DIR}/scratch`;
const COMFY_OUT = `${SCRATCH_DIR}/comfy_out`;
const STUDIO_ROOT = `${WORKSPACE}/sprite-studio/deeb`;
const PUB_ROOT = `${WORKSPACE}/public/characters/ash-and-velvet`;
const LOCK_SCRIPT = `${SCRATCH_DIR}/lock_expression_body.py`;
const POST_JILL = `${SCRATCH_DIR}/postprocess_jill.py`;
const PS_JSX = `${SCRATCH_DIR}/photoshop_cutout.jsx`;
const PS_MANIFEST = `${SCRATCH_DIR}/ps_cutout_jobs.txt`;

const DEEB_PREFIX =
  "deeb, masterpiece, best quality, amazing quality, very aesthetic, absurdres, 1girl, solo, western comic style, crisp bold black ink outlines, clean smooth cel shading, three-quarter thigh-up portrait, cowboy shot, standing straight upright, facing viewer, right hand resting on hip, left arm relaxed at side, looking at viewer, pure flat solid #ffffff white background, simple background";

const BASE_NEG =
  "worst quality, low quality, normal quality, bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, deformed, text, watermark, signature, scenery, complex background, indoors, bedroom, grey background, blue background, cyan background, colored background, gradient background, shadows on floor, border, frame, monochrome, greyscale, multiple views, full body, shoes, feet, table, desk, furniture, leaning on object, wings, demon wings, bat wings, angel wings, horns, tail, animal ears, hand on chest, wardrobe malfunction, exposed breast, nude, nipples, bare breasts, areola, topless, exposed breasts";

const EXPRESSIONS = [
  { key: "flustered", offset: 21, desc: "flustered, embarrassed expression, heavy red cheek blush, slightly furrowed brows, nervous parted lips, shy glance, looking at viewer" },
  { key: "smug", offset: 22, desc: "smug expression, playful confident smirk, half-lidded eyes, one raised eyebrow, teasing gaze, looking at viewer" },
  { key: "intrigued", offset: 23, desc: "intrigued curious expression, widened sparkling eyes, raised eyebrow, parted lips, slight head tilt, looking at viewer" },
  { key: "hurt", offset: 24, desc: "sad hurt expression, troubled furrowed eyebrows, glossy eyes, downcast frown, vulnerable expression" },
  { key: "beckon", offset: 25, desc: "seductive inviting expression, half-closed bedroom eyes, warm soft blush, alluring parted-lip smile, looking at viewer" },
];

export const CAST = {
  clara_callahan: {
    name: "Clara Callahan",
    seed: 910101,
    bgRoom: `${WORKSPACE}/public/backgrounds/ash-and-velvet/shared_kitchen.jpg`,
    traits:
      "mature 40yo gorgeous woman, curvy pear-hourglass figure, wide hips, thick soft thighs, large natural breasts, slender waist, warm fair peach skin with light warm freckles across nose cheeks collarbone and upper chest, tiny beauty mark mole under left eye, shoulder-length wavy glossy auburn chestnut brown hair parted on side, bright emerald green eyes, gentle warm confident smile, delicate gold stud earrings",
    negExtra: "long waist-length hair, brown lingerie",
    outfits: [
      { key: "base", desc: "wearing cream cashmere wrap v-neck sweater tied neatly at waist, delicate gold pendant necklace, high-waisted terracotta-rust tailored trousers" },
      { key: "kitchen", desc: "wearing deep peacock-teal ribbed scoop-neck top under cozy oatmeal open knit cardigan, espresso-trimmed linen cafe waist apron" },
      { key: "lounge", desc: "wearing cozy off-shoulder heather-oatmeal slouch sweater exposing one collarbone, cuffed vintage blue denim shorts, bare thighs" },
      { key: "date", desc: "wearing rich emerald-green velvet wrap cocktail mini-dress with deep v-neckline, bare thighs" },
      { key: "nightwear", desc: "wearing silky dusty-rose lace-trim satin slip dress under flowing ivory silk kimono robe, bare thighs" },
      { key: "lingerie", desc: "wearing covered obsidian jet-black floral-lace balconette underwire bra with thin symmetrical black straps covering breasts completely, bare midriff, navel, matching solid jet-black floral-lace high-cut bikini panties, black garter belt straps, black lace-top thigh-high stockings" },
    ],
  },
  hannah_lindqvist: {
    name: "Hannah Lindqvist",
    seed: 910201,
    bgRoom: `${WORKSPACE}/public/backgrounds/ash-and-velvet/hannahs_bedroom.jpg`,
    traits:
      "23yo tall slender willowy Scandinavian woman, fair porcelain pale skin, zero freckles, long messy wavy platinum-blonde hair past shoulders with subtle darker roots, heavy-lidded vibrant icy-blue eyes with dark winged grunge eyeliner, cool enigmatic slight half-smile, white pearl choker snug around neck, small silver hoop earrings",
    negExtra: "freckles, huge breasts, curvy wide hips",
    outfits: [
      { key: "base", desc: "wearing slouchy black off-shoulder ribbed knit sweater exposing collarbones, dark burgundy tartan pleated mini-skirt with black leather silver-buckled belt, bare thighs" },
      { key: "overalls", desc: "wearing fitted white cropped ribbed tank top under faded light-wash denim bib overalls with colorful acrylic paint splatters, bare shoulders and arms" },
      { key: "nightout", desc: "wearing open oversized crimson-and-black plaid flannel shirt draped off shoulders over sleek black cropped bandeau top, distressed black denim shorts, thin silver chain belt, bare thighs" },
      { key: "lounge", desc: "wearing faded washed charcoal oversized graphic tee with crescent moon and moth illustration slipping off one shoulder, soft black cotton sleep shorts, bare thighs" },
      { key: "nightwear", desc: "wearing sleek slate-blue satin camisole with delicate black floral lace trim and matching slate-blue satin sleep shorts under loose open black knit cardigan, bare thighs" },
      { key: "lingerie", desc: "wearing covered matte charcoal-black floral-lace underwire bralette with thin black straps covering breasts completely, bare midriff, navel, matching black floral-lace bikini panties, black lace-top thigh-high stockings" },
    ],
  },
  brianna_chen: {
    name: "Brianna Chen",
    seed: 910301,
    bgRoom: `${WORKSPACE}/public/backgrounds/ash-and-velvet/briannas_bedroom.jpg`,
    traits:
      "24yo petite slim-curvy East Asian woman, compact hourglass figure, warm golden-peach skin, zero freckles, sleek glossy chin-length raven-black bob haircut with wispy bangs, teasing dark espresso-brown almond eyes with cat-eye eyeliner, glossy rose-coral lips in playful confident smirk, small gold hoop earrings",
    negExtra: "freckles, long waist-length hair",
    outfits: [
      { key: "base", desc: "wearing crisp plush white cotton bath towel wrapped securely from above chest to mid-thigh, bare shoulders, bare arms, bare thighs" },
      { key: "casual", desc: "wearing fitted pastel-lilac ribbed halter-neck crop top, bare shoulders and midriff, crisp high-waisted white denim shorts with slim tan belt, bare thighs" },
      { key: "party", desc: "wearing sleek form-fitting deep crimson-red sleeveless bodycon mini-dress with small keyhole neckline cutout and delicate gold chain necklace, bare arms, bare thighs" },
      { key: "lounge", desc: "wearing oversized borrowed navy-blue pullover hoodie slipping casually off one shoulder with pushed-up sleeves, sleek charcoal bike shorts, bare thighs" },
      { key: "nightwear", desc: "wearing deep peacock-teal silk-satin cropped camisole with black floral lace trim and matching peacock-teal satin sleep shorts, bare thighs" },
      { key: "lingerie", desc: "wearing covered deep crimson-ruby silk-satin and black floral-lace balconette bra with thin black straps covering breasts completely, bare midriff, navel, matching crimson and black lace bikini panties, black garter straps, sheer black thigh-high stockings" },
    ],
  },
  sierra_holloway: {
    name: "Sierra Holloway",
    seed: 910401,
    bgRoom: `${WORKSPACE}/public/backgrounds/ash-and-velvet/sierras_bedroom.jpg`,
    traits:
      "24yo thick plump plush voluptuously soft curvy woman, full lush breasts, soft plush waist, wide plush curvy hips, thick soft freckled thighs, very long voluminous wavy vibrant copper-ginger orange hair styled half-up with dark green cloth hair tie, bright leaf-green eyes, abundant warm freckles across nose cheeks shoulders chest arms belly and thighs, sunny dimpled smile, tiny silver stud earrings",
    negExtra: "skinny, thin waist, flat stomach, black clothes, black bra, black lingerie",
    outfits: [
      { key: "base", desc: "wearing bright vintage mustard-yellow ribbed t-shirt knotted playfully at waist showing freckled midriff, cuffed medium-wash blue denim shorts with woven brown belt, bare thighs" },
      { key: "diner", desc: "wearing retro 1950s pastel-aqua mint green collared short-sleeve diner waitress dress with crisp white trim, brass name tag, and ruffled white cotton waist apron, bare thighs" },
      { key: "swim", desc: "wearing rich forest-emerald green tied halter bikini top with gold ring accent and matching emerald-green bikini bottoms, breezy translucent cream-and-gold patterned beach sarong knotted low at hip, bare thighs" },
      { key: "lounge", desc: "wearing cozy oversized warm olive-moss green chunky knit open cardigan over cream ribbed scoop-neck tank top, coral-terracotta drawstring lounge shorts, bare thighs" },
      { key: "nightwear", desc: "wearing cozy warm honey-apricot peach ribbed button-front henley sleep tank top and matching honey-apricot ruffle-hem sleep shorts, bare thighs" },
      { key: "lingerie", desc: "wearing covered rich forest-emerald green floral-lace balconette underwire bra with thin emerald straps covering breasts completely, bare freckled midriff, matching emerald-green floral-lace high-cut bikini panties, cream-white lace-top thigh-high stockings" },
    ],
  },
  chloe_bellamy: {
    name: "Chloe Bellamy",
    seed: 910501,
    bgRoom: `${WORKSPACE}/public/backgrounds/ash-and-velvet/chloes_bedroom.jpg`,
    traits:
      "28yo tall sculpted voluptuous hourglass woman, generous sculpted bust, narrow toned waist, dramatic curved hips, warm honey-tan smooth skin, zero freckles, long sleek wavy dark chocolate-brown espresso brunette hair past chest, piercing bright sky-blue eyes with crisp dark winged eyeliner, tiny beauty mark mole on right cheekbone, full glossy berry-rose lips in cool poised half-smile, silver stud earrings, delicate thin silver bar necklace",
    negExtra: "freckles, pink skin, pale skin, white skin",
    outfits: [
      { key: "base", desc: "wearing crisp pure-white tailored cotton button-down shirt with sleeves rolled to forearms and top buttons undone, high-waisted dark navy-slate pleated shorts with slim silver-buckled belt, bare thighs" },
      { key: "office", desc: "wearing polished soft-lavender lilac silk collared office blouse tucked into high-waisted charcoal-slate corporate pencil skirt with slim belt" },
      { key: "afterhours", desc: "wearing sleek sultry deep wine-burgundy red silk-satin cowl-neck cocktail slip mini-dress with thin spaghetti straps, bare shoulders and thighs" },
      { key: "lounge", desc: "wearing refined warm camel-taupe off-shoulder ribbed cashmere wrap top and tailored espresso-brown high-waisted lounge trousers" },
      { key: "nightwear", desc: "wearing luxurious deep royal-amethyst purple silk-satin camisole with champagne-gold floral lace trim and matching plum-purple satin sleep shorts, bare thighs" },
      { key: "lingerie", desc: "wearing covered deep royal sapphire-blue silk-satin balconette bra with champagne-ivory lace trim and thin sapphire straps covering breasts completely, bare midriff, navel, matching sapphire-blue satin and ivory lace bikini panties, navy garter straps, sheer navy thigh-high stockings" },
    ],
  },
  jill_smith: {
    name: "Jill Smith",
    seed: 910601,
    bgRoom: `${WORKSPACE}/public/backgrounds/ash-and-velvet/upstairs_hallway_bath.jpg`,
    traits:
      "19yo petite short young woman, adult college student, curvy pear-hourglass figure, wide curvy hips, thick soft thighs, full natural breasts, slender waist, pale porcelain fair skin, wavy shoulder-length golden blonde hair with bangs and loose face-framing curls, hazel-green eyes, soft rosy cheek blush, sweet confident smile, small silver stud earrings",
    negExtra: "chibi, child, loli",
    outfits: [
      { key: "base", desc: "wearing preppy cream-and-navy knit sweater vest over crisp white collared blouse with small navy bow tie, short crimson-burgundy tartan pleated mini skirt, bare thighs" },
      { key: "casual", desc: "wearing soft pastel-pink cropped zip-up hoodie open slightly at collar over white camisole, high-waisted flared sky-blue denim pleated mini skirt, bare thighs" },
      { key: "date", desc: "wearing sleek pastel-lilac periwinkle velvet sweetheart-neckline off-shoulder flared skater mini-dress, bare shoulders and collarbone, bare thighs" },
      { key: "lounge", desc: "wearing oversized off-shoulder soft powder-blue t-shirt slipping loosely off one shoulder, heather-gray cotton sleep shorts, bare thighs" },
      { key: "nightwear", desc: "wearing soft blush-rose pink silk satin camisole top with delicate white floral lace trim and thin spaghetti straps, matching blush-rose satin lace-hem sleep shorts, bare thighs" },
      { key: "swim", desc: "wearing coral-red ribbed two-piece bikini top and matching coral-red bikini bottoms, breezy sheer white translucent beach wrap tied casually low on hips, bare midriff, bare shoulders, thick bare thighs" },
      { key: "lingerie", desc: "wearing covered deep ruby-crimson red floral-lace balconette underwire bra with thin ruby-red shoulder straps covering breasts completely, bare midriff, navel, matching ruby-crimson floral-lace high-cut bikini panties, crisp white lace-top thigh-high stockings" },
    ],
  },
};

async function waitForComfy() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${COMFY_URL}/system_stats`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("ComfyUI is not online at http://127.0.0.1:8188");
}

async function clearStaleQueue() {
  try {
    await fetch(`${COMFY_URL}/queue`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }) });
    await fetch(`${COMFY_URL}/interrupt`, { method: "POST" });
    await new Promise((r) => setTimeout(r, 1000));
  } catch {}
}

async function uploadFile(filePath, name) {
  const fd = new FormData();
  fd.append("image", new Blob([new Uint8Array(fs.readFileSync(filePath))], { type: "image/png" }), name);
  fd.append("overwrite", "true");
  fd.append("type", "input");
  const res = await fetch(`${COMFY_URL}/upload/image`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Upload failed (${name}): ${res.status} ${await res.text()}`);
  const j = await res.json();
  return j.subfolder ? `${j.subfolder}/${j.name}` : j.name;
}

async function runPrompt(wf) {
  const res = await fetch(`${COMFY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: wf }),
  });
  if (!res.ok) throw new Error(`Prompt rejected: ${res.status} ${await res.text()}`);
  const { prompt_id } = await res.json();
  const start = Date.now();
  while (Date.now() - start < 1200000) {
    await new Promise((r) => setTimeout(r, 2500));
    const h = await (await fetch(`${COMFY_URL}/history/${prompt_id}`)).json();
    const rec = h[prompt_id];
    if (rec?.status?.status_str === "error") throw new Error(JSON.stringify(rec.status));
    if (rec?.outputs) {
      const files = [];
      for (const nodeOut of Object.values(rec.outputs)) {
        for (const img of nodeOut.images || []) {
          files.push(path.join(COMFY_OUT, img.subfolder || "", img.filename));
        }
      }
      return files;
    }
  }
  throw new Error("ComfyUI timed out (>600s)");
}

function runPhotoshopBatch(pairs) {
  const todo = pairs.filter(([src, dst]) => {
    if (!fs.existsSync(dst)) return true;
    return fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs;
  });
  if (todo.length === 0) {
    console.log("All Photoshop cutouts already up to date!");
    return;
  }
  const lines = todo.map(([a, b]) => `${a.replace(/\\/g, "/")}|${b.replace(/\\/g, "/")}`);
  fs.writeFileSync(PS_MANIFEST, lines.join("\n"), "utf8");
  const cmd = `
    $existing = Get-Process -Name "Photoshop" -ErrorAction SilentlyContinue
    if ($existing -and -not ($existing | Where-Object { $_.MainWindowTitle })) {
      $existing | Stop-Process -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 2
    }
    $ps = $null
    for ($i = 0; $i -lt 5; $i++) {
      try {
        $ps = New-Object -ComObject Photoshop.Application
        if ($ps) { break }
      } catch {
        Get-Process -Name "Photoshop" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
      }
    }
    if (-not $ps) { throw "Could not attach to Photoshop COM Application" }
    $ps.DoJavaScriptFile("${PS_JSX}")
  `;
  execFileSync("powershell", ["-NoProfile", "-Command", cmd], { stdio: "inherit", timeout: 1800000 });
}

function buildReviewSheets(heroId, hero, includeExpressions = false) {
  const studioDir = `${STUDIO_ROOT}/${heroId}`;
  const pubDir = `${PUB_ROOT}/${heroId}`;
  const allKeys = includeExpressions
    ? [...hero.outfits.map((o) => o.key), ...EXPRESSIONS.map((e) => e.key)]
    : hero.outfits.map((o) => o.key);
  const py = `
import os
from PIL import Image, ImageDraw

studio = r'${studioDir}'
pub = r'${pubDir}'
keys = ${JSON.stringify(allKeys)}
tw, th = 224, 300
cols = 6
rows = (len(keys) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 10) + 10, rows * (th + 36) + 10), (22, 22, 28))
d = ImageDraw.Draw(sheet)
for idx, k in enumerate(keys):
    r, c = divmod(idx, cols)
    x = 10 + c * (tw + 10)
    y = 10 + r * (th + 36)
    p = os.path.join(studio, f'{k}.png')
    if os.path.exists(p):
        im = Image.open(p).convert('RGB').resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (x, y + 22))
    d.text((x + 4, y + 2), k.upper(), fill=(245, 232, 195))
sheet.save(os.path.join(studio, '_contact_sheet.jpg'), quality=92)

bg = Image.open(r'${hero.bgRoom}').convert('RGBA')
bg = bg.resize((1400, int(1400 * bg.height / bg.width)), Image.LANCZOS)
cw, ch = bg.size
sample_keys = ['base', '${hero.outfits[hero.outfits.length - 2].key}', 'lingerie']
for i, k in enumerate(sample_keys):
    p = os.path.join(pub, f'{k}.png')
    if os.path.exists(p):
        sp = Image.open(p).convert('RGBA')
        sc = (ch * 0.88) / sp.height
        sp_rs = sp.resize((int(sp.width * sc), int(sp.height * sc)), Image.LANCZOS)
        bg.paste(sp_rs, (60 + i * 420, ch - sp_rs.height), sp_rs)
bg.convert('RGB').save(os.path.join(studio, '_alpha_check.jpg'), quality=92)
print('Saved review sheets in', studio)
`;
  execFileSync(PYTHON_EXE, ["-c", py], { stdio: "inherit" });
}

async function generateHero(heroId, seedOverride = null, withExpressions = false) {
  const hero = CAST[heroId];
  if (!hero) throw new Error(`Unknown heroId "${heroId}"`);

  const studioDir = `${STUDIO_ROOT}/${heroId}`;
  const pubDir = `${PUB_ROOT}/${heroId}`;
  fs.mkdirSync(studioDir, { recursive: true });
  fs.mkdirSync(pubDir, { recursive: true });

  const baseSeed = seedOverride !== null ? seedOverride : hero.seed;
  const neg = `${BASE_NEG}, ${hero.negExtra}`;

  // 1) Master base.png
  const baseOutfit = hero.outfits[0];
  const baseWhite = `${studioDir}/base.png`;
  if (!fs.existsSync(baseWhite)) {
    console.log(`\n=== [${heroId}] Step 1: Generating Deeb890 master base.png (seed=${baseSeed}) ===`);
    const baseWf = {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "WAI-Nsfw-Illustrious-17.safetensors" } },
      "14": { class_type: "LoraLoader", inputs: { model: ["1", 0], clip: ["1", 1], lora_name: "Deeb890 StyleIlluLYCO.safetensors", strength_model: 0.85, strength_clip: 0.85 } },
      "15": { class_type: "CLIPSetLastLayer", inputs: { clip: ["14", 1], stop_at_clip_layer: -2 } },
      "4": { class_type: "CLIPTextEncode", inputs: { clip: ["15", 0], text: `${DEEB_PREFIX}, ${hero.traits}, ${baseOutfit.desc}` } },
      "3": { class_type: "CLIPTextEncode", inputs: { clip: ["15", 0], text: neg } },
      "6": { class_type: "EmptyLatentImage", inputs: { width: 896, height: 1200, batch_size: 1 } },
      "2": { class_type: "KSampler", inputs: { model: ["14", 0], positive: ["4", 0], negative: ["3", 0], latent_image: ["6", 0], seed: baseSeed, steps: 28, cfg: 6.0, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1.0 } },
      "5": { class_type: "VAEDecode", inputs: { samples: ["2", 0], vae: ["1", 2] } },
      "20": { class_type: "SaveImage", inputs: { images: ["5", 0], filename_prefix: `deeb_cast/${heroId}/base` } },
    };
    const baseFiles = await runPrompt(baseWf);
    fs.copyFileSync(baseFiles[0], baseWhite);
  } else {
    console.log(`\n=== [${heroId}] Step 1: Reusing existing base.png ===`);
  }
  fs.copyFileSync(baseWhite, `${studioDir}/neutral.png`);

  const faceCrop = `${studioDir}/face_crop.png`;
  if (!fs.existsSync(faceCrop)) {
    execFileSync(PYTHON_EXE, [POST_JILL, "crop_face", baseWhite, faceCrop], { stdio: "inherit" });
  }

  const poseName = await uploadFile(baseWhite, `deeb_${heroId}_pose.png`);
  const cropName = await uploadFile(faceCrop, `deeb_${heroId}_face.png`);

  // 2) Remaining outfits + lingerie
  for (let i = 1; i < hero.outfits.length; i++) {
    const o = hero.outfits[i];
    const outWhite = `${studioDir}/${o.key}.png`;
    if (fs.existsSync(outWhite)) {
      console.log(`=== [${heroId}] Step 2: Reusing existing ${o.key}.png ===`);
      continue;
    }
    const seed = baseSeed + i;
    console.log(`\n=== [${heroId}] Step 2: Generating outfit ${o.key} (seed=${seed}) ===`);
    const wf = {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "WAI-Nsfw-Illustrious-17.safetensors" } },
      "14": { class_type: "LoraLoader", inputs: { model: ["1", 0], clip: ["1", 1], lora_name: "Deeb890 StyleIlluLYCO.safetensors", strength_model: 0.85, strength_clip: 0.85 } },
      "15": { class_type: "CLIPSetLastLayer", inputs: { clip: ["14", 1], stop_at_clip_layer: -2 } },
      "25": { class_type: "IPAdapterModelLoader", inputs: { ipadapter_file: "ip-adapter-plus_sdxl_vit-h.safetensors" } },
      "26": { class_type: "CLIPVisionLoader", inputs: { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" } },
      "18": { class_type: "LoadImage", inputs: { image: cropName } },
      "17": { class_type: "IPAdapterAdvanced", inputs: { model: ["14", 0], ipadapter: ["25", 0], image: ["18", 0], clip_vision: ["26", 0], weight: 0.58, weight_type: "ease in-out", combine_embeds: "concat", start_at: 0.0, end_at: 0.72, embeds_scaling: "V only" } },
      "30": { class_type: "LoadImage", inputs: { image: poseName } },
      "31": { class_type: "DWPreprocessor", inputs: { image: ["30", 0], detect_hand: "enable", detect_body: "enable", detect_face: "enable", resolution: 896, bbox_detector: "yolox_l.onnx", pose_estimator: "dw-ll_ucoco_384_bs5.torchscript.pt", scale_stick_for_xinsr_cn: "disable" } },
      "32": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-openpose-sdxl.safetensors" } },
      "4": { class_type: "CLIPTextEncode", inputs: { clip: ["15", 0], text: `${DEEB_PREFIX}, ${hero.traits}, ${o.desc}` } },
      "3": { class_type: "CLIPTextEncode", inputs: { clip: ["15", 0], text: neg } },
      "33": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["4", 0], negative: ["3", 0], control_net: ["32", 0], image: ["31", 0], strength: 0.62, start_percent: 0.0, end_percent: 0.80 } },
      "6": { class_type: "EmptyLatentImage", inputs: { width: 896, height: 1200, batch_size: 1 } },
      "2": { class_type: "KSampler", inputs: { model: ["17", 0], positive: ["33", 0], negative: ["33", 1], latent_image: ["6", 0], seed, steps: 28, cfg: 6.0, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 1.0 } },
      "5": { class_type: "VAEDecode", inputs: { samples: ["2", 0], vae: ["1", 2] } },
      "20": { class_type: "SaveImage", inputs: { images: ["5", 0], filename_prefix: `deeb_cast/${heroId}/${o.key}` } },
    };
    const outFiles = await runPrompt(wf);
    fs.copyFileSync(outFiles[0], `${studioDir}/${o.key}.png`);
  }

  // 3) Optional 5 Expressions pixel-locked to base.png (pass --with-expressions to enable)
  if (withExpressions) {
    for (const expr of EXPRESSIONS) {
      const exprWhite = `${studioDir}/${expr.key}.png`;
      if (fs.existsSync(exprWhite)) {
        console.log(`=== [${heroId}] Step 3: Reusing existing ${expr.key}.png ===`);
        continue;
      }
      const seed = baseSeed + expr.offset;
      console.log(`\n=== [${heroId}] Step 3: Generating expression ${expr.key} (seed=${seed}) ===`);
      const wf = {
        "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "WAI-Nsfw-Illustrious-17.safetensors" } },
        "14": { class_type: "LoraLoader", inputs: { model: ["1", 0], clip: ["1", 1], lora_name: "Deeb890 StyleIlluLYCO.safetensors", strength_model: 0.85, strength_clip: 0.85 } },
        "15": { class_type: "CLIPSetLastLayer", inputs: { clip: ["14", 1], stop_at_clip_layer: -2 } },
        "10": { class_type: "LoadImage", inputs: { image: poseName } },
        "13": { class_type: "VAEEncode", inputs: { pixels: ["10", 0], vae: ["1", 2] } },
        "25": { class_type: "IPAdapterModelLoader", inputs: { ipadapter_file: "ip-adapter-plus_sdxl_vit-h.safetensors" } },
        "26": { class_type: "CLIPVisionLoader", inputs: { clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors" } },
        "18": { class_type: "LoadImage", inputs: { image: cropName } },
        "17": { class_type: "IPAdapterAdvanced", inputs: { model: ["14", 0], ipadapter: ["25", 0], image: ["18", 0], clip_vision: ["26", 0], weight: 0.58, weight_type: "ease in-out", combine_embeds: "concat", start_at: 0.0, end_at: 0.68, embeds_scaling: "V only" } },
        "30": { class_type: "LoadImage", inputs: { image: poseName } },
        "31": { class_type: "DWPreprocessor", inputs: { image: ["30", 0], detect_hand: "enable", detect_body: "enable", detect_face: "enable", resolution: 896, bbox_detector: "yolox_l.onnx", pose_estimator: "dw-ll_ucoco_384_bs5.torchscript.pt", scale_stick_for_xinsr_cn: "disable" } },
        "32": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-openpose-sdxl.safetensors" } },
        "4": { class_type: "CLIPTextEncode", inputs: { clip: ["15", 0], text: `${DEEB_PREFIX}, ${hero.traits}, ${baseOutfit.desc}, ${expr.desc}` } },
        "3": { class_type: "CLIPTextEncode", inputs: { clip: ["15", 0], text: neg } },
        "33": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["4", 0], negative: ["3", 0], control_net: ["32", 0], image: ["31", 0], strength: 0.78, start_percent: 0.0, end_percent: 0.85 } },
        "2": { class_type: "KSampler", inputs: { model: ["17", 0], positive: ["33", 0], negative: ["33", 1], latent_image: ["13", 0], seed, steps: 26, cfg: 6.0, sampler_name: "euler_ancestral", scheduler: "normal", denoise: 0.62 } },
        "5": { class_type: "VAEDecode", inputs: { samples: ["2", 0], vae: ["1", 2] } },
        "20": { class_type: "SaveImage", inputs: { images: ["5", 0], filename_prefix: `deeb_cast/${heroId}/expr_${expr.key}` } },
      };
      const outFiles = await runPrompt(wf);
      execFileSync(PYTHON_EXE, [LOCK_SCRIPT, baseWhite, outFiles[0], `${studioDir}/${expr.key}.png`, "0.295"], { stdio: "inherit" });
    }
  } else {
    console.log(`\n=== [${heroId}] Step 3: Skipping extra expressions (outfits-only mode; neutral = base) ===`);
  }

  // 4) Photoshop Select Subject cutout
  console.log(`\n=== [${heroId}] Step 4: Routing sprites through Adobe Photoshop 2027 ===`);
  const cutoutKeys = withExpressions
    ? [...hero.outfits.map((o) => o.key), ...EXPRESSIONS.map((e) => e.key)]
    : hero.outfits.map((o) => o.key);
  runPhotoshopBatch(cutoutKeys.map((k) => [`${studioDir}/${k}.png`, `${pubDir}/${k}.png`]));
  fs.copyFileSync(`${pubDir}/base.png`, `${pubDir}/neutral.png`);

  // 5) Build workspace-visible review sheets
  buildReviewSheets(heroId, hero, withExpressions);
  console.log(`\n[${heroId}] Checkpoint ready! Review sprite-studio/deeb/${heroId}/_contact_sheet.jpg & _alpha_check.jpg`);
}

const rawArgs = process.argv.slice(2);
const withExpressions = rawArgs.includes("--with-expressions");
const posArgs = rawArgs.filter((a) => !a.startsWith("--"));
const heroArg = posArgs[0];
const seedArg = posArgs[1] ? Number(posArgs[1]) : null;
if (!heroArg || !CAST[heroArg]) {
  console.error("Usage: node scripts/generate_deeb_cast.mjs <hero_slug> [seed_override] [--with-expressions]");
  console.error("Available:", Object.keys(CAST).join(", "));
  process.exit(1);
}

await waitForComfy();
await clearStaleQueue();
await generateHero(heroArg, seedArg, withExpressions);
