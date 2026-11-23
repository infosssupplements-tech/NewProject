import { BookOpenCheck, FileStack, Languages, Lock, Quote, ScrollText, Brain } from "lucide-react";
import Reveal from "../Reveal.jsx";
import CardSlider from "../CardSlider.jsx";

const FEATURES = [
  {
    icon: Quote,
    tag: "Trust",
    title: "Answers with receipts",
    body: "Every reply links back to the exact page and passage it came from, so you can check it in a click.",
    tone: "bg-ink text-cream",
  },
  {
    icon: FileStack,
    tag: "Scale",
    title: "Long documents, no problem",
    body: "Textbooks, theses and 200-page reports are chunked and indexed in the background while you keep working.",
    tone: "bg-paper text-ink",
  },
  {
    icon: Languages,
    tag: "Language",
    title: "English and বাংলা",
    body: "Ask in the language you think in. Upolabdhi understands mixed Bengali and English material.",
    tone: "bg-mint text-ink",
  },
  {
    icon: Lock,
    tag: "Privacy",
    title: "Private by default",
    body: "Your files are only searchable by you. Nothing is shared, and you can delete a document any time.",
    tone: "bg-paper text-ink",
  },
  {
    icon: BookOpenCheck,
    tag: "Practice",
    title: "Practise what you learned",
    body: "Turn any chapter into quick questions and check your understanding against the source.",
    tone: "bg-ink text-cream",
  },
  {
    icon: ScrollText,
    tag: "Focus",
    title: "Summaries that keep context",
    body: "Get the shape of a chapter in seconds, with each point still tied to where it appears.",
    tone: "bg-amber text-ink",
  },
  {
    icon: Brain,
    tag: "Memory",
    title: "A workspace that remembers",
    body: "Pick up your thinking right where you left it, with previous questions and sources kept together.",
    tone: "bg-paper text-ink",
  },
];

export default function FeatureSlider() {
  return (
    <section className="overflow-hidden bg-sage py-16 text-ink sm:py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <div className="flex flex-col justify-between gap-5 sm:gap-6 md:flex-row md:items-end">
          <Reveal className="min-w-0">
            <p className="font-mono text-xs tracking-[0.2em] text-emerald uppercase">Inside the workspace</p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,5vw,4rem)] leading-[0.95] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5 sm:text-[clamp(2.25rem,5vw,4rem)]">
              Built for the way you actually study.
            </h2>
          </Reveal>
          <Reveal delay={100} className="min-w-0">
            <p className="max-w-sm text-sm leading-relaxed text-pretty text-ink/60 sm:text-base">
              Explore the dedicated tools and intelligent capabilities waiting inside your workspace.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-10 min-w-0 sm:mt-14" delay={150}>
          <CardSlider
            label="Upolabdhi features"
            items={FEATURES}
            renderCard={(f) => {
              const Icon = f.icon;
              return (
                <article
                  className={`group flex min-h-[310px] flex-col justify-between rounded-[24px] p-6 transition-transform duration-500 hover:-translate-y-2 sm:h-[380px] sm:rounded-[26px] sm:p-7 ${f.tone} ${
                    f.tone.includes("paper") ? "border border-ink/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl border border-current/20 transition-transform duration-500 group-hover:rotate-[-8deg] sm:size-12">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] font-semibold tracking-[0.2em] uppercase opacity-60">
                      {f.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl leading-tight font-bold tracking-tight sm:text-2xl">{f.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed opacity-70 sm:mt-3 sm:text-[15px]">{f.body}</p>
                  </div>
                </article>
              );
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
