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

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };

  const slug = getArg("--slug");
  if (!slug) {
    console.error(
      "Usage: npx tsx scripts/process_template_sprites.ts --slug <slug> --neutral <path> --intrigued <path> --flustered <path> --smug <path> --combat_ready <path> --hurt <path> [--mask-offset -1]"
    );
    process.exit(1);
  }

  const maskOffsetRaw = getArg("--mask-offset");
  const maskOffset =
    maskOffsetRaw !== undefined ? Number(maskOffsetRaw) : -1;

  const online = await isComfyUiOnline(DEFAULT_COMFYUI_URL, 4000);
  if (!online) {
    console.error(
      `[process_template_sprites] ComfyUI is offline at ${DEFAULT_COMFYUI_URL}. Start ComfyUI first.`
    );
    process.exit(1);
  }

  const outDir = path.resolve(
    process.cwd(),
    "public",
    "characters",
    "starfall-labyrinth",
    slug
  );
  fs.mkdirSync(outDir, { recursive: true });

  for (const expr of EXPRESSION_KEYS) {
    const srcPath = getArg(`--${expr}`);
    if (!srcPath) {
      console.warn(`[process_template_sprites] Skipping ${expr} (no --${expr} provided)`);
      continue;
    }

    const resolvedSrc = path.resolve(srcPath);
    if (!fs.existsSync(resolvedSrc)) {
      throw new Error(`Source image not found for ${expr}: ${resolvedSrc}`);
    }

    console.log(`[${slug}] Extracting RMBG-2.0 RGBA cutout for ${expr}...`);
    const srcBuf = fs.readFileSync(resolvedSrc);
    const rgbaBuf = await extractAlphaCutoutWithComfyUi({
      imageBuffer: srcBuf,
      uploadFilename: `tpl_${slug}_${expr}${path.extname(resolvedSrc) || ".png"}`,
      filenamePrefix: `starfall_tpl/${slug}_${expr}`,
      processRes: 1216,
      maskBlur: 0,
      maskOffset,
    });

    const outPath = path.join(outDir, `${expr}.png`);
    fs.writeFileSync(outPath, rgbaBuf);
    console.log(
      `[${slug}] Saved ${outPath} (${(rgbaBuf.byteLength / 1024).toFixed(1)} KB)`
    );
  }

  console.log(`[${slug}] Completed template-locked RGBA sprite set!`);
}

main().catch((err) => {
  console.error("[process_template_sprites] Fatal error:", err);
  process.exit(1);
});
