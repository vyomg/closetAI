import type { WeatherSnapshot } from "@/lib/weather";

export type HomeRecentItem = {
  id: string;
  imageUrl: string;
  name: string;
};

export type HomeRecentOutfit = {
  id: string;
  occasion: string;
  overallScore: number;
  items: { id: string; clothingItem: { imageUrl: string } }[];
};

export type HomeData = {
  firstName: string;
  weather: WeatherSnapshot | null;
  tempUnit: "C" | "F";
  itemCount: number;
  styleTags: string[];
  recentItems: HomeRecentItem[];
  recentOutfits: HomeRecentOutfit[];
  todaysOutfit: HomeRecentOutfit | null;
  hasAppearanceProfile: boolean;
};
