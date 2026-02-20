import { WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import url from "url";

import next from "next";




dotenv.config();

import { errorHandler } from "./middleware/errorMiddleware.js";
import ASRStreamSession from "./services/speech_to_text/speecth_to_text.js";
import llmRoutes from "./routes/llmRoute.js";
import audioRoutes from "./routes/audioRoute.js"


// Next.js setup
const dev = false; // since we are using production build
const nextApp = next({ dev, dir: "../client" }); // path to your Next.js app
const handle = nextApp.getRequestHandler();


const port = 3000;
const host = "0.0.0.0";





// Create Express app  
const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(cors({ origin: true, credentials: true }));

// Routes
app.use("/api/llm", llmRoutes);
app.use("/api/audio", audioRoutes);


app.use(errorHandler);


const server = app.listen(port, host, () => {
  console.log(`Server is listening at http://${host}:${port}`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });
wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection");
  const { pathname, query } = url.parse(req.url, true);
  console.log(`New WebSocket connection at ${pathname}`);

  // Example: /websocket/uuid/caller/init/sessionstart
  const parts = pathname.split("/").filter(Boolean);
  const uuid = parts[1];
  const caller = parts[2];

  console.log({ uuid, caller });
  const initialSentence = "Hello, my name is Alicia your digital assistant. I'm here to ask you a few quick questions to see if you qualify for a free and thorough consultation.   May I ask who I am speaking with today?";
  const promptSettings = { initialSentence };

  const session = new ASRStreamSession(uuid, caller, null, promptSettings);
  session.processWebSocket(ws);
});

