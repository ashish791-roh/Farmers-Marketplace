"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sprout, Loader2, Sparkles, RefreshCw,
  ThumbsUp, ThumbsDown, Copy, Check,
  Mic, MicOff, X, Maximize2, Minimize2, Leaf,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  liked?: boolean | null;
}

const QUICK_SUGGESTIONS = [
  { emoji: "🌱", label: "Fertilizer for tomatoes?", query: "Best fertilizer for tomatoes?" },
  { emoji: "💧", label: "Irrigation tips", query: "Irrigation tips for summer" },
  { emoji: "🐛", label: "Organic pest control", query: "Organic pest control methods" },
  { emoji: "🌾", label: "When to harvest wheat?", query: "When to harvest wheat?" },
  { emoji: "🥕", label: "Winter vegetables", query: "Which vegetables grow in winter?" },
  { emoji: "🧑‍🌾", label: "Improve soil health", query: "How to improve soil health?" },
];

function uid() { return Math.random().toString(36).slice(2, 10); }

function formatMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const isBullet = /^[-•*]\s/.test(line.trim());
    const html = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
    return (
      <span key={i} className={isBullet ? "flex gap-1.5 items-start" : "block"}>
        {isBullet && <span className="text-green-500 mt-0.5 flex-shrink-0 text-xs">•</span>}
        <span dangerouslySetInnerHTML={{ __html: isBullet ? html.replace(/^[-•*]\s/, "") : html }} />
        {i < lines.length - 1 && !isBullet && <br />}
      </span>
    );
  });
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full farmbot-avatar flex items-center justify-center flex-shrink-0">
        <Sprout size={12} className="text-white" />
      </div>
      <div className="farmbot-bubble px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="typing-dot h-2 w-2 rounded-full bg-green-500"
              style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AiFarmAssistant() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome", role: "assistant",
    content: "Namaste! 🌿 I'm **FarmBot**, your AI farming assistant.\n\nAsk me anything about crops, soil, pest control, or how to get the best from FarmX!\n\nWhat can I help you grow today?",
    timestamp: new Date(), liked: null,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [hasSpeech, setHasSpeech] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Focus on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
      setUnread(0);
    }
  }, [open]);

  // ── Lock body scroll on mobile ─────────────────────────────────────────────
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, open]);

  // ── Speech recognition setup ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setHasSpeech(true);
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(t);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { recognitionRef.current.start(); setIsListening(true); }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setShowSuggestions(false);

    const userMsg: Message = { id: uid(), role: "user", content: msg, timestamp: new Date(), liked: null };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    try {
      const history = [...messages.filter((m) => m.id !== "welcome"), userMsg]
        .map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await response.json();
      const replyText = data?.text ?? "Sorry, I couldn't respond right now. Please try again!";
      const assistantMsg: Message = { id: uid(), role: "assistant", content: replyText, timestamp: new Date(), liked: null };
      setMessages((prev) => [...prev, assistantMsg]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((prev) => [...prev, {
        id: uid(), role: "assistant",
        content: "Oops! Connection issue 🌐. Please check your internet and try again.",
        timestamp: new Date(), liked: null,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleLike = (id: string, liked: boolean) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, liked } : m)));

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetChat = () => {
    setMessages([{
      id: "welcome", role: "assistant",
      content: "Namaste! 🌿 I'm **FarmBot**, your AI farming assistant.\n\nAsk me anything about crops, soil, pest control, or how to get the best from FarmX!\n\nWhat can I help you grow today?",
      timestamp: new Date(), liked: null,
    }]);
    setInput("");
    setShowSuggestions(true);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  // ── Positioning constants ──────────────────────────────────────────────────
  // BottomNav = h-16 = 64px, md:hidden. FAB sits 12px above it.
  const BOTTOM_NAV_H = 64;
  const FAB_BOTTOM = `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + 12px)`;

  // Chat window bottom: clear BottomNav + 8px gap + safe-area
  const CHAT_BOTTOM = `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + 8px)`;

  // Chat height on mobile: full viewport minus nav, top gap, and BottomNav
  // dvh = dynamic viewport height (shrinks when keyboard appears on iOS/Android)
  const MOBILE_CHAT_HEIGHT = `calc(100dvh - ${BOTTOM_NAV_H}px - env(safe-area-inset-bottom, 0px) - 60px)`;

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            className="fixed z-40 flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold text-sm text-white fab-btn"
            style={{ bottom: FAB_BOTTOM, right: "16px" }}
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Open Farm Assistant"
          >
            <span className="relative flex h-5 w-5 items-center justify-center flex-shrink-0">
              <span className="absolute inset-0 animate-ping rounded-full bg-green-300 opacity-40" />
              <Leaf size={13} className="relative z-10" />
            </span>
            Farm Assistant
            {unread > 0 && (
              <motion.span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                {unread}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile Backdrop ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Chat Window ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed z-50 flex flex-col chat-win"
            style={isMobile ? {
              // Mobile: bottom sheet that respects BottomNav + safe-area
              left: "8px",
              right: "8px",
              bottom: CHAT_BOTTOM,
              height: MOBILE_CHAT_HEIGHT,
              maxHeight: "min(600px, calc(100dvh - 140px))",
              borderRadius: "20px",
            } : {
              // Desktop: floating panel anchored bottom-right
              right: "16px",
              bottom: FAB_BOTTOM,
              width: expanded ? "min(520px, calc(100vw - 32px))" : "min(400px, calc(100vw - 32px))",
              height: expanded ? "min(680px, calc(100vh - 100px))" : "min(580px, calc(100vh - 120px))",
              borderRadius: "24px",
            }}
            initial={isMobile ? { opacity: 0, y: 48 } : { opacity: 0, scale: 0.88, y: 20 }}
            animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { opacity: 0, y: 48 } : { opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div className="chat-hdr flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderRadius: isMobile ? "20px 20px 0 0" : "24px 24px 0 0" }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Sprout size={17} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 border-2 border-green-700" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-bold text-sm">FarmBot AI</p>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold tracking-wide">BETA</span>
                  </div>
                  <p className="text-green-200 text-[10px] flex items-center gap-1 mt-0.5">
                    <Sparkles size={8} /> AI-powered • Farming expert
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {!isMobile && (
                  <motion.button onClick={() => setExpanded((v) => !v)}
                    className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/15 transition">
                    {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </motion.button>
                )}
                <motion.button onClick={resetChat}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/15 transition"
                  whileTap={{ scale: 0.9, rotate: -180 }} transition={{ duration: 0.3 }}>
                  <RefreshCw size={14} />
                </motion.button>
                <motion.button onClick={() => setOpen(false)}
                  className="p-2 rounded-xl text-green-200 hover:text-white hover:bg-white/15 transition"
                  whileTap={{ scale: 0.9 }}>
                  <X size={16} />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 msg-bg scrollbar-hide"
              style={{ WebkitOverflowScrolling: "touch" }}>
              {messages.map((msg) => (
                <motion.div key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}>

                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <div className="h-5 w-5 rounded-full farmbot-av flex items-center justify-center">
                        <Sprout size={10} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">FarmBot</span>
                      <span className="text-[9px] text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}

                  <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "usr-bubble text-white rounded-tr-sm"
                      : "bot-bubble text-gray-800 rounded-tl-sm"
                  }`}>
                    {formatMessage(msg.content)}
                  </div>

                  {msg.role === "user" && (
                    <span className="text-[9px] text-gray-400 mt-1 mr-1">{formatTime(msg.timestamp)}</span>
                  )}

                  {msg.role === "assistant" && msg.id !== "welcome" && (
                    <motion.div className="flex items-center gap-1 mt-1.5 ml-1"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      <button onClick={() => handleCopy(msg.id, msg.content)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition ${
                          copiedId === msg.id ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        }`}>
                        {copiedId === msg.id ? <><Check size={10} /><span>Copied</span></> : <><Copy size={10} /><span>Copy</span></>}
                      </button>
                      <span className="w-px h-3 bg-gray-200" />
                      <button onClick={() => handleLike(msg.id, true)}
                        className={`p-1.5 rounded-lg transition ${msg.liked === true ? "bg-green-100 text-green-600" : "text-gray-400 hover:bg-green-50 hover:text-green-500"}`}>
                        <ThumbsUp size={10} />
                      </button>
                      <button onClick={() => handleLike(msg.id, false)}
                        className={`p-1.5 rounded-lg transition ${msg.liked === false ? "bg-red-100 text-red-500" : "text-gray-400 hover:bg-red-50 hover:text-red-400"}`}>
                        <ThumbsDown size={10} />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                    <TypingBubble />
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && !loading && (
                <motion.div className="px-3 py-2.5 sugg-bar flex-shrink-0 border-t border-green-100"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Quick questions</p>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                    {QUICK_SUGGESTIONS.map((s, i) => (
                      <motion.button key={s.label} onClick={() => sendMessage(s.query)}
                        className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-xl sugg-chip whitespace-nowrap"
                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.94 }}>
                        <span>{s.emoji}</span><span>{s.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="flex items-end gap-2 px-3 py-3 bg-white border-t border-gray-100 flex-shrink-0"
              style={{ borderRadius: isMobile ? "0 0 20px 20px" : "0 0 24px 24px" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 88) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about crops, farming, products…"
                rows={1}
                className="flex-1 resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-green-400 focus:bg-white transition-all leading-relaxed scrollbar-hide"
                style={{ minHeight: "42px", maxHeight: "88px" }}
                disabled={loading}
              />

              {hasSpeech && (
                <motion.button onClick={toggleVoice}
                  className={`flex-shrink-0 h-[42px] w-[42px] rounded-2xl flex items-center justify-center transition-all ${
                    isListening ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 active:bg-gray-200"
                  }`}
                  whileTap={{ scale: 0.9 }}>
                  {isListening
                    ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}><MicOff size={15} /></motion.div>
                    : <Mic size={15} />}
                </motion.button>
              )}

              <motion.button onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 h-[42px] w-[42px] rounded-2xl flex items-center justify-center send-btn disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={input.trim() && !loading ? { scale: 1.08 } : {}}
                whileTap={input.trim() && !loading ? { scale: 0.92 } : {}}>
                {loading ? <Loader2 size={15} className="animate-spin text-white" /> : <Send size={14} className="text-white translate-x-px" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .fab-btn {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 55%, #14532d 100%);
          box-shadow: 0 8px 24px rgba(22,163,74,.45), 0 2px 6px rgba(0,0,0,.08);
          -webkit-tap-highlight-color: transparent;
        }
        .chat-win {
          overflow: hidden;
          background: white;
          box-shadow: 0 24px 60px rgba(0,0,0,.16), 0 8px 24px rgba(22,163,74,.1), 0 0 0 1px rgba(0,0,0,.06);
        }
        .chat-hdr {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%);
          position: relative; overflow: hidden;
        }
        .chat-hdr::before {
          content:''; position:absolute; top:-36px; right:-24px;
          width:100px; height:100px; border-radius:50%;
          background:rgba(255,255,255,.07); pointer-events:none;
        }
        .msg-bg { background: linear-gradient(160deg,#f0fdf4 0%,#f9fafb 40%,#f0fdf4 100%); }
        .farmbot-av { background: linear-gradient(135deg,#16a34a,#166534); box-shadow:0 1px 6px rgba(22,163,74,.4); }
        .bot-bubble { background:white; box-shadow:0 1px 6px rgba(0,0,0,.07),0 0 0 1px rgba(0,0,0,.04); }
        .usr-bubble { background:linear-gradient(135deg,#16a34a,#15803d); box-shadow:0 2px 10px rgba(22,163,74,.3); }
        .send-btn {
          background: linear-gradient(135deg,#16a34a,#166534);
          box-shadow: 0 4px 12px rgba(22,163,74,.4);
          -webkit-tap-highlight-color: transparent;
        }
        .send-btn:disabled { background:#e5e7eb; box-shadow:none; }
        .sugg-bar { background:#fafff7; }
        .sugg-chip {
          background:white; border:1.5px solid #bbf7d0; color:#15803d;
          box-shadow:0 1px 3px rgba(22,163,74,.08);
          -webkit-tap-highlight-color: transparent;
        }
        .sugg-chip:active { background:#f0fdf4; border-color:#4ade80; }
        @keyframes typingBounce {
          0%,60%,100%{transform:translateY(0);opacity:.6}
          30%{transform:translateY(-5px);opacity:1}
        }
        .typing-dot { animation:typingBounce 1.3s ease-in-out infinite; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
      `}</style>
    </>
  );
}