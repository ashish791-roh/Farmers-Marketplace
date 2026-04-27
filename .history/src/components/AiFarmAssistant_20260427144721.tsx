"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sprout,
  Loader2,
  ChevronDown,
  Sparkles,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean | null; // null = no feedback yet
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  "🌱 Best fertilizer for tomatoes?",
  "💧 Irrigation tips for summer",
  "🐛 Organic pest control methods",
  "🌾 When to harvest wheat?",
  "🥕 Which veggies grow in winter?",
  "🧑‍🌾 How to improve soil health?",
];

// ── Unique ID helper ─────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Format markdown-like bold ─────────────────────────────────────────────────
function formatMessage(text: string) {
  // Convert **bold** to <strong>
  return text
    .split("\n")
    .map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AiFarmAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! 🌿 I'm **FarmBot**, your AI farming assistant. Ask me anything about crops, products, farming tips, or how to get the best from FarmX!\n\nWhat can I help you with today?",
      timestamp: new Date(),
      liked: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  // Handle send
  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: msg,
        timestamp: new Date(),
        liked: null,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        // Build conversation history for Claude API
        const history = [
          ...messages.filter((m) => m.id !== "welcome"),
          userMsg,
        ].map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const data = await response.json();
        const replyText =
          data?.text ?? "Sorry, I couldn't respond right now. Please try again!";

        const assistantMsg: Message = {
          id: uid(),
          role: "assistant",
          content: replyText,
          timestamp: new Date(),
          liked: null,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (!open) setUnread((n) => n + 1);
      } catch {
        const errMsg: Message = {
          id: uid(),
          role: "assistant",
          content:
            "Oops! I ran into a connection issue 🌐. Please check your internet and try again.",
          timestamp: new Date(),
          liked: null,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, open]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLike = (id: string, liked: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked } : m))
    );
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Namaste! 🌿 I'm **FarmBot**, your AI farming assistant. Ask me anything about crops, products, farming tips, or how to get the best from FarmX!\n\nWhat can I help you with today?",
        timestamp: new Date(),
        liked: null,
      },
    ]);
    setInput("");
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ── Floating trigger button ──────────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-2xl shadow-2xl px-4 py-3 font-semibold text-sm transition-all ${
          open ? "hidden" : "flex"
        }`}
        style={{
          background: "linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)",
          color: "white",
          boxShadow: "0 8px 32px rgba(22,163,74,0.45)",
        }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        aria-label="Open Farm Assistant"
      >
        {/* Pulse ring */}
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-30" />
          <Sprout size={16} className="relative z-10" />
        </span>
        <span>Farm Assistant</span>
        {unread > 0 && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {unread}
          </span>
        )}
      </motion.button>

      {/* ── Chat window ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={chatRef}
            className="fixed bottom-20 right-4 z-50 flex flex-col rounded-3xl overflow-hidden"
            style={{
              width: "min(420px, calc(100vw - 32px))",
              height: "min(600px, calc(100vh - 160px))",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.10)",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 25 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #16a34a 0%, #15803d 60%, #166534 100%)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-9 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sprout size={18} className="text-white" />
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 border-2 border-green-700" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    FarmBot AI
                  </p>
                  <p className="text-green-200 text-[11px] flex items-center gap-1">
                    <Sparkles size={9} /> Powered by Claude • Always online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/10 transition"
                  title="New conversation"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
              style={{
                background:
                  "linear-gradient(160deg, #f0fdf4 0%, #f9fafb 50%, #f0fdf4 100%)",
              }}
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
                        <Sprout size={10} className="text-white" />
                      </div>
                      <span className="text-[10px] font-semibold text-green-700">
                        FarmBot
                      </span>
                      <span className="text-[9px] text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                    }`}
                  >
                    {formatMessage(msg.content)}
                  </div>

                  {msg.role === "user" && (
                    <span className="text-[9px] text-gray-400 mt-0.5 mr-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}

                  {/* Assistant actions */}
                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <div className="flex items-center gap-1 mt-1 ml-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <Check size={11} className="text-green-600" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                      <button
                        onClick={() => handleLike(msg.id, true)}
                        className={`p-1 rounded-lg transition ${
                          msg.liked === true
                            ? "text-green-600 bg-green-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp size={11} />
                      </button>
                      <button
                        onClick={() => handleLike(msg.id, false)}
                        className={`p-1 rounded-lg transition ${
                          msg.liked === false
                            ? "text-red-500 bg-red-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={11} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  className="flex items-start gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sprout size={10} className="text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-2 w-2 rounded-full bg-green-500"
                          style={{
                            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick suggestion chips */}
            {messages.length <= 2 && !loading && (
              <div
                className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0 border-t border-gray-100"
                style={{ background: "#f9fafb" }}
              >
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s.replace(/^[^\s]+\s/, "").trim())}
                    className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border border-green-200 bg-white text-green-700 hover:bg-green-50 hover:border-green-400 transition whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div
              className="flex items-end gap-2 px-3 py-3 flex-shrink-0 border-t border-gray-100"
              style={{ background: "white" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about crops, farming, products…"
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-400 focus:bg-white transition max-h-28 overflow-y-auto leading-relaxed"
                style={{ scrollbarWidth: "none" }}
                disabled={loading}
              />
              <motion.button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    input.trim() && !loading
                      ? "linear-gradient(135deg, #16a34a, #166534)"
                      : "#e5e7eb",
                  color: input.trim() && !loading ? "white" : "#9ca3af",
                }}
                whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                whileTap={input.trim() && !loading ? { scale: 0.94 } : {}}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}