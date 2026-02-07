import { WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import url from "url";
import next from "next";

import voiceCloneRoute from "./routes/voiceCloneRoute.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import ASRStreamSession from "./services/speech_to_text/speecth_to_text.js";
import llmRoutes from "./routes/llmRoute.js";
import audioRoutes from "./routes/audioRoute.js";
import templateRoutes from "./routes/templateRoute.js";

dotenv.config();

const dev = (process.env.NODE_ENV || '').trim() !== 'production';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../client');
const nextApp = next({ dev, dir: clientDir });
const handle = nextApp.getRequestHandler();

const port = 3000;
const host = "0.0.0.0";

nextApp.prepare().then(() => {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: false }));
  app.use(cors({ origin: true, credentials: true }));

  // Serve Next.js static files with proper MIME types
  app.use('/_next/static', express.static(path.join(clientDir, '.next/static'), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.woff2')) {
        res.setHeader('Content-Type', 'font/woff2');
      } else if (filePath.endsWith('.woff')) {
        res.setHeader('Content-Type', 'font/woff');
      }
    }
  }));

  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  app.use("/api/llm", llmRoutes);
  app.use("/api/audio", audioRoutes);
  app.use("/api/voice-clone", voiceCloneRoute);
  app.use("/api/templates", templateRoutes);  // Express-handled template routes

  app.use(errorHandler);

  // Log all requests to trace routing issues
  app.use((req, res, next) => {
    console.log(`[Express] ${req.method} ${req.url}`);
    next();
  });

  app.all(/.*/, (req, res) => handle(req, res));

  const server = app.listen(port, host, () => {
    console.log(`Server is listening at http://${host}:${port}`);
  });

  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    const { pathname, query } = url.parse(req.url, true);
    const parts = pathname.split("/").filter(Boolean);
    const uuid = parts[1];
    const caller = parts[2];

    const audioUrl = query.audioUrl ? decodeURIComponent(query.audioUrl) : null;
    const systemPrompt = query.systemPrompt ? decodeURIComponent(query.systemPrompt) : null;
    const initialSentence = query.initialSentence ? decodeURIComponent(query.initialSentence) : null;

    if (audioUrl) {
      console.log("Selected reference audio:", audioUrl);
    } else {
      console.log("No reference audio provided.");
    }

    if (systemPrompt) {
      console.log("Received system prompt (truncated):", systemPrompt.slice(0, 80));
    }
    if (initialSentence) {
      console.log("Initial sentence:", initialSentence);
    }

    const promptSettings = { systemPrompt, initialSentence };
    const session = new ASRStreamSession(uuid, caller, audioUrl, promptSettings);
    session.processWebSocket(ws);
  });
});
