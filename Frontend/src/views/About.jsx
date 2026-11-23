import { Database, Sparkles, Search, Eye, HeartHandshake, Lock, ArrowUpRight } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import Reveal from "../components/Reveal.jsx";

const RAG = [
  {
    icon: Search,
    letter: "R",
    title: "Retrieve",
    body: "Your question is turned into a vector and compared with every passage in your documents. The closest matches are pulled out.",
  },
  {
    icon: Database,
    letter: "A",
    title: "Augment",
    body: "Those passages are placed next to your question as context, with clear instructions to answer only from them.",
  },
  {
    icon: Sparkles,
    letter: "G",
    title: "Generate",
    body: "A language model writes a clear, direct answer — and cites the pages it used so you can check every claim.",
  },
];

const TEAM_MEMBERS = [
  {
    name: "KAUSHIK DAS",
    role: "Core Contributor",
    github: "https://github.com/amiKaushik",
    photo: "/assets/aistudio/KAUSHIK_DAS_de7812b1.jpg",
  },
  {
    name: "ARPAN PATRA",
    role: "Core Contributor",
    github: "https://github.com/arpanpatra7047283086",
    photo: "/assets/aistudio/ARPAN_PATRA_09fa8324.jpeg",
  },
  {
    name: "LOKENATH BANERJEE",
    role: "Core Contributor",
    github: "https://github.com/LokenathBanerjee",
    photo: "/assets/aistudio/LOKENATH_BANERJEE_1b8bf795.jpg",
  },
  {
    name: "INDRANIL BARUA BETAL",
    role: "Core Contributor",
    github: "https://github.com/IndranilBarua15",
    photo: "/assets/aistudio/INDRANIL_BARUA_BETAL_95afa5a3.jpg",
  },
];

const VALUES = [
  { icon: Eye, title: "Show the source", body: "An answer you can't check isn't an answer. Citations are never optional." },
  { icon: Lock, title: "Private by default", body: "Your documents are yours. They're only ever searched on your behalf." },
  { icon: HeartHandshake, title: "Help you think", body: "We'd rather you understand one idea deeply than skim a hundred." },
];

export default function About() {
  return (
    <>
      <PageHeader eyebrow="About us" title="We build tools for" accent="understanding more.">
        <span className="font-bangla font-semibold text-cream">উপলব্ধি</span> (Upolabdhi) means
        &ldquo;realisation&rdquo; — the moment something finally makes sense. We&apos;re building a question answering
        system that helps you reach that moment faster, using your own material.
      </PageHeader>

      {/* Mission Section */}
      <section className="overflow-hidden bg-cream py-16 text-ink sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-12">
            <Reveal className="min-w-0 lg:col-span-5">
              <p className="font-mono text-xs tracking-[0.2em] text-emerald uppercase">Our mission</p>
              <h2 className="mt-4 text-[clamp(1.9rem,4.5vw,3.5rem)] leading-[0.98] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5">
                Search finds words. We want you to find <span className="text-emerald">meaning.</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="min-w-0 space-y-5 text-base leading-relaxed text-ink/65 sm:text-lg lg:col-span-6 lg:col-start-7">
              <p>
                Students spend hours scrolling through PDFs looking for one paragraph. Generic chatbots answer
                confidently — but not from the textbook your exam is based on.
              </p>
              <p>
                Upolabdhi sits in between. It uses Retrieval-Augmented Generation to read only what you give it, find
                the right passages and explain them in plain language, always with the source attached.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* RAG Explanation */}
      <section className="overflow-hidden bg-ink-2 py-16 text-cream sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <Reveal className="min-w-0">
            <p className="font-mono text-xs tracking-[0.2em] text-mint uppercase">How RAG works</p>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.9rem,4.5vw,3.5rem)] leading-[0.98] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5">
              Three steps between your question and a trustworthy answer.
            </h2>
          </Reveal>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:mt-14 md:grid-cols-3">
            {RAG.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={i * 120}
                  className="group relative min-w-0 overflow-hidden rounded-[26px] border border-cream/10 bg-ink p-6 transition-colors hover:border-mint/40 sm:p-8"
                >
                  <span
                    className="pointer-events-none absolute -top-6 -right-2 text-[10rem] leading-none font-bold text-cream/[0.04] transition-colors group-hover:text-mint/10"
                    aria-hidden="true"
                  >
                    {step.letter}
                  </span>
                  <span className="grid size-12 place-items-center rounded-2xl bg-mint text-ink">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold tracking-tight sm:mt-8 sm:text-2xl">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-cream/60 sm:mt-3 sm:text-base">{step.body}</p>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Core Values */}
      <section className="overflow-hidden bg-sage py-16 text-ink sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <Reveal>
            <p className="font-mono text-xs tracking-[0.2em] text-emerald uppercase">What we believe</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[26px] border border-ink/10 bg-ink/10 sm:mt-10 md:grid-cols-3">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.title} delay={i * 100} className="min-w-0 bg-paper p-6 sm:p-8">
                  <Icon className="size-6 text-emerald" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-bold tracking-tight sm:mt-6">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60 sm:text-base">{v.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Redesigned Team Section */}
      <section className="overflow-hidden bg-cream py-16 text-ink sm:py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-5 sm:gap-6 md:flex-row md:items-end">
              <div className="min-w-0">
                <p className="font-mono text-xs tracking-[0.2em] text-emerald uppercase">Our Team</p>
                <h2 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5">
                  United by curiosity and <span className="text-emerald">deep collaboration.</span>
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-ink/65 sm:text-base md:text-lg">
                We are a passionate team dedicated to making document intelligence seamless, accurate, and accessible.
                Every layer of উপলব্ধি represents our coordinated commitment to grounded question answering.
              </p>
            </div>
          </Reveal>

          {/* 4 Team Member Cards */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {TEAM_MEMBERS.map((member, i) => (
              <Reveal key={member.name} delay={i * 100} className="min-w-0">
                <div className="group relative flex flex-col overflow-hidden rounded-[26px] border border-ink/10 bg-white p-4 shadow-[0_12px_30px_-10px_rgba(7,17,14,0.12)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-15px_rgba(15,118,80,0.22)]">
                  {/* Photo Container with subtle shadow effect */}
                  <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-2xl bg-ink/5 shadow-[0_8px_20px_-6px_rgba(7,17,14,0.18)]">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="size-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  {/* Member Details */}
                  <div className="mt-5 flex flex-col px-2 pb-1">
                    <h3 className="font-mono text-base font-bold tracking-tight text-ink md:text-lg uppercase">
                      {member.name}
                    </h3>

                    {/* Clickable GitHub Profile Link */}
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-between rounded-xl border border-ink/10 bg-cream/50 px-3.5 py-2 font-mono text-xs font-semibold text-ink/80 transition-all hover:border-emerald hover:bg-emerald hover:text-cream"
                      aria-label={`${member.name}'s GitHub Profile`}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.59 2 12.253c0 4.53 2.865 8.372 6.839 9.73.5.096.682-.223.682-.495 0-.244-.009-.889-.014-1.744-2.782.62-3.369-1.374-3.369-1.374-.455-1.188-1.11-1.505-1.11-1.505-.908-.637.069-.624.069-.624 1.003.073 1.531 1.058 1.531 1.058.892 1.57 2.341 1.116 2.91.853.091-.664.35-1.117.636-1.374-2.22-.26-4.555-1.14-4.555-5.074 0-1.12.39-2.034 1.03-2.752-.103-.26-.447-1.304.098-2.717 0 0 .84-.276 2.75 1.05A9.3 9.3 0 0 1 12 6.94c.85.004 1.705.118 2.504.35 1.91-1.326 2.748-1.05 2.748-1.05.547 1.413.203 2.457.1 2.717.64.718 1.028 1.632 1.028 2.752 0 3.944-2.339 4.81-4.566 5.065.359.32.679.948.679 1.91 0 1.38-.012 2.493-.012 2.833 0 .275.18.596.688.494C19.17 20.62 22 16.78 22 12.253 22 6.59 17.523 2 12 2Z" clipRule="evenodd" />
                        </svg>
                        <span>GitHub</span>
                      </span>
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
