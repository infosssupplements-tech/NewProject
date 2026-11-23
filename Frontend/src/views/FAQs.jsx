import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { useUI } from "../context/UIContext.jsx";

const FAQS = [
  {
    cat: "Basics",
    q: "What is Upolabdhi?",
    a: "Upolabdhi (উপলব্ধি) is a question answering system built on Retrieval-Augmented Generation (RAG). You upload your documents, ask questions in plain language and get answers grounded in — and cited from — your own material.",
  },
  {
    cat: "Basics",
    q: "What does RAG mean?",
    a: "Retrieval-Augmented Generation. Instead of answering from general knowledge, the system first retrieves the most relevant passages from your documents, then a language model writes the answer using only those passages.",
  },
  {
    cat: "Basics",
    q: "How is this different from a normal chatbot?",
    a: "A normal chatbot answers from what it learned during training, which may be outdated or not match your syllabus. Upolabdhi answers from your files and shows you exactly which page each part of the answer came from.",
  },
  {
    cat: "Documents",
    q: "Which file types can I upload?",
    a: "PDFs work best. Word documents, slides and plain text are converted to PDF first so every file is processed the same way.",
  },
  {
    cat: "Documents",
    q: "Is there a size limit?",
    a: "Long documents such as textbooks are supported. Larger files take a little longer to index because every page is parsed, chunked and embedded before you can search it.",
  },
  {
    cat: "Documents",
    q: "Does it understand Bengali?",
    a: "Yes. Upolabdhi is designed for English and বাংলা material, including documents that mix both languages.",
  },
  {
    cat: "Answers",
    q: "How do I know an answer is correct?",
    a: "Every answer includes citations to the pages it used. Click a citation to see the original passage side by side, so you can verify it yourself.",
  },
  {
    cat: "Answers",
    q: "What if the answer isn't in my documents?",
    a: "The assistant will tell you it couldn't find it in your sources rather than guessing. You can then upload more material or rephrase your question.",
  },
  {
    cat: "Privacy",
    q: "Are my documents private?",
    a: "Yes. Your files are only searchable by your account and are never shared with other users. You can delete a document at any time.",
  },
  {
    cat: "Account",
    q: "How do I create an account?",
    a: "Click Workspace or Sign in in the navigation bar, choose Create account, then verify your email address to finish setup.",
  },
];

const CATS = ["All", ...new Set(FAQS.map((f) => f.cat))];

export default function FAQs() {
  const { openChat } = useUI();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) => (cat === "All" || f.cat === cat) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)),
    );
  }, [query, cat]);

  return (
    <>
      <PageHeader eyebrow="FAQs" title="Questions," accent="answered.">
        Everything you need to know about how Upolabdhi reads, retrieves and answers.
      </PageHeader>

      <section className="bg-cream py-20 text-ink md:py-28">
        <div className="mx-auto max-w-4xl px-5 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative md:w-80">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
              <label htmlFor="faq-search" className="sr-only">
                Search questions
              </label>
              <input
                id="faq-search"
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(0);
                }}
                placeholder="Search questions"
                className="h-12 w-full rounded-full border border-ink/12 bg-white pr-4 pl-11 text-sm outline-none focus:border-emerald focus:ring-4 focus:ring-emerald/10 focus-visible:outline-none"
              />
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by category">
              {CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cat === c}
                  onClick={() => {
                    setCat(c);
                    setOpen(0);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    cat === c ? "bg-ink text-cream" : "bg-white text-ink/65 hover:text-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {results.map((f, i) => {
              const isOpen = open === i;
              const id = `faq-${f.q.replace(/\W+/g, "-")}`;
              return (
                <li key={f.q}>
                  <h2>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={id}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="group flex w-full items-center gap-5 py-6 text-left"
                    >
                      <span className="hidden w-20 shrink-0 font-mono text-[11px] tracking-wider text-ink/40 uppercase sm:block">
                        {f.cat}
                      </span>
                      <span className="flex-1 text-lg font-semibold tracking-tight transition-colors group-hover:text-emerald md:text-xl">
                        {f.q}
                      </span>
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                          isOpen ? "rotate-45 border-ink bg-ink text-cream" : "border-ink/15"
                        }`}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </span>
                    </button>
                  </h2>
                  <div
                    id={id}
                    role="region"
                    className={`grid transition-[grid-template-rows] duration-400 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl pb-7 leading-relaxed text-ink/65 sm:pl-25">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {results.length === 0 && (
            <p className="py-16 text-center text-ink/55">No questions match &ldquo;{query}&rdquo;. Try the assistant instead.</p>
          )}

          <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[26px] bg-ink p-8 text-cream md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Still curious?</h2>
              <p className="mt-1 text-cream/60">The assistant can answer anything else about Upolabdhi.</p>
            </div>
            <button
              type="button"
              onClick={() => openChat(query)}
              className="h-12 rounded-xl bg-mint px-6 font-semibold text-ink transition-colors hover:bg-mint-soft"
            >
              Ask the assistant
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
