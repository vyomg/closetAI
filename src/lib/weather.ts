// Weather via Open-Meteo — free, no API key or account required, which lets
// "What should I wear today?" work out of the box.
//
// Two lookup paths:
// - getWeatherForCoordinates(lat, lng): the PRIMARY path once a user has a
//   stored location. Calls Open-Meteo's forecast API directly with real
//   coordinates — no re-geocoding, so it can't land on the wrong same-named
//   city (e.g. Hyderabad, India vs. Hyderabad, Pakistan).
// - getWeatherForCity(city): a fallback for flows that only ever have a
//   free-text place name and no stored coordinates (e.g. Pack a Trip's
//   arbitrary destination field) — forward-geocodes via Open-Meteo first.

export type WeatherSnapshot = {
  city: string;
  country: string | null;
  tempC: number;
  feelsLikeC: number;
  condition: string;
  isRaining: boolean;
  humidity: number; // %
  precipitationProbability: number; // % chance today
  windKph: number;
  uvIndex: number | null;
  // Next few days, for seasonal/forecast insight — index 0 is today.
  dailyForecast: DailyForecastEntry[];
};

export type DailyForecastEntry = {
  date: string; // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number;
  weatherCode: number;
};

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
};

const FORECAST_PARAMS =
  "current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m" +
  "&daily=precipitation_probability_max,uv_index_max,temperature_2m_max,temperature_2m_min,weather_code" +
  "&forecast_days=7&timezone=auto";

function parseForecastResponse(weather: Record<string, unknown>, city: string, country: string | null): WeatherSnapshot {
  const current = (weather?.current ?? {}) as Record<string, number>;
  const daily = (weather?.daily ?? {}) as Record<string, unknown[]>;
  const code = current.weather_code ?? 0;

  const dailyDates = (daily.time as string[] | undefined) ?? [];
  const dailyForecast: DailyForecastEntry[] = dailyDates.map((date, i) => ({
    date,
    tempMaxC: Math.round(((daily.temperature_2m_max as number[])?.[i] ?? current.temperature_2m ?? 20)),
    tempMinC: Math.round(((daily.temperature_2m_min as number[])?.[i] ?? current.temperature_2m ?? 20)),
    precipitationProbability: Math.round(((daily.precipitation_probability_max as number[])?.[i] ?? 0)),
    weatherCode: (daily.weather_code as number[])?.[i] ?? 0,
  }));

  return {
    city,
    country,
    tempC: Math.round(current.temperature_2m ?? 20),
    feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 20),
    condition: WEATHER_CODES[code] ?? "Clear",
    isRaining: code >= 51 && code < 90,
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    precipitationProbability: Math.round(((daily.precipitation_probability_max as number[])?.[0] ?? 0)),
    windKph: Math.round(current.wind_speed_10m ?? 0),
    uvIndex:
      typeof (daily.uv_index_max as number[] | undefined)?.[0] === "number"
        ? Math.round((daily.uv_index_max as number[])[0])
        : null,
    dailyForecast,
  };
}

export async function getWeatherForCoordinates(
  lat: number,
  lng: number,
  cityLabel: string,
  countryLabel: string | null
): Promise<WeatherSnapshot | null> {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&${FORECAST_PARAMS}`);
    if (!res.ok) return null;
    const weather = await res.json();
    return parseForecastResponse(weather, cityLabel, countryLabel);
  } catch {
    return null;
  }
}

export async function getWeatherForCity(city: string): Promise<WeatherSnapshot | null> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) return null;

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&${FORECAST_PARAMS}`
    );
    const weather = await weatherRes.json();
    return parseForecastResponse(weather, place.name, place.country ?? null);
  } catch {
    return null;
  }
}

// A place someone might select in the manual city search (see lib/location.ts).
export type GeocodeCandidate = {
  name: string;
  admin1: string | null; // state/region, to disambiguate same-named cities
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
};

export async function searchCities(query: string): Promise<GeocodeCandidate[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.results ?? [];
    return results.map((r: Record<string, unknown>) => ({
      name: r.name as string,
      admin1: (r.admin1 as string) ?? null,
      country: (r.country as string) ?? null,
      countryCode: (r.country_code as string) ?? null,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
    }));
  } catch {
    return [];
  }
}

export function weatherToSeasonHint(tempC: number): string[] {
  if (tempC >= 24) return ["Summer"];
  if (tempC >= 16) return ["Spring", "Summer"];
  if (tempC >= 8) return ["Fall", "Spring"];
  return ["Winter"];
}

export type ClimateBand = "hot" | "warm" | "mild" | "cool" | "cold";

// A coarse climate signal derived from a live weather reading — used by the
// Buy Clothes gap analysis to weigh categories (e.g. lightweight bottoms
// matter more in a hot climate) alongside the wardrobe's own gaps. This is
// intentionally simple: it's a styling *signal*, never a hard rule.
export function climateBand(tempC: number): ClimateBand {
  if (tempC >= 30) return "hot";
  if (tempC >= 22) return "warm";
  if (tempC >= 14) return "mild";
  if (tempC >= 6) return "cool";
  return "cold";
}

// A more descriptive, user-facing climate profile — deterministic from
// temperature + humidity + how often it rains, not left to Gemini. Used to
// explain *why* certain purchases are or aren't a priority (e.g. a wool coat
// is low-value in a "Hot & Humid" profile regardless of how nice it looks).
export type ClimateProfile =
  | "Hot & Humid"
  | "Hot & Dry"
  | "Warm"
  | "Mild"
  | "Cool"
  | "Cold"
  | "Rainy / Tropical";

export function deriveClimateProfile(tempC: number, humidity: number, precipitationProbability: number): ClimateProfile {
  if (precipitationProbability >= 60 && tempC >= 20) return "Rainy / Tropical";
  const band = climateBand(tempC);
  if (band === "hot") return humidity >= 55 ? "Hot & Humid" : "Hot & Dry";
  if (band === "warm") return "Warm";
  if (band === "mild") return "Mild";
  if (band === "cool") return "Cool";
  return "Cold";
}

// A deterministic read of the 7-day forecast for the "coming up" insight
// (section 34) — e.g. "rain expected 4 of the next 7 days". Never a hard
// purchase trigger, just a surfaced observation.
export function summarizeForecastTrend(daily: DailyForecastEntry[]): string | null {
  if (daily.length < 3) return null;
  const rainyDays = daily.filter((d) => d.precipitationProbability >= 50).length;
  const firstHalf = daily.slice(0, Math.ceil(daily.length / 2));
  const secondHalf = daily.slice(Math.ceil(daily.length / 2));
  const avg = (arr: DailyForecastEntry[]) => arr.reduce((s, d) => s + (d.tempMaxC + d.tempMinC) / 2, 0) / arr.length;
  const trendDelta = firstHalf.length && secondHalf.length ? avg(secondHalf) - avg(firstHalf) : 0;

  const notes: string[] = [];
  if (rainyDays >= 3) notes.push(`rain is expected on ${rainyDays} of the next ${daily.length} days`);
  if (trendDelta <= -4) notes.push("temperatures are trending down");
  else if (trendDelta >= 4) notes.push("temperatures are trending up");

  if (notes.length === 0) return null;
  return notes.join(", and ");
}

export function celsiusToFahrenheit(tempC: number): number {
  return Math.round((tempC * 9) / 5 + 32);
}

export function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371);
}

export type TemperatureUnit = "AUTO" | "C" | "F";
export type DistanceUnit = "AUTO" | "km" | "mi";

// Countries where Fahrenheit/miles are the everyday convention — used only
// to resolve "AUTO" unit preferences from a detected country.
const IMPERIAL_COUNTRIES = new Set(["United States", "Liberia", "Myanmar", "Bahamas", "Belize", "Cayman Islands"]);
const IMPERIAL_COUNTRY_CODES = new Set(["US", "LR", "MM"]);

export function resolveTemperatureUnit(pref: TemperatureUnit, country: string | null, countryCode?: string | null): "C" | "F" {
  if (pref !== "AUTO") return pref;
  if (countryCode && IMPERIAL_COUNTRY_CODES.has(countryCode.toUpperCase())) return "F";
  return country && IMPERIAL_COUNTRIES.has(country) ? "F" : "C";
}

export function resolveDistanceUnit(pref: DistanceUnit, country: string | null, countryCode?: string | null): "km" | "mi" {
  if (pref !== "AUTO") return pref;
  if (countryCode && IMPERIAL_COUNTRY_CODES.has(countryCode.toUpperCase())) return "mi";
  return country && IMPERIAL_COUNTRIES.has(country) ? "mi" : "km";
}

export function formatTemperature(tempC: number, unit: "C" | "F"): string {
  return unit === "F" ? `${celsiusToFahrenheit(tempC)}°F` : `${Math.round(tempC)}°C`;
}

export function formatWindSpeed(windKph: number, unit: "km" | "mi"): string {
  return unit === "mi" ? `${kphToMph(windKph)} mph` : `${Math.round(windKph)} km/h`;
}
