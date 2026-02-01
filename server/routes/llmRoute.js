import express from "express";
import { handleChat } from "../controllers/llmController.js";

const router = express.Router();

// POST endpoint to get LLM response
router.post("/chat", handleChat);

export default router;
