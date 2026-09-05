import { analyzeConversation } from "@/lib/intelligence";
import { prisma } from "@/lib/db";

// Compatibility entry point for the legacy owner-side action.
export async function generateSessionSummary(conversationId: string) {
  await analyzeConversation(conversationId);
  return prisma.conversationAnalysis.findUniqueOrThrow({ where: { conversationId } });
}
