-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AgentPersona" AS ENUM ('AMANDA', 'DEREK', 'PROFESSIONAL', 'DIRECT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('CUSTOMER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReturnIntent" AS ENUM ('YES', 'MAYBE', 'NO', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "FindingKind" AS ENUM ('TOPIC', 'PRAISE', 'COMPLAINT', 'COMPLIMENT', 'SUGGESTION', 'ACTIONABLE_ISSUE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('PERSON', 'PRODUCT', 'SERVICE', 'LOCATION');

-- CreateEnum
CREATE TYPE "ContextSource" AS ENUM ('ONBOARDING', 'KIRI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ChangeStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PatternStrength" AS ENUM ('ISOLATED', 'EMERGING', 'ESTABLISHED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('GOING_WELL', 'NEEDS_ATTENTION', 'CHANGED', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "JobKind" AS ENUM ('ANALYZE_CONVERSATION', 'REFRESH_SPACE_INSIGHTS', 'GENERATE_WEEKLY_REPORT', 'SEND_WEEKLY_REPORT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "KiriMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountMembership" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessType" TEXT,
    "description" TEXT,
    "focusTopic1" TEXT,
    "focusTopic2" TEXT,
    "focusTopic3" TEXT,
    "agentPersona" "AgentPersona" NOT NULL DEFAULT 'AMANDA',
    "onboardingCompletedAt" TIMESTAMP(3),
    "accountId" TEXT,
    "ownerId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceGoal" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" "ContextSource" NOT NULL DEFAULT 'ONBOARDING',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedEntity" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContextSource" NOT NULL DEFAULT 'ONBOARDING',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackedEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessChange" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "status" "ChangeStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "ContextSource" NOT NULL DEFAULT 'ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackSession" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "customerName" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "analysisStatus" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "accessTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "FeedbackSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationAnalysis" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "satisfaction" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "returnIntent" "ReturnIntent" NOT NULL DEFAULT 'UNKNOWN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "provenance" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisFinding" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "kind" "FindingKind" NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "sentiment" "Sentiment",
    "severity" "Severity",
    "confidence" DOUBLE PRECISION,
    "evidenceMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMention" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sentiment" "Sentiment",
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "EntityMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "recommendation" TEXT,
    "confidence" DOUBLE PRECISION,
    "patternStrength" "PatternStrength" NOT NULL,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightEvidence" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "findingId" TEXT,
    "excerpt" TEXT,

    CONSTRAINT "InsightEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntelligenceJob" (
    "id" TEXT NOT NULL,
    "kind" "JobKind" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "spaceId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntelligenceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KiriThread" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "spaceId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KiriThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KiriMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "role" "KiriMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "pageContext" JSONB,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KiriMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitWindow" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitWindow_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FeedbackSummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackInsight" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "satisfactionScore" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "painPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "praise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featureRequests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_stripeCustomerId_key" ON "Account"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_stripeSubscriptionId_key" ON "Account"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "AccountMembership_userId_idx" ON "AccountMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountMembership_accountId_userId_key" ON "AccountMembership"("accountId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeCustomerId_key" ON "Business"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_stripeSubscriptionId_key" ON "Business"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Business_accountId_idx" ON "Business"("accountId");

-- CreateIndex
CREATE INDEX "SpaceGoal_spaceId_active_idx" ON "SpaceGoal"("spaceId", "active");

-- CreateIndex
CREATE INDEX "TrackedEntity_spaceId_type_idx" ON "TrackedEntity"("spaceId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedEntity_spaceId_type_name_key" ON "TrackedEntity"("spaceId", "type", "name");

-- CreateIndex
CREATE INDEX "BusinessChange_spaceId_status_idx" ON "BusinessChange"("spaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE INDEX "Location_businessId_idx" ON "Location"("businessId");

-- CreateIndex
CREATE INDEX "FeedbackSession_locationId_createdAt_idx" ON "FeedbackSession"("locationId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedbackSession_accessTokenHash_idx" ON "FeedbackSession"("accessTokenHash");

-- CreateIndex
CREATE INDEX "FeedbackMessage_sessionId_createdAt_idx" ON "FeedbackMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationAnalysis_conversationId_key" ON "ConversationAnalysis"("conversationId");

-- CreateIndex
CREATE INDEX "AnalysisFinding_analysisId_kind_idx" ON "AnalysisFinding"("analysisId", "kind");

-- CreateIndex
CREATE INDEX "AnalysisFinding_label_idx" ON "AnalysisFinding"("label");

-- CreateIndex
CREATE INDEX "EntityMention_entityId_idx" ON "EntityMention"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMention_findingId_entityId_key" ON "EntityMention"("findingId", "entityId");

-- CreateIndex
CREATE INDEX "Insight_spaceId_type_active_idx" ON "Insight"("spaceId", "type", "active");

-- CreateIndex
CREATE INDEX "InsightEvidence_conversationId_idx" ON "InsightEvidence"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "InsightEvidence_insightId_conversationId_findingId_key" ON "InsightEvidence"("insightId", "conversationId", "findingId");

-- CreateIndex
CREATE UNIQUE INDEX "IntelligenceJob_dedupeKey_key" ON "IntelligenceJob"("dedupeKey");

-- CreateIndex
CREATE INDEX "IntelligenceJob_status_runAt_idx" ON "IntelligenceJob"("status", "runAt");

-- CreateIndex
CREATE INDEX "IntelligenceJob_spaceId_idx" ON "IntelligenceJob"("spaceId");

-- CreateIndex
CREATE INDEX "KiriThread_accountId_updatedAt_idx" ON "KiriThread"("accountId", "updatedAt");

-- CreateIndex
CREATE INDEX "KiriThread_spaceId_idx" ON "KiriThread"("spaceId");

-- CreateIndex
CREATE INDEX "KiriMessage_threadId_createdAt_idx" ON "KiriMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitWindow_resetAt_idx" ON "RateLimitWindow"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackSummary_sessionId_key" ON "FeedbackSummary"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackInsight_sessionId_key" ON "FeedbackInsight"("sessionId");

-- AddForeignKey
ALTER TABLE "AccountMembership" ADD CONSTRAINT "AccountMembership_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountMembership" ADD CONSTRAINT "AccountMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceGoal" ADD CONSTRAINT "SpaceGoal_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedEntity" ADD CONSTRAINT "TrackedEntity_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessChange" ADD CONSTRAINT "BusinessChange_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSession" ADD CONSTRAINT "FeedbackSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackMessage" ADD CONSTRAINT "FeedbackMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedbackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationAnalysis" ADD CONSTRAINT "ConversationAnalysis_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "FeedbackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFinding" ADD CONSTRAINT "AnalysisFinding_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ConversationAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisFinding" ADD CONSTRAINT "AnalysisFinding_evidenceMessageId_fkey" FOREIGN KEY ("evidenceMessageId") REFERENCES "FeedbackMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AnalysisFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMention" ADD CONSTRAINT "EntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "TrackedEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightEvidence" ADD CONSTRAINT "InsightEvidence_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightEvidence" ADD CONSTRAINT "InsightEvidence_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "FeedbackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightEvidence" ADD CONSTRAINT "InsightEvidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AnalysisFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntelligenceJob" ADD CONSTRAINT "IntelligenceJob_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KiriThread" ADD CONSTRAINT "KiriThread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KiriThread" ADD CONSTRAINT "KiriThread_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KiriMessage" ADD CONSTRAINT "KiriMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "KiriThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackSummary" ADD CONSTRAINT "FeedbackSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedbackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackInsight" ADD CONSTRAINT "FeedbackInsight_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeedbackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
