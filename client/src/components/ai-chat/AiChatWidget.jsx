"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { askGemini } from "@/app/ai-chat/actions";

const initialAssistantMessage = (name) =>
  `Hi${name ? ` ${name}` : ""}! I'm your AI assistant. Ask me anything about VoiceFlow AI or anything else.`;

export default function AiChatWidget() {
  const { isSignedIn, user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  const greeting = useMemo(() => initialAssistantMessage(user?.firstName), [user?.firstName]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: "assistant", text: greeting }]);
    }
  }, [greeting, isOpen, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setIsSending(true);

    try {
      const reply = await askGemini(trimmed);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("AI chat error", err);
      setError("Sorry, I couldn't get a response right now. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [input, isSending]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isSignedIn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 sm:w-96 bg-gray-950/95 text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
          <header className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">VoiceFlow AI</p>
              <p className="text-xs text-white/80">Ask anything, {user?.firstName ?? "friend"}.</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              className="p-1 rounded-full hover:bg-white/20 transition"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="max-h-72 overflow-y-auto space-y-3 p-4 bg-gradient-to-b from-gray-900/60 to-black/60">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`w-fit max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow ${
                  message.role === "user"
                    ? "ml-auto bg-purple-600/70"
                    : "mr-auto bg-white/10 border border-white/10"
                }`}
              >
                {message.text}
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && <p className="text-xs text-rose-400 px-4">{error}</p>}

          <div className="p-3 border-t border-white/10 bg-gray-900/40 flex items-end gap-2">
            <textarea
              rows={2}
              className="flex-1 resize-none rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/60 p-2 focus:outline-none focus:border-purple-400"
              placeholder="Type a question and press Enter"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={handleSend}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/40 disabled:cursor-not-allowed text-white p-3 rounded-xl transition"
              disabled={isSending || !input.trim()}
              aria-label="Send message"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg p-4 flex items-center gap-2 hover:shadow-2xl transition"
        aria-expanded={isOpen}
        aria-label="Toggle AI chat"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Chat with AI</span>
      </button>
    </div>
  );
}
