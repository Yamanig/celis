import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "~/db";
import { listingInteractions } from "~/db/schema";
import { getCurrentUser } from "./auth.server";

const recordInteractionSchema = z.object({
  listingId: z.string().uuid(),
  type: z.enum(["show_contact", "request_callback"]),
  phone: z.string().optional(),
  description: z.string().optional(),
});

export const recordListingInteraction = createServerFn({ method: "POST" })
  .validator(recordInteractionSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await db.insert(listingInteractions).values({
      listingId: data.listingId,
      userId: user.id,
      type: data.type,
      phone: data.phone ?? null,
      description: data.description ?? null,
    });

    return { ok: true };
  });
