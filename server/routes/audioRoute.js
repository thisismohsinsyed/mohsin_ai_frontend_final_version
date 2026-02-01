import express from "express";
import { upload, uploadAudios, listAudios, deleteAudio } from "../controllers/audioController.js";

const router = express.Router();

router.post("/upload", upload.array("audios", 10), uploadAudios);
router.get("/list", listAudios);
router.delete("/delete", deleteAudio);

export default router;
