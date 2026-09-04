import Link from "next/link";
import { ClothingUploader } from "@/components/ClothingUploader";

export default function AddClothingPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/wardrobe" className="text-sm text-stone hover:text-ink transition-colors">
        ← Back to wardrobe
      </Link>
      <h1 className="font-display text-4xl mt-4 mb-2">Add clothing</h1>
      <p className="text-stone mb-10">
        Upload a clear photo of one item at a time. ClosetAI will identify its category, colour,
        fit and more automatically — you can correct anything afterwards.
      </p>
      <ClothingUploader />
    </div>
  );
}
