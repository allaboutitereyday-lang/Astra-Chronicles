/**
 * Local ComfyUI Gacha Character Sprite Pipeline Client
 * Connects to a local ComfyUI server (default: http://127.0.0.1:8188) and executes:
 * - Pass A: Base gacha splash sprite generation (illustriousXL_v01.safetensors -> RMBG-2.0 -> SaveImageWithAlpha)
 * - Pass B: Identity-locked expression variants via IPAdapterAdvanced (ip-adapter-plus_sdxl_vit-h + CLIP-ViT-H-14)
 */

export const DEFAULT_COMFYUI_URL =
  process.env.COMFYUI_URL || "http://127.0.0.1:8188";

export const DEFAULT_GACHA_CHECKPOINT =
  process.env.COMFYUI_CHECKPOINT || "illustriousXL_v01.safetensors";

export const GACHA_QUALITY_PREFIX =
  "masterpiece, best quality, newest, absurdres, highres, official gacha splash art, korean tower manhwa illustration, visual novel character sprite, clean crisp lineart, cel shaded with soft luminous gradients, glossy hair highlights, expressive detailed jewel-like eyes, intricate costume trim, solo, 1girl, cowboy shot, three-quarter standing portrait, pure solid white background, simple background";

export const GACHA_NEGATIVE_PROMPT =
  "worst quality, low quality, normal quality, lowres, blurry, jpeg artifacts, bad anatomy, bad hands, extra digits, missing fingers, fused fingers, extra limbs, mutated hands, poorly drawn face, deformed, ugly, duplicate, multiple girls, 2girls, crowd, complex background, scenery, text, watermark, signature, username, frame, border, card frame, monochrome, thick cartoon outlines, flat western cartoon";

export interface ComfySpriteRequest {
  positivePrompt: string;
  negativePrompt?: string;
  checkpoint?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  samplerName?: string;
  scheduler?: string;
  seed?: number;
  referenceImageFilename?: string; // Filename in ComfyUI input/ directory
  ipAdapterWeight?: number;
  ipAdapterEndAt?: number;
  saveRawReference?: boolean;
  filenamePrefix?: string;
  comfyUrl?: string;
  timeoutMs?: number;
}

export interface ComfySpriteResult {
  alphaImageBuffer: Buffer;
  rawWhiteBgBuffer?: Buffer;
  seed: number;
  promptId: string;
}

/**
 * Checks whether local ComfyUI is reachable and responsive.
 */
export async function isComfyUiOnline(
  comfyUrl: string = DEFAULT_COMFYUI_URL,
  timeoutMs: number = 2500
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${comfyUrl.replace(/\/$/, "")}/system_stats`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Uploads a PNG/JPG buffer into ComfyUI's `input/` folder for LoadImage / IPAdapterAdvanced.
 */
export async function uploadReferenceToComfyUi(
  imageBuffer: Buffer,
  filename: string,
  comfyUrl: string = DEFAULT_COMFYUI_URL
): Promise<string> {
  const baseUrl = comfyUrl.replace(/\/$/, "");
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
  formData.append("image", blob, filename);
  formData.append("overwrite", "true");
  formData.append("type", "input");

  const res = await fetch(`${baseUrl}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`ComfyUI image upload failed (${res.status}): ${errText}`);
  }

  const json = (await res.json()) as { name?: string; subfolder?: string };
  return json.subfolder ? `${json.subfolder}/${json.name}` : json.name || filename;
}

/**
 * Builds the ComfyUI API-format workflow graph matching `Character Gen.json`
 * with IllustriousXL + optional IPAdapterAdvanced + RMBG-2.0 + SaveImageWithAlpha.
 */
export function buildGachaSpriteWorkflow(opts: ComfySpriteRequest): {
  workflow: Record<string, any>;
  seed: number;
} {
  const seed =
    typeof opts.seed === "number" && Number.isFinite(opts.seed)
      ? Math.abs(Math.floor(opts.seed))
      : Math.floor(Math.random() * 900_000_000_000) + 100_000;

  const checkpoint = opts.checkpoint || DEFAULT_GACHA_CHECKPOINT;
  const width = opts.width || 832;
  const height = opts.height || 1216;
  const steps = opts.steps || 24;
  const cfg = opts.cfg ?? 6.0;
  const samplerName = opts.samplerName || "euler_ancestral";
  const scheduler = opts.scheduler || "karras";
  const filenamePrefix = opts.filenamePrefix || "astra_sprites/sprite";
  const negativePrompt = opts.negativePrompt || GACHA_NEGATIVE_PROMPT;

  const hasRef = Boolean(opts.referenceImageFilename);

  const workflow: Record<string, any> = {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: {
        ckpt_name: checkpoint,
      },
    },
    "4": {
      class_type: "CLIPTextEncode",
      inputs: {
        clip: ["1", 1],
        text: opts.positivePrompt,
      },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: {
        clip: ["1", 1],
        text: negativePrompt,
      },
    },
    "7": {
      class_type: "EmptyLatentImage",
      inputs: {
        width,
        height,
        batch_size: 1,
      },
    },
    "2": {
      class_type: "KSampler",
      inputs: {
        model: hasRef ? ["17", 0] : ["1", 0],
        positive: ["4", 0],
        negative: ["3", 0],
        latent_image: ["7", 0],
        seed,
        steps,
        cfg,
        sampler_name: samplerName,
        scheduler,
        denoise: 1.0,
      },
    },
    "5": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["2", 0],
        vae: ["1", 2],
      },
    },
    "8": {
      class_type: "RMBG",
      inputs: {
        image: ["5", 0],
        model: "RMBG-2.0",
        sensitivity: 1.0,
        process_res: 1216,
        mask_blur: 0,
        mask_offset: 0,
        invert_output: true,
        refine_foreground: false,
        background: "Alpha",
        background_color: "#222222",
      },
    },
    "9": {
      class_type: "SaveImageWithAlpha",
      inputs: {
        images: ["5", 0],
        mask: ["8", 1],
        filename_prefix: filenamePrefix,
      },
    },
  };

  if (opts.saveRawReference) {
    workflow["10"] = {
      class_type: "SaveImage",
      inputs: {
        images: ["5", 0],
        filename_prefix: `${filenamePrefix}_rawref`,
      },
    };
  }

  if (hasRef) {
    workflow["25"] = {
      class_type: "IPAdapterModelLoader",
      inputs: {
        ipadapter_file: "ip-adapter-plus_sdxl_vit-h.safetensors",
      },
    };
    workflow["26"] = {
      class_type: "CLIPVisionLoader",
      inputs: {
        clip_name: "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
      },
    };
    workflow["18"] = {
      class_type: "LoadImage",
      inputs: {
        image: opts.referenceImageFilename,
      },
    };
    workflow["34"] = {
      class_type: "PrepImageForClipVision",
      inputs: {
        image: ["18", 0],
        interpolation: "LANCZOS",
        crop_position: "pad",
        sharpening: 0.0,
      },
    };
    workflow["17"] = {
      class_type: "IPAdapterAdvanced",
      inputs: {
        model: ["1", 0],
        ipadapter: ["25", 0],
        image: ["34", 0],
        clip_vision: ["26", 0],
        weight: opts.ipAdapterWeight ?? 0.72,
        weight_type: "linear",
        combine_embeds: "concat",
        start_at: 0.0,
        end_at: opts.ipAdapterEndAt ?? 0.92,
        embeds_scaling: "V only",
      },
    };
  }

  return { workflow, seed };
}

async function fetchComfyOutputImage(
  baseUrl: string,
  fileMeta: { filename: string; subfolder?: string; type?: string }
): Promise<Buffer> {
  const params = new URLSearchParams({
    filename: fileMeta.filename,
    subfolder: fileMeta.subfolder || "",
    type: fileMeta.type || "output",
  });
  const res = await fetch(`${baseUrl}/view?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ComfyUI output image ${fileMeta.filename} (${res.status})`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Queues a sprite workflow in local ComfyUI, awaits completion, and returns the RGBA PNG buffer.
 */
export async function generateComfyCharacterSprite(
  opts: ComfySpriteRequest
): Promise<ComfySpriteResult> {
  const baseUrl = (opts.comfyUrl || DEFAULT_COMFYUI_URL).replace(/\/$/, "");
  const timeoutMs = opts.timeoutMs || 240_000;
  const { workflow, seed } = buildGachaSpriteWorkflow(opts);

  const queueRes = await fetch(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!queueRes.ok) {
    const errBody = await queueRes.text().catch(() => "");
    throw new Error(`ComfyUI /prompt rejected (${queueRes.status}): ${errBody}`);
  }

  const queueJson = (await queueRes.json()) as { prompt_id?: string };
  const promptId = queueJson.prompt_id;
  if (!promptId) {
    throw new Error("ComfyUI /prompt did not return a prompt_id");
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((r) => setTimeout(r, 1200));
    const histRes = await fetch(`${baseUrl}/history/${promptId}`);
    if (!histRes.ok) continue;

    const histJson = (await histRes.json()) as Record<string, any>;
    const entry = histJson?.[promptId];
    if (!entry) continue;

    if (entry.status?.status_str === "error") {
      throw new Error(
        `ComfyUI execution error on ${promptId}: ${JSON.stringify(entry.status?.messages || [])}`
      );
    }

    const outputs = entry.outputs || {};
    const alphaNodeOut = outputs["9"]?.images?.[0];
    if (alphaNodeOut) {
      const alphaImageBuffer = await fetchComfyOutputImage(baseUrl, alphaNodeOut);
      let rawWhiteBgBuffer: Buffer | undefined;
      const rawNodeOut = outputs["10"]?.images?.[0];
      if (rawNodeOut) {
        rawWhiteBgBuffer = await fetchComfyOutputImage(baseUrl, rawNodeOut);
      }
      return {
        alphaImageBuffer,
        rawWhiteBgBuffer,
        seed,
        promptId,
      };
    }
  }

  throw new Error(`Timed out waiting for ComfyUI prompt ${promptId} after ${timeoutMs}ms`);
}

export interface AlphaCutoutOptions {
  imageBuffer: Buffer;
  uploadFilename: string;
  filenamePrefix?: string;
  processRes?: number;
  maskBlur?: number;
  maskOffset?: number;
  comfyUrl?: string;
  timeoutMs?: number;
}

/**
 * Runs a fast template-preserving RMBG-2.0 + SaveImageWithAlpha cutout graph in ComfyUI.
 * Preserves 100% of the source RGB pixels while generating a crisp 32-bit RGBA alpha channel.
 */
export async function extractAlphaCutoutWithComfyUi(
  opts: AlphaCutoutOptions
): Promise<Buffer> {
  const baseUrl = (opts.comfyUrl || DEFAULT_COMFYUI_URL).replace(/\/$/, "");
  const timeoutMs = opts.timeoutMs || 120_000;
  const uploadedName = await uploadReferenceToComfyUi(
    opts.imageBuffer,
    opts.uploadFilename,
    baseUrl
  );

  const workflow: Record<string, any> = {
    "1": {
      class_type: "LoadImage",
      inputs: {
        image: uploadedName,
      },
    },
    "2": {
      class_type: "RMBG",
      inputs: {
        image: ["1", 0],
        model: "RMBG-2.0",
        sensitivity: 1.0,
        process_res: opts.processRes || 1216,
        mask_blur: opts.maskBlur ?? 0,
        mask_offset: opts.maskOffset ?? -1,
        invert_output: true,
        refine_foreground: false,
        background: "Alpha",
        background_color: "#222222",
      },
    },
    "3": {
      class_type: "SaveImageWithAlpha",
      inputs: {
        images: ["1", 0],
        mask: ["2", 1],
        filename_prefix: opts.filenamePrefix || "astra_cutouts/sprite_rgba",
      },
    },
  };

  const queueRes = await fetch(`${baseUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!queueRes.ok) {
    const errBody = await queueRes.text().catch(() => "");
    throw new Error(`ComfyUI cutout /prompt rejected (${queueRes.status}): ${errBody}`);
  }

  const queueJson = (await queueRes.json()) as { prompt_id?: string };
  const promptId = queueJson.prompt_id;
  if (!promptId) {
    throw new Error("ComfyUI cutout /prompt did not return a prompt_id");
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((r) => setTimeout(r, 750));
    const histRes = await fetch(`${baseUrl}/history/${promptId}`);
    if (!histRes.ok) continue;

    const histJson = (await histRes.json()) as Record<string, any>;
    const entry = histJson?.[promptId];
    if (!entry) continue;

    if (entry.status?.status_str === "error") {
      throw new Error(
        `ComfyUI cutout execution error on ${promptId}: ${JSON.stringify(entry.status?.messages || [])}`
      );
    }

    const alphaNodeOut = entry.outputs?.["3"]?.images?.[0];
    if (alphaNodeOut) {
      return await fetchComfyOutputImage(baseUrl, alphaNodeOut);
    }
  }

  throw new Error(`Timed out waiting for ComfyUI cutout ${promptId} after ${timeoutMs}ms`);
}
