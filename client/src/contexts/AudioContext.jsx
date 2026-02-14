"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://callcenterprofessionals.info"}/api/audio`;
const FILE_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || "https://callcenterprofessionals.info"}/uploads`;

const AudioDataContext = createContext();

export const AudioProvider = ({ children }) => {
  const [audios, setAudios] = useState([]); // [{ name, url }]
  const [loading, setLoading] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const fetchAudios = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/list`);
      const data = await res.json();

      const formatted = data
        .filter((file) => /\.(wav|mp3|ogg|flac)$/i.test(file.filename))
        .map((file) => ({
          name: file.filename,
          url: `${FILE_BASE}/${file.filename}`,
        }));

      setAudios(formatted);

      if (formatted.length > 0) {
        setSelectedAudio((prev) => {
          // If nothing is selected, or the previously selected audio no longer exists, select the first one
          if (!prev || !formatted.find((a) => a.name === prev.name)) {
            return formatted[0];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error fetching audios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAudio = (fileName) => {
    if (!/\.(wav|mp3|ogg|flac)$/i.test(fileName)) return;

    const newAudio = {
      name: fileName,
      url: `${FILE_BASE}/${fileName}`,
    };

    setAudios((prev) => {
      const updated = [newAudio, ...prev];
      if (updated.length === 1) setSelectedAudio(updated[0]);
      return updated;
    });
  };

  const removeAudio = (fileName) => {
    setAudios((prev) => {
      const updated = prev.filter((a) => a.name !== fileName);

      if (selectedAudio?.name === fileName) {
        setSelectedAudio(updated.length > 0 ? updated[0] : null);
      }

      return updated;
    });
  };

  const selectAudio = (audio) => {
    setSelectedAudio(audio);
  };

  useEffect(() => {
    fetchAudios();
  }, [fetchAudios]);

  return (
    <AudioDataContext.Provider
      value={{
        audios,
        loading,
        selectedAudio,
        setSelectedAudio,
        fetchAudios,
        addAudio,
        removeAudio,
        selectAudio,
      }}
    >
      {children}
    </AudioDataContext.Provider>
  );
};

export const useAudioContext = () => useContext(AudioDataContext);
