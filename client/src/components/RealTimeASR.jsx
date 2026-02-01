"use client";

import { useRef, useEffect } from "react";
import { downsampleBuffer, getLinear16 } from "../utils/utils";
import { v4 as uuidv4 } from "uuid";
import { useASR } from "@/contexts/ASRContext";
import { StreamPlayer } from "@/utils/StreamPlayer";
import { usePromptsetting } from "@/contexts/Promptsetting";
import { useAudioContext } from "@/contexts/AudioContext";

const STREAM_SAMPLE_RATE = 16000;
const AUDIO_TARGET_RATE = 8000;
const SPEECH_LEVELS = {
  start: 0.02,
  continue: 0.012,
  silenceMs: 900,
  maxMs: 16000,
};
const RESPONSE_TIMEOUT_MS = 10000;
const USER_IDLE_TIMEOUT_MS = 5000;
const MIN_ACTIVATION_FRAMES = 2;
const BARGE_IN_MULTIPLIER = 4.5;
const BARGE_IN_FRAMES = 10;
const BARGE_IN_MIN_RMS = 0.25;
const BARGE_IN_MIN_DURATION_MS = 1500;

const TURN_STATES = {
  USER_READY: "user_ready",
  USER_SPEAKING: "user_speaking",
  AGENT_PREPARING: "agent_preparing",
  AGENT_SPEAKING: "agent_speaking",
};

export default function RealTimeASR({ onTranscriptionChunk, onBotResponse }) {
  const { listening, startListening, stopListening, setAgentSpeaking, setUserCanSpeak } = useASR();
  const { selectedAudio } = useAudioContext();
  const { initialSentence, systemPrompt } = usePromptsetting();

  const ws = useRef(null);
  const audioContext = useRef(null);
  const microphoneStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const lastChunkRef = useRef("");
  const player = useRef(null);

  const allowUserSpeechRef = useRef(false);
  const speechTrackerRef = useRef({ speaking: false, speechStart: 0, lastVoice: 0, activationFrames: 0 });
  const responseTimeoutRef = useRef(null);
  const userIdleTimeoutRef = useRef(null);
  const bargeFrameCounterRef = useRef(0);
  const sessionActiveRef = useRef(false);
  const listeningRef = useRef(listening);
  const conversationTurnRef = useRef(TURN_STATES.AGENT_SPEAKING);
  const agentSpeakingRef = useRef(false);
  const noiseFloorRef = useRef(0.006);
  const ignoreAgentAudioRef = useRef(false);
  const agentSpeechStartRef = useRef(0);
  const silenceBufferRef = useRef(null);

  const clearResponseTimeout = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  };

  const clearUserIdleTimeout = () => {
    if (userIdleTimeoutRef.current) {
      clearTimeout(userIdleTimeoutRef.current);
      userIdleTimeoutRef.current = null;
    }
  };

  const resetSpeechTracker = () => {
    speechTrackerRef.current = { speaking: false, speechStart: 0, lastVoice: 0, activationFrames: 0 };
  };

  const syncSpeechGate = () => {
    const turn = conversationTurnRef.current;
    const canSpeak =
      listeningRef.current &&
      (turn === TURN_STATES.USER_READY || turn === TURN_STATES.USER_SPEAKING) &&
      !agentSpeakingRef.current;
    allowUserSpeechRef.current = canSpeak;
    setUserCanSpeak(canSpeak);
  };

  const setTurn = (nextTurn) => {
    conversationTurnRef.current = nextTurn;
    if (nextTurn === TURN_STATES.USER_READY) {
      clearUserIdleTimeout();
      userIdleTimeoutRef.current = setTimeout(() => {
        if (
          listeningRef.current &&
          conversationTurnRef.current === TURN_STATES.USER_READY &&
          !speechTrackerRef.current.speaking
        ) {
          setTurn(TURN_STATES.AGENT_PREPARING);
          scheduleAgentResponseFallback();
        }
      }, USER_IDLE_TIMEOUT_MS);
    } else {
      clearUserIdleTimeout();
    }
    syncSpeechGate();
  };

  const scheduleAgentResponseFallback = () => {
    clearResponseTimeout();
    responseTimeoutRef.current = setTimeout(() => {
      if (conversationTurnRef.current === TURN_STATES.AGENT_PREPARING && listeningRef.current) {
        setTurn(TURN_STATES.USER_READY);
      }
    }, RESPONSE_TIMEOUT_MS);
  };

  const updateNoiseFloor = (rms) => {
    const floor = noiseFloorRef.current;
    const clamped = Math.min(rms, 0.2);
    const alpha = clamped > floor ? 0.2 : 0.05;
    noiseFloorRef.current = floor * (1 - alpha) + clamped * alpha;
  };

  const computeRMS = (buffer) => {
    if (!buffer || !buffer.length) return 0;
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const sample = buffer[i];
      sum += sample * sample;
    }
    return Math.sqrt(sum / buffer.length);
  };

  const evaluateSpeechWindow = (rms) => {
    const now = performance.now();
    const tracker = speechTrackerRef.current;
    let ended = false;

    if (!tracker.speaking && rms >= SPEECH_LEVELS.start) {
      tracker.speaking = true;
      tracker.speechStart = now;
      tracker.lastVoice = now;
      tracker.activationFrames = 1;
    } else if (tracker.speaking) {
      tracker.activationFrames = (tracker.activationFrames ?? 1) + 1;
      if (rms >= SPEECH_LEVELS.continue) {
        tracker.lastVoice = now;
      }
      const silence = now - tracker.lastVoice;
      const duration = tracker.speechStart ? now - tracker.speechStart : 0;
      if (silence >= SPEECH_LEVELS.silenceMs || duration >= SPEECH_LEVELS.maxMs) {
        ended = true;
      }
    }

    if (ended) {
      tracker.speaking = false;
      tracker.speechStart = 0;
      tracker.lastVoice = now;
      tracker.activationFrames = 0;
    }

    const frames = tracker.activationFrames ?? 0;
    const shouldSend = tracker.speaking && frames >= MIN_ACTIVATION_FRAMES;

    return { shouldSend, ended };
  };

  const handleBargeIn = () => {
    if (!agentSpeakingRef.current) return;
    agentSpeakingRef.current = false;
    setAgentSpeaking(false);
    ignoreAgentAudioRef.current = true;
    bargeFrameCounterRef.current = 0;
    agentSpeechStartRef.current = 0;
    if (player.current) {
      player.current.stop();
      player.current = null;
    }
    setTurn(TURN_STATES.USER_SPEAKING);
  };

  const transmitBuffer = async (bufferF32, sampleRate) => {
    const downsampledBuffer = downsampleBuffer(bufferF32, sampleRate, AUDIO_TARGET_RATE);
    const raw = await getLinear16(downsampledBuffer);
    ws.current?.send(raw.buffer);
  };

  const processMicrophoneBuffer = async (bufferF32, sampleRate) => {
    const rms = computeRMS(bufferF32);
    const turn = conversationTurnRef.current;

    if (turn === TURN_STATES.AGENT_SPEAKING) {
      const bargeThreshold = Math.max(
        SPEECH_LEVELS.start * BARGE_IN_MULTIPLIER,
        noiseFloorRef.current * 10,
        BARGE_IN_MIN_RMS
      );

      const sustainedAgentAudio = agentSpeechStartRef.current
        ? Date.now() - agentSpeechStartRef.current
        : 0;
      const bargeWindowOpen = sustainedAgentAudio > BARGE_IN_MIN_DURATION_MS;

      if (bargeWindowOpen && rms >= bargeThreshold) {
        bargeFrameCounterRef.current += 1;
        if (bargeFrameCounterRef.current >= BARGE_IN_FRAMES) {
          handleBargeIn();
        }
      } else {
        bargeFrameCounterRef.current = Math.max(bargeFrameCounterRef.current - 1, 0);
        if (!bargeWindowOpen) {
          updateNoiseFloor(rms);
        }
      }
      return;
    }

    bargeFrameCounterRef.current = 0;
    const { shouldSend, ended } = evaluateSpeechWindow(rms);

    const canSpeak =
      listeningRef.current &&
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      (turn === TURN_STATES.USER_READY || turn === TURN_STATES.USER_SPEAKING);

    if (!canSpeak) {
      if (!speechTrackerRef.current.speaking) updateNoiseFloor(rms);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        if (!silenceBufferRef.current || silenceBufferRef.current.length !== bufferF32.length) {
          silenceBufferRef.current = new Float32Array(bufferF32.length);
        }
        await transmitBuffer(silenceBufferRef.current, sampleRate);
      }
      return;
    }

    if (!shouldSend) {
      if (!speechTrackerRef.current.speaking) updateNoiseFloor(rms);
      return;
    }

    if (conversationTurnRef.current !== TURN_STATES.USER_SPEAKING) {
      setTurn(TURN_STATES.USER_SPEAKING);
    }

    await transmitBuffer(bufferF32, sampleRate);

    if (ended) {
      setTurn(TURN_STATES.AGENT_PREPARING);
      scheduleAgentResponseFallback();
    }
  };

  const disconnectMicrophone = () => {
    if (recorderRef.current) {
      recorderRef.current.disconnect();
      recorderRef.current = null;
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
  };

  const stopASRSession = () => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;
    clearResponseTimeout();
    clearUserIdleTimeout();

    if (silenceBufferRef.current) {
      silenceBufferRef.current = null;
    }

    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onmessage = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      try {
        ws.current.close();
      } catch (err) {
        console.warn("WebSocket close error:", err);
      }
      ws.current = null;
    }

    disconnectMicrophone();

    if (player.current) {
      player.current.stop();
      player.current = null;
    }

    allowUserSpeechRef.current = false;
    resetSpeechTracker();
    setAgentSpeaking(false);
    setUserCanSpeak(false);
    agentSpeakingRef.current = false;
    ignoreAgentAudioRef.current = false;
    agentSpeechStartRef.current = 0;
  };

  const attachMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });
    microphoneStreamRef.current = stream;

    audioContext.current = new AudioContext();
    const audioInput = audioContext.current.createMediaStreamSource(stream);

    await audioContext.current.audioWorklet.addModule("/worklet/script-processor.js");
    recorderRef.current = new AudioWorkletNode(audioContext.current, "script-processor");

    const highPass = audioContext.current.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 120;

    const compressor = audioContext.current.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    recorderRef.current.port.onmessage = (e) => {
      const context = audioContext.current;
      if (!context) return;
      processMicrophoneBuffer(e.data, context.sampleRate);
    };

    const silentGain = audioContext.current.createGain();
    silentGain.gain.value = 0;

    audioInput.connect(highPass);
    highPass.connect(compressor);
    compressor.connect(recorderRef.current);
    recorderRef.current.connect(silentGain);
    silentGain.connect(audioContext.current.destination);
  };

  const createStreamPlayer = () =>
    new StreamPlayer(STREAM_SAMPLE_RATE, {
      onPlaybackStart: () => {
        clearResponseTimeout();
        agentSpeakingRef.current = true;
        setAgentSpeaking(true);
        setTurn(TURN_STATES.AGENT_SPEAKING);
        ignoreAgentAudioRef.current = false;
        agentSpeechStartRef.current = Date.now();
      },
      onPlaybackComplete: () => {
        agentSpeakingRef.current = false;
        setAgentSpeaking(false);
        resetSpeechTracker();
        setTurn(TURN_STATES.USER_READY);
        agentSpeechStartRef.current = 0;
      },
    });

  const startASRSession = async () => {
    if (sessionActiveRef.current) return;
    sessionActiveRef.current = true;
    startListening();
    listeningRef.current = true;
    resetSpeechTracker();
    clearResponseTimeout();
    clearUserIdleTimeout();

    const params = new URLSearchParams();
    if (selectedAudio?.url) params.set("audioUrl", selectedAudio.url);
    if (initialSentence) params.set("initialSentence", initialSentence);
    if (systemPrompt) params.set("systemPrompt", systemPrompt);
    const queryString = params.toString();
    const wsUrl = `wss://callcenterprofessionals.info/ws/${uuidv4()}/${uuidv4()}/init/sessionstart${
      queryString ? `?${queryString}` : ""
    }`;

    ws.current = new WebSocket(wsUrl);
    ws.current.binaryType = "arraybuffer";

    ws.current.onopen = async () => {
      try {
        player.current = createStreamPlayer();
        await attachMicrophone();
        const startsWithAgent = Boolean(initialSentence?.trim());
        setTurn(startsWithAgent ? TURN_STATES.AGENT_SPEAKING : TURN_STATES.USER_READY);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        stopASRSession();
        stopListening();
      }
    };

    ws.current.onmessage = async (event) => {
      try {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);

          if (data.transcription && data.transcription !== lastChunkRef.current) {
            lastChunkRef.current = data.transcription;
            onTranscriptionChunk(data.transcription);
          }

          if (data.bot_response) {
            ignoreAgentAudioRef.current = false;
            setTurn(TURN_STATES.AGENT_PREPARING);
            scheduleAgentResponseFallback();
            onBotResponse(data.bot_response);
          }
        } else if (event.data instanceof ArrayBuffer) {
          if (!ignoreAgentAudioRef.current) {
            if (!player.current) {
              player.current = createStreamPlayer();
            }
            player.current.feed(new Int8Array(event.data));
          }
        } else if (event.data instanceof Blob) {
          if (!ignoreAgentAudioRef.current) {
            const arrayBuffer = await event.data.arrayBuffer();
            if (!player.current) {
              player.current = createStreamPlayer();
            }
            player.current.feed(new Int8Array(arrayBuffer));
          }
        }
      } catch (err) {
        console.error("Error handling ASR message:", event.data, err);
      }
    };

    ws.current.onclose = () => {
      stopASRSession();
      stopListening();
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket error:", e);
      stopASRSession();
      stopListening();
    };
  };

  useEffect(() => {
    listeningRef.current = listening;
    if (!listening) {
      allowUserSpeechRef.current = false;
      setUserCanSpeak(false);
      setAgentSpeaking(false);
      agentSpeakingRef.current = false;
      ignoreAgentAudioRef.current = false;
      setTurn(TURN_STATES.AGENT_SPEAKING);
    }
  }, [listening, setAgentSpeaking, setUserCanSpeak]);

  useEffect(() => {
    if (!listening) {
      return;
    }

    startASRSession();

    return () => {
      stopASRSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  useEffect(() => {
    return () => {
      stopASRSession();
    };
  }, []);

  return null;
}
