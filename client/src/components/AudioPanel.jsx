"use client";

import { useState } from "react";
import { Headphones, Mic, UploadCloud } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import RecordAudio from "./RecordAudio";
import UploadAudio from "./UploadAudio";
import AudioLibrary from "./AudioLibrary";

export default function AudioPanel() {
  const [activeTab, setActiveTab] = useState("record");

  // ✅ Contextual tab instructions
  const getTabMessage = () => {
    switch (activeTab) {
      case "record":
        return "🎙️ Record your voice by reading the shown sentence aloud. Keep it between 9–20 seconds.";
      case "upload":
        return "📤 Upload a clear audio file between 9 and 20 seconds in length.";
      case "library":
        return "📂 View, play, or delete your saved audio files here.";
      default:
        return "🎧 Record, upload, or manage your audio files.";
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl text-black flex flex-col h-[80vh]">
      {/* Header */}
      <CardHeader className="px-4 pb-2 pt-3 border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Headphones className="w-5 h-5 text-black" /> Audio Panel
        </CardTitle>
      </CardHeader>

      {/* Body */}
      <CardContent className="flex flex-col flex-1 min-h-0 px-4 pb-4 pt-2 gap-3">
        {/* ✅ Dynamic Message */}
        <p className="text-center text-sm bg-gray-50 border border-gray-100 p-2 rounded-md leading-snug text-gray-800 transition-all">
          {getTabMessage()}
        </p>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Tab Buttons */}
          <TabsList className="flex justify-center bg-gray-100 rounded-lg p-1 mb-2 shrink-0">
            <TabsTrigger
              value="record"
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md border transition-all ${
                activeTab === "record"
                  ? "border-black bg-gray-200 text-black"
                  : "border-transparent text-black hover:bg-gray-100"
              }`}
            >
              <Mic className="w-4 h-4" /> Record
            </TabsTrigger>

            <TabsTrigger
              value="upload"
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md border transition-all ${
                activeTab === "upload"
                  ? "border-black bg-gray-200 text-black"
                  : "border-transparent text-black hover:bg-gray-100"
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Upload
            </TabsTrigger>

            <TabsTrigger
              value="library"
              className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md border transition-all ${
                activeTab === "library"
                  ? "border-black bg-gray-200 text-black"
                  : "border-transparent text-black hover:bg-gray-100"
              }`}
            >
              📂 Library
            </TabsTrigger>
          </TabsList>

          {/* Tab Panels */}
          <TabsContent
            value="record"
            className="flex flex-col flex-1 min-h-0 overflow-y-auto"
          >
            <RecordAudio />
          </TabsContent>

          <TabsContent
            value="upload"
            className="flex flex-col flex-1 min-h-0 overflow-y-auto"
          >
            <UploadAudio />
          </TabsContent>

          <TabsContent
            value="library"
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <AudioLibrary />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
