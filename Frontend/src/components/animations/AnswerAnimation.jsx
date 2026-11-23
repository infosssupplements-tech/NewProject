import { Search, Sparkles, ShieldCheck } from "lucide-react";
import PipelineFrame from "./PipelineFrame.jsx";
import { Arrow, StageCaption, VectorCells, ease, makeClusters, makeVector, seg } from "./primitives.jsx";

const STAGES = [
  { label: "Ask", duration: 3000 },
  { label: "Embed query", duration: 2600 },
  { label: "Search", duration: 3600 },
  { label: "Retrieve", duration: 3200 },
  { label: "Generate", duration: 3000 },
  { label: "Answer", duration: 5200 },
];

const QUESTION = "Why can't a heat engine be 100% efficient?";
const ANSWER =
  "Because some heat must always be rejected to the cold reservoir. The second law says entropy can't decrease, so converting all heat into work is impossible. The best case is the Carnot limit: η = 1 − Tc / Th.";

const { points } = makeClusters(11);
const QUERY = { x: 70, y: 32 };
const nearest = [...points]
  .map((p) => ({ ...p, d: Math.hypot(p.x - QUERY.x, p.y - QUERY.y) }))
  .sort((a, b) => a.d - b.d)
  .slice(0, 3);

const RETRIEVED = [
  { score: 0.92, page: "p. 7", text: "No cyclic engine can convert heat entirely into work; some must be rejected…" },
  { score: 0.88, page: "p. 4", text: "The total entropy of an isolated system can never decrease over time…" },
  { score: 0.81, page: "p. 9", text: "Carnot efficiency η = 1 − Tc/Th sets the theoretical upper bound…" },
];

function AskScene({ t }) {
  const chars = Math.floor(seg(t, 0.1, 0.8) * QUESTION.length);
  return (
    <div className="flex h-full min-w-0 items-center justify-center px-3.5 pt-10 sm:px-5">
      <div className="w-full max-w-lg min-w-0">
        <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-cream/15 bg-ink px-3 py-3 sm:gap-3 sm:px-4 sm:py-4">
          <Search className="size-4 shrink-0 text-mint sm:size-5" aria-hidden="true" />
          <p className={`min-h-6 min-w-0 flex-1 text-xs text-cream sm:text-base ${t < 0.85 ? "caret" : ""}`}>{QUESTION.slice(0, chars)}</p>
          <span
            className="shrink-0 rounded-lg bg-mint px-2.5 py-1 text-[11px] font-semibold text-ink transition-transform sm:px-3 sm:py-1.5 sm:text-xs"
            style={{ transform: `scale(${t > 0.85 ? 0.92 : 1})` }}
          >
            Ask
          </span>
        </div>
        <p className="mt-2.5 text-center font-mono text-[9px] tracking-wider text-cream/40 uppercase sm:mt-3 sm:text-[10px]">
          Searching inside · thermodynamics-notes.pdf
        </p>
      </div>
    </div>
  );
}

function EmbedQueryScene({ t }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-3 px-3.5 pt-12 sm:flex-row sm:gap-5 sm:px-5 sm:pt-8">
      <p className="max-w-full rounded-xl border border-cream/10 bg-ink px-3.5 py-2.5 text-xs text-cream/80 sm:max-w-[220px] sm:px-4 sm:py-3 sm:text-sm">
        {QUESTION}
      </p>
      <Arrow className="rotate-90 sm:rotate-0" />
      <div className="max-w-full rounded-xl border border-mint/30 bg-mint/5 p-3 sm:p-4">
        <VectorCells values={makeVector(99, 16)} revealed={seg(t, 0.15, 0.85)} />
        <p className="mt-2 font-mono text-[9px] text-mint sm:text-[10px]">query_vector · 1536d</p>
      </div>
    </div>
  );
}

function SearchScene({ t }) {
  const radius = ease(seg(t, 0.1, 0.6)) * 16;
  const lines = seg(t, 0.5, 0.9);
  return (
    <div className="absolute inset-0 overflow-hidden px-3 pt-12 pb-3 sm:px-4 sm:pt-14 sm:pb-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="grid-lines size-full rounded-xl" aria-hidden="true">
        {points.map((p, i) => {
          const hit = nearest.some((n) => n.x === p.x && n.y === p.y);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hit && lines > 0 ? 1.9 : 1.2}
              fill={hit && lines > 0 ? "#5ff2b0" : "#f3f1ea"}
              opacity={hit && lines > 0 ? 1 : 0.28}
            />
          );
        })}
        <ellipse cx={QUERY.x} cy={QUERY.y} rx={radius} ry={radius * 1.2} fill="rgba(95,242,176,0.08)" stroke="#5ff2b0" strokeWidth="0.3" strokeDasharray="1 1" />
        {nearest.map((n, i) => (
          <line
            key={i}
            x1={QUERY.x}
            y1={QUERY.y}
            x2={QUERY.x + (n.x - QUERY.x) * lines}
            y2={QUERY.y + (n.y - QUERY.y) * lines}
            stroke="#5ff2b0"
            strokeWidth="0.35"
          />
        ))}
        <circle cx={QUERY.x} cy={QUERY.y} r="2.2" fill="#f2b54a" stroke="#07110e" strokeWidth="0.4" />
      </svg>
      <span
        className="absolute rounded-full bg-amber px-2 py-0.5 font-mono text-[9px] text-ink sm:px-2.5 sm:py-1 sm:text-[10px]"
        style={{ left: `${QUERY.x}%`, top: `calc(${QUERY.y * 0.75}% + 3.5rem)`, transform: "translate(-50%, -160%)" }}
      >
        your question
      </span>
      <p className="absolute right-4 bottom-4 font-mono text-[9px] text-mint sm:right-5 sm:bottom-6 sm:text-[10px]" style={{ opacity: lines }}>
        cosine similarity · top-k = 3
      </p>
    </div>
  );
}

function RetrieveScene({ t }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-2 px-3.5 pt-12 sm:gap-2.5 sm:px-5 sm:pt-10">
      {RETRIEVED.map((r, i) => {
        const p = ease(seg(t, i * 0.2, i * 0.2 + 0.35));
        return (
          <div
            key={r.page}
            className="flex w-full max-w-lg min-w-0 items-start gap-2.5 rounded-xl border border-cream/10 bg-ink px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
            style={{ opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}
          >
            <span className="shrink-0 rounded-md bg-mint/15 px-1.5 py-0.5 font-mono text-[10px] text-mint tabular-nums sm:px-2 sm:py-1 sm:text-[11px]">
              {r.score.toFixed(2)}
            </span>
            <p className="min-w-0 flex-1 line-clamp-2 text-[11px] leading-relaxed text-cream/75 sm:line-clamp-none sm:text-sm">{r.text}</p>
            <span className="shrink-0 font-mono text-[9px] whitespace-nowrap text-cream/40 sm:text-[10px]">{r.page}</span>
          </div>
        );
      })}
    </div>
  );
}

function GenerateScene({ t }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-3 px-3.5 pt-12 sm:flex-row sm:gap-5 sm:px-5 sm:pt-8">
      <div className="space-y-1.5 sm:space-y-2">
        <p className="rounded-lg border border-cream/10 bg-ink px-3 py-1.5 font-mono text-[10px] text-cream/60 sm:py-2">question</p>
        <p className="rounded-lg border border-mint/30 bg-mint/5 px-3 py-1.5 font-mono text-[10px] text-mint sm:py-2">3 retrieved chunks</p>
        <p className="rounded-lg border border-cream/10 bg-ink px-3 py-1.5 font-mono text-[10px] text-cream/60 sm:py-2">“answer only from sources”</p>
      </div>
      <Arrow className="rotate-90 sm:rotate-0" />
      <div className="relative grid size-16 shrink-0 place-items-center rounded-3xl bg-mint text-ink sm:size-24">
        <span className="pulse-ring absolute inset-0 rounded-3xl bg-mint" aria-hidden="true" />
        <Sparkles className="relative size-7 sm:size-9" style={{ transform: `rotate(${t * 180}deg)` }} aria-hidden="true" />
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="h-2 w-4 rounded-full bg-mint sm:w-5"
            style={{ opacity: seg(t, 0.3 + i * 0.1, 0.4 + i * 0.1) }}
          />
        ))}
      </div>
    </div>
  );
}

function AnswerScene({ t }) {
  const chars = Math.floor(seg(t, 0.05, 0.75) * ANSWER.length);
  return (
    <div className="flex h-full min-w-0 items-center justify-center px-3.5 pt-12 sm:px-5 sm:pt-10">
      <div className="w-full max-w-lg min-w-0 rounded-2xl bg-cream p-3.5 text-ink sm:p-5">
        <p className="text-[11px] font-semibold text-ink/50 sm:text-xs">{QUESTION}</p>
        <p className={`mt-2 min-h-20 text-xs leading-relaxed sm:mt-3 sm:min-h-24 sm:text-[15px] ${t < 0.75 ? "caret" : ""}`}>
          {ANSWER.slice(0, chars)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2" style={{ opacity: seg(t, 0.75, 0.9) }}>
          {RETRIEVED.map((r) => (
            <span key={r.page} className="rounded-full border border-ink/15 bg-white px-2 py-0.5 font-mono text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px]">
              [{r.page}]
            </span>
          ))}
          <span className="ml-auto flex items-center gap-1 font-mono text-[9px] text-emerald sm:text-[10px]">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> grounded in 3 sources
          </span>
        </div>
      </div>
    </div>
  );
}

const SCENES = [
  { C: AskScene, eyebrow: "Ask", title: "You ask in plain language" },
  { C: EmbedQueryScene, eyebrow: "Embed", title: "The question becomes a vector too" },
  { C: SearchScene, eyebrow: "Search", title: "Find the closest passages" },
  { C: RetrieveScene, eyebrow: "Retrieve", title: "Top matches, ranked by similarity" },
  { C: GenerateScene, eyebrow: "Generate", title: "The model reads only your sources" },
  { C: AnswerScene, eyebrow: "Answer", title: "A clear answer, with citations" },
];

export default function AnswerAnimation() {
  return (
    <PipelineFrame
      title="upolabdhi / question → answer"
      stages={STAGES}
      label="Animated walkthrough: a question is embedded, the closest passages are found by similarity search, retrieved, and a language model writes an answer with citations."
    >
      {(stage, t) => {
        const { C, eyebrow, title } = SCENES[stage];
        return (
          <div key={stage} className="fade-in absolute inset-0">
            <StageCaption eyebrow={eyebrow} title={title} />
            <C t={t} />
          </div>
        );
      }}
    </PipelineFrame>
  );
}
