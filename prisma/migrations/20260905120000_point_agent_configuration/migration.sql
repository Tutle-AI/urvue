-- Copy the existing brief once so every point becomes independently editable.
-- Public slugs, IDs, and conversation history are preserved.
BEGIN;
ALTER TABLE "Location"
  ADD COLUMN "businessType" TEXT NOT NULL DEFAULT 'Other',
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "goals" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "agentPersona" "AgentPersona" NOT NULL DEFAULT 'AMANDA';

UPDATE "Location" AS point
SET "businessType" = COALESCE(space."businessType", 'Other'),
    "description" = COALESCE(space."description", ''),
    "agentPersona" = space."agentPersona",
    "goals" = CASE WHEN EXISTS (
      SELECT 1 FROM "SpaceGoal" WHERE "spaceId" = space.id AND active = true
    ) THEN ARRAY(
      SELECT label FROM "SpaceGoal" WHERE "spaceId" = space.id AND active = true
      ORDER BY priority, "createdAt", id
    ) ELSE array_remove(ARRAY[space."focusTopic1", space."focusTopic2", space."focusTopic3"], NULL) END
FROM "Business" AS space
WHERE point."businessId" = space.id;

-- Keep the brief used for a conversation stable through future edits.
ALTER TABLE "FeedbackSession" ADD COLUMN "interviewConfig" JSONB;
UPDATE "FeedbackSession" AS conversation
SET "interviewConfig" = jsonb_build_object(
  'name', point.name, 'businessType', point."businessType",
  'description', point.description, 'goals', point.goals,
  'agentPersona', point."agentPersona"
)
FROM "Location" AS point WHERE conversation."locationId" = point.id;
COMMIT;
