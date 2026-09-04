import { Navigation } from "@/components/Navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </>
  );
}
