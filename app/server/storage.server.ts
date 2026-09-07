import { getServiceSupabase } from "~/lib/supabase/server";
import { env } from "~/lib/env";
import { CelisError } from "~/lib/errors";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function getListingImageBucket() {
  return env.SUPABASE_STORAGE_BUCKET || "listing-images";
}

function sanitizeFileName(fileName: string) {
  const base = fileName.split(/[/\\]/).pop() ?? "image";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "image";
}

export async function createListingImageUploadUrl(
  sellerId: string,
  fileName: string,
  fileType: string
) {
  if (!/^image\//i.test(fileType)) {
    throw new CelisError("Only image uploads are allowed", "INVALID_FILE_TYPE", 400);
  }

  const supabase = getServiceSupabase();
  // The bucket is provisioned at deploy time (`pnpm storage:create-bucket`);
  // it is never created from a request path (SEC-3).
  const bucketName = getListingImageBucket();
  const path = `${sellerId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(path);

  if (error) {
    throw new CelisError(error.message, "STORAGE_ERROR", 500);
  }

  return {
    signedUrl: data.signedUrl,
    path,
    publicUrl: supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl,
    maxBytes: MAX_IMAGE_BYTES,
  };
}

export async function deleteListingImage(path: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.storage.from(getListingImageBucket()).remove([path]);
  if (error) {
    throw new CelisError(error.message, "STORAGE_ERROR", 500);
  }
}
