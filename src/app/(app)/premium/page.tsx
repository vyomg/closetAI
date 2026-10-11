import { redirect } from "next/navigation";

// Premium was removed as a product feature in favor of the credit system —
// old bookmarks/links to /premium land here and forward to the real
// destination rather than a bare 404.
export default function PremiumRedirectPage() {
  redirect("/buy-credits");
}
