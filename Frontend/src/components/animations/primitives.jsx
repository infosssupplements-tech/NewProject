export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const ease = (v) => 1 - Math.pow(1 - clamp(v), 3);
/** Maps t into a 0→1 sub-range so elements can start and finish at different moments. */
export const seg = (t, start, end) => clamp((t - start) / (end - start));

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function makeVector(seed, n = 8) {
  const r = seeded(seed);
  return Array.from({ length: n }, () => +(r() * 2 - 1).toFixed(2));
}

export function makeClusters(seed = 7) {
  const r = seeded(seed);
  const centers = [
    { x: 26, y: 32, label: "Entropy", color: "#5ff2b0" },
    { x: 72, y: 28, label: "Heat engines", color: "#f2b54a" },
    { x: 48, y: 72, label: "Laws of thermo", color: "#8fb8ff" },
  ];
  const points = [];
  centers.forEach((c, ci) => {
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2;
      const d = r() * 13;
      points.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d * 0.8, color: c.color, cluster: ci });
    }
  });
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return { centers, points };
}

export function FileCard({ ext = "PDF", name, meta, tone = "dark", accent = "#5ff2b0", className = "", style }) {
  const dark = tone === "dark";
  return (
    <div
      className={`flex max-w-full min-w-0 items-center gap-2.5 rounded-2xl border p-2.5 pr-3.5 sm:gap-3 sm:p-3 sm:pr-5 ${
        dark ? "border-cream/10 bg-ink-3" : "border-ink/10 bg-white"
      } ${className}`}
      style={style}
    >
      <div
        className="relative grid h-11 w-9 shrink-0 place-items-end rounded-md pb-1 font-mono text-[8px] font-bold text-ink sm:h-14 sm:w-11 sm:pb-1.5 sm:text-[9px]"
        style={{ background: accent }}
      >
        <span
          className="absolute top-0 right-0 size-2.5 rounded-bl-md sm:size-3"
          style={{ background: dark ? "#15291f" : "#fff", opacity: 0.8 }}
        />
        <span className="w-full text-center">{ext}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-xs font-semibold sm:text-sm ${dark ? "text-cream" : "text-ink"}`}>{name}</p>
        <p className={`truncate font-mono text-[10px] sm:text-[11px] ${dark ? "text-cream/45" : "text-ink/45"}`}>{meta}</p>
      </div>
    </div>
  );
}

export function DocPage({ t = 1, tone = "dark", scan = null, highlight = null, className = "" }) {
  const dark = tone === "dark";
  const lines = [92, 78, 88, 64, 0, 90, 84, 72, 86, 58, 0, 80, 92, 70];
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border p-3 sm:p-4 ${
        dark ? "border-cream/10 bg-cream text-ink" : "border-ink/10 bg-white text-ink"
      } ${className}`}
    >
      <div className="mb-2.5 h-2.5 w-2/3 rounded-full bg-ink/80 sm:mb-3 sm:h-3" style={{ opacity: clamp(t * 4) }} />
      <div className="mb-3 h-1.5 w-1/3 rounded-full bg-emerald/70 sm:mb-4 sm:h-2" style={{ opacity: clamp(t * 4 - 0.5) }} />
      <div className="space-y-1.5 sm:space-y-2">
        {lines.map((w, i) =>
          w === 0 ? (
            <div key={i} className="h-1.5 sm:h-2" />
          ) : (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-colors duration-300 ${
                highlight && highlight.includes(i) ? "bg-emerald" : "bg-ink/15"
              }`}
              style={{ width: `${w}%`, opacity: clamp(t * 1.6 - i * 0.06) }}
            />
          ),
        )}
      </div>
      {scan !== null && (
        <div
          className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-mint/40 to-transparent"
          style={{ top: `calc(${scan * 100}% - 20px)` }}
          aria-hidden="true"
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-emerald" />
        </div>
      )}
    </div>
  );
}

export function VectorCells({ values, revealed = 1, size = "md" }) {
  const cell = size === "sm" ? "h-3.5 w-2 sm:h-4 sm:w-2.5" : "h-5 w-2.5 sm:h-6 sm:w-3.5";
  return (
    <div className="flex max-w-full flex-wrap gap-[2px] sm:flex-nowrap sm:gap-[3px]">
      {values.map((v, i) => (
        <span
          key={i}
          className={`${cell} shrink-0 rounded-[3px] transition-opacity`}
          style={{
            background: v >= 0 ? `rgba(95,242,176,${0.25 + Math.abs(v) * 0.75})` : `rgba(143,184,255,${0.25 + Math.abs(v) * 0.75})`,
            opacity: i / values.length < revealed ? 1 : 0.08,
          }}
        />
      ))}
    </div>
  );
}

export function Arrow({ tone = "dark", vertical = false, className = "" }) {
  return (
    <svg
      viewBox={vertical ? "0 0 12 48" : "0 0 48 12"}
      className={`${vertical ? "h-10 w-3" : "h-3 w-10"} shrink-0 ${className}`}
      aria-hidden="true"
    >
      {vertical ? (
        <>
          <line x1="6" y1="0" x2="6" y2="40" stroke={tone === "dark" ? "#5ff2b0" : "#0b7a53"} strokeWidth="1.5" className="flow-dash" />
          <path d="M1 38 L6 46 L11 38" fill="none" stroke={tone === "dark" ? "#5ff2b0" : "#0b7a53"} strokeWidth="1.5" />
        </>
      ) : (
        <>
          <line x1="0" y1="6" x2="40" y2="6" stroke={tone === "dark" ? "#5ff2b0" : "#0b7a53"} strokeWidth="1.5" className="flow-dash" />
          <path d="M38 1 L46 6 L38 11" fill="none" stroke={tone === "dark" ? "#5ff2b0" : "#0b7a53"} strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export function StageCaption({ eyebrow, title, tone = "dark" }) {
  return (
    <div className="pointer-events-none absolute top-3 right-3 left-3.5 z-10 sm:top-5 sm:right-5 sm:left-5">
      <p className={`font-mono text-[9px] tracking-[0.2em] uppercase sm:text-[10px] sm:tracking-[0.22em] ${tone === "dark" ? "text-mint" : "text-emerald"}`}>
        {eyebrow}
      </p>
      <p className={`mt-0.5 text-xs font-semibold sm:mt-1 sm:text-sm ${tone === "dark" ? "text-cream" : "text-ink"}`}>{title}</p>
    </div>
  );
}
