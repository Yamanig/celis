import { db } from "../app/db";
import { authUsers, users, profiles, categories, listings } from "../app/db/schema";
import { eq } from "drizzle-orm";

const DEMO_SELLER_ID =
  process.env.VITE_DEMO_SELLER_ID ?? "00000000-0000-0000-0000-000000000000";
const DEMO_EMAIL = "demo@celis.so";

async function seed() {
  await db
    .insert(authUsers)
    .values({ id: DEMO_SELLER_ID, email: DEMO_EMAIL })
    .onConflictDoNothing({ target: authUsers.id });

  await db
    .insert(users)
    .values({
      id: DEMO_SELLER_ID,
      email: DEMO_EMAIL,
      role: "seller",
      walletPhone: "+252612345678",
      verifiedAt: new Date(),
    })
    .onConflictDoNothing({ target: users.id });

  await db
    .insert(profiles)
    .values({
      id: DEMO_SELLER_ID,
      displayName: "Celis Demo Seller",
      avatarUrl: null,
      location: {
        region: "Banaadir",
        city: "Mogadishu",
        district: "Hodan",
        lat: 2.0469,
        lng: 45.3182,
      },
    })
    .onConflictDoNothing({ target: profiles.id });

  const cats = await db.select().from(categories);
  const find = (slug: string) => cats.find((c) => c.slug === slug)?.id;

  const sampleListings = [
    {
      title: "iPhone 14 Pro Max 256GB",
      description:
        "Excellent condition iPhone 14 Pro Max. Battery health 92%. Comes with original box and charger. No scratches or dents.",
      slug: "electronics",
      condition: "good",
      price: 65000,
      delivery: "local_pickup",
      images: [
        "https://placehold.co/600x400/007FFF/ffffff?text=iPhone+14+Pro",
        "https://placehold.co/600x400/005BBB/ffffff?text=Back",
      ],
    },
    {
      title: "Toyota Land Cruiser 2018",
      description:
        "Well maintained 2018 Toyota Land Cruiser V8. 85,000 km. Full service history available. Serious buyers only.",
      slug: "vehicles",
      condition: "good",
      price: 4500000,
      delivery: "local_pickup",
      images: [
        "https://placehold.co/800x500/333333/ffffff?text=Land+Cruiser",
      ],
    },
    {
      title: "2-Bedroom Apartment in Mogadishu",
      description:
        "Spacious 2-bedroom apartment near Bakara Market. Water and electricity included. Available immediately.",
      slug: "property",
      condition: "new_with_tags",
      price: 350000,
      delivery: "local_pickup",
      images: [
        "https://placehold.co/800x500/226622/ffffff?text=Apartment",
      ],
    },
    {
      title: "Men's Leather Shoes Size 44",
      description:
        "Genuine leather formal shoes. Worn once for a wedding. Too big for me. Original price $90.",
      slug: "fashion",
      condition: "like_new",
      price: 3500,
      delivery: "shipping",
      images: [
        "https://placehold.co/600x400/8B4513/ffffff?text=Leather+Shoes",
      ],
    },
    {
      title: "Samsung 55\" 4K Smart TV",
      description:
        "Samsung Crystal UHD 55 inch TV. Purchased last year. Perfect working condition with remote.",
      slug: "electronics",
      condition: "good",
      price: 42000,
      delivery: "shipping",
      images: [
        "https://placehold.co/800x450/111111/ffffff?text=Samsung+TV",
      ],
    },
    {
      title: "Office Desk and Chair Set",
      description:
        "Sturdy wooden desk with ergonomic office chair. Ideal for home office. Pickup only.",
      slug: "home-garden",
      condition: "fair",
      price: 18000,
      delivery: "local_pickup",
      images: [
        "https://placehold.co/700x450/654321/ffffff?text=Desk+%26+Chair",
      ],
    },
    {
      title: "PlayStation 5 Console",
      description:
        "PS5 Disc Edition with two controllers and 3 games. Barely used. Original box included.",
      slug: "electronics",
      condition: "like_new",
      price: 55000,
      delivery: "shipping",
      images: [
        "https://placehold.co/600x400/FFFFFF/000000?text=PlayStation+5",
      ],
    },
    {
      title: "Fresh Local Goats - Livestock",
      description:
        "Healthy local goats available for sale. Suitable for qurbani or farming. Bulk discount available.",
      slug: "animals",
      condition: "new_with_tags",
      price: 12000,
      delivery: "local_pickup",
      images: [
        "https://placehold.co/700x450/556B2F/ffffff?text=Goats",
      ],
    },
  ];

  let inserted = 0;
  for (const item of sampleListings) {
    const categoryId = find(item.slug);
    if (!categoryId) {
      console.warn(`Category ${item.slug} not found, skipping ${item.title}`);
      continue;
    }

    const existing = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.title, item.title))
      .limit(1);
    if (existing.length > 0) {
      console.log(`Skipping existing listing: ${item.title}`);
      continue;
    }

    await db.insert(listings).values({
      sellerId: DEMO_SELLER_ID,
      title: item.title,
      description: item.description,
      categoryId,
      condition: item.condition as typeof listings.$inferSelect.condition,
      price: item.price,
      monetizationType: "fixed_rate",
      deliveryMethod: item.delivery as typeof listings.$inferSelect.deliveryMethod,
      status: "active",
      images: item.images,
      metadata: {},
    });
    inserted++;
  }

  console.log(`Seeded demo seller and ${inserted} sample listings.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
