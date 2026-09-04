// Populates a demo account so the app is browsable immediately without
// uploading real photos. Demo items are flagged isDemo=true and clearly
// distinguished from real user data (see the "Demo" badge on ClothingCard).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { buildDemoSvg } from "../scripts/demoImage";

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
};

const ITEMS: SeedItem[] = [
  { name: "White T-shirt", category: "Tops", subcategory: "T-shirt", primaryColor: "White", pattern: "Solid", material: "Cotton", fit: "Regular", style: "Minimal", formality: 1, season: ["Spring", "Summer"], sleeveLength: "Short sleeve", occasions: ["Everyday", "Casual"], pairings: ["Dark denim", "Black trousers", "White sneakers"], tags: ["basic", "layering"] },
  { name: "Black T-shirt", category: "Tops", subcategory: "T-shirt", primaryColor: "Black", pattern: "Solid", material: "Cotton", fit: "Regular", style: "Minimal", formality: 1, season: ["Spring", "Summer", "Fall"], sleeveLength: "Short sleeve", occasions: ["Everyday", "Casual"], pairings: ["Grey trousers", "Dark denim", "Black sneakers"], tags: ["basic"] },
  { name: "Navy Polo", category: "Tops", subcategory: "Polo", primaryColor: "Navy", pattern: "Solid", material: "Pique cotton", fit: "Regular", style: "Smart Casual", formality: 3, season: ["Spring", "Summer"], sleeveLength: "Short sleeve", occasions: ["Casual dinner", "School", "Smart Casual"], pairings: ["Beige chinos", "Grey trousers", "White sneakers"], tags: ["preppy"] },
  { name: "White Oxford Shirt", category: "Tops", subcategory: "Shirt", primaryColor: "White", pattern: "Solid", material: "Cotton oxford", fit: "Regular", style: "Classic", formality: 4, season: ["Spring", "Fall", "Winter"], sleeveLength: "Long sleeve", occasions: ["Business", "Interview", "Presentation"], pairings: ["Navy blazer", "Grey trousers", "Brown loafers"], tags: ["office"] },
  { name: "Grey Crewneck", category: "Tops", subcategory: "Crewneck", primaryColor: "Grey", pattern: "Solid", material: "Cotton fleece", fit: "Regular", style: "Relaxed", formality: 2, season: ["Fall", "Winter"], sleeveLength: "Long sleeve", occasions: ["Everyday", "Travel"], pairings: ["Dark denim", "Joggers", "White sneakers"], tags: ["cozy"] },
  { name: "Beige Chinos", category: "Bottoms", subcategory: "Chinos", primaryColor: "Beige", pattern: "Solid", material: "Cotton twill", fit: "Regular", style: "Smart Casual", formality: 3, season: ["Spring", "Summer", "Fall"], occasions: ["Casual dinner", "Smart Casual", "School"], pairings: ["Navy polo", "White shirt", "Brown loafers"], tags: [] },
  { name: "Dark Blue Jeans", category: "Bottoms", subcategory: "Jeans", primaryColor: "Navy", pattern: "Solid", material: "Denim", fit: "Regular", style: "Classic", formality: 2, season: ["Fall", "Winter", "Spring"], occasions: ["Everyday", "Casual", "Date"], pairings: ["White t-shirt", "Grey crewneck", "White sneakers"], tags: [] },
  { name: "Grey Trousers", category: "Bottoms", subcategory: "Trousers", primaryColor: "Grey", pattern: "Solid", material: "Wool blend", fit: "Regular", style: "Formal", formality: 4, season: ["Fall", "Winter"], occasions: ["Business", "Interview", "Formal Event"], pairings: ["White Oxford shirt", "Navy blazer", "Black formal shoes"], tags: [] },
  { name: "Black Trousers", category: "Bottoms", subcategory: "Trousers", primaryColor: "Black", pattern: "Solid", material: "Wool blend", fit: "Regular", style: "Formal", formality: 4, season: ["Fall", "Winter", "Spring"], occasions: ["Business", "Formal Event", "Dinner"], pairings: ["White shirt", "Black formal shoes", "Silver watch"], tags: [] },
  { name: "White Sneakers", category: "Shoes", subcategory: "Sneakers", primaryColor: "White", pattern: "Solid", material: "Leather", fit: "Regular", style: "Minimal", formality: 2, season: ["Spring", "Summer", "Fall"], occasions: ["Everyday", "Casual", "Smart Casual"], pairings: ["Dark denim", "Navy polo", "Beige chinos"], tags: ["versatile"] },
  { name: "Black Sneakers", category: "Shoes", subcategory: "Sneakers", primaryColor: "Black", pattern: "Solid", material: "Leather", fit: "Regular", style: "Minimal", formality: 2, season: ["Fall", "Winter", "Spring"], occasions: ["Everyday", "Casual"], pairings: ["Black t-shirt", "Grey trousers"], tags: [] },
  { name: "Brown Loafers", category: "Shoes", subcategory: "Loafers", primaryColor: "Brown", pattern: "Solid", material: "Leather", fit: "Regular", style: "Smart Casual", formality: 3, season: ["Spring", "Fall"], occasions: ["Smart Casual", "Dinner", "School"], pairings: ["Beige chinos", "Navy polo", "White Oxford shirt"], tags: [] },
  { name: "Black Formal Shoes", category: "Shoes", subcategory: "Formal shoes", primaryColor: "Black", pattern: "Solid", material: "Leather", fit: "Regular", style: "Formal", formality: 5, season: ["Fall", "Winter", "Spring"], occasions: ["Business", "Formal Event", "Wedding", "Interview"], pairings: ["Black trousers", "Grey trousers", "White Oxford shirt"], tags: [] },
  { name: "Navy Blazer", category: "Outerwear", subcategory: "Blazer", primaryColor: "Navy", pattern: "Solid", material: "Wool blend", fit: "Regular", style: "Classic", formality: 4, season: ["Fall", "Spring", "Winter"], occasions: ["Business", "Interview", "Presentation", "Dinner"], pairings: ["White Oxford shirt", "Grey trousers", "Brown loafers"], tags: [] },
  { name: "Black Belt", category: "Accessories", subcategory: "Belt", primaryColor: "Black", pattern: "Solid", material: "Leather", fit: "Regular", style: "Classic", formality: 3, season: [], occasions: ["Business", "Smart Casual", "Formal Event"], pairings: ["Black trousers", "Black formal shoes"], tags: [] },
  { name: "Silver Watch", category: "Accessories", subcategory: "Watch", primaryColor: "Grey", pattern: "Solid", material: "Stainless steel", fit: "Regular", style: "Classic", formality: 3, season: [], occasions: ["Business", "Dinner", "Everyday"], pairings: ["Any outfit"], tags: ["everyday"] },
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
      preferredStyles: JSON.stringify(["Smart Casual", "Minimal", "Classic"]),
      usualClothing: "Clean, neutral pieces that mix easily — nothing too flashy.",
      occasions: JSON.stringify(["Everyday", "School", "Business", "Dinner"]),
      fitPreference: "Regular",
      colorsLove: JSON.stringify(["Navy", "White", "Beige", "Grey", "Black"]),
      colorsAvoid: JSON.stringify(["Yellow", "Orange"]),
      shoePreference: JSON.stringify(["Sneakers", "Loafers"]),
      adventurousness: 2,
      comfortImportance: 4,
      fashionImportance: 4,
      formalImportance: 3,
      city: "New York",
    },
  });

  const existingCount = await db.clothingItem.count({ where: { userId: user.id, isDemo: true } });
  if (existingCount > 0) {
    console.log(`Demo account already has ${existingCount} demo items — skipping re-seed.`);
    console.log(`Log in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    return;
  }

  const dir = path.join(process.cwd(), "public", "demo-images");
  await mkdir(dir, { recursive: true });

  for (const item of ITEMS) {
    const svg = buildDemoSvg({
      category: item.category,
      subcategory: item.subcategory,
      primaryColor: item.primaryColor,
      pattern: item.pattern ?? "Solid",
    });
    const filename = `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.svg`;
    await writeFile(path.join(dir, filename), svg, "utf-8");

    await db.clothingItem.create({
      data: {
        userId: user.id,
        imageUrl: `/demo-images/${filename}`,
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

  console.log(`Seeded ${ITEMS.length} demo wardrobe items.`);
  console.log(`Log in with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
