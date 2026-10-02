// Tiny isomorphic (client + server) geo helper. Kept separate from
// lib/location.ts, which is "use client" and calls browser-only APIs
// (navigator.geolocation) — this file has no such restriction so API routes
// can import it too.

// Rounds to ~1.1km precision (2 decimal places) — enough for accurate local
// weather, not enough to pinpoint an exact address. Server-side belt-and-
// braces: even if a client ever sent full-precision coordinates, they're
// never persisted more precisely than this.
export function roundCoordinatePrecision(value: number): number {
  return Math.round(value * 100) / 100;
}
