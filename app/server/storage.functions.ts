import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createListingImageUploadUrl } from "./storage.server";

const uploadUrlSchema = z.object({
  sellerId: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string().regex(/^image\//, "Only image files are allowed"),
});

export const getListingImageUploadUrl = createServerFn({ method: "POST" })
  .validator(uploadUrlSchema)
  .handler(async ({ data }) => {
    return createListingImageUploadUrl(data.sellerId, data.fileName, data.fileType);
  });
