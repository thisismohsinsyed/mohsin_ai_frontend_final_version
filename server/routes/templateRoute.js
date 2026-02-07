import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const router = Router();

// Use a singleton PrismaClient
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
}

// GET /api/templates - List all templates
router.get("/", async (req, res) => {
    try {
        const templates = await prisma.scriptTemplate.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json({ templates });
    } catch (error) {
        console.error("Failed to fetch templates", error);
        res.status(500).json({ error: "Unable to fetch templates." });
    }
});

// POST /api/templates/update - Update a template by ID (in body)
router.post("/update", async (req, res) => {
    console.log("[Express Route] POST /api/templates/update - Starting...");
    try {
        const { id, ...updateData } = req.body;
        console.log("[Express Route] Template ID:", id);

        if (!id) {
            return res.status(400).json({ error: "Template id is required." });
        }

        const updates = {};
        ["label", "initialSentence", "systemPrompt", "description", "notes"].forEach((field) => {
            if (field in updateData && updateData[field] !== undefined) {
                const value = updateData[field];
                updates[field] = typeof value === "string" ? value.trim() : value;
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid fields to update." });
        }

        console.log("[Express Route] Updating database...");
        const updated = await prisma.scriptTemplate.update({
            where: { id },
            data: updates,
        });
        console.log("[Express Route] Database updated successfully");

        res.json({ template: updated });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Template not found." });
        }
        console.error("Failed to update template", error);
        res.status(500).json({ error: "Unable to update template." });
    }
});

// PATCH /api/templates/:id - Update a template
router.patch("/:id", async (req, res) => {
    console.log("[Express Route] PATCH /api/templates/:id - Starting...");
    try {
        const { id } = req.params;
        console.log("[Express Route] Template ID:", id);

        if (!id) {
            return res.status(400).json({ error: "Template id is required." });
        }

        const body = req.body;
        const updates = {};
        ["label", "initialSentence", "systemPrompt", "description", "notes"].forEach((field) => {
            if (field in body && body[field] !== undefined) {
                const value = body[field];
                updates[field] = typeof value === "string" ? value.trim() : value;
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No valid fields to update." });
        }

        console.log("[Express Route] Updating database...");
        const updated = await prisma.scriptTemplate.update({
            where: { id },
            data: updates,
        });
        console.log("[Express Route] Database updated successfully");

        res.json({ template: updated });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Template not found." });
        }
        console.error("Failed to update template", error);
        res.status(500).json({ error: "Unable to update template." });
    }
});

// DELETE /api/templates/:id - Delete a template
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Template id is required." });
        }

        await prisma.scriptTemplate.delete({ where: { id } });
        res.json({ id });
    } catch (error) {
        if (error.code === "P2025") {
            return res.json({ id: req.params.id, status: "already_deleted" });
        }
        console.error("Failed to delete template", error);
        res.status(500).json({ error: "Unable to delete template." });
    }
});

export default router;
