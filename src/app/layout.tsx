import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "matchin' — your wardrobe. matched.",
  description:
    "matchin' turns the clothes you already own into a digital wardrobe, then matches complete outfits and shopping decisions from it — for any occasion, any weather.",
  openGraph: {
    title: "matchin'",
    description: "your wardrobe. matched.",
    siteName: "matchin'",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "matchin'",
    description: "your wardrobe. matched.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
