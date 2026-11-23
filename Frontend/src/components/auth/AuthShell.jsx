import { Link, useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import Logo from "../Logo.jsx";

export default function AuthShell({ mode, children }) {
  const navigate = useNavigate();
  const tabs = [
    { to: "/login", label: "LOG IN", key: "login" },
    { to: "/register", label: "SIGN UP", key: "register" },
  ];

  return (
    <section className="grain relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-4 pt-24 pb-12 sm:py-16 md:px-6 md:py-20">
      <div className="grid-lines absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute top-1/4 left-1/3 size-[480px] rounded-full bg-mint/10 blur-[110px]"
        aria-hidden="true"
      />

      {/* Balanced, refined modal container */}
      <div className="pop-in relative mx-auto w-full max-w-4xl min-w-0 overflow-hidden rounded-[24px] bg-paper shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] md:grid md:grid-cols-[0.85fr_1.15fr]">
        {/* Left Decorative Sidebar */}
        <aside className="relative flex min-w-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#eaf6f0] via-sage to-[#c3ebd7] p-6 sm:p-8 md:p-9">
          <div
            className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full border border-emerald/20"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-8 -bottom-8 size-44 rounded-full border border-emerald/15"
            aria-hidden="true"
          />

          <Logo tone="light" />

          <div className="relative my-6 sm:my-8 md:my-0">
            <p className="font-mono text-[10px] tracking-[0.22em] text-ink/50 uppercase">
              RAG Intelligent Platform
            </p>
            <p className="mt-2.5 text-2xl font-bold tracking-tight text-ink sm:mt-3 sm:text-3xl md:text-4xl leading-[1.05]">
              Make space for the <span className="block text-emerald">good questions.</span>
            </p>
            <p className="mt-2.5 text-xs leading-relaxed text-ink/65 sm:mt-3 sm:text-sm">
              Upload your documents and let Upolabdhi find the exact answers with verifiable citations.
            </p>
          </div>

          <div className="relative flex items-center gap-2 font-mono text-[11px] text-ink/60">
            <span className="grid size-4 shrink-0 place-items-center rounded bg-emerald/20 text-emerald">
              <Check className="size-2.5" aria-hidden="true" />
            </span>
            <span>Private & encrypted by default</span>
          </div>
        </aside>

        {/* Right Form Container */}
        <div className="relative min-w-0 p-6 sm:p-8 md:p-9">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Close and return home"
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-4" />
          </button>

          {/* Navigation Tabs */}
          <nav aria-label="Account" className="flex gap-6 border-b border-ink/10">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                to={tab.to}
                aria-current={mode === tab.key ? "page" : undefined}
                className={`relative -mb-px pb-2.5 font-mono text-xs font-bold tracking-wider transition-colors ${
                  mode === tab.key ? "text-ink" : "text-ink/40 hover:text-ink/70"
                }`}
              >
                {tab.label}
                <span
                  className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-emerald transition-transform duration-300 ${
                    mode === tab.key ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div key={mode} className="fade-in mt-6">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
