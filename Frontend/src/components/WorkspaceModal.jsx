import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Check, X } from "lucide-react";
import { useUI } from "../context/UIContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const POINTS = ["Upload study files", "Ask grounded questions", "See the source beside every answer"];

export default function WorkspaceModal() {
  const { workspaceOpen, closeWorkspace } = useUI();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (workspaceOpen && !dialog.open) dialog.showModal();
    if (!workspaceOpen && dialog.open) dialog.close();
  }, [workspaceOpen]);

  const go = (path) => {
    closeWorkspace();
    navigate(path);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={closeWorkspace}
      onClick={(e) => e.target === dialogRef.current && closeWorkspace()}
      aria-labelledby="workspace-title"
      className="m-auto w-[min(92vw,640px)] overflow-visible bg-transparent p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-md"
    >
      {workspaceOpen && (
        <div className="pop-in relative overflow-hidden rounded-[28px] bg-paper p-7 text-ink shadow-2xl sm:p-12">
          <div
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-mint/40 blur-3xl"
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={closeWorkspace}
            aria-label="Close"
            className="absolute top-5 right-5 grid size-10 place-items-center rounded-full border border-ink/10 bg-paper transition-colors hover:bg-ink hover:text-cream"
          >
            <X className="size-4" />
          </button>
          <p className="relative font-mono text-[11px] tracking-[0.22em] text-ink/50 uppercase">A quick look</p>
          <h2
            id="workspace-title"
            className="relative mt-5 text-4xl leading-[1] font-bold tracking-[-0.04em] sm:text-6xl"
          >
            One workspace.
            <span className="block text-emerald">Less friction.</span>
          </h2>
          <p className="relative mt-6 max-w-md text-pretty text-ink/60">
            Bring in your material, ask a question and keep the source beside the answer.
          </p>
          <ul className="relative mt-7 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-ink/75">
                <Check className="size-4 text-emerald" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
          <div className="relative mt-9 flex flex-wrap items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => go("/workspace")}
                className="group inline-flex h-13 items-center gap-3 rounded-xl bg-ink px-6 py-4 font-semibold text-cream transition-colors hover:bg-emerald"
              >
                Open my workspace
                <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => go("/login")}
                  className="group inline-flex items-center gap-3 rounded-xl bg-ink px-6 py-4 font-semibold text-cream transition-colors hover:bg-emerald"
                >
                  Try Upolabdhi
                  <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go("/register")}
                  className="rounded-xl px-5 py-4 font-semibold text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
