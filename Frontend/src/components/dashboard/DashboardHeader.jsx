import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { LogoWordmark } from "../Logo.jsx";
import { getProfile } from "../../Actions/ProfileAction.js";

const DASHBOARD_NAV_ITEMS = ["Home", "Dashboard", "Documents", "Ask উপলব্ধি"];

const getAvatarUrl = (avatar) => {
  if (typeof avatar === "string") return avatar;
  return avatar?.secure_url || avatar?.url || avatar?.src || "";
};

export default function DashboardHeader({ onNavigate, activeView = "Dashboard", user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => getAvatarUrl(user?.avatar));
  const headerRef = useRef(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((profile) => {
        if (active) setAvatarUrl(getAvatarUrl(profile?.avatar));
      })
      .catch(() => {});

    const updateAvatar = (event) => {
      setAvatarUrl(getAvatarUrl(event.detail?.avatar));
    };
    window.addEventListener("upolabdhi-avatar-updated", updateAvatar);
    return () => {
      active = false;
      window.removeEventListener("upolabdhi-avatar-updated", updateAvatar);
    };
  }, []);

  useEffect(() => {
    const closeMenus = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const navigate = (view) => {
    setMenuOpen(false);
    setProfileOpen(false);
    onNavigate(view);
  };

  return (
    <header className="dashboard-header" ref={headerRef}>
      <button
        className="dashboard-mobile-menu"
        type="button"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        aria-controls="dashboard-mobile-navigation"
        onClick={() => setMenuOpen((value) => !value)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <button className="dashboard-brand" type="button" onClick={() => navigate("Dashboard")}>
        <span>
          <LogoWordmark className="dashboard-brand-wordmark" tone="workspace" />
          <small>Understand more</small>
        </span>
      </button>

      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <button
            key={item}
            type="button"
            className={activeView === item ? "active" : ""}
            onClick={() => navigate(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="dashboard-header-tools">
        <div className="dashboard-popover-wrap">
          <button
            className="dashboard-icon-button"
            type="button"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-controls="dashboard-notifications"
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setProfileOpen(false);
            }}
          >
            <Bell size={19} />
            <span className="dashboard-notification-dot" />
          </button>
          {notificationsOpen && (
            <div id="dashboard-notifications" className="dashboard-popover dashboard-notifications">
              <strong>Notifications</strong>
              <div className="dashboard-notification unread">
                <b>Support knowledge base is processing</b>
                <span>12 minutes ago</span>
              </div>
              <div className="dashboard-notification unread">
                <b>Customer research is ready to query</b>
                <span>Yesterday at 4:10 PM</span>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-popover-wrap">
          <button
            className="dashboard-profile"
            type="button"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotificationsOpen(false);
            }}
          >
            <span className="dashboard-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="" />
                : (user?.name || user?.email || "U").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
            </span>
            <span className="dashboard-profile-copy">
              <strong>{user?.name || user?.email || "User"}</strong>
              <small>Product workspace</small>
            </span>
            <ChevronDown size={15} />
          </button>
          {profileOpen && (
            <div className="dashboard-popover dashboard-profile-menu">
              <strong>Your account</strong>
              <button type="button" onClick={() => navigate("Home")}>Home</button>
              <button type="button" onClick={() => navigate("Profile")}>Profile</button>
              <button type="button" onClick={() => navigate("Settings")}>Settings</button>
              <button type="button" onClick={() => navigate("Help")}>Help &amp; support</button>
              <button className="dashboard-signout" type="button" onClick={() => navigate("Sign out")}>Sign out</button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav id="dashboard-mobile-navigation" className="dashboard-mobile-nav" aria-label="Mobile dashboard navigation">
          {DASHBOARD_NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              className={activeView === item ? "active" : ""}
              onClick={() => navigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
