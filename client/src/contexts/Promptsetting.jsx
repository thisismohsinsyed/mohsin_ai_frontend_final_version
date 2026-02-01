"use client";

import { createContext, useContext, useState } from "react";
import { generalTemplate } from "@/components/General";

const PromptsettingContext = createContext(null);

export const PromptsettingProvider = ({ children }) => {
  const [initialSentence, setInitialSentence] = useState(generalTemplate.initialSentence);
  const [systemPrompt, setSystemPrompt] = useState(generalTemplate.systemPrompt);

  return (
    <PromptsettingContext.Provider
      value={{ initialSentence, systemPrompt, setInitialSentence, setSystemPrompt }}
    >
      {children}
    </PromptsettingContext.Provider>
  );
};

export const usePromptsetting = () => {
  const context = useContext(PromptsettingContext);
  if (!context) throw new Error("usePromptsetting must be used within PromptsettingProvider");
  return context;
};
