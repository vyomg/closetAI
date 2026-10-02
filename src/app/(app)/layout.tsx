import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <>
      <div className="lg:flex">
        <Sidebar userName={session?.user?.name ?? ""} userEmail={session?.user?.email ?? ""} />
        <main className="flex-1 min-w-0 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10 pb-28 lg:mx-0 lg:max-w-[1600px] lg:px-10 xl:px-14 lg:py-10 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
