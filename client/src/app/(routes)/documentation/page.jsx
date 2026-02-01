"use client";

import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const DocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("python");

  // --- Updated Python Example ---
  const pythonExample = `import asyncio
import websockets
import numpy as np
import sounddevice as sd
import json
import uuid

SAMPLE_RATE = 8000
FRAME_DURATION = 0.04
FRAME_SAMPLES = int(SAMPLE_RATE * FRAME_DURATION)

def int16_to_bytes(samples: np.ndarray) -> bytes:
    return samples.astype(np.int16).tobytes()

async def send_audio(ws):
    with sd.InputStream(channels=1, samplerate=SAMPLE_RATE, dtype='int16') as stream:
        try:
            while True:
                frame, _ = stream.read(FRAME_SAMPLES)
                await ws.send(int16_to_bytes(frame.flatten()))
                await asyncio.sleep(FRAME_DURATION)
        except asyncio.CancelledError:
            print("Audio sending stopped.")

async def receive_messages(ws):
    try:
        async for message in ws:
            data = json.loads(message)
            if "audioUrl" in data:
                print("Voicemail saved at:", data["audioUrl"])
            if "class" in data:
                print("Class:", data["class"])
            if "transcription" in data:
                print("Transcription:", data["transcription"])
    except asyncio.CancelledError:
        print("Message receiving stopped.")

async def main():
    session_uuid = str(uuid.uuid4())
    caller = "username"
    uri = f"wss://thegoodnews360.com/ws/{session_uuid}/{caller}/init/sessionstart"
    
    async with websockets.connect(uri) as ws:
        send_task = asyncio.create_task(send_audio(ws))
        recv_task = asyncio.create_task(receive_messages(ws))
        try:
            await asyncio.gather(send_task, recv_task)
        except KeyboardInterrupt:
            send_task.cancel()
            recv_task.cancel()
            await asyncio.gather(send_task, recv_task, return_exceptions=True)

if __name__ == "__main__":
    asyncio.run(main())`;

  // --- Updated Node Example ---
  const nodeExample = `import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

const FRAME_DURATION_MS = 40;
const FRAME_SAMPLES = 320;

function generateAudioFrame() {
  return Buffer.alloc(FRAME_SAMPLES * 2);
}

const session_uuid = uuidv4();
const caller = "username";
const ws = new WebSocket(\`wss://thegoodnews360.com/ws/\${session_uuid}/\${caller}/init/sessionstart\`);

ws.on("open", () => {
  console.log("Connected");

  const sendInterval = setInterval(() => {
    ws.send(generateAudioFrame());
  }, FRAME_DURATION_MS);

  process.on("SIGINT", () => {
    clearInterval(sendInterval);
    ws.close();
    console.log("Stopped streaming.");
    process.exit();
  });
});

ws.on("message", (msg) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.audioUrl) console.log("Voicemail saved at:", data.audioUrl);
    if (data.class) console.log("Class:", data.class);
    if (data.transcription) console.log("Transcription:", data.transcription);
  } catch {
    console.log("Received message:", msg.toString());
  }
});

ws.on("close", () => console.log("Connection closed"));`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 prose prose-slate">
      <h1 className="text-4xl font-bold mb-4">🎙️ Real-Time ASR WebSocket Documentation</h1>
      <p className="text-gray-700 mb-6">
        Connect to the ASR WebSocket server, stream audio in real-time, receive live transcriptions, classification results, and a saved voicemail recording.  
        The session UUID and caller are included directly in the WebSocket URL.
      </p>

      <section className="mb-8">
        <h2>Overview</h2>
        <p>
          The server supports <strong>real-time streaming</strong> of 8 kHz mono PCM audio frames.  
          Connect to the server using a WebSocket URL that includes a unique session UUID and caller ID.  
          Stream audio continuously, and the server will respond with <code>transcription</code>, <code>class</code>, and <code>audioUrl</code>.
        </p>
      </section>

      <section className="mb-8">
        <h2>Connection Flow</h2>
        <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
{`Client connects (with /ws/<uuid>/<caller>/init/sessionstart)
      │
      ▼
Stream audio frames (PCM16, mono, 8kHz, 40ms each)
      │
      ▼
Server sends messages with:
  - "transcription": recognized text
  - "class": detected intent or category
      │
      ▼
Session ends with:
  - "audioUrl": URL of recorded voicemail`}
        </pre>
      </section>

      <section className="mb-8">
        <h2>WebSocket Endpoint</h2>
        <pre className="bg-gray-100 p-4 rounded-md">
          <code>wss://thegoodnews360.com/ws/&lt;uuid&gt;/&lt;caller&gt;/init/sessionstart</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2>Streaming Examples</h2>
        <div className="flex gap-4 mb-2">
          <button
            onClick={() => setActiveTab("python")}
            className={`px-4 py-2 rounded-t-lg font-medium ${
              activeTab === "python" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Python
          </button>
          <button
            onClick={() => setActiveTab("node")}
            className={`px-4 py-2 rounded-t-lg font-medium ${
              activeTab === "node" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Node.js
          </button>
        </div>
        <SyntaxHighlighter
          language={activeTab === "python" ? "python" : "javascript"}
          style={oneDark}
          className="rounded-b-lg"
        >
          {activeTab === "python" ? pythonExample : nodeExample}
        </SyntaxHighlighter>
      </section>

      <section className="mb-8">
        <h2>Example Server Response</h2>
        <SyntaxHighlighter language="json" style={oneDark}>
{`{
  "transcription": "recognized text",
  "class": "detected-intent-or-category",
  "audioUrl": "https://thegoodnews360.com/uploads/session_123.wav"
}`}
        </SyntaxHighlighter>
      </section>

      <section className="mb-8">
        <h2>💡 Tips & Troubleshooting</h2>
        <ul>
          <li><strong>No transcription?</strong> Ensure your audio is PCM16, mono, 8kHz.</li>
          <li><strong>Connection closes?</strong> Make sure you are using the correct WebSocket URL format.</li>
          <li><strong>Multiple sessions?</strong> Generate a new <code>uuid</code> for each session to avoid overwriting recordings.</li>
        </ul>
      </section>
    </div>
  );
};

export default DocumentationPage;
