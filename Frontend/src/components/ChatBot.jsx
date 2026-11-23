import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, RotateCcw, Sparkles, X } from "lucide-react";
import { LogoWordmark } from "./Logo.jsx";
import { useUI } from "../context/UIContext.jsx";
import { streamChat } from "../services/chat.js";

const GREETING = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi! I'm the Upolabdhi assistant. Ask me how RAG works, how to use the Workspace, or anything about getting grounded answers from your documents.",
};

const SUGGESTIONS = [
  "What is RAG, simply?",
  "How do I upload a PDF?",
  "Are my documents private?",
  "How are sources cited?",
];

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function MessageText({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[-*•]\s+(.*)/);
        if (bullet) {
          return (
            <p key={i} className="flex gap-2">
              <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-current opacity-50" />
              <span>{renderInline(bullet[1])}</span>
            </p>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{renderInline(line.replace(/^#+\s*/, ""))}</p>;
      })}
    </div>
  );
}

export default function ChatBot() {
  const { chatOpen, setChatOpen, chatDraft, setChatDraft } = useUI();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [teaser, setTeaser] = useState(false);
  const [unread, setUnread] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setTeaser(true), 4500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!chatOpen) return;
    setTeaser(false);
    setUnread(false);
    if (chatDraft) {
      setInput(chatDraft);
      setChatDraft("");
    }
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    const onKey = (e) => e.key === "Escape" && setChatOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [chatOpen, chatDraft, setChatDraft, setChatOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text) => {
    const content = text.trim();
    if (!content || status === "streaming") return;
    setError("");
    setInput("");
    const userMsg = { id: crypto.randomUUID(), role: "user", content };
    const replyId = crypto.randomUUID();
    const history = [...messages.filter((m) => m.id !== "greeting"), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setStatus("thinking");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChat(history, {
        signal: controller.signal,
        onToken: (full) => {
          setStatus("streaming");
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === replyId);
            if (exists) return prev.map((m) => (m.id === replyId ? { ...m, content: full } : m));
            return [...prev, { id: replyId, role: "assistant", content: full }];
          });
        },
      });
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setStatus("idle");
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([GREETING]);
    setError("");
    setStatus("idle");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      send(input);
    }
  };

  const busy = status !== "idle";

  return (
    <>
      {teaser && !chatOpen && (
        <div className="pop-in fixed right-4 bottom-20 z-40 hidden w-[min(78vw,280px)] sm:right-5 sm:bottom-24 sm:block md:right-8 md:bottom-28">
          <div className="relative rounded-2xl rounded-br-md border border-ink/10 bg-paper p-4 pr-9 text-ink shadow-2xl">
            <button
              type="button"
              onClick={() => setTeaser(false)}
              aria-label="Dismiss message"
              className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full text-ink/40 hover:bg-ink/5 hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
            <button type="button" onClick={() => setChatOpen(true)} className="flex gap-3 text-left">
              <LogoWordmark tone="light" className="shrink-0 text-xl" />
              <span>
                <span className="block text-sm font-semibold">Upolabdhi</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink/60">
                  Hi! Any questions about how Upolabdhi reads your documents?
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      <section
        aria-label="Upolabdhi assistant"
        aria-hidden={!chatOpen}
        inert={!chatOpen}
        className={`fixed z-[60] flex flex-col overflow-hidden bg-paper text-ink shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] max-sm:inset-0 sm:right-6 sm:bottom-24 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-[26px] sm:border sm:border-ink/10 md:right-8 md:bottom-28 ${
          chatOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 scale-95 opacity-0"
        } origin-bottom-right`}
      >
        <header className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
          <div className="relative">
            <LogoWordmark tone="light" className="text-xl" />
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-paper bg-emerald" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight">Upolabdhi assistant</h2>
            <p className="text-xs text-ink/50">{busy ? "Thinking…" : "Online · usually replies instantly"}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            aria-label="Start a new conversation"
            className="grid size-9 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            aria-label="Close assistant"
            className="grid size-9 place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.map((m) =>
            m.role === "assistant" ? (
              <div key={m.id} className="fade-in flex gap-2.5">
                <span className="mt-0.5 shrink-0 text-sm text-[#25b981]" aria-hidden="true">উ</span>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-sage/70 px-4 py-3 text-[14px] leading-relaxed">
                  <MessageText text={m.content} />
                </div>
              </div>
            ) : (
              <div key={m.id} className="fade-in flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap text-cream">
                  {m.content}
                </div>
              </div>
            ),
          )}

          {status === "thinking" && (
            <div className="flex gap-2.5" aria-label="Assistant is typing">
              <span className="mt-0.5 shrink-0 text-sm text-[#25b981]" aria-hidden="true">উ</span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-sage/70 px-4 py-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="typing-dot size-1.5 rounded-full bg-ink"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {messages.length === 1 && (
            <div className="pt-2">
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] text-ink/40 uppercase">
                <Sparkles className="size-3" aria-hidden="true" /> Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-[13px] text-ink/75 transition-colors hover:border-emerald hover:bg-emerald hover:text-cream"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-ink/10 p-3"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-ink/15 bg-white px-3 py-2 transition-colors focus-within:border-emerald">
            <label htmlFor="chat-input" className="sr-only">
              Message the assistant
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={2000}
              placeholder="Send us a message…"
              className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[14px] outline-none placeholder:text-ink/40 [field-sizing:content] focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send message"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald text-cream transition-all hover:bg-ink disabled:opacity-30"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink/40">AI can make mistakes. Check important info.</p>
        </form>
      </section>

      <button
        type="button"
        onClick={() => setChatOpen(!chatOpen)}
        aria-label={chatOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={chatOpen}
        className={`fixed right-5 bottom-5 z-[61] grid size-14 place-items-center rounded-full bg-mint text-ink shadow-[0_16px_40px_-10px_rgba(95,242,176,0.7)] transition-all duration-300 hover:scale-105 active:scale-95 md:right-8 md:bottom-8 md:size-16 ${
          chatOpen ? "max-sm:hidden" : ""
        }`}
      >
        {!chatOpen && <span className="pulse-ring absolute inset-0 rounded-full bg-mint" aria-hidden="true" />}
        <span className="relative">
          {chatOpen ? (
            <ChevronDown className="size-6 text-ink" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
              <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeLinecap="round" strokeWidth="2.6" />
            </svg>
          )}
        </span>
        {unread && !chatOpen && (
          <span className="absolute top-0.5 right-0.5 size-3.5 rounded-full border-2 border-mint bg-red-500" />
        )}
      </button>
    </>
  );
}
