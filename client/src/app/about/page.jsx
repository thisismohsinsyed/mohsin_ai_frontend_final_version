"use client";

import { Mic, Brain, Waves, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800 flex flex-col items-center pt-28 pb-16 px-6">
      {/* Header Section */}
      <section className="max-w-4xl text-center mb-16">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full shadow-inner">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
          About <span className="text-blue-600">VoiceFlow AI</span>
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          VoiceFlow AI is a next-generation conversational platform that lets you talk
          naturally with intelligent systems — powered by real-time speech recognition
          and cutting-edge generative AI.
        </p>
      </section>

      {/* Features Section */}
      <section className="grid sm:grid-cols-3 gap-8 max-w-5xl mb-20">
        {[
          {
            icon: <Mic className="w-7 h-7 text-blue-600" />,
            title: "Live Speech Recognition",
            text: "Our ASR engine listens and transcribes your speech in real time, ensuring smooth, latency-free interaction.",
          },
          {
            icon: <Brain className="w-7 h-7 text-blue-600" />,
            title: "Conversational Intelligence",
            text: "Advanced natural language models interpret your meaning, context, and tone to generate intelligent responses.",
          },
          {
            icon: <Waves className="w-7 h-7 text-blue-600" />,
            title: "Voice Response & TTS",
            text: "Get instant, natural-sounding responses generated through advanced neural text-to-speech models.",
          },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="flex justify-center mb-3">{item.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.text}</p>
          </div>
        ))}
      </section>

      {/* How It Works Section */}
      <section className="max-w-4xl text-center mb-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
        <p className="text-gray-600 leading-relaxed mb-10 max-w-3xl mx-auto">
          When you speak, your voice is instantly processed by a high-quality ASR (Automatic Speech Recognition) system.
          The recognized text is then analyzed by our AI agent, which generates a contextual, natural response — often in
          real time. Finally, a TTS (Text-to-Speech) engine converts the reply back to high-quality speech output.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-gray-700">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            <span>Speak</span>
          </div>
          <span className="hidden sm:inline text-gray-400">→</span>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <span>Understand</span>
          </div>
          <span className="hidden sm:inline text-gray-400">→</span>
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-500" />
            <span>Respond</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <p className="text-gray-600 mb-4">Want to experience it yourself?</p>
        <Link href="/voice_agent">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-md">
            Try the Voice Agent
          </Button>
        </Link>
      </section>
    </main>
  );
}
