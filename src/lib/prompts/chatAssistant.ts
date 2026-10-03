// Plain-text conversational replies for Chat Now's "chat-only mode" (and
// anything that isn't clearly an outfit request) — reuses the exact same
// Gemini client/model as every other prompt in this file's siblings, just a
// different, lighter call: no JSON schema, no wardrobe selection, just a
// grounded reply. Outfit requests still go through generateAndSaveOutfit,
// never this.
import { getGeminiClient, GEMINI_MODEL } from "@/lib/anthropic";

export type ChatAssistantContext = {
  nickname: string | null;
  styleSummary: string;
  wardrobeSummary: string;
  mode: "closet" | "hybrid" | "shopping";
  history: { role: "user" | "assistant"; content: string }[];
  message: string;
  attachmentDescription?: string;
};

const MODE_FRAMING: Record<ChatAssistantContext["mode"], string> = {
  closet: "Only reference clothes the user actually owns (their wardrobe). Never suggest buying anything in this mode.",
  hybrid:
    "Prefer the user's own wardrobe, but you may briefly mention a general type of item (never a specific product/brand/price) that would help, if relevant.",
  shopping: "The user is in a shopping-focused mindset — help them think through what's actually worth buying, grounded in what they already own.",
};

export async function chatReply(ctx: ChatAssistantContext): Promise<string> {
  const client = getGeminiClient();

  const systemInstruction = `You are matchin', a warm, direct personal styling assistant inside the matchin' app. Keep replies conversational, concise (2-4 sentences unless asked for more), and grounded ONLY in the context given below — never invent specific wardrobe items, prices, or brands that weren't mentioned. Lowercase, casual tone, no corporate language.

${ctx.nickname ? `The user goes by ${ctx.nickname}.` : ""}
Style profile: ${ctx.styleSummary}
Wardrobe: ${ctx.wardrobeSummary}
Mode: ${ctx.mode}. ${MODE_FRAMING[ctx.mode]}
${ctx.attachmentDescription ? `The user attached: ${ctx.attachmentDescription}` : ""}`;

  const contents = [
    ...ctx.history.slice(-10).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    })),
    { role: "user" as const, parts: [{ text: ctx.message }] },
  ];

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { systemInstruction },
  });

  return response.text?.trim() || "I'm not sure how to respond to that — try asking me for an outfit instead?";
}
