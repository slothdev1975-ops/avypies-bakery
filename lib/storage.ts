import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

export async function uploadImage(admin: SupabaseClient, file: File, folder: string) {
  if (!ALLOWED.includes(file.type)) throw new Error("Upload a PNG, JPG or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 4 MB or smaller.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("public-assets")
    .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return path;
}
