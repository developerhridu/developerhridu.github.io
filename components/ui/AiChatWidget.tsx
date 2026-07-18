"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { askFaqBot, STARTER_QUESTIONS } from "@/lib/faqBot";
import { askAi, type AiChatHistoryMessage } from "@/lib/aiChat";
import { trackEvent } from "@/lib/analytics";
import { ASK_AI_EVENT } from "@/lib/askAiEvent";
import config from "@/content/config.json";

interface Message {
  role: "user" | "bot";
  text: string;
}

const AI_WORKER_URL = config.aiChatWorkerUrl;

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function dismissPrompt() {
    setShowPrompt(false);
  }

  function handleOpen() {
    setOpen(true);
    dismissPrompt();
    if (messages.length === 0) trackEvent("faq_bot_open", {});
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    const history: AiChatHistoryMessage[] = messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    trackEvent("faq_bot_question", { question: trimmed });

    if (AI_WORKER_URL) {
      setLoading(true);
      const aiAnswer = await askAi(trimmed, AI_WORKER_URL, history);
      setLoading(false);
      if (aiAnswer) {
        setMessages((prev) => [...prev, { role: "bot", text: aiAnswer }]);
        return;
      }
    }

    const { text } = askFaqBot(trimmed);
    setMessages((prev) => [...prev, { role: "bot", text }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  useEffect(() => {
    function onAskAi(e: Event) {
      const question = (e as CustomEvent<string>).detail;
      if (!question) return;
      setOpen(true);
      void ask(question);
    }
    window.addEventListener(ASK_AI_EVENT, onAskAi);
    return () => window.removeEventListener(ASK_AI_EVENT, onAskAi);
  }, [ask]);

  return (
    <div className="print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-sm h-[520px] max-h-[70vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <span className="text-sm font-semibold text-foreground">Ask about Mizanur</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div>
                  <p className="text-sm text-muted mb-3">
                    Ask anything about his experience, projects, or skills — or try one of these:
                  </p>
                  <div className="flex flex-col gap-2">
                    {STARTER_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => void ask(q)}
                        disabled={loading}
                        className="text-left text-sm px-3 py-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors disabled:opacity-40"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] text-sm rounded-xl px-3 py-2 whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-hover text-foreground border border-border"
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <p className="bg-surface-hover text-muted border border-border rounded-xl px-3 py-2 text-sm">
                    Thinking…
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                disabled={loading}
                className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!input.trim() || loading}
                className="p-2 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg transition-colors disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrompt && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-2 max-w-[220px] bg-surface border border-border rounded-xl shadow-lg px-4 py-3"
          >
            <Sparkles size={16} className="text-accent shrink-0" />
            <button onClick={handleOpen} className="flex-1 text-left text-sm text-foreground">
              Ask AI about Hridu
            </button>
            <button
              onClick={dismissPrompt}
              aria-label="Dismiss"
              className="text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label={open ? "Close chat" : "Ask about Mizanur"}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg shadow-accent/25 transition-colors"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}
