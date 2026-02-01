"use client";

import { useEffect, useRef, useState } from "react";

export default function SpeechToText() {
  const [text, setText] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    recognition.onerror = (err) => console.error("ASR error:", err);

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => recognitionRef.current?.start();
  const stopListening = () => recognitionRef.current?.stop();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: "20px",
        padding: "20px"
      }}
    >
      <h2>🎤 Browser Speech-to-Text</h2>

      <div>
        <button
          onClick={startListening}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            marginRight: "10px",
            cursor: "pointer"
          }}
        >
          Start
        </button>

        <button
          onClick={stopListening}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            background: "#ff4d4d",
            color: "#fff"
          }}
        >
          Stop
        </button>
      </div>

      <div
        style={{
          width: "80%",
          maxWidth: "600px",
          minHeight: "120px",
          padding: "15px",
          border: "2px solid #ccc",
          borderRadius: "8px",
          background: "#fafafa",
          whiteSpace: "pre-wrap"
        }}
      >
        {text || "Transcription will appear here..."}
      </div>
    </div>
  );
}
