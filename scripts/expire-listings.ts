import { expireStaleListings } from "../app/server/listings.server";

async function main() {
  const result = await expireStaleListings();
  console.log(`Expired ${result.expiredCount} stale listings.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Expiry sweep failed:", err);
  process.exit(1);
});
