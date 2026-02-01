"use client";

import React, { createContext, useContext, useState } from "react";

const ASRContext = createContext();

export const ASRProvider = ({ children }) => {
  const [listening, setListening] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userCanSpeak, setUserCanSpeak] = useState(false);

  const startListening = () => setListening(true);
  const stopListening = () => setListening(false);
  const toggleListening = () => setListening((prev) => !prev);

  return (
    <ASRContext.Provider
      value={{
        listening,
        startListening,
        stopListening,
        toggleListening,
        agentSpeaking,
        setAgentSpeaking,
        userCanSpeak,
        setUserCanSpeak,
      }}
    >
      {children}
    </ASRContext.Provider>
  );
};

export const useASR = () => {
  const context = useContext(ASRContext);
  if (!context) throw new Error("useASR must be used within ASRProvider");
  return context;
};
