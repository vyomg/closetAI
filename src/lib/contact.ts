// Real contact channels for the "Connect With Us" page
// (src/app/(app)/connect/page.tsx). None of these exist anywhere else in
// the project yet, so they start unset — the page shows each channel as
// "not set up yet" until you fill it in here, rather than linking to a
// fake number/address/handle.
export const CONTACT = {
  // Digits only, no "+", no spaces — e.g. "15551234567".
  whatsappNumber: null as string | null,
  // e.g. "hello@matchin.app"
  email: null as string | null,
  // No "@" — e.g. "matchin.app"
  instagramHandle: null as string | null,
};
