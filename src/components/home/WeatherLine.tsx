import type { WeatherSnapshot } from "@/lib/weather";
import { formatTemperature } from "@/lib/weather";

export function WeatherLine({
  weather,
  tempUnit,
  compact = false,
}: {
  weather: WeatherSnapshot;
  tempUnit: "C" | "F";
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className="text-sm text-ink-soft">
        <span className="font-medium text-ink">
          {weather.city}
          {weather.country ? `, ${weather.country}` : ""}
        </span>{" "}
        · {formatTemperature(weather.tempC, tempUnit)} · {weather.condition}
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">
        {weather.city}
        {weather.country ? `, ${weather.country}` : ""}
      </p>
      <p className="font-display text-3xl mt-1">{formatTemperature(weather.tempC, tempUnit)}</p>
      <p className="text-xs text-stone mt-1">
        Feels like {formatTemperature(weather.feelsLikeC, tempUnit)} · {weather.condition} · {weather.humidity}% humidity
        {weather.uvIndex !== null && weather.uvIndex >= 6 ? " · High UV" : ""}
      </p>
    </div>
  );
}
