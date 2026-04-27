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
  Mic,
  MicOff,
  X,
  Maximize2,
  Minimize2,
  Leaf,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean | null;
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { emoji: "🌱", label: "Fertilizer for tomatoes?", query: "Best fertilizer for tomatoes?" },
  { emoji: "💧", label: "Irrigation tips", query: "Irrigation tips for summer" },
  { emoji: "🐛", label: "Organic pest control", query: "Organic pest control methods" },
  { emoji: "🌾", label: "Harvest wheat?", query: "When to harvest wheat?" },
  { emoji: "🥕", label: "Winter veggies", query: "Which vegetables grow in winter?" },
  { emoji: "🧑‍🌾", label: "Soil health", query: "How to improve soil health?" },
];

// ── Unique ID helper ─────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Parse markdown-like bold + bullets ───────────────────────────────────────
function formatMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const isBullet = /^[-•*]\s/.test(line.trim());
    const formatted = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
    return (
      <span key={i} className={isBullet ? "flex gap-1.5 items-start" : "block"}>
        {isBullet && <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>}
        <span
          dangerouslySetInnerHTML={{
            __html: isBullet ? formatted.replace(/^[-•*]\s/, "") : formatted,
          }}
        />
        {i < lines.length - 1 && !isBullet && <br />}
      </span>
    );
  });
}

// ── Typing bubble ─────────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full farmbot-avatar flex items-center justify-center flex-shrink-0">
        <Sprout size={12} className="text-white" />
      </div>
      <div className="farmbot-bubble px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot h-2 w-2 rounded-full bg-green-500"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AiFarmAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! 🌿 I'm **FarmBot**, your AI farming assistant.\n\nAsk me anything about crops, soil, pest control, or how to get the best from FarmX!\n\nWhat can I help you grow today?",
      timestamp: new Date(),
      liked: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
      setUnread(0);
    }
  }, [open]);

  // Setup speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition ||
        window.SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map((r) => r[0].transcript)
            .join("");
          setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Handle send
  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      setShowSuggestions(false);

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
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              "Oops! I ran into a connection issue 🌐. Please check your internet and try again.",
            timestamp: new Date(),
            liked: null,
          },
        ]);
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
          "Namaste! 🌿 I'm **FarmBot**, your AI farming assistant.\n\nAsk me anything about crops, soil, pest control, or how to get the best from FarmX!\n\nWhat can I help you grow today?",
        timestamp: new Date(),
        liked: null,
      },
    ]);
    setInput("");
    setShowSuggestions(true);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // Dynamic sizing
  const chatWidth = expanded
    ? "min(520px, calc(100vw - 24px))"
    : "min(400px, calc(100vw - 24px))";
  const chatHeight = expanded
    ? "min(680px, calc(100vh - 120px))"
    : "min(580px, calc(100vh - 160px))";

  return (
    <>
      {/* ── Floating Trigger ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 font-semibold text-sm text-white fab-button"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 30 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open Farm Assistant"
          >
            {/* Ripple ring */}
            <span className="relative flex h-6 w-6 items-center justify-center flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-40" />
              <Leaf size={14} className="relative z-10" />
            </span>
            <span>Farm Assistant</span>
            {unread > 0 && (
              <motion.span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {unread}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Window ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-20 right-4 z-50 flex flex-col chat-window"
            style={{ width: chatWidth, height: chatHeight }}
            initial={{ opacity: 0, scale: 0.88, y: 24, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="chat-header flex items-center justify-between px-4 py-3 flex-shrink-0 rounded-t-3xl">
              {/* Bot identity */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Sprout size={18} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-300 border-2 border-green-700 shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-bold text-sm leading-tight">FarmBot AI</p>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold tracking-wide">
                      BETA
                    </span>
                  </div>
                  <p className="text-green-200 text-[10px] flex items-center gap-1 mt-0.5">
                    <Sparkles size={8} />
                    <span>AI-powered • Farming expert</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <motion.button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/15 transition hidden sm:flex"
                  whileTap={{ scale: 0.9 }}
                  title={expanded ? "Compact" : "Expand"}
                >
                  {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </motion.button>
                <motion.button
                  onClick={resetChat}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/15 transition"
                  whileTap={{ scale: 0.9, rotate: -180 }}
                  transition={{ duration: 0.3 }}
                  title="New conversation"
                >
                  <RefreshCw size={14} />
                </motion.button>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/15 transition"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close"
                >
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {/* ── Messages ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 messages-bg scrollbar-hide">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, delay: index === messages.length - 1 ? 0 : 0 }}
                >
                  {/* Avatar + name for assistant */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1.5 ml-1">
                      <div className="h-6 w-6 rounded-full farmbot-avatar flex items-center justify-center">
                        <Sprout size={11} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-green-700 tracking-wide uppercase">
                        FarmBot
                      </span>
                      <span className="text-[9px] text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed ${
                      msg.role === "user"
                        ? "user-bubble text-white rounded-tr-sm"
                        : "farmbot-bubble text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    {formatMessage(msg.content)}
                  </div>

                  {/* User timestamp */}
                  {msg.role === "user" && (
                    <span className="text-[9px] text-gray-400 mt-1 mr-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}

                  {/* Feedback actions for assistant */}
                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <motion.div
                      className="flex items-center gap-1 mt-1.5 ml-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className={`action-btn flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition ${
                          copiedId === msg.id
                            ? "bg-green-100 text-green-700"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <><Check size={10} /><span>Copied</span></>
                        ) : (
                          <><Copy size={10} /><span>Copy</span></>
                        )}
                      </button>
                      <span className="w-px h-3 bg-gray-200" />
                      <button
                        onClick={() => handleLike(msg.id, true)}
                        className={`action-btn p-1.5 rounded-lg transition ${
                          msg.liked === true
                            ? "bg-green-100 text-green-600"
                            : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp size={10} />
                      </button>
                      <button
                        onClick={() => handleLike(msg.id, false)}
                        className={`action-btn p-1.5 rounded-lg transition ${
                          msg.liked === false
                            ? "bg-red-100 text-red-500"
                            : "text-gray-400 hover:text-red-400 hover:bg-red-50"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown size={10} />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <TypingBubble />
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* ── Suggestions ─────────────────────────────────────────────── */}
            <AnimatePresence>
              {showSuggestions && !loading && (
                <motion.div
                  className="px-3 py-2.5 suggestions-bar flex-shrink-0 border-t border-green-100"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Quick questions
                  </p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                    {QUICK_SUGGESTIONS.map((s, i) => (
                      <motion.button
                        key={s.label}
                        onClick={() => sendMessage(s.query)}
                        className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-xl suggestion-chip whitespace-nowrap"
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span>{s.emoji}</span>
                        <span>{s.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input ───────────────────────────────────────────────────── */}
            <div className="flex items-end gap-2 px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0 rounded-b-3xl">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about crops, farming, products…"
                  rows={1}
                  className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-green-400 focus:bg-white transition-all leading-relaxed"
                  style={{ scrollbarWidth: "none", minHeight: "42px", maxHeight: "96px" }}
                  disabled={loading}
                />
              </div>

              {/* Voice button */}
              {"webkitSpeechRecognition" in (typeof window !== "undefined" ? window : {}) && (
                <motion.button
                  onClick={toggleVoice}
                  className={`flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg shadow-red-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  whileTap={{ scale: 0.9 }}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <MicOff size={15} />
                    </motion.div>
                  ) : (
                    <Mic size={15} />
                  )}
                </motion.button>
              )}

              {/* Send button */}
              <motion.button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center send-btn transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                whileTap={input.trim() && !loading ? { scale: 0.92 } : {}}
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : (
                  <Send size={14} className="text-white translate-x-px" />
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* ── FAB Button ─────────────────────────── */
        .fab-button {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #14532d 100%);
          box-shadow: 0 8px 28px rgba(22, 163, 74, 0.5), 0 2px 8px rgba(0,0,0,0.1);
        }

        /* ── Chat Window ────────────────────────── */
        .chat-window {
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 32px 80px rgba(0, 0, 0, 0.18),
            0 12px 32px rgba(22, 163, 74, 0.12),
            0 0 0 1px rgba(255,255,255,0.6);
          background: white;
        }

        /* ── Header ─────────────────────────────── */
        .chat-header {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%);
          position: relative;
          overflow: hidden;
        }
        .chat-header::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -30px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.07);
          pointer-events: none;
        }
        .chat-header::after {
          content: '';
          position: absolute;
          bottom: -50px;
          left: -20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          pointer-events: none;
        }

        /* ── Messages background ─────────────────── */
        .messages-bg {
          background: linear-gradient(160deg, #f0fdf4 0%, #f9fafb 40%, #f0fdf4 100%);
        }

        /* ── FarmBot avatar ──────────────────────── */
        .farmbot-avatar {
          background: linear-gradient(135deg, #16a34a, #166534);
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
        }

        /* ── FarmBot bubble ──────────────────────── */
        .farmbot-bubble {
          background: white;
          box-shadow: 0 1px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04);
        }

        /* ── User bubble ─────────────────────────── */
        .user-bubble {
          background: linear-gradient(135deg, #16a34a, #15803d);
          box-shadow: 0 2px 12px rgba(22, 163, 74, 0.35);
        }

        /* ── Send button ─────────────────────────── */
        .send-btn {
          background: linear-gradient(135deg, #16a34a, #166534);
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4);
        }
        .send-btn:disabled {
          background: #e5e7eb;
          box-shadow: none;
        }

        /* ── Suggestions bar ─────────────────────── */
        .suggestions-bar {
          background: #fafff7;
        }

        /* ── Suggestion chip ─────────────────────── */
        .suggestion-chip {
          background: white;
          border: 1.5px solid #bbf7d0;
          color: #15803d;
          box-shadow: 0 1px 4px rgba(22, 163, 74, 0.1);
          transition: all 0.15s ease;
        }
        .suggestion-chip:hover {
          background: #f0fdf4;
          border-color: #4ade80;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
        }

        /* ── Action button ───────────────────────── */
        .action-btn {
          font-size: 10px;
          transition: all 0.15s ease;
        }

        /* ── Typing animation ────────────────────── */
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .typing-dot {
          animation: typingBounce 1.3s ease-in-out infinite;
        }

        /* ── Scrollbar ───────────────────────────── */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}