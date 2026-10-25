"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { STARTER_QUESTIONS } from "@/lib/starterQuestions";
import { askAi, type AiChatHistoryMessage } from "@/lib/aiChat";
import { trackEvent } from "@/lib/analytics";
import { ASK_AI_EVENT } from "@/lib/askAiEvent";
import config from "@/content/config.json";
import uiStrings from "@/content/ui-strings.json";
import profile from "@/content/profile.json";
import ContentImage from "@/components/ui/ContentImage";

const t = uiStrings.aiChatWidget;

interface Message {
  role: "user" | "bot";
  text: string;
}

const AI_WORKER_URL = config.aiChatWorkerUrl;

const INITIALS = profile.name.split(" ").map(n => n[0]).join("");

/** Timings for the "Ask AI" teaser, in seconds, from content/config.json. */
const PROMPT_DEFAULTS = { firstDelaySeconds: 3, repeatEverySeconds: 30, visibleForSeconds: 3 };
const PROMPT_TIMING = { ...PROMPT_DEFAULTS, ...(config.aiChatPrompt ?? {}) };

/** Seconds to milliseconds, guarding against a zero or negative value in the config. */
function ms(seconds: number, fallback: number): number {
  return Math.max(0.5, Number(seconds) > 0 ? Number(seconds) : fallback) * 1000;
}

const FIRST_DELAY_MS = ms(PROMPT_TIMING.firstDelaySeconds, PROMPT_DEFAULTS.firstDelaySeconds);
const REPEAT_EVERY_MS = ms(PROMPT_TIMING.repeatEverySeconds, PROMPT_DEFAULTS.repeatEverySeconds);
const VISIBLE_FOR_MS = ms(PROMPT_TIMING.visibleForSeconds, PROMPT_DEFAULTS.visibleForSeconds);

/** Remembers a dismissal for this browser tab, so a reload doesn't bring the teaser back. */
const DISMISSED_KEY = "ai_chat_prompt_dismissed";

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Storage blocked — the in-memory flag still stops it for this page view.
  }
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  /** Closed via the X — stays hidden for the rest of this tab's session. */
  const [dismissed, setDismissed] = useState(false);
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
    // sessionStorage is browser-only, so a previous dismissal can only be read after hydration.
    if (wasDismissed()) setDismissed(true);
  }, []);

  /**
   * Shows the teaser for `visibleForSeconds`, hides it, waits `repeatEverySeconds` and
   * repeats — until it is dismissed or the chat is opened.
   */
  useEffect(() => {
    if (dismissed || open) return;

    let timer: ReturnType<typeof setTimeout>;
    const hide = () => {
      setShowPrompt(false);
      timer = setTimeout(show, REPEAT_EVERY_MS);
    };
    const show = () => {
      setShowPrompt(true);
      timer = setTimeout(hide, VISIBLE_FOR_MS);
    };

    timer = setTimeout(show, FIRST_DELAY_MS);
    // Clearing on open/dismiss also resets the teaser, so reopening starts a fresh cycle.
    return () => {
      clearTimeout(timer);
      setShowPrompt(false);
    };
  }, [dismissed, open]);

  /** The X button: gone for the rest of this tab's session. */
  function dismissPrompt() {
    setShowPrompt(false);
    setDismissed(true);
    rememberDismissed();
  }

  function handleOpen() {
    setOpen(true);
    setShowPrompt(false);
    if (messages.length === 0) trackEvent("faq_bot_open", {});
  }

  // Wrapped so the ASK_AI listener below isn't torn down and re-added on every render.
  const ask = useCallback(async (question: string) => {
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

    // Loaded on demand: this fallback pulls in fuse.js and a corpus built from every
    // content file, and most visitors never reach it.
    const { askFaqBot } = await import("@/lib/faqBot");
    const { text } = askFaqBot(trimmed);
    setMessages((prev) => [...prev, { role: "bot", text }]);
  }, [loading, messages]);

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
                <ContentImage
                  src={profile.avatar}
                  alt={profile.name}
                  wrapperClassName="w-6 h-6 rounded-full shrink-0 ring-1 ring-accent/40"
                  imgClassName="w-full h-full object-cover"
                  initials={INITIALS}
                  initialsClassName="text-[9px]"
                />
                <span className="text-sm font-semibold text-foreground">{t.headerTitle}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t.closeChatAriaLabel}
                className="text-muted hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div>
                  <p className="text-sm text-muted mb-3">
                    {t.introText}
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
                    {t.thinking}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.inputPlaceholder}
                disabled={loading}
                className="flex-1 min-w-0 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label={t.sendAriaLabel}
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
        {showPrompt && !open && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex items-center gap-2 max-w-[220px] bg-surface border border-border rounded-xl shadow-lg px-4 py-3"
          >
            <Sparkles size={16} className="text-accent shrink-0" />
            <button onClick={handleOpen} className="flex-1 text-left text-sm text-foreground">
              {t.launcherPrompt}
            </button>
            <button
              onClick={dismissPrompt}
              aria-label={t.dismissAriaLabel}
              className="text-muted hover:text-foreground transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        aria-label={open ? t.closeChatAriaLabel : t.openAriaLabel}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg shadow-accent/25 ring-2 ring-accent transition-colors"
      >
        {open ? (
          <X size={22} />
        ) : (
          <>
            <ContentImage
              src={profile.avatar}
              alt=""
              wrapperClassName="w-full h-full rounded-full"
              imgClassName="w-full h-full object-cover"
              initials={INITIALS}
              initialsClassName="text-base"
            />
            <span className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 rounded-full bg-accent ring-2 ring-background text-accent-foreground pointer-events-none">
              <MessageCircle size={12} />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
