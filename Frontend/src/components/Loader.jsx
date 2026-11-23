import { useEffect, useState } from "react";

const STEPS = ["Reading", "Chunking", "Embedding", "Understanding"];

export default function Loader({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1600;
    let frame;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setProgress(Math.round(p * 100));
      if (p < 1) frame = requestAnimationFrame(tick);
      else {
        setLeaving(true);
        setTimeout(onDone, 650);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(progress / 26))];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Upolabdhi"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink transition-[clip-path] duration-700 ease-[cubic-bezier(0.7,0,0.3,1)] ${
        leaving ? "[clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0_0_0_0)]"
      }`}
    >
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative flex flex-col items-center">
        <p className="font-bangla text-6xl font-bold text-cream md:text-8xl">
          {"উপলব্ধি".split("").map((ch, i) => (
            <span
              key={i}
              className="pop-in inline-block"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {ch}
            </span>
          ))}
        </p>
        <p className="mt-6 font-mono text-xs tracking-[0.3em] text-mint uppercase">{step}…</p>
        <div className="mt-6 h-px w-56 overflow-hidden bg-cream/10">
          <div className="h-full bg-mint transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 font-mono text-xs text-cream/40 tabular-nums">{progress}%</p>
      </div>
    </div>
  );
}

export function CircularLoader({ label = "Loading", overlay = false }) {
  return (
    <span className={overlay ? "workspace-loading-overlay" : "workspace-inline-loader"} role="status" aria-label={label}>
      <span className="workspace-loading-spinner" aria-hidden="true" />
      {overlay && <small>{label}</small>}
    </span>
  );
}
