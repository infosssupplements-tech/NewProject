import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useInView } from "../Reveal.jsx";

const THEMES = {
  dark: {
    shell: "bg-ink-2/90 border-cream/10 text-cream",
    bar: "border-cream/10",
    muted: "text-cream/45",
    chip: "text-cream/50 hover:text-cream",
    chipActive: "bg-mint text-ink",
    track: "bg-cream/10",
    fill: "bg-mint",
    btn: "border-cream/15 hover:bg-cream/10",
  },
  light: {
    shell: "bg-paper border-ink/10 text-ink",
    bar: "border-ink/10",
    muted: "text-ink/45",
    chip: "text-ink/50 hover:text-ink",
    chipActive: "bg-ink text-cream",
    track: "bg-ink/10",
    fill: "bg-emerald",
    btn: "border-ink/15 hover:bg-ink/5",
  },
};

export default function PipelineFrame({ title, stages, theme = "dark", label, children }) {
  const c = THEMES[theme];
  const [stage, setStage] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ref, inView] = useInView({ threshold: 0.25, once: false });
  const elapsed = useRef(0);
  const stageRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setPlaying(false);
  }, []);

  useEffect(() => {
    if (!playing || !inView) return;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      elapsed.current += now - last;
      last = now;
      const duration = stages[stageRef.current].duration;
      if (elapsed.current >= duration) {
        elapsed.current = 0;
        stageRef.current = (stageRef.current + 1) % stages.length;
        setStage(stageRef.current);
        setT(0);
      } else {
        setT(elapsed.current / duration);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, inView, stages]);

  const jump = (i) => {
    stageRef.current = i;
    elapsed.current = 0;
    setStage(i);
    setT(playing ? 0 : 1);
  };

  return (
    <figure
      ref={ref}
      aria-label={label}
      className={`relative w-full max-w-full min-w-0 overflow-hidden rounded-[22px] border shadow-[0_40px_120px_-40px_rgba(0,0,0,0.55)] backdrop-blur ${c.shell}`}
    >
      <div className={`flex min-w-0 items-center gap-3 border-b px-3.5 py-2.5 sm:px-4 sm:py-3 ${c.bar}`}>
        <span className="flex shrink-0 gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff6159]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#28c941]" />
        </span>
        <span className={`min-w-0 flex-1 truncate font-mono text-[10px] tracking-[0.16em] uppercase sm:text-[11px] sm:tracking-[0.18em] ${c.muted}`}>
          {title}
        </span>
      </div>

      <div className="relative h-[340px] w-full overflow-hidden sm:h-[400px] md:h-[440px]" aria-live="polite">
        <span className="sr-only">
          Step {stage + 1}: {stages[stage].label}
        </span>
        {children(stage, playing ? t : 1)}
      </div>

      <figcaption className={`min-w-0 border-t px-2.5 py-2.5 sm:px-3 sm:py-3 ${c.bar}`}>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause animation" : "Play animation"}
            className={`grid size-7 shrink-0 place-items-center rounded-full border transition-colors sm:size-8 ${c.btn}`}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => jump(0)}
            aria-label="Restart animation"
            className={`grid size-7 shrink-0 place-items-center rounded-full border transition-colors sm:size-8 ${c.btn}`}
          >
            <RotateCcw className="size-3.5" />
          </button>
          <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {stages.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => jump(i)}
                aria-current={i === stage ? "step" : undefined}
                className={`relative shrink-0 overflow-hidden rounded-full px-2.5 py-1 font-mono text-[9px] tracking-wider whitespace-nowrap uppercase transition-colors sm:px-3 sm:py-1.5 sm:text-[10px] ${
                  i === stage ? c.chipActive : c.chip
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex gap-1 sm:mt-3" aria-hidden="true">
          {stages.map((s, i) => (
            <span key={s.label} className={`h-0.5 flex-1 overflow-hidden rounded-full ${c.track}`}>
              <span
                className={`block h-full origin-left ${c.fill}`}
                style={{ transform: `scaleX(${i < stage ? 1 : i === stage ? (playing ? t : 1) : 0})` }}
              />
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
