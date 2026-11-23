import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowUpRight, ChevronDown, LogOut, Menu, MessageCircle, X } from "lucide-react";
import Logo from "./Logo.jsx";
import { useUI } from "../context/UIContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getProfile } from "../Actions/ProfileAction.js";

const ABOUT_LINKS = [
  { to: "/about", label: "About us", hint: "Mission and how RAG works" },
  { to: "/contact", label: "Contact us", hint: "Questions, feedback, partnerships" },
];

const linkBase =
  "relative rounded-full px-4 py-2 text-[15px] font-medium tracking-tight transition-colors duration-200";

function navClass({ isActive }) {
  return `${linkBase} ${isActive ? "text-cream" : "text-cream/65 hover:text-cream"}`;
}

export default function Navbar() {
  const { openWorkspace, openChat } = useUI();
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState("");
  const aboutRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getProfile()
      .then((profile) => {
        const avatar = profile?.avatar;
        if (active) setProfileAvatar(typeof avatar === "string" ? avatar : avatar?.secure_url || avatar?.url || "");
      })
      .catch(() => {});
    const onAvatarUpdated = (event) => {
      const avatar = event.detail?.avatar;
      setProfileAvatar(typeof avatar === "string" ? avatar : avatar?.secure_url || avatar?.url || "");
    };
    window.addEventListener("upolabdhi-avatar-updated", onAvatarUpdated);
    return () => {
      active = false;
      window.removeEventListener("upolabdhi-avatar-updated", onAvatarUpdated);
    };
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAboutOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!aboutOpen) return;
    const onClick = (e) => {
      if (!aboutRef.current?.contains(e.target)) setAboutOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setAboutOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [aboutOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  const aboutActive = pathname === "/about" || pathname === "/contact";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
      <nav
        aria-label="Primary"
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-3 py-2 transition-all duration-500 md:px-4 ${
          scrolled || mobileOpen
            ? "border border-cream/10 bg-ink/75 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            : "border border-transparent"
        }`}
      >
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          <li>
            <NavLink to="/" end className={navClass}>
              Home
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              onClick={openWorkspace}
              className={`${linkBase} flex items-center gap-2 ${
                pathname === "/workspace" ? "text-cream" : "text-cream/65 hover:text-cream"
              }`}
            >
              Workspace
              <span className="rounded-md bg-cream px-1.5 py-0.5 text-[10px] font-bold leading-none text-ink">
                New
              </span>
            </button>
          </li>
          <li className="relative" ref={aboutRef}>
            <button
              type="button"
              aria-expanded={aboutOpen}
              aria-haspopup="true"
              aria-controls="about-menu"
              onClick={() => setAboutOpen((v) => !v)}
              className={`${linkBase} flex items-center gap-1 ${
                aboutActive ? "text-cream" : "text-cream/65 hover:text-cream"
              }`}
            >
              About
              <ChevronDown
                className={`size-4 transition-transform duration-300 ${aboutOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {aboutOpen && (
              <div
                id="about-menu"
                className="pop-in absolute left-1/2 top-full mt-3 w-72 -translate-x-1/2 rounded-2xl border border-cream/10 bg-ink-2/95 p-2 shadow-2xl backdrop-blur-xl"
              >
                {ABOUT_LINKS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-start justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-cream/5"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-cream">{item.label}</span>
                      <span className="mt-0.5 block text-xs text-cream/50">{item.hint}</span>
                    </span>
                    <ArrowUpRight
                      className="mt-0.5 size-4 text-cream/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-mint"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li>
            <NavLink to="/faqs" className={navClass}>
              FAQs
            </NavLink>
          </li>
        </ul>

        <div className="flex items-center gap-2.5">
          {user ? (
            <div ref={profileRef} className="relative hidden sm:block">
              <button
                type="button"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((value) => !value)}
                className="flex items-center gap-3 rounded-full bg-ink/80 py-1.5 pr-2 pl-1.5 text-left text-cream transition-colors hover:bg-ink"
              >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-mint text-sm font-bold text-ink">
                  {profileAvatar
                    ? <img className="size-full object-cover" src={profileAvatar} alt="" />
                    : (user?.name || user?.email || "U").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <strong className="block max-w-36 truncate text-sm leading-tight">{user?.name || "Your account"}</strong>
                  <small className="mt-1 block text-[11px] text-cream/55">Product workspace</small>
                </span>
                <ChevronDown className={`mr-1 size-4 text-cream/60 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && (
                <div className="pop-in absolute right-0 top-full mt-3 w-56 rounded-2xl border border-cream/10 bg-ink-2/95 p-2 shadow-2xl backdrop-blur-xl">
                  <Link to="/" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-cream hover:bg-cream/5">Home</Link>
                  <Link to="/workspace" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-cream hover:bg-cream/5">Dashboard</Link>
                  <Link to="/workspace#profile" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-cream hover:bg-cream/5">Profile</Link>
                  <Link to="/workspace#settings" onClick={() => setProfileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm text-cream hover:bg-cream/5">Settings</Link>
                  <button type="button" onClick={() => { setProfileOpen(false); signOut(); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-cream/5"><LogOut className="size-4" /> Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden items-center rounded-full border border-cream/25 px-4 py-2 font-mono text-xs font-bold tracking-wider text-cream transition-all hover:border-mint hover:text-mint sm:inline-flex uppercase"
              >
                LOG IN
              </Link>
              <Link
                to="/register"
                className="hidden items-center rounded-full bg-cream px-4 py-2 font-mono text-xs font-bold tracking-wider text-ink transition-all hover:bg-mint active:scale-95 sm:inline-flex uppercase"
              >
                SIGN UP
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-full border border-cream/15 text-cream lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-menu"
          className="fade-in mx-auto mt-2 max-w-7xl rounded-2xl border border-cream/10 bg-ink/95 p-4 backdrop-blur-xl lg:hidden"
        >
          <ul className="flex flex-col">
            {[
              { to: "/", label: "Home" },
              { action: openWorkspace, label: "Workspace", badge: true },
              { to: "/about", label: "About us" },
              { to: "/contact", label: "Contact us" },
              { to: "/faqs", label: "FAQs" },
            ].map((item, i) => (
              <li
                key={item.label}
                className="pop-in border-b border-cream/10 last:border-none"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {item.to ? (
                  <Link
                    to={item.to}
                    className="flex items-center justify-between py-4 text-2xl font-semibold tracking-tight text-cream"
                  >
                    {item.label}
                    <ArrowUpRight className="size-5 text-cream/40" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      item.action();
                    }}
                    className="flex w-full items-center justify-between py-4 text-left text-2xl font-semibold tracking-tight text-cream"
                  >
                    <span className="flex items-center gap-2">
                      {item.label}
                      <span className="rounded-md bg-cream px-1.5 py-0.5 text-[10px] font-bold text-ink">New</span>
                    </span>
                    <ArrowUpRight className="size-5 text-cream/40" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="col-span-2 rounded-full bg-cream py-3 text-center text-sm font-semibold text-ink transition-colors hover:bg-mint"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-full border border-cream/25 py-3 font-mono text-xs font-bold tracking-wider text-cream transition-colors hover:border-mint hover:text-mint uppercase"
                >
                  LOG IN
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-full bg-cream py-3 text-center font-mono text-xs font-bold tracking-wider text-ink transition-colors hover:bg-mint uppercase"
                >
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
