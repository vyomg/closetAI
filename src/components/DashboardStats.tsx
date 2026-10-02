import Link from "next/link";

export function DashboardStats({ itemCount, styleTags }: { itemCount: number; styleTags: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-white grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">
      <Link href="/wardrobe" className="p-6 hover:bg-paper-alt transition-colors">
        <p className="text-sm text-stone mb-2">Your Wardrobe</p>
        <p className="font-display text-3xl">{itemCount} items</p>
      </Link>
      <Link href="/style-profile" className="p-6 hover:bg-paper-alt transition-colors">
        <p className="text-sm text-stone mb-2">Your Style</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {styleTags.length > 0 ? (
            styleTags.map((tag) => (
              <span key={tag} className="rounded-full bg-paper-alt px-3 py-1 text-sm">
                {tag}
              </span>
            ))
          ) : (
            <span className="font-display text-2xl">Not set yet</span>
          )}
        </div>
      </Link>
    </div>
  );
}
