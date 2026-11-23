import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="grain relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-5 text-center text-cream">
      <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative">
        <p className="font-mono text-xs tracking-[0.2em] text-mint uppercase">Error 404</p>
        <h1 className="mt-4 text-[clamp(5rem,20vw,12rem)] leading-none font-bold tracking-[-0.06em]">Lost?</h1>
        <p className="mt-4 text-cream/60">This page isn&apos;t in any of our documents.</p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 items-center rounded-xl bg-mint px-6 font-semibold text-ink hover:bg-mint-soft"
        >
          Back home
        </Link>
      </div>
    </section>
  );
}
