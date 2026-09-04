import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeatherForCity } from "@/lib/weather";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  if (!city) return NextResponse.json({ error: "city is required" }, { status: 400 });

  const weather = await getWeatherForCity(city);
  if (!weather) {
    return NextResponse.json({ error: "Could not find weather for that city." }, { status: 404 });
  }
  return NextResponse.json(weather);
}
