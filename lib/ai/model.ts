import "server-only";
import { ChatGroq } from "@langchain/groq";
import { aiEnv } from "@/lib/env";

/** Single place to swap LLM provider or model. */
export function getChatModel({
  temperature,
  maxTokens,
}: {
  temperature: number;
  /** Output cap. For reasoning models this budget also covers hidden reasoning tokens. */
  maxTokens: number;
}) {
  const { AI_API_KEY, AI_MODEL } = aiEnv();
  return new ChatGroq({
    apiKey: AI_API_KEY,
    model: AI_MODEL,
    temperature,
    maxTokens,
    // gpt-oss models reason before answering; keep that short so the budget goes to the answer.
    reasoningEffort: AI_MODEL.startsWith("openai/gpt-oss") ? "low" : undefined,
    maxRetries: 2,
  });
}
