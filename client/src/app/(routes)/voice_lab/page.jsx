"use client";

import { useState, useEffect } from "react";
import { useAudioContext } from "@/contexts/AudioContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Play, Download, Waves, Sparkles } from "lucide-react";

export default function VoiceLabPage() {
  const { audios, selectedAudio, selectAudio } = useAudioContext();

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [outputAudio, setOutputAudio] = useState(null);

  const [audioUrl, setAudioUrl] = useState("");
  const [textUrl, setTextUrl] = useState("");

  useEffect(() => {
    if (selectedAudio) {
      const base = selectedAudio.url;
      setAudioUrl(base);
      setTextUrl(`${base}.txt`);
    } else {
      setAudioUrl("");
      setTextUrl("");
    }
  }, [selectedAudio]);

  async function handleClone() {
    if (!audioUrl || !textUrl || !text) {
      alert("Please select an audio and enter text to speak.");
      return;
    }

    try {
      setIsLoading(true);
      setOutputAudio(null);

      // 🔗 Call via Next.js proxy
      const res = await fetch(
        "/api/voice-clone",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioUrl, textUrl, text }),
        }
      );

      if (!res.ok) throw new Error("Voice cloning failed.");

      const blob = await res.blob();
      const audioSrc = URL.createObjectURL(blob);
      setOutputAudio(audioSrc);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownload() {
    if (!outputAudio) return;
    const link = document.createElement("a");
    link.href = outputAudio;
    link.download = "cloned_voice.wav";
    link.click();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 pt-[80px]">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center px-6">
        <Card className="w-full shadow-lg border border-gray-200 bg-white rounded-2xl overflow-hidden">
          <CardHeader className="text-center py-8 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-white to-purple-50">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full shadow-md animate-pulse">
                <Waves className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800">
              🎙️ Voice Lab
            </CardTitle>
            <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">
              Clone and experiment with your uploaded voices. Type a phrase, and bring it to life with AI.
            </p>
          </CardHeader>

          <CardContent className="p-6 sm:p-10 grid sm:grid-cols-2 gap-10">
            {/* Left Column — Input Controls */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Choose a Voice Sample</label>
                <select
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  value={selectedAudio?.name || ""}
                  onChange={(e) => {
                    const chosen = audios.find((a) => a.name === e.target.value);
                    selectAudio(chosen || null);
                  }}
                >
                  <option value="">-- Select an audio sample --</option>
                  {audios.map((audio) => (
                    <option key={audio.name} value={audio.name}>
                      {audio.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Text to Speak</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none bg-white focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                  rows={5}
                  placeholder="Type what you'd like the cloned voice to say..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleClone}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-md font-medium flex items-center gap-2 transition-all duration-200 active:scale-[0.97]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Cloning Voice...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Clone Voice
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Right Column — Output */}
            <div className="space-y-6">
              {outputAudio ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex justify-center items-center gap-2">
                    <Sparkles className="text-indigo-500 h-5 w-5" />
                    <p className="text-gray-800 font-semibold text-lg">Your Cloned Voice is Ready</p>
                    <Sparkles className="text-indigo-500 h-5 w-5" />
                  </div>

                  <audio
                    controls
                    src={outputAudio}
                    className="w-full rounded-lg border border-gray-300 shadow-sm"
                  />

                  <div className="flex justify-center gap-3 pt-3">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-all"
                      onClick={() => new Audio(outputAudio).play()}
                    >
                      <Play className="h-4 w-4" />
                      Play Again
                    </Button>

                    <Button
                      onClick={handleDownload}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium px-6 py-2 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
                    >
                      <Download className="h-4 w-4" />
                      Download Voice
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl p-8">
                  <Waves className="h-10 w-10 text-gray-300 mb-3" />
                  <p>No cloned voice yet — generate one to preview.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
