import type { Plan } from "@prisma/client";

export function maxLocationsForPlan(plan: Plan) {
  return plan === "PRO" ? 5 : 1;
}

