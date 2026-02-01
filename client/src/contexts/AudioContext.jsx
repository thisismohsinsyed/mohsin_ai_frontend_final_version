"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

// 🌍 Base URLs
const API_BASE = "https://callcenterprofessionals.info/api/audio";
const FILE_BASE = "https://callcenterprofessionals.info/uploads";

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [audios, setAudios] = useState([]); // [{ name, url }]
  const [loading, setLoading] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null); // ✅ Active/selected audio

  // ✅ Fetch audios from backend (ignore .txt files)
  const fetchAudios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/list`);
      const data = await res.json();

      // 🎧 Only include real audio files (ignore transcriptions)
      const formatted = data
        .filter((file) => /\.(wav|mp3|ogg|flac)$/i.test(file.filename))
        .map((file) => ({
          name: file.filename,
          url: `${FILE_BASE}/${file.filename}`,
        }));

      setAudios(formatted);

      // ✅ Auto-select the first audio (if not already selected)
      if (formatted.length > 0 && !selectedAudio) {
        setSelectedAudio(formatted[0]);
      }
    } catch (err) {
      console.error("❌ Error fetching audios:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAudio]);

  // ✅ Add new audio after upload
  const addAudio = (fileName) => {
    // Skip if it's a transcription file
    if (!/\.(wav|mp3|ogg|flac)$/i.test(fileName)) return;

    const newAudio = {
      name: fileName,
      url: `${FILE_BASE}/${fileName}`,
    };

    setAudios((prev) => {
      const updated = [newAudio, ...prev];
      // auto-select if this is the first one
      if (updated.length === 1) setSelectedAudio(updated[0]);
      return updated;
    });
  };

  // ✅ Remove audio from list
  const removeAudio = (fileName) => {
    setAudios((prev) => {
      const updated = prev.filter((a) => a.name !== fileName);

      // if the deleted one was selected → pick the next available one
      if (selectedAudio?.name === fileName) {
        setSelectedAudio(updated.length > 0 ? updated[0] : null);
      }

      return updated;
    });
  };

  // ✅ Manual selection helper
  const selectAudio = (audio) => {
    setSelectedAudio(audio);
  };

  // 🔁 Load on mount
  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  return (
    <AudioContext.Provider
      value={{
        audios,
        loading,
        selectedAudio,
        setSelectedAudio, // ✅ exposed for manual override
        fetchAudios,
        addAudio,
        removeAudio,
        selectAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

// 🔌 Hook for easy access
export const useAudioContext = () => useContext(AudioContext);
