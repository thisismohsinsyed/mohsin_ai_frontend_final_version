import express from "express";
import { cloneVoice } from "../controllers/voiceCloneController.js";

const router = express.Router();

// POST /api/voice-clone
router.post("/", cloneVoice);

export default router;
