// Chat Now intent classification — fixes the bug where every message
// (including "hi") was forced through outfit generation. A real message
// can be: plain conversation/general-knowledge/app-help (→ chatReply, free,
// no outfit), or an actual outfit request/refinement (→ generateAndSaveOutfit,
// the existing pipeline, unchanged). This is a small, cheap, structured
// Gemini call — not keyword matching, which is too fragile for things like
// "tell me a joke" vs "give me something fun to wear" — and it's the ONLY
// new AI call this fix introduces; everything downstream of its decision
// already existed.
import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL, extractJson } from "@/lib/anthropic";

export type ChatIntent = "chat" | "outfit";

export type IntentContext = {
  message: string;
  history: { role: "user" | "assistant"; content: string; hadOutfit?: boolean }[];
  hasAttachment: boolean;
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING, enum: ["chat", "outfit"] },
  },
  required: ["intent"],
};

const SYSTEM_INSTRUCTION = `You classify one incoming chat message inside matchin', a fashion-styling app, into exactly one of two intents:

"chat" — greetings, small talk, general-knowledge questions, jokes, questions about how the app works, or fashion ADVICE/explanations that don't require building a specific outfit (e.g. "what's color theory?", "how do I add clothes?", "how are you?").

"outfit" — the user explicitly wants an outfit built, suggested, or changed: a request for something to wear, a request to generate/suggest/build/style an outfit, or a follow-up asking to modify/refine an outfit that was just shown (e.g. "what should I wear to a party", "make this more casual", "give me 3 outfits for my trip", "style my black jeans").

When genuinely ambiguous, prefer "chat" — a wrong "chat" just means the user has to ask again more directly; a wrong "outfit" wastes a real AI generation on a message that didn't want one. Reply with ONLY the JSON object.`;

export async function classifyIntent(ctx: IntentContext): Promise<ChatIntent> {
  const client = getGeminiClient();

  const historyLines = ctx.history.slice(-6).map((m) => {
    const tag = m.role === "user" ? "User" : m.hadOutfit ? "Assistant (sent an outfit)" : "Assistant";
    return `${tag}: ${m.content.slice(0, 200)}`;
  });

  const prompt = [
    historyLines.length > 0 ? `Recent conversation:\n${historyLines.join("\n")}\n` : "",
    ctx.hasAttachment ? "The user attached a photo to this message.\n" : "",
    `New message: "${ctx.message}"`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = extractJson<{ intent: ChatIntent }>(response.text ?? "");
    return parsed.intent === "outfit" ? "outfit" : "chat";
  } catch {
    // If classification itself fails (bad JSON, transient error), fail
    // toward the cheaper, safer path rather than silently generating an
    // outfit nobody asked for.
    return "chat";
  }
}
