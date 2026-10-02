import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userToStyleProfile, userToLearnedPreferences, userToLocationSettings, clothingItemToAI } from "@/lib/serializers";
import { TEMPERATURE_UNIT_OPTIONS, DISTANCE_UNIT_OPTIONS } from "@/lib/constants";
import { roundCoordinatePrecision } from "@/lib/geo";
import { computeWardrobeStats } from "@/lib/wardrobeAnalysis";
import { computeStyleDNA } from "@/lib/styleDNA";

const LOCATION_SOURCES = ["NONE", "GPS", "MANUAL"] as const;

// Belt-and-braces: this route must never be served stale — location changes
// need to be visible immediately on the next fetch (e.g. from Buy Clothes).
export const dynamic = "force-dynamic";

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().nullable().optional(),
  admin1: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationSource: z.enum(LOCATION_SOURCES).optional(),
  // A single explicit flag for "Remove location" (section 39) — clears
  // every location field at once rather than relying on the caller to null
  // each one out individually.
  removeLocation: z.boolean().optional(),
  temperatureUnit: z.enum(TEMPERATURE_UNIT_OPTIONS).optional(),
  distanceUnit: z.enum(DISTANCE_UNIT_OPTIONS).optional(),
  preferredStyles: z.array(z.string()).optional(),
  usualClothing: z.string().optional(),
  occasions: z.array(z.string()).optional(),
  fitPreference: z.string().optional(),
  colorsLove: z.array(z.string()).optional(),
  colorsAvoid: z.array(z.string()).optional(),
  shoePreference: z.array(z.string()).optional(),
  adventurousness: z.number().min(1).max(5).optional(),
  comfortImportance: z.number().min(1).max(5).optional(),
  fashionImportance: z.number().min(1).max(5).optional(),
  formalImportance: z.number().min(1).max(5).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, appearanceProfile, wardrobeItems] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.personalAppearanceProfile.findUnique({ where: { userId: session.user.id } }),
    db.clothingItem.findMany({ where: { userId: session.user.id } }),
  ]);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const styleProfile = userToStyleProfile(user);
  const learnedPreferences = userToLearnedPreferences(user);
  const wardrobeStats = computeWardrobeStats(wardrobeItems.map(clothingItemToAI));
  const styleDNA = computeStyleDNA(styleProfile, learnedPreferences, wardrobeStats, appearanceProfile);

  return NextResponse.json({
    name: user.name,
    email: user.email,
    onboarded: user.onboarded,
    ...styleProfile,
    ...userToLocationSettings(user),
    learnedPreferences,
    hasAppearanceProfile: appearanceProfile?.status === "COMPLETE",
    appearanceProfileStatus: appearanceProfile?.status ?? "PENDING",
    styleDNA,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile update." }, { status: 400 });
  const d = parsed.data;

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.removeLocation
        ? {
            city: null,
            admin1: null,
            country: null,
            countryCode: null,
            latitude: null,
            longitude: null,
            locationSource: "NONE",
          }
        : {
            ...(d.city !== undefined ? { city: d.city } : {}),
            ...(d.admin1 !== undefined ? { admin1: d.admin1 } : {}),
            ...(d.country !== undefined ? { country: d.country } : {}),
            ...(d.countryCode !== undefined ? { countryCode: d.countryCode } : {}),
            ...(d.latitude !== undefined ? { latitude: d.latitude === null ? null : roundCoordinatePrecision(d.latitude) } : {}),
            ...(d.longitude !== undefined ? { longitude: d.longitude === null ? null : roundCoordinatePrecision(d.longitude) } : {}),
            ...(d.locationSource !== undefined ? { locationSource: d.locationSource } : {}),
          }),
      ...(d.temperatureUnit !== undefined ? { temperatureUnit: d.temperatureUnit } : {}),
      ...(d.distanceUnit !== undefined ? { distanceUnit: d.distanceUnit } : {}),
      ...(d.preferredStyles !== undefined ? { preferredStyles: JSON.stringify(d.preferredStyles) } : {}),
      ...(d.usualClothing !== undefined ? { usualClothing: d.usualClothing } : {}),
      ...(d.occasions !== undefined ? { occasions: JSON.stringify(d.occasions) } : {}),
      ...(d.fitPreference !== undefined ? { fitPreference: d.fitPreference } : {}),
      ...(d.colorsLove !== undefined ? { colorsLove: JSON.stringify(d.colorsLove) } : {}),
      ...(d.colorsAvoid !== undefined ? { colorsAvoid: JSON.stringify(d.colorsAvoid) } : {}),
      ...(d.shoePreference !== undefined ? { shoePreference: JSON.stringify(d.shoePreference) } : {}),
      ...(d.adventurousness !== undefined ? { adventurousness: d.adventurousness } : {}),
      ...(d.comfortImportance !== undefined ? { comfortImportance: d.comfortImportance } : {}),
      ...(d.fashionImportance !== undefined ? { fashionImportance: d.fashionImportance } : {}),
      ...(d.formalImportance !== undefined ? { formalImportance: d.formalImportance } : {}),
    },
  });

  return NextResponse.json({ ...userToStyleProfile(user), ...userToLocationSettings(user), name: user.name });
}
