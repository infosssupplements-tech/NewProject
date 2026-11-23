import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import { useUI } from "../context/UIContext.jsx";

export default function Footer() {
  const { openWorkspace, openChat } = useUI();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-ink text-cream">
      <div className="grid-lines absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 size-96 rounded-full bg-mint/5 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-5 sm:pt-16 sm:pb-12 md:px-8 md:pt-20">
        <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Purpose Column */}
          <div className="min-w-0 lg:col-span-5">
            <Logo tone="dark" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/65 text-pretty md:text-base">
              A retrieval-augmented intelligent question answering system that reads your documents, extracts
              knowledge, and delivers grounded answers with citations right beside them.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="flex size-2 shrink-0 rounded-full bg-mint animate-pulse" />
              <span className="font-mono text-xs text-cream/50">
                System Active · RAG Engine v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links Grid */}
          <nav aria-label="Footer" className="grid min-w-0 grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div className="min-w-0">
              <h3 className="font-mono text-[11px] font-semibold tracking-[0.2em] text-cream/45 uppercase">
                Product
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={openWorkspace}
                    className="text-cream/70 transition-colors hover:text-mint"
                  >
                    Workspace
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openChat()}
                    className="text-cream/70 transition-colors hover:text-mint"
                  >
                    Ask the assistant
                  </button>
                </li>
                <li>
                  <Link to="/faqs" className="text-cream/70 transition-colors hover:text-mint">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <h3 className="font-mono text-[11px] font-semibold tracking-[0.2em] text-cream/45 uppercase">
                Project
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/about" className="text-cream/70 transition-colors hover:text-mint">
                    About us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-cream/70 transition-colors hover:text-mint">
                    Contact us
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:upolabdhi6@gmail.com"
                    className="text-cream/70 transition-colors hover:text-mint"
                  >
                    Support Email
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <h3 className="font-mono text-[11px] font-semibold tracking-[0.2em] text-cream/45 uppercase">
                Account
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/login" className="text-cream/70 transition-colors hover:text-mint">
                    Log in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-cream/70 transition-colors hover:text-mint">
                    Sign up
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Clean bottom bar (Oversized Bengali text removed) */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-center font-mono text-[11px] text-cream/45 sm:mt-16 sm:flex-row sm:text-left sm:text-xs">
          <p>© {year} উপলব্ধি · Upolabdhi. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end sm:gap-6">
            <span>Private by default</span>
            <span className="hidden sm:inline">·</span>
            <span>Grounded Intelligence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
