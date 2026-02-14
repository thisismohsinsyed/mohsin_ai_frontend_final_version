import multer from "multer";
import fs from "fs";
import path from "path";
import asyncHandler from "express-async-handler";
import CloneVoiceUpdateClient from "../services/clonningService/cloneVoiceUpdateClient.js";

// 🧠 Initialize Triton gRPC client once
const tritonClient = new CloneVoiceUpdateClient("173.208.243.146", 9001, "clone_voice_update");

// 📦 Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/**
 * ✅ Upload handler
 * Uploads audio files, triggers Triton model, and saves transcription
 */
export const uploadAudios = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("No files uploaded");
  }

  const results = [];
  const protocol = req.protocol;
  const host = req.get("host");
  const BASE_UPLOAD_URL = `${protocol}://${host}/uploads`;

  for (const file of req.files) {


    try {
      // ✅ Construct file URLs
      const fileUrl = `${BASE_UPLOAD_URL}/${encodeURIComponent(file.originalname)}`;
      const filePath = path.join(process.cwd(), "uploads", file.originalname);


      // 🔥 Call Triton model
      const { voices, transcription } = await tritonClient.infer(fileUrl);


      // 📝 Save transcription into .txt file beside the audio
      const txtPath = `${filePath}.txt`;
      if (transcription && typeof transcription === "string") {
        await fs.promises.writeFile(txtPath, transcription, "utf8");

      }

      // ✅ Build response object
      results.push({
        originalName: file.originalname,
        storedName: file.originalname,
        publicUrl: fileUrl,
        transcriptionUrl: `${fileUrl}.txt`, // 🆕 public link to transcription file
        size: fs.statSync(file.path).size,
        voices,
        transcription,
      });
    } catch (err) {
      console.error(`❌ Error processing ${file.originalname}:`, err.message);
      results.push({
        originalName: file.originalname,
        storedName: file.originalname,
        publicUrl: null,
        transcriptionUrl: null,
        size: file.size,
        voices: null,
        transcription: null,
        error: err.message,
      });
    }
  }

  res.status(200).json({
    message: "✅ Files uploaded and processed successfully.",
    files: results,
  });
});

/**
 * 📜 List all uploaded files
 */
export const listAudios = asyncHandler(async (req, res) => {
  const dir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) return res.json([]);

  const protocol = req.protocol;
  const host = req.get("host");
  const BASE_UPLOAD_URL = `${protocol}://${host}/uploads`;

  const files = fs.readdirSync(dir)
    .filter((filename) => /\.(wav|mp3|ogg|flac)$/i.test(filename))
    .map((filename) => {
      const fileUrl = `${BASE_UPLOAD_URL}/${encodeURIComponent(filename)}`;
      const filePath = path.join(dir, filename);
      const stats = fs.statSync(filePath);

      return {
        filename,
        publicUrl: fileUrl,
        size: stats.size,
        modified: stats.mtime,
      };
    });

  res.status(200).json(files);
});

/**
 * 🗑 Delete a specific audio file
 * DELETE /api/audio/delete?file=<filename>
 */
export const deleteAudio = asyncHandler(async (req, res) => {
  const { file } = req.query;
  if (!file) {
    res.status(400);
    throw new Error("Missing 'file' query parameter");
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  // Security: Prevent path traversal
  const safeName = path.basename(file);
  const filePath = path.join(uploadsDir, safeName);



  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File not found");
  }

  await fs.promises.unlink(filePath);

  // Also delete .txt transcription if exists
  const txtPath = `${filePath}.txt`;
  if (fs.existsSync(txtPath)) {
    await fs.promises.unlink(txtPath);
    console.log(`🗑 Deleted transcription: ${txtPath}`);
  }

  res.status(200).json({
    success: true,
    message: `${file} and its transcription deleted successfully`,
  });
});
