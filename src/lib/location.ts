"use client";

export { roundCoordinatePrecision as roundCoordinate } from "@/lib/geo";

// Client-only location helpers. Geolocation is only ever requested in
// response to an explicit user action (a button click) — never on page
// load, never in the background, and never via watchPosition (this is a
// one-time lookup, not continuous tracking).
//
// The coordinates returned here are used transiently in the browser (to
// preview weather immediately and to resolve city/country) — callers should
// round them before persisting (see roundCoordinate) so what's stored is
// city/neighbourhood-precision, not an exact address.

export type ResolvedLocation = {
  city: string;
  admin1: string | null; // state/region, when available
  country: string | null;
  countryCode: string | null;
  lat: number;
  lng: number;
};

export type LocationFailureReason = "unsupported" | "denied" | "unavailable" | "timeout" | "geocode-failed";

export type LocationResult = { ok: true; location: ResolvedLocation } | { ok: false; reason: LocationFailureReason };

// Checks the Permissions API (when the browser supports it) so we can tell
// "already denied" apart from "never asked" WITHOUT triggering the native
// permission prompt ourselves — the prompt only ever appears from the
// getCurrentPosition() call below, which only runs on an explicit click.
export async function getLocationPermissionState(): Promise<"granted" | "prompt" | "denied" | "unknown"> {
  try {
    if (!("permissions" in navigator)) return "unknown";
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state as "granted" | "prompt" | "denied";
  } catch {
    return "unknown";
  }
}

function getCurrentCoordinates(): Promise<{ lat: number; lng: number } | { error: LocationFailureReason }> {
  return new Promise((resolve) => {
    // Geolocation requires a secure context (https, or the localhost
    // exception) — if the app is being loaded over plain http on a LAN IP
    // (e.g. http://192.168.x.x:3000) the API is unavailable even though
    // `"geolocation" in navigator` may still be true in some browsers, so
    // check this explicitly rather than letting it fail mysteriously.
    if (typeof window !== "undefined" && "isSecureContext" in window && !window.isSecureContext) {
      resolve({ error: "unsupported" });
      return;
    }
    if (!("geolocation" in navigator)) {
      resolve({ error: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        // GeolocationPositionError codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === err.PERMISSION_DENIED) resolve({ error: "denied" });
        else if (err.code === err.TIMEOUT) resolve({ error: "timeout" });
        else resolve({ error: "unavailable" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  });
}

// BigDataCloud's client-side reverse-geocode endpoint is free, keyless, and
// designed specifically for direct browser calls (no server round-trip
// needed, and it never sees anything except the one-off coordinate pair).
async function reverseGeocode(lat: number, lng: number): Promise<Omit<ResolvedLocation, "lat" | "lng"> | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const city = data?.city || data?.locality || data?.principalSubdivision;
    if (!city) return null;
    return {
      city,
      admin1: data?.principalSubdivision ?? null,
      country: data?.countryName ?? null,
      countryCode: data?.countryCode ?? null,
    };
  } catch {
    return null;
  }
}

export async function detectLocation(): Promise<LocationResult> {
  const coords = await getCurrentCoordinates();
  if ("error" in coords) return { ok: false, reason: coords.error };

  const place = await reverseGeocode(coords.lat, coords.lng);
  if (!place) return { ok: false, reason: "geocode-failed" };

  return { ok: true, location: { ...place, lat: coords.lat, lng: coords.lng } };
}
