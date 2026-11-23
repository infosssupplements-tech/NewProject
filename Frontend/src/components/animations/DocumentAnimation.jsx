import { Cpu } from "lucide-react";
import PipelineFrame from "./PipelineFrame.jsx";
import { Arrow, DocPage, FileCard, StageCaption, VectorCells, ease, makeClusters, makeVector, seg } from "./primitives.jsx";

const STAGES = [
  { label: "Document", duration: 2400 },
  { label: "To PDF", duration: 3000 },
  { label: "Parse", duration: 3200 },
  { label: "Chunk", duration: 3400 },
  { label: "Embed", duration: 3600 },
  { label: "Vector space", duration: 4600 },
];

const { centers, points } = makeClusters(11);

const RIBBON =
  "Entropy measures how many microscopic arrangements produce the same macroscopic state. A Carnot engine operating between two reservoirs sets the upper bound for efficiency.";

function DocumentScene({ t }) {
  const p = ease(seg(t, 0, 0.5));
  return (
    <div className="flex h-full min-w-0 items-center justify-center px-4 pt-12 sm:px-6 sm:pt-8">
      <div className="w-full max-w-xs min-w-0 space-y-2.5 sm:space-y-3" style={{ opacity: p, transform: `scale(${0.92 + p * 0.08})` }}>
        <FileCard tone="light" ext="DOCX" accent="#8fb8ff" name="lecture-07-entropy.docx" meta="Word document · 18 pages" />
        <FileCard
          tone="light"
          ext="PPTX"
          accent="#f2b54a"
          name="slides-week-3.pptx"
          meta="Presentation · 42 slides"
          style={{ opacity: seg(t, 0.35, 0.6) }}
        />
        <FileCard
          tone="light"
          ext="TXT"
          accent="#dcefe4"
          name="my-notes.txt"
          meta="Plain text · 3 KB"
          style={{ opacity: seg(t, 0.5, 0.75) }}
        />
      </div>
    </div>
  );
}

function ConvertScene({ t }) {
  const p = seg(t, 0.15, 0.85);
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-2.5 px-4 pt-12 sm:flex-row sm:gap-4 sm:px-6 sm:pt-8">
      <FileCard
        tone="light"
        ext="DOCX"
        accent="#8fb8ff"
        name="lecture-07.docx"
        meta="Source"
        className="w-full max-w-[230px] sm:w-auto"
        style={{ opacity: 1 - p * 0.5 }}
      />
      <div className="flex flex-col items-center gap-1 sm:gap-2">
        <Arrow tone="light" className="rotate-90 sm:rotate-0" />
        <span className="font-mono text-[10px] text-ink/50 tabular-nums">{Math.round(p * 100)}%</span>
      </div>
      <FileCard
        tone="light"
        ext="PDF"
        accent="#5ff2b0"
        name="lecture-07.pdf"
        meta="Normalised · 18 pages"
        className="w-full max-w-[230px] sm:w-auto"
        style={{ opacity: seg(t, 0.5, 0.9), transform: `translateY(${(1 - ease(seg(t, 0.5, 0.9))) * 12}px)` }}
      />
    </div>
  );
}

function ParseScene({ t }) {
  const groups = [[0, 1, 2, 3], [5, 6, 7, 8, 9], [11, 12, 13]];
  const active = Math.min(2, Math.floor(t * 3));
  const labels = ["Heading + intro", "Body paragraph", "Worked example"];
  return (
    <div className="flex h-full min-w-0 items-center justify-center gap-3 px-3.5 pt-12 sm:gap-6 sm:px-6 sm:pt-10">
      <div className="w-28 shrink-0 sm:w-48">
        <DocPage tone="light" highlight={groups[active]} />
      </div>
      <ul className="min-w-0 space-y-2">
        {labels.map((l, i) => (
          <li
            key={l}
            className={`truncate rounded-lg border px-2.5 py-2 font-mono text-[10px] transition-colors sm:px-3 sm:text-[11px] ${
              i === active ? "border-emerald bg-emerald text-cream" : i < active ? "border-ink/15 text-ink/70" : "border-ink/10 text-ink/30"
            }`}
          >
            {i <= active ? "✓ " : "· "}
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChunkScene({ t }) {
  const words = RIBBON.split(" ");
  const windows = [
    [0, 10, "#5ff2b0"],
    [7, 18, "#f2b54a"],
    [15, words.length, "#8fb8ff"],
  ];
  const visible = Math.min(3, Math.floor(seg(t, 0.1, 0.85) * 3) + 1);
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-3.5 px-3.5 pt-12 sm:gap-4 sm:px-5 sm:pt-10">
      <p className="max-w-full text-center text-xs leading-relaxed text-ink/40 sm:max-w-xl sm:text-base">
        {words.map((w, i) => {
          const owners = windows.slice(0, visible).filter(([s, e]) => i >= s && i < e);
          const color = owners.length ? owners[owners.length - 1][2] : null;
          return (
            <span
              key={i}
              className="mx-[1px] inline-block rounded px-0.5 transition-colors duration-300"
              style={{
                background: color ? `${color}55` : "transparent",
                color: color ? "#07110e" : undefined,
                boxShadow: owners.length > 1 ? "inset 0 -2px 0 #07110e" : "none",
              }}
            >
              {w}
            </span>
          );
        })}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 font-mono text-[9px] text-ink/60 uppercase sm:gap-2 sm:text-[10px]">
        {windows.slice(0, visible).map(([, , c], i) => (
          <span key={i} className="pop-in flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2 py-1 sm:px-2.5">
            <span className="size-2 rounded-full" style={{ background: c }} /> chunk {i + 1}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2 py-1 sm:px-2.5">
          <span className="h-0.5 w-3 bg-ink" /> overlap
        </span>
      </div>
    </div>
  );
}

function EmbedScene({ t }) {
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-2.5 px-3.5 pt-12 sm:gap-4 md:flex-row md:gap-5 md:px-5 md:pt-10">
      <div className="w-full max-w-[220px] space-y-1.5 sm:w-44 sm:space-y-2">
        {["#5ff2b0", "#f2b54a", "#8fb8ff"].map((c, i) => (
          <p
            key={c}
            className="w-full truncate rounded-lg border-l-4 bg-white px-2.5 py-1.5 text-[11px] text-ink/70 sm:px-3 sm:py-2 sm:text-xs"
            style={{ borderColor: c, opacity: seg(t, i * 0.1, i * 0.1 + 0.2) }}
          >
            {RIBBON.split(" ").slice(i * 8, i * 8 + 6).join(" ")}…
          </p>
        ))}
      </div>
      <Arrow tone="light" className="hidden md:block" />
      <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-mint sm:size-20">
        <span className="pulse-ring absolute inset-0 rounded-2xl border border-mint" aria-hidden="true" />
        <Cpu className="size-5 sm:size-8" aria-hidden="true" />
        <span className="hidden font-mono text-[10px] whitespace-nowrap text-ink/50 sm:absolute sm:-bottom-6 sm:block">embedding model</span>
      </div>
      <Arrow tone="light" className="hidden md:block" />
      <div className="max-w-full space-y-1.5 rounded-xl bg-ink p-2.5 sm:space-y-2 sm:p-3">
        {[0, 1, 2].map((i) => (
          <VectorCells key={i} values={makeVector(20 + i, 14)} revealed={seg(t, 0.35 + i * 0.12, 0.7 + i * 0.1)} size="sm" />
        ))}
        <p className="pt-0.5 font-mono text-[9px] text-cream/40 sm:pt-1 sm:text-[10px]">1536 dimensions each</p>
      </div>
    </div>
  );
}

function SpaceScene({ t }) {
  const shown = Math.floor(seg(t, 0, 0.75) * points.length);
  return (
    <div className="absolute inset-0 overflow-hidden px-3 pt-12 pb-3 sm:px-4 sm:pt-14 sm:pb-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="grid-lines-dark size-full rounded-xl" aria-hidden="true">
        {points.slice(0, shown).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.4" fill={p.color} stroke="#07110e" strokeWidth="0.3" className="pop-in" />
        ))}
      </svg>
      {centers.map((c, i) => (
        <span
          key={c.label}
          className="absolute rounded-full bg-ink px-2 py-0.5 font-mono text-[9px] whitespace-nowrap text-cream transition-opacity duration-500 sm:px-2.5 sm:py-1 sm:text-[10px]"
          style={{
            left: `calc(${c.x}% )`,
            top: `calc(${c.y * 0.8 + 14}% )`,
            transform: "translate(-50%, -50%)",
            opacity: seg(t, 0.6 + i * 0.08, 0.75 + i * 0.08),
          }}
        >
          {c.label}
        </span>
      ))}
    </div>
  );
}

const SCENES = [
  { C: DocumentScene, eyebrow: "Document", title: "Any file you study from" },
  { C: ConvertScene, eyebrow: "Normalise", title: "Converted to a clean PDF" },
  { C: ParseScene, eyebrow: "Parse", title: "Structure is understood" },
  { C: ChunkScene, eyebrow: "Chunk", title: "Sliding windows keep context" },
  { C: EmbedScene, eyebrow: "Embed", title: "Meaning becomes numbers" },
  { C: SpaceScene, eyebrow: "Vector space", title: "Similar ideas live close together" },
];

export default function DocumentAnimation() {
  return (
    <PipelineFrame
      theme="light"
      title="upolabdhi / document → vectors"
      stages={STAGES}
      label="Animated walkthrough: a document is converted to PDF, parsed, chunked with overlap, embedded and placed in a vector space where similar topics cluster."
    >
      {(stage, t) => {
        const { C, eyebrow, title } = SCENES[stage];
        return (
          <div key={stage} className="fade-in absolute inset-0">
            <StageCaption eyebrow={eyebrow} title={title} tone="light" />
            <C t={t} />
          </div>
        );
      }}
    </PipelineFrame>
  );
}
