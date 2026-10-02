// Currency support: formatting always goes through Intl.NumberFormat (never
// manual string concatenation — grouping and minor-unit rules differ per
// currency, e.g. JPY has no decimal places, INR groups in lakhs/crores).
// Conversion goes through Frankfurter (https://frankfurter.dev), a free,
// keyless, ECB-rate-based exchange service — never through Gemini.

export type CurrencyOption = { code: string; label: string; symbol: string; locale: string };

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en-IE" },
  { code: "GBP", label: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "AED", label: "UAE Dirham", symbol: "AED", locale: "en-AE" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$", locale: "en-CA" },
];

const CURRENCY_BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

// ISO 3166-1 alpha-2 country code -> default currency. This is the primary,
// authoritative lookup: codes can't be misspelled or localized the way a
// free-text country name can, so prefer this whenever the geocoder/reverse
// geocoder supplies one (see resolveAutoCurrency below).
const COUNTRY_CODE_CURRENCY: Record<string, string> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  JP: "JPY",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  IE: "EUR",
  NL: "EUR",
  PT: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  MT: "EUR",
  AE: "AED",
  SG: "SGD",
  AU: "AUD",
  CA: "CAD",
};

// Fallback for when only a country NAME (not an ISO code) is available —
// e.g. an older stored profile from before countryCode was tracked. Kept
// deliberately small; the code-based map above is the reliable path.
const COUNTRY_NAME_CURRENCY: Record<string, string> = {
  India: "INR",
  "United States": "USD",
  "United States of America": "USD",
  Japan: "JPY",
  Germany: "EUR",
  France: "EUR",
  Spain: "EUR",
  Italy: "EUR",
  Ireland: "EUR",
  Netherlands: "EUR",
  Portugal: "EUR",
  Austria: "EUR",
  Belgium: "EUR",
  Finland: "EUR",
  Greece: "EUR",
  "United Kingdom": "GBP",
  "United Arab Emirates": "AED",
  Singapore: "SGD",
  Australia: "AUD",
  Canada: "CAD",
};

// Deterministic location -> currency resolution. Returns `null` when the
// location is unknown/unresolvable — callers MUST treat that as "waiting
// for location" and must NEVER coerce it to a hardcoded currency (that was
// the bug: silently assuming USD made India resolve to USD/$ whenever
// country data was missing). Prefer the ISO country code when available;
// it's authoritative and can't be misspelled the way a country name can.
export function resolveAutoCurrency(country: string | null, countryCode?: string | null): string | null {
  if (countryCode) {
    const byCode = COUNTRY_CODE_CURRENCY[countryCode.toUpperCase()];
    if (byCode) return byCode;
  }
  if (country) {
    const byName = COUNTRY_NAME_CURRENCY[country];
    if (byName) return byName;
  }
  return null;
}

export function getCurrencyOption(code: string): CurrencyOption {
  return CURRENCY_BY_CODE.get(code) ?? CURRENCIES[0];
}

export function formatCurrency(amount: number, code: string): string {
  const option = getCurrencyOption(code);
  try {
    return new Intl.NumberFormat(option.locale, {
      style: "currency",
      currency: option.code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${option.symbol}${Math.round(amount).toLocaleString()}`;
  }
}

export type ConversionResult = { amount: number; ok: true } | { amount: null; ok: false };

// Server-side only (calls an external HTTP API). Never invents a rate on
// failure — callers must show "conversion unavailable" rather than a
// silently wrong number (see also lib/wardrobeAnalysis.ts budget scoring,
// which uses a static approximate table for internal scoring only, not for
// anything display-facing).
export async function convertCurrency(amount: number, from: string, to: string): Promise<ConversionResult> {
  if (from === to) return { amount, ok: true };
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?amount=${amount}&from=${from}&to=${to}`
    );
    if (!res.ok) return { amount: null, ok: false };
    const data = await res.json();
    const converted = data?.rates?.[to];
    if (typeof converted !== "number") return { amount: null, ok: false };
    return { amount: converted, ok: true };
  } catch {
    return { amount: null, ok: false };
  }
}

// Approximate, static USD conversion factors used ONLY to translate the
// internal TYPICAL_PRICE_RANGE_USD scoring table into the user's currency
// for the deterministic budget-fit score. Never shown to the user as a real
// rate or a real price — if you need a real, live rate, use
// convertCurrency() above instead.
const APPROX_USD_RATE: Record<string, number> = {
  USD: 1,
  INR: 83,
  JPY: 150,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SGD: 1.34,
  AUD: 1.52,
  CAD: 1.36,
};

export function approxConvertFromUsd(amountUsd: number, toCurrency: string): number {
  const rate = APPROX_USD_RATE[toCurrency] ?? 1;
  return amountUsd * rate;
}
