export type Feature = "newOnboarding" | "publicConversations" | "analysisV2" | "intelligenceDashboard" | "kiri";

const environmentKeys: Record<Feature, string> = {
  newOnboarding: "FEATURE_NEW_ONBOARDING",
  publicConversations: "FEATURE_PUBLIC_CONVERSATIONS",
  analysisV2: "FEATURE_ANALYSIS_V2",
  intelligenceDashboard: "FEATURE_INTELLIGENCE_DASHBOARD",
  kiri: "FEATURE_KIRI",
};

export function featureEnabled(feature: Feature) {
  return process.env[environmentKeys[feature]]?.toLowerCase() !== "false";
}
