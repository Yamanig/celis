import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "listing-images";

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await supabase.storage.getBucket(bucketName);
if (existing) {
  console.log(`Bucket "${bucketName}" already exists.`);
  process.exit(0);
}

const { data, error } = await supabase.storage.createBucket(bucketName, {
  public: true,
  allowedMimeTypes: ["image/*"],
  fileSizeLimit: 10485760, // 10 MB
});

if (error) {
  console.error("Failed to create bucket:", error.message);
  process.exit(1);
}

console.log(`Created bucket "${data.name}" successfully.`);
