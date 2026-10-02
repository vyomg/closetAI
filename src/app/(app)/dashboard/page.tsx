import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseList } from "@/lib/json";
import { getWeatherForCity, getWeatherForCoordinates, resolveTemperatureUnit } from "@/lib/weather";
import { DesktopHome } from "@/components/home/DesktopHome";
import { MobileHome } from "@/components/home/MobileHome";
import type { HomeData } from "@/components/home/types";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const [itemCount, recentItems, recentOutfits, appearanceProfile] = await Promise.all([
    db.clothingItem.count({ where: { userId: user.id } }),
    db.clothingItem.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.outfit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 2,
      include: { items: { include: { clothingItem: true } } },
    }),
    db.personalAppearanceProfile.findUnique({ where: { userId: user.id }, select: { status: true } }),
  ]);

  const styleTags = parseList(user.preferredStyles).slice(0, 3);
  const weather =
    user.latitude != null && user.longitude != null
      ? await getWeatherForCoordinates(user.latitude, user.longitude, user.city ?? "", user.country ?? null)
      : user.city
        ? await getWeatherForCity(user.city)
        : null;
  const tempUnit = resolveTemperatureUnit(user.temperatureUnit as "AUTO" | "C" | "F", user.country, user.countryCode);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysOutfit = recentOutfits.find((o) => o.createdAt >= startOfToday) ?? null;

  const homeData: HomeData = {
    firstName: user.name.split(" ")[0],
    weather,
    tempUnit,
    itemCount,
    styleTags,
    recentItems,
    recentOutfits,
    todaysOutfit,
    hasAppearanceProfile: appearanceProfile?.status === "COMPLETE",
  };

  return (
    <div>
      <DesktopHome data={homeData} />
      <MobileHome data={homeData} />
    </div>
  );
}
