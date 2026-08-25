import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getAdminWaafiGateway,
  saveAdminWaafiGateway,
} from "./payment-gateways.server";
import { WAAFI_PRODUCTION_URL, WAAFI_SANDBOX_URL } from "~/lib/waafi";

const waafiGatewaySchema = z
  .object({
    enabled: z.boolean(),
    environment: z.enum(["sandbox", "production"]),
    baseUrl: z.string().url().refine((value) => value.startsWith("https://"), {
      message: "Waafi base URL must use HTTPS.",
    }),
    merchantUid: z.string().trim().min(1).max(200).optional(),
    apiUserId: z.string().trim().min(1).max(200).optional(),
    apiKey: z.string().trim().min(1).max(500).optional(),
    timeoutSeconds: z.number().int().min(5).max(120),
  })
  .superRefine((value, ctx) => {
    const expected = value.environment === "production" ? WAAFI_PRODUCTION_URL : WAAFI_SANDBOX_URL;
    if (value.baseUrl !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["baseUrl"],
        message: `Use the approved ${value.environment} Waafi endpoint.`,
      });
    }
  });

export const fetchAdminWaafiGateway = createServerFn({ method: "GET" }).handler(
  getAdminWaafiGateway
);

export const updateAdminWaafiGateway = createServerFn({ method: "POST" })
  .validator(waafiGatewaySchema)
  .handler(async ({ data }) => saveAdminWaafiGateway(data));
