import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { squareWebp } from "@/lib/avatar";

const BUCKET = "avatars";
const pathFor = (userId: string) => `${userId}/avatar.webp`;

/** Crop and shrink a chosen picture, store it in the learner's own folder, and point their profile at it. */
export async function uploadAvatar(userId: string, file: Blob): Promise<User> {
  const image = await squareWebp(file);
  const { error } = await supabase.storage.from(BUCKET).upload(pathFor(userId), image, {
    upsert: true,
    contentType: "image/webp",
    cacheControl: "3600",
  });
  if (error) throw error;
  // The path never changes, so the address carries a version to make browsers fetch the new picture.
  const url = `${supabase.storage.from(BUCKET).getPublicUrl(pathFor(userId)).data.publicUrl}?v=${Date.now()}`;
  const { data, error: updateError } = await supabase.auth.updateUser({ data: { custom_avatar_url: url } });
  if (updateError) throw updateError;
  return data.user;
}

/**
 * Delete the picture file only (no profile change). Used when an account is deleted: the bucket is public, so a file
 * left behind would stay reachable by its address after the learner asked for their data to go. Storage rows cannot be
 * removed from SQL, so the learner's own session does it before the account goes.
 */
export async function deleteAvatarFile(userId: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([pathFor(userId)]);
  if (error) throw error;
}

/** Remove the learner's own picture; the app falls back to their provider's picture, then to their initials. */
export async function removeAvatar(userId: string): Promise<User> {
  const { error } = await supabase.storage.from(BUCKET).remove([pathFor(userId)]);
  if (error) throw error;
  const { data, error: updateError } = await supabase.auth.updateUser({ data: { custom_avatar_url: null } });
  if (updateError) throw updateError;
  return data.user;
}
