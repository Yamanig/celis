import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false,
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
});

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === "development" });
