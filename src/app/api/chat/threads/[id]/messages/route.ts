import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";
import { filterWardrobeForWeather, recentOutfitItemIds } from "@/lib/outfitFilters";
import { getWeatherForCity, getWeatherForCoordinates, weatherToSeasonHint } from "@/lib/weather";
import { generateAndSaveOutfit } from "@/lib/generateAndSaveOutfit";
import { spendCredits, OUTFIT_GENERATE_COST } from "@/lib/credits";
import { analyzeClothingImage } from "@/lib/prompts/clothingAnalyzer";
import { chatReply } from "@/lib/prompts/chatAssistant";
import { saveImage, fileToBase64 } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: threadId } = await params;

  const thread = await db.chatThread.findFirst({ where: { id: threadId, userId: session.user.id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const text = String(formData.get("text") ?? "").trim();
  const occasion = formData.get("occasion") ? String(formData.get("occasion")) : "Everyday";
  const desiredStyle = formData.get("desiredStyle") ? String(formData.get("desiredStyle")) : "Custom";
  const chatOnly = formData.get("chatOnly") === "true";
  const attachedItemId = formData.get("attachedItemId") ? String(formData.get("attachedItemId")) : null;
  const imageFile = formData.get("image");

  if (!text) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // --- Resolve attachment (wardrobe item reference OR a fresh photo) ---
  let attachmentImageUrl: string | null = null;
  let attachmentLabel: string | null = null;
  let attachmentDescription: string | undefined;

  if (attachedItemId) {
    const item = await db.clothingItem.findFirst({ where: { id: attachedItemId, userId: user.id } });
    if (item) {
      attachmentImageUrl = item.imageUrl;
      attachmentLabel = item.name;
      attachmentDescription = `${item.primaryColor} ${item.subcategory} (already in their wardrobe)`;
    }
  } else if (imageFile instanceof File && imageFile.size > 0) {
    try {
      attachmentImageUrl = await saveImage(user.id, imageFile, "chat-attachments");
      const bytes = Buffer.from(await imageFile.arrayBuffer());
      const analysis = await analyzeClothingImage(fileToBase64(bytes), imageFile.type);
      attachmentLabel = `${analysis.primaryColor} ${analysis.subcategory}`;
      attachmentDescription = `a photo of a ${analysis.primaryColor} ${analysis.subcategory} (${analysis.style}, not in their wardrobe)`;
    } catch (err) {
      console.error("Chat attachment analysis failed", err);
    }
  }

  const userMessage = await db.chatMessage.create({
    data: { threadId: thread.id, role: "user", content: text, attachmentImageUrl, attachmentLabel },
  });

  // Auto-title a fresh thread from its first message.
  if (thread.title === "New chat") {
    await db.chatThread.update({
      where: { id: thread.id },
      data: { title: text.length > 50 ? `${text.slice(0, 50)}…` : text },
    });
  }

  const history = await db.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  const byCategory = wardrobeItems.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1;
    return acc;
  }, {});
  const wardrobeSummary =
    wardrobeItems.length === 0
      ? "empty — no items yet"
      : `${wardrobeItems.length} items (${Object.entries(byCategory).map(([c, n]) => `${n} ${c}`).join(", ")})`;

  const styleProfile = userToStyleProfile(user);
  const styleSummary = [
    styleProfile.preferredStyles.length > 0 ? `likes ${styleProfile.preferredStyles.join(", ")}` : null,
    styleProfile.colorsLove.length > 0 ? `favors ${styleProfile.colorsLove.join(", ")}` : null,
    styleProfile.colorsAvoid.length > 0 ? `avoids ${styleProfile.colorsAvoid.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("; ") || "still being learned";

  // --- Chat-only: a plain grounded reply, no outfit, no credit cost ---
  if (chatOnly || wardrobeItems.length < 3) {
    try {
      const reply = await chatReply({
        nickname: user.nickname,
        styleSummary,
        wardrobeSummary,
        mode: thread.mode as "closet" | "hybrid" | "shopping",
        history: history.slice(0, -1).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        message: text,
        attachmentDescription,
      });
      const assistantMessage = await db.chatMessage.create({
        data: { threadId: thread.id, role: "assistant", content: reply },
      });
      await db.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
      return NextResponse.json({ userMessage: serializeMessage(userMessage), assistantMessage: serializeMessage(assistantMessage) });
    } catch (err) {
      if (err instanceof AIConfigError) {
        return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
      }
      console.error("Chat reply failed", err);
      return NextResponse.json({ error: "matchin' couldn't respond. Try again." }, { status: 502 });
    }
  }

  // --- Outfit request: reuse the exact same generation pipeline as
  // Outfit Generator / Playground, framed by this thread's mode. ---
  if (user.creditBalance < OUTFIT_GENERATE_COST) {
    return NextResponse.json(
      { error: "You're out of credits. Buy more to keep asking matchin' for outfits.", code: "OUT_OF_CREDITS" },
      { status: 402 }
    );
  }

  let weather = null;
  if (user.latitude != null && user.longitude != null) {
    weather = await getWeatherForCoordinates(user.latitude, user.longitude, user.city ?? "", user.country ?? null);
  } else if (user.city) {
    weather = await getWeatherForCity(user.city);
  }
  const seasonHint = weather ? weatherToSeasonHint(weather.tempC) : null;

  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  const filtered = filterWardrobeForWeather(aiWardrobe, seasonHint);

  const recentOutfits = await db.outfit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  const modeFraming: Record<string, string> = {
    closet: "Only use items already in the wardrobe below.",
    hybrid:
      "Prefer the wardrobe below. If a type of item would meaningfully improve this and isn't owned, say so briefly in the explanation — never invent a specific product.",
    shopping: "Frame the explanation around what's working from their wardrobe and what general category might be worth adding.",
  };

  const notes = [
    text,
    modeFraming[thread.mode] ?? "",
    attachmentDescription ? `The user attached ${attachmentDescription}. Factor this into your reasoning even though it isn't a wardrobe item you can select.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  let generateResult;
  try {
    generateResult = await generateAndSaveOutfit({
      user,
      wardrobeItems,
      filteredForAI: filtered,
      styleProfile,
      learnedPreferences: userToLearnedPreferences(user),
      occasion,
      desiredStyle,
      notes,
      adventureLevel: styleProfile.adventurousness,
      weather: weather
        ? {
            tempC: weather.tempC,
            feelsLikeC: weather.feelsLikeC,
            condition: weather.condition,
            humidity: weather.humidity,
            precipitationProbability: weather.precipitationProbability,
            uvIndex: weather.uvIndex,
          }
        : null,
      recentOutfitItemIds: recentOutfitItemIds(recentOutfits),
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Chat outfit generation failed", err);
    return NextResponse.json({ error: "matchin' couldn't put that together. Try again." }, { status: 502 });
  }

  if (!generateResult.ok) {
    const assistantMessage = await db.chatMessage.create({
      data: { threadId: thread.id, role: "assistant", content: generateResult.error },
    });
    return NextResponse.json(
      { userMessage: serializeMessage(userMessage), assistantMessage: serializeMessage(assistantMessage), error: generateResult.error },
      { status: generateResult.status }
    );
  }

  const spend = await spendCredits(user.id, OUTFIT_GENERATE_COST, "chat_outfit_generate");

  const assistantMessage = await db.chatMessage.create({
    data: {
      threadId: thread.id,
      role: "assistant",
      content: generateResult.outfit.explanation,
      outfitId: generateResult.outfit.id,
    },
  });
  await db.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    userMessage: serializeMessage(userMessage),
    assistantMessage: { ...serializeMessage(assistantMessage), outfit: generateResult.outfit },
    creditsRemaining: spend.balance,
  });
}

function serializeMessage(m: { id: string; role: string; content: string; attachmentImageUrl: string | null; attachmentLabel: string | null; createdAt: Date }) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    attachmentImageUrl: m.attachmentImageUrl,
    attachmentLabel: m.attachmentLabel,
    createdAt: m.createdAt,
  };
}
