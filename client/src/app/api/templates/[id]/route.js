export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }

    const body = await req.json();
    const updates = {};
    ["label", "initialSentence", "systemPrompt", "description", "notes"].forEach((field) => {
      if (field in body && body[field] !== undefined) {
        const value = body[field];
        updates[field] = typeof value === "string" ? value.trim() : value;
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await prisma.scriptTemplate.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ template: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    console.error("Failed to update template", error);
    return NextResponse.json({ error: "Unable to update template." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Template id is required." }, { status: 400 });
    }

    await prisma.scriptTemplate.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Template not found." }, { status: 404 });
    }
    console.error("Failed to delete template", error);
    return NextResponse.json({ error: "Unable to delete template." }, { status: 500 });
  }
}
