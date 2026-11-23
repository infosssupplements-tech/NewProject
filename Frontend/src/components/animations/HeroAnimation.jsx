import { UploadCloud, Database } from "lucide-react";
import PipelineFrame from "./PipelineFrame.jsx";
import { Arrow, DocPage, FileCard, StageCaption, VectorCells, clamp, ease, makeVector, seg } from "./primitives.jsx";

const STAGES = [
  { label: "Upload", duration: 3000 },
  { label: "Display", duration: 2600 },
  { label: "Extract", duration: 3600 },
  { label: "Chunk", duration: 3400 },
  { label: "Embed", duration: 4200 },
];

const EXTRACTED =
  "The second law of thermodynamics states that the total entropy of an isolated system can never decrease over time. Heat flows spontaneously from hotter to colder bodies, which is why no engine can convert heat entirely into work.";

const CHUNKS = [
  { text: "The second law of thermodynamics states that the total entropy…", color: "#5ff2b0" },
  { text: "…entropy of an isolated system can never decrease over time.", color: "#f2b54a" },
  { text: "Heat flows spontaneously from hotter to colder bodies…", color: "#8fb8ff" },
  { text: "…which is why no engine can convert heat entirely into work.", color: "#f59ec0" },
];

function Upload({ t }) {
  const drop = ease(seg(t, 0, 0.35));
  const progress = seg(t, 0.35, 0.95);
  return (
    <div className="flex h-full flex-col items-center justify-center px-3.5 pt-10 sm:px-6 sm:pt-6">
      <div className="relative flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-dashed border-mint/40 bg-mint/[0.03] px-4 py-6 sm:px-6 sm:py-10">
        <UploadCloud className="size-8 text-mint sm:size-9" aria-hidden="true" />
        <p className="mt-2.5 text-xs text-cream/60 sm:mt-3 sm:text-sm">Drop a PDF to start</p>
        <FileCard
          name="thermodynamics-notes.pdf"
          meta={`2.4 MB · ${Math.round(progress * 100)}% uploaded`}
          className="mt-4 w-full max-w-xs sm:mt-6"
          style={{ transform: `translateY(${(1 - drop) * -70}px)`, opacity: drop }}
        />
        <div className="mt-3.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-cream/10 sm:mt-4">
          <div className="h-full rounded-full bg-mint" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function Display({ t }) {
  return (
    <div className="flex h-full items-center justify-center gap-4 px-4 pt-12 sm:gap-6 sm:px-6 sm:pt-10">
      <div className="w-36 sm:w-52" style={{ transform: `scale(${0.9 + ease(t) * 0.1})` }}>
        <DocPage t={t} />
      </div>
      <div className="hidden w-48 space-y-3 sm:block">
        {["12 pages", "4,812 words", "English · Bengali", "Scanned: no"].map((s, i) => (
          <p
            key={s}
            className="rounded-lg border border-cream/10 bg-ink-3 px-3 py-2 font-mono text-[11px] text-cream/70"
            style={{ opacity: seg(t, 0.2 + i * 0.12, 0.4 + i * 0.12) }}
          >
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}

function Extract({ t }) {
  const chars = Math.floor(seg(t, 0.1, 0.95) * EXTRACTED.length);
  return (
    <div className="flex h-full min-w-0 items-center justify-center gap-3 px-3.5 pt-12 sm:gap-6 sm:px-5 sm:pt-10">
      <div className="w-24 shrink-0 sm:w-44">
        <DocPage scan={(t * 2) % 1 > 0.5 ? 2 - ((t * 2) % 1) * 2 : ((t * 2) % 1) * 2} />
      </div>
      <Arrow className="hidden sm:block" />
      <div className="h-48 min-w-0 flex-1 max-w-xs overflow-hidden rounded-xl border border-cream/10 bg-ink p-3 font-mono text-[10px] leading-relaxed text-mint-soft sm:h-56 sm:p-4 sm:text-xs">
        <p className="mb-1.5 text-[9px] tracking-widest text-cream/40 uppercase sm:mb-2 sm:text-[10px]">extracted.txt</p>
        <p className={t < 0.98 ? "caret" : ""}>{EXTRACTED.slice(0, chars)}</p>
      </div>
    </div>
  );
}

function Chunk({ t }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-2 px-3.5 pt-12 sm:gap-2.5 sm:px-5 sm:pt-10">
      {CHUNKS.map((c, i) => {
        const p = ease(seg(t, i * 0.18, i * 0.18 + 0.3));
        return (
          <div key={i} className="flex w-full max-w-lg min-w-0 items-center gap-2 sm:gap-3" style={{ opacity: p, transform: `translateX(${(1 - p) * -20}px)` }}>
            <span className="w-11 shrink-0 font-mono text-[9px] text-cream/40 sm:w-14 sm:text-[10px]">chunk_{i + 1}</span>
            <p
              className="min-w-0 flex-1 truncate rounded-lg border-l-4 bg-ink-3 px-2.5 py-2 text-[11px] text-cream/80 sm:whitespace-normal sm:px-3 sm:py-2.5 sm:text-sm"
              style={{ borderColor: c.color }}
            >
              {c.text}
            </p>
          </div>
        );
      })}
      <p className="mt-1.5 font-mono text-[9px] tracking-wider text-cream/40 uppercase sm:mt-2 sm:text-[10px]" style={{ opacity: seg(t, 0.75, 0.9) }}>
        512 tokens · 64 token overlap
      </p>
    </div>
  );
}

function Embed({ t }) {
  const stored = Math.round(seg(t, 0.55, 0.95) * 128);
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-4 px-3.5 pt-12 sm:flex-row sm:gap-6 sm:px-5 sm:pt-10">
      <div className="max-w-full space-y-2 sm:space-y-2.5">
        {CHUNKS.map((c, i) => {
          const p = seg(t, i * 0.1, i * 0.1 + 0.35);
          return (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <VectorCells values={makeVector(i + 3, 12)} revealed={p} size="sm" />
              <span className="hidden font-mono text-[10px] text-cream/40 md:inline" style={{ opacity: p }}>
                [{makeVector(i + 3, 3).join(", ")}, …]
              </span>
            </div>
          );
        })}
      </div>
      <Arrow className="hidden sm:block" />
      <div
        className="flex max-w-full items-center gap-3 rounded-2xl border border-mint/30 bg-mint/5 px-4 py-3 sm:px-5 sm:py-4"
        style={{ opacity: clamp(seg(t, 0.4, 0.6)) }}
      >
        <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-ink sm:size-11">
          <Database className="size-4 sm:size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-cream sm:text-sm">Vector index</p>
          <p className="font-mono text-[10px] text-mint tabular-nums sm:text-[11px]">{stored} / 128 vectors stored</p>
        </div>
      </div>
    </div>
  );
}

const SCENES = [
  { C: Upload, eyebrow: "Upload", title: "Your PDF enters the workspace" },
  { C: Display, eyebrow: "Display", title: "We render and inspect every page" },
  { C: Extract, eyebrow: "Extract", title: "Text is pulled out, line by line" },
  { C: Chunk, eyebrow: "Chunk", title: "Split into overlapping passages" },
  { C: Embed, eyebrow: "Embed", title: "Each passage becomes a vector" },
];

export default function HeroAnimation() {
  return (
    <PipelineFrame
      title="upolabdhi / ingest pipeline"
      stages={STAGES}
      label="Animated walkthrough: a PDF is uploaded, displayed, its text extracted, split into chunks and converted into vector embeddings."
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
