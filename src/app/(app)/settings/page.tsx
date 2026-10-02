"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Loader2, X, Search, ChevronRight, Sparkles, ShoppingBag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { detectLocation, getLocationPermissionState, roundCoordinate, type LocationFailureReason } from "@/lib/location";
import { searchCities, type GeocodeCandidate } from "@/lib/weather";
import { TEMPERATURE_UNIT_OPTIONS, DISTANCE_UNIT_OPTIONS } from "@/lib/constants";
import { BrandLoading } from "@/components/Brand";

type LocationUiState = "initial" | "requesting" | "success" | "error";

const FAILURE_MESSAGES: Record<LocationFailureReason, string> = {
  unsupported: "Location detection isn't available in this browser.",
  denied:
    "Location permission is blocked. You may need to allow location access for this site in your browser's settings, then try again.",
  unavailable: "Location detection timed out or your position is unavailable. Try again or choose your city manually.",
  timeout: "Location detection timed out. Try again or choose your city manually.",
  "geocode-failed": "We found your coordinates, but couldn't determine your city. Try again or choose a city manually.",
};

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [admin1, setAdmin1] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<"NONE" | "GPS" | "MANUAL">("NONE");
  const [temperatureUnit, setTemperatureUnit] = useState<(typeof TEMPERATURE_UNIT_OPTIONS)[number]>("AUTO");
  const [distanceUnit, setDistanceUnit] = useState<(typeof DISTANCE_UNIT_OPTIONS)[number]>("AUTO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [locationState, setLocationState] = useState<LocationUiState>("initial");
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(null);

  const [citySearch, setCitySearch] = useState("");
  const [citySearchResults, setCitySearchResults] = useState<GeocodeCandidate[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setCity(data.city ?? "");
        setAdmin1(data.admin1 ?? "");
        setCountry(data.country ?? "");
        setCountryCode(data.countryCode ?? null);
        setLatitude(data.latitude ?? null);
        setLongitude(data.longitude ?? null);
        setLocationSource(data.locationSource ?? "NONE");
        setTemperatureUnit(data.temperatureUnit ?? "AUTO");
        setDistanceUnit(data.distanceUnit ?? "AUTO");
        setLoading(false);
        if (data.city) setLocationState("success");
      });
  }, []);

  function updateCitySearch(value: string) {
    setCitySearch(value);
    if (!value.trim()) {
      setCitySearchResults([]);
      setSearchingCity(false);
    } else {
      setSearchingCity(true);
    }
  }

  useEffect(() => {
    if (!citySearch.trim()) return;
    const timer = setTimeout(async () => {
      const results = await searchCities(citySearch);
      setCitySearchResults(results);
      setSearchingCity(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [citySearch]);

  async function save(overrides?: Record<string, unknown>) {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        city: city || null,
        admin1: admin1 || null,
        country: country || null,
        countryCode,
        latitude,
        longitude,
        locationSource,
        temperatureUnit,
        distanceUnit,
        ...overrides,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function useMyLocation() {
    setLocationState("requesting");
    setLocationErrorMessage(null);

    // Check the Permissions API first (when supported) purely to give an
    // immediate, specific message if the browser already has this site
    // blocked — this never itself triggers the native prompt, only
    // getCurrentPosition() below does that.
    const permissionState = await getLocationPermissionState();
    if (permissionState === "denied") {
      setLocationState("error");
      setLocationErrorMessage(FAILURE_MESSAGES.denied);
      return;
    }

    const result = await detectLocation();
    if (!result.ok) {
      setLocationState("error");
      setLocationErrorMessage(FAILURE_MESSAGES[result.reason]);
      return;
    }

    const roundedLat = roundCoordinate(result.location.lat);
    const roundedLng = roundCoordinate(result.location.lng);
    setCity(result.location.city);
    setAdmin1(result.location.admin1 ?? "");
    setCountry(result.location.country ?? "");
    setCountryCode(result.location.countryCode);
    setLatitude(roundedLat);
    setLongitude(roundedLng);
    setLocationSource("GPS");
    setLocationState("success");

    await save({
      city: result.location.city,
      admin1: result.location.admin1,
      country: result.location.country,
      countryCode: result.location.countryCode,
      latitude: roundedLat,
      longitude: roundedLng,
      locationSource: "GPS",
    });
  }

  async function selectCitySearchResult(candidate: GeocodeCandidate) {
    setCity(candidate.name);
    setAdmin1(candidate.admin1 ?? "");
    setCountry(candidate.country ?? "");
    setCountryCode(candidate.countryCode);
    setLatitude(candidate.latitude);
    setLongitude(candidate.longitude);
    setLocationSource("MANUAL");
    setLocationState("success");
    setCitySearch("");
    setCitySearchResults([]);

    await save({
      city: candidate.name,
      admin1: candidate.admin1,
      country: candidate.country,
      countryCode: candidate.countryCode,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      locationSource: "MANUAL",
    });
  }

  async function removeLocation() {
    setCity("");
    setAdmin1("");
    setCountry("");
    setCountryCode(null);
    setLatitude(null);
    setLongitude(null);
    setLocationSource("NONE");
    setLocationState("initial");
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeLocation: true }),
    });
    setSaving(false);
  }

  if (loading) return <BrandLoading />;

  return (
    <div className="max-w-md">
      <h1 className="font-display text-4xl mb-2">Settings</h1>
      <p className="text-stone mb-10">Manage your account, location, and units.</p>

      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone mb-3">Profile</p>
          <div className="space-y-6">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={email} disabled className="opacity-60" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs uppercase tracking-wide text-stone mb-3">Location &amp; Weather</p>
          <Label>Location</Label>
          <p className="text-xs text-stone mb-3">
            Allow location access to personalize weather, outfit and shopping recommendations. We only look this
            up when you tap the button below — never in the background, never continuously — and we store a
            city-level position, not your exact address.
          </p>

          {locationState !== "success" && (
            <div className="rounded-xl bg-paper-alt px-3.5 py-2.5 text-sm text-ink-soft mb-3">
              {locationState === "requesting" ? "Detecting your location…" : "Location not set"}
            </div>
          )}

          {locationState === "success" && city && (
            <div className="rounded-xl bg-[#e3ebe0] px-3.5 py-2.5 text-sm text-success mb-3 flex items-center justify-between gap-2">
              <span>
                {city}
                {admin1 ? `, ${admin1}` : ""}
                {country ? `, ${country}` : ""}
                {countryCode ? ` (${countryCode})` : ""} — Location detected{" "}
                {locationSource === "MANUAL" ? "(manual)" : "automatically"}
              </span>
              <button onClick={removeLocation} className="text-success/70 hover:text-success cursor-pointer shrink-0" title="Remove location">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {locationErrorMessage && (
            <p className="text-xs text-warning mb-3 leading-relaxed">{locationErrorMessage}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={useMyLocation} disabled={locationState === "requesting"}>
              {locationState === "requesting" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Detecting…
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5 mr-1.5" /> {locationState === "success" ? "Change location" : "Use my current location"}
                </>
              )}
            </Button>
            {locationState === "success" && (
              <Button variant="ghost" size="sm" onClick={removeLocation} disabled={saving}>
                Remove location
              </Button>
            )}
          </div>

          <div className="relative">
            <Label>Or search for your city</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
              <Input
                value={citySearch}
                onChange={(e) => updateCitySearch(e.target.value)}
                placeholder="Search city…"
                className="pl-9"
              />
              {searchingCity && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-stone" />}
            </div>
            {citySearchResults.length > 0 && (
              <div className="mt-2 rounded-xl border border-line bg-white overflow-hidden divide-y divide-line">
                {citySearchResults.map((candidate, i) => (
                  <button
                    key={i}
                    onClick={() => selectCitySearchResult(candidate)}
                    className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-paper-alt transition-colors cursor-pointer"
                  >
                    {candidate.name}
                    {candidate.admin1 ? `, ${candidate.admin1}` : ""}
                    {candidate.country ? `, ${candidate.country}` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line p-5">
          <p className="text-xs uppercase tracking-wide text-stone mb-3">Units</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Temperature</Label>
              <Select value={temperatureUnit} onChange={(e) => setTemperatureUnit(e.target.value as typeof temperatureUnit)}>
                <option value="AUTO">Automatic</option>
                <option value="C">°C</option>
                <option value="F">°F</option>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Distance</Label>
              <Select value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value as typeof distanceUnit)}>
                <option value="AUTO">Automatic</option>
                <option value="km">km</option>
                <option value="mi">mi</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={() => save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {saved && <span className="text-sm text-success">Saved</span>}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-stone mb-3">More</p>
          <div className="rounded-2xl border border-line bg-white divide-y divide-line overflow-hidden">
            <SettingsLink href="/style-profile" icon={<Sparkles className="h-4 w-4" />} label="Style Profile" />
            <SettingsLink href="/buy" icon={<ShoppingBag className="h-4 w-4" />} label="Shopping Preferences" />
            <SettingsLink href="/ask-a-friend" icon={<UserPlus className="h-4 w-4" />} label="Ask a Friend" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-5 py-3.5 hover:bg-paper-alt transition-colors">
      <span className="flex items-center gap-3 text-sm">
        <span className="text-ink-soft">{icon}</span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-stone" />
    </Link>
  );
}
