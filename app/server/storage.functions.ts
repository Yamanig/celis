import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createListingImageUploadUrl } from "./storage.server";
import { requireSellerUser } from "./auth.server";

const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|webp|gif|avif)$/i, "Unsupported image type"),
});

export const getListingImageUploadUrl = createServerFn({ method: "POST" })
  .validator(uploadUrlSchema)
  .handler(async ({ data }) => {
    // SEC-3: require an authenticated seller and force the storage path prefix
    // to their own id. The client can no longer choose an arbitrary sellerId.
    const user = await requireSellerUser();
    return createListingImageUploadUrl(user.id, data.fileName, data.fileType);
  });
