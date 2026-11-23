import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-mint text-ink hover:bg-mint-soft shadow-[0_10px_40px_-12px_rgba(95,242,176,0.6)]",
  dark: "bg-ink text-cream hover:bg-ink-3",
  outline: "border border-current/25 hover:border-current hover:bg-current/5",
  ghost: "hover:bg-current/10",
};

const SIZES = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-7 text-base",
};

export default function Button({
  to,
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const classes = `group inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-300 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
