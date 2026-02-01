"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { askGemini } from "./actions";

export default function ChatPage() {
  const { user, isSignedIn } = useUser();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  if (!isSignedIn) return <div className="text-white">Please sign in first.</div>;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    const reply = await askGemini(input);
    const aiMsg = { role: "assistant", text: reply };

    setMessages((prev) => [...prev, aiMsg]);
    setInput("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">

        <h1 className="text-white text-xl font-semibold text-center mb-4">
          Welcome, {user.firstName}. Ask Gemini anything.
        </h1>

        <div className="h-80 overflow-y-auto space-y-3 p-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl text-sm ${
                m.role === "user"
                  ? "bg-purple-600/40 text-white ml-auto max-w-xs"
                  : "bg-white/20 text-white mr-auto max-w-xs"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <input
            className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium"
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
}
