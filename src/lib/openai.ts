import OpenAI from "openai";
import { env } from "./env";

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const chatModel = env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
export const feedbackModel = env.OPENAI_FEEDBACK_MODEL;
export const summaryModel = env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini";

