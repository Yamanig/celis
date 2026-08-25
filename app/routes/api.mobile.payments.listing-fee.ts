import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { listings } from "~/db/schema";
import { getServiceSupabase } from "~/lib/supabase/server";
import { getListingPricing } from "~/server/config.server";
import { initiateWalletPayment } from "~/server/payments.server";

const requestSchema = z.object({
  listingId: z.string().uuid(),
  phone: z.string().min(7).max(20),
  idempotencyKey: z.string().min(16).max(160),
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders() });
}

export const Route = createFileRoute("/api/mobile/payments/listing-fee")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders() }),
      POST: async ({ request }) => {
        try {
          const authorization = request.headers.get("authorization");
          const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
          if (!token) return json({ message: "Authentication required." }, 401);

          const { data: authData, error: authError } = await getServiceSupabase().auth.getUser(token);
          if (authError || !authData.user) return json({ message: "Invalid or expired session." }, 401);

          const parsed = requestSchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return json({ message: "Invalid payment request." }, 400);

          const [listing] = await db
            .select({ id: listings.id, sellerId: listings.sellerId, price: listings.price, categoryId: listings.categoryId })
            .from(listings)
            .where(eq(listings.id, parsed.data.listingId))
            .limit(1);
          if (!listing) return json({ message: "Listing not found." }, 404);
          if (listing.sellerId !== authData.user.id) return json({ message: "Forbidden." }, 403);

          const pricing = await getListingPricing(listing.price, listing.categoryId);
          const payment = await initiateWalletPayment(
            authData.user.id,
            listing.id,
            null,
            "evc",
            parsed.data.phone,
            pricing.feeCents,
            "listing_fee",
            parsed.data.idempotencyKey,
          );

          return json({ ...payment, amountCents: pricing.feeCents });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Payment request failed.";
          return json({ message }, 500);
        }
      },
    },
  },
});
