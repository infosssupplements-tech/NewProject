import { ArrowUpRight, Check, Play } from "lucide-react";
import Marquee from "../Marquee.jsx";
import HeroAnimation from "../animations/HeroAnimation.jsx";
import { useUI } from "../../context/UIContext.jsx";

const TICKER = ["Upload", "Read", "Ask", "Retrieve", "Understand", "Remember", "Practise"];

export default function Hero() {
  const { openWorkspace, openChat } = useUI();

  return (
    <section className="grain relative overflow-hidden bg-ink pt-24 pb-0 text-cream md:pt-28">
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-mint/15 blur-[120px]"
        aria-hidden="true"
      />

      {/* Main First Slide Content */}
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-8 sm:px-5 sm:gap-14 sm:pb-10 md:px-8 md:pb-12 lg:grid-cols-12 lg:items-center lg:gap-8 xl:gap-12">
        <div className="min-w-0 lg:col-span-6 xl:col-span-6">
          <p className="pop-in flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-cream/70 uppercase sm:gap-2.5 sm:text-xs sm:tracking-[0.2em]">
            <span className="relative flex size-2 shrink-0">
              <span className="pulse-ring absolute inset-0 rounded-full bg-mint" />
              <span className="relative size-2 rounded-full bg-mint" />
            </span>
            RAG question answering
          </p>

          <h1 className="mt-5 text-[clamp(2.5rem,7.5vw,3.5rem)] font-bold tracking-[-0.015em] text-balance sm:mt-6 sm:text-6xl sm:leading-[1.04] sm:tracking-[-0.02em] lg:text-[clamp(3.35rem,4.4vw,4.75rem)] lg:leading-[1.02]">
            <span className="pop-in block" style={{ animationDelay: "80ms" }}>
              <span className="inline-block tracking-normal">Turn</span> every document into a
            </span>
            <span className="pop-in block text-mint whitespace-nowrap" style={{ animationDelay: "180ms" }}>
              conversation.
            </span>
          </h1>

          <p
            className="pop-in mt-5 max-w-xl text-base leading-relaxed text-pretty text-cream/65 sm:mt-7 sm:text-lg"
            style={{ animationDelay: "280ms" }}
          >
            <span className="font-bangla font-semibold text-cream">উপলব্ধি</span> reads your PDFs and notes, finds the
            passages that matter and answers your questions with the source right beside it — built to help you
            understand, not just search.
          </p>

          <div className="pop-in mt-7 flex flex-wrap items-center gap-3.5 sm:mt-9 sm:gap-4" style={{ animationDelay: "380ms" }}>
            <button
              type="button"
              onClick={openWorkspace}
              className="group inline-flex h-12 items-center gap-3 rounded-2xl bg-mint pr-4 pl-5 text-sm font-semibold text-ink shadow-[0_20px_50px_-15px_rgba(95,242,176,0.6)] transition-all hover:bg-mint-soft active:scale-[0.97] sm:h-14 sm:gap-4 sm:pr-5 sm:pl-7 sm:text-base"
            >
              Start learning
              <ArrowUpRight className="size-4.5 transition-transform duration-300 group-hover:rotate-45 sm:size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => openChat()}
              className="group inline-flex items-center gap-2.5 text-sm font-semibold text-cream sm:gap-3 sm:text-base"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-cream/20 transition-colors group-hover:border-mint group-hover:bg-mint group-hover:text-ink sm:size-11">
                <Play className="size-3.5 fill-current sm:size-4" aria-hidden="true" />
              </span>
              Ask the assistant
            </button>
          </div>

          <ul className="pop-in mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-cream/55 sm:mt-9 sm:gap-x-6 sm:text-sm" style={{ animationDelay: "460ms" }}>
            {["Context-aware answers", "Cited sources", "Private by default"].map((s) => (
              <li key={s} className="flex items-center gap-1.5 sm:gap-2">
                <Check className="size-3.5 shrink-0 text-mint sm:size-4" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="pop-in min-w-0 lg:col-span-6 xl:col-span-6" style={{ animationDelay: "300ms" }}>
          <HeroAnimation />
        </div>
      </div>

      {/* Repositioned Sliding-Window Animation directly under the first slide */}
      <div className="relative border-t border-cream/10 bg-ink-2/60 backdrop-blur-sm">
        <Marquee
          items={TICKER}
          className="py-3.5 font-mono text-[11px] tracking-[0.3em] text-cream/55 uppercase"
        />
      </div>
    </section>
  );
}
