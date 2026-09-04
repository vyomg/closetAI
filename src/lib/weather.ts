// Weather via Open-Meteo — free, no API key or account required, which lets
// "What should I wear today?" work out of the box. Location is resolved from
// a manually-entered city name (geocoding endpoint), never device location.

export type WeatherSnapshot = {
  city: string;
  tempC: number;
  condition: string;
  isRaining: boolean;
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

export async function getWeatherForCity(city: string): Promise<WeatherSnapshot | null> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geo = await geoRes.json();
    const place = geo?.results?.[0];
    if (!place) return null;

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`
    );
    const weather = await weatherRes.json();
    const code = weather?.current?.weather_code ?? 0;

    return {
      city: place.name,
      tempC: Math.round(weather?.current?.temperature_2m ?? 20),
      condition: WEATHER_CODES[code] ?? "Clear",
      isRaining: code >= 51 && code < 90,
    };
  } catch {
    return null;
  }
}

export function weatherToSeasonHint(tempC: number): string[] {
  if (tempC >= 24) return ["Summer"];
  if (tempC >= 16) return ["Spring", "Summer"];
  if (tempC >= 8) return ["Fall", "Spring"];
  return ["Winter"];
}
