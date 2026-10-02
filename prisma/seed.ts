// Populates a demo account so the app is browsable immediately without
// uploading real photos. Demo items are flagged isDemo=true and clearly
// distinguished from real user data (see the "Demo" badge on ClothingCard).
//
// Images are real clothing photographs — not generated artwork — reused
// from this project's own early testing uploads (see public/demo-wardrobe/
// and the git history around the first wardrobe photos taken for this app).
// There is no SVG/shape generator involved; every item here points at an
// actual photo of an actual piece of clothing, the same way a real user's
// upload does.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@closetai.app";
const DEMO_PASSWORD = "closetdemo";

type SeedItem = {
  name: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColors?: string[];
  pattern?: string;
  material?: string;
  fit?: string;
  style: string;
  formality: number;
  season?: string[];
  sleeveLength?: string | null;
  occasions: string[];
  pairings: string[];
  tags?: string[];
  imageUrl: string;
};

const ITEMS: SeedItem[] = [
  { name: "Pink Shirt", category: "Tops", subcategory: "Shirt", primaryColor: "Pink", pattern: "Solid", fit: "Regular", style: "Classic", formality: 3, season: ["Spring", "Fall"], sleeveLength: "Long sleeve", occasions: ["Casual dinner", "Smart Casual", "Date"], pairings: ["Light Blue Jeans", "Black Sneakers"], tags: [], imageUrl: "/demo-wardrobe/pink-shirt.jpg" },
  { name: "Black Polo", category: "Tops", subcategory: "Polo", primaryColor: "Black", pattern: "Solid", fit: "Regular", style: "Smart Casual", formality: 3, season: ["Spring", "Summer"], sleeveLength: "Short sleeve", occasions: ["Casual dinner", "School", "Smart Casual"], pairings: ["Black Jeans", "White Sneakers"], tags: ["preppy"], imageUrl: "/demo-wardrobe/black-polo.jpg" },
  { name: "Green T-shirt", category: "Tops", subcategory: "T-shirt", primaryColor: "Green", pattern: "Solid", fit: "Regular", style: "Streetwear", formality: 1, season: ["Spring", "Summer"], sleeveLength: "Short sleeve", occasions: ["Everyday", "Casual"], pairings: ["Light Blue Jeans", "White Sneakers"], tags: ["basic"], imageUrl: "/demo-wardrobe/green-tshirt.jpg" },
  { name: "Orange Graphic Tee", category: "Tops", subcategory: "T-shirt", primaryColor: "Orange", pattern: "Graphic print", fit: "Oversized", style: "Streetwear", formality: 1, season: ["Spring", "Summer"], sleeveLength: "Short sleeve", occasions: ["Everyday", "Casual"], pairings: ["Black Jeans", "Black Sneakers"], tags: ["graphic"], imageUrl: "/demo-wardrobe/orange-graphic-tee.jpg" },
  { name: "Black Jeans", category: "Bottoms", subcategory: "Jeans", primaryColor: "Black", pattern: "Solid", fit: "Regular", style: "Classic", formality: 2, season: ["Fall", "Winter", "Spring"], occasions: ["Everyday", "Casual", "Date"], pairings: ["Black Polo", "Orange Graphic Tee", "White Sneakers"], tags: [], imageUrl: "/demo-wardrobe/black-jeans.jpg" },
  { name: "Light Blue Jeans", category: "Bottoms", subcategory: "Jeans", primaryColor: "Light Blue", pattern: "Solid", fit: "Regular", style: "Casual", formality: 1, season: ["Spring", "Summer", "Fall"], occasions: ["Everyday", "Casual"], pairings: ["Green T-shirt", "Pink Shirt", "White Sneakers"], tags: [], imageUrl: "/demo-wardrobe/light-blue-jeans.jpg" },
  { name: "Sage Trousers", category: "Bottoms", subcategory: "Trousers", primaryColor: "Sage Green", pattern: "Solid", fit: "Regular", style: "Casual", formality: 2, season: ["Spring", "Fall"], occasions: ["Everyday", "Smart Casual"], pairings: ["Black Polo", "Black Sneakers"], tags: [], imageUrl: "/demo-wardrobe/sage-trousers.jpg" },
  { name: "White Sneakers", category: "Shoes", subcategory: "Sneakers", primaryColor: "White", pattern: "Solid", fit: "Regular", style: "Athletic", formality: 1, season: ["Spring", "Summer", "Fall"], occasions: ["Everyday", "Casual", "Smart Casual"], pairings: ["Light Blue Jeans", "Black Polo"], tags: ["versatile"], imageUrl: "/demo-wardrobe/white-sneakers.jpg" },
  { name: "Black Sneakers", category: "Shoes", subcategory: "Sneakers", primaryColor: "Black", pattern: "Solid", fit: "Regular", style: "Casual", formality: 1, season: ["Fall", "Winter", "Spring"], occasions: ["Everyday", "Casual"], pairings: ["Black Jeans", "Orange Graphic Tee"], tags: [], imageUrl: "/demo-wardrobe/black-sneakers.jpg" },
  { name: "Navy Cap", category: "Accessories", subcategory: "Cap", primaryColor: "Navy", pattern: "Solid", fit: "Regular", style: "Casual", formality: 1, season: [], occasions: ["Everyday", "Casual"], pairings: ["Green T-shirt", "Light Blue Jeans"], tags: [], imageUrl: "/demo-wardrobe/navy-cap.jpg" },
  { name: "Black Watch", category: "Accessories", subcategory: "Watch", primaryColor: "Black", pattern: "Solid", fit: "Regular", style: "Minimal", formality: 3, season: [], occasions: ["Everyday", "Smart Casual", "Date"], pairings: ["Any outfit"], tags: ["everyday"], imageUrl: "/demo-wardrobe/black-watch.jpg" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Demo Stylist",
      email: DEMO_EMAIL,
      passwordHash,
      onboarded: true,
      preferredStyles: JSON.stringify(["Streetwear", "Casual", "Smart Casual"]),
      usualClothing: "Clean, easy pieces that mix without much thought — nothing too flashy.",
      occasions: JSON.stringify(["Everyday", "Casual", "Smart Casual"]),
      fitPreference: "Regular",
      colorsLove: JSON.stringify(["Black", "White", "Navy"]),
      colorsAvoid: JSON.stringify(["Yellow"]),
      shoePreference: JSON.stringify(["Sneakers"]),
      adventurousness: 3,
      comfortImportance: 4,
      fashionImportance: 3,
      formalImportance: 2,
      city: "New York",
    },
  });

  const existingCount = await db.clothingItem.count({ where: { userId: user.id, isDemo: true } });
  if (existingCount > 0) {
    console.log(`Demo account already has ${existingCount} demo items — skipping re-seed.`);
    console.log(`Log in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    return;
  }

  for (const item of ITEMS) {
    await db.clothingItem.create({
      data: {
        userId: user.id,
        imageUrl: item.imageUrl,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        primaryColor: item.primaryColor,
        secondaryColors: JSON.stringify(item.secondaryColors ?? []),
        pattern: item.pattern ?? "Solid",
        material: item.material ?? null,
        fit: item.fit ?? "Regular",
        style: item.style,
        formality: item.formality,
        season: JSON.stringify(item.season ?? []),
        sleeveLength: item.sleeveLength ?? null,
        occasions: JSON.stringify(item.occasions),
        pairings: JSON.stringify(item.pairings),
        tags: JSON.stringify(item.tags ?? []),
        isDemo: true,
      },
    });
  }

  console.log(`Seeded ${ITEMS.length} demo wardrobe items (real photos, no generated artwork).`);
  console.log(`Log in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
