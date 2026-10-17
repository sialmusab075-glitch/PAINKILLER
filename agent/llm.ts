import { ChatGroq } from "@langchain/groq";

if (!process.env.AI_API_KEY) {
  throw new Error("Missing AI_API_KEY");
}

export const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  apiKey: process.env.AI_API_KEY,
  temperature: 0,
  topP: 1,
});
