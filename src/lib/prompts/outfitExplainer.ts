import { getAnthropicClient, CLAUDE_MODEL, extractJson } from "@/lib/anthropic";
import type { StyleProfileData } from "@/lib/types";
import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";

const SYSTEM_PROMPT = `You are the Outfit Explainer for ClosetAI. Given an already-chosen outfit, explain in plain, natural language why it works. Keep it concise (4-6 short sentences or bullet-style clauses). Cover: why the colours work together, why the formality matches the occasion, why the pieces are stylistically compatible, how it fits the user's stated style, and what occasion(s) it suits. Do not suggest changes or alternatives — only explain the outfit as given. Respond with ONLY a JSON object: { "explanation": string }`;

export async function explainOutfit(params: {
  items: WardrobeItemForAI[];
  occasion: string;
  style: string;
  styleProfile: StyleProfileData;
}): Promise<string> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `OUTFIT ITEMS:\n${JSON.stringify(params.items, null, 2)}\n\nOCCASION: ${params.occasion}\nSTYLE: ${params.style}\nUSER STYLE PROFILE:\n${JSON.stringify(params.styleProfile, null, 2)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for outfit explanation");
  }

  const parsed = extractJson<{ explanation: string }>(textBlock.text);
  return parsed.explanation;
}
