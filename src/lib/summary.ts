import { Sentiment, SessionStatus } from "@prisma/client";
import { prisma } from "./db";
import { openai, summaryModel } from "./openai";

function toSentiment(value: string) {
  const normalized = value.toUpperCase();
  if (normalized.includes("POS")) return "POSITIVE";
  if (normalized.includes("NEG")) return "NEGATIVE";
  return "NEUTRAL";
}

export async function generateSessionSummary(sessionId: string) {
  const messages = await prisma.feedbackMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  if (!messages.length) {
    throw new Error("No messages to summarize");
  }

  const transcript = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const response = await openai.responses.create({
    model: summaryModel,
    input: [
      {
        role: "user",
        content: `Summarize this customer conversation into 3-5 bullet points and infer sentiment (positive, neutral, or negative) with a 0-1 confidence score.\nReturn JSON with keys: summary, sentiment, score.\n\n${transcript}`,
      },
    ],
    text: { format: { type: "json_object" } },
  });

  const payload = JSON.parse(response.output_text ?? "{}") as {
    summary?: string;
    sentiment?: string;
    score?: number;
  };

  const summaryText =
    payload.summary ||
    "Customer shared feedback. No additional summary was generated.";

  const sentiment = toSentiment(payload.sentiment || "NEUTRAL") as Sentiment;
  const score =
    typeof payload.score === "number"
      ? Math.max(0, Math.min(1, payload.score))
      : null;

  const summaryRecord = await prisma.feedbackSummary.upsert({
    where: { sessionId },
    create: {
      sessionId,
      summary: summaryText,
      sentiment,
      score,
    },
    update: {
      summary: summaryText,
      sentiment,
      score,
    },
  });

  await prisma.feedbackSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.CLOSED },
  });

  return summaryRecord;
}

