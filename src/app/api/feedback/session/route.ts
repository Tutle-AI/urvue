import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug : "";
    const customerName =
      typeof body.customerName === "string" ? body.customerName : null;

    if (!slug) {
      return NextResponse.json({ error: "Missing location slug" }, { status: 400 });
    }

    const location = await prisma.location.findUnique({
      where: { slug },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    const session = await prisma.feedbackSession.create({
      data: {
        locationId: location.id,
        customerName,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}

