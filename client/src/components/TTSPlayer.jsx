// components/TTSPlayer.js
"use client";

import { useEffect, useRef } from "react";

const TTSPlayer = ({ text, ttsModel, ttsSpeed = 1, ttsPitch = 1, listening, onEnd }) => {
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = ttsSpeed;
    utterance.pitch = ttsPitch;

    // Placeholder for different TTS engines
    if (ttsModel === "f5-tts") {
      utterance.text = text; // Replace with actual F5-TTS API call if needed
    } else if (ttsModel === "web-tts") {
      utterance.text = text;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, ttsModel, ttsSpeed, ttsPitch]);

  return null; // Invisible component
};

export default TTSPlayer;
