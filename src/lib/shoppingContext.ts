// Shared context resolution for the shopping-adjacent routes (Buy Clothes,
// Should I Buy This?, Pack a Trip) — one place that turns "a user row + a
// shopping-preference row" into weather/climate + resolved currency, so
// that logic isn't copy-pasted across three route handlers.

import { getWeatherForCoordinates, getWeatherForCity, climateBand, deriveClimateProfile, summarizeForecastTrend } from "@/lib/weather";
import { resolveAutoCurrency } from "@/lib/currency";
import type { WeatherSnapshot, ClimateBand, ClimateProfile } from "@/lib/weather";
import type { User, ShoppingPreference } from "@prisma/client";

export type ResolvedShoppingContext = {
  weather: WeatherSnapshot | null;
  climate: ClimateBand | null;
  climateProfile: ClimateProfile | null;
  forecastInsight: string | null;
  weatherContextText: string | null;
  // Resolved ISO currency code, or null when it genuinely can't be
  // determined yet (no location, no manual override) — NEVER a hardcoded
  // guess. Callers must handle null as "waiting for location", not "USD".
  currency: string | null;
  currencyIsAuto: boolean;
};

export async function resolveShoppingContext(
  user: Pick<User, "city" | "country" | "countryCode" | "latitude" | "longitude">,
  shoppingPref: Pick<ShoppingPreference, "currency"> | null,
  cityOverride?: string
): Promise<ResolvedShoppingContext> {
  let weather: WeatherSnapshot | null = null;

  if (cityOverride) {
    weather = await getWeatherForCity(cityOverride);
  } else if (user.latitude != null && user.longitude != null) {
    weather = await getWeatherForCoordinates(user.latitude, user.longitude, user.city ?? "", user.country ?? null);
  } else if (user.city) {
    // No stored coordinates yet (profile set before coordinates were
    // tracked, or set manually without a geocoded pick) — fall back to
    // forward-geocoding the city name, same as before.
    weather = await getWeatherForCity(user.city);
  }

  const climate = weather ? climateBand(weather.tempC) : null;
  const climateProfile = weather ? deriveClimateProfile(weather.tempC, weather.humidity, weather.precipitationProbability) : null;
  const forecastInsight = weather ? summarizeForecastTrend(weather.dailyForecast) : null;

  const weatherContextText = weather
    ? `${weather.city}${weather.country ? `, ${weather.country}` : ""}: ${weather.tempC}°C (feels like ${weather.feelsLikeC}°C), ${weather.condition}, ${weather.humidity}% humidity, ${weather.precipitationProbability}% chance of rain, wind ${weather.windKph} km/h. Climate profile: ${climateProfile}.${forecastInsight ? ` Coming up: ${forecastInsight}.` : ""}`
    : null;

  const currencyPref = shoppingPref?.currency ?? "AUTO";
  const currencyIsAuto = currencyPref === "AUTO";
  const currency = currencyIsAuto ? resolveAutoCurrency(user.country, user.countryCode) : currencyPref;

  return { weather, climate, climateProfile, forecastInsight, weatherContextText, currency, currencyIsAuto };
}
