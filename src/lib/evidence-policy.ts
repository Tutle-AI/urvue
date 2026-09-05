export type PatternStrength = "ISOLATED" | "EMERGING" | "ESTABLISHED";

export function patternStrengthFor(distinctConversations: number): PatternStrength {
  if (distinctConversations >= 5) return "ESTABLISHED";
  if (distinctConversations >= 2) return "EMERGING";
  return "ISOLATED";
}

export function canComparePeriods(currentSample: number, previousSample: number) {
  return currentSample >= 5 && previousSample >= 5;
}

export function canRankStaff(distinctConversations: number) {
  return distinctConversations >= 8;
}
