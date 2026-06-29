import { getServiceSupabase } from "~/lib/supabase/server";
import { env } from "~/lib/env";
import { CelisError } from "~/lib/errors";

export function getListingImageBucket() {
  return env.SUPABASE_STORAGE_BUCKET;
}

export async function createListingImageUploadUrl(
  sellerId: string,
  fileName: string,
  _fileType: string
) {
  const supabase = getServiceSupabase();
  const path = `${sellerId}/${crypto.randomUUID()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from(getListingImageBucket())
    .createSignedUploadUrl(path);

  if (error) {
    throw new CelisError(error.message, "STORAGE_ERROR", 500);
  }

  return {
    signedUrl: data.signedUrl,
    path,
    publicUrl: supabase.storage.from(getListingImageBucket()).getPublicUrl(path).data.publicUrl,
  };
}

export async function deleteListingImage(path: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.storage.from(getListingImageBucket()).remove([path]);
  if (error) {
    throw new CelisError(error.message, "STORAGE_ERROR", 500);
  }
}
