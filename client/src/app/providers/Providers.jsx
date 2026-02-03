"use client";

import React from "react";
import { PromptsettingProvider } from "@/contexts/Promptsetting";
import { SystemSettingsProvider } from "@/contexts/SystemSettingsContext";
import { ASRProvider } from "@/contexts/ASRContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { Toaster } from "@/components/ui/sonner";

const Providers = ({ children }) => {
  return (
    <AudioProvider>
      <ASRProvider>
        <SystemSettingsProvider>
          <PromptsettingProvider>
            {children}
            <Toaster />
          </PromptsettingProvider>
        </SystemSettingsProvider>
      </ASRProvider>
    </AudioProvider>
  );
};

export default Providers;
