import { redirect } from "next/navigation";

// Outfit Challenges was removed as a product feature — old
// bookmarks/links land here and forward to Outfit Playground, the closest
// remaining way to build outfits interactively, rather than a bare 404.
export default function ChallengesRedirectPage() {
  redirect("/outfits/playground");
}
