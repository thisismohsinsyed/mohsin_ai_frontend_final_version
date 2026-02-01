"use client";

import { useState, useRef, useEffect } from "react";
import { User, Cpu, Mic, PlayCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RealTimeASR from "@/components/RealTimeASR";
import { useASR } from "@/contexts/ASRContext";
import { useAudioContext } from "@/contexts/AudioContext"; // global audio list
import { CALL_STAGE_BLUEPRINT } from "@/data/callStages";

const MAX_VISIBLE_MESSAGES = 60;

export default function VoiceChat({ initialMessage, className, currentStageId, onConversationUpdate }) {
  const [messages, setMessages] = useState([]);
  const [hasInjectedInitial, setHasInjectedInitial] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const { listening, toggleListening, agentSpeaking, userCanSpeak } = useASR();

  const previewAudioRef = useRef(null);

  // ✅ From context
  const { audios, selectedAudio, setSelectedAudio } = useAudioContext();

  const normalizeText = (value) => (value ?? "").replace(/\s+/g, " ").trim();
  const normalizedInitialMessage = normalizeText(initialMessage);

  const chatContainerRef = useRef(null);
  const isAutoScroll = useRef(true);
  const activeStageIndex = CALL_STAGE_BLUEPRINT.findIndex((stage) => stage.id === currentStageId);
  const stageBadgeClass = (stageId, index) => {
    if (!currentStageId) {
      return "bg-slate-50 text-slate-500 border border-slate-200";
    }
    if (stageId === currentStageId) {
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    }
    if (activeStageIndex !== -1 && index < activeStageIndex) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }
    return "bg-slate-50 text-slate-500 border border-slate-200";
  };

  const sessionStatus = (() => {
    if (!listening) {
      return { label: "Session idle", tone: "bg-gray-100 text-gray-600 border border-gray-200" };
    }
    if (agentSpeaking) {
      return { label: "Agent responding", tone: "bg-rose-50 text-rose-600 border border-rose-100" };
    }
    if (userCanSpeak) {
      return { label: "Your turn to speak", tone: "bg-emerald-50 text-emerald-600 border border-emerald-100" };
    }
    return { label: "Waiting for agent", tone: "bg-amber-50 text-amber-600 border border-amber-100" };
  })();

  const sessionHint = !listening
    ? "Tap start to initiate a live session."
    : agentSpeaking
      ? "Hang tight while the agent finishes speaking."
      : userCanSpeak
        ? "You have the floor - start speaking when you're ready."
        : "Waiting for the agent's audio to begin.";

  // ?o. Scroll detection to manage auto-scroll
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAutoScroll.current = nearBottom;
  };

  // ✅ Smooth scroll to bottom when new messages arrive

  useEffect(() => {
    setHasInjectedInitial(false);
    setMessages([]);
  }, [initialMessage]);

  useEffect(() => {
    if (!listening) {
      setHasInjectedInitial(false);
      setMessages([]);
      return;
    }
    if (normalizedInitialMessage && !hasInjectedInitial) {
      setMessages([{ role: "bot", text: initialMessage }]);
      setHasInjectedInitial(true);
    }
  }, [listening, normalizedInitialMessage, initialMessage, hasInjectedInitial]);

  useEffect(() => {
    if (!messages.length) return;
    if (isAutoScroll.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);


  useEffect(() => {
    onConversationUpdate?.(messages);
  }, [messages, onConversationUpdate]);


  const handleTranscriptionChunk = (transcription) => {
    const normalized = normalizeText(transcription);
    if (!normalized) return;
    setMessages((prev) => [...prev, { role: "human", text: transcription }].slice(-MAX_VISIBLE_MESSAGES));
  };

  const handleBotResponse = (botResponse) => {
    const normalizedBot = normalizeText(botResponse);
    if (normalizedInitialMessage && normalizedBot === normalizedInitialMessage) {
      if (hasInjectedInitial) return;
      setHasInjectedInitial(true);
      return;
    }
    setMessages((prev) =>
      [...prev, { role: "bot", text: botResponse }].slice(-MAX_VISIBLE_MESSAGES)
    );
  };

  // ✅ Stop preview if selected audio changes
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
  }, [selectedAudio]);

  return (
    <Card className={`bg-white border border-gray-200 shadow-xl rounded-2xl text-gray-800 h-full min-h-0 flex flex-col relative overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
            Voice Chat
          </CardTitle>
          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${sessionStatus.tone}`}>
            {sessionStatus.label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CALL_STAGE_BLUEPRINT.map((stage, index) => (
            <span
              key={stage.id}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${stageBadgeClass(stage.id, index)}`}
            >
              {stage.id}
            </span>
          ))}
        </div>


        {/* ?o. Instruction + Audio Selector */}
        <div className="mt-2 space-y-2">
          <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2 text-center">
            <strong>Select the audio you want to clone</strong> before starting your conversation.
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAudio?.name || ""}
              onChange={(e) => {
                const chosen = audios.find((a) => a.name === e.target.value);
                setSelectedAudio(chosen || null);
              }}
              disabled={listening}
            >
              {audios.length === 0 ? (
                <option value="">No audios available</option>
              ) : (
                audios.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))
              )}
            </select>

            {selectedAudio && (
              <Button
                size="sm"
                variant={isPlayingPreview ? "destructive" : "outline"}
                className="flex items-center gap-1"
                onClick={() => {
                  if (isPlayingPreview) {
                    previewAudioRef.current?.pause();
                    previewAudioRef.current = null;
                    setIsPlayingPreview(false);
                  } else {
                    if (previewAudioRef.current) previewAudioRef.current.pause();
                    const audio = new Audio(selectedAudio.url);
                    audio.onended = () => setIsPlayingPreview(false);
                    audio.play();
                    previewAudioRef.current = audio;
                    setIsPlayingPreview(true);
                  }
                }}
                disabled={listening}
              >
                {isPlayingPreview ? <Square className="w-3 h-3 fill-current" /> : <PlayCircle className="w-4 h-4" />}
                {isPlayingPreview ? "Stop" : "Play"}
              </Button>
            )}
            {listening && (
              <p className="text-[11px] text-gray-500">
                Voice selection locked during an active session.
              </p>
            )}
          </div>
          </div>
        </div>
      </CardHeader>

      {/* ✅ Chat Area */}
      <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden pt-2">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-3 custom-scrollbar"
        >
          {messages.length === 0 && (
            <p className="text-gray-500 text-center mt-6">
              Start speaking or select an audio above to begin your cloned voice chat...
            </p>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-xl max-w-[80%] text-sm leading-relaxed ${msg.role === "human"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-200 text-gray-800"
                }`}
            >
              {msg.role === "human" ? (
                <User className="w-4 h-4 mt-1 flex-shrink-0" />
              ) : (
                <Cpu className="w-4 h-4 mt-1 flex-shrink-0" />
              )}
              <p className="break-words">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* 🎙 Sticky Mic Button */}
        <div className="mt-3 flex flex-col items-center gap-2 bg-white pt-3 pb-2 border-t border-gray-200 shrink-0">
          <Button
            onClick={toggleListening}
            size="lg"
            className={`flex items-center gap-2 text-white px-6 py-3 rounded-full shadow-md transition-transform ${listening
              ? "bg-rose-600 hover:bg-rose-500 animate-pulse scale-105"
              : "bg-blue-600 hover:bg-blue-500 hover:scale-105"
              }`}
          >
            <Mic className="w-5 h-5" />
            {listening ? "Stop Listening" : "Start Listening"}
          </Button>
          <p className="text-xs text-gray-500 text-center" aria-live="polite">
            {sessionHint}
          </p>
        </div>
      </CardContent>

      {/* 🎧 Real-time transcription handler */}
      <RealTimeASR
        onTranscriptionChunk={handleTranscriptionChunk}
        onBotResponse={handleBotResponse}
      />
    </Card>
  );
}
