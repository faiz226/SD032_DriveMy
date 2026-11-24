import type { User } from "@supabase/supabase-js";

/** Side of the stored picture, in pixels. Shown at 32 to 128 px, so 256 stays sharp on a dense screen. */
export const AVATAR_SIZE = 256;
/** What the `avatars` bucket accepts (see the migration); the app sends a few kilobytes. */
export const AVATAR_MAX_INPUT_BYTES = 15 * 1024 * 1024;

/**
 * The picture to show for a learner. A picture they set here wins; the provider's (Google's) stays as
 * the fallback, because the provider rewrites `avatar_url` each time they sign in.
 */
export function avatarUrl(user: Pick<User, "user_metadata"> | null | undefined): string | undefined {
  const meta = user?.user_metadata ?? {};
  const own = meta["custom_avatar_url"];
  const provider = meta["avatar_url"];
  if (typeof own === "string" && own) return own;
  return typeof provider === "string" && provider ? provider : undefined;
}

/** Whether the learner has set their own picture (and so can remove it). */
export function hasOwnAvatar(user: Pick<User, "user_metadata"> | null | undefined): boolean {
  const own = user?.user_metadata?.["custom_avatar_url"];
  return typeof own === "string" && own.length > 0;
}

/** Up to two capital letters from a name, for the picture's fallback. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0]!.charAt(0);
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : "";
  return (first + last).toLocaleUpperCase();
}

/** The largest centred square inside a width x height picture. */
export function centredSquare(width: number, height: number): { sx: number; sy: number; side: number } {
  const side = Math.min(width, height);
  return { sx: Math.floor((width - side) / 2), sy: Math.floor((height - side) / 2), side };
}

/** Crop a picture to its centred square and shrink it to AVATAR_SIZE pixels, as WebP. */
export async function squareWebp(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("not-an-image");
  if (file.size > AVATAR_MAX_INPUT_BYTES) throw new Error("too-large");
  const bitmap = await createImageBitmap(file);
  try {
    const { sx, sy, side } = centredSquare(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no-canvas");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) throw new Error("encode-failed");
    return blob;
  } finally {
    bitmap.close();
  }
}
