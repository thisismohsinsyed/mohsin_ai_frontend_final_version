"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Loader2, Trash2, FileAudio, CheckCircle2, AlertCircle } from "lucide-react";
import { audioBufferToWav, sanitizeFileName } from "@/lib/utils";
import { useAudioContext } from "@/contexts/AudioContext";
import { cn } from "@/lib/utils";

export default function UploadAudio() {
  const [file, setFile] = useState(null);
  const [warning, setWarning] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { addAudio } = useAudioContext();

  // --- Audio Logic ---

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

  const validateAndSetFile = async (f) => {
    // 1. Type Check
    if (!f.type.startsWith("audio/")) {
      setWarning("Invalid format. Please select an audio file (MP3, WAV, M4A, etc).");
      return;
    }

    // 2. Duration Check
    try {
      const duration = await getDuration(f);
      if (duration < 9 || duration > 20) {
        setWarning("Duration must be betweeen 9 and 20 seconds.");
        return;
      }
      // Success
      setWarning("");
      setFile({ file: f, url: URL.createObjectURL(f), name: f.name });
      setMsg("");
    } catch (err) {
      console.error("❌ Error reading file:", err);
      setWarning("Unable to read audio file. It might be corrupted.");
    }
  };

  // --- Handlers ---

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) validateAndSetFile(f);
    e.target.value = ""; // reset input
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setMsg("");
    setWarning("");

    try {
      // Decode
      const arrayBuffer = await file.file.arrayBuffer();
      const audioContext = new AudioContext();
      let audioBuffer;
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } finally {
        audioContext.close();
      }

      // Convert
      const wavBlob = await audioBufferToWav(audioBuffer);
      const originalName = file.file.name;
      const baseName = originalName.replace(/\.[^/.]+$/, "");
      const sanitizedBase = sanitizeFileName(baseName);
      const wavName = `${sanitizedBase}.wav`;

      // Upload via Proxy
      const formData = new FormData();
      formData.append("audios", wavBlob, wavName);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://callcenterprofessionals.info";
      const res = await fetch(`${backendUrl}/api/audio/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const data = await res.json();
      console.log("✅ Upload response:", data);
      addAudio(wavName);

      setMsg("success"); // special flag for UI
      setFile(null);
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setMsg("error");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setWarning("");
  };

  // --- Render ---

  return (
    <div className="h-full flex flex-col p-1">
      <div
        className={cn(
          "relative flex-1 border-2 border-dashed rounded-xl transition-all duration-200 flex flex-col items-center justify-center p-6 text-center gap-4 bg-gray-50/50",
          isDragging ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]" : "border-slate-200 hover:border-indigo-200 hover:bg-white",
          file ? "border-solid border-indigo-100 bg-white shadow-sm" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-2">
              <UploadCloud className={cn("w-8 h-8", isDragging ? "text-indigo-500" : "text-slate-400")} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {isDragging ? "Drop audio here" : "Click or Drag audio"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: MP3, WAV, M4A
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono bg-slate-100 inline-block px-2 py-1 rounded">
                9s - 20s duration
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs"
            >
              Browse Files
            </Button>
          </>
        ) : (
          <div className="w-full max-w-xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50"
                onClick={clearFile}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <FileAudio className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">Ready to upload</p>
                </div>
              </div>
              <audio controls src={file.url} className="w-full h-8" />
            </div>

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  Upload Voice
                </>
              )}
            </Button>
          </div>
        )}

        {/* Warning Toast */}
        {warning && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {warning}
          </div>
        )}

        {/* Success / Error Message */}
        {msg && (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-50 rounded-xl animate-in fade-in duration-200",
            msg === "success" ? "text-green-600" : "text-red-600"
          )}>
            {msg === "success" ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Upload Complete!</h3>
                <p className="text-slate-500 text-sm mt-1">Your voice clone is ready.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Upload Failed</h3>
                <p className="text-slate-500 text-sm mt-1">Something went wrong. Please try again.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMsg("")}
                  className="mt-4"
                >
                  Close
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
