import { getServiceSupabase } from "~/lib/supabase/server";
import { env } from "~/lib/env";
import { CelisError } from "~/lib/errors";

export function getListingImageBucket() {
  return env.SUPABASE_STORAGE_BUCKET || "listing-images";
}

async function ensureListingImageBucket(supabase: ReturnType<typeof getServiceSupabase>) {
  const bucketName = getListingImageBucket();
  const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);
  if (bucket) return;
  if (getError && getError.message !== "The resource was not found") {
    throw new CelisError(getError.message, "STORAGE_ERROR", 500);
  }
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/*"],
  });
  if (createError) {
    throw new CelisError(createError.message, "STORAGE_ERROR", 500);
  }
}

export async function createListingImageUploadUrl(
  sellerId: string,
  fileName: string,
  _fileType: string
) {
  const supabase = getServiceSupabase();
  await ensureListingImageBucket(supabase);
  const bucketName = getListingImageBucket();
  const path = `${sellerId}/${crypto.randomUUID()}-${fileName}`;

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
  };
}

export async function deleteListingImage(path: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.storage.from(getListingImageBucket()).remove([path]);
  if (error) {
    throw new CelisError(error.message, "STORAGE_ERROR", 500);
  }
}
