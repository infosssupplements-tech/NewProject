import { Link } from "react-router-dom";

export function LogoWordmark({ tone = "dark", className = "" }) {
  const restColor = tone === "light" ? "#07110e" : "#fffaf0";

  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap font-bangla ${className}`}
      aria-label="উপলব্ধি"
    >
      <span className="text-[#5ff2b0]">উ</span>
      <span style={{ color: restColor }}>পলব্ধি</span>
    </span>
  );
}

export function LogoMark({ className = "", tone = "dark" }) {
  return <LogoWordmark tone={tone} className={className} />;
}

export default function Logo({ tone = "dark", to = "/", subtitle = true, onClick }) {
  const subColor = tone === "dark" ? "text-cream/60" : "text-ink/60";

  return (
    <Link
      to={to}
      onClick={onClick}
      className="group inline-flex select-none flex-col leading-none"
      aria-label="উপলব্ধি Upolabdhi — RAG Intelligent Question Answering"
    >
      <LogoWordmark
        tone={tone}
        className="text-[26px] font-bold leading-none tracking-tight transition-opacity duration-300 group-hover:opacity-85 md:text-[30px]"
      />
      {subtitle && (
        <span className={`mt-1 font-mono text-[9px] font-medium tracking-[0.22em] uppercase md:text-[10px] ${subColor}`}>
          Understand more
        </span>
      )}
    </Link>
  );
}
