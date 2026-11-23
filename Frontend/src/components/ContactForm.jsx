import { useState } from "react";
import { ArrowUpRight, Check, Copy, Mail, MessageCircle } from "lucide-react";
import Field from "./auth/Field.jsx";
import { useUI } from "../context/UIContext.jsx";

export const CONTACT_EMAIL = "upolabdhi6@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = ["General question", "Feedback", "Bug report", "Partnership", "Account help"];

export default function ContactForm() {
  const { openChat } = useUI();
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email so we can reply.";
    if (form.message.trim().length < 10) next.message = "Tell us a little more (at least 10 characters).";
    setErrors(next);
    if (Object.keys(next).length) return;

    const subject = `[${form.topic}] from ${form.name.trim()}`;
    const body = `${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="min-w-0 lg:col-span-5">
        <p className="font-mono text-xs tracking-[0.2em] text-emerald uppercase">Get in touch</p>
        <h2 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] leading-[0.95] font-bold tracking-[-0.045em] text-balance break-words sm:mt-5">
          Questions, ideas or <span className="text-emerald">feedback?</span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-pretty text-ink/60 sm:mt-6 sm:text-base">
          We read every message. Write to us directly, or send the form and it&apos;ll open in your email app ready to
          go.
        </p>

        <div className="mt-8 space-y-3 sm:mt-10">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 pr-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-ink text-mint">
              <Mail className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink/50">Email us</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="block font-semibold break-all text-ink hover:text-emerald sm:text-lg">
                {CONTACT_EMAIL}
              </a>
            </div>
            <button
              type="button"
              onClick={copy}
              aria-label="Copy email address"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-ink/10 text-ink/60 transition-colors hover:bg-ink hover:text-cream"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => openChat()}
            className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3 text-left transition-colors hover:border-emerald"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-ink">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-ink/50">Need a quick answer?</span>
              <span className="block font-semibold text-ink">Chat with the assistant</span>
            </span>
            <ArrowUpRight className="size-4 shrink-0 text-ink/40 transition-transform group-hover:rotate-45" aria-hidden="true" />
          </button>
          <p aria-live="polite" className="h-4 font-mono text-[11px] text-emerald">
            {copied ? "Email copied to clipboard" : ""}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="min-w-0 rounded-[28px] border border-ink/10 bg-white p-5 sm:p-9 lg:col-span-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" autoComplete="name" placeholder="Aarav Sen" value={form.name} onChange={set("name")} error={errors.name} />
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
          />
        </div>

        <fieldset className="mt-6">
          <legend className="mb-2 text-xs font-semibold text-ink/70">Topic</legend>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-full border px-3.5 py-2 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald ${
                  form.topic === t ? "border-ink bg-ink text-cream" : "border-ink/15 text-ink/70 hover:border-ink/40"
                }`}
              >
                <input type="radio" name="topic" value={t} checked={form.topic === t} onChange={set("topic")} className="sr-only" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold text-ink/70">
            Message
          </label>
          <textarea
            id="contact-message"
            rows={6}
            value={form.message}
            onChange={set("message")}
            maxLength={3000}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            placeholder="What would you like to know?"
            className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/35 focus:ring-4 focus-visible:outline-none ${
              errors.message ? "border-red-400 focus:ring-red-100" : "border-ink/12 focus:border-emerald focus:ring-emerald/10"
            }`}
          />
          {errors.message && (
            <p id="contact-message-error" className="mt-1.5 text-xs text-red-600">
              {errors.message}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink/45" aria-live="polite">
            {sent ? "Your email app should open with the message ready to send." : "We usually reply within 1–2 days."}
          </p>
          <button
            type="submit"
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-ink px-6 font-semibold text-cream transition-colors hover:bg-emerald"
          >
            Send message
            <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
