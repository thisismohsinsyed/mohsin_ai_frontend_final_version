"use client";

import React from "react";
import { Speaker } from "lucide-react";
import { useTTS } from "@/contexts/TTSContext";

const TTSSettingsPanel = ({ disabled = false }) => {
  const { ttsModel, setTtsModel, ttsSpeed, setTtsSpeed, ttsPitch, setTtsPitch } = useTTS();

  // Define TTS options here
  const ttsOptions = [
    { value: "web-tts", label: "Web-TTS" },
    { value: "f5-tts", label: "F5-TTS (not available)", disabled: true },
  ];

  return (
    <div
      className={`w-96 bg-purple-800 p-6 flex flex-col gap-6 rounded-l-3xl shadow-lg transition-opacity ${
        disabled ? "opacity-60 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-white">
        <span className="font-semibold text-lg">TTS Settings</span>
        <Speaker className="w-5 h-5" />
      </div>

      {/* TTS Model */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">TTS Model</label>
        <select
          value={ttsModel}
          onChange={(e) => setTtsModel(e.target.value)}
          className="w-full p-2 rounded-lg bg-purple-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
          disabled={disabled}
        >
          {ttsOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Speed */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">Speed: {ttsSpeed}</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={ttsSpeed}
          onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
          className="w-full accent-purple-500"
          disabled={disabled}
        />
      </div>

      {/* Pitch */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">Pitch: {ttsPitch}</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={ttsPitch}
          onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
          className="w-full accent-purple-500"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default TTSSettingsPanel;
