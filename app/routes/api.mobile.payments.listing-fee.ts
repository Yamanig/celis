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
        const requestId = crypto.randomUUID();
        const startedAt = Date.now();
        try {
          console.info("[mobile-listing-payment] request received", { requestId });
          const authorization = request.headers.get("authorization");
          const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
          if (!token) return json({ message: "Authentication required." }, 401);

          const { data: authData, error: authError } = await getServiceSupabase().auth.getUser(token);
          if (authError || !authData.user) return json({ message: "Invalid or expired session." }, 401);

          const parsed = requestSchema.safeParse(await request.json().catch(() => null));
          if (!parsed.success) return json({ message: "Invalid payment request." }, 400);
          console.info("[mobile-listing-payment] request authenticated", {
            requestId,
            listingId: parsed.data.listingId,
          });

          const [listing] = await db
            .select({ id: listings.id, sellerId: listings.sellerId, price: listings.price, categoryId: listings.categoryId })
            .from(listings)
            .where(eq(listings.id, parsed.data.listingId))
            .limit(1);
          if (!listing) return json({ message: "Listing not found." }, 404);
          if (listing.sellerId !== authData.user.id) return json({ message: "Forbidden." }, 403);

          const pricing = await getListingPricing(listing.price, listing.categoryId);
          console.info("[mobile-listing-payment] starting gateway payment", {
            requestId,
            listingId: listing.id,
            amountCents: pricing.feeCents,
          });
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

          console.info("[mobile-listing-payment] request completed", {
            requestId,
            merchantRef: payment.merchantRef,
            status: payment.status,
            durationMs: Date.now() - startedAt,
          });

          return json({ ...payment, amountCents: pricing.feeCents });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : "Payment request failed.";
          console.error("[mobile-listing-payment] request failed", {
            requestId,
            durationMs: Date.now() - startedAt,
            message,
          });
          return json({ message }, 500);
        }
      },
    },
  },
});
