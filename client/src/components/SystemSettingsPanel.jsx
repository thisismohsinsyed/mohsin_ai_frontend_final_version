"use client";

import React from "react";
import { Settings } from "lucide-react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";

const SystemSettingsPanel = ({ disabled = false }) => {
  const {
    systemPrompt,
    setSystemPrompt,
    temperature,
    setTemperature,
    model,
    setModel,
    modelOptions,
  } = useSystemSettings();

  return (
    <div
      className={`w-96 bg-purple-800 p-6 flex flex-col gap-6 rounded-l-3xl shadow-lg transition-opacity ${
        disabled ? "opacity-60 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-white">
        <span className="font-semibold text-lg">Settings</span>
        <Settings className="w-5 h-5" />
      </div>

      {/* System Prompt */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-gray-300">System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Set system prompt..."
          rows={5}
          className="w-full p-3 rounded-lg border border-gray-600 bg-purple-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none shadow-inner"
          disabled={disabled}
        />
      </div>

      {/* Temperature */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">
          Temperature: {temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full accent-purple-500"
          disabled={disabled}
        />
      </div>

      {/* Model Selection */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-300">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full p-2 rounded-lg bg-purple-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
          disabled={disabled}
        >
          {modelOptions.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SystemSettingsPanel;
