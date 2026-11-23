import Reveal from "../Reveal.jsx";
import DocumentAnimation from "../animations/DocumentAnimation.jsx";

const STEPS = [
  { n: "01", title: "Normalise", body: "Word, slides or notes are converted to a clean PDF so every file is read the same way." },
  { n: "02", title: "Parse & chunk", body: "Headings, paragraphs and examples are detected, then split into overlapping passages that keep context." },
  { n: "03", title: "Embed & index", body: "Each passage becomes a vector — a numeric fingerprint of its meaning — stored in a searchable index." },
];

export default function DocumentSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-cream py-16 text-ink sm:py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-5">
            <Reveal>
              <p className="font-mono text-xs tracking-[0.2em] text-emerald uppercase">How it reads</p>
              <h2 className="mt-4 text-[clamp(2rem,5vw,4rem)] leading-[0.95] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5 sm:text-[clamp(2.25rem,5vw,4rem)]">
                From any document to a <span className="text-emerald">map of meaning.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-pretty text-ink/60 sm:mt-6 sm:text-base">
                Before you ask a single question, Upolabdhi has already organised your material by what it means —
                not just by the words it uses.
              </p>
            </Reveal>

            <ol className="mt-8 space-y-0 border-t border-ink/10 sm:mt-12">
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 100} className="group grid grid-cols-[1.75rem_1fr] items-start gap-2.5 border-b border-ink/10 py-5 sm:grid-cols-[2rem_1fr] sm:gap-3 sm:py-6">
                  <span className="mt-2 flex size-2.5 rounded-full bg-emerald/60 transition-all duration-300 group-hover:scale-125 group-hover:bg-emerald" />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight sm:text-lg">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal className="min-w-0 lg:col-span-7 lg:pt-6" delay={150}>
            <DocumentAnimation />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
