import { compressAvatarImage } from "./saveStorage";

export const DEFAULT_AVATAR = "/characters/aria/aria_neutral.png";
export const DEFAULT_BG = "/backgrounds/imperial_capital_imperium.jpg";

/**
 * Safely sanitizes an image URL, returning a fallback if empty or whitespace.
 */
export function sanitizeImageUrl(url: string | null | undefined, fallback: string = DEFAULT_AVATAR): string {
  if (!url || typeof url !== "string" || !url.trim()) {
    return fallback;
  }
  return url.trim();
}

/**
 * Reads a File from an <input type="file"> and returns a web-optimized, compressed data URL.
 * Preserves localStorage quota while ensuring crisp visual display.
 */
export async function processImageUpload(file: File, maxDim: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file selected."));
    }
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Selected file must be an image (PNG, JPG, WebP, etc.)."));
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressAvatarImage(raw, maxDim);
        resolve(compressed || raw);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file from disk."));
    reader.readAsDataURL(file);
  });
}

