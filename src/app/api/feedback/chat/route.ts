import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint has moved. Start a credentialed conversation through the public feedback API.",
      replacement: "/api/public/feedback-points/[slug]/conversations",
    },
    { status: 410 },
  );
}
