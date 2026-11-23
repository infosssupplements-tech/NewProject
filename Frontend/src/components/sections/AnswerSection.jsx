import { useState } from "react";
import { ArrowUp } from "lucide-react";
import Reveal from "../Reveal.jsx";
import AnswerAnimation from "../animations/AnswerAnimation.jsx";
import { useUI } from "../../context/UIContext.jsx";

const STATS = [
  { value: "3", label: "Most relevant passages pulled for every question" },
  { value: "100%", label: "Of answers carry a citation back to the page" },
  { value: "2", label: "Languages understood — English and বাংলা" },
];

export default function AnswerSection() {
  const { openChat } = useUI();
  const [draft, setDraft] = useState("");

  return (
    <section className="grain relative overflow-hidden bg-ink-2 py-16 text-cream sm:py-24 md:py-32">
      <div
        className="pointer-events-none absolute right-0 bottom-0 h-[500px] w-[700px] translate-x-1/3 translate-y-1/3 rounded-full bg-mint/10 blur-[120px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:gap-14 lg:grid-cols-12 lg:gap-12">
          <Reveal className="order-2 min-w-0 lg:order-1 lg:col-span-7">
            <AnswerAnimation />
          </Reveal>

          <div className="order-1 min-w-0 lg:order-2 lg:col-span-5 lg:pt-6">
            <Reveal>
              <p className="font-mono text-xs tracking-[0.2em] text-mint uppercase">How it answers</p>
              <h2 className="mt-4 text-[clamp(2rem,5vw,4rem)] leading-[0.95] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5 sm:text-[clamp(2.25rem,5vw,4rem)]">
                Ask anything. Get answers <span className="text-mint">you can verify.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-pretty text-cream/60 sm:mt-6 sm:text-base">
                Your question is matched against the passages in your documents. Only the closest ones are handed to
                the model, so every answer stays grounded in what you actually uploaded.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  openChat(draft);
                  setDraft("");
                }}
                className="mt-7 flex min-w-0 items-center gap-2 rounded-2xl border border-cream/15 bg-ink p-2 pl-3.5 transition-colors focus-within:border-mint sm:mt-9 sm:pl-4"
              >
                <label htmlFor="try-question" className="sr-only">
                  Ask the Upolabdhi assistant
                </label>
                <input
                  id="try-question"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Try: How does retrieval work?"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-cream outline-none placeholder:text-cream/35 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Ask the assistant"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-ink transition-transform hover:scale-105"
                >
                  <ArrowUp className="size-4" />
                </button>
              </form>
            </Reveal>

            <dl className="mt-10 grid grid-cols-3 gap-3 border-t border-cream/10 pt-6 sm:mt-12 sm:gap-4 sm:pt-8">
              {STATS.map((s, i) => (
                <Reveal key={s.label} delay={i * 80} className="min-w-0">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-bold tracking-tight text-cream sm:text-3xl md:text-4xl">{s.value}</dd>
                  <dd className="mt-1.5 text-[11px] leading-snug text-cream/50 sm:mt-2 sm:text-xs">{s.label}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
