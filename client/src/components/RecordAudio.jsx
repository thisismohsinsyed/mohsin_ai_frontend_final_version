"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, UploadCloud, Trash2, Loader2 } from "lucide-react";
import { audioBufferToWav, generateAudioFileName } from "@/lib/utils";
import { sentence } from "txtgen"; // ✅ random text generator
import { useAudioContext } from "@/contexts/AudioContext"; // ✅ import shared context

export default function RecordAudio() {
  const [isRecording, setIsRecording] = useState(false);
  const [clip, setClip] = useState(null);
  const [recordTime, setRecordTime] = useState(0);
  const [warning, setWarning] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [promptText, setPromptText] = useState(""); // ✅ sentence to read

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const { addAudio } = useAudioContext(); // ✅ access context method to update global list

  // Generate a random readable sentence (~10 seconds)
  const generatePrompt = () => sentence();

  // Convert recorded WebM blob → 16 kHz PCM WAV Blob
  const convertBlobToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const wavBlob = await audioBufferToWav(audioBuffer);
      return wavBlob;
    } finally {
      audioContext.close();
    }
  };

  // Get duration in seconds
  const getDuration = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer.duration;
    } finally {
      audioContext.close();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      return;
    }

    // ✅ Show a random sentence before starting
    setPromptText(generatePrompt());

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) =>
      audioChunksRef.current.push(e.data);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = await getDuration(blob);

        if (duration < 9 || duration > 20) {
          setWarning("Audio must be between 9 and 20 seconds.");
          return;
        }
        setWarning("");

        const wavBlob = await convertBlobToWav(blob);
        const fileName = generateAudioFileName();
        const url = URL.createObjectURL(wavBlob);

        setClip({
          blob: wavBlob,
          url,
          name: fileName,
          duration,
        });
      } catch (err) {
        console.error("❌ Error processing audio:", err);
        setWarning("Unable to process recorded audio.");
      }
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordTime(0);

    timerRef.current = setInterval(() => {
      setRecordTime((t) => {
        if (t >= 20) {
          mediaRecorderRef.current.stop();
          clearInterval(timerRef.current);
          return 20;
        }
        return t + 0.1;
      });
    }, 100);
  };

  const handleUpload = async () => {
    if (!clip?.blob) {
      alert("No audio to upload!");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("audios", clip.blob, clip.name);

      const res = await fetch("https://callcenterprofessionals.info/api/audio/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      console.log("✅ Upload response:", data);

      // ✅ Update global context so other pages refresh automatically
      addAudio(clip.name);

      setUploadMessage("✅ Uploaded successfully!");
      setClip(null);
      setPromptText(""); // clear prompt
      setTimeout(() => setUploadMessage(""), 3000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setUploadMessage("❌ Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteClip = () => {
    setClip(null);
    setWarning("");
    setRecordTime(0);
  };

  return (
    <div className="flex flex-col items-center border border-gray-200 rounded-lg p-6 h-full overflow-y-auto space-y-3">
      {/* Prompt */}
      {promptText && (
        <div className="mb-2 bg-gray-50 border border-gray-200 p-3 rounded-lg w-full text-center text-gray-700 text-sm">
          <p className="italic text-gray-500 mb-1">Read this aloud:</p>
          <p className="font-medium text-gray-800 text-xs leading-relaxed">
            {promptText}
          </p>
        </div>
      )}

      {/* Record Button */}
      <Button
        onClick={toggleRecording}
        size="lg"
        className={`flex items-center gap-3 text-white px-6 py-3 rounded-full shadow-md transition-all ${
          isRecording ? "bg-rose-600 animate-pulse" : "bg-black hover:bg-gray-800"
        }`}
      >
        <Mic className="w-5 h-5" />
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>

      {/* Timer Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
        <div
          className="h-2 bg-black rounded-full transition-all"
          style={{ width: `${(recordTime / 20) * 100}%` }}
        ></div>
      </div>
      <p className="mt-1 text-xs text-gray-600">{recordTime.toFixed(1)}s / 20s</p>

      {warning && <p className="text-red-600 text-xs mt-1">{warning}</p>}

      {/* Recorded Clip */}
      {clip && (
        <div className="mt-3 w-full bg-gray-100 rounded-lg p-2">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs truncate">{clip.name}</p>
            <Button variant="ghost" size="sm" onClick={deleteClip}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
          <audio controls src={clip.url} className="w-full mt-1" />
          <p className="text-[10px] text-gray-600">{clip.duration.toFixed(1)}s</p>
        </div>
      )}

      {/* Upload Button */}
      {clip && (
        <div className="flex justify-center mt-3">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full shadow-md text-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" /> Upload
              </>
            )}
          </Button>
        </div>
      )}

      {/* Upload Feedback */}
      {uploadMessage && (
        <p className="text-center text-xs mt-2 text-gray-800">{uploadMessage}</p>
      )}
    </div>
  );
}
