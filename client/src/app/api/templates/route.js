export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.scriptTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Failed to load script templates", error);
    return NextResponse.json({ error: "Unable to load templates." }, { status: 500 });
  }
}
