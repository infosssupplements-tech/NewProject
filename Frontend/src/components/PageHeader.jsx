export default function PageHeader({ eyebrow, title, accent, children }) {
  return (
    <section className="grain relative overflow-hidden bg-ink pt-32 pb-16 text-cream sm:pt-36 sm:pb-20 md:pt-44 md:pb-28">
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[700px] rounded-full bg-mint/12 blur-[120px]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <p className="pop-in font-mono text-xs tracking-[0.2em] text-mint uppercase">{eyebrow}</p>
        <h1
          className="pop-in mt-5 max-w-4xl text-[clamp(2.15rem,8vw,6rem)] leading-[0.94] font-bold tracking-[-0.045em] text-balance break-words sm:mt-6 sm:text-[clamp(2.75rem,8vw,6rem)] sm:leading-[0.92] sm:tracking-[-0.05em]"
          style={{ animationDelay: "80ms" }}
        >
          {title} {accent && <span className="text-mint">{accent}</span>}
        </h1>
        {children && (
          <div className="pop-in mt-6 max-w-2xl text-base leading-relaxed text-pretty text-cream/60 sm:mt-8 sm:text-lg" style={{ animationDelay: "180ms" }}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
