"use client";

import React, { createContext, useContext, useState } from "react";

const SystemSettingsContext = createContext();

export const SystemSettingsProvider = ({ children }) => {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant that provides concise, clear, and friendly responses."
  );
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState("mistral-7b-instruct-v0.3");

  // Model options
  const modelOptions = [
    { value: "mistral-7b-instruct-v0.3", label: "Mistral-7B-Instruct-v0.3" },
    { value: "gpt-oss-20b", label: "GPT-OSS 20B (coming soon)", disabled: true },
  ];

  return (
    <SystemSettingsContext.Provider
      value={{
        systemPrompt,
        setSystemPrompt,
        temperature,
        setTemperature,
        model,
        setModel,
        modelOptions,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) throw new Error("useSystemSettings must be used within SystemSettingsProvider");
  return context;
};
