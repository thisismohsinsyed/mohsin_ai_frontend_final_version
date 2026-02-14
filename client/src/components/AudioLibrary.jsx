"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { useAudioContext } from "@/contexts/AudioContext"; // ✅ shared context

export default function AudioLibrary() {
  const { audios, fetchAudios, removeAudio, loading } = useAudioContext(); // ✅ use global state

  // ✅ Fetch latest audios on mount
  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  const deleteFile = async (filename) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://callcenterprofessionals.info";
      const res = await fetch(
        `${backendUrl}/api/audio/delete?file=${encodeURIComponent(
          filename
        )}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");

      // ✅ Update global context
      removeAudio(filename);
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("❌ Failed to delete file.");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-gray-200 rounded-xl">
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-2 border-b bg-white sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-gray-800">Available Audios</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchAudios}
          className="flex items-center gap-1 text-gray-700 hover:text-black"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Scrollable list inside card */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-gray-500 mt-4">Loading...</p>
        ) : audios.length === 0 ? (
          <p className="text-center text-sm text-gray-500 mt-4">
            No audio files found.
          </p>
        ) : (
          audios.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 px-3 py-2 transition-all"
            >
              {/* File info */}
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <p className="text-sm text-gray-800 truncate" title={f.name}>
                  {f.name}
                </p>
                <audio
                  controls
                  src={f.url}
                  preload="none"
                  className="w-full h-8 mt-1 max-w-full focus:outline-none"
                />
              </div>

              {/* Delete */}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 flex-shrink-0"
                onClick={() => deleteFile(f.name)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
