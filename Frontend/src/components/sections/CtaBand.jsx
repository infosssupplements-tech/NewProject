import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import Reveal from "../Reveal.jsx";
import Marquee from "../Marquee.jsx";

export default function CtaBand() {
  return (
    <section className="relative overflow-hidden bg-cream pt-16 text-ink sm:pt-24 md:pt-32">
      {/* Sliding-window animation with medium-light green background and prominent dark black text */}
      <div className="relative border-y border-[#0f3d2e]/15 bg-[#8eeebe] py-4 shadow-inner sm:py-5 md:py-7">
        <Marquee
          slow
          separator="✦"
          items={["Make space for the good questions", "উপলব্ধি", "Understand more", "Grounded RAG Intelligence"]}
          className="text-[clamp(2rem,7vw,6.5rem)] leading-none font-bold tracking-[-0.04em] text-[#07110e]"
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-24">
        <Reveal className="relative overflow-hidden rounded-[26px] bg-ink p-6 text-cream sm:rounded-[32px] sm:p-8 md:p-14">
          <div className="grid-lines absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-20 -right-20 size-80 rounded-full bg-mint/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-7 sm:gap-10 md:flex-row md:items-end">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-[0.2em] text-mint uppercase">A quieter kind of intelligence</p>
              <h2 className="mt-4 max-w-2xl text-[clamp(2rem,5vw,4.25rem)] leading-[0.95] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5 sm:text-[clamp(2.25rem,5vw,4.25rem)]">
                Make space for the <span className="text-mint">good questions.</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="group inline-flex h-12 items-center gap-2.5 rounded-2xl bg-mint px-5 text-sm font-semibold text-ink transition-colors hover:bg-mint-soft sm:h-14 sm:gap-3 sm:px-7 sm:text-base"
              >
                Create free account
                <ArrowUpRight className="size-4.5 transition-transform group-hover:rotate-45 sm:size-5" aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="inline-flex h-12 items-center rounded-2xl border border-cream/20 px-5 text-sm font-semibold text-cream transition-colors hover:border-cream sm:h-14 sm:px-7 sm:text-base"
              >
                Learn more
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
