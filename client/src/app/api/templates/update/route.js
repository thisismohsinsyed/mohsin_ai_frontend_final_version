export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// POST /api/templates/update - Alternative to PATCH /api/templates/[id]
// Used as a workaround for Next.js 15 dynamic route issues with custom Express server
export async function POST(req) {

    try {
        const body = await req.json();
        const { id, ...updateData } = body;



        if (!id) {
            return NextResponse.json({ error: "Template id is required." }, { status: 400 });
        }

        const updates = {};
        ["label", "initialSentence", "systemPrompt", "description", "notes"].forEach((field) => {
            if (field in updateData && updateData[field] !== undefined) {
                const value = updateData[field];
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
